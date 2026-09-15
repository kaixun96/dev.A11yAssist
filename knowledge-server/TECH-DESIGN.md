# Accessibility Knowledge Base: Technical Design and Collaborative Extension Guide

English | [简体中文](TECH-DESIGN.zh-CN.md)

Source coverage: [AgentOW migration audit](AGENTOW-MIGRATION-AUDIT.md).
The audited reusable accessibility rules from AgentOW commit
`7896845e51d75b0b9d632a2fd61876bc2f556ea5` are migrated into the authored KB.

This document is for content contributors, component/product experts, KB reviewers, and service maintainers.
It describes schema v1, authored content packages 0.1.1 and standalone service 0.1.0,
without presenting planned capabilities as delivered features. For installation and host registration, see the
[service README](README.md); for content review policy, see the
[contribution guidelines](../accessibility-kb/governance/contribution.md).

**Target architecture addendum: one KB endpoint provides both local knowledge and authoritative MAS rules.**
Sections 1–10 describe the implemented local snapshot service; section 11 defines MAS integration for colleagues
to implement later. The MAS addendum is design-only: MAS connections, tools, configuration parsing and runtime
gates are not implemented.

## 1. Goals and Boundaries

The KB organizes cross-product knowledge, framework contracts, and product constraints into content that can be
cited, reviewed, and distributed by dependency closure. The goal is not to put all material in one long document,
but to enable collaborators to answer:

- Which layer, version, and knowledge entry should be read for the current task?
- Does a conclusion come from a specification, component contract, product support statement, or unreviewed methodological advice?
- What context or sources are missing, and which verification still requires a real environment?
- When one knowledge entry changes, which packages, references, and evaluations need to be updated together?

**Current boundary:** this is a standalone KB + read-only stdio MCP. It does not register or rewrite any existing
plugin. Existing plugins retain their original knowledge, skills, configuration, run logs, browsers, and workflows.
This service does not read A11y workflow configuration, own execution providers, or perform fixes, tests, browser
operations, or assistive technology (AT) operations. A `procedure` guides reasoning and planning; it is not an
automatically executable workflow.

**Ultimate replacement target:** after service readiness and consumer acceptance, all plugins needing accessibility
knowledge should use the host's unified Knowledge MCP, retiring `a11y-knowledge`, `a11y-knowledge-odsp` and
duplicate embedded knowledge. This is a future migration, not a change to current installations. Callers such as
Bug Bash still review source, perform separately authorized execution, make conclusions and report results.
The service provides knowledge discovery and reading, not an Execution MCP or MAS integration.

**Not currently provided:** automatic synchronization of official sources, web crawling, semantic/vector retrieval,
automatic task-based package selection, automatic content approval, automatic plugin integration, or quantified
guarantees of agent effectiveness. The current 35 entries (Common 20, Fluent 4, SharePoint 11) include concrete
migrated rules, API ownership, exceptions and positive/negative examples. They remain draft: pinned historical
provenance is not official approval or current installed-version qualification. Migration scope is the audited
reusable rules, not every word, executable or external authority referenced by the old repository.

**Future goal:** ship the MAS MCP client/adapter with the standalone KB service so that hosts register only one
KB MCP, rather than each host orchestrating KB and MAS separately. The KB service manages MAS connections
internally; the runtime environment still supplies credentials securely. This is read-only access to an authoritative
source, not a fix/publish provider, and does not change existing plugin workflows. It is not implemented today:
registering `sources.mas` must not be treated as having connected to MAS.

## 2. Overall Structure and Data Flow

```mermaid
flowchart LR
  Expert[Contributors and domain reviewers] --> Author[accessibility-kb authored files]
  Author --> Validate[loadKnowledgeBase: schema / links / sources / dependency checks]
  Validate --> Export[exportKnowledgeBase: selected dependency closure]
  Export --> Manifest[Source manifest]
  Export --> Artifact[Immutable distribution artifacts]
  Artifact --> Index[Retained publication index]
  Export --> Ref[Server pinned reference]
  Ref --> Loader[Runtime snapshot loader]
  Local[Explicit root or validated checkout] --> Loader
  Cache[Shared per-user cache] --> Loader
  Artifact --> HTTPS[Reviewed publication on main]
  HTTPS --> Loader
  Loader --> MCP[List / search / read]
  MCP --> Host[Explicitly configured host]
  Host -. separate authorization .-> Workflow[Existing execution workflows]
```

Do not confuse these three distinct structures:

1. **Package dependency graph:** determines which packages are exported; versions must match exactly and the graph must be acyclic.
2. **Entry relationship graph:** `relations` points to knowledge IDs to understand together; it does not automatically read recursively or execute anything.
3. **Source records:** `sourceIds` points to source metadata within the same package; the service does not fetch source URLs.

### 2.1 Locations and Maintenance Responsibilities

| Location | Purpose | Who edits it / whether generated |
|---|---|---|
| [KB catalog](../accessibility-kb/catalog.json) | Register all content packages and their descriptor locations | Update when adding a package |
| [Common descriptor](../accessibility-kb/packages/common/package.json) | Versions, sources, and entry inventory for common knowledge | Common content contributors |
| [Fluent descriptor](../accessibility-kb/packages/fluent/package.json) | Fluent version contracts, dependencies, and entries | Framework experts |
| [SharePoint descriptor](../accessibility-kb/packages/sharepoint/package.json) | SPDS, utilities, host, and support constraints | Product experts |
| [Package schema](../accessibility-kb/schemas/package.schema.json) / [support matrix schema](../accessibility-kb/schemas/support-matrix.schema.json) | Authoring data shape | Protocol maintainers; not an ordinary content change |
| [Contribution guidelines](../accessibility-kb/governance/contribution.md) / [effectiveness evaluation rubric](../accessibility-kb/evaluations/README.md) | Review rules and criteria for evaluating knowledge effectiveness | Content governance and evaluation owners |
| [KB source manifest](../accessibility-kb/manifest.json) | Content hashes for the entire authored KB | Build-generated; do not edit manually |
| [Content validation/export](tools/knowledge-base.mjs) | Ajv schema, file inventory, relationship, source, and closure validation | Build maintainers |
| [Reference tools](tools/knowledge-reference.mjs) | Create pins; resolve local references for maintainers | Build maintainers; not distributed with the minimal runtime |
| [Standalone builder](tools/build.mjs) | Select distribution packages, generate artifacts, and retain history | Release maintainers |
| [Service reference](references/knowledge.json) | Currently selected versions, manifest pin, URL, and raw pin for the service | Build-generated; do not edit manually |
| [Distribution index](../knowledge-distribution/index.json) | Manifest pin → raw SHA-256 for all retained artifacts | Build-generated; retain history |
| [Runtime loader](src/runtime/knowledge.mjs) | Location resolution, downloading, caching, semantic and integrity validation | Runtime maintainers |
| [MCP handler](src/runtime/knowledge-mcp.mjs) / [stdio entry point](cli.mjs) | Three read-only tools and transport | Runtime maintainers |
| [Standalone CI](../.github/workflows/knowledge.yml) | Validate the KB separately from the existing marketplace | Service maintainers |
| This document | Design, extension steps, and responsibility boundaries | Maintainers; not included in knowledge snapshots |

