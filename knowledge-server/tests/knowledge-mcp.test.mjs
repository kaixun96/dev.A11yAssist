import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createKnowledgeHandler } from '../src/runtime/knowledge-mcp.mjs';
import { createCommonReferenceFixture } from './helpers/common-reference.mjs';
import { assertCurrentEntries, currentPackages } from './helpers/current-packages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const repository = fileURLToPath(new URL('../../', import.meta.url));
const kbRoot = fileURLToPath(new URL('../../accessibility-kb', import.meta.url));
const preload = pathToFileURL(join(root, 'tests/fixtures/knowledge-fetch.mjs')).href;
const load = async path => JSON.parse(await readFile(path, 'utf8'));
const serverName = 'a11y-kb';
const prefix = name => name.replaceAll('-', '_') + '_knowledge_';
const rpc = (method, params, id = 1) => ({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) });
const call = (name, action, args = {}) => rpc('tools/call', { name: prefix(name) + action, arguments: args });
const content = result => { assert(!result.isError, JSON.stringify(result)); return JSON.parse(result.content[0].text); };

async function fixture(fn) {
  const dir = await mkdtemp(join(await realpath(tmpdir()), 'kb-mcp-installed-'));
  try {
    const server = join(dir, 'knowledge-server');
    await mkdir(server);
    // Deliberately omit all repository files, authoring tools, dependencies and
    // other packages. The CLI and runtime must work from this server alone.
    for (const path of ['package.json', 'cli.mjs', 'src/runtime', 'references']) {
      await cp(join(root, path), join(server, path), { recursive: true });
    }
    const reference = await load(join(server, 'references/knowledge.json'));
    const artifact = join(repository, 'knowledge-distribution', reference.manifestSha256 + '.json');
    const cache = join(dir, 'cache');
    const env = { ...process.env, A11Y_ASSIST_KB_CACHE_ROOT: cache };
    for (const key of ['A11Y_ASSIST_KB_ROOT', 'A11Y_ASSIST_CONFIG', 'NODE_OPTIONS', 'TEST_KB_URL', 'TEST_KB_ARTIFACT']) delete env[key];
    const run = (requests, overrides = {}) => {
      const child = spawnSync(process.execPath, ['--import', preload, join(server, 'cli.mjs')], {
        cwd: dir, env: { ...env, ...overrides }, encoding: 'utf8', timeout: 20000,
        input: requests.map(request => JSON.stringify(request)).join('\n') + '\n'
      });
      assert.equal(child.status, 0, child.stderr);
      assert.equal(child.stderr, '');
      return child.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    };
    await fn({ dir, server, reference, artifact, cache, env, run });
  } finally { await rm(dir, { recursive: true, maxRetries: 3, retryDelay: 50 }); }
}

test('isolated standalone CLI exposes exactly three lazy read-only knowledge tools', async () => {
  await fixture(async ({ dir, server, run, cache }) => {
    assert.deepEqual(await readdir(dir), ['knowledge-server']);
    const manifest = await load(join(server, 'package.json'));
    assert.equal(manifest.name, '@a11y-assist/knowledge-server');
    assert.deepEqual((await readdir(join(server, 'src/runtime'))).sort(), ['knowledge-mcp.mjs', 'knowledge.mjs']);
    const replies = run([rpc('initialize'), { jsonrpc: '2.0', method: 'notifications/initialized' }, rpc('tools/list', undefined, 2)]);
    assert.equal(replies.length, 2);
    assert.equal(replies[0].result.serverInfo.version, manifest.version);
    assert.equal(replies[0].result.serverInfo.name, 'a11y-kb-knowledge');
    assert.deepEqual(replies[0].result.capabilities, { tools: {} });
    assert.deepEqual(replies[1].result.tools.map(tool => tool.name), ['list', 'search', 'read'].map(action => prefix(serverName) + action));
    for (const tool of replies[1].result.tools) assert.equal(tool.inputSchema.additionalProperties, false);
    await assert.rejects(readdir(cache), { code: 'ENOENT' }); // No eager download or operational config needed.
    const [listed] = run([call(serverName, 'list')], { A11Y_ASSIST_KB_ROOT: kbRoot });
    const snapshot = content(listed.result);
    assert.equal(snapshot.origin, 'configured');
    assertCurrentEntries(snapshot.entries);
    assert.deepEqual(Object.keys(snapshot.packages), ['common', 'fluent', 'sharepoint']);
    await assert.rejects(readdir(cache), { code: 'ENOENT' });
  });
});

