# SharePoint themes, host boundaries and verification contracts

Status: draft. Owner: unassigned.
Active source status and entry bindings: [package metadata](../package.json).

Scope: ODSP-Web draft guidance. Product color rules below are not universal
accessibility requirements or current-approved theme contracts. Record the
installed package versions, host, wrapper and provider chain; official support
and MAS remain pending under [support policy](../profiles/support-policy.md).

## Classify the rendered surface before choosing colors

| Surface and ownership | Scoped theme treatment |
| --- | --- |
| Invoked from app chrome, such as app bar/suite-header settings or flyouts | SharePoint theme: predominantly neutral; SharePoint teal only on primary button and active tab; links neutral, bold and underlined. |
| SharePoint-owned full page, such as settings | Same SharePoint-owned treatment, not customer site colors. |
| Customer-content full page, focused on a specific site/content | Preserve customer theming. Running inside SharePoint alone does not justify Detheme. |
| Inline pane, such as property pane | Fully neutral, including primary buttons and active tabs. |
| Full-overlay drawer, such as settings, analytics, permissions or Change the look | Neutral surface, SharePoint teal primary buttons and active tabs. |

A name such as “panel” does not establish ownership/presentation. Trace opener,
host and rendered container across module boundaries. Inspect background/chrome,
primary actions, tabs and links in the rendered experience, including relevant
default, selected, hover, focus, disabled and high-contrast states. Tokens alone
or a screenshot of one state cannot prove the complete contract; shared visual
requirements remain in `common.topic.visual-accessibility`.

Record the surface classification, provider ancestry, token/styling decisions
and screenshots of the relevant rendered states together. If screenshots are
unavailable for a visible theme change, explicitly record an **evidence gap**:
the visual result remains unverified, not passed based on tokens or source alone.
This is a scoped review decision, not a required report schema; it does not
grant permission to operate a desktop to obtain evidence.

## Neutral provider coverage and hooks

For the SharePoint-owned settings/dialog/callout/panel/page/drawer cases, use
`NeutralThemeProvider` from
`@msinternal/fluentui-neutral-components`. Its `enabledCustomStyleHooks` restores
the allowed teal primary buttons/active tabs and neutral bold-underlined links.
Enable only hooks for element types actually present. Example
for a SharePoint-owned surface with Button, Tab and Link children:

```tsx
import { NeutralThemeProvider } from '@msinternal/fluentui-neutral-components';

<NeutralThemeProvider enabledCustomStyleHooks={{ button: true, link: true, tab: true }}>
  {surfaceContent}
</NeutralThemeProvider>
```

For Button-only content, the hook object is `{ button: true }`. This is not a
reason to apply those accent hooks to an inline pane. Trace callers, page/pane
roots, openers and hosts first: if an ancestor supplies the treatment **and all
needed hooks**, reuse it. If coverage is missing, correct the owning ancestor
when that is the shared scope; nest only for an intentional different/narrower
theme boundary. Do not add a redundant child provider for convenience.

The ODSP-Web property pane supplies `NeutralThemeProvider` and link overrides
at its root; verify that coverage against the installed host. Correctly integrated
V9 children need no additional wrapper when that coverage is present. Do not
assume every property pane has the same provider coverage.

## V8/shim distinction, nested themes and tokens

An `@fluentui/react` import resolves through the V9 migration path
only when **both** `enabledForFluentMigration: true` in the owning SPFx internal
bundling options and the matching component shim exist. One condition alone is
insufficient. An unshimmed V8 control needs `NeutralV8ThemeProvider` from
`@msinternal/fluentui-neutral-components`; a neutral V9 provider alone does not
establish V8 coverage. Keep `fluent.v8.component-contract` and
`fluent.v9.component-contract` distinct for focus and component behavior.

A nested `FluentProvider` using `getTheme()` or `createV9Theme(getTheme())`
reintroduces customer theme beneath neutral treatment. For that redundant case,
remove the theme-reapplying wrapper while retaining its children. Do not remove
every provider indiscriminately: verify context and intentional boundaries.

New neutral surfaces use V9 tokens rather than new `$ms-color-*` or local theme
overrides. For existing styles, retain the legacy token and layer the V9 value
under an owning migration class, independently of release mechanics. Example:

```scss
@import 'pkg:@fluentui/react-theme-sass/sass/tokens';

.ms-Example-text {
  color: $ms-color-neutralSecondary;

  .deThemeExample & {
    color: $colorNeutralForeground1;
  }
}
```

