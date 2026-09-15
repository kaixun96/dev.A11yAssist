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

## Interpreting scans and transition observations

A DOM accessibility scan can find some supported
rule violations in the selected rendered state. Record its scope, rules,
exclusions, disabled-rule rationale and state. A zero-violation count in selected
content says nothing about excluded regions or unvisited loading/error/selection
states. Disabling a rule requires a specific scoped justification, not hiding
failures or implying conformance. An editor/content assistant's no-issues result
does not qualify arbitrary application controls or the surrounding page.

For the [collection outcome matrix](../topics/dynamic-content.md), recommend
separate visible, programmatic and focus observations for each applicable cell.
Useful supplied evidence identifies the exact operation and resulting message,
order/repetition, focused element and usable next action. A screenshot of updated
rows cannot establish speech; an accessibility-tree status node cannot establish
that an announcement was delivered; a focus trace cannot establish its visibility.

| Supplied observation | Positive interpretation | Negative overclaim to reject |
|---|---|---|
| A scoped scan finds no violations | No violations from that scanner/ruleset in that scope and state | All keyboard paths, speech and dynamic transitions pass |
| Repeated refresh keeps the same count | Compare each request's committed updated/no-change feedback and actual focus separately | An unchanged count proves no feedback was needed |
| Error component announces once | That error transition is covered in the observed configuration | Successful retry, appended rows and end-of-list are also covered |
| Initial page reading exposes static content | No redundant initial announcement is necessarily required | A later asynchronous replacement can be silent because initial reading worked |
| Final deselection leaves focus on a row | This path preserved row focus; separately inspect focus inside a disappearing toolbar | All selection-related focus cases passed |
| Background completion while the user types | Verify status and retained typing focus without forced navigation | Move focus back to the old initiator to make completion discoverable |

Unavailable AT, inaccessible scenarios, missing before-state or contradictory
observations remain not-run, blocked or inconclusive as appropriate, never a
simulated successful result. Product scan/helper APIs route through
`sharepoint.selection.components-and-utilities`; no scanner or private helper is
a Common dependency. No commands, hosts or assistive sessions are started here.

The interpretation examples are generalized guidance, not actual observed results.

## Voice Access overlay attribution

For a numbered-overlay before/after comparison, require matching canonical URL,
viewport, scale, scroll, target selector and target geometry. This comparison
also requires the debug bar hidden and no dialogs; do not compare screenshots
with different chrome/dialog states as if they demonstrate a page regression.
For an intentionally changed geometry or dialog-specific task, define a separate
matched scenario rather than silently relaxing the comparison.

Map every reported number's screen point to DOM/UIA element bounds. Exclude
browser chrome, taskbar and other OS overlays from page findings. A number on an
actionable link, button or input is not itself an accessibility violation; this
does not exempt that control from other naming or operation checks. An unmapped
number is **INCONCLUSIVE**, never a page defect. Example: an overlay over the
browser toolbar cannot prove the page has a wrongly interactive heading; a
mapped non-actionable page target can be assessed against the actual task.

## Recorded screen-reader evidence and matched verification

When evaluating an unattended NVDA/Narrator recording, require validated duration,
frame dimensions, image variance, audio RMS/peak and an extracted frame showing
visible focus. Media must capture real screen-reader speech from a persistent
audio endpoint and the composed Windows desktop. An existing MP4, silent audio,
static slideshow or browser-only capture is insufficient. Quality metadata does
not by itself prove the expected words or behavior: review the relevant segments.

Each applicable step must link its immutable recording and other required evidence;
a video placed beside a report or mentioned only in prose does not cover steps.
Reproduction needs an actual observed failure of the requested expectation.
Verification compares the same approved scenario and baseline against the actual
tested revision/build, covers every requested step and demonstrates the original
failure no longer occurs. Missing, blocked, skipped, inconclusive or contradicted
observations cannot be upgraded by a source diff or static scan. Exact artifact
schemas, hash validators and execution remain with the existing workflow.