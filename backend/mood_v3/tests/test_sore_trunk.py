"""Sore lower back (Oct 2026 generator fix): a sore trunk stabilizer under an unsupported load (bent-over rows, free-weight
hinges and squats, swings) loses to a supported / non-axial alternative whenever one exists, without emptying the session.

Root cause it guards: the Upper Pull lead ranking returned before the soreness penalty was applied (Barbell / Pendlay Row led a
sore-lower-back Upper Pull), and the flat -3 secondary penalty sat below Target fit, so a loaded hinge still led a Hinge day."""
import logging
import pytest
from mood_v3 import service as S
from mood_v3.engines.strength import audit_engine as AE

logging.disable(logging.CRITICAL)
EXS = {e['name']: e for e in AE.EX.values()}
DAYS = [f'2026-10-{d:02d}' for d in range(5, 13)]


def _loaded_trunk(name):
    e = EXS.get(name)
    return bool(e and 'spinal_erectors' in e['sec'] and e['sup'] == 'unsupported')


def _items(raw, user):
    env, _ = S.generate_workout(raw, user)
    assert env['status'] == 'ok', env.get('conflict')
    return [it['exercise']['name'] for b in env['workout']['blocks'] for it in b['items']]


@pytest.mark.parametrize('exp', ['intermediate', 'advanced'])
def test_upper_pull_with_sore_lower_back_leads_with_a_supported_pull(exp):
    for i, d in enumerate(DAYS):
        items = _items(dict(direction='strength', archetype='strength_upper_pull', soreness=['lower_back'], experience=exp, duration=60, date=d), f'lb{i}')
        assert not _loaded_trunk(items[0]), (d, items)
        assert not any(_loaded_trunk(n) for n in items), (d, items)     # supported rows / cables / pulldowns exist for every slot


def test_moods_pick_and_squat_days_with_sore_lower_back_skip_loaded_hinges_and_squats():
    for a in [None, 'strength_lower_squat', 'strength_glutes_legs', 'strength_full_body']:
        for i, d in enumerate(DAYS[:5]):
            raw = dict(direction='strength', soreness=['lower_back'], duration=60, date=d)
            if a: raw['archetype'] = a
            items = _items(raw, f'lp{i}')
            assert not any(_loaded_trunk(n) for n in items), (a, d, items)


def test_hinge_day_with_sore_lower_back_still_hinges_but_not_under_a_heavy_free_weight():
    for i, d in enumerate(DAYS[:5]):
        items = _items(dict(direction='strength', archetype='strength_lower_hinge', soreness=['lower_back'], duration=60, date=d), f'lh{i}')
        assert not _loaded_trunk(items[0]), items
        assert any(EXS.get(n, {}).get('pat') == 'hinge' for n in items), items          # still a hinge day
        assert not any(_loaded_trunk(n) and EXS[n]['eq'] in ('barbell', 'trap_bar') for n in items), items   # no heavy barbell / trap-bar hinge


def test_no_overcorrection_without_soreness_or_with_other_regions():
    leads = {_items(dict(direction='strength', archetype='strength_upper_pull', experience='advanced', goal='build_strength', duration=60, date=d), f'np{i}')[0]
             for i, d in enumerate(DAYS)}
    assert leads & {'Barbell Row', 'Pendlay Row', 'T-Bar Row'}, leads        # free-weight rows still lead when nothing is sore
    for i, d in enumerate(DAYS[:4]):   # sore shoulders on a leg day: the squat / hinge library is untouched
        items = _items(dict(direction='strength', archetype='strength_lower_squat', soreness=['shoulders'], duration=60, date=d), f'sh{i}')
        assert items and items[0] in EXS
