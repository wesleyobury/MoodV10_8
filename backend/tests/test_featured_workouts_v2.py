"""
Backend tests for Featured Workouts v2 (6 picks).

Validates:
  - GET /api/featured/bundle returns 6 workouts with expected titles
  - GET /api/featured/config returns 6 featuredWorkoutIds matching bundle
  - Exercise counts per workout
  - Hero image URLs (job_564800a5 for v2 assets; legacy URL for Bar to Floor)
  - workoutType values exist on exercises and drive cart sub-path dividers
  - Triple Threat has cartSizeOverride: 3
  - POST /api/featured/workouts/batch returns all 6 workouts populated
"""

import os
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://mood-build.preview.emergentagent.com",
).rstrip("/")

EXPECTED_TITLES = [
    "Sweat - Engine Builder",
    "Outdoor - Park to Peak",
    "Calisthenics - Bar to Floor",
    "MOOD Mix - Air & Abs",
    "Build Explosion - Triple Threat",
    "Muscle Gainer - Push Day Pump",
]

EXPECTED_EXERCISE_COUNTS = {
    "Sweat - Engine Builder": 3,
    "Outdoor - Park to Peak": 2,
    "Calisthenics - Bar to Floor": 3,
    "MOOD Mix - Air & Abs": 4,
    "Build Explosion - Triple Threat": 3,
    "Muscle Gainer - Push Day Pump": 6,
}

EXPECTED_WORKOUT_TYPES = {
    "Sweat - Cardio Based",
    "Sweat - Light Weights",
    "Outdoor - Park",
    "Outdoor - Hills",
    "Calisthenics",
    "Build Explosion - Body Weight",
    "Build Explosion - Light Weights",
    "Build Explosion - Dynamic",
    "Muscle Gainer - Chest",
    "Muscle Gainer - Shoulders",
    "Muscle Gainer - Triceps",
    "Muscle Gainer - Abs",
}

V2_HERO_FRAGMENT = "job_564800a5"
LEGACY_BAR_TO_FLOOR_TITLE = "Calisthenics - Bar to Floor"


# ---------- Shared fixtures ----------
@pytest.fixture(scope="module")
def bundle():
    r = requests.get(f"{BASE_URL}/api/featured/bundle", timeout=15)
    assert r.status_code == 200, f"bundle returned {r.status_code}: {r.text[:200]}"
    return r.json()


@pytest.fixture(scope="module")
def config():
    r = requests.get(f"{BASE_URL}/api/featured/config", timeout=15)
    assert r.status_code == 200, f"config returned {r.status_code}: {r.text[:200]}"
    return r.json()


@pytest.fixture(scope="module")
def workouts(bundle):
    ws = bundle.get("workouts") or bundle.get("featuredWorkouts") or []
    assert ws, f"bundle missing workouts list: keys={list(bundle.keys())}"
    return ws


# ---------- Module: /api/featured/bundle ----------
class TestFeaturedBundle:
    def test_bundle_has_six_workouts(self, workouts):
        assert len(workouts) == 6

    def test_bundle_titles_match_v2(self, workouts):
        titles = [w.get("title") for w in workouts]
        for t in EXPECTED_TITLES:
            assert t in titles, f"Missing v2 title: {t}. Got: {titles}"

    def test_no_old_featured_workouts_present(self, workouts):
        titles = [w.get("title", "") for w in workouts]
        # Sanity: no obviously old/legacy titles. v2 list is exactly 6 above.
        assert set(titles) == set(EXPECTED_TITLES), f"Unexpected titles: {titles}"


# ---------- Module: /api/featured/config ----------
class TestFeaturedConfig:
    def test_config_has_six_ids(self, config):
        ids = config.get("featuredWorkoutIds", [])
        assert len(ids) == 6, f"Expected 6 ids, got {len(ids)}"

    def test_config_ids_match_bundle_workouts(self, config, workouts):
        ids = config.get("featuredWorkoutIds", [])
        # Build id set from bundle (workout id may be _id or id)
        bundle_ids = {str(w.get("_id") or w.get("id")) for w in workouts}
        for wid in ids:
            assert str(wid) in bundle_ids, (
                f"Config id {wid} not present in bundle ids {bundle_ids}"
            )


