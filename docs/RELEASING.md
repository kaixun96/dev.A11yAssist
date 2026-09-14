# Releases and freshness

Use a single repository and compatible release set first; do not split into
separate repositories before independent release requirements exist.

1. Change shared source and skills under `src/`, and catalog text in
   `src/catalog.json`; do not hand-edit generated homepages or packages.
2. Bump package.json for a release. Change `src/contracts/workflow.json`'s
   protocol version only for a workflow protocol change; a catalog/layout release
   must not unnecessarily invalidate existing run/provider contracts.
3. Run build, tests and generated-package check.
4. Review for embedded credentials, personal identifiers, machine roster,
   evidence and absolute private paths. Test fixtures must be synthetic.
5. Commit generated packages, marketplace and release.json. Create a reviewed
   version tag. The marketplace repository is public; operational platform
   access and the repository's license terms remain separate requirements.
6. Update through the host's supported plugin manager and restart when required.
   A git push alone does not hot-update installed/running plugins.
7. Record package version and provider implementation hashes with each run.
   Retain active run versions; incompatible upgrades fail closed rather than
   rewriting evidence or migrating ownership.

The installer requires an explicit `-Plugin` selection; `all` selects the ten
current plugins. Use only fields supported by the current plugin manifest contract.
Configure source and review providers directly through trusted connections.

Keep the six portable topic bodies indexed and hash-bound to the release.
The Bug Bash framework bundles the unified knowledge skill in an internal
module, not new top-level knowledge commands. Validate isolated module contents,
relative routing, coverage/template references and explicit missing-capability
boundaries. Framework/package validation is not a live feature or AT qualification.

Setup similarly has one authored skill/profile/installer and exact standalone
and internal Bug Bash copies. Validate selective dependency closure, skipping
installed dependencies, error propagation, host rejection and the default
dependency selection without actually installing packages or changing the CI
desktop. Omitting `-Dependency` selects NVDA, FFmpeg, AudioDeviceCmdlets, Python,
Playwright, Chromium, MSS and PyAudioWPatch; the skill supplies an explicit subset.
This is not live Windows driver, authentication, audio or AT qualification.
No product browser helper is shipped; use an existing authorized connection.

`a11y-knowledge` includes offline portable topics for generic and ODSP source
review, with project-specific contracts taken from supplied current documentation.
Knowledge review requires no executable tools, MCP or configuration and grants no
workflow authority. Build produces the exact declared package file sets; check
mode rejects missing, changed or unexpected files. Verify independent offline
packages, topic hashes and package-local references.

The shared evidence-v1 validator and native ADO implementations are canonical
source bundled in execution plugins. Never maintain separate implementations or
silently refresh an active run. Source attribution and license notices remain;
provenance does not grant execution or publication authority.

Rollback selects a previously qualified plugin/provider release for a compatible
run. It must not reset session bindings, remove claims, discard new evidence,
undo remote effects or bypass a service refusal.
