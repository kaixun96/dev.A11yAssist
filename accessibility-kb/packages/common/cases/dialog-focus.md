# Illustrative case: focus after a dialog closes

**Status: draft guidance; not normative approved policy.** This is a hypothetical
reasoning example, not a verified incident, reproduced defect, test
result, or conformance finding. It authorizes no edits or runtime actions.

## Scenario and hypothesis

A list item has an action that opens a modal confirmation dialog. Confirming the
action removes that item and closes the dialog. The original trigger therefore
may no longer exist when the dialog's usual restoration behavior occurs.

The hypothesis is a missing surviving focus destination. The scenario alone
does not prove a defect: the dialog, parent view, or platform may already provide
a suitable fallback. Actual focus movement and speech remain unverified.

## Read-only investigation

1. Identify the modal's naming, focus-entry, containment, and restoration
   contract. Do not assume that `aria-modal` implements these behaviors.
2. Trace the confirmation event, committed deletion state, item identity,
   unmount timing, and restoration callback or documented equivalent.
3. Determine whether the dialog restores a surviving trigger and whether the
   containing list owns the fallback when deletion makes that impossible.
4. Inspect cancellation, unsuccessful deletion, deleting the last item, an empty
   list, and repeated use. If an owning implementation is missing, request that
   context rather than inventing a failure.

## Conditional recommendation

If the source establishes an ownership gap, recommend using the existing
restoration contract with a parent-supplied logical fallback: for example, a
surviving adjacent item's action, or a persistent list-level control when empty.
The precise destination follows the interaction design, not a universal rule.
Keep one focus owner, account for target availability, and avoid arbitrary delay
or repeated focus stealing. Cancellation can retain normal trigger restoration.

Recommend a unit case for fallback selection, a component case for the dialog
contract, and an integration case for deletion plus unmount. A separately
authorized runtime plan can observe keyboard dismissal, focus destination and
visibility, modal context, and completion feedback with a screen reader.
None of these planned outcomes is claimed to have occurred.

Basis: [keyboard and focus](../topics/keyboard-focus.md),
[dynamic content](../topics/dynamic-content.md),
[component contract](../implementation/component-contract.md), and
[test boundaries](../verification/testing.md).

## Positive/negative scenario set

These examples supply concrete acceptance assertions,
not results. Pick the destination from the actual interaction contract rather
than treating the examples as universal focus order.

| Initial state and exact operation | Positive expected destination/behavior | Negative case |
|---|---|---|
| Open from a row action, then cancel | Named modal enters focus appropriately; close restores the still-mounted row action and does not delete data | Cancel mutates selection or restores an unrelated control |
| Confirm deletion with a following row | After committed deletion/close, the documented next-row action is active and visible | Focus points at the removed trigger, `body`, or an arbitrary wrapper |
| Confirm deletion of the last row | Chosen previous-row action or persistent empty-list control becomes active after mounting | Restoration races ahead of empty-state rendering; a fixed timeout merely hides the race |
| Delete fails and the dialog stays open | Error conveyed once; Retry remains keyboard reachable; focus follows the still-open dialog contract | Failure closes the surface unexpectedly or duplicates the error announcement |
| Retry succeeds and its action disappears | One owner restores the semantic replacement or persistent next step | Competing close/completion effects send focus to different targets |
| Dialog closes by supported Escape/dismiss/unmount path | The same documented restoration/fallback contract holds, including animation completion | Only clicking Close was covered; keyboard or abrupt unmount loses focus |
| User cancels while deletion/loading is pending | Late completion cannot reopen the dialog or steal focus from the user's new location | An old completion callback focuses a stale trigger in another view |

The focus owner must know whether the trigger still exists, whether its semantic
replacement has mounted and who supplies the fallback. Tests should assert the
post-operation active element, not just the presence of the next row. Pair the
dialog case with [selection and toast/action lifecycles](../topics/keyboard-focus.md)
instead of applying modal containment/restoration to every transient surface.

No current framework API, reviewer approval or observed success is asserted.