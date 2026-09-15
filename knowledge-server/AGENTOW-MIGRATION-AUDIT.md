# AgentOW Accessibility Knowledge Migration Audit

English | [简体中文](AGENTOW-MIGRATION-AUDIT.zh-CN.md)

Design: [English](TECH-DESIGN.md) | [简体中文](TECH-DESIGN.zh-CN.md)

## 1. Decision and baselines

**Not all AgentOW accessibility knowledge has been migrated into the corresponding standalone KB entries.** Historical preservation passes its mechanical check, but the 32 draft entries contain general guidance and contract worksheets rather than several concrete Fluent/SharePoint contracts present in the source. Similar subject matter is not proof of complete migration or approval.

Audit date: 2026-09-14. Source: [kaixun96/dev.AgentOW at 7896845e51d75b0b9d632a2fd61876bc2f556ea5](https://github.com/kaixun96/dev.AgentOW/tree/7896845e51d75b0b9d632a2fd61876bc2f556ea5), reported as main when inspected; this report uses the immutable commit, not a moving main link. Target content baseline: `a7ac1ce` in dev.A11yAssist. Local KB links below identify the existing destinations; findings describe that baseline, not future edits.

| Evidence set | Count | What it establishes |
| --- | ---: | --- |
| Source tracked files | 171 | Complete pinned-tree inventory |
| Preserved snapshot files | 106 | LF-normalized historical bodies, including relevant non-Markdown references; **not 106 migrated KB entries** |
| External references | 8 | Vendored performance material/generated outputs retained by reference |
| Outside snapshot knowledge scope | 57 | Explicit inventory dispositions, not proof of semantic irrelevance |
| Broad first-party Markdown candidates | 53 paths | Path **or** body marker matches |
| Distinct candidate bodies | 41 | SHA-256 after CRLF → LF normalization; 12 duplicate paths |
| Standalone KB entries | 32, all draft | Common 20 + Fluent 4 + SharePoint 8; no approved migration-completeness claim |

This audit accompanies the bilingual technical design. It does not change KB bodies, descriptors, source status, snapshots, distribution pins, runtime or plugins. The backlog below records work still required; it is not a claim that those contracts were added during this audit.

## 2. Method, reproduction and limits

1. Use the pinned Git tree, not only the accessibility reference directory. Inspect the [source inventory](../integrations/agentow/knowledge/source-inventory.json), which records source URLs, full hashes, dispositions and duplicate relationships.
2. Check preservation with the existing [snapshot checker](../tools/agentow-knowledge-snapshot.mjs). From the repository root, with an authorized source checkout available, the reproducible command is:

   ```text
   node tools/agentow-knowledge-snapshot.mjs <source-checkout> 7896845e51d75b0b9d632a2fd61876bc2f556ea5 --check
   ```

   This audit reran the checker against that commit successfully: `check: true`, `tracked: 171`, `snapshot: 106`, `externalReference: 8`, `outsideKnowledgeScope: 57`. `--check` checks preservation/drift, not KB semantic coverage.
3. For candidate discovery, enumerate **all tracked first-party Markdown** in that tree, excluding the vendored performance subtree identified by the checker. Match either path or whole body against `/a11y|accessib|aria[- ]|screen.?reader|spds|fluent|wcag|nvda|narrator|voice.?access|keyboard|contrast|focus|evaluator/i`. Normalize CRLF to LF before hashing the UTF-8 body. Do not restrict discovery to names containing “accessibility”. Appendix A accounts for all 53 paths and 41 bodies.
4. Compare the substantive clauses in the high-signal references with registered target bodies and exact IDs. Distinguish general concepts from version-specific APIs, lifecycle prerequisites, exceptions, product scope and verification obligations. Retain operational instructions as source/runtime documentation rather than treating them as missing KB prose.
5. Classify each finding: **partial** = useful overlap but missing detail or traceability; **missing concrete contract** = a worksheet exists but not the source's specific contract; **operational** = execution/ownership/evidence contract belongs outside content; **pending external authority** = material must be obtained independently. No row is marked fully covered merely because a generic topic exists.

**Limits:** a keyword scan cannot establish 100% semantic completeness. Unmatched prose, non-Markdown implementation/tests, linked repositories, official documentation, private material and earlier revisions can contain further knowledge. The 53 candidates are a discovery set, not 53 independent requirements. The snapshot's non-Markdown dispositions must be reviewed by purpose; file extension alone is not an exclusion rule. This audit does not prove implementation migration, live provider readiness, AT behavior, conformance, redistribution permission or current validity of historical APIs. No live bug, desktop, provider or browser was exercised.

## 3. Source-to-KB findings and actionable backlog

Priorities indicate proposed content-review order, not accessibility defect severity. P1 addresses concrete contracts most likely to lead to a wrong-layer fix; P2 addresses remaining specificity and review coverage. All destination IDs are existing drafts listed in section 4. Source links below are pinned historical evidence, **not approval of the instructions they contain**.

| Work item / historical source | Finding at target baseline | Existing destination IDs and next action |
| --- | --- | --- |
| B01 · P1 · [Component documentation map and SPDS/Fluent relationship](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L1-L58) | **Partial.** Version/owner worksheets exist; the component-to-document map and specific delegation claims are not migrated. | `fluent.selection.components-and-utilities`, `fluent.v9.component-contract`, `sharepoint.spds.component-contract`: resolve current component documentation and wrapper versions; record scoped delegation rather than assuming every SPDS wrapper inherits all behavior. |
| B02 · P2 · [Cross-cutting checks](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L59-L111) and [remaining checklist/examples][s01] | **Partial.** Semantics, labels, grouping, visual states, forms and custom-widget principles overlap substantially. This does not establish clause-by-clause migration. | `common.topic.component-accessibility`, `common.topic.forms-and-content`, `common.topic.visual-accessibility`, `common.implementation.component-contract`, `common.verification.design`: map retained principles and exceptions to reviewed standards. Do not import repository-specific heading evidence gates or historical blanket contrast wording as universal rules. |
| B03 · P1 · [V9 MessageBar](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L112-L156) | **Missing concrete contract.** Generic no-duplication guidance does not preserve `MessageBar` intent, ancestor `AriaLiveAnnouncer`, or composition prerequisites. | `fluent.v9.component-contract`; relate `sharepoint.spds.component-contract` and `sharepoint.case.duplicate-announcement`. Review installed-version prerequisites, component-owned announcements, wrapper duplication and `MessageBarGroup` composition; add positive/negative cases. |
| B04 · P1 · [V8 MessageBar](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L157-L178) | **Missing concrete contract.** No specific `delayedRender`, built-in announcement or `Announced` distinction in the V8 worksheet. | `fluent.v8.component-contract`: obtain a V8 source, not the registered V9 entrypoint; verify default/override behavior and when additional announcement machinery would duplicate it. |
| B05 · P1 · [Announcement utilities](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L179-L219) | **Missing concrete contract.** Event ownership is present; `useAnnounce`, `useScreenReaderAlert`, repeated-message `indicator`, reading modes and legacy `ScreenReader.alert` distinctions are not. | `fluent.v9.component-contract`, `sharepoint.utilities.announcements-and-focus`, `sharepoint.selection.components-and-utilities`: document one established mechanism per event, provider requirements, repetition and legacy scope after owner/version review. |
| B06 · P1 · [Async collections](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L220-L311) | **Partial.** Common already has a meaningful transition matrix; stack-specific choices, explicit refresh/no-change and complete localized outcomes remain insufficiently mapped. | `common.topic.dynamic-content`, `common.verification.static`, `common.verification.dynamic`, plus both Fluent contract IDs and `sharepoint.utilities.announcements-and-focus`: track visible, programmatic and focus outcomes for each applicable transition; retain repeated-result and no-duplicate cases. Keep source review severities out of universal requirements. |
| B07 · P1 · [Dynamic focus transitions](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L343) | **Partial.** Common includes deletion, toolbar, replacement and async focus lifecycle, but not every concrete lifecycle and exact-operation assertion. | `common.topic.keyboard-focus`, `common.case.dialog-focus`, `common.verification.testing`: add scoped disappearing-action, selection and fallback examples; specify the intended post-update active element rather than treating a generic tab-order test as sufficient. |
| B08 · P1 · [Focus owner selection](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L344-L399) | **Missing concrete contract.** General ownership is present; `useRestoreFocusTarget`/`useRestoreFocusSource`, `A11yManager`, `Focus`, `FocusTransition`, `Keyboard` and migration-shim boundaries are not. | `fluent.v9.component-contract`, `fluent.v8.component-contract`, `sharepoint.utilities.announcements-and-focus`: review trigger/surface pairing, capture/restore timing, mounted fallback, cross-view ownership and unmanaged DOM routes. Do not give one lifecycle two restore owners. |
| B09 · P2 · [Rich-text checks](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L400-L409) | **Missing utility-specific content; partial generic content.** Forms/content guidance does not preserve `checkA11yForRte`, `runH1A11yChecks` or editor scope. | `common.topic.forms-and-content` supplies shared principles; route the product contract from `sharepoint.selection.components-and-utilities` to proposed N01 below. Review editor versus component-authoring boundaries and scanner limitations. |
| B10 · P2 · [Drag/reorder utility](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L410-L413) | **Missing concrete interaction protocol.** Generic keyboard/drag alternatives exist, not the `sp-dragzone` contract. | `common.topic.keyboard-focus` retains cross-product principles; `sharepoint.selection.components-and-utilities` routes to proposed N02. Review begin/move/cancel/complete, handle focus and localized move-state messages. **Do not turn product-specific Enter/Space/arrow behavior into a universal keyboard standard.** |
| B11 · P2 · [Audit tools and utility boundaries](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L414-L424) | **Partial.** Generic test/evidence limits exist; product scanner/helper applicability is not mapped. | `common.verification.static`, `common.verification.dynamic`, `common.verification.testing`, `sharepoint.selection.components-and-utilities`: review `runAccessibilityScanAsync`, `verifyAccessibilityWithSPA11yAssistant` and audit-command scope. Private helpers are not public APIs; a historical lack of a shared visually-hidden helper is not a current fact. Keep execution in operational docs, not executable KB procedures. |
| B12 · P1 · [SPDS fit/import/composition reference][s04] | **Partial / missing concrete contracts.** Table/DataGrid fit (5–23) and compound examples (104–170) are absent; package routes (24–44), private styles and exceptions (55–103) overlap only generically; semantics (171 onward) has shared coverage. | `sharepoint.selection.components-and-utilities`, `sharepoint.spds.component-contract`, `fluent.selection.components-and-utilities`, `common.implementation.component-contract`: review `Table` versus `DataGrid`, stable versus `LazyComponents` exports, supported styling versus `.fui-*`, and action/navigation compound boundaries. Preserve host-specific scope; do not reinstate a blanket SPDS-first rule across products. |
| B13 · P1 · [Theme classification/provider reference][s05] and [Detheme skill][s06] | **Missing concrete contract; partial generic verification.** No actual surface classification, `NeutralThemeProvider`, `NeutralV8ThemeProvider` or hook/provider handling in the host worksheet. | `sharepoint.verification.themes-and-host`, `sharepoint.spds.component-contract`: review chrome/page/content/pane/overlay classification, ancestor coverage, V8 shims, nested providers, tokens and regression states. Provider/flag rollout mechanics remain operational. Product colors are not universal accessibility requirements. |
| B14 · P2 · [Localization][s02] and [shared utility reuse][s03] | **Partial.** Localized/plural messages are mentioned; concrete interval/count, complete-sentence, ReactNode formatter, RTL and safe-rich-text boundaries are not mapped. | `common.topic.forms-and-content`, `common.topic.dynamic-content`, `common.topic.visual-accessibility`, `sharepoint.selection.components-and-utilities`: generalize only cross-product principles; proposed N03 holds reviewed product formatter/resource contracts. Review `StringHelper.formatWithLocalizedCountValue`, `formatToArray`, locale-aware lists and Fluent auto-flip scope rather than importing English plural or RTL assumptions. |
| B15 · P2 · [ReplaceComponent reference][s07] | **Partial knowledge / operational execution.** Generic host checks do not enumerate every migration-specific focus, portal, provider, dismiss and keyboard risk. | `fluent.selection.components-and-utilities`, `sharepoint.verification.themes-and-host`, `common.verification.testing`: add a version-bound verification checklist. Flight/KillSwitch execution, dependency updates, release commands and evidence capture stay in source/runtime documentation. |
| B16 · P2 · [Adjacent review references and misses](#a3-adjacent-or-incidental-matches) | **Partial reusable lessons / otherwise incidental.** A marker in architecture, performance or general agent guidance does not make the whole document accessibility knowledge. | `common.analysis.root-cause`, `common.implementation.component-contract`, `common.verification.static`, `common.verification.design`, `common.verification.testing`: extract only independently useful, sanitized accessibility counterexamples after review; retain generic architecture/bundle and review-process contracts at their source. |

### Proposed new destinations — not created or registered

Prefer extending an existing entry when it has the same scope. The following are optional **proposed NEW paths**, relative to the repository root; none is an existing entry or a working link:

| Proposal | Proposed path | Proposed ID / existing routing entry |
| --- | --- | --- |
| N01 · RTE/content-checker contract | accessibility-kb/packages/sharepoint/utilities/rich-text-accessibility.md | `sharepoint.utilities.rich-text-accessibility`; route from `sharepoint.selection.components-and-utilities` |
| N02 · Product drag/reorder contract | accessibility-kb/packages/sharepoint/utilities/drag-and-drop.md | `sharepoint.utilities.drag-and-drop`; route from `sharepoint.selection.components-and-utilities` |
| N03 · Product localization contract | accessibility-kb/packages/sharepoint/utilities/localization-and-formatting.md | `sharepoint.utilities.localization-and-formatting`; route from `sharepoint.selection.components-and-utilities` |

## 4. Exact existing target index

All entries below are **draft** at the audit baseline. This inventory is a destination map, not 32 claims of completed migration. Descriptors: [Common](../accessibility-kb/packages/common/package.json), [Fluent](../accessibility-kb/packages/fluent/package.json), [SharePoint](../accessibility-kb/packages/sharepoint/package.json).

| Existing ID | Existing body |
| --- | --- |
| `common.overview` | [Common overview](../accessibility-kb/packages/common/README.md) |
| `common.topic.foundations` | [Foundations](../accessibility-kb/packages/common/topics/foundations.md) |
| `common.topic.component-accessibility` | [Component semantics](../accessibility-kb/packages/common/topics/component-accessibility.md) |
| `common.topic.keyboard-focus` | [Keyboard and focus](../accessibility-kb/packages/common/topics/keyboard-focus.md) |
| `common.topic.forms-and-content` | [Forms and content](../accessibility-kb/packages/common/topics/forms-and-content.md) |
| `common.topic.dynamic-content` | [Dynamic content](../accessibility-kb/packages/common/topics/dynamic-content.md) |
| `common.topic.visual-accessibility` | [Visual accessibility](../accessibility-kb/packages/common/topics/visual-accessibility.md) |
| `common.requirements.authority-and-applicability` | [Authority and applicability](../accessibility-kb/packages/common/requirements/authority-and-applicability.md) |
| `common.analysis.root-cause` | [Root cause](../accessibility-kb/packages/common/analysis/root-cause.md) |
| `common.implementation.component-contract` | [Component responsibilities](../accessibility-kb/packages/common/implementation/component-contract.md) |
| `common.verification.static` | [Static verification](../accessibility-kb/packages/common/verification/static.md) |
| `common.verification.dynamic` | [Dynamic verification](../accessibility-kb/packages/common/verification/dynamic.md) |
| `common.verification.design` | [Design verification](../accessibility-kb/packages/common/verification/design.md) |
| `common.verification.testing` | [Testing](../accessibility-kb/packages/common/verification/testing.md) |
| `common.case.dialog-focus` | [Dialog focus case](../accessibility-kb/packages/common/cases/dialog-focus.md) |
| `common.procedure.find` | [Find procedure](../accessibility-kb/packages/common/procedures/find.md) |
| `common.procedure.fix` | [Fix procedure](../accessibility-kb/packages/common/procedures/fix.md) |
| `common.procedure.prevent` | [Prevent procedure](../accessibility-kb/packages/common/procedures/prevent.md) |
| `common.procedure.review-design` | [Review-design procedure](../accessibility-kb/packages/common/procedures/review-design.md) |
| `common.procedure.add-tests` | [Add-tests procedure](../accessibility-kb/packages/common/procedures/add-tests.md) |
| `fluent.overview` | [Fluent overview](../accessibility-kb/packages/fluent/README.md) |
| `fluent.v8.component-contract` | [V8 contract worksheet](../accessibility-kb/packages/fluent/v8/component-contract.md) |
| `fluent.v9.component-contract` | [V9 contract worksheet](../accessibility-kb/packages/fluent/v9/component-contract.md) |
| `fluent.selection.components-and-utilities` | [Fluent selection](../accessibility-kb/packages/fluent/selection/components-and-utilities.md) |
| `sharepoint.overview` | [SharePoint overview](../accessibility-kb/packages/sharepoint/README.md) |
| `sharepoint.selection.components-and-utilities` | [SharePoint selection](../accessibility-kb/packages/sharepoint/selection/components-and-utilities.md) |
| `sharepoint.spds.component-contract` | [SPDS contract worksheet](../accessibility-kb/packages/sharepoint/spds/component-contract.md) |
| `sharepoint.utilities.announcements-and-focus` | [Announcement/focus worksheet](../accessibility-kb/packages/sharepoint/utilities/announcements-and-focus.md) |
| `sharepoint.profile.support-policy` | [Support policy](../accessibility-kb/packages/sharepoint/profiles/support-policy.md) |
| `sharepoint.profile.support-matrix` | [Support matrix](../accessibility-kb/packages/sharepoint/profiles/support-matrix.json) |
| `sharepoint.verification.themes-and-host` | [Theme/host verification](../accessibility-kb/packages/sharepoint/verification/themes-and-host.md) |
| `sharepoint.case.duplicate-announcement` | [Duplicate-announcement case](../accessibility-kb/packages/sharepoint/cases/duplicate-announcement.md) |

The overviews and Common procedures are navigation/reasoning methods, not replacements for historical agent execution. Foundations and authority/applicability frame source interpretation. The support-policy/matrix entries are pending official input, not evidence that AgentOW supplied a complete support inventory. Generic cases are not proof that the concrete historical API cases were migrated.

## 5. Keep operational contracts and authority gaps separate

- Agent instructions, evidence contracts, Windows host testing, PR capture, setup, browser ownership and run/harness lifecycle documents in Appendix A2 remain operational source/runtime documentation. KB procedures may explain how to reason about evidence but cannot acquire leases, launch AT, capture a PR, authorize a fix or imply that a source-only check observed behavior.
- Preserve the original owner/run/affinity and canonical gates in their operative implementation. Historical heading-outline artifacts, review schema fields, severity labels and rollout commands do not become cross-product KB requirements. This audit does not attest to runtime migration completeness.
- Non-Markdown contracts, implementation and tests can substantiate these boundaries or API claims. The 106 preserved files include such references; inspect them when reviewing a claim rather than declaring every non-Markdown file out of scope.
- **Authoritative MAS rules are absent from the audited source.** Obtaining actual rules, clause IDs, versions and authorized access is an independent acquisition gap, not lost migration. `common.requirements.authority-and-applicability` and the design's future MAS integration must not be described as a working connection.
- Official SPDS documents, SharePoint utility contracts and product support statements remain pending independently of the historical AgentOW claims. Fluent's registered documentation entrypoint is review-pending and does not substantiate V8 contracts. A pinned historical claim and a current authoritative contract are different evidence types.
- Before any future content promotion, obtain current documentation and installed-version applicability, confirm owner/reviewer and license/redistribution permission, summarize only permitted material, register accurate source metadata and record review evidence under the [contribution policy](../accessibility-kb/governance/contribution.md). Historical-only sources cannot justify approved entries. Do not copy private source bodies, personal details or run evidence into the KB.

## 6. Closure criteria and validation record

For each B01–B16 item, a future authorized change should record source clause → target ID → scoped summary → retained exception → reviewed version/source → owner/reviewer → positive/negative evaluation. Explain any deliberate exclusion. New entries require descriptor registration, proper layer/dependencies and relations; publishing changes requires the normal build, closure/link/schema and regression checks. Unit/schema success does not establish semantic completeness or observed AT success.

This report was checked against the rerun snapshot check, pinned source inventory, recomputed candidate list/hashes, relevant source bodies, three package descriptors and target contract/topic bodies. Both language editions carry the same 16 backlog items, 3 proposed destinations, 32 existing IDs and 53-path appendix. Documentation regression tests verify this mapping and bilingual consistency; they do not establish semantic equivalence. **Outcome: historical preservation verified; semantic migration incomplete; approval/current authority unresolved.**

## Appendix A. Complete broad-match candidate register

Every link below targets the pinned source commit. Hashes are the first 12 hexadecimal characters of the LF-normalized SHA-256; full values are in the [source inventory](../integrations/agentow/knowledge/source-inventory.json). Two paths in one row have identical complete hashes, not merely similar names. Distinct profile copies are intentionally separate. Categories are audit dispositions, not source-provided tags.

### A1. Domain references and mixed content/implementation guides — 12 paths / 7 bodies

| Candidate source paths (paired paths are duplicates) | SHA-256 prefix | Disposition |
| --- | --- | --- |
| [copilot/skills/ow-review/references/accessibility.md][s01] · [skills/ow-review/references/accessibility.md][d01] | `fc28fa277426` | B01–B11; reusable clauses plus operational review gates |
| [copilot/skills/ow-review/references/localization-and-formatting.md][s02] · [skills/ow-review/references/localization-and-formatting.md][d02] | `985a7cdecb45` | B14; accessibility-relevant localization subset |
| [copilot/skills/ow-review/references/shared-utility-reuse.md][s03] · [skills/ow-review/references/shared-utility-reuse.md][d03] | `d35f47cf7b50` | B14/B16; shared API discovery, not all utilities are accessibility knowledge |
| [copilot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md][s04] · [skills/ow-review/references/sharepoint-design-system-and-ux-components.md][d04] | `0af0f1cfd66c` | B12 |
| [copilot/skills/ow-review/references/sharepoint-theme-and-detheme.md][s05] · [skills/ow-review/references/sharepoint-theme-and-detheme.md][d05] | `d7e3c936a8ae` | B13 |
| [copilot/skills/detheme/SKILL.md][s06] | `54c2bb87d156` | B13; separate content from rollout instructions |
| [copilot/skills/ow-ref-replace-component/SKILL.md][s07] | `d257063eb036` | B15; verification knowledge versus execution |

### A2. Operational, routing and agent documentation — 31 paths / 29 bodies

These candidates remain at their operative source. Reusable evidence reasoning may relate to Common verification/procedures, but that is not migration of the executable workflow.

| Candidate source paths (paired paths are duplicates) | SHA-256 prefix |
| --- | --- |
| [README.md][s08] | `31c95253a927` |
| [copilot/AGENTS.md][s09] | `59b629ae55aa` |
| [copilot/README.md][s10] | `81f13db60299` |
| [copilot/agents/a11y-evaluator.agent.md][s11] | `5f0d3f3a4820` |
| [copilot/agents/context-maintainer.agent.md][s12] | `05fd93bbc073` |
| [copilot/agents/evaluator.agent.md][s13] | `fd5effd8bcf8` |
| [copilot/agents/planner.agent.md][s14] | `7bde422eb2f7` |
| [copilot/agents/reviewer.agent.md][s15] | `88b128d5fad1` |
| [copilot/docs/a11y/README.md][s16] | `7777a5691a22` |
| [copilot/docs/a11y/evidence-contract.md][s17] | `66b2954c46b3` |
| [copilot/docs/a11y/pr-evidence-capture-guide.md][s18] | `5f174cd802c7` |
| [copilot/docs/a11y/shared-capabilities.md][s19] | `35e3240c09f4` |
| [copilot/docs/a11y/windows-host-testing.md][s20] | `e3fa18eded6d` |
| [copilot/docs/review-contract.md][s21] · [docs/review-contract.md][d21] | `23a8a9c71b86` |
| [copilot/docs/run-insights.md][s22] · [docs/run-insights.md][d22] | `c77864b2e28a` |
| [copilot/docs/sp-client-review-profile.md][s23] | `868688fc1da3` |
| [copilot/skills/agentow-a11y/SKILL.md][s24] | `7aa6a9c5764e` |
| [copilot/skills/agentow/SKILL.md][s25] | `90187da56ae4` |
| [copilot/skills/ow-a11y-host-setup/SKILL.md][s26] | `cc70863efb0f` |
| [copilot/skills/ow-batch/SKILL.md][s27] | `a6405cfbaa6e` |
| [copilot/skills/ow-context-feedback/SKILL.md][s28] | `6b60a9726e47` |
| [copilot/skills/ow-review/SKILL.md][s29] | `f872c25d6ed7` |
| [docs/USING-AGENTOW.md][s30] | `5bcde5d3dfbb` |
| [docs/USING-AGENTOW.zh-CN.md][s31] | `2e6527654a4d` |
| [docs/context-maintenance.md][s32] | `de35fce3bc06` |
| [docs/harness-contract.md][s33] | `83d21d1c6dfd` |
| [docs/personal-evaluator-browser.md][s34] | `0ef63476940b` |
| [docs/run-lifecycle.md][s35] | `89b38d2b4e78` |
| [docs/sp-client-review-profile.md][s36] | `7f628006e770` |

### A3. Adjacent or incidental matches

**10 paths / 5 bodies.** These general review, architecture and performance documents match broad markers; only their accessibility-relevant lessons are candidates for B16. They are not five standalone accessibility contracts or automatically fully out of scope.

| Candidate source paths (paired paths are duplicates) | SHA-256 prefix |
| --- | --- |
| [copilot/docs/review-misses.md][s37] · [docs/review-misses.md][d37] | `e4699dee6eb6` |
| [copilot/skills/ow-review/references/common-review-issues.md][s38] · [skills/ow-review/references/common-review-issues.md][d38] | `491e300af90c` |
| [copilot/skills/ow-review/references/graduation.md][s39] · [skills/ow-review/references/graduation.md][d39] | `157d9f2a72e4` |
| [copilot/skills/ow-review/references/size-regression.md][s40] · [skills/ow-review/references/size-regression.md][d40] | `f84813cd5ee0` |
| [copilot/skills/ow-review/references/ux-architecture-and-bundle-boundaries.md][s41] · [skills/ow-review/references/ux-architecture-and-bundle-boundaries.md][d41] | `243a5adfee68` |

Reconciliation: **12 + 31 + 10 = 53 paths; 7 + 29 + 5 = 41 bodies; 5 + 2 + 5 = 12 duplicate paths.**

[s01]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md
[d01]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/accessibility.md
[s02]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md
[d02]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/localization-and-formatting.md
[s03]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/shared-utility-reuse.md
[d03]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/shared-utility-reuse.md
[s04]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md
[d04]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/sharepoint-design-system-and-ux-components.md
[s05]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-theme-and-detheme.md
[d05]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/sharepoint-theme-and-detheme.md
[s06]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/detheme/SKILL.md
[s07]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-ref-replace-component/SKILL.md
[s08]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/README.md
[s09]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/AGENTS.md
[s10]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/README.md
[s11]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/a11y-evaluator.agent.md
[s12]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/context-maintainer.agent.md
[s13]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/evaluator.agent.md
[s14]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/planner.agent.md
[s15]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/agents/reviewer.agent.md
[s16]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/README.md
[s17]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/evidence-contract.md
[s18]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/pr-evidence-capture-guide.md
[s19]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/shared-capabilities.md
[s20]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/a11y/windows-host-testing.md
[s21]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/review-contract.md
[d21]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/review-contract.md
[s22]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/run-insights.md
[d22]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/run-insights.md
[s23]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/sp-client-review-profile.md
[s24]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/agentow-a11y/SKILL.md
[s25]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/agentow/SKILL.md
[s26]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-a11y-host-setup/SKILL.md
[s27]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-batch/SKILL.md
[s28]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-context-feedback/SKILL.md
[s29]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/SKILL.md
[s30]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/USING-AGENTOW.md
[s31]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/USING-AGENTOW.zh-CN.md
[s32]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/context-maintenance.md
[s33]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/harness-contract.md
[s34]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/personal-evaluator-browser.md
[s35]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/run-lifecycle.md
[s36]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/sp-client-review-profile.md
[s37]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/review-misses.md
[d37]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/docs/review-misses.md
[s38]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/common-review-issues.md
[d38]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/common-review-issues.md
[s39]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/graduation.md
[d39]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/graduation.md
[s40]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/size-regression.md
[d40]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/size-regression.md
[s41]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/ux-architecture-and-bundle-boundaries.md
[d41]: https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/skills/ow-review/references/ux-architecture-and-bundle-boundaries.md