# Visual accessibility from source

Style changes can affect accessibility without changing a single ARIA attribute.
Inspect relevant CSS, tokens, layout and state branches. Do not launch a renderer,
capture screenshots or run a contrast scanner; actual rendering remains unknown.

## Color, contrast and focus

- Do not encode an error, selection, state or action solely by color. Look for
  text, shape or other meaningful cues and appropriate programmatic state.
- Review foreground/background pairs across the affected states and themes.
  Token names do not prove contrast. Unknown computed colors, images,
  transparency or composition must be reported as runtime not verified.
- WCAG text-contrast reference values are 4.5:1 for normal text and 3:1 for large
  text, subject to the criterion's definition of large text and exceptions.
  Essential non-text UI/state visuals generally need 3:1 against adjacent colors.
  Do not apply these mechanically to inactive controls, incidental decoration
  or other exempt content.
- Removing the default outline without an adequate replacement is a risk.
  Inspect focus-visible styling, clipping, stacking and overlays that could
  obscure the focused control. Source cannot prove the final visible indicator.
- Preserve useful system colors and boundaries in forced-colors modes. Disabling
  automatic adjustment is not inherently wrong, but requires a deliberate
  accessible replacement rather than an assumption about a particular theme.

## Layout, text and targets

- Watch fixed heights/widths, `overflow: hidden`, nowrap rules and absolute
  positioning that can clip text or controls when content grows or is translated.
- Inspect flexible layout at narrow widths. WCAG reflow includes a 320 CSS-pixel
  width condition for vertically scrolling content; preserve exceptions for
  content that needs a two-dimensional layout, such as a data table or map.
- Text resize and user text-spacing overrides should not cause loss of content
  or operation. Do not infer a pass from responsive classes or a media query.
- Keep source reading order meaningful when CSS visually reorders content.
- Truncation must not make important information available only on mouse hover.
  A `title` attribute alone is not a reliable cross-input solution.
- Review small or crowded pointer targets. WCAG 2.2 AA target-size guidance
  includes 24 by 24 CSS pixels or sufficient spacing, with stated exceptions.
  Do not call every target smaller than 44 pixels an AA violation.

## Motion and transient content

Review auto-starting movement, flashing, animation and time limits for appropriate
controls or alternatives under the applicable criteria. Respect reduced-motion
preferences where relevant, but do not claim that one media query establishes
conformance. Content exposed on hover or focus needs an appropriate way to remain
available and be dismissed; do not assume pointer-only discovery is sufficient.

Reference the applicable [WCAG 2.2 criterion](https://www.w3.org/TR/WCAG22/)
when needed. Report concrete source risks and exceptions, not guessed pixel
measurements, a visual PASS or a fabricated contrast ratio.
