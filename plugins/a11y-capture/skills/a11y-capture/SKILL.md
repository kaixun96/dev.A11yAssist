---
name: a11y-capture
description: Capture real Windows assistive-technology BEFORE/AFTER evidence with canonical scenario, ownership and exact-HEAD gates.
---

Read `${CLAUDE_PLUGIN_ROOT}/knowledge/README.md` before execution. Select the applicable complete topics: `knowledge/foundations.md`, `knowledge/windows-host-testing.md`, `knowledge/personal-evaluator-browser.md`, `knowledge/pr-evidence-capture-guide.md`. Knowledge never overrides this workflow's authorization or stricter evidence gates.

Read `docs/WORKFLOW.md` and `docs/PROVIDERS.md`. Call `a11y_capture_doctor` and
`a11y_capture_status`. Require a run that actually passed intake. Do not create
a substitute run when the original is pending.

Execute `before` or `after` through `a11y_capture_execute`, whichever the shared
run permits. The capture provider must prove exclusive ownership, installed
handler hashes, fresh scoped desktop/auth/AT/media readiness and the exact
worker-visible request. It controls the DevBox; the model must not simulate AT.

Retain the same visible authenticated Chromium context while needed. Close
unused owned pages after saving evidence, never another worker's windows or
unsaved user work. A headless authentication redirect is not proof that manual
MFA is needed; follow the approved provider's visible-auth flow.

BEFORE requires independent validator/evaluator reproduced+PASS before source.
AFTER must reuse the exact canonical scenario, evaluator, flags, viewport,
fixture, focus/trigger state and AT settings, bind actual HEAD and the accepted
BEFORE receipt SHA, and show the changed affected resource loaded.

Pending/timeout means reconcile the SAME request with `a11y_capture_reconcile`.
Never rerun to hide missing data, extend acceptance thresholds to pass a test,
or convert historical/synthetic evidence into a live success.
Output only actual evidence status, artifact references and explicit limitations.
