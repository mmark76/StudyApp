@echo off
setlocal
cd /d "%~dp0"

if not exist "dist\index.html" (
  echo StudyApp Local is incomplete. Extract the entire ZIP before starting it.
  pause
  exit /b 1
)

py -3 -c "import sys" >nul 2>&1
if errorlevel 1 (
  echo Python 3 is required to start StudyApp Local.
  echo Install Python for Windows, then run this file again.
  pause
  exit /b 1
)

if not exist "local-companion\.chatgpt-plan-venv\Scripts\python.exe" (
  py -3 -m venv "local-companion\.chatgpt-plan-venv"
  if errorlevel 1 (
    echo StudyApp Local could not prepare its local environment.
    pause
    exit /b 1
  )
)

echo Starting StudyApp Local at http://127.0.0.1:8766
"local-companion\.chatgpt-plan-venv\Scripts\python.exe" local-companion\server.py
pause
