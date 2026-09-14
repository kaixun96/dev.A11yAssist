# Accessibility test categories

## Review every category for every target/state

Resolve this folder from the standalone or bundled module root. Read all ten
documents before exercising the page. For every in-scope target in each reachable
state, account for every numbered step in every category. Execute all applicable
steps in order; record a target-specific reason for every not-applicable step.
These categories map to Bug Bash's `bug-bash/coverage.json` dimensions below;
standalone use does not require Bug Bash. They are not automatic findings.
Evidence may support several rows only when it actually covers each named target,
state and step; never infer untested coverage from a representative control.

| Category | Coverage dimensions | Procedure |
|---|---|---|
| Keyboard and focus | `keyboard`, `focus` | [keyboard-focus.md](keyboard-focus.md) |
| Screen reader | `screen-reader` | [screen-reader.md](screen-reader.md) |
| Structure and semantics | `semantics`, `content-motion` | [structure-semantics.md](structure-semantics.md) |
| Orientation and input purpose | `reflow`, `forms`, `pointer-alternatives` | [orientation-input-purpose.md](orientation-input-purpose.md) |
| Visual, color, zoom and reflow | `visual`, `reflow`, `focus` | [visual-color.md](visual-color.md) |
| Timing and motion | `content-motion`, `dynamic` | [timing-motion.md](timing-motion.md) |
| Dynamic content | `dynamic`, `focus`, `screen-reader` | [dynamic-content.md](dynamic-content.md) |
| Touch and pointer | `pointer-alternatives` | [touch-pointer.md](touch-pointer.md) |
| Voice Access | `pointer-alternatives`, `forms`, `focus`, `dynamic` | [voice-access.md](voice-access.md) |
| Authentication and forms | `forms`, `focus`, `screen-reader` | [authentication-forms.md](authentication-forms.md) |

These procedures supplement, rather than exhaust, the coverage prompts. For
example, media alternatives and document language still need feature-specific
checks when applicable. Derive normative thresholds, exceptions and component
expectations from the applicable standard and actual product/library contract.
Use `voice-access.md` for real voice-control steps; the short note in
`touch-pointer.md` is not a complete Voice Access procedure. Keep voice-control
results separate from screen-reader speech and pointer-only observations.

## Apply the Bug Bash execution boundaries

- The calling workflow still owns scope, authorization, evidence and
  reporting. These documents do not authorize setup, installs, product edits,
  filing or publication. Use only existing authorized Windows DevBox tools and
  owned resources. Source-only and plan-only never execute these page procedures.
- Inventory every in-scope region, control, meaningful content element and
  reachable state. Do not replace full target coverage with representative
  sampling. Safe fixtures may bound data volume, but every target in that fixture
  remains in the matrix. Stay within the agreed feature and budget.
  Actions performed solely to restore test data are cleanup, not extra AT coverage.
- Shared browser contexts, fixtures, OS focus, clipboard, audio or AT require
  serial execution. Real AT always runs serially; never run NVDA and Narrator
  together or operate a desktop owned by another worker.
- A static inventory alone is not an executed page check. DOM/AX/ARIA/scanner
  evidence belongs to browser semantics, not the screen-reader category, and
  cannot prove speech, Voice Access or OS focus behavior.
- Preserve the actual actions, tool identity, output and private evidence.
  A missing capability or required artifact leaves the affected row blocked or
  inconclusive; continue independent supported checks. Never fabricate receipts.
- The imported terms `PASS`, `NOT_TESTED` and `serial-real-at` describe upstream
  expectations, not new Bug Bash result enums or an installed execution backend.
  Use the existing coverage row statuses: `planned`, `observed-no-issue`,
  `finding`, `blocked`, `not-run`, `not-applicable` or `inconclusive`.
  An unexecuted AT check is not a pass, and a completed category does not establish
  WCAG conformance.

## References

The original nine procedure bodies are copied without content changes from
[dev.AgentOW PR #84](https://github.com/kaixun96/dev.AgentOW/pull/84), pinned to
commit `7233b63c416c17c2c362d31aaf6f3c92abd1fb20`, under
[`copilot/skills/agentow-a11y-explore-test/references/test-procedures/`](https://github.com/kaixun96/dev.AgentOW/tree/7233b63c416c17c2c362d31aaf6f3c92abd1fb20/copilot/skills/agentow-a11y-explore-test/references/test-procedures).
This imports procedures, not AgentOW's agents, execution/result schemas, report
tools, setup scripts or an automatic WCAG verdict engine.
The additional [Voice Access procedure](voice-access.md) is authored in
A11yAssist; it is not part of that upstream snapshot.
Where a procedure refers to a sample, apply it to every in-scope target to which
that step applies. This index and the category skill define full coverage.
