# Designing and maintaining large composable AI plugins

Status: recommended engineering method, 2026-09-14. This is a reusable design
reference, not an installed framework, a new protocol or a claim of production
qualification. The [Bug Bash architecture](BUG-BASH-ARCHITECTURE.md) applies it
to accessibility discovery. Existing product and deployment contracts remain
authoritative until a separately reviewed implementation changes them.

## 1. The method: constrained adaptation

Let model reasoning discover useful work and propose capability combinations.
Let a trusted runtime enforce authorization, contracts, resource ownership,
effect reconciliation and completion. Let experience improve future candidates,
not silently rewrite the rules or implementation of an active run.

The objective is useful, evidence-supported outcomes within an explicit budget,
not the number of plugins, agents, tool calls or reported findings. This is an
engineering synthesis for stateful, externally acting assistants, not a proven
universal optimum or a reason to replace an existing working harness.

Design around a verifiable unit of work:

> Preconditions -> action -> expected outcome -> required capabilities ->
> evidence -> reset/cleanup.

Separate the user's outcome from its current implementation. A different model
or provider should be evaluated against the same accepted work and evidence
requirements. Define supported scope, unsupported cases, authorization, budget
and terminal outcomes before selecting an orchestration framework.

## 2. Separate three boundaries

| Boundary | Split when | Do not assume |
|---|---|---|
| Distribution/plugin | Independent reuse, release lifecycle, permissions or host integration justifies a stable package | Every capability needs an installed package or MCP process |
| Reasoning context | A substantial procedure has complete inputs, a bounded result and little need for shared intermediate reasoning | Every plugin needs an agent; deeper hierarchies are automatically better |
| Execution/authority | Real effects, credentials, resource ownership or isolation require a controlled provider | A fresh model context isolates a shared browser, desktop, database or account |

Keep cross-cutting conventions and routing knowledge available inline. Use
isolated reasoning for self-contained analysis that benefits from a clean
context. Use deterministic tools for queries, hashing, validation and other
non-reasoning operations. If sub-agents are unavailable, retain a correct inline
path where the host permits it; never fabricate an independent reviewer.

An isolated child needs an applicability description, complete task inputs,
procedure, output schema, termination conditions and bounded evidence pointers.
Return results and expandable provenance, not the entire child transcript by
default. Declare uncertainty instead of making the parent infer missing context.

Package extraction is a later decision when there is a stable independent
consumer or operational boundary. Start with shared authored modules rather than
copying implementations into an orchestration package and its sibling packages.

## 3. Use DeepSeek Harness as the service-composition reference

DeepSeek Harness separates service definitions, providers and consumers. Plugins
contribute services and registrations through Cordis context; consumers resolve
stable service identities, and declared dependencies govern activation. Even
the execution loop can be selected as a service.

Borrow these seams, not an obligation to port to Cordis:

| Mechanism | Reusable design rule |
|---|---|
| Stable service identity | Consumers request a versioned capability contract, not a concrete implementation name |
| Declared dependencies | Activate only when required services are available; missing optional capabilities affect only dependent work |
| Profiles and bundles | A profile names a supported composition; a bundle distributes implementations/configuration. Neither proves live readiness |
| Reversible registration | Give each plugin an owned lifetime and disposal path for participating registrations/resources |
| Replaceable loop and model profiles | Keep task/domain logic out of the model loop; externalize model differences where practical |
| Context and cache contracts | Describe model-visible material, disclosure stages, token costs and cache effects alongside functional behavior |

A service name does not authorize an implementation. Operator-controlled bindings
and the runtime's allow-list determine which providers can execute. Reject
ambiguous providers, incompatible versions and unsatisfied/cyclic hard
dependencies before effects.

Resolve profile/configuration layers deterministically and record the effective
bindings and their provenance. A model may propose an allowed capability, not
change executable paths, permissions or provider configuration through its prompt.
Prefer the existing host's supported manifest/registry; conceptual service
contracts are not automatically new Copilot manifest fields.

