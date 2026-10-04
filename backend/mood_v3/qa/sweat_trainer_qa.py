"""Sweat final pre-launch trainer-quality QA (Oct 2026).

Generates a large matrix of REAL production-path Sweat workouts (service.generate_workout) and measures the finished session:
elapsed minutes, programmed work minutes (everything between warm-up and downshift), active minutes, hard minutes, structure,
engine volume, impact, stations, plus the Sweat Trainer Coherence Gate verdict. Prints a summary and writes JSON + a readable
text pack.

Run from backend/:  python -m mood_v3.qa.sweat_trainer_qa out_prefix   (writes out_prefix.json and out_prefix_pack.txt)
"""
from __future__ import annotations
import sys, json, itertools, statistics as st, collections
sys.path.insert(0, '.')
from mood_v3 import service as S
from mood_v3.engines.sweat import sweat_core as C

CAP = {}
_of = S._finish
def _finish(ctx, res, *a, **k):
    env = _of(ctx, res, *a, **k)
    CAP['res'] = res
    return env
S._finish = _finish

SEEDS = [('u%d' % i, '2026-10-%02d' % (10 + i)) for i in range(1, 5)]
GOALS = ['lose_weight_conditioning', 'improve_athleticism', 'build_muscle', 'build_strength', 'feel_better_reduce_stress', 'stay_consistent']
SINGLE = [[], ['low_energy'], ['stressed'], ['bored'], ['irritated'], ['amped']]
PAIRS = [['low_energy', 'amped'], ['amped', 'stressed'], ['bored', 'stressed'], ['irritated', 'low_energy'], ['irritated', 'stressed'], ['bored', 'low_energy'], ['amped', 'bored'], ['amped', 'irritated']]
TRIPLES = [['low_energy', 'stressed', 'irritated'], ['amped', 'bored', 'irritated'], ['stressed', 'bored', 'amped'], ['low_energy', 'bored', 'amped']]
ARCH = ['sweat_engine', 'sweat_circuit', 'sweat_hybrid']
EXPS = ('beginner', 'intermediate', 'advanced')


def base(user, date, states, dur, exp, **kw):
    d = dict(direction='sweat', states=states, duration=dur, experience=exp, goal=kw.pop('goal', 'lose_weight_conditioning'), equipment='commercial_gym', date=date, _user=user)
    d.update(kw); return d


def metrics(res):
    w = res['w']; exp = w['experience']; dur = w['duration']; aid = w['archetype_id']; blocks = w['blocks']
    B = w['budget']
    setup = sum(b.get('setup_s', 0) for b in blocks if b.get('anchor')) / 60.0
    prog = sum(C.block_minutes(b, exp) for b in blocks) + C.BLOCK_GAP_MIN * max(0, len(blocks) - 1)
    p = blocks[0]
    return dict(
        arch=aid, dur=dur, exp=exp, states=list(w['states']), est=w['est_minutes'], warmup=w['warm_up_min'], downshift=w['downshift_min'],
        work=round(prog - setup, 1), floor=(C.work_floor(blocks, dur, exp) if hasattr(C, 'work_floor') else None), setup=round(setup, 1), active=B['active_min'], hard=B['hard_min'], engine_min=B['engine_min'],
        shape=p.get('shape'), structure=p['structure'], structures=[b['structure'] for b in blocks], comp=[b.get('comp_type') for b in blocks[1:]],
        rpe=[list(b['rpe']) for b in blocks], blocks=len(blocks), stations=B['stations'], impact=B['impact_contacts'], loaded_reps=B['loaded_reps'],
        transitions=B['transitions'], primary_min=round(C.block_minutes(p, exp), 1), steady_primary=(p['structure'] == 'continuous'),
        completeness=(res.get('completeness') or {}).get('label'), gate=[x for x in res.get('trainer_gate') or []],
        items=[e['id'] for b in blocks for e in b['items_e']], expressions=res.get('expressions'),
        state_gate=res.get('state_gate'), coherence_failed=[s for s, v in (res.get('coherence') or {}).items() if not v.get('passed')],
        gate_attempt=next((l.get('attempt') for l in res.get('log', []) if isinstance(l, dict) and l.get('reason_code') == 'trainer_gate'), 0),
    )


def describe(env, m):
    w = env['workout']
    lines = [f"[{m['arch'].split('_')[1]} {m['dur']}m {m['exp']} {'+'.join(m['states']) or 'no-State'}] est {m['est']} | work {m['work']} | active {m['active']} | hard {m['hard']} | WU {m['warmup']} DS {m['downshift']} setup {m['setup']}"
             + (f" | GATE {m['gate']}" if m['gate'] else '')]
    for b in w['blocks']:
        hdr = f"  - {b.get('title')} [{b['structure']}] {b.get('est_minutes')} min RPE {(b.get('effort') or {}).get('rpe')}"
        if b.get('rounds'): hdr += f" x{b['rounds']} rest {b.get('rest_between_rounds_sec')}"
        if b.get('interval'): hdr += f" {b['interval']}"
        lines.append(hdr)
        for it in b['items']: lines.append(f"      {it['exercise']['name']}: {it['prescription']['display']}")
    return '\n'.join(lines)


ROWS = []; PACK = []


def run(raw, tag, hist=()):
    env, state = S.generate_workout(raw, raw['_user'], list(hist), [])
    if env['status'] != 'ok':
        ROWS.append(dict(tag=tag, status=env['status'], conflict=env['conflict']['code'], raw={k: v for k, v in raw.items() if k[0] != '_'})); return None, None
    m = metrics(CAP['res']); m.update(tag=tag, status='ok', user=raw['_user'], date=raw['date'], goal=raw.get('goal'), equipment=raw.get('equipment'), target=raw.get('target'), soreness=raw.get('soreness'))
    ROWS.append(m); PACK.append(describe(env, m)); return m, state


