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
        if not isinstance(row, dict) or set(row) != {"id", "steps", "assertions"}:
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
        if not isinstance(row["assertions"], list) or not 1 <= len(row["assertions"]) <= 20:
            raise ValueError("Every row requires bounded assertions")
        for assertion in row["assertions"]:
            if not isinstance(assertion, dict):
                raise ValueError("Assertion must be an object")
            kind = assertion.get("kind")
            fields = {"kind", "target", "expected"} | ({"attribute"} if kind == "attribute" else set())
            if set(assertion) != fields or kind not in {"focused", "visible", "count", "text", "attribute"}:
                raise ValueError("Unsupported typed assertion")
            locator_spec(assertion["target"])
            expected = assertion["expected"]
            if kind in {"focused", "visible"} and type(expected) is not bool:
                raise ValueError("Visibility/focus expectations must be booleans")
            if kind == "count" and (type(expected) is not int or not 0 <= expected <= 100):
                raise ValueError("Count expectation must be bounded")
            if kind == "text" and (not isinstance(expected, str) or len(expected) > 4096):
                raise ValueError("Invalid expected text")
            if kind == "attribute" and (assertion["attribute"] not in ATTRIBUTES or
                                        (expected is not None and (not isinstance(expected, str) or len(expected) > 4096))):
                raise ValueError("Unsupported attribute assertion")
    return value


def validate_policy(policy):
    if (not isinstance(policy, dict) or set(policy) != {"schemaVersion", "allowedTargets", "assetHosts"} or
            type(policy["schemaVersion"]) is not int or policy["schemaVersion"] != 1 or
            not isinstance(policy["allowedTargets"], list) or len(policy["allowedTargets"]) > 100 or
            not isinstance(policy["assetHosts"], list) or len(policy["assetHosts"]) > 30):
        raise ValueError("Invalid protected browser policy")
    for target in policy["allowedTargets"]:
        if not isinstance(target, str) or len(target) > 2048:
            raise ValueError("Invalid authorized target")
        parsed = urlsplit(target)
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
            raise ValueError("Authorized targets must be credential-free HTTPS")
    if any(not isinstance(host, str) or not re.fullmatch(r"[a-z0-9.-]{1,253}", host) for host in policy["assetHosts"]):
        raise ValueError("Asset hosts must be explicit DNS names without wildcards")
    return policy


def locate(page, target):
    return page.locator(target["css"]) if "css" in target else page.get_by_role(target["role"], name=target["name"], exact=True)


def observe(page, assertion):
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
        if kind == "focused":
            actual = target.evaluate("element => element === document.activeElement")
        elif kind == "text":
            actual = target.inner_text()
        else:
            actual = target.get_attribute(assertion["attribute"])
    return {"assertion": assertion, "actual": actual, "met": actual == assertion["expected"]}


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
              "ownedBrowserClosed": False, "realAssistiveTechnologyVerified": False,
              "rows": [{"id": row["id"], "status": "planned"} for row in request["rows"]]}
    save(state_path, report)
    browser = None
    browser_error = RuntimeError
    deadline = time.monotonic() + request["budgetSeconds"]
    try:
        from playwright.sync_api import sync_playwright, Error as PlaywrightError
        browser_error = PlaywrightError
        report["playwrightVersion"] = importlib.metadata.version("playwright")
        with sync_playwright() as playwright:
            try:
                browser = playwright.chromium.launch(headless=False)
                report["browserVersion"] = browser.version
                context = browser.new_context(viewport=request["viewport"], device_scale_factor=1,
                                              locale="en-US", reduced_motion="reduce", service_workers="block")
                target_origin = urlsplit(request["target"]).netloc
                blocked_requests = []
                critical_failures = [0]

                def route_request(route):
                    parsed = urlsplit(route.request.url)
                    permitted = (route.request.method in {"GET", "HEAD"} and
                                 route.request.resource_type not in {"fetch", "xhr", "websocket", "eventsource"} and parsed.scheme == "https" and
                                 parsed.netloc in {target_origin, *policy.get("assetHosts", [])})
                    if route.request.resource_type == "document":
                        permitted = permitted and route.request.url.split("#")[0] == request["target"]
                    if permitted:
                        route.continue_()
                    else:
                        if route.request.resource_type in {"script", "document", "stylesheet"}:
                            critical_failures[0] += 1
                        if len(blocked_requests) < 200:
                            blocked_requests.append({"url": route.request.url, "type": route.request.resource_type})
                        route.abort()

                context.route("**/*", route_request)
                context.route_web_socket("**/*", lambda socket: socket.close())
                page = context.new_page()
                page.bring_to_front()
                page.set_default_timeout(5000)
                page.set_default_navigation_timeout(15000)
                def failed_response(response):
                    if response.status >= 400 and response.request.resource_type in {"script", "document", "stylesheet"}:
                        critical_failures[0] += 1
                page.on("response", failed_response)
                dialogs = []
                page.on("dialog", lambda dialog: (dialogs.append(dialog.type), dialog.dismiss()))
                for definition, row in zip(request["rows"], report["rows"]):
                    if time.monotonic() >= deadline:
                        row.update(status="not-run", attempted=False, reason="Original browser budget exhausted")
                        save(state_path, report)
                        continue
                    row.update(status="inconclusive", attempted=True, reason="Execution started; reconcile interruption before retry")
                    save(state_path, report)
                    errors = []
                    on_error = errors.append
                    failure_start = critical_failures[0]
                    dialogs.clear()
                    page.on("pageerror", on_error)
                    try:
                        response = page.goto(request["target"], wait_until="load")
                        if not response or response.status >= 400 or page.url != request["target"]:
                            raise RuntimeError("Expected authorized page did not load")
                        for step in definition["steps"]:
                            if time.monotonic() >= deadline:
                                raise TimeoutError("Browser scenario budget exhausted")
                            if step["action"] == "press":
                                page.keyboard.press(step["key"])
                            else:
                                target = locate(page, step["target"])
                                if target.count() != 1:
                                    raise RuntimeError("Action target is missing or ambiguous")
                                if step["action"] == "click":
                                    target.click()
                                else:
                                    if target.get_attribute("type") == "password":
                                        raise RuntimeError("Password entry is not authorized by discovery")
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
                        observations = [observe(page, assertion) for assertion in definition["assertions"]]
                        row.update(status="observed-no-issue" if all(item["met"] for item in observations) else "finding",
                                   observations=observations, steps=definition["steps"], timestamp=stamp(), url=page.url)
                        row.pop("reason", None)
                    except (PlaywrightError, RuntimeError, TimeoutError) as error:
                        row.update(status="blocked", reason=str(error))
                    finally:
                        page.remove_listener("pageerror", on_error)
                    screenshot = directory / (row["id"] + ".png")
                    page.screenshot(path=str(screenshot))
                    tree = directory / (row["id"] + ".aria.txt")
                    tree.write_text(page.locator("body").aria_snapshot(), encoding="utf-8")
                    row["evidence"] = [{"path": file.name, "sha256": sha256(file)} for file in (screenshot, tree)]
                    save(state_path, report)
                report["blockedRequests"] = blocked_requests
                report["state"] = "completed"
            finally:
                if browser is not None:
                    browser.close()
                    report["ownedBrowserClosed"] = not browser.is_connected()
    except (OSError, ValueError, RuntimeError, TimeoutError, ImportError, browser_error) as error:
        report.update(state="failed", error={"type": type(error).__name__, "message": str(error)})
        for row in report["rows"]:
            if row["status"] == "planned":
                row.update(status="not-run", attempted=False, reason="Execution failed before this row")
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
