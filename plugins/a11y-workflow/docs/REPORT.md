# Aggregate accessibility report

Install `a11y-report@a11y-assist`, select the original private discovery config
with `A11Y_ASSIST_CONFIG`, then restart Copilot. Ask `/a11y-report generate the
final report for <task>; include actual Bug links and all uncovered steps`.

`a11y_report_generate({taskId})` calls the same generator as Bug Bash's `report`
command. It verifies original records, refuses pending capture or filing, and
writes an immutable private Markdown report and digest. No page execution,
Bug creation or automatic publication occurs.

The report contains distinct observed issue counts/categories, detailed findings,
actual filed Bug URLs or unfiled/failed statuses, source-supported risks, seeded
fixture defects, full target/category/step coverage, evidence index, unresolved
gaps, cleanup and resume state. Repeated observations do not inflate issue count.
Unavailable tools/time/evidence remain partial; a finished report is not WCAG
certification. Default discovery does not authorize filing.

After cleanup, `a11y_report_deliver({taskId})` uses the original trusted delivery
connection. Provider-free source/plan runs retain verified local file delivery
with `messageSent:false`. New Bug-filing outcomes invalidate an older report:
generate again before delivery. Unknown delivery retains its original operation
ID and must be reconciled, not submitted to another destination.
Filing submission, continuation, reconciliation and the final delivery gate use
the same task lock. Report freshness is rechecked while recording delivery intent,
not in an earlier unlocked read. A provider's finished nonpass outcome remains
reportable using its original request's task identity; it does not need a passing
receipt or a fabricated Bug URL. Proven-unstarted abandonment is reported, not hidden.

The report plugin is independently callable; Bug Bash's bounded orchestration
reuses its shared implementation without an implicit MCP-to-MCP call. Category
accounting calls the explicitly configured, separately installed
`a11y-test-categories` plugin API, never bundled copies.
