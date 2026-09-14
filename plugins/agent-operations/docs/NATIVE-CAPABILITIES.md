# Native execution capabilities

Version 0.5 adds actual service implementations, not another provider protocol.
They remain small operations in the caller's workflow. None returns an
accessibility conformance verdict.

Author native implementations in `src/native/` and their runtime callers in
`src/runtime/`; build generates self-contained execution-plugin copies. Root
runtime/native compatibility exports and integration-provider aliases are not
part of this draft. Preserve factual attribution and license notices.

The current `src/native/windows-host.ps1` is the scoped host-preparation feature
of `a11y-setup`, also reused internally by Bug Bash. It is not a retired root
export, an ADO operation or an operational MCP server. Setup dependency templates,
check-only behavior and separately authorized preparation remain distinct from
provider execution and real AT evidence; see the
[setup contract](https://github.com/kaixun96/dev.A11yAssist/blob/main/docs/SETUP.md).

## Work-item and discussion retrieval

Configure only the `intake` connection from `config/example.ado.json`. Supply
authorization using normal host-managed authentication in the named process
environment variable, containing a complete Bearer or Basic header. Never put its
value in config, prompts, receipts or source control. The connection uses only the
configured organization/project and refuses redirects.

Call `a11y_intake_invoke`:

```json
{
  "operationId": "read-work-item-42",
  "action": "read-item",
  "context": { "subject": "ado-work-item:42" },
  "input": { "itemId": 42 }
}
```

The artifact contains the exact item revision, fields, all paginated comments
(including deleted entries returned by ADO), and attachment metadata. Repeated
pagination tokens or incomplete responses fail explicitly. Fetching comments is
not interpreting them; indexing attachments is not downloading or reviewing their
bytes. The caller still derives acceptance criteria, resolves discussion and
enforces its deployment's claim-before-intake policy before calling this tool.
No claim, machine, branch or PR is acquired.

## Existing Draft PR attachments

Configure the `publish` connection. Call `a11y_publish_invoke` with action
`attach-evidence`, a stable operationId, context.head, and input:

```json
{
  "prId": 42,
  "attachments": [
    {
      "name": "before.png",
      "localPath": "C:\\YourEvidence\\before.png",
      "sha256": "<actual 64-character SHA-256>"
    }
  ],
  "descriptionMarkdown": "## Evidence\n\n![Before]({{before.png}})"
}
```

The implementation reads the live active Draft PR and exact source commit before
uploading, checks attachment hashes, uploads real bytes and verifies their downloaded
SHA-256, updates the description
and reads the PR back to confirm HEAD/description/Draft state. Use
`descriptionMarkdown` for description content; no comment endpoint is called.
Human-authored text is preserved by the shared description budget helper.

This operation does not create a PR, approve review, open a browser, play media or
claim behavior PASS. `liveMediaVerified` and `independentBehaviorVerified` are
explicitly false. The broader `publish` capability remains available only through
a separately qualified connection that supplies those additional responsibilities.

An ambiguous upload/PATCH is never retried automatically. The outer operation
journal prevents another execution with the same ID. Reconcile consumes only the
same persisted native response. If the process failed before that response was
written, inspect the original PR and uploads; do not change IDs to repeat work.

## Windows AT and deployment responsibilities

The full workflow supports Twinbot with multiple Windows DevBoxes or Copilot CLI
with one/multiple Windows DevBoxes. Real AT capture requires a separately configured,
qualified provider and an exclusively owned evaluator. No host setup or browser
helper is installed or invoked by these native ADO operations.

Deployment-specific recovery, shared resource ownership and token-bound release,
real AT handlers, independent media evaluation and end-to-end cleanup belong to
the authorized deployment's trusted connections. Missing capabilities fail
explicitly; static reasoning, synthetic media or a successful process exit cannot
substitute for real AT evidence.

Native ADO tests use synthetic service responses. They do not establish live
recording, authentication, actual ADO publication or complete workflow readiness.
The retained implementations are maintained under the repository's
[license](../LICENSE); preserve applicable attribution when distributing derived code.
