import test from 'node:test';
import assert from 'node:assert/strict';
import { access, cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const shared = ['skills/a11y-setup/SKILL.md', 'native/windows-host.ps1',
  'integrations/agentow/runtime/personal-evaluator-browser.py',
  'setup/profiles.json', 'setup/report.template.md', 'docs/SETUP.md'];
async function filesUnder(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink());
    const path = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await filesUnder(join(directory, entry.name), path + '/'));
    else files.push(path);
  }
  return files.sort();
}

test('setup is independently packaged and Bug Bash reuses its exact sources without another public command', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'a11y-setup-'));
  try {
    await cp(join(root, 'plugins/a11y-setup'), directory, { recursive: true });
    const manifest = JSON.parse(await text(join(directory, 'plugin.json')));
    assert.equal(manifest.name, 'a11y-setup');
    assert.equal(manifest.mcpServers, undefined);
    assert.deepEqual(await filesUnder(directory), [
      ...shared, 'plugin.json', 'AGENTS.md', 'LICENSE', 'README.md', 'README.zh-CN.md'
    ].sort());
    for (const path of shared) {
      const body = await text(join(directory, path));
      assert.equal(body, await text(join(root, path.startsWith('docs/') ? path : `src/${path}`)));
      assert.equal(body, await text(join(root, 'plugins/a11y-bug-bash/modules/a11y-setup', path)));
    }
    assert.deepEqual(await readdir(join(root, 'plugins/a11y-bug-bash/skills')), ['a11y-bug-bash']);
    await assert.rejects(access(join(root, 'plugins/a11y-bug-bash/modules/a11y-setup/plugin.json')), { code: 'ENOENT' });
    for (const path of ['README.md', 'README.zh-CN.md', 'docs/SETUP.md']) {
      for (const match of (await text(join(directory, path))).matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
        if (!/^https:/.test(match[1])) await access(join(directory, dirname(path), match[1]));
      }
    }
  } finally { await rm(directory, { recursive: true }); }
});

test('setup profiles select minimal dependencies and skill keeps preparation separate from discovery', async () => {
  const profiles = JSON.parse(await text(join(root, 'src/setup/profiles.json')));
  assert.equal(profiles.defaultMode, 'check');
  assert.deepEqual(profiles.profiles.find(p => p.id === 'source-only').dependencies, []);
  assert.deepEqual(profiles.profiles.find(p => p.id === 'browser').dependencies, ['Python', 'Playwright', 'Chromium']);
  assert.deepEqual(profiles.profiles.find(p => p.id === 'nvda').dependencies, ['NVDA']);
  const native = await text(join(root, 'src/native/windows-host.ps1'));
  for (const profile of profiles.profiles) {
    assert(profile.next);
    for (const dependency of profile.dependencies) assert(native.includes(`'${dependency}'`));
  }
  const skill = await text(join(root, 'src/skills/a11y-setup/SKILL.md'));
  for (const pattern of [/Default to\s+check-only/, /Codespaces|CODESPACES/,
    /explicit `-Dependency` array/, /never its\s+legacy all-dependencies default/,
    /timeout is unknown execution/, /No unrelated audio/,
    /headless login\s+result alone/, /never copy cookies/i,
    /real exclusive host\/setup/, /separate gated/, /not product evidence/]) {
    assert.match(skill, pattern);
  }
  const bash = await text(join(root, 'src/skills/a11y-bug-bash/SKILL.md'));
  assert(bash.includes('`modules/a11y-setup/skills/a11y-setup/SKILL.md`'));
  assert.match(bash, /`source-only` and `plan-only` do not run setup scripts/);
  assert.match(bash, /discovery alone does not authorize installation/);
});

test('native dependency selection is side-effect-isolated and propagates failures', {
  skip: process.platform !== 'win32'
}, () => {
  const child = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-File',
    join(root, 'tests/setup-native.ps1'), '-Source', join(root, 'src/native/windows-host.ps1')],
  { encoding: 'utf8', timeout: 20000 });
  assert.equal(child.status, 0, child.stdout + child.stderr);
  assert.match(child.stdout, /dependency selection passed/);
  assert.match(child.stdout, /Scoped inventory passed/);
});

test('packaged host script rejects Codespaces and invalid dependency selections before any effects', {
  skip: process.platform !== 'win32'
}, () => {
  for (const extra of [[], ['-Dependency', 'UntrustedPackage']]) {
    const child = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-File',
      join(root, 'plugins/a11y-setup/native/windows-host.ps1'), '-Action', 'InstallSafeDependencies', ...extra],
    { encoding: 'utf8', timeout: 15000, env: { ...process.env, CODESPACES: 'true' } });
    assert.notEqual(child.status, 0);
    assert.match(child.stderr, extra.length ? /ValidateSet|does not belong|not.*set/i : /not supported in a Codespace/);
  }
});
