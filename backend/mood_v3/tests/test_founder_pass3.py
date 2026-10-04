"""Founder pass 3 regressions (no frozen programming change).

1. Precise soreness: the body map sends muscle-level regions (biceps, triceps, calves, quads, hamstrings, glutes) next to the
   existing regions (chest, shoulders, core, upper_back, lower_back). normalize() already accepts any id in MUSCLES and every
   engine consumes the muscle set, so the generator understands exactly what was tapped. Guard: accepted, echoed back, named in
   "You told MOOD", and no sore muscle is a primary mover of any exercise in the session.
2. Scalable bodyweight strength: explicit metadata (exercise_meta.LOAD_SCALING), a scaling instruction on strength-oriented rows,
   never on jumps / conditioning / Sweat, and the prescription itself (sets, reps, effort target) untouched.
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mood_v3.router import build_v3_router
from mood_v3.tests.test_router import _DB
from mood_v3 import exercise_meta as M

PRECISE = ['biceps', 'triceps', 'calves', 'quads', 'hamstrings', 'glutes']


@pytest.fixture(scope='module')
def client():
    db = _DB(); app = FastAPI()
    app.include_router(build_v3_router(db, lambda: 'user_pass3'), prefix='/api')
    return TestClient(app)


def _gen(client, **kw):
    body = {'states': [], 'soreness': [], 'duration': 60, 'date': '2026-11-03', 'persist': False, **kw}
    r = client.post('/api/v3/workouts/generate', json=body); assert r.status_code == 200, r.text
    return r.json()


@pytest.mark.parametrize('direction', ['strength', 'sweat', 'athletic'])
@pytest.mark.parametrize('sore', [[m] for m in PRECISE] + [['chest', 'biceps', 'calves'], ['upper_back', 'lower_back', 'triceps']])
def test_precise_soreness_is_understood(client, direction, sore):
    for day in ('2026-11-03', '2026-11-04'):
        w = _gen(client, direction=direction, soreness=sore, date=day)['workout']
        assert w['soreness']['regions'] == sore
        assert set(sore) - {'upper_back', 'lower_back', 'chest'} <= set(w['soreness']['muscles'])
        assert 'sore' in w['states']
        told = ' '.join(w['today']['told']).lower()
        for m in sore: assert m.replace('_', ' ') in told, told
        for b in w['blocks']:
            for it in b['items']:
                assert not (set(it['exercise'].get('primary_muscles') or []) & set(w['soreness']['muscles'])), (it['exercise']['id'], sore)


def test_legacy_broad_regions_still_accepted(client):
    for r in (['arms'], ['legs'], ['back']):
        w = _gen(client, direction='strength', soreness=r)['workout']; assert w['soreness']['regions'] == r


def _rows(w):
    return [(b, it) for b in w['blocks'] for it in b['items']]


@pytest.mark.parametrize('exp', ['beginner', 'intermediate', 'advanced'])
@pytest.mark.parametrize('states', [[], ['low_energy'], ['amped']])
def test_bodyweight_scaling_on_strength_rows(client, exp, states):
    seen = 0
    for day in range(1, 8):
        for req in (dict(target=['back', 'biceps']), dict(target=['back']), dict(archetype='strength_upper_pull'), dict(archetype='strength_upper_push'),
                    dict(target=['chest']), dict(target=['triceps'])):
            env = _gen(client, direction='strength', experience=exp, states=states, goal='build_strength', date=f'2026-11-{day:02d}', **req)
            w = env.get('workout')
            if not w: continue
            for b, it in _rows(w):
                rx = it['prescription']; eid = it['exercise']['id']
                if eid in M.LOAD_SCALING and b['type'] != 'finisher' and rx['kind'] == 'reps':
                    seen += 1
                    assert rx['scaling']['kind'] == M.LOAD_SCALING[eid][0]
                    assert '–' in rx['reps'], f'strength bodyweight row without a rep range: {eid} {rx["display"]}'
                    assert isinstance(rx['rir'], int) and rx['rir'] >= 1, 'effort target intact, never to failure by default'
                    assert 'Make it fit you' in rx['load_guidance'] and 'left in the tank' in rx['load_guidance']
                else:
                    assert 'scaling' not in rx, eid
    assert seen > 0 or exp == 'beginner'


def test_athletic_strength_rows_get_scaling_but_power_work_does_not(client):
    seen = 0
    for exp in ('intermediate', 'advanced'):
        for day in range(1, 20):
            w = _gen(client, direction='athletic', experience=exp, goal='build_strength', date=f'2026-11-{day:02d}').get('workout')
            if not w: continue
            for b, it in _rows(w):
                rx = it['prescription']
                if b['type'] == 'strength' and it['exercise']['id'] in M.LOAD_SCALING and rx['kind'] == 'reps':
                    seen += 1; assert rx['scaling'] and rx['rir'] is not None
                elif b['type'] != 'strength':
                    assert 'scaling' not in rx, (b['type'], it['exercise']['id'])
    assert seen > 0


def test_sweat_never_gets_strength_scaling(client):
    for day in range(1, 15):
        for dur in (30, 60):
            w = _gen(client, direction='sweat', duration=dur, date=f'2026-11-{day:02d}').get('workout')
            for b, it in _rows(w): assert 'scaling' not in it['prescription'], it['exercise']['id']


def test_explosive_and_conditioning_movements_are_not_in_the_scaling_list():
    for eid in ('box_jump', 'broad_jump', 'plyo_push_up', 'clap_push_up', 'muscle_up', 'band_assisted_muscle_up', 'burpee', 'mountain_climber', 'jump_squat'):
        assert eid not in M.LOAD_SCALING
    assert M.scaling_for('box_jump') is None
