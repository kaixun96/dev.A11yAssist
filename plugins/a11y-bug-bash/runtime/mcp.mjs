#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { plugins, VERSION, readConfig, doctor, createRun, loadRun, publicRun,
  executeStage, reconcile, resourceStatus, assessProgress, abandonRun } from './core.mjs';
import { capabilities } from './capability.mjs';
import { executeOperation, operationStatus, reconcileOperation } from './operations.mjs';
import { validateEvidenceFiles } from './evidence-files.mjs';

const plugin = process.argv[2];
if (!plugins[plugin]) throw new Error('Expected a registered plugin name');
const prefix = plugin.replaceAll('-', '_');
const empty = { type: 'object', properties: {}, additionalProperties: false };
const runSchema = { type: 'object', properties: { runId: { type: 'string' } },
  required: ['runId'], additionalProperties: false };
const tools = [
  { name: `${prefix}_doctor`, description: 'Read configuration and provider integrity; never asserts live AT readiness.', inputSchema: empty },
  { name: `${prefix}_status`, description: 'Read original run state without exposing provider credentials.', inputSchema: runSchema },
  { name: `${prefix}_reconcile`, description: 'Observe the same pending provider request; never resubmit execution.', inputSchema: runSchema }
];
if (['a11y-validate', 'a11y-workflow'].includes(plugin)) tools.push({
  name: `${prefix}_evidence`,
  description: 'Read-only evidence-v1 structural/scenario/baseline/HEAD checks, with optional root-confined local artifact hashing. No provider or workflow run required. Never downloads remote URIs, inspects media or claims an independent behavior PASS.',
  inputSchema: { type: 'object', properties: {
    phase: { type: 'string', enum: ['reproduce', 'verify'] },
    requestPath: { type: 'string' }, resultPath: { type: 'string' },
    baselineRequestPath: { type: 'string' }, baselineResultPath: { type: 'string' }, repoRoot: { type: 'string' },
    artifactRoot: { type: 'string' }, baselineArtifactRoot: { type: 'string' }
  }, required: ['phase', 'requestPath', 'resultPath'], additionalProperties: false }
});
const actions = Object.entries(capabilities.operations).filter(([, value]) => value.plugin === plugin).map(([action]) => action);
const operationSchema = { type: 'object', properties: { operationId: { type: 'string' } },
  required: ['operationId'], additionalProperties: false };
if (actions.length) {
  tools.push({
    name: `${prefix}_invoke`,
    description: 'Invoke one independent capability inside the caller workflow. No shared workflow run or earlier phases required. Retain operationId to reconcile unknown outcomes.',
    inputSchema: { type: 'object', properties: {
      operationId: { type: 'string' }, action: { type: 'string', enum: actions },
      context: { type: 'object' }, input: { type: 'object' }
    }, required: ['operationId', 'action', 'context'], additionalProperties: false }
  });
  tools.push({ name: `${prefix}_operation_status`, description: 'Read this capability operation without a workflow journal.', inputSchema: operationSchema });
  tools.push({ name: `${prefix}_operation_reconcile`, description: 'Observe the SAME pending capability operation; never repeat its external effect.', inputSchema: operationSchema });
}
if (['a11y-intake', 'a11y-workflow'].includes(plugin)) tools.push({
  name: `${prefix}_create`, description: 'Create a durable run, not a Bug claim; intake provider must acquire canonical ownership.',
  inputSchema: { type: 'object', properties: { bug: { type: 'string' } }, required: ['bug'], additionalProperties: false }
});
if (plugins[plugin].stages.length) tools.push({
  name: `${prefix}_execute`, description: 'Execute only the next permitted phase through a configured trusted provider. No evidence bypass.',
  inputSchema: { type: 'object', properties: {
    runId: { type: 'string' }, stage: { type: 'string', enum: plugins[plugin].stages }, input: { type: 'object' }
  }, required: ['runId', 'stage'], additionalProperties: false }
});
if (['a11y-resources', 'a11y-workflow'].includes(plugin)) tools.push({
  name: `${prefix}_resources`, description: 'Read public resource health/ownership from the configured authoritative pool.', inputSchema: empty
});
if (['agent-operations', 'a11y-workflow'].includes(plugin)) tools.push({
  name: `${prefix}_progress`, description: 'Identify permitted continuation/reconciliation action; a reply is not execution recovery.', inputSchema: runSchema
});
if (['agent-operations', 'a11y-workflow'].includes(plugin)) tools.push({
  name: `${prefix}_abandon`, description: 'Record an explicit abandonment reason and require cleanup; never releases resources itself.',
  inputSchema: { type: 'object', properties: { runId: { type: 'string' }, reason: { type: 'string' } },
    required: ['runId', 'reason'], additionalProperties: false }
});

