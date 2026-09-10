# AgentOW execution integration references

These are preserved operational and project-specific references, not the generic
`a11y-knowledge` plugin. Only execution packages bundle this directory.
The knowledge-only package neither includes nor loads it.

## Read by execution need

| When | Retained reference |
|---|---|
| Classifying evidence in the original integration | [Original foundations](foundations.md) |
| Working in the odsp-web / SPDS / Fluent component stack | [Component profile](component-accessibility.md) |
| Producing or validating AgentOW bridge-v1 JSON | [Evidence contract](evidence-contract.md) |
| Authorized Windows AT preflight and recording | [Windows host testing](windows-host-testing.md) |
| Capturing, reviewing or publishing ADO PR media | [PR evidence capture](pr-evidence-capture-guide.md) |
| Using the approved persistent browser integration | [Personal evaluator browser](personal-evaluator-browser.md) |

The six reference bodies are retained unchanged from the v0.2 snapshot.
`index.json` records their original AgentOW paths and commit. Their presence is
not evidence that tools mentioned in them are shipped here or currently usable.

## Authority and compatibility

The active execution workflow still controls permissions, ownership, phase
ordering, evidence, cleanup and delivery. Source-reading restrictions in the
generic knowledge topics describe static review, not a replacement for the
separately authorized execution workflow.

- The bridge-v1 artifact contract is not the A11y Assist provider RPC. Its
  AgentOW-specific unverified Draft fallback cannot override A11y Assist's
  stricter BEFORE/AFTER and publication gates.
- Host setup commands and browser scripts belong to the approved external
  integration. This directory does not install them or grant direct AT control.
- Twin-managed DevBoxes remain under the original resource owner. ADO and
  odsp-web-specific guidance is applicable only to those environments.

This is still a copy-first migration. AgentOW's original repository files,
references and runtime remain unchanged. Before a later coordinated cutover,
compare both current repositories with the recorded origin and reconcile
intervening changes. Do not remove AgentOW originals or assume automatic sync.
