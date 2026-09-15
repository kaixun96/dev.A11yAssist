import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { recoverDevBox, recoveryAuthority } from '../src/native/devcenter.mjs';
import { validateCapabilityInput, validateCapabilityReceipt } from '../src/runtime/capability.mjs';
import { executeOperation, reconcileOperation } from '../src/runtime/operations.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'a11y-cloud-unit-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const child of ['evaluator-recovery-leases', 'evaluator-recovery-owners', 'leases']) await mkdir(join(root, child));
  const token = 'synthetic-recovery-token-with-more-than-32-characters';
  const binding = { evaluator: 'unit-box', owner: 'unit-owner', subject: 'task:unit-task',
    recoveryId: '1'.repeat(32), authorizationReference: 'offline-owner-request' };
  const lease = { schemaVersion: 1, machineId: binding.evaluator, owner: binding.owner,
    recoveryId: binding.recoveryId, taskId: 'unit-task', tokenSha256: hash(token) };
  await writeFile(join(root, 'evaluator-recovery-leases', 'unit-box.json'), JSON.stringify(lease));
  await writeFile(join(root, 'evaluator-recovery-owners', `${hash(binding.owner)}.json`), JSON.stringify(lease));
  const provider = { kind: 'devcenter', poolRoot: root, recoveryTokenEnvironmentVariable: 'RECOVERY_TOKEN',
    authorizationEnvironmentVariable: 'CLOUD_TOKEN', machines: { 'unit-box': {
      endpoint: 'https://unit-test.devcenter.azure.com', projectName: 'unit-project',
      devBoxName: 'unit-devbox', userId: '11111111-2222-3333-4444-555555555555' } } };
  let progress, running = false, starts = 0, lost = false, failed = false, requests = 0;
  const checkpoint = async value => { progress = structuredClone(value); };
  const fetchImpl = async (url, init) => {
    requests++;
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers.Authorization, 'Bearer synthetic');
    if (init.method === 'POST') {
      starts++;
      assert.equal(progress.phase, 'start-intent');
      if (lost) throw new Error('Synthetic lost start response');
      return new Response('{}', { status: 202, headers: { 'Operation-Location':
        `${provider.machines['unit-box'].endpoint}/projects/unit-project/operationstatuses/111-222`,
        'Retry-After': '30' } });
    }
    if (url.includes('/operationstatuses/')) return Response.json({ status: failed ? 'Failed' : running ? 'Succeeded' : 'Running' });
    return Response.json({ name: 'unit-devbox', projectName: 'unit-project',
      user: provider.machines['unit-box'].userId, osType: 'Windows',
      provisioningState: 'Succeeded', powerState: running ? 'Running' : 'Stopped' });
  };
  const options = { operation: 'execute', checkpoint, fetchImpl,
    environment: { RECOVERY_TOKEN: token, CLOUD_TOKEN: 'Bearer synthetic' } };
  return { root, binding, provider, options, get progress() { return progress; },
    get starts() { return starts; }, get requests() { return requests; },
    setRunning: () => { running = true; }, lose: () => { lost = true; }, fail: () => { failed = true; } };
}

test('Dev Center starts only the original recovery-owned machine and preserves Retry-After/read-only continuation', async t => {
  const f = await fixture(t);
  let result = await recoverDevBox(f.provider, f.binding, f.options);
  assert.equal(result.state, 'pending');
  assert.equal(f.starts, 1);
  assert.equal(f.progress.phase, 'starting');
  const requests = f.requests;
  result = await recoverDevBox(f.provider, f.binding, { ...f.options, operation: 'reconcile', progress: f.progress });
  assert.equal(result.state, 'pending');
  assert.equal(f.requests, requests, 'server Retry-After prevents early polling');
  f.setRunning();
  result = await recoverDevBox(f.provider, f.binding, { ...f.options, operation: 'reconcile',
    progress: f.progress, now: Date.now() + 31000 });
  assert.equal(result.state, 'finished');
  assert.equal(f.starts, 1);
  assert.equal(result.interactiveReady, false);
  assert.equal(result.leaseReleased, false);
});

test('lost cloud start response never causes a second POST and current power is not AT readiness', async t => {
  const f = await fixture(t); f.lose();
  await assert.rejects(recoverDevBox(f.provider, f.binding, f.options), /lost start/);
  assert.equal(f.progress.phase, 'start-intent');
  let result = await recoverDevBox(f.provider, f.binding, { ...f.options, operation: 'reconcile', progress: f.progress });
  assert.equal(result.state, 'pending');
  f.setRunning();
  result = await recoverDevBox(f.provider, f.binding, { ...f.options, operation: 'reconcile', progress: f.progress });
  assert.equal(result.state, 'finished');
  assert.equal(result.atReady, false);
  assert.equal(f.starts, 1);
});

