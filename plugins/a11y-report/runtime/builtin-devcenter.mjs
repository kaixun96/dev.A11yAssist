import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { atomicJson, hash } from './core.mjs';
import { recoverDevBox, validateDevCenter } from '../native/devcenter.mjs';

export { validateDevCenter };
export async function callDevCenterProvider(provider, request) {
  validateDevCenter(provider);
  if (request.invocation !== 'capability' || request.stage !== 'recover-devbox' ||
      !['execute', 'reconcile'].includes(request.operation) || request.waiting?.mode !== 'caller-poll') {
    throw new Error('Native Dev Center supports only explicitly caller-polled recover-devbox; retain the original pool provider for other operations');
  }
  const identity = hash(JSON.stringify({ ...request, operation: 'execute' }));
  const progressPath = join(request.stateDirectory, 'native-devcenter-progress.json');
  let progress;
  try {
    const saved = JSON.parse(await readFile(progressPath, 'utf8'));
    if (saved.identity !== identity || saved.sha256 !== hash(JSON.stringify(saved.progress))) {
      throw new Error('Original cloud recovery checkpoint identity/hash mismatch');
    }
    progress = saved.progress;
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const result = await recoverDevBox(provider, { ...request.run,
    recoveryId: request.input.recoveryId, authorizationReference: request.input.authorizationReference }, {
    progress, operation: request.operation,
    checkpoint: progress => atomicJson(progressPath, { identity, progress, sha256: hash(JSON.stringify(progress)) })
  });
  const envelope = { schemaVersion: 1, requestId: request.requestId, runId: request.run.runId, owner: request.run.owner };
  if (result.state === 'pending') return { ...envelope, state: 'pending', progressPath,
    waiting: request.waiting, resumeCondition: 'Read the original Dev Center operation/resource under the same recovery lease; never repeat start' };
  const artifact = 'native-devcenter-result.json';
  await atomicJson(join(request.stateDirectory, artifact), result);
  return { ...envelope, state: 'finished', receipt: {
    ...request.run, requestId: request.requestId, stage: request.stage,
    outcome: result.state === 'finished' ? 'pass' : 'blocked',
    ...(result.reason ? { reason: result.reason } : {}),
    scope: result.scope, interactiveReady: false, atReady: false, leaseReleased: false,
    recoveryId: request.input.recoveryId,
    gates: result.state === 'finished' ? { originalRecoveryOwned: true, cloudPowerRunning: true } : {},
    artifacts: [{ path: artifact, sha256: hash(await readFile(join(request.stateDirectory, artifact))) }]
  } };
}
