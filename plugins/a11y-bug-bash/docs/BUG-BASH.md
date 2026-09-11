# Feature accessibility bug bash

`a11y-bug-bash` is a first framework for a bounded, feature-scoped discovery
round. The user supplies context and how to verify the feature; the skill plans
and carries out available authorized checks and produces an evidence-separated
report. It is not a new recorder, scanner, automatic remediation engine or
certification service. No sibling plugin is required.

## What ships

- One public entrypoint, `/a11y-bug-bash`.
- Context, coverage and report templates under `bug-bash/`.
- The exact two knowledge skills and complete references from `a11y-knowledge`,
  bundled privately within the package at `modules/a11y-knowledge/`.
- A staged skill that coordinates page inspection and read-only source review.
- The same setup skill, profiles and shared host installer as `a11y-setup`,
  privately bundled under `modules/a11y-setup/` for environment preparation.
- An opt-in disposable browser fixture runner for qualifying the page-observation
  path, with healthy controls and deliberately broken variants. It is not a
  generic product scanner, AT recorder or replacement for the supplied feature.

The internal module has no plugin manifest and is not a nested installed plugin.
Its skills are read as instructions for the source-review substep, not registered
as additional top-level commands. Their paths resolve relative to the module
root. Installing standalone knowledge as well does not duplicate Bug Bash's
public command or require choosing between two top-level knowledge commands.
Knowledge rules have one authored source; the Bug Bash coverage prompts organize
scenarios rather than maintaining another component-rule database.

## Inputs and first use

Give the feature goal, authorized URL/environment, verification steps, expected
behavior and relevant source paths/snippets. Include safe fixtures, flags,
permissions, known build/revision, available browser/AT connections and time
budget when known. Never supply credentials. The skill fills the context template
from supplied facts, surfaces consequential unknowns and proceeds on independent
tracks without waiting for unnecessary approvals.

```text
/a11y-bug-bash Check the item-picker feature.
Context: users search items, select one and confirm; Cancel restores focus.
Page: <authorized test URL>, <safe fixture and flags>.
Verify: open the picker, search, navigate results, select, confirm; also cancel,
empty results, a recoverable error and reopen.
Source: <read-only component and style paths>, <known revision or unknown>.
Use my existing authorized browser connection. Review source with the bundled
knowledge. Budget 30 minutes; keep artifacts in <private output directory>.
Report reproduced bugs separately from potential source risks; do not fix/file.
```

`plan-only` creates the matrix without page/source execution. `source-only`
performs read-only knowledge review without a browser. `page-only` checks the
authorized page without reading product source. Default `both` attempts both;
an unavailable track is an explicit gap and makes the overall result partial.

## Execution boundaries

