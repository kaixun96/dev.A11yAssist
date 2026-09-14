import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export const apiVersion = 1;
export const categories = [
  'keyboard-focus', 'screen-reader', 'structure-semantics',
  'orientation-input-purpose', 'visual-color', 'timing-motion',
  'dynamic-content', 'touch-pointer', 'authentication-forms', 'voice-access'
];
export const statuses = [
  'planned', 'observed-no-issue', 'finding', 'blocked',
  'not-run', 'not-applicable', 'inconclusive'
];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const key = row => JSON.stringify([row.targetId, row.category, row.step]);

export async function loadProcedures(directory = new URL('../procedures/', import.meta.url)) {
  const procedures = [];
  for (const id of categories) {
    const body = (await readFile(new URL(`${id}.md`, directory), 'utf8')).replaceAll('\r\n', '\n');
    const steps = [...body.matchAll(/^(\d+)\. (.+(?:\n(?!\d+\. |\s*$).+)*)/gm)]
      .map(match => ({ number: Number(match[1]), text: match[2].replace(/\s+/g, ' ').trim() }));
    assert(steps.length > 0 && steps.every((step, index) => step.number === index + 1),
      `Invalid numbered procedure: ${id}`);
    procedures.push({ id, sha256: hash(body), steps });
  }
  return procedures;
}

function validateInventory(inventory) {
  assert(inventory?.schemaVersion === 1, 'Inventory schemaVersion must be 1');
  assert(nonempty(inventory.scope), 'Inventory scope is required');
  assert(Array.isArray(inventory.targets) && inventory.targets.length > 0, 'Inventory needs targets');
  const ids = new Set();
  for (const target of inventory.targets) {
    assert(target && ['id', 'target', 'scenario', 'state'].every(field => nonempty(target[field])),
      'Each target needs id, target, scenario and state');
    assert(!ids.has(target.id), `Duplicate target ID: ${target.id}`);
    ids.add(target.id);
  }
  assert(typeof inventory.inventoryComplete === 'boolean', 'inventoryComplete must be explicit');
  assert(nonempty(inventory.inventoryEvidence), 'Inventory evidence or uncertainty is required');
}

export function createMatrix(inventory, procedures) {
  validateInventory(inventory);
  return {
    schemaVersion: 1,
    inventoryHash: hash(inventory),
    procedureHash: hash(procedures),
    rows: inventory.targets.flatMap(target => procedures.flatMap(category =>
      category.steps.map(step => ({
        targetId: target.id, category: category.id, step: step.number,
        instruction: step.text, status: 'planned', evidence: [], reason: ''
      }))))
  };
}

export function checkMatrix(inventory, matrix, procedures) {
  const expected = createMatrix(inventory, procedures);
  assert(matrix?.schemaVersion === 1, 'Matrix schemaVersion must be 1');
  assert.equal(matrix.inventoryHash, expected.inventoryHash, 'Inventory changed; reconcile the matrix');
  assert.equal(matrix.procedureHash, expected.procedureHash, 'Procedure version changed; reconcile the matrix');
  assert(Array.isArray(matrix.rows), 'Matrix rows must be an array');
  assert.equal(matrix.rows.length, expected.rows.length, 'Missing or extra step rows');
  const remaining = new Map(expected.rows.map(row => [key(row), row]));
  const counts = Object.fromEntries(statuses.map(status => [status, 0]));
  const byCategory = Object.fromEntries(categories.map(id => [id,
    Object.fromEntries(statuses.map(status => [status, 0]))]));
  for (const row of matrix.rows) {
    assert(row && typeof row === 'object', 'Invalid step row');
    const identity = key(row);
    const original = remaining.get(identity);
    assert(original, `Duplicate or foreign step row: ${identity}`);
    assert.equal(row.instruction, original.instruction, `Changed instruction: ${identity}`);
    remaining.delete(identity);
    assert(statuses.includes(row.status), `Invalid status: ${identity}`);
    assert(Array.isArray(row.evidence) && row.evidence.every(nonempty), `Invalid evidence: ${identity}`);
    assert(typeof row.reason === 'string', `Invalid reason: ${identity}`);
    if (['observed-no-issue', 'finding'].includes(row.status)) {
      assert(row.evidence.length > 0, `Conclusive step needs evidence: ${identity}`);
    } else if (row.status !== 'planned') {
      assert(nonempty(row.reason), `Nonexecuted/inconclusive step needs a reason: ${identity}`);
    }
    counts[row.status]++;
    byCategory[row.category][row.status]++;
  }
  const pending = counts.planned + counts.blocked + counts['not-run'] + counts.inconclusive;
  const executed = counts['observed-no-issue'] + counts.finding;
  return {
    accountingComplete: inventory.inventoryComplete && pending === 0,
    evidenceValidated: false,
    targets: inventory.targets.length, categories: categories.length,
    total: matrix.rows.length, applicable: matrix.rows.length - counts['not-applicable'],
    executed, pending, counts, byCategory
  };
}

async function main(args) {
  const [command, inventoryPath, matrixPath, ...extra] = args;
  assert(['create', 'check'].includes(command) && inventoryPath && matrixPath && !extra.length,
    'Usage: node matrix.mjs create|check <inventory.json> <matrix.json>');
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  const procedures = await loadProcedures(new URL('../procedures/', import.meta.url));
  if (command === 'create') {
    await writeFile(matrixPath, JSON.stringify(createMatrix(inventory, procedures), null, 2) + '\n',
      { flag: 'wx' });
    console.log(JSON.stringify({ created: resolve(matrixPath) }));
  } else {
    const summary = checkMatrix(inventory, JSON.parse(await readFile(matrixPath, 'utf8')), procedures);
    console.log(JSON.stringify(summary, null, 2));
    if (!summary.accountingComplete) process.exitCode = 2;
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  await main(process.argv.slice(2));
}
