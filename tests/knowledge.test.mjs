import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, cp, mkdtemp, rm, access, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { plugins } from '../src/runtime/core.mjs';
import { pruneGenerated } from '../tools/generated-tree.mjs';
import { loadKnowledgeBase } from '../tools/knowledge-base.mjs';
import { resolveKnowledgeReference } from '../tools/knowledge-reference.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const digest = value => createHash('sha256').update(value).digest('hex');
const load = async path => JSON.parse(await text(path));
const currentPlugins = [
  'a11y-intake', 'a11y-resources', 'a11y-capture', 'a11y-validate',
  'a11y-publish', 'agent-operations', 'a11y-workflow', 'a11y-knowledge', 'a11y-bug-bash', 'a11y-setup'
];
// The current src/native/windows-host.ps1 is setup functionality, not a root compatibility export.
const retiredRuntimeFiles = ['runtime/profiles.mjs', 'native/provenance.json'];
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

test('the KB is the only generic knowledge source and is bound to the release', async () => {
  const kb = await loadKnowledgeBase(join(root, 'accessibility-kb'), { verifyManifest: true });
  const release = await load(join(root, 'release.json'));
  await assert.rejects(access(join(root, 'knowledge')), { code: 'ENOENT' });
  assert.equal(release.knowledge, undefined);
  assert.equal(release.sharedKnowledge.sha256, digest(await text(join(root, release.sharedKnowledge.manifest))));
  assert.equal(release.sharedKnowledge.packages.common, kb.packages.get('common').version);
  assert.equal(kb.entries.get('common.topic.foundations').path, 'topics/foundations.md');
});

test('every copied plugin references the shared KB without carrying current KB content', async () => {
  const reference = await load(join(root, 'plugins/a11y-knowledge/references/knowledge.json'));
  for (const name of currentPlugins) {
    const dir = await mkdtemp(join(tmpdir(), 'knowledge-plugin-'));
    try {
      await cp(join(root, 'plugins', name), dir, { recursive: true });
      await assert.rejects(access(join(dir, 'knowledge')), { code: 'ENOENT' });
      await assert.rejects(access(join(dir, 'accessibility-kb')), { code: 'ENOENT' });
      assert.deepEqual(await load(join(dir, 'references/knowledge.json')), reference, `${name} must pin the same current KB`);
      await assert.rejects(resolveKnowledgeReference(dir, { env: {} }), /Shared KB is not configured/);
      const shared = await resolveKnowledgeReference(dir, { kbRoot: join(root, 'accessibility-kb'), env: {} });
      assert.deepEqual(Object.keys(shared.packages), ['common', 'fluent', 'sharepoint']);
      assert.equal(shared.entries.length, 32);
      const skill = await text(join(dir, 'skills', name, 'SKILL.md'));
      const instructions = await text(join(dir, 'AGENTS.md'));
      const referenceReadme = await text(join(dir, 'references/README.md'));
      assert.match(referenceReadme, /Node\.js 22\+/);
      assert.match(referenceReadme, /MCP-enabled host/);
      // Mentioning the variable in "no ... A11Y_ASSIST_CONFIG is required" is valid.
      assert.match(referenceReadme, /no user configuration,[\s\S]*?A11Y_ASSIST_CONFIG is required/);
      assert.match(skill, /references\/README\.md/);
      assert.match(instructions, /references\/README\.md/);
      assert.doesNotMatch(skill, /(?:CLAUDE_)?PLUGIN_ROOT\}\/accessibility-kb/);
      for (const content of [skill, instructions, referenceReadme]) {
        assert.doesNotMatch(content, /\bknowledge\/(?:README\.md|index\.json|manifest\.json|foundations\.md)/);
        assert.doesNotMatch(content, /integrations[\\/]|historical references|historical archive/i);
      }
      if (name === 'a11y-knowledge') {
        const plugin = await load(join(dir, 'plugin.json'));
        assert.deepEqual(Object.keys(plugin.mcpServers), ['a11y_knowledge_knowledge']);
        await access(join(dir, '.mcp.json'));
        assert.deepEqual((await readdir(join(dir, 'runtime'))).sort(), ['knowledge-mcp.mjs', 'knowledge.mjs']);
        const expected = [
          'plugin.json', '.mcp.json', 'AGENTS.md', 'LICENSE', 'README.md', 'README.zh-CN.md', 'skills/a11y-knowledge/SKILL.md',
          'runtime/knowledge.mjs', 'runtime/knowledge-mcp.mjs',
          'references/README.md', 'references/knowledge.json'
        ].sort();
        const actual = (await filesUnder(dir)).sort();
        assert.deepEqual(actual, expected, 'Knowledge-only package must contain only declared files');
        for (const forbidden of ['native', 'adapters', 'config', 'contracts', 'integrations']) {
          await assert.rejects(access(join(dir, forbidden)), { code: 'ENOENT' });
        }
      }
    } finally {
      await rm(dir, { recursive: true });
    }
  }
});

