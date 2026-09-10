import { isAbsolute } from 'node:path';
import { validateA11yEvidenceFiles } from './evidence-v1.mjs';
import { verifyArtifactFiles } from './core.mjs';

function localArtifacts(result) {
  return { artifacts: result.evidence.map(item => {
    const path = item.uri.replaceAll('\\', '/');
    if (/[:?#%\0]/.test(path) || path.split('/').some(part => ['', '.', '..'].includes(part))) {
      throw new Error(`Evidence ${item.id} must use an unencoded root-relative local artifact URI`);
    }
    return { path, sha256: item.sha256 };
  }) };
}

export async function validateEvidenceFiles(input) {
  if (!['reproduce', 'verify'].includes(input.phase)) throw new Error('Evidence phase must be reproduce or verify');
  const checkArtifacts = input.artifactRoot !== undefined;
  if (input.baselineArtifactRoot !== undefined && (!checkArtifacts || input.phase !== 'verify')) {
    throw new Error('baselineArtifactRoot requires verify with artifactRoot');
  }
  for (const field of checkArtifacts ?
    ['artifactRoot', ...(input.phase === 'verify' ? ['baselineArtifactRoot'] : [])] : []) {
    if (typeof input[field] !== 'string' || !isAbsolute(input[field])) throw new Error(`${field} must be an absolute path`);
  }
  const fields = {
    requestPath: 'request', resultPath: 'result',
    ...(input.phase === 'verify' ? {
      baselineRequestPath: 'baseline-request', baselineResultPath: 'baseline-result', repoRoot: 'repo-root'
    } : {})
  };
  const args = { phase: input.phase };
  for (const [field, flag] of Object.entries(fields)) {
    if (typeof input[field] !== 'string' || !isAbsolute(input[field])) throw new Error(`${field} must be an absolute path`);
    args[flag] = input[field];
  }
  const checked = validateA11yEvidenceFiles(args);
  if (checkArtifacts) {
    await verifyArtifactFiles(input.artifactRoot, localArtifacts(checked.result));
    if (checked.baseline) await verifyArtifactFiles(input.baselineArtifactRoot, localArtifacts(checked.baseline.result));
  }
  return {
    ...checked.summary,
    scope: checkArtifacts ? 'evidence-v1-structural-and-local-artifact-validation' : 'evidence-v1-structural-validation',
    independentBehaviorVerified: false,
    artifactUriBytesVerified: checkArtifacts,
    ...(checkArtifacts ? {
      documentSha256: checked.documentSha256,
      artifactFileCount: checked.result.evidence.length + (checked.baseline?.result.evidence.length ?? 0)
    } : {})
  };
}
