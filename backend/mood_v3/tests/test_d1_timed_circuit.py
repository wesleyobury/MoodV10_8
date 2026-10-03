"""D1 (Guided Session): a State that lengthens timed-circuit bouts must lengthen every station's rendered dose too.

The player times a timed circuit from `block.rest.work_sec`; each station's `prescription.seconds` (and its display) must agree,
otherwise the screen shows "40 s" next to a 45 s clock."""
import itertools
from mood_v3 import service

import pytest

_B = dict(direction='sweat', equipment='commercial_gym', persist=False)
# Reproduced from the Phase Zero sweep: each of these produced "40 s"/"35 s" stations under a 45 s block before the fix.
KNOWN = [
    ('user9', dict(_B, states=['low_energy', 'amped'], soreness=['legs'], duration=60, experience='intermediate', date='2026-11-12', goal='improve_athleticism', target='full_body')),
    ('user5', dict(_B, states=['low_energy', 'amped'], soreness=['legs'], duration=60, experience='intermediate', date='2026-11-12', goal='stay_consistent', target='full_body')),
    ('user4', dict(_B, states=['low_energy'], soreness=[], duration=30, experience='beginner', date='2026-11-12', goal='feel_better_reduce_stress', archetype='sweat_circuit')),
    ('user10', dict(_B, states=['low_energy', 'amped'], soreness=[], duration=30, experience='beginner', date='2026-10-05', goal='lose_weight_conditioning', archetype='sweat_circuit')),
    ('user12', dict(_B, states=['low_energy'], soreness=[], duration=60, experience='intermediate', date='2026-10-05', goal='improve_athleticism', target=['quads', 'glutes'])),
]


def _timed_circuits(w):
    return [b for b in w['blocks'] if b['structure'] == 'timed_circuit']


def _assert_agree(b):
    ws = b['rest']['work_sec']
    assert ws and ws == (b.get('interval') or {}).get('work_sec')
    for it in b['items']:
        rx = it['prescription']
        assert rx['kind'] == 'time'
        assert rx['seconds'] == ws, (it['exercise']['name'], rx['seconds'], ws)
        assert rx['display'].startswith(f'{ws} s'), rx['display']


@pytest.mark.parametrize('user,req', KNOWN)
def test_known_state_case_station_dose_matches_work_sec(user, req):
    env, _ = service.generate_workout(dict(req), user)
    assert env['status'] == 'ok'
    tcs = _timed_circuits(env['workout'])
    assert tcs, 'fixture no longer produces a timed circuit'
    for b in tcs:
        assert b['rest']['work_sec'] == 45   # the State raised the bout
        _assert_agree(b)


def test_timed_circuits_agree_across_states():
    seen = raised = 0
    states = [[], ['amped'], ['low_energy'], ['low_energy', 'amped'], ['stressed'], ['bored'], ['irritated'], ['amped', 'bored']]
    for st, exp, dur, date in itertools.product(states, ['beginner', 'intermediate', 'advanced'], [30, 60], ['2026-10-05', '2026-11-12']):
        req = dict(direction='sweat', states=st, soreness=[], duration=dur, experience=exp, equipment='commercial_gym', date=date,
                   goal='lose_weight_conditioning', archetype='sweat_circuit', persist=False)
        env, _ = service.generate_workout(req, f'user{len(st) + dur}')
        if env['status'] != 'ok': continue
        for b in _timed_circuits(env['workout']):
            seen += 1; raised += b['rest']['work_sec'] == 45
            _assert_agree(b)
    assert seen > 0 and raised > 0, (seen, raised)