**Do not mix standalone KB content with existing plugin knowledge.** Content for this design belongs in the
standalone [accessibility-kb](../accessibility-kb/README.md), without changing
[existing plugin knowledge](../src/knowledge/README.md) or generated plugin copies.
The standalone builder does not invoke the [marketplace builder](../tools/build.mjs).

## 3. Knowledge Layers: What to Add and Where

```mermaid
flowchart TD
  SharePoint[sharepoint: SPDS / host / utilities / support] --> Fluent[fluent: version-specific contracts]
  SharePoint --> Common[common: cross-product reasoning and requirements]
  Fluent --> Common
```

Arrows mean “depends on.” `common` must not depend on any product package; do not pull an entire product
package back into Common just to cite a product case. Fluent should not contain SharePoint-specific business
assumptions. Dependencies use exact versions such as `0.1.1`; `^0.1.1`, `latest`, and version ranges are unsupported.

There are two independent organization axes: **scope** (`common` / `fluent` / `sharepoint`) and
**knowledge type** (standards / patterns / cases / fixes / examples). Types are not additional packages or
directories required by the protocol. WCAG and WAI-ARIA normative requirements belong in Common;
Fluent and SharePoint describe scoped implementation and product responsibilities. APG is informative guidance,
distinct from those normative requirements, even when an entry cites both.

The discovery API uses singular categories `standard`, `pattern`, `case`, `fix`, `example`, not new `kind` values.
`kind` remains the entry's primary authoring role; optional curated `discoveryTags` supply only
`pattern` / `fix` / `example`. A `case` category derives from `kind: case`; a `standard` category derives from
a directly cited source whose authority is `normative-standard`. Neither a source citation nor a category asserts
complete coverage of a norm or criterion, approval, compliance, or a proven real historical fix.

### 3.1 Content Placement Quick Reference

The following directories are content organization conventions, not a template that must be created in full at once;
individual files must be declared in the descriptor.

| Content to add | Location / existing starting point | `kind` | What to make explicit |
|---|---|---|---|
| General semantics, keyboard, focus, forms, dynamic content, and visual principles | Common `topics/`, such as [keyboard-focus](../accessibility-kb/packages/common/topics/keyboard-focus.md) | `topic` | Scope, boundaries, and common misuse |
| Applicability and differences in authority of sources such as MAS/WCAG | Common `requirements/`, extending [authority-and-applicability](../accessibility-kb/packages/common/requirements/authority-and-applicability.md) | `requirement-guidance` | Exact clauses, versions, normative vs. explanatory material, and sources not yet connected |
| Root-cause identification and which layer should change | Common `analysis/`, such as [root-cause](../accessibility-kb/packages/common/analysis/root-cause.md) | `analysis` | Reasoning from symptoms to the responsible layer, rather than patching each symptom |
| Implementation responsibilities across components | Common `implementation/`, such as [component-contract](../accessibility-kb/packages/common/implementation/component-contract.md) | `implementation-contract` | Existing component capabilities, caller responsibilities, and async/error branches |
| Static, dynamic, design, and test verification methods | Common `verification/` | `verification` | What can and cannot be proved, and what evidence is required |
| Knowledge-use steps for Find/Fix/Prevent/Review/Add-tests | Common `procedures/` | `procedure` | Reading order, decisions, and verification plans; no grant of execution authority |
| Reusable positive and negative cases | The owning package's `cases/` | `case` | Scenario, counterexample, correct layer, verification, and inapplicable cases; sanitized |
| Fluent V8 vs. V9 API/behavior differences | Fluent `v8/`, `v9/`, `selection/` | `implementation-contract` | Actual versions and documentation clauses; do not infer across major versions |
| SPDS components and SharePoint utility/host constraints | SharePoint `spds/`, `utilities/`, `verification/` | `implementation-contract` for contracts; `verification` for verification | Boundary between general components and product wrappers |
| Product support statements, versions, and grounds for exceptions | SharePoint `profiles/`, such as [support-policy](../accessibility-kb/packages/sharepoint/profiles/support-policy.md) | `product-profile` | Record support statements, applicability, actual verification, and exceptions separately |
| Whether knowledge improves agent judgment | [Evaluations rubric](../accessibility-kb/evaluations/README.md) | Not a product knowledge entry | Positive/negative samples, false positives/negatives, evidence calibration, and fixes at the wrong layer |

One issue may span several layers: Common describes “how to choose a focus return target when closing a dialog,”
Fluent describes “what contract a specific Dialog version provides,” and SharePoint describes “which responsibilities
the host/wrapper utilities cover.” Connect them through `relations` instead of copying the general rule three times.
When sources conflict, record context gaps and have an authorized domain reviewer determine the applicable clauses;
the service must not automatically assume that one source overrides another.

### 3.2 Extend the Migrated Rules

Start from the existing body rather than creating a parallel checklist. The audit maps B01–B16 to exact IDs;
each package overview provides the reading route and the descriptors bind historical source records.

| Area / starting point | Implemented coverage to preserve | Useful next contribution |
|---|---|---|
| [Common overview](../accessibility-kb/packages/common/README.md) | Rendered semantics; complete async visible/programmatic/focus outcomes; disappearing-control focus; localized messages; scoped scan and replacement cases | Add a missing interaction or counterexample at its owning topic, then relate verification and procedures |
| [Fluent selection](../accessibility-kb/packages/fluent/selection/components-and-utilities.md), [V8](../accessibility-kb/packages/fluent/v8/component-contract.md), [V9](../accessibility-kb/packages/fluent/v9/component-contract.md) | Component-to-document map; V8 `delayedRender`/`Announced`; V9 intent/`AriaLiveAnnouncer`/`useAnnounce`; restoration and shim boundaries | Verify the installed version's export, provider and override behavior; retain one announcement/focus owner |
| [SharePoint overview](../accessibility-kb/packages/sharepoint/README.md) | Table/DataGrid and stable/LazyComponents fit; SPDS composition; shared alerts and focus; neutral providers and replacement checks | Extend a concrete host scenario, preserving product scope and caller obligations |
| [RTE](../accessibility-kb/packages/sharepoint/utilities/rich-text-accessibility.md), [drag/reorder](../accessibility-kb/packages/sharepoint/utilities/drag-and-drop.md), [formatting](../accessibility-kb/packages/sharepoint/utilities/localization-and-formatting.md) | Registered N01–N03: checker capabilities, move-state protocol, complete count/ReactNode resources and RTL exceptions | Add version-backed signatures or edge cases where the pinned source supplies only names/behavior; do not guess missing API details |
| Common requirements and SharePoint profiles | Source/applicability policy and separate support/verification dimensions | Acquire official clauses/support statements, assign reviewers and record review evidence; MAS implementation remains section 11 |

