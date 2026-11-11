$ErrorActionPreference = 'Stop'
$exePath = Join-Path $PSScriptRoot 'internal\pyla_main.exe'

if (-not (Test-Path -LiteralPath $exePath)) {
    Write-Error "FruxX AI executable was not found: $exePath"
    exit 1
}

try { $Host.UI.RawUI.WindowTitle = 'FruxX AI' } catch {}

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class FruxXWindowTitle {
    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool SetWindowText(IntPtr hWnd, string text);
}
'@

$processInfo = New-Object System.Diagnostics.ProcessStartInfo
$processInfo.FileName = $exePath
$processInfo.WorkingDirectory = $PSScriptRoot
$processInfo.UseShellExecute = $false
$processInfo.RedirectStandardOutput = $true
$processInfo.RedirectStandardError = $true

$process = New-Object System.Diagnostics.Process
$process.StartInfo = $processInfo
$rewriteLine = {
    param($line)
    if ([string]::IsNullOrWhiteSpace($line)) { return }
    if ($line -match '(?i)official discord is https?://') { return }
    $line = $line -creplace '(?i)PylaAI', 'FruxX AI'
    $line = $line -creplace '(?i)\bPyla\b', 'FruxX AI'
    [Console]::WriteLine($line)
}
$stdoutHandler = [System.Diagnostics.DataReceivedEventHandler] { param($sender, $eventArgs) if ($null -ne $eventArgs.Data) { & $rewriteLine $eventArgs.Data } }
$stderrHandler = [System.Diagnostics.DataReceivedEventHandler] { param($sender, $eventArgs) if ($null -ne $eventArgs.Data) { & $rewriteLine $eventArgs.Data } }
$process.add_OutputDataReceived($stdoutHandler)
$process.add_ErrorDataReceived($stderrHandler)
[void]$process.Start()
$process.BeginOutputReadLine()
$process.BeginErrorReadLine()

while (-not $process.HasExited) {
    $process.Refresh()
    if ($process.MainWindowHandle -ne [IntPtr]::Zero) {
        [void][FruxXWindowTitle]::SetWindowText($process.MainWindowHandle, 'FruxX AI')
    }
    Start-Sleep -Milliseconds 500
}
$process.WaitForExit()
exit $process.ExitCode
