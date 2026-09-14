import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { bugDescription } from './bug-description.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function demand(value, message) { if (!value) throw new Error(message); }

export async function createAdoBug(configuration, draft, options = {}) {
  const organization = new URL(configuration.organization);
  demand(organization.protocol === 'https:' && !organization.username && !organization.password &&
    !organization.search && !organization.hash && configuration.project?.trim(), 'Expected a configured HTTPS organization/project');
  demand(configuration.authorization?.trim(), 'An ephemeral ADO authorization header is required');
  const base = `${organization.href.replace(/\/$/, '')}/${encodeURIComponent(configuration.project)}`;
  const fetchImpl = options.fetchImpl ?? fetch;
  const signal = options.signal ?? AbortSignal.timeout(120000);
  const headers = { Authorization: configuration.authorization };
  const progress = options.progress ?? { uploaded: [], bugId: null };
  const checkpoint = options.checkpoint ?? (async () => {});
  const limit = 128 * 1024 * 1024;
  demand(typeof draft.title === 'string' && draft.title.trim() &&
    Array.isArray(draft.attachments) && draft.attachments.length > 0 && draft.attachments.length <= 20 &&
    draft.validation?.integrity === 'verified', 'A validated detailed Bug draft and reviewed evidence are required');
  const configuredFields = configuration.bugFields ?? {};
  demand(Object.entries(configuredFields).every(([key, value]) =>
    /^[A-Za-z][A-Za-z0-9.]+$/.test(key) &&
    !['System.Title', 'System.Description', 'System.WorkItemType', 'System.Id', 'System.History',
      'System.AssignedTo', 'System.State', 'System.Reason'].includes(key) &&
    (typeof value === 'string' || typeof value === 'number')),
  'Invalid operator-configured Bug fields');
  // Validate every file before the first external mutation, not midway through uploads.
  const files = [];
  let total = 0;
  for (const attachment of draft.attachments) {
    const info = await stat(attachment.localPath);
    total += info.size;
    demand(info.isFile() && info.size > 0 && info.size <= limit && total <= limit,
      'Simple upload requires nonempty attachments totaling at most 128 MiB; use a separately approved chunked route for larger evidence');
    const bytes = await readFile(attachment.localPath);
    demand(digest(bytes) === attachment.sha256, 'Evidence bytes changed after draft approval');
    files.push({ attachment, bytes });
  }
  const request = (url, init = {}) => fetchImpl(url, { ...init,
    headers: { ...headers, ...init.headers }, signal, redirect: 'error' });
  async function json(response, label) {
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
  async function verifyUpload(upload, attachment, size) {
    const response = await request(attachmentUrl(upload.url));
    demand(response.ok && response.body, `Attachment readback failed (HTTP ${response.status})`);
    const hash = createHash('sha256');
    let length = 0;
    for await (const bytes of response.body) {
      length += bytes.length;
      demand(length <= size, 'Attachment readback exceeds approved size');
      hash.update(bytes);
    }
    demand(length === size && hash.digest('hex') === attachment.sha256, 'Uploaded evidence hash/size mismatch');
  }
  if (!options.reconcile) {
    demand(progress.uploaded.length === 0 && !progress.bugId, 'Existing upload/create progress must be reconciled, never replayed');
    for (const { attachment, bytes } of files) {
      const uploaded = await json(await request(
        `${base}/_apis/wit/attachments?fileName=${encodeURIComponent(attachment.name)}&uploadType=Simple&api-version=7.1`,
        { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: bytes }), 'Upload WIT attachment');
      const record = { name: attachment.name, url: attachmentUrl(uploaded.url), sha256: attachment.sha256 };
      progress.uploaded.push(record);
      await checkpoint(progress);
      await verifyUpload(record, attachment, bytes.length);
    }
    const description = bugDescription(draft, progress.uploaded);
    const fields = { ...configuredFields, 'System.Title': draft.title, 'System.Description': description };
    const patch = [
      ...Object.entries(fields).map(([key, value]) => ({ op: 'add', path: `/fields/${key}`, value })),
      ...progress.uploaded.map(item => ({ op: 'add', path: '/relations/-',
        value: { rel: 'AttachedFile', url: item.url, attributes: { comment: item.name } } }))
    ];
    // This ID is persisted before readback. An uncertain POST is never repeated.
    const created = await json(await request(`${base}/_apis/wit/workitems/$Bug?api-version=7.1`, {
      method: 'POST', headers: { 'Content-Type': 'application/json-patch+json' }, body: JSON.stringify(patch)
    }), 'Create Bug');
    demand(Number.isSafeInteger(created.id) && created.id > 0, 'Create response omitted the Bug ID; reconcile remotely');
    progress.bugId = created.id;
    await checkpoint(progress);
  }
  demand(Number.isSafeInteger(progress.bugId) && progress.bugId > 0,
    'Creation outcome unknown or only attachments exist; inspect original remote correlation before any further mutation');
  const current = await json(await request(
    `${base}/_apis/wit/workitems/${progress.bugId}?$expand=relations&api-version=7.1`), 'Read created Bug');
  demand(current.id === progress.bugId && current.fields?.['System.WorkItemType'] === 'Bug' &&
    current.fields?.['System.Title'] === draft.title &&
    current.fields?.['System.Description'] === bugDescription(draft, progress.uploaded),
  'Created Bug fields do not match the approved draft');
  demand(Object.entries(configuredFields).every(([key, value]) => current.fields[key] === value),
    'Created Bug project metadata differs from the configured fields');
  demand(progress.uploaded.length === files.length, 'Incomplete attachment ledger');
  for (const { attachment, bytes } of files) {
    const uploaded = progress.uploaded.find(item => item.name === attachment.name && item.sha256 === attachment.sha256);
    demand(uploaded && current.relations?.some(item => item.rel === 'AttachedFile' && item.url === uploaded.url),
      'Created Bug is missing an evidence attachment relation');
    await verifyUpload(uploaded, attachment, bytes.length);
  }
  return { bug: { id: current.id, url: `${base}/_workitems/edit/${current.id}` },
    uploaded: progress.uploaded, descriptionVerified: true, attachmentBytesVerified: true,
    mediaPlaybackVerified: false, mediaPlaybackBasis: 'caller review recorded in the approved draft',
    scope: 'validated-discovery-bug', commentPosted: false };
}
