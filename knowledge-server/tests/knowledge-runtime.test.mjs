import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { isAbsolute, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findDevelopmentKbRoot, loadKnowledgeSnapshot, validateKnowledgeReference } from '../src/runtime/knowledge.mjs';
import { createCommonReferenceFixture } from './helpers/common-reference.mjs';

const serverRoot = fileURLToPath(new URL('../', import.meta.url));
const repository = fileURLToPath(new URL('../../', import.meta.url));
const sourceKb = fileURLToPath(new URL('../../accessibility-kb', import.meta.url));
const MAX_BYTES = 8 * 1024 * 1024;
const json = value => JSON.stringify(value, null, 2) + '\n';
const digest = value => createHash('sha256').update(value).digest('hex');
const distributionUrl = hash => `https://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/${hash}.json`;
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));

async function directoryEntries(path) {
  try { return (await readdir(path)).sort(); }
  catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function fixture(t) {
  // Canonicalize the OS temp directory before the runtime checks all ancestors.
  const dir = await mkdtemp(join(await realpath(tmpdir()), 'a11y-knowledge-runtime-'));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }));
  const cache = join(dir, 'cache');
  const install = async name => {
    const server = join(dir, 'installed', name);
    await mkdir(server, { recursive: true });
    for (const path of ['package.json', 'src/runtime', 'references']) {
      await cp(join(serverRoot, path), join(server, path), { recursive: true });
    }
    return server;
  };
  const server = await install('knowledge-server');
  const reference = await readJson(join(server, 'references/knowledge.json'));
  // These are generated release bytes, not a claim that the URL is published.
  // No test uses global fetch, a real HTTP endpoint, a provider, or user config.
  const bytes = await readFile(join(repository, 'knowledge-distribution', `${reference.manifestSha256}.json`));
  assert.equal(digest(bytes), reference.distribution.sha256, 'Generated artifact must match the installed raw-byte pin');
  const cacheFile = join(cache, `${reference.manifestSha256}.json`);
  return { dir, cache, cacheFile, server, reference, bytes, install, env: { A11Y_ASSIST_KB_CACHE_ROOT: cache } };
}

function syntheticHttp(reference, respond) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    assert.equal(url, reference.distribution.url);
    assert.equal(url, distributionUrl(reference.manifestSha256));
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.referrerPolicy, 'no-referrer');
    assert.deepEqual(options.headers, { Accept: 'application/json', 'Accept-Encoding': 'identity' });
    assert(options.signal instanceof AbortSignal);
    assert.equal(options.signal.aborted, false);
    assert.equal(options.body, undefined, 'Knowledge queries and user data must not be transmitted');
    return respond(url, options);
  };
  return { calls, fetchImpl };
}

function offlineHttp() {
  const calls = [];
  return { calls, fetchImpl: async (...args) => {
    calls.push(args);
    throw new Error('Synthetic offline transport; no real network attempted');
  } };
}

function assertSnapshot(snapshot, reference, bytes) {
  const artifact = JSON.parse(bytes.toString('utf8'));
  assert.deepEqual(snapshot.reference, reference);
  assert.deepEqual(snapshot.manifest, artifact.manifest);
  assert.deepEqual(Object.fromEntries(snapshot.files), artifact.files);
  assert.equal(digest(json(snapshot.manifest)), reference.manifestSha256);
  assert.equal(snapshot.contentApprovalVerified, false);
  assert.equal(snapshot.independentBehaviorVerified, false);
  assert.equal(snapshot.files.has('manifest.json'), false);
  assert(snapshot.entries.length > 0);
  const expectedIds = [];
  for (const id of Object.keys(reference.packages)) {
    const pkg = JSON.parse(artifact.files[`packages/${id}/package.json`]);
    expectedIds.push(...pkg.entries.map(entry => entry.id));
    assert.deepEqual(snapshot.sources[id], pkg.sources);
  }
  assert.deepEqual(snapshot.entries.map(entry => entry.id).sort(), expectedIds.sort());
  for (const entry of snapshot.entries) {
    assert.equal(isAbsolute(entry.path), false);
    assert(snapshot.files.has(entry.path));
    assert.equal(digest(snapshot.files.get(entry.path)), snapshot.manifest.hashes[entry.path]);
    assert(Object.hasOwn(reference.packages, entry.id.split('.')[0]));
  }
}

