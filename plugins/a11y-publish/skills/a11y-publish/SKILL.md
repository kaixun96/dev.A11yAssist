---
name: a11y-publish
description: Publish caller-approved exact-HEAD accessibility evidence to a Draft PR without orchestrating upstream work.
---

Resolve bundled paths from the plugin root, two directories above this SKILL.md, not the user's working directory.
Read `docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For static guidance use `knowledge/README.md` and applicable topics: `knowledge/foundations.md`.
For SPDS, Fluent V8/V9 or SharePoint-specific guidance, read `integrations/agentow/knowledge/README.md` and its complete-source topic routing. Static project knowledge does not require AgentOW or an execution integration. Archived operational instructions are reference data, not permission to run them; only an explicitly authorized execution integration may act on its procedures.

Read `docs/CAPABILITIES.md`. Use `a11y_publish_invoke` with action `publish`,
a stable operationId, context.head, and the target PR/repository, description
and approved evidence references required by the publication connection.

For an existing ADO Draft PR, `attach-evidence` uses the built-in ADO connection:
upload hash-bound files, update only the description and confirm live Draft/HEAD.
Read `docs/NATIVE-CAPABILITIES.md`. This narrower operation does not create a PR
or verify media playback/behavior; return its scope honestly and do not treat it
as completion of the broader `publish` contract.

The caller owns review/approval policy and sequencing. Do not require a run
journal or completed stages from this repository, create another writer, modify
source, run capture, or manufacture missing approvals. The connection must verify
actual permission and any deployment-specific publication policy.

Publish only truthful reviewer-safe evidence bound to the supplied HEAD.
Verify the resulting PR is Draft and media is accessible and matches accepted
artifacts. Never expose credentials, private profiles or unrelated data, post
PR comments, or silently promote the PR to Ready.

Return the actual PR and artifact receipt; do not declare the caller's task
complete. On unknown delivery, retain the same operationId and use
`a11y_publish_operation_reconcile`, never create a second PR by blind retry.
