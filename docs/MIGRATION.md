# Migration without breaking the existing workflow

## Current delivery

v0.1 provides the modular marketplace, independently packaged skills/MCP tools,
shared gates and provider contracts. Existing actual A11y automation remains
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
5. **AgentOW bridge**: reuse existing `/agentow-a11y` source implementation and
   actual-host freshness gate. Reject source/PR calls before accepted BEFORE.
6. **Entry adapters**: execute the same fixture serially through Twin+multi,
   CLI+single and CLI+multi. Inject restart, timeout, pending result, duplicate
   delivery, busy resource and configuration/version mismatch.
7. **Cutover**: change old commands to thin wrappers; new runs use the qualified
   provider set. Keep existing runs on their recorded versions until a tested
   state migration preserves run/owner/request/evidence identity.
8. **Authority move**: only after equivalent behavior is proven, move the single
   canonical workflow to this repo and leave a pointer in the old knowledge base.

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
| caller invokes a small plugin early | same executable phase gate rejects |
| cleanup/notification failure | retained state, not completed |
| interrupted storage mutation | preserve lock/journal; no automatic ownership expiry |
| original worker only replies | no false claim of execution recovery |

The unit/provider-fixture tests in this repo cover core mechanics, not actual
NVDA speech, Dev Center console recovery or production media playback. Report
that distinction accurately in release notes.
