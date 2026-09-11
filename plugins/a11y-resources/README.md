# a11y-resources

[简体中文](README.zh-CN.md)

## Use this for

Inspect resource status; release an explicitly authorized completed evaluator assignment

## Prerequisites

Authorized resource connection; release additionally needs the original completed, owned assignment.

Node.js 22+.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-resources@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-resources Show resource ownership and readiness through my configured connection; do not acquire or release anything.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Not a generic allocator or recovery driver. Stale status does not release ownership. release-evaluator is a separate explicit action, not part of a status query.

## Reference

- [Capability interfaces and boundaries](docs/CAPABILITIES.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
