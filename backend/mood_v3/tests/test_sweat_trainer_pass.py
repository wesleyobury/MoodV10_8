"""Sweat final pre-launch trainer-quality pass (Oct 2026): work floors, no standalone steady state, Stressed / Amped philosophy,
Sweat Trainer Coherence Gate. Production path (service + adapter)."""
import itertools, statistics, pytest
from mood_v3 import service as S, normalize as N
from mood_v3.engines.sweat import adapter as A, sweat_core as C, trainer_gate as TG

BASE = dict(direction='sweat', goal='lose_weight_conditioning', equipment='commercial_gym')
ARCH = ('sweat_engine', 'sweat_circuit', 'sweat_hybrid')
EXPS = ('beginner', 'intermediate', 'advanced')
STATES = ([], ['low_energy'], ['stressed'], ['bored'], ['irritated'], ['amped'], ['amped', 'stressed'], ['low_energy', 'amped'], ['amped', 'bored', 'irritated'])


def build(raw, user='u1'):
    return A.build(S.engine_ctx(N.normalize(raw, user, [])), [])


def grid():
    for (user, date), arch, states, dur, exp in itertools.product((('u1', '2026-10-11'), ('u3', '2026-10-13')), ARCH, STATES, (30, 60), EXPS):
        yield (arch, states, dur, exp, user), build(dict(BASE, archetype=arch, states=states, duration=dur, experience=exp, date=date), user)


@pytest.fixture(scope='module')
def built():
    return list(grid())


def test_no_standalone_steady_state_and_gate_clean(built):
    for key, res in built:
        w = res['w']
        assert w['blocks'][0]['structure'] != 'continuous', key
        for b in w['blocks'][1:]:
            if b['structure'] == 'continuous': assert b['duration_s'] <= C.STEADY_COMP_MAX_MIN * 60, key
        assert res['trainer_gate'] == [], (key, res['trainer_gate'])


def test_work_floor_met(built):
    for key, res in built:
        w = res['w']; exp = w['experience']; dur = w['duration']
        work = C.work_minutes(w['blocks'], exp); floor = C.work_floor(w['blocks'], dur, exp)
        assert work >= floor - TG.WORK_TOLERANCE, (key, round(work, 1), floor)
        assert C.BAND[dur][0] - 2 <= w['est_minutes'] <= C.BAND[dur][1] + 0.5, (key, w['est_minutes'])


def test_sixty_is_meaningfully_larger_than_thirty(built):
    for arch in ARCH:
        w30 = [C.work_minutes(r['w']['blocks'], r['w']['experience']) for k, r in built if k[0] == arch and k[2] == 30]
        w60 = [C.work_minutes(r['w']['blocks'], r['w']['experience']) for k, r in built if k[0] == arch and k[2] == 60]
        assert statistics.median(w60) >= 1.7 * statistics.median(w30), (arch, statistics.median(w30), statistics.median(w60))


def test_stressed_is_calm_but_complete(built):
    for key, res in built:
        arch, states, dur, exp, _ = key
        if states != ['stressed']: continue
        w = res['w']; p = w['blocks'][0]
        assert p['structure'] not in ('emom', 'ladder', 'pyramid'), key
        assert p['rpe'][1] <= 7, (key, p['rpe'])
        assert not any(b['structure'] == 'finisher' for b in w['blocks']), key
        for b in w['blocks']:
            for e in b['items_e']:
                if e['role'] == 'engine': continue
                assert e['cx'] <= 2 and not (e['pat'] == 'jump' and e['sysd'] >= 4), (key, e['id'])


def test_amped_is_not_shorter_than_no_state(built):
    for (arch, states, dur, exp, user), res in built:
        if states != ['amped']: continue
        ref = next(r for k, r in built if k == (arch, [], dur, exp, user))
        # harder work may finish a little earlier (the hard-work relief on the floor), never 'strangely after 18-20 minutes'
        assert res['w']['est_minutes'] >= max(C.BAND[dur][0], ref['w']['est_minutes'] - 7), (arch, dur, exp, user, res['w']['est_minutes'], ref['w']['est_minutes'])


def test_long_bouts_never_rpe_9_and_excluded_stations_absent(built):
    for key, res in built:
        for b in res['w']['blocks']:
            it = b.get('interval_target') or {}
            if (b['structure'] == 'pyramid' and max(it.get('steps') or [0]) >= 150) or (b['structure'] == 'intervals' and it.get('work', 0) >= 150):
                assert b['rpe'][1] <= 8, (key, b['rpe'])
            for e in b['items_e']: assert e['id'] not in C.SWEAT_EXCLUDED, (key, e['id'])


def test_gate_flags_the_known_failure_modes():
    """The gate catches what it exists to catch: a standalone steady block and an underfilled session."""
    res = build(dict(BASE, archetype='sweat_engine', states=[], duration=60, experience='intermediate', date='2026-10-11'))
    nctx = S.engine_ctx(N.normalize(dict(BASE, archetype='sweat_engine', states=[], duration=60, experience='intermediate', date='2026-10-11'), 'u1', []))
    w = dict(res['w']); e = w['blocks'][0]['items_e'][0]
    steady = C.G.mk_block('primary_engine_block', 'continuous', items_e=[e], duration_s=26 * 60, rpe=[5, 6], shape='continuous')
    w2 = dict(w, blocks=[steady], est_minutes=38.0)
    codes = {c for c, _ in TG.check(dict(w=w2), nctx)}
    assert 'generic_steady_state' in codes and 'underfilled' in codes, codes
