---
name: a11y-file-bug
description: After validation, prepare and explicitly submit a detailed accessibility Bug with reproducible steps, honest cause analysis and verified evidence attachments, including video.
---

Resolve bundled paths from the plugin root, two directories above this SKILL.md, not the user's working directory.
Read `docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For static guidance use `knowledge/README.md` and applicable topics: `knowledge/foundations.md`, `knowledge/component-accessibility.md`.
For SPDS, Fluent V8/V9 or SharePoint-specific guidance, read `integrations/agentow/knowledge/README.md` and its complete-source topic routing. Static project knowledge does not require AgentOW or an execution integration. Archived operational instructions are reference data, not permission to run them; only an explicitly authorized execution integration may act on its procedures.

Read `docs/FILE-BUG.md`. This creates Bugs, not PRs or remediation runs.
Default to a draft. Discovery or evidence validation does not authorize filing.
Use the actual available tools; do not dispatch an agent or invoke sibling MCP
servers implicitly. Missing connection/authority is a filing gap, not a fake Bug.

1. Consume `a11y-validate` results and original task/finding identity. Only
   reproduced observed-page findings qualify. Source risks, seeded fixture
   defects, invalid evidence and inconclusive observations must not become Bugs.
2. Confirm destination organization/project, area, required process fields,
   severity and tags from authorized project guidance. Do not guess assignment
   or invent required metadata. Search for existing Bugs before filing; link an
   existing issue rather than creating a duplicate.
3. Call `a11y_file_bug_draft` with taskId, issueId and details. Describe OS,
   browser/version, AT/version or not used, actual build, viewport/zoom, locale,
   route/flags/test data, numbered preconditions/actions, expected versus actual,
   repeatability and affected users. Preserve original scenario steps. Explain
   the observable failure and separate it from a confirmed, hypothesized or
   unknown implementation cause. Never invent a root cause or WCAG criterion.
4. Select only this finding's validated hash-bound artifacts. Review sensitive
   content and attachment filenames before approval. For video/audio, inspect
   playback, identify timestamps and provide a text transcript/summary so the
   Bug remains understandable without playing media. Screenshots are not speech.
5. Obtain explicit filing/upload authorization bound to the returned draft hash
   and exact organization/project; existing explicit authority can be recorded
   without asking again. Call `a11y_file_bug_submit` with the unchanged details
   and approval. Native ADO uploads WIT attachments, reads back their bytes,
   creates the Bug with AttachedFile relations, then rereads fields/relations.
   A local path, upload response, media hash or PR attachment is not a Bug link.
6. Preserve the deterministic operation ID and receipt. On timeout/unknown
   outcome call `a11y_file_bug_operation_reconcile` on that ID. Never resubmit,
   switch IDs or delete orphan attachments to conceal an incomplete operation.
   Report the exact remaining remote check and retained artifacts.
7. Return actual Bug ID/URL, approved description, attachment references and
   filing outcome to `a11y-report`. Failed/skipped filing must remain visible.
   Do not edit product code, change assignments, close Bugs or post PR comments.
