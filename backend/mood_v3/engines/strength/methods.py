"""Set / execution methods for Strength (pre-freeze pass): a small, independent layer attached to one prescription row.

A method is a programming tool first. Level, goal, structural variant, history and State change its PROBABILITY and which
methods are on the table; compatibility rules decide which rows may carry it. At most one method per session (two for an
advanced lifter who is Bored). Never a State signature: every State can produce sessions with no method at all.
"""
from __future__ import annotations
from .variants import weighted_pick, u

LOADABLE = {'barbell', 'trap_bar', 'dumbbells', 'smith_machine', 'plate_loaded_machine', 'selectorized_machine'}
MACHINE_CABLE = {'selectorized_machine', 'plate_loaded_machine', 'cable', 'smith_machine'}
PRESS_SQUAT_HINGE = {'squat', 'horizontal_push', 'vertical_push', 'hinge'}
LV = {'beginner': 0, 'intermediate': 1, 'advanced': 2}

METHODS = {
    'pause': dict(label='paused reps', text='Pause 2 s at the hardest point of every rep, then drive out of it', extra_set_s=6, fatigue='low', min_level=1,
                  roles=('primary_compound', 'secondary_compound')),
    'slow_eccentric': dict(label='3 s eccentric', text='Take 3 s to lower every rep, then lift at normal speed', extra_set_s=10, fatigue='low', min_level=0,
                           roles=('secondary_compound', 'accessory')),
    'one_and_half': dict(label='1.5 reps', text='Full rep, half rep from the stretched position, back to the top: that is one rep', extra_set_s=10, fatigue='moderate', min_level=1,
                         roles=('accessory', 'secondary_compound')),
    'cluster': dict(label='cluster sets (2+2+2)', text='Break each set into three mini-sets of 2 with 20 s rest between them; load a little heavier than a straight set', extra_set_s=40, fatigue='moderate', min_level=2,
                    roles=('primary_compound',)),
    'drop_set': dict(label='drop set on the final set', text='On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve', extra_set_s=30, fatigue='high', min_level=1,
                     roles=('accessory', 'secondary_compound'), final_only=True),
    'rest_pause': dict(label='rest-pause on the final set', text='On the last set, hit the reps, rest 15 s, then add as many clean reps as you can', extra_set_s=25, fatigue='high', min_level=1,
                       roles=('accessory',), final_only=True),
}
# State affinity: multiplier on session probability and per-method weights. Values < 1 make a method rarer, 0 removes it.
STATE_P = {'bored': 2.0, 'amped': 1.3, 'irritated': 0.8, 'low_energy': 0.4, 'stressed': 0.3}
STATE_W = {
    'bored':      dict(pause=1.5, slow_eccentric=1.0, one_and_half=1.5, cluster=1.0, drop_set=1.5, rest_pause=1.2),
    'amped':      dict(pause=0.8, slow_eccentric=0.3, one_and_half=0.6, cluster=1.8, drop_set=1.2, rest_pause=1.3),
    'irritated':  dict(pause=0.6, slow_eccentric=0.2, one_and_half=0.3, cluster=1.0, drop_set=0.5, rest_pause=1.0),
    'low_energy': dict(pause=0.3, slow_eccentric=1.5, one_and_half=0.4, cluster=0.0, drop_set=0.0, rest_pause=0.0),
    'stressed':   dict(pause=0.8, slow_eccentric=1.5, one_and_half=0.2, cluster=0.0, drop_set=0.0, rest_pause=0.0),
}
GOAL_W = {
    'build_strength': dict(pause=1.5, cluster=1.8, slow_eccentric=0.6, one_and_half=0.5, drop_set=0.4, rest_pause=0.5),
    'build_muscle': dict(drop_set=1.5, rest_pause=1.4, one_and_half=1.3, slow_eccentric=1.1, pause=0.8, cluster=0.5),
    'improve_athleticism': dict(pause=1.3, cluster=1.2, slow_eccentric=0.7, drop_set=0.5),
    'lose_weight_conditioning': dict(drop_set=1.3, rest_pause=1.2, cluster=0.5),
    'feel_better_reduce_stress': dict(slow_eccentric=1.3, pause=1.1, drop_set=0.5, rest_pause=0.4),
}
LEVEL_P = {'beginner': 0.15, 'intermediate': 0.45, 'advanced': 0.65}
LEVEL_W = {'beginner': dict(slow_eccentric=1.0, pause=0.0, one_and_half=0.0, cluster=0.0, drop_set=0.0, rest_pause=0.0),
           'intermediate': dict(cluster=0.0),
           'advanced': dict(cluster=1.3, pause=1.2)}