This illustrates token layering, **not** code to select or operate a Flight or
KillSwitch. Every SCSS file using V9 tokens needs the shown token import unless
shared variables already import it; a missing import can silently yield no value
without a build failure. Consult Fluent's V8-to-V9 theme mapping for token
correspondences. The mapping
implementation is not reproduced or independently reviewed here.
Do not guess non-obvious mappings or claim a token name proves contrast.

## Replacement risks: Panel, OverlayDrawer and inner controls

Do not infer replacement props or geometry from component names. Compare source
Panel props, established `PanelShim` behavior, current SPDS exports and nearby
production patterns. Materially different APIs need distinct composition rather
than a blind component-name substitution. Stable/LazyComponents import/dependency
matching is in [selection](../selection/components-and-utilities.md).

| Inventory before replacement | Regression risk and useful comparison |
| --- | --- |
| Every `onRender*` customization and header/body/footer wrapper | Lost heading/label structure, action order or custom content when translating slots; compare the actual rendered structure. |
| Width, padding, alignment, scroll owner, animation | Clipped content/actions/focus, competing scroll containers or post-animation focus loss; compare matched viewports/states. |
| Dismiss paths, focus owner, original trigger and fallback | Keyboard close or disappearing action may no longer restore logically. Include abrupt unmount and animation completion from the focus contract. |
| Portal/provider boundary | A visually similar overlay can have different theme or announcement context and focus ownership. Trace the actual host/root, not only the local JSX. |
| V8 controls inside the replacement | New outer Drawer does not make inner controls V9. Use SPDS-ready replacements where available and identify genuine retained V8/shim coverage explicitly. |
| Keyboard entry/navigation/close and source-specific behavior | Compare the actual source and replacement contract, not a screenshot-only appearance match. |

A replaced Panel that still looks correct is not equivalent if
Escape/dismiss returns focus to body, the trigger unmounted, or two restore
owners race. Use [announcements and focus](../utilities/announcements-and-focus.md)
to select the exact owner and post-update destination.

Matched evidence means the same route, fixture, viewport and interaction state,
with the actual rendered branch/configuration identified. These are comparison
conditions, not permission to manipulate flags or collect evidence. Existing
legacy behavior and new behavior need separate scoped assessment where both
remain relevant. Unvisited branches are not passes.

## Product scan helper contracts and limits

| ODSP-Web helper | Known contract / boundary |
| --- | --- |
| `runAccessibilityScanAsync` from the ODSP-Web tools/playwright-utilities area | Runs axe, supports scoped `includeSelectors`, attaches detailed results and screenshots, returns violation count. Disabled rules need a specific documented justification. This guidance supplies no full call/options signature. A scoped zero count says nothing about excluded selectors, disabled rules or unvisited states. |
| `verifyAccessibilityWithSPA11yAssistant(page)` | Opens the product Accessibility Assistant and asserts its no-issues state for SharePoint authoring-page scenarios. It is not a general component API or an all-accessibility pass. |
| `/a11y-audit` in the ODSP-Web .ai/a11y-tools area, where available | Code/diff analysis combines jsx-a11y with semantics, ARIA, keyboard/focus, screen-reader-compatibility and design-token checks; can target component/folder/file/diff. This is a description, not an instruction to run it or a tool installed by this KB. |

Complementary coverage includes Accessibility Insights FastPass,
keyboard and Narrator flow, sensible focus, name/role/value, status announcements
and Windows High Contrast. These are scoped coverage dimensions, not an
official browser/AT support matrix. Use `common.verification.static`,
`common.verification.dynamic` and `common.verification.testing` to keep tool
results separate from actual interaction evidence.

Pages Accessibility Assistant, canvas/RTE-local helpers, items-view private alert
components, copied `screenReaderAlert` implementations and ARIA-named telemetry
or parser packages are not general reusable component APIs; retain their owning
area boundaries. Public authored-content guidance is in
[rich-text accessibility](../utilities/rich-text-accessibility.md).

Check the installed host for an established author-facing `VisuallyHidden`/`sr-only`
React component; this draft does not establish its availability or absence.
Do not copy private/ad hoc hidden CSS: prefer native/SPDS semantics or shared
screen-reader alerts; for a genuinely screen-reader-only control, identify the
owning surface's established pattern and a real shared need before inventing a
cross-feature utility.

## Outcome boundaries

Record source-supported versus observed findings, affected state, actual owner
and residual unknowns. Screenshots, DOM and axe results do not prove complete AT
operation, conformance or support. No Flight/KillSwitch selection or execution,
dependency update, publication, provider/host operation or evidence collection
workflow is included or authorized. Runtime validation needs separate scope and
authorization; this entry is reusable read-only knowledge.