import { join } from 'node:path';
import { discoveryStatus, validateDiscovery } from './bug-bash.mjs';
import { executeOperation, operationStatus } from './operations.mjs';
import { discoveryHash, requireDiscovery as demand } from './discovery-contract.mjs';
import { withDirectoryLock } from './core.mjs';
import { bugDescription } from '../native/bug-description.mjs';

export const filingOperationId = (taskId, issueId) =>
  `bug-${discoveryHash({ taskId, issueId }).slice(0, 48)}`;
const text = value => typeof value === 'string' && value.trim().length > 0;

export async function prepareDiscoveryBug(config, taskId, issueId, details) {
  const validation = await validateDiscovery(config, taskId);
  const result = await discoveryStatus(config, taskId);
  demand(result.revision === validation.revision, 'Discovery changed during validation; prepare again');
  const issue = result.issues.find(item => item.id === issueId);
  demand(issue?.scope === 'observed-page', 'Only validated reproduced page findings may be filed; not seeded defects or source risks');
  demand(details && Object.keys(details).every(key => ['environment', 'cause', 'evidence'].includes(key)),
    'Unknown Bug detail field');
  demand(details && ['os', 'browser', 'assistiveTechnology', 'build', 'viewport', 'locale']
    .every(key => text(details.environment?.[key])), 'Bug environment needs OS, browser, AT (or not used), build, viewport and locale');
  demand(text(details.cause?.explanation) && ['unknown', 'hypothesis', 'confirmed'].includes(details.cause.status),
    'State the observed cause or explicitly label an unknown/hypothesized root cause');
  const rows = result.rows.filter(row => issue.rows.includes(row.id));
  if (details.cause.status === 'confirmed') demand(rows.some(row =>
    row.observation.issue.cause?.status === 'confirmed' &&
    row.observation.issue.cause.explanation === details.cause.explanation),
  'A confirmed root cause must come from the validated observation, not caller inference');
  demand(Array.isArray(details.evidence) && details.evidence.length > 0 && details.evidence.length <= 20,
    'Select 1-20 reviewed evidence attachments from the validated observations');
  const attachments = [];
  const names = new Set();
  for (const selected of details.evidence) {
    demand(selected && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(selected.name ?? '') &&
      !names.has(selected.name), 'Evidence filenames must be unique plain names');
    names.add(selected.name);
    const row = rows.find(item => item.attempts.some(attempt =>
      attempt.operationId === selected.operationId && attempt.observation.status === 'finding' &&
      attempt.observation.evidence.includes(selected.path)));
    demand(row, 'Attachment is not bound to this validated finding');
    const operation = await operationStatus(config, 'a11y-capture', selected.operationId);
    const artifact = operation.receipt.artifacts.find(item => item.path === selected.path);
    demand(artifact && selected.reviewed === true && text(selected.description),
      'Evidence needs an original hash-bound artifact and explicit sensitive-content review');
    demand(['image', 'video', 'audio', 'diagnostic'].includes(selected.kind), 'Unsupported evidence kind');
    if ([selected.name, selected.path].some(path => /\.(mp4|webm|mov|mkv|avi)$/i.test(path))) {
      demand(selected.kind === 'video', 'Video must use the video review contract');
    }
    if (selected.kind === 'video' || selected.kind === 'audio') demand(
      selected.playbackReviewed === true && text(selected.transcript) &&
      text(selected.timestamps), 'Media needs playback review, relevant timestamps and a text transcript/summary');
    attachments.push({ name: selected.name, localPath: join(config.stateRoot, 'operations', selected.operationId, artifact.path),
      sha256: artifact.sha256, kind: selected.kind, description: selected.description,
      ...(selected.kind === 'video' || selected.kind === 'audio'
        ? { timestamps: selected.timestamps, transcript: selected.transcript, playbackReviewed: true } : {}) });
  }
  const draft = {
    schemaVersion: 1, taskId, issueId, planHash: result.planHash,
    operationId: filingOperationId(taskId, issueId),
    title: issue.title, impact: issue.impact, categories: issue.categories,
    environment: details.environment, cause: details.cause,
    scenarios: rows.map(row => ({ rowId: row.id, target: result.target ?? result.feature,
      journey: row.journey, state: row.state, preconditions: row.preconditions,
      steps: row.actions, expected: row.expected, actual: row.observation.actual,
      repeatability: row.observation.issue.repeatability })),
    attachments,
    validation: { integrity: validation.integrity, basis: validation.behavior.basis,
      conformanceCertified: false }
  };
  return { draft, sha256: discoveryHash(draft), descriptionHtml: bugDescription(draft) };
}

export async function fileDiscoveryBug(config, { taskId, issueId, details, approval }) {
  await discoveryStatus(config, taskId);
  return withDirectoryLock(join(config.stateRoot, 'bug-bash', taskId), async () => {
    const status = await discoveryStatus(config, taskId);
    demand(!status.delivered, 'The final report was already delivered; do not silently add filing effects to a closed task');
    const prepared = await prepareDiscoveryBug(config, taskId, issueId, details);
    validateFilingApproval(config, prepared, approval);
    return executeOperation(config, 'a11y-file-bug', prepared.draft.operationId, 'file-bug',
      { subject: taskId, scenarioHash: prepared.draft.planHash },
      { taskId, issueId, details, approval });
  });
}

export function validateFilingApproval(config, prepared, approval) {
  const provider = config.providers?.bugs;
  demand(provider && approval?.approved === true && text(approval.reference) &&
    approval.draftSha256 === prepared.sha256 &&
    approval.organization === provider.organization && approval.project === provider.project,
  'Explicit approval must bind this exact draft and configured organization/project');
}

export async function discoveryBugRecords(config, result) {
  const records = [];
  for (const issue of result.issues.filter(item => item.scope === 'observed-page')) {
    const operationId = filingOperationId(result.taskId, issue.id);
    try {
      const operation = await operationStatus(config, 'a11y-file-bug', operationId);
      demand(operation.action === 'file-bug' && (operation.receipt === undefined ||
        operation.receipt.subject === result.taskId), 'Filing receipt belongs to another task/action');
      records.push({ issueId: issue.id, operationId, status: operation.status,
        outcome: operation.receipt?.outcome, bug: operation.receipt?.bug,
        reason: operation.receipt?.reason });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      records.push({ issueId: issue.id, operationId,
        ...(result.filingDecisions?.[issue.id] ?? { status: 'not-requested' }) });
    }
  }
  return records;
}
