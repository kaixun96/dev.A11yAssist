// Standalone, lazy host-side KB resolution. Importing this module performs no I/O.
// Installed reference hashes establish snapshot identity, not content approval or
// accessibility verification. No content, provider, shell, or MCP server is run here.
import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { lstat, mkdir, open, opendir, link, unlink } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, parse, posix, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 1000;
const METADATA_BYTES = 256 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[a-z][a-z0-9-]*$/;
const ENTRY_ID = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const COMMON_FILES = ['catalog.json', 'README.md', 'schemas/package.schema.json',
  'schemas/support-matrix.schema.json', 'governance/contribution.md', 'evaluations/README.md'];
const json = value => JSON.stringify(value, null, 2) + '\n';
const digest = value => createHash('sha256').update(value).digest('hex');
const own = (object, key) => Object.hasOwn(object, key);
const distributionUrl = hash => `https://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/${hash}.json`;

function object(value, label) {
  assert(value !== null && typeof value === 'object' && !Array.isArray(value), `Invalid ${label}: expected object`);
}

function keys(value, required, label, optional = []) {
  object(value, label);
  assert(required.every(key => own(value, key)) &&
    Object.keys(value).every(key => required.includes(key) || optional.includes(key)), `Invalid ${label} fields`);
}

function text(value, label) {
  assert(typeof value === 'string' && value.length > 0 && value.isWellFormed(), `Invalid ${label}: expected nonempty Unicode text`);
}

function match(value, pattern, label) {
  assert(typeof value === 'string' && pattern.test(value), `Invalid ${label}`);
}

function strings(value, label, minimum = 0) {
  assert(Array.isArray(value) && value.length >= minimum && value.length <= MAX_FILES, `Invalid ${label} list`);
  value.forEach(item => text(item, label));
  assert.equal(new Set(value).size, value.length, `Duplicate ${label}`);
}

function choice(value, allowed, label) {
  assert(allowed.includes(value), `Invalid ${label}: ${value}`);
}

function safePath(value) {
  assert(typeof value === 'string' && value.length <= 2048 &&
    /^[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(value), `Unsafe KB path: ${value}`);
  for (const part of value.split('/')) {
    assert(part.length <= 255 && part !== '.' && part !== '..' && !part.endsWith('.') &&
      !/^(?:con|prn|aux|nul|com[0-9]|lpt[0-9])(?:\.|$)/i.test(part), `Unsafe KB path segment: ${value}`);
  }
  return value;
}

// Check directory prefixes too: Foo/a and foo/b collide on Windows, as do a
// declared file named Foo and a directory named Foo containing another file.
function validatePaths(paths) {
  assert(paths.length > 0 && paths.length <= MAX_FILES, `KB file count must be 1..${MAX_FILES}`);
  const seen = new Map();
  for (const path of paths) {
    safePath(path);
    assert(path.toLowerCase() !== 'manifest.json', 'manifest.json must not appear in KB artifact files/hashes');
    const parts = path.split('/');
    for (let i = 1; i <= parts.length; i++) {
      const prefix = parts.slice(0, i).join('/');
      const type = i === parts.length ? 'file' : 'directory';
      const previous = seen.get(prefix.toLowerCase());
      assert(!previous || (previous.path === prefix && previous.type === type && type === 'directory'),
        `KB path case collision, duplicate, or file/directory conflict: ${path}`);
      seen.set(prefix.toLowerCase(), { path: prefix, type });
    }
  }
}

function versions(value, label) {
  object(value, label);
  const ids = Object.keys(value);
  assert(ids.length > 0 && ids.length <= MAX_FILES, `Invalid ${label} count`);
  for (const id of ids) {
    match(id, ID, `${label} package ID`);
    safePath(id);
    match(value[id], VERSION, `${label} version: ${id}`);
  }
}

export function validateKnowledgeReference(reference) {
  keys(reference, ['schemaVersion', 'kind', 'rootEnv', 'developmentRoot', 'packages',
    'manifestSha256', 'distribution'], 'KB reference');
  assert.equal(reference.schemaVersion, 1, 'Unsupported KB reference schemaVersion');
  assert.equal(reference.kind, 'shared-accessibility-kb', 'Unsupported KB reference kind');
  assert.equal(reference.rootEnv, 'A11Y_ASSIST_KB_ROOT', 'Unsupported KB reference rootEnv');
  assert.equal(reference.developmentRoot, '../accessibility-kb', 'Unsupported KB developmentRoot');
  versions(reference.packages, 'KB reference packages');
  match(reference.manifestSha256, HASH, 'KB reference manifestSha256');
  keys(reference.distribution, ['url', 'sha256'], 'KB reference distribution');
  assert.equal(reference.distribution.url, distributionUrl(reference.manifestSha256), 'Unsupported KB distribution URL');
  match(reference.distribution.sha256, HASH, 'KB distribution sha256');
}

function absolutePath(value, label) {
  assert(typeof value === 'string' && value.length > 0 && !value.includes('\0') && isAbsolute(value),
    `${label} must be a nonempty absolute path`);
  // Windows root-relative paths (\foo) depend on the working drive, and device
  // namespaces bypass normal path interpretation. Neither is a host root.
  if (process.platform === 'win32') {
    assert(/^(?:[a-z]:[\\/]|\\\\(?![?.]\\)[^\\/]+[\\/][^\\/]+(?:[\\/]|$))/i.test(value),
      `${label} must be a fully qualified non-device absolute path`);
  }
  assert(!value.slice(parse(value).root.length).split(/[\\/]/).some(part => part === '.' || part === '..'),
    `${label} must not contain dot segments`);
  return resolve(value);
}

// Check all ancestors rather than realpath-ing an untrusted root and silently
// accepting a symlink. mkdir is intentionally nonrecursive and race-checked.
async function directory(root, { create = false, missing = false } = {}) {
  root = absolutePath(root, 'Filesystem root');
  const anchor = parse(root).root;
  let current = anchor;
  const paths = [anchor];
  for (const part of root.slice(anchor.length).split(sep).filter(Boolean)) {
    current = join(current, part);
    paths.push(current);
  }
  for (const path of paths) {
    let stat;
    try { stat = await lstat(path); } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      if (!create) {
        if (missing) return false;
        throw new Error(`Missing KB directory: ${path}`, { cause: error });
      }
      try { await mkdir(path, { mode: 0o700 }); } catch (mkdirError) {
        if (mkdirError.code !== 'EEXIST') throw mkdirError;
      }
      stat = await lstat(path);
    }
    assert(!stat.isSymbolicLink() && stat.isDirectory(), `KB directory is a symlink or not a directory: ${path}`);
  }
  return true;
}

