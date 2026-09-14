# Migration without breaking the existing workflow

## Current delivery

v0.18 / execution envelope v0.9 changes plugin boundaries:

| Previous surface | New owner / action |
|---|---|
| Separate `a11y-resources` installation and `a11y_resources_*` tools | `a11y-setup`, `a11y_setup_resources` and `_invoke` release-evaluator; establish DevBox authority before tool preparation |
| Category files inside Bug Bash/runtime packages | Only `a11y-test-categories`; install separately and configure `pluginRoots.testCategories` |
| Manual post-validation filing handoff | `a11y-file-bug` draft/submit/skip, native WIT attachments and Bug readback, explicit exact-draft approval |
| Internal-only final reporting | Independent `a11y-report` generate/deliver plus the same shared coordinator implementation |

There are twelve packages, eleven non-compatibility names. Category consumers
pin the external plugin version/tool/procedures and never load a bundled fallback.
For requested filing, `filingRequested:true` yields before reporting until each
finding has an actual result or explicit skip reason. No automatic Bug creation
or upload is authorized by discovery. Media bytes and caller playback review
remain separate; the native simple uploader is bounded to 128 MiB total.

**New operations only:** preserve old resources-plugin operations, category
copies and provider/runtime pins until their original work is reconciled and
closed. Do not rewrite old journals or uninstall their sole supervisor. This
publication does not deploy, run live tests, create actual Bugs or release leases.

v0.17 completes the source discovery chain: accepted plans, per-target category
expansion, concrete scenario configuration, bounded run/advance, original-effect
reconciliation, source analysis recording, compatible discovery validation,
module-owned cleanup and private report delivery. The shared typed browser module
is bundled, not another mandatory package.

Execution/envelope v0.8 fences these new discovery semantics and lifecycle owners.
Discovery calls from an older draft must retain their original full runtime and
provider; never rewrite their journals into this version. BEFORE/AFTER retain the
v0.7 health requirements below. Discovery adds bound health diagnostic references
and independent assessment gates. The actual provider/handler must implement and
qualify those checks before new execution; updating a registry alone is insufficient.
There is no operations-plugin revival. Unsupported AT/scanner/visual/authenticated
adapters remain explicit gaps, not implicit browser fallbacks.

This is source publication, not a deployment or live-qualification claim. No
active evaluator, browser/AT session, lease, original operation or AgentOW pin is
changed, and no live test is resumed. Plan/source-only local delivery sends no
Teams message. See [runtime usage](BUG-BASH-RUNTIME.md).

v0.16 removes the independently installable `agent-operations` package, skill,
MCP server and catalog/installer entry. New calls move as follows:

| Retired entrypoint | New owner |
|---|---|
| `agent_operations_invoke` / `recover-media`, `recover-nvda` | `a11y_capture_invoke`; same narrow original-instance recovery contracts |
| `agent_operations_invoke` / `cleanup` | `a11y_workflow_invoke`; same independently authorized scoped cleanup, not full-workflow completion |
| Workflow cleanup stage, progress, abandonment and reconciliation | `a11y_workflow_execute`, `_progress`, `_abandon`, `_reconcile` |
| Independent operation status/reconciliation | New owning plugin's `_operation_status` / `_operation_reconcile`, for new operations only |

Normal cleanup belongs to each module; Bug Bash aggregates actual proof and
unresolved items without depending on the full workflow. Internal shared
operations code and the qualified `operations` provider mapping remain; no
second recovery engine or implicit fallback to the `capture` provider is added.
Eleven package names remain installable, ten selected by `all`.