test('runtime handler is import-only and defaults to the standalone tool prefix', async () => {
  // No real root is needed for initialize, ping or tools/list.
  const handler = createKnowledgeHandler('unused-lazy-server-root');
  assert.deepEqual(await handler(rpc('ping')), {});
  const listed = await handler(rpc('tools/list'));
  assert.deepEqual(listed.tools.map(tool => tool.name), [
    'a11y_kb_knowledge_list', 'a11y_kb_knowledge_search', 'a11y_kb_knowledge_read'
  ]);
  assert.throws(() => createKnowledgeHandler(root, '@a11y-assist/knowledge-server'), /Invalid knowledge server name/);
  await assert.rejects(handler(rpc('resources/list')), /Unknown knowledge RPC method/);
  const child = spawnSync(process.execPath, [join(root, 'src/runtime/knowledge-mcp.mjs')], {
    cwd: tmpdir(), encoding: 'utf8', timeout: 15000, input: JSON.stringify(rpc('initialize')) + '\n'
  });
  assert.equal(child.status, 0, child.stderr);
  assert.equal(child.stdout, '', 'Import-only module must not start a stdio listener');
  assert.equal(child.stderr, '');
});

test('standalone server cold-bootstraps all declared entries then reads Common and ODSP offline across processes', async () => {
  const name = serverName;
  await fixture(async ({ dir, reference, artifact, run }) => {
    // Exercise normal Windows cache defaults, not an A11y KB root/cache setting.
    const environment = process.platform === 'win32'
      ? { A11Y_ASSIST_KB_CACHE_ROOT: undefined, LOCALAPPDATA: join(dir, 'localappdata') } : {};
    const [first] = run([call(name, 'list')], { ...environment, TEST_KB_URL: reference.distribution.url, TEST_KB_ARTIFACT: artifact });
    const listed = content(first.result);
    assert.equal(listed.origin, 'download');
    assertCurrentEntries(listed.entries);
    assert.deepEqual(Object.keys(listed.packages), ['common', 'fluent', 'sharepoint']);
    assert.equal(listed.contentApprovalVerified, false);
    assert.equal(listed.independentBehaviorVerified, false);
    assert(listed.sources.common.some(source => source.status === 'connection-pending'));
    const replies = run([call(name, 'search', { query: 'focus' }), call(name, 'read', { id: 'common.analysis.root-cause' }),
      call(name, 'read', { id: 'common.topic.foundations' }),
      call(name, 'search', { query: 'sharepoint.utilities.announcements-and-focus' }),
      call(name, 'read', { id: 'sharepoint.utilities.announcements-and-focus' })], environment);
    const searched = content(replies[0].result);
    assert.equal(searched.origin, 'cache');
    assert.equal(searched.fullEntryReadRequired, true);
    assert(searched.matches.length > 0 && searched.matches.length <= 20);
    assert(searched.matches.every(entry => entry.excerpt.length <= 580));
    const read = content(replies[1].result);
    assert.equal(read.origin, 'cache');
    assert.equal(read.content, (await readFile(join(kbRoot, 'packages/common/analysis/root-cause.md'), 'utf8')).replaceAll('\r\n', '\n'));
    assert.equal(read.citation, `kb:common.analysis.root-cause@${reference.packages.common}`);
    assert.match(read.sha256, /^[a-f0-9]{64}$/);
    const common = currentPackages.find(pkg => pkg.id === 'common');
    const analysis = common.entries.find(entry => entry.id === read.entry.id);
    assert.deepEqual(read.sources, common.sources.filter(source => analysis.sourceIds.includes(source.id)));
    assert(read.sources.every(source => source.authority === 'historical-reference' && source.status === 'historical'));
    const foundations = content(replies[2].result);
    assert.deepEqual(foundations.sources.map(source => source.id), ['wcag', 'apg']);
    assert(foundations.sources.every(source => foundations.entry.sourceIds.includes(source.id)));
    assert.equal(read.independentBehaviorVerified, false);
    const projectSearch = content(replies[3].result);
    assert.equal(projectSearch.origin, 'cache');
    assert.equal(projectSearch.fullEntryReadRequired, true);
    assert(projectSearch.matches.some(entry => entry.id === 'sharepoint.utilities.announcements-and-focus'));
    const odsp = content(replies[4].result);
    const packageDescriptor = await load(join(kbRoot, 'packages/sharepoint/package.json'));
    const entry = packageDescriptor.entries.find(entry => entry.id === 'sharepoint.utilities.announcements-and-focus');
    assert.equal(odsp.origin, 'cache');
    assert.equal(odsp.entry.id, entry.id);
    assert.equal(odsp.entry.status, 'draft');
    assert.deepEqual(odsp.entry.sourceIds, entry.sourceIds);
    assert.deepEqual(odsp.entry.relations, entry.relations);
    assert.equal(odsp.content, (await readFile(join(kbRoot, 'packages/sharepoint', entry.path), 'utf8')).replaceAll('\r\n', '\n'));
    assert.equal(odsp.citation, `kb:${entry.id}@${packageDescriptor.version}`);
    const distribution = await load(artifact);
    assert.equal(odsp.sha256, distribution.manifest.hashes[`packages/sharepoint/${entry.path}`]);
    assert.deepEqual(odsp.sources, packageDescriptor.sources.filter(source => entry.sourceIds.includes(source.id)));
    assert.deepEqual(odsp.sources.map(source => source.id), ['agentow-accessibility']);
    assert(odsp.sources.every(source => source.authority === 'historical-reference' && source.status === 'historical'));
    assert.equal(odsp.contentApprovalVerified, false);
    assert.equal(odsp.independentBehaviorVerified, false);
  });
});

