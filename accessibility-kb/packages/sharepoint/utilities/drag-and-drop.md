# SharePoint keyboard-accessible drag and reorder

Status: draft. Owner: unassigned.
Source ID: `agentow-accessibility`.
Entry ID: `sharepoint.utilities.drag-and-drop`.

Scope: historical ODSP-Web guidance at AgentOW revision
`7896845e51d75b0b9d632a2fd61876bc2f556ea5`; not current-approved drag API
documentation. [Source: sp-dragzone, lines 410–413](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L410-L413).

## Product interaction protocol

For SharePoint drag/reorder UX, prefer `@msinternal/sp-dragzone` to a mouse-only
implementation. The source records the exported `IDragZoneA11yStrings` and
the following keyboard contract, not a universal keyboard standard:

| Phase | Historical behavior and caller responsibility |
| --- | --- |
| Begin | Enter or Space starts the keyboard drag from the handle. Supply localized `moveStarted`. |
| Move | Arrow keys move within the interaction. Preserve the package's screen-reader move-state announcements, rather than adding a parallel live region. |
| Disallowed move | Supply localized `moveNotAllowed`; the user must receive the blocked-move state, not only a visual indication. |
| Cancel | Escape cancels. Supply localized `moveCancelled` and preserve focus return to the handle. |
| Complete | Supply localized `moveComplete` and preserve focus return to the handle. **The source does not identify the completion key or public completion API.** Do not invent Enter/Space-to-drop. |

Keep those four messages in product resources with translator context; route
formatting to [localization and formatting](localization-and-formatting.md).
Do not use English literals, one generic message for every phase, or both the
drag component's announcer and a caller alert for the same move event.

## Informative positive/negative cases

- **Positive:** a keyboard user focuses the handle, begins with Enter or Space,
  moves with arrows, hears the move state, cancels with Escape and returns to
  the handle. A separate case completes using the installed package's documented
  completion interaction and exposes `moveComplete` once.
- **Negative:** HTML drag handlers work only with a mouse, or arrow movement
  changes order without the shared package's feedback/focus protocol.
- **Negative:** cancellation removes the focused handle and lets focus fall to
  body; announcing “cancelled” alone does not restore operability.
- **Boundary case:** reordering or rerendering replaces the handle. Use stable
  identity or a named semantic replacement/fallback after commit under
  [focus ownership](announcements-and-focus.md), rather than racing two owners.

These examples combine the product protocol with the source's
[dynamic-focus rules, lines 314–343](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L343).
They are not observed outcomes. Assert the exact operation's final active
element and each applicable phase message, including cancellation, completion,
disallowed movement and repeated moves. See `common.verification.testing` and
`common.topic.keyboard-focus` for shared test and alternative-interaction principles.

The pinned source supplies no constructor/component signature, drag-coordinate
algorithm, string placeholders, arrow orientation rules or completion key. Keep
those as installed-contract questions, not guessed APIs. This KB does not
execute drag operations, AT or provider workflows.