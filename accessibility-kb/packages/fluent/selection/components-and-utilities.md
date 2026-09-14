# Select components and utilities by contract

Status: draft. Owner: unassigned.
Source ID: `fluent-docs` (review-pending connection target).

This method is current, unsourced draft guidance pending connection to and
review of official documentation for each candidate component/version. It does
not establish an official selection policy or qualified component behavior.

## Inputs and routing

Capture the intended interaction, states, host constraints, existing component
composition and installed package identities with exact resolved versions.
Identify authoritative documentation for each candidate and its applicable
revision. Use the [V8 contract](../v8/component-contract.md) for V8 and the
[V9 contract](../v9/component-contract.md) for V9; do not merge their defaults or
invent API names to bridge gaps.

Compare candidates against the required behavior and composition constraints,
not a blanket library preference. Product wrappers or utilities need a matching
host contract; their mere availability does not make them mandatory or safe.

## Decision method

1. Identify **native** semantics and interaction available from the rendered
   elements; preserve these unless the intended pattern requires a documented
   alternative.
2. Identify **framework** behavior already supplied by the exact component
   version. Check state ownership and documented composition restrictions.
3. Identify **host/caller** obligations: contextual naming, application state,
   validation, async feedback, navigation and integration outside the component.
4. Consider a utility only for a demonstrated responsibility gap. Document its
   owner, lifecycle and interaction with existing behavior. Reject duplicate
   focus handling or announcement paths rather than adding another layer.

Output candidate rationale, a behavior-to-owner map, rejected alternatives,
source gaps and planned static/dynamic/regression coverage. Shared methods:
`common.implementation.component-contract`, `common.analysis.root-cause`,
`common.verification.static`, `common.verification.dynamic`,
`common.verification.testing` and
`common.requirements.authority-and-applicability`.

MAS authority connection and source qualification remain pending. Unknown
support is not evidence of inapplicability or a pass. No tool installation or
browser operations belong to this method; it grants no execution authority.