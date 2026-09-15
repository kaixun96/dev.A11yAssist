# SharePoint localization and formatting contracts

Status: draft. Owner: unassigned.
Source IDs: `agentow-localization`, `agentow-shared-utilities`.
Entry ID: `sharepoint.utilities.localization-and-formatting`.

Scope: historical ODSP-Web guidance at AgentOW revision
`7896845e51d75b0b9d632a2fd61876bc2f556ea5`; not current-approved localization
pipeline or formatter API documentation. General content, result and visual
principles belong to `common.topic.forms-and-content`,
`common.topic.dynamic-content` and `common.topic.visual-accessibility`.

## Resources include non-visible accessibility text

[Source: checklist, lines 1–19](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L1-L19)
and [translation units/metadata, lines 23–56](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L23-L56).

- Put visible text **and** tooltips, accessible names/descriptions, `aria-label`,
  screen-reader-only text, live messages and reachable fallbacks in `.resx`
  resources imported from the generated resource module. API data such as a user
  name is not itself a hard-coded UI string.
- Each translator comment describes where/how the resource appears and every
  placeholder's meaning. Arguments must match that meaning. Keep placeholders
  reorderable/unlocked: do not require `{Locked={0}}` or `{Locked="{0}"}`.
- Keep complete sentences and punctuation in one resource. “Created at {0} by”
  plus an appended author is incomplete; “Created at {0} by {1}” permits a
  translator to reorder both date and author.
- Whole-string approval locks and valid-character annotations must use the
  pipeline's machine-readable metadata. The source illustrates `{Locked}` for a
  whole-string approval marker, not for placeholder tokens. Uncertain approval
  warrants an approval question; missing lock metadata alone is not proof of a
  defect. No approval or tracking identifier is invented here.
- Prefer sentence casing except established terminology or inherited approved
  text. Consolidate identical resources only across a suitable shared ownership
  boundary; do not create cross-package dependencies solely for textual equality.

## Counts: sentence-level intervals, not word fragments

[Source: count rules, lines 12–13](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L12-L13)
and [count examples, lines 135–176](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L135-L176).

For a **numeric count** in UI or an announcement, use split, sentence-level
plural resources plus matching interval metadata and
`StringHelper.formatWithLocalizedCountValue`. Include zero, one and plural;
the source's English zero wording is plural. Do not apply English branching in
code to every locale. This source-derived resource example keeps each sentence
whole rather than supplying a separately translated “site/sites” argument:

```xml
<data name="SiteSelected" xml:space="preserve">
  <value>{0} sites selected||{0} site selected||{0} sites selected</value>
  <comment>{0} is the selected count and must match SiteSelectedInterval. Shown as selection status and used for the selection announcement.</comment>
</data>
<data name="SiteSelectedInterval" xml:space="preserve">
  <value>0||1||2-</value>
  <comment>Count intervals corresponding to the complete sentences in SiteSelected.</comment>
</data>
```

```ts
const selectionMessage = StringHelper.formatWithLocalizedCountValue(
  strings.SiteSelected,
  strings.SiteSelectedInterval,
  selectedCount
);
```

`StringHelper` and `strings` refer to the owning area's existing formatter and
generated resource imports; the reference does not specify an exact import
route for this symbol. Use `selectionMessage` through the **one** event owner
in [announcements and focus](announcements-and-focus.md), not an added duplicate
live region. Check zero, one and plural in tests plus the applicable locale.
For `{0} deleted` where `{0}` is a skill name/entity label, do **not** demand
count intervals merely because there is a placeholder.

## Complete lists, dates and ReactNode sentences

[Source: separators and ReactNode formatting, lines 58–133](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L58-L133)
and [formatter reuse, lines 178–186](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L178-L186).

Use `Intl.ListFormat` with the user's locale rather than `names.join(', ')`.
Keep the formatted list as one placeholder within a complete sentence:

```ts
const listFormatter = new Intl.ListFormat(userLocale, {
  style: 'long',
  type: 'conjunction'
});
const message = StringHelper.format(
  strings.ReplaceDialogDescription,
  listFormatter.format(conflictingFileNames)
);
```

This preserves locale-specific conjunctions and punctuation. `userLocale` is
the owning host's locale value, not an invented locale lookup API. Locale-aware
dates/times similarly use the site/user locale and locale skeletons; do not copy
fixed US order, separators, AM/PM or hour cycles from legacy UI. The source names
no date-helper signature.

When a placeholder is a React element, use a ReactNode-aware formatter rather
than appending JSX to a partially formatted string. For the complete resource
“Created at {0} by {1}” (translator comments explain date and author):

```tsx
StringHelper.formatToArray(
  strings.createdAt,
  date,
  <Link href={authorUrl}>{author}</Link>
)
```

Plain `StringHelper.format(strings.createdAt, date)` plus a space and Link
prevents complete-sentence reordering. For a resource “{0} - {1}”, the source's
rich-text example is:

```tsx
StringHelper.formatToArray(
  strings.nameAndDescription,
  name,
  renderRichText(description, { linkify: false })
)
```

`renderRichText` denotes the owning safe renderer, not a newly exported API.
Prefer established `@msinternal/utilities-strings`, `StringHelper` or `Text`
formatters when compatible; manual `.replace("{0}", value)` and local
interpolation are not equivalent reusable formatting contracts.

## Safe localized rich text, fallbacks and RTL

[Source: rich text and fallbacks, lines 188–210](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L188-L210)
and [RTL exception, line 18](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/localization-and-formatting.md#L18).

- Approved resource markup goes through the owning safe rich-text parser mapped
  to allowlisted elements such as `strong`, not `dangerouslySetInnerHTML`.
- Do not generate interactive links inside checkbox or radio labels. Disable
  linkification there while preserving noninteractive emphasis. `formatToArray`
  preserves ReactNode ordering; it does not by itself sanitize arbitrary markup.
- A fallback reachable in UI/AT is user-facing too: use
  `props.text || strings.fallbackStr`, not an English fallback literal.
- Physical-direction styles (`margin-left`, `right`, `border-left`) require
  logical properties or an RTL-aware mixin across CSS, Sass/Less, inline and
  CSS-in-JS paths. **Exception:** Fluent V8/V9 style APIs already auto-flip these
  properties. Do not report an RTL defect there unless code bypasses Fluent's
  styling path; do not assume unrelated inline CSS has that protection.

## Utility fit and coverage boundaries

[Source: shared capability fit, lines 27–69](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/shared-utility-reuse.md#L27-L69)
and [package map/formatting anti-patterns, lines 76–136](https://github.com/kaixun96/dev.AgentOW/blob/7896845e51d75b0b9d632a2fd61876bc2f556ea5/copilot/skills/ow-review/references/shared-utility-reuse.md#L76-L136).

Candidate areas include utilities-strings/resources, i18n-utilities and the
owning shared UI packages. Compare input/output, locale behavior, errors,
dependency/layering and representative callers, not just matching symbol names.
Keep structured extraction separate from presentation unless formatting is the
shared contract. See [selection](../selection/components-and-utilities.md).

Positive/negative checks should cover reordered placeholders, ReactNode
sentences, complete zero/one/plural messages, repeated result events, localized
fallbacks, disallowed interactive label links, and RTL paths both inside and
outside Fluent auto-flipping. These are test-design examples, not executed
checks. Exact formatter exports, metadata not supplied in the source and the
safe parser's complete allowlist remain installed-contract questions.