"""Focused offline checks for the StudyApp Local ChatGPT-plan boundary."""
from __future__ import annotations

import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).parent))

from credential_vault import CredentialVaultError  # noqa: E402
from openai_connection import ChatGptConnectionError, ChatGptPlanConnection  # noqa: E402


class MissingVault:
    def exists(self) -> bool:
        return False

    def load(self) -> str:
        raise CredentialVaultError("missing")


class LocalConnectionTests(unittest.TestCase):
    def test_missing_record_is_explicitly_disconnected(self) -> None:
        connection = ChatGptPlanConnection(MissingVault(), Path(tempfile.mkdtemp()))
        self.assertEqual(connection.status()["connectionState"], "disconnected")
        self.assertFalse(connection.status()["connected"])

    def test_connection_uses_pkce_and_the_fixed_loopback_callback(self) -> None:
        opened: list[str] = []
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as temporary, patch.object(ChatGptPlanConnection, "_require_crypto"):
            connection = ChatGptPlanConnection(MissingVault(), Path(temporary), browser_open=lambda url: opened.append(url) or True)
            connection.start("http://127.0.0.1:8766/auth/callback")
        query = parse_qs(urlparse(opened[0]).query)
        self.assertEqual(query["redirect_uri"], ["http://127.0.0.1:8766/auth/callback"])
        self.assertEqual(query["code_challenge_method"], ["S256"])
        self.assertIn("chatgpt.tokens.use.direct", query["scope"][0])
        self.assertNotIn("code_verifier", query)

    def test_question_limit_rejects_before_any_provider_request(self) -> None:
        connection = ChatGptPlanConnection(MissingVault(), Path(tempfile.mkdtemp()))
        with self.assertRaises(ChatGptConnectionError):
            connection.ask("x" * 12_001)


if __name__ == "__main__":
    unittest.main()
