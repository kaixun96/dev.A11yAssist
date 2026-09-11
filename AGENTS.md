# Repository contract

This repository is a plugin marketplace. Users select independently installable
plugins from the homepages and each plugin's README; implementation and migration
details belong in maintainer documentation. Read `src/README.md` and
`docs/DEVELOPMENT.md` before changing packaging or source layout.

Support only Twinbot + multiple Windows DevBoxes, or Copilot CLI + one/multiple
Windows DevBoxes. A single DevBox is a pool of size one, not a weaker workflow.

- `src/contracts/workflow.json` and `docs/WORKFLOW.md` own the phase/gate contract.
- Shared runtime source lives in `src/runtime/`; `plugins/*/runtime/` is generated
  by `npm run build`. Never edit generated copies. Each installed plugin must
  work without sibling directories or this repository's root.
- Root `runtime/`, `native/` and the integration browser are generated compatibility
  exports. Keep their published consumer paths and hashes. Homepages and per-plugin
  READMEs are generated from `src/catalog.json`; edit that source, not the output.
- Keep private configuration and all run/lease/evidence data outside this repo.
  Never hardcode a person's tenant, UPN, machine/Codespace roster or credentials.
- No accepted reproduced BEFORE means no source branch, fix or PR. No unverified
  PR fallback even when a downstream AgentOW edition offers one.
- Providers are administrator/user-configured trusted executables, not arbitrary
  model-supplied shell commands. No live provider is shipped enabled by default.
- A provider error or absent capability must be an explicit failure, never a
  success-shaped mock, simulated AT result or guessed readiness.
- Preserve original owner/run/affinity across retries. Never force-release a
  foreign lease, delete environments, reset another agent or bypass service safety.
- Update source, generated plugin packages, docs and targeted tests together.
- Validate with `npm test` and `npm run check`. Never test on a live Bug or another
  worker's desktop without explicit scope and canonical ownership gates.
