import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { verifyBrowserObservations, validateBrowserParameters, browserRequest } from '../src/runtime/browser-contract.mjs';

test('observation dwell is explicit and bounded, not a script or an automatic AT claim', () => {
  const value = { steps: [{ action: 'observe', milliseconds: 1000 }], assertions: [], inspection: true };
  validateBrowserParameters(value);
  for (const milliseconds of [0, -1, 30001, 1.5, true, '1000', null]) {
    assert.throws(() => validateBrowserParameters({ ...value, steps: [{ action: 'observe', milliseconds }] }));
  }
  assert.throws(() => validateBrowserParameters({ ...value, steps: [{ action: 'observe', milliseconds: 1, script: 'x' }] }));
});

test('generic browser schema is bounded, denies scripts/OS keys and needs no browser for validation', () => {
  const path = fileURLToPath(new URL('../src/browser/browser_runner.py', import.meta.url));
  const script = `
import copy, importlib.util, os, sys
spec = importlib.util.spec_from_file_location("browser_runner", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
base = {"schemaVersion":1,"taskId":"browser-unit-test","target":"https://example.org/demo",
        "budgetSeconds":60,"viewport":{"width":1280,"height":720},
        "rows":[{"id":"open","steps":[{"action":"click","target":{"role":"button","name":"Open"}},
                {"action":"press","key":"Escape"}],
        "assertions":[{"kind":"focused","target":{"css":"#open"},"expected":True}]}]}
m.validate_request(base)
class Page:
    viewport_size = base["viewport"]
    url = base["target"]
    visible = True
    focused = True
    def is_closed(self): return False
    def evaluate(self, script): return {"visible": self.visible, "focused": self.focused}
page = Page()
page.context = type("Context", (), {"pages": [page]})()
assert m.capture_health(page, base, True)["verified"]
page.focused = False
assert not m.capture_health(page, base, True)["verified"]
page.focused = True
assert not m.capture_health(page, base, False)["verified"]
cases=[]
def changed(fn):
    value=copy.deepcopy(base); fn(value); cases.append(value)
changed(lambda v:v.update(target="file:///private"))
changed(lambda v:v.update(target="https://user:password@example.org"))
changed(lambda v:v.update(budgetSeconds=True))
changed(lambda v:v["rows"].append(v["rows"][0]))
changed(lambda v:v["rows"][0]["steps"].append({"action":"evaluate","script":"arbitrary()"}))
changed(lambda v:v["rows"][0]["steps"][1].update(key="Alt+F4"))
changed(lambda v:v["rows"][0]["steps"][0].update(target={"css":"body input"}))
changed(lambda v:v["rows"][0]["assertions"][0].update(expected="true"))
changed(lambda v:v["rows"][0].update(assertions=[]))
for duration in (0, -1, 30001, 1.5, True, "1000", None):
    changed(lambda v,duration=duration:v["rows"][0]["steps"].append({"action":"observe","milliseconds":duration}))
for value in cases:
    try:m.validate_request(value)
    except ValueError:pass
    else:raise AssertionError("Unsafe request accepted")
m.validate_policy({"schemaVersion":1,"allowedTargets":["https://example.org/demo"],"assetHosts":[]})
for policy in ({"schemaVersion":1,"allowedTargets":["http://example.org"],"assetHosts":[]},
               {"schemaVersion":1,"allowedTargets":[],"assetHosts":["*"]}):
    try:m.validate_policy(policy)
    except ValueError:pass
    else:raise AssertionError("Unsafe policy accepted")
assert "playwright" not in sys.modules
os.environ["CODESPACES"]="true"
try:m.run(base,"not-created",{"schemaVersion":1,"allowedTargets":[base["target"]],"assetHosts":[]})
except RuntimeError:pass
else:raise AssertionError("Codespace launched browser")
print("Schema and host gates only; no browser or AT execution")
`;
  const result = spawnSync('python', ['-I', '-B', '-', path], { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no browser or AT execution/);
});

test('document inspection is explicit and does not authorize empty ordinary assertions or scripts', () => {
  const parameters = { steps: [], assertions: [], inspection: true };
  validateBrowserParameters(parameters);
  const request = browserRequest({ taskId: 'inspection-unit', target: 'https://example.org/document.svg',
    rows: [{ id: 'inspect', track: 'page', capability: 'browser', parameters }] });
  assert.equal(request.rows[0].inspection, true);
  for (const value of [
    { steps: [], assertions: [] },
    { ...parameters, inspection: false },
    { ...parameters, inspection: 'true' },
    { ...parameters, script: 'arbitrary()' },
    { ...parameters, steps: [{ action: 'evaluate', script: 'arbitrary()' }] }
  ]) assert.throws(() => validateBrowserParameters(value));
  const documentInspection = {
    schemaVersion: 1, scope: 'raw-document-inspection', url: request.target,
    viewport: request.viewport, traversal: 'light-dom-only', textAndInputValuesOmitted: true,
    frameContentsIncluded: false, frameElements: 0,
    totalElements: 1, truncated: false, nodes: [{ index: 0 }]
  };
  const report = { request, rows: [{ id: 'inspect', attempted: true, status: 'inconclusive',
    reason: 'Raw inspection requires caller assessment', inspectionSteps: [], documentInspection }] };
  verifyBrowserObservations(report, request);
  for (const change of [
    row => { row.status = 'observed-no-issue'; },
    row => { row.documentInspection.totalElements = 0; },
    row => { row.documentInspection.nodes = []; },
    row => { row.documentInspection.truncated = true; },
    row => { row.documentInspection.url = 'https://example.org/foreign'; },
    row => { row.documentInspection.textAndInputValuesOmitted = false; },
    row => { row.documentInspection.frameContentsIncluded = true; },
    row => { row.inspectionSteps = [{ action: 'press', key: 'Tab' }]; }
  ]) {
    const altered = structuredClone(report); change(altered.rows[0]);
    assert.throws(() => verifyBrowserObservations(altered, request));
  }
  const unsolicited = structuredClone(report);
  delete unsolicited.request.rows[0].inspection;
  assert.throws(() => verifyBrowserObservations(unsolicited, unsolicited.request), /not requested/);
});

test('inspection-only HTML/SVG/XML collection uses the document root and never reports a behavioral pass', () => {
  const path = fileURLToPath(new URL('../src/browser/browser_runner.py', import.meta.url));
  const script = `
import contextlib, copy, importlib.util, json, os, sys, tempfile, types
from pathlib import Path
from unittest.mock import patch
spec = importlib.util.spec_from_file_location("browser_runner", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
request = {"schemaVersion":1,"taskId":"document-inspection-unit","target":"https://example.org/document.svg",
           "budgetSeconds":30,"viewport":{"width":1280,"height":720},
           "rows":[{"id":"inspect","steps":[],"assertions":[],"inspection":True},
                   {"id":"compare","steps":[],"inspection":True,
                    "assertions":[{"kind":"count","target":{"css":"#main"},"expected":1}]}]}
m.validate_request(request)
for flag in (False, 1, "true", None):
    invalid = copy.deepcopy(request); invalid["rows"][0]["inspection"] = flag
    try: m.validate_request(invalid)
    except ValueError: pass
    else: raise AssertionError("Implicit inspection accepted")
class Browser:
    version = "unit-only"
    connected = True
    def is_connected(self): return self.connected
    def close(self): self.connected = False
class Page:
    url = request["target"]
    viewport_size = request["viewport"]
    def __init__(self): self.listeners = {}; self.root_snapshots = 0; self.expiry_clock = None
    def on(self, event, handler):
        setattr(handler, "_pw_impl_instance_", object()); self.listeners[event] = handler
    def remove_listener(self, event, handler):
        assert self.listeners[event] is handler
        del self.listeners[event]
    def bring_to_front(self): pass
    def set_default_timeout(self, timeout): pass
    def set_default_navigation_timeout(self, timeout): pass
    def goto(self, url, **kwargs):
        if self.expiry_clock is not None: self.expiry_clock[0] = 100
        return types.SimpleNamespace(status=200)
    def is_closed(self): return False
    def evaluate(self, script):
        if "raw-document-inspection" in script:
            self.inspection_script = script
            assert "innerHTML" not in script and "textContent" not in script and "element.value" not in script
            return {"schemaVersion":1,"scope":"raw-document-inspection","url":self.url,
                    "viewport":self.viewport_size,"totalElements":1,"truncated":False,
                    "textAndInputValuesOmitted":True,"frameContentsIncluded":False,
                    "frameElements":0,"nodes":[{"index":0}]}
        if script == "document.hasFocus()": return True
        return {"visible":True,"focused":True}
    def screenshot(self, path): Path(path).write_bytes(b"synthetic-unit-image")
    def locator(self, selector):
        if selector == "#main": return types.SimpleNamespace(count=lambda: 1)
        assert selector == ":root", "Inspection must not require an HTML body or invented ID"
        self.root_snapshots += 1
        return types.SimpleNamespace(aria_snapshot=lambda: "synthetic-unit-tree")
class Context:
    closed = False
    def __init__(self, page): self.pages = [page]; page.context = self
    def route(self, *args): pass
    def route_web_socket(self, *args): pass
    def close(self): self.closed = True
page = Page(); context = Context(page); browser = Browser()
api = types.ModuleType("playwright.sync_api")
api.sync_playwright = lambda: contextlib.nullcontext(None)
api.Error = type("UnitPlaywrightError", (Exception,), {})
with tempfile.TemporaryDirectory() as output, \\
     patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
     patch.object(m.sys, "platform", "win32"), \\
     patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
     patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
     patch.object(m.policy_module, "open_context", return_value=(browser,context)):
    report = m.run(request, output, {"schemaVersion":1,"allowedTargets":[request["target"]],"assetHosts":[]})
row = report["rows"][0]
assert report["state"] == "completed" and report["ownedBrowserClosed"]
assert row["status"] == "inconclusive" and "caller" in row["reason"]
assert row["observations"] == [] and row["documentInspection"]["totalElements"] == 1
assert row["capturePreflight"]["verified"] and row["capturePostcheck"]["verified"]
assert len(row["evidence"]) == 2 and page.root_snapshots == 2 and context.closed
assert report["rows"][1]["status"] == "observed-no-issue"
assert report["rows"][1]["documentInspection"]["totalElements"] == 1
print("INSPECTION_JS=" + json.dumps(page.inspection_script))
clock = [0]
page = Page(); page.expiry_clock = clock
context = Context(page); browser = Browser()
expired = copy.deepcopy(request); expired["rows"] = expired["rows"][:1]
with tempfile.TemporaryDirectory() as output, \\
     patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
     patch.object(m.sys, "platform", "win32"), \\
     patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
     patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
     patch.object(m.policy_module, "open_context", return_value=(browser,context)), \\
     patch.object(m.time, "monotonic", side_effect=lambda: clock[0]):
    report = m.run(expired, output, {"schemaVersion":1,"allowedTargets":[request["target"]],"assetHosts":[]})
assert report["rows"][0]["status"] == "blocked"
assert "budget exhausted" in report["rows"][0]["reason"]
assert "documentInspection" not in report["rows"][0] and report["ownedBrowserClosed"]
print("Mocked inspection contract only; no browser or AT execution")
`;
  const result = spawnSync('python', ['-I', '-B', '-', path], { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no browser or AT execution/);
  const scriptLine = result.stdout.split('\n').find(line => line.startsWith('INSPECTION_JS='));
  assert(scriptLine);
  assert.doesNotThrow(() => new Script(`(${JSON.parse(scriptLine.slice('INSPECTION_JS='.length))})`));
});

test('shared browser assessment rejects forged comparisons and stale or abnormal capture health', () => {
  const assertion = { kind: 'focused', target: { css: '#open' }, expected: true };
  const request = { schemaVersion: 1, taskId: 'browser-unit', target: 'https://example.org/demo',
    budgetSeconds: 60, viewport: { width: 1280, height: 720 },
    rows: [{ id: 'open', steps: [], assertions: [assertion] }] };
  const health = { verified: true, url: request.target, visible: true, documentFocused: true,
    singlePage: true, noUnexpectedPageState: true, viewport: request.viewport };
  const report = { request, rows: [{ id: 'open', status: 'observed-no-issue', attempted: true,
    steps: [], observations: [{ assertion, actual: true, met: true }],
    capturePreflight: health, capturePostcheck: health }] };
  verifyBrowserObservations(report, request);
  for (const change of [
    row => { row.observations[0].actual = false; },
    row => { row.observations[0].assertion.target.css = '#wrong'; },
    row => { row.capturePostcheck.documentFocused = false; },
    row => { row.capturePreflight.viewport.width = 999; },
    row => { delete row.capturePreflight; },
    row => { row.attempted = false; }
  ]) {
    const changed = structuredClone(report);
    change(changed.rows[0]);
    assert.throws(() => verifyBrowserObservations(changed, request));
  }
});

test('page-error listeners support Playwright callback metadata and retain error gating', () => {
  const path = fileURLToPath(new URL('../src/browser/browser_runner.py', import.meta.url));
  const script = `
import contextlib, copy, hashlib, importlib.util, json, os, sys, tempfile, time, types
from pathlib import Path
from unittest.mock import patch
spec = importlib.util.spec_from_file_location("browser_runner", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
request = {"schemaVersion":1,"taskId":"browser-callback-unit","target":"https://example.org/demo",
           "budgetSeconds":30,"viewport":{"width":1280,"height":720},
           "rows":[{"id":"entry","steps":[],"assertions":[{"kind":"count","target":{"css":"#main"},"expected":1}]}]}
class Browser:
    version = "unit-only"
    connected = True
    def is_connected(self): return self.connected
    def close(self): self.connected = False
class Page:
    url = request["target"]
    viewport_size = request["viewport"]
    def __init__(self): self.listeners = {}; self.removed = False
    def on(self, event, handler):
        # Playwright's synchronous API attaches metadata to the original callable.
        setattr(handler, "_pw_impl_instance_", object())
        self.listeners[event] = handler
    def remove_listener(self, event, handler):
        assert self.listeners[event] is handler
        del self.listeners[event]; self.removed = True
    def bring_to_front(self): pass
    def set_default_timeout(self, timeout): pass
    def set_default_navigation_timeout(self, timeout): pass
    def goto(self, url, **kwargs):
        self.listeners["pageerror"]("unit page-script error")
        return types.SimpleNamespace(status=200)
    def is_closed(self): return False
    def evaluate(self, script): return {"visible":True,"focused":True}
    @property
    def frames(self): return [self]
    def screenshot(self, path=None, **kwargs):
        value = b"UNIT DIAGNOSTIC; not accepted evidence"
        if path is not None: Path(path).write_bytes(value)
        return value
    def locator(self, selector):
        if selector.startswith('input[type="password"]'): return types.SimpleNamespace(count=lambda:0)
        assert selector == ":root", "Failed preflight must not inspect scenario assertion targets"
        return types.SimpleNamespace(aria_snapshot=lambda **kwargs: "UNIT DIAGNOSTIC TREE")
class Context:
    closed = False
    def __init__(self, page): self.pages = [page]; page.context = self
    def route(self, *args): pass
    def route_web_socket(self, *args): pass
    def close(self): self.closed = True
page = Page(); context = Context(page); browser = Browser()
api = types.ModuleType("playwright.sync_api")
api.sync_playwright = lambda: contextlib.nullcontext(None)
api.Error = type("UnitPlaywrightError", (Exception,), {})
with tempfile.TemporaryDirectory() as output, \\
     patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
     patch.object(m.sys, "platform", "win32"), \\
     patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
     patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
     patch.object(m.policy_module, "open_context", return_value=(browser,context)):
    report = m.run(request, output, {"schemaVersion":1,"allowedTargets":[request["target"]],"assetHosts":[]})
assert page.removed and "pageerror" not in page.listeners
assert context.closed and not browser.is_connected()
assert report["rows"][0]["status"] == "inconclusive"
assert not report["rows"][0]["capturePreflight"]["noUnexpectedPageState"]
assert not report["rows"][0]["capturePostcheck"]["verified"]
assert report["rows"][0]["evidencePurpose"] == "environment-diagnostic"
assert len(report["rows"][0]["evidence"]) == 2
assert {item["path"] for item in report["rows"][0]["evidence"]} == {
    request["rows"][0]["id"] + ".png", request["rows"][0]["id"] + ".aria.txt"}
assert report["rows"][0]["pageErrors"] == ["unit page-script error"]
assert "no trigger" in report["rows"][0]["scenarioFailure"]
class Request:
    method = "POST"
    resource_type = "fetch"
    headers = {}
    post_data_buffer = b""
    def __init__(self, url): self.url = url
class Target:
    def count(self): return 1
    def aria_snapshot(self, **kwargs): return "UNIT TREE; not page evidence"
class BootstrapPage(Page):
    def __init__(self, mode): super().__init__(); self.mode = mode
    def goto(self, url, **kwargs):
        incoming = Request("https://telemetry.example.org/collect" if self.mode.startswith("telemetry") else
                           "https://example.org/required" if self.mode == "unexpected-network" else
                           "https://example.org/bootstrap")
        response = types.SimpleNamespace(request=incoming,status=200,
            headers={"content-type":"application/json"},
            body=lambda:json.dumps({"wrong":{}} if self.mode == "bad-response" else {"navigation":{}}).encode())
        incoming.response = lambda: response
        def send():
            if self.mode == "request-failed":
                self.listeners["requestfailed"](incoming)
            elif self.mode != "pending":
                self.listeners["response"](response)
                self.listeners["requestfinished"](incoming)
        self.aborted = False
        route = types.SimpleNamespace(request=incoming,continue_=send,
                                      abort=lambda:setattr(self,"aborted",True))
        self.context.router(route)
        if self.mode == "telemetry-page-error":
            self.listeners["pageerror"]("unit unhandled error")
        if self.mode == "telemetry-http-error":
            self.listeners["response"](types.SimpleNamespace(status=503,url="https://example.org/required?secret=redact",
                request=types.SimpleNamespace(resource_type="fetch")))
        return types.SimpleNamespace(status=200)
    def locator(self, selector):
        if selector.startswith('input[type="password"]'): return types.SimpleNamespace(count=lambda:0)
        return Target()
    def screenshot(self, path=None, **kwargs):
        value = b"UNIT IMAGE; not page evidence"
        if path is not None: Path(path).write_bytes(value)
        return value
    def get_by_role(self, role, **kwargs):
        page = self
        class ActionTarget:
            def count(self): raise AssertionError("Actions must use strict auto-wait, not a premature count")
            def click(self):
                if page.mode == "action-ambiguous": raise api.Error("strict mode violation")
                page.actionPerformed = True
            def get_attribute(self, name): return "password" if page.mode == "password" else "text"
            def fill(self, value): page.actionPerformed = True
        return ActionTarget()
    def wait_for_timeout(self, milliseconds): time.sleep(milliseconds / 1000)
class BootstrapContext(Context):
    def route(self, pattern, handler): self.router = handler
for mode in ("good","bad-response","unknown","pending","request-failed",
             "telemetry","telemetry-page-error","telemetry-http-error","unexpected-network",
             "action-wait","action-ambiguous","password","observe","observe-over-budget"):
    page = BootstrapPage(mode); context = BootstrapContext(page); browser = Browser()
    permission = {"url":"https://example.org/bootstrap","methods":["POST"],"resourceTypes":["fetch"]}
    if mode != "unknown":
        permission["readOnly"] = {"bodySha256":hashlib.sha256(b"").hexdigest(),"responseKeys":["navigation"]}
    policy = {"schemaVersion":3,"allowedTargets":[request["target"]],"assetHosts":[],
              "connection":{"mode":"ephemeral"},"requests":[permission],"scanner":None}
    if mode.startswith("telemetry") or mode == "unexpected-network":
        policy.update(schemaVersion=4,requests=[],telemetryBlocks=[{
            "url":"https://telemetry.example.org/collect","methods":["POST"],"resourceTypes":["fetch"],
            "qualification":"Synthetic out-of-band test channel; not UI data"}])
    scenario = copy.deepcopy(request)
    page.actionPerformed = False
    if mode in ("action-wait","action-ambiguous"):
        scenario["rows"][0]["steps"] = [{"action":"click","target":{"role":"button","name":"Async"}}]
    if mode == "password":
        scenario["rows"][0]["steps"] = [{"action":"fill","target":{"role":"textbox","name":"Async"},"value":"unit"}]
    if mode in ("observe","observe-over-budget"):
        scenario["rows"][0]["steps"] = [{"action":"observe","milliseconds":50 if mode == "observe" else 30000}]
        if mode == "observe-over-budget": scenario["budgetSeconds"] = 1
    if mode == "pending": scenario["budgetSeconds"] = 1
    with tempfile.TemporaryDirectory() as output, \\
         patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
         patch.object(m.sys, "platform", "win32"), \\
         patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
         patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
         patch.object(m.policy_module, "open_context", return_value=(browser,context)):
        report = m.run(scenario, output, policy)
    assert report["ownedBrowserClosed"] and page.removed
    if mode in ("observe","observe-over-budget"):
        row = report["rows"][0]
        if mode == "observe":
            assert row["status"] == "observed-no-issue"
            assert row["dwellObservations"][0]["state"] == "completed"
            assert row["dwellObservations"][0]["elapsedMilliseconds"] >= 40
        else:
            assert row["status"] == "blocked"
            assert not row.get("dwellObservations")
        continue
    if mode in ("action-wait","action-ambiguous","password"):
        assert page.actionPerformed == (mode == "action-wait")
        assert report["rows"][0]["status"] == ("observed-no-issue" if mode == "action-wait" else "blocked")
        continue
    if mode.startswith("telemetry") or mode == "unexpected-network":
        assert page.aborted and not report["transactions"]
        assert report["blockedRequests"][0]["expectedTelemetryDenial"] == mode.startswith("telemetry")
        assert report["rows"][0]["status"] == ("observed-no-issue" if mode == "telemetry" else "inconclusive")
        if mode == "telemetry-page-error":
            assert report["rows"][0]["pageErrors"] == ["unit unhandled error"]
        if mode == "telemetry-http-error":
            assert report["failedResponses"][0]["status"] == 503
            assert report["failedResponses"][0]["url"] == "https://example.org/required"
        continue
    transaction = report["transactions"][0]
    if mode == "good":
        assert transaction["state"] == "read-only-confirmed"
        assert report["rows"][0]["status"] == "observed-no-issue"
        assert len(report["rows"][0]["evidence"]) == 2
        assert not report.get("unresolvedTransaction")
    else:
        assert transaction["state"] != "read-only-confirmed"
        assert report["rows"][0]["status"] == "inconclusive"
        assert report["unresolvedTransaction"]
        assert report["rows"][0]["evidencePurpose"] == "environment-diagnostic"
class DeniedPage(Page):
    def goto(self, url, **kwargs):
        incoming = Request("https://example.org/blocked?token=private-query")
        incoming.post_data_buffer = b"private-request-body"
        self.context.router(types.SimpleNamespace(request=incoming,
            continue_=lambda: (_ for _ in ()).throw(AssertionError("Denied request was sent")),
            abort=lambda: None))
        return types.SimpleNamespace(status=200)
page = DeniedPage(); context = BootstrapContext(page); browser = Browser()
with tempfile.TemporaryDirectory() as output, \\
     patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
     patch.object(m.sys, "platform", "win32"), \\
     patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
     patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
     patch.object(m.policy_module, "open_context", return_value=(browser,context)):
    report = m.run(request, output, {"schemaVersion":1,"allowedTargets":[request["target"]],"assetHosts":[]})
assert report["rows"][0]["status"] == "inconclusive"
assert report["rows"][0]["evidencePurpose"] == "environment-diagnostic"
assert report["blockedRequests"] == [{"url":"https://example.org/blocked","type":"fetch",
    "method":"POST","hasQuery":True,"bodyBytes":len(b"private-request-body"),
    "queryKeys":["token"],"queryKeysComplete":True,"duplicateQueryKeys":False,
    "expectedTelemetryDenial":False}]
assert "private-query" not in json.dumps(report) and "private-request-body" not in json.dumps(report)
class DiagnosticFailurePage(Page):
    def screenshot(self, **kwargs): raise api.Error("unit diagnostic capture failed")
page = DiagnosticFailurePage(); context = Context(page); browser = Browser()
with tempfile.TemporaryDirectory() as output, \\
     patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
     patch.object(m.sys, "platform", "win32"), \\
     patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
     patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
     patch.object(m.policy_module, "open_context", return_value=(browser,context)):
    report = m.run(request, output, {"schemaVersion":1,"allowedTargets":[request["target"]],"assetHosts":[]})
assert report["rows"][0]["status"] == "inconclusive"
assert report["rows"][0]["diagnosticCaptureError"] == "unit diagnostic capture failed"
assert "no trigger" in report["rows"][0]["scenarioFailure"]
assert report["ownedBrowserClosed"] and page.removed
class CredentialPage(Page):
    def locator(self, selector):
        if selector.startswith('input[type="password"]'): return types.SimpleNamespace(count=lambda:1)
        raise AssertionError("Credential page must not be inspected")
    def screenshot(self, **kwargs): raise AssertionError("Credential page must not be captured")
page = CredentialPage(); context = Context(page); browser = Browser()
with tempfile.TemporaryDirectory() as output, \\
     patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
     patch.object(m.sys, "platform", "win32"), \\
     patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
     patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
     patch.object(m.policy_module, "open_context", return_value=(browser,context)):
    report = m.run(request, output, {"schemaVersion":1,"allowedTargets":[request["target"]],"assetHosts":[]})
assert report["rows"][0]["status"] == "inconclusive"
assert "Credential-entry" in report["rows"][0]["diagnosticCaptureError"]
assert "evidence" not in report["rows"][0]
class CredentialFramePage(Page):
    @property
    def frames(self):
        return [self, types.SimpleNamespace(locator=lambda selector:types.SimpleNamespace(count=lambda:1))]
    def screenshot(self, **kwargs): raise AssertionError("Credential frame must not be captured")
page = CredentialFramePage(); context = Context(page); browser = Browser()
with tempfile.TemporaryDirectory() as output, \\
     patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
     patch.object(m.sys, "platform", "win32"), \\
     patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
     patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
     patch.object(m.policy_module, "open_context", return_value=(browser,context)):
    report = m.run(request, output, {"schemaVersion":1,"allowedTargets":[request["target"]],"assetHosts":[]})
assert report["rows"][0]["status"] == "inconclusive"
assert "Credential-entry" in report["rows"][0]["diagnosticCaptureError"]
assert "evidence" not in report["rows"][0]
class RedirectDuringDiagnostic(Page):
    def screenshot(self, **kwargs):
        self.url = "https://example.org/login"
        return b"UNIT DIAGNOSTIC"
class OversizedDiagnostic(Page):
    def screenshot(self, **kwargs): return b"x" * (4 * 1024 * 1024 + 1)
for page_class, expected_error in ((RedirectDuringDiagnostic,"unqualified"),(OversizedDiagnostic,"4MiB")):
    page = page_class(); context = Context(page); browser = Browser()
    with tempfile.TemporaryDirectory() as output, \\
         patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
         patch.object(m.sys, "platform", "win32"), \\
         patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
         patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
         patch.object(m.policy_module, "open_context", return_value=(browser,context)):
        report = m.run(request, output, {"schemaVersion":1,"allowedTargets":[request["target"]],"assetHosts":[]})
        assert not list(Path(output).rglob("*.png")) and not list(Path(output).rglob("*.aria.txt"))
    assert report["rows"][0]["status"] == "inconclusive"
    assert expected_error in report["rows"][0]["diagnosticCaptureError"]
    assert "evidence" not in report["rows"][0] and report["ownedBrowserClosed"]
class ChangingHealthPage(BootstrapPage):
    def __init__(self): super().__init__("good"); self.health_calls = 0
    def evaluate(self, script):
        if script == "document.hasFocus()": return True
        self.health_calls += 1
        return {"visible":True,"focused":self.health_calls == 1}
page = ChangingHealthPage(); context = BootstrapContext(page); browser = Browser()
with tempfile.TemporaryDirectory() as output, \\
     patch.dict(sys.modules, {"playwright":types.ModuleType("playwright"),"playwright.sync_api":api}), \\
     patch.object(m.sys, "platform", "win32"), \\
     patch.dict(os.environ, {"CODESPACES":"false","CODESPACE_NAME":""}), \\
     patch.object(m.importlib.metadata, "version", return_value="unit-only"), \\
     patch.object(m.policy_module, "open_context", return_value=(browser,context)):
    report = m.run(request, output, {"schemaVersion":3,"allowedTargets":[request["target"]],"assetHosts":[],
        "connection":{"mode":"ephemeral"},"requests":[{
            "url":"https://example.org/bootstrap","methods":["POST"],"resourceTypes":["fetch"],
            "readOnly":{"bodySha256":hashlib.sha256(b"").hexdigest(),"responseKeys":["navigation"]}
        }],"scanner":None})
assert report["rows"][0]["status"] == "inconclusive"
assert report["rows"][0]["evidencePurpose"] == "environment-diagnostic"
assert "Environment changed" in report["rows"][0]["scenarioFailure"]
assert len(report["rows"][0]["evidence"]) == 2
print("Mocked event mapping only; no browser or AT execution")
`;
  const result = spawnSync('python', ['-I', '-B', '-', path], { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no browser or AT execution/);
});

test('denied request query diagnostics expose bounded names, never values or malformed keys', () => {
  const path = fileURLToPath(new URL('../src/browser/browser_runner.py', import.meta.url));
  const script = `
import importlib.util, json, sys
spec = importlib.util.spec_from_file_location("browser_runner", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
assert m.query_shape("") == {"queryKeys":[],"queryKeysComplete":True,"duplicateQueryKeys":False}
shape = m.query_shape("Locale=en-us&$expand=private-value&token=private-token&empty=")
assert shape == {"queryKeys":["$expand","Locale","empty","token"],
                 "queryKeysComplete":True,"duplicateQueryKeys":False}
assert "private" not in json.dumps(shape)
assert m.query_shape("v=1&v=2")["duplicateQueryKeys"] is True
assert m.query_shape("%76=1&v=2")["duplicateQueryKeys"] is True
for query in ("x="+"a"*8192, "&".join("x=1" for _ in range(41)),
              "bad%20name=value", "a"*65+"=value", "%FF=value"):
    assert m.query_shape(query) == {"queryKeys":[],"queryKeysComplete":False,"duplicateQueryKeys":None}
assert "playwright" not in sys.modules
`;
  const result = spawnSync('python', ['-I', '-B', '-', path], { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
});

test('v4 query/frame/auth scopes stay bounded and telemetry denials never grant network access', () => {
  const path = fileURLToPath(new URL('../src/browser/browser_runner.py', import.meta.url));
  const script = `
import copy, importlib.util, pathlib, sys
from types import SimpleNamespace as NS
spec=importlib.util.spec_from_file_location("runner",sys.argv[1])
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
target="https://example.org/page"
base={"schemaVersion":4,"allowedTargets":[target],"assetHosts":[],
      "connection":{"mode":"persistent","userDataDirectory":str(pathlib.Path.cwd()),
                    "authenticationOrigins":["https://login.example.org/"],"timeoutSeconds":30,"ready":{"css":"#main"}},
      "requests":[
        {"url":"https://example.org/config","methods":["GET"],"resourceTypes":["fetch"],"queryKeys":["locale","v"]},
        {"url":"https://broker.example.org/frame","methods":["GET"],"resourceTypes":["document"],
         "queryKeys":["origin","state"],"frame":True},
        {"url":"https://login.example.org/token","methods":["POST"],"resourceTypes":["fetch"],
         "queryKeys":["request-id"],"authentication":True}],
      "telemetryBlocks":[{"url":"https://telemetry.example.org/collect","methods":["POST"],"resourceTypes":["xhr"],
                         "qualification":"Synthetic telemetry transport, not feature data"}],"scanner":None}
m.validate_policy(base)
root=NS(url=target,parent_frame=None)
request=NS(url="https://example.org/config?locale=en-US&v=1",method="GET",resource_type="fetch",frame=root)
assert m.policy_module.permits(base,target,request)
for url in ("https://example.org/config?locale=en-US&extra=1",
            "https://example.org/config?locale=en&locale=fr",
            "https://other.example.org/config?locale=en"):
    request.url=url
    assert not m.policy_module.permits(base,target,request)
request.url="https://broker.example.org/frame?origin=https%3A%2F%2Fexample.org&state=opaque"
request.resource_type="document";request.frame=NS(url="about:blank",parent_frame=root)
assert m.policy_module.permits(base,target,request)
request.frame=root
assert not m.policy_module.permits(base,target,request)
request.frame=NS(url="about:blank",parent_frame=NS(url="https://example.org/other",parent_frame=None))
assert not m.policy_module.permits(base,target,request)
request.frame=NS(url="about:blank",parent_frame=root)
request.url="https://broker.example.org/frame?origin=https%3A%2F%2Fother.example.org"
assert not m.policy_module.permits(base,target,request)
request.url="https://login.example.org/token?request-id=opaque";request.method="POST";request.resource_type="fetch";request.frame=root
assert m.policy_module.permits(base,target,request)
request.url += "&extra=1"
assert not m.policy_module.permits(base,target,request,authenticating=True)
request.url="https://login.example.org/token?request-id=opaque";request.frame=None
assert not m.policy_module.permits(base,target,request)
request.url="https://telemetry.example.org/collect?secret=not-recorded";request.resource_type="xhr"
assert m.policy_module.telemetry_block(base,request)
assert not m.policy_module.permits(base,target,request,authenticating=True)
variants=[]
bad=copy.deepcopy(base);bad["schemaVersion"]=3;variants.append(bad)
bad=copy.deepcopy(base);bad["requests"][0]["methods"]=["POST"];variants.append(bad)
bad=copy.deepcopy(base);bad["requests"][0]["url"]+="?locale=en";variants.append(bad)
bad=copy.deepcopy(base);bad["requests"][0]["queryKeys"]=["v","v"];variants.append(bad)
bad=copy.deepcopy(base);bad["requests"][1]["frame"]=False;variants.append(bad)
bad=copy.deepcopy(base);bad["requests"][2]["url"]="https://untrusted.example.org/token";variants.append(bad)
bad=copy.deepcopy(base);bad["telemetryBlocks"][0]["resourceTypes"]=["script"];variants.append(bad)
bad=copy.deepcopy(base);bad["telemetryBlocks"][0]["methods"]=["DELETE"];variants.append(bad)
bad=copy.deepcopy(base);bad["telemetryBlocks"][0]["qualification"]="";variants.append(bad)
for policy in variants:
    try:m.validate_policy(policy)
    except ValueError:pass
    else:raise AssertionError("Unbounded network scope accepted")
assert "playwright" not in sys.modules
print("Scoped policy only; no browser or AT execution")
`;
  const result = spawnSync('python', ['-I', '-B', '-', path], { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no browser or AT execution/);
});

test('qualified bootstrap rules bind empty bodies and JSON responses without exempting unknown mutations', () => {
  const path = fileURLToPath(new URL('../src/browser/browser_runner.py', import.meta.url));
  const script = `
import copy, hashlib, importlib.util, json, pathlib, sys
from types import SimpleNamespace
spec = importlib.util.spec_from_file_location("browser_runner", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
empty = hashlib.sha256(b"").hexdigest()
rule = {"url":"https://example.org/bootstrap","methods":["POST"],"resourceTypes":["fetch"],
        "readOnly":{"bodySha256":empty,"responseKeys":["navigation"]}}
policy = {"schemaVersion":3,"allowedTargets":["https://example.org/demo"],"assetHosts":[],
          "connection":{"mode":"ephemeral"},"requests":[rule],"scanner":None}
m.validate_policy(policy)
request = SimpleNamespace(url=rule["url"],method="POST",resource_type="fetch",headers={},post_data_buffer=b"")
assert m.policy_module.permits(policy, policy["allowedTargets"][0], request)
for headers, body in (({},b"change"),({"X-HTTP-Method":"DELETE"},b""),
                      ({"x-http-method-override":"PUT"},b""),
                      ({"content-length":"1"},None),({"transfer-encoding":"chunked"},None)):
    request.headers, request.post_data_buffer = headers, body
    assert not m.policy_module.permits(policy, policy["allowedTargets"][0], request)
request.headers, request.post_data_buffer = {}, b""
auth = copy.deepcopy(policy)
auth["connection"] = {"mode":"persistent","userDataDirectory":str(pathlib.Path.cwd()),
                      "authenticationOrigins":["https://example.org"],"timeoutSeconds":30,"ready":{"css":"#main"}}
m.validate_policy(auth)
request.post_data_buffer = b"change"
assert not m.policy_module.permits(auth, auth["allowedTargets"][0], request, authenticating=True)
request.post_data_buffer = b""
bad = []
value=copy.deepcopy(policy);value["schemaVersion"]=2;bad.append(value)
value=copy.deepcopy(policy);value["requests"].append(copy.deepcopy(rule));bad.append(value)
value=copy.deepcopy(policy);value["requests"][0]["readOnly"]["bodySha256"]="0"*64;bad.append(value)
value=copy.deepcopy(policy);value["requests"][0]["methods"]=["DELETE"];bad.append(value)
value=copy.deepcopy(policy);value["requests"][0]["resourceTypes"]=["document"];bad.append(value)
value=copy.deepcopy(policy);value["requests"][0]["readOnly"]["responseKeys"]=[];bad.append(value)
value=copy.deepcopy(policy);value["requests"][0]["readOnly"]["responseKeys"]=["navigation","navigation"];bad.append(value)
for value in bad:
    try: m.validate_policy(value)
    except ValueError: pass
    else: raise AssertionError("Unqualified/ambiguous permission accepted")
transaction={"state":"read-only-pending","bodySha256":empty,"responseKeys":["navigation"]}
report={"transactions":[transaction]}
assert m.unresolved_transactions(report,0)
response=SimpleNamespace(status=200,headers={"content-type":"application/json; charset=utf-8"},
                         body=lambda:json.dumps({"navigation":{"secret":"not-recorded"}}).encode())
m.confirm_read_only_response(transaction,response)
assert not m.unresolved_transactions(report,0)
assert "not-recorded" not in json.dumps(report)
report["transactions"].append({"state":"submitted-unknown"})
assert m.unresolved_transactions(report,0)
for state in ("submitted-unknown","read-only-unverified"):
    try: m.confirm_read_only_response({"state":state,"responseKeys":["navigation"]},response)
    except ValueError: pass
    else: raise AssertionError("Unqualified transaction was reclassified")
for status, content_type, data in ((500,"application/json",{"navigation":{}}),
                                  (200,"text/html",{"navigation":{}}),
                                  (200,"application/json",{"other":{}}),
                                  (200,"application/json",[])):
    item={"state":"read-only-pending","responseKeys":["navigation"]}
    reply=SimpleNamespace(status=status,headers={"content-type":content_type},body=lambda:json.dumps(data).encode())
    try: m.confirm_read_only_response(item,reply)
    except ValueError: pass
    else: raise AssertionError("Unexpected response was confirmed")
    assert m.unresolved_transactions({"transactions":[item]},0)
oversized=SimpleNamespace(status=200,headers={"content-type":"application/json"},body=lambda:b" "*(4*1024*1024+1))
try: m.confirm_read_only_response({"state":"read-only-pending","responseKeys":["navigation"]},oversized)
except ValueError: pass
else: raise AssertionError("Unbounded bootstrap response accepted")
legacy=copy.deepcopy(policy);legacy["schemaVersion"]=2;del legacy["requests"][0]["readOnly"]
m.validate_policy(legacy)
request.post_data_buffer=b"ordinary-authorized-transaction"
assert m.policy_module.permits(legacy,legacy["allowedTargets"][0],request)
assert "playwright" not in sys.modules
print("Policy and response qualification only; no browser or AT execution")
`;
  const result = spawnSync('python', ['-I', '-B', '-', path], { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no browser or AT execution/);
});
