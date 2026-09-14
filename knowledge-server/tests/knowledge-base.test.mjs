import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, cp, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadKnowledgeBase, exportKnowledgeBase, knowledgePath, validateKnowledgeLinks } from '../tools/knowledge-base.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const kbRoot = fileURLToPath(new URL('../../accessibility-kb', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const load = async path => JSON.parse(await text(path));
const digest = value => createHash('sha256').update(value).digest('hex');

test('shared KB validates all entries and binds its complete manifest to the standalone reference', async () => {
  const kb = await loadKnowledgeBase(kbRoot);
  assert.deepEqual([...kb.packages.keys()], ['common', 'fluent', 'sharepoint']);
  assert.equal(kb.entries.size, 32);
  const bundle = exportKnowledgeBase(kb, ['sharepoint']);
  assert.equal(bundle.files.get('manifest.json'), await text(join(kbRoot, 'manifest.json')));
  const reference = await load(join(root, 'references/knowledge.json'));
  assert.equal(reference.manifestSha256, digest(bundle.files.get('manifest.json')));
  assert.deepEqual(reference.packages, bundle.manifest.packages);
  assert.deepEqual([...bundle.files], [...exportKnowledgeBase(kb, ['common', 'sharepoint']).files]);
  for (const task of ['find', 'fix', 'prevent', 'review-design', 'add-tests']) {
    assert.equal(kb.entries.get(`common.procedure.${task}`).kind, 'procedure');
  }
});

test('dependency-closed content works standalone without a repository or harness', async () => {
  const kb = await loadKnowledgeBase(kbRoot);
  for (const selected of [['common'], ['fluent'], ['sharepoint']]) {
    const dir = await mkdtemp(join(tmpdir(), 'portable-kb-'));
    try {
      const bundle = exportKnowledgeBase(kb, selected);
      for (const [path, body] of bundle.files) {
        await mkdir(dirname(join(dir, path)), { recursive: true });
        await writeFile(join(dir, path), body);
      }
      const isolated = await loadKnowledgeBase(dir, { verifyManifest: true });
      assert.equal(isolated.entries.size, [...kb.entries].filter(([id]) => Object.hasOwn(bundle.manifest.packages, id.split('.')[0])).length);
      assert.equal(exportKnowledgeBase(isolated, selected).files.get('manifest.json'), bundle.files.get('manifest.json'));
      if (selected[0] === 'common') {
        assert.deepEqual([...isolated.packages.keys()], ['common']);
        for (const [path, content] of bundle.files) {
          assert.doesNotMatch(content, /sharepoint|spds|fluent|agentow|CLAUDE_PLUGIN_ROOT/i, path);
        }
      }
    } finally { await rm(dir, { recursive: true }); }
  }
});

test('standalone KB content has no archive metadata or routing', async () => {
  const kb = await loadKnowledgeBase(kbRoot);
  for (const [path, content] of kb.files) {
    assert.doesNotMatch(content, /agentow|integrations[\\/]|\barchiv(?:e|ed|es)\b|migration compatibility|legacy compatibility/i, path);
  }
  assert.doesNotMatch(await text(join(kbRoot, 'manifest.json')), /agentow|integrations[\\/]/i);
});

test('pending authority sources and product support gaps are not populated with invented facts', async () => {
  const kb = await loadKnowledgeBase(kbRoot);
  const mas = kb.packages.get('common').sources.find(source => source.id === 'mas');
  assert.equal(mas.status, 'connection-pending');
  assert.equal(mas.locator, null);
  assert.equal(mas.revision, null);
  const fluent = kb.packages.get('fluent');
  assert.deepEqual(fluent.sources.map(source => source.id), ['fluent-docs']);
  assert.equal(fluent.sources[0].authority, 'component-contract');
  assert.equal(fluent.sources[0].status, 'review-pending');
  assert.equal(fluent.sources[0].locator, 'https://react.fluentui.dev/');
  assert.equal(fluent.sources[0].revision, null);
  assert.match(fluent.sources[0].note, /V8 source location remains to be confirmed/);
  for (const entry of fluent.entries) {
    assert.deepEqual(entry.sourceIds, ['fluent-docs']);
    assert.match(kb.files.get(`packages/fluent/${entry.path}`), /unsourced draft guidance/);
  }
  for (const source of kb.packages.get('sharepoint').sources) {
    assert.equal(source.status, 'connection-pending');
    assert.equal(source.locator, null);
    assert.equal(source.revision, null);
  }
  const matrix = await load(join(kbRoot, 'packages/sharepoint/profiles/support-matrix.json'));
  assert.equal(matrix.status, 'awaiting-official-source');
  assert.deepEqual(matrix.products, []);
  assert([...kb.entries.values()].every(entry => entry.status === 'draft'));
});

async function rejectedMutation(mutate, pattern) {
  const dir = await mkdtemp(join(tmpdir(), 'invalid-kb-'));
  try {
    await cp(kbRoot, dir, { recursive: true });
    const path = join(dir, 'packages/common/package.json');
    const pkg = await load(path);
    await mutate(pkg, dir);
    await writeFile(path, JSON.stringify(pkg));
    await assert.rejects(loadKnowledgeBase(dir), pattern);
  } finally { await rm(dir, { recursive: true }); }
}

