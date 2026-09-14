# Accessibility environment setup

`a11y-setup` extracts the installation workflow from AgentOW's
[`ow-a11y-host-setup` tutorial](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-a11y-host-setup/SKILL.md).
The tutorial's installer was already generated from this repository. This
package reuses `src/native/windows-host.ps1` and the retained personal-browser
helper; it does not fork another installer or require AgentOW.

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
There is no MCP server, Node dependency or `A11Y_ASSIST_CONFIG` requirement for
this setup package. Copilot must have authorized shell/file tools on the actual
Windows host. Codespaces and non-Windows hosts stop before probing or installing.
Source-only review requires none of this setup.

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

Resolve `$pluginRoot` from the loaded skill, not the current working directory.
Choose one private absolute `$output` and one deployment-approved `$setupRoot`
for the actual host; reuse these across steps. The compatibility script defaults
to an older shared setup directory, so always supply the selected setup root.
The personal profile remains `$HOME\.playwright\personal-evaluator-profile`;
do not use it concurrently or silently create a different profile.

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
Omitting `-Dependency` retains the legacy full dependency set for compatibility;
the new skill always supplies an explicit subset.

Winget uses `NVAccess.NVDA`, `Gyan.FFmpeg` and `Python.Python.3.12`; Python
modules come from the host's approved pip source and AudioDeviceCmdlets from
the approved PowerShell repository. The legacy Winget action accepts package
and source agreements, so obtain authorization for these before invoking it.
Do not change enterprise repositories or bypass package rejection. NVDA setup
also changes Speech Viewer settings: preserve prior configuration and avoid
another session's NVDA. Do not install into product source or modify a worker.

## Persistent browser

Prefer an already working authorized connection. For the bundled compatibility
route, separately authorize helper installation; it copies the packaged helper
to `$setupRoot` and invalidates that helper's previous authentication receipt.
Inspect existing ownership/version first; never overwrite another deployment.

This retained helper is SharePoint-specific: its default bootstrap/check route
is the SharePoint dogfood campaigns page with historical debug flights. Use it
only when that route and Microsoft account integration are explicitly in scope.
It may install the Microsoft Windows Accounts browser extension as part of
launch; that download also needs authorization. For other products, use their
existing approved browser connector rather than this helper's default route.
Its campaign capture command is outside setup scope and must not be run.

```powershell
& $setup -Action InstallPersonalEvaluatorBrowser -SetupRoot $setupRoot `
  -OutputPath (Join-Path $output 'browser.json')
$state = Get-Content (Join-Path $output 'browser.json') -Raw | ConvertFrom-Json
$python = $state.prerequisites.python.path
$evaluator = $state.prerequisites.personalEvaluatorBrowser.scriptPath
$env:PERSONAL_EVALUATOR_OWNER_EMAIL = '<owner-email>'
try {
  & $python $evaluator bootstrap --timeout-minutes 30
  if ($LASTEXITCODE -ne 0) { throw "Browser bootstrap failed: $LASTEXITCODE" }
} finally {
  Remove-Item Env:\PERSONAL_EVALUATOR_OWNER_EMAIL
}
```

Bootstrap is headed and requires an owned interactive desktop. Let visible
Windows account renewal run; ask the owner only for an explicit remaining
password, Windows Hello, MFA, certificate or consent prompt. Never copy cookie
databases or open system Edge on the Chromium-owned profile.

`CheckPersonalEvaluatorBrowser` runs the legacy helper's headless check and
stores a short-lived authentication observation. A login/FIDO result is not
proof that owner intervention is needed. Use visible bootstrap on the same
profile; do not repeatedly close/reopen headless contexts. This helper does not
keep a browser connection alive for arbitrary caller operations. The caller
must use its approved persistent visible browser connection for target access
through capture; never present bootstrap success as that connection.

## Separately gated Windows steps

Only perform the applicable steps with explicit authority and exclusive desktop
ownership. They are not implied by `prepare browser` or package installation.

1. **VB-CABLE:** `StageVbCable` downloads the fixed official package and checks
   its pinned SHA-256 and valid `BUREL VINCENT` signature. Never weaken either
   check. `LaunchVbCableInstaller` stages again and launches the vendor installer
   with elevation. The owner completes Install Driver. Record restart-required;
   do not reboot automatically. After an authorized restart, re-probe both
   `CABLE Input` render and `CABLE Output` capture endpoints and current exposure.
2. **Voice Access:** `OpenVoiceAccess` requires supported Windows and opens
   first-run setup. The owner completes language selection and Agree and
   continue. Configuration/process presence does not prove recognition.
3. **Console task:** only if unattended audio/desktop work requires it, inspect
   the deployment's existing task first. `InstallConsoleTransferTask` registers
   an elevated InteractiveToken task with fixed embedded logic, not an elevated
   user-writable script. It can overwrite a same-name task; use the existing
   protected provisioning process on managed hosts. Never replace a foreign task.
4. **Console transfer:** `RunConsoleTransfer` disconnects RDP. Obtain explicit
   authority, persist resume state and ensure no other work owns the desktop.
   Its compatibility logic selects an Explorer session, so require a single
   unambiguous owned interactive session first; do not run it on a multi-user
   host. Do not reconnect after successful transfer. Exit zero alone is not
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
restart and runtime gaps separately. The inherited `scenarios.*` flags include
legacy Edge assumptions: they are diagnostics, not reliable readiness verdicts
for a Chromium or different caller route. An actual browser/AT/audio capability
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
