# a11y-validate

[简体中文](README.zh-CN.md)

## Use this for

Check existing evidence files; optionally request independent behavior evaluation

## Prerequisites

Node.js 22+ and evidence-v1 files for structural checks; behavior evaluation requires a qualified connection.

Node.js 22+.

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
- [Evidence-v1 file format](integrations/agentow/knowledge/evidence-contract.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
