[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$PolicyPath,
    [Parameter(Mandatory)][string]$RequestPath,
    [Parameter(Mandatory)][string]$OutputDirectory
)
$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
if ([Environment]::OSVersion.Platform -ne 'Win32NT' -or $env:CODESPACES -eq 'true' -or $env:CODESPACE_NAME) {
    throw 'Real AT observation requires the owned interactive Windows evaluator.'
}
$policy = Get-Content -LiteralPath $PolicyPath -Encoding UTF8 -Raw | ConvertFrom-Json
$request = Get-Content -LiteralPath $RequestPath -Encoding UTF8 -Raw | ConvertFrom-Json
if ($policy.schemaVersion -ne 1 -or $request.schemaVersion -ne 1 -or
    $request.at -notin @('nvda', 'narrator', 'voice-access') -or
    $request.nativeRunId -cnotmatch '^[a-f0-9]{32}$' -or
    $request.operationId -cnotmatch '^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$' -or
    $policy.machineId -cnotmatch '^[a-zA-Z0-9][a-zA-Z0-9._-]{2,62}$' -or
    $env:COMPUTERNAME -ine $policy.computerName -or
    $request.evaluator -cne $policy.machineId) {
    throw 'AT request, evaluator or actual Windows host does not match.'
}
$output = [IO.Path]::GetFullPath($OutputDirectory)
if (Test-Path -LiteralPath $output) { throw 'Native output already exists; reconcile it, never repeat keys or speech.' }
$null = New-Item -ItemType Directory -Path $output
$reportPath = Join-Path $output 'report.json'
$report = [ordered]@{
    schemaVersion = 1; operationId = $request.operationId; nativeRunId = $request.nativeRunId
    at = $request.at; state = 'prepared'; startedAt = [DateTimeOffset]::UtcNow.ToString('o')
    policySha256 = (Get-FileHash -LiteralPath $PolicyPath -Algorithm SHA256).Hash.ToLowerInvariant()
    requestSha256 = (Get-FileHash -LiteralPath $RequestPath -Algorithm SHA256).Hash.ToLowerInvariant()
    driverSha256 = (Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant()
    preflightVerified = $false; postcheckVerified = $false; ownedCleanupVerified = $false
    behaviorVerdict = 'not-evaluated'; transcriptAvailable = $false; events = @()
    effects = @(); cleanupErrors = @(); errors = @()
    driverProcess = @{ pid = $PID; startedAt = (Get-Process -Id $PID).StartTime.ToUniversalTime().ToString('o') }
}
function Save-Report {
    $temporary = "$reportPath.tmp"
    [IO.File]::WriteAllText($temporary, ($report | ConvertTo-Json -Depth 24), [Text.UTF8Encoding]::new($false))
    Move-Item -LiteralPath $temporary -Destination $reportPath -Force
}
function Assert-PinnedFile($Entry) {
    if (-not $Entry -or -not [IO.Path]::IsPathRooted($Entry.path) -or
        $Entry.sha256 -cnotmatch '^[a-f0-9]{64}$' -or
        (Get-FileHash -LiteralPath $Entry.path -Algorithm SHA256).Hash.ToLowerInvariant() -cne $Entry.sha256) {
        throw 'Required operator-installed native dependency is missing or changed.'
    }
    function Assert-ShortWave([string]$Path) {
        if ((Get-Item -LiteralPath $Path).Length -gt 2097152) { throw 'Voice command recording exceeds 2 MiB.' }
        $bytes = [IO.File]::ReadAllBytes($Path)
        if ($bytes.Length -lt 44 -or [Text.Encoding]::ASCII.GetString($bytes, 0, 4) -cne 'RIFF' -or
            [Text.Encoding]::ASCII.GetString($bytes, 8, 4) -cne 'WAVE') { throw 'Expected a bounded PCM command WAV.' }
        $offset = 12; $bytesPerSecond = 0; $samples = 0
        while ($offset + 8 -le $bytes.Length) {
            $name = [Text.Encoding]::ASCII.GetString($bytes, $offset, 4)
            $size = [BitConverter]::ToUInt32($bytes, $offset + 4)
            if ([long]$offset + 8 + $size -gt $bytes.Length) { throw 'Malformed command WAV chunk.' }
            if ($name -ceq 'fmt ') {
                if ($size -lt 16 -or [BitConverter]::ToUInt16($bytes, $offset + 8) -ne 1) { throw 'Command audio must be PCM.' }
                $bytesPerSecond = [BitConverter]::ToUInt32($bytes, $offset + 16)
            }
            if ($name -ceq 'data') { $samples += $size }
            $offset += 8 + $size + ($size % 2)
        }
        if ($bytesPerSecond -le 0 -or $samples -le 0 -or $samples / $bytesPerSecond -gt 5) {
            throw 'Voice command must contain 0-5 seconds of reviewed PCM audio.'
        }
    }
}
function Assert-Authority {
    $lease = Get-Content -LiteralPath (Join-Path $policy.poolRoot "leases\$($policy.machineId).json") -Encoding UTF8 -Raw | ConvertFrom-Json
    $token = [Environment]::GetEnvironmentVariable($policy.executionTokenEnvironmentVariable)
    $subject = if ($lease.PSObject.Properties['taskId'] -and $lease.taskId) { "task:$($lease.taskId)" } else { $lease.bug }
    if (-not $token -or $lease.schemaVersion -ne 1 -or $lease.token -cne $token -or
        $lease.machineId -cne $request.evaluator -or $lease.runId -cne $request.nativeRunId -or
        $lease.owner -cne $request.owner -or $subject -cne $request.subject -or
        $lease.state -notin @('assigned', 'running') -or
        (Test-Path -LiteralPath (Join-Path $policy.poolRoot "evaluator-recovery-leases\$($policy.machineId).json"))) {
        throw 'Original execution lease, token, run or subject changed; no desktop action authorized.'
    }
    if ((Get-FileHash -LiteralPath $PolicyPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $report.policySha256 -or
        (Get-FileHash -LiteralPath $RequestPath -Algorithm SHA256).Hash.ToLowerInvariant() -cne $report.requestSha256) {
        throw 'Original native policy/request bytes changed.'
    }
}
function Get-BoundProcess($Identity, $Executable) {
    $process = Get-Process -Id ([int]$Identity.pid) -ErrorAction Stop
    if ($process.SessionId -ne (Get-Process -Id $PID).SessionId -or
        $process.StartTime.ToUniversalTime().Ticks -ne ([DateTimeOffset]::Parse($Identity.startedAt)).UtcDateTime.Ticks -or
        $process.Path -ine $Executable.path) {
        throw 'Borrowed process PID, start time, session or executable identity changed.'
    }
    Assert-PinnedFile $Executable
    return $process
}
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class A11yNativeInput {
    [DllImport("kernel32.dll")] public static extern uint WTSGetActiveConsoleSessionId();
    [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint pid);
    [StructLayout(LayoutKind.Sequential)] public struct KEYBDINPUT {
        public ushort vk; public ushort scan; public uint flags; public uint time; public UIntPtr extra;
    }
    [StructLayout(LayoutKind.Explicit)] public struct UNION {
        [FieldOffset(0)] public KEYBDINPUT keyboard;
        [FieldOffset(0)] public MOUSEINPUT mouse;
    }
    [StructLayout(LayoutKind.Sequential)] public struct MOUSEINPUT {
        public int x, y; public uint data, flags, time; public UIntPtr extra;
    }
    [StructLayout(LayoutKind.Sequential)] public struct INPUT { public uint type; public UNION value; }
    [DllImport("user32.dll", SetLastError=true)] static extern uint SendInput(uint count, INPUT[] inputs, int size);
    public static void Key(ushort key, bool shift) {
        INPUT[] inputs = new INPUT[shift ? 4 : 2];
        int i = 0;
        if (shift) inputs[i++] = Make(0x10, false);
        inputs[i++] = Make(key, false); inputs[i++] = Make(key, true);
        if (shift) inputs[i] = Make(0x10, true);
        uint sent = SendInput((uint)inputs.Length, inputs, Marshal.SizeOf(typeof(INPUT)));
        if (sent != inputs.Length) {
            if (sent > 0) {
                INPUT[] release = shift ? new INPUT[] { Make(key, true), Make(0x10, true) }
                                        : new INPUT[] { Make(key, true) };
                SendInput((uint)release.Length, release, Marshal.SizeOf(typeof(INPUT)));
            }
            throw new InvalidOperationException("Native key dispatch incomplete; do not replay");
        }
    }
    static INPUT Make(ushort key, bool up) {
        INPUT input = new INPUT(); input.type = 1; input.value.keyboard.vk = key;
        input.value.keyboard.flags = up ? 2u : 0u; return input;
    }
}
'@
$atExecutable = $policy.atExecutables.($request.at)
function Assert-Desktop {
    Assert-Authority
    if ([A11yNativeInput]::WTSGetActiveConsoleSessionId() -ne (Get-Process -Id $PID).SessionId) {
        throw 'AT observation requires the active physical console, not an RDP/headless session.'
    }
    $null = Get-BoundProcess $request.atProcess $atExecutable
    $browser = Get-BoundProcess $request.browserProcess $policy.browserExecutable
    $window = [A11yNativeInput]::GetForegroundWindow()
    [uint32]$windowPid = 0
    $null = [A11yNativeInput]::GetWindowThreadProcessId($window, [ref]$windowPid)
    $focus = [Windows.Automation.AutomationElement]::FocusedElement
    if ($window.ToInt64().ToString() -cne $request.browserWindowHandle -or
        $windowPid -ne $browser.Id -or -not $focus -or $focus.Current.ProcessId -ne $browser.Id) {
        throw 'Foreground HWND/PID or native UIA focus differs from the original browser; no focus repair or key dispatch.'
    }
}
function Get-AtWindows {
    $condition = [Windows.Automation.PropertyCondition]::new(
        [Windows.Automation.AutomationElement]::ProcessIdProperty, [int]$request.atProcess.pid)
    return [Windows.Automation.AutomationElement]::RootElement.FindAll(
        [Windows.Automation.TreeScope]::Children, $condition)
}
function Read-NvdaOutput {
    $windows = @(Get-AtWindows | Where-Object { $_.Current.Name -ceq $policy.nvdaSpeechViewerTitle })
    if ($windows.Count -ne 1) { throw 'One already-enabled NVDA Speech Viewer is required; do not toggle another session.' }
    $edits = $windows[0].FindAll([Windows.Automation.TreeScope]::Descendants,
        [Windows.Automation.PropertyCondition]::new([Windows.Automation.AutomationElement]::ControlTypeProperty,
            [Windows.Automation.ControlType]::Edit))
    if ($edits.Count -ne 1) { throw 'NVDA Speech Viewer text control is missing or ambiguous.' }
    $pattern = $null
    if ($edits[0].TryGetCurrentPattern([Windows.Automation.TextPattern]::Pattern, [ref]$pattern)) {
        return $pattern.DocumentRange.GetText(1048576)
    }
    if ($edits[0].TryGetCurrentPattern([Windows.Automation.ValuePattern]::Pattern, [ref]$pattern)) {
        return $pattern.Current.Value
    }
    throw 'NVDA Speech Viewer exposes neither native TextPattern nor ValuePattern.'
}
function Read-VoiceAccessOutput {
    $result = @()
    foreach ($window in Get-AtWindows) {
        $elements = $window.FindAll([Windows.Automation.TreeScope]::Subtree,
            [Windows.Automation.Condition]::TrueCondition)
        if ($elements.Count -gt 2000) { throw 'Voice Access UIA observation exceeds the bounded tree budget.' }
        foreach ($element in $elements) {
            $current = $element.Current
            if ($current.IsOffscreen -or -not $current.Name) { continue }
            $rect = $current.BoundingRectangle
            $result += [ordered]@{ name = $current.Name; controlType = $current.ControlType.ProgrammaticName
                runtimeId = @($element.GetRuntimeId()); pid = $current.ProcessId
                rectangle = @{ x = $rect.X; y = $rect.Y; width = $rect.Width; height = $rect.Height }
                attribution = 'unmapped-requires-independent-page-browser-OS-map' }
        }
    }
    if (-not $result.Count) { throw 'Voice Access returned no visible UIA output.' }
    return $result
}
$keyCodes = @{ Tab = 9; 'Shift+Tab' = 9; Enter = 13; Space = 32; Escape = 27
    ArrowLeft = 37; ArrowUp = 38; ArrowRight = 39; ArrowDown = 40; Home = 36; End = 35 }
$traceName = "A11yAssist-$([guid]::NewGuid().ToString('N'))"
$traceId = $null
$traceStarted = $false
$recorder = $null
$audioIntent = $false
$audioPrepared = $false
function Get-TraceId {
    $lines = @(& "$env:SystemRoot\System32\logman.exe" query $traceName -ets 2>&1)
    if ($LASTEXITCODE -ne 0) { throw 'Cannot verify the owned ETW session.' }
    $matches = @($lines | Select-String -Pattern '^\s*Logger Id:\s*(0x[0-9a-fA-F]+|\d+)\s*$')
    if ($matches.Count -ne 1) { throw 'Cannot identify the exact ETW Logger Id; retain startup intent for recovery.' }
    return $matches[0].Matches[0].Groups[1].Value
}
Save-Report
try {
    Assert-Desktop
    $boundAt = Get-BoundProcess $request.atProcess $atExecutable
    $report.atVersion = $boundAt.MainModule.FileVersionInfo.FileVersion
    if ([string]::IsNullOrWhiteSpace($report.atVersion)) { throw 'Actual AT file version is unavailable.' }
    $report.windowsVersion = [Environment]::OSVersion.Version.ToString()
    if ($request.keys.Count -gt 10 -or $request.observeMilliseconds -lt 1000 -or $request.observeMilliseconds -gt 10000) {
        throw 'Native observation budget exceeded.'
    }
    foreach ($step in $request.keys) {
        if (-not $keyCodes.ContainsKey($step.key) -or $step.delayMilliseconds -lt 0 -or $step.delayMilliseconds -gt 1000) {
            throw 'Unsupported native key or delay.'
        }
    }
    $report.preflightVerified = $true
    $report.state = 'observing'
    if ($request.at -eq 'nvda') { $report.beforeText = Read-NvdaOutput }
    if ($request.at -eq 'voice-access') { $report.beforeUi = @(Read-VoiceAccessOutput) }
    if ($request.at -in @('narrator', 'voice-access')) {
        Assert-PinnedFile $policy.ffmpeg
        Assert-PinnedFile $policy.audioModule
        if ($policy.audioInputName -match '["\\\r\n]' -or $policy.audioOutputName -match '["\\\r\n]') {
            throw 'Invalid configured audio endpoint name.'
        }
        Import-Module -Name $policy.audioModule.path -ErrorAction Stop
        if ((Get-AudioDevice -Recording).Name -cne $policy.audioInputName -or
            (Get-AudioDevice -Playback).Name -cne $policy.audioOutputName) {
            throw 'Approved audio endpoints are not selected; observation never changes routing.'
        }
        $audioPrepared = $true
        $audio = Join-Path $output 'audio.wav'
        $start = [Diagnostics.ProcessStartInfo]::new()
        $start.FileName = $policy.ffmpeg.path
        $start.Arguments = "-hide_banner -loglevel error -f dshow -i `"audio=$($policy.audioInputName)`" -t 30 -acodec pcm_s16le `"$audio`""
        $start.UseShellExecute = $false; $start.CreateNoWindow = $true
        $start.RedirectStandardInput = $true; $start.RedirectStandardError = $true
        $report.effects += @{ kind = 'audio-start-intent'; timestamp = [DateTimeOffset]::UtcNow.ToString('o') }
        Save-Report
        $audioIntent = $true
        $recorder = [Diagnostics.Process]::Start($start)
        $audioErrors = $recorder.StandardError.ReadToEndAsync()
        $report.recorder = @{ pid = $recorder.Id; startedAt = $recorder.StartTime.ToUniversalTime().ToString('o') }
        Save-Report
        Start-Sleep -Milliseconds 500
        if ($recorder.HasExited) { throw 'Audio recorder exited before the native trigger.' }
    }
    if ($request.at -eq 'narrator') {
        if ([Globalization.CultureInfo]::InstalledUICulture.TwoLetterISOLanguageName -cne 'en') {
            throw 'This ETW Logger Id parser requires English Windows; no trace was started.'
        }
        $manifest = @(& "$env:SystemRoot\System32\wevtutil.exe" gp Microsoft-Windows-Narrator /ge:true /f:xml 2>&1)
        if ($LASTEXITCODE -ne 0) { throw 'Narrator ETW manifest is unavailable.' }
        [xml]$manifestXml = $manifest -join "`n"
        foreach ($id in @('5', '6')) {
            if (-not $manifestXml.SelectSingleNode("//*[local-name()='event' and @value='$id']")) {
                throw 'Narrator manifest lacks the reviewed activity events; do not guess speech semantics.'
            }
        }
        $report.effects += @{ kind = 'trace-start-intent'; name = $traceName }
        Save-Report
        $traceStarted = $true
        & "$env:SystemRoot\System32\logman.exe" create trace $traceName -o (Join-Path $output 'narrator.etl') `
            -p Microsoft-Windows-Narrator 0x8000000000010000 -f bincirc -max 32 -ets | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Narrator ETW startup failed; inspect original session, do not retry.' }
        $traceId = Get-TraceId
        $report.trace = @{ name = $traceName; loggerId = $traceId }
        Save-Report
    }
    Assert-Desktop
    $report.triggerAt = [DateTimeOffset]::UtcNow.ToString('o')
    Save-Report
    foreach ($step in $request.keys) {
        Assert-Desktop
        $report.effects += @{ kind = 'key-intent'; key = $step.key; timestamp = [DateTimeOffset]::UtcNow.ToString('o') }
        Save-Report
        [A11yNativeInput]::Key([uint16]$keyCodes[$step.key], $step.key -ceq 'Shift+Tab')
        Start-Sleep -Milliseconds $step.delayMilliseconds
    }
    if ($request.at -eq 'voice-access') {
        if ($request.command -notin @('show-numbers', 'hide-numbers')) { throw 'Only approved number-overlay voice commands are supported.' }
        $command = $policy.voiceCommands.($request.command)
        Assert-PinnedFile $command
        Assert-ShortWave $command.path
        Assert-Desktop
        $report.effects += @{ kind = 'voice-command-intent'; command = $request.command; sha256 = $command.sha256 }
        Save-Report
        $player = [Media.SoundPlayer]::new($command.path)
        try { $player.Load(); $player.PlaySync() } finally { $player.Dispose() }
    }
    Start-Sleep -Milliseconds $request.observeMilliseconds
    Assert-Desktop
    $report.observationEndAt = [DateTimeOffset]::UtcNow.ToString('o')
    if ($request.at -eq 'nvda') {
        $report.afterText = Read-NvdaOutput
        if (-not $report.afterText.StartsWith($report.beforeText, [StringComparison]::Ordinal)) {
            throw 'NVDA Speech Viewer was reset/truncated; delta attribution is inconclusive.'
        }
        $report.transcript = $report.afterText.Substring($report.beforeText.Length)
        if (-not $report.transcript.Trim()) { throw 'No new real NVDA Speech Viewer output was observed.' }
        $report.transcriptAvailable = $true
    }
    if ($request.at -eq 'voice-access') { $report.afterUi = @(Read-VoiceAccessOutput) }
    $report.postcheckVerified = $true
}
catch {
    $report.errors += $_.Exception.Message
}
finally {
    if ($traceStarted) {
        try {
            if (-not $traceId -or (Get-TraceId) -cne $traceId) { throw 'ETW identity unknown/changed; do not stop a possibly foreign logger.' }
            & "$env:SystemRoot\System32\logman.exe" stop $traceName -ets | Out-Null
            if ($LASTEXITCODE -ne 0) { throw 'Owned Narrator ETW stop failed.' }
            $sessions = @(& "$env:SystemRoot\System32\logman.exe" query -ets 2>&1)
            if ($LASTEXITCODE -ne 0 -or @($sessions | Select-String -SimpleMatch $traceName).Count) {
                throw 'Cannot confirm the owned ETW session is absent after stop.'
            }
            $traceStarted = $false
            & "$env:SystemRoot\System32\tracerpt.exe" (Join-Path $output 'narrator.etl') `
                -o (Join-Path $output 'narrator.xml') -of XML -y | Out-Null
            if ($LASTEXITCODE -ne 0) { throw 'Narrator ETW decoding failed.' }
            $readerSettings = [Xml.XmlReaderSettings]::new()
            $readerSettings.DtdProcessing = [Xml.DtdProcessing]::Prohibit
            $readerSettings.XmlResolver = $null
            $reader = [Xml.XmlReader]::Create((Join-Path $output 'narrator.xml'), $readerSettings)
            try { $events = [Xml.XmlDocument]::new(); $events.XmlResolver = $null; $events.Load($reader) }
            finally { $reader.Dispose() }
            foreach ($event in $events.SelectNodes("//*[local-name()='Event']")) {
                $system = $event.SelectSingleNode("*[local-name()='System']")
                if (-not $system) { continue }
                $provider = $system.SelectSingleNode("*[local-name()='Provider']")
                if (-not $provider -or $provider.GetAttribute('Name') -cne 'Microsoft-Windows-Narrator') { continue }
                $id = $system.SelectSingleNode("*[local-name()='EventID']")
                $execution = $system.SelectSingleNode("*[local-name()='Execution']")
                $time = $system.SelectSingleNode("*[local-name()='TimeCreated']")
                if (-not $id -or -not $execution -or -not $time) { throw 'Malformed Narrator event schema.' }
                if ($execution.GetAttribute('ProcessID') -cne ([string]$request.atProcess.pid)) { continue }
                if ($id.InnerText -in @('5', '6')) {
                    $timestamp = [DateTimeOffset]::Parse($time.GetAttribute('SystemTime'))
                    if (-not $report.Contains('triggerAt') -or -not $report.Contains('observationEndAt') -or
                        $timestamp -lt [DateTimeOffset]::Parse($report.triggerAt) -or
                        $timestamp -gt [DateTimeOffset]::Parse($report.observationEndAt)) { continue }
                    $report.events += @{ id = [int]$id.InnerText; pid = [int]$request.atProcess.pid
                        timestamp = $time.GetAttribute('SystemTime'); meaning = 'activity-marker-not-speech-text' }
                }
            }
            if (-not $report.events.Count) { $report.errors += 'No reviewed Narrator activity markers were captured.' }
        }
        catch { $report.cleanupErrors += $_.Exception.Message }
    }
    if ($recorder) {
        try {
            if (-not $recorder.HasExited) {
                $recorder.StandardInput.WriteLine('q')
                if (-not $recorder.WaitForExit(10000)) { throw 'Owned recorder did not exit; retain original PID for scoped recovery.' }
            }
            if ($recorder.ExitCode -ne 0) { throw 'Owned audio recording did not finish successfully.' }
            $null = $audioErrors.GetAwaiter().GetResult()
            if ((Get-Item -LiteralPath (Join-Path $output 'audio.wav')).Length -le 44) { throw 'Recorded audio has no samples.' }
        }
        catch { $report.cleanupErrors += $_.Exception.Message }
    }
    try { Assert-Desktop } catch { $report.postcheckVerified = $false; $report.errors += $_.Exception.Message }
    if ($audioPrepared) {
        try {
            if ((Get-AudioDevice -Recording).Name -cne $policy.audioInputName -or
                (Get-AudioDevice -Playback).Name -cne $policy.audioOutputName) { throw 'Audio endpoints changed during observation.' }
        }
        catch { $report.postcheckVerified = $false; $report.errors += $_.Exception.Message }
    }
    $report.ownedCleanupVerified = -not $traceStarted -and
        (-not $audioIntent -or ($recorder -and $recorder.HasExited)) -and -not $report.cleanupErrors.Count
    $report.finishedAt = [DateTimeOffset]::UtcNow.ToString('o')
    $report.state = if ($report.preflightVerified -and $report.postcheckVerified -and
        $report.ownedCleanupVerified -and -not $report.errors.Count) { 'observed' } else { 'inconclusive' }
    Save-Report
}
@{ state = $report.state; behaviorVerdict = 'not-evaluated' } | ConvertTo-Json -Compress
