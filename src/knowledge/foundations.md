# Static accessibility review foundations

## Scope and evidence

Start from the requested behavior, changed source and available context. Read
nearby definitions only when needed to understand a control or transition.
Do not run the application, tests, scanners, browser automation or assistive
technology. Reading source is not observing rendered behavior.

For code-generation guidance, describe the semantic element, name, state,
keyboard behavior, focus destination and feedback needed by the interaction.
Offer a minimal code suggestion when helpful; do not edit the project from this
read-only skill or add runtime/deployment prerequisites.

Use the project's stated accessibility target. If none is provided, use WCAG
2.2 A/AA as a review reference, not an asserted legal or product requirement.
WAI-ARIA Authoring Practices are implementation guidance, not a conformance
certificate or a requirement to use ARIA where native HTML already works.

## Reasoning order

1. Identify the user action and information the UI must convey.
2. Identify the actual rendered primitive or component contract when known.
3. Follow values, labels, IDs, state updates and event handlers relevant to it.
4. Account for semantics and behavior already supplied by the native element or
   library. Absence of explicit ARIA or a focus handler is not inherently a bug.
5. Report a concrete issue only when source evidence supports the causal chain.
   Otherwise name the missing context without guessing or starting a live check.

Keep changes behavior-preserving and use the project's existing localization,
styling and component conventions. Do not invent a package, require a framework
migration, duplicate an announcer or impose a repository-specific artifact.

## Common criterion mappings

| Source concern | Possible WCAG mapping |
|---|---|
| Missing or conflicting name, role, state or value | 4.1.2 |
| Relationships or meaningful sequence are lost | 1.3.1, 1.3.2 |
| Visible label is absent from the accessible name | 2.5.3 |
| Labels or instructions are missing/unclear | 2.4.6, 3.3.2 |
| Keyboard operation or escape is unavailable | 2.1.1, 2.1.2 |
| Focus order, visibility or obscuration | 2.4.3, 2.4.7, 2.4.11 |
| Status messages have no programmatic exposure | 4.1.3 |
| Color alone, text contrast or UI contrast | 1.4.1, 1.4.3, 1.4.11 |
| Text resizing, reflow or text-spacing loss | 1.4.4, 1.4.10, 1.4.12 |
| Drag-only operation or small pointer targets | 2.5.7, 2.5.8 |
| Non-text content lacks an appropriate alternative | 1.1.1 |

These are candidate mappings. Check the criterion's applicability and exceptions;
do not turn every coding preference into a WCAG violation.

## Output contract

Keep the response proportional to the source scope:

- **Source-supported issue:** location or quoted snippet, affected user behavior,
  relevant rule, causal source evidence and smallest suggested correction.
- **Context needed:** the missing wrapper, state, page structure, platform API
  or component contract that prevents a sound conclusion. No fabricated line
  numbers or assumed runtime values.
- **Runtime not verified:** behaviors the source cannot establish, such as actual
  speech, focus movement, computed names, layout or theme contrast. Record the
  uncertainty only; do not execute tools to resolve it.

Do not invent a finding when the provided source already uses a valid pattern.
If no definite issues are found, report that narrowly rather than saying
"accessible", "PASS" or "WCAG compliant".

## Primary references

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

These are reference links, not instructions to start a browser or run a test.
