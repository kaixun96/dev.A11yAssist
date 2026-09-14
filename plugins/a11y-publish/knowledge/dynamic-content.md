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
