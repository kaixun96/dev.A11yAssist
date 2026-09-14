# a11y-validate

[简体中文](README.zh-CN.md)

## Use this for

Check existing evidence files; optionally request independent behavior evaluation

## Prerequisites

Node.js 22+ and evidence-v1 files for structural checks; behavior evaluation requires a qualified connection.

Node.js 22+.

This plugin registers its own read-only knowledge MCP for shared Common, Fluent and SharePoint entries. Knowledge use requires Node.js 22+ and enabled host MCP support; no peer plugin, provider or `A11Y_ASSIST_CONFIG` is required. Resolution is automatic: optional configured KB root, validated repository layout, verified shared user cache, then pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB needs network access and the published pinned artifact; a local build does not publish it. Cached/local use works offline. Invalid configured roots or tampered caches fail explicitly, without fallback or repair. Read full entries with citations and source status; pending sources are gaps, not authority. See [knowledge availability](references/README.md).

For `a11y_validate_evidence` structural checks, skip provider configuration. Configure a connection only for independent behavior evaluation.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-validate@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-validate Check the structure of these evidence-v1 request/result files without starting a workflow or controlling a browser.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

The a11y_validate_evidence tool needs no provider or run journal. Structure and hash checks are not real AT or behavior PASS. Verify mode also needs baseline files and the repository root.

## Reference

- [Capability interfaces and boundaries](docs/CAPABILITIES.md)
- [Optional workflow and evidence gates](docs/WORKFLOW.md)
- [Shared KB pins and automatic knowledge MCP](references/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
