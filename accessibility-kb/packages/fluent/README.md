# Fluent accessibility contracts

Status: draft. Owner: unassigned.
Source ID: `agentow-accessibility` (historical-reference, historical).

Concrete guidance derived from the pinned historical review reference, not
official MAS requirements or owner-approved Fluent documentation. The source
distinguishes V8 from V9 but does not specify exact installed patch versions.
Record the resolved dependency, wrapper and composition before applying a rule;
confirm changed or overridden behavior against that installed implementation.
The separate `fluent-docs` record is a pending official-documentation connection,
not claim support for these entries.

## Choose the contract

| Need | Entry |
| --- | --- |
| Choose a component, find the corresponding V9 documentation, preserve compound structure, or review a version replacement | [Selection](selection/components-and-utilities.md), ID `fluent.selection.components-and-utilities` |
| V8 MessageBar defaults, `delayedRender` overrides, `Announced`, or V8 focus ownership | [V8 contract](v8/component-contract.md), ID `fluent.v8.component-contract` |
| V9 MessageBar intent and root announcer, `useAnnounce`, or restoration hooks | [V9 contract](v9/component-contract.md), ID `fluent.v9.component-contract` |

## One owner per behavior

- Prefer the component that models the interaction. Its documented subcomponents,
  slots, semantics, keyboard/focus behavior and high-contrast support are the
  starting implementation, not decoration to rebuild around custom markup.
- The caller still supplies contextual labels/descriptions, localized messages,
  controlled application state and host prerequisites. Absence of explicit ARIA
  at a call site is not a defect when the component already exposes the semantics.
- Use an announcement or focus utility only for behavior not already owned by
  the component. V8 default MessageBar announcements and V9 intent announcements
  under a root announcer must not be repeated by an additional live region.
- Treat native V9, V8, and migration shims as different ownership boundaries.
  Similar component names do not make their providers, hooks or defaults portable.

Basis: [component ownership and documentation routing](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L21-L58),
[announcement ownership](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L112-L219),
and [focus ownership](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L344-L399).

## Shared and host-specific knowledge

Use `common.implementation.component-contract` and `common.analysis.root-cause`
for responsibility analysis; `common.topic.dynamic-content` and
`common.topic.keyboard-focus` for cross-product transition matrices; and
`common.verification.static`, `common.verification.dynamic` and
`common.verification.testing` for evidence limits. Source inspection and DOM
assertions do not prove observed speech or conformance.

For a SharePoint host, optional routes are
`sharepoint.selection.components-and-utilities`,
`sharepoint.spds.component-contract`,
`sharepoint.utilities.announcements-and-focus`,
`sharepoint.verification.themes-and-host` and
`sharepoint.case.duplicate-announcement`. Those product contracts are not copied
here or required to consume Fluent with Common alone.

Requirements authority remains in `common.requirements.authority-and-applicability`.
Historical claims do not supply official MAS rules, current product support, or
permission to execute tests, operate a browser, or change a live environment.