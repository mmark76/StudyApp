"""Bound a Local server session to the single StudyApp browser tab."""
from threading import Event, Lock, Thread
from time import monotonic
from typing import Callable


class BrowserSession:
    def __init__(self, on_expire: Callable[[], None], *, clock: Callable[[], float] = monotonic) -> None:
        self._on_expire = on_expire
        self._clock = clock
        self._lock = Lock()
        self._deadline = clock() + 120
        self._ended = False
        self._stop = Event()

    def heartbeat(self) -> bool:
        with self._lock:
            if self._ended:
                return False
            self._deadline = self._clock() + 90
            return True

    def leave(self) -> None:
        with self._lock:
            if not self._ended:
                self._deadline = min(self._deadline, self._clock() + 5)

    def check(self) -> bool:
        with self._lock:
            if self._ended or self._clock() < self._deadline:
                return False
            self._ended = True
        self._on_expire()
        return True

    def start(self) -> None:
        def watch() -> None:
            while not self._stop.wait(1):
                if self.check():
                    return
        Thread(target=watch, name="studyapp-browser-session", daemon=True).start()

    def stop(self) -> None:
        self._stop.set()
