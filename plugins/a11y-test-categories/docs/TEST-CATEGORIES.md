# Accessibility test categories

**English** | [简体中文](TEST-CATEGORIES.zh-CN.md)

`a11y-test-categories` is an independently installable procedure plugin. It defines
what to check, the ordered steps and required evidence for each target/state.
It includes ten categories: keyboard/focus, screen reader, structure/semantics,
orientation/input purpose, visual/color, timing/motion, dynamic content,
touch/pointer, authentication/forms, and Voice Access.
For MAS/WCAG text, exceptions and mappings, use the optional authenticated
[Liquid MCP lookup](LIQUID-STANDARDS.md). A retrieved rule is not execution
evidence, and unavailable official sources remain explicit gaps.

## Composition

Only this plugin distributes its skill, procedures and accounting tools. Install
it separately for Bug Bash and configure `pluginRoots.testCategories` to the
actual absolute installation root. Bug Bash calls its versioned `tools/matrix.mjs`
API (`apiVersion:1`, loadProcedures/createMatrix/checkMatrix), pins its version,
tool content and procedures, and fails explicitly if unavailable or changed.
There are no consumer-side copies or implicit fallback. `/a11y-test-categories`
remains independently usable. No browser/AT backend, MCP server or agent is added.

The caller inventories targets and states; this plugin expands all ten categories
and every numbered step for each target/state. Authorized browser tools perform
page interactions; real AT/capture tools supply actual AT evidence. The caller
assesses findings and delivers its report. This plugin prevents missing matrix
rows from looking like full coverage; it does not judge WCAG automatically.

## Use and inputs

```powershell
copilot plugin install a11y-test-categories@a11y-assist
```

Register the `kaixun96/dev.A11yAssist` marketplace first if needed, then restart
Copilot after installation.

```text
/a11y-test-categories Check every target and reachable state of <feature>
on <authorized URL and safe fixture>. Use <existing authorized tools>.
Apply every step of all ten categories. Save to <private directory>.
Budget <duration>; retain anything unfinished as a gap. Do not fix or file.
```

Inputs are scope, target/state inventory, journeys, expected behavior, environment,
safe data, existing tools, ownership, budget and private output directory.
Inventory each region, control and meaningful content element, plus page-level
targets for global checks. Include every in-scope element of the agreed fixture;
representative sampling is not full coverage. New targets/states expand the
inventory and matrix. Unknown inventory completeness makes the result partial.

Each target/state gets every numbered step in all ten categories. Execute
applicable steps in order. A non-applicable step needs a concrete target-specific
reason. Missing AT/time/permission is a gap, never non-applicability.
An existing artifact may cover multiple rows only if it actually demonstrates
each target/state/step; global checks need not be physically repeated solely to
inflate counts. Read the full procedures, including evidence and cleanup text.
Additional feature-specific checks remain necessary; these categories are not an
exhaustive accessibility standard.

## Outputs

Return a private inventory, step-level matrix, evidence references, findings and
gaps, with total/executed/pending counts and a breakdown by category. Finding
counts are deduplicated defects, not the number of affected step rows.
The final summary should lead with total issues and their categories; keep the
detailed coverage/evidence in the report rather than a decorative dashboard.

`observed-no-issue` and `finding` require actual supporting evidence.
`not-applicable` requires justification. `planned`, `blocked`, `not-run` and
`inconclusive` remain visible and prevent complete page coverage.
Plan-only never executes; source-only never executes page procedures.
No clean matrix establishes WCAG conformance, genuine AT behavior or cleanup.

## Local matrix contract

Node.js 22+ is required for the bundled accounting tool. It reads/writes only the
named local JSON files; it never opens a page or starts AT. Keep output outside
the installation and public repositories. Example inventory shape:

```json
{
  "schemaVersion": 1,
  "scope": "Item picker in the agreed safe fixture",
  "inventoryComplete": false,
  "inventoryEvidence": "Inventory still provisional; empty state not visited",
  "targets": [
    {
      "id": "picker-open-cancel",
      "target": "Cancel button in item picker",
      "scenario": "Open picker and cancel",
      "state": "Dialog open, populated"
    }
  ]
}
```

From the standalone or bundled module root:

```powershell
node .\tools\matrix.mjs create <private-inventory.json> <new-private-matrix.json>
node .\tools\matrix.mjs check <private-inventory.json> <private-matrix.json>
```

`create` refuses to overwrite an existing matrix. Fill each generated row's
`status`, `evidence` (nonempty artifact IDs/references) and `reason` without
changing its identity or instruction. Keep the original inventory and procedure
version; changes require explicit reconciliation, never silent replacement.

`check` returns counts and `accountingComplete`, with exit 0 for complete
accounting, 2 for valid but incomplete accounting and 1 for invalid input.
It rejects missing/duplicate/foreign rows, changed instructions, version drift,
unsupported statuses, conclusive rows without evidence references and unjustified
nonexecuted rows. The caller must separately verify inventory completeness,
non-applicability, evidence existence/authenticity, actual results and cleanup.
This is a local accounting gate, not a live execution backend or a tamper-proof
evidence validator.

## References

- [Procedure index and pinned upstream provenance](../procedures/README.md)
  (installed package path; repository source is `src/test-categories/procedures/`).
