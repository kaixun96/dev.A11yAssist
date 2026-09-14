---
name: a11y-capture
description: Capture a caller-supplied Windows accessibility scenario without taking over the caller's workflow.
---

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
