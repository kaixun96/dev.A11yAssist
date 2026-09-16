import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { reconcileMas, parseMasSource } from '../tools/reconcile-mas.mjs';
import { validateMasStandards } from '../src/runtime/mas.mjs';
import { createKnowledgeHandler } from '../src/runtime/knowledge-mcp.mjs';

const json = value => JSON.stringify(value, null, 2) + '\n';
const old = id => ({ _DID: id, _Title: 'Original title', _Requirement: 'Original text' });
function item(id, properties = {}) {
  return {
    Id: id, Uri: `rex://ms.accessibility/Requirements/${id}/`,
    CollectionUri: 'rex://ms.accessibility/', TableUri: 'rex://ms.accessibility/Requirements/',
    Properties: { _DID: id, _Title: 'Liquid title', _Requirement: { EnhancedMarkdown: 'Liquid text' },
      _UpdatedOn: '2026-09-16T00:00:00Z', _PublicationStatus: 'Published', ...properties }
  };
}
const date = '2026-09-16';

test('source parser removes trailing commas without changing quoted bodies', () => {
  assert.deepEqual(parseMasSource('[{"_DID":"1","body":"literal ,] and ,} and \\"quoted\\"",},]'),
    [{ _DID: '1', body: 'literal ,] and ,} and "quoted"' }]);
  assert.throws(() => parseMasSource('[{"a": unquoted}]'), SyntaxError);
});

test('MAS reconciliation covers added, matched and absent IDs without inventing retirement', () => {
  const source = [{ ...old('1'), _Applicability: { applies_to: ['web'] },
    _CommonPatterns: { Good: ['Source example'] }, _Standards: { WCAG22: ['wrong'] },
    WCAG22: ['rex://wcag_2.2/Requirements/old/'] }, old('2')];
  const unchanged = structuredClone(source);
  const response = { Items: [item('1', {
    _Applicability: { EnhancedMarkdown: 'Authoritative scope' },
    _Support: {},
    WCAG22: [[{ Target: 'rex://wcag_2.2/Requirements/1.1.1/' }]],
    _UpdatedBy: 'must-not-be-exported'
  }), item('3')] };
  const result = reconcileMas(source, response, date);
  assert.deepEqual(source, unchanged);
  assert.deepEqual(result.records.map(record => record._DID), ['1', '2', '3']);
  assert.deepEqual(result.records.map(record => record._Liquid.status), ['matched', 'not-found', 'added']);
  const [matched, missing] = result.records;
  assert.equal(matched._Requirement, 'Liquid text');
  assert.equal(matched._Applicability, 'Authoritative scope');
  assert.equal(matched._Support, '');
  assert.deepEqual(matched.WCAG22, ['rex://wcag_2.2/Requirements/1.1.1/']);
  assert.deepEqual(matched._SourceSupplement._Standards, source[0]._Standards);
  assert.deepEqual(matched._SourceSupplement._CommonPatterns, source[0]._CommonPatterns);
  assert(!Object.hasOwn(matched, '_UpdatedBy') && !Object.hasOwn(matched, '_CommonPatterns'));
  assert.equal(missing._Requirement, 'Original text');
  assert.equal(missing._Liquid.uri, null);
});

test('MAS import rejects partial pages, duplicate IDs and unexpected source structures', () => {
  assert.throws(() => reconcileMas([old('1')], { Items: [item('1')], NextLink: 'next' }, date), /all Liquid pages/);
  assert.throws(() => reconcileMas([old('1'), old('1')], { Items: [item('1')] }, date), /Duplicate source/);
  assert.throws(() => reconcileMas([old('1')], { Items: [item('1'), item('1')] }, date), /Duplicate Liquid/);
  assert.throws(() => reconcileMas([old('1')], { Items: [item('1', { _Requirement: { unknown: 'data' } })] }, date), /rich text/);
  const wrong = item('1');
  wrong.CollectionUri = 'rex://other/';
  assert.throws(() => reconcileMas([old('1')], { Items: [wrong] }, date), /collection\/table/);
});

