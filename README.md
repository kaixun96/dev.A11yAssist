# A11y Assist plugins

Private/internal Copilot CLI plugins for **Twinbot + multiple Windows DevBoxes**
or **Copilot CLI + one/multiple Windows DevBoxes**.

## v0.1 status: installable foundation, staged migration

Seven independently packaged plugins, real MCP tools, shared executable phase
gates, persistent run/request state, artifact hashing, provider RPC, two entry
adapters and tests are implemented. This is **not yet a drop-in replacement
for the existing live A11y deployment**: platform-specific ADO/Dev Center/AT
providers must be configured and qualified. No personal machine roster, tenant
credentials, browser profile or production evidence is included.

Missing providers fail closed. `doctor` reports configuration, not a fabricated
working evaluator. Existing workers and their canonical pool remain untouched.

| Plugin | Entry command | Scope |
|---|---|---|
| a11y-intake | `/a11y-intake` | Claim-aware intake, acceptance, canonical scenario |
| a11y-resources | `/a11y-resources` | Public ownership/readiness inspection |
| a11y-capture | `/a11y-capture` | Real AT BEFORE/AFTER via trusted providers |
| a11y-validate | `/a11y-validate` | Integrity plus independent behavior evaluation |
| a11y-publish | `/a11y-publish` | Reviewed Draft PR/media publication |
| agent-operations | `/agent-operations` | Progress, reconciliation, owned cleanup |
| a11y-workflow | `/a11y-workflow` | Full gated orchestration and AgentOW handoff |

## Install one capability

Repository access is required while the marketplace is private.

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-intake@a11y-assist
```

## Install the complete entrypoint

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-workflow@a11y-assist
copilot plugin marketplace add kaixun96/dev.AgentOW
copilot plugin install agentow-copilot@agentOW
```

The full plugin is independently packaged and exposes all stage tools. It does
not need to load six sibling MCP servers. Install small plugins when you want
their narrower scope. We do not assume undocumented native transitive plugin
dependencies; `tools/install.ps1` prints the exact commands, with `-Execute`
performing them and `-Plugin all` installing all seven.

Copy a template from `config/` to a private location, fill in your shared state
root and trusted providers, and set:

```powershell
$env:A11Y_ASSIST_CONFIG = 'C:\YourPrivateDirectory\a11y-config.json'
```

Restart Copilot to load new plugins/environment. In Twin use its **Restart
Copilot** control only at an authorized safe point; installing files does not
update already-running workers. Then invoke the chosen skill and its doctor.

## Architecture

```text
Twin/CLI entry -> capability plugin -> shared runtime/phase gates
                                      |
                            configured trusted providers
                                      |
                   canonical resource pool + Windows DevBoxes
                                      |
                         leased Codespace + AgentOW
```

Source of truth:

- `skills/`: user-facing capability instructions.
- `runtime/`, `contracts/`, `adapters/`: shared implementation.
- `plugins/`: generated, self-contained install units.
- `.claude-plugin/marketplace.json`: generated marketplace.
- `release.json`: version and shared source hashes.

Read [workflow](docs/WORKFLOW.md), [provider protocol](docs/PROVIDERS.md),
[migration plan](docs/MIGRATION.md) and [release process](docs/RELEASING.md).

## Develop

Node 22+; no npm runtime dependencies.

```powershell
npm run build
npm test
npm run check
```

Build copies shared source into each package so separately installed plugins
never depend on repository-relative sibling paths. Generated duplication is a
packaging artifact, not separate implementations.

Without Copilot, run `node runtime/cli.mjs doctor` or `create <bug>`, `status
<run>`, `execute <run> <stage>`, `reconcile <run>`, `progress <run>`. These use
the same gates as the MCP tools and require the same private configuration.

Do not publish this repository or port private scripts/evidence without the
applicable internal authorization. See [LICENSE](LICENSE).