function sameFile(a, b) {
  return a.dev === b.dev && a.ino === b.ino;
}

async function fileStat(root, path) {
  safePath(path);
  await directory(root);
  const parts = path.split('/');
  let current = root;
  let stat;
  for (let index = 0; index < parts.length; index++) {
    current = join(current, parts[index]);
    stat = await lstat(current);
    assert(!stat.isSymbolicLink(), `KB symlink rejected: ${current}`);
    assert(index === parts.length - 1 ? stat.isFile() : stat.isDirectory(), `Unsupported KB path type: ${current}`);
  }
  return stat;
}

async function readBytes(root, path, limit = MAX_BYTES) {
  const before = await fileStat(root, path);
  assert(before.size <= limit, `KB file exceeds ${limit} byte limit: ${path}`);
  const handle = await open(join(root, ...path.split('/')), constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
  try {
    const opened = await handle.stat();
    assert(opened.isFile() && sameFile(before, opened) && opened.size <= limit, `KB file changed while opening: ${path}`);
    const chunks = [];
    let size = 0;
    for (;;) {
      const buffer = Buffer.allocUnsafe(Math.min(64 * 1024, limit - size + 1));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
      if (!bytesRead) break;
      size += bytesRead;
      assert(size <= limit, `KB file exceeds ${limit} byte limit: ${path}`);
      chunks.push(buffer.subarray(0, bytesRead));
    }
    const after = await fileStat(root, path);
    // Publishing/removing a hard-link name changes ctime, not content. Concurrent
    // cache publishers may unlink their private names while this reader is open.
    // Identity, size, mtime and the mandatory snapshot hashes protect the read.
    assert(sameFile(opened, after) && after.size === size && opened.size === size &&
      opened.mtimeMs === after.mtimeMs, `KB file changed while reading: ${path}`);
    return Buffer.concat(chunks, size);
  } finally { await handle.close(); }
}

function utf8(bytes, label) {
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch (error) { throw new Error(`Invalid UTF-8 in ${label}`, { cause: error }); }
}

function parseJson(body, label) {
  try { return JSON.parse(body); }
  catch (error) { throw new Error(`Invalid JSON in ${label}: ${error.message}`, { cause: error }); }
}

async function readJson(root, path, limit = METADATA_BYTES) {
  return parseJson(utf8(await readBytes(root, path, limit), path), path);
}

export async function findDevelopmentKbRoot(pluginRoot) {
  try {
    const server = absolutePath(pluginRoot, 'Server root');
    assert.equal(basename(server), 'knowledge-server');
    assert.equal((await readJson(server, 'package.json')).name, '@a11y-assist/knowledge-server');
    const repository = dirname(server);
    assert.equal((await readJson(repository, 'package.json')).name, '@a11y-assist/plugins');
    await fileStat(repository, 'src/catalog.json');
    // Repository and standalone server identity, not KB existence, choose
    // development mode. Do not inspect existing plugins or their manifests.
    // A missing or corrupt KB in a validated checkout must fail, not download.
    return join(repository, 'accessibility-kb');
  } catch { return null; }
}

function validateManifest(manifest) {
  keys(manifest, ['schemaVersion', 'packages', 'hashes'], 'KB manifest');
  assert.equal(manifest.schemaVersion, 1, 'Unsupported KB manifest schemaVersion');
  versions(manifest.packages, 'KB manifest packages');
  object(manifest.hashes, 'KB manifest hashes');
  const paths = Object.keys(manifest.hashes);
  validatePaths(paths);
  assert.deepEqual(paths, [...paths].sort((a, b) => a.localeCompare(b, 'en')), 'KB manifest hashes are not sorted');
  for (const path of paths) {
    match(manifest.hashes[path], HASH, `KB content hash: ${path}`);
    if (path.startsWith('packages/')) {
      assert(path.split('/').length >= 3 && own(manifest.packages, path.split('/')[1]), `Undeclared KB package file: ${path}`);
    }
  }
}

function validateCatalog(catalog, packageVersions) {
  keys(catalog, ['schemaVersion', 'packages'], 'KB catalog');
  assert.equal(catalog.schemaVersion, 1, 'Unsupported KB catalog schemaVersion');
  assert(Array.isArray(catalog.packages) && catalog.packages.length > 0 && catalog.packages.length <= MAX_FILES, 'Invalid KB catalog packages');
  const ids = new Set();
  for (const descriptor of catalog.packages) {
    keys(descriptor, ['id', 'path'], 'KB catalog descriptor');
    match(descriptor.id, ID, 'KB catalog package ID');
    assert(!ids.has(descriptor.id), `Duplicate KB catalog package: ${descriptor.id}`);
    ids.add(descriptor.id);
    assert.equal(descriptor.path, `packages/${descriptor.id}/package.json`, 'Invalid KB catalog package path');
    safePath(descriptor.path);
  }
  assert.deepEqual([...ids].sort(), Object.keys(packageVersions).sort(), 'KB catalog must contain exactly the manifest packages');
}

function validateSource(source, packageId) {
  keys(source, ['id', 'authority', 'status', 'locator', 'revision', 'note'], `KB source in ${packageId}`);
  match(source.id, ID, 'KB source ID');
  choice(source.authority, ['company-requirements', 'normative-standard', 'informative-guidance',
    'component-contract', 'product-support', 'historical-reference'], 'KB source authority');
  choice(source.status, ['connection-pending', 'review-pending', 'historical', 'reviewed'], 'KB source status');
  for (const field of ['locator', 'revision']) if (source[field] !== null) text(source[field], `KB source ${field}`);
  text(source.note, 'KB source note');
  if (source.status === 'reviewed') assert(source.locator && source.revision, `Unpinned reviewed KB source: ${packageId}.${source.id}`);
}

function validateEntry(entry, pkg, sources) {
  keys(entry, ['id', 'path', 'kind', 'status', 'owner', 'appliesTo', 'sourceIds', 'relations'],
    `KB entry in ${pkg.id}`, ['deprecatedBy', 'dataSchema', 'review']);
  match(entry.id, ENTRY_ID, 'KB entry ID');
  assert(entry.id.startsWith(`${pkg.id}.`), `Wrong KB entry namespace: ${entry.id}`);
  safePath(entry.path);
  assert(/\.(md|json)$/.test(entry.path), `Unsupported KB entry path: ${entry.path}`);
  choice(entry.kind, ['topic', 'requirement-guidance', 'implementation-contract', 'analysis',
    'verification', 'case', 'procedure', 'product-profile'], 'KB entry kind');
  choice(entry.status, ['draft', 'approved', 'deprecated'], 'KB entry status');
  text(entry.owner, 'KB entry owner');
  strings(entry.appliesTo, 'KB entry appliesTo', 1);
  strings(entry.sourceIds, 'KB entry sourceIds');
  strings(entry.relations, 'KB entry relations');
  for (const source of entry.sourceIds) assert(sources.has(source), `Unknown KB source: ${entry.id}: ${source}`);
  for (const id of entry.relations) match(id, ENTRY_ID, `KB relation for ${entry.id}`);
  if (own(entry, 'deprecatedBy')) match(entry.deprecatedBy, ENTRY_ID, 'KB replacement ID');
  if (own(entry, 'review')) {
    keys(entry.review, ['reviewer', 'date', 'evidence'], 'KB entry review');
    text(entry.review.reviewer, 'KB reviewer');
    match(entry.review.date, /^\d{4}-\d{2}-\d{2}$/, 'KB review date');
    text(entry.review.evidence, 'KB review evidence');
  }
  if (entry.status === 'approved') {
    assert(entry.owner !== 'unassigned' && entry.review && entry.review.reviewer !== 'unassigned', `Unreviewed KB approval: ${entry.id}`);
    assert(entry.sourceIds.length && entry.sourceIds.every(id => sources.get(id).status === 'reviewed'), `Missing reviewed KB approval sources: ${entry.id}`);
  }
  if (entry.status === 'deprecated') assert(entry.deprecatedBy, `Missing KB replacement: ${entry.id}`);
  if (entry.path.endsWith('.json')) {
    assert(entry.kind === 'product-profile' && entry.dataSchema === 'support-matrix', `Missing structured KB entry schema: ${entry.id}`);
  } else assert(!own(entry, 'dataSchema'), `Data schema on Markdown KB entry: ${entry.id}`);
}

function validateSupportMatrix(matrix, entry, sources) {
  keys(matrix, ['schemaVersion', 'status', 'owner', 'sourceIds', 'products'], 'KB support matrix');
  assert.equal(matrix.schemaVersion, 1, 'Unsupported KB support matrix schemaVersion');
  choice(matrix.status, ['awaiting-official-source', 'sourced'], 'KB support matrix status');
  text(matrix.owner, 'KB support matrix owner');
  strings(matrix.sourceIds, 'KB support matrix sourceIds', 1);
  assert(matrix.sourceIds.every(id => entry.sourceIds.includes(id)), `Unknown KB support matrix source: ${entry.id}`);
  assert(Array.isArray(matrix.products) && matrix.products.length <= MAX_FILES, 'Invalid KB support products');
  if (matrix.status === 'awaiting-official-source') assert.equal(matrix.products.length, 0, 'Pending KB support source cannot declare products');
  else assert(matrix.products.length && matrix.owner !== 'unassigned', 'Sourced KB support matrix requires products and owner');
  const products = new Set();
  for (const product of matrix.products) {
    keys(product, ['id', 'version', 'source', 'rules'], 'KB support product');
    text(product.id, 'KB support product ID');
    text(product.version, 'KB support product version');
    const key = JSON.stringify([product.id, product.version]);
    assert(!products.has(key), `Duplicate KB support product: ${product.id}`);
    products.add(key);
    keys(product.source, ['id', 'locator', 'revision'], 'KB support product source');
    for (const field of ['id', 'locator', 'revision']) text(product.source[field], `KB product source ${field}`);
    const source = sources.get(product.source.id);
    assert(matrix.sourceIds.includes(product.source.id) && source?.status === 'reviewed' &&
      source.authority === 'product-support', `Unreviewed KB product support source: ${product.id}`);
    assert.equal(product.source.locator, source.locator, 'KB support source locator mismatch');
    assert.equal(product.source.revision, source.revision, 'KB support source revision mismatch');
    assert(Array.isArray(product.rules) && product.rules.length > 0 && product.rules.length <= MAX_FILES, 'Invalid KB support rules');
    const rules = new Set();
    for (const rule of product.rules) {
      keys(rule, ['requirementId', 'applicability', 'supportStatus', 'verificationStatus', 'basis',
        'verificationEvidence', 'exception'], 'KB support rule');
      text(rule.requirementId, 'KB support requirement ID');
      assert(!rules.has(rule.requirementId), `Duplicate KB support rule: ${rule.requirementId}`);
      rules.add(rule.requirementId);
      choice(rule.applicability, ['applicable', 'not-applicable', 'undetermined'], 'KB support applicability');
      choice(rule.supportStatus, ['supported', 'partial', 'unsupported', 'unknown'], 'KB support status');
      choice(rule.verificationStatus, ['verified', 'unverified', 'stale'], 'KB support verification status');
      text(rule.basis, 'KB support basis');
      if (rule.verificationEvidence !== null) text(rule.verificationEvidence, 'KB verification evidence');
      if (rule.verificationStatus === 'verified') assert(rule.verificationEvidence, 'Verified KB support requires evidence');
      if (rule.exception !== null) {
        keys(rule.exception, ['reference', 'scope', 'expires'], 'KB support exception');
        text(rule.exception.reference, 'KB support exception reference');
        text(rule.exception.scope, 'KB support exception scope');
        match(rule.exception.expires, /^\d{4}-\d{2}-\d{2}$/, 'KB support exception expiry');
      }
    }
  }
}

function validateLinks(files) {
  for (const [path, content] of files) {
    if (!path.endsWith('.md')) continue;
    for (const match of content.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1];
      if (/^https?:\/\//.test(target)) continue;
      assert(!target.includes('#') && !/^[a-z][a-z0-9+.-]*:|[\\%?]/i.test(target), `Unsupported local KB link: ${path}: ${target}`);
      const resolved = posix.normalize(posix.join(posix.dirname(path), target));
      assert(!resolved.startsWith('../') && files.has(resolved), `Broken KB link: ${path}: ${target}`);
      if (path.startsWith('packages/')) {
        assert(resolved.startsWith(path.split('/').slice(0, 2).join('/') + '/'), `Use an ID for cross-package KB links: ${path}: ${target}`);
      }
    }
  }
}

function selectedContents(files, reference) {
  validatePaths([...files.keys()]);
  for (const path of COMMON_FILES) assert(files.has(path), `Missing required KB file: ${path}`);
  const catalog = parseJson(files.get('catalog.json'), 'KB catalog');
  validateCatalog(catalog, reference.packages);
  assert.equal(files.get('catalog.json'), json(catalog), 'Selected KB catalog is not the canonical export');
  const packages = new Map();
  const entries = new Map();
  const sources = {};
  const declared = new Set();
  for (const descriptor of catalog.packages) {
    assert(files.has(descriptor.path), `Missing selected KB descriptor: ${descriptor.path}`);
    const pkg = parseJson(files.get(descriptor.path), descriptor.path);
    keys(pkg, ['schemaVersion', 'id', 'version', 'dependencies', 'sources', 'entries'], 'KB package');
    assert.equal(pkg.schemaVersion, 1, 'Unsupported KB package schemaVersion');
    assert.equal(pkg.id, descriptor.id, 'KB descriptor ID mismatch');
    assert.equal(pkg.version, reference.packages[pkg.id], `KB package/version mismatch: ${pkg.id}`);
    object(pkg.dependencies, 'KB package dependencies');
    for (const [id, version] of Object.entries(pkg.dependencies)) {
      match(id, ID, 'KB dependency ID');
      match(version, VERSION, 'KB dependency version');
      assert(own(reference.packages, id) && reference.packages[id] === version, `Missing KB dependency or exact version mismatch: ${pkg.id}: ${id}`);
    }
    if (pkg.id === 'common') assert.equal(Object.keys(pkg.dependencies).length, 0, 'Common KB package cannot have dependencies');
    assert(Array.isArray(pkg.sources) && pkg.sources.length <= MAX_FILES, 'Invalid KB sources');
    const sourceMap = new Map();
    for (const source of pkg.sources) {
      validateSource(source, pkg.id);
      assert(!sourceMap.has(source.id), `Duplicate KB source: ${pkg.id}.${source.id}`);
      sourceMap.set(source.id, source);
    }
    // Define own properties even for valid IDs such as "constructor".
    Object.defineProperty(sources, pkg.id, { value: pkg.sources, enumerable: true, writable: true, configurable: true });
    assert(Array.isArray(pkg.entries) && pkg.entries.length > 0 && pkg.entries.length <= MAX_FILES, 'Invalid KB entries');
    declared.add(descriptor.path);
    for (const entry of pkg.entries) {
      validateEntry(entry, pkg, sourceMap);
      assert(!entries.has(entry.id), `Duplicate KB entry: ${entry.id}`);
      const path = `packages/${pkg.id}/${entry.path}`;
      assert(!declared.has(path), `Duplicate KB entry path: ${path}`);
      assert(files.has(path), `Missing declared KB entry file: ${path}`);
      declared.add(path);
      if (entry.path.endsWith('.json')) validateSupportMatrix(parseJson(files.get(path), path), entry, sourceMap);
      entries.set(entry.id, { ...entry, path });
    }
    packages.set(pkg.id, pkg);
  }
  for (const path of files.keys()) {
    if (path.startsWith('packages/')) assert(declared.has(path), `Extra undeclared or unselected KB package content: ${path}`);
  }
  const closures = new Map();
  const visiting = new Set();
  const closure = id => {
    assert(!visiting.has(id), `Cyclic KB dependency: ${id}`);
    if (closures.has(id)) return closures.get(id);
    const pkg = packages.get(id);
    assert(pkg, `Unknown selected KB package: ${id}`);
    visiting.add(id);
    const result = new Set([id]);
    for (const dependency of Object.keys(pkg.dependencies)) for (const member of closure(dependency)) result.add(member);
    visiting.delete(id);
    closures.set(id, result);
    return result;
  };
  for (const pkg of packages.values()) {
    const allowed = closure(pkg.id);
    for (const entry of pkg.entries) {
      for (const id of [...entry.relations, ...(entry.deprecatedBy ? [entry.deprecatedBy] : [])]) {
        assert(entries.has(id), `Unknown selected KB relation: ${entry.id}: ${id}`);
        assert(allowed.has(id.split('.')[0]), `Undeclared KB relation dependency: ${entry.id}: ${id}`);
      }
    }
  }
  validateLinks(files);
  const manifest = {
    schemaVersion: 1,
    packages: Object.fromEntries(catalog.packages.map(({ id }) => [id, packages.get(id).version])),
    hashes: Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([path, body]) => [path, digest(body)]))
  };
  assert.equal(digest(json(manifest)), reference.manifestSha256, 'KB reference manifest/content mismatch; obtain the matching pinned snapshot');
  return { manifest, entries: [...entries.values()].map(({ id, path, kind, status, appliesTo, relations, sourceIds }) =>
    ({ id, path, kind, status, appliesTo, relations, sourceIds })), sources };
}

