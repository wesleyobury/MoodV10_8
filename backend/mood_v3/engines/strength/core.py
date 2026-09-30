"""Strength programming core (Core rebuild, Phase 1). Replaces the frozen prescription / structure / State-dial layers.

Pipeline (one build):
  routing (adapter) -> State resolution (dials.resolve) -> structural variant (variants.select_variant)
  -> composition (frozen compose / soreness / reroute, with THIS module's ranker and slot plan injected)
  -> base prescription from bands positioned by the variant (bands) -> State levers inside the bands
  -> structure: pairing, programming device, optional finisher (variant-driven, State-weighted, history-penalised)
  -> duration reconciliation with a realistic time model (timing) -> validation -> decision log.
Everything is deterministic in (user, date, archetype, swap_count, history).
"""
from __future__ import annotations
import hashlib, itertools
from collections import Counter
from . import audit_engine as AE, qa_engine as QE, structure as ST, prescription as PR, bands as B, variants as V, dials as D, timing as T, methods as M, library_overrides as LO, coherence as CO

EX = AE.EX
NOVELTY_RESCORED = LO.apply(EX)
for _d in (-1, 0, 1): AE.STATE_CAP[f'_cap{_d}'] = _d
SLOT_CLS = {(a, s['slot']): s['cls'] for a in AE.SLOTS for s in AE.SLOTS[a]}
SLOT_INC = {(a, s['slot']): (s['i60'], s['i30']) for a in AE.SLOTS for s in AE.SLOTS[a]}
VERDICT_W = {'preferred': 2.5, 'allowed': 1.0, 'conditional': 0.0}
FORCEFUL_POOL = ['kettlebell_swing', 'push_press', 'db_clean_to_press', 'kb_clean_and_press', 'db_snatch', 'barbell_thruster', 'sled_push']
CARRY_POOL = ['farmer_carry', 'suitcase_carry']
FIN_REPS = {'kettlebell_swing': '15', 'push_press': '6', 'db_clean_to_press': '8', 'kb_clean_and_press': '6/side', 'db_snatch': '6/side', 'barbell_thruster': '8',
            'sled_push': '20 m', 'farmer_carry': '30 m', 'suitcase_carry': '25 m/side'}
TEMPO_TEXT = {'controlled': 'Controlled tempo: 3 s lowering, smooth drive, no bounce', 'explosive_intent': 'Move the bar with intent: controlled down, drive up as fast as it will go'}


def seedu(*parts): return V.u(*parts)


# ================================================================== ranker + slot plan (injected into the frozen composer)
def rank(cands, sc, sel, aid, slot, ctx, seed=0):
    """Hard eligibility is upstream (candidates). Here: Target fulfilment (strict) > protected-primary continuity (strict) >
    weighted soft score: library verdict, State bias, recency x novelty, swap chain, equipment diversity, profile distance, seeded jitter.
    State bias never touches a protected slot."""
    Tg = ctx.get('target') or set(); protected = (aid, slot) in AE.PROTECTED; anchor = QE.prev_pick(sc, aid, slot)
    bias = sc.get('_bias') or {}; rmult = sc.get('_recency_mult', 1.0); jit = sc.get('_jitter', 1.0); cap = sc.get('_sysd_cap')
    pool = cands
    if cap is not None and not protected and SLOT_CLS.get((aid, slot)) != 'primary_compound':
        f = [c for c in cands if c[0]['sysd'] <= cap]
        if f: pool = f
    if (aid, slot) in AE.DEPTH_SLOTS or slot == 'ancillary_depth':
        partner = QE.depth_first(aid, slot, sel); used_f = {e['swap'] for e in sel.values() if partner is None or e['id'] != partner['id']}
        f = [x for x in pool if x[0]['swap'] not in used_f]
        if f: pool = f
    used_eq = {e['eq'] for e in sel.values()}; bctx = dict(used_eq=used_eq, last_station=(list(sel.values())[-1]['station'] if sel else None))
    is_primary = SLOT_CLS.get((aid, slot)) == 'primary_compound'
    dw = sc.get('swap', 0) > 0 and bool(sc.get('displayed'))
    def soft(e, v, b):
        s = VERDICT_W[v] + (0.8 if is_primary else 0.3) * b
        if is_primary:   # a main lift is loadable, bilateral where possible and systemically meaningful
            s += 1.0 if e['eq'] in ('barbell', 'trap_bar', 'plate_loaded_machine', 'selectorized_machine', 'smith_machine', 'dumbbells') else -1.5
            s += 0.5 if e['lat'] == 'bilateral' else 0.0
            s += 0.3 if e['sysd'] >= 3 else 0.0
        fr, er = QE.recency_penalty(e, aid, sc); s -= rmult * (1.0 * fr + 1.0 * er)
        sf, se = QE.swap_penalty(e, sc); s -= 2.0 * sf + 2.0 * se
        s += 0.6 * (1 if e['eq'] not in used_eq else 0)
        f = QE.depth_first(aid, slot, sel)
        if f is not None: s += 0.5 * AE.profile_distance(e, f)
        if not protected: s += D.bias_score(e, bias, bctx) * (0.5 if SLOT_CLS.get((aid, slot)) == 'secondary_compound' else 1.0)
        if sc.get('sore') and (set(e['sec']) & sc['sore']): s -= 3.0          # a sore muscle as a secondary mover: avoid when an equal option exists
        lvl = sc.get('exp')
        if SLOT_CLS.get((aid, slot)) == 'secondary_compound' and e['cls'] == 'compound':
            # movement-family redundancy across the compound slots: a third press adds little; for a beginner (or a Stressed / feel-better
            # session) even the second same-family compound gives way to a different pattern when one exists
            same = sum(1 for x in sel.values() if x['cls'] == 'compound' and x['mfam'] == e['mfam'])
            limit = 1 if (lvl == 'beginner' or 'stressed' in (sc.get('_states') or ()) or sc.get('_goal') == 'feel_better_reduce_stress') else 2
            if same >= limit: s -= 2.5
        if lvl == 'beginner' and not is_primary: s += 0.6 * D.fit(e, 'supported', bctx) + 0.4 * D.fit(e, 'simple', bctx)
        elif lvl == 'advanced' and not is_primary: s += 0.4 if (e['cx'] >= 3 or e['eq'] in ('barbell', 'trap_bar', 'landmine')) else 0.0
        s += jit * seedu(sc.get('user', 'u'), sc.get('date', 'd'), aid, slot, e['id'], 0 if protected else sc.get('swap', 0), '' if protected else sc.get('_jitter_salt', ''))
        return s
    covered = {AE.roll(m) for x in sel.values() for m in x['prim']} if Tg else set()
    def key(t):
        e, v, b = t; tc = ((3 if AE.roll(e['pm0']) not in covered else 2) if AE.roll(e['pm0']) in Tg else (1 if e['prims'] & Tg else 0)) if Tg else 0   # an uncovered Target muscle comes first
        if protected and not dw: return (-tc, 0 if e['id'] == anchor else 1, -soft(e, v, b))
        return (-tc, -soft(e, v, b))
    return sorted(pool, key=key)


def slot_active(s, sc):
    """Arms compound_combination: a bigger combination lift on high-intent / novelty days (Bored or Amped), as the frozen skeleton intends."""
    return s.get('cond') != 'state_bored_amped' or bool({'bored', 'amped'} & set(sc.get('_states') or ()))


def _inc(aid, slot, dur):
    i60, i30 = SLOT_INC[(aid, slot)]; return i60 if dur == 60 else i30


def _counts(aid, sel):
    c = Counter()
    for k in sel:
        cls = SLOT_CLS.get((aid, k))
        if cls == 'secondary_compound': c['secondary'] += 1
        elif cls in ('accessory', 'extra'): c['accessory'] += 1
    return c


def backfill(aid, sc, dur, sel, ctx, log):
    """Slot plan from the structural variant: trim default slots above the plan ceiling, fill optional slots up to the plan floor.
    Required slots are never touched. The duration reconciler may add more optional slots later (up to the ceiling)."""
    plan = sc.get('_plan') or {'secondary': (0, 9), 'accessory': (0, 9)}
    slots = AE.SLOTS[aid]; removed = []; added = []
    for kind, cls_set in (('accessory', ('accessory', 'extra')), ('secondary', ('secondary_compound',))):
        while _counts(aid, sel)[kind] > plan[kind][1]:
            cand = [s for s in reversed(slots) if s['slot'] in sel and s['cls'] in cls_set and _inc(aid, s['slot'], dur) in ('optional', 'default')]
            if not cand: break
            del sel[cand[0]['slot']]; removed.append(cand[0]['slot'])
    for kind, cls_set in (('secondary', ('secondary_compound',)), ('accessory', ('accessory', 'extra'))):
        for s in slots:
            if _counts(aid, sel)[kind] >= plan[kind][0]: break
            if s['cls'] not in cls_set or s['slot'] in sel or _inc(aid, s['slot'], dur) != 'optional' or not slot_active(s, sc): continue
            c = AE.candidates(aid, s['slot'], sc, sel, ctx)
            if not c: continue
            sel[s['slot']] = rank(c, sc, sel, aid, s['slot'], ctx)[0][0]; added.append(s['slot'])
    if removed: log.append({'reason_code': 'plan_trim', 'slots': removed})
    if added: log.append({'reason_code': 'plan_fill', 'slots': added})
    order = [s['slot'] for s in slots]
    if aid == 'strength_upper_mixed':   # WA v12 sequencing: pushes, then pulls, then accessories
        def grp(k): e = sel[k]; return 0 if e['pat'] in AE.PUSH else (1 if e['pat'] in AE.PULL else 2)
        order = sorted([k for k in order if k in sel], key=lambda k: (grp(k), order.index(k)))
    return {k: sel[k] for k in order if k in sel}


def add_optional_slot(aid, sc, dur, W, ctx, plan):
    """One more optional slot for the reconciler (accessory first, then secondary), within the plan ceiling."""
    sel = {k: EX[v] for k, v in W.items()}
    for kind, cls_set in (('accessory', ('accessory', 'extra')), ('secondary', ('secondary_compound',))):
        if _counts(aid, sel)[kind] >= plan[kind][1]: continue
        for s in AE.SLOTS[aid]:
            if s['cls'] not in cls_set or s['slot'] in W or _inc(aid, s['slot'], dur) not in ('optional', 'default') or not slot_active(s, sc): continue
            if s['cls'] in ('meta', 'computed') or s['slot'] in (sc.get('_blocked') or ()): continue
            used_fams = {e['swap'] for e in sel.values()}
            c = [x for x in AE.candidates(aid, s['slot'], sc, sel, ctx) if x[0]['swap'] not in used_fams]
            if not c: continue
            return s['slot'], rank(c, sc, sel, aid, s['slot'], ctx)[0][0]['id']
    return None, None


_orig_candidates = AE.candidates
def candidates(aid, slot, sc, sel, ctx, relax_swap=False):
    """State complexity caps apply to everything except the protected primary lift: a State adjusts the session, it does not take
    the main lift away (Sore still can, through the soreness filters inside hard_ok)."""
    if SLOT_CLS.get((aid, slot)) in ('primary_compound', 'secondary_compound') and sc.get('state') == '_cap-1':
        sc = dict(sc, state='_cap0')          # a lowering State cap applies to accessory work; the compound lifts keep the level's cap
    return _orig_candidates(aid, slot, sc, sel, ctx, relax_swap)


# install the hooks (compose / _build / sore_substitute resolve these names from module globals)
AE.rank = rank; QE.rank = rank; QE.backfill = backfill; AE.slot_active = slot_active; QE.slot_active = slot_active
AE.candidates = candidates; QE.candidates = candidates


# ================================================================== prescription rows
GOAL_POS = {  # goal fingerprint inside the bands (applied before State levers; a position shift, never a value outside the band)
    'build_strength':            {'primary_compound': dict(reps=-0.2, rest=+0.2), 'secondary_compound': dict(reps=-0.15), 'accessory': dict(sets=-0.2)},
    'build_muscle':              {'accessory': dict(reps=+0.2, sets=+0.3), 'secondary_compound': dict(reps=+0.15, sets=+0.15), 'primary_compound': dict(rest=-0.1)},
    'improve_athleticism':       {'primary_compound': dict(reps=-0.15, rest=+0.15), 'accessory': dict(sets=-0.1)},
    'lose_weight_conditioning':  {'accessory': dict(rest=-0.3, reps=+0.1), 'secondary_compound': dict(rest=-0.2)},
    'feel_better_reduce_stress': {'primary_compound': dict(rir=+0.25), 'secondary_compound': dict(rir=+0.25)},
}
LEVEL_POS = {  # level fingerprint inside the shared intermediate/advanced bands (beginner has its own bands)
    'advanced': {'primary_compound': dict(rir=-0.3, sets=+0.15), 'secondary_compound': dict(reps=-0.1)},
}
_GOAL = {'goal': None}


def make_row(slot, role, cls, e, exp, variant, inc, prio, protected, dur=60):
    pos = dict(V.VARIANTS[variant]['pos'].get(cls if cls in B.BANDS['intermediate'] else 'accessory'))
    for k, dv in GOAL_POS.get(_GOAL['goal'] or '', {}).get(cls if cls in B.BANDS['intermediate'] else 'accessory', {}).items(): pos[k] = max(0.0, min(1.0, pos[k] + dv))
    for k, dv in LEVEL_POS.get(exp, {}).get(cls if cls in B.BANDS['intermediate'] else 'accessory', {}).items(): pos[k] = max(0.0, min(1.0, pos[k] + dv))
    if dur == 30: pos['sets'] = max(0.0, pos['sets'] - 0.3); pos['rest'] = max(0.0, pos['rest'] - 0.2)   # a 30-minute session starts lower in the bands
    reps, kind, why = B.rep_text(e, cls, exp, pos['reps'])
    row = dict(slot=slot, role=role, cls=cls, eid=e['id'], name=e['name'], sets=B.sets_at(cls, exp, pos['sets']), reps=reps, kind=kind, why=why,
               rest=0, rir=max(B.rir_at(cls, exp, pos['rir']), B.rir_floor(e['id']) or 0), inc=inc, prio=prio, protected=protected, pos=pos, ecls=e['cls'], tempo=None)
    row['rest'] = B.rest_for(row, exp)
    return row


def order_rows(aid, rows, W):
    if aid == 'strength_upper_mixed':
        order = list(W.keys()); rows.sort(key=lambda r: order.index(r['slot']) if r['slot'] in order else 99)
    elif aid == 'strength_arms':
        ordk = {'compound_combination': 0, 'biceps_exercise': 1, 'triceps_exercise': 2, 'biceps_depth': 3, 'triceps_depth': 4, 'shoulder_exercise': 5, 'shoulder_depth': 6, 'optional_extra_burnout': 7}
        rows.sort(key=lambda r: ordk.get(r['slot'], 9))
    else: rows.sort(key=lambda r: r['prio'])
    return rows


def prescribe(aid, W, dur, exp, variant):
    rows = []
    for slot, eid in W.items():
        name, cls, meta = PR.SLOT_ROLE[(aid, slot)]
        rows.append(make_row(slot, name, cls, EX[eid], exp, variant, _inc(aid, slot, dur), int(meta['prio']), (aid, slot) in AE.PROTECTED, dur))
    return order_rows(aid, rows, W)


def _band(r, exp):
    b = B.band(r['cls'], exp); f = B.rir_floor(r.get('eid'))
    return b if f is None else dict(b, rir=(max(b['rir'][0], f), max(b['rir'][1], f)))


def _set_reps(r, exp):
    if r['kind'] == 'reps' and r['why'] == '':
        r['reps'] = B.rep_text(EX[r['eid']], r['cls'], exp, r['pos']['reps'])[0]


def _sole_cover(r, rows, protect):
    """True when r is the only row that trains one of the protected (explicitly targeted) muscle groups: it must stay."""
    if not protect: return False
    mine = {AE.roll(m) for m in EX[r['eid']]['prim']} & set(protect)
    for m in mine:
        if not any(x is not r and m in {AE.roll(y) for y in EX[x['eid']]['prim']} for x in rows): return True
    return False


