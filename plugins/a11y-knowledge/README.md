# a11y-knowledge

[简体中文](README.zh-CN.md)

## Use this for

Accessible code guidance, root-cause analysis, static/design review and test planning using shared Common, SPDS, Fluent V8/V9 and SharePoint knowledge

## Prerequisites

Node.js 22+, enabled host MCP and the code or question to review; automatic KB resolution, no execution configuration or peer plugin.

This plugin registers its own read-only knowledge MCP for shared Common, Fluent and SharePoint entries. Knowledge use requires Node.js 22+ and enabled host MCP support; no peer plugin, provider or `A11Y_ASSIST_CONFIG` is required. Resolution is automatic: optional configured KB root, validated repository layout, verified shared user cache, then pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB needs network access and the published pinned artifact; a local build does not publish it. Cached/local use works offline. Invalid configured roots or tampered caches fail explicitly, without fallback or repair. Read full entries with citations and source status; pending sources are gaps, not authority. See [knowledge availability](references/README.md).

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-knowledge@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-knowledge Review this Fluent V9 dialog for keyboard, focus restoration and announcements using the pinned shared component knowledge; cite full entries and source status.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Read-only knowledge MCP, no operational runtime, scanners or real AT. References pin shared Common, Fluent and SharePoint packages; KB bodies are not bundled. Select project guidance only for the actual stack/version. First uncached use needs a valid local KB or network access to the published pinned artifact; a local build does not publish it. Read full entries: search snippets are not rules and pending sources are gaps. Knowledge grants no execution authority.

## Reference

- [Shared KB pins and automatic knowledge MCP](references/README.md)
- [Read-only knowledge guidance](skills/a11y-knowledge/SKILL.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
