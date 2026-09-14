# Independent capabilities and optional composition

Small plugins do one job inside the caller's workflow. The caller chooses the
order, interprets the result and decides what happens next. They do not require
this repository's intake, a global Bug/run journal or unrelated stages.

`a11y-workflow` is an optional composition, not the parent that every caller must
use. Its stricter phase ordering is local to that workflow.

## Interfaces

| Plugin | Independent tool | Context needed |
|---|---|---|
| a11y-intake | `a11y_intake_invoke`, action `read-item` | `subject`; built-in ADO connection and input.itemId |
| a11y-publish | `a11y_publish_invoke`, action `attach-evidence` | Exact `head`; built-in ADO connection, existing Draft PR and hash-bound files |
| a11y-knowledge | `/a11y-knowledge` | Supplied code/question; source-only guidance |
| a11y-bug-bash | `/a11y-bug-bash` | Feature context and verification steps; separate authorized page and read-only source tracks, no automatic fixes/filing |
| a11y-setup | `/a11y-setup` | Actual Windows host and selected dependencies; check-only by default, preparation separately authorized; no operational MCP |
| a11y-intake | `a11y_intake_invoke`, action `intake` | `subject`: authorized item reference |
| a11y-capture | `a11y_capture_invoke`, action `before` or `after` | `scenarioHash`, `evaluator`; AFTER also `head` |
| a11y-validate | `a11y_validate_evidence` | Version-1 request/result files; verify also needs baseline files and repository root |
| a11y-validate | `a11y_validate_invoke`, action `validate` | `scenarioHash`; include HEAD/baseline binding when requested |
| a11y-publish | `a11y_publish_invoke`, action `publish` | Exact `head` and caller-authorized publication input |
| agent-operations | `agent_operations_invoke`, action `cleanup` | `subject` and explicitly owned cleanup scope |
| agent-operations | `agent_operations_invoke`, action `recover-media` | `subject`, `evaluator`, exact `input.nativeRunId`; authorized original media recovery connection |
| agent-operations | `agent_operations_invoke`, action `recover-nvda` | `subject`, `evaluator`, exact `input.nativeRunId`; authorized original NVDA instance connection |
| a11y-resources | `a11y_resources_resources` | Authorized resource connection; read-only status |
| a11y-resources | `a11y_resources_invoke`, action `release-evaluator` | `subject`, `evaluator`, exact `input.nativeRunId`; explicitly authorized completed assignment |

