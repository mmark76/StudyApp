"""Serve the built StudyApp Local UI and its explicit ChatGPT-plan companion API."""
from __future__ import annotations

import errno
import json
import mimetypes
import os
import subprocess
import webbrowser
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from credential_vault import CredentialVault
from openai_connection import ChatGptConnectionError, ChatGptConnectionSetupRequired, ChatGptPlanConnection

HOST = "127.0.0.1"
PORT = 8766
ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
CALLBACK_PATH = "/auth/callback"
CALLBACK_URL = f"http://{HOST}:{PORT}{CALLBACK_PATH}"
DATA_ROOT = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local")) / "MarkellosStudyApp" / "chatgpt-plan"
CONNECTION = ChatGptPlanConnection(CredentialVault(), DATA_ROOT)


class StudyAppLocalServer(ThreadingHTTPServer):
    allow_reuse_address = True


class Handler(BaseHTTPRequestHandler):
    server_version = "StudyAppLocal"
    sys_version = ""

    def log_message(self, _format: str, *_args: object) -> None:
        """Do not write callback parameters or submitted questions to a log."""

    def _json(self, body: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        encoded = json.dumps(body, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(encoded)

    def _html(self, body: str, status: HTTPStatus) -> None:
        encoded = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(encoded)

    @staticmethod
    def _is_local_origin(value: str | None) -> bool:
        return value in {f"http://{HOST}:{PORT}", f"http://localhost:{PORT}"}

    def _host_valid(self) -> bool:
        return self.headers.get("Host") in {f"{HOST}:{PORT}", f"localhost:{PORT}"}

    def _require_local_request(self) -> bool:
        if not self._host_valid() or not self._is_local_origin(self.headers.get("Origin")):
            self._json({"error": "This operation is available only from StudyApp Local."}, HTTPStatus.FORBIDDEN)
            return False
        return True

    def _read_json(self) -> dict:
        try:
            size = int(self.headers.get("Content-Length") or "")
        except ValueError as error:
            raise ChatGptConnectionError("The local request is invalid.") from error
        if not 0 < size <= 20_000:
            raise ChatGptConnectionError("The local request is invalid.")
        try:
            body = json.loads(self.rfile.read(size).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as error:
            raise ChatGptConnectionError("The local request is invalid.") from error
        if not isinstance(body, dict):
            raise ChatGptConnectionError("The local request is invalid.")
        return body

    def _connection_error(self, error: Exception) -> None:
        self._json({"error": str(error), "setupRequired": isinstance(error, ChatGptConnectionSetupRequired)}, HTTPStatus.BAD_REQUEST)

    def do_GET(self) -> None:  # noqa: N802
        if not self._host_valid():
            self._json({"error": "Invalid local host."}, HTTPStatus.FORBIDDEN)
            return
        parsed = urlparse(self.path)
        if parsed.path == "/api/chatgpt-plan/connection":
            self._json(CONNECTION.status())
            return
        if parsed.path == CALLBACK_PATH:
            print("ChatGPT approval callback received.")
            query = {key: value[-1] for key, value in parse_qs(parsed.query, keep_blank_values=True).items() if value}
            try:
                CONNECTION.complete(query)
            except ChatGptConnectionError as error:
                print("ChatGPT approval callback was not completed.")
                self._html(f"<!doctype html><title>Connection not completed</title><main><h1>ChatGPT connection not completed</h1><p>{error}</p><p>You may close this tab and return to StudyApp Local.</p></main>", HTTPStatus.BAD_REQUEST)
                return
            print("ChatGPT connection completed.")
            self._html("<!doctype html><title>Connected</title><main><h1>ChatGPT is connected</h1><p>You may close this tab and return to StudyApp Local.</p></main>", HTTPStatus.OK)
            return
        self._static(parsed.path)

    def do_POST(self) -> None:  # noqa: N802
        if not self._require_local_request():
            return
        path = urlparse(self.path).path
        try:
            body = self._read_json()
            if path == "/api/chatgpt-plan/connection":
                if body.get("confirmConnection") is not True:
                    raise ChatGptConnectionError("Confirm the ChatGPT connection request.")
                status = CONNECTION.start(CALLBACK_URL)
                print("ChatGPT approval opened in the browser; waiting for the loopback callback.")
                self._json(status)
                return
            if path == "/api/chatgpt-plan/setup":
                if body.get("confirmSetup") is not True:
                    raise ChatGptConnectionError("Confirm the optional connection setup request.")
                script = ROOT / "local-companion" / "setup-chatgpt-connection.ps1"
                if not script.is_file():
                    raise ChatGptConnectionError("The optional connection setup script is unavailable.")
                subprocess.Popen(["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(script)], cwd=ROOT, creationflags=getattr(subprocess, "CREATE_NEW_CONSOLE", 0))
                self._json({"state": "SETUP_STARTED"})
                return
            if path == "/api/chatgpt-plan/ask":
                if body.get("confirmExternalRequest") is not True:
                    raise ChatGptConnectionError("Confirm the ChatGPT question.")
                self._json(CONNECTION.ask(body.get("question")))
                return
            self._json({"error": "Not found."}, HTTPStatus.NOT_FOUND)
        except ChatGptConnectionError as error:
            self._connection_error(error)

    def do_DELETE(self) -> None:  # noqa: N802
        if not self._require_local_request():
            return
        if urlparse(self.path).path != "/api/chatgpt-plan/connection":
            self._json({"error": "Not found."}, HTTPStatus.NOT_FOUND)
            return
        try:
            body = self._read_json()
            if body.get("confirmRemoval") is not True:
                raise ChatGptConnectionError("Confirm local ChatGPT connection removal.")
            self._json(CONNECTION.remove())
        except ChatGptConnectionError as error:
            self._connection_error(error)

    def _static(self, request_path: str) -> None:
        if not DIST.is_dir() or not (DIST / "index.html").is_file():
            self._html("<!doctype html><title>StudyApp Local not built</title><main><h1>StudyApp Local is not ready</h1><p>Build the application before starting StudyApp Local.</p></main>", HTTPStatus.SERVICE_UNAVAILABLE)
            return
        candidate = (DIST / (unquote(request_path).lstrip("/") or "index.html")).resolve()
        try:
            candidate.relative_to(DIST.resolve())
        except ValueError:
            self._html("<!doctype html><title>Not found</title><main><h1>Not found</h1></main>", HTTPStatus.NOT_FOUND)
            return
        target = candidate if candidate.is_file() else DIST / "index.html"
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        payload = target.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") or content_type in {"application/javascript", "application/json"} else content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.end_headers()
        self.wfile.write(payload)


def main() -> int:
    try:
        with StudyAppLocalServer((HOST, PORT), Handler) as server:
            print(f"StudyApp Local is running at http://{HOST}:{PORT}")
            if os.environ.get("STUDYAPP_LOCAL_SUPPRESS_BROWSER") != "1":
                webbrowser.open(f"http://{HOST}:{PORT}")
            server.serve_forever()
    except OSError as error:
        if error.errno not in {errno.EADDRINUSE, 10048}:
            raise
        print(f"StudyApp Local could not start because port {PORT} is already in use.")
        print("Close the earlier StudyApp Local window or run Stop StudyApp Local.bat, then try again.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
