# a11y-capture

[简体中文](README.zh-CN.md)

## Use this for

Capture real Windows AT evidence and recover owned recording, audio or NVDA resources

## Prerequisites

Qualified Windows capture connection with per-attempt preflight/postcheck, owned evaluator and a sealed scenario; AFTER needs the actual source HEAD.

Node.js 22+.

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-capture@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-capture Capture BEFORE for <sealed scenario> on <owned evaluator> using the authorized capture connection.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Built-in observe-at collects raw NVDA Speech Viewer, Narrator ETW/audio and Voice Access overlay-command/UIA/audio under original ownership. Raw output is not BEFORE/AFTER/discovery PASS; behavior, media and overlay mapping require independent review. No automatic tool installation, borrowed-process stop or lease release.

## Reference

- [Capability interfaces and boundaries](docs/CAPABILITIES.md)
- [Connection setup and protocol](docs/PROVIDERS.md)
- [Built-in execution adapters and supported scope](docs/EXECUTION-ADAPTERS.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