test('standalone MCP grants no execution authority or existing-plugin tool aliases', async () => {
  await fixture(async ({ run, cache }) => {
    const rejected = run([
      call('a11y-knowledge', 'list'), call('a11y-knowledge-odsp', 'list'),
      ...['doctor', 'invoke', 'execute', 'status', 'reconcile', 'operation_status', 'operation_reconcile']
        .map(action => rpc('tools/call', { name: `a11y_kb_${action}`, arguments: {} }))
    ]);
    for (const reply of rejected) {
      assert.equal(reply.result.isError, true);
      assert.match(reply.result.content[0].text, /Unknown knowledge tool/);
    }
    await assert.rejects(readdir(cache), { code: 'ENOENT' });
  });
});

test('knowledge MCP rejects arbitrary arguments before loading or downloading', async () => {
  const name = serverName;
  await fixture(async ({ server, env }) => {
    let downloads = 0;
    const handler = createKnowledgeHandler(server, name, { env, fetchImpl: () => { downloads++; throw new Error('Unexpected fetch'); } });
    for (const request of [
      call(name, 'list', { url: 'https://example.invalid' }),
      call(name, 'read', { id: 'common.topic.foundations', kbRoot: 'C:\\private' }),
      call(name, 'read', { path: '../../private' }),
      call(name, 'read', { id: null }), call(name, 'search', { query: ' ' }),
      call(name, 'search', { query: 'x'.repeat(257) }), call(name, 'list', []),
      call(name, 'list', null), call(name, 'search', {}),
      call(name, 'list', { category: 'Pattern' }), call(name, 'list', { category: ['case'] }),
      call(name, 'list', { standard: '../wcag' }), call(name, 'list', { sourceId: 'https://example.invalid' }),
      call(name, 'list', { packageId: 'common.*' }), call(name, 'list', { appliesTo: ' ' }),
      call(name, 'search', { query: 'focus', filters: { category: 'pattern' } }),
      call(name, 'read', { id: 'common.case.dialog-focus', category: 'case' }),
      call(name, 'list', JSON.parse('{"__proto__":"case"}')),
      rpc('tools/call', { name: prefix(name) + 'execute', arguments: {} }),
      ...['doctor', 'invoke', 'execute', 'status', 'reconcile', 'operation_status', 'operation_reconcile']
        .map(action => rpc('tools/call', { name: 'a11y_kb_' + action, arguments: {} })),
      call('a11y-knowledge', 'list')
    ]) assert.equal((await handler(request)).isError, true);
    assert.equal(downloads, 0);
  });
});

