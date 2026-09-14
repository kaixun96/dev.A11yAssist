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
- Draft content is not approved; unassigned ownership and
  pending sources are deliberate gaps. No official company rule text is supplied
  by a pending source record. Unsourced methods remain current draft guidance
  until their claims are connected to and reviewed against applicable official
  documentation; a source locator alone does not substantiate them.
- See [contribution policy](governance/contribution.md) and the
  [qualification rubric](evaluations/README.md).

## Shared consumption, not plugin content copies

Consumers reference this shared root rather than maintaining content copies.
A reference selects exact package versions and pins the selected dependency-closed
manifest hash. A root with additional packages can serve a smaller selection;
those extra packages are not implicitly part of the requested knowledge.

Location resolution belongs to a read-only knowledge service, outside this content
package. That service may automatically obtain a published, hash-pinned snapshot
and reuse a local cache. It must verify selected versions and content before
returning entry text and source metadata. Missing content, access or integrity is
an explicit failure. Read-only procedures may call registered knowledge-reading
tools, but must not run shell commands, tests or browsers to repair setup.
No particular plugin manager or repository layout is required by the content.

Build regenerates the shared source manifest and lightweight plugin references,
not plugin KB bodies. After edits, build first and refresh compatible references
and host KB context at a safe point; hash pins prevent treating source changes
as live auto-reload. The catalog selects content and the manifest binds its
snapshot. Neither establishes conformance, content approval or runtime behavior.