# Trusted provider protocol and migration boundary

## What is executable today

Version 0.5 additionally ships native ADO work-item/discussion retrieval and
Draft PR evidence upload/description update. These use `kind: "ado"` connections
instead of external executables. See [native capabilities](NATIVE-CAPABILITIES.md)
for the exact narrower actions, authentication and non-verification boundaries.

The packages contain actual MCP tools, independent capability operations, an
optional persistent workflow state machine,
stage gates, artifact hashing, version/owner fencing, bounded subprocess RPC,
request reconciliation, progress assessment, packaging checks and tests.

They do **not** contain a generic live Dev Center recovery driver, AT recorder,
ADO credential broker or a new AgentOW implementation. Those remain the existing
deployment's trusted programs until migrated/qualified. Missing configuration
fails explicitly; `doctor` never reports configuration as live readiness.

This boundary is intentional: publishing private scripts wholesale would leak
personal infrastructure assumptions and could establish a second unsafe pool.
Installing the full workflow is not yet proof that a fresh user's environment
can autonomously complete a real A11y Bug.

## Configuration

Independent operations use `config/example.capability.json`: only owner,
stateRoot and the needed provider mapping are required. The full workflow
additionally requires its supported mode and host configuration. No global run
or prior stage is required for a standalone invocation.

Set the absolute environment variable `A11Y_ASSIST_CONFIG` before starting
Copilot. Use `config/example.cli.json` or `config/example.twin.json` as a template
in a private path, never commit a filled-in configuration.

Providers are configured by the operator, not supplied as shell text in a tool
argument. Each provider names an absolute executable, fixed argument array,
executable SHA-256 and RPC timeout. Arguments are passed without a shell.
The executable hash is a change detector, not an attestation of interpreter
script arguments or their whole dependency tree; operators must deploy those
immutably and verify them independently.

Use normal host-managed authentication. No passwords, cookies, copied browser
databases or bearer tokens in config, prompts, provider stdout or run receipts.

## Request

One JSON object on stdin, one JSON response on stdout. Use stderr for private
bounded diagnostics; core only reports the byte count, not raw diagnostic data.

```json
{
  "schemaVersion": 1,
  "version": "0.4.0",
  "operation": "execute",
  "requestId": "<stable-uuid>",
  "stage": "before",
  "run": {
    "runId": "<run-id>",
    "bug": "<exact-bug>",
    "owner": "<configured-owner>",
    "scenarioHash": "<sha256>",
    "evaluator": null,
    "head": null
  },
  "stateDirectory": "<private-run-directory>",
  "input": {}
}
```

`operation: reconcile` uses the SAME request ID. Do not treat it as execute.
Long-lived work must live in a provider-owned detached executor with durable
progress, not in the short-lived RPC process. A completion callback remains
required unless the caller explicitly selects the polling contract below.

Independent requests include `invocation: "capability"`. Their `run` object is
only the transport identity/context envelope: `runId` is the caller's operation
ID, `subject` is an optional caller reference, and `receipts` is empty. It is
not a workflow journal and has no prior-stage requirement. Write artifacts
under the supplied private `stateDirectory`. Do not look up `runs/<runId>`.

## Response

Echo `schemaVersion`, `requestId`, `runId`, `owner` at top level.

- `state: pending` additionally requires `resumeCondition`, `progressPath` and
  `completionCallback` by default. These must identify real deployed monitoring,
  not prose saying that monitoring is planned. Explicit caller polling replaces
  only the callback, not durable progress or native executor supervision.
- `state: finished` requires a `receipt` with the same identity, `stage`, outcome
  and directory-relative artifacts with SHA-256. A pass must include its local
  capability gates from `contracts/capabilities.json` and echo the supplied
  subject/scenario/evaluator/HEAD/baseline bindings. Workflow requests additionally
  require their stage gates from `workflow.json` and `WORKFLOW.md`.

The provider is the trusted evidence authority; the model cannot submit a
fabricated receipt directly to advance the runtime. Boolean gates are not
cryptographic proof of product behavior: providers must bind their determinations
to authenticated native results, independent evaluator receipts and artifacts.
The core checks the shape, provenance identity, hashes and phase consistency;
provider qualification supplies the underlying behavior correctness.

Nonpass receipt outcomes require a reason and artifacts; `not-reproduced`,
`blocked`, `inconclusive`, `invalid-evidence`, `abandoned` are returned to the
independent caller without choosing another operation. In the optional full
workflow they lead to cleanup. `changes-requested` is allowed only from
review/validate; the full workflow uses it to reopen source.

For source pass provide exact 40-character `head`, matching scenario/evaluator
and `prCreated: false`. Only the explicit `agentow-odsp` profile also requires
`/agentow-a11y`, `model: gpt-6-astra` and its Codespace/freshness gates.
For full-workflow AFTER provide the accepted BEFORE receipt SHA from run.receipts.
For independent AFTER echo context.beforeReceiptSha256 when supplied.
Publish pass requires `pr: { url: "https://...", isDraft: true }`.

## Explicit caller-owned polling (v0.6)

For an independent caller or `mode: "cli"`, a trusted executable provider may
opt in through its private configuration:

```json
"waiting": {
  "mode": "caller-poll",
  "pollIntervalSeconds": 30,
  "timeoutSeconds": 3600
}
```

