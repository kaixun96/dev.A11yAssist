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
    ...catalog.flatMap(entry => [`plugins/${entry.name}/README.md`, `plugins/${entry.name}/README.zh-CN.md`]),
    ...catalog.filter(entry => ['capability', 'workflow'].includes(entry.group)).flatMap(entry =>
      ['CAPABILITIES.md', 'WORKFLOW.md', 'PROVIDERS.md', 'NATIVE-CAPABILITIES.md'].map(file =>
        `plugins/${entry.name}/docs/${file}`))
  ];
  for (const path of pages) {
    for (const match of (await text(path)).matchAll(/\]\(([^)]+)\)/g)) {
      // Evidence description examples contain template slots, not local file links.
      if (/^https:/.test(match[1]) || /^\{\{[\w.-]+\}\}$/.test(match[1])) continue;
      await access(join(root, dirname(path), match[1].split('#')[0]));
    }
  }
});

test('catalog validation rejects omissions, unknown plugins, unsafe links and wrong commands', () => {
  const names = catalog.map(entry => entry.name);
  assert.throws(() => validateCatalog(catalog.slice(1), names), /every plugin/);
  for (const mutate of [
    entries => { entries[0].name = 'not-an-installable-plugin'; },
    entries => { entries[0].group = 'compatibility'; },
    entries => { entries[0].docs = ['../private.md']; },
    entries => { entries[0].zh.requires = ''; },
    entries => { entries[0].en.example = '/another-plugin do work'; }
  ]) {
    const changed = structuredClone(catalog);
    mutate(changed);
    assert.throws(() => validateCatalog(changed, names));
  }
});

test('retired exports are absent and canonical execution sources remain hash-bound in packages', async () => {
  for (const path of ['runtime', 'native', 'integrations', 'src/integrations',
    'src/runtime/profiles.mjs', 'src/native/provenance.json', 'docs/MIGRATION.md']) {
    await assert.rejects(access(join(root, path)), { code: 'ENOENT' });
  }
  const release = await json('release.json');
  for (const [path, hash] of Object.entries(release.hashes)) {
    assert(path.startsWith('src/'));
    assert.equal(digest(await text(path)), hash, path);
    for (const entry of catalog.filter(entry => ['capability', 'workflow'].includes(entry.group))) {
      assert.equal(digest(await text(`plugins/${entry.name}/${path.slice(4)}`)), hash, `${entry.name}: ${path}`);
    }
  }
  for (const dir of ['skills', 'knowledge', 'adapters', 'contracts']) {
    await assert.rejects(access(join(root, dir)), { code: 'ENOENT' });
  }
});

test('installer requires selection, rejects retired options and keeps knowledge setup independent', {
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
  for (const args of [['-Plugin', 'a11y-knowledge-odsp'], ['-Plugin', 'a11y-knowledge', '-WithAgentOW']]) {
    const result = run(...args);
    assert.notEqual(result.status, 0);
    assert(!result.stdout.includes('copilot plugin install'));
  }
  for (const name of ['a11y-knowledge', 'a11y-bug-bash', 'a11y-setup']) {
    const result = run('-Plugin', name);
    assert.equal(result.status, 0, result.stderr);
    assert(result.stdout.includes(`/${name}`));
    assert(!result.stdout.includes('A11Y_ASSIST_CONFIG'));
    assert(!result.stdout.includes('agentow-copilot@agentOW'));
  }
});

test('knowledge selection offers one generic and ODSP skill with usable offline topic links', async () => {
  assert.deepEqual(catalog.filter(entry => entry.group === 'knowledge').map(entry => entry.name), ['a11y-knowledge']);
  assert.equal(catalog.find(entry => entry.name === 'a11y-knowledge-odsp'), undefined);
  assert.equal(catalog.some(entry => entry.group === 'compatibility'), false);
  const knowledge = catalog.find(entry => entry.name === 'a11y-knowledge');
  assert.deepEqual(knowledge.docs, ['knowledge/README.md']);
  for (const [lang, filename] of [['en', 'README.md'], ['zh', 'README.zh-CN.md']]) {
    assert(knowledge[lang].purpose.includes('ODSP'));
    const page = await text(`plugins/a11y-knowledge/${filename}`);
    assert(page.includes('knowledge/README.md'));
    assert.doesNotMatch(page, /integrations\/|a11y-knowledge-odsp/);
  }
});
