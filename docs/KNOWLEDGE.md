# Knowledge ownership and consumption

[accessibility-kb](../accessibility-kb/README.md) is the current, portable
authoring and consumption root. Its Common, Fluent and SharePoint packages
declare stable entry IDs, exact dependencies, source status, scope and review
readiness. See [the development design](KB-DEV-DESIGN.md).

## Read and author the current KB

- Start generic questions with [Common](../accessibility-kb/packages/common/README.md):
  foundations, component semantics, keyboard/focus, forms/content, dynamic content
  and visual accessibility, plus shared analysis, verification and task methods.
- Select [Fluent](../accessibility-kb/packages/fluent/README.md) for the actual
  framework version, and [SharePoint](../accessibility-kb/packages/sharepoint/README.md)
  for SPDS, host utilities and product applicability. Common has no product or
  framework dependency; product packages reuse it rather than duplicate its rules.
- Resolve entries through the [catalog](../accessibility-kb/catalog.json) and
  package descriptors. Read the applicable entry and its source status and
  relationships, not only a search snippet or title.
- Author content in the appropriate KB package and declare it in that package's
  descriptor. Follow the [contribution policy](../accessibility-kb/governance/contribution.md)
  and [qualification rubric](../accessibility-kb/evaluations/README.md).

The current topics and methods are draft read-only guidance. They cover
root-cause analysis, implementation responsibilities, static/dynamic/design
verification, test planning and find/fix/prevent tasks. MAS/CLEA and official
product support source connections remain pending. No API, requirement mapping,
approval or support claim can be inferred from an absent source or an archived
example. Applicability, support and verification are separate decisions.

Optional AT methods are reference knowledge, not runtime or operating-system
prerequisites for reading the package. Code changes, tests and real-page/AT
operations require the caller's separately authorized workflow. Static guidance
does not establish observed behavior or replace evidence gates.

## Distribution

- `a11y-knowledge` is the single independently installable, ODSP-oriented read-only
  knowledge plugin. It references only the current Common, Fluent and SharePoint
  KB. Its skill routes only to current KB entries. It has its own knowledge
  stdio MCP server, no providers or operational tools, and does not require a workflow.
- The seven execution plugins reference Common, Fluent and SharePoint.
  Each adds its own read-only knowledge MCP
  server without calling or separately installing a knowledge plugin. Their
  execution runtimes remain standalone; knowledge access grants no execution authority.
- `a11y-bug-bash` adds bounded discovery with the SAME single authored knowledge
  skill at `modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md`. Build replaces
  only its knowledge tool prefix for this plugin. The internal module has no
  manifest, runtime, references or additional public commands; `${PLUGIN_ROOT}`
  remains the top-level installed root. Its own knowledge MCP uses the top-level
  references and current KB, not a second rule copy. Separately authorized host
  page/AT checks belong to the discovery track, never the read-only knowledge
  substep. See [Bug Bash](BUG-BASH.md).
- `a11y-setup` selects the same current KB through its own read-only knowledge MCP.
  Its scoped Windows script and dependency templates are a separately authorized
  host-preparation feature, not operational MCP and never a knowledge prerequisite.
- All ten knowledge servers require Node.js 22+ and an MCP-enabled host, not
  providers, `A11Y_ASSIST_CONFIG` or manual KB pre-setup. Build copies the shared
  Node-builtins-only [knowledge loader](../src/runtime/knowledge.mjs) and knowledge
  MCP entrypoint into each plugin. These are the **only two runtime files** in
  both knowledge and Bug Bash; operational MCP/runtime, browsers and AT are excluded.
- For the current KB, each plugin contains only a JSON descriptor and setup
  README under its references directory, never a plugin-local accessibility KB
  content tree. The shared [root KB](../accessibility-kb/README.md) is retained.
  Common remains a portable internal layer and can also be consumed independently
  by other authorized products; it is not a separate plugin.
- The descriptor uses `schemaVersion: 1`, `kind: shared-accessibility-kb`,
  `rootEnv: A11Y_ASSIST_KB_ROOT`, `developmentRoot: ../../accessibility-kb`, an
  exact-version `packages` map, `manifestSha256` and `distribution: { url, sha256 }`.
  The manifest hash binds the
  **selected export manifest**, including dependency closure, not necessarily
  the full [source manifest](../accessibility-kb/manifest.json). An external
  consumer's Common-only reference remains Common-only even when its shared
  root holds all packages; all ten plugins select Common/Fluent/SharePoint
  (currently 32 entries).
- [The release manifest](../release.json) binds authoring manifests separately
  from the plugin selection pins.
  Integrity verification establishes neither conformance nor content approval.
- Build refreshes the source KB manifest and lightweight references and emits
  one current Common artifact for independent external content consumers and
  one ODSP (Common/Fluent/SharePoint) artifact
  under root `knowledge-distribution/`, never inside plugins. These are release
  artifacts, not another authoring root. Check mode rejects stale or unexpected generated files, including
  plugin-local current KB trees. Isolation checks prevent operational guidance
  from entering Common-only selection.
## Single-plugin read-only consumption

