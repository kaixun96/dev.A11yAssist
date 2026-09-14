# a11y-file-bug

[简体中文](README.zh-CN.md)

## Use this for

Create an explicitly approved Bug after validation, with detailed reproduction, cause uncertainty and verified evidence attachments

## Prerequisites

Validated original discovery task/finding, reviewed artifacts, project metadata and an authorized Bug connection.

Node.js 22+.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-file-bug@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-file-bug Draft a Bug for <validated task/finding>; include environment, reproduction, expected/actual behavior, cause and reviewed video timestamps. Do not submit until approved.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Native ADO WIT creation and attachment readback; deterministic operation reconciliation, no automatic filing. Only observed-page findings, not seeded defects or source risks. Simple upload is bounded to 128 MiB total; larger evidence needs an approved chunked adapter. No PR operations.

## Reference

- [Bug descriptions, creation and evidence attachments](docs/FILE-BUG.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
