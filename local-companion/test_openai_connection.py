"""Focused offline checks for the StudyApp Local ChatGPT-plan boundary."""
from __future__ import annotations

import json
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


class MemoryVault:
    def __init__(self, record: dict | None = None) -> None:
        self.record = json.dumps(record) if record is not None else None

    def exists(self) -> bool:
        return self.record is not None

    def load(self) -> str:
        if self.record is None:
            raise CredentialVaultError("missing")
        return self.record

    def store(self, value: str) -> None:
        self.record = value

    def remove(self) -> None:
        self.record = None


class FakeResponse:
    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def __iter__(self):
        return iter([
            b'data: {"type":"response.output_text.delta","delta":"Answer [S1, p. 4]"}\n',
            b'data: {"type":"response.completed"}\n',
        ])


class FakeOpener:
    def __init__(self, request_body: dict) -> None:
        self.request_body = request_body

    def open(self, request, timeout: int):
        self.request_body.update(json.loads(request.data.decode("utf-8")))
        return FakeResponse()


class LocalConnectionTests(unittest.TestCase):
    def test_missing_record_is_explicitly_disconnected(self) -> None:
        connection = ChatGptPlanConnection(MissingVault(), Path(tempfile.mkdtemp()))
        self.assertEqual(connection.status()["connectionState"], "disconnected")
        self.assertFalse(connection.status()["connected"])

    def test_connection_uses_pkce_and_the_fixed_loopback_callback(self) -> None:
        opened: list[str] = []
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as temporary, patch.object(ChatGptPlanConnection, "_require_crypto"):
            connection = ChatGptPlanConnection(MissingVault(), Path(temporary), browser_open=lambda url: opened.append(url) or True)
            connection.start("http://127.0.0.1:8767/auth/callback")
        query = parse_qs(urlparse(opened[0]).query)
        self.assertEqual(query["redirect_uri"], ["http://127.0.0.1:8767/auth/callback"])
        self.assertEqual(query["code_challenge_method"], ["S256"])
        self.assertIn("chatgpt.tokens.use.direct", query["scope"][0])
        self.assertNotIn("code_verifier", query)

    def test_connection_rejects_the_previous_callback_port(self) -> None:
        connection = ChatGptPlanConnection(MissingVault(), Path(tempfile.mkdtemp()))
        with patch.object(ChatGptPlanConnection, "_require_crypto"):
            with self.assertRaises(ChatGptConnectionError):
                connection.start("http://127.0.0.1:8766/auth/callback")

    def test_question_limit_rejects_before_any_provider_request(self) -> None:
        connection = ChatGptPlanConnection(MissingVault(), Path(tempfile.mkdtemp()))
        with self.assertRaises(ChatGptConnectionError):
            connection.ask("x" * 12_001)

    def test_pdf_sources_send_only_approved_passages_without_storage(self) -> None:
        captured: dict = {}
        connection = ChatGptPlanConnection(MemoryVault({"planUsageAuthorized": True}), Path(tempfile.mkdtemp()))
        passage = {"sourceId": "S1", "documentId": "doc-1", "documentTitle": "Biology.pdf", "page": 4, "text": "Mitochondria release energy."}
        with patch.object(connection, "_record", return_value={"planUsageAuthorized": True}), \
             patch.object(connection, "_models", return_value=["available-model"]), \
             patch.object(connection, "_access_token", return_value="test-token"), \
             patch("openai_connection.build_opener", return_value=FakeOpener(captured)):
            answer = connection.ask_with_sources("What releases energy?", [passage])

        self.assertEqual(answer["answer"], "Answer [S1, p. 4]")
        self.assertIs(captured["store"], False)
        self.assertEqual([item["role"] for item in captured["input"]], ["developer", "user"])
        user_payload = json.loads(captured["input"][1]["content"])
        self.assertEqual(user_payload["question"], "What releases energy?")
        self.assertEqual(user_payload["selectedPassages"][0]["text"], "Mitochondria release energy.")
        self.assertNotIn("documentId", user_payload["selectedPassages"][0])
        self.assertNotIn("unselected-secret", json.dumps(captured))

    def test_pdf_source_validation_rejects_invalid_or_unapproved_passages(self) -> None:
        connection = ChatGptPlanConnection(MissingVault(), Path(tempfile.mkdtemp()))
        with self.assertRaises(ChatGptConnectionError):
            connection.ask_with_sources("Question", [])
        with self.assertRaises(ChatGptConnectionError):
            connection.ask_with_sources("Question", [{"sourceId": "S2", "documentTitle": "Bad.pdf", "page": 1, "text": "Text"}])
        with self.assertRaises(ChatGptConnectionError):
            connection.ask_with_sources("Question", [{"sourceId": "S1", "documentTitle": "Bad.pdf", "page": True, "text": "Text"}])

    def test_reauthorization_keeps_issued_client_when_callback_omits_client_id(self) -> None:
        issued_client_id = "oaiapp_studyapp"
        vault = MemoryVault({
            "subject": "person", "clientId": issued_client_id, "idToken": "previous-id-token",
            "email": "person@example.com", "refreshToken": "refresh", "planUsageAuthorized": True,
        })
        opened: list[str] = []
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as temporary, patch.object(ChatGptPlanConnection, "_require_crypto"), patch.object(ChatGptPlanConnection, "_exchange_tokens", return_value={"id_token": "new-id-token", "refresh_token": "new-refresh", "access_token": "access", "scope": "openid chatgpt.tokens.use.direct"}), patch.object(ChatGptPlanConnection, "_validate_identity", return_value={"sub": "person", "email": "person@example.com"}):
            connection = ChatGptPlanConnection(vault, Path(temporary), browser_open=lambda url: opened.append(url) or True)
            connection._save_client_id(issued_client_id)
            connection.start("http://127.0.0.1:8767/auth/callback")
            query = parse_qs(urlparse(opened[0]).query)
            self.assertEqual(query["client_id"], [issued_client_id])
            self.assertEqual(query["id_token_hint"], ["previous-id-token"])
            self.assertEqual(query["login_hint"], ["person@example.com"])
            status = connection.complete({"state": query["state"][0], "code": "authorization-code"})
        self.assertTrue(status["connected"])
        self.assertTrue(status["planUsageAuthorized"])


if __name__ == "__main__":
    unittest.main()
