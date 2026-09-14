# Executable Bug Bash composition

**English** | [简体中文](BUG-BASH-RUNTIME.zh-CN.md)

Package v0.17 / execution contract v0.8. Source implementation is separate from
deployment and live qualification. This release never resumes an old task.

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
`discovery-observe`; the compatibility-named operations connection implements `discovery-cancel`,
`discovery-cleanup` and `discovery-deliver`. A legacy BEFORE/AFTER provider does not
automatically understand these actions. No dummy Bug, evidence-v1 request or
unqualified browser/AT fallback is allowed.

Those three lifecycle actions belong to **Bug Bash itself**, not a retired
operations plugin or the optional remediation workflow. Each module supplies
its owned cleanup proof; the original resource authority releases ownership.
With `providers: {}`, plan/source-only rounds can deliver a hash-verified
private local report without a capture provider. Local delivery never claims
that a Teams message was sent.

For the shared bounded page runner, use a `browser-scenarios` profile and the
[typed browser contract](BROWSER.md). It supports approved anonymous/client-side
HTTPS pages, not just the fixed contact fixture. Source/AT gaps remain separate.

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
| `budgetSeconds`, `maxRows` | Fixed 1-14400-second budget; 1-5000 rows, including full category expansion |
| `rows` | Explicit applicable coverage, including required AT checks even if unavailable |
| `inventory` | Target/state inventory from the category contract; required for complete page coverage |

`create` reuses the bundled category procedures and adds every missing step for
every inventory target/state (currently ten categories, 61 steps each).
For an inventory-first plan, supply `rows: []` and a sufficient explicit
`maxRows`. Unknown inventory completeness always prevents complete page coverage.
Without an inventory, legacy bounded scenarios still run but cannot imply full
feature coverage. Source-only does not expand page procedures.

Each row has `id`, `journey`, `state`, `dimension`, `track`, `capability`,
`preconditions`, `actions`, `expected` and `reset`. Tracks are `page`, `source`
and `at`; capabilities are respectively `browser`, `source-review`, or a named
`nvda`/`narrator`/`voice-access`. Preconditions/actions are nonempty string arrays.
Optional `dependsOn` names other rows; cycles/missing dependencies reject.
Optional bounded `parameters` holds the selected provider's declared scenario
parameters, never executable shell text or credentials.

Generated rows also bind `coverage: {targetId, category, step, procedureHash}`.
Read the full procedure, then use `configure` with `{rows: [{id, parameters,
preconditions, actions, expected, reset}], reason}` to map unexecuted rows to
concrete scenarios. It cannot remove the step or relabel screen-reader/Voice
Access work as browser evidence. Missing typed browser scenarios remain gaps.
Within a target/category, the runtime orders execution by step number and rejects
skipping a preceding unexecuted step.

```powershell
node "$pluginRoot\runtime\bug-bash-cli.mjs" create C:\private\plan.json
node "$pluginRoot\runtime\bug-bash-cli.mjs" configure my-feature-round C:\private\scenarios.json
node "$pluginRoot\runtime\bug-bash-cli.mjs" run my-feature-round
node "$pluginRoot\runtime\bug-bash-cli.mjs" advance my-feature-round
node "$pluginRoot\runtime\bug-bash-cli.mjs" status my-feature-round
```

`advance` performs one next safe step and returns remaining work. The caller must
continue it, not treat the returned next action as completion. It uses independent
ready rows, isolates unsupported capability gaps, requests bundled source review
when needed, then cleans, writes the report and delivers it.

`run` performs up to 200 safe advances (optional input `{maxAdvances: 1..5000}`).
It returns on a pending child, a required source review or a recovery/input
boundary. It never busy-polls a pending request, installs a watcher or restarts
cancelled work. Continue through the original callback/scheduler and `reconcile`.

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
`inventory <taskId> <json>` accepts `{inventory, reason}`; existing target/state
definitions cannot be removed or rewritten, and new targets expand all steps.
`exclude <taskId> <json>` accepts `{exclusions: [{rowId,
basis: "feature-not-applicable", reason}]}` for unexecuted rows only. The caller
must justify actual feature non-applicability, never missing tools/time.
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

Every accepted capture requires `capturePreflightVerified`,
`capturePostcheckVerified` and `independentBehaviorVerified` gates. The
`capturePreflightArtifacts` / `capturePostcheckArtifacts` arrays cite actual
declared, hash-bound diagnostic artifacts. Checks are fresh for every attempt,
not inherited from setup. Failure/unknown postcheck cannot qualify a passing
receipt. The browser module records pre-trigger, immediately pre-capture and
post-capture page/environment state, and closes only its owned browser.

Optional `issue.identity` groups proven repeated observations of the same defect;
conflicting descriptions reject. Seeded fixture identities remain explicitly
separate from page findings. Without a supported identity, suspected duplicates
are not silently merged.

`validate <taskId>` verifies hash-linked history, original child receipts and
artifact bytes and returns coverage gaps separately from the trusted provider's
independent behavior assessments. The standalone `a11y-validate` package exposes
the same read-only implementation as `a11y_validate_discovery` with `{taskId}`.
This is not the evidence-v1 API and cannot promote source analysis into runtime
evidence or certify accessibility. Reports invoke the same gate before creation.

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

For a new deployment, pin the entire package/provider/handler closure, configure
the original authority's typed task acquisition, and qualify the selected
capabilities on the actual host. The included native adapter handles approved
anonymous/client-side HTTPS and the explicit synthetic fixture; real named AT,
authenticated transactions, scanners and visual measurement need compatible
deployment adapters. Keep unsupported rows, never invent those capabilities.
