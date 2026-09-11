import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, access, readFile, writeFile, readdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { fileHash, hash, readConfig, createRun, executeStage, workflow, loadRun, reconcile, assessProgress } from '../runtime/core.mjs';
import { capabilities, invokeCapability, validateCapabilityReceipt } from '../runtime/capability.mjs';
import { executeOperation, operationStatus, reconcileOperation } from '../runtime/operations.mjs';
import { computeScenarioHash } from '../runtime/evidence-v1.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const provider = fileURLToPath(new URL('fixtures/provider.mjs', import.meta.url));
const context = { subject: 'caller-workflow:component-42', scenarioHash: 'a'.repeat(64),
  evaluator: 'authorized-box', head: 'b'.repeat(40), beforeReceiptSha256: 'c'.repeat(64) };
async function fixture(body) {
  const stateRoot = await mkdtemp(join(tmpdir(), 'capability-operations-'));
  const config = { schemaVersion: 1, owner: 'caller-owner', stateRoot, providers: {} };
  const executableSha256 = await fileHash(process.execPath);
  for (const name of ['intake', 'capture', 'validate', 'publish', 'operations', 'resources', 'source', 'review', 'agentow']) {
    config.providers[name] = { executable: process.execPath, args: [provider], executableSha256, timeoutSeconds: 10 };
  }
  try { await body(config, stateRoot); } finally { await rm(stateRoot, { recursive: true }); }
}

test('each capability operates without a Bug journal, host roster, previous stages or AgentOW', async () => {
  await fixture(async (config, dir) => {
    delete config.providers.agentow;
    const path = join(dir, 'config.json');
    await writeFile(path, JSON.stringify(config));
    const independent = await readConfig(path, { fullWorkflow: false });
    await assert.rejects(readConfig(path), /Unsupported configuration\/mode/);
    for (const [action, definition] of Object.entries(capabilities.operations)) {
      if (!definition.plugin) continue;
      const result = await executeOperation(independent, definition.plugin, `one-${action}`, action, context,
        ['release-evaluator', 'recover-media'].includes(action) ? { nativeRunId: 'd'.repeat(32) } : {});
      assert.equal(result.status, 'finished');
      assert.equal(result.receipt.outcome, 'pass');
      assert.equal(result.receipt.gates.claimOwned, undefined);
      assert.equal(result.receipt.subject, context.subject);
      assert.equal(result.nextStage, undefined);
    }
    await assert.rejects(access(join(dir, 'runs')), { code: 'ENOENT' });
  });
});

test('completed evaluator release binds its native run without declaring full cleanup', async () => {
  await fixture(async (config, dir) => {
    const input = { nativeRunId: 'd'.repeat(32) };
    const binding = { subject: context.subject, evaluator: context.evaluator };
    for (const invalid of [{}, { nativeRunId: '../foreign' }, { nativeRunId: new String(input.nativeRunId) },
      { ...input, token: 'never-transport-tokens' }]) {
      await assert.rejects(executeOperation(config, 'a11y-resources', 'bad-release', 'release-evaluator',
        binding, invalid), /requires only input.nativeRunId/);
    }
    await assert.rejects(access(join(dir, 'operations/bad-release')), { code: 'ENOENT' });
    const released = await executeOperation(config, 'a11y-resources', 'release', 'release-evaluator', binding, input);
    assert.equal(released.receipt.nativeRunId, input.nativeRunId);
    assert.equal(released.receipt.gates.ownedProcessesStopped, undefined);
    assert.equal(released.receipt.gates.audioRestored, undefined);
    assert.deepEqual(await executeOperation(config, 'a11y-resources', 'release', 'release-evaluator', binding, input), released);
    const request = JSON.parse(await readFile(join(dir, 'operations/release/operation.json'), 'utf8')).request;
    for (const receipt of [
      { ...released.receipt, nativeRunId: 'e'.repeat(32) },
      { ...released.receipt, releaseMode: 'legacy-token-only' }
    ]) {
      await assert.rejects(invokeCapability(config, 'release-evaluator', request,
        async () => ({ state: 'finished', receipt })), /exact requested native run/);
      assert.throws(() => validateCapabilityReceipt('release-evaluator', receipt, binding, input), /exact requested native run/);
    }
    const path = join(dir, 'operations/release/operation.json');
    const changed = JSON.parse(await readFile(path, 'utf8'));
    changed.receipt.nativeRunId = 'e'.repeat(32);
    changed.receiptSha256 = hash(JSON.stringify(changed.receipt));
    await writeFile(path, JSON.stringify(changed));
    await assert.rejects(operationStatus(config, 'a11y-resources', 'release'), /exact requested native run/);
  });
});

