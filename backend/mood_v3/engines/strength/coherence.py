"""Whole-session State Coherence (Strength freeze pass).

The State Satisfaction Gate answers "did this State cause at least one meaningful adaptation?". This layer answers a different
question after final reconciliation: "does the finished session, as a whole, still make sense for this State?".

It is a small feature extractor plus State-specific predicates over the complete session, with a short ordered list of bounded
repairs per State. It is not an optimizer: each repair is applied once, the session is rebuilt, the predicate is re-checked,
and everything (features, verdict, repairs, remaining failures) is written to the decision log. Multi-State sessions are judged
as the resolved combination: a conflict rule that stripped a State of a lever also relaxes what this layer expects of it.
"""
from __future__ import annotations
from collections import Counter

HIGH_FATIGUE = {'drop_set', 'rest_pause'}
COUNTING_HEAVY = {'cluster', 'one_and_half', 'drop_set', 'rest_pause'}   # methods with mental arithmetic or a second effort inside the set
COMP = ('primary_compound', 'secondary_compound')


def _nums(reps):
    import re
    return [int(x) for x in re.findall(r'\d+', str(reps or ''))]


def features(rows, blocks, fin, est, variant, EX, exp, dur, gate_kinds=None):
    """Whole-session features from the finished rows / blocks. Cheap, deterministic, no library lookups beyond EX."""
    comp = [r for r in rows if r['cls'] in COMP]
    acc = [r for r in rows if r['cls'] not in COMP]
    prim = next((r for r in rows if r['cls'] == 'primary_compound'), None)
    ex = [EX[r['eid']] for r in rows]
    rirs = [r['rir'] for r in rows if r.get('rir') is not None]
    demanding = [r for r in comp if EX[r['eid']]['sysd'] >= 4 or (EX[r['eid']]['sysd'] >= 3 and EX[r['eid']]['sup'] == 'unsupported' and (r.get('rir') or 0) <= 1)]
    stations = {e['station'] for e in ex}
    fams = Counter(EX[r['eid']]['mfam'] for r in comp)
    pairs = [b for b in blocks if b.get('structure_id') == 'superset']
    device = next((b['structure_id'] for b in blocks if b.get('structure_id') in ('pyramid', 'ladder')), None)
    methods = [r['method']['id'] for r in rows if r.get('method')]
    heavy_primary = bool(prim and prim['kind'] == 'reps' and _nums(prim['reps']) and max(_nums(prim['reps'])) <= 6)
    return dict(
        total_sets=sum(r['sets'] for r in rows), n_ex=len(rows), est=est, variant=variant,
        n_pairs=len(pairs), device=device, methods=methods, high_fatigue=[m for m in methods if m in HIGH_FATIGUE],
        counting_heavy=[m for m in methods if m in COUNTING_HEAVY],
        finisher=(fin['fin_type'] if fin else None), finisher_rir0=bool(fin and fin.get('rir') == 0),
        n_compounds=len(comp), compound_sets=sum(r['sets'] for r in comp), accessory_sets=sum(r['sets'] for r in acc),
        demanding_compounds=[r['name'] for r in demanding], same_family_compounds=max(fams.values(), default=0),
        avg_rir=(sum(rirs) / len(rirs) if rirs else None), min_rir=(min(rirs) if rirs else None), primary_rir=(prim['rir'] if prim else None),
        near_failure=[r['name'] for r in rows if r.get('rir') is not None and r['rir'] <= 1],
        compound_rest_min=(min(r['rest'] for r in comp) if comp else None),
        sysd_sum=sum(e['sysd'] for e in ex), sysd_max=max((e['sysd'] for e in ex), default=0),
        unsupported=sum(1 for e in ex if e['sup'] == 'unsupported'), transitions=len(stations),
        cx_max=max((e['cx'] for e in ex), default=0), cx_mean=(sum(e['cx'] for e in ex) / len(ex) if ex else 0),
        novel=sum(1 for e in ex if e['nov'] >= 3), heavy_primary=heavy_primary,
        primary_tempo=(prim.get('tempo') if prim else None), primary_scheme=bool(prim and prim.get('scheme')),
        primary_method=(prim['method']['id'] if prim and prim.get('method') else None),
        forceful=any(e['forceful'] or e['pat'] == 'carry' for e in ex) or (fin is not None and fin['fin_type'] in ('forceful', 'carry')),
        compound_min_rir=(min(r['rir'] for r in comp) if comp else None),
        heavy_compound=any(r['kind'] == 'reps' and _nums(r['reps']) and max(_nums(r['reps'])) <= 8 for r in comp),
        first_compound_tempo=(comp[0].get('tempo') if comp else None), has_primary=prim is not None,
        gate_kinds=gate_kinds or {},
    )


