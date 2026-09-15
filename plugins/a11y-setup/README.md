# a11y-setup

[简体中文](README.zh-CN.md)

## Use this for

Resource-first DevBox setup: establish ownership, then check and prepare selected Windows accessibility tools

## Prerequisites

Copilot with authorized shell access on the actual Windows evaluator; preparation needs host ownership and change authorization.

Node.js 22+.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-setup@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-setup check browser and NVDA on <Windows evaluator>; save installed versions, missing dependencies and exact preparation steps to <private output directory>. Do not install or open apps yet.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Includes resource status/release and an optional original-lease Dev Center start/readback adapter; no separate resources plugin. Cloud power is not Console/AT readiness. Preserve the original allocator and active connections. No forced release, automatic scanner install or implied readiness.

## Reference

- [Environment setup and authorization gates](docs/SETUP.md)
- [Built-in execution adapters and supported scope](docs/EXECUTION-ADAPTERS.md)
- [Capability readiness report](setup/report.template.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
