"""V3 workout completion: one idempotent call that records the workout exactly once (Guided Session).

POST /api/v3/workouts/{id}/complete runs, for a given workout id:

  1. the winner transition   v3_workouts: status generated -> completed, atomically (find_one_and_update with a status guard).
                             Only one request can win; every other request (double tap, retry, concurrent) gets 200 with
                             status 'already_completed' and the stored result.
  2. side effects            run only for a completed workout, each at most once, keyed by the workout id:
       user_workout          user_workouts row upserted on {user_id, v3_workout_id} (history, home summary). Idempotent.
       counters              users.workouts_count + 1, and (non-entitled users only) the weekly free-workout allowance is
                             booked with entitlement.consume_free_workout_update. Claimed once via effects.counters.
       event                 the canonical `workout_completed` event (source 'v3') through the same path as
                             /api/analytics/track, so retention streaks and achievements update server-side, even for
                             users who opt out of client analytics. Claimed once via effects.event.
     `effects_done` is set when all three have run. A later duplicate call re-runs any effect that never ran (the process
     died between the transition and the effects); a claimed effect is never repeated, so nothing can double-count.

Starting, generating, swapping, abandoning or ending early never touch any of this. Since Oct 2026 the paywall is enforced
at START (backend/start_gate.py: one free started workout per ISO week, starting a second needs access); the weekly
counter booked here is kept for analytics only, and completion also claims the week's free workout if no start did
(hooks.claim_first_workout).

The server supplies the account-specific pieces through CompletionHooks (server.py); without hooks (tests of the generator
router, older mounts) only step 1 runs, exactly as before.
"""
from __future__ import annotations
import datetime as _dt, logging
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Optional

log = logging.getLogger('mood_v3')


@dataclass
class CompletionHooks:
    load_user: Callable[[str], Awaitable[Optional[dict]]]            # user id -> users doc
    user_filter: Callable[[str], dict]                               # user id -> Mongo filter for db.users
    has_access: Callable[[dict], bool]                               # entitlement.has_full_access (+ admin)
    consume_free_update: Callable[[dict], dict]                      # entitlement.consume_free_workout_update
    free_remaining: Callable[[dict], int]                            # entitlement.free_workouts_remaining
    free_reset_at: Callable[[], Any]                                 # entitlement.free_period_resets_at
    track_event: Callable[[str, str, dict], Awaitable[None]]         # (user id, event type, metadata) incl. retention
    # Oct 2026 weekly-free-workout rule: (user id, workout id) -> claim this week's free workout if no start claimed
    # it (an offline fail-open start never reached the gate). Idempotent; None in older mounts / tests.
    claim_first_workout: Optional[Callable[[str, str], Awaitable[None]]] = None


def _now():
    return _dt.datetime.now(_dt.timezone.utc)


def _iso(v):
    return v.isoformat() if isinstance(v, _dt.datetime) else v


async def _claim(col, workout_id: str, name: str) -> bool:
    """Atomically claim a one-time effect on the workout doc. True for exactly one caller."""
    res = await col.find_one_and_update({'_id': workout_id, f'effects.{name}': {'$exists': False}}, {'$set': {f'effects.{name}': _now()}})
    return res is not None


# A duplicate request only repairs effects of a completion older than this, so it never races the winner's own effects.
REPAIR_AFTER_SEC = 30


