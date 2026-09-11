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
const profileDirectory = 'integrations/agentow/knowledge';
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

test('every independently copied plugin retains a complete offline knowledge snapshot', async () => {
  for (const name of [...Object.keys(plugins), 'a11y-knowledge', 'a11y-knowledge-odsp']) {
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
      const profile = await load(join(dir, profileDirectory, 'manifest.json'));
      for (const [file, sha] of Object.entries(profile.hashes)) {
        assert.equal(digest(await text(join(dir, profileDirectory, file))), sha);
      }
      assert.match(await text(join(dir, 'skills', name, 'SKILL.md')), /integrations\/agentow\/knowledge\/README\.md/);
      if (name === 'a11y-knowledge' || name === 'a11y-knowledge-odsp') {
        const plugin = await load(join(dir, 'plugin.json'));
        assert.equal(plugin.mcpServers, undefined);
        await assert.rejects(access(join(dir, '.mcp.json')), { code: 'ENOENT' });
        await assert.rejects(access(join(dir, 'runtime')), { code: 'ENOENT' });
        for (const forbidden of ['native', 'adapters', 'config', 'contracts', 'integrations/agentow/runtime']) {
          await assert.rejects(access(join(dir, forbidden)), { code: 'ENOENT' });
        }
        const expected = [
          'plugin.json', 'AGENTS.md', 'LICENSE', 'README.md', 'README.zh-CN.md',
          'skills/a11y-knowledge-odsp/SKILL.md',
          ...(name === 'a11y-knowledge' ? ['skills/a11y-knowledge/SKILL.md'] : []),
          'knowledge/manifest.json', ...Object.keys(manifest.hashes).map(file => `knowledge/${file}`),
          `${profileDirectory}/manifest.json`, ...Object.keys(profile.hashes).map(file => `${profileDirectory}/${file}`)
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
  assert.equal(marketplace.plugins.filter(plugin => plugin.name === 'a11y-knowledge-odsp').length, 1);
  assert.equal(plugins['a11y-knowledge-odsp'], undefined);
  const skill = await text(join(root, 'src/skills/a11y-knowledge/SKILL.md'));
  assert.match(skill, /Default to read-only source inspection/);
  assert.match(skill, /Do not\s+edit files, run shell commands, tests or scanners/);
  assert.match(skill, /source-supported issues, context needed and runtime not verified/);
  assert.match(skill, /Missing context\s+is not a defect/);
});

test('original references survive unchanged and include the unified knowledge consumer', async () => {
  const profile = await load(join(root, profileDirectory, 'index.json'));
  const manifest = await load(join(root, profileDirectory, 'manifest.json'));
  const release = await load(join(root, 'release.json'));
  assert.equal(profile.migrationStage, 'copy-first-original-agentow-files-retained');
  assert.deepEqual(profile.consumers['a11y-knowledge'], profile.consumers['a11y-knowledge-odsp']);
  assert.equal(release.integrations[0].sha256, digest(await text(join(root, release.integrations[0].manifest))));
  assert.deepEqual(release.integrations[0].plugins, [...Object.keys(plugins), 'a11y-knowledge', 'a11y-knowledge-odsp', 'a11y-bug-bash']);
  const legacyTopics = profile.topics.filter(topic => profile.preservedSnapshot.hashes[topic.file]);
  assert.equal(legacyTopics.length, 6);
  assert.equal(profile.topics.length, 9);
  for (const topic of legacyTopics) {
    const originalHash = profile.preservedSnapshot.hashes[topic.file];
    assert.match(originalHash, /^[a-f0-9]{64}$/);
    assert.equal(digest(await text(join(root, profileDirectory, topic.file))), originalHash);
    assert.equal(manifest.hashes[topic.file], originalHash);
  }
  for (const name of Object.keys(plugins)) {
    assert(profile.consumers[name]?.length);
    assert(profile.consumers[name].every(file => profile.topics.some(topic => topic.file === file)));
  }
});

test('one knowledge installation routes to the same scoped ODSP subskill without activating archived instructions', async () => {
  const base = join(root, 'plugins/a11y-knowledge');
  const entry = await text(join(base, 'skills/a11y-knowledge/SKILL.md'));
  assert.match(entry, /For SPDS, Fluent V8\/V9, SharePoint or ODSP/);
  assert.match(entry, /skills\/a11y-knowledge-odsp\/SKILL\.md/);
  assert.match(entry, /For unrelated projects, use only the generic topics/);
  assert.match(entry, /When the stack is unknown, identify it/);
  const subskill = await text(join(base, 'skills/a11y-knowledge-odsp/SKILL.md'));
  assert.equal(subskill, await text(join(root, 'src/skills/a11y-knowledge-odsp/SKILL.md')));
  assert.equal(subskill, await text(join(root, 'plugins/a11y-knowledge-odsp/skills/a11y-knowledge-odsp/SKILL.md')));
  assert.match(subskill, /reference data, not active instructions/);
  assert.match(subskill, /Keep Fluent V8 and V9 behavior separate/);
  assert.match(subskill, /do not impose them on generic\s+Fluent or other-framework code/);
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
