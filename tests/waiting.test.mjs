import test from 'node:test';
import assert from 'node:assert/strict';
import { createWaiting, validateWaitingConfig, validateRequestWaiting, pendingDetails } from '../src/runtime/waiting.mjs';
import { invokeCapability } from '../src/runtime/capability.mjs';
import { detachedRequirements } from '../src/adapters/cli.mjs';

const now = Date.parse('2026-01-01T00:00:00.000Z');
const policy = { mode: 'caller-poll', pollIntervalSeconds: 10, timeoutSeconds: 60 };
const config = { providers: { capture: { waiting: policy } } };
const waiting = createWaiting(config, 'capture', now);
const request = { operation: 'execute', waiting };
const response = { state: 'pending', resumeCondition: 'Original fixture completion', progressPath: 'fixture-progress.json', waiting };

test('waiting is explicit bounded operator configuration; callback remains the default', () => {
  assert.equal(createWaiting({}, 'capture', now), undefined);
  assert.equal(createWaiting({ providers: { capture: { waiting: { mode: 'callback' } } } }, 'capture', now), undefined);
  for (const bad of [null, [], {}, { mode: 'auto' }, { mode: 'callback', timeoutSeconds: 60 },
    { ...policy, pollIntervalSeconds: 0 }, { ...policy, timeoutSeconds: 5 },
    { ...policy, timeoutSeconds: 86401 }, { ...policy, timeoutSeconds: 60.5 },
    { ...policy, fallback: true }]) {
    assert.throws(() => validateWaitingConfig({ waiting: bad }, 'cli'));
  }
  assert.throws(() => validateWaitingConfig({ waiting: policy }, 'twin'), /not Twin/);
  assert.throws(() => validateWaitingConfig({ waiting: policy, kind: 'ado' }), /Native ADO/);
  assert.deepEqual(waiting, { mode: 'caller-poll', pollIntervalSeconds: 10, deadlineAt: '2026-01-01T00:01:00.000Z' });
  assert.equal(detachedRequirements().completionCallback, 'required');
  assert.equal(detachedRequirements(waiting).callerPolling, 'required');
  assert.equal(detachedRequirements(waiting).deadlineIsCancellation, false);
});

test('callback failures never fall back to polling and polling cannot advertise a fictitious callback', () => {
  const callback = { ...response, waiting: undefined, completionCallback: 'fixture-callback' };
  assert.equal(pendingDetails({}, callback, now).completionCallback, 'fixture-callback');
  assert.throws(() => pendingDetails({}, { ...callback, completionCallback: '' }, now), /completionCallback/);
  assert.throws(() => pendingDetails({}, response, now), /cannot replace selected callback/);
  assert.throws(() => pendingDetails(request, { ...response, completionCallback: 'unused' }, now), /cannot advertise/);
  for (const bad of [undefined, { ...waiting, mode: 'callback' }, { ...waiting, pollIntervalSeconds: 20 },
    { ...waiting, deadlineAt: '2026-01-01T00:02:00.000Z' }, { ...waiting, extra: true }]) {
    assert.throws(() => pendingDetails(request, { ...response, waiting: bad }, now));
  }
  assert.deepEqual(pendingDetails(request, response, now).waiting, waiting);
});

test('expired waiting does not extend deadlines, cancel native work or authorize replay', async () => {
  assert.throws(() => validateRequestWaiting({}, 'capture', request, now), /not selected/);
  assert.throws(() => validateRequestWaiting(config, 'capture', {}, now), /Invalid caller/);
  assert.throws(() => validateRequestWaiting(config, 'capture', { ...request,
    waiting: { ...waiting, deadlineAt: '2026-01-02T00:00:00.000Z' } }, now), /exceeds configured budget/);
  assert.throws(() => validateRequestWaiting(config, 'capture', request, now + 60000), /expired before execution/);
  validateRequestWaiting(config, 'capture', { ...request, operation: 'reconcile' }, now + 60000);
  assert.throws(() => pendingDetails(request, response, now + 60000), /native outcome remains unknown/);
  let calls = 0;
  await assert.rejects(invokeCapability(config, 'before', { ...request,
    waiting: { ...waiting, deadlineAt: new Date(Date.now() - 1000).toISOString() } },
  async () => { calls++; }), /expired before execution/);
  assert.equal(calls, 0);
});
