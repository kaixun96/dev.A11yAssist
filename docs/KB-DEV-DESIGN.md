# Shared accessibility KB development design

Status: draft architecture using shared KB references and pinned lazy distribution;
content qualification and external source connections remain pending. The KB does
not authorize AT, source changes during a Bug workflow, or weaker evidence gates.

## 1. Goals and non-goals

The versioned, portable authoring source supports **find**, **fix**, and
**prevent** accessibility issues. Requirements and implementation knowledge are shared
across static analysis, real-page/AT verification, optional design review and
accessibility test planning. Consumers share a verified local or per-user cached
KB instead of receiving a content copy in every plugin. Any single plugin provides
its own read-only knowledge MCP server, which resolves pinned content on tool calls
without manual KB pre-setup, peer plugins or execution configuration. Node.js 22+
and an MCP-enabled host are required. Draft content is not approved guidance.

The KB does not install tools, acquire machines, carry private configuration,
grant access, replace MAS, certify compliance, or implement an autonomous testing
engine. Workflow/runtime contracts remain authoritative for execution. MAS is a
company requirements source; the KB must not infer a legal conclusion from a
product support list or an unreviewed standards mapping.

## 2. Architecture and authoring boundary

```text
accessibility-kb/                  portable content root
  catalog.json                    stable package IDs and relative descriptor paths
  schemas/package.schema.json     versioned descriptor shape
  packages/common/                cross-product methods and generic topics
  packages/fluent/                version-specific framework contract routing
  packages/sharepoint/            SPDS, host utilities and product applicability
  governance/                     contribution and review policy
  evaluations/                    KB/agent qualification scenarios (not product UT)
src/skills/                       authored harness-specific skill adapters
tools/knowledge-base.mjs           local validation and dependency-closed export
tools/knowledge-reference.mjs      optional advanced local host resolution helper
src/runtime/knowledge.mjs          shared Node-builtins-only knowledge loader
src/runtime/knowledge-mcp.mjs      read-only stdio knowledge server
tools/build.mjs                    shared manifest, references and release artifacts
knowledge-distribution/            one current Common and one ODSP artifact
  <manifestSha256>.json            content-addressed release file, not authoring
plugins/<name>/references/
  knowledge.json                  package/manifest pins plus distribution URL/hash
  README.md                       read-only consumption and optional configuration
plugins/<name>/runtime/
  knowledge.mjs                   generated shared loader copy
  knowledge-mcp.mjs               generated stdio entrypoint copy
```

All current knowledge authoring uses
[accessibility-kb](../accessibility-kb/README.md). Installed consumers resolve its
pinned local or distributed exports. Generic guidance starts
in [Common](../accessibility-kb/packages/common/README.md); Fluent and SharePoint
add framework- and product-specific scope. There are no current KB content trees
inside plugins; their two reference files describe an explicit shared dependency.
All ten plugins (seven execution, knowledge, Bug Bash and setup) route knowledge only
to the current KB. Knowledge and Bug Bash carry no operational runtime or providers.
Canonical executable source is under `src/runtime/`, `src/native/`,
`src/contracts/` and `src/adapters/`; discovery templates are under `src/bug-bash/`.
There are no root compatibility exports, source-local KB or integration archives.
Homepages and per-plugin READMEs are generated from `src/catalog.json`.
Setup retains the current scoped `src/native/windows-host.ps1` and `src/setup/`
dependency templates, with a private reuse inside Bug Bash. It has its own
read-only knowledge MCP, no operational MCP or integration runtime; host setup
is separately authorized and never required for knowledge consumption.

Content dependencies are `sharepoint -> fluent -> common` and
`sharepoint -> common`. Common cannot depend on product/framework content.
Descriptors carry stable entry IDs independent of their repository location.
Cross-package relationships use IDs; same-package navigation uses relative links.
Package versions and dependency ranges are deliberately exact in this first
implementation. A content upgrade must be reviewed and rebuilt, not hot-loaded.