async function repinRaw(server, reference, bytes) {
  const pinned = structuredClone(reference);
  pinned.distribution.sha256 = digest(bytes);
  validateKnowledgeReference(pinned);
  await writeFile(join(server, 'references/knowledge.json'), json(pinned));
  return pinned;
}

test('single isolated server cold-downloads pinned bytes, then revalidates offline without configuration', async t => {
  const f = await fixture(t);
  assert.equal(await findDevelopmentKbRoot(f.server), null);
  assert.deepEqual(await directoryEntries(join(f.dir, 'installed')), ['knowledge-server']);
  assert.deepEqual(await directoryEntries(join(f.server, 'accessibility-kb')), []);
  // Exercise the copied standalone module too: it cannot import repository helpers.
  const installedRuntime = await import(pathToFileURL(join(f.server, 'src/runtime/knowledge.mjs')).href);
  const localAppData = join(f.dir, 'local-app-data');
  const env = process.platform === 'win32' ? { LOCALAPPDATA: localAppData } : f.env;
  const cache = process.platform === 'win32' ? join(localAppData, 'A11yAssist', 'knowledge') : f.cache;
  const http = syntheticHttp(f.reference, () => new Response(f.bytes, {
    headers: { 'content-length': String(f.bytes.length), 'content-encoding': 'identity' }
  }));
  const downloaded = await installedRuntime.loadKnowledgeSnapshot(f.server, { env, fetchImpl: http.fetchImpl });
  assert.equal(downloaded.origin, 'download');
  assertSnapshot(downloaded, f.reference, f.bytes);
  assert.deepEqual(Object.keys(downloaded.reference.packages), ['common', 'fluent', 'sharepoint']);
  assert.equal(downloaded.entries.length, 32);
  assert.equal(http.calls.length, 1);
  assert.deepEqual(await directoryEntries(cache), [`${f.reference.manifestSha256}.json`]);
  assert.deepEqual(await readFile(join(cache, `${f.reference.manifestSha256}.json`)), f.bytes);

  // Mutating the returned objects must not poison a process-global snapshot.
  downloaded.files.clear();
  downloaded.entries.length = 0;
  downloaded.manifest.packages.common = '99.0.0';
  const offline = offlineHttp();
  const cached = await installedRuntime.loadKnowledgeSnapshot(f.server, { env, fetchImpl: offline.fetchImpl });
  assert.equal(cached.origin, 'cache');
  assertSnapshot(cached, f.reference, f.bytes);
  assert.equal(offline.calls.length, 0);
});

