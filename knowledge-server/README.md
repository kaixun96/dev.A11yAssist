# Standalone accessibility knowledge service

This is an independent, read-only stdio MCP service for the
[Common / Fluent / SharePoint KB](../accessibility-kb/README.md).
It does not install, replace or register any marketplace plugin. Existing plugin
skills, knowledge, operational MCP servers, configuration and workflows remain
unchanged. A host administrator may register this service alongside them; it is
not discovered automatically by installing a plugin.

The ultimate target is to replace `a11y-knowledge`, `a11y-knowledge-odsp` and
duplicate embedded knowledge after service readiness and consumer migration
acceptance. That is not the current installation behavior: callers such as Bug
Bash still review source, execute separately authorized checks, make conclusions
and report results. The discovery upgrade implements neither an Execution MCP
nor MAS integration.

For contributors and maintainers, see the
[technical design and extension guide](TECH-DESIGN.md) / [简体中文](TECH-DESIGN.zh-CN.md): architecture,
content placement, entry/package examples, source review, schemas, tests and releases.

The [AgentOW migration audit](AGENTOW-MIGRATION-AUDIT.md) /
[迁移审查（简体中文）](AGENTOW-MIGRATION-AUDIT.zh-CN.md) maps the pinned upstream
references to implemented Common, Fluent and SharePoint rules: B01–B16 coverage,
three added utility entries, and an exact 35-entry index. Migration of the audited
reusable accessibility rules from AgentOW commit
`7896845e51d75b0b9d632a2fd61876bc2f556ea5` is complete in the authored packages.

| Contribute to | Current authored content at version 0.1.2 |
|---|---|
| [Common](../accessibility-kb/packages/common/README.md) — 20 entries | Semantics, async outcome/focus matrices, localization, root-cause and verification cases |
| [Fluent](../accessibility-kb/packages/fluent/README.md) — 4 entries | V8/V9 MessageBar, announcement/focus ownership, component documentation and composition |
| [SharePoint](../accessibility-kb/packages/sharepoint/README.md) — 11 entries | SPDS fit/imports, announcement/focus utilities, RTE, drag/reorder, formatting, themes and host checks |

Organize knowledge on two independent axes: **scope** (`common`, `fluent`,
`sharepoint`) and **type** (standards, patterns, cases, fixes, examples). WCAG and
WAI-ARIA normative requirements belong in Common; APG is distinct informative
guidance, not a normative standard. Framework/product packages describe their
scoped implementation responsibilities, not duplicate standards.

Extend the owning body, bind the source in its package descriptor, add a scoped
positive/negative example, and update navigation, relations and exact dependencies.
The design's sections 3–7 explain placement and authoring; sections 9–10 cover release
and acceptance. All 35 entries remain draft: pinned historical provenance establishes
the migrated basis, not official approval, current installed-version validity or
observed conformance. Official MAS and product-support acquisition are separate work.

**Planned, not implemented:** section 11 of that design specifies one KB MCP
entrypoint for both local knowledge and authoritative MAS rules, with a MAS MCP
adapter inside this service. Hosts will not need to orchestrate a second MAS
server registration. Deployment credentials stay outside the package. No MAS
connection, proposed MAS tool, or basis-completeness check is available yet.

## Host registration

Use Node.js 22 or later. Configure a **stdio** MCP server in the host's supported
configuration UI with these values:

- Command: the trusted Node executable (prefer its absolute path).
- Arguments: the absolute path to this directory's `cli.mjs`, and nothing else.
- Environment (optional): `A11Y_ASSIST_KB_ROOT` set to the absolute path of the
  exact matching KB snapshot; `A11Y_ASSIST_KB_CACHE_ROOT` for a shared cache path.

Do not use `npm start` as the MCP command: npm may print banners to stdout.
The runtime needs only `package.json`, `cli.mjs`, `src/runtime/`, `references/`
and this README/LICENSE. It has no runtime npm dependencies. Keep the directory
structure when copying it outside a checkout. `tools/`, `tests/`, `node_modules/`
and the repository are not required for the installed service.

