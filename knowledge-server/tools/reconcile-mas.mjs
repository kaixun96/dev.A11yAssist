import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { masFields, validateMasStandards } from '../src/runtime/mas.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value, null, 2) + '\n';
const text = value => {
  if (value === null || typeof value === 'string') return value;
  if (value && !Array.isArray(value) && Object.keys(value).length === 0) return '';
  assert(value && typeof value.EnhancedMarkdown === 'string', 'Unsupported Liquid rich text');
  return value.EnhancedMarkdown;
};
const equivalent = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// The pinned agency file contains trailing commas. Remove only JSON-external
// commas before a closing bracket/brace; never rewrite quoted standard text.
export function parseMasSource(body) {
  let quoted = false;
  let escaped = false;
  let normalized = '';
  for (let index = 0; index < body.length; index++) {
    const char = body[index];
    if (!quoted && char === ',') {
      let next = index + 1;
      while (/\s/.test(body[next] ?? '') && next < body.length) next++;
      if (body[next] === ']' || body[next] === '}') continue;
    }
    normalized += char;
    if (quoted && escaped) escaped = false;
    else if (quoted && char === '\\') escaped = true;
    else if (char === '"') quoted = !quoted;
  }
  return JSON.parse(normalized);
}

export function reconcileMas(source, response, retrievedOn) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(retrievedOn), 'Expected retrieval date YYYY-MM-DD');
  assert(Array.isArray(source) && source.length, 'Expected original MAS array');
  assert(response && Array.isArray(response.Items) && response.Items.length, 'Expected Liquid rows');
  assert(Object.keys(response).every(key => key === 'Items'), 'Merge all Liquid pages before reconciliation');
  const original = new Map(source.map(record => [record._DID, record]));
  assert.equal(original.size, source.length, 'Duplicate source MAS IDs');
  const live = new Map();
  for (const item of response.Items) {
    assert(item.CollectionUri === 'rex://ms.accessibility/' && item.TableUri === 'rex://ms.accessibility/Requirements/',
      'Unexpected Liquid collection/table');
    assert(item.Uri === `rex://ms.accessibility/Requirements/${item.Id}/` && item.Properties._DID === item.Id,
      'Liquid row identity mismatch');
    assert(!live.has(item.Id), 'Duplicate Liquid MAS IDs');
    live.set(item.Id, item);
  }
  const changes = [];
  const records = source.map(old => {
    const item = live.get(old._DID);
    if (!item) {
      changes.push({ id: old._DID, status: 'not-found', fields: [] });
      return { ...old, _Liquid: { status: 'not-found', uri: null, updatedOn: null, retrievedOn } };
    }
    return project(item, old);
  });
  for (const item of live.values()) if (!original.has(item.Id)) records.push(project(item));

  function project(item, old) {
    const properties = item.Properties;
    const record = {};
    for (const key of [...masFields.metadata, ...masFields.richText]) {
      if (Object.hasOwn(properties, key)) record[key] = text(properties[key]);
    }
    for (const key of masFields.flags) if (Object.hasOwn(properties, key)) record[key] = properties[key];
    for (const key of masFields.relationships) {
      if (!Object.hasOwn(properties, key)) continue;
      assert(Array.isArray(properties[key]), `Invalid Liquid relationship: ${key}`);
      record[key] = [...new Set(properties[key].flat().flatMap(link => {
        assert(link && typeof link.Target === 'string', `Missing Liquid target: ${key}`);
        if (link.Target.startsWith('rex://ms.accessibility/[')) {
          assert(typeof link.Value === 'string', 'Missing serialized Liquid relationship value');
          const values = JSON.parse(link.Value);
          assert(Array.isArray(values) && values.length && values.every(value =>
            typeof value === 'string' && /^\/Requirements\/[A-Za-z0-9.-]+$/.test(value) &&
            live.has(value.split('/')[2])), 'Invalid serialized Liquid requirement references');
          return values.map(value => `rex://ms.accessibility${value}/`);
        }
        return link.Target;
      }))];
    }
    if (old) {
      const supplement = Object.fromEntries(masFields.supplemental
        .filter(key => Object.hasOwn(old, key) && (key !== '_Applicability' || typeof old[key] === 'object'))
        .map(key => [key, old[key]]));
      if (Object.keys(supplement).length) record._SourceSupplement = supplement;
    }
    const status = old ? 'matched' : 'added';
    const fields = [...new Set([...Object.keys(old ?? {}), ...Object.keys(record)])]
      .filter(key => !equivalent(old?.[key], record[key])).sort();
    record._Liquid = { status, uri: item.Uri, updatedOn: properties._UpdatedOn, retrievedOn };
    changes.push({ id: item.Id, status, fields });
    return record;
  }
  validateMasStandards(records);
  return { records, changes, sourceCount: source.length, liquidCount: live.size };
}

