"""Athletic metrics for the founder report (diagnostic; they never override the human read).

    python -m mood_v3.qa.athletic_metrics OUT.txt
"""
from __future__ import annotations
import itertools, statistics, sys
from collections import Counter, defaultdict
from mood_v3 import service as S

LEVELS = ['beginner', 'intermediate', 'advanced']
GOALS = ['improve_athleticism', 'build_strength', 'build_muscle', 'lose_weight_conditioning', 'feel_better_reduce_stress', 'stay_consistent']
STATE_SETS = [[], ['low_energy'], ['bored'], ['irritated'], ['amped'], ['stressed'], ['low_energy', 'amped'], ['amped', 'stressed'], ['bored', 'stressed'],
              ['irritated', 'low_energy'], ['irritated', 'stressed'], ['bored', 'low_energy']]


def med(v): return statistics.median(v) if v else '-'
def dist(v):
    if not v: return '-'
    v = sorted(v); n = len(v)
    return f"median {v[n // 2]:g} (p10 {v[n // 10]:g}, p90 {v[9 * n // 10]:g}, max {v[-1]:g})"


def grid():
    for lv, dur, eq, goal, st in itertools.product(LEVELS, [30, 60], ['commercial_gym'], GOALS, STATE_SETS):
        if st and goal not in ('stay_consistent', 'improve_athleticism'): continue
        for u in ('m1', 'm2'):
            yield dict(direction='athletic', experience=lv, duration=dur, equipment=eq, goal=goal, states=st, date='2026-10-07'), f"{u}|{lv}|{dur}|{eq}|{goal}|{'+'.join(st)}"
    for lv, dur, so in itertools.product(LEVELS, [30, 60], ['legs', 'shoulders', 'lower_back', 'chest']):
        yield dict(direction='athletic', experience=lv, duration=dur, soreness=[so], date='2026-10-07'), 's1'
    for lv, dur, t in itertools.product(LEVELS, [30, 60], [['quads', 'glutes'], ['chest', 'triceps'], ['back'], ['hamstrings'], ['core'], 'full_body']):
        yield dict(direction='athletic', experience=lv, duration=dur, target=t, date='2026-10-07'), 't1'


