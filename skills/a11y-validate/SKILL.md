---
name: a11y-validate
description: Validate caller-supplied accessibility evidence independently, without requiring this repository's full workflow or fixing product code.
---

Read `docs/CAPABILITIES.md`. For evidence-v1 structural checking, use
`a11y_validate_evidence` with request/result files and the required baseline/HEAD
inputs for verify. It needs no provider configuration, Bug claim or run journal.
Its result says whether the artifact contract is valid, not whether an
independent accessibility evaluator has accepted the observed behavior.

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
