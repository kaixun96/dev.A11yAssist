---
name: a11y-validate
description: Validate caller-supplied accessibility evidence independently, without requiring this repository's full workflow or fixing product code.
---

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For shared knowledge read `${PLUGIN_ROOT}/references/README.md` and `${PLUGIN_ROOT}/references/knowledge.json`.
Call a11y_validate_knowledge_list and a11y_validate_knowledge_search(query) to select relevant Common, Fluent and SharePoint IDs for the actual stack/version, then a11y_validate_knowledge_read(id) for full entries with citations and source status.
Knowledge resolves automatically through configured root, validated development layout, verified shared user cache, then pinned HTTPS download. Node.js 22+ and enabled host MCP support are required, but no user configuration or peer plugin is needed. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it.
Unavailable tools or failed knowledge verification are explicit dependency failures. Search snippets are not full rules; pending MAS/product sources remain explicit gaps. Knowledge tasks allow registered read-only knowledge MCP and relevant source/reference reads, never shells, setup helpers, tests, browsers, AT or providers. Knowledge access does not authorize execution or bypass capability/workflow gates.

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. `${PLUGIN_ROOT}` is the host-supplied
top-level installed plugin root, not the working directory.
For evidence-v1 structural checking, use
`a11y_validate_evidence` with request/result files and the required baseline/HEAD
inputs for verify. It needs no provider configuration, Bug claim or run journal.
Its result says whether the artifact contract is valid, not whether an
independent accessibility evaluator has accepted the observed behavior.
For local evidence bytes, explicitly supply `artifactRoot` and, for verify,
`baselineArtifactRoot`. Every evidence URI must then be an unencoded root-relative
local path. Missing/mismatched files reject; remote URIs are never fetched.
This does not establish media quality or independent behavior acceptance.

For an independent behavior evaluation, use `a11y_validate_invoke` with action
`validate`, a stable operationId, context.scenarioHash and the actual evidence
input expected by the configured evaluation connection. Include context.head
and context.beforeReceiptSha256 when those are part of the requested comparison.

Do not require earlier stages in this repository. The caller owns sequencing.
Reject missing, mismatched or ambiguous evidence; never manufacture a PASS from
source reasoning, file existence or a successful process exit.

Return the verdict, supporting artifacts, limitations and any requested changes.
Do not edit source, operate AT, publish a PR, or restart the caller's workflow.
For pending evaluations reconcile the same operationId through
`a11y_validate_operation_reconcile`.
