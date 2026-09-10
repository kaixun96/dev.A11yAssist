import { readFile, mkdir, open, rename, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash, randomUUID } from 'node:crypto';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { invokeCapability, providerFor } from './capability.mjs';
import { validateProfileReceipt } from './profiles.mjs';

const contractDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../contracts');
export const workflow = JSON.parse(await readFile(join(contractDirectory, 'workflow.json'), 'utf8'));
export const plugins = JSON.parse(await readFile(join(contractDirectory, 'plugins.json'), 'utf8'));
export const VERSION = workflow.version;
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/;
const shaPattern = /^[a-f0-9]{64}$/;
const commitPattern = /^[a-f0-9]{40}$/;
export const hash = value => createHash('sha256').update(value).digest('hex');

function demand(condition, message) {
  if (!condition) throw new Error(message);
}

export async function readConfig(path = process.env.A11Y_ASSIST_CONFIG, { fullWorkflow = true } = {}) {
  demand(path && isAbsolute(path), 'A11Y_ASSIST_CONFIG must name an absolute private configuration file');
  const config = JSON.parse(await readFile(path, 'utf8'));
  demand(config.schemaVersion === 1, 'Unsupported configuration');
  demand(config.workflowProfile === undefined || ['generic', 'agentow-odsp'].includes(config.workflowProfile),
    'Unsupported workflow profile');
  if (fullWorkflow) demand(workflow.modes.includes(config.mode), 'Unsupported configuration/mode');
  demand(typeof config.owner === 'string' && idPattern.test(config.owner), 'Configuration requires an auditable owner namespace');
  demand(typeof config.stateRoot === 'string' && isAbsolute(config.stateRoot), 'stateRoot must be absolute shared storage');
  if (fullWorkflow) demand(Array.isArray(config.devboxes) && config.devboxes.length > 0 &&
    config.devboxes.every(id => typeof id === 'string' && idPattern.test(id)) &&
    new Set(config.devboxes).size === config.devboxes.length, 'Provide unique Windows DevBox identifiers');
  if (fullWorkflow) demand(config.mode !== 'twin' || config.devboxes.length >= 2, 'Twin mode requires multiple DevBoxes');
  demand(config.providers && typeof config.providers === 'object', 'Explicit trusted providers are required');
  if (fullWorkflow && config.mode === 'twin') {
    demand(typeof config.twin?.conversationId === 'string' && config.twin.conversationId &&
      typeof config.twin?.runtimePath === 'string' && isAbsolute(config.twin.runtimePath),
    'Twin mode requires an exact conversation binding and local runtime metadata path');
  }
  for (const [name, provider] of Object.entries(config.providers)) {
    demand(['intake', 'capture', 'source', 'review', 'agentow', 'validate', 'publish', 'operations', 'resources'].includes(name), 'Unknown provider');
    demand(provider && typeof provider.executable === 'string' && isAbsolute(provider.executable) &&
      Array.isArray(provider.args) && provider.args.every(a => typeof a === 'string') &&
      shaPattern.test(provider.executableSha256 ?? ''), `Invalid pinned provider: ${name}`);
    demand(Number.isInteger(provider.timeoutSeconds) && provider.timeoutSeconds >= 1 &&
      provider.timeoutSeconds <= 600, 'Provider RPCs must be bounded (1-600 seconds); detach long work inside provider');
  }
  return config;
}

export async function fileHash(path) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(path)) digest.update(chunk);
  return digest.digest('hex');
}

export async function doctor(config) {
  const capabilities = {};
  for (const name of ['intake', 'capture', 'source', 'review', 'agentow', 'validate', 'publish', 'operations', 'resources']) {
    const provider = config.providers[name];
    if (!provider) { capabilities[name] = 'not-configured'; continue; }
    try {
      capabilities[name] = (await fileHash(provider.executable)) === provider.executableSha256
        ? 'configured-not-live-verified' : 'executable-hash-mismatch';
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      capabilities[name] = 'executable-missing';
    }
  }
  return { version: VERSION, mode: config.mode, devboxCount: config.devboxes?.length ?? 0,
    capabilities, liveReady: false,
    note: 'Configuration is not runtime/AT/auth readiness. Execute provider preflight under the correct resource owner.' };
}

