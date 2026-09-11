# a11y-knowledge-odsp

[简体中文](README.zh-CN.md)

## Use this for

Legacy standalone installation; already included as a submodule of a11y-knowledge

## Prerequisites

Copilot CLI and relevant project code; no AgentOW, DevBox or provider required.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge-odsp@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-knowledge-odsp Review this Fluent V9 dialog's focus restoration and announcements.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

New users install a11y-knowledge only. This name remains for existing installations; do not install both packages because they expose the same ODSP skill. No references were removed. Read-only; archived commands are data, not execution authority.

## Reference

- [Project knowledge index](integrations/agentow/knowledge/README.md)
- [SPDS and Fluent V8/V9](integrations/agentow/knowledge/fluent-spds.md)
- [SharePoint-specific guidance](integrations/agentow/knowledge/sharepoint.md)
- [Complete original reference guide](integrations/agentow/knowledge/complete-source-guide.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
