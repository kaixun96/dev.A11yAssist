---
name: a11y-knowledge
description: Guide code generation and perform read-only static accessibility review for generic and ODSP projects using portable topics and supplied current component documentation. No scanners, browsers or assistive technology execution.
---

Resolve bundled paths from the plugin root, two directories above this SKILL.md,
not the user's working directory.
Read `knowledge/README.md` and `knowledge/foundations.md`,
then select only the complete topics relevant to the supplied code or request.

For SPDS, Fluent V8/V9, SharePoint or ODSP code/questions, use these same portable
topics and supplied current component documentation. Keep Fluent V8 and V9 behavior
separate; establish the actual component contract from source. Project-specific
rules not supplied here are a context gap, not an assumed requirement. Do not
impose SharePoint conventions on generic Fluent or other-framework code.
For unrelated projects, use only the generic topics. When the stack is unknown,
identify it from supplied code or ask for context instead of assuming ODSP.
The bundled portable topics are available offline without another plugin.

Default to read-only source inspection. Use supplied snippets and, when available,
read-only access to narrowly relevant source and component documentation. Do not
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
4. Separate source-supported issues, context needed and runtime not verified.
   Give a location/snippet, user impact, source reasoning, relevant topic and
   minimal correction for each supported finding. Never fabricate measurements,
   spoken output, line numbers or a conformance verdict.
5. If no definite issue is found, say so for the reviewed scope. Missing context
   is not a defect, and static review is not proof that the UI is accessible.