# ---------- Module: Exercise counts per workout ----------
class TestExerciseCounts:
    def test_exercise_counts_per_workout(self, workouts):
        by_title = {w["title"]: w for w in workouts}
        for title, expected in EXPECTED_EXERCISE_COUNTS.items():
            assert title in by_title, f"Workout '{title}' missing from bundle"
            actual = len(by_title[title].get("exercises", []))
            assert actual == expected, (
                f"'{title}' expected {expected} exercises, got {actual}"
            )


# ---------- Module: workoutType sub-path drivers ----------
class TestWorkoutTypes:
    def test_all_expected_workout_types_present(self, workouts):
        found = set()
        for w in workouts:
            for e in w.get("exercises", []):
                wt = e.get("workoutType")
                if wt:
                    found.add(wt)
        missing = EXPECTED_WORKOUT_TYPES - found
        assert not missing, f"Missing workoutType values: {missing}"

    def test_every_exercise_has_workout_type(self, workouts):
        offenders = []
        for w in workouts:
            for e in w.get("exercises", []):
                if not e.get("workoutType"):
                    offenders.append(f"{w['title']} :: {e.get('name')}")
        assert not offenders, f"Exercises missing workoutType: {offenders}"


# ---------- Module: Hero images ----------
class TestHeroImages:
    def test_v2_hero_images_use_job_564800a5(self, workouts):
        v2_titles = [
            "Build Explosion - Triple Threat",
            "Muscle Gainer - Push Day Pump",
            "Sweat - Engine Builder",
            "Outdoor - Park to Peak",
            "MOOD Mix - Air & Abs",
        ]
        by_title = {w["title"]: w for w in workouts}
        for t in v2_titles:
            hero = by_title[t].get("heroImageUrl", "")
            assert V2_HERO_FRAGMENT in hero, (
                f"{t} heroImageUrl missing '{V2_HERO_FRAGMENT}': {hero}"
            )

    def test_bar_to_floor_uses_legacy_hero(self, workouts):
        by_title = {w["title"]: w for w in workouts}
        hero = by_title[LEGACY_BAR_TO_FLOOR_TITLE].get("heroImageUrl", "")
        assert hero, "Bar to Floor has no heroImageUrl"
        # Should NOT be the v2 customer-assets job_564800a5 URL
        assert V2_HERO_FRAGMENT not in hero, (
            f"Bar to Floor should use legacy URL, got v2 url: {hero}"
        )
        assert hero.startswith("http"), f"Invalid URL: {hero}"


# ---------- Module: Triple Threat cartSizeOverride ----------
class TestCartSizeOverride:
    def test_triple_threat_cart_size_override_is_3(self, workouts):
        by_title = {w["title"]: w for w in workouts}
        triple = by_title["Build Explosion - Triple Threat"]
        assert triple.get("cartSizeOverride") == 3, (
            f"Triple Threat cartSizeOverride expected 3, got "
            f"{triple.get('cartSizeOverride')}"
        )


# ---------- Module: POST /api/featured/workouts/batch ----------
class TestBatchEndpoint:
    def test_batch_returns_all_six(self, config):
        ids = config.get("featuredWorkoutIds", [])
        assert len(ids) == 6

        # Endpoint signature: async def get_featured_workouts_batch(ids: List[str])
        # FastAPI binds a top-level List[str] as the raw JSON body array.
        r = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=ids,
            timeout=15,
        )
        assert r.status_code == 200, f"batch {r.status_code}: {r.text[:200]}"
        body = r.json()
        ws = body.get("workouts", [])
        assert isinstance(ws, list), f"Unexpected batch response shape: {type(ws)}"
        assert len(ws) == 6, f"Expected 6 workouts, got {len(ws)}"
        titles = [w.get("title") for w in ws]
        for t in EXPECTED_TITLES:
            assert t in titles, f"Batch missing title: {t}. Got: {titles}"

    def test_batch_workouts_have_exercises_populated(self, config):
        ids = config.get("featuredWorkoutIds", [])
        r = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=ids,
            timeout=15,
        )
        assert r.status_code == 200, f"batch {r.status_code}: {r.text[:200]}"
        body = r.json()
        ws = body.get("workouts", [])
        for w in ws:
            assert w.get("exercises"), (
                f"Workout '{w.get('title')}' has no exercises in batch response"
            )