For a contribution, record source clause → target ID → scoped rule/exception → positive/negative verification
case. Keep historical records for provenance and add independently reviewed current sources for qualification.
Private materials, credentials and run evidence stay in authorized external systems. Follow sections 4–7 for
registration and section 9 for coordinated versions and publication.

## 4. Data Model and Reference Contract

### 4.1 Package, Entry, and Source

| Object | Fields and semantics |
|---|---|
| package | `schemaVersion`, `id`, `version`, `dependencies`, `sources`, `entries`; arbitrary unknown fields are not allowed |
| entry identity | `id` is unique across the KB and starts with its package ID; `path` is relative to the package directory. Identity is separate from file location |
| entry classification | `kind` must use the existing schema enum; optional `discoveryTags` contains 1–3 unique values from `pattern`, `fix`, `example`. Directory names do not assign categories or authority |
| entry context | `appliesTo` is a nonempty string array recording versions/products/platforms; list/search can filter by an exact label, without automatic applicability or version inference |
| entry sources | `sourceIds` may reference only IDs in this package's `sources`. Use `relations` for cross-package reading associations; do not borrow another package's source IDs directly |
| entry relationships | Targets of `relations` and `deprecatedBy` must exist in the package or its dependency closure |
| entry lifecycle | `status` is `draft` / `approved` / `deprecated`; approval information belongs in the descriptor, not merely a “reviewed” label in the body |
| source | `id` is unique within the package; `authority`, `status`, `locator`, `revision`, and `note` distinguish source type and readiness |

A valid ID is `common.topic.keyboard-focus`. Package names and ID segments start with a lowercase letter,
followed only by lowercase letters, digits, or hyphens; entries must include a dot-separated namespace.
The six `source.authority` categories are `company-requirements`, `normative-standard`,
`informative-guidance`, `component-contract`, `product-support`, and `historical-reference`.

### 4.2 Lifecycle Is Not an Automated Workflow

- Source not connected: `connection-pending`; `locator`/`revision` may be `null`; explain what is missing.
- Candidate material available but not reviewed: `review-pending`; a URL does not mean it supports the current conclusion.
- Reviewed source: `reviewed` requires nonempty `locator` and `revision`; the validator checks shape, while a reviewer verifies the actual clauses.
- Historical material: `historical`; it cannot directly support approved entries.
- Promoting an entry from draft to approved requires an actual owner, a reviewer other than `unassigned`, a review date,
  and evidence references; at least one relevant source is required, and all sources must be reviewed. A purely
  methodological draft may temporarily have no source, but that does not make it eligible for approval.
- Substantive source or framework changes: **manually** return affected entries to draft and review them again;
  there is no automatic invalidation analysis.
- Deprecating an entry: retain its old ID, set `status: deprecated`, and provide a valid `deprecatedBy`.
  Current policy does not support deprecation without a replacement target; do not silently give the same ID a different meaning.

The service always returns `contentApprovalVerified: false` and `independentBehaviorVerified: false`.
Even when entry metadata says approved, neither field becomes true: the service has not performed human review
or behavioral verification.

### 4.3 File and Link Rules

- Every content body must be declared in `entries`; even a README in a package directory must be an entry.
  Do not drop in unregistered notes, images, scripts, or fixtures; the strict file inventory rejects them.
- Content bodies currently support Markdown; JSON is supported only for `kind: product-profile` + `dataSchema: support-matrix`.
  Any new JSON type, image, or binary attachment requires protocol design, not just adding a file.
- Relative Markdown links within a package may point to whole files; local `#heading` anchors, cross-package
  relative links, out-of-bounds paths, and unsupported URIs are currently rejected. Use stable IDs for cross-package relationships.
- The global shared file set is fixed: the KB root README, catalog, two schemas, contribution guidelines, and
  evaluation rubric. Every export includes them, so they must not contain required links that depend on an unselected product package.
- Adding a global KB file requires updating both authoring `commonFiles` and runtime `COMMON_FILES`, plus
  closure tests. Ordinary design documents should live in the service directory, like this document, without expanding distribution content.
- The runtime rejects Windows path case collisions, device names, symbolic links, and file/directory conflicts.
  Use simple relative `/` paths for content; passing authoring validation does not mean full runtime validation has passed.

## 5. Playbook: Add a Knowledge Entry

The following examples demonstrate **draft metadata**; they do not add reviewed rules.
Suppose you want to add a cross-product topic on “focus handling after asynchronous completion”:

1. First check the existing [keyboard-focus](../accessibility-kb/packages/common/topics/keyboard-focus.md)
  and [dynamic-content](../accessibility-kb/packages/common/topics/dynamic-content.md) entries.
  Prefer improving an existing entry with the same semantics; add an ID only for a new, independently citable topic.
2. Create `topics/async-focus.md` in the Common package and describe its scope and gaps using the body template below.
3. Add the following object to `entries` in the
  [Common package descriptor](../accessibility-kb/packages/common/package.json). The example references existing
  candidate sources `wcag` / `apg`; the basis for each claim in the body still needs verification.

```json
{
  "id": "common.topic.async-focus",
  "path": "topics/async-focus.md",
  "kind": "topic",
  "status": "draft",
  "owner": "unassigned",
  "appliesTo": ["web", "async-ui"],
  "sourceIds": ["wcag", "apg"],
  "relations": ["common.topic.keyboard-focus", "common.topic.dynamic-content"]
}
```

4. If a new source is needed, add a record to `sources` in **the same package**. A candidate source that is not
  yet connected can be represented as follows. Do not mark it reviewed or attach it to unrelated entries to create
  the impression that they have a supporting basis.

```json
{
  "id": "async-focus-contract",
  "authority": "component-contract",
  "status": "connection-pending",
  "locator": null,
  "revision": null,
  "note": "Authorized source, applicable version, and exact clauses remain to be confirmed; no reviewed contract content is currently provided."
}
```

5. Update the reading navigation in the package overview; if another entry must be read together with this one,
   add its `relations` as well. Relationships are not automatically bidirectional and do not read content for the caller.
6. Follow section 9 for versioning, generation, and evaluation. Check that the new entry is visible through `list/read`
   and that Common-only exports still have no product package dependencies. Update count assertions to reflect
   justified content changes; do not simply delete boundary tests.

### Recommended Body Outline

