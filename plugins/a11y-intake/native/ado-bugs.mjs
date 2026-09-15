import { randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { bugDescription } from './bug-description.mjs';
import { bugClient, demand, wiqlText, inspectAdoBugDestination } from './ado-bug-client.mjs';
import { prepareBugEvidence, evidenceChunk, verifyBugUpload } from './ado-bug-evidence.mjs';

const tags = value => String(value ?? '').split(';').map(item => item.trim().toLowerCase()).filter(Boolean).sort();

export async function createAdoBug(configuration, draft, options = {}) {
  const client = bugClient(configuration, options);
  demand(typeof draft.title === 'string' && draft.title.trim() && draft.title.length <= 512 &&
    Array.isArray(draft.attachments) && draft.attachments.length > 0 && draft.attachments.length <= 20 &&
    draft.validation?.integrity === 'verified', 'A validated detailed Bug draft and reviewed evidence are required');
  demand(!draft.destination || isDeepStrictEqual(draft.destination, client.destination),
    'Bug destination, fields or upload policy changed after approval');
  demand(!(options.resume && options.reconcile), 'Choose read-only reconciliation or explicit continuation');
  demand(!(options.resume || options.reconcile) || options.progress, 'Continuation requires the original checkpoint');
  if (!options.resume && !options.reconcile) demand(!options.progress, 'Existing progress must be reconciled, never replayed');
  const progress = options.progress ?? { schemaVersion: 1, marker: `A11yAssist-${randomUUID()}`,
    uploaded: [], bugId: null, phase: 'prepared' };
  demand(progress.schemaVersion === 1 && /^A11yAssist-[a-f0-9-]{36}$/.test(progress.marker) &&
    Array.isArray(progress.uploaded) && ['prepared', 'upload-intent', 'upload-created', 'upload-complete',
      'chunk-intent', 'chunk-complete', 'upload-verified', 'uploads-verified', 'create-intent', 'created', 'verified'].includes(progress.phase),
  'Original native upload/create checkpoint is required');
  const checkpoint = options.checkpoint ?? (async () => {});
  const save = async phase => { progress.phase = phase; await checkpoint(progress); };
  if (!options.progress) await save('prepared');
  return prepareBugEvidence(draft.attachments, client.destination.upload, async files => {
    const fields = () => ({ ...client.destination.fields, 'System.Title': draft.title,
      [client.destination.descriptionField]: bugDescription(draft, progress.uploaded),
      'System.Tags': [client.destination.fields['System.Tags'], progress.marker].filter(Boolean).join('; ') });
    async function readBug(id) {
      return client.json(`${client.base}/_apis/wit/workitems/${id}?$expand=relations&api-version=7.1`,
        undefined, 'Read created Bug');
    }
    function verifyFields(current) {
      demand(current.id === progress.bugId && current.fields?.['System.WorkItemType'] === 'Bug',
        'Created Bug identity/type mismatch');
      for (const [name, value] of Object.entries(fields())) demand(
        name === 'System.Tags' ? isDeepStrictEqual(tags(current.fields[name]), tags(value)) : current.fields[name] === value,
        'Created Bug fields do not match the approved draft and project metadata');
    }
    async function resolveCreation() {
      const ids = await client.query(`[System.Tags] CONTAINS ${wiqlText(progress.marker)}`, 2);
      demand(ids.length === 1, `Creation correlation returned ${ids.length} candidates; preserve the original pending operation, never create again`);
      progress.bugId = ids[0];
      const current = await readBug(progress.bugId);
      verifyFields(current);
      await save('created');
    }
    if (!progress.bugId && progress.phase === 'create-intent') await resolveCreation();
    if (!options.reconcile && !progress.bugId) {
      demand(progress.phase !== 'upload-intent', 'Upload response unknown; preserve the original operation and inspect its remote attachment, never restart upload');
      const inspection = await inspectAdoBugDestination(configuration, draft.title, { ...options, signal: client.signal });
      demand(!inspection.missingFields.length && !inspection.invalidValues.length,
        `Bug process configuration needs correction: ${[...inspection.missingFields, ...inspection.invalidValues].join(', ')}`);
      if (inspection.candidates.length) demand(typeof options.duplicateReview?.reason === 'string' &&
        options.duplicateReview.reason.trim() && Array.isArray(options.duplicateReview.candidateIds) &&
        options.duplicateReview.candidateIds.every(id => Number.isSafeInteger(id) && id > 0) &&
        isDeepStrictEqual([...new Set(options.duplicateReview.candidateIds ?? [])].sort((a, b) => a - b),
          inspection.candidates.map(item => item.id).sort((a, b) => a - b)) && !inspection.search.possiblyTruncated,
      'Review the current duplicate candidates explicitly before creating another Bug');
      if (progress.phase === 'chunk-intent') {
        const file = files.find(item => item.attachment.name === progress.activeFile);
        const record = progress.uploaded.find(item => item.name === progress.activeFile);
        demand(file && record, 'Unknown chunk checkpoint is missing its original attachment');
        // A lost final response can be observed; partial ranges are never guessed or replayed.
        await verifyBugUpload(client, record, file);
        record.offset = file.size;
        await save('upload-complete');
      }
      for (const file of files) {
        const { attachment } = file;
        let record = progress.uploaded.find(item => item.name === attachment.name);
        if (!record) {
          progress.activeFile = attachment.name;
          const body = file.mode === 'simple'
            ? Buffer.concat(await readSimple(file)) : Buffer.alloc(0);
          await save('upload-intent');
          const uploaded = await client.json(
            `${client.base}/_apis/wit/attachments?fileName=${encodeURIComponent(attachment.name)}&uploadType=${file.mode === 'chunked' ? 'chunked' : 'Simple'}&api-version=7.1`,
            { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body }, 'Upload WIT attachment');
          record = { name: attachment.name, url: client.attachmentUrl(uploaded.url),
            sha256: attachment.sha256, size: file.size, mode: file.mode,
            offset: file.mode === 'simple' ? file.size : 0 };
          progress.uploaded.push(record);
          await save(file.mode === 'simple' ? 'upload-complete' : 'upload-created');
        }
        demand(record.sha256 === attachment.sha256 && record.size === file.size && record.mode === file.mode &&
          Number.isSafeInteger(record.offset) && record.offset >= 0 && record.offset <= file.size,
        'Attachment checkpoint differs from the approved file');
        if (record.mode === 'chunked') {
          demand(record.offset === file.size || file.chunks.some(part => part.offset === record.offset),
            'Chunk checkpoint is not on an approved boundary');
          for (const part of file.chunks.filter(part => part.offset >= record.offset)) {
            const bytes = await evidenceChunk(file, part);
            progress.activeFile = attachment.name;
            await save('chunk-intent');
            const target = new URL(record.url);
            target.searchParams.set('api-version', '7.1');
            target.searchParams.set('fileName', attachment.name);
            const uploaded = await client.json(target.href, { method: 'PUT',
              headers: { 'Content-Type': 'application/octet-stream',
                'Content-Range': `bytes ${part.offset}-${part.offset + part.size - 1}/${file.size}`,
                'Content-Length': String(part.size) }, body: bytes }, 'Upload WIT attachment chunk');
            demand(new URL(client.attachmentUrl(uploaded.url)).pathname === new URL(record.url).pathname,
              'Chunk response changed attachment identity');
            record.offset = part.offset + part.size;
            await save('chunk-complete');
          }
        }
        await verifyBugUpload(client, record, file);
        await save('upload-verified');
      }
      demand(progress.uploaded.length === files.length, 'Unexpected attachment checkpoint entries');
      await save('uploads-verified');
      const patch = [
        ...Object.entries(fields()).map(([key, value]) => ({ op: 'add', path: `/fields/${key}`, value })),
        ...progress.uploaded.map(item => ({ op: 'add', path: '/relations/-',
          value: { rel: 'AttachedFile', url: item.url, attributes: { comment: item.name } } }))
      ];
      // Persist correlation before POST, including when the server creates a Bug but its response is lost.
      await save('create-intent');
      const created = await client.json(`${client.base}/_apis/wit/workitems/$Bug?api-version=7.1`, {
        method: 'POST', headers: { 'Content-Type': 'application/json-patch+json' }, body: JSON.stringify(patch)
      }, 'Create Bug');
      demand(Number.isSafeInteger(created.id) && created.id > 0, 'Create response omitted the Bug ID; reconcile remotely');
      progress.bugId = created.id;
      await save('created');
    }
    demand(Number.isSafeInteger(progress.bugId) && progress.bugId > 0,
      'Bug not created; inspect the checkpoint and use explicit resume only for proven unstarted next steps');
    const current = await readBug(progress.bugId);
    verifyFields(current);
    demand(progress.uploaded.length === files.length, 'Incomplete attachment ledger');
    for (const file of files) {
      const uploaded = progress.uploaded.find(item => item.name === file.attachment.name &&
        item.sha256 === file.attachment.sha256);
      demand(uploaded && current.relations?.some(item => item.rel === 'AttachedFile' && item.url === uploaded.url),
        'Created Bug is missing an evidence attachment relation');
      await verifyBugUpload(client, uploaded, file);
    }
    await save('verified');
    return { bug: { id: current.id, url: `${client.base}/_workitems/edit/${current.id}` },
      uploaded: progress.uploaded, descriptionVerified: true, attachmentBytesVerified: true,
      mediaPlaybackVerified: false, mediaPlaybackBasis: 'caller review recorded in the approved draft',
      scope: 'validated-discovery-bug', commentPosted: false };
  });
}

async function readSimple(file) {
  const buffers = [];
  for (const part of file.chunks) buffers.push(await evidenceChunk(file, part));
  return buffers;
}