The runtime does not use the KB catalog as an execution contract. Task procedures
describe inputs, reasoning, expected output and verification obligations. The
single ODSP `a11y-knowledge` skill remains a read-only adapter. The additional MCP tools
only list, search and read knowledge; they do not add AT, provider or operational
authority. The knowledge-only plugin contains only the two knowledge runtime files,
never the operational runtime. Bug Bash has the same two-file runtime boundary
and reuses the SAME `src/skills/a11y-knowledge/SKILL.md` at
`modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md`, changing only the tool
prefix. Its separately authorized host page/AT track is not knowledge execution
authority. The internal module has no manifest, references, runtime or KB bodies;
`${PLUGIN_ROOT}` always means the top-level installed plugin root, with references
at that root. Coverage prompts use stable `common.topic.*` IDs, not KB filenames.

## 3. Knowledge model

Each package declares `id`, `version`, exact `dependencies`, `sources` and
`entries`. Each entry has a stable `id`, `path`, `kind`, `status`, `owner`,
`appliesTo`, `sourceIds` and `relations`. An unassigned owner or draft status is
explicit, not represented as approved knowledge. Common topics and the initial
methods are draft guidance, not newly qualified requirements or API contracts.

Kinds cover topic, requirement guidance, implementation contract, analysis,
verification, case, procedure and product profile. The initial registry contains
guidance and gaps, **not fabricated MAS requirement records**. Before publishing
actual requirement mappings, owners must obtain the official source revision,
exact source requirement ID, applicability basis and reviewed interpretation.

Source records distinguish normative standards, informative guidance, company
requirements, component documentation, product support declarations and archived
reference material. Records state access/readiness and whether revision/content
review is pending. A public documentation URL alone is not a qualified snapshot.

Product profiles separately record:

- applicability: applicable / not-applicable / undetermined;
- support: supported / partial / unsupported / unknown;
- verification: verified / unverified / stale;
- approved exception reference, scope and expiry, if provided by the authority.

Unsupported does not mean not-applicable and does not override an applicable MAS
requirement. An unknown, missing or conflicting source produces a gap or blocked
decision, never a guessed pass. MAS, WCAG and product rules are not a simplistic
last-writer-wins hierarchy: retain each applicable obligation and route conflicts
to its owner. APG and WCAG techniques are implementation guidance, not substitutes
for normative WCAG/ARIA/HTML requirements.

## 4. Shared methods, not duplicated rules

An implementation contract identifies native/library/host behavior already
provided, caller-owned names/state/feedback, composition limits and validation
obligations. Fluent V8 and V9 are separate routes. SPDS and SharePoint utilities
are scoped to the matching product and version; no API is invented from memory.

Cases contain symptoms, root cause, wrong-but-plausible fixes, correct ownership
layer, blast radius and regression evidence. Initial examples are explicitly
hypothetical. Real customer/worker evidence must not be committed here.

Static and dynamic methods share obligations. Source analysis covers error,
async and unreachable-in-test branches; rendered/AT checks cover real focus,
announcements, contrast, forced colors, voice and themes. An unvisited state is
unverified. Accessibility Insights diagnostics and DOM assertions are not proof
of the complete experience with AT.

| Task | Composition | Required output |
|---|---|---|
| Find | applicable sources, source review, risk-based dynamic plan | findings, evidence basis, unknowns and coverage |
| Fix | baseline, root cause/ownership, component contract, tests and runtime regression | fix location rationale, blast radius, verification obligations |
| Prevent | optional design review, component selection, implementation constraints, tests/review | responsibilities, regression coverage, residual risk |
| Design | intended interaction and visual states, not only a screenshot | supported issues versus unanswered design questions |
| Add tests | unit/component/browser/AT boundaries | meaningful assertions and remaining runtime checks |

