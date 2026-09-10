# Releases and freshness

Use a single repository and compatible release set first; do not split into
seven repositories before independent release requirements exist.

1. Change shared source and skills; do not hand-edit generated packages.
2. Bump package.json and contracts/workflow.json together.
3. Run build, tests and generated-package check.
4. Review for embedded credentials, personal identifiers, machine roster,
   evidence and absolute private paths. Test fixtures must be synthetic.
5. Commit generated packages, marketplace and release.json. Create a reviewed
   version tag. Copilot marketplace consumers need access to this private repo.
6. Update through the host's supported plugin manager and restart when required.
   A git push alone does not hot-update installed/running plugins.
7. Record package version and provider implementation hashes with each run.
   Retain active run versions; incompatible upgrades fail closed rather than
   rewriting evidence or migrating ownership.

The installer explicitly adds AgentOW; no unsupported dependency fields are
invented in plugin manifests. The current AgentOW freshness rule is still
applied on its actual leased execution host before invocation.

Rollback selects a previously qualified plugin/provider release for a compatible
run. It must not reset session bindings, remove claims, discard new evidence,
undo remote effects or bypass a service refusal.
