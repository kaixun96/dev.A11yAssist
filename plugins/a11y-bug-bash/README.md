# a11y-bug-bash

[简体中文](README.zh-CN.md)

## Use this for

Feature accessibility bug bash: plan from context and verification steps, inspect the page, review source and separate reproduced bugs from code risks

## Prerequisites

Feature context and verification steps; read-only source for code review; existing authorized Windows browser/AT tools and ownership for live checks.

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

Bundles a11y-knowledge, a11y-setup and a11y-test-categories; no extra install. Every target/state requires all ten categories and every applicable step, not representative sampling. Missing tools, time or evidence remain explicit gaps. Setup preparation needs separate authorization. No browser/AT binaries or live connection supplied; no automatic fixes, builds, filing or PRs.

## Reference

- [Bug Bash workflow and boundaries](docs/BUG-BASH.md)
- [Feature context template](bug-bash/context.template.md)
- [Findings and coverage report template](bug-bash/report.template.md)
- [Built-in all-target test categories](modules/a11y-test-categories/docs/TEST-CATEGORIES.md)
- [Built-in test categories (Chinese)](modules/a11y-test-categories/docs/TEST-CATEGORIES.zh-CN.md)
- [Built-in environment preparation](modules/a11y-setup/docs/SETUP.md)
- [Reused internal knowledge review](modules/a11y-knowledge/skills/a11y-knowledge/SKILL.md)
- [Included project knowledge](modules/a11y-knowledge/integrations/agentow/knowledge/README.md)

[Back to the plugin catalog](https://github.com/kaixun96/dev.A11yAssist)
