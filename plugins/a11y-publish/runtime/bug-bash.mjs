import { mkdir, readFile, readdir, open, realpath, stat, access } from 'node:fs/promises';
import { dirname, join, resolve, relative, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION, atomicJson, withDirectoryLock, verifyArtifactFiles, hash } from './core.mjs';
import { executeOperation, reconcileOperation, operationStatus } from './operations.mjs';
import { validateDiscoveryPlan, discoveryHash, conclusive, requireDiscovery as demand } from './discovery-contract.mjs';
import { validateBrowserParameters } from './browser-contract.mjs';

const taskPattern = /^[a-z][a-z0-9-]{2,47}$/;
const implementationHash = discoveryHash(await Promise.all([
  'bug-bash.mjs', 'discovery-contract.mjs', 'browser-contract.mjs', 'operations.mjs',
  'capability.mjs', 'canonical.mjs', 'core.mjs', 'waiting.mjs', '../contracts/capabilities.json'
].map(async file => ({ file, sha256: hash(await readFile(new URL(file, import.meta.url))) }))));
const within = (root, path) => {
  const value = relative(root, path);
  return value !== '..' && !value.startsWith('..' + sep) && !isAbsolute(value);
};
function taskDirectory(config, taskId) {
  demand(taskPattern.test(taskId ?? '') && typeof config.owner === 'string' && config.owner &&
    typeof config.stateRoot === 'string' && isAbsolute(config.stateRoot), 'Invalid task owner/storage/identity');
  return join(config.stateRoot, 'bug-bash', taskId);
}
async function privateStorage(config) {
  let directory = dirname(fileURLToPath(import.meta.url));
  while (dirname(directory) !== directory) {
    let packageFound = false;
    for (const file of ['plugin.json', 'package.json']) {
      try { await access(join(directory, file)); packageFound = true; }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    if (packageFound) {
      demand(!within(directory, resolve(config.stateRoot)) &&
        !within(await realpath(directory), await realpath(config.stateRoot)),
      'Discovery state/evidence must be outside the plugin or repository');
      return;
    }
    directory = dirname(directory);
  }
}
function binding(config, plan) {
  return discoveryHash({ capture: config.providers?.capture ?? null, operations: config.providers?.operations ?? null,
    profile: config.discoveryProfiles?.[plan.profile] ?? null, sourceRoots: config.discoverySourceRoots ?? [] });
}
async function load(config, taskId) {
  const dir = taskDirectory(config, taskId);
  const files = (await readdir(join(dir, 'events'))).filter(name => /^\d{6}\.json$/.test(name)).sort();
  demand(files.length > 0, 'No accepted discovery plan');
  let previous = null, state;
  for (let index = 0; index < files.length; index++) {
    demand(files[index] === `${String(index + 1).padStart(6, '0')}.json`, 'Discovery history has a missing revision');
    const event = JSON.parse(await readFile(join(dir, 'events', files[index]), 'utf8'));
    demand(event.revision === index + 1 && event.previousHash === previous &&
      event.stateHash === discoveryHash(event.state), 'Discovery history integrity mismatch');
    demand(event.state.owner === config.owner && event.state.plan.taskId === taskId &&
      event.state.schemaVersion === 1 && event.state.version === VERSION &&
      event.state.implementationHash === implementationHash, 'Foreign owner or incompatible discovery runtime; retain the original installed version');
    previous = discoveryHash(event); state = event.state;
  }
  return { dir, state, revision: files.length, previous };
}
async function commit(current, state, event) {
  const revision = current.revision + 1;
  state.updatedAt = new Date().toISOString();
  const record = { revision, event, previousHash: current.previous, stateHash: discoveryHash(state), state };
  const path = join(current.dir, 'events', `${String(revision).padStart(6, '0')}.json`);
  let absent = false;
  try { await access(path); } catch (error) { if (error.code !== 'ENOENT') throw error; absent = true; }
  demand(absent, 'Discovery event already exists; do not replace history');
  await atomicJson(path, record);
  await atomicJson(join(current.dir, 'state.json'), state);
  return { ...current, state, revision, previous: discoveryHash(record) };
}
async function mutate(config, taskId, action) {
  const dir = taskDirectory(config, taskId);
  return withDirectoryLock(dir, async () => action(await load(config, taskId)));
}
function summary(current) {
  const { state } = current;
  const rows = state.plan.rows.map(row => ({ ...row, ...state.rows[row.id] }));
  const attempted = rows.filter(row => row.sourceReview ||
    row.attempts.some(attempt => attempt.observation.attempted ?? conclusive.has(attempt.observation.status)));
  const concluded = rows.filter(row => conclusive.has(row.status));
  const coverageOutcome = state.plan.mode === 'plan-only' ? 'plan-only' : concluded.length === rows.length
    ? 'complete' : attempted.length ? 'partial' : 'blocked';
  return { taskId: state.plan.taskId, feature: state.plan.feature, mode: state.plan.mode,
    revision: current.revision, profile: state.plan.profile, planHash: discoveryHash(state.plan), deadlineAt: state.deadlineAt,
    rows, coverage: { total: rows.length, attempted: attempted.length, conclusive: concluded.length },
    coverageOutcome, outcome: state.delivered && state.cleaned && !state.pending && !state.cancelRequested
      ? coverageOutcome : state.plan.mode === 'plan-only' ? 'plan-only' : coverageOutcome === 'complete' ? 'partial' : coverageOutcome,
    lifecycle: state.delivered && state.cleaned && !state.pending ? (state.cancelRequested ? 'cancelled' : 'closed')
      : state.pending ? 'pending' : state.cancelRequested ? 'cancel-requested' : 'active',
    pending: state.pending, cleaned: state.cleaned, delivered: state.delivered, report: state.report,
    cancelReason: state.cancelReason ?? null,
    cancelOperationIssued: state.operations.some(operation => operation.kind === 'cancel'),
    lastOperationFailure: state.operations.length && state.operations.at(-1).outcome !== 'pass'
      ? state.operations.at(-1) : null,
    updatedAt: state.updatedAt, nextAction: state.pending ? 'reconcile the original child operation'
      : state.cancelRequested ? 'reconcile cancellation, clean owned effects and deliver the partial report'
      : 'review remaining source rows or execute supported page rows; then clean, report and deliver' };
}
export async function createDiscovery(config, plan) {
  validateDiscoveryPlan(plan);
  const profile = config.discoveryProfiles?.[plan.profile];
  if (profile?.maxBatchRows !== undefined) demand(Number.isInteger(profile.maxBatchRows) &&
    profile.maxBatchRows > 0 && profile.maxBatchRows <= 200, 'Invalid configured batch limit');
  if (config.discoveryProfiles?.[plan.profile]?.kind === 'browser-scenarios') {
    plan.rows.filter(row => row.track === 'page').forEach(row => validateBrowserParameters(row.parameters));
  }
  await privateStorage(config);
  for (const sourceRoot of plan.sourceRoots) {
    const requested = await realpath(sourceRoot);
    let authorized = false;
    for (const root of config.discoverySourceRoots ?? []) {
      if (within(await realpath(root), requested)) { authorized = true; break; }
    }
    demand(authorized, 'Requested source scope is not in the operator-configured roots');
  }
  const dir = taskDirectory(config, plan.taskId);
  await mkdir(join(config.stateRoot, 'bug-bash'), { recursive: true });
  await mkdir(dir);
  await mkdir(join(dir, 'events'));
  const state = {
    schemaVersion: 1, version: VERSION, implementationHash, owner: config.owner, plan: structuredClone(plan), binding: binding(config, plan),
    createdAt: new Date().toISOString(), deadlineAt: new Date(Date.now() + plan.budgetSeconds * 1000).toISOString(),
    rows: Object.fromEntries(plan.rows.map(row => [row.id, { status: 'planned', attempts: [] }])),
    operations: [], pending: null, cancelRequested: false, cleaned: true, delivered: false, report: null
  };
  return summary(await commit({ dir, revision: 0, previous: null }, state, 'plan-accepted'));
}
export async function discoveryStatus(config, taskId) {
  const current = await load(config, taskId);
  for (const operation of current.state.operations.filter(operation => operation.status === 'finished')) {
    await operationStatus(config, operation.plugin, operation.id);
  }
  if (current.state.report) await verifyArtifactFiles(current.dir, { artifacts: [{
    path: current.state.report.relativePath, sha256: current.state.report.sha256
  }] });
  return summary(current);
}
export async function appendDiscoveryRows(config, taskId, rows, reason) {
  demand(typeof reason === 'string' && reason.trim(), 'Plan revision needs a reason');
  return mutate(config, taskId, async current => {
    const state = current.state;
    demand(!state.cancelRequested && !state.delivered && !state.pending, 'Cannot revise a cancelled, delivered or in-flight plan');
    const next = { ...state.plan, rows: [...state.plan.rows, ...rows] };
    validateDiscoveryPlan(next);
    if (config.discoveryProfiles?.[next.profile]?.kind === 'browser-scenarios') {
      rows.filter(row => row.track === 'page').forEach(row => validateBrowserParameters(row.parameters));
    }
    state.plan = next;
    rows.forEach(row => { state.rows[row.id] = { status: 'planned', attempts: [] }; });
    state.report = null;
    return summary(await commit(current, state, `plan-appended: ${reason}`));
  });
}
function operationId(taskId, kind, revision) {
  return `bb-${discoveryHash({ taskId, kind, revision }).slice(0, 48)}`;
}
async function begin(config, taskId, kind, rowIds = []) {
  return mutate(config, taskId, async current => {
    const state = current.state, plan = state.plan;
    demand(!state.pending && !state.delivered, 'Reconcile the pending child; do not execute another operation');
    demand(state.binding === binding(config, plan), 'Selected provider/profile changed; keep original execution bindings');
    let input, plugin, action, context = { subject: `task:${taskId}` };
    if (kind === 'observe') {
      demand(!state.cancelRequested && plan.mode !== 'plan-only', 'Cancelled or plan-only discovery cannot execute');
      demand(Array.isArray(rowIds) && rowIds.length > 0 && new Set(rowIds).size === rowIds.length, 'Choose unique coverage rows');
      let selected = rowIds.map(id => plan.rows.find(row => row.id === id));
      demand(selected.every(Boolean), 'Unknown requested coverage row');
      demand(selected.every(row => row.track !== 'source' && state.rows[row.id].status === 'planned'), 'Rows are not unexecuted page/AT work');
      demand(selected.every(row => (row.dependsOn ?? []).every(id => conclusive.has(state.rows[id].status))), 'Coverage prerequisites are not concluded');
      const profile = config.discoveryProfiles?.[plan.profile];
      const available = profile?.capabilities ?? [];
      const gap = !plan.target || !plan.evaluator ? 'Authorized target/evaluator is missing'
        : !profile?.targets?.includes(plan.target) ? 'Target is not in the operator-configured profile'
        : !config.providers?.capture || !config.providers?.operations ? 'Capture and cleanup/delivery providers must both be configured'
          : Date.now() >= Date.parse(state.deadlineAt) ? 'Original discovery budget exhausted' : null;
      const missing = selected.filter(row => gap || !available.includes(row.capability));
      if (missing.length) {
        for (const row of missing) Object.assign(state.rows[row.id], {
          status: 'blocked', reason: gap ?? `Selected profile does not support ${row.capability}`
        });
        current = await commit(current, state, 'coverage-gap');
        selected = selected.filter(row => !missing.includes(row));
        if (!selected.length) return null;
      }
      rowIds = selected.map(row => row.id);
      // Dependencies are enforced by the parent; the native request contains only the ready work.
      const rows = selected.map(({ dependsOn, ...row }) => row);
      input = { schemaVersion: 1, taskId, planHash: discoveryHash(plan), profile: plan.profile,
        authorizationReference: plan.authorizationReference, target: plan.target, deadlineAt: state.deadlineAt, rows,
        previousOperationIds: state.cleaned ? [] : state.operations.filter(operation => operation.kind === 'observe').map(operation => operation.id) };
      context = { ...context, scenarioHash: discoveryHash(input), evaluator: plan.evaluator };
      plugin = 'a11y-capture'; action = 'discovery-observe'; state.cleaned = false;
    } else {
      demand(['cancel', 'cleanup', 'deliver'].includes(kind), 'Unsupported discovery lifecycle action');
      if (kind === 'cancel') demand(state.cancelRequested, 'Task cancellation must be recorded first');
      if (kind === 'cleanup') demand(!state.cleaned, 'No outstanding owned cleanup');
      if (kind === 'deliver') demand(state.cleaned && state.report, 'Cleanup and a saved report are required before delivery');
      input = { taskId, operationIds: state.operations.filter(operation => operation.kind === 'observe').map(operation => operation.id),
        reason: kind === 'cancel' ? state.cancelReason : `Discovery ${kind} for the exact original task` };
      if (kind === 'deliver') input.report = { path: join(current.dir, state.report.relativePath), sha256: state.report.sha256 };
      plugin = 'agent-operations'; action = `discovery-${kind}`;
    }
    const pending = { id: operationId(taskId, kind, current.revision), kind, plugin, action, context, input, rowIds };
    state.pending = pending;
    state.report = kind === 'deliver' ? state.report : null;
    await commit(current, state, `${kind}-intent`);
    return pending;
  });
}
async function consume(config, taskId, pending, result) {
  return mutate(config, taskId, async current => {
    const state = current.state;
    demand(state.pending?.id === pending.id, 'Parent child-operation identity changed');
    if (result.status === 'pending') {
      state.pending = { ...pending, progress: result.pending ?? null };
      return summary(await commit(current, state, 'child-pending'));
    }
    const receipt = result.receipt;
    state.operations.push({ id: pending.id, kind: pending.kind, plugin: pending.plugin,
      status: result.status, outcome: receipt.outcome, reason: receipt.reason ?? null, receiptSha256: result.receiptSha256 });
    if (pending.kind === 'observe') {
      for (const observation of receipt.observations) {
        const row = state.rows[observation.rowId];
        row.attempts.push({ operationId: pending.id, receiptSha256: result.receiptSha256, observation });
        Object.assign(row, { status: observation.status, observation });
        if (observation.reason) row.reason = observation.reason;
      }
    } else if (receipt.outcome === 'pass') {
      if (pending.kind === 'cleanup') state.cleaned = true;
      if (pending.kind === 'deliver') state.delivered = { reference: receipt.deliveryReference, reportSha256: receipt.reportSha256 };
      if (pending.kind === 'cancel') state.cancelAcknowledged = true;
    }
    state.pending = null;
    return summary(await commit(current, state, `${pending.kind}-finished`));
  });
}
async function executePending(config, taskId, pending) {
  const result = await executeOperation(config, pending.plugin, pending.id, pending.action, pending.context, pending.input);
  return consume(config, taskId, pending, result);
}
export async function observeDiscovery(config, taskId, rowIds) {
  const pending = await begin(config, taskId, 'observe', rowIds);
  return pending ? executePending(config, taskId, pending) : discoveryStatus(config, taskId);
}
export async function reconcileDiscovery(config, taskId) {
  const current = await load(config, taskId), pending = current.state.pending;
  demand(pending, 'No pending discovery operation');
  let status;
  try { status = await operationStatus(config, pending.plugin, pending.id); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    let directoryAbsent = false;
    try { await access(join(config.stateRoot, 'operations', pending.id)); }
    catch (directoryError) {
      if (directoryError.code !== 'ENOENT') throw directoryError;
      directoryAbsent = true;
    }
    demand(directoryAbsent, 'Child storage exists but is incomplete; reconcile its original effects instead of executing again');
    // No child intent was written: the parent intent is safe to submit exactly once.
    return executePending(config, taskId, pending);
  }
  const result = status.status === 'finished' ? status : await reconcileOperation(config, pending.plugin, pending.id);
  return consume(config, taskId, pending, result);
}
export async function cancelDiscovery(config, taskId, reason) {
  demand(typeof reason === 'string' && reason.trim(), 'Cancellation requires a precise reason');
  const result = await mutate(config, taskId, async current => {
    demand(!current.state.delivered, 'Delivered task is already closed');
    current.state.cancelRequested = true;
    current.state.cancelReason = reason;
    return summary(await commit(current, current.state, 'cancel-requested'));
  });
  // Unknown effects must first be reconciled, never hidden by discarding a pending operation.
  if (result.pending || result.cleaned) return result;
  const pending = await begin(config, taskId, 'cancel');
  return executePending(config, taskId, pending);
}
export async function cleanupDiscovery(config, taskId) {
  const current = await load(config, taskId);
  if (current.state.cleaned) return summary(current);
  const pending = await begin(config, taskId, 'cleanup');
  return executePending(config, taskId, pending);
}
export async function reviewDiscoverySource(config, taskId, review) {
  return mutate(config, taskId, async current => {
    const state = current.state, row = state.plan.rows.find(row => row.id === review.rowId);
    demand(state.plan.mode !== 'plan-only' && !state.cancelRequested && !state.delivered &&
      Date.now() < Date.parse(state.deadlineAt) &&
      row?.track === 'source' && state.rows[row.id].status === 'planned', 'Not an available source-review row');
    demand(conclusive.has(review.status) && typeof review.actual === 'string' && review.actual.trim() &&
      Array.isArray(review.files) && review.files.length > 0 && review.files.length <= 50 &&
      Array.isArray(review.risks) && (review.status === 'finding' ? review.risks.length > 0 : review.risks.length === 0),
    'Source review requires explicit observations, source bindings and risk accounting');
    const fileBindings = [];
    for (const source of review.files) {
      demand(typeof source.path === 'string' && isAbsolute(source.path), 'Source file must be absolute');
      const realSource = await realpath(source.path);
      let root;
      for (const candidate of state.plan.sourceRoots) {
        const realRoot = await realpath(candidate);
        if (within(realRoot, realSource) && realRoot !== realSource) { root = realRoot; break; }
      }
      demand(root && (await stat(realSource)).size <= 2 * 1024 * 1024, 'Source file is outside the authorized bounded scope');
      const bytes = await readFile(realSource);
      demand(hash(bytes) === source.sha256, 'Reviewed source bytes changed');
      const lines = bytes.toString('utf8').split(/\r?\n/);
      demand(Number.isInteger(source.startLine) && Number.isInteger(source.endLine) &&
        source.startLine >= 1 && source.endLine >= source.startLine && source.endLine <= lines.length, 'Invalid reviewed line range');
      fileBindings.push({ path: source.path, sha256: source.sha256, startLine: source.startLine, endLine: source.endLine });
    }
    for (const risk of review.risks) demand(['title', 'impact', 'confirmation'].every(field =>
      typeof risk[field] === 'string' && risk[field].trim()), 'Source risk requires impact and runtime confirmation');
    state.rows[row.id].status = review.status;
    state.rows[row.id].sourceReview = { actual: review.actual, files: fileBindings,
      risks: review.risks.map(({ title, impact, confirmation }) => ({ title, impact, confirmation })),
      origin: 'caller-read-only-analysis', runtimeVerified: false };
    state.report = null;
    return summary(await commit(current, state, 'source-review-recorded'));
  });
}
const md = value => String(value ?? '').replace(/[\\`|<>[\]]/g, char => '\\' + char).replace(/\r?\n/g, ' ');
export async function reportDiscovery(config, taskId) {
  return mutate(config, taskId, async current => {
    const state = current.state, result = summary(current);
    demand(!state.pending && !state.delivered, 'Reconcile pending effects before generating a final report');
    const lines = ['# Feature accessibility bug bash', '', `Feature: ${md(state.plan.feature)}`,
      `Mode: ${state.plan.mode}`, `Coverage outcome: ${result.coverageOutcome}`,
      `Cleanup at report creation: ${state.cleaned ? 'verified/no effects' : 'outstanding'}`,
      'Delivery and final lifecycle status are recorded separately in the task receipt.',
      `Plan SHA-256: ${discoveryHash(state.plan)}`, `Declared source revision: ${state.plan.sourceRevision ?? 'unknown'}`,
      `Target: ${md(state.plan.target ?? 'not supplied')}`, `Budget: ${state.plan.budgetSeconds} seconds`,
      '', '## Coverage matrix', '',
      '| Row | Journey / state | Track | Expected | Status | Observation / gap |',
      '|---|---|---|---|---|---|',
      ...result.rows.map(row => `| ${md(row.id)} | ${md(row.journey)} / ${md(row.state)} | ${row.track} | ${md(row.expected)} | ${row.status} | ${md(row.observation?.actual ?? row.sourceReview?.actual ?? row.reason ?? 'Not executed')} |`),
      '', '## Page-reproduced findings', ''];
    for (const row of result.rows.filter(row => row.observation?.status === 'finding')) {
      lines.push(`### ${md(row.id)}: ${md(row.observation.issue.title)}`,
        `Impact: ${md(row.observation.issue.impact)}`, `Preconditions: ${md(row.preconditions.join('; '))}`,
        `Steps: ${md(row.actions.join('; '))}`, `Expected: ${md(row.expected)}`,
        `Observed: ${md(row.observation.actual)}`, `Repeatability: ${md(row.observation.issue.repeatability)}`, '');
    }
    lines.push('## Source-supported risks (runtime not verified)', '');
    for (const row of result.rows.filter(row => row.sourceReview)) {
      for (const risk of row.sourceReview.risks) lines.push(`### ${md(row.id)}: ${md(risk.title)}`,
        `Impact: ${md(risk.impact)}`, `Confirmation needed: ${md(risk.confirmation)}`,
        `Source: ${md(row.sourceReview.files.map(file => `${file.path}:${file.startLine}-${file.endLine} [${file.sha256}]`).join('; '))}`, '');
    }
    lines.push('## Context questions and uncovered checks', '');
    for (const row of result.rows.filter(row => !conclusive.has(row.status))) lines.push(`- ${md(row.id)}: ${md(row.reason ?? 'Not executed; continue within the original scope and budget')}`);
    lines.push('', '## Evidence index', '');
    for (const operation of state.operations.filter(operation => operation.kind === 'observe')) {
      const checked = await operationStatus(config, operation.plugin, operation.id);
      for (const artifact of checked.receipt.artifacts) lines.push(`- ${md(join(config.stateRoot, 'operations', operation.id, artifact.path))} [SHA-256 ${artifact.sha256}]`);
    }
    lines.push('', '## Cleanup and resume', '', `Cleanup: ${state.cleaned ? 'verified or no external effects' : 'outstanding; retain original ownership'}`,
      `Cancellation: ${state.cancelRequested ? md(state.cancelReason) : 'not requested'}`,
      'Delivery: consult the task receipt for the verified destination and this report hash.',
      'No automatic product changes, ticket/PR creation or public upload.',
      'No issue observed means only this inspected scope; this report is not WCAG certification.', '');
    const relativePath = `report-${String(current.revision).padStart(6, '0')}.md`;
    const bytes = Buffer.from(lines.join('\n'));
    try {
      const file = await open(join(current.dir, relativePath), 'wx');
      try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      demand(hash(await readFile(join(current.dir, relativePath))) === hash(bytes), 'Unreconciled report bytes differ; do not overwrite');
    }
    state.report = { relativePath, sha256: hash(bytes), planHash: discoveryHash(state.plan) };
    return summary(await commit(current, state, 'report-saved'));
  });
}
export async function deliverDiscovery(config, taskId) {
  await discoveryStatus(config, taskId);
  const pending = await begin(config, taskId, 'deliver');
  return executePending(config, taskId, pending);
}
export async function recordDiscoveryGap(config, taskId, rowIds, reason) {
  demand(Array.isArray(rowIds) && rowIds.length > 0 && new Set(rowIds).size === rowIds.length &&
    typeof reason === 'string' && reason.trim(), 'Coverage gaps require unique rows and a precise reason');
  return mutate(config, taskId, async current => {
    demand(!current.state.pending && !current.state.delivered, 'Cannot change in-flight or delivered coverage');
    for (const id of rowIds) {
      demand(current.state.rows[id]?.status === 'planned', 'Only unexecuted rows can be marked as gaps');
      Object.assign(current.state.rows[id], { status: 'blocked', reason });
    }
    current.state.report = null;
    return summary(await commit(current, current.state, 'coverage-gap'));
  });
}
export async function advanceDiscovery(config, taskId) {
  const result = await discoveryStatus(config, taskId);
  if (result.lifecycle === 'closed' || result.lifecycle === 'cancelled') return result;
  if (result.pending) return reconcileDiscovery(config, taskId);
  if (result.lastOperationFailure && ['cleanup','deliver','cancel'].includes(result.lastOperationFailure.kind)) {
    return { ...result, nextAction: `Recover ${result.lastOperationFailure.kind} before an explicit retry: ${result.lastOperationFailure.reason}` };
  }
  if (!result.lifecycle.startsWith('cancel') && result.mode !== 'plan-only') {
    const ready = result.rows.filter(row => row.status === 'planned' && row.track !== 'source' &&
      (row.dependsOn ?? []).every(id => conclusive.has(result.rows.find(item => item.id === id).status)));
    if (ready.length) {
      const profile = config.discoveryProfiles?.[result.profile];
      return observeDiscovery(config, taskId, ready.slice(0, profile?.maxBatchRows ?? ready.length).map(row => row.id));
    }
    const source = result.rows.find(row => row.status === 'planned' && row.track === 'source');
    if (source) return { ...result, nextAction: `Use the bundled read-only knowledge review for ${source.id}, then record its source-bound analysis` };
    const blocked = result.rows.filter(row => row.status === 'planned');
    if (blocked.length) return recordDiscoveryGap(config, taskId, blocked.map(row => row.id), 'Required prerequisite rows were not concluded');
  }
  if (result.lifecycle === 'cancel-requested' && !result.cleaned && !result.cancelOperationIssued) {
    return cancelDiscovery(config, taskId, result.cancelReason);
  }
  if (!result.cleaned) return cleanupDiscovery(config, taskId);
  if (!result.report) return reportDiscovery(config, taskId);
  return deliverDiscovery(config, taskId);
}
