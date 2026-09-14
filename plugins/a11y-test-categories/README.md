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

Independently installable and bundled in Bug Bash from the same source. Declares Liquid HTTP MCP for read-only standards lookup; user authentication required. No browser/AT backend. Local matrix checks detect missing rows, not authentic evidence or WCAG conformance. Not-applicable needs a reason; missing tools/time/evidence remain partial.

## Reference

- [All-target test procedures and accounting](docs/TEST-CATEGORIES.md)
- [Test categories (Chinese)](docs/TEST-CATEGORIES.zh-CN.md)
- [Liquid MCP connection and MAS/WCAG retrieval](docs/LIQUID-STANDARDS.md)
- [Nine-category procedure index](procedures/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
