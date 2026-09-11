[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('a11y-intake','a11y-resources','a11y-capture','a11y-validate','a11y-publish','agent-operations','a11y-workflow','a11y-knowledge','a11y-knowledge-odsp','a11y-bug-bash','a11y-setup','all')]
    [string]$Plugin,
    [switch]$Execute,
    [switch]$WithAgentOW
)
$ErrorActionPreference = 'Stop'
$names = if ($Plugin -eq 'all') {
    @('a11y-intake','a11y-resources','a11y-capture','a11y-validate','a11y-publish','agent-operations','a11y-workflow','a11y-knowledge','a11y-bug-bash','a11y-setup')
} else { @($Plugin) }
$commands = ,@('plugin','marketplace','add','kaixun96/dev.A11yAssist')
if ($Plugin -eq 'a11y-knowledge-odsp') {
    Write-Warning 'Compatibility package: new users should install a11y-knowledge, which includes the ODSP submodule. Do not install both.'
}
if ($WithAgentOW) {
    $commands += ,@('plugin','marketplace','add','kaixun96/dev.AgentOW')
    $commands += ,@('plugin','install','agentow-copilot@agentOW')
}
foreach ($name in $names) { $commands += ,@('plugin','install',"$name@a11y-assist") }
foreach ($arguments in $commands) {
    if ($Execute) {
        & copilot @arguments
        if ($LASTEXITCODE -ne 0) { throw "Copilot plugin operation failed: $($arguments -join ' ')" }
    } else {
        Write-Output ('copilot ' + ($arguments -join ' '))
    }
}
if ($Plugin -in @('a11y-knowledge','a11y-knowledge-odsp')) {
    Write-Output "Restart Copilot before using /$Plugin. No provider configuration is needed for read-only knowledge."
    if ($Plugin -eq 'a11y-knowledge') {
        Write-Output 'The ODSP submodule is included and selected for relevant SPDS, Fluent or SharePoint questions; no second plugin is needed.'
    }
} elseif ($Plugin -eq 'a11y-bug-bash') {
    Write-Output 'Restart Copilot before using /a11y-bug-bash with feature context and verification steps. Knowledge review and setup check/planning are included; preparation requires separate authorization. Live checks require actual authorized browser/AT tools and owned resources.'
} elseif ($Plugin -eq 'a11y-setup') {
    Write-Output 'Restart Copilot before using /a11y-setup check on the actual Windows evaluator. This installs the plugin, not third-party dependencies. Prepare selected dependencies only with host-change authorization; no provider configuration or AgentOW is required.'
} elseif ($Plugin -eq 'a11y-validate') {
    Write-Output 'Restart Copilot. Evidence-file structural checking needs no provider configuration; live behavior evaluation requires A11Y_ASSIST_CONFIG.'
} else {
    Write-Output 'Set A11Y_ASSIST_CONFIG to a private absolute config path, then restart Copilot before using new plugins.'
}
