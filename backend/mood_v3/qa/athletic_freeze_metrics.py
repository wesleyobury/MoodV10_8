"""Athletic founder-pass / freeze metrics (production path, commercial gym = the only equipment context the app knows).

    python -m mood_v3.qa.athletic_freeze_metrics OUT.txt [--workload-only]
"""
from __future__ import annotations
import itertools, statistics, sys
from collections import Counter, defaultdict
from mood_v3 import service as S

LEVELS = ['beginner', 'intermediate', 'advanced']
GOALS = ['improve_athleticism', 'build_strength', 'build_muscle', 'lose_weight_conditioning', 'feel_better_reduce_stress', 'stay_consistent']
STATE_SETS = [[], ['low_energy'], ['bored'], ['irritated'], ['amped'], ['stressed'], ['low_energy', 'amped'], ['amped', 'stressed'], ['bored', 'stressed'],
              ['irritated', 'low_energy'], ['irritated', 'stressed'], ['bored', 'low_energy']]
DRILLS = {'sprint_to_stick', 'backpedal_to_stick', 'lateral_shuffle_stick', 'short_shuttle', 'pro_agility_shuttle', 'cut_and_go', 'carioca', 'crossover_sprint',
          'shuffle_crossover_sprint', 'dot_drill', 'line_hops', 'high_knees'}
OLY = {'hang_power_clean', 'power_snatch', 'split_jerk', 'push_press', 'hang_high_pull', 'db_hang_power_clean', 'db_snatch', 'kb_snatch', 'hang_clean_to_box_knee_drive'}


def med(v): return statistics.median(v) if v else 0


def rows(n_users=6):
    out = []
    for lv, dur, goal, st in itertools.product(LEVELS, [30, 60], GOALS, STATE_SETS):
        if st and goal not in ('stay_consistent', 'improve_athleticism', 'build_strength'): continue
        for u in range(n_users):
            raw = dict(direction='athletic', experience=lv, duration=dur, goal=goal, states=st, date='2026-10-12')
            env, _ = S.generate_workout(raw, f"fz{u}|{lv}|{dur}|{goal}|{'+'.join(st)}")
            if env['status'] != 'ok': out.append(dict(raw=raw, conflict=env['conflict']['code'])); continue
            w = env['workout']; its = [it for b in w['blocks'] for it in b['items']]
            a = w.get('athletic') or {}
            pw = [it for it in its if (it['prescription'].get('direction_fields') or {}).get('type') == 'power']
            out.append(dict(raw=raw, w=w, ids=[it['exercise']['id'] for it in its], wu=[x['exercise']['id'] for x in w['warmup']['items'] if x.get('exercise')],
                            structure=a.get('structure'), pq=a.get('primary_quality'), acc=a.get('accounting', {}), gate=a.get('state_gate', {}), coh=a.get('coherence', {}),
                            oly=[it for it in its if it['exercise']['id'] in OLY], pw=pw, blocks=w['blocks']))
    return out


def workload(R):
    ok = [r for r in R if 'w' in r]
    L = []
    for lv in LEVELS:
        for dur in (30, 60):
            sub = [r for r in ok if r['raw']['experience'] == lv and r['raw']['duration'] == dur]
            A = lambda k: med([r['acc'].get(k, 0) for r in sub])
            L.append(f"  {lv:12} {dur}  n={len(sub):3}  exercises {A('n_items')}  explosive ex {A('n_explosive')} (max {max(r['acc'].get('n_explosive', 0) for r in sub)})  explosive sets {A('explosive_sets')}"
                     f"  contacts {A('contacts')}  sprints {A('sprint_exposures')}  sled {A('sled_efforts')}  strength sets {A('strength_sets')}  intent {A('intent_load')}  est {A('est')}")
    return L


