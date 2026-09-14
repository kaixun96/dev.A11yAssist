import { readFile, readdir, stat, realpath, open } from 'node:fs/promises';
import { isAbsolute, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { hash, fileHash } from './core.mjs';

const demand = (value, message) => { if (!value) throw new Error(message); };
const nativeRoot = fileURLToPath(new URL('../native/', import.meta.url));
const sha = /^[a-f0-9]{64}$/;
const keys = new Set(['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape', 'ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Home', 'End']);

export function validateWindowsAtProvider(provider) {
  demand(provider.kind === 'windows-at' && isAbsolute(provider.executable ?? '') &&
    sha.test(provider.executableSha256 ?? '') && isAbsolute(provider.policyPath ?? '') &&
    sha.test(provider.policySha256 ?? '') && sha.test(provider.driverSha256 ?? '') &&
    provider.timeoutSeconds === 120, 'Windows AT requires pinned PowerShell, native driver, protected policy and 120-second RPC budget');
}

export function validateAtInput(input) {
  demand(input && typeof input === 'object' &&
    Object.keys(input).sort().join(',') ===
      'at,atProcess,browserProcess,browserWindowHandle,command,keys,nativeRunId,observeMilliseconds' &&
    ['nvda', 'narrator', 'voice-access'].includes(input.at) &&
    /^[a-f0-9]{32}$/.test(input.nativeRunId ?? '') &&
    typeof input.browserWindowHandle === 'string' && /^[1-9]\d{0,18}$/.test(input.browserWindowHandle) &&
    Number.isInteger(input.observeMilliseconds) && input.observeMilliseconds >= 1000 && input.observeMilliseconds <= 10000 &&
    Array.isArray(input.keys) && input.keys.length <= 10,
  'Invalid bounded native AT input');
  for (const process of [input.atProcess, input.browserProcess]) demand(process &&
    Object.keys(process).sort().join(',') === 'pid,startedAt' && Number.isInteger(process.pid) && process.pid > 0 &&
    typeof process.startedAt === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,7})?Z$/.test(process.startedAt) &&
    Number.isFinite(Date.parse(process.startedAt)), 'AT/browser identity requires exact PID and UTC native start time');
  for (const step of input.keys) demand(step && Object.keys(step).sort().join(',') === 'delayMilliseconds,key' &&
    keys.has(step.key) && Number.isInteger(step.delayMilliseconds) &&
    step.delayMilliseconds >= 0 && step.delayMilliseconds <= 1000, 'Unsupported native key or delay');
  demand(input.at === 'voice-access'
    ? input.keys.length === 0 && ['show-numbers', 'hide-numbers'].includes(input.command)
    : input.command === null && input.keys.length > 0, 'Voice input is limited to approved overlay commands; screen readers require explicit native keys');
}

