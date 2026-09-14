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
