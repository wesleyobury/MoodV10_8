"""Structural variants for Strength (Core rebuild, Phase 1).

A variant is a SESSION SHAPE over slot intents, not over exercises and not over States. It sets:
  * where the base prescription sits inside each band (positions per slot class),
  * how many secondary / accessory slots the session wants,
  * how likely pairable accessories are paired,
  * which optional programming devices (pyramid, ladder, finisher) it is compatible with.
States, goal, duration, level and history change the WEIGHTS over variants; they never define a variant of their own.
Programming devices are features inside a compatible variant, never sessions of their own.
"""
from __future__ import annotations
import hashlib

VARIANTS = {
    'traditional': dict(
        name='Traditional', pos=dict(primary_compound=dict(sets=.5, reps=.5, rir=.5, rest=.5), secondary_compound=dict(sets=.5, reps=.5, rir=.5, rest=.5),
                                     accessory=dict(sets=.5, reps=.5, rir=.5, rest=.5), extra=dict(sets=.5, reps=.5, rir=.5, rest=.5)),
        slots={60: dict(secondary=(1, 2), accessory=(2, 3)), 30: dict(secondary=(1, 1), accessory=(1, 2))},
        pairing=0.25, pair_secondaries=False, devices=('pyramid', 'finisher'), device_p=0.15),
    'heavy_primary': dict(
        name='Heavy Primary', pos=dict(primary_compound=dict(sets=1.0, reps=.1, rir=.5, rest=1.0), secondary_compound=dict(sets=.5, reps=.3, rir=.5, rest=.7),
                                       accessory=dict(sets=.3, reps=.5, rir=.5, rest=.4), extra=dict(sets=.0, reps=.5, rir=.5, rest=.5)),
        slots={60: dict(secondary=(1, 1), accessory=(1, 2)), 30: dict(secondary=(1, 1), accessory=(1, 1))},
        pairing=0.3, pair_secondaries=False, devices=('finisher',), device_p=0.2),
    'volume': dict(
        name='Volume', pos=dict(primary_compound=dict(sets=.6, reps=.8, rir=.6, rest=.35), secondary_compound=dict(sets=1.0, reps=.7, rir=.5, rest=.5),
                                accessory=dict(sets=.7, reps=.7, rir=.5, rest=.5), extra=dict(sets=.5, reps=.6, rir=.5, rest=.5)),
        slots={60: dict(secondary=(2, 2), accessory=(3, 4)), 30: dict(secondary=(1, 2), accessory=(1, 2))},
        pairing=0.45, pair_secondaries=False, devices=('pyramid', 'ladder'), device_p=0.2),
    'paired': dict(
        name='Compound + Paired Accessories', pos=dict(primary_compound=dict(sets=.5, reps=.5, rir=.5, rest=.6), secondary_compound=dict(sets=.5, reps=.5, rir=.5, rest=.6),
                                                       accessory=dict(sets=.6, reps=.6, rir=.5, rest=.25), extra=dict(sets=.5, reps=.6, rir=.5, rest=.3)),
        slots={60: dict(secondary=(1, 2), accessory=(2, 4)), 30: dict(secondary=(1, 1), accessory=(2, 2))},
        pairing=1.0, pair_secondaries=False, devices=('finisher', 'ladder'), device_p=0.15),
    'efficient': dict(
        name='Efficient', pos=dict(primary_compound=dict(sets=.5, reps=.5, rir=.5, rest=.3), secondary_compound=dict(sets=.4, reps=.6, rir=.5, rest=.3),
                                   accessory=dict(sets=.4, reps=.6, rir=.5, rest=.1), extra=dict(sets=.0, reps=.6, rir=.5, rest=.1)),
        slots={60: dict(secondary=(1, 1), accessory=(1, 2)), 30: dict(secondary=(1, 1), accessory=(1, 2))},
        pairing=0.8, pair_secondaries=True, devices=(), device_p=0.0),
    'top_backoff': dict(
        name='Top Set + Back-off', pos=dict(primary_compound=dict(sets=.6, reps=.5, rir=.5, rest=1.0), secondary_compound=dict(sets=.5, reps=.4, rir=.5, rest=.7),
                                            accessory=dict(sets=.4, reps=.5, rir=.5, rest=.4), extra=dict(sets=.0, reps=.5, rir=.5, rest=.5)),
        slots={60: dict(secondary=(1, 2), accessory=(2, 3)), 30: dict(secondary=(1, 1), accessory=(1, 2))},
        pairing=0.2, pair_secondaries=False, devices=('finisher',), device_p=0.15),
}
PRIOR = {60: dict(traditional=.25, heavy_primary=.18, volume=.20, paired=.20, efficient=.03, top_backoff=.15),
         30: dict(traditional=.18, heavy_primary=.10, volume=.0, paired=.30, efficient=.32, top_backoff=.10)}
