import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { validateCatalog } from '../tools/catalog.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(join(root, path), 'utf8')).replaceAll('\r\n', '\n');
const json = async path => JSON.parse(await text(path));
const digest = body => createHash('sha256').update(body).digest('hex');
const catalog = await json('src/catalog.json');

test('bilingual catalog covers every installable plugin with working selection and usage links', async () => {
  const marketplace = await json('.github/plugin/marketplace.json');
  const names = marketplace.plugins.map(entry => entry.name);
  assert.equal(names.length, 10);
  assert.equal(new Set(names).size, 10);
  assert(!catalog.some(entry => entry.group === 'compatibility' || entry.name === 'a11y-knowledge-odsp'));
  validateCatalog(catalog, names);
  assert.deepEqual(names, catalog.map(entry => entry.name));
  for (const filename of ['README.md', 'README.zh-CN.md']) {
    const home = await text(filename);
    for (const entry of catalog) {
      assert(home.includes(`(plugins/${entry.name}/${filename})`));
      const path = `plugins/${entry.name}/${filename}`;
      const page = await text(path);
      assert(page.includes(`copilot plugin install ${entry.name}@a11y-assist`));
      assert(page.includes(`/${entry.name} `));
      assert(page.includes(entry[filename === 'README.md' ? 'en' : 'zh'].limits));
      assert(!page.includes('../src/') && !page.includes('../../'));
    }
  }
  const pages = [
    'README.md', 'README.zh-CN.md', 'src/README.md', 'docs/DEVELOPMENT.md', 'config/README.md',
    ...catalog.flatMap(entry => [`plugins/${entry.name}/README.md`, `plugins/${entry.name}/README.zh-CN.md`])
  ];
  for (const path of pages) {
    for (const match of (await text(path)).matchAll(/\]\(([^)]+)\)/g)) {
      if (/^https:/.test(match[1])) continue;
      await access(join(root, dirname(path), match[1].split('#')[0]));
    }
  }
});

test('catalog validation rejects omissions, unknown plugins, unsafe links and wrong commands', () => {
  const names = catalog.map(entry => entry.name);
  assert.throws(() => validateCatalog(catalog.slice(1), names), /every plugin/);
  for (const mutate of [
    entries => { entries[0].name = 'not-an-installable-plugin'; },
    entries => { entries[0].docs = ['../private.md']; },
    entries => { entries[0].zh.requires = ''; },
    entries => { entries[0].en.example = '/another-plugin do work'; }
  ]) {
    const changed = structuredClone(catalog);
    mutate(changed);
    assert.throws(() => validateCatalog(changed, names));
  }
});

test('release hashes and standalone execution packages match canonical src without root compatibility exports', async () => {
  const release = await json('release.json');
  const pkg = await json('package.json');
  const execution = await json('src/contracts/plugins.json');
  assert.equal(release.version, pkg.version);
  assert.equal(Object.keys(execution).length, 7);
  const expected = [];
  for (const dir of ['runtime', 'native', 'contracts', 'adapters']) {
    for (const file of await readdir(join(root, 'src', dir))) expected.push(`src/${dir}/${file}`);
  }
  assert.deepEqual(Object.keys(release.hashes).sort(), expected.sort());
  for (const [path, hash] of Object.entries(release.hashes)) {
    assert(path.startsWith('src/'));
    const body = await text(path);
    assert.equal(digest(body), hash, path);
    const setupOnly = path === 'src/native/windows-host.ps1';
    for (const name of setupOnly ? ['a11y-setup', 'a11y-bug-bash'] : Object.keys(execution)) {
      assert.equal(await text(`plugins/${name}/${path.slice('src/'.length)}`), body, `${name}: ${path}`);
    }
    if (setupOnly) {
      for (const name of Object.keys(execution)) {
        await assert.rejects(access(join(root, 'plugins', name, 'native/windows-host.ps1')), { code: 'ENOENT' });
      }
    }
  }
  for (const entry of catalog) {
    const manifest = await json(`plugins/${entry.name}/plugin.json`);
    assert.equal(manifest.version, pkg.version);
    assert.equal(manifest.name, entry.name);
  }
  await access(join(root, 'accessibility-kb/manifest.json'));
  for (const dir of ['runtime', 'native', 'skills', 'knowledge', 'adapters', 'contracts', 'src/knowledge']) {
    await assert.rejects(access(join(root, dir)), { code: 'ENOENT' });
  }
});

test('installer requires selection, installs exactly ten current plugins and keeps knowledge setup independent', {
  skip: process.platform !== 'win32'
}, () => {
  const run = (...args) => spawnSync('pwsh', [
    '-NoProfile', '-NonInteractive', '-File', join(root, 'tools/install.ps1'), ...args
  ], { encoding: 'utf8', timeout: 15000 });
  const missing = run();
  assert.notEqual(missing.status, 0);
  assert(!missing.stdout.includes('copilot plugin install'));
  const all = run('-Plugin', 'all');
  assert.equal(all.status, 0, all.stderr);
  assert.equal((all.stdout.match(/copilot plugin install /g) ?? []).length, 10);
  assert(!all.stdout.includes('a11y-knowledge-odsp@a11y-assist'));
  for (const entry of catalog) {
    assert(all.stdout.includes(`${entry.name}@a11y-assist`));
  }
  for (const name of ['a11y-knowledge', 'a11y-bug-bash', 'a11y-setup']) {
    const result = run('-Plugin', name);
    assert.equal(result.status, 0, result.stderr);
    assert(result.stdout.includes(`/${name}`));
    assert.match(result.stdout, /without a peer knowledge plugin, providers or A11Y_ASSIST_CONFIG/);
    assert.doesNotMatch(result.stdout, /set A11Y_ASSIST_CONFIG|authorized A11Y_ASSIST_CONFIG connection/);
    assert(!result.stdout.includes('agentow-copilot@agentOW'));
  }
  const retired = run('-Plugin', 'a11y-knowledge-odsp');
  assert.notEqual(retired.status, 0);
  assert(!retired.stdout.includes('copilot plugin install'));
});

test('knowledge selection routes to shared Common, Fluent and SharePoint without a compatibility entry or peer skill', async () => {
  assert.deepEqual(catalog.filter(entry => entry.group === 'knowledge').map(entry => entry.name), ['a11y-knowledge']);
  assert.equal(catalog.find(entry => entry.name === 'a11y-knowledge-odsp'), undefined);
  const knowledge = catalog.find(entry => entry.name === 'a11y-knowledge');
  assert(knowledge.docs.includes('references/README.md'));
  assert(knowledge.docs.includes('skills/a11y-knowledge/SKILL.md'));
  const reference = await json('plugins/a11y-knowledge/references/knowledge.json');
  assert.deepEqual(Object.keys(reference.packages), ['common', 'fluent', 'sharepoint']);
  for (const [lang, filename] of [['en', 'README.md'], ['zh', 'README.zh-CN.md']]) {
    for (const layer of ['Common', 'Fluent', 'SharePoint']) assert(knowledge[lang].purpose.includes(layer));
    const page = await text(`plugins/a11y-knowledge/${filename}`);
    assert(page.includes('references/README.md'));
    assert(page.includes('skills/a11y-knowledge/SKILL.md'));
    assert.doesNotMatch(page, /a11y-knowledge-odsp|integrations\/|snapshot\/|\.claude-plugin/);
  }
});
