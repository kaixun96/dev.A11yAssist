---
name: a11y-validate
description: Validate evidence integrity and obtain an independent accessibility verdict without confusing either with the other.
---

Read the packaged workflow/provider contracts. Call `a11y_validate_doctor`,
`a11y_validate_status`, then execute the allowed `validate` stage.

The provider must independently perform:

- deterministic identity/hash, scenario-equivalence, actual resource/HEAD and
  capture-completeness validation;
- accessibility evaluation against the Bug's acceptance contract using actual
  evidence, not the implementer's prose.

Both must pass. A screenshot, timestamp, successful shell exit or running
process is not sufficient. Missing/ambiguous media is inconclusive or invalid,
not guessed PASS. Do not fix source or control AT from this evaluation step.

When actual findings require source changes, return the documented
changes-requested receipt, reopening the source/AFTER/validate/review loop.
Pending analysis must be reconciled using `a11y_validate_reconcile`; never
advance the workflow by manually editing run.json or inventing a receipt.