```markdown
# Title

## Scope and Inapplicable Cases
Products/frameworks/versions/platforms, and context that must be obtained first.

## Sources and Current Status
Specific source IDs, clauses/versions, and whether material is normative or illustrative; explicitly label unreviewed content as draft.

## Semantics or User Outcomes to Preserve
Explain why this is needed, rather than listing only an attribute or a fixed implementation.

## Reasoning and Implementation Responsibilities
What the component already does and what the caller owns; async, error, cancellation, and recovery branches.

## Positive Examples, Counterexamples, and Common Incorrect Fixes
Use minimal, sanitized examples; do not assume an example applies to every component version.

## Verification and Evidence Boundaries
What source code can establish, what requires actual execution, and how to mark a gap when verification is unavailable.

## Related Knowledge and Open Items
List stable IDs and unresolved source/version/owner questions.
```

This outline is authoring advice; these headings are not currently validated. Actual execution steps, tenant details,
UPNs, DevBox rosters, authentication information, and user run evidence must not be committed as knowledge content.

## 6. Playbook: Add a Product or Framework Package

Add a package only when the content has its own applicability domain or maintenance responsibility; do not create
a package for every topic. Consider the example package `product-example`, which does not yet exist:

1. Add `{"id":"product-example","path":"packages/product-example/package.json"}` to `packages` in the
   [catalog](../accessibility-kb/catalog.json).
2. Create the corresponding package descriptor and README content. The following descriptor represents a minimal draft package:

```json
{
  "schemaVersion": 1,
  "id": "product-example",
  "version": "0.1.1",
  "dependencies": {"common": "0.1.1"},
  "sources": [],
  "entries": [
    {
      "id": "product-example.overview",
      "path": "README.md",
      "kind": "topic",
      "status": "draft",
      "owner": "unassigned",
      "appliesTo": ["product-example"],
      "sourceIds": [],
      "relations": ["common.overview"]
    }
  ]
}
```

3. `dependencies` must match the actual package versions in the current KB. The example's `0.1.1` is not a
   permanently valid default. If using Fluent contracts, depend on Fluent explicitly; do not add a product dependency
   to Common to bypass validation.
4. Add bodies, sources, and relationships entry by entry as described in section 5. An ordinary new package does not require a schema change.
5. **Decide whether to publish it and which service selects it.** Catalog registration only includes it in the source
   manifest; it does not mean the existing service will read it.

The current [builder](tools/build.mjs) has fixed publication selections of `[['common'], ['sharepoint']]`,
and the service reference is always generated by `createKnowledgeReference(kb, ['sharepoint'])`:

| Desired result | Required changes |
|---|---|
| Include content for future improvement without exposing it to the current service | Add catalog registration, descriptor, and bodies; the source manifest changes, but the existing service selection does not |
| Distribute the new product closure separately | Add a builder selection; add export, pin, and isolation tests for that closure. This does not automatically switch the current service |
| Let the same service also read the new package | Select it explicitly when generating the service reference and generate a **combined artifact with the same selection**; single-package artifacts alone are insufficient |
| Make it a required dependency of an existing product package | Update genuine dependencies and versions; existing selections include it recursively. Do not fabricate a semantic dependency solely for distribution |

Do not turn SharePoint into an aggregator for every product. Multiple independent package sets, configurable
selection, or multiple service configurations require separate future design; there is currently no CLI argument
for users to switch freely among these sets.

## 7. Playbook: Support Matrices and Schema Extensions

The existing example is the [SharePoint support matrix](../accessibility-kb/packages/sharepoint/profiles/support-matrix.json).
It distinguishes product support statements, rule applicability, and actual verification; “unsupported” is not an automatic exemption.

- Without an official source, retain `status: awaiting-official-source` and `products: []`.
  Do not populate guessed products, support outcomes, or exception lists.
- Once a source is available, change the matrix to `sourced`, assign an owner, and populate product versions.
  Each product's source must be a reviewed `product-support` source in the same package, with locator/revision
  matching the source record verbatim.
- Populate each rule's `requirementId`, `applicability`, `supportStatus`, `verificationStatus`, `basis`,
  `verificationEvidence`, and `exception`; verified requires an evidence reference.
- `requirementId` is an official rule identifier, not necessarily a KB entry ID. Clause authenticity, exemption
  authorization, and whether dates remain valid require human verification; schema validity does not mean
  the service independently verified the evidence or exemption.
- Update sources/versions for existing records and review them again; do not carry old verification outcomes
  unconditionally into new versions.

Adding a `kind`, `dataSchema`, or structured format requires coordinated changes to:

1. The [JSON schema](../accessibility-kb/schemas/package.schema.json) and any required new schema;
2. Shape, semantic, and file validation in the [authoring validator](tools/knowledge-base.mjs);
3. Corresponding fields, enums, semantics, and the shared file set in the [runtime validator](src/runtime/knowledge.mjs);
4. Schema/version policy, exported content, and compatibility documentation;
5. Positive and negative authoring/runtime tests, including cases where recomputing hashes must not bypass semantic restrictions.

Ajv is used only for development builds. The installed runtime validates independently using built-in Node modules;
it does not automatically execute new schemas or arbitrary input code. **Changing only the JSON schema is an incomplete protocol change.**

## 8. Consumer Layer: Retrieval, Validation, and Security Boundaries

This section's guarantees about queries not being uploaded, fixed download locations, and caching apply to the
**current local snapshot tools**. Future explicit MAS queries will send necessary query fields to the configured
MAS service; see section 11 for those boundaries. Do not apply local snapshot privacy promises or integrity pins
directly to live sources.

| Tool | Input | Current behavior |
|---|---|---|
| `a11y_kb_knowledge_list` | Optional filters below; `{}` still works | Complete filtered `entries`, full selected-closure `sources`, applied `filters`, `facets`, `totalMatches`; does not automatically filter out draft/deprecated entries |
| `a11y_kb_knowledge_search` | Required `query`, 1–256 characters, plus optional filters below | Local case-insensitive whitespace-token matching; all terms must appear in the ID/body; at most 20 `matches`, each with an excerpt of at most 580 characters; `totalMatches` counts all hits before truncation |
| `a11y_kb_knowledge_read` | Required `id`, 1–256 characters; no discovery filters | Reads one complete declared entry, its cited sources, hashes, and a `kb:<id>@<version>` citation |

### 8.1 Exact Discovery Filters and Result Semantics

All supplied filters compose with **AND**, for both list and search; search additionally requires every query term.

| Filter | Matching contract |
|---|---|
| `category` | One of `standard`, `pattern`, `case`, `fix`, `example`; categories may overlap on an entry |
| `standard` | Exact package-local source ID, such as `wcag` or `aria`, with `authority: normative-standard`; not a standard title, version, criterion ID or coverage assertion |
| `sourceId` | Exact package-local source ID, including informative `apg`; use `packageId` to disambiguate IDs reused across packages |
| `packageId` | Exact package ID within the pinned selection; does not include dependency entries in the results automatically |
| `appliesTo` | Exact member of the entry's applicability labels, such as `fluent-v9`; no aliases, wildcards, case normalization or version inference |

