# Static verification

**Status: draft guidance; not normative approved policy.** Review only source and
documentation available within the caller's authorized read scope. Do not edit,
execute tests, launch the application, or operate assistive technology here.

## Review plan

1. State the changed behavior, affected users, and relevant
   [requirement applicability](../requirements/authority-and-applicability.md).
2. Identify the [component contract](../implementation/component-contract.md)
   and inspect only the nearby definitions needed to follow that contract.
3. Trace names, roles, values, relationships, event handling, focus ownership,
   and feedback through reachable state transitions, not just initial markup.
4. Review styles and content for source-visible risks, including conditional
   hiding, clipping, reordering, localization, themes, and validation paths.
5. Separate a supported causal finding from missing context and behavior that
   requires rendered observation. Preserve valid native or supplied behavior.

## Evidence and limits

For a supported issue, record the available source location or exact snippet,
affected operation, causal path, candidate criterion with rationale, and smallest
recommended correction. An inaccessible wrapper cannot be inferred solely from
an unfamiliar name or missing explicit ARIA.

Record unknown generated IDs, missing implementations, and parent-owned behavior
as context needed. Record actual accessible names, speech, focus movement,
contrast, and layout as runtime not verified unless separate valid observations
are supplied. Do not invent measurements, line numbers, or a pass result.

Recommend [dynamic observations](dynamic.md) only for unresolved behavior;
recommend [tests](testing.md) at the responsible boundary. A clean source review
means no definite issue found in that scope, not accessibility conformance.

Basis: [foundations](../topics/foundations.md),
[component semantics](../topics/component-accessibility.md),
[forms and content](../topics/forms-and-content.md), and
[visual accessibility](../topics/visual-accessibility.md).

## Review absence, rendered impact and conflicting evidence

**Pinned historical draft lessons.** Begin from changed user-visible behavior,
not an `aria-*` search alone. A new asynchronous list with no accessibility code
still needs the [complete outcome matrix](../topics/dynamic-content.md); a style
change can affect focus/contrast/reflow without changing semantics in JSX.
Record not-applicable only with a reason the change cannot affect interaction,
assistive output or accessibility-relevant rendering. Decorative-only changes
can be outside a particular check; arbitrary spacing values are not automatic
standards violations.

For each reachable transition, identify visible feedback, the established
programmatic owner and the pre/post focus plan. Inspect first load, empty/error,
retry, repeated refresh/no-change, append/end, selection and background completion.
Do not infer that a spinner, busy flag, count variable or DOM reorder announces.
Conversely, inspect provider/component behavior before flagging absent local ARIA.

| Available fact | Sound conclusion | Unsound conclusion |
|---|---|---|
| Source shows an icon-only action with no name path and all wrappers are known | Source-supported naming gap in that usage | Every similarly named component in the repository is broken |
| A wrapper supplies native semantics and valid state | No extra caller ARIA needed for that contract | Add a duplicate role because the usage lacks `aria-*` |
| Localized message resource and call exist | Source provides a feedback path; runtime delivery/repetition needs observation | The screen reader spoke it exactly once |
| A test only checks that a row exists after deletion | Rendering existence checked; focus retention not established | Keyboard continuity passes |
| Checklist says “reviewed” but current import/provider/source contradicts it | Investigate the contradiction; a self-attested report is not independent evidence | Checklist completion overrides the source |
| A thread is marked resolved or promises a follow-up | Inspect the current implementation for the claimed fix | Resolution status proves the current source is accessible |

An automated static/diff audit can flag known markup, ARIA, keyboard or styling
patterns. Its clean report cannot establish the complete runtime tree, computed
names, focus lifecycle or announcements. Missing source, unknown provider
ancestry and unavailable versions are context-needed, not pass and not a reason
to invent an API. See [dynamic evidence](dynamic.md) and [test limits](testing.md).

Historical basis: [review scope](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L1-L19),
[async outcomes](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L220-L311),
[audit tools and checklist](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L414-L465),
and [contradictory completed checklist miss](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/review-misses.md#L49-L67).
Repository report fields, severities and heading evidence filenames are excluded
from these cross-product rules; no runtime audit is executed by reading them.