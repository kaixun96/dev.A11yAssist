# Native execution capabilities

Version 0.5 adds actual service implementations, not another provider protocol.
They remain small operations in the caller's workflow. None returns an
accessibility conformance verdict.

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
  "appendToDescription": "## Evidence\n\n![Before]({{before.png}})"
}
```

The implementation reads the live active Draft PR and exact source commit before
uploading, checks attachment hashes, uploads real bytes and verifies their downloaded
SHA-256, updates the description
and reads the PR back to confirm HEAD/description/Draft state. A legacy
`commentMarkdown` input is folded into the description; no comment endpoint is
called. Human-authored text is preserved by the shared description budget helper.

This operation does not create a PR, approve review, open a browser, play media or
claim behavior PASS. `liveMediaVerified` and `independentBehaviorVerified` are
explicitly false. The broader `publish` capability remains available only through
a separately qualified connection that supplies those additional responsibilities.

An ambiguous upload/PATCH is never retried automatically. The outer operation
journal prevents another execution with the same ID. Reconcile consumes only the
same persisted native response. If the process failed before that response was
written, inspect the original PR and uploads; do not change IDs to repeat work.

## Windows tools and compatibility profile

`native/windows-host.ps1` is the maintained Windows host setup implementation
extracted from AgentOW. AgentOW consumes a pinned generated copy at its existing
path. Its existing action names and default task/profile identity are retained;
`SetupRoot`, `ConsoleTaskName` and `PersonalEvaluatorSource` can be configured for a
different independently owned host. Do not use them to create a competing pool.

`Probe` reads prerequisites and writes a capability report; it is not proof of
live AT behavior. Setup/install/console-transfer actions are explicit administrative
operations, not automatically invoked by capture or installation of a plugin.
On Twin-managed machines, use the existing protected deployment/recovery workflow,
never these standalone administrative actions as an evidence handler.

The retained Python personal evaluator is under
`integrations/agentow/runtime/`, not generic knowledge. It still contains the
existing AgentOW campaign scenario and host assumptions. It is a compatibility
implementation, **not a generic NVDA/Narrator/Voice Access recorder**. Both AgentOW
copies are generated from this one source.

## What has not moved

Deployment-specific Dev Center recovery, shared resource ownership and token-bound
release, real AT handlers, independent media evaluation and end-to-end cleanup
remain with the original trusted deployment. No active worker, resource registry,
browser profile or installed plugin is migrated by this release.

Native ADO tests use synthetic service responses. Windows qualification covers the
existing read-only Probe and Codespace rejection; it does not establish live
recording, authentication, actual ADO publication or complete workflow readiness.
