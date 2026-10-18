"""Windows-user-scoped encrypted storage for the StudyApp Local connection."""
from __future__ import annotations

import ctypes
import os
from ctypes import wintypes
from pathlib import Path


class CredentialVaultError(RuntimeError):
    """A safe-to-display failure that never contains credential material."""


class _DataBlob(ctypes.Structure):
    _fields_ = [("cbData", wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_byte))]


class WindowsDpapi:
    """Minimal dependency-free Windows DPAPI wrapper for one current user."""

    _UI_FORBIDDEN = 0x1

    def __init__(self) -> None:
        if os.name != "nt":
            raise CredentialVaultError("The StudyApp Local ChatGPT connection is available only on Windows.")
        self._crypt32 = ctypes.WinDLL("Crypt32", use_last_error=True)
        self._kernel32 = ctypes.WinDLL("Kernel32", use_last_error=True)
        self._crypt32.CryptProtectData.argtypes = [ctypes.POINTER(_DataBlob), wintypes.LPCWSTR, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(_DataBlob)]
        self._crypt32.CryptProtectData.restype = wintypes.BOOL
        self._crypt32.CryptUnprotectData.argtypes = [ctypes.POINTER(_DataBlob), ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(_DataBlob)]
        self._crypt32.CryptUnprotectData.restype = wintypes.BOOL
        self._kernel32.LocalFree.argtypes = [ctypes.c_void_p]
        self._kernel32.LocalFree.restype = ctypes.c_void_p

    @staticmethod
    def _input(value: bytes) -> tuple[_DataBlob, ctypes.Array[ctypes.c_byte]]:
        buffer = (ctypes.c_byte * len(value)).from_buffer_copy(value)
        return _DataBlob(len(value), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_byte))), buffer

    def _output(self, value: _DataBlob) -> bytes:
        try:
            return ctypes.string_at(value.pbData, value.cbData)
        finally:
            if value.pbData:
                self._kernel32.LocalFree(value.pbData)

    def protect(self, value: bytes) -> bytes:
        source, _buffer = self._input(value)
        output = _DataBlob()
        if not self._crypt32.CryptProtectData(ctypes.byref(source), "StudyApp Local ChatGPT connection", None, None, None, self._UI_FORBIDDEN, ctypes.byref(output)):
            raise CredentialVaultError("Windows could not protect the ChatGPT connection.")
        return self._output(output)

    def unprotect(self, value: bytes) -> bytes:
        source, _buffer = self._input(value)
        output = _DataBlob()
        if not self._crypt32.CryptUnprotectData(ctypes.byref(source), None, None, None, None, self._UI_FORBIDDEN, ctypes.byref(output)):
            raise CredentialVaultError("Windows could not open the protected ChatGPT connection.")
        return self._output(output)


class CredentialVault:
    """Stores only a DPAPI blob under the current Windows user's local profile."""

    def __init__(self) -> None:
        local_app_data = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
        self._path = local_app_data / "MarkellosStudyApp" / "credentials" / "chatgpt-plan.connection.dpapi"

    def exists(self) -> bool:
        return self._path.is_file()

    def store(self, record: str) -> None:
        protected = WindowsDpapi().protect(record.encode("utf-8"))
        self._path.parent.mkdir(parents=True, exist_ok=True)
        temporary = self._path.with_suffix(".tmp")
        try:
            temporary.write_bytes(protected)
            os.replace(temporary, self._path)
        except OSError as error:
            temporary.unlink(missing_ok=True)
            raise CredentialVaultError("The protected ChatGPT connection could not be saved locally.") from error

    def load(self) -> str:
        if not self._path.is_file():
            raise CredentialVaultError("No ChatGPT connection is stored for this Windows user.")
        try:
            return WindowsDpapi().unprotect(self._path.read_bytes()).decode("utf-8")
        except (OSError, UnicodeDecodeError, CredentialVaultError) as error:
            raise CredentialVaultError("The stored ChatGPT connection is unavailable.") from error

    def remove(self) -> bool:
        existed = self._path.is_file()
        try:
            self._path.unlink(missing_ok=True)
        except OSError as error:
            raise CredentialVaultError("The protected ChatGPT connection could not be removed locally.") from error
        return existed
