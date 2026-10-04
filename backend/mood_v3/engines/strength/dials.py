"""State adaptation for Strength (Core rebuild, Phase 1): small, bounded, deterministic.

Each State has 2-3 EXPRESSIONS. An expression is a bundle of at most three levers plus soft biases:
  levers      ('rir'|'reppos'|'restpos'|'sets'|'slot', scope, delta[, n])   applied inside the prescription bands
  structure   {variant: multiplier}                                          weights over structural variants
  bias        {attribute: weight}                                            soft exercise-ranking preferences
  finisher    (probability, (types...))                                      optional finisher device
  device_p    multiplier on the variant's programming-device probability
  cap         complexity cap delta; sysd_cap: max systemic demand for non-primary slots (hard, pool-guarded)
  tempo       ('controlled'|'explosive_intent', scope)
Exactly one expression per State is chosen (seeded, history-penalised), then multi-State conflicts are resolved by a short
rule table (safety first) and a lever budget. Nothing here creates structure; it only changes weights and band positions.
"""
from __future__ import annotations
from .variants import weighted_pick

SCOPES = {'all': lambda r: True, 'compound': lambda r: r['cls'] in ('primary_compound', 'secondary_compound'),
          'primary': lambda r: r['cls'] == 'primary_compound', 'secondary': lambda r: r['cls'] == 'secondary_compound',
          'accessory': lambda r: r['cls'] in ('accessory', 'extra')}

