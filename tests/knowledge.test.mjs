import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, cp, mkdtemp, rm, access, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { plugins } from '../src/runtime/core.mjs';
import { pruneGenerated } from '../tools/generated-tree.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const digest = value => createHash('sha256').update(value).digest('hex');
const load = async path => JSON.parse(await text(path));
async function filesUnder(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink());
    const key = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await filesUnder(join(directory, entry.name), key + '/'));
    else files.push(key);
  }
  return files;
}

test('knowledge is indexed, versioned and bound to the release', async () => {
  const index = await load(join(root, 'src/knowledge/index.json'));
  const manifest = await load(join(root, 'src/knowledge/manifest.json'));
  const release = await load(join(root, 'release.json'));
  assert.equal(index.scope, 'generic-static-accessibility');
  assert.equal(index.origin, undefined);
  assert.equal(manifest.origin, undefined);
  assert.equal(manifest.version, release.version);
  assert.equal(release.knowledge.sha256, digest(await text(join(root, release.knowledge.manifest))));
  assert.equal(index.topics.length, 6);
  const files = new Set(index.topics.map(topic => topic.file));
  assert.equal(files.size, index.topics.length);
  for (const topic of index.topics) {
    assert(topic.trigger && topic.scope);
    assert.equal(manifest.hashes[topic.file], digest(await text(join(root, 'src/knowledge', topic.file))));
  }
  for (const name of [...Object.keys(plugins), 'a11y-knowledge', 'a11y-bug-bash']) {
    assert(index.consumers[name]?.length);
    assert(index.consumers[name].every(file => files.has(file)));
  }
});

test('every independently copied consumer retains complete offline portable knowledge', async () => {
  for (const name of [...Object.keys(plugins), 'a11y-knowledge']) {
    const dir = await mkdtemp(join(tmpdir(), 'knowledge-plugin-'));
    try {
      await cp(join(root, 'plugins', name), dir, { recursive: true });
      const manifest = await load(join(dir, 'knowledge/manifest.json'));
      for (const [file, sha] of Object.entries(manifest.hashes)) {
        assert.equal(digest(await text(join(dir, 'knowledge', file))), sha, `${name}: ${file}`);
      }
      const index = await text(join(dir, 'knowledge/README.md'));
      for (const match of index.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
        await access(join(dir, 'knowledge', match[1]));
      }
      assert.match(await text(join(dir, 'skills', name, 'SKILL.md')), /knowledge\/README\.md/);
      await assert.rejects(access(join(dir, 'integrations')), { code: 'ENOENT' });
      if (name === 'a11y-knowledge') {
        const plugin = await load(join(dir, 'plugin.json'));
        assert.equal(plugin.mcpServers, undefined);
        await assert.rejects(access(join(dir, '.mcp.json')), { code: 'ENOENT' });
        await assert.rejects(access(join(dir, 'runtime')), { code: 'ENOENT' });
        for (const forbidden of ['native', 'adapters', 'config', 'contracts']) {
          await assert.rejects(access(join(dir, forbidden)), { code: 'ENOENT' });
        }
        const expected = [
          'plugin.json', 'AGENTS.md', 'LICENSE', 'README.md', 'README.zh-CN.md',
          'skills/a11y-knowledge/SKILL.md',
          'knowledge/manifest.json', ...Object.keys(manifest.hashes).map(file => `knowledge/${file}`)
        ].sort();
        const actual = (await filesUnder(dir)).sort();
        assert.deepEqual(actual, expected, 'Knowledge-only package must not retain undeclared legacy files');
        const index = await load(join(dir, 'knowledge/index.json'));
        for (const file of ['README.md', ...index.topics.map(topic => topic.file)]) {
          assert.doesNotMatch(await text(join(dir, 'knowledge', file)),
            /agentow|twinbot|devbox|codespace|sharepoint|spds|fluent|@msinternal|VB-CABLE|playwright|evaluator-request|ow-pr-attach/i,
            `Operational or project-specific rules leaked into generic topic ${file}`);
        }
      }
    } finally {
      await rm(dir, { recursive: true });
    }
  }
});

