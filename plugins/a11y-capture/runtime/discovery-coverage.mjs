import { discoveryHash, requireDiscovery as demand } from './discovery-contract.mjs';

const key = value => JSON.stringify([value.targetId, value.category, value.step]);

export function orderedCoverageRows(rows, categories) {
  const procedures = categories?.procedures ?? [];
  return [...rows].sort((a, b) => {
    if (!a.coverage || !b.coverage) return Number(Boolean(a.coverage)) - Number(Boolean(b.coverage));
    return a.coverage.targetId.localeCompare(b.coverage.targetId) ||
      procedures.findIndex(item => item.id === a.coverage.category) -
      procedures.findIndex(item => item.id === b.coverage.category) || a.coverage.step - b.coverage.step;
  });
}
export function earlierCategoryRows(plan, row) {
  return row.coverage ? plan.rows.filter(other => other.coverage &&
    other.coverage.targetId === row.coverage.targetId && other.coverage.category === row.coverage.category &&
    other.coverage.step < row.coverage.step) : [];
}

export function expandCoverage(plan, categories) {
  if (!plan.inventory || plan.mode === 'source-only') return structuredClone(plan);
  demand(categories, 'The a11y-test-categories plugin is required for category expansion');
  const matrix = categories.createMatrix(plan.inventory, categories.procedures);
  const expected = new Map(matrix.rows.map(row => [key(row), row]));
  const assigned = new Set();
  for (const row of plan.rows) {
    if (!row.coverage) continue;
    const identity = key(row.coverage), step = expected.get(identity);
    demand(step && !assigned.has(identity), 'Duplicate or unknown category step binding');
    demand(row.track !== 'source', 'Source analysis cannot complete a page category step');
    if (step.category === 'screen-reader') demand(row.track === 'at' &&
      ['nvda', 'narrator'].includes(row.capability), 'Screen-reader steps require named real AT');
    if (step.category === 'voice-access') demand(row.track === 'at' &&
      row.capability === 'voice-access', 'Voice Access steps require actual Voice Access');
    demand(row.coverage.procedureHash === matrix.procedureHash, 'Category procedure version changed');
    assigned.add(identity);
  }
  const generated = matrix.rows.filter(row => !assigned.has(key(row))).map(step => {
    const target = plan.inventory.targets.find(target => target.id === step.targetId);
    const at = step.category === 'screen-reader' ? 'nvda' : step.category === 'voice-access' ? 'voice-access' : null;
    return {
      id: `category-${discoveryHash(step).slice(0, 32)}`,
      journey: target.scenario, state: target.state, dimension: step.category,
      track: at ? 'at' : 'page', capability: at ?? 'browser',
      preconditions: [`Establish ${target.target} in ${target.state}`],
      actions: [step.instruction], expected: step.instruction,
      reset: `Restore the authorized baseline for ${target.scenario}`,
      coverage: { targetId: step.targetId, category: step.category, step: step.step,
        procedureHash: matrix.procedureHash }
    };
  });
  demand(plan.rows.length + generated.length <= plan.maxRows,
    'All-target category expansion exceeds maxRows; increase the explicit bound, never sample away rows');
  return { ...structuredClone(plan), rows: [...plan.rows, ...generated] };
}

export function categoryCoverage(plan, rows, categories) {
  if (!plan.inventory || plan.mode === 'source-only') return null;
  const expanded = expandCoverage(plan, categories);
  demand(expanded.rows.length === plan.rows.length, 'Accepted plan lost required category steps');
  const matrix = categories.createMatrix(plan.inventory, categories.procedures);
  const assignments = new Map(rows.filter(row => row.coverage).map(row => [key(row.coverage), row]));
  for (const step of matrix.rows) {
    const row = assignments.get(key(step));
    demand(row, 'Missing category execution row');
    step.status = row.status;
    step.reason = row.reason ?? '';
    step.evidence = (row.observation?.evidence ?? []).map(path =>
      `${row.attempts.at(-1).operationId}:${path}`);
  }
  return { ...categories.checkMatrix(plan.inventory, matrix, categories.procedures), matrix };
}

export function issueSummary(rows) {
  const groups = new Map();
  for (const row of rows.filter(row => row.observation?.status === 'finding')) {
    const issue = row.observation.issue;
    // Only an explicit provider-supported identity merges observations into one defect.
    const scope = row.evidenceScope === 'disposable-fixture-qualification' ? 'synthetic-fixture' : 'observed-page';
    const id = `${scope}:${issue.identity ?? row.id}`;
    if (!groups.has(id)) groups.set(id, { id, title: issue.title, impact: issue.impact,
      scope, categories: new Set(), rows: [] });
    const group = groups.get(id);
    demand(group.title === issue.title && group.impact === issue.impact,
      'Conflicting finding descriptions for one defect identity');
    group.categories.add(row.coverage?.category ?? row.dimension);
    group.rows.push(row.id);
  }
  return [...groups.values()].map(group => ({ ...group, categories: [...group.categories] }));
}
