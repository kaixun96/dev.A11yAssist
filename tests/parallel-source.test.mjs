import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileHash, hash } from '../src/runtime/core.mjs';
import { createDiscovery, discoveryStatus, prepareDiscoverySource, startDiscoverySource,
  endDiscoverySource, reviewDiscoverySource, observeDiscovery, reconcileDiscovery,
  appendDiscoveryRows, cancelDiscovery, cleanupDiscovery, validateDiscovery, runDiscovery } from '../src/runtime/bug-bash.mjs';
import { plan, row } from './fixtures/discovery-plan.mjs';

async function fixture(body, pending = true) {
  const root = await mkdtemp(join(tmpdir(), 'parallel-source-'));
  const file = join(root, 'component.js'), bytes = 'export const label = "Search";\n';
  await writeFile(file, bytes);
  const provider = { executable: process.execPath, executableSha256: await fileHash(process.execPath),
    args: [fileURLToPath(new URL('./fixtures/provider.mjs', import.meta.url))], timeoutSeconds: 10 };
  const config = { schemaVersion: 1, owner: 'unit-owner', stateRoot: root,
    providers: { capture: provider, operations: provider }, discoverySourceRoots: [root],
    discoveryProfiles: { 'fixture-browser': { capabilities: ['browser'], targets: ['fixture:dialog-form-v1'] } } };
  const input = { ...plan('parallel-task', [row('page', 'page', { pending }),
    row('source', 'source', { sourceFiles: [file] })]), sourceRoots: [root], sourceRevision: 'a'.repeat(40) };
  delete input.parallelSource;
  const review = { rowId: 'source', status: 'observed-no-issue', actual: 'Read the provided source only',
    files: [{ path: file, sha256: hash(bytes), startLine: 1, endLine: 1 }], risks: [] };
  try {
    await createDiscovery(config, input);
    await body({ config, input, file, review });
  } finally { await rm(root, { recursive: true, force: true }); }
}

async function dispatched(config) {
  const prepared = await prepareDiscoverySource(config, 'parallel-task', { subagentAvailable: true });
  const job = prepared.sourcePending;
  const identity = { workId: job.id, packetHash: job.packetHash,
    workerSessionId: 'native-source-context-1', callbackReference: 'native-task-completion-1' };
  await startDiscoverySource(config, 'parallel-task', identity);
  const { callbackReference, ...envelope } = identity;
  return { job, identity, envelope };
}

test('new both task defaults parallel and source joins while original page operation is pending', async () => {
  await fixture(async ({ config, review }) => {
    assert.equal((await discoveryStatus(config, 'parallel-task')).parallelSource, true);
    const { job, envelope } = await dispatched(config);
    assert.equal(job.packet.agentName, 'a11y-source-review');
    for (const field of ['target', 'evaluator', 'transcript', 'pageObservations', 'providers']) {
      assert.equal(Object.hasOwn(job.packet, field), false);
    }
    assert.deepEqual(job.packet.forbiddenActions, ['browser', 'assistive-technology', 'edit', 'build', 'shell', 'delegate']);
    const page = await observeDiscovery(config, 'parallel-task', ['page']);
    assert(page.pending && page.sourcePending, 'Both lanes must coexist, not wait for one another');
    const merged = await reviewDiscoverySource(config, 'parallel-task', { ...envelope, review });
    assert.equal(merged.pending.id, page.pending.id);
    assert.equal(merged.sourcePending, null);
    assert.equal(merged.rows.find(r => r.id === 'source').sourceReview.runtimeVerified, false);
    assert.equal(merged.rows.find(r => r.id === 'page').status, 'planned');
    const done = await reconcileDiscovery(config, 'parallel-task');
    assert.equal(done.rows.find(r => r.id === 'page').status, 'observed-no-issue');
  });
});

test('page run progresses while isolated source job is still executing', async () => {
  await fixture(async ({ config }) => {
    const { job } = await dispatched(config);
    const result = await runDiscovery(config, 'parallel-task', 1);
    assert.equal(result.rows.find(r => r.id === 'page').status, 'observed-no-issue');
    assert.equal(result.sourcePending.id, job.id);
    await assert.rejects(validateDiscovery(config, 'parallel-task'), /pending effects/);
    await assert.rejects(cleanupDiscovery(config, 'parallel-task'), /source lane/);
  }, false);
});

test('native subagent missing means explicit source gap, not a serial fallback or blocked page lane', async () => {
  await fixture(async ({ config }) => {
    const source = await prepareDiscoverySource(config, 'parallel-task', { subagentAvailable: false });
    assert.equal(source.sourcePending, null);
    assert.equal(source.rows.find(r => r.id === 'source').status, 'blocked');
    assert.match(source.rows.find(r => r.id === 'source').reason, /subagent is unavailable/);
    const page = await observeDiscovery(config, 'parallel-task', ['page']);
    assert.equal(page.rows.find(r => r.id === 'page').status, 'observed-no-issue');
  }, false);
});

