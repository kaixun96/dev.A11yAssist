// Test-only HTTPS stand-in. Production launch descriptors never import this file.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

globalThis.fetch = async (url, options) => {
  assert.equal(url, process.env.TEST_KB_URL);
  assert.equal(options.method, 'GET');
  assert.equal(options.redirect, 'error');
  assert.equal(options.credentials, 'omit');
  if (!process.env.TEST_KB_ARTIFACT) throw new Error('Synthetic offline network');
  return new Response(await readFile(process.env.TEST_KB_ARTIFACT), {
    status: 200, headers: { 'content-type': 'application/json' }
  });
};