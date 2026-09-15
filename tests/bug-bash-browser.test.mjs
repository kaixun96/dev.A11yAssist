import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyBrowserObservations } from '../src/runtime/browser-contract.mjs';

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
import contextlib, importlib.util, os, sys, tempfile, types
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
print("Mocked event mapping only; no browser or AT execution")
`;
  const result = spawnSync('python', ['-I', '-B', '-', path], { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /no browser or AT execution/);
});
