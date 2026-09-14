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
