# Static verification

**Status: draft guidance; not normative approved policy.** Review only source and
documentation available within the caller's authorized read scope. Do not edit,
execute tests, launch the application, or operate assistive technology here.

## Review plan

1. State the changed behavior, affected users, and relevant
   [requirement applicability](../requirements/authority-and-applicability.md).
2. Identify the [component contract](../implementation/component-contract.md)
   and inspect only the nearby definitions needed to follow that contract.
3. Trace names, roles, values, relationships, event handling, focus ownership,
   and feedback through reachable state transitions, not just initial markup.
4. Review styles and content for source-visible risks, including conditional
   hiding, clipping, reordering, localization, themes, and validation paths.
5. Separate a supported causal finding from missing context and behavior that
   requires rendered observation. Preserve valid native or supplied behavior.

## Evidence and limits

For a supported issue, record the available source location or exact snippet,
affected operation, causal path, candidate criterion with rationale, and smallest
recommended correction. An inaccessible wrapper cannot be inferred solely from
an unfamiliar name or missing explicit ARIA.

Record unknown generated IDs, missing implementations, and parent-owned behavior
as context needed. Record actual accessible names, speech, focus movement,
contrast, and layout as runtime not verified unless separate valid observations
are supplied. Do not invent measurements, line numbers, or a pass result.

Recommend [dynamic observations](dynamic.md) only for unresolved behavior;
recommend [tests](testing.md) at the responsible boundary. A clean source review
means no definite issue found in that scope, not accessibility conformance.

Basis: [foundations](../topics/foundations.md),
[component semantics](../topics/component-accessibility.md),
[forms and content](../topics/forms-and-content.md), and
[visual accessibility](../topics/visual-accessibility.md).