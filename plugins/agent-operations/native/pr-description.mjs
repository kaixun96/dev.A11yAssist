// Adapted from kaixun96/dev.AgentOW@66eea66533e683492e148f44d361fdd7312c4908,
// ts/src/ow/tools/prDescriptionBudget.js. Microsoft Internal; see LICENSE at the repository or plugin root.
// Source attribution only; marker ownership belongs to A11yAssist.
export const ADO_PR_DESCRIPTION_MAX_LENGTH = 4000;
export const VISUAL_SECTION_START = "<!-- a11y-assist:visual-validation:start -->";
export const VISUAL_SECTION_END = "<!-- a11y-assist:visual-validation:end -->";

const DISPOSABLE_SECTION_PATTERN =
  /<!-- a11y-assist:disposable:start(?:\s+([^>]+?))?\s*-->[\s\S]*?<!-- a11y-assist:disposable:end -->\s*/gi;

function compactMarkdown(markdown) {
  return markdown
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function replaceVisualSection(existing, visualBlock) {
  const start = existing.indexOf(VISUAL_SECTION_START);
  const end = existing.indexOf(VISUAL_SECTION_END);
  if (start >= 0 && end >= start) {
    const suffixStart = end + VISUAL_SECTION_END.length;
    return {
      markdown: `${existing.slice(0, start)}${visualBlock}${existing.slice(suffixStart)}`,
      replaced: true,
    };
  }

  return {
    markdown: existing
      ? `${existing}\n\n${visualBlock}`
      : visualBlock,
    replaced: false,
  };
}

export function preparePrDescriptionUpdate(existing, visualMarkdown, maxLength = ADO_PR_DESCRIPTION_MAX_LENGTH) {
  if (!visualMarkdown.trim()) {
    return { description: compactMarkdown(existing), replacedVisualSection: false, prunedSections: [] };
  }

  const visualBlock =
    `${VISUAL_SECTION_START}\n${visualMarkdown.trim()}\n${VISUAL_SECTION_END}`;
  const replacement = replaceVisualSection(existing.trim(), visualBlock);
  let description = compactMarkdown(replacement.markdown);
  const prunedSections = [];

  if (description.length > maxLength) {
    description = compactMarkdown(
      description.replace(DISPOSABLE_SECTION_PATTERN, (_match, label) => {
        prunedSections.push(label?.trim() || "generated details");
        return "";
      }),
    );
  }

  if (description.length > maxLength) {
    throw new Error(
      `PR description would be ${description.length} characters after replacing visual evidence; ` +
      `Azure DevOps allows ${maxLength}. Mark low-value generated content with ` +
      `<!-- a11y-assist:disposable:start label --> ... <!-- a11y-assist:disposable:end --> or shorten it. ` +
      `Human-authored content and required visual evidence were preserved.`,
    );
  }

  return {
    description,
    replacedVisualSection: replacement.replaced,
    prunedSections,
  };
}
