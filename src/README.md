# Maintainer source

Looking for a plugin? Start with the [plugin catalog](../README.md).
You do not need to understand this directory to install or use a plugin.

| Source | Responsibility |
|---|---|
| `catalog.json` | Bilingual plugin selection, requirements and examples |
| `skills/` | Authored Copilot skill instructions |
| `bug-bash/` | Feature context, coverage prompts and discovery report templates |
| `setup/` | Scoped Windows dependency selections and readiness report template |
| `runtime/` | Shared MCP, capability and workflow implementations |
| `contracts/` | Capability, plugin and workflow contracts |
| `adapters/` | Caller adapters |
| `native/` | Native execution implementations |
| `../accessibility-kb/` | Single current Common, Fluent and SharePoint KB authoring root |

Run `npm run build` from the repository root to generate the homepages, plugin
READMEs, installable `plugins/` packages and release metadata. Never hand-edit
those outputs. Package paths stay independent of this source layout.

Ship ten independently installable plugins: seven execution plugins,
`a11y-knowledge`, `a11y-bug-bash` and `a11y-setup`. All ten use their own read-only knowledge
MCP server and top-level shared KB references; knowledge access requires Node.js
22+ and an MCP-enabled host, not execution configuration or another plugin.
Each selects the same 32 current Common, Fluent and SharePoint entries.
Knowledge and Bug Bash carry only the two knowledge runtime files. Bug Bash
reuses the single knowledge skill internally, replacing only its tool prefix;
its separately authorized host page/AT track ships no operational MCP or browser.
Setup retains the current scoped `native/windows-host.ps1` and `setup/`
templates, reused by Bug Bash at the top-level installed root; only the internal
setup skill lives under `modules/a11y-setup/`, with its knowledge tool prefix rebound.
Setup has no operational MCP or integration runtime. Check-only and explicitly authorized
preparation remain separate from knowledge access and live feature qualification.

Source paths are not installed paths. Use neutral `plugin.json` and
`.github/plugin/marketplace.json` discovery and `${PLUGIN_ROOT}` for the
top-level installed root, even inside either Bug Bash internal skill module.
There are no root runtime/native compatibility exports, source-local KB,
integration archives, old knowledge aliases or workflow profile selectors.
Current KB bodies stay at the shared root; pinned `knowledge-distribution/`
artifacts are release outputs, never a second authoring tree.

See [development](../docs/DEVELOPMENT.md) and [releases](../docs/RELEASING.md).