Execution and knowledge plugins bundle the six portable accessibility topics;
Bug Bash reuses the same topics and unified skill in its internal knowledge module.
Knowledge needs no runtime, MCP, providers, `A11Y_ASSIST_CONFIG` or a peer plugin.
Knowledge and Bug Bash ship no executable runtime or MCP server. Bug Bash page/AT
checks use separately authorized host tools and ownership gates; see the
[Bug Bash contract](https://github.com/kaixun96/dev.A11yAssist/blob/main/docs/BUG-BASH.md).
Setup retains its scoped native Windows script and dependency templates, not an
operational MCP server or a browser/provider runtime. Setup preparation is not a
prerequisite for knowledge and does not establish live capability readiness.

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

## Scoped media recovery (v0.9)

`recover-media` uses the same independent operation journal as other effects.
Supply only `input.nativeRunId` (32 lowercase hex characters), plus the subject
and evaluator. Ownership credentials stay inside the trusted connection, never
in tool inputs or receipts. Configure only the relevant `operations` connection;
no unrelated intake/source/review stages or full workflow run are required.

A successful receipt binds that exact assignment and scope
`tracked-recorder-and-default-audio-endpoints`, with an observed recorder result
(`terminated` or `observed-exited`) and verified default endpoints. It always
sets `fullCleanupVerified: false`. Missing/historical state, an untracked recorder,
or an unverified restoration acknowledgement cannot establish these two gates.
They remain nonpass with a reason and durable diagnostic artifacts.

This is not general `cleanup`, evidence acceptance, all-process/all-audio-role
verification, artifact preservation or resource release. The optional full
package exposes the same operation for composition; its workflow cleanup stage
still requires every original, broader cleanup gate. Do not replace that stage's
receipt with this narrow result or dispatch evidence capture as a cleanup transport.

The connection must bind the actual execution host, original ownership and source,
serialize against competing assignment mutations, and preserve a one-shot intent
and original response. Timeout or a missing response permits read-only
reconciliation only, not another execution. Existing run outcome is unchanged.
Deployment-specific connections and real audio/AT qualification are separate from
the generic package's contract tests.

## Scoped NVDA recovery (v0.10)

Use `agent_operations_invoke` with action `recover-nvda`, an original
`context.subject` and `context.evaluator`, and only `input.nativeRunId`.
Configure the authorized `operations` connection for this scope. Do not supply
a PID, process creation time, private journal path or credential in tool inputs.
The small plugin and optional full package use the same operation implementation;
neither requires a full workflow run or unrelated prior capability calls.

This connects an existing controller, not a replacement NVDA startup/cleanup
engine. The connection must derive the instance from its original protected
worker record and serialize against assignment changes. The supported original
worker connection requires an authoritatively completed, still-owned assignment.
It does not take over a busy or interrupted worker lacking completion, adopt
unrecorded processes, recover captures without an instance record, or
create missing authorization. Those cases remain explicit failures.

A successful receipt has `recoveryScope: "started-main-process"`,
`gates.startedProcessExitVerified: true`, `processResult` of `terminated` or
`observed-exited`, and `fullCleanupVerified: false`. Its `recoveryBasis` is
`stopped-now` for this stop, or `original-stop-result` when the connection only
reads the original persisted stop result. A preexisting stop intent is never
executed again. Missing identity or an intent without a valid result remains
unknown, not evidence that the process exited.

Transport loss permits only reconciliation of the same operation ID and original
persisted response, not another execution or a fresh operation ID. No helper,
descendant, respawn, audio, browser, artifact preservation or resource-release
gate is established. This receipt cannot replace `cleanup` or make a capture
pass. Installation and real AT qualification remain deployment responsibilities;
existing capture defaults do not change.

## Read-only evidence checking

`a11y_validate_evidence` needs no provider configuration or operation journal.
It calls the shared `src/runtime/evidence-v1.mjs` implementation (generated as
`runtime/evidence-v1.mjs` inside execution plugins):

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
The current [evidence-v1 validator](https://github.com/kaixun96/dev.A11yAssist/blob/main/src/runtime/evidence-v1.mjs) defines the accepted
artifact shape and bindings. Full-workflow phase policy is not a prerequisite
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

## Completed evaluator release (v0.8)

`release-evaluator` is narrower than `cleanup`. Supply only `nativeRunId`
(32 lowercase hex characters) in `input`; never send a lease token. A successful
receipt must match that native run, supplied subject/evaluator, original operation
identity, `releaseMode: completed-owned-run`, and the `completedRunMatched` and
`leaseReleased` gates, with hash-verified durable artifacts.

The trusted resource connection must validate original ownership and authenticated
completion and perform the release in the original authority's mutation lock.
It must persist intent before the effect and reconcile only that intent's durable
response. Missing leases, unrelated historical release records, timeouts and
missing responses are not proof this operation succeeded. No execution retry,
force release, alternate identity or fallback to token-only release is allowed.
Existing resource status stays read-only; an unconfigured release fails closed.

Caller-owned sequencing still applies. Actual process/audio/port cleanup and
any required resource-release ordering must precede the call. This receipt
does not satisfy `cleanup`, finish a workflow, release other resources, or prove
assistive-technology/product acceptance. The optional workflow can call the same
small capability at its authorized cleanup step, but must separately establish
every remaining cleanup gate. No automatic phase transition was added.

Private deployment implementations/configuration remain outside this package.
This capability does not rewrite active journals, replace pinned source or update
installed workers.

## Current full workflow and independent capabilities

The full workflow calls the same `invokeCapability` implementation and then
applies its own phase, baseline, affinity, review and cleanup gates. It does not
maintain another implementation of the capability.

The create/status/execute/reconcile/progress/abandon APIs are current full-workflow
interfaces; small-plugin entry skills use independent operations instead. Neither
interface is an alias for the other. Full-workflow APIs are not prerequisites for
a standalone capability.

Full workflows configure `source` and `review` connections directly and preserve
owned worktrees, verified executors, exact-HEAD bindings and all evidence gates.
Keep active tasks on their pinned package and provider versions; an update must
not silently rewrite their journals or change resource ownership.
