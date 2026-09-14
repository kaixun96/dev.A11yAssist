---
name: a11y-resources
description: Inspect resource health or explicitly release one completed evaluator assignment through its authoritative owner-bound connection.
---

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For shared knowledge read `${PLUGIN_ROOT}/references/README.md` and `${PLUGIN_ROOT}/references/knowledge.json`.
Call a11y_resources_knowledge_list and a11y_resources_knowledge_search(query) to select relevant Common, Fluent and SharePoint IDs for the actual stack/version, then a11y_resources_knowledge_read(id) for full entries with citations and source status.
Knowledge resolves automatically through configured root, validated development layout, verified shared user cache, then pinned HTTPS download. Node.js 22+ and enabled host MCP support are required, but no user configuration or peer plugin is needed. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it.
Unavailable tools or failed knowledge verification are explicit dependency failures. Search snippets are not full rules; pending MAS/product sources remain explicit gaps. Knowledge tasks allow registered read-only knowledge MCP and relevant source/reference reads, never shells, setup helpers, tests, browsers, AT or providers. Knowledge access does not authorize execution or bypass capability/workflow gates.

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. `${PLUGIN_ROOT}` is the host-supplied
top-level installed plugin root, not the working directory.
Call `a11y_resources_resources` for the configured
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
