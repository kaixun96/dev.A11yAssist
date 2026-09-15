import { readFile, realpath, lstat } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { hostAuthorization, validateHostAuthentication } from './host-auth.mjs';

const demand = (value, message) => { if (!value) throw new Error(message); };
const digest = value => createHash('sha256').update(value).digest('hex');
const name = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,62}$/;
const guid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const api = '?api-version=2024-02-01';

export function validateDevCenter(provider) {
  demand(provider.kind === 'devcenter' && isAbsolute(provider.poolRoot ?? '') &&
    /^[A-Z][A-Z0-9_]{0,100}$/.test(provider.recoveryTokenEnvironmentVariable ?? '') &&
    provider.machines && typeof provider.machines === 'object' && !Array.isArray(provider.machines) &&
    Object.keys(provider.machines).length > 0 && Object.keys(provider.machines).length <= 100,
  'Dev Center requires the existing authoritative pool, token environment name and explicit machine mapping');
  validateHostAuthentication(provider);
  for (const [id, machine] of Object.entries(provider.machines)) {
    demand(name.test(id) && machine && typeof machine === 'object' &&
      Object.keys(machine).sort().join(',') === 'devBoxName,endpoint,projectName,userId' &&
      name.test(machine.devBoxName ?? '') && name.test(machine.projectName ?? '') && guid.test(machine.userId ?? ''),
    'Invalid exact Dev Center machine mapping');
    const endpoint = new URL(machine.endpoint);
    demand(endpoint.protocol === 'https:' && endpoint.hostname.endsWith('.devcenter.azure.com') &&
      !endpoint.port && !endpoint.username && !endpoint.password &&
      endpoint.pathname === '/' && !endpoint.search && !endpoint.hash, 'Expected an exact public-cloud Dev Center endpoint');
  }
}

async function smallJson(path) {
  const info = await lstat(path);
  demand(info.isFile() && !info.isSymbolicLink() && info.size <= 1024 * 1024, 'Invalid original registry record');
  const bytes = await readFile(path);
  demand(bytes.length <= 1024 * 1024, 'Original registry record exceeds budget');
  return JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
}

export async function recoveryAuthority(provider, binding, options = {}) {
  demand(name.test(binding.evaluator ?? '') && provider.machines[binding.evaluator] &&
    typeof binding.owner === 'string' && binding.owner &&
    /^[a-f0-9]{32}$/.test(binding.recoveryId ?? ''), 'Recovery must identify an exact owned machine and recovery ID');
  const root = await realpath(provider.poolRoot);
  const token = (options.environment ?? process.env)[provider.recoveryTokenEnvironmentVariable];
  demand(typeof token === 'string' && token.length >= 32, 'Original recovery token unavailable');
  const lease = await smallJson(join(root, 'evaluator-recovery-leases', `${binding.evaluator}.json`));
  const owner = await smallJson(join(root, 'evaluator-recovery-owners', `${digest(binding.owner)}.json`));
  for (const value of [lease, owner]) demand(value.schemaVersion === 1 &&
    value.machineId === binding.evaluator && value.owner === binding.owner &&
    value.recoveryId === binding.recoveryId && value.tokenSha256 === digest(token),
  'Original recovery lease/owner/token does not match; no resource mutation authorized');
  demand((lease.taskId ? `task:${lease.taskId}` : lease.bug) === binding.subject,
    'Recovery subject differs from original task/Bug');
  let absent = false;
  try { await lstat(join(root, 'leases', `${binding.evaluator}.json`)); }
  catch (error) { if (error.code !== 'ENOENT') throw error; absent = true; }
  demand(absent, 'An execution lease exists; recovery cannot touch this machine');
  return { poolRoot: root, recoveryId: lease.recoveryId, evaluator: lease.machineId,
    subject: binding.subject, owner: lease.owner };
}

