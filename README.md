# A11y Assist - Plugin catalog

[简体中文](README.zh-CN.md)

Pick the accessibility plugin you need, install it in Copilot CLI, and use it in your own workflow. You do not need the whole suite.

## Choose a plugin

### Feature bug bash

| Plugin and instructions | What it does | What you need |
|---|---|---|
| [a11y-bug-bash](plugins/a11y-bug-bash/README.md) | Feature accessibility bug bash: plan from context and verification steps, inspect the page, review source and separate reproduced bugs from code risks | Feature context and verification steps; Node.js 22+ and enabled host MCP for knowledge; read-only source for code review; existing authorized Windows browser/AT tools and ownership for live checks |

### Environment preparation

| Plugin and instructions | What it does | What you need |
|---|---|---|
| [a11y-setup](plugins/a11y-setup/README.md) | Check and prepare a Windows A11y environment: selected browser, NVDA, audio and Voice Access dependencies | Node.js 22+ and enabled host MCP for knowledge; authorized shell access on the actual Windows evaluator for setup checks; preparation needs host ownership and change authorization |

### Knowledge and static review

| Plugin and instructions | What it does | What you need |
|---|---|---|
| [a11y-knowledge](plugins/a11y-knowledge/README.md) | Accessible code guidance, root-cause analysis, static/design review and test planning using shared Common, SPDS, Fluent V8/V9 and SharePoint knowledge | Node.js 22+, enabled host MCP and the code or question to review; automatic KB resolution, no execution configuration or peer plugin |

### Individual capabilities

| Plugin and instructions | What it does | What you need |
|---|---|---|
| [a11y-intake](plugins/a11y-intake/README.md) | Read an authorized work item and prepare acceptance criteria and a reproduction scenario | Configured work-item access; built-in ADO read-item uses host-managed authentication |
| [a11y-resources](plugins/a11y-resources/README.md) | Inspect resource status; release an explicitly authorized completed evaluator assignment | Authorized resource connection; release additionally needs the original completed, owned assignment |
| [a11y-capture](plugins/a11y-capture/README.md) | Capture BEFORE/AFTER evidence with real Windows assistive technology | Qualified Windows capture connection, owned evaluator and a sealed scenario; AFTER needs the actual source HEAD |
| [a11y-validate](plugins/a11y-validate/README.md) | Check existing evidence files; optionally request independent behavior evaluation | Node.js 22+ and evidence-v1 files for structural checks; behavior evaluation requires a qualified connection |
| [a11y-publish](plugins/a11y-publish/README.md) | Attach evidence to an existing Draft PR; integrate broader publication when configured | Authorized PR connection, exact HEAD and hash-bound files; built-in attachment action uses ADO authentication |
| [agent-operations](plugins/agent-operations/README.md) | Clean up explicitly owned resources and reconcile scoped media or NVDA recovery | Authorized operations connection and original ownership records for the requested scope |

### Optional complete workflow

| Plugin and instructions | What it does | What you need |
|---|---|---|
| [a11y-workflow](plugins/a11y-workflow/README.md) | Optional end-to-end evidence-first remediation workflow | Qualified work-item, resource, Windows capture, source, validation, review, publication and cleanup connections |

Open a plugin above for its installation command, prerequisites, example, limitations and bundled reference links.

Choose **a11y-knowledge** for accessible code guidance and read-only review, **a11y-setup** for scoped Windows environment checks and authorized preparation, or **a11y-bug-bash** for feature discovery with the same knowledge and setup skills reused internally. All ten plugins reference the current shared Common, Fluent and SharePoint KB through their own read-only knowledge MCP; no peer knowledge plugin is needed. Choose **a11y-workflow** only if you want the complete workflow.

## Install your selection

Register this marketplace once, then install only your chosen plugin:

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install <plugin-name>@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

Knowledge use requires Node.js 22+ and enabled host MCP support, but no provider or execution configuration. The KB resolves automatically from an optional configured root, validated development layout, shared user cache, then a pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB requires network access to the published pinned artifact; a local build does not publish it. Evidence-file structural checking needs no provider. Live operations require authorized, configured connections. Installing a plugin does not provision a Windows evaluator or grant service access.

## For maintainers

Users can stay in the catalog and plugin pages. [Development](docs/DEVELOPMENT.md) explains source and packaging; [shared knowledge](docs/KNOWLEDGE.md) and [release guidance](docs/RELEASING.md) cover KB distribution and publishing.

## Access and license

Public visibility is not an open-source license grant. See [LICENSE](LICENSE). Service permissions are separate; never commit credentials, personal profiles or production evidence.
