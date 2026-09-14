import { open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { demand } from './ado-bug-client.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');

async function chunk(handle, position, size) {
  const bytes = Buffer.alloc(size);
  let offset = 0;
  while (offset < size) {
    const result = await handle.read(bytes, offset, size - offset, position + offset);
    demand(result.bytesRead > 0, 'Evidence bytes changed after draft approval (unexpected EOF)');
    offset += result.bytesRead;
  }
  return bytes;
}

export async function prepareBugEvidence(attachments, policy, consume) {
  const files = [];
  try {
    let total = 0;
    for (const attachment of attachments) {
      const handle = await open(attachment.localPath, 'r');
      const file = { attachment, handle, chunks: [] };
      files.push(file);
      const info = await handle.stat();
      file.size = info.size;
      total += info.size;
      demand(info.isFile() && info.size > 0 && info.size <= policy.maxFileBytes && total <= policy.maxTotalBytes,
        'Nonempty evidence must fit the approved per-file/total upload limits');
      file.mode = policy.mode === 'chunked' || info.size > 128 * 1024 * 1024 ? 'chunked' : 'simple';
      const hash = createHash('sha256');
      for (let offset = 0; offset < info.size; offset += policy.chunkSizeBytes) {
        const bytes = await chunk(handle, offset, Math.min(policy.chunkSizeBytes, info.size - offset));
        hash.update(bytes);
        file.chunks.push({ offset, size: bytes.length, sha256: digest(bytes) });
      }
      demand(hash.digest('hex') === attachment.sha256, 'Evidence bytes changed after draft approval');
    }
    return await consume(files);
  } finally {
    for (const file of files) await file.handle.close();
  }
}

export async function evidenceChunk(file, descriptor) {
  const bytes = await chunk(file.handle, descriptor.offset, descriptor.size);
  demand(digest(bytes) === descriptor.sha256, 'Evidence bytes changed after draft approval');
  return bytes;
}

export async function verifyBugUpload(client, upload, file) {
  const response = await client.request(client.attachmentUrl(upload.url));
  demand(response.ok && response.body, `Attachment readback failed (HTTP ${response.status})`);
  const hash = createHash('sha256');
  let length = 0;
  for await (const bytes of response.body) {
    length += bytes.length;
    demand(length <= file.size, 'Attachment readback exceeds approved size');
    hash.update(bytes);
  }
  demand(length === file.size && hash.digest('hex') === file.attachment.sha256, 'Uploaded evidence hash/size mismatch');
}
