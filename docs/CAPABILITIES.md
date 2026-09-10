# Independent capabilities and optional composition

Small plugins do one job inside the caller's workflow. The caller chooses the
order, interprets the result and decides what happens next. They do not require
this repository's intake, a global Bug/run journal, AgentOW or unrelated stages.

`a11y-workflow` is an optional composition, not the parent that every caller must
use. Its stricter phase ordering is local to that workflow.

## Interfaces

| Plugin | Independent tool | Context needed |
|---|---|---|
| a11y-intake | `a11y_intake_invoke`, action `read-item` | `subject`; built-in ADO connection and input.itemId |
| a11y-publish | `a11y_publish_invoke`, action `attach-evidence` | Exact `head`; built-in ADO connection, existing Draft PR and hash-bound files |
| a11y-knowledge | `/a11y-knowledge` | Supplied code/question; source-only guidance |
| a11y-intake | `a11y_intake_invoke`, action `intake` | `subject`: authorized item reference |
| a11y-capture | `a11y_capture_invoke`, action `before` or `after` | `scenarioHash`, `evaluator`; AFTER also `head` |
| a11y-validate | `a11y_validate_evidence` | Version-1 request/result files; verify also needs baseline files and repository root |
| a11y-validate | `a11y_validate_invoke`, action `validate` | `scenarioHash`; include HEAD/baseline binding when requested |
| a11y-publish | `a11y_publish_invoke`, action `publish` | Exact `head` and caller-authorized publication input |
| agent-operations | `agent_operations_invoke`, action `cleanup` | `subject` and explicitly owned cleanup scope |
| a11y-resources | `a11y_resources_resources` | Authorized resource connection; read-only status |

`context` may contain `subject`, `scenarioHash`, `evaluator`, `head` and
`beforeReceiptSha256`. Supplied bindings must match a successful receipt.
`input` carries the actual scenario, evidence, destination or resource references
understood by the configured tool connection. These are not invented by the
plugin or interchangeable between arbitrary backends.

For example, an existing workflow can request an evaluation without creating
an A11y Assist run:

```json
{
  "operationId": "caller-review-42",
  "action": "validate",
  "context": {
    "scenarioHash": "<actual 64-character lowercase SHA-256>",
    "head": "<actual 40-character lowercase Git HEAD>"
  },
  "input": {
    "evidencePath": "<evidence reference accepted by your evaluation connection>"
  }
}
```

Send that input to `a11y_validate_invoke`. The caller supplies the real hashes
and its connection's evidence input schema; the placeholders are not valid data.

## Read-only evidence checking

`a11y_validate_evidence` needs no provider configuration or operation journal.
It calls the shared `runtime/evidence-v1.mjs` implementation:

```json
{
  "phase": "reproduce",
  "requestPath": "C:\\evidence\\request.json",
  "resultPath": "C:\\evidence\\result.json"
}
```

For `phase: "verify"`, also provide `baselineRequestPath`,
`baselineResultPath` and `repoRoot`, all absolute paths. Verification binds the
actual baseline result bytes and independently resolves repository HEAD.
The retained [version-1 schema](../integrations/agentow/knowledge/evidence-contract.md)
describes the artifact shape. Its legacy workflow policy is not a prerequisite
for this read-only operation.

Without artifact roots, the result sets `independentBehaviorVerified: false` and
`artifactUriBytesVerified: false`. The checker validates structure, required
evidence declarations, scenario and applicable baseline/HEAD bindings. It does
not fetch every evidence URI, inspect media or independently judge behavior.
Use the evaluation connection for those responsibilities; do not turn
`valid: true` into an accessibility PASS.

### Optional local artifact bytes (v0.7)

Add an absolute `artifactRoot` to hash every result evidence file. For verify,
also provide an absolute `baselineArtifactRoot`; both BEFORE and AFTER files
must pass. A missing/invalid root or any missing/changed artifact rejects the
operation, never silently downgrades to structural-only. `baselineArtifactRoot`
is not accepted without verify and `artifactRoot`.

