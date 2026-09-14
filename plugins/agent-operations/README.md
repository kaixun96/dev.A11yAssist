# agent-operations

[简体中文](README.zh-CN.md)

## Use this for

Clean up explicitly owned resources and reconcile scoped media or NVDA recovery

## Prerequisites

Authorized operations connection and original ownership records for the requested scope.

Node.js 22+.

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

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