function validateArtifact(bytes, reference) {
  assert(bytes.byteLength <= MAX_BYTES, `KB distribution exceeds ${MAX_BYTES} byte limit`);
  assert.equal(digest(bytes), reference.distribution.sha256, 'KB distribution SHA-256 mismatch');
  const artifact = parseJson(utf8(bytes, 'KB distribution'), 'KB distribution');
  keys(artifact, ['schemaVersion', 'manifest', 'files'], 'KB distribution artifact');
  assert.equal(artifact.schemaVersion, 1, 'Unsupported KB distribution schemaVersion');
  validateManifest(artifact.manifest);
  assert.deepEqual(artifact.manifest.packages, reference.packages, 'KB distribution package/version mismatch');
  assert.equal(digest(json(artifact.manifest)), reference.manifestSha256, 'KB distribution manifest SHA-256 mismatch');
  object(artifact.files, 'KB distribution files');
  validatePaths(Object.keys(artifact.files));
  assert.deepEqual(Object.keys(artifact.files).sort(), Object.keys(artifact.manifest.hashes).sort(), 'KB distribution file list mismatch');
  const files = new Map();
  for (const [path, body] of Object.entries(artifact.files)) {
    assert(typeof body === 'string' && body.isWellFormed() && !body.includes('\r\n'), `KB file must contain normalized Unicode text: ${path}`);
    assert.equal(digest(body), artifact.manifest.hashes[path], `KB file SHA-256 mismatch: ${path}`);
    files.set(path, body);
  }
  const selected = selectedContents(files, reference);
  assert.equal(json(selected.manifest), json(artifact.manifest), 'KB distribution manifest is not the canonical selected export');
  return { ...selected, files };
}