EXPRESSIONS = {
    'low_energy': {
        'cost_down':     dict(levers=[('rir', 'all', +1), ('sets', 'accessory', -1, 2)], bias={'supported': 1.0, 'low_sysd': 1.0},
                              structure={'volume': 0.5}, finisher=(0.0, ()), device_p=0.3),
        'moderate_load': dict(levers=[('reppos', 'compound', +0.3), ('rir', 'compound', +1)], bias={'supported': 0.5, 'low_sysd': 0.5},
                              structure={'traditional': 1.4, 'efficient': 1.4, 'volume': 0.5, 'heavy_primary': 0.6}, finisher=(0.0, ()), device_p=0.3),
        'simplify':      dict(levers=[('slot', 'accessory', -1), ('rir', 'accessory', +1)], bias={'supported': 1.0, 'simple': 0.7}, sysd_cap=3,
                              structure={'efficient': 1.6, 'traditional': 1.3, 'paired': 0.6, 'volume': 0.4}, finisher=(0.0, ()), device_p=0.0),
    },
    'amped': {
        # (final pre-launch pass) top_backoff was weighted x40 (x60 with the State bias): nearly every eligible Amped session became a
        # Top Set + Back-off. It is now one legitimate Amped expression among four, and the set shape inside it is likely, not certain.
        'top_set':       dict(levers=[('rir', 'primary', -1)], structure={'top_backoff': 5.0, 'heavy_primary': 1.2, 'efficient': 0.5},
                              bias={'compound': 0.5}, finisher=(0.0, ()), device_p=1.0, needs_primary=True, min_exp='intermediate'),
        'extra_set_paired': dict(levers=[('sets', 'primary', +1)], structure={'paired': 2.0, 'volume': 1.6, 'efficient': 0.5},
                              bias={'compound': 0.5}, finisher=(0.0, ()), device_p=1.0),
        'heavy_end':     dict(levers=[('reppos', 'compound', -0.3), ('rir', 'secondary', -1)], structure={'heavy_primary': 1.3, 'traditional': 1.0, 'efficient': 0.5},
                              bias={'compound': 0.5}, finisher=(0.6, ('burnout', 'forceful')), device_p=1.0),
        'intensity':     dict(levers=[('rir', 'accessory', -1), ('reppos', 'compound', -0.15)], structure={'traditional': 1.2, 'volume': 1.3, 'top_backoff': 0.5, 'efficient': 0.5},
                              bias={'compound': 0.5}, finisher=(0.0, ()), device_p=1.0, force_method=True, min_exp='intermediate'),
    },
    'irritated': {
        'heavy_primary': dict(levers=[('reppos', 'primary', -0.3), ('restpos', 'compound', +0.2)], tempo=('explosive_intent', 'primary'),
                              structure={'heavy_primary': 12.0, 'top_backoff': 2.0, 'volume': 0.5}, bias={'forceful': 1.0, 'compound': 0.5}, finisher=(0.0, ()), device_p=0.5),
        'forceful_finish': dict(levers=[('reppos', 'compound', -0.15)], structure={'traditional': 1.2, 'paired': 1.0, 'volume': 0.6},
                              bias={'forceful': 1.0}, finisher=(0.75, ('forceful', 'carry')), device_p=0.5),
        'direct_simple': dict(levers=[('reppos', 'compound', -0.2)], cap=-1, structure={'traditional': 1.5, 'paired': 1.2, 'heavy_primary': 1.2, 'volume': 0.5},
                              bias={'forceful': 1.5, 'compound': 1.0, 'simple': 1.0}, finisher=(0.3, ('forceful', 'carry')), device_p=0.5),
    },
    'bored': {
        'new_exercises': dict(levers=[], bias={'novelty': 3.5, 'equipment_diversity': 2.0}, recency_mult=2.5, structure={'traditional': 0.7},
                              finisher=(0.0, ()), device_p=1.0),
        'new_structure': dict(levers=[], bias={'novelty': 1.0}, recency_mult=1.5, structure={'paired': 1.5, 'volume': 1.3, 'top_backoff': 1.5, 'traditional': 0.3},
                              finisher=(0.0, ()), device_p=4.0, device_force=True),
        'fresh_finish':  dict(levers=[], bias={'novelty': 2.5, 'equipment_diversity': 1.5}, recency_mult=2.0, structure={'traditional': 0.6},
                              finisher=(0.6, ('burnout', 'forceful', 'carry')), device_p=2.0),
    },
    'stressed': {
        'predictable':   dict(levers=[('restpos', 'all', +0.15)], bias={'familiar': 1.5, 'same_station': 1.0}, structure={'traditional': 3.0, 'paired': 0.3, 'top_backoff': 0.5},
                              finisher=(0.0, ()), device_p=0.0, pairing_mult=0.3),
        'controlled':    dict(levers=[('rirfloor', 'compound', 2)], tempo=('controlled', 'secondary'), bias={'familiar': 1.0},
                              structure={'traditional': 1.5, 'efficient': 1.3, 'paired': 0.5}, finisher=(0.0, ()), device_p=0.0, pairing_mult=0.5),
        'simpler':       dict(levers=[('slot', 'accessory', -1)], cap=-1, bias={'familiar': 1.0, 'supported': 0.5},
                              structure={'efficient': 1.6, 'traditional': 1.5, 'paired': 0.4}, finisher=(0.0, ()), device_p=0.0, pairing_mult=0.5),
    },
}
STATE_STRUCTURE = {   # State-level structure bias (applied on top of the expression's own)
    'low_energy': dict(traditional=1.4, efficient=1.6, heavy_primary=0.5, volume=0.4, paired=0.7, top_backoff=0.4),
    'bored': dict(traditional=0.4, paired=1.4, volume=1.2, top_backoff=1.3, heavy_primary=1.1, efficient=0.8),
    'irritated': dict(heavy_primary=1.8, top_backoff=1.3, volume=0.6, paired=0.9, efficient=0.9),
    'amped': dict(heavy_primary=1.3, top_backoff=1.0, volume=1.2, paired=1.0, traditional=0.8, efficient=0.5),
    'stressed': dict(traditional=1.8, efficient=1.2, heavy_primary=0.9, volume=0.8, paired=0.3, top_backoff=0.0),   # Stressed: no counting-heavy top-set schemes
}
CAP_DELTA = {'low_energy': -1, 'stressed': -1, 'irritated': -1, 'bored': +1, 'amped': 0, 'sore': 0}
LEVER_PRIORITY = ['rirfloor', 'rir', 'sets', 'reppos', 'slot', 'restpos']
BUDGET = 4                       # max levers applied across all States (finisher counts as one)
EXP_RANK = {'beginner': 0, 'intermediate': 1, 'advanced': 2}


LAST_RESORT = {   # State Satisfaction Gate fallback: a lever bundle that always leaves a visible, defensible mark of the State's philosophy
    # Each bundle also carries an 'all'-scope lever so a session with no compound slot (core, arms) can still realize the State.
    'low_energy': dict(levers=[('rir', 'all', +1), ('sets', 'all', -1, 2)], bias={'supported': 2.0, 'low_sysd': 1.5}, sysd_cap=3, structure={'traditional': 1.5, 'efficient': 1.5}, finisher=(0.0, ()), device_p=0.0),
    'amped': dict(levers=[('rir', 'primary', -1), ('reppos', 'primary', -0.3), ('rir', 'all', -1), ('sets', 'all', +1, 2)], structure={}, bias={}, finisher=(0.0, ()), device_p=1.0),
    'irritated': dict(levers=[('reppos', 'compound', -0.3), ('restpos', 'all', -0.35), ('reppos', 'all', -0.3)], tempo=('explosive_intent', 'primary'), structure={'heavy_primary': 3.0}, bias={'forceful': 1.5}, finisher=(0.0, ()), device_p=0.5),
    'bored': dict(levers=[], bias={'novelty': 3.0, 'equipment_diversity': 2.0}, recency_mult=2.5, structure={'traditional': 0.3}, finisher=(0.0, ()), device_p=4.0, device_force=True, force_method=True),
    'stressed': dict(levers=[('restpos', 'compound', +0.2), ('restpos', 'all', +0.35)], tempo=('controlled', 'all'), structure={'traditional': 6.0, 'paired': 0.1, 'top_backoff': 0.1}, bias={'familiar': 1.5}, finisher=(0.0, ()), device_p=0.0, pairing_mult=0.0),
}


