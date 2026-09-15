"""Bounded authorized browser scenarios; no arbitrary scripts, installation or real-AT claims."""
import argparse
import importlib.metadata
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import time
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("bugbash_browser_support", ROOT / "browser_support.py")
support = importlib.util.module_from_spec(spec)
spec.loader.exec_module(support)
save, sha256, stamp = support.save, support.sha256, support.stamp
spec = importlib.util.spec_from_file_location("bugbash_browser_policy", ROOT / "browser_policy.py")
policy_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(policy_module)
spec = importlib.util.spec_from_file_location("bugbash_browser_measurements", ROOT / "browser_measurements.py")
measurements = importlib.util.module_from_spec(spec)
spec.loader.exec_module(measurements)
KEYS = {"Tab", "Shift+Tab", "Enter", "Space", "Escape", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"}
ATTRIBUTES = {"aria-invalid", "aria-describedby", "aria-expanded", "aria-selected", "aria-checked", "aria-modal", "tabindex", "id"}


def locator_spec(value):
    if not isinstance(value, dict):
        raise ValueError("Locator must be a typed object")
    if set(value) == {"css"}:
        if not isinstance(value["css"], str) or not re.fullmatch(r"#[A-Za-z][A-Za-z0-9_-]{0,100}", value["css"]):
            raise ValueError("CSS locators are limited to one exact element ID")
    elif set(value) == {"role", "name"}:
        if not isinstance(value["role"], str) or value["role"] not in {"button", "textbox", "dialog", "heading", "link", "checkbox", "radio", "combobox", "option"}:
            raise ValueError("Unsupported locator role")
        if not isinstance(value["name"], str) or not 0 < len(value["name"]) <= 256:
            raise ValueError("Locator name must be bounded")
    else:
        raise ValueError("Expected an exact ID or role/name locator")


def validate_request(value):
    if not isinstance(value, dict) or set(value) != {"schemaVersion", "taskId", "target", "rows", "budgetSeconds", "viewport"}:
        raise ValueError("Unexpected browser request fields")
    if type(value["schemaVersion"]) is not int or value["schemaVersion"] != 1:
        raise ValueError("Unsupported browser request version")
    if not isinstance(value["taskId"], str) or not re.fullmatch(r"[a-z][a-z0-9-]{2,79}", value["taskId"]):
        raise ValueError("Invalid task ID")
    if not isinstance(value["target"], str) or len(value["target"]) > 2048:
        raise ValueError("Invalid bounded browser target")
    target = urlsplit(value["target"])
    if target.scheme != "https" or not target.hostname or target.username or target.password or target.fragment:
        raise ValueError("Browser target must be credential-free HTTPS without a fragment")
    if type(value["budgetSeconds"]) is not int or not 1 <= value["budgetSeconds"] <= 180:
        raise ValueError("Browser execution budget must be 1-180 seconds")
    viewport = value["viewport"]
    if (not isinstance(viewport, dict) or set(viewport) != {"width", "height"} or
            any(type(viewport[key]) is not int or not 320 <= viewport[key] <= 1920 for key in viewport)):
        raise ValueError("Invalid bounded viewport")
    rows = value["rows"]
    if not isinstance(rows, list) or not 1 <= len(rows) <= 30:
        raise ValueError("Browser request needs 1-30 rows")
    ids = set()
    for row in rows:
        fields = {"id", "steps", "assertions"}
        if isinstance(row, dict) and "inspection" in row:
            fields.add("inspection")
            if row["inspection"] is not True:
                raise ValueError("Document inspection must be explicitly true")
        if not isinstance(row, dict) or set(row) != fields:
            raise ValueError("Unexpected browser row fields")
        if not isinstance(row["id"], str) or not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}", row["id"]) or row["id"] in ids:
            raise ValueError("Invalid or duplicate browser row ID")
        ids.add(row["id"])
        if not isinstance(row["steps"], list) or not 0 <= len(row["steps"]) <= 30:
            raise ValueError("Invalid step budget")
        for step in row["steps"]:
            if not isinstance(step, dict):
                raise ValueError("Step must be an object")
            action = step.get("action")
            if action == "press" and set(step) == {"action", "key"}:
                if not isinstance(step["key"], str) or step["key"] not in KEYS:
                    raise ValueError("Unsupported browser key; no OS shortcuts")
            elif action == "click" and set(step) == {"action", "target"}:
                locator_spec(step["target"])
            elif action == "fill" and set(step) == {"action", "target", "value"}:
                locator_spec(step["target"])
                if not isinstance(step["value"], str) or len(step["value"]) > 256:
                    raise ValueError("Fill input is too large")
            else:
                raise ValueError("Unsupported browser action; no scripts or shell commands")
        minimum_assertions = 0 if row.get("inspection") else 1
        if not isinstance(row["assertions"], list) or not minimum_assertions <= len(row["assertions"]) <= 20:
            raise ValueError("Every row requires bounded assertions")
        for assertion in row["assertions"]:
            if not isinstance(assertion, dict):
                raise ValueError("Assertion must be an object")
            kind = assertion.get("kind")
            fields = {"kind", "target", "expected"} | ({"attribute"} if kind == "attribute" else
                                                       {"minimum"} if kind == "target-size" else set())
            if set(assertion) != fields or kind not in {"focused", "visible", "count", "text", "attribute",
                                                       "target-size", "axe-violations"}:
                raise ValueError("Unsupported typed assertion")
            locator_spec(assertion["target"])
            expected = assertion["expected"]
            if kind in {"focused", "visible", "target-size"} and type(expected) is not bool:
                raise ValueError("Visibility/focus expectations must be booleans")
            if kind == "count" and (type(expected) is not int or not 0 <= expected <= 100):
                raise ValueError("Count expectation must be bounded")
            if kind == "axe-violations" and (type(expected) is not int or not 0 <= expected <= 10000):
                raise ValueError("Scanner violation count expectation must be bounded")
            if kind == "target-size":
                minimum = assertion["minimum"]
                if (not isinstance(minimum, dict) or set(minimum) != {"width", "height"} or
                        any(type(minimum[k]) not in {int, float} or not 1 <= minimum[k] <= 1920 for k in minimum)):
                    raise ValueError("Target size requires bounded minimum CSS-pixel dimensions")
            if kind == "text" and (not isinstance(expected, str) or len(expected) > 4096):
                raise ValueError("Invalid expected text")
            if kind == "attribute" and (assertion["attribute"] not in ATTRIBUTES or
                                        (expected is not None and (not isinstance(expected, str) or len(expected) > 4096))):
                raise ValueError("Unsupported attribute assertion")
    return value