test('discovery lists standards, curated patterns and cases on independent exact scope axes', async () => {
  const handler = createKnowledgeHandler(root, serverName, { env: { A11Y_ASSIST_KB_ROOT: kbRoot } });
  const list = async args => content(await handler(call(serverName, 'list', args)));
  const all = await list({});
  assert.equal(all.totalMatches, 35);
  assert.deepEqual(Object.fromEntries(all.entries.filter(entry => entry.discoveryTags).map(entry => [entry.id, entry.discoveryTags])), {
    'common.topic.dynamic-content': ['pattern', 'example'],
    'common.case.dialog-focus': ['pattern', 'fix', 'example'],
    'fluent.v8.component-contract': ['pattern', 'fix', 'example'],
    'fluent.v9.component-contract': ['pattern', 'fix', 'example'],
    'sharepoint.spds.component-contract': ['pattern', 'fix', 'example'],
    'sharepoint.utilities.announcements-and-focus': ['pattern', 'example'],
    'sharepoint.case.duplicate-announcement': ['fix', 'example']
  });
  assert.deepEqual(all.filters, {});
  for (const category of ['pattern', 'fix', 'example', 'case', 'standard']) {
    const result = await list({ category });
    const expected = currentPackages.flatMap(pkg => pkg.entries.filter(entry => category === 'case'
      ? entry.kind === 'case' : category === 'standard'
        ? entry.sourceIds.some(id => pkg.sources.some(source => source.id === id && source.authority === 'normative-standard'))
        : entry.discoveryTags?.includes(category)).map(entry => entry.id));
    assert.deepEqual(result.entries.map(entry => entry.id), expected);
    assert.equal(result.totalMatches, expected.length);
    assert.equal(all.facets.categories.find(facet => facet.value === category).count, expected.length);
    assert.equal(result.fullEntryReadRequired, true);
    assert.equal(result.contentApprovalVerified, false);
    assert.equal(result.independentBehaviorVerified, false);
  }
  assert.deepEqual((await list({ category: 'case' })).entries.map(entry => entry.id), [
    'common.case.dialog-focus', 'sharepoint.case.duplicate-announcement'
  ]);
  const v9 = await list({ category: 'pattern', packageId: 'fluent', appliesTo: 'fluent-v9' });
  assert.deepEqual(v9.entries.map(entry => entry.id), ['fluent.v9.component-contract']);
  assert.deepEqual(v9.facets.packages, [{ value: 'fluent', count: 1 }]);
  assert.deepEqual(v9.facets.appliesTo, [{ value: 'fluent-v9', count: 1 }]);
  assert(v9.entries[0].matchedSources.every(source => source.status === 'historical'));
  const apg = await list({ sourceId: 'apg' });
  assert(apg.entries.some(entry => entry.id === 'common.topic.foundations'));
  assert(!(await list({ category: 'pattern', sourceId: 'apg' })).entries.some(entry => entry.id === 'common.topic.foundations'),
    'APG citation alone is not a curated implementation pattern');
  const wcag = await list({ standard: 'wcag' });
  assert(wcag.entries.length > 0);
  for (const entry of wcag.entries) {
    assert.deepEqual(entry.matchedSources.map(source => source.id), ['wcag']);
    assert.equal(entry.matchedSources[0].authority, 'normative-standard');
    assert.equal(entry.matchedSources[0].status, 'review-pending');
    assert.equal(entry.status, 'draft');
  }
  const sourceFacet = wcag.facets.sources.find(source => source.packageId === 'common' && source.id === 'wcag');
  assert.equal(sourceFacet.count, wcag.totalMatches);
  assert.equal(sourceFacet.revision, null);
  assert((await list({ standard: 'aria' })).entries.some(entry => entry.id === 'common.topic.component-accessibility'));
  assert((await list({ category: 'pattern', standard: 'wcag' })).entries.some(entry => entry.id === 'common.topic.dynamic-content'));
  for (const args of [
    { standard: 'apg' }, { standard: 'mas' }, { standard: 'wcag', sourceId: 'apg' },
    { category: 'standard', sourceId: 'apg' }, { standard: 'wcag', packageId: 'fluent' },
    { packageId: 'unknown' }, { sourceId: 'constructor' }, { appliesTo: 'fluent-v10' },
    { packageId: 'common', appliesTo: 'fluent-v9' }
  ]) {
    const empty = await list(args);
    assert.deepEqual(empty.entries, [], JSON.stringify(args));
    assert.equal(empty.totalMatches, 0);
    assert(empty.facets.categories.every(facet => facet.count === 0));
  }
});

