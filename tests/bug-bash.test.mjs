import test from 'node:test';
import assert from 'node:assert/strict';
import { access, cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { loadKnowledgeBase } from '../tools/knowledge-base.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const load = async path => JSON.parse(await text(path));
const base = join(root, 'plugins/a11y-bug-bash');
async function filesUnder(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink());
    const path = prefix + entry.name;
    if (entry.isDirectory()) files.push(...await filesUnder(join(directory, entry.name), path + '/'));
    else files.push(path);
  }
  return files.sort();
}

test('isolated Bug Bash has one public skill, a prefix-only internal knowledge skill and no operational runtime or peer dependencies', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bug-bash-plugin-'));
  try {
    await cp(base, directory, { recursive: true });
    const moduleRoot = join(directory, 'modules/a11y-knowledge');
    const plugin = await load(join(directory, 'plugin.json'));
    assert.equal(plugin.name, 'a11y-bug-bash');
    const mcp = await load(join(directory, '.mcp.json'));
    assert.deepEqual(plugin.mcpServers, mcp.mcpServers);
    assert.deepEqual(plugin.mcpServers, {
      a11y_bug_bash_knowledge: { command: 'node', args: ['${PLUGIN_ROOT}/runtime/knowledge-mcp.mjs', 'a11y-bug-bash'] }
    });
    assert.deepEqual(await readdir(join(directory, 'skills')), ['a11y-bug-bash']);
    const expectedModule = ['skills/a11y-knowledge/SKILL.md'];
    assert.deepEqual(await filesUnder(moduleRoot), expectedModule);
    const authored = await text(join(root, 'src/skills/a11y-knowledge/SKILL.md'));
    const internal = await text(join(moduleRoot, expectedModule[0]));
    assert.equal(internal, authored.replaceAll('a11y_knowledge_knowledge_', 'a11y_bug_bash_knowledge_'));
    assert.match(authored, /a11y_knowledge_knowledge_/);
    assert.match(internal, /\$\{PLUGIN_ROOT\}\/references\/README\.md/);
    assert.doesNotMatch(internal, /a11y_knowledge_knowledge_|CLAUDE_PLUGIN_ROOT|a11y-knowledge-odsp|integrations\/|modules\/a11y-knowledge\/references/);
    for (const action of ['list', 'search', 'read']) assert(internal.includes(`a11y_bug_bash_knowledge_${action}`));
    const reference = await load(join(directory, 'references/knowledge.json'));
    assert.deepEqual(reference, await load(join(root, 'plugins/a11y-knowledge/references/knowledge.json')));
    assert.deepEqual(Object.keys(reference.packages), ['common', 'fluent', 'sharepoint']);
    assert.deepEqual((await readdir(join(directory, 'runtime'))).sort(), ['knowledge-mcp.mjs', 'knowledge.mjs']);
    for (const file of ['knowledge-mcp.mjs', 'knowledge.mjs']) {
      assert.equal(await text(join(directory, 'runtime', file)), await text(join(root, 'src/runtime', file)));
    }
    const resources = ['context.template.md', 'coverage.json', 'report.template.md'];
    const expected = [
      'plugin.json', '.mcp.json', 'AGENTS.md', 'LICENSE', 'README.md', 'README.zh-CN.md',
      'references/README.md', 'references/knowledge.json', 'runtime/knowledge-mcp.mjs', 'runtime/knowledge.mjs',
      'skills/a11y-bug-bash/SKILL.md', 'docs/BUG-BASH.md',
      ...resources.map(path => `bug-bash/${path}`),
      ...expectedModule.map(path => `modules/a11y-knowledge/${path}`),
      'modules/a11y-setup/skills/a11y-setup/SKILL.md', 'native/windows-host.ps1',
      'setup/profiles.json', 'setup/report.template.md', 'docs/SETUP.md'
    ];
    assert.deepEqual(await filesUnder(directory), expected.sort());
    for (const path of resources) {
      assert.equal(await text(join(directory, 'bug-bash', path)),
        await text(join(root, 'src/bug-bash', path)));
    }
    assert.equal(await text(join(directory, 'docs/BUG-BASH.md')), await text(join(root, 'docs/BUG-BASH.md')));
    for (const path of ['README.md', 'README.zh-CN.md', 'docs/BUG-BASH.md', 'references/README.md']) {
      for (const match of (await text(join(directory, path))).matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
        if (/^https:/.test(match[1])) continue;
        await access(join(directory, dirname(path), match[1]));
      }
    }
  } finally {
    await rm(directory, { recursive: true });
  }
});

