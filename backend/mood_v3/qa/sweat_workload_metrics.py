"""Sweat workload-quality metrics (trainer view). Usage: python3 mood_v3/qa/sweat_workload_metrics.py after.json [before.json]"""
import json, sys, collections, statistics as st
C = collections.Counter
def load(p): return [r for r in json.load(open(p)) if r['status'] == 'ok']
def comp_kind(r):
    bl = r['blocks']; has_c = any(b['structure'] != 'finisher' for b in bl[1:]); has_f = any(b['structure'] == 'finisher' for b in bl)
    return 'main + complement + finisher' if has_c and has_f else ('main + complement' if has_c else ('main + finisher' if has_f else 'main only'))
def main_rpe(r): return (r['blocks'][0]['rpe'] or [7, 7])
def rpe_bucket(r):
    lo, hi = main_rpe(r); return 'hard (floor 8+ or 9)' if lo >= 8 or hi >= 9 else ('moderate (7-8)' if hi >= 8 else 'steady (<= 7)')
def med(xs): return round(st.median(xs), 1) if xs else None
def report(rows, tag):
    print(f"\n===== {tag}: {len(rows)} sessions =====")
    print('block composition, all:', dict(C(comp_kind(r) for r in rows)))
    for key, fn in (('archetype', lambda r: r['archetype'][6:]), ('duration', lambda r: r['raw']['duration']), ('level', lambda r: r['raw']['experience'])):
        groups = collections.defaultdict(list)
        for r in rows: groups[fn(r)].append(comp_kind(r))
        print(f"  by {key}:")
        for g, v in sorted(groups.items(), key=lambda kv: str(kv[0])):
            c = C(v); n = len(v); print(f"    {g}: " + ', '.join(f"{k} {c[k]} ({100 * c[k] / n:.0f}%)" for k in ('main only', 'main + complement', 'main + finisher', 'main + complement + finisher') if c[k]))
    mcf = [r for r in rows if comp_kind(r) == 'main + complement + finisher']
    print('  main + complement + finisher cases:', len(mcf))
    for r in mcf[:40]: print('    ', r['raw'].get('states'), r['archetype'], r['raw']['duration'], r['raw']['experience'], r['raw'].get('goal'), r['tag'], [b['structure'] for b in r['blocks']], 'est', r['est'])
    for d in (30, 60):
        rs = [r for r in rows if r['raw']['duration'] == d]
        if not rs: continue
        print(f"  {d} min: median elapsed {med([r['est'] for r in rs])}, median meaningful active {med([r['budget']['active_min'] for r in rs])}, median main-block active {med([mb_active(r) for r in rs])}, median hard minutes {med([r['budget']['hard_min'] for r in rs])}, median loaded reps {med([r['budget']['loaded_reps'] for r in rs])}, median engine minutes {med([r['budget']['engine_min'] for r in rs])}, median warm-up {med([r.get('warmup') or 0 for r in rs])}, median cooldown {med([r.get('cooldown') or 0 for r in rs])}")
        print(f"    main-block RPE distribution: {dict(C(rpe_bucket(r) for r in rs))}")
        for b in ('steady (<= 7)', 'moderate (7-8)', 'hard (floor 8+ or 9)'):
            g = [r for r in rs if rpe_bucket(r) == b]
            if g: print(f"    {b}: n {len(g)}, complement {100 * sum(comp_kind(r) in ('main + complement', 'main + complement + finisher') for r in g) / len(g):.0f}%, finisher {100 * sum(comp_kind(r) in ('main + finisher', 'main + complement + finisher') for r in g) / len(g):.0f}%")
        lab = C((r.get('completeness') or {}).get('label') for r in rs)
        if any(lab): print(f"    completeness labels: {dict(lab)}")
        by = collections.defaultdict(list)
        for r in rs: by[(r['archetype'][6:], r['raw']['experience'])].append(r)
        print('    by archetype/level: elapsed / main active / total active / hard min / loaded reps / engine min / main-only %')
        for k in sorted(by):
            g = by[k]; print(f"      {k[0]:8s} {k[1]:12s} {med([r['est'] for r in g]):5} / {med([mb_active(r) for r in g]):5} / {med([r['budget']['active_min'] for r in g]):5} / {med([r['budget']['hard_min'] for r in g]):5} / {med([r['budget']['loaded_reps'] for r in g]):5} / {med([r['budget']['engine_min'] for r in g]):5} / {100 * sum(comp_kind(r) == 'main only' for r in g) / len(g):.0f}%")
def mb_active(r):
    # main block active minutes: approximate from block est minus the recovery inside it is not available in the row; use the budget's active for one-block sessions, else est-weighted
    bl = r['blocks']
    if len(bl) == 1: return r['budget']['active_min']
    tot = sum(b['est'] or 0 for b in bl) or 1
    return round(r['budget']['active_min'] * (bl[0]['est'] or 0) / tot, 1)
after = load(sys.argv[1]); report(after, 'AFTER (this pass)')
if len(sys.argv) > 2: report(load(sys.argv[2]), 'BEFORE (previous pass)')
