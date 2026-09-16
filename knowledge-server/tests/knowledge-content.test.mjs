import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadKnowledgeBase, exportKnowledgeBase } from '../tools/knowledge-base.mjs';
import { createKnowledgeReference } from '../tools/knowledge-reference.mjs';
import { createKnowledgeHandler } from '../src/runtime/knowledge-mcp.mjs';
import { assertCurrentEntries, currentPackages } from './helpers/current-packages.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const server = join(repository, 'knowledge-server');
const kbRoot = join(repository, 'accessibility-kb');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const digest = value => createHash('sha256').update(value).digest('hex');
const compact = text => text.replace(/\s+/g, ' ');
const kb = await loadKnowledgeBase(kbRoot);
const body = id => {
  const entry = kb.entries.get(id);
  assert(entry, `Missing knowledge entry: ${id}`);
  return kb.files.get(`packages/${id.split('.')[0]}/${entry.path}`);
};
// Required coverage, not an exhaustive list of allowed utility entries.
const requiredUtilities = ['rich-text-accessibility', 'drag-and-drop', 'localization-and-formatting'];
// Published snapshots and raw hashes retained for existing consumers.
const retained = {
  '3ffdfda8c2bd81db6954516061fc9cabf092fe303308b598b033232c4fc17c92': '3818085a203606c63c05656f82f7174fc587c207d940c9e590b2bd09cbf19056',
  '6c3c852d70bd013788744d48190b08d1456c79321f18812bf4ecd52fa5c4012b': '49cfbb82b7783bd57b0a4537d2701f931090591e014dc39240b14b0e469326b0'
};

function row(text, label) {
  const matches = text.split(/\r?\n/).filter(line => line.startsWith(`| ${label} |`));
  assert.equal(matches.length, 1, `Expected one rule row: ${label}`);
  return matches[0].split('|').slice(2, -1).map(cell => cell.trim());
}

test('standalone KB files and descriptors are independent of AgentOW and export no provenance', () => {
  for (const [path, content] of kb.files) {
    assert.doesNotMatch(path, /agentow|7896845e51d75b0b9d632a2fd61876bc2f556ea5|provenance/i);
    assert.doesNotMatch(content, /agentow|7896845e51d75b0b9d632a2fd61876bc2f556ea5/i, path);
  }
  for (const pkg of currentPackages) {
    assert.doesNotMatch(JSON.stringify(pkg), /agentow|7896845e51d75b0b9d632a2fd61876bc2f556ea5/i);
    const exported = exportKnowledgeBase(kb, [pkg.id]);
    for (const path of [...exported.files.keys(), ...Object.keys(exported.manifest.hashes)]) {
      assert.doesNotMatch(path, /provenance/i, 'Maintainer history must not enter a standalone export');
    }
  }
});

