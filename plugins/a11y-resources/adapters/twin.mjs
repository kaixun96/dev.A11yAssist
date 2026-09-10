import { readFile } from 'node:fs/promises';

// Only notifications/explicit safe continuation coordination use this adapter.
// It never fabricates a human actor or rebinds a conversation.
async function resolveTwinDestination(config) {
  if (config.mode !== 'twin' || !config.twin?.conversationId) {
    throw new Error('A configured Twin scope is required');
  }
  const runtime = JSON.parse(await readFile(config.twin.runtimePath, 'utf8'));
  if (!Number.isInteger(runtime.port) || runtime.port < 1 || runtime.port > 65535 ||
      !Number.isInteger(runtime.pid)) throw new Error('Invalid Twin runtime metadata');
  process.kill(runtime.pid, 0);
  const base = `http://127.0.0.1:${runtime.port}`;
  const detailResponse = await fetch(`${base}/api/twin/conversations/${encodeURIComponent(config.twin.conversationId)}`,
    { signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!detailResponse.ok) throw new Error(`Twin scope lookup failed: ${detailResponse.status}`);
  const detail = await detailResponse.json();
  if (detail.id !== config.twin.conversationId || !detail.enabled) throw new Error('Original Twin scope missing or disabled');
  return base;
}

export async function checkTwinDestination(config) {
  await resolveTwinDestination(config);
  return { ready: true, conversationId: config.twin.conversationId, workerProgressVerified: false };
}

export async function notifyTwin(config, text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('A nonempty notification is required');
  const base = await resolveTwinDestination(config);
  const response = await fetch(`${base}/api/twin/trigger`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000), redirect: 'error',
    body: JSON.stringify({ conversationId: config.twin.conversationId,
      provenanceSource: 'schedule', actorName: 'A11y Assist plugin', actorAadId: '',
      scenario: 'a11y-plugin-notification', text })
  });
  if (!response.ok) throw new Error(`Twin notification result unknown: ${response.status}; reconcile before retry`);
  const result = await response.json();
  if (result.ok !== true) throw new Error('Twin notification not acknowledged');
  return { deliveredToRuntime: true, workerProgressVerified: false };
}
