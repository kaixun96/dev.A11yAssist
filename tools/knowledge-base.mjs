import assert from 'node:assert/strict';
import { readFile, readdir, lstat } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';

const commonFiles = ['README.md', 'schemas/package.schema.json', 'schemas/support-matrix.schema.json',
  'governance/contribution.md', 'evaluations/README.md'];
const digest = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';

export function knowledgePath(value) {
  assert(typeof value === 'string' && /^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(value),
    `Unsafe knowledge path: ${value}`);
  assert(value.split('/').every(part => part !== '.' && part !== '..'), `Unsafe knowledge path: ${value}`);
  return value;
}

async function read(root, path) {
  knowledgePath(path);
  let current = root;
  for (const part of path.split('/')) {
    current = join(current, part);
    assert(!(await lstat(current)).isSymbolicLink(), `Knowledge symlink: ${path}`);
  }
  return (await readFile(current, 'utf8')).replaceAll('\r\n', '\n');
}

async function filesUnder(root, prefix = '') {
  const files = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const path = prefix + entry.name;
    assert(!entry.isSymbolicLink(), `Knowledge symlink: ${path}`);
    if (entry.isDirectory()) files.push(...await filesUnder(root, path + '/'));
    else { assert(entry.isFile(), `Unsupported knowledge file: ${path}`); files.push(path); }
  }
  return files.sort();
}

