---
name: a11y-setup
description: Check and prepare a Windows accessibility evaluator environment with the current scoped native host script for selected browser, NVDA, audio and Voice Access prerequisites. Distinguish installation, configuration, consent and live readiness. Default check-only; prepare requires explicit host-change authorization.
---

`${PLUGIN_ROOT}` is always the top-level installed plugin root supplied by the
host, never inferred from this skill's nesting or the user's working directory.
Read `${PLUGIN_ROOT}/docs/SETUP.md`, `${PLUGIN_ROOT}/setup/profiles.json` and
`${PLUGIN_ROOT}/setup/report.template.md`. The executable is
`${PLUGIN_ROOT}/native/windows-host.ps1`. All of these remain top-level in both
standalone setup and Bug Bash. Only the internal setup skill is nested; it has no
manifest, resource copies, runtime or MCP registration. Reuse the single current
authored setup implementation, not a root native export, integration runtime or
another installed plugin.

Knowledge references always remain at `${PLUGIN_ROOT}/references/README.md` and
`${PLUGIN_ROOT}/references/knowledge.json`, never under the internal module.
Use `a11y_bug_bash_knowledge_list`, `a11y_bug_bash_knowledge_search(query)` and
`a11y_bug_bash_knowledge_read(id)`. Build reuses this SAME skill inside Bug Bash,
replacing only the knowledge tool prefix to bind the containing plugin's server.
Use only the containing plugin's actually registered read-only knowledge tools.
Knowledge selects the 32 current Common/Fluent/SharePoint entries and requires
Node.js 22+ plus enabled host MCP, not setup, another plugin, a provider or
`A11Y_ASSIST_CONFIG`. It has no operational MCP. Read actual relevant entries
with citations/source status; snippets are not full rules and pending sources
are gaps. Knowledge review permits only those tools and relevant source/reference
reads, never host setup, shells, tests, browsers or AT. Missing knowledge is an
explicit gap, not permission to run setup or invent content. The loader uses an
absolute configured KB root, validated repository layout, verified shared cache,
then pinned HTTPS download; invalid roots/tampered caches fail without repair.
Verified cache works offline; first uncached use needs a valid local KB or a
reachable published pinned artifact. A local build does not establish public availability.

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

## 2. Check and plan

Run `Probe` using the documentation's private-path recipe. Save the raw inventory
separately from the report. Inspect actual Copilot plugins/MCP connections and
their versions with the available host tools; a file, marketplace registration,
process or historical scenario boolean is not a callable connection.

Select only the required profiles from `setup/profiles.json`. For each dependency
record installed version/path, missing installation, missing configuration,
missing authorization, restart-required, or runtime-unverified. Record optional
scanner, Narrator/ETW and capture/validate connections separately; the bundled
installer does not install these automatically. No unrelated audio or Voice
Access requirement may block browser-only work.

In check mode, stop with the plan/report: do not install packages, copy the
runtime, open a browser/AT, change NVDA settings, accept agreements,
elevate, transfer the Console session or reboot.

## 3. Prepare only the approved subset

In prepare mode, record explicit authorization for the actual host, selected
packages, downloads/package agreements and configuration changes first. Existing
authorization need not be requested twice. Use `InstallSafeDependencies` with
an explicit `-Dependency` array derived from the chosen profiles, never an
implicit all-dependencies selection. An omitted/empty installation selection
fails; `-Dependency` is valid only for this installation action, not `Probe`.
The script adds required Python/Playwright
dependencies, skips installed imports/binaries, and propagates installer errors.
An NVDA selection also enables Speech Viewer; preserve the prior configuration
and do not change it while an existing NVDA session owns it.

Use official/organization-approved package sources only. Do not disable signature,
hash, execution or enterprise controls, inject a downloaded scanner into an
authenticated page, install a substitute package after a safety rejection, or
write dependencies into the product repository. A timeout is unknown execution:
record command/process identity and inspect that attempt before another install.

For browser access, use an existing approved connection and its documented
headed authentication procedure in `docs/SETUP.md`. No product-specific browser
runtime is bundled or installed by this skill. Reuse a compatible owned profile;
never copy cookies, start Edge against a Chromium profile or overwrite another
deployment's helper/profile. Keep account identifiers in the trusted connection. Password,
Windows Hello, MFA, certificates and consent require the owner. A headless login
result alone is not that blocker; use approved visible silent renewal first.

VB-CABLE staging/driver installation, Voice Access first-run consent, elevated
Console-task installation, Console transfer and restart are separate gated
steps, never consequences of generic dependency installation. Follow the exact
procedure in `docs/SETUP.md`. Do not restart/disconnect an in-use machine. Do not
deploy a runtime or create/overwrite a protected task without its own authorization.

If the caller explicitly requests additional marketplace plugins, install only
the needed named packages following their README, preserve existing private
configuration, and restart Copilot before checking they are actually loaded.
No peer plugin prerequisite, global same-name skill invocation, sub-agent dispatch
or automatic MCP-to-MCP connection is introduced by this plugin.

## 4. Re-probe, qualify and hand back

Re-run Probe after changes and after each manual step/restart. Preserve separate
raw reports and actual exit codes. Do not interpret `scenarios.*` booleans as
live readiness: dependency inventory cannot
prove Chromium launch, current target authentication, AT output or audio behavior.

With separately authorized owned interactive access, verify only requested
capabilities using actual tools: visible browser launch and target access;
real named/versioned AT output for AT work; scoped harmless audio recognition
for Voice Access. `ValidateHost` is an optional Console-only desktop-frame/tone
diagnostic, not product evidence or long-running screenshot automation. Read its
privacy and ownership requirements before use. No screenshot proves speech.

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
