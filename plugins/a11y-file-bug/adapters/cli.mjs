import { assessProgress } from '../runtime/core.mjs';
import { validateWaitingDescriptor } from '../runtime/waiting.mjs';

export function renderStatus(run) {
  const signal = assessProgress(run);
  return `[${run.runId}] ${run.status}; next=${run.nextStage ?? 'none'}; ${signal.action}`;
}

export function detachedRequirements(waiting) {
  if (waiting !== undefined) validateWaitingDescriptor(waiting);
  return { journal: 'run.json', pendingRequestIdentity: 'required',
    externalExecutor: 'configured provider', completionCallback: waiting ? 'not-used' : 'required',
    ...(waiting ? { callerPolling: 'required', waiting, deadlineIsCancellation: false } : {}),
    terminalWindowLifetimeIsOwnership: false };
}
