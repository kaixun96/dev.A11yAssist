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

## Outputs and completion

Every requested row is retained as a conclusive observation or a precise gap.
`not-run` rows do not inflate attempted coverage. The report binds request,
runner/support hashes, target, viewport, actual tool versions and evidence bytes.
A trusted consumer independently compares each returned assertion/actual value
with the original request before accepting a verdict.

Each row uses a Python callback compatible with Playwright's event metadata and
removes that same listener afterward. Observed page-script errors still prevent
a conclusive row; callback compatibility must not disable error detection.

The provider must preserve native correlation and reconcile unknown outcomes.
Success includes observed owned-browser/process cleanup, not process presence or
a claimed receipt. A configured discovery connection can retain one evaluator
across bounded batches and release only its final owned assignment after earlier
batch completions are verified. Real AT, conformance, source fixes and issue/PR
publication remain outside this module.