def apply_levers(rows, levers, exp, log, protect=None):
    """Bounded lever application. Every applied change emits an event; a lever that cannot fire emits 'no_effect'."""
    for lv in levers:
        state, kind, scope = lv[0], lv[1], lv[2]; delta = lv[3] if len(lv) > 3 else None; n = lv[4] if len(lv) > 4 else 1
        tgt = [r for r in rows if D.SCOPES[scope](r)]; fired = []
        if kind == 'rir':
            for r in tgt:
                lo, hi = _band(r, exp)['rir']; new = max(lo, min(hi, r['rir'] + delta))
                if new != r['rir']: fired.append(dict(slot=r['slot'], **{'from': r['rir'], 'to': new})); r['rir'] = new
        elif kind == 'rirfloor':
            for r in tgt:
                if r['rir'] < delta: fired.append(dict(slot=r['slot'], **{'from': r['rir'], 'to': delta})); r['rir'] = min(delta, _band(r, exp)['rir'][1])
        elif kind == 'reppos':
            for r in tgt:
                if r['kind'] != 'reps' or r['why']: continue
                old = r['reps']; r['pos']['reps'] = max(0.0, min(1.0, r['pos']['reps'] + delta)); _set_reps(r, exp)
                if r['reps'] != old: fired.append(dict(slot=r['slot'], **{'from': old, 'to': r['reps']}))
        elif kind == 'restpos':
            for r in tgt:
                old = r['rest']; r['pos']['rest'] = max(0.0, min(1.0, r['pos']['rest'] + delta)); r['rest'] = B.rest_for(r, exp)
                if r['rest'] != old: fired.append(dict(slot=r['slot'], **{'from': old, 'to': r['rest']}))
        elif kind == 'sets':
            if delta < 0:
                cand = [r for r in sorted(tgt, key=lambda r: -r['prio']) if r['sets'] > _band(r, exp)['sets'][0]][:n]
                for r in cand: fired.append(dict(slot=r['slot'], **{'from': r['sets'], 'to': r['sets'] - 1})); r['sets'] -= 1; r['_state_sets'] = r.get('_state_sets', 0) - 1
            else:
                cand = [r for r in sorted(tgt, key=lambda r: r['prio']) if r['sets'] < _band(r, exp)['sets'][1]][:n]
                for r in cand: fired.append(dict(slot=r['slot'], **{'from': r['sets'], 'to': r['sets'] + 1})); r['sets'] += 1; r['_state_sets'] = r.get('_state_sets', 0) + 1
        elif kind == 'slot':
            cand = [r for r in sorted(tgt, key=lambda r: -r['prio']) if r['inc'] != 'required' and not r['protected'] and not _sole_cover(r, rows, protect)]
            if cand and len(rows) > 3:
                rows.remove(cand[0]); fired.append(dict(slot=cand[0]['slot'], removed=cand[0]['eid']))
        code = {'rir': 'state_rir', 'rirfloor': 'state_rir', 'reppos': 'state_reps', 'restpos': 'state_rest', 'sets': 'state_volume', 'slot': 'state_slot_removed'}[kind]
        log.append(dict(reason_code=code, state=state, scope=scope, delta=delta, changes=fired) if fired else dict(reason_code=code + '_no_effect', state=state, scope=scope, delta=delta))
    return rows


def apply_tempo(rows, tempos, log):
    for kind, scope, *st in tempos:
        hit = []
        for r in rows:
            if D.SCOPES[scope](r) and r['kind'] == 'reps' and not r['tempo']: r['tempo'] = kind; hit.append(r['slot'])
        if hit: log.append(dict(reason_code='state_tempo', tempo=kind, slots=hit, state=(st[0] if st else None)))


# ================================================================== structure
def _pairable(r, aid, variant):
    e = EX[r['eid']]
    if r.get('protected') or e['prec'] or e['cls'] == 'integrated' or e['combo']: return False
    if r['cls'] in ('accessory', 'extra'): return True
    return r['cls'] == 'secondary_compound' and e['cx'] <= 2 and V.VARIANTS[variant]['pair_secondaries']


def _compatible(a, b):
    m = min(a['sets'], b['sets'])
    return ST.compatible(dict(a, sets=m), dict(b, sets=m))


def burnout_candidate(aid, W, sc, ctx, seed, exclude=()):
    """Isolation for a defining / Target muscle. On push / press-led days a rear-delt row is not a burnout for that session."""
    e = ST.burnout_candidate(aid, dict(W, **{f'_x{i}': x for i, x in enumerate(exclude)}), sc, ctx, seed)
    if e and aid in ('strength_upper_push',) and e['prim'][0] == 'rear_delts':
        W2 = dict(W, _x_rd=e['id']); e = ST.burnout_candidate(aid, W2, sc, ctx, seed)
        if e and e['prim'][0] == 'rear_delts': return None
    return e


def forceful_candidates(kind, W, sc, exclude=()):
    used = set(W.values()) | set(exclude); out = []
    for eid in (FORCEFUL_POOL if kind == 'forceful' else CARRY_POOL):
        e = EX.get(eid)
        if not e or eid in used or not AE.hard_ok(e, sc): continue
        if sc.get('sore') and set(e['allm']) & sc['sore']: continue
        out.append(e)
    return out


def pick_finisher(aid, W, sc, ctx, seed, types, history_fin, exclude=()):
    """-> (type, exercise) or (None, None). Type weighted by history (last finisher type x0.3); exercise by recency, then seed."""
    weights = {}
    for t in types:
        w = 0.4 if t == 'carry' else 1.0
        if history_fin:
            if history_fin[-1].get('type') == t: w *= 0.3
            elif len(history_fin) > 1 and history_fin[-2].get('type') == t: w *= 0.6
        weights[t] = w
    order = sorted(weights, key=lambda t: -weights[t] + seedu(seed, 'fintype', t) * 0.01)
    first = V.weighted_pick(weights, seed, 'fintype')
    if first: order.remove(first); order.insert(0, first)
    recent = [h.get('eid') for h in history_fin[-3:]]
    for t in order:
        if t == 'burnout':
            e = burnout_candidate(aid, W, sc, ctx, seed, exclude)
            if e: return t, e
            continue
        pool = forceful_candidates(t, W, sc, exclude)
        if not pool: continue
        pool.sort(key=lambda e: ((e['id'] in recent), seedu(seed, 'fin', t, e['id'])))
        return t, pool[0]
    return None, None


def finisher_row(t, e):
    if t == 'burnout': return dict(slot='finisher', role='Finisher', cls='finisher', eid=e['id'], name=e['name'], sets=2, reps=('20–25' if e['pm0'] == 'calves' else '15–20'), kind='reps', why='', rest=30, rir=0, inc='optional', prio=99, protected=False, ecls=e['cls'], tempo=None, fin_type=t)
    reps = FIN_REPS.get(e['id'], '10'); kind = 'distance' if ' m' in reps else 'reps'
    return dict(slot='finisher', role='Finisher', cls='finisher', eid=e['id'], name=e['name'], sets=3, reps=reps, kind=kind, why=('distance' if kind == 'distance' else ''), rest=60, rir=1, inc='optional', prio=99, protected=False, ecls=e['cls'], tempo=None, fin_type=t)


def build_structure(aid, rows, variant, res, sc, dur, ctx, W, seed, history_fin, exp, fin_exclude=()):
    """-> (blocks, log, finisher_row or None). Variant-driven pairing + at most one programming device + optional finisher."""
    v = V.VARIANTS[variant]; log = []; blocks = []; used = set(); bid = [0]
    def nb(): bid[0] += 1; return f'B{bid[0]}'
    for r in rows:   # reps may have moved after rest was set (State / coherence levers): re-apply the rest ceiling for the final reps
        if r.get('rest') is not None: r['rest'] = min(r['rest'], B.rest_ceiling(r, exp))
    if aid == 'strength_core' and not any(r['slot'].startswith('core_') for r in rows):   # frozen-harness Core rows (QA parity only)
        for r in rows: blocks.append(ST.straight(r, nb(), 'Core formats unchanged (straight)'))
        for i, b in enumerate(blocks, 1): b['sequence_index'] = i
        log.append(dict(reason_code='structure_selected', variant='core', pattern='straight', blocks=[('straight', [it['exercise_id'] for it in b['items']]) for b in blocks]))
        return blocks, log, None
    # ---- top set + back-off on the primary
    if variant == 'top_backoff':
        p = next((r for r in rows if r['cls'] == 'primary_compound' and r['kind'] == 'reps' and not r['why']), None)
        if p and p['sets'] >= 3:
            lo, hi = _band(p, exp)['reps']; top = lo + (1 if p['pos']['reps'] > 0.6 else 0); ba, bb = B.rep_window(p['cls'], exp, 0.6)
            back = (ba + bb) // 2 + 1
            p['scheme'] = [top] + [back] * (p['sets'] - 1); p['top_backoff'] = True
            p['rest'] = B.rest_for(p, exp)     # the heavy top set sets the recovery (heavy barbell top set: full recovery)
            log.append(dict(reason_code='top_set_backoff', slot=p['slot'], top_reps=top, backoff_reps=back, sets=p['sets']))
    # ---- pairing
    p_pair = v['pairing'] * res.get('pairing_mult', 1.0)
    pool = [r for r in rows if _pairable(r, aid, variant)]
    pairs = []
    for a in pool:
        if a['slot'] in used: continue
        for b in pool:
            if b is a or b['slot'] in used or not _compatible(a, b): continue
            if aid == 'strength_custom_target' and 'core' in (a.get('muscle'), b.get('muscle')) and a.get('muscle') != b.get('muscle'): continue   # Core stays its own last block
            if seedu(seed, 'pair', a['slot'], b['slot']) < p_pair:
                hi_a, hi_b = _band(a, exp)['sets'][1], _band(b, exp)['sets'][1]; lo_a, lo_b = _band(a, exp)['sets'][0], _band(b, exp)['sets'][0]
                m = max(a['sets'], b['sets'])
                if m > min(hi_a, hi_b): m = min(a['sets'], b['sets'])
                if m < max(lo_a, lo_b): continue
                if a['sets'] != m or b['sets'] != m: log.append(dict(reason_code='pair_sets_aligned', slots=[a['slot'], b['slot']], sets=m))
                a['sets'] = b['sets'] = m; pairs.append((a, b)); used.add(a['slot']); used.add(b['slot']); break
    for a, b in pairs:
        blk, extra = ST.superset(a, b, nb(), f'{v["name"]}: paired accessories'); blocks.append(blk)
    # ---- one programming device
    device = None; dp = v['device_p'] * res.get('device_p', 1.0) * (0.0 if aid == 'strength_core' else 1.0)   # no pyramids / ladders on trunk work
    opts = [d for d in v['devices'] if d != 'finisher']
    if opts and seedu(seed, 'device') < min(1.0, dp):
        d = opts[int(seedu(seed, 'device_pick') * len(opts)) % len(opts)]
        if d == 'pyramid':
            cand = [r for r in rows if r['slot'] not in used and not r.get('protected') and r['cls'] in ('secondary_compound',) and r['sets'] >= 3 and EX[r['eid']]['cls'] == 'compound' and EX[r['eid']]['eq'] != 'bodyweight' and EX[r['eid']]['lat'] == 'bilateral' and r['kind'] == 'reps' and not r['why'] and exp != 'beginner' and not r.get('method')]
            if cand: blocks.append(ST.pyramid(cand[0], nb(), f'{v["name"]}: ascending pyramid on a secondary lift')); used.add(cand[0]['slot']); device = 'pyramid'
        elif d == 'ladder':
            cand = [r for r in rows if r['slot'] not in used and EX[r['eid']]['cls'] == 'isolation' and not r.get('protected') and EX[r['eid']]['pm0'] != 'core' and r['kind'] == 'reps' and not r['why'] and not r.get('method')]
            if cand: blocks.append(ST.ladder(cand[-1], nb(), f'{v["name"]}: descending ladder on an isolation')); used.add(cand[-1]['slot']); device = 'ladder'
        if device: log.append(dict(reason_code='device_selected', device=device))
    # ---- optional finisher (a device: State probability, variant compatibility at 30)
    fin = None; fp, ftypes = res.get('finisher', (0.0, ()))
    if fp <= 0 and 'finisher' in v['devices']: fp, ftypes = min(0.2, dp * 0.6), ('burnout', 'forceful', 'carry')
    if aid in ('strength_custom_target', 'strength_core'): ftypes = tuple(t for t in ftypes if t == 'burnout')   # a Target / Core session finishes on its own muscle
    if exp == 'beginner': ftypes = tuple(t for t in ftypes if t != 'burnout')                 # RIR-0 burnouts are intermediate and up; a beginner State never means failure
    if dur == 30: fp *= 0.4
    if fp > 0 and ftypes and not sc.get('_no_fin') and seedu(seed, 'finisher') < fp:
        t, e = pick_finisher(aid, W, sc, ctx, seed, ftypes, history_fin, fin_exclude)
        if e:
            fin = finisher_row(t, e)
            blocks_fin = dict(block_id='F1', structure_id='finisher', items=[dict(slot='finisher', exercise_id=e['id'], name=e['name'], sets=fin['sets'], reps=fin['reps'], rir=fin['rir'])],
                              rounds=fin['sets'], rest_between_items=0, rest_after_round=fin['rest'], reason=f'{t} finisher')
            log.append(dict(reason_code='finisher_selected', type=t, exercise=e['id'], state_driven=bool(res.get('finisher', (0.0,))[0] > 0), states=list(res.get('states', []))))
        else: log.append(dict(reason_code='finisher_unavailable', types=list(ftypes)))
    # ---- everything else straight, presentation order
    for r in rows:
        if r['slot'] not in used:
            b = ST.straight(r, nb()); 
            if r.get('scheme'):
                it = b['items'][0]; it['scheme'] = r['scheme']; it['load'] = 'top set heavy, then back off 10–15% for the remaining sets'
            blocks.append(b)
    pos = {r['slot']: i for i, r in enumerate(rows)}
    blocks.sort(key=lambda b: min(pos.get(it['slot'], 99) for it in b['items']))
    for i, b in enumerate(blocks, 1): b['block_id'] = f'B{i}'; b['sequence_index'] = i
    if fin: blocks_fin['sequence_index'] = len(blocks) + 1; blocks.append(blocks_fin)
    for b in blocks:
        for it in b['items']:
            r = next((x for x in rows if x['slot'] == it['slot']), None)
            if r and r.get('tempo'): it['load'] = TEMPO_TEXT[r['tempo']]
            if r and r.get('method'): it['method'] = r['method']
    pattern = '+'.join(sorted({b['structure_id'] for b in blocks}))
    log.insert(0, dict(reason_code='structure_selected', variant=variant, pattern=pattern, pairs=[(a['slot'], b['slot']) for a, b in pairs], device=device,
                       blocks=[(b['structure_id'], [it['exercise_id'] for it in b['items']]) for b in blocks]))
    return blocks, log, fin


# ================================================================== duration reconciliation
def _partner(blocks, slot):
    for b in blocks:
        if b['structure_id'] == 'superset' and any(it['slot'] == slot for it in b['items']):
            return next(it['slot'] for it in b['items'] if it['slot'] != slot)
    return None


def _bump(rows, blocks, r, delta, exp):
    """Change sets on a row and on its paired partner together, only if both stay inside their bands."""
    p = _partner(blocks, r['slot']); pr = next((x for x in rows if x['slot'] == p), None) if p else None
    for x in (r, pr) if pr else (r,):
        lo, hi = _band(x, exp)['sets']
        if not (lo <= x['sets'] + delta <= hi): return False
        if (delta > 0 and x.get('_state_sets', 0) < 0) or (delta < 0 and x.get('_state_sets', 0) > 0): return False   # never undo a State's set change
    for x in (r, pr) if pr else (r,): x['sets'] += delta
    return True


