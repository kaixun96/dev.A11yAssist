# A11y Assist plugins

A public repository of modular Copilot CLI plugins for **Twinbot + multiple
Windows DevBoxes** or **Copilot CLI + one/multiple Windows DevBoxes**.
Install one capability or the complete workflow entrypoint.

Public repository access does not grant access to Azure DevOps, Dev Center,
Codespaces, or an evaluator pool. Those require your own authorized environment.
Public visibility also does not grant an open-source license; see [LICENSE](LICENSE).

## v0.2 status: shared knowledge plus an installable workflow foundation

Seven execution plugins plus a read-only knowledge plugin, real MCP tools, shared executable phase
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
| a11y-knowledge | `/a11y-knowledge` | Shared criteria, component review, AT/evidence and media knowledge; no MCP or resource access |

## Use knowledge only

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge@a11y-assist
```

Restart Copilot, then use `/a11y-knowledge`. No provider configuration or AgentOW
installation is needed to read the knowledge. [knowledge/](knowledge/README.md)
is the destination for the extracted AgentOW A11y references. Migration is
copy-first: AgentOW's original files and references remain unchanged until the
later coordinated integration and redundancy cleanup.
Every execution plugin also bundles the same versioned snapshot and selects topics
by trigger; the complete workflow needs no separate knowledge-plugin installation.

## Install one capability

The marketplace is public; no repository invitation is required. Use Copilot CLI
with Node.js 22+ available to its plugin processes.

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
performing them and `-Plugin all` installing all eight.

Copy a template from `config/` to a private location, fill in your shared state
root and trusted providers, and set:

```powershell
$env:A11Y_ASSIST_CONFIG = 'C:\YourPrivateDirectory\a11y-config.json'
```

Restart Copilot to load new plugins/environment. In Twin use its **Restart
Copilot** control only at an authorized safe point; installing files does not
update already-running workers. Then invoke the chosen skill and its doctor.

## Using these plugins with AgentOW

**Knowledge sharing and workflow execution are separate integrations.**
This release copies knowledge into the plugin repository without switching
AgentOW's current documentation dependencies. Pinned AgentOW consumption and
redundancy cleanup are deferred; see [knowledge migration](docs/KNOWLEDGE.md).
Automatic cross-host workflow execution is not implemented.
Skills and MCP tools become available to the Copilot session that loads
them. AgentOW does not discover or invoke this repository merely from its URL,
and its workflows are not automatically rewritten by installing these packages.

The intended direction is:

```text
a11y-workflow -> qualified AgentOW provider -> /agentow-a11y (source work)
             -> capture / validation / publication providers
```

AgentOW integration can use a narrowly scoped capability's MCP tools where that
plugin is loaded and its trusted provider is configured. A plugin installed on a
Windows DevBox is not automatically available in a Codespace, nor does installing
it in a Codespace grant remote DevBox control. Providers must implement the
authorized cross-host handoff and preserve original ownership and evidence gates.

Do not call the complete `a11y-workflow` recursively from an AgentOW source step.
BEFORE/AFTER and real assistive-technology control remain with the Windows
evaluator provider; AgentOW performs source work in its leased Codespace.
The stricter A11y Assist contract rejects an unverified Draft PR fallback.
See [provider integration](docs/PROVIDERS.md) and [migration gates](docs/MIGRATION.md).

## Updates

Repository changes are not hot-loaded into active sessions. Update installed
plugins through the host's supported plugin manager and restart when required,
at a safe point. Keep compatible plugin/provider versions pinned for an active
run; do not silently upgrade its evidence or ownership state.
See [release process](docs/RELEASING.md).

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
- `knowledge/`: indexed shared knowledge destination and generated content-hash manifest.
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

Keep credentials, tenant configuration, private scripts and production evidence
out of this public repository. Only contribute material you are authorized to
publish. Repository visibility does not change the terms in [LICENSE](LICENSE).