export function validateAtPolicy(policy) {
  demand(policy && policy.schemaVersion === 1 && typeof policy.machineId === 'string' &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,62}$/.test(policy.machineId) &&
    typeof policy.computerName === 'string' && /^[a-zA-Z0-9-]{1,63}$/.test(policy.computerName) &&
    isAbsolute(policy.poolRoot ?? '') && /^[A-Z][A-Z0-9_]{0,100}$/.test(policy.executionTokenEnvironmentVariable ?? ''),
  'AT policy requires the original pool and actual host identity');
  const pinned = value => demand(value && isAbsolute(value.path ?? '') && sha.test(value.sha256 ?? '') &&
    !/["\r\n]/.test(value.path), 'Invalid pinned native dependency');
  pinned(policy.browserExecutable);
  demand(policy.atExecutables && typeof policy.atExecutables === 'object' &&
    Object.keys(policy.atExecutables).length > 0 &&
    Object.keys(policy.atExecutables).every(at => ['nvda', 'narrator', 'voice-access'].includes(at)), 'No selected named AT executable');
  Object.values(policy.atExecutables).forEach(pinned);
  if (policy.atExecutables.nvda) demand(typeof policy.nvdaSpeechViewerTitle === 'string' &&
    policy.nvdaSpeechViewerTitle.length > 0 && policy.nvdaSpeechViewerTitle.length <= 256, 'NVDA Speech Viewer title must be explicit');
  if (policy.atExecutables.narrator || policy.atExecutables['voice-access']) {
    pinned(policy.ffmpeg); pinned(policy.audioModule);
    for (const field of ['audioInputName', 'audioOutputName']) demand(typeof policy[field] === 'string' &&
      policy[field].length > 0 && policy[field].length <= 256 && !/["\\\r\n]/.test(policy[field]),
    'Approved preconfigured audio endpoint names are required');
  }
  if (policy.atExecutables['voice-access']) {
    demand(policy.voiceCommands && Object.keys(policy.voiceCommands).sort().join(',') === 'hide-numbers,show-numbers',
      'Voice Access requires both reviewed number-overlay command recordings');
    Object.values(policy.voiceCommands).forEach(pinned);
  }
}

function runDriver(provider, requestPath, output) {
  return new Promise((resolve, reject) => {
    const child = spawn(provider.executable, ['-NoLogo', '-NoProfile', '-NonInteractive', '-File',
      join(nativeRoot, 'windows-at.ps1'), '-PolicyPath', provider.policyPath,
      '-RequestPath', requestPath, '-OutputDirectory', output], {
      shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe']
    });
    let settled = false, bytes = 0;
    const finish = error => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      if (error) reject(error); else resolve();
    };
    const timer = setTimeout(() => {
      child.stdout.destroy(); child.stderr.destroy(); child.unref();
      finish(new Error('Native AT result is unknown; preserve its original output/PIDs and reconcile, never replay keys or voice'));
    }, provider.timeoutSeconds * 1000);
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 1024 * 1024) {
        child.stdout.destroy(); child.stderr.destroy(); child.unref();
        finish(new Error('Native AT diagnostic output exceeded its budget; reconcile the original process'));
      }
    });
    child.on('error', () => finish(new Error('Native AT driver could not be started; inspect original operation before retry')));
    child.on('close', code => finish(code === 0 ? null : new Error(`Native AT driver exited ${code}; inspect preserved report`)));
  });
}

export function assessAtReport(report, input) {
  demand(report && report.at === input.at && report.nativeRunId === input.nativeRunId &&
    ['observed', 'inconclusive'].includes(report.state) && report.behaviorVerdict === 'not-evaluated' &&
    Array.isArray(report.errors) && Array.isArray(report.cleanupErrors), 'Native AT report is incomplete or substituted');
  if (report.state !== 'observed') return false;
  demand(report.preflightVerified === true && report.postcheckVerified === true &&
    report.ownedCleanupVerified === true && report.errors.length === 0 && report.cleanupErrors.length === 0,
  'Native AT observation lacks original pre/post/cleanup proof');
  if (input.at === 'nvda') demand(report.transcriptAvailable === true &&
    typeof report.transcript === 'string' && report.transcript.trim() &&
    typeof report.beforeText === 'string' && report.afterText === report.beforeText + report.transcript,
  'Actual append-only NVDA Speech Viewer output is required');
  if (input.at === 'narrator') demand(report.transcriptAvailable === false &&
    Array.isArray(report.events) && report.events.length > 0 && report.events.every(event =>
      [5, 6].includes(event.id) && event.pid === input.atProcess.pid &&
      Date.parse(event.timestamp) >= Date.parse(report.triggerAt) &&
      Date.parse(event.timestamp) <= Date.parse(report.observationEndAt)),
  'Narrator needs real PID/window-bound activity markers, not a fabricated transcript');
  if (input.at === 'voice-access') demand(Array.isArray(report.beforeUi) && Array.isArray(report.afterUi) &&
    report.afterUi.length > 0 && report.afterUi.every(element =>
      element.attribution === 'unmapped-requires-independent-page-browser-OS-map'),
  'Voice Access requires original visible UIA output and explicit unmapped-label limitations');
  return true;
}

