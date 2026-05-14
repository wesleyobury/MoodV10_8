"""Comprehensive mood-classification tests for the Live Feed.

Covers every real-world `mood_category` string the workout-session
analytics call can send across all 6 mood entry paths + featured workouts
+ legacy manual carts. Locks the ordering of `_LIVE_MOOD_RULES` so that
parent-mood explicitness wins over loose keyword matches (the bug behind
"Sweat - Light Weights" getting filed as Muscle Gainer).
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server import _classify_live_mood  # type: ignore


def _b(s: str) -> str:
    """Return just the bucket id for assertion ergonomics."""
    res = _classify_live_mood(s)
    assert res is not None, f"expected classification for {s!r}, got None"
    return res[0]


# ---------- SWEAT ----------
def test_sweat_subpaths():
    assert _b("Sweat - Cardio Based") == "sweat"
    assert _b("Sweat - Light Weights") == "sweat"  # regression: was muscle
    assert _b("Sweat - HIIT") == "sweat"
    assert _b("Sweat / Burn Fat - Cardio Based") == "sweat"
    assert _b("Sweat / burn fat") == "sweat"
    assert _b("I want to sweat") == "sweat"
    assert _b("HIIT - Intense Full Body") == "sweat"
    assert _b("Cardio Based") == "sweat"


# ---------- MUSCLE GAINER ----------
def test_muscle_gainer_subpaths():
    assert _b("Muscle gainer") == "muscle"
    assert _b("Muscle Gainer - Back & Bis Volume") == "muscle"
    assert _b("Muscle Gainer - Chest") == "muscle"
    assert _b("Muscle Gainer - Shoulders") == "muscle"
    assert _b("Muscle Gainer - Abs") == "muscle"
    assert _b("Muscle Gainer - Legs") == "muscle"
    assert _b("Muscle Gainer - Push Day Pump") == "muscle"
    # legacy "Muscle Building" prefix used by older generated workouts
    assert _b("Muscle Building - Chest") == "muscle"
    assert _b("Muscle Building - Back") == "muscle"
    # plain muscle-group names (legacy manual carts in legs-equipment.tsx etc.)
    assert _b("Legs") == "muscle"
    assert _b("Back & Bis Volume") == "muscle"
    assert _b("Compound Push Day") == "muscle"
    # "Light weights" without a parent mood → defaults to muscle
    assert _b("Light weights") == "muscle"


# ---------- BUILD EXPLOSION ----------
def test_explosive_subpaths():
    assert _b("Build explosion") == "explosive"
    assert _b("Build Explosion - Power Lifting") == "explosive"
    assert _b("Build Explosion - Body Weight") == "explosive"  # regression
    assert _b("Build Explosion - Light Weights") == "explosive"  # regression
    assert _b("Build Explosion - Dynamic") == "explosive"
    assert _b("Build Explosion - Triple Threat") == "explosive"
    assert _b("Plyometric Power") == "explosive"


# ---------- CALISTHENICS ----------
def test_calisthenics_subpaths():
    assert _b("Calisthenics") == "calisthenics"
    assert _b("Calisthenics - Pulls & Dips") == "calisthenics"
    assert _b("Calisthenics - Bar to Floor") == "calisthenics"
    assert _b("I want to do calisthenics") == "calisthenics"
    assert _b("Bodyweight exercises") == "calisthenics"


# ---------- OUTDOOR ----------
def test_outdoor_subpaths():
    assert _b("Outdoor - Park") == "outdoor"
    assert _b("Outdoor - Hills") == "outdoor"
    assert _b("Outdoor - Park to Peak") == "outdoor"
    assert _b("I want to get outside") == "outdoor"
    assert _b("Get Outside - Hill Workout") == "outdoor"
    assert _b("Outdoor activities") == "outdoor"


# ---------- LAZY ----------
def test_lazy_subpaths():
    assert _b("I'm feeling lazy") == "lazy"
    assert _b("I'm feeling lazy - Gentle Movement") == "lazy"
    assert _b("Lazy - Lower Body") == "lazy"
    assert _b("Gentle stretching") == "lazy"


# ---------- FEATURED WORKOUTS ----------
def test_featured_workout_subpaths():
    # v2 featured workouts use these compound types
    assert _b("Sweat / Burn Fat - Cardio Based") == "sweat"
    assert _b("Sweat - Engine Builder") == "sweat"
    assert _b("Outdoor - Park to Peak") == "outdoor"
    assert _b("Build Explosion - Triple Threat") == "explosive"
    assert _b("Muscle Gainer - Push Day Pump") == "muscle"


# ---------- AMBIGUOUS / UNKNOWN ----------
def test_unknowns_return_none():
    assert _classify_live_mood(None) is None
    assert _classify_live_mood("") is None
    assert _classify_live_mood("Custom") is None
    assert _classify_live_mood("Mixed Workout") is None


# ---------- CASE INSENSITIVITY ----------
def test_case_insensitive():
    assert _b("SWEAT - light WEIGHTS") == "sweat"
    assert _b("build EXPLOSION - body weight") == "explosive"
    assert _b("OUTDOOR - HILLS") == "outdoor"
