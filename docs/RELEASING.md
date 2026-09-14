# Releases and freshness

Use a single repository and compatible release set first; do not split into
separate repositories before independent release requirements exist.

1. Change shared source and skills under `src/`, and catalog text in
   `src/catalog.json`; do not hand-edit generated homepages or packages.
2. Bump [package.json](../package.json) for the release. Change the workflow
   schema/version in [src/contracts/workflow.json](../src/contracts/workflow.json)
   only when its state or execution contract changes, not for KB/catalog/layout updates.
3. Run `npm run build`, `npm test` and `npm run check`. Build refreshes the
   shared KB source manifest and lightweight plugin references, and emits one
   current Common artifact for independent external content consumers and one
   ODSP (Common/Fluent/SharePoint) artifact in root `knowledge-distribution/`,
   never KB bodies inside plugins or a separate Common plugin.
4. Review for embedded credentials, personal identifiers, machine roster,
   evidence and absolute private paths. Test fixtures must be synthetic.
5. Commit generated packages, **both current root knowledge distribution artifacts**,
   marketplace and [release.json](../release.json). Publish the matching artifacts
   alongside the plugins to the reachable origin pinned in their references,
   through the reviewed release process, and create a reviewed version tag.
   A tag alone does not put an artifact on the fixed `main` URL. The marketplace repository is public; operational platform
   access and the repository's license terms remain separate requirements.
6. Update through the host's supported plugin manager and restart when required.
   Enable the registered knowledge MCP server with Node.js 22+. Normal knowledge
   use loads the pinned KB lazily without manual setup; an approved compatible
   local KB remains an option. Refresh compatible plugin pins and KB context at a
   safe point, never by live reload. A git push alone does not update active consumers.
7. Record package versions, the selected KB manifest pin and provider implementation
   hashes with each run.
   Retain active run versions; incompatible upgrades fail closed rather than
   rewriting evidence or migrating ownership.

The installer requires an explicit `-Plugin` selection and selects only this
repository's plugins. `-Plugin all` selects all ten: seven execution plugins,
the single ODSP `a11y-knowledge` plugin, `a11y-bug-bash` and `a11y-setup`.
Knowledge usage of any one plugin needs no peer knowledge
plugin, providers or `A11Y_ASSIST_CONFIG`; external execution operations still need
their separately authorized configuration. No unsupported dependency fields are
invented in plugin manifests. Use neutral `plugin.json`,
`.github/plugin/marketplace.json` and host-resolved `${PLUGIN_ROOT}` paths.
There are no compatibility exports, integration archives, old knowledge aliases
or workflow profile selectors; source and review connections are configured directly.

Keep knowledge access separate from execution authority. `a11y-knowledge`
references only the current Common, Fluent and SharePoint KB. All ten plugins
route knowledge only to current KB entries. Knowledge and Bug Bash each carry
only the shared Node-builtins-only knowledge loader and knowledge MCP entrypoint
in their runtime directory, never operational MCP/runtime, browsers, AT or
providers. Build prunes retired generated files; check mode rejects
unexpected files.

Setup similarly has one authored skill, dependency templates and scoped native
host script, reused standalone and internally by Bug Bash. Only the internal setup
skill is nested; its generated copy changes only the knowledge tool prefix. Validate
top-level `${PLUGIN_ROOT}` paths for native script, templates, docs and KB references,
with no nested resource/runtime copies, selective dependency closure,
skipping installed dependencies, error propagation and host rejection
without actually installing packages or changing the CI desktop. This is not
live Windows driver, authentication, audio or AT qualification. Setup registers
only read-only knowledge MCP, not an operational server; the current scoped
`src/native/windows-host.ps1` is retained, not exported at repository root or
packaged as an integration runtime. Browser access uses an existing approved
host connection, not an archived helper. See [setup boundaries](SETUP.md).

Bug Bash bundles the SAME single `src/skills/a11y-knowledge/SKILL.md` internally
at `modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md`, replacing only
`a11y_knowledge_knowledge_` with `a11y_bug_bash_knowledge_`. Validate prefix-only
reuse, one public discovery skill, top-level references and `${PLUGIN_ROOT}`
resolution without a nested manifest/runtime/KB. Coverage topics use stable
`common.topic.*` IDs. Preserve context/report templates and full bounded
discovery, with separately authorized host page/AT checks and read-only source
review; no automated fixes or filing. Missing capabilities remain gaps.
Framework/package validation is not a live feature or AT qualification.

Shared KB changes are authored directly in
[accessibility-kb](../accessibility-kb/README.md). KB package versions and exact
dependency pins are independent of the workflow-state schema. Bump changed KB
package versions and their consumers' pins for a published content update.
Build/check validates package schemas, references, links, dependency closure
and release-bound hashes. For the current KB, every plugin has only the JSON
descriptor and setup README in its references directory, with no plugin-local
accessibility KB content tree. The shared root remains the content source.
The unified ODSP knowledge plugin, Bug Bash, setup and all seven execution plugins select
Common, Fluent and SharePoint (currently 32 entries). Common remains a portable internal layer; validate that
its independent external-consumer selection excludes framework/product content
and operational rules.
Do not publish draft material as approved or claim that a pending MAS/product
source has been connected.

