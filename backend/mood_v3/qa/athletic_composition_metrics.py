"""Athletic identity metrics (identity pass). Production path, commercial gym.

    python -m mood_v3.qa.athletic_composition_metrics OUT.txt

Categories come from exercise identity, not from block names or cues:
  ATHLETIC           a distinct athletic movement (jump, hop, bound, sprint, sled, throw, slam, Olympic / explosive lift, explosive
                     push-up, muscle-up, step-up with pop, split-squat jump, speed-strength variant ...), including the explosive half of a contrast pair
  ATHLETIC_STRENGTH  traditional strength that supports it (squat, deadlift, RDL, split squat, pull-up, row, press ...), including the heavy half of a contrast pair
  SUPPORT            trunk / tendon / hamstring accessories and the rare finisher
"""
from __future__ import annotations
import statistics, sys
from collections import Counter, defaultdict
from mood_v3.qa.athletic_freeze_metrics import rows, LEVELS, GOALS
from mood_v3.engines.athletic import athletic_core as C

CARRIES = {'farmer_carry', 'suitcase_carry', 'front_rack_carry', 'overhead_carry'}
PULLS = {'pull_up', 'chin_up', 'inverted_row', 'suspension_row', 'single_arm_db_row', 'chest_supported_db_row', 'meadows_row'}
MU = {'bar_muscle_up', 'band_assisted_muscle_up'}
IDENT = {i for i, e in C.EX.items() if e.get('identity_new')} | {'split_jump'}
CAT = {'power': 'ATHLETIC', 'strength': 'ATHLETIC_STRENGTH', 'support': 'SUPPORT', 'finisher': 'SUPPORT'}


def comp(r):
    its = [it for b in r['blocks'] for it in b['items']]
    cat = [CAT[(it['prescription'].get('direction_fields') or {}).get('type')] for it in its]
    ids = [it['exercise']['id'] for it in its]
    tiers = [C.tier(i, it.get('role')) for i, it, c in zip(ids, its, cat) if c == 'ATHLETIC']
    return dict(a=cat.count('ATHLETIC'), s=cat.count('ATHLETIC_STRENGTH'), o=cat.count('SUPPORT'), carry=bool(set(ids) & CARRIES), pull=bool(set(ids) & PULLS),
                mu=bool(set(ids) & MU), ident=bool(set(ids) & IDENT), tiers=tiers, xs=r['acc'].get('explosive_sets'), ct=r['acc'].get('contacts'),
                il=r['acc'].get('intent_load'), ss=r['acc'].get('strength_sets'), est=r['acc'].get('est'))


def pct(n, d): return f"{n / max(1, d):.0%}"


def line(label, sub):
    n = len(sub); ca = Counter(min(c['a'], 4) for c in sub)
    return (f"  {label:26} n={n:4}  athletic 1/2/3/4+: {pct(ca[1], n):>4} {pct(ca[2], n):>4} {pct(ca[3], n):>4} {pct(ca[4], n):>4}"
            f" | mean ATHLETIC {statistics.mean(c['a'] for c in sub):.2f}  ATHLETIC_STRENGTH {statistics.mean(c['s'] for c in sub):.2f}  SUPPORT {statistics.mean(c['o'] for c in sub):.2f}"
            f" | other>athletic {pct(sum(c['s'] + c['o'] > c['a'] for c in sub), n):>4}")


def detail(label, sub):
    n = len(sub); t = Counter(x for c in sub for x in c['tiers'])
    return (f"  {'':26}         carry {pct(sum(c['carry'] for c in sub), n)}  pull-up/row {pct(sum(c['pull'] for c in sub), n)}  muscle-up {pct(sum(c['mu'] for c in sub), n)}"
            f"  athletic variants (pop / split jump / speed) {pct(sum(c['ident'] for c in sub), n)}  tiers A/B/C {t['A']}/{t['B']}/{t['C']}"
            f" | medians: explosive sets {statistics.median(c['xs'] for c in sub)}  contacts {statistics.median(c['ct'] for c in sub)}"
            f"  intent {statistics.median(c['il'] for c in sub)}  strength sets {statistics.median(c['ss'] for c in sub)}  est {statistics.median(c['est'] for c in sub)}")


def main(path):
    R = [r for r in rows() if 'w' in r]
    L = []
    for dur in (60, 30):
        ok = [r for r in R if r['raw']['duration'] == dur]
        L.append(f"== {dur} minutes, full grid, by level")
        for lv in LEVELS + ['all']:
            sub = [comp(r) for r in ok if lv == 'all' or r['raw']['experience'] == lv]; L += [line(lv, sub), detail(lv, sub)]
        if dur == 30: break
        L.append('== 60 minutes, NO State, by level')
        for lv in LEVELS:
            sub = [comp(r) for r in ok if r['raw']['experience'] == lv and not r['raw']['states']]; L += [line(lv, sub), detail(lv, sub)]
        L.append('== 60 minutes, by goal (no State, intermediate + advanced)')
        for g in GOALS:
            L.append(line(g, [comp(r) for r in ok if r['raw']['goal'] == g and not r['raw']['states'] and r['raw']['experience'] != 'beginner']))
        L.append('== 60 minutes, by State (all levels)')
        for st in sorted({'+'.join(r['raw']['states']) or 'none' for r in ok}):
            L.append(line(st, [comp(r) for r in ok if ('+'.join(r['raw']['states']) or 'none') == st]))
        L.append('== 60 minutes, by structure (all)')
        for s in sorted({r['structure'] for r in ok}):
            L.append(line(s, [comp(r) for r in ok if r['structure'] == s]))
        L.append('')
    open(path, 'w').write('\n'.join(L) + '\n')
    return L


if __name__ == '__main__':
    print('\n'.join(main(sys.argv[1])))
