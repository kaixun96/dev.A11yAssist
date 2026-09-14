import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { pruneGenerated } from './generated-tree.mjs';
import { validateCatalog, renderCatalog, renderPlugin } from './catalog.mjs';
import { loadKnowledgeBase, exportKnowledgeBase } from './knowledge-base.mjs';
import { createKnowledgeReference, createKnowledgeDistribution } from './knowledge-reference.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'src');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const plugins = JSON.parse(await readFile(join(source, 'contracts/plugins.json'), 'utf8'));
const catalog = JSON.parse(await readFile(join(source, 'catalog.json'), 'utf8'));
const check = process.argv.includes('--check');
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const generatedFiles = new Set();
const distributionFiles = new Set();
async function emit(path, data) {
  if (path.startsWith('plugins/')) generatedFiles.add(path.slice('plugins/'.length));
  const absolute = join(root, path);
  if (check) {
    const actual = path.startsWith('knowledge-distribution/') ? await readFile(absolute, 'utf8') : await text(absolute);
    assert.equal(actual, data, `Generated file drift: ${path}`);
  } else {
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, data);
  }
}
const json = data => JSON.stringify(data, null, 2) + '\n';
const kb = await loadKnowledgeBase(join(root, 'accessibility-kb'));
const commonReference = createKnowledgeReference(kb, ['common']);
const projectReference = createKnowledgeReference(kb, ['sharepoint']);
assert.deepEqual(Object.keys(projectReference.packages).sort(), ['common', 'fluent', 'sharepoint']);
const completeKb = exportKnowledgeBase(kb, [...kb.packages.keys()]);
await emit('accessibility-kb/manifest.json', completeKb.files.get('manifest.json'));
for (const [reference, selection] of [[commonReference, ['common']], [projectReference, ['sharepoint']]]) {
  const file = `${reference.manifestSha256}.json`;
  await emit(`knowledge-distribution/${file}`, createKnowledgeDistribution(exportKnowledgeBase(kb, selection)));
  distributionFiles.add(file);
}
await pruneGenerated(join(root, 'knowledge-distribution'), distributionFiles, check);

