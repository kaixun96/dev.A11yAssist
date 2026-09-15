# Bounded browser scenarios

Bug Bash and capture share one authored browser module. It runs explicit keyboard,
focus, rendered-name/state and text checks on an operator-approved HTTPS page.
Policy v2 additionally supports a persistent authenticated Chromium profile,
explicit server routes, pinned axe-core scanning and actual target-size measurements.
It is not a real-AT adapter or blanket permission to modify production data.
Read [execution adapters](EXECUTION-ADAPTERS.md) for the exact bounds.

For initialization, navigation or policy failures, use the capture section of
[execution lessons](EXECUTION-LESSONS.md) / [简体中文](EXECUTION-LESSONS.zh-CN.md).
Record the last completed boundary and keep infrastructure errors distinct from
product findings; a packaged fix still needs real installed-runner qualification.

## Inputs

Select a `browser-scenarios` profile in the optional discovery CLI. The operator
configures exact targets, `capabilities: ["browser"]` and a bounded `maxBatchRows`
(at most 30 for this runner). Each page row's `parameters` contains only `steps`
and `assertions`. The agent derives them from the user's verification journey.

```json
{
  "steps": [
    {"action": "click", "target": {"role": "button", "name": "Open"}},
    {"action": "press", "key": "Escape"}
  ],
  "assertions": [
    {"kind": "focused", "target": {"css": "#open"}, "expected": true}
  ]
}
```

Locators use an exact element ID (`#open`) or an exact role/name pair. Actions are
`click`, bounded `fill` and supported page keys such as Tab, Shift+Tab, Enter,
Escape and arrows. Arbitrary JavaScript, shell commands, OS shortcuts and password
entry are not supported.

Actions use Playwright's strict locator auto-wait within the original remaining
budget. A momentarily absent asynchronous control is not rejected by an immediate
count probe. Ambiguous targets still fail strictness checks, and password inputs
remain forbidden.

If a source-qualified initialization query is consumed by the page, a row may
explicitly declare `expectedUrl`: the initial target with its entire query removed,
on the same exact HTTPS origin/path. Both URLs must already be in the protected
target allow-list. Navigation still uses the original target; authentication
readiness, observations, inspection and capture gates require the declared final
URL. The request/evidence preserve both. This is not automatic URL normalization,
cross-route redirection permission or an exemption for script/network failures.
Without this field the original exact-URL requirement is unchanged.
Explicit frame and silent-authentication rules also recognize this declared final
root after query consumption, without granting a new endpoint or allowing another
path. Foreign roots and undeclared final URLs remain rejected.

On a failed preflight, an explicitly requested **leading** `observe` step may be
used only for bounded diagnostic settling before the failure screenshot. It does
not run later clicks/keys/forms, become an executed scenario step, erase startup
errors or change the failed verdict. The original target, credential-entry and
remaining-budget guards apply before and after this wait. The report labels it
`diagnosticObservation`, separately from actual scenario dwell.

Page-error diagnostics preserve available stack URL paths and line/column numbers
without query values, fragments, credentials, function arguments or raw stacks.
Missing locations remain unknown; they never justify ignoring the error.
Bounded Chromium exception diagnostics additionally collect available main-target
exception locations and async stack locations, including thrown `undefined`.
They never request remote-object properties, evaluate paused frames, pause the
page, or record exception values/descriptions. URLs omit query values and
credentials. Separate iframe targets and truncated/unavailable traces remain
explicit gaps; no error or verdict gate is relaxed.

`{"action":"observe","milliseconds":1000}` provides an explicit observation
dwell from 1 to 30,000 milliseconds for animation, asynchronous UI or a separately
authorized observation capability. It sends no input or scripts, records actual
start/end timing, and never extends the original request budget. A dwell larger
than the remaining budget fails before waiting. It does not itself start AT,
grant concurrent control or supply a speech/behavior verdict.

Assertions are `focused`, `visible`, `count`, `text`, `target-size`,
`axe-violations` and a small allow-list of accessibility attributes.
Expected values are typed booleans, bounded counts/text
or the appropriate nullable attribute value. A missing/ambiguous action target,
lost document focus, script error or unexpected dialog/popup is a coverage gap,
not automatically a product defect.

## Execution

