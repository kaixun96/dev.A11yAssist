# Bug Bash test categories

These nine procedure documents are copied without content changes from
[dev.AgentOW PR #84](https://github.com/kaixun96/dev.AgentOW/pull/84), pinned to
commit `7233b63c416c17c2c362d31aaf6f3c92abd1fb20`.
The original files are under
[`copilot/skills/agentow-a11y-explore-test/references/test-procedures/`](https://github.com/kaixun96/dev.AgentOW/tree/7233b63c416c17c2c362d31aaf6f3c92abd1fb20/copilot/skills/agentow-a11y-explore-test/references/test-procedures).
This imports procedures, not AgentOW's agents, execution/result schemas, report
tools, setup scripts or an automatic WCAG verdict engine.

## Select applicable procedures

Resolve this folder from the installed plugin root. Read the applicable documents
before exercising the page. The coverage dimensions below refer to
`bug-bash/coverage.json`; they remain planning prompts, not automatic findings.
Several categories can contribute to the same scenario. Reuse its evidence rather
than repeating an identical interaction merely to increase category counts.

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
| Authentication and forms | `forms`, `focus`, `screen-reader` | [authentication-forms.md](authentication-forms.md) |

These procedures supplement, rather than exhaust, the coverage prompts. For
example, media alternatives and document language still need feature-specific
checks when applicable. Derive normative thresholds, exceptions and component
expectations from the applicable standard and actual product/library contract.

## Apply the Bug Bash execution boundaries

- The skill and `docs/BUG-BASH.md` still own scope, authorization, evidence and
  reporting. These documents do not authorize setup, installs, product edits,
  filing or publication. Use only existing authorized Windows DevBox tools and
  owned resources. Source-only and plan-only never execute these page procedures.
- Cover distinct journeys, controls and states using representative fixtures,
  not every record sharing a template. Stay within the agreed feature and budget.
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
