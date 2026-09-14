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
  exact(value, ['steps', 'assertions']);
  demand(Array.isArray(value.steps) && value.steps.length <= 30 &&
    Array.isArray(value.assertions) && value.assertions.length >= 1 && value.assertions.length <= 20, 'Invalid browser scenario budget');
  for (const step of value.steps) {
    if (step.action === 'press') {
      exact(step, ['action', 'key']); demand(keys.has(step.key), 'Unsupported browser key');
    } else if (step.action === 'click') {
      exact(step, ['action', 'target']); locator(step.target);
    } else if (step.action === 'fill') {
      exact(step, ['action', 'target', 'value']); locator(step.target);
      demand(typeof step.value === 'string' && step.value.length <= 256, 'Invalid bounded browser fill');
    } else throw new Error('Unsupported browser action; arbitrary scripts are forbidden');
  }
  for (const assertion of value.assertions) {
    exact(assertion, ['kind', 'target', 'expected', ...(assertion.kind === 'attribute' ? ['attribute'] : [])]);
    locator(assertion.target);
    const expected = assertion.expected;
    if (['focused', 'visible'].includes(assertion.kind)) demand(typeof expected === 'boolean', 'Expected boolean browser assertion');
    else if (assertion.kind === 'count') demand(Number.isInteger(expected) && expected >= 0 && expected <= 100, 'Invalid expected count');
    else if (assertion.kind === 'text') demand(typeof expected === 'string' && expected.length <= 4096, 'Invalid expected text');
    else if (assertion.kind === 'attribute') demand(attributes.has(assertion.attribute) &&
      (expected === null || typeof expected === 'string' && expected.length <= 4096), 'Invalid attribute assertion');
    else throw new Error('Unsupported browser assertion');
  }
}
export function browserRequest(input, budgetSeconds = 180, viewport = { width: 1280, height: 720 }) {
  demand(input.rows.length <= 30 && input.rows.every(row => row.track === 'page' && row.capability === 'browser'), 'Browser batches contain at most thirty page rows');
  input.rows.forEach(row => validateBrowserParameters(row.parameters));
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
    if (['finding', 'observed-no-issue'].includes(row.status)) {
      demand(row.attempted && row.observations?.length === expected.assertions.length &&
        discoveryHash(row.steps) === discoveryHash(expected.steps), 'Browser steps or observations differ');
      const results = row.observations.map((value, index) => {
        demand(discoveryHash(value.assertion) === discoveryHash(expected.assertions[index]) &&
          value.met === (discoveryHash(value.actual) === discoveryHash(value.assertion.expected)),
        'Browser verdict is not supported by the requested assertion and actual value');
        return value.met;
      });
      demand(row.capturePreflight?.verified === true && row.capturePostcheck?.verified === true &&
        [row.capturePreflight, row.capturePostcheck].every(health => health.url === expectedRequest.target &&
          health.visible === true && health.documentFocused === true && health.singlePage === true &&
          health.noUnexpectedPageState === true && discoveryHash(health.viewport) === discoveryHash(expectedRequest.viewport)),
      'Fresh per-row capture preflight/postcheck is required');
      demand(row.status === (results.every(Boolean) ? 'observed-no-issue' : 'finding'), 'Browser row verdict differs');
    } else demand(typeof row.reason === 'string' && row.reason.trim() && (row.status !== 'not-run' || !row.attempted),
      'Browser gap requires a precise non-execution/uncertainty reason');
  }
}
