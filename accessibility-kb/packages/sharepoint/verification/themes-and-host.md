# Theme and host verification method

Status: draft. Owner: unassigned.
Source IDs: `sharepoint-support`, `spds-docs`, `sharepoint-utilities`.

## Inputs and scope

Record product surface, shell/embedding context, installed component and utility
package identities with exact resolved versions, and authoritative documentation
covering their host and theme contracts. Record relevant browser/AT versions and
test conditions when evidence exists. Do not infer official support from a
locally working combination; the official support list and MAS connection are
pending. Apply [support policy](../profiles/support-policy.md).

Build a risk-based state matrix from actual product requirements: theme variants,
forced colors, zoom/reflow, keyboard focus, overlays, loading, empty, error and
disabled states, plus navigation or remount transitions where relevant. These
are investigation dimensions, not an invented list of supported products or
mandatory combinations. An omitted state needs an applicability basis or remains
unverified.

## Ownership and evidence

- **Native:** check actual element semantics and browser behavior, including
  focus and forced-color effects; distinguish browser defaults from overrides.
- **Framework:** compare rendering, state indication, keyboard interaction and
  focus visibility with the exact version's documented contract. Keep Fluent
  V8 and V9 routes separate; never guess theme or component API names.
- **Host/caller:** examine inherited styles, surrounding backgrounds, clipping,
  shell focus transitions, route lifecycle and feedback utilities. Determine
  whether the host overrides or duplicates component behavior.

Use `common.verification.static` to inspect style/state paths, including branches
not reached dynamically. Use `common.verification.dynamic` for rendered contrast,
focus order and visibility, keyboard/voice interaction and actual AT feedback.
Use `common.verification.testing` for assertions and residual runtime checks.
Diagnostics, screenshots and DOM checks alone do not prove a complete AT experience.

Output findings by state with source-supported versus observed evidence,
ownership rationale, coverage, unknowns and scoped outcomes. A checked pass
applies only to the recorded checks; blocked or not-run checks are not passes.
Use `common.analysis.root-cause` and
`common.implementation.component-contract` to choose the responsible correction
layer. This knowledge method provides no tool installation or browser operations;
runtime verification requires separate authorization.