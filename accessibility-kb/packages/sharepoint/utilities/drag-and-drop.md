# SharePoint keyboard-accessible drag and reorder

Status: draft. Owner: unassigned.
Active source status and entry bindings: [package metadata](../package.json).
Entry ID: `sharepoint.utilities.drag-and-drop`.

Scope: ODSP-Web draft guidance, not current-approved drag API documentation.

## Product interaction protocol

For SharePoint drag/reorder UX, prefer `@msinternal/sp-dragzone` to a mouse-only
implementation. Use the exported `IDragZoneA11yStrings` and
the following keyboard contract, not a universal keyboard standard:

| Phase | Behavior and caller responsibility |
| --- | --- |
| Begin | Enter or Space starts the keyboard drag from the handle. Supply localized `moveStarted`. |
| Move | Arrow keys move within the interaction. Preserve the package's screen-reader move-state announcements, rather than adding a parallel live region. |
| Disallowed move | Supply localized `moveNotAllowed`; the user must receive the blocked-move state, not only a visual indication. |
| Cancel | Escape cancels. Supply localized `moveCancelled` and preserve focus return to the handle. |
| Complete | Supply localized `moveComplete` and preserve focus return to the handle. **The completion key and public completion API are not specified here.** Do not invent Enter/Space-to-drop. |

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

These examples combine the product protocol with dynamic-focus rules.
They are not observed outcomes. Assert the exact operation's final active
element and each applicable phase message, including cancellation, completion,
disallowed movement and repeated moves. See `common.verification.testing` and
`common.topic.keyboard-focus` for shared test and alternative-interaction principles.

This guidance specifies no constructor/component signature, drag-coordinate
algorithm, string placeholders, arrow orientation rules or completion key. Keep
those as installed-contract questions, not guessed APIs. This KB does not
execute drag operations, AT or provider workflows.