test('filtered search uses tags plus lexical terms and full read preserves classification and citations', async () => {
  const handler = createKnowledgeHandler(root, serverName, { env: { A11Y_ASSIST_KB_ROOT: kbRoot } });
  for (const [args, id] of [
    [{ query: 'dialog focus', category: 'case', packageId: 'common' }, 'common.case.dialog-focus'],
    [{ query: 'MessageBar', category: 'pattern', appliesTo: 'fluent-v9' }, 'fluent.v9.component-contract'],
    [{ query: 'duplicate announcement', category: 'fix', packageId: 'sharepoint' }, 'sharepoint.case.duplicate-announcement'],
    [{ query: 'focus', category: 'example', packageId: 'common' }, 'common.case.dialog-focus'],
    [{ query: 'component', standard: 'aria' }, 'common.topic.component-accessibility']
  ]) {
    const result = content(await handler(call(serverName, 'search', args)));
    assert(result.matches.some(entry => entry.id === id), JSON.stringify(args));
    assert(result.matches.every(entry => entry.excerpt.length <= 580));
    const { query, ...filters } = args;
    assert.deepEqual(result.filters, filters);
    assert.equal(result.fullEntryReadRequired, true);
    const read = content(await handler(call(serverName, 'read', { id })));
    const entry = currentPackages.flatMap(pkg => pkg.entries).find(entry => entry.id === id);
    assert.deepEqual(read.entry.discoveryTags, entry.discoveryTags);
    assert.equal(read.citation, `kb:${id}@${result.packages[id.split('.')[0]]}`);
  }
  const none = content(await handler(call(serverName, 'search', { query: 'dialog nonexistent-token', category: 'case' })));
  assert.deepEqual(none.matches, []);
  assert.equal(none.totalMatches, 0);
});

test('isolated cold and offline cached consumers retain discovery tags and source filtering', async () => {
  await fixture(async ({ reference, artifact, run }) => {
    const [cold] = run([call(serverName, 'list', { category: 'pattern', packageId: 'fluent' })],
      { TEST_KB_URL: reference.distribution.url, TEST_KB_ARTIFACT: artifact });
    const result = content(cold.result);
    assert.equal(result.origin, 'download');
    assert.deepEqual(result.entries.map(entry => entry.id), ['fluent.v8.component-contract', 'fluent.v9.component-contract']);
    const [warm] = run([call(serverName, 'search', { query: 'focus', standard: 'wcag' })]);
    const offline = content(warm.result);
    assert.equal(offline.origin, 'cache');
    assert(offline.matches.length > 0);
    assert(offline.matches.every(entry => entry.matchedSources.every(source => source.id === 'wcag')));
  });
});

test('new discovery handler reads retained untagged snapshots without inventing pattern labels', async () => {
  await fixture(async ({ server, reference, env }) => {
    const hash = '9a244b4320ea9f352195a8cebd3c783667ea7ccac07fb53a0ebecff33c3a0024';
    const path = join(repository, 'knowledge-distribution', hash + '.json');
    const artifact = await load(path);
    const index = await load(join(repository, 'knowledge-distribution/index.json'));
    const previous = { ...reference, packages: artifact.manifest.packages, manifestSha256: hash,
      distribution: { url: `https://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/${hash}.json`, sha256: index.artifacts[hash] } };
    await writeFile(join(server, 'references/knowledge.json'), JSON.stringify(previous));
    const handler = createKnowledgeHandler(server, serverName, { env, fetchImpl: async () => new Response(await readFile(path)) });
    const listed = content(await handler(call(serverName, 'list')));
    assert.equal(listed.entries.length, 35);
    assert(listed.entries.every(entry => entry.discoveryTags === undefined));
    for (const category of ['pattern', 'fix', 'example']) {
      assert.deepEqual(content(await handler(call(serverName, 'list', { category }))).entries, []);
    }
    assert.equal(content(await handler(call(serverName, 'list', { category: 'case' }))).entries.length, 2);
    assert(content(await handler(call(serverName, 'list', { standard: 'aria' }))).entries.length > 0);
  });
});