test('narrow media recovery preserves native assignment and cannot stand for whole cleanup', async () => {
  await fixture(async (config, dir) => {
    const input = { nativeRunId: 'd'.repeat(32) };
    const binding = { subject: context.subject, evaluator: context.evaluator };
    for (const invalid of [{}, { nativeRunId: 'wrong' }, { ...input, token: 'forbidden' }]) {
      await assert.rejects(executeOperation(config, 'agent-operations', 'invalid-media', 'recover-media',
        binding, invalid), /requires only input.nativeRunId/);
    }
    await assert.rejects(access(join(dir, 'operations/invalid-media')), { code: 'ENOENT' });
    const result = await executeOperation(config, 'agent-operations', 'media', 'recover-media', binding, input);
    assert.equal(result.receipt.fullCleanupVerified, false);
    assert.equal(result.receipt.gates.ownedProcessesStopped, undefined);
    assert.equal(result.receipt.gates.artifactsPreserved, undefined);
    for (const patch of [
      { nativeRunId: 'e'.repeat(32) }, { recoveryScope: 'all-resources' }, { fullCleanupVerified: true },
      { subject: 'foreign' }, { evaluator: 'foreign' }, { recorderResult: 'not-present' },
      { recorderResult: 'no-tracked-process' }, { recorderResult: null },
      { gates: { ...result.receipt.gates, defaultEndpointsVerified: false } }
    ]) assert.throws(() => validateCapabilityReceipt('recover-media',
      { ...result.receipt, ...patch }, binding, input));
    for (const outcome of ['inconclusive', 'blocked']) {
      const receipt = { ...result.receipt, outcome, reason: 'No current observation', recorderResult: null, gates: {} };
      validateCapabilityReceipt('recover-media', receipt, binding, input);
      assert.throws(() => validateCapabilityReceipt('recover-media',
        { ...receipt, nativeRunId: 'e'.repeat(32) }, binding, input), /exact original assignment/);
    }
    const path = join(dir, 'operations/media/operation.json');
    const changed = JSON.parse(await readFile(path, 'utf8'));
    changed.receipt.fullCleanupVerified = true;
    changed.receiptSha256 = hash(JSON.stringify(changed.receipt));
    await writeFile(path, JSON.stringify(changed));
    await assert.rejects(operationStatus(config, 'agent-operations', 'media'), /limited scope/);
  });
});

test('caller-selected operation ordering does not become an implicit full workflow', async () => {
  await fixture(async config => {
    const published = await executeOperation(config, 'a11y-publish', 'publish-only', 'publish', { head: context.head });
    assert.equal(published.receipt.pr.isDraft, true);
    const captured = await executeOperation(config, 'a11y-capture', 'after-only', 'after', {
      scenarioHash: context.scenarioHash, evaluator: context.evaluator, head: context.head
    });

    assert.equal(captured.receipt.outcome, 'pass');
    const invalid = await executeOperation(config, 'a11y-validate', 'invalid-only', 'validate',
      { scenarioHash: context.scenarioHash }, { outcome: 'inconclusive' });
    assert.equal(invalid.status, 'finished');
    assert.equal(invalid.receipt.outcome, 'inconclusive');
    assert.equal(invalid.nextStage, undefined);
  });
});

test('cached receipts cannot be changed into a different result', async () => {
  await fixture(async (config, dir) => {
    await executeOperation(config, 'a11y-intake', 'sealed', 'intake', { subject: 'issue:X' });
    const path = join(dir, 'operations/sealed/operation.json');
    const state = JSON.parse(await readFile(path, 'utf8'));
    state.receipt.subject = 'issue:Y';
    await writeFile(path, JSON.stringify(state));
    await assert.rejects(operationStatus(config, 'a11y-intake', 'sealed'), /receipt hash mismatch/);
    await assert.rejects(executeOperation(config, 'a11y-intake', 'sealed', 'intake', { subject: 'issue:X' }), /receipt hash mismatch/);
  });
});

