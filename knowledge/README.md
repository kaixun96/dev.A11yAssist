# Shared accessibility knowledge

This directory in **kaixun96/dev.A11yAssist** is the destination for shared
accessibility knowledge. This is the **copy-first migration stage**: AgentOW's
original files, references and runtime are retained unchanged for compatibility.
AgentOW does not yet consume these packages or receive automatic knowledge updates.
Provenance and topic triggers are recorded in [index.json](index.json); build generates
`manifest.json` with hashes.

## Read by trigger

| When | Read |
|---|---|
| Classifying impact, selecting criteria or evidence | [Foundations](foundations.md) |
| Implementing/reviewing semantics, announcements, focus, keyboard or visual accessibility | [Component accessibility](component-accessibility.md) |
| Producing/validating AgentOW bridge-v1 request/result JSON | [Evidence contract](evidence-contract.md) |
| Authorized Windows AT preflight, audio and recording | [Windows host testing](windows-host-testing.md) |
| BEFORE/AFTER screenshots, recordings, annotations or PR publication | [PR evidence capture](pr-evidence-capture-guide.md) |
| Persistent authenticated Chromium screenshots | [Personal evaluator browser](personal-evaluator-browser.md) |

Read the matching complete topic before acting; do not load every topic by default.
All packages contain a self-contained snapshot so the index never points to a
missing sibling plugin. Their entry skills select the relevant starting topics.

## Knowledge is not execution authority

The knowledge-only plugin has no MCP server, provider, resource lease or automatic
side effect. Commands in reference documents describe prerequisites or integration
procedures; the knowledge package does not install those executables or authorize
running them.

The source extraction preserves AgentOW-specific integration profiles explicitly:

- `evidence-contract.md` describes AgentOW bridge-v1 JSON and its existing delivery
  policy. It is **not** the A11y Assist provider RPC. Its unverified Draft fallback
  never overrides A11y Assist's strict BEFORE/AFTER and publication gates.
- `windows-host-testing.md` references AgentOW's `/ow-a11y-host-setup`. Twin-managed
  machines remain under Twin control; reading the guide grants no direct AT access.
- `personal-evaluator-browser.md` references AgentOW's browser script and its
  standalone Codespace fallback. This does not add a new A11y Assist deployment
  mode: only Twin + multiple Windows DevBoxes or CLI + one/multiple Windows
  DevBoxes are supported.
- Component APIs are an odsp-web / SPDS / Fluent profile, not dependencies available
  in every project. ADO attachment instructions apply to ADO, not arbitrary hosts.

The active workflow owns claims, leases, stage ordering, consent, recovery, source
work and PR eligibility. Keep its existing stricter restrictions. Stop on an
unresolved contract conflict rather than choosing a weaker interpretation.

## Updating knowledge

Edit topics here, update their triggers/scope when needed, and rebuild the packages.
Publish through review. Do not delete or replace AgentOW's originals during this
stage. At the later coordinated cutover, compare both current trees against the
recorded origin, reconcile intervening changes, and qualify pinned consumption
before removing redundant authoring copies. No cross-repository synchronization
is implemented yet. An active run retains its installed snapshot; repository
publication is not hot loading.

The original public AgentOW paths and commit are retained in `index.json`.
Extraction does not change licensing: see the repository/package `LICENSE`.
No private notes, machine roster, credentials or production evidence belong here.
