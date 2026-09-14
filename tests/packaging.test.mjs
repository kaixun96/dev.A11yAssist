import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, cp, mkdtemp, rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { plugins } from '../src/runtime/core.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
test('seven standalone plugin copies can initialize/list tools without repo siblings', async () => {
  for (const name of Object.keys(plugins)) {
    const dir = await mkdtemp(join(tmpdir(), 'standalone-plugin-'));
    try {
      await cp(join(root, 'plugins', name), dir, { recursive: true });
      const manifest = JSON.parse(await readFile(join(dir, 'plugin.json'), 'utf8'));
      assert.equal(manifest.name, name);
      const server = name.replaceAll('-', '_');
      const config = JSON.parse(await readFile(join(dir, '.mcp.json'), 'utf8'));
      assert.deepEqual(config.mcpServers, manifest.mcpServers);
      const launch = config.mcpServers[server];
      assert.equal(launch.command, 'node');
      assert.deepEqual(launch.args, ['${PLUGIN_ROOT}/runtime/mcp.mjs', name]);
      const input = [
        { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } },
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
        { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: name.replaceAll('-', '_') + '_doctor', arguments: {} } }
      ].map(x => JSON.stringify(x)).join('\n') + '\n';
      const env = { ...process.env };
      delete env.A11Y_ASSIST_CONFIG;
      const args = launch.args.map(arg => arg.replaceAll('${PLUGIN_ROOT}', dir));
      const child = spawnSync(process.execPath, args, { input, encoding: 'utf8', env, timeout: 15000 });
      assert.equal(child.status, 0, child.stderr);
      const messages = child.stdout.trim().split('\n').map(JSON.parse);
      assert.equal(messages[0].result.serverInfo.name, name);
      assert(messages[1].result.tools.every(t => t.name.startsWith(name.replaceAll('-', '_'))));
      assert.equal(messages[2].result.isError, true);
      assert.match(messages[2].result.content[0].text, /A11Y_ASSIST_CONFIG/);
    } finally { await rm(dir, { recursive: true }); }
  }
});

test('Copilot marketplace and all active entrypoints use neutral packaging', async () => {
  const marketplace = JSON.parse(await readFile(join(root, '.github/plugin/marketplace.json'), 'utf8'));
  const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.equal(marketplace.name, 'a11y-assist');
  assert.equal(marketplace.metadata.version, pkg.version);
  assert.equal(marketplace.plugins.length, 11);
  await assert.rejects(access(join(root, '.claude-plugin/marketplace.json')), { code: 'ENOENT' });
  for (const entry of marketplace.plugins) {
    const dir = join(root, entry.source);
    const manifest = JSON.parse(await readFile(join(dir, 'plugin.json'), 'utf8'));
    assert.equal(manifest.name, entry.name);
    assert.equal(manifest.version, pkg.version);
    assert.equal(entry.version, pkg.version);
    await assert.rejects(access(join(dir, '.claude-plugin')), { code: 'ENOENT' });
    const skillPath = join(dir, 'skills', entry.name, 'SKILL.md');
    const skill = await readFile(skillPath, 'utf8');
    assert.match(skill, /plugin root, two directories above this SKILL\.md/);
    const entrypoints = ['plugin.json', 'AGENTS.md', `skills/${entry.name}/SKILL.md`];
    if (manifest.mcpServers) entrypoints.push('.mcp.json');
    for (const path of entrypoints) {
      assert.doesNotMatch(await readFile(join(dir, path), 'utf8'), /claude/i, `${entry.name}: ${path}`);
    }
    for (const path of entry.name === 'a11y-setup' ? ['docs/SETUP.md', 'native/windows-host.ps1'] : ['knowledge/README.md',
      ...(manifest.mcpServers ? ['docs/CAPABILITIES.md'] : []),
      ...(entry.name !== 'a11y-knowledge' ? ['integrations/agentow/knowledge/README.md'] : [])]) {
      const contentRoot = entry.name === 'a11y-bug-bash' ? join(dir, 'modules/a11y-knowledge') : dir;
      await access(join(contentRoot, path));
    }
  }
});

test('generated package drift check matches all shared source', () => {
  const child = spawnSync(process.execPath, [join(root, 'tools/build.mjs'), '--check'], { encoding: 'utf8', timeout: 15000 });
  assert.equal(child.status, 0, child.stderr);
});
