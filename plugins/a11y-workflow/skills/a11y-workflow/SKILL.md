---
name: a11y-workflow
description: Orchestrate the complete evidence-first accessibility workflow across configured Windows DevBoxes and AgentOW without weakening stage gates.
---

Read `${CLAUDE_PLUGIN_ROOT}/knowledge/README.md` for static guidance: `knowledge/foundations.md`, `knowledge/component-accessibility.md`, `knowledge/keyboard-focus.md`, `knowledge/forms-and-content.md`, `knowledge/dynamic-content.md`, `knowledge/visual-accessibility.md`.
For this execution integration, also read `${CLAUDE_PLUGIN_ROOT}/integrations/agentow/knowledge/README.md` and the applicable complete topics: `integrations/agentow/knowledge/foundations.md`, `integrations/agentow/knowledge/component-accessibility.md`, `integrations/agentow/knowledge/evidence-contract.md`, `integrations/agentow/knowledge/windows-host-testing.md`, `integrations/agentow/knowledge/pr-evidence-capture-guide.md`, `integrations/agentow/knowledge/personal-evaluator-browser.md`. Static guidance does not replace authorized execution; integration references never override this workflow's stricter gates.

This is the complete entrypoint. It includes the shared runtime; sibling small
plugins need not be installed just to run this package. AgentOW remains an
external plugin dependency, installed separately by the documented installer.

Read packaged `docs/WORKFLOW.md`, `docs/PROVIDERS.md` and `contracts/workflow.json`.
Call `a11y_workflow_doctor`. Missing providers mean incomplete environment setup,
not permission to run a mock or copy someone else's private infrastructure.

1. Identify exact Bug and original run. `a11y_workflow_create` creates a journal,
   not ownership; intake provider must atomically claim and inspect current
   comments/attachments before accepting a canonical scenario.
2. Inspect `a11y_workflow_status`, then call `a11y_workflow_execute` ONLY for its
   returned nextStage. Do not skip stages using another small plugin.
3. BEFORE must establish reproduced+PASS using real AT and independent decisions.
   No source branch or PR without that. Source provider uses the existing
   `/agentow-a11y` in an exclusively leased allowed Codespace, verifies freshness
   on that host and effective GPT-6 Astra, and binds changed resources to HEAD.
4. AFTER uses the same scenario/evaluator and accepted BEFORE hash. Validate,
   review, and if changes are requested repeat source->AFTER->validate->review.
5. Publish only actual reviewed HEAD to a verified Draft PR with live media
   evidence. Reject downstream unverified-PR fallback and never post PR comments.
6. Cleanup all owned resources in canonical order, seal insights and deliver the
   original owner's final summary. Nonpass/abandoned runs also require cleanup.

When a provider is pending or times out, persist the request and call
`a11y_workflow_reconcile`; never start a second implementation. Long tasks use
the provider's detached executor, actual callback and durable progress. If no
next safe action is available, surface exact blocker and resume condition.
Do not restart shared Copilot, impersonate an owner, release a foreign lease,
or delete history/change accounts to evade service safety controls.
