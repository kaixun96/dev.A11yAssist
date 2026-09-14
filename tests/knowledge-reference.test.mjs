import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, mkdtemp, cp, rm, realpath } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadKnowledgeBase, exportKnowledgeBase } from '../tools/knowledge-base.mjs';
import { createKnowledgeReference, resolveKnowledgeReference, validateKnowledgeReference } from '../tools/knowledge-reference.mjs';
import { createCommonReferenceFixture } from './helpers/common-reference.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const kbRoot = join(root, 'accessibility-kb');
const pluginRoot = join(root, 'plugins/a11y-knowledge');
const load = async path => JSON.parse(await readFile(path, 'utf8'));

async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'shared-kb-reference-'));
  try {
    const plugin = join(dir, 'installed-plugin');
    await cp(pluginRoot, plugin, { recursive: true });
    await fn({ dir, plugin });
  } finally { await rm(dir, { recursive: true }); }
}

async function writeExport(path, kb, selected) {
  const bundle = exportKnowledgeBase(kb, selected);
  for (const [file, body] of bundle.files) {
    await mkdir(dirname(join(path, file)), { recursive: true });
    await writeFile(join(path, file), body);
  }
}

async function refreshManifest(path) {
  const kb = await loadKnowledgeBase(path);
  const exported = exportKnowledgeBase(kb, [...kb.packages.keys()]);
  await writeFile(join(path, 'manifest.json'), exported.files.get('manifest.json'));
}

test('generated references bind exact package closure without copies of content', async () => {
  const kb = await loadKnowledgeBase(kbRoot, { verifyManifest: true });
  const knowledge = await load(join(pluginRoot, 'references/knowledge.json'));
  const project = await load(join(root, 'plugins/a11y-capture/references/knowledge.json'));
  assert.deepEqual(knowledge, createKnowledgeReference(kb, ['sharepoint']));
  assert.deepEqual(project, createKnowledgeReference(kb, ['sharepoint']));
  validateKnowledgeReference(knowledge);
  assert.deepEqual(Object.keys(knowledge.packages), ['common', 'fluent', 'sharepoint']);
  assert.deepEqual(Object.keys(project.packages), ['common', 'fluent', 'sharepoint']);
});

test('repository development resolution ignores cwd and returns only declared entries', async () => {
  const resolved = await resolveKnowledgeReference(pluginRoot, { env: {} });
  assert.equal(resolved.kbRoot, await realpath(kbRoot));
  assert.deepEqual(Object.keys(resolved.packages), ['common', 'fluent', 'sharepoint']);
  assert.equal(resolved.entries.length, 32);
  assert(resolved.entries.some(entry => entry.id === 'sharepoint.profile.support-policy'));
  assert(resolved.entries.every(entry => /^[a-f0-9]{64}$/.test(entry.sha256)));
  assert.equal(resolved.contentApprovalVerified, false);
  assert.equal(resolved.independentBehaviorVerified, false);
  const child = spawnSync(process.execPath, [join(root, 'tools/knowledge-reference.mjs'), pluginRoot], {
    cwd: tmpdir(), encoding: 'utf8', env: { ...process.env, A11Y_ASSIST_KB_ROOT: kbRoot }, timeout: 15000
  });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(JSON.parse(child.stdout).manifestSha256, resolved.manifestSha256);
});

test('installed unified plugin resolves an external project root through explicit option or environment', async () => {
  await fixture(async ({ dir, plugin }) => {
    const external = join(dir, 'shared-content');
    await writeExport(external, await loadKnowledgeBase(kbRoot), ['sharepoint']);
    const option = await resolveKnowledgeReference(plugin, { kbRoot: external, env: {} });
    const environment = await resolveKnowledgeReference(plugin, { env: { A11Y_ASSIST_KB_ROOT: external } });
    assert.deepEqual(environment, option);
    assert.equal(option.kbRoot, await realpath(external));
    assert.deepEqual(Object.keys(option.packages), ['common', 'fluent', 'sharepoint']);
    assert.equal(option.entries.length, 32);
    for (const entry of option.entries) await readFile(entry.path);
    // The explicit setting takes precedence; it is not silently replaced.
    const priority = await resolveKnowledgeReference(plugin, { kbRoot: external, env: { A11Y_ASSIST_KB_ROOT: 'invalid-env' } });
    assert.deepEqual(priority, option);
  });
});