test('independent server installs share cache while a synthetic Common consumer stays isolated', async t => {
  const f = await fixture(t);
  const second = await f.install('second-server');
  const { consumer: common, reference: commonReference } = await createCommonReferenceFixture(f.dir, sourceKb);
  assert.deepEqual(await readJson(join(second, 'references/knowledge.json')), f.reference);
  const http = syntheticHttp(f.reference, () => new Response(f.bytes));
  await loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: http.fetchImpl });
  const offline = offlineHttp();
  const shared = await loadKnowledgeSnapshot(second, { env: f.env, fetchImpl: offline.fetchImpl });
  assert.equal(shared.origin, 'cache');
  assertSnapshot(shared, f.reference, f.bytes);
  assert.equal(offline.calls.length, 0);
  assert.equal(http.calls.length, 1);

  assert.notEqual(commonReference.manifestSha256, f.reference.manifestSha256);
  await assert.rejects(loadKnowledgeSnapshot(common, { env: f.env, fetchImpl: offline.fetchImpl }), /Synthetic offline/);
  assert.equal(offline.calls.length, 1, 'A project cache must not satisfy a Common-only pin');
  const commonBytes = await readFile(join(repository, 'knowledge-distribution', `${commonReference.manifestSha256}.json`));
  const commonHttp = syntheticHttp(commonReference, () => new Response(commonBytes));
  const selected = await loadKnowledgeSnapshot(common, { env: f.env, fetchImpl: commonHttp.fetchImpl });
  assert.equal(selected.origin, 'download');
  assertSnapshot(selected, commonReference, commonBytes);
  assert.deepEqual(Object.keys(selected.manifest.packages), ['common']);
  assert.equal(selected.entries.length, 20);
  assert(selected.entries.every(entry => entry.id.startsWith('common.')));
  assert([...selected.files.keys()].every(path => !/^packages\/(fluent|sharepoint)\//.test(path)));
  assert.deepEqual(await directoryEntries(f.cache), [
    `${commonReference.manifestSha256}.json`, `${f.reference.manifestSha256}.json`
  ].sort());
  assert.deepEqual(await readFile(f.cacheFile), f.bytes);
  const cachedCommon = await loadKnowledgeSnapshot(common, { env: f.env, fetchImpl: offline.fetchImpl });
  assert.equal(cachedCommon.origin, 'cache');
  assertSnapshot(cachedCommon, commonReference, commonBytes);
  assert.equal(offline.calls.length, 1);
  const configuredCommon = await loadKnowledgeSnapshot(common, {
    kbRoot: sourceKb, env: f.env, fetchImpl: offline.fetchImpl
  });
  const environmentCommon = await loadKnowledgeSnapshot(common, {
    env: { ...f.env, A11Y_ASSIST_KB_ROOT: sourceKb }, fetchImpl: offline.fetchImpl
  });
  assert.equal(configuredCommon.origin, 'configured');
  assertSnapshot(configuredCommon, commonReference, commonBytes);
  assert.deepEqual(environmentCommon, configuredCommon);
  assert.equal(offline.calls.length, 1);
});

test('concurrent cold downloads publish atomically and remove only their own temporary files', { timeout: 15000 }, async t => {
  const f = await fixture(t);
  const second = await f.install('second-server');
  await mkdir(f.cache);
  const foreignName = `.${f.reference.manifestSha256}.json.foreign-worker.tmp`;
  await writeFile(join(f.cache, foreignName), 'foreign worker owns this temporary file');
  await mkdir(join(f.cache, 'foreign-directory'));
  await writeFile(join(f.cache, 'foreign-directory/sentinel'), 'keep');
  let release;
  const bothDownloading = new Promise(resolve => { release = resolve; });
  let arrivals = 0;
  const http = syntheticHttp(f.reference, async () => {
    if (++arrivals === 2) release();
    await bothDownloading;
    return new Response(f.bytes);
  });
  // Wait for both writers even on failure, so cleanup never races a live writer.
  const settled = await Promise.allSettled([f.server, second].map(server =>
    loadKnowledgeSnapshot(server, { env: f.env, fetchImpl: http.fetchImpl })));
  assert.equal(http.calls.length, 2, 'Both calls miss before either synthetic response is released');
  assert.deepEqual(await directoryEntries(f.cache), [foreignName, 'foreign-directory', `${f.reference.manifestSha256}.json`].sort());
  assert.equal(await readFile(join(f.cache, foreignName), 'utf8'), 'foreign worker owns this temporary file');
  assert.equal(await readFile(join(f.cache, 'foreign-directory/sentinel'), 'utf8'), 'keep');
  assert.deepEqual(await readFile(f.cacheFile), f.bytes);
  assert.deepEqual(settled.filter(result => result.status === 'rejected').map(result => result.reason.message), [],
    'Concurrent publication of identical pinned bytes must not be mistaken for cache tampering');
  const results = settled.map(result => result.value);
  assert.deepEqual(results.map(result => result.origin).sort(), ['cache', 'download']);
  results.forEach(result => assertSnapshot(result, f.reference, f.bytes));
});

