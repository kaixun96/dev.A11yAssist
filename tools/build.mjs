import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { pruneGenerated } from './generated-tree.mjs';
import { validateCatalog, renderCatalog, renderPlugin } from './catalog.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'src');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const plugins = JSON.parse(await readFile(join(source, 'contracts/plugins.json'), 'utf8'));
const knowledge = JSON.parse(await readFile(join(source, 'knowledge/index.json'), 'utf8'));
const catalog = JSON.parse(await readFile(join(source, 'catalog.json'), 'utf8'));
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
async function knowledgeSet(directory, index, sourceDirectory = directory) {
  const files = ['README.md', 'index.json', ...index.topics.map(topic => topic.file)];
  assert.equal(new Set(files).size, files.length, 'Duplicate knowledge file');
  const hashes = {};
  for (const file of files) {
    assert.match(file, /^[a-zA-Z0-9-]+\.(md|json)$/);
    hashes[file] = createHash('sha256').update(await text(join(root, sourceDirectory, file))).digest('hex');
  }
  const manifest = json({
    schemaVersion: 1, repository: 'kaixun96/dev.A11yAssist', version: pkg.version,
    scope: index.scope, ...(index.origin ? { origin: index.origin } : {}),
    hashes
  });
  await emit(`${sourceDirectory}/manifest.json`, manifest);
  return { directory, sourceDirectory, files, manifest };
}
const genericSet = await knowledgeSet('knowledge', knowledge, 'src/knowledge');
async function bundleKnowledge(base, set) {
  for (const file of set.files) {
    await emit(`${base}/${set.directory}/${file}`, await text(join(root, set.sourceDirectory, file)));
  }
  await emit(`${base}/${set.directory}/manifest.json`, set.manifest);
}
async function bundleKnowledgeReview(base) {
  for (const name of ['a11y-knowledge']) {
    await emit(`${base}/skills/${name}/SKILL.md`, await text(join(source, 'skills', name, 'SKILL.md')));
  }
  await bundleKnowledge(base, genericSet);
}
async function bundleSetup(base) {
  for (const path of ['skills/a11y-setup/SKILL.md', 'native/windows-host.ps1']) {
    await emit(`${base}/${path}`, await text(join(source, path)));
  }
  for (const file of await readdir(join(source, 'setup'))) {
    await emit(`${base}/setup/${file}`, await text(join(source, 'setup', file)));
  }
  await emit(`${base}/docs/SETUP.md`, await text(join(root, 'docs/SETUP.md')));
}
const entries = [];
for (const [name, definition] of Object.entries(plugins)) {
  const base = `plugins/${name}`;
  const server = name.replaceAll('-', '_');
  const launch = { command: 'node', args: ['${PLUGIN_ROOT}/runtime/mcp.mjs', name] };
  await emit(`${base}/plugin.json`, json({
    name, version: pkg.version, description: definition.description,
    author: { name: 'kaixun96' }, license: 'Microsoft Internal', mcpServers: { [server]: launch }
  }));
  await emit(`${base}/.mcp.json`, json({ mcpServers: { [server]: launch } }));
  for (const dir of ['runtime', 'contracts', 'adapters', 'native']) {
    for (const file of await readdir(join(source, dir))) {
      await emit(`${base}/${dir}/${file}`, await text(join(source, dir, file)));
    }
  }
  for (const file of ['CAPABILITIES.md', 'WORKFLOW.md', 'PROVIDERS.md', 'NATIVE-CAPABILITIES.md']) {
    await emit(`${base}/docs/${file}`, await text(join(root, 'docs', file)));
  }
  for (const file of await readdir(join(root, 'config'))) {
    await emit(`${base}/config/${file}`, await text(join(root, 'config', file)));
  }
  const topics = knowledge.consumers[name];
  assert(topics?.length && topics.every(file => genericSet.files.includes(file)), `Missing knowledge routing: ${name}`);
  const routing = `Resolve bundled paths from the plugin root, two directories above this SKILL.md, not the user's working directory.\nRead \`docs/CAPABILITIES.md\`. The caller owns composition; a small capability does not require the full workflow.\nFor static guidance use \`knowledge/README.md\` and applicable topics: ${topics.map(file => `\`knowledge/${file}\``).join(', ')}.\nKnowledge access grants no execution authority.\n\n`;
  const sourceSkill = await text(join(source, 'skills', name, 'SKILL.md'));
  assert.match(sourceSkill, /\n---\n\n/, `Missing skill frontmatter boundary: ${name}`);
  const skill = sourceSkill.replace(/\n---\n\n/, `\n---\n\n${routing}`);
  await emit(`${base}/LICENSE`, await text(join(root, 'LICENSE')));
  await emit(`${base}/skills/${name}/SKILL.md`, skill);
  await bundleKnowledge(base, genericSet);
  await emit(`${base}/AGENTS.md`, `# ${name}\n\nRead docs/CAPABILITIES.md and knowledge/README.md.\n${name === 'a11y-workflow' ? 'This optional composition also follows docs/WORKFLOW.md.' : 'The caller owns sequencing. Use independent capability operations; do not create a full workflow run unless explicitly requested.'}\nUse only authorized configured tool connections for external effects; missing capability fails explicitly.\n${definition.description}\n`);
  entries.push({ name, source: `./${base}`, description: definition.description, version: pkg.version,
    author: { name: 'kaixun96' } });
}
const knowledgeName = knowledge.plugin.name;
const knowledgeBase = `plugins/${knowledgeName}`;
assert.equal(knowledgeName, 'a11y-knowledge');
await emit(`${knowledgeBase}/plugin.json`, json({
  ...knowledge.plugin, version: pkg.version, author: { name: 'kaixun96' }, license: 'Microsoft Internal'
}));
await emit(`${knowledgeBase}/LICENSE`, await text(join(root, 'LICENSE')));
await emit(`${knowledgeBase}/AGENTS.md`, '# A11y knowledge\n\nStart with skills/a11y-knowledge/SKILL.md and knowledge/README.md. One read-only skill covers generic and ODSP source review using portable topics and supplied current component documentation. No execution authority or MCP server. Do not invent unavailable project rules.\n');
await bundleKnowledgeReview(knowledgeBase);
entries.push({ ...knowledge.plugin, source: `./${knowledgeBase}`, version: pkg.version, author: { name: 'kaixun96' } });
const setup = {
  name: 'a11y-setup',
  description: 'Check and prepare selected Windows accessibility dependencies using the shared host installer; keep consent, restart and live readiness explicit.'
};
const setupBase = `plugins/${setup.name}`;
await emit(`${setupBase}/plugin.json`, json({
  ...setup, version: pkg.version, author: { name: 'kaixun96' }, license: 'Microsoft Internal'
}));
await emit(`${setupBase}/LICENSE`, await text(join(root, 'LICENSE')));
await emit(`${setupBase}/AGENTS.md`, '# Accessibility environment setup\n\nRead skills/a11y-setup/SKILL.md and docs/SETUP.md. Default check-only; preparation needs explicit host-change authorization and actual ownership. Use the same scoped native installer, selecting only required dependencies. Installation is not live readiness, evidence or permission to change a worker. No MCP or integration dependency.\n');
await bundleSetup(setupBase);
entries.push({ ...setup, source: `./${setupBase}`, version: pkg.version, author: { name: 'kaixun96' } });
const bugBashName = 'a11y-bug-bash';
const bugBashBase = `plugins/${bugBashName}`;
const bugBash = {
  name: bugBashName,
  description: 'Feature-scoped accessibility bug bash: context-driven page checks, reused read-only knowledge review, and evidence-separated findings. Uses existing authorized host tools.'
};
await emit(`${bugBashBase}/plugin.json`, json({
  ...bugBash, version: pkg.version, author: { name: 'kaixun96' }, license: 'Microsoft Internal'
}));
await emit(`${bugBashBase}/LICENSE`, await text(join(root, 'LICENSE')));
await emit(`${bugBashBase}/AGENTS.md`, '# Feature accessibility bug bash\n\nRead skills/a11y-bug-bash/SKILL.md and docs/BUG-BASH.md. This is discovery, not remediation. Reuse internal modules/a11y-knowledge for read-only source review and modules/a11y-setup for environment check/planning; preparation needs separate authorization. Page checks require actual authorized host tools and owned resources; dependency installers are bundled, not third-party browser/AT binaries or an MCP server. Separate reproduced findings, code risks and gaps; do not edit product source, file bugs or publish automatically.\n');
await emit(`${bugBashBase}/skills/${bugBashName}/SKILL.md`, await text(join(source, 'skills', bugBashName, 'SKILL.md')));
for (const file of await readdir(join(source, 'bug-bash'))) {
  await emit(`${bugBashBase}/bug-bash/${file}`, await text(join(source, 'bug-bash', file)));
}
await emit(`${bugBashBase}/docs/BUG-BASH.md`, await text(join(root, 'docs/BUG-BASH.md')));
// Internal instructions retain their own root without registering duplicate public skills.
await bundleKnowledgeReview(`${bugBashBase}/modules/a11y-knowledge`);
await bundleSetup(`${bugBashBase}/modules/a11y-setup`);
entries.push({ ...bugBash, source: `./${bugBashBase}`, version: pkg.version, author: { name: 'kaixun96' } });
validateCatalog(catalog, entries.map(entry => entry.name));
for (const [language, filename] of [['en', 'README.md'], ['zh', 'README.zh-CN.md']]) {
  await emit(filename, renderCatalog(catalog, language));
  for (const entry of catalog) {
    const base = `plugins/${entry.name}`;
    for (const path of entry.docs) await text(join(root, base, path));
    await emit(`${base}/${filename}`, renderPlugin(entry, language, Object.hasOwn(plugins, entry.name)));
  }
}
await emit('.github/plugin/marketplace.json', json({
  name: 'a11y-assist', owner: { name: 'kaixun96' },
  metadata: { version: pkg.version, description: 'Choose independent accessibility knowledge, evidence and workflow plugins for Copilot CLI' },
  plugins: catalog.map(item => entries.find(entry => entry.name === item.name))
}));
const hashes = {};
for (const dir of ['runtime', 'contracts', 'adapters', 'native']) {
  for (const file of await readdir(join(source, dir))) {
    hashes[`src/${dir}/${file}`] = createHash('sha256').update(await text(join(source, dir, file))).digest('hex');
  }
}
await emit('release.json', json({
  schemaVersion: 1, version: pkg.version, marketplace: 'a11y-assist', plugins: entries.map(entry => entry.name),
  knowledge: { manifest: 'src/knowledge/manifest.json', sha256: createHash('sha256').update(genericSet.manifest).digest('hex') },
  hashes
}));
await pruneGenerated(join(root, 'plugins'), generatedFiles, check);
console.log(check ? 'Generated packages match source.' : `Built ${entries.length} independently packaged plugins.`);
