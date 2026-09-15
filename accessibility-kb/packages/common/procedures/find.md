# Find: source review and investigation plan

**Status: draft guidance; not normative approved policy.** This procedure is
read-only analysis and recommendations. Actual editing, reproduction, runtime
inspection, and tests are delegated under the caller's separate authorization
and applicable workflow gates; this is not a full workflow or gate bypass.

1. Bound the review to the requested user behavior and available source. State
   the target using [authority and applicability](../requirements/authority-and-applicability.md).
2. Select relevant [topics](../README.md) and follow the
   [static review plan](../verification/static.md). Inspect adjacent definitions
   only as needed to understand the control or transition.
3. Trace a suspected gap through the [root-cause chain](../analysis/root-cause.md).
   Check existing native and component ownership before suggesting missing ARIA,
   keyboard handling, focus management, or announcements.
4. Classify each conclusion as source-supported issue, context needed, or runtime
   not verified. Do not infer a defect merely because a preferred pattern is absent.
5. Recommend the smallest next information request or
   [dynamic observation plan](../verification/dynamic.md), without starting it.

Deliver the affected behavior, source basis, applicable rule and exceptions,
responsible layer, and uncertainties. If no definite issue is supported, say so
for the reviewed scope only; do not label the experience accessible or pass.