"""Specialty Generator Guided Session wiring: the paywall start-gate, completion effects, and post-workout
'after' additions all reused from the same generic machinery as the Strength/Sweat/Athletic Directions
(start_gate._claimed_completed, mood_v3.completion.{run_effects,complete_workout,apply_after}), just pointed at
db.specialty_workouts with source='specialty' instead of db.v3_workouts/'v3'. Per product decision (Oct 2026):
a specialty workout counts against the weekly free workout exactly like a Direction workout, and gets the same
full post-workout metrics flow (streak/counters/workout_completed event), not a stripped-down version.

Covers: (1) the start-gate's read-side collection routing for a 'specialty:' claim key, regression-checked
against the existing 'v3:' and an unknown-source key; (2) complete_workout's effects landing in the right
collection with the right source tag; (3) apply_after writing to specialty_workouts, not v3_workouts.
"""
import asyncio
import pytest

from mood_v3.completion import CompletionHooks, apply_after, complete_workout
from mood_v3.tests.test_v3_completion import _Col, _hooks as _v3_hooks
from start_gate import _claimed_completed
import entitlement as E


class _DB:
    def __init__(self):
        self.v3_workouts = _Col(); self.specialty_workouts = _Col()
        self.users = _Col(); self.user_workouts = _Col(); self.user_events = _Col(); self.exercises = _Col()


class _Body:
    """Minimal stand-in for SpecialtyCompleteBody -- complete_workout only reads these attributes."""
    def __init__(self, performance=(), fit_rating=None, mood_after=None, duration_actual=None, started_at=None,
                 completed_steps=None, total_steps=None, local_date=None, client_session_id=None):
        self.performance = list(performance)
        self.fit_rating = fit_rating; self.mood_after = mood_after
        self.duration_actual = duration_actual; self.started_at = started_at
        self.completed_steps = completed_steps; self.total_steps = total_steps; self.local_date = local_date
        self.client_session_id = client_session_id


def _entries_from_performance(workout, performance):
    return {}  # not under test here; test_v3_completion.py already covers the real one generically


def _specialty_workout_doc(wid, uid):
    return dict(_id=wid, user_id=uid, status='generated',
                envelope=dict(workout=dict(direction='specialty', blocks=[{'items': []}])))


# ------------------------------------------------------------------ 1. start-gate collection routing

def test_claimed_completed_routes_specialty_key_to_specialty_collection():
    db = _DB()
    db.specialty_workouts.docs.append({'_id': 'S1', 'user_id': 'u1', 'status': 'completed'})
    claim = {'key': 'specialty:S1'}
    assert asyncio.run(_claimed_completed(db, 'u1', claim)) is True


def test_claimed_completed_specialty_key_false_when_not_completed_or_wrong_user():
    db = _DB()
    db.specialty_workouts.docs.append({'_id': 'S1', 'user_id': 'u1', 'status': 'generated'})
    assert asyncio.run(_claimed_completed(db, 'u1', {'key': 'specialty:S1'})) is False
    db.specialty_workouts.docs[0]['status'] = 'completed'
    assert asyncio.run(_claimed_completed(db, 'someone_else', {'key': 'specialty:S1'})) is False


def test_claimed_completed_still_routes_v3_key_to_v3_collection_unchanged():
    """Regression check: the pre-existing v3: behavior must be byte-identical after generalizing the function."""
    db = _DB()
    db.v3_workouts.docs.append({'_id': 'V1', 'user_id': 'u1', 'status': 'completed'})
    assert asyncio.run(_claimed_completed(db, 'u1', {'key': 'v3:V1'})) is True
    assert asyncio.run(_claimed_completed(db, 'u1', {'key': 'specialty:V1'})) is False  # wrong collection on purpose


def test_claimed_completed_unknown_source_fails_safe():
    db = _DB()
    assert asyncio.run(_claimed_completed(db, 'u1', {'key': 'unknown_source:X1'})) is False
    assert asyncio.run(_claimed_completed(db, 'u1', None)) is False
    assert asyncio.run(_claimed_completed(db, 'u1', {'key': ''})) is False


# ------------------------------------------------------------------ 2. complete_workout effects, generalized