test('serialized Liquid replacement references are decoded only against existing IDs', () => {
  const encoded = { Target: 'rex://ms.accessibility/[encoded]/', Value: '["/Requirements/2","/Requirements/3"]' };
  const response = { Items: [item('1', { ReplacedBy: [[encoded]] }), item('2'), item('3')] };
  const { records } = reconcileMas([old('1')], response, date);
  assert.deepEqual(records[0].ReplacedBy, ['rex://ms.accessibility/Requirements/2/', 'rex://ms.accessibility/Requirements/3/']);
  response.Items.pop();
  assert.throws(() => reconcileMas([old('1')], response, date), /Invalid serialized/);
});

test('MAS structured validation rejects duplicates, unknown fields and false source attribution', () => {
  const valid = reconcileMas([old('1')], { Items: [item('1')] }, date).records;
  validateMasStandards(valid);
  assert.throws(() => validateMasStandards([...valid, valid[0]]), /Duplicate MAS ID/);
  assert.throws(() => validateMasStandards([{ ...valid[0], _Editors: 'private' }]), /Unknown MAS record/);
  assert.throws(() => validateMasStandards([{ ...valid[0], _CommonPatterns: {} }]), /separated/);
  const bad = structuredClone(valid);
  bad[0]._Liquid.uri = 'rex://other/Requirements/1/';
  assert.throws(() => validateMasStandards(bad), /URI mismatch/);
  bad[0]._Liquid.status = 'not-found';
  assert.throws(() => validateMasStandards(bad), /cannot claim/);
});

test('published MAS snapshot has complete reconciled inventory and evidence-bound content', async () => {
  const records = JSON.parse(await readFile(new URL('../../accessibility-kb/packages/common/mas/MasStandards.json', import.meta.url), 'utf8'));
  const report = await readFile(new URL('../../accessibility-kb/packages/common/mas/reconciliation.md', import.meta.url), 'utf8');
  validateMasStandards(records);
  assert.equal(records.length, 265);
  for (const [status, count] of [['matched', 244], ['added', 10], ['not-found', 11]]) {
    assert.equal(records.filter(record => record._Liquid.status === status).length, count);
  }
  const selected = records.filter(record => record._Liquid.status !== 'not-found')
    .map(({ _Liquid, _SourceSupplement, ...record }) => record);
  const hash = createHash('sha256').update(json(selected)).digest('hex');
  assert(report.includes(`Liquid selected-content SHA-256: \`${hash}\``));
  const first = records.find(record => record._DID === '01.01.01');
  assert(first._SourceSupplement._CommonPatterns.Good.length > 0);
  assert(first._SourceSupplement._CommonPatterns.Bad.length > 0);
  assert.deepEqual(first.WCAG22, ['rex://wcag_2.2/Requirements/1.1.1/']);
  assert.deepEqual(records.find(record => record._DID === 'MAS.05A').ReplacedBy,
    ['rex://ms.accessibility/Requirements/02.04.03/', 'rex://ms.accessibility/Requirements/02.04.07/']);
  assert.doesNotMatch(JSON.stringify(records), /"_UpdatedBy"|"webhook"|"accessToken"/);
});

test('MAS JSON is readable through the existing offline MCP without adding a live MAS tool', async () => {
  const { fileURLToPath } = await import('node:url');
  const handler = createKnowledgeHandler(fileURLToPath(new URL('../', import.meta.url)), 'a11y-kb',
    { env: { A11Y_ASSIST_KB_ROOT: fileURLToPath(new URL('../../accessibility-kb', import.meta.url)) } });
  const response = await handler({ method: 'tools/call',
    params: { name: 'a11y_kb_knowledge_read', arguments: { id: 'common.mas.standards' } } });
  assert(!response.isError, JSON.stringify(response));
  const result = JSON.parse(response.content[0].text);
  assert.equal(result.independentBehaviorVerified, false);
  assert.equal(result.contentApprovalVerified, false);
  assert(JSON.stringify(result).includes('01.01.01'));
});