function validateArguments(tool, args) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Arguments must be an object');
  const schema = tool.inputSchema;
  for (const key of Object.keys(args)) if (!(key in schema.properties)) throw new Error(`Unknown argument: ${key}`);
  for (const key of schema.required ?? []) if (!(key in args)) throw new Error(`Missing argument: ${key}`);
  for (const [key, value] of Object.entries(args)) {
    const field = schema.properties[key];
    if (field.type === 'string' && typeof value !== 'string') throw new Error(`Expected string: ${key}`);
    if (field.type === 'object' && (!value || typeof value !== 'object' || Array.isArray(value))) throw new Error(`Expected object: ${key}`);
    if (field.enum && !field.enum.includes(value)) throw new Error(`Unsupported ${key}`);
  }
}

async function handle(request) {
  if (request.method === 'initialize') return {
    protocolVersion: '2024-11-05', capabilities: { tools: {} },
    serverInfo: { name: plugin, version: VERSION }
  };
  if (request.method === 'ping') return {};
  if (request.method === 'tools/list') return { tools };
  if (request.method !== 'tools/call') throw new Error('Unknown method');
  const tool = tools.find(t => t.name === request.params?.name);
  if (!tool) throw new Error('Tool is not exported by this plugin');
  const args = request.params.arguments ?? {};
  validateArguments(tool, args);
  try {
    const action = tool.name.slice(prefix.length + 1);
    const fullWorkflow = plugin === 'a11y-workflow' ||
      ['create', 'status', 'reconcile', 'execute', 'progress', 'abandon'].includes(action);
    const config = action === 'evidence' ? null : await readConfig(undefined, { fullWorkflow });
    let result;
    if (action === 'evidence') result = await validateEvidenceFiles(args);
    else if (action === 'invoke') result = await executeOperation(config, plugin, args.operationId, args.action, args.context, args.input ?? {});
    else if (action === 'operation_status') result = await operationStatus(config, plugin, args.operationId);
    else if (action === 'operation_reconcile') result = await reconcileOperation(config, plugin, args.operationId);
    else if (action === 'doctor') result = await doctor(config);
    else if (action === 'create') result = await createRun(config, args.bug);
    else if (action === 'status') result = publicRun(await loadRun(config, args.runId));
    else if (action === 'execute') result = await executeStage(config, plugin, args.runId, args.stage, args.input ?? {});
    else if (action === 'reconcile') result = await reconcile(config, plugin, args.runId);
    else if (action === 'resources') result = await resourceStatus(config);
    else if (action === 'progress') result = assessProgress(await loadRun(config, args.runId));
    else if (action === 'abandon') result = await abandonRun(config, args.runId, args.reason);
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  } catch (error) {
    return { isError: true, content: [{ type: 'text', text: error.message }] };
  }
}

let chain = Promise.resolve();
const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', line => {
  chain = chain.then(async () => {
    let request;
    try {
      if (Buffer.byteLength(line) > 1024 * 1024) throw new Error('RPC input exceeds 1 MiB');
      request = JSON.parse(line);
      if (request.id === undefined) return;
      const result = await handle(request);
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) + '\n');
    } catch (error) {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request?.id ?? null,
        error: { code: -32603, message: error.message } }) + '\n');
    }
  });
});
