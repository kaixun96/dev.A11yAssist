# a11y-intake

[简体中文](README.zh-CN.md)

## Use this for

Read an authorized work item and prepare acceptance criteria and a reproduction scenario

## Prerequisites

Configured work-item access; built-in ADO read-item uses host-managed authentication.

Node.js 22+.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-intake@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-intake Read the authorized work item <item URL> and identify expected behavior and missing reproduction details.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

ADO read-item fetches fields, discussion and attachment metadata; it does not review attachment bytes or claim that acceptance is complete. No evaluator, source branch or PR is acquired. Apply your deployment's ownership gate first.

## Reference

- [Native ADO operations and setup](docs/NATIVE-CAPABILITIES.md)
- [Capability interfaces and boundaries](docs/CAPABILITIES.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