test('coverage prompts reuse existing topics and preserve explicit nonpass accounting', async () => {
  const coverage = await load(join(base, 'bug-bash/coverage.json'));
  assert.equal(coverage.schemaVersion, 1);
  assert.equal(coverage.scope, 'feature-discovery-planning-not-conformance');
  assert.deepEqual(coverage.rowStatuses, [
    'planned', 'observed-no-issue', 'finding', 'blocked', 'not-run', 'not-applicable', 'inconclusive'
  ]);
  assert.deepEqual(coverage.findingClasses, ['page-reproduced', 'source-supported-risk']);
  assert.deepEqual(coverage.dimensions.map(row => row.id), [
    'semantics', 'keyboard', 'focus', 'screen-reader', 'forms', 'visual',
    'reflow', 'dynamic', 'pointer-alternatives', 'content-motion'
  ]);
  const kb = await loadKnowledgeBase(join(root, 'accessibility-kb'), { verifyManifest: true });
  const reference = await load(join(base, 'references/knowledge.json'));
  const topics = {
    semantics: 'component-accessibility', keyboard: 'keyboard-focus', focus: 'keyboard-focus',
    'screen-reader': 'dynamic-content', forms: 'forms-and-content', visual: 'visual-accessibility',
    reflow: 'visual-accessibility', dynamic: 'dynamic-content',
    'pointer-alternatives': 'component-accessibility', 'content-motion': 'forms-and-content'
  };
  assert.doesNotMatch(JSON.stringify(coverage), /modules\/a11y-knowledge\/knowledge|integrations\/|index\.json/);
  for (const row of coverage.dimensions) {
    const id = `common.topic.${topics[row.id]}`;
    assert.equal(row.topic, id);
    assert(kb.entries.has(id), `Coverage must cite an actual shared KB entry: ${id}`);
    assert.equal(reference.packages.common, kb.packages.get('common').version);
    assert(row.checks.length >= 3 && row.checks.every(check => typeof check === 'string' && check.trim()));
  }
  const skill = await text(join(base, 'skills/a11y-bug-bash/SKILL.md'));
  for (const status of coverage.rowStatuses) assert(skill.includes(`\`${status}\``));
  assert.deepEqual(reference, await load(join(root, 'plugins/a11y-knowledge/references/knowledge.json')));
});

test('entrypoint and templates retain track isolation, evidence distinctions, scope and cleanup', async () => {
  const skill = await text(join(base, 'skills/a11y-bug-bash/SKILL.md'));
  assert.equal(skill, await text(join(root, 'src/skills/a11y-bug-bash/SKILL.md')));
  assert.match(skill, /\$\{PLUGIN_ROOT\}/);
  assert.match(skill, /a11y_bug_bash_knowledge_/);
  assert.doesNotMatch(skill, /sibling ODSP skill|integrations\/|modules\/a11y-knowledge\/knowledge|browser, scanner, AT recorder or MCP server/i);
  for (const path of ['docs/BUG-BASH.md', 'bug-bash/context.template.md',
    'bug-bash/coverage.json', 'bug-bash/report.template.md',
    'modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md']) {
    assert(skill.includes(`\`${path}\``) || skill.includes('`${PLUGIN_ROOT}/' + path + '`'));
    await access(join(base, path));
  }
  for (const pattern of [
    /source-only` never opens a browser/, /page-only` never reads product source/,
    /plan-only` stops after the plan/, /overall result partial/,
    /No source branch, source edits, builds/, /bug filing/,
    /Missing tools are gaps/, /exclusive desktop ownership/,
    /read-only.*handlers, styles/s, /Do not upgrade.*until actual evidence supports it/s,
    /AT claims require the real named AT\/version and observed output/,
    /A screenshot\s+cannot prove an announcement/, /not screen-reader speech or proof of conformance/,
    /do not claim repeatability|cannot be repeated/, /their build binding\s+is known/,
    /Reconcile unknown effects/, /Close only owned/, /not a second rule set/,
    /Do not invoke a globally installed same-name skill/
  ]) assert.match(skill, pattern);
  const context = await text(join(base, 'bug-bash/context.template.md'));
  assert.match(context, /Relationship between source and deployed build/);
  assert.match(context, /no credentials/);
  const report = await text(join(base, 'bug-bash/report.template.md'));
  for (const heading of ['Scope and outcome', 'Coverage matrix', 'Page-reproduced findings',
    'Source-supported risks (runtime not verified)', 'Context questions and uncovered checks',
    'Evidence index', 'Cleanup and resume']) {
    assert(report.includes(`## ${heading}`));
  }
  assert.match(report, /not WCAG conformance/);
  assert.match(report, /total applicable rows/);
  assert.match(report, /no automatic ticket\/PR\/public upload/);
});