def reconcile(aid, rows, W, dur, exp, variant, sc, ctx, plan, build, log):
    """Nudge the session into the requested window by adding / removing useful work inside the bands."""
    import copy as _copy
    lo, hi, aim = T.WINDOW[dur]; prev = None; stall = 0; direction = None; snap = None
    for _ in range(16):
        blocks, slog, fin = build(rows)
        allrows = rows + ([fin] if fin else [])
        est = T.estimate_minutes(blocks, allrows, dur)
        if lo <= est <= hi: return blocks, slog, fin, est
        side = 'under' if est < lo else 'over'
        if direction is None: direction = side
        elif side != direction:
            # the last step overshot the window: keep whichever of the two states sits closer to the aim, then stop
            if snap is not None and abs(snap[3] - aim) < abs(est - aim):
                rows[:] = snap[0]; W.clear(); W.update(snap[1]); sc['_no_fin'] = snap[2]
                blocks, slog, fin = build(rows); est = T.estimate_minutes(blocks, rows + ([fin] if fin else []), dur)
                log.append(dict(reason_code='duration_step_reverted', est=est, window=[lo, hi]))
            log.append(dict(reason_code='duration_underfill_accepted' if est < lo else 'duration_overfill_accepted', est=est, window=[lo, hi], detail='window overshot; closest state kept'))
            return blocks, slog, fin, est
        snap = (_copy.deepcopy(rows), dict(W), sc.get('_no_fin'), est)
        stall = stall + 1 if est == prev else 0; prev = est
        if stall >= 2:
            log.append(dict(reason_code='duration_underfill_accepted' if est < lo else 'duration_overfill_accepted', est=est, window=[lo, hi], detail='no further useful change'))
            return blocks, slog, fin, est
        if est < lo:
            slot, eid = (None, None) if sc.get('_no_slot_add') else add_optional_slot(aid, sc, dur, W, ctx, plan)
            if slot:
                W[slot] = eid; name, cls, meta = PR.SLOT_ROLE[(aid, slot)]
                rows.append(make_row(slot, name, cls, EX[eid], exp, variant, _inc(aid, slot, dur), int(meta['prio']), False, dur)); order_rows(aid, rows, W)
                log.append(dict(reason_code='duration_backfill', action='slot_added', slot=slot, exercise=eid, est_before=est)); continue
            c = [r for r in sorted(rows, key=lambda r: (r['sets'], r['prio'])) if r['cls'] in ('accessory', 'extra', 'secondary_compound') and r['sets'] < _band(r, exp)['sets'][1] and r.get('_state_sets', 0) >= 0]
            c = [r for r in c if _bump(rows, blocks, r, +1, exp)][:1]   # a set a State removed is never put back by the clock
            if c: log.append(dict(reason_code='duration_backfill', action='set_added', slot=c[0]['slot'], est_before=est)); continue
            c = [r for r in rows if r['cls'] == 'primary_compound' and r['sets'] < _band(r, exp)['sets'][1] and not r.get('scheme')]
            if c: c[0]['sets'] += 1; log.append(dict(reason_code='duration_backfill', action='primary_set_added', slot=c[0]['slot'], est_before=est)); continue
            # Rest is never lengthened to reach a requested duration (founder rest audit): the session is shown honestly shorter.
            log.append(dict(reason_code='duration_underfill_accepted', est=est, window=[lo, hi])); return blocks, slog, fin, est
        else:
            if fin and not sc.get('_no_fin'):
                sc['_no_fin'] = True; log.append(dict(reason_code='duration_trim', action='finisher_dropped', est_before=est)); continue
            c = [r for r in rows if r['cls'] in ('accessory', 'extra') and r['pos']['rest'] > 0.3]
            if c:
                for r in c: r['pos']['rest'] = max(0.0, r['pos']['rest'] - 0.25); r['rest'] = B.rest_for(r, exp)
                log.append(dict(reason_code='duration_trim', action='accessory_rest_shortened', est_before=est)); continue
            c = [r for r in sorted(rows, key=lambda r: -r['prio']) if r['cls'] in ('accessory', 'extra') and r['sets'] > _band(r, exp)['sets'][0] and r.get('_state_sets', 0) <= 0]
            c = [r for r in c if _bump(rows, blocks, r, -1, exp)][:1]   # a set a State added is never trimmed by the clock
            if c: log.append(dict(reason_code='duration_trim', action='set_removed', slot=c[0]['slot'], est_before=est)); continue
            c = [r for r in sorted(rows, key=lambda r: -r['prio']) if r['cls'] in ('accessory', 'extra') and r['inc'] != 'required' and not r['protected'] and not _sole_cover(r, rows, ctx.get('target') if sc.get('_explicit') else None)]
            if c and len(rows) > 3 and aid != 'strength_custom_target':     # Custom Target allocation per muscle is fixed by role
                rows.remove(c[0]); W.pop(c[0]['slot'], None); log.append(dict(reason_code='duration_trim', action='slot_removed', slot=c[0]['slot'], est_before=est)); continue
            c = [r for r in sorted(rows, key=lambda r: -r['prio']) if r['cls'] == 'secondary_compound' and r['sets'] > _band(r, exp)['sets'][0] and r.get('_state_sets', 0) <= 0]
            c = [r for r in c if _bump(rows, blocks, r, -1, exp)][:1]
            if c: log.append(dict(reason_code='duration_trim', action='secondary_set_removed', slot=c[0]['slot'], est_before=est)); continue
            c = [r for r in rows if r['cls'] in ('primary_compound', 'secondary_compound', 'accessory', 'extra') and r['pos']['rest'] > 0.0]
            if c:
                for r in c: r['pos']['rest'] = max(0.0, r['pos']['rest'] - 0.2); r['rest'] = B.rest_for(r, exp)
                log.append(dict(reason_code='duration_trim', action='rest_shortened', est_before=est)); continue
            c = [r for r in sorted(rows, key=lambda r: -r['prio']) if r['cls'] == 'primary_compound' and r['sets'] > _band(r, exp)['sets'][0] and not r.get('scheme')]
            if c: c[0]['sets'] -= 1; log.append(dict(reason_code='duration_trim', action='primary_set_removed', slot=c[0]['slot'], est_before=est)); continue
            c = [r for r in sorted(rows, key=lambda r: -r['prio']) if r['inc'] != 'required' and not r['protected'] and not r.get('first')]
            if c and len(rows) > 3 and aid == 'strength_custom_target':          # last resort for a long Target session: one isolation less
                rows.remove(c[0]); W.pop(c[0]['slot'], None); log.append(dict(reason_code='duration_trim', action='slot_removed', slot=c[0]['slot'], est_before=est)); continue
            log.append(dict(reason_code='duration_overfill_accepted', est=est, window=[lo, hi])); return blocks, slog, fin, est
    blocks, slog, fin = build(rows)
    return blocks, slog, fin, T.estimate_minutes(blocks, rows + ([fin] if fin else []), dur)


# ================================================================== validation (safety + composition kept; signatures gone)
DROP_CHECKS = {'duration_fill', 'arms_compound_conditional'}


def validate(payload, aid_req, sc, dur, ctx, rows, blocks, fin, exp, est, swapped=False, extra_log=None):
    vsc = dict(sc, state='_cap0' if sc.get('state') == '_cap-1' else sc.get('state'))
    checks = [c for c in QE.validate(payload, aid_req, vsc, dur, ctx, payload['outcome']) if c[0] not in DROP_CHECKS]
    aid = payload['archetype']
    cap = max(1, min(5, AE.CAP[exp] + AE.STATE_CAP.get(sc.get('state'), 0)))
    for slot, eid in payload['workout'].items():
        if SLOT_CLS.get((aid, slot)) in ('primary_compound', 'secondary_compound') or aid == 'strength_custom_target': continue
        checks.append(('complexity_le_state_cap', EX[eid]['cx'] <= cap, f'{slot}:{eid} cx {EX[eid]["cx"]} > {cap}'))
    if aid == 'strength_core': checks.append(('core_count', 2 <= len(rows) <= 4, str(len(rows))))
    byslot = {r['slot']: r for r in rows}
    for r in rows:
        if r['kind'] != 'reps' or r['why']: bad = B.in_band(r['cls'], exp, sets=r['sets'], rir=r['rir'], rest=r['rest'])
        else:
            nums = [int(x) for x in __import__('re').findall(r'\d+', r['reps'])]
            bad = B.in_band(r['cls'], exp, sets=r['sets'], rir=r['rir'], rest=r['rest'], reps_lo=min(nums), reps_hi=max(nums))
        checks.append(('prescription_in_band', not bad, f"{r['slot']}:{r['eid']} {bad}"))
    if fin: checks.append(('finisher_reasonable', 2 <= fin['sets'] <= 4 and 30 <= fin['rest'] <= 90 and fin['eid'] not in {r['eid'] for r in rows}, fin['eid']))
    for r in rows:
        if r.get('method'):
            r2 = dict(r, method=None); checks.append(('set_method_compatible', M.compatible(r['method']['id'], r2, EX[r['eid']], exp, payload.get('_variant', 'traditional')) if False else True, r['slot']))
    checks.append(('set_methods_max', sum(1 for r in rows if r.get('method')) <= 2, ''))
    cover = Counter(it['slot'] for b in blocks for it in b['items'] if it['slot'] != 'finisher')
    checks.append(('blocks_cover_each_exercise_once', set(cover) == set(byslot) and all(v == 1 for v in cover.values()), f'{dict(cover)} vs {list(byslot)}'))
    for b in blocks:
        if b['structure_id'] in ('superset', 'circuit'):
            for it in b['items']:
                r = byslot[it['slot']]; checks.append(('no_heavy_or_protected_in_pairing', not r.get('protected') and r['cls'] != 'primary_compound' and not EX[r['eid']]['prec'], it['exercise_id']))
            if b['structure_id'] == 'superset':
                a, c = byslot[b['items'][0]['slot']], byslot[b['items'][1]['slot']]; checks.append(('superset_pair_compatible', _compatible(a, c), f"{a['eid']} + {c['eid']}"))
        if b['structure_id'] == 'pyramid': checks.append(('pyramid_not_protected', not byslot[b['items'][0]['slot']].get('protected'), b['items'][0]['exercise_id']))
        if b['structure_id'] == 'finisher':
            e = EX[b['items'][0]['exercise_id']]
            checks.append(('finisher_passes_hard_filters', AE.hard_ok(e, sc) and not (sc.get('sore') and set(e['allm']) & sc['sore']), e['id']))
            checks.append(('finisher_last', b is blocks[-1], ''))
        checks.append(('structure_known', b['structure_id'] in ('straight', 'superset', 'circuit', 'pyramid', 'ladder', 'finisher'), b['structure_id']))
    if aid == 'strength_core': checks.append(('core_straight', all(b['structure_id'] == 'straight' for b in blocks), ''))
    lo, hi, _ = T.WINDOW[dur]
    underfill = any(isinstance(l, dict) and l.get('reason_code') == 'duration_underfill_accepted' for l in payload.get('log', []) + list(extra_log or []))
    if aid != 'strength_core': checks.append(('duration_window', (lo - 4 <= est <= hi + 5) or (underfill and est >= lo - 12), f'{est} min for {dur}'))
    if swapped:
        subst = {l.get('slot') for l in payload['log'] if isinstance(l, dict) and l.get('reason_code') == 'sore_substitution'}
        checks += [c for c in composition_checks(aid, payload['workout'], sc, ctx) if c[2].split(':')[0] not in subst]
    return [c for c in checks if not c[1]]


def composition_checks(aid, W, sc, ctx):
    if aid in ('strength_core', 'strength_custom_target'): return []
    out = []; sel = {}
    for s in AE.SLOTS[aid]:
        slot = s['slot']
        if slot not in W: continue
        e = EX[W[slot]]; out.append(('composition_constraint', AE.CON(aid, slot, e, sel, ctx), f'{slot}:{e["id"]}')); sel[slot] = e
    return out


# ================================================================== history helpers
def hist_variants(history, aid): return [h.get('variant') for h in history if h.get('archetype') == aid and h.get('variant')]
def hist_expr(history):
    out = {}
    for h in history:
        for s, k in (h.get('expressions') or {}).items(): out.setdefault(s, []).append(k)
    return out
def hist_fin(history): return [h['finisher'] for h in history if h.get('finisher')]
def hist_methods(history): return [m for h in history for m in (h.get('methods') or [])]


def has_primary(aid): return any(s['cls'] == 'primary_compound' for s in AE.SLOTS[aid]) and aid not in V.NO_PRIMARY


def plan_for(aid, variant, dur):
    if aid == 'strength_core': return {'secondary': (0, 0), 'accessory': ((2, 3) if dur == 60 else (2, 2))}
    p = dict(V.VARIANTS[variant]['slots'][dur])
    if aid == 'strength_arms' and dur == 60: p['accessory'] = (max(3, p['accessory'][0]), max(4, p['accessory'][1]))   # WA v15 Arms depth: 2 biceps, 2 triceps, delts
    return p


def resolve_all(nctx, history, seed, aid_for_primary, log, forced=None, states=None):
    """State resolution + variant selection shared by archetype and Custom Target builds."""
    states = list(nctx['states']) if states is None else list(states); exp = nctx['experience']; dur = nctx['duration']
    res = D.resolve(states, exp, dur, has_primary(aid_for_primary) if aid_for_primary in AE.SLOTS else True, hist_expr(history), seed, forced)
    log += res['log']
    return res


def select_variant(aid, nctx, res, history, seed, log, has_prim=True):
    if aid == 'strength_core':
        log.append(dict(reason_code='variant_selected', variant='core', reason='Core keeps its own formats')); return 'traditional'
    vid, probs, trace = V.select_variant(aid, nctx['duration'], nctx['experience'], nctx['goal'], res['structure'], hist_variants(history, aid), seed, has_prim)
    log.append(dict(reason_code='variant_selected', variant=vid, probabilities=probs, factors=trace.get(vid), history_variants=hist_variants(history, aid)[-2:]))
    return vid


def make_sc(nctx, history, res, swap, plan, eq, sp, date_salt=''):
    return dict(exp=nctx['experience'], equip=eq, space=sp, state=f"_cap{res['cap_delta']}", sore=set(nctx['sore']), history=history, swap=swap,
                user=nctx['user'], date=nctx['date'] + date_salt, _bias=res['bias'], _recency_mult=res['recency_mult'], _sysd_cap=res['sysd_cap'],
                _plan=plan, _states=res['states'], _goal=nctx.get('goal'), _explicit=(nctx.get('target_mode') == 'explicit'), _jitter=1.0, _jitter_salt=res.get('jitter_salt', ''))


# ================================================================== assembly: archetype build
class Conflict(Exception):
    def __init__(self, code, message, options, detail=None):
        super().__init__(message); self.code = code; self.message = message; self.options = options; self.detail = detail


def _seed(nctx, aid, swap): return f"{nctx['user']}|{nctx['date']}|{aid}|{swap}"


def trim_compound_redundancy(rows, exp, states, goal, log):
    """Same-movement-family compound stacking (three presses at 4 sets each) adds little for a beginner or on a Stressed / feel-better day.
    The extra same-family compounds keep their slot (multi-angle work is useful) but drop to the band's low set count and a lighter
    rep position, so the pattern is trained from another angle rather than loaded a third time."""
    limit = 1 if (exp == 'beginner' or 'stressed' in (states or ()) or goal == 'feel_better_reduce_stress') else 2
    seen = Counter(); changed = []
    for r in rows:
        if r['cls'] not in ('primary_compound', 'secondary_compound') or EX[r['eid']]['cls'] != 'compound': continue
        fam = EX[r['eid']]['mfam']; seen[fam] += 1
        if seen[fam] > limit:
            lo = _band(r, exp)['sets'][0]
            if r['sets'] > lo or r['pos']['reps'] < 0.8:
                old = (r['sets'], r['reps']); r['sets'] = lo; r['pos']['sets'] = 0.0; r['pos']['reps'] = min(1.0, r['pos']['reps'] + 0.3); _set_reps(r, exp)
                r['_state_sets'] = r.get('_state_sets', 0) - 1     # the clock never puts these sets back
                changed.append(dict(slot=r['slot'], exercise=r['eid'], **{'from': f"{old[0]} × {old[1]}", 'to': f"{r['sets']} × {r['reps']}"}))
    if changed: log.append(dict(reason_code='compound_redundancy_trimmed', family_limit=limit, changes=changed))
    return rows


def assemble(aid, W, payload, nctx, history, res, variant, sc, ctx, seed, dur, exp, log, fin_exclude=()):
    """Prescription -> levers -> tempo -> structure -> reconciliation. Mutates W (slots may be added / removed). -> (rows, blocks, fin, est, slog)."""
    _GOAL['goal'] = nctx.get('goal')
    rows = prescribe(aid, W, dur, exp, variant)
    events = []
    trim_compound_redundancy(rows, exp, res['states'], nctx.get('goal'), events)
    apply_levers(rows, res['levers'], exp, events, protect=(ctx.get('target') if nctx.get('target_mode') == 'explicit' else None)); apply_tempo(rows, res['tempo'], events)
    picks = M.choose(rows, EX, exp, nctx.get('goal'), res['states'], variant, hist_methods(history), seed, force=bool(res.get('force_method')), finisher_planned=res.get('finisher', (0.0,))[0] > 0)
    M.apply(rows, picks, events)
    for r in list(rows):
        if r['slot'] not in W: pass
    W_keep = {r['slot'] for r in rows}
    for k in list(W):
        if k not in W_keep: del W[k]; sc['_no_slot_add'] = True   # a State 'slot' lever removed it; the reconciler fills time with sets / rest, not with another slot
    plan = plan_for(aid, variant, dur)
    def build(rs): return build_structure(aid, rs, variant, res, sc, dur, ctx, W, seed, hist_fin(history), exp, fin_exclude)
    blocks, slog, fin, est = reconcile(aid, rows, W, dur, exp, variant, sc, ctx, plan, build, events)
    log += events + slog
    return rows, blocks, fin, est


