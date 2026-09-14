# Shared accessibility knowledge reference

This plugin does not bundle the current KB. [knowledge.json](knowledge.json)
pins exact package versions, the selected dependency-closed manifest SHA-256,
and the HTTPS distribution URL and artifact SHA-256.

## Automatic knowledge MCP

With Node.js 22+ and an MCP-enabled host, this plugin registers the read-only
tools a11y_publish_knowledge_list, a11y_publish_knowledge_search(query), and
a11y_publish_knowledge_read(id). A knowledge tool call automatically resolves and
lazily loads the pinned Common, Fluent and SharePoint KB; no user configuration,
extra knowledge plugin, provider or A11Y_ASSIST_CONFIG is required.
The repository reference helper is optional advanced host setup, not an install
prerequisite or a skill tool.

Resolution order is an optional absolute A11Y_ASSIST_KB_ROOT override, then a
validated repository plugins/<name> development layout, then the shared per-user
cache, then the pinned HTTPS download. An invalid configured root fails without
fallback. The cache defaults to LOCALAPPDATA/A11yAssist/knowledge on Windows or
homedir/.cache/a11y-assist/knowledge elsewhere; optional A11Y_ASSIST_KB_CACHE_ROOT
must be absolute. Cached artifacts are shared per user, not bundled per plugin.
The runtime verifies artifact integrity, the selected manifest, exact packages
and every file; it revalidates cache on every request. Tampering fails explicitly
and is never automatically repaired.

A valid local KB or cached artifact works offline. First uncached use without a
valid local KB needs network access and fails explicitly offline. The pinned
knowledge-distribution/ release artifact must be published at the reference's
fixed HTTPS origin; a local build does not publish it or establish availability.
Downloads send no user data, queries, source code or credentials to the server,
accept no caller URL or redirects, and are limited to 15 seconds and 8 MiB.

Read actual entries and cite their source status; search snippets are not full
rules and pending sources are explicit gaps, not authority. Knowledge tasks may
use registered read-only knowledge MCP tools and relevant source/reference reads,
never setup helpers, shells, tests, browsers, AT or providers. Knowledge access
grants no execution authority and does not bypass capability or workflow gates.
Refresh compatible pins and KB context at a safe point, never by live auto-reload.

All skill paths, including the internal bug-bash knowledge skill, resolve from
the top installed plugin root supplied by the host as `${PLUGIN_ROOT}`.
