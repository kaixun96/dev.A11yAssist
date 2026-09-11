# Knowledge ownership and consumption

`knowledge/` contains generic rules for code generation and read-only static
review. It must not require a particular framework, repository, operating system,
orchestration tool or runtime evidence workflow.

`integrations/agentow/knowledge/` provides complete original source references
and explicit SPDS/Fluent V8/V9 and SharePoint topic maps. `source-inventory.json`
accounts for every tracked file in one pinned AgentOW tree: complete first-party
Markdown, accessibility-marked authored metadata/source/tests and local document dependencies
are preserved, while every exclusion has a reason and original source link.
Source bodies are LF-normalized only and stored with inert filename suffixes.
Third-party performance documents and generated runtime bundles/source maps are
linked rather than republished; authored source is inventoried separately.

The six original v0.2 bodies remain unchanged as a compatibility set. Their old
origin/hash metadata is separate from the complete snapshot's source commit/tree.
New questions follow `complete-source-guide.md`, not a stale compatibility body.
Neither snapshot claims to mirror external product APIs or private ODSP source.
Domain knowledge is distinct from workflow authorization.

The document migration remains **copy first, retain compatibility**. AgentOW's
original documents and orchestration are retained. The shared evidence validator
has a separate explicit, pinned runtime-consumer path; that does not authorize
deleting other original documents or switching installed workers.

## Distribution

- `a11y-knowledge` is an independently installable read-only skill, without MCP,
  providers or automatic commands.
- The knowledge-only package bundles only generic topics. It contains no
  integration directory, operational contract, provider configuration, MCP
  server or executable tool.
- `a11y-knowledge-odsp` is a second independently installable read-only skill,
  bundling generic topics plus the complete project/source profile. It has no
  MCP, providers or executable tools and does not require AgentOW or a workflow.
  Archived `SKILL.md`/`AGENTS.md`/code receive inert suffixes and are explicitly
  data, never instructions that authorize commands or change the active skill.
- The seven execution plugins bundle generic knowledge and the retained
  integration profile separately. Their skill preambles route project-specific
  static questions to the same complete source maps without requiring an execution
  integration. Static guidance does not replace authorized runtime evidence.
- `knowledge/manifest.json` records LF-normalized SHA-256 hashes and the release
  version. A separate integration manifest hashes the retained profile.
  `release.json` binds both manifests and names the execution consumers.
- Build prunes retired files only from the generated `plugins/` tree; check mode
  rejects unexpected files. Package isolation tests scan the entire knowledge
  package, not only its index, to prevent stale instructions leaking back in.
- `tools/agentow-knowledge-snapshot.mjs <repository> <commit> --check` compares
  the copied bodies and inventory against the complete pinned Git tree, not just
  the inventory's own declarations. Ordinary build also rejects snapshot drift
  and undeclared archived files. Offline package checks cover the independent
  project skill and all generated consumers.
- AgentOW retains its documentation, skill, evaluator and host procedures.
  The evidence-validator implementation is exported from this repository for a
  pinned generated copy at its original tool path. There is no runtime network
  fetch or knowledge-package dependency.

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

The original documents live in the separate odsp-web, ADO and AgentOW profile
and its generated execution/project-knowledge package copies. They do not
make those services generally accessible.
AgentOW's existing unverified delivery policy remains AgentOW-specific; A11y
Assist still rejects unverified BEFORE/AFTER or publication. This extraction does
not migrate live providers or grant browser/AT/resource control.

Generic topics distill transferable principles and cite primary standards.
No private operational notes were imported. Licensing is unchanged.
