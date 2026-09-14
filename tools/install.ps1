[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('a11y-intake','a11y-resources','a11y-capture','a11y-validate','a11y-publish','agent-operations','a11y-workflow','a11y-knowledge','a11y-bug-bash','a11y-setup','all')]
    [string]$Plugin,
    [switch]$Execute
)
$ErrorActionPreference = 'Stop'
$names = if ($Plugin -eq 'all') {
    @('a11y-intake','a11y-resources','a11y-capture','a11y-validate','a11y-publish','agent-operations','a11y-workflow','a11y-knowledge','a11y-bug-bash','a11y-setup')
} else { @($Plugin) }
$commands = ,@('plugin','marketplace','add','kaixun96/dev.A11yAssist')
foreach ($name in $names) { $commands += ,@('plugin','install',"$name@a11y-assist") }
foreach ($arguments in $commands) {
    if ($Execute) {
        & copilot @arguments
        if ($LASTEXITCODE -ne 0) { throw "Copilot plugin operation failed: $($arguments -join ' ')" }
    } else {
        Write-Output ('copilot ' + ($arguments -join ' '))
    }
}
Write-Output 'Restart Copilot as required and enable the registered knowledge MCP server. Node.js 22+ is required.'
Write-Output 'The catalog has ten plugins: seven execution plugins, the read-only ODSP a11y-knowledge plugin, a11y-bug-bash and a11y-setup. All ten reference the 32 current Common, Fluent and SharePoint entries.'
Write-Output 'Each plugin provides read-only knowledge without a peer knowledge plugin, providers or A11Y_ASSIST_CONFIG.'
Write-Output 'Knowledge tool calls use A11Y_ASSIST_KB_ROOT if set, else a validated repository KB, else shared user cache, else a pinned download from the published release origin.'
Write-Output 'Verified cached content works offline; normal use of a published release needs no manual KB setup.'
Write-Output 'Offline first use needs a compatible local KB via absolute A11Y_ASSIST_KB_ROOT. Invalid configured paths or cache tampering fail without repair.'
Write-Output 'A11Y_ASSIST_KB_CACHE_ROOT is an optional absolute cache override, not an installation requirement. Local build URLs may not yet be published.'
if ($Plugin -eq 'a11y-knowledge') {
    Write-Output 'Use /a11y-knowledge for current ODSP knowledge and read-only source review; no second plugin or execution configuration is needed.'
} elseif ($Plugin -eq 'a11y-bug-bash') {
    Write-Output 'Use /a11y-bug-bash with feature context and verification steps. Its own read-only knowledge MCP, internal knowledge review and setup check/planning need no execution configuration. Preparation requires separate host-change authorization. Live checks require existing authorized host browser/AT tools and owned resources; no operational MCP or browser is shipped. No automatic fixes or filing.'
} elseif ($Plugin -eq 'a11y-setup') {
    Write-Output 'Use /a11y-setup check on the actual Windows evaluator. This installs the plugin, not third-party dependencies. Its scoped native host script prepares only authorized dependencies with real host ownership; installation is not live readiness. Setup has read-only knowledge MCP, no operational MCP or provider configuration requirement.'
} elseif ($Plugin -eq 'a11y-validate') {
    Write-Output 'Evidence-file structural checking needs no provider configuration; independent behavior evaluation requires a separately authorized A11Y_ASSIST_CONFIG connection.'
} else {
    Write-Output 'For execution operations that require connections, separately set A11Y_ASSIST_CONFIG to a private absolute config path before restarting; knowledge access grants no execution authority.'
}