test('marketplace exposes knowledge, discovery and setup separately from seven execution capabilities', async () => {
  const marketplace = await load(join(root, '.github/plugin/marketplace.json'));
  assert.equal(Object.keys(plugins).length, 7);
  assert.equal(marketplace.plugins.length, 10);
  assert.deepEqual(Object.keys(plugins).sort(), currentPlugins.filter(name => !['a11y-knowledge', 'a11y-bug-bash', 'a11y-setup'].includes(name)).sort());
  assert.deepEqual(marketplace.plugins.map(plugin => plugin.name).sort(), [...currentPlugins].sort());
  assert.deepEqual(marketplace.plugins.filter(plugin => !Object.hasOwn(plugins, plugin.name)).map(plugin => plugin.name).sort(), ['a11y-bug-bash', 'a11y-knowledge', 'a11y-setup']);
  assert.equal(marketplace.plugins.filter(plugin => plugin.name === 'a11y-knowledge').length, 1);
  assert.equal(plugins['a11y-knowledge'], undefined);
  assert.equal(plugins['a11y-bug-bash'], undefined);
  assert.equal(plugins['a11y-setup'], undefined);
  assert.equal(marketplace.plugins.filter(plugin => plugin.name === 'a11y-knowledge-odsp').length, 0);
  assert.equal(plugins['a11y-knowledge-odsp'], undefined);
  for (const path of ['plugins/a11y-knowledge-odsp', 'src/skills/a11y-knowledge-odsp']) {
    await assert.rejects(access(join(root, path)), { code: 'ENOENT' });
  }
  assert.deepEqual((await readdir(join(root, 'plugins'))).sort(), [...currentPlugins].sort());
  assert.deepEqual((await readdir(join(root, 'src/skills'))).sort(), [...currentPlugins].sort());
  const skill = await text(join(root, 'src/skills/a11y-knowledge/SKILL.md'));
  assert.match(skill, /Default to read-only source inspection/);
  assert.match(skill, /Do not\s+edit files, run shell commands, tests or scanners/);
  assert.match(skill, /source-supported issues, context needed and runtime not verified/);
  assert.match(skill, /Missing context\s+is not a defect/);
});

test('root contains no retired integration files or active compatibility helpers', async t => {
  await t.test('the integration tree has no files (empty directories are harmless)', async () => {
    const files = await filesUnder(join(root, 'integrations')).catch(error => {
      if (error.code === 'ENOENT' && error.path === join(root, 'integrations')) return [];
      throw error;
    });
    assert.deepEqual(files, [], 'Root integrations must not retain manifests, archives or helpers');
  });
  for (const path of [...retiredRuntimeFiles, ...retiredRuntimeFiles.map(path => `src/${path}`),
    'runtime', 'native', 'contracts', 'adapters', 'skills', 'src/knowledge', '.claude-plugin',
    'tools/agentow-knowledge-snapshot.mjs', 'tests/knowledge-snapshot.test.mjs', 'docs/MIGRATION.md']) {
    await t.test(path, async () => {
      await assert.rejects(access(join(root, path)), { code: 'ENOENT' });
    });
  }
});

test('all ten generated plugins exclude retired integration and runtime files', async t => {
  for (const name of currentPlugins) {
    await t.test(name, async () => {
      const files = await filesUnder(join(root, 'plugins', name));
      assert.deepEqual(files.filter(path => /(^|\/)(integrations|knowledge|accessibility-kb|\.claude-plugin)\//.test(path) || retiredRuntimeFiles.includes(path)), [], name);
    });
  }
});

test('release describes only the current ten plugins and shared KB', async () => {
  const release = await load(join(root, 'release.json'));
  assert.equal(Object.hasOwn(release, 'integrations'), false);
  assert.equal(Object.hasOwn(release, 'externalDependencies'), false);
  assert.deepEqual([...release.plugins].sort(), [...currentPlugins].sort());
  assert.deepEqual(Object.keys(release.sharedKnowledge.packages), ['common', 'fluent', 'sharepoint']);
  const kb = await loadKnowledgeBase(join(root, 'accessibility-kb'), { verifyManifest: true });
  assert.equal(kb.entries.size, 32);
  for (const [name, version] of Object.entries(release.sharedKnowledge.packages)) {
    assert.equal(version, kb.packages.get(name).version);
  }
  assert.deepEqual(Object.keys(release.hashes).filter(path => !path.startsWith('src/') ||
    path.startsWith('src/integrations/') || retiredRuntimeFiles.includes(path.slice('src/'.length))), []);
});

test('generated cleanup rejects stale content in check mode and removes it during build', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'generated-knowledge-'));
  try {
    await mkdir(join(dir, 'a11y-knowledge/references'), { recursive: true });
    await mkdir(join(dir, 'a11y-knowledge/accessibility-kb'), { recursive: true });
    await mkdir(join(dir, 'a11y-knowledge/integrations/old'), { recursive: true });
    await writeFile(join(dir, 'a11y-knowledge/references/knowledge.json'), '{}');
    await writeFile(join(dir, 'a11y-knowledge/accessibility-kb/undeclared.md'), 'retired');
    await writeFile(join(dir, 'a11y-knowledge/integrations/old/config.json'), '{}');
    const expected = new Set(['a11y-knowledge/references/knowledge.json']);
    await assert.rejects(pruneGenerated(dir, expected, true), /Unexpected generated file/);
    assert.equal(await text(join(dir, 'a11y-knowledge/accessibility-kb/undeclared.md')), 'retired');
    await pruneGenerated(dir, expected);
    assert.deepEqual(await filesUnder(dir), [...expected]);
    await assert.rejects(access(join(dir, 'a11y-knowledge/integrations')), { code: 'ENOENT' });
    await assert.rejects(access(join(dir, 'a11y-knowledge/accessibility-kb')), { code: 'ENOENT' });
    assert.equal(await text(join(dir, 'a11y-knowledge/references/knowledge.json')), '{}');
    await pruneGenerated(dir, expected, true);
  } finally {
    await rm(dir, { recursive: true });
  }
});