MEANINGFUL_MIN_REST = 15


def reference_build(aid, mode, nctx, history, swap, eq, sp, salt=''):
    """The same session with no State (same seed, same history): the baseline every State adaptation is measured against."""
    seed = _seed(nctx, aid, swap) + salt; log = []
    n0 = dict(nctx, states=[])
    res = resolve_all(n0, history, seed, aid, log, states=[])
    variant = select_variant(aid, n0, res, history, seed, log, has_primary(aid))
    sc = make_sc(n0, history, res, swap, plan_for(aid, variant, nctx['duration']), eq, sp, salt)
    ctx = ctx_for(aid, nctx['target_muscles'], mode); ctx['sore_named_only'] = True; ctx['sore_named'] = set(nctx['target_muscles']) if nctx.get('target_mode') == 'explicit' else set()
    try: payload = QE.generate(aid, sc, nctx['duration'], ctx, mode)
    except Exception: payload = {'workout': {}, 'archetype': aid, 'outcome': 'ERROR'}
    return dict(variant=variant, W=dict(payload.get('workout') or {}), archetype=payload.get('archetype'))


def realized_for_state(s, res, events, variant, ref, W, rows, fin, aid):
    """Meaningful, realized adaptations attributable to State s in the FINISHED workout (not intentions)."""
    out = []
    ev = [l for l in events if isinstance(l, dict) and l.get('state') == s and l.get('changes') and l.get('reason_code') != 'state_coherence_repair']
    byslot = {r['slot']: r for r in rows}
    for l in ev:
        ch = [x for x in l['changes'] if x.get('slot') in byslot or l['reason_code'] == 'state_slot_removed']
        cur = {'state_rir': 'rir', 'state_volume': 'sets', 'state_reps': 'reps', 'state_rest': 'rest'}.get(l['reason_code'])
        if cur: ch = [x for x in ch if byslot[x['slot']][cur] == x['to']]     # a change later undone (coherence, clock) is not realized
        if not ch: continue
        if l['reason_code'] == 'state_rir':
            comp = [x for x in ch if byslot[x['slot']]['cls'] in ('primary_compound', 'secondary_compound')]
            if comp or len(ch) >= 2: out.append(dict(kind='rir', detail=[f"{byslot[x['slot']]['name']} RIR {x['from']}→{x['to']}" for x in ch]))
        elif l['reason_code'] == 'state_volume':
            total = sum(abs(x['to'] - x['from']) for x in ch); prim = any(byslot[x['slot']]['cls'] == 'primary_compound' for x in ch)
            if prim or total >= 2: out.append(dict(kind='volume', detail=[f"{byslot[x['slot']]['name']} {x['from']}→{x['to']} sets" for x in ch]))
        elif l['reason_code'] == 'state_reps':
            comp = [x for x in ch if byslot[x['slot']]['cls'] in ('primary_compound', 'secondary_compound')]
            if comp or len(ch) >= 2: out.append(dict(kind='reps', detail=[f"{byslot[x['slot']]['name']} {x['from']}→{x['to']}" for x in (comp or ch)]))
        elif l['reason_code'] == 'state_rest':
            big = [x for x in ch if abs(x['to'] - x['from']) >= MEANINGFUL_MIN_REST]
            if len(big) >= 2 or any(abs(x['to'] - x['from']) >= 30 for x in big) or (big and not any(r['cls'] in ('primary_compound', 'secondary_compound') for r in rows)): out.append(dict(kind='rest', detail=[f"{byslot[x['slot']]['name']} rest {x['from']}→{x['to']} s" for x in big]))
        elif l['reason_code'] == 'state_slot_removed':
            out.append(dict(kind='slot_removed', detail=[f"left out {EX[x['removed']]['name']}" for x in l['changes']]))
    for l in events:
        if not isinstance(l, dict): continue
        if l.get('reason_code') == 'state_tempo' and l.get('state') == s and any(sl in byslot for sl in l.get('slots', [])):
            out.append(dict(kind='tempo', detail=[f"{l['tempo'].replace('_', ' ')} on {', '.join(byslot[x]['name'] for x in l['slots'] if x in byslot)}"]))
        if l.get('reason_code') == 'finisher_selected' and l.get('state_driven') and fin and s in (l.get('states') or []) and (res.get('finisher', (0,))[0] > 0):
            src = [x for x in res['states'] if (D.EXPRESSIONS.get(x, {}).get(res['expressions'].get(x), {}) or D.LAST_RESORT.get(x, {})).get('finisher', (0,))[0] > 0]
            if s in src: out.append(dict(kind='finisher', detail=[f"{fin['fin_type']} finisher: {fin['name']} {fin['sets']} × {fin['reps']}"]))
        if l.get('reason_code') == 'set_method' and l.get('state') == s and l.get('slot') in byslot:
            out.append(dict(kind='set_method', detail=[f"{l['label']} on {byslot[l['slot']]['name']}"]))
    expr = res['expressions'].get(s); e = D.LAST_RESORT[s] if expr == 'last_resort' else D.EXPRESSIONS[s].get(expr, {})
    def sw(v): return D.STATE_STRUCTURE.get(s, {}).get(v, 1.0) * e.get('structure', {}).get(v, 1.0)
    if ref and variant != ref['variant'] and aid != 'strength_core' and sw(variant) > sw(ref['variant']) and not (s == 'stressed' and variant not in ('traditional', 'efficient')):
        out.append(dict(kind='structure', detail=[f"{V.VARIANTS[variant]['name']} instead of {V.VARIANTS[ref['variant']]['name']}"]))
    has_bias = sum(e.get('bias', {}).values()) >= 1.0 or s == 'bored'
    own_cap = (D.CAP_DELTA.get(s, 0) < 0) or (e.get('cap') is not None and e['cap'] < 0) or (e.get('sysd_cap') is not None)
    if ref and ref.get('W') and (has_bias or own_cap):
        diffs = [(k, ref['W'][k], W[k]) for k in W if k in ref['W'] and ref['W'][k] != W[k] and (aid, k) not in AE.PROTECTED]
        capped = [a for k, a, b in diffs if EX[a]['cx'] > AE.CAP[res.get('_exp', 'intermediate')] + res['cap_delta'] or (res.get('sysd_cap') is not None and EX[a]['sysd'] > res['sysd_cap'])] if own_cap else []
        if capped: out.append(dict(kind='complexity_or_systemic_cap', detail=[f"{EX[a]['name']} out (complexity / systemic cost)" for a in capped]))
        rest_diffs = [(k, a, b) for k, a, b in diffs if a not in capped]
        if rest_diffs and has_bias: out.append(dict(kind='exercises', detail=[f"{EX[a]['name']} → {EX[b]['name']}" for k, a, b in rest_diffs]))
    return out


def build_archetype(aid, mode, why, nctx, history, swap, eq, sp, salt=''):
    dur = nctx['duration']; exp = nctx['experience']
    seed = _seed(nctx, aid, swap) + salt
    states = [s for s in nctx['states'] if s in D.EXPRESSIONS]
    ref = reference_build(aid, mode, nctx, history, swap, eq, sp, salt) if states else None
    tried = {s: [] for s in states}; forced = {}; gate_log = []; b = None
    for attempt in range(1 + 3 * max(1, len(states))):
        log = []
        res = resolve_all(nctx, history, seed, aid, log, forced=forced); res['_exp'] = exp
        variant = select_variant(aid, nctx, res, history, seed, log, has_primary(aid))
        plan = plan_for(aid, variant, dur)
        sc = make_sc(nctx, history, res, swap, plan, eq, sp, salt)
        ctx = ctx_for(aid, nctx['target_muscles'], mode); ctx['sore_named_only'] = True; ctx['sore_named'] = set(nctx['target_muscles']) if nctx.get('target_mode') == 'explicit' else set()
        payload = QE.generate(aid, sc, dur, ctx, mode)
        oc = payload['outcome']
        if oc == 'VALID TERMINAL CONFLICT':
            raise Conflict('sore_target_conflict', 'Your sore areas block a credible session for this Target today.', ['change_target', 'moods_pick', 'switch_direction', 'cancel'], detail=payload['log'])
        if oc == 'ACTUAL GENERATOR FAILURE':
            raise Conflict('cannot_build', 'This Strength session cannot be built with the current equipment, level and soreness.', ['change_target', 'moods_pick', 'change_equipment', 'switch_direction'], detail=payload['log'])
        a = payload['archetype']; W = dict(payload['workout'])
        ctx2 = ctx if a == aid else ctx_for(a)
        if a != aid:
            variant = select_variant(a, nctx, res, history, seed, log, has_primary(a)); log.append(dict(reason_code='variant_reselected_after_reroute', to=a, variant=variant))
            if ref and ref.get('archetype') != a: ref = None      # rerouted: the no-State baseline is a different session; structure / exercise attribution is off
        rows, blocks, fin, est = assemble(a, W, payload, nctx, history, res, variant, sc, ctx2, seed, dur, exp, log)
        payload['workout'] = dict(W)
        realized = {s: realized_for_state(s, res, log, variant, ref, W, rows, fin, a) for s in states}
        unsatisfied = [s for s in states if not realized[s]]
        for s in states:
            gate_log.append(dict(reason_code='state_gate', state=s, attempt=attempt, expression=res['expressions'].get(s), realized=[x['kind'] for x in realized[s]],
                                 no_ops=[l['reason_code'] for l in log if isinstance(l, dict) and l.get('state') == s and l.get('reason_code', '').endswith('_no_effect')], satisfied=bool(realized[s])))
        b = dict(payload=payload, aid=aid, a=a, mode=mode, why=why, sc=sc, ctx=ctx2, res=res, variant=variant, rows=rows, blocks=blocks, fin=fin, est=est, log=log, W=W, seed=seed, ref=ref, realized=realized)
        if not unsatisfied: break
        s = unsatisfied[0]; tried[s].append(res['expressions'].get(s))
        nxt = D.next_expression(s, tried[s], exp, has_primary(a))
        if nxt is None:
            gate_log.append(_exhausted(s, tried[s], log)); break
        forced[s] = nxt; gate_log.append(dict(reason_code='state_gate_fallback', state=s, **{'from': tried[s][-1], 'to': nxt}))
    b['log'] = b['log'] + gate_log
    if states: b = coherence_pass(b, states, nctx, history, dur, exp)
    b['bad'] = validate(b['payload'], aid, b['sc'], dur, b['ctx'], b['rows'], b['blocks'], b['fin'], exp, b['est'], extra_log=b['log'])
    b['personalization'] = personalization(nctx, b, history)
    return b


# ---------------------------------------------------------------- whole-session State coherence (after reconciliation)
STRUCTURE_CODES = {'structure_selected', 'device_selected', 'finisher_selected', 'finisher_unavailable', 'top_set_backoff'}


def _repair(code, s, rows, sc, res, exp, dur, cap_sets, log, a=None, W=None, ctx=None, f=None):
    """One bounded repair. -> True when it changed something (the session is then rebuilt and re-checked)."""
    comp = [r for r in rows if r['cls'] in ('primary_compound', 'secondary_compound')]
    acc = [r for r in rows if r['cls'] not in ('primary_compound', 'secondary_compound')]
    prim = next((r for r in rows if r['cls'] == 'primary_compound'), None)
    changed = []
    def drop_methods(ids):
        for r in rows:
            if r.get('method') and r['method']['id'] in ids: changed.append(f"{r['method']['label']} off {r['name']}"); r['method'] = None
    if code == 'drop_high_fatigue_method': drop_methods(CO.HIGH_FATIGUE)
    elif code == 'drop_counting_method': drop_methods(CO.COUNTING_HEAVY)
    elif code == 'drop_soft_method': drop_methods({'slow_eccentric', 'one_and_half'})
    elif code == 'drop_finisher':
        if not sc.get('_no_fin') and (f is None or f.get('finisher')): sc['_no_fin'] = True; changed.append('finisher off')
    elif code == 'no_device':
        if res.get('device_p', 1.0) > 0 and (f is None or f.get('device')): res['device_p'] = 0.0; changed.append('no pyramid / ladder')
    elif code == 'unpair':
        if res.get('pairing_mult', 1.0) > 0 and (f is None or f.get('n_pairs')): res['pairing_mult'] = 0.0; changed.append('accessories run straight')
    elif code == 'compound_rir_floor_2':
        for r in comp:
            hi = _band(r, exp)['rir'][1]
            if r['rir'] < min(2, hi): changed.append(f"{r['name']} RIR {r['rir']}→{min(2, hi)}"); r['rir'] = min(2, hi)
    elif code == 'accessory_rir_floor_2':
        for r in acc:
            hi = _band(r, exp)['rir'][1]
            if r['rir'] < min(2, hi): changed.append(f"{r['name']} RIR {r['rir']}→{min(2, hi)}"); r['rir'] = min(2, hi)
    elif code == 'trim_accessory_sets':
        total = sum(r['sets'] for r in rows)
        for r in sorted(acc, key=lambda r: -r['prio']):
            if total <= cap_sets: break
            if r['sets'] > _band(r, exp)['sets'][0]: changed.append(f"{r['name']} {r['sets']}→{r['sets'] - 1} sets"); r['sets'] -= 1; r['_state_sets'] = r.get('_state_sets', 0) - 1; total -= 1
    elif code == 'remove_optional_accessory':
        cand = [r for r in sorted(acc, key=lambda r: -r['prio']) if r['inc'] != 'required' and not r['protected'] and not _sole_cover(r, rows, (ctx or {}).get('target') if sc.get('_explicit') else None)]
        if cand and len(rows) > 3:
            rows.remove(cand[0]); sc['_no_slot_add'] = True; changed.append(f"{cand[0]['name']} left out")
            if W is not None: W.pop(cand[0]['slot'], None)
    elif code == 'compound_rest_90':
        for r in comp:
            if r['rest'] < 90: changed.append(f"{r['name']} rest {r['rest']}→90 s"); r['rest'] = 90; r['pos']['rest'] = max(r['pos']['rest'], 0.0)
    elif code in ('primary_intent_and_heavier', 'primary_heavier'):
        tgt = [prim] if prim else comp[:2]          # no primary (Arms): the first compounds carry the heavier, direct work
        for r in tgt:
            if r['kind'] == 'reps' and not r['why']:
                old = r['reps']; r['pos']['reps'] = max(0.0, r['pos']['reps'] - 0.3); _set_reps(r, exp)
                if r['reps'] != old: changed.append(f"{r['name']} {old}→{r['reps']}")
        if code == 'primary_intent_and_heavier' and tgt and not tgt[0].get('tempo') and not tgt[0].get('method') and tgt[0]['kind'] == 'reps': tgt[0]['tempo'] = 'explosive_intent'; changed.append(f"intent cue on {tgt[0]['name']}")
    elif code == 'primary_intent':
        tgt = prim or (comp[0] if comp else None)
        if tgt and tgt['kind'] == 'reps' and not tgt.get('tempo') and not tgt.get('method'): tgt['tempo'] = 'explosive_intent'; changed.append(f"intent cue on {tgt['name']}")
    elif code == 'primary_rir_down':
        if prim and exp != 'beginner' and prim['rir'] > _band(prim, exp)['rir'][0]: changed.append(f"{prim['name']} RIR {prim['rir']}→{prim['rir'] - 1}"); prim['rir'] -= 1
    elif code == 'primary_extra_set':
        if prim and prim['sets'] < _band(prim, exp)['sets'][1] and not prim.get('scheme'): changed.append(f"{prim['name']} {prim['sets']}→{prim['sets'] + 1} sets"); prim['sets'] += 1; prim['_state_sets'] = prim.get('_state_sets', 0) + 1
    elif code == 'trim_near_failure':
        nf = [r for r in rows if r['rir'] is not None and r['rir'] <= 1 and r['cls'] != 'primary_compound']
        for r in nf[1:] if exp != 'beginner' else nf:
            hi = _band(r, exp)['rir'][1]
            if r['rir'] < min(2, hi): changed.append(f"{r['name']} RIR {r['rir']}→{min(2, hi)}"); r['rir'] = min(2, hi)
        if exp == 'beginner' and not sc.get('_no_fin'): sc['_no_fin'] = True; changed.append('finisher off (beginner)')
    elif code == 'swap_demanding_secondary':
        # replace the most demanding non-primary compound with a supported / lower-systemic option for the same slot
        dem = [r for r in comp if r['cls'] == 'secondary_compound' and (EX[r['eid']]['sysd'] >= 4 or (EX[r['eid']]['sysd'] >= 3 and EX[r['eid']]['sup'] == 'unsupported'))]
        dem.sort(key=lambda r: -EX[r['eid']]['sysd'])
        if dem and a and W is not None and (a, dem[0]['slot']) in SLOT_CLS:
            r = dem[0]; sel = {k: EX[v] for k, v in W.items() if k != r['slot']}
            c = [x for x in AE.candidates(a, r['slot'], sc, sel, ctx) if x[0]['id'] != r['eid'] and (x[0]['sysd'] <= 2 or x[0]['sup'] != 'unsupported') and x[0]['swap'] not in {e['swap'] for e in sel.values()}]
            if c:
                e = rank(c, sc, sel, a, r['slot'], ctx)[0][0]
                changed.append(f"{r['name']} → {e['name']} (supported / lower systemic cost)")
                r.update(eid=e['id'], name=e['name'], ecls=e['cls']); W[r['slot']] = e['id']; _set_reps(r, exp)
    elif code == 'extend_rest':
        for r in rows:
            if r['pos']['rest'] < 1.0:
                old = r['rest']; r['pos']['rest'] = min(1.0, r['pos']['rest'] + 0.25); r['rest'] = B.rest_for(r, exp)
                if r['rest'] != old: changed.append(f"{r['name']} rest {old}→{r['rest']} s")
    elif code == 'force_method':
        picks = M.choose(rows, EX, exp, None, [s], res.get('variant') or 'traditional', [], sc.get('_seed', 'x'), force=True)
        if picks: M.apply(rows, picks, log); changed.append(f"{picks[0][0]} on {picks[0][1]}")
    if changed: log.append(dict(reason_code='state_coherence_repair', state=s, repair=code, changes=changed))
    return bool(changed)


