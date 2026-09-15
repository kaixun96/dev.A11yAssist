# Forms and content

## Labels, instructions and validation

- Give user-editable fields persistent labels or another appropriate accessible
  naming mechanism. Placeholder text alone is insufficient.
- Group related choices meaningfully, for example with `fieldset` and `legend`.
  Use the existing component's documented equivalent when it owns the markup.
- Associate required format instructions and errors with the relevant field.
  Expose invalid state when an error is established, not prematurely on every
  untouched field. Do not rely on color alone.
- Keep error text specific and actionable. Preserve entered values on failure.
  Inspect summary links and their field targets when an error summary is used.
- Consider autocomplete/input-purpose metadata where applicable. Do not prevent
  paste or password-manager use without a justified accessible alternative.
- Check whether validation, submission and retry remain keyboard reachable.
  Do not impose a focus move or alert on every keystroke.

```html
<label for="email">Email address</label>
<input id="email" name="email" type="email" autocomplete="email"
       aria-invalid="true" aria-describedby="email-error">
<p id="email-error">Enter an email address in the format name@example.com.</p>
```

This example depicts an established error state, not initial field rendering.
IDs must stay unique across instances; wording follows the project's language.
Actual error announcements and focus behavior are not established by the snippet.

## Images, icons and media

- Informative images need alternatives that convey their purpose in context.
  Decorative images use an empty alternative or appropriate equivalent hiding.
  Do not repeat nearby text unnecessarily.
- An image used as a link or button must contribute to an understandable action
  name. A filename or generic "image" label is usually not meaningful.
- Decorative icons inside already named controls should not add duplicate names.
  Check the complete control rather than insisting every icon have a label.
- Complex charts or diagrams need an accessible equivalent for their information;
  a short generic alternative does not convey the underlying data.
- For media, review source-visible controls, captions, descriptions and
  alternatives applicable to the content. A captions-track declaration alone
  does not prove that the captions are accurate.

## Tables and meaningful content

- Use data tables for tabular relationships, with appropriate header cells and
  associations. Do not add interactive grid semantics merely to style a table.
- Give repeated links enough contextual purpose to distinguish their destinations.
  Avoid replacing useful link text with an unrelated accessible label.
- Use markup for meaningful lists and structure, not only visual indentation.
- Check page language and known language changes when the relevant document
  context is supplied. Do not guess language metadata from a partial component.

Report source-supported gaps separately from unknown content quality, generated
markup or rendered relationships. No content scanner is run by this topic.

## Form and authored-content verification cases

These are expected positive/negative cases, not observed test results.

| Situation | Positive verification | Negative verification case |
|---|---|---|
| Field label and group | The name survives entered text replacing a placeholder; related choices expose their group name | Only a placeholder names an input, or a visual heading is not associated with the choices |
| Validation after submit | The field exposes invalid state, retains input, and references actionable error text; the summary/inline feedback is reachable and newly appearing feedback is conveyed appropriately | Only a red border changes, an error references a missing ID, or failure clears the value and leaves Retry unreachable |
| Error summary | Each summary link identifies and reaches its intended field; the feedback owner avoids duplicate reading of the same error | A generic alert announces an error a second time while summary links lead to unrelated fields |
| Rich-text content | Heading structure, nonempty link purpose, table headers, alternatives and text/image/overlay contrast are checked in the authored content's actual context | An editor scanner's no-issues result is treated as proof that the editor toolbar, page headings and keyboard journey are accessible |
| Images and icons | An informative asset conveys missing information through an alternative; redundant decoration is hidden | Every image gets a filename label, or an informative image is hidden merely because it looks decorative |

Content validation and component authoring have different owners. An editor's
heading/H1 policy can be useful within its document model, but does not establish
a universal single-H1 rule for every page, dialog or component. Route product
checker APIs by `sharepoint.selection.components-and-utilities`; Common defines
the outcomes, not a dependency on those checkers.

## Complete localized messages, including assistive text

Apply the product's localization system to visible text, tooltips, accessible
names/descriptions, screen-reader-only text, announcements and reachable fallback
messages. User/API data such as a person's display name is not itself a resource
string; the surrounding sentence and fallback still need localization. Supply
translator context explaining usage and every placeholder, and verify that each
argument matches its meaning. Reuse an appropriately owned shared resource only
when the meaning/context really matches; identical spelling is not enough.

- Keep words, punctuation and reorderable values in one translation unit.
  Positive: a resource for “Created at {date} by {author}” lets a translation move
  the author before the date. Negative: localizing “Created at {date} by” and
  appending the author in code fixes English order.
- If a placeholder contains an element, use the owning framework's node-aware
  formatter so a translated sentence can move the link/emphasis intact. Plain
  string interpolation can stringify a node or split the sentence. Verify both
  reading order and link purpose after reordering, not just the rendered words.
- Use sentence-level count/plural resources and a locale-aware count formatter.
  If the platform uses interval metadata, verify each interval maps to the
  corresponding complete sentence and the numeric count argument. Test zero,
  one and multiple values plus the locale's additional plural categories.
  “{count} items selected” is a sentence; joining a number, a separately selected
  noun and “selected” is not a safely reorderable translation.
- Do not universalize English zero/plural wording or a three-form interval set.
  The pinned source's zero/one/plural convention belongs to its resource pipeline;
  follow the target locale and formatter. A placeholder holding an entity name in
  “{name} deleted” is not a numeric count and does not require plural intervals.
- Format user-facing lists with the user's/site's locale (for example
  `Intl.ListFormat` where supported), not a hard-coded comma or English “and”.
  Format dates/times with the intended locale, timezone and hour-cycle contract,
  not fixed US field order or copied legacy arithmetic.
- Prefer an established compatible formatter over replacing only the first
  placeholder or hand-writing a parser. Verify repeated placeholders, translated
  order and legitimate zero/empty values; resource presence alone proves none of
  these. Product formatter names route through
  `sharepoint.selection.components-and-utilities`.

For localized rich text, use an established safe parser and an allowlisted
element mapping; do not insert resource markup as unchecked HTML. A checkbox or
radio label should not acquire nested interactive links through automatic
linkification. Preserve noninteractive emphasis and place a needed link outside
the label with clear context. Positive: translating an emphasized choice keeps
one clear selection target. Negative: a link nested in that label creates
competing activation/focus behavior. Resource approval locks, file extensions and
pipeline-specific annotations are not cross-product accessibility standards.

An explicit compatibility/parity contract can intentionally constrain date or
message formatting. Record that scope before calling the format a defect;
compatibility does not excuse incorrect timezone calculations or automatically
waive an applicable accessibility requirement. This is a context-needed or scoped
exception decision, never invented approval.

Historical draft basis: [accessibility content-checker boundaries](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L400-L409),
[form/custom-control checklist and examples](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L425-L627),
[localization reference](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md),
[shared utility fit](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/shared-utility-reuse.md),
and [parity calibration](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/review-misses.md).
These are pinned historical claims and generalized examples, not current owner
approval or executed verification.