export function reconciliationMarkdown(result, { sourceSha256, liquidSha256, retrievedOn }) {
  const count = status => result.changes.filter(row => row.status === status).length;
  return `# MAS reconciliation (${retrievedOn})

This is a data comparison, not a content approval or accessibility conformance result.

- Original source: ADO agency commit \`9a64ed90b579b14ebbe90d1c797005c8ae4b784a\`,
  path \`src/Mcp/Servers/A11yStandards/A11yStandards/Data/MasStandards.json\`.
- Original Git blob: \`661ff7b91c059e02ceac3689def4fa44a4dfdbea\`.
- Original bytes SHA-256: \`${sourceSha256}\`.
- Liquid query: \`rex://ms.accessibility/Requirements/$rows\`, top 300.
  The response contained ${result.liquidCount} items and no continuation property.
- Liquid selected-content SHA-256: \`${liquidSha256}\` (canonical JSON of projected
  non-\`not-found\` records, excluding \`_SourceSupplement\` and \`_Liquid\`).
- Source ${result.sourceCount}; matched ${count('matched')}; added ${count('added')};
  source-only retained ${count('not-found')}; total ${result.records.length}.
- The original file contains trailing commas accepted by some readers but not
  strict JSON. This commit removes those delimiters and writes valid UTF-8 JSON;
  strings are not repaired or rewritten by the parser.

## Interpretation

For matched IDs, replace standard text, applicability, effective/publication
metadata and explicit relationship targets with Liquid's values. Keep rich-text
bodies unchanged, including any upstream spelling or formatting defects.
Flatten only the \`EnhancedMarkdown\` wrapper and relationship target arrays;
an empty rich-text object becomes an empty string.
Liquid \`MAS.05A.ReplacedBy\` contains a malformed target wrapping a serialized
two-element array. Decode its explicit \`Value\` into \`02.04.03\` and \`02.04.07\`
only after confirming both referenced IDs exist in the same retrieved rows.
Do not infer replacement relationships from similar titles or IDs.

Source-only detection/fix/examples/mappings remain under \`_SourceSupplement\`.
They are not Liquid-verified rules, mappings or approved fixes. Structured source
applicability is retained there while the authoritative applicability text is used.
Source-only IDs remain intact with \`_Liquid.status: not-found\`; this is NOT proof
of retirement or invalidity, and their original publication status is historical.
Do not treat them as current requirements without an authoritative lookup.

No personal editor/creator identities, analytics queries or operational
configuration are imported from Liquid. \`_UpdatedOn\` and per-record \`_Liquid\`
metadata identify the retrieved revisions; a frozen copy does not update itself.

## Per-record field changes

\`matched\` lists additions, removals or replacements relative to the original
record, including separation of source-only guidance. The first commit preserves
every original byte for review. \`added\` records are new to the source file.

| MAS ID | Result | Changed fields |
|---|---|---|
${result.changes.map(row => `| ${row.id} | ${row.status} | ${row.fields.map(field => '`' + field + '`').join(', ') || '(retained without normative changes)'} |`).join('\n')}
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [sourcePath, responsePath, retrievedOn, outputPath, reportPath, ...extra] = process.argv.slice(2);
  assert(sourcePath && responsePath && retrievedOn && outputPath && reportPath && !extra.length,
    'Usage: reconcile-mas.mjs source.json liquid-rows.json YYYY-MM-DD output.json report.md');
  assert(new Set([sourcePath, responsePath, outputPath, reportPath].map(path => resolve(path))).size === 4,
    'Input and output paths must be distinct');
  const bytes = await readFile(sourcePath);
  const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
  assert.equal(blob, '661ff7b91c059e02ceac3689def4fa44a4dfdbea', 'Source bytes do not match the report baseline');
  const source = parseMasSource(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  const response = JSON.parse(await readFile(responsePath, 'utf8'));
  const result = reconcileMas(source, response, retrievedOn);
  const selected = result.records.filter(record => record._Liquid.status !== 'not-found')
    .map(({ _Liquid, _SourceSupplement, ...record }) => record);
  await writeFile(outputPath, json(result.records));
  await writeFile(reportPath, reconciliationMarkdown(result, {
    sourceSha256: digest(bytes), liquidSha256: digest(json(selected)), retrievedOn
  }));
  console.log(json({ source: result.sourceCount, liquid: result.liquidCount, output: result.records.length }));
}