async function inventory(root) {
  const files = [];
  let nodes = 0;
  const visit = async prefix => {
    const path = prefix ? join(root, ...prefix.split('/')) : root;
    await directory(path);
    for await (const entry of await opendir(path)) {
      assert(++nodes <= MAX_FILES * 4, 'KB directory inventory exceeds limit');
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      safePath(relative);
      const stat = await lstat(join(path, entry.name));
      assert(!stat.isSymbolicLink(), `KB symlink rejected: ${relative}`);
      if (stat.isDirectory()) await visit(relative);
      else {
        assert(stat.isFile(), `Unsupported KB file type: ${relative}`);
        files.push(relative);
        assert(files.length <= MAX_FILES + 1, 'KB file inventory exceeds limit');
      }
    }
  };
  await visit('');
  return files;
}

async function loadLocal(root, reference) {
  root = absolutePath(root, 'Configured/development KB root');
  const full = await readJson(root, 'manifest.json', MAX_BYTES);
  validateManifest(full);
  for (const [id, version] of Object.entries(reference.packages)) {
    assert(own(full.packages, id) && full.packages[id] === version, `Local KB package/version mismatch: ${id}`);
  }
  const advertised = Object.keys(full.hashes);
  // Unselected packages may exist, but no unadvertised on-disk content is hidden
  // by the selection. Unselected bodies need not be read: the selected pin is
  // the authenticity boundary, not the untrusted full-source manifest.
  assert.deepEqual((await inventory(root)).sort(), [...advertised, 'manifest.json'].sort(), 'Local KB contains undeclared or missing files');
  const files = new Map();
  let total = 0;
  for (const path of advertised) {
    if (path.startsWith('packages/') && !own(reference.packages, path.split('/')[1])) continue;
    const bytes = await readBytes(root, path, MAX_BYTES - total);
    total += bytes.byteLength;
    let body = utf8(bytes, path).replaceAll('\r\n', '\n');
    // loadKnowledgeBase/exportKnowledgeBase serialize the catalog rather than
    // hashing its source formatting, including for the full-source manifest.
    if (path === 'catalog.json') body = json(parseJson(body, 'local KB catalog'));
    assert.equal(digest(body), full.hashes[path], `Local KB file SHA-256 mismatch: ${path}`);
    files.set(path, body);
  }
  assert(files.has('catalog.json'), 'Missing local KB catalog');
  const catalog = parseJson(files.get('catalog.json'), 'local KB catalog');
  validateCatalog(catalog, full.packages);
  files.set('catalog.json', json({ schemaVersion: 1, packages: catalog.packages.filter(pkg => own(reference.packages, pkg.id)) }));
  const selected = selectedContents(files, reference);
  assert(Buffer.byteLength(json({ schemaVersion: 1, manifest: selected.manifest, files: Object.fromEntries(files) })) <= MAX_BYTES,
    'Selected local KB exceeds distribution artifact size limit');
  return { ...selected, files };
}

