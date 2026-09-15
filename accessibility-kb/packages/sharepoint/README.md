# SharePoint accessibility routing

Status: draft. Owner: unassigned.
Active source status and entry bindings: [package metadata](package.json).

Package **0.1.1** provides reusable SharePoint guidance scoped to ODSP-Web.
It depends on Common and Fluent **0.1.1** by stable entry IDs. The content is
draft, not current-approved SPDS/utility documentation, an official support list,
MAS rules or evidence of a tested experience. Active source records describe
connection/review status, not approval or execution instructions.

## Choose a contract

| Need | Entry |
| --- | --- |
| Table/DataGrid, stable/LazyComponents imports, supported fallback and utility fit | [Component and utility selection](selection/components-and-utilities.md) |
| SPDS → Fluent V9 delegation, documentation routing, compound markup and private CSS limits | [SPDS component contract](spds/component-contract.md) |
| Shared announcements, repeated results, async collections, page/canvas focus and keyboard helpers | [Announcements and focus](utilities/announcements-and-focus.md) |
| RTE/authored HTML validator capabilities and editor/component boundary | [Rich-text accessibility](utilities/rich-text-accessibility.md) |
| sp-dragzone start/move/cancel/complete feedback and handle focus | [Drag and drop](utilities/drag-and-drop.md) |
| Resources, count intervals, ReactNode sentences, safe markup and RTL | [Localization and formatting](utilities/localization-and-formatting.md) |
| Surface classification, neutral providers, V8 shims, Panel/Drawer risks and scan limits | [Themes and host verification](verification/themes-and-host.md) |
| Correct versus duplicate component/caller result paths | [Hypothetical duplicate-announcement case](cases/duplicate-announcement.md) |

## Shared contracts

Use Common for cross-cutting checklists and examples:
`common.topic.component-accessibility`, `common.topic.forms-and-content`,
`common.topic.dynamic-content`, `common.topic.keyboard-focus`,
`common.topic.visual-accessibility`, `common.implementation.component-contract`
and `common.verification.testing` cover shared principles.
`fluent.selection.components-and-utilities`, `fluent.v8.component-contract` and
`fluent.v9.component-contract` own shared Fluent documentation/API bodies.
General architecture, review workflow and performance guidance are outside this
package's scope.

## Applicability, deliberate exclusions and unknowns

- Use SPDS stable-first for the **ODSP-Web host**, not every
  product. Identify installed package/version and actual delegated owner; native
  semantics, framework behavior and host/caller duties remain distinct.
- Review severity labels are scoped draft guidance, not MAS classifications or
  current official product policy. Review commands, required artifacts and
  heading-evidence gates are not accessibility requirements. Common owns scoped
  contrast requirements and exceptions; there is no blanket contrast rule.
  Product teal is not a WCAG/MAS rule.
- Flight/KillSwitch operation, dependency updates, release commands, mock gate
  setup, evidence collection, provider/host ownership and workflow execution are
  excluded. Theme token/provider **contracts** and comparison conditions are
  retained without authorizing any operations.
- No drag completion key/API or complete RTE/scan function signatures/return types
  (except scan violation count) are specified here. Focus helper overloads/attribute
  syntax and alert hook indicator details are also unspecified. Confirm those
  details against the installed contracts; do not invent them. Examples are
  informative, not runnable package implementations or AT observations.
- Official SPDS/utility sources remain pending. External component implementations
  have not been fetched or reviewed for this draft. Approval, current applicability
  and redistribution clearance are not established by draft status or provenance
  records.

The [support policy](profiles/support-policy.md) and
[support matrix](profiles/support-matrix.json) remain awaiting official input;
the matrix intentionally has no products/rules. No MAS IDs or support claims are
invented. Unsupported is not not-applicable, and source/schema validity is not
an observed pass. This package is read-only knowledge, with no execution authority.