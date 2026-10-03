"""MOOD V3 Explore + Profile data (Oct 2026 rework: the social feed is gone).

    GET /api/v3/explore        Live on MOOD (real Guided Sessions + optional sample sessions) and Trending
    GET /api/v3/me/activity    the signed-in user's completed workouts (V2 + V3), newest first: Profile derives its stats,
                               calendar, week summary, achievements, Your MOOD and History from this one list

Nothing here touches workout generation.

LIVE (real)  A V3 Guided Session sends `workout_started` (metadata.source 'v3', v3_workout_id) when it begins. It is live
             until its workout completes, the athlete ends it early / it is abandoned, or it runs well past its estimate.
LIVE (sample) Sample sessions keep Explore from looking empty at low concurrency. They are not stored anywhere: they are a
             pure function of the clock. Each 5-minute slot gets a seeded random number of session starts (a time-of-day
             curve x a slow 30-minute busy/quiet wave x a daily factor), and every start gets its own Direction, States,
             Target, length and pace. Every client sees the same sessions, progressing together. Sample sessions only fill
             the gap left by real ones, so they fade out by themselves as real usage grows.

             EXPLORE_SYNTHETIC (env) = off | labeled | realistic
               off        no sample sessions
               labeled    (default, production) Live feed sample rows show a first name and an initial avatar, plus the SAMPLE
                          tag and the feed footnote
               realistic  dev / staging only: names, no SAMPLE tag

TRENDING     Real V3 completions only (last 24 h, else last 7 days). Below MIN_TRENDING the section falls back to curated
             combinations with count = null: no number is ever shown that was not measured.
"""
from __future__ import annotations

import datetime as _dt
import logging
import math
import os
import random
import time
from collections import Counter
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Header

log = logging.getLogger('mood_v3.explore')

try:
    from zoneinfo import ZoneInfo
    _ACTIVITY_TZ = ZoneInfo('America/Chicago')   # the activity curve follows a US day
except Exception:  # pragma: no cover
    _ACTIVITY_TZ = _dt.timezone(_dt.timedelta(hours=-5))

DIRECTION_NAME = {'strength': 'Strength', 'sweat': 'Sweat', 'athletic': 'Athletic'}
STATE_LABEL = {'low_energy': 'Low Energy', 'amped': 'Amped', 'stressed': 'Stressed', 'bored': 'Bored', 'irritated': 'Irritated', 'sore': 'Sore'}

LIVE_LOOKBACK_MIN = 90
LIVE_OVERRUN_MIN = 20          # a real session counts as live until estimate + this, unless it ended first
LIVE_MAX = 8                   # rows returned
MIN_TRENDING = 12              # real completions needed before counts are shown

# ------------------------------------------------------------------ sample sessions

SLOT_SEC = 300
PEAK_STARTS_PER_SLOT = 0.7     # ~6 concurrent sessions at peak, ~0-1 overnight
SALT = 'mood-live-v1'
# relative start rate by local hour (0-23): early-morning and after-work peaks, a lunch bump, quiet nights
HOUR_CURVE = [0.18, 0.12, 0.09, 0.08, 0.12, 0.35, 0.85, 1.0, 0.75, 0.55, 0.5, 0.55,
              0.75, 0.65, 0.45, 0.45, 0.6, 0.95, 1.0, 0.85, 0.6, 0.42, 0.3, 0.2]

SAMPLE_NAMES = ['Marcus', 'Jada', 'Chris', 'Priya', 'Andre', 'Sofia', 'Malik', 'Emma', 'Diego', 'Aaliyah', 'Ryan', 'Mei',
                'Jordan', 'Nia', 'Tyler', 'Camila', 'Darius', 'Hannah', 'Omar', 'Zoe', 'Isaiah', 'Lena', 'Kevin', 'Maya',
                'Jalen', 'Grace', 'Luis', 'Tasha', 'Ben', 'Imani', 'Noah', 'Ava', 'Xavier', 'Riley', 'Devon', 'Kiara']

