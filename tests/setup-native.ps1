param([string]$Source)
$ErrorActionPreference = 'Stop'
$tokens = $null
$parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile($Source, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count) { throw ($parseErrors | Out-String) }
foreach ($name in @('Resolve-Dependencies', 'Install-SafeDependencies')) {
    $function = $ast.Find({ param($node)
        $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq $name
    }, $true)
    if (-not $function) { throw "Missing function: $name" }
    Invoke-Expression $function.Extent.Text
}

# Load only the function under test, never the host script's action dispatcher.
$script:calls = [Collections.Generic.List[string]]::new()
function Get-ExistingPath { if ($script:installed) { 'nvda.exe' } }
function Get-CommandInfo { @{ available = $script:installed } }
function Get-Module { if ($script:installed) { @{ Version = '1' } } }
function Get-ChildItem { }
function Install-Module { $script:calls.Add('audio-module') }
function Invoke-WingetInstall {
    param($Id, [switch]$UserScope)
    $script:calls.Add($Id)
    if ($script:wingetFailure) { throw 'winget failed' }
}
function Set-NvdaSpeechViewer { $script:calls.Add('nvda-settings') }
function Get-PythonPath { if (-not $script:pythonMissing) { 'Invoke-FakePython' } }
function Test-PythonModule { param($Path, $Module) $script:installed }
function Invoke-FakePython {
    $script:calls.Add(($args -join ' '))
    $global:LASTEXITCODE = 0
    if ($args[0] -eq '-c') { $global:LASTEXITCODE = $script:browserCode }
    if ($args[1] -eq 'pip' -and $script:pipFailure) { $global:LASTEXITCODE = 7 }
    if ($args[1] -eq 'playwright' -and $script:browserFailure) { $global:LASTEXITCODE = 8 }
}
function Reset-Case {
    $script:calls.Clear()
    $script:installed = $false
    $script:pythonMissing = $false
    $script:pipFailure = $false
    $script:wingetFailure = $false
    $script:browserFailure = $false
    $script:browserCode = 10
}
function Assert-Calls { param([string[]]$Expected)
    if (($script:calls -join '|') -ne ($Expected -join '|')) {
        throw "Expected $($Expected -join '|'); received $($script:calls -join '|')"
    }
}
function Assert-Failure { param([scriptblock]$Action, [string]$Pattern)
    $caught = $false
    try { & $Action } catch {
        if ($_.Exception.Message -notmatch $Pattern) { throw }
        $caught = $true
    }
    if (-not $caught) { throw "Expected failure: $Pattern" }
}

Reset-Case
Install-SafeDependencies -Dependencies NVDA
Assert-Calls @('NVAccess.NVDA', 'nvda-settings')
Reset-Case
Install-SafeDependencies -Dependencies FFmpeg
Assert-Calls @('Gyan.FFmpeg')
Reset-Case
Install-SafeDependencies -Dependencies AudioDeviceCmdlets
Assert-Calls @('audio-module')
Reset-Case
Install-SafeDependencies -Dependencies MSS,PyAudioWPatch
Assert-Calls @('-m pip install --disable-pip-version-check mss PyAudioWPatch')
Reset-Case
Install-SafeDependencies -Dependencies Chromium
if ($script:calls.Count -ne 3 -or $script:calls[0] -ne '-m pip install --disable-pip-version-check playwright' -or
    $script:calls[2] -ne '-m playwright install chromium') { throw 'Chromium dependency closure failed' }
Reset-Case
$script:installed = $true
$script:browserCode = 0
Install-SafeDependencies -Dependencies Python,Playwright,Chromium
if ($script:calls.Count -ne 1 -or -not $script:calls[0].StartsWith('-c ')) { throw 'Installed browser was reinstalled' }
Reset-Case
$script:installed = $true
Install-SafeDependencies -Dependencies FFmpeg,AudioDeviceCmdlets,Python,MSS,PyAudioWPatch
Assert-Calls @()
Reset-Case
$script:pipFailure = $true
Assert-Failure { Install-SafeDependencies -Dependencies Chromium } 'Python dependency installation failed'
if ($script:calls.Count -ne 1) { throw 'Continued after pip failure' }
Reset-Case
$script:browserCode = 3
Assert-Failure { Install-SafeDependencies -Dependencies Chromium } 'browser detection failed'
if ($script:calls.Count -ne 2) { throw 'Installed after unknown browser detection failure' }
Reset-Case
$script:browserFailure = $true
Assert-Failure { Install-SafeDependencies -Dependencies Chromium } 'browser installation failed'
Reset-Case
$script:wingetFailure = $true
Assert-Failure { Install-SafeDependencies -Dependencies NVDA } 'winget failed'
Assert-Calls @('NVAccess.NVDA')
Reset-Case
$script:pythonMissing = $true
Assert-Failure { Install-SafeDependencies -Dependencies Python } 'python.exe was not found'
Assert-Calls @('Python.Python.3.12')

