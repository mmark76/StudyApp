import contextlib
import errno
import io
import socket
import unittest
from unittest.mock import patch

import server


class PortConflictTests(unittest.TestCase):
    def test_real_unrelated_listener_is_left_running(self):
        for exclusive in (False, True):
            if exclusive and not hasattr(socket, "SO_EXCLUSIVEADDRUSE"):
                continue
            with self.subTest(exclusive=exclusive), socket.socket() as listener:
                if exclusive:
                    listener.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1)
                listener.bind(("127.0.0.1", 0))
                listener.listen()
                port = listener.getsockname()[1]
                with patch.object(server, "PORT", port), patch.object(server.webbrowser, "open") as browser, \
                     contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(server.main(), 1)
                self.assertEqual(listener.getsockname()[1], port)
                browser.assert_not_called()

    def test_occupied_port_reports_safe_next_steps_without_opening_browser(self):
        output = io.StringIO()
        with patch.object(server, "StudyAppLocalServer", side_effect=OSError(errno.EADDRINUSE, "in use")), \
             patch.object(server.webbrowser, "open") as browser, contextlib.redirect_stdout(output):
            self.assertEqual(server.main(), 1)
        message = output.getvalue()
        self.assertIn("port 8767 is in use or unavailable", message)
        self.assertIn("another application", message)
        self.assertIn("Stop StudyApp Local Server.bat", message)
        self.assertIn("Η θύρα χρησιμοποιείται ή δεν είναι διαθέσιμη", message)
        browser.assert_not_called()

    def test_unrelated_socket_error_is_not_reported_as_a_port_conflict(self):
        with patch.object(server, "StudyAppLocalServer", side_effect=OSError(errno.EACCES, "denied")):
            with self.assertRaises(OSError):
                server.main()


if __name__ == "__main__":
    unittest.main()
