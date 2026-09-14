# Independent capabilities and optional composition

Small plugins do one job inside the caller's workflow. The caller chooses the
order, interprets the result and decides what happens next. They do not require
this repository's intake, a global Bug/run journal, AgentOW or unrelated stages.

`a11y-workflow` is an optional composition, not the parent that every caller must
use. Its stricter phase ordering is local to that workflow.

## Interfaces

Bug Bash additionally composes `discovery-observe` through `a11y-capture`, and
`discovery-cancel`, `discovery-cleanup`, `discovery-deliver` through
Bug Bash's own durable coordinator (not another MCP server or the optional
remediation workflow). These versioned discovery contracts are distinct from
BEFORE/AFTER and PR publication. They require explicitly compatible trusted
connections; see the [executable discovery contract](https://github.com/kaixun96/dev.A11yAssist/blob/main/docs/BUG-BASH-RUNTIME.md).

`a11y_validate_discovery` reads the original private task, verifies its
history/receipts/bytes and category accounting, and separates trusted-provider
behavior assessments from integrity. The same implementation is bundled in
Bug Bash's `validate` command; it never calls another installed MCP server.
Discovery capture v0.8 requires fresh preflight/postcheck artifact references and
independent behavior-assessment gates as well as exact row accounting.

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
| a11y-workflow | `a11y_workflow_invoke`, action `cleanup` | `subject` and explicitly owned cleanup scope; no full workflow run required |
| a11y-capture | `a11y_capture_invoke`, action `recover-media` | `subject`, `evaluator`, exact `input.nativeRunId`; authorized original media recovery connection |
| a11y-capture | `a11y_capture_invoke`, action `recover-nvda` | `subject`, `evaluator`, exact `input.nativeRunId`; authorized original NVDA instance connection |
| a11y-setup | `a11y_setup_resources` | Authorized resource connection; establish original DevBox/setup authority before preparing tools; status is not acquisition |
| a11y-setup | `a11y_setup_invoke`, action `release-evaluator` | `subject`, `evaluator`, exact `input.nativeRunId`; explicitly authorized completed assignment |
| a11y-file-bug | `a11y_file_bug_draft`, `_submit`, `_skip` | Validated original discovery finding, detailed reproduction/cause, reviewed evidence and explicit draft/destination approval; actual Bug/attachment readback |
| a11y-report | `a11y_report_generate`, `_deliver` | Original discovery task, completed or explicitly skipped filing, verified evidence and owned cleanup; immutable aggregate report |

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

## Capture lifecycle (package v0.16, contract v0.7)

Every BEFORE/AFTER connection must implement **fresh preflight -> capture once ->
postcheck and owned cleanup**, on the actual evaluator and within the original
exclusive assignment. Initial `a11y-setup` inventory does not replace per-capture
health. The MCP host validates the returned gates/artifact hashes; it does not
probe a remote desktop itself or supply a new generic capture backend.

| Required pass gate | Evidence the trusted connection must establish |
|---|---|
| `capturePreflightVerified` | Before any capture trigger: current ownership/runtime, expected browser/session/scene, readiness of only required AT/audio/recorder capabilities, and baseline settings plus owned/borrowed resource identities needed for restoration |
| `capturePostcheckVerified` | After the attempt: expected scene changes versus anomalies, readable/complete required media and artifacts, owned recorder/AT lifecycle, restoration of changed temporary settings and preservation of borrowed sessions; no unresolved capture-owned anomaly or unknown effect |

Persist these observations as hash-bound diagnostic artifacts in the same
receipt, separate from product observations. A failed preflight returns an
explicit nonpass without starting capture. Postcheck is required after every
attempt, including failure, cancellation or interruption: preserve the original
error/evidence and report what was checked, restored or remains unknown. On loss
of contact, keep the original operation pending and reconcile it; do not claim
postcheck succeeded, invoke a competing recovery effect or re-trigger capture.
Only after original effect state is resolved may explicitly authorized scoped
recovery run. Recovery does not retroactively make invalid evidence pass.

Missing either gate rejects a pass for independent capture and for the optional
workflow. This enforces receipt acceptance, not the honesty of a provider:
deployment qualification must prove the actual preflight, failure/postcheck and
restoration paths. No automatic install, restart, login bypass or lease release
is authorized by these checks. Browser-only/screenshot checks must not depend on
unneeded NVDA, audio or Voice Access.

## Cleanup ownership

Each capability cleans up the temporary resources/settings it actually created
or changed and returns proof and unresolved items. Capture owns recording/AT/audio
cleanup; browser tools own their created browser resources, not borrowed persistent
contexts or foreign tabs. The caller coordinates order and reports actual results.
Resource release remains with the original authority and original ownership proof.

Bug Bash needs no separate cleanup plugin or full workflow. The optional
`a11y-workflow` owns overall progress, abandonment and cleanup aggregation.
Its standalone `cleanup` operation retains the authorized scoped connection and
narrow gates; its `execute` cleanup stage still requires every workflow gate.
Neither a narrow recovery receipt nor standalone cleanup advances a full run.
Shared operation identity, state and no-replay logic remain internal runtime code.
The `operations` provider key is retained for existing qualified recovery/cleanup
connections; it is not an installed plugin or a new capture provider fallback.

## Scoped media recovery (introduced v0.9)

`a11y_capture_invoke` action `recover-media` uses the same independent operation journal as other effects.
Supply only `input.nativeRunId` (32 lowercase hex characters), plus the subject
and evaluator. Ownership credentials stay inside the trusted connection, never
in tool inputs or receipts. Configure only the relevant `operations` connection;
no unrelated intake/source/review stages or full workflow run are required.

A successful receipt binds that exact assignment and scope
`tracked-recorder-and-default-audio-endpoints`, with an observed recorder result
(`terminated` or `observed-exited`) and verified default endpoints. It always
sets `fullCleanupVerified: false`. Missing/historical state, an untracked recorder,
or a legacy restoration acknowledgement cannot establish these two gates.
They remain nonpass with a reason and durable diagnostic artifacts.

This is not general `cleanup`, evidence acceptance, all-process/all-audio-role
verification, artifact preservation or resource release. The optional full
workflow uses the same internal capability implementation; its workflow cleanup stage
still requires every original, broader cleanup gate. Do not replace that stage's
receipt with this narrow result or dispatch evidence capture as a cleanup transport.

The connection must bind the actual execution host, original ownership and source,
serialize against competing assignment mutations, and preserve a one-shot intent
and original response. Timeout or a missing response permits read-only
reconciliation only, not another execution. Existing run outcome is unchanged.
Deployment-specific connections and real audio/AT qualification are separate from
the generic package's contract tests.

## Scoped NVDA recovery (v0.10)

Use `a11y_capture_invoke` with action `recover-nvda`, an original
`context.subject` and `context.evaluator`, and only `input.nativeRunId`.
Configure the authorized `operations` connection for this scope. Do not supply
a PID, process creation time, private journal path or credential in tool inputs.
The capture plugin uses the shared internal operation implementation;
it requires neither a full workflow run nor unrelated prior capability calls.

This connects an existing controller, not a replacement NVDA startup/cleanup
engine. The connection must derive the instance from its original protected
worker record and serialize against assignment changes. The supported original
worker connection requires an authoritatively completed, still-owned assignment.
It does not take over a busy or interrupted worker lacking completion, adopt
unrecorded processes, recover legacy captures without an instance record, or
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
the original recovery scope does not change.

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
The release capability does not migrate active journals, replace pinned source
or update installed workers. Contract v0.7 adds capture lifecycle gates separately.

## Full workflow and compatibility

Package v0.16 removes the standalone `agent-operations` package and its MCP prefix.
New media/NVDA recovery calls use capture; standalone cleanup and workflow
progress/abandonment use workflow. Do not rename old operation journals or
resubmit unknown effects with new IDs. Keep unfinished operations on their
original pinned package/provider until reconciled and safely closed.
Contract v0.7 rejects older journals rather than silently upgrading their
capture acceptance gates. See [migration](MIGRATION.md).

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
