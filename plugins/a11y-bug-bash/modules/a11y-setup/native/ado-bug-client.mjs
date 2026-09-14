export function demand(value, message) { if (!value) throw new Error(message); }
const MiB = 1024 * 1024;
const reserved = new Set(['System.Title', 'System.Description', 'System.WorkItemType', 'System.Id',
  'System.History', 'System.AssignedTo', 'System.State', 'System.Reason']);
const fieldName = value => typeof value === 'string' && /^[A-Za-z][A-Za-z0-9.]+$/.test(value);

export function bugDestination(configuration) {
  const organization = new URL(configuration.organization);
  demand(organization.protocol === 'https:' && !organization.username && !organization.password &&
    !organization.search && !organization.hash && configuration.project?.trim(), 'Expected a configured HTTPS organization/project');
  const descriptionField = configuration.descriptionField ?? 'System.Description';
  demand(fieldName(descriptionField) && (!reserved.has(descriptionField) || descriptionField === 'System.Description') &&
    descriptionField !== 'System.Tags', 'Invalid Bug description field');
  const fields = configuration.bugFields ?? {};
  demand(fields && !Array.isArray(fields) && typeof fields === 'object' &&
    Object.keys(fields).length <= 128 &&
    Object.entries(fields).every(([key, value]) => fieldName(key) && !reserved.has(key) &&
      key !== descriptionField && (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value)))),
  'Invalid operator-configured Bug fields');
  demand(fields['System.Tags'] === undefined || typeof fields['System.Tags'] === 'string', 'Bug tags must be text');
  const supplied = configuration.attachmentUpload ?? {};
  demand(supplied && typeof supplied === 'object' && !Array.isArray(supplied) &&
    Object.keys(supplied).every(key => ['mode', 'maxTotalBytes', 'maxFileBytes', 'chunkSizeBytes', 'timeoutSeconds'].includes(key)),
  'Invalid attachment upload configuration');
  const upload = { mode: 'simple', maxTotalBytes: 128 * MiB, maxFileBytes: 128 * MiB,
    chunkSizeBytes: 8 * MiB, timeoutSeconds: 120, ...supplied };
  demand(['simple', 'auto', 'chunked'].includes(upload.mode) &&
    Number.isSafeInteger(upload.maxTotalBytes) && upload.maxTotalBytes > 0 && upload.maxTotalBytes <= 1024 * MiB &&
    Number.isSafeInteger(upload.maxFileBytes) && upload.maxFileBytes > 0 && upload.maxFileBytes <= upload.maxTotalBytes &&
    (upload.mode !== 'simple' || upload.maxFileBytes <= 128 * MiB) &&
    Number.isSafeInteger(upload.chunkSizeBytes) && upload.chunkSizeBytes >= MiB && upload.chunkSizeBytes <= 16 * MiB &&
    Number.isSafeInteger(upload.timeoutSeconds) && upload.timeoutSeconds >= 1 && upload.timeoutSeconds <= 900,
  'Invalid bounded attachment upload policy (maximum 1 GiB total, chunks 1-16 MiB, timeout 1-900 seconds)');
  return { organization: configuration.organization, project: configuration.project,
    descriptionField, fields, upload };
}

export function bugClient(configuration, options = {}) {
  const destination = bugDestination(configuration);
  demand(configuration.authorization?.trim(), 'An ephemeral ADO authorization header is required');
  const organization = new URL(destination.organization);
  const base = `${organization.href.replace(/\/$/, '')}/${encodeURIComponent(destination.project)}`;
  const signal = options.signal ?? AbortSignal.timeout(destination.upload.timeoutSeconds * 1000);
  const request = (url, init = {}) => (options.fetchImpl ?? fetch)(url, { ...init,
    headers: { Authorization: configuration.authorization, ...init.headers }, signal, redirect: 'error' });
  async function json(url, init, label) {
    const response = await request(url, init);
    demand(response.ok, `${label} failed (HTTP ${response.status}); reconcile the original operation, do not replay`);
    return response.json();
  }
  function attachmentUrl(value) {
    const url = new URL(value);
    demand(url.origin === organization.origin && !url.username && !url.password && !url.hash &&
      url.pathname.startsWith(`${organization.pathname.replace(/\/$/, '')}/`) &&
      /\/_apis\/wit\/attachments\/[^/]+$/i.test(url.pathname),
    'Unexpected WIT attachment URL; do not forward authorization');
    return url.href;
  }
  async function query(clause, maximum = 20) {
    const result = await json(`${base}/_apis/wit/wiql?$top=${maximum}&api-version=7.1`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project " +
          "AND [System.WorkItemType] = 'Bug' AND " + clause + ' ORDER BY [System.Id] DESC' }) }, 'Query Bugs (read-only)');
    demand(Array.isArray(result.workItems) && result.workItems.length <= maximum &&
      result.workItems.every(item => Number.isSafeInteger(item.id) && item.id > 0), 'Invalid Bug query response');
    return result.workItems.map(item => item.id);
  }
  return { destination, base, request, json, attachmentUrl, query, signal };
}

export const wiqlText = value => `'${value.replaceAll("'", "''")}'`;

export async function inspectAdoBugDestination(configuration, title, options = {}) {
  demand(typeof title === 'string' && title.trim() && title.length <= 512, 'A bounded Bug title is required');
  const client = bugClient(configuration, options);
  const schema = await client.json(`${client.base}/_apis/wit/workitemtypes/Bug/fields?$expand=all&api-version=7.1`,
    undefined, 'Read Bug process fields');
  demand(Array.isArray(schema.value) && schema.value.every(field => fieldName(field.referenceName)),
    'Invalid Bug process field response');
  const selected = ['System.Title', 'System.Tags', client.destination.descriptionField,
    ...Object.keys(client.destination.fields)];
  const missingFields = selected.filter(name => !schema.value.some(field => field.referenceName === name));
  const invalidValues = Object.entries(client.destination.fields).filter(([name, value]) => {
    const field = schema.value.find(item => item.referenceName === name);
    return field?.allowedValues?.length && !field.allowedValues.includes(value);
  }).map(([name]) => name);
  const ids = await client.query(`[System.Title] = ${wiqlText(title)}`);
  const candidates = [];
  for (const id of ids) {
    const item = await client.json(`${client.base}/_apis/wit/workitems/${id}?fields=System.Title,System.State,System.WorkItemType&api-version=7.1`,
      undefined, 'Read duplicate candidate');
    demand(item.id === id && item.fields?.['System.WorkItemType'] === 'Bug', 'Unexpected duplicate candidate');
    candidates.push({ id, url: `${client.base}/_workitems/edit/${id}`, title: item.fields['System.Title'],
      state: item.fields['System.State'] });
  }
  return { destination: client.destination, fields: schema.value.map(field => ({
    referenceName: field.referenceName, name: field.name, alwaysRequired: field.alwaysRequired === true,
    defaultValue: field.defaultValue ?? null, allowedValues: field.allowedValues ?? [],
    helpText: field.helpText ?? '' })), missingFields, invalidValues, candidates,
  search: { basis: 'exact-title-candidates-only', limit: 20, possiblyTruncated: ids.length === 20,
    semanticDuplicatesExcluded: false }, processRulesFullyValidated: false, externalMutations: false };
}
