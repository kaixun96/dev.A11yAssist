# a11y-bug-bash

[简体中文](README.zh-CN.md)

## Use this for

Feature accessibility bug bash: plan from context and verification steps, inspect the page, review source and separate reproduced bugs from code risks

## Prerequisites

Feature context and verification steps; Node.js 22+ and enabled host MCP for knowledge; read-only source for code review; existing authorized Windows browser/AT tools and ownership for live checks.

This plugin registers its own read-only knowledge MCP for shared Common, Fluent and SharePoint entries. Knowledge use requires Node.js 22+ and enabled host MCP support; no peer plugin, provider or `A11Y_ASSIST_CONFIG` is required. Resolution is automatic: optional configured KB root, validated repository layout, verified shared user cache, then pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB needs network access and the published pinned artifact; a local build does not publish it. Cached/local use works offline. Invalid configured roots or tampered caches fail explicitly, without fallback or repair. Read full entries with citations and source status; pending sources are gaps, not authority. See [knowledge availability](references/README.md).

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-bug-bash@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-bug-bash Review <feature>: <context and expected behavior>. Verify using <steps> on <authorized test URL and safe fixture>; source <paths/revision>. Use my existing browser connection, budget 30 minutes, save to <private output directory>. Report page bugs and code risks separately; do not fix or file.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Discovery framework with read-only knowledge MCP only; no browser, scanner, AT or provider runtime. Internally reuses the single knowledge and setup skills with this plugin's knowledge tools and top-root KB references; setup resources use an explicit internal directory, not a second plugin root. No peer plugin, duplicate public skill or bundled KB bodies. Setup defaults to check/planning; preparing selected dependencies needs separate host-change authorization and actual ownership. First uncached knowledge use needs a valid local KB or network access to the published pinned artifact. Missing tools or source produce explicit partial coverage, not PASS. No automatic source edits, builds, bug filing or PRs.

## Reference

- [Bug Bash workflow and boundaries](docs/BUG-BASH.md)
- [Feature context template](bug-bash/context.template.md)
- [Findings and coverage report template](bug-bash/report.template.md)
- [Environment setup and authorization gates](docs/SETUP.md)
- [Reused internal environment setup](modules/a11y-setup/skills/a11y-setup/SKILL.md)
- [Reused internal knowledge review](modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md)
- [Shared KB pins and automatic knowledge MCP](references/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
