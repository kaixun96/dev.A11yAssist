# a11y-workflow

[简体中文](README.zh-CN.md)

## Use this for

Optional end-to-end evidence-first remediation workflow

## Prerequisites

Qualified work-item, resource, Windows capture, source, validation, review, publication and cleanup connections.

Node.js 22+.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-workflow@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-workflow Check my configuration for <exact Bug>; report missing connections before starting any execution.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Includes the shared capabilities; sibling plugins are not prerequisites. AgentOW is optional. Installation is not a ready-to-run environment. No reproduced BEFORE means no source change or PR; no unverified publication fallback.

## Reference

- [Optional workflow and evidence gates](docs/WORKFLOW.md)
- [Connection setup and protocol](docs/PROVIDERS.md)
- [Capability interfaces and boundaries](docs/CAPABILITIES.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