test('an invalid concurrent cache winner is rejected without replacing or deleting it', async t => {
  const f = await fixture(t);
  const foreign = Buffer.from('Synthetic corrupt cache published by another worker');
  const http = syntheticHttp(f.reference, async () => {
    await mkdir(f.cache);
    await writeFile(f.cacheFile, foreign, { flag: 'wx' });
    return new Response(f.bytes);
  });
  await assert.rejects(loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: http.fetchImpl }), /Invalid KB cache.*not overwritten/);
  assert.equal(http.calls.length, 1);
  assert.deepEqual(await readFile(f.cacheFile), foreign);
  assert.deepEqual(await directoryEntries(f.cache), [`${f.reference.manifestSha256}.json`]);
});

test('cache tampering is revalidated on every request and never fetched or repaired', async t => {
  const f = await fixture(t);
  const http = syntheticHttp(f.reference, () => new Response(f.bytes));
  await loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: http.fetchImpl });
  const artifact = JSON.parse(f.bytes.toString('utf8'));
  artifact.files['README.md'] += '\nSynthetic tampering.\n';
  const tampered = Buffer.from(json(artifact));
  await writeFile(f.cacheFile, tampered);
  for (let request = 0; request < 2; request++) {
    await assert.rejects(loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: http.fetchImpl }),
      /Invalid KB cache.*not overwritten.*SHA-256 mismatch/);
    assert.deepEqual(await readFile(f.cacheFile), tampered);
  }
  assert.equal(http.calls.length, 1, 'Only the initial cold download may fetch');
  assert.deepEqual(await directoryEntries(f.cache), [`${f.reference.manifestSha256}.json`]);
});

test('configured roots and validated standalone development loads match the downloaded selected snapshot', async t => {
  const f = await fixture(t);
  const local = join(f.dir, 'shared-kb');
  await cp(sourceKb, local, { recursive: true });
  const offline = offlineHttp();
  const configured = await loadKnowledgeSnapshot(f.server, { kbRoot: local, env: f.env, fetchImpl: offline.fetchImpl });
  const environment = await loadKnowledgeSnapshot(f.server, {
    env: { ...f.env, A11Y_ASSIST_KB_ROOT: local }, fetchImpl: offline.fetchImpl
  });
  assert.equal(configured.origin, 'configured');
  assertSnapshot(configured, f.reference, f.bytes);
  assert.deepEqual(environment, configured);
  const priority = await loadKnowledgeSnapshot(f.server, {
    kbRoot: local, env: { A11Y_ASSIST_KB_ROOT: 'invalid-env', A11Y_ASSIST_KB_CACHE_ROOT: '' }, fetchImpl: offline.fetchImpl
  });
  assert.deepEqual(priority, configured);
  assert.equal(await findDevelopmentKbRoot(serverRoot), sourceKb);
  const development = await loadKnowledgeSnapshot(serverRoot, { env: f.env, fetchImpl: offline.fetchImpl });
  assert.equal(development.origin, 'development');
  assertSnapshot(development, f.reference, f.bytes);
  assert.equal(offline.calls.length, 0);
  assert.deepEqual(await directoryEntries(f.cache), []);
});

