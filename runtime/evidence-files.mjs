import { spawnSync } from 'node:child_process';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateEvidenceFiles(input) {
  if (!['reproduce', 'verify'].includes(input.phase)) throw new Error('Evidence phase must be reproduce or verify');
  const fields = {
    requestPath: 'request', resultPath: 'result',
    ...(input.phase === 'verify' ? {
      baselineRequestPath: 'baseline-request', baselineResultPath: 'baseline-result', repoRoot: 'repo-root'
    } : {})
  };
  const args = [fileURLToPath(new URL('./evidence-v1.mjs', import.meta.url)), '--phase', input.phase];
  for (const [field, flag] of Object.entries(fields)) {
    if (typeof input[field] !== 'string' || !isAbsolute(input[field])) throw new Error(`${field} must be an absolute path`);
    args.push(`--${flag}`, input[field]);
  }
  const child = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024, windowsHide: true });
  if (child.error) throw child.error;
  if (child.status !== 0) throw new Error(child.stderr.trim() || `Evidence validator exited ${child.status}`);
  return {
    ...JSON.parse(child.stdout),
    scope: 'evidence-v1-structural-validation',
    independentBehaviorVerified: false,
    artifactUriBytesVerified: false
  };
}
