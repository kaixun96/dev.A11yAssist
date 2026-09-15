import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, lstat, rename, unlink, link } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadKnowledgeBase, exportKnowledgeBase } from './knowledge-base.mjs';
import { createKnowledgeReference, createKnowledgeDistribution } from './knowledge-reference.mjs';

const json = value => JSON.stringify(value, null, 2) + '\n';
const digest = value => createHash('sha256').update(value).digest('hex');
const hashPattern = /^[a-f0-9]{64}$/;
async function existing(path) {
  try {
    const stat = await lstat(path);
    assert(stat.isFile() && !stat.isSymbolicLink(), `Expected regular build file: ${path}`);
    return await readFile(path, 'utf8');
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

// Deliberately separate from the plugin builder. No plugins, runtime exports,
// catalog, skills, release metadata or root package files are build outputs.
export async function buildKnowledge(repository, { check = false } = {}) {
  const kb = await loadKnowledgeBase(join(repository, 'accessibility-kb'));
  const full = exportKnowledgeBase(kb, [...kb.packages.keys()]);
  const distribution = join(repository, 'knowledge-distribution');
  const indexPath = join(distribution, 'index.json');
  const previous = await existing(indexPath);
  const index = previous === null ? { schemaVersion: 1, artifacts: {} } : JSON.parse(previous);
  assert.deepEqual(Object.keys(index).sort(), ['artifacts', 'schemaVersion']);
  assert.equal(index.schemaVersion, 1);
  assert(index.artifacts && typeof index.artifacts === 'object' && !Array.isArray(index.artifacts));
  // Verify every retained publication before writing anything. Never prune old
  // artifacts: installed references may still need them for a cold download.
  for (const [pin, sha256] of Object.entries(index.artifacts)) {
    assert(hashPattern.test(pin) && hashPattern.test(sha256), 'Invalid publication index');
    const bytes = await existing(join(distribution, `${pin}.json`));
    assert(bytes !== null && digest(bytes) === sha256, `Retained KB artifact missing or changed: ${pin}`);
    assert.equal(digest(json(JSON.parse(bytes).manifest)), pin, `Retained KB manifest mismatch: ${pin}`);
  }
  const artifacts = new Map();
  for (const selected of [['common'], ['sharepoint']]) {
    const exported = exportKnowledgeBase(kb, selected);
    const pin = digest(exported.files.get('manifest.json'));
    const body = createKnowledgeDistribution(exported);
    const sha = digest(body);
    assert(!Object.hasOwn(index.artifacts, pin) || index.artifacts[pin] === sha,
      `Cannot replace immutable KB artifact: ${pin}`);
    artifacts.set(pin, body);
    index.artifacts[pin] = sha;
  }
  try {
    const stat = await lstat(distribution);
    assert(stat.isDirectory() && !stat.isSymbolicLink(), 'Invalid distribution directory');
    for (const file of await readdir(distribution)) {
      if (file === 'index.json') continue;
      const pin = file.slice(0, -5);
      assert(file === `${pin}.json` && Object.hasOwn(index.artifacts, pin),
        `Unindexed distribution file; review rather than prune: ${file}`);
      // Also recognizes complete current artifacts written before an interrupted
      // index publication, but never trusts a merely hash-shaped filename.
      assert.equal(digest(await existing(join(distribution, file))), index.artifacts[pin],
        `KB artifact changed: ${file}`);
    }
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  index.artifacts = Object.fromEntries(Object.entries(index.artifacts).sort(([a], [b]) => a.localeCompare(b, 'en')));
  const generated = new Map();
  for (const [pin, body] of artifacts) generated.set(`knowledge-distribution/${pin}.json`, body);
  // Publish artifacts before their index, and the consumer reference last.
  generated.set('knowledge-distribution/index.json', json(index));
  generated.set('accessibility-kb/manifest.json', full.files.get('manifest.json'));
  generated.set('knowledge-server/references/knowledge.json', json(createKnowledgeReference(kb, ['sharepoint'])));
  for (const [path, body] of generated) {
    const target = join(repository, path);
    const old = await existing(target);
    if (check) assert.equal(old?.replaceAll('\r\n', '\n'), body, `Generated KB drift: ${path}`);
    else if (old !== body) {
      await mkdir(dirname(target), { recursive: true });
      // Content-addressed files are never replaced, even in build mode.
      if (path.startsWith('knowledge-distribution/') && !path.endsWith('/index.json')) {
        const staging = join(repository, 'knowledge-server/.build-staging');
        await mkdir(staging, { recursive: true });
        const temporary = join(staging, `${randomUUID()}.tmp`);
        await writeFile(temporary, body, { flag: 'wx' });
        try { await link(temporary, target); }
        finally { await unlink(temporary); }
      } else {
        const temporary = `${target}.${randomUUID()}.tmp`;
        await writeFile(temporary, body, { flag: 'wx' });
        try { await rename(temporary, target); }
        finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
      }
    }
  }
  return { entries: kb.entries.size, retainedArtifacts: Object.keys(index.artifacts).length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert(process.argv.slice(2).every(arg => arg === '--check'), 'Only --check is supported');
  const result = await buildKnowledge(fileURLToPath(new URL('../../', import.meta.url)),
    { check: process.argv.includes('--check') });
  console.log(JSON.stringify(result));
}