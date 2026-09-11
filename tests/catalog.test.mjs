import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
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

test('published compatibility exports retain consumer paths and exactly match authored source', async () => {
  const expected = [
    'runtime/evidence-v1.mjs', 'native/windows-host.ps1',
    'integrations/agentow/runtime/personal-evaluator-browser.py',
    'native/ado-attachments.mjs', 'native/ado-attachments.d.mts', 'native/pr-description.mjs'
  ];
  const manifests = await Promise.all([
    json('integrations/agentow/exports.json'), json('integrations/agentow/execution-manifest.json')
  ]);
  const files = manifests.flatMap(manifest => manifest.files);
  assert.deepEqual(files.map(file => file.source).sort(), expected.sort());
  for (const file of files) {
    const body = await text(file.source);
    assert.equal(body, await text(`src/${file.source}`), file.source);
    assert.equal(digest(body), file.sha256, file.source);
  }
  const release = await json('release.json');
  for (const [path, hash] of Object.entries(release.hashes)) {
    assert(path.startsWith('src/'));
    assert.equal(digest(await text(path)), hash, path);
  }
  for (const dir of ['skills', 'knowledge', 'adapters', 'contracts']) {
    await assert.rejects(access(join(root, dir)), { code: 'ENOENT' });
  }
});

test('installer requires selection, avoids duplicate ODSP installation and keeps knowledge setup independent', {
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
  assert.equal((all.stdout.match(/copilot plugin install /g) ?? []).length, 9);
  assert(!all.stdout.includes('a11y-knowledge-odsp@a11y-assist'));
  for (const entry of catalog.filter(entry => entry.group !== 'compatibility')) {
    assert(all.stdout.includes(`${entry.name}@a11y-assist`));
  }
  for (const name of ['a11y-knowledge', 'a11y-knowledge-odsp', 'a11y-bug-bash']) {
    const result = run('-Plugin', name);
    assert.equal(result.status, 0, result.stderr);
    assert(result.stdout.includes(`/${name}`));
    assert(!result.stdout.includes('A11Y_ASSIST_CONFIG'));
    assert(!result.stdout.includes('agentow-copilot@agentOW'));
  }
});

test('knowledge selection includes ODSP by default and labels the old package as compatibility-only', async () => {
  assert.deepEqual(catalog.filter(entry => entry.group === 'knowledge').map(entry => entry.name), ['a11y-knowledge']);
  assert.equal(catalog.find(entry => entry.name === 'a11y-knowledge-odsp').group, 'compatibility');
  const knowledge = catalog.find(entry => entry.name === 'a11y-knowledge');
  assert(knowledge.docs.includes('skills/a11y-knowledge-odsp/SKILL.md'));
  for (const [lang, filename] of [['en', 'README.md'], ['zh', 'README.zh-CN.md']]) {
    assert(knowledge[lang].purpose.includes('ODSP'));
    assert((await text(`plugins/a11y-knowledge/${filename}`)).includes('skills/a11y-knowledge-odsp/SKILL.md'));
  }
});