test('synthetic Common reference resolves a portable Common-only root that cannot satisfy the unified plugin', async () => {
  await fixture(async ({ dir, plugin }) => {
    const { consumer, reference } = await createCommonReferenceFixture(dir, kbRoot);
    const external = join(dir, 'common-only');
    await writeExport(external, await loadKnowledgeBase(kbRoot), ['common']);
    const option = await resolveKnowledgeReference(consumer, { kbRoot: external, env: {} });
    const environment = await resolveKnowledgeReference(consumer, { env: { A11Y_ASSIST_KB_ROOT: external } });
    assert.deepEqual(environment, option);
    assert.equal(option.kbRoot, await realpath(external));
    assert.equal(option.manifestSha256, reference.manifestSha256);
    assert.deepEqual(Object.keys(option.packages), ['common']);
    assert.equal(option.entries.length, 20);
    assert(option.entries.every(entry => entry.id.startsWith('common.')));
    for (const entry of option.entries) await readFile(entry.path);
    const priority = await resolveKnowledgeReference(consumer, { kbRoot: external, env: { A11Y_ASSIST_KB_ROOT: 'invalid-env' } });
    assert.deepEqual(priority, option);
    await assert.rejects(resolveKnowledgeReference(plugin, { kbRoot: external, env: {} }), /Unknown KB package/);
  });
});

test('missing or invalid configured roots never use development fallback', async () => {
  await assert.rejects(resolveKnowledgeReference(pluginRoot, { kbRoot: '', env: {} }), /nonempty absolute path/);
  await assert.rejects(resolveKnowledgeReference(pluginRoot, { kbRoot: 'relative/path', env: {} }), /nonempty absolute path/);
  await assert.rejects(resolveKnowledgeReference(pluginRoot, { env: { A11Y_ASSIST_KB_ROOT: '' } }), /nonempty absolute path/);
  await fixture(async ({ dir, plugin }) => {
    await assert.rejects(resolveKnowledgeReference(plugin, { env: {} }), /Shared KB is not configured/);
    await assert.rejects(resolveKnowledgeReference(pluginRoot, { env: { A11Y_ASSIST_KB_ROOT: join(dir, 'absent') } }), { code: 'ENOENT' });
    await assert.rejects(resolveKnowledgeReference(pluginRoot, { kbRoot: join(dir, 'absent'), env: { A11Y_ASSIST_KB_ROOT: kbRoot } }), { code: 'ENOENT' });
    const fake = join(dir, 'plugins/a11y-knowledge');
    await cp(plugin, fake, { recursive: true });
    await cp(kbRoot, join(dir, 'accessibility-kb'), { recursive: true });
    await assert.rejects(resolveKnowledgeReference(fake, { env: {} }), /Shared KB is not configured/);
  });
});

test('stale content and changed validated snapshots both reject existing pins', async () => {
  await fixture(async ({ dir, plugin }) => {
    const shared = join(dir, 'shared');
    await cp(kbRoot, shared, { recursive: true });
    const path = join(shared, 'packages/common/topics/foundations.md');
    await writeFile(path, await readFile(path, 'utf8') + '\nSynthetic content change.\n');
    await assert.rejects(resolveKnowledgeReference(plugin, { kbRoot: shared, env: {} }), /Knowledge manifest drift/);
    await refreshManifest(shared);
    await assert.rejects(resolveKnowledgeReference(plugin, { kbRoot: shared, env: {} }), /KB reference content mismatch/);
  });
});

test('selection pins do not include unrelated package content', async () => {
  await fixture(async ({ dir, plugin }) => {
    const { consumer } = await createCommonReferenceFixture(dir, kbRoot);
    const shared = join(dir, 'shared');
    await cp(kbRoot, shared, { recursive: true });
    const path = join(shared, 'packages/fluent/v8/component-contract.md');
    await writeFile(path, await readFile(path, 'utf8') + '\nSynthetic unselected content change.\n');
    await refreshManifest(shared);
    const resolved = await resolveKnowledgeReference(consumer, { kbRoot: shared, env: {} });
    assert.equal(resolved.entries.length, 20);
    assert(resolved.entries.every(entry => entry.id.startsWith('common.')));
    await assert.rejects(resolveKnowledgeReference(plugin, { kbRoot: shared, env: {} }), /KB reference content mismatch/);
    await assert.rejects(resolveKnowledgeReference(join(root, 'plugins/a11y-capture'), { kbRoot: shared, env: {} }), /KB reference content mismatch/);
  });
});

test('reference validation rejects malformed selectors, missing packages and wrong versions', async () => {
  const reference = await load(join(pluginRoot, 'references/knowledge.json'));
  for (const update of [
    { extra: true }, { kind: 'invented' }, { rootEnv: 'OTHER_ENV' },
    { developmentRoot: '../../../other' }, { manifestSha256: 'not-a-hash' },
    { packages: {} }, { packages: { common: '*' } }, { packages: { '../escape': '0.1.0' } }
  ]) assert.throws(() => validateKnowledgeReference({ ...reference, ...update }));
  await fixture(async ({ plugin }) => {
    const path = join(plugin, 'references/knowledge.json');
    await writeFile(path, JSON.stringify({ ...reference, packages: { common: '9.9.9' } }));
    await assert.rejects(resolveKnowledgeReference(plugin, { kbRoot, env: {} }), /KB reference package\/version mismatch/);
    await writeFile(path, JSON.stringify({ ...reference, packages: { missing: '0.1.0' } }));
    await assert.rejects(resolveKnowledgeReference(plugin, { kbRoot, env: {} }), /Unknown KB package/);
  });
});