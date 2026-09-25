"""Production adapter for the frozen Athletic engine (Athletic FINAL FREEZE, Reference Generator v1).

build() (frozen; every candidate combination is checked by the frozen sk5 validator) -> independent re-check with the same
frozen validator (exactly as the frozen QA re-validates) -> shared formatter.
Exercise-level swap: exposures re-enter the frozen ranked() pool for the same slot and are re-assembled by the frozen
assemble() (dosing, impact, density, duration, Performance Support purpose and the validator); QC and Performance Support
swaps use the frozen pick_qc / pick_ps with the shown exercise excluded, then the frozen validator.
"""
from __future__ import annotations
import hashlib, threading
from . import athletic_gen as G, sk5
from .lib3 import PS, SLOT_ID

LOCK = threading.RLock()
EX = G.EX
GOAL_ROW = {'build_strength': 'get_stronger', 'build_muscle': 'get_stronger', 'improve_athleticism': 'athletic_performance'}   # WA GOAL MAPPING
LEGS_CONFLICT_OPTIONS = ['switch_direction', 'change_equipment', 'moods_pick']

class Conflict(Exception):
    def __init__(self, code, message, options, detail=None):
        super().__init__(message); self.code = code; self.message = message; self.options = options; self.detail = detail

def history_for_engine(records):
    """Frozen Athletic history: newest first, dict(aid, ids)."""
    return [dict(aid=r['archetype'], ids=list(r.get('exercise_ids', []))) for r in reversed(records) if r.get('direction') == 'athletic']

def _args(nctx, history, swap_count, displayed):
    return dict(archetype=nctx['archetype'] or 'moods_pick', level=nctx['experience'], duration=nctx['duration'], preset=nctx['equipment'],
                states=list(nctx['states']), sore=set(nctx['sore']), goal=GOAL_ROW.get(nctx['goal'], 'general_fitness'), history=history,
                seed=f"{nctx['user']}|{nctx['date']}", swap_count=swap_count, displayed=list(displayed))

def _chain(nctx, history, swap):
    displayed = []; w = None
    for k in range(swap + 1):
        w = G.build(**_args(nctx, history, k, displayed))
        if w['status'] != 'ok': return w
        displayed = list(w['ids'])
    return w

def _ctx(nctx, history, aid, swap_count=0, displayed=()):
    """The generator's own ctx, reconstructed exactly as build() creates it (for swaps)."""
    pre = G.PRESET_ALIAS.get(nctx['equipment'], nctx['equipment']); sore = frozenset(nctx['sore'])
    states = [s for s in nctx['states'] if s != 'normal']
    ctx = dict(aid=aid, lv=nctx['experience'], dur=nctx['duration'], preset=pre, states=states, sore=sore, history=list(history),
               seed=f"{nctx['user']}|{nctx['date']}", relax=set(), swap_count=swap_count, displayed=list(displayed))
    if aid == 'athletic_full_body' and nctx['duration'] == 60 and not (sore & G.LOWER):
        if not any(G.is_upper_or_rot(EX[i]) for s_ in ('sx', 'sx2') for i in G.pool(aid, s_, ctx['lv'], pre, sore)): ctx['relax'].add('fba_regions')
    return ctx

def recheck(w, nctx):
    """Independent re-validation with the frozen checker (same call the frozen QA uses)."""
    with LOCK:
        pre = G.PRESET_ALIAS.get(nctx['equipment'], nctx['equipment'])
        n_ps = sum(x['slot'] == 'ps' for x in w['items'])
        sk5.add('_prod', 'prod', w['archetype'], nctx['duration'], nctx['experience'], pre, [s for s in nctx['states'] if s != 'normal'],
                w['warmup'], w['items'], sore=set(nctx['sore']),
                reason='Legs sore: upper-only exposures are short, so a second support exercise rounds out the session' if n_ps == 2 else None)
        relax = set()
        if any('Equipment-limited' in l for l in w['log']): relax.add('duration_floor')
        if any('No upper-body or rotational' in l for l in w['log']): relax.add('fba_regions')
        sk5.SK['_prod']['relax'] = relax
        r = sk5.check('_prod'); del sk5.SK['_prod']
        return r

def build(nctx, history_records, swap=0):
    with LOCK:
        history = history_for_engine(history_records)
        w = _chain(nctx, history, swap)
        if w['status'] == 'conflict':
            speed = 'Speed' in w['reason']
            raise Conflict('sore_target_conflict' if speed else 'equipment_insufficient',
                           'Speed + Agility needs your legs, and they are sore today.' if speed else
                           'With sore legs and this equipment there is not enough worthwhile upper-body Athletic work today.',
                           (['moods_pick', 'change_archetype', 'switch_direction'] if speed else LEGS_CONFLICT_OPTIONS), detail=w['reason'])
        if w['status'] != 'ok':
            raise Conflict('cannot_build', 'This Athletic session cannot be built with the current setup.', ['moods_pick', 'change_equipment', 'switch_direction'],
                           detail=w.get('fails'))
        r = recheck(w, nctx)
        if r['fails']:
            raise Conflict('generation_failed', 'We could not build a valid Athletic session.', ['swap_workout'], detail=r['fails'])
        return _result(nctx, w, history)

