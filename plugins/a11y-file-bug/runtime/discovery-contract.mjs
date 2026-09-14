import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { canonical } from './canonical.mjs';

export const discoveryHash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
export const conclusive = new Set(['finding', 'observed-no-issue']);
export const observationStatuses = new Set([...conclusive, 'blocked', 'not-run', 'inconclusive']);
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/;
const sha = /^[a-f0-9]{64}$/;
export function requireDiscovery(condition, message) {
  if (!condition) throw new Error(message);
}
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function text(value, label, maximum = 4096) {
  requireDiscovery(typeof value === 'string' && value.trim() && value.length <= maximum, `Invalid ${label}`);
}
function fields(value, required, optional = [], label = 'discovery record') {
  requireDiscovery(object(value), `${label} must be an object`);
  requireDiscovery(required.every(key => Object.hasOwn(value, key)), `Missing ${label} field`);
  requireDiscovery(Object.keys(value).every(key => [...required, ...optional].includes(key)), `Unknown ${label} field`);
}
function strings(value, label, allowEmpty = false, maximum = 100) {
  requireDiscovery(Array.isArray(value) && value.length <= maximum && (allowEmpty || value.length > 0), `Invalid ${label}`);
  value.forEach(item => text(item, label));
}
export function validateDiscoveryRows(rows, maximum = 200) {
  requireDiscovery(Array.isArray(rows) && rows.length > 0 && rows.length <= maximum, 'Coverage row budget exceeded or empty');
  const ids = new Set();
  for (const row of rows) {
    fields(row, ['id', 'journey', 'state', 'dimension', 'track', 'capability', 'preconditions',
      'actions', 'expected', 'reset'], ['dependsOn', 'parameters', 'coverage']);
    requireDiscovery(typeof row.id === 'string' && idPattern.test(row.id) && !ids.has(row.id), 'Invalid or duplicate coverage row ID');
    ids.add(row.id);
    for (const field of ['journey', 'state', 'dimension', 'expected', 'reset']) text(row[field], field);
    strings(row.preconditions, 'preconditions'); strings(row.actions, 'actions');
    requireDiscovery(['page', 'source', 'at'].includes(row.track), 'Unsupported discovery track');
    requireDiscovery(row.capability === (row.track === 'page' ? 'browser' : row.track === 'source' ? 'source-review' : row.capability) &&
      (row.track !== 'at' || ['nvda', 'narrator', 'voice-access'].includes(row.capability)), 'Track/capability mismatch');
    if (row.parameters !== undefined) requireDiscovery(object(row.parameters) &&
      JSON.stringify(row.parameters).length <= 16384, 'Invalid bounded provider parameters');
    if (row.coverage !== undefined) {
      fields(row.coverage, ['targetId', 'category', 'step', 'procedureHash']);
      text(row.coverage.targetId, 'coverage target');
      text(row.coverage.category, 'coverage category');
      requireDiscovery(Number.isInteger(row.coverage.step) && row.coverage.step > 0 &&
        sha.test(row.coverage.procedureHash), 'Invalid category step/version');
    }
    if (row.dependsOn !== undefined) {
      strings(row.dependsOn, 'row dependencies', true);
      requireDiscovery(new Set(row.dependsOn).size === row.dependsOn.length, 'Duplicate row dependency');
    }
  }
  const done = new Set(), visiting = new Set(), byId = new Map(rows.map(row => [row.id, row]));
  function visit(id) {
    requireDiscovery(byId.has(id), 'Missing row dependency');
    requireDiscovery(!visiting.has(id), 'Cyclic row dependencies');
    if (done.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id).dependsOn ?? []) visit(dependency);
    visiting.delete(id); done.add(id);
  }
  rows.forEach(row => visit(row.id));
}
export function validateDiscoveryPlan(plan) {
  fields(plan, ['schemaVersion', 'taskId', 'feature', 'mode', 'authorizationReference', 'profile',
    'target', 'evaluator', 'sourceRoots', 'sourceRevision', 'budgetSeconds', 'maxRows', 'rows'], ['inventory', 'filingRequested']);
  requireDiscovery(plan.filingRequested === undefined || typeof plan.filingRequested === 'boolean', 'filingRequested must be boolean');
  requireDiscovery(plan.schemaVersion === 1 && /^[a-z][a-z0-9-]{2,47}$/.test(plan.taskId ?? ''), 'Invalid discovery task identity/schema');
  for (const field of ['feature', 'authorizationReference', 'profile']) text(plan[field], field);
  requireDiscovery(['both', 'page-only', 'source-only', 'plan-only'].includes(plan.mode), 'Invalid discovery mode');
  for (const field of ['target', 'evaluator']) if (plan[field] !== null) text(plan[field], field);
  strings(plan.sourceRoots, 'source roots', true);
  requireDiscovery(plan.sourceRoots.every(isAbsolute), 'Source roots must be absolute authorized paths');
  requireDiscovery(plan.sourceRevision === null || /^[a-f0-9]{40}$/.test(plan.sourceRevision), 'Invalid declared source revision');
  requireDiscovery(Number.isInteger(plan.budgetSeconds) && plan.budgetSeconds >= 1 && plan.budgetSeconds <= 14400,
    'Discovery budget must be 1-14400 seconds');
  requireDiscovery(Number.isInteger(plan.maxRows) && plan.maxRows >= 1 && plan.maxRows <= 5000, 'Invalid row limit');
  validateDiscoveryRows(plan.rows, plan.maxRows);
  for (const row of plan.rows) {
    requireDiscovery(plan.mode !== 'source-only' || row.track === 'source', 'Source-only cannot schedule page/AT work');
    requireDiscovery(plan.mode !== 'page-only' || row.track !== 'source', 'Page-only cannot schedule source work');
  }
  requireDiscovery(Buffer.byteLength(JSON.stringify(plan)) <= 16 * 1024 * 1024, 'Discovery plan is too large');
  return plan;
}
export function validateDiscoveryInput(action, input) {
  if (action === 'discovery-observe') {
    fields(input, ['schemaVersion', 'taskId', 'planHash', 'profile', 'authorizationReference',
      'target', 'deadlineAt', 'rows'], ['previousOperationIds']);
    requireDiscovery(input.schemaVersion === 1 && /^[a-z][a-z0-9-]{2,47}$/.test(input.taskId ?? '') &&
      sha.test(input.planHash ?? ''), 'Invalid discovery request binding');
    for (const field of ['profile', 'authorizationReference', 'target']) text(input[field], field);
    requireDiscovery(typeof input.deadlineAt === 'string' && Number.isFinite(Date.parse(input.deadlineAt)) &&
      new Date(input.deadlineAt).toISOString() === input.deadlineAt, 'Invalid discovery deadline');
    validateDiscoveryRows(input.rows);
    if (input.previousOperationIds !== undefined) {
      strings(input.previousOperationIds, 'previous operation IDs', true, 5000);
      requireDiscovery(input.previousOperationIds.every(id => /^bb-[a-f0-9]{48}$/.test(id)), 'Invalid previous operation identity');
    }
    requireDiscovery(input.rows.every(row => row.track !== 'source'), 'Capture cannot execute a source review');
  } else {
    fields(input, ['taskId', 'operationIds', 'reason'], action === 'discovery-deliver' ? ['report'] : []);
    requireDiscovery(/^[a-z][a-z0-9-]{2,47}$/.test(input.taskId ?? ''), 'Invalid discovery lifecycle task');
    strings(input.operationIds, 'owned operation IDs', true, 5000); text(input.reason, 'lifecycle reason');
    requireDiscovery(input.operationIds.every(id => /^bb-[a-f0-9]{48}$/.test(id)), 'Invalid discovery operation identity');
    if (action === 'discovery-deliver') {
      fields(input.report, ['path', 'sha256']);
      requireDiscovery(isAbsolute(input.report.path) && sha.test(input.report.sha256 ?? ''), 'Invalid delivered report binding');
    }
  }
}
export function validateDiscoveryReceipt(action, receipt, input) {
  validateDiscoveryInput(action, input);
  requireDiscovery(receipt.taskId === input.taskId && receipt.subject === `task:${input.taskId}`, 'Discovery receipt task mismatch');
  if (action !== 'discovery-observe') {
    requireDiscovery(JSON.stringify(receipt.operationIds) === JSON.stringify(input.operationIds), 'Lifecycle operation scope mismatch');
    if (receipt.outcome !== 'pass') return;
    if (action === 'discovery-deliver') {
      requireDiscovery(receipt.reportSha256 === input.report.sha256, 'Delivered report hash mismatch');
      text(receipt.deliveryReference, 'verified delivery reference');
    }
    return;
  }
  requireDiscovery(receipt.planHash === input.planHash && Array.isArray(receipt.observations) &&
    receipt.observations.length === input.rows.length, 'Discovery result must account for every submitted row');
  const expected = new Map(input.rows.map(row => [row.id, row]));
  const artifactPaths = new Set(receipt.artifacts.map(artifact => artifact.path));
  if (receipt.outcome === 'pass') {
    for (const field of ['capturePreflightArtifacts', 'capturePostcheckArtifacts']) {
      strings(receipt[field], field);
      requireDiscovery(receipt[field].every(path => artifactPaths.has(path)),
        'Capture health must reference declared hash-bound diagnostic artifacts');
    }
  }
  for (const observation of receipt.observations) {
    fields(observation, ['rowId', 'status', 'actual', 'evidence', 'tool'], ['reason', 'issue', 'attempted']);
    const row = expected.get(observation.rowId);
    requireDiscovery(row, 'Duplicate or substituted observation row'); expected.delete(observation.rowId);
    requireDiscovery(observationStatuses.has(observation.status), 'Unsupported observation outcome');
    if (observation.attempted !== undefined) requireDiscovery(typeof observation.attempted === 'boolean' &&
      (!conclusive.has(observation.status) || observation.attempted) &&
      (observation.status !== 'not-run' || !observation.attempted), 'Invalid attempted-coverage declaration');
    text(observation.actual, 'actual observation');
    strings(observation.evidence, 'observation evidence', !conclusive.has(observation.status));
    requireDiscovery(observation.evidence.every(path => artifactPaths.has(path)), 'Observation cites an undeclared artifact');
    if (!conclusive.has(observation.status)) text(observation.reason, 'coverage gap reason');
    if (conclusive.has(observation.status)) {
      fields(observation.tool, ['name', 'version', 'kind']);
      text(observation.tool.name, 'observed tool'); text(observation.tool.version, 'observed tool version');
      requireDiscovery(observation.tool.kind === (row.track === 'at' ? 'at' : 'browser'), 'Browser evidence is not real AT');
      if (row.track === 'at') requireDiscovery(observation.tool.name === row.capability, 'Named AT capability mismatch');
      requireDiscovery(receipt.outcome === 'pass', 'Nonpass provider cannot supply conclusive observations');
    }
    if (observation.status === 'finding') {
      fields(observation.issue, ['title', 'impact', 'repeatability'], ['identity']);
      Object.entries(observation.issue).forEach(([key, value]) => text(value, key));
    } else requireDiscovery(observation.issue === undefined, 'Only findings may carry an issue');
  }
}
