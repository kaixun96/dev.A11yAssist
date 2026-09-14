# a11y-setup

[简体中文](README.zh-CN.md)

## Use this for

Check and prepare a Windows A11y environment: selected browser, NVDA, audio and Voice Access dependencies

## Prerequisites

Node.js 22+ and enabled host MCP for knowledge; authorized shell access on the actual Windows evaluator for setup checks; preparation needs host ownership and change authorization.

This plugin registers its own read-only knowledge MCP for shared Common, Fluent and SharePoint entries. Knowledge use requires Node.js 22+ and enabled host MCP support; no peer plugin, provider or `A11Y_ASSIST_CONFIG` is required. Resolution is automatic: optional configured KB root, validated repository layout, verified shared user cache, then pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB needs network access and the published pinned artifact; a local build does not publish it. Cached/local use works offline. Invalid configured roots or tampered caches fail explicitly, without fallback or repair. Read full entries with citations and source status; pending sources are gaps, not authority. See [knowledge availability](references/README.md).

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-setup@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-setup check browser and NVDA on <Windows evaluator>; save installed versions, missing dependencies and exact preparation steps to <private output directory>. Do not install or open apps yet.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Uses the shared scoped native setup helper and its own read-only knowledge MCP for Common, Fluent and SharePoint. No peer plugin, operational MCP, browser helper, provider or bundled KB bodies. Knowledge access grants no setup authority; first uncached use needs a valid local KB or network access to the published pinned artifact. Plugin installation does not install third-party tools. Prepare only an explicitly approved dependency subset; driver, consent, elevation and restart are separate gates. No automatic scanner/ADK installation or live provider setup. Installed does not mean runtime-ready.

## Reference

- [Environment setup and authorization gates](docs/SETUP.md)
- [Capability readiness report](setup/report.template.md)
- [Shared KB pins and automatic knowledge MCP](references/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