`sourceId`, `standard` and the normative requirement of `category: standard` must be satisfied by the **same
directly cited source record**. For example, an entry citing both WCAG and APG does not match
`sourceId: apg` together with `category: standard`, or with `standard: wcag`. There is no source/category/label
inheritance through package dependencies or `relations`, and no inference of installed versions or source revisions.

List/search entries include `packageId`, derived `categories` and full `matchedSources` records. `matchedSources`
contains the entry's cited sources satisfying the source/normative filters; with none of those restrictions it contains
all directly cited sources, possibly empty. List's top-level `sources` remains the full selected source catalog,
not just matched sources. Its `facets` count entries in the **current fully filtered result**, not the unfiltered KB
or a top-20 search page: categories (including zero counts), packages, exact applicability labels and cited sources
(package-qualified full records with counts). Source facets count all citations on matching entries, not only
`matchedSources`. Categories and labels can overlap, so their counts need not sum to `totalMatches`.
Search returns applied `filters` without `query`, and no facets or full top-level source catalog.

There are exactly seven curated tagged entries in the current snapshot; tags are based on their bodies, not automatically
assigned because an entry cites APG, is an implementation contract, has a suggestive title or relates to a case:

| Entry ID | `discoveryTags` |
|---|---|
| `common.topic.dynamic-content` | `pattern`, `example` |
| `common.case.dialog-focus` | `pattern`, `fix`, `example` |
| `fluent.v8.component-contract` | `pattern`, `fix`, `example` |
| `fluent.v9.component-contract` | `pattern`, `fix`, `example` |
| `sharepoint.spds.component-contract` | `pattern`, `fix`, `example` |
| `sharepoint.utilities.announcements-and-focus` | `pattern`, `example` |
| `sharepoint.case.duplicate-announcement` | `fix`, `example` |

`fix` denotes corrective guidance; `example` can be hypothetical or a counterexample, and `case` does not certify
a reproduced historical incident. None of these labels supplies approval, authority or behavioral evidence.
Entries without tags are valid: they have no pattern/fix/example category matches, while directly cited
normative sources and `kind: case` still determine standard/case matches.

A valid query with no match returns explicit `entries: []` or `matches: []` and `totalMatches: 0`, not a
conformance verdict or evidence that no requirement applies. Invalid arguments return MCP tool `isError: true`:
unknown keys, missing required query/ID, arrays/null instead of an argument object, wrong types, blank or over-256
strings, malformed Unicode, invalid category values or malformed identifiers. `standard`, `sourceId`, `packageId`
must start with a lowercase ASCII letter and contain only lowercase ASCII letters, digits or hyphens;
syntactically valid unknown IDs/labels yield no matches, not aliases or fallback.
An unknown read ID is an error. All successful tools retain `contentApprovalVerified: false` and
`independentBehaviorVerified: false`; list/search require full reads via `fullEntryReadRequired: true`.

### 8.2 Usable Local Tool Examples

Send each JSON object as a separate MCP request after initialization, using a compatible service and matching
pinned snapshot. Their IDs are from the current KB.

Discover Common entries directly citing WCAG as a normative source, with an exact web label:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"a11y_kb_knowledge_list","arguments":{"category":"standard","standard":"wcag","sourceId":"wcag","packageId":"common","appliesTo":"web"}}}
```

Browse informative APG citations without pretending APG is normative:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"a11y_kb_knowledge_list","arguments":{"sourceId":"apg","packageId":"common"}}}
```

Find curated Fluent V9 corrective guidance; `MessageBar` must also occur in the entry ID/body:

```json
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"a11y_kb_knowledge_search","arguments":{"query":"MessageBar","category":"fix","packageId":"fluent","appliesTo":"fluent-v9"}}}
```

Read the full returned entry before applying the guidance:

```json
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"a11y_kb_knowledge_read","arguments":{"id":"fluent.v9.component-contract"}}}
```

This valid request deliberately returns no entries: the same source cannot be both informative APG and normative:

```json
{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"a11y_kb_knowledge_list","arguments":{"category":"standard","sourceId":"apg","packageId":"common"}}}
```

Search is not semantic retrieval and has no relevance learning or ranking by authority level. Callers should first
establish scope, then read the complete body, related IDs, and source status. Source metadata, source URLs, and
relationships are not execution instructions.

Loader order: explicit absolute root → identity-validated development checkout → shared per-user cache →
fixed HTTPS artifact. Invalid explicit configuration, an existing but corrupt cache, or a mismatched local pin
produces an error; the loader does not fall back to another version or guess success. Content is revalidated on
every call; editing source files does not enable hot reload that bypasses the pin.

Only the selected **complete package closure** is downloaded; queries are not sent to the download endpoint.
Each HTTPS download is limited to 15 seconds/8 MiB, with at most 1000 files; arbitrary URLs, redirects,
credentials, and path escapes are prohibited. Each stdio frame is limited to 1 MiB. As content grows, first monitor
artifact size and tool output size; exceeding limits requires package partitioning/distribution protocol design,
not simply disabling validation.

## 9. Versioning, Generation, and Publication

### 9.1 Four Kinds of Version/Identity

| Identifier | Meaning |
|---|---|
| `schemaVersion` | Data protocol version; assess an upgrade when changing the parsing contract |
| Each package's `version` | Content package version; maintainers explicitly update it for reviewed releases, and builds do not auto-increment it |
| Service package `version` | MCP/loader implementation version, not the knowledge package version |
| manifest/raw SHA-256 | Exact snapshot and transport-byte identity, not knowledge approval |

Suggested release convention: use patch for small compatible corrections, minor for new compatible entries, and
consider major for incompatible semantic/ID contract changes. Current code checks only a three-part numeric
format, not the business semantics of SemVer; release review must enforce those.

Common, Fluent and SharePoint are at `0.1.1`: Fluent depends on Common `0.1.1`, and SharePoint depends on
both Common and Fluent `0.1.1`. The independently versioned standalone service is at `0.1.0`.
Content changes, including discovery metadata, still require regenerated hashes, manifests, artifacts, index
and service reference. Building them does not publish download URLs or update installations.

**Compatibility:** the runtime must support optional `discoveryTags` to read tagged snapshots; older strict
implementations reject unknown entry fields. The current runtime also accepts untagged snapshots.
Use matching runtime/reference sets for installation, updates and rollback, and retain immutable artifacts.
Snapshot hashes identify exact content; version strings alone do not establish compatibility.

After upgrading Common, update every exact version dependency that directly references it; if Fluent itself also
upgrades, update SharePoint's Fluent dependency too. Review which downstream approved conclusions are affected
by dependency changes.

### 9.2 Build Process

Run the following in order from the repository root:

```powershell
npm ci --prefix knowledge-server
npm run build --prefix knowledge-server
npm test --prefix knowledge-server
npm run check --prefix knowledge-server
npm test
npm run check
```