def next_expression(state, tried, exp, has_primary):
    """Ordered fallback for the gate: the untried expressions in table order, then the last-resort bundle."""
    for k, v in EXPRESSIONS[state].items():
        if k in tried: continue
        if v.get('needs_primary') and not has_primary: continue
        if v.get('min_exp') and EXP_RANK[exp] < EXP_RANK[v['min_exp']]: continue
        return k
    return None if 'last_resort' in tried else 'last_resort'


def choose_expression(state, exp, dur, has_primary, history_expr, seed):
    """Seeded weighted pick among the State's expressions; the expression used last / second-to-last for this State is penalised."""
    opts = {}
    for k, v in EXPRESSIONS[state].items():
        if v.get('needs_primary') and not has_primary: continue
        if v.get('min_exp') and EXP_RANK[exp] < EXP_RANK[v['min_exp']]: continue
        w = 1.0
        if history_expr:
            if history_expr[-1] == k: w *= 0.12
            elif len(history_expr) > 1 and history_expr[-2] == k: w *= 0.5
        opts[k] = w
    return weighted_pick(opts, seed, 'expr', state)


def resolve(states, exp, dur, has_primary, history_expr_by_state, seed, forced=None):
    """-> dict(expressions, levers, structure, bias, finisher, device_p, cap_delta, sysd_cap, tempo, pairing_mult, recency_mult, log).
    Safety (Sore) is handled by the frozen soreness system before this runs; here 'sore' only contributes cap 0."""
    log = []; st = [s for s in states if s in EXPRESSIONS]
    forced = forced or {}
    chosen = {s: (forced.get(s) or choose_expression(s, exp, dur, has_primary, history_expr_by_state.get(s, []), seed)) for s in st}
    for s, k in chosen.items(): log.append(dict(reason_code='state_expression', state=s, expression=k, forced=(s in forced)))
    force_method = False
    levers = []; structure = {}; bias = {}; fin_p = 0.0; fin_types = (); device_p = 1.0; tempo = []; pairing_mult = 1.0; recency_mult = 1.0; sysd_cap = None; jitter_salt = ''
    cap_delta = min([CAP_DELTA.get(s, 0) for s in states] or [0]) if any(CAP_DELTA.get(s, 0) < 0 for s in states) else max([CAP_DELTA.get(s, 0) for s in states] or [0])
    for s in st:
        e = LAST_RESORT[s] if chosen[s] == 'last_resort' else EXPRESSIONS[s][chosen[s]]
        if e.get('force_method'): force_method = True
        for lv in e.get('levers', []): levers.append((s,) + tuple(lv))
        for k, v in STATE_STRUCTURE.get(s, {}).items(): structure[k] = structure.get(k, 1.0) * v
        for k, v in e.get('structure', {}).items(): structure[k] = structure.get(k, 1.0) * v
        for k, v in e.get('bias', {}).items(): bias[k] = bias.get(k, 0.0) + v
        p, t = e.get('finisher', (0.0, ()))
        if p > fin_p: fin_p, fin_types = p, t
        device_p *= e.get('device_p', 1.0); pairing_mult *= e.get('pairing_mult', 1.0); recency_mult = max(recency_mult, e.get('recency_mult', 1.0))
        if e.get('cap') is not None: cap_delta = min(cap_delta, e['cap'])
        if e.get('sysd_cap') is not None: sysd_cap = e['sysd_cap'] if sysd_cap is None else min(sysd_cap, e['sysd_cap'])
        if e.get('tempo'): tempo.append(tuple(e['tempo']) + (s,))
        if e.get('device_force'): device_p = max(device_p, 4.0)
        if s == 'bored' and chosen[s] in ('new_exercises', 'fresh_finish', 'last_resort'): jitter_salt = 'bored' if chosen[s] != 'last_resort' else 'bored2'
    # ---- conflict rules (deterministic, few)
    if 'low_energy' in st and ('amped' in st or 'irritated' in st):
        # Low Energy owns systemic cost: opposing effort levers survive on the primary only; volume is preserved, not summed
        keep = []
        for lv in levers:
            s, kind, scope = lv[0], lv[1], lv[2]
            if s in ('amped', 'irritated') and kind == 'rir' and scope != 'primary': log.append(dict(reason_code='state_conflict_resolved', rule='low_energy_vs_effort', dropped=lv)); continue
            if s in ('amped', 'irritated') and kind == 'reppos': lv = (s, kind, 'primary') + tuple(lv[3:]); log.append(dict(reason_code='state_conflict_resolved', rule='low_energy_vs_effort', scoped=lv))
            if kind == 'sets' and ((s == 'low_energy' and 'amped' in st) or s == 'amped'): log.append(dict(reason_code='state_conflict_resolved', rule='low_energy_vs_amped_volume', dropped=lv)); continue
            if s == 'low_energy' and kind == 'rir' and scope in ('all', 'compound') and 'amped' in st: lv = (s, kind, 'accessory') + tuple(lv[3:]); log.append(dict(reason_code='state_conflict_resolved', rule='low_energy_vs_amped_effort', scoped=lv))
            keep.append(lv)
        levers = keep
        fin_p = 0.0; fin_types = ()   # Extras stay off under Low Energy (SD rule kept)
        sysd_cap = 4 if sysd_cap is None else min(sysd_cap, 4)
    if 'stressed' in st:
        if 'bored' in st:
            # Bored owns exercise novelty, Stressed owns structural predictability
            for k in list(structure):
                if k in ('paired', 'volume', 'top_backoff'): structure[k] = min(structure[k], 1.0)
            device_p = min(device_p, 0.3); log.append(dict(reason_code='state_conflict_resolved', rule='bored_novelty_stressed_structure'))
        if 'amped' in st or 'irritated' in st:
            # Amped / Irritated keep primary effort; Stressed prevents excessive density and shortened rest
            levers = [lv for lv in levers if not (lv[0] in ('amped', 'irritated') and lv[1] == 'restpos' and lv[3] < 0)]
            pairing_mult = min(pairing_mult, 0.5); device_p = min(device_p, 0.5)
            log.append(dict(reason_code='state_conflict_resolved', rule='stressed_caps_density'))
        fin_p *= 0.3
    # ---- budget
    n = len(levers) + (1 if fin_p > 0 else 0)
    if n > BUDGET:
        order = sorted(range(len(levers)), key=lambda i: LEVER_PRIORITY.index(levers[i][1]) if levers[i][1] in LEVER_PRIORITY else 9)
        keep_idx = set(order[:BUDGET - (1 if fin_p > 0 else 0)])
        for i in range(len(levers)):
            if i not in keep_idx: log.append(dict(reason_code='state_budget_dropped', lever=levers[i]))
        levers = [levers[i] for i in sorted(keep_idx)]
    return dict(states=st, expressions=chosen, levers=levers, structure=structure, bias=bias, finisher=(fin_p, fin_types), device_p=device_p,
                cap_delta=max(-1, min(1, cap_delta)), sysd_cap=sysd_cap, tempo=tempo, pairing_mult=pairing_mult, recency_mult=recency_mult, jitter_salt=jitter_salt, force_method=force_method, log=log)


# ---------------------------------------------------------------- soft exercise-fit terms used by the ranker
def fit(e, attr, ctx):
    if attr == 'supported': return {'supported': 1.0, 'semi_supported': 0.5}.get(e['sup'], 0.0)
    if attr == 'low_sysd': return 1.0 if e['sysd'] <= 2 else (0.5 if e['sysd'] == 3 else -0.5)
    if attr == 'forceful': return 1.0 if (e['forceful'] or e['explosive']) else 0.0
    if attr == 'compound': return 1.0 if e['cls'] != 'isolation' else 0.0
    if attr == 'simple': return 1.0 if e['cx'] <= 2 else -0.5
    if attr == 'novelty': return (e['nov'] - 2) / 3.0
    if attr == 'familiar': return 1.0 if e['nov'] <= 2 else -0.5
    if attr == 'same_station': return 1.0 if ctx.get('last_station') == e['station'] else 0.0
    if attr == 'equipment_diversity': return 1.0 if e['eq'] not in ctx.get('used_eq', set()) else 0.0
    return 0.0


def bias_score(e, bias, ctx):
    return sum(w * fit(e, a, ctx) for a, w in bias.items())
