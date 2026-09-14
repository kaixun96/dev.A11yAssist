# Prevent: recommend durable safeguards

**Status: draft guidance; not normative approved policy.** Produce read-only
recommendations. Documentation edits, source changes, test execution, and runtime
work require the caller's separate authorization and applicable workflow gates.
This procedure neither authorizes an end-to-end workflow nor bypasses its gates.

1. Start with a supported causal pattern, not an unverified incident story.
   Identify repeated risks using [root-cause analysis](../analysis/root-cause.md).
2. Recommend documenting the [component contract](../implementation/component-contract.md):
   supplied semantics, caller naming and state responsibilities, focus fallback,
   feedback ownership, safe composition, and limits on overrides.
3. Place safeguards at the layer that owns the behavior. Examples include
   clearer API obligations, preserved native defaults, localized naming inputs,
   stable identity, or explicit error and empty-state designs. Avoid speculative
   framework migrations or local patches duplicated across consumers.
4. Recommend [regression tests](../verification/testing.md) for the failure mode
   and representative consumers, with remaining runtime coverage made explicit.
5. Recommend review prompts for future changes to shared styles, conditional
   rendering, asynchronous state, focus ownership, and content growth.

Deliver the causal risk, proposed safeguard, responsible owner, affected
consumers, evidence basis, and coverage limits. A repeated recommendation is not
an approved policy; identify who would need to review and adopt it separately.

Basis: [foundations](../topics/foundations.md),
[component semantics](../topics/component-accessibility.md), and
[dynamic content](../topics/dynamic-content.md).