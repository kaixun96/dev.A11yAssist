"""Bounded, disposable Windows browser qualification; never product or AT evidence."""
import argparse
import hashlib
import importlib.metadata
import json
import os
import platform
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


def validate_request(value):
    fields = {"schemaVersion", "taskId", "fixture", "repetitions"}
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("Expected exactly schemaVersion, taskId, fixture, repetitions")
    if type(value["schemaVersion"]) is not int or value["schemaVersion"] != 1:
        raise ValueError("Unsupported fixture request schema")
    if not isinstance(value["taskId"], str) or not re.fullmatch(r"[a-z][a-z0-9-]{2,79}", value["taskId"]):
        raise ValueError("Invalid task identity; do not supply an ADO Bug")
    if value["fixture"] != "dialog-form-v1":
        raise ValueError("Only the bundled disposable dialog-form-v1 fixture is supported")
    if type(value["repetitions"]) is not int or not 1 <= value["repetitions"] <= 3:
        raise ValueError("Repetitions must be an integer from 1 to 3")
    return value


def stamp():
    return datetime.now(timezone.utc).isoformat()


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, indent=2, ensure_ascii=False), encoding="utf-8")
    temporary.replace(path)


def active_id(page):
    return page.evaluate("document.activeElement.id")


def keyboard_reach(page, target):
    visited = []
    for _ in range(12):
        page.keyboard.press("Tab")
        visited.append(active_id(page))
        if visited[-1] == target:
            return visited
    raise RuntimeError(f"Fixture precondition failed: keyboard could not reach {target}; visited={visited}")


def observe(page, scenario):
    if scenario in ("dialog-entry", "dialog-escape"):
        visited = keyboard_reach(page, "open")
        page.keyboard.press("Enter")
        if scenario == "dialog-entry":
            observed = {"activeId": active_id(page), "dialogVisible": page.get_by_role("dialog").is_visible()}
            return observed["activeId"] == "name" and observed["dialogVisible"], observed, visited + ["Enter"]
        page.keyboard.press("Escape")
        observed = {"activeId": active_id(page), "dialogVisible": page.get_by_role("dialog").is_visible()}
        return observed["activeId"] == "open" and not observed["dialogVisible"], observed, visited + ["Enter", "Escape"]
    if scenario == "email-name":
        observed = {"namedTextboxCount": page.get_by_role("textbox", name="Email", exact=True).count()}
        return observed["namedTextboxCount"] == 1, observed, ["Inspect rendered textbox name"]
    if scenario == "form-error":
        visited = keyboard_reach(page, "submit")
        page.keyboard.press("Enter")
        email = page.locator("#email")
        observed = {
            "activeId": active_id(page), "invalid": email.get_attribute("aria-invalid"),
            "describedBy": email.get_attribute("aria-describedby"),
            "errorText": page.locator("#error").inner_text(),
        }
        ok = (observed["activeId"] == "email" and observed["invalid"] == "true"
              and observed["describedBy"] == "error" and observed["errorText"] == "Enter an email address.")
        return ok, observed, visited + ["Enter"]
    raise ValueError("Unknown fixture scenario")


EXPECTATIONS = {
    "dialog-entry": "Opening the dialog by keyboard moves focus to the Name input.",
    "dialog-escape": "Escape dismisses the dialog and restores focus to its trigger.",
    "email-name": "The rendered Email textbox has the accessible name Email.",
    "form-error": "Empty submit exposes and associates an error, marks invalid and focuses Email.",
}


