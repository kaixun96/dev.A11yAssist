# Bug Bash: composable plugins and reliable execution

Status: proposed implementation design, 2026-09-14. This is a maintainer design,
not a claim that these capabilities are installed, qualified or shipping.
The current [Bug Bash contract](BUG-BASH.md), [provider protocol](PROVIDERS.md)
and deployment-specific ownership rules remain authoritative until a separately
qualified implementation changes them. This document does not authorize a cutover.

The reusable [large-plugin design and maintenance method](COMPOSABLE-PLUGIN-DESIGN.md)
explains the cross-domain reasoning and primary-source limitations. This document
owns the Bug Bash application: constrained adaptation around verifiable scenarios,
service-based capability composition and evidence-first execution. Neither document
installs DeepSeek Harness, Cordis, graph retrieval, skill optimization or memory tools.

## 1. Product outcome

Given feature context and verification instructions, `/a11y-bug-bash` should
produce a bounded, reproducible accessibility discovery report containing:

- Actual page findings, with steps, impact, observed behavior and evidence.
- Read-only source risks, with revision, reasoning and runtime confirmation steps.
- Every planned coverage row, including blocked, unexecuted and uncertain checks.
- Exact environment/tool provenance, owned cleanup and a delivered report.

It must work for a large feature with multiple journeys and states, not just an
isolated control or a scanner run. A completed round is not WCAG certification.
Discovery does not authorize product edits/builds, automatic issue filing,
assignment changes, PR creation, public uploads or environment installation.
Those require their own authorization and workflows.

Modes remain `plan-only`, `page-only`, `source-only` and default `both`.
Source-only and plan-only do not need Windows, browser setup or a live provider.
Live page/AT work targets qualified Windows evaluator deployments. An unavailable
track does not prevent independent authorized work, but remains a coverage gap.

## 2. Principles from the primary sources

The six foundational pages below were read in full, including the workflow article's
appendices and the MCP architecture examples. These are selected references,
not an objective ranking of the "most advanced" architectures.

