import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readAdoWorkItem } from '../native/ado-intake.mjs';
import { attachPrEvidence } from '../native/ado-attachments.mjs';
import { readConfig, hash } from '../runtime/core.mjs';
import { executeOperation, reconcileOperation, operationStatus } from '../runtime/operations.mjs';

const configuration = {
  organization: 'https://example.invalid/organization', project: 'project', repositoryId: 'repository',
  authorization: 'Bearer synthetic-test-only'
};
const head = 'a'.repeat(40);
const json = (body, status = 200) => new Response(JSON.stringify(body), { status });
async function fixture(body) {
  const directory = await mkdtemp(join(tmpdir(), 'a11y-native-'));
  try {
    const path = join(directory, 'before.png');
    await writeFile(path, 'synthetic fixture, not evidence');
    await body(directory, { name: 'before.png', localPath: path, sha256: hash(await readFile(path)) });
  } finally { await rm(directory, { recursive: true }); }
}
function service(overrides = {}) {
  const pr = { pullRequestId: 42, isDraft: true, status: 'active',
    lastMergeSourceCommit: { commitId: head }, description: 'Human-authored content', ...overrides };
  const calls = [];
  const media = new Map();
  const fetchImpl = async (url, init) => {
    assert.equal(init.redirect, 'error');
    assert.equal(init.headers.Authorization, configuration.authorization);
    const method = init.method ?? 'GET';
    calls.push({ url, method, body: init.body });
    if (method === 'GET' && media.has(url)) return new Response(media.get(url));
    if (method === 'GET') return json(pr);
    if (method === 'POST') {
      const mediaUrl = url.split('?')[0];
      media.set(mediaUrl, init.body);
      return json({ url: mediaUrl });
    }
    assert.equal(method, 'PATCH');
    const body = JSON.parse(init.body);
    assert.equal(body.isDraft, true);
    Object.assign(pr, body);
    return json(pr);
  };
  return { pr, calls, fetchImpl };
}

test('native intake fetches all comments and indexes attachments without claiming interpretation', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    assert.equal(init.redirect, 'error');
    calls.push(url);
    if (!url.includes('/comments?')) return json({ id: 42, rev: 3, fields: { title: 'Synthetic' },
      relations: [{ rel: 'AttachedFile', url: 'https://example.invalid/attachment' }] });
    return url.includes('continuationToken=') ? json({ comments: [{ id: 2, isDeleted: true }] }) :
      json({ comments: [{ id: 1, text: 'Synthetic discussion' }], continuationToken: 'next /+' });
  };
  const result = await readAdoWorkItem(configuration, { itemId: 42 }, { fetchImpl });
  assert.equal(result.comments.length, 2);
  assert.equal(result.attachments.length, 1);
  assert.equal(result.commentsInterpreted, false);
  assert.equal(result.attachmentBytesDownloaded, false);
  assert.equal(result.acceptanceDefined, false);
  assert(calls[2].includes('continuationToken=next%20%2F%2B'));
});

test('native intake rejects incomplete pages, mismatched IDs, loops and service failures', async () => {
  for (const response of [{}, { comments: [], continuationToken: 'same' }]) {
    await assert.rejects(readAdoWorkItem(configuration, { itemId: 42 }, {
      fetchImpl: async url => url.includes('/comments?') ? json(response) : json({ id: 42, rev: 1, fields: {} })
    }), /incomplete/);
  }
  await assert.rejects(readAdoWorkItem(configuration, { itemId: 42 }, {
    fetchImpl: async () => json({ id: 99, rev: 1, fields: {} })
  }), /identity/);
  await assert.rejects(readAdoWorkItem(configuration, { itemId: 42 }, {
    fetchImpl: async () => json({ privateDiagnostic: 'not-for-errors' }, 403)
  }), error => error.message.includes('403') && !error.message.includes('not-for-errors'));
});

test('native publisher uploads actual bytes, preserves text, uses only description and confirms live Draft/HEAD', async () => {
  await fixture(async (_, attachment) => {
    const server = service();
    const result = await attachPrEvidence(configuration, {
      prId: 42, attachments: [attachment], expectedHead: head, commentMarkdown: '![Before]({{before.png}})'
    }, server);
    assert.deepEqual(server.calls.map(call => call.method), ['GET', 'POST', 'GET', 'GET', 'PATCH', 'GET']);
    assert.equal(Buffer.from(server.calls[1].body).toString(), 'synthetic fixture, not evidence');
    assert(server.pr.description.includes('Human-authored content'));
    assert(server.pr.description.includes('/attachments/before.png'));
    assert.equal(result.commentPosted, false);
    assert.equal(result.descriptionUpdated, true);
    assert(!server.calls.some(call => call.url.includes('/threads')));
  });
});

test('native publication stops before writes for foreign/non-Draft/inactive PR or stale HEAD', async () => {
  for (const change of [{ pullRequestId: 7 }, { isDraft: false }, { status: 'completed' },
    { lastMergeSourceCommit: { commitId: 'b'.repeat(40) } }]) {
    const server = service(change);
    await assert.rejects(attachPrEvidence(configuration, { prId: 42, attachments: [], expectedHead: head }, server),
      /Draft|HEAD/);
    assert(server.calls.every(call => call.method === 'GET'));
  }
});

