---
name: a11y-capture
description: Capture a caller-supplied Windows accessibility scenario and recover its owned capture resources without taking over the caller's workflow.
---

Read `docs/CAPABILITIES.md`. Use `a11y_capture_invoke` for the requested `before`
or `after` operation. Supply a stable operationId, context.scenarioHash and
context.evaluator; AFTER also requires context.head. Supply
context.beforeReceiptSha256 when the caller requests a bound comparison.
The input carries the real scenario/request understood by the capture connection.

For raw native observations, read `docs/EXECUTION-ADAPTERS.md` and use the built-in
`windows-at` connection with `observe-at`. It supports actual NVDA Speech Viewer
deltas, Narrator ETW/audio and Voice Access number-overlay command/UIA/audio.
Require original execution ownership and exact already-running process identities.
This narrower action does not implement the full BEFORE/AFTER/discovery verdict:
retain its raw-output scope, independent review and unmapped Voice Access labels.
Never relabel the receipt or replace an active multi-action capture connection.

Do not require this repository's intake stage or create a full workflow run.
The capture connection must verify permission, exclusive ownership of the shared
desktop, installed runtime identity and the capabilities needed by this scenario.
It must collect real evidence, not simulate assistive technology or reuse unrelated
historical media. Preserve the requested scene, build and applicable AT settings.

For every BEFORE or AFTER, require this lifecycle on the actual evaluator:
1. Before triggering capture, run a fresh scenario-scoped environment check:
   ownership, runtime, browser/session/scene and only required AT/audio/recorder
   capabilities. Record the baseline settings and resource identities needed for
   restoration. A prior setup report is not current health; failed preflight means
   no capture. Do not install, restart or broaden prerequisites automatically.
2. Capture the scenario once, preserving its real evidence.
3. After every capture attempt, including failure or interruption, check the
   resulting browser/AT/media state and artifacts against the recorded baseline
   and permitted scenario changes, then complete owned cleanup. Return anomaly,
   cleanup and unresolved-state evidence separately from the product observation.
   If interrupted, reconcile the original effect before any mutating recovery.

A pass requires `capturePreflightVerified` and `capturePostcheckVerified` backed
by the connection's hash-bound diagnostics. Missing postcheck, invalid media,
unresolved owned processes/settings or unknown effects cannot become a pass.
An infrastructure anomaly is not a product finding. Read the exact gate semantics
in `docs/CAPABILITIES.md`; these checks run in the qualified capture connection,
not in the MCP control process or another evaluator.

Return actual artifacts and limitations. A completed capture is not itself a
product PASS. Do not modify source, publish a PR or invoke another stage.
Clean only temporary state owned by this operation according to the connection's
contract; do not release the caller's long-lived resource lease.
The capture connection owns its recording/AT/audio lifecycle. Return actual
cleanup proof and unresolved items, not just successful capture artifacts.
Preserve evidence and borrowed browser sessions; never stop foreign processes.

For explicitly authorized exception recovery, use `a11y_capture_invoke` with
`recover-media` or `recover-nvda`, a stable operationId, context.subject,
context.evaluator and only input.nativeRunId. These use the existing trusted
`operations` provider mapping, not the BEFORE/AFTER `capture` mapping.
No workflow journal or unrelated capture request is required.

`recover-media` covers only the original tracked recorder and default audio
endpoints. `recover-nvda` covers only the originally recorded NVDA main process
and distinguishes stopping now from reading original stop proof. Never supply
a PID, journal path or ownership token. Missing/historical state, busy/incomplete
workers, unrecorded processes and unknown stop results are unsupported, not
permission to adopt a process, take over a worker or retry an effect.
Neither narrow receipt proves full cleanup, artifact preservation, resource
release or product PASS. Do not dispatch evidence capture as recovery transport.

Use `a11y_capture_operation_status` or `_operation_reconcile` for the same
operationId. Never replay a pending request, loosen evidence thresholds or
interfere with another worker's browser/AT.
Use the same operation's status/reconciliation for recovery too; an explicit pause
or refusal never authorizes another execution. Pre-removal operations remain
pinned to their original plugin/runtime, not rebound to this entrypoint.
