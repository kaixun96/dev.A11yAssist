# Announcement and focus responsibility method

Status: draft. Owner: unassigned.
Source IDs: `sharepoint-utilities`, `spds-docs`, `sharepoint-support`.

No utility API, availability or default behavior is asserted here. Record the
actual host, installed utility/component package identities and exact resolved
versions, and authoritative documentation for their scope and lifecycle.
Unavailable documentation leaves the affected decision blocked; do not guess a
method name, global service, timing rule or supported host.

## Trace before choosing a utility

1. State the user event and intended outcome: a focus transition, a status
   update, an error association or a combination with distinct purposes.
2. Identify **native** behavior: focusability, activation and exposed semantics
   of the actual HTML elements. Native semantics do not guarantee exact AT speech.
3. Identify **framework** behavior: documented focus management and feedback
   already supplied by the component and its composition.
4. Identify **host/caller** behavior: application result content, route changes,
   external focus targets and lifecycle integration. A host utility may handle
   a delegated gap only when its version-matched contract establishes ownership.
5. Trace every producer and consumer of a focus change or announcement. Review
   success, failure, cancellation, repeated updates, remounts and stale async
   completion. Distinguish duplicate producers from necessary complementary cues.

Do not move focus merely to force speech, add a second announcement path as a
fallback for unknown behavior, or remove required feedback without identifying
its owner. Avoid arbitrary delays or broad suppression as substitutes for a
lifecycle contract. Use `common.analysis.root-cause` and
`common.implementation.component-contract` to document the responsible layer.

Output an event-to-owner map, evidence for utility necessity, lifecycle limits
and verification scope. `common.verification.static` covers source branches;
`common.verification.dynamic` covers actual focus and AT outcomes;
`common.verification.testing` defines regression assertions and remaining manual
checks. Exact observed speech requires runtime evidence, not source inference.
See the [hypothetical case](../cases/duplicate-announcement.md).

The official support list and MAS connection remain pending; apply
[support policy](../profiles/support-policy.md). This method contains no tool
installation or browser operations and grants no execution authority.