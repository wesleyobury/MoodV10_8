"""Minimum viable, conservative progression (WA PROGRESSION + OUTPUT; V3 load policy).

Rules that hold everywhere:
  * Only exact-exercise history is used. MOOD never shows a weight it has not seen on that exact exercise.
  * No history for an exercise -> no progression object (the UI renders nothing).
Per Direction (Direction firewall preserved):
  Strength (and Athletic Performance Support, which WA says progresses like Strength):
      every logged set hit the prescribed reps at the same working load and today's rep target is unchanged
      -> suggest the smallest practical load increment; otherwise hold the load. Low Energy today -> hold ("see how it moves").
  Athletic explosive exposures: show the last load only, never push it (quality-first: add load only if every rep was fast).
  Sweat: resistance loads are reused (SC5), output items show last output; no numeric progression is invented.
Richer progression (RIR capture, rep progression inside the band, state-aware up / down suggestions, pace targets) is post-launch.
"""
from __future__ import annotations
import re

LOWER_MUSCLES = {'quads', 'hamstrings', 'glutes', 'calves', 'hip_adductors', 'hip_abductors'}
LOADED_ATHLETIC = {'olympic', 'explosive_lift', 'loaded_jump', 'upper_power', 'rotational_power'}

def _int(x):
    m = re.search(r'\d+', str(x or '')); return int(m.group(0)) if m else None

def increment(equipment, primary_muscles, unit):
    lower = bool(set(primary_muscles) & LOWER_MUSCLES)
    kg = unit == 'kg'
    if equipment == 'dumbbells': return 2 if kg else 5
    if equipment == 'kettlebell': return 4 if kg else 8
    if lower and equipment in ('barbell', 'trap_bar', 'plate_loaded_machine', 'smith_machine', 'landmine'): return 5 if kg else 10
    return 2.5 if kg else 5

def latest_log(exercise_id, perf_history):
    """perf_history: completed workouts oldest -> newest, each dict(completed_at, entries={exercise_id: dict(sets=[...], prescribed_reps, prescribed_sets)})."""
    for rec in reversed(perf_history):
        e = (rec.get('entries') or {}).get(exercise_id)
        if e and e.get('sets'): return rec, e
    return None, None

def _fmt_load(v, unit): return f"{('%g' % v)} {unit}"

def for_item(direction, item, perf_history, states, *, athletic_quality=None):
    ex = item['exercise']; rx = item['prescription']
    rec, log = latest_log(ex['id'], perf_history)
    if not log: return None
    sets = log['sets']; loaded = [s for s in sets if s.get('load') not in (None, '', 0)]
    date = rec.get('completed_at')
    if direction == 'sweat':
        if loaded:
            L = max(s['load'] for s in loaded); unit = loaded[0].get('unit', 'kg')
            return dict(reference=dict(load=L, unit=unit, date=date), suggestion=None, text=f"Same load as last time: {_fmt_load(L, unit)}.")
        outs = [s for s in sets if any(s.get(k) for k in ('calories', 'distance_m', 'reps'))]
        if outs:
            s = outs[-1]; k = 'calories' if s.get('calories') else ('distance_m' if s.get('distance_m') else 'reps')
            unit = {'calories': 'cal', 'distance_m': 'm', 'reps': 'reps'}[k]
            return dict(reference={k: s[k], 'date': date}, suggestion=None, text=f"Last time: {s[k]} {unit}. Match it or beat it at the same effort.")
        return None
    if direction == 'athletic' and athletic_quality is not None and item.get('role') != 'ps':
        if athletic_quality in LOADED_ATHLETIC and loaded:
            L = max(s['load'] for s in loaded); unit = loaded[0].get('unit', 'kg')
            return dict(reference=dict(load=L, unit=unit, date=date), suggestion=None,
                        text=f"Last time: {_fmt_load(L, unit)}. Go up only if every rep stays fast.")
        return None
    # Strength rule (Strength items and Athletic Performance Support)
    if rx.get('kind') != 'reps': return None
    today = _int(rx.get('reps'))
    if not loaded:
        reps = [s.get('reps') for s in sets if s.get('reps')]
        return dict(reference=dict(reps=reps, date=date), suggestion=None, text='Last time: ' + ', '.join(map(str, reps)) + ' reps.') if reps else None
    L = max(s['load'] for s in loaded); unit = loaded[0].get('unit', 'kg'); at_L = [s for s in loaded if s['load'] == L]
    reps_txt = ', '.join(str(s.get('reps')) for s in at_L)
    ref = dict(load=L, unit=unit, reps=[s.get('reps') for s in at_L], date=date)
    p_reps = _int(log.get('prescribed_reps')); p_sets = log.get('prescribed_sets') or len(at_L)
    if today is None or p_reps is None or today != p_reps:
        return dict(reference=ref, suggestion=None, text=f"Last time: {_fmt_load(L, unit)} × {reps_txt}.")
    hit = len(at_L) >= p_sets and all((s.get('reps') or 0) >= p_reps for s in at_L)
    if 'low_energy' in states:
        return dict(reference=ref, suggestion=dict(load=L, unit=unit, reps=today, action='hold'),
                    text=f"Last time: {_fmt_load(L, unit)} × {reps_txt}. Start at {_fmt_load(L, unit)} and see how it moves.")
    if hit:
        nl = round(L + increment(ex['equipment'], ex['primary_muscles'], unit), 2)
        return dict(reference=ref, suggestion=dict(load=nl, unit=unit, reps=today, action='increase'),
                    text=f"You hit every rep at {_fmt_load(L, unit)} last time. Try {_fmt_load(nl, unit)} today.")
    return dict(reference=ref, suggestion=dict(load=L, unit=unit, reps=today, action='hold'),
                text=f"Last time: {_fmt_load(L, unit)} × {reps_txt}. Stay at {_fmt_load(L, unit)} and own every rep.")

def attach(direction, blocks, perf_history, states, athletic_quality_of=None):
    for b in blocks:
        for it in b['items']:
            q = athletic_quality_of(it['exercise']['id']) if athletic_quality_of else None
            it['progression'] = for_item(direction, it, perf_history, states, athletic_quality=q)
    return blocks

def entries_from_performance(workout, performance):
    """Completion payload -> per-exercise entries (with the prescription the user saw) for future progression."""
    items = {it['item_id']: it for b in workout['blocks'] for it in b['items']}
    by_ex = {it['exercise']['id']: it for it in items.values()}
    out = {}
    for p in performance or []:
        it = items.get(p.get('item_id')) or by_ex.get(p.get('exercise_id'))
        if not it: continue
        rx = it['prescription']
        out[it['exercise']['id']] = dict(sets=[{k: s.get(k) for k in ('reps', 'load', 'unit', 'seconds', 'distance_m', 'calories')} for s in p.get('sets', [])],
                                         prescribed_reps=rx.get('reps'), prescribed_sets=rx.get('sets'))
    return out