The output contract distinguishes source-supported finding, observed finding,
potential risk, context-needed, not-applicable-with-basis, checked-pass-with-scope,
and not-run/blocked. Static findings must not claim observed speech or conformance.
Fix completion requires the applicable runtime checks, not just a plausible diff.

## 5. Authority connections

CLEA MCP for MAS and official per-product support lists are **pending source
connections**. No endpoint, credentials, supported query or source content is
invented. The KB stores their source IDs and missing readiness requirements.

Qualifying a source connection requires source identity, original rule ID,
revision or immutable retrieval reference, retrieved time, access scope,
authoritative text reference and explicit errors. These are provenance
requirements, not a claim about an official API's available fields or queries.
Authentication remains outside the KB. Caching and package redistribution require
source-owner permission. Source failures remain explicit; public documentation
or unqualified reference material cannot substitute for MAS. Source access
belongs to the tool/adapter layer, not these Markdown procedures.

## 6. Shared references, knowledge MCP and integrity

### Distribution contract

- Each plugin carries only the two reference files shown above for the current
  KB, never a plugin-local accessibility KB tree. The root shared KB is retained.
- The single ODSP `a11y-knowledge` plugin, Bug Bash, setup and all seven execution plugins
  reference Common, Fluent and SharePoint (currently 32 entries) with exact dependency
  closure. Common remains a portable internal
  layer with an independent distribution for external content consumers, not a
  separate plugin. A shared root may contain more packages than a consumer
  selects; extra packages do not broaden that consumer's knowledge scope.
- All ten plugins register their own read-only knowledge stdio MCP server and
  carry copies of the shared Node-builtins-only knowledge loader and entrypoint.
  Knowledge and Bug Bash each carry only these two runtime files, no
  operational MCP/runtime, browser, AT or providers.
- Execution runtimes remain standalone. Knowledge queries have an explicit KB
  dependency; they do not require installing or calling another knowledge plugin.
  Normal knowledge use requires Node.js 22+ and the registered MCP server enabled,
  not manual KB setup, providers or `A11Y_ASSIST_CONFIG`. Neither installing a
  plugin nor resolving its KB authorizes execution.

The JSON reference descriptor has this contract:

| Field | Meaning |
|---|---|
| `schemaVersion` | `1` |
| `kind` | `shared-accessibility-kb` |
| `rootEnv` | `A11Y_ASSIST_KB_ROOT` |
| `developmentRoot` | `../../accessibility-kb`, valid only in the verified repository plugin layout |
| `packages` | Selected package ID-to-exact-version map, including dependencies |
| `manifestSha256` | SHA-256 binding the **selected export manifest**, not an arbitrary full-root manifest |
| `distribution.url` | Fixed HTTPS origin and `main/knowledge-distribution/<manifestSha256>.json` path |
| `distribution.sha256` | SHA-256 of the complete downloaded artifact bytes |

The selected export manifest describes the selected dependency-closed packages,
catalog, schemas, governance, evaluations and content hashes. Selection and
verification do not require writing those bodies into a plugin. An independent
external consumer's Common-only reference must bind the Common export manifest
even when the shared source root also contains Fluent and SharePoint. The release separately binds the complete
authoring manifest. Hash integrity is not content approval or conformance.

### Registered read-only tools

Each plugin registers an additional stdio server launched by the host as
`node ${PLUGIN_ROOT}/runtime/knowledge-mcp.mjs <plugin-name>`.
The host resolves the plugin root and enables MCP; skill discovery alone is not
MCP registration, and the model need not access environment variables. Neutral
discovery uses `plugin.json` and `.github/plugin/marketplace.json`. The prefix
is the plugin name with each hyphen replaced by an underscore:

- `<prefix>_knowledge_list`: list entries in the pinned selection.
- `<prefix>_knowledge_search(query)`: search locally to narrow selection.
- `<prefix>_knowledge_read(id)`: return actual entry content, citations and
  source metadata, retaining pending/draft status and applicability.

