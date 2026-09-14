# Maintainer source

Looking for a plugin? Start with the [plugin catalog](../README.md).
You do not need to understand this directory to install or use a plugin.

| Source | Responsibility |
|---|---|
| `catalog.json` | Bilingual plugin selection, requirements and examples |
| `skills/` | Authored Copilot skill instructions |
| `knowledge/` | Generic, read-only accessibility reference topics |
| `bug-bash/` | Feature context, coverage prompts and discovery report templates |
| `runtime/` | Shared MCP, capability and workflow implementations |
| `contracts/` | Capability, plugin and workflow contracts |
| `adapters/` | Caller adapters |
| `native/` | Native execution implementations |
| `setup/` | Scoped dependency selections and readiness report |

Run `npm run build` from the repository root to generate the homepages, plugin
READMEs, installable `plugins/` packages and release metadata. Never hand-edit
those outputs. Package paths stay independent of this source layout.

The ten plugins contain no historical integration archives, retired ODSP alias
or root runtime/native exports. The shared evidence-v1 validator and native ADO
implementations remain canonical source and are bundled in execution plugins.
The unified knowledge skill reads the existing portable topics offline and uses
supplied current component documentation for project-specific source review.
Bug Bash reuses the same knowledge and setup sources under internal modules.

See [development](../docs/DEVELOPMENT.md) and [releases](../docs/RELEASING.md).