The first set of commands builds/validates the standalone KB; the last two check that the existing marketplace
has not been broken. Root-level `npm run build` is not the KB builder. External workflows and AT are outside
the verification scope of these local commands.

The standalone build validates authored files → computes dependency closures → generates a canonical manifest →
serializes a `{schemaVersion, manifest, files}` artifact → generates references. Each file has a content SHA-256;
the selected manifest has a `manifestSha256`; the full artifact has a separate raw SHA-256. The full source
manifest and the manifest of a selected closure are **not necessarily identical**.

Generated changes include the source manifest, service reference, new content-addressed JSON, and distribution
index. Do not handwrite hashes, overwrite old artifacts, or delete old versions to “clean the build.” Globally shared
README, schema, and governance documents also contribute to content hashes, so changing them may change
the pins of every selection.

The build first validates all retained history, publishes files with no-replace semantics, updates the index, and
finally updates consumer references; run only one authoring build at a time. Recovery is possible when the complete
current artifact has been written but the index has not; unknown files and missing/corrupt history still explicitly
block progress. This is not a promise that every interruption can be repaired automatically.

### 9.3 Publication Gates

1. A content reviewer confirms sources, versions, permissions, applicability, and private-material boundaries.
2. Local validation and CI pass; review new content, dependency changes, generated pins, and retention of old artifacts.
3. Merge/publish through a PR, not by pushing directly to main; do not bundle cleanup unrelated to the KB.
4. Actually access the reference's HTTPS URL and verify its raw SHA-256 before claiming cold installation works.
  The URL points to a content-addressed file on main; “local build succeeded” does not mean the URL is published.
5. In an explicitly authorized host, verify MCP registration, tool discovery, full reads, and cold/warm caching.
  An offline cache miss must fail; a valid cache hit can work. Simulated transports in automated tests do not replace real host acceptance.
6. Consumers update the service/reference at a safe transition point. Old references continue reading old artifacts;
  for rollback, use the complete reviewed old reference/runtime set. Do not edit hashes or delete caches to fabricate compatibility.

## 10. Testing and Collaborative Acceptance

The table below identifies tests to reuse and extend when making changes; it does not claim exhaustive coverage
of all field combinations. When extending support matrices, lifecycles, or package selection, add corresponding
negative runtime cases and explicitly verify that the artifact's package set matches the service reference;
do not merely update the number of passing tests.

| Change | Tests to add/check |
|---|---|
| New entries/sources/relationships | [Knowledge-base tests](tests/knowledge-base.test.mjs): descriptors, undeclared files, sources and approval, links, and closures |
| New packages or selections | [Reference tests](tests/knowledge-reference.test.mjs): selected/unselected content, versions, explicit roots, and pins |
| Schema, integrity, paths, or caching | [Runtime tests](tests/knowledge-runtime.test.mjs): corruption, out-of-bounds paths, symlinks, incorrect URLs, semantic violations, and concurrency |
| Tool inputs/outputs | [MCP tests](tests/knowledge-mcp.test.mjs): isolated installation, exact IDs, full bodies, sources, and refusal to execute |
| Distribution/publication | [Standalone tests](tests/standalone.test.mjs): old-reference cold starts, artifact retention, interruption recovery, and unchanged existing files |
| Whether knowledge improves judgment | [Effectiveness evaluation rubric](../accessibility-kb/evaluations/README.md): separately authorized real evaluations, not replaceable by unit tests |

The current expected entry sets are 35 for the full closure and 20 for Common alone (Fluent adds 4;
SharePoint adds 11). Check exact IDs as well as counts. When adding content, update justified
counts and expected sets while retaining negative assertions: Common must not leak product knowledge,
unselected packages must not be readable, and missing sources must not yield approved entries. Evaluations must
include at least one genuine-risk sample, one clean counterexample, one missing-context scenario, and one
version/product-inapplicable scenario. Record false positives/negatives, fix layers, evidence calibration, and
regression risks; if something was not run, say so rather than fabricating results.

### Pre-submission Checklist

- [ ] Content belongs to the correct package; common knowledge introduces no product dependency and does not duplicate another package's body.
- [ ] Every file, stable ID, sourceId, and relation is registered and valid.
- [ ] Bodies explain scope, responsibilities, positive/negative examples, and verification gaps; source URLs are not treated as reviewed evidence.
- [ ] Owners/reviewers, versions, and source statuses are truthful; draft content has not been worded to appear as an official requirement.
- [ ] Distribution selection and service references for new packages are explicit; “catalog registration succeeded” is not treated as “the service can read it.”
- [ ] Schema extensions cover both build/runtime without weakening tests that reject invalid input.
- [ ] Build/test/check all pass; generated changes are reviewed and all committed historical artifacts are retained.
- [ ] Required human content/effectiveness reviews are completed or explicitly marked pending; no private run data is committed.
- [ ] Standalone KB contributions preserve existing plugin and workflow boundaries; local tests do not masquerade as publication or real-host checks.

Prefer one PR focused on a domain topic or a group of related contracts, with domain owners reviewing content
and service maintainers reviewing schema, package selection, or runtime protocol changes. For a first contribution,
improving an existing draft entry is easier to validate than simultaneously changing package structure, retrieval
protocol, and knowledge bodies.

## 11. Planned: One KB Endpoint with MAS Rule Capabilities

### 11.1 Agreed Direction and Interfaces Still to Confirm

**Agreed goal:** callers connect only to KB MCP, using it both to query local knowledge and to query authoritative
rules through the KB's internal MAS adapter. MAS is the required rule basis within applicable review scope;
local methods, cases, guessed WCAG mappings, and component support statements cannot replace missing MAS clauses.

| Area | Current implementation | Target implementation |
|---|---|---|
| External endpoint | One local knowledge MCP | The same KB MCP, with explicit additional read-only MAS interfaces |
| MAS source | Pending metadata in the Common package | Built-in MAS MCP client/adapter; manage source metadata separately from actual responses |
| Connection configuration | No MAS configuration parsing | Ship nonsensitive templates with the service; specify trusted connections at deployment, with no live source enabled by default |
| Authentication | Local snapshots need no MAS identity | KB authenticates as a MAS client through the official mechanism; the runtime environment supplies credentials securely |
| Standards basis | Local draft usage guidance | Applicable scope requires MAS rule IDs, actual versions, and citations; missing items mean an incomplete basis |
| Completion checks | No MAS checking capability | May provide a “standards-basis completeness” check, but not a product compliance verdict or PR gate |

**Before implementation, confirm with the MAS service owner:** service identity/endpoint, supported transports,
authentication and authorization scopes, tool names and input/output schemas, unique rule identifiers,
version/revision mechanisms, pagination and rate limits, error semantics, and content caching/redistribution
permissions. This document does not invent MAS addresses, tool signatures, or official rule IDs. Finalize interface
proposals against verified real protocol behavior; the suggested names below are not registered tools.

