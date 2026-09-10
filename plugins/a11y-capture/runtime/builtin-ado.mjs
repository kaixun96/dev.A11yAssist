import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readAdoWorkItem } from '../native/ado-intake.mjs';
import { attachPrEvidence } from '../native/ado-attachments.mjs';
import { atomicJson, hash } from './core.mjs';

function demand(condition, message) { if (!condition) throw new Error(message); }

export function validateAdoProvider(provider) {
  demand(provider.kind === 'ado', 'Unsupported built-in provider');
  const url = new URL(provider.organization);
  demand(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash,
    'Expected an HTTPS organization URL without credentials or query');
  demand(typeof provider.project === 'string' && provider.project.trim(), 'ADO project is required');
  demand(provider.repositoryId === undefined || (typeof provider.repositoryId === 'string' && provider.repositoryId.trim()),
    'Invalid ADO repository ID');
  demand(typeof provider.authorizationEnvironmentVariable === 'string' &&
    /^[A-Z][A-Z0-9_]{0,100}$/.test(provider.authorizationEnvironmentVariable), 'Expected authorization environment-variable NAME');
}

export async function callAdoProvider(provider, request) {
  validateAdoProvider(provider);
  demand(request.invocation === 'capability' && ['read-item', 'attach-evidence'].includes(request.stage),
    'Built-in ADO transport supports only read-item and attach-evidence; it cannot certify an entire workflow stage');
  const responsePath = join(request.stateDirectory, 'native-response.json');
  const identity = hash(JSON.stringify({ ...request, operation: 'execute' }));
  if (request.operation === 'reconcile') {
    let stored;
    try { stored = JSON.parse(await readFile(responsePath, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      throw new Error('No native result receipt exists; inspect the original remote operation before retrying. No mutation was replayed.');
    }
    demand(stored.identity === identity && stored.sha256 === hash(JSON.stringify(stored.response)),
      'Native response identity/hash mismatch');
    return stored.response;
  }
  demand(request.operation === 'execute', 'Unsupported native operation');
  const authorization = process.env[provider.authorizationEnvironmentVariable];
  demand(typeof authorization === 'string' && /^(Bearer|Basic) \S+$/.test(authorization),
    'Configured ADO authorization is unavailable; no external operation performed');
  const configuration = { ...provider, authorization };
  let result, gates;
  if (request.stage === 'read-item') {
    result = await readAdoWorkItem(configuration, request.input);
    gates = { itemRead: true, commentsFetched: true, attachmentsIndexed: true };
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
    ...request.run, requestId: request.requestId, stage: request.stage, outcome: 'pass', gates,
    scope: result.scope, independentBehaviorVerified: false,
    artifacts: [{ path: artifact, sha256: hash(bytes) }]
  };
  delete receipt.receipts;
  const response = { schemaVersion: 1, requestId: request.requestId, runId: request.run.runId,
    owner: request.run.owner, state: 'finished', receipt };
  await atomicJson(responsePath, { identity, response, sha256: hash(JSON.stringify(response)) });
  return response;
}