Registered tools:

| Tool | Result |
|---|---|
| `a11y_kb_knowledge_list` | Optional filters; complete matching entries, full selected source catalog, applied filters, facets and totalMatches; `{}` still lists the pinned selection |
| `a11y_kb_knowledge_search` | Required query plus optional filters; local bounded matches, applied filters and totalMatches before truncation; read full entries before use |
| `a11y_kb_knowledge_read` | Unchanged: required exact entry ID, complete body, citation, hash and cited source metadata; no discovery filters |

No source writes, arbitrary file/URL reads, provider operations, setup, browser,
AT or test execution are exposed. Knowledge content cannot grant such authority.

## Discovery contract

List and search accept the same optional filters, all combined with **AND**:

| Argument | Exact matching meaning |
|---|---|
| `category` | `standard`, `pattern`, `case`, `fix` or `example` |
| `standard` | Package-local normative source ID, e.g. `wcag` or `aria`; not a version or criterion ID |
| `sourceId` | Package-local source ID, including informative `apg`; pair with `packageId` to disambiguate |
| `packageId` | Package in the pinned selection; does not automatically include its dependency entries in results |
| `appliesTo` | Exact applicability label, e.g. `fluent-v9`; no aliases, wildcard matching or version inference |

Source filters and the normative requirement of `category: standard` must match
the **same directly cited source**. Thus `sourceId: apg` plus `standard: wcag` or
`category: standard` returns no matches, even if an entry cites both sources.
No sources, categories or applicability labels are inherited through dependencies
or relations. `standard` means a cited normative source, not that an entire norm
or criterion is covered, current, approved or satisfied.