test('development detection requires exact standalone identity and never inspects existing plugins', async t => {
  const f = await fixture(t);
  const checkout = join(f.dir, 'checkout');
  const server = join(checkout, 'knowledge-server');
  await cp(f.server, server, { recursive: true });
  assert.equal(await findDevelopmentKbRoot(server), null, 'A knowledge-server folder alone is not a checkout');
  await writeFile(join(checkout, 'package.json'), json({ name: '@a11y-assist/plugins' }));
  assert.equal(await findDevelopmentKbRoot(server), null, 'Parent identity without catalog is insufficient');
  await mkdir(join(checkout, 'src'));
  const catalogPath = join(checkout, 'src/catalog.json');
  await writeFile(catalogPath, '[]\n');
  const missingKb = join(checkout, 'accessibility-kb');
  assert.equal(await findDevelopmentKbRoot(server), missingKb, 'Catalog existence does not require a server plugin entry');
  // A deliberately unreadable-as-directory plugin path proves there is no
  // enumeration or dependency on the existing marketplace/plugin manifests.
  await writeFile(join(checkout, 'plugins'), 'Not a plugin directory');
  assert.equal(await findDevelopmentKbRoot(server), missingKb);

  const serverPackage = await readJson(join(server, 'package.json'));
  for (const name of ['a11y-kb', '@a11y-assist/plugins', '@a11y-assist/knowledge-server-other']) {
    await writeFile(join(server, 'package.json'), json({ ...serverPackage, name }));
    assert.equal(await findDevelopmentKbRoot(server), null, 'Server package name must match exactly');
  }
  await writeFile(join(server, 'package.json'), json(serverPackage));
  await writeFile(join(checkout, 'package.json'), json({ name: 'unrelated-repository' }));
  assert.equal(await findDevelopmentKbRoot(server), null, 'Parent package name must match exactly');
  await writeFile(join(checkout, 'package.json'), json({ name: '@a11y-assist/plugins' }));
  const renamed = join(checkout, 'renamed-server');
  await cp(server, renamed, { recursive: true });
  assert.equal(await findDevelopmentKbRoot(renamed), null, 'Server directory name must match exactly');
  await rm(catalogPath);
  await mkdir(catalogPath);
  assert.equal(await findDevelopmentKbRoot(server), null, 'Catalog must be a regular file');
  await rm(catalogPath, { recursive: true });
  await writeFile(catalogPath, '[]\n');
  assert.equal(await findDevelopmentKbRoot(server), missingKb);
  const offline = offlineHttp();
  await assert.rejects(loadKnowledgeSnapshot(server, { env: f.env, fetchImpl: offline.fetchImpl }), /Missing KB directory/);
  assert.equal(offline.calls.length, 0);
  await cp(sourceKb, missingKb, { recursive: true });
  const valid = await loadKnowledgeSnapshot(server, { env: f.env, fetchImpl: offline.fetchImpl });
  assert.equal(valid.origin, 'development');
  await writeFile(join(missingKb, 'packages/common/topics/foundations.md'), 'Synthetic corrupt development content');
  await assert.rejects(loadKnowledgeSnapshot(server, { env: f.env, fetchImpl: offline.fetchImpl }), /Local KB file SHA-256 mismatch/);
  assert.equal(offline.calls.length, 0);
  assert.deepEqual(await directoryEntries(f.cache), []);
});

test('invalid explicit roots never fall back to environment, development, a warm cache, or HTTP', async t => {
  const f = await fixture(t);
  await mkdir(f.cache);
  await writeFile(f.cacheFile, f.bytes);
  const fileRoot = join(f.dir, 'not-a-directory');
  await writeFile(fileRoot, 'file');
  const corruptRoot = join(f.dir, 'corrupt-kb');
  await mkdir(corruptRoot);
  await writeFile(join(corruptRoot, 'manifest.json'), '{');
  const offline = offlineHttp();
  for (const server of [f.server, serverRoot]) {
    for (const kbRoot of ['', 'relative/kb', null, join(f.dir, 'missing-kb'), fileRoot, corruptRoot]) {
      await assert.rejects(loadKnowledgeSnapshot(server, {
        kbRoot, env: { ...f.env, A11Y_ASSIST_KB_ROOT: sourceKb }, fetchImpl: offline.fetchImpl
      }), /absolute path|Missing KB directory|not a directory|Invalid JSON/);
    }
  }
  assert.equal(offline.calls.length, 0);
  assert.deepEqual(await readFile(f.cacheFile), f.bytes);
});