**Naming clarification:** “MAS MCP” here means the upstream capability that supplies MAS rules, not a confirmed
service product name. The current `sources.mas.note` mentions a candidate “CLEA MCP interface”; whether CLEA
is the actual hosting service and covers this requirement still needs owner confirmation. Do not assume MAS and
CLEA are either two separate services or equivalent names. Once confirmed, use the actual service identity
consistently in source notes, deployment configuration, adapter mappings, and acceptance records; record the
MAS rule-system identity separately from the identity of the service providing it.

### 11.2 Component Relationships and Request Path

```mermaid
flowchart LR
  Host[Review host: registers only KB MCP] --> Entry[Unified KB MCP endpoint]
  Entry --> Local[Existing local knowledge loader]
  Entry --> Rules[Rule queries and basis completeness service]
  Rules --> Adapter[MAS MCP client / adapter]
  Config[Deployment connection configuration and secure credentials] --> Adapter
  Adapter --> MAS[Official MAS MCP]
  MAS --> Bound[Response validation and rule version binding]
  Bound --> Rules
  Local --> Snapshot[Local pins and shared snapshot cache]
  Rules -. only with explicit permission .-> Private[Separate controlled MAS cache]
```

- **Endpoint layer:** preserves the semantics of the three existing local tools and exposes additional MAS
  operations with source identity. “One endpoint” does not mean mixing both content types into search results
  whose sources cannot be distinguished.
- **MAS adapter:** owns MCP initialization, capability/schema checks, a read-only tool allowlist, session lifecycle,
  pagination, timeouts, cancellation, rate limiting, and normalization of official errors. Prefer a compatible official
  MCP SDK selected against the actual transport and authentication contract; do not copy temporary shell-proxy logic.
- **Rules service:** owns minimal query context, response validation, version binding, and basis completeness
  assessment. It must not generate “official clauses” from short summaries or implement a generic proxy for arbitrary upstream tool calls.
- **Local loader:** continues to handle only pinned knowledge snapshots; do not add arbitrary remote URL reads.
  MAS bodies must not enter local snapshot caches or published artifacts.
- **Caller:** reads the complete relevant rules, interprets applicability, and performs authorized real verification.
  MAS responses are source data, not authorization to execute commands, upload repositories, or override system instructions.

When MAS is not configured, the service must still initialize and support local tools; MAS queries return an explicit
not-configured error. This keeps local functionality available without disguising local fallback as an acquired MAS basis.

### 11.3 Files for Colleagues to Change During Implementation

The new paths below are a **proposed layout: they do not yet exist and are not currently available interfaces**.
An implementation PR may adjust names, but should retain separation of responsibilities and update this design.
All executable changes stay within the standalone knowledge service; existing plugin packages are not modified.

| Location | Future implementation work |
|---|---|
| [Authority and applicability](../accessibility-kb/packages/common/requirements/authority-and-applicability.md) | Define the scope in which MAS is mandatory, version selection, clause citations, and missing/conflicting basis handling; do not unconditionally place every task within an unknown scope |
| [Common descriptor](../accessibility-kb/packages/common/package.json) | Update `sources.mas` and new guidance entries/relations. Set `reviewed` only after source review; it does not mean a deployment is connected or a user is authorized |
| Proposed Common addition `requirements/mas-rules.md` | Record rule-query prerequisites, citation format, review usage steps, and boundaries; register it as an entry, without tokens or private connections |
| Relevant procedures such as [Find](../accessibility-kb/packages/common/procedures/find.md) and [design review](../accessibility-kb/packages/common/procedures/review-design.md) | Reference MAS usage requirements; applicable tasks cannot bypass missing basis and claim standards review is complete |
| Proposed addition `knowledge-server/config/mas.example.json` | Nonsensitive configuration template: enable switch, trusted endpoint/transport, authentication references, and explicit timeout/pagination/cache policy; actual values require owner confirmation |
| Proposed addition `knowledge-server/src/mas/config.mjs` | Load and strictly validate deployment configuration; reject unknown/unsafe settings and never accept connections or credentials from model tool arguments |
| Proposed addition `knowledge-server/src/mas/client.mjs` | Dedicated MAS MCP client: capability handshake, read-only tool mapping, identity, and session lifecycle |
| Proposed addition `knowledge-server/src/mas/rules.mjs` | Normalize rule/search responses; handle version binding, applicable context, source errors, and basis completeness checks |
| [MCP handler](src/runtime/knowledge-mcp.mjs) / [entry point](cli.mjs) | Inject the MAS service and add tools/error boundaries; do not replace existing tool names or static behavior |
| [Package](package.json) / [lockfile](package-lock.json) | If the MCP SDK/authentication requires runtime dependencies, declare and lock them explicitly and update installation instructions; do not continue claiming a zero-dependency MAS runtime |
| Proposed additions `knowledge-server/tests/mas-config.test.mjs`, `mas-client.test.mjs`, `mas-rules.test.mjs` | Positive/negative tests for configuration, protocol, versions, and errors; synthetic inputs must not masquerade as live qualification |
| [MCP tests](tests/knowledge-mcp.test.mjs) / [standalone tests](tests/standalone.test.mjs) | One host endpoint, local-tool compatibility, minimal installation, and isolation when MAS is unavailable |
| [Contribution guidelines](../accessibility-kb/governance/contribution.md), [evaluation rubric](../accessibility-kb/evaluations/README.md), [README](README.md), and this document | Approval/confidentiality policy, misuse counterexamples, actual registration methods, runtime dependencies, and verified capabilities |

Connection settings do not belong in entry/source descriptors or the [generated reference](references/knowledge.json).
`sources.mas.locator` locates the rule source; it is not a general transport/auth configuration field. If rule responses
require a new structured protocol, define a separate schema and its validation; do not insert ad hoc unknown fields
such as endpoints or tokens into the content schema. Content changes still generate new snapshots and retain
old pins as described in section 9.

### 11.4 Configuration and Authentication: Ship Capabilities, Not Identities

The package provides the adapter, schemas, configuration templates, and default information permitted for
distribution; **actual deployment values remain outside the repository**. A future explicit environment variable
(for example, `A11Y_ASSIST_MAS_CONFIG`, with its name to be finalized during implementation) could point to an
absolute configuration path. This variable is not recognized today; setting it now will not make MAS available.

At minimum, the configuration contract specifies an explicit enabled state, transport, trusted target, authentication
method reference, request deadline, retry/pagination limits, allowed read-only capabilities, and caching policy.
Invalid configuration must fail before MAS use, without guessing an address, skipping authentication, or switching
sources. Whether a configuration error fails the entire startup remains to be finalized by error type; unconfigured
or disabled MAS must not block the existing local knowledge tools.

- Endpoints come from trusted administrator/user configuration; the model cannot specify URLs or arbitrary
  execution commands through query arguments. If the official service supports only stdio, permit only trusted
  configured executables and fixed arguments; never execute commands from rule bodies.
