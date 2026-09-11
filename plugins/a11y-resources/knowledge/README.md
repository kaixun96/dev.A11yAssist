# Accessibility knowledge for code generation and static review

Use these rules with any coding assistant or project. No particular framework,
component library, operating system, repository layout or development workflow
is required.

The default is **read-only, source-based analysis**. Read relevant supplied code
and documentation, explain risks and suggest minimal corrections. Do not edit
files, run commands or scanners, launch applications or browsers, control
assistive technology, or start another task. The calling coding assistant can
apply recommendations as part of its separately requested code-generation work.

## Choose by the changed behavior

| When | Read |
|---|---|
| Starting a review, choosing standards or expressing uncertainty | [Foundations](foundations.md) |
| Elements, components, names, roles, states, structure or relationships change | [Component semantics](component-accessibility.md) |
| Keyboard interaction, dialogs, navigation or focus can change | [Keyboard and focus](keyboard-focus.md) |
| Inputs, validation, images, icons, tables or media change | [Forms and content](forms-and-content.md) |
| Loading, results, errors, notifications or asynchronous updates change | [Dynamic content](dynamic-content.md) |
| CSS, themes, focus styling, contrast, layout, zoom or motion change | [Visual accessibility](visual-accessibility.md) |
| Tabs, dialogs/popovers, comboboxes, menus, trees or grids change | [Common widget patterns](widget-patterns.md) |

Read foundations and only the complete topics relevant to the request. Styles
and dynamic updates need review even when no accessibility attribute appears in
the diff. Do not expand a small review into an audit of the whole project.

## Adapt to the project

Identify the actual platform and component behavior from the available source
and documentation. Prefer native semantics or an existing accessible component.
Reuse a library's documented behavior rather than adding competing focus or
announcement logic. Never assume a specific library or invent an API.

Examples use standard HTML/CSS for web UI. In native UI, apply the analogous
platform accessibility concepts only when its APIs are known; do not recommend
HTML or ARIA attributes to a non-web control.

## Report what the source supports

Distinguish **source-supported issues**, **context needed**, and **runtime not
verified**. Explain the user impact, exact code evidence and minimal suggested
correction. Cite the relevant topic; include a criterion only when its mapping
is justified. Missing context is not proof of a defect.

If no definite issue is found, say so for the reviewed scope. Do not say that
accessibility passed, that assistive technology was tested, or that the UI
conforms to a standard. Do not initiate runtime verification to fill a gap.

Use the [standard report format](foundations.md#output-contract): reviewed scope,
source-supported issues, context needed, then runtime not verified. Each finding
includes location, severity, confidence, affected users, causal source evidence,
the topic/section reference and a minimal correction. Unknowns are not counted
as confirmed issues.

`index.json` selects topics; `manifest.json` records this snapshot's version and
content hashes. Neither is a runtime test result.