test('invalid environment KB/cache roots fail closed without network or cache changes', async t => {
  const f = await fixture(t);
  const offline = offlineHttp();
  const invalid = ['', 'relative/path', null, 42, `${f.dir}${sep}..${sep}other`, `${f.dir}\0bad`];
  if (process.platform === 'win32') invalid.push('\\drive-relative', 'C:drive-relative', '\\\\?\\C:\\device-root', '\\\\.\\C:\\device-root');
  for (const key of ['A11Y_ASSIST_KB_ROOT', 'A11Y_ASSIST_KB_CACHE_ROOT']) {
    for (const value of invalid) {
      await assert.rejects(loadKnowledgeSnapshot(f.server, {
        env: { ...f.env, [key]: value }, fetchImpl: offline.fetchImpl
      }), /absolute path|dot segments/);
    }
  }
  if (process.platform === 'win32') {
    for (const value of [undefined, '', 'relative', '\\drive-relative']) {
      await assert.rejects(loadKnowledgeSnapshot(f.server, {
        env: { LOCALAPPDATA: value }, fetchImpl: offline.fetchImpl
      }), /absolute path/);
    }
  }
  await assert.rejects(loadKnowledgeSnapshot(f.server, {
    env: { ...f.env, A11Y_ASSIST_KB_ROOT: join(f.dir, 'missing') }, fetchImpl: offline.fetchImpl
  }), /Missing KB directory/);
  assert.equal(offline.calls.length, 0);
  assert.deepEqual(await directoryEntries(f.cache), []);
});

test('HTTP and raw-byte failures never publish a cache artifact', async t => {
  const cases = [
    ['404', () => new Response('Synthetic not found', { status: 404 }), /HTTP status: 404/],
    ['offline', () => { throw new Error('Synthetic offline'); }, /Synthetic offline/],
    ['redirect status', () => Response.redirect('https://example.invalid/elsewhere'), /HTTP status: 302/],
    ['followed redirect', f => {
      const response = new Response(f.bytes);
      Object.defineProperty(response, 'redirected', { value: true });
      return response;
    }, /redirects are forbidden/],
    ['different response URL', f => {
      const response = new Response(f.bytes);
      Object.defineProperty(response, 'url', { value: 'https://example.invalid/elsewhere' });
      return response;
    }, /redirects are forbidden/],
    ['oversized declared body', f => new Response(f.bytes, { headers: { 'content-length': String(MAX_BYTES + 1) } }), /Content-Length exceeds/],
    ['oversized streamed body', () => new Response(Buffer.alloc(MAX_BYTES + 1)), /exceeds byte limit/],
    ['invalid Content-Length', f => new Response(f.bytes, { headers: { 'content-length': 'invalid' } }), /Invalid.*Content-Length/],
    ['short body', f => new Response(f.bytes, { headers: { 'content-length': String(f.bytes.length + 1) } }), /Content-Length mismatch/],
    ['long body', f => new Response(f.bytes, { headers: { 'content-length': String(f.bytes.length - 1) } }), /exceeds byte limit or Content-Length/],
    ['compressed body', f => new Response(f.bytes, { headers: { 'content-encoding': 'gzip' } }), /Encoded KB distribution/],
    ['missing stream', () => new Response(null), /no readable response stream/],
    ['broken stream', () => new Response(new ReadableStream({ start(controller) {
      controller.error(new Error('Synthetic stream failure'));
    } })), /Synthetic stream failure/],
    ['wrong raw hash', f => new Response(Buffer.concat([f.bytes, Buffer.from('\n')])), /distribution SHA-256 mismatch/]
  ];
  for (const [name, respond, expected] of cases) await t.test(name, async t => {
    const f = await fixture(t);
    const http = syntheticHttp(f.reference, () => respond(f));
    await assert.rejects(loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: http.fetchImpl }), expected);
    assert.equal(http.calls.length, 1);
    assert.deepEqual(await directoryEntries(f.cache), [], 'No final or temporary cache files after failure');
  });
});

