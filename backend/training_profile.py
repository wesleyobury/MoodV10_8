"""MOOD V3 Training Profile: the persistent "who you are as an athlete" record.

Stored on the user document as ``users.training_profile``. Onboarding (new users) and the V3 upgrade re-onboarding
(existing users) write it; ``/api/v3/workouts/generate`` reads it to fill any persistent input the request omits.

Daily inputs (States, soreness, Direction, Target, duration / equipment overrides) never live here.

Routes (mounted under /api):
    GET /api/users/me/training-profile
    PUT /api/users/me/training-profile     partial or full update; enum-validated
"""
from __future__ import annotations

import datetime as _dt
from typing import Literal, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict

from mood_v3 import normalize as N

PROFILE_VERSION = 1
TRAINING_PREFERENCES = ('lifting', 'conditioning', 'athletic', 'mix')
BARRIERS = ('time', 'low_energy', 'motivation', 'dont_know', 'boredom')
PROFILE_SOURCES = ('onboarding_v3', 'reonboarding_v3', 'user_edit')
REQUIRED = ('training_preference', 'goal', 'experience', 'training_frequency', 'biggest_barrier')
DEFAULT_DURATION = 60
DEFAULT_EQUIPMENT = 'commercial_gym'

# Enum sets come from the V3 generator's own vocabulary so the profile can never hold a value /api/v3 rejects.
assert set(N.TRAINING_PREFERENCES) == set(TRAINING_PREFERENCES)
GOALS = N.GOALS
EXPERIENCE = N.EXPERIENCE
FREQUENCIES = N.FREQUENCIES
DURATIONS = N.DURATIONS
EQUIPMENT = tuple(N.PRESETS)


class TrainingProfileUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    training_preference: Optional[Literal['lifting', 'conditioning', 'athletic', 'mix']] = None
    goal: Optional[Literal['build_strength', 'build_muscle', 'improve_athleticism', 'lose_weight_conditioning',
                           'feel_better_reduce_stress', 'stay_consistent']] = None
    experience: Optional[Literal['beginner', 'intermediate', 'advanced']] = None
    training_frequency: Optional[Literal['1-2', '3-4', '5+']] = None
    biggest_barrier: Optional[Literal['time', 'low_energy', 'motivation', 'dont_know', 'boredom']] = None
    default_duration: Optional[Literal[30, 60]] = None
    default_equipment: Optional[Literal['commercial_gym', 'free_weight_limited', 'minimal']] = None
    profile_source: Optional[Literal['onboarding_v3', 'reonboarding_v3', 'user_edit']] = None


def is_complete(profile: Optional[dict]) -> bool:
    return bool(profile) and all(profile.get(k) for k in REQUIRED)


def default_direction(profile: Optional[dict]) -> str:
    """The Direction the Home card should propose by default. Same rule /api/v3 uses when direction is omitted
    (mood_v3.normalize.resolve_direction): training preference, else goal, else Strength."""
    p = profile or {}
    return N.resolve_direction(None, p.get('training_preference'), p.get('goal') or 'stay_consistent', [])[0]


def public_view(profile: Optional[dict]) -> dict:
    p = dict(profile or {})
    for k in ('updated_at', 'completed_at', 'created_at'):
        if isinstance(p.get(k), _dt.datetime): p[k] = p[k].isoformat()
    p.setdefault('default_duration', DEFAULT_DURATION)
    p.setdefault('default_equipment', DEFAULT_EQUIPMENT)
    return dict(profile=p, complete=is_complete(p), default_direction=default_direction(p), version=PROFILE_VERSION)


async def load_profile(db, user_id: str) -> Optional[dict]:
    try:
        doc = await db.users.find_one({'_id': ObjectId(user_id)}, {'training_profile': 1})
    except Exception:
        return None
    return (doc or {}).get('training_profile')


def build_training_profile_router(db, get_current_user):
    r = APIRouter(tags=['training-profile'])

    @r.get('/users/me/training-profile')
    async def get_training_profile(current_user_id: str = Depends(get_current_user)):
        return public_view(await load_profile(db, current_user_id))

    @r.put('/users/me/training-profile')
    async def put_training_profile(body: TrainingProfileUpdate, current_user_id: str = Depends(get_current_user)):
        changes = body.model_dump(exclude_none=True)
        if not changes:
            raise HTTPException(422, 'No training-profile fields provided')
        existing = await load_profile(db, current_user_id) or {}
        now = _dt.datetime.now(_dt.timezone.utc)
        merged = {**existing, **changes}
        merged.setdefault('default_duration', DEFAULT_DURATION)
        merged.setdefault('default_equipment', DEFAULT_EQUIPMENT)
        merged.setdefault('created_at', now)
        merged['updated_at'] = now
        merged['version'] = PROFILE_VERSION
        if is_complete(merged) and not existing.get('completed_at'):
            merged['completed_at'] = now
        res = await db.users.update_one({'_id': ObjectId(current_user_id)}, {'$set': {'training_profile': merged}})
        if res.matched_count == 0:
            raise HTTPException(404, 'User not found')
        return public_view(merged)

    return r
