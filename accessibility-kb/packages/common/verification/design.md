# Design verification

**Status: draft guidance; not normative approved policy.** This is a read-only
review of proposed behavior, not implementation approval or execution authority.
Actual edits and runtime work require the caller's separate authorization.

## Review the interaction contract

- Identify each user goal and its information, navigation, and action surfaces.
  Specify semantic intent, meaningful labels, relationships, and content order.
- Describe keyboard reachability and operation, voice-identifiable wording,
  focus entry and exit, and a persistent fallback when a control disappears.
- Account for loading, empty, error, retry, disabled, and completion states.
  Describe visible and programmatic feedback without unnecessary interruption.
- Include focus styling, forced colors, themes, non-color state cues, text
  growth, reflow, target spacing, and any motion or timeout alternatives.
- Assign supplied and caller-owned behavior using the
  [component contract](../implementation/component-contract.md). Prefer an
  existing suitable interaction over creating a custom keyboard model.

Use [authority and applicability](../requirements/authority-and-applicability.md)
to distinguish required outcomes from optional design preferences. Missing state
designs or undocumented component behavior are open questions, not presumed pass.

## Deliverable

Recommend concrete acceptance outcomes for each affected state, the responsible
layer, unresolved design decisions, and the later evidence needed. A static
mockup cannot establish actual name computation, focus movement, speech, or
rendered contrast. Route those unknowns to a
[separately authorized observation plan](dynamic.md), not an invented result.

Basis: [component semantics](../topics/component-accessibility.md),
[keyboard and focus](../topics/keyboard-focus.md),
[forms and content](../topics/forms-and-content.md),
[dynamic content](../topics/dynamic-content.md), and
[visual accessibility](../topics/visual-accessibility.md).

## Concrete acceptance worksheet

Describe outcomes, not just component names or
screenshots. For each changed region, specify its semantic/interaction purpose,
state owner, contextual name, keyboard model, focus destination and feedback
owner. An extracted component is useful when it owns an independently testable
contract; arbitrary file splitting or a pass-through wrapper is not a design
improvement by itself.

| Design question | Positive acceptance example | Negative / unresolved design |
|---|---|---|
| Group and structure | Delivery options have a named group; a section title has a justified heading relationship | Only visual proximity implies grouping; font size determines heading level |
| Form failure | Submit failure keeps entered data, identifies invalid fields and makes correction/retry reachable | Only a red border or transient toast identifies the problem |
| Collection lifecycle | Each reachable state in the collection matrix specifies visible, programmatic and focus outcomes | Loading/empty/error/end/no-change designs are omitted because only the populated mockup exists |
| Disappearing controls | After the final item is deselected, row focus stays; a focused disappearing command has a persistent fallback | “Restore focus” with no target, owner or timing |
| Truncation and direction | Full text remains available to keyboard/touch/AT; translated/RTL layouts preserve reading and tab order | Hover alone reveals a clipped label; a mirrored layout silently reverses meaning |
| Visual states | Focus, selected/error, themes, forced colors and reflow are specified with criterion exceptions | A token choice or a single default-state screenshot is treated as proof of contrast |
| Custom interaction | A documented primitive gap is paired with the complete semantics/input/state/focus contract and tests | A custom clickable container gets only `role="button"` |
| Async/lazy region | Loading/error/retry and eventual focus entry are part of the same workflow contract | A lazily loaded panel has no accessible loading/failure or cancellation plan |

Use [component cases](../topics/component-accessibility.md),
[forms/localization](../topics/forms-and-content.md),
[collection outcomes](../topics/dynamic-content.md),
[focus outcomes](../topics/keyboard-focus.md), and
[visual/RTL cases](../topics/visual-accessibility.md) as the detailed source of
those outcomes. Acceptance examples are proposed tests, not invented evidence or
approval. Resolve contradictions against actual source and component contracts;
a checklist stating “reviewed” cannot fill a missing design.
