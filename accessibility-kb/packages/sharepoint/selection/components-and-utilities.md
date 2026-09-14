# Select for the actual SharePoint host

Status: draft. Owner: unassigned.
Source IDs: `sharepoint-support`, `spds-docs`, `sharepoint-utilities`.

## Required inputs

Record product surface, host/shell context, interaction and state requirements,
installed package identities and exact resolved versions. Obtain authoritative
documentation for that SPDS, Fluent or utility version and applicable host scope.
Keep Fluent V8 and V9 separate using `fluent.v8.component-contract` and
`fluent.v9.component-contract`; shared selection guidance is
`fluent.selection.components-and-utilities`.

## Selection method

1. Separate requirement applicability from declared product support using
   [support policy](../profiles/support-policy.md). The official list and MAS
   connection are pending; do not invent product coverage or exemptions.
2. Map **native** element/browser semantics, **framework** component behavior
   and **host/caller** context, state, feedback and lifecycle obligations.
3. Compare SPDS, Fluent and any host utility by version-matched contract and
   composition constraints. There is no blanket SPDS-before-Fluent order. If an
   authoritative host contract requires a particular integration, cite that
   scope rather than generalizing it to every product.
4. Use the [SPDS worksheet](../spds/component-contract.md) or
   [utility worksheet](../utilities/announcements-and-focus.md) only where those
   dependencies actually participate. Do not add a utility to compensate for
   undocumented assumptions or duplicate native/framework behavior.

Output the chosen route and alternatives, one owner per behavior, cited source
revisions, unresolved gaps and verification obligations. An unavailable source
blocks the affected contract claim; it does not justify guessed API names.

Use `common.implementation.component-contract`, `common.analysis.root-cause`
and `common.requirements.authority-and-applicability` for reasoning. Plan source,
rendered/AT and regression coverage through `common.verification.static`,
`common.verification.dynamic` and `common.verification.testing`, including
[themes and host states](../verification/themes-and-host.md). No execution is
authorized by this selection record.