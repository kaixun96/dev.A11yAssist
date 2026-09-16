# MAS reconciliation (2026-09-16)

This is a data comparison, not a content approval or accessibility conformance result.

- Original source: ADO agency commit `9a64ed90b579b14ebbe90d1c797005c8ae4b784a`,
  path `src/Mcp/Servers/A11yStandards/A11yStandards/Data/MasStandards.json`.
- Original Git blob: `661ff7b91c059e02ceac3689def4fa44a4dfdbea`.
- Original bytes SHA-256: `50807c23db2a797d630a224b957c5212160caf0ecf359bbb6cbc72486631a683`.
- Liquid query: `rex://ms.accessibility/Requirements/$rows`, top 300.
  The response contained 254 items and no continuation property.
- Liquid selected-content SHA-256: `a3c19c900e2f51e6e2d1683e1ff6fcb0eb61c50d120d8dd6ca9b28feca15d652` (canonical JSON of projected
  non-`not-found` records, excluding `_SourceSupplement` and `_Liquid`).
- Source 255; matched 244; added 10;
  source-only retained 11; total 265.
- The original file contains trailing commas accepted by some readers but not
  strict JSON. This commit removes those delimiters and writes valid UTF-8 JSON;
  strings are not repaired or rewritten by the parser.

## Interpretation

For matched IDs, replace standard text, applicability, effective/publication
metadata and explicit relationship targets with Liquid's values. Keep rich-text
bodies unchanged, including any upstream spelling or formatting defects.
Flatten only the `EnhancedMarkdown` wrapper and relationship target arrays;
an empty rich-text object becomes an empty string.
Liquid `MAS.05A.ReplacedBy` contains a malformed target wrapping a serialized
two-element array. Decode its explicit `Value` into `02.04.03` and `02.04.07`
only after confirming both referenced IDs exist in the same retrieved rows.
Do not infer replacement relationships from similar titles or IDs.

Source-only detection/fix/examples/mappings remain under `_SourceSupplement`.
They are not Liquid-verified rules, mappings or approved fixes. Structured source
applicability is retained there while the authoritative applicability text is used.
Source-only IDs remain intact with `_Liquid.status: not-found`; this is NOT proof
of retirement or invalidity, and their original publication status is historical.
Do not treat them as current requirements without an authoritative lookup.

No personal editor/creator identities, analytics queries or operational
configuration are imported from Liquid. `_UpdatedOn` and per-record `_Liquid`
metadata identify the retrieved revisions; a frozen copy does not update itself.

## Per-record field changes

`matched` lists additions, removals or replacements relative to the original
record, including separation of source-only guidance. The first commit preserves
every original byte for review. `added` records are new to the source file.