Before page execution, the skill reads the internal
[setup contract](https://github.com/kaixun96/dev.A11yAssist/blob/main/docs/SETUP.md) for check/planning. Its actual bundled
path is `modules/a11y-setup/docs/SETUP.md` relative to the plugin root.
It can prepare selected browser/NVDA/audio dependencies only with separate
explicit host-change authorization and ownership. Discovery alone does not
authorize installation. Source-only and plan-only never run host setup scripts.
No extra setup plugin installation is required, and missing optional audio/AT
must not block unrelated browser checks.

The framework itself has no MCP server and needs no `A11Y_ASSIST_CONFIG`.
It uses tools already available to the calling Copilot session. Static review
needs only read-only source access. Live page/AT execution supports the repository's
Windows DevBox deployments and needs actual authorized, qualified connections
and shared-desktop ownership. Installation does not provide them.

Before any live check, identify actual available tools and their scope. A model
must not pretend that a tool described in archived documentation is installed.
Existing independent capture/validation/resource capabilities can be used when
already connected and their real inputs satisfy
[the capability contract](https://github.com/kaixun96/dev.A11yAssist/blob/main/docs/CAPABILITIES.md). They are optional adapters, not
automatic MCP-to-MCP calls or prerequisites for source review. In particular:

- `a11y-capture` accepts a sealed scenario and owned evaluator; it is not a generic
  click/scanner endpoint. Do not invent a Bug, lease or evidence-v1 request.
- `a11y-validate` checks evidence-v1 structure/bytes only when artifacts actually
  use that format. The Bug Bash report is not evidence-v1; do not submit it as
  such, nor treat structural validity as a behavioral verdict.
- Resource status is not acquisition, and stale status is not permission to
  take over a desktop. Apply the caller's real ownership and cleanup rules.
- Missing browser access blocks page rows, not independent source review.
  Missing AT blocks AT rows, not unrelated browser observations. Mark the
  uncovered scope explicitly rather than assuming success or disabling all work.

No generic product runtime adapter is implemented or qualified by this framework.
Connected execution capabilities retain their existing configuration/protocol
requirements; see [providers](https://github.com/kaixun96/dev.A11yAssist/blob/main/docs/PROVIDERS.md). No live feature has been evaluated
merely by installing this package.

### Opt-in disposable fixture qualification

Use this only when explicitly asked to qualify the tooling on an owned Windows
evaluator, not as a substitute for a user's feature. The bundled
`bug-bash/fixture_runner.py` needs the setup module's browser prerequisites:
Python, Playwright and its installed Chromium. It opens one **headed**, isolated
browser, loads only `bug-bash/dialog-form.html` and blocks other page requests.
It never borrows an authenticated profile, files a Bug, installs dependencies or
touches product data. The caller must obtain actual exclusive execution authority
before starting it; setup/recovery ownership is not that authority.

Save this request in a private file:

```json
{
  "schemaVersion": 1,
  "taskId": "my-fixture-qualification",
  "fixture": "dialog-form-v1",
  "repetitions": 2
}
```

From the installed plugin root, with real paths outside the plugin/repository:

```powershell
python -B .\bug-bash\fixture_runner.py --request C:\private\request.json --validate-only
python -B .\bug-bash\fixture_runner.py --request C:\private\request.json --output C:\private\unique-run
```

Request validation never imports Playwright or opens a browser. Execution accepts
only this fixed fixture and 1-3 repetitions, refuses Codespaces/non-Windows hosts,
and refuses an existing `fixture` output directory. An interruption preserves the
original directory and row states: reconcile the original operation and cleanup
before authorizing another run; never delete the marker to replay unknown effects.

`fixture/report.json` accounts for every planned row, observed focus/DOM values,
exact keyboard steps, screenshot/ARIA-snapshot paths and hashes, tool versions
and source hashes. Partial rows remain explicit on errors. The runner closes only
its own browser. A fixture qualification **passed** result means the healthy
controls and deliberately broken variants behaved as expected, not accessibility
conformance or a completed feature Bug Bash. The seeded defects are not product
bugs. Source review, real AT, scanner, contrast and zoom/reflow remain separate
checks/gaps; combine the observations with the normal report template.

This opt-in harness requires a live dedicated-host pilot before claiming runtime
qualification; its packaging and request tests alone provide no such evidence.

## Coverage and evidence

Cross the user's journeys/states with applicable coverage dimensions. Keep row
IDs stable and include expected behavior, capability, reset and actual outcome.
The coverage file is a planning checklist, not executable assertions or a WCAG
rule engine. Derive thresholds and component expectations from the applicable
knowledge and actual product/library contract; do not label every prompt a defect.

Exercise happy paths plus relevant entry/exit, cancellation, repeated use,
loading/empty/error/permission and responsive states. Prefer depth on primary
journeys and high-impact blockers over claiming to have sampled everything.
An expiring time budget yields partial coverage with a prioritized remainder.
Do not silently drop blocked, not-run or inconclusive rows from the denominator.

Only actual runtime observations support `page-reproduced`. Source review can
support `source-supported-risk`, not real AT speech, measurements or deployed
behavior. Unknown implementation is a context question, not a finding.
Record one-off/intermittent observations honestly; do not claim repeatability
unless tested. Scanner candidates need rendered-context confirmation.
Accessibility trees and screenshots cannot substitute for real AT evidence.

Tie evidence to scenarios, fixture, viewport, actual build when known and tool
identity. A source revision that is different from or not linked to the page
cannot establish the page's root cause. Link corroborating tracks only when
that relationship is demonstrated. Deduplicate established shared causes while
retaining all affected targets and scenarios; leave uncertain duplicates linked.

## Delivery and non-goals

Use the report template with separate runtime findings, source risks, coverage
gaps/context questions, evidence index and cleanup state. Severity follows user
impact, not a scanner's label alone. Cite a standard only when justified; an
unmapped criterion is preferable to an invented one. No global conformance PASS.
An empty result means no issues observed in the inspected scope, not that every
possible defect has been ruled out.

Save real reports/evidence privately outside the installed plugin, redact before
approved sharing, and deliver the result to the requester. Restore only settings
changed by this run and clean up only its owned sessions through their original
authority. An unresolved cleanup/unknown effect is reported, not hidden.

This request does not authorize product source edits, builds, dependency
installation, automatic bug filing, PR creation, uploads or remediation. To
fix an accepted finding, start a separately authorized remediation task with
its actual BEFORE/AFTER, source and publication gates; a code risk is not accepted
reproduction evidence. Existing active Bug workflows and workers are unchanged.
