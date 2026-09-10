# Knowledge ownership and consumption

`knowledge/` contains generic rules for code generation and read-only static
review. It must not require a particular framework, repository, operating system,
orchestration tool or runtime evidence workflow.

`integrations/agentow/knowledge/` preserves the six original v0.2 reference bodies,
including operational contracts and project-specific rules. Source provenance
and original snapshot hashes live in that profile's index, not in generic
user-facing knowledge. Domain knowledge is distinct from workflow authorization.

The current stage is **copy first, retain compatibility**. AgentOW's original
documents, references, skills and runtime are unchanged. Do not remove redundant
files or switch AgentOW's dependency as part of this stage.

## Distribution

- `a11y-knowledge` is an independently installable read-only skill, without MCP,
  providers or automatic commands.
- The knowledge-only package bundles only generic topics. It contains no
  integration directory, operational contract, provider configuration, MCP
  server or executable tool.
- The seven execution plugins bundle generic knowledge and the retained
  integration profile separately. Their skill preambles explicitly route to
  both sets; static guidance does not replace authorized runtime evidence.
- `knowledge/manifest.json` records LF-normalized SHA-256 hashes and the release
  version. A separate integration manifest hashes the retained profile.
  `release.json` binds both manifests and names the execution consumers.
- Build prunes retired files only from the generated `plugins/` tree; check mode
  rejects unexpected files. Package isolation tests scan the entire knowledge
  package, not only its index, to prevent stale instructions leaking back in.
- AgentOW retains its existing documentation, skill, evaluator, validator and host
  scripts. It continues reading its original files. This release does not introduce
  a knowledge-package dependency or require existing AgentOW installations to change.

## Later coordinated cutover (not implemented)

After the complete plugin integration is ready:

1. Compare the current AgentOW documents and plugin topics against the exact
   source commit in `integrations/agentow/knowledge/index.json`. Reconcile changes on both sides;
   neither an old copied snapshot nor a newer timestamp is sufficient authority.
2. Implement and qualify pinned, hash-checked AgentOW consumption that preserves
   offline installation and all existing knowledge entrypoints.
3. Add cross-repository provenance and generated-mirror drift checks.
4. Publish compatible versions and verify the current AgentOW flow still reads
   every required topic with no weakened gates.
5. Only then remove redundant authoring copies together. Generated distribution
   copies may remain to keep independently installed packages self-contained.

There is no cross-repository synchronization or hot reload today. Do not claim that
a change here has updated AgentOW. Active runs keep their existing installed
versions; a later cutover must not silently change their knowledge or evidence.

## Boundaries retained

The original documents now live only in the separate odsp-web, ADO and AgentOW
integration profile and its generated execution-package copies. They do not
make those services generally accessible.
AgentOW's existing unverified delivery policy remains AgentOW-specific; A11y
Assist still rejects unverified BEFORE/AFTER or publication. This extraction does
not migrate live providers or grant browser/AT/resource control.

Generic topics distill transferable principles and cite primary standards.
No private operational notes were imported. Licensing is unchanged.
