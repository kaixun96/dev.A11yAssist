import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateAtInput, assessAtReport, validateAtPolicy } from '../src/runtime/builtin-windows-at.mjs';
import { validateCapabilityReceipt, operationDefinition } from '../src/runtime/capability.mjs';

const base = { at: 'nvda', nativeRunId: '1'.repeat(32),
  atProcess: { pid: 123, startedAt: '2026-09-14T00:00:00.1234567Z' },
  browserProcess: { pid: 456, startedAt: '2026-09-14T00:00:00.7654321Z' },
  browserWindowHandle: '123456', command: null, keys: [{ key: 'Tab', delayMilliseconds: 100 }],
  observeMilliseconds: 1000 };
const report = { at: 'nvda', nativeRunId: base.nativeRunId, state: 'observed', behaviorVerdict: 'not-evaluated',
  preflightVerified: true, postcheckVerified: true, ownedCleanupVerified: true, errors: [], cleanupErrors: [],
  beforeText: 'Before\n', afterText: 'Before\nButton\n', transcript: 'Button\n', transcriptAvailable: true };

test('native AT schema requires actual original process identities and bounded OS/voice actions', () => {
  validateAtInput(base);
  for (const mutate of [
    value => { value.keys[0].key = 'Alt+F4'; },
    value => { value.atProcess.startedAt = 'today'; },
    value => { value.browserWindowHandle = '0'; },
    value => { value.keys[0].delayMilliseconds = 2000; },
    value => { value.command = 'arbitrary voice'; },
    value => { value.at = 'synthetic'; }
  ]) {
    const input = structuredClone(base); mutate(input);
    assert.throws(() => validateAtInput(input));
  }
  validateAtInput({ ...base, at: 'voice-access', keys: [], command: 'show-numbers' });
  assert.throws(() => validateAtInput({ ...base, at: 'voice-access', command: 'show-numbers' }));
  assert.equal(operationDefinition('observe-at', 'a11y-capture').provider, 'capture');
  assert.throws(() => operationDefinition('observe-at', 'a11y-validate'));
});

test('raw NVDA output requires an actual append-only transcript plus pre/post/owned cleanup', () => {
  assert.equal(assessAtReport(report, base), true);
  for (const change of [
    value => { value.transcript = ''; },
    value => { value.afterText = 'Changed unrelated text'; },
    value => { value.postcheckVerified = false; },
    value => { value.ownedCleanupVerified = false; },
    value => { value.nativeRunId = '2'.repeat(32); }
  ]) {
    const value = structuredClone(report); change(value);
    assert.throws(() => assessAtReport(value, base));
  }
  assert.equal(assessAtReport({ ...report, state: 'inconclusive', errors: ['original capture failed'] }, base), false);
});

test('Narrator activity is PID/time-bound and cannot be substituted for speech text or NVDA evidence', () => {
  const input = { ...base, at: 'narrator' };
  const observed = { ...report, at: 'narrator', transcriptAvailable: false,
    triggerAt: '2026-09-14T01:00:00Z', observationEndAt: '2026-09-14T01:00:02Z',
    events: [{ id: 5, pid: 123, timestamp: '2026-09-14T01:00:01Z' }] };
  assert.equal(assessAtReport(observed, input), true);
  for (const change of [
    value => { value.events[0].pid = 456; },
    value => { value.events[0].timestamp = '2026-09-14T00:59:59Z'; },
    value => { value.events = []; },
    value => { value.transcriptAvailable = true; }
  ]) {
    const value = structuredClone(observed); change(value);
    assert.throws(() => assessAtReport(value, input));
  }
});

test('Voice Access raw overlay output and capture receipt cannot fabricate mapping or conformance', () => {
  const input = { ...base, at: 'voice-access', keys: [], command: 'show-numbers' };
  const value = { ...report, at: input.at, beforeUi: [],
    afterUi: [{ name: '1', attribution: 'unmapped-requires-independent-page-browser-OS-map' }] };
  assert.equal(assessAtReport(value, input), true);
  value.afterUi[0].attribution = 'page-proven-without-a-map';
  assert.throws(() => assessAtReport(value, input));
  const context = { subject: 'task:unit-task', evaluator: 'unit-box', scenarioHash: 'a'.repeat(64) };
  const receipt = { ...context, stage: 'observe-at', outcome: 'pass', at: input.at,
    nativeRunId: input.nativeRunId, scope: 'raw-at-output', behaviorVerdict: 'not-evaluated',
    independentBehaviorVerified: false, fullCleanupVerified: false, borrowedAtStopped: false,
    gates: { originalExecutionOwned: true, nativePreflightVerified: true, nativeOutputCaptured: true,
      nativePostcheckVerified: true, ownedCaptureCleanupVerified: true },
    artifacts: [{ path: 'native-at/report.json', sha256: 'a'.repeat(64) }] };
  validateCapabilityReceipt('observe-at', receipt, context, input);
  assert.throws(() => validateCapabilityReceipt('observe-at',
    { ...receipt, independentBehaviorVerified: true }, context, input));
});

test('native AT policies are scenario-scoped and reject executable/audio argument injection', () => {
  const path = process.execPath;
  const pinned = { path, sha256: 'a'.repeat(64) };
  const policy = { schemaVersion: 1, machineId: 'unit-box', computerName: 'UNIT-BOX',
    poolRoot: fileURLToPath(new URL('.', import.meta.url)), executionTokenEnvironmentVariable: 'EXECUTION_TOKEN',
    browserExecutable: pinned, atExecutables: { nvda: pinned }, nvdaSpeechViewerTitle: 'NVDA Speech Viewer' };
  validateAtPolicy(policy);
  validateAtPolicy({ ...policy, atExecutables: { narrator: pinned }, ffmpeg: pinned, audioModule: pinned,
    audioInputName: 'Approved Capture', audioOutputName: 'Approved Playback' });
  assert.throws(() => validateAtPolicy({ ...policy, atExecutables: { narrator: pinned },
    ffmpeg: pinned, audioModule: pinned, audioInputName: 'bad" -arbitrary', audioOutputName: 'Playback' }));
});

test('PowerShell AT driver parses without importing UI, launching AT or accessing an evaluator',
  { skip: process.platform !== 'win32' }, () => {
    const path = fileURLToPath(new URL('../src/native/windows-at.ps1', import.meta.url));
    const command = `$ErrorActionPreference='Stop'; $e=$null; $t=$null; $ast=[System.Management.Automation.Language.Parser]::ParseFile('${path.replaceAll("'", "''")}',[ref]$t,[ref]$e); if ($e.Count) { $e | ForEach-Object { Write-Error $_.Message }; exit 1 }; $source=$ast.FindAll({param($n) $n -is [System.Management.Automation.Language.StringConstantExpressionAst] -and $n.Value.Contains('public static class A11yNativeInput')},$true); if ($source.Count -ne 1) { throw 'Native input definition missing' }; Add-Type -TypeDefinition $source[0].Value; if ([Runtime.InteropServices.Marshal]::SizeOf([type][A11yNativeInput+INPUT]) -ne $(if ([IntPtr]::Size -eq 8) {40} else {28})) { throw 'Native INPUT layout does not match Windows ABI' }`;
    const result = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', command],
      { encoding: 'utf8', timeout: 15000, windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
  });
