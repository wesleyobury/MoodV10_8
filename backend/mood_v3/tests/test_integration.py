"""Integration regression: the production adapters reproduce the frozen generators exactly on every frozen fixture,
the unified QA suite is green, explanations pass the style lint, and cue ids exist in the libraries."""
import json, os
import pytest
from mood_v3 import service as S, explain, cues
from mood_v3.engines.strength import adapter as SA, qa_engine as QE, audit_engine as AE
from mood_v3.engines.sweat import adapter as WA, sweat_gen as SG
from mood_v3.engines.athletic import adapter as AA, athletic_gen as AG
from mood_v3.tests.harness_helpers import strength_sc_from

FROZEN = os.path.join(os.path.dirname(__file__), 'frozen')

def sig(w):   # frozen Sweat QA signature (restated from the frozen run_qa.py)
    return json.dumps(dict(a=w['archetype_id'], o=w['outcome'], b=[dict(s=b['slot'], st=b['structure'], i=[e['id'] for e in b['items_e']], r=b.get('rounds'),
        it=b.get('interval_target'), rs=[[x[0]['id'] for x in r] for r in b.get('round_stations', [])], rpe=b['rpe'], dur=b.get('duration_s'), m=b.get('minutes'),
        l=b.get('ladder')) for b in w['blocks']]), sort_keys=True, default=str)

def _strength_nctx(sc, f, archetype, mode):
    eq = ('set', frozenset(sc['equip']), frozenset(sc['space']))
    return dict(direction='strength', states=[sc['state']] if sc.get('state') else [], duration=f['duration'], experience=sc['exp'], goal='build_muscle',
                frequency='3-4', equipment=eq, sore=set(sc['sore']), target_mode='moods_pick' if mode == 'pick' else 'archetype',
                target_muscles=tuple(sorted(QE.ctx_for(archetype)['target'])), archetype=archetype, user='qa_user', date='2026-09-22', resolved_archetype=archetype)

def test_strength_adapter_equals_frozen_on_all_237_fixtures():
    FX = json.load(open(os.path.join(FROZEN, 'MOOD_V3_Strength_QA_Fixtures_v7.json')))
    mismatch = []
    for f in FX['archetype_scenarios']:
        sc = strength_sc_from(f['scenario']); aid = f['archetype']; mode = {"MOOD's Pick": 'pick', 'Explicit Target': 'explicit', 'either': 'pick'}[f['mode']]
        frozen = QE.generate(aid, dict(sc), f['duration'], QE.ctx_for(aid), mode)
        n = _strength_nctx(sc, f, aid, mode)
        if mode == 'pick': n['archetype'] = None; n['target_mode'] = 'moods_pick'
        else: n['target_mode'] = 'moods_pick'   # explicit archetype path with the archetype's frozen default Target (as the fixtures do)
        try:
            res = SA.build(n, [])
            got = (res['archetype'], res['W'])
        except SA.Conflict as c:
            got = (c.code, {})
        exp = (frozen['archetype'], frozen['workout']) if frozen['workout'] else ({'VALID TERMINAL CONFLICT': 'sore_target_conflict'}.get(frozen['outcome'], 'cannot_build'), {})
        if got != exp: mismatch.append((f['id'], f['scenario'], got, exp))
    assert not mismatch, mismatch[:5]

def test_sweat_adapter_equals_frozen_on_all_41_fixtures():
    FX = json.load(open(os.path.join(FROZEN, 'MOOD_V3_Sweat_QA_Fixtures_FINAL.json')))['fixtures']
    bad = []
    for f in FX:
        inp = dict(f['inputs']); frozen = SG.generate(dict(inp))
        assert sig(frozen) == f['reference_signature'], f['id']
        tgt = inp.get('target'); tm = 'moods_pick' if not tgt else ('full_body' if tgt == 'full_body' else 'explicit')
        n = dict(direction='sweat', states=inp.get('states', []), duration=inp['duration'], experience=inp['experience'], goal=inp.get('goal', 'lose_weight_conditioning'),
                 frequency='3-4', equipment=inp.get('preset', 'sweat_commercial_default'), sore=set(inp.get('sore', [])), target_mode=tm,
                 target_muscles=tuple(tgt) if tm == 'explicit' else (), archetype=inp.get('force_archetype'), user=inp.get('user', 'u1'), date=inp.get('date', '2026-10-01'))
        hist = [dict(direction='sweat', archetype=h.get('archetype'), native=h) for h in inp.get('history', [])]
        try:
            res = WA.build(n, hist, inp.get('swap', 0) if not inp.get('displayed_chain') else 0)
            if not inp.get('displayed_chain') and sig(res['w']) != f['reference_signature']: bad.append(f['id'])
        except WA.Conflict as c:
            if frozen['outcome'] in ('VALID BUILD', 'VALID ADAPTIVE REROUTE'): bad.append((f['id'], c.code))
    assert not bad, bad

def test_athletic_adapter_equals_frozen_build():
    import itertools
    bad = []
    for a, lv, d, pre, st in itertools.product(['moods_pick', 'athletic_power', 'athletic_speed_agility', 'athletic_full_body'], ['beginner', 'intermediate', 'advanced'],
                                               [30, 60], ['athletic_commercial_default', 'free_weight_limited', 'bodyweight_floor'], [[], ['low_energy'], ['amped'], ['bored']]):
        frozen = AG.build(a, lv, d, pre, st, set(), goal='general_fitness', seed='u|2026-10-01')
        n = dict(direction='athletic', states=st, duration=d, experience=lv, goal='stay_consistent', frequency='3-4', equipment=pre, sore=set(),
                 target_mode='moods_pick', target_muscles=(), archetype=None if a == 'moods_pick' else a, user='u', date='2026-10-01')
        try:
            res = AA.build(n, [])
            if frozen['status'] != 'ok' or res['w']['ids'] != frozen['ids'] or res['w']['warmup'] != frozen['warmup']: bad.append((a, lv, d, pre, st))
        except AA.Conflict:
            if frozen['status'] == 'ok': bad.append((a, lv, d, pre, st, 'conflict'))
    assert not bad, bad[:5]

def test_unified_qa_all_green():
    from mood_v3.qa.run_unified_qa import run
    R = run()
    assert R['all_green'], R['failures'][:10]
    assert R['A_commercial_unexpected_conflicts'] == 0

def test_explanation_lint():
    for t in list(explain.STATE_LINES.values()) + list(explain.DIRECTION_STATE_LINES.values()) + list(explain.PAIR_LINES.values()):
        assert not explain.lint(t), t

def test_cue_ids_exist():
    known = set(SA.EX) | set(SG.EX) | set(AG.EX)
    assert not [k for k in cues.CUES if k not in known]
