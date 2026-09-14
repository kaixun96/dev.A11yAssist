# Hypothetical case: duplicate result announcement

Status: draft. Owner: unassigned. Case type: hypothetical; no observed evidence.
Source IDs: `sharepoint-utilities`, `spds-docs`, `sharepoint-support`.

## Symptom and context needed

Suppose a save operation appears to announce its result twice. This is an
illustrative investigation, not a report about any actual product, SPDS component
or host utility. Obtain the actual product/host context, installed package
identities and exact resolved versions, authoritative component/utility docs,
event sequence and separately authorized runtime evidence before diagnosing it.

## Candidate root cause and ownership

Hypothesis: a component's documented feedback path and a caller-added host
announcement both publish the same result for one completion event. Alternatives
include repeated completion events, stale async work, remount subscriptions or
focus movement exposing the same content. None is established by this example.

- **Native:** expose the actual element semantics and focus changes; determine
  whether a native interaction contributes another cue without assuming speech.
- **Framework:** confirm whether the installed component actually owns result
  feedback; do not infer behavior from its name or another version.
- **Host/caller:** trace result events, utility calls and subscription cleanup.
  Establish whether the host has duplicated delegated framework behavior or is
  correctly filling a gap. Keep Fluent V8 and V9 contracts distinct.

Use `common.analysis.root-cause` and
`common.implementation.component-contract` to locate the first duplicated
responsibility, not merely the last place where text appears.

## Wrong-but-plausible fixes

- Hide all result text from AT, losing the required feedback or accessible name.
- Add a delay or global duplicate-text filter, masking lifecycle faults and
  suppressing legitimate repeated results.
- Move focus to force speech, interrupting the user's task.
- Remove a shared framework feedback path without checking other callers.

## Conditional correction and blast radius

If evidence confirms that the documented framework path fully owns this result,
remove the redundant caller path at the integration boundary. If the host owns
feedback instead, correct event delivery or lifecycle there while preserving the
required message. No API names or actual source changes are prescribed here.
Assess other callers, multiple instances, repeated saves, failures, cancellation,
navigation and unmount/remount before generalizing the correction.

## Required regression evidence

Use `common.verification.static` to trace all producers and success/error/async
branches; `common.verification.testing` to cover event delivery, cleanup and
legitimate repeated results; and `common.verification.dynamic` to establish
actual speech and focus outcomes in the scoped host/AT combinations. Assert the
intended feedback without lost errors or unexpected focus changes, not a guessed
universal speech string. Every unvisited state remains unverified.

See [announcement and focus ownership](../utilities/announcements-and-focus.md)
and [host verification](../verification/themes-and-host.md). MAS and official
support-list connections remain pending; unsupported is not not-applicable under
[support policy](../profiles/support-policy.md). This hypothetical case provides
no execution authority and must never be reported as a reproduced issue or pass.