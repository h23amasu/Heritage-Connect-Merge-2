"""
In-memory cooldown for the shared notification API.
Uses user_id + to + channel (+ optional site_id) per course spec.
"""
from datetime import datetime, timedelta
from threading import Lock
from typing import Optional

from app.core.config import settings


class CooldownService:
    def __init__(self) -> None:
        self._lock = Lock()
        self._last_sent: dict[str, datetime] = {}

    def _key(
        self,
        channel: str,
        to: str,
        user_id: Optional[str] = None,
        site_id: Optional[str] = None,
    ) -> str:
        parts = [channel, to]
        if user_id:
            parts.append(str(user_id))
        if site_id:
            parts.append(str(site_id))
        return ":".join(parts)

    def is_on_cooldown(
        self,
        channel: str,
        to: str,
        user_id: Optional[str] = None,
        site_id: Optional[str] = None,
    ) -> bool:
        key = self._key(channel, to, user_id, site_id)
        cutoff = datetime.utcnow() - timedelta(seconds=settings.NOTIFICATION_COOLDOWN_SECONDS)
        with self._lock:
            last = self._last_sent.get(key)
            return last is not None and last > cutoff

    def record_send(
        self,
        channel: str,
        to: str,
        user_id: Optional[str] = None,
        site_id: Optional[str] = None,
    ) -> None:
        key = self._key(channel, to, user_id, site_id)
        with self._lock:
            self._last_sent[key] = datetime.utcnow()

    def clear(self) -> None:
        """Used in tests."""
        with self._lock:
            self._last_sent.clear()


cooldown_service = CooldownService()
