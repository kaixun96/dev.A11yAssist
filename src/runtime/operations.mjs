import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { VERSION, atomicJson, withDirectoryLock, verifyArtifactFiles, hash, callProvider } from './core.mjs';
import { operationDefinition, validateContext, validateCapabilityInput, providerFor, invokeCapability, validateCapabilityReceipt } from './capability.mjs';
import { createWaiting, pendingDetails, validateWaitingConfig } from './waiting.mjs';

function demand(condition, message) { if (!condition) throw new Error(message); }
function directory(config, operationId) {
  demand(typeof operationId === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(operationId), 'Invalid operation ID');
  return join(config.stateRoot, 'operations', operationId);
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}
function binding(config, action) {
  const name = providerFor(config, action);
  demand(config.providers?.[name], `Missing ${name} provider; capability not started`);
  validateWaitingConfig(config.providers[name], config.mode);
  return hash(JSON.stringify(canonical({ name, definition: config.providers[name], profile: config.workflowProfile ?? 'generic' })));
}
async function readState(dir) {
  try { return JSON.parse(await readFile(join(dir, 'operation.json'), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
function owned(state, config, plugin) {
  demand(state && state.schemaVersion === 1 && state.owner === config.owner && state.plugin === plugin && state.version === VERSION,
    'Foreign owner/plugin or incompatible operation version');
  demand(['pending', 'finished'].includes(state.status), 'Invalid operation state');
}
async function verifyFinished(dir, state) {
  demand(state.receipt && hash(JSON.stringify(state.receipt)) === state.receiptSha256, 'Recorded capability receipt hash mismatch');
  demand(state.receipt.owner === state.owner && state.receipt.runId === state.operationId &&
    state.receipt.requestId === state.request.requestId, 'Recorded capability receipt identity mismatch');
  validateCapabilityReceipt(state.action, state.receipt, state.request.run, state.request.input);
  await verifyArtifactFiles(dir, state.receipt);
}
function publicOperation(state) {
  return {
    operationId: state.operationId, action: state.action, status: state.status,
    requestId: state.request.requestId, updatedAt: state.updatedAt,
    receipt: state.receipt, receiptSha256: state.receiptSha256, pending: state.pending,
    waiting: state.status === 'pending' ? state.request.waiting : undefined
  };
}
async function consume(config, dir, state, operation) {
  demand(binding(config, state.action) === state.providerBinding, 'Operation provider changed; do not replay with a different executor');
  const response = await invokeCapability(config, state.action, { ...state.request, operation }, callProvider);
  if (response.state === 'pending') {
    state.pending = pendingDetails(state.request, response);
  } else {
    await verifyArtifactFiles(dir, response.receipt);
    state.receipt = response.receipt;
    state.receiptSha256 = hash(JSON.stringify(response.receipt));
    state.status = 'finished';
    delete state.pending;
  }
  state.updatedAt = new Date().toISOString();
  await atomicJson(join(dir, 'operation.json'), state);
  return publicOperation(state);
}
export async function executeOperation(config, plugin, operationId, action, context, input = {}) {
  operationDefinition(action, plugin);
  validateContext(action, context);
  validateCapabilityInput(action, input);
  const providerBinding = binding(config, action);
  const dir = directory(config, operationId);
  await mkdir(dir, { recursive: true });
  return withDirectoryLock(dir, async () => {
    const fingerprint = hash(JSON.stringify(canonical({ action, context, input })));
    let state = await readState(dir);
    if (state) {
      owned(state, config, plugin);
      demand(state.fingerprint === fingerprint, 'Operation ID already binds different inputs');
      demand(state.providerBinding === providerBinding, 'Operation provider changed');
      demand(state.status === 'finished', 'Operation pending; reconcile the same operation instead of executing again');
      await verifyFinished(dir, state);
      return publicOperation(state);
    }
    state = {
      schemaVersion: 1, version: VERSION, operationId, owner: config.owner, plugin,
      action, fingerprint, providerBinding, status: 'pending', updatedAt: new Date().toISOString(),
      request: {
        schemaVersion: 1, version: VERSION, operation: 'execute', requestId: randomUUID(),
        stage: action, invocation: 'capability', stateDirectory: dir, input,
        ...(config.providers[providerFor(config, action)].waiting?.mode === 'caller-poll'
          ? { waiting: createWaiting(config, providerFor(config, action)) } : {}),
        run: { ...context, runId: operationId, owner: config.owner, receipts: [] }
      }
    };
    // Persist identity before any external effect. Unknown outcomes stay pending.
    await atomicJson(join(dir, 'operation.json'), state);
    return consume(config, dir, state, 'execute');
  });
}
export async function operationStatus(config, plugin, operationId) {
  const dir = directory(config, operationId);
  const state = await readState(dir);
  owned(state, config, plugin);
  if (state.status === 'finished') await verifyFinished(dir, state);
  return publicOperation(state);
}
export async function reconcileOperation(config, plugin, operationId) {
  const dir = directory(config, operationId);
  return withDirectoryLock(dir, async () => {
    const state = await readState(dir);
    owned(state, config, plugin);
    demand(state.status === 'pending', 'Operation is not pending');
    return consume(config, dir, state, 'reconcile');
  });
}