function pathFor(config, runId) {
  demand(typeof runId === 'string' && idPattern.test(runId), 'Invalid run ID');
  return join(config.stateRoot, 'runs', runId);
}

export async function atomicJson(path, value) {
  const temp = `${path}.${randomUUID()}.tmp`;
  const file = await open(temp, 'wx');
  try { await file.writeFile(JSON.stringify(value, null, 2)); await file.sync(); }
  finally { await file.close(); }
  await rename(temp, path);
}

async function exclusive(config, runId, operation) {
  const dir = pathFor(config, runId);
  return withDirectoryLock(dir, () => operation(dir));
}
export async function withDirectoryLock(dir, operation) {
  const lock = await open(join(dir, 'mutation.lock'), 'wx');
  try { return await operation(); }
  finally {
    await lock.close();
    const { unlink } = await import('node:fs/promises');
    await unlink(join(dir, 'mutation.lock'));
  }
}

export async function loadRun(config, runId) {
  const state = JSON.parse(await readFile(join(pathFor(config, runId), 'run.json'), 'utf8'));
  demand(state.owner === config.owner && state.version === VERSION && state.schemaVersion === 1,
    'Foreign owner or incompatible run version; do not mutate it');
  demand(state.mode === config.mode, 'Run mode changed; explicit migration required');
  demand(state.workflowProfile === (config.workflowProfile ?? 'generic'), 'Run workflow profile changed');
  return state;
}

export function publicRun(state) {
  return { runId: state.runId, bug: state.bug, subject: state.bug, mode: state.mode, owner: state.owner,
    status: state.status, nextStage: state.nextStage, revision: state.revision,
    scenarioHash: state.scenarioHash, evaluator: state.evaluator, head: state.head,
    pending: state.pending && { requestId: state.pending.requestId, stage: state.pending.stage,
      state: state.pending.state, startedAt: state.pending.startedAt },
    updatedAt: state.updatedAt, outcome: state.outcome,
    receipts: state.receipts.map(r => ({ stage: r.stage, requestId: r.requestId, sha256: r.sha256 })) };
}

export async function createRun(config, bug) {
  demand(typeof bug === 'string' && bug.trim().length > 0 && bug.length <= 2048, 'A non-empty work item reference is required');
  const runId = `run-${randomUUID()}`;
  const directory = pathFor(config, runId);
  await mkdir(directory, { recursive: true });
  const state = { schemaVersion: 1, version: VERSION, runId, bug, owner: config.owner,
    mode: config.mode, workflowProfile: config.workflowProfile ?? 'generic', status: 'ready', nextStage: 'intake', revision: 0,
    scenarioHash: null, evaluator: null, head: null, receipts: [], pending: null,
    outcome: null, updatedAt: new Date().toISOString() };
  await atomicJson(join(directory, 'run.json'), state);
  return publicRun(state);
}

