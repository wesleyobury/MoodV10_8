"""Regression tests for the Live Feed endpoint (/api/feed/live)."""
import os
import sys
from datetime import datetime, timezone, timedelta

# Make backend importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import _classify_live_mood, _format_relative_time, _LIVE_BUCKET_LABELS  # type: ignore


def test_classify_mood_sweat():
    assert _classify_live_mood("Sweat / burn fat") == ("sweat", "Sweat / burn fat")
    assert _classify_live_mood("I want to sweat") == ("sweat", "Sweat / burn fat")
    assert _classify_live_mood("HIIT - Intense Full Body") == ("sweat", "Sweat / burn fat")
    assert _classify_live_mood("Cardio Based") == ("sweat", "Sweat / burn fat")


def test_classify_mood_muscle():
    assert _classify_live_mood("Muscle gainer")[0] == "muscle"
    assert _classify_live_mood("Muscle Gainer - Back & Bis Volume")[0] == "muscle"
    assert _classify_live_mood("Light weights")[0] == "muscle"


def test_classify_mood_explosive():
    assert _classify_live_mood("Build explosion")[0] == "explosive"
    assert _classify_live_mood("Build Explosion - Power Lifting")[0] == "explosive"


def test_classify_mood_calisthenics():
    assert _classify_live_mood("I want to do calisthenics")[0] == "calisthenics"
    assert _classify_live_mood("Calisthenics - Pulls & Dips")[0] == "calisthenics"
    assert _classify_live_mood("Bodyweight exercises")[0] == "calisthenics"


def test_classify_mood_outdoor():
    assert _classify_live_mood("I want to get outside")[0] == "outdoor"
    assert _classify_live_mood("Get Outside - Hill Workout")[0] == "outdoor"
    assert _classify_live_mood("Outdoor activities")[0] == "outdoor"


def test_classify_mood_lazy():
    assert _classify_live_mood("I'm feeling lazy")[0] == "lazy"


def test_classify_mood_unknown_returns_none():
    assert _classify_live_mood("Custom") is None
    assert _classify_live_mood(None) is None
    assert _classify_live_mood("") is None
    # Mixed Workout doesn't match any keyword
    assert _classify_live_mood("Mixed Workout") is None


def test_format_relative_time():
    now = datetime.now(timezone.utc)
    assert _format_relative_time(now) == "just now"
    assert _format_relative_time(now - timedelta(seconds=30)) == "just now"
    assert _format_relative_time(now - timedelta(minutes=1)) == "1 min ago"
    assert _format_relative_time(now - timedelta(minutes=5)) == "5 min ago"
    assert _format_relative_time(now - timedelta(hours=1)) == "1 hr ago"
    assert _format_relative_time(now - timedelta(hours=3)) == "3 hr ago"
    assert _format_relative_time(now - timedelta(days=1)) == "yesterday"
    assert _format_relative_time(now - timedelta(days=3)) == "3 days ago"
    assert _format_relative_time(now - timedelta(days=10)) == "last week"
    assert _format_relative_time(now - timedelta(days=30)) == "earlier"


def test_bucket_labels_complete():
    """All 6 buckets must have a display label."""
    expected = {"sweat", "muscle", "explosive", "lazy", "calisthenics", "outdoor"}
    assert set(_LIVE_BUCKET_LABELS.keys()) == expected
