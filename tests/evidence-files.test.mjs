import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mkdtemp, mkdir, writeFile, readFile, rm, cp, symlink, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { computeScenarioHash, validateA11yEvidenceFiles } from '../runtime/evidence-v1.mjs';
import { validateEvidenceFiles } from '../runtime/evidence-files.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = (path, value) => writeFile(path, JSON.stringify(value));

async function fixture(body) {
  const dir = await mkdtemp(join(tmpdir(), 'a11y-local-evidence-'));
  const beforeRoot = join(dir, 'before'), afterRoot = join(dir, 'after');
  await mkdir(beforeRoot);
  await mkdir(afterRoot);
  const request = {
    version: 1, phase: 'reproduce', scenarioId: 'local-files',
    bug: { title: 'Synthetic caller scenario' },
    target: { url: 'https://example.invalid', build: 'baseline', fixture: 'fixture', route: '/',
      flags: [], viewport: { width: 800, height: 600 } },
    assistiveTechnology: { name: 'none', mode: 'static-artifacts', required: false },
    steps: [{ id: 'step', action: 'Inspect', expected: 'Expected state', requiredEvidenceTypes: ['screenshot'] }],
    requiredEvidenceTypes: ['screenshot']
  };
  request.scenarioHash = computeScenarioHash(request);
  const result = {
    version: 1, phase: 'reproduce', scenarioId: request.scenarioId, scenarioHash: request.scenarioHash,
    outcome: 'reproduced', testedBuild: 'baseline',
    stepResults: [{ stepId: 'step', status: 'fail', actual: 'Synthetic failure', evidence: ['shot'] }],
    evidence: [{ id: 'shot', type: 'screenshot', uri: 'shot.png', sha256: sha('synthetic before bytes') }]
  };
  const input = { phase: 'reproduce', requestPath: join(dir, 'request.json'),
    resultPath: join(dir, 'result.json'), artifactRoot: beforeRoot };
  await json(input.requestPath, request);
  await json(input.resultPath, result);
  await writeFile(join(beforeRoot, 'shot.png'), 'synthetic before bytes');
  await writeFile(join(afterRoot, 'shot.png'), 'synthetic after bytes');
  try { await body({ dir, beforeRoot, afterRoot, input, request, result }); }
  finally { await rm(dir, { recursive: true, force: true }); }
}

async function verification(f) {
  const repoRoot = join(f.dir, 'repo');
  await mkdir(repoRoot);
  const git = args => {
    const child = spawnSync('git', ['-C', repoRoot, ...args], { encoding: 'utf8', timeout: 15000 });
    assert.equal(child.status, 0, child.stderr);
    return child.stdout.trim();
  };
  git(['init', '--quiet']);
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    '-c', 'commit.gpgsign=false', 'commit', '--quiet', '--allow-empty', '-m', 'Synthetic fixture']);
  const head = git(['rev-parse', 'HEAD']);
  const baselineEvidenceSha256 = sha(await readFile(f.input.resultPath));
  const request = { ...f.request, phase: 'verify', baselineEvidenceSha256,
    target: { ...f.request.target, build: `commit:${head}`, commitSha: head } };
  const result = { ...f.result, phase: 'verify', outcome: 'pass',
    testedBuild: request.target.build, testedCommitSha: head, baselineEvidenceSha256,
    stepResults: [{ ...f.result.stepResults[0], status: 'pass', actual: 'Synthetic after result' }],
    evidence: [{ ...f.result.evidence[0], sha256: sha('synthetic after bytes') }] };
  const input = { phase: 'verify', repoRoot, requestPath: join(f.dir, 'after-request.json'),
    resultPath: join(f.dir, 'after-result.json'), baselineRequestPath: f.input.requestPath,
    baselineResultPath: f.input.resultPath, artifactRoot: f.afterRoot, baselineArtifactRoot: f.beforeRoot };
  await json(input.requestPath, request);
  await json(input.resultPath, result);
  return { input, request, result, git };
}

