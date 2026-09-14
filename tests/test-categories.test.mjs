import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm, writeFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { categories, statuses, loadProcedures, createMatrix, checkMatrix } from '../src/test-categories/tools/matrix.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const base = join(root, 'plugins/a11y-test-categories');
const text = async path => (await readFile(path, 'utf8')).replaceAll('\r\n', '\n');
const procedures = await loadProcedures();
const inventory = {
  schemaVersion: 1, scope: 'Two distinct picker controls in the safe fixture',
  inventoryComplete: true, inventoryEvidence: 'private-inventory-01',
  targets: [
    { id: 'open', target: 'Open button', scenario: 'Open picker', state: 'Closed' },
    { id: 'cancel', target: 'Cancel button', scenario: 'Dismiss picker', state: 'Open' }
  ]
};
const completeMatrix = () => {
  const matrix = createMatrix(inventory, procedures);
  for (const row of matrix.rows) {
    row.status = 'observed-no-issue';
    row.evidence = [`private-${row.targetId}-${row.category}-${row.step}`];
  }
  return matrix;
};

test('every target gets all ten categories and every numbered step, without inferred execution', () => {
  assert.equal(categories.length, 10);
  assert.deepEqual(procedures.map(procedure => procedure.steps.length), [10, 5, 6, 4, 6, 5, 5, 6, 6, 8]);
  const matrix = createMatrix(inventory, procedures);
  assert.equal(matrix.rows.length, 122);
  for (const target of inventory.targets) {
    assert.equal(matrix.rows.filter(row => row.targetId === target.id).length, 61);
  }
  assert(matrix.rows.every(row => row.status === 'planned' && row.evidence.length === 0));
  assert.equal(checkMatrix(inventory, matrix, procedures).accountingComplete, false);
});

test('full accounting is not an evidence verdict and status totals include all gaps', () => {
  const matrix = completeMatrix();
  const full = checkMatrix(inventory, matrix, procedures);
  assert.equal(full.accountingComplete, true);
  assert.equal(full.evidenceValidated, false);
  assert.equal(full.executed, 122);
  for (const status of ['planned', 'blocked', 'not-run', 'inconclusive']) {
    const partial = completeMatrix();
    partial.rows[0].status = status;
    partial.rows[0].reason = 'Specific unavailable capability or unfinished action';
    assert.equal(checkMatrix(inventory, partial, procedures).accountingComplete, false);
  }
  matrix.rows[0].status = 'not-applicable';
  matrix.rows[0].reason = 'Target-specific feature evidence justifies this step';
  const result = checkMatrix(inventory, matrix, procedures);
  assert.equal(result.applicable, 121);
  assert.equal(result.counts['not-applicable'], 1);
  assert.equal(result.byCategory['keyboard-focus']['not-applicable'], 1);
  const unknown = { ...inventory, inventoryComplete: false };
  const uncertain = createMatrix(unknown, procedures);
  uncertain.rows = completeMatrix().rows;
  assert.equal(checkMatrix(unknown, uncertain, procedures).accountingComplete, false);
});

test('rejects omitted, duplicate, foreign, modified and unsupported step results', () => {
  const mutations = [
    matrix => matrix.rows.pop(),
    matrix => { matrix.rows[1] = structuredClone(matrix.rows[0]); },
    matrix => { matrix.rows[0].targetId = 'unlisted'; },
    matrix => { matrix.rows[0].category = 'unknown'; },
    matrix => { matrix.rows[0].step = 99; },
    matrix => { matrix.rows[0].instruction = 'Skip it'; },
    matrix => { matrix.rows[0].status = 'PASS'; },
    matrix => { matrix.rows[0].evidence = []; },
    matrix => { matrix.rows[0].evidence = [' ']; },
    matrix => { matrix.rows[0].status = 'not-applicable'; },
    matrix => { matrix.rows[0].status = 'blocked'; },
    matrix => { matrix.procedureHash = 'stale'; },
    matrix => { matrix.inventoryHash = 'stale'; }
  ];
  for (const mutate of mutations) {
    const matrix = completeMatrix();
    mutate(matrix);
    assert.throws(() => checkMatrix(inventory, matrix, procedures));
  }
  assert.throws(() => checkMatrix({ ...inventory, targets: inventory.targets.slice(1) },
    completeMatrix(), procedures), /Inventory changed/);
  assert.throws(() => createMatrix({ ...inventory, targets: [] }, procedures));
  assert.throws(() => createMatrix({ ...inventory, targets: [inventory.targets[0], inventory.targets[0]] }, procedures));
});

