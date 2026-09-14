# AgentOW integration profile

This directory preserves the existing AgentOW-specific documentation separately
from the generic static-accessibility knowledge.

- [SPDS, Fluent V8/V9, SharePoint and complete original references](knowledge/README.md)
- [Whole-tree migration inventory and exclusions](knowledge/source-inventory.json)
- [Import provenance and execution-topic routing](knowledge/index.json)

This directory is not an automatic execution integration. Execution packages and
the read-only `a11y-knowledge` package (and its legacy `a11y-knowledge-odsp`
compatibility package) bundle the same references. Static
project knowledge requires no AgentOW workflow. The independently installable
`a11y-knowledge` package includes the ODSP subskill and reads project guidance
only when relevant; no second installation is needed.

AgentOW's orchestration and original document bodies are retained. The shared
validator has the explicit runtime-consumer path below; remaining dependency
switching and redundant-authoring cleanup wait for their compatibility gates.

## Shared runtime consumer

`src/runtime/evidence-v1.mjs` is the single authoring source for the existing
version-1 deterministic evidence validator. Build retains the public
`runtime/evidence-v1.mjs` path as a byte-equivalent generated export and publishes
that path/hash in `exports.json`. Native exports follow the same rule. Installed
plugins use their bundled `runtime/` and do not depend on repository source paths.
This is distinct from the retained document snapshot.

AgentOW's consumer update command is:

```powershell
node ts/scripts/sync-a11y-capabilities.mjs --update <reviewed-dev.A11yAssist-commit>
```

It verifies the export manifest and source hash before generating the root and
installed-plugin tool copies. Its lock pins the exact source commit; validation
rejects mirror edits. AgentOW keeps its workflow, old tool path, CLI and module
exports. No runtime network fetch or second manual implementation is needed.

## Calling plugins in AgentOW's own workflow

Install only the desired capability into the executing Copilot session and
restart at an authorized safe point. AgentOW may then call its advertised MCP
tools, for example `a11y_validate_evidence` for provided evidence files, or
`a11y_capture_invoke` through the caller's authorized capture connection.
Do not invent a peer-plugin path or assume a Codespace can control a DevBox
merely because a tool was installed.

The full `a11y-workflow` is optional. AgentOW does not have to delegate its
orchestration to it; both callers can reuse the same capability implementation.