function knowledgeLaunch(name) {
  return { command: 'node', args: ['${PLUGIN_ROOT}/runtime/knowledge-mcp.mjs', name] };
}
async function knowledgeRuntime(base) {
  for (const file of ['knowledge.mjs', 'knowledge-mcp.mjs']) {
    await emit(`${base}/runtime/${file}`, await text(join(source, 'runtime', file)));
  }
}
async function referenceSharedKnowledge(base, reference, pluginName) {
  const prefix = pluginName.replaceAll('-', '_');
  await emit(`${base}/references/knowledge.json`, json(reference));
  await emit(`${base}/references/README.md`, `# Shared accessibility knowledge reference

This plugin does not bundle the current KB. [knowledge.json](knowledge.json)
pins exact package versions, the selected dependency-closed manifest SHA-256,
and the HTTPS distribution URL and artifact SHA-256.

## Automatic knowledge MCP

With Node.js 22+ and an MCP-enabled host, this plugin registers the read-only
tools ${prefix}_knowledge_list, ${prefix}_knowledge_search(query), and
${prefix}_knowledge_read(id). A knowledge tool call automatically resolves and
lazily loads the pinned Common, Fluent and SharePoint KB; no user configuration,
extra knowledge plugin, provider or A11Y_ASSIST_CONFIG is required.
The repository reference helper is optional advanced host setup, not an install
prerequisite or a skill tool.

Resolution order is an optional absolute A11Y_ASSIST_KB_ROOT override, then a
validated repository plugins/<name> development layout, then the shared per-user
cache, then the pinned HTTPS download. An invalid configured root fails without
fallback. The cache defaults to LOCALAPPDATA/A11yAssist/knowledge on Windows or
homedir/.cache/a11y-assist/knowledge elsewhere; optional A11Y_ASSIST_KB_CACHE_ROOT
must be absolute. Cached artifacts are shared per user, not bundled per plugin.
The runtime verifies artifact integrity, the selected manifest, exact packages
and every file; it revalidates cache on every request. Tampering fails explicitly
and is never automatically repaired.

A valid local KB or cached artifact works offline. First uncached use without a
valid local KB needs network access and fails explicitly offline. The pinned
knowledge-distribution/ release artifact must be published at the reference's
fixed HTTPS origin; a local build does not publish it or establish availability.
Downloads send no user data, queries, source code or credentials to the server,
accept no caller URL or redirects, and are limited to 15 seconds and 8 MiB.

Read actual entries and cite their source status; search snippets are not full
rules and pending sources are explicit gaps, not authority. Knowledge tasks may
use registered read-only knowledge MCP tools and relevant source/reference reads,
never setup helpers, shells, tests, browsers, AT or providers. Knowledge access
grants no execution authority and does not bypass capability or workflow gates.
Refresh compatible pins and KB context at a safe point, never by live auto-reload.

All skill paths, including the internal bug-bash knowledge skill, resolve from
the top installed plugin root supplied by the host as \`\${PLUGIN_ROOT}\`.
`);
}
async function bundleKnowledgeReview(base, pluginName) {
  const skill = await text(join(source, 'skills/a11y-knowledge/SKILL.md'));
  // Reuse the same authored skill; only bind tools to the containing plugin.
  await emit(`${base}/skills/a11y-knowledge/SKILL.md`, pluginName === 'a11y-knowledge'
    ? skill : skill.replaceAll('a11y_knowledge_knowledge_', `${pluginName.replaceAll('-', '_')}_knowledge_`));
  // No nested runtime or references: ${PLUGIN_ROOT} remains the installed root.
}
async function pluginManifest(base, definition, operational = false) {
  const { name } = definition;
  const server = name.replaceAll('-', '_');
  const mcpServers = {
    ...(operational ? { [server]: { command: 'node', args: ['${PLUGIN_ROOT}/runtime/mcp.mjs', name] } } : {}),
    [`${server}_knowledge`]: knowledgeLaunch(name)
  };
  await emit(`${base}/plugin.json`, json({
    ...definition, version: pkg.version, author: { name: 'kaixun96' }, license: 'Microsoft Internal', mcpServers
  }));
  await emit(`${base}/.mcp.json`, json({ mcpServers }));
  await emit(`${base}/LICENSE`, await text(join(root, 'LICENSE')));
}