def main(path, workload_only=False):
    R = rows(); ok = [r for r in R if 'w' in r]
    L = [f"production-path builds {len(R)} (commercial gym); ok {len(ok)}; conflicts {Counter(r['conflict'] for r in R if 'conflict' in r)}", '', '== Workload (medians)'] + workload(R)
    if workload_only:
        open(path, 'w').write('\n'.join(L) + '\n'); return L
    drill_hits = [r for r in ok if set(r['ids'] + r['wu']) & DRILLS]
    L += ['', f"== Drills: sessions containing an agility / footwork drill (work or warm-up): {len(drill_hits)} of {len(ok)}",
          f"   structures seen: {dict(Counter(r['structure'] for r in ok))}", f"   primary qualities seen: {dict(Counter(r['pq'] for r in ok))}"]
    L += ['', '== Olympic-derivative sessions (share of sessions with one; no State and all States)']
    for lv in LEVELS:
        sub = [r for r in ok if r['raw']['experience'] == lv]
        L.append(f"  {lv:12} {sum(bool(r['oly']) for r in sub)}/{len(sub)} = {sum(bool(r['oly']) for r in sub) / len(sub):.0%}   60 min {sum(bool(r['oly']) for r in sub if r['raw']['duration'] == 60)}/{sum(1 for r in sub if r['raw']['duration'] == 60)}")
    L.append('  by goal (intermediate / advanced, no State):')
    for g in GOALS:
        c = []
        for lv in ('intermediate', 'advanced'):
            sub = [r for r in ok if r['raw']['experience'] == lv and r['raw']['goal'] == g and not r['raw']['states']]
            c.append(f"{lv[:3]} {sum(bool(r['oly']) for r in sub)}/{len(sub)} ({sum(bool(r['oly']) for r in sub) / max(1, len(sub)):.0%})")
        L.append(f"    {g:26} " + '   '.join(c))
    L.append('  by structure (intermediate + advanced):')
    ia = [r for r in ok if r['raw']['experience'] != 'beginner']
    for s in sorted({r['structure'] for r in ia}):
        sub = [r for r in ia if r['structure'] == s]
        L.append(f"    {s:16} {sum(bool(r['oly']) for r in sub)}/{len(sub)} ({sum(bool(r['oly']) for r in sub) / len(sub):.0%})")
    L.append('  by State (intermediate + advanced):')
    for st in STATE_SETS:
        sub = [r for r in ia if r['raw']['states'] == st]
        if sub: L.append(f"    {'+'.join(st) or 'none':22} {sum(bool(r['oly']) for r in sub)}/{len(sub)} ({sum(bool(r['oly']) for r in sub) / len(sub):.0%})")
    L.append(f"  exercises used: {dict(Counter(it['exercise']['name'] for r in ok for it in r['oly']))}")
    bad_fresh = [r for r in ok for it in r['oly'] if not any(b['type'] in ('primary', 'secondary') and it in b['items'] for b in r['blocks'])]
    bad_dose = [it for r in ok for it in r['oly'] if (it['prescription'].get('reps') or 0) > 3 or (it['prescription'].get('rest_sec') or 999) < 90]
    L.append(f"  Olympic not in the primary / secondary block: {len(bad_fresh)} · Olympic dose outside <=3 reps / >=90 s rest: {len(bad_dose)} · beginner Olympic: {sum(bool(r['oly']) for r in ok if r['raw']['experience'] == 'beginner')}")
    L.append(f"  max explosive exercises in any session: {max(r['acc'].get('n_explosive', 0) for r in ok)}")
    g = defaultdict(lambda: [0, 0, 0])
    for r in ok:
        for s, v in r['gate'].items(): g[s][0] += 1; g[s][1] += v; g[s][2] += r['coh'].get(s, False)
    L += ['', '== State Satisfaction / Coherence'] + [f"  {s:12} n={n} satisfied {a / n:.1%} coherent {c / n:.1%}" for s, (n, a, c) in sorted(g.items())]
    # Different Workout + swap
    dq = dp = dn = 0; sn = sv = sc = 0
    for k, (lv, arch) in enumerate(itertools.product(LEVELS, [None, 'athletic_power', 'athletic_speed_agility', 'athletic_full_body'])):
        raw = dict(direction='athletic', experience=lv, duration=60, date='2026-10-12', **({'archetype': arch} if arch else {}))
        env, st = S.generate_workout(raw, f'fzdw{k}')
        e2, _ = S.swap_workout(st, env)
        if e2['status'] == 'ok':
            dn += 1; dq += e2['workout']['athletic']['primary_quality'] != env['workout']['athletic']['primary_quality']
            dp += e2['workout']['blocks'][0]['items'][-1]['exercise']['id'] != env['workout']['blocks'][0]['items'][-1]['exercise']['id']
        for b in env['workout']['blocks']:
            for it in b['items']:
                sn += 1; e3, _ = S.swap_exercise(st, env, it['item_id'])
                if e3['status'] != 'ok': sc += 1; continue
                new = next(x for bb in e3['workout']['blocks'] for x in bb['items'] if x['item_id'] == it['item_id'])
                d0, d1 = it['prescription']['direction_fields'], new['prescription']['direction_fields']
                sv += new['role'] == it['role'] and d0['type'] == d1['type'] and new['prescription']['sets'] == it['prescription']['sets'] and new['exercise']['id'] not in DRILLS
    L += ['', f"== Different Workout {dn} runs: primary quality changed {dq}, primary exercise changed {dp}",
          f"== Swap Exercise {sn}: valid {sv}, honest no-alternative {sc}, invalid {sn - sv - sc}"]
    open(path, 'w').write('\n'.join(L) + '\n')
    return L


if __name__ == '__main__':
    print('\n'.join(main(sys.argv[1], '--workload-only' in sys.argv)))
