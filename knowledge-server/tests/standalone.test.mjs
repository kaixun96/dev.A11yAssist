import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildKnowledge } from '../tools/build.mjs';
import { loadKnowledgeSnapshot } from '../src/runtime/knowledge.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const server = join(repository, 'knowledge-server');
const json = value => JSON.stringify(value, null, 2) + '\n';
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'standalone-kb-build-'));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }));
  await cp(join(repository, 'accessibility-kb'), join(root, 'accessibility-kb'), { recursive: true });
  return root;
}

test('independent build never changes existing plugin, source or root metadata', async t => {
  const root = await fixture(t);
  const preserved = ['plugins/existing/.mcp.json', 'src/runtime/core.mjs', 'src/catalog.json',
    'src/skills/a11y-knowledge/SKILL.md', 'tools/build.mjs', 'runtime/evidence-v1.mjs',
    'package.json', 'release.json', 'README.md', '.github/plugin/marketplace.json'];
  for (const path of preserved) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), `untouched:${path}`);
  }
  assert.deepEqual(await buildKnowledge(root), { entries: 32, retainedArtifacts: 2 });
  await buildKnowledge(root, { check: true });
  for (const path of preserved) assert.equal(await readFile(join(root, path), 'utf8'), `untouched:${path}`);
});

test('new KB pins retain old artifact bytes and old consumers can cold-load them', async t => {
  const root = await fixture(t);
  await buildKnowledge(root);
  const refPath = join(root, 'knowledge-server/references/knowledge.json');
  const oldReference = JSON.parse(await readFile(refPath, 'utf8'));
  const oldArtifacts = new Map(await Promise.all((await readdir(join(root, 'knowledge-distribution')))
    .filter(path => path !== 'index.json').map(async path => [path, await readFile(join(root, 'knowledge-distribution', path))])));
  const consumer = join(root, 'old-consumer');
  await mkdir(join(consumer, 'references'), { recursive: true });
  await writeFile(join(consumer, 'references/knowledge.json'), json(oldReference));
  const topic = join(root, 'accessibility-kb/packages/common/topics/foundations.md');
  await writeFile(topic, await readFile(topic, 'utf8') + '\nSynthetic reviewed-next-snapshot fixture.\n');
  assert.equal((await buildKnowledge(root)).retainedArtifacts, 4);
  await buildKnowledge(root, { check: true });
  for (const [path, bytes] of oldArtifacts) assert.deepEqual(await readFile(join(root, 'knowledge-distribution', path)), bytes);
  const loaded = await loadKnowledgeSnapshot(consumer, {
    env: { A11Y_ASSIST_KB_CACHE_ROOT: join(root, 'external-cache') },
    fetchImpl: async url => {
      assert.equal(url, oldReference.distribution.url);
      return new Response(oldArtifacts.get(`${oldReference.manifestSha256}.json`));
    }
  });
  assert.equal(loaded.origin, 'download');
  assert.equal(loaded.entries.length, 32);
  assert.equal(loaded.reference.manifestSha256, oldReference.manifestSha256);
});

test('builder resumes after artifact publication but before index publication', async t => {
  const root = await fixture(t);
  await buildKnowledge(root);
  await rm(join(root, 'knowledge-distribution/index.json'));
  await buildKnowledge(root);
  await buildKnowledge(root, { check: true });
});

test('builder refuses missing, corrupted or unindexed historical artifacts without repair', async t => {
  const root = await fixture(t);
  await buildKnowledge(root);
  const distribution = join(root, 'knowledge-distribution');
  const index = await readFile(join(distribution, 'index.json'), 'utf8');
  const pin = Object.keys(JSON.parse(index).artifacts)[0];
  const artifact = join(distribution, `${pin}.json`);
  const bytes = await readFile(artifact);
  await rm(artifact);
  await assert.rejects(buildKnowledge(root), /Retained KB artifact missing or changed/);
  await writeFile(artifact, 'corrupt');
  await assert.rejects(buildKnowledge(root), /Retained KB artifact missing or changed/);
  assert.equal(await readFile(artifact, 'utf8'), 'corrupt');
  await writeFile(artifact, bytes);
  await writeFile(join(distribution, 'unexpected.json'), '{}');
  await assert.rejects(buildKnowledge(root), /Unindexed distribution file/);
  assert.equal(await readFile(join(distribution, 'index.json'), 'utf8'), index);
  assert.equal(await readFile(join(distribution, 'unexpected.json'), 'utf8'), '{}');
});

test('stdio transport reports protocol errors and keeps serving valid requests', () => {
  const requests = ['{', 'null', '[]',
    JSON.stringify({ jsonrpc: '2.0', id: {}, method: 'ping' }),
    JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'unknown' }),
    JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'ping', params: [] }),
    JSON.stringify({ jsonrpc: '2.0', id: 'last', method: 'ping' })];
  const child = spawnSync(process.execPath, [join(server, 'cli.mjs')], {
    input: requests.join('\n') + '\n', encoding: 'utf8', timeout: 15000
  });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stderr, '');
  const replies = child.stdout.trim().split('\n').map(line => JSON.parse(line));
  assert.deepEqual(replies.slice(0, -1).map(reply => reply.error.code), [-32700, -32600, -32600, -32600, -32601, -32602]);
  assert.deepEqual(replies.slice(0, 4).map(reply => reply.id), [null, null, null, null]);
  assert.deepEqual(replies.at(-1), { jsonrpc: '2.0', id: 'last', result: {} });
});

test('stdio refuses oversized unterminated frames with a bounded protocol failure', () => {
  const child = spawnSync(process.execPath, [join(server, 'cli.mjs')], {
    input: 'x'.repeat(1024 * 1024 + 1), encoding: 'utf8', timeout: 15000
  });
  assert.equal(child.status, 1, child.stderr);
  assert.equal(child.stderr, '');
  const reply = JSON.parse(child.stdout);
  assert.equal(reply.error.code, -32600);
  assert.match(reply.error.message, /exceeds 1 MiB/);
});