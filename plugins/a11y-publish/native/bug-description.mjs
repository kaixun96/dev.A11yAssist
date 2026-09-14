const html = value => String(value ?? '').replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const paragraph = (label, value) => `<p><strong>${html(label)}:</strong> ${html(value)}</p>`;
const list = values => `<ol>${values.map(value => `<li>${html(value)}</li>`).join('')}</ol>`;

export function bugDescription(draft, uploaded = []) {
  return [
    '<h2>Accessibility issue</h2>', paragraph('Impact', draft.impact),
    paragraph('Categories', draft.categories.join(', ')),
    '<h2>Environment</h2>',
    ...Object.entries(draft.environment).map(([key, value]) => paragraph(key, value)),
    '<h2>Reproduction</h2>',
    ...draft.scenarios.flatMap(scenario => [
      `<h3>${html(scenario.journey)} / ${html(scenario.state)}</h3>`,
      paragraph('Target', scenario.target), '<h4>Preconditions</h4>', list(scenario.preconditions),
      '<h4>Steps to reproduce</h4>', list(scenario.steps),
      paragraph('Expected', scenario.expected), paragraph('Actual', scenario.actual),
      paragraph('Repeatability', scenario.repeatability)
    ]),
    '<h2>Cause and uncertainty</h2>',
    paragraph(`Root cause (${draft.cause.status})`, draft.cause.explanation),
    '<p>Observed behavior is distinct from an inferred implementation cause. No WCAG certification is implied.</p>',
    '<h2>Evidence</h2>',
    ...draft.attachments.flatMap(attachment => {
      const remote = uploaded.find(item => item.name === attachment.name);
      return [
        remote ? `<p><a href="${html(remote.url)}">${html(attachment.name)}</a>: ${html(attachment.description)}</p>`
          : paragraph(attachment.name, attachment.description),
        paragraph('SHA-256', attachment.sha256),
        ...(attachment.transcript ? [paragraph('Relevant timestamps', attachment.timestamps),
          paragraph('Transcript / text alternative', attachment.transcript),
          '<p>Playback reviewed by the submitting caller; byte readback is checked separately.</p>'] : [])
      ];
    }),
    '<h2>Validation provenance</h2>',
    paragraph('Task / finding', `${draft.taskId} / ${draft.issueId}`),
    paragraph('Plan SHA-256', draft.planHash),
    paragraph('Evidence assessment', draft.validation.basis),
    paragraph('Filing correlation', draft.operationId)
  ].join('\n');
}
