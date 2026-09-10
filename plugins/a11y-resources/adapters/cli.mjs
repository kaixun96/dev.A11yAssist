import { assessProgress } from '../runtime/core.mjs';

export function renderStatus(run) {
  const signal = assessProgress(run);
  return `[${run.runId}] ${run.status}; next=${run.nextStage ?? 'none'}; ${signal.action}`;
}

export function detachedRequirements() {
  return { journal: 'run.json', pendingRequestIdentity: 'required',
    externalExecutor: 'configured provider', completionCallback: 'required',
    terminalWindowLifetimeIsOwnership: false };
}