`kind` remains the primary authoring role. Optional `discoveryTags` contains 1–3
unique values from `pattern`, `fix`, `example`; `case` derives from `kind: case`.
The seven curated entries are `common.topic.dynamic-content`,
`common.case.dialog-focus`, `fluent.v8.component-contract`,
`fluent.v9.component-contract`, `sharepoint.spds.component-contract`,
`sharepoint.utilities.announcements-and-focus`, and
`sharepoint.case.duplicate-announcement`. See the
[design's tag table](TECH-DESIGN.md#81-exact-discovery-filters-and-result-semantics)
for their exact tags. Tags are not automatic APG/implementation-contract heuristics.
Corrective guidance and hypothetical examples do not assert proven historical
fixes; neither tags nor case classification supplies behavioral evidence.

List/search entries include `packageId`, derived `categories` and full
`matchedSources` records satisfying source/normative filters (all directly cited
sources when unrestricted). List's `facets` count the **current fully filtered
result** by category, package, applicability and package-qualified cited source,
not the unfiltered catalog or top-20 search results. Category facets include zero
counts; source facets count all citations on matching entries, not only
`matchedSources`. Overlapping categories/labels need not sum to `totalMatches`.
List also returns the full selected `sources` catalog and `totalMatches`.
Search returns neither facets nor that top-level source catalog.

Search still requires a nonblank `query`: case-insensitive whitespace-separated
terms must **all** occur in the entry ID/body, not merely metadata. It returns at
most 20 matches, with excerpts of at most 580 characters and `totalMatches` for
all hits before truncation. Returned search `filters` excludes `query`.
Search is not semantic retrieval or authority ranking. List/search set
`fullEntryReadRequired: true`; read full bodies and applicable sources before use.

A valid no-match request returns `entries: []` or `matches: []` and
`totalMatches: 0`, not “no requirements apply.” Invalid arguments return
`isError: true`: unknown keys, missing required arguments, non-object arguments,
wrong types, blank/over-256 strings, malformed Unicode, invalid categories or
malformed IDs. Source/standard/package IDs start with a lowercase ASCII letter
and contain only lowercase ASCII letters, digits or hyphens;
syntactically valid unknown filter values return empty results. Unknown read IDs
are errors. All successful tools keep `contentApprovalVerified: false` and
`independentBehaviorVerified: false`; results never confer review or execution authority.

For copyable MCP requests, including a deliberate same-source no-match example,
see [local tool examples](TECH-DESIGN.md#82-usable-local-tool-examples) /
[本地工具示例](TECH-DESIGN.zh-CN.md#82-可用的本地工具示例).

## Resolution and publication status

Resolution is lazy: tool discovery never downloads knowledge. The first read uses:

1. An explicit absolute `A11Y_ASSIST_KB_ROOT` (invalid settings fail, no fallback).
2. The validated development checkout's sibling `accessibility-kb/` directory.
3. The shared per-user cache (Windows: `%LOCALAPPDATA%/A11yAssist/knowledge`).
4. The exact HTTPS artifact URL pinned in `references/knowledge.json`.

The full selected package closure is cached once per user and snapshot, not
copied into plugins. Hashes, file inventory, dependencies and package versions
are verified on every read. Corruption fails without automatic replacement.
Downloads are limited to 15 seconds and 8 MiB with no redirects, credentials or
caller-selected URLs. Current local knowledge searches do not upload queries or
source code. Planned explicit MAS queries will send only necessary query context
to the configured MAS service under the separate boundaries in the design.
Validated cached content works offline; a cold offline install fails explicitly.

**Release gate:** generated URLs target reviewed artifacts on `main`. A PR build
does not publish those URLs. Before merging/publishing, use the matching local
KB root for evaluation. Do not advertise cold-install readiness until the exact
URL and raw SHA-256 have been verified after publication. Automated transport
tests are synthetic; real Copilot tool discovery remains a separate host check.

Authored Common, Fluent and SharePoint content versions are coordinated at
`0.1.2`, including exact dependencies. The standalone service upgrade is `0.2.0`,
independently versioned for the discovery API/runtime, not a content version.
The service package/lockfile and generated snapshot/reference are updated together;
building artifacts does not publish download URLs or upgrade installations. Authored coverage and published
snapshot identity are separate: consumers read only the versions and hashes in
their generated reference; changing metadata is not a publication or automatic update.

**Directional compatibility:** the new server reads old snapshots without
`discoveryTags`; absent tags produce no pattern/fix/example matches, while direct
normative citations and `kind: case` still support standard/case discovery. The
old strict server cannot read new tagged packages: it rejects the new entry
field, even though `schemaVersion` remains 1. Old installations retain their old
runtime/reference pins and read old content without the new filters/tags.
To use content 0.1.2, upgrade the compatible service and reviewed reference
together at a safe transition point. A new server with an old matching reference
still reads the old snapshot; it never infers tags or silently moves the pin.
Rollback requires the complete matching old runtime/reference set.

## Development and release

From this directory, use `npm ci`, `npm run build`, `npm test`, and `npm run check`.
Ajv is a development-only schema validator. Root marketplace commands remain
unchanged; [standalone CI](../.github/workflows/knowledge.yml) runs both suites.

The independent builder writes only the KB manifest, server reference and
`knowledge-distribution/`. It never invokes the plugin builder. Published
content-addressed artifacts and their raw hashes are retained in the distribution
index. New snapshots add artifacts; they do not delete old pins needed by older
cold installs. Corrupt or missing retained files stop the build. Restore reviewed
original bytes rather than changing a consumer's pin to hide corruption.
Run one authoring build at a time. Update package versions for reviewed releases,
review sources/ownership and generated hashes, run both suites, then publish
through a reviewed PR. Publication requires the repository owner's applicable
internal-use and redistribution authorization; this package grants no new license.

This service has its own package/lockfile and does not change the marketplace
catalog, release metadata, existing homepages or existing plugin installation.