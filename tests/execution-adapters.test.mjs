import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { hostAuthorization, validateHostAuthentication } from '../src/native/host-auth.mjs';
import { validateBrowserParameters, verifyBrowserObservations } from '../src/runtime/browser-contract.mjs';

test('host-managed authentication binds tenant/audience and never falls back or leaks CLI output', async () => {
  const provider = { authentication: { kind: 'azure-cli', executable: process.execPath,
    executableSha256: createHash('sha256').update(await readFile(process.execPath)).digest('hex'),
    prefixArgs: ['-I', '-m', 'azure.cli'], tenantId: '11111111-2222-3333-4444-555555555555' } };
  const token = { accessToken: 'synthetic-token', tokenType: 'Bearer',
    tenant: provider.authentication.tenantId, expires_on: Math.floor(Date.now() / 1000) + 3600 };
  let called = 0;
  const runCli = async (executable, args) => {
    called++;
    assert.equal(executable, process.execPath);
    assert.deepEqual(args, ['-I', '-m', 'azure.cli', 'account', 'get-access-token',
      '--tenant', provider.authentication.tenantId, '--resource', '499b84ac-1321-427f-aa17-267ca6975798',
      '--output', 'json', '--only-show-errors']);
    return JSON.stringify(token);
  };
  assert.equal(await hostAuthorization(provider, 'ado', { runCli }), 'Bearer synthetic-token');
  assert.equal(called, 1);
  for (const change of [
    value => { value.tenant = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'; },
    value => { value.expires_on = 0; },
    value => { value.accessToken = 'bad\ntoken'; },
    value => { value.tokenType = 'Basic'; }
  ]) {
    const value = structuredClone(token); change(value);
    await assert.rejects(hostAuthorization(provider, 'ado', { runCli: async () => JSON.stringify(value) }));
  }
  await assert.rejects(hostAuthorization(provider, 'ado', { runCli: async () => '{"private-token":' }),
    error => !error.message.includes('private-token') && /not valid JSON/.test(error.message));
  await assert.rejects(hostAuthorization({ authentication: { ...provider.authentication, executableSha256: '0'.repeat(64) } },
    'ado', { runCli: async () => { throw new Error('must not execute'); } }), /hash changed/);
  assert.throws(() => validateHostAuthentication({ ...provider, authorizationEnvironmentVariable: 'TOKEN' }), /exactly one/);
  assert.throws(() => validateHostAuthentication({ authentication: { ...provider.authentication,
    prefixArgs: ['-c', 'arbitrary'] } }), /fixed launcher/);
  assert.equal(await hostAuthorization({ authorizationEnvironmentVariable: 'TOKEN' }, 'ado',
    { environment: { TOKEN: 'Basic synthetic' } }), 'Basic synthetic');
  await assert.rejects(hostAuthorization({ authorizationEnvironmentVariable: 'TOKEN' }, 'devcenter',
    { environment: { TOKEN: 'Basic synthetic' } }), /Bearer/);
});

test('persistent browser/network, authentication and scanner adapters execute their real API paths with offline doubles', () => {
  const runner = fileURLToPath(new URL('../src/browser/browser_runner.py', import.meta.url));
  const result = spawnSync('python', ['-I', '-B', '-', runner], { encoding: 'utf8', timeout: 15000, input: `
import copy, hashlib, importlib.util, pathlib, sys, tempfile
from types import SimpleNamespace
spec = importlib.util.spec_from_file_location("runner", sys.argv[1])
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as tmp:
    policy = {"schemaVersion":2,"allowedTargets":["https://example.org/demo"],"assetHosts":[],
      "connection":{"mode":"persistent","userDataDirectory":tmp,
        "authenticationOrigins":["https://login.example.org"],"timeoutSeconds":2,"ready":{"css":"#ready"}},
      "requests":[{"url":"https://example.org/api/query","methods":["GET"],"resourceTypes":["fetch","xhr"]}],
      "scanner":None}
    m.validate_policy(policy)
    request = lambda url, method="GET", kind="fetch": SimpleNamespace(url=url, method=method, resource_type=kind)
    assert m.policy_module.permits(policy,policy["allowedTargets"][0],request("https://example.org/api/query"))
    for bad in [request("https://example.org/api/query","POST"),
                request("https://example.org/api/query?unapproved=1"),
                request("https://other.example/api/query")]:
        assert not m.policy_module.permits(policy,policy["allowedTargets"][0],bad)
    login = request("https://login.example.org/oauth","POST","document")
    assert m.policy_module.permits(policy,policy["allowedTargets"][0],login,True)
    assert not m.policy_module.permits(policy,policy["allowedTargets"][0],login,False)
    for key,value in [("authenticationOrigins",["https://login.example.org/route"]),
                      ("timeoutSeconds",True),("ready",{"css":"body input"})]:
        bad = copy.deepcopy(policy); bad["connection"][key] = value
        try:m.validate_policy(bad)
        except ValueError:pass
        else:raise AssertionError("Invalid connection accepted")
    calls = []
    class Chromium:
        def launch_persistent_context(self, profile, **options):
            calls.append((profile,options)); return SimpleNamespace(browser="owned-browser")
        def launch(self, **options): raise AssertionError("No fallback/new context")
    req={"target":policy["allowedTargets"][0],"viewport":{"width":1280,"height":720}}
    browser,context=m.policy_module.open_context(SimpleNamespace(chromium=Chromium()),req,policy)
    assert browser=="owned-browser" and len(calls)==1 and calls[0][1]["headless"] is False
    class FailedBrowser:
        closed=False
        def new_context(self,**options):raise RuntimeError("synthetic context failure")
        def close(self):self.closed=True
    failed=FailedBrowser()
    try:m.policy_module.open_context(SimpleNamespace(chromium=SimpleNamespace(launch=lambda **kw:failed)),
                                    req,{**policy,"connection":{"mode":"ephemeral"}})
    except RuntimeError:pass
    else:raise AssertionError("Context failure was swallowed")
    assert failed.closed
    class Page:
        url="https://login.example.org/oauth"
        clock=0
        def locator(self,css):
            assert css=="#ready"; return SimpleNamespace(count=lambda:1,is_visible=lambda:True)
        def wait_for_timeout(self,ms):
            self.clock+=ms/1000; self.url=req["target"]
    page=Page()
    m.policy_module.wait_authenticated(page,req,policy,10,lambda:page.clock)
    assert page.clock>0 and page.url==req["target"]
    class Stuck(Page):
        def wait_for_timeout(self,ms):self.clock+=ms/1000
    page=Stuck()
    try:m.policy_module.wait_authenticated(page,req,policy,10,lambda:page.clock)
    except RuntimeError:pass
    else:raise AssertionError("Login never reached target")
    scanner=pathlib.Path(tmp)/"axe.js"; scanner.write_text("synthetic fixture bytes")
    policy["scanner"]={"path":str(scanner),"sha256":hashlib.sha256(scanner.read_bytes()).hexdigest()}
    engine={"version":"4.test","violations":[{"id":"synthetic-rule"}],"incomplete":[]}
    class Target:
        def count(self):return 1
        def evaluate(self,script,argument=None):
            if "axe.run" in script:return engine
            return {"width":20,"height":30,"x":1,"y":2,"deviceScale":1.25}
    class MeasuredPage:
        def locator(self,css):return Target()
        def add_script_tag(self,content):assert content=="synthetic fixture bytes"
    page=MeasuredPage()
    size={"kind":"target-size","target":{"css":"#button"},"minimum":{"width":24,"height":24},"expected":True}
    result=m.observe(page,size,policy)
    assert result["actual"] is False and result["measurement"]["width"]==20
    scan={"kind":"axe-violations","target":{"css":"#main"},"expected":0}
    result=m.observe(page,scan,policy)
    assert result["actual"]==1 and result["scanner"]["version"]=="4.test"
    engine["incomplete"]=[{"id":"needs-review"}]
    assert m.observe(page,scan,policy)["scanner"]["incomplete"]
    scanner.write_text("changed")
    try:m.observe(page,scan,policy)
    except ValueError:pass
    else:raise AssertionError("Changed scanner executed")
    base={"schemaVersion":1,"taskId":"adapter-unit","target":req["target"],"viewport":req["viewport"],
          "budgetSeconds":60,"rows":[{"id":"measure","steps":[],"assertions":[size,scan]}]}
    m.validate_request(base)
assert "playwright" not in sys.modules
print("Offline adapters only; no UI, network or credentials used")
` });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Offline adapters only/);
});

