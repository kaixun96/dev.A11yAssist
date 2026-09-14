# a11y-report

[简体中文](README.zh-CN.md)

## Use this for

Generate the overall accessibility report after validation and any approved Bug filing

## Prerequisites

Original private discovery journal, artifact bytes and compatible category-plugin version.

Node.js 22+.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-report@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-report Generate the final report for <task>: distinct issue counts/categories, actual Bug links, evidence, all uncovered steps and cleanup.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Reuses one shared report generator; no tests, source changes or Bug creation. Pending effects require reconciliation. Local report delivery does not imply a message was sent; gaps and unfiled findings remain visible.

## Reference

- [Aggregate reports and verified delivery](docs/REPORT.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
