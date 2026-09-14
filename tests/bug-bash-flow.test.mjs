import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fileHash, hash } from '../src/runtime/core.mjs';
import { validateDiscoveryPlan, discoveryHash } from '../src/runtime/discovery-contract.mjs';
import { createDiscovery, discoveryStatus, appendDiscoveryRows, observeDiscovery, reconcileDiscovery,
  cancelDiscovery, cleanupDiscovery, reviewDiscoverySource, recordDiscoveryGap,
  reportDiscovery, deliverDiscovery, advanceDiscovery, configureDiscoveryRows,
  appendDiscoveryTargets, excludeDiscoveryRows, validateDiscovery, runDiscovery } from '../src/runtime/bug-bash.mjs';
import { plan, row } from './fixtures/discovery-plan.mjs';

async function fixture(body) {
  const root = await mkdtemp(join(tmpdir(), 'discovery-flow-'));
  const provider = fileURLToPath(new URL('fixtures/provider.mjs', import.meta.url));
  const definition = { executable: process.execPath, executableSha256: await fileHash(process.execPath),
    args: [provider], timeoutSeconds: 10 };
  const config = { schemaVersion: 1, owner: 'unit-owner', stateRoot: root,
    pluginRoots: { testCategories: fileURLToPath(new URL('../plugins/a11y-test-categories', import.meta.url)) },
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
test('browser profiles reject overlarge batches before creating a task or any effect', async () => {
  await fixture(async (config, root) => {
    config.discoveryProfiles['fixture-browser'].kind = 'browser-scenarios';
    config.discoveryProfiles['fixture-browser'].maxBatchRows = 31;
    await assert.rejects(createDiscovery(config, plan()), /batch limit/);
    await assert.rejects(readdir(join(root, 'bug-bash')), { code: 'ENOENT' });
  });
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
    assert.equal(reviewed.scenarioOutcome, 'complete');
    assert.equal(reviewed.coverageOutcome, 'partial', 'No all-target category inventory was supplied');
    assert.equal(reviewed.outcome, 'partial', 'Coverage is not cleanup/delivery');
    const done = await finish(config, request.taskId);
    assert.equal(done.lifecycle, 'closed'); assert.equal(done.outcome, 'partial');
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
    assert.equal((await finish(config, b.taskId)).outcome, 'partial');
  });
});

const inventory = complete => ({
    schemaVersion: 1, scope: 'Synthetic two-target accounting fixture; never live evidence',
    inventoryComplete: complete, inventoryEvidence: 'Unit fixture defines exactly two targets',
    targets: ['first', 'second'].map(id => ({ id, target: `${id} synthetic button`,
      scenario: 'Synthetic dialog', state: 'open' }))
  });
test('every target expands all ten categories and 61 ordered steps without sampling', async () => {
    await fixture(async config => {
      config.discoveryProfiles['fixture-browser'].capabilities = ['browser', 'nvda', 'voice-access'];
      const request = { ...plan('all-categories', []), maxRows: 500, inventory: inventory(false) };
      const created = await createDiscovery(config, request);
      assert.equal(created.rows.length, 122);
      assert.equal(created.categoryCoverage.categories, 10);
      assert.equal(created.categoryCoverage.pending, 122);
      assert.equal(created.categoryCoverage.accountingComplete, false);
      await assert.rejects(observeDiscovery(config, request.taskId, [created.rows[1].id]), /in order/);
      assert.equal(created.rows.filter(row => row.coverage.category === 'voice-access').every(row =>
        row.track === 'at' && row.capability === 'voice-access'), true);
      const observed = await observeDiscovery(config, request.taskId, created.rows.map(row => row.id));
      assert.equal(observed.coverage.conclusive, 122, 'Only synthetic provider receipts were used');
      assert.equal(observed.coverageOutcome, 'partial', 'Unknown inventory cannot become complete');
      const revision = await appendDiscoveryTargets(config, request.taskId, inventory(true), 'Complete synthetic inventory');
      assert.equal(revision.coverageOutcome, 'complete');
      const done = await finish(config, request.taskId);
      assert.equal(done.outcome, 'complete');
      assert.equal((await validateDiscovery(config, request.taskId)).categoryAccountingComplete, true);
    });
  });
