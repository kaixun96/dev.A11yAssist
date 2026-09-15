import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { loadKnowledgeBase } from '../../tools/knowledge-base.mjs';
import { createKnowledgeReference } from '../../tools/knowledge-reference.mjs';

// A portable Common-only consumer, deliberately not the shipped server or an alias.
export async function createCommonReferenceFixture(directory, rootKB) {
  const consumer = join(directory, 'synthetic-common-consumer');
  const reference = createKnowledgeReference(await loadKnowledgeBase(rootKB), ['common']);
  await mkdir(join(consumer, 'references'), { recursive: true });
  await writeFile(join(consumer, 'package.json'), JSON.stringify({ name: 'synthetic-common-consumer', version: '1.0.0', type: 'module' }) + '\n');
  await writeFile(join(consumer, 'references/knowledge.json'), JSON.stringify(reference, null, 2) + '\n');
  return { consumer, reference };
}