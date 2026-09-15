# Select Fluent components and utilities by interaction contract

Status: draft. Owner: unassigned.
Active source status and entry bindings: [package metadata](../package.json).

These are draft selection and verification rules, not
official MAS requirements or a blanket SPDS-first policy for every product.
Identify imports, exact installed versions, host wrappers and intended behavior.
Use the [V8 contract](../v8/component-contract.md) or
[V9 contract](../v9/component-contract.md) for the actual owner. Exact installed
patch versions are not specified here; verify an API before
prescribing code for a different version or composition.

## Select the interaction, not the request's noun

The concrete comparison below concerns ODSP-Web/SPDS on Fluent V9. Use this
fit reasoning for Fluent candidates only after checking the installed Fluent
component's capabilities; do not turn that host's export policy into a universal
framework requirement.

1. Translate a request such as “list” into data shape, selection mode, sorting,
   filtering/grouping, keyboard model, editing, virtualization/paging, drag/reorder,
   responsive behavior and semantics. A semantic list, table, grid or tree may fit.
2. Compare the strongest two plausible candidates when more than one fits. Read
   component documentation and version-pinned source, not only exported names.
3. Record requirement → capability, chosen component, serious alternative and
   why it falls short, supported import/composition, and comparable host usage.
   Missing evidence is an unresolved selection, not proof of capability.
4. Use the highest supported owning layer that meets the interaction. A small
   visual preference is not a reason to rebuild its accessible behavior. For a
   SharePoint host, consult `sharepoint.selection.components-and-utilities` for
   stable/LazyComponents routes and fallback policy; other hosts have their own
   supported layers.

| Required interaction | Candidate reasoning | Don't |
| --- | --- | --- |
| Conventional tabular interaction with sort, row selection, stable row identity and grid keyboard/focus behavior | Evaluate DataGrid and its documented column definitions, controlled sort/selection state and selection cells | Hand-build header buttons, checkboxes, `role="grid"` and arrow navigation when the supported grid owns them |
| Primarily presentational table, or substantial nonstandard rows/keyboard/selection/composition the grid cannot support | Evaluate Table; document the actual DataGrid capability gap and the extra interaction/ARIA responsibility if Table is made interactive | Choose a lower-level Table solely because the feature also has upload, paging, status or dialogs |
| Server-side sorting/paging with commands or dialogs | Keep adjacent workflows outside the grid; drive requests from controlled state if DataGrid otherwise fits | Treat server-side data as proof that the grid's interaction model cannot be used |
| Narrow/high-zoom tabular content | Follow component guidance; preserving a minimum width in a horizontal scroller can retain header/cell relationships | Collapse columns or relationships merely to fit the viewport, or extrapolate the data-table exception to ordinary page content |

Verify the chosen pattern's keyboard operation, role/header relationships,
controlled state, row identity and narrow-width behavior. Shared semantics and
the two-dimensional-layout exception are in `common.topic.component-accessibility`
and `common.topic.visual-accessibility`, not a separate Fluent conformance rule.

## V9 component-to-document map

Use the following documentation targets for V9 usage. These official-site URLs
are discovery targets, not immutable reviewed evidence or
V8 documentation. Resolve the installed version and record the actual reviewed
revision. The `useRestoreFocusTarget` link uses the `usestorefocustarget` route below;
if a route has moved, find the named export in that version instead of guessing.

