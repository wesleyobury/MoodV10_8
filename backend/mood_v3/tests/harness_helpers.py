"""Scenario -> Strength scenario dict, restated from the frozen Strength QA harness (run_qa.sc_from)."""
from mood_v3.engines.strength.qa_engine import sc_base, expand, NOBAR, FREEONLY

SORE = {'shoulders': expand('shoulders'), 'lower back (spinal_erectors)': {'spinal_erectors'}, 'back (lats+erectors)': expand('back'),
        'hamstrings': {'hamstrings'}, 'glutes': {'glutes'}, 'chest': {'chest'}, 'biceps': {'biceps'}, 'quads': {'quads'}}

def strength_sc_from(name):
    s = sc_base()
    if name.startswith('S3'): s['state'] = 'low_energy'
    elif name.startswith('S4'): s['state'] = 'stressed'
    elif name.startswith('S5'): s['state'] = 'bored'
    elif name.startswith('S6'): s['state'] = 'irritated'
    elif name.startswith('S7'): s['state'] = 'amped'
    elif name.startswith('S8'): s['exp'] = 'beginner'
    elif name.startswith('S9a'): s['equip'] = NOBAR
    elif name.startswith('S9b'): s['equip'] = FREEONLY
    elif name.startswith('S10'): s['sore'] = SORE[name[len('S10 Sore '):]]
    elif name.startswith('S11'):
        s['exp'] = 'beginner'; s['state'] = {'Low Energy': 'low_energy', 'Stressed': 'stressed', 'Irritated': 'irritated'}[name.split('+ ')[1].split(' /')[0].strip()]
    return s
