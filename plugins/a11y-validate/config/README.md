# Private connection setup

Bundled portable knowledge requires none of these files, a provider or an MCP
server. Knowledge, Bug Bash and setup have no execution configuration requirement.
Neither does the `a11y_validate_evidence` file-checking tool. Bug Bash live page/AT
checks use already-authorized host tools and owned resources; installation supplies
no browser or MCP server. Setup uses its current scoped Windows host script and
dependency templates only with the applicable host authorization, without an MCP
server. Knowledge use does not require running setup.

For live operations, copy the appropriate template to a private location and
configure only the connections you are authorized to use:

For full workflows, configure `source` and `review` as named trusted providers.
A single Windows DevBox is a pool of size one with the same ownership and
evidence gates.

| Template | Use |
|---|---|
| [example.ado.json](example.ado.json) | Native ADO work-item retrieval or existing Draft PR attachments |
| [example.capability.json](example.capability.json) | One independent capability through a trusted provider |
| [example.cli.json](example.cli.json) | Optional full CLI workflow |
| [example.twin.json](example.twin.json) | Optional full Twin workflow |

The templates contain placeholders, not enabled services or ready-to-use
credentials. Keep filled-in files, state directories and credentials outside
this repository and outside the installed plugin.

Before starting Copilot, set the absolute path to the private configuration:

```powershell
$env:A11Y_ASSIST_CONFIG = 'C:\PrivateConfig\a11y-assist.json'
copilot
```

That path is an example, not a file installed by the plugin. Use your own path.
The configured provider executables and services must already exist and be
authorized and qualified for the requested operation. A successful configuration
check is not proof of live service, resource or assistive-technology readiness.

See [the provider protocol](../docs/PROVIDERS.md) and
[native connection requirements](../docs/NATIVE-CAPABILITIES.md).
