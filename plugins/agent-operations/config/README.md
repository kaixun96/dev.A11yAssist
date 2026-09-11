# Private connection setup

Knowledge plugins require none of these files. Neither does the
`a11y_validate_evidence` file-checking tool.

For live operations, copy the appropriate template to a private location and
configure only the connections you are authorized to use:

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
