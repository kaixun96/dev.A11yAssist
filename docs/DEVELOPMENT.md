# Developing the plugin marketplace

The [homepage](../README.md) is a plugin catalog, not an architecture tour.
Users choose a plugin by purpose, prerequisites and example. Each generated
plugin directory has English and Chinese READMEs and can be installed alone.
Keep implementation details off the main selection path. This is a current draft,
not a compatibility or migration catalog.

## Authoring and distribution

| Directory | Role |
|---|---|
| `src/catalog.json` | Single catalog for both homepages and all plugin READMEs |
| `src/skills/` | Authored instructions; one shared read-only knowledge skill |
| `src/bug-bash/` | Feature discovery context/coverage/report templates, not another rule engine |
| `src/setup/` | Scenario-scoped dependency profiles and readiness report |
| `src/runtime/`, `src/contracts/`, `src/adapters/`, `src/native/` | Shared implementation |
| `accessibility-kb/` | Single current Common, Fluent and SharePoint authoring root |
| `plugins/` | Generated, self-contained installation packages; do not edit |
| `config/` | Placeholder templates, also bundled by execution packages |
| `knowledge-distribution/` | Pinned current Common and ODSP release artifacts, not authoring |
| `tools/`, `tests/` | Build/install tooling and regression tests |

The source layout is not the installed layout. Installed skills resolve
`runtime/`, `references/`, `docs/` and, in execution plugins, `contracts/`
from the top-level `${PLUGIN_ROOT}` supplied by the host. No package depends on
this repository's `src/` or another installed package. Neutral discovery uses
`plugin.json` and `.github/plugin/marketplace.json`; skill discovery, root
resolution and MCP registration are separate host responsibilities.

There are no root runtime/native compatibility exports, source-local knowledge
tree, historical integration archives, old knowledge alias or workflow profile
selector. Configure source and review connections directly. Retain current
evidence-v1 and native ADO code with factual attribution and license notices.

## Local development

Use Node.js 22+ from the repository root:

```powershell
npm run build
npm test
npm run check
```

Change authored files, then regenerate. Build checks that the catalog covers
every installable plugin and that all bundled reference targets exist. Tests
check standalone packages, navigation, read-only boundaries and shared KB pins.
`npm run check` rejects generated drift, including homepages and READMEs.
Repository KB validation uses the declared development dependencies; installed
knowledge runtimes use Node builtins and do not require those root dependencies.

Use `npm run doctor` for source-level configuration diagnostics, or the installed
plugin's own doctor tool. Neither replaces live qualification.

## Installer helper

Normal users can copy the install command from their selected plugin page.
The optional helper requires an explicit selection and prints commands by default:

```powershell
.\tools\install.ps1 -Plugin a11y-knowledge
```

`-Execute` runs the commands; `-Plugin all` selects exactly ten packages:
seven execution plugins, the single ODSP `a11y-knowledge` plugin and
`a11y-bug-bash` plus `a11y-setup`. No legacy alias or integration install option
is supported.
The helper never defaults to the full workflow.

All ten have their own read-only knowledge MCP server and top-level
`references/knowledge.json` and `references/README.md`, selecting the current
32 Common/Fluent/SharePoint entries. Node.js 22+ and an MCP-enabled host are
required; no peer knowledge plugin, provider or `A11Y_ASSIST_CONFIG` is required
for knowledge access. The loader uses a configured absolute KB root, validated
repository layout, verified shared cache or lazy pinned release download.
Invalid roots and tampered caches fail; verified cache works offline, while
uncached offline use needs a valid local KB. See [knowledge consumption](KNOWLEDGE.md).

`a11y-bug-bash` exposes only its own public skill. `bundleKnowledgeReview` copies
the SAME `src/skills/a11y-knowledge/SKILL.md` to
`modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md`, replacing only
`a11y_knowledge_knowledge_` with `a11y_bug_bash_knowledge_` in tool names.
The internal module has no manifest, references, runtime or additional public
command. `${PLUGIN_ROOT}` still means the top-level Bug Bash installation;
references remain at that root. Coverage uses stable `common.topic.*` KB IDs.
Context, coverage and report resources are generated from `src/bug-bash/`.
Knowledge and Bug Bash each carry only `knowledge.mjs` and `knowledge-mcp.mjs`
under their runtime directory, with no operational MCP/browser/AT implementation.
Bug Bash live checks use the caller's already-authorized host tools, independently
of its read-only source track; no automated fixes or filing are authorized.
Read [the discovery contract](BUG-BASH.md) before extending it.

`bundleSetup` packages the same setup skill, dependency-selection templates and
current scoped `src/native/windows-host.ps1` in standalone `a11y-setup` and Bug Bash.
Only Bug Bash's internal skill is under `modules/a11y-setup/`, replacing only
`a11y_setup_knowledge_` with `a11y_bug_bash_knowledge_`. Native script, setup
templates and `docs/SETUP.md` remain at top-level `${PLUGIN_ROOT}` in both packages.
No second installer implementation, nested resources or duplicate public command
is registered. Setup has its own read-only knowledge MCP and top-level
references, never operational MCP or an integration/browser runtime. Its native
helper is a current feature, not a root native export or compatibility copy.
`InstallSafeDependencies -Dependency` selects the explicitly authorized subset.
Check-only, host rejection, ownership, consent and live qualification boundaries
remain mandatory. Dependency-selection profiles are not workflow profile selectors.
Read [setup boundaries](SETUP.md).

## Further contracts

- [Reusable large-plugin design and maintenance method](COMPOSABLE-PLUGIN-DESIGN.md) (DeepSeek-inspired service composition, constrained adaptation and evaluated evolution)
- [Bug Bash plugin architecture and qualification design](BUG-BASH-ARCHITECTURE.md) (proposal; not installed capability)
- [Independent capabilities](CAPABILITIES.md)
- [Provider setup and protocol](PROVIDERS.md)
- [Optional workflow](WORKFLOW.md)
- [Knowledge ownership and consumption](KNOWLEDGE.md)
- [Releases and freshness](RELEASING.md)
