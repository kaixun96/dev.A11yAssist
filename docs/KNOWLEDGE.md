# Knowledge ownership and consumption

Shared accessibility knowledge is moving into `knowledge/`. Keep every topic
indexed with a trigger, scope and source provenance. Domain knowledge is distinct
from workflow authorization.

The current stage is **copy first, retain compatibility**. AgentOW's original
documents, references, skills and runtime are unchanged. Do not remove redundant
files or switch AgentOW's dependency as part of this stage.

## Distribution

- `a11y-knowledge` is an independently installable read-only skill, without MCP,
  providers or automatic commands.
- The seven execution plugins bundle the same complete indexed snapshot. Their
  generated skill preambles route to the topics needed by each capability.
- `knowledge/manifest.json` records LF-normalized SHA-256 hashes and the release
  version. `release.json` binds that manifest.
- AgentOW retains its existing documentation, skill, evaluator, validator and host
  scripts. It continues reading its original files. This release does not introduce
  a knowledge-package dependency or require existing AgentOW installations to change.

## Later coordinated cutover (not implemented)

After the complete plugin integration is ready:

1. Compare the current AgentOW documents and plugin topics against the exact
   source commit in `knowledge/index.json`. Reconcile changes on both sides;
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

The original documents include labeled odsp-web, ADO and AgentOW bridge-v1
integration profiles. They do not make those services generally accessible.
AgentOW's existing unverified delivery policy remains AgentOW-specific; A11y
Assist still rejects unverified BEFORE/AFTER or publication. This extraction does
not migrate live providers or grant browser/AT/resource control.

Only reusable content already published in the source repository was extracted.
Owner-private operational notes remain private. Licensing is unchanged.