test('local artifact opt-in hashes actual bytes and binds the exact parsed documents, not behavior', async () => {
  await fixture(async f => {
    const result = await validateEvidenceFiles(f.input);
    assert.equal(result.valid, true);
    assert.equal(result.outcome, 'reproduced');
    assert.equal(result.artifactUriBytesVerified, true);
    assert.equal(result.independentBehaviorVerified, false);
    assert.equal(result.artifactFileCount, 1);
    assert.deepEqual(result.documentSha256, {
      request: sha(await readFile(f.input.requestPath)), result: sha(await readFile(f.input.resultPath))
    });
    await writeFile(join(f.beforeRoot, 'shot.png'), 'changed');
    await assert.rejects(validateEvidenceFiles(f.input), /hash mismatch/);
    await rm(join(f.beforeRoot, 'shot.png'));
    await assert.rejects(validateEvidenceFiles(f.input), /ENOENT/);
  });
});

test('omitted roots preserve structural-only remote URI behavior; explicit invalid selection never downgrades', async () => {
  await fixture(async f => {
    f.result.evidence[0].uri = 'https://example.invalid/not-fetched';
    await json(f.input.resultPath, f.result);
    const { artifactRoot, ...original } = f.input;
    const result = await validateEvidenceFiles(original);
    assert.equal(result.scope, 'evidence-v1-structural-validation');
    assert.equal(result.artifactUriBytesVerified, false);
    assert.equal(result.documentSha256, undefined);
    await assert.rejects(validateEvidenceFiles(f.input), /root-relative local/);
    for (const bad of [null, '', [], true, 'relative']) {
      await assert.rejects(validateEvidenceFiles({ ...f.input, artifactRoot: bad }), /absolute path/);
    }
    await assert.rejects(validateEvidenceFiles({ ...original, baselineArtifactRoot: artifactRoot }), /requires verify/);
    await assert.rejects(validateEvidenceFiles({ ...f.input, baselineArtifactRoot: artifactRoot }), /requires verify/);
  });
});

test('all evidence is checked and traversal, URI schemes, encoded paths, directories and escaping links fail', async () => {
  await fixture(async f => {
    const original = structuredClone(f.result);
    for (const uri of ['../outside', '..\\outside', '/absolute', '\\\\server\\share', 'file:///tmp/a',
      'https://example.invalid/a', 'C:\\a', 'shot.png:stream', '%2e%2e/a', 'shot.png?x', 'shot.png#x', './shot.png']) {
      f.result.evidence[0].uri = uri;
      await json(f.input.resultPath, f.result);
      await assert.rejects(validateEvidenceFiles(f.input), /root-relative local/);
    }
    f.result = structuredClone(original);
    f.result.evidence.push({ ...original.evidence[0], id: 'unlinked-extra', uri: 'absent.png' });
    await json(f.input.resultPath, f.result);
    await assert.rejects(validateEvidenceFiles(f.input), /ENOENT/);
    await mkdir(join(f.beforeRoot, 'directory'));
    f.result = structuredClone(original);
    f.result.evidence[0].uri = 'directory';
    await json(f.input.resultPath, f.result);
    await assert.rejects(validateEvidenceFiles(f.input), /missing or hash mismatch/);
    await symlink(f.afterRoot, join(f.beforeRoot, 'escape'), process.platform === 'win32' ? 'junction' : 'dir');
    f.result.evidence[0].uri = 'escape/shot.png';
    await json(f.input.resultPath, f.result);
    await assert.rejects(validateEvidenceFiles(f.input), /symlink escapes/);
  });
});

