---
name: a11y-setup
description: Check and prepare a Windows accessibility evaluator environment. Reuse the shared AgentOW host installer for selected browser, NVDA, audio and Voice Access prerequisites; distinguish installation, configuration, consent and live readiness. Default check-only; prepare requires explicit host-change authorization.
---

Resolve bundled paths from the plugin root, two directories above this SKILL.md,
not the user's working directory. Read `docs/SETUP.md`, `setup/profiles.json` and
`setup/report.template.md`. The executable is `native/windows-host.ps1`; its
bundled personal-browser helper is `integrations/agentow/runtime/personal-evaluator-browser.py`.
These are the same authored implementations used by existing AgentOW exports,
not commands to execute from the historical knowledge archive.

For live execution or a stalled prerequisite, read `docs/EXECUTION-LESSONS.md`,
especially "Setup: qualify the whole path". Record the host-role map and the
published/installed/compatible/launch/target/evidence readiness ladder in the
setup report. This is a procedural gate, not a new tool or automatic qualification.

## 1. Scope and authority

Identify the actual execution host, requested scenarios, existing tools, private
output directory and whether the request is `check` or `prepare`. Default to
check-only. A setup request is not permission to run a Bug, edit product source,
install every marketplace plugin, change a worker, or acquire a dummy evaluator.
Use existing authorized tools rather than replacing a working deployment.

For source-only work, report no Windows dependencies required and return without
a host probe. Otherwise stop before any script, download, browser or elevation
if `CODESPACES == "true"`, `CODESPACE_NAME` is nonempty, or the host is not Windows.
Report unsupported-host and route to the actual Windows evaluator; never treat a
controller's environment as the remote evaluator's environment.

Before a probe on a shared managed host, follow its access policy. Before any
installation or interactive operation, require real exclusive host/setup or
recovery authority from the deployment's original resource manager. An execution
lease held by another task blocks setup. Never steal/expire a lease, create a
parallel registry, or use capture as an installation/recovery transport.

## 2. Resource first, then check and plan

Resource management is part of this plugin, not a separate a11y-resources
installation. Call `a11y_setup_resources` through the configured authoritative
resource connection, or use the deployment's approved resource tools. Select
an actual Windows DevBox and establish the original task-bound exclusive
setup/recovery authority BEFORE running any host preparation. Status is not
acquisition. Record host, task, ownership reference and authorized scope; keep
lease tokens inside the resource connection. Revalidate ownership on that host
immediately before each change and after any wait or restart.

For an existing stopped DevBox, `recover-devbox` provides a built-in original-lease
start/readback adapter. Read `docs/EXECUTION-ADAPTERS.md`; use the exact recovery ID
and explicit start authorization through a separately configured standalone call.
Preserve the original allocator/status/release tools. A cloud-power receipt never
substitutes for actual Console, browser, audio or AT readiness.

If no eligible DevBox exists, queue or use the original manager's authorized
provision/recovery route; do not install tools on the controller instead. This
package does not invent a generic allocator. An occupied/unavailable resource
blocks host preparation, not offline profile planning. Never dispatch capture,
smoke or a dummy Bug as a reservation/installation transport.

Select the required profiles from `setup/profiles.json` first. Run `Probe` with
their explicit `-Dependency` array using the documentation's private-path recipe,
not the legacy full-inventory default. Save the raw inventory
separately from the report. Inspect actual Copilot plugins/MCP connections and
their versions with the available host tools; a file, marketplace registration,
process or historical scenario boolean is not a callable connection.

For each selected dependency
record installed version/path, missing installation, missing configuration,
missing authorization, restart-required, or runtime-unverified. Record optional
scanner, Narrator/ETW and capture/validate connections separately; the bundled
installer does not install these automatically. No unrelated audio or Voice
Access requirement may block browser-only work.
Treat `probeScope.unrequestedDependencies` and `assessment: not-requested` as
unassessed, not missing or installed. Do not launch unrelated version probes
or expand permissions to make an unrelated tool pass.

In check mode, stop with the plan/report: do not install packages, copy the
browser helper, open a browser/AT, change NVDA settings, accept agreements,
elevate, transfer the Console session or reboot.

## 3. Prepare only the approved subset

