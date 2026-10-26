$ErrorActionPreference = "Stop"
$companionRoot = Split-Path -Parent $PSCommandPath
$venvPath = Join-Path $companionRoot ".chatgpt-plan-venv"
$requirementsPath = Join-Path $companionRoot "requirements-chatgpt-plan.txt"

Write-Host ""
Write-Host "Optional StudyApp Local ChatGPT security component" -ForegroundColor Cyan
Write-Host "This installs PyJWT[crypto] into this local edition only."
Write-Host "It validates the ChatGPT identity-token signature after browser approval."
Write-Host "It does not send a question or start a ChatGPT request."
$answer = Read-Host "Install this optional component now? [y/N]"
if ($answer -notmatch '^(?i:y|yes)$') {
    Write-Host "No component was installed." -ForegroundColor Yellow
    Read-Host "Press Enter to close"
    exit 1
}

if (-not (Test-Path $requirementsPath -PathType Leaf)) {
    throw "The ChatGPT connection requirements file is missing."
}

if (-not (Test-Path (Join-Path $venvPath "Scripts\\python.exe") -PathType Leaf)) {
    py -3 -m venv --without-pip $venvPath
    if ($LASTEXITCODE -ne 0) {
        throw "StudyApp Local could not prepare its isolated Python environment."
    }
}

py -3 -m pip --python $venvPath install --disable-pip-version-check --requirement $requirementsPath
if ($LASTEXITCODE -ne 0) {
    throw "StudyApp Local could not install the optional ChatGPT security component. Check Python pip and try again."
}
Write-Host "The optional StudyApp Local ChatGPT connection is ready. You can close this window and return to StudyApp." -ForegroundColor Green
Read-Host "Press Enter to close"
