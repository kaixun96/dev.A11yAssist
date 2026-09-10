import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { pruneGenerated } from './generated-tree.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const plugins = JSON.parse(await readFile(join(root, 'contracts/plugins.json'), 'utf8'));
const knowledge = JSON.parse(await readFile(join(root, 'knowledge/index.json'), 'utf8'));
const profileDirectory = 'integrations/agentow/knowledge';
const profile = JSON.parse(await readFile(join(root, profileDirectory, 'index.json'), 'utf8'));
const check = process.argv.includes('--check');
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const generatedFiles = new Set();
async function emit(path, data) {
  if (path.startsWith('plugins/')) generatedFiles.add(path.slice('plugins/'.length));
  const absolute = join(root, path);
  if (check) {
    assert.equal(await text(absolute), data, `Generated file drift: ${path}`);
  } else {
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, data);
  }
}
const json = data => JSON.stringify(data, null, 2) + '\n';
async function knowledgeSet(directory, index) {
  const files = ['README.md', 'index.json', ...index.topics.map(topic => topic.file)];
  assert.equal(new Set(files).size, files.length, 'Duplicate knowledge file');
  const hashes = {};
  for (const file of files) {
    assert.match(file, /^[a-zA-Z0-9-]+\.(md|json)$/, 'Knowledge files must be flat relative paths');
    hashes[file] = createHash('sha256').update(await text(join(root, directory, file))).digest('hex');
  }
  const manifest = json({
    schemaVersion: 1, repository: 'kaixun96/dev.A11yAssist', version: pkg.version,
    scope: index.scope, ...(index.origin ? { origin: index.origin } : {}), hashes
  });
  await emit(`${directory}/manifest.json`, manifest);
  return { directory, files, manifest };
}
const genericSet = await knowledgeSet('knowledge', knowledge);
const integrationSet = await knowledgeSet(profileDirectory, profile);
async function bundleKnowledge(base, set) {
  for (const file of set.files) {
    await emit(`${base}/${set.directory}/${file}`, await text(join(root, set.directory, file)));
  }
  await emit(`${base}/${set.directory}/manifest.json`, set.manifest);
}
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
      await emit(`${base}/${dir}/${file}`, await text(join(root, dir, file)));
    }
  }
  for (const file of ['WORKFLOW.md', 'PROVIDERS.md']) {
    await emit(`${base}/docs/${file}`, await text(join(root, 'docs', file)));
  }
  const topics = knowledge.consumers[name];
  const profileTopics = profile.consumers[name];
  assert(topics?.length && topics.every(file => genericSet.files.includes(file)), `Missing knowledge routing: ${name}`);
  assert(profileTopics?.length && profileTopics.every(file => integrationSet.files.includes(file)), `Missing integration routing: ${name}`);
  const routing = `Read \`\${CLAUDE_PLUGIN_ROOT}/knowledge/README.md\` for static guidance: ${topics.map(file => `\`knowledge/${file}\``).join(', ')}.\nFor this execution integration, also read \`\${CLAUDE_PLUGIN_ROOT}/${profileDirectory}/README.md\` and the applicable complete topics: ${profileTopics.map(file => `\`${profileDirectory}/${file}\``).join(', ')}. Static guidance does not replace authorized execution; integration references never override this workflow's stricter gates.\n\n`;
  const sourceSkill = await text(join(root, 'skills', name, 'SKILL.md'));
  assert.match(sourceSkill, /\n---\n\n/, `Missing skill frontmatter boundary: ${name}`);
  const skill = sourceSkill.replace(/\n---\n\n/, `\n---\n\n${routing}`);
  await emit(`${base}/LICENSE`, await text(join(root, 'LICENSE')));
  await emit(`${base}/skills/${name}/SKILL.md`, skill);
  await bundleKnowledge(base, genericSet);
  await bundleKnowledge(base, integrationSet);
  await emit(`${base}/integrations/agentow/README.md`, await text(join(root, 'integrations/agentow/README.md')));
  await emit(`${base}/AGENTS.md`, `# ${name}\n\nRead knowledge/README.md, ${profileDirectory}/README.md, docs/WORKFLOW.md and docs/PROVIDERS.md before execution.\nOnly configured trusted providers may operate machines. Missing providers fail closed.\n${definition.description}\n`);
  entries.push({ name, source: `./${base}`, description: definition.description, version: pkg.version,
    author: { name: 'kaixun96' } });
}
const knowledgeName = knowledge.plugin.name;
const knowledgeBase = `plugins/${knowledgeName}`;
assert.equal(knowledgeName, 'a11y-knowledge');
await emit(`${knowledgeBase}/.claude-plugin/plugin.json`, json({
  ...knowledge.plugin, version: pkg.version, author: { name: 'kaixun96' }, license: 'Microsoft Internal'
}));
await emit(`${knowledgeBase}/skills/${knowledgeName}/SKILL.md`, await text(join(root, 'skills', knowledgeName, 'SKILL.md')));
await emit(`${knowledgeBase}/LICENSE`, await text(join(root, 'LICENSE')));
await emit(`${knowledgeBase}/AGENTS.md`, '# A11y knowledge\n\nRead knowledge/README.md and the matching complete topic. Read-only reference; no execution authority or MCP server.\n');
await bundleKnowledge(knowledgeBase, genericSet);
entries.push({ ...knowledge.plugin, source: `./${knowledgeBase}`, version: pkg.version, author: { name: 'kaixun96' } });
await emit('.claude-plugin/marketplace.json', json({
  name: 'a11y-assist', owner: { name: 'kaixun96' },
  metadata: { version: pkg.version, description: 'Modular internal accessibility workflow for Copilot CLI and Twinbot with Windows DevBoxes' },
  plugins: entries
}));
const hashes = {};
for (const dir of ['runtime', 'contracts', 'adapters']) {
  for (const file of await readdir(join(root, dir))) {
    hashes[`${dir}/${file}`] = createHash('sha256').update(await text(join(root, dir, file))).digest('hex');
  }
}
await emit('release.json', json({
  schemaVersion: 1, version: pkg.version, marketplace: 'a11y-assist', plugins: entries.map(entry => entry.name),
  knowledge: { manifest: 'knowledge/manifest.json', sha256: createHash('sha256').update(genericSet.manifest).digest('hex') },
  integrations: [{ name: 'agentow', manifest: `${profileDirectory}/manifest.json`,
    sha256: createHash('sha256').update(integrationSet.manifest).digest('hex'),
    plugins: Object.keys(plugins) }],
  externalDependencies: [{ name: 'agentow-copilot', marketplace: 'agentOW', repository: 'kaixun96/dev.AgentOW',
    entrypoint: '/agentow-a11y', note: 'Verify freshness on the leased execution host; stricter BEFORE/PR gates apply.' }],
  hashes
}));
await pruneGenerated(join(root, 'plugins'), generatedFiles, check);
console.log(check ? 'Generated packages match source.' : `Built ${entries.length} independently packaged plugins.`);
