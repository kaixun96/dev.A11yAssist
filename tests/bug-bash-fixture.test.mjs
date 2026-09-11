import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('fixture request and host gates are checkable without Playwright or a browser', () => {
  const runner = fileURLToPath(new URL('../src/bug-bash/fixture_runner.py', import.meta.url));
  const result = spawnSync(process.platform === 'win32' ? 'python' : 'python3', ['-B', '-c', `
import importlib.util, pathlib, sys, tempfile
spec = importlib.util.spec_from_file_location("fixture_runner", sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
valid = dict(schemaVersion=1, taskId="fixture-test", fixture="dialog-form-v1", repetitions=2)
assert module.validate_request(valid) is valid
for change in [
    dict(schemaVersion=True), dict(schemaVersion="1"), dict(taskId="1234"),
    dict(taskId="../escape"), dict(taskId=["fixture-test"]), dict(fixture=["dialog-form-v1"]),
    dict(fixture="product"), dict(repetitions=True), dict(repetitions="2"),
    dict(repetitions=0), dict(repetitions=4), dict(command="not permitted")
]:
    try:
        module.validate_request(dict(valid, **change))
    except ValueError:
        pass
    else:
        raise AssertionError(change)
assert "playwright.sync_api" not in sys.modules
with tempfile.TemporaryDirectory() as folder:
    module.sys.platform = "unsupported"
    try:
        module.run(valid, folder)
    except RuntimeError as error:
        assert "Unsupported host" in str(error)
    else:
        raise AssertionError("Unsupported host executed")
    assert list(pathlib.Path(folder).iterdir()) == []
    module.sys.platform = "win32"
    module.os.environ["CODESPACES"] = "true"
    try:
        module.run(valid, folder)
    except RuntimeError:
        pass
    else:
        raise AssertionError("Codespace executed")
    assert list(pathlib.Path(folder).iterdir()) == []
    module.os.environ.pop("CODESPACES", None)
    module.os.environ.pop("CODESPACE_NAME", None)
    try:
        module.run(valid, str(pathlib.Path(sys.argv[1]).parent))
    except ValueError as error:
        assert "outside" in str(error)
    else:
        raise AssertionError("Plugin output was accepted")
    (pathlib.Path(folder) / "fixture").mkdir()
    try:
        module.run(valid, folder)
    except FileExistsError:
        pass
    else:
        raise AssertionError("Existing run was replayed")
    assert list((pathlib.Path(folder) / "fixture").iterdir()) == []
assert "playwright.sync_api" not in sys.modules
`, runner], { encoding: 'utf8', timeout: 15_000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
