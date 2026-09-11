# SharePoint and ODSP accessibility

These project-specific references are usable for static implementation guidance
without AgentOW, DevBoxes, resource leases or a remediation workflow.
Read the whole matching source section, not just this topic map.

| Scenario | Complete source |
|---|---|
| `@msinternal/screen-reader-alert`, `useScreenReaderAlert`, reading modes, repeated messages and legacy `ScreenReader.alert` | [Accessibility utilities and announcement contracts](snapshot/skills/ow-review/references/accessibility.md.source.md) |
| `@msinternal/sp-a11y`, `A11yManager`, page/canvas/cross-view focus and avoiding competing restoration owners | [Focus management and keyboard navigation](snapshot/skills/ow-review/references/accessibility.md.source.md) |
| `sp-a11y-checker-util`, rich text/content checks, `sp-dragzone` and keyboard drag/drop | [Repository accessibility utilities](snapshot/skills/ow-review/references/accessibility.md.source.md) |
| Authoring-page Accessibility Assistant, automated versus real AT evidence | [Test and audit tools](snapshot/skills/ow-review/references/accessibility.md.source.md) |
| `sp-client` versus `odsp-common` stable/bundle import paths, LazyComponents and fallback hierarchy | [SharePoint design-system component reference](snapshot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md.source.md) |
| SharePoint themes, semantic tokens, forced colors and detheme constraints | [Theme reference](snapshot/skills/ow-review/references/sharepoint-theme-and-detheme.md.source.md) and [detheme skill](snapshot/copilot/skills/detheme/SKILL.md.source.md) |
| Existing shared utilities instead of local duplicates | [Shared utility reuse](snapshot/skills/ow-review/references/shared-utility-reuse.md.source.md) |
| Localized labels/messages and content formatting | [Localization and formatting](snapshot/skills/ow-review/references/localization-and-formatting.md.source.md) |
| Review applicability, missed cases and complete rule routing | [SP client profile](snapshot/docs/sp-client-review-profile.md.source.md), [review contract](snapshot/docs/review-contract.md.source.md), [review misses](snapshot/docs/review-misses.md.source.md), [complete rule registry](snapshot/review-rule-registry.json.source.txt) |

Project paths mentioned in these sources belong to the original product
repositories. Those repositories, internal implementation files and linked
services are not copied into this package. Preserve that distinction: a named
API or repository path is not proof of current availability or authorization.
