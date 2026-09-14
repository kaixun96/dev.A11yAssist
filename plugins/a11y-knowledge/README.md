# a11y-knowledge

[简体中文](README.zh-CN.md)

## Use this for

Accessibility guidance and static review for generic and ODSP projects using portable foundations and supplied current component documentation

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
/a11y-knowledge Review this Fluent V9 dialog for keyboard, focus restoration and announcements using the built-in component knowledge.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

One installation includes offline portable topics; no extra plugin is needed. Establish project-specific rules from supplied current documentation and the matching stack/version; unavailable rules are context gaps. Read-only, no scanners or real AT. Static review is not runtime verification.

## Reference

- [General accessibility topics](knowledge/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
