# Authority and applicability

**Status: draft guidance; not normative approved policy.** This is read-only
interpretation guidance, not permission to edit or execute anything.

## Classify the source before applying it

| Source | How to use it |
|---|---|
| Normative standard text | Identify the exact version, criterion, scope, level, and exceptions before stating a requirement. |
| Official requirement adopted by the caller | Record the supplied authoritative source and its applicability; do not infer adoption from a familiar name. |
| Informative explanation or implementation pattern | Use it to understand intent and possible solutions, not as a new mandatory rule. |
| Component or platform support documentation | Establish promised behavior and supported combinations; support does not itself establish standards conformance. |
| Local draft guidance or illustrative case | Use as a reasoning aid, not as approval, policy, or evidence of a verified result. |

[Foundations](../topics/foundations.md) supplies primary references to WCAG 2.2,
WAI-ARIA, Understanding WCAG, and the ARIA Authoring Practices. WCAG success
criteria and applicable normative ARIA requirements differ from informative
explanations and suggested interaction patterns. A pattern's presence does not
prove conformance, and native semantics need not be replaced with ARIA.

## Record an applicability decision

For each proposed requirement, record the user behavior, authoritative source
and version, relevant criterion, applicability rationale, exceptions considered,
and evidence available. If no target is stated, WCAG 2.2 A/AA is a review
reference only, not an asserted contractual or legal obligation.

Never fabricate MAS identifiers, quotations, mappings, approval, or policy text.
If a caller requests a MAS mapping without an authoritative supplied source,
record that mapping as unknown. A plausible WCAG mapping is not a substitute for
an official requirement that has not been provided.

## Keep conclusions bounded

- A source-supported defect needs a causal path, not just a coding preference.
- Missing implementation, platform support, or runtime evidence is unknown, not
  pass and not automatically failure.
- A successful check proves only the checked behavior under its recorded scope.
- Separate required outcomes from recommended implementations and unverified
  assumptions; do not turn this guidance into an execution or approval gate.

Use [static verification](../verification/static.md) and
[dynamic planning](../verification/dynamic.md) to state what evidence is missing.