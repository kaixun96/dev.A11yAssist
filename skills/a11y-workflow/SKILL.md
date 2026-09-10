---
name: a11y-workflow
description: Optionally compose the shared capabilities into a complete evidence-first accessibility workflow with a caller-selected source and review implementation.
---

This is the complete entrypoint. It includes the shared runtime; sibling small
plugins need not be installed just to run this package. Source and review
connections are selected by the caller; AgentOW is an optional integration.
Other callers may compose small plugins in their own workflow instead.

Read packaged `docs/WORKFLOW.md`, `docs/PROVIDERS.md` and `contracts/workflow.json`.
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
   When `workflowProfile=agentow-odsp` is selected, retain the existing
   AgentOW entrypoint, exclusive Codespace, execution-host freshness and
   effective-model requirements. Never recursively re-enter this workflow.
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
