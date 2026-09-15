# Review design: recommend accessible interaction outcomes

**Status: draft guidance; not normative approved policy.** This procedure provides
read-only review and recommendations, not approval or execution authority.
Actual design/source edits and runtime work are delegated under the caller's
separate authorization and applicable workflow gates, not a full workflow bypass.

1. Establish the user goals, proposed states, available design materials, and
   [applicable requirement sources](../requirements/authority-and-applicability.md).
2. Follow [design verification](../verification/design.md) across semantics,
   content, keyboard and voice operation, focus, feedback, and visual adaptation.
3. Map responsibilities with the [component contract](../implementation/component-contract.md).
   Identify behavior already provided by the selected primitive and unanswered
   questions at the caller boundary.
4. Recommend explicit outcomes for opening, operating, dismissing, failing,
   retrying, and completing the interaction as applicable. Do not infer missing
   state designs or assign conformance from a mockup.
5. Identify implementation checks, [test boundaries](../verification/testing.md),
   and [later runtime observations](../verification/dynamic.md), without executing
   them or claiming the outcomes have been observed.

Deliver supported design gaps, rationale, proposed outcomes, responsible layers,
open questions, and later evidence needs. Separate requirements from preferences
and unknowns; absence of a visible design problem is not a pass result.