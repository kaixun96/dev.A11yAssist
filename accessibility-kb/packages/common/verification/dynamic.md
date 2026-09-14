# Dynamic verification planning and observations

**Status: draft guidance; not normative approved policy.** This document describes
read-only planning and interpretation of supplied observations. It grants no
execution authority. Application operation, tests, and assistive-technology use
belong to a separately authorized caller or executor under applicable ownership,
scope, and evidence gates. Do not install tools, change environments, invent
commands, or start runtime work from this guidance.

## Specify the observation, not an assumed result

For each affected user journey, recommend recording the initial state, action,
expected accessible outcome, relevant requirement, and important alternate
states. Include cancellation, error/retry, repeated operation, and disappearing
controls when those paths exist. Expected outcomes are not observed evidence.

| Method to consider in a separately authorized plan | Questions and observations to record |
|---|---|
| Keyboard | Reachability, activation without duplicate action, applicable composite keys, dismissal, order, focus destination and fallback, visible and unobscured focus |
| Screen reader | Actual name, role, state, relationships, reading order, dialog context, and status/error feedback on relevant transitions |
| Voice input | Whether visible control wording supports identifying and activating the intended target, including repeated labels and alternate states |
| Forced colors and themes | Visible focus and control boundaries, selected/error states, non-color cues, and actual foreground/background combinations |
| Layout and content adaptation | Text resize, reflow, spacing, localization growth, pointer targets, and loss of content or operation under applicable conditions |

Narrator or NVDA are possible screen-reader reference methods; Voice Access is a
possible voice-input reference method. Accessibility Insights may provide
supplementary inspection observations. These are optional references, not setup
instructions, required dependencies, or guarantees of coverage. Use only methods
available and authorized for the actual scope; unavailable coverage is unknown.

## Interpret supplied evidence

Record the actual application revision, relevant platform and browser versions,
assistive-technology version and settings when applicable, theme, input method,
initial state, action, and observed outcome. Preserve the distinction between
direct observations, supplied reports, and hypotheses. Do not synthesize speech
transcripts, screenshots, focus traces, contrast ratios, or successful checks.

Compare the observed behavior with the specified outcome and explain differences.
A successful observation covers only that scenario and configuration. A scanner
result is not a substitute for keyboard, speech, visual, or voice observations.
Missing or inconclusive evidence remains unverified, not pass.

Basis: [keyboard and focus](../topics/keyboard-focus.md),
[dynamic content](../topics/dynamic-content.md),
[component semantics](../topics/component-accessibility.md), and
[visual accessibility](../topics/visual-accessibility.md). Pair runtime plans
with [static reasoning](static.md) and [test boundaries](testing.md).