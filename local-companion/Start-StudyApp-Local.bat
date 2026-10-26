@echo off
setlocal
cd /d "%~dp0.."
if not exist "dist\index.html" (
  echo StudyApp Local has not been built yet.
  echo Run npm.cmd run build from this folder, then start this file again.
  pause
  exit /b 1
)
if not exist "local-companion\.chatgpt-plan-venv\Scripts\python.exe" py -3 -m venv --without-pip "local-companion\.chatgpt-plan-venv"
local-companion\.chatgpt-plan-venv\Scripts\python.exe local-companion\server.py
pause
