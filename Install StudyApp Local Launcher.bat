@echo off
setlocal
cd /d "%~dp0"

echo.
echo StudyApp Local - Launcher setup
echo ======================================
echo This connects the Open StudyApp Local button to this folder.
echo It installs only for your Windows account. No administrator access is needed.
echo.
echo [1/2] Checking the package and registering the launcher...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0local-companion\install-studyapp-local-launcher.ps1"
if errorlevel 1 (
  echo.
  echo Launcher setup could not be completed. Review the error above.
  echo Press any key to close this window.
  pause >nul
  exit /b 1
)

echo.
echo [2/2] Launcher setup complete. You can now open StudyApp Local from the website.
echo The Run option will appear in 7 seconds.
timeout /t 7 /nobreak >nul

powershell.exe -NoProfile -Command "try { Add-Type -AssemblyName PresentationFramework; if ([System.Windows.MessageBox]::Show('Launcher setup is complete. Open StudyApp Local now?', 'StudyApp Local', 'YesNo', 'Question') -eq 'Yes') { exit 0 }; exit 1 } catch { [Console]::Error.WriteLine($_); exit 2 }"
if errorlevel 2 (
  echo Could not show the Run option. You can still start StudyApp Local from its Start file.
  echo Press any key to close this window.
  pause >nul
  exit /b 1
)
if errorlevel 1 exit /b 0

echo Opening StudyApp Local...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0local-companion\studyapp-local-protocol.ps1" -ProtocolUrl "studyapp-local://open"
if errorlevel 1 (
  echo StudyApp Local could not be opened. Review the message shown on screen.
  echo Press any key to close this window.
  pause >nul
  exit /b 1
)

echo StudyApp Local is open at http://127.0.0.1:8766
echo If the online StudyApp tab is still open, close it to avoid confusion.
powershell.exe -NoProfile -Command "Add-Type -AssemblyName PresentationFramework; [System.Windows.MessageBox]::Show('StudyApp Local is open at http://127.0.0.1:8766. If the online StudyApp tab is still open, please close it.', 'StudyApp Local', 'OK', 'Information') | Out-Null"
