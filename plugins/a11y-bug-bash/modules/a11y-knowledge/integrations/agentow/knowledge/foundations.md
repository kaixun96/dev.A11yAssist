# Accessibility foundations

Extracted from the AgentOW accessibility knowledge index. This document classifies
requirements and evidence; it does not authorize source changes, resource control
or PR publication.

## Source priority

Read sources applicable to the defect in this order:

1. The bug's exact expected behavior and reproduction steps.
2. The existing implementation and predecessor behavior, including load-bearing
   accessibility comments and timing.
3. The native component's accessibility contract. In odsp-web, prefer SPDS/Fluent
   behavior before hand-writing ARIA, announcements or focus management.
4. The applicable authorized host setup and evidence procedures.
5. WCAG 2.2 AA success criteria and Microsoft platform guidance.

Do not transfer private team or owner documents into a repository or PR. Cite only
shareable sources and portable rules. Record the actual documents and versions
used in the run's immutable knowledge manifest.

## Evidence hierarchy

- NVDA with captured speech supports repeatable screen-reader regression.
- Narrator-specific behavior requires Narrator/UIAutomationCore/Speech-TTS ETW.
- Unattended screen-reader recordings require the composed Windows desktop,
  persistent audio, speech-aware focus timing and validated video/focus frames.
- Voice Access requires real recognition, captured audio and visible-state proof.
- Real OS keyboard input is required to establish screen-reader focus/navigation.
  CDP keyboard injection is not equivalent evidence of Win32/UIA event behavior.
- Accessibility trees, axe and source inspection are supporting diagnostics, not
  substitutes for real assistive-technology evidence.

Never run NVDA and Narrator simultaneously. WCAG mapping, a running process,
installation success or an existing media file does not prove a behavior passed.

## Rule selection

Map the observed user impact to the most precise applicable criterion. These are
common mappings, not automatic findings:

| Failure | Typical WCAG criterion |
|---|---|
| Missing/wrong name, role, state or value | 4.1.2 |
| Broken structural relationship or reading order | 1.3.1 |
| Visible label not contained in accessible name | 2.5.3 |
| Ambiguous heading or control label | 2.4.6 |
| Focus missing, obscured, trapped or restored incorrectly | 2.4.3, 2.4.7, 2.4.11 |
| Status/error/loading change not announced | 4.1.3 |
| Keyboard operation unavailable | 2.1.1 |
| Reflow/zoom loss | 1.4.10 |
| Contrast failure | 1.4.3 or 1.4.11 |

Classification is not proof of reproduction or repair. Evaluate the reported
expected behavior; if it is ambiguous or inconsistent, record the uncertainty
rather than silently changing the acceptance criterion.
