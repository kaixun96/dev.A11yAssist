---
name: a11y-workflow
description: Optionally compose the shared capabilities into a complete evidence-first accessibility workflow with a caller-selected source and review implementation.
---

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For shared knowledge read `${PLUGIN_ROOT}/references/README.md` and `${PLUGIN_ROOT}/references/knowledge.json`.
Call a11y_workflow_knowledge_list and a11y_workflow_knowledge_search(query) to select relevant Common, Fluent and SharePoint IDs for the actual stack/version, then a11y_workflow_knowledge_read(id) for full entries with citations and source status.
Knowledge resolves automatically through configured root, validated development layout, verified shared user cache, then pinned HTTPS download. Node.js 22+ and enabled host MCP support are required, but no user configuration or peer plugin is needed. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it.
Unavailable tools or failed knowledge verification are explicit dependency failures. Search snippets are not full rules; pending MAS/product sources remain explicit gaps. Knowledge tasks allow registered read-only knowledge MCP and relevant source/reference reads, never shells, setup helpers, tests, browsers, AT or providers. Knowledge access does not authorize execution or bypass capability/workflow gates.

This is the complete entrypoint. It includes the shared runtime; sibling small
plugins need not be installed just to run this package. Source and review
connections are selected and configured by the caller.
Other callers may compose small plugins in their own workflow instead.

`${PLUGIN_ROOT}` is the host-supplied top-level installed plugin root, not the
working directory. Read `${PLUGIN_ROOT}/docs/WORKFLOW.md`,
`${PLUGIN_ROOT}/docs/PROVIDERS.md` and `${PLUGIN_ROOT}/contracts/workflow.json`.
Call `a11y_workflow_doctor`. Missing providers mean incomplete environment setup,
not permission to run a mock or copy someone else's private infrastructure.

1. Identify exact Bug and original run. `a11y_workflow_create` creates a journal,
   not ownership; intake provider must atomically claim and inspect current
   comments/attachments before accepting a canonical scenario.
2. Inspect `a11y_workflow_status`, then call `a11y_workflow_execute` ONLY for its
   returned nextStage. Do not skip stages using another small plugin.
3. BEFORE must establish reproduced+PASS using real AT and independent decisions.
   No source branch or PR without that. The source connection must own its
   worktree, verify the executor, and bind changed resources to exact HEAD.
   Never recursively re-enter this workflow from a source operation.
4. AFTER uses the same scenario/evaluator and accepted BEFORE hash. Validate,
   review, and if changes are requested repeat source->AFTER->validate->review.
5. Publish only actual reviewed HEAD to a verified Draft PR with live media
   evidence. Reject downstream unverified-PR fallback and never post PR comments.
6. Cleanup all owned resources in canonical order, seal insights and deliver the
   original owner's final summary. Nonpass/abandoned runs also require cleanup.

When a provider is pending or times out, persist the request and call
`a11y_workflow_reconcile`; never start a second implementation. Long tasks use
the provider's detached executor and durable progress, with an actual callback
by default. Only explicitly configured CLI caller polling substitutes a
caller-owned bounded scheduler; retain the original deadline and never downgrade
a failed callback. Deadline expiry is not cancellation or permission to replay.
If no next safe action is available, surface exact blocker and resume condition.
Do not restart shared Copilot, impersonate an owner, release a foreign lease,
or delete history/change accounts to evade service safety controls.