async def run_effects(db, workout_id: str, user_id: str, hooks: Optional[CompletionHooks], *, repair_only: bool = False) -> dict:
    """Run every completion side effect that has not run yet. Returns what this call did (for tests / logs).
    repair_only: called from a duplicate request; skip while the winning request may still be running its effects."""
    did = {'user_workout': False, 'counters': False, 'event': False, 'free_workout_consumed': False}
    if hooks is None:
        return did
    col = db.v3_workouts
    doc = await col.find_one({'_id': workout_id})
    if not doc or doc.get('status') != 'completed' or doc.get('effects_done'):
        return did
    w = (doc.get('envelope') or {}).get('workout') or {}
    completed_at = doc.get('completed_at') or _now()
    if repair_only and isinstance(completed_at, _dt.datetime):
        ca = completed_at if completed_at.tzinfo else completed_at.replace(tzinfo=_dt.timezone.utc)
        if (_now() - ca).total_seconds() < REPAIR_AFTER_SEC:
            return did

    # user_workouts row (idempotent upsert)
    try:
        row = {
            'user_id': user_id, 'workout_id': workout_id, 'v3_workout_id': workout_id, 'source': 'v3',
            'completed_at': completed_at, 'created_at': _now(), 'duration_actual': doc.get('duration_actual'),
            'direction': w.get('direction'), 'archetype': (w.get('archetype') or {}).get('id'),
        }
        res = await db.user_workouts.update_one({'user_id': user_id, 'v3_workout_id': workout_id}, {'$setOnInsert': row}, upsert=True)
        did['user_workout'] = bool(getattr(res, 'upserted_id', None))
    except Exception as e:
        log.error(f'v3 complete: user_workouts upsert failed for {workout_id}: {e}')
        return did   # retry later (effects_done stays unset)

    # counters: workouts_count + weekly free allowance (at most once)
    if await _claim(col, workout_id, 'counters'):
        did['counters'] = True
        try:
            await db.users.update_one(hooks.user_filter(user_id), {'$inc': {'workouts_count': 1}})
            if hooks.claim_first_workout is not None:
                await hooks.claim_first_workout(user_id, workout_id)
            u = await hooks.load_user(user_id)
            if u is not None and not hooks.has_access(u):
                await db.users.update_one(hooks.user_filter(user_id), hooks.consume_free_update(u))
                did['free_workout_consumed'] = True
                await col.update_one({'_id': workout_id}, {'$set': {'consumed_free_workout': True}})
        except Exception as e:
            log.error(f'v3 complete: counters failed for {workout_id}: {e}')

    # canonical workout_completed (retention streak + achievements), at most once
    if await _claim(col, workout_id, 'event'):
        did['event'] = True
        items = [it for b in (w.get('blocks') or []) for it in (b.get('items') or [])]
        md = {
            'source': 'v3', 'v3_workout_id': workout_id, 'direction': w.get('direction'), 'archetype': (w.get('archetype') or {}).get('id'),
            'difficulty': w.get('experience'), 'states': list(w.get('states') or []),
            'duration_minutes': doc.get('duration_actual'), 'exercises_completed': len({it.get('exercise', {}).get('id') for it in items}),
            'completed_steps': doc.get('completed_steps'), 'total_steps': doc.get('total_steps'),
        }
        try:
            await hooks.track_event(user_id, 'workout_completed', md)
        except Exception as e:
            log.error(f'v3 complete: workout_completed event failed for {workout_id}: {e}')

    await col.update_one({'_id': workout_id}, {'$set': {'effects_done': True}})
    return did


async def access_summary(user_id: str, hooks: Optional[CompletionHooks], consumed: bool) -> Optional[dict]:
    """Post-completion access state: the monetization extension point reads this (no paywall decision is made here)."""
    if hooks is None:
        return None
    try:
        u = await hooks.load_user(user_id)
        if u is None:
            return None
        access = hooks.has_access(u)
        return {
            'has_full_access': access,
            'consumed_free_workout': bool(consumed),
            'free_workouts_remaining': None if access else hooks.free_remaining(u),
            'free_workouts_reset_at': None if access else _iso(hooks.free_reset_at()),
        }
    except Exception as e:
        log.warning(f'v3 complete: access summary skipped: {e}')
        return None


async def streak_summary(user_id: str, hooks: Optional[CompletionHooks]) -> Optional[dict]:
    if hooks is None:
        return None
    try:
        u = await hooks.load_user(user_id)
        if u is None or u.get('rt_streak_current') is None:
            return None
        return {'current': int(u.get('rt_streak_current') or 0), 'longest': int(u.get('rt_streak_longest') or 0)}
    except Exception:
        return None


