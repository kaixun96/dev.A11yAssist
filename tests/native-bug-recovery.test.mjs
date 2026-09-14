import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, truncate } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { hash, fileHash } from '../src/runtime/core.mjs';
import { createAdoBug } from '../src/native/ado-bugs.mjs';
import { bugDestination, inspectAdoBugDestination } from '../src/native/ado-bug-client.mjs';

const MiB = 1024 * 1024;
async function fixture(body, sizes = [2 * MiB + 31]) {
  const root = await mkdtemp(join(tmpdir(), 'a11y-native-bug-'));
  const attachments = [];
  for (const [index, size] of sizes.entries()) {
    const bytes = Buffer.alloc(size, index + 65), path = join(root, `unit-${index}.bin`);
    await writeFile(path, bytes);
    attachments.push({ name: `unit-${index}.bin`, localPath: path, sha256: hash(bytes),
      kind: 'diagnostic', description: 'Synthetic bytes, not media evidence' });
  }
  const configuration = { organization: 'https://example.invalid', project: 'unit',
    authorization: ['Bearer', 'offline-fixture'].join(' '),
    attachmentUpload: { mode: 'chunked', chunkSizeBytes: MiB } };
  const draft = { title: "Unit's finding", taskId: 'unit-round', issueId: 'unit-issue',
    planHash: 'a'.repeat(64), environment: { os: 'unit', browser: 'unit' },
    cause: { status: 'unknown', explanation: 'No real page or cause was examined' },
    impact: 'Synthetic fixture', categories: [], scenarios: [{ rowId: 'unit-row', target: 'unit',
      state: 'unit', preconditions: ['Unit fixture only'], steps: ['Inspect synthetic data'],
      expected: 'Unit expectation', actual: 'Unit result', repeatability: 'Unit only' }], attachments,
    validation: { integrity: 'verified', basis: 'unit-only' } };
  const server = fakeServer();
  let saved;
  const options = { fetchImpl: server.fetch, checkpoint: value => { saved = structuredClone(value); } };
  try { await body({ configuration, draft, server, options, progress: () => saved, root }); }
  finally { await rm(root, { recursive: true, force: true }); }
}

function fakeServer() {
  const server = { calls: [], uploads: new Map(), bugs: new Map(), fault: null,
    schema: ['System.Title', 'System.Description', 'System.Tags', 'Microsoft.VSTS.TCM.ReproSteps', 'System.AreaPath'] };
  server.fetch = async (target, init = {}) => {
    const method = init.method ?? 'GET';
    server.calls.push({ target, method });
    assert.equal(init.redirect, 'error');
    const url = new URL(target);
    if (url.pathname.endsWith('/fields')) return Response.json({
      value: server.schema.map(referenceName => ({ referenceName })) });
    if (url.pathname.endsWith('/wiql')) {
      const query = JSON.parse(init.body).query;
      const marker = query.match(/A11yAssist-[a-f0-9-]{36}/)?.[0];
      const found = [...server.bugs.entries()].filter(([, bug]) =>
        marker ? bug.fields['System.Tags'].includes(marker) : query.includes(
          "'" + bug.fields['System.Title'].replaceAll("'", "''") + "'"));
      return Response.json({ workItems: found.slice(0, Number(url.searchParams.get('$top'))).map(([id]) => ({ id })) });
    }
    if (url.pathname.endsWith('/attachments')) {
      const path = `${url.origin}/unit/_apis/wit/attachments/${server.uploads.size + 1}`;
      server.uploads.set(path, Buffer.from(init.body));
      if (server.fault) await server.fault('upload', path);
      return Response.json({ url: path });
    }
    if (url.pathname.includes('/attachments/')) {
      const key = url.origin + url.pathname;
      assert(server.uploads.has(key), 'Only a created attachment may be addressed');
      if (method === 'PUT') {
        const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(init.headers['Content-Range']);
        assert(match);
        const bytes = Buffer.from(init.body);
        assert.equal(bytes.length, Number(match[2]) - Number(match[1]) + 1);
        assert.equal(init.headers['Content-Length'], String(bytes.length));
        assert.equal(Number(match[1]), server.uploads.get(key).length, 'A range was replayed or skipped');
        server.uploads.set(key, Buffer.concat([server.uploads.get(key), bytes]));
        if (server.fault) await server.fault('chunk', key);
        return Response.json({ url: key });
      }
      if (server.fault) await server.fault('read-upload', key);
      return new Response(server.uploads.get(key));
    }
    if (url.pathname.endsWith('/workitems/$Bug')) {
      const patch = JSON.parse(init.body), id = server.bugs.size + 1;
      const fields = { 'System.WorkItemType': 'Bug', ...Object.fromEntries(patch
        .filter(item => item.path.startsWith('/fields/')).map(item => [item.path.slice(8), item.value])) };
      server.bugs.set(id, { id, fields, relations: patch.filter(item => item.path === '/relations/-').map(item => item.value) });
      if (server.fault) await server.fault('create', id);
      return Response.json({ id });
    }
    const id = Number(url.pathname.split('/').at(-1));
    assert(server.bugs.has(id), 'Unexpected fake-server request: ' + target);
    return Response.json(server.bugs.get(id));
  };
  server.mutations = () => server.calls.filter(call => call.method === 'PUT' ||
    (call.method === 'POST' && !call.target.includes('/wiql?')));
  return server;
}