test('marketplace exposes knowledge separately without making it an execution capability', async () => {
  const marketplace = await load(join(root, '.github/plugin/marketplace.json'));
  assert.equal(marketplace.plugins.length, 10);
  assert.equal(marketplace.plugins.filter(plugin => plugin.name === 'a11y-knowledge').length, 1);
  assert.equal(plugins['a11y-knowledge'], undefined);
  assert.equal(marketplace.plugins.filter(plugin => plugin.name === 'a11y-knowledge-odsp').length, 0);
  assert.equal(plugins['a11y-knowledge-odsp'], undefined);
  const skill = await text(join(root, 'src/skills/a11y-knowledge/SKILL.md'));
  assert.match(skill, /Default to read-only source inspection/);
  assert.match(skill, /Do not\s+edit files, run shell commands, tests or scanners/);
  assert.match(skill, /source-supported issues, context needed and runtime not verified/);
  assert.match(skill, /Missing context\s+is not a defect/);
});

test('historical archives are absent while every portable topic remains bound to its source', async () => {
  const index = await load(join(root, 'src/knowledge/index.json'));
  const manifest = await load(join(root, 'src/knowledge/manifest.json'));
  const release = await load(join(root, 'release.json'));
  assert.equal(release.integrations, undefined);
  assert.equal(release.externalDependencies, undefined);
  for (const path of ['integrations', 'src/integrations', 'src/skills/a11y-knowledge-odsp',
    'plugins/a11y-knowledge-odsp', 'tools/agentow-knowledge-snapshot.mjs']) {
    await assert.rejects(access(join(root, path)), { code: 'ENOENT' });
  }
  for (const topic of index.topics) {
    const source = await text(join(root, 'src/knowledge', topic.file));
    assert.equal(digest(source), manifest.hashes[topic.file]);
    assert.equal(await text(join(root, 'plugins/a11y-knowledge/knowledge', topic.file)), source);
    assert.equal(await text(join(root, 'plugins/a11y-bug-bash/modules/a11y-knowledge/knowledge', topic.file)), source);
  }
});

test('one unified knowledge skill handles generic and ODSP review without dead archive routing', async () => {
  const base = join(root, 'plugins/a11y-knowledge');
  const entry = await text(join(base, 'skills/a11y-knowledge/SKILL.md'));
  assert.match(entry, /For SPDS, Fluent V8\/V9, SharePoint or ODSP/);
  assert.match(entry, /For unrelated projects, use only the generic topics/);
  assert.match(entry, /When the stack is unknown,\s+identify it/);
  assert.equal(entry, await text(join(root, 'src/skills/a11y-knowledge/SKILL.md')));
  assert.match(entry, /Keep Fluent V8 and V9 behavior\s+separate/);
  assert.match(entry, /not supplied here are a context gap/);
  assert.match(entry, /impose SharePoint conventions on generic Fluent or other-framework code/);
  assert.doesNotMatch(entry, /integrations\/|a11y-knowledge-odsp|archive/i);
});

test('generated cleanup rejects stale content in check mode and removes it during build', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'generated-knowledge-'));
  try {
    await mkdir(join(dir, 'a11y-knowledge/knowledge'), { recursive: true });
    await mkdir(join(dir, 'a11y-knowledge/integrations/old'), { recursive: true });
    await writeFile(join(dir, 'a11y-knowledge/knowledge/foundations.md'), 'keep');
    await writeFile(join(dir, 'a11y-knowledge/knowledge/evidence-contract.md'), 'retired');
    await writeFile(join(dir, 'a11y-knowledge/integrations/old/config.json'), '{}');
    const expected = new Set(['a11y-knowledge/knowledge/foundations.md']);
    await assert.rejects(pruneGenerated(dir, expected, true), /Unexpected generated file/);
    assert.equal(await text(join(dir, 'a11y-knowledge/knowledge/evidence-contract.md')), 'retired');
    await pruneGenerated(dir, expected);
    assert.deepEqual(await filesUnder(dir), [...expected]);
    await assert.rejects(access(join(dir, 'a11y-knowledge/integrations')), { code: 'ENOENT' });
    assert.equal(await text(join(dir, 'a11y-knowledge/knowledge/foundations.md')), 'keep');
    await pruneGenerated(dir, expected, true);
  } finally {
    await rm(dir, { recursive: true });
  }
});
