# Standalone accessibility knowledge service

This is an independent, read-only stdio MCP service for the
[Common / Fluent / SharePoint KB](../accessibility-kb/README.md).
It does not install, replace or register any marketplace plugin. Existing plugin
skills, knowledge, operational MCP servers, configuration and workflows remain
unchanged. A host administrator may register this service alongside them; it is
not discovered automatically by installing a plugin.

For contributors and maintainers, see the
[technical design and extension guide](TECH-DESIGN.md) / [简体中文](TECH-DESIGN.zh-CN.md): architecture,
content placement, entry/package examples, source review, schemas, tests and releases.

The [AgentOW migration audit](AGENTOW-MIGRATION-AUDIT.md) /
[迁移审查（简体中文）](AGENTOW-MIGRATION-AUDIT.zh-CN.md) maps the pinned upstream
references to implemented Common, Fluent and SharePoint rules: B01–B16 coverage,
three added utility entries, and an exact 35-entry index. Migration of the audited
reusable accessibility rules from AgentOW commit
`7896845e51d75b0b9d632a2fd61876bc2f556ea5` is complete in the authored packages.

| Contribute to | Current content at version 0.1.1 |
|---|---|
| [Common](../accessibility-kb/packages/common/README.md) — 20 entries | Semantics, async outcome/focus matrices, localization, root-cause and verification cases |
| [Fluent](../accessibility-kb/packages/fluent/README.md) — 4 entries | V8/V9 MessageBar, announcement/focus ownership, component documentation and composition |
| [SharePoint](../accessibility-kb/packages/sharepoint/README.md) — 11 entries | SPDS fit/imports, announcement/focus utilities, RTE, drag/reorder, formatting, themes and host checks |

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
| `a11y_kb_knowledge_list` | Selected IDs, applicability and source readiness |
| `a11y_kb_knowledge_search` | Local bounded excerpts; read full entries before use |
| `a11y_kb_knowledge_read` | One complete declared entry, hash and source metadata |

No source writes, arbitrary file/URL reads, provider operations, setup, browser,
AT or test execution are exposed. Knowledge content cannot grant such authority.

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

Content package versions are coordinated at `0.1.1`; the standalone service's
implementation version is `0.1.0`. Authored coverage and published snapshot identity
are separate: consumers read only the versions and hashes in their generated reference.

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