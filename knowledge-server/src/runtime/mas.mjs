import assert from 'node:assert/strict';

const metadata = ['_DID', '_Title', '_EffectiveStart', '_EffectiveEnd', '_PublicationStatus',
  '_Requirement', '_Applicability', '_Guidance', '_Support', '_PublicationDate', '_UpdatedOn'];
const relationships = ['EN.301.549.V3.2.1', 'Section508', 'WCAG22', 'FCC', 'TIAEIA',
  'Principle', 'Category', 'ApplicationsSubcategory', 'Guideline', 'Scoping', 'Replaced', 'ReplacedBy'];
const supplemental = ['_DetectionPatterns', '_FixPrinciples', '_CommonPatterns',
  '_Standards', '_Metadata', '_TechnicalGuidance', '_Applicability'];
const richText = ['AdditionalInformation', 'RichDescription', 'WordExportLink'];
const flags = ['_IsKqlAnalyticsQueryLive', '_IsS360IntegrationEnabled',
  '_IsStateRollupDisabled', '_IsKqlContextObjectEnabled'];
export const masFields = { metadata, relationships, supplemental, richText, flags };
const allowed = new Set([...metadata, ...relationships, ...richText, ...flags,
  ...supplemental, '_SourceSupplement', '_Liquid']);

export function validateMasStandards(records) {
  assert(Array.isArray(records) && records.length > 0 && records.length <= 1000, 'Invalid MAS records');
  const ids = new Set();
  for (const record of records) {
    assert(record && typeof record === 'object' && !Array.isArray(record), 'Invalid MAS record');
    assert(Object.keys(record).every(key => allowed.has(key)), 'Unknown MAS record field');
    assert(typeof record._DID === 'string' && /^[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*$/.test(record._DID), 'Invalid MAS ID');
    assert(!ids.has(record._DID), `Duplicate MAS ID: ${record._DID}`);
    ids.add(record._DID);
    assert(typeof record._Title === 'string' && record._Title.trim(), `Missing MAS title: ${record._DID}`);
    assert(typeof record._Requirement === 'string', `Invalid MAS requirement: ${record._DID}`);
    const tracking = record._Liquid;
    assert(tracking && typeof tracking === 'object' && !Array.isArray(tracking), 'Missing MAS Liquid tracking');
    assert.deepEqual(Object.keys(tracking).sort(), ['retrievedOn', 'status', 'updatedOn', 'uri']);
    assert(['matched', 'added', 'not-found'].includes(tracking.status), 'Invalid MAS Liquid status');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(tracking.retrievedOn), 'Invalid MAS retrieval date');
    if (tracking.status === 'not-found') {
      assert.equal(tracking.uri, null, 'Unverified MAS record cannot claim a Liquid URI');
      assert.equal(tracking.updatedOn, null, 'Unverified MAS record cannot claim a Liquid revision');
    } else {
      assert.equal(tracking.uri, `rex://ms.accessibility/Requirements/${record._DID}/`, 'MAS Liquid URI mismatch');
      assert(typeof tracking.updatedOn === 'string' && Number.isFinite(Date.parse(tracking.updatedOn)), 'Invalid MAS revision');
      for (const key of [...metadata, ...richText]) {
        if (Object.hasOwn(record, key)) assert(record[key] === null || typeof record[key] === 'string', `Invalid MAS text: ${key}`);
      }
      assert(supplemental.filter(key => key !== '_Applicability').every(key => !Object.hasOwn(record, key)),
        'Source-only MAS guidance must be separated from Liquid content');
    }
    for (const key of relationships) {
      if (!Object.hasOwn(record, key)) continue;
      assert(Array.isArray(record[key]) && record[key].every(value => typeof value === 'string' &&
        /^(?:rex:\/\/[a-z0-9_.-]+)?\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(value)), `Invalid MAS relation: ${key}`);
      assert.equal(new Set(record[key]).size, record[key].length, `Duplicate MAS relation: ${key}`);
    }
    for (const key of flags) if (Object.hasOwn(record, key)) assert.equal(typeof record[key], 'boolean');
    if (Object.hasOwn(record, '_SourceSupplement')) {
      const supplement = record._SourceSupplement;
      assert(supplement && typeof supplement === 'object' && !Array.isArray(supplement), 'Invalid MAS source supplement');
      assert(Object.keys(supplement).every(key => supplemental.includes(key)), 'Unknown MAS supplement field');
    }
  }
}