test('repinned synthetic malformed artifacts reach deep validation but are never cached', async t => {
  // Change only a temporary installed reference's raw pin so these cases test
  // parsing/content validation, rather than all stopping at the outer hash.
  const cases = [
    ['invalid JSON', () => Buffer.from('{'), /Invalid JSON in KB distribution/],
    ['invalid UTF-8', () => Buffer.from([0xc3, 0x28]), /Invalid UTF-8/],
    ['wrong artifact shape', artifact => { artifact.extra = true; }, /Invalid KB distribution artifact fields/],
    ['wrong artifact version', artifact => { artifact.schemaVersion = 2; }, /Unsupported KB distribution schemaVersion/],
    ['manifest hash mismatch', artifact => { artifact.manifest.hashes['README.md'] = '0'.repeat(64); }, /manifest SHA-256 mismatch/],
    ['file hash mismatch', artifact => { artifact.files['README.md'] += '\nSynthetic change.\n'; }, /KB file SHA-256 mismatch/],
    ['missing file', artifact => { delete artifact.files['README.md']; }, /file list mismatch/],
    ['package version mismatch', artifact => { artifact.manifest.packages.common = '9.9.9'; }, /package\/version mismatch/],
    ['extra package', artifact => { artifact.manifest.packages.unselected = '0.1.0'; }, /package\/version mismatch/],
    ['malicious manifest traversal', artifact => { artifact.manifest.hashes['../escape.md'] = digest('escape'); }, /Unsafe KB path/],
    ['malicious file traversal', artifact => { artifact.files['../escape.md'] = 'escape'; }, /Unsafe KB path/],
    ['absolute file path', artifact => { artifact.files['C:/escape.md'] = 'escape'; }, /Unsafe KB path/],
    ['backslash file path', artifact => { artifact.files['packages\\escape.md'] = 'escape'; }, /Unsafe KB path/],
    ['Windows reserved filename', artifact => { artifact.files['NUL.md'] = 'escape'; }, /Unsafe KB path segment/],
    ['case collision', artifact => { artifact.files['readme.md'] = 'collision'; }, /case collision/],
    ['directory case collision', artifact => { artifact.files['Packages/extra.md'] = 'collision'; }, /case collision/],
    ['file directory conflict', artifact => { artifact.files['README.md/child.md'] = 'collision'; }, /file\/directory conflict/],
    ['embedded manifest file', artifact => { artifact.files['manifest.json'] = '{}'; }, /manifest.json must not appear/],
    ['too many files', artifact => {
      for (let i = 0; i < 1001; i++) artifact.files[`extra-${i}.md`] = '';
    }, /KB file count/]
  ];
  for (const [name, mutate, expected] of cases) await t.test(name, async t => {
    const f = await fixture(t);
    const artifact = JSON.parse(f.bytes.toString('utf8'));
    const result = mutate(artifact);
    const bytes = Buffer.isBuffer(result) ? result : Buffer.from(json(artifact));
    const reference = await repinRaw(f.server, f.reference, bytes);
    const http = syntheticHttp(reference, () => new Response(bytes));
    await assert.rejects(loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: http.fetchImpl }), expected);
    assert.equal(http.calls.length, 1);
    assert.deepEqual(await directoryEntries(f.cache), []);
    assert.deepEqual(await directoryEntries(f.dir), ['installed'], 'Malicious artifact paths must not escape into the temp root');
  });
});

