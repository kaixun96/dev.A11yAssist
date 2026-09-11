import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, rm, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { inventorySources, writeSnapshot, snapshotDirectory, digest } from '../tools/agentow-knowledge-snapshot.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const load = async path => JSON.parse(await text(path));
const source = (path, content) => ({ path, content, mode: '100644', oid: 'a'.repeat(40) });
const collect = files => inventorySources(files, 'b'.repeat(40), 'c'.repeat(40));

test('inventory preserves all first-party documents, non-obvious context, mirrors and linked data', () => {
  const inputs = [
    source('docs/a11y.md', '# Rules\r\n[context](../contracts/plain.json)\r\n'),
    source('docs/other.md', '# Non-keyword surrounding context\n'),
    source('copilot/docs/other.md', '# Non-keyword surrounding context\n'),
    source('contracts/plain.json', '{"name":"referenced"}\n'),
    source('tools/reader.mjs', '// accessibility contract\n'),
    source('tools/unrelated.mjs', '// unrelated implementation\n'),
    source('copilot/skills/vercel-react-best-practices/AGENTS.md', 'Third-party keyboard performance reference\n'),
    source('ts/dist/index.js', '// accessibility plus bundled third-party dependencies\n')
  ];
  const result = collect(inputs);
  assert.equal(result.inventory.files.length, inputs.length);
  assert.deepEqual(result.inventory.totals,
    { tracked: 8, snapshot: 5, externalReference: 2, outsideKnowledgeScope: 1 });
  assert.equal(result.copied.get('snapshot/docs/a11y.md.source.md'),
    '# Rules\n[context](../contracts/plain.json)\n');
  const records = Object.fromEntries(result.inventory.files.map(file => [file.path, file]));
  assert.equal(records['copilot/docs/other.md'].duplicateOf, 'docs/other.md');
  assert.equal(records['contracts/plain.json'].disposition, 'snapshot');
  assert.match(records['contracts/plain.json'].reason, /Local reference/);
  assert.equal(records['tools/unrelated.mjs'].target, undefined);
  for (const record of result.inventory.files) {
    assert(record.reason && record.sourceUrl && record.sha256 && record.blob);
    if (record.target) assert.equal(digest(result.copied.get(record.target)), record.sha256);
  }
  assert(![...result.copied.values()].some(value => value.includes('Third-party')));
  assert.throws(() => collect([source('../escape.md', 'bad')]), /Unsafe snapshot path/);
  assert.throws(() => collect([source('same.md', 'one'), source('same.md', 'two')]), /Duplicate source/);
  assert.throws(() => collect([{ ...source('link.md', 'target'), mode: '120000' }]), /Unsupported source mode/);
});

