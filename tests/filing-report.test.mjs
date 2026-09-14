import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fileHash, hash } from '../src/runtime/core.mjs';
import { createDiscovery, observeDiscovery, runDiscovery, reportDiscovery, deliverDiscovery,
  skipDiscoveryBug, discoveryStatus } from '../src/runtime/bug-bash.mjs';
import { prepareDiscoveryBug, fileDiscoveryBug } from '../src/runtime/file-bug.mjs';
import { createAdoBug } from '../src/native/ado-bugs.mjs';
import { loadCategoryPlugin } from '../src/runtime/category-plugin.mjs';
import { reconcileOperation, operationStatus } from '../src/runtime/operations.mjs';
import { plan, row } from './fixtures/discovery-plan.mjs';

async function fixture(body) {
  const root = await mkdtemp(join(tmpdir(), 'a11y-filing-'));
  const definition = { executable: process.execPath, executableSha256: await fileHash(process.execPath),
    args: [fileURLToPath(new URL('fixtures/provider.mjs', import.meta.url))], timeoutSeconds: 10 };
  const config = { schemaVersion: 1, owner: 'unit-owner', stateRoot: root,
    providers: { capture: definition, operations: definition,
      bugs: { ...definition, organization: 'https://example.invalid', project: 'unit' } },
    discoverySourceRoots: [], discoveryProfiles: {
      'fixture-browser': { capabilities: ['browser'], targets: ['fixture:dialog-form-v1'] } } };
  try { await body(config, root); } finally { await rm(root, { recursive: true, force: true }); }
}
async function finding(config) {
  await createDiscovery(config, { ...plan('filing-round', [row('observed', 'page', { status: 'finding' })]), filingRequested: true });
  const observed = await observeDiscovery(config, 'filing-round', ['observed']);
  const item = observed.rows[0];
  return { issueId: observed.issues[0].id, details: {
    environment: { os: 'Unit Windows', browser: 'Unit browser', assistiveTechnology: 'not used',
      build: 'unit', viewport: '800x600 at 100%', locale: 'en-US' },
    cause: { status: 'unknown', explanation: 'Implementation cause not established by this unit observation' },
    evidence: [{ operationId: item.attempts[0].operationId, path: item.observation.evidence[0],
      name: 'observation.json', kind: 'diagnostic', description: 'Unit observation only', reviewed: true }]
  } };
}
test('requested filing yields before reporting; approved creation appears in final report without replay', async () => {
  await fixture(async (config, root) => {
    const input = { taskId: 'filing-round', ...await finding(config) };
    const waiting = await runDiscovery(config, input.taskId);
    assert.match(waiting.nextAction, /a11y-file-bug/);
    assert.equal(waiting.report, null);
    await assert.rejects(reportDiscovery(config, input.taskId), /explicit skip reason/);
    const prepared = await prepareDiscoveryBug(config, input.taskId, input.issueId, input.details);
    assert.match(prepared.descriptionHtml, /Steps to reproduce/);
    assert.match(prepared.descriptionHtml, /Root cause \(unknown\)/);
    await assert.rejects(fileDiscoveryBug(config, { ...input, approval: {} }), /Explicit approval/);
    const approval = { approved: true, reference: 'Unit-only explicit approval', draftSha256: prepared.sha256,
      organization: 'https://example.invalid', project: 'unit' };
    const filed = await fileDiscoveryBug(config, { ...input, approval });
    assert.equal(filed.receipt.bug.id, 42);
    assert.deepEqual(await fileDiscoveryBug(config, { ...input, approval }), filed);
    const final = await runDiscovery(config, input.taskId);
    assert.equal(final.lifecycle, 'closed');
    const text = await readFile(join(root, 'bug-bash', input.taskId, final.report.relativePath), 'utf8');
    assert.match(text, /## Bug filing/);
    assert.match(text, /_workitems\/edit\/42/);
    assert.equal(final.report.generatedBy, 'a11y-report');
  });
});
test('skip is explicit and cannot hide an existing Bug; video needs real review metadata', async () => {
  await fixture(async config => {
    const { issueId, details } = await finding(config);
    await assert.rejects(skipDiscoveryBug(config, 'filing-round', issueId, ''), /precise reason/);
    const video = structuredClone(details);
    Object.assign(video.evidence[0], { name: 'clip.mp4', kind: 'video' });
    await assert.rejects(prepareDiscoveryBug(config, 'filing-round', issueId, video), /playback review/);
    await assert.rejects(prepareDiscoveryBug(config, 'filing-round', issueId,
      { ...details, cause: { status: 'confirmed', explanation: 'Invented cause' } }), /validated observation/);
    await skipDiscoveryBug(config, 'filing-round', issueId, 'Already tracked in the authorized project');
    const done = await runDiscovery(config, 'filing-round');
    assert.equal(done.lifecycle, 'closed');
  });
});
test('new filing invalidates an earlier report and a created Bug cannot be hidden by skipping', async () => {
  await fixture(async config => {
    const { issueId, details } = await finding(config);
    await skipDiscoveryBug(config, 'filing-round', issueId, 'Initial deferral');
    await runDiscovery(config, 'filing-round', 1);
    await reportDiscovery(config, 'filing-round');
    const draft = await prepareDiscoveryBug(config, 'filing-round', issueId, details);
    await fileDiscoveryBug(config, { taskId: 'filing-round', issueId, details,
      approval: { approved: true, reference: 'Unit approval', draftSha256: draft.sha256,
        organization: 'https://example.invalid', project: 'unit' } });
    await assert.rejects(skipDiscoveryBug(config, 'filing-round', issueId, 'Hide it'), /must be reconciled/);
    await assert.rejects(deliverDiscovery(config, 'filing-round'), /regenerate/);
    assert.equal((await runDiscovery(config, 'filing-round')).lifecycle, 'closed');
  });
});
test('pending filing blocks reporting and skips until its original operation is reconciled', async () => {
  await fixture(async config => {
    const input = { taskId: 'filing-round', ...await finding(config) };
    config.providers.bugs.args = [...config.providers.bugs.args, '--pending-filing'];
    const draft = await prepareDiscoveryBug(config, input.taskId, input.issueId, input.details);
    const approval = { approved: true, reference: 'Unit approval', draftSha256: draft.sha256,
      organization: 'https://example.invalid', project: 'unit' };
    const submitted = await fileDiscoveryBug(config, { ...input, approval });
    assert.equal(submitted.status, 'pending');
    await assert.rejects(fileDiscoveryBug(config, { ...input, approval }), /pending; reconcile/);
    await assert.rejects(reportDiscovery(config, input.taskId), /pending Bug creation/);
    await assert.rejects(skipDiscoveryBug(config, input.taskId, input.issueId, 'Skip pending effect'), /must be reconciled/);
    const reconciled = await reconcileOperation(config, 'a11y-file-bug', submitted.operationId);
    assert.equal(reconciled.requestId, submitted.requestId);
    assert.equal((await runDiscovery(config, input.taskId)).lifecycle, 'closed');
  });
});
test('category consumers require an explicit installed plugin and pin its actual procedures', async () => {
  await fixture(async (config, root) => {
    await assert.rejects(loadCategoryPlugin(config), /no bundled fallback/);
    const installed = join(root, 'categories');
    await cp(fileURLToPath(new URL('../plugins/a11y-test-categories', import.meta.url)), installed, { recursive: true });
    config.pluginRoots = { testCategories: installed };
    const plugin = await loadCategoryPlugin(config);
    assert.equal(plugin.apiVersion, 1);
    assert.equal(plugin.procedures.length, 10);
    const request = { ...plan('category-pin', []), mode: 'plan-only', maxRows: 100,
      inventory: { schemaVersion: 1, scope: 'unit', inventoryComplete: true, inventoryEvidence: 'unit only',
        targets: [{ id: 'one', target: 'unit target', scenario: 'unit scenario', state: 'unit state' }] } };
    await createDiscovery(config, request);
    const path = join(installed, 'procedures/keyboard-focus.md');
    await writeFile(path, (await readFile(path, 'utf8')) + '\nUnit changed procedure.\n');
    await assert.rejects(discoveryStatus(config, request.taskId), /Category plugin changed/);
  });
});
test('native WIT filing uploads bytes, attaches video and verifies remote fields/relations; reconciliation is read-only', async () => {
  await fixture(async (config, root) => {
    const input = await finding(config);
    const { draft } = await prepareDiscoveryBug(config, 'filing-round', input.issueId, input.details);
    const bytes = Buffer.from('UNIT MEDIA BYTES - not playable evidence');
    const path = join(root, 'clip.mp4');
    await writeFile(path, bytes);
    draft.attachments = [{ name: 'clip.mp4', localPath: path, sha256: hash(bytes),
      kind: 'video', description: '<unsafe> & unit media', timestamps: '00:01-00:02',
      transcript: 'Unit textual alternative', playbackReviewed: true }];
    const uploads = [], methods = [];
    let fields, relations, progress;
    const url = 'https://example.invalid/unit/_apis/wit/attachments/one';
    const fetchImpl = async (target, init) => {
      methods.push(init.method ?? 'GET');
      assert.equal(init.redirect, 'error');
      if (target.includes('/attachments?')) {
        assert.deepEqual(Buffer.from(init.body), bytes);
        uploads.push(target);
        return Response.json({ url });
      }
      if (target === url) return new Response(bytes);
      if (target.includes('/workitems/$Bug')) {
        const patch = JSON.parse(init.body);
        fields = Object.fromEntries(patch.filter(item => item.path.startsWith('/fields/'))
          .map(item => [item.path.slice(8), item.value]));
        relations = patch.filter(item => item.path === '/relations/-').map(item => item.value);
        return Response.json({ id: 42 });
      }
      return Response.json({ id: 42, fields: { ...fields, 'System.WorkItemType': 'Bug' }, relations });
    };
    const configuration = { organization: 'https://example.invalid', project: 'unit', authorization: 'Bearer unit-only' };
    const result = await createAdoBug(configuration, draft, { fetchImpl,
      checkpoint: value => { progress = structuredClone(value); } });
    assert.equal(result.bug.id, 42);
    assert.equal(uploads.length, 1);
    assert.match(fields['System.Description'], /&lt;unsafe&gt; &amp;/);
    assert.match(fields['System.Description'], /Unit textual alternative/);
    methods.length = 0;
    await createAdoBug(configuration, draft, { fetchImpl, progress, reconcile: true });
    assert(methods.every(method => method === 'GET'));
    methods.length = 0;
    await writeFile(path, 'changed bytes');
    await assert.rejects(createAdoBug(configuration, draft, { fetchImpl }), /changed after draft approval/);
    assert.equal(methods.length, 0);
  });
});
test('copied filing/report/setup MCP packages expose their own tools without a categories fallback', async () => {
  for (const [plugin, expected] of [
    ['a11y-file-bug', ['draft', 'submit', 'skip']],
    ['a11y-report', ['generate', 'deliver']],
    ['a11y-setup', ['resources', 'invoke']]
  ]) {
    const root = await mkdtemp(join(tmpdir(), 'a11y-plugin-mcp-'));
    try {
      await cp(fileURLToPath(new URL(`../plugins/${plugin}`, import.meta.url)), root, { recursive: true });
      const run = spawnSync(process.execPath, [join(root, 'runtime/mcp.mjs'), plugin], {
        input: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n', encoding: 'utf8'
      });
      assert.equal(run.status, 0, run.stderr);
      const tools = JSON.parse(run.stdout).result.tools.map(tool => tool.name);
      for (const suffix of expected) assert(tools.includes(`${plugin.replaceAll('-', '_')}_${suffix}`));
    } finally { await rm(root, { recursive: true, force: true }); }
  }
});
test('built-in ADO filing recovers failed readback using the same ID and no repeated POST', async t => {
  await fixture(async (config, root) => {
    const input = { taskId: 'filing-round', ...await finding(config) };
    config.providers.bugs = { kind: 'ado', organization: 'https://example.invalid', project: 'unit',
      authorizationEnvironmentVariable: 'A11Y_UNIT_BUG_AUTH' };
    const prepared = await prepareDiscoveryBug(config, input.taskId, input.issueId, input.details);
    const bytes = await readFile(prepared.draft.attachments[0].localPath);
    const url = 'https://example.invalid/unit/_apis/wit/attachments/original';
    const methods = [];
    let fields, relations, failReadback = true;
    t.mock.method(globalThis, 'fetch', async (target, init) => {
      methods.push(init.method ?? 'GET');
      if (target.includes('/attachments?')) return Response.json({ url });
      if (target === url) return new Response(bytes);
      if (target.includes('/workitems/$Bug')) {
        const patch = JSON.parse(init.body);
        fields = Object.fromEntries(patch.filter(item => item.path.startsWith('/fields/'))
          .map(item => [item.path.slice(8), item.value]));
        relations = patch.filter(item => item.path === '/relations/-').map(item => item.value);
        return Response.json({ id: 71 });
      }
      if (failReadback) return new Response('', { status: 503 });
      return Response.json({ id: 71, fields: { ...fields, 'System.WorkItemType': 'Bug' }, relations });
    });
    const previous = process.env.A11Y_UNIT_BUG_AUTH;
    process.env.A11Y_UNIT_BUG_AUTH = 'Bearer unit-test-not-a-credential';
    try {
      const approval = { approved: true, reference: 'Unit approval', draftSha256: prepared.sha256,
        organization: 'https://example.invalid', project: 'unit' };
      await assert.rejects(fileDiscoveryBug(config, { ...input, approval }), /HTTP 503/);
      const pending = await operationStatus(config, 'a11y-file-bug', prepared.draft.operationId);
      assert.equal(pending.status, 'pending');
      const ledger = JSON.parse(await readFile(join(root, 'operations', pending.operationId, 'native-bug-progress.json')));
      assert.equal(ledger.progress.bugId, 71);
      assert.equal(methods.filter(method => method === 'POST').length, 2);
      methods.length = 0;
      failReadback = false;
      const complete = await reconcileOperation(config, 'a11y-file-bug', pending.operationId);
      assert.equal(complete.receipt.bug.id, 71);
      assert.equal(complete.requestId, pending.requestId);
      assert(methods.every(method => method === 'GET'));
    } finally {
      if (previous === undefined) delete process.env.A11Y_UNIT_BUG_AUTH;
      else process.env.A11Y_UNIT_BUG_AUTH = previous;
    }
  });
});