# ---------------------------------------------------------------- budgets (level x duration), strength goal earns a little more
SET_CAP_LE = {('beginner', 60): 16, ('intermediate', 60): 18, ('advanced', 60): 20, ('beginner', 30): 10, ('intermediate', 30): 11, ('advanced', 30): 12}
TRANSITION_CAP = {60: 5, 30: 4}


def check(state, f, states, exp, dur, goal, log_conflicts):
    """-> list of failure reasons (empty = coherent) for one State, given the resolved combination."""
    fails = []
    strength = goal in ('build_strength', 'improve_athleticism')
    yielded = {(l.get('dropped') or ('',))[0] for l in log_conflicts if isinstance(l, dict) and l.get('reason_code') == 'state_conflict_resolved' and l.get('dropped')}
    if state == 'low_energy':
        cap = SET_CAP_LE[(exp, dur)] + (2 if strength and exp != 'beginner' else 0)
        if f['total_sets'] > cap: fails.append(f"total sets {f['total_sets']} above the Low Energy budget {cap}")
        allowed_demanding = 1 if (strength and exp == 'advanced') else (1 if exp == 'advanced' else 0)
        if len(f['demanding_compounds']) > max(allowed_demanding, 1): fails.append(f"{len(f['demanding_compounds'])} demanding compounds ({', '.join(f['demanding_compounds'])})")
        allowed_nf = 2 if (strength and exp == 'advanced') else 1      # one hard effort is fine on a low day; several is a grind
        if len(f['near_failure']) > allowed_nf: fails.append(f"{len(f['near_failure'])} movements within a rep of failure")
        if f['high_fatigue']: fails.append(f"high-fatigue method {f['high_fatigue']}")
        if f['finisher'] and f['finisher'] != 'carry': fails.append(f"{f['finisher']} finisher")
        if f['variant'] == 'heavy_primary' and f['accessory_sets'] > 8: fails.append(f"Heavy Primary with {f['accessory_sets']} accessory sets")
        if f['n_pairs'] >= 2 and f['total_sets'] > cap - 3: fails.append('dense pairing on top of high volume')
        if f['transitions'] > TRANSITION_CAP[dur]: fails.append(f"{f['transitions']} station changes")
    elif state == 'stressed':
        if f['device']: fails.append(f"{f['device']} device (counting-heavy)")
        if f['primary_scheme']: fails.append('top set + back-off scheme')
        if f['counting_heavy']: fails.append(f"counting-heavy method {f['counting_heavy']}")
        if f['n_pairs'] > 1: fails.append(f"{f['n_pairs']} supersets")
        if f['transitions'] > TRANSITION_CAP[dur]: fails.append(f"{f['transitions']} station changes")
        if f['compound_rest_min'] is not None and f['compound_rest_min'] < 90: fails.append(f"compound rest {f['compound_rest_min']} s (hurried)")
        if f['finisher'] in ('burnout', 'forceful'): fails.append(f"{f['finisher']} finisher")
        if f['cx_max'] >= 4 and 'bored' not in states: fails.append(f"a complexity-{f['cx_max']} movement")
    elif state == 'irritated':
        gk = set(f['gate_kinds'].get('irritated', []))
        direct = f['heavy_primary'] or (f['compound_min_rir'] is not None and f['compound_min_rir'] <= 1) or f['primary_tempo'] == 'explosive_intent' or f['first_compound_tempo'] == 'explosive_intent' \
            or f['forceful'] or f['variant'] in ('heavy_primary', 'top_backoff') or f['primary_method'] in ('pause', 'cluster') or f['finisher'] is not None \
            or (f['heavy_compound'] and 'reps' in gk) or ('rest' in gk and 'tempo' in gk)
        if not direct: fails.append('no perceptible direct or heavy quality anywhere in the session')
        if any(m in ('slow_eccentric', 'one_and_half') for m in f['methods']) and 'bored' not in states: fails.append('a slow / 1.5-rep method works against the direct feel')
        if f['n_pairs'] >= 2 and 'low_energy' not in states: fails.append(f"{f['n_pairs']} supersets (busy, not direct)")
    elif state == 'amped':
        if 'amped' in yielded and 'low_energy' in states: return []          # Low Energy owns cost; Amped yielded by rule and is not judged here
        gk = set(f['gate_kinds'].get('amped', []))
        productive = f['heavy_primary'] or (f['compound_min_rir'] is not None and f['compound_min_rir'] <= 1 and exp != 'beginner') or f['primary_scheme'] \
            or f['primary_method'] in ('pause', 'cluster') or any(m in HIGH_FATIGUE for m in f['methods']) or f['finisher'] is not None \
            or (f['variant'] == 'paired' and f['n_pairs'] >= 2) or f['compound_sets'] >= (13 if dur == 60 else 7) \
            or 'volume' in gk or ('reps' in gk and f['heavy_compound']) or 'set_method' in gk \
            or (not f['has_primary'] and (('rir' in gk) or ('reps' in gk))) \
            or f['primary_tempo'] == 'explosive_intent' or f['first_compound_tempo'] == 'explosive_intent'     # beginner Amped: intent, not failure
        if not productive: fails.append('readiness not used anywhere meaningful (primary effort, loading, scheme, method, density or finisher)')
        if len(f['near_failure']) > 3: fails.append(f"{len(f['near_failure'])} movements within a rep of failure (failure training)")
        if exp == 'beginner' and (f['finisher_rir0'] or (f['min_rir'] is not None and f['min_rir'] < 1)): fails.append('beginner taken to failure')
        cap = SET_CAP_LE[(exp, dur)] + 7
        if f['total_sets'] > cap: fails.append(f"total sets {f['total_sets']} (excessive volume for Amped)")
    elif state == 'bored':
        score = min(2, f['novel']) + (f['variant'] != 'traditional') + bool(f['methods']) + bool(f['device']) + bool(f['finisher']) + (f['n_pairs'] > 0)
        need = 1 if (exp == 'beginner' or 'stressed' in states or 'low_energy' in states) else 2
        if score < need: fails.append(f"experiential difference score {score} below {need}")
    return fails


