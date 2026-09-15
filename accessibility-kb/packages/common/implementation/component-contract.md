# Component accessibility contract

**Status: draft guidance; not normative approved policy.** This document supports
read-only design and implementation recommendations. It does not authorize
source edits, dependency changes, or runtime actions.

## Separate provided behavior from caller responsibilities

Read the actual implementation or applicable documentation before assigning
ownership. A familiar component name is not proof of its rendered semantics.

| Concern | Behavior the primitive or component may provide | Responsibility to establish at the call site |
|---|---|---|
| Semantics | Native role, structural relationships, prop forwarding | Correct interaction choice, valid composition, contextual structure |
| Naming | Label association and unique ID generation | Meaningful localized text, visible-label consistency, useful descriptions |
| State | Supported state exposure and disabled activation handling | Accurate state values, committed data, error and retry transitions |
| Keyboard | Native activation or a documented composite key model | Avoid conflicting handlers; keep all required actions reachable |
| Focus | Entry, containment, active-item management, restoration hooks | Persistent trigger or logical fallback, navigation context, lifecycle inputs |
| Feedback | A shared status mechanism | Relevant localized outcome text, correct timing, no duplicate announcements |
| Appearance | Focus styling and system-color support | Safe overrides, surrounding layout, applicable themes and content growth |

Treat the middle column as questions to verify, not universal guarantees. Mark
undocumented behavior as context needed. Give each behavior one accountable
owner while documenting dependencies across the boundary.

## Choose native, framework, or host behavior deliberately

- Prefer a native platform control when it expresses the intended interaction
  and provides the required behavior. Do not duplicate its keyboard semantics.
- Reuse an existing framework component when its documented contract fits the
  need. Confirm supported composition and customization rather than bypassing
  it with conflicting roles, focus handlers, or hidden copies.
- Use a host-provided accessibility mechanism when that host owns the lifecycle
  or semantic surface. Identify the supported API and caller obligations from
  supplied documentation; do not assume a web attribute controls every surface.
- Recommend a custom implementation only with an explicit gap and a complete
  semantics, input, state, focus, and verification plan. This is not authority
  to install a dependency or migrate a framework.

Record intended behavior, supplied guarantees, caller obligations, unknowns,
override risks, and [test boundaries](../verification/testing.md). Reassess the
contract when wrappers, slots, conditional rendering, or shared styles change.

Basis: [component semantics](../topics/component-accessibility.md),
[keyboard and focus](../topics/keyboard-focus.md),
[forms and content](../topics/forms-and-content.md), and
[dynamic content](../topics/dynamic-content.md).

## Prove reuse fits the accessible behavior

**Historical draft extension.** Search by the needed capability, not only an
API's name. Inspect the public export, implementation, supported version and
representative callers. A shared utility or a visually similar replacement is
not a fit if it changes the semantic role, keyboard model, urgency, repeat-event
support, focus owner, provider lifetime or failure behavior. Verify that its
dependency/host boundary is valid; a private editor helper is not a general
component API merely because it contains “accessibility” in its name.

| Reuse decision | Positive case | Negative case |
|---|---|---|
| Component fits | Documented slots/subcomponents preserve naming, state and keyboard behavior with caller-owned localized text | Extra wrappers or custom nested controls bypass the component's compound interaction |
| Shared status mechanism fits | Existing provider and API cover a routine repeated result exactly once | A legacy assertive-only helper replaces a polite routine status, or two utilities announce the same event |
| Small shared gap | Extend the stable owning contract where multiple consumers need the same capability and compatibility is understood | Copy private hidden-text CSS or a local alert implementation into another feature without its lifecycle constraints |
| No valid shared fit | Retain a justified local implementation with a complete accessibility contract and tests | Force reuse across an invalid ownership/runtime boundary merely to remove duplication |
| Formatter fits | Locale, numeric count domain, repeat placeholders and element-valued placeholders match the caller | A generic string formatter replaces a node-aware sentence formatter or loses valid zero values |

For copied implementations, compare behavior/defaults/edge cases before making
a reuse claim. Divergent announcements, focus fallback or localized resources
are concrete behavior risks, not merely stylistic duplication. If the copies
agree and shared ownership is unsuitable, duplication alone is not a defect.
Do not claim there is no suitable visually-hidden utility based on a historical
repository inventory; inspect the current owning surface and prefer a supported
pattern. Screen-reader-only controls require an actual interaction need.

## Maintain ownership through composition and lazy loading

A region with its own semantic purpose, interaction state, focus lifecycle or
test contract may merit an independent component. Keep coordinated state at the
nearest common owner, especially when selection changes a sibling toolbar or
deletion closes a dialog and updates its collection. Splitting files or adding
pass-through wrappers does not create a useful accessibility boundary by itself.

An asynchronous boundary must retain loading, error, retry, naming and restoration
contracts. Positive: a dialog's name and focus entry become available together
after loading, and cancellation invalidates late completion. Negative: a lazy
body mounts without its title/provider, or a late chunk steals focus after the
user dismissed the surface. Prefer a single established owner to competing
effects at each wrapper. See [focus lifecycle](../topics/keyboard-focus.md) and
[replacement tests](../verification/testing.md).

Product API details are intentionally routed, not duplicated: optional IDs
`fluent.selection.components-and-utilities`, `fluent.v8.component-contract`,
`fluent.v9.component-contract`, `sharepoint.spds.component-contract`,
`sharepoint.selection.components-and-utilities` and
`sharepoint.utilities.announcements-and-focus`. Common has no dependency on those
packages; their availability/version must be established before using them.

Historical basis: [rendered and component ownership checks](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L59-L219),
[focus and utility boundaries](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L344-L424),
[reuse fit and comparison](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/shared-utility-reuse.md#L9-L151),
and [semantic/state and async boundaries](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/ux-architecture-and-bundle-boundaries.md#L5-L36).
These generalizations retain useful contracts without imposing historical
package preferences, review severities or operational commands.