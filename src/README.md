# Maintainer source

Looking for a plugin? Start with the [plugin catalog](../README.md).
You do not need to understand this directory to install or use a plugin.

| Source | Responsibility |
|---|---|
| `catalog.json` | Bilingual plugin selection, requirements and examples |
| `skills/` | Authored Copilot skill instructions |
| `knowledge/` | Generic, read-only accessibility reference topics |
| `runtime/` | Shared MCP, capability and workflow implementations |
| `contracts/` | Capability, plugin and workflow contracts |
| `adapters/` | Caller adapters |
| `native/` | Native execution implementations |
| `integrations/` | Integration-specific executable source |

Run `npm run build` from the repository root to generate the homepages, plugin
READMEs, installable `plugins/` packages and release metadata. Never hand-edit
those outputs. Package paths stay independent of this source layout.

The original project knowledge and its immutable inventory remain under
`integrations/agentow/knowledge/` at the repository root. Users reach them through
the built-in ODSP submodule in `a11y-knowledge`, not by knowing their historical
source location or installing a second plugin.
The root `runtime/` and `native/` files and integration browser export are
generated compatibility exports at paths consumed by AgentOW. They are not
additional authoring sources. Do not remove or rename these public exports
without a coordinated consumer migration.

See [development](../docs/DEVELOPMENT.md) and [releases](../docs/RELEASING.md).
