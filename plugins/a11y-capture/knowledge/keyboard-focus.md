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
