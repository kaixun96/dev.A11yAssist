---
name: a11y-publish
description: Publish reviewed exact-HEAD accessibility evidence to a verified Draft PR with live media checks and no PR comments.
---

Read `docs/WORKFLOW.md` and `docs/PROVIDERS.md`. Call `a11y_publish_doctor` and
`a11y_publish_status`; execute only `publish` when the actual current HEAD has
passed AFTER, both evaluators and adversarial review.

The trusted publish provider coordinates with AgentOW: never create competing
PR writers. Supply acceptance, root cause/change, killswitch/rollout context,
validation, BEFORE/AFTER evidence, exact HEAD and honest limitations.

Use reviewer-accessible approved storage. Do not publish private local paths,
personal notes, credentials, transient broken media or unredacted desktop data.
Re-read the current AgentOW evidence-capture guide before formatting attachments.

Verify the actual PR is Draft, images load, required video/audio plays and seeks,
and live attachment hashes match accepted evidence. Preserve evidence ordering.
Never post PR comments or automatically mark Ready for review.

There is NO unverified Draft PR fallback in this workflow, even if a downstream
AgentOW version offers it. On missing gates, fail closed. Reconcile pending
publication rather than blindly retrying a POST and creating a second PR.