test('standalone entries reference existing current sources without invented approval', () => {
  for (const pkg of currentPackages) {
    const sources = new Set(pkg.sources.map(source => source.id));
    assert.equal(sources.size, pkg.sources.length, `${pkg.id}: source IDs must be unique`);
    for (const source of pkg.sources) {
      assert(['connection-pending', 'review-pending'].includes(source.status), `${pkg.id}.${source.id}: no claimed source approval`);
      assert.notEqual(source.authority, 'historical-reference');
      if (pkg.id === 'common' && source.id === 'mas') {
        assert.equal(source.status, 'review-pending');
        assert.match(source.revision, /2026-09-16; per-record revisions/);
      } else assert.equal(source.revision, null, `${pkg.id}.${source.id}: no invented reviewed revision`);
      if (source.status === 'connection-pending') assert.equal(source.locator, null);
      else assert.match(source.locator, /^https:\/\//);
    }
    for (const entry of pkg.entries) {
      assert.equal(entry.status, 'draft', entry.id);
      assert.equal(entry.owner, 'unassigned', entry.id);
      assert.equal(entry.review, undefined, `${entry.id}: no invented review`);
      for (const id of entry.sourceIds) assert(sources.has(id), `${entry.id}: unknown current source ${id}`);
    }
  }
});

test('required utility contracts remain discoverable with version-closed package dependencies', () => {
  for (const pkg of currentPackages) {
    for (const [dependency, version] of Object.entries(pkg.dependencies)) {
      assert.equal(version, currentPackages.find(candidate => candidate.id === dependency).version);
    }
  }
  for (const name of requiredUtilities) {
    const id = `sharepoint.utilities.${name}`;
    const entry = kb.entries.get(id);
    assert(entry, `Missing required utility contract: ${id}`);
    assert.equal(entry.path, `utilities/${name}.md`);
    assert.equal(entry.kind, 'implementation-contract');
    for (const parent of ['sharepoint.overview', 'sharepoint.selection.components-and-utilities']) {
      assert(kb.entries.get(parent).relations.includes(entry.id), `${parent}: missing discovery relation`);
      assert(body(parent).includes(`utilities/${name}.md`), `${parent}: missing navigable utility link`);
    }
  }
  for (const [selected, closure] of [['common', ['common']], ['fluent', ['common', 'fluent']],
    ['sharepoint', ['common', 'fluent', 'sharepoint']]]) {
    assert.deepEqual([...kb.closure(selected)], closure);
    const exported = exportKnowledgeBase(kb, [selected]);
    assert.deepEqual(exported.manifest.packages, Object.fromEntries(closure.map(id => [id, kb.packages.get(id).version])));
    assert.deepEqual(Object.keys(exported.manifest.packages), closure);
  }
  assert.deepEqual(kb.packages.get('common').dependencies, {});
});

test('current publications are descriptor-bound and retain every original artifact append-only', async () => {
  const distribution = join(repository, 'knowledge-distribution');
  const index = await json(join(distribution, 'index.json'));
  const current = [['common'], ['sharepoint']].map(selected => createKnowledgeReference(kb, selected));
  const expectedMinimum = new Set([...Object.keys(retained), ...current.map(reference => reference.manifestSha256)]);
  // Later authoring may produce further retained pins: verify all bytes, not a
  // fragile total of two (or four), and never ignore unindexed artifacts.
  assert.deepEqual((await readdir(distribution)).sort(), ['index.json', ...Object.keys(index.artifacts).map(pin => `${pin}.json`)].sort());
  for (const pin of expectedMinimum) assert(Object.hasOwn(index.artifacts, pin), `Missing retained/current publication: ${pin}`);
  for (const [pin, hash] of Object.entries(index.artifacts)) {
    const bytes = await readFile(join(distribution, `${pin}.json`));
    assert.equal(digest(bytes), hash);
    assert.equal(digest(JSON.stringify(JSON.parse(bytes).manifest, null, 2) + '\n'), pin);
    if (Object.hasOwn(retained, pin)) assert.equal(hash, retained[pin], 'Historical artifact bytes must never change');
  }
  for (const reference of current) {
    assert.equal(index.artifacts[reference.manifestSha256], reference.distribution.sha256);
    const artifact = await json(join(distribution, `${reference.manifestSha256}.json`));
    for (const [id, version] of Object.entries(reference.packages)) {
      assert.equal(version, kb.packages.get(id).version);
      assert.deepEqual(JSON.parse(artifact.files[`packages/${id}/package.json`]), kb.packages.get(id));
    }
  }
  assert.deepEqual(await json(join(server, 'references/knowledge.json')), current[1]);
});

function verifyV8(text) {
  const value = compact(text);
  assert.match(value, /default `delayedRender` behavior, MessageBar inserts its content into an internal live region after a short delay/);
  assert.match(value, /does not specify a delay duration/);
  assert.match(value, /`error`, `blocked` and `severeWarning`.*alert role/);
  assert.match(value, /Do not add `Announced`, `ScreenReaderAlert`, a second live region/);
  assert.match(value, /Report a gap when the built-in announcement is disabled\/broken and no documented V8 replacement supplies it/);
  assert.match(value, /Neither `delayedRender=\{false\}` alone nor the absence of `Announced` alone proves an announcement defect/);
  const [positive, negative, check] = row(text, 'Default V8 error MessageBar appears after a failed operation');
  assert.match(positive, /Leave ownership with MessageBar; keep retry reachable/);
  assert.match(negative, /`Announced` with identical error text/);
  assert.match(check, /AT speaks the error once/);
  assert.match(value, /compatibility APIs, not universal V8 exports and not native V9 recommendations/);
}

function verifyV9(text) {
  const value = compact(text);
  assert.match(value, /require one `AriaLiveAnnouncer` high in the React tree, above every MessageBar/);
  assert.match(value, /Reuse the host's provider; do not add another/);
  assert.match(value, /Do not customize `politeness` unless an accessibility owner has confirmed/);
  assert.match(value, /Do not call `useAnnounce`, `ScreenReaderAlert` or another live-region utility for the same error\/warning/);
  assert.match(value, /In `MessageBarGroup`, each MessageBar must remain a direct child/);
  const [fix, wrong] = row(text, 'Error bar has intent but no ancestor announcer');
  assert.match(fix, /missing prerequisite at the application boundary/);
  assert.match(wrong, /`role="alert"` to MessageBarBody to compensate/);
  assert.match(value, /use `useAnnounce\(\)` in the subtree of the established `AriaLiveAnnouncer`/);
  assert.match(value, /`useTypingAnnounce\(\)` is only for its documented typing scenario/);
  assert.match(value, /`useRestoreFocusTarget`\/`useRestoreFocusSource` pairing/);
  assert.match(value, /supplies no hook signature\/ref wiring example/);
}

function verifyCollections(text) {
  const [visible, feedback, focus] = row(text, 'Explicit refresh to no change');
  assert.match(visible, /Honest.*up to date/);
  assert.match(feedback, /fresh meaningful no-change result is perceivable on repeated requests/);
  assert.match(focus, /Remain on the trigger\/current focus; no jump/);
  assert.match(row(text, 'Explicit refresh to updated')[1], /even if the total count is unchanged/);
  assert.match(row(text, 'Load more to appended')[1], /One localized summary.*not one announcement per new row/);
  assert.match(row(text, 'Load more to end')[2], /focused command disappears.*logical fallback/);
  assert.match(compact(text), /only the committed latest query supplies rows, count and feedback/);
  assert.match(compact(text), /Initial static content already discoverable through normal page reading need not announce/);
}

function verifyDynamic(text) {
  const value = compact(text);
  assert.match(value, /For a numbered-overlay before\/after comparison, require matching canonical URL, viewport, scale, scroll, target selector and target geometry/);
  assert.match(value, /requires the debug bar hidden and no dialogs; do not compare screenshots with different chrome\/dialog states as if they demonstrate a page regression/);
  assert.match(value, /For an intentionally changed geometry or dialog-specific task, define a separate matched scenario rather than silently relaxing the comparison/);
  assert.match(value, /Map every reported number's screen point to DOM\/UIA element bounds/);
  assert.match(value, /Exclude browser chrome, taskbar and other OS overlays from page findings/);
  assert.match(value, /A number on an actionable link, button or input is not itself an accessibility violation; this does not exempt that control from other naming or operation checks/);
  assert.match(value, /An unmapped number is \*\*INCONCLUSIVE\*\*, never a page defect/);
  assert.match(value, /overlay over the browser toolbar cannot prove the page has a wrongly interactive heading; a mapped non-actionable page target can be assessed against the actual task/);
  assert.match(value, /When evaluating an unattended NVDA\/Narrator recording, require validated duration, frame dimensions, image variance, audio RMS\/peak and an extracted frame showing visible focus/);
  assert.match(value, /Media must capture real screen-reader speech from a persistent audio endpoint and the composed Windows desktop/);
  assert.match(value, /An existing MP4, silent audio, static slideshow or browser-only capture is insufficient/);
  assert.match(value, /Quality metadata does not by itself prove the expected words or behavior: review the relevant segments/);
  assert.match(value, /Each applicable step must link its immutable recording and other required evidence; a video placed beside a report or mentioned only in prose does not cover steps/);
  assert.match(value, /Reproduction needs an actual observed failure of the requested expectation/);
  assert.match(value, /Verification compares the same approved scenario and baseline against the actual tested revision\/build, covers every requested step and demonstrates the original failure no longer occurs/);
  assert.match(value, /Missing, blocked, skipped, inconclusive or contradicted observations cannot be upgraded by a source diff or static scan/);
  assert.match(value, /Exact artifact schemas, hash validators and execution remain with the existing workflow/);
}

function verifySharePointAnnouncements(text) {
  const value = compact(text);
  assert.match(value, /Use `ReadAfterOtherContent` for routine changes; reserve `ReadImmediately` for urgent errors/);
  assert.match(value, /increment the \*\*component\*\* `indicator` for each new result event; do not treat equal text as the same event/);
  assert.match(value, /does not give a hook indicator parameter/);
  assert.match(row(text, 'Existing legacy assertive surface')[0], /`ScreenReader.alert\(id, message\)`.*always creates an assertive alert.*not for new routine sort\/load completion/);
  assert.match(row(text, 'Explicit refresh → updated / no change')[0], /Announce a meaningful outcome even when the count\/text repeats.*Keep focus stable/);
  assert.match(row(text, 'Last deselection removes selection-only UI')[0], /Keep focus on a still-mounted collection row. Only if focus was inside the disappearing toolbar/);
  assert.match(row(text, 'Toast action completes but toast remains')[0], /persistent toast target.*whole toast closes, restore to the operation trigger/);
  assert.match(value, /Assert `document.activeElement` after the exact keyboard-triggered operation, not merely that a target exists/);
  assert.match(value, /page\/canvas, cross-view transitions.*`A11yManager` `saveActiveElementAs` \/ `restoreFocus`/);
  assert.match(value, /legacy\/custom\/unmanaged DOM outside Tabster ownership/);
  assert.match(value, /For \*\*migration-layer\*\*, not native V9, panels\/modals.*`useRestoreFocusOnDismiss`, `ModalShim` and `FocusTrapZoneShim`/);
  assert.match(value, /This scoped ODSP-Web review guidance classifies a missing perceivable completion, replacement, append, sort\/filter, empty or error outcome as \*\*Important\*\*/);
  assert.match(value, /Use \*\*Minor\*\* only when the transition is already perceivable and the change improves wording or reduces redundant speech/);
  assert.match(value, /A visible spinner or changed rows do not lower the severity of a missing programmatic result/);
  assert.match(value, /keyboard-triggered removal\/replacement that leaves focus on body, a detached node, a non-interactive wrapper or an unrelated control without a documented accessible destination is \*\*Important\*\*/);
  assert.match(value, /\*\*Minor\*\* applies only if focus already reaches a logical, visible, enabled destination and the remaining detail is non-blocking/);
  assert.match(value, /“By design” alone does not justify lowering severity; require the interaction contract and focused test evidence/);
  assert.match(value, /These are draft review labels, not MAS classifications, current official product policy or a replacement for a product's rubric/);
}

function verifyRichText(text) {
  const value = compact(text);
  assert.match(value, /`@msinternal\/sp-a11y-checker-util` rather than new local validators/);
  assert.match(value, /public entry points `checkA11yForRte` and `runH1A11yChecks`/);
  assert.match(row(text, 'Heading structure')[0], /H1 and heading-before-H1 validation/);
  assert.match(row(text, 'Links')[0], /Empty-link checks.*no meaningful content versus meaningful linked text/);
  assert.match(row(text, 'Tables')[0], /Table-header checks.*missing header structure versus the corrected structure/);
  assert.match(row(text, 'Images')[0], /informative and decorative image intent rather than inferring quality from the mere presence/);
  assert.match(row(text, 'Contrast')[0], /Text, image and overlay contrast.*actual editor\/page background/);
  assert.match(value, /does \*\*not\*\* supply arguments, option types, return shapes, timing, thresholds or per-function check allocation/);
  assert.match(value, /does not establish a universal one-H1 rule/);
  assert.match(value, /A clean editor report cannot validate the surrounding dialog/);
}

function verifyDrag(text) {
  assert.match(compact(text), /`@msinternal\/sp-dragzone`.*`IDragZoneA11yStrings`/);
  assert.match(row(text, 'Begin')[0], /Enter or Space.*handle.*localized `moveStarted`/);
  assert.match(row(text, 'Move')[0], /Arrow keys.*rather than adding a parallel live region/);
  assert.match(row(text, 'Disallowed move')[0], /`moveNotAllowed`.*not only a visual indication/);
  assert.match(row(text, 'Cancel')[0], /Escape cancels.*`moveCancelled`.*focus return to the handle/);
  assert.match(row(text, 'Complete')[0], /`moveComplete`.*focus return to the handle.*completion key and public completion API are not specified here.*Do not invent Enter\/Space-to-drop/);
}

function verifyLocalization(text) {
  const value = compact(text);
  assert.match(value, /For a \*\*numeric count\*\*.*sentence-level plural resources plus matching interval metadata and `StringHelper.formatWithLocalizedCountValue`/);
  assert.match(value, /<value>\{0\} sites selected\|\|\{0\} site selected\|\|\{0\} sites selected<\/value>/);
  assert.match(value, /<value>0\|\|1\|\|2-<\/value>/);
  assert.match(value, /For `\{0\} deleted` where `\{0\}` is a skill name\/entity label, do \*\*not\*\* demand count intervals/);
  assert.match(value, /Use `Intl.ListFormat` with the user's locale rather than `names.join\(', '\)`/);
  assert.match(value, /StringHelper.formatToArray\( strings.createdAt, date, <Link href=\{authorUrl\}>\{author\}<\/Link> \)/);
  assert.match(value, /renderRichText\(description, \{ linkify: false \}\)/);
  assert.match(value, /Do not generate interactive links inside checkbox or radio labels/);
  assert.match(value, /`formatToArray` preserves ReactNode ordering; it does not by itself sanitize arbitrary markup/);
  assert.match(value, /\*\*Exception:\*\* Fluent V8\/V9 style APIs already auto-flip these properties. Do not report an RTL defect there unless code bypasses Fluent's styling path; do not assume unrelated inline CSS has that protection/);
}

function verifyHost(text) {
  assert.match(row(text, 'Customer-content full page, focused on a specific site/content')[0], /Preserve customer theming.*alone does not justify Detheme/);
  assert.match(row(text, 'Inline pane, such as property pane')[0], /Fully neutral, including primary buttons and active tabs/);
  assert.match(row(text, 'Full-overlay drawer, such as settings, analytics, permissions or Change the look')[0], /Neutral surface, SharePoint teal primary buttons and active tabs/);
  const value = compact(text);
  assert.match(value, /Record the surface classification, provider ancestry, token\/styling decisions and screenshots of the relevant rendered states together/);
  assert.match(value, /If screenshots are unavailable for a visible theme change, explicitly record an \*\*evidence gap\*\*: the visual result remains unverified, not passed based on tokens or source alone/);
  assert.match(value, /it does not grant permission to operate a desktop to obtain evidence/);
  assert.match(value, /ancestor supplies the treatment \*\*and all needed hooks\*\*, reuse it/);
  assert.match(value, /only when \*\*both\*\* `enabledForFluentMigration: true`.*matching component shim exist. One condition alone is insufficient/);
  assert.match(value, /unshimmed V8 control needs `NeutralV8ThemeProvider`.*neutral V9 provider alone does not establish V8 coverage/);
  assert.match(value, /`createV9Theme\(getTheme\(\)\)` reintroduces customer theme/);
  assert.match(row(text, '`runAccessibilityScanAsync` from the ODSP-Web tools/playwright-utilities area')[0], /Runs axe.*`includeSelectors`.*returns violation count.*no full call\/options signature.*zero count says nothing about excluded selectors, disabled rules or unvisited states/);
  assert.match(row(text, '`verifyAccessibilityWithSPA11yAssistant(page)`')[0], /SharePoint authoring-page scenarios.*not a general component API or an all-accessibility pass/);
  assert.match(value, /Check the installed host for an established author-facing `VisuallyHidden`\/`sr-only` React component; this draft does not establish its availability or absence/);
}

// These verify connected conditions, prescriptions, exceptions and negative
// cases within rule rows/paragraphs, not just the presence of API names.
const scenarios = [
  ['fluent.v8.component-contract', 'delayedRender', verifyV8],
  ['fluent.v9.component-contract', 'AriaLiveAnnouncer intent', verifyV9],
  ['common.topic.dynamic-content', 'refresh unchanged', verifyCollections],
  ['common.verification.dynamic', 'DOM/UIA audio RMS/peak', verifyDynamic],
  ['sharepoint.utilities.announcements-and-focus', 'indicator ReadImmediately', verifySharePointAnnouncements],
  ['sharepoint.utilities.rich-text-accessibility', 'checkA11yForRte', verifyRichText],
  ['sharepoint.utilities.drag-and-drop', 'IDragZoneA11yStrings', verifyDrag],
  ['sharepoint.utilities.localization-and-formatting', 'formatWithLocalizedCountValue', verifyLocalization],
  ['sharepoint.verification.themes-and-host', 'includeSelectors', verifyHost]
];
for (const [id, , verify] of scenarios) test(`knowledge content contract: ${id}`, () => verify(body(id)));

test('Common rendered-UI review requires impact evidence for exclusions and a matched heading outline', () => {
  const value = compact(body('common.topic.component-accessibility'));
  assert.match(value, /Apply this review to every added or changed rendered UI surface affecting interaction, semantics, assistive output or accessibility-relevant styling/);
  assert.match(value, /contrast\/forced colors, focus indicators, typography\/spacing, zoom\/reflow, overflow\/truncation, visibility, content order, targets, motion and state cues/);
  assert.match(value, /Include forms, transient surfaces, dynamic status and async collections even when the diff contains no explicit accessibility code/);
  assert.match(value, /Decorative-only spacing, radii or shadows are outside this trigger only with evidence that they cannot affect clipping, reflow, targets, focus, readability or semantics/);
  assert.match(value, /Check applicable WCAG 2\.1 A\/AA criteria and complete keyboard-only and screen-reader operation for affected UI/);
  assert.match(value, /Record not-applicable only with a diff-based explanation establishing no rendered UI, interaction or assistive-output impact/);
  assert.match(value, /Record runtime-dependent criteria as not verified until appropriate evidence exists; source inspection is not a conformance pass/);
  assert.match(value, /A current product may require a newer or additional standard; use `common.requirements.authority-and-applicability` to resolve that scope/);
  assert.match(value, /Before recommending or implementing a heading-level change, capture the complete live page\/dialog outline, target heading, nearest parent, relevant siblings, selected level and rationale/);
  assert.match(value, /Missing or ambiguous context makes that proposed change inconclusive: do not choose a level until the context is resolved/);
  assert.match(value, /After the change, recapture the same scenario and compare that outline, not only the edited element/);
  assert.match(value, /A component-only snapshot cannot establish page hierarchy/);
  assert.match(value, /a proposed H3 is justified by the actual H2 section parent, not by its font size; without that parent\/sibling evidence, defer the level decision/);
  assert.match(value, /without prescribing a repository artifact filename or a universal single-H1 rule/);
});

test('Common guidance retains semantic, localization, focus, review-miss and verification exceptions', () => {
  const semantics = body('common.topic.component-accessibility');
  assert.match(row(semantics, 'Presentation and hiding')[1], /`role="none"` or `role="presentation"`.*focusable control or required table\/list structure/);
  assert.match(compact(semantics), /Keep simple tabular data a table unless the experience actually requires a composite grid/);
  const forms = compact(body('common.topic.forms-and-content'));
  assert.match(forms, /Do not universalize English zero\/plural wording or a three-form interval set/);
  assert.match(forms, /placeholder holding an entity name.*not a numeric count and does not require plural intervals/);
  assert.match(forms, /checkbox or radio label should not acquire nested interactive links/);
  const visual = compact(body('common.topic.visual-accessibility'));
  assert.match(visual, /Do not apply “all boundaries\/states\/focus indicators at 3:1” as a universal rule/);
  assert.match(visual, /Inactive controls, incidental decoration, unmodified user-agent presentation.*exceptions/);
  assert.match(visual, /do not double-flip it.*inline\/raw-CSS override outside that pipeline is not protected/);
  const focus = body('common.topic.keyboard-focus');
  assert.match(row(focus, 'Last item deselected')[0], /Keep focus on a surviving row.*only if focus was inside the disappearing selection-only UI/);
  assert.match(row(focus, 'Loading/save/upload/background completion')[0], /Leave focus where the user has since placed it; convey status separately/);
  assert.match(compact(focus), /exact operation and asserting the post-update `document.activeElement`/);
  const analysis = body('common.analysis.root-cause');
  assert.match(row(analysis, 'Independently derived initial state')[0], /Rejected preload.*empty-state announcement flashes before refetch/);
  assert.match(row(analysis, 'Stale asynchronous work')[1], /Invalidate superseded\/unmounted-owner work.*current committed operation/);
  assert.match(row(analysis, 'Cancellation changes committed state')[1], /cancel\/no-op preserves committed data/);
  const reuse = body('common.implementation.component-contract');
  assert.match(row(reuse, 'No valid shared fit')[0], /justified local implementation with a complete accessibility contract and tests/);
  assert.match(compact(reuse), /late chunk steals focus after the user dismissed the surface/);
  assert.match(row(body('common.verification.static'), 'A test only checks that a row exists after deletion')[0], /focus retention not established/);
  assert.match(row(body('common.verification.dynamic'), 'A scoped scan finds no violations')[0], /in that scope and state/);
  assert.match(row(body('common.verification.design'), 'Collection lifecycle')[0], /visible, programmatic and focus outcomes/);
  const testing = compact(body('common.verification.testing'));
  assert.match(testing, /prop whose presence the receiver distinguishes from `undefined`/);
  assert.match(testing, /skips initialization or duplicates singleton context and breaks the interaction/);
  assert.match(testing, /announcement mock do not establish actual speech/);
});

test('Fluent/SPDS selection keeps host-scoped imports, controlled grid fit and compound boundaries', () => {
  const selection = body('sharepoint.selection.components-and-utilities');
  assert.match(row(selection, 'Conventional interactive table: sortable columns, selection, stable row identity, grid navigation')[0], /Prefer SPDS `DataGrid`.*controlled sort\/selection.*Do not rebuild/);
  assert.match(row(selection, 'Server sorting, paging, upload, drag zone, status or dialogs alongside a grid')[0], /do not alone justify `Table`.*controlled `DataGrid` state/);
  const value = compact(selection);
  assert.match(value, /\*\*sp-client\*\*.*`@msinternal\/sharepoint-ui-react-stable-bundle`/);
  assert.match(value, /\*\*odsp-common\*\*, use `@msinternal\/sharepoint-ui-react-stable`/);
  assert.match(value, /LazyComponents route belongs to the stable dependency, not merely the stable-bundle dependency/);
  assert.match(value, /\*\*ODSP-Web-scoped\*\*, not a cross-product SPDS mandate/);
  assert.match(value, /Within that host, do not import directly from `@fluentui\/react-components` when the required capability is available from SPDS stable or LazyComponents/);
  assert.match(value, /Bypassing that supported route is an \*\*Important\*\* finding in this scoped ODSP-Web review guidance, not a MAS classification or current official product policy/);
  assert.match(value, /An exception needs the concrete capability gap in both SPDS entry points and the chosen fallback's semantic, accessibility and theme fit; a styling preference or unexamined export is not an exception/);
  for (const id of ['fluent.selection.components-and-utilities', 'sharepoint.spds.component-contract']) {
    const contract = compact(body(id));
    assert.match(contract, /BreadcrumbItem > Menu > MenuTrigger > Button/);
    assert.match(contract, /behavioral override/);
    assert.match(contract, /\.fui-\*.*exception only.*supported APIs fail.*version.*upgrade revalidation/);
  }
  const spds = compact(body('sharepoint.spds.component-contract'));
  assert.match(spds, /Never invent a separate SPDS live region merely because the import is SPDS/);
  assert.match(spds, /Keep `MessageBar` directly under `MessageBarGroup`/);
  const duplicate = row(body('sharepoint.case.duplicate-announcement'), 'Two separate saves finish with identical text')[0];
  assert.match(duplicate, /distinct legitimate result events.*`indicator`.*global duplicate-text filtering loses the second outcome/);
});

test('public local MCP search and read reach concrete knowledge rules with current version citations, without network or execution', async () => {
  let fetches = 0;
  const handler = createKnowledgeHandler(server, 'a11y-kb', {
    env: { A11Y_ASSIST_KB_ROOT: kbRoot },
    fetchImpl: () => { fetches++; throw new Error('Local knowledge queries must never fetch'); }
  });
  const registered = await handler({ method: 'tools/list' });
  assert.deepEqual(registered.tools.map(tool => tool.name), ['list', 'search', 'read'].map(action => `a11y_kb_knowledge_${action}`));
  async function call(action, args) {
    const result = await handler({ method: 'tools/call', params: { name: `a11y_kb_knowledge_${action}`, arguments: args } });
    assert(!result.isError, JSON.stringify(result));
    const payload = JSON.parse(result.content[0].text);
    assert.equal(payload.origin, 'configured');
    assert.equal(payload.contentApprovalVerified, false);
    assert.equal(payload.independentBehaviorVerified, false);
    return payload;
  }
  const listed = await call('list', {});
  assertCurrentEntries(listed.entries);
  assert.deepEqual(listed.packages, Object.fromEntries(currentPackages.map(pkg => [pkg.id, pkg.version])));
  for (const [id, query, verify] of scenarios) {
    const searched = await call('search', { query });
    assert.equal(searched.fullEntryReadRequired, true);
    assert(searched.matches.some(entry => entry.id === id), `${query} must discover ${id} by concrete rule, not an ID-only query`);
    assert(searched.matches.every(entry => entry.excerpt.length <= 580));
    const result = await call('read', { id });
    const pkg = kb.packages.get(id.split('.')[0]);
    assert.equal(result.citation, `kb:${id}@${pkg.version}`);
    assert.equal(result.content, body(id));
    assert.equal(result.sha256, digest(result.content));
    assert.deepEqual(result.sources, pkg.sources.filter(source => kb.entries.get(id).sourceIds.includes(source.id)));
    verify(result.content); // Validate the full public response, never infer a rule from the excerpt.
  }
  assert.equal(fetches, 0);
});