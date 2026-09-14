# Accessibility environment setup

`a11y-setup` maintains the scoped Windows preparation workflow, with factual
design attribution to AgentOW's
[`ow-a11y-host-setup` tutorial](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-a11y-host-setup/SKILL.md).
The current implementation is `src/native/windows-host.ps1`, with one authored
setup skill and dependency templates under `src/setup/`. Standalone setup and
Bug Bash's internal module reuse those sources. Attribution does not establish
an execution dependency: no integration archive, provider alias, root native
export or product-specific browser runtime is retained by this package.

## Installation and scope

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-setup@a11y-assist
```

Restart Copilot, then request `/a11y-setup check browser and NVDA on <host>;
save the plan to <private directory>`. To authorize changes, request
`/a11y-setup prepare browser on <owned Windows host>; install missing approved
dependencies; keep driver/elevation/restart actions separate`.

Installation loads a skill plus scripts, not the third-party software itself.
Like all ten plugins, setup registers its own read-only knowledge MCP and
top-level references selecting the 32 current Common, Fluent and SharePoint
entries. Knowledge requires Node.js 22+ and enabled host MCP, but no setup,
peer plugin, provider or `A11Y_ASSIST_CONFIG`. Its tools are
`a11y_setup_knowledge_list`, `a11y_setup_knowledge_search(query)` and
`a11y_setup_knowledge_read(id)`. Internal Bug Bash setup uses the containing
plugin's `a11y_bug_bash_knowledge_*` tools instead, without a nested server.
There is no operational MCP server. Native preparation uses authorized shell/file
tools on the actual Windows host, separately from knowledge access. Codespaces
and non-Windows hosts stop before probing or installing. Source-only review
requires none of this host setup.

Read `${PLUGIN_ROOT}/references/README.md` for the selected KB pins. List/select/read
actual entries with citations and source status; search snippets are not complete
rules and pending sources are not authority. Knowledge review permits only
registered read-only knowledge tools and relevant source/reference reads, never
setup scripts, shells, tests, browsers or AT. A missing knowledge tool/content is
an explicit gap, not authority to prepare a host or invent a verified read.
The loader resolves an absolute configured KB root, a validated repository layout,
verified shared cache, then lazy pinned HTTPS download. Invalid roots and tampered
caches fail without fallback/repair. Verified cache works offline; first uncached
use requires a valid local KB or the reachable published pinned artifact. Local
builds do not prove public URL availability or update installed releases.

## Check, select, prepare, qualify

Default `check` runs only a host inventory and writes a private report.
It does not install packages, open AT/browser, authenticate or change settings.
Select profiles in `setup/profiles.json`; combine only the capabilities needed.

| Profile | Scriptable dependencies | Separate gates |
|---|---|---|
| browser | Python, Playwright, Chromium | Actual callable connection, visible launch, target authentication |
| nvda | NVDA and Speech Viewer configuration | Exclusive desktop, real observed NVDA output |
| audio | Python, FFmpeg, AudioDeviceCmdlets, MSS, PyAudioWPatch | VB-CABLE driver, Console, real audio/desktop checks |
| voice-access | Audio profile dependencies | Supported Windows, first-run language/consent, driver and actual recognition |
| source-only | None | No Windows probe |

Scanner/axe integrations, Narrator/ADK/WPA, optional execution plugins and their
service connections are inventoried but not automatically installed. Follow
their official/organization-approved instructions only when explicitly selected.
This is not an installer for every possible A11y tool.

Set `$pluginRoot` to the host-resolved top-level `${PLUGIN_ROOT}`, never the
working directory or a directory inferred from skill nesting. Standalone setup
and Bug Bash both keep this document, `setup/profiles.json`,
`setup/report.template.md`, `native/windows-host.ps1` and knowledge references
at that top-level root. Only the internal setup skill is under `modules/a11y-setup/`,
with only its knowledge tool prefix rebound to the Bug Bash server. There is no
nested resource directory, manifest or MCP registration to resolve.
Choose one private absolute `$output` and one deployment-approved `$setupRoot`
for the actual host; reuse these across steps and always pass the selected setup
root explicitly. Do not create dependency files in product source or plugin caches.

```powershell
$setup = Join-Path $pluginRoot 'native\windows-host.ps1'
$probe = Join-Path $output 'before.json'
& $setup -Action Probe -SetupRoot $setupRoot -OutputPath $probe

# Prepare mode only, after authorization for these packages and agreements:
& $setup -Action InstallSafeDependencies -Dependency Python,Playwright,Chromium `
  -SetupRoot $setupRoot -OutputPath (Join-Path $output 'after.json')
```

Use PowerShell array syntax in the same shell, not a comma-joined string passed
through `powershell.exe -File`. Supported dependency names are validated.
Chromium implies Playwright and Python; other Python modules imply Python.
The installer checks presence before installation and stops on nonzero exits.
It does not upgrade installed tools merely to obtain the newest version.
Always supply an explicit `-Dependency` subset for preparation. A dependency
selection is not a workflow profile and does not enable a provider. The current
script rejects an omitted/empty installation selection; `-Dependency` is valid
only with `InstallSafeDependencies`, not with `Probe` or other actions.