function cacheRoot(env) {
  if (env.A11Y_ASSIST_KB_CACHE_ROOT !== undefined) return absolutePath(env.A11Y_ASSIST_KB_CACHE_ROOT, 'A11Y_ASSIST_KB_CACHE_ROOT');
  if (process.platform === 'win32') return join(absolutePath(env.LOCALAPPDATA, 'LOCALAPPDATA'), 'A11yAssist', 'knowledge');
  return join(absolutePath(homedir(), 'Home directory'), '.cache', 'a11y-assist', 'knowledge');
}

async function readCache(root, name, reference, required = false) {
  if (!await directory(root, { missing: !required })) return null;
  // Only absence at this initial lookup is a miss. Disappearance during a read,
  // malformed bytes, and symlinks are explicit failures, never repair requests.
  try { await lstat(join(root, name)); } catch (error) {
    if (!required && error.code === 'ENOENT') return null;
    throw error;
  }
  try { return validateArtifact(await readBytes(root, name), reference); }
  catch (error) { throw new Error(`Invalid KB cache ${join(root, name)}; cache was not overwritten: ${error.message}`, { cause: error }); }
}

async function withAbort(promise, signal) {
  signal.throwIfAborted();
  let listener;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      listener = () => reject(signal.reason);
      signal.addEventListener('abort', listener, { once: true });
      if (signal.aborted) listener();
    })]);
  } finally { if (listener) signal.removeEventListener('abort', listener); }
}

