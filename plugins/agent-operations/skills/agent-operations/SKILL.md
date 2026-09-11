---
name: agent-operations
description: Perform explicitly scoped owned cleanup for the caller, with durable operation identity and reconciliation.
---

Read `${CLAUDE_PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For static guidance use `knowledge/README.md` and applicable topics: `knowledge/foundations.md`.
Only when the caller selects the applicable execution integration, consult `integrations/agentow/knowledge/README.md` and its topic routing. Do not load that profile as a generic prerequisite.

Read `docs/CAPABILITIES.md`. Use `agent_operations_invoke` with action `cleanup`,
a stable operationId, context.subject and the owned resource/process scope
required by the cleanup connection. No full workflow journal is required.

For only the original tracked recorder and default audio endpoints, use action
`recover-media` with context.subject, context.evaluator and only input.nativeRunId.
It needs its own authorized media connection; missing/historical state is not
successful recovery. Its limited receipt never establishes full cleanup,
artifact preservation, AT shutdown or permission to release resources.

Clean only the resources explicitly included and authorized for this operation.
Preserve evidence and restore owned temporary settings where applicable.
Do not infer permission to release all resources associated with a person or
machine. Shared resource release still requires the original ownership token.
Never delete another session's history or restart shared workers.

Return the actual cleanup receipt and unresolved items. Do not decide that the
caller's full task is complete or start another task. Use
`agent_operations_operation_status` / `_operation_reconcile` for this operation.

The legacy progress/abandon/reconcile tools concern the optional full workflow
only. A message, busy process or accepted trigger is not proof of work completed.
Explicit pauses and safety refusals are not permission for an execution retry.
