@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0local-companion\stop-studyapp-local.ps1" -Port 8767
if errorlevel 1 pause
