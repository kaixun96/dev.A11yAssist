// Test-only provider. Never bundled into a plugin or enabled in example config.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

let input = '';
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
const contract = JSON.parse(await readFile(new URL('../../contracts/workflow.json', import.meta.url), 'utf8'));
const capabilities = JSON.parse(await readFile(new URL('../../contracts/capabilities.json', import.meta.url), 'utf8'));
const identity = { schemaVersion: 1, requestId: request.requestId,
  runId: request.run.runId, owner: request.run.owner };
if (request.operation === 'status') {
  console.log(JSON.stringify({ ...identity, state: 'finished',
    resources: [{ id: 'box-one', kind: 'evaluator', health: 'test-fixture', secret: 'must-not-leak' }] }));
} else if (request.operation === 'reconcile') {
  const original = JSON.parse(await readFile(join(request.stateDirectory, `request-${request.requestId}.json`), 'utf8'));
  assert.deepEqual(request.waiting, original.waiting, 'Reconciliation changed original waiting policy');
  const receipt = JSON.parse(await readFile(join(request.stateDirectory, `provider-${request.requestId}.json`), 'utf8'));
  console.log(JSON.stringify({ ...identity, state: 'finished', receipt }));
} else {
  await writeFile(join(request.stateDirectory, `request-${request.requestId}.json`), JSON.stringify(request), { flag: 'wx' });
  const artifact = `evidence-${request.requestId}.json`;
  const data = JSON.stringify({ fixture: true, stage: request.stage, requestId: request.requestId });
  await writeFile(join(request.stateDirectory, artifact), data, { flag: 'wx' });
  const receipt = {
    ...identity, stage: request.stage, subject: request.run.subject, outcome: request.input.outcome ?? 'pass',
    reason: request.input.outcome ? 'Test fixture outcome' : undefined,
    gates: Object.fromEntries([
      ...(request.invocation === 'capability' ? [] : contract.stages.find(s => s.id === request.stage).gates),
      ...capabilities.operations[request.stage].gates,
      ...(request.input.legacyProfile ? ['codespaceOwned', 'codespaceReleased', 'freshnessVerifiedOnExecutionHost', 'agentowA11yMode', 'effectiveModelVerified'] : [])
    ].map(g => [g, true])),
    scenarioHash: request.run.scenarioHash ?? 'a'.repeat(64),
    evaluator: request.run.evaluator ?? 'box-one',
    head: request.stage === 'source' ? (request.input.head ?? 'b'.repeat(40)) : request.run.head,
    entrypoint: request.input.legacyProfile ? '/agentow-a11y' : '/test-source', model: request.input.legacyProfile ? 'gpt-6-astra' : 'test-model', prCreated: false,
    beforeReceiptSha256: request.run.beforeReceiptSha256 ?? request.run.receipts.find(r => r.stage === 'before')?.sha256,
    pr: { url: 'https://example.invalid/pullrequest/123', isDraft: true },
    artifacts: [{ path: artifact, sha256: createHash('sha256').update(data).digest('hex') }]
  };
  if (request.stage === 'release-evaluator') {
    receipt.nativeRunId = request.input.nativeRunId;
    receipt.releaseMode = 'completed-owned-run';
  }
  if (request.input.badGate) receipt.gates[request.input.badGate] = false;
  if (request.input.badHead) receipt.head = 'c'.repeat(40);
  if (request.input.badArtifact) receipt.artifacts[0].sha256 = '0'.repeat(64);
  if (request.input.escape) receipt.artifacts[0].path = '../escape.txt';
  if (request.input.wrongOwner) receipt.owner = 'foreign';
  if (request.input.wrongSubject) receipt.subject = 'different-item';
  if (request.input.wrongScenario) receipt.scenarioHash = 'f'.repeat(64);
  await writeFile(join(request.stateDirectory, `provider-${request.requestId}.json`), JSON.stringify(receipt), { flag: 'wx' });
  if (request.input.pending) {
    console.log(JSON.stringify({ ...identity, state: 'pending',
      resumeCondition: 'Test fixture is ready for reconciliation',
      progressPath: artifact, ...(request.waiting ? { waiting: request.waiting } : { completionCallback: 'test-only-callback' }) }));
  } else console.log(JSON.stringify({ ...identity, state: 'finished', receipt }));
}
