---
name: a11y-resources
description: Inspect authorized shared resource health and ownership for any caller workflow, without acquiring or releasing resources.
---

Read `${CLAUDE_PLUGIN_ROOT}/docs/CAPABILITIES.md`. The caller owns composition; a small capability does not require the full workflow.
For static guidance use `knowledge/README.md` and applicable topics: `knowledge/foundations.md`.
Only when the caller selects the applicable execution integration, consult `integrations/agentow/knowledge/README.md` and its topic routing. Do not load that profile as a generic prerequisite.

Read `docs/CAPABILITIES.md`. Call `a11y_resources_resources` for the configured
resource connection's public status. No full workflow run or prior stage is
required. `a11y_resources_doctor` inspects configuration, not live AT readiness.

Distinguish available, occupied and unhealthy resources. A running process,
powered-on machine or configured executable is not evidence of authenticated
interactive readiness. Use the existing authoritative registry; never create
another registry or infer ownership from process presence.

Return public resource IDs, health, ownership and limitations. The caller decides
what follows. This capability does not acquire, force-release, auto-expire,
change affinity, recover a machine or start another workflow. Keep lease tokens
and credentials private to the authorized connection.
