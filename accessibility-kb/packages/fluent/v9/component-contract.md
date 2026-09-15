# Fluent V9 component, announcement and focus contracts

Status: draft. Owner: unassigned.
Source ID: `agentow-accessibility` (historical-reference, historical).

Historical-derived guidance for a confirmed Fluent UI React V9 dependency, not
official MAS requirements or current owner approval. Record the resolved version,
component imports, wrappers, provider ancestry and actual rendered composition.
The historical source does not pin an installed V9 patch version. Use its concrete
rules below with version-matched documentation; do not transfer V8 defaults.

## Preserve the component's semantic composition

Basis: [V9 ownership](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L21-L58)
and [usage checklist and examples](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L425-L536).

- Use documented slots, subcomponents and wrapper hierarchy. Do not add custom
  keyboard handling or ARIA around behavior that the component already supplies.
- Supply contextual names and necessary descriptions through the documented
  visible text, `Field`, `label`, `aria-label` or `aria-labelledby` pattern. Verify
  required state/relationship props for the actual usage, including validation,
  selection, expanded state and transient-surface labeling.
- Preserve documented trigger, entry, navigation, dismissal and restoration
  behavior. Custom rendering and slot overrides must not disconnect that model.
- Keep decorative icons out of assistive output; do not assume an icon names its
  action. Check component output before adding duplicate names/descriptions.

Concrete examples: an icon-only close `Button` needs a localized accessible name
such as `aria-label={strings.closeDialog}`; `icon={<DismissRegular />}` alone does
not supply that context. A `DialogSurface`/`DialogBody` with content but no
documented labeling structure is not enough: use `DialogTitle` with the localized
title in that composition, then verify the dialog's computed name. This example
establishes labeling, not a complete trigger or focus implementation.

The source describes SPDS as a V9 styling redesign, not an independent
accessibility implementation. For a confirmed V9-backed wrapper, inspect its
export, exposed props and documented behavior overrides before applying this
contract. A styling/composition difference alone is not a separate announcement
mechanism. Product routes remain in `sharepoint.spds.component-contract`.

## MessageBar: intent plus one ancestor AriaLiveAnnouncer

Basis: [V9 MessageBar prerequisites and composition](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L112-L156)
and [no-duplication boundary](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L173-L181).

1. Trace the application root first. Built-in MessageBar intent announcements
   require one `AriaLiveAnnouncer` high in the React tree, above every MessageBar
   that needs to announce. Reuse the host's provider; do not add another at the
   feature or MessageBar level.
2. Use the documented `intent` preset. Do not customize `politeness` unless an
   accessibility owner has confirmed that the preset is wrong for the specific
   experience. This draft has no such approval. The historical source does not
   enumerate intent-to-politeness values, so this entry does not invent them.
3. Do not put `role="alert"`, `role="status"` or ad hoc `aria-live` on the bar,
   its parent, `MessageBarBody`, or a duplicate hidden element. These can bypass
   or duplicate the intended mechanism.
4. Do not call `useAnnounce`, `ScreenReaderAlert` or another live-region utility
   for the same error/warning. Once the ancestor and intent are correct, that
   event is already owned. A distinct completion/result transition is different.
5. In `MessageBarGroup`, each MessageBar must remain a direct child for the
   documented animation contract. When retry belongs to the message, prefer its
   documented action slots/composition rather than an intervening group wrapper.

Example root composition, adapted from the pinned source (`appTheme` and `App`
are application-owned):

```tsx
import { AriaLiveAnnouncer, FluentProvider } from '@fluentui/react-components';

<FluentProvider theme={appTheme}>
  <AriaLiveAnnouncer>
    <App />
  </AriaLiveAnnouncer>
</FluentProvider>
```

A child surface can show an error and a sibling retry without an alert wrapper:

```tsx
<div>
  <MessageBar intent="error">
    <MessageBarBody>{strings.DownloadError}</MessageBarBody>
  </MessageBar>
  <Button onClick={onDownload}>{strings.RetryButton}</Button>
</div>
```

This is not a MessageBarGroup child template: the enclosing `div` must not be
inserted between a group and its bar. Imported components, resources and handlers
come from the owning application; no product package route is prescribed here.

| Case | Correct response | Counterexample to reject | Verification |
| --- | --- | --- | --- |
| Error bar has intent but no ancestor announcer | Provide the missing prerequisite at the application boundary | Add `role="alert"` to MessageBarBody to compensate | Trace the actual host/test tree, trigger failure, and check one meaningful announcement |
| Host already supplies the announcer | Reuse it and the intent preset | Add a nested feature provider, hidden duplicate error, or manual `announce` for that error | Check provider ancestry and all event paths; observe no doubled speech |
| Error bar and separate retry | Preserve a named, keyboard-reachable retry; use documented actions if part of the message | Reshape group children to obtain layout | Inspect child structure; test retry, dismissal/animation and focus |
| Caller overrides `politeness` | Require experience-specific owner confirmation and version-matched behavior evidence | Treat assertive urgency as a blanket improvement | Verify the approved urgency/timing without assuming a guessed preset mapping |

## General announcements and modes: only for an unowned event