async def complete_workout(db, workout_id: str, user_id: str, body, hooks: Optional[CompletionHooks], entries_from_performance) -> dict:
    """The /complete handler body. `_load` (ownership + 404/403) has already run."""
    col = db.v3_workouts
    doc = await col.find_one({'_id': workout_id})
    w = doc['envelope']['workout']
    # Guided Session sends item_id + exercise_id. If the slot now holds a different exercise (the workout was swapped after the
    # session started), never credit those sets to the new exercise: fall back to exercise_id, which drops them if it is gone.
    current = {it['item_id']: it['exercise']['id'] for b in w['blocks'] for it in b['items']}
    perf = []
    for p in body.performance:
        d = p.model_dump()
        if d.get('item_id') and d.get('exercise_id') and current.get(d['item_id']) not in (None, d['exercise_id']):
            d['item_id'] = None
        perf.append(d)
    entries = entries_from_performance(w, perf)
    now = _now()
    fields = {
        'status': 'completed', 'completed_at': now, 'updated_at': now, 'performance_entries': entries,
        'fit_rating': body.fit_rating, 'mood_after': body.mood_after, 'duration_actual': body.duration_actual,
        'started_at': body.started_at, 'completed_steps': body.completed_steps, 'total_steps': body.total_steps,
        'local_date': body.local_date, 'client_session_id': body.client_session_id,
    }
    won = await col.find_one_and_update({'_id': workout_id, 'user_id': user_id, 'status': {'$ne': 'completed'}}, {'$set': fields})
    await run_effects(db, workout_id, user_id, hooks, repair_only=won is None)
    cur = await col.find_one({'_id': workout_id})
    out = {
        'status': 'completed' if won is not None else 'already_completed',
        'message': 'Workout completed' if won is not None else 'Already completed',
        'workout_id': workout_id,
        'completed_at': _iso(cur.get('completed_at')),
        'logged_exercises': len(cur.get('performance_entries') or {}),
        'duration_actual': cur.get('duration_actual'),
    }
    out['streak'] = await streak_summary(user_id, hooks)
    out['access'] = await access_summary(user_id, hooks, bool(cur.get('consumed_free_workout')))
    return out


# ------------------------------------------------------------------ post-workout additions

_AFTER_V3 = ('fit_rating', 'mood_after', 'calories', 'avg_heart_rate', 'max_heart_rate', 'steps', 'hrv_sdnn', 'duration_actual', 'metrics_source')
_AFTER_ROW = {'calories': 'calories_burned', 'avg_heart_rate': 'avg_heart_rate', 'max_heart_rate': 'max_heart_rate', 'steps': 'session_steps',
              'hrv_sdnn': 'session_hrv_sdnn', 'duration_actual': 'duration_actual', 'mood_after': 'mood_after'}


async def apply_after(db, workout_id: str, user_id: str, fields: dict) -> dict:
    """Idempotent $set of post-workout additions on the completed V3 workout and its user_workouts row. Never estimates."""
    v3 = {k: v for k, v in fields.items() if k in _AFTER_V3}
    if not v3:
        return {'status': 'unchanged', 'workout_id': workout_id}
    now = _now()
    await db.v3_workouts.update_one({'_id': workout_id, 'user_id': user_id, 'status': 'completed'}, {'$set': {**{f'after.{k}': v for k, v in v3.items()}, 'after.updated_at': now, 'updated_at': now,
                                                                                                          **({'fit_rating': v3['fit_rating']} if 'fit_rating' in v3 else {}),
                                                                                                          **({'mood_after': v3['mood_after']} if 'mood_after' in v3 else {}),
                                                                                                          **({'duration_actual': v3['duration_actual']} if 'duration_actual' in v3 else {})}})
    row = {_AFTER_ROW[k]: v for k, v in v3.items() if k in _AFTER_ROW}
    if row:
        try:
            await db.user_workouts.update_one({'user_id': user_id, 'v3_workout_id': workout_id}, {'$set': row})
        except Exception as e:
            log.warning(f'v3 after: user_workouts mirror skipped for {workout_id}: {e}')
    return {'status': 'saved', 'workout_id': workout_id, 'saved': sorted(v3)}
