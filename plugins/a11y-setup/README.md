# a11y-setup

[简体中文](README.zh-CN.md)

## Use this for

Check and prepare a Windows A11y environment: selected browser, NVDA, audio and Voice Access dependencies

## Prerequisites

Copilot with authorized shell access on the actual Windows evaluator; preparation needs host ownership and change authorization.

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

Reuses AgentOW's shared host installer; no AgentOW or MCP dependency. Plugin installation does not install third-party tools. Prepare only an approved subset; driver, consent, elevation and restart are separate gates. No automatic scanner/ADK installation or live provider setup. Installed does not mean runtime-ready.

## Reference

- [Environment setup and authorization gates](docs/SETUP.md)
- [Capability readiness report](setup/report.template.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
