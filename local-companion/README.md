# StudyApp Local ChatGPT-plan companion

This folder belongs to the optional Windows-only **StudyApp Local** edition. It
does not alter the browser/PWA edition.

The Windows release contains `Start StudyApp Local.bat` at its top level. After
extracting the complete ZIP, run that file to start directly, or run `Enable Launch Button.bat`
and choose to open the app after setup. Both paths
serve the bundled `dist/` application only at `http://127.0.0.1:8767`. Python 3
is the only prerequisite; the launcher creates the local virtual environment
and opens the Local edition
in the default browser. The application then offers an explicit connection with
an eligible ChatGPT account. Connection approval happens in the user's browser;
the refresh token is encrypted with Windows DPAPI and can be read only by that
Windows user.

If starting directly and a previous StudyApp Local window still owns port 8767,
run the adjacent `Stop StudyApp Local Server.bat` first. It stops only a process whose
command line is the bundled StudyApp Local server; it refuses to stop an
unrelated process. The installed launcher handles this check automatically.
If another application is using port 8767, close that application before
starting StudyApp Local. The StudyApp stop file does not stop unrelated apps.
If you started directly, keep that terminal open while using the app; it closes
shortly after the server stops.

## Optional browser launcher

After extracting the complete Windows package, run `Enable Launch Button.bat`
once. It registers `studyapp-local://open` and `studyapp-local://stop` for the current
Windows user only and does not require administrator rights. Setup displays
its result for seven seconds, then offers to open StudyApp Local and reminds
you to close any online StudyApp tab. The **Open
StudyApp Local** action in the browser/PWA can then invoke the native handler.
The handler accepts only these fixed requests. Open starts this package’s Local server and opens Workspace BETA. Stop checks port 8767 and asks for confirmation before stopping the verified server. If another eligible same-user application owns the port, it offers a separate confirmation identifying the process and warning about unsaved work. Protected or unverifiable processes are not stopped. Re-run Enable Launch Button.bat from the new package to use Stop.

Before moving or deleting the extracted package, run `Disable Launch Button.bat`.
If you move the package, run the installer again from the new
folder. The uninstaller refuses to remove a launcher registered by a different
extracted package.

## Data boundary

- no OpenAI API key is requested or stored;
- StudyApp sends only a question the user explicitly submits in the Local page;
- it does not scan, read, upload or automatically include Library/IndexedDB
  content;
- responses use `store: false` and are held only in the current page session;
- selecting **Disconnect** deletes the protected local connection record;
- each successful Local server startup clears that record and requires a fresh
  preparation and a fresh ChatGPT browser approval. Study material is not deleted.
  Closing and reopening a browser tab does not restart the server.

The connected Workspace chat lists models for the selected ChatGPT account.
The companion retains the token, returns only display names and slugs to the
Local UI, and verifies the selected slug against a fresh catalog before each
inference request. Public distribution of this personal Local integration still
requires review of the applicable OpenAI terms.

**Prepare secure connection** is required once per server session. If the optional identity-validation dependency is already installed, preparation verifies it without reinstalling. Otherwise a visible Windows setup window installs it in `local-companion/.chatgpt-plan-venv/`; restart the server afterward and prepare again.
