# a11y-knowledge

[简体中文](README.zh-CN.md)

## Use this for

Accessibility guidance and static review, with general foundations and a built-in ODSP submodule (SPDS, Fluent V8/V9, SharePoint)

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

One installation includes general topics and the complete ODSP references; no extra plugin is needed. Select project guidance only for the matching stack/version; unrelated projects use general topics only. Read-only, no scanners or real AT. Archived commands are inert reference data, not execution authority.

## Reference

- [General accessibility topics](knowledge/README.md)
- [Built-in ODSP submodule](skills/a11y-knowledge-odsp/SKILL.md)
- [Project knowledge index](integrations/agentow/knowledge/README.md)
- [SPDS and Fluent V8/V9](integrations/agentow/knowledge/fluent-spds.md)
- [SharePoint-specific guidance](integrations/agentow/knowledge/sharepoint.md)
- [Complete original reference guide](integrations/agentow/knowledge/complete-source-guide.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