test('duplicate IDs return the same verified result and reject changed inputs or ownership', async () => {
  await fixture(async (config, dir) => {
    const first = await executeOperation(config, 'a11y-intake', 'stable-op', 'intake', { subject: 'issue:X' }, { value: 1 });
    const files = await readdir(join(dir, 'operations/stable-op'));
    const second = await executeOperation(config, 'a11y-intake', 'stable-op', 'intake', { subject: 'issue:X' }, { value: 1 });
    assert.deepEqual(second, first);
    assert.deepEqual(await readdir(join(dir, 'operations/stable-op')), files);
    await assert.rejects(executeOperation(config, 'a11y-intake', 'stable-op', 'intake', { subject: 'issue:Y' }), /different inputs/);
    await assert.rejects(operationStatus({ ...config, owner: 'foreign' }, 'a11y-intake', 'stable-op'), /Foreign owner/);
    await assert.rejects(operationStatus(config, 'a11y-capture', 'stable-op'), /Foreign owner/);
  });
});

test('pending, malformed and invalid evidence never authorize a second execution', async () => {
  for (const input of [{ pending: true }, { badGate: 'itemRead' }, { badArtifact: true }, { wrongOwner: true }, { wrongSubject: true }, { escape: true }]) {
    await fixture(async config => {
      if (input.pending) {
        const pending = await executeOperation(config, 'a11y-intake', 'pending-op', 'intake', { subject: 'issue:X' }, input);
        assert.equal(pending.status, 'pending');
        assert(pending.pending.completionCallback);
        const done = await reconcileOperation(config, 'a11y-intake', 'pending-op');
        assert.equal(done.requestId, pending.requestId);
        assert.equal(done.status, 'finished');
      } else {
        await assert.rejects(executeOperation(config, 'a11y-intake', 'pending-op', 'intake', { subject: 'issue:X' }, input));
        assert.equal((await operationStatus(config, 'a11y-intake', 'pending-op')).status, 'pending');
        await assert.rejects(executeOperation(config, 'a11y-intake', 'pending-op', 'intake', { subject: 'issue:X' }, input), /pending/);
      }
    });
  }
});

test('capability-local input, artifact and executor fences do not depend on a workflow', async () => {
  await fixture(async (config, dir) => {
    await assert.rejects(executeOperation(config, 'a11y-intake', 'bad', 'after', context), /cannot invoke/);
    await assert.rejects(executeOperation(config, 'a11y-capture', 'bad', 'after', {}), /requires context/);
    await assert.rejects(executeOperation(config, 'a11y-validate', '../bad', 'validate', { scenarioHash: context.scenarioHash }), /Invalid operation ID/);
    await assert.rejects(executeOperation({ ...config, providers: {} }, 'a11y-publish', 'bad', 'publish', { head: context.head }), /Missing publish/);
    await executeOperation(config, 'a11y-intake', 'pending', 'intake', { subject: 'issue:X' }, { pending: true });
    const changed = structuredClone(config);
    changed.providers.intake.args.push('different-executor');
    await assert.rejects(reconcileOperation(changed, 'a11y-intake', 'pending'), /provider changed/);
    const result = await executeOperation(config, 'a11y-validate', 'artifact', 'validate', { scenarioHash: context.scenarioHash });
    await writeFile(join(dir, 'operations/artifact', result.receipt.artifacts[0].path), 'changed');
    await assert.rejects(operationStatus(config, 'a11y-validate', 'artifact'), /hash mismatch/);
  });
});

test('optional full workflow shares capability gates and keeps its own strict ordering', async () => {
  await fixture(async config => {
    config.mode = 'cli';
    config.devboxes = ['box-one'];
    delete config.providers.agentow;
    const run = await createRun(config, 'external-project:task-42');
    await assert.rejects(executeStage(config, 'a11y-workflow', run.runId, 'publish'), /Phase ordering/);
    await assert.rejects(executeStage(config, 'a11y-workflow', run.runId, 'intake', { badGate: 'itemRead' }), /Missing capability gate/);
    assert((await loadRun(config, run.runId)).pending);
    const other = await createRun(config, 'another-project:task-43');
    for (const stage of workflow.stages) await executeStage(config, 'a11y-workflow', other.runId, stage.id);
    assert.equal((await loadRun(config, other.runId)).status, 'terminal');
  });
});

test('explicit legacy profile retains model, host and source gates without forcing them on generic runs', async () => {
  await fixture(async config => {
    config.mode = 'cli'; config.devboxes = ['box-one']; config.workflowProfile = 'agentow-odsp';
    delete config.providers.source; delete config.providers.review;
    const rejected = await createRun(config, 'legacy-item');
    for (const stage of ['intake', 'before']) await executeStage(config, 'a11y-workflow', rejected.runId, stage);
    await assert.rejects(executeStage(config, 'a11y-workflow', rejected.runId, 'source'), /AgentOW profile/);
    const accepted = await createRun(config, 'legacy-other');
    for (const stage of workflow.stages) {
      await executeStage(config, 'a11y-workflow', accepted.runId, stage.id, { legacyProfile: true });
    }
    assert.equal((await loadRun(config, accepted.runId)).status, 'terminal');
  });
});

