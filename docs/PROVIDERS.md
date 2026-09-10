# Trusted provider protocol and migration boundary

## What is executable today

The v0.1 packages contain actual MCP tools, a shared persistent state machine,
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
  "version": "0.1.0",
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
progress and a completion callback, not in the short-lived RPC process.

## Response

Echo `schemaVersion`, `requestId`, `runId`, `owner` at top level.

- `state: pending` additionally requires `resumeCondition`, `progressPath` and
  `completionCallback`. These must identify real deployed monitoring, not prose
  saying that monitoring is planned.
- `state: finished` requires a `receipt` with the same identity, `stage`, outcome
  and run-relative artifacts with SHA-256. A pass must include every stage gate
  as an explicit boolean true and the scenario/HEAD/evaluator binding described
  in `workflow.json` and `WORKFLOW.md`.

The provider is the trusted evidence authority; the model cannot submit a
fabricated receipt directly to advance the runtime. Boolean gates are not
cryptographic proof of product behavior: providers must bind their determinations
to authenticated native results, independent evaluator receipts and artifacts.
The core checks the shape, provenance identity, hashes and phase consistency;
provider qualification supplies the underlying behavior correctness.

Nonpass receipt outcomes require a reason and artifacts; `not-reproduced`,
`blocked`, `inconclusive`, `invalid-evidence`, `abandoned` all lead to cleanup.
`changes-requested` is allowed only from review/validate and reopens source.

For source pass provide `/agentow-a11y`, `model: gpt-6-astra`, exact 40-character
`head`, same `scenarioHash/evaluator`, and `prCreated: false`.
For AFTER pass provide the accepted BEFORE receipt SHA from run.receipts.
Publish pass requires `pr: { url: "https://...", isDraft: true }`.

## Provider responsibility mapping

| Provider | Existing capability to wrap/qualify |
|---|---|
| intake | ADO query/item/comment/attachment intake plus canonical Bug claim |
| resources | authoritative evaluator/Codespace/recovery registries; status exposes public fields only |
| capture | validated worker requests, deployed hash checks, real Windows AT and evidence artifacts |
| validate | deterministic validator and independent accessibility evaluator |
| agentow | Copilot AgentOW in the leased Codespace, freshness and exact-HEAD handoff |
| publish | actual ADO Draft PR operations, evidence upload and live media checks; no comments |
| operations | cleanup/release, insights, original-entrypoint notification and continuation watchers |

Resource mutations belong inside the stage provider that owns their timing
(intake claims, BEFORE evaluator acquisition, source Codespace acquisition,
cleanup token-bound release). The standalone resources plugin exposes status
and ownership diagnosis in v0.1; it does not expose a generic early-acquire
button that would bypass phase ordering.

## Entry adapters

`adapters/cli.mjs` renders progress and declares detached-executor requirements.
The terminal can exit after a pending receipt; reopen the same run and reconcile.
`adapters/twin.mjs` offers scoped system notifications through the actual
runtime.json endpoint. It checks exact enabled conversation identity, never
uses sendAsUserId, resets a binding or disguises the event as the owner.
Persist notification intent before calling it and reconcile ambiguous sends.

Neither adapter owns the resource pool. Both use the same provider and run
identity. Normal responses use the host's own UI; a notification is never proof
that the worker resumed.