test('knowledge read exposes only declared selected IDs and reports cold offline failure honestly', async () => {
  const name = serverName;
  await fixture(async ({ server, env, run }) => {
    const [reply] = run([call(name, 'read', { id: 'common.topic.foundations' })]);
    assert.equal(reply.result.isError, true);
    assert.match(reply.result.content[0].text, /Shared knowledge unavailable/);
    const handler = createKnowledgeHandler(server, name, { env: { ...env, A11Y_ASSIST_KB_ROOT: kbRoot } });
    for (const id of ['../../LICENSE', 'file:///C:/private', 'https://example.invalid', 'sharepoint.missing-entry', 'constructor']) {
      const result = await handler(call(name, 'read', { id }));
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, /ID is not exported/);
    }
    const valid = content(await handler(call(name, 'read', { id: 'common.topic.foundations' })));
    assert.equal(valid.origin, 'configured');
    const project = content(await handler(call(name, 'read', { id: 'sharepoint.profile.support-policy' })));
    assert.equal(project.origin, 'configured');
    assert.equal(project.entry.id, 'sharepoint.profile.support-policy');
  });
});

test('synthetic Common-only MCP consumer excludes Fluent and SharePoint IDs without changing shipped selection', async () => {
  await fixture(async ({ dir, env }) => {
    const { consumer } = await createCommonReferenceFixture(dir, kbRoot);
    const name = 'synthetic-common-consumer';
    const handler = createKnowledgeHandler(consumer, name, {
      env: { ...env, A11Y_ASSIST_KB_ROOT: kbRoot },
      fetchImpl: () => { throw new Error('Configured Common fixture must not fetch'); }
    });
    const listed = content(await handler(call(name, 'list')));
    assert.deepEqual(Object.keys(listed.packages), ['common']);
    assert.deepEqual(Object.keys(listed.sources), ['common']);
    assertCurrentEntries(listed.entries, ['common']);
    assert(listed.entries.every(entry => entry.id.startsWith('common.')));
    const patterns = content(await handler(call(name, 'list', { category: 'pattern' })));
    assert(patterns.entries.length > 0 && patterns.entries.every(entry => entry.packageId === 'common'));
    assert.deepEqual(content(await handler(call(name, 'list', { category: 'pattern', packageId: 'fluent' }))).entries, []);
    for (const id of ['fluent.overview', 'sharepoint.profile.support-policy']) {
      const result = await handler(call(name, 'read', { id }));
      assert.equal(result.isError, true);
      assert.match(result.content[0].text, /ID is not exported/);
      const searched = content(await handler(call(name, 'search', { query: id })));
      assert.deepEqual(searched.matches, []);
      assert.equal(searched.totalMatches, 0);
    }
    assert.equal(content(await handler(call(name, 'read', { id: 'common.topic.foundations' }))).origin, 'configured');
  });
});

test('MCP revalidates cache on each tool call and never turns corruption into success', async () => {
  const name = serverName;
  await fixture(async ({ server, env, artifact, cache, reference }) => {
    let downloads = 0;
    const handler = createKnowledgeHandler(server, name, { env, fetchImpl: async () => {
      downloads++; return new Response(await readFile(artifact));
    } });
    content(await handler(call(name, 'list')));
    const path = join(cache, reference.manifestSha256 + '.json');
    await writeFile(path, 'tampered');
    const result = await handler(call(name, 'read', { id: 'common.topic.foundations' }));
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /cache was not overwritten/);
    assert.equal(downloads, 1);
    assert.equal(await readFile(path, 'utf8'), 'tampered');
  });
});