# Built-in execution adapters

These are executable integrations, not replacements for NVDA, Narrator, Voice
Access, Chromium, axe-core, Azure CLI or the deployment's original resource
manager. They do not install tools, acquire/expire a lease, migrate an active
worker, or turn raw observations into accessibility conformance.

| Owning capability | Implementation and supported scope |
|---|---|
| Shared browser / capture | One visible ephemeral or existing persistent Chromium profile; explicit HTTPS network rules; original-page readiness; keyboard/DOM checks, actual CSS-pixel target size and pinned local axe-core |
| `a11y-capture` / `observe-at` | NVDA Speech Viewer deltas; Narrator ETW activity markers plus recorded audio; Voice Access reviewed number-overlay commands plus raw native UIA/audio |
| `a11y-setup` / `recover-devbox` | Start an existing public-cloud DevBox under its original recovery lease; read back the same operation/resource without replay |
| Shared authentication | An existing process-local authorization header or a tenant-bound, pinned host Azure CLI; no token files, copied cookies, automatic login or account switching |

## Browser and scanner

Use `browser/policy.v2.example.json` for an explicitly authorized persistent
profile and network routes; `policy.example.json` retains the anonymous,
client-side default. Both ship with no authorized target. Request rows cannot
change policy, profile, authentication origins, scanner script or HTTP permissions.

The profile must already exist, belong to the original evaluator/task, and be
Chromium-compatible. The runner uses that **same visible context** from target
navigation through silent account renewal, readiness and capture. It never falls
back to headless, system Edge, another profile or copied browser storage. Only the
operator's authentication origins are permitted during renewal; target URL plus
one protected readiness element must be observed within the original budget.
An explicit login/MFA/consent or unready application remains a gap.

Exact URL/method/resource-type rules enable server-backed fetch/XHR. A rule is
not permission to perform unrelated application mutations. Non-GET/HEAD target
requests are journaled before transmission, with query/body credentials omitted.
Their server-side effect/reset is unknown until independently reconciled: the row
becomes inconclusive and subsequent rows are not run. No automatic compensating
delete, mutation retry, or reload-as-reset claim is supplied. WebSockets, service
workers, arbitrary JavaScript and password filling remain unsupported.