async function download(reference, fetchImpl) {
  assert(typeof fetchImpl === 'function', 'KB download is unavailable: host fetch implementation is missing');
  const signal = AbortSignal.timeout(15_000);
  let response;
  let reader;
  let completed = false;
  try {
    response = await withAbort(Promise.resolve().then(() => fetchImpl(distributionUrl(reference.manifestSha256), {
      method: 'GET', redirect: 'error', credentials: 'omit', referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' }, signal
    })), signal);
    assert(response && response.status === 200, `KB download HTTP status: ${response?.status ?? 'missing'}`);
    assert(!response.redirected && (!response.url || response.url === distributionUrl(reference.manifestSha256)), 'KB distribution redirects are forbidden');
    const encoding = response.headers.get('content-encoding');
    assert(!encoding || encoding.toLowerCase() === 'identity', 'Encoded KB distribution responses are unsupported; expected identity bytes');
    const lengthHeader = response.headers.get('content-length');
    let length;
    if (lengthHeader !== null) {
      assert(/^\d+$/.test(lengthHeader), 'Invalid KB distribution Content-Length');
      length = Number(lengthHeader);
      assert(Number.isSafeInteger(length) && length <= MAX_BYTES, 'KB distribution Content-Length exceeds 8 MiB');
    }
    assert(response.body && typeof response.body.getReader === 'function', 'KB download has no readable response stream');
    reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await withAbort(reader.read(), signal);
      if (done) break;
      assert(value instanceof Uint8Array, 'Invalid KB response stream chunk');
      size += value.byteLength;
      assert(size <= MAX_BYTES && (length === undefined || size <= length), 'KB download exceeds byte limit or Content-Length');
      chunks.push(Buffer.from(value));
    }
    if (length !== undefined) assert.equal(size, length, 'KB download Content-Length mismatch');
    completed = true;
    return Buffer.concat(chunks, size);
  } catch (error) {
    throw new Error(`KB HTTPS download failed: ${error.message}`, { cause: error });
  } finally {
    if (!completed) {
      // Cancellation is best-effort cleanup, not a second unbounded await.
      try { Promise.resolve(reader ? reader.cancel() : response?.body?.cancel()).catch(() => {}); } catch { /* Already closed. */ }
    }
    try { reader?.releaseLock(); } catch { /* An aborted injected reader may still have a pending read. */ }
  }
}