// Setup is current, but its host helper is not part of the execution runtime.
const retiredSourceFiles = new Set(['runtime/profiles.mjs', 'native/provenance.json']);
const setupNative = 'native/windows-host.ps1';
const implementationFiles = [];
for (const dir of ['runtime', 'contracts', 'adapters', 'native']) {
  for (const file of await readdir(join(source, dir))) {
    if (!retiredSourceFiles.has(`${dir}/${file}`) && `${dir}/${file}` !== setupNative) implementationFiles.push(`${dir}/${file}`);
  }
}
async function bundleSetup(base, pluginName = 'a11y-setup') {
  // Internal skills share top-root resources; only their knowledge prefix changes.
  const skillPath = 'skills/a11y-setup/SKILL.md';
  const skill = await text(join(source, skillPath));
  const internal = pluginName !== 'a11y-setup';
  await emit(`${base}/${internal ? 'modules/a11y-setup/' : ''}${skillPath}`,
    internal ? skill.replaceAll('a11y_setup_knowledge_', `${pluginName.replaceAll('-', '_')}_knowledge_`) : skill);
  await emit(`${base}/${setupNative}`, await text(join(source, setupNative)));
  for (const file of await readdir(join(source, 'setup'))) {
    await emit(`${base}/setup/${file}`, await text(join(source, 'setup', file)));
  }
  await emit(`${base}/docs/SETUP.md`, await text(join(root, 'docs/SETUP.md')));
}
const entries = [];
assert.equal(Object.keys(plugins).length, 7, 'Expected seven execution plugins');
for (const [name, definition] of Object.entries(plugins)) {
  const base = `plugins/${name}`;
  const prefix = name.replaceAll('-', '_');
  await pluginManifest(base, { name, description: definition.description }, true);
  for (const file of implementationFiles) await emit(`${base}/${file}`, await text(join(source, file)));
  await knowledgeRuntime(base);
  for (const file of ['CAPABILITIES.md', 'WORKFLOW.md', 'PROVIDERS.md', 'NATIVE-CAPABILITIES.md']) {
    await emit(`${base}/docs/${file}`, await text(join(root, 'docs', file)));
  }
  for (const file of await readdir(join(root, 'config'))) {
    await emit(`${base}/config/${file}`, await text(join(root, 'config', file)));
  }
  const routing = `Read \`\${PLUGIN_ROOT}/docs/CAPABILITIES.md\`. The caller owns composition; a small capability does not require the full workflow.
For shared knowledge read \`\${PLUGIN_ROOT}/references/README.md\` and \`\${PLUGIN_ROOT}/references/knowledge.json\`.
Call ${prefix}_knowledge_list and ${prefix}_knowledge_search(query) to select relevant Common, Fluent and SharePoint IDs for the actual stack/version, then ${prefix}_knowledge_read(id) for full entries with citations and source status.
Knowledge resolves automatically through configured root, validated development layout, verified shared user cache, then pinned HTTPS download. Node.js 22+ and enabled host MCP support are required, but no user configuration or peer plugin is needed. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it.
Unavailable tools or failed knowledge verification are explicit dependency failures. Search snippets are not full rules; pending MAS/product sources remain explicit gaps. Knowledge tasks allow registered read-only knowledge MCP and relevant source/reference reads, never shells, setup helpers, tests, browsers, AT or providers. Knowledge access does not authorize execution or bypass capability/workflow gates.

`;
  const sourceSkill = await text(join(source, 'skills', name, 'SKILL.md'));
  assert.match(sourceSkill, /\n---\n\n/, `Missing skill frontmatter boundary: ${name}`);
  await emit(`${base}/skills/${name}/SKILL.md`, sourceSkill.replace(/\n---\n\n/, `\n---\n\n${routing}`));
  await referenceSharedKnowledge(base, projectReference, name);
  await emit(`${base}/AGENTS.md`, `# ${name}

Read docs/CAPABILITIES.md and references/README.md. Registered read-only MCP tools ${prefix}_knowledge_list, ${prefix}_knowledge_search(query) and ${prefix}_knowledge_read(id) automatically resolve the pinned shared KB declared in references/knowledge.json; current KB files are not bundled. Node.js 22+ and an MCP-enabled host are required, but no user configuration or extra knowledge plugin is needed. First uncached use requires a published pinned artifact and network access unless a valid local KB is configured. Select appropriate entry IDs, read full entries, and cite source status; pending sources are gaps. For knowledge tasks, allow only registered read-only knowledge MCP and relevant source/reference reads, never shells, setup helpers, tests, browsers, AT or providers.
${name === 'a11y-workflow' ? 'This optional composition also follows docs/WORKFLOW.md.' : 'The caller owns sequencing. Use independent capability operations; do not create a full workflow run unless explicitly requested.'}
Use only authorized configured tool connections for external effects; missing capability or required knowledge fails explicitly. Knowledge access does not bypass execution, ownership, evidence or workflow gates.
${definition.description}
`);
  entries.push({ name, source: `./${base}`, description: definition.description, version: pkg.version,
    author: { name: 'kaixun96' } });
}
const knowledgePlugin = {
  name: 'a11y-knowledge',
  description: 'Unified ODSP accessibility knowledge for accessible code generation, root-cause analysis, static/design review and test planning across Common, SPDS, Fluent V8/V9 and SharePoint; read-only, no execution.'
};
const knowledgeName = knowledgePlugin.name;
const knowledgeBase = `plugins/${knowledgeName}`;
await pluginManifest(knowledgeBase, knowledgePlugin);
await knowledgeRuntime(knowledgeBase);
await bundleKnowledgeReview(knowledgeBase, knowledgeName);
await referenceSharedKnowledge(knowledgeBase, projectReference, knowledgeName);
await emit(`${knowledgeBase}/AGENTS.md`, '# ODSP accessibility knowledge\n\nStart with skills/a11y-knowledge/SKILL.md and references/README.md. Use registered read-only MCP tools a11y_knowledge_knowledge_list, a11y_knowledge_knowledge_search(query) and a11y_knowledge_knowledge_read(id) for automatically resolved pinned Common, Fluent and SharePoint knowledge. Select relevant IDs for the actual library/version, read full entries, and cite source status; search snippets are not full rules and pending sources are gaps. Node.js 22+ and an MCP-enabled host are required; no user configuration or extra knowledge plugin is needed. The current KB is not bundled: resolution uses optional configured root, validated development layout, shared per-user cache, then pinned HTTPS download. First uncached use requires network access and the published pinned artifact unless a valid local KB is configured. Unavailable tools or knowledge are explicit dependency failures. Allow only registered read-only knowledge MCP and relevant source/reference reads; no shell, setup helpers, tests, browser, AT, providers or workflow execution. Knowledge access grants no execution authority.\n');
entries.push({ ...knowledgePlugin, source: `./${knowledgeBase}`, version: pkg.version, author: { name: 'kaixun96' } });