export function validateKnowledgeLinks(files) {
  for (const [path, content] of files) {
    if (!path.endsWith('.md')) continue;
    for (const match of content.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
      const target = match[1];
      if (/^https?:\/\//.test(target)) continue;
      assert(!target.includes('#'), `Local knowledge anchors are unsupported; link to the complete topic: ${path}: ${target}`);
      assert(!/^[a-z][a-z0-9+.-]*:|[\\%?]/i.test(target), `Unsupported knowledge link: ${path}: ${target}`);
      const resolved = posix.normalize(posix.join(posix.dirname(path), target.split('#')[0]));
      assert(!resolved.startsWith('../') && files.has(resolved), `Broken knowledge link: ${path}: ${target}`);
      if (path.startsWith('packages/')) {
        const packageRoot = path.split('/').slice(0, 2).join('/') + '/';
        assert(resolved.startsWith(packageRoot), `Use an ID for cross-package knowledge link: ${path}: ${target}`);
      }
    }
  }
}

export async function loadKnowledgeBase(root, { verifyManifest = false } = {}) {
  assert((await lstat(root)).isDirectory() && !(await lstat(root)).isSymbolicLink(), 'Invalid KB root');
  const catalog = JSON.parse(await read(root, 'catalog.json'));
  assert.equal(catalog.schemaVersion, 1);
  assert.deepEqual(Object.keys(catalog).sort(), ['packages', 'schemaVersion']);
  assert(Array.isArray(catalog.packages) && catalog.packages.length, 'Missing KB packages');
  const schema = JSON.parse(await read(root, 'schemas/package.schema.json'));
  const ajv = new Ajv({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);
  const validateSupport = ajv.compile(JSON.parse(await read(root, 'schemas/support-matrix.schema.json')));
  const packages = new Map();
  const entries = new Map();
  const files = new Map();
  for (const path of commonFiles) files.set(path, await read(root, path));
  files.set('catalog.json', json(catalog));
  for (const reference of catalog.packages) {
    assert.deepEqual(Object.keys(reference).sort(), ['id', 'path']);
    assert.equal(reference.path, `packages/${reference.id}/package.json`);
    const content = await read(root, reference.path);
    const pkg = JSON.parse(content);
    assert(validate(pkg), `Invalid KB package ${reference.id}: ${JSON.stringify(validate.errors)}`);
    assert.equal(pkg.id, reference.id);
    assert(!packages.has(pkg.id), `Duplicate KB package: ${pkg.id}`);
    if (pkg.id === 'common') assert.equal(Object.keys(pkg.dependencies).length, 0, 'Common cannot depend on other packages');
    packages.set(pkg.id, pkg);
    files.set(reference.path, content);
    const sources = new Map();
    for (const source of pkg.sources) {
      assert(!sources.has(source.id), `Duplicate KB source: ${pkg.id}.${source.id}`);
      if (source.status === 'reviewed') assert(source.locator && source.revision, `Unpinned reviewed source: ${source.id}`);
      sources.set(source.id, source);
    }
    for (const entry of pkg.entries) {
      assert(entry.id.startsWith(pkg.id + '.'), `Wrong entry namespace: ${entry.id}`);
      assert(!entries.has(entry.id), `Duplicate KB entry: ${entry.id}`);
      assert(/\.(md|json)$/.test(entry.path), `Unsupported knowledge entry: ${entry.path}`);
      const path = `packages/${pkg.id}/${knowledgePath(entry.path)}`;
      assert(!files.has(path), `Duplicate KB path: ${path}`);
      for (const source of entry.sourceIds) assert(sources.has(source), `Unknown KB source: ${entry.id}: ${source}`);
      if (entry.status === 'approved') {
        assert(entry.owner !== 'unassigned' && entry.review && entry.review.reviewer !== 'unassigned', `Unreviewed approval: ${entry.id}`);
        assert(entry.sourceIds.length, `Missing approval source: ${entry.id}`);
        assert(entry.sourceIds.every(id => sources.get(id).status === 'reviewed'), `Pending approval source: ${entry.id}`);
      }
      if (entry.status === 'deprecated') assert(entry.deprecatedBy, `Missing replacement: ${entry.id}`);
      const body = await read(root, path);
      if (entry.path.endsWith('.json')) {
        assert(entry.kind === 'product-profile' && entry.dataSchema === 'support-matrix', `Missing structured entry schema: ${entry.id}`);
        const matrix = JSON.parse(body);
        assert(validateSupport(matrix), `Invalid support matrix: ${JSON.stringify(validateSupport.errors)}`);
        assert(matrix.sourceIds.every(id => entry.sourceIds.includes(id)), `Unknown support matrix source: ${entry.id}`);
        if (matrix.status === 'awaiting-official-source') assert.equal(matrix.products.length, 0, 'Pending support source cannot declare products');
        else assert(matrix.products.length && matrix.owner !== 'unassigned', 'Sourced matrix requires products and owner');
        const productIds = new Set();
        for (const product of matrix.products) {
          const productKey = JSON.stringify([product.id, product.version]);
          assert(!productIds.has(productKey), `Duplicate support product: ${product.id}`);
          productIds.add(productKey);
          const source = sources.get(product.source.id);
          assert(matrix.sourceIds.includes(product.source.id) && source?.status === 'reviewed' && source.authority === 'product-support', 'Unreviewed product support source');
          assert.equal(product.source.locator, source.locator, 'Support source locator mismatch');
          assert.equal(product.source.revision, source.revision, 'Support source revision mismatch');
          const ruleIds = new Set();
          for (const rule of product.rules) {
            assert(!ruleIds.has(rule.requirementId), `Duplicate support rule: ${rule.requirementId}`);
            ruleIds.add(rule.requirementId);
            if (rule.verificationStatus === 'verified') assert(rule.verificationEvidence, 'Verified support requires evidence reference');
          }
        }
      } else assert(!entry.dataSchema, `Data schema on Markdown entry: ${entry.id}`);
      files.set(path, body);
      entries.set(entry.id, entry);
    }
  }
  const closure = id => {
    const result = new Set();
    const visiting = new Set();
    const visit = key => {
      assert(!visiting.has(key), `Cyclic KB dependency: ${key}`);
      if (result.has(key)) return;
      const pkg = packages.get(key);
      assert(pkg, `Unknown KB package: ${key}`);
      visiting.add(key);
      for (const [dependency, version] of Object.entries(pkg.dependencies)) {
        assert.equal(packages.get(dependency)?.version, version, `KB dependency version mismatch: ${dependency}`);
        visit(dependency);
      }
      visiting.delete(key);
      result.add(key);
    };
    visit(id);
    return result;
  };
  for (const pkg of packages.values()) {
    const allowed = closure(pkg.id);
    for (const entry of pkg.entries) {
      for (const id of [...entry.relations, ...(entry.deprecatedBy ? [entry.deprecatedBy] : [])]) {
        assert(entries.has(id), `Unknown KB relation: ${entry.id}: ${id}`);
        assert(allowed.has(id.split('.')[0]), `Undeclared KB dependency: ${entry.id}: ${id}`);
      }
    }
  }
  const actual = (await filesUnder(root)).filter(path => path !== 'manifest.json');
  assert.deepEqual(actual, [...files.keys()].sort(), 'Undeclared or missing knowledge files');
  validateKnowledgeLinks(files);
  const kb = { catalog, packages, entries, files, closure };
  if (verifyManifest) {
    assert.equal(await read(root, 'manifest.json'), exportKnowledgeBase(kb, [...packages.keys()]).files.get('manifest.json'), 'Knowledge manifest drift');
  }
  return kb;
}

export function exportKnowledgeBase(kb, requested) {
  assert(Array.isArray(requested) && requested.length, 'Select at least one KB package');
  const selected = new Set(requested.flatMap(id => [...kb.closure(id)]));
  const catalog = { schemaVersion: 1, packages: kb.catalog.packages.filter(pkg => selected.has(pkg.id)) };
  const files = new Map([...kb.files].filter(([path]) => !path.startsWith('packages/') || selected.has(path.split('/')[1])));
  files.set('catalog.json', json(catalog));
  validateKnowledgeLinks(files);
  const hashes = Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b, 'en')).map(([path, body]) => [path, digest(body)]));
  const manifest = { schemaVersion: 1, packages: Object.fromEntries(catalog.packages.map(({ id }) => [id, kb.packages.get(id).version])), hashes };
  files.set('manifest.json', json(manifest));
  return { files, manifest };
}