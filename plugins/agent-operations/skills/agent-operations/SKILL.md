---
name: agent-operations
description: Perform explicitly scoped owned cleanup for the caller, with durable operation identity and reconciliation.
---

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For shared knowledge read `${PLUGIN_ROOT}/references/README.md` and `${PLUGIN_ROOT}/references/knowledge.json`.
Call agent_operations_knowledge_list and agent_operations_knowledge_search(query) to select relevant Common, Fluent and SharePoint IDs for the actual stack/version, then agent_operations_knowledge_read(id) for full entries with citations and source status.
Knowledge resolves automatically through configured root, validated development layout, verified shared user cache, then pinned HTTPS download. Node.js 22+ and enabled host MCP support are required, but no user configuration or peer plugin is needed. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it.
Unavailable tools or failed knowledge verification are explicit dependency failures. Search snippets are not full rules; pending MAS/product sources remain explicit gaps. Knowledge tasks allow registered read-only knowledge MCP and relevant source/reference reads, never shells, setup helpers, tests, browsers, AT or providers. Knowledge access does not authorize execution or bypass capability/workflow gates.

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. `${PLUGIN_ROOT}` is the host-supplied
top-level installed plugin root, not the working directory.
Use `agent_operations_invoke` with action `cleanup`,
a stable operationId, context.subject and the owned resource/process scope
required by the cleanup connection. No full workflow journal is required.

For only the original tracked recorder and default audio endpoints, use action
`recover-media` with context.subject, context.evaluator and only input.nativeRunId.
It needs its own authorized media connection; missing/historical state is not
successful recovery. Its limited receipt never establishes full cleanup,
artifact preservation, AT shutdown or permission to release resources.

For only the originally recorded NVDA main process, use `recover-nvda` with the
same subject/evaluator/nativeRunId input shape and its explicitly authorized
connection. Never supply a PID or journal path. The result distinguishes a new
stop from reading original stop proof; neither proves full cleanup. Missing
binding, busy/incomplete workers and unknown stop results are unsupported, not
permission to adopt a process, take over the worker or retry an effect.

Clean only the resources explicitly included and authorized for this operation.
Preserve evidence and restore owned temporary settings where applicable.
Do not infer permission to release all resources associated with a person or
machine. Shared resource release still requires the original ownership token.
Never delete another session's history or restart shared workers.

Return the actual cleanup receipt and unresolved items. Do not decide that the
caller's full task is complete or start another task. Use
`agent_operations_operation_status` / `_operation_reconcile` for this operation.

The current progress/abandon/reconcile tools concern the optional full workflow
only. A message, busy process or accepted trigger is not proof of work completed.
Explicit pauses and safety refusals are not permission for an execution retry.
