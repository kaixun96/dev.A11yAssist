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

Use the following sections in this order for static reviews. Keep them
proportional: an empty section can be one sentence, and a small finding need not
be a large table. Code-generation advice alone does not require a review report.

### 1. Reviewed scope

Name the requested files, diff or supplied snippets, the platform/framework when
known, and the accessibility target used as a reference. List the component
definitions or documentation actually consulted and material scope exclusions.
If a snippet has no filename or line numbers, label it as a supplied snippet.
Never imply that unread files or the whole project were reviewed.

### 2. Source-supported issues

For each supported issue, include these fields:

| Field | Required content |
|---|---|
| ID and title | Report-local identifier such as `STATIC-A11Y-001` and a specific behavior, not just "ARIA issue" |
| Location | Actual file and known line range, or an exact quoted snippet; never invent line numbers |
| Severity | High, Medium or Low, with the user-impact reason below |
| Confidence | High or Medium in the source-based causal argument, with its basis; not a numeric probability or runtime-validation claim |
| Affected users and impact | Which user task is blocked or made harder, and for whom |
| Source evidence | Trace the relevant primitive, state, handler and component contract to the consequence; mention applicable exceptions |
| Rule/reference | Topic plus section, for example `widget-patterns.md#tabs`; a WCAG criterion only if its applicability is justified |
| Minimal correction | The existing primitive, prop, state update, handler or focus destination to change; preserve unrelated behavior and localization |

Severity is priority, not the WCAG conformance level:

- **High:** the source establishes that a necessary task is unavailable to an
  affected input/access method and no alternative exists in the reviewed scope.
- **Medium:** the source establishes a material navigation, understanding or
  recovery problem, but does not establish total loss of a necessary task.
- **Low:** a source-supported localized usability problem with limited impact.
  Do not turn a stylistic preference or an optional pattern into a finding.

Confidence is independent of severity. High confidence means the necessary
source and contracts are available and the causal chain is direct. Medium
confidence may qualify the extent of impact, but the defect itself still needs
source support. If the conclusion depends on an unknown wrapper, alternative
path, rendered value or runtime effect, put it under **Context needed** or
**Runtime not verified**, not in a speculative low-confidence finding.

Sort by impact, group duplicate manifestations of the same cause, and identify
all known affected locations without inventing separate bugs for each copy.
Report-local IDs are not guaranteed to be stable across reviews.

Example finding for a supplied, complete custom-control snippet:

```text
STATIC-A11Y-001: Save action has no keyboard activation path
Location: supplied snippet `<div onClick={save}>Save</div>`
Severity: High - saving is the only available submission action in this snippet.
Confidence: High - the provided implementation has only a click handler,
  no keyboard handler, no inherited component behavior and no alternative action.
Affected users: keyboard users cannot focus and activate Save.
Source evidence: the generic div supplies neither native focus nor keyboard
  activation; the supplied handler only handles click.
Rule/reference: component-accessibility.md#native-semantics-before-custom-behavior;
  WCAG 2.1.1 is applicable to this keyboard-unavailable action.
Minimal correction: use `<button type="button" onClick={save}>Save</button>`,
  preserving the existing handler and appropriate button styling.
```

The example's completeness and absence of alternatives are stated assumptions
of the example, not facts to infer from every real-world isolated div.

### 3. Context needed

List the exact missing wrapper, event delegation, state branch, page structure,
platform API or component contract that prevents a sound conclusion. Say what
information would resolve it. Do not assign defect severity or include these
items in a confirmed-issue count.

### 4. Runtime not verified

Name only relevant behavior that the available source cannot establish, such as
actual speech, focus movement, final computed names, layout or theme contrast.
Record the uncertainty; do not execute tools or require the user to run the UI
as part of this static skill. Do not append an exhaustive runtime audit plan.

If no definite issue is found, write: "No source-supported accessibility issues
found in the reviewed scope." Missing context remains separate. Never conclude
"accessible", "PASS" or "WCAG compliant" from a static review.

## Primary references

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

These are reference links, not instructions to start a browser or run a test.
