"""
Förhindrar riktiga SMS/e-post under pytest (även om .env har hellosms + TEST_MODE=false).
"""
from unittest.mock import patch

import pytest

from app.schemas import SMSResponse
from datetime import datetime


@pytest.fixture(autouse=True)
def _no_real_notifications():
    fake_sms = SMSResponse(
        status="sent",
        message_id="test_mock",
        timestamp=datetime.utcnow(),
    )
    with (
        patch("app.services.notification_service.send_sms", return_value=fake_sms),
        patch("app.services.notification_service.send_email", return_value=None),
        patch("app.services.sms_service.send_sms", return_value=fake_sms),
    ):
        yield
