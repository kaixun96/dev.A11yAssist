---
name: a11y-test-categories
description: Plan and account for all ten accessibility test categories, step by step, for every in-scope target and reachable state. Execute applicable procedures only with authorized caller tools; preserve evidence and explicit gaps. No sampling-based completion.
---

Resolve paths from the plugin root, two directories above this SKILL.md.
When bundled, use the internal module as that root.
Read `docs/TEST-CATEGORIES.md` and `procedures/README.md`, then all ten procedures.
This is a reusable test-procedure plugin, not a browser/AT provider or a new agent.

## Input and inventory

Take the authorized feature scope, journeys, expected behavior, safe fixture,
route/build/flags, budget, tools and private output location from the caller.
Inventory every region, control and meaningful content element in every reachable
in-scope state, including loading, errors, disabled, expanded and responsive
variants that exist. Give each target/state a stable ID and an unambiguous target,
scenario and state description. Include page-level targets for global checks.
Do not silently sample controls or drop later-discovered targets.
Record explicit scope exclusions, inventory uncertainty and unvisited states.
Source-only does not execute page procedures; plan-only produces planned rows.

## Complete matrix

Use `tools/matrix.mjs` to create a private matrix from the caller's inventory.
For every target/state, retain every numbered step of all ten categories.
The tool fills all rows with `planned`; it does not decide applicability.
Read each procedure's full text, including its final evidence/cleanup paragraph,
not just the generated step labels. Supply preconditions, exact actions, expected
behavior, required capability and reset in the caller's scenario plan.

Walk every category's steps in order for each target/state. Execute every
applicable check with actual authorized browser/AT tools. Global or traversal
evidence may be linked to several rows only if it explicitly covers every named
target/state/check. Never copy a pass from one representative control to others.
Start real AT/capture before triggering announcements when the scenario requires
it. Keep shared-desktop actions serial; follow ownership and safety gates.

Record actual output and evidence references for `observed-no-issue` or `finding`.
Record a target-and-step-specific reason for `not-applicable`. Lack of a tool,
time, permission, fixture or evidence is never non-applicability: use `blocked`,
`not-run` or `inconclusive`. A planned row is not execution.
Follow the procedures' genuine AT requirements; DOM/AX/scanners cannot establish
screen-reader speech. Do not bypass consent or perform unauthorized submissions.

## Return and completion

Before returning, run the local matrix check against the original inventory and
current procedure set. Missing, duplicate, foreign or changed rows fail validation.
Update the inventory when new in-scope targets/states are discovered; regenerate
a separate expanded matrix and carry forward only unchanged, evidence-bound rows.
Never shrink the accepted inventory to make a report complete.

Return the inventory, full step matrix, structural summary, evidence references,
findings and precise gaps to the caller. No applicable pending/blocked/unrun/
inconclusive row may be called complete. Budget exhaustion means partial, not a
reduced denominator. Unknown inventory completeness also means partial.
The local checker validates accounting only, not evidence authenticity, AT
behavior, correctness of non-applicability, WCAG conformance or resource cleanup.
The caller must assess those separately before completing the round.
No host setup, source edits, filing, publication or automatic resource acquisition.
