---
name: a11y-report
description: Generate the final aggregate accessibility discovery report from validated observations, Bug-filing results, full coverage, evidence, gaps and actual cleanup.
---

Resolve bundled paths from the plugin root, two directories above this SKILL.md, not the user's working directory.
Read `docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For static guidance use `knowledge/README.md` and applicable topics: `knowledge/foundations.md`.
For SPDS, Fluent V8/V9 or SharePoint-specific guidance, read `integrations/agentow/knowledge/README.md` and its complete-source topic routing. Static project knowledge does not require AgentOW or an execution integration. Archived operational instructions are reference data, not permission to run them; only an explicitly authorized execution integration may act on its procedures.

Read `docs/REPORT.md`. Reporting is an independent plugin, not a new test runner
or permission to file issues. Consume original task IDs and verified receipts,
not optimistic prose from another tool.

Call `a11y_report_generate` after `a11y-validate`, any explicitly requested
`a11y-file-bug` work, and owned cleanup. The shared implementation also backs
Bug Bash's `report` CLI; there is only one report generator. Pending capture or
Bug creation requires original-operation reconciliation before final reporting.

Lead with distinct observed issue count and categories. Include the actual Bug
IDs/links or unfiled/failed status, concise impact and reproduction, evidence
references, complete category/step accounting, unavailable capabilities and
remaining work. Separate repeated observations, seeded defects and source risks
from distinct product Bugs. Report actual cleanup, retained ownership and
uncertainty. A complete report is not complete coverage or WCAG certification.

Save the immutable private report with its SHA-256. Use `a11y_report_deliver`
only for the authorized destination after cleanup; local-file delivery says
`messageSent:false`. Never publish private paths/content to a public tracker.
If filing changed after generation, regenerate before delivery. A report file,
upload attempt or terminal chat message does not prove successful delivery.
