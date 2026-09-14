# Illustrative case: focus after a dialog closes

**Status: draft guidance; not normative approved policy.** This is a hypothetical
reasoning example, not a historical verified incident, reproduced defect, test
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