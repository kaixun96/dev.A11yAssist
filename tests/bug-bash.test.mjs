import test from 'node:test';
import assert from 'node:assert/strict';
import { access, cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const load = async path => JSON.parse(await text(path));
const base = join(root, 'plugins/a11y-bug-bash');
const digest = body => createHash('sha256').update(body).digest('hex');
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

test('isolated Bug Bash has one public skill and the exact complete knowledge module, without runtime dependencies', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bug-bash-plugin-'));
  try {
    await cp(base, directory, { recursive: true });
    const moduleRoot = join(directory, 'modules/a11y-knowledge');
    const plugin = await load(join(directory, 'plugin.json'));
    assert.equal(plugin.name, 'a11y-bug-bash');
    assert.equal(plugin.mcpServers, undefined);
    assert.deepEqual(await readdir(join(directory, 'skills')), ['a11y-bug-bash']);
    const expectedModule = [];
    for (const subtree of ['skills', 'knowledge', 'integrations']) {
      for (const path of await filesUnder(join(root, 'plugins/a11y-knowledge', subtree))) {
        const relative = `${subtree}/${path}`;
        expectedModule.push(relative);
        assert.equal(await text(join(moduleRoot, relative)),
          await text(join(root, 'plugins/a11y-knowledge', relative)), relative);
      }
    }
    assert.deepEqual(await filesUnder(moduleRoot), expectedModule.sort());
    for (const name of ['a11y-knowledge', 'a11y-knowledge-odsp']) {
      assert.equal(await text(join(moduleRoot, 'skills', name, 'SKILL.md')),
        await text(join(root, 'src/skills', name, 'SKILL.md')));
    }
    for (const prefix of ['knowledge', 'integrations/agentow/knowledge']) {
      const manifest = await load(join(moduleRoot, prefix, 'manifest.json'));
      for (const [path, hash] of Object.entries(manifest.hashes)) {
        assert.equal(digest(await text(join(moduleRoot, prefix, path))), hash);
        if (path.startsWith('snapshot/')) assert.match(path, /\.source\.(md|txt)$/);
      }
    }
    const resources = ['context.template.md', 'coverage.json', 'report.template.md'];
    const expected = [
      'plugin.json', 'AGENTS.md', 'LICENSE', 'README.md', 'README.zh-CN.md',
      'skills/a11y-bug-bash/SKILL.md', 'docs/BUG-BASH.md',
      ...resources.map(path => `bug-bash/${path}`),
      ...expectedModule.map(path => `modules/a11y-knowledge/${path}`)
    ];
    assert.deepEqual(await filesUnder(directory), expected.sort());
    for (const path of resources) {
      assert.equal(await text(join(directory, 'bug-bash', path)),
        await text(join(root, 'src/bug-bash', path)));
    }
    for (const path of ['README.md', 'README.zh-CN.md', 'docs/BUG-BASH.md',
      'modules/a11y-knowledge/knowledge/README.md',
      ...['README.md', 'fluent-spds.md', 'sharepoint.md', 'complete-source-guide.md']
        .map(file => `modules/a11y-knowledge/integrations/agentow/knowledge/${file}`)]) {
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
  const index = await load(join(base, coverage.knowledgeRoot, 'index.json'));
  const topics = new Set(index.topics.map(topic => topic.file));
  for (const row of coverage.dimensions) {
    assert(topics.has(row.topic));
    await access(join(base, coverage.knowledgeRoot, row.topic));
    assert(row.checks.length >= 3 && row.checks.every(check => typeof check === 'string' && check.trim()));
  }
  const skill = await text(join(base, 'skills/a11y-bug-bash/SKILL.md'));
  for (const status of coverage.rowStatuses) assert(skill.includes(`\`${status}\``));
  const generic = await load(join(root, 'src/knowledge/index.json'));
  assert.deepEqual(generic.consumers['a11y-bug-bash'], generic.consumers['a11y-knowledge']);
  const project = await load(join(root, 'integrations/agentow/knowledge/index.json'));
  assert.deepEqual(project.consumers['a11y-bug-bash'], project.consumers['a11y-knowledge']);
});

test('entrypoint and templates retain track isolation, evidence distinctions, scope and cleanup', async () => {
  const skill = await text(join(base, 'skills/a11y-bug-bash/SKILL.md'));
  assert.equal(skill, await text(join(root, 'src/skills/a11y-bug-bash/SKILL.md')));
  for (const path of ['docs/BUG-BASH.md', 'bug-bash/context.template.md',
    'bug-bash/coverage.json', 'bug-bash/report.template.md',
    'modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md']) {
    assert(skill.includes(`\`${path}\``));
    await access(join(base, path));
  }
  for (const pattern of [
    /source-only` never opens a browser/, /page-only` never reads product source/,
    /plan-only` stops after the plan/, /overall result partial/,
    /No source branch, source edits, builds/, /bug filing/,
    /Missing tools are gaps/, /exclusive desktop ownership/,
    /read-only.*handlers, styles/s, /Do not upgrade.*until actual evidence supports it/s,
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
