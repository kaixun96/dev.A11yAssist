import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { workflow, createRun, readConfig, doctor, executeStage, reconcile, loadRun,
  fileHash, callProvider, resourceStatus, abandonRun, assessProgress } from '../src/runtime/core.mjs';

const provider = fileURLToPath(new URL('fixtures/provider.mjs', import.meta.url));
async function fixture(run) {
  const dir = await mkdtemp(join(tmpdir(), 'a11y-plugin-test-'));
  const cfg = { schemaVersion: 1, mode: 'cli', owner: 'test-owner', stateRoot: dir,
    devboxes: ['box-one'], providers: {} };
  const executableSha256 = await fileHash(process.execPath);
  for (const name of ['intake', 'capture', 'source', 'review', 'validate', 'publish', 'operations', 'resources']) {
    cfg.providers[name] = { executable: process.execPath, args: [provider], executableSha256, timeoutSeconds: 10 };
  }
  try { await run(cfg, dir); } finally { await rm(dir, { recursive: true }); }
}

test('current full workflow needs no profile; cleanup is required for completion', async () => {
  await fixture(async cfg => {
    const run = await createRun(cfg, '123');
    for (const stage of workflow.stages) {
      const state = await executeStage(cfg, stage.plugin, run.runId, stage.id);
      if (stage.id !== 'cleanup') assert.notEqual(state.status, 'terminal');
    }
    const end = await loadRun(cfg, run.runId);
    assert.equal(end.status, 'terminal');
    assert.equal(end.outcome, 'completed');
    assert.equal(end.receipts.length, 8);
    assert.equal('workflowProfile' in end, false);
  });
});

test('standalone stage cannot skip BEFORE or use another plugin capability', async () => {
  await fixture(async cfg => {
    const run = await createRun(cfg, '124');
    await assert.rejects(executeStage(cfg, 'a11y-workflow', run.runId, 'source'), /Phase ordering/);
    await assert.rejects(executeStage(cfg, 'a11y-intake', run.runId, 'before'), /cannot execute/);
    assert.equal((await loadRun(cfg, run.runId)).pending, null);
  });
});

test('nonreproduced BEFORE cannot produce a branch or PR and still requires cleanup', async () => {
  await fixture(async cfg => {
    const run = await createRun(cfg, '125');
    await executeStage(cfg, 'a11y-intake', run.runId, 'intake');
    const before = await executeStage(cfg, 'a11y-capture', run.runId, 'before', { outcome: 'not-reproduced' });
    assert.equal(before.status, 'needs-cleanup');
    await assert.rejects(executeStage(cfg, 'a11y-workflow', run.runId, 'source'), /Phase ordering/);
    const end = await executeStage(cfg, 'agent-operations', run.runId, 'cleanup');
    assert.equal(end.outcome, 'not-reproduced');
    assert.equal(end.status, 'terminal');
  });
});

test('pending result reconciles same ID and prevents duplicate execute', async () => {
  await fixture(async cfg => {
    const run = await createRun(cfg, '126');
    const first = await executeStage(cfg, 'a11y-intake', run.runId, 'intake', { pending: true });
    assert.equal(first.pending.state, 'awaiting-provider');
    await assert.rejects(executeStage(cfg, 'a11y-intake', run.runId, 'intake'), /pending/);
    const next = await reconcile(cfg, 'a11y-intake', run.runId);
    assert.equal(next.nextStage, 'before');
    assert.equal(next.receipts[0].requestId, first.pending.requestId);
  });
});

test('bad gate, artifact or foreign receipt preserves pending state', async () => {
  for (const input of [{ badGate: 'claimOwned' }, { badArtifact: true }, { wrongOwner: true }, { escape: true }]) {
    await fixture(async cfg => {
      const run = await createRun(cfg, '127');
      await assert.rejects(executeStage(cfg, 'a11y-intake', run.runId, 'intake', input));
      const state = await loadRun(cfg, run.runId);
      assert.equal(state.nextStage, 'intake');
      assert(state.pending);
      assert.equal(state.receipts.length, 0);
    });
  }
});

test('changed HEAD rejects AFTER; no inferred success', async () => {
  await fixture(async cfg => {
    const run = await createRun(cfg, '128');
    for (const stage of ['intake', 'before', 'source']) await executeStage(cfg, 'a11y-workflow', run.runId, stage);
    await assert.rejects(executeStage(cfg, 'a11y-capture', run.runId, 'after', { badHead: true }), /HEAD mismatch/);
  });
});