def main(path):
    rows = []; L = []
    for raw, u in grid():
        env, st = S.generate_workout(raw, u)
        if env['status'] != 'ok': rows.append(dict(raw=raw, conflict=env['conflict']['code'])); continue
        w = env['workout']; a = w['athletic']; acc = a['accounting']
        prim = w['blocks'][0]['items'][-1]
        rows.append(dict(raw=raw, pq=a['primary_quality'], sq=a.get('secondary_quality'), structure=a['structure'], arch=w['archetype']['id'], acc=acc,
                         finisher=any(b['type'] == 'finisher' for b in w['blocks']), gate=a['state_gate'], coh=a['coherence'], prim=prim['exercise']['id'],
                         olympic=prim['prescription']['direction_fields'].get('kind') == 'olympic'))
    ok = [r for r in rows if 'acc' in r]
    L.append(f"production-path builds: {len(rows)}; ok {len(ok)}; conflicts {Counter(r['conflict'] for r in rows if 'conflict' in r)}")
    for lv in LEVELS:
        for dur in (30, 60):
            sub = [r for r in ok if r['raw']['experience'] == lv and r['raw']['duration'] == dur]
            L.append(f"\n== {lv} {dur} min (n={len(sub)})")
            for k in ('n_items', 'n_explosive', 'explosive_sets', 'contacts', 'sprint_exposures', 'throws', 'olympic_sets', 'high_skill', 'strength_sets', 'support_sets', 'intent_load', 'est'):
                L.append(f"  {k:18} {dist([r['acc'][k] for r in sub])}")
            L.append(f"  primary quality    {dict(Counter(r['pq'] for r in sub).most_common())}")
            L.append(f"  structure          {dict(Counter(r['structure'] for r in sub).most_common())}")
            L.append(f"  Olympic primary {sum(r['olympic'] for r in sub)} · finisher {sum(r['finisher'] for r in sub)} · secondary quality {sum(1 for r in sub if r['sq'])}")
    L.append('\n== State Satisfaction / Coherence (all levels, both durations)')
    g = defaultdict(lambda: [0, 0, 0])
    for r in ok:
        for s, v in r['gate'].items():
            g[s][0] += 1; g[s][1] += v; g[s][2] += r['coh'][s]
    for s, (n, sat, coh) in sorted(g.items()): L.append(f"  {s:12} n={n} satisfied {sat / n:.1%} coherent {coh / n:.1%}")
    L.append('\n== Paired State effect (intermediate 60, commercial; each State session vs the SAME candidate built without States; 40 users)')
    L.append('   median with-State / without: explosive sets | contacts+sprints | exercises | strength top-set reps | strength RIR | max complexity | est min')
    from mood_v3.engines.athletic import athletic_core as C
    for st in STATE_SETS[1:]:
        cols = defaultdict(list)
        for k in range(40):
            nc = dict(direction='athletic', states=st, duration=60, experience='intermediate', goal='stay_consistent', equipment='athletic_commercial_default', sore=set(),
                      target_mode='moods_pick', target_muscles=(), archetype=None, user=f'p{k}', date='2026-10-07')
            o = C.generate(nc, []); A = o['A']; R = o['ref']
            if not R: continue
            stx = [x for b in o['sess']['blocks'] for x in b['items'] if x['cls'] == 'strength']
            for key, a_, r_ in (('exp', A['explosive_sets'], R['explosive_sets']), ('imp', A['contacts'] + A['accel_efforts'], R['contacts'] + R['accel_efforts']),
                                ('n', A['n_items'], R['n_items']), ('reps', stx[0]['reps'] if stx else 0, R['_strength_reps'] or 0), ('rir', min((x['rir'] for x in stx), default=0), R['_strength_rir'] or 0),
                                ('cx', A['max_cx'], R['max_cx']), ('est', A['est'], R['est'])):
                cols[key].append((a_, r_))
        f = lambda key: f"{med([a for a, _ in cols[key]]):g}/{med([r for _, r in cols[key]]):g}"
        L.append(f"  {'+'.join(st):22} {f('exp'):>9} | {f('imp'):>9} | {f('n'):>5} | {f('reps'):>5} | {f('rir'):>5} | {f('cx'):>5} | {f('est')}")
    L.append('\n== Goal differences (60 min, no State): primary quality mix, median strength sets, finisher count')
    for goal in GOALS:
        sub = [r for r in ok if r['raw']['duration'] == 60 and r['raw'].get('goal') == goal and not r['raw'].get('states')]
        L.append(f"  {goal:26} strength sets {med([r['acc']['strength_sets'] for r in sub])} · explosive sets {med([r['acc']['explosive_sets'] for r in sub])} · finishers {sum(r['finisher'] for r in sub)} · {dict(Counter(r['pq'] for r in sub).most_common(4))}")
    # history variation
    L.append('\n== History variation (30 users x 5 consecutive MOOD\'s Pick sessions, intermediate 60)')
    same_pq = same_prim = distinct = 0; seqs = 0
    for k in range(30):
        hist = []; pqs = []; prims = []
        for d in range(5):
            env, st = S.generate_workout(dict(direction='athletic', experience='intermediate', duration=60, date=f'2026-11-{d + 1:02d}'), f'h{k}', hist)
            pqs.append(env['workout']['athletic']['primary_quality']); prims.append(env['workout']['blocks'][0]['items'][-1]['exercise']['id']); hist.append(st['history_record'])
        same_pq += sum(a == b for a, b in zip(pqs, pqs[1:])); same_prim += sum(a == b for a, b in zip(prims, prims[1:])); distinct += len(set(pqs)); seqs += 1
    L.append(f"  back-to-back same primary quality {same_pq}/{seqs * 4} · back-to-back same primary exercise {same_prim}/{seqs * 4} · mean distinct primary qualities per 5 sessions {distinct / seqs:.1f}")
    # Different Workout + swap
    dw_q = dw_p = dw_n = 0; sw_ok = sw_n = sw_bad = 0; sw_conf = 0
    for k, (lv, arch) in enumerate(itertools.product(LEVELS, [None, 'athletic_power', 'athletic_speed_agility', 'athletic_full_body'])):
        raw = dict(direction='athletic', experience=lv, duration=60, date='2026-10-09', **({'archetype': arch} if arch else {}))
        env, st = S.generate_workout(raw, f'dw{k}')
        env2, st2 = S.swap_workout(st, env)
        if env2['status'] == 'ok':
            dw_n += 1; dw_q += env2['workout']['athletic']['primary_quality'] != env['workout']['athletic']['primary_quality']
            dw_p += env2['workout']['blocks'][0]['items'][-1]['exercise']['id'] != env['workout']['blocks'][0]['items'][-1]['exercise']['id']
        for b in env['workout']['blocks']:
            for it in b['items']:
                sw_n += 1
                e3, s3 = S.swap_exercise(st, env, it['item_id'])
                if e3['status'] != 'ok': sw_conf += 1; continue
                new = next(x for bb in e3['workout']['blocks'] for x in bb['items'] if x['item_id'] == it['item_id'])
                d0, d1 = it['prescription']['direction_fields'], new['prescription']['direction_fields']
                good = new['role'] == it['role'] and d0['type'] == d1['type'] and new['prescription']['sets'] == it['prescription']['sets'] and (
                    d0['type'] != 'power' or ({'low': 0, 'moderate': 1, 'high': 2}[d1['impact']] <= {'low': 0, 'moderate': 1, 'high': 2}[d0['impact']]))
                sw_ok += good; sw_bad += not good
    L.append(f"\n== Different Workout: {dw_n} runs · primary quality changed {dw_q} · primary exercise changed {dw_p}")
    L.append(f"== Swap Exercise: {sw_n} swaps · valid (role, type, sets, impact kept) {sw_ok} · invalid {sw_bad} · honest no-alternative {sw_conf}")
    open(path, 'w').write('\n'.join(L) + '\n')
    return L


if __name__ == '__main__':
    print('\n'.join(main(sys.argv[1])))
