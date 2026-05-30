"""Tester för demo-geofencing (ett SMS per världsarv)."""
from app.services.geofencing_demo import (
    _demo_notified,
    _demo_users,
    clear_demo_site_notified,
    mark_demo_site_notified,
    process_location_demo,
)

FALUN = (60.60472, 15.63083)
REMOTE = (68.0, 20.0)


def setup_function():
    _demo_users.clear()
    _demo_notified.clear()


def test_sends_sms_once_per_site_when_traveling():
    phone = "+46701234567"

    first = process_location_demo(phone, REMOTE[0], REMOTE[1])
    assert first["success"] is True
    assert first["notified"] is False

    near_falun = process_location_demo(phone, FALUN[0], FALUN[1])
    assert near_falun["notified"] is True
    assert near_falun["nearest_site"]["name"]
    assert near_falun["reason"] is None

    repeat = process_location_demo(phone, FALUN[0], FALUN[1])
    assert repeat["notified"] is False
    assert repeat["reason"] == "already_notified"


def test_normalizes_phone_number():
    process_location_demo("076-100 44 65", REMOTE[0], REMOTE[1])
    travel = process_location_demo("+46761004465", FALUN[0], FALUN[1])
    assert travel["notified"] is True


def test_mark_visited_blocks_repeat_notification():
    phone = "+46709998877"
    process_location_demo(phone, REMOTE[0], REMOTE[1])
    sent = process_location_demo(phone, FALUN[0], FALUN[1])
    assert sent["notified"] is True

    site_id = sent["nearest_site"]["unesco_id"]
    clear_demo_site_notified(phone, site_id)
    mark_demo_site_notified(phone, site_id)

    blocked = process_location_demo(phone, FALUN[0], FALUN[1])
    assert blocked["notified"] is False
    assert blocked["reason"] == "already_notified"