test('review finding reopens source and requires new AFTER/validation/review', async () => {
  await fixture(async cfg => {
    const run = await createRun(cfg, '129');
    for (const stage of ['intake', 'before', 'source', 'after', 'validate']) await executeStage(cfg, 'a11y-workflow', run.runId, stage);
    const reviewed = await executeStage(cfg, 'a11y-workflow', run.runId, 'review', { outcome: 'changes-requested' });
    assert.equal(reviewed.nextStage, 'source');
    await assert.rejects(executeStage(cfg, 'a11y-publish', run.runId, 'publish'), /Phase ordering/);
    await executeStage(cfg, 'a11y-workflow', run.runId, 'source', { head: 'd'.repeat(40) });
    const state = await loadRun(cfg, run.runId);
    assert.equal(state.head, 'd'.repeat(40));
    assert.equal(state.nextStage, 'after');
  });
});

test('missing provider, foreign owner and plugin-version drift fail closed', async () => {
  await fixture(async (cfg, dir) => {
    const run = await createRun(cfg, '130');
    await assert.rejects(loadRun({ ...cfg, owner: 'different' }, run.runId), /Foreign owner/);
    await assert.rejects(executeStage({ ...cfg, providers: {} }, 'a11y-intake', run.runId, 'intake'), /Missing intake/);
    const statePath = join(dir, 'runs', run.runId, 'run.json');
    const state = JSON.parse(await readFile(statePath, 'utf8'));
    state.version = '999.0.0';
    await writeFile(statePath, JSON.stringify(state));
    await assert.rejects(loadRun(cfg, run.runId), /incompatible/);
  });
});

test('resource status never exposes provider-private fields; abandonment is not cleanup', async () => {
  await fixture(async cfg => {
    const status = await resourceStatus(cfg);
    assert(!JSON.stringify(status).includes('must-not-leak'));
    const run = await createRun(cfg, '131');
    const abandoned = await abandonRun(cfg, run.runId, 'Owner explicitly stopped test');
    assert.equal(abandoned.status, 'needs-cleanup');
    assert.equal(assessProgress(await loadRun(cfg, run.runId)).executionRecovered, false);
  });
});

test('only configured supported modes and absolute provider executables are accepted', async () => {
  await fixture(async (cfg, dir) => {
    const path = join(dir, 'config.json');
    await writeFile(path, JSON.stringify(cfg));
    const read = await readConfig(path);
    assert.equal((await doctor(read)).liveReady, false);
    await writeFile(path, JSON.stringify({ ...cfg, mode: 'twin', twin: { conversationId: 'test', runtimePath: resolve('runtime.json') } }));
    await assert.rejects(readConfig(path), /multiple DevBoxes/);
    await writeFile(path, JSON.stringify({ ...cfg, mode: 'linux' }));
    await assert.rejects(readConfig(path), /Unsupported/);
  });
});

test('configuration rejects removed selectors and provider mappings by presence in both modes', async () => {
  await fixture(async (cfg, dir) => {
    const path = join(dir, 'config.json');
    const invalid = [
      ...['agentow-odsp', 'generic', 'unknown', null, false, '', 0, {}].map(workflowProfile => ({ ...cfg, workflowProfile })),
      ...[cfg.providers.source, null, false, '', 0, {}].map(agentow => ({ ...cfg,
        providers: { ...cfg.providers, agentow } }))
    ];
    for (const changed of invalid) {
      await writeFile(path, JSON.stringify(changed));
      for (const fullWorkflow of [true, false]) {
        await assert.rejects(readConfig(path, { fullWorkflow }), /workflowProfile|providers\.agentow/);
      }
    }
    for (const providers of [[], null, { unknown: cfg.providers.source }]) {
      await writeFile(path, JSON.stringify({ ...cfg, providers }));
      await assert.rejects(readConfig(path), /Explicit trusted providers|Unknown provider/);
    }
    await writeFile(path, JSON.stringify(cfg));
    const configured = await readConfig(path);
    const status = await doctor(configured);
    assert.deepEqual(Object.keys(status.capabilities).sort(), Object.keys(cfg.providers).sort());
    assert.equal('agentow' in status.capabilities, false);
    assert.equal('workflowProfile' in configured, false);
  });
});

test('direct APIs reject removed configuration before creating state or calling a provider', async () => {
  await fixture(async (cfg, dir) => {
    const invalid = [
      ...['agentow-odsp', 'generic', null, undefined].map(workflowProfile => ({ ...cfg, workflowProfile })),
      ...[cfg.providers.source, null, undefined].map(agentow => ({ ...cfg, providers: { ...cfg.providers, agentow } })),
      Object.assign(Object.create({ workflowProfile: undefined }), cfg),
      { ...cfg, providers: Object.assign(Object.create({ agentow: undefined }), cfg.providers) }
    ];
    for (const changed of invalid) {
      await assert.rejects(createRun(changed, 'rejected-config'), /workflowProfile|providers\.agentow/);
      await assert.rejects(doctor(changed), /workflowProfile|providers\.agentow/);
      await assert.rejects(loadRun(changed, 'no-existing-run'), /workflowProfile|providers\.agentow/);
      await assert.rejects(callProvider(changed, 'intake', {}), /workflowProfile|providers\.agentow/);
      await assert.rejects(resourceStatus(changed), /workflowProfile|providers\.agentow/);
    }
    await assert.rejects(callProvider(cfg, 'agentow', {}), /Unknown provider: agentow/);
    await assert.rejects(access(join(dir, 'runs')), { code: 'ENOENT' });
  });
});

