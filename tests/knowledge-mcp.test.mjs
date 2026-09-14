import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createKnowledgeHandler } from '../src/runtime/knowledge-mcp.mjs';
import { createCommonReferenceFixture } from './helpers/common-reference.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const preload = pathToFileURL(join(root, 'tests/fixtures/knowledge-fetch.mjs')).href;
const load = async path => JSON.parse(await readFile(path, 'utf8'));
const names = (await load(join(root, '.github/plugin/marketplace.json'))).plugins.map(plugin => plugin.name);
const prefix = name => name.replaceAll('-', '_') + '_knowledge_';
const rpc = (method, params, id = 1) => ({ jsonrpc: '2.0', id, method, ...(params ? { params } : {}) });
const call = (name, action, args = {}) => rpc('tools/call', { name: prefix(name) + action, arguments: args });
const content = result => { assert(!result.isError, JSON.stringify(result)); return JSON.parse(result.content[0].text); };

async function fixture(name, fn) {
  const dir = await mkdtemp(join(tmpdir(), 'kb-mcp-installed-'));
  try {
    const plugin = join(dir, name);
    await cp(join(root, 'plugins', name), plugin, { recursive: true });
    const manifest = await load(join(plugin, 'plugin.json'));
    const launch = manifest.mcpServers[prefix(name).slice(0, -1)];
    const reference = await load(join(plugin, 'references/knowledge.json'));
    const artifact = join(root, 'knowledge-distribution', reference.manifestSha256 + '.json');
    const cache = join(dir, 'cache');
    const env = { ...process.env, A11Y_ASSIST_KB_CACHE_ROOT: cache };
    for (const key of ['A11Y_ASSIST_KB_ROOT', 'A11Y_ASSIST_CONFIG', 'NODE_OPTIONS', 'TEST_KB_URL', 'TEST_KB_ARTIFACT']) delete env[key];
    const run = (requests, overrides = {}) => {
      const args = launch.args.map(arg => arg.replaceAll('${PLUGIN_ROOT}', plugin));
      const child = spawnSync(process.execPath, ['--import', preload, ...args], {
        cwd: dir, env: { ...env, ...overrides }, encoding: 'utf8', timeout: 20000,
        input: requests.map(request => JSON.stringify(request)).join('\n') + '\n'
      });
      assert.equal(child.status, 0, child.stderr);
      assert.equal(child.stderr, '');
      return child.stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
    };
    await fn({ dir, plugin, reference, artifact, cache, env, run });
  } finally { await rm(dir, { recursive: true }); }
}

test('all ten isolated installed plugins auto-register a lazy read-only knowledge server', async () => {
  assert.equal(names.length, 10);
  assert.equal(new Set(names).size, 10);
  assert.deepEqual(names.filter(name => name.startsWith('a11y-knowledge')), ['a11y-knowledge']);
  for (const name of names) await fixture(name, async ({ plugin, run, cache }) => {
    const manifest = await load(join(plugin, 'plugin.json'));
    const mcp = await load(join(plugin, '.mcp.json'));
    assert.deepEqual(manifest.mcpServers, mcp.mcpServers);
    if (['a11y-knowledge', 'a11y-bug-bash', 'a11y-setup'].includes(name)) {
      assert.deepEqual(Object.keys(mcp.mcpServers), [prefix(name).slice(0, -1)]);
      assert.deepEqual((await readdir(join(plugin, 'runtime'))).sort(), ['knowledge-mcp.mjs', 'knowledge.mjs']);
    } else {
      const operational = name.replaceAll('-', '_');
      assert.deepEqual(Object.keys(mcp.mcpServers).sort(), [operational, `${operational}_knowledge`]);
      assert.deepEqual(mcp.mcpServers[operational], { command: 'node', args: ['${PLUGIN_ROOT}/runtime/mcp.mjs', name] });
    }
    const launch = mcp.mcpServers[prefix(name).slice(0, -1)];
    assert.deepEqual(launch, { command: 'node', args: ['${PLUGIN_ROOT}/runtime/knowledge-mcp.mjs', name] });
    const replies = run([rpc('initialize'), { jsonrpc: '2.0', method: 'notifications/initialized' }, rpc('tools/list', undefined, 2)]);
    assert.equal(replies.length, 2);
    assert.equal(replies[0].result.serverInfo.version, manifest.version);
    assert.deepEqual(replies[1].result.tools.map(tool => tool.name), ['list', 'search', 'read'].map(action => prefix(name) + action));
    for (const tool of replies[1].result.tools) assert.equal(tool.inputSchema.additionalProperties, false);
    await assert.rejects(readdir(cache), { code: 'ENOENT' }); // No eager download or operational config needed.
    const [listed] = run([call(name, 'list')], { A11Y_ASSIST_KB_ROOT: join(root, 'accessibility-kb') });
    const snapshot = content(listed.result);
    assert.equal(snapshot.origin, 'configured');
    assert.equal(snapshot.entries.length, 32);
    assert.deepEqual(Object.keys(snapshot.packages), ['common', 'fluent', 'sharepoint']);
    await assert.rejects(readdir(cache), { code: 'ENOENT' });
  });
});

