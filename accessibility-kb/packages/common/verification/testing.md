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

## Component replacement: behavior regression matrix

Bind a replacement comparison to the actual old
and new component versions, wrapper/export routes and host configuration. Use
matched representative route, fixture, viewport, input and interaction state;
record deliberate behavior differences separately from accidental regressions.
A new outer surface with a familiar name need not preserve its old contract.

| Boundary to inventory | Positive expected case | Negative regression case |
|---|---|---|
| Header/body/footer and render callbacks | Title/name, instructions, footer actions and logical reading order survive the replacement | A custom header callback becomes visually similar text but loses dialog labeling or heading semantics |
| Width/padding/alignment and scroll owner | Longer localized text, zoom/reflow, focus and actions remain visible; scrolling keeps focused content accessible | A new scroll container clips the footer/focus ring or traps content offscreen |
| Focus entry/containment/restoration | Documented modal/nonmodal behavior and trigger/fallback survive opening, dismissal and unmount | New trap in a nonmodal surface, lost fallback, or both old/new focus owners restoring |
| Dismissal and animation | Each supported close button, Escape, outside interaction or completion path has the expected lifecycle and post-close focus | Only the close-button path works; abrupt unmount/animation completion restores to a removed trigger |
| Portal/provider boundaries | Actual ancestor context reaches the portaled surface and nested controls for naming, focus, status and theme behavior | A local test omits a required provider or mocks it away, yet claims production behavior |
| Inner controls and compound composition | Replaced and retained controls preserve roles, labels, selected/disabled states, keyboard navigation and supported slots | New outer shell encloses incompatible old controls, nested interactive elements or bypassed compound behavior |
| Error, loading, retry and completion | The collection outcome and focus matrices are satisfied in all applicable branches | Happy-path screenshot passes while repeated error, no-change refresh or disappearing Retry fails |
| Appearance/input variants | Default/themed/forced-colors, LTR/RTL, text growth, keyboard and pointer behavior remain usable | An inherited selector assumes the former DOM element, or raw CSS bypasses RTL flipping |
| Coexisting old/new paths | Test accessible behavior at the consumer for each path still reachable | A mocked switch returning a boolean is treated as proof of either UI contract |

Version-specific Fluent/SPDS provider, slot, shim and import instructions stay in
`fluent.selection.components-and-utilities`, `fluent.v8.component-contract`,
`fluent.v9.component-contract`, `sharepoint.spds.component-contract` and
`sharepoint.verification.themes-and-host`. These are optional routing IDs, not
Common dependencies. Rollout activation, dependency updates, release operations
and capture commands are outside this knowledge entry.

## Cases that distinguish an actual behavioral check

- **Exact focus operation:** start on the command that will disappear, perform
	that action, wait for the documented committed state and assert the actual
	active element. Also cover a surviving row, last-item deletion, last deselection,
	cancellation, error/retry and user movement before completion. Merely asserting
	that the fallback exists cannot distinguish the broken case.
- **Messages:** exercise zero/one/multiple and locale-specific plural cases,
	reordered element placeholders, repeated identical completion/error, explicit
	refresh with no count change, and stale-request cancellation. Assertions on
	message construction or an announcement mock do not establish actual speech.
- **Initial state:** reject an unusable preload and verify coherent loading/data
	state before resolution; a transient false “empty” state is a regression even
	if the final populated screenshot looks correct.
- **Repeated instances and lifecycle:** names/IDs and providers remain correct
	across multiple instances, prop/context/theme changes, unmount and remount.
	A late callback must not update another owner or refocus a dismissed surface.
- **Behavior-preserving cleanup:** removing a wrapper/Fragment or changing a
	forwarded prop can alter identity, state and focus. Positive: the retained
	interaction preserves its key/reconciliation and receiver contract. Negative:
	cleanup remounts the active control or drops a prop whose presence the receiver
	distinguishes from `undefined`. Do not infer safe cleanup from visual parity.
- **Loading/dependency refactor:** preserve required style/provider initialization
	and compatible runtime identity. Positive: deferred content still has its
	semantic/style context and a usable failure path. Negative: an import rewrite
	skips initialization or duplicates singleton context and breaks the interaction.
	Smaller bundles alone do not prove accessibility preservation.

For scans, record the selected state/region, rules and justified exclusions.
Zero violations is not coverage of keyboard journeys, screen-reader delivery,
focus visibility or all themes. Content/editor scanners are not substitutes for
semantic component tests. See [observation limits](dynamic.md).

All examples are proposed verification, not executed tests. These regression
checks address accessibility, not release authority, report schemas, severity
or performance budgets.