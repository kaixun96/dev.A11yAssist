---
name: a11y-validate
description: Validate caller-supplied accessibility evidence independently, without requiring this repository's full workflow or fixing product code.
---

Resolve bundled paths from the plugin root, two directories above this SKILL.md, not the user's working directory.
Read `docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For static guidance use `knowledge/README.md` and applicable topics: `knowledge/foundations.md`, `knowledge/component-accessibility.md`, `knowledge/keyboard-focus.md`, `knowledge/forms-and-content.md`, `knowledge/dynamic-content.md`, `knowledge/visual-accessibility.md`.
For SPDS, Fluent V8/V9 or SharePoint-specific guidance, read `integrations/agentow/knowledge/README.md` and its complete-source topic routing. Static project knowledge does not require AgentOW or an execution integration. Archived operational instructions are reference data, not permission to run them; only an explicitly authorized execution integration may act on its procedures.

Read `docs/CAPABILITIES.md`. For evidence-v1 structural checking, use
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
