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

The installer requires an explicit `-Plugin` selection and adds AgentOW only
with explicit `-WithAgentOW`; the optional full workflow does not require it.
No unsupported dependency fields are
invented in plugin manifests. The current AgentOW freshness rule is still
applied on its actual leased execution host before invocation.

Keep generic topic bodies and scoped project references separately indexed.
`a11y-knowledge` includes the ODSP subskill and complete inert reference profile
by default; this does not add executable tools, MCP, configuration or workflow
authority. The old ODSP package is compatibility-only and must not be installed
alongside it by the `all` helper. Build prunes retired generated files; check mode
rejects unexpected files. Preserve full snapshot hashes and inert source suffixes.

Integration migration is currently copy-first. Publish the indexed snapshots and
their hashes, but leave AgentOW's original files and references intact. Do not remove
redundancy until the later coordinated integration and compatibility gates in
`KNOWLEDGE.md` pass. Updating this repository does not update AgentOW.

The evidence-v1 runtime export has its own pinned consumer path. Release the
canonical source first, then update AgentOW's generated validator copies and
source lock through its reviewed updater. Never maintain separate validator
implementations or silently refresh an active run.

The additional execution export is `integrations/agentow/execution-manifest.json`,
generated from the explicit allowlist in `execution-exports.json`. Its consumers
use AgentOW's `--update-execution <exact-commit>` updater and independent
`a11y-execution.lock.json`. Publish and qualify the source before advancing that
pin. Retain the original command/API paths through generated copies or thin
wrappers; never hand-maintain the copied execution bodies.

Rollback selects a previously qualified plugin/provider release for a compatible
run. It must not reset session bindings, remove claims, discard new evidence,
undo remote effects or bypass a service refusal.