test('foreign tokens, changed recovery identity, active execution and missing checkpoints deny recovery', async t => {
  const f = await fixture(t);
  await assert.rejects(recoveryAuthority(f.provider, f.binding,
    { environment: { RECOVERY_TOKEN: 'wrong-token-that-is-longer-than-32-characters' } }), /does not match/);
  await assert.rejects(recoverDevBox(f.provider, f.binding, { ...f.options, operation: 'reconcile' }), /checkpoint is missing/);
  await recoverDevBox(f.provider, f.binding, f.options);
  await assert.rejects(recoverDevBox(f.provider, { ...f.binding, authorizationReference: 'changed' },
    { ...f.options, operation: 'reconcile', progress: f.progress }), /checkpoint changed/);
  await writeFile(join(f.root, 'leases', 'unit-box.json'), '{}');
  await assert.rejects(recoverDevBox(f.provider, f.binding, { ...f.options, operation: 'reconcile', progress: f.progress }),
    /execution lease exists/);
  assert.equal(f.starts, 1);
});

test('cloud continuation rejects foreign operation URLs and failed starts without restart/repair', async t => {
  const f = await fixture(t);
  await recoverDevBox(f.provider, f.binding, f.options);
  const progress = { ...f.progress, nextPollAt: null, operationUrl: 'https://other.example/operationstatuses/123' };
  await assert.rejects(recoverDevBox(f.provider, f.binding, { ...f.options, operation: 'reconcile', progress }), /Untrusted/);
  f.fail();
  const result = await recoverDevBox(f.provider, f.binding, { ...f.options, operation: 'reconcile',
    progress: { ...f.progress, nextPollAt: null } });
  assert.equal(result.state, 'failed');
  assert.equal(f.starts, 1);
});

test('setup cloud recovery contract cannot impersonate evaluator/AT readiness', () => {
  const input = { recoveryId: '1'.repeat(32), authorizationReference: 'owner-request' };
  const context = { subject: 'task:unit-task', evaluator: 'unit-box' };
  validateCapabilityInput('recover-devbox', input);
  const receipt = { ...context, stage: 'recover-devbox', outcome: 'pass', recoveryId: input.recoveryId,
    scope: 'devbox-power-start-only', interactiveReady: false, atReady: false, leaseReleased: false,
    gates: { originalRecoveryOwned: true, cloudPowerRunning: true },
    artifacts: [{ path: 'cloud.json', sha256: 'a'.repeat(64) }] };
  validateCapabilityReceipt('recover-devbox', receipt, context, input);
  assert.throws(() => validateCapabilityReceipt('recover-devbox', { ...receipt, atReady: true }, context, input));
  assert.throws(() => validateCapabilityInput('recover-devbox', { ...input, force: true }));
});

test('public setup operation persists native start and reconciles the original cloud effect without a second POST', async t => {
  const f = await fixture(t);
  const priorToken = process.env.CLOUD_TOKEN, priorRecovery = process.env.RECOVERY_TOKEN;
  process.env.CLOUD_TOKEN = f.options.environment.CLOUD_TOKEN;
  process.env.RECOVERY_TOKEN = f.options.environment.RECOVERY_TOKEN;
  t.after(() => {
    if (priorToken === undefined) delete process.env.CLOUD_TOKEN; else process.env.CLOUD_TOKEN = priorToken;
    if (priorRecovery === undefined) delete process.env.RECOVERY_TOKEN; else process.env.RECOVERY_TOKEN = priorRecovery;
  });
  let starts = 0, running = false;
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (init.method === 'POST') {
      starts++;
      return new Response('{}', { status: 202, headers: { 'operation-location':
        `${f.provider.machines['unit-box'].endpoint}/projects/unit-project/operationstatuses/123-456` } });
    }
    if (url.includes('/operationstatuses/')) return Response.json({ status: running ? 'Succeeded' : 'Running' });
    return Response.json({ name: 'unit-devbox', projectName: 'unit-project',
      user: f.provider.machines['unit-box'].userId, osType: 'Windows',
      provisioningState: 'Succeeded', powerState: running ? 'Running' : 'Stopped' });
  });
  const config = { schemaVersion: 1, owner: f.binding.owner, stateRoot: f.root, providers: {
    resources: { ...f.provider, waiting: { mode: 'caller-poll', pollIntervalSeconds: 1, timeoutSeconds: 60 } }
  } };
  const input = { recoveryId: f.binding.recoveryId, authorizationReference: f.binding.authorizationReference };
  const context = { subject: f.binding.subject, evaluator: f.binding.evaluator };
  const first = await executeOperation(config, 'a11y-setup', 'unit-cloud-operation', 'recover-devbox', context, input);
  assert.equal(first.status, 'pending');
  assert.equal(starts, 1);
  running = true;
  const final = await reconcileOperation(config, 'a11y-setup', 'unit-cloud-operation');
  assert.equal(final.status, 'finished');
  assert.equal(final.receipt.outcome, 'pass');
  assert.equal(final.receipt.atReady, false);
  assert.equal(final.receipt.leaseReleased, false);
  assert.equal(starts, 1);
  const repeat = await executeOperation(config, 'a11y-setup', 'unit-cloud-operation', 'recover-devbox', context, input);
  assert.deepEqual(repeat.receipt, final.receipt);
  assert.equal(starts, 1);
});
