# Fluent V8 component contract method

Status: draft. Owner: unassigned.
Source ID: `fluent-docs` (review-pending connection target).

This worksheet is current, unsourced draft guidance, not an official V8 rule.
The recorded locator is a V9 entrypoint; the official V8 documentation connection
and version-matched content review remain pending.

Use only for a confirmed V8 dependency. Record installed package identity, exact
resolved version, component, wrappers, rendered element and authoritative V8
documentation with revision or immutable retrieval reference. V9 documentation
does not establish V8 behavior. If the version or documentation is unavailable,
mark the contract undetermined and list the missing evidence; do not infer API
names or defaults.

## Contract worksheet

1. **Native owner:** identify semantics, activation and focus behavior supplied
   by the actual HTML element/browser, including behavior removed by overrides.
2. **V8 framework owner:** cite the version-matched contract for supplied names,
   roles, state, keyboard handling, focus movement and announcement behavior.
   Distinguish documented guarantees from implementation observations.
3. **Host/caller owner:** identify required labels, controlled state updates,
   validation messages, async results, navigation and surrounding focus targets.
   Record precisely which are delegated by this component contract.
4. **Composition limits:** examine wrappers, nested interactive content, custom
   rendering and event interception. Do not add semantics, keyboard handlers,
   focus changes or announcements that duplicate an existing owner.

Output a behavior-to-owner table with source references, caller obligations,
unknowns and verification scope. Route root-cause placement through
`common.analysis.root-cause` and the worksheet through
`common.implementation.component-contract`.

Use `common.verification.static` for all relevant source branches,
`common.verification.dynamic` for rendered keyboard/focus and AT behavior, and
`common.verification.testing` for regression boundaries. Unvisited states remain
unverified; source inspection alone cannot establish observed speech or a pass.

Return to [selection](../selection/components-and-utilities.md) if dependency
identity or component suitability is uncertain. This worksheet grants no
execution authority.