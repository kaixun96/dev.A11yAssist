import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createKnowledgeHandler } from '../src/runtime/knowledge-mcp.mjs';
import { createCommonReferenceFixture } from './helpers/common-reference.mjs';

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
    assert.equal(snapshot.entries.length, 32);
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

test('standalone server cold-bootstraps all 32 entries then reads Common and ODSP offline across processes', async () => {
  const name = serverName;
  await fixture(async ({ dir, reference, artifact, run }) => {
    // Exercise normal Windows cache defaults, not an A11y KB root/cache setting.
    const environment = process.platform === 'win32'
      ? { A11Y_ASSIST_KB_CACHE_ROOT: undefined, LOCALAPPDATA: join(dir, 'localappdata') } : {};
    const [first] = run([call(name, 'list')], { ...environment, TEST_KB_URL: reference.distribution.url, TEST_KB_ARTIFACT: artifact });
    const listed = content(first.result);
    assert.equal(listed.origin, 'download');
    assert.equal(listed.entries.length, 32);
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
    assert.deepEqual(read.sources, []); // Authored analysis has no declared external authority.
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
    assert.deepEqual(odsp.sources.map(source => source.id), ['sharepoint-utilities']);
    assert(odsp.sources.every(source => source.status === 'connection-pending' && source.locator === null && source.revision === null));
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
      rpc('tools/call', { name: prefix(name) + 'execute', arguments: {} }),
      ...['doctor', 'invoke', 'execute', 'status', 'reconcile', 'operation_status', 'operation_reconcile']
        .map(action => rpc('tools/call', { name: 'a11y_kb_' + action, arguments: {} })),
      call('a11y-knowledge', 'list')
    ]) assert.equal((await handler(request)).isError, true);
    assert.equal(downloads, 0);
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
    assert.equal(listed.entries.length, 20);
    assert(listed.entries.every(entry => entry.id.startsWith('common.')));
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