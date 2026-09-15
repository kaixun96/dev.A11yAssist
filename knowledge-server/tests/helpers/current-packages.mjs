import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Read authoring descriptors, not generated manifests, so stale publications
// cannot make stale runtime expectations pass alongside them.
export const currentPackages = await Promise.all(['common', 'fluent', 'sharepoint'].map(async id =>
  JSON.parse(await readFile(new URL(`../../../accessibility-kb/packages/${id}/package.json`, import.meta.url), 'utf8'))));

export function expectedEntries(selected = currentPackages.map(pkg => pkg.id)) {
  return currentPackages.filter(pkg => selected.includes(pkg.id)).flatMap(pkg => pkg.entries);
}

export function assertCurrentEntries(entries, selected) {
  assert.deepEqual(entries.map(entry => entry.id).sort(), expectedEntries(selected).map(entry => entry.id).sort());
}