# Executable Bug Bash composition

The optional package-local CLI turns an accepted coverage plan into a durable
discovery task. The public `/a11y-bug-bash` skill still owns reasoning, applicability
and read-only source analysis. No replacement model loop or additional MCP server
is required. The guided, provider-free plan/source path remains available.

## Configure once

Use Node 22+ for this CLI. Copy `config/example.bug-bash.json` to an authorized
private location, set the actual owner and an existing private `stateRoot` outside
the repository/plugin, then set `A11Y_ASSIST_CONFIG` to that file.

The example enables no executable provider. `discoveryProfiles` is an operator
allow-list of capabilities and exact targets, not live readiness evidence.
`discoverySourceRoots` is the operator's source-read boundary; a plan can narrow
but not expand it. Preserve the real deployment's ownership and setup gates.

Configure `providers.capture` and `providers.operations` with the existing pinned
executable protocol. The capture connection must explicitly implement
`discovery-observe`; the operations connection implements `discovery-cancel`,
`discovery-cleanup` and `discovery-deliver`. A legacy BEFORE/AFTER provider does not
automatically understand these actions. No dummy Bug, evidence-v1 request or
unqualified browser/AT fallback is allowed.

## Create a plan

The calling agent reads the bundled context/coverage/knowledge, then writes an
authorized private JSON plan. Required fields:

| Field | Meaning |
|---|---|
| `schemaVersion`, `taskId` | `1`; unique lowercase task ID, 3-48 characters |
| `feature`, `authorizationReference` | User goal and original scope authorization |
| `mode` | `both`, `page-only`, `source-only` or `plan-only` |
| `profile`, `target`, `evaluator` | Operator-allowed composition and actual authorized target/host; unknown target/host is `null` |
| `sourceRoots`, `sourceRevision` | Narrow authorized roots and declared exact commit, or `null` revision |
| `budgetSeconds`, `maxRows` | Fixed 1-14400-second budget; 1-200 rows |
| `rows` | Explicit applicable coverage, including required AT checks even if unavailable |

Each row has `id`, `journey`, `state`, `dimension`, `track`, `capability`,
`preconditions`, `actions`, `expected` and `reset`. Tracks are `page`, `source`
and `at`; capabilities are respectively `browser`, `source-review`, or a named
`nvda`/`narrator`/`voice-access`. Preconditions/actions are nonempty string arrays.
Optional `dependsOn` names other rows; cycles/missing dependencies reject.
Optional bounded `parameters` holds the selected provider's declared scenario
parameters, never executable shell text or credentials.

```powershell
node "$pluginRoot\runtime\bug-bash-cli.mjs" create C:\private\plan.json
node "$pluginRoot\runtime\bug-bash-cli.mjs" advance my-feature-round
node "$pluginRoot\runtime\bug-bash-cli.mjs" status my-feature-round
```

`advance` performs one next safe step and returns remaining work. The caller must
continue it, not treat the returned next action as completion. It uses independent
ready rows, isolates unsupported capability gaps, requests bundled source review
when needed, then cleans, writes the report and delivers it.

## Source review and adaptive additions

When `advance` requests source review, use the actual bundled
`modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md` with read-only tools.
Do not run shell commands, tests or browser operations inside that knowledge
substep. After analysis, the coordinator records its result through the CLI:

```powershell
node "$pluginRoot\runtime\bug-bash-cli.mjs" source my-feature-round C:\private\review.json
```

The review has `rowId`, `status` (`finding` or `observed-no-issue`), `actual`,
`files` and `risks`. Each file has absolute `path`, `sha256`, `startLine`,
`endLine`; each risk has `title`, `impact`, `confirmation`. The runtime checks
actual bytes, line bounds and configured roots. It labels this caller analysis
as source-supported, never runtime-verified or an independent behavior verdict.

`append <taskId> <json>` accepts `{ "rows": [...], "reason": "..." }` without
deleting prior rows, extending the budget or changing submitted work.
`gap <taskId> <json>` accepts `{ "rowIds": [...], "reason": "..." }` only for
unexecuted rows. Gaps cannot become passing coverage or disappear from the report.

## Provider results and lifecycle

`discovery-observe` receives a versioned task, plan hash, selected profile, exact
target, original deadline and ready rows. Context binds `subject: task:<taskId>`,
the request's canonical `scenarioHash` and evaluator. The provider must enforce
actual target authorization, scoped setup and original resource ownership.

Finished receipts retain the normal provider identity, hash-bound artifacts and
action gates. They additionally echo `taskId`, `planHash` and exactly one
observation per submitted row. Each observation has `rowId`, `status`, `actual`,
`evidence` (declared artifact paths) and `tool`. Conclusive observations require
tool name/version/kind and real evidence. AT rows require the same named real AT,
not browser semantics. Findings also include `issue.title`, `issue.impact` and
`issue.repeatability`; nonconclusive rows require `reason`. Arbitrary reports
cannot be submitted directly as trusted page receipts.

Cleanup/cancellation/delivery receive the exact task and original capture
`operationIds`. Their trusted connection resolves native identities/credentials;
the model does not choose foreign leases or process IDs. Cleanup must establish
owned-process exit, setting restoration, artifact preservation and ownership
release. Delivery binds the saved report SHA-256 and returns a verified private
delivery reference. A file-delivery adapter must verify bytes at the configured
destination; it must not claim that it sent a Teams message.

```powershell
node "$pluginRoot\runtime\bug-bash-cli.mjs" reconcile my-feature-round
node "$pluginRoot\runtime\bug-bash-cli.mjs" cancel my-feature-round C:\private\cancel.json
```

Cancellation JSON is `{ "reason": "Stop this exact task" }`. It immediately
prevents new coverage execution. An already submitted bounded operation remains
pending until its original effect is reconciled; cancellation is not a force-kill
or permission to discard that obligation. Subsequent advancement requests scoped
cancellation acknowledgement and cleanup. Other task journals and services are
untouched, and explicitly cancelled work cannot be restarted by a new watcher.

On pending RPC results, retain the same operation/request IDs and original
callback or explicitly negotiated CLI polling policy. Unattended callers must
provide a real executor, completion callback and independent stall watcher;
this CLI does not install a background scheduler. Unknown timeouts require
reconciliation, never another task ID or changed provider.

## Durable outputs

Each task has an append-only, hash-linked `events` history, a rebuildable
`state.json` snapshot, and immutable report revisions. Child receipts and
evidence reuse the existing operation store. Reported `coverageOutcome` is
separate from lifecycle cleanup/delivery: even fully conclusive coverage stays
partial until required cleanup and delivery are proven. A cancelled task closes
as cancelled, not a conformance pass. Plan-only is never executed coverage.

The Markdown report contains scope, every coverage row, page findings, separate
source risks, gaps, actual evidence references and cleanup/resume information.
Its delivery state is recorded in the final task journal so an already delivered
report does not need to be rewritten. No source fixes, ticket/PR operations,
public uploads or live AT claims are implied.