test('valid hashes cannot bypass semantic validation of selected package contents', async t => {
  const f = await fixture(t);
  const artifact = JSON.parse(f.bytes.toString('utf8'));
  const descriptor = 'packages/common/package.json';
  const pkg = JSON.parse(artifact.files[descriptor]);
  pkg.entries[0].sourceIds = ['synthetic-unknown-source'];
  artifact.files[descriptor] = json(pkg);
  artifact.manifest.hashes[descriptor] = digest(artifact.files[descriptor]);
  const reference = structuredClone(f.reference);
  reference.manifestSha256 = digest(json(artifact.manifest));
  reference.distribution.url = distributionUrl(reference.manifestSha256);
  const bytes = Buffer.from(json(artifact));
  const pinned = await repinRaw(f.server, reference, bytes);
  const http = syntheticHttp(pinned, () => new Response(bytes));
  await assert.rejects(loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: http.fetchImpl }), /Unknown KB source/);
  assert.equal(http.calls.length, 1);
  assert.deepEqual(await directoryEntries(f.cache), []);
});

test('reference validation rejects unpinned selectors and caller-controlled distribution endpoints before fetching', async t => {
  const f = await fixture(t);
  validateKnowledgeReference(f.reference);
  const invalid = [
    null, [], { ...f.reference, extra: true }, { ...f.reference, schemaVersion: 2 },
    { ...f.reference, kind: 'other' }, { ...f.reference, rootEnv: 'OTHER_ENV' },
    { ...f.reference, developmentRoot: '../../accessibility-kb' },
    { ...f.reference, developmentRoot: '../../../elsewhere' },
    { ...f.reference, packages: {} }, { ...f.reference, packages: { common: '*' } },
    { ...f.reference, packages: { '../escape': '0.1.0' } },
    { ...f.reference, manifestSha256: 'not-a-hash' },
    { ...f.reference, distribution: undefined },
    ...[
      {}, { ...f.reference.distribution, sha256: 'bad' },
      { ...f.reference.distribution, credentials: 'include' },
      ...[
        'http://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/test.json',
        'https://example.invalid/artifact.json',
        f.reference.distribution.url + '?query=private',
        f.reference.distribution.url + '#fragment',
        f.reference.distribution.url.replace('https://', 'https://user:secret@'),
        distributionUrl('0'.repeat(64))
      ].map(url => ({ ...f.reference.distribution, url }))
    ].map(distribution => ({ ...f.reference, distribution }))
  ];
  const offline = offlineHttp();
  for (const reference of invalid) {
    assert.throws(() => validateKnowledgeReference(reference));
    await writeFile(join(f.server, 'references/knowledge.json'), json(reference));
    await assert.rejects(loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: offline.fetchImpl }), /Invalid|Unsupported/);
  }
  assert.equal(offline.calls.length, 0);
  assert.deepEqual(await directoryEntries(f.cache), []);
});

test('symlinked KB, server, and cache directories are rejected without fallback or foreign writes', async t => {
  const f = await fixture(t);
  const type = process.platform === 'win32' ? 'junction' : 'dir';
  const linkRoot = join(f.dir, 'linked-kb');
  try { await symlink(sourceKb, linkRoot, type); }
  catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) return t.skip(`Directory links unavailable: ${error.code}`);
    throw error;
  }
  const offline = offlineHttp();
  await assert.rejects(loadKnowledgeSnapshot(f.server, { kbRoot: linkRoot, env: f.env, fetchImpl: offline.fetchImpl }), /symlink/);
  const linkedServer = join(f.dir, 'linked-server');
  await symlink(f.server, linkedServer, type);
  await assert.rejects(loadKnowledgeSnapshot(linkedServer, { kbRoot: sourceKb, env: f.env, fetchImpl: offline.fetchImpl }), /symlink/);
  const target = join(f.dir, 'foreign-cache');
  await mkdir(target);
  await writeFile(join(target, 'sentinel'), 'foreign');
  await symlink(target, f.cache, type);
  await assert.rejects(loadKnowledgeSnapshot(f.server, { env: f.env, fetchImpl: offline.fetchImpl }), /symlink/);
  assert.equal(offline.calls.length, 0);
  assert.deepEqual(await directoryEntries(target), ['sentinel']);
  assert.equal(await readFile(join(target, 'sentinel'), 'utf8'), 'foreign');
});