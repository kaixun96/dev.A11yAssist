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