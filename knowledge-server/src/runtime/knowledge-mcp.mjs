// Import-only read-only handler. The standalone CLI owns package identity and stdio.
import assert from 'node:assert/strict';
import { loadKnowledgeSnapshot } from './knowledge.mjs';

export function createKnowledgeHandler(pluginRoot, server = 'a11y-kb', options = {}, version = '1.0.0') {
  assert(/^[a-z][a-z0-9-]*$/.test(server), 'Invalid knowledge server name');
  const prefix = server.replaceAll('-', '_') + '_knowledge_';
  const schema = properties => ({ type: 'object', properties,
    required: Object.keys(properties), additionalProperties: false });
  const tools = [
    { name: prefix + 'list', description: 'Load the pinned shared KB automatically and list selected entry IDs, applicability and source readiness. No provider configuration required. No conformance verdict.', inputSchema: schema({}) },
    { name: prefix + 'search', description: 'Search the pinned KB locally. Returns bounded excerpts; read full entries before applying guidance. Query is never sent to the distribution server.', inputSchema: schema({ query: { type: 'string', minLength: 1, maxLength: 256 } }) },
    { name: prefix + 'read', description: 'Read one complete pinned knowledge entry by declared ID, including its sources and related IDs. Does not read arbitrary files or URLs, edit source, run tests or operate AT.', inputSchema: schema({ id: { type: 'string', minLength: 1, maxLength: 256 } }) }
  ];
  return async request => {
    if (request.method === 'initialize') return { protocolVersion: '2024-11-05',
      capabilities: { tools: {} }, serverInfo: { name: server + '-knowledge', version } };
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
        assert(entry, 'Knowledge ID is not exported by this server');
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