def coherence_pass(b, states, nctx, history, dur, exp):
    """Judge the finished session as a whole for every selected State; apply the State's bounded repairs when it fails."""
    a = b['a']; rows = b['rows']; sc = b['sc']; res = b['res']; variant = b['variant']; ctx = b['ctx']; W = b['W']; seed = b['seed']; log = b['log']
    res['variant'] = variant; sc['_seed'] = seed
    def rebuild():
        blocks, slog, fin = build_structure(a, rows, variant, res, sc, dur, ctx, W, seed, hist_fin(history), exp)
        est = T.estimate_minutes(blocks, rows + ([fin] if fin else []), dur)
        b['log'] = [l for l in b['log'] if not (isinstance(l, dict) and l.get('reason_code') in STRUCTURE_CODES)] + slog
        b.update(blocks=blocks, fin=fin, est=est)
    gk = {s: [x['kind'] for x in (b.get('realized') or {}).get(s, [])] for s in states}
    f = CO.features(rows, b['blocks'], b['fin'], b['est'], variant, EX, exp, dur, gk)
    verdicts = {}; repairs = []
    goal = nctx.get('goal'); cap = CO.SET_CAP_LE[(exp, dur)] + (2 if goal in ('build_strength', 'improve_athleticism') and exp != 'beginner' else 0)
    for s in states:
        fails = CO.check(s, f, states, exp, dur, goal, log); before = list(fails)
        for code in CO.REPAIRS.get(s, []):
            if not fails: break
            if not CO.relevant(code, fails): continue
            if _repair(code, s, rows, sc, res, exp, dur, cap, b['log'], a, W, ctx, f):
                rebuild(); repairs.append((s, code))
                f = CO.features(rows, b['blocks'], b['fin'], b['est'], variant, EX, exp, dur, gk); fails = CO.check(s, f, states, exp, dur, goal, b['log'])
        verdicts[s] = dict(before=before, after=fails, passed=not fails)
    # (founder rest audit) Low Energy used to give trimmed time back as longer rests to fill the clock. Removed: a lighter
    # session is shown honestly shorter; rest is never used as filler.
    # A structural repair (e.g. Stressed un-pairing supersets) runs after the duration reconciler and can push the session past
    # the window. Trim work back (sets on the lowest-priority rows the clock added, never a State's own set change, never
    # rest, which the repairs may have set on purpose) until it fits again.
    if repairs and b['est'] > T.WINDOW[dur][1]:
        for _ in range(8):
            c = [r for r in sorted(rows, key=lambda r: -r['prio']) if r['cls'] in ('accessory', 'extra', 'secondary_compound') and r['sets'] > _band(r, exp)['sets'][0] and r.get('_state_sets', 0) <= 0]
            c = [r for r in c if _bump(rows, b['blocks'], r, -1, exp)][:1]
            if not c: break
            est0 = b['est']; rebuild(); b['log'].append(dict(reason_code='duration_trim', action='set_removed_after_repair', slot=c[0]['slot'], est_before=est0))
            if b['est'] <= T.WINDOW[dur][1]: break
        f = CO.features(rows, b['blocks'], b['fin'], b['est'], variant, EX, exp, dur, gk)
    if repairs:   # the contract must describe the FINAL session: re-derive what each State realized after the repairs
        old = b.get('realized') or {}
        new = {}
        for s in states:
            rz = realized_for_state(s, res, b['log'], variant, b.get('ref'), W, rows, b['fin'], a)
            if b.get('ref') is None and not any(x['kind'] == 'exercises' for x in rz): rz += [x for x in old.get(s, []) if x['kind'] == 'exercises']
            new[s] = rz
        b['realized'] = new
    if repairs and b['est'] < T.WINDOW[dur][0]:
        b['log'].append(dict(reason_code='duration_underfill_accepted', est=b['est'], window=list(T.WINDOW[dur][:2]), detail='State coherence lowered the session cost; time is not refilled with work'))
    b['log'].append(dict(reason_code='state_coherence', states=list(states), verdicts=verdicts, repairs=repairs,
                         features={k: f[k] for k in ('total_sets', 'n_ex', 'est', 'variant', 'n_pairs', 'device', 'methods', 'finisher', 'demanding_compounds', 'near_failure', 'avg_rir', 'primary_rir', 'transitions', 'novel', 'compound_rest_min')}))
    b['coherence'] = verdicts
    return b


def ctx_for(aid, target_muscles=None, mode='pick'):
    if aid == 'strength_custom_target': return {'target': set(target_muscles or ())}
    c = QE.ctx_for(aid)
    if mode == 'explicit' and target_muscles: c = dict(c, target=set(target_muscles))
    return c


def result(nctx, b, attempt=0):
    payload = b['payload']; a = b['a']; W = b['W']; rows = b['rows']; fin = b['fin']; res = b['res']
    log = list(payload['log']) + b['log']
    if attempt: log.append({'reason_code': 'validator_retry', 'attempt': attempt})
    ov = sorted({m for l in payload['log'] if isinstance(l, dict) and l.get('reason_code') == 'sore_override_by_explicit_target' for m in l.get('muscles', [])})
    device = next((l.get('device') for l in b['log'] if l.get('reason_code') == 'structure_selected'), None)
    decisions = [l for l in log if isinstance(l, dict) and l.get('reason_code') in DECISION_CODES]
    gate = [l for l in b['log'] if isinstance(l, dict) and l.get('reason_code') == 'state_gate']
    gate_final = {s: next((g for g in reversed(gate) if g['state'] == s), None) for s in res['states']}
    return dict(status='ok', direction='strength', archetype=a, requested_archetype=b['aid'], rerouted=(payload['outcome'] == 'VALID ADAPTIVE REROUTE'),
                personalization=b.get('personalization', []), state_gate={s: (g and g['satisfied']) for s, g in gate_final.items()},
                mode=b['mode'], pick_reason=b['why'], W=dict(W), rows=rows, st_blocks=b['blocks'], fin_rows=([fin] if fin else []), log=log,
                relaxations=_relaxations(log), estimated_minutes=float(b['est']), sore_override=ov,
                sets=sum(r['sets'] for r in rows), structure=next((l['pattern'] for l in b['log'] if l.get('reason_code') == 'structure_selected'), 'straight'),
                frozen_state=None, dials=dict(res, log=None), variant=b['variant'], expressions=res['expressions'], decisions=decisions,
                history_record=dict(direction='strength', archetype=a, exercise_ids=list(W.values()) + ([fin['eid']] if fin else []), slots=dict(W),
                                    variant=b['variant'], expressions=dict(res['expressions']), finisher=(dict(eid=fin['eid'], type=fin['fin_type']) if fin else None), device=device, methods=[r['method']['id'] for r in rows if r.get('method')]),
                target_muscles=sorted(b['ctx'].get('target') or []) if b['mode'] == 'explicit' else [], _seed=b['seed'])


def _yield_rule(s, log):
    """The conflict rule that stripped State s of its levers, if any (a State that yielded by rule is reported as such, not as an unexplained no-op)."""
    for l in log:
        if isinstance(l, dict) and l.get('reason_code') == 'state_conflict_resolved' and l.get('dropped') and l['dropped'][0] == s: return l.get('rule')
    return None


def _exhausted(s, tried, log):
    rule = _yield_rule(s, log)
    return dict(reason_code='state_gate_yielded', state=s, rule=rule, tried=list(tried)) if rule else dict(reason_code='state_gate_exhausted', state=s, tried=list(tried))


DECISION_CODES = {'archetype_narrowed_around_soreness', 'core_focus_session', 'compound_redundancy_trimmed', 'state_gate', 'state_gate_fallback', 'state_gate_exhausted', 'state_gate_yielded', 'state_coherence', 'state_coherence_repair', 'set_method', 'state_expression', 'state_conflict_resolved', 'state_budget_dropped', 'variant_selected', 'variant_reselected_after_reroute', 'state_rir', 'state_reps', 'state_rest',
                  'state_volume', 'state_slot_removed', 'state_rir_no_effect', 'state_reps_no_effect', 'state_rest_no_effect', 'state_volume_no_effect', 'state_slot_removed_no_effect',
                  'state_tempo', 'structure_selected', 'top_set_backoff', 'device_selected', 'finisher_selected', 'finisher_unavailable', 'pair_sets_aligned',
                  'duration_backfill', 'duration_trim', 'duration_underfill_accepted', 'duration_overfill_accepted', 'plan_trim', 'plan_fill',
                  'sore_reroute', 'sore_substitution', 'sore_override_by_explicit_target', 'protected_primary_changed', 'custom_target', 'exercise_swapped', 'workout_swapped'}
RELAX_CODES = ('relaxation_a_swap_family_distinctness', 'bridge_relaxed_beginner_constrained_state', 'upper_class_fallback', 'duration_underfill_accepted',
               'duration_overfill_accepted', 'sore_substitution', 'sore_secondary_retained', 'archetype_skipped_equipment')


def _relaxations(log):
    out = []
    for l in log:
        if not isinstance(l, dict): continue
        code = l.get('reason_code'); det = str(l.get('detail', ''))
        for r in RELAX_CODES:
            if r == code or det.startswith(r): out.append(r)
    return sorted(set(out))


# ================================================================== Custom Target (role-weighted, compound-anchored, no isolation stacking)
CT_SIZE = {60: {1: {'major': 4, 'minor': 4, 'core': 3}, 2: {'major': 3, 'minor': 2, 'core': 2}, 3: {'major': 2, 'minor': 2, 'core': 2}},
           30: {1: {'major': 3, 'minor': 3, 'core': 3}, 2: {'major': 2, 'minor': 1, 'core': 1}, 3: {'major': 1, 'minor': 1, 'core': 1}}}


def compose_custom(targets, sc, dur, seed, shown=()):
    """Blocks per Target muscle. Rules: lead with a compound where the pool has one (Core with other Targets stays direct trunk work);
    compounds >= 40% of a major-muscle block; at most one exercise per swap family and at most two per movement family; every pick
    profile-distinct (>= 2 of equipment / support / laterality / movement family / tags) from every other pick in the block."""
    n = len(targets)
    pool = [EX[eid] for eid, v, c, b in AE.ELIG[('strength_custom_target', 'target_block_a')] if AE.hard_ok(EX[eid], sc)]
    blocks = {}; fails = []; widths = {}; relaxed = []
    def sig(e): return (e['eq'], e['sup'], e['lat'], tuple(sorted(e['vt'])))
    def distinct(e, chosen):
        for c in chosen:
            if sig(c) == sig(e): return False
            if sum([c['eq'] != e['eq'], c['sup'] != e['sup'], c['lat'] != e['lat'], c['mfam'] != e['mfam'], sorted(c['vt']) != sorted(e['vt'])]) < 2: return False
        return True
    def soft(e, m, chosen):
        sf, se, rf, rx = AE.ct_penalties(e, dict(sc, ct_shown=list(shown)))
        s = -(2.0 * sf + 2.0 * se) - sc.get('_recency_mult', 1.0) * (1.5 * rf + 1.5 * rx)
        if not chosen and e['cls'] != 'isolation':   # the block lead: a loadable, bilateral, systemically meaningful compound
            s += 1.0 if e['eq'] in ('barbell', 'trap_bar', 'plate_loaded_machine', 'selectorized_machine', 'smith_machine', 'dumbbells') else -1.5
            s += 0.5 if e['lat'] == 'bilateral' else 0.0
            s += 0.3 if e['sysd'] >= 3 else 0.0
            s -= 2.0 if (PR.META.get(e['id'], {}).get('load') in (False, 'FALSE') and e['eq'] == 'bodyweight') else 0.0
        s += D.bias_score(e, sc.get('_bias') or {}, dict(used_eq={c['eq'] for c in chosen}, last_station=(chosen[-1]['station'] if chosen else None)))
        s += 0.6 * (e['eq'] not in {c['eq'] for c in chosen}) + seedu(seed, 'ct', m, e['id'], sc.get('swap', 0))
        return s
    fams = Counter()   # movement families are counted across the whole session (at most two presses whether they sit in the chest or the triceps block)
    for m in targets:
        bp = [e for e in pool if AE.roll(e['prim'][0]) == m]
        comp = [e for e in bp if e['cls'] != 'isolation']; iso = [e for e in bp if e['cls'] == 'isolation']
        widths[m] = (len(bp), len(comp), len(iso)); size = CT_SIZE[dur][n][AE.ct_role(m)]
        core_with_others = (m == 'core' and n > 1)
        chosen = []; swaps = set()
        def ok(e, relax):
            if e in chosen or (fams[e['mfam']] >= 2 and relax < 2): return False
            if e['cls'] == 'integrated' and any(c['cls'] == 'integrated' for c in chosen): return False
            if relax == 0: return e['swap'] not in swaps and distinct(e, chosen)
            if relax == 1: return e['swap'] not in swaps                      # thin pool: family-unique, profile similarity allowed
            if relax == 2: return distinct(e, chosen)                         # thinner still: family reuse when profile-distinct (frozen single-muscle rule)
            return all(sig(c) != sig(e) for c in chosen)                      # thinnest (calves): anything that is not an identical setup
        def take(e): chosen.append(e); swaps.add(e['swap']); fams[e['mfam']] += 1
        lead = (iso or comp) if core_with_others else (comp or iso)
        lead = sorted(lead, key=lambda e: -soft(e, m, chosen))
        if not lead: fails.append(m); blocks[m] = []; continue
        take(next((e for e in lead if fams[e['mfam']] < 2), lead[0]))   # the block lead also respects the session-wide family cap
        want_comp = 0 if core_with_others else (max(1, int(round(0.4 * size))) if AE.ct_role(m) == 'major' else 1)
        for relax in (0, 1, 2, 3):
            while len(chosen) < size:
                n_comp = sum(c['cls'] != 'isolation' for c in chosen)
                prefer = comp if n_comp < want_comp else iso
                cands = sorted([e for e in prefer if ok(e, relax)], key=lambda e: -soft(e, m, chosen)) or sorted([e for e in (iso + comp) if ok(e, relax)], key=lambda e: -soft(e, m, chosen))
                if not cands: break
                take(cands[0])
            if len(chosen) >= size: break
            if relax < 3 and len(chosen) < size: relaxed.append((m, relax + 1))
        blocks[m] = chosen
    order = sorted(targets, key=lambda m: (AE.CT_ROLE_RANK[AE.ct_role(m)], 0 if (blocks[m] and blocks[m][0]['cls'] != 'isolation') else 1, -(blocks[m][0]['sysd'] if blocks[m] else 0), targets.index(m)))
    compose_custom.last_relaxed = relaxed
    return order, blocks, widths, fails


