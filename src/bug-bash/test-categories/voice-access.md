# Voice Access

Test Windows Voice Access using actual spoken commands and observed product
behavior. This is voice-control testing, not a screen-reader result. A DOM/AX
snapshot, UIA invocation, browser click or synthetic keypress does not establish
that Voice Access recognized speech or completed the task.

## Prerequisites and scope

1. Select representative in-scope journeys and safe fixtures. Record route,
   flags, build identity, viewport, browser version, Windows build, Voice Access
   version when exposed, language, microphone/input device and recording route.
   Source-only and plan-only never launch Voice Access or execute these steps.
2. Require an authorized interactive Windows desktop with exclusive ownership.
   Run serially with no competing browser/OS input or AT session. Do not start
   NVDA or Narrator for these checks. Never disconnect or stop another user's AT.
3. Confirm Voice Access is installed, the selected language is available, and
   the correct input is listening. A first-run agreement, microphone permission,
   language download or host change requires the appropriate explicit consent;
   this procedure does not authorize installation or accepting prompts.
4. In a safe target, speak a supported harmless command and observe recognition
   and its effect. Confirm the recording captures non-silent input audio and
   the same command's visible recognition feedback. Installed binaries, a
   microphone icon or a running process alone do not establish readiness.
5. If the desktop, speech input, language or evidence capture is unavailable,
   mark the affected rows `blocked` or `inconclusive` with the exact reason.
   Continue independent browser checks, without representing them as Voice Access.

## Execute representative journeys

Use commands supported by the actual Windows build and selected language.
The examples below are English, not a requirement to change the user's language.
Confirm unfamiliar commands through Voice Access help or the official command
list. Record the exact utterance and recognition feedback rather than assuming
that a command succeeded.

1. **Name-based activation.** Say `Click <visible label>` for representative
   buttons, links, tabs, checkboxes and menu items. Verify the intended target,
   resulting state and focus. For repeated labels, follow the offered
   disambiguation and confirm the correct instance. Do not infer success from
   recognition alone or activate destructive controls without authorization.
2. **Number overlays.** Say `Show numbers`, record the actual overlay and say
   `Click <number>` for the intended target. Check open menus/dialogs and newly
   revealed controls; obtain fresh numbers after state changes rather than
   reusing stale labels. Say `Hide numbers` afterward. Record missing or ambiguous
   targets separately from errors recognizing the spoken number.
3. **Grid fallback.** Where relevant, say `Show grid`, refine using the displayed
   cell numbers, then say `Click` at the intended location. Verify the action and
   say `Hide grid`. Report this as coordinate-based fallback: a successful grid
   click does not prove label-based activation works or erase its failure.
4. **Text entry and correction.** Focus a safe search/input field by voice.
   Dictate non-sensitive fixture text, using `Dictation mode` when appropriate;
   observe what is inserted. Return to `Default mode` before issuing commands.
   Select or correct a misrecognized phrase using the build's supported text
   commands, then verify the final value, caret/selection and resulting search or
   validation state. Never dictate passwords, MFA codes or personal information
   into a recording. Submit only safe authorized fixtures.
5. **Scrolling and navigation.** Say `Scroll down` and `Scroll up` in the intended
   page or scrollable region. Confirm which region moved and reach a previously
   offscreen control. Where needed, speak `Press Tab`, `Press Shift Tab` or
   `Press Enter` and observe focus/activation. These must be spoken commands
   processed by Voice Access, not keys sent directly by the harness.
6. **Menus, dialogs and dynamic states.** Open a representative menu/dialog by
   voice, operate an inner control, dismiss with `Press Escape` or a named Cancel
   action where supported, and reopen. Check focus restoration and whether
   labels/numbers target the current UI after loading, validation, insertion or
   removal. Do not reuse an overlay captured before the transition.
7. **Alternatives to dragging or gestures.** If the feature has these controls,
   use its named buttons or other single-action alternatives by voice. Test
   voice-driven grid dragging only when supported, scoped and safe. Record
   whether the product alternative or coordinate workaround completed the task;
   neither automatically establishes every relevant WCAG requirement.
8. **Recognition failure and recovery.** Capture an actual unsuccessful attempt
   when one occurs; do not fabricate a failure. Check the listening state,
   language, input route, foreground target and supported command. If asleep,
   use `Voice access wake up`; a microphone switched fully off may require
   separately recorded setup intervention. Make a bounded retry from known
   preconditions, then try a relevant name/number/grid alternative. Record each
   attempt independently. Do not silently replace the command with mouse/keyboard
   input and report voice-only success.

## Evidence and outcome

For each scenario preserve the preconditions, target, exact utterance, recognized
text or visible recognition feedback, timestamped action/result, focus/state
change and screenshots. Keep synchronized screen and non-silent input audio
recordings in the authorized private artifact directory. Record tool/producer
identity, real artifact paths and hashes when available. A structured result
record can reference these artifacts; it cannot replace the actual recordings.
If recognition text is not exposed, retain the visible feedback and state that
limitation rather than inventing a transcript.

Attribute number/grid overlays to Windows Voice Access, not product-owned UI.
Capture before, during and after states when needed to distinguish the overlay
from the product. UIA/DOM facts may support a separately labeled diagnostic
investigation but cannot substitute for spoken-command evidence.

Separate command-recognition/input failures, product interaction failures and
successful fallback paths. A recognition failure alone is not proof of a product defect.
Reproduce candidates from known preconditions when safe; retain uncertainty for
intermittent behavior. Use the existing coverage row statuses, with
`observed-no-issue` limited to the actual executed checks and `not-applicable`
requiring a feature-specific reason. Missing evidence is a gap, never a pass.
Do not infer full Voice Access support, screen-reader support or WCAG conformance
from completion. Cite standards only when their conditions are established.

## Recovery and cleanup

Hide owned overlays, release any held input and restore the changed viewport,
fixture, microphone mode and test settings. Stop only sessions/recorders owned
by this run; preserve pre-existing user sessions. Record manual recovery or
cleanup separately from the voice-only journey and report unresolved effects.
Do not test cleanup-only pages as additional accessibility coverage.

## Official command reference

- [Microsoft Support: Voice access command list](https://support.microsoft.com/en-us/accessibility/windows/voice-access/voice-access-command-list)
- [Microsoft Support: Use the mouse with voice](https://support.microsoft.com/en-us/accessibility/windows/voice-access/use-the-mouse-with-voice)

These sources describe Windows commands, not product conformance requirements.
Check availability against the actual installed build and language.
