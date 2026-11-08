[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$LabRoot,
    [int]$OtherPid = 0,
    [long]$OtherCreationTicks = 0,
    [switch]$PolicyOnly
)

$ErrorActionPreference = 'Stop'

function Test-VerifiedStudyAppProcess {
    param($Process, [string]$Root)
    if (-not $Process -or $Process.Name -notin @('python.exe', 'pythonw.exe')) { return $false }
    $command = [string]$Process.CommandLine
    $match = [regex]::Match($command, '(?i)(?:^|\s)(?:"(?<quoted>[a-z]:\\[^"]+\\local-companion\\server\.py)"|(?<plain>[a-z]:\\[^\s"]+\\local-companion\\server\.py))\s*$')
    if (-not $match.Success) { return $false }
    $script = if ($match.Groups['quoted'].Success) { $match.Groups['quoted'].Value } else { $match.Groups['plain'].Value }
    $expected = [IO.Path]::GetFullPath((Join-Path $Root 'local-companion\server.py'))
    return [string]::Equals([IO.Path]::GetFullPath($script), $expected, [StringComparison]::OrdinalIgnoreCase) -and
        (Test-Path -LiteralPath $expected -PathType Leaf)
}

function Test-SafeOtherProcess {
    param($Process)
    if (-not $Process -or -not $Process.Name -or $Process.Name -notmatch '^[\w. -]{1,100}\.exe$' -or
        -not $Process.ExecutablePath -or -not $Process.CreationDate -or -not $Process.CommandLine) { return $false }
    if ($Process.Name -in @('explorer.exe', 'svchost.exe', 'services.exe', 'lsass.exe', 'csrss.exe', 'wininit.exe', 'winlogon.exe', 'dwm.exe', 'system.exe')) { return $false }
    $windowsDir = [IO.Path]::GetFullPath($env:SystemRoot).TrimEnd('\') + '\'
    if ([IO.Path]::GetFullPath($Process.ExecutablePath).StartsWith($windowsDir, [StringComparison]::OrdinalIgnoreCase)) { return $false }
    $ownerInfo = Invoke-CimMethod -InputObject $Process -MethodName GetOwner -ErrorAction Stop
    if ($ownerInfo.ReturnValue -ne 0 -or -not $ownerInfo.User -or -not $ownerInfo.Domain) { return $false }
    $ownerName = "$($ownerInfo.Domain)\$($ownerInfo.User)"
    return [string]::Equals($ownerName, [Security.Principal.WindowsIdentity]::GetCurrent().Name, [StringComparison]::OrdinalIgnoreCase)
}

if ($PolicyOnly) { return }

$stopped = $false
try {
    $root = [IO.Path]::GetFullPath($LabRoot)
    $listeners = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -eq 8767 })
    if ($listeners.Count -eq 0) { Write-Output 'AVAILABLE'; exit 0 }
    if ($listeners.Count -ne 1 -or $listeners[0].LocalAddress -ne '127.0.0.1') { Write-Output 'UNVERIFIED'; exit 2 }
    $ownerPid = [int]$listeners[0].OwningProcess
    $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$ownerPid" -ErrorAction Stop
    $isStudyApp = Test-VerifiedStudyAppProcess -Process $owner -Root $root
    if (-not $isStudyApp -and $OtherPid -eq 0) {
        $name = if ($owner -and $owner.Name -match '^[\w. -]{1,100}$') { $owner.Name } else { 'unknown' }
        if ($ownerPid -ne $PID -and (Test-SafeOtherProcess -Process $owner)) {
            Write-Output "OTHER:$name`:$ownerPid`:$($owner.CreationDate.Ticks)"
            exit 3
        }
        Write-Output "UNVERIFIED:$name"
        exit 2
    }
    if ($OtherPid -ne 0 -and ($isStudyApp -or $ownerPid -ne $OtherPid -or $owner.CreationDate.Ticks -ne $OtherCreationTicks -or
        $ownerPid -eq $PID -or -not (Test-SafeOtherProcess -Process $owner))) { Write-Output 'UNVERIFIED'; exit 2 }
    $fresh = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -eq 8767 })
    $same = Get-CimInstance Win32_Process -Filter "ProcessId=$ownerPid" -ErrorAction Stop
    if ($fresh.Count -ne 1 -or $fresh[0].LocalAddress -ne '127.0.0.1' -or [int]$fresh[0].OwningProcess -ne $ownerPid -or
        -not $same -or $same.CreationDate -ne $owner.CreationDate -or $same.CommandLine -ne $owner.CommandLine -or
        $same.ExecutablePath -ne $owner.ExecutablePath -or
        ($isStudyApp -and -not (Test-VerifiedStudyAppProcess -Process $same -Root $root)) -or
        (-not $isStudyApp -and -not (Test-SafeOtherProcess -Process $same))) { Write-Output 'UNVERIFIED'; exit 2 }
    Stop-Process -Id $ownerPid -ErrorAction Stop
    $stopped = $true
    for ($attempt = 0; $attempt -lt 25; $attempt++) {
        Start-Sleep -Milliseconds 200
        $remaining = @(Get-NetTCPConnection -State Listen -ErrorAction Stop | Where-Object { $_.LocalPort -eq 8767 })
        if ($remaining.Count -eq 0) { Write-Output 'STOPPED'; exit 0 }
    }
    Write-Output 'STOPPED_PORT_BUSY'
    exit 2
} catch {
    if ($stopped) { Write-Output 'STOPPED_PORT_BUSY' } else { Write-Output 'UNVERIFIED' }
    exit 2
}