test('chunked WIT uploads exact ranges, configurable repro field and every approved byte', async () => {
  await fixture(async ({ configuration, draft, server, options }) => {
    configuration.descriptionField = 'Microsoft.VSTS.TCM.ReproSteps';
    draft.destination = bugDestination(configuration);
    const result = await createAdoBug(configuration, draft, options);
    assert.equal(result.bug.id, 1);
    assert.equal(server.calls.filter(call => call.method === 'PUT').length, 3);
    assert.equal(server.uploads.values().next().value.length, 2 * MiB + 31);
    assert.match(server.bugs.get(1).fields[configuration.descriptionField], /Steps to reproduce/);
    assert.equal(server.bugs.get(1).fields['System.Description'], undefined);
    assert.equal(result.mediaPlaybackVerified, false);
  });
});
test('lost create response is found by original correlation without another upload/create', async () => {
  await fixture(async ({ configuration, draft, server, options, progress }) => {
    server.fault = async event => { if (event === 'create') throw new Error('lost create response'); };
    await assert.rejects(createAdoBug(configuration, draft, options), /lost create/);
    assert.equal(progress().phase, 'create-intent');
    const count = server.mutations().length;
    server.fault = null;
    const result = await createAdoBug(configuration, draft, { ...options, progress: progress(), reconcile: true });
    assert.equal(result.bug.id, 1);
    assert.equal(server.mutations().length, count);
    assert.equal(server.bugs.size, 1);
  });
});
test('zero/ambiguous correlation results remain pending, not a new Bug attempt', async () => {
  for (const count of [0, 2]) await fixture(async ({ configuration, draft, server, options, progress }) => {
    server.fault = async event => { if (event === 'create') throw new Error('lost create response'); };
    await assert.rejects(createAdoBug(configuration, draft, options), /lost create/);
    const original = structuredClone(server.bugs.get(1));
    server.bugs.clear();
    for (let id = 1; id <= count; id++) server.bugs.set(id, { ...original, id });
    server.fault = null;
    const mutations = server.mutations().length;
    await assert.rejects(createAdoBug(configuration, draft, { ...options, progress: progress(), reconcile: true }), /correlation returned/);
    assert.equal(server.mutations().length, mutations);
  });
});
test('known completed upload can explicitly continue after failed readback without repeated POST/PUT', async () => {
  await fixture(async ({ configuration, draft, server, options, progress }) => {
    server.fault = async event => { if (event === 'read-upload') throw new Error('readback offline'); };
    await assert.rejects(createAdoBug(configuration, draft, options), /readback offline/);
    assert.equal(progress().phase, 'chunk-complete');
    const transfers = server.mutations().length;
    server.fault = null;
    await assert.rejects(createAdoBug(configuration, draft, { ...options, progress: progress(), reconcile: true }), /explicit resume/);
    await createAdoBug(configuration, draft, { ...options, progress: progress(), resume: true });
    assert.equal(server.mutations().length, transfers + 1);
    assert.equal(server.bugs.size, 1);
  });
});
test('partial unknown chunk cannot be replayed; lost final chunk can be proven by full remote bytes', async () => {
  for (const final of [false, true]) await fixture(async ({ configuration, draft, server, options, progress }) => {
    server.fault = async (event, key) => {
      if (event === 'chunk' && (!final || server.uploads.get(key).length === 2 * MiB + 31)) throw new Error('lost chunk response');
    };
    await assert.rejects(createAdoBug(configuration, draft, options), /lost chunk/);
    assert.equal(progress().phase, 'chunk-intent');
    const transfers = server.mutations().length;
    server.fault = null;
    if (!final) {
      await assert.rejects(createAdoBug(configuration, draft, { ...options, progress: progress(), resume: true }), /hash\/size mismatch/);
      assert.equal(server.mutations().length, transfers);
    } else {
      await createAdoBug(configuration, draft, { ...options, progress: progress(), resume: true });
      assert.equal(server.mutations().length, transfers + 1);
    }
  });
});
test('an earlier verified attachment cannot erase a later unknown chunk checkpoint', async () => {
  await fixture(async ({ configuration, draft, server, options, progress }) => {
    server.fault = async (event, key) => {
      if (event === 'chunk' && key.endsWith('/2')) throw new Error('lost second-file chunk');
    };
    await assert.rejects(createAdoBug(configuration, draft, options), /lost second-file/);
    const count = server.mutations().length;
    server.fault = null;
    await assert.rejects(createAdoBug(configuration, draft, { ...options, progress: progress(), resume: true }), /hash\/size mismatch/);
    assert.equal(server.mutations().length, count);
  }, [MiB, 2 * MiB]);
});
test('missing process field, duplicate candidates and approved size limits stop before uploads', async () => {
  await fixture(async ({ configuration, draft, server, options }) => {
    configuration.descriptionField = 'Custom.Missing';
    await assert.rejects(createAdoBug(configuration, draft, options), /configuration needs correction/);
    assert.equal(server.mutations().length, 0);
    configuration.descriptionField = 'System.Description';
    server.bugs.set(17, { id: 17, fields: { 'System.WorkItemType': 'Bug', 'System.Title': draft.title } });
    const inspection = await inspectAdoBugDestination(configuration, draft.title, options);
    assert.equal(inspection.candidates[0].id, 17);
    assert.equal(inspection.search.semanticDuplicatesExcluded, false);
    await assert.rejects(createAdoBug(configuration, draft, options), /duplicate candidates/);
    assert.equal(server.mutations().length, 0);
    configuration.attachmentUpload.maxFileBytes = 1;
    await assert.rejects(createAdoBug(configuration, draft, options), /upload limits/);
    assert.equal(server.mutations().length, 0);
  });
});
test('policy changes and changed approved bytes reject before any remote request', async () => {
  await fixture(async ({ configuration, draft, server, options, root }) => {
    draft.destination = bugDestination(configuration);
    configuration.bugFields = { 'System.AreaPath': 'unit\\other' };
    await assert.rejects(createAdoBug(configuration, draft, options), /changed after approval/);
    delete configuration.bugFields;
    await writeFile(join(root, 'unit-0.bin'), 'changed');
    await assert.rejects(createAdoBug(configuration, draft, options), /changed after draft approval/);
    assert.equal(server.calls.length, 0);
  });
});

