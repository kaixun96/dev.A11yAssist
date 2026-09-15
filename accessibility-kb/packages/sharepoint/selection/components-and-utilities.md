# Select for the actual SharePoint host

Status: draft. Owner: unassigned.
Active source status and entry bindings: [package metadata](../package.json).

These are draft ODSP-Web rules, not current-approved API or support
claims. Record the host, exact installed versions and wrapper exports before
applying them elsewhere. Official SPDS/utility sources remain connection-pending.

## Component fit and host-scoped import order

Do not translate the noun “list” directly into an import. Compare data shape,
selection, sorting/filtering/grouping, editing, keyboard model, virtualization,
paging, drag, responsiveness and semantics. Compare the strongest two candidates
when both plausibly fit, against installed APIs and nearby production usage.

| Requirement | Selection and caller responsibility |
| --- | --- |
| Conventional interactive table: sortable columns, selection, stable row identity, grid navigation | Prefer SPDS `DataGrid`; use its column definitions, controlled sort/selection and selection cells. Do not rebuild these with header buttons, standalone checkboxes, `role="grid"` or bespoke arrow navigation. |
| Primarily presentational table | Prefer SPDS `Table` and preserve header/cell relationships. |
| Nonstandard rows, keyboard/selection semantics or composition unsupported by DataGrid | `Table` can fit; identify the actual capability gap and accept the extra interaction/ARIA responsibility, not just a visual preference. |
| Server sorting, paging, upload, drag zone, status or dialogs alongside a grid | These do not alone justify `Table`. Keep sibling workflows outside the grid; drive requests from controlled `DataGrid` state. |
| Narrow viewport/high zoom | Preserve relationships; a minimum grid width with horizontal scrolling can be better than collapsing columns. See `common.topic.visual-accessibility` for the scoped two-dimensional-content exception, not a blanket scrolling exemption. |

For ODSP-Web, use the highest supported layer that meets the need:

- Under the ODSP-Web **sp-client** source area, eager exported controls use
   `@msinternal/sharepoint-ui-react-stable-bundle`.
- Under **odsp-common**, use `@msinternal/sharepoint-ui-react-stable` and verify
   the corresponding non-bundle export route.
- Check `@msinternal/sharepoint-ui-react-stable/lib/LazyComponents` as well as
   stable exports before falling back. Check `Dialog`, `Checkbox`, their
   documented subcomponents and Drawer. These are export checks, not a promise every version exports
   every family there. The LazyComponents route belongs to the stable dependency,
   not merely the stable-bundle dependency.
- When both SPDS stable entries lack the needed component, behavior, slot, token
   or accessibility capability, choose either `@msinternal/sharepoint-ui-react`
   or Fluent V9 by supported semantic, accessibility and theme fit. Cite the gap.
   A small styling preference is not a gap. Custom HTML/CSS requires a real gap
   across SPDS, SharePoint UI and Fluent V9 and the full caller-owned contract.

This order is **ODSP-Web-scoped**, not a cross-product SPDS mandate. Keep V8
and V9 separate through `fluent.v8.component-contract`,
`fluent.v9.component-contract` and `fluent.selection.components-and-utilities`.
For native/framework/host responsibility use `common.implementation.component-contract`.

Within that host, do not import directly from `@fluentui/react-components` when
the required capability is available from SPDS stable or LazyComponents. Bypassing
that supported route is an **Important** finding in this scoped ODSP-Web review
guidance, not a MAS classification or current official product policy.
An exception needs the concrete capability gap in both SPDS entry points and the
chosen fallback's semantic, accessibility and theme fit; a styling preference or
unexamined export is not an exception.

## Route to a concrete contract

| Need | Entry and rule |
| --- | --- |
| SPDS wrapper, semantic child/slot selection | [SPDS contract](../spds/component-contract.md): underlying Fluent V9 behavior, no separate SPDS announcer. |
| Result not already announced; async collection or cross-view focus | [Announcements and focus](../utilities/announcements-and-focus.md): one mechanism per event/lifecycle; host-established `useAnnounce` or shared alert, component focus before page infrastructure. |
| Authored HTML/RTE checks | [Rich-text accessibility](../utilities/rich-text-accessibility.md): `@msinternal/sp-a11y-checker-util`, not a new local validator. |
| Drag/reorder interaction | [Drag and drop](../utilities/drag-and-drop.md): `@msinternal/sp-dragzone` keyboard/state protocol and localized strings. |
| Count, sentence, ReactNode, RTL | [Localization and formatting](../utilities/localization-and-formatting.md): complete resources and shared formatters. |
| Theme, shim, portal, replacement or scan coverage | [Themes and host verification](../verification/themes-and-host.md): classification, provider coverage and scan limitations. |

## Shared utility fit, not name matching

Search by capability and representative callers. For accessibility-related
formatting and shared UI, starting points include `@msinternal/utilities-strings`,
`@msinternal/utilities-resources`, `@msinternal/sp-component-utilities`,
`@msinternal/sp-client-shared`, `@msinternal/sharepoint-ui-react-utilities`,
`@msinternal/i18n-utilities`, `@msinternal/sp-fluentui-v9-utilities-bundle` and
`@msinternal/sp-fluentui-migration-utilities-bundle`. These are discovery targets,
not interchangeable imports or automatic dependency permissions.

Check input/output, failure and cancellation semantics, runtime, maturity,
ownership and layering. Exact fit favors reuse; a small gap belongs at the
stable shared owner only if it does not distort that API. No fit can justify a
local implementation. A pure pass-through should call the original unless it
adds a real contract or dependency seam. Compare defaults and edge cases of
copies, not just syntax; keep data extraction separate from presentation unless
presentation is the shared contract. Do not copy private alert/hidden CSS helpers.

The [support policy](../profiles/support-policy.md) remains pending official
inputs. None of these selection provisions authorizes tool, host or workflow operations.