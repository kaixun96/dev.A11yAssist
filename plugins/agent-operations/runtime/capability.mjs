import { readFile } from 'node:fs/promises';
import { pendingDetails, validateRequestWaiting } from './waiting.mjs';

export const capabilities = JSON.parse(await readFile(new URL('../contracts/capabilities.json', import.meta.url), 'utf8'));
const outcomes = new Set(['pass', 'changes-requested', 'not-reproduced', 'blocked', 'inconclusive', 'invalid-evidence', 'abandoned']);
const sha = /^[a-f0-9]{64}$/;
const head = /^[a-f0-9]{40}$/;
function requireValue(condition, message) { if (!condition) throw new Error(message); }
export function operationDefinition(action, plugin) {
  const definition = capabilities.operations[action];
  requireValue(definition && (plugin === undefined || definition.plugin === plugin),
    `Plugin ${plugin} cannot invoke capability ${action}`);
  return definition;
}
export function validateContext(action, context) {
  const definition = operationDefinition(action);
  requireValue(context && typeof context === 'object' && !Array.isArray(context), 'Capability context must be an object');
  for (const field of Object.keys(context)) {
    requireValue(['subject', 'scenarioHash', 'evaluator', 'head', 'beforeReceiptSha256'].includes(field), `Unknown context field: ${field}`);
    requireValue(typeof context[field] === 'string' && context[field].trim().length > 0, `Invalid context field: ${field}`);
  }
  for (const field of definition.context) requireValue(context[field], `${action} requires context.${field}`);
  if (context.scenarioHash) requireValue(sha.test(context.scenarioHash), 'Invalid scenarioHash');
  if (context.head) requireValue(head.test(context.head), 'Invalid exact HEAD');
  if (context.beforeReceiptSha256) requireValue(sha.test(context.beforeReceiptSha256), 'Invalid BEFORE receipt hash');
}
export function providerFor(config, action) {
  const definition = operationDefinition(action);
  return config.workflowProfile === 'agentow-odsp' && ['source', 'review'].includes(action)
    ? 'agentow' : definition.provider;
}
export function validateCapabilityReceipt(action, receipt, context) {
  const definition = operationDefinition(action);
  requireValue(receipt && receipt.stage === action, 'Capability receipt operation mismatch');
  requireValue(outcomes.has(receipt.outcome), 'Unsupported capability outcome');
  requireValue(Array.isArray(receipt.artifacts) && receipt.artifacts.length > 0, 'Durable capability artifacts required');
  if (receipt.outcome !== 'pass') {
    requireValue(typeof receipt.reason === 'string' && receipt.reason.trim(), 'Non-pass capability requires a reason');
    requireValue(receipt.outcome !== 'changes-requested' || ['validate', 'review'].includes(action),
      'Only validation/review may request changes');
    return;
  }
  for (const gate of definition.gates) requireValue(receipt.gates?.[gate] === true, `Missing capability gate: ${gate}`);
  for (const field of ['subject', 'scenarioHash', 'evaluator', 'head', 'beforeReceiptSha256']) {
    if (context[field] && !(action === 'source' && field === 'head')) {
      requireValue(receipt[field] === context[field], `Capability ${field === 'head' ? 'HEAD' : field} mismatch`);
    }
  }
  if (action === 'source') {
    requireValue(head.test(receipt.head ?? '') && receipt.prCreated === false, 'Source must return exact HEAD without creating a PR');
  }
  if (action === 'publish') {
    requireValue(receipt.pr?.isDraft === true && /^https:\/\//.test(receipt.pr?.url ?? ''), 'Actual Draft PR identity required');
  }
}
export async function invokeCapability(config, action, request, transport) {
  const provider = providerFor(config, action);
  validateRequestWaiting(config, provider, request);
  const response = await transport(config, provider, request);
  if (response.state === 'pending') {
    pendingDetails(request, response);
    return response;
  }
  requireValue(response.state === 'finished' && response.receipt, 'Capability must return pending or a finished receipt');
  const receipt = response.receipt;
  requireValue(receipt.requestId === request.requestId && receipt.runId === request.run.runId &&
    receipt.owner === request.run.owner, 'Capability receipt identity mismatch');
  validateCapabilityReceipt(action, receipt, request.run);
  return response;
}