test('unified knowledge plugin cold-bootstraps all 32 entries then reads Common and ODSP offline across processes', async () => {
  const name = 'a11y-knowledge';
  await fixture(name, async ({ dir, reference, artifact, run }) => {
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
    assert(searched.matches.length > 0);
    const read = content(replies[1].result);
    assert.equal(read.origin, 'cache');
    assert.equal(read.content, (await readFile(join(root, 'accessibility-kb/packages/common/analysis/root-cause.md'), 'utf8')).replaceAll('\r\n', '\n'));
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
    const packageDescriptor = await load(join(root, 'accessibility-kb/packages/sharepoint/package.json'));
    const entry = packageDescriptor.entries.find(entry => entry.id === 'sharepoint.utilities.announcements-and-focus');
    assert.equal(odsp.origin, 'cache');
    assert.equal(odsp.entry.id, entry.id);
    assert.equal(odsp.entry.status, 'draft');
    assert.deepEqual(odsp.entry.sourceIds, entry.sourceIds);
    assert.deepEqual(odsp.entry.relations, entry.relations);
    assert.equal(odsp.content, (await readFile(join(root, 'accessibility-kb/packages/sharepoint', entry.path), 'utf8')).replaceAll('\r\n', '\n'));
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

for (const name of ['a11y-bug-bash', 'a11y-setup']) test(`isolated ${name} knowledge uses top-root pins and synthetic HTTPS without a peer plugin or execution authority`, async () => {
  await fixture(name, async ({ dir, plugin, reference, artifact, run }) => {
    assert.deepEqual(await readdir(dir), [name], 'No sibling knowledge plugin, repository or cache is installed');
    if (name === 'a11y-bug-bash') {
      const internal = await readFile(join(plugin, 'modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md'), 'utf8');
      for (const action of ['list', 'search', 'read']) assert(internal.includes(prefix(name) + action));
      assert(internal.includes('${PLUGIN_ROOT}/references/README.md'));
    }
    const [first] = run([call(name, 'list')], {
      TEST_KB_URL: reference.distribution.url, TEST_KB_ARTIFACT: artifact
    });
    const listed = content(first.result);
    assert.equal(listed.origin, 'download');
    assert.equal(listed.manifestSha256, reference.manifestSha256);
    assert.deepEqual(Object.keys(listed.packages), ['common', 'fluent', 'sharepoint']);
    assert.equal(listed.entries.length, 32);
    assert.equal(listed.contentApprovalVerified, false);
    assert.equal(listed.independentBehaviorVerified, false);
    // A second process has no synthetic HTTP artifact and must use the verified cache.
    const ids = ['common.topic.keyboard-focus', 'sharepoint.utilities.announcements-and-focus'];
    const replies = run(ids.map(id => call(name, 'read', { id })));
    const distribution = await load(artifact);
    for (const [index, id] of ids.entries()) {
      const entry = listed.entries.find(entry => entry.id === id);
      assert(entry);
      const read = content(replies[index].result);
      assert.equal(read.origin, 'cache');
      assert.equal(read.entry.id, id);
      assert.equal(read.content, distribution.files[entry.path]);
      assert.equal(read.sha256, distribution.manifest.hashes[entry.path]);
      assert.equal(read.citation, `kb:${id}@${reference.packages[id.split('.')[0]]}`);
      assert.equal(read.contentApprovalVerified, false);
      assert.equal(read.independentBehaviorVerified, false);
      assert(read.sources.length > 0);
      assert(read.sources.every(source => /pending$/.test(source.status)));
    }
    const rejected = run([
      call('a11y-knowledge', 'list'), call('a11y-knowledge-odsp', 'list'),
      ...['doctor', 'invoke', 'execute', 'status', 'reconcile', 'operation_status', 'operation_reconcile']
        .map(action => rpc('tools/call', { name: `${name.replaceAll('-', '_')}_${action}`, arguments: {} }))
    ]);
    for (const reply of rejected) {
      assert.equal(reply.result.isError, true);
      assert.match(reply.result.content[0].text, /Unknown knowledge tool/);
    }
  });
});

test('knowledge MCP rejects arbitrary arguments before loading or downloading', async () => {
  const name = 'a11y-knowledge';
  await fixture(name, async ({ plugin, env }) => {
    let downloads = 0;
    const handler = createKnowledgeHandler(plugin, name, { env, fetchImpl: () => { downloads++; throw new Error('Unexpected fetch'); } });
    for (const request of [
      call(name, 'list', { url: 'https://example.invalid' }),
      call(name, 'read', { id: 'common.topic.foundations', kbRoot: 'C:\\private' }),
      call(name, 'read', { path: '../../private' }),
      call(name, 'read', { id: null }), call(name, 'search', { query: ' ' }),
      call(name, 'search', { query: 'x'.repeat(257) }), call(name, 'list', []),
      rpc('tools/call', { name: prefix(name) + 'execute', arguments: {} }),
      ...['doctor', 'invoke', 'execute', 'status', 'reconcile', 'operation_status', 'operation_reconcile']
        .map(action => rpc('tools/call', { name: 'a11y_knowledge_' + action, arguments: {} })),
      call('a11y-knowledge-odsp', 'list') // No former-name tool alias.
    ]) assert.equal((await handler(request)).isError, true);
    assert.equal(downloads, 0);
  });
});

test('knowledge read exposes only declared selected IDs and reports cold offline failure honestly', async () => {
  const name = 'a11y-knowledge';
  await fixture(name, async ({ plugin, env, run }) => {
    const [reply] = run([call(name, 'read', { id: 'common.topic.foundations' })]);
    assert.equal(reply.result.isError, true);
    assert.match(reply.result.content[0].text, /Shared knowledge unavailable/);
    const handler = createKnowledgeHandler(plugin, name, { env: { ...env, A11Y_ASSIST_KB_ROOT: join(root, 'accessibility-kb') } });
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
  await fixture('a11y-knowledge', async ({ dir, env }) => {
    const { consumer } = await createCommonReferenceFixture(dir, join(root, 'accessibility-kb'));
    const name = 'synthetic-common-consumer';
    const handler = createKnowledgeHandler(consumer, name, {
      env: { ...env, A11Y_ASSIST_KB_ROOT: join(root, 'accessibility-kb') },
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
  const name = 'a11y-knowledge';
  await fixture(name, async ({ plugin, env, artifact, cache, reference }) => {
    let downloads = 0;
    const handler = createKnowledgeHandler(plugin, name, { env, fetchImpl: async () => {
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