def run(request, output):
    validate_request(request)
    if sys.platform != "win32" or os.environ.get("CODESPACES") == "true" or os.environ.get("CODESPACE_NAME"):
        raise RuntimeError("Unsupported host: live fixture qualification requires the owned Windows evaluator")
    script = Path(__file__).resolve()
    package = next((p for p in script.parents if (p / "plugin.json").is_file()
                    or (p / "package.json").is_file()), script.parent.parent)
    output = Path(output).resolve()
    if output == package or package in output.parents:
        raise ValueError("Evidence must be outside the plugin installation/public repository")
    fixture = script.parent / "dialog-form.html"
    directory = output / "fixture"
    directory.mkdir(parents=True, exist_ok=False)
    report = {
        "schemaVersion": 1, "taskId": request["taskId"], "scope": "disposable-fixture-qualification",
        "state": "running", "startedAt": stamp(), "fixtureSha256": sha256(fixture),
        "runnerSha256": sha256(script), "request": request, "os": platform.platform(),
        "viewport": {"width": 1280, "height": 720}, "deviceScaleFactor": 1,
        "realAssistiveTechnologyVerified": False, "productEvaluated": False,
        "ownedBrowserClosed": False, "fixtureQualification": "not-completed",
        "rows": [
            {"id": f"{variant}-{scenario}-{repetition}", "scenario": scenario, "variant": variant,
             "repetition": repetition, "expected": expected, "status": "planned"}
            for variant in ("healthy", "broken")
            for repetition in range(1, request["repetitions"] + 1)
            for scenario, expected in EXPECTATIONS.items()
        ],
        "gaps": [
            "No real screen-reader or Voice Access output.",
            "No scanner, contrast measurement, zoom/reflow or media checks.",
            "Source review is a separate read-only knowledge step; this runner does not perform it.",
            "This is a known synthetic fixture, not coverage of an arbitrary product.",
        ],
    }
    state_path = directory / "report.json"
    save(state_path, report)
    browser = None
    current_row = None
    try:
        from playwright.sync_api import sync_playwright
        report["playwrightVersion"] = importlib.metadata.version("playwright")
        with sync_playwright() as playwright:
            try:
                browser = playwright.chromium.launch(headless=False)
                report["browserVersion"] = browser.version
                context = browser.new_context(viewport=report["viewport"], device_scale_factor=1,
                                              locale="en-US", reduced_motion="reduce")
                # Only the bundled file may load. No auth, remote scripts or product writes.
                allowed = fixture.as_uri()
                context.route("**/*", lambda route: route.continue_()
                              if route.request.url.split("?")[0] == allowed else route.abort())
                page = context.new_page()
                page.set_default_timeout(5000)
                page.set_default_navigation_timeout(10000)
                deadline = time.monotonic() + 180
                for row in report["rows"]:
                    if time.monotonic() > deadline:
                        raise TimeoutError("Bounded fixture budget expired; preserve this run, do not replay")
                    current_row = row
                    row.update(status="inconclusive", reason="Execution started; effects must be reconciled if interrupted")
                    save(state_path, report)
                    page.goto(f"{allowed}?variant={row['variant']}", wait_until="load")
                    ok, observed, steps = observe(page, row["scenario"])
                    screenshot = directory / f"{row['id']}.png"
                    page.screenshot(path=str(screenshot), full_page=True)
                    snapshot = directory / f"{row['id']}.aria.txt"
                    snapshot.write_text(page.locator("body").aria_snapshot(), encoding="utf-8")
                    row.update({
                        "timestamp": stamp(), "url": page.url, "observed": observed, "steps": steps,
                        "reset": "Reload the same bundled fixture before this row",
                        "status": "observed-no-issue" if ok else "finding",
                        "seedExpectationMet": ok == (row["variant"] == "healthy"),
                        "evidence": [{"path": f.name, "sha256": sha256(f)} for f in (screenshot, snapshot)],
                    })
                    del row["reason"]
                    save(state_path, report)
                    current_row = None
                if sha256(fixture) != report["fixtureSha256"] or sha256(script) != report["runnerSha256"]:
                    raise RuntimeError("Fixture or runner source changed during observation")
                report["fixtureQualification"] = ("passed" if all(row["seedExpectationMet"] for row in report["rows"])
                                                   else "failed")
                report["state"] = "completed"
            finally:
                if browser is not None:
                    browser.close()
                    report["ownedBrowserClosed"] = not browser.is_connected()
    except Exception as error:
        report["state"] = "failed"
        report["fixtureQualification"] = "failed"
        report["error"] = {"type": type(error).__name__, "message": str(error)}
        if current_row is not None:
            current_row.update(status="blocked", reason=str(error))
        for row in report["rows"]:
            if row["status"] == "planned":
                row.update(status="not-run", reason="Fixture execution failed before this row")
        raise
    finally:
        report["finishedAt"] = stamp()
        save(state_path, report)
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--request", required=True)
    parser.add_argument("--output")
    parser.add_argument("--validate-only", action="store_true")
    args = parser.parse_args()
    request = validate_request(json.loads(Path(args.request).read_text(encoding="utf-8-sig")))
    if args.validate_only:
        print(json.dumps({"state": "request-valid", "liveExecution": False}))
        return
    if not args.output:
        parser.error("--output is required for execution")
    report = run(request, args.output)
    print(json.dumps({"state": report["state"], "fixtureQualification": report["fixtureQualification"],
                      "ownedBrowserClosed": report["ownedBrowserClosed"], "productEvaluated": False}))
    if report["fixtureQualification"] != "passed" or not report["ownedBrowserClosed"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
