# Fluent V8 announcements and focus

Status: draft. Owner: unassigned.
Active source status and entry bindings: [package metadata](../package.json).

Draft guidance for a confirmed Fluent UI React V8 surface, not an
official MAS rule or an assertion about every V8 release. Identify the installed
`@fluentui/react` version, component, overrides, wrappers and rendered output.
No exact V8 patch version or replacement API for every override is specified
here. Consult that version's implementation when these assumptions
differ; a V9 documentation page cannot resolve a V8 contract.

## MessageBar owns its announcement by default

Use these defaults for the confirmed V8 composition:

- With default `delayedRender` behavior, MessageBar inserts its content into an
   internal live region after a short delay. This guidance does not specify a delay
   duration; do not encode a guessed timeout as an API guarantee.
- Message types `error`, `blocked` and `severeWarning` also receive the component's
   alert role. Other types use its documented status behavior. This is the V8
   message-type contract, not the V9 `intent`/provider contract.
- Count this component-owned announcement as feedback for its own error, warning
   or status transition. Do not demand nearby explicit announcement code.
- Do not add `Announced`, `ScreenReaderAlert`, a second live region, or an enclosing
   `role="alert"`/`role="status"` for the same MessageBar content.

### Overrides require inspection, not a second announcer by reflex

`delayedRender={false}`, a role override, a conditional wrapper, a shim, a portal
or a migration layer can change the default composition. Trace the installed
MessageBar implementation and the rendered result before deciding it is broken.
Report a gap when the built-in announcement is disabled/broken and no documented
V8 replacement supplies it. Neither `delayedRender={false}` alone nor the absence
of `Announced` alone proves an announcement defect.

Do not prescribe a universal replacement for these overrides: none is defined
here. Identify the actual disabled behavior and the
installed version's supported replacement; an unresolved contract is
context-needed, not permission to copy V9 `AriaLiveAnnouncer` into a V8-only tree.

| Scenario | Do | Don't | Verification example |
| --- | --- | --- | --- |
| Default V8 error MessageBar appears after a failed operation | Leave ownership with MessageBar; keep retry reachable | Render `Announced` with identical error text or put the bar inside another alert | Exercise failure from the initiating control; inspect internal role/live-region output and check that AT speaks the error once |
| Default non-alert message type | Preserve the V8 status behavior | Force all messages to an alert because the message matters | Check the actual message type and announcement timing in the installed implementation and AT |
| `delayedRender={false}` or a role/portal override | Inspect what changed and use a documented V8 replacement only if needed | Declare all such overrides silent, or add a second announcer without tracing the first | Compare default and overridden composition for that exact transition, including late mounting and repeated outcomes |
| Separate collection completion after retry succeeds | Supply the established V8 status path if no component announces completion | Assume the earlier error bar also announces the loaded count | Retry, then verify useful localized completion/count feedback without repeating the old error |

These are expected verification outcomes, not reports of executed AT tests.

## Async collection status: V8 mechanisms only

Apply the full transition matrix in `common.topic.dynamic-content`; use this V8
binding rather than repeating that cross-product matrix:

1. Preserve `DetailsList`/`FocusZone` keyboard and focus behavior. Inspect the
    actual collection and installed V8 source before adding status or focus code.
2. Use the V8-supported announcement/status mechanism already established by the
    surface. `Announced` is an example only when that installed version and surface
    use it; it is not a mandatory companion to MessageBar.
3. Keep completion/count, empty, append/end, sort/filter/search, refresh/no-change
    and retry-success outcomes distinct from a MessageBar's own transition. A
    spinner or `aria-busy` does not substitute for result feedback.
4. For each applicable transition identify visible feedback, programmatic/AT
    feedback and the focus destination. Use localized message resources and the
    host's supported plural/count and repeat-message behavior. Do not invent a
    V8 `indicator` prop from another stack's API or promise that the same unchanged
    string automatically reannounces.

For a host-owned shared announcement utility, route by stable ID to
`sharepoint.utilities.announcements-and-focus` when the SharePoint package is
selected. Its reading modes and repetition protocol are not V8 component APIs.

## Focus: V8, native V9 and compatibility layers are different owners

- Preserve the V8 component's documented keyboard/focus model and established
   trigger restoration; do not replace `FocusZone` behavior with guessed V9 hooks.
- A modal/panel implemented through the Fluent migration layer should use that
   layer's established `useRestoreFocusOnDismiss`, `ModalShim` and
   `FocusTrapZoneShim` support. Confirm the layer and its exports first: these are
   compatibility APIs, not universal V8 exports and not native V9 recommendations.
- V9 `useRestoreFocusTarget`/`useRestoreFocusSource` belong to a confirmed native
   V9 lifecycle; see the [V9 contract](../v9/component-contract.md). A similarly
   named V8 control does not establish their applicability.
- SharePoint page/canvas or cross-view focus ownership and unmanaged-DOM utilities
   belong to `sharepoint.utilities.announcements-and-focus`. Do not add a second
   restore owner around an already managed component.
- No restoration mechanism can focus an unmounted trigger. Name its semantic
   replacement or persistent fallback and perform restoration after it mounts.

Verification example: open a shim-backed panel from its persistent trigger,
exercise each supported dismiss path, and assert that `document.activeElement`
returns to that trigger after close/animation. Also remove the trigger in the
tested flow and assert the named fallback. A test that merely finds the trigger
in the DOM does not prove restoration. For a row removed during refresh or a
disappearing toolbar command, assert the exact post-update destination, not just
generic tab order. Shared transition requirements remain in
`common.topic.keyboard-focus` and `common.verification.testing`.

Use [selection](../selection/components-and-utilities.md) for mixed-version
replacement risks. Source-only inspection cannot establish observed speech,
keyboard success or conformance; this entry grants no execution authority.