Winget uses `NVAccess.NVDA`, `Gyan.FFmpeg` and `Python.Python.3.12`; Python
modules come from the host's approved pip source and AudioDeviceCmdlets from
the approved PowerShell repository. The Winget action accepts package
and source agreements, so obtain authorization for these before invoking it.
Do not change enterprise repositories or bypass package rejection. NVDA setup
also changes Speech Viewer settings: preserve prior configuration and avoid
another session's NVDA. Do not install into product source or modify a worker.

## Persistent browser

Use an existing approved browser connection and its documented authentication
procedure. Installing Python/Playwright/Chromium does not create a callable browser
connection, select a tenant/target, authenticate an account or qualify capture.
No product-specific helper, integration runtime or default product route is bundled.
An unavailable connection is a runtime-unverified or blocked browser capability,
not a reason to reconstruct an archived installer or invent a provider.

Visible launch/authentication requires separately authorized interactive access
and an owned desktop/profile. Reuse a compatible owned persistent profile; never
overwrite another deployment, copy cookie databases or open system Edge against a
Chromium-owned profile. Keep account identifiers and credentials inside the trusted
connection. A headless login/FIDO result alone does not establish a manual blocker:
use approved visible renewal on the same profile when authorized. Password,
Windows Hello, MFA, certificates and consent must be completed by the owner.
Do not repeatedly close/reopen contexts or present authentication as proof of a
persistent connection. Verify actual target access with the caller's authorized
tools, and retain the owned visible connection through capture when required.

## Separately gated Windows steps

Only perform the applicable steps with explicit authority and exclusive desktop
ownership. They are not implied by `prepare browser` or package installation.

1. **VB-CABLE:** `StageVbCable` downloads the fixed official package and checks
   its pinned SHA-256 and valid `BUREL VINCENT` signature. Never weaken either
   check. After successful staging, `LaunchVbCableInstaller` revalidates the staged
   installer and launches it with elevation; it does not download or stage it.
   The owner completes Install Driver. Record restart-required;
   do not reboot automatically. After an authorized restart, re-probe both
   `CABLE Input` render and `CABLE Output` capture endpoints and current exposure.
2. **Voice Access:** `OpenVoiceAccess` requires supported Windows and opens
   first-run setup. The owner completes language selection and Agree and
   continue. Configuration/process presence does not prove recognition.
3. **Console task:** only if unattended audio/desktop work requires it, inspect
   the deployment's existing task first. `InstallConsoleTransferTask` registers
   an elevated InteractiveToken task with fixed embedded logic, not an elevated
   user-writable script. It refuses to overwrite an existing task and binds the
   original caller's interactive session. Use the existing protected provisioning
   process on managed hosts; never replace a foreign task or broaden its authority.
4. **Console transfer:** `RunConsoleTransfer` disconnects RDP. Obtain explicit
   authority, persist resume state and ensure no other work owns the desktop.
   It validates the task's principal, action and session binding before running;
   the embedded action requires the original caller session and its Explorer
   process, never selecting another session. Require unambiguous exclusive
   authority; do not use setup to take over a multi-user host. Do not reconnect
   after successful transfer. Exit zero alone is not
   Console/audio readiness.
5. **Diagnostics:** `ValidateHost` requires Console, takes one composed desktop
   frame and plays/records a tone through VB-CABLE. It is opt-in host diagnostics
   with sensitive-desktop/audio access, not a product screenshot runner. Close
   unrelated sensitive surfaces first; use approved browser captures for product
   screenshots and never use this for long-running capture. Voice Access still
   needs an actual harmless command and recognition observation.

Pass the same `-SetupRoot` and, where selected, `-ConsoleTaskName` on each call.
Use separate private output paths. Re-probe after each manual change/restart.
No driver binaries or third-party packages are redistributed in this plugin.

## Results, restart and composition

Use `setup/report.template.md`. Report installation/configuration/authorization,
restart and runtime gaps separately. Inventory and `scenarios.*` flags are
diagnostics, not reliable readiness verdicts for the caller's actual browser,
target or connection. An actual browser/AT/audio capability
check is required before `ready`; unsupported checks remain runtime-unverified.
This setup does not establish feature coverage, evidence-v1 or conformance.

If installing a selected Copilot plugin/MCP, preserve existing config, follow
its own setup contract, and restart Copilot before verifying the loaded tool.
For Twin, use Restart Copilot in the console header; retain durable resume state.
Restarting Copilot is not rebooting Windows or restarting a worker.

Bug Bash bundles this same setup module and uses its check/plan before page
execution. Preparation remains separately authorized; source-only/plan-only
never launch setup scripts. No second plugin installation is needed. Other
callers may install `a11y-setup` alone and consume the capability report.
