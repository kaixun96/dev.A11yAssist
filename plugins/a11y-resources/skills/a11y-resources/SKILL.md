---
name: a11y-resources
description: Inspect resource health or explicitly release one completed evaluator assignment through its authoritative owner-bound connection.
---

Resolve bundled paths from the plugin root, two directories above this SKILL.md, not the user's working directory.
Read `docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For static guidance use `knowledge/README.md` and applicable topics: `knowledge/foundations.md`.
For SPDS, Fluent V8/V9 or SharePoint-specific guidance, read `integrations/agentow/knowledge/README.md` and its complete-source topic routing. Static project knowledge does not require AgentOW or an execution integration. Archived operational instructions are reference data, not permission to run them; only an explicitly authorized execution integration may act on its procedures.

Read `docs/CAPABILITIES.md`. Call `a11y_resources_resources` for the configured
resource connection's public status. No full workflow run or prior stage is
required. `a11y_resources_doctor` inspects configuration, not live AT readiness.

Distinguish available, occupied and unhealthy resources. A running process,
powered-on machine or configured executable is not evidence of authenticated
interactive readiness. Use the existing authoritative registry; never create
another registry or infer ownership from process presence.

For explicit completed-assignment release, call `a11y_resources_invoke` with
action `release-evaluator`, a stable `operationId`, context `subject`/`evaluator`,
and only `input.nativeRunId` (32 lowercase hex characters). The configured
connection must authorize that exact assignment and keep its token private.
Reconcile unknown responses using the same operation; never execute again or
substitute another ID. A release PASS covers only that completed assignment,
not process shutdown, audio restoration, other releases or full cleanup.
Perform the caller's required actual cleanup and ordering before requesting it.

Return public resource IDs, health, ownership and limitations. The caller decides
what follows. This capability does not acquire, force-release, auto-expire,
change affinity, recover a machine or start another workflow. Keep lease tokens
and credentials private to the authorized connection.