Contract/envelope v0.7 adds mandatory `capturePreflightVerified` and
`capturePostcheckVerified` pass gates to BEFORE/AFTER, including workflow capture.
Connections must perform current scenario-scoped checks before every capture and
postcheck/owned cleanup after every attempt, including failure or interruption.
See [the lifecycle contract](CAPABILITIES.md#capture-lifecycle-package-v016-contract-v07).
Provider qualification is required; gate checking is not a remote health probe.

**Cutover is for new operations only.** Do not uninstall or replace the only
runtime supervising unfinished work. Reconcile old operations using their
original pinned package/provider and IDs, preserve evidence, and close or
explicitly hand off ownership before an installation upgrade. Old journals fail
the v0.7 fence; do not edit their plugin/version fields, silently rebind provider
connections or retry with fresh IDs. This source release neither uninstalls a
running plugin nor deploys providers, changes existing workers or resumes tests.

v0.15 extracts the AgentOW host-setup tutorial into independent `a11y-setup`
and bundles that same module into Bug Bash's preparation step. It reuses the
shared Windows host installer and retained browser helper, not a second
implementation. The installer now supports explicit dependency subsets while
retaining the legacy full-set default. Check-only is the new skill default;
package/host changes, driver/elevation/restart and live readiness remain separate.
Eleven package names are installable; `all` selects ten non-compatibility names.
No scanner/ADK/provider is newly implemented and no installed worker or AgentOW
pin is updated. See [setup and its inherited browser limits](SETUP.md).

v0.14 adds the independently installable `a11y-bug-bash` discovery framework.
It plans from feature context and verification steps, coordinates available
authorized page tools and reuses the exact knowledge skills internally for
read-only source review. It reports runtime findings, source risks and coverage
gaps separately. There is no new browser/scanner/AT runtime, automatic filing or
remediation. Ten package names are installable; the helper's `all` selects nine
non-compatibility packages. Existing protocols, exports and workers are unchanged.
See [the framework and usage](BUG-BASH.md).

v0.13 makes `a11y-knowledge` the single recommended knowledge installation.
It includes the ODSP subskill and complete preserved project references; matching
SPDS/Fluent/SharePoint questions route there, while unrelated projects use generic
topics only. Both skills remain read-only and archived instructions stay inert.
The old `a11y-knowledge-odsp` install name remains compatibility-only. Do not
install both; the helper's `all` now selects eight non-compatibility packages.
No archived body, inventory, runtime consumer or installed worker changes.

v0.12 makes the homepages a bilingual plugin catalog. Every package has its own
installation, prerequisites, example and limitations. Authored code, skills and
generic knowledge move under `src/`; installed package layouts and names do not
change. Stable AgentOW runtime/native export paths remain generated compatibility
copies. The original archive and inventory are unchanged. The installer now
requires an explicit plugin selection and supports all nine packages, including
project knowledge. No worker, installed plugin, provider or protocol is migrated.
See [development](DEVELOPMENT.md) for source and generation boundaries.

v0.11.1 moves active marketplace metadata to `.github/plugin/marketplace.json`
and all nine plugin manifests to each plugin's root `plugin.json`.
MCP launch paths use `${PLUGIN_ROOT}`; skill references resolve from their own
plugin root rather than an assistant-specific variable or the caller's directory.
This retains the existing Copilot manifest format and `.mcp.json` configuration;
it does not opt into a different plugin schema or change runtime behavior.
Marketplace/plugin names and installation commands remain unchanged.
The pinned AgentOW source archive, inventory and six original compatibility
bodies retain their original text, including historical Claude names.
Publication does not update installed plugins or restart active workers.
See the [Copilot plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
for supported manifest locations.

v0.11 completes the source knowledge inventory beyond the earlier six-document
selection. Every tracked file at the pinned AgentOW commit has an explicit
disposition; whole first-party documents and related source references are
preserved without summarizing away framework/project details. SPDS/Fluent V8/V9
and SharePoint have direct topic navigation and an independent read-only
`a11y-knowledge-odsp` package, while the generic package remains framework-free.
The original six bodies are retained for compatibility. See `KNOWLEDGE.md` and
the profile's `source-inventory.json` for exact scope, third-party references and
non-knowledge exclusions. This does not migrate executable source, replace
AgentOW documents, update installed plugins or perform a runtime cutover.

v0.10 connects scoped `recover-nvda` through the shared independent operation
implementation and small/full packages. It reuses the original owned-instance
controller and completed-assignment authorization, without redesigning startup
or broadening cleanup. Its main-process-only receipt distinguishes a new stop
from reading the original stop result. Busy/incomplete workers, missing original
identity, legacy runs and unknown effects are unsupported rather than additional
recovery prerequisites to build around. Existing capture defaults, native/evidence
exports and AgentOW pins remain unchanged. This source connection does not deploy
anything, qualify real AT or complete general cleanup.

v0.9 adds explicitly scoped `recover-media` to the shared independent operation
implementation and both small/full packages. Its exact assignment and limited
recorder/default-endpoint contract cannot satisfy general or workflow cleanup.
The deployment connection must use the original owned controller, single-flight
guard and no-replay response journal. Contract/package qualification is not
installation, real audio/AT acceptance, resource release or a production cutover.
The envelope version and existing AgentOW native/evidence exports are unchanged.

v0.7 adds explicit root-confined local evidence artifact hashing to the read-only
checker. It reuses the existing receipt artifact verifier and a single-read
evidence-v1 document loader; both small and complete packages call the same code.
Default structural-only calls and the exported validator CLI retain their
behavior. Both baseline and current artifacts are required in opt-in verify mode.
This is not real AT, protected-runtime qualification, independent media/behavior
acceptance, resource release or a live cutover.

v0.6 adds explicit bounded caller-owned polling to the shared capability and
optional CLI-workflow protocol. Provider configuration, original request and
absolute deadline remain bound across restart. Default/Twin callbacks do not
change. This release does not qualify a live recorder, install a caller scheduler
or switch existing pinned AgentOW/native consumers whose exported implementations
are unchanged. Real provider polling support still requires its own integration.

v0.5 moves public Windows host setup, the retained AgentOW personal-browser
profile, PR attachment execution and description budgeting into canonical shared
sources. Native ADO `read-item` and `attach-evidence` are independently executable
through configured authentication. Their narrower receipts do not satisfy
the complete intake/publication stage contracts. See `NATIVE-CAPABILITIES.md`.
Actual AT, resource recovery/release and independent behavior/media providers
still require the deployment qualification below.

v0.4 provides independent capability operations, a provider-free evidence-v1
structural checker and an optional workflow that calls the same capabilities.
Generic source/review connections do not require AgentOW; the explicit
`agentow-odsp` profile preserves existing deployment policy. Existing actual A11y automation remains
the production authority until each provider passes its qualification.

No installed production plugin is replaced, no existing session is rebound,
no task is duplicated, and no evaluator/Codespace is acquired by repository
creation or installation.

## Incremental plan

1. **Contract baseline**: compare every current phase start/stop/exit gate against
   workflow.json. Retain the stricter no-BEFORE/no-PR rule over AgentOW's optional
   unverified PR path. Resolve discrepancies before live execution.
2. **Resource adapter**: wrap the existing canonical shared pool, preserving
   original tokens and root identity. Qualify conflict, foreign owner,
   stale heartbeat, delayed task, recovery-vs-execution, cleanup and crash tests.
   Never copy an active registry to create a second ownership authority.
3. **Intake and capture providers**: wrap current scripts without rewriting their
   behavior. Parameterize personal machine/path/tenant assumptions. Validate
   on synthetic test inputs first, then one explicitly scoped real Bug.
4. **Validator and publication providers**: prove same verdict/hash equivalence,
   exact-HEAD invalidation, independent evaluator separation, actual Draft
   status and live media behavior.
5. **AgentOW consumer**: keep its orchestration, consume shared capabilities
   through MCP or pinned generated runtime exports, and retain the actual-host
   freshness gate. Do not force its entrypoint through another full workflow.
6. **Entry adapters**: execute the same fixture serially through Twin+multi,
   CLI+single and CLI+multi. Inject restart, timeout, pending result, duplicate
   delivery, busy resource and configuration/version mismatch.
7. **Cutover**: change duplicate capability implementations to thin consumers; new runs use the qualified
   provider set. Keep existing runs on their recorded versions until a tested
   state migration preserves run/owner/request/evidence identity.
8. **Capability authority move**: only after equivalent behavior is proven,
   maintain one implementation per shared capability here. Different caller
   workflows may coexist; the complete A11y Assist workflow remains optional.

## Required qualification matrix

| Case | Expected behavior |
|---|---|
| missing capability/config | explicit setup blocker, zero live mutation |
| second session owns Bug/machine | queued/conflict, no steal |
| pending provider timeout | same request reconciled, no second execution |
| BEFORE nonpass | cleanup/no source/no PR |
| changed scenario/evaluator/HEAD | rejection, evidence rerun |
| review changes | full source/AFTER/validate/review loop |
| partial or external artifact | hash/path failure, no phase advancement |
| stale runtime or model mismatch | freshness failure, no silent fallback |
| caller invokes a small plugin independently | local inputs/permission/evidence gates apply; no unrelated prior-stage requirement |
| caller invokes a full-workflow stage early | the workflow's phase gate rejects |
| cleanup/notification failure | retained state, not completed |
| interrupted storage mutation | preserve lock/journal; no automatic ownership expiry |
| original worker only replies | no false claim of execution recovery |

The unit/provider-fixture tests in this repo cover core mechanics, not actual
NVDA speech, Dev Center console recovery or production media playback. Report
that distinction accurately in release notes.