Policy v3 additionally supports separately qualified, exact empty-body bootstrap
POSTs using the protected `readOnly` body hash and expected JSON keys described in
[bounded browser scenarios](BROWSER.md#qualified-empty-body-bootstrap-posts).
Body/method-override mismatches reject before dispatch. Pending or unverified
responses remain unresolved; ordinary transaction/reset requirements are unchanged.
The policy declaration is an operator responsibility, not a caller-supplied verdict.

Policy v4 adds exact-endpoint query-name scopes, owned-target child-frame
permissions and explicit requests to existing authentication origins. It also
supports declared telemetry denials: those requests remain blocked and visible
in diagnostics, while every other failure and UI/JavaScript gate stays active.
See [scoped page dependencies](BROWSER.md#scoped-page-dependencies-policy-v4).
These are private operator qualifications, not enabled public defaults or
permission to relabel a functional dependency as telemetry.

Additional typed assertions:

```json
{
  "steps": [],
  "assertions": [
    {"kind":"target-size","target":{"css":"#submit"},"minimum":{"width":24,"height":24},"expected":true},
    {"kind":"axe-violations","target":{"css":"#main"},"expected":0}
  ]
}
```

`target-size` records actual rendered CSS pixels and device scale. It does not
decide WCAG spacing/exception applicability or general screenshot contrast.
`axe-violations` invokes the operator-installed, SHA-256-pinned axe-core bytes,
not a CDN script. It retains actual engine version, violations and incomplete
checks; incomplete checks require review, never a zero-issues verdict. The
consumer independently recalculates counts/size comparisons. Install the chosen
official scanner only through separately approved setup; packages ship no vendor
script. Only enable injection into a private authenticated target when explicitly
authorized for that exact target and reviewed local script.

## Real AT observation

Configure the capture connection using `config/example.windows-at.json`, replace
all placeholder paths/hashes/identities, and keep its policy outside the plugin.
`native/windows-at.policy.example.json` documents the required protected policy.
Only selected AT dependencies are required. The original execution token is
resolved from a process environment-variable **name**, never passed in tool input.
Use the original live pool, not a copied registry.

Native process binding uses `PROCESS_QUERY_LIMITED_INFORMATION` to read the image
path and creation time from one handle. This supports UIAccess AT processes whose
`Get-Process.Path`, CIM executable path or module enumeration can be unavailable
to a Limited caller. No VM-read/debug access, elevation or relaxed PID/time/path/
session/hash checks are used. AT version is read from the validated image file,
not by enumerating another process's modules.

An authorized caller can run the packaged `native/windows-at.ps1
-InspectProcessId <actual-pid>` for read-only identity metadata in the caller's
Windows session. It returns the image path and unrounded seven-digit start time,
does not import UI Automation, and cannot be combined with observation parameters.
It grants no execution ownership, foreground control, recording or AT verdict.
Use it to populate a separately authorized observation request, never to adopt an
unrelated process or bypass the original lease and protected policy.

The policy's selected `atExecutables` map accepts `nvda`, `narrator` and
`voice-access`, each with its installed absolute `path` and actual `sha256`.
NVDA additionally uses `nvdaSpeechViewerTitle`. Narrator/Voice Access add pinned
`ffmpeg` and `audioModule` (the approved AudioDeviceCmdlets root module), plus
exact `audioInputName` and `audioOutputName`. Voice Access adds
`voiceCommands:{"show-numbers":{"path":"<reviewed WAV>","sha256":"<hash>"},
"hide-numbers":{"path":"<reviewed WAV>","sha256":"<hash>"}}`.
Do not configure unneeded dependencies or copy another evaluator's paths/hashes.

Call `a11y_capture_invoke` with action `observe-at`, a stable operation ID,
context `subject`, `scenarioHash`, `evaluator`, and input:

```json
{
  "at":"nvda",
  "nativeRunId":"11111111111111111111111111111111",
  "atProcess":{"pid":123,"startedAt":"2026-01-01T00:00:00.1234567Z"},
  "browserProcess":{"pid":456,"startedAt":"2026-01-01T00:00:00.7654321Z"},
  "browserWindowHandle":"123456",
  "command":null,
  "keys":[{"key":"Tab","delayMilliseconds":100}],
  "observeMilliseconds":2000
}
```

The numbers above are deliberately synthetic, not usable ownership evidence.
Inspect the actual native PID/start-time/HWND on the original evaluator, without
rounding its seven-digit timestamp. The driver rechecks the original live
lease/run/token/subject, physical console, pinned executable bytes, exact process
identities, foreground HWND and UIA focus before effects and at postcheck. It
does not bring another window forward, start/replace AT, change audio routing,
install anything or stop borrowed browser/AT processes. Setup must first provide
the selected, correctly configured tools.

For `narrator`, use the same input shape with `at:"narrator"`. The native driver
checks the installed Narrator manifest, records events 5/6 for the exact Narrator
PID in the trigger-to-observation window, and saves ETL, decoded XML and actual
WAV samples. **Activity markers contain no speech text.** Audio quality,
speaker attribution, spoken content and behavior still require independent
review. Missing markers or manifest/ETW identity mismatch cannot pass observation.
ETW Logger Id parsing is currently English-Windows-specific; an unrecognized
localized query is an explicit recovery/qualification gap, not a guessed identity.

For `voice-access`, use `keys:[]` and `command:"show-numbers"` or `"hide-numbers"`.
The policy names reviewed, pinned PCM command recordings (at most five seconds).
Playback and recording use already-configured approved endpoints; first-run
language/consent and listening mode are setup requirements. The driver retains
before/after visible Voice Access UIA names, runtime IDs and geometry, plus audio.
It does **not** equate a visible overlay with correct recognition or map labels
to page/browser/taskbar/OS targets. That complete map and recognition/behavior
assessment remain independent evidence gates.

For NVDA, the already-enabled Speech Viewer must expose one unambiguous native
text control. Output must extend its original baseline; resets/truncation or no
new output are inconclusive. This adapter does not synthesize screen-reader
output, interpret a DOM snapshot as speech or clear another session's viewer.

Raw observation receipts intentionally use `scope:"raw-at-output"` and
`behaviorVerdict:"not-evaluated"`. They cannot satisfy `before`, `after`,
`discovery-observe`, or evidence-v1 merely by relabeling the action or copying
gates. The qualified scenario/behavior connection consumes these raw artifacts
and supplies the independently accepted assessment. Do not replace an existing
multi-action capture provider with this narrower connection for an active run.
`nativePreflightVerified` / `nativePostcheckVerified` cover native process,
ownership, focus and selected audio state, not browser URL/DOM/fixture identity.
The composing scenario connection must independently bind that page state.

Interrupted actions keep their exact request/artifacts and borrowed resources.
Use the original operation's reconciliation; it reads the native report and never
replays keys, voice or ETW startup. A missing/unfinished report remains unknown.
Owned recorder/ETW cleanup failures remain explicit; use the original process and
session identities through the deployment's scoped recovery route, never a fresh
capture, broad process kill or arbitrary PID takeover.

## Resource recovery

`config/example.devcenter.json` configures native `recover-devbox` on the setup
resources connection. This narrower connection does not implement pool allocation,
status or lease release; keep the original pool tools for those operations.
Use it as a separately configured standalone setup invocation, not a replacement
for an active multi-action resources provider.

Before calling, acquire a recovery lease through the original manager. Supply
context `subject` (`task:<id>` or the original Bug string), `evaluator`, and input
`{"recoveryId":"<original 32-hex ID>","authorizationReference":"<explicit start authority>"}`.
The native adapter reads the existing `evaluator-recovery-leases` and
`evaluator-recovery-owners` records, checks the original token hash and rejects an
execution lease. The configured pool root must be the original protected,
authoritative storage; it is never initialized/copied by the adapter.

It starts only an explicitly mapped, known stopped/hibernated existing Windows
DevBox. There is no restart, repair, create, delete or lease release. Start intent
is durable before the POST; lost responses are reconciled by GET only. Follow-up
URLs must remain in the exact project/Dev Center; redirects are rejected.
Retry-After is preserved. Caller polling is explicit, bounded and tied to the
original operation. No fictional callback or autonomous supervisor is advertised.

`cloudPowerRunning` proves only cloud power readback. It never proves physical
Console, browser authentication, worker health, audio or AT readiness. Continue
authorized setup/console recovery and fresh capability checks separately under
the same recovery authority; only the original manager may release it.

## Host authentication

Existing `authorizationEnvironmentVariable` configurations retain their behavior.
Alternatively, configure `authentication`:

```json
{
  "kind":"azure-cli",
  "executable":"C:\\Approved\\AzureCLI\\python.exe",
  "executableSha256":"<64 lowercase hex SHA-256>",
  "prefixArgs":["-I","-m","azure.cli"],
  "tenantId":"11111111-2222-3333-4444-555555555555"
}
```

Use the actual Azure CLI interpreter/module environment. A native CLI executable
uses `prefixArgs:[]`. Batch wrappers and arbitrary launcher code are rejected.
Only `account get-access-token` runs, with a fixed service audience and explicit
tenant. The result must contain an unexpired Bearer token for that tenant; token
and CLI output are never persisted in reports. No `az login`, account switching,
credential export, browser cookie copying or authentication bypass occurs.
This is wired into native ADO intake, publication, filing/inspection/continuation
and native Dev Center start/readback. An explicit login/MFA/consent failure remains
owner-controlled.

## Release versus qualification

Deploy only to new operations after dependency/policy and actual-host
qualification. Existing journals, scenario/category versions, worker/provider
closures and AgentOW pins remain unchanged. The source tests use offline
API/process doubles and parse the native driver without controlling a desktop.
This release does not install/deploy anything, start a DevBox, authenticate,
record AT/audio, create a Bug or resume a live test.