const setup = {
  name: 'a11y-setup',
  description: 'Check and prepare selected Windows accessibility dependencies using the shared scoped host helper; keep consent, restart and live readiness explicit.'
};
const setupBase = `plugins/${setup.name}`;
await pluginManifest(setupBase, setup);
await knowledgeRuntime(setupBase);
await referenceSharedKnowledge(setupBase, projectReference, setup.name);
await bundleSetup(setupBase);
await emit(`${setupBase}/AGENTS.md`, '# Accessibility environment setup\n\nRead skills/a11y-setup/SKILL.md, docs/SETUP.md and references/README.md from the top-level ${PLUGIN_ROOT}. Default check-only; preparation needs explicit host-change authorization and actual ownership. Select only approved dependencies through the scoped native helper. No operational MCP, provider or browser/AT runtime is supplied. Installation is not live readiness, evidence or permission to change a worker. For knowledge, use only registered read-only tools a11y_setup_knowledge_list, a11y_setup_knowledge_search(query) and a11y_setup_knowledge_read(id), plus relevant source/reference reads; never invoke setup helpers, shells, tests or browsers for knowledge review. Node.js 22+ and enabled host MCP support are required. Common, Fluent and SharePoint resolve automatically from the pinned shared KB without execution configuration or a peer plugin. First uncached use needs a valid local KB or network access to the published pinned artifact. Read full entries with citations and source status; missing tools or knowledge fail explicitly. Knowledge access grants no host-change authority.\n');
entries.push({ ...setup, source: `./${setupBase}`, version: pkg.version, author: { name: 'kaixun96' } });

