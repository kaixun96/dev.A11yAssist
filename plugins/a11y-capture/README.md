# a11y-capture

[简体中文](README.zh-CN.md)

## Use this for

Capture BEFORE/AFTER evidence with real Windows assistive technology

## Prerequisites

Qualified Windows capture connection, owned evaluator and a sealed scenario; AFTER needs the actual source HEAD.

Node.js 22+.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-capture@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-capture Capture BEFORE for <sealed scenario> on <owned evaluator> using the authorized capture connection.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Installation does not provision a DevBox or recorder. No synthetic AT results. Preserve scenario/evaluator identity for AFTER; missing capabilities are explicit blockers.

## Reference

- [Capability interfaces and boundaries](docs/CAPABILITIES.md)
- [Connection setup and protocol](docs/PROVIDERS.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
