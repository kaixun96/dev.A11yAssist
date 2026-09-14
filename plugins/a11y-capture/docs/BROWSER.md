# Bounded browser scenarios

Bug Bash and capture share one authored browser module. It runs explicit keyboard,
focus, rendered-name/state and text checks on an operator-approved HTTPS page.
It is not a scanner, a real-AT adapter or permission to modify production data.

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

Assertions are `focused`, `visible`, `count`, `text` and a small allow-list of
accessibility attributes. Expected values are typed booleans, bounded counts/text
or the appropriate nullable attribute value. A missing/ambiguous action target,
lost document focus, script error or unexpected dialog/popup is a coverage gap,
not automatically a product defect.

## Execution

The trusted connection translates rows to a version-1 native request with
`taskId`, `target`, `rows`, `budgetSeconds` (1-180) and `viewport`. It must apply
the original owner/evaluator gates before execution. The deployed
`browser-policy.json` is operator-controlled and hash-bound, not a model-supplied
allow-list. The shipped example enables no target.

The current runner supports anonymous, client-side HTTPS scenarios. It starts an
owned visible Chromium context, resets the exact page before each row and records
actual assertions, screenshots and an accessibility-tree snapshot. Only permitted
GET/HEAD assets are allowed; other document destinations, fetch/XHR, WebSockets
and service workers are blocked. This deliberately excludes server-backed
transactions and authenticated/private-profile workflows until a separately
qualified connection supports them.

Use actual compatible Python/Playwright/Chromium dependencies under the same
interpreter/import mode as setup. `--validate-only` checks request shape without
importing Playwright or opening a browser. Live execution requires an owned
Windows evaluator; Codespaces/non-Windows execution rejects before UI effects.

## Outputs and completion

Every requested row is retained as a conclusive observation or a precise gap.
`not-run` rows do not inflate attempted coverage. The report binds request,
runner/support hashes, target, viewport, actual tool versions and evidence bytes.
A trusted consumer independently compares each returned assertion/actual value
with the original request before accepting a verdict.

The provider must preserve native correlation and reconcile unknown outcomes.
Success includes observed owned-browser/process cleanup, not process presence or
a claimed receipt. A configured discovery connection can retain one evaluator
across bounded batches and release only its final owned assignment after earlier
batch completions are verified. Real AT, conformance, source fixes and issue/PR
publication remain outside this module.
