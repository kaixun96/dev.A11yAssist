import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, cp, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const consumers = [
  ['a11y-knowledge', '', ['a11y-knowledge', 'a11y-knowledge-odsp']],
  ['a11y-knowledge-odsp', '', ['a11y-knowledge-odsp']],
  ['a11y-test-categories', '', ['a11y-test-categories']],
  ['a11y-bug-bash', 'modules/a11y-knowledge', ['a11y-knowledge', 'a11y-knowledge-odsp']],
  ['a11y-bug-bash', 'modules/a11y-test-categories', ['a11y-test-categories']]
];

test('isolated consumers declare Liquid once at the plugin root and share the guide', async () => {
  const expected = await text(join(root, 'docs/LIQUID-STANDARDS.md'));
  const config = JSON.parse(await text(join(root, 'src/standards/liquid.mcp.json')));
  assert.deepEqual(config, { mcpServers: { liquid: {
    type: 'http', url: 'https://mcp.liquid.microsoft.com', headers: {},
    tools: ['liquid_search', 'get_liquid_resource_spec', 'describe_liquid_resource', 'read_liquid_resource']
  } } });
  const example = expected.match(/```json\n([\s\S]*?)\n```/);
  assert(example, 'Missing installable HTTP configuration example');
  assert.deepEqual(JSON.parse(example[1]), config);
  for (const [name, module, skills] of consumers) {
    const directory = await mkdtemp(join(tmpdir(), 'liquid-guidance-'));
    try {
      await cp(join(root, 'plugins', name), directory, { recursive: true });
      const base = join(directory, module);
      assert.equal(await text(join(base, 'docs/LIQUID-STANDARDS.md')), expected);
      for (const skill of skills) {
        assert((await text(join(base, 'skills', skill, 'SKILL.md')))
          .includes('`docs/LIQUID-STANDARDS.md`'));
      }
      const manifest = JSON.parse(await text(join(directory, 'plugin.json')));
      assert.deepEqual(manifest.mcpServers, config.mcpServers);
      assert.deepEqual(JSON.parse(await text(join(directory, '.mcp.json'))), config);
      if (module) {
        await assert.rejects(access(join(base, '.mcp.json')), { code: 'ENOENT' });
        await assert.rejects(access(join(base, 'plugin.json')), { code: 'ENOENT' });
      }
    } finally {
      await rm(directory, { recursive: true });
    }
  }
});

test('Liquid instructions preserve discovery, full reads, versioning and explicit failure', async () => {
  const guide = await text(join(root, 'docs/LIQUID-STANDARDS.md'));
  for (const value of ['https://mcp.liquid.microsoft.com', 'liquid_search',
    'get_liquid_resource_spec', 'describe_liquid_resource', 'read_liquid_resource',
    '`collections`', '`$rows`', 'continuation/skip tokens', '_Requirement.EnhancedMarkdown',
    '_Applicability.EnhancedMarkdown', '_Guidance.EnhancedMarkdown',
    'MAS-to-WCAG mapping', 'publication/effective status', 'retrieval time']) {
    assert(guide.includes(value), value);
  }
  assert.match(guide, /Do not manufacture a/);
  assert.match(guide, /search snippets alone are not/);
  assert.match(guide, /Matching numbers or titles alone do not establish a mapping/);
  assert.match(guide, /Do not impose\s+MAS on an unrelated project/);
  assert.match(guide, /not retrieved through Liquid/);
  assert.match(guide, /Do not commit\s+MAS bodies, raw MCP responses/);
  assert.match(guide, /Do not include product source, customer data/);
  assert.match(guide, /Liquid is disconnected, access denied/);
  assert.match(guide, /not a declaration of the product's mandated target/);
  assert.doesNotMatch(guide, /Bearer\s+[A-Za-z0-9._-]+|_UpdatedBy|_CreatedBy/);
});