The trusted connection translates rows to a version-1 native request with
`taskId`, `target`, `rows`, `budgetSeconds` (1-180) and `viewport`. It must apply
the original owner/evaluator gates before execution. The deployed
`browser-policy.json` is operator-controlled and hash-bound, not a model-supplied
allow-list. The shipped example enables no target.

The default v1 policy supports anonymous, client-side HTTPS scenarios. It starts an
owned visible Chromium context, resets the exact page before each row and records
actual assertions, screenshots and an accessibility-tree snapshot. Only permitted
GET/HEAD assets are allowed; other document destinations, fetch/XHR, WebSockets
and service workers are blocked. This deliberately excludes server-backed
transactions and authenticated/private-profile workflows. Policy v2 explicitly
opts into a protected existing profile, authentication origins and exact request
rules; defaults are not widened. A server mutation is journaled before dispatch
and requires independent server-state/reset reconciliation before another row.

Use actual compatible Python/Playwright/Chromium dependencies under the same
interpreter/import mode as setup. `--validate-only` checks request shape without
importing Playwright or opening a browser. Live execution requires an owned
Windows evaluator; Codespaces/non-Windows execution rejects before UI effects.

## Pinned Microsoft device SSO (policy v7)

A protected persistent connection may opt into `windowsAccountsExtension` with
an existing local `directory` and its complete `treeSha256`. The operator first
qualifies the already installed Microsoft Single Sign On extension and pins an
administrator-controlled copy. The runner does not download or install it.

Before launching Chromium it verifies the manifest's public-key-derived
`ppnbnpeolgkicgegkbkbjmhlideopiji` identity and the entire bounded file tree.
The tree digest is SHA-256 over ordinal-sorted UTF-8
`relative/path<TAB>lowercase-file-sha256<LF>` records. Symbolic links, path escapes,
remote directories, comma-separated paths, excessive trees and pin changes fail
closed. The verified extension identity/version/hash is retained in the report.

Only that pinned extension is loaded, using the existing headed Chromium profile
and Microsoft's normal BrowserCore integration. No cookie copying, credential
extraction, silent headless fallback, consent bypass or request-policy relaxation
is introduced. Password/MFA and unexpected application grants remain separate
gates. Without this explicit v7 configuration extension behavior is unchanged.

## Qualified empty-body bootstrap POSTs

Policy v3 retains the v1/v2 defaults and adds an explicit, operator-qualified
read-only rule for an exact empty-body `POST` configuration fetch:

```json
{
  "url": "https://example.org/bootstrap",
  "methods": ["POST"],
  "resourceTypes": ["fetch"],
  "readOnly": {
    "bodySha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "responseKeys": ["navigation"]
  }
}
```

This declaration belongs only in the protected operator policy, never scenario
input. First establish and authorize the endpoint's read-only purpose using the
actual application contract and observed request/response. Empty bytes and JSON
shape alone are not proof that an arbitrary endpoint has no server-side effects.
The example policy enables no target or rule.

Only empty POST bodies are supported. Different body bytes, method overrides,
nonzero content lengths or transfer encoding reject before dispatch; overlapping
v3 permissions reject at validation. The request is journaled as pending before
transmission and becomes `read-only-confirmed` only after a successful JSON response
contains every declared top-level key. Confirmation waits for the actual
request-finished event within the original budget; JSON bodies are limited to
4 MiB. Response values are not copied to the
receipt. Pending, failed or unexpected responses retain unresolved effects and
block subsequent rows within the original budget. All ordinary authorized
non-GET/HEAD requests still require the original effect/reset reconciliation.
This is neither a blanket POST exception nor an accessibility verdict.

## Authenticated JSON document readiness (policy v6)

For an independently authorized GET diagnostic whose document is JSON rather than
an application page, policy v6 may declare persistent connection readiness as
`"ready": {"jsonResponseKeys": ["items"]}`. This is operator policy, never a row
override or automatic inference. Use a separately scoped policy with only the
intended diagnostic target URLs; do not replace application-page readiness.

Readiness requires the exact target URL, JSON document MIME type, one visible
browser-rendered `body > pre`, a valid JSON object no larger than 65,536 UTF-8
bytes, and all declared unique top-level keys. Duplicate JSON keys, nonstandard
constants, arrays, error shapes without those keys, HTML login pages, redirects
and expired original deadlines cannot satisfy it. Versions 1-5 retain exact-ID
HTML readiness. No requests, credentials, scopes, POST exceptions or server
effects are authorized or reconciled by this shape check. Existing response,
capture, effect and cleanup gates still apply. Diagnostic state retrieval is not
product accessibility coverage.

