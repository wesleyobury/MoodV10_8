"""Guided Session compiler fixtures: production-path V3 envelopes covering every reachable block structure.

Run from backend/:
    python3 mood_v3/qa/guided_session_fixtures.py ../frontend/utils/v3Session/__fixtures__/envelopes.json          (stratified set, committed)
    python3 mood_v3/qa/guided_session_fixtures.py /tmp/all.jsonl --all                                              (every build, for a full sweep)

The frontend tests (utils/v3Session/*.test.ts) compile each fixture and assert the Session Plan invariants. Fields the player
never reads (explanations, today header, adjustments) are stripped to keep the file small.
"""
import itertools, json, random, sys
sys.path.insert(0, '.')
from mood_v3 import service as S
from mood_v3.qa.run_unified_qa import STATE_SETS, SORE_FOR_STATE, EQUIP, EXPS, TARGETS

DATES = ['2026-10-05', '2026-10-06', '2026-10-09', '2026-11-12']
GOALS = ['stay_consistent', 'build_muscle', 'build_strength', 'lose_weight_conditioning', 'improve_athleticism', 'feel_better_reduce_stress']
KEEP = ('workout_id', 'version', 'direction', 'direction_name', 'archetype', 'duration', 'experience', 'states', 'warmup', 'blocks', 'cooldown', 'target')

# D1 regression inputs (the State lengthens timed-circuit bouts)
D1 = [
    ('user9', dict(direction='sweat', equipment='commercial_gym', states=['low_energy', 'amped'], soreness=['legs'], duration=60, experience='intermediate', date='2026-11-12', goal='improve_athleticism', target='full_body')),
    ('user4', dict(direction='sweat', equipment='commercial_gym', states=['low_energy'], soreness=[], duration=30, experience='beginner', date='2026-11-12', goal='feel_better_reduce_stress', archetype='sweat_circuit')),
]


def strip(env, tag):
    w = {k: env['workout'].get(k) for k in KEEP}
    w['workout_id'] = w['workout_id'] or tag
    for b in w['blocks']:
        for it in b['items']:
            it.pop('swap', None)
            it['cues'] = (it.get('cues') or [])[:1]
    return w


def signature(w):
    """Coarse structural identity: one fixture per (direction, archetype, block shapes). Per-item features are covered by
    FEATURES below so the committed set stays small."""
    blocks = tuple((b['structure'], b['rest']['kind'], bool(b['rest']['full_recovery']), bool(b['rest'].get('transition_sec'))) for b in w['blocks'])
    return (w['direction'], w['archetype']['id'], blocks)


def features(w):
    out = set()
    for b in w['blocks']:
        for it in b['items']:
            rx = it['prescription']
            out.add((w['direction'], b['structure'], rx['kind'], bool(rx['per_side']), bool(rx.get('scaling')), bool(it.get('quality_stop')),
                     bool(rx.get('reps_scheme')), bool((rx.get('direction_fields') or {}).get('round_doses')), (rx.get('direction_fields') or {}).get('set_method')))
    out.add(('warmup_items', bool(w['warmup'] and w['warmup']['items']), 'cooldown', bool(w['cooldown'])))
    return out


def main(out, everything=False, per_dir=1400):
    random.seed(11)
    rows, seen, feats = [], set(), set()
    n = 0
    for user, req in D1:
        env, _ = S.generate_workout(dict(req, persist=False), user)
        rows.append(dict(tag=f'd1_{user}', workout=strip(env, f'd1_{user}')))
    for d in ('strength', 'sweat', 'athletic'):
        grid = list(itertools.product(TARGETS[d], STATE_SETS, [30, 60], EXPS, EQUIP, DATES, GOALS))
        random.shuffle(grid)
        for i, (tg, st, dur, exp, eq, date, goal) in enumerate(grid[:per_dir]):
            raw = dict(direction=d, states=[s for s in st if s != 'sore'], soreness=(SORE_FOR_STATE[d] if 'sore' in st else []), duration=dur,
                       experience=exp, equipment=eq, date=date, goal=goal, persist=False, **tg)
            env, state = S.generate_workout(raw, f'user{i % 13}')
            if env['status'] != 'ok': continue
            n += 1
            envs = [env]
            if state and i % 4 == 0:
                e2, _ = S.swap_workout(state, env)
                if e2['status'] == 'ok': envs.append(e2)
            for e in envs:
                w = e['workout']; sig = signature(w); fs = features(w)
                if everything or sig not in seen or not fs <= feats:
                    seen.add(sig); feats |= fs
                    rows.append(dict(tag=f'{d}_{len(rows)}', workout=strip(e, f'{d}_{len(rows)}')))
    if out.endswith('.jsonl'):
        with open(out, 'w') as f:
            for r in rows: f.write(json.dumps(r, separators=(',', ':')) + '\n')
    else:
        json.dump(rows, open(out, 'w'), separators=(',', ':'))
    print(f'{len(rows)} fixtures from {n} builds -> {out}', file=sys.stderr)


if __name__ == '__main__':
    main(sys.argv[1], everything='--all' in sys.argv, per_dir=int(next((a.split('=')[1] for a in sys.argv if a.startswith('--per=')), 1400)))
