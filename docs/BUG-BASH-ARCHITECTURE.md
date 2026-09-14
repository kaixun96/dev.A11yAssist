# Bug Bash plugin design

**English** | [简体中文](BUG-BASH-ARCHITECTURE.zh-CN.md)

Maintain both language versions together. This document describes what the plugin
does, its child capabilities, how they work together, and the user-facing input
and output. Current behavior and proposed extensions are marked separately.
Baseline: version 0.15.0, 2026-09-14; installation is not live qualification.

## 1. What is Bug Bash?

`a11y-bug-bash` is a feature-level accessibility discovery plugin. A user describes
a feature and how to verify it; the plugin turns that information into a coverage
plan, checks the authorized page, reviews relevant source and produces a report.

For example, an item picker is not just a dialog to scan. Its journeys include
opening, searching, navigating results, selecting, confirming, cancelling and
reopening. The plugin checks applicable keyboard, focus, semantics, visual,
dynamic-state and real assistive-technology (AT) behavior across those journeys.
It checks reachable, relevant combinations, not every theoretical combination.

Bug Bash owns the feature scope, plan, coordination and final report. Reusable
capabilities supply knowledge, environment checks, page observations and source
analysis. The user uses one entrypoint: `/a11y-bug-bash`.

It discovers problems; it does not automatically fix code, build the product,
file Bugs, create PRs or publish evidence. Those are separately authorized tasks.
A completed round is not accessibility certification.

## 2. Which child plugins and modules does it use?

"Child plugin" here means a reusable capability in the composition, not necessarily
another installed package or another agent. **Today, knowledge, setup and test categories are
bundled internally; planning, coordination and reporting are Bug Bash's own
instructions/templates.** Other integrations below are conditional or proposed.

| Component | Responsibility | Input -> output | Integration and status |
|---|---|---|---|
| Bug Bash coordinator | Understand scope, plan coverage, route checks, aggregate results | Feature context + verification steps -> coverage plan + report | Current entry skill and templates; executable durable orchestration is proposed |
| `a11y-knowledge` | Supply applicable A11y guidance and read-only source review | Stack/version, scoped source and question -> cited guidance or source-supported risks | Already bundled under `modules/a11y-knowledge/`; no extra install or separate agent |
| `a11y-setup` | Check only the prerequisites needed by selected page/AT checks | Required capabilities + host -> inventory, gaps and preparation plan | Already bundled under `modules/a11y-setup/`; host changes need separate authorization |
| `a11y-test-categories` | Apply all ten categories and every numbered step to each target/state | Complete target/state inventory -> full step matrix, evidence and explicit gaps | Independently installable; identical skill/procedures/local accounting tool bundled under `modules/a11y-test-categories/`; no live execution backend |
| Browser checks / proposed `a11y-browser` | Exercise navigation, focus, semantics and applicable rendered checks | Authorized connection + scenario -> page observations and artifacts | Today uses available caller tools. A reusable typed browser module is proposed, not shipped |
| `a11y-resources` | Integrate with actual evaluator ownership | Host requirements + task identity -> ownership/status information | Optional connected capability under its real contract; status is not acquisition. General feature-task acquisition needs an explicit adapter |
| `a11y-capture` | Collect real named-AT/media evidence when required | Owned evaluator + supported sealed scenario -> actual observations/artifacts | Optional only for inputs its existing contract supports; generic Bug Bash discovery adapters are proposed |
| `a11y-validate` | Validate compatible evidence integrity | Supported evidence manifest -> validation result | Current validator is for evidence-v1, not an arbitrary Bug Bash report. Discovery validation is proposed; behavior assessment is separate |
| `agent-operations` | Reconcile pending operations, recover, clean up and deliver | Original operation/ownership + progress -> scoped status and receipts | Reuse supported connected operations; feature-level journal, supervision and cancellation integration are proposed |
| Report module | Separate findings, risks and gaps | Coverage rows + observations + evidence -> private report | Current report template; no separate report plugin or publication dependency |

Planning and reporting stay internal because they belong to the feature workflow.
Browser behavior should first be a shared module; extract at most one new
`a11y-browser` package when independent reuse justifies it. Real-AT adapters belong
within capture, not one mandatory package per AT.

Bug Bash does not require every sibling plugin to be installed. `a11y-intake` is
optional if an authorized work item supplies context. `a11y-publish`,
`a11y-workflow` and AgentOW are not discovery dependencies.

## 3. How are they composed and used?

### Current composition

Installing Bug Bash loads its public skill and bundled modules. The calling
Copilot follows that skill: it reads the bundled setup/knowledge instructions and
uses tools actually available in the session. The package has no MCP server of
its own and does not automatically invoke sibling plugins by name.

