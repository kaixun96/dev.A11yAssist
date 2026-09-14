#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadKnowledgeSnapshot } from './knowledge.mjs';

export function createKnowledgeHandler(pluginRoot, plugin, options = {}, version = '1.0.0') {
  assert(/^[a-z][a-z0-9-]*$/.test(plugin), 'Invalid knowledge plugin name');
  const prefix = plugin.replaceAll('-', '_') + '_knowledge_';
  const schema = properties => ({ type: 'object', properties,
    required: Object.keys(properties), additionalProperties: false });
  const tools = [
    { name: prefix + 'list', description: 'Load the pinned shared KB automatically and list selected entry IDs, applicability and source readiness. No provider configuration required. No conformance verdict.', inputSchema: schema({}) },
    { name: prefix + 'search', description: 'Search the pinned KB locally. Returns bounded excerpts; read full entries before applying guidance. Query is never sent to the distribution server.', inputSchema: schema({ query: { type: 'string', minLength: 1, maxLength: 256 } }) },
    { name: prefix + 'read', description: 'Read one complete pinned knowledge entry by declared ID, including its sources and related IDs. Does not read arbitrary files or URLs, edit source, run tests or operate AT.', inputSchema: schema({ id: { type: 'string', minLength: 1, maxLength: 256 } }) }
  ];
  return async request => {
    if (request.method === 'initialize') return { protocolVersion: '2024-11-05',
      capabilities: { tools: {} }, serverInfo: { name: plugin + '-knowledge', version } };
    if (request.method === 'ping') return {};
    if (request.method === 'tools/list') return { tools };
    assert.equal(request.method, 'tools/call', 'Unknown knowledge RPC method');
    try {
      const tool = tools.find(item => item.name === request.params?.name);
      assert(tool, 'Unknown knowledge tool');
      const args = request.params.arguments ?? {};
      assert(args && typeof args === 'object' && !Array.isArray(args), 'Arguments must be an object');
      assert.deepEqual(Object.keys(args).sort(), tool.inputSchema.required.slice().sort(), 'Unexpected or missing knowledge arguments');
      for (const key of tool.inputSchema.required) assert(typeof args[key] === 'string' && args[key].trim().length > 0 && args[key].length <= 256, 'Knowledge argument must be 1..256 characters');
      const snapshot = await loadKnowledgeSnapshot(pluginRoot, options);
      const meta = { origin: snapshot.origin, manifestSha256: snapshot.reference.manifestSha256,
        packages: snapshot.reference.packages, contentApprovalVerified: false, independentBehaviorVerified: false };
      let result;
      if (tool.name === prefix + 'list') {
        result = { ...meta, entries: snapshot.entries, sources: snapshot.sources };
      } else if (tool.name === prefix + 'search') {
        const terms = args.query.toLowerCase().trim().split(/\s+/);
        const hits = snapshot.entries.map(entry => {
          const body = snapshot.files.get(entry.path);
          const lower = (entry.id + '\n' + body).toLowerCase();
          if (!terms.every(term => lower.includes(term))) return null;
          const index = Math.max(0, body.toLowerCase().indexOf(terms[0]));
          return { ...entry, excerpt: body.slice(Math.max(0, index - 80), index + 500) };
        }).filter(Boolean);
        result = { ...meta, matches: hits.slice(0, 20), totalMatches: hits.length, fullEntryReadRequired: true };
      } else {
        const entry = snapshot.entries.find(item => item.id === args.id);
        assert(entry, 'Knowledge ID is not exported by this plugin');
        const packageId = entry.id.split('.')[0];
        result = { ...meta, entry, citation: `kb:${entry.id}@${snapshot.reference.packages[packageId]}`,
          sha256: snapshot.manifest.hashes[entry.path], content: snapshot.files.get(entry.path),
          sources: snapshot.sources[packageId].filter(source => entry.sourceIds.includes(source.id)) };
      }
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    } catch (error) {
      return { isError: true, content: [{ type: 'text', text: `Shared knowledge unavailable: ${error.message}` }] };
    }
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const pluginRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const manifest = JSON.parse(await readFile(resolve(pluginRoot, 'plugin.json'), 'utf8'));
  assert.equal(process.argv[2], manifest.name, 'Knowledge server plugin identity mismatch');
  const handle = createKnowledgeHandler(pluginRoot, manifest.name, {}, manifest.version);
  let chain = Promise.resolve();
  const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });
  lines.on('line', line => {
    chain = chain.then(async () => {
      let request;
      try {
        assert(Buffer.byteLength(line) <= 1024 * 1024, 'Knowledge RPC exceeds 1 MiB');
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
}