def compatible(mid, row, e, level, variant):
    m = METHODS[mid]
    if row.get('kind') != 'reps' or row.get('why') or row.get('tempo') or row.get('scheme') or row.get('method'): return False
    if LV[level] < m['min_level'] or row['cls'] not in m['roles']: return False
    if row['sets'] < 2 or e['pat'] == 'carry': return False
    if mid == 'pause':
        return e['cls'] == 'compound' and e['pat'] in PRESS_SQUAT_HINGE and e['eq'] in LOADABLE and e['cx'] <= 3 and not e['explosive']
    if mid == 'slow_eccentric':
        if e['explosive'] or e['pm0'] == 'core' or (row['cls'] == 'secondary_compound' and e['eq'] == 'bodyweight'): return False
        if level == 'beginner':   # beginners: controlled eccentrics live on machines, cables and stable accessories, never on a loaded hinge / squat / press
            return e['eq'] in MACHINE_CABLE | {'dumbbells'} and e['pat'] not in PRESS_SQUAT_HINGE and (e['cls'] == 'isolation' or e['sup'] != 'unsupported')
        return True
    if mid == 'one_and_half':
        return e['eq'] in MACHINE_CABLE | {'dumbbells'} and e['pm0'] != 'core' and (e['cls'] == 'isolation' or (e['sup'] != 'unsupported' and e['eq'] in MACHINE_CABLE))
    if mid == 'cluster':
        return e['cls'] == 'compound' and e['eq'] in LOADABLE and e['pat'] in PRESS_SQUAT_HINGE and e['cx'] <= 3 and variant in ('heavy_primary', 'traditional', 'top_backoff') and not e['explosive']
    if mid == 'drop_set':
        return e['eq'] in MACHINE_CABLE | {'dumbbells'} and e['pm0'] != 'core' and (e['cls'] == 'isolation' or e['sup'] == 'supported') and (e['eq'] != 'dumbbells' or e['cls'] == 'isolation')
    if mid == 'rest_pause':
        nums = [int(x) for x in __import__('re').findall(r'\d+', str(row['reps']))]
        if not nums or min(nums) < 10: return False
        return e['cls'] == 'isolation' and (e['sup'] != 'unsupported' or e['eq'] in MACHINE_CABLE)
    return False


def choose(rows, EX, level, goal, states, variant, history_methods, seed, force=False, finisher_planned=False):
    """-> list of (method_id, slot, attributed_state or None). Deterministic."""
    p = LEVEL_P[level]
    for s in states: p *= STATE_P.get(s, 1.0)
    if goal in ('build_muscle', 'build_strength'): p *= 1.15
    if variant == 'efficient': p *= 0.5
    if finisher_planned and 'bored' not in states: p *= 0.4          # do not stack a finisher and an intensity method on the same day
    n_max = 2 if (level == 'advanced' and 'bored' in states) else 1
    out = []; used_rows = set(); tried = 0
    while len(out) < n_max and tried < 2:
        tried += 1
        if not force and u(seed, 'method_p', tried) > min(0.95, p): break
        weights = {}
        for mid in METHODS:
            w = 1.0
            for s in states: w *= STATE_W.get(s, {}).get(mid, 1.0)
            w *= GOAL_W.get(goal, {}).get(mid, 1.0) * LEVEL_W.get(level, {}).get(mid, 1.0)
            if history_methods:
                if history_methods[-1] == mid: w *= 0.3
                elif len(history_methods) > 1 and history_methods[-2] == mid: w *= 0.6
            cands = [r for r in rows if r['slot'] not in used_rows and compatible(mid, r, EX[r['eid']], level, variant)]
            if w > 0 and cands: weights[mid] = w
        if not weights: break
        mid = weighted_pick(weights, seed, 'method', tried)
        cands = [r for r in rows if r['slot'] not in used_rows and compatible(mid, r, EX[r['eid']], level, variant)]
        # primary-role methods prefer the primary; accessory methods prefer the highest-priority eligible accessory, then seed
        cands.sort(key=lambda r: (0 if r['cls'] == 'primary_compound' else 1, r['prio'], u(seed, 'method_row', mid, r['slot'])))
        r = cands[0]
        att = max([s for s in states if STATE_W.get(s, {}).get(mid, 1.0) > 1.0], key=lambda s: STATE_W[s][mid], default=None)
        out.append((mid, r['slot'], att)); used_rows.add(r['slot'])
    return out


def apply(rows, picks, log):
    for mid, slot, att in picks:
        r = next(x for x in rows if x['slot'] == slot); m = METHODS[mid]
        r['method'] = dict(id=mid, label=m['label'], text=m['text'], final_only=m.get('final_only', False))
        log.append(dict(reason_code='set_method', method=mid, slot=slot, exercise=r['eid'], state=att, label=m['label']))
    return rows


def extra_seconds(row):
    m = row.get('method')
    if not m: return 0
    mm = METHODS[m['id']]
    return mm['extra_set_s'] * (1 if mm.get('final_only') else row['sets'])