Before page work, the bundled test-categories plugin expands every in-scope
target/state into all ten categories and their numbered steps. Every applicable
step must run; not-applicable steps need target-specific reasons. No representative
sampling substitutes for this inventory. Its local matrix gate rejects missing
steps and identifies unfinished coverage; actual evidence assessment remains
separate. Unknown inventory completeness, unavailable AT or budget exhaustion
means partial, not a smaller denominator.

```text
User: feature + verification steps + authorized inputs
                         |
                         v
             Bug Bash: scope and target/state inventory
                        |
             Bundled a11y-test-categories
             all ten categories / every step
                         |
             +-----------+------------+
             |                        |
             v                        v
     Bundled a11y-setup       Bundled a11y-knowledge
     scoped readiness        read-only source review
             |                        |
     actual ownership                 +--> risks / confirmation scenarios
             |                        |
             v                        |
     available browser tools          |
             |                        |
     relevant real-AT checks          |
             +-----------+------------+
                         v
           compare observations with expectations
                         |
                         v
        findings + source risks + coverage gaps
                         |
                         v
           private report + cleanup + delivery
```

The coordinator passes scenario-specific context, not the entire conversation,
to each substep. It brings observations back to the same coverage row:

| Step | What Bug Bash passes | What it receives and does next |
|---|---|---|
| Plan | Every target/state, user journeys, expected behavior, budget and knowledge | Test-categories expands all ten categories/every step; scenarios supply preconditions, actions, expectation, capability and reset |
| Prepare | Only capabilities required by those rows | Available tools and gaps; check ownership before page interaction; authorize preparation separately |
| Source review | Relevant component/style paths, revision and stack | Source-supported risks and runtime triggers; add in-scope confirmation rows |
| Page/AT check | One row, safe data, authorized connection and expected evidence | Actual behavior and artifacts, or a precise reason the row could not run |
| Assess | Expected versus observed behavior and supporting evidence | Finding, no issue observed, or uncertainty; repeat candidates safely when useful |
| Report | Every planned row, evidence and unresolved items | Saved report, restored owned resources and delivery to the requester |

For an item-picker Cancel check, the planner expects focus to return to the
opener. Browser tools open the picker, cancel it and record the actual focus
target. Source review may inspect the dismissal path independently. A source risk
does not become a reproduced page bug without runtime observation; connecting it
to the page's root cause also requires source/build binding.

Source analysis may proceed independently of page work. Browser, focus, AT and
recording operations sharing one desktop are serial. Missing AT blocks its rows,
not unrelated browser checks; missing page access does not block authorized source
review. Gaps remain in the report.

### Proposed executable composition

The target dispatcher resolves stable capability contracts to qualified providers,
validates inputs and pins the selected versions for the run. It carries a versioned
coverage plan through child operations and reconciles their results before reporting.
Providers enforce authorization and desktop ownership; retrieved skills cannot
grant either. Scenario details load only when needed.

Start with explicit supported combinations, then allow bounded task-driven
selection among qualified capabilities. Selection cannot drop mandatory checks,
weaken evidence or change a submitted operation. These are implementation goals,
not tools that the current package already exposes.

## 4. How does a user run it?