def matrix():
    for (u, dt), a, states, dur, exp in itertools.product(SEEDS, ARCH, SINGLE + PAIRS + TRIPLES, (30, 60), EXPS):
        run(base(u, dt, states, dur, exp, archetype=a, goal=GOALS[SEEDS.index((u, dt)) % len(GOALS)]), 'arch')
    for (u, dt), states, dur, exp in itertools.product(SEEDS, SINGLE + PAIRS[:3], (30, 60), EXPS):
        run(base(u, dt, states, dur, exp, goal=GOALS[(SEEDS.index((u, dt)) + 2) % len(GOALS)]), 'pick')
    for (u, dt), a, g in itertools.product(SEEDS[:2], ARCH, GOALS):
        run(base(u, dt, [], 60, 'intermediate', archetype=a, goal=g), 'goal')
    for (u, dt), t, states, dur in itertools.product(SEEDS[:2], [['chest'], ['quads', 'glutes'], ['back', 'biceps'], ['shoulders'], ['core'], ['chest', 'shoulders', 'triceps']], [[], ['stressed'], ['amped'], ['low_energy']], (30, 60)):
        run(base(u, dt, states, dur, 'intermediate', target=t), 'target')
    for (u, dt), a, sore, states in itertools.product(SEEDS[:2], ARCH + [None], ['legs', 'shoulders', 'lower_back', 'chest'], [[], ['irritated'], ['low_energy'], ['amped']]):
        kw = dict(soreness=[sore])
        if a: kw['archetype'] = a
        run(base(u, dt, states, 60, 'intermediate', **kw), 'sore')
    for (u, dt), a, eq, exp, states in itertools.product(SEEDS[:2], ARCH + [None], ['minimal', 'free_weight_limited', 'commercial_gym'], ('beginner', 'advanced'), [[], ['stressed'], ['amped']]):
        kw = {}
        if a: kw['archetype'] = a
        for dur in (30, 60): run(base(u, dt, states, dur, exp, equipment=eq, **kw), 'equip')
    for u, pattern, arch, exp in (('h1', [[]] * 6, None, 'intermediate'), ('h2', [['stressed']] * 5, 'sweat_engine', 'intermediate'), ('h3', [['amped']] * 5, 'sweat_engine', 'advanced'), ('h4', [['bored']] * 5, 'sweat_circuit', 'intermediate')):
        hist = []
        for i, s in enumerate(pattern):
            m, state = run(base(u, '2026-11-%02d' % (1 + 2 * i), s, 60, exp, archetype=arch), 'seq', hist)
            if state: hist.append(dict(state['history_record'], completed_at='x'))


def q(xs, p):
    xs = sorted(xs); return xs[min(len(xs) - 1, int(p * len(xs)))] if xs else None


def summary():
    ok = [r for r in ROWS if r['status'] == 'ok']; bad = [r for r in ROWS if r['status'] != 'ok']
    out = [f"builds {len(ROWS)}  ok {len(ok)}  conflicts {len(bad)} {collections.Counter(r['conflict'] for r in bad).most_common()}"]
    for dur in (30, 60):
        rs = [r for r in ok if r['dur'] == dur]
        out.append(f"\n== {dur} min ({len(rs)}): est p10/med/p90 {q([r['est'] for r in rs], .1)}/{q([r['est'] for r in rs], .5)}/{q([r['est'] for r in rs], .9)}"
                   f"  work p10/min/med {q([r['work'] for r in rs], .1)}/{min(r['work'] for r in rs)}/{q([r['work'] for r in rs], .5)}"
                   f"  active med {q([r['active'] for r in rs], .5)}  steady-primary {sum(r['steady_primary'] for r in rs)}  gate-fail {sum(1 for r in rs if r['gate'])}")
        for key, f in (('arch', lambda r: r['arch']), ('exp', lambda r: r['exp']), ('state', lambda r: '+'.join(r['states']) or 'none')):
            groups = collections.defaultdict(list)
            for r in rs: groups[f(r)].append(r)
            for g, xs in sorted(groups.items(), key=lambda kv: kv[0]):
                if key == 'state' and len(xs) < 12: continue
                out.append(f"   {key:5s} {g:32s} n={len(xs):4d} est med {q([r['est'] for r in xs], .5):5.1f} min {min(r['est'] for r in xs):5.1f} | work p10 {q([r['work'] for r in xs], .1):5.1f} med {q([r['work'] for r in xs], .5):5.1f} min {min(r['work'] for r in xs):5.1f} | active med {q([r['active'] for r in xs], .5):5.1f} | hard med {q([r['hard'] for r in xs], .5):4.1f}")
    gates = collections.Counter(g.split(':')[0] for r in ok for g in r['gate'])
    sg = collections.Counter(s for r in ok for s, v in (r.get('state_gate') or {}).items() if not v)
    cf = collections.Counter(s for r in ok for s in r.get('coherence_failed') or [])
    out.append(f"State not realized (by State): {dict(sg)}   State coherence failed: {dict(cf)}")
    out.append(f"gate re-rolls: {sum(1 for r in ok if r.get('gate_attempt'))} of {len(ok)}")
    out.append(f"\ntrainer gate issues: {gates.most_common()}")
    return '\n'.join(out)


if __name__ == '__main__':
    pre = sys.argv[1] if len(sys.argv) > 1 else '/tmp/sweat_trainer_qa'
    matrix()
    s = summary(); print(s)
    json.dump(ROWS, open(pre + '.json', 'w'), indent=0, default=str)
    open(pre + '_pack.txt', 'w').write(s + '\n\n' + '\n\n'.join(PACK))