export async function callProvider(config, providerName, request) {
  const provider = config.providers[providerName];
  demand(provider, `Provider ${providerName} is not configured; no live operation performed`);
  demand(await fileHash(provider.executable) === provider.executableSha256, 'Provider executable hash changed');
  return new Promise((resolveResult, reject) => {
    const child = spawn(provider.executable, provider.args, {
      shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']
    });
    let stdout = '', stderrBytes = 0, settled = false;
    const end = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error); else resolveResult(value);
    };
    // RPC timeout is an UNKNOWN execution result. Never kill shared resources or
    // replay a request; detach the observer and reconcile the same request ID.
    const timer = setTimeout(() => {
      child.stdin.destroy(); child.stdout.destroy(); child.stderr.destroy(); child.unref();
      end(new Error('Provider timeout: execution result unknown; reconcile the same request ID'));
    }, provider.timeoutSeconds * 1000);
    child.on('error', error => end(error));
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      if (Buffer.byteLength(stdout) > 1024 * 1024) {
        child.stdout.destroy(); child.stderr.destroy(); child.unref();
        end(new Error('Provider response too large; preserve pending request and reconcile'));
      }
    });
    child.stderr.on('data', chunk => { stderrBytes += chunk.length; });
    child.stdin.on('error', error => end(error));
    child.on('close', code => {
      if (settled) return;
      if (code !== 0) return end(new Error(`Provider ${providerName} exited ${code}; stderrBytes=${stderrBytes}; request remains pending`));
      try {
        const response = JSON.parse(stdout);
        demand(response.schemaVersion === 1 && response.requestId === request.requestId &&
          response.runId === request.run.runId && response.owner === request.run.owner,
        'Provider response identity mismatch');
        end(null, response);
      } catch (error) { end(error); }
    });
    child.stdin.end(JSON.stringify(request) + '\n');
  });
}

function allow(plugin, stage) {
  demand(plugins[plugin]?.stages.includes(stage), `Plugin ${plugin} cannot execute ${stage}`);
}