## Qualified JSON reads (policy v5)

Some independently established read-only APIs require a JSON POST body. Policy v5
allows a protected `readOnly` qualification to additionally declare
`bodyFormat: "json"` and `bodyBytes` (1-65,536), with the SHA-256 of the exact
source-qualified request body. Versions 1-4 retain their previous restrictions.

The operator must first establish the exact endpoint's read-only semantics,
including any flags that could create or update state. A POST, an API name or a
JSON boolean alone never proves read-only behavior. The policy stores the digest
and byte count, not request contents. No wildcard body, field projection,
normalization, unknown query or automatic permission discovery is supported.
Several independently qualified bodies can share one endpoint in v5 only when
every overlapping rule is read-only and their exact body digests differ. The
actual matching body selects its own response qualification. Duplicate digests,
ordinary mutation fallbacks and changed/unlisted bodies remain rejected,
including during authentication renewal. Versions 1-4 still reject overlaps.

Before transmission the actual bytes, length, JSON object format and
`application/json` content type must match. Method-override and transfer-encoding
headers, mismatched content lengths and any changed body remain denied.
The same pending-before-send journal, bounded successful JSON response and
explicit response-key checks apply. Missing or failed responses retain unresolved
effects; this is not a reset exemption for ordinary mutations or an A11y result.
Empty-body bootstrap qualifications and all other policy-v4 scopes remain available.

When source and live request shape differ, v5 can separately opt into
`bodyDiagnostics`: at most ten exact non-authentication URLs, each with
`jsonBooleanFields` (at most ten explicitly named root boolean fields, possibly
empty) and a nonempty operator `qualification`. This observes **denied** JSON
POSTs without transmitting them or adding any permission. Qualify only known
non-secret-bearing application APIs, never credential submissions.

The bounded diagnostic records the exact body digest and only those named
boolean values. It never records strings, numbers, arbitrary keys, nested values,
headers or raw bodies. Non-JSON, oversized, duplicate-key or missing/non-boolean
fields leave explicit unavailable/incomplete metadata. These observations do not
prove read-only semantics and never create a permission automatically.

V7 can combine exact-body `readOnly` POST qualifications with explicit
`queryKeys`, including OData aliases such as `@listUrl`. The same names-only scope
is available on `bodyDiagnostics`, which still never grants transmission.
Duplicate/unlisted parameters, changed bodies, other endpoints and unqualified
POSTs remain denied. Query values and raw bodies are not added to diagnostics;
older policy versions retain their previous query/body restrictions.
For a transport that may carry credentials, v7 `bodyDiagnostics` may set
`schemaOnly: true` with an empty `jsonBooleanFields` list. This reports only
bounded root JSON/form field names and a format enum, never values or body
digests. It remains denied and cannot target an authentication origin. Do not
infer read-only semantics or grant access from those field names.
V7 also permits explicit GET/HEAD `image` resource rules, so a known image URL
need not grant script access to its entire CDN host. Other methods remain rejected.

## Scoped page dependencies (policy v4)

Policy v4 keeps earlier defaults and adds explicit operator-owned declarations:

- `queryKeys` permits only named, non-duplicated parameters on one exact endpoint.
  Query values are not copied into policy or diagnostics. Application query rules
  are GET/HEAD only; they do not allow a whole origin or arbitrary paths.
- `frame: true` permits a GET document only in a child frame rooted at the current
  target page. A supplied `origin` parameter must match that target's origin.
- `authentication: true` binds an exact endpoint to an already configured trusted
  authentication origin. It supports normal token refresh from the owned target,
  not accepting consent, filling passwords, changing accounts or granting scopes.
  Query-name constraints remain enforced even during authentication.
- `telemetryBlocks` **denies**, never sends, requests to exact operator-qualified
  out-of-band telemetry endpoints. Each rule needs `url` without query values,
  bounded `methods`/`resourceTypes` and a nonempty `qualification`. Document,
  script, stylesheet and PUT/PATCH/DELETE failures cannot be hidden this way.
  Defaults contain no such rules.