References use `schemaVersion: 1`, `kind: shared-accessibility-kb`,
`rootEnv: A11Y_ASSIST_KB_ROOT`, `developmentRoot: ../../accessibility-kb`, exact
`packages` versions, `manifestSha256` of the **selected export manifest** and
`distribution: { url, sha256 }`.
Do not replace an external consumer's Common-only pin with the full authoring
manifest hash. After any content edit, build before host refresh; a still-matching version string does
not make stale content hashes acceptable. Preserve a compatible KB and reference
set for active consumers rather than silently changing their source underneath them.

The reference endpoint is fixed to
`https://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/<manifestSha256>.json`:
a content-addressed filename under `main`, not a commit URL. Verify that the
published artifact bytes match `distribution.sha256`, its selected manifest
matches `manifestSha256`, and every selected file and exact package version
matches. Local build/check success does **not** prove that uncommitted hash URLs
exist publicly, nor update real installed marketplace versions. This documentation
does not perform or authorize an agent to push or publish without explicit scope.

Retain published content-addressed artifacts while any supported plugin or active
consumer pins them. Emitting new current artifacts is not permission to remove or
overwrite older pinned content; artifact retirement requires a separately scoped
release decision.

Release qualification must cover:

- All ten plugins register their own read-only knowledge stdio server:
   `node ${PLUGIN_ROOT}/runtime/knowledge-mcp.mjs <plugin-name>`. The host
   must resolve the root and enable MCP. Check Node.js 22+ installed isolation
   without sibling plugins, root development dependencies, providers or execution
   config. Knowledge and Bug Bash runtime allowlists each contain exactly the two knowledge files.
- Knowledge routing uses only current KB entries in all ten plugins; generated
   packages contain no historical integration bundles or operational authority in
   the knowledge-only plugin.
- Tools use the plugin name with hyphens replaced by underscores followed by
   `_knowledge_list`, `_knowledge_search(query)` and `_knowledge_read(id)`.
   The unified knowledge plugin's names are exactly `a11y_knowledge_knowledge_list`,
   `a11y_knowledge_knowledge_search` and `a11y_knowledge_knowledge_read`.
   Bug Bash uses `a11y_bug_bash_knowledge_list`,
   `a11y_bug_bash_knowledge_search` and `a11y_bug_bash_knowledge_read`.
   Setup uses `a11y_setup_knowledge_list`, `a11y_setup_knowledge_search` and
   `a11y_setup_knowledge_read`; its internal Bug Bash setup instructions use
   the containing Bug Bash server, never a second setup registration.
   List, select and read actual content with citations/source metadata; search
   snippets are not full rules, and pending sources are not conformance authority.
- Lazy load on tool calls: absolute `A11Y_ASSIST_KB_ROOT` if set, else validated
   repository `plugins/<name>` layout, else shared user cache, else pinned HTTPS
   download. Invalid configured roots fail without fallback. Default cache roots
   are `LOCALAPPDATA/A11yAssist/knowledge` on Windows and
   `homedir/.cache/a11y-assist/knowledge` elsewhere; optional absolute
   `A11Y_ASSIST_KB_CACHE_ROOT` overrides only the cache location.
- Revalidate cached content on every request. Test tamper failure without repair,
   verified cached offline success and explicit offline first-use failure unless
   a compatible local KB is configured. Version strings cannot bypass hash failures.
- Enforce the exact reference URL and artifact/manifest/file pins, no arbitrary
   caller URL or credentials, no redirects, and a 15-second/8-MiB transfer bound.
   No knowledge queries or user code are sent to the download server. Use isolated
   fixtures for negative cases; public origin reachability is a separate release check.
- Read-only skills may call registered read-only knowledge MCP tools, not shell,
   setup helper, test, scanner, browser, AT or operational tools. Missing tools or
   content fail explicitly. No knowledge tool grants provider or workflow authority.

The repository [reference helper](../tools/knowledge-reference.mjs) remains an
optional advanced local host integration, not required for normal installation.
Its explicit absolute `kbRoot` precedes `A11Y_ASSIST_KB_ROOT`; invalid configured
roots fail without fallback. It uses repository development dependencies and is
not shipped in plugins or run by read-only skills. Installed execution runtimes
remain independent of the repository; their ownership and evidence gates are unchanged.

The current evidence-v1 validator and native ADO implementations remain shared
source, with plugin copies generated through the normal build. Preserve factual
code attribution and applicable [license notices](../LICENSE); provenance is not
an operational dependency. Never hand-maintain generated implementations or
silently refresh an active run. See [knowledge ownership and consumption](KNOWLEDGE.md).

Rollback selects a previously qualified plugin/provider release for a compatible
run. It must not reset session bindings, remove claims, discard new evidence,
undo remote effects or bypass a service refusal.
