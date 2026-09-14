---
name: a11y-publish
description: Publish caller-approved exact-HEAD accessibility evidence to a Draft PR without orchestrating upstream work.
---

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For shared knowledge read `${PLUGIN_ROOT}/references/README.md` and `${PLUGIN_ROOT}/references/knowledge.json`.
Call a11y_publish_knowledge_list and a11y_publish_knowledge_search(query) to select relevant Common, Fluent and SharePoint IDs for the actual stack/version, then a11y_publish_knowledge_read(id) for full entries with citations and source status.
Knowledge resolves automatically through configured root, validated development layout, verified shared user cache, then pinned HTTPS download. Node.js 22+ and enabled host MCP support are required, but no user configuration or peer plugin is needed. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it.
Unavailable tools or failed knowledge verification are explicit dependency failures. Search snippets are not full rules; pending MAS/product sources remain explicit gaps. Knowledge tasks allow registered read-only knowledge MCP and relevant source/reference reads, never shells, setup helpers, tests, browsers, AT or providers. Knowledge access does not authorize execution or bypass capability/workflow gates.

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. `${PLUGIN_ROOT}` is the host-supplied
top-level installed plugin root, not the working directory.
Use `a11y_publish_invoke` with action `publish`,
a stable operationId, context.head, and the target PR/repository, description
and approved evidence references required by the publication connection.

For an existing ADO Draft PR, `attach-evidence` uses the built-in ADO connection:
upload hash-bound files, update only the description and confirm live Draft/HEAD.
Read `${PLUGIN_ROOT}/docs/NATIVE-CAPABILITIES.md`. This narrower operation does not create a PR
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
