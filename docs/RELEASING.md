# Releases and freshness

Use a single repository and compatible release set first; do not split into
separate repositories before independent release requirements exist.

1. Change shared source and skills; do not hand-edit generated packages.
2. Bump package.json and contracts/workflow.json together.
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

The installer adds AgentOW only with explicit `-WithAgentOW`; the default full
workflow does not require it. No unsupported dependency fields are
invented in plugin manifests. The current AgentOW freshness rule is still
applied on its actual leased execution host before invocation.

Keep generic knowledge and execution integration profiles in separate packages:
`a11y-knowledge` must not include the `integrations/` tree or stale operational
files. Build prunes retired generated files; check mode rejects unexpected files.

Integration migration is currently copy-first. Publish the indexed snapshots and
their hashes, but leave AgentOW's original files and references intact. Do not remove
redundancy until the later coordinated integration and compatibility gates in
`KNOWLEDGE.md` pass. Updating this repository does not update AgentOW.

The evidence-v1 runtime export has its own pinned consumer path. Release the
canonical source first, then update AgentOW's generated validator copies and
source lock through its reviewed updater. Never maintain separate validator
implementations or silently refresh an active run.

Rollback selects a previously qualified plugin/provider release for a compatible
run. It must not reset session bindings, remove claims, discard new evidence,
undo remote effects or bypass a service refusal.