test('measurement/scanner conclusive results are independently recalculated and reject incomplete engine output', () => {
  const size = { kind: 'target-size', target: { css: '#button' }, minimum: { width: 24, height: 24 }, expected: true };
  const scan = { kind: 'axe-violations', target: { css: '#main' }, expected: 0 };
  validateBrowserParameters({ steps: [], assertions: [size, scan] });
  const request = { schemaVersion: 1, taskId: 'adapter-unit', target: 'https://example.org/demo',
    budgetSeconds: 60, viewport: { width: 1280, height: 720 },
    rows: [{ id: 'measure', steps: [], assertions: [size, scan] }] };
  const health = { verified: true, url: request.target, viewport: request.viewport, visible: true,
    documentFocused: true, singlePage: true, noUnexpectedPageState: true };
  const report = { request, rows: [{ id: 'measure', status: 'finding', attempted: true, steps: [],
    capturePreflight: health, capturePostcheck: health, observations: [
      { assertion: size, actual: false, met: false, measurement: { width: 20, height: 30, x: 0, y: 0, deviceScale: 1 } },
      { assertion: scan, actual: 0, met: true, scanner: { version: '4.test', violations: [], incomplete: [] } }
    ] }] };
  verifyBrowserObservations(report, request);
  for (const change of [
    row => { row.observations[0].measurement.width = 30; },
    row => { row.observations[1].scanner.incomplete = [{ id: 'review' }]; },
    row => { row.observations[1].scanner.violations = [{ id: 'failed' }]; }
  ]) {
    const value = structuredClone(report); change(value.rows[0]);
    assert.throws(() => verifyBrowserObservations(value, request));
  }
});
