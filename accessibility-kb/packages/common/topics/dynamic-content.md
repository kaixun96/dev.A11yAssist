# Dynamic content and announcements

Review visible feedback, programmatic feedback and focus together. A spinner or
changed DOM text alone does not prove that a status message is exposed.
Conversely, absence of a local live region is not a defect when the component or
application already supplies the necessary semantics.

## Review reachable transitions

| Transition | Inspect in source |
|---|---|
| Idle to loading | Meaningful loading feedback and busy state where appropriate; no stale success message |
| Loading to results | A useful completion/count message when it is a status update not otherwise conveyed |
| Loading to empty | An understandable empty state instead of only a blank container |
| Loading to error | Associated error feedback and reachable retry; avoid duplicate announcements |
| Load more to appended/end | Meaningful outcome and stable focus if the initiating control changes |
| Search/filter/sort to new results | Exposed selection/order and concise result feedback, without per-item noise |
| Save or background update completes | User-perceivable result without stealing focus unnecessarily |

Do not require every initial page render or every DOM mutation to announce.
Apply status-message requirements to the actual user interaction and information
being conveyed. `aria-busy` alone is not a completion message.

## One owner for an announcement

Use an existing native/component/application mechanism when it already supplies
the behavior. Inspect the applicable contract before suggesting another live
region, hidden duplicate or announcement call.

For custom web status messages, a single `role="status"` or appropriately polite
live region is often suitable. Reserve assertive interruption for genuinely
urgent information. Do not routinely combine an implicit live-region role with
redundant ARIA settings or multiple competing announcers.

```html
<!-- Present before an asynchronous result; update its text when appropriate. -->
<p id="save-status" role="status"></p>
```

The surrounding source must supply meaningful localized text on the intended
transition. Creating a populated live region at the same instant as its message
may not announce consistently; static markup does not prove spoken output.

## State, timing and duplication

- Tie feedback to the committed user-visible state, not stale requests or every
  render. Check cancellation, overlapping requests and error/retry paths.
- Keep names and message counts accurate, localized and pluralized.
- Do not flood users with every row in a bulk update or every typed character.
- If an identical meaningful result can recur, inspect whether the chosen
  mechanism supports that transition. Do not prescribe arbitrary delays or
  hidden-text toggling as a universal workaround.
- Do not move focus solely to make routine status text discoverable; preserve
  focus unless the interaction calls for navigation or another destination.

Separate a source-supported missing/duplicate feedback path from runtime
uncertainty about speech order, timing or wording. Do not synthesize a transcript
or start assistive technology to resolve that uncertainty.

## Collection outcome matrix: concrete acceptance cases

Apply this matrix to each reachable load, append, refresh, search, filter, sort,
group, page, retry or replacement operation. Select the actual component/host
contract before choosing an API. These are **draft expected outcomes**, not a
claim that every cell requires a new live region or that any speech was observed.
Initial static content already discoverable through normal page reading need not
announce just because it mounted. An asynchronous outcome not otherwise conveyed
still needs an appropriate programmatic path.