test('source may be prepared during pending page capture, but context identities cannot be substituted', async () => {
  await fixture(async ({ config, review }) => {
    const page = await observeDiscovery(config, 'parallel-task', ['page']);
    const { job, identity, envelope } = await dispatched(config);
    assert.equal((await prepareDiscoverySource(config, 'parallel-task', { subagentAvailable: true })).sourcePending.id, job.id);
    await startDiscoverySource(config, 'parallel-task', identity);
    await assert.rejects(startDiscoverySource(config, 'parallel-task', { ...identity, workerSessionId: 'other' }), /already bound/);
    for (const bad of [{ ...envelope, workerSessionId: 'other', review },
      { ...envelope, packetHash: '0'.repeat(64), review },
      { ...envelope, review: { ...review, rowId: 'page' } },
      { ...envelope, review, transcript: 'Must not enter parent context' },
      { ...envelope, review: { ...review, actual: 'x'.repeat(66000) } }]) {
      await assert.rejects(reviewDiscoverySource(config, 'parallel-task', bad));
    }
    const unchanged = await discoveryStatus(config, 'parallel-task');
    assert.equal(unchanged.pending.id, page.pending.id);
    assert.equal(unchanged.sourcePending.id, job.id);
    await assert.rejects(appendDiscoveryRows(config, 'parallel-task', [row('extra')], 'Changed scope'), /in-flight/);
  });
});

test('changed source bytes cannot silently merge into the page task', async () => {
  await fixture(async ({ config, file, review }) => {
    const { envelope } = await dispatched(config);
    await writeFile(file, 'changed source\n');
    await assert.rejects(reviewDiscoverySource(config, 'parallel-task', { ...envelope, review }), /Frozen source packet changed/);
    assert((await discoveryStatus(config, 'parallel-task')).sourcePending);
  });
});

test('cancel preserves both original jobs until page and native source termination are reconciled', async () => {
  await fixture(async ({ config, review }) => {
    const { envelope } = await dispatched(config);
    await observeDiscovery(config, 'parallel-task', ['page']);
    const cancelled = await cancelDiscovery(config, 'parallel-task', 'Owner stops only this task');
    assert(cancelled.pending && cancelled.sourcePending);
    await assert.rejects(reviewDiscoverySource(config, 'parallel-task', { ...envelope, review }), /Not an available/);
    await reconcileDiscovery(config, 'parallel-task');
    await assert.rejects(cleanupDiscovery(config, 'parallel-task'), /source lane/);
    const ended = await endDiscoverySource(config, 'parallel-task', { ...envelope, outcome: 'cancelled',
      reason: 'Native source context cooperatively stopped', terminationReference: 'native-task-termination-1' });
    assert.equal(ended.sourcePending, null);
    assert.equal(ended.sourceJobs[0].outcome, 'cancelled');
    await cleanupDiscovery(config, 'parallel-task');
  });
});

test('failed native launch retains original packet until explicit not-started evidence', async () => {
  await fixture(async ({ config }) => {
    const { sourcePending: job } = await prepareDiscoverySource(config, 'parallel-task', { subagentAvailable: true });
    const ended = await endDiscoverySource(config, 'parallel-task', { workId: job.id, packetHash: job.packetHash,
      workerSessionId: null, outcome: 'not-started', reason: 'Native caller rejected launch before starting a context',
      terminationReference: 'native-launch-rejection-1' });
    assert.equal(ended.rows.find(r => r.id === 'source').status, 'blocked');
    assert.equal(ended.sourcePending, null);
  });
});

test('expired source result stays pending until original native termination is recorded', async () => {
  await fixture(async ({ config, review }) => {
    const { envelope } = await dispatched(config);
    const now = Date.now;
    Date.now = () => now() + 3600_000;
    try {
      await assert.rejects(reviewDiscoverySource(config, 'parallel-task', { ...envelope, review }), /Not an available/);
      assert((await discoveryStatus(config, 'parallel-task')).sourcePending);
      await assert.rejects(prepareDiscoverySource(config, 'parallel-task', { subagentAvailable: true }), /expired/);
      const ended = await endDiscoverySource(config, 'parallel-task', { ...envelope, outcome: 'expired',
        reason: 'Original native job returned after the unchanged task deadline',
        terminationReference: 'native-expired-job-result' });
      assert.equal(ended.sourcePending, null);
      assert.equal(ended.rows.find(r => r.id === 'source').status, 'blocked');
    } finally { Date.now = now; }
  });
});

test('missing pinned revision records a source-only gap without launching a subagent', async () => {
  await fixture(async ({ config, input }) => {
    await createDiscovery(config, { ...input, taskId: 'no-source-pin', sourceRevision: null });
    const result = await prepareDiscoverySource(config, 'no-source-pin', { subagentAvailable: true });
    assert.equal(result.sourcePending, null);
    assert.match(result.rows.find(r => r.id === 'source').reason, /pinned source revision/);
    assert.equal(result.rows.find(r => r.id === 'page').status, 'planned');
  });
});

test('default both mode cannot hide an entirely missing source lane', async () => {
  await fixture(async ({ config, input }) => {
    const result = await createDiscovery(config, { ...input, taskId: 'missing-source-rows', rows: [row()] });
    assert.equal(result.parallelSource, true);
    assert.match(result.sourceLaneGap, /No source-review rows/);
    assert.notEqual(result.coverageOutcome, 'complete');
  });
});

test('packaged native source agent has only read-only tools and inherits the caller model', async () => {
  const text = await readFile(new URL('../plugins/a11y-bug-bash/agents/a11y-source-review.agent.md', import.meta.url), 'utf8');
  assert.match(text, /model: inherit/);
  const tools = text.match(/tools:\s*\n([\s\S]*?)\n---/)[1];
  assert.deepEqual(tools.trim().split('\n').map(line => line.trim()), ['- view', '- grep', '- glob']);
  assert.match(text, /Do not request\s+the parent's transcript/);
});
