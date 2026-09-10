# Migration without breaking the existing workflow

## Current delivery

v0.7 adds explicit root-confined local evidence artifact hashing to the read-only
checker. It reuses the existing receipt artifact verifier and a single-read
evidence-v1 document loader; both small and complete packages call the same code.
Default structural-only calls and the exported validator CLI retain their
behavior. Both baseline and current artifacts are required in opt-in verify mode.
This is not real AT, protected-runtime qualification, independent media/behavior
acceptance, resource release or a live cutover.

v0.6 adds explicit bounded caller-owned polling to the shared capability and
optional CLI-workflow protocol. Provider configuration, original request and
absolute deadline remain bound across restart. Default/Twin callbacks do not
change. This release does not qualify a live recorder, install a caller scheduler
or switch existing pinned AgentOW/native consumers whose exported implementations
are unchanged. Real provider polling support still requires its own integration.

v0.5 moves public Windows host setup, the retained AgentOW personal-browser
profile, PR attachment execution and description budgeting into canonical shared
sources. Native ADO `read-item` and `attach-evidence` are independently executable
through configured authentication. Their narrower receipts do not satisfy
the complete intake/publication stage contracts. See `NATIVE-CAPABILITIES.md`.
Actual AT, resource recovery/release and independent behavior/media providers
still require the deployment qualification below.

v0.4 provides independent capability operations, a provider-free evidence-v1
structural checker and an optional workflow that calls the same capabilities.
Generic source/review connections do not require AgentOW; the explicit
`agentow-odsp` profile preserves existing deployment policy. Existing actual A11y automation remains
the production authority until each provider passes its qualification.

No installed production plugin is replaced, no existing session is rebound,
no task is duplicated, and no evaluator/Codespace is acquired by repository
creation or installation.

## Incremental plan

1. **Contract baseline**: compare every current phase start/stop/exit gate against
   workflow.json. Retain the stricter no-BEFORE/no-PR rule over AgentOW's optional
   unverified PR path. Resolve discrepancies before live execution.
2. **Resource adapter**: wrap the existing canonical shared pool, preserving
   original tokens and root identity. Qualify conflict, foreign owner,
   stale heartbeat, delayed task, recovery-vs-execution, cleanup and crash tests.
   Never copy an active registry to create a second ownership authority.
3. **Intake and capture providers**: wrap current scripts without rewriting their
   behavior. Parameterize personal machine/path/tenant assumptions. Validate
   on synthetic test inputs first, then one explicitly scoped real Bug.
4. **Validator and publication providers**: prove same verdict/hash equivalence,
   exact-HEAD invalidation, independent evaluator separation, actual Draft
   status and live media behavior.
5. **AgentOW consumer**: keep its orchestration, consume shared capabilities
   through MCP or pinned generated runtime exports, and retain the actual-host
   freshness gate. Do not force its entrypoint through another full workflow.
6. **Entry adapters**: execute the same fixture serially through Twin+multi,
   CLI+single and CLI+multi. Inject restart, timeout, pending result, duplicate
   delivery, busy resource and configuration/version mismatch.
7. **Cutover**: change duplicate capability implementations to thin consumers; new runs use the qualified
   provider set. Keep existing runs on their recorded versions until a tested
   state migration preserves run/owner/request/evidence identity.
8. **Capability authority move**: only after equivalent behavior is proven,
   maintain one implementation per shared capability here. Different caller
   workflows may coexist; the complete A11y Assist workflow remains optional.

## Required qualification matrix

| Case | Expected behavior |
|---|---|
| missing capability/config | explicit setup blocker, zero live mutation |
| second session owns Bug/machine | queued/conflict, no steal |
| pending provider timeout | same request reconciled, no second execution |
| BEFORE nonpass | cleanup/no source/no PR |
| changed scenario/evaluator/HEAD | rejection, evidence rerun |
| review changes | full source/AFTER/validate/review loop |
| partial or external artifact | hash/path failure, no phase advancement |
| stale runtime or model mismatch | freshness failure, no silent fallback |
| caller invokes a small plugin independently | local inputs/permission/evidence gates apply; no unrelated prior-stage requirement |
| caller invokes a full-workflow stage early | the workflow's phase gate rejects |
| cleanup/notification failure | retained state, not completed |
| interrupted storage mutation | preserve lock/journal; no automatic ownership expiry |
| original worker only replies | no false claim of execution recovery |

The unit/provider-fixture tests in this repo cover core mechanics, not actual
NVDA speech, Dev Center console recovery or production media playback. Report
that distinction accurately in release notes.
