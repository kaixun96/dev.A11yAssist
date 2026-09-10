import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, cp, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { plugins } from '../runtime/core.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
test('seven standalone plugin copies can initialize/list tools without repo siblings', async () => {
  for (const name of Object.keys(plugins)) {
    const dir = await mkdtemp(join(tmpdir(), 'standalone-plugin-'));
    try {
      await cp(join(root, 'plugins', name), dir, { recursive: true });
      const manifest = JSON.parse(await readFile(join(dir, '.claude-plugin/plugin.json'), 'utf8'));
      assert.equal(manifest.name, name);
      const input = [
        { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1' } } },
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', id: 2, method: 'tools/list' },
        { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: name.replaceAll('-', '_') + '_doctor', arguments: {} } }
      ].map(x => JSON.stringify(x)).join('\n') + '\n';
      const env = { ...process.env };
      delete env.A11Y_ASSIST_CONFIG;
      const child = spawnSync(process.execPath, [join(dir, 'runtime/mcp.mjs'), name], { input, encoding: 'utf8', env, timeout: 15000 });
      assert.equal(child.status, 0, child.stderr);
      const messages = child.stdout.trim().split('\n').map(JSON.parse);
      assert.equal(messages[0].result.serverInfo.name, name);
      assert(messages[1].result.tools.every(t => t.name.startsWith(name.replaceAll('-', '_'))));
      assert.equal(messages[2].result.isError, true);
      assert.match(messages[2].result.content[0].text, /A11Y_ASSIST_CONFIG/);
    } finally { await rm(dir, { recursive: true }); }
  }
});

test('generated package drift check matches all shared source', () => {
  const child = spawnSync(process.execPath, [join(root, 'tools/build.mjs'), '--check'], { encoding: 'utf8', timeout: 15000 });
  assert.equal(child.status, 0, child.stderr);
});
