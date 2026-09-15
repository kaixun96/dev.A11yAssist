import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('protected media preferences are explicit, reversible and preserve legacy defaults', () => {
  const path = fileURLToPath(new URL('../src/browser/browser_policy.py', import.meta.url));
  const script = `
import copy,importlib.util,sys
spec=importlib.util.spec_from_file_location("policy",sys.argv[1])
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
base={"schemaVersion":8,"allowedTargets":["https://example.org/feature"],"assetHosts":[],
      "connection":{"mode":"ephemeral"},"requests":[],"scanner":None,"telemetryBlocks":[]}
m.validate(base)
class Page:
    def __init__(self): self.calls=[]
    def emulate_media(self,**kwargs): self.calls.append(kwargs)
page=Page();m.configure_media(page,base);assert page.calls==[]
valid=copy.deepcopy(base)
valid["media"]={"forcedColors":"system","colorScheme":"dark","reducedMotion":"no-preference","contrast":"more"}
m.validate(valid);m.configure_media(page,valid)
assert page.calls==[{"forced_colors":"null","color_scheme":"dark","reduced_motion":"no-preference","contrast":"more"}]
for name in ("forcedColors","colorScheme","reducedMotion","contrast"):
    value=copy.deepcopy(base);value["media"]={name:"system"}
    m.validate(value);m.configure_media(page,value)
    assert list(page.calls[-1].values())==["null"]
for media in ({},{"forcedColors":True},{"forcedColors":"automatic"},{"unknown":"system"},
              {"colorScheme":"dark","script":"arbitrary()"},["system"]):
    value=copy.deepcopy(base);value["media"]=media
    try:m.validate(value)
    except ValueError:pass
    else:raise AssertionError("Unsafe media declaration accepted")
for version in (2,3,4,5,6,7):
    value=copy.deepcopy(base);value["schemaVersion"]=version
    if version<4:value.pop("telemetryBlocks")
    m.validate(value)
    value["media"]={"forcedColors":"active"}
    try:m.validate(value)
    except ValueError:pass
    else:raise AssertionError("Legacy policy silently gained visual overrides")
assert "playwright" not in sys.modules
print("No browser, OS settings, network or AT changed")
`;
  const result = spawnSync('python', ['-I', '-B', '-', path],
    { input: script, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.stderr);
});
