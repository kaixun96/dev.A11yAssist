# Fluent accessibility contract routing

Status: draft. Owner: unassigned.
Source ID: `fluent-docs` (review-pending connection target).

The worksheets are current, unsourced draft guidance pending connection to and
review of version-matched official component documentation. The source record
identifies where to investigate, not reviewed authority for these methods.

This package routes framework-specific investigation; it is not an official API
reference or a qualified component contract. Start with
[component and utility selection](selection/components-and-utilities.md), then use
the matching [V8](v8/component-contract.md) or [V9](v9/component-contract.md) route.
Never transfer behavior, defaults or API names between those versions.

Record the installed package identity and exact resolved version, the component
and composition in use, and authoritative documentation covering that version.
The `fluent-docs` source still needs revision and content review; a documentation
location alone does not establish a current, applicable contract. Missing or
conflicting documentation is a blocked contract decision, not permission to
guess an API.

## Responsibility boundaries

- **Native:** the rendered HTML element and browser provide their defined
  semantics and default interaction. Confirm the element, attributes and any
  overrides; framework branding does not prove native behavior is retained.
- **Framework:** the installed component owns only the semantics, interaction,
  state and focus behavior established by its version-matched contract.
- **Host/caller:** the application supplies contextual names, data, controlled
  state, routing, business feedback and integration with surrounding UI where
  the framework contract assigns those responsibilities to the caller.

Assign one owner for each behavior before adding compensating code. Use shared
method IDs `common.analysis.root-cause`,
`common.implementation.component-contract`, `common.verification.static`,
`common.verification.dynamic` and `common.verification.testing`.
Requirements and applicability route through
`common.requirements.authority-and-applicability`; the MAS connection is pending.

This package is read-only knowledge: it provides no tool installation or
browser-operation instructions and grants no testing or execution authorization.