test('standalone and bundled modules share exact source and keep separate public entrypoints', async () => {
  async function files(directory, prefix = '') {
    const found = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = prefix + entry.name;
      if (entry.isDirectory()) found.push(...await files(join(directory, entry.name), path + '/'));
      else found.push(path);
    }
    return found.sort();
  }
  const bundle = join(root, 'plugins/a11y-bug-bash/modules/a11y-test-categories');
  const paths = (await files(base)).filter(path =>
    !['plugin.json', '.mcp.json', 'AGENTS.md', 'LICENSE', 'README.md', 'README.zh-CN.md'].includes(path));
  assert.deepEqual(await files(bundle), paths);
  for (const path of paths) assert.equal(await text(join(base, path)), await text(join(bundle, path)));
  for (const category of categories) {
    assert.equal(await text(join(base, 'procedures', `${category}.md`)),
      await text(join(root, 'src/test-categories/procedures', `${category}.md`)));
  }
  const manifest = JSON.parse(await text(join(base, 'plugin.json')));
  assert.equal(manifest.name, 'a11y-test-categories');
  const config = JSON.parse(await text(join(root, 'src/standards/liquid.mcp.json')));
  assert.deepEqual(manifest.mcpServers, config.mcpServers);
  assert.deepEqual(JSON.parse(await text(join(base, '.mcp.json'))), config);
  assert.deepEqual(await readdir(join(base, 'skills')), ['a11y-test-categories']);
  const coverage = JSON.parse(await text(join(root, 'src/bug-bash/coverage.json')));
  assert.deepEqual(statuses, coverage.rowStatuses);
  const parent = await text(join(root, 'src/skills/a11y-bug-bash/SKILL.md'));
  assert.match(parent, /all ten categories and every numbered step/);
  assert.match(parent, /matrix check against the/);
  assert.match(parent, /exit 2/);
  for (const path of ['docs/TEST-CATEGORIES.md', 'docs/TEST-CATEGORIES.zh-CN.md', 'procedures/README.md']) {
    for (const match of (await text(join(base, path))).matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      if (!match[1].startsWith('https:')) await access(join(base, dirname(path), match[1]));
    }
  }
});

test('installed CLI is self-contained, never overwrites a matrix, and rejects incomplete delivery', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'a11y-categories-'));
  try {
    const install = join(directory, 'plugin');
    await cp(base, install, { recursive: true });
    const input = join(directory, 'inventory.json');
    const output = join(directory, 'matrix.json');
    await writeFile(input, JSON.stringify(inventory));
    const run = command => spawnSync(process.execPath,
      [join(install, 'tools/matrix.mjs'), command, input, output], { encoding: 'utf8', cwd: directory });
    assert.equal(run('create').status, 0);
    const original = await readFile(output, 'utf8');
    assert.equal(run('create').status, 1);
    assert.equal(await readFile(output, 'utf8'), original);
    assert.equal(run('check').status, 2);
    await writeFile(output, JSON.stringify(completeMatrix()));
    const checked = run('check');
    assert.equal(checked.status, 0, checked.stderr);
    assert.equal(JSON.parse(checked.stdout).accountingComplete, true);
    const invalid = completeMatrix();
    invalid.rows.pop();
    await writeFile(output, JSON.stringify(invalid));
    assert.equal(run('check').status, 1);
  } finally {
    await rm(directory, { recursive: true });
  }
});