def _result(nctx, w, history):
    rer = any("MOOD's Pick rerouted" in l for l in w['log'])
    requested = w['archetype']
    if rer:
        requested = G.resolve('moods_pick', nctx['experience'], G.PRESET_ALIAS.get(nctx['equipment'], nctx['equipment']), frozenset(), history)[0] or w['archetype']
    relax = []
    if any('Equipment-limited' in l for l in w['log']): relax.append('duration_floor_equipment_limited')
    if any('No upper-body or rotational' in l for l in w['log']): relax.append('fba_regions_equipment')
    return dict(status='ok', direction='athletic', archetype=w['archetype'], requested_archetype=requested, rerouted=rer and requested != w['archetype'],
                mode='explicit' if nctx['archetype'] else 'pick', w=w, log=[dict(reason_code='athletic_log', detail=l) for l in w['log']],
                relaxations=relax, estimated_minutes=float(w['result']['total']), sore_override=[],
                history_record=dict(direction='athletic', archetype=w['archetype'], exercise_ids=list(w['ids'])), target_muscles=[])

# ------------------------------------------------------------------ exercise-level swap
def swap_exercise(nctx, history_records, swap, res, idx, excluded):
    """idx: index into w['items'] (warm-up items are not swappable)."""
    with LOCK:
        history = history_for_engine(history_records); w0 = res['w']; aid = w0['archetype']
        goal = GOAL_ROW.get(nctx['goal'], 'general_fitness')
        x = w0['items'][idx]; slot = x['slot']
        ids = [i['id'] for i in w0['items'] if i['slot'] in ('px', 'sx', 'sx2')]
        ctx = _ctx(nctx, history, aid, swap_count=max(1, swap + 1), displayed=[i['id'] for i in w0['items']])
        new_w = None
        if slot in ('px', 'sx', 'sx2'):
            others = [i for i in ids if i != x['id']]
            order = ('px', 'sx', 'sx2')
            for cand in G.ranked(slot, ctx, [i for i in others if order.index(next(y['slot'] for y in w0['items'] if y['id'] == i)) < order.index(slot)]):
                if cand in excluded or cand in ids: continue
                if not G.compatible(EX[cand], others, slot, ctx): continue
                new_ids = [cand if i == x['id'] else i for i in ids]
                w = G.assemble(dict(ctx, swap_count=swap), new_ids, goal)
                if w['status'] == 'ok':
                    new_w = dict(w, archetype=aid, log=[l for l in w0['log'] if l.startswith(("MOOD's Pick", 'No upper-body'))] + w['log']); break
        elif slot in ('qc', 'ps'):
            used = [i['id'] for i in w0['items']] + list(excluded)
            items = list(w0['items'])
            if slot == 'qc':
                q = G.pick_qc(ctx, used)
                if q: items[idx] = q
            else:
                p = G.pick_ps(ctx, [dict(slot=i['slot'], id=i['id']) for i in w0['items'] if i['slot'] in ('px', 'sx', 'sx2')], used)
                if p: items[idx] = sk5.X('ps', p, x['sets'], purpose=PS[p], why=G.WHY[PS[p]], **G.ps_dose(p, goal))
            if items[idx] is not x:
                w = dict(w0, items=items, ids=[i['id'] for i in items])
                r = recheck(w, nctx)
                if not r['fails']: new_w = dict(w, result=r)
        if not new_w: raise Conflict('no_alternative', 'No other exercise fits this part of the session today.', [])
        r = recheck(new_w, nctx)
        if r['fails']: raise Conflict('no_alternative', 'No other exercise fits this part of the session today.', [])
        new_w['result'] = r
        out = _result(nctx, new_w, history)
        out['rerouted'] = res['rerouted']; out['requested_archetype'] = res['requested_archetype']
        out['log'] = res['log'] + [dict(reason_code='exercise_swapped', slot=slot, **{'from': x['id'], 'to': new_w['items'][idx]['id'] if idx < len(new_w['items']) else None})]
        return out

def fingerprint(res):
    w = res['w']
    return hashlib.sha256(repr((w['archetype'], w['warmup'], [(i['slot'], i['id'], i['sets'], i['reps'], i['sec']) for i in w['items']])).encode()).hexdigest()[:16]