Install the desired plugin, use Node.js 22+, enable its registered knowledge MCP
server and restart the host when required. No peer knowledge plugin or execution
configuration is needed, even when using knowledge from an execution plugin.
Each plugin registers an additional stdio server launched as
`node ${PLUGIN_ROOT}/runtime/knowledge-mcp.mjs <plugin-name>`.
The host resolves the plugin-root placeholder; the model need not see environment
variables or launch the process itself. Other harnesses must load the registration
and resolve that root, not assume skill discovery also enables MCP.

The tool prefix is the plugin name with hyphens replaced by underscores:

| Tool | Input and use |
|---|---|
| `<prefix>_knowledge_list` | List the selected entries and choose relevant IDs |
| `<prefix>_knowledge_search` | `query`: narrow entry selection; snippets are not full rules |
| `<prefix>_knowledge_read` | `id`: read actual entry content with citations and source metadata |

For the unified ODSP `a11y-knowledge` plugin the exact names are
`a11y_knowledge_knowledge_list`, `a11y_knowledge_knowledge_search` and
`a11y_knowledge_knowledge_read`.
Bug Bash uses `a11y_bug_bash_knowledge_list`,
`a11y_bug_bash_knowledge_search` and `a11y_bug_bash_knowledge_read`.
Setup uses `a11y_setup_knowledge_list`, `a11y_setup_knowledge_search` and
`a11y_setup_knowledge_read`. Its internal Bug Bash setup instructions use the
containing Bug Bash server and top-level references, not a nested server.
List first, then select and read actual applicable entries before using them.
Retain citations, source readiness, scope and uncertainty in answers. Pending
sources remain missing authority; a successful tool call is not conformance.

Read-only skills may use these registered read-only knowledge MCP calls and
narrowly relevant source/reference file reads, but never shell, setup helper,
test, scanner, browser, AT or operational tools. Failure to load tools or content
is explicit; request the relevant host/network/local-KB configuration rather than
claiming to have read unavailable knowledge. No runtime/provider authority follows
from knowledge access.

### Lazy resolution and shared cache

Loading occurs on a knowledge tool call, not when starting the server:

1. If `A11Y_ASSIST_KB_ROOT` is set, it must be an absolute path to a compatible
  local shared KB. An invalid configured path or content fails without fallback.
2. Otherwise, use the development KB only in a validated repository
  `plugins/<name>` layout. Do not guess siblings or the current working directory
  for installed plugins; invalid content in a selected local KB is an error.
3. Otherwise, use the shared per-user cache: `LOCALAPPDATA/A11yAssist/knowledge`
  on Windows or `homedir/.cache/a11y-assist/knowledge` elsewhere. Optional
  `A11Y_ASSIST_KB_CACHE_ROOT` must be absolute and overrides only the cache root.
4. If the pinned artifact is absent from the cache, lazily download it over HTTPS,
  verify it and cache it outside the plugin. No manual pre-setup is needed for
  normal use of a release whose matching artifacts have been published.

Every request validates cache content, exact selected versions, dependency closure,
the selected manifest and file hashes. Tampered cache content fails explicitly;
it is **not** silently repaired or replaced by another download. Already cached,
verified content works offline. First offline use fails explicitly unless a
compatible local KB is configured (including a valid development layout).

### Pinned download and release boundary

The reference URL must be exactly
`https://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/<manifestSha256>.json`.
This is a content-addressed filename under a fixed `main` path, not an arbitrary
caller URL or a commit URL. `distribution.sha256` binds artifact bytes;
`manifestSha256` binds the selected manifest, which binds every file. Exact
package versions and structural validity are checked as well. The runtime accepts
no caller-supplied download URL or credentials, follows no redirects, and bounds
downloads to **15 seconds and 8 MiB**. It fetches only the pinned artifact: no
knowledge query or user code is sent to the server, and source-document URLs in
entries do not authorize additional network requests.

Commit and publish both current root distribution artifacts alongside the
generated plugins to the reachable reference origin through the reviewed release
process. Building locally does not publish them; uncommitted hash URLs are not
known to exist publicly, and existing installed marketplace versions are not
updated by these source changes. No remote push or publishing is implied here.

The repository [reference helper](../tools/knowledge-reference.mjs) remains an
optional advanced integration for hosts that supply local KB context themselves.
Its explicit absolute `kbRoot` option precedes `A11Y_ASSIST_KB_ROOT`, with invalid
configured roots failing without fallback. It uses repository development
dependencies and is not shipped in plugins or required for normal installation.
Skills never execute it as setup.

After a KB edit, build to update the source manifest, reference pins and root
artifacts, publish the matching release, then refresh compatible plugin references
and KB context at a safe point. An
unchanged version number does not bypass a changed content hash. Do not hot-reload
source edits into an active workflow; retain its compatible pinned versions.
See [the design contract](KB-DEV-DESIGN.md) and [release process](RELEASING.md).

## Execution and access boundaries

The current KB does not install or connect ADO, browser, AT or resource services.
Provider setup and workflow evidence gates are separate execution concerns.
Updating knowledge does not change active workers or authorize an unverified
delivery. Access permissions and [licensing](../LICENSE) remain separate
requirements; private operational notes and real evidence do not belong in the KB.
