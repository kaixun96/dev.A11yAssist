# Standalone accessibility knowledge service

This is an independent, read-only stdio MCP service for the
[Common / Fluent / SharePoint KB](../accessibility-kb/README.md).
It does not install, replace or register any marketplace plugin. Existing plugin
skills, knowledge, operational MCP servers, configuration and workflows remain
unchanged. A host administrator may register this service alongside them; it is
not discovered automatically by installing a plugin.

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
caller-selected URLs. Search queries and source code are never uploaded.
Validated cached content works offline; a cold offline install fails explicitly.

**Release gate:** generated URLs target reviewed artifacts on `main`. A PR build
does not publish those URLs. Before merging/publishing, use the matching local
KB root for evaluation. Do not advertise cold-install readiness until the exact
URL and raw SHA-256 have been verified after publication. Automated transport
tests are synthetic; real Copilot tool discovery remains a separate host check.

All 32 entries are draft (Common 20, Fluent 4, SharePoint 8). Missing company,
component and support sources remain explicit gaps, not inferred rules. A hash
pin proves content identity, not approval, accessibility conformance, or parity
with existing plugin knowledge.

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