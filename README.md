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

## Use capabilities inside your own workflow

Invoke a plugin with `/<plugin-name>` after installation.

Small plugins accept their own inputs and return results. They do not require
the full workflow, an AgentOW session or unrelated earlier stages.

| Plugin | Use it for | Prerequisites |
|---|---|---|
| `a11y-knowledge` | Code-generation guidance, static review and accessibility questions | Usable without providers |
| `a11y-intake` | Work-item intake, acceptance criteria and scenarios | An authorized work-item tool connection |
| `a11y-resources` | Inspect shared resource ownership and readiness | Status interface; not a general acquisition tool |
| `a11y-capture` | Real Windows AT BEFORE/AFTER evidence | Authorized Windows capture connection and owned evaluator |
| `a11y-validate` | Check existing evidence; optionally obtain independent behavior evaluation | Evidence-v1 structural checks work directly; behavior evaluation needs an evaluation connection |
| `a11y-publish` | Reviewer-safe Draft PR and evidence publication | Authorized PR/media publication connection |
| `agent-operations` | Explicitly scoped cleanup and operation reconciliation | Connection authorized for the specified owned resources |
| `a11y-workflow` | Optional complete evidence-first composition | Relevant execution connections plus a chosen source/review implementation |

For example, call `a11y_validate_evidence` to check existing request/result files
without creating a Bug run or configuring an external service. It validates the
artifact contract, not the media's actual behavior.

External operations use `<prefix>_invoke` with an `operationId`, action, context
and input. Their operation journal prevents duplicate effects; it does not impose
a global workflow. The caller decides what follows, including after a nonpass
result. See [capability inputs and examples](docs/CAPABILITIES.md).

Each execution plugin bundles the same generic knowledge snapshot and a separate
profile for its existing execution integration. It reads
those files directly; it does not need to call or separately install
`a11y-knowledge`. The full workflow also bundles its stage tools, so installing
all the smaller plugins is unnecessary.

**Native execution in v0.5:** `read-item` retrieves a real ADO work item and all
discussion pages; `attach-evidence` uploads hash-bound files to an existing Draft
PR, verifies downloaded bytes, and updates/readbacks its description and HEAD.
These operations use the built-in ADO connection, not a custom provider program.
They do not interpret discussion, review attachment content, create a PR or
verify media playback. See [native capabilities](docs/NATIVE-CAPABILITIES.md).

## Optional complete workflow

**Use `a11y-workflow` only when you want our complete orchestration.** It calls
the same capability implementation and adds phase ordering, BEFORE/AFTER,
review, failure and cleanup policy. AgentOW and other callers may retain their
own workflows and call small plugins directly.

Connections to external tools still need configuration; installing a plugin
does not grant work-item, machine or PR access. The current connection mechanism
wraps trusted executables; tools in another MCP server are not automatically
connected. Missing connections stop the requested operation;
`doctor` reports configuration, not proof of a working evaluator.

Supported execution setups are **Twinbot + multiple Windows DevBoxes** or
**Copilot CLI + one/multiple Windows DevBoxes**. These host requirements do not
apply to knowledge, structural evidence checking or independent non-capture
operations. Execution plugins require Node.js 22+.

For the full entrypoint:

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-workflow@a11y-assist
```

Choose `source` and `review` connections for your coding environment. AgentOW is
optional, not installed by default. To use the existing AgentOW/odsp-web profile,
install `agentow-copilot@agentOW` separately and explicitly select
`workflowProfile: "agentow-odsp"` with its `agentow` connection.

Use a template from [config/](config/) to create your private tool-connection
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
Add `-WithAgentOW` only when you explicitly want that separate plugin too.

## Relationship with AgentOW

AgentOW is a separate caller, not the required parent of these plugins.
It can call loaded capability MCP tools while retaining its own workflow.
Its existing `/agentow-a11y` orchestration is not silently replaced.

The evidence-v1 validator is maintained here in `runtime/evidence-v1.mjs`.
AgentOW can consume a commit-pinned generated copy at its existing tool path,
preserving offline operation without maintaining another implementation.
See [the consumer integration](integrations/agentow/README.md).

Additional canonical execution sources live in `native/`: Windows host setup,
ADO evidence attachments and PR-description budgeting. The retained personal
browser/campaign implementation is explicitly an AgentOW integration under
`integrations/agentow/runtime/`. Reviewed AgentOW consumers use pinned generated
copies; installed workers are not switched by a source release.

Knowledge migration is currently **copy first**: the shared topics are available
here; other original AgentOW references and the live runtime are retained.
Generic static-review knowledge is separate from the preserved operational and
project-specific material under `integrations/agentow/`. Only execution packages
include that profile; `a11y-knowledge` neither packages nor reads it.
Remaining cross-repository migration and redundant-authoring cleanup are deferred
until their compatibility gates pass. Installing this repository does not update
existing workers.

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