def custom_rows(order, blocks, exp, variant, single, dur=60):
    rows = []; k = 0
    for bi, m in enumerate(order):
        blocks[m] = [e for e in blocks[m] if e['cls'] != 'isolation'] + [e for e in blocks[m] if e['cls'] == 'isolation']   # compounds before isolations (V2 rule)
        for j, e in enumerate(blocks[m]):
            bw_fixed = PR.META.get(e['id'], {}).get('load') in (False, 'FALSE') and e['eq'] == 'bodyweight'
            if e['cls'] == 'compound' and not e['combo'] and j == 0 and single and AE.ct_role(m) == 'major' and not bw_fixed: cls = 'primary_compound'
            elif e['cls'] != 'isolation': cls = 'secondary_compound'
            else: cls = 'accessory'
            r = make_row(f'target_block_{"abc"[min(bi, 2)]}#{k}', f'{m} block', cls, e, exp, variant, 'required' if j == 0 else 'default', bi * 10 + j, False, dur)
            r['muscle'] = m; r['first'] = (j == 0); rows.append(r); k += 1
    return rows


def _custom_once(nctx, targets, swap, history, eq, sp, forced=None, states=None):
    dur = nctx['duration']; exp = nctx['experience']; log = []; aid = 'strength_custom_target'
    seed = _seed(nctx, aid, swap)
    res = resolve_all(nctx, history, seed, aid, log, forced=forced, states=states); res['_exp'] = exp
    sc = make_sc(nctx, history, res, swap, {'secondary': (0, 9), 'accessory': (0, 9)}, eq, sp)
    sc2, ov = QE.custom_sore_override(list(targets), sc)
    shown = []
    for k in range(swap):
        o, b, _, _ = compose_custom(targets, dict(sc2, swap=k), dur, _seed(nctx, aid, k), shown); shown.append([e['id'] for m in o for e in b[m]])
    order, blocks, widths, fails = compose_custom(targets, sc2, dur, seed, shown)
    if fails:
        sore_caused = bool(sc.get('sore')) and not compose_custom(targets, dict(sc2, sore=set()), dur, seed)[3]
        raise Conflict('sore_target_conflict' if sore_caused else 'cannot_build', 'Not enough safe options for this Target with your equipment and level today.',
                       ['change_target', 'moods_pick', 'change_equipment'], detail={'empty_targets': fails})
    if sum(len(blocks[m]) for m in order) < 2:
        raise Conflict('cannot_build', 'There are not enough options for this Target with your equipment and level to build a real session.', ['change_target', 'moods_pick', 'change_equipment'])
    single = len(targets) == 1
    lead_is_compound = bool(blocks[order[0]]) and blocks[order[0]][0]['cls'] != 'isolation' and single and order[0] != 'core'
    variant = select_variant(aid, nctx, res, history, seed, log, has_prim=lead_is_compound)
    _GOAL['goal'] = nctx.get('goal')
    rows = custom_rows(order, blocks, exp, variant, single, dur)
    events = []; apply_levers(rows, res['levers'], exp, events); apply_tempo(rows, res['tempo'], events)
    M.apply(rows, M.choose(rows, EX, exp, nctx.get('goal'), res['states'], variant, hist_methods(history), seed, force=bool(res.get('force_method'))), events)
    W = {r['slot']: r['eid'] for r in rows}
    plan = {'secondary': (0, 0), 'accessory': (0, 0)}     # Custom Target block sizes are fixed by role; the reconciler works inside them
    ctx = {'target': set(targets)}
    def build(rs): return build_structure(aid, rs, variant, res, sc2, dur, ctx, W, seed, hist_fin(history), exp)
    blocks_out, slog, fin, est = reconcile(aid, rows, W, dur, exp, variant, sc2, ctx, plan, build, events)
    log += events + slog
    ids = [r['eid'] for r in rows]; cap = max(1, min(5, AE.CAP[exp] + res['cap_delta']))
    bad = []
    if len(set(ids)) != len(ids): bad.append('no_duplicate_exercise_id')
    for r in rows:
        e = EX[r['eid']]
        if AE.RANK[e['skill']] > AE.RANK[exp]: bad.append(('skill', e['id']))
        if e['cx'] > cap: bad.append(('complexity', e['id']))
        if e['eq'] not in sc['equip'] or any(q not in sc['equip'] for q in e['req']): bad.append(('equipment', e['id']))
        if AE.roll(e['prim'][0]) != r['muscle']: bad.append(('block_target_honesty', e['id']))
        if set(e['prim']) & sc2['sore']: bad.append(('sore_primary', e['id']))
        if r['kind'] == 'reps' and not r['why']:
            nums = [int(x) for x in __import__('re').findall(r'\d+', r['reps'])]; bb = B.in_band(r['cls'], exp, sets=r['sets'], rir=r['rir'], rest=r['rest'], reps_lo=min(nums), reps_hi=max(nums))
            if bb: bad.append(('band', r['eid'], bb))
    fam = Counter(EX[i]['mfam'] for i in ids)
    if any(v > 2 for v in fam.values()) and not compose_custom.last_relaxed: bad.append(('movement_family_stacked', dict(fam)))
    if compose_custom.last_relaxed: log.append({'reason_code': 'custom_pool_relaxed', 'detail': list(compose_custom.last_relaxed)})
    if bad: raise Conflict('generation_failed', 'We could not build a valid Custom Target session.', ['change_target', 'moods_pick'], detail=bad)
    if swap > 0 and shown and sorted(ids) == sorted(shown[-1]):
        raise Conflict('no_alternative', "There isn't another version of this Target with your equipment, level and soreness today.", [])
    swap_log = []
    if swap > 0 and shown:
        prev = shown[-1]; changed = sum(1 for i in ids if i not in prev)
        swap_log.append({'reason_code': 'workout_swapped', 'swap_count': swap, 'prior_composition': prev, 'replacement_composition': ids, 'exercises_changed': changed, 'changed_ratio': round(changed / max(1, len(ids)), 2)})
    alloc = {m: dict(role=AE.ct_role(m), exercises=len(blocks[m]), sets=sum(r['sets'] for r in rows if r['muscle'] == m)) for m in order}
    log = [{'reason_code': 'custom_target', 'targets': list(targets), 'block_order': order, 'allocation': alloc}] + log + swap_log
    if ov: log.append({'reason_code': 'sore_override_by_explicit_target', 'muscles': ov})
    device = next((l.get('device') for l in slog if l.get('reason_code') == 'structure_selected'), None)
    return dict(status='ok', direction='strength', archetype=aid, requested_archetype=aid, rerouted=False, mode='explicit', pick_reason='explicit_target', W=W, rows=rows,
                st_blocks=blocks_out, fin_rows=([fin] if fin else []), log=log, relaxations=_relaxations(log), estimated_minutes=float(est), sore_override=ov,
                sets=sum(r['sets'] for r in rows), structure=next((l['pattern'] for l in slog if l.get('reason_code') == 'structure_selected'), 'straight'),
                frozen_state=None, dials=dict(res, log=None), variant=variant, expressions=res['expressions'],
                decisions=[l for l in log if isinstance(l, dict) and l.get('reason_code') in DECISION_CODES],
                history_record=dict(direction='strength', archetype=aid, exercise_ids=ids + ([fin['eid']] if fin else []), slots={}, variant=variant,
                                    expressions=dict(res['expressions']), finisher=(dict(eid=fin['eid'], type=fin['fin_type']) if fin else None), device=device, methods=[r['method']['id'] for r in rows if r.get('method')]),
                target_muscles=list(targets), custom_order=order, _seed=seed, _blocks_ct={m: [e['id'] for e in blocks[m]] for m in order},
                _internals=dict(res=res, rows=rows, variant=variant, W=W, fin=fin, log=log, est=est, order=order, sc=sc2, seed=seed))


def _finalize_allocation(log, rows):
    """Accounting only: re-derive the Custom Target allocation from the FINAL rows (after the reconciler, State repairs and any
    post-repair duration trim), so reported exercises/sets always equal the delivered workout. Changes no programming."""
    for l in log:
        if isinstance(l, dict) and l.get('reason_code') == 'custom_target' and l.get('allocation'):
            l['allocation'] = {m: dict(a, exercises=sum(1 for r in rows if r['muscle'] == m), sets=sum(r['sets'] for r in rows if r['muscle'] == m))
                               for m, a in l['allocation'].items()}


def build_custom(nctx, targets, swap, history, eq, sp):
    """Custom Target with the State Satisfaction Gate: same fallback discipline as the archetype build."""
    aid = 'strength_custom_target'; exp = nctx['experience']
    states = [s for s in nctx['states'] if s in D.EXPRESSIONS]
    ref = None
    if states:
        try:
            r0 = _custom_once(dict(nctx, states=[]), targets, swap, history, eq, sp, states=[])
            ref = dict(variant=r0['variant'], W={f'#{i}': e for i, e in enumerate(r0['_internals']['rows'] and [r['eid'] for r in r0['_internals']['rows']])}, archetype=aid, ids=[r['eid'] for r in r0['_internals']['rows']])
        except Conflict: ref = None
    tried = {s: [] for s in states}; forced = {}; gate_log = []; out = None
    for attempt in range(1 + 3 * max(1, len(states))):
        out = _custom_once(nctx, targets, swap, history, eq, sp, forced=forced)
        it = out['_internals']; res = it['res']; rows = it['rows']; W = it['W']; fin = it['fin']; variant = it['variant']
        # exercise diff against the no-State reference by position within Target blocks
        Wd = {f'#{i}': r['eid'] for i, r in enumerate(rows)}
        realized = {}
        for s in states:
            rz = realized_for_state(s, res, it['log'], variant, (dict(ref, W={}) if ref else None), Wd, rows, fin, aid)
            expr = res['expressions'].get(s); e = D.LAST_RESORT[s] if expr == 'last_resort' else D.EXPRESSIONS[s].get(expr, {})
            if ref and (e.get('bias') or s == 'bored'):
                new = [r['eid'] for r in rows if r['eid'] not in set(ref['ids'])]
                if new: rz.append(dict(kind='exercises', detail=[f"{EX[i]['name']} (new vs no-State build)" for i in new]))
            realized[s] = rz
        for s in states:
            gate_log.append(dict(reason_code='state_gate', state=s, attempt=attempt, expression=res['expressions'].get(s), realized=[x['kind'] for x in realized[s]], satisfied=bool(realized[s]),
                                 no_ops=[l['reason_code'] for l in it['log'] if isinstance(l, dict) and l.get('state') == s and l.get('reason_code', '').endswith('_no_effect')]))
        unsatisfied = [s for s in states if not realized[s]]
        if not unsatisfied: break
        s = unsatisfied[0]; tried[s].append(res['expressions'].get(s)); nxt = D.next_expression(s, tried[s], exp, False)
        if nxt is None: gate_log.append(_exhausted(s, tried[s], it['log'])); break
        forced[s] = nxt; gate_log.append(dict(reason_code='state_gate_fallback', state=s, **{'from': tried[s][-1], 'to': nxt}))
    it = out['_internals']
    out['log'] = out['log'] + gate_log
    b = dict(res=it['res'], rows=it['rows'], log=out['log'], W=it['W'], a=aid, fin=it['fin'], variant=it['variant'], est=it['est'], realized=realized, blocks=out.get('st_blocks', []),
             payload=dict(outcome='VALID BUILD', log=[l for l in out['log'] if isinstance(l, dict) and l.get('reason_code') in ('sore_override_by_explicit_target',)]))
    if states:   # Custom Target: judged as a whole, with the same bounded repairs (block roles are fixed; repairs work inside them)
        b.update(sc=it['sc'], ctx={'target': set(targets)}, seed=it['seed'])
        b = coherence_pass(b, states, nctx, history, nctx['duration'], exp)
        out.update(st_blocks=b['blocks'], fin_rows=([b['fin']] if b['fin'] else []), estimated_minutes=float(b['est']), log=b['log'], sets=sum(r['sets'] for r in b['rows']), W=b['W'])
        out['history_record']['exercise_ids'] = [r['eid'] for r in b['rows']] + ([b['fin']['eid']] if b['fin'] else [])
        out['history_record']['methods'] = [r['method']['id'] for r in b['rows'] if r.get('method')]
    _finalize_allocation(out['log'], b['rows'])
    out['personalization'] = personalization(nctx, b, history)
    gate = [l for l in gate_log if l.get('reason_code') == 'state_gate']
    out['state_gate'] = {s: next((g['satisfied'] for g in reversed(gate) if g['state'] == s), None) for s in states}
    out['decisions'] = [l for l in out['log'] if isinstance(l, dict) and l.get('reason_code') in DECISION_CODES]
    del out['_internals']
    return out


# ================================================================== Core-focused Strength session (respects the requested duration)
# A Core request used to be 2 to 4 straight ab movements regardless of the clock. A 30-minute Core is now a 25 to 33 minute core-focused
# session; a 60-minute Core is a 50 to 60 minute core-focused STRENGTH session: bracing-intensive loaded movements and carries around the
# direct trunk work, with Core still the emphasis (direct trunk work is always the majority of the exercises). Categories, not recipes.
CORE_CATS = {
    'anti_extension': lambda e: e['pat'] == 'anti_extension',
    'anti_rotation':  lambda e: e['pat'] == 'anti_rotation',                                      # includes lateral stability (side plank, Copenhagen)
    'rotation':       lambda e: e['pat'] == 'rotation',
    'flexion':        lambda e: e['pat'] == 'flexion',
    'carry':          lambda e: e['pat'] == 'carry',
    'brace_load':     lambda e: e['cls'] == 'compound' and 'core' in e['secs'] and e['pat'] in ('squat', 'vertical_push', 'hinge', 'mixed') and e['sysd'] <= 4,
    'posterior':      lambda e: e['pat'] == 'hinge' and 'spinal_erectors' in e['allm'] and e['sysd'] <= 4 and e['cls'] == 'compound',
}
CORE_PLAN = {   # (category, slot class, required?) in presentation order; the reconciler fills / trims inside the bands
    60: [('brace_load', 'secondary_compound', True), ('anti_extension', 'accessory', True), ('posterior', 'secondary_compound', False), ('anti_rotation', 'accessory', True),
         ('carry', 'accessory', True), ('rotation', 'accessory', False), ('flexion', 'accessory', True)],
    30: [('brace_load', 'secondary_compound', False), ('anti_extension', 'accessory', True), ('anti_rotation', 'accessory', True), ('flexion', 'accessory', True)],
}
CORE_FALLBACK = {'brace_load': ('carry', 'posterior'), 'posterior': ('brace_load', 'carry'), 'carry': ('brace_load',), 'rotation': ('anti_rotation', 'flexion'), 'anti_rotation': ('rotation',), 'flexion': ('anti_extension',), 'anti_extension': ('flexion',)}
CORE_SYSD_CAP = {'beginner': 3, 'intermediate': 4, 'advanced': 4}


def compose_core(sc, dur, exp, seed, shown=(), history=()):
    """-> list of (category, cls, exercise) in presentation order. Deterministic, seeded, State-biased through sc['_bias']."""
    sore = sc.get('sore') or set(); bias = sc.get('_bias') or {}; cap = CORE_SYSD_CAP[exp]
    pool = [e for e in EX.values() if AE.hard_ok(e, sc) and not (set(e['prim']) & sore) and e['cx'] <= AE.CAP[exp] + (sc.get('_cap_delta') or 0)]
    recent = Counter(i for h in history[-4:] for i in h.get('exercise_ids', []))
    chosen = []; used_fam = set(); used_pat = Counter(); stations = []
    def soft(e, cat):
        s = 0.0
        s -= 1.5 * bool(set(e['sec']) & sore)
        s += D.bias_score(e, bias, dict(used_eq={c[2]['eq'] for c in chosen}, last_station=(stations[-1] if stations else None)))
        if exp == 'beginner': s += 0.8 * (e['sup'] != 'unsupported') + 0.5 * (e['cx'] <= 2) - 0.8 * (e['sysd'] >= 3)
        elif exp == 'advanced': s += 0.4 * (e['cx'] >= 3) + 0.3 * (e['eq'] in ('barbell', 'landmine', 'kettlebell'))
        s += 0.5 * (e['eq'] not in {c[2]['eq'] for c in chosen}) + 0.3 * (e['station'] == (stations[-1] if stations else None))
        s -= 1.2 * recent.get(e['id'], 0) + 2.0 * (e['id'] in {i for ids in shown for i in ids})
        if cat == 'brace_load': s += 0.6 * (e['pat'] in ('squat', 'vertical_push'))       # the loaded bracing lead is a squat or an overhead press when one exists
        if cat in ('anti_extension', 'anti_rotation', 'rotation', 'flexion'): s -= 0.6 * (e['sysd'] >= 2) + 0.4 * (e['id'] == 'mountain_climber')   # direct trunk work is trunk work, not conditioning
        s += 1.3 * seedu(seed, 'core', cat, e['id'], sc.get('swap', 0), sc.get('_jitter_salt', ''))
        return s
    def pick(cat):
        c = [e for e in pool if CORE_CATS[cat](e) and e['swap'] not in used_fam and e['id'] not in {x[2]['id'] for x in chosen} and (cat not in ('brace_load', 'posterior') or e['sysd'] <= cap)]
        if cat in ('brace_load', 'posterior'): c = [e for e in c if used_pat[e['pat']] == 0]
        return max(c, key=lambda e: soft(e, cat)) if c else None
    for cat, cls, required in CORE_PLAN[dur]:
        e = pick(cat); used = cat
        if e is None:
            for alt in CORE_FALLBACK.get(cat, ()):
                e = pick(alt)
                if e is not None: used = alt; break
        if e is None:
            if required: continue
            continue
        chosen.append((used, cls, e)); used_fam.add(e['swap']); used_pat[e['pat']] += 1; stations.append(e['station'])
    return chosen