def validate_policy(policy):
    return policy_module.validate(policy)


def locate(page, target):
    return page.locator(target["css"]) if "css" in target else page.get_by_role(target["role"], name=target["name"], exact=True)


def observe(page, assertion, policy=None, timeout_milliseconds=15000):
    target = locate(page, assertion["target"])
    kind = assertion["kind"]
    if kind == "count":
        actual = target.count()
    elif kind == "visible":
        if target.count() > 1:
            raise RuntimeError("Visibility target is ambiguous")
        actual = target.count() == 1 and target.is_visible()
    else:
        if target.count() != 1:
            raise RuntimeError("Assertion target is missing or ambiguous")
        if kind == "target-size":
            geometry = measurements.measure_size(target)
            actual = all(geometry[key] >= assertion["minimum"][key] for key in ("width", "height"))
            return {"assertion": assertion, "actual": actual, "met": actual == assertion["expected"],
                    "measurement": geometry}
        elif kind == "axe-violations":
            result = measurements.scan(page, target, policy or {}, timeout_milliseconds)
            actual = len(result["violations"])
            return {"assertion": assertion, "actual": actual, "met": actual == assertion["expected"],
                    "scanner": result}
        elif kind == "focused":
            actual = target.evaluate("element => element === document.activeElement")
        elif kind == "text":
            actual = target.inner_text()
        else:
            actual = target.get_attribute(assertion["attribute"])
    return {"assertion": assertion, "actual": actual, "met": actual == assertion["expected"]}

