function demand(condition, message) { if (!condition) throw new Error(message); }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }

export function validateWaitingConfig(provider, mode) {
  const waiting = provider?.waiting;
  if (waiting === undefined) return;
  demand(object(waiting) && ['callback', 'caller-poll'].includes(waiting.mode), 'Invalid provider waiting mode');
  const polling = waiting.mode === 'caller-poll';
  demand(Object.keys(waiting).every(key => (polling
    ? ['mode', 'pollIntervalSeconds', 'timeoutSeconds'] : ['mode']).includes(key)), 'Unknown waiting configuration field');
  if (!polling) return;
  demand(mode === undefined || mode === 'cli', 'Caller polling requires CLI or an independent caller, not Twin mode');
  demand(provider.kind !== 'ado', 'Native ADO does not support negotiated caller polling');
  demand(Number.isInteger(waiting.pollIntervalSeconds) && waiting.pollIntervalSeconds >= 1 &&
    waiting.pollIntervalSeconds <= 3600, 'Polling interval must be 1-3600 seconds');
  demand(Number.isInteger(waiting.timeoutSeconds) && waiting.timeoutSeconds >= waiting.pollIntervalSeconds &&
    waiting.timeoutSeconds <= 86400, 'Polling deadline must cover the interval and be at most 86400 seconds');
}

export function createWaiting(config, providerName, now = Date.now()) {
  const provider = config.providers?.[providerName];
  validateWaitingConfig(provider, config.mode);
  if (provider?.waiting?.mode !== 'caller-poll') return undefined;
  return { mode: 'caller-poll', pollIntervalSeconds: provider.waiting.pollIntervalSeconds,
    deadlineAt: new Date(now + provider.waiting.timeoutSeconds * 1000).toISOString() };
}

export function validateWaitingDescriptor(waiting) {
  demand(object(waiting) && waiting.mode === 'caller-poll' &&
    Object.keys(waiting).length === 3 && Number.isInteger(waiting.pollIntervalSeconds) &&
    waiting.pollIntervalSeconds >= 1 && waiting.pollIntervalSeconds <= 3600 &&
    typeof waiting.deadlineAt === 'string' && Number.isFinite(Date.parse(waiting.deadlineAt)) &&
    new Date(waiting.deadlineAt).toISOString() === waiting.deadlineAt, 'Invalid caller polling descriptor');
}

export function validateRequestWaiting(config, providerName, request, now = Date.now()) {
  const provider = config.providers?.[providerName];
  validateWaitingConfig(provider, config.mode);
  if (provider?.waiting?.mode !== 'caller-poll') {
    demand(request.waiting === undefined, 'Caller polling was not selected by the configured provider');
    return;
  }
  validateWaitingDescriptor(request.waiting);
  demand(request.waiting.pollIntervalSeconds === provider.waiting.pollIntervalSeconds,
    'Request polling interval differs from configured policy');
  demand(Date.parse(request.waiting.deadlineAt) <= now + provider.waiting.timeoutSeconds * 1000,
    'Request polling deadline exceeds configured budget');
  if (request.operation === 'execute') demand(Date.parse(request.waiting.deadlineAt) > now,
    'Polling deadline expired before execution; no provider was called');
}

export function pendingDetails(request, response, now = Date.now()) {
  for (const field of ['resumeCondition', 'progressPath']) {
    demand(typeof response[field] === 'string' && response[field].trim(), `Pending capability requires ${field}`);
  }
  const details = { resumeCondition: response.resumeCondition, progressPath: response.progressPath };
  if (request.waiting === undefined) {
    demand(response.waiting === undefined, 'Provider cannot replace selected callback waiting with polling');
    demand(typeof response.completionCallback === 'string' && response.completionCallback.trim(),
      'Pending capability requires completionCallback');
    return { ...details, completionCallback: response.completionCallback };
  }
  validateWaitingDescriptor(request.waiting);
  validateWaitingDescriptor(response.waiting);
  demand(Object.keys(request.waiting).every(key => request.waiting[key] === response.waiting[key]),
    'Provider changed original polling identity or deadline');
  demand(response.completionCallback === undefined, 'Caller polling cannot advertise a completion callback');
  // Expiry limits caller waiting, not native execution or the original reconciliation identity.
  demand(Date.parse(request.waiting.deadlineAt) > now,
    'Polling deadline exceeded; native outcome remains unknown. Reconcile the original request only; do not execute again');
  return { ...details, waiting: { ...request.waiting } };
}
