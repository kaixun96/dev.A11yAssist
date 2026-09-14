function demand(condition, message) { if (!condition) throw new Error(message); }

export async function readAdoWorkItem(configuration, input, options = {}) {
  const organization = new URL(configuration.organization);
  demand(organization.protocol === 'https:' && !organization.username && !organization.password &&
    !organization.search && !organization.hash, 'Expected an HTTPS ADO organization URL without credentials or query');
  demand(typeof configuration.project === 'string' && configuration.project.trim(), 'ADO project is required');
  demand(typeof configuration.authorization === 'string' && configuration.authorization.trim(),
    'An ephemeral ADO authorization header is required');
  demand(Number.isSafeInteger(input.itemId) && input.itemId > 0, 'Expected a positive work-item ID');
  const base = `${organization.href.replace(/\/$/, '')}/${encodeURIComponent(configuration.project)}/_apis/wit/workitems/${input.itemId}`;
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(120000)]) : AbortSignal.timeout(120000);
  const fetchImpl = options.fetchImpl ?? fetch;
  async function get(url) {
    const response = await fetchImpl(url, {
      headers: { Authorization: configuration.authorization }, signal, redirect: 'error'
    });
    demand(response.ok, `Read work item failed (HTTP ${response.status})`);
    return response.json();
  }
  const item = await get(`${base}?$expand=all&api-version=7.1`);
  demand(item.id === input.itemId && Number.isSafeInteger(item.rev) && item.fields &&
    typeof item.fields === 'object' && !Array.isArray(item.fields), 'Unexpected work-item identity or fields');
  demand(Array.isArray(item.relations ?? []), 'Invalid work-item relations');
  const comments = [];
  const seen = new Set();
  let token;
  do {
    const suffix = token ? `&continuationToken=${encodeURIComponent(token)}` : '';
    const page = await get(`${base}/comments?api-version=7.1-preview.4&$top=200&includeDeleted=true${suffix}`);
    demand(Array.isArray(page.comments), 'Missing comments collection; intake is incomplete');
    comments.push(...page.comments);
    token = page.continuationToken;
    if (token !== undefined && token !== null && token !== '') {
      demand(typeof token === 'string' && !seen.has(token) && seen.size < 100,
        'Invalid, repeated or excessive comment pagination; intake is incomplete');
      seen.add(token);
    }
  } while (token !== undefined && token !== null && token !== '');
  return {
    item, comments,
    attachments: (item.relations ?? []).filter(relation => relation.rel === 'AttachedFile'),
    scope: 'work-item-and-discussion-fetch',
    commentsInterpreted: false,
    attachmentBytesDownloaded: false,
    acceptanceDefined: false
  };
}