def capture_health(page, request, clean):
    closed = page.is_closed()
    state = {} if closed else page.evaluate(
        "() => ({visible: document.visibilityState === 'visible', focused: document.hasFocus()})")
    value = {"timestamp": stamp(), "url": None if closed else page.url,
             "visible": state.get("visible", False), "documentFocused": state.get("focused", False),
             "singlePage": len(page.context.pages) == 1, "viewport": page.viewport_size,
             "noUnexpectedPageState": clean}
    value["verified"] = (not closed and value["url"] == request["target"] and
                         value["visible"] and value["documentFocused"] and value["singlePage"] and
                         value["viewport"] == request["viewport"] and clean)
    return value


def inspect_document(page):
    value = page.evaluate("""() => {
      const elements = document.getElementsByTagName('*');
      const selected = Array.from({length: Math.min(elements.length, 1000)}, (_, i) => elements[i]);
      const indexes = new Map(selected.map((element, index) => [element, index]));
      const names = ['id', 'role', 'lang', 'xml:lang', 'dir', 'alt', 'title', 'type', 'autocomplete',
        'tabindex', 'for', 'scope', 'headers', 'rowspan', 'colspan', 'disabled', 'hidden',
        'required', 'multiple', 'open', 'controls', 'autoplay', 'muted', 'loop'];
      const styleNames = ['display', 'visibility', 'opacity', 'color', 'background-color',
        'font-size', 'font-weight', 'font-family', 'line-height', 'text-decoration-line',
        'outline-style', 'outline-width', 'outline-color', 'overflow-x', 'overflow-y',
        'position', 'clip', 'clip-path'];
      return {schemaVersion: 1, scope: 'raw-document-inspection', url: location.href,
        contentType: document.contentType,
        documentLanguage: document.documentElement.getAttribute('lang') ||
          document.documentElement.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'lang') || '',
        viewport: {width: innerWidth, height: innerHeight}, deviceScale: devicePixelRatio,
        totalElements: elements.length, truncated: elements.length > 1000,
        traversal: 'light-dom-only', textAndInputValuesOmitted: true,
        frameElements: document.querySelectorAll('iframe,frame').length, frameContentsIncluded: false,
        nodes: selected.map((element, index) => {
          const attributes = {}, truncatedAttributes = [];
          const attributeNames = element.getAttributeNames().filter(name =>
            names.includes(name) || name.startsWith('aria-'));
          for (const name of attributeNames.slice(0, 64)) {
            if (name.length > 128) { truncatedAttributes.push(name.slice(0, 128)); continue; }
            const value = element.getAttribute(name);
            attributes[name] = value.slice(0, 512);
            if (value.length > 512) truncatedAttributes.push(name);
          }
          const computed = getComputedStyle(element), styles = {};
          const truncatedStyles = [];
          for (const name of styleNames) {
            const value = computed.getPropertyValue(name);
            styles[name] = value.slice(0, 128);
            if (value.length > 128) truncatedStyles.push(name);
          }
          const box = element.getBoundingClientRect();
          return {index, parent: indexes.get(element.parentElement) ?? null,
            tag: element.localName, namespace: element.namespaceURI, attributes,
            truncatedAttributes, attributeCount: attributeNames.length,
            attributesTruncated: attributeNames.length > 64 || truncatedAttributes.length > 0,
            styles, truncatedStyles,
            bounds: {x: box.x, y: box.y, width: box.width, height: box.height},
            tabIndex: typeof element.tabIndex === 'number' ? element.tabIndex : null,
            focused: element === document.activeElement,
            openShadowRootObserved: element.shadowRoot !== null};
        })};
    }""")
    if (not isinstance(value, dict) or value.get("schemaVersion") != 1
            or value.get("scope") != "raw-document-inspection"
            or type(value.get("totalElements")) is not int or value["totalElements"] < 1
            or not isinstance(value.get("nodes"), list)
            or len(value["nodes"]) != min(value["totalElements"], 1000)
            or type(value.get("truncated")) is not bool
            or value["truncated"] != (value["totalElements"] > 1000)
            or value.get("textAndInputValuesOmitted") is not True
            or value.get("frameContentsIncluded") is not False
            or type(value.get("frameElements")) is not int or value["frameElements"] < 0):
        raise RuntimeError("Invalid bounded document inspection")
    if len(json.dumps(value).encode("utf-8")) > 4 * 1024 * 1024:
        raise RuntimeError("Document inspection exceeds the 4MiB artifact bound")
    return value


