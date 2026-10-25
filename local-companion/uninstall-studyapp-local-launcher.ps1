$ErrorActionPreference = "Stop"
$resolvedRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$protocolKey = "HKCU:\Software\Classes\studyapp-local"

if (-not (Test-Path -LiteralPath $protocolKey)) {
    Write-Host "StudyApp Local Launcher is not installed for this Windows user." -ForegroundColor Yellow
    exit 0
}

$registeredRoot = (Get-ItemProperty -Path $protocolKey -Name "StudyAppInstallRoot" -ErrorAction SilentlyContinue).StudyAppInstallRoot
if ($registeredRoot -ne $resolvedRoot) {
    throw "The registered StudyApp Local Launcher belongs to a different extracted package. Run its Uninstall StudyApp Local Launcher.bat instead."
}

Remove-Item -LiteralPath $protocolKey -Recurse -Force
Write-Host "StudyApp Local Launcher was removed for this Windows user." -ForegroundColor Green