test('configuration cannot erase category identity, substitute browser evidence for AT or shrink inventory', async () => {
    await fixture(async config => {
      const request = { ...plan('category-config', []), maxRows: 500, inventory: inventory(true) };
      const created = await createDiscovery(config, request);
      const speech = created.rows.find(row => row.coverage.category === 'screen-reader');
      await assert.rejects(configureDiscoveryRows(config, request.taskId, [{
        id: speech.id, track: 'page', capability: 'browser'
      }], 'Fake speech via DOM'), /real AT/);
      await assert.rejects(configureDiscoveryRows(config, request.taskId, [{
        id: speech.id, coverage: {}
      }], 'Erase category'), /identity/);
      await assert.rejects(appendDiscoveryTargets(config, request.taskId,
        { ...inventory(true), targets: inventory(true).targets.slice(0, 1) }, 'Shrink'), /remove or rewrite/);
      await excludeDiscoveryRows(config, request.taskId, [{
        rowId: created.rows[0].id, basis: 'feature-not-applicable', reason: 'Synthetic target-specific exclusion'
      }]);
      await assert.rejects(excludeDiscoveryRows(config, request.taskId, [{
        rowId: created.rows[1].id, basis: 'tool-missing', reason: 'AT missing'
      }]), /feature reason/);
      assert.equal((await discoveryStatus(config, request.taskId)).categoryCoverage.applicable, 121);
      const before = (await discoveryStatus(config, request.taskId)).planHash;
      await configureDiscoveryRows(config, request.taskId, [{
        id: created.rows[1].id, parameters: { status: 'blocked' }
      }], 'Bind synthetic adapter');
      assert.notEqual((await discoveryStatus(config, request.taskId)).planHash, before);
    });
  });
test('provider-free plan and source rounds deliver a verified private file without capture', async () => {
    await fixture(async (config, root) => {
      config.providers = {};
      const request = { ...plan('local-plan'), mode: 'plan-only' };
      await createDiscovery(config, request);
      const done = await runDiscovery(config, request.taskId);
      assert.equal(done.lifecycle, 'closed');
      assert.equal(done.delivered.channel, 'private-local-file');
      assert.equal(done.delivered.messageSent, false);
      assert.equal(hash(await readFile(done.delivered.reference)), done.report.sha256);
      await assert.rejects(readdir(join(root, 'operations')), { code: 'ENOENT' });
      const configPath = join(root, 'config.json');
      await writeFile(configPath, JSON.stringify(config));
      const rpc = { jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: 'a11y_validate_discovery', arguments: { taskId: request.taskId } } };
      const result = spawnSync(process.execPath, [
        fileURLToPath(new URL('../plugins/a11y-validate/runtime/mcp.mjs', import.meta.url)), 'a11y-validate'
      ], { input: JSON.stringify(rpc) + '\n', encoding: 'utf8', timeout: 10000,
        env: { ...process.env, A11Y_ASSIST_CONFIG: configPath } });
      assert.equal(result.status, 0, result.stderr);
      const response = JSON.parse(result.stdout).result;
      assert.equal(response.isError, undefined, response.content?.[0]?.text);
      assert.equal(JSON.parse(response.content[0].text).integrity, 'verified');
    });
  });
test('source dependency and original deadline are enforced without an endless source-review loop', async () => {
    await fixture(async (config, root) => {
      const request = { ...plan('source-dependency', [
        row('page'), { ...row('source', 'source'), dependsOn: ['page'] }
      ]), sourceRoots: [root] };
      await createDiscovery(config, request);
      const sourcePath = join(root, 'source.txt'); await writeFile(sourcePath, 'unit source');
      await assert.rejects(reviewDiscoverySource(config, request.taskId, {
        rowId: 'source', status: 'observed-no-issue', actual: 'Unit review', risks: [],
        files: [{ path: sourcePath, sha256: hash('unit source'), startLine: 1, endLine: 1 }]
      }), /prerequisites/);
      const expired = { ...plan('expired-source', [row('source', 'source')]), mode: 'source-only', budgetSeconds: 1 };
      await createDiscovery(config, expired);
      await new Promise(resolve => setTimeout(resolve, 1100));
      const gap = await advanceDiscovery(config, expired.taskId);
      assert.equal(gap.rows[0].status, 'blocked');
      assert.match(gap.rows[0].reason, /budget exhausted/);
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
