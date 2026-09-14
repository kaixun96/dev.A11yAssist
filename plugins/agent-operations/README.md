# agent-operations

[简体中文](README.zh-CN.md)

## Use this for

Clean up explicitly owned resources and reconcile scoped media or NVDA recovery

## Prerequisites

Authorized operations connection and original ownership records for the requested scope.

Node.js 22+.

This plugin registers its own read-only knowledge MCP for shared Common, Fluent and SharePoint entries. Knowledge use requires Node.js 22+ and enabled host MCP support; no peer plugin, provider or `A11Y_ASSIST_CONFIG` is required. Resolution is automatic: optional configured KB root, validated repository layout, verified shared user cache, then pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB needs network access and the published pinned artifact; a local build does not publish it. Cached/local use works offline. Invalid configured roots or tampered caches fail explicitly, without fallback or repair. Read full entries with citations and source status; pending sources are gaps, not authority. See [knowledge availability](references/README.md).

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install agent-operations@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/agent-operations Read the status of <existing operation ID>; do not retry execution or stop any process.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Not a general process-killing tool. recover-media and recover-nvda use original recorded identities and prove only their narrow scope, not full cleanup. Busy, unowned or incompletely recorded tasks cannot be taken over.

## Reference

- [Capability interfaces and boundaries](docs/CAPABILITIES.md)
- [Connection setup and protocol](docs/PROVIDERS.md)
- [Shared KB pins and automatic knowledge MCP](references/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