SAMPLE_FOCUS = {
    'strength': [('Upper Body', 3), ('Chest + Triceps', 3), ('Back + Biceps', 3), ('Lower Body', 3), ('Glutes + Legs', 2),
                 ('Shoulders', 2), ('Upper Push', 2), ('Upper Pull', 2), ('Full Body', 2), ('Arms', 1)],
    'sweat': [('Full Body', 4), ('Circuit', 3), ('Engine', 3), ('Hybrid', 2), ('Lower Body', 1)],
    'athletic': [('Power', 3), ('Speed + Plyo', 3), ('Full-Body Athlete', 3)],
}
_CLASHING_STATES = [{'amped', 'low_energy'}, {'amped', 'sore'}]
SAMPLE_STATES = [('amped', 5), ('stressed', 4), ('low_energy', 3), ('bored', 2), ('irritated', 2), ('sore', 1)]


def synthetic_mode() -> str:
    m = (os.environ.get('EXPLORE_SYNTHETIC') or 'labeled').strip().lower()
    return m if m in ('off', 'labeled', 'realistic') else 'labeled'


def _wpick(rng: random.Random, pairs):
    total = sum(w for _, w in pairs)
    x = rng.uniform(0, total)
    for v, w in pairs:
        x -= w
        if x <= 0:
            return v
    return pairs[-1][0]


def _poisson(rng: random.Random, lam: float) -> int:
    if lam <= 0:
        return 0
    l, k, p = math.exp(-lam), 0, 1.0
    while True:
        p *= rng.random()
        if p <= l:
            return k
        k += 1


def _rate(slot: int) -> float:
    """Expected session starts in this 5-minute slot."""
    t = _dt.datetime.fromtimestamp(slot * SLOT_SEC, _dt.timezone.utc).astimezone(_ACTIVITY_TZ)
    hour = HOUR_CURVE[t.hour] + (HOUR_CURVE[(t.hour + 1) % 24] - HOUR_CURVE[t.hour]) * (t.minute / 60)
    wave = random.Random(f'{SALT}:wave:{slot // 6}').uniform(0.55, 1.45)           # 30-minute busy / quiet swings
    day = random.Random(f'{SALT}:day:{t.date().isoformat()}').uniform(0.8, 1.2)    # some days are busier
    return PEAK_STARTS_PER_SLOT * hour * wave * day


