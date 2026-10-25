$ErrorActionPreference = "Stop"
$resolvedRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$handler = Join-Path $resolvedRoot "local-companion\studyapp-local-protocol.ps1"

if (-not (Test-Path -LiteralPath $handler -PathType Leaf)) {
    throw "The StudyApp Local protocol handler is missing. Extract the complete package before installing the launcher."
}

$protocolKey = "HKCU:\Software\Classes\studyapp-local"
$commandKey = Join-Path $protocolKey "shell\open\command"
$powershell = Join-Path $PSHOME "powershell.exe"
$command = ('"{0}" -NoProfile -ExecutionPolicy Bypass -File "{1}" "%1"' -f $powershell, $handler)

New-Item -Path $commandKey -Force | Out-Null
Set-Item -Path $protocolKey -Value "URL:StudyApp Local Protocol"
New-ItemProperty -Path $protocolKey -Name "URL Protocol" -Value "" -PropertyType String -Force | Out-Null
New-ItemProperty -Path $protocolKey -Name "StudyAppInstallRoot" -Value $resolvedRoot -PropertyType String -Force | Out-Null
Set-Item -Path $commandKey -Value $command

Write-Host "StudyApp Local Launcher is ready for this Windows user." -ForegroundColor Green
Write-Host "You can now use the Open StudyApp Local action in StudyApp." -ForegroundColor Green
