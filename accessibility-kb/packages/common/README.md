# Common accessibility knowledge

Shared canonical, read-only guidance for accessibility development and review.
This package contains documents, not executable tools or execution authority.
Its use requires no particular product, framework, or runtime dependency.

## Status and authority

All documents in this package are **draft guidance**, not normative approved policy. Public
standards cited by the topics retain their own authority and applicability;
neither an example nor a checklist certifies conformance. See
[authority and applicability](requirements/authority-and-applicability.md).

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
  not a verified historical incident.

## Read-only procedures

Choose a bounded task rather than treating these as automatic execution phases:
[find](procedures/find.md), [fix](procedures/fix.md),
[prevent](procedures/prevent.md), [review a design](procedures/review-design.md),
or [recommend tests](procedures/add-tests.md).

Each recommendation should identify the behavior, source or requirement basis,
responsible layer, missing context, and evidence still needed. Unknown is not
pass. Runtime observations must come from actual, separately authorized work,
never from a source-only inference.