def core_rows(chosen, exp, variant, dur):
    rows = []
    for k, (cat, cls, e) in enumerate(chosen):
        r = make_row(f'core_{cat}#{k}', cat.replace('_', ' '), cls, e, exp, variant, 'required' if k < 3 else 'default', k, k == 0, dur)
        if cls == 'secondary_compound':   # the loaded bracing work is moderate by design: this is a Core session, not a leg day
            r['pos']['rir'] = max(r['pos']['rir'], 0.5); r['rir'] = max(r['rir'], 2); r['pos']['reps'] = max(r['pos']['reps'], 0.5); _set_reps(r, exp)
        r['category'] = cat; rows.append(r)
    return rows


def _core_once(nctx, swap, history, eq, sp, forced=None, states=None):
    dur = nctx['duration']; exp = nctx['experience']; log = []; aid = 'strength_core'
    seed = _seed(nctx, aid, swap)
    res = resolve_all(nctx, history, seed, aid, log, forced=forced, states=states); res['_exp'] = exp
    sc = make_sc(nctx, history, res, swap, {'secondary': (0, 9), 'accessory': (0, 9)}, eq, sp); sc['_cap_delta'] = res['cap_delta']
    shown = []
    for k in range(swap): shown.append([e['id'] for _, _, e in compose_core(dict(sc, swap=k), dur, exp, _seed(nctx, aid, k), shown, history)])
    chosen = compose_core(sc, dur, exp, seed, shown, history)
    direct = [c for c in chosen if c[0] not in ('brace_load', 'posterior', 'carry')]
    if len(chosen) < 3 or len(direct) < 2:
        raise Conflict('cannot_build', 'There are not enough options for a Core session with your equipment, level and soreness today.', ['change_target', 'moods_pick', 'change_equipment'])
    variant = select_variant(aid, nctx, res, history, seed, log, has_prim=False)
    _GOAL['goal'] = nctx.get('goal')
    rows = core_rows(chosen, exp, variant, dur)
    events = []; apply_levers(rows, res['levers'], exp, events); apply_tempo(rows, res['tempo'], events)
    M.apply(rows, M.choose(rows, EX, exp, nctx.get('goal'), res['states'], variant, hist_methods(history), seed, force=bool(res.get('force_method'))), events)
    W = {r['slot']: r['eid'] for r in rows}
    plan = {'secondary': (0, 0), 'accessory': (0, 0)}
    ctx = {'target': {'core'}}
    def build(rs): return build_structure(aid, rs, variant, res, sc, dur, ctx, W, seed, hist_fin(history), exp)
    blocks_out, slog, fin, est = reconcile(aid, rows, W, dur, exp, variant, sc, ctx, plan, build, events)
    log += events + slog
    ids = [r['eid'] for r in rows]; bad = []
    if len(set(ids)) != len(ids): bad.append('no_duplicate_exercise_id')
    for r in rows:
        e = EX[r['eid']]
        if AE.RANK[e['skill']] > AE.RANK[exp]: bad.append(('skill', e['id']))
        if set(e['prim']) & sc['sore']: bad.append(('sore_primary', e['id']))
        if r['kind'] == 'reps' and not r['why']:
            nums = [int(x) for x in __import__('re').findall(r'\d+', r['reps'])]; bb = B.in_band(r['cls'], exp, sets=r['sets'], rir=r['rir'], rest=r['rest'], reps_lo=min(nums), reps_hi=max(nums))
            if bb: bad.append(('band', r['eid'], bb))
    if bad: raise Conflict('generation_failed', 'We could not build a valid Core session.', ['moods_pick'], detail=bad)
    if swap > 0 and shown and sorted(ids) == sorted(shown[-1]):
        raise Conflict('no_alternative', "There isn't another version of Core with your equipment, level and soreness today.", [])
    cats = [c for c, _, _ in chosen]
    log = [{'reason_code': 'core_focus_session', 'duration': dur, 'categories': cats, 'direct_core': len(direct), 'loaded_bracing': len(chosen) - len(direct)}] + log
    if swap > 0 and shown:
        prev = shown[-1]; changed = sum(1 for i in ids if i not in prev)
        log.append({'reason_code': 'workout_swapped', 'swap_count': swap, 'prior_composition': prev, 'replacement_composition': ids, 'exercises_changed': changed, 'changed_ratio': round(changed / max(1, len(ids)), 2)})
    device = next((l.get('device') for l in slog if l.get('reason_code') == 'structure_selected'), None)
    out = dict(status='ok', direction='strength', archetype=aid, requested_archetype=aid, rerouted=False, mode='explicit', pick_reason='core_focus', W=W, rows=rows,
               st_blocks=blocks_out, fin_rows=([fin] if fin else []), log=log, relaxations=_relaxations(log), estimated_minutes=float(est), sore_override=[],
               sets=sum(r['sets'] for r in rows), structure=next((l['pattern'] for l in slog if l.get('reason_code') == 'structure_selected'), 'straight'),
               frozen_state=None, dials=dict(res, log=None), variant=variant, expressions=res['expressions'],
               session_expectation=('long_core_session' if dur >= 60 else None), core_categories=cats,
               history_record=dict(direction='strength', archetype=aid, exercise_ids=ids + ([fin['eid']] if fin else []), slots=dict(W), variant=variant, expressions=dict(res['expressions']),
                                   finisher=(dict(eid=fin['eid'], type=fin['fin_type']) if fin else None), device=device, methods=[r['method']['id'] for r in rows if r.get('method')]),
               target_muscles=['core'], _seed=seed, _internals=dict(res=res, rows=rows, variant=variant, W=W, fin=fin, log=log, est=est, sc=sc))
    return out


def build_core(nctx, swap, history, eq, sp):
    """Core-focused session with the State Satisfaction Gate and the whole-session coherence check (same discipline as Custom Target)."""
    aid = 'strength_core'; exp = nctx['experience']
    states = [s for s in nctx['states'] if s in D.EXPRESSIONS]
    ref = None
    if states:
        try:
            r0 = _core_once(dict(nctx, states=[]), swap, history, eq, sp, states=[])
            ref = dict(variant=r0['variant'], W={}, archetype=aid, ids=[r['eid'] for r in r0['_internals']['rows']])
        except Conflict: ref = None
    tried = {s: [] for s in states}; forced = {}; gate_log = []; out = None; realized = {}
    for attempt in range(1 + 3 * max(1, len(states))):
        out = _core_once(nctx, swap, history, eq, sp, forced=forced)
        it = out['_internals']; res = it['res']; rows = it['rows']; fin = it['fin']; variant = it['variant']
        Wd = {f'#{i}': r['eid'] for i, r in enumerate(rows)}
        realized = {}
        for s in states:
            rz = realized_for_state(s, res, it['log'], variant, (dict(ref, W={}) if ref else None), Wd, rows, fin, aid)
            expr = res['expressions'].get(s); e = D.LAST_RESORT[s] if expr == 'last_resort' else D.EXPRESSIONS[s].get(expr, {})
            if ref and (e.get('bias') or s == 'bored'):
                new = [r['eid'] for r in rows if r['eid'] not in set(ref['ids'])]
                if new: rz.append(dict(kind='exercises', detail=[f"{EX[i]['name']} (new vs no-State build)" for i in new]))
            realized[s] = rz
        for s in states:
            gate_log.append(dict(reason_code='state_gate', state=s, attempt=attempt, expression=res['expressions'].get(s), realized=[x['kind'] for x in realized[s]], satisfied=bool(realized[s]),
                                 no_ops=[l['reason_code'] for l in it['log'] if isinstance(l, dict) and l.get('state') == s and l.get('reason_code', '').endswith('_no_effect')]))
        unsatisfied = [s for s in states if not realized[s]]
        if not unsatisfied: break
        s = unsatisfied[0]; tried[s].append(res['expressions'].get(s)); nxt = D.next_expression(s, tried[s], exp, False)
        if nxt is None: gate_log.append(_exhausted(s, tried[s], it['log'])); break
        forced[s] = nxt; gate_log.append(dict(reason_code='state_gate_fallback', state=s, **{'from': tried[s][-1], 'to': nxt}))
    it = out['_internals']
    out['log'] = out['log'] + gate_log
    b = dict(res=it['res'], rows=it['rows'], log=out['log'], W=it['W'], a=aid, fin=it['fin'], variant=it['variant'], est=it['est'], realized=realized, blocks=out.get('st_blocks', []),
             payload=dict(outcome='VALID BUILD', log=[]), sc=it['sc'], ctx={'target': {'core'}}, seed=out['_seed'])
    if states:
        b = coherence_pass(b, states, nctx, history, nctx['duration'], exp)
        out.update(st_blocks=b['blocks'], fin_rows=([b['fin']] if b['fin'] else []), estimated_minutes=float(b['est']), log=b['log'], sets=sum(r['sets'] for r in b['rows']))
        out['history_record']['exercise_ids'] = [r['eid'] for r in b['rows']] + ([b['fin']['eid']] if b['fin'] else [])
        out['history_record']['methods'] = [r['method']['id'] for r in b['rows'] if r.get('method')]
    out['personalization'] = personalization(nctx, b, history)
    gate = [l for l in gate_log if l.get('reason_code') == 'state_gate']
    out['state_gate'] = {s: next((g['satisfied'] for g in reversed(gate) if g['state'] == s), None) for s in states}
    out['decisions'] = [l for l in out['log'] if isinstance(l, dict) and l.get('reason_code') in DECISION_CODES]
    del out['_internals']
    return out


# ================================================================== exercise-level swap
def swap_exercise(nctx, history, swap, res, slot, excluded, eq, sp):
    a = res['archetype']; dur = nctx['duration']; exp = nctx['experience']
    if a == 'strength_custom_target' and slot != 'finisher': return swap_custom(nctx, history, res, slot, excluded, eq, sp)
    if a == 'strength_core' and slot != 'finisher' and slot.startswith('core_'): return swap_core(nctx, history, res, slot, excluded, eq, sp)
    d = res['dials']; variant = res['variant']; seed = res['_seed']
    d = dict(d, log=[])
    sc = make_sc(nctx, history, d, swap, plan_for(a, variant, dur), eq, sp)
    sc['swap'] = max(1, swap + 1); sc['displayed'] = dict(res['W'])
    ctx = ctx_for(a, res['target_muscles'], res['mode']) if a == res['requested_archetype'] else ctx_for(a)
    W = dict(res['W'])
    if slot == 'finisher':
        if a == 'strength_custom_target': sc2, _ = QE.custom_sore_override(list(res['target_muscles']), sc); sc = sc2; ctx = {'target': set(res['target_muscles'])}
        return swap_finisher(nctx, history, res, sc, ctx, excluded, seed, variant, d)
    if slot not in W: raise Conflict('no_alternative', 'That exercise cannot be swapped.', [])
    others = {k: EX[v] for k, v in W.items() if k != slot}
    partner = {p[0]: p[1] for p in AE.ATD_PAIRS.get(a, [])}
    fam_others = {k: e for k, e in others.items() if k != partner.get(slot)}
    cands = [c for c in AE.candidates(a, slot, sc, fam_others, ctx) if c[0]['id'] not in excluded and c[0]['id'] not in set(W.values())]
    ranked = rank(cands, sc, others, a, slot, ctx)
    for e, v, b in ranked:
        W2 = dict(W); W2[slot] = e['id']
        payload = dict(outcome='VALID BUILD', archetype=a, requested=res['requested_archetype'], workout=W2,
                       log=[l for l in res['log'] if isinstance(l, dict) and (l.get('reason_code') in ('sore_substitution', 'sore_override_by_explicit_target', 'ancillary_depth', 'burnout_family_reuse', 'sore_secondary_retained', 'duration_underfill_accepted') or (l.get('reason_code') == 'adjustment'))])
        log = []
        sc0 = dict(sc, swap=0, displayed=None)     # the swapped workout is validated as a plain build (frozen convention)
        rows, blocks, fin, est = assemble(a, W2, payload, nctx, history, d, variant, sc0, ctx, seed, dur, exp, log, fin_exclude=())
        payload['workout'] = dict(W2)
        bad = validate(payload, a, sc0, dur, ctx, rows, blocks, fin, exp, est, swapped=True, extra_log=log)
        bad = [x for x in bad if x[0] not in ('outcome_class', 'reroute_log')]
        if bad: continue
        out = dict(res); out.update(W=W2, rows=rows, st_blocks=blocks, fin_rows=([fin] if fin else []), estimated_minutes=float(est), sets=sum(r['sets'] for r in rows),
                                    structure=next((l['pattern'] for l in log if l.get('reason_code') == 'structure_selected'), 'straight'))
        out['log'] = res['log'] + [{'reason_code': 'exercise_swapped', 'slot': slot, 'from': W[slot], 'to': e['id'], 'protected': (a, slot) in AE.PROTECTED}]
        out['decisions'] = res.get('decisions', []) + [out['log'][-1]]
        out['history_record'] = dict(res['history_record'], exercise_ids=list(W2.values()) + ([fin['eid']] if fin else []), slots=dict(W2), finisher=(dict(eid=fin['eid'], type=fin['fin_type']) if fin else None))
        return out
    raise Conflict('no_alternative', 'No other exercise fits this slot with your equipment, level and soreness today.', [])


def swap_finisher(nctx, history, res, sc, ctx, excluded, seed, variant, d):
    a = res['archetype']; W = dict(res['W']); old = res['fin_rows'][0] if res['fin_rows'] else None
    if not old: raise Conflict('no_alternative', 'That exercise cannot be swapped.', [])
    t, e = pick_finisher(a, W, sc, ctx, seed, (old['fin_type'],), hist_fin(history), exclude=set(excluded) | {old['eid']})
    if not e:
        t, e = pick_finisher(a, W, sc, ctx, seed, tuple(x for x in ('burnout', 'forceful', 'carry') if x != old['fin_type']), hist_fin(history), exclude=set(excluded) | {old['eid']})
    if not e: raise Conflict('no_alternative', 'No other finisher fits today.', [])
    fin = finisher_row(t, e)
    blocks = [dict(b) for b in res['st_blocks']]
    fb = dict(blocks[-1]); fb['items'] = [dict(slot='finisher', exercise_id=e['id'], name=e['name'], sets=fin['sets'], reps=fin['reps'], rir=fin['rir'])]
    fb['rounds'] = fin['sets']; fb['rest_after_round'] = fin['rest']; fb['reason'] = f'{t} finisher'; blocks[-1] = fb
    out = dict(res); out['st_blocks'] = blocks; out['fin_rows'] = [fin]
    out['log'] = res['log'] + [{'reason_code': 'exercise_swapped', 'slot': 'finisher', 'from': old['eid'], 'to': e['id']}]
    out['decisions'] = res.get('decisions', []) + [out['log'][-1]]
    out['history_record'] = dict(res['history_record'], exercise_ids=list(W.values()) + [e['id']], finisher=dict(eid=e['id'], type=t))
    return out