GOAL_MULT = {   # goal fingerprint on the session shape (multipliers on the variant prior; every goal in the app vocabulary has one)
    'build_strength':            dict(heavy_primary=2.0, top_backoff=2.0, volume=0.5, paired=0.7),
    'build_muscle':              dict(volume=2.0, paired=1.5, heavy_primary=0.6, top_backoff=0.6),
    'improve_athleticism':       dict(heavy_primary=1.5, efficient=1.4, top_backoff=1.2, volume=0.6),
    'lose_weight_conditioning':  dict(paired=1.8, efficient=1.4, heavy_primary=0.6, top_backoff=0.5),
    'feel_better_reduce_stress': dict(traditional=1.5, top_backoff=0.5, paired=0.8),
    'stay_consistent':           dict(),   # deliberately neutral: the balanced default shape is the point
}
# archetypes without a protected primary compound cannot run a heavy-primary or top-set shape
NO_PRIMARY = {'strength_arms'}
HISTORY_MULT = (0.35, 0.7)   # same variant in the last / second-to-last completed session of this archetype


def u(seed, *parts):
    """Deterministic uniform in [0,1)."""
    return int(hashlib.md5('|'.join(map(str, (seed,) + parts)).encode()).hexdigest()[:12], 16) / 16 ** 12


def weighted_pick(weights, seed, *parts):
    """Deterministic weighted sampling (Efraimidis-Spirakis): each option draws its own seeded uniform u and the option with the
    largest u ** (1 / weight) wins. Exactly proportional to the weights, and a heavily penalised option almost never wins."""
    items = [(k, w) for k, w in weights.items() if w > 0]
    if not items: return None
    return max(items, key=lambda kw: (u(seed, *parts, kw[0]) ** (1.0 / kw[1]), kw[0]))[0]


def eligible(vid, aid, exp, has_primary):
    if vid in ('heavy_primary', 'top_backoff') and (aid in NO_PRIMARY or not has_primary): return False
    if vid == 'top_backoff' and exp == 'beginner': return False
    return True


def variant_weights(aid, dur, exp, goal, state_bias, history_variants, has_primary=True):
    """-> {variant: weight} with every multiplier logged as a dict for the decision log."""
    w = {}; trace = {}
    for vid, p in PRIOR[dur].items():
        if p <= 0 or not eligible(vid, aid, exp, has_primary): continue
        m = dict(prior=p)
        g = GOAL_MULT.get(goal, {}).get(vid, 1.0); m['goal'] = g
        s = state_bias.get(vid, 1.0); m['state'] = s
        h = 1.0
        if history_variants:
            if history_variants[-1] == vid: h = HISTORY_MULT[0]
            elif len(history_variants) > 1 and history_variants[-2] == vid: h = HISTORY_MULT[1]
        m['history'] = h
        lvl = 1.0
        if exp == 'beginner' and vid in ('volume', 'paired'): lvl = 0.75
        if aid == 'strength_full_body' and vid == 'top_backoff': lvl *= 0.7
        m['level'] = lvl
        w[vid] = p * g * s * h * lvl; trace[vid] = m
    return w, trace


def select_variant(aid, dur, exp, goal, state_bias, history_variants, seed, has_primary=True):
    w, trace = variant_weights(aid, dur, exp, goal, state_bias, history_variants, has_primary)
    vid = weighted_pick(w, seed, 'variant') or 'traditional'
    tot = sum(w.values()) or 1.0
    return vid, {k: round(v / tot, 3) for k, v in w.items()}, trace
