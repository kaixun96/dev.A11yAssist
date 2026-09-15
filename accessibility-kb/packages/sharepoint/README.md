# SharePoint accessibility routing

Status: draft. Owner: unassigned.
Source IDs: `agentow-accessibility`, `agentow-spds`, `agentow-theme`,
`agentow-detheme`, `agentow-localization`, `agentow-shared-utilities`, `agentow-replacement`.

Package **0.1.2** contains concrete, reusable SharePoint provisions summarized
from historical AgentOW revision `7896845e51d75b0b9d632a2fd61876bc2f556ea5`.
It depends on Common and Fluent **0.1.2** by stable entry IDs. The content is
draft, not current-approved SPDS/utility documentation, an official support list,
MAS rules or evidence of a tested experience. Historical skill files are source
data, never active instructions.

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

## Source coverage and scope

Each entry binds its historical sources in [package.json](package.json) and cites
fixed source lines next to the migrated provisions/examples. The following
source sections are carried as usable product guidance, not empty worksheets:

| Pinned historical section | Concrete coverage |
| --- | --- |
| [Accessibility: delegation/map, lines 21–58](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L21-L58) | SPDS wrapper-to-Fluent documentation/behavior routing (audit B01). |
| [Accessibility: MessageBar and utilities, lines 112–219](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L112-L219) | SPDS prerequisites/no duplication, host API selection, repeated-message indicator and legacy assertive boundary (B03–B05); full V8/V9 bodies remain in Fluent. |
| [Accessibility: async and focus, lines 220–399](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L220-L399) | Product-specific result/focus cases, owners, cross-view infrastructure and exact-operation assertions (B06–B08). |
| [Accessibility: content, drag and scans, lines 400–424](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L400-L424) | RTE APIs/capabilities, drag keyboard/strings contract, scan outputs/limits and private helper boundaries (B09–B11; N01/N02). |
| [SPDS reference, lines 5–170](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md#L5-L170) | Component fit, package routes, styled API limits, typography and compound examples (B12). |
| [Theme reference, lines 11–46](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-theme-and-detheme.md#L11-L46) and [Detheme, lines 11–126](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/detheme/SKILL.md#L11-L126) | Surface ownership, neutral/provider/hook coverage, shim tests, nested themes, tokens and regression dimensions (B13), excluding operational gate mechanics. |
| [Localization, lines 5–210](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L5-L210) and [shared reuse, lines 27–151](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/shared-utility-reuse.md#L27-L151) | Concrete localized resources/counts/formatters/RTL and accessibility-relevant utility-fit principles (B14; N03). |
| [Replacement, lines 18–33](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-ref-replace-component/SKILL.md#L18-L33) and [comparison dimensions, lines 47–52](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-ref-replace-component/SKILL.md#L47-L52) | Replacement render/slot, geometry, focus, portal/provider, inner-control, dismiss and keyboard risks (B15). |

The source's repeated cross-cutting checklist/examples are routed, not duplicated:
`common.topic.component-accessibility`, `common.topic.forms-and-content`,
`common.topic.dynamic-content`, `common.topic.keyboard-focus`,
`common.topic.visual-accessibility`, `common.implementation.component-contract`
and `common.verification.testing` cover shared principles (B02).
`fluent.selection.components-and-utilities`, `fluent.v8.component-contract` and
`fluent.v9.component-contract` own shared Fluent documentation/API bodies.
Adjacent general architecture/review/performance material (B16) is outside this
SharePoint-specific edit; no whole-repository completeness claim is made here.

## Applicability, deliberate exclusions and unknowns

- The source requires SPDS stable-first for its **ODSP-Web host**, not every
  product. Identify installed package/version and actual delegated owner; native
  semantics, framework behavior and host/caller duties remain distinct.
- Do not promote historical source review commands, severity labels, required
  review artifacts or heading-evidence gates into reusable accessibility rules.
  Cross-cutting contrast language is not copied as a blanket requirement; Common
  owns scoped requirements and exceptions. Product teal is not a WCAG/MAS rule.
- Flight/KillSwitch operation, dependency updates, release commands, mock gate
  setup, evidence collection, provider/host ownership and workflow execution are
  excluded. Theme token/provider **contracts** and comparison conditions are
  retained without authorizing any operations.
- The drag source does not specify a completion key/API; the RTE and scan source
  does not supply complete function signatures/return types (except scan violation
  count). Focus helper overloads/attribute syntax and alert hook indicator details
  are also absent. Entries retain known names/behavior and explicitly avoid
  inventing the missing details. Source examples are informative, not runnable
  package implementations or AT observations.
- Official SPDS/utility sources remain pending independently of this historical
  migration. Linked external component implementations were not fetched or
  declared reviewed. Approval, current applicability and redistribution clearance
  are not established by the draft status or pinned citations.

The [support policy](profiles/support-policy.md) and
[support matrix](profiles/support-matrix.json) remain awaiting official input;
the matrix intentionally has no products/rules. No MAS IDs or support claims are
invented. Unsupported is not not-applicable, and source/schema validity is not
an observed pass. This package is read-only knowledge, with no execution authority.