async function responseJson(response) {
  demand(response.ok, `Dev Center request failed (HTTP ${response.status}); preserve the original operation`);
  demand(response.body, 'Dev Center response body is missing');
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.length;
    demand(size <= 1024 * 1024, 'Dev Center response exceeds 1 MiB');
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export async function recoverDevBox(provider, binding, options) {
  validateDevCenter(provider);
  demand(options && typeof options.checkpoint === 'function' &&
    ['execute', 'reconcile'].includes(options.operation), 'Recovery requires durable checkpoints and explicit operation');
  const check = () => recoveryAuthority(provider, binding, options);
  const authority = await check();
  const machine = provider.machines[binding.evaluator];
  const base = `${machine.endpoint.replace(/\/$/, '')}/projects/${encodeURIComponent(machine.projectName)}`;
  const resource = `${base}/users/${machine.userId}/devboxes/${encodeURIComponent(machine.devBoxName)}`;
  const identity = digest(JSON.stringify({ authority, machine, authorizationReference: binding.authorizationReference }));
  let progress = options.progress;
  if (!progress) {
    demand(options.operation === 'execute', 'Original recovery checkpoint is missing; never replay start');
    progress = { schemaVersion: 1, identity, phase: 'prepared', operationUrl: null };
    await options.checkpoint(progress);
  }
  demand(progress.schemaVersion === 1 && progress.identity === identity &&
    ['prepared', 'start-intent', 'starting', 'observed-running', 'failed'].includes(progress.phase),
  'Recovery configuration/authority or checkpoint changed');
  if (progress.nextPollAt && Date.parse(progress.nextPollAt) > (options.now ?? Date.now())) {
    return { state: 'pending', progress, scope: 'devbox-power-start-only',
      interactiveReady: false, atReady: false, leaseReleased: false, authority };
  }
  const authorization = await hostAuthorization(provider, 'devcenter', options);
  const request = async (url, method = 'GET') => {
    await check();
    const result = await (options.fetchImpl ?? fetch)(url, { method,
      headers: { Authorization: authorization }, redirect: 'error', signal: AbortSignal.timeout(30000) });
    await check();
    const retry = result.headers.get('retry-after');
    if (retry) {
      const seconds = /^\d+$/.test(retry) ? Number(retry) : Math.ceil((Date.parse(retry) - Date.now()) / 1000);
      demand(Number.isFinite(seconds) && seconds >= 0 && seconds <= 86400, 'Invalid Dev Center Retry-After');
      progress = { ...progress, nextPollAt: new Date((options.now ?? Date.now()) + seconds * 1000).toISOString() };
      await options.checkpoint(progress);
    }
    return result;
  };
  const readBox = async () => {
    const box = await responseJson(await request(resource + api));
    demand(box.name === machine.devBoxName && box.projectName === machine.projectName &&
      box.user?.toLowerCase() === machine.userId.toLowerCase() && box.osType === 'Windows',
    'Cloud resource identity differs from the authorized Windows DevBox');
    return box;
  };
  const running = async box => {
    if (box.powerState !== 'Running') return false;
    progress = { ...progress, phase: 'observed-running', powerState: box.powerState };
    await options.checkpoint(progress);
    return true;
  };
  const result = state => ({ state, progress, scope: 'devbox-power-start-only',
    interactiveReady: false, atReady: false, leaseReleased: false, authority });
  if (progress.operationUrl) {
    const operation = new URL(progress.operationUrl);
    demand(operation.origin === new URL(base).origin && !operation.username && !operation.password &&
      !operation.hash && operation.pathname.startsWith(new URL(base).pathname + '/operationstatuses/') &&
      /^[a-zA-Z0-9-]+$/.test(operation.pathname.split('/').at(-1)),
    'Untrusted Dev Center operation URL; do not forward authorization');
    const status = await responseJson(await request(operation.href));
    demand(['NotStarted', 'Running', 'Succeeded', 'Failed', 'Canceled'].includes(status.status), 'Unknown cloud operation status');
    if (['Failed', 'Canceled'].includes(status.status)) {
      progress = { ...progress, phase: 'failed', status: status.status };
      await options.checkpoint(progress);
      return { ...result('failed'), reason: `Dev Center start operation ${status.status}` };
    }
  }
  const box = await readBox();
  if (await running(box)) return result('finished');
  if (progress.phase === 'failed') return { ...result('failed'), reason: 'Original Dev Center start failed; no replay' };
  if (options.operation === 'reconcile' || progress.phase !== 'prepared') return result('pending');
  demand(['Stopped', 'Hibernated', 'Deallocated'].includes(box.powerState) &&
    box.provisioningState === 'Succeeded', 'DevBox is not in a known startable state; no restart/repair or replacement attempted');
  progress = { ...progress, phase: 'start-intent' };
  await options.checkpoint(progress);
  const response = await request(`${resource}:start${api}`, 'POST');
  demand(response.status === 202, `Dev Center start response is uncertain (HTTP ${response.status}); reconcile without replay`);
  const location = response.headers.get('operation-location');
  demand(location, 'Start accepted without Operation-Location; retain original intent and reconcile resource state');
  // Validate the URL before it can enter a persisted continuation.
  const operation = new URL(location);
  demand(operation.origin === new URL(base).origin && !operation.username && !operation.password &&
    !operation.hash && operation.pathname.startsWith(new URL(base).pathname + '/operationstatuses/') &&
    /^[a-zA-Z0-9-]+$/.test(operation.pathname.split('/').at(-1)), 'Untrusted start operation URL');
  progress = { ...progress, phase: 'starting', operationUrl: operation.href };
  await options.checkpoint(progress);
  return result('pending');
}
