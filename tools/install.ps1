[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('a11y-intake','a11y-resources','a11y-capture','a11y-validate','a11y-publish','agent-operations','a11y-workflow','a11y-knowledge','a11y-knowledge-odsp','all')]
    [string]$Plugin,
    [switch]$Execute,
    [switch]$WithAgentOW
)
$ErrorActionPreference = 'Stop'
$names = if ($Plugin -eq 'all') {
    @('a11y-intake','a11y-resources','a11y-capture','a11y-validate','a11y-publish','agent-operations','a11y-workflow','a11y-knowledge','a11y-knowledge-odsp')
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
if ($Plugin -in @('a11y-knowledge','a11y-knowledge-odsp')) {
    Write-Output "Restart Copilot before using /$Plugin. No provider configuration is needed for read-only knowledge."
} elseif ($Plugin -eq 'a11y-validate') {
    Write-Output 'Restart Copilot. Evidence-file structural checking needs no provider configuration; live behavior evaluation requires A11Y_ASSIST_CONFIG.'
} else {
    Write-Output 'Set A11Y_ASSIST_CONFIG to a private absolute config path, then restart Copilot before using new plugins.'
}