### Install once

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-bug-bash@a11y-assist
```

Restart Copilot to load the plugin. No separate knowledge/setup/test-categories install is needed.
Live page checks need an existing authorized Windows DevBox browser connection;
real AT needs its own usable connection and exclusive desktop ownership.
The installation supplies neither browser/AT binaries nor a live connection.
Plan/source-only work does not need Windows setup.

### Supply the feature, not a completed questionnaire

Provide what is known in natural language. Bug Bash organizes it into context and
a plan; it asks only for missing facts that block a meaningful next check.
Do not provide passwords, tokens or cookies.

| Input | When needed | Example |
|---|---|---|
| Feature purpose and scope | All modes | Users search items, choose one and confirm; exclude admin settings |
| Verification steps and expected behavior | All modes | Open, search, choose, confirm; Cancel restores focus |
| Authorized page/environment and safe data | Page checks | Test URL, disposable fixture, required flags and permissions |
| Source scope | Source review | Read-only component/style paths or supplied snippets |
| Build/source revision | When known | Actual deployed build and source commit, or explicitly unknown |
| Requested mode and priorities | Optional; default `both` | Prioritize keyboard/focus; request NVDA output if in scope |
| Existing connections and ownership | Live page/AT work | Approved browser/AT access; do not invent a connection |
| Budget and private output location | Establish before execution | 30 minutes; an authorized private directory |

### Example request

```text
/a11y-bug-bash Check the item-picker feature.
Purpose: search items, select one and confirm.
Page: <authorized test URL>; data/flags: <safe fixture>.
Verify: open, search, navigate results, select and confirm.
Also check Cancel, empty results, a recoverable error and reopen.
Expected: keyboard operation works; Cancel returns focus to the opener;
selection and search status are accessible.
Source: <read-only component/style paths>; revision: <known or unknown>.
Use my existing authorized browser connection.
Mode: both. Prioritize keyboard and focus; check NVDA if available.
Budget: 30 minutes. Save to <private output directory>.
Separate page bugs, source risks and missing coverage. Do not fix or file.
```

These are prompt fields, not CLI flags or a request to install missing tools.

| Mode | What runs | What the user receives |
|---|---|---|
| `both` (default) | Page checks and read-only source review where authorized/available | Combined report; unavailable requested track remains a gap |
| `page-only` | Authorized page checks; no product source reading | Page findings, evidence and page coverage gaps |
| `source-only` | Read-only source review; no browser or host setup | Source-supported risks and suggested runtime confirmation |
| `plan-only` | Planning only; no page/source execution or host setup | Coverage matrix, required capabilities and missing inputs |

If the budget runs out, Bug Bash reports partial coverage and prioritizes the
remaining work. It does not silently extend the run or omit unfinished rows.

## 5. What does it output?

The result is a private Markdown report with a coverage matrix and references to
actual evidence. Media exists only when the relevant tool really captured it.
The user receives the report location and a concise summary, not automatically
created Bugs or PRs.

| Report section | Content |
|---|---|
| Scope and outcome | Feature, mode, environment/build, budget, tested/excluded scope and outcome |
| Coverage matrix | Original inventory; each target/state/category/step, scenario, expectation, tool, status and evidence/gap; local accounting summary |
| Page-reproduced findings | Impact, exact steps, expected/observed behavior, repeatability and evidence |
| Source-supported risks | Source location/revision, reasoning, uncertainty and runtime confirmation needed |
| Questions and gaps | Missing context/tools, blocked/unrun/inconclusive checks and next safe action |
| Evidence index | Actual private artifact locations, timestamps, scenario/build/tool bindings and limits |
| Cleanup and resume | Restored owned resources, unresolved effects, remaining work and delivery status |

Illustrative output shape only, **not a real execution result**:

```text
Feature: Item picker
Outcome: partial
Coverage: <all inventoried target/states x all category steps>;
          <executed / applicable>, <blocked / not-run / inconclusive>
F01 [page-reproduced]: Cancel leaves focus outside the expected opener.
    Includes actual reproduction steps, expected/observed focus and evidence.
R01 [source-supported-risk]: Search status update may lack an announcement.
    Includes source location/revision; real-AT confirmation still required.
Gap: NVDA search-status check blocked because the AT connection is unavailable.
Evidence: <references to captured artifacts; do not fabricate files>
Cleanup: <actual restoration/release outcome>
Next: establish authorized AT capability and run the remaining row.
```

Rows use `planned`, `observed-no-issue`, `finding`, `blocked`, `not-run`,
`not-applicable` or `inconclusive`. Keep them all; explain non-applicability.
The report outcome is `complete`, `partial`, `blocked` or `plan-only`.
`complete` requires conclusive coverage of requested applicable rows, applicable
cleanup and delivered results. Finding defects can still complete the round.
Zero findings does not mean the feature is fully accessible.

## 6. What makes the composition reliable?

| Requirement | How it is demonstrated |
|---|---|
| Child capabilities work independently | Validate input/output contracts and supported host/provider combinations |
| The assembled flow really runs | Exercise healthy and deliberately broken fixtures, then an authorized real feature |
| Claims match evidence | Separate integrity checks from behavior assessment; real AT claims require real named-AT output |
| Missing capabilities remain visible | Keep blocked/unrun rows while continuing independent authorized checks |
| Interruptions do not lose or duplicate work | Persist rows and operation identity; reconcile unknown effects before retry; qualify supervision and task-scoped cancellation |
| Completion includes cleanup | Restore only owned settings/sessions and deliver the report; expose unresolved effects |

Implementation order is: qualify the current static path -> implement shared
discovery contracts and browser capability -> durable composition -> qualify
real-AT and real-feature profiles -> release supported combinations. Do not wait
for a new harness or adaptive skill graph before proving one end-to-end slice.
The detailed acceptance design is supporting material, not a claim of completion.

## 7. Supporting documents and references

- [Current Bug Bash contract](BUG-BASH.md): authoritative shipping behavior and boundaries.
- [Independent test-categories plugin](TEST-CATEGORIES.md): all-target procedures and local matrix gate.
- [Context template](../src/bug-bash/context.template.md), [coverage dimensions](../src/bug-bash/coverage.json)
  and [report template](../src/bug-bash/report.template.md).
- [Execution contracts and qualification](BUG-BASH-EXECUTION-DESIGN.md):
  detailed proposed schemas, ownership, recovery and acceptance gates.
- [Reusable large-plugin design method](COMPOSABLE-PLUGIN-DESIGN.md).
- [Research references and evidence limits](COMPOSABLE-PLUGIN-DESIGN.md#10-primary-sources-and-evidence-limits):
  DeepSeek Harness/Cordis and the related agent, skill-composition and memory work.
  These are background sources, not proof of implemented capability or measured gains.