def test_complete_workout_specialty_tags_source_and_writes_specialty_collection_only():
    db = _DB()
    db.users.docs.append({'_id': 'u1', 'workouts_count': 0})
    db.specialty_workouts.docs.append(_specialty_workout_doc('S1', 'u1'))
    events = []
    hooks = _v3_hooks(db, events)

    out = asyncio.run(complete_workout(db, 'S1', 'u1', _Body(fit_rating='just_right', duration_actual=42),
                                        hooks, _entries_from_performance, col=db.specialty_workouts, source='specialty'))

    assert out['status'] == 'completed'
    # effects landed on specialty_workouts, never created a v3_workouts doc
    assert len(db.v3_workouts.docs) == 0
    sdoc = db.specialty_workouts.docs[0]
    assert sdoc['status'] == 'completed' and sdoc['effects_done'] is True

    # user_workouts row tagged with the real source, not a hardcoded 'v3'
    row = db.user_workouts.docs[0]
    assert row['source'] == 'specialty' and row['v3_workout_id'] == 'S1'

    # counters ran: workouts_count incremented, weekly free workout claimed
    assert db.users.docs[0]['workouts_count'] == 1
    assert E.FIRST_FREE_WORKOUT_FIELD in db.users.docs[0]

    # canonical workout_completed event fired with source='specialty' (streak math doesn't care about source,
    # but downstream consumers that DO branch on it, e.g. the Direction-only live-activity feed in server.py,
    # need the real tag to correctly exclude specialty rather than silently miscounting it as a Direction)
    assert len(events) == 1
    uid, etype, md = events[0]
    assert etype == 'workout_completed' and md['source'] == 'specialty'


def test_complete_workout_specialty_is_idempotent_on_repeat():
    db = _DB()
    db.users.docs.append({'_id': 'u1', 'workouts_count': 0})
    db.specialty_workouts.docs.append(_specialty_workout_doc('S1', 'u1'))
    hooks = _v3_hooks(db, [])

    first = asyncio.run(complete_workout(db, 'S1', 'u1', _Body(), hooks, _entries_from_performance,
                                          col=db.specialty_workouts, source='specialty'))
    second = asyncio.run(complete_workout(db, 'S1', 'u1', _Body(), hooks, _entries_from_performance,
                                           col=db.specialty_workouts, source='specialty'))
    assert first['status'] == 'completed'
    assert second['status'] == 'already_completed'
    assert db.users.docs[0]['workouts_count'] == 1  # never double-counted


def test_complete_workout_without_hooks_only_records_completion():
    """Mirrors build_v3_router's own documented fallback: hooks=None still records the completion, runs no side effects."""
    db = _DB()
    db.specialty_workouts.docs.append(_specialty_workout_doc('S1', 'u1'))
    out = asyncio.run(complete_workout(db, 'S1', 'u1', _Body(), None, _entries_from_performance,
                                        col=db.specialty_workouts, source='specialty'))
    assert out['status'] == 'completed'
    assert len(db.user_workouts.docs) == 0  # no hooks, no side effects -- by design, not a bug


# ------------------------------------------------------------------ 3. apply_after, generalized

def test_apply_after_specialty_writes_specialty_collection_only():
    db = _DB()
    db.specialty_workouts.docs.append({'_id': 'S1', 'user_id': 'u1', 'status': 'completed'})
    db.user_workouts.docs.append({'user_id': 'u1', 'v3_workout_id': 'S1'})

    out = asyncio.run(apply_after(db, 'S1', 'u1', dict(fit_rating='too_much', calories=410, steps=5200),
                                   col=db.specialty_workouts))

    assert out['status'] == 'saved'
    assert len(db.v3_workouts.docs) == 0  # never touched the Direction collection
    sdoc = db.specialty_workouts.docs[0]
    assert sdoc['after']['fit_rating'] == 'too_much' and sdoc['fit_rating'] == 'too_much'
    assert sdoc['after']['calories'] == 410
    assert db.user_workouts.docs[0]['calories_burned'] == 410
    assert db.user_workouts.docs[0]['session_steps'] == 5200


def test_apply_after_specialty_requires_completed_status_same_as_direction():
    """apply_after itself only $sets when the filter matches; a generated (not completed) workout is left alone --
    the specialty router's /after handler is responsible for the explicit 409, this just proves the $set is scoped."""
    db = _DB()
    db.specialty_workouts.docs.append({'_id': 'S1', 'user_id': 'u1', 'status': 'generated'})
    out = asyncio.run(apply_after(db, 'S1', 'u1', dict(fit_rating='too_easy'), col=db.specialty_workouts))
    assert out['status'] == 'saved'  # apply_after reports what it tried; the update itself no-ops (status != completed)
    assert 'after' not in db.specialty_workouts.docs[0]
