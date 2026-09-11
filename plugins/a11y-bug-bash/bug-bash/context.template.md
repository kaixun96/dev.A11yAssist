# Feature context

Fill from the user's context first; do not force them to complete a questionnaire.
Use `unknown` or `not supplied` rather than inventing values. This file is an
input aid, not an execution receipt. Store completed copies privately.

- Feature name, purpose and intended users:
- In-scope journeys/components and explicit exclusions:
- Expected behavior and supplied verification steps:
- Authorized URL/environment, route, flags and permissions:
- Safe fixture/test accounts (references only; no credentials):
- Actions allowed and actions requiring separate authorization:
- Browser/OS, viewport, zoom, language/theme and required real AT:
- Deployed build/version and how it is known (or unknown):
- Read-only source root/files/snippets and revision (or unknown):
- Relationship between source and deployed build (proven/unknown/different):
- Existing authorized browser/scanner/AT tools and ownership mechanism:
- Requested mode: both (default), plan-only, page-only or source-only:
- Time budget, priorities and privately accessible output location:
- Missing facts that block a specific check:

## User verification journey

| Step ID | Preconditions | Action | Expected behavior | Safe reset |
|---|---|---|---|---|
| S01 | <known starting state> | <user action> | <expected state> | <reset> |

## Capability preflight

| Capability | Available tool/version | Authorization/ownership evidence | Affected rows if missing |
|---|---|---|---|
| Read-only source | <tool or unavailable> | <scope> | <IDs> |
| Interactive browser | <tool or unavailable> | <owned session> | <IDs> |
| Real screen reader | <tool and AT/version or unavailable> | <owned desktop> | <IDs> |
| Visual measurement / scanner | <approved tool or unavailable> | <scope> | <IDs> |

Do not require AT for a source-only review or call browser-only results AT-tested.
Do not put passwords, tokens, cookies or lease secrets in this document.
