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
      await assert.rejects(access(join(dir, 'runtime/profiles.mjs')), { code: 'ENOENT' });
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
      const child = spawnSync(process.execPath, args, { cwd: dir, input, encoding: 'utf8', env, timeout: 15000 });
      assert.equal(child.status, 0, child.stderr);
      const messages = child.stdout.trim().split('\n').map(JSON.parse);
      assert.equal(messages[0].result.serverInfo.name, name);
      const contract = JSON.parse(await readFile(join(dir, 'contracts/workflow.json'), 'utf8'));
      assert.equal(messages[0].result.serverInfo.version, contract.version);
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
  assert.equal(marketplace.plugins.length, 10);
  await assert.rejects(access(join(root, '.claude-plugin/marketplace.json')), { code: 'ENOENT' });
  for (const entry of marketplace.plugins) {
    assert.equal(entry.source, `./plugins/${entry.name}`);
    const dir = join(root, entry.source);
    const manifest = JSON.parse(await readFile(join(dir, 'plugin.json'), 'utf8'));
    assert.equal(manifest.name, entry.name);
    assert.equal(manifest.version, pkg.version);
    assert.equal(entry.version, pkg.version);
    await assert.rejects(access(join(dir, '.claude-plugin')), { code: 'ENOENT' });
    const skillPath = `skills/${entry.name}/SKILL.md`;
    assert.match(await readFile(join(dir, skillPath), 'utf8'), /\$\{PLUGIN_ROOT\}/);
    for (const path of ['plugin.json', '.mcp.json', 'AGENTS.md', skillPath,
      'README.md', 'README.zh-CN.md', 'references/README.md']) {
      assert.doesNotMatch(await readFile(join(dir, path), 'utf8'), /claude/i, `${entry.name}: ${path}`);
    }
    const paths = ['references/README.md', 'references/knowledge.json',
      ...(Object.hasOwn(plugins, entry.name) ? ['docs/CAPABILITIES.md'] : []),
      ...(entry.name === 'a11y-setup' ? ['docs/SETUP.md', 'native/windows-host.ps1', 'setup/profiles.json', 'setup/report.template.md'] : []),
      ...(entry.name === 'a11y-bug-bash' ? ['modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md'] : [])];
    for (const path of paths) await access(join(dir, path));
  }
});

test('source MCP retains current full-workflow create/status/execute and reconciliation APIs', () => {
  for (const name of Object.keys(plugins)) {
    const child = spawnSync(process.execPath, [join(root, 'src/runtime/mcp.mjs'), name], {
      input: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n',
      encoding: 'utf8', timeout: 15000
    });
    assert.equal(child.status, 0, child.stderr);
    const tools = JSON.parse(child.stdout.trim()).result.tools;
    const prefix = name.replaceAll('-', '_');
    const names = tools.map(tool => tool.name);
    for (const action of ['status', 'reconcile', ...(plugins[name].stages.length ? ['execute'] : []),
      ...(['a11y-intake', 'a11y-workflow'].includes(name) ? ['create'] : [])]) {
      assert(names.includes(`${prefix}_${action}`), `${name} must retain ${action}`);
    }
    assert.doesNotMatch(JSON.stringify(tools), /workflowProfile|agentow-odsp|legacy/i);
  }
});

test('generated package drift check matches all shared source', () => {
  const child = spawnSync(process.execPath, [join(root, 'tools/build.mjs'), '--check'], { encoding: 'utf8', timeout: 15000 });
  assert.equal(child.status, 0, child.stderr);
});