REPAIRS = {   # ordered, bounded; each entry (code, description)
    'low_energy': ['drop_high_fatigue_method', 'drop_finisher', 'accessory_rir_floor_2', 'compound_rir_floor_2', 'swap_demanding_secondary', 'trim_accessory_sets', 'remove_optional_accessory'],
    'stressed': ['drop_counting_method', 'no_device', 'unpair', 'drop_finisher', 'compound_rest_90', 'remove_optional_accessory'],
    'irritated': ['drop_soft_method', 'primary_intent_and_heavier', 'unpair'],
    'amped': ['primary_heavier', 'primary_rir_down', 'primary_extra_set', 'primary_intent', 'trim_near_failure', 'drop_finisher'],
    'bored': ['force_method'],
}

# a repair runs only when one of the open failure reasons is the kind of thing it fixes
REPAIR_FOR = {
    'drop_high_fatigue_method': ('high-fatigue',), 'drop_finisher': ('finisher', 'total sets', 'taken to failure'), 'accessory_rir_floor_2': ('rep of failure',),
    'compound_rir_floor_2': ('rep of failure',), 'swap_demanding_secondary': ('demanding compounds',),
    'trim_accessory_sets': ('total sets', 'Heavy Primary with', 'dense pairing'), 'remove_optional_accessory': ('total sets', 'station changes', 'Heavy Primary with', 'dense pairing'),
    'drop_counting_method': ('counting-heavy',), 'no_device': ('device', 'scheme'), 'unpair': ('supersets',), 'compound_rest_90': ('hurried',),
    'drop_soft_method': ('slow / 1.5',), 'primary_intent_and_heavier': ('no perceptible',), 'primary_heavier': ('readiness not used',),
    'primary_rir_down': ('readiness not used',), 'primary_extra_set': ('readiness not used',), 'primary_intent': ('readiness not used',), 'trim_near_failure': ('rep of failure', 'taken to failure'),
    'force_method': ('experiential',), 'extend_rest': (),
}


def relevant(code, fails):
    keys = REPAIR_FOR.get(code, ())
    return any(k in f for f in fails for k in keys)