An intentional telemetry denial is recorded as `expectedTelemetryDenial`; it
does not by itself fail page readiness. This is a declared privacy/test condition,
not a general ignore-error switch. Qualify that the endpoint is telemetry rather
than required feature data, report this condition and inspect the actual UI.
Page-script errors, unexpected dialogs, other blocked requests, failed functional
responses, authentication, focus and scenario checks retain their existing gates.
Do not reclassify product/API failures as telemetry or use this to change expected
benchmark results. Ordinary mutation/effect/reset rules are unchanged.

Preflight and postcheck diagnostics retain page errors, dialog observations and
critical request failure counts even when capture is forbidden. Failed response
diagnostics omit query values. Infrastructure gaps are not product findings.
Denied-request diagnostics additionally record bounded query parameter names and
whether names repeat. Query values, headers and raw request bodies are never recorded.
Oversized, malformed or unsupported names produce `queryKeysComplete: false`,
not permission to guess a wider rule. An observed name is only a qualification
input; it does not automatically authorize the endpoint or its parameter values.

Policy v5 and later support at most 300 explicit request rules so galleries can
bind individual image URLs without an origin-wide fetch permission. Earlier
versions retain the 100-rule limit. This changes the bounded list capacity, not
which URLs or methods a rule permits.

Denial details remain capped at 200 records; `blockedRequestCount` and
`blockedRequestsTruncated` expose any omitted tail. A truncated diagnostic list is
not a complete network inventory and never removes the failure/evidence gap.

## Outputs and completion

### Explicit document inspection

An optional `inspection: true` row parameter captures bounded, read-only DOM
accessibility attributes, computed styles and element rectangles, together with
the existing screenshot and accessibility snapshot. It supports HTML, SVG and
XML document roots without requiring an invented element ID or dummy assertion:

```json
{"steps":[],"assertions":[],"inspection":true}
```

Empty assertions are allowed only for this explicit mode. Such a row remains
`inconclusive`: it supplies raw observations for caller assessment, never an
accessibility verdict. Normal bounded steps/assertions may also request inspection;
their behavioral comparisons remain unchanged. No arbitrary scripts or OS keys
are added. The deployment adapter must support the optional field before dispatch.

`documentInspection` is hash-bound inside the row's report. It records at most
1,000 light-DOM elements and 64 selected attributes per element, omits DOM text,
form values, script bodies, link/media URLs and arbitrary data attributes. Its
serialized value is checked against a 4 MiB bound before adding it to the report.
Attribute/style truncation, open-shadow-root observations and the light-DOM-only
scope remain explicit gaps. Child-frame elements are counted, but their documents
are not traversed; this is not a complete reachable-state inventory.
Use the screenshot/AX artifacts for content and the separate real-AT tools for
speech. Do not turn raw inspection, setup success or a native completion into a
case PASS or erase unvisited categories.

Every requested row is retained as a conclusive observation or a precise gap.
`not-run` rows do not inflate attempted coverage. The report binds request,
runner/support hashes, target, viewport, actual tool versions and evidence bytes.
A trusted consumer independently compares each returned assertion/actual value
with the original request before accepting a verdict.

Each row uses a Python callback compatible with Playwright's event metadata and
removes that same listener afterward. Observed page-script errors still prevent
a conclusive row; callback compatibility must not disable error detection.

Failed preflight never triggers scenario actions or accepts a behavioral verdict.
While the original budget remains, the runner may retain an original-target
screenshot and document-root accessibility snapshot as `environment-diagnostic`
evidence. Authentication redirects and password/one-time-code input pages are
excluded, including a final state check before writing the bounded 4 MiB bundle.
These artifacts do not change failed preflight/postcheck flags or the
row's blocked/inconclusive status. The original failure and any diagnostic-capture
error are retained separately. Blocked-request diagnostics include method, body
byte count and whether a query exists, but not query values, headers or body contents.

The provider must preserve native correlation and reconcile unknown outcomes.
Success includes observed owned-browser/process cleanup, not process presence or
a claimed receipt. A configured discovery connection can retain one evaluator
across bounded batches and release only its final owned assignment after earlier
batch completions are verified. Real AT, conformance, source fixes and issue/PR
publication remain outside this module.