The unified knowledge plugin's names are exactly `a11y_knowledge_knowledge_list`,
`a11y_knowledge_knowledge_search` and `a11y_knowledge_knowledge_read`; the repeated
`knowledge` is intentional. List first, select relevant IDs, then read actual
entries before applying their guidance. A search snippet is not the full rule.
A successful read proves neither source approval nor accessibility conformance.

Bug Bash uses `a11y_bug_bash_knowledge_list`,
`a11y_bug_bash_knowledge_search` and `a11y_bug_bash_knowledge_read`, including
from its prefix-only generated internal knowledge skill. The read-only limits
below govern knowledge/source review; separately authorized host browser/AT
checks are confined to the discovery skill's page track. No automated fixes or filing.
Setup uses `a11y_setup_knowledge_list`, `a11y_setup_knowledge_search` and
`a11y_setup_knowledge_read`. Bundled setup instructions use the containing Bug Bash
server; `${PLUGIN_ROOT}` and knowledge references remain top-level in both cases.

Read-only skills may call only their registered read-only knowledge MCP tools
and inspect relevant source/reference files. They must not run shell commands,
setup helpers, tests, scanners, browsers, AT or operational MCP tools. Archived
instructions and task procedures do not relax this boundary. Missing tools or KB
content require an explicit error or host configuration request, never invented
results or remembered guidance presented as a verified KB read.

### Lazy resolution and network boundary

On each knowledge tool call, not at server startup:

1. Read the installed plugin's pinned reference. If `A11Y_ASSIST_KB_ROOT` is set,
  require an absolute path to a compatible local KB; invalid paths or content
  fail without fallback.
2. Otherwise allow `developmentRoot` only in a validated repository
  `plugins/<name>` layout. Do not guess installed siblings or the working
  directory. Invalid content in the selected development KB is an error.
3. Otherwise look for the pinned artifact in the shared per-user cache:
  `LOCALAPPDATA/A11yAssist/knowledge` on Windows or
  `homedir/.cache/a11y-assist/knowledge` elsewhere. Optional absolute
  `A11Y_ASSIST_KB_CACHE_ROOT` overrides this cache root; it is not required.
4. Only if the artifact is absent, download the pinned release artifact over
  HTTPS, validate it and cache it outside plugins. Validate artifact bytes,
  selected manifest, every file, exact package versions and dependency closure
  before returning any content.

Cache content is validated **every request**. Tampering fails explicitly, not
automatic deletion, repair or re-download. Verified cached content works offline;
offline first use fails explicitly unless a compatible local KB is configured,
including a valid development layout. A validation failure is not permission to
try a different source or broaden the selected packages.

Only this exact reference endpoint is permitted:
`https://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/<manifestSha256>.json`.
The filename is content-addressed under a fixed `main` path, not a commit-pinned
URL. Artifact bytes bind to `distribution.sha256`; the selected manifest binds to
`manifestSha256` and in turn pins every file. No arbitrary caller URL, credentials
or redirects are accepted. The transfer is bounded to **15 seconds and 8 MiB**;
knowledge queries and user code are never sent to the download server. Source
metadata URLs do not authorize additional requests. Download failure remains
explicit and cannot be replaced with mock content or a conformance claim.

Build emits one current Common artifact for independent external content
consumers and one ODSP (Common/Fluent/SharePoint) artifact under root
`knowledge-distribution/`. Neither creates a separate Common plugin.
Commit and publish these release files alongside the
plugins at the reachable pinned origin. Local output and uncommitted hash URLs
are not evidence of public availability or of updated installed marketplace
versions; remote push/publishing requires a separately scoped release action.