- Use officially supported authentication with explicit audience/scopes; do not blindly forward host tokens upstream.
  When user login is required, use the host/official authorization flow; never ask for secrets in model conversation.
- Credentials come from secure storage or the runtime environment, never templates, logs, artifacts, error bodies,
  or test fixtures. Logs contain only permitted diagnostic metadata; sanitize upstream errors before returning them.
- A MAS query sends necessary domain fields to that service, such as rule ID, version, product/platform context,
  or minimal query text. By default, do not send source code, work items, account/machine inventories, or whole
  conversations. Free text needs length and data boundaries, and callers must be clearly told it will be sent upstream.
- Enable only official read-only query capabilities; do not expose rule updates, tenant administration, file reads,
  provider execution, or similar functionality.

### 11.5 External Capabilities and Rule Responses (Proposed, Not Implemented)

The following additions are proposed within the same KB MCP. Final names/parameters require review against
the actual MAS protocol:

| Proposed KB tool | Purpose | Key restrictions |
|---|---|---|
| `a11y_kb_mas_status` | Report states such as unconfigured, disabled, awaiting authentication, unavailable, or confirmed queryable | Distinguish configured from actually probed successfully; success includes verification scope/time, not readiness inferred from configuration alone |
| `a11y_kb_mas_search` | Find candidate MAS clauses by rule/product context | Return candidates and pagination/completeness information; top-N results are not all applicable requirements |
| `a11y_kb_mas_read` | Read the complete basis by exact rule ID and requested version | Explicitly fail or report incompleteness if that version is unavailable or the response is summarized/truncated; do not automatically substitute latest |
| `a11y_kb_mas_check_basis` | Check whether the caller's submitted basis set has the required sources/versions/context | Checks basis completeness only; caller-supplied IDs do not prove rules were read, and no product PASS is issued |

A proposed common response envelope identifies `source: mas`, source identity from the configured service, rule ID,
actual standard version/revision, official locator, retrieval time, full-body/summary classification, content completeness,
and applicable context. A hash can identify received bytes but does not by itself prove official authenticity or
complete rule coverage. Mark information not returned by the official service as unknown, rather than inferring it
in the adapter; missing required fields must prevent the basis check from passing.

Pin the rule version and acquired basis references for a review. If the upstream offers only a floating latest or cannot
provide a traceable revision, report insufficient version basis rather than silently mixing revisions. Confirm reference
retention/caching permissions first; if storing bodies is not permitted, retain only permitted IDs, versions, and
references and revalidate at use time. Do not treat a new query result as the original result. Identity-dependent
query results must not be reused across users/tenants.

### 11.6 “Must Follow MAS”: Policy and Enforcement Boundaries

**Policy belongs in the knowledge layer, basis checks in the service layer; consumers still own review execution
and publication gates.** This design does not silently change existing workflow gates.

For tasks confirmed to be subject to MAS, callers first obtain scope/standard version, inspect candidates and read
the complete relevant rules, record rule IDs, versions, applicability, and grounds for exceptions, and only then form
review conclusions. Request context when scope cannot be confirmed; “unknown” is not “inapplicable.” Exceptions
need formally authorized grounds; lack of component support does not automatically grant an exemption.

Basis checks should return explicit `complete` / `incomplete` results and gap reasons (final enum pending protocol
review). `complete` means only that the **specified scope and submitted basis set** satisfy the check. It does not
prove that search covered all MAS rules or that a product implementation complies, and does not authorize automatic
Bug closure or PR publication. To enforce a block on downstream review completion, the consumer must explicitly
invoke and enforce the check; merely adding a tool cannot guarantee callers will use it.

| Situation | Required outcome |
|---|---|
| Unconfigured/disabled/insufficient authentication | MAS is unavailable or authentication is required; local knowledge remains usable but cannot replace MAS |
| Timeout, rate limit, upstream error | Bounded failure/retries with distinguishable errors; never a success-shaped empty rule set |
| No search results | Explicitly means no match for this query only, not proof that the task has no applicable rules |
| Unfinished pagination or truncated results | Mark incomplete; do not claim all standards are covered |
| Requested rule or version does not exist | Exact failure; no substitution with approximate rules, WCAG mappings, or latest |
| Source conflict/revision change/unknown scope | Preserve conflicts and gaps and request confirmation; do not automatically adjudicate or mix the basis |
| Complete basis but no real verification performed | Report only standards-basis readiness; runtime behavior remains unverified, with no compliance PASS |

### 11.7 Isolating MAS Caching from Static Publication

For the first version, **disable persistent MAS body caching** and process data only within explicitly authorized
request/session scope. Implement caching only after the service owner explicitly permits storage, validity periods,
revocation, user isolation, and redistribution. Cache keys must account for service identity, authorization context,
rule ID, and version; both content and access must be controlled.

Place caches in a separate controlled location outside the repository, not in the local public snapshot cache, Git,
KB manifest, or knowledge-distribution. Offline operation, expiry, permission changes, and unverifiable revisions
must not silently reuse old clauses as current MAS. If the official service allows offline pinned versions, separately
define validity periods and a policy explicitly selected by the caller. Static snapshot pins and live MAS basis use
separate source identities; never write live responses directly into files associated with an old pin.

### 11.8 Phased Delivery and Acceptance

1. **Protocol confirmation:** complete the endpoint/transport/auth/schema/version/permission checklist with the
   owner and obtain authorized interface examples. Keep implementation blocked without a real contract;
   mocks cannot substitute for official readiness.
2. **Adapter implementation:** implement configuration, secure authentication, handshake, allowlisted tools, and
   response validation while maintaining local-tool compatibility. Separately review new SDK/runtime dependencies
   and the minimal installation package; update zero-dependency claims and installation instructions.
3. **Rule semantics:** implement version binding, complete rule reads, pagination, and standards-basis checks;
   update Common policy and guidance.
4. **Automated tests:** use a clearly labeled synthetic MAS server to cover success, unknown tools/schemas,
   authentication/timeouts/rate limits, incomplete pagination, version drift, missing fields, error sanitization,
   rejection of arbitrary URLs/tools, and cross-identity cache isolation. When returned bodies contain instruction
   injection, verify that no commands execute, no secrets are forwarded, and authorization does not expand.
5. **Single-endpoint integration:** an isolated host registers only KB and can use MAS tools; all three local tools
   remain usable when MAS is unconfigured/offline. Confirm that MAS tools are not actually supplied through a
   second endpoint registered separately by the host.
6. **Real qualification:** in an explicitly authorized environment, use the real MAS service to verify authentication,
   original rule text/versions, citations, and failure modes; record reviewable results. Then run positive/negative
   evaluations demonstrating “missing MAS does not yield false completion,” “incorrect versions are not applied,”
   and “a complete basis does not equal product compliance.”

Only after this acceptance is complete should the corresponding capabilities in the README and this section
change from “planned” to supported.