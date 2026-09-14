# Trace an accessibility root cause

**Status: draft guidance; not normative approved policy.** Produce read-only
analysis and recommendations. Source editing and runtime investigation require
the caller's separate authorization and applicable gates.

## Build a causal chain

Start with the affected user's action and lost information or operation. Keep a
reported symptom separate from an observed result and a source-based hypothesis.

1. **Component:** identify the public contract, wrapper, slots, and composition
   path. Determine which props reach the semantic element.
2. **DOM and semantics:** trace the rendered element where known, label and
   description targets, grouping, visibility, and stable identity. Missing
   wrapper code is missing context, not proof of a defective element.
3. **State:** follow reachable transitions, including loading, error, retry,
   cancellation, disabled state, and unmount. Check whether exposed state matches
   the committed user-visible state.
4. **Events:** identify who handles activation and dismissal, propagation, and
   default behavior. Check for suppressed native behavior or duplicate handlers.
5. **Focus and feedback:** identify the existing owner, destination, fallback,
   timing, and announcement mechanism. Do not propose a second owner without
   establishing why the existing contract is insufficient.

For each link, distinguish supplied source evidence, documented behavior, and
unknown runtime behavior. Record exact locations only when available.

## Recommend the correct fix layer

Use the [component contract](../implementation/component-contract.md). Incorrect
caller data belongs at the call site; lost prop forwarding belongs in the
wrapper; a broken shared lifecycle belongs with the component that owns it;
page navigation or a surviving focus fallback can belong to the containing view.
A documented platform limitation calls for a scoped alternative or escalation,
not an assumed platform defect or arbitrary replacement of a library.

Prefer the smallest change that restores the intended contract. Avoid symptom
patches such as duplicate labels, extra announcers, unconditional focus calls,
or timing delays that leave the underlying ownership problem intact.

## Assess regression blast radius

List other consumers, repeated instances, nested interactions, alternate inputs,
localization, themes, and asynchronous branches affected by the proposed layer.
Identify which existing behaviors must remain unchanged and recommend
[tests at the owning boundary](../verification/testing.md).

Output: symptom and evidence status; causal chain; responsible layer; proposed
correction and alternatives; affected consumers; remaining unknowns and a
separately authorized verification plan. No source inspection alone establishes
actual focus, speech, or rendered contrast.

Basis: [component semantics](../topics/component-accessibility.md),
[keyboard and focus](../topics/keyboard-focus.md),
[dynamic content](../topics/dynamic-content.md), and
[visual accessibility](../topics/visual-accessibility.md).