| MAS ID | Result | Changed fields |
|---|---|---|
| 01.01.01 | matched | `AdditionalInformation`, `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_TechnicalGuidance`, `_UpdatedOn` |
| 01.02.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.02.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.02.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_Support`, `_UpdatedOn` |
| 01.02.05 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.03.01 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_TechnicalGuidance`, `_UpdatedOn` |
| 01.03.02 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_TechnicalGuidance`, `_UpdatedOn` |
| 01.03.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.03.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.03.05 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.04.01 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_UpdatedOn` |
| 01.04.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.04.03 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_TechnicalGuidance`, `_Title`, `_UpdatedOn` |
| 01.04.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.04.05 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.04.10 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.04.11 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.04.12 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 01.04.13 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_UpdatedOn` |
| 02.01.01 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_UpdatedOn` |
| 02.01.02 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_Title`, `_UpdatedOn` |
| 02.01.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.02.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.02.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.03.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.04.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.04.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.04.03 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_UpdatedOn` |
| 02.04.04 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_UpdatedOn` |
| 02.04.05 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.04.06 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_UpdatedOn` |
| 02.04.07 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_UpdatedOn` |
| 02.05.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.05.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.05.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.05.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.01.01 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_Title`, `_UpdatedOn` |
| 03.01.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.02.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.02.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.02.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.02.04 | matched | `AdditionalInformation`, `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.03.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.03.02 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_UpdatedOn` |
| 03.03.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.03.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.01.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.01.02 | matched | `ApplicationsSubcategory`, `Category`, `EN.301.549.V3.2.1`, `Guideline`, `Replaced`, `RichDescription`, `Scoping`, `Section508`, `WCAG22`, `WordExportLink`, `_Applicability`, `_CommonPatterns`, `_DetectionPatterns`, `_EffectiveEnd`, `_EffectiveStart`, `_FixPrinciples`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_Metadata`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_SourceSupplement`, `_Standards`, `_Support`, `_TechnicalGuidance`, `_Title`, `_UpdatedOn` |
| 04.01.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.04 | matched | `AdditionalInformation`, `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.05 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.06 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.07 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.08 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.09 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.10 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.11 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.12 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.02.13 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.03.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 04.03.02 | matched | `ApplicationsSubcategory`, `Category`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 05.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 05.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 05.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 05.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 05.05 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.05 | matched | `ApplicationsSubcategory`, `Category`, `Replaced`, `RichDescription`, `TIAEIA`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 07.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 07.02 | matched | `AdditionalInformation`, `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 07.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 07.04 | matched | `ApplicationsSubcategory`, `Category`, `Replaced`, `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| 07.05 | matched | `ApplicationsSubcategory`, `Category`, `Replaced`, `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| 07.06 | matched | `ApplicationsSubcategory`, `Category`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 07.07 | matched | `ApplicationsSubcategory`, `Category`, `FCC`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.01 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.02 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.03 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.04 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.05 | matched | `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.06 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.07 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.08 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.09 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.10 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.11 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.12 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.13 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.14 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.15 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.16 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.17 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.18 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.19 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.20 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 08.21 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 09.01 | matched | `Category`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 09.02 | matched | `Category`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 09.03 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 10.01 | matched | `AdditionalInformation`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_EffectiveStart`, `_PublicationDate`, `_Requirement`, `_Title`, `_UpdatedOn` |
| 10.02 | matched | `AdditionalInformation`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_EffectiveStart`, `_PublicationDate`, `_Requirement`, `_Support`, `_UpdatedOn` |
| 10.03 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.03.01 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.03.02 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.03.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.05 | matched | `ApplicationsSubcategory`, `Category`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.07 | matched | `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.08 | matched | `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.09 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `Section508`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 11.10 | matched | `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| MAS.01 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.02 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.03 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.04 | matched | `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.05 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.05A | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.06 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.07 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.08 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.09 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.10 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.12 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.13 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.14 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.15 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.16 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.17 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.19 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.20 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.20A | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.20B | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.21 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.22 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.22A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.23 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.24 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.25 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.25A | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.26 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.26A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.27 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.27A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.28 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.29 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.30 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.31 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.31A | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.32 | matched | `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33B | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33C | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33D | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33E | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33F | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33G | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33H | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33I | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33J | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33K | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33L | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.33M | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.34 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.34A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.35 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.36 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.37 | matched | `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.38 | matched | `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.39 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.40 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.40B | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.41 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.41A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.42A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.43 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.43A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.44 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.44A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.44B | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.46 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.46A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.47 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.53 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.56 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.57 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.58 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.62 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.62A | matched | `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.62B | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.63 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.64 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.65 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.68 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.69 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.70 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.71 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.71A | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.71B | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.71C | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.71D | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.72 | matched | `ReplacedBy`, `RichDescription`, `Section508`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.73 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.74 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.74A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.75 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.75A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.76 | matched | `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.77 | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| MAS.77A | matched | `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| 06.02.02.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.02.02.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 07.01.04 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 07.01.05 | matched | `ApplicationsSubcategory`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_Guidance`, `_PublicationDate`, `_UpdatedOn` |
| 06.05.05 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| 06.05.06 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `ReplacedBy`, `RichDescription`, `WordExportLink`, `_PublicationDate`, `_UpdatedOn` |
| 04.03.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Principle`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.07 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.06 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 10.04 | matched | `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 10.05 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 10.06 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 05.03.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 10.100 | not-found | (retained without normative changes) |
| 10.101 | not-found | (retained without normative changes) |
| 10.102 | not-found | (retained without normative changes) |
| 10.103 | not-found | (retained without normative changes) |
| 10.104 | not-found | (retained without normative changes) |
| 10.105 | not-found | (retained without normative changes) |
| 10.106 | not-found | (retained without normative changes) |
| 10.107 | not-found | (retained without normative changes) |
| 10.108 | not-found | (retained without normative changes) |
| 10.109 | not-found | (retained without normative changes) |
| 10.110 | not-found | (retained without normative changes) |
| 02.04.11 | matched | `ApplicationsSubcategory`, `Category`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.05.07 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 02.05.08 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.02.06 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.03.07 | matched | `ApplicationsSubcategory`, `Category`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 03.03.08 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `Scoping`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.06.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.06.02 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.06.03 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.06.04 | matched | `AdditionalInformation`, `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 06.06.05 | matched | `AdditionalInformation`, `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 07.01.04.01 | matched | `ApplicationsSubcategory`, `Category`, `Guideline`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_Requirement`, `_UpdatedOn` |
| 10.03.01 | matched | `Category`, `Guideline`, `Replaced`, `RichDescription`, `WordExportLink`, `_Applicability`, `_EffectiveEnd`, `_Guidance`, `_PublicationDate`, `_UpdatedOn` |
| 10.07.01 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.08 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.01.01 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.01.03 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.09.02 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.01.02 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.09.01 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.02.01 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.02.02 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
| 10.07.02 | added | `AdditionalInformation`, `Category`, `RichDescription`, `WordExportLink`, `_Applicability`, `_DID`, `_EffectiveEnd`, `_EffectiveStart`, `_Guidance`, `_IsKqlAnalyticsQueryLive`, `_IsKqlContextObjectEnabled`, `_IsS360IntegrationEnabled`, `_IsStateRollupDisabled`, `_PublicationDate`, `_PublicationStatus`, `_Requirement`, `_Support`, `_Title`, `_UpdatedOn` |
