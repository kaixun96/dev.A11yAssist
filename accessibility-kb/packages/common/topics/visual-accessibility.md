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

## Rendered style and replacement verification cases

These draft cases apply when a style/token/element change can affect readability,
semantics, clipping, focus, targets, state distinction or operation. A proven
decorative-only radius/shadow/spacing change is not automatically an accessibility
defect; a raw spacing literal needs an actual impact, not a blanket token rule.

| Change or condition | Positive expected verification | Negative example / risk |
|---|---|---|
| Token/state override | Default, hover, selected, focus, disabled where applicable, theme and forced-colors states retain required cues | A familiar token name is treated as a contrast measurement, or selection is color-only |
| Element/component replacement | Reused selectors/classes still give the new element suitable display, sizing, overflow, hit target, focus and disabled/selected styling | Styles written for an anchor or generic wrapper hide a replacement button's outline or shrink its target |
| Reflow | At 400% zoom from a 1280 CSS-pixel-wide baseline (equivalent 320 CSS-pixel width), ordinary vertical content retains text/actions without two-dimensional scrolling | An action is clipped by a fixed-width footer, or a dialog title overlaps Close |
| Two-dimensional content | A data table/map/diagram that requires two-dimensional layout retains its criterion exception while surrounding controls still reflow | The exception is extended to the entire page or used to hide a toolbar action |
| Truncated value | Full meaningful text is available through the documented keyboard, touch and screen-reader pattern | Hover-only Tooltip or `title` is the sole way to obtain the value |
| Full accessible value already supplied | The full name/value remains available without a duplicate hidden copy | A second description repeats the full label and makes speech unnecessarily verbose |
| User text settings/localization growth | Text resize, spacing and longer translations retain content, target separation and operation | A fixed-height row clips instructions or an error message |

Preserve the applicable contrast criterion's exceptions. Do not apply
“all boundaries/states/focus indicators at 3:1” as a universal rule.
Inactive controls, incidental decoration,
unmodified user-agent presentation and other criterion-specific exceptions need
their own applicability assessment. Test relevant disabled-state usability and
distinction without asserting that every disabled label must meet normal-text
contrast. Focus visibility, contrast and obscuration are related but separate
checks; no single ratio certifies them all.

## Bidirectional layout and localized presentation

Inspect physical-direction CSS across stylesheets, CSS-in-JS and inline styles.
Use logical properties or the owning framework's supported RTL-aware path where
the meaning is direction-relative. Do not mechanically flag a physical property
when the actual styling pipeline already flips it, and do not double-flip it.
Conversely, an inline/raw-CSS override outside that pipeline is not protected by
an auto-flipping claim. Confirm the installed framework contract; version-specific
behavior routes through `fluent.v8.component-contract` or
`fluent.v9.component-contract`.

Positive verification: in both LTR and RTL, a longer localized label, focus ring,
icon/text spacing, error and trailing action remain visible and in meaningful
reading/tab order; a mixed-direction data value retains its meaning. Negative:
physical left offsets bypass the styling path, a second manual reversal undoes
framework flipping, or CSS reversal changes appearance but leaves an incoherent
DOM reading order. Not every image or directional concept should mirror: retain
physical/spatial meaning where intentional, and record the scoped reason.
Pair this with the [complete-message rules](forms-and-content.md), not an
English-only visual snapshot.

Current standards mapping and rendered observations remain pending; these cases
are acceptance examples, not measured results.