def unresolved_transactions(report, start):
    return any(item["state"] != "read-only-confirmed" for item in report["transactions"][start:])


def confirm_read_only_response(transaction, response):
    if transaction.get("state") != "read-only-pending":
        raise ValueError("Only an explicitly qualified pending request can be confirmed read-only")
    content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
    if not 200 <= response.status < 300 or content_type != "application/json":
        raise ValueError("Qualified bootstrap did not return successful JSON")
    body = response.body()
    if len(body) > 4 * 1024 * 1024:
        raise ValueError("Qualified bootstrap JSON exceeds the response bound")
    value = json.loads(body)
    if not isinstance(value, dict) or any(key not in value for key in transaction["responseKeys"]):
        raise ValueError("Qualified bootstrap response keys differ")
    transaction.update(state="read-only-confirmed", responseStatus=response.status,
                       responseContentType=content_type, confirmedAt=stamp())


def run(request, output, policy):
    validate_request(request)
    validate_policy(policy)
    if sys.platform != "win32" or os.environ.get("CODESPACES") == "true" or os.environ.get("CODESPACE_NAME"):
        raise RuntimeError("Browser execution requires the owned Windows evaluator")
    if request["target"] not in policy["allowedTargets"]:
        raise ValueError("Target is not in the protected operator policy")
    output = Path(output).resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError("Browser evidence must be outside the implementation directory")
    directory = output / "browser"
    directory.mkdir(parents=True, exist_ok=False)
    state_path = directory / "report.json"
    report = {"schemaVersion": 1, "scope": "authorized-browser-scenarios", "taskId": request["taskId"],
              "state": "running", "startedAt": stamp(), "request": request,
              "runnerSha256": sha256(Path(__file__)), "supportSha256": sha256(ROOT / "browser_support.py"),
              "policyImplementationSha256": sha256(ROOT / "browser_policy.py"),
              "measurementImplementationSha256": sha256(ROOT / "browser_measurements.py"),
              "ownedBrowserClosed": False, "realAssistiveTechnologyVerified": False,
              "transactions": [],
              "rows": [{"id": row["id"], "status": "planned"} for row in request["rows"]]}
    save(state_path, report)
    browser = None
    context = None
    browser_error = RuntimeError
    deadline = time.monotonic() + request["budgetSeconds"]
    try:
        from playwright.sync_api import sync_playwright, Error as PlaywrightError
        browser_error = PlaywrightError
        report["playwrightVersion"] = importlib.metadata.version("playwright")
        with sync_playwright() as playwright:
            try:
                browser, context = policy_module.open_context(playwright, request, policy)
                report["browserVersion"] = browser.version if browser else "unavailable"
                if browser is None:
                    raise RuntimeError("Actual browser identity is unavailable")
                report["connectionMode"] = policy.get("connection", {}).get("mode", "ephemeral")
                blocked_requests = []
                failed_responses = []
                critical_failures = [0]
                authenticating = [report["connectionMode"] == "persistent"]
                read_only_pending = []

                def route_request(route):
                    parsed = urlsplit(route.request.url)
                    permitted = policy_module.permits(policy, request["target"], route.request, authenticating[0])
                    if permitted:
                        rule = policy_module.request_rule(policy, route.request)
                        if (route.request.method not in {"GET", "HEAD"} and
                                (rule and "readOnly" in rule or not (
                                    rule and rule.get("authentication") or
                                    authenticating[0] and policy_module.authentication_request(policy, route.request)))):
                            if len(report["transactions"]) >= 100:
                                critical_failures[0] += 1
                                route.abort()
                                return
                            transaction = {"method": route.request.method,
                                "url": f"{parsed.scheme}://{parsed.netloc}{parsed.path}",
                                "state": "submitted-unknown", "timestamp": stamp()}
                            if rule and "readOnly" in rule:
                                transaction.update(state="read-only-pending",
                                                   bodySha256=rule["readOnly"]["bodySha256"],
                                                   responseKeys=rule["readOnly"]["responseKeys"])
                                read_only_pending.append((route.request, transaction))
                            report["transactions"].append(transaction)
                            save(state_path, report)
                        route.continue_()
                    else:
                        telemetry = policy_module.telemetry_block(policy, route.request)
                        if not telemetry and route.request.resource_type in {"script", "document", "stylesheet", "fetch", "xhr"}:
                            critical_failures[0] += 1
                        if len(blocked_requests) < 200:
                            blocked_requests.append({"url": f"{parsed.scheme}://{parsed.netloc}{parsed.path}",
                                                     "type": route.request.resource_type,
                                                     "method": route.request.method,
                                                     "expectedTelemetryDenial": telemetry is not None})
                        route.abort()

                context.route("**/*", route_request)
                context.route_web_socket("**/*", lambda socket: socket.close())
                if len(context.pages) > 1:
                    raise RuntimeError("Existing profile opened multiple pages; do not alter an ambiguous session")
                page = context.pages[0] if context.pages else context.new_page()
                page.bring_to_front()
                page.set_default_timeout(5000)
                page.set_default_navigation_timeout(15000)
                def take_pending(request):
                    pending = next((index for index, (original, _) in enumerate(read_only_pending)
                                    if original is request), None)
                    return read_only_pending.pop(pending)[1] if pending is not None else None

                def failed_request(request):
                    transaction = take_pending(request)
                    if transaction is not None:
                        transaction.update(state="read-only-unverified", reason="Qualified bootstrap request failed")
                        critical_failures[0] += 1
                        save(state_path, report)

                def failed_response(response):
                    if response.status >= 400 and response.request.resource_type in {"script", "document", "stylesheet", "fetch", "xhr"}:
                        critical_failures[0] += 1
                        if len(failed_responses) < 100:
                            parsed = urlsplit(response.url)
                            failed_responses.append({"url": f"{parsed.scheme}://{parsed.netloc}{parsed.path}",
                                                     "status": response.status,
                                                     "type": response.request.resource_type})

                def finished_request(request):
                    transaction = take_pending(request)
                    if transaction is not None:
                        try:
                            if time.monotonic() >= deadline:
                                raise TimeoutError("Qualified bootstrap exceeded the original budget")
                            response = request.response()
                            if response is None:
                                raise ValueError("Qualified bootstrap response is unavailable")
                            confirm_read_only_response(transaction, response)
                            if time.monotonic() >= deadline:
                                raise TimeoutError("Qualified bootstrap exceeded the original budget")
                        except (PlaywrightError, OSError, ValueError) as error:
                            transaction.update(state="read-only-unverified", reason=str(error))
                            critical_failures[0] += 1
                        save(state_path, report)
                page.on("response", failed_response)
                page.on("requestfailed", failed_request)
                page.on("requestfinished", finished_request)
                dialogs = []
                page.on("dialog", lambda dialog: (dialogs.append(dialog.type), dialog.dismiss()))
                for definition, row in zip(request["rows"], report["rows"]):
                    if report.get("unresolvedTransaction"):
                        row.update(status="not-run", attempted=False, reason="Earlier transaction effects require reconciliation")
                        save(state_path, report)
                        continue
                    if time.monotonic() >= deadline:
                        row.update(status="not-run", attempted=False, reason="Original browser budget exhausted")
                        save(state_path, report)
                        continue
                    row.update(status="inconclusive", attempted=True, reason="Execution started; reconcile interruption before retry")
                    save(state_path, report)
                    errors = []
                    on_error = lambda error: errors.append(error)
                    failure_start = critical_failures[0]
                    transaction_start = len(report["transactions"])
                    dialogs.clear()
                    page.on("pageerror", on_error)
                    try:
                        response = page.goto(request["target"], wait_until="load")
                        if authenticating[0]:
                            policy_module.wait_authenticated(page, request, policy, deadline, time.monotonic)
                            authenticating[0] = False
                        while any(item["state"] == "read-only-pending" for item in report["transactions"][transaction_start:]):
                            if time.monotonic() >= deadline:
                                raise TimeoutError("Qualified bootstrap response exceeded the original budget")
                            page.wait_for_timeout(25)
                        if unresolved_transactions(report, transaction_start):
                            raise RuntimeError("Page startup has an unresolved server request; reconcile it before triggering the scenario")
                        if not response or response.status >= 400 or page.url != request["target"]:
                            raise RuntimeError("Expected authorized page did not load")
                        row["pageErrors"] = [str(error) for error in errors[:20]]
                        row["unexpectedDialogs"] = dialogs[:20]
                        row["criticalRequestFailures"] = critical_failures[0] - failure_start
                        row["capturePreflight"] = capture_health(
                            page, request, not errors and not dialogs and critical_failures[0] == failure_start)
                        row["scenarioPreflight"] = row["capturePreflight"]
                        save(state_path, report)
                        if not row["capturePreflight"]["verified"]:
                            raise RuntimeError("Scenario-scoped capture preflight failed; no trigger or capture")
                        for step in definition["steps"]:
                            if time.monotonic() >= deadline:
                                raise TimeoutError("Browser scenario budget exhausted")
                            if step["action"] == "press":
                                page.keyboard.press(step["key"])
                            else:
                                target = locate(page, step["target"])
                                remaining_ms = int((deadline - time.monotonic()) * 1000)
                                if remaining_ms <= 0:
                                    raise TimeoutError("Original browser action budget exhausted")
                                page.set_default_timeout(min(5000, remaining_ms))
                                if step["action"] == "click":
                                    target.click()
                                else:
                                    if target.get_attribute("type") == "password":
                                        raise RuntimeError("Password entry is not authorized by discovery")
                                    remaining_ms = int((deadline - time.monotonic()) * 1000)
                                    if remaining_ms <= 0:
                                        raise TimeoutError("Original browser action budget exhausted")
                                    page.set_default_timeout(min(5000, remaining_ms))
                                    target.fill(step["value"])
                        row["pageErrors"] = [str(error) for error in errors[:20]]
                        row["unexpectedDialogs"] = dialogs[:20]
                        if errors or dialogs or critical_failures[0] != failure_start:
                            raise RuntimeError("Unexpected page script error or browser dialog")
                        if len(context.pages) != 1:
                            raise RuntimeError("Unexpected popup changed the scenario context")
                        row["documentFocused"] = page.evaluate("document.hasFocus()")
                        if any(item["kind"] == "focused" for item in definition["assertions"]) and not row["documentFocused"]:
                            raise RuntimeError("Document focus is not established for a focus assertion")
                        observations = []
                        for assertion in definition["assertions"]:
                            remaining_ms = int((deadline - time.monotonic()) * 1000)
                            if remaining_ms <= 0:
                                raise TimeoutError("Original browser observation budget exhausted")
                            page.set_default_timeout(min(5000, remaining_ms))
                            observations.append(observe(page, assertion, policy, remaining_ms))
                        row["observations"] = observations
                        if definition.get("inspection"):
                            if time.monotonic() >= deadline:
                                raise TimeoutError("Original document inspection budget exhausted")
                            row["documentInspection"] = inspect_document(page)
                            row["inspectionSteps"] = definition["steps"]
                            if time.monotonic() >= deadline:
                                raise TimeoutError("Document inspection exceeded the original budget")
                        if any(item.get("scanner", {}).get("incomplete") for item in observations):
                            raise RuntimeError("axe-core returned incomplete checks; preserve results for independent review")
                        row.update(observations=observations, steps=definition["steps"], timestamp=stamp(), url=page.url)
                        if not observations:
                            row.update(status="inconclusive",
                                       reason="Raw document inspection only; caller accessibility assessment is required")
                        else:
                            row["status"] = "observed-no-issue" if all(item["met"] for item in observations) else "finding"
                            row.pop("reason", None)
                    except (PlaywrightError, RuntimeError, TimeoutError) as error:
                        row.update(status="blocked", reason=str(error))
                    try:
                        if row.get("capturePreflight", {}).get("verified"):
                            row["capturePreflight"] = capture_health(
                                page, request, not errors and not dialogs and critical_failures[0] == failure_start)
                            save(state_path, report)
                            if not row["capturePreflight"]["verified"]:
                                row.update(status="blocked", reason="Environment changed before capture; capture not attempted")
                                continue
                            screenshot = directory / (row["id"] + ".png")
                            page.screenshot(path=str(screenshot))
                            tree = directory / (row["id"] + ".aria.txt")
                            tree.write_text(page.locator(":root" if definition.get("inspection") else "body").aria_snapshot(),
                                            encoding="utf-8")
                            row["evidence"] = [{"path": file.name, "sha256": sha256(file)} for file in (screenshot, tree)]
                    finally:
                        row["pageErrors"] = [str(error) for error in errors[:20]]
                        row["unexpectedDialogs"] = dialogs[:20]
                        row["criticalRequestFailures"] = critical_failures[0] - failure_start
                        row["capturePostcheck"] = capture_health(
                            page, request, not errors and not dialogs and critical_failures[0] == failure_start)
                        if not row["capturePostcheck"]["verified"]:
                            row.update(status="inconclusive", reason="Capture postcheck found an unexpected page/environment state")
                        if unresolved_transactions(report, transaction_start):
                            report["unresolvedTransaction"] = True
                            row.update(status="inconclusive",
                                       reason="Server request effects are unresolved; independent server-state/reset verification required before another row")
                        save(state_path, report)
                        page.remove_listener("pageerror", on_error)
                report["blockedRequests"] = blocked_requests
                report["failedResponses"] = failed_responses
                report["state"] = "completed"
            finally:
                try:
                    if context is not None:
                        context.close()
                finally:
                    if browser is not None:
                        if browser.is_connected():
                            browser.close()
                        report["ownedBrowserClosed"] = not browser.is_connected()
    except (OSError, ValueError, RuntimeError, TimeoutError, ImportError, browser_error) as error:
        report.update(state="failed", error={"type": type(error).__name__, "message": str(error)})
        for row in report["rows"]:
            if row["status"] == "planned":
                row.update(status="not-run", attempted=False, reason="Execution failed before this row")
            elif row.get("attempted"):
                row.setdefault("capturePostcheck", {
                    "verified": False, "timestamp": stamp(),
                    "reason": "Postcheck did not complete; preserve original operation and cleanup obligation",
                })
        raise
    finally:
        report["finishedAt"] = stamp()
        save(state_path, report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--request", required=True)
    parser.add_argument("--policy")
    parser.add_argument("--output")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    request = validate_request(json.loads(Path(args.request).read_text(encoding="utf-8-sig")))
    if args.validate_only:
        print(json.dumps({"state": "request-valid", "liveExecution": False}))
        return
    if not args.output or not args.policy:
        parser.error("--output and the operator's --policy are required for execution")
    report = run(request, args.output, json.loads(Path(args.policy).read_text(encoding="utf-8-sig")))
    print(json.dumps({"state": report["state"], "ownedBrowserClosed": report["ownedBrowserClosed"]}))


if __name__ == "__main__":
    main()
