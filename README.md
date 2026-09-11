# A11y Assist - Plugin catalog

[简体中文](README.zh-CN.md)

Pick the accessibility plugin you need, install it in Copilot CLI, and use it in your own workflow. You do not need the whole suite.

## Choose a plugin

### Knowledge and static review

| Plugin and instructions | What it does | What you need |
|---|---|---|
| [a11y-knowledge](plugins/a11y-knowledge/README.md) | General accessibility guidance for code generation and static review | Copilot CLI and the code or question to review; no execution configuration |
| [a11y-knowledge-odsp](plugins/a11y-knowledge-odsp/README.md) | SPDS, Fluent V8/V9 and SharePoint accessibility guidance, including general foundations | Copilot CLI and relevant project code; no AgentOW, DevBox or provider required |

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

For SPDS, Fluent or SharePoint, choose **a11y-knowledge-odsp**; it already includes general knowledge. Choose **a11y-workflow** only if you want the complete workflow; it does not require installing the individual plugins.

## Install your selection

Register this marketplace once, then install only your chosen plugin:

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install <plugin-name>@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

Knowledge plugins need no execution configuration. Execution plugins need Node.js 22+; evidence-file structural checking needs no provider. Live operations require your authorized, configured connections. Installing a plugin does not provision a Windows evaluator or grant service access.

## For maintainers

Users can stay in the catalog and plugin pages. [Development](docs/DEVELOPMENT.md) explains source, packaging and compatibility exports. [Migration status](docs/MIGRATION.md) and [release guidance](docs/RELEASING.md) are separate from the installation path.

## Access and license

Public visibility is not an open-source license grant. See [LICENSE](LICENSE). Service permissions are separate; never commit credentials, personal profiles or production evidence.
