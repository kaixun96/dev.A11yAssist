# Fix: propose a scoped correction

**Status: draft guidance; not normative approved policy.** Despite its task name,
this is a read-only recommendation procedure. Actual source edits, branches,
reproduction, runtime checks, and publication are delegated under the caller's
separate authorization and all applicable workflow gates. It does not replace
required before evidence or authorize a full workflow bypass.

1. Separate a reported symptom from an established source finding and any
   accepted reproduction evidence supplied by the caller. Do not fabricate
   missing evidence or proceed as though a required gate had passed.
2. Use [root-cause analysis](../analysis/root-cause.md) to identify the responsible
   layer and [component contract](../implementation/component-contract.md).
3. Recommend the smallest correction that restores the intended user behavior.
   Explain supplied behavior to preserve, caller obligations to correct, and
   alternatives when the contract is unknown. Prefer existing native semantics
   and established focus or feedback owners over duplicate implementations.
4. Describe regression exposure: shared consumers, repeated instances, alternate
   state branches, localization, themes, and other input methods as applicable.
5. Recommend [test cases](../verification/testing.md) and
   [dynamic observations](../verification/dynamic.md) that can distinguish the
   original behavior from the intended outcome under separate authorization.

Deliver a correction plan with the causal evidence, owning layer, intended
outcome, preserved behaviors, verification needs, and unresolved assumptions.
Do not claim code was changed or that a proposed fix was validated.

See the [illustrative dialog case](../cases/dialog-focus.md) for a focus-ownership
example, not a verified solution to an actual incident.