test('saved profile state is rejected without mutation by status, execute, reconcile and abandonment', async () => {
  await fixture(async (cfg, dir) => {
    const run = await createRun(cfg, 'saved-profile');
    await executeStage(cfg, 'a11y-intake', run.runId, 'intake', { pending: true });
    const path = join(dir, 'runs', run.runId, 'run.json');
    const original = JSON.parse(await readFile(path, 'utf8'));
    for (const workflowProfile of ['agentow-odsp', 'generic', null, false, '', 0, {}]) {
      const saved = JSON.stringify({ ...original, workflowProfile });
      await writeFile(path, saved);
      await assert.rejects(loadRun(cfg, run.runId), /Saved workflowProfile/);
      await assert.rejects(executeStage(cfg, 'a11y-intake', run.runId, 'intake'), /Saved workflowProfile/);
      await assert.rejects(reconcile(cfg, 'a11y-intake', run.runId), /Saved workflowProfile/);
      await assert.rejects(abandonRun(cfg, run.runId, 'Do not mutate rejected state'), /Saved workflowProfile/);
      assert.equal(await readFile(path, 'utf8'), saved);
    }
    const oldBinding = JSON.stringify({ ...original, pending: { ...original.pending, provider: 'agentow' } });
    await writeFile(path, oldBinding);
    await assert.rejects(loadRun(cfg, run.runId), /Saved providers\.agentow/);
    await assert.rejects(reconcile(cfg, 'a11y-intake', run.runId), /Saved providers\.agentow/);
    assert.equal(await readFile(path, 'utf8'), oldBinding);
    await writeFile(path, JSON.stringify(original));
    const resumed = await reconcile(cfg, 'a11y-intake', run.runId);
    assert.equal(resumed.receipts[0].requestId, original.pending.requestId);
  });
});

test('current workflow supports CLI Windows DevBox pools and Twin multiple DevBoxes without a selector', async () => {
  await fixture(async (cfg, dir) => {
    const path = join(dir, 'config.json');
    for (const setup of [
      { mode: 'cli', devboxes: ['box-one'] },
      { mode: 'cli', devboxes: ['box-one', 'box-two'] },
      { mode: 'twin', devboxes: ['box-one', 'box-two'],
        twin: { conversationId: 'test-conversation', runtimePath: join(dir, 'twin-runtime.json') } }
    ]) {
      await writeFile(path, JSON.stringify({ ...cfg, ...setup }));
      const configured = await readConfig(path);
      const run = await createRun(configured, 'current-host-workflow');
      for (const stage of workflow.stages) await executeStage(configured, stage.plugin, run.runId, stage.id);
      const completed = await loadRun(configured, run.runId);
      assert.equal(completed.status, 'terminal');
      assert.equal(completed.outcome, 'completed');
      assert.equal(completed.evaluator, 'box-one');
      assert.equal('workflowProfile' in completed, false);
    }
  });
});

test('source and review require their own providers, and pending executor hashes remain binding', async () => {
  await fixture(async cfg => {
    const run = await createRun(cfg, 'explicit-providers');
    for (const stage of workflow.stages) {
      if (['source', 'review'].includes(stage.id)) {
        const providers = { ...cfg.providers };
        delete providers[stage.id];
        await assert.rejects(executeStage({ ...cfg, providers }, 'a11y-workflow', run.runId, stage.id),
          new RegExp(`Missing ${stage.id} provider`));
        assert.equal((await loadRun(cfg, run.runId)).pending, null);
      }
      await executeStage(cfg, 'a11y-workflow', run.runId, stage.id);
    }
    const pending = await createRun(cfg, 'pinned-executor');
    await executeStage(cfg, 'a11y-intake', pending.runId, 'intake', { pending: true });
    const changed = structuredClone(cfg);
    changed.providers.intake.args.push('different-executor');
    await assert.rejects(reconcile(changed, 'a11y-intake', pending.runId), /provider changed/);
    const badHash = structuredClone(cfg);
    badHash.providers.intake.executableSha256 = '0'.repeat(64);
    await assert.rejects(callProvider(badHash, 'intake', {}), /executable hash changed/);
    assert.equal((await loadRun(cfg, pending.runId)).receipts.length, 0);
    assert.equal((await reconcile(cfg, 'a11y-intake', pending.runId)).nextStage, 'before');
  });
});