| Component or behavior | Documentation target |
| --- | --- |
| Names, labels, `aria-label`, `aria-labelledby`, `aria-describedby` | [Component labelling](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-component-labelling--docs) |
| Button/action controls | [Button](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-button--docs) |
| Binary selection | [Checkbox](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-checkbox--docs) |
| Option selection, placeholder/label or Fluent dropdown-style choice entry | [Dropdown](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-dropdown--docs) |
| Single-line entry, labels, descriptions and validation | [Input](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-input--docs) |
| Menu trigger naming, state and popup relationships | [MenuButton](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-menubutton--docs) |
| Mutually exclusive choice | [RadioGroup](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-radiogroup--docs) |
| Numeric entry and stepper semantics | [SpinButton](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-spinbutton--docs) |
| Primary action plus menu action | [SplitButton](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-splitbutton--docs) |
| Multiline entry, descriptions and validation | [Textarea](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-textarea--docs) |
| Message intent, actions and announcements | [MessageBar](https://storybooks.fluentui.dev/react/?path=/docs/components-messagebar--docs) and [AriaLiveAnnouncer](https://storybooks.fluentui.dev/react/?path=/docs/utilities-aria-live-arialiveannouncer--docs) |
| General component expectations | [Components overview](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-components-overview--docs) |
| End-to-end interaction/journey | [Experiences](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-experiences--docs) |
| Visible/custom focus styling | [Focus indicator](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-focus-indicator--docs) |
| Focus entry, containment, roving, restoration and movement | [Focus management](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-focus-management--docs) and [useRestoreFocusTarget](https://storybooks.fluentui.dev/react/?path=/docs/utilities-focus-management-usestorefocustarget--docs) |
| Toast/status/alert timing and behavior | [Notification best practices](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-notification-best-practices--docs) |
| Truncation, clipped content and Tooltip fallback | [Truncation](https://storybooks.fluentui.dev/react/?path=/docs/concepts-developer-accessibility-truncation--docs) |

A confirmed SPDS wrapper backed by V9 uses that underlying accessibility contract
unless it explicitly documents a behavioral override. Inspect exposed wrapper
props and composition rather than inventing a product-specific announcer or
assuming a styling override changes semantics. Wrapper/export details stay in
`sharepoint.spds.component-contract`.

## Compound components are semantic APIs, not styled containers

- Breadcrumb, Menu, TabList, Table and Dropdown have documented item types,
  slots and wrapper hierarchy. Do not insert raw `li`, `tr` or `option` merely
  because the current implementation renders a compatible parent.
- Keep adjacent actions/status/page-level controls outside compound internals,
  arranging them with a sibling layout. Use the corresponding documented item
  component for a genuine component item.
- For a Breadcrumb-adjacent information button, **don't** inject a raw `li`
  containing Tooltip/InfoButton into Breadcrumb. **Do** keep the navigation
  Breadcrumb (and its Overflow wrapper, where used) separate from the sibling
  information control. Verify navigation items, list structure and keyboard access
  to the information control rather than approving the same visual layout.
- For a breadcrumb overflow opener, use the structure
  `BreadcrumbItem > Menu > MenuTrigger > Button`. **Don't** put BreadcrumbItem
  under MenuTrigger or substitute BreadcrumbButton solely because it is clickable.
  The opener performs an action; BreadcrumbButton represents a genuine breadcrumb
  navigation/current item. Preserve the documented `disableButtonEnhancement`
  composition where applicable and a localized accessible name on the icon-only
  Button. Verify the actual story/source before adapting this to an installed
  version, then test menu opening, keyboard navigation and restoration.
- Use documented props, slots, appearance options, typography presets, tokens,
  `className`/`style` and supported wrappers instead of imitating a control's
  internal styles. Prefer library icons rather than Unicode glyph substitutes;
  still verify decorative hiding and action names at the call site.
- Generated/private `.fui-*` selectors are not stable contracts. A narrowly
  scoped exception only applies when supported APIs fail,
  the technical reason and version are documented, and upgrade revalidation is
  required. Designer approval alone or a broad private-selector override is not
  sufficient. Do not call every raw style value a WCAG violation without impact.

For cross-cutting semantics, accessible labels/grouping, visual states, custom
widgets and truncation, use `common.topic.component-accessibility`,
`common.topic.forms-and-content`, `common.topic.visual-accessibility` and
`common.implementation.component-contract`. The framework-specific check is
whether caller overrides or composition remove behavior those contracts need.

## Select a utility only for an unowned responsibility

| Existing owner | Select / preserve | Reject |
| --- | --- | --- |
| Native V9 MessageBar | Intent with the existing application-level AriaLiveAnnouncer | Manual `useAnnounce`, shared alert or wrapper live region for the same message |
| Default V8 MessageBar | Its delayed-render/internal announcement | An extra `Announced` for the same error or a V9 provider as a V8-only fix |
| Independent V9 dynamic result | Provider-backed `useAnnounce` if established; typing utility only for its documented typing use | Generic `useTypingAnnounce` for sort/load completion |
| V9 component-owned focus | Component props/composition; restoration hooks only for a real unmet responsibility | Imperative focus or a competing page-level restore owner |
| Migration-layer modal/panel | That layer's established dismiss/restore and shim APIs | Recommending shims to native V9 merely because the UI looks like a panel |
| SharePoint shared announcement or page/canvas/cross-view focus | Optional `sharepoint.utilities.announcements-and-focus` route | Importing that product API as a universal Fluent requirement or duplicating its working mechanism |
| Custom/unmanaged behavior outside those owners | Established accessible primitive; Common's native/custom contract where appropriate | Copying a private alert/visually-hidden implementation or assuming no shared helper exists without checking the installed host |

RTE scanners, product drag/reorder utilities and audit helpers remain in
`sharepoint.selection.components-and-utilities`; they are not general Fluent
component APIs. Keep product implementations separate from shared principles.

## Localization and directional styling at the Fluent boundary

Fluent V8/V9 style APIs auto-flip directional properties in
their CSS-in-JS path. **Do** verify the style actually passes through that path.
**Don't** flag a physical-direction property there solely by its spelling, or
assume ordinary CSS, Sass/Less, inline styling or a bypass has the same behavior.
For a bypass, use the host's RTL-aware mixin/logical properties and verify RTL
rendering. This is a styling-path scope condition, not proof that every style
implementation/version flips identically.

Localized names, descriptions, status/count text and fallbacks follow
`common.topic.forms-and-content` and `common.topic.dynamic-content`; product
resource/formatter contracts route through
`sharepoint.selection.components-and-utilities`. Do not import SharePoint count
formatters or English plural rules as Fluent APIs. Compare LTR/RTL, long localized
names and narrow-width layouts when verifying the chosen styling path.

## Version replacement: verify behavior across the boundary

This checklist retains knowledge about replacement risks, not flight/killswitch,
dependency-update, release or live evidence-capture instructions.

| Replacement boundary | Inspect and verify |
| --- | --- |
| V8 Panel, PanelShim or a proposed OverlayDrawer | Read source props, established shim behavior, target exports and comparable usage; do not infer equivalent APIs or geometry from names |
| Custom rendering and content structure | Inventory every `onRender*`, header/body/footer wrapper and inner control; map labels, heading semantics, actions and state to documented target composition |
| Geometry and scroll | Compare width rules, padding, alignment, scroll owner, overflow and focus visibility in the same viewport/state; preserve usable content at zoom |
| Dismiss/animation lifecycle | Exercise every supported close route and animation completion; check focus entry, containment when required, Escape/keyboard operation and the actual restore destination |
| Portal/provider boundary | Trace rendered portal placement and relevant ancestor providers; verify target announcement/theme/focus prerequisites rather than assuming the old surface covers the new tree |
| Remaining V8 controls inside a new surface | Inventory their actual owners and compatibility needs; a V9 outer component does not convert inner V8 contracts. Assess supported inner replacements rather than leaving accidental mixtures |
| Alternative render branches | Compare the same route, fixture, viewport, flags and interaction state; identify the actual state setter and outer conditions needed to reach each branch before claiming it was checked |

For host theme/provider specifics use `sharepoint.verification.themes-and-host`.
For reusable test design use `common.verification.testing`. Include an exact
operation assertion for `document.activeElement`, role/name/state checks and
announcement verification; screenshots alone cannot show the keyboard or AT
contract. Unvisited branches and unobserved speech stay unverified. These rules
grant no execution authority and make no claim of current conformance.