export function validateReceipt(state, receipt) {
  const stage = workflow.stages.find(row => row.id === receipt.stage);
  demand(stage && state.pending && receipt.stage === state.pending.stage, 'Receipt stage does not match pending operation');
  demand(receipt.requestId === state.pending.requestId && receipt.runId === state.runId &&
    receipt.owner === state.owner, 'Receipt identity mismatch');
  demand(Array.isArray(receipt.artifacts) && receipt.artifacts.length > 0, 'Durable evidence artifacts required');
  demand(receipt.outcome === 'pass' || receipt.outcome === 'changes-requested' || workflow.terminalOutcomes.includes(receipt.outcome),
    'Unsupported receipt outcome');
  if (receipt.outcome !== 'pass') {
    if (receipt.outcome === 'changes-requested') demand(['review', 'validate'].includes(stage.id),
      'Only validation/review may reopen the fix loop');
    demand(receipt.outcome !== 'completed' && typeof receipt.reason === 'string' && receipt.reason.length > 0,
      'Non-pass requires a precise non-completed outcome and reason');
    return;
  }
  for (const gate of stage.gates) demand(receipt.gates?.[gate] === true, `Missing gate: ${gate}`);
  validateProfileReceipt(state.workflowProfile, receipt);
  if (stage.id === 'intake') demand(shaPattern.test(receipt.scenarioHash ?? ''), 'Intake must seal canonical scenario');
  if (['before', 'source', 'after', 'validate', 'review', 'publish'].includes(stage.id)) {
    demand(receipt.scenarioHash === state.scenarioHash, 'Canonical scenario changed');
  }
  if (stage.id === 'before') demand(typeof receipt.evaluator === 'string' && idPattern.test(receipt.evaluator),
    'BEFORE requires evaluator affinity');
  if (['source', 'after'].includes(stage.id)) {
    demand(receipt.evaluator === state.evaluator, 'Evaluator affinity changed');
  }
  if (stage.id === 'source') {
    demand(commitPattern.test(receipt.head ?? ''), 'Exact source HEAD required');
    demand(receipt.prCreated === false, 'Source phase must explicitly prove no premature PR');
  }
  if (['after', 'validate', 'review', 'publish'].includes(stage.id)) demand(receipt.head === state.head, 'HEAD mismatch');
  if (stage.id === 'after') {
    const before = state.receipts.find(r => r.stage === 'before');
    demand(receipt.beforeReceiptSha256 === before?.sha256, 'AFTER must bind accepted BEFORE receipt');
  }
  if (stage.id === 'publish') {
    demand(receipt.pr?.isDraft === true && typeof receipt.pr?.url === 'string' &&
      /^https:\/\//.test(receipt.pr.url), 'Actual Draft PR identity required');
  }
}

async function verifyArtifacts(config, runId, receipt) {
  const base = pathFor(config, runId);
  return verifyArtifactFiles(base, receipt);
}
export async function verifyArtifactFiles(base, receipt) {
  for (const artifact of receipt.artifacts) {
    demand(typeof artifact.path === 'string' && !isAbsolute(artifact.path) && shaPattern.test(artifact.sha256 ?? ''),
      'Artifact must be a run-relative path and SHA-256');
    const target = resolve(base, artifact.path);
    const rel = relative(base, target);
    demand(rel && rel !== '..' && !rel.startsWith('..' + sep) && !isAbsolute(rel), 'Artifact escapes run directory');
    const { realpath } = await import('node:fs/promises');
    const realBase = await realpath(base), realTarget = await realpath(target);
    const realRel = relative(realBase, realTarget);
    demand(realRel && realRel !== '..' && !realRel.startsWith('..' + sep) && !isAbsolute(realRel),
      'Artifact symlink escapes run directory');
    demand((await stat(target)).isFile() && await fileHash(target) === artifact.sha256, 'Artifact missing or hash mismatch');
  }
}

async function commitResponse(config, dir, state, response) {
  if (response.state === 'pending') {
    demand(typeof response.resumeCondition === 'string' && response.resumeCondition &&
      typeof response.progressPath === 'string' && response.progressPath &&
      typeof response.completionCallback === 'string' && response.completionCallback,
    'Pending provider must supply progress, resume condition and completion callback');
    state.pending.state = 'awaiting-provider';
    state.pending.resumeCondition = response.resumeCondition;
    state.pending.progressPath = response.progressPath;
    state.pending.completionCallback = response.completionCallback;
    state.updatedAt = new Date().toISOString();
    await atomicJson(join(dir, 'run.json'), state);
    return publicRun(state);
  }
  demand(response.state === 'finished' && response.receipt, 'Provider response must be pending or finished');
  const receipt = response.receipt;
  validateReceipt(state, receipt);
  if (receipt.stage === 'before' && receipt.outcome === 'pass') {
    demand(config.devboxes.includes(receipt.evaluator), 'BEFORE evaluator is not in configured pool');
  }
  await verifyArtifacts(config, state.runId, receipt);
  const data = JSON.stringify(receipt);
  const filename = `${state.receipts.length}-${receipt.stage}-${receipt.requestId}.json`;
  await mkdir(join(dir, 'receipts'), { recursive: true });
  const path = join(dir, 'receipts', filename);
  try {
    const file = await open(path, 'wx');
    try { await file.writeFile(data); await file.sync(); } finally { await file.close(); }
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    demand(await fileHash(path) === hash(data), 'Previously written receipt changed');
  }
  state.receipts.push({ stage: receipt.stage, requestId: receipt.requestId,
    path: `receipts/${filename}`, sha256: hash(data) });
  state.pending = null;
  if (receipt.outcome === 'changes-requested') {
    state.nextStage = 'source';
    state.status = 'ready';
    state.invalidatedAfterRevision = state.revision;
  } else if (receipt.outcome !== 'pass') {
    state.outcome = receipt.outcome;
    state.status = receipt.stage === 'cleanup' ? 'cleanup-blocked' : 'needs-cleanup';
    state.nextStage = 'cleanup';
  } else if (receipt.stage === 'cleanup') {
    state.status = 'terminal';
    state.outcome ??= 'completed';
    state.nextStage = null;
  } else {
    if (receipt.stage === 'intake') state.scenarioHash = receipt.scenarioHash;
    if (receipt.stage === 'before') state.evaluator = receipt.evaluator;
    if (receipt.stage === 'source') state.head = receipt.head;
    state.nextStage = workflow.stages[workflow.stages.findIndex(s => s.id === receipt.stage) + 1].id;
    state.status = 'ready';
  }
  state.revision++;
  state.updatedAt = new Date().toISOString();
  await atomicJson(join(dir, 'run.json'), state);
  return publicRun(state);
}

export async function executeStage(config, plugin, runId, stage, input = {}) {
  allow(plugin, stage);
  return exclusive(config, runId, async dir => {
    const state = await loadRun(config, runId);
    demand(!state.pending, 'An operation is pending; reconcile it instead of resubmitting');
    demand(state.status !== 'terminal' && state.nextStage === stage, 'Phase ordering gate rejected');
    const provider = providerFor(config, stage);
    demand(config.providers[provider], `Missing ${provider} provider; stage not started`);
    state.pending = { requestId: randomUUID(), stage, provider,
      providerBinding: hash(JSON.stringify(config.providers[provider])),
      state: 'submitted-unknown', startedAt: new Date().toISOString() };
    state.updatedAt = state.pending.startedAt;
    await atomicJson(join(dir, 'run.json'), state);
    const request = { schemaVersion: 1, version: VERSION, operation: 'execute',
      requestId: state.pending.requestId, stage, run: publicRun(state),
      stateDirectory: dir, input };
    const response = await invokeCapability(config, stage, request, callProvider);
    return commitResponse(config, dir, state, response);
  });
}

export async function reconcile(config, plugin, runId) {
  return exclusive(config, runId, async dir => {
    const state = await loadRun(config, runId);
    demand(state.pending, 'No pending operation');
    demand(plugin === 'agent-operations' || plugin === 'a11y-workflow' ||
      plugins[plugin]?.stages.includes(state.pending.stage), 'Plugin cannot reconcile this operation');
    demand(config.providers[state.pending.provider] &&
      providerFor(config, state.pending.stage) === state.pending.provider &&
      hash(JSON.stringify(config.providers[state.pending.provider])) === state.pending.providerBinding,
    'Pending workflow provider changed; do not replay with a different executor');
    const response = await invokeCapability(config, state.pending.stage, {
      schemaVersion: 1, version: VERSION, operation: 'reconcile',
      requestId: state.pending.requestId, stage: state.pending.stage,
      run: publicRun(state), stateDirectory: dir, input: {}
    }, callProvider);
    return commitResponse(config, dir, state, response);
  });
}

export async function abandonRun(config, runId, reason) {
  demand(typeof reason === 'string' && reason.trim(), 'Abandonment requires a reason');
  return exclusive(config, runId, async dir => {
    const state = await loadRun(config, runId);
    demand(!state.pending && state.status !== 'terminal', 'Reconcile pending work before abandonment');
    state.outcome = 'abandoned';
    state.abandonReason = reason;
    state.status = 'needs-cleanup';
    state.nextStage = 'cleanup';
    state.revision++;
    state.updatedAt = new Date().toISOString();
    await atomicJson(join(dir, 'run.json'), state);
    return publicRun(state);
  });
}

export async function resourceStatus(config) {
  const result = await callProvider(config, 'resources', {
    schemaVersion: 1, version: VERSION, operation: 'status', requestId: randomUUID(),
    run: { runId: 'resource-status', owner: config.owner }, devboxes: config.devboxes, input: {}
  });
  demand(result.state === 'finished' && Array.isArray(result.resources), 'Invalid public resource status');
  return { resources: result.resources.map(r => ({
    id: r.id, kind: r.kind, owner: r.owner, health: r.health, phase: r.phase
  })) };
}

export function assessProgress(state, now = Date.now()) {
  const age = now - Date.parse(state.updatedAt);
  demand(Number.isFinite(age) && age >= 0, 'Invalid run clock');
  return { runId: state.runId, status: state.status, nextStage: state.nextStage,
    pendingRequestId: state.pending?.requestId ?? null,
    action: state.status === 'terminal' ? 'none' : state.pending
      ? (age >= 30 * 60_000 ? 'reconcile-original-request' : 'await-original-callback')
      : 'continue-next-permitted-stage',
    idleMilliseconds: age, executionRecovered: false };
}
