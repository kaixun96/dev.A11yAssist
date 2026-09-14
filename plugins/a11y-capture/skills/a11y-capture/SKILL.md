---
name: a11y-capture
description: Capture a caller-supplied Windows accessibility scenario without taking over the caller's workflow.
---

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For shared knowledge read `${PLUGIN_ROOT}/references/README.md` and `${PLUGIN_ROOT}/references/knowledge.json`.
Call a11y_capture_knowledge_list and a11y_capture_knowledge_search(query) to select relevant Common, Fluent and SharePoint IDs for the actual stack/version, then a11y_capture_knowledge_read(id) for full entries with citations and source status.
Knowledge resolves automatically through configured root, validated development layout, verified shared user cache, then pinned HTTPS download. Node.js 22+ and enabled host MCP support are required, but no user configuration or peer plugin is needed. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it.
Unavailable tools or failed knowledge verification are explicit dependency failures. Search snippets are not full rules; pending MAS/product sources remain explicit gaps. Knowledge tasks allow registered read-only knowledge MCP and relevant source/reference reads, never shells, setup helpers, tests, browsers, AT or providers. Knowledge access does not authorize execution or bypass capability/workflow gates.

Read `${PLUGIN_ROOT}/docs/CAPABILITIES.md`. `${PLUGIN_ROOT}` is the host-supplied
top-level installed plugin root, not the working directory.
Use `a11y_capture_invoke` for the requested `before`
or `after` operation. Supply a stable operationId, context.scenarioHash and
context.evaluator; AFTER also requires context.head. Supply
context.beforeReceiptSha256 when the caller requests a bound comparison.
The input carries the real scenario/request understood by the capture connection.

Do not require this repository's intake stage or create a full workflow run.
The capture connection must verify permission, exclusive ownership of the shared
desktop, installed runtime identity and the capabilities needed by this scenario.
It must collect real evidence, not simulate assistive technology or reuse unrelated
historical media. Preserve the requested scene, build and applicable AT settings.

Return actual artifacts and limitations. A completed capture is not itself a
product PASS. Do not modify source, publish a PR or invoke another stage.
Clean only temporary state owned by this operation according to the connection's
contract; do not release the caller's long-lived resource lease.

Use `a11y_capture_operation_status` or `_operation_reconcile` for the same
operationId. Never replay a pending request, loosen evidence thresholds or
interfere with another worker's browser/AT.
