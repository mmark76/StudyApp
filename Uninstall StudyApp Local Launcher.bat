@echo off
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0local-companion\uninstall-studyapp-local-launcher.ps1" -InstallRoot "%~dp0"
if errorlevel 1 pause