test('caller polling persists original policy, survives restart and never permits changed config or execution replay', async () => {
  await fixture(async (config, dir) => {
    config.providers.capture.waiting = { mode: 'caller-poll', pollIntervalSeconds: 1, timeoutSeconds: 60 };
    const pending = await executeOperation(config, 'a11y-capture', 'poll', 'before', context, { pending: true });
    assert.equal(pending.pending.completionCallback, undefined);
    assert.deepEqual(pending.waiting, pending.pending.waiting);
    const before = JSON.parse(await readFile(join(dir, 'operations/poll/operation.json'), 'utf8'));
    assert.deepEqual(before.request.waiting, pending.waiting);
    const changed = structuredClone(config);
    changed.providers.capture.waiting.timeoutSeconds++;
    await assert.rejects(reconcileOperation(changed, 'a11y-capture', 'poll'), /provider changed/);
    delete changed.providers.capture.waiting;
    await assert.rejects(reconcileOperation(changed, 'a11y-capture', 'poll'), /provider changed/);
    await assert.rejects(executeOperation(config, 'a11y-capture', 'poll', 'before', context, { pending: true }), /pending/);
    const done = await reconcileOperation(structuredClone(config), 'a11y-capture', 'poll');
    assert.equal(done.requestId, pending.requestId);
    assert.equal(done.status, 'finished');
    const after = JSON.parse(await readFile(join(dir, 'operations/poll/operation.json'), 'utf8'));
    assert.deepEqual(after.request, before.request);
  });
});

test('optional workflow shares original polling deadline, exposes progress and preserves phase gates', async () => {
  await fixture(async config => {
    config.mode = 'cli'; config.devboxes = ['box-one'];
    config.providers.intake.waiting = { mode: 'caller-poll', pollIntervalSeconds: 1, timeoutSeconds: 60 };
    const run = await createRun(config, 'poll-workflow');
    const pending = await executeStage(config, 'a11y-workflow', run.runId, 'intake', { pending: true });
    assert.equal(pending.pending.waiting.mode, 'caller-poll');
    assert(pending.pending.progressPath);
    assert.equal(assessProgress(pending, Date.parse(pending.updatedAt)).action, 'await-caller-poll-interval');
    assert.equal(assessProgress(pending, Date.parse(pending.updatedAt) + 1000).action, 'reconcile-original-request');
    assert.equal(assessProgress(pending, Date.parse(pending.pending.waiting.deadlineAt)).action,
      'polling-deadline-exceeded-reconcile-original-request');
    await assert.rejects(executeStage(config, 'a11y-workflow', run.runId, 'before'), /pending/);
    const done = await reconcile(config, 'a11y-workflow', run.runId);
    assert.equal(done.nextStage, 'before');
    assert.equal(done.receipts[0].requestId, pending.pending.requestId);
  });
});

test('copied capture CLI can exit, reopen and reconcile after its original waiting deadline without Twin', async () => {
  await fixture(async (config, dir) => {
    config.providers.capture.waiting = { mode: 'caller-poll', pollIntervalSeconds: 1, timeoutSeconds: 3 };
    const copied = join(dir, 'standalone');
    await cp(join(root, 'plugins/a11y-capture'), copied, { recursive: true });
    const configPath = join(dir, 'config.json'), requestPath = join(dir, 'request.json');
    await writeFile(configPath, JSON.stringify(config));
    await writeFile(requestPath, JSON.stringify({ context, input: { pending: true, outcome: 'inconclusive' } }));
    const runCli = args => {
      const child = spawnSync(process.execPath, [join(copied, 'runtime/cli.mjs'), ...args], {
        encoding: 'utf8', env: { ...process.env, A11Y_ASSIST_CONFIG: configPath }, timeout: 15000
      });
      assert.equal(child.status, 0, child.stderr);
      return JSON.parse(child.stdout);
    };
    const pending = runCli(['invoke', 'a11y-capture', 'cli-poll', 'before', requestPath]);
    assert.equal(pending.status, 'pending');
    assert.equal(pending.pending.completionCallback, undefined);
    await new Promise(resolve => setTimeout(resolve, Math.max(0, Date.parse(pending.waiting.deadlineAt) - Date.now()) + 10));
    assert.deepEqual(runCli(['operation-status', 'a11y-capture', 'cli-poll']).waiting, pending.waiting);
    const done = runCli(['operation-reconcile', 'a11y-capture', 'cli-poll']);
    assert.equal(done.status, 'finished');
    assert.equal(done.receipt.outcome, 'inconclusive');
    assert.equal(done.requestId, pending.requestId);
    await assert.rejects(access(join(dir, 'runs')), { code: 'ENOENT' });
  });
});