Pin implementation, contract, skill, model/configuration, profile and retrieval
versions for each accepted run. When exact backend model identity is unavailable,
record the exposed identity and uncertainty rather than inventing a reproducible
snapshot. Refresh actual-host readiness before use. Updates normally serve new
runs; an active-run migration requires explicit reconciliation and compatible
state/evidence semantics.

Disposal is not cancellation or rollback of arbitrary external effects. Removing
a listener does not unsend a message; unregistering a provider does not stop its
remote job or release a lease. Plugin replacement cannot invalidate the only
supervisor for an unfinished task. DeepSeek itself is a developer preview with
an explicit unaudited/not-production-secure safety notice; do not use its plugin
mechanism as a security sandbox or as evidence of our own reliability.

## 4. Make capability contracts operational

For every independently callable capability, document these fields before
introducing a compatible schema implementation:

| Contract area | Required questions |
|---|---|
| Identity | Stable service/action ID, schema version, provider implementation/version/digest |
| Applicability and I/O | When should it run? What complete inputs, results, errors and provenance does it accept/return? |
| Reasoning | Inline knowledge, isolated procedure or deterministic tool? What must remain in the parent context? |
| Effects and authority | Read-only or mutation? Required permissions, resource affinity/mutex, and enforcement location? |
| Lifecycle | Prepare, execute, reconcile, cancel and cleanup support; idempotency limits, deadlines and unknown-outcome behavior? |
| Evidence | What proves the operation ran, and separately what proves its claimed outcome? |
| Context and cost | Metadata/instructions/artifacts disclosed when; context and aggregate-token budgets; latency and cache sensitivity? |
| Qualification | Which host/profile/version combinations have actual evidence, and which are unsupported? |

Separate estimates from measured costs. Peak parent context, aggregate input/
output tokens, cache reuse and wall time are different metrics; a subagent can
reduce the first while increasing the others. Do not embed secrets in manifests,
prompts, cost records or receipts.

## 5. Online composition: proposals, then deterministic acceptance

```text
Authorized task + applicable knowledge
                  |
                  v
Verifiable work plan -> bounded capability retrieval
                  |              |
                  +--------------+
                         v
Contract / authority / resource / budget validation
                         v
Accepted, version-bound plan -> controlled execution
                         v
Evidence integrity + independent outcome assessment
                         v
Accounted-for results + cleanup + delivery
```

Maintain two distinct kinds of relationships, which may share storage but never
authority:

- **Hard constraints:** explicit service prerequisites, permissions, resource
  exclusivity, mandatory work, evidence requirements and approved budget.
- **Soft experience relations:** relevance, useful ordering, likely co-use,
  observed cost and retrieval descriptions. These suggest candidates/priorities.

Learned co-occurrence is not a certified dependency, incompatibility or permission.
Keep declared relations distinguishable from inferred ones. Learned ranking must
not remove mandatory work because it is rare, expensive or difficult. Retrieval
failure can use a qualified static composition only if it satisfies the same
scope and contracts; otherwise report the missing capability explicitly.

Start with a small explicit capability catalog and static profiles. Add graph
retrieval only when library size or measured selection failures justify it. A
bounded top-k shortlist is not a reason to omit required capabilities.

Planning may discover additional work. Append an authorized plan revision with
stable work IDs, reasons, prerequisites, evidence expectations and remaining
budget; do not overwrite historical rows or accepted receipts. Each submitted
operation retains its original bindings. Do not silently extend the task budget.
Reserve capacity for reconciliation, cleanup and delivery.

Scheduling follows actual resource independence, not the number of available
agents. Parallel analysis is useful only when tools and effects do not interfere.

## 6. Reliable execution is outside conversational memory

