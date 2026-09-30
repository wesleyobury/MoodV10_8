"""Random production-path sample for the human trainer read (seeded; any inputs, any level, States, soreness, Target)."""
import random, sys, json
from mood_v3 import service as S
from mood_v3.qa.athletic_envelope_audit import render

def sample(n=30, seed=2026, dur=None):
    rnd = random.Random(seed); out = []
    for k in range(n):
        raw = dict(direction='athletic', experience=rnd.choice(['beginner', 'intermediate', 'intermediate', 'advanced']), duration=dur or rnd.choice([30, 60, 60, 60]),
                   equipment='commercial_gym',
                   goal=rnd.choice(['improve_athleticism', 'build_strength', 'build_muscle', 'lose_weight_conditioning', 'feel_better_reduce_stress', 'stay_consistent']),
                   date=f'2026-10-{rnd.randint(1, 28):02d}')
        r = rnd.random()
        if r < 0.45: raw['states'] = rnd.sample(['low_energy', 'bored', 'irritated', 'amped', 'stressed'], rnd.choice([1, 1, 2]))
        if rnd.random() < 0.15: raw['soreness'] = [rnd.choice(['legs', 'shoulders', 'lower_back', 'chest'])]
        c = rnd.random()
        if c < 0.2: raw['archetype'] = rnd.choice(['athletic_power', 'athletic_speed_agility', 'athletic_full_body'])
        env, st = S.generate_workout(raw, f'tr{k}' if dur is None else f'tr{dur}-{seed}-{k}')
        out.append(render(env, f"T{k + 1:02d} " + json.dumps({a: b for a, b in raw.items() if a not in ('direction', 'date')})))
    return out

if __name__ == '__main__':
    if len(sys.argv) > 2: open(sys.argv[1], 'w').write('\n'.join(sample(30, 2029, int(sys.argv[2]))))   # freeze pass: 30 random 60-minute sessions
    else: open(sys.argv[1], 'w').write('\n'.join(sample()))
