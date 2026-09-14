# Repository contract

This repository is a plugin marketplace. Users select independently installable
plugins from the homepages and each plugin's README; implementation
details belong in maintainer documentation. Read `src/README.md` and
`docs/DEVELOPMENT.md` before changing packaging or source layout.

Support only Twinbot + multiple Windows DevBoxes, or Copilot CLI + one/multiple
Windows DevBoxes. A single DevBox is a pool of size one, not a weaker workflow.

- `src/contracts/workflow.json` and `docs/WORKFLOW.md` own the phase/gate contract.
- Shared runtime source lives in `src/runtime/`; `plugins/*/runtime/` is generated
  by `npm run build`. Never edit generated copies. Each installed plugin must
  work without sibling directories or this repository's root.
- Canonical execution source lives in `src/runtime/`, `src/native/`,
  `src/contracts/` and `src/adapters/`. No root runtime/native exports, historical
  integration archives, workflow profile selectors or compatibility plugins.
  Configure source and review providers directly. Preserve factual source
  attribution and license notices; provenance grants no execution authority.
- Ship ten plugins: seven execution plugins, unified read-only `a11y-knowledge`,
  `a11y-bug-bash` and `a11y-setup`. Homepages and per-plugin READMEs are generated
  from `src/catalog.json`; edit that source, not the output.
- Portable topic authoring remains in `src/knowledge/`, bundled offline in the
  execution and knowledge plugins and Bug Bash's internal knowledge module.
  Knowledge review is read-only and needs no runtime, provider or host setup.
  Do not invent project-specific rules absent from current supplied sources.
- Retain the scoped native setup source and dependency templates in `src/setup/`.
  Bug Bash reuses setup and knowledge under `modules/` without extra manifests
  or public commands. Setup defaults to check-only; preparation needs explicit
  host-change authorization and original ownership. Source-only work runs no setup.
- Keep private configuration and all run/lease/evidence data outside this repo.
  Never hardcode a person's tenant, UPN, machine/Codespace roster or credentials.
- No accepted reproduced BEFORE means no source branch, fix or PR. No unverified
  PR fallback is permitted.
- Providers are administrator/user-configured trusted executables, not arbitrary
  model-supplied shell commands. No live provider is shipped enabled by default.
- A provider error or absent capability must be an explicit failure, never a
  success-shaped mock, simulated AT result or guessed readiness.
- Preserve original owner/run/affinity across retries. Never force-release a
  foreign lease, delete environments, reset another agent or bypass service safety.
- Update source, generated plugin packages, docs and targeted tests together.
- Validate with `npm test` and `npm run check`. Never test on a live Bug or another
  worker's desktop without explicit scope and canonical ownership gates.
