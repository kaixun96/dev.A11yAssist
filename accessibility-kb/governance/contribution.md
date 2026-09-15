# Contribution and review

Status: initial maintenance policy; content ownership assignments pending.

1. Choose the narrowest valid package. Shared concepts must not depend on a
   particular product; framework behavior must name the actual supported version.
2. Give the entry a stable ID and declare its file in the package descriptor.
   Add source IDs, applicability, relationships, draft status and owner. Keep
   repository, account, machine and evidence details out of content.
3. Cite original source provisions and their reviewed revision. Distinguish
   normative text, informative examples and local draft guidance. If a method
   has no current source, label it unsourced draft guidance and record the
   pending official-documentation connection. Do not attach unrelated official
   source IDs as evidence; connection targets are not reviewed claim support.
   Never manufacture a company requirement or approved exception.
4. Review root-cause placement, caller responsibilities, error/async branches,
   expected validation and risks of a superficially plausible fix.
5. Test links, dependency closure, isolated packaging and representative positive
   and negative scenarios. Unit tests of descriptors do not qualify agent behavior.
6. Before promotion from draft to approved, assign an actual owner and
   reviewer, record the review date, and resolve pending source revisions. Record
   the qualification evidence reference outside the repository when private.

Local Markdown links target complete files; local heading fragments are rejected
until anchor validation is supported. Cross-package references use stable IDs.
Structured support profiles use the support-matrix schema; a sourced row must
bind a reviewed official support source, its locator/revision and the exact rule
ID. Verification claims require an evidence reference; schema validity itself
does not prove the observation or confer an exception.

## Discovery metadata and versions

Keep two axes separate: `kind` is the entry's primary role; optional
`discoveryTags` are curated body-content facets. Read the full body before adding
one to three unique tags from this closed set:

- `pattern`: a concrete reusable interaction or implementation pattern, not
   merely an APG citation or the presence of an implementation contract.
- `fix`: corrective guidance contrasting wrong and corrected behavior, including
   conditional recommendations; not proof of a verified historical fix.
- `example`: an actual concrete positive or negative example, not a promise to
   add examples or a generic checklist.

Case discovery derives from `kind: case`; never add a `case` tag. Curate only
supported facets, not every entry indiscriminately. Omit the property when no
tags are curated; an empty array is invalid. Normative authority comes from
applicable source provisions and their authority/review metadata, not either
discovery axis. Tags do not promote draft status or turn hypothetical examples
into official rules, real bugs, observed results or approved corrections.

Tag additions, removals and corrections are content changes requiring a package
version bump (a patch bump for metadata-only curation) and exact dependency
updates in affected dependent packages, with their own version bumps. Publish a
new snapshot; never rewrite retained manifests or distribution artifacts.
Historical snapshots may omit `discoveryTags` and remain valid, but such entries
have no curated-tag matches. Do not backfill by guessing from kind, title or
source citations. Their `kind: case` discovery remains available.

Entries with `owner: unassigned` cannot be approved. Approved entries require
`review` metadata (`reviewer`, `date`, `evidence`) and all cited sources must be
reviewed with an explicit revision, with at least one source. Review is per scoped claim, not a global
accessibility certificate. A material source/framework change returns affected
entries to draft until requalified. Deprecation retains the old ID with an
explicit replacement; never silently reuse an ID for a different meaning.

Output vocabulary: source-supported finding; observed finding with actual
evidence; potential risk; context-needed; not-applicable with basis; checked-pass
for the named scope; not-run or blocked. A source-only reviewer cannot produce
an observed finding or infer an overall conformance PASS.