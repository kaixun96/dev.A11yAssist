import assert from 'node:assert/strict';
import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { loadKnowledgeBase, exportKnowledgeBase } from './knowledge-base.mjs';
import { findDevelopmentKbRoot, validateKnowledgeReference } from '../src/runtime/knowledge.mjs';
export { validateKnowledgeReference } from '../src/runtime/knowledge.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const load = async path => JSON.parse(await readFile(path, 'utf8'));

export function createKnowledgeReference(kb, selected) {
  const exported = exportKnowledgeBase(kb, selected);
  const manifestSha256 = digest(exported.files.get('manifest.json'));
  const artifact = createKnowledgeDistribution(exported);
  return {
    schemaVersion: 1,
    kind: 'shared-accessibility-kb',
    rootEnv: 'A11Y_ASSIST_KB_ROOT',
    developmentRoot: '../accessibility-kb',
    packages: exported.manifest.packages,
    manifestSha256,
    distribution: {
      url: `https://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/${manifestSha256}.json`,
      sha256: digest(artifact)
    }
  };
}

export function createKnowledgeDistribution(exported) {
  const files = Object.fromEntries(Object.keys(exported.manifest.hashes).map(path => [path, exported.files.get(path)]));
  const body = JSON.stringify({ schemaVersion: 1, manifest: exported.manifest, files }, null, 2) + '\n';
  assert(Buffer.byteLength(body) <= 8 * 1024 * 1024, 'KB distribution exceeds runtime size limit');
  return body;
}

async function developmentKbRoot(pluginRoot) {
  const candidate = await findDevelopmentKbRoot(pluginRoot);
  if (!candidate) {
    throw new Error('Shared KB is not configured. The host must provide an absolute kbRoot or A11Y_ASSIST_KB_ROOT; development lookup only supports this repository standalone knowledge-server layout.');
  }
  return candidate;
}

// Host-side setup/read helper, not a runtime dependency or an instruction for
// read-only consumers to execute shell commands.
export async function resolveKnowledgeReference(pluginRoot, { kbRoot, env = process.env } = {}) {
  assert(typeof pluginRoot === 'string' && isAbsolute(pluginRoot), 'Server root must be absolute');
  const canonicalServerRoot = await realpath(pluginRoot);
  const reference = await load(join(canonicalServerRoot, 'references/knowledge.json'));
  validateKnowledgeReference(reference);
  const configured = kbRoot !== undefined ? kbRoot : env[reference.rootEnv];
  let location;
  if (configured !== undefined) {
    assert(typeof configured === 'string' && isAbsolute(configured), 'Configured KB root must be a nonempty absolute path');
    location = configured;
  } else location = await developmentKbRoot(canonicalServerRoot);
  // Validate the original root before resolving it so root symlinks are rejected
  // by the shared loader, just like symlinks inside a content package.
  const kb = await loadKnowledgeBase(location, { verifyManifest: true });
  const exported = exportKnowledgeBase(kb, Object.keys(reference.packages));
  assert.deepEqual(exported.manifest.packages, reference.packages, 'KB reference package/version mismatch');
  const manifestSha256 = digest(exported.files.get('manifest.json'));
  assert.equal(manifestSha256, reference.manifestSha256, 'KB reference content mismatch; use the matching reviewed snapshot or rebuild references before a new task');
  const root = await realpath(location);
  const selected = new Set(Object.keys(reference.packages));
  return {
    kbRoot: root,
    manifestSha256,
    packages: reference.packages,
    catalogPath: join(root, 'catalog.json'),
    entries: [...kb.entries.values()].filter(entry => selected.has(entry.id.split('.')[0])).map(entry => {
      const path = `packages/${entry.id.split('.')[0]}/${entry.path}`;
      return { id: entry.id, path: join(root, path), sha256: exported.manifest.hashes[path],
        status: entry.status, kind: entry.kind, appliesTo: entry.appliesTo, relations: entry.relations };
    }),
    contentApprovalVerified: false,
    independentBehaviorVerified: false
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    assert(process.argv.length >= 3 && process.argv.length <= 4,
      'Usage: node knowledge-server/tools/knowledge-reference.mjs <absolute-server-root> [absolute-kb-root]');
    console.log(JSON.stringify(await resolveKnowledgeReference(process.argv[2], { kbRoot: process.argv[3] }), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ error: error.message }));
    process.exitCode = 1;
  }
}