The repository [reference helper](../tools/knowledge-reference.mjs) is optional
advanced host integration, not a normal install prerequisite. Its explicit
absolute `kbRoot` option precedes `A11Y_ASSIST_KB_ROOT`, with invalid configured
roots failing without fallback. It uses root development dependencies and is not
shipped in plugins. Skills do not run it; the built-in MCP loader provides normal
installed knowledge access without requiring that helper or root dependencies.

### Validation and refresh

Local validation checks IDs, paths, dependencies, sources, relationships and
Markdown links. Structured support data has a separate schema and source-binding
checks. Local links target whole files; fragments are rejected rather than
accepted without anchor verification. The optional repository helper uses
`loadKnowledgeBase(root, { verifyManifest: true })` and checks the selected export
pin. The installed Node-builtins-only loader verifies its selected content and
pins without root Ajv or sibling runtime dependencies. Authoring/build loading permits an old source
manifest only so it can be regenerated.

Build regenerates the source KB manifest, lightweight plugin references and root
distribution artifacts, not per-plugin KB bodies. After a content change, build
and publish the matching artifacts, then refresh compatible plugin references and
KB context at a safe point. Hash pins mean
source edits are not a live auto-reload mechanism. Keep active workflows on their
original compatible versions. Check mode rejects stale or unexpected generated
files, including plugin-local current KB trees.

## 7. Source and execution separation

Other products can consume Common, optionally Fluent, without SharePoint.
Shared obligations and methods belong in Common; framework behavior belongs in
the matching Fluent version; SPDS and host responsibilities belong in SharePoint.
Do not duplicate Common rules in product packages or treat a product-specific
example as a universal requirement.

Repository access is not solved by directory layout. Distribution requires
approval for the content and audience; MAS and product-source caching permissions
are separate. Logical IDs are references, not an access grant.

The independently configured execution layer owns permissions, resource ownership
and evidence gates. Reading knowledge does not install or connect runtime tools.
A KB package update does not change the versions used by an active workflow.

## 8. Quality gates and current gaps

- Structural: unique IDs/paths, exact dependency closure, valid local links,
  source/reference resolution, deterministic manifests and export isolation.
- Packaging: current KB bodies stay outside plugins; each of ten plugins has
  its own read-only knowledge MCP server and references. Knowledge and Bug Bash
  runtime allowlists contain only the loader and MCP entrypoint. All knowledge skill
  routing uses the current KB. Root distribution holds
  one current Common artifact for independent external consumers and one ODSP
  artifact for all ten plugins. Common selection excludes product
  content and operational instructions.
- Installed resolution qualification: no provider/config/peer plugin or repository
  dependencies; absolute environment overrides, invalid-path failure without
  fallback, validated development layout, lazy downloads and cache defaults.
  Verify offline cache success, explicit offline first-use failure, tamper rejection
  without repair, exact versions, artifact/manifest/file pins, fixed URL policy,
  no redirects, transfer bounds and no query/code egress. Release qualification
  also requires reachable published artifacts; local checks alone cannot prove it.
- Read-only tools: list/select/read actual entries with citations and source status;
  snippets are not full rules and pending sources remain gaps. Refresh context
  at safe points, never by live reload. No skill-side shell, test or browser setup
  is allowed; knowledge tools grant no execution authority.
- Content: source owner/reviewer and revision confirmed before approval; unknown
  source coverage, unassigned ownership and draft methods remain visible.
- Behavioral qualification: curated positive/negative cases measure precision,
  missed issues, root-cause placement, regression risk, incorrect PASS claims and
  cross-product/version contamination. Rubrics are committed; model/real AT
  evaluation needs a separately authorized harness and is not claimed by unit tests.
- Commands: `npm run build`, `npm test`, `npm run check`. No live Bug or desktop
  testing is required or authorized by this structure change.

Current gaps include source-owner assignments, CLEA/support-list access and
revision review; qualified contracts for names, dialog focus, error feedback,
async updates and theme/forced-color states; and measured behavioral results.
Structural tests do not resolve these gaps or establish accessibility conformance.