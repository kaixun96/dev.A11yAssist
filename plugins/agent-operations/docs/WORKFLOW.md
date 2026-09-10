# Evidence-first workflow contract

Version: 0.6.0. This is the OPTIONAL full-workflow contract, not a prerequisite
for small capabilities. See `CAPABILITIES.md` for caller-owned composition.
During migration the
existing deployment's canonical execution contract remains authoritative;
do not silently change running tasks to this runtime or create a second claim.

## Supported hosts

Only Twinbot with multiple Windows DevBoxes, or Copilot CLI with one/multiple
Windows DevBoxes. DevBox fleet size does not change any gate. Linux-only,
no-DevBox, synthetic AT, and another agent's history mutation are out of scope.
The control plane never performs actual AT on behalf of a remote leased desktop.
For odsp-web, all source changes/builds/commits/PR source operations remain in
an allowed exclusively leased Codespace, not the control DevBox.

## Stages and authority

The executable gate list is `contracts/workflow.json`.

| Stage | Required behavior |
|---|---|
| intake (0-1) | Atomically claim the exact Bug; inspect complete comments then attachments; define acceptance and seal scenario. No branch, evaluator or Codespace acquired early. |
| before (2) | Validated request, healthy exclusive evaluator, real required AT, stable canonical fixture and preserved evidence. Deterministic validation plus independent evaluator must establish reproduced+PASS. |
| source (3-5) | Caller-selected source connection, owned worktree and verified executor. Minimal implementation, targeted validation, exact HEAD and loaded affected resource. No PR yet. The explicit `agentow-odsp` profile additionally enforces its Codespace, AgentOW entrypoint, model and freshness contract. |
| after (6) | Same evaluator/scenario/viewport/fixture/AT; fresh real evidence bound to actual HEAD and accepted BEFORE receipt hash. |
| validate (7) | Independent deterministic integrity and accessibility behavior decisions. Neither substitutes for the other. |
| review (8) | Actual-HEAD adversarial review; important findings reopen source, invalidate old AFTER and force full AFTER/validate/review again. |
| publish (9) | Push only reviewed HEAD, actual Draft PR, self-contained reviewer-safe description, live media playback/hash verification. No PR comments. |
| cleanup (10) | Stop owned AT/browser/recorders, restore audio, close debug ports, preserve artifacts, release source worktree then evaluator then work-item claim with the applicable ownership proof, write insights and deliver owner summary. The AgentOW profile also requires token-bound Codespace release. |

`changes-requested` from review or validation returns to source. Other non-pass
outcomes enter needs-cleanup; none can proceed to source or publication.
There is no unverified-PR fallback even if a downstream AgentOW version supports
one. The workflow APIs enforce this order against the shared run. Independent
capability APIs enforce their own local contracts without this phase ordering;
callers using the full workflow must not bypass its policy with an unrelated operation.

## Ownership and recovery

The authoritative resource provider must use one shared claim/lease registry
for all entrypoints. A local journal is NOT a Bug claim. No force-release,
automatic expiry, copied token, moved affinity, broad process kill, environment
deletion or second run used to bypass an occupied resource.

Providers hold acquisition tokens privately and return public opaque handles/
identity evidence only. BEFORE/AFTER remain on the same evaluator. A recovery
lease never grants permission to execute product evidence.

Authentication password/MFA/consent or service safety rejections are explicit
blockers. Do not change accounts/models, delete context or repeatedly replay a
rejected operation to evade a gate. Safe independent diagnostics can continue
only within their original authorization.

## Durable state

Each run has `run.json`, immutable accepted `receipts/`, and run-relative evidence
files. Before calling a provider, persist its exact request ID as submitted-
unknown. Timeout or an invalid response retains that identity; only reconcile
is permitted next. A provider must make execute idempotent by request ID and
make reconcile observe the existing action, not start another one.

For CLI, explicitly configured caller polling uses the same shared pending
contract as independent capabilities. Persist its absolute deadline before the
first RPC; never refresh it on reconcile. The caller owns a bounded scheduler.
Default/Twin callbacks remain required. Expiry preserves unknown execution and
all resource ownership; it does not advance to cleanup or authorize replay.
See `PROVIDERS.md` for the negotiated request/response and late reconciliation.

A mutation.lock serializes cross-plugin writes on shared storage. A process crash
may leave this lock: do not auto-expire it. An operator must verify the holder
and journal before any manual reconciliation. Shared storage must provide atomic
exclusive creation and same-directory atomic rename; unsupported mounts fail
qualification and must not be used as coordination authority.

Do not report completed until cleanup gates and actual summary delivery pass.
A worker reply, running process, prepared candidate or accepted trigger alone is
not proof of task progress or execution recovery.

## Compatibility and rollout

Existing runs are NOT migrated automatically. Existing script providers
must be qualified against contract tests before production use. Keep old command
entrypoints as wrappers during rollout, never execute both implementations on
one Bug to compare side effects.

When the AgentOW integration is explicitly selected, retain its execution-host freshness gate:
fetch upstream, verify marketplace and installed plugin commit/version, restart
if required, then re-read installed state. Record effective versions in receipts.
Within evidence stages record the actual version and hashes. Any upgrade that
changes capture semantics invalidates affected evidence until rerun.

This repository's release.json pins its packaged code and contracts. A package
update with incompatible run version fails closed; no active run is silently
upgraded or rewritten.
