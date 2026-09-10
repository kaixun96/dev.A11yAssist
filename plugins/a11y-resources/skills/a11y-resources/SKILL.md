---
name: a11y-resources
description: Inspect the authoritative Windows DevBox/Codespace resource pool and diagnose ownership/readiness without stealing resources.
---

Read `${CLAUDE_PLUGIN_ROOT}/knowledge/README.md` for static guidance: `knowledge/foundations.md`.
For this execution integration, also read `${CLAUDE_PLUGIN_ROOT}/integrations/agentow/knowledge/README.md` and the applicable complete topics: `integrations/agentow/knowledge/windows-host-testing.md`, `integrations/agentow/knowledge/personal-evaluator-browser.md`. Static guidance does not replace authorized execution; integration references never override this workflow's stricter gates.

Read `docs/WORKFLOW.md` and `docs/PROVIDERS.md`. Supported entrypoints are
Twinbot+multiple DevBoxes and Copilot CLI+one/multiple DevBoxes.

Call `a11y_resources_doctor`, then `a11y_resources_resources` for actual provider
status. A configured executable, powered-on machine or reachable browser is not
ready authenticated AT. Missing, stale or incompatible health must remain explicit.

Use `a11y_resources_status` for the original run's phase/affinity. The configured
resource provider must use the SAME canonical shared registry as existing workers.
Do not create a lookalike local registry or infer ownership from process presence.

In v0.1 this plugin exposes public inspection, not generic acquire/release.
Stage providers acquire at the applicable gate: claim at intake, evaluator after
validated request, Codespace only after reproduced+PASS BEFORE, release in cleanup.
An execution acquisition is a dispatch, not a reservation.

Do not automatically expire leases, force-release, switch affinity, close another
worker's desktop, execute unreconciled foreign queued operations or delete retired
environments. Keep acquisition secrets in provider storage; never print tokens.
Output available/occupied/unhealthy separately, exact current blocker and the
original owner's next permitted resource action.