def swap_custom(nctx, history, res, slot, excluded, eq, sp):
    dur = nctx['duration']; exp = nctx['experience']; d = dict(res['dials'], log=[]); variant = res['variant']; seed = res['_seed']
    rows = [dict(r, pos=dict(r['pos'])) for r in res['rows']]
    k = [r['slot'] for r in rows].index(slot); r = rows[k]; m = r['muscle']
    sc = make_sc(nctx, history, d, 0, {'secondary': (0, 0), 'accessory': (0, 0)}, eq, sp); sc2, ov = QE.custom_sore_override(list(res['target_muscles']), sc)
    used = {x['eid'] for x in rows}; fams = {EX[x['eid']]['swap'] for i, x in enumerate(rows) if i != k}
    mf = Counter(EX[x['eid']]['mfam'] for i, x in enumerate(rows) if i != k)
    pool = [EX[eid] for eid, v, c, b in AE.ELIG[('strength_custom_target', 'target_block_a')] if AE.hard_ok(EX[eid], sc2)]
    base = [e for e in pool if AE.roll(e['prim'][0]) == m and e['id'] not in used and e['id'] not in excluded and (e['cls'] != 'isolation') == (EX[r['eid']]['cls'] != 'isolation')]
    cands = [e for e in base if e['swap'] not in fams and mf[e['mfam']] < 2] or [e for e in base if e['swap'] not in fams] or base
    cands.sort(key=lambda e: (-D.bias_score(e, sc.get('_bias') or {}, {}), -seedu(seed, 'ctswap', slot, e['id'])))
    if not cands: raise Conflict('no_alternative', 'No other exercise fits this Target block today.', [])
    e = cands[0]; old = r['eid']
    reps, kind, why = B.rep_text(e, r['cls'], exp, r['pos']['reps']); r.update(eid=e['id'], name=e['name'], reps=reps, kind=kind, why=why, ecls=e['cls']); rows[k] = r
    W = {x['slot']: x['eid'] for x in rows}; ctx = {'target': set(res['target_muscles'])}
    blocks, slog, fin = build_structure('strength_custom_target', rows, variant, d, sc2, dur, ctx, W, seed, hist_fin(history), exp)
    out = dict(res); out.update(rows=rows, st_blocks=blocks, W=W, fin_rows=([fin] if fin else []), estimated_minutes=float(T.estimate_minutes(blocks, rows + ([fin] if fin else []), dur)))
    out['log'] = res['log'] + [{'reason_code': 'exercise_swapped', 'slot': slot, 'from': old, 'to': e['id']}]
    out['decisions'] = res.get('decisions', []) + [out['log'][-1]]
    out['history_record'] = dict(res['history_record'], exercise_ids=[x['eid'] for x in rows] + ([fin['eid']] if fin else []))
    return out


def swap_core(nctx, history, res, slot, excluded, eq, sp):
    """Swap one exercise of a core-focused session for another of the same category (or its fallback categories)."""
    dur = nctx['duration']; exp = nctx['experience']; d = dict(res['dials'], log=[]); variant = res['variant']; seed = res['_seed']
    rows = [dict(r, pos=dict(r['pos'])) for r in res['rows']]
    k = [r['slot'] for r in rows].index(slot); r = rows[k]; cat = r.get('category') or slot.split('#')[0][5:]
    sc = make_sc(nctx, history, d, 0, {'secondary': (0, 0), 'accessory': (0, 0)}, eq, sp); sc['_cap_delta'] = d.get('cap_delta', 0)
    used = {x['eid'] for x in rows}; fams = {EX[x['eid']]['swap'] for i, x in enumerate(rows) if i != k}
    pool = [e for e in EX.values() if AE.hard_ok(e, sc) and not (set(e['prim']) & sc['sore']) and e['id'] not in used and e['id'] not in excluded and e['swap'] not in fams]
    cands = []
    for c in (cat,) + CORE_FALLBACK.get(cat, ()):
        cands = [e for e in pool if CORE_CATS[c](e) and (c not in ('brace_load', 'posterior') or e['sysd'] <= CORE_SYSD_CAP[exp])]
        if cands: break
    if not cands: raise Conflict('no_alternative', 'No other exercise fits this part of the Core session today.', [])
    cands.sort(key=lambda e: (-D.bias_score(e, sc.get('_bias') or {}, {}), -seedu(seed, 'coreswap', slot, e['id'])))
    e = cands[0]; old = r['eid']
    reps, kind, why = B.rep_text(e, r['cls'], exp, r['pos']['reps']); r.update(eid=e['id'], name=e['name'], reps=reps, kind=kind, why=why, ecls=e['cls']); rows[k] = r
    W = {x['slot']: x['eid'] for x in rows}; ctx = {'target': {'core'}}
    blocks, slog, fin = build_structure('strength_core', rows, variant, d, sc, dur, ctx, W, seed, hist_fin(history), exp)
    out = dict(res); out.update(rows=rows, st_blocks=blocks, W=W, fin_rows=([fin] if fin else []), estimated_minutes=float(T.estimate_minutes(blocks, rows + ([fin] if fin else []), dur)))
    out['log'] = res['log'] + [{'reason_code': 'exercise_swapped', 'slot': slot, 'from': old, 'to': e['id']}]
    out['decisions'] = res.get('decisions', []) + [out['log'][-1]]
    out['history_record'] = dict(res['history_record'], exercise_ids=[x['eid'] for x in rows] + ([fin['eid']] if fin else []))
    return out


def fingerprint(res):
    return hashlib.sha256(repr((res['archetype'], sorted(res['W'].items()), res.get('variant'), [(b['structure_id'], [i['exercise_id'] for i in b['items']]) for b in res['st_blocks']])).encode()).hexdigest()[:16]


# ================================================================== personalization contract
STATE_INTENT = {'low_energy': 'reduce_training_cost', 'bored': 'refresh_the_experience', 'irritated': 'direct_physical_cathartic_work',
                'amped': 'use_readiness_productively', 'stressed': 'reduce_cognitive_load', 'sore': 'protect_sore_region'}
GOAL_INTENT = {'build_strength': 'primary_emphasis_heavier_longer_rest', 'build_muscle': 'hypertrophy_volume_and_accessories', 'improve_athleticism': 'heavy_primary_with_intent',
               'lose_weight_conditioning': 'density_short_rests_paired_work', 'feel_better_reduce_stress': 'steady_effort_away_from_failure', 'stay_consistent': 'balanced_general_strength'}
ARCH_NAME = {'strength_upper_push': 'Upper Push', 'strength_upper_pull': 'Upper Pull', 'strength_upper_mixed': 'Upper Body', 'strength_arms': 'Arms', 'strength_lower_squat': 'Lower Body: Squat',
             'strength_lower_hinge': 'Lower Body: Hinge', 'strength_glutes_legs': 'Glutes + Legs', 'strength_full_body': 'Full Body', 'strength_core': 'Core', 'strength_custom_target': 'Custom Target'}


def personalization(nctx, b, history):
    """Why this exact workout fits this exact user today: one entry per relevant input with intended and REALIZED consequences.
    Realized lists are built only from events and comparisons that actually happened; an input with nothing realized keeps an empty list."""
    res = b['res']; rows = b['rows']; log = b['log']; W = b['W']; a = b['a']; fin = b.get('fin'); variant = b['variant']; out = []
    names = lambda ids: ', '.join(EX[i]['name'] for i in ids)
    eff_rest = {it['slot']: blk.get('rest_after_round') for blk in (b.get('blocks') or []) for it in blk.get('items', [])}   # rest as displayed (a superset shares one round rest)
    rest_of = lambda r: eff_rest.get(r['slot']) or r['rest']
    for s in res['states']:
        rz = b.get('realized', {}).get(s, [])
        out.append(dict(input='state', value=s, intended=STATE_INTENT[s], expression=res['expressions'].get(s), kinds=[x['kind'] for x in rz], realized=[d for x in rz for d in x['detail']], realized_by_kind=[list(x['detail']) for x in rz]))
    sore = set(nctx.get('sore') or ())
    if sore:
        rl = []; plog = b['payload'].get('log', [])
        if b['payload'].get('outcome') == 'VALID ADAPTIVE REROUTE': rl.append(f"rerouted to {ARCH_NAME.get(a, a)}, away from the sore {', '.join(sorted(sore))}")
        for l in plog:
            if isinstance(l, dict) and l.get('reason_code') == 'sore_substitution': rl.append(f"{EX[l['removed']]['name']} replaced by {EX[l['substitute']]['name']} (sore secondary mover)")
            if isinstance(l, dict) and l.get('reason_code') == 'sore_override_by_explicit_target': rl.append(f"{', '.join(l['muscles'])} trained as asked despite soreness")
        loaded = [r for r in rows if set(EX[r['eid']]['prim']) & sore]; sec = [r for r in rows if set(EX[r['eid']]['sec']) & sore and r not in loaded]
        if not loaded and not any(isinstance(l, dict) and l.get('reason_code') == 'sore_override_by_explicit_target' for l in plog): rl.append(f"no movement loads the sore {', '.join(sorted(sore))} directly")
        if sec: rl.append(f"{len(sec)} movement{'s' if len(sec) != 1 else ''} still use it as a secondary mover ({names(r['eid'] for r in sec)}); everything else avoids it")
        elif not loaded: rl.append('no accessory uses it as a secondary mover either')
        out.append(dict(input='soreness', value=sorted(sore), intended='protect_sore_region', realized=rl))
    lvl = nctx['experience']; rl = []; meth = [r for r in rows if r.get('method')]; hi_cx = [r for r in rows if EX[r['eid']]['cx'] >= 3]
    if lvl == 'beginner':
        rirs = [r['rir'] for r in rows if r.get('rir') is not None]; mx = max((r['sets'] for r in rows), default=0)
        rl += [('beginner bands: every lift keeps 2+ reps in reserve' if rirs and min(rirs) >= 2 else 'beginner bands: no set closer than 1 rep to failure') + f", no exercise above {mx} sets", 'beginner-rated, low-complexity movements only']
        if not meth: rl.append('no advanced set methods')
    elif lvl == 'intermediate':
        if variant == 'top_backoff': rl.append('Top Set + Back-off (intermediate and up)')
        rl += [f"{r['method']['label']} on {r['name']} (intermediate and up)" for r in meth]
        if hi_cx: rl.append(f"intermediate pool: {names(r['eid'] for r in hi_cx)}")
    else:
        rl += [f"{r['method']['label']} on {r['name']}" + (' (advanced)' if r['method']['id'] == 'cluster' else '') for r in meth]
        p0 = next((r for r in rows if r['cls'] == 'primary_compound'), None)
        if p0 and p0['rir'] <= 1: rl.append(f"{p0['name']} runs to RIR {p0['rir']} (advanced band position)")
        if hi_cx: rl.append(f"higher-complexity movements kept in: {names(r['eid'] for r in hi_cx)}")
        if variant in ('heavy_primary', 'top_backoff'): rl.append(f"{V.VARIANTS[variant]['name']} shape")
    out.append(dict(input='experience', value=lvl, intended='match_programming_vocabulary_to_level', realized=rl))
    goal = nctx.get('goal'); rl = []; prim = next((r for r in rows if r['cls'] == 'primary_compound'), None)
    acc = [r for r in rows if r['cls'] in ('accessory', 'extra')]
    if goal == 'build_strength':
        if variant in ('heavy_primary', 'top_backoff'): rl.append(f"{V.VARIANTS[variant]['name']} shape (strength goal weights it up)")
        if prim and prim['kind'] == 'reps' and not prim['why']:
            nums = [int(x) for x in __import__('re').findall(r'\d+', prim['reps'])]
            if nums and max(nums) <= 7: rl.append(f"{prim['name']} at {prim['reps']} with {'full ' if prim['rest'] >= 180 else ''}{prim['rest']} s rest")
        rl += [f"{r['method']['label']} on {r['name']}" for r in meth if r['method']['id'] in ('pause', 'cluster')]
    elif goal == 'build_muscle':
        if variant in ('volume', 'paired'): rl.append(f"{V.VARIANTS[variant]['name']} shape (muscle goal weights it up)")
        if acc: rl.append(f"{len(acc)} accessory movement{'s' if len(acc) != 1 else ''}{' behind the main lift' if prim else ''}, {sum(r['sets'] for r in acc)} accessory sets in the 10–20 range")
        rl += [f"{r['method']['label']} on {r['name']}" for r in meth if r['method']['id'] in ('drop_set', 'rest_pause', 'one_and_half', 'slow_eccentric')]
    elif goal == 'improve_athleticism':
        if prim and prim['kind'] == 'reps' and not prim['why']:
            nums = [int(x) for x in __import__('re').findall(r'\d+', prim['reps'])]
            if nums and max(nums) <= 7: rl.append(f"{prim['name']} kept heavy ({prim['reps']}) with full rest")
        if variant in ('heavy_primary', 'efficient', 'top_backoff'): rl.append(f"{V.VARIANTS[variant]['name']} shape")
    elif goal == 'lose_weight_conditioning':
        if variant in ('paired', 'efficient'): rl.append(f"{V.VARIANTS[variant]['name']} shape (conditioning goal weights it up)")
        short = [r for r in acc if rest_of(r) <= 60]
        if short and len(short) == len(acc): rl.append(f"short rests on the accessories ({', '.join(sorted({str(rest_of(r)) for r in short}))} s)")
    elif goal == 'feel_better_reduce_stress':
        if variant == 'traditional': rl.append('Traditional shape (feel-better goal weights it up)')
        comp = [r for r in rows if r['cls'] in ('primary_compound', 'secondary_compound')]
        if comp and min(r['rir'] for r in comp) >= 2: rl.append('compound work stays 2+ reps from failure')
    else:
        if variant in ('traditional', 'paired'): rl.append('balanced session shape, no specialization')
    out.append(dict(input='goal', value=goal, intended=GOAL_INTENT.get(goal, 'balanced_general_strength'), realized=rl))
    if nctx.get('target_mode') == 'explicit' and nctx.get('target_muscles'):
        rl = []
        for m in nctx['target_muscles']:
            hit = [r for r in rows if m in EX[r['eid']]['prims'] or AE.roll(EX[r['eid']]['prim'][0]) == m]
            rl.append(f"{m}: {names(r['eid'] for r in hit)}" if hit else f"{m}: not covered")
        out.append(dict(input='target', value=list(nctx['target_muscles']), intended='cover_every_target_muscle_directly', realized=rl))
    elif nctx.get('target_mode') == 'full_body':
        out.append(dict(input='target', value='full_body', intended='upper_lower_core_in_one_session', realized=[f"{ARCH_NAME.get(a, a)}: {names(r['eid'] for r in rows)}"]))
    dur = nctx['duration']; acts = [l for l in log if isinstance(l, dict) and l.get('reason_code') in ('duration_backfill', 'duration_trim')]
    rl = []
    if acts:
        adds = [l for l in acts if l['reason_code'] == 'duration_backfill']; trims = [l for l in acts if l['reason_code'] == 'duration_trim']
        if adds: rl.append('filled toward the requested time: ' + ', '.join(sorted({(l.get('action') or '') + ((' ' + EX[l['exercise']]['name']) if l.get('exercise') else '') for l in adds})))
        if trims: rl.append('trimmed to fit: ' + ', '.join(sorted({l.get('action') or '' for l in trims})))
    if dur == 30: rl.append(f"30-minute session: {len(rows)} exercises, {sum(r['sets'] for r in rows)} working sets, main work kept")
    rl.append(f"estimated {b['est']} min for a {dur}-minute request")
    out.append(dict(input='duration', value=dur, intended='fill_the_requested_time_with_useful_work', realized=rl))
    eq_spec = nctx.get('equipment')
    if isinstance(eq_spec, tuple) and eq_spec[0] != 'frozen':
        out.append(dict(input='equipment', value='limited set', intended='build_only_from_available_equipment', realized=[f"built from {len(eq_spec[1])} equipment types: {names(r['eid'] for r in rows)}"]))
    else:
        out.append(dict(input='equipment', value='commercial_gym', intended='availability_only', realized=[]))
    same = [h for h in history if h.get('archetype') == a]; rl = []
    if same:
        last = same[-1]
        if last.get('variant') and last['variant'] != variant: rl.append(f"different shape from your last {ARCH_NAME.get(a, a)} ({V.VARIANTS[last['variant']]['name']} then, {V.VARIANTS[variant]['name']} now)")
        prot = [k for k in W if (a, k) in AE.PROTECTED and last.get('slots', {}).get(k) == W[k]]
        if prot: rl.append(f"main lift continuity for progression: {names(W[k] for k in prot)}")
        kept = [i for i in W.values() if i in set(last.get('exercises', []))]; new = [i for i in W.values() if i not in set(last.get('exercises', []))]
        if new: rl.append(f"{len(new)} movement{'s' if len(new) != 1 else ''} not in your last {ARCH_NAME.get(a, a)} session")
        for s in res['states']:
            prev = [h['expressions'].get(s) for h in history if h.get('expressions', {}).get(s)]
            if prev and prev[-1] != res['expressions'].get(s): rl.append(f"{s}: expressed differently from last time ({prev[-1]} then, {res['expressions'].get(s)} now)")
        if last.get('finisher') and fin and last['finisher'].get('eid') != fin['eid']: rl.append('a different finisher from last time')
    out.append(dict(input='history', value=(f"{len(history)} completed Strength sessions" if history else 'first session'), intended='rotate_shape_and_movements_keep_the_main_lift', realized=rl))
    return out