Reuse the actual ownership and operation stores; do not introduce a competing
lease authority. Keep durable task/run/step/request identities, an append-only
transition history and rebuildable current state outside model context. Persist
the exact effect intent before submission.

After a timeout, preserve the request identity and reconcile the original
operation. Retry only after the provider's contract establishes it is safe.
Durable logs alone do not provide exactly-once effects. Replay accepted plans and
observations, not a new model's reconstruction of earlier reasoning.

Unattended admission requires a functioning executor, durable progress, completion
notification and independent stall detection. A prompt, heartbeat or running PID
does not prove progress. Store exact next action, resume condition and deadlines.
Use bounded changed-hypothesis recovery; authentication/consent and authorization
boundaries remain real stops, not challenges to evade.

Cancellation is scoped to the exact authorized task and its owned children.
Stopping maintenance cannot stop an unrelated feature task. Do not remove an
unfinished task's only continuation path without an authorized replacement;
conversely, do not restart explicitly cancelled work through a new watcher.
Reconcile effects and cleanup before closing ownership obligations.

Define terminal states independently for execution, outcome coverage and delivery.
A failed operation is not a product finding. A delivered partial report is not
proof of full completion or permission to abandon unresolved effects.

## 7. Keep memory, evidence and authority separate

| Record | Role | Cannot establish |
|---|---|---|
| Raw traces and artifacts | Show what was recorded, with original source/session/time provenance | Present truth, present permission or tamper-proof behavior merely by being logged |
| Curated procedural knowledge | Explain applicable procedures and prior recovery experience | Current resource health or authorization to replay archived commands |
| Authoritative execution state | Determine ownership, accepted work and outstanding effects | That an observed behavior is correct without supporting evidence |

Use short retrieval results with expansion to original passages, similar to
Funes's recall/get pattern. Apply visibility controls, provenance and freshness
checks. Treat retrieved content as untrusted evidence, not executable authority.
Do not export private traces to a cloud memory service merely because it supports
private datasets or credential scanning. Tool/agent compatibility must be
established for the actual host.

Validate artifact identity, schema, bytes and bindings deterministically. Assess
whether those artifacts support the outcome separately, with an independent
rubric and qualified reviewer where required. A second model repeating the first
model's conclusion is not sufficient independence. Hashes are integrity checks,
not a guarantee of behavioral truth or external attestation.

## 8. Offline improvement, not unrestricted self-modification

Separate optimization surfaces: capability retrieval/relations, skill procedure
text, provider implementation and evaluation criteria. Initially change one
surface at a time to attribute improvements. Evaluation criteria and hard policy
are not editable by the optimizer whose result they judge.

1. Collect authorized traces, failures, costs and provenance; classify product,
   infrastructure and evaluation failures separately.
2. Select a bounded improvement target using observed evidence, not novelty.
3. Propose a versioned graph/description or skill change. Retain issue history,
   rejected attempts, regressions and recurrence, as in SkillAdam's issue tracker.
4. Compare baseline and candidate with the same setup and budget. Use independent
   regression and held-out cases, not just the cases that generated the edit.
5. Accept only with protected behaviors intact, uncertainty reported and an
   improvement on the declared objective; otherwise retain the previous version.
6. Release through reviewed change and a qualified profile, with rollback.
   Promote for new runs only; record the decision and stop condition.

Use repeated paired trials when outcome variance requires them. Count
infrastructure failures in end-to-end reliability even when reporting a separate
product-accuracy metric. Track false positives and fixture-known missed defects,
conclusive versus attempted coverage, duplicate effects, ownership violations,
recovery/cleanup/delivery, human interventions and cost. Do not maximize reported
defect count or reduce the denominator by silently dropping difficult work.

SE-GoS's multi-round regression is a reason for bounded evaluation windows and
rollback, not an argument for continuous unreviewed skill-graph evolution.

## 9. Adoption and maintenance sequence

