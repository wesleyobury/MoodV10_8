"""MOOD V3 Sweat core (rebuild). Base session first, then State, then the whole-session workload budget.

Pipeline: inputs -> archetype -> blueprint (shape) -> base dose -> exercise composition -> State expressions (levers + biases)
-> whole-session workload budget + duration reconciliation -> State Satisfaction Gate (vs a no-State reference build)
-> State Coherence (whole-session predicates, bounded repairs) -> validation -> personalization contract.

Reuses the frozen Sweat data layer and ranking (`sweat_gen`: EX, ELIG, ranked, hard_ok, station_dose, ok_add, order_items,
pick_items, fill_with_relax, circuit_template, cover_target, cue_for, make_ctx, PRESETS) and emits the same block schema the
renderer and the independent validator already read. Everything else Sweat-specific lives here: realistic engine time model,
blueprints, Hybrid shapes, workload budget, State layer, contract.
"""
from __future__ import annotations
import copy, hashlib, re
from collections import Counter
from . import sweat_gen as G
from .sweat_data import LOWER, roll, region_of, is_loaded_hinge, is_hanging, self_limiting, max_intent_ok, MIN_BOUT

EX = G.EX
ARCH_NAME = {'sweat_engine': 'Engine', 'sweat_circuit': 'Circuit', 'sweat_hybrid': 'Hybrid'}
STATES = ('low_energy', 'stressed', 'bored', 'irritated', 'amped')


def u(seed, *parts):
    return int(hashlib.md5('|'.join(map(str, (seed,) + parts)).encode()).hexdigest()[:12], 16) / 16 ** 12


def weighted_pick(weights, seed, *parts):
    items = [(k, w) for k, w in weights.items() if w > 0]
    if not items: return None
    return max(items, key=lambda kw: (u(seed, *parts, kw[0]) ** (1.0 / kw[1]), kw[0]))[0]


Fail = G.Fail


# ================================================================== realistic engine time model (repeat efforts in a mixed session)
# seconds per 500 m at RPE 6 / 7 / 8 / 9, sustainable as REPEATED work (not a one-off test piece)
ROW_PACE = {'beginner': (165, 155, 148, 140), 'intermediate': (135, 128, 122, 116), 'advanced': (122, 116, 110, 105)}
BIKE_CAL_MIN = {'beginner': (8, 10, 12, 14), 'intermediate': (11, 13, 15, 17), 'advanced': (13, 16, 18, 21)}
RUN_PACE_KM = {'beginner': (420, 390, 360, 340), 'intermediate': (360, 330, 305, 285), 'advanced': (320, 295, 275, 255)}
WALK_S_PER_M = 0.75
STATION_S = {**G.SPR}
SLED_S_PER_M = {'sled_push': 2.0, 'sled_pull': 2.4, 'plate_push': 1.8}
CARRY_S_PER_M = 1.15
TRANSITION_S = 15          # station to station
MACHINE_CHANGE_S = 30      # onto / off a machine


def _idx(rpe):
    return max(0, min(3, int(round(rpe)) - 6))


def engine_seconds(e, dose, exp, rpe=7, bout_index=0, mixed=False):
    """Time for ONE engine bout at a given RPE, level and position in the session. Slower than a fresh test piece on purpose."""
    k, v = dose['kind'], dose['value']
    fatigue = min(1.15, 1.0 + 0.025 * bout_index) * (1.06 if mixed else 1.0)
    if k == 'time': return v
    i = _idx(rpe)
    if e['id'] in ('row_erg', 'ski_erg'):
        per500 = ROW_PACE[exp][i] * (1.05 if e['id'] == 'ski_erg' else 1.0)
        if k == 'distance': return v / 500.0 * per500 * fatigue
        if k == 'calories': return v * (60.0 / (BIKE_CAL_MIN[exp][i] * 0.85)) * fatigue
    if e['id'] in ('air_bike', 'stationary_bike'):
        rate = BIKE_CAL_MIN[exp][i] * (0.8 if e['id'] == 'stationary_bike' else 1.0)
        if k == 'calories': return v * 60.0 / rate * fatigue
    if e['id'] == 'treadmill_run' and k == 'distance': return v / 1000.0 * RUN_PACE_KM[exp][i] * fatigue
    if e['id'] == 'treadmill_incline_walk' and k == 'distance': return v * WALK_S_PER_M
    return G.est(e, dose, exp)


def station_seconds(e, dose, exp):
    k, v = dose['kind'], dose['value']
    if k == 'time': return v
    if k == 'reps': return v * STATION_S.get(e['id'], 3.0) * (2 if dose.get('per_side') else 1)
    if k == 'distance':
        if e['id'] in SLED_S_PER_M: return v * SLED_S_PER_M[e['id']]
        if e['pat'] == 'carry': return v * CARRY_S_PER_M * (2 if dose.get('per_side') else 1)
        return G.est(e, dose, exp)
    if k == 'calories': return engine_seconds(e, dose, exp)
    return 60


def item_seconds(e, dose, exp, rpe=7, bout_index=0, mixed=False):
    return engine_seconds(e, dose, exp, rpe, bout_index, mixed) if e['role'] == 'engine' else station_seconds(e, dose, exp)


def engine_dose_for_seconds(e, secs, exp, rpe=7, mixed=True):
    """Dose (distance / calories / time) that takes about `secs` for this level at this RPE, rounded to coach-friendly units."""
    i = _idx(rpe); f = 1.06 if mixed else 1.0
    if e['id'] in ('row_erg', 'ski_erg'):
        per500 = ROW_PACE[exp][i] * (1.05 if e['id'] == 'ski_erg' else 1.0); m = secs / f / per500 * 500
        return dict(kind='distance', value=int(max(150, round(m / 50.0) * 50)))
    if e['id'] in ('air_bike', 'stationary_bike'):
        rate = BIKE_CAL_MIN[exp][i] * (0.8 if e['id'] == 'stationary_bike' else 1.0); c = secs / f / 60.0 * rate
        return dict(kind='calories', value=int(max(6, round(c / 2.0) * 2)))
    if e['id'] == 'treadmill_run':
        m = secs / f / RUN_PACE_KM[exp][i] * 1000
        return dict(kind='distance', value=int(max(150, round(m / 50.0) * 50)))
    return dict(kind='time', value=int(max(MIN_BOUT.get(e['eq'], 30), round(secs / 15.0) * 15)))


# ================================================================== block time + workload accounting
def block_time(b, exp):
    """-> dict(active, recovery, transitions, engine_s, anchor_s, bouts, hard_s) in seconds for one block."""
    s = b['structure']; rpe_hi = (b.get('rpe') or [7, 7])[0]; out = dict(active=0.0, recovery=0.0, transitions=0.0, engine_s=0.0, anchor_s=0.0, bouts=0, hard_s=0.0)
    if s == 'continuous':
        e = b['items_e'][0]; out.update(active=b['duration_s'], engine_s=b['duration_s'], bouts=1)
    elif s in ('intervals', 'finisher') and not (b.get('interval_target') or {}).get('rotate'):
        it = b['interval_target']; n = it['rounds']; k = len(b['items_e'])
        work = n * it['work']; out.update(active=work, recovery=max(0, n - 1) * it['recovery'] + (n - 1) * it.get('round_rest', 0), bouts=n)
        if any(e['role'] == 'engine' for e in b['items_e']): out['engine_s'] = work
        if rpe_hi >= 8: out['hard_s'] = work
    elif s == 'intervals':   # timed rotation
        it = b['interval_target']; n = it['rounds']; k = len(b['items_e'])
        out.update(active=n * k * it['work'], recovery=n * k * it['recovery'] + max(0, n - 1) * it.get('round_rest', 0), transitions=n * k * 5, bouts=n * k)
        out['engine_s'] = sum(n * it['work'] for e in b['items_e'] if e['role'] == 'engine')
        if rpe_hi >= 8: out['hard_s'] = out['active']
    elif s == 'pyramid':
        it = b['interval_target']; out.update(active=sum(it['steps']), recovery=it['recovery'] * (len(it['steps']) - 1), engine_s=sum(it['steps']), bouts=len(it['steps']))
        if rpe_hi >= 8: out['hard_s'] = out['active']
    elif s == 'emom':
        work = sum(station_seconds(e, dz, exp) for e, dz in zip(b['items_e'], b['doses'])) * b['rounds']
        out.update(active=work, recovery=b['minutes'] * 60 - work, transitions=0, bouts=b['rounds'] * len(b['items_e']))
        if rpe_hi >= 8: out['hard_s'] = work
    elif s == 'ladder':
        tot = sum(sum(r * STATION_S.get(x['id'], 3.0) for r in b['ladder']) for x in b['items_e'])
        out.update(active=tot, transitions=len(b['ladder']) * 10, bouts=len(b['ladder']))
        if rpe_hi >= 8: out['hard_s'] = tot
    elif s == 'circuit' and b.get('anchor'):
        a = b['anchor']; rs = b['round_stations']; ad_list = b.get('anchor_doses') or [b['anchor_dose']] * len(rs)
        for r, st in enumerate(rs):
            at = engine_seconds(a, ad_list[r], exp, rpe_hi, r, mixed=True)
            out['anchor_s'] += at; out['engine_s'] += at; out['active'] += at + sum(station_seconds(x, dz, exp) for x, dz in st)
            out['transitions'] += MACHINE_CHANGE_S + TRANSITION_S * len(st); out['bouts'] += 1
        out['recovery'] = (len(rs) - 1) * b['round_rest']
        out['transitions'] += b.get('setup_s', 0)
        if rpe_hi >= 8: out['hard_s'] = out['anchor_s']
    elif s == 'circuit':
        rt = sum(station_seconds(x, dz, exp) for x, dz in zip(b['items_e'], b['doses']))
        out.update(active=b['rounds'] * rt, transitions=b['rounds'] * TRANSITION_S * len(b['items_e']), recovery=(b['rounds'] - 1) * b['round_rest'], bouts=b['rounds'])
        out['engine_s'] = sum(b['rounds'] * station_seconds(x, dz, exp) for x, dz in zip(b['items_e'], b['doses']) if x['role'] == 'engine')
        if rpe_hi >= 8: out['hard_s'] = out['active']
    return out


def block_minutes(b, exp):
    t = block_time(b, exp); return (t['active'] + t['recovery'] + t['transitions']) / 60.0


WU = G.WU; DS = G.DS
BLOCK_GAP_MIN = 1.5


def total_minutes(blocks, aid, dur, exp):
    extra = (blocks[0].get('wu_extra_min', 0) + blocks[0].get('ds_extra_min', 0)) if blocks else 0
    return WU[(aid, dur)] + DS[dur] + extra + BLOCK_GAP_MIN * max(0, len(blocks) - 1) + sum(block_minutes(b, exp) for b in blocks)


def budget(blocks, aid, dur, exp):
    """Whole-session workload accounting. Lean, but enough to catch a 7 x 700 m row before it ships."""
    T = [block_time(b, exp) for b in blocks]
    active = sum(t['active'] for t in T); rec = sum(t['recovery'] for t in T); trans = sum(t['transitions'] for t in T)
    engine = Counter(); engine_s = 0.0; eng_bouts = 0; anchor_s = 0.0
    loaded_reps = 0; bw_reps = 0; reps_by = Counter(); impact_contacts = 0; hi_items = set(); hinge_items = set(); demanding = set(); stations = set(); fixed = set()
    for b, t in zip(blocks, T):
        engine_s += t['engine_s']; anchor_s += t['anchor_s']
        for e, dz, n in _performed(b):
            stations.add(e['id'])
            if e['fixed']: fixed.add(e['fixed'])
            if e['role'] == 'engine' and dz:
                if dz['kind'] in ('distance', 'calories'): engine[(e['id'], dz['kind'])] += dz['value'] * n
                else: engine[(e['id'], 'time')] += dz['value'] * n
                eng_bouts += n
            elif dz and dz['kind'] == 'reps':
                reps = dz['value'] * (2 if dz.get('per_side') else 1) * n; reps_by[e['id']] += reps
                if e['eq'] == 'bodyweight': bw_reps += reps
                else: loaded_reps += reps
                if e['pat'] == 'jump': impact_contacts += reps if e['impact'] == 'high' else int(reps * 0.3)
            elif dz and dz['kind'] == 'time' and e['pat'] == 'jump' and e['role'] != 'engine':
                impact_contacts += int(dz['value'] * n * (1.5 if e['impact'] == 'high' else 0.4))
            elif dz and dz['kind'] == 'time' and e['id'] == 'jump_rope':
                impact_contacts += int(dz['value'] * n * 0.25)       # light, continuous contacts: counted at a quarter weight
            if e['impact'] == 'high': hi_items.add(e['id'])
            if is_loaded_hinge(e): hinge_items.add(e['id'])
            if e['sysd'] >= 4 and e['role'] != 'engine': demanding.add(e['id'])
    hard_s = sum(t['hard_s'] for t in T); very_hard = sum(1 for b in blocks if (b.get('rpe') or [7, 7])[0] >= 9)
    rpes = [tuple(b['rpe']) for b in blocks if b.get('rpe')]
    return dict(
        total_min=round(total_minutes(blocks, aid, dur, exp), 1), active_min=round(active / 60, 1), recovery_min=round(rec / 60, 1), transition_min=round(trans / 60, 1),
        duty=round(active / max(1.0, active + rec), 2),
        engine={f"{k[0]} {k[1]}": v for k, v in engine.items()}, engine_min=round(engine_s / 60, 1), engine_bouts=eng_bouts,
        engine_share=round(engine_s / max(1.0, active), 2), anchor_share=round(anchor_s / max(1.0, active + trans), 2) if anchor_s else None,
        loaded_reps=loaded_reps, bodyweight_reps=bw_reps, reps_by=dict(reps_by), impact_contacts=impact_contacts, high_impact_items=sorted(hi_items),
        loaded_hinges=sorted(hinge_items), demanding=sorted(demanding), stations=len(stations), fixed_stations=len(fixed), transitions=int(trans / TRANSITION_S),
        hard_min=round(hard_s / 60, 1), hard_share=round(hard_s / max(1.0, active), 2), very_hard_blocks=very_hard, rpe=rpes, blocks=len(blocks),
        finisher=any(b['structure'] == 'finisher' for b in blocks),
    )


