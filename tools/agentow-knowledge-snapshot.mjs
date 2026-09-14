import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pruneGenerated } from './generated-tree.mjs';

export const snapshotDirectory = 'integrations/agentow/knowledge';
const marker = /a11y|accessib|aria[- ]|screen.?reader|spds|fluent|wcag|nvda|narrator|voice.?access|keyboard|contrast|focus|evaluator/i;
const thirdPartyPrefix = 'copilot/skills/vercel-react-best-practices/';
export const digest = value => createHash('sha256').update(value).digest('hex');
const normalize = value => value.replaceAll('\r\n', '\n');

export function safeRelative(path) {
  assert(typeof path === 'string' && /^[A-Za-z0-9._/-]+$/.test(path) &&
    !path.startsWith('/') && path.split('/').every(part => part && part !== '.' && part !== '..'),
  `Unsafe snapshot path: ${path}`);
  return path;
}

export function inventorySources(sources, commit, tree) {
  assert.match(commit, /^[a-f0-9]{40}$/);
  assert.match(tree, /^[a-f0-9]{40}$/);
  const byPath = new Map();
  const copied = new Map();
  const records = sources.map(source => {
    safeRelative(source.path);
    assert(!byPath.has(source.path), `Duplicate source: ${source.path}`);
    assert(['100644', '100755'].includes(source.mode), `Unsupported source mode: ${source.path}`);
    assert.match(source.oid, /^[a-f0-9]{40}$/);
    const content = normalize(source.content);
    const matched = marker.test(source.path) || marker.test(content);
    const generated = /(?:^|\/)dist\//.test(source.path);
    const external = source.path.startsWith(thirdPartyPrefix) || generated;
    const document = /\.md$/i.test(source.path);
    const selected = !external && (document || matched);
    const record = {
      path: source.path, blob: source.oid, sha256: digest(content),
      document, accessibilityMarker: matched,
      disposition: external ? 'external-reference' : selected ? 'snapshot' : 'outside-knowledge-scope',
      ...(external ? { referenceKind: generated ? 'generated-build-output' : 'vendored-performance' } : {}),
      reason: external
        ? generated
          ? 'Generated runtime bundle/source map with bundled dependencies, not knowledge authoring source; authored source is inventoried separately and this exact original remains linked.'
          : 'Vendored third-party React performance material; retained at its original licensed source, not republished.'
        : document
          ? 'Complete first-party document, including surrounding context; no keyword-only excerpting.'
          : matched
            ? 'Accessibility-related metadata or implementation/test reference; inert source text, not an executable capability.'
            : 'Non-document source with no accessibility marker; inventoried explicitly, not represented as migrated functionality.',
      sourceUrl: `https://github.com/kaixun96/dev.AgentOW/blob/${commit}/${source.path}`
    };
    if (selected) {
      record.target = `snapshot/${source.path}.source.${document ? 'md' : 'txt'}`;
      copied.set(record.target, content);
    }
    byPath.set(source.path, { record, content });
    return record;
  });

  // Resolve local document links against the complete tree, including non-keyword references.
  let changed;
  do {
    changed = false;
    for (const { record, content } of byPath.values()) {
      if (record.disposition !== 'snapshot' || !record.document) continue;
      for (const match of content.matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
        const link = match[1].split('#')[0];
        if (!link || /^(?:[a-z]+:|\/\/)/i.test(link)) continue;
        const relative = posix.normalize(posix.join(posix.dirname(record.path), link));
        const dependency = byPath.get(relative) ?? byPath.get(link);
        if (!dependency || dependency.record.disposition !== 'outside-knowledge-scope') continue;
        dependency.record.disposition = 'snapshot';
        dependency.record.reason = `Local reference from ${record.path}; preserved in full as inert reference text.`;
        dependency.record.target = `snapshot/${dependency.record.path}.source.txt`;
        copied.set(dependency.record.target, dependency.content);
        changed = true;
      }
    }
  } while (changed);

  const firstByHash = new Map();
  for (const record of records) {
    if (record.disposition !== 'snapshot') continue;
    if (firstByHash.has(record.sha256)) record.duplicateOf = firstByHash.get(record.sha256);
    else firstByHash.set(record.sha256, record.path);
  }
  return {
    inventory: {
      schemaVersion: 1,
      origin: { repository: 'kaixun96/dev.AgentOW', commit, tree },
      scope: 'All tracked first-party Markdown, accessibility-marked authored metadata/source/tests, and resolvable local document dependencies. Generated bundles/maps and vendored performance material remain external references.',
      transformation: 'Whole source bodies, LF-normalized only. Suffixes prevent archived skills, agent instructions and source code from becoming executable entrypoints.',
      limitations: [
        'A snapshot of this exact Git tree, not an exhaustive SharePoint/Fluent product API manual or a live website mirror.',
        'Vendored third-party performance documents and generated bundles/source maps remain external references; no private notes or linked product repositories are imported.',
        'Runtime source is reference text only. No implementation migration, installation, execution authority or AgentOW consumer cutover.',
        'Historical Git revisions are not expanded; the six original v0.2 reference bodies remain separately preserved.'
      ],
      totals: {
        tracked: records.length,
        snapshot: records.filter(record => record.disposition === 'snapshot').length,
        externalReference: records.filter(record => record.disposition === 'external-reference').length,
        outsideKnowledgeScope: records.filter(record => record.disposition === 'outside-knowledge-scope').length
      },
      files: records
    },
    copied
  };
}

export function readGitSources(repository, commit) {
  assert.match(commit, /^[a-f0-9]{40}$/);
  const git = args => execFileSync('git', ['-C', repository, ...args], { maxBuffer: 32 * 1024 * 1024 });
  const tree = git(['rev-parse', `${commit}^{tree}`]).toString('utf8').trim();
  const entries = git(['ls-tree', '-r', '-z', commit]).toString('utf8').split('\0').filter(Boolean);
  const sources = entries.map(entry => {
    const match = /^(\d+) blob ([a-f0-9]{40})\t(.+)$/.exec(entry);
    assert(match, `Unsupported Git tree entry: ${entry}`);
    const bytes = git(['cat-file', 'blob', match[2]]);
    const content = bytes.toString('utf8');
    assert(Buffer.from(content, 'utf8').equals(bytes), `Non-UTF8 source: ${match[3]}`);
    return { mode: match[1], oid: match[2], path: match[3], content };
  });
  return inventorySources(sources, commit, tree);
}

export async function writeSnapshot(root, result, check = false) {
  const directory = join(root, snapshotDirectory);
  const files = new Map(result.copied);
  files.set('source-inventory.json', JSON.stringify(result.inventory, null, 2) + '\n');
  for (const [file, content] of files) {
    const target = join(directory, safeRelative(file));
    if (check) assert.equal(normalize(await readFile(target, 'utf8')), content, `Snapshot drift: ${file}`);
    else {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content);
    }
  }
  await pruneGenerated(join(directory, 'snapshot'),
    new Set([...result.copied.keys()].map(file => file.slice('snapshot/'.length))), check);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const positional = args.filter(arg => arg !== '--check');
  assert.equal(positional.length, 2,
    'Usage: node tools/agentow-knowledge-snapshot.mjs <fetched-source-repository> <exact-commit> [--check]');
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const result = readGitSources(positional[0], positional[1]);
  await writeSnapshot(root, result, check);
  console.log(JSON.stringify({ check, commit: positional[1], ...result.inventory.totals }));
}
