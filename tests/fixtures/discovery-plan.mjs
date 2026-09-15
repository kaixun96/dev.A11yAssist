export function row(id = 'dialog-entry', track = 'page', parameters = {}) {
  return { id, journey: 'Edit contact', state: 'dialog open', dimension: 'focus', track,
    capability: track === 'source' ? 'source-review' : track === 'at' ? 'nvda' : 'browser',
    preconditions: ['Disposable test fixture is reset'], actions: ['Open the contact dialog'],
    expected: 'Focus reaches the Name field', reset: 'Reload the disposable fixture', parameters };
}
export function plan(taskId = 'fixture-test', rows = [row()]) {
  return { schemaVersion: 1, taskId, feature: 'Disposable contact editor', mode: 'both', parallelSource: false,
    authorizationReference: 'Unit-test-only authority; never a live evaluator',
    profile: 'fixture-browser', target: 'fixture:dialog-form-v1', evaluator: 'unit-evaluator',
    sourceRoots: [], sourceRevision: null, budgetSeconds: 600, maxRows: 30, rows };
}
export function capabilityInput(action) {
  if (action === 'discovery-observe') return {
    schemaVersion: 1, taskId: 'fixture-test', planHash: 'a'.repeat(64), profile: 'fixture-browser',
    authorizationReference: 'Unit test only', target: 'fixture:dialog-form-v1',
    deadlineAt: new Date(Date.now() + 600000).toISOString(), rows: [row()]
  };
  return { taskId: 'fixture-test', operationIds: [], reason: 'Unit lifecycle',
    ...(action === 'discovery-deliver' ? { report: { path: process.execPath, sha256: 'a'.repeat(64) } } : {}) };
}
