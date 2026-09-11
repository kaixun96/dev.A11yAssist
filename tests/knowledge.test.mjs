import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, cp, mkdtemp, rm, access, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { plugins } from '../runtime/core.mjs';
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
  const index = await load(join(root, 'knowledge/index.json'));
  const manifest = await load(join(root, 'knowledge/manifest.json'));
  const release = await load(join(root, 'release.json'));
  assert.equal(index.scope, 'generic-static-accessibility');
  assert.equal(index.origin, undefined);
  assert.equal(manifest.origin, undefined);
  assert.equal(manifest.version, release.version);
  assert.equal(release.knowledge.sha256, digest(await text(join(root, release.knowledge.manifest))));
  assert.equal(index.topics.length, 7);
  const files = new Set(index.topics.map(topic => topic.file));
  assert.equal(files.size, index.topics.length);
  for (const topic of index.topics) {
    assert(topic.trigger && topic.scope);
    assert.equal(manifest.hashes[topic.file], digest(await text(join(root, 'knowledge', topic.file))));
  }
  for (const name of [...Object.keys(plugins), 'a11y-knowledge']) {
    assert(index.consumers[name]?.length);
    assert(index.consumers[name].every(file => files.has(file)));
  }
});

test('every independently copied plugin retains a complete offline knowledge snapshot', async () => {
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
      if (name === 'a11y-knowledge') {
        const plugin = await load(join(dir, '.claude-plugin/plugin.json'));
        assert.equal(plugin.mcpServers, undefined);
        await assert.rejects(access(join(dir, '.mcp.json')), { code: 'ENOENT' });
        await assert.rejects(access(join(dir, 'runtime')), { code: 'ENOENT' });
        await assert.rejects(access(join(dir, 'integrations')), { code: 'ENOENT' });
        const expected = [
          '.claude-plugin/plugin.json', 'AGENTS.md', 'LICENSE', 'skills/a11y-knowledge/SKILL.md',
          'knowledge/manifest.json', ...Object.keys(manifest.hashes).map(file => `knowledge/${file}`)
        ].sort();
        const actual = (await filesUnder(dir)).sort();
        assert.deepEqual(actual, expected, 'Knowledge-only package must not retain undeclared legacy files');
        for (const file of actual) {
          assert.doesNotMatch(await text(join(dir, file)),
            /agentow|twinbot|devbox|codespace|sharepoint|spds|fluent|@msinternal|VB-CABLE|playwright|evaluator-request|ow-pr-attach/i,
            `Operational or project-specific content leaked into ${file}`);
        }
      } else {
        const profile = await load(join(dir, profileDirectory, 'manifest.json'));
        for (const [file, sha] of Object.entries(profile.hashes)) {
          assert.equal(digest(await text(join(dir, profileDirectory, file))), sha);
        }
        assert.match(await text(join(dir, 'skills', name, 'SKILL.md')), /integrations\/agentow\/knowledge\/README\.md/);
      }
    } finally {
      await rm(dir, { recursive: true });
    }
  }
});

test('marketplace exposes knowledge separately without making it an execution capability', async () => {
  const marketplace = await load(join(root, '.claude-plugin/marketplace.json'));
  assert.equal(marketplace.plugins.length, 8);
  assert.equal(marketplace.plugins.filter(plugin => plugin.name === 'a11y-knowledge').length, 1);
  assert.equal(plugins['a11y-knowledge'], undefined);
  const skill = await text(join(root, 'skills/a11y-knowledge/SKILL.md'));
  assert.match(skill, /Default to read-only source inspection/);
  assert.match(skill, /Do not\s+edit files, run shell commands, tests or scanners/);
  assert.match(skill, /source-supported issues, context needed and runtime not verified/);
  assert.match(skill, /Missing context\s+is not a defect/);
});

test('static review format keeps evidence, confidence and uncertainty separate', async () => {
  const foundation = await text(join(root, 'knowledge/foundations.md'));
  const skill = await text(join(root, 'skills/a11y-knowledge/SKILL.md'));
  for (const heading of [
    '### 1. Reviewed scope',
    '### 2. Source-supported issues',
    '### 3. Context needed',
    '### 4. Runtime not verified'
  ]) assert(foundation.includes(heading), `Missing output section: ${heading}`);
  for (const field of [
    'ID and title', 'Location', 'Severity', 'Confidence',
    'Affected users and impact', 'Source evidence', 'Rule/reference', 'Minimal correction'
  ]) assert(foundation.includes(`| ${field} |`), `Missing finding field: ${field}`);
  assert.match(foundation, /Severity is priority, not the WCAG conformance level/);
  assert.match(foundation, /Confidence is independent of severity/);
  assert.match(foundation, /not in a speculative low-confidence finding/);
  assert.match(skill, /foundations\.md#output-contract/);
  assert.match(skill, /Unknown context is not a low-confidence defect/);
  assert.match(foundation, /No source-supported accessibility issues\s+found in the reviewed scope/);
});

test('widget guidance provides role-specific exceptions and counterexamples without a runtime gate', async () => {
  const guide = await text(join(root, 'knowledge/widget-patterns.md'));
  const readme = await text(join(root, 'knowledge/README.md'));
  const skill = await text(join(root, 'skills/a11y-knowledge/SKILL.md'));
  const index = await load(join(root, 'knowledge/index.json'));
  const topics = index.topics.filter(topic => topic.file === 'widget-patterns.md');
  assert.equal(topics.length, 1);
  assert.match(readme, /\(widget-patterns\.md\)/);
  assert.match(skill, /knowledge\/widget-patterns\.md/);
  const sections = guide.split(/^## /m).slice(1);
  assert.deepEqual(sections.map(section => section.split('\n')[0]), [
    'Tabs', 'Dialogs and non-modal popovers', 'Comboboxes and selection fields',
    'Menus and menu buttons', 'Trees', 'Grids and data tables'
  ]);
  for (const section of sections) {
    for (const label of ['**Trigger and context:**', '**Inspect:**', '**Defect example:**',
      '**Valid counterexample:**', '**Minimal correction:**']) {
      assert(section.includes(label), `Missing ${label} in ${section.split('\n')[0]}`);
    }
  }
  assert.match(guide, /manual activation/);
  assert.match(guide, /showModal\(\)/);
  assert.match(guide, /dialog popup moves focus/);
  assert.match(guide, /ordinary table with a link does not need a grid role/);
  assert.match(guide, /supporting design guidance, not independent WCAG requirements/);
  assert.match(guide, /report unknown\s+component behavior as context needed/);
  for (const consumer of ['a11y-knowledge', 'a11y-validate', 'a11y-workflow']) {
    assert(index.consumers[consumer].includes('widget-patterns.md'));
  }
});

test('original execution references survive unchanged outside the generic package', async () => {
  const profile = await load(join(root, profileDirectory, 'index.json'));
  const manifest = await load(join(root, profileDirectory, 'manifest.json'));
  const release = await load(join(root, 'release.json'));
  assert.equal(profile.migrationStage, 'copy-first-original-agentow-files-retained');
  assert.equal(profile.consumers['a11y-knowledge'], undefined);
  assert.equal(release.integrations[0].sha256, digest(await text(join(root, release.integrations[0].manifest))));
  assert.deepEqual(release.integrations[0].plugins, Object.keys(plugins));
  assert.equal(profile.topics.length, 6);
  for (const topic of profile.topics) {
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
