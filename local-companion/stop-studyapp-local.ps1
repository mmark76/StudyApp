[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8767
)

$ErrorActionPreference = "Stop"
$listeners = @(Get-NetTCPConnection -State Listen -LocalAddress "127.0.0.1" -LocalPort $Port -ErrorAction SilentlyContinue)

if ($listeners.Count -eq 0) {
    Write-Host "StudyApp Local is not using port $Port. Nothing was stopped." -ForegroundColor Yellow
    exit 0
}

$processIds = @($listeners | Select-Object -ExpandProperty OwningProcess -Unique)
$studyAppProcesses = @()
foreach ($processId in $processIds) {
    $processInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
    if ($null -eq $processInfo -or $processInfo.CommandLine -notmatch '(?i)local-companion[\\/]server\.py(?:\s|$)') {
        Write-Host "Port $Port is in use by a process that is not StudyApp Local. It was not stopped." -ForegroundColor Red
        exit 2
    }
    $studyAppProcesses += $processId
}

foreach ($processId in $studyAppProcesses) {
    Stop-Process -Id $processId -ErrorAction Stop
}

Write-Host "StudyApp Local was stopped and port $Port is available." -ForegroundColor Green
