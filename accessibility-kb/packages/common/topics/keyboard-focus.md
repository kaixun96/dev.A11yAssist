# Keyboard and focus

Review the paths visible in source; do not drive the UI to confirm them.

## Reach, operate and dismiss

- Keep ordinary tab order aligned with a meaningful DOM order. Positive
  `tabindex` values are a risk, not a substitute for fixing source order.
- Native controls supply standard keyboard activation. Do not add handlers that
  make a native button fire twice on Enter or Space.
- Custom widgets need the keyboard model appropriate to their actual role.
  Do not require every key on every widget, turn a simple list into a grid,
  or use `role="application"` as a general accessibility fix.
- Check indiscriminate `preventDefault`, swallowed Tab/Escape events, hover-only
  actions, drag-only paths and shortcuts that conflict with text editing or
  composition. Provide keyboard operation and, for drag functions where required,
  a non-drag single-pointer alternative.
- For composite widgets, inspect one coherent roving-tabindex or
  active-descendant strategy, with stable IDs and a valid active item. Do not mix
  strategies unless the component contract explicitly calls for it.

## Focus lifecycle

Trace the currently focused element, nodes that may unmount, the intended
destination and when it becomes available. Missing imperative `focus()` is not
proof of a defect when a native element or component already manages it.

| Source transition | Review question |
|---|---|
| Open a modal dialog | Is it named, and does its implementation establish appropriate focus and containment? |
| Close or unmount transient UI | Is focus restored to the trigger or another persistent logical destination? |
| Delete the focused item | Is there a deterministic next/previous item or other meaningful destination? |
| Hide a selection toolbar | Is focus preserved unless it was inside the disappearing toolbar? |
| Refresh, sort, filter or replace items | Does stable identity preserve the active control, or is there a deliberate fallback? |
| Finish an asynchronous operation | Is focus left with the user unless navigation or the interaction requires movement? |
| Route or view change | Is there an intentional destination rather than a detached node or arbitrary focus jump? |

Do not assume every popover is modal or needs a focus trap. A modal's background
must be non-interactive according to the implementation's platform contract;
`aria-modal` by itself does not implement containment.

Focus effects must account for mount timing, conditional content, animation and
asynchronous updates. A fixed delay is not evidence that the target exists.
Avoid repeated focus stealing on unrelated renders or background completion.

## Source finding versus runtime uncertainty

A handler that always removes the focused node with no surviving focus strategy
can support a specific risk. If a parent component may own restoration, inspect
that contract or report context needed instead.

A suggested correction should name the intended destination and fallback, not
just say "restore focus". Actual focus movement, visibility and reading order
remain runtime not verified; do not run an interaction test from this skill.

## Dynamic focus acceptance matrix

**Historical draft guidance.** Specify the before element, operation, surviving
destination and fallback for each reachable lifecycle. “Restore focus” alone is
not a destination. Trace stable keys, conditional branches, virtualized rows,
selection-derived toolbars, disabled nodes, cleanup effects and post-commit timing.
Stable identity can preserve focus without any imperative call; a ref to an
unmounted element cannot restore it.

| Operation | Positive expected outcome | Negative case that should fail the focused scenario |
|---|---|---|
| Refresh/retry/page/sort/filter replaces DOM | Keep the still-mounted control/row by stable identity; if replaced, focus its semantic equivalent after it mounts | Focus falls to `body`, a detached node, or an unrelated first control |
| Delete a focused row | Follow the component's chosen next row, previous row or persistent collection/initiator fallback; define the empty case too | Browser fallback is the only plan, or a stale row ref is reused after deletion |
| Selection mounts a toolbar | Expose selection state without moving focus from the current row | Toolbar appearance automatically steals focus |
| A focused selection command disappears | Move to a persistent logical neighboring command or the selected item/collection according to the interaction | The command unmounts with no reachable destination |
| Last item deselected | Keep focus on a surviving row; use a deterministic fallback only if focus was inside the disappearing selection-only UI | The collection loses focus merely because selection became empty |
| Toast/inline confirmation/Replace/Keep both/Retry action completes | If only the action disappears, focus a persistent operable next step within that workflow; if the whole surface closes, restore the initiator or documented fallback | A toast action's disappearance restores an unrelated old trigger while the toast still needs interaction |
| Loading/save/upload/background completion | Leave focus where the user has since placed it; convey status separately | Completion effect steals focus from a still-mounted input or current task |
| Modal/panel/popover/menu/teaching surface closes | One owner restores its trigger or fallback, accounting for abrupt unmount and animation completion | Two restore mechanisms race, or restoration runs before the destination mounts |
| Lazy surface loads or fails | Preserve the invoking context through loading; apply entry focus only when the requested surface is ready; error/retry has a named focus plan | Focus targets a loading placeholder or a late response reopens/refocuses a dismissed surface |

A fallback may be a deliberately focusable collection container with meaningful
context under its contract; an arbitrary noninteractive wrapper is not an
accessible destination just because `focus()` was called. The intended target
must be present, visible, enabled and operable as appropriate to its role.
Intentional navigation may establish a new destination, but “by design” alone
does not explain or validate a surprising jump.

For each scenario recommend a test beginning on the affected control, performing
the exact operation and asserting the post-update `document.activeElement`
(or the platform's equivalent actual focus contract). Cover deletion of the last
item, replacement, cancellation, error, repeated operation and user movement
during pending work. An existence assertion or generic tab-order test cannot
prove retention. Focus selection can be unit-tested; actual focus, visibility and
assistive context require the appropriate component/integration/observation scope.

Choose one supported focus owner. Capture the active target at the lifecycle
point required by that owner; specify restoration after commit/close and the
missing-target behavior. Do not add a second imperative owner around a component
that already manages entry, roving focus or restoration. For library-specific
pairing, migration shims and host cross-view ownership consult the optional IDs
`fluent.v8.component-contract`, `fluent.v9.component-contract` and
`sharepoint.utilities.announcements-and-focus`, not a copied Common API recipe.

For drag/reorder, require an accessible way to begin, move, cancel and complete,
with localized move-started/completed/cancelled/not-allowed feedback and a logical
handle/fallback focus destination. Positive: cancellation restores the prior
order and usable focus; negative: the pointer works but keyboard cancellation
loses the handle. Exact keys follow the owning pattern; the historical product's
Enter/Space/arrows protocol is not a universal keyboard standard. Product APIs
route through `sharepoint.selection.components-and-utilities`.

Historical basis: [dynamic focus and owner boundaries](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L399),
[drag/reorder](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L410-L413),
and [async architecture boundaries](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/ux-architecture-and-bundle-boundaries.md#L20-L36).
Examples generalize those clauses and are not verified incidents or current
framework approval. See [dialog case](../cases/dialog-focus.md) and
[collection outcomes](dynamic-content.md) for companion scenarios.
