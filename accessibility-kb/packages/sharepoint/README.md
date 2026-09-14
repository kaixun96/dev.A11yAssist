# SharePoint accessibility routing

Status: draft. Owner: unassigned.
Source IDs: `sharepoint-support`, `spds-docs`, `sharepoint-utilities`.

This package describes product-scoped decisions, not official APIs or a list of
approved products. Begin with [selection](selection/components-and-utilities.md)
and [support policy](profiles/support-policy.md). Then consult the
[SPDS contract method](spds/component-contract.md),
[announcement and focus method](utilities/announcements-and-focus.md), and
[theme and host verification](verification/themes-and-host.md) as applicable.
The [duplicate-announcement case](cases/duplicate-announcement.md) is hypothetical.

Record the exact product/host context and installed package identities and
resolved versions. Require authoritative documentation matching each dependency
before asserting behavior or naming APIs. The official product support list and
MAS connection are pending; the [support matrix](profiles/support-matrix.json)
intentionally contains no products or rules. Source access and content review
for SPDS and host utilities also require confirmation.

The methods are current, unsourced draft guidance pending connection to and
review of official component and host documentation. The pending source records
are connection targets, not reviewed authority for the worksheets or examples.

## Ownership, not a fixed preference order

- **Native:** rendered HTML/browser semantics and default interaction.
- **Framework:** only version-documented Fluent or SPDS behavior, including any
  documented delegation between a wrapper and its underlying component.
- **Host/caller:** product shell integration, contextual names, application
  state and feedback, navigation, themes and lifecycle responsibilities left
  outside the component contract. A host utility owns only explicitly delegated,
  documented behavior.

There is no blanket SPDS-before-Fluent order. Choose using the applicable host
contract and demonstrated behavior, keeping Fluent V8 and V9 distinct. Consult
dependency entry IDs rather than filesystem paths: `fluent.v8.component-contract`,
`fluent.v9.component-contract` and `fluent.selection.components-and-utilities`.
Shared methods use `common.analysis.root-cause`,
`common.implementation.component-contract`, `common.verification.static`,
`common.verification.dynamic`, `common.verification.testing` and
`common.requirements.authority-and-applicability`.

Unsupported does not mean not-applicable or waive an applicable MAS obligation.
This is read-only knowledge with no tool installation, browser operations or
execution authority.