$parameter = $ast.ParamBlock.Parameters | Where-Object { $_.Name.VariablePath.UserPath -eq 'Dependency' }
$defaults = @($parameter.DefaultValue.SafeGetValue())
if (($defaults -join ',') -ne 'NVDA,FFmpeg,AudioDeviceCmdlets,Python,Playwright,Chromium,MSS,PyAudioWPatch') {
    throw 'Legacy default dependencies changed'
}
Write-Output 'Native dependency selection passed without host changes.'

$function = $ast.Find({ param($node)
    $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq 'Get-Capabilities'
}, $true)
Invoke-Expression $function.Extent.Text
$script:probeCalls = [Collections.Generic.List[string]]::new()
$script:blockFfmpeg = $true
function Get-ExistingPath { $script:probeCalls.Add('native-path'); return $null }
function Get-CommandInfo {
    param($Name)
    $script:probeCalls.Add("command:$Name")
    if ($Name -eq 'ffmpeg.exe' -and $script:blockFfmpeg) { throw 'Unrelated FFmpeg access denied' }
    return @{ available = $true; path = 'unit-placeholder'; version = 'unit' }
}
function Get-PythonPath { return 'unit-python-not-executed' }
function Test-PythonModule { param($Path, $Module) $script:probeCalls.Add("python:$Module"); return $true }
function Get-AudioEndpoints { $script:probeCalls.Add('audio'); return @() }
function Get-PersistedAudioEndpoints { $script:probeCalls.Add('audio-registry'); return @() }
function Get-DefaultRecordingEndpoint { $script:probeCalls.Add('audio-default'); return $null }
function Get-Module { $script:probeCalls.Add('audio-module'); return $null }
function Get-ChildItem { $script:probeCalls.Add('module-directory'); return @() }
function Get-NvdaSpeechViewerState { $script:probeCalls.Add('nvda-settings'); return @{ configured = $true } }
function Get-PersonalEvaluatorState {
    $script:probeCalls.Add('personal-browser')
    return @{ installed = $false; profileExists = $false; authenticated = $false }
}
function Get-VoiceAccessState {
    $script:probeCalls.Add('voice-access')
    return @{ available = $false; languageModel = 'unit'; microphoneReady = $false }
}
function Get-SessionType { $script:probeCalls.Add('session'); return 'RDP' }
function Get-ConsoleTransferState { $script:probeCalls.Add('console-task'); return @{ installed = $false } }

$browser = Get-Capabilities -Dependencies Chromium
if ((Compare-Object @($browser.probeScope.dependencies | Sort-Object) @('Chromium', 'Playwright', 'Python')) -or
    -not $browser.prerequisites.python.playwright -or $browser.prerequisites.python.mss -or
    $browser.prerequisites.ffmpeg.assessment -ne 'not-requested' -or
    'FFmpeg' -notin $browser.probeScope.unrequestedDependencies) { throw 'Browser scope metadata is incorrect' }
if (@($script:probeCalls | Where-Object { $_ -match '^(command:|audio|module-|nvda|voice|console)' }).Count) {
    throw "Browser-only probe inspected unrelated dependencies: $($script:probeCalls -join ',')"
}
$script:probeCalls.Clear()
$nvda = Get-Capabilities -Dependencies NVDA
if ('nvda-settings' -notin $script:probeCalls -or
    @($script:probeCalls | Where-Object { $_ -match '^(command:|audio|module-|python:|personal|voice|console)' }).Count) {
    throw 'NVDA-only probe inspected unrelated dependencies'
}
Assert-Failure { Get-Capabilities -Dependencies FFmpeg | Out-Null } 'FFmpeg access denied'
Assert-Failure { Get-Capabilities | Out-Null } 'FFmpeg access denied'
$script:probeCalls.Clear()
$script:blockFfmpeg = $false
$full = Get-Capabilities
if ($full.probeScope.dependencies.Count -ne 8 -or $full.probeScope.unrequestedDependencies.Count -ne 0 -or
    @($script:probeCalls | Where-Object { $_ -like 'command:*' }).Count -ne 3 -or
    $null -eq $full.prerequisites.vbCable.currentSessionEndpoints) { throw 'Legacy full inventory changed' }
Write-Output 'Scoped inventory passed without host changes; requested failures remain visible.'