async function publishCache(root, name, bytes, reference) {
  await directory(root, { create: true });
  const temporary = `.${name}.${randomUUID()}.tmp`;
  const temporaryPath = join(root, temporary);
  const handle = await open(temporaryPath, 'wx', 0o600);
  const identity = await handle.stat();
  let closed = false;
  try {
    await handle.writeFile(bytes);
    await handle.sync();
    await handle.close();
    closed = true;
    await directory(root);
    assert(sameFile(identity, await fileStat(root, temporary)), 'KB private cache temporary file was replaced');
    let winner = false;
    try { await link(temporaryPath, join(root, name)); } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      winner = true;
    }
    // Atomic no-replace publication: also validate an EEXIST winner, never
    // overwrite or delete it, and re-read our own publication before returning.
    return { snapshot: await readCache(root, name, reference, true), origin: winner ? 'cache' : 'download' };
  } finally {
    if (!closed) await handle.close();
    await directory(root);
    let stat;
    try { stat = await lstat(temporaryPath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (stat) {
      assert(!stat.isSymbolicLink() && sameFile(identity, stat), 'KB temporary path changed; refusing to remove a foreign file');
      await unlink(temporaryPath);
    }
  }
}

/**
 * Load a fresh, verified selected snapshot from a standalone server root;
 * no process-global body cache. pluginRoot is retained as an API parameter name.
 * fetchImpl is host/test injection only and must never be exposed as MCP input.
 * Files and entry paths are KB-relative; manifest.json is not a content file.
 * Local content is LF-normalized and authenticated by the selected manifest pin;
 * cache/download content additionally requires the raw distribution byte pin.
 */
export async function loadKnowledgeSnapshot(pluginRoot, { kbRoot, env = process.env, fetchImpl = globalThis.fetch } = {}) {
  pluginRoot = absolutePath(pluginRoot, 'Server root');
  const reference = await readJson(pluginRoot, 'references/knowledge.json');
  validateKnowledgeReference(reference);
  object(env, 'KB host environment');
  const configured = kbRoot !== undefined ? kbRoot : env[reference.rootEnv];
  let snapshot;
  let origin;
  if (configured !== undefined) {
    snapshot = await loadLocal(absolutePath(configured, 'Configured KB root'), reference);
    origin = 'configured';
  } else {
    const development = await findDevelopmentKbRoot(pluginRoot);
    if (development !== null) {
      snapshot = await loadLocal(development, reference);
      origin = 'development';
    } else {
      const root = cacheRoot(env);
      const name = `${reference.manifestSha256}.json`;
      snapshot = await readCache(root, name, reference);
      origin = 'cache';
      if (snapshot === null) {
        const bytes = await download(reference, fetchImpl);
        validateArtifact(bytes, reference);
        ({ snapshot, origin } = await publishCache(root, name, bytes, reference));
      }
    }
  }
  return { reference, ...snapshot, origin, contentApprovalVerified: false, independentBehaviorVerified: false };
}