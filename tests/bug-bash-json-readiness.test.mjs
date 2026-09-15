import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('JSON readiness is explicitly protected, bounded and distinct from HTML authentication', () => {
  const path = fileURLToPath(new URL('../src/browser/browser_policy.py', import.meta.url));
  const script = `
import copy, importlib.util, pathlib, sys
spec = importlib.util.spec_from_file_location("policy", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
target = "https://example.org/read-only-state"
policy = {"schemaVersion":6, "allowedTargets":[target], "assetHosts":[],
    "connection":{"mode":"persistent","userDataDirectory":str(pathlib.Path.cwd()),
        "authenticationOrigins":["https://login.example.org"],"timeoutSeconds":1,
        "ready":{"jsonResponseKeys":["items"]}},
    "requests":[], "scanner":None, "telemetryBlocks":[]}
m.validate(policy)
for ready in [{"jsonResponseKeys":[]}, {"jsonResponseKeys":["items","items"]},
              {"jsonResponseKeys":["bad.key"]}, {"jsonResponseKeys":[True]},
              {"jsonResponseKeys":["items"],"css":"#main"}, {"jsonResponseKeys":"items"},
              {"jsonResponseKeys":["x"] * 21}]:
    invalid = copy.deepcopy(policy); invalid["connection"]["ready"] = ready
    try: m.validate(invalid)
    except ValueError: pass
    else: raise AssertionError("Invalid readiness declaration accepted")
for version in (2,3,4,5):
    legacy = copy.deepcopy(policy); legacy["schemaVersion"] = version
    if version < 4: legacy.pop("telemetryBlocks")
    try: m.validate(legacy)
    except ValueError: pass
    else: raise AssertionError("JSON readiness enabled on legacy policy")
    legacy["connection"]["ready"] = {"css":"#main"}
    m.validate(legacy)

class Body:
    count_value = 1
    visible = True
    text = '{"items":[]}'
    def count(self): return self.count_value
    def is_visible(self): return self.visible
    def evaluate(self, script):
        assert "65536" in script and "textContent" in script
        return self.text if len(self.text) <= 65536 else None

class Page:
    def __init__(self):
        self.body = Body(); self.content_type = "application/json"
        self.url = target; self.clock = 0; self.redirect_on_read = False; self.expire_on_read = False
    def evaluate(self, script):
        assert script == "document.contentType"
        if self.redirect_on_read: self.url = "https://login.example.org"
        if self.expire_on_read: self.clock = 2
        return self.content_type
    def locator(self, selector):
        assert selector in ("body > pre", "#main")
        return self.body
    def wait_for_timeout(self, milliseconds): self.clock += milliseconds / 1000

page = Page()
assert m.json_document_ready(page, ["items"])
page.content_type = "application/problem+json"
assert m.json_document_ready(page, ["items"])
for content_type in ("text/html", "text/plain", "text/json"):
    page.content_type = content_type
    assert not m.json_document_ready(page, ["items"])
page.content_type = "application/json"
for text in ('[]', 'null', 'true', '{"error":"denied"}', '{"items":',
             '{"items":[],"items":[1]}', '{"items":{"nested":1,"nested":2}}',
             '{"items":NaN}', '{"items":Infinity}', '{"items":"' + "x" * 65536 + '"}',
             '{"items":"' + chr(233) * 33000 + '"}'):
    page.body.text = text
    assert not m.json_document_ready(page, ["items"])
page.body.text = '{"items":[]}'
for count in (0,2):
    page.body.count_value = count
    assert not m.json_document_ready(page, ["items"])
page.body.count_value = 1; page.body.visible = False
assert not m.json_document_ready(page, ["items"])
page = Page()
m.wait_authenticated(page, {"target":target}, policy, 1, lambda:page.clock)
for mode in ("redirect", "expire", "wrong-url", "wrong-shape"):
    page = Page()
    page.redirect_on_read = mode == "redirect"; page.expire_on_read = mode == "expire"
    if mode == "wrong-url": page.url = "https://example.org/unapproved"
    if mode == "wrong-shape": page.body.text = '{"error":"denied"}'
    try: m.wait_authenticated(page, {"target":target}, policy, 1, lambda:page.clock)
    except RuntimeError: pass
    else: raise AssertionError("Unqualified JSON target/shape/deadline admitted")
html = copy.deepcopy(policy); html["connection"]["ready"] = {"css":"#main"}
page = Page()
m.wait_authenticated(page, {"target":target}, html, 1, lambda:page.clock)
assert "playwright" not in sys.modules
print("Policy-only checks; no browser, credentials, network or AT")
`;
  const result = spawnSync('python', ['-I', '-B', '-', path], {
    input: script, encoding: 'utf8', timeout: 10000
  });
  assert.equal(result.status, 0, result.stderr);
});