def _performed(b):
    """(exercise, dose, times performed) for a block."""
    s = b['structure']
    if s == 'continuous': return [(b['items_e'][0], dict(kind='time', value=b['duration_s']), 1)]
    if s in ('intervals', 'finisher') and not (b.get('interval_target') or {}).get('rotate'):
        it = b['interval_target']; k = len(b['items_e'])
        return [(e, dict(kind='time', value=it['work']), it['rounds'] // k if it.get('alternate') else it['rounds']) for e in b['items_e']]
    if s == 'intervals':
        it = b['interval_target']; return [(e, dict(kind='time', value=it['work']), it['rounds']) for e in b['items_e']]
    if s == 'pyramid': return [(b['items_e'][0], dict(kind='time', value=sum(b['interval_target']['steps'])), 1)]
    if s == 'emom': return [(e, dz, b['rounds']) for e, dz in zip(b['items_e'], b['doses'])]
    if s == 'ladder': return [(e, dict(kind='reps', value=sum(b['ladder'])), 1) for e in b['items_e']]
    if s == 'circuit' and b.get('anchor'):
        out = []; ad_list = b.get('anchor_doses') or [b['anchor_dose']] * len(b['round_stations'])
        for r, st in enumerate(b['round_stations']):
            out.append((b['anchor'], ad_list[r], 1)); out += [(e, dz, 1) for e, dz in st]
        return out
    if s == 'circuit': return [(e, dz, b['rounds']) for e, dz in zip(b['items_e'], b['doses'])]
    return []


# budget limits by level (60-minute values; 30-minute scaled by 0.65)
LIMITS = {
    'beginner':     dict(engine_share=0.75, anchor_share=0.45, hard_share=0.30, hard_min=8, loaded_reps=200, impact_contacts=50, hinge=1, stations=6, transitions=28, very_hard=0, engine_min=26),
    'intermediate': dict(engine_share=0.80, anchor_share=0.45, hard_share=0.60, hard_min=16, loaded_reps=300, impact_contacts=90, hinge=1, stations=8, transitions=36, very_hard=1, engine_min=30),
    'advanced':     dict(engine_share=0.85, anchor_share=0.48, hard_share=0.70, hard_min=22, loaded_reps=360, impact_contacts=120, hinge=1, stations=9, transitions=40, very_hard=2, engine_min=34),
}


def limits(exp, dur):
    L = dict(LIMITS[exp])
    if dur == 30:
        for k in ('loaded_reps', 'impact_contacts', 'transitions', 'engine_min'): L[k] = int(L[k] * 0.65)
        L['stations'] = max(5, L['stations'] - 1)
        L['hard_min'] = {'beginner': 6, 'intermediate': 13, 'advanced': 16}[exp]
    return L


def budget_violations(B, exp, dur, aid):
    L = limits(exp, dur); out = []
    if aid == 'sweat_hybrid' and B['anchor_share'] is not None and B['anchor_share'] > L['anchor_share']: out.append(f"anchor share {B['anchor_share']:.0%} above {L['anchor_share']:.0%}")
    if aid != 'sweat_engine' and B['engine_share'] > L['engine_share']: out.append(f"engine share {B['engine_share']:.0%}")
    if B['engine_min'] > L['engine_min']: out.append(f"engine time {B['engine_min']} min above {L['engine_min']}")
    if B['hard_share'] > L['hard_share'] and B['hard_min'] > L['hard_min']: out.append(f"hard (RPE 8+) share {B['hard_share']:.0%} above {L['hard_share']:.0%} ({B['hard_min']} min at RPE 8+, limit {L['hard_min']})")
    if B['loaded_reps'] > L['loaded_reps']: out.append(f"loaded reps {B['loaded_reps']} above {L['loaded_reps']}")
    if B['impact_contacts'] > L['impact_contacts']: out.append(f"impact contacts {B['impact_contacts']} above {L['impact_contacts']}")
    if len(B['loaded_hinges']) > L['hinge']: out.append(f"{len(B['loaded_hinges'])} loaded hinges")
    if B['stations'] > L['stations']: out.append(f"{B['stations']} distinct stations")
    if B['very_hard_blocks'] > L['very_hard']: out.append(f"{B['very_hard_blocks']} all-out blocks")
    return out


# ================================================================== blueprints
BAND = {30: (24, 31), 60: (48, 60)}
PRIMARY_MIN = {('sweat_engine', 60): (20, 26), ('sweat_engine', 30): (14, 18), ('sweat_circuit', 60): (20, 30), ('sweat_circuit', 30): (14, 19), ('sweat_hybrid', 60): (28, 40), ('sweat_hybrid', 30): (15, 21)}
COMP_MIN = {60: (8, 13), 30: (5, 8)}

ENGINE_SHAPES = {   # base weights; State and history move them
    'long_intervals': 1.0, 'short_intervals': 0.8, 'pyramid': 0.5, 'continuous': 0.7,
}
CIRCUIT_SHAPES = {'rounds': 1.0, 'timed': 0.9, 'emom': 0.5}   # ladder lives in the complement (couplet ladder), the primary block keeps a clock or rounds
HYBRID_SHAPES = {'anchor_couplet': 1.0, 'anchor_triplet': 0.9, 'split_anchor': 0.7, 'ladder_hybrid': 0.45}
SHAPE_NAME = {'long_intervals': 'long intervals', 'short_intervals': 'short intervals', 'pyramid': 'pyramid', 'continuous': 'continuous',
              'rounds': 'circuit rounds', 'timed': 'timed circuit', 'emom': 'EMOM', 'ladder': 'ladder', 'anchor_couplet': 'anchor + couplet',
              'anchor_triplet': 'anchor + triplet', 'split_anchor': 'split anchor', 'ladder_hybrid': 'ladder hybrid'}
LEVEL_SHAPE = {'beginner': dict(short_intervals=0.6, pyramid=0.0, emom=0.0, ladder=0.0, ladder_hybrid=0.0, split_anchor=0.6, anchor_triplet=0.6),
               'intermediate': {}, 'advanced': dict(short_intervals=1.1, emom=1.2, ladder=1.2, ladder_hybrid=1.2, anchor_triplet=1.1)}
GOAL_SHAPE = {'lose_weight_conditioning': dict(continuous=1.4, timed=1.6, anchor_couplet=1.5, long_intervals=1.3, emom=0.7),
              'improve_athleticism': dict(short_intervals=2.0, pyramid=1.3, split_anchor=1.8, rounds=1.4, continuous=0.5, timed=0.7),
              'feel_better_reduce_stress': dict(continuous=2.5, long_intervals=1.6, rounds=1.8, anchor_couplet=1.5, short_intervals=0.4, emom=0.3, ladder=0.4, timed=0.6, pyramid=0.6),
              'build_muscle': dict(rounds=2.5, anchor_triplet=1.8, timed=0.4, emom=0.6, continuous=0.6, long_intervals=1.2),
              'build_strength': dict(split_anchor=2.0, rounds=1.8, ladder_hybrid=1.4, timed=0.5, continuous=0.6),
              'stay_consistent': {}}
GOAL_ROT = {'lose_weight_conditioning': ['sweat_circuit', 'sweat_engine', 'sweat_hybrid'], 'improve_athleticism': ['sweat_hybrid', 'sweat_circuit', 'sweat_engine'],
            'build_strength': ['sweat_hybrid', 'sweat_circuit', 'sweat_engine'], 'build_muscle': ['sweat_circuit', 'sweat_hybrid', 'sweat_engine'],
            'feel_better_reduce_stress': ['sweat_engine', 'sweat_circuit', 'sweat_hybrid'], 'stay_consistent': ['sweat_circuit', 'sweat_engine', 'sweat_hybrid']}


# ================================================================== State layer (conditioning philosophies)
# An expression is a small bundle: shape weights (multiplied), rank dials, levers applied to built blocks, composition flags.
EXPRESSIONS = {
    'low_energy': {
        'steadier':      dict(shape=dict(long_intervals=1.6, continuous=2.0, short_intervals=0.2, pyramid=0.3, rounds=1.4, timed=1.0, emom=0.2, ladder=0.1, anchor_couplet=1.5, split_anchor=1.2, anchor_triplet=0.6, ladder_hybrid=0.1),
                              levers=[('rpe', 'all', -1), ('bouts_longer', 'primary')], dials=dict(C=-1), fin=0.0),
        'low_impact_simple': dict(shape=dict(rounds=1.5, continuous=1.4, long_intervals=1.3, emom=0.2, ladder=0.1, ladder_hybrid=0.1, anchor_couplet=1.6, anchor_triplet=0.5),
                              levers=[('rpe', 'all', -1), ('fewer_stations', 'primary')], dials=dict(C=-1), flags={'supported_bias', 'no_high_impact'}, fin=0.0),
        'lighter':       dict(shape=dict(continuous=1.5, long_intervals=1.3, short_intervals=0.3), levers=[('units', 'primary', -1), ('rpe', 'primary', -1)], dials=dict(C=-1), flags={'comp_steady'}, fin=0.0),
    },
    'stressed': {
        'steady_cyclical': dict(shape=dict(continuous=2.5, long_intervals=1.6, short_intervals=0.3, pyramid=0.2, emom=0.1, ladder=0.0, timed=0.6, rounds=1.5, anchor_couplet=1.6, ladder_hybrid=0.0, split_anchor=1.1),
                                levers=[('rpe_cap', 'all', 7)], dials=dict(G=2, NS=-1), flags={'familiar_bias'}, fin=0.0),
        'fixed_rounds':    dict(shape=dict(rounds=2.5, timed=0.8, emom=0.0, ladder=0.0, pyramid=0.2, long_intervals=1.3, anchor_couplet=2.0, anchor_triplet=1.0, split_anchor=1.0, ladder_hybrid=0.0),
                                levers=[('fewer_stations', 'primary'), ('rpe_cap', 'all', 7)], dials=dict(G=2, NS=-1), flags={'familiar_bias'}, fin=0.0),
        'controlled_pace': dict(shape=dict(long_intervals=1.8, continuous=1.5, short_intervals=0.4, rounds=1.4, emom=0.1, ladder=0.0, ladder_hybrid=0.0),
                                levers=[('recovery_up', 'all', 0.25), ('rpe_cap', 'all', 7)], dials=dict(G=1, NS=-1), fin=0.0),
    },
    'bored': {
        'new_structure':   dict(shape=dict(pyramid=2.0, ladder=2.2, emom=1.8, timed=1.3, ladder_hybrid=2.2, split_anchor=1.5, anchor_triplet=1.3, rounds=0.5, continuous=0.3, long_intervals=0.6, anchor_couplet=0.5),
                                levers=[], dials=dict(NE=1, NS=1), flags={'avoid_last_shape'}, fin=0.2),
        'new_modalities':  dict(shape=dict(continuous=0.4), levers=[], dials=dict(NE=2, NS=0), flags={'rotate_modality', 'novelty_bias', 'equipment_variety'}, fin=0.2),
        'changing_intervals': dict(shape=dict(pyramid=2.5, ladder_hybrid=2.0, ladder=1.5, short_intervals=1.2, continuous=0.2, rounds=0.6),
                                levers=[('vary_intervals', 'primary')], dials=dict(NE=1, NS=1), fin=0.3),
    },
    'irritated': {
        'output_tools':    dict(shape=dict(rounds=1.4, split_anchor=1.4, anchor_couplet=1.2, short_intervals=1.2, emom=0.4, ladder=0.3, ladder_hybrid=0.3),
                                levers=[('rpe', 'primary', +1)], dials=dict(C=-1, X=1), flags={'forceful_bias', 'simple_bias'}, fin=0.35),
        'hard_simple':     dict(shape=dict(short_intervals=2.2, rounds=1.3, long_intervals=0.8, continuous=0.2, pyramid=0.3, emom=0.2, ladder=0.1, ladder_hybrid=0.2),
                                levers=[('rpe', 'primary', +1)], dials=dict(C=-1), flags={'simple_bias', 'erg_bias'}, fin=0.2),
        'direct_finisher': dict(shape=dict(rounds=1.3, anchor_couplet=1.2), levers=[], dials=dict(C=-1, X=1), flags={'forceful_bias'}, fin=0.9),
    },
    'amped': {
        'harder_output':   dict(shape=dict(short_intervals=1.3, pyramid=1.2, split_anchor=1.2), levers=[('rpe', 'primary', +1)], dials=dict(E=1), fin=0.2),
        'denser':          dict(shape=dict(timed=1.3, emom=1.3, anchor_triplet=1.3, rounds=1.1), levers=[('recovery_down', 'all', 0.25)], dials=dict(E=1), fin=0.2),
        'extra_round':     dict(shape=dict(rounds=1.3, anchor_couplet=1.2, long_intervals=1.2), levers=[('units', 'primary', +1)], dials=dict(V=1), fin=0.35),
    },
}
LAST_RESORT = {
    'low_energy': dict(shape={}, levers=[('rpe', 'all', -1), ('units', 'primary', -1)], dials=dict(C=-1), flags={'supported_bias', 'no_high_impact'}, fin=0.0),
    'stressed': dict(shape={}, levers=[('rpe_cap', 'all', 7), ('recovery_up', 'all', 0.25)], dials=dict(G=2, NS=-1), flags={'familiar_bias'}, fin=0.0),
    'bored': dict(shape={}, levers=[('vary_intervals', 'primary')], dials=dict(NE=2, NS=1), flags={'rotate_modality', 'novelty_bias', 'avoid_last_shape'}, fin=0.4),
    'irritated': dict(shape={}, levers=[('rpe', 'primary', +1)], dials=dict(C=-1, X=1), flags={'forceful_bias', 'simple_bias'}, fin=0.8),
    'amped': dict(shape={}, levers=[('rpe', 'primary', +1), ('units', 'primary', +1)], dials=dict(E=1, V=1), fin=0.4),
}
STATE_INTENT = {'low_energy': 'keep_moving_lower_intensity_and_systemic_cost', 'stressed': 'rhythmic_predictable_conditioning', 'bored': 'fresh_engaging_conditioning',
                'irritated': 'direct_cathartic_output', 'amped': 'use_readiness_for_output_or_density'}


def choose_expression(s, seed, history, forced=None):
    if forced: return forced
    w = {k: 1.0 for k in EXPRESSIONS[s]}
    last = [h.get('expressions', {}).get(s) for h in history[-2:]]
    for i, ex in enumerate(reversed(last)):
        if ex in w: w[ex] *= 0.15 if i == 0 else 0.5
    return weighted_pick(w, seed, 'expr', s)


def next_expression(s, tried):
    for k in EXPRESSIONS[s]:
        if k not in tried: return k
    return None if 'last_resort' in tried else 'last_resort'


def resolve(states, exp, dur, seed, history, forced):
    """-> dict(expressions, shape multipliers, dials for ranked(), levers, flags, finisher p, conflict log)."""
    log = []; chosen = {}; shape = {}; dials = dict(V=0, E=0, NE=0, NS=0, C=0, G=0, X=0); levers = []; flags = set(); fin_p = 0.0
    for s in states:
        chosen[s] = choose_expression(s, seed, history, (forced or {}).get(s))
        e = LAST_RESORT[s] if chosen[s] == 'last_resort' else EXPRESSIONS[s][chosen[s]]
        log.append(dict(reason_code='state_expression', state=s, expression=chosen[s], forced=bool((forced or {}).get(s))))
        for k, v in e.get('shape', {}).items(): shape[k] = shape.get(k, 1.0) * v
        for k, v in e.get('dials', {}).items(): dials[k] = dials.get(k, 0) + v
        levers += [(s,) + tuple(lv) for lv in e.get('levers', [])]
        flags |= set(e.get('flags', ())); fin_p = max(fin_p, e.get('fin', 0.0))
    # ---- conflict rules (deterministic, few)
    st = set(states)
    if 'low_energy' in st and 'amped' in st:
        # Low Energy owns total workload and systemic cost; Amped keeps one harder primary output block only
        keep = []
        for lv in levers:
            if lv[0] == 'amped' and lv[1] == 'units': log.append(dict(reason_code='state_conflict_resolved', rule='low_energy_owns_workload', dropped=lv)); continue
            if lv[0] == 'amped' and lv[1] == 'recovery_down': lv = ('amped', 'recovery_down', 'primary', 0.25); log.append(dict(reason_code='state_conflict_resolved', rule='low_energy_owns_workload', scoped=lv))
            if lv[0] == 'amped' and lv[1] == 'rpe': lv = ('amped', 'rpe_to_8', 'primary', None); log.append(dict(reason_code='state_conflict_resolved', rule='low_energy_owns_workload', scoped=lv))
            keep.append(lv)
        levers = keep; fin_p = 0.0; dials['V'] = min(dials['V'], 0)
        # Low Energy owns the secondary work, volume and impact; the main block is Amped's one harder / denser block (RPE 7-8, never 8+ floor)
        levers = [lv for lv in levers if not (lv[0] == 'low_energy' and lv[1] == 'rpe')] + [('low_energy', 'rpe', 'secondary', -1)]
        if not any(lv[0] == 'amped' and lv[1] == 'recovery_down' for lv in levers): levers.append(('amped', 'recovery_down', 'primary', 0.25))
        if dur == 30:
            # one block only: Low Energy sets the effort of that block, Amped tightens its rest
            levers = [lv for lv in levers if not (lv[0] == 'amped' and lv[1] == 'rpe_to_8')] + [('low_energy', 'rpe', 'primary', -1)]
            log.append(dict(reason_code='state_conflict_resolved', rule='low_energy_owns_workload', detail='30 min: Low Energy sets the main-block effort, Amped tightens its rest'))
    if 'stressed' in st and 'amped' in st:
        # Amped owns productive output; Stressed owns structure, predictability, no frantic density
        levers = [lv for lv in levers if not (lv[0] == 'amped' and lv[1] in ('recovery_down',))]
        if not any(lv[0] == 'amped' and lv[1] in ('rpe', 'units') for lv in levers): levers.append(('amped', 'rpe', 'primary', +1))   # density is Stressed's to refuse; output is Amped's to keep
        for k in ('emom', 'ladder', 'ladder_hybrid', 'pyramid'): shape[k] = 0.0
        levers = [lv for lv in levers if not (lv[0] == 'stressed' and lv[1] == 'rpe_cap')] + [('stressed', 'rpe_cap', 'secondary', 7)]
        fin_p = min(fin_p, 0.15); log.append(dict(reason_code='state_conflict_resolved', rule='amped_output_stressed_structure'))
    if 'stressed' in st and 'bored' in st:
        for k in ('emom', 'ladder', 'ladder_hybrid', 'pyramid'): shape[k] = 0.0     # Bored owns movement / modality novelty, Stressed owns the structure
        flags.discard('avoid_last_shape'); levers = [lv for lv in levers if lv[1] != 'vary_intervals']; dials['NS'] = -1
        log.append(dict(reason_code='state_conflict_resolved', rule='bored_novelty_stressed_structure'))
    if 'stressed' in st and 'irritated' in st:
        for k in ('emom', 'ladder', 'ladder_hybrid', 'pyramid'): shape[k] = 0.0
        levers = [lv for lv in levers if not (lv[0] == 'irritated' and lv[1] == 'rpe')] + [('irritated', 'rpe', 'primary', +1)]
        levers = [lv for lv in levers if not (lv[0] == 'stressed' and lv[1] == 'rpe_cap')] + [('stressed', 'rpe_cap', 'secondary', 7)]
        fin_p = min(fin_p, 0.3); log.append(dict(reason_code='state_conflict_resolved', rule='irritated_direct_stressed_calm'))
    if 'low_energy' in st and 'irritated' in st:
        # direct, cathartic tools at sustainable output: no hard intervals, no finisher
        levers = [lv for lv in levers if not (lv[0] == 'irritated' and lv[1] == 'rpe')]
        shape['short_intervals'] = shape.get('short_intervals', 1.0) * 0.2; fin_p = 0.0; flags.discard('erg_bias')
        log.append(dict(reason_code='state_conflict_resolved', rule='irritated_tools_low_energy_intensity'))
    if 'low_energy' in st and 'bored' in st:
        levers = [lv for lv in levers if lv[1] != 'vary_intervals']; fin_p = 0.0; shape['emom'] = shape.get('emom', 1.0) * 0.3
        log.append(dict(reason_code='state_conflict_resolved', rule='bored_novelty_low_energy_cost'))
    if 'amped' in st and 'bored' in st:
        fin_p = max(fin_p, 0.3)
    if 'low_energy' in st: fin_p = 0.0
    return dict(states=list(states), expressions=chosen, shape=shape, dials=dials, levers=levers, flags=flags, fin_p=fin_p, log=log)


# ================================================================== ranking dials for sweat_gen.ranked
def rank_dials(res, exp):
    base = {'beginner': 2, 'intermediate': 3, 'advanced': 3}[exp]
    d = dict(res['dials']); d['cap'] = max(1, min(3, base + d.get('C', 0))); d.setdefault('NE', 0); d.setdefault('NS', 0); d.setdefault('G', 0)
    d['ESCOPE'] = 'all'; d['pair'] = None; return d


def prefer_fn(res, ctx):
    """Soft taste preference (below recency) from State flags and goal."""
    fl = res['flags']; goal = ctx.get('goal')
    def f(e):
        s = 0
        if 'forceful_bias' in fl: s += 2 * (e['forceful'] and self_limiting(e)) + (e['mod'] in ('sled', 'rope', 'throw')) + (e['pat'] == 'carry')
        if 'simple_bias' in fl: s += (e['cx'] <= 1)
        if 'supported_bias' in fl: s += 2 * (e['sup'] != 'unsupported') + (e['sysd'] <= 2)
        if 'familiar_bias' in fl: s += (e['nov'] <= 2) + (e['fixed'] is None)
        if 'novelty_bias' in fl: s += e['nov']
        if goal == 'improve_athleticism': s += (e['mod'] in ('sled', 'throw', 'jump')) + (e['pat'] == 'carry')
        if goal == 'build_muscle': s += e['role'].startswith('resistance')
        if goal == 'build_strength': s += (e['pat'] == 'carry') + (e['mod'] == 'sled')
        return s
    return f


# ================================================================== engine blueprint
def engine_shape(res, ctx, seed, history, exp, goal):
    w = dict(ENGINE_SHAPES)
    for k, v in LEVEL_SHAPE[exp].items():
        if k in w: w[k] *= v
    for k, v in GOAL_SHAPE.get(goal, {}).items():
        if k in w: w[k] *= v
    for k, v in res['shape'].items():
        if k in w: w[k] *= v
    last = ([h.get('shape') for h in history if h.get('archetype') == 'sweat_engine'] + [c.get('shape') for c in ctx.get('displayed_chain', [])])[-2:]   # + this Different Workout chain
    for i, sh in enumerate(reversed(last)):
        if sh in w: w[sh] *= 0.3 if (i == 0 or 'avoid_last_shape' in res['flags']) else 0.7
    if exp == 'beginner': w['short_intervals'] *= 0.5
    return weighted_pick(w, seed, 'engine_shape'), w


LONG_BOUT_SHAPES = ('long_intervals', 'pyramid', 'continuous')


def pick_engine_item(ctx, d, res, history, seed, slot='primary_engine_block', shape='long_intervals', exclude=()):
    fl = res['flags']
    def ok(e):
        if e['id'] in exclude: return False
        if shape == 'short_intervals' and e['eq'] in MIN_BOUT: return False
        if e['id'] == 'treadmill_incline_walk' and shape not in ('continuous',): return False
        if e['id'] == 'jump_rope' and shape in LONG_BOUT_SHAPES: return False      # a rope is a short-bout tool, not a 20-minute engine
        if 'no_high_impact' in fl and e['impact'] != 'low': return False
        return True
    last_mod = ([h.get('engine') for h in history if h.get('engine')] + [c['engine'] for c in ctx.get('displayed_chain', []) if c.get('engine')])[-2:]   # + this Different Workout chain
    def pref(e):
        s = 0
        if shape == 'continuous': s += {'row_erg': 2, 'stationary_bike': 2, 'treadmill_incline_walk': 1, 'treadmill_run': 1, 'stair_climber': 1, 'air_bike': 1}.get(e['id'], 0)
        if 'erg_bias' in fl: s += {'row_erg': 2, 'ski_erg': 2, 'air_bike': 2}.get(e['id'], 0)
        if 'rotate_modality' in fl or True:
            if last_mod and e['id'] == last_mod[-1]: s -= 3
            elif len(last_mod) > 1 and e['id'] == last_mod[-2]: s -= 1
        if 'supported_bias' in fl: s += (e['sup'] != 'unsupported')
        return s
    pool = G.ranked('sweat_engine', slot, ctx, d, 'engine_item', ok, prefer=pref)
    return pool[0] if pool else None


def build_engine_primary(e, shape, exp, dur, res, ctx):
    lo, hi = PRIMARY_MIN[('sweat_engine', dur)]; tgt = (lo + hi) / 2
    if shape == 'continuous':
        mins = min(hi, 26) if exp != 'beginner' else min(20, hi)
        rpe = [5, 6]
        return G.mk_block('primary_engine_block', 'continuous', items_e=[e], duration_s=int(mins * 60), engine_mode='steady', engine_format='aerobic', rpe=rpe, unit_s=120, shape=shape)
    if shape == 'pyramid':
        steps = [60, 120, 180, 120, 60] if dur == 30 or exp == 'beginner' else [60, 120, 180, 240, 240, 180, 120, 60]
        return G.mk_block('primary_engine_block', 'pyramid', items_e=[e], interval_target=dict(steps=steps, recovery=60 if exp != 'beginner' else 90), engine_mode='interval', engine_format='pyramid', rpe=[7, 8], shape=shape)
    if shape == 'short_intervals':
        W, R, rpe = {'beginner': (30, 30, [7, 8]), 'intermediate': (40, 20, [8, 9]), 'advanced': (40, 20, [8, 9])}[exp]
        if e['eq'] in MIN_BOUT: W, R = 60, 30
        n = max(6, min(16, int(tgt * 60 // (W + R))))
        return G.mk_block('primary_engine_block', 'intervals', items_e=[e], interval_target=dict(work=W, recovery=R, rounds=n, df_max=18), engine_mode='interval', engine_format='short', rpe=rpe, shape=shape)
    W, R, rpe = {'beginner': (150, 150, [6, 7]), 'intermediate': (240, 90, [7, 8]), 'advanced': (300, 90, [7, 8])}[exp]
    if dur == 30: W = min(W, 240)
    n = max(3, min(6, int(round((tgt * 60 + R) / (W + R)))))
    return G.mk_block('primary_engine_block', 'intervals', items_e=[e], interval_target=dict(work=W, recovery=R, rounds=n, df_max=7), engine_mode='interval', engine_format='long_even', rpe=rpe, shape=shape)


# ================================================================== circuit blueprint
def circuit_shape(res, ctx, seed, history, exp, goal, items):
    w = dict(CIRCUIT_SHAPES)
    for k, v in LEVEL_SHAPE[exp].items():
        if k in w: w[k] *= v
    for k, v in GOAL_SHAPE.get(goal, {}).items():
        if k in w: w[k] *= v
    for k, v in res['shape'].items():
        if k in w: w[k] *= v
    if any(e['eq'] in MIN_BOUT for e in items): w['timed'] = 0.0; w['emom'] = 0.0
    if any(is_hanging(e) or e['id'] in ('pull_up', 'chin_up', 'neutral_grip_pull_up') for e in items): w['timed'] = 0.0
    reps_items = [e for e in items if e['metric'] == 'reps' and e['role'] != 'engine']
    if len(reps_items) < 2 or exp == 'beginner': w['ladder'] = 0.0
    last = [h.get('shape') for h in history if h.get('archetype') == 'sweat_circuit'][-2:]
    for i, sh in enumerate(reversed(last)):
        if sh in w: w[sh] *= 0.3 if (i == 0 or 'avoid_last_shape' in res['flags']) else 0.7
    return weighted_pick(w, seed, 'circuit_shape'), w


def build_circuit_primary(items, shape, exp, dur, res, ctx, log):
    lo, hi = PRIMARY_MIN[('sweat_circuit', dur)]; tgt = (lo + hi) / 2; fl = res['flags']
    if shape == 'ladder':
        reps_items = [e for e in items if e['metric'] == 'reps' and e['role'] != 'engine'][:2]
        b = G.mk_block('primary_circuit', 'ladder', items_e=reps_items, ladder=[12, 10, 8, 6, 4] if exp == 'advanced' else [10, 8, 6, 4, 2], rpe=[7, 8], shape=shape)
        return b
    if shape == 'emom':
        try:
            b = G.build_circuit_block('primary_circuit', 'emom', items, ctx, dict(rank_dials(res, exp)), tgt, dur, log, rpe=[7, 8]); b['shape'] = shape
            if G.duty_cycle(b, exp) >= G.DUTY_MIN: return b
            log.append(dict(reason_code='structure_fallback', detail='emom duty below 0.60: fixed rounds instead'))
        except G.Fail as f:
            log.append(dict(reason_code='structure_fallback', detail=f'emom: {f}'))
        shape = 'rounds'
    if shape == 'timed':
        W, R = {'beginner': (35, 25), 'intermediate': (40, 20), 'advanced': (45, 15)}[exp]
        doses = [dict(kind='time', value=W) for _ in items]
        b = G.mk_block('primary_circuit', 'intervals', items_e=items, doses=doses, interval_target=dict(work=W, recovery=R, rounds=3, rotate=True, round_rest=60 if exp == 'beginner' else 45), rpe=[7, 8], shape=shape)
        best = min(range(3, 8), key=lambda r: abs(block_minutes(dict(b, interval_target=dict(b['interval_target'], rounds=r)), exp) - tgt)); b['interval_target']['rounds'] = best
        return b
    doses = [G.station_dose(e, exp) for e in items]
    rr = {'beginner': 75, 'intermediate': 60, 'advanced': 45}[exp]
    b = G.mk_block('primary_circuit', 'circuit', items_e=items, doses=doses, rounds=3, round_rest=rr, rpe=[7, 8], shape=shape)
    best = min(range(3, 6 if exp == 'beginner' else 8), key=lambda r: abs(block_minutes(dict(b, rounds=r), exp) - tgt)); b['rounds'] = best
    return b


def compose_circuit(ctx, d, res, log, aid='sweat_circuit'):
    roles = G.circuit_template(ctx, log)
    fl = res['flags']
    if 'fewer_stations' in {lv[1] for lv in res['levers']} and len(roles) == 4: roles = roles[:3]
    items = G.fill_with_relax(aid, 'primary_circuit', ctx, d, roles, set(), set(), 'primary', log)
    if ctx['experience'] == 'beginner' or 'low_energy' in res['states'] or 'stressed' in res['states']:
        drivers = [e for e in items if e['role'] in ('engine', 'output')]
        jumps = [e for e in items if e['pat'] == 'jump' and e['role'] != 'engine']
        for e_old in [j for j in jumps[1:] if not (j in drivers and len(drivers) == 1)]:
            k = items.index(e_old); used = {x['id'] for x in items}; fams = {x['swap'] for x in items if x['id'] != e_old['id']}
            for e in G.ranked(aid, 'primary_circuit', ctx, d, 'jump_swap', lambda e: e['pat'] != 'jump' and e['role'] != 'engine' and e['id'] not in used and e['swap'] not in fams and e['impact'] == 'low'):
                if G.ok_add(e, [x for x in items if x['id'] != e_old['id']], set(), set(), []): items[k] = e; log.append(dict(reason_code='impact_limited', **{'from': e_old['id'], 'to': e['id']})); break
    items = G.cover_target(items, ctx, d, log)
    return G.order_items(items, log, 'primary')


# ================================================================== hybrid blueprint
def hybrid_shape(res, ctx, seed, history, exp, goal, dur):
    w = dict(HYBRID_SHAPES)
    for k, v in LEVEL_SHAPE[exp].items():
        if k in w: w[k] *= v
    for k, v in GOAL_SHAPE.get(goal, {}).items():
        if k in w: w[k] *= v
    for k, v in res['shape'].items():
        if k in w: w[k] *= v
    if dur == 30: w['split_anchor'] *= 0.5; w['anchor_triplet'] *= 0.8
    last = [h.get('shape') for h in history if h.get('archetype') == 'sweat_hybrid'][-2:]
    for i, sh in enumerate(reversed(last)):
        if sh in w: w[sh] *= 0.3 if (i == 0 or 'avoid_last_shape' in res['flags']) else 0.7
    return weighted_pick(w, seed, 'hybrid_shape'), w


HYBRID_SPEC = {   # per shape: stations per round, rounds (30 / 60), anchor bout seconds by level (30 / 60), station seconds target
    'anchor_couplet': dict(k=2, rounds={30: 4, 60: 6}, anchor={'beginner': (75, 90), 'intermediate': (100, 120), 'advanced': (105, 125)}, station_s={30: 40, 60: 55}),
    'anchor_triplet': dict(k=3, rounds={30: 3, 60: 5}, anchor={'beginner': (90, 105), 'intermediate': (110, 130), 'advanced': (115, 140)}, station_s={30: 42, 60: 50}),
    'split_anchor':   dict(k=4, rounds={30: 2, 60: 3}, anchor={'beginner': (150, 180), 'intermediate': (180, 210), 'advanced': (200, 240)}, station_s={30: 45, 60: 55}),
    'ladder_hybrid':  dict(k=2, rounds={30: 3, 60: 5}, anchor={'beginner': (80, 100), 'intermediate': (110, 130), 'advanced': (120, 140)}, station_s={30: 45, 60: 55}),
}


def hybrid_station_dose(e, exp, target_s):
    """Station dose sized to about target_s seconds of work: repeatable conditioning output, never low-rep strength work."""
    dz = G.station_dose(e, exp, hybrid=True)
    for _ in range(12):
        t = station_seconds(e, dz, exp)
        if t > target_s * 1.35 and dz['kind'] == 'reps' and dz['value'] > (6 if dz.get('per_side') else 8): dz['value'] -= 1
        elif t > target_s * 1.35 and dz['kind'] == 'distance' and dz['value'] > 20: dz['value'] -= 5
        elif t < target_s * 0.7 and dz['kind'] == 'reps' and dz['value'] < (12 if dz.get('per_side') else 20): dz['value'] += 1
        elif t < target_s * 0.7 and dz['kind'] == 'time' and dz['value'] < 45: dz['value'] += 5
        else: break
    return dz


def compose_hybrid(ctx, d, res, log, shape, exp, dur, seed, history):
    spec = HYBRID_SPEC[shape]; fl = res['flags']; k = spec['k']
    last_anchor = [h.get('engine') for h in history if h.get('archetype') == 'sweat_hybrid' and h.get('engine')][-1:]
    def apref(e):
        s = {'row_erg': 2, 'ski_erg': 1, 'air_bike': 1, 'treadmill_run': 1}.get(e['id'], 0)
        if 'forceful_bias' in fl or 'erg_bias' in fl: s += {'row_erg': 1, 'air_bike': 2, 'ski_erg': 1}.get(e['id'], 0)
        if 'supported_bias' in fl: s += (e['sup'] != 'unsupported')
        if last_anchor and e['id'] == last_anchor[0]: s -= 3
        return s
    anchors = G.ranked('sweat_hybrid', 'primary_hybrid_block.anchor', ctx, d, 'anchor', lambda e: not ('no_high_impact' in fl and e['impact'] != 'low'), prefer_low=apref)
    if not anchors: raise Fail('no hybrid anchor')
    pf = prefer_fn(res, ctx)
    for a in anchors:
        cands = G.ranked('sweat_hybrid', 'primary_hybrid_block.station', ctx, d, 'stations', lambda e: e['fixed'] != a['fixed'], prefer_low=pf)
        chosen = []
        lower = [e for e in cands if e['region'] == 'lower' or e['role'] == 'resistance_lower']
        for e in lower:
            if G.ok_add(e, chosen, {a['id']}, {a['swap']}, [a]): chosen.append(e); break
        if not chosen: continue
        need_upper = k >= 2
        for want in ('upper', 'any'):
            for e in cands:
                if len(chosen) >= k: break
                if e in chosen: continue
                if want == 'upper' and not (e['region'] == 'upper' or e['role'] in ('resistance_upper',) or (e['role'] == 'output' and e['region'] != 'lower')): continue
                if sum(1 for x in chosen if x['mod'] == 'sled') >= 1 and e['mod'] == 'sled': continue
                if G.ok_add(e, chosen, {a['id']}, {a['swap']}, [a]): chosen.append(e)
            if len(chosen) >= k: break
        if len(chosen) < 2: continue
        break
    else: raise Fail('hybrid: not enough stations')
    rounds = spec['rounds'][dur]; alo, ahi = spec['anchor'][exp]
    rpe = [7, 8]
    ad = engine_dose_for_seconds(a, (alo + ahi) / 2, exp, rpe=rpe[1], mixed=True)
    chosen = G.order_items(chosen, log, 'stations') if len(chosen) > 2 else chosen
    doses = [hybrid_station_dose(e, exp, spec['station_s'][dur]) for e in chosen]
    rr = {'beginner': 75, 'intermediate': 60, 'advanced': 45}[exp]
    rs = [list(zip(chosen, doses)) for _ in range(rounds)]
    b = G.mk_block('primary_hybrid_block', 'circuit', anchor=a, anchor_dose=ad, items_e=[a] + chosen, stations=list(zip(chosen, doses)), reserve=[], _exp=exp,
                   round_stations=rs, round_rest=rr, rpe=rpe, rotating=False, shape=shape)
    if shape == 'ladder_hybrid':
        # anchor descends across rounds while the stations climb: predictable, but every round feels different
        steps = []
        for r in range(rounds):
            frac = 1.0 + 0.25 * ((rounds - 1) / 2.0 - r)
            steps.append(engine_dose_for_seconds(a, (alo + ahi) / 2 * frac, exp, rpe=rpe[1], mixed=True))
        b['anchor_doses'] = steps; b['anchor_dose'] = steps[0]
        rs2 = []
        for r in range(rounds):
            row = []
            for e, dz in zip(chosen, doses):
                d2 = dict(dz)
                if d2['kind'] == 'reps': d2['value'] = min(12 if d2.get('per_side') else 20, max(6, int(round(dz['value'] * (0.8 + 0.15 * r)))))
                row.append((e, d2))
            rs2.append(row)
        b['round_stations'] = rs2
    return b


# ================================================================== hybrid completeness + closer
def hybrid_elements(p): return 1 + len(p.get('stations') or [])


def primary_complete(p, exp):
    """Primary Block Completeness Gate: 3+ distinct training elements and 20 to 40 minutes of meaningful active work."""
    if not p.get('anchor'): return False
    active = block_time(p, exp)['active'] / 60.0
    return hybrid_elements(p) >= 3 and active >= 20


def _grow(dz):
    k, v = dz['kind'], dz['value']
    if k == 'distance': return dict(dz, value=int(round((v * 1.2) / 50.0) * 50))
    if k == 'calories': return dict(dz, value=int(round(v * 1.2 / 2.0) * 2))
    if k == 'time': return dict(dz, value=int(round(v * 1.2 / 15.0) * 15))
    return dz


def build_closer(ctx, d, res, log, blocks, dur, exp):
    """One low-complexity 5 to 10 minute closer with a purpose. Never a second circuit: the Hybrid block is the workout.
    Low Energy / Stressed / default: a steady flush on a second modality. Irritated / Amped (not beginners): 6 to 8 short self-limiting efforts."""
    ids, fams = G.used_of(blocks); prim = blocks[0]; fl = res['flags']; states = set(res['states'])
    used_engine = {e['id'] for e in prim['items_e'] if e['role'] == 'engine'}
    if limits(exp, dur)['stations'] - len({e['id'] for b in blocks for e in b['items_e']}) < 1:
        log.append(dict(reason_code='closer_unavailable', detail='station budget used by the main block')); return None
    cands = [e for e in G.ranked('sweat_engine', 'complementary_block', ctx, d, 'closer', lambda e: e['role'] == 'engine' and e['impact'] != 'high' and e['id'] != 'jump_rope' and e['id'] not in used_engine and not ('no_high_impact' in fl and e['impact'] != 'low')) if e['id'] not in ids and e['swap'] not in fams]
    if not cands: log.append(dict(reason_code='closer_unavailable', detail='no second engine modality in this setup')); return None
    hard = ({'irritated', 'amped'} & states) and not ({'low_energy', 'stressed'} & states) and exp != 'beginner'
    if hard:
        e = next((x for x in cands if x['eq'] not in MIN_BOUT), None)
        if e is not None:
            return G.mk_block('complementary_block', 'intervals', items_e=[e], interval_target=dict(work=30, recovery=30, rounds=6, df_max=8), rpe=[8, 8], comp_type='closer', shape='closer', purpose='a short, direct finish on a self-limiting tool')
    e = cands[0]
    return G.mk_block('complementary_block', 'continuous', items_e=[e], duration_s=6 * 60, rpe=[5, 6], comp_type='closer', unit_s=60, shape='closer', purpose='an easy flush to bring the heart rate down gradually after the anchor work')


def hybrid_fill(blocks, aid, dur, exp, log, ctx, d, res, ok_fn=None):
    """Fill a short Hybrid session in this order: one more round (blueprint permitting), a slightly longer anchor bout, technique and setup time
    on the main block, a longer warm-up and downshift, and only then one small closer. Each step is rolled back if the budget, the window
    or a passed State verdict (ok_fn) objects. Returns True when the session reached the window."""
    lo, hi = BAND[dur]; p = blocks[0]
    phi = PRIMARY_MIN[(aid, dur)][1] - (6 if exp == 'beginner' else 0)     # a beginner's main block stops growing sooner; setup, warm-up and a closer fill the rest
    def tm(): return total_minutes(blocks, aid, dur, exp)
    def ok():
        if tm() > hi or budget_violations(budget(blocks, aid, dur, exp), exp, dur, aid): return False
        return ok_fn() if ok_fn else True
    if tm() >= lo: return True
    # 1. rounds (bounded by the blueprint)
    guard = 0
    while tm() < lo and guard < 3 and block_minutes(p, exp) < phi:
        guard += 1; snap = copy.deepcopy(blocks)
        if not grow_primary(blocks, aid, dur, exp, log) or block_minutes(p, exp) > phi + 3 or not ok(): blocks[:] = snap; p = blocks[0]; break
        log.append(dict(reason_code='duration_backfill', detail='primary +1 round'))
    if tm() >= lo: return True
    # 2. a slightly longer anchor bout
    if not p.get('anchor_doses'):
        snap = copy.deepcopy(blocks); old = p['anchor_dose']; p['anchor_dose'] = _grow(old)
        if p['anchor_dose'] != old and ok(): log.append(dict(reason_code='duration_backfill', detail=f"anchor bout {old['value']} → {p['anchor_dose']['value']} {old['kind']}"))
        else: blocks[:] = snap; p = blocks[0]
    if tm() >= lo: return True
    # 3. technique and setup time on the main block (anchor pacing, station loads), then warm-up and downshift
    gap = lo - tm()
    if gap > 0:
        setup = int(min(180, max(60, round(gap * 60 / 60.0) * 60)))
        p['setup_s'] = setup; log.append(dict(reason_code='duration_backfill', detail=f'{setup // 60} min technique and setup before round 1'))
    gap = lo - tm()
    if gap > 0:
        wu = int(min(2, max(1, round(gap)))); p['wu_extra_min'] = wu; log.append(dict(reason_code='duration_backfill', detail=f'warm-up +{wu} min'))
    gap = lo - tm()
    if gap > 0: p['ds_extra_min'] = 1; log.append(dict(reason_code='duration_backfill', detail='downshift +1 min'))
    if tm() >= lo: return True
    # 4. one small closer, only when the gap is still real
    if tm() < lo - 2 and not any(b.get('comp_type') == 'closer' for b in blocks):
        c = build_closer(ctx, d, res, log, blocks, dur, exp)
        if c:
            k = len(blocks) if blocks[-1]['structure'] != 'finisher' else len(blocks) - 1
            blocks.insert(k, c); finalize(blocks, exp)
            if ok(): log.append(dict(reason_code='hybrid_closer', detail=c.get('purpose'), minutes=round(block_minutes(c, exp), 1)))
            else: blocks.remove(c); log.append(dict(reason_code='closer_unavailable', detail='budget, window or State coherence'))
    guard = 0
    while tm() < lo and guard < 4 and len(blocks) > 1 and blocks[1].get('comp_type') == 'closer' and block_minutes(blocks[1], exp) < 10:
        guard += 1; snap = copy.deepcopy(blocks)
        if not add_unit(blocks[1], +1, exp) or not ok(): blocks[:] = snap; break
        log.append(dict(reason_code='duration_backfill', detail='closer +1 unit'))
    finalize(blocks, exp)
    return tm() >= lo


# ================================================================== complement + finisher
def build_complement(aid, ctx, d, res, log, blocks, dur, exp, history, seed):
    fl = res['flags']; ids, fams = G.used_of(blocks); lo, hi = COMP_MIN[dur]; tgt = (lo + hi) / 2
    prim = blocks[0]
    room = limits(exp, dur)['stations'] - len({e['id'] for b in blocks for e in b['items_e']})
    if room < 1: log.append(dict(reason_code='complement_unavailable', detail='station budget used by the main block')); return None
    if room < 3 and aid == 'sweat_engine': pass    # engine complements below fall back to 2 stations or an engine block
    if room < 2 and aid != 'sweat_engine' and 'comp_steady' not in fl and 'low_energy' not in res['states']:
        used_engine = {e['id'] for e in prim['items_e'] if e['role'] == 'engine'}
        for e in G.ranked(aid, 'complementary_block', ctx, d, 'comp_engine_room', lambda e: e['role'] == 'engine' and e['eq'] not in MIN_BOUT and e['id'] not in used_engine and e['id'] not in ids and e['swap'] not in fams and not ('no_high_impact' in fl and e['impact'] != 'low')):
            W, R = (30, 30) if exp == 'beginner' else (40, 20)
            if 'stressed' in res['states']: W, R = 60, 60
            n = max(4, min(10, int(tgt * 60 // (W + R))))
            return G.mk_block('complementary_block', 'intervals', items_e=[e], interval_target=dict(work=W, recovery=R, rounds=n), rpe=[7, 8], comp_type='engine_intervals', shape='intervals')
        return None
    if 'comp_steady' in fl or ('low_energy' in res['states'] and aid != 'sweat_engine'):
        src = aid if any(EX[eid]['role'] == 'engine' for eid, _, _, _ in G.ELIG_BY[(aid, 'complementary_block')]) else 'sweat_engine'   # Hybrid's complement slot lists no engines
        cands = [e for e in G.ranked(src, 'complementary_block', ctx, d, 'comp_steady', lambda e: e['role'] == 'engine' and e['impact'] != 'high' and e['id'] != 'jump_rope') if e['id'] not in ids and e['swap'] not in fams]
        cands.sort(key=lambda e: e['id'] not in ('treadmill_incline_walk', 'stationary_bike', 'row_erg', 'stair_climber', 'air_bike'))
        for e in cands[:1]:
            return G.mk_block('complementary_block', 'continuous', items_e=[e], duration_s=int(tgt * 60), rpe=[5, 6], comp_type='steady', unit_s=60, shape='steady')
    # engine primary -> small station circuit (3 stations); circuit primary -> short engine intervals on a different modality; hybrid -> none unless short
    def station_complement():
        roles = [G.R_REG('lower'), G.R_REG('upper'), ('core|carry', lambda e: e['role'] == 'core' or e['pat'] == 'carry')]
        if aid == 'sweat_hybrid': roles = [G.R_REG('upper'), ('core|carry', lambda e: e['role'] == 'core' or e['pat'] == 'carry'), ('any', lambda e: e['role'] != 'engine')]
        if aid == 'sweat_circuit': roles = [('any_a', lambda e: e['role'] != 'engine' and e['impact'] == 'low'), ('any_b', lambda e: e['role'] != 'engine' and e['impact'] == 'low'), ('core|carry', lambda e: e['role'] == 'core' or e['pat'] == 'carry')]
        try:
            items = None
            role_sets = (roles, roles[:2], [('any', lambda e: e['role'] != 'engine')] * 2) if room >= 3 else (roles[:2], [('any', lambda e: e['role'] != 'engine')] * 2)
            for rr_ in role_sets:
                try: items = G.pick_items(aid, 'complementary_block', ctx, d, rr_, ids, fams, 'comp', log=log); break
                except G.Fail: continue
            if not items: raise G.Fail('comp: composition')
            items = G.order_items(items, log, 'comp')
            doses = [G.station_dose(e, exp) for e in items]
            b = G.mk_block('complementary_block', 'circuit', items_e=items, doses=doses, rounds=3, round_rest=45 if exp != 'beginner' else 60, rpe=[6, 7], comp_type='fixed_circuit', shape='circuit')
            best = min(range(2, 5), key=lambda r: abs(block_minutes(dict(b, rounds=r), exp) - tgt)); b['rounds'] = best
            return b
        except G.Fail as f:
            log.append(dict(reason_code='complement_unavailable', detail=str(f))); return None
    if aid == 'sweat_hybrid': return build_closer(ctx, d, res, log, blocks, dur, exp)
    if aid == 'sweat_engine': return station_complement()
    # circuit primary: Bored (not Stressed / Low Energy) gets a couplet ladder when two rep-based items exist; otherwise short engine intervals
    if 'bored' in res['states'] and not ({'stressed', 'low_energy'} & set(res['states'])) and exp != 'beginner':
        roles = [('output_reps', lambda e: e['role'] == 'output' and e['metric'] == 'reps'), ('reps_item', lambda e: e['metric'] == 'reps' and e['lat'] == 'bilateral' and e['role'] != 'engine')]
        try:
            items = G.pick_items(aid, 'complementary_block', ctx, d, roles, ids, fams, 'comp_ladder')
            return G.mk_block('complementary_block', 'ladder', items_e=items, ladder=[10, 8, 6, 4, 2] if exp != 'advanced' else [12, 10, 8, 6, 4], rpe=[7, 8], comp_type='couplet_ladder', shape='ladder')
        except G.Fail: pass
    used_engine = {e['id'] for e in prim['items_e'] if e['role'] == 'engine'}
    W, R = (30, 30) if exp == 'beginner' else (40, 20)
    if 'stressed' in res['states'] or 'low_energy' in res['states']: W, R = 60, 60
    cands = [e for e in G.ranked(aid, 'complementary_block', ctx, d, 'comp_engine', lambda e: e['role'] == 'engine' and (e['eq'] not in MIN_BOUT or W >= 60) and e['id'] != 'treadmill_incline_walk' and e['id'] not in used_engine and not ('no_high_impact' in fl and e['impact'] != 'low')) if e['id'] not in ids and e['swap'] not in fams]
    for e in cands[:1]:
        n = max(4, min(10, int(tgt * 60 // (W + R))))
        return G.mk_block('complementary_block', 'intervals', items_e=[e], interval_target=dict(work=W, recovery=R, rounds=n), rpe=[7, 8] if 'low_energy' not in res['states'] else [6, 7], comp_type='engine_intervals', shape='intervals')
    # no second engine modality in this setup: a small low-impact station circuit keeps the session whole
    return station_complement() if room >= 2 else None


def build_finisher(aid, ctx, d, res, blocks, exp, seed, history):
    if res['fin_p'] <= 0 or exp == 'beginner': return None
    if u(seed, 'finisher') >= res['fin_p']: return None
    ids, fams = G.used_of(blocks)
    fl = res['flags']
    items = []
    pool = G.ranked(aid, 'optional_extra', ctx, d, 'finisher', lambda e: max_intent_ok(e) and e['eq'] not in MIN_BOUT and e['id'] not in ids and e['swap'] not in fams, prefer_low=prefer_fn(res, ctx))
    for e in pool:
        if any(x['swap'] == e['swap'] for x in items) or (items and e['fixed'] and items[0]['fixed']): continue
        items.append(e)
        if len(items) == 1: break
    if not items: return None
    W, R = (20, 40)
    return G.mk_block('optional_extra', 'finisher', items_e=items, interval_target=dict(work=W, recovery=R, rounds=6, alternate=False), rpe=[9, 9], shape='finisher')


# ================================================================== levers (applied to built blocks)
def apply_levers(blocks, levers, exp, log):
    prim = blocks[0]
    def targets(scope):
        if scope == 'primary': return [prim]
        if scope == 'secondary': return [b for b in blocks[1:] if b['structure'] != 'finisher']
        return [b for b in blocks if b['structure'] != 'finisher']
    for lv in levers:
        s, kind, scope = lv[0], lv[1], lv[2]; arg = lv[3] if len(lv) > 3 else None; changes = []
        for b in targets(scope):
            if kind == 'rpe':
                cap = 8 if exp == 'beginner' else 9; lo_cap = 4
                if b['structure'] == 'continuous': cap = min(cap, 7)
                if b.get('anchor') and exp != 'advanced': cap = min(cap, 8)     # a 3-5 round anchor block at RPE 9 is an advanced-only ask
                new = [max(lo_cap, min(cap, b['rpe'][0] + arg)), max(lo_cap, min(cap, b['rpe'][1] + arg))]
                if new != b['rpe']: changes.append(dict(block=b['slot'], **{'from': list(b['rpe']), 'to': new})); b['rpe'] = new
            elif kind == 'rpe_to_8':
                if b['structure'] != 'continuous' and b['rpe'][1] < 8:
                    new = [min(7, max(b['rpe'][0], 6)), 8]
                    changes.append(dict(block=b['slot'], **{'from': list(b['rpe']), 'to': new})); b['rpe'] = new
            elif kind == 'rpe_cap':
                new = [min(b['rpe'][0], arg), min(b['rpe'][1], arg)]
                if new != b['rpe']: changes.append(dict(block=b['slot'], **{'from': list(b['rpe']), 'to': new})); b['rpe'] = new
            elif kind in ('recovery_up', 'recovery_down'):
                f = 1 + arg if kind == 'recovery_up' else 1 - arg
                if b['structure'] in ('intervals', 'finisher') and b.get('interval_target'):
                    it = b['interval_target']; old = it['recovery']; it['recovery'] = int(max(15, round(old * f / 5.0) * 5))
                    if kind == 'recovery_up': it['recovery'] = min(it['recovery'], it['work'] if it.get('rotate') else 2 * it['work'])
                    if it['recovery'] != old: changes.append(dict(block=b['slot'], field='recovery', **{'from': old, 'to': it['recovery']}))
                elif b['structure'] == 'circuit':
                    old = b['round_rest']; b['round_rest'] = int(max(30, min(120, round(old * f / 15.0) * 15)))
                    if b['round_rest'] != old: changes.append(dict(block=b['slot'], field='round_rest', **{'from': old, 'to': b['round_rest']}))
                elif b['structure'] == 'pyramid':
                    it = b['interval_target']; old = it['recovery']; it['recovery'] = int(max(30, round(old * f / 15.0) * 15))
                    if it['recovery'] != old: changes.append(dict(block=b['slot'], field='recovery', **{'from': old, 'to': it['recovery']}))
            elif kind == 'units':
                before = _unit_desc(b)
                if add_unit(b, arg, exp): changes.append(dict(block=b['slot'], **{'from': before, 'to': _unit_desc(b)}))
            elif kind == 'bouts_longer':
                if b['structure'] == 'intervals' and not b['interval_target'].get('rotate') and b.get('engine_format') == 'short':
                    it = b['interval_target']; old = (it['work'], it['recovery'], it['rounds']); it['work'], it['recovery'] = 60, 45; it['rounds'] = max(4, int(round(it['rounds'] * 40 / 105.0 * 1.6)))
                    b['engine_format'] = 'controlled'; changes.append(dict(block=b['slot'], **{'from': f"{old[2]} x {old[0]}/{old[1]}", 'to': f"{it['rounds']} x 60/45"}))
                elif b['structure'] == 'intervals' and b['interval_target'].get('rotate'):
                    it = b['interval_target']; old = (it['work'], it['recovery'])
                    if it['work'] < 45: it['work'] = 45; it['recovery'] = 30; changes.append(dict(block=b['slot'], **{'from': f"{old[0]}/{old[1]}", 'to': '45/30'}))
            elif kind == 'fewer_stations':
                if b['structure'] in ('circuit', 'intervals') and not b.get('anchor') and len(b['items_e']) > 3 and 'doses' in b:
                    drivers = [e for e in b['items_e'] if e['role'] in ('engine', 'output')]
                    cand = [e for e in b['items_e'] if not (e in drivers and len(drivers) == 1)]
                    if cand:
                        drop = cand[-1]; k = b['items_e'].index(drop); b['items_e'].pop(k); b['doses'].pop(k); changes.append(dict(block=b['slot'], removed=drop['id']))
                elif b['structure'] == 'circuit' and b.get('anchor') and len(b['stations']) > 2:
                    drop = b['stations'][-1][0]; b['stations'] = b['stations'][:-1]; b['round_stations'] = [rs[:-1] for rs in b['round_stations']]; b['items_e'] = [x for x in b['items_e'] if x['id'] != drop['id']]
                    changes.append(dict(block=b['slot'], removed=drop['id']))
            elif kind == 'vary_intervals':
                if exp != 'beginner' and b['structure'] == 'intervals' and not b['interval_target'].get('rotate') and b.get('engine_format') in ('long_even', 'short'):
                    it = b['interval_target']; n = it['rounds']; W = it['work']
                    steps = [int(W * f) for f in ([0.75, 1.0, 1.25, 1.0, 0.75] if n >= 5 else [0.75, 1.0, 1.25, 1.0])][:n]
                    steps = [max(30, round(s / 15.0) * 15) for s in steps]
                    b['structure'] = 'pyramid'; b['interval_target'] = dict(steps=steps, recovery=it['recovery']); b['engine_format'] = 'pyramid'; b['shape'] = 'pyramid'
                    changes.append(dict(block=b['slot'], **{'from': f"{n} x {W} s", 'to': 'pyramid ' + '-'.join(map(str, steps))}))
        code = {'rpe': 'state_rpe', 'rpe_cap': 'state_rpe', 'rpe_to_8': 'state_rpe', 'recovery_up': 'state_recovery', 'recovery_down': 'state_recovery', 'units': 'state_volume', 'bouts_longer': 'state_bouts',
                'fewer_stations': 'state_stations', 'vary_intervals': 'state_structure'}[kind]
        log.append(dict(reason_code=code, state=s, scope=scope, arg=arg, changes=changes) if changes else dict(reason_code=code + '_no_effect', state=s, scope=scope, arg=arg))
    return blocks


def _unit_desc(b):
    s = b['structure']
    if s == 'continuous': return f"{b['duration_s'] // 60} min"
    if s in ('intervals', 'finisher', 'pyramid'): return f"{b['interval_target'].get('rounds', len(b['interval_target'].get('steps', [])))} rounds"
    if s == 'emom': return f"{b['minutes']} min"
    if s == 'circuit': return f"{len(b['round_stations']) if b.get('anchor') else b['rounds']} rounds"
    if s == 'ladder': return f"{len(b['ladder'])} rungs"
    return ''


def add_unit(b, sign, exp):
    s = b['structure']
    if s == 'continuous':
        nd = b['duration_s'] + sign * b.get('unit_s', 120)
        if nd < (300 if b.get('comp_type') == 'closer' else 600) or nd > (10 * 60 if b.get('comp_type') == 'closer' else 30 * 60): return False
        b['duration_s'] = nd; return True
    if s in ('intervals', 'finisher'):
        it = b['interval_target']; nr = it['rounds'] + sign
        if nr < 3 or nr > it.get('df_max', 16): return False
        it['rounds'] = nr; return True
    if s == 'pyramid': return False
    if s == 'emom':
        nr = b['rounds'] + sign
        if nr < 2 or nr > 8: return False
        b['rounds'] = nr; b['minutes'] = nr * len(b['items_e']); return True
    if s == 'circuit':
        if b.get('anchor'):
            rs = b['round_stations']; n = len(rs) + sign
            if n < 2 or n > 6: return False
            if sign > 0: rs.append(copy.deepcopy(rs[-1])); b.setdefault('anchor_doses', None)
            else: rs.pop()
            if b.get('anchor_doses'): b['anchor_doses'] = (b['anchor_doses'] + [b['anchor_doses'][-1]])[:len(rs)] if sign > 0 else b['anchor_doses'][:len(rs)]
            return True
        nr = b['rounds'] + sign
        if nr < 2 or nr > (5 if exp == 'beginner' else 7): return False
        b['rounds'] = nr; return True
    if s == 'ladder':
        if sign > 0:
            if b['ladder'][0] >= 16: return False
            b['ladder'] = [b['ladder'][0] + 2] + b['ladder']; return True
        if len(b['ladder']) <= 3: return False
        b['ladder'] = b['ladder'][:-1]; return True
    return False


# ================================================================== reconciliation (duration + workload budget)
def swap_impact_item(blocks, aid, ctx, d, log):
    """Replace one jump-pattern station in the primary block with a non-jump station of the same role (impact budget)."""
    for p in blocks:
        if p.get('anchor') or p['structure'] not in ('intervals', 'circuit'): continue
        drivers = [e for e in p['items_e'] if e['role'] in ('engine', 'output')]
        jumps = [e for e in p['items_e'] if e['pat'] == 'jump' and e['role'] != 'engine' and not (e in drivers and len(drivers) == 1)]
        if jumps: break
    else: return False
    e_old = jumps[-1]; k = p['items_e'].index(e_old)
    used_ids = {x['id'] for b in blocks for x in b['items_e']}; used_fams = {x['swap'] for b in blocks for x in b['items_e'] if x['id'] != e_old['id']}
    slot = 'primary_circuit' if aid == 'sweat_circuit' else 'complementary_block'
    for e in G.ranked(aid, slot, ctx, d, 'impact_swap', lambda e: e['pat'] != 'jump' and e['role'] != 'engine' and e['id'] not in used_ids and e['swap'] not in used_fams and e['impact'] == 'low'):
        others = [x for x in p['items_e'] if x['id'] != e_old['id']]
        if G.ok_add(e, others, set(), set(), []):
            p['items_e'][k] = e
            if 'doses' in p and p['structure'] != 'intervals': p['doses'][k] = G.station_dose(e, ctx['experience'])
            log.append(dict(reason_code='budget_repair', what='impact_item_swapped', **{'from': e_old['id'], 'to': e['id']})); return True
    return False


def shrink_rep_doses(blocks, log, loaded_only=True):
    """Loaded-rep budget: take 2 reps off every loaded rep-station (floor 8 bilateral / 6 per side) before removing rounds."""
    changed = False
    for b in blocks:
        if b['structure'] == 'emom': continue      # EMOM doses define its duty cycle; rounds come off instead
        pairs = []
        if b.get('doses'): pairs = list(zip(b['items_e'], b['doses']))
        if b.get('stations'): pairs = list(b['stations'])
        for e, dz in pairs:
            if not dz or dz.get('kind') != 'reps' or e['role'] == 'engine': continue
            if loaded_only and e['eq'] == 'bodyweight': continue
            floor = 6 if dz.get('per_side') else 8
            if dz['value'] - 2 >= floor: dz['value'] -= 2; changed = True
        if b.get('stations') and b.get('round_stations'):
            m = {e['id']: dz for e, dz in b['stations']}
            b['round_stations'] = [[(e, dict(m.get(e['id'], dz))) for e, dz in rs] for rs in b['round_stations']]
    if changed: log.append(dict(reason_code='budget_repair', what='rep_doses_-2'))
    return changed


def trim_stations_for_budget(blocks, log):
    """Distinct-station budget: drop the last complement station (keep >= 2), else remove the complement."""
    comp = next((b for b in blocks[1:] if b['slot'] == 'complementary_block'), None)
    if comp is None: return False
    if comp['structure'] == 'circuit' and not comp.get('anchor') and len(comp['items_e']) > 2:
        drop = comp['items_e'].pop(); comp['doses'].pop(); log.append(dict(reason_code='budget_repair', what='complement_station_dropped', removed=drop['id'])); return True
    blocks.remove(comp); log.append(dict(reason_code='budget_repair', what='complement_removed_stations')); return True


def grow_primary(blocks, aid, dur, exp, log):
    """+1 unit on the main block, with two bounded concessions when the budget objects: a Hybrid anchor bout comes down one step
    when the anchor cap is what blocks it (3 x 550 m beats 2 x 700 m), and a block at RPE 8+ comes down one notch when the hard-work
    budget is what blocks it (duration wins over a whole session at RPE 8). -> True when the block grew and the budget holds."""
    p = blocks[0]; snap = copy.deepcopy(p); notes = []
    if not add_unit(p, +1, exp): return False
    for _ in range(3):
        v = budget_violations(budget(blocks, aid, dur, exp), exp, dur, aid)
        if not v: log.extend(notes); return True
        if p.get('anchor') and any(m.startswith(('anchor share', 'engine share', 'engine time')) for m in v):
            ad = p['anchor_dose']; new = _shrink(ad)
            if new != ad:
                p['anchor_dose'] = new; p['anchor_doses'] = [_shrink(x) for x in p['anchor_doses']] if p.get('anchor_doses') else None
                notes.append(dict(reason_code='budget_repair', what='anchor_dose_with_extra_round', **{'from': ad, 'to': new})); continue
        if any(m.startswith('hard') for m in v) and p['rpe'][0] >= 8 and p['structure'] != 'finisher':
            old = list(p['rpe']); p['rpe'] = [p['rpe'][0] - 1, max(p['rpe'][0] - 1, p['rpe'][1] - 1)]
            notes.append(dict(reason_code='budget_repair', what='rpe_-1_with_extra_round', block=p['slot'], **{'from': old, 'to': list(p['rpe'])})); continue
        break
    p.clear(); p.update(snap); return False


def reconcile(blocks, aid, dur, exp, log, budget_only=False, ctx=None, d=None):
    lo, hi = BAND[dur]; guard = 0
    def tm(): return total_minutes(blocks, aid, dur, exp)
    # workload budget first: never fix a clock problem by adding work the budget forbids
    for _ in range(6):
        B = budget(blocks, aid, dur, exp); v = budget_violations(B, exp, dur, aid)
        if not v: break
        fixed = False
        for msg in v:
            if msg.startswith('anchor share') or msg.startswith('engine time') or msg.startswith('engine share'):
                p = blocks[0]
                if p.get('anchor'):
                    # shrink the anchor bout before touching stations: Hybrid must actually be hybrid
                    ad = p['anchor_dose']; new = _shrink(ad)
                    if new != ad: p['anchor_dose'] = new; p['anchor_doses'] = [_shrink(x) for x in p['anchor_doses']] if p.get('anchor_doses') else None; fixed = True; log.append(dict(reason_code='budget_repair', what='anchor_dose', **{'from': ad, 'to': new})); break
                if aid == 'sweat_engine' and add_unit(p, -1, exp): fixed = True; log.append(dict(reason_code='budget_repair', what='engine_units_-1')); break
                if len(blocks) > 1 and blocks[1].get('comp_type') in ('engine_intervals', 'steady') and add_unit(blocks[1], -1, exp): fixed = True; log.append(dict(reason_code='budget_repair', what='complement_-1')); break
            if msg.startswith('hard'):
                for b in reversed(blocks):
                    if b['structure'] == 'finisher': blocks.remove(b); fixed = True; log.append(dict(reason_code='budget_repair', what='finisher_dropped')); break
                    if b['rpe'][0] >= 8: b['rpe'] = [b['rpe'][0] - 1, max(b['rpe'][0] - 1, b['rpe'][1] - 1)]; fixed = True; log.append(dict(reason_code='budget_repair', what='rpe_-1', block=b['slot'])); break
                if fixed: break
            if msg.startswith('impact') and ctx is not None and swap_impact_item(blocks, aid, ctx, d, log): fixed = True; break
            if msg.startswith('loaded reps') and shrink_rep_doses(blocks, log): fixed = True; break
            if 'distinct stations' in msg and trim_stations_for_budget(blocks, log): fixed = True; break
            if msg.startswith('loaded reps') or msg.startswith('impact') or msg.startswith('all-out'):
                for b in reversed(blocks):
                    if b['structure'] == 'finisher': blocks.remove(b); fixed = True; log.append(dict(reason_code='budget_repair', what='finisher_dropped')); break
                    if add_unit(b, -1, exp): fixed = True; log.append(dict(reason_code='budget_repair', what='units_-1', block=b['slot'])); break
                if fixed: break
            if msg.startswith(('anchor share',)) and not fixed:
                break
        if not fixed: log.append(dict(reason_code='budget_open', detail=v)); break
    if budget_only: return blocks
    while tm() < lo and guard < 10:
        guard += 1; snap = copy.deepcopy(blocks)
        p = blocks[0]; plo, phi = PRIMARY_MIN[(aid, dur)]
        if block_minutes(p, exp) < phi and grow_primary(blocks, aid, dur, exp, log):
            if block_minutes(p, exp) > phi + 3: blocks[:] = snap; log.append(dict(reason_code='duration_backfill_declined', detail='one more unit would overshoot the main-block blueprint'))
            else: log.append(dict(reason_code='duration_backfill', detail='primary +1 unit')); continue
        if len(blocks) > 1 and blocks[1]['structure'] != 'finisher' and block_minutes(blocks[1], exp) < COMP_MIN[dur][1] and add_unit(blocks[1], +1, exp):
            if budget_violations(budget(blocks, aid, dur, exp), exp, dur, aid): blocks[:] = snap
            else: log.append(dict(reason_code='duration_backfill', detail='complement +1 unit')); continue
        break
    if tm() < lo: log.append(dict(reason_code='duration_underfill_accepted', est=round(tm(), 1), window=[lo, hi]))
    guard = 0
    while tm() > hi and guard < 10:
        guard += 1
        if len(blocks) > 1 and blocks[-1]['structure'] == 'finisher': blocks.pop(); log.append(dict(reason_code='duration_trim', detail='finisher removed')); continue
        if len(blocks) > 1 and add_unit(blocks[1], -1, exp): log.append(dict(reason_code='duration_trim', detail='complement -1 unit')); continue
        if add_unit(blocks[0], -1, exp): log.append(dict(reason_code='duration_trim', detail='primary -1 unit')); continue
        if len(blocks) > 1: blocks.pop(1); log.append(dict(reason_code='duration_trim', detail='complement removed')); continue
        break
    return blocks


def _shrink(dz):
    k, v = dz['kind'], dz['value']
    if k == 'distance': return dict(dz, value=max(150, int(round((v * 0.8) / 50.0) * 50)))
    if k == 'calories': return dict(dz, value=max(6, int(round(v * 0.8 / 2.0) * 2)))
    if k == 'time': return dict(dz, value=max(45, int(round(v * 0.8 / 15.0) * 15)))
    return dz


# ================================================================== assembly
def finalize(blocks, exp):
    for b in blocks:
        if exp == 'beginner':
            b['rpe'] = [min(8, b['rpe'][0]), min(8, b['rpe'][1])]
            it = b.get('interval_target')
            if b['structure'] == 'intervals' and it and it.get('recovery', 0) < it.get('work', 0): it['recovery'] = it['work']
        b['progression_basis'] = {'continuous': 'duration / pace at the same RPE', 'intervals': 'interval output (meters, calories, pace) and completion',
                                  'pyramid': 'output held across steps', 'emom': 'minutes completed on time, then modest density', 'circuit': 'rounds completed / round time',
                                  'ladder': 'completion time', 'finisher': 'output held'}[b['structure']]
        b['item_progression'] = {e['id']: ('output' if e['role'] in ('engine', 'output') else 'reuse_load') for e in b['items_e']}
        b['_est_min'] = round(block_minutes(b, exp), 1)
    G.ensure_duty(blocks[0], exp, [])
    hard = [b for b in blocks if b['rpe'][0] >= 8]
    if len(hard) > 2:
        for b in blocks:
            if b['slot'] == 'complementary_block' and b['rpe'][0] >= 8: b['rpe'] = [7, max(7, b['rpe'][1] - 1)]
    return blocks


def seed_of(ctx, aid, swap): return f"{ctx['user']}|{ctx['date']}|{aid}|{swap}"


def select_archetype(ctx, res, history, seed, log):
    """MOOD's Pick: goal rotation, least recently used first, State affinity as a soft weight, feasibility as a hard filter."""
    rot = list(GOAL_ROT.get(ctx.get('goal'), GOAL_ROT['stay_consistent']))
    w = {a: 1.0 for a in rot}
    for i, a in enumerate(rot): w[a] *= (1.3 - 0.15 * i)
    last = [h['archetype'] for h in history][-3:]
    for i, a in enumerate(reversed(last)):
        if a in w: w[a] *= (0.2, 0.5, 0.8)[i]
    aff = {'low_energy': dict(sweat_engine=1.6, sweat_circuit=1.1, sweat_hybrid=0.6), 'stressed': dict(sweat_engine=1.8, sweat_circuit=1.1, sweat_hybrid=0.7),
           'irritated': dict(sweat_hybrid=1.5, sweat_circuit=1.2, sweat_engine=0.9), 'amped': dict(sweat_hybrid=1.3, sweat_circuit=1.1), 'bored': dict(sweat_hybrid=1.3, sweat_circuit=1.1, sweat_engine=0.8)}
    for s in res['states']:
        for a, m in aff.get(s, {}).items(): w[a] *= m
    if ctx['experience'] == 'beginner': w['sweat_hybrid'] *= 0.6
    order = sorted(w, key=lambda a: -(u(seed, 'arch', a) ** (1.0 / max(1e-6, w[a]))))
    log.append(dict(reason_code='archetype_selected', weights={a: round(x, 2) for a, x in w.items()}, order=order))
    return order


# ================================================================== primary block completeness (stimulus, not clock) + secondary policy
SUFFICIENT = {'beginner': 14, 'intermediate': 18, 'advanced': 21}      # stimulus units at 60 minutes; 30 minutes scaled by 0.6
SUBSTANTIAL = {'beginner': 22, 'intermediate': 27, 'advanced': 32}
RPE_FACTOR = {5: 0.7, 6: 0.85, 7: 1.0, 8: 1.3, 9: 1.6}


def completeness(blocks, aid, dur, exp, res):
    """Would a good trainer call the finished main block a complete conditioning stimulus for this person?
    Lean, interpretable: active minutes weighted by effort and density, plus resistance volume and systemic demand.
    -> dict(label in {insufficient, sufficient, substantial}, score, features)."""
    p = blocks[0]; T = block_time(p, exp); B1 = budget([p], aid, dur, exp)
    active = T['active'] / 60.0; rpe = p.get('rpe') or [7, 7]; mid = (rpe[0] + rpe[1]) / 2.0
    f_rpe = RPE_FACTOR[int(round(min(9, max(5, mid))))]
    duty = T['active'] / max(1.0, T['active'] + T['recovery'])
    f_duty = 1.1 if duty >= 0.85 else (0.9 if (duty <= 0.6 and p['structure'] not in ('intervals',)) else 1.0)   # short work/rest rotations are dense by design
    score = active * f_rpe * f_duty + B1['loaded_reps'] / 40.0 + B1['bodyweight_reps'] / 60.0 + 1.5 * len(B1['demanding']) + 0.5 * len(B1['high_impact_items'])
    scale = 1.0 if dur == 60 else 0.6
    lo_t = SUFFICIENT[exp] * scale; hi_t = SUBSTANTIAL[exp] * scale
    if 'low_energy' in res['states']: lo_t *= 0.9; hi_t *= 0.9         # sustainable work counts sooner on a low day
    label = 'substantial' if score >= hi_t else ('sufficient' if score >= lo_t else 'insufficient')
    return dict(label=label, score=round(score, 1), thresholds=[round(lo_t, 1), round(hi_t, 1)],
                features=dict(active_min=round(active, 1), rpe=list(rpe), duty=round(duty, 2), loaded_reps=B1['loaded_reps'], bodyweight_reps=B1['bodyweight_reps'],
                              engine_min=B1['engine_min'], hard_min=B1['hard_min'], stations=B1['stations'], demanding=len(B1['demanding']), rounds=_unit_desc(p), impact=B1['impact_contacts']))


def prep_fill(blocks, aid, dur, exp, log):
    """Preparation and downshift appropriate to the workout, never filler: setup time on a station block (1 to 3 min, only when the block has
    stations to load), warm-up up to 10 min, downshift up to 8 min. Stops at the window's lower edge or at those caps."""
    lo, hi = BAND[dur]; p = blocks[0]
    def tm(): return total_minutes(blocks, aid, dur, exp)
    if tm() >= lo: return
    has_stations = bool(p.get('stations')) or (p['structure'] in ('circuit', 'intervals', 'emom') and len(p['items_e']) >= 3 and any(e['eq'] != 'bodyweight' for e in p['items_e']))
    if has_stations and not p.get('setup_s'):
        setup = int(min(180, max(60, round((lo - tm()) * 60 / 60.0) * 60)))
        p['setup_s'] = setup; log.append(dict(reason_code='duration_backfill', detail=f'{setup // 60} min technique and setup before round 1'))
    gap = lo - tm()
    if gap > 0:
        room = 10 - WU[(aid, dur)] - p.get('wu_extra_min', 0)
        wu = int(min(room, max(0, round(gap))))
        if wu > 0: p['wu_extra_min'] = p.get('wu_extra_min', 0) + wu; log.append(dict(reason_code='duration_backfill', detail=f'warm-up +{wu} min (movement preparation)'))
    gap = lo - tm()
    if gap > 0:
        room = 8 - DS[dur] - p.get('ds_extra_min', 0)
        ds = int(min(room, max(0, round(gap))))
        if ds > 0: p['ds_extra_min'] = p.get('ds_extra_min', 0) + ds; log.append(dict(reason_code='duration_backfill', detail=f'downshift +{ds} min'))


def assemble(blocks, aid, ctx, d, res, history, seed, dur, exp, log):
    """Duration is an available window, not a work quota. After the main block is built and levered:
    insufficient -> extend the main block within its blueprint, then one modest complement;
    sufficient   -> main only is valid; at most ONE secondary element (complement OR finisher) and only with a programming purpose;
    substantial  -> no complement; a finisher only for an intentionally selected State expression on a main block that is not already hard.
    Preparation and downshift fill what remains, within their caps. Never main + complement + finisher."""
    lo, hi = BAND[dur]; p = blocks[0]; states = set(res['states'])
    def tm(): return total_minutes(blocks, aid, dur, exp)
    if aid == 'sweat_hybrid':
        hybrid_fill(blocks, aid, dur, exp, log, ctx, d, res)
        C_ = completeness(blocks, aid, dur, exp, res); res['completeness'] = C_
        log.append(dict(reason_code='primary_block_completeness', **C_, closer=next((b.get('purpose') for b in blocks if b.get('comp_type') == 'closer'), None)))
        reconcile(blocks, aid, dur, exp, log, budget_only=True, ctx=ctx, d=d)
        while tm() > hi and (add_unit(blocks[-1], -1, exp) if len(blocks) > 1 else add_unit(blocks[0], -1, exp)): log.append(dict(reason_code='duration_trim', detail='one unit off'))
        if tm() < lo: log.append(dict(reason_code='duration_underfill_accepted', est=round(tm(), 1), window=[lo, hi], completeness=C_['label']))
        return
    C_ = completeness(blocks, aid, dur, exp, res)
    # 1. insufficient: the main block grows first (within its blueprint), then the label is re-read
    guard = 0
    while C_['label'] == 'insufficient' and guard < 4 and block_minutes(p, exp) < PRIMARY_MIN[(aid, dur)][1] and tm() < lo:
        guard += 1; snap = copy.deepcopy(blocks)
        if not grow_primary(blocks, aid, dur, exp, log) or block_minutes(p, exp) > PRIMARY_MIN[(aid, dur)][1] + 3 or tm() > hi: blocks[:] = snap; p = blocks[0]; break
        log.append(dict(reason_code='duration_backfill', detail='primary +1 unit (stimulus below sufficient)')); C_ = completeness(blocks, aid, dur, exp, res)
    hard_main = p['rpe'][0] >= 8 or p['rpe'][1] >= 9
    secondary = None; purpose = None
    # 2. complement: insufficient -> yes (modest); sufficient -> only with a purpose; substantial -> never
    if C_['label'] == 'insufficient':
        purpose = 'main block alone is below a sufficient stimulus'
    elif C_['label'] == 'sufficient' and not hard_main:
        # harder or denser work earns a shorter session: only the lower half of the sufficient band gets a general-purpose complement
        low_sufficient = C_['score'] < (C_['thresholds'][0] + C_['thresholds'][1]) / 2.0
        eng_only = aid == 'sweat_engine'
        if eng_only and 'low_energy' in states: purpose = 'sustainable extra minutes on a second modality (Low Energy)'
        elif eng_only and 'bored' in states: purpose = 'a change of stimulus after the engine block (Bored)'
        elif eng_only and 'stressed' in states: purpose = None            # one simple block is the point on a stressed day
        elif eng_only and low_sufficient and p['rpe'][1] <= 7: purpose = 'a little muscular conditioning beside a steady engine session'
        elif 'stressed' in states: purpose = None
        elif 'low_energy' in states and p['rpe'][1] >= 7: purpose = 'easy flush after the harder work (Low Energy)'
        elif aid == 'sweat_circuit' and 'bored' in states: purpose = 'a change of stimulus after the circuit (Bored)'
        elif aid == 'sweat_circuit' and low_sufficient and C_['features']['engine_min'] < 6 and p['rpe'][1] <= 8: purpose = 'a short engine piece to round out a station-led circuit'
    if purpose and dur == 60:
        res_c = dict(res, flags=set(res['flags']) | {'comp_steady'}) if ('second modality' in purpose or 'flush' in purpose) else res
        c = build_complement(aid, ctx, d, res_c, log, blocks, dur, exp, history, seed)
        if c:
            c['purpose'] = purpose
            if C_['label'] == 'sufficient' or hard_main or 'low_energy' in states: _modest(c, exp)     # beside a sufficient, hard or low-energy main block the complement stays small
            blocks.append(c); secondary = 'complement'
            if tm() > hi or budget_violations(budget(blocks, aid, dur, exp), exp, dur, aid):
                if not (add_unit(c, -1, exp) and tm() <= hi and not budget_violations(budget(blocks, aid, dur, exp), exp, dur, aid)): blocks.remove(c); secondary = None; log.append(dict(reason_code='complement_unavailable', detail='budget or window'))
            if secondary: log.append(dict(reason_code='complement_selected', purpose=purpose, minutes=round(block_minutes(c, exp), 1), completeness=C_['label']))
    elif purpose: log.append(dict(reason_code='complement_skipped', detail='30-minute session: the main block is the workout', completeness=C_['label']))
    # 3. finisher: never on top of a complement, never after a hard main block, never when substantial unless an expression asked for it explicitly
    if secondary is None and (dur == 60) and res['fin_p'] > 0 and not hard_main:
        intentional = res['expressions'].get('irritated') == 'direct_finisher'
        allowed = C_['label'] == 'sufficient' or (C_['label'] == 'substantial' and intentional) or C_['label'] == 'insufficient'
        if allowed:
            f = build_finisher(aid, ctx, d, res if intentional else dict(res, fin_p=res['fin_p'] * (0.5 if C_['label'] == 'sufficient' else 1.0)), blocks, exp, seed, history)
            if f:
                blocks.append(f)
                if tm() > hi or budget_violations(budget(blocks, aid, dur, exp), exp, dur, aid): blocks.pop(); log.append(dict(reason_code='finisher_dropped_budget'))
                else: secondary = 'finisher'; log.append(dict(reason_code='finisher_selected', exercise=f['items_e'][0]['id'], state_driven=True, states=list(res['states']), completeness=C_['label']))
    elif res['fin_p'] > 0 and dur == 60: log.append(dict(reason_code='finisher_skipped', detail='hard main block' if hard_main else ('one secondary element maximum' if secondary else 'main block already substantial'), completeness=C_['label']))
    reconcile(blocks, aid, dur, exp, log, budget_only=True, ctx=ctx, d=d)
    while tm() > hi and (add_unit(blocks[-1], -1, exp) if len(blocks) > 1 else add_unit(blocks[0], -1, exp)): log.append(dict(reason_code='duration_trim', detail='one unit off'))
    prep_fill(blocks, aid, dur, exp, log)
    C_ = completeness(blocks, aid, dur, exp, res); res['completeness'] = C_
    log.append(dict(reason_code='primary_block_completeness', **C_, secondary=secondary, purpose=purpose if secondary == 'complement' else None))
    if tm() < lo: log.append(dict(reason_code='duration_underfill_accepted', est=round(tm(), 1), window=[lo, hi], completeness=C_['label']))


def _modest(c, exp):
    """A complement beside a sufficient main block stays modest: 2 rounds / a few minutes, controlled effort."""
    if c['structure'] == 'circuit' and not c.get('anchor'):
        c['rounds'] = min(c['rounds'], 2); c['rpe'] = [6, 7]
        if len(c['items_e']) > 3: c['items_e'] = c['items_e'][:3]; c['doses'] = c['doses'][:3]
    elif c['structure'] == 'intervals' and c.get('interval_target'):
        c['interval_target']['rounds'] = min(c['interval_target']['rounds'], 6); c['rpe'] = [min(7, c['rpe'][0]), min(8, c['rpe'][1])]
    elif c['structure'] == 'continuous':
        c['duration_s'] = min(c['duration_s'], 8 * 60)
    elif c['structure'] == 'ladder':
        pass                                            # a couplet ladder is already a 4 to 6 minute piece


def build_once(aid, ctx, res, history, seed, dur, exp, log, swap=0):
    d = rank_dials(res, exp); goal = ctx.get('goal'); blocks = []
    if aid == 'sweat_engine':
        shape, sw = engine_shape(res, ctx, seed, history, exp, goal)
        e = pick_engine_item(ctx, d, res, history, seed, shape=shape)
        if e is None and shape in LONG_BOUT_SHAPES:
            e = pick_engine_item(ctx, d, res, history, seed, shape='short_intervals')
            if e is not None: log.append(dict(reason_code='structure_fallback', detail=f'{shape}: no long-bout engine in this setup, short intervals on {e["id"]} instead')); shape = 'short_intervals'
        if e is None: raise Fail('no engine modality available')
        blocks.append(build_engine_primary(e, shape, exp, dur, res, ctx))
    elif aid == 'sweat_circuit':
        items = compose_circuit(ctx, d, res, log)
        shape, sw = circuit_shape(res, ctx, seed, history, exp, goal, items)
        blocks.append(build_circuit_primary(items, shape, exp, dur, res, ctx, log))
    else:
        shape, sw = hybrid_shape(res, ctx, seed, history, exp, goal, dur)
        blocks.append(compose_hybrid(ctx, d, res, log, shape, exp, dur, seed, history))
    log.append(dict(reason_code='shape_selected', archetype=aid, shape=shape, weights={k: round(v, 2) for k, v in sw.items()}))
    apply_levers(blocks, res['levers'], exp, log)
    G.ensure_duty(blocks[0], exp, log)
    reconcile(blocks, aid, dur, exp, log, budget_only=True, ctx=ctx, d=d)
    assemble(blocks, aid, ctx, d, res, history, seed, dur, exp, log)
    finalize(blocks, exp)
    if total_minutes(blocks, aid, dur, exp) >= BAND[dur][0]: log[:] = [l for l in log if l.get('reason_code') != 'duration_underfill_accepted']
    return blocks


# ================================================================== State Satisfaction (vs a no-State reference) + coherence
def snapshot(blocks, exp, aid, dur):
    p = blocks[0]
    return dict(shape=p.get('shape'), structure=p['structure'], rpe=list(p['rpe']), engine=[e['id'] for e in p['items_e'] if e['role'] == 'engine'],
                items=[e['id'] for b in blocks for e in b['items_e']], units=_unit_desc(p), recovery=(p.get('interval_target') or {}).get('recovery', p.get('round_rest')),
                n_stations=len([e for e in p['items_e'] if e['role'] != 'engine']), finisher=any(b['structure'] == 'finisher' for b in blocks),
                impact=sum(1 for b in blocks for e in b['items_e'] if e['impact'] != 'low'), budget=budget(blocks, aid, dur, exp), blocks=len(blocks), _blocks=blocks)


def realized_for_state(s, res, log, snap, ref):
    """Meaningful, realized adaptations attributable to State s in the FINISHED session (compared with the no-State build when available)."""
    out = []
    ev = [l for l in log if isinstance(l, dict) and l.get('state') == s and l.get('changes') and l.get('reason_code', '').startswith('state_') and l['reason_code'] != 'state_coherence_repair']
    cur = snap.get('_blocks') or []
    def current(block_slot):
        return next((b for b in cur if b['slot'] == block_slot), None)
    for l in ev:
        rc = l['reason_code']
        if rc == 'state_rpe':
            def _rpe_ok(c):
                b = current(c['block'])
                if not b: return False
                up = c['to'][1] >= c['from'][1]
                return (b['rpe'][1] >= c['to'][1]) if up else (b['rpe'][1] <= c['to'][1])
            l = dict(l, changes=[c for c in l['changes'] if _rpe_ok(c)])
            if not l['changes']: continue
        if rc == 'state_recovery':
            def _cur_rec(c):
                b = current(c['block'])
                if not b: return None
                return (b.get('interval_target') or {}).get('recovery') if c.get('field') == 'recovery' else b.get('round_rest')
            l = dict(l, changes=[c for c in l['changes'] if _cur_rec(c) == c['to']])
            if not l['changes']: continue
        if rc == 'state_volume':
            l = dict(l, changes=[c for c in l['changes'] if current(c['block']) is not None and _unit_desc(current(c['block'])) == c['to']])
            if not l['changes']: continue
        if rc == 'state_rpe': out.append(dict(kind='rpe', detail=[f"{c['block'].split('_')[-1]} RPE {c['from'][0]}–{c['from'][1]} → {c['to'][0]}–{c['to'][1]}" for c in l['changes']]))
        elif rc == 'state_recovery': out.append(dict(kind='recovery', detail=[f"{c.get('field', 'rest')} {c['from']} → {c['to']} s" for c in l['changes']]))
        elif rc == 'state_volume': out.append(dict(kind='volume', detail=[f"{c['from']} → {c['to']}" for c in l['changes']]))
        elif rc == 'state_bouts': out.append(dict(kind='bouts', detail=[f"{c['from']} → {c['to']}" for c in l['changes']]))
        elif rc == 'state_stations': out.append(dict(kind='stations', detail=[f"{EX[c['removed']]['name']} left out" for c in l['changes']]))
        elif rc == 'state_structure': out.append(dict(kind='structure', detail=[f"{c['from']} → {c['to']}" for c in l['changes']]))
    prim = cur[0] if cur else None
    for l in log:
        if not (isinstance(l, dict) and l.get('reason_code') == 'state_coherence_repair' and l.get('state') == s and l.get('changes')): continue
        rp = l.get('repair')
        if rp == 'primary_rpe_+1' and not (prim and prim['rpe'][1] >= 8): continue          # undone by the budget afterwards
        if rp == 'rpe_cap_7' and not (prim and prim['rpe'][1] <= 7): continue
        if rp == 'drop_finisher' and any(b['structure'] == 'finisher' for b in cur): continue
        if rp == 'add_finisher' and not any(b['structure'] == 'finisher' for b in cur): continue
        out.append(dict(kind='coherence_repair', detail=list(l['changes'])))
    e = LAST_RESORT[s] if res['expressions'].get(s) == 'last_resort' else EXPRESSIONS[s].get(res['expressions'].get(s), {})
    if ref:
        if snap['shape'] != ref['shape'] and e.get('shape'): out.append(dict(kind='shape', detail=[f"{SHAPE_NAME.get(snap['shape'], snap['shape'])} instead of {SHAPE_NAME.get(ref['shape'], ref['shape'])}"]))
        if snap['engine'] and ref['engine'] and snap['engine'] != ref['engine'] and (s in ('bored', 'irritated', 'low_energy', 'stressed')): out.append(dict(kind='modality', detail=[f"{EX[snap['engine'][0]]['name']} instead of {EX[ref['engine'][0]]['name']}"]))
        new = [i for i in snap['items'] if i not in ref['items'] and EX[i]['role'] != 'engine']
        if new and (e.get('flags') or s == 'bored'): out.append(dict(kind='exercises', detail=[f"{EX[i]['name']} (vs no-State build)" for i in new]))
        if snap['finisher'] and not ref['finisher'] and e.get('fin', 0) > 0: out.append(dict(kind='finisher', detail=['finisher added']))
        if s == 'low_energy' and snap['impact'] < ref['impact']: out.append(dict(kind='impact', detail=[f"impact items {ref['impact']} → {snap['impact']}"]))
        # a calm State whose base session is already steady, single-modality continuous work at RPE <= 7 has nothing to change: that alignment is the adaptation
        if not out and s in ('stressed', 'low_energy') and snap['structure'] == 'continuous' and snap['rpe'][1] <= 7 and snap['blocks'] == 1:
            out.append(dict(kind='aligned', detail=[f"one continuous {EX[snap['engine'][0]]['name'] if snap['engine'] else 'engine'} effort at RPE {snap['rpe'][0]}–{snap['rpe'][1]} already matches this State; nothing added, nothing hurried"]))
    return out


# whole-session coherence: State-specific predicates over the budget + snapshot
def coherence_check(s, snap, res, exp, dur, states):
    B = snap['budget']; L = limits(exp, dur); fails = []
    if s == 'low_energy':
        if B['hard_share'] > 0.15: fails.append(f"hard (RPE 8+) share {B['hard_share']:.0%}")
        if max((r[1] for r in B['rpe']), default=0) > 8: fails.append('a block above RPE 8')
        if B['very_hard_blocks'] or B['finisher']: fails.append('all-out work or a finisher')
        if B['impact_contacts'] > 0 and snap['impact'] > 1: fails.append(f"{snap['impact']} impact items")
        if B['transitions'] > L['transitions']: fails.append(f"{B['transitions']} transitions (busy)")
        if B['loaded_reps'] > int(L['loaded_reps'] * 0.75): fails.append(f"loaded reps {B['loaded_reps']}")
        if B['engine_min'] > L['engine_min'] * 0.95 and B['hard_share'] > 0: fails.append('large engine volume at hard effort')
        if len(B['demanding']) > 1: fails.append(f"{len(B['demanding'])} systemically demanding stations")
    elif s == 'stressed':
        if snap['structure'] in ('emom', 'ladder', 'pyramid') or snap['shape'] in ('ladder_hybrid',): fails.append(f"{snap['structure']} structure (changing scheme / countdown feel)")
        if snap['n_stations'] > 4: fails.append(f"{snap['n_stations']} stations in the main block")
        if B['transitions'] > L['transitions']: fails.append(f"{B['transitions']} transitions")
        if B['very_hard_blocks'] or B['finisher']: fails.append('all-out work or a finisher')
        if max((r[1] for r in B['rpe'][:1]), default=0) > 8 and 'amped' not in states: fails.append('main block above RPE 8')
        if B['duty'] > 0.92 and snap['structure'] not in ('continuous',): fails.append(f"duty cycle {B['duty']:.0%} (no breathing room)")
    elif s == 'irritated':
        direct = snap['budget']['hard_share'] >= 0.25 or B['finisher'] or any(EX[i]['forceful'] or EX[i]['mod'] in ('sled', 'rope', 'throw') or EX[i]['pat'] == 'carry' for i in snap['items'] if EX[i]['role'] != 'engine') or snap['structure'] == 'intervals' \
            or (exp == 'beginner' and snap['rpe'][1] >= 8) or snap['rpe'][0] >= 8
        if not direct: fails.append('nothing direct or forceful to push against')
        if snap['structure'] in ('emom', 'ladder') or snap['shape'] == 'ladder_hybrid': fails.append(f"{snap['structure']} (fiddly sequencing)")
        if max((EX[i]['cx'] for i in snap['items']), default=0) >= 3: fails.append('a complexity-3 movement under fatigue')
    elif s == 'amped':
        if 'low_energy' in states: return []
        productive = B['hard_share'] >= 0.3 or B['finisher'] or snap['rpe'][1] >= 8 or (B['duty'] >= 0.75 and snap['structure'] in ('intervals', 'emom', 'circuit')) or (snap['structure'] == 'continuous' and snap['rpe'][1] >= 7 and B['engine_min'] >= 18)
        if not productive: fails.append('readiness not used (no harder block, density or finisher)')
        if B['hard_share'] > 0.7 and B['blocks'] > 1 and B['hard_min'] > L['hard_min'] * 0.85: fails.append(f"hard share {B['hard_share']:.0%} (everything all-out, {B['hard_min']} min at RPE 8+)")
        if B['very_hard_blocks'] > 1: fails.append('more than one all-out block')
    elif s == 'bored':
        score = 0
        if snap['shape'] in ('pyramid', 'ladder', 'emom', 'ladder_hybrid', 'split_anchor', 'timed', 'anchor_triplet'): score += 1
        score += min(2, sum(1 for i in snap['items'] if EX[i]['nov'] >= 3))
        score += (len({EX[i]['eq'] for i in snap['items']}) >= 4)
        if B['finisher']: score += 1
        ref = res.get('_ref')
        if ref and snap['engine'] and ref.get('engine') and snap['engine'] != ref['engine']: score += 1      # new modality vs the no-State build
        if any(b['structure'] in ('ladder', 'emom', 'pyramid') for b in snap.get('_blocks', [])[1:]): score += 1
        need = 1 if ('stressed' in states or 'low_energy' in states or exp == 'beginner') else 2
        if score < need: fails.append(f"experiential difference score {score} below {need}")
    return fails


REPAIRS = {
    'low_energy': ['drop_finisher', 'rpe_cap_7', 'drop_high_impact_item', 'drop_demanding_station', 'fewer_stations', 'units_-1'],
    'stressed': ['drop_finisher', 'rpe_cap_7', 'to_fixed_rounds', 'fewer_stations', 'recovery_up'],
    'irritated': ['primary_rpe_+1', 'drop_soft_shape'],
    'amped': ['primary_rpe_+1', 'recovery_down', 'drop_finisher', 'secondary_rpe_7'],
    'bored': ['add_finisher'],
}
REPAIR_FOR = {'drop_finisher': ('finisher', 'all-out'), 'rpe_cap_7': ('RPE', 'hard'), 'drop_high_impact_item': ('impact',), 'drop_demanding_station': ('demanding',), 'fewer_stations': ('stations', 'transitions', 'demanding'),
              'units_-1': ('engine volume', 'loaded reps', 'transitions'), 'to_fixed_rounds': ('structure', 'fiddly', 'countdown'), 'recovery_up': ('duty',), 'primary_rpe_+1': ('readiness', 'nothing direct'),
              'drop_soft_shape': ('fiddly', 'complexity'), 'recovery_down': ('readiness',), 'add_finisher': ('experiential',), 'secondary_rpe_7': ('all-out',)}


def repair(code, s, blocks, exp, dur, aid, ctx, d, res, log, seed, history):
    p = blocks[0]; changed = []
    if code == 'drop_finisher':
        if blocks[-1]['structure'] == 'finisher': blocks.pop(); changed.append('finisher off')
    elif code == 'rpe_cap_7':
        for b in blocks:
            if b['structure'] != 'finisher' and b['rpe'][1] > 7: changed.append(f"{b['slot']} RPE → ≤7"); b['rpe'] = [min(7, b['rpe'][0]), 7]
    elif code == 'drop_high_impact_item':
        for b in blocks:
            if b['structure'] == 'circuit' and not b.get('anchor'):
                drivers = [e for e in b['items_e'] if e['role'] in ('engine', 'output')]
                hi = [e for e in b['items_e'] if e['impact'] != 'low' and e['role'] != 'engine' and not (e in drivers and len(drivers) == 1)]
                if hi and len(b['items_e']) > 3:
                    e = hi[-1]; k = b['items_e'].index(e); b['items_e'].pop(k); b['doses'].pop(k); changed.append(f"{e['name']} left out (impact)"); break
    elif code == 'drop_demanding_station':
        def _swap_in(b, e_old, slot):
            used = {x['id'] for bb in blocks for x in bb['items_e']}; fams = {x['swap'] for bb in blocks for x in bb['items_e'] if x['id'] != e_old['id']}
            for e in G.ranked(aid, slot, ctx, d, 'le_demanding_swap', lambda e: e['sysd'] <= 3 and e['role'] == e_old['role'] and e['role'] != 'engine' and e['impact'] == 'low' and e['id'] not in used and e['swap'] not in fams):
                if G.ok_add(e, [x for x in b['items_e'] if x['id'] != e_old['id']], set(), set(), []): return e
            return None
        for b in blocks:
            if b['structure'] != 'circuit': continue
            if b.get('anchor') and len(b['stations']) <= 2 or (not b.get('anchor') and len(b['items_e']) <= 3):
                dem = [e for e, *_ in (b['stations'] if b.get('anchor') else [(x,) for x in b['items_e']]) if e['sysd'] >= 4 and e['role'] != 'engine']
                if not dem: continue
                e_old = dem[-1]; e_new = _swap_in(b, e_old, 'primary_hybrid_block.station' if b.get('anchor') else b['slot'])
                if e_new is None: continue
                if b.get('anchor'):
                    dz = hybrid_station_dose(e_new, exp, 45)
                    b['stations'] = [((e_new, dz) if x['id'] == e_old['id'] else (x, z)) for x, z in b['stations']]
                    b['round_stations'] = [[((e_new, dz) if x['id'] == e_old['id'] else (x, z)) for x, z in rs] for rs in b['round_stations']]
                else:
                    k = b['items_e'].index(e_old); b['doses'][k] = G.station_dose(e_new, exp)
                b['items_e'] = [e_new if x['id'] == e_old['id'] else x for x in b['items_e']]
                changed.append(f"{e_new['name']} instead of {e_old['name']} (systemic cost)"); break
            if b.get('anchor'):
                dem = [e for e, dz in b['stations'] if e['sysd'] >= 4]
                if dem and len(b['stations']) > 2:
                    e = dem[-1]; b['stations'] = [(x, dz) for x, dz in b['stations'] if x['id'] != e['id']]
                    b['round_stations'] = [[(x, dz) for x, dz in rs if x['id'] != e['id']] for rs in b['round_stations']]
                    b['items_e'] = [x for x in b['items_e'] if x['id'] != e['id']]; changed.append(f"{e['name']} left out (systemic cost)"); break
            else:
                drivers = [e for e in b['items_e'] if e['role'] in ('engine', 'output')]
                dem = [e for e in b['items_e'] if e['sysd'] >= 4 and e['role'] != 'engine' and not (e in drivers and len(drivers) == 1)]
                if dem and len(b['items_e']) > 3:
                    e = dem[-1]; k = b['items_e'].index(e); b['items_e'].pop(k); b['doses'].pop(k); changed.append(f"{e['name']} left out (systemic cost)"); break
    elif code == 'fewer_stations':
        before = len(p['items_e'])
        apply_levers(blocks, [(s, 'fewer_stations', 'primary')], exp, [])
        if len(p['items_e']) < before: changed.append(f"{before - len(p['items_e'])} station left out")
    elif code == 'units_-1':
        if add_unit(p, -1, exp): changed.append(f"primary → {_unit_desc(p)}")
    elif code == 'to_fixed_rounds':
        if p['structure'] in ('emom', 'ladder') and aid == 'sweat_circuit':
            items = p['items_e']; nb = build_circuit_primary(items, 'rounds', exp, dur, res, ctx, log); finalize([nb], exp); blocks[0] = nb; changed.append('main block → fixed rounds')
        elif p['structure'] == 'pyramid' and aid == 'sweat_engine':
            e = p['items_e'][0]; nb = build_engine_primary(e, 'long_intervals', exp, dur, res, ctx); finalize([nb], exp); blocks[0] = nb; changed.append('main block → long even intervals')
        elif p.get('anchor') and p.get('anchor_doses'):
            p['anchor_doses'] = None; p['round_stations'] = [list(p['stations']) for _ in p['round_stations']]; p['shape'] = 'anchor_couplet' if len(p['stations']) <= 2 else 'anchor_triplet'; changed.append('same anchor dose every round')
    elif code == 'secondary_rpe_7':
        for b in blocks[1:]:
            if b['structure'] != 'finisher' and b['rpe'][0] >= 8: b['rpe'] = [7, min(8, b['rpe'][1])]; changed.append(f"{b['slot']} RPE → 7–{b['rpe'][1]}")
    elif code == 'recovery_up':
        apply_levers(blocks, [(s, 'recovery_up', 'all', 0.25)], exp, []); changed.append('recovery +25%')
    elif code == 'primary_rpe_+1':
        cap = 8 if exp == 'beginner' else 9
        if p['structure'] == 'continuous': cap = 7
        if p['rpe'][1] < cap: p['rpe'] = [min(cap, p['rpe'][0] + 1), min(cap, p['rpe'][1] + 1)]; changed.append(f"main block RPE → {p['rpe'][0]}–{p['rpe'][1]}")
    elif code == 'drop_soft_shape':
        if p['structure'] in ('emom', 'ladder') and aid == 'sweat_circuit':
            nb = build_circuit_primary(p['items_e'], 'rounds', exp, dur, res, ctx, log); finalize([nb], exp); blocks[0] = nb; changed.append('main block → straight rounds')
    elif code == 'recovery_down':
        apply_levers(blocks, [(s, 'recovery_down', 'primary', 0.25)], exp, []); changed.append('primary recovery −25%')
    elif code == 'add_finisher':
        if exp != 'beginner' and blocks[-1]['structure'] != 'finisher' and dur == 60 and len(blocks) == 1 and completeness(blocks, aid, dur, exp, res)['label'] != 'substantial' and p['rpe'][0] < 8:
            f = build_finisher(aid, ctx, d, dict(res, fin_p=1.0), blocks, exp, seed + '#coh', history)
            if f: blocks.append(f); finalize(blocks, exp); changed.append(f"finisher {f['items_e'][0]['name']}")
    if changed: log.append(dict(reason_code='state_coherence_repair', state=s, repair=code, changes=changed))
    return bool(changed)


def refill(blocks, aid, dur, exp, log, ctx, d, res, history, seed, states=(), verdicts=None):
    """After coherence repairs shortened the session: re-read completeness; only an insufficient main block gets more work
    (one unit on the complement, or on the main block when no volume repair touched it). Otherwise preparation and downshift fill what they can."""
    lo, hi = BAND[dur]
    def tm(): return total_minutes(blocks, aid, dur, exp)
    def ok_now():
        if tm() > hi or budget_violations(budget(blocks, aid, dur, exp), exp, dur, aid): return False
        if verdicts:
            snap = snapshot(blocks, exp, aid, dur)
            return all(not coherence_check(s, snap, res, exp, dur, states) for s in states if verdicts.get(s, {}).get('passed'))
        return True
    if tm() >= lo: return
    C_ = completeness(blocks, aid, dur, exp, res)
    p0 = blocks[0]; hard_main = p0['rpe'][0] >= 8 or p0['rpe'][1] >= 9
    if C_['label'] == 'insufficient' and not hard_main and 'low_energy' not in states:      # beside a hard or low-energy main block the secondary stays modest
        vol_repaired = any(l.get('reason_code') == 'state_coherence_repair' and l.get('repair') in ('units_-1',) for l in log if isinstance(l, dict))
        comp = next((b for b in blocks[1:] if b['slot'] == 'complementary_block'), None)
        guard = 0
        while tm() < lo and guard < 4 and completeness(blocks, aid, dur, exp, res)['label'] == 'insufficient':
            guard += 1; snap_blocks = copy.deepcopy(blocks); moved = False
            if comp is not None and add_unit(comp, +1, exp):
                if ok_now(): log.append(dict(reason_code='duration_backfill', detail='complement +1 unit (stimulus below sufficient, after State repairs)')); moved = True
                else: blocks[:] = snap_blocks; comp = next((b for b in blocks[1:] if b['slot'] == 'complementary_block'), None)
            if not moved and not vol_repaired and grow_primary(blocks, aid, dur, exp, log):
                if ok_now(): log.append(dict(reason_code='duration_backfill', detail='primary +1 unit (stimulus below sufficient, after State repairs)')); moved = True
                else: blocks[:] = snap_blocks; comp = next((b for b in blocks[1:] if b['slot'] == 'complementary_block'), None)
            if not moved: break
    prep_fill(blocks, aid, dur, exp, log)
    finalize(blocks, exp)
    C_ = completeness(blocks, aid, dur, exp, res); res['completeness'] = C_
    for l in log:
        if isinstance(l, dict) and l.get('reason_code') == 'primary_block_completeness': l.update({k: v for k, v in C_.items()})
    if tm() < lo: log.append(dict(reason_code='duration_underfill_accepted', est=round(tm(), 1), window=[lo, hi], after='state_repairs', completeness=C_['label']))


def coherence_pass(blocks, states, res, exp, dur, aid, ctx, d, log, seed, history):
    verdicts = {}; repairs = []
    snap = snapshot(blocks, exp, aid, dur)
    for s in states:
        fails = coherence_check(s, snap, res, exp, dur, states); before = list(fails)
        for code in REPAIRS.get(s, []):
            if not fails: break
            if not any(k in f for f in fails for k in REPAIR_FOR.get(code, ())): continue
            if repair(code, s, blocks, exp, dur, aid, ctx, d, res, log, seed, history):
                reconcile(blocks, aid, dur, exp, log, budget_only=True, ctx=ctx, d=d); finalize(blocks, exp); repairs.append((s, code))
                snap = snapshot(blocks, exp, aid, dur); fails = coherence_check(s, snap, res, exp, dur, states)
        verdicts[s] = dict(before=before, after=fails, passed=not fails)
    # final pass: a later State's repair may have undone an earlier verdict; re-check everything and allow one more repair round
    snap = snapshot(blocks, exp, aid, dur)
    for s in states:
        fails = coherence_check(s, snap, res, exp, dur, states)
        if fails and verdicts[s]['passed']:
            for code in REPAIRS.get(s, []):
                if not fails: break
                if not any(k in f for f in fails for k in REPAIR_FOR.get(code, ())): continue
                if repair(code, s, blocks, exp, dur, aid, ctx, d, res, log, seed, history):
                    reconcile(blocks, aid, dur, exp, log, budget_only=True, ctx=ctx, d=d); finalize(blocks, exp); repairs.append((s, code))
                    snap = snapshot(blocks, exp, aid, dur); fails = coherence_check(s, snap, res, exp, dur, states)
        verdicts[s] = dict(before=verdicts[s]['before'], after=fails, passed=not fails)
    log.append(dict(reason_code='state_coherence', states=list(states), verdicts=verdicts, repairs=repairs, budget=snap['budget']))
    return verdicts


# ================================================================== top level
def make_ctx(nctx, history):
    tgt = None
    if nctx['target_mode'] == 'explicit': tgt = list(nctx['target_muscles'])
    elif nctx['target_mode'] == 'full_body': tgt = 'full_body'
    inp = dict(duration=nctx['duration'], experience=nctx['experience'], states=[s for s in nctx['states'] if s in STATES], preset=nctx['equipment'],
               sore=sorted(nctx['sore']), target=tgt, goal=nctx['goal'], history=history, swap=0, displayed_chain=[], user=nctx['user'], date=nctx['date'])
    ctx = G.make_ctx(inp)
    if nctx['target_mode'] != 'explicit': ctx['sore_eff'] = ctx['sore_all']; ctx['sore_override'] = set()    # only muscles the user NAMED override soreness
    return ctx


def feasible(aid, ctx, res, exp):
    d = rank_dials(res, exp); return G.feasible(aid, ctx, d)


def generate(nctx, history, swap=0, forced_arch=None):
    """-> dict(w=<block workout for render/validator>, log, contract, gate, coherence, budget, ...). Raises Fail / G.Fail."""
    ctx = make_ctx(nctx, history); dur = ctx['duration']; exp = ctx['experience']; states = list(ctx['states']); log = []
    mode = 'explicit' if (nctx.get('archetype') or nctx['target_mode'] != 'moods_pick') else 'pick'
    if ctx['sore_override']: log.append(dict(reason_code='sore_override_by_explicit_target', detail=sorted(ctx['sore_override'])))
    if ctx['sore_eff']: log.append(dict(reason_code='sore_exclusion', detail=sorted(ctx['sore_eff'])))
    if nctx['target_mode'] == 'explicit' and not nctx.get('archetype'):
        order = ['sweat_circuit']; log.append(dict(reason_code='target_routed_circuit', detail=sorted(ctx['target_set'])))
    elif nctx.get('archetype'): order = [nctx['archetype']]
    else: order = None
    seed0 = f"{ctx['user']}|{ctx['date']}|sweat|{swap}"
    res0 = resolve(states, exp, dur, seed0, history, None); log += res0['log']
    if order is None: order = select_archetype(ctx, res0, history, seed0, log)
    last_err = None
    for aid in order:
        if not feasible(aid, ctx, res0, exp):
            if ctx['sore_eff'] and feasible(aid, dict(ctx, sore_eff=set()), res0, exp):
                log.append(dict(reason_code='sore_reroute', detail=f'{aid} depends on the sore region', **({} if mode == 'pick' else {'user_selected': True})))
                if mode != 'pick': raise G.Fail('sore_terminal:' + aid)
                continue
            log.append(dict(reason_code='archetype_skipped_equipment', detail=aid)); continue
        seed = seed_of(ctx, aid, swap)
        try:
            out = _gated_build(aid, _swap_ctx(aid, ctx, history, dur, exp, states, swap, mode), history, seed, dur, exp, states, log, swap, mode)
            out['rerouted'] = any(l.get('reason_code') == 'sore_reroute' for l in log) or (order[0] != aid and bool(ctx['sore_eff']))
            out['requested_archetype'] = order[0] if out['rerouted'] else aid
            return out
        except G.Fail as f:
            last_err = f
            if ctx['sore_eff'] and mode != 'pick': raise G.Fail('sore_terminal:' + str(f))
            log.append(dict(reason_code='archetype_failed', detail=f'{aid}: {f}')); continue
    raise G.Fail(str(last_err) if last_err else 'no feasible Sweat archetype')


def _displayed(w):
    b = w['blocks']
    return dict(families=[e['swap'] for x in b for e in x['items_e']], exercises=[e['id'] for x in b for e in x['items_e']],
                engine_mode=w.get('engine_mode'), engine_format=w.get('engine_format'), primary_structure=b[0]['structure'] if b else None,
                shape=w.get('shape'), engine=next((e['id'] for e in b[0]['items_e'] if e['role'] == 'engine'), None) if b else None)


def _swap_ctx(aid, ctx, history, dur, exp, states, swap, mode):
    """Different Workout (V3 fix, founder pass 3). The frozen ranker already has a swap chain (rank 5: families / exercises shown
    earlier in this chain, sweat_gen.swap_pen) and swap-aware engine-mode / structure alternation, but the V3 context always passed
    swap=0 and an empty chain, so a pinned Sweat type rebuilt the same session. Replay this chain's earlier versions of the same
    archetype deterministically (as Strength's Custom Target / Core do) and hand them to the frozen ranker. Nothing else changes:
    hard filters, verdicts, State predicates, budgets and validation are untouched."""
    if swap <= 0: return ctx
    chain = []
    for k in range(swap):
        c = dict(ctx, swap=k, displayed_chain=list(chain))
        try: chain.append(_displayed(_gated_build(aid, c, history, seed_of(ctx, aid, k), dur, exp, states, [], k, mode)['w']))
        except (G.Fail, Fail): continue
    return dict(ctx, swap=swap, displayed_chain=chain)


def _gated_build(aid, ctx, history, seed, dur, exp, states, log, swap, mode):
    # reference (no State) build for attribution
    ref = None
    if states:
        try:
            r0 = resolve([], exp, dur, seed, history, None); L0 = []
            b0 = build_once(aid, ctx, r0, history, seed, dur, exp, L0, swap); ref = snapshot(b0, exp, aid, dur)
        except (G.Fail, Fail): ref = None
    tried = {s: [] for s in states}; forced = {}; gate_log = []; best = None
    for attempt in range(1 + 3 * max(1, len(states))):
        res = resolve(states, exp, dur, seed, history, forced); L = list(res['log'])
        blocks = build_once(aid, ctx, res, history, seed, dur, exp, L, swap)
        snap = snapshot(blocks, exp, aid, dur)
        realized = {s: realized_for_state(s, res, L, snap, ref) for s in states}
        for s in states:
            gate_log.append(dict(reason_code='state_gate', state=s, attempt=attempt, expression=res['expressions'].get(s), realized=[x['kind'] for x in realized[s]], satisfied=bool(realized[s]),
                                 no_ops=[l['reason_code'] for l in L if isinstance(l, dict) and l.get('state') == s and l.get('reason_code', '').endswith('_no_effect')]))
        best = dict(res=res, blocks=blocks, log=L, realized=realized, snap=snap)
        unsatisfied = [s for s in states if not realized[s]]
        if not unsatisfied: break
        s = unsatisfied[0]; tried[s].append(res['expressions'].get(s)); nxt = next_expression(s, tried[s])
        if nxt is None:
            yielded = any(l.get('reason_code') == 'state_conflict_resolved' and l.get('dropped') and l['dropped'][0] == s for l in L)
            gate_log.append(dict(reason_code='state_gate_yielded' if yielded else 'state_gate_exhausted', state=s, tried=list(tried[s]))); break
        forced[s] = nxt; gate_log.append(dict(reason_code='state_gate_fallback', state=s, **{'from': tried[s][-1], 'to': nxt}))
    res = best['res']; blocks = best['blocks']; L = best['log'] + gate_log
    d = rank_dials(res, exp); verdicts = {}
    if states:
        res['_ref'] = ref
        verdicts = coherence_pass(blocks, states, res, exp, dur, aid, ctx, d, L, seed, history)
        if total_minutes(blocks, aid, dur, exp) < BAND[dur][0]:
            L[:] = [l for l in L if l.get('reason_code') != 'duration_underfill_accepted']
            refill(blocks, aid, dur, exp, L, ctx, d, res, history, seed, states, verdicts)
        snap = snapshot(blocks, exp, aid, dur)
        best['realized'] = {s: realized_for_state(s, res, L, snap, ref) for s in states}
    B = budget(blocks, aid, dur, exp)
    w = dict(direction='sweat', archetype_id=aid, duration=dur, states=states, experience=exp, goal_row=ctx['goal_row'], target=ctx.get('target'), preset=ctx.get('preset'),
             outcome='VALID BUILD', dials=d, adjustments=log + L, blocks=blocks, warm_up_min=WU[(aid, dur)] + blocks[0].get('wu_extra_min', 0), downshift_min=DS[dur] + blocks[0].get('ds_extra_min', 0),
             est_minutes=round(total_minutes(blocks, aid, dur, exp), 1), conditioning_minutes=round(sum(block_minutes(b, exp) for b in blocks), 1),
             engine_mode=blocks[0].get('engine_mode'), engine_format=blocks[0].get('engine_format'), shape=blocks[0].get('shape'), _ctx=ctx, budget=B)
    return dict(w=w, res=res, realized=best['realized'], coherence=verdicts, budget=B, log=log + L, seed=seed, mode=mode, ref=ref)


def history_record(w, res):
    b = w['blocks']; ex = [e['id'] for x in b for e in x['items_e']]
    return dict(direction='sweat', archetype=w['archetype_id'], engine_mode=w.get('engine_mode'), engine_format=w.get('engine_format'), shape=w.get('shape'),
                engine=next((e['id'] for x in b for e in x['items_e'] if e['role'] == 'engine'), None), primary_structure=b[0]['structure'] if b else None,
                comp_type=next((x.get('comp_type') for x in b if x['slot'] == 'complementary_block'), None),
                finisher=next((e['id'] for x in b if x['structure'] == 'finisher' for e in x['items_e']), None),
                exercises=ex, families=[EX[i]['swap'] for i in ex], expressions=dict(res['expressions']), stations=[e['id'] for e in b[0]['items_e'] if e['role'] != 'engine'])
