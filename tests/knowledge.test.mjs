import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, cp, mkdtemp, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { plugins } from '../runtime/core.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const digest = value => createHash('sha256').update(value).digest('hex');
const load = async path => JSON.parse(await text(path));

test('knowledge is indexed, versioned and bound to the release', async () => {
  const index = await load(join(root, 'knowledge/index.json'));
  const manifest = await load(join(root, 'knowledge/manifest.json'));
  const release = await load(join(root, 'release.json'));
  assert.equal(index.migrationStage, 'copy-first-original-agentow-files-retained');
  assert.match(index.origin.commit, /^[a-f0-9]{40}$/);
  assert.equal(manifest.version, release.version);
  assert.equal(release.knowledge.sha256, digest(await text(join(root, release.knowledge.manifest))));
  assert.equal(index.topics.length, 6);
  const files = new Set(index.topics.map(topic => topic.file));
  assert.equal(files.size, index.topics.length);
  for (const topic of index.topics) {
    assert(topic.trigger && topic.scope && topic.originPath);
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
  assert.match(await text(join(root, 'knowledge/README.md')), /never overrides A11y Assist's strict/);
});
