# a11y-test-categories

[简体中文](README.zh-CN.md)

## Use this for

Apply all ten accessibility test categories, step by step, to every in-scope target and reachable state

## Prerequisites

Feature scope and target/state inventory; Node.js 22+ for local accounting; authorized browser/AT tools and ownership for live checks.

## Install your selection

```powershell
copilot plugin marketplace add kaixun96/dev.A11yAssist
copilot plugin install a11y-test-categories@a11y-assist
```

Restart Copilot after installation to load the plugin, then follow its usage example. Installation does not update or restart an existing worker.

## Example

```text
/a11y-test-categories Check every element/state of <feature> using all ten categories; save the full step matrix, evidence and gaps to <private directory>. Do not sample, fix or file.
```

Replace placeholders with your actual authorized inputs. Examples are prompts, not execution receipts or proof of readiness.

## Limitations

The sole plugin owner of test procedures and matrix tools. Bug Bash calls its versioned API through an explicitly configured installed root; no embedded copies. No browser/AT backend or MCP server. Matrix accounting is not evidence authenticity or WCAG conformance; unavailable checks remain gaps.

## Reference

- [All-target test procedures and accounting](docs/TEST-CATEGORIES.md)
- [Test categories (Chinese)](docs/TEST-CATEGORIES.zh-CN.md)
- [Ten-category procedure index](procedures/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
