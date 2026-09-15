#!/usr/bin/env node
// Standalone stdio transport. No plugin registration or operational runtime.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createKnowledgeHandler } from './src/runtime/knowledge-mcp.mjs';

assert.equal(process.argv.length, 2, 'The knowledge server takes no command-line arguments');
const root = fileURLToPath(new URL('.', import.meta.url));
const manifest = JSON.parse(await readFile(new URL('package.json', import.meta.url), 'utf8'));
assert.equal(manifest.name, '@a11y-assist/knowledge-server', 'Knowledge server identity mismatch');
const handle = createKnowledgeHandler(root, 'a11y-kb', {}, manifest.version);
async function* frames(input) {
  let parts = [], size = 0;
  for await (const chunk of input) {
    let start = 0;
    for (let end = 0; end <= chunk.length; end++) {
      if (end !== chunk.length && chunk[end] !== 10) continue;
      const part = chunk.subarray(start, end);
      size += part.length;
      if (size > 1024 * 1024) throw new Error('Knowledge RPC exceeds 1 MiB');
      parts.push(part);
      if (end !== chunk.length) {
        yield Buffer.concat(parts, size);
        parts = []; size = 0;
      }
      start = end + 1;
    }
  }
  if (size) yield Buffer.concat(parts, size);
}
const reply = value => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...value }) + '\n');
// Bound each frame before buffering it; stdout is RPC only.
try {
for await (const bytes of frames(process.stdin)) {
  let request;
  let code = -32700;
  let id = null;
  try {
    request = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    code = -32600;
    assert(request && !Array.isArray(request) && request.jsonrpc === '2.0' &&
      typeof request.method === 'string', 'Invalid JSON-RPC request');
    if (request.id === undefined) continue;
    assert(typeof request.id === 'string' || (typeof request.id === 'number' && Number.isFinite(request.id)), 'Invalid JSON-RPC ID');
    id = request.id;
    code = -32601;
    assert(['initialize', 'ping', 'tools/list', 'tools/call'].includes(request.method), 'Unknown knowledge RPC method');
    code = -32602;
    if (request.params !== undefined) assert(request.params && typeof request.params === 'object' &&
      !Array.isArray(request.params), 'Invalid JSON-RPC params');
    code = -32603;
    const result = await handle(request);
    reply({ id, result });
  } catch (error) {
    reply({ id, error: { code, message: error.message } });
  }
}
} catch (error) {
  reply({ id: null, error: { code: -32600, message: error.message } });
  process.exitCode = 1;
}