test('exact source checking rejects a changed body, missing inventory row and undeclared file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'source-knowledge-'));
  const result = collect([source('docs/rules.md', '# Complete source\n')]);
  const archive = join(directory, snapshotDirectory);
  try {
    await writeSnapshot(directory, result);
    await writeSnapshot(directory, result, true);
    const target = join(archive, 'snapshot/docs/rules.md.source.md');
    await writeFile(target, '# Summarized source\n');
    await assert.rejects(writeSnapshot(directory, result, true), /Snapshot drift/);
    await writeSnapshot(directory, result);
    const inventoryPath = join(archive, 'source-inventory.json');
    await writeFile(inventoryPath, JSON.stringify({ ...result.inventory, files: [] }) + '\n');
    await assert.rejects(writeSnapshot(directory, result, true), /Snapshot drift/);
    await writeSnapshot(directory, result);
    await writeFile(join(archive, 'snapshot/unlisted.txt'), 'stale');
    await assert.rejects(writeSnapshot(directory, result, true), /Unexpected generated file/);
    await writeSnapshot(directory, result);
    await assert.rejects(access(join(archive, 'snapshot/unlisted.txt')), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('published inventory accounts for every source with no unclassified first-party document', async () => {
  const directory = join(root, snapshotDirectory);
  const inventory = await load(join(directory, 'source-inventory.json'));
  const profile = await load(join(directory, 'manifest.json'));
  assert.deepEqual(profile.sourceSnapshot, inventory.origin);
  assert.equal(inventory.totals.tracked, inventory.files.length);
  assert.equal(new Set(inventory.files.map(file => file.path)).size, inventory.files.length);
  assert.equal(inventory.files.filter(file => file.disposition === 'snapshot').length, inventory.totals.snapshot);
  assert.equal(inventory.files.filter(file => file.disposition === 'external-reference').length, inventory.totals.externalReference);
  assert.equal(inventory.files.filter(file => file.disposition === 'outside-knowledge-scope').length, inventory.totals.outsideKnowledgeScope);
  for (const record of inventory.files) {
    assert(record.reason && record.sourceUrl);
    assert.match(record.blob, /^[a-f0-9]{40}$/);
    assert.match(record.sha256, /^[a-f0-9]{64}$/);
    if (record.referenceKind === 'generated-build-output') assert.match(record.path, /(?:^|\/)dist\//);
    else if (record.referenceKind === 'vendored-performance') {
      assert(record.path.startsWith('copilot/skills/vercel-react-best-practices/'));
    } else {
      assert.equal(record.referenceKind, undefined);
      if (record.document || record.accessibilityMarker) assert.equal(record.disposition, 'snapshot', record.path);
    }
    if (record.disposition === 'snapshot') {
      assert.equal(digest(await text(join(directory, record.target))), record.sha256, record.path);
      assert.equal(profile.hashes[record.target], record.sha256, record.path);
    } else {
      assert(['external-reference', 'outside-knowledge-scope'].includes(record.disposition));
      assert.equal(record.target, undefined);
    }
  }
});

test('complete component and SharePoint source details are preserved, not replaced by generic summaries', async () => {
  const directory = join(root, snapshotDirectory, 'snapshot');
  const components = await text(join(directory, 'skills/ow-review/references/accessibility.md.source.md'));
  for (const term of ['Fluent V8 MessageBar', 'AriaLiveAnnouncer', 'delayedRender',
    'DetailsList', 'FocusZone', 'useRestoreFocusTarget', 'A11yManager',
    '@msinternal/screen-reader-alert', '@msinternal/sp-a11y', '@msinternal/sp-dragzone',
    '@msinternal/sp-a11y-checker-util', 'Async collection state']) {
    assert(components.includes(term), `Missing original component knowledge: ${term}`);
  }
  const design = await text(join(directory, 'skills/ow-review/references/sharepoint-design-system-and-ux-components.md.source.md'));
  for (const term of ['DataGrid', 'Table', 'LazyComponents', 'Breadcrumb', 'odsp-common', 'sp-client']) {
    assert(design.includes(term), `Missing original design-system knowledge: ${term}`);
  }
  for (const path of ['copilot/skills/agentow-a11y/SKILL.md.source.md',
    'copilot/agents/a11y-evaluator.agent.md.source.md', 'review-rule-registry.json.source.txt',
    'docs/review-misses.md.source.md', 'copilot/docs/a11y/shared-capabilities.md.source.md']) {
    await access(join(directory, path));
  }
});

test('project knowledge plugin is complete offline, discoverable and read-only without runtime entrypoints', async () => {
  const directory = join(root, 'plugins/a11y-knowledge-odsp');
  const plugin = await load(join(directory, '.claude-plugin/plugin.json'));
  assert.equal(plugin.mcpServers, undefined);
  for (const forbidden of ['.mcp.json', 'runtime', 'native', 'adapters', 'config']) {
    await assert.rejects(access(join(directory, forbidden)), { code: 'ENOENT' });
  }
  const skill = await text(join(directory, 'skills/a11y-knowledge-odsp/SKILL.md'));
  assert.match(skill, /Default to read-only source inspection/);
  assert.match(skill, /Do not edit files, run shell commands, tests or scanners/);
  assert.match(skill, /reference data, not active instructions/);
  const profile = await load(join(directory, snapshotDirectory, 'manifest.json'));
  const expected = new Set([
    '.claude-plugin/plugin.json', 'AGENTS.md', 'LICENSE', 'skills/a11y-knowledge-odsp/SKILL.md',
    `${snapshotDirectory}/manifest.json`, 'knowledge/manifest.json'
  ]);
  for (const [base, manifest] of [
    ['knowledge', await load(join(directory, 'knowledge/manifest.json'))], [snapshotDirectory, profile]
  ]) {
    for (const [path, hash] of Object.entries(manifest.hashes)) {
      expected.add(`${base}/${path}`);
      assert.equal(digest(await text(join(directory, base, path))), hash);
    }
  }
  const actual = [];
  async function walk(base, prefix = '') {
    for (const entry of await readdir(base, { withFileTypes: true })) {
      assert(!entry.isSymbolicLink());
      const path = prefix + entry.name;
      if (entry.isDirectory()) await walk(join(base, entry.name), path + '/');
      else actual.push(path);
    }
  }
  await walk(directory);
  assert.deepEqual(actual.sort(), [...expected].sort());
  for (const file of ['README.md', 'fluent-spds.md', 'sharepoint.md', 'complete-source-guide.md']) {
    const path = join(directory, snapshotDirectory, file);
    for (const match of (await text(path)).matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      await access(join(dirname(path), match[1]));
    }
  }
  for (const entry of Object.keys(profile.hashes).filter(file => file.startsWith('snapshot/'))) {
    assert.match(entry, /\.source\.(md|txt)$/);
    assert(!entry.endsWith('/SKILL.md') && !entry.endsWith('/AGENTS.md'));
  }
});