const bugBashName = 'a11y-bug-bash';
const bugBashBase = `plugins/${bugBashName}`;
const bugBash = {
  name: bugBashName,
  description: 'Feature-scoped accessibility bug bash: context-driven page checks, reused read-only knowledge review, and evidence-separated findings. Uses existing authorized host tools.'
};
await pluginManifest(bugBashBase, bugBash);
await knowledgeRuntime(bugBashBase);
await referenceSharedKnowledge(bugBashBase, projectReference, bugBashName);
await emit(`${bugBashBase}/AGENTS.md`, '# Feature accessibility bug bash\n\nRead skills/a11y-bug-bash/SKILL.md, docs/BUG-BASH.md and references/README.md. This is discovery, not remediation. Reuse modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md for read-only source review and modules/a11y-setup/skills/a11y-setup/SKILL.md for separately scoped environment checks/planning. Both resolve ${PLUGIN_ROOT} as this top installed plugin root, not the module directory. Setup resources, knowledge references and MCP remain at the top root; internal modules contain only skills. Preparation requires separate host-change authorization and actual ownership; discovery never authorizes installation. Its registered tools are a11y_bug_bash_knowledge_list, a11y_bug_bash_knowledge_search(query) and a11y_bug_bash_knowledge_read(id). Node.js 22+ and enabled host MCP support are required. The shared Common, Fluent and SharePoint KB resolves automatically without a peer plugin or provider; first uncached use needs a valid local KB or network access to the published pinned artifact. This plugin supplies only read-only knowledge MCP, no operational MCP, browser, scanner, AT or provider runtime. Page checks require actual authorized host tools and owned resources. Keep source review read-only and separate from authorized page checks and setup; knowledge review never invokes setup helpers or shells. Separate reproduced findings, code risks and gaps; do not edit product source, file bugs or publish automatically.\n');
await emit(`${bugBashBase}/skills/${bugBashName}/SKILL.md`, await text(join(source, 'skills', bugBashName, 'SKILL.md')));
for (const file of await readdir(join(source, 'bug-bash'))) {
  await emit(`${bugBashBase}/bug-bash/${file}`, await text(join(source, 'bug-bash', file)));
}
await emit(`${bugBashBase}/docs/BUG-BASH.md`, await text(join(root, 'docs/BUG-BASH.md')));
await bundleKnowledgeReview(`${bugBashBase}/modules/a11y-knowledge`, bugBashName);
await bundleSetup(bugBashBase, bugBashName);
entries.push({ ...bugBash, source: `./${bugBashBase}`, version: pkg.version, author: { name: 'kaixun96' } });

assert.equal(entries.length, 10, 'Expected seven execution plugins, knowledge, setup and Bug Bash');
validateCatalog(catalog, entries.map(entry => entry.name));
for (const [language, filename] of [['en', 'README.md'], ['zh', 'README.zh-CN.md']]) {
  await emit(filename, renderCatalog(catalog, language));
  for (const entry of catalog) {
    const base = `plugins/${entry.name}`;
    for (const path of entry.docs) {
      assert(generatedFiles.has(`${entry.name}/${path}`), `Catalog reference is not generated: ${entry.name}/${path}`);
      await text(join(root, base, path));
    }
    await emit(`${base}/${filename}`, renderPlugin(entry, language, Object.hasOwn(plugins, entry.name)));
  }
}
await emit('.github/plugin/marketplace.json', json({
  name: 'a11y-assist', owner: { name: 'kaixun96' },
  metadata: { version: pkg.version, description: 'Choose independent accessibility knowledge, setup, discovery, evidence and workflow plugins for Copilot CLI' },
  plugins: catalog.map(item => entries.find(entry => entry.name === item.name))
}));
const hashes = {};
for (const file of [...implementationFiles, setupNative]) {
  hashes[`src/${file}`] = createHash('sha256').update(await text(join(source, file))).digest('hex');
}
await emit('release.json', json({
  schemaVersion: 1, version: pkg.version, marketplace: 'a11y-assist', plugins: entries.map(entry => entry.name),
  sharedKnowledge: { manifest: 'accessibility-kb/manifest.json',
    sha256: createHash('sha256').update(completeKb.files.get('manifest.json')).digest('hex'),
    packages: completeKb.manifest.packages },
  hashes
}));
await pruneGenerated(join(root, 'plugins'), generatedFiles, check);
console.log(check ? 'Generated packages match source.' : `Built ${entries.length} independently packaged plugins.`);
