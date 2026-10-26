# StudyApp Local ChatGPT-plan companion

This folder belongs to the optional Windows-only **StudyApp Local** edition. It
does not alter the browser/PWA edition.

The Windows release contains `Start StudyApp Local.bat` at its top level. After
extracting the complete ZIP, run that file to start directly, or run `Install
StudyApp Local Launcher.bat` and choose to open the app after setup. Both paths
serve the bundled `dist/` application only at `http://127.0.0.1:8766`. Python 3
is the only prerequisite; the launcher creates the local virtual environment
and opens the Local edition
in the default browser. The application then offers an explicit connection with
an eligible ChatGPT account. Connection approval happens in the user's browser;
the refresh token is encrypted with Windows DPAPI and can be read only by that
Windows user.

If starting directly and a previous StudyApp Local window still owns port 8766,
run the adjacent `Stop StudyApp Local.bat` first. It stops only a process whose
command line is the bundled StudyApp Local server; it refuses to stop an
unrelated process. The installed launcher handles this check automatically.
If you started directly, keep that terminal open while using the app; it closes
shortly after the server stops.

## Optional browser launcher

After extracting the complete Windows package, run `Install StudyApp Local
Launcher.bat` once. It registers `studyapp-local://open` for the current
Windows user only and does not require administrator rights. Setup displays
its result for seven seconds, then offers to open StudyApp Local and reminds
you to close any online StudyApp tab. The **Open
StudyApp Local** action in the browser/PWA can then invoke the native handler.
The handler accepts only that exact protocol request, uses the safe stop script
for port 8766, starts this package's Local server, waits for its loopback
listener, and opens Workspace BETA.

Before moving or deleting the extracted package, run `Uninstall StudyApp Local
Launcher.bat`. If you move the package, run the installer again from the new
folder. The uninstaller refuses to remove a launcher registered by a different
extracted package.

## Data boundary

- no OpenAI API key is requested or stored;
- StudyApp sends only a question the user explicitly submits in the Local page;
- it does not scan, read, upload or automatically include Library/IndexedDB
  content;
- responses use `store: false` and are held only in the current page session;
- selecting **Disconnect** deletes the protected local connection record.

The first connect action may offer **Prepare secure connection**. This opens a
visible Windows PowerShell setup window and installs the single optional
identity-validation dependency in `local-companion/.chatgpt-plan-venv/`. No
setup runs without that user action.
