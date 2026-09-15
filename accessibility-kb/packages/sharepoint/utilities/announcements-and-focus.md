# SharePoint announcement and focus contracts

Status: draft. Owner: unassigned.
Source ID: `agentow-accessibility`.

Scope: historical ODSP-Web guidance at AgentOW revision
`7896845e51d75b0b9d632a2fd61876bc2f556ea5`, not current-approved utility
documentation. Installed version, host conventions and actual wrapper/provider
coverage govern applicability. Source examples below do not imply runtime or AT
verification. Shared transition principles remain in `common.topic.dynamic-content`
and `common.topic.keyboard-focus`; this entry supplies the product API choices
and concrete product scenarios.

## One announcement mechanism per event

[Source: announcements, lines 179–219](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L179-L219)
and [stack selection, lines 258–294](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L258-L294).

First determine whether focus or the selected component already communicates
this event. SPDS inherits the underlying Fluent V9 behavior; do not create an
SPDS-specific announcement path. In particular, an SPDS-backed V9 `MessageBar`
under the required application `AriaLiveAnnouncer` owns its intent announcement.
The full contract is `fluent.v9.component-contract`; V8 built-in behavior and
override caveats belong to `fluent.v8.component-contract`.

| Owning surface / uncovered event | Historical mechanism and boundary |
| --- | --- |
| V9 host with ancestor `AriaLiveAnnouncer` | Use provider-backed `useAnnounce()` for status not owned by the component. Use the memoized `announce` directly; a required provider belongs at the application or test boundary, not a new feature-local provider. |
| SharePoint surface convention already uses shared React alert | Keep `@msinternal/screen-reader-alert`: `useScreenReaderAlert`, `ScreenReaderAlert` or `ScreenReaderAlert.read`. Do not migrate a working mechanism merely to standardize on V9, or invoke both. |
| Neither mechanism established on a SharePoint-owned surface | Choose the one fitting the host's dependency/provider convention. This does not justify adding both as fallback. |
| Existing legacy assertive surface | `@msinternal/sp-a11y` exports `ScreenReader.alert(id, message)`; the source says it always creates an assertive alert. Preserve only where the host already uses that pattern, not for new routine sort/load completion. |
| V8-only collection | Preserve installed `DetailsList`/`FocusZone` navigation and existing V8 status mechanism; `Announced` is conditional on the installed version/surface. Do not introduce a V9 provider into a V8-only subtree. |

`useTypingAnnounce()` is only for its documented typing scenario, not a generic
replacement-result API. A component-owned error does not cover separate loaded
counts, sort results or end-of-list events. See the [duplicate case](../cases/duplicate-announcement.md).

**Alternative examples, not two paths for the same save:**

```tsx
// V9 alternative: the host/test boundary already provides AriaLiveAnnouncer.
const { announce } = useAnnounce();
// In the owning completion event, with a complete localized message:
announce(message);
```

```tsx
import { ReadingMode, useScreenReaderAlert } from '@msinternal/screen-reader-alert';

// Shared SharePoint React alternative, called as a hook in the component:
useScreenReaderAlert(
  strings.SaveSucceeded,
  ReadingMode.ReadAfterOtherContent,
  saveState === 'succeeded'
);
```

The source also supplies `<ScreenReaderAlert message={message} />` and
`ScreenReaderAlert.read(message, mode)`. Use `ReadAfterOtherContent` for routine
changes; reserve `ReadImmediately` for urgent errors. For the same text to be
announced again, increment the **component** `indicator` for each new result
event; do not treat equal text as the same event. Example of that documented
component mechanism (the counter is caller state, not a new hook argument):

```tsx
<ScreenReaderAlert message={strings.SaveSucceeded} indicator={saveResultIndicator} />
```

The source does not give a hook indicator parameter, full prop types or the
indicator's initial value. Do not invent them. Validate repeated outcomes with
the installed API; the simple success-boolean hook example alone does not prove
identical successive successes are reannounced. The legacy implementation is
identified historically as ScreenReader in the **odsp-common utilities/browser
accessibility** area, not as a second recommended routine-result implementation.

## Async SharePoint collections: concrete result/focus cases

[Source: transitions, lines 220–299](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L220-L299).

Use these product integrations with the Common state-transition model. Select
SPDS exposed props/slots through its stable/LazyComponents wrapper, and identify
one owner for each result. The message examples describe **resource meanings**,
not literal English strings to put in UI.

| Transition | Product integration, feedback and focus outcome |
| --- | --- |
| Initial → loading | Visible loading; component-supported busy/loading state; remove misleading stale counts. Keep the invoking control/row if it remains. A spinner or `aria-busy` is not completion speech. |
| Loading → loaded | If focus stays, selected host mechanism announces a localized loaded count/summary; do not announce every item. |
| Loading → empty | Render and announce the localized empty outcome; a blank grid is not feedback. Keep a useful initiating control or contracted empty-state destination. |
| Loading → error / retry | Component `MessageBar` can own the error once. Keep retry keyboard reachable. Retry success/empty is a distinct event needing its own outcome, not covered by the earlier error bar. If retry disappears, use the persistent next step. |
| Load more → appended | Preserve focus on the invoking control unless the owning component specifies otherwise; announce added or total count, not each appended row. |
| Load more → end | Expose/announce no more items; if the command is disabled or removed, preserve logical focus through the collection's deterministic fallback. |
| Sort/filter/search → replaced/reordered | Controlled DataGrid state exposes the active operation; announce order/filter/query result and count with the established mechanism. Preserve stable row/control identity or its semantic replacement after commit. |
| Grouping or paging replaces items | Inspect each reachable loading/result transition, retain the component's keyboard model and recover a replaced target after commit. Grouping is in source scope but no distinct grouping API/message signature is supplied. |
| Explicit refresh → updated / no change | Announce a meaningful outcome even when the count/text repeats. Use supported event/indicator/message-update handling rather than leaving an indistinguishable stale message or globally filtering repeated text. Keep focus stable. |