test('native publication rejects duplicate names, changed bytes and untrusted attachment URLs', async () => {
  await fixture(async (_, attachment) => {
    const server = service();
    await assert.rejects(attachPrEvidence(configuration, { prId: 42, attachments: [attachment, attachment] }, server),
      /Duplicate/);
    await assert.rejects(attachPrEvidence(configuration, {
      prId: 42, attachments: [{ ...attachment, sha256: 'f'.repeat(64) }]
    }, server), /bytes/);
    assert(!server.calls.some(call => call.method === 'POST'));
    await assert.rejects(attachPrEvidence(configuration, { prId: 42, attachments: [attachment] }, {
      fetchImpl: async (url, init) => init.method === 'POST' ? json({ url: 'https://foreign.invalid/media' }) :
        server.fetchImpl(url, init)
    }), /unexpected attachment URL/);
  });
});

test('publication does not retry ambiguous uploads and refuses changed HEAD after upload', async () => {
  await fixture(async (_, attachment) => {
    let writes = 0;
    const server = service();
    await assert.rejects(attachPrEvidence(configuration, { prId: 42, attachments: [attachment] }, {
      fetchImpl: async (url, init) => {
        if (init.method === 'POST') { writes++; throw new Error('synthetic unknown outcome'); }
        return server.fetchImpl(url, init);
      }
    }), /unknown outcome/);
    assert.equal(writes, 1);
    await assert.rejects(attachPrEvidence(configuration, { prId: 42, attachments: [attachment] }, {
      fetchImpl: async (url, init) => {
        const response = await server.fetchImpl(url, init);
        if (init.method === 'POST') server.pr.lastMergeSourceCommit.commitId = 'b'.repeat(40);
        return response;
      }
    }), /HEAD changed/);
    assert(!server.calls.some(call => call.method === 'PATCH'));
  });
});

test('native operations use the normal independent journal, cached result and no full-workflow prerequisites', async () => {
  await fixture(async (directory, attachment) => {
    const configPath = join(directory, 'config.json');
    await writeFile(configPath, JSON.stringify({
      schemaVersion: 1, owner: 'synthetic-owner', stateRoot: directory,
      providers: { publish: { kind: 'ado', ...configuration, authorization: undefined,
        authorizationEnvironmentVariable: 'A11Y_TEST_ONLY_AUTH' } }
    }));
    const config = await readConfig(configPath, { fullWorkflow: false });
    const priorFetch = globalThis.fetch;
    const priorAuth = process.env.A11Y_TEST_ONLY_AUTH;
    const server = service();
    process.env.A11Y_TEST_ONLY_AUTH = configuration.authorization;
    globalThis.fetch = server.fetchImpl;
    try {
      const args = [config, 'a11y-publish', 'publish-42', 'attach-evidence', { head },
        { prId: 42, attachments: [attachment] }];
      const first = await executeOperation(...args);
      const count = server.calls.length;
      assert.equal(first.status, 'finished');
      assert.deepEqual(await executeOperation(...args), first);
      assert.equal(server.calls.length, count);
      const result = JSON.parse(await readFile(join(directory, 'operations', 'publish-42', 'native-result.json'), 'utf8'));
      assert.equal(result.liveMediaVerified, false);
      assert.equal(result.independentBehaviorVerified, false);
      const statePath = join(directory, 'operations', 'publish-42', 'operation.json');
      const state = JSON.parse(await readFile(statePath, 'utf8'));
      state.status = 'pending';
      delete state.receipt;
      await writeFile(statePath, JSON.stringify(state));
      assert.equal((await reconcileOperation(config, 'a11y-publish', 'publish-42')).status, 'finished');
      assert.equal(server.calls.length, count);
      const persisted = await readFile(statePath, 'utf8');
      assert(!persisted.includes(configuration.authorization));
    } finally {
      globalThis.fetch = priorFetch;
      if (priorAuth === undefined) delete process.env.A11Y_TEST_ONLY_AUTH;
      else process.env.A11Y_TEST_ONLY_AUTH = priorAuth;
    }
  });
});

test('an interrupted native write remains pending and reconcile cannot replay it', async () => {
  await fixture(async (directory, attachment) => {
    const config = { schemaVersion: 1, owner: 'synthetic-owner', stateRoot: directory,
      providers: { publish: { kind: 'ado', ...configuration, authorization: undefined,
        authorizationEnvironmentVariable: 'A11Y_TEST_ONLY_AUTH' } } };
    const priorFetch = globalThis.fetch;
    const priorAuth = process.env.A11Y_TEST_ONLY_AUTH;
    const server = service();
    let writes = 0;
    process.env.A11Y_TEST_ONLY_AUTH = configuration.authorization;
    globalThis.fetch = async (url, init) => {
      if (init.method === 'POST') { writes++; throw new Error('unknown write outcome'); }
      return server.fetchImpl(url, init);
    };
    try {
      const args = [config, 'a11y-publish', 'interrupted', 'attach-evidence', { head },
        { prId: 42, attachments: [attachment] }];
      await assert.rejects(executeOperation(...args), /unknown write/);
      assert.equal((await operationStatus(config, 'a11y-publish', 'interrupted')).status, 'pending');
      await assert.rejects(executeOperation(...args), /pending/);
      await assert.rejects(reconcileOperation(config, 'a11y-publish', 'interrupted'), /No native result/);
      assert.equal(writes, 1);
    } finally {
      globalThis.fetch = priorFetch;
      if (priorAuth === undefined) delete process.env.A11Y_TEST_ONLY_AUTH;
      else process.env.A11Y_TEST_ONLY_AUTH = priorAuth;
    }
  });
});