test('unknown upload allocation cannot be resumed or replaced with a fresh upload', async () => {
  await fixture(async ({ configuration, draft, server, options, progress }) => {
    await assert.rejects(createAdoBug(configuration, draft, { ...options, resume: true }), /original checkpoint/);
    server.fault = async event => { if (event === 'upload') throw new Error('lost upload response'); };
    await assert.rejects(createAdoBug(configuration, draft, options), /lost upload/);
    assert.equal(progress().phase, 'upload-intent');
    const count = server.mutations().length;
    server.fault = null;
    await assert.rejects(createAdoBug(configuration, draft, { ...options, progress: progress(), resume: true }), /Upload response unknown/);
    assert.equal(server.mutations().length, count);
    assert.equal(server.bugs.size, 0);
  });
});
test('duplicate review must match current candidate identities before an explicitly distinct Bug is created', async () => {
  await fixture(async ({ configuration, draft, server, options }) => {
    server.bugs.set(17, { id: 17, fields: { 'System.WorkItemType': 'Bug', 'System.Title': draft.title } });
    await assert.rejects(createAdoBug(configuration, draft, { ...options,
      duplicateReview: { candidateIds: [18], reason: 'Stale unit candidate' } }), /duplicate candidates/);
    assert.equal(server.mutations().length, 0);
    const result = await createAdoBug(configuration, draft, { ...options,
      duplicateReview: { candidateIds: [17], reason: 'Unit-only reviewed distinct defect' } });
    assert.equal(result.bug.id, 2);
    assert.equal(server.bugs.size, 2);
  });
});

test('auto upload crosses the actual 128 MiB boundary without buffering the entire video', async () => {
  await fixture(async ({ configuration, draft, server, options }) => {
    const file = draft.attachments[0], size = 128 * MiB + 1;
    await truncate(file.localPath, size);
    file.sha256 = await fileHash(file.localPath);
    await assert.rejects(createAdoBug({ ...configuration, attachmentUpload: undefined }, draft, options), /upload limits/);
    assert.equal(server.calls.length, 0);
    configuration.attachmentUpload = { mode: 'auto', maxFileBytes: size, maxTotalBytes: size, chunkSizeBytes: 16 * MiB };
    let offset = 0, chunks = 0, transferred;
    const hash = createHash('sha256'), url = 'https://example.invalid/unit/_apis/wit/attachments/large';
    const fetchImpl = async (target, init) => {
      if (target.includes('/attachments?')) {
        assert.match(target, /uploadType=chunked/);
        assert.equal(init.body.length, 0);
        return Response.json({ url });
      }
      if (target.startsWith(url)) {
        if (init.method === 'PUT') {
          const bytes = Buffer.from(init.body);
          assert.equal(init.headers['Content-Range'], `bytes ${offset}-${offset + bytes.length - 1}/${size}`);
          assert(bytes.length <= 16 * MiB);
          offset += bytes.length;
          chunks++;
          hash.update(bytes);
          if (offset === size) transferred = hash.digest('hex');
          return Response.json({ url });
        }
        assert.equal(offset, size);
        assert.equal(transferred, file.sha256);
        return new Response(Readable.toWeb(createReadStream(file.localPath)));
      }
      return server.fetch(target, init);
    };
    const result = await createAdoBug(configuration, draft, { ...options, fetchImpl });
    assert.equal(result.bug.id, 1);
    assert.equal(chunks, 9);
  }, [1]);
});