export async function callWindowsAtProvider(provider, request) {
  validateWindowsAtProvider(provider);
  demand(request.invocation === 'capability' && request.stage === 'observe-at' &&
    ['execute', 'reconcile'].includes(request.operation), 'Native AT supports only raw observe-at, not a conformance/workflow verdict');
  validateAtInput(request.input);
  demand(process.platform === 'win32' && process.env.CODESPACES !== 'true' && !process.env.CODESPACE_NAME,
    'Native AT executes on the owned Windows evaluator only');
  const policyBytes = await readFile(provider.policyPath);
  demand(policyBytes.length <= 1024 * 1024 && hash(policyBytes) === provider.policySha256 &&
    await fileHash(provider.executable) === provider.executableSha256 &&
    await fileHash(join(nativeRoot, 'windows-at.ps1')) === provider.driverSha256,
  'AT execution dependency/policy pin changed');
  const policy = JSON.parse(policyBytes.toString('utf8').replace(/^\uFEFF/, ''));
  validateAtPolicy(policy);
  demand(policy.machineId === request.run.evaluator && policy.atExecutables[request.input.at],
    'Requested AT is not configured on the exact evaluator');
  const nativeRequest = { schemaVersion: 1, ...request.input, operationId: request.run.runId,
    owner: request.run.owner, evaluator: request.run.evaluator, subject: request.run.subject,
    scenarioHash: request.run.scenarioHash };
  const requestPath = join(request.stateDirectory, 'native-at-request.json');
  const output = join(request.stateDirectory, 'native-at');
  demand(await realpath(dirname(output)) === await realpath(request.stateDirectory), 'Invalid native AT output parent');
  if (request.operation === 'execute') {
    const file = await open(requestPath, 'wx');
    try { await file.writeFile(JSON.stringify(nativeRequest)); await file.sync(); }
    finally { await file.close(); }
    await runDriver(provider, requestPath, output);
  }
  const requestBytes = await readFile(requestPath);
  demand(JSON.stringify(JSON.parse(requestBytes)) === JSON.stringify(nativeRequest), 'Original AT request differs');
  const reportBytes = await readFile(join(output, 'report.json'));
  demand(reportBytes.length <= 16 * 1024 * 1024, 'Native AT report exceeds its budget');
  const report = JSON.parse(reportBytes.toString('utf8').replace(/^\uFEFF/, ''));
  demand(report.operationId === request.run.runId && report.policySha256 === provider.policySha256 &&
    report.driverSha256 === provider.driverSha256 && report.requestSha256 === hash(requestBytes),
  'Native AT report does not bind original runtime/policy/request bytes');
  const observed = assessAtReport(report, request.input);
  const artifacts = [];
  for (const entry of await readdir(output, { withFileTypes: true })) {
    demand(entry.isFile() && ['report.json', 'audio.wav', 'narrator.etl', 'narrator.xml'].includes(entry.name),
      'Unexpected native AT artifact; preserve it for original-operation reconciliation');
    demand((await stat(join(output, entry.name))).size <= 128 * 1024 * 1024, 'Native AT artifact exceeds 128 MiB');
    artifacts.push({ path: `native-at/${entry.name}`, sha256: await fileHash(join(output, entry.name)) });
  }
  if (observed && request.input.at !== 'nvda') demand(artifacts.some(item => item.path === 'native-at/audio.wav'),
    'Narrator/Voice Access observations require their actual recorded audio');
  return { schemaVersion: 1, requestId: request.requestId, runId: request.run.runId, owner: request.run.owner,
    state: 'finished', receipt: { ...request.run, requestId: request.requestId, stage: request.stage,
      outcome: observed ? 'pass' : 'inconclusive',
      ...(!observed ? { reason: [...report.errors, ...report.cleanupErrors].join('; ') || 'Native observation is inconclusive' } : {}),
      at: request.input.at, nativeRunId: request.input.nativeRunId, scope: 'raw-at-output',
      behaviorVerdict: 'not-evaluated', independentBehaviorVerified: false,
      fullCleanupVerified: false, borrowedAtStopped: false,
      gates: observed ? { originalExecutionOwned: true, nativePreflightVerified: true,
        nativeOutputCaptured: true, nativePostcheckVerified: true, ownedCaptureCleanupVerified: true } : {},
      artifacts
    } };
}