In prepare mode, record explicit authorization for the actual host, selected
packages, downloads/package agreements and configuration changes first. Existing
authorization need not be requested twice: inspect applicable standing/task
authority before labeling configuration or protected deployment unauthorized.
Record the exact missing operation/host/scope, not a blanket request for consent.
Use `InstallSafeDependencies` with
an explicit `-Dependency` array derived from the chosen profiles, never its
legacy all-dependencies default. The script adds required Python/Playwright
dependencies, skips installed imports/binaries, and propagates installer errors.
An NVDA selection also enables Speech Viewer; preserve the prior configuration
and do not change it while an existing NVDA session owns it.

Use official/organization-approved package sources only. Do not disable signature,
hash, execution or enterprise controls, inject an unreviewed downloaded scanner into an
authenticated page, install a substitute package after a safety rejection, or
write dependencies into the product repository. A timeout is unknown execution:
record command/process identity and inspect that attempt before another install.

For the personal-browser route, follow the dedicated helper installation and
headed authentication procedure in `docs/SETUP.md`. Reuse a compatible owned
profile; never copy cookies, start Edge against a Chromium profile or overwrite
another deployment's helper/profile. Keep owner email process-local. Password,
Windows Hello, MFA and unavailable certificate authority require the owner.
An application confirmation may be clicked only with explicit applicable prior
consent and verified origin/account/app/scopes; absent that consent, ask the owner.
Record actual redirect/result, not accepted notification. A headless login
result alone is not that blocker; use approved visible silent renewal first.

VB-CABLE staging/driver installation, Voice Access first-run consent, elevated
Console-task installation, Console transfer and restart are separate gated
steps, never consequences of generic dependency installation. Follow the exact
procedure in `docs/SETUP.md`. Do not restart/disconnect an in-use machine. Do not
deploy a runtime or create/overwrite a protected task without its own authorization.

If the caller explicitly requests additional marketplace plugins, install only
the needed named packages following their README, preserve existing private
configuration, and restart Copilot before checking they are actually loaded.
No AgentOW prerequisite, global same-name skill invocation, sub-agent dispatch
or automatic MCP-to-MCP connection is introduced by this plugin.

## 4. Re-probe, qualify and hand back

Re-run Probe with the same selected dependencies after changes and after each
manual step/restart. Preserve separate
raw reports and actual exit codes. Do not interpret `scenarios.*` booleans as
live readiness: the inherited probe uses legacy browser assumptions and cannot
prove Chromium launch, current target authentication, AT output or audio behavior.

With separately authorized owned interactive access, verify only requested
capabilities using actual tools: visible browser launch and target access;
real named/versioned AT output for AT work; scoped harmless audio recognition
for Voice Access. `ValidateHost` is an optional Console-only desktop-frame/tone
diagnostic, not product evidence or long-running screenshot automation. Read its
privacy and ownership requirements before use. No screenshot proves speech.

Before handing off live readiness, require the same interpreter/import mode and
complete deployed dependency closure, actual browser callback initialization,
observed target/policy compatibility and owned cleanup. Record each ladder stage
separately; do not promote imports, mocks or request-shape validation into a live
qualification. A failed stage gets its exact error and changed recovery hypothesis.

Use `setup/report.template.md`. Each requested capability is `ready`,
`missing-installation`, `missing-configuration`, `needs-authorization`,
`restart-required`, `runtime-unverified`, `unsupported-host` or `blocked`, with
observed evidence and exact next action. `ready` requires an actual current
capability check, not only an installer exit or report file. Preserve unfinished
processes, original ownership IDs, resume condition and cleanup status. Restore
only owned transient sessions/settings; retain requested persistent installations.

Return the capability report to the caller. Bug Bash resumes only supported
rows, preserving unavailable rows as gaps. Setup does not claim feature coverage,
WCAG conformance, accepted BEFORE/AFTER or a completed remediation.

For separately authorized release of a completed evaluator assignment, use
`a11y_setup_invoke` action `release-evaluator`, a stable `operationId`, context
`subject`/`evaluator`, and only `input.nativeRunId` (32 lowercase hex characters).
First complete the required actual cleanup. The original resource provider must
validate the exact completed assignment and retain its private token. Unknown
results use `a11y_setup_operation_reconcile`, never another execute/ID. Release
does not prove process/audio cleanup, release other resources or transfer affinity.
Old a11y-resources operations retain their original pinned runtime until closed.
