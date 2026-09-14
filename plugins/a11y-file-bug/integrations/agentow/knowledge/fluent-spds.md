# SPDS and Fluent V8/V9 accessibility

This is a navigation layer, not an abbreviated substitute for the full sources.
Read the relevant complete references below. Identify the actual package/version;
ODSP-specific import precedence does not apply to an unrelated Fluent project.
Reading these documents never requires an AgentOW run or authorizes execution.

| Scenario | Complete source and sections |
|---|---|
| SPDS relationship to Fluent V9; labels, roles, states, semantics and official component guidance | [Accessibility reference](snapshot/skills/ow-review/references/accessibility.md.source.md), opening component contract and Fluent V9 reference map |
| V9/SPDS `MessageBar`, root `AriaLiveAnnouncer`, intent and avoiding duplicate live regions | [Accessibility reference](snapshot/skills/ow-review/references/accessibility.md.source.md), SPDS and Fluent V9 MessageBar announcement contract |
| V8 `MessageBar`, `delayedRender`, announcement ownership and version-specific exceptions | [Accessibility reference](snapshot/skills/ow-review/references/accessibility.md.source.md), Fluent V8 MessageBar announcement contract |
| Loading, sorting, filtering, paging, retry, error/empty state and repeated announcements | [Accessibility reference](snapshot/skills/ow-review/references/accessibility.md.source.md), Async collection state and announcement contract |
| Focus entry, containment, restoration, owner selection and V8/V9 differences | [Accessibility reference](snapshot/skills/ow-review/references/accessibility.md.source.md), Focus management and keyboard navigation |
| `Table` versus `DataGrid`; controlled interaction; stable/LazyComponents exports | [Design-system reference](snapshot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md.source.md), Component-fit analysis and Review checklist |
| Compound component composition; Breadcrumb overflow action versus navigation | [Design-system reference](snapshot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md.source.md), Compound component boundaries |
| Theme tokens, forced colors, focus indicators and high contrast | [Theme reference](snapshot/skills/ow-review/references/sharepoint-theme-and-detheme.md.source.md), plus cross-cutting rendered UI checks in the accessibility reference |
| Replace-component migration constraints and source inspection | [Replace-component skill reference](snapshot/copilot/skills/ow-ref-replace-component/SKILL.md.source.md) |

The original official documentation links are preserved inside the references;
they are not a locally mirrored Fluent Storybook or a promise that every
component's API is documented here. Use the actual installed implementation when
the source snapshot does not establish a behavior. No API or missing evidence is
filled in by guesswork.
