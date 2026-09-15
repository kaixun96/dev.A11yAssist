# AgentOW Accessibility Knowledge Migration Audit

English | [简体中文](AGENTOW-MIGRATION-AUDIT.zh-CN.md)

Design: [English](TECH-DESIGN.md) | [简体中文](TECH-DESIGN.zh-CN.md)

## 1. Decision and baselines

**Migration of the audited reusable accessibility rules is complete in the authored Common, Fluent and SharePoint packages.** B01–B16 below map source clauses to implemented guidance, concrete API/ownership contracts, exceptions and verification examples. N01–N03 are registered entries, not proposals.

Coverage update: 2026-09-15; source inventory audited 2026-09-14. Source: [kaixun96/dev.AgentOW at 7896845e51d75b0b9d632a2fd61876bc2f556ea5](https://github.com/kaixun96/dev.AgentOW/tree/7896845e51d75b0b9d632a2fd61876bc2f556ea5). Target: current authored packages, each version `0.1.2`, with exact coordinated dependencies. The rule migration was delivered in `0.1.1`; `0.1.2` adds discovery metadata without changing that coverage. The local links identify the implemented bodies; generated references independently identify the snapshot a consumer reads.

| Evidence set | Count | What it establishes |
| --- | ---: | --- |
| Source tracked files | 171 | Complete pinned-tree inventory |
| Preserved snapshot files | 106 | LF-normalized historical bodies, including relevant non-Markdown references; **not 106 migrated KB entries** |
| External references | 8 | Vendored performance material/generated outputs retained by reference |
| Outside snapshot knowledge scope | 57 | Explicit inventory dispositions, not proof of semantic irrelevance |
| Broad first-party Markdown candidates | 53 paths | Path **or** body marker matches |
| Distinct candidate bodies | 41 | SHA-256 after CRLF → LF normalization; 12 duplicate paths |
| Standalone KB entries | 35, all draft | Common 20 + Fluent 4 + SharePoint 11; exact target index in section 4 |

**Provenance versus approval:** descriptors bind migrated clauses to pinned `historical-reference` / `historical` sources. All entries remain draft with unassigned owners; migration does not establish official approval, current installed-version validity, redistribution clearance or observed conformance. Those reviews follow the [contribution policy](../accessibility-kb/governance/contribution.md). The completion claim covers the audited reusable rules, not every repository word, executable or linked external source.

## 2. Method, reproduction and limits

1. Use the pinned Git tree, not only the accessibility reference directory. Inspect the [source inventory](../integrations/agentow/knowledge/source-inventory.json), which records source URLs, full hashes, dispositions and duplicate relationships.
2. Check preservation with the existing [snapshot checker](../tools/agentow-knowledge-snapshot.mjs). From the repository root, with an authorized source checkout available, the reproducible command is:

   ```text
   node tools/agentow-knowledge-snapshot.mjs <source-checkout> 7896845e51d75b0b9d632a2fd61876bc2f556ea5 --check
   ```

   Rerun successfully on 2026-09-15: `check: true`, `tracked: 171`, `snapshot: 106`, `externalReference: 8`, `outsideKnowledgeScope: 57`. `--check` checks preservation/drift; the clause mapping below records KB coverage.
3. For candidate discovery, enumerate **all tracked first-party Markdown** in that tree, excluding the vendored performance subtree identified by the checker. Match either path or whole body against `/a11y|accessib|aria[- ]|screen.?reader|spds|fluent|wcag|nvda|narrator|voice.?access|keyboard|contrast|focus|evaluator/i`. Normalize CRLF to LF before hashing the UTF-8 body. Do not restrict discovery to names containing “accessibility”. Appendix A accounts for all 53 paths and 41 bodies.
4. Compare the substantive clauses in the high-signal references with registered target bodies and exact IDs. Distinguish general concepts from version-specific APIs, lifecycle prerequisites, exceptions, product scope and verification obligations. Retain operational instructions as source/runtime documentation rather than treating them as missing KB prose.
5. Record the implemented rule, its owning target ID and retained exception. Cross-product outcomes live in Common, framework APIs in Fluent, and host contracts in SharePoint. Operational instructions remain outside KB content; official source acquisition is separate from historical migration.

The 53 candidates are a discovery set, not 53 independent requirements. Appendix A retains their exact path/hash accounting, including duplicates and operational/adjacent dispositions. Assess non-Markdown material by purpose when it supports a claim; the scope is not expanded to uninspected revisions or linked repositories.

## 3. Source-to-KB implemented coverage

B01–B16 retain their audit identifiers so contributors can trace the original findings. All destination IDs resolve through section 4. “Implemented” here means usable knowledge content, not execution of the described UI behavior.

| Audit item / historical source | Implemented clauses and retained exceptions | Owning target IDs |
| --- | --- | --- |
| B01 · [Component documentation map and SPDS/Fluent relationship](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L1-L58) | Component-to-document map covers labels, named controls, MessageBar, focus, notifications and truncation. SPDS delegates to its confirmed V9 owner except an explicit behavioral override; inspect wrapper props and composition. | `fluent.selection.components-and-utilities`, `fluent.v9.component-contract`, `sharepoint.spds.component-contract` |
| B02 · [Cross-cutting checks](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L59-L111) and [review trigger/checklist/examples][s01] | Added/changed rendered UI and accessibility-relevant styling trigger review; not-applicable needs a diff-based no-impact explanation, and runtime-dependent criteria remain unverified without evidence. Historical scope is applicable WCAG 2.1 A/AA plus complete keyboard/screen-reader operation. Rendered semantics, labels/groups, headings/tables, forms/images/custom controls and visual/reflow/target checks retain contrast/2D-content exceptions. Heading-level changes require the complete live page/dialog outline before and after, target/parent/siblings and rationale; missing context defers the decision. No universal single-H1 or disabled-contrast rule. | `common.topic.component-accessibility`, `common.topic.forms-and-content`, `common.topic.visual-accessibility`, `common.implementation.component-contract`, `common.verification.design` |
| B03 · [V9 MessageBar](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L112-L156) | Intent with one application ancestor `AriaLiveAnnouncer`; no duplicate role/live region/manual announcer. Owner-confirmed exception for politeness overrides; `MessageBar` remains a direct child of `MessageBarGroup`. Root/retry examples distinguish missing prerequisite from duplication. | `fluent.v9.component-contract`, `sharepoint.spds.component-contract`, `sharepoint.case.duplicate-announcement` |
| B04 · [V8 MessageBar](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L157-L178) | Default `delayedRender` inserts content into an internal live region; error/blocked/severeWarning use alert behavior. No extra `Announced` for that message. Inspect `delayedRender={false}`, role, shim and portal overrides rather than assuming silence or importing V9 prerequisites. | `fluent.v8.component-contract`, `sharepoint.case.duplicate-announcement` |
| B05 · [Announcement utilities](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L179-L219) | Provider-backed `useAnnounce` or established `useScreenReaderAlert`/`ScreenReaderAlert.read`, one mechanism per event. `ReadAfterOtherContent` for routine results, `ReadImmediately` for urgent errors; component `indicator` supports repeated text. Legacy `ScreenReader.alert(id, message)` is assertive; typing helper is not generic status. | `fluent.v9.component-contract`, `sharepoint.utilities.announcements-and-focus`, `sharepoint.selection.components-and-utilities` |
| B06 · [Async collections](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L220-L312) | Visible/programmatic/focus matrices cover loading, count, empty, error/retry, append/end, sort/filter/search/group/page/replacement, refresh updated/no-change, selection and background completion. Complete localized outcomes and repeated events; a spinner/busy flag or earlier error bar does not cover completion. V8/V9/host mechanisms are bound separately. Historical Important covers missing perceivable outcomes; Minor only improves wording/redundancy when the transition is already perceivable. Changed rows do not excuse missing programmatic feedback; supplied evidence must distinguish visible, delivered speech and focus outcomes. | `common.topic.dynamic-content`, `common.verification.static`, `common.verification.dynamic`, `fluent.v8.component-contract`, `fluent.v9.component-contract`, `sharepoint.utilities.announcements-and-focus` |
| B07 · [Dynamic focus transitions](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L343) and [severity calibration][s01] | Stable identity and post-commit fallback for deletion/replacement, disappearing toolbar/toast/inline/Keep both/Retry actions; last deselection preserves a surviving row. Background completion does not steal focus. Close, abrupt unmount and animation cases assert the exact post-operation `document.activeElement`, not merely DOM existence; a focus trace alone does not establish visibility. Historical Important covers keyboard-triggered focus loss or unrelated destinations; Minor requires an already logical, visible, enabled destination and a non-blocking detail. “By design” needs an interaction contract and focused test evidence. | `common.topic.keyboard-focus`, `common.case.dialog-focus`, `common.verification.dynamic`, `common.verification.testing`, `sharepoint.utilities.announcements-and-focus` |
| B08 · [Focus owner selection](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L344-L399) | Component/Tabster first; explicit V9 `useRestoreFocusTarget`/`useRestoreFocusSource` only for unmet restoration. Cross-view `A11yManager.saveActiveElementAs`/`restoreFocus`; unmanaged DOM `Focus`, `FocusTransition`, `Keyboard`, `A11yAttribute`. Migration-only `useRestoreFocusOnDismiss`, `ModalShim`, `FocusTrapZoneShim`; one owner and mounted fallback, no invented overloads. | `fluent.v9.component-contract`, `fluent.v8.component-contract`, `sharepoint.utilities.announcements-and-focus` |
| B09 · [Rich-text checks](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L400-L409) | N01 documents `@msinternal/sp-a11y-checker-util`, `checkA11yForRte`, `runH1A11yChecks`: headings/H1, empty links, table headers, image alternatives and text/image/overlay contrast. Editor/content scope is separate from component authoring; source-unspecified signatures are not invented. | `sharepoint.utilities.rich-text-accessibility`, `sharepoint.selection.components-and-utilities`, `common.topic.forms-and-content` |
| B10 · [Drag/reorder utility](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L410-L413) | N02 preserves `sp-dragzone` / `IDragZoneA11yStrings`: Enter/Space begin, arrows move, Escape cancels, handle focus on cancel/complete; localized `moveStarted`, `moveComplete`, `moveCancelled`, `moveNotAllowed`. Completion key/API is unspecified in the source; this product protocol is not universal keyboard policy. | `sharepoint.utilities.drag-and-drop`, `sharepoint.selection.components-and-utilities`, `common.topic.keyboard-focus` |
| B11 · [Audit tools and utility boundaries](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L414-L424) and [evaluator evidence rules][s11] (`agentow-evaluator`) | `runAccessibilityScanAsync`: axe, `includeSelectors`, details/screenshots/count and justified disabled rules; `verifyAccessibilityWithSPA11yAssistant(page)` remains authoring-page scoped. Private helper boundaries and historical-only `VisuallyHidden` absence remain; zero violations is not interaction coverage. Voice Access comparisons match canonical URL, viewport, scale, scroll, selector/geometry, hidden debug bar and no dialogs; changed geometry/dialog tasks need their own matched scenario. Map overlay points to DOM/UIA bounds, exclude browser/OS chrome, do not flag actionable controls solely for numbers, and leave unmapped numbers inconclusive. Screen-reader recordings require duration/dimensions/image variance/audio RMS/peak, a visible-focus frame, real speech from a persistent endpoint and the composed desktop; an MP4, silent/slideshow/browser-only capture or quality metadata alone is insufficient. Each applicable step links immutable evidence; matched baseline/scenario/revision and actual failure removal are required, not static-scan substitution (B16). | `sharepoint.verification.themes-and-host`, `sharepoint.selection.components-and-utilities`, `common.verification.static`, `common.verification.dynamic`, `common.verification.testing` |
| B12 · [SPDS fit/import/composition reference][s04] | DataGrid versus Table capability fit, controlled sort/selection; sp-client stable-bundle versus odsp-common stable and `LazyComponents` dependency routes. In ODSP-Web, no direct `@fluentui/react-components` import when SPDS stable/LazyComponents fits: bypass is historically Important; an exception needs a concrete gap in both entry points and semantic/accessibility/theme fit, not styling preference. Supported slots/tokens/typography before private `.fui-*` with narrow documented exceptions. Sibling info action and `BreadcrumbItem > Menu > MenuTrigger > Button` preserve action/navigation semantics. | `sharepoint.selection.components-and-utilities`, `sharepoint.spds.component-contract`, `fluent.selection.components-and-utilities`, `common.implementation.component-contract` |
| B13 · [Theme classification/provider reference][s05] and [Detheme skill][s06] | Chrome/owned page/customer content/inline pane/overlay classification; `NeutralThemeProvider` and `enabledCustomStyleHooks`, ancestor reuse and intentional nesting. V8 shim requires migration enabled plus matching shim; otherwise `NeutralV8ThemeProvider`. Nested `getTheme()`/`createV9Theme(getTheme())` risk and V9 token layering/imports retained; customer theming preserved where applicable. Record classification, provider ancestry, token/styling decisions and relevant-state screenshots together; missing screenshots for a visible theme change are an explicit evidence gap, not a source/token-based pass. | `sharepoint.verification.themes-and-host`, `sharepoint.spds.component-contract` |
| B14 · [Localization][s02] and [shared utility reuse][s03] | N03: resources include assistive text/fallbacks, complete reorderable sentences and translator context. Numeric counts use `StringHelper.formatWithLocalizedCountValue` with sentence intervals (`0\|\|1\|\|2-` example); entity-name placeholders do not. `formatToArray`, `Intl.ListFormat`, safe rich text and `linkify: false` for choice labels; Fluent auto-flip exception only inside its style pipeline. Common preserves locale-neutral principles and utility-fit reasoning. | `sharepoint.utilities.localization-and-formatting`, `sharepoint.selection.components-and-utilities`, `common.topic.forms-and-content`, `common.topic.dynamic-content`, `common.topic.visual-accessibility`, `fluent.selection.components-and-utilities` |
| B15 · [ReplaceComponent reference][s07] | Version-bound Panel/Drawer inventory: `onRender*`, headers/body/footer, geometry/scroll, portal/providers, retained V8 controls, keyboard, dismiss/animation and focus fallback. Compare matched route/fixture/viewport/state and all reachable branches; source props/shim behavior, not names or screenshots alone, determine equivalence. | `fluent.selection.components-and-utilities`, `sharepoint.verification.themes-and-host`, `common.verification.testing` |
| B16 · [Adjacent review references and misses](#a3-adjacent-or-incidental-matches) and [matched evaluator evidence][s11] | Sanitized cases for divergent copies, false first-paint empty state, self-attested checklists, stale async work, cancellation/data-domain errors, lifecycle cleanup and scoped parity. Semantic/state ownership, lazy boundaries, reconciliation/prop-presence and required initialization/runtime identity become accessibility regression checks. B11's evidence rules require an observed requested failure, the same approved scenario/baseline against the tested revision/build, and immutable evidence linked for every applicable step; missing, blocked, skipped, inconclusive or contradicted observations cannot become passes through a diff or scan. Generic bundle budgets, report schemas and workflow execution stay outside content. | `common.analysis.root-cause`, `common.implementation.component-contract`, `common.verification.static`, `common.verification.dynamic`, `common.verification.design`, `common.verification.testing` |

### Added destinations — N01–N03

All three bodies are registered in SharePoint `0.1.1` with source bindings and relations, and linked from its overview and selection entry.

| Addition | Implemented body | Registered ID |
| --- | --- | --- |
| N01 · RTE/content-checker contract | [Rich-text accessibility](../accessibility-kb/packages/sharepoint/utilities/rich-text-accessibility.md) | `sharepoint.utilities.rich-text-accessibility` |
| N02 · Product drag/reorder contract | [Drag and drop](../accessibility-kb/packages/sharepoint/utilities/drag-and-drop.md) | `sharepoint.utilities.drag-and-drop` |
| N03 · Product localization contract | [Localization and formatting](../accessibility-kb/packages/sharepoint/utilities/localization-and-formatting.md) | `sharepoint.utilities.localization-and-formatting` |

## 4. Exact existing target index

The exact 35 registered IDs below include overviews, procedures and support profiles as well as migrated rule bodies. All three packages are `0.1.1`. Descriptors: [Common](../accessibility-kb/packages/common/package.json), [Fluent](../accessibility-kb/packages/fluent/package.json), [SharePoint](../accessibility-kb/packages/sharepoint/package.json).

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
| `fluent.v8.component-contract` | [V8 announcement/focus contract](../accessibility-kb/packages/fluent/v8/component-contract.md) |
| `fluent.v9.component-contract` | [V9 component/announcement/focus contract](../accessibility-kb/packages/fluent/v9/component-contract.md) |
| `fluent.selection.components-and-utilities` | [Fluent selection](../accessibility-kb/packages/fluent/selection/components-and-utilities.md) |
| `sharepoint.overview` | [SharePoint overview](../accessibility-kb/packages/sharepoint/README.md) |
| `sharepoint.selection.components-and-utilities` | [SharePoint selection](../accessibility-kb/packages/sharepoint/selection/components-and-utilities.md) |
| `sharepoint.spds.component-contract` | [SPDS delegation/composition contract](../accessibility-kb/packages/sharepoint/spds/component-contract.md) |
| `sharepoint.utilities.announcements-and-focus` | [Announcement/focus contract](../accessibility-kb/packages/sharepoint/utilities/announcements-and-focus.md) |
| `sharepoint.utilities.rich-text-accessibility` | [Rich-text accessibility](../accessibility-kb/packages/sharepoint/utilities/rich-text-accessibility.md) |
| `sharepoint.utilities.drag-and-drop` | [Drag and drop](../accessibility-kb/packages/sharepoint/utilities/drag-and-drop.md) |
| `sharepoint.utilities.localization-and-formatting` | [Localization and formatting](../accessibility-kb/packages/sharepoint/utilities/localization-and-formatting.md) |
| `sharepoint.profile.support-policy` | [Support policy](../accessibility-kb/packages/sharepoint/profiles/support-policy.md) |
| `sharepoint.profile.support-matrix` | [Support matrix](../accessibility-kb/packages/sharepoint/profiles/support-matrix.json) |
| `sharepoint.verification.themes-and-host` | [Theme/host verification](../accessibility-kb/packages/sharepoint/verification/themes-and-host.md) |
| `sharepoint.case.duplicate-announcement` | [Duplicate-announcement case](../accessibility-kb/packages/sharepoint/cases/duplicate-announcement.md) |

Use overviews to select a contract and Common procedures to structure reasoning. Foundations and authority/applicability explain source interpretation; support profiles keep support, applicability, verification and exceptions separate. The two cases supply concrete hypothetical positive/negative scenarios, not incident records.

## 5. Operational boundaries and independent source acquisition

- **Existing plugins remain unchanged.** Setup, providers, browser/AT operations, leases, evidence capture, PR publication and run/harness lifecycle remain with their operational implementations. Preserve owner/run/affinity and canonical gates. KB procedures supply reasoning, not executable replacements.
- **Deliberate content boundaries:** heading-outline decisions, evidence-quality rules and the historical scoped Important/Minor rubric are preserved in B02/B06/B07/B11/B12/B13/B15/B16; the rubric is not MAS classification or a replacement for current product policy. Repository-specific artifact/report schemas and execution—including Flight/KillSwitch and release commands—remain outside KB content.
- **MAS is separate acquisition and implementation work.** Official MAS rule bodies, IDs and an authorized rule API are absent from the audited source. The unified KB/MAS adapter remains design-only in [technical design section 11](TECH-DESIGN.md#11-planned-one-kb-endpoint-with-mas-rule-capabilities), for later implementation—not a migrated API.
- **Current source qualification:** official SPDS/SharePoint utility and product-support connections remain pending; Fluent's V9 documentation target is review-pending and is not a V8 source. The support matrix remains `awaiting-official-source` with `products: []`. Obtain version-specific sources and reviews through the contribution process rather than inventing declarations.

## 6. Maintenance and validation record

Validation on 2026-09-15: **97 KB tests and 79 marketplace tests passed**, with
both generated checks passing. The content build contains 35 entries and retains
four immutable artifacts (two original snapshots plus two new 0.1.1 snapshots).
MCP regressions search and read the migrated rules through the public local tools;
no existing plugin, runtime implementation or MAS adapter was changed.

For subsequent contributions, update the owning body and descriptor together: source clause → target ID → scoped rule/exception → positive/negative example. Reuse existing IDs when scope is unchanged; add navigation and relations for new independently citable content. Keep Common product-independent, Fluent version-specific and SharePoint host-specific. Coordinate exact versions and publish through the [design's release process](TECH-DESIGN.md#9-versioning-generation-and-publication).

This update compares current authored bodies, package READMEs and descriptors with the established pinned-source audit. Both language editions retain B01–B16, registered N01–N03, the exact 35 target IDs and the unchanged 53-path / 41-body appendix.

Validation from the repository root: rerun section 2's snapshot command for pinned-source preservation/drift; use `npm --prefix knowledge-server run build`, `npm --prefix knowledge-server test` and `npm --prefix knowledge-server run check` for KB generation/publication, schema/content/documentation regressions and generated consistency. Use `npm run build`, `npm test` and `npm run check` for marketplace generation, regressions and generated consistency. Record outcomes from completed runs; these checks do not establish live AT behavior or official source approval.

**Outcome: audited reusable-rule migration complete in authored content; independent source qualification, publication validation and the future MAS adapter remain separate follow-up work.**

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

These candidates mix operational instructions with reusable evaluation rules. The evaluator's overlay attribution, recording quality and matched baseline/step evidence rules are migrated in B11 to `common.verification.dynamic` through `agentow-evaluator`, with regression interpretation in B16. Agent execution, routing, validators and artifact/report schemas remain at their operative source.

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