This is a field on the provider mapping, not model-supplied input. Omit it (or
use `{"mode":"callback"}`) to retain the existing callback contract. Twin mode
requires callbacks; the native ADO connection does not negotiate this protocol.
The poll interval must be 1-3600 seconds; the waiting budget must cover one
interval and be no greater than 86400 seconds.

Before execution, the runtime durably binds `waiting` to the original request:

```json
"waiting": {
  "mode": "caller-poll",
  "pollIntervalSeconds": 30,
  "deadlineAt": "<absolute UTC ISO8601 timestamp>"
}
```

Every pending response must echo this exact object, include a real `progressPath`
and `resumeCondition`, and omit `completionCallback`. The provider must explicitly
support polling; a missing/mismatched echo is an error, not negotiated fallback.
Changing provider policy during a pending operation is rejected. Reconciliation
preserves the original request ID and absolute deadline across process restarts.
Callback failure never silently switches to polling, and polling never advertises
a fictitious callback.

The caller must persist and run its own bounded scheduler/watch loop; the plugin
does not install a timer or a Twin connection. After each interval, call
`operation-reconcile` with the SAME operation ID (or `reconcile` for a workflow).
`operation-status` only reads the local journal; it does not poll the provider.
The original descriptor is visible in operation status even after an unknown
RPC result; workflow status includes it under `pending.waiting`. Workflow
`progress` reports the appropriate interval/deadline action.

At the original deadline, another pending response is an explicit unknown-outcome
error. Preserve the request and stop the regular waiting loop; do not cancel,
release, infer failure, create a fresh ID or execute again. A separately authorized
read-only reconciliation can still recover the original finished receipt after
the deadline. This deadline bounds caller waiting, not native execution; providers
must independently enforce their actual execution and cleanup budgets.

## Provider responsibility mapping

`recover-nvda` connects only the original recorded NVDA main process. Its receipt
binds subject/evaluator/input.nativeRunId, scope `started-main-process`,
`fullCleanupVerified: false`, and `startedProcessExitVerified`. Report the actual
`processResult` (`terminated` or `observed-exited`) and `recoveryBasis`
(`stopped-now` or `original-stop-result`); reading prior stop proof is not a new
stop. Preserve the original native response before acknowledging success.
Ownership, source and original execution identity belong to the protected
connection, not caller-supplied process targets. Missing original binding,
uncompleted/busy assignments and unknown stop results cannot authorize adoption,
worker takeover or execution replay. The original completed-assignment guard and
native controller are reused; this action is not a new resource allocator or
general cleanup implementation. Reconciliation observes the existing operation
result only, without another native invocation.

`recover-media` is a narrow operations action, not the workflow cleanup stage.
Successful receipts must match subject/evaluator/input.nativeRunId and scope
`tracked-recorder-and-default-audio-endpoints`, set `fullCleanupVerified: false`,
and prove `trackedRecorderExitVerified` and `defaultEndpointsVerified`.
`recorderResult` must be `terminated` or `observed-exited`. Nonpass receipts also
retain exact assignment/scope and require a reason. Persist the original native
response before acknowledging completion; reconciliation must never repeat the
native effect, reconstruct missing proof from absent state, or release resources.
The original media credential belongs in the protected connection, not argv,
public configuration, operation inputs or output.

| Provider | Existing capability to wrap/qualify |
|---|---|
| intake | Authorized item/comment/attachment intake; claim only when the caller's deployment policy requires it |
| resources | authoritative evaluator/Codespace/recovery registries; status exposes public fields only |
| capture | validated worker requests, deployed hash checks, real Windows AT and evidence artifacts |
| validate | deterministic validator and independent accessibility evaluator |
| agentow | Copilot AgentOW in the leased Codespace, freshness and exact-HEAD handoff |
| source / review | Generic caller-selected source implementation and independent code review |
| publish | actual ADO Draft PR operations, evidence upload and live media checks; no comments |
| operations | cleanup/release, insights, original-entrypoint notification and continuation watchers |

In the full workflow, resource mutations belong inside the stage provider that owns their timing
(intake claims, BEFORE evaluator acquisition, source Codespace acquisition,
cleanup token-bound release). The standalone resources plugin exposes status
and ownership diagnosis plus explicit `release-evaluator` for one exact completed
native assignment. It does not acquire resources. That release must use the
original authority's token/lock/completion validation with durable no-replay
intent and same-request reconciliation; tokens stay inside the trusted connection.
A missing lease or historical audit alone is not a successful receipt.
This narrow result is not complete cleanup or permission to skip other gates. Independent
cleanup follows only the caller's explicitly authorized owned scope. No capability
automatically takes over the caller's workflow or changes another operation.

## Entry adapters

`adapters/cli.mjs` renders progress and declares detached-executor requirements.
The terminal can exit after a pending receipt; reopen the same operation/run and
reconcile. In caller-poll mode the caller's scheduler must survive that terminal.
`adapters/twin.mjs` offers scoped system notifications through the actual
runtime.json endpoint. It checks exact enabled conversation identity, never
uses sendAsUserId, resets a binding or disguises the event as the owner.
Persist notification intent before calling it and reconcile ambiguous sends.
`checkTwinDestination` performs the same read-only destination check without
posting a notification. Use it before advertising callback readiness; its
`ready` result is not proof of original-worker execution or continued future
availability. `notifyTwin` repeats the check at delivery time.

Neither adapter owns the resource pool. Both use the same provider and run
identity. Normal responses use the host's own UI; a notification is never proof
that the worker resumed.
