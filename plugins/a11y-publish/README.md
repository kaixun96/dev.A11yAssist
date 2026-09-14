# a11y-publish

[简体中文](README.zh-CN.md)

## Use this for

Attach evidence to an existing Draft PR; integrate broader publication when configured

## Prerequisites

Authorized PR connection, exact HEAD and hash-bound files; built-in attachment action uses ADO authentication.

Node.js 22+.

This plugin registers its own read-only knowledge MCP for shared Common, Fluent and SharePoint entries. Knowledge use requires Node.js 22+ and enabled host MCP support; no peer plugin, provider or `A11Y_ASSIST_CONFIG` is required. Resolution is automatic: optional configured KB root, validated repository layout, verified shared user cache, then pinned HTTPS download. KB bodies are not bundled. First uncached use without a valid local KB needs network access and the published pinned artifact; a local build does not publish it. Cached/local use works offline. Invalid configured roots or tampered caches fail explicitly, without fallback or repair. Read full entries with citations and source status; pending sources are gaps, not authority. See [knowledge availability](references/README.md).

For live operations, configure only the required connection in a private file, set the absolute `A11Y_ASSIST_CONFIG` path before starting Copilot, then restart. See [connection setup](docs/PROVIDERS.md) and [configuration examples](config/README.md). No connection is enabled by default.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-publish@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-publish Attach the approved hash-bound evidence files to <existing Draft PR> at <exact HEAD>, updating its description only.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

Built-in attach-evidence does not create a PR, approve review or verify media behavior. Broader publish needs a qualified connection. No PR comments, merge or replay of an ambiguous upload.

## Reference

- [Native ADO operations and setup](docs/NATIVE-CAPABILITIES.md)
- [Capability interfaces and boundaries](docs/CAPABILITIES.md)
- [Shared KB pins and automatic knowledge MCP](references/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