All loading, count, error, empty, sort/filter, append and end-state strings use
[localized complete resources](localization-and-formatting.md). Each case needs
visible, programmatic/screen-reader and focus outcomes. An error MessageBar
cannot stand in for the entire matrix. Never recommend only “add aria-live.”

### Review severity for missing status and focus

[Source: severity calibration, lines 299–312](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L299-L312).
The historical AgentOW review scale classifies a missing perceivable completion,
replacement, append, sort/filter, empty or error outcome as **Important**. Use
**Minor** only when the transition is already perceivable and the change improves
wording or reduces redundant speech. A visible spinner or changed rows do not
lower the severity of a missing programmatic result.

Likewise, keyboard-triggered removal/replacement that leaves focus on body, a
detached node, a non-interactive wrapper or an unrelated control without a
documented accessible destination is **Important**. **Minor** applies only if
focus already reaches a logical, visible, enabled destination and the remaining
detail is non-blocking. “By design” alone does not justify lowering severity;
require the interaction contract and focused test evidence. These are the source
review labels, not MAS classifications or a replacement for a product's rubric.

## Focus owner and lifecycle

[Source: dynamic focus, lines 314–399](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L399).

1. Preserve SPDS/Fluent V9 component-owned Tabster entry, containment, roving
   navigation and trigger restoration (`Dialog`, `Popover`, `Menu`, Drawer and
   composites). `trapFocus` applies only to a component contract supporting and
   requiring containment. Do not layer imperative focus or `A11yManager` on top.
2. For explicit V9 restoration not already owned by the component, use the
   `useRestoreFocusTarget` / `useRestoreFocusSource` pairing described in
   `fluent.v9.component-contract`, with a surviving trigger. No second SharePoint
   restore owner for the same lifecycle.
3. For a local V9 toolbar/toast/inline action/row that disappears while its
   containing workflow stays, focus a named persistent target **after commit**.
   This alone is not a reason to introduce `A11yManager`.
4. For SharePoint page/canvas, cross-view transitions or async loading across
   component boundaries, use the area's existing `A11yManager`
   `saveActiveElementAs` / `restoreFocus` pattern or established hierarchical
   navigation. Identify capture time, eventual mounted destination and fallback.
   The source names the methods, not their parameter signatures.
5. For legacy/custom/unmanaged DOM outside Tabster ownership,
   `@msinternal/sp-a11y` `Focus` can locate descendants, parents or siblings,
   test focusability, perform `focusInside`, `focusTo`, `focusOutOf`, and check
   `hasFocus`; shadow-DOM-aware variants exist where needed. With an already
   known destination, prefer native focus and the established local pattern
   rather than using DOM search to hide an unspecified destination.

Other historical exports: `FocusTransition` represents/walks source-to-destination
movement; `Keyboard` provides `isEscape`, `isEnter`, `isTab`, `isShiftTab` and
modifier-aware `isKey` (including Ctrl/Cmd differences). `A11yAttribute` with
`A11yManager` supports existing declarative navigation through `AlertOnFocusIn`,
`AlertOnFocusOut`, `NavigateOnKey`, `NavigateByHierarchy`, `SkipKeys` and `StopKeys`.
These are page-level infrastructure, not a replacement for native V9 focus.
The source does not provide attribute syntax or helper overloads; none is inferred.

For **migration-layer**, not native V9, panels/modals use the layer's established
`useRestoreFocusOnDismiss`, `ModalShim` and `FocusTrapZoneShim` support. Consult
`fluent.v8.component-contract` / `fluent.v9.component-contract` for framework
details. Neither Fluent restoration nor `A11yManager.restoreFocus()` can focus
a node that no longer exists; the semantic replacement/fallback must mount first.

### Product lifecycle examples and regression assertions

The following applications of source lines 314–343 are informative test cases;
they do not claim any observed behavior:

| Exact operation | Expected post-update active element / non-stealing rule |
| --- | --- |
| Refresh/retry/page/sort/filter replaces focused row or command | Same stable identity if retained, otherwise its mounted semantic equivalent. |
| Delete the focused item | Contracted next item, previous item, collection or initiator; choose deterministically rather than browser fallback. |
| Selection mounts a toolbar | Do not move focus just because selection changed. |
| Last deselection removes selection-only UI | Keep focus on a still-mounted collection row. Only if focus was inside the disappearing toolbar, use a persistent neighbor or selected-item/collection fallback. |
| Toast action completes but toast remains | Focus the persistent toast target. If the whole toast closes, restore to the operation trigger or documented surviving fallback. |
| Inline confirmation, Replace/Keep both or retry action completes and disappears | Initiator or persistent next step after commit; handle a missing original trigger explicitly. |
| Save/upload/background completion | Keep focus where the user left it unless the contract requires navigation; announce separately. |
| Modal/panel/popover/menu/teaching surface closes, unmounts abruptly or finishes animation | Owning component restoration, with a logical fallback if the trigger was removed. |

Assert `document.activeElement` after the exact keyboard-triggered operation,
not merely that a target exists or general Tab order works. Destinations must
be visible, enabled and operable; body, detached nodes, inert wrappers and
unrelated earlier controls are not successful restoration. Review stable keys,
conditional branches, virtualized rows and cleanup effects. “By design” is not
evidence for a surprising jump. Use `common.verification.testing` for test design;
source inspection alone cannot establish speech or a checked pass. No runtime,
provider, lease or workflow operation is authorized here.