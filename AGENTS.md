# Repository contract

This repository is a plugin marketplace. Users select independently installable
plugins from the homepages and each plugin's README; implementation
details belong in maintainer documentation. Read `src/README.md` and
`docs/DEVELOPMENT.md` before changing packaging or source layout.

Support only Twinbot + multiple Windows DevBoxes, or Copilot CLI + one/multiple
Windows DevBoxes. A single DevBox is a pool of size one, not a weaker workflow.

- `src/contracts/workflow.json` and `docs/WORKFLOW.md` own the phase/gate contract.
- Canonical implementation lives in `src/runtime/`, `src/native/`,
  `src/contracts/` and `src/adapters/`; authored skills live in `src/skills/`.
  `src/bug-bash/` owns discovery templates and coverage prompts, not KB rules.
  `plugins/*/runtime/` is generated
  by `npm run build`. Never edit generated copies. Installed execution runtimes
  must work without sibling directories or this repository's root.
- Homepages and per-plugin READMEs are generated from `src/catalog.json`;
  edit that source, not the output. Use neutral `plugin.json`,
  `.github/plugin/marketplace.json` and host-resolved `${PLUGIN_ROOT}` paths.
  That placeholder always means the top-level installed plugin root, including
  for internal module skills; never infer a nested root or use the working directory.
- Current KB authoring lives only in the shared `accessibility-kb/` root, not in
  `plugins/*/accessibility-kb/`. Plugins carry only `references/knowledge.json`
  and `references/README.md` for that KB. Root `knowledge-distribution/` holds pinned release
  artifacts, never plugin KB bodies or a second authoring source.
- Ship ten plugins: seven execution plugins, one ODSP-oriented read-only
  `a11y-knowledge` plugin, `a11y-bug-bash` discovery and `a11y-setup`.
  All ten reference the 32 current Common, Fluent and SharePoint entries;
  knowledge routing uses only the current KB. Common remains a portable internal
  KB layer, not a separate plugin. This repository is a current draft: no
  compatibility plugins, root runtime/native exports, `src/knowledge/`,
  historical integration bundles or migration guidance.
- Full-workflow create/status/execute/reconcile/progress/abandon commands are
  current APIs, distinct from independent capability operations. Configure source
  and review connections directly; no workflow profile selector is used.
- Retain the shared evidence-v1 validator and native ADO implementations.
  Preserve factual code attribution and license notices; provenance does not
  establish an execution dependency or authorize runtime actions.
- Each of ten plugins registers a separate read-only knowledge stdio MCP server:
  `node ${PLUGIN_ROOT}/runtime/knowledge-mcp.mjs <plugin-name>`. Its tools
  are `<prefix>_knowledge_list`, `<prefix>_knowledge_search(query)` and
  `<prefix>_knowledge_read(id)`, where prefix replaces plugin hyphens with
  underscores. For `a11y-knowledge`, the exact tools are
  `a11y_knowledge_knowledge_list`, `a11y_knowledge_knowledge_search` and
  `a11y_knowledge_knowledge_read`. Node.js 22+ and an
  MCP-enabled host are required; no peer knowledge plugin, provider or
  `A11Y_ASSIST_CONFIG` is required for knowledge use of any plugin.
- Shared `src/runtime/knowledge.mjs` uses Node builtins; build copies it and the
  knowledge MCP entrypoint into every plugin. Knowledge and Bug Bash each carry
  only those two runtime files, never operational MCP/runtime, browsers, AT or providers.
- Setup retains the current scoped `src/native/windows-host.ps1`, one authored
  setup skill and `src/setup/` dependency templates. It registers its own read-only
  knowledge MCP, never operational MCP or an integration/browser runtime. The
  native helper is a current feature, not a root native compatibility export.
  Bug Bash reuses the setup skill under `modules/a11y-setup/`, replacing only its
  knowledge tool prefix with `a11y_bug_bash_knowledge_`. Setup resources (`native/`,
  `setup/`, `docs/SETUP.md`) and KB references remain at top-level `${PLUGIN_ROOT}`,
  with no nested manifest, resources, MCP registration or runtime. Dependency
  profiles are scoped setup selections, not workflow profile selectors. Check-only
  is the default; preparation needs explicit host-change authorization and original
  ownership. Knowledge and source-only work never require or run host setup.
- Bug Bash retains full feature discovery through scoped, already-authorized host
  browser/AT tools and a separate read-only source track. No automated fixes or filing.
  Its internal `modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md` is generated
  from the SAME single authored knowledge skill, replacing only the knowledge tool
  prefix to use `a11y_bug_bash_knowledge_list`, `a11y_bug_bash_knowledge_search`
  and `a11y_bug_bash_knowledge_read`. References remain
  top-level; no nested manifest, runtime, references or second KB rule set.
  Coverage topics use stable `common.topic.*` entry IDs. Missing tools or AT are
  explicit coverage gaps, never fabricated providers, evidence or PASS.
- On a knowledge tool call, resolve `A11Y_ASSIST_KB_ROOT` if set (absolute;
  invalid fails without fallback), else a validated repository `plugins/<name>`
  development layout, else the shared per-user cache, else lazy pinned HTTPS
  download. Cache defaults to `LOCALAPPDATA/A11yAssist/knowledge` on Windows or
  `homedir/.cache/a11y-assist/knowledge` elsewhere; optional
  `A11Y_ASSIST_KB_CACHE_ROOT` must be absolute. Revalidate cache on every request;
  tampering fails, never auto-repairs. Cached offline use works; first offline
  use fails explicitly unless a valid local KB is configured.
- Downloads use only the reference's fixed
  `https://raw.githubusercontent.com/kaixun96/dev.A11yAssist/main/knowledge-distribution/<manifestSha256>.json`
  endpoint: verify artifact bytes, selected manifest, exact packages and every
  file. No caller URLs, credentials, redirects or query/user-code transmission;
  bound transfers to 15 seconds and 8 MiB. Knowledge review may call only registered
  read-only knowledge MCP tools and read relevant source/reference files, never
  setup helpers, shells, tests or browsers. Read actual entries with citations
  and source status; search snippets are not full rules, pending is not authority.
- Build updates the shared KB manifest and lightweight package references, not
  plugin KB bodies. References pin exact package versions and the selected export
  manifest hash plus `distribution: { url, sha256 }`. Build emits one current
  Common artifact for independent external content consumers and one ODSP
  (Common/Fluent/SharePoint) artifact in root `knowledge-distribution/`; commit and
  publish these alongside plugins to the reachable pinned origin through the
  reviewed release process. Local builds do not establish public URL availability
  or update installed marketplace releases. Do not push or publish without scope.
  Refresh compatible plugin pins and KB context at a safe point, never by live
  auto-reload. The repository reference helper is optional advanced host setup,
  not a normal install prerequisite. Knowledge access grants no runtime authority.
- Keep private configuration and all run/lease/evidence data outside this repo.
  Never hardcode a person's tenant, UPN, machine roster or credentials.
- No accepted reproduced BEFORE means no source branch, fix or PR. No unverified
  PR fallback is permitted.
- Providers are administrator/user-configured trusted executables, not arbitrary
  model-supplied shell commands. No live provider is shipped enabled by default.
- A provider error or absent capability must be an explicit failure, never a
  success-shaped mock, simulated AT result or guessed readiness.
- Preserve original owner/run/affinity across retries. Never force-release a
  foreign lease, delete environments, reset another agent or bypass service safety.
- Update source, generated plugin packages, docs and targeted tests together.
- Validate with `npm test` and `npm run check`. Never test on a live Bug or another
  worker's desktop without explicit scope and canonical ownership gates.
