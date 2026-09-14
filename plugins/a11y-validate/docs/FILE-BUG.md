# Create accessibility Bugs

`a11y-file-bug` owns the post-validation filing step. It prepares an inspectable
draft, then creates one explicitly approved Bug with attached evidence. It does
not fix source, create a PR, assign people or turn source risks into page defects.

## Use

Install `a11y-file-bug@a11y-assist`, configure the private discovery state and a
`bugs` connection, and restart Copilot. Ask `/a11y-file-bug prepare a Bug for
<validated task/finding>; include detailed reproduction and reviewed video`.
Use `a11y_file_bug_inspect` to read the actual Bug process fields and bounded
exact-title duplicate candidates, then `a11y_file_bug_draft`; neither mutates ADO.
Then explicitly approve
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
    "descriptionField": "System.Description",
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

Select the real process's description field, for example
`Microsoft.VSTS.TCM.ReproSteps` instead of `System.Description` when appropriate.
Inspection returns field reference names, required/default/allowed values and
exact-title candidates (at most 20). This is not semantic duplicate exclusion or
validation of all conditional server rules. Link an existing Bug with an explicit
skip reason when applicable. If current candidates are genuinely different,
record `approval.duplicateReview: {candidateIds: [123], reason: "..."}` for exactly
the returned IDs. Native submission checks fields and repeats the bounded search
before any upload; changed/unreviewed or truncated candidates block creation.

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
ID per task/finding. The draft hash also binds destination, process fields,
description-field selection and upload limits, so changing them needs new approval.
CLI and custom-provider calls use the same validation and task lock as the
specialized MCP entrypoint. Filing cannot race report delivery or start on a
cancelled, in-flight or delivered task.

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

The default remains simple upload, at most 128 MiB total. For larger reviewed
videos, explicitly configure `providers.bugs.attachmentUpload`, for example:

```json
{
  "mode": "auto",
  "maxFileBytes": 536870912,
  "maxTotalBytes": 1073741824,
  "chunkSizeBytes": 8388608,
  "timeoutSeconds": 600
}
```

`auto` uses chunked WIT transfer above 128 MiB per file; `chunked` always uses it.
The implementation bounds total bytes to 1 GiB, chunks to 1-16 MiB and the network
deadline to 1-900 seconds. The ADO organization must separately permit the selected
attachment size. Every file is hashed before any mutation, and each buffered chunk
is rechecked before sending. The upload ID, exact byte ranges and acknowledgements
are checkpointed; full remote size/SHA-256 is checked before creating a Bug.
Never silently compress, truncate, move to public storage or attach a partial upload.

## Interrupted filing

The original approved draft, request ID and native checkpoint survive process
restart. No new operation ID or changed provider/configuration may replace them.
Creation adds a unique `A11yAssist-...` correlation tag, alongside configured tags.

| Original checkpoint | Safe action |
|---|---|
| Bug ID known | `operation_reconcile`: read fields, relations and attachment bytes |
| Create request sent but ID response lost | `operation_reconcile`: query the original unique tag, accept exactly one matching Bug only after full readback |
| Proven acknowledged upload/chunk; next step not started | Explicit `a11y_file_bug_resume({operationId})`: continue only unstarted steps under original approval |
| Last chunk response lost, but complete remote bytes match | Explicit resume can accept the already-complete upload without another PUT |
| Upload response lost or partial chunk outcome unknown | Keep pending; no repeated POST/PUT, guessed offset or automatic deletion |
| `prepared`, before any upload/create intent | Resume after a transient read failure, or `a11y_file_bug_discard_unstarted({operationId, reason})` to record abandonment without deleting artifacts |

Correlation lookup uses read-only WIQL (an HTTP POST query, **not** another Bug
creation). Zero or multiple candidates are not proof of absence/success; retain
the pending operation. Reconciliation never starts uploads or creates Bugs.
Resume is a separate explicit action, not automatic retry. Discard cannot hide
any begun or unknown mutation; it closes the original operation as abandoned and
does not reset its identity or authorize another attempt.

Equivalent CLI commands are `operation-reconcile`, `operation-resume` and
`operation-discard` on `a11y-file-bug` and the original operation ID; discard also
takes a reason. Finished nonpass receipts remain visible in the final report.
Pending effects block report delivery. Media byte verification still does not
prove playback or real AT behavior.

## References

- [WIT attachment creation and chunked upload](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/attachments/create?view=azure-devops-rest-7.1)
- [Upload exact WIT byte ranges](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/attachments/upload-chunk?view=azure-devops-rest-7.1)
- [Read Bug process fields](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-item-types-field/list?view=azure-devops-rest-7.1)
- [Create work item](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/create?view=azure-devops-rest-7.1)
- [Update work item and attachment relations](https://learn.microsoft.com/en-us/rest/api/azure/devops/wit/work-items/update?view=azure-devops-rest-7.1)