| Source | Relevant lesson | Design consequence and limit |
|---|---|---|
| [GitHub: Creating a Copilot CLI plugin](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating) | A package can distribute skills, agents, hooks and MCP configuration; local installs are cached | Use self-contained packages and verify loaded components after reinstall/restart. Packaging does not schedule a dependency graph |
| [Agent Skills specification](https://agentskills.io/specification) | Load metadata, then instructions, then supporting scripts/references as needed | Keep entry skills short and load scenario-specific knowledge. Experimental `allowed-tools` is not our security boundary |
| [MCP architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) | Tools/resources/prompts, capability discovery and host-mediated calls; notifications are best effort | Negotiate actual tool support, validate schemas and reconcile durable state after reconnect. MCP is not our complete task lifecycle |
| [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents) | Chaining, routing, parallel work, orchestrator-workers and bounded evaluator loops; clear tool interfaces | Use model reasoning for scenario discovery and analysis, deterministic code for gates and effects. This is a foundational December 2024 article, not a newly published recommendation |
| [Anthropic: Managed Agents architecture](https://www.anthropic.com/engineering/managed-agents) | Separate the reasoning loop, execution environment and durable session log | Losing a chat/worker must not lose accepted work. Keep credentials outside model-visible artifacts and untrusted execution |
| [Temporal: Workflow Execution](https://docs.temporal.io/workflow-execution) | Durable state, event history, recovery, distinct workflow/run identities and explicit cancellation | Persist intent before effects and separate task identity from attempts. Borrow these principles; do not introduce Temporal merely to claim durability |

Compatibility caution: GitHub currently documents both legacy Copilot packaging
and Agent Plugins 1.0. This repository uses the existing format; no schema
migration is part of this design. The linked MCP page describes protocol
2026-07-28 and mentions an optional Tasks extension. Neither that version nor
the extension is assumed available in the installed host. Use the actual
negotiated SDK/protocol, not hand-written messages copied from newer docs.
Even a durable MCP task handle does not establish desktop ownership, correct
evidence, cleanup or guaranteed delivery to the original requester.

### Recent AI-specific sources and decisions

The [reusable guide's source register](COMPOSABLE-PLUGIN-DESIGN.md#10-primary-sources-and-evidence-limits)
links the reviewed primary sources, dates, methods and limits, including DeepSeek
Harness's own architecture, Cordis primer and safety notice.

| Source | Bug Bash decision |
|---|---|
| DeepSeek Harness / Cordis | Stable service identities, declared dependencies and qualified composition profiles; participating registrations have owned lifetimes, but disposal never substitutes for native cancellation/reconciliation |
| Empire harness convergence study | Reuse the model loop; concentrate domain work in scenario contracts, durable evidence and explicit capability/context boundaries |
| Subagents vs Agent Skills | Keep routing and cross-cutting A11y knowledge inline; isolate substantial contracted procedures only when useful; deterministic probes remain tools |
| SE-GoS | Separate declared hard constraints from learned retrieval relationships; start with explicit profiles, then evaluate bounded offline ranking changes |
| SkillAdam | Retain issue/attempt history and bounded candidate edits; protect evidence standards and use independent regression/holdout before promotion |
| Funes | Recall short evidence-backed experience with expansion to original traces; do not confuse historical memory with current authorization, health or task state |

These are design inferences, not measured Bug Bash gains. In particular, SE-GoS's
held-out +5.4-point gain is inside its reported noise band, its main avoid filter
was not exercised, and its third evolution round regressed. Neither that result nor
DeepSeek's developer preview justifies unrestricted auto-composition or live updates.

## 3. Baseline: reuse before adding modules

Source baseline: main commit `984504fd8c7786456528512d04d768b4a423a05e`,
package version 0.15.0. Separately inspected candidate
[PR #22](https://github.com/kaixun96/dev.A11yAssist/pull/22) at
`a3a7778f8959009f6c41ba9bc77da2e0c015e197`; at this design's date it is a draft.
These are dated snapshots, not live status indicators.

| Area | Existing implementation | Remaining gap |
|---|---|---|
| Feature workflow | `src/skills/a11y-bug-bash/` and `src/bug-bash/` define scope, coverage and report instructions | No executable feature-level dependency graph or reliable continuation supervisor |
| Knowledge | One authored knowledge source, including scoped project references, bundled into Bug Bash | Preserve reuse; do not create another accessibility rules database |
| Setup | Independent package and identical bundled module share `src/native/windows-host.ps1` | Installed dependencies do not prove an authenticated connection or real AT |
| Independent operations | `src/runtime/operations.mjs`, `capability.mjs` and `waiting.mjs` persist sealed calls, validate receipts and reconcile pending effects | Feature discovery actions and parent/child cancellation policy are not registered |
| Existing execution plugins | Resources, capture, validation and operations have scoped contracts | Generic page exploration and feature-level report acceptance are not supplied by the current capture/evidence-v1 APIs |
| Fixture candidate | PR #22 adds a Windows dialog/form fixture and scoped setup corrections | Candidate code is not a successful live qualification, real product scan or real AT acceptance |

The design extends the shared runtime and capability registry. It does not
duplicate the remediation state machine, create a second lease registry, replace
deployment providers or treat the fixture as the user's feature.

## 4. What "everything is a plugin" means here

| Term | Responsibility |
|---|---|
| Plugin | Independently installable/versioned distribution unit |
| Skill | On-demand procedure and associated references/scripts inside a package |
| Tool/provider | Typed executable operation; provider owns actual host effects and evidence |
| MCP | Optional host-to-tool connection, not automatic plugin-to-plugin invocation |
| Agent | Reasoning context that may choose scenarios or analyze findings; not required per plugin |
| Workflow | Caller-owned composition with dependencies, budgets and acceptance gates |
| Trusted runtime | Enforces identity, authority, durable mutation, resource ownership and effect reconciliation |

Split on a stable capability boundary, independent use cases, permissions,
execution host or release lifecycle. Do not create a plugin per click, key,
assertion or file. A logical child capability is not necessarily a nested
installed plugin, separate MCP process or remote sub-agent.

### Recommended capability map

| Logical child | Package decision | Input -> output | Boundary |
|---|---|---|---|
| Feature planning | Internal Bug Bash skill/module | Context + verification instructions + knowledge -> versioned coverage plan | No external effects; does not silently change feature or requested scope |
| Knowledge | Reuse `a11y-knowledge` | Stack/version + question or scoped source -> cited guidance/risks | Read-only; generic rules first, project rules only when applicable |
| Setup | Reuse `a11y-setup` | Required capabilities + actual host -> scoped inventory/preparation plan | Check-only default; preparation separately authorized |
| Resource connection | Reuse `a11y-resources` and original deployment authority | Host requirements + task identity -> ownership/status evidence | Existing public status is not acquisition; a new typed task-acquisition integration must be implemented before use |
| Browser checks | Proposed `a11y-browser` capability, first as a shared internal module | Owned browser + sealed scenario -> observations and artifacts | Keyboard/focus, rendered semantics, approved scanner and visual adapters; no real-AT claims |
| AT checks | Extend `a11y-capture` with an explicit discovery operation and AT adapters | Owned desktop + sealed scenario + required AT -> observed speech/recognition/media | NVDA/Narrator/Voice Access adapters are logical submodules, not three mandatory installs |
| Source review | Reuse knowledge's read-only review as a child step | Scoped source/revision + context -> source-supported risks | No separate `a11y-source-review` package initially; no source edits, tests or shell execution within knowledge review |
| Evidence integrity and behavior | Extend `a11y-validate`; reuse artifact hashing | Discovery evidence manifest -> separate integrity and behavior decisions | New discovery schema required; current evidence-v1 checker cannot accept an arbitrary Bug Bash report |
| Report | Internal pure Bug Bash module initially | Coverage + accepted observations + source risks + gaps -> private report | No `a11y-publish` dependency; report generation is not ticket/PR publication |
| Recovery, cleanup, delivery | Reuse `agent-operations` through scoped providers | Original operation/ownership + progress -> reconciliation, cleanup and delivery receipts | Narrow recovery never substitutes for complete cleanup; no broad process termination |

Thus the first implementation should add at most one new package
(`a11y-browser`), after its independent contract is useful. It should not create
new packages named `a11y-at`, `a11y-evidence` and `a11y-report` merely to match a
diagram. Reconsider extraction only when another caller needs a stable independent
interface or the module has a genuinely separate release/permission lifecycle.

`a11y-intake` is optional when an authorized work item supplies context.
`a11y-publish`, `a11y-workflow` and AgentOW are not Bug Bash dependencies.
An accepted finding may later enter separately authorized remediation, retaining
that workflow's actual BEFORE/AFTER, resource, source and publication gates.

### Reasoning is a separate composition choice

The main reasoning context owns the feature goal, coverage gaps and routing.
It loads relevant standards/project knowledge progressively rather than loading
every skill. A large source-risk analysis or evidence interpretation may use an
isolated context with complete scoped inputs, expected output, termination rules
and expandable evidence pointers. Small lookups and deterministic DOM/focus/hash
operations remain direct tools. No isolated child is required merely because a
logical capability exists; no actual sub-agent availability is assumed.

Context isolation does not grant additional permissions or desktop isolation.
Independent behavior assessment needs its own evidence and rubric; a fresh model
repeating the producer's conclusion is insufficient.

## 5. Packaging and actual invocation

One Bug Bash installation remains sufficient for instructions and shared modules.
Keep `bundleKnowledgeReview` and `bundleSetup` as the single-source composition
pattern. Authored changes belong under `src/`; generated `plugins/` and retained
compatibility exports are never hand-edited.

The target executable package may bundle the shared runtime and expose a
namespaced Bug Bash MCP entrypoint. This would be an explicit opt-in addition,
not something version 0.15 already does. Preserve provider-free plan/source
usage; do not make Windows setup or execution config a prerequisite for it.

The host invokes a known capability dispatcher; the dispatcher calls shared
implementation or an operator-configured trusted provider. It does not ask one
MCP server to discover and call sibling servers. A direct host tool can be used
only through an explicitly supported adapter; its presence in a session does
not register an executable provider automatically.

Proposed package-local `capability-lock.json` records exact implementation
version, digest, contract version and source provenance for every bundled module.
This is our own build artifact, not a standard `plugin.json` dependency field.
Select one provider per action for a run; do not execute bundled and standalone
copies in parallel or silently switch to a different version after a timeout.

The run pins those bindings. Future package updates serve new runs; active runs
stay pinned or use a separately validated migration. Reinstall changed plugin
files and restart the host when required, then confirm the actual loaded skill,
tool and handler versions on the machine that executes them.

### Service resolution and qualified profiles

Treat each capability as a stable service/action contract with an explicit
definition, one selected provider and potentially multiple consumers. Reuse the
current capability registry and trusted connections, extending them compatibly;
do not introduce a second loader, arbitrary executable resolution or a mandatory
Cordis runtime. Declared prerequisites govern activation. Reject incompatible
contracts, ambiguous providers and cyclic/unsatisfied hard dependencies before
effects. A service name or retrieved skill cannot grant execution authority.

A proposed browser-only profile should require only its browser dependencies.
A proposed named-AT profile adds that AT and required evidence stack, not every
recorder/driver. Profiles are qualified combinations, not new package names or
an assertion that those combinations work today. Record the effective profile,
provider/skill versions, selection-policy/graph revision and model configuration.
Unknown costs or model backend versions remain explicit.

Metadata is available for selection; detailed instructions load when selected;
large artifacts are retrieved by reference. Track peak reasoning context and
aggregate tokens separately, with measured latency/cache effects where available.
Do not silently hot-replace providers or dispose the supervisor of an active
operation. Disposal of plugin registrations does not cancel native work, undo
external effects or release resource ownership.

## 6. Composition for a large feature

Example: an item picker with search, paged/virtualized results, selection,
confirmation, cancellation, empty/error states and reopen behavior.

```text
Context + verification steps
          |
          v
Plan + knowledge -> required capability set + coverage revision
          |
          +----------------------+
          |                      |
          v                      v
Scoped setup/check          Read-only source review
          |                      |
Typed owned execution            +--> suggested runtime scenarios
          |                           (new plan revision, no scope expansion)
          v
Browser checks -> targeted real AT checks
          |               |
          +-------+-------+
                  v
Observation/evidence validation -> bounded candidate confirmation
                  |
                  v
Aggregate report -> owned cleanup/release -> final report + delivery
```

Source review may run concurrently only with independent authorized tools and
no shared desktop mutation. No separate agent is necessary for small reviews.
On one evaluator, page actions, focus changes, AT, recording and resets are
serial. Different independent scenarios may use different exclusively owned
evaluators, but each scenario's repetitions/comparisons remain on its assigned
host and environment. Do not parallelize merely because capabilities differ.

| Phase | Entry gate | Action and output | Exit gate |
|---|---|---|---|
| Scope | Feature and authority identified | Capture modes, allowed routes/data, expected behavior, budget and unknowns | No invented feature or implicit dangerous operation |
| Plan | Scope available | Journey x reachable state x applicable dimension; stable row IDs, priority, expected evidence, reset | Every supplied verification step mapped; exclusions explained |
| Prepare | Required capability set known | Scoped inventory; separately authorized setup/recovery where needed | Required connection is callable on actual host; optional gaps isolated |
| Acquire | Complete typed request validated and worker-visible | Original deployment authority dispatches/acquires atomically | Healthy exclusive evaluator; recovery ownership is not execution ownership |
| Execute | Pinned plan/provider and original authority | Reset, act, observe, capture per row; perform source review independently | Every attempted row has observations or explicit failure; no unsupported AT assertion |
| Confirm | Candidate supported by actual observations | Bounded safe repeat from known preconditions; independent behavior assessment | Repeatability stated honestly; uncertainty retained |
| Aggregate | Known operations reconciled or explicitly unresolved | Separate findings, risks, questions and gaps; link proven duplicates only | All row IDs accounted for; no source-to-page root cause without build binding |
| Cleanup/deliver | Original owned effects enumerated | Preserve evidence, restore changed settings, stop owned resources, release through original authority, deliver report | Verified applicable cleanup and delivery; no unresolved effects hidden as completion |

Preparation is not an early execution reservation. Any setup/recovery interaction
requires the original authority's applicable exclusive setup/recovery ownership;
otherwise preparation is read-only planning/status. Product interactions and
evidence begin only after execution acquisition. A recovery probe cannot be
relabeled as a product coverage result.

Normal exploratory steps are not all known in advance. The planner can append
new rows within authorized scope and budget, creating a new plan revision.
Never delete old rows, rewrite accepted receipts or extend the time budget
silently. An already submitted operation retains its original plan/scenario hash;
a new revision cannot change what it was authorized to execute.

The coverage dimensions remain those in `src/bug-bash/coverage.json`. Knowledge
supplies applicable standards and component expectations, not the planner's
guess. Prioritize primary journeys and high-impact blockers, then relevant
visual/AT variants. A finite round must name its time/row/confirmation limits
and reserve cleanup time; it cannot guarantee exhaustive accessibility coverage.

### Constrained adaptive composition

The unit being composed is a verifiable scenario, not an agent or plugin:
preconditions -> actions -> expected outcome -> capabilities -> evidence -> reset.
Generate applicable journey/state/dimension combinations, not a blind Cartesian
product. A different provider must still satisfy the same accepted scenario.

The planner first maps supplied verification instructions and mandatory coverage,
then proposes a bounded capability shortlist from the catalog and relevant
experience. Deterministic acceptance checks schemas, dependencies, authority,
resource compatibility, required evidence and budget before binding a plan.

Keep two distinct relationship classes:

- **Hard:** declared service prerequisites, authorized scope, required rows,
  desktop exclusivity, evidence gates and budget.
- **Soft:** retrieved relevance, observed co-use/order/cost and descriptions that
  improve skill discovery. These influence proposals, never authorize effects.

Learning cannot delete a required screen-reader row because it is expensive or
rarely successful. Missing AT blocks that row; independent browser/source work
can proceed. A qualified static profile may replace failed adaptive selection
only if it satisfies the same scope and contracts, with the choice recorded.

For the picker, discovering asynchronous search results may add focus retention
and status-announcement scenarios, with real named-AT output where required.
Accept additions only within scope and remaining budget, as new plan revisions.
Do not change an in-flight operation or reuse old evidence under a new scenario.
Every applicable blocked/unrun row remains in the report.

## 7. Versioned contracts

The following records and semantic operations are **proposed internal contracts**,
not callable tools or existing MCP/manifest fields. Implement schemas and
validators before exposing them. Reuse existing operation identity, hash,
private-provider and reconciliation helpers; do not inject new fields into the
current strict context schema without a compatible versioned extension.

| Record | Required content |
|---|---|
| FeatureContext | Feature ID, user goal, authorization reference, requested tracks, allowed environment/routes/data, verification instructions, source binding or explicit unknown, budget |
| CoveragePlan | Plan revision/hash; stable row/scenario IDs; preconditions, action/reset, expected behavior, knowledge reference, priority, required capability and evidence types; declared constraints, selection reasons and bound profile/provider/skill/retrieval/model configuration |
| CapabilityDescriptor | Stable service/action ID and schema versions, supported host, input/output schema, declared prerequisites, effect class, permissions, mutex requirements, prepare/execute/reconcile/cancel/cleanup support and limits, deadline policy; reasoning mode, progressive-disclosure/context budget, cost/cache estimates versus observations |
| CapabilityObservation | Actual host/tool/runtime versions and hashes, observed time, scope, authorization/ownership reference, restart/config gaps; no secret tokens |
| StepRequest | Parent task/run, step/operation ID, immutable request ID, owner/authority, plan/scenario hash, provider binding, limits and exact inputs |
| Observation | Row ID, attempted steps, actual result, expected comparison, evidence references, named AT if used, uncertainty and source/deployment binding |
| StepResult | Echoed identity, execution state, reason, accepted observations, evidence manifest, cleanup scope, pending progress/resume/callback fields where applicable |
| Report | Requested/executed/excluded scope, all rows, separated finding classes, evidence index, unresolved effects, cleanup, next action and delivery receipt |

Identity hierarchy: `taskId` is the authorization/work item; `runId` is one
bounded round; `stepId` is one logical child; `operationId` maps to the existing
independent operation journal; `requestId` identifies the native effect.
Tokens remain in trusted connections. A registry entry or model-supplied owner
string alone is not proof of authorization.

Do not mix three kinds of state:

- Execution: queued, submitted-unknown, running, finished, cancel-requested.
- Coverage: existing `planned`, `observed-no-issue`, `finding`, `blocked`,
  `not-run`, `not-applicable`, `inconclusive`.
- Task delivery: pending versus verified report delivery and applicable cleanup.

A successfully executed check may find a product defect. An adapter error is
not a product defect. A finished operation is not a finished feature round.
Translate existing provider `receipt.outcome` through an explicit adapter;
do not reinterpret legacy `pass` as "feature has no accessibility issues".

## 8. Evidence and report correctness

For durable runtime acceptance, require SHA-256 and root-confined file references
for captured artifacts. Keep timestamps, tool/AT version, execution-host identity,
scenario, route, fixture, flags, permissions, viewport/zoom and actual build
binding. Unknown build identity is explicit, not a fabricated HEAD.

Integrity validation verifies schema, bytes, bindings and row accounting.
Independent behavior assessment checks whether the evidence supports the claim.
Neither alone replaces the other. A hash proves sampled bytes match a declaration,
not that a screenshot is truthful, speech occurred or a person could use the UI.
The emitting model must not self-author a trusted receipt to bypass these gates.

Real screen-reader claims require observed output from the named real AT;
an ARIA tree is not speech. Voice-control claims require real recognition and
target attribution. Scanner output is a candidate requiring rendered-context
confirmation. Visual claims require the applicable rendered measurement/context.
Source-only risks cannot become page findings without runtime observation.

For the picker example, "focus was not restored after Cancel" needs the action
sequence and observed focus target before/after. A missing `focus()` call in
one file is only a source risk until parent/library behavior is understood.
Do not claim a keyboard trap solely because Escape did not close a dialog.

Reporting rules:

- Preserve all planned rows, including historical revisions and superseded rows.
- Coverage denominator is current applicable rows; show prior revisions separately.
  Exclude only justified `not-applicable` rows, never blocked/not-run rows.
- Separate attempted coverage from conclusive coverage. Inconclusive attempts
  cannot inflate the conclusive total.
- `complete` requires every current applicable requested row to have a conclusive
  finding/no-issue observation, verified cleanup and report delivery.
- `partial` retains blocked/not-run/inconclusive rows; `blocked` means meaningful
  required execution could not proceed. `plan-only` is not executed coverage.
- Cancellation/abandonment is a lifecycle outcome with a reason, not a new spelling
  of conformance or a way to erase unknown effects.

A partial or blocked report can be delivered while cleanup remains unresolved.
That does not close the execution obligation or release ownership. Lifecycle
closure requires cleanup proof, or an explicitly authorized handoff that records
the remaining owner, resources and resume condition.

## 9. Reliability must be executable

### Durable state and supervision

Extend shared operation storage with a feature-level journal referencing child
operation IDs, accepted receipt digests and a monotonic state revision. Keep an
append-only transition log and rebuildable current snapshot outside chat context.
Record step intent atomically before calling a provider. Serialize mutations
using the existing qualified storage/lock model; do not auto-expire abandoned
locks or create a competing ownership store.

For unattended execution, admission requires a verified executor, durable
progress location, completion callback and a separately functioning stall
watcher. Twin continues to require callbacks. Existing explicit CLI caller-poll
support is valid only with its deployed bounded scheduler and original deadline.
Neither package installation nor a pending receipt installs that supervision.

The supervisor reconciles task IDs against executors, pending native operations,
callbacks, watchers and terminal receipts. A restart or compaction reconstructs
work from this journal, not conversation summaries. A reply or heartbeat is
not progress: advancing row state, persisted artifact or reconciled receipt is.

Keep reasoning outside deterministic replay: persist the accepted plan and
observations, rather than rerunning a model to reconstruct old decisions. A
restarted dispatcher consumes those records and reconciles effects. It does not
promise exactly-once external execution merely because its own journal is durable.
That property depends on the provider's idempotency/reconciliation contract.

### Failures and changed-hypothesis recovery

| Failure | Required reaction |
|---|---|
| RPC timeout after submission | Preserve same operation/request IDs; reconcile original effect, never execute under a fresh identity |
| Lost callback or duplicate notification | Idempotently reconcile durable state; watcher detects missing progress, without inventing a second worker |
| Chat/worker restart | Restore pinned inputs/ownership, inspect pending effects, resume next safe action; no replay of completed mutations |
| Interactive no-change for 60 seconds or first bounded wait | Inspect auth/focus/page/resource state and change the recovery hypothesis before another wait |
| Background work with no durable progress for 5 minutes | Read scoped diagnostics and reconcile executor; do not rely on a process being alive |
| Optional AT/audio/scanner missing | Block only dependent rows, continue independent browser/source rows |
| Runtime/schema/hash mismatch | Fail before capture; use approved deployment path, never broaden permissions or treat it as a product bug |
| Browser reset or AT state ambiguous | Preserve artifacts and original ownership; establish exact state before safe retry |
| Password/MFA/consent or unavailable authority | Stop affected action, persist explicit resume condition; continue only independent authorized scope |
| Cleanup or report-delivery failure | Retain obligation and scoped continuation; do not report task completed |

Retry only known-safe operations whose effect has been reconciled. Before a
recoverable blocker is declared terminal, use bounded evidence-driven recovery,
including a changed hypothesis after the first attempt, unless further action is
unsafe or violates an external limit. Budgets bound retries; they do not release
unknown effects. A deadline ends waiting, not necessarily native execution.

### Task-scoped cancellation

The runtime needs a cancellation operation scoped to exact authorization/task
identity and state revision. It must enumerate owned children, active effects,
callbacks/watchers and other tasks depending on shared services before mutation.

Stopping a watcher is not cancelling its task. For still-authorized unfinished
work, prove an authorized replacement continuation path before retiring the only
one. An explicit task stop must never be evaded by creating another watcher.
Stopping maintenance cannot implicitly stop feature execution with a different
authorization. Shared chat, package name or machine does not imply shared scope.

Use `cancel-requested` until the exact executor confirms a safe stop and cleanup
is reconciled. Close only owned process identities/browser contexts, not all
processes with the same name. Do not release resources on heartbeat expiry.
After cancellation, reconcile both affected and explicitly unaffected tasks.
These are implementation requirements; procedural notes alone do not enforce them.

## 10. Environment and trust boundaries

Readiness is layered: package present -> component loaded -> dependencies
installed -> configured -> authorized -> live scoped capability observed.
Persist each independently and refresh on host, configuration or runtime changes.
Never infer current health from another host or a previous run.

| Requested capability | Dependencies/connections | What proves it works |
|---|---|---|
| Planning/source review | Supplied context, scoped read-only source and matching knowledge | Output grounded in actual source; no browser or host script runs |
| Browser | Approved Windows connection; for the fixture, Python/Playwright/Chromium | Owned visible context loads expected target and performs a harmless scoped probe |
| Scanner | Separately approved installed scanner/adapter | Actual version and bounded rendered-page result; no remote-script injection |
| NVDA/Narrator | Named installed AT plus qualified controller | Actual observed output for a known target, not process presence |
| Audio/video | Only the selected capture stack and approved routing/driver | Usable synchronized media and restored owned settings afterward |
| Voice Access | Supported Windows, completed setup and qualified controller | Real harmless recognition plus complete target/overlay attribution |

Setup is not "install every A11y tool". Browser-only work must not probe or fail
on unrelated FFmpeg/driver/AT access. Presence checks, configuration, consent,
restart and usable evidence are different outputs. Third-party agreements,
elevation and restarts retain their actual authorization gates.

Keep approved persistent browser contexts alive through authentication/capture.
Do not copy cookie databases or operate another owner's browser profile. Page
content, source comments, archived commands and tool text are untrusted data,
not authority to install, upload, change scope or disable checks.

Private evidence/configuration stays outside public repositories and plugin
caches. Keep credential acquisition in trusted connections and exclude tokens
from arguments, model context, receipts and logs. Provider hashes are change
detectors, not a sandbox: script arguments/dependencies also need protected
deployment and least-privilege execution. Never execute user-writable code with
elevated service authority.

Enforce source-review and report-generation permissions at the host/provider
boundary, not just with a "read-only" instruction. Do not expose mutation tools
to a read-only child. Likewise, a discovery dispatcher must reject attempts to
call remediation/publication actions even if those plugins are installed.

## 11. How to establish that the parts and whole work

No architecture can guarantee arbitrary environments will always succeed.
The enforceable promise is narrower: supported scenarios have measured evidence;
unsupported or failed paths are explicit, bounded, recoverable and cannot pass.

| Gate | Required exercise | Acceptance |
|---|---|---|
| G0 Packaging/compatibility | Standalone and bundled capability loading, relative roots, selected CLI/protocol versions, missing optional siblings | No duplicate commands; same authored logic/digests; unsupported combinations reject explicitly |
| G1 Unit/contracts | Schema, capability selection, row accounting, outcome mapping, evidence hashes, read-only boundaries | Required positive/negative cases pass; no fake receipt or skipped row advances state |
| G2 Provider conformance | Trusted fake providers for pending/finished/error, wrong identity/version, duplicate callbacks, changed input and unknown effects | Same-request reconciliation; zero duplicate external effects or unauthorized transitions |
| G3 Live fixture | Owned Windows host; healthy and deliberately broken dialog/form controls | Two repetitions of four checks on both variants: exactly 16 expected rows, no duplicates/missing rows, actual artifacts and owned cleanup |
| G4 Real AT | Each advertised AT adapter tested independently on healthy/broken cases, including setup and media failure | Real named output/recognition, usable required media, accurate nonpass and verified restoration |
| G5 Real feature | Authorized multi-journey feature with entry/exit, empty/error, repeated use and relevant visual/AT states | Every agreed row accounted for; findings reproducible or explicitly intermittent; source risks remain separate |
| G6 Reliability | Restart mid-step, lost reply, timeout after effect, watcher loss, unrelated cancellation, busy evaluator, stale runtime and cleanup failure | No stolen lease, replayed effect, orphaned authorized task or false completion; recovery traced to durable state |
| G7 Release | Install release on a clean supported host, verify loaded hashes and rerun representative contract/live cases | Reproducible supported profile, honest limitations, qualified providers and tested rollback path |

G3 row keys are exactly
`<healthy|broken>-<dialog-entry|dialog-escape|email-name|form-error>-<1|2>`.
Healthy controls must have the expected no-issue observations and broken controls
the expected findings. A tooling-qualification pass deliberately includes detected
defects; it is not a product/AT conformance pass. PNG/ARIA/focus artifacts need
real bytes and hashes. Do not generate synthetic files to fill absent rows.

The source-risk track can run separately against the same fixture revision.
Record why a risk is supported and how to confirm it; do not count that as an
additional page execution or pretend it proves speech.

For G6, explicitly start independent test tasks A (maintenance) and B (Bug Bash).
Stop A and prove B still produces a durable next-step artifact. Retire B's only
watcher without a replacement and require rejection. Explicitly cancel B and
require no replacement work, only authorized reconciliation/cleanup. Repeat after
controller restart and duplicate delivery. This makes cancellation isolation an
observable runtime property rather than a promise in a prompt.

Use existing suites first: `tests/bug-bash.test.mjs`, `setup.test.mjs`,
`operations.test.mjs`, `waiting.test.mjs`, `core.test.mjs`,
`evidence-files.test.mjs`, `packaging.test.mjs` and adapter tests. PR #22 adds
fixture request/host-gate coverage; CI does not impersonate live Windows/AT.
Add targeted cases in the owning suite as each new contract is implemented.

Record quality signals per run/profile: required rows, conclusive/attempted
coverage, confirmed and inconclusive candidates, sampled false positives,
duplicate-effect count, ownership violations, recovery success, cleanup and
delivery success, wall/active/queue time and human interventions. Critical safety
gates require zero violations. Establish performance targets from measured pilots,
not invented latency or accuracy claims.

## 12. Delivery plan and decisions

| Increment | Deliverable | Gate before advancing |
|---|---|---|
| 1. Qualify existing path | Complete candidate fixture/scoped-setup work; preserve existing release and provider boundaries | G1-G3; honest failure/report/cleanup handling |
| 2. Shared discovery contracts | Feature plan/observation/report schemas, capability registry extension and browser module | G0-G2; no forced MCP requirement for plan/source-only |
| 3. Durable composition | Feature journal, child operations, actual callback/watcher admission, scoped cancellation and reconstruction | G6, including independent-task cancellation test |
| 4. AT and real feature | Qualified discovery capture adapters, independent evaluation and multi-journey report | G4-G5 for every advertised supported profile |
| 5. Release/cutover | Installable bounded workflow, compatibility matrix, operating guide and rollback | G7; promote only new runs, keep active runs pinned |

Do not rewrite the entire system before exercising the current fixture. Implement
one vertical slice with real outputs, then expand supported capabilities. Ship
limited qualified profiles rather than marking every optional AT as supported.

Initial decisions: keep the existing manifest format; reuse current runtime and
ownership authority; bundle reusable modules rather than require all sibling
installs; do not add Temporal or a hosted agent platform; keep report private;
keep fixes/publication outside discovery. Agent count is an optimization, not a
correctness requirement, and unavailable sub-agents do not block the base design.

Static supported profiles and explicit capability metadata come first; bounded
task-driven selection follows only among qualified capabilities. Do not delay the
existing fixture for a graph database, new harness or skill optimizer. Offline
evolution is a subsequent opt-in increment, not a prerequisite for increments 1-5.

Before implementation, resolve through host probes and adapter conformance:
actual Copilot/MCP compatibility, the qualified generic browser connector,
typed feature execution support in the original resource authority, and the
first supported real-AT profiles. Unknown answers stay unsupported. Any change
to these decisions updates this document and its acceptance cases in the same
reviewed change; publishing this design alone installs or qualifies nothing.

## 13. Evidence-driven maintenance and offline evolution

Keep raw traces/evidence, curated procedures and authoritative execution state
logically separate. Recalled recovery advice may suggest a hypothesis; the live
ownership/health check still decides whether it can execute. Keep private source,
product data and media within approved storage/visibility boundaries; this design
does not authorize a hosted memory upload.

Initially retain an explicit capability catalog and declared compositions. Once
real runs reveal selection failures, compare a bounded retrieval/ranking candidate
against the static baseline on the same feature setup, budget and required rows.
Record why each capability was selected, excluded or unavailable.

Optimize retrieval edges/descriptions separately from skill procedures. Retain
failure signatures, proposed edits, rejected attempts and recurring regressions.
Limit edit scope; freeze the rubric, required evidence and authority gates.
SkillAdam-style issue memory and edit budgets are ideas to apply through reviewed
changes, not authorization to let an optimizer edit the checker.

Before promotion, use independent healthy/broken regression cases and held-out
feature scenarios, beyond the examples that motivated the change. Repeat paired
runs where variance requires it. Record effect sizes and uncertainty, aggregate
tokens, peak context, latency and infrastructure failures. The known 16-row
fixture remains a regression gate, not evidence of generalization to all features.

Additional acceptance cases for adaptive composition:

| Case | Required result |
|---|---|
| Required AT skill ranked below retrieval cutoff | Required row retained; include its qualified provider or expose a gap |
| Learned relation conflicts with ownership/evidence policy | Reject the proposed execution; do not weaken the hard constraint |
| New skill/provider version arrives mid-run | Existing submitted operation stays pinned; no replacement replay |
| Skill edit appears to improve score by weakening expectations | Reject candidate; protected rubric and known defect detection unchanged |
| Candidate succeeds on training cases but regresses held-out cases | Retain baseline or report insufficient evidence; no automatic promotion |
| Memory recalls a successful recovery on a now-busy host | Respect current ownership; historical success grants no access |

Measure supported conclusive coverage under a fixed budget, known missed defects
and sampled false positives, not raw bug counts. Keep infrastructure errors in
end-to-end reliability accounting even when product accuracy is shown separately.
Require no duplicate effects or ownership violations. Preserve recovery, cleanup
and delivery obligations; adaptation must not recreate task cancellation coupling.

Promote only independently supported candidates through a reviewed version and
qualified profile with rollback, for new runs. Keep the last accepted baseline
when evidence is insufficient. Bound improvement rounds and stop on regression;
more execution history does not guarantee monotonically better composition.
