# StudyApp Local ChatGPT-plan companion

This folder belongs to the optional Windows-only **StudyApp Local** edition. It
does not alter the browser/PWA edition.

The Windows release contains `Start StudyApp Local.bat` at its top level. After
extracting the complete ZIP, run that file to serve the bundled `dist/`
application only at `http://127.0.0.1:8766`. Python 3 is the only prerequisite;
the launcher creates the local virtual environment and opens the Local edition
in the default browser. The application then offers an explicit connection with
an eligible ChatGPT account. Connection approval happens in the user's browser;
the refresh token is encrypted with Windows DPAPI and can be read only by that
Windows user.

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
