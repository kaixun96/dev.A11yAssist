# Live execution: qualification, recovery and completion

[简体中文](EXECUTION-LESSONS.zh-CN.md)

These operational lessons belong to existing capabilities, not a new plugin.
They are caller/skill procedures and handoff requirements; this document does
not install a supervisor, grant permissions or add executable receipt fields.
Keep filled reports, host identities and incident evidence private.

## Ownership and triggers

| Trigger | Existing owner | Required response |
|---|---|---|
| Tools installed but the runner cannot import, launch or reach its target | a11y-setup | Qualify the actual execution identity, interpreter, deployment and connection |
| Browser initialization, event callbacks or cleanup fail | a11y-capture / shared browser module | Preserve an infrastructure failure, fix and qualify the shared implementation |
| Planned source work or a partial round is mistaken for completed live testing | a11y-bug-bash | Keep the original goal and all missing target/state/category work explicit |
| Caller delivery is queued, RPC disconnects or progress is stale | a11y-workflow / caller runtime | Reconcile delivery and actual progress; runtime recovery belongs to the caller |
| Coverage or benchmark counts hide unexecuted work | a11y-test-categories and a11y-report | Retain the full denominator and separate accounting from evidence |

The read-only `a11y-knowledge` plugin owns accessibility guidance, not fleet
deployment or queue recovery. Do not add operational actions to its static review.

## Setup: qualify the whole path

Before promising live execution, record four roles independently: control-plane
host, VS Code/browser UI or SSH-origin host, source/plugin execution host, and
product browser/AT host. A remote command executing in a Codespace does not prove
where its window is open. Honor the caller's required host placement; where it
requires evaluator-side UI, do not open that connection on the controller.
Obtain the original exclusive setup/recovery authority and later the real
execution authority; one never substitutes for the other.

Use this readiness ladder, recording evidence separately for each step:

1. **Published:** a source revision/release exists.
2. **Installed:** the intended package is present on the actual host.
3. **Compatible:** runner, support modules, adapter request schema, protected
   policy, Python interpreter/import mode and selected dependencies agree.
4. **Launch-qualified:** the real browser API initializes, registers its event
   callbacks and proves owned cleanup using the deployment's authorized
   qualification route. Imports, mocks and `--validate-only` do not prove this.
5. **Target-qualified:** the exact intended page, authentication, focus, rendered
   root and required request routes are observed under the real execution lease.
6. **Evidence-qualified:** the actual scenario produces usable artifacts and
   required AT observations, with per-attempt preflight/postcheck.

A release, installer exit, cloud-power state or healthy heartbeat is not the
entire ladder. Use the qualified caller route; do not invent a fixture, dummy
Bug, generic reservation request or handler merely to pass an ownership gate.
Preserve unverified stages rather than substituting a different test target.

Check the **exact interpreter and import mode** of the runner. A user-site
Playwright import says nothing about an isolated `-I` process. Record absolute
interpreter path, version, import mode and actual import result. Installation
into another environment is not a repair. Do not install unrelated AT/audio
to unblock a browser-only operation.

For deployment skew, compare the complete imported dependency closure and
request/policy versions across staging, wrapper, supervisor and provider. Copying
only a new runner or registering a handler name is insufficient. Inspect the
selected authenticated versus anonymous policy and actual provider support;
absence of an optional handler does not prove all guided tools are unavailable.
Neither an available guided tool nor a recovery lease bypasses execution ownership.

Before calling a step unauthorized, read the caller's applicable standing and
task-specific authority and identify the exact unmet operation/host/scope.
Existing consent need not be requested again. For a known application confirmation,
explicit prior owner consent may authorize a verified click in the retained
context; check legitimate origin, account, app and scopes, click once and observe
the result. No prompt or this document supplies consent by itself. Unapproved
grants, passwords, MFA, biometric or unavailable tool authority remain gates.

After an installer/signature/TLS failure, retain the exact attempted operation
and error. Use a changed, approved route when available: for example, an official
signed installer or organization-approved HTTPS download of pinned artifacts
with publisher hashes, followed by installation into the actual environment.
Do not disable certificate/signature checks, broaden execution policy, run a
rejected script through another interpreter, or blindly retry an unknown effect.
Protected deployment needs its own applicable authority, immutable content
checks and rollback, never an evidence handler used as a command transport.

## Capture: distinguish startup, navigation and product evidence

