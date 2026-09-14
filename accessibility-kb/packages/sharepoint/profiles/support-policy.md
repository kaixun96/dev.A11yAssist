# Product support and applicability policy draft

Status: draft. Owner: unassigned.
Source ID: `sharepoint-support`.

The official per-product support-list connection and MAS connection are pending.
The [support matrix](support-matrix.json) is an empty placeholder, not a list of
unsupported products, an approved policy, or evidence of compliance. Do not add
actual products or rules until their authoritative sources are obtained and
reviewed. Do not invent a MAS identifier, connector endpoint or support query.

## Keep independent dimensions

- **Applicability:** applicable / not-applicable / undetermined, with the exact
  requirement and a cited scope basis.
- **Support:** supported / partial / unsupported / unknown, with the official
  declaration, product/version scope and limitations.
- **Verification:** verified / unverified / stale, with evidence scope and date.
- **Exception:** only an authority-approved reference with scope and expiry;
  missing approval must not be represented as an exception.

Unsupported does not mean not-applicable. A support declaration does not waive
an applicable MAS requirement, prove a legal conclusion or establish a test pass.
An absent product entry means no declaration is recorded, not that the product
is excluded. Missing, stale or conflicting sources produce a gap or blocked
decision rather than a guessed classification.

## Admission and conflict handling

Before publishing a profile, obtain source identity, original requirement or
declaration ID, revision or immutable retrieval reference, retrieval time,
access scope, authoritative text reference and applicable product/version scope.
Record source errors explicitly. Assign an owner and reviewer, preserve the
reviewed interpretation, and obtain permission before caching or redistribution.
Authentication and future connectors belong outside this knowledge package.

Use `common.requirements.authority-and-applicability` to retain every applicable
obligation and route conflicts to the relevant authority; MAS, WCAG and product
rules are not a last-writer-wins hierarchy. Component documentation and local
guidance cannot replace MAS or the official support list.

Output separate applicability, support and verification decisions with their
bases and unknowns. Support does not transfer **native** browser responsibilities,
**framework** component obligations or **host/caller** integration duties; map
those using `common.implementation.component-contract` before assessing a fix.