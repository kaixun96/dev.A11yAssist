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