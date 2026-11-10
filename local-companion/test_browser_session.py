import unittest
import http.client
import threading
from unittest.mock import patch

from browser_session import BrowserSession
import server


class BrowserSessionTests(unittest.TestCase):
    def setUp(self):
        self.now = 0.0
        self.expired = 0
        self.session = BrowserSession(self.expire, clock=lambda: self.now)

    def expire(self):
        self.expired += 1

    def test_leave_expires_after_grace_and_only_once(self):
        self.session.heartbeat()
        self.session.leave()
        self.now = 4.9
        self.assertFalse(self.session.check())
        self.now = 5
        self.assertTrue(self.session.check())
        self.assertFalse(self.session.check())
        self.assertFalse(self.session.heartbeat())
        self.assertEqual(self.expired, 1)

    def test_refresh_heartbeat_cancels_pending_leave(self):
        self.session.leave()
        self.now = 4
        self.assertTrue(self.session.heartbeat())
        self.now = 5
        self.assertFalse(self.session.check())
        self.now = 94
        self.assertTrue(self.session.check())

    def test_missing_tab_or_crash_expires_without_leave(self):
        self.assertTrue(self.session.heartbeat())
        self.now = 90
        self.assertTrue(self.session.check())

    def test_server_without_initial_tab_expires(self):
        self.now = 120
        self.assertTrue(self.session.check())

    def test_real_loopback_endpoint_rejects_foreign_origin_and_releases_port(self):
        now = [0.0]
        closed = []
        with server.StudyAppLocalServer(("127.0.0.1", 0), server.Handler) as local_server:
            port = local_server.server_address[1]
            def expire():
                closed.append(True)
                local_server.shutdown()
            local_server.browser_session = BrowserSession(expire, clock=lambda: now[0])
            thread = threading.Thread(target=local_server.serve_forever)
            thread.start()
            try:
                with patch.object(server, "PORT", port):
                    def send(origin, state):
                        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
                        connection.request("POST", "/api/local-session", body='{"state":"' + state + '"}', headers={"Origin": origin, "Content-Type": "application/json"})
                        response = connection.getresponse()
                        response.read()
                        connection.close()
                        return response.status
                    self.assertEqual(send("https://example.org", "leave"), 403)
                    self.assertEqual(send(f"http://127.0.0.1:{port}", "active"), 200)
                    self.assertEqual(send(f"http://127.0.0.1:{port}", "leave"), 200)
                    now[0] = 5
                    self.assertTrue(local_server.browser_session.check())
                    thread.join(2)
                    self.assertFalse(thread.is_alive())
                    self.assertEqual(closed, [True])
            finally:
                if thread.is_alive():
                    local_server.shutdown()
                    thread.join(2)
        with self.assertRaises(OSError):
            http.client.HTTPConnection("127.0.0.1", port, timeout=1).connect()


if __name__ == "__main__":
    unittest.main()
