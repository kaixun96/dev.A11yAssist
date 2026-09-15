# Shared accessibility knowledge base

This directory is a portable, versioned **content source**, not an execution
engine. Start with [the catalog](catalog.json), select packages matching the actual product,
framework version and task, then read their declared entries. Dependencies and
cross-package relationships use stable IDs, not repository or plugin locations.

All task procedures are read-only reasoning and planning guidance. Code changes,
tests, tools, real-page access and AT use require the caller's separately
authorized workflow. Knowledge never grants that authority or bypasses its gates.

## Reading and contributing

- A package descriptor declares every distributed file, source and entry ID.
  Resolve an ID through the selected catalog and its package descriptor.
- Read the full applicable entry, its source status and declared relationships.
  Do not treat a title, search snippet or illustrative example as a component contract.
- Discovery has two axes: `kind` describes the entry's primary role; optional
  curated `discoveryTags` identify reusable interaction/implementation patterns
  (`pattern`), corrective wrong-versus-corrected guidance (`fix`), and concrete
  positive/negative examples (`example`). Cases derive from `kind: case`, not a
  tag. Tags describe body content, not normative authority, approval or verified
  historical fixes; consult the applicable source records and provisions.
- Draft content is not approved; unassigned ownership and
  pending sources are deliberate gaps. No official company rule text is supplied
  by a pending source record. Unsourced methods remain current draft guidance
  until their claims are connected to and reviewed against applicable official
  documentation; a source locator alone does not substantiate them.
- See [contribution policy](governance/contribution.md) and the
  [qualification rubric](evaluations/README.md).

## Standalone KB serving and source review

This independent content source supports standalone KB
serving and read-only source review. Existing plugins retain their own knowledge;
they do not currently consume this root.
A consumer reference selects exact package versions and pins the selected dependency-closed
manifest hash. A root with additional packages can serve a smaller selection;
those extra packages are not implicitly part of the requested knowledge.

Location resolution belongs to a read-only knowledge service, outside this content
package. That service may automatically obtain a published, hash-pinned snapshot
and reuse a local cache. It must verify selected versions and content before
returning entry text and source metadata. Missing content, access or integrity is
an explicit failure. Read-only procedures may call registered knowledge-reading
tools, but must not run shell commands, tests or browsers to repair setup.
No particular plugin manager or repository layout is required by the content.

The standalone KB build will generate the manifest from this authored source;
the manifest is not copied from another build. No plugin references or plugin KB
bodies are changed by this content addition. Consumers must refresh compatible
references and host KB context at a safe point; hash pins prevent treating source
changes as live auto-reload. The catalog selects content and the generated manifest
binds its snapshot. Neither establishes conformance, content approval or runtime behavior.

Discovery-tag changes are versioned content changes: bump the affected package
version and update exact dependent versions before publishing a new snapshot.
Retain older snapshots unchanged. Historical entries without `discoveryTags`
remain valid but have no curated-tag matches; do not infer tags from their kind,
title or citations. Case discovery still derives from `kind: case`.