import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readAdoWorkItem } from '../native/ado-intake.mjs';
import { attachPrEvidence } from '../native/ado-attachments.mjs';
import { createAdoBug } from '../native/ado-bugs.mjs';
import { atomicJson, hash } from './core.mjs';
import { validateHostAuthentication, hostAuthorization } from '../native/host-auth.mjs';

function demand(condition, message) { if (!condition) throw new Error(message); }

export function validateAdoProvider(provider) {
  demand(provider.kind === 'ado', 'Unsupported built-in provider');
  const url = new URL(provider.organization);
  demand(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash,
    'Expected an HTTPS organization URL without credentials or query');
  demand(typeof provider.project === 'string' && provider.project.trim(), 'ADO project is required');
  demand(provider.repositoryId === undefined || (typeof provider.repositoryId === 'string' && provider.repositoryId.trim()),
    'Invalid ADO repository ID');
  validateHostAuthentication(provider);
}

export async function callAdoProvider(provider, request, config) {
  validateAdoProvider(provider);
  demand(request.invocation === 'capability' && ['read-item', 'attach-evidence', 'file-bug'].includes(request.stage),
    'Built-in ADO transport supports only read-item, attach-evidence and file-bug; it cannot certify an entire workflow stage');
  const responsePath = join(request.stateDirectory, 'native-response.json');
  const { abandonReason, ...originalRequest } = request;
  const identity = hash(JSON.stringify({ ...originalRequest, operation: 'execute' }));
  if (['reconcile', 'resume', 'discard-unstarted'].includes(request.operation)) {
    let stored;
    try { stored = JSON.parse(await readFile(responsePath, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (request.stage !== 'file-bug') throw new Error('No native result receipt exists; inspect the original remote operation before retrying. No mutation was replayed.');
    }
    if (stored) {
      demand(stored.identity === identity && stored.sha256 === hash(JSON.stringify(stored.response)),
        'Native response identity/hash mismatch');
      return stored.response;
    }
  }
  demand(request.operation === 'execute' ||
    (['reconcile', 'resume', 'discard-unstarted'].includes(request.operation) && request.stage === 'file-bug'), 'Unsupported native operation');
  const authorization = request.operation === 'discard-unstarted' ? undefined : await hostAuthorization(provider);
  const configuration = { ...provider, authorization };
  let result, gates;
  if (request.stage === 'read-item') {
    result = await readAdoWorkItem(configuration, request.input);
    gates = { itemRead: true, commentsFetched: true, attachmentsIndexed: true };
  } else if (request.stage === 'file-bug') {
    demand(config, 'Bug filing requires the original discovery configuration');
    const { prepareDiscoveryBug, validateFilingApproval } = await import('./file-bug.mjs');
    const draftPath = join(request.stateDirectory, 'native-bug-draft.json');
    let prepared;
    if (request.operation === 'execute') {
      prepared = await prepareDiscoveryBug(config, request.input.taskId, request.input.issueId, request.input.details);
      await atomicJson(draftPath, { identity, prepared, sha256: hash(JSON.stringify(prepared)) });
    } else {
      const stored = JSON.parse(await readFile(draftPath, 'utf8'));
      demand(stored.identity === identity && stored.sha256 === hash(JSON.stringify(stored.prepared)),
        'Original approved Bug draft identity/hash mismatch');
      prepared = stored.prepared;
    }
    validateFilingApproval(config, prepared, request.input.approval);
    demand(request.run.subject === prepared.draft.taskId &&
      request.run.scenarioHash === prepared.draft.planHash && request.run.runId === prepared.draft.operationId,
    'Filing operation must bind the original task, validated plan and deterministic issue identity');
    const progressPath = join(request.stateDirectory, 'native-bug-progress.json');
    let progress;
    if (request.operation !== 'execute') {
      const stored = JSON.parse(await readFile(progressPath, 'utf8'));
      demand(stored.identity === identity && stored.sha256 === hash(JSON.stringify(stored.progress)),
        'Native Bug progress identity/hash mismatch');
      progress = stored.progress;
    }
    if (request.operation === 'discard-unstarted') {
      demand(progress?.schemaVersion === 1 && progress.phase === 'prepared' &&
        progress.uploaded?.length === 0 && progress.bugId === null &&
        typeof abandonReason === 'string' && abandonReason.trim(),
      'Only a proven pre-mutation checkpoint may be abandoned; unknown effects must remain pending');
      result = { scope: 'validated-discovery-bug', outcome: 'abandoned', reason: abandonReason,
        externalMutationsStarted: false, artifactsPreserved: true };
    } else {
      result = await createAdoBug(configuration, prepared.draft, {
        progress, reconcile: request.operation === 'reconcile',
        resume: request.operation === 'resume', duplicateReview: request.input.approval.duplicateReview,
        checkpoint: progress => atomicJson(progressPath, { identity, progress, sha256: hash(JSON.stringify(progress)) })
      });
    }
    gates = result.outcome ? {} : { validatedFinding: true, explicitFilingAuthorization: true,
      descriptionComplete: true, attachmentsVerified: true, bugReadbackVerified: true };
  } else {
    demand(Array.isArray(request.input.attachments) && request.input.attachments.every(
      attachment => /^[a-f0-9]{64}$/.test(attachment.sha256 ?? '')), 'Each attachment requires its expected SHA-256');
    result = await attachPrEvidence(configuration, { ...request.input, expectedHead: request.run.head });
    gates = { exactHeadMatched: true, draftPrVerified: true, artifactsUploaded: true, noPrComments: true };
    result = { ...result, scope: 'draft-pr-evidence-attachment', independentBehaviorVerified: false, liveMediaVerified: false };
  }
  const artifact = 'native-result.json';
  await atomicJson(join(request.stateDirectory, artifact), result);
  const bytes = await readFile(join(request.stateDirectory, artifact));
  const receipt = {
    ...request.run, requestId: request.requestId, stage: request.stage, outcome: result.outcome ?? 'pass', gates,
    ...(result.reason ? { reason: result.reason } : {}),
    scope: result.scope, independentBehaviorVerified: false,
    ...(result.bug ? { bug: result.bug, draftSha256: request.input.approval.draftSha256 } : {}),
    artifacts: [{ path: artifact, sha256: hash(bytes) }]
  };
  delete receipt.receipts;
  const response = { schemaVersion: 1, requestId: request.requestId, runId: request.run.runId,
    owner: request.run.owner, state: 'finished', receipt };
  await atomicJson(responsePath, { identity, response, sha256: hash(JSON.stringify(response)) });
  return response;
}
