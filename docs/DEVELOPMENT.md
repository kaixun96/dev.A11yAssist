# Developing the plugin marketplace

The [homepage](../README.md) is a plugin catalog, not an architecture tour.
Users choose a plugin by purpose, prerequisites and example. Each generated
plugin directory has English and Chinese READMEs and can be installed alone.
Keep implementation details off the main selection path.

## Authoring and distribution

| Directory | Role |
|---|---|
| `src/catalog.json` | Single catalog for both homepages and all plugin READMEs |
| `src/skills/`, `src/knowledge/` | Authored instructions and generic reference topics |
| `src/bug-bash/` | Feature discovery context/coverage/report templates, not another rule engine |
| `src/setup/` | Scenario-scoped dependency profiles and readiness report |
| `src/runtime/`, `src/contracts/`, `src/adapters/`, `src/native/` | Shared implementation |
| `plugins/` | Generated, self-contained installation packages; do not edit |
| `config/` | Placeholder templates, also bundled by execution packages |
| `tools/`, `tests/` | Build/install tooling and regression tests |

The source layout is not the installed layout. Installed skills still resolve
`runtime/`, `knowledge/` and `contracts/` from their own plugin root. No package
depends on this repository's `src/` or another installed package.

The canonical evidence-v1 validator, native ADO implementation and scoped setup
helper live under `src/runtime/` and `src/native/` and are bundled in the packages
that use them. Preserve their factual attribution and license notices.
Configure source and review providers directly through trusted connections.

## Local development

Use Node.js 22+ from the repository root:

```powershell
npm run build
npm test
npm run check
```

Change authored files, then regenerate. Build checks that the catalog covers
every installable plugin and that all bundled reference targets exist. Tests
check standalone packages, navigation, read-only boundaries and exact package
file sets. `npm run check` rejects missing, changed or unexpected generated files,
including homepages and READMEs.
No dependency installation is needed for the existing built-in Node test runner.

Use `npm run doctor` for source-level configuration diagnostics, or the installed
plugin's own doctor tool. Neither replaces live qualification.

## Installer helper

Normal users can copy the install command from their selected plugin page.
The optional helper requires an explicit selection and prints commands by default:

```powershell
.\tools\install.ps1 -Plugin a11y-knowledge
```

`-Execute` runs the commands; `-Plugin all` selects all ten packages. The unified
knowledge skill supports generic and ODSP source review using offline portable
topics and supplied current component documentation through `a11y-knowledge`.
The helper never defaults to the full workflow.

`a11y-bug-bash` exposes only its own public skill. `bundleKnowledgeReview` copies
the same single read-only skill and portable topics used by `a11y-knowledge` under
`modules/a11y-knowledge/`, preserving their relative paths without registering
duplicate public commands or requiring another installation. Its context,
coverage and report resources are generated from `src/bug-bash/`.
It has no MCP/configuration server; live checks use the caller's already
authorized tools. Read [the discovery contract](BUG-BASH.md) before extending it.

`bundleSetup` packages the same setup skill, profiles and scoped native host script
in standalone `a11y-setup` and Bug Bash's
`modules/a11y-setup/`. No second installer implementation or duplicate public
command is registered. `InstallSafeDependencies -Dependency` selects a subset;
omission preserves the existing full dependency set, while the skill always
supplies an explicit subset. Setup does not ship or invoke a product browser
helper. Read [setup boundaries](SETUP.md).

## Further contracts

- [Bug Bash plugin design](BUG-BASH-ARCHITECTURE.md) / [简体中文](BUG-BASH-ARCHITECTURE.zh-CN.md) (purpose, child capabilities, composition, user inputs and outputs; current versus planned behavior)
- [Bug Bash execution contracts and qualification](BUG-BASH-EXECUTION-DESIGN.md) / [简体中文](BUG-BASH-EXECUTION-DESIGN.zh-CN.md) (supporting implementation proposal; not installed capability)
- [Reusable large-plugin design and maintenance method](COMPOSABLE-PLUGIN-DESIGN.md) / [简体中文](COMPOSABLE-PLUGIN-DESIGN.zh-CN.md) (service composition, constrained adaptation and evaluated evolution)
- [Independent capabilities](CAPABILITIES.md)
- [Provider setup and protocol](PROVIDERS.md)
- [Optional workflow](WORKFLOW.md)
- [Knowledge ownership and consumption](KNOWLEDGE.md)
- [Releases and freshness](RELEASING.md)
