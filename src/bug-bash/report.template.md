# Feature accessibility bug bash

Template only: replace placeholders with observations. Empty sections are not
success, execution receipts or evidence. Save outside the installed package.

## Scope and outcome

- Feature, user goal, modes/tracks requested and exclusions:
- Outcome: complete / partial / blocked / plan-only:
- Date, operator, package version and private artifact location:
- Tested URL, build, flags, fixture, permissions, viewport/zoom, browser/OS/AT:
- Source scope/revision and relationship to tested build:
- Counts: page-reproduced findings / source-supported risks / context questions:
- Coverage: executed applicable rows / total applicable rows; separately list
  blocked, not-run, inconclusive, planned and not-applicable rows:
- Time spent, budget limit, incomplete scope and next action:

Complete means this bounded discovery round is accounted for, not WCAG conformance.
Source-only/page-only results never imply coverage of the omitted track.

## Coverage matrix

| Row ID | Scenario/state and dimension | Track/tool | Expected check | Status | Evidence or gap reason | Finding IDs |
|---|---|---|---|---|---|---|
| <S01-keyboard-page> | <journey/state> | <page/source; actual tool> | <specific expectation> | <coverage.json status> | <evidence ID or reason> | <IDs or none> |

Keep each planned row. Explain every not-applicable decision against the feature.
`observed-no-issue` is limited to that check, not a global accessibility PASS.

## Page-reproduced findings

### <F01: concise behavior and user impact>

- Severity and rationale; confidence; affected users:
- Scenario/row IDs, route/build and exact target:
- Preconditions, exact steps and repeatability (including safe reset):
- Expected versus actually observed behavior:
- Evidence IDs, actual tool/AT and timestamps:
- Justified standard/criterion or knowledge topic (unmapped if uncertain):
- Source link if actually established; source/build binding or its uncertainty:
- Suggested correction and affected variants (no code change made):
- Duplicate/related finding IDs and reason:

## Source-supported risks (runtime not verified)

### <R01: source-supported potential problem>

- Severity/impact rationale and confidence:
- Exact reviewed revision, file/symbol/line range or supplied snippet:
- Actual code path, library/version contract and supporting knowledge topic:
- Why the source supports the risk; unknown parents/host behavior:
- Runtime trigger to confirm; related page row or why it was not run:
- Suggested correction (no code change made):
- Related findings; do not claim a deployed root cause with unknown build binding:

## Context questions and uncovered checks

| Row/question | Missing context/capability or contradictory evidence | Why it matters | Next safe action |
|---|---|---|---|
| <ID> | <precise gap, not an invented defect> | <impact on conclusion> | <action/owner> |

## Evidence index

| Evidence ID | Actual private path/reference | Timestamp | Scenario/build/tool binding | Hash if available | Limits/redaction |
|---|---|---|---|---|---|
| <E01> | <existing artifact only> | <actual time> | <binding> | <hash or unavailable> | <what it does not prove> |

## Cleanup and resume

- Owned sessions/resources and original opaque operation IDs (no secrets):
- Restored test settings and cleanup/release outcome:
- Uncertain/pending effects (observe/reconcile only; no replay):
- Exact next action, resume condition and remaining rows if incomplete:
- Report delivered to the requester; no automatic ticket/PR/public upload:
