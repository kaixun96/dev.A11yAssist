# Common widget patterns for static review

Read only when the supplied code implements or changes one of these widgets.
These checks concern source-visible contracts, not observed UI behavior. Follow
[the output contract](foundations.md#output-contract) and report unknown
component behavior as context needed.

Start with the native element or the project's documented component. The
examples below illustrate individual contracts; they are not complete custom
widget implementations. Do not replace a mature component with handwritten ARIA
or require business code to repeat its built-in keyboard/focus behavior.

APG patterns are supporting design guidance, not independent WCAG requirements.
A pattern difference is a finding only when the source establishes a concrete
accessibility problem. Orientation, activation strategy, selection model,
disabled items, virtualization and platform conventions can change the details.

## Tabs

**Trigger and context:** A tablist changes the panel displayed in the same
view. Read the tab component, selection state, panel rendering and keyboard
strategy. Navigation links to separate pages are not automatically tabs.

**Inspect:**

- The active tab exposes selection; each tab identifies the correct panel and
  each panel has a meaningful name, commonly from its tab. IDs and references
  must remain consistent through reordering or repeated instances.
- Inactive panels do not leave hidden interactive descendants reachable.
  Distinguish actual hiding/inertness from a merely offscreen visual transform.
- The composite supplies a coherent Tab entry and arrow model appropriate to
  orientation: web tabs normally use Left/Right horizontally and Up/Down
  vertically. Tab enters/exits the composite rather than requiring a stop on
  every tab. In manual activation, arrows may move focus without changing
  selection; Enter/Space activates. Automatic activation is also valid when
  suitable. Do not demand that every arrow press immediately select a tab.
- Removing the selected tab has a defined surviving selection and focus path.
  Inspect library ownership before suggesting imperative focus code.

**Defect example:** A complete renderer switches the visible panel using
`selectedId`, but hard-codes `aria-selected="true"` on the first tab. Once another
tab is selected, the exposed state contradicts the source-controlled panel.

**Valid counterexample:** A documented Tabs component accepts a selected value,
links tabs/panels and owns roving focus. Its caller supplies no arrow handler and
no hand-written `aria-selected`; that absence is not a defect.

**Minimal correction:** Bind state/relationships at their current owner or use
the component's documented selection API. Do not add a second roving-focus owner.

Reference: [APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

## Dialogs and non-modal popovers

**Trigger and context:** UI opens/closes a dialog or a transient popover. First
establish whether it is modal, how it opens, who owns focus, and where the trigger
and any fallback destination live.

**Inspect:**

- A dialog has a useful name. Opening establishes a sensible initial focus
  destination; closing returns to the trigger or another logical persistent
  control when the trigger no longer exists.
- Modal behavior makes background interaction unavailable and provides an
  operable dismissal path appropriate to the platform. `aria-modal="true"` alone
  provides neither focus containment nor input blocking.
- Do not require a focus trap in every non-modal popover. For Escape, inspect the
  actual component contract, nested overlays and available dismissal actions;
  absence of an Escape handler alone is not proof of a keyboard trap.
- Native dialog invocation matters: `showModal()` and a dialog merely given the
  `open` attribute do not establish the same modal behavior.

**Defect example:** A custom div declares a named `role="dialog"` with
`aria-modal="true"`, but its complete implementation only toggles visibility and
leaves background controls operable with no containment strategy.

**Valid counterexample:**

```html
<dialog id="confirmation" aria-labelledby="confirmation-title">
  <h2 id="confirmation-title">Confirm change</h2>
  <form method="dialog"><button type="submit">Cancel</button></form>
</dialog>
```

If the surrounding source invokes `showModal()`, native dialog behavior already
owns much of the focus/modal interaction. Do not flag missing custom Tab/Escape
handlers. Still inspect the opener, dynamic focus destination and close flow.

**Minimal correction:** Use the existing dialog/modal API or fix its focus and
background-interaction owner. Do not add a competing global key listener.

Reference: [APG Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## Comboboxes and selection fields

**Trigger and context:** A field edits or chooses a value through a popup.
Establish editable versus select-only behavior, the popup type, filtering and
selection state, and the component's focus model. Not every input with
suggestions requires a custom combobox implementation.

**Inspect:**

- The field has a label; the accessible value and expanded state follow the
  actual committed value and popup visibility.
- For an ARIA combobox, the controlled popup reference resolves to its actual
  popup when present. A listbox popup has appropriate options and selection
  state; other supported popup types need their own corresponding semantics.
- If DOM focus stays on the input and `aria-activedescendant` is used, it names a
  current valid item within the permitted ownership/controlled-popup relation.
  Filtering or virtualization must not leave a reference to a removed item.
- Preserve text-editing, composition and caret keys. Distinguish the highlighted
  suggestion from the committed value; dismissal need not commit the highlight.
- A dialog popup moves focus into the dialog rather than representing that
  dialog's focus using `aria-activedescendant`. Do not impose the listbox model
  on every popup.

**Defect example:** Filtering removes `option-7`, but the input keeps
`aria-activedescendant="option-7"` with no other element supplying that ID.
The active-item relationship no longer resolves.

**Valid counterexample:**

```html
<label for="country">Country</label>
<select id="country" name="country">
  <option value="ca">Canada</option>
  <option value="jp">Japan</option>
</select>
```

For this native selection field, do not require custom listbox markup,
`aria-expanded`, `aria-activedescendant`, or application arrow-key handlers.

**Minimal correction:** Clear or update the active reference as the filtered
items change, keeping it separate from the selected value. Reuse the library's
active-option API if it already owns that relationship.

Reference: [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

## Menus and menu buttons

**Trigger and context:** A trigger opens a command menu. Inspect the trigger,
popup, item types, navigation handlers and closing behavior. A set of navigation
links or a disclosure is not necessarily an ARIA menu.

**Inspect:**

- A menu button names its action, advertises the popup type, and updates its
  expanded state as the popup opens/closes.
- A custom ARIA menu contains the appropriate menu-item roles, not just styled
  divs. Checkable/radio items expose the source-controlled checked state.
- The implementation provides entry, item navigation, activation and exit.
  A web command menu normally opens from Enter/Space on its trigger, uses
  Up/Down between items and Enter to activate, and returns from Escape to its
  trigger (or from a submenu to its parent). Menubars additionally have a
  horizontal navigation model; do not apply it to every standalone menu.
  Account for disabled-item and submenu conventions instead of requiring every
  child to be independently tabbable.
- Open/close and submenu transitions preserve a meaningful focus destination.
  Inspect existing component behavior before adding document-wide handlers.

**Defect example:** A `role="menu"` contains only click-handled plain divs, with
no menuitem semantics or native/delegated keyboard operation in the supplied
implementation. Adding `role="menu"` to the container does not fix its children.

**Valid counterexample:**

```html
<details>
  <summary>Related pages</summary>
  <nav aria-label="Related pages"><a href="/help">Help</a></nav>
</details>
```

This native disclosure with ordinary navigation links is not an ARIA command
menu. Do not require menuitem roles or an arrow-only focus strategy.

**Minimal correction:** Use a documented Menu/MenuButton component for command
menu behavior, or keep ordinary link/disclosure semantics for ordinary
navigation. Choose based on intent, not visual resemblance.

References: [APG Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/),
[APG Menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).

## Trees

**Trigger and context:** Hierarchical interactive navigation or selection uses a
tree. Inspect the node data model, expansion, active item, selection mode and
rendered/virtualized node ownership. A nested content list is not inherently a
tree widget.

**Inspect:**

- Treeitems expose their hierarchy and expansion where they have children;
  leaves should not claim to be collapsed parents. Selection and focus are
  distinct, especially in multi-selection trees.
- Parent/child movement, traversal and activation follow the chosen platform or
  component model. In the usual web tree model, Up/Down visits visible nodes;
  Right expands a closed parent or enters its children; Left collapses an open
  parent or returns to its parent. Leaves do not expand. Do not infer that
  arrows select or toggle a checkbox unless
  the chosen model says so.
- Collapsing or removing an ancestor of the active item has a valid surviving
  focus destination. Virtualization must preserve valid active references and
  accurate hierarchy metadata when the DOM cannot supply it.
- Lazy loading, empty children and errors must not leave permanently stale
  expanded/busy states or an active reference to an unmounted node.

**Defect example:** Collapsing a parent unmounts its focused child while keeping
that child's ID in `aria-activedescendant`. The source has no active-node update.

**Valid counterexample:** A documented Tree component receives stable item IDs
and controlled expanded/selected sets, and owns arrows and active-node fallback.
Do not require its caller to assign every treeitem a positive tab index.

**Minimal correction:** Update the active item to the surviving parent (or the
documented logical fallback) at the same state transition, through the existing
tree controller. Never add hierarchy metadata guessed from array indexes.

Reference: [APG Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/).

## Grids and data tables

**Trigger and context:** Tabular data or an interactive grid changes. Determine
whether users only read tabular content or navigate/edit through a composite
grid. Inspect cell editing, selection, sorting and virtualization contracts.

**Inspect:**

- A data table preserves appropriate header associations; it does not need
  `role="grid"` or cell arrow handlers merely because some cells contain links.
- A grid has the appropriate row/cell/header relationships and an operable
  navigation strategy, normally using arrows between cells in navigation mode
  instead of adding every cell to the page's Tab order. If editing uses arrows
  for caret movement, distinguish
  navigation mode from editing and provide the documented entry/exit behavior.
- Sorting exposes the actual sort state on the relevant header when applicable;
  it does not silently detach the active item or move focus to unrelated data.
- With virtualized rows, maintain stable identities and valid active references.
  If explicit row counts/indexes are needed because the DOM lacks the full
  structure, ensure they reflect the data and supported unknown-count semantics,
  not a fabricated total or the viewport's zero-based array positions.

**Defect example:** A grid's cell-level ArrowLeft handler always calls
`preventDefault()` even when the event comes from the active text editor, with
no editing-mode alternative. The intended caret movement is swallowed.

**Valid counterexample:**

```html
<table>
  <caption>Invoices</caption>
  <thead><tr><th scope="col">Invoice</th><th scope="col">Amount</th></tr></thead>
  <tbody><tr><th scope="row"><a href="/invoice/42">42</a></th><td>$10</td></tr></tbody>
</table>
```

This ordinary table with a link does not need a grid role, roving tabindex or
extra focusable cells. A documented interactive Grid component may instead own
those responsibilities internally; inspect that contract before reporting gaps.

**Minimal correction:** Use table semantics for a table, or fix the grid's
existing mode/active-cell controller. Exclude editor caret events from grid
navigation where the documented editing model requires it.

References: [APG Grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/),
[APG Table](https://www.w3.org/WAI/ARIA/apg/patterns/table/).
