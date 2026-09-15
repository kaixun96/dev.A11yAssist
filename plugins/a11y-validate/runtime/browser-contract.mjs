import { discoveryHash, requireDiscovery as demand } from './discovery-contract.mjs';

const keys = new Set(['Tab', 'Shift+Tab', 'Enter', 'Space', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);
const attributes = new Set(['aria-invalid', 'aria-describedby', 'aria-expanded', 'aria-selected', 'aria-checked', 'aria-modal', 'tabindex', 'id']);
function exact(value, fields) {
  demand(value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).sort().join(',') === [...fields].sort().join(','), 'Unexpected browser record fields');
}
function locator(value) {
  if (value && Object.hasOwn(value, 'css')) {
    exact(value, ['css']); demand(typeof value.css === 'string' && /^#[A-Za-z][A-Za-z0-9_-]{0,100}$/.test(value.css), 'Browser CSS must be one exact element ID');
  } else {
    exact(value, ['role', 'name']);
    demand(['button', 'textbox', 'dialog', 'heading', 'link', 'checkbox', 'radio', 'combobox', 'option'].includes(value.role) &&
      typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 256, 'Invalid role/name locator');
  }
}
export function validateBrowserParameters(value) {
  const inspection = value && Object.hasOwn(value, 'inspection');
  const expectedUrl = value && Object.hasOwn(value, 'expectedUrl');
  exact(value, ['steps', 'assertions', ...(inspection ? ['inspection'] : []), ...(expectedUrl ? ['expectedUrl'] : [])]);
  if (inspection) demand(value.inspection === true, 'Document inspection must be explicitly true');
  if (expectedUrl) {
    demand(typeof value.expectedUrl === 'string' && value.expectedUrl.length <= 2048, 'Invalid expected URL');
    const url = new URL(value.expectedUrl);
    demand(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash,
      'Expected URL must be credential-free HTTPS without query or fragment');
  }
  demand(Array.isArray(value.steps) && value.steps.length <= 30 &&
    Array.isArray(value.assertions) && value.assertions.length >= (inspection ? 0 : 1) &&
    value.assertions.length <= 20, 'Invalid browser scenario budget');
  let spacingSeen = false;
  for (const step of value.steps) {
    if (step.action === 'press') {
      exact(step, ['action', 'key']); demand(keys.has(step.key), 'Unsupported browser key');
    } else if (step.action === 'click') {
      exact(step, ['action', 'target']); locator(step.target);
    } else if (step.action === 'fill') {
      exact(step, ['action', 'target', 'value']); locator(step.target);
      demand(typeof step.value === 'string' && step.value.length <= 256, 'Invalid bounded browser fill');
    } else if (step.action === 'observe') {
      exact(step, ['action', 'milliseconds']);
      demand(Number.isInteger(step.milliseconds) && step.milliseconds >= 1 &&
        step.milliseconds <= 30000, 'Observation dwell must be 1-30000 milliseconds');
    } else if (step.action === 'text-spacing') {
      exact(step, ['action']);
      demand(!spacingSeen, 'Text-spacing preset may be applied only once per row');
      spacingSeen = true;
    } else throw new Error('Unsupported browser action; arbitrary scripts are forbidden');
  }
  for (const assertion of value.assertions) {
    exact(assertion, ['kind', 'target', 'expected', ...(assertion.kind === 'attribute' ? ['attribute']
      : assertion.kind === 'target-size' ? ['minimum'] : [])]);
    locator(assertion.target);
    const expected = assertion.expected;
    if (assertion.kind === 'target-size') {
      exact(assertion.minimum, ['width', 'height']);
      demand(Object.values(assertion.minimum).every(value => typeof value === 'number' && Number.isFinite(value) &&
        value >= 1 && value <= 1920), 'Invalid minimum CSS-pixel size');
    }
    if (['focused', 'visible', 'target-size'].includes(assertion.kind)) demand(typeof expected === 'boolean', 'Expected boolean browser assertion');
    else if (assertion.kind === 'count') demand(Number.isInteger(expected) && expected >= 0 && expected <= 100, 'Invalid expected count');
    else if (assertion.kind === 'axe-violations') demand(Number.isInteger(expected) && expected >= 0 && expected <= 10000, 'Invalid scanner violation count');
    else if (assertion.kind === 'text') demand(typeof expected === 'string' && expected.length <= 4096, 'Invalid expected text');
    else if (assertion.kind === 'attribute') demand(attributes.has(assertion.attribute) &&
      (expected === null || typeof expected === 'string' && expected.length <= 4096), 'Invalid attribute assertion');
    else throw new Error('Unsupported browser assertion');
  }
}
function expectedTarget(parameters, initialTarget) {
  if (!Object.hasOwn(parameters, 'expectedUrl')) return initialTarget;
  demand(typeof initialTarget === 'string' && initialTarget.includes('?') &&
    parameters.expectedUrl === initialTarget.split('?')[0],
  'Expected URL may only declare consumption of the initial query on the same exact path');
  return parameters.expectedUrl;
}
export function browserRequest(input, budgetSeconds = 180, viewport = { width: 1280, height: 720 }) {
  demand(input.rows.length <= 30 && input.rows.every(row => row.track === 'page' && row.capability === 'browser'), 'Browser batches contain at most thirty page rows');
  input.rows.forEach(row => {
    validateBrowserParameters(row.parameters);
    expectedTarget(row.parameters, input.target);
  });
  return { schemaVersion: 1, taskId: input.taskId, target: input.target, budgetSeconds, viewport,
    rows: input.rows.map(row => ({ id: row.id, ...row.parameters })) };
}

export function verifyBrowserObservations(report, expectedRequest) {
  demand(discoveryHash(report.request) === discoveryHash(expectedRequest) &&
    Array.isArray(report.rows) && report.rows.length === expectedRequest.rows.length &&
    new Set(report.rows.map(row => row.id)).size === expectedRequest.rows.length,
  'Browser request or row accounting differs');
  for (const row of report.rows) {
    const expected = expectedRequest.rows.find(item => item.id === row.id);
    demand(expected && ['finding', 'observed-no-issue', 'blocked', 'not-run', 'inconclusive'].includes(row.status) &&
      typeof row.attempted === 'boolean', 'Browser coverage identity/attempt accounting differs');
    const expectedUrl = expectedTarget(expected, expectedRequest.target);
    const spacingRequested = expected.steps.some(step => step.action === 'text-spacing');
    if (Object.hasOwn(row, 'textSpacing')) {
      const value = row.textSpacing;
      demand(value && typeof value === 'object' && !Array.isArray(value), 'Invalid text-spacing record');
      exact(value, ['preset', 'scope', 'values', 'stylesheetSha256', 'state', 'cleanupState',
        ...['beforeCaptureVerified', 'afterCaptureVerified'].filter(key => Object.hasOwn(value, key))]);
      exact(value.values, ['lineHeight', 'paragraphSpacingEm', 'letterSpacingEm', 'wordSpacingEm']);
      demand(spacingRequested && row.attempted && value.preset === 'wcag22-1.4.12' &&
        value.scope === 'main-frame-light-dom' && value.values.lineHeight === 1.5 &&
        value.values.paragraphSpacingEm === 2 && value.values.letterSpacingEm === 0.12 &&
        value.values.wordSpacingEm === 0.16 && typeof value.stylesheetSha256 === 'string' &&
        /^[a-f0-9]{64}$/.test(value.stylesheetSha256) &&
        ['installing', 'installed'].includes(value.state) &&
        ['pending', 'removed', 'discarded-with-owned-context'].includes(value.cleanupState) &&
        ['beforeCaptureVerified', 'afterCaptureVerified'].every(key =>
          !Object.hasOwn(value, key) || typeof value[key] === 'boolean'),
      'Invalid fixed text-spacing observation');
    }
    if (Object.hasOwn(row, 'documentInspection')) demand(expected.inspection === true, 'Document inspection was not requested');
    if (expected.inspection && row.documentInspection) {
      const value = row.documentInspection;
      if (Object.hasOwn(value, 'media')) {
        exact(value.media, ['forcedColorsActive', 'prefersContrastMore', 'prefersReducedMotion', 'prefersDarkScheme']);
        demand(Object.values(value.media).every(item => typeof item === 'boolean'), 'Invalid browser media observations');
      }
      demand(row.attempted && discoveryHash(row.inspectionSteps) === discoveryHash(expected.steps) &&
        value.schemaVersion === 1 && value.scope === 'raw-document-inspection' &&
        value.url === expectedUrl &&
        discoveryHash(value.viewport) === discoveryHash(expectedRequest.viewport) &&
        value.traversal === 'light-dom-only' && value.textAndInputValuesOmitted === true &&
        value.frameContentsIncluded === false && Number.isInteger(value.frameElements) && value.frameElements >= 0 &&
        Number.isInteger(value.totalElements) && value.totalElements >= 1 &&
        Array.isArray(value.nodes) && value.nodes.length === Math.min(value.totalElements, 1000) &&
        value.truncated === (value.totalElements > 1000), 'Invalid bounded document inspection');
      for (const node of value.nodes) {
        if (!Object.hasOwn(node, 'inlineTextSpacing') || node.inlineTextSpacing === null) continue;
        const properties = ['line-height', 'letter-spacing', 'word-spacing'];
        exact(node.inlineTextSpacing, properties);
        demand(node.styles && typeof node.styles === 'object' && !Array.isArray(node.styles),
          'Missing computed text-spacing styles');
        for (const name of properties) {
          const declaration = node.inlineTextSpacing[name];
          exact(declaration, ['hasValue', 'important']);
          demand(typeof declaration.hasValue === 'boolean' && typeof declaration.important === 'boolean' &&
            (!declaration.important || declaration.hasValue) &&
            typeof node.styles[name] === 'string' && node.styles[name].length <= 128,
          'Invalid inline or computed text-spacing observation');
        }
      }
    }
    if (expected.inspection && expected.assertions.length === 0) {
      demand(['blocked', 'not-run', 'inconclusive'].includes(row.status),
        'Raw document inspection cannot supply an accessibility verdict');
    }
    if (['finding', 'observed-no-issue'].includes(row.status)) {
      if (spacingRequested) demand(row.textSpacing?.state === 'installed' &&
        row.textSpacing.beforeCaptureVerified === true && row.textSpacing.afterCaptureVerified === true &&
        row.textSpacing.cleanupState === 'removed',
      'Text-spacing evidence requires the owned stylesheet during capture and verified removal');
      if (expected.inspection) demand(row.documentInspection, 'Requested document inspection is missing');
      demand(row.attempted && row.observations?.length === expected.assertions.length &&
        discoveryHash(row.steps) === discoveryHash(expected.steps), 'Browser steps or observations differ');
      const results = row.observations.map((value, index) => {
        demand(discoveryHash(value.assertion) === discoveryHash(expected.assertions[index]) &&
          value.met === (discoveryHash(value.actual) === discoveryHash(value.assertion.expected)),
        'Browser verdict is not supported by the requested assertion and actual value');
        if (value.assertion.kind === 'target-size') {
          demand(['width', 'height', 'x', 'y', 'deviceScale'].every(key =>
            typeof value.measurement?.[key] === 'number' && Number.isFinite(value.measurement[key])) &&
            value.measurement.width >= 0 && value.measurement.height >= 0 && value.measurement.deviceScale > 0 &&
            value.actual === ['width', 'height'].every(key => value.measurement[key] >= value.assertion.minimum[key]),
          'Target size verdict differs from measured CSS-pixel dimensions');
        }
        if (value.assertion.kind === 'axe-violations') demand(typeof value.scanner?.version === 'string' &&
          Array.isArray(value.scanner.violations) && Array.isArray(value.scanner.incomplete) &&
          value.scanner.incomplete.length === 0 && value.actual === value.scanner.violations.length,
        'Scanner verdict requires actual versioned results without incomplete checks');
        return value.met;
      });
      demand(row.capturePreflight?.verified === true && row.capturePostcheck?.verified === true &&
        [row.capturePreflight, row.capturePostcheck].every(health => health.url === expectedUrl &&
          health.visible === true && health.documentFocused === true && health.singlePage === true &&
          health.noUnexpectedPageState === true && discoveryHash(health.viewport) === discoveryHash(expectedRequest.viewport)),
      'Fresh per-row capture preflight/postcheck is required');
      demand(row.status === (results.every(Boolean) ? 'observed-no-issue' : 'finding'), 'Browser row verdict differs');
    } else demand(typeof row.reason === 'string' && row.reason.trim() && (row.status !== 'not-run' || !row.attempted),
      'Browser gap requires a precise non-execution/uncertainty reason');
  }
}
