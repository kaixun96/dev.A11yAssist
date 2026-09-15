// Import-only read-only handler. The standalone CLI owns package identity and stdio.
import assert from 'node:assert/strict';
import { loadKnowledgeSnapshot } from './knowledge.mjs';

const categories = ['standard', 'pattern', 'case', 'fix', 'example'];
const textArgument = { type: 'string', minLength: 1, maxLength: 256 };
const identifier = { ...textArgument, pattern: '^[a-z][a-z0-9-]*$' };
const filters = {
  category: { type: 'string', enum: categories, description: 'Discovery category, not approval. Standard means a cited normative source; pattern/fix/example are curated tags; case is entry kind.' },
  standard: { ...identifier, description: 'Exact package-local normative source ID, e.g. wcag or aria. Matches references, not verified clauses or standard versions.' },
  sourceId: { ...identifier, description: 'Exact package-local source ID, including informative sources such as apg. Combine with packageId to disambiguate.' },
  packageId: { ...identifier, description: 'Exact package in the pinned selection. Does not auto-include its dependencies in results.' },
  appliesTo: { ...textArgument, description: 'Exact applicability label, e.g. fluent-v9. No version inference, aliases or wildcard matching.' }
};

function discover(snapshot, args) {
  return snapshot.entries.flatMap(entry => {
    const packageId = entry.id.split('.')[0];
    const sources = snapshot.sources[packageId].filter(source => entry.sourceIds.includes(source.id));
    const entryCategories = categories.filter(category => category === 'standard'
      ? sources.some(source => source.authority === 'normative-standard')
      : category === 'case' ? entry.kind === 'case' : (entry.discoveryTags ?? []).includes(category));
    const matchedSources = sources.filter(source =>
      (!args.sourceId || source.id === args.sourceId) &&
      (!args.standard || source.id === args.standard) &&
      (!(args.standard || args.category === 'standard') || source.authority === 'normative-standard'));
    if ((args.packageId && packageId !== args.packageId) ||
      (args.appliesTo && !entry.appliesTo.includes(args.appliesTo)) ||
      (args.category && !entryCategories.includes(args.category)) ||
      ((args.standard || args.sourceId || args.category === 'standard') && !matchedSources.length)) return [];
    return [{ ...entry, packageId, categories: entryCategories, matchedSources }];
  });
}

// Counts describe the complete filtered list, never a top-N search excerpt.
function facets(entries, snapshot) {
  const counts = values => [...new Set(values)].sort().map(value => ({ value, count: values.filter(item => item === value).length }));
  return {
    categories: categories.map(value => ({ value, count: entries.filter(entry => entry.categories.includes(value)).length })),
    packages: counts(entries.map(entry => entry.packageId)),
    appliesTo: counts(entries.flatMap(entry => entry.appliesTo)),
    sources: Object.entries(snapshot.sources).flatMap(([packageId, sources]) => sources.flatMap(source => {
      const count = entries.filter(entry => entry.packageId === packageId && entry.sourceIds.includes(source.id)).length;
      return count ? [{ packageId, ...source, count }] : [];
    }))
  };
}

export function createKnowledgeHandler(pluginRoot, server = 'a11y-kb', options = {}, version = '1.0.0') {
  assert(/^[a-z][a-z0-9-]*$/.test(server), 'Invalid knowledge server name');
  const prefix = server.replaceAll('-', '_') + '_knowledge_';
  const schema = (properties, required = []) => ({ type: 'object', properties,
    required, additionalProperties: false });
  const tools = [
    { name: prefix + 'list', description: 'Browse the pinned KB with optional AND-composed category, standard, source, package and applicability filters. Returns complete matching IDs and facet counts. No provider configuration or conformance verdict.', inputSchema: schema(filters) },
    { name: prefix + 'search', description: 'Search the pinned KB locally with optional AND-composed discovery filters. Returns bounded excerpts; read full entries before applying guidance. Query is never sent to the distribution server.', inputSchema: schema({ query: textArgument, ...filters }, ['query']) },
    { name: prefix + 'read', description: 'Read one complete pinned knowledge entry by declared ID, including its sources and related IDs. Does not read arbitrary files or URLs, edit source, run tests or operate AT.', inputSchema: schema({ id: textArgument }, ['id']) }
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
      const args = request.params.arguments === undefined ? {} : request.params.arguments;
      assert(args && typeof args === 'object' && !Array.isArray(args), 'Arguments must be an object');
      assert(tool.inputSchema.required.every(key => Object.hasOwn(args, key)) &&
        Object.keys(args).every(key => Object.hasOwn(tool.inputSchema.properties, key)), 'Unexpected or missing knowledge arguments');
      for (const [key, value] of Object.entries(args)) {
        const definition = tool.inputSchema.properties[key];
        assert(typeof value === 'string' && value.trim().length > 0 && value.length <= 256 && value.isWellFormed(), 'Knowledge argument must be 1..256 Unicode characters');
        if (definition.enum) assert(definition.enum.includes(value), `Invalid knowledge ${key}`);
        if (definition.pattern) assert(new RegExp(definition.pattern).test(value), `Invalid knowledge ${key}`);
      }
      const snapshot = await loadKnowledgeSnapshot(pluginRoot, options);
      const meta = { origin: snapshot.origin, manifestSha256: snapshot.reference.manifestSha256,
        packages: snapshot.reference.packages, contentApprovalVerified: false, independentBehaviorVerified: false };
      let result;
      if (tool.name === prefix + 'list') {
        const entries = discover(snapshot, args);
        result = { ...meta, entries, sources: snapshot.sources, filters: args,
          facets: facets(entries, snapshot), totalMatches: entries.length, fullEntryReadRequired: true };
      } else if (tool.name === prefix + 'search') {
        const terms = args.query.toLowerCase().trim().split(/\s+/);
        const hits = discover(snapshot, args).map(entry => {
          const body = snapshot.files.get(entry.path);
          const lower = (entry.id + '\n' + body).toLowerCase();
          if (!terms.every(term => lower.includes(term))) return null;
          const index = Math.max(0, body.toLowerCase().indexOf(terms[0]));
          return { ...entry, excerpt: body.slice(Math.max(0, index - 80), index + 500) };
        }).filter(Boolean);
        const { query, ...appliedFilters } = args;
        result = { ...meta, matches: hits.slice(0, 20), totalMatches: hits.length,
          filters: appliedFilters, fullEntryReadRequired: true };
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