test('invalid metadata, duplicates, missing sources, relations and approvals fail closed', async () => {
  await rejectedMutation(pkg => { pkg.entries[0].status = 'looks-good'; }, /Invalid KB package/);
  await rejectedMutation(pkg => { pkg.entries.push(pkg.entries[0]); }, /Duplicate KB entry/);
  await rejectedMutation(pkg => { pkg.entries[1].path = 'README.md'; }, /Duplicate KB path/);
  await rejectedMutation(pkg => { pkg.sources.push(pkg.sources[0]); }, /Duplicate KB source/);
  await rejectedMutation(pkg => { pkg.entries[0].sourceIds = ['invented']; }, /Unknown KB source/);
  await rejectedMutation(pkg => { pkg.entries[0].relations = ['common.missing']; }, /Unknown KB relation/);
  await rejectedMutation(pkg => { pkg.entries[0].relations = ['sharepoint.overview']; }, /Undeclared KB dependency/);
  await rejectedMutation(pkg => { pkg.entries[0].status = 'approved'; }, /Unreviewed approval/);
  await rejectedMutation(pkg => {
    Object.assign(pkg.entries[0], { status: 'approved', owner: 'synthetic-owner',
      review: { reviewer: 'synthetic-reviewer', date: '2026-09-11', evidence: 'synthetic-review' }, sourceIds: ['mas'] });
  }, /Pending approval source/);
  await rejectedMutation(pkg => {
    Object.assign(pkg.entries[0], { status: 'approved', owner: 'synthetic-owner',
      review: { reviewer: 'synthetic-reviewer', date: '2026-09-11', evidence: 'synthetic-review' }, sourceIds: [] });
  }, /Missing approval source/);
  await rejectedMutation(pkg => { pkg.sources[0].status = 'reviewed'; }, /Unpinned reviewed source/);
  await rejectedMutation(pkg => { pkg.entries[0].status = 'deprecated'; }, /Missing replacement/);
  await rejectedMutation(pkg => { pkg.entries[0].path = '../outside.md'; }, /Unsafe knowledge path/);
});

test('dependency errors, undeclared files and broken links are rejected', async () => {
  await rejectedMutation(pkg => { pkg.dependencies = { fluent: '0.1.0' }; }, /Common cannot depend/);
  await rejectedMutation(async (_pkg, dir) => {
    const path = join(dir, 'packages/fluent/package.json');
    const fluent = await load(path);
    fluent.dependencies.common = '9.9.9';
    await writeFile(path, JSON.stringify(fluent));
  }, /KB dependency version mismatch/);
  await rejectedMutation(async (_pkg, dir) => {
    const path = join(dir, 'packages/fluent/package.json');
    const fluent = await load(path);
    fluent.dependencies.sharepoint = '0.1.0';
    await writeFile(path, JSON.stringify(fluent));
  }, /Cyclic KB dependency/);
  await rejectedMutation(async (_pkg, dir) => { await writeFile(join(dir, 'undeclared.md'), 'unexpected'); }, /Undeclared or missing/);
  await rejectedMutation(async (_pkg, dir) => {
    await writeFile(join(dir, 'packages/common/README.md'), '[missing](missing.md)');
  }, /Broken knowledge link/);
  const files = new Map([['packages/common/a.md', '[cross](../other/b.md)'], ['packages/other/b.md', 'target']]);
  assert.throws(() => validateKnowledgeLinks(files), /Use an ID/);
  assert.throws(() => validateKnowledgeLinks(new Map([['README.md', '[missing](#removed-heading)']])), /anchors are unsupported/);
  for (const path of ['../escape.md', 'C:/absolute.md', 'a\\b.md', '/absolute.md', 'a/%2e.md', 'a/./b.md']) {
    assert.throws(() => knowledgePath(path), /Unsafe knowledge path/);
  }
});

test('consumer mode rejects stale manifests without preventing authoring regeneration', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'stale-kb-'));
  try {
    await cp(kbRoot, dir, { recursive: true });
    await writeFile(join(dir, 'manifest.json'), '{}\n');
    await loadKnowledgeBase(dir);
    await assert.rejects(loadKnowledgeBase(dir, { verifyManifest: true }), /Knowledge manifest drift/);
  } finally { await rm(dir, { recursive: true }); }
});

test('structured product support rejects malformed data and unreviewed official sources', async () => {
  const matrixPath = 'packages/sharepoint/profiles/support-matrix.json';
  await rejectedMutation(async (_pkg, dir) => {
    const matrix = await load(join(dir, matrixPath));
    matrix.status = 'looks-good';
    await writeFile(join(dir, matrixPath), JSON.stringify(matrix));
  }, /Invalid support matrix/);
  await rejectedMutation(async (_pkg, dir) => {
    const path = join(dir, 'packages/sharepoint/package.json');
    const pkg = await load(path);
    delete pkg.entries.find(entry => entry.dataSchema).dataSchema;
    await writeFile(path, JSON.stringify(pkg));
  }, /Missing structured entry schema/);
  await rejectedMutation(async (_pkg, dir) => {
    const matrix = await load(join(dir, matrixPath));
    Object.assign(matrix, { status: 'sourced', owner: 'synthetic-owner', products: [{
      id: 'synthetic-product', version: '1',
      source: { id: 'sharepoint-support', locator: 'https://example.invalid/support', revision: 'synthetic-revision' },
      rules: [{ requirementId: 'synthetic-rule', applicability: 'undetermined', supportStatus: 'unknown',
        verificationStatus: 'unverified', basis: 'Synthetic schema test, not an actual requirement', verificationEvidence: null, exception: null }]
    }] });
    await writeFile(join(dir, matrixPath), JSON.stringify(matrix));
  }, /Unreviewed product support source/);
});