test('verify hashes BEFORE and AFTER under separate roots and preserves baseline/scenario/actual HEAD gates', async () => {
  await fixture(async f => {
    const v = await verification(f);
    const passed = await validateEvidenceFiles(v.input);
    assert.equal(passed.artifactFileCount, 2);
    assert.equal(passed.outcome, 'pass');
    assert.equal(passed.independentBehaviorVerified, false);
    assert.equal(passed.documentSha256.baselineResult, v.request.baselineEvidenceSha256);
    const { baselineArtifactRoot, ...incomplete } = v.input;
    await assert.rejects(validateEvidenceFiles(incomplete), /baselineArtifactRoot/);
    await assert.rejects(validateEvidenceFiles({ ...v.input, baselineArtifactRoot: f.afterRoot }), /hash mismatch/);
    await writeFile(join(f.beforeRoot, 'shot.png'), 'changed baseline artifact');
    await assert.rejects(validateEvidenceFiles(v.input), /hash mismatch/);
    await writeFile(join(f.beforeRoot, 'shot.png'), 'synthetic before bytes');
    await writeFile(v.input.baselineResultPath, (await readFile(v.input.baselineResultPath)) + '\n');
    await assert.rejects(validateEvidenceFiles(v.input), /baseline result bytes/);
    await json(v.input.baselineResultPath, f.result);
    v.request.target.fixture = 'another scenario';
    await json(v.input.requestPath, v.request);
    await assert.rejects(validateEvidenceFiles(v.input), /scenario/);
    v.request.target.fixture = f.request.target.fixture;
    await json(v.input.requestPath, v.request);
    v.git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false',
      'commit', '--quiet', '--allow-empty', '-m', 'Changed actual HEAD']);
    await assert.rejects(validateEvidenceFiles(v.input), /repository HEAD/);
  });
});

test('CLI and module share the loader and each document is read exactly once', async t => {
  await fixture(async f => {
    const v = await verification(f);
    const reads = new Map();
    const original = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', (path, ...args) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return original(path, ...args);
    });
    const args = { phase: 'verify', request: v.input.requestPath, result: v.input.resultPath,
      'baseline-request': v.input.baselineRequestPath, 'baseline-result': v.input.baselineResultPath,
      'repo-root': v.input.repoRoot };
    const checked = validateA11yEvidenceFiles(args);
    for (const path of [args.request, args.result, args['baseline-request'], args['baseline-result']]) {
      assert.equal(reads.get(path), 1);
    }
    t.mock.restoreAll();
    const child = spawnSync(process.execPath, [join(root, 'runtime/evidence-v1.mjs'),
      ...Object.entries(args).flatMap(([name, value]) => [`--${name}`, value])],
    { encoding: 'utf8', timeout: 15000 });
    assert.equal(child.status, 0, child.stderr);
    assert.deepEqual(JSON.parse(child.stdout), checked.summary);
  });
});

test('copied independent and workflow packages expose the same read-only opt-in with no configuration or run', async () => {
  await fixture(async f => {
    const env = { ...process.env };
    delete env.A11Y_ASSIST_CONFIG;
    for (const plugin of ['a11y-validate', 'a11y-workflow']) {
      const copied = join(f.dir, plugin);
      await cp(join(root, 'plugins', plugin), copied, { recursive: true });
      const name = plugin.replaceAll('-', '_') + '_evidence';
      const messages = [
        { jsonrpc: '2.0', id: 1, method: 'tools/list' },
        { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name, arguments: f.input } },
        { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name, arguments: { ...f.input, artifactRoot: f.afterRoot } } }
      ];
      const child = spawnSync(process.execPath, [join(copied, 'runtime/mcp.mjs'), plugin], {
        input: messages.map(message => JSON.stringify(message)).join('\n') + '\n', encoding: 'utf8', timeout: 15000, env
      });
      assert.equal(child.status, 0, child.stderr);
      const replies = child.stdout.trim().split('\n').map(JSON.parse);
      const tool = replies[0].result.tools.find(tool => tool.name === name);
      assert.equal(tool.inputSchema.properties.artifactRoot.type, 'string');
      assert.equal(tool.inputSchema.properties.baselineArtifactRoot.type, 'string');
      assert.equal(replies[1].result.isError, undefined);
      const result = JSON.parse(replies[1].result.content[0].text);
      assert.equal(result.artifactUriBytesVerified, true);
      assert.equal(result.independentBehaviorVerified, false);
      assert.equal(replies[2].result.isError, true);
      assert.match(replies[2].result.content[0].text, /hash mismatch/);
    }
    await assert.rejects(access(join(f.dir, 'operations')), { code: 'ENOENT' });
    await assert.rejects(access(join(f.dir, 'runs')), { code: 'ENOENT' });
  });
});
