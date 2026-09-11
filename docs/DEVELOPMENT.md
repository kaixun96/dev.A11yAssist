# Developing the plugin marketplace

The [homepage](../README.md) is a plugin catalog, not an architecture tour.
Users choose a plugin by purpose, prerequisites and example. Each generated
plugin directory has English and Chinese READMEs and can be installed alone.
Keep migration history and implementation details off the main selection path.

## Authoring and distribution

| Directory | Role |
|---|---|
| `src/catalog.json` | Single catalog for both homepages and all plugin READMEs |
| `src/skills/`, `src/knowledge/` | Authored instructions and generic reference topics |
| `src/bug-bash/` | Feature discovery templates and opt-in disposable fixture qualification, not a rule engine |
| `src/setup/` | Scenario-scoped dependency profiles and readiness report |
| `src/runtime/`, `src/contracts/`, `src/adapters/`, `src/native/` | Shared implementation |
| `src/integrations/` | Integration-specific executable source |
| `plugins/` | Generated, self-contained installation packages; do not edit |
| `config/` | Placeholder templates, also bundled by execution packages |
| `integrations/agentow/knowledge/` | Preserved source inventory, complete project references and immutable archive |
| `runtime/`, `native/`, `integrations/agentow/runtime/` | Generated compatibility exports for existing AgentOW consumers |
| `tools/`, `tests/` | Build/install tooling and regression tests |

The source layout is not the installed layout. Installed skills still resolve
`runtime/`, `knowledge/` and `contracts/` from their own plugin root. No package
depends on this repository's `src/` or another installed package.

The AgentOW updater validates exact public export paths. Retain those generated
exports and their hashes rather than breaking the consumer for cosmetic layout
changes. The archived project knowledge retains its original paths and bodies;
its plugin page provides direct SPDS/Fluent/SharePoint navigation.

## Local development

Use Node.js 22+ from the repository root:

```powershell
npm run build
npm test
npm run check
```

Change authored files, then regenerate. Build checks that the catalog covers
every installable plugin and that all bundled reference targets exist. Tests
check standalone packages, navigation, read-only boundaries and compatibility
exports. `npm run check` rejects generated drift, including homepages and READMEs.
No dependency installation is needed for the existing built-in Node test runner.
Fixture request/host-gate tests also use Python 3, but never import Playwright or
open a browser. Actual fixture qualification is separately authorized Windows
evaluator work, not a headless CI test or a controller-side shortcut.

Use `npm run doctor` for source-level configuration diagnostics, or the installed
plugin's own doctor tool. Neither replaces live qualification.

## Installer helper

Normal users can copy the install command from their selected plugin page.
The optional helper requires an explicit selection and prints commands by default:

```powershell
.\tools\install.ps1 -Plugin a11y-knowledge
```

`-Execute` runs the commands; `-Plugin all` selects the ten non-compatibility
packages. Knowledge includes its ODSP subskill and full references by default.
The old standalone ODSP install name remains supported for existing users only.
Add `-WithAgentOW` only when intentionally installing that separate integration.
The helper never defaults to the full workflow.

`a11y-bug-bash` exposes only its own public skill. `bundleKnowledgeReview` copies
the same two read-only skills and all references used by `a11y-knowledge` under
`modules/a11y-knowledge/`, preserving their relative paths without registering
duplicate public commands or requiring another installation. Its context,
coverage and report resources are generated from `src/bug-bash/`.
It has no MCP/configuration server; live checks use the caller's already
authorized tools. Read [the discovery contract](BUG-BASH.md) before extending it.

`bundleSetup` packages the same setup skill, profiles, shared native host script
and compatibility browser helper in standalone `a11y-setup` and Bug Bash's
`modules/a11y-setup/`. No second installer implementation or duplicate public
command is registered. `InstallSafeDependencies -Dependency` selects a subset;
omission preserves the legacy full set. Existing AgentOW consumers remain
commit-pinned until separately updated. Read [setup boundaries](SETUP.md).

## Further contracts

- [Independent capabilities](CAPABILITIES.md)
- [Provider setup and protocol](PROVIDERS.md)
- [Optional workflow](WORKFLOW.md)
- [Knowledge ownership and preservation](KNOWLEDGE.md)
- [Migration status](MIGRATION.md)
- [Releases and freshness](RELEASING.md)
