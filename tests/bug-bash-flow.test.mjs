import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileHash, hash } from '../src/runtime/core.mjs';
import { validateDiscoveryPlan, discoveryHash } from '../src/runtime/discovery-contract.mjs';
import { createDiscovery, discoveryStatus, appendDiscoveryRows, observeDiscovery, reconcileDiscovery,
  cancelDiscovery, cleanupDiscovery, reviewDiscoverySource, recordDiscoveryGap,
  reportDiscovery, deliverDiscovery, advanceDiscovery } from '../src/runtime/bug-bash.mjs';
import { plan, row } from './fixtures/discovery-plan.mjs';

async function fixture(body) {
  const root = await mkdtemp(join(tmpdir(), 'discovery-flow-'));
  const provider = fileURLToPath(new URL('fixtures/provider.mjs', import.meta.url));
  const definition = { executable: process.execPath, executableSha256: await fileHash(process.execPath),
    args: [provider], timeoutSeconds: 10 };
  const config = { schemaVersion: 1, owner: 'unit-owner', stateRoot: root,
    providers: { capture: definition, operations: definition },
    discoverySourceRoots: [root],
    discoveryProfiles: { 'fixture-browser': { capabilities: ['browser'], targets: ['fixture:dialog-form-v1'] } } };
  try { await body(config, root); } finally { await rm(root, { recursive: true, force: true }); }
}
async function finish(config, taskId) {
  await cleanupDiscovery(config, taskId);
  const saved = await reportDiscovery(config, taskId);
  assert.equal(saved.delivered, false);
  return deliverDiscovery(config, taskId);
}
test('discovery contracts reject inconsistent modes, duplicates, cycles and unbounded input', () => {
  validateDiscoveryPlan(plan());
  for (const bad of [
    { ...plan(), taskId: '../escape' }, { ...plan(), rows: [row(), row()] },
    { ...plan(), mode: 'source-only' }, { ...plan(), budgetSeconds: 0 },
    { ...plan(), extra: true }, { ...plan(), rows: [{ ...row(), dependsOn: ['missing'] }] },
    { ...plan(), rows: [{ ...row(), dependsOn: ['dialog-entry'] }] },
    { ...plan(), rows: [{ ...row(), id: 123 }] }
  ]) assert.throws(() => validateDiscoveryPlan(bad));
  assert.equal(discoveryHash({ b: 1, a: 2 }), discoveryHash({ a: 2, b: 1 }));
});
test('complete flow preserves page findings, independent source risks, evidence, cleanup and delivery', async () => {
  await fixture(async (config, root) => {
    const sourcePath = join(root, 'component.js'), source = 'export const missingFocus = true;\n';
    await writeFile(sourcePath, source);
    const request = { ...plan('whole-flow', [row('page', 'page', { status: 'finding' }), row('source', 'source')]), sourceRoots: [root] };
    await createDiscovery(config, request);
    const observed = await observeDiscovery(config, request.taskId, ['page']);
    assert.equal(observed.cleaned, false);
    const reviewed = await reviewDiscoverySource(config, request.taskId, {
      rowId: 'source', status: 'finding', actual: 'Read-only review of the scoped source',
      files: [{ path: sourcePath, sha256: hash(source), startLine: 1, endLine: 1 }],
      risks: [{ title: 'Potential missing focus restoration', impact: 'Keyboard navigation risk', confirmation: 'Observe the actual closing interaction' }]
    });
    assert.equal(reviewed.rows[1].sourceReview.runtimeVerified, false);
    assert.equal(reviewed.coverageOutcome, 'complete');
    assert.equal(reviewed.outcome, 'partial', 'Coverage is not cleanup/delivery');
    const done = await finish(config, request.taskId);
    assert.equal(done.lifecycle, 'closed'); assert.equal(done.outcome, 'complete');
    const report = await readFile(join(root, 'bug-bash', request.taskId, done.report.relativePath), 'utf8');
    for (const heading of ['Coverage matrix', 'Page-reproduced findings', 'Source-supported risks',
      'Context questions', 'Evidence index', 'Cleanup and resume']) assert(report.includes(heading));
    assert(report.includes('Confirmation needed: Observe'));
    await assert.rejects(observeDiscovery(config, request.taskId, ['page']), /pending child|delivered|Reconcile/);
  });
});
test('missing AT blocks only its rows while browser and source remain independent', async () => {
  await fixture(async config => {
    const request = plan('missing-at', [row('page'), row('speech', 'at')]);
    await createDiscovery(config, request);
    const result = await observeDiscovery(config, request.taskId, ['page', 'speech']);
    assert.equal(result.rows[0].status, 'observed-no-issue');
    assert.equal(result.rows[1].status, 'blocked');
    assert.match(result.rows[1].reason, /nvda/);
    assert.deepEqual(result.coverage, { total: 2, attempted: 1, conclusive: 1 });
    assert.equal((await finish(config, request.taskId)).outcome, 'partial');
  });
});
test('pending work keeps original operation and request identity without duplicate execution', async () => {
  await fixture(async (config, root) => {
    const request = plan('pending-flow', [row('page', 'page', { pending: true })]);
    await createDiscovery(config, request);
    const pending = await observeDiscovery(config, request.taskId, ['page']);
    const id = pending.pending.id, operationPath = join(root, 'operations', id, 'operation.json');
    const original = JSON.parse(await readFile(operationPath));
    await assert.rejects(observeDiscovery(config, request.taskId, ['page']), /pending child|Reconcile/);
    await assert.rejects(appendDiscoveryRows(config, request.taskId, [row('extra')], 'extra'), /in-flight/);
    const result = await reconcileDiscovery(config, request.taskId);
    assert.equal(result.pending, null);
    assert.equal(result.rows[0].attempts[0].operationId, id);
    const completed = JSON.parse(await readFile(operationPath));
    assert.equal(completed.request.requestId, original.request.requestId);
    assert.equal((await readdir(join(root, 'operations', id))).filter(file => file.startsWith('request-')).length, 1);
  });
});
test('additive plan revisions retain earlier rows and enforce dependencies before effects', async () => {
  await fixture(async config => {
    const request = plan('append-flow');
    await createDiscovery(config, request);
    await appendDiscoveryRows(config, request.taskId, [{ ...row('later'), dependsOn: ['dialog-entry'] }], 'Add follow-up');
    await assert.rejects(observeDiscovery(config, request.taskId, ['later']), /prerequisites/);
    await observeDiscovery(config, request.taskId, ['dialog-entry']);
    const result = await observeDiscovery(config, request.taskId, ['later']);
    assert.equal(result.coverage.conclusive, 2);
    await assert.rejects(appendDiscoveryRows(config, request.taskId, [row('later')], 'duplicate'), /duplicate/);
  });
});
test('task-scoped cancellation cannot cancel another task or restart explicitly stopped work', async () => {
  await fixture(async config => {
    const a = plan('task-a', [row('page', 'page', { pending: true })]), b = plan('task-b');
    await createDiscovery(config, a); await createDiscovery(config, b);
    await observeDiscovery(config, a.taskId, ['page']);
    const stopped = await cancelDiscovery(config, a.taskId, 'Owner stopped only task A');
    assert.equal(stopped.lifecycle, 'pending');
    assert(stopped.pending);
    assert.equal((await observeDiscovery(config, b.taskId, ['dialog-entry'])).coverage.conclusive, 1);
    await reconcileDiscovery(config, a.taskId);
    await assert.rejects(observeDiscovery(config, a.taskId, ['page']), /Cancelled/);
    assert.equal((await finish(config, a.taskId)).lifecycle, 'cancelled');
    assert.equal((await finish(config, b.taskId)).outcome, 'complete');
  });
});
test('durable history reconstructs a stale snapshot and detects changed artifacts', async () => {
  await fixture(async (config, root) => {
    const request = plan('rebuild-flow');
    await createDiscovery(config, request);
    await observeDiscovery(config, request.taskId, ['dialog-entry']);
    await writeFile(join(root, 'bug-bash', request.taskId, 'state.json'), '{"stale":true}');
    const status = await discoveryStatus(config, request.taskId);
    assert.equal(status.coverage.conclusive, 1);
    const operationId = status.rows[0].attempts[0].operationId;
    const operation = JSON.parse(await readFile(join(root, 'operations', operationId, 'operation.json')));
    await writeFile(join(root, 'operations', operationId, operation.receipt.artifacts[0].path), 'changed');
    await assert.rejects(discoveryStatus(config, request.taskId), /hash mismatch/);
  });
});
test('provider binding is pinned only to relevant services and source-only never invokes capture', async () => {
  await fixture(async (config, root) => {
    const request = { ...plan('source-flow', [row('source', 'source')]), mode: 'source-only' };
    await createDiscovery(config, request);
    config.providers.intake = { arbitraryUnrelatedChange: true };
    const result = await advanceDiscovery(config, request.taskId);
    assert.match(result.nextAction, /read-only knowledge/);
    await assert.rejects(readFile(join(root, 'operations')), { code: 'ENOENT' });
    await recordDiscoveryGap(config, request.taskId, ['source'], 'Authorized source was not supplied');
    assert.equal((await finish(config, request.taskId)).outcome, 'blocked');
  });
});
test('plan-only saves a plan report without page execution, and source tampering is rejected', async () => {
  await fixture(async (config, root) => {
    const request = { ...plan('plan-flow'), mode: 'plan-only' };
    await createDiscovery(config, request);
    await assert.rejects(observeDiscovery(config, request.taskId, ['dialog-entry']), /plan-only/);
    const result = await finish(config, request.taskId);
    assert.equal(result.outcome, 'plan-only');
    const sourcePlan = { ...plan('bad-source', [row('source', 'source')]), mode: 'source-only', sourceRoots: [root] };
    await createDiscovery(config, sourcePlan);
    const path = join(root, 'source.js'); await writeFile(path, 'actual');
    await assert.rejects(reviewDiscoverySource(config, sourcePlan.taskId, {
      rowId: 'source', status: 'observed-no-issue', actual: 'Read source', risks: [],
      files: [{ path, sha256: 'a'.repeat(64), startLine: 1, endLine: 1 }]
    }), /source bytes changed/);
  });
});
