# Common accessibility knowledge

Shared canonical, read-only guidance for accessibility development and review.
This package contains documents, not executable tools or execution authority.
Its use requires no particular product, framework, or runtime dependency.

## Status and authority

All documents in this package are **draft guidance**, not normative approved policy. Public
standards cited by the topics retain their own authority and applicability;
neither an example nor a checklist certifies conformance. See
[authority and applicability](requirements/authority-and-applicability.md).
The [package descriptor](package.json) records entry ownership, active source
status and entry source bindings. Owners are unassigned; an empty `sourceIds`
array means no active source is cited, not approval. Public-standard connections
remain review-pending, and MAS content/authority is not supplied.

Reading these documents permits only analysis, plans, and recommendations within
the caller's permitted scope. Actual source edits, test execution, application
operation, and assistive-technology use are delegated to a separately authorized
caller or executor. Required ownership, reproduction, evidence, and review gates
remain in force; this package is not an alternative end-to-end workflow.

## Topics

- [Foundations and primary references](topics/foundations.md)
- [Component semantics](topics/component-accessibility.md)
- [Keyboard and focus](topics/keyboard-focus.md)
- [Forms and content](topics/forms-and-content.md)
- [Dynamic content and announcements](topics/dynamic-content.md)
- [Visual accessibility](topics/visual-accessibility.md)

## Development reasoning

- [Root-cause analysis](analysis/root-cause.md): trace a symptom to its owner.
- [Component contract](implementation/component-contract.md): separate supplied
  behavior from caller responsibilities before recommending a fix.
- [Static verification](verification/static.md),
  [dynamic verification planning](verification/dynamic.md),
  [design review](verification/design.md), and
  [test boundaries](verification/testing.md): keep different evidence distinct.
- [Dialog focus case](cases/dialog-focus.md): an illustrative reasoning example,
  not a verified incident.

## Read-only procedures

Choose a bounded task rather than treating these as automatic execution phases:
[find](procedures/find.md), [fix](procedures/fix.md),
[prevent](procedures/prevent.md), [review a design](procedures/review-design.md),
or [recommend tests](procedures/add-tests.md).

Each recommendation should identify the behavior, source or requirement basis,
responsible layer, missing context, and evidence still needed. Unknown is not
pass. Runtime observations must come from actual, separately authorized work,
never from a source-only inference.

## Find guidance by interaction or change

Use these entries for scoped rules and positive/negative verification examples.
The examples are hypothetical expected outcomes, not observed results.

| Interaction or change | Knowledge entries and concrete coverage |
|---|---|
| Rendered UI | [Component semantics](topics/component-accessibility.md): name/role/value/state, grouping, presentation/hidden descendants, headings/tables/relationships and custom-control contracts; [forms](topics/forms-and-content.md): labels, validation/error, content/alternatives; [visual checks](topics/visual-accessibility.md): styling, reflow, truncation, targets and scoped contrast; [design](verification/design.md) and [caller contract](implementation/component-contract.md): acceptance/ownership |
| Async collections | [Dynamic content](topics/dynamic-content.md): initial/loading/results/empty/error/retry, append/end, sort/filter/search/group/page/replacement, explicit refresh updated/no-change/repeated results, selection and background completion, each with visible/programmatic/focus outcomes; [static](verification/static.md) and [dynamic verification](verification/dynamic.md): evidence distinctions |
| Focus | [Keyboard/focus](topics/keyboard-focus.md): stable identity, disappearing action/toolbar/toast, final deselection, disabled/replaced target, post-commit fallback, restoration/animation/abrupt unmount and user movement during async work; [dialog cases](cases/dialog-focus.md) and [testing](verification/testing.md): exact-operation active-element assertions |
| Scans and utility boundaries | [Static](verification/static.md), [dynamic](verification/dynamic.md), [testing](verification/testing.md): scan scope/rules/exclusions, justified disabling, editor versus application scope, source versus rendered/observed evidence; [component contract](implementation/component-contract.md): private helpers and one supported owner |
| Localization/reuse | [Forms/content](topics/forms-and-content.md): full messages, translator context/placeholders, count/interval and locale-specific plural cases, element placeholders, safe rich text, fallbacks, locale lists/dates and scoped parity; [visual](topics/visual-accessibility.md): RTL pipeline exceptions; [dynamic content](topics/dynamic-content.md): complete localized outcomes |
| Component replacement | [Testing](verification/testing.md): version-bound header/body/footer, width/scroll, portal/provider, inner-control composition, focus, keyboard, all dismiss paths/animation and coexisting branch regressions; comparison guidance, not execution |
| State, lifecycle and ownership | [Root cause](analysis/root-cause.md): inconsistent copies, false first paint, self-attested review, stale async work, lifecycle/cancellation/data and parity; [component contract](implementation/component-contract.md): reuse fit/semantic ownership/lazy boundaries; [testing](verification/testing.md): reconciliation/prop-presence and initialization/runtime identity risks |
| Composite interactions and authored content | [Focus](topics/keyboard-focus.md): one restoration owner and generalized drag begin/move/cancel/complete; [forms/content](topics/forms-and-content.md): editor checker limits; [component semantics](topics/component-accessibility.md): table versus grid and composition. Framework/product entries own concrete APIs |
| Supplied assistive-technology evidence | [Dynamic verification](verification/dynamic.md): matched Voice Access overlays, DOM/UIA attribution, screen-reader recording quality, step-linked evidence and scenario/baseline comparison |

### Scope and ownership

- Framework/product contracts use optional stable IDs, not cross-package file
  links or Common dependencies: `fluent.v8.component-contract`,
  `fluent.v9.component-contract`, `fluent.selection.components-and-utilities`,
  `sharepoint.spds.component-contract`,
  `sharepoint.utilities.announcements-and-focus`,
  `sharepoint.selection.components-and-utilities` and
  `sharepoint.verification.themes-and-host`. Those packages own concrete APIs,
  provider/slot/shim prerequisites, SPDS imports, theme classification and product
  formatter, rich-text checker and drag/reorder protocols.
- Severity labels remain scoped to the product review contract;
  heading-outline reasoning is in the component topic. Heading evidence filenames, review/report schemas,
  release authority, rollout/release/build commands, host/lease/evidence
  execution, private helpers and personal incident details are not universal KB
  requirements. General architecture, network/security/telemetry and performance
  policy is not duplicated unless it yields a specific accessibility lesson.
- Preserve useful scoped guidance without claiming current authority: no blanket
  single-H1 rule, all-disabled-state contrast rule, English zero/plural standard,
  every-mutation announcement, every-popover focus trap, or universal product
  keyboard protocol. Native/component-owned semantics and feedback count; do not
  duplicate them.
- Contribution, source review and version publication follow the KB governance;
  inclusion in this package does not change a source's authority.