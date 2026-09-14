# Accessibility test boundaries

**Status: draft guidance; not normative approved policy.** Recommend test cases
and interpret supplied results read-only. Test authoring, execution, dependencies,
and environment changes require separate caller authorization and applicable
gates. This document supplies no executable commands or active test tooling.

## Place assertions at the responsible boundary

| Boundary | Suitable assertions | What it does not establish |
|---|---|---|
| Unit | State transitions, fallback selection, message formatting, cancellation, activation guards | Rendered semantics, actual focus, speech, or visual presentation |
| Component | Rendered name/role/state relationships, unique IDs across instances, prop forwarding, event behavior, documented focus lifecycle | All containing-page behavior, all platform combinations, or actual speech in a simulated environment |
| Integration | Caller/component ownership, navigation, nested interactions, unmount/restoration, shared status feedback, async error/retry paths | Universal conformance or unobserved input and assistive-technology behavior |

Use the lowest boundary that can faithfully expose the defect, then cover the
cross-boundary behavior that could regress. An isolated component test should
not stand in for a page-level focus fallback; a state-unit assertion should not
claim that a status message was spoken.

## Recommend a regression case

Describe the defect or risk, relevant contract, initial state, user action,
expected outcome, and an assertion that would distinguish the broken behavior
from the intended behavior. Include repeated instances, alternate state paths,
and unaffected consumers proportionally to the
[root-cause blast radius](../analysis/root-cause.md).

Prefer observable semantic and behavioral outcomes over brittle structure-only
snapshots. Avoid fixed delays as proof of focus or announcement timing. If a
test substitutes a component or platform API, state which real behavior is no
longer covered. Do not invent a failing-before or passing-after result.

Recommend [dynamic observations](dynamic.md) for speech, actual focus visibility,
voice targeting, computed contrast, forced colors, and layout when not reliably
established by the available test boundary. An automated check can contribute
evidence but does not certify conformance; skipped or unsupported coverage stays
unknown.

Basis: [foundations](../topics/foundations.md),
[keyboard and focus](../topics/keyboard-focus.md), and
[dynamic content](../topics/dynamic-content.md).