Record the last completed boundary: interpreter/import, browser launch,
listener registration, target navigation, assertions, artifact capture or cleanup.
A callback exception before navigation is an infrastructure failure, not a page
defect and not a tested case. Keep original failure and cleanup evidence.

The shared browser module owns event registration and removal. The v0.20.1
page-error callback correction uses a Python callable compatible with Playwright
metadata rather than a built-in list method; removing error detection is not a
fix. Preserve the same callback identity for cleanup. Keep this regression in
the shared runner tests instead of copying fixes into generated plugins.

Qualify a correction through the real supported browser API on an owned
evaluator before claiming live recovery. Record the new installed hash/version
and fresh request result. Reconcile the original failed/unknown attempt and its
resources first; never silently mutate its runtime pin or replay its request ID.
Share reviewed upstream corrections across independent workers, but each
evaluator still needs its own deployment and qualification evidence.

At navigation/preflight failure, inspect the actual page and network request
method, origin, path, relevant parameters and expected effect. A URL resembling
a classic page does not prove a classic DOM root. Narrow observed policy repairs
are different from allowing all POST requests or an entire origin to make tests
pass. Redact secrets from diagnostics and keep effect/reset requirements intact.

## Bug Bash: the goal survives an unsuccessful round

An interrupted, blocked or source-only round may have a valid partial report and
safe resource release while the user's requested live Bug Bash remains unfinished.
Keep goal status separate from round, operation, report-delivery and cleanup
status. Do not stop supervision merely because a worker wrote a final message.
The caller owns any later resource acquisition; do not hold or steal leases just
to make the goal look active.

For each unresolved prerequisite record: observed error, affected required rows,
distinct attempted recoveries and their results, next safe action, remaining
authority and resume condition. Continue independent permitted work. A known
safe next step must be executed, not replaced by a promise to continue. Missing
configuration, stale deployment and recoverable installation failures are not
automatically reasons for owner intervention.

No safe path remaining is a precise unresolved goal, not success. An explicit
owner stop remains a stop; a fixed time/notification budget is not silently
extended. Explain the limit and preserve durable state, ownership and callback
status rather than fabricating completion or beginning an endless retry loop.

## Workflow and caller runtime: accepted is not delivered

Track these separately using supported caller APIs: notification accepted,
queued, delivered to the intended worker, acted on, and confirmed by an actual
artifact or phase change. A new owner instruction can remain queued behind a
long turn even while other work progresses. Do not tell the owner it has been
applied merely because the trigger returned success.

When delivery is delayed, inspect the exact pending event and current operation.
Use only the caller's supported steering/reconciliation route for that original
event; do not impersonate a human, duplicate the event under a new ID, discard
queues, or interrupt unknown external effects. Preserve important owner updates
in a bounded pending ledger and reconcile their eventual action.

Unattended work requires an actual completion callback and an independent,
bounded stall/progress watcher. A busy bit, tool activity or repeated status
message alone is not proof of progress toward the goal. Check timestamps and
actual artifacts against the current phase; distinguish legitimate background
work, a real gate and a stuck delivery.

The caller runtime owns RPC send deadlines, disconnect propagation, rejection
of unresolved requests, honest connection health, safe worker recovery and
session-history storage maintenance. A plugin prompt cannot repair a dead shared
transport. Alerts relying solely on that transport share its failure mode.
Require a bounded diagnostic signal outside the model queue and supported
recovery with identity/effect preservation. Do not add a plugin that restarts
shared Copilot, truncates histories or takes over other workers. Escalate such
implementation changes to the runtime owner as a separate work item.

## Categories and reports: keep the denominator

The category plugin remains the only procedure/matrix owner. An initial matrix,
generated batches or source findings do not establish page/AT execution.
Retain every requested case and target/state, including unrun, blocked and
inconclusive entries. Do not score narrow keyboard/name observations as complete
cases or reduce the denominator to the subset that happened to execute.

For a benchmark, isolate expected labels from detection inputs, bind observed
results to the corresponding rule/case, and keep unrelated findings separate.
Report runtime version, attempted and completed counts, evidence-backed findings,
source risks, outstanding work and exact next action. The aggregate report
must not turn a clean setup or startup failure into a product verdict.

## Before calling a release ready

Keep source/package checks, mocked regressions, live runner qualification and
real feature/AT coverage as separate evidence. A release may truthfully publish
a fix while live qualification remains pending; state that limitation.
Do not auto-update active workers to consume these lessons. Reconcile and
qualify any separately authorized runtime migration on each actual host.