Basis: [provider-backed announcements](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L179-L219)
and [async stack selection](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L220-L296).

For dynamic status, save/error results or information not naturally announced by
focus or a component, use `useAnnounce()` in the subtree of the established
`AriaLiveAnnouncer`. The source describes `announce` as memoized and
provider-backed; use it directly rather than inventing a wrapper contract:

```tsx
const { announce } = useAnnounce();
// In the handler for an otherwise unannounced outcome:
announce(message);
```

Call the hook in its valid React component/hook context and send the localized
message for the actual event, not unconditionally on every render. If a test
exercises this path, supply the announcer at the test boundary instead of adding
a feature-local provider to make the test work.

- Prefer the host's established mechanism. In a SharePoint surface with a working
  shared announcement API, do not add a provider just to replace it or invoke both
  paths for one event. The shared API's `ReadAfterOtherContent` (routine),
  `ReadImmediately` (urgent), repeat-message `indicator`, and legacy assertive
  route are defined in `sharepoint.utilities.announcements-and-focus`, not Fluent
  modes or props. Do not transplant that protocol into `useAnnounce`.
- Preserve appropriate urgency: use MessageBar presets for its messages and the
  installed utility's documented mode for independent status. The source shows
  `announce(message)` but does not specify its default politeness or a universal
  repetition option. Verify supported behavior instead of guessing either.
- `useTypingAnnounce()` is only for its documented typing scenario; it is not a
  generic replacement for collection-result status.
- Bind the transitions from `common.topic.dynamic-content` to this V9 owner:
  loaded count, empty state, appended/end results, sort/filter/search and
  refresh/no-change each need their applicable localized outcome. A correctly
  configured error MessageBar covers its error, not these separate outcomes.
  Avoid per-item speech during bulk loading. Verify repeated identical results
  through the chosen API's supported mechanism, not a new parallel live region.

Verification example: focus stays on Refresh while results update. Confirm the
useful localized result/no-change message is sent once for each completed request,
including two identical outcomes. Test zero, one and multiple results using the
host's formatter; no spinner-only or `aria-busy`-only completion, doubled event
subscription, focus jump, or English-only count construction should pass.

## Focus owner and restoration hooks

Basis: [focus owner order, lifecycle and shim boundaries](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L399).

1. **Component first.** Preserve documented Tabster behavior for Dialog, Popover,
   Menu, Drawer and composite/roving-focus widgets: focus entry, containment,
   navigation and trigger restoration. Use component props/composition first;
   `trapFocus` is appropriate only where that surface's V9 contract supports and
   requires containment. Do not add imperative `focus()` or `A11yManager` around
   behavior it already owns.
2. **Explicit V9 restoration.** If the trigger/surface need restoration the
   component does not supply, inspect installed exports and use the documented
   `useRestoreFocusTarget`/`useRestoreFocusSource` pairing. Attach source/target
   refs according to that version's contract, keeping the trigger mounted long
   enough to restore. The historical source names the pair but supplies no hook
   signature/ref wiring example; do not infer one or add a second SharePoint
   restore owner for the same close lifecycle.
3. **Local removal while a surface remains.** For a disappearing toolbar command,
   row, inline action or toast action, move focus after commit to a named persistent
   target in the workflow only when the focused element is removed. Prefer a
   persistent toast target while the toast remains; restore to the operation's
   trigger when the whole toast closes. Local replacement alone is not a reason
   to introduce `A11yManager`.
4. **Beyond Fluent ownership.** SharePoint shell/canvas or cross-view navigation
   may belong to `A11yManager`; legacy/unmanaged DOM may use `Focus`. Route those
   implementations through `sharepoint.utilities.announcements-and-focus`, not
   a second local V9 convention. `useRestoreFocusOnDismiss`, `ModalShim` and
   `FocusTrapZoneShim` are migration-layer routes, not native V9 fixes.

Neither Fluent hooks nor a page-level restore manager can focus a node that no
longer exists. Capture the active element before the operation; identify the
semantic replacement or deterministic fallback and restore only after it mounts.
Use `common.topic.keyboard-focus` for the shared transition matrix.

| Exact interaction | Do / expected active element | Don't |
| --- | --- | --- |
| Close a V9 dialog/menu, including abrupt unmount or animation completion | Use the owning documented trigger restoration; assert the persistent trigger or named fallback | Race component restoration with an extra `focus()`/page manager |
| Last selection removes a toolbar while focus remains in a row | Leave focus in the still-mounted row | Steal focus merely because selection changed |
| Focused toast action disappears but toast remains | After commit focus the named persistent toast target; when the toast closes use the operation trigger/fallback | Let focus fall to body or introduce page-level management for a local replacement |
| Refresh replaces a focused row | Preserve stable identity or focus its semantic replacement after commit | Assert only that the replacement row exists |

Each focused test starts at the affected control, performs the exact operation,
and asserts `document.activeElement` after update/close, including missing-trigger
fallbacks. Check visibility, enabled state and operability, not only DOM presence.
These are verification examples, not observed results. Use
`common.verification.testing` and `common.verification.dynamic` for evidence limits.
Return to [selection](../selection/components-and-utilities.md) for component
documentation and replacement risks; this entry grants no execution authority.