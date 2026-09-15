# SharePoint rich-text and authored-content checks

Status: draft. Owner: unassigned.
Active source status and entry bindings: [package metadata](../package.json).
Entry ID: `sharepoint.utilities.rich-text-accessibility`.

Scope: ODSP-Web draft guidance, not current-approved editor API documentation.

## Existing validator and content boundary

For RTE, authored HTML and page-content scanning, use the existing
`@msinternal/sp-a11y-checker-util` rather than new local validators. Its
public entry points `checkA11yForRte` and `runH1A11yChecks` expose authored-content
checks; package capabilities include:

| Content concern | Package capability / useful fixture |
| --- | --- |
| Heading structure | Heading order, H1 and heading-before-H1 validation; compare an authored outline with incorrectly ordered headings against the corrected content. |
| Links | Empty-link checks; a link with no meaningful content versus meaningful linked text. |
| Tables | Table-header checks; a content table missing header structure versus the corrected structure. |
| Images | Image-alt-text checks; inspect informative and decorative image intent rather than inferring quality from the mere presence of an attribute. |
| Contrast | Text, image and overlay contrast checks; include the actual editor/page background and overlay state in the case. |

These are checker capabilities, not full function signatures or proof that all
capabilities run from each entry point. This guidance does **not** supply
arguments, option types, return shapes, timing, thresholds or per-function check
allocation. No sample invocation is invented. `checkA11yForRte` identifies the
RTE-facing API and `runH1A11yChecks` the H1-related API; use the installed public
contract for the actual call and failure handling.

## Usable review scenarios

- **Editor feature adds authored links/tables/images:** retain the shared content
  checker and fixtures for its applicable checks. A custom regex for one missing
  attribute is not a replacement for the shared validator's coverage.
- **Heading edit:** reason about the content outline and the editor's H1 rules.
  The existence of `runH1A11yChecks` does not establish a universal one-H1 rule
  for every component. Shared heading/semantic principles remain in
  `common.topic.forms-and-content` and `common.topic.component-accessibility`.
- **New dialog around the editor:** its label, keyboard entry, focus restoration
  and announcements belong to the component/host contract, not this content
  scan. A clean editor report cannot validate the surrounding dialog.
- **Localized rich text:** safe parsing, complete resources and noninteractive
  checkbox/radio label content use
  [localization and formatting](localization-and-formatting.md); a content scan
  is not a substitute for safe rendering.

These are informative applications of the checker capabilities, not observed
test results or a claim that an alt-text checker assesses meaning perfectly.
Use `common.verification.static` / `common.verification.dynamic` to distinguish
source-supported coverage from rendered behavior and residual checks.

## Scan and ownership limits

The Pages Accessibility Assistant and canvas/RTE-local helpers remain within
their owning area; do not turn them into general component APIs. The public
checker above is specifically for editor/content validation, not a substitute
for semantic component authoring. Product scan helper contracts and limitations
are in [host verification](../verification/themes-and-host.md). A clean scan
does not prove keyboard, focus, actual AT speech, MAS compliance or support.
No scanner execution or authoring-page operation is authorized by this entry.