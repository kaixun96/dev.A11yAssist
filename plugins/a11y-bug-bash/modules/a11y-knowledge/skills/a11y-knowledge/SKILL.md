---
name: a11y-knowledge
description: ODSP accessibility knowledge for SPDS, Fluent V8/V9 and SharePoint. Guide accessible code generation, root-cause analysis, static review, optional design review and accessibility test planning using shared Common, Fluent and SharePoint knowledge, without running tests, scanners, browsers or assistive technology.
---

Use this plugin's registered read-only knowledge MCP tools. First call
`a11y_bug_bash_knowledge_list`, select Common foundations and the applicable
Fluent/SharePoint entry IDs for the actual component stack, then
call `a11y_bug_bash_knowledge_read(id)` for their actual content. Start with
foundations and read only relevant complete topics and find/fix/prevent/design/test
procedures. `a11y_bug_bash_knowledge_search(query)` can narrow selection, but a
search snippet or title is not the full rule; read the selected entries before
applying or citing them. Preserve entry citations and source metadata in findings.
Do not consume undeclared packages through this skill.

See `${PLUGIN_ROOT}/references/README.md` for the pinned snapshot and
automatic service's availability requirements. `${PLUGIN_ROOT}` is always the
top-level installed plugin root supplied by the host, even when this skill is
bundled inside an internal module. References are top-level, not module-local;
do not infer the root from this file's nesting or the user's working directory.

Node.js 22+ and a host with this MCP server enabled are required; normal use needs
no host KB pre-setup, peer plugin, provider or `A11Y_ASSIST_CONFIG`. Current KB
bodies are not bundled in the plugin. On a tool call the server uses an absolute
`A11Y_ASSIST_KB_ROOT` if set, otherwise a validated repository layout, otherwise
a verified shared user cache or lazy pinned HTTPS download. An invalid explicit
root or tampered cache fails without fallback/repair. Already cached content works
offline; first offline use requires a configured compatible local KB. Environment
variables are server settings, not model-expanded paths. If a tool or KB is
unavailable, report the error and needed host/network/local-KB configuration;
never run setup commands or claim remembered guidance came from the pinned KB.
Source records marked pending are missing authority, not supplied company rules.
Do not equate unsupported, not-applicable and unverified. Draft content
is not approved policy. Procedures and dynamic plans do not authorize execution.

This is the single knowledge entry point for ODSP. Keep Fluent V8 and V9 behavior
separate. Apply SPDS/SharePoint imports, utilities, focus and theme conventions
only to the matching component library, installed version and host. Prefer the
full component-owned contract over a second custom focus or announcement
mechanism. Product support, MAS and current component sources marked pending
remain explicit gaps; unsupported is not an exemption. Do not invent missing APIs.

Default to read-only source inspection. Use supplied snippets and, when available,
read-only access to narrowly relevant source and component documentation. The only
MCP calls allowed here are the registered read-only knowledge tools above, not
operational, test, shell or browser tools. Do not
edit files, run shell commands, tests or scanners, install dependencies, open a
browser/application, operate assistive technology, dispatch another task or
require an execution environment. The user does not need to repeat these limits.

1. Identify the platform, intended interaction and actual component contract.
   Do not assume a framework, repository layout, library or hidden dependency.
2. For code-generation requests, describe the accessible pattern and suggest
   minimal code; the calling coding assistant owns any separately requested edits.
3. For static review, follow names, roles, states, relationships, keyboard paths,
   focus transitions, feedback and relevant styles in the available source.
   Reuse built-in behavior; do not invent APIs or duplicate an existing mechanism.
   Use `common.analysis.root-cause` to locate the actual owner before recommending
   a fix. Explain component-provided versus caller-owned behavior, impact on shared
   consumers, error/async paths, regression tests and outstanding runtime checks.
4. Separate source-supported issues, context needed and runtime not verified.
   Give a location/snippet, user impact, source reasoning, relevant topic and
   minimal correction for each supported finding. Never fabricate measurements,
   spoken output, line numbers or a conformance verdict.
5. If no definite issue is found, say so for the reviewed scope. Missing context
   is not a defect, and static review is not proof that the UI is accessible.