In this mode each evidence `uri` must be an unencoded relative local path such
as `images/target.png`, confined to its selected root. Backslashes are accepted
as separators. Absolute paths, traversal, URI schemes, percent escapes, query/
fragment syntax and alternate streams are rejected; symlinks cannot escape the
root. No network URI is fetched, decoded or mapped to a guessed local filename.
Prepare the original evidence contract with local references before acceptance;
do not rewrite an accepted baseline to enable this option.

The same `verifyArtifactFiles` implementation used by capability/workflow receipts
checks all evidence entries, including ones not linked by a step. Request/result
documents are parsed and hashed from the same single reads. The response includes
`documentSha256`, `artifactFileCount`, scope
`evidence-v1-structural-and-local-artifact-validation`, and
`artifactUriBytesVerified: true` only after all selected files pass.
This proves sampled local bytes match the declared hashes, not immutable storage,
their origin, deployed runtime, real AT, media quality or product behavior.
`independentBehaviorVerified` stays false and no workflow stage advances.

The independently installed validation plugin and the full package's
`a11y_workflow_evidence` tool call this same implementation without a provider,
claim, operation journal or running workflow.

## External tool connections

The native ADO connection implements `read-item` and `attach-evidence` directly;
see [native execution](NATIVE-CAPABILITIES.md). These narrower operations do not
certify complete intake or publication stages.

For an external-effect or independent-evaluation operation, configure only the
needed connection using [example.capability.json](../config/example.capability.json).
The configuration needs an auditable owner, private operation storage and the
relevant trusted executable mapping. It does not require a mode, DevBox roster
or unrelated source/review connections.

The existing provider transport is the connection mechanism in this release.
It can wrap the caller's existing authorized tools; there is no automatic
discovery or peer-to-peer calling of other MCP servers from this MCP process.
An already connected tool is not automatically a registered executable mapping.
Missing connections fail before any external action. See [the protocol](PROVIDERS.md).

Local responsibilities still apply: permissions, shared desktop/resource
ownership, truthful evidence, exact supplied bindings and nonduplicate effects.
The deployment may enforce additional policy through its trusted connection.
Caller-owned sequencing is not permission to bypass that policy.

## Identity, pending work and outcomes

Choose one stable `operationId` per logical invocation. The runtime stores only
that operation under `stateRoot/operations/<operationId>/`, not a workflow run.
It seals the operation, input, context, owner and connection before external
effects. The same completed invocation returns its verified recorded result;
changed input, owner, plugin or connection is rejected.

Unknown/pending results stay pending. Use `<prefix>_operation_status` and
`<prefix>_operation_reconcile` with the same ID. Do not retry with another ID,
change executors to evade a failure, auto-expire a lock or duplicate a remote
operation. Pending connections must provide real progress, a resume condition
and completion callback by default. In v0.6 an independent caller or CLI
workflow can explicitly select bounded `caller-poll` in its trusted provider
configuration. The original interval/deadline is persisted before execution;
the caller owns scheduling and reconciles that same ID. No Twin connection or
automatic timer is added. See [the waiting contract](PROVIDERS.md#explicit-caller-owned-polling-v06);
callback failures never silently become polling, and an expired deadline does
not cancel native work or authorize replay.

`status: "finished"` means this operation returned, not that it passed or that
the caller's task is complete. Inspect `receipt.outcome`, reason and artifacts.
Nonpass does not automatically start cleanup, source work or another stage.
The caller decides the next authorized action.

## Full workflow and compatibility

The full workflow calls the same `invokeCapability` implementation and then
applies its own phase, baseline, affinity, review and cleanup gates. It does not
maintain another implementation of the capability.

The older create/status/execute/reconcile APIs remain for explicit full-workflow
clients; small-plugin entry skills use independent operations instead. Do not
use those legacy workflow APIs as prerequisites for a standalone capability.

Generic full workflows configure `source` and `review` connections.
`workflowProfile: "agentow-odsp"` instead selects the `agentow` connection and
retains its exclusive Codespace, entrypoint, effective-model and freshness
requirements. It is explicit, not inferred or installed by default.

Version 0.4 does not migrate active version-0.3 journals or installed workers.
Keep active tasks pinned until a separately qualified cutover.