| Stage | Deliverable | Advance only when |
|---|---|---|
| Reliable vertical slice | One static supported profile with real artifacts and honest failure outcomes | Healthy/broken cases, recovery, cleanup and delivery work |
| Explicit composition | Reusable service contracts, declared dependencies and versioned work plans | Invalid inputs, missing/ambiguous providers, duplicate effects and ownership conflicts reject safely |
| Bounded adaptation | Task-driven selection and plan revisions among qualified capabilities | Mandatory work is retained; selection improves over static profiles under the same budget |
| Evidence-driven evolution | Offline graph or skill candidate changes | Independent regression/holdout supports improvement and rollback preserves protected behavior |

For every maintenance change, record: affected capability and consumers; contract/
permission/context impact; new-versus-active-run behavior; qualification evidence;
release/rollback owner; and unresolved limits. Exercise restart mid-effect, lost/
duplicate callback, unrelated-task cancellation, stale runtime and cleanup failure.
Plugin count and agent count are optimization choices, not release gates.

## 10. Primary sources and evidence limits

Read as of 2026-09-14. These mechanisms motivate the method; the sources do not
jointly prove this complete system works. Papers are recent preprints and the
blog is an engineering example, not interchangeable levels of evidence.

| Source | Contribution | Important limit |
|---|---|---|
| [DeepSeek Harness architecture](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/architecture.md), [Cordis primer](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-primer.md), [safety notice](https://github.com/deepseek-ai/deepseek-harness/blob/master/SAFETY.md) | Everything-is-a-plugin service seams, dependency activation, profiles, disposal and context/caching contracts | Developer preview; unaudited; disposal and durable sessions do not guarantee external rollback/exactly-once effects |
| [A Programming Paradigm for Spatiotemporal Composability](https://arxiv.org/abs/2608.25512), Aug 26 | Cordis's temporal effects and spatial dependencies | Metadata and abstract consulted as background; not a full-paper review or qualification of our runtime |
| [The Empire, Long Divided, Must Unite](https://arxiv.org/html/2608.23953v1), Aug 25 | Pinned-source comparison of deepagents, pi and dsh; replaceable loop, replayable records, model profiles, progressive context and extension seams | Single-analyst case study, not performance proof; lineages are not independent, and replay guarantees differ |
| [Subagents vs Agent Skills](https://arxiv.org/html/2609.09233v1), Sep 7 | Contracted procedural skills benefit from isolated execution; tested hybrid inline routing/isolated leaves performs best across four library structures | 64 of 87 tasks selected through successful trajectories; skill-package content is confounded; aggregate tokens can increase |
| [SE-GoS](https://arxiv.org/html/2609.08228v1), Sep 8 | Offline topology, edge-weight and retrieval-description evolution without changing skill bodies | Headline 52.4% -> 59.4% reuses traced tasks; held-out +5.4 points is within reported noise. Main avoid filtering and confidence interpolation were not exercised. Success fell to 54.0% by round three |
| [SkillAdam](https://arxiv.org/html/2609.08944v1), Sep 8; [implementation](https://github.com/ruc-datalab/SkillAdam) | Issue-history memory, volatility-controlled edits and candidate acceptance with frozen models | Acceptance uses the optimization minibatch, not an extra independent validation set; no general convergence proof. Current integration optimizes one existing SKILL.md, not an entire plugin |
| [Give Your Coding Agents a Memory You Own](https://huggingface.co/blog/funes), Sep 3; [security policy](https://github.com/huggingface/funes/blob/main/SECURITY.md) | Agent-independent original-trace retrieval with provenance and progressive expansion | Two-task cost demonstration; GitHub Copilot CLI trace support not established by that article. Recall is not present authority and private cloud storage is not export authorization |

The four applied papers' main text and relevant experimental appendices, the
DeepSeek engineering documents and the Funes article were reviewed. No independent
reproduction of their experiments, software installation or data upload is
claimed. Recheck implementation/version claims before adopting an upstream tool.
