# Trace an accessibility root cause

**Status: draft guidance; not normative approved policy.** Produce read-only
analysis and recommendations. Source editing and runtime investigation require
the caller's separate authorization and applicable gates.

## Build a causal chain

Start with the affected user's action and lost information or operation. Keep a
reported symptom separate from an observed result and a source-based hypothesis.

1. **Component:** identify the public contract, wrapper, slots, and composition
   path. Determine which props reach the semantic element.
2. **DOM and semantics:** trace the rendered element where known, label and
   description targets, grouping, visibility, and stable identity. Missing
   wrapper code is missing context, not proof of a defective element.
3. **State:** follow reachable transitions, including loading, error, retry,
   cancellation, disabled state, and unmount. Check whether exposed state matches
   the committed user-visible state.
4. **Events:** identify who handles activation and dismissal, propagation, and
   default behavior. Check for suppressed native behavior or duplicate handlers.
5. **Focus and feedback:** identify the existing owner, destination, fallback,
   timing, and announcement mechanism. Do not propose a second owner without
   establishing why the existing contract is insufficient.

For each link, distinguish supplied source evidence, documented behavior, and
unknown runtime behavior. Record exact locations only when available.

## Recommend the correct fix layer

Use the [component contract](../implementation/component-contract.md). Incorrect
caller data belongs at the call site; lost prop forwarding belongs in the
wrapper; a broken shared lifecycle belongs with the component that owns it;
page navigation or a surviving focus fallback can belong to the containing view.
A documented platform limitation calls for a scoped alternative or escalation,
not an assumed platform defect or arbitrary replacement of a library.

Prefer the smallest change that restores the intended contract. Avoid symptom
patches such as duplicate labels, extra announcers, unconditional focus calls,
or timing delays that leave the underlying ownership problem intact.

## Assess regression blast radius

List other consumers, repeated instances, nested interactions, alternate inputs,
localization, themes, and asynchronous branches affected by the proposed layer.
Identify which existing behaviors must remain unchanged and recommend
[tests at the owning boundary](../verification/testing.md).

Output: symptom and evidence status; causal chain; responsible layer; proposed
correction and alternatives; affected consumers; remaining unknowns and a
separately authorized verification plan. No source inspection alone establishes
actual focus, speech, or rendered contrast.

Basis: [component semantics](../topics/component-accessibility.md),
[keyboard and focus](../topics/keyboard-focus.md),
[dynamic content](../topics/dynamic-content.md), and
[visual accessibility](../topics/visual-accessibility.md).

## Reusable review-miss counterexamples

These are sanitized, generalized **draft hypotheses** from historical review
lessons. They are not claims about a current product or verified incidents here.

| Mechanism | Concrete accessibility risk | Positive verification / smallest responsible correction |
|---|---|---|
| Independently derived initial state | Rejected preload leaves no data but “not loading”; an empty-state announcement flashes before refetch | Derive the loading/data decision coherently and check first render through completion; no false empty/count message |
| Equivalent paths disagree | Two callers map the same failure to different visible and assistive messages, or the same-context resource has conflicting meanings | Compare all in-scope copies/defaults and fix the actual divergence at its shared owner; do not demand reuse solely for matching syntax |
| Checklist substitutes for facts | Review claims provider-backed focus/status behavior while imports, wrapper source or provider ancestry contradict it | Trace the actual component/version and provider path; reconcile each conclusion with source instead of accepting a completed checklist |
| Stale asynchronous work | An older request overwrites results/count and speaks obsolete status; a dismissed surface receives late focus | Invalidate superseded/unmounted-owner work and tie state, feedback and focus to the current committed operation |
| Render/effect lifetime is wrong | Re-render repeats announcements, a missing dependency freezes a name/theme/state, or a document listener swallows keys outside its surface | Give side effects a scoped lifecycle, complete reactive inputs and cleanup; test rerender, owner change and unmount |
| Cancellation changes committed state | Cancel leaves a changed selection/count or triggers a needless refresh and focus jump | Keep tentative edits local until confirmation; cancel/no-op preserves committed data and the intended focus contract |
| Required versus absent data is blurred | A valid zero result is replaced by fallback text, or missing data is cast as present and removes the usable UI on first render | Define required/optional/zero/empty values explicitly; verify the rendered name, count or fallback for each meaningful case |
| Parity is mistaken for an unconstrained redesign | A format is called defective despite an explicit compatibility contract | Establish the scope first; preserve deliberate formatting while separately checking timezone arithmetic and any applicable accessibility requirement |

For every hypothesis, name a causal path and a falsifying positive case. A slow
request, a memo, a wrapper, a physical CSS property or a duplicated string alone
does not prove an accessibility defect. Prefer a precise user impact, such as
lost keyboard operation or an incorrect announced result, to importing generic
architecture, performance or review-process policy.

Historical basis: [review misses and parity calibration](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/docs/review-misses.md#L21-L81),
[React and asynchronous lifecycles](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/common-review-issues.md#L119-L178),
[data contracts](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/common-review-issues.md#L244-L261),
[cleanup and compatibility](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/common-review-issues.md#L332-L350),
and [comparing shared copies](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/shared-utility-reuse.md#L138-L151).
Current applicability and observations remain pending; no historical person,
work item, tenant or evidence artifact is needed to use these examples.