def sample_sessions(now: Optional[float] = None, lookback_min: int = LIVE_LOOKBACK_MIN, finished: bool = False) -> List[Dict[str, Any]]:
    """Sample sessions in progress at `now` (epoch seconds), newest start first; with finished=True, also the ones that
    started inside the lookback and have already ended (they carry `ended`). Deterministic for a given clock."""
    now = time.time() if now is None else now
    first = int((now - lookback_min * 60) // SLOT_SEC)
    last = int(now // SLOT_SEC)
    out = []
    for slot in range(first, last + 1):
        rng = random.Random(f'{SALT}:{slot}')
        for i in range(_poisson(rng, _rate(slot))):
            start = slot * SLOT_SEC + rng.uniform(0, SLOT_SEC)
            direction = _wpick(rng, [('strength', 45), ('sweat', 35), ('athletic', 20)])
            planned = 60 if rng.random() < (0.65 if direction == 'strength' else 0.5) else 30
            minutes = max(18, planned * rng.uniform(0.72, 1.08))
            n_states = _wpick(rng, [(0, 3), (1, 5), (2, 2)])
            states: List[str] = []
            for _ in range(n_states):
                s = _wpick(rng, SAMPLE_STATES)
                # never pair States that contradict each other (Amped + Low Energy)
                if s not in states and not any({s, x} in _CLASHING_STATES for x in states):
                    states.append(s)
            focus = _wpick(rng, SAMPLE_FOCUS[direction])
            name = SAMPLE_NAMES[rng.randrange(len(SAMPLE_NAMES))]
            end = start + minutes * 60
            if start > now or (end <= now and not finished):
                continue
            out.append(dict(id=f's{slot}-{i}', started=start, ended=end if end <= now else None, direction=direction, states=states,
                            focus=focus, planned_minutes=planned, est_minutes=round(minutes), name=name))
    out.sort(key=lambda s: -s['started'])
    used = set()
    for s in reversed(out):                       # no two sessions on screen share a first name (within a window this size)
        i = SAMPLE_NAMES.index(s['name'])
        while SAMPLE_NAMES[i] in used and len(used) < len(SAMPLE_NAMES):
            i = (i + 7) % len(SAMPLE_NAMES)
        s['name'] = SAMPLE_NAMES[i]
        used.add(s['name'])
    return out


# ------------------------------------------------------------------ the Live feed (/api/feed/live, the V2 Live page)

# V3 Directions inside the V2 Live feed's palette buckets (components/LiveFeed MOOD_STYLES)
V3_LIVE_BUCKET = {'strength': ('muscle', 'Strength'), 'sweat': ('sweat', 'Sweat'), 'athletic': ('explosive', 'Athletic')}

# sample focus -> a Build preset that asks the generator for that kind of session (Try this workout)
_FOCUS_PRESET = {
    ('strength', 'Upper Body'): {'target': ['chest', 'back', 'shoulders']}, ('strength', 'Chest + Triceps'): {'target': ['chest', 'triceps']},
    ('strength', 'Back + Biceps'): {'target': ['back', 'biceps']}, ('strength', 'Lower Body'): {'target': ['quads', 'hamstrings', 'glutes']},
    ('strength', 'Glutes + Legs'): {'archetype': 'strength_glutes_legs'}, ('strength', 'Shoulders'): {'target': ['shoulders']},
    ('strength', 'Upper Push'): {'archetype': 'strength_upper_push'}, ('strength', 'Upper Pull'): {'archetype': 'strength_upper_pull'},
    ('strength', 'Full Body'): {'target': 'full_body'}, ('strength', 'Arms'): {'archetype': 'strength_arms'},
    ('sweat', 'Full Body'): {'target': 'full_body'}, ('sweat', 'Circuit'): {'archetype': 'sweat_circuit'}, ('sweat', 'Engine'): {'archetype': 'sweat_engine'},
    ('sweat', 'Hybrid'): {'archetype': 'sweat_hybrid'}, ('sweat', 'Lower Body'): {'target': ['quads', 'hamstrings', 'glutes']},
    ('athletic', 'Power'): {'archetype': 'athletic_power'}, ('athletic', 'Speed + Plyo'): {'archetype': 'athletic_speed_agility'},
    ('athletic', 'Full-Body Athlete'): {'archetype': 'athletic_full_body'},
}


def v3_live_bucket(metadata: dict):
    """(bucket, label) for a V3 workout event, else None (the V2 keyword classifier handles it)."""
    md = metadata or {}
    if md.get('source') == 'v3' and md.get('direction') in V3_LIVE_BUCKET:
        return V3_LIVE_BUCKET[md['direction']]
    return None


def _preset_from_workout(w: dict) -> dict:
    dr = w.get('direction')
    p: Dict[str, Any] = {'direction': dr}
    t = w.get('target') or {}
    if dr != 'athletic' and t.get('mode') == 'explicit' and t.get('muscles'):
        p['target'] = list(t['muscles'])[:3]
    elif dr != 'athletic' and t.get('mode') == 'full_body':
        p['target'] = 'full_body'
    elif (w.get('archetype') or {}).get('id') and w.get('selection_source') != 'moods_pick' and w['archetype']['id'] != 'strength_custom_target':
        p['archetype'] = w['archetype']['id']
    rm = (w.get('duration') or {}).get('requested_minutes')
    if rm in (30, 60):
        p['duration'] = rm
    return p


async def enrich_live_feed(db, entries: List[dict]) -> List[dict]:
    """V3 rows of the Live feed: name the workout the way the Cart does and attach a Build preset for Try this workout."""
    ids = [e['v3_workout_id'] for e in entries if e.get('v3_workout_id')]
    if not ids:
        return entries
    docs = {d['_id']: d async for d in db.v3_workouts.find(
        {'_id': {'$in': ids}}, {'envelope.workout.direction': 1, 'envelope.workout.target': 1, 'envelope.workout.archetype': 1,
                                'envelope.workout.duration': 1, 'envelope.workout.selection_source': 1, 'envelope.workout.states': 1,
                                'envelope.workout.experience': 1, 'envelope.workout.blocks.items.exercise.id': 1, 'performance_entries': 1})}
    for e in entries:
        d = docs.get(e.get('v3_workout_id'))
        if not d:
            continue
        w = (d.get('envelope') or {}).get('workout') or {}
        e['workout_name'] = _focus_label(w) or e.get('workout_name')
        e['v3_preset'] = _preset_from_workout(w)
        exercises = len({it.get('exercise', {}).get('id') for b in (w.get('blocks') or []) for it in (b.get('items') or [])})
        perf = d.get('performance_entries') or {}
        sets = sum(len(x.get('sets') or []) for x in perf.values()) if isinstance(perf, dict) else 0
        est = (w.get('duration') or {}).get('estimated_minutes')
        e['details'] = feed_details(list(w.get('states') or []), exercises=exercises, sets=sets if e.get('type') == 'completion' else 0,
                                    level=w.get('experience'), est_minutes=est if e.get('type') == 'live_now' else None)
    return entries


LEVEL_LABEL = {'beginner': 'Beginner', 'intermediate': 'Intermediate', 'advanced': 'Advanced'}


def feed_details(states: List[str], *, exercises: int = 0, sets: int = 0, level: Optional[str] = None, est_minutes: Optional[float] = None) -> List[str]:
    """The detail line under a Live card: how they felt, what the session held, its level (real data for real rows)."""
    out = [STATE_LABEL.get(x, x) for x in states[:2]]
    if est_minutes:
        out.append(f'~{int(round(est_minutes))} min')
    if exercises:
        out.append(f'{exercises} exercises')
    if sets:
        out.append(f'{sets} sets')
    if level in LEVEL_LABEL:
        out.append(LEVEL_LABEL[level])
    return out


def _sample_details(s: dict, live: bool) -> List[str]:
    r = random.Random(f"{SALT}:detail:{s['id']}")
    exercises = r.randint(4, 7) if s['direction'] == 'strength' else r.randint(5, 9)
    sets = r.randint(14, 22) if (s['direction'] == 'strength' and not live) else 0
    level = _wpick(r, [('intermediate', 6), ('advanced', 2), ('beginner', 2)])
    return feed_details(s['states'], exercises=exercises, sets=sets, level=level, est_minutes=s['planned_minutes'] * 0.95 if live else None)


def feed_samples(now: _dt.datetime, real_entries: int, format_ago) -> List[dict]:
    """Sample rows for the Live feed (EXPLORE_SYNTHETIC). Started in the last 20 min and still going -> LIVE NOW; finished in
    the last few hours -> a completion. They only fill the feed up to ~15 rows, so they fade out as real activity grows.
    Production (labeled): no name, no face, `sample` + `show_sample_tag`; the feed's stats header never counts them."""
    mode = synthetic_mode()
    if mode == 'off':
        return []
    cap = max(0, 15 - real_entries)
    if not cap:
        return []
    t = now.timestamp()
    rows = []
    for s in sample_sessions(t, lookback_min=6 * 60, finished=True):
        live = s['ended'] is None
        if live and t - s['started'] > 20 * 60:
            continue
        ts = _dt.datetime.fromtimestamp(s['started'] if live else s['ended'], _dt.timezone.utc)
        bucket, label = V3_LIVE_BUCKET[s['direction']]
        realistic = mode == 'realistic'
        preset = {'direction': s['direction'], **_FOCUS_PRESET.get((s['direction'], s['focus']), {}), 'duration': s['planned_minutes']}
        states = [x for x in s['states'] if x != 'sore']
        if states:
            preset['states'] = states
        rows.append({
            'id': f"sample-{s['id']}", 'type': 'live_now' if live else 'completion',
            # first name on every sample row (founder call, Oct 3); production keeps the SAMPLE tag + footnote so it stays honest
            'user': {'id': '', 'username': '', 'name': s['name'], 'avatar': ''},
            'mood_bucket': bucket, 'mood_label': label, 'workout_name': s['focus'],
            'duration_minutes': None if live else s['est_minutes'], 'milestone_count': None,
            'timestamp': ts.isoformat(), 'ago_text': format_ago(ts), 'workout_snapshot_id': None,
            'sample': True, 'show_sample_tag': not realistic, 'v3_preset': preset,
            'details': _sample_details(s, live),
        })
    rows.sort(key=lambda r: r['timestamp'], reverse=True)
    return rows[:cap]


# ------------------------------------------------------------------ helpers

def _first_name(u: dict) -> str:
    raw = (u.get('name') or u.get('username') or '').strip()
    return raw.split()[0][:18] if raw else 'Someone'


def _aware(ts):
    if isinstance(ts, _dt.datetime) and ts.tzinfo is None:
        return ts.replace(tzinfo=_dt.timezone.utc)
    return ts


def _focus_label(w: dict) -> str:
    t = w.get('target') or {}
    if t.get('mode') == 'explicit' and t.get('label'):
        return t['label']
    if t.get('mode') == 'full_body':
        return 'Full Body'
    return (w.get('archetype') or {}).get('name') or DIRECTION_NAME.get(w.get('direction'), '')


def _entry(*, id, kind, direction, states, focus, elapsed_min, est_min, name=None, avatar=None, is_you=False, show_sample_tag=False):
    return dict(
        id=id, kind=kind, sample=kind == 'sample', show_sample_tag=show_sample_tag, is_you=is_you,
        name=name, avatar=avatar, direction=direction, direction_name=DIRECTION_NAME.get(direction, direction),
        states=states[:2], state_labels=[STATE_LABEL.get(s, s) for s in states[:2]], focus=focus,
        elapsed_min=max(1, int(elapsed_min)), est_min=int(est_min) if est_min else None,
        progress=round(min(0.97, max(0.03, elapsed_min / est_min)), 3) if est_min else None,
    )


# ------------------------------------------------------------------ router

def build_explore_router(db, get_current_user):
    r = APIRouter(prefix='/v3', tags=['v3-explore'])
    trending_cache: Dict[str, Any] = {'at': 0.0, 'value': None}

    async def _optional_user(authorization: Optional[str]) -> Optional[str]:
        if authorization and authorization.startswith('Bearer '):
            try:
                from fastapi.security import HTTPAuthorizationCredentials
                return await get_current_user(HTTPAuthorizationCredentials(scheme='Bearer', credentials=authorization[7:]))
            except Exception:
                return None
        return None

    async def _real_live(now: _dt.datetime, viewer: Optional[str]) -> List[dict]:
        since = now - _dt.timedelta(minutes=LIVE_LOOKBACK_MIN)
        starts = await db.user_events.find(
            {'event_type': 'workout_started', 'metadata.source': 'v3', 'timestamp': {'$gte': since}},
            {'user_id': 1, 'timestamp': 1, 'metadata.v3_workout_id': 1},
        ).sort('timestamp', -1).limit(200).to_list(200)
        latest: Dict[str, dict] = {}
        for ev in starts:                                   # one live session per person: their newest start
            uid = str(ev.get('user_id') or '')
            wid = (ev.get('metadata') or {}).get('v3_workout_id')
            if uid and wid and uid not in latest:
                latest[uid] = dict(uid=uid, wid=wid, ts=_aware(ev['timestamp']))
        if not latest:
            return []
        wids = [s['wid'] for s in latest.values()]
        ended = set()
        async for ev in db.user_events.find(
            {'timestamp': {'$gte': since}, '$or': [
                {'event_type': 'workout_completed', 'metadata.v3_workout_id': {'$in': wids}},
                {'event_type': {'$in': ['v3_workout_ended_early', 'v3_workout_abandoned', 'v3_workout_completed']}, 'metadata.workout_id': {'$in': wids}},
            ]}, {'metadata': 1}):
            md = ev.get('metadata') or {}
            ended.add(md.get('v3_workout_id') or md.get('workout_id'))
        docs = {d['_id']: d async for d in db.v3_workouts.find(
            {'_id': {'$in': wids}},
            {'status': 1, 'envelope.workout.direction': 1, 'envelope.workout.states': 1, 'envelope.workout.target': 1,
             'envelope.workout.archetype': 1, 'envelope.workout.duration': 1})}
        out = []
        for s in latest.values():
            d = docs.get(s['wid'])
            if not d or s['wid'] in ended or d.get('status') == 'completed':
                continue
            w = (d.get('envelope') or {}).get('workout') or {}
            est = ((w.get('duration') or {}).get('estimated_minutes')) or ((w.get('duration') or {}).get('requested_minutes')) or 45
            elapsed = (now - s['ts']).total_seconds() / 60
            if elapsed > est + LIVE_OVERRUN_MIN:
                continue
            u = None
            try:
                from bson import ObjectId
                u = await db.users.find_one({'_id': ObjectId(s['uid'])}, {'name': 1, 'username': 1, 'avatar': 1})
            except Exception:
                u = None
            if not u:
                continue
            out.append(_entry(id=f"r-{s['wid']}", kind='real', direction=w.get('direction') or 'strength', states=list(w.get('states') or []),
                              focus=_focus_label(w), elapsed_min=elapsed, est_min=est, name=_first_name(u), avatar=u.get('avatar') or None,
                              is_you=viewer == s['uid']))
        out.sort(key=lambda e: e['elapsed_min'])
        return out

    def _sample_live(now_ts: float, real: List[dict], mode: str) -> List[dict]:
        if mode == 'off':
            return []
        cap = max(0, LIVE_MAX - 2 * len(real))   # fill the gap; fade out as real sessions grow
        realistic = mode == 'realistic'
        taken = {e['name'] for e in real if e.get('name')}
        rows = []
        for s in sample_sessions(now_ts)[:cap]:
            name = None
            if realistic:   # dev / staging only; never reuse a real person's name on screen
                name = s['name']
                if name in taken:
                    name = next((n for n in SAMPLE_NAMES if n not in taken), name)
                taken.add(name)
            rows.append(_entry(id=s['id'], kind='sample', direction=s['direction'], states=s['states'], focus=s['focus'],
                               elapsed_min=(now_ts - s['started']) / 60, est_min=s['est_minutes'],
                               name=name, show_sample_tag=not realistic))
        return rows

    async def _trending(now: _dt.datetime) -> dict:
        if trending_cache['value'] is not None and time.time() - trending_cache['at'] < 300:
            return trending_cache['value']
        value = None
        for window, label in ((_dt.timedelta(hours=24), 'today'), (_dt.timedelta(days=7), 'week')):
            docs = await db.v3_workouts.find(
                {'status': 'completed', 'completed_at': {'$gte': now - window}},
                {'envelope.workout.direction': 1, 'envelope.workout.states': 1, 'envelope.workout.target': 1, 'envelope.workout.archetype': 1},
            ).limit(5000).to_list(5000)
            if len(docs) < MIN_TRENDING:
                continue
            combos: Counter = Counter()
            focus: Counter = Counter()
            focus_preset: Dict[tuple, dict] = {}
            for d in docs:
                w = (d.get('envelope') or {}).get('workout') or {}
                dr = w.get('direction')
                if dr not in DIRECTION_NAME:
                    continue
                for st in (w.get('states') or []):
                    if st != 'sore':
                        combos[(dr, st)] += 1
                t = w.get('target') or {}
                if t.get('mode') == 'explicit' and t.get('muscles'):
                    key = (dr, t.get('label') or '')
                    focus_preset.setdefault(key, {'direction': dr, 'target': list(t['muscles'])})
                    focus[key] += 1
                elif (w.get('archetype') or {}).get('id'):
                    a = w['archetype']
                    key = (dr, a.get('name') or '')
                    focus_preset.setdefault(key, {'direction': dr, 'archetype': a['id']})
                    focus[key] += 1
            items = []
            for (dr, st), n in combos.most_common(2):
                if n >= 3:
                    items.append(dict(id=f'c-{dr}-{st}', kind='combo', label=f'{DIRECTION_NAME[dr]} + {STATE_LABEL.get(st, st)}',
                                      direction=dr, count=n, preset={'direction': dr, 'states': [st]}))
            for (dr, lbl), n in focus.most_common(3):
                if n >= 3 and lbl and len(items) < 3:
                    items.append(dict(id=f'f-{dr}-{lbl}', kind='focus', label=f'{lbl} {DIRECTION_NAME[dr]}' if lbl not in DIRECTION_NAME.values() else lbl,
                                      direction=dr, count=n, preset=focus_preset[(dr, lbl)]))
            if items:
                value = dict(source='measured', window=label, items=items[:3])
                break
        if value is None:
            value = dict(source='curated', window=None, items=[
                dict(id='k-strength-amped', kind='combo', label='Strength + Amped', direction='strength', count=None, preset={'direction': 'strength', 'states': ['amped']}),
                dict(id='k-sweat-stressed', kind='combo', label='Sweat + Stressed', direction='sweat', count=None, preset={'direction': 'sweat', 'states': ['stressed']}),
                dict(id='k-upper-strength', kind='focus', label='Upper Body Strength', direction='strength', count=None,
                     preset={'direction': 'strength', 'target': ['chest', 'back', 'shoulders']}),
            ])
        trending_cache.update(at=time.time(), value=value)
        return value

    @r.get('/explore')
    async def explore(authorization: Optional[str] = Header(None)):
        """Public (guests see Explore too). Live is not personalized beyond marking the viewer's own session."""
        viewer = await _optional_user(authorization)
        now = _dt.datetime.now(_dt.timezone.utc)
        mode = synthetic_mode()
        try:
            real = await _real_live(now, viewer)
        except Exception as e:
            log.warning(f'explore: real live lookup failed: {e}')
            real = []
        live = (real + _sample_live(now.timestamp(), real, mode))[:LIVE_MAX]
        try:
            trending = await _trending(now)
        except Exception as e:
            log.warning(f'explore: trending failed: {e}')
            trending = dict(source='curated', window=None, items=[])
        return dict(live=live, live_real_count=len(real), synthetic_mode=mode, trending=trending, generated_at=now.isoformat())

    @r.get('/me/completed/{workout_id}')
    async def my_completed(workout_id: str, user_id: str = Depends(get_current_user)):
        """What a completed V3 workout recorded (Profile > History > Stats): the completion overlay is rebuilt from this.
        Real data only: nothing here is estimated."""
        from fastapi import HTTPException
        d = await db.v3_workouts.find_one({'_id': workout_id, 'user_id': user_id},
                                          {'status': 1, 'completed_at': 1, 'started_at': 1, 'duration_actual': 1, 'performance_entries': 1, 'after': 1, 'fit_rating': 1})
        if not d or d.get('status') != 'completed':
            raise HTTPException(404, 'Completed workout not found')
        perf = d.get('performance_entries') or {}
        after = {k: v for k, v in (d.get('after') or {}).items() if k != 'updated_at'}
        ca = _aware(d.get('completed_at'))
        return dict(workout_id=workout_id, completed_at=ca.isoformat() if isinstance(ca, _dt.datetime) else None, started_at=d.get('started_at'),
                    duration_actual=after.get('duration_actual', d.get('duration_actual')),
                    sets=sum(len(e.get('sets') or []) for e in perf.values()) if isinstance(perf, dict) else 0,
                    fit_rating=d.get('fit_rating'), after=after)

    @r.get('/me/activity')
    async def my_activity(limit: int = 1000, user_id: str = Depends(get_current_user)):
        rows = await db.user_workouts.find(
            {'user_id': user_id},
            {'completed_at': 1, 'duration_actual': 1, 'source': 1, 'v3_workout_id': 1},
        ).sort('completed_at', -1).limit(max(1, min(limit, 2000))).to_list(2000)
        v3_ids = [x['v3_workout_id'] for x in rows if x.get('v3_workout_id')]
        docs = {}
        if v3_ids:
            async for d in db.v3_workouts.find(
                {'_id': {'$in': v3_ids}, 'user_id': user_id},
                {'duration_actual': 1, 'performance_entries': 1, 'fit_rating': 1, 'envelope.workout.direction': 1, 'envelope.workout.states': 1,
                 'envelope.workout.target': 1, 'envelope.workout.archetype': 1, 'envelope.workout.duration': 1,
                 'envelope.workout.selection_source': 1, 'envelope.workout.experience': 1, 'envelope.workout.created_at': 1}):
                docs[d['_id']] = d
        out = []
        seen = set()
        for x in rows:
            at = _aware(x.get('completed_at'))
            if not isinstance(at, _dt.datetime):
                continue
            wid = x.get('v3_workout_id')
            if wid and wid in seen:
                continue
            mins = x.get('duration_actual')
            row: Dict[str, Any] = dict(at=at.isoformat(), source=x.get('source') or 'v2', minutes=None)
            d = docs.get(wid) if wid else None
            if d:
                seen.add(wid)
                w = (d.get('envelope') or {}).get('workout') or {}
                mins = mins if mins is not None else d.get('duration_actual')
                perf = d.get('performance_entries') or {}
                row.update(
                    workout_id=wid, direction=w.get('direction'), states=list(w.get('states') or []),
                    target=w.get('target'), archetype=w.get('archetype'), selection_source=w.get('selection_source'),
                    experience=w.get('experience'), estimated_minutes=(w.get('duration') or {}).get('estimated_minutes'),
                    requested_minutes=(w.get('duration') or {}).get('requested_minutes'), created_at=w.get('created_at'),
                    sets=sum(len(e.get('sets') or []) for e in perf.values()) if isinstance(perf, dict) else 0,
                    fit_rating=d.get('fit_rating'),
                )
            try:
                row['minutes'] = max(1, min(240, int(round(float(mins))))) if mins is not None else None
            except Exception:
                row['minutes'] = None
            out.append(row)
        return {'rows': out, 'count': len(out)}

    return r
