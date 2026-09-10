import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const plugins = JSON.parse(await readFile(join(root, 'contracts/plugins.json'), 'utf8'));
const check = process.argv.includes('--check');
async function emit(path, data) {
  const absolute = join(root, path);
  if (check) {
    assert.equal(await readFile(absolute, 'utf8'), data, `Generated file drift: ${path}`);
  } else {
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, data);
  }
}
const json = data => JSON.stringify(data, null, 2) + '\n';
const entries = [];
for (const [name, definition] of Object.entries(plugins)) {
  const base = `plugins/${name}`;
  const server = name.replaceAll('-', '_');
  const launch = { command: 'node', args: ['${CLAUDE_PLUGIN_ROOT}/runtime/mcp.mjs', name] };
  await emit(`${base}/.claude-plugin/plugin.json`, json({
    name, version: pkg.version, description: definition.description,
    author: { name: 'kaixun96' }, license: 'Microsoft Internal', mcpServers: { [server]: launch }
  }));
  await emit(`${base}/.mcp.json`, json({ mcpServers: { [server]: launch } }));
  for (const dir of ['runtime', 'contracts', 'adapters']) {
    for (const file of await readdir(join(root, dir))) {
      await emit(`${base}/${dir}/${file}`, await readFile(join(root, dir, file), 'utf8'));
    }
  }
  for (const file of ['WORKFLOW.md', 'PROVIDERS.md']) {
    await emit(`${base}/docs/${file}`, await readFile(join(root, 'docs', file), 'utf8'));
  }
  const skill = await readFile(join(root, 'skills', name, 'SKILL.md'), 'utf8');
  await emit(`${base}/LICENSE`, await readFile(join(root, 'LICENSE'), 'utf8'));
  await emit(`${base}/skills/${name}/SKILL.md`, skill);
  await emit(`${base}/AGENTS.md`, `# ${name}\n\nRead docs/WORKFLOW.md and docs/PROVIDERS.md before execution.\nOnly configured trusted providers may operate machines. Missing providers fail closed.\n${definition.description}\n`);
  entries.push({ name, source: `./${base}`, description: definition.description, version: pkg.version,
    author: { name: 'kaixun96' } });
}
await emit('.claude-plugin/marketplace.json', json({
  name: 'a11y-assist', owner: { name: 'kaixun96' },
  metadata: { version: pkg.version, description: 'Modular internal accessibility workflow for Copilot CLI and Twinbot with Windows DevBoxes' },
  plugins: entries
}));
const hashes = {};
for (const dir of ['runtime', 'contracts', 'adapters']) {
  for (const file of await readdir(join(root, dir))) {
    hashes[`${dir}/${file}`] = createHash('sha256').update(await readFile(join(root, dir, file))).digest('hex');
  }
}
await emit('release.json', json({
  schemaVersion: 1, version: pkg.version, marketplace: 'a11y-assist', plugins: Object.keys(plugins),
  externalDependencies: [{ name: 'agentow-copilot', marketplace: 'agentOW', repository: 'kaixun96/dev.AgentOW',
    entrypoint: '/agentow-a11y', note: 'Verify freshness on the leased execution host; stricter BEFORE/PR gates apply.' }],
  hashes
}));
console.log(check ? 'Generated packages match source.' : 'Built seven independently packaged plugins.');
