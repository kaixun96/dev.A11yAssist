# SPDS component contract method

Status: draft. Owner: unassigned.
Source IDs: `spds-docs`, `sharepoint-support`, `sharepoint-utilities`.

This is a worksheet, not a claim about actual SPDS APIs or defaults. Record the
installed package identity and exact resolved version, component, product host,
wrappers and authoritative documentation with revision and applicability scope.
If SPDS delegates to Fluent, confirm the actual dependency and use
`fluent.v8.component-contract` or `fluent.v9.component-contract` separately.
Do not infer delegation or compatibility from names.

## Responsibility record

| Layer | Evidence to establish | Boundary to preserve |
| --- | --- | --- |
| Native | Rendered elements, semantics, browser activation and focus defaults | Do not replace native behavior without a justified interaction contract. |
| Framework | Version-documented SPDS behavior and any documented underlying Fluent behavior | Attribute each role, state, keyboard action and focus change to its actual owner; a wrapper does not prove ownership. |
| Host/caller | Contextual labels, controlled state, business errors/results, navigation, shell and theme integration | Supply only responsibilities left to the caller or explicitly delegated to a host utility. |

Review custom rendering, nested interaction, event interception, disabled/error
states and mount/unmount transitions. Identify missing and duplicate behavior
with `common.analysis.root-cause` and
`common.implementation.component-contract`; no API name is supplied by this
draft in place of official documentation.

Output cited guarantees, caller obligations, composition limits, unknowns and
the smallest responsible fix layer. SPDS is not automatically preferred over
Fluent; return to [selection](../selection/components-and-utilities.md) when the
host contract does not establish a choice.

Use `common.verification.static`, `common.verification.dynamic` and
`common.verification.testing`, plus [host checks](../verification/themes-and-host.md).
The MAS and official support-list connections remain pending; consult
[support policy](../profiles/support-policy.md). Unsupported is not not-applicable.