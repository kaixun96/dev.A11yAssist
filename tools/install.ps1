[CmdletBinding()]
param(
    [ValidateSet('a11y-intake','a11y-resources','a11y-capture','a11y-validate','a11y-publish','agent-operations','a11y-workflow','a11y-knowledge','all')]
    [string]$Plugin = 'a11y-workflow',
    [switch]$Execute,
    [switch]$WithAgentOW
)
$ErrorActionPreference = 'Stop'
$names = if ($Plugin -eq 'all') {
    @('a11y-intake','a11y-resources','a11y-capture','a11y-validate','a11y-publish','agent-operations','a11y-workflow','a11y-knowledge')
} else { @($Plugin) }
$commands = ,@('plugin','marketplace','add','kaixun96/dev.A11yAssist')
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
if ($Plugin -eq 'a11y-knowledge') {
    Write-Output 'Restart Copilot before using /a11y-knowledge. No provider configuration is needed for read-only knowledge.'
} else {
    Write-Output 'Set A11Y_ASSIST_CONFIG to a private absolute config path, then restart Copilot before using new plugins.'
}
