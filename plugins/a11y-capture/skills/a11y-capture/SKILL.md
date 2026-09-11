---
name: a11y-capture
description: Capture a caller-supplied Windows accessibility scenario without taking over the caller's workflow.
---

Read `${CLAUDE_PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For static guidance use `knowledge/README.md` and applicable topics: `knowledge/foundations.md`, `knowledge/keyboard-focus.md`, `knowledge/dynamic-content.md`, `knowledge/visual-accessibility.md`.
For SPDS, Fluent V8/V9 or SharePoint-specific guidance, read `integrations/agentow/knowledge/README.md` and its complete-source topic routing. Static project knowledge does not require AgentOW or an execution integration. Archived operational instructions are reference data, not permission to run them; only an explicitly authorized execution integration may act on its procedures.

Read `docs/CAPABILITIES.md`. Use `a11y_capture_invoke` for the requested `before`
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