test('a copied small plugin exposes its independent MCP operation with minimal configuration', async () => {
  await fixture(async (config, dir) => {
    const copied = join(dir, 'standalone');
    await cp(join(root, 'plugins/a11y-validate'), copied, { recursive: true });
    const configPath = join(dir, 'config.json');
    await writeFile(configPath, JSON.stringify(config));
    const requests = [
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'a11y_validate_invoke',
        arguments: { operationId: 'external-check', action: 'validate', context: { scenarioHash: context.scenarioHash } } } },
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'a11y_validate_operation_status',
        arguments: { operationId: 'external-check' } } }
    ];
    const child = spawnSync(process.execPath, [join(copied, 'runtime/mcp.mjs'), 'a11y-validate'], {
      input: requests.map(request => JSON.stringify(request)).join('\n') + '\n',
      encoding: 'utf8', env: { ...process.env, A11Y_ASSIST_CONFIG: configPath }, timeout: 15000
    });

    assert.equal(child.status, 0, child.stderr);
    const replies = child.stdout.trim().split('\n').map(JSON.parse);
    for (const reply of replies) {
      assert.equal(reply.result.isError, undefined, JSON.stringify(reply));
      assert.equal(JSON.parse(reply.result.content[0].text).status, 'finished');
    }
    await assert.rejects(access(join(dir, 'runs')), { code: 'ENOENT' });
  });
});

test('structural evidence validation works without configuration and does not assert behavior PASS', async () => {
  await fixture(async (_config, dir) => {
    const request = {
      version: 1, phase: 'reproduce', scenarioId: 'standalone-scenario',
      bug: { title: 'Caller-supplied scenario' },
      target: { url: 'https://example.invalid', build: 'baseline', fixture: 'fixture', route: '/', flags: [], viewport: { width: 800, height: 600 } },
      assistiveTechnology: { name: 'none', mode: 'static-artifacts', required: false },
      steps: [{ id: 'step', action: 'Inspect supplied evidence', expected: 'Expected state', requiredEvidenceTypes: ['screenshot'] }],
      requiredEvidenceTypes: ['screenshot']
    };
    request.scenarioHash = computeScenarioHash(request);
    const result = {
      version: 1, phase: 'reproduce', scenarioId: request.scenarioId, scenarioHash: request.scenarioHash,
      outcome: 'reproduced', testedBuild: 'baseline',
      stepResults: [{ stepId: 'step', status: 'fail', actual: 'Reported unexpected state', evidence: ['shot'] }],
      evidence: [{ id: 'shot', type: 'screenshot', uri: 'caller-evidence://unfetched', sha256: 'd'.repeat(64) }]
    };
    const requestPath = join(dir, 'request.json'), resultPath = join(dir, 'result.json');
    await writeFile(requestPath, JSON.stringify(request));
    await writeFile(resultPath, JSON.stringify(result));
    const env = { ...process.env };
    delete env.A11Y_ASSIST_CONFIG;
    const messages = [
      { jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'a11y_validate_evidence',
        arguments: { phase: 'reproduce', requestPath, resultPath } } },
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'a11y_validate_evidence',
        arguments: { phase: 'verify', requestPath, resultPath } } }
    ];
    const child = spawnSync(process.execPath, [join(root, 'plugins/a11y-validate/runtime/mcp.mjs'), 'a11y-validate'], {
      input: messages.map(message => JSON.stringify(message)).join('\n') + '\n', encoding: 'utf8', env, timeout: 15000
    });
    assert.equal(child.status, 0, child.stderr);
    const replies = child.stdout.trim().split('\n').map(JSON.parse);
    const structural = JSON.parse(replies[0].result.content[0].text);
    assert.equal(structural.valid, true);
    assert.equal(structural.independentBehaviorVerified, false);
    assert.equal(structural.artifactUriBytesVerified, false);
    assert.equal(replies[1].result.isError, true);
    assert.match(replies[1].result.content[0].text, /baselineRequestPath/);
    await assert.rejects(access(join(dir, 'operations')), { code: 'ENOENT' });
    await assert.rejects(access(join(dir, 'runs')), { code: 'ENOENT' });
  });
});