| Transition | Visible outcome | Programmatic / screen-reader outcome to verify | Keyboard / focus outcome to verify |
|---|---|---|---|
| Initial to loading | Meaningful loading feedback; no false empty state or stale success count | Busy/loading state where supported, with coherent collection context | The existing entry/control remains usable according to its loading contract; a skeleton is not a focus destination |
| Loading to loaded | Committed items and accurate count/summary | Completion and a useful localized count/summary when focus/page context does not otherwise convey the result | Focus remains where the user left it; do not focus results merely to expose completion |
| Loading to empty | Explicit localized empty explanation, with an available next action where relevant | The empty outcome is conveyed, not merely an absent row list | Persistent collection/search/filter control or documented fallback remains reachable |
| Loading to error | Clear error and reachable retry | Error is conveyed once by its owner; a component-owned announcement counts | No unexplained jump; an existing focused node survives or has a specified fallback |
| Error to retry/loading to success, empty or error | Old error/loading/count state is updated consistently | The new outcome is conveyed, including a repeated identical failure; not stale success or silent retry | Preserve Retry while it exists; if it disappears, use the documented persistent destination after commit |
| Load more to appended | New items plus added or total count | One localized summary of the append, not one announcement per new row | Keep focus on the invoking control unless the component contract requires another destination |
| Load more to end | End-of-list state; command removed/disabled appropriately | Expose that no more items remain, rather than repeating a misleading “more loaded” message | If the focused command disappears or becomes unfocusable, move to the documented logical fallback |
| Search/filter to replaced results | Current query/filter, results and count/empty state agree | Active state and concise result/count outcome; avoid feedback for superseded typing requests | Preserve the search/filter control; restore a replaced active item only when the interaction calls for it |
| Sort/group to reordered results | Current order/group state and results agree | Exposed sort/group state plus meaningful localized result summary; do not rely on changed DOM order alone | Preserve control/item by stable identity; no arbitrary first-row jump |
| Paging or data replacement | Correct page/range and current results | Convey current page/range or useful collection summary and count as appropriate | Persistent page control or semantic replacement after commit; account for first/last-page disabled controls |
| Explicit refresh to updated | New data and meaningful update feedback | Convey what changed or a useful refreshed summary, even if the total count is unchanged | Preserve active control/row by identity; fallback only if it no longer exists |
| Explicit refresh to no change | Honest “up to date” or equivalent outcome | A fresh meaningful no-change result is perceivable on repeated requests, rather than an indistinguishable stale message | Remain on the trigger/current focus; no jump just to force the message to be read |
| Selection changes | Selected items/count and available actions agree | Supported selected/checked state; a useful count/summary for a bulk change when not otherwise conveyed | Selection alone does not move focus; when selection-only commands vanish, use the focus matrix |
| Background load/save/upload completes | Accurate result without obscuring current work | Convey relevant completion/error through the established channel, with urgency appropriate to impact; suppress irrelevant/noisy repeated updates | Keep focus where the user has moved it; only an intentional navigation contract permits a move |

All loading, empty, error, count, sort/filter/group, page, refresh, selection and
end messages need complete localized resources and correct count formatting.
See [localization cases](forms-and-content.md); English wording in this matrix
is illustrative, not prescribed resource text. `aria-busy` communicates work in
progress, not its result. A component's error feedback does not cover separate
append, completion, no-change or end transitions.

### Positive and negative transition sequences

- **Repeated refresh:** two user refreshes both leave 12 items. Positive: each
  committed request yields a supported repeatable “up to date” outcome while
  focus stays on Refresh. Negative: the implementation only watches the count,
  so the second request is silent, or forcibly blurs/focuses the button to speak.
- **Bulk append/end:** adding five items yields one useful summary; reaching the
  end exposes the end state and handles removal of Load more. Negative: five row
  announcements overlap, or command removal leaves focus at the document body.
- **Error/retry:** the component's established error owner announces the failure
  once and Retry is reachable. Negative: a caller live region duplicates that
  error, while successful retry never conveys completion.
- **Superseded search:** only the committed latest query supplies rows, count and
  feedback. Negative: a slower older request announces its result over the newer
  query or leaves “No results” visible while loading valid results.
- **Selection/background:** deselecting the final item while focus is on its row
  preserves that row's focus; later background completion does not restore an old
  trigger after the user has moved elsewhere. Negative: a generic completion
  effect steals focus, or an obsolete selection toolbar retains focus.

Use the selected mechanism's documented repeat-event support and lifecycle,
including required host prerequisites, rather than inventing delays or another
provider. Stack APIs belong to `fluent.v8.component-contract`,
`fluent.v9.component-contract` and
`sharepoint.utilities.announcements-and-focus` (optional routing IDs, not Common
dependencies). For custom/native UI, first find a compatible existing status
primitive; only if none fits, consider one appropriately polite semantic status
region. A typing-specific helper is not automatically a result-status mechanism.

Product review severities are not universal defect rankings. Verify
applicability and actual announcements for the affected interaction.
