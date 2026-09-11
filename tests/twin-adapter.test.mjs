import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkTwinDestination, notifyTwin } from '../src/adapters/twin.mjs';

test('destination preflight is read-only and delivery rechecks the exact enabled scope', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'a11y-notifier-'));
  let enabled = true, lookups = 0, redirectLookup = false;
  const messages = [];
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    if (request.method === 'GET') {
      assert.equal(request.url, '/api/twin/conversations/synthetic-scope');
      lookups++;
      if (redirectLookup) {
        response.statusCode = 307;
        response.setHeader('Location', '/not-the-original-scope');
        response.end('{}');
        return;
      }
      response.end(JSON.stringify({ id: 'synthetic-scope', enabled }));
      return;
    }
    assert.equal(request.method, 'POST');
    assert.equal(request.url, '/api/twin/trigger');
    let body = '';
    for await (const chunk of request) body += chunk;
    messages.push(JSON.parse(body));
    response.end(JSON.stringify({ ok: true }));
  });
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const runtimePath = join(directory, 'runtime.json');
    await writeFile(runtimePath, JSON.stringify({ pid: process.pid, port: server.address().port }));
    const config = { mode: 'twin', twin: { conversationId: 'synthetic-scope', runtimePath } };
    assert.deepEqual(await checkTwinDestination(config), {
      ready: true, conversationId: 'synthetic-scope', workerProgressVerified: false
    });
    assert.equal(messages.length, 0);
    assert.equal(lookups, 1);
    for (const pid of [0, -1]) {
      await writeFile(runtimePath, JSON.stringify({ pid, port: server.address().port }));
      await assert.rejects(checkTwinDestination(config), /Invalid Twin runtime/);
    }
    await assert.rejects(checkTwinDestination({ mode: 'twin', twin: {
      conversationId: 'synthetic-scope', runtimePath: 'relative-runtime.json'
    } }), /absolute runtime/);
    assert.equal(lookups, 1);
    await writeFile(runtimePath, JSON.stringify({ pid: process.pid, port: server.address().port }));
    enabled = false;
    await assert.rejects(notifyTwin(config, 'Synthetic observation'), /missing or disabled/);
    assert.equal(messages.length, 0);
    enabled = true;
    assert.deepEqual(await notifyTwin(config, 'Synthetic observation'), {
      deliveredToRuntime: true, workerProgressVerified: false
    });
    assert.equal(lookups, 3);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].conversationId, 'synthetic-scope');
    assert.equal(messages[0].actorAadId, '');
    assert(!('sendAsUserId' in messages[0]));
    redirectLookup = true;
    await assert.rejects(checkTwinDestination(config));
    assert.equal(lookups, 4);
    assert.equal(messages.length, 1);
  } finally {
    server.closeAllConnections();
    if (server.listening) await new Promise(resolve => server.close(resolve));
    await rm(directory, { recursive: true });
  }
});
