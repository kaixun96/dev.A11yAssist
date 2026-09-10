# AgentOW integration profile

This directory preserves the existing AgentOW-specific documentation separately
from the generic static-accessibility knowledge.

- [Operational and project references](knowledge/README.md)
- [Import provenance and execution-topic routing](knowledge/index.json)

It is not another plugin or an automatic integration. Execution packages include
these references to retain their existing instructions. The independently
installable `a11y-knowledge` package excludes this entire directory.

AgentOW's original files and behavior remain untouched. Final dependency
switching and redundant-authoring cleanup are deferred until the complete
integration is ready.
