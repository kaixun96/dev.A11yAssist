# A11y Assist

[![English](docs/assets/language-en.svg)](README.md) [![简体中文](docs/assets/language-zh-cn.svg)](README.zh-CN.md)

Accessibility knowledge and modular workflow plugins for Copilot CLI.
Use accessibility guidance while generating or reviewing code, or configure
individual capabilities for an evidence-first bug-fixing workflow.

**Just want to avoid common accessibility mistakes in generated code? Start with
`a11y-knowledge`.** You do not need AgentOW, a DevBox or workflow configuration.

## Quick start: accessibility guidance and static code review

In Copilot CLI:

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge@a11y-assist
```

Restart Copilot to load the plugin, then ask:

```text
/a11y-knowledge Review this component for potential accessibility issues.
```

Or ask your coding assistant:

```text
Use /a11y-knowledge to guide this component's implementation and statically
review the generated code for accessibility issues.
```

The plugin supplies rules and read-only review guidance; your coding assistant
remains responsible for generating or changing code. It helps identify issues
with native semantics, accessible names, ARIA, keyboard handling, focus and
announcements. Apply framework-specific guidance only where it fits your project.

**Read-only is the default.** You do not need to repeat "do not run a browser or
assistive technology" in every prompt. The knowledge plugin does not start a
remediation workflow, launch browsers, operate AT or run detection tools.
Its review is model-based source reasoning, not an automated scanner or a
guarantee of accessibility conformance. Behavior that cannot be established from
source remains unverified.

### What knowledge is included?

| Topic | Covers |
|---|---|
| Foundations | Source-based reasoning, applicable standards, concrete findings and uncertainty |
| Component semantics | Native elements, names/roles/states, structure, relationships and component contracts |
| Keyboard and focus | Keyboard operation, dialogs, navigation, focus retention and restoration |
| Forms and content | Labels, validation, groups, image alternatives, tables and media semantics |
| Dynamic content | Loading/results/errors, status messages, announcement ownership and stable focus |
| Visual accessibility | Source-visible contrast, focus styling, reflow, text, targets and motion risks |

Topics are loaded by relevance, not all at once. No framework, operating system,
repository or coding-workflow dependency is assumed. Examples use standard web
markup; apply platform equivalents only when their actual contracts are known.
See the [knowledge index](knowledge/README.md).

The knowledge-only package does not include AgentOW protocols, host setup or
PR-publication instructions. Those retained execution references live separately
in [integrations/agentow/](integrations/agentow/README.md).

## Choose a plugin

Invoke a plugin with `/<plugin-name>` after installation.

| Plugin | Use it for | Current availability |
|---|---|---|
| `a11y-knowledge` | Code-generation guidance, static review and accessibility questions | Usable without providers |
| `a11y-intake` | Bug intake, acceptance criteria and canonical scenarios | Requires a qualified provider |
| `a11y-resources` | Inspect shared resource ownership and readiness | Status interface; not a general acquisition tool |
| `a11y-capture` | Real Windows AT BEFORE/AFTER evidence | Requires a qualified provider |
| `a11y-validate` | Evidence integrity and independent behavior evaluation | Requires a qualified provider |
| `a11y-publish` | Reviewer-safe Draft PR and evidence publication | Requires a qualified provider |
| `agent-operations` | Durable progress, reconciliation and owned cleanup | Requires a qualified provider |
| `a11y-workflow` | Coordinate the complete evidence-first workflow | Requires qualified providers, including AgentOW integration |

Each execution plugin bundles the same generic knowledge snapshot and a separate
profile for its existing execution integration. It reads
those files directly; it does not need to call or separately install
`a11y-knowledge`. The full workflow also bundles its stage tools, so installing
all the smaller plugins is unnecessary.

## Execution workflows

**The execution plugins are an installable foundation, not a turnkey live
deployment.** This repository provides the shared runtime and gates. You must
configure and qualify the providers that actually access work items, manage
resources, collect evidence and publish PRs. Missing providers stop execution;
`doctor` reports configuration, not proof of a working evaluator.

Supported execution setups are **Twinbot + multiple Windows DevBoxes** or
**Copilot CLI + one/multiple Windows DevBoxes**. These host requirements do not
apply to read-only knowledge use. Execution plugins require Node.js 22+.

For the full entrypoint:

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-workflow@a11y-assist
copilot plugin marketplace add kaixun96/dev.AgentOW
copilot plugin install agentow-copilot@agentOW
```

Use a template from [config/](config/) to create your private provider
configuration, then set its absolute path before restarting Copilot:

```powershell
$env:A11Y_ASSIST_CONFIG = 'C:\YourPrivateDirectory\a11y-config.json'
```

Read the [workflow contract](docs/WORKFLOW.md) and
[provider setup](docs/PROVIDERS.md) before execution. Real BEFORE/AFTER evidence
and applicable gates are mandatory; static code review is not a substitute.

To install one execution capability instead, use
`copilot plugin install <plugin-name>@a11y-assist`.
[tools/install.ps1](tools/install.ps1) can print the install commands;
`-Execute` runs them and `-Plugin all` installs all eight packages.

## Relationship with AgentOW

AgentOW is a separate plugin. **Its existing `/agentow-a11y` flow does not
automatically call these plugins.**

Knowledge migration is currently **copy first**: the shared topics are available
here, while AgentOW's original files, references and runtime remain unchanged.
Generic static-review knowledge is separate from the preserved operational and
project-specific material under `integrations/agentow/`. Only execution packages
include that profile; `a11y-knowledge` neither packages nor reads it.
Cross-repository integration and redundancy cleanup are deferred until the
complete integration is ready. Installing this repository does not switch
AgentOW's dependencies or update existing workers.

The intended full-workflow integration keeps source work with AgentOW and real
AT control with the Windows evidence provider. It must not recursively call
`a11y-workflow` from an AgentOW source step or use AgentOW's unverified Draft
fallback to bypass A11y Assist's stricter gates.

See [knowledge migration](docs/KNOWLEDGE.md) and
[execution rollout](docs/MIGRATION.md).

## Updates and development

Update plugins through your host's supported plugin manager and restart when
required, at a safe point. A repository push does not hot-update active sessions.
Keep the installed versions used by an active workflow pinned.

Source lives in `skills/`, `knowledge/`, `integrations/`, `runtime/`, `contracts/`
and `adapters/`.
`plugins/`, the marketplace and release manifests are generated; do not hand-edit
them. Self-contained package copies are distribution artifacts, not separate
implementations.
Build removes retired files from generated packages so obsolete operational
instructions cannot remain inside a knowledge-only package after an update.

With Node.js 22+:

```powershell
npm run build
npm test
npm run check
```

See the [release process](docs/RELEASING.md).

## Access and license

The repository is public, but public visibility does not grant an open-source
license; see [LICENSE](LICENSE). Access to operational services is separate.
Do not contribute credentials, browser profiles, private environment
configuration or production evidence.
