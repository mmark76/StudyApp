import http.client
import json
import sys
import tempfile
import threading
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import server


class WriterLaunchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.StudyAppLocalServer(("127.0.0.1", 0), server.Handler)
        cls.old_port = server.PORT
        server.PORT = cls.httpd.server_port
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown(); cls.httpd.server_close(); cls.thread.join()
        server.PORT = cls.old_port

    def post(self, body, origin=None):
        conn = http.client.HTTPConnection("127.0.0.1", server.PORT, timeout=5)
        headers = {"Content-Type": "application/json", "Origin": origin or f"http://127.0.0.1:{server.PORT}"}
        try:
            conn.request("POST", "/api/writer/open", json.dumps(body), headers)
            response = conn.getresponse()
            return response.status, json.loads(response.read())
        finally:
            conn.close()

    def test_launch_requires_local_origin_confirmation_and_expected_files(self):
        with tempfile.TemporaryDirectory() as name:
            folder = Path(name)
            (folder / "app").mkdir()
            (folder / "app" / "server.py").write_text("pass")
            (folder / "app" / "nlg_writer.py").write_text("pass")
            (folder / "Start Local Writer.bat").write_text("rem fixture")
            with patch.object(server.shutil, "which", return_value="python"), patch.object(server.subprocess, "Popen") as launch:
                self.assertEqual(self.post({"folder": str(folder), "confirmed": True}, origin="https://example.com")[0], 403)
                self.assertEqual(self.post({"folder": str(folder)})[0], 400)
                self.assertEqual(self.post({"folder": "relative", "confirmed": True})[0], 400)
                self.assertEqual(self.post({"folder": str(folder / "missing"), "confirmed": True})[0], 400)
                launch.assert_not_called()
                status, result = self.post({"folder": str(folder), "confirmed": True})
                self.assertEqual((status, result["state"]), (200, "START_REQUESTED"))
                args, kwargs = launch.call_args
                self.assertEqual(args[0], ["python", str((folder / "app" / "server.py").resolve()), "--open"])
                self.assertNotIn("shell", kwargs)

if __name__ == "__main__":
    unittest.main()
