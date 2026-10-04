"""Athletic (Oct 2026): nothing counted in reps is prescribed below 3 reps (per side when unilateral). Snatches, cleans, combo jumps
and speed deadlifts used to land at 2. Sprints and sleds are counted in distance and keep their single efforts."""
import logging
from mood_v3 import service as S
from mood_v3.engines.athletic import athletic_core as AC

logging.disable(logging.CRITICAL)


def test_power_dose_never_below_three_reps():
    d = dict(primary_set_delta=0, rest_bonus=0, prefer=())
    for i in AC.EX:
        if i not in AC.POWER: continue
        for lv in ('beginner', 'intermediate', 'advanced'):
            for role in ('primary', 'secondary', 'tertiary', 'contrast'):
                x = AC.power_dose(i, lv, role, d, 60)
                assert x['distance_m'] is not None or x['reps'] >= 3, (i, lv, role, x['reps'])


def test_generated_athletic_sessions_have_no_two_rep_sets():
    for a in [None, 'athletic_power', 'athletic_full_body', 'athletic_speed_agility']:
        for st in [[], ['amped'], ['low_energy']]:
            for exp in ['beginner', 'advanced']:
                raw = dict(direction='athletic', states=st, experience=exp, duration=60, date='2026-10-05')
                if a: raw['archetype'] = a
                env, _ = S.generate_workout(raw, 'minreps')
                if env.get('status') != 'ok': continue
                for b in env['workout']['blocks']:
                    for it in b['items']:
                        p = it['prescription']
                        if p.get('distance_m') or p.get('seconds') or not isinstance(p.get('reps'), int): continue
                        assert p['reps'] >= 3, (it['exercise']['name'], p['display'])
