# Knowledge ownership and consumption

`src/knowledge/` remains the single authored source for six portable accessibility
topics. These support code-generation guidance and read-only static review without
requiring a framework, orchestration tool or runtime evidence workflow. Topic
bodies cite primary standards and remain unchanged by compatibility cleanup.

## Distribution

- `a11y-knowledge` provides one unified skill for generic and ODSP source review.
  Read `knowledge/README.md`, foundations and the applicable complete topics.
  Use supplied current component documentation for SPDS, Fluent V8/V9 and
  SharePoint-specific contracts. Keep versions separate; missing project rules
  are context gaps, not invented requirements or defects.
- The seven execution plugins bundle the same portable topics and route to their
  applicable files. Static guidance grants no authority to operate providers.
- Bug Bash reuses the exact knowledge skill and offline topic bundle under
  `modules/a11y-knowledge/`, with no nested manifest or extra public command.
  The source-only track inherits the knowledge boundary; separately authorized
  page checks belong to discovery. See [Bug Bash](BUG-BASH.md).
- Knowledge has no MCP server, executable runtime, providers or configuration
  prerequisite. No host setup, shells, tests, scanners, browsers or AT are used
  for knowledge review. Static review is not runtime verification or conformance.
- `src/knowledge/manifest.json` records LF-normalized SHA-256 hashes and the
  release version. `release.json` binds that manifest. Independently copied
  packages work offline without repository siblings or another plugin.
- Build prunes retired files from generated packages; check mode rejects
  unexpected files. Tests verify exact knowledge-only file sets, topic hashes,
  local navigation and isolation from operational/project-specific rules.

Historical integration archives, runtime profiles and the standalone ODSP alias
are not distributed. There is no new compatibility or cross-repository updater.
The shared evidence-v1 validator and native ADO code remain execution source,
not knowledge rules. Preserve their factual attribution and license notices.

## Release boundaries

Refresh installed plugins only at a safe point using the host's supported plugin
manager. Repository changes do not update running workers or confer service
access. Retain active run ownership, evidence and installed version bindings.
Licensing is unchanged; public visibility is not an open-source license grant.
