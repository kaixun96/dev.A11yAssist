# Create accessibility Bugs

`a11y-file-bug` owns the post-validation filing step. It prepares an inspectable
draft, then creates one explicitly approved Bug with attached evidence. It does
not fix source, create a PR, assign people or turn source risks into page defects.

## Use

Install `a11y-file-bug@a11y-assist`, configure the private discovery state and a
`bugs` connection, and restart Copilot. Ask `/a11y-file-bug prepare a Bug for
<validated task/finding>; include detailed reproduction and reviewed video`.
Use `a11y_file_bug_draft`; no external mutation occurs. Then explicitly approve
the exact returned SHA-256 and destination before `a11y_file_bug_submit`.
The original capture/cleanup providers and category-plugin pin must remain
available to verify the original records. No actual filing is implied by install.

When creating a discovery plan for an explicitly requested filing workflow, set
`filingRequested:true`. The coordinator yields after validation/cleanup until
each observed finding is filed or `a11y_file_bug_skip` records a precise reason
(for example, a linked existing Bug or no filing authority). The flag alone
does not authorize uploads. Pending creation cannot be hidden with a skip.

```json
{
  "bugs": {
    "kind": "ado",
    "organization": "https://dev.azure.com/<organization>",
    "project": "<project>",
    "authorizationEnvironmentVariable": "A11Y_ADO_AUTHORIZATION",
    "bugFields": {
      "System.AreaPath": "<approved area>",
      "Microsoft.VSTS.Common.Priority": 2
    }
  }
}
```

Place this under `providers` in the private config. The authorization environment
variable contains a host-managed ephemeral `Bearer ...` or `Basic ...` header;
never put its value in files, prompts or logs. Required fields depend on the
project process. Configure actual reference names and permitted values rather
than assuming a universal Bug schema. Organization/project are operator-selected,
not per-call arbitrary upload destinations.

The draft input `details` contains `environment` (os, browser,
assistiveTechnology, build, viewport, locale), `cause` (status and explanation),
and `evidence`: original operationId/path, unique name, kind, description and
`reviewed:true`. Video/audio additionally require `playbackReviewed:true`,
timestamps and transcript. For example, the transcript can identify the focused
control, actual spoken output and expected announcement at `00:12-00:18`.
These fields record caller media review; byte verification does not prove playback.

The generated HTML includes user impact, environment, target/state, preconditions,
numbered exact actions, expected/actual behavior, repeatability, cause uncertainty,
evidence links/digests, text alternatives and validation provenance. A confirmed
cause must already be present in the validated observation; otherwise use
`hypothesis` or `unknown`. Review actual deployment/build correspondence. Do not
invent standards, root cause, severity or assignment.

Approval is `{approved:true, reference:"<explicit authorization>",
draftSha256:"<returned digest>", organization:"<exact configured URL>",
project:"<exact configured project>"}`. Filing uses one deterministic operation
ID per task/finding. Search the destination for duplicates before approving;
this local identity guard is not a project-wide semantic duplicate search.

## Attachment and video sequence

1. Validate original capture receipts and selected artifact hashes; review privacy
   and playback, filenames, transcript and relevant timestamps before upload.
2. Upload binary bytes to the **Work Item Tracking** attachments endpoint, not a
   Git PR attachment API. Record every returned reference before continuing.
3. Read the remote bytes back and compare SHA-256 and size.
4. Create `$Bug` using JSON Patch (`application/json-patch+json`), with description
   and `/relations/-` entries of type `AttachedFile`. Link each video and provide
   readable text alternatives; do not depend on HTML video embedding surviving ADO.
5. Read the created Bug back with relations; verify title, description, attachment
   links and bytes. Return the real ID/URL and original-operation receipt.

The built-in simple uploader permits nonempty evidence totaling at most 128 MiB,
with a bounded request and no mutation retry. Larger videos stop before any
upload. Use a separately approved chunked WIT adapter: start an upload with
`uploadType=chunked`, persist the attachment ID, PUT each byte range with
`Content-Range`, verify the completed file, then attach its URL. Never silently
compress, truncate, move to public storage or treat an incomplete upload as evidence.
The chunked route is documented, not implemented by this simple uploader.

An interrupted POST may have succeeded remotely. Persisted progress supports
read-only reconciliation when the Bug ID is known. If only attachment references
or no Bug ID were returned, inspect the original remote correlation; do not
repeat creation, invent an ID, remove attachments or declare success. Preserve
the pending operation. Finish filing before final report delivery.

## References

- [WIT attachment creation and chunked upload](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/attachments/create?view=azure-devops-rest-7.1)
- [Create work item](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/create?view=azure-devops-rest-7.1)
- [Update work item and attachment relations](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/update?view=azure-devops-rest-7.1)
