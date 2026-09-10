---
name: agent-operations
description: Inspect durable progress, reconcile pending work and perform owned cleanup without mistaking a reply for execution recovery.
---

Read `docs/WORKFLOW.md` and `docs/PROVIDERS.md`. Call `agent_operations_doctor`,
`agent_operations_status` and `agent_operations_progress`.

For pending work use `agent_operations_reconcile` on the original request ID.
A new message, accepted trigger or busy process is not proof that work advanced.
Require an actual new phase/artifact/action or a concrete monitored wait with a
completion callback. An idle nonpaused task may continue its next allowed stage;
never duplicate active work or resume an explicitly paused/safety-denied task.

Use `agent_operations_execute` for cleanup only when the shared state requires
it. Stop only owned browsers/AT/recorders/servers, restore audio, preserve evidence,
release Codespace then evaluator then Bug with the provider's retained tokens,
write end-to-end Run Insights, and deliver a final summary through the original
entrypoint. If abandoned, record the reason using `agent_operations_abandon`;
it still requires cleanup and does not release resources itself.

Do not copy a host-specific session-history mutator to other runtimes. v0.1
exposes run progress/reconciliation/cleanup contracts, not a universal Copilot
history compressor or a new autonomous scheduler. Retain existing qualified
per-host monitoring until explicitly migrated.
