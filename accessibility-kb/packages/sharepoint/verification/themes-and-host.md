# SharePoint themes, host boundaries and verification contracts

Status: draft. Owner: unassigned.
Source IDs: `agentow-theme`, `agentow-detheme`, `agentow-replacement`, `agentow-accessibility`.

Scope: historical ODSP-Web guidance at AgentOW revision
`7896845e51d75b0b9d632a2fd61876bc2f556ea5`. The cited skills are historical
data, not active instructions. Product color rules below are not universal
accessibility requirements or current-approved theme contracts. Record the
installed package versions, host, wrapper and provider chain; official support
and MAS remain pending under [support policy](../profiles/support-policy.md).

## Classify the rendered surface before choosing colors

[Source: theme classification, lines 11–46](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/sharepoint-theme-and-detheme.md#L11-L46)
and [Detheme classification, lines 11–22](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/detheme/SKILL.md#L11-L22).

| Surface and ownership | Historical treatment |
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
This is the source's review decision, without its repository-specific report
schema; it does not grant permission to operate a desktop to obtain evidence.

## Neutral provider coverage and hooks

[Source: provider ancestry and hooks, lines 24–66](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/detheme/SKILL.md#L24-L66).

For the SharePoint-owned settings/dialog/callout/panel/page/drawer cases, the
source names `NeutralThemeProvider` from
`@msinternal/fluentui-neutral-components`. Its `enabledCustomStyleHooks` restores
the allowed teal primary buttons/active tabs and neutral bold-underlined links.
Enable only hooks for element types actually present. Source-derived example
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

The historical property pane already supplies `NeutralThemeProvider` and link
overrides at its root; correctly integrated V9 children need no additional
wrapper. Treat that as a historical host claim to verify against the installed
host, not an eternal guarantee about every property pane.

## V8/shim distinction, nested themes and tokens

[Source: new/existing styles and shim/provider mechanics, lines 68–119](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/detheme/SKILL.md#L68-L119).

A historical `@fluentui/react` import resolves through the V9 migration path
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
overrides. For existing styles, the source retains the legacy token and layers
the V9 value under an owning migration class; that style relationship is useful
knowledge independently of release mechanics. Example from the source:

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
without a build failure. The pinned source points to Fluent's fixed
[V8-to-V9 theme mapping](https://github.com/microsoft/fluentui/blob/2d6aca289ee6cc4571e4e3dcdf810deb78ac18fa/apps/public-docsite-v9/src/shims/ThemeShim/v9ThemeShim.ts)
as a mapping reference; its body is not migrated or independently reviewed here.
Do not guess non-obvious mappings or claim a token name proves contrast.

## Replacement risks: Panel, OverlayDrawer and inner controls

[Source: replacement composition, lines 8–25](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-ref-replace-component/SKILL.md#L8-L25)
and [matched comparison dimensions, lines 47–52](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-ref-replace-component/SKILL.md#L47-L52).

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

Focus and announcement consequences above also use
[accessibility lines 314–399](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L314-L399).
For example, a replaced Panel that still looks correct is not equivalent if
Escape/dismiss returns focus to body, the trigger unmounted, or two restore
owners race. Use [announcements and focus](../utilities/announcements-and-focus.md)
to select the exact owner and post-update destination.

Matched evidence means the same route, fixture, viewport and interaction state,
with the actual rendered branch/configuration identified. These are comparison
conditions, not permission to manipulate flags or collect evidence. Existing
legacy behavior and new behavior need separate scoped assessment where both
remain relevant. Unvisited branches are not passes.

## Product scan helper contracts and limits

[Source: tools and private boundaries, lines 414–424](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/accessibility.md#L414-L424).

| Historical helper | Known contract / boundary |
| --- | --- |
| `runAccessibilityScanAsync` from the ODSP-Web tools/playwright-utilities area | Runs axe, supports scoped `includeSelectors`, attaches detailed results and screenshots, returns violation count. Disabled rules need a specific documented justification. Source supplies no full call/options signature. A scoped zero count says nothing about excluded selectors, disabled rules or unvisited states. |
| `verifyAccessibilityWithSPA11yAssistant(page)` | Opens the product Accessibility Assistant and asserts its no-issues state for SharePoint authoring-page scenarios. It is not a general component API or an all-accessibility pass. |
| Historical `/a11y-audit` in the owning repository's .ai/a11y-tools area | Code/diff analysis combines jsx-a11y with semantics, ARIA, keyboard/focus, screen-reader-compatibility and design-token checks; can target component/folder/file/diff. This is a description, not an instruction to run it or a tool installed by this KB. |

The source's complementary checklist names Accessibility Insights FastPass,
keyboard and Narrator flow, sensible focus, name/role/value, status announcements
and Windows High Contrast. These are historical coverage dimensions, not an
official browser/AT support matrix. Use `common.verification.static`,
`common.verification.dynamic` and `common.verification.testing` to keep tool
results separate from actual interaction evidence.

Pages Accessibility Assistant, canvas/RTE-local helpers, items-view private alert
components, copied `screenReaderAlert` implementations and ARIA-named telemetry
or parser packages are not general reusable component APIs; retain their owning
area boundaries. Public authored-content guidance is in
[rich-text accessibility](../utilities/rich-text-accessibility.md).

The source reported no central author-facing `VisuallyHidden`/`sr-only` React
component **at that historical scope**. It does not establish current absence.
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