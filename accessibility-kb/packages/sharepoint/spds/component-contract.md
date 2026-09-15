# SPDS component delegation and composition

Status: draft. Owner: unassigned.
Source IDs: `agentow-accessibility`, `agentow-spds`.

Scope: historical ODSP-Web at AgentOW revision
`7896845e51d75b0b9d632a2fd61876bc2f556ea5`. These provisions are migrated
guidance, not current-approved SPDS documentation. Confirm installed exports,
wrapper composition and any explicit behavioral override before applying them.

## Underlying contract and documentation map

[Source: accessibility delegation/map, lines 21–58](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L21-L58).

The historical reference describes SPDS as a Fluent V9 style redesign: the
underlying component supplies semantics, keyboard/focus and announcements.
Inspect the wrapper/export to identify that component and the exposed SPDS
props/slots; styling or composition differences alone do not establish a new
accessibility implementation. Depart from the Fluent behavior only for an
explicitly documented behavioral override. Never invent a separate SPDS live
region merely because the import is SPDS.

Use `fluent.selection.components-and-utilities` for the shared documentation map
and `fluent.v9.component-contract` for the behavior itself. The SPDS routing is:

| Wrapper behavior/component | Underlying Fluent V9 reference to select |
| --- | --- |
| Names, visible labels, label/description relationships | Component labelling |
| `Button`, `Checkbox`, `Dropdown`, `Input`, `MenuButton`, `RadioGroup`, `SpinButton`, `SplitButton`, `Textarea` | The same-named component accessibility page, not a generic ARIA recipe |
| `MessageBar` intent/actions | MessageBar and AriaLiveAnnouncer |
| Focus styling | Focus indicator |
| Entry, containment, roving or restore focus | Focus management and useRestoreFocusTarget |
| Toast/status/alert timing | Notification best practices |
| Clipped labels/ellipsis | Truncation |
| Cross-component journeys / no more specific page | Experiences / Components overview respectively |

The source's official-storybook links are discovery references, not evidence
that this package has reviewed a current official version. Generic naming,
grouping, headings, icons and ARIA principles live in
`common.topic.component-accessibility`; native/framework/host boundaries live
in `common.implementation.component-contract`.

For an SPDS-backed V9 `MessageBar`, the host must supply the ancestor
`AriaLiveAnnouncer` required by `fluent.v9.component-contract`; inspect the root
before adding anything. Its intent owns the message. Do not duplicate it with
host alerts, wrapper roles or manual announcements. Keep `MessageBar` directly
under `MessageBarGroup` when using that composition. These SPDS consequences
come from [lines 112–178](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L112-L178);
the full Fluent presets/prerequisites are intentionally not duplicated here.
See [duplicate-announcement case](../cases/duplicate-announcement.md).

## Stable API and styling boundaries

[Source: selection/styling, lines 24–103](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md#L24-L103).

Use the host-specific stable/LazyComponents routes in
[selection](../selection/components-and-utilities.md). Prefer documented props,
slots, appearance, tokens, `className`, `style` and stable wrapper APIs. Many
overrides warrant checking whether the selected component or design intent fits.
Do not treat generated/private `.fui-*` selectors as stable contracts. The source
allows a narrowly scoped exception only after supported APIs fail, with technical
rationale, pinned version and upgrade revalidation; designer approval alone is
insufficient.

Prefer matching typography components (`Subtitle2`, `Body1`, or
`Text weight="semibold"`) to manually imitating a preset. Use `typographyStyles.*`
or tokens when semantic HTML requires it, without losing heading semantics.
Use Fluent icons rather than Unicode glyph substitutes; their meaning/decoration
still needs the correct accessibility treatment. When an element type changes,
recheck reused selectors for display, overflow, target size, focus, disabled and
selected states, and forced colors ([accessibility lines 63–80](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L63-L80)).

## Compound components: usable boundary examples

[Source: compound examples, lines 104–170](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-design-system-and-ux-components.md#L104-L170).

`Breadcrumb`, `Menu`, `TabList`, `Table` and `Dropdown` are semantic APIs, not
styled DOM containers. Use their documented items, slots and hierarchy. Raw
`li`, `tr` or `option` does not become valid merely because today's parent DOM
looks compatible. Adjacent actions, status and page controls remain siblings.

**Informative composition example:** a page info action is not a breadcrumb
destination. Keep it outside the breadcrumb rather than inserting a raw `li`:

```tsx
<div className={styles.breadcrumbRow}>
	<Overflow>
		<Breadcrumb>{breadcrumbNavigationItems}</Breadcrumb>
	</Overflow>
	<div className={styles.infoItem}>
		<Tooltip {...tooltipProps}>
			<InfoButton {...infoButtonProps} />
		</Tooltip>
	</div>
</div>
```

Here `breadcrumbNavigationItems` means documented breadcrumb items; layout,
localized names and Tooltip props remain caller-owned, not fabricated API defaults.

**Overflow opener:** preserve `BreadcrumbItem > Menu > MenuTrigger > Button`.
An opener performs an action; it is not a `BreadcrumbButton` navigation node.
This fragment shows the source's trigger hierarchy, not a complete menu:

```tsx
<BreadcrumbItem>
	<Menu>
		<MenuTrigger disableButtonEnhancement>
			<Button icon={<MoreHorizontalRegular />} aria-label={strings.overflowLabel} />
		</MenuTrigger>
	</Menu>
</BreadcrumbItem>
```

Supply the documented menu content in the owning implementation. Do not wrap
`BreadcrumbItem` in `MenuTrigger` or substitute a navigation component just
because it is clickable. Prefer the available SPDS Button wrapper. Confirm any
remediation against the installed component story/API before changing hierarchy.

Caller labels, controlled state, errors and navigation must pass through the
documented slots/props without overriding framework semantics. Preserve trigger,
dismissal, keyboard and focus contracts; route extra async behavior to
[announcements and focus](../utilities/announcements-and-focus.md), and provider,
theme and replacement risks to [host verification](../verification/themes-and-host.md).