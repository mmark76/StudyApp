[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateNotNullOrEmpty()]
    [string]$ProtocolUrl
)

$ErrorActionPreference = "Stop"

function Show-LauncherError([string]$Message) {
    Add-Type -AssemblyName PresentationFramework
    [System.Windows.MessageBox]::Show($Message, "StudyApp Local", "OK", "Error") | Out-Null
}

function Test-StudyAppLocalListener {
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $attempt = $client.BeginConnect("127.0.0.1", 8767, $null, $null)
        if (-not $attempt.AsyncWaitHandle.WaitOne(500)) {
            return $false
        }
        $client.EndConnect($attempt)
        return $true
    } catch {
        return $false
    } finally {
        $client.Dispose()
    }
}

try {
    $uri = [Uri]$ProtocolUrl
    if ($uri.Scheme -ne "studyapp-local" -or $uri.Host -ne "open" -or $uri.UserInfo -or $uri.Port -ne -1 -or $uri.AbsolutePath -notin @("", "/") -or $uri.Query -or $uri.Fragment) {
        throw "StudyApp Local rejected an unrecognised launcher request."
    }

    $root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
    $startScript = Join-Path $root "Start StudyApp Local.bat"
    $stopScript = Join-Path $PSScriptRoot "stop-studyapp-local.ps1"
    if (-not (Test-Path -LiteralPath $startScript -PathType Leaf) -or -not (Test-Path -LiteralPath $stopScript -PathType Leaf)) {
        throw "The StudyApp Local package is incomplete. Extract the complete package and install the launcher again."
    }

    & $stopScript -Port 8767
    if ($LASTEXITCODE -ne 0) {
        throw "Port 8767 is owned by another application and was not changed. Close that application or choose a different port before opening StudyApp Local."
    }

    $previousSuppressBrowser = $env:STUDYAPP_LOCAL_SUPPRESS_BROWSER
    $env:STUDYAPP_LOCAL_SUPPRESS_BROWSER = "1"
    try {
        # The server runs in this window. Keep it visible so users can see startup
        # errors and know that closing the window stops StudyApp Local.
        Start-Process -FilePath $startScript -WorkingDirectory $root -WindowStyle Normal
    } finally {
        if ($null -eq $previousSuppressBrowser) {
            Remove-Item Env:STUDYAPP_LOCAL_SUPPRESS_BROWSER -ErrorAction SilentlyContinue
        } else {
            $env:STUDYAPP_LOCAL_SUPPRESS_BROWSER = $previousSuppressBrowser
        }
    }

    $deadline = (Get-Date).AddSeconds(45)
    while ((Get-Date) -lt $deadline) {
        if (Test-StudyAppLocalListener) {
            Start-Process "http://127.0.0.1:8767/#/workspace-beta"
            exit 0
        }
        Start-Sleep -Milliseconds 500
    }

    throw "StudyApp Local did not start within 45 seconds. Run Start StudyApp Local.bat directly to see the startup message."
} catch {
    Show-LauncherError $_.Exception.Message
    exit 1
}
