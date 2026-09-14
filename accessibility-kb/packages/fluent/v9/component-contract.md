# Fluent V9 component contract method

Status: draft. Owner: unassigned.
Source ID: `fluent-docs` (review-pending connection target).

This worksheet is current, unsourced draft guidance, not an official V9 rule.
The official documentation entrypoint is recorded, but connection to the exact
component contract, its revision and content review remain pending.

Use only for a confirmed V9 dependency. Capture installed package identity,
exact resolved version, component composition and authoritative V9 documentation
with revision or immutable retrieval reference. A V8 contract or similar name
is not evidence of V9 behavior. Do not guess API names,
defaults or interoperability; unresolved source/version gaps block the decision.

## Contract worksheet

- **Native owner:** record the actual rendered elements, their semantics and
  browser defaults, and which defaults composition or event handling changes.
- **V9 framework owner:** establish, from matching documentation, which part of
  the composition supplies roles, state, keyboard interaction, focus management
  and feedback. Confirm required relationships between component parts rather
  than assuming every part works independently.
- **Host/caller owner:** record contextual accessible names, application state,
  error/result content, routing and host integration that the documented
  contract leaves to the caller. Identify controlled-state responsibilities and
  focus targets that exist outside the component.
- **Composition boundary:** check custom rendering, wrappers and mixed-version
  boundaries for missing or duplicated behavior. Treat each installed dependency
  under its own contract; V8 and V9 are not interchangeable implementations.

Output a behavior-to-owner table, cited composition constraints, missing evidence
and a regression plan. Use `common.implementation.component-contract` and
`common.analysis.root-cause`; fix the responsible layer rather than patching
every caller with additional semantics or event handling.

Use `common.verification.static` for state and branch coverage,
`common.verification.dynamic` for rendered focus/keyboard and AT outcomes, and
`common.verification.testing` for assertions and remaining runtime checks.
DOM assertions alone are not proof of the complete AT experience.

See [selection](../selection/components-and-utilities.md) before choosing a route.
This worksheet grants no execution authority.