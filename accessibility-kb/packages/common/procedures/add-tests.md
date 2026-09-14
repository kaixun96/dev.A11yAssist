# Add tests: recommend a bounded regression plan

**Status: draft guidance; not normative approved policy.** This task name denotes
read-only test recommendations, not permission to create or run tests. Actual
editing and runtime actions are delegated under the caller's separate
authorization and applicable workflow gates. No full workflow or evidence gate
is bypassed by this procedure.

1. Identify the user-visible contract, supported defect or risk, and intended
   outcome using [root-cause analysis](../analysis/root-cause.md).
2. Select [unit, component, and integration boundaries](../verification/testing.md)
   according to the owner and behavior. State what each proposed assertion can
   establish and what substitutes or simulated environments would leave unknown.
3. Describe initial state, action, expected result, and why the assertion would
   detect the targeted regression. Include relevant cancellation, retry, empty
   state, repeated instances, and unaffected consumers without broad unrelated
   test expansion.
4. Recommend semantic and behavioral assertions rather than structure-only
   snapshots or arbitrary timing delays. Keep localization and intentional
   component implementation changes from making assertions unnecessarily brittle.
5. List remaining [dynamic observation needs](../verification/dynamic.md), such
   as actual speech, focus visibility, voice targeting, or theme contrast.

Deliver a proposed test matrix with boundary, scenario, expected outcome,
responsible layer, evidence limits, and unverified coverage. Do not invent test
commands, install dependencies, or claim failing-before/passing-after execution.
Missing results remain unknown, not pass.