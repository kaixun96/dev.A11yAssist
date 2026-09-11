# a11y-knowledge

[简体中文](README.zh-CN.md)

## Use this for

General accessibility guidance for code generation and static review

## Prerequisites

Copilot CLI and the code or question to review; no execution configuration.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-knowledge Review this component for keyboard, focus and accessible-name issues.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Read-only source analysis. Does not edit code, run scanners or test assistive technology. Guidance is not a conformance verdict.

## Reference

- [General accessibility topics](knowledge/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
