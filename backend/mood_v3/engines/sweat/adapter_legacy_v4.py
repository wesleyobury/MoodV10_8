"""Production adapter for the frozen Sweat engine (Sweat FINAL FREEZE v4).

generate() (frozen) -> validate() (frozen independent validator) -> shared formatter.
Exercise-level swap: same block, same role, same eligibility slot, frozen hard filters (equipment, experience, State cap,
soreness, impact) and frozen ranking (verdict, State tiers, Target, recency / swap chain); dose from the frozen
station_dose(); the whole workout is then re-validated by the frozen Sweat validator (SC1-SC5, I1-I6, J1-J6, firewall).
"""
from __future__ import annotations
import copy, hashlib, threading
from . import sweat_gen as G
from . import sweat_validate as V
from .. import state_rules  # noqa: F401

LOCK = threading.RLock()
EX = G.EX

class Conflict(Exception):
    def __init__(self, code, message, options, detail=None):
        super().__init__(message); self.code = code; self.message = message; self.options = options; self.detail = detail

def history_for_engine(records):
    return [dict(r['native'], direction='sweat') for r in records if r.get('direction') == 'sweat' and r.get('native')]

def disp(w):   # frozen QA 'displayed composition' record (families / exercises) used by the swap chain
    return dict(families=[e['swap'] for b in w['blocks'] for e in b['items_e']], exercises=[e['id'] for b in w['blocks'] for e in b['items_e']],
                engine_mode=w.get('engine_mode'), engine_format=w.get('engine_format'), primary_structure=w['blocks'][0]['structure'] if w['blocks'] else None)

def _inp(nctx, history, swap, chain):
    tgt = None
    if nctx['target_mode'] == 'explicit': tgt = list(nctx['target_muscles'])
    elif nctx['target_mode'] == 'full_body': tgt = 'full_body'
    inp = dict(duration=nctx['duration'], experience=nctx['experience'], states=list(nctx['states']), preset=nctx['equipment'],
               sore=sorted(nctx['sore']), target=tgt, goal=nctx['goal'], history=history, swap=swap, displayed_chain=list(chain),
               user=nctx['user'], date=nctx['date'])
    if nctx['archetype']: inp['force_archetype'] = nctx['archetype']
    return inp

def hard_fails(w): return [(n, d) for n, ok, d in V.validate(w) if not ok and not n.startswith('SOFT')]

def _generate_chain(nctx, history, swap):
    """Swap Workout k = deterministic function of inputs + displayed chain 0..k-1 (frozen QA convention)."""
    chain = []; w = None
    for k in range(swap + 1):
        w = G.generate(_inp(nctx, history, k, chain)); chain.append(disp(w)) if w['blocks'] else None
    return w

def build(nctx, history_records, swap=0):
    with LOCK:
        history = history_for_engine(history_records)
        w = _generate_chain(nctx, history, swap)
        oc = w['outcome']
        if oc == 'VALID TERMINAL CONFLICT':
            raise Conflict('sore_target_conflict', 'Your sore areas block a credible session for this choice today.',
                           ['change_target', 'moods_pick', 'switch_direction', 'cancel'], detail=w['adjustments'])
        if oc == 'VALID INFEASIBLE (equipment)':
            raise Conflict('equipment_insufficient', 'This Sweat format needs equipment that is not in your setup.',
                           ['moods_pick', 'change_equipment'], detail=w['adjustments'])
        if oc not in ('VALID BUILD', 'VALID ADAPTIVE REROUTE') or not w['blocks']:
            raise Conflict('cannot_build', 'This Sweat session cannot be built with the current setup.',
                           ['moods_pick', 'change_equipment', 'switch_direction'], detail=w['adjustments'])
        bad = hard_fails(w)
        if bad:
            raise Conflict('generation_failed', 'We could not build a valid Sweat session for this combination.', ['swap_workout', 'moods_pick'],
                           detail=[list(map(str, b)) for b in bad])
        return _result(nctx, w)

RELAX = ('relaxation_a', 'complexity_relaxed_state_cap', 'region_balance_relaxed_sore', 'region_balance_relaxed_equipment',
         'conditioning_driver_resistance_only', 'complement_unavailable', 'complement_simplified', 'stressed_resistance_only_couplet')
def _result(nctx, w):
    adj = w['adjustments']
    rer = [a for a in adj if a['reason_code'] == 'sore_reroute']
    requested = str(rer[0]['detail']).split(' ')[0] if rer else w['archetype_id']
    return dict(status='ok', direction='sweat', archetype=w['archetype_id'], requested_archetype=requested,
                rerouted=w['outcome'] == 'VALID ADAPTIVE REROUTE', mode='explicit' if nctx['archetype'] or nctx['target_mode'] != 'moods_pick' else 'pick',
                w=w, log=adj, relaxations=sorted({a['reason_code'] for a in adj if a['reason_code'] in RELAX}),
                estimated_minutes=float(w['est_minutes']), sore_override=sorted(w['_ctx']['sore_override']),
                history_record=dict(direction='sweat', archetype=w['archetype_id'], exercise_ids=[e['id'] for b in w['blocks'] for e in b['items_e']],
                                    native=G.history_record(w)),
                target_muscles=sorted(nctx['target_muscles']) if nctx['target_mode'] == 'explicit' else [])

# ------------------------------------------------------------------ exercise-level swap
def _elig_slot(b, e):
    if b['slot'] == 'primary_hybrid_block':
        return 'primary_hybrid_block.anchor' if b.get('anchor') is e or (b.get('anchor') and b['anchor']['id'] == e['id']) else 'primary_hybrid_block.station'
    return b['slot']

def swap_exercise(nctx, history_records, swap, res, bi, ii, excluded):
    """bi: block index, ii: item index in block['items_e']."""
    with LOCK:
        w0 = res['w']; aid = w0['archetype_id']; ctx = w0['_ctx']; d = w0['dials']
        b0 = w0['blocks'][bi]; e_old = b0['items_e'][ii]
        slot = _elig_slot(b0, e_old)
        used_ids = {e['id'] for b in w0['blocks'] for e in b['items_e'] + b.get('reserve', [])}
        used_fams = {e['swap'] for b in w0['blocks'] for e in b['items_e'] + b.get('reserve', []) if e['id'] != e_old['id']}
        c2 = dict(ctx, swap=max(1, swap + 1), displayed_chain=list(ctx.get('displayed_chain', [])) + [disp(w0)])
        conds = {eid: cond for eid, v, cond, b in G.ELIG_BY[(aid, slot)]}
        def keep(e):
            return (e['role'] == e_old['role'] and e['id'] not in used_ids and e['id'] not in excluded and e['swap'] not in used_fams
                    and G.hard_ok(e, c2, d['cap'], aid, slot, conds.get(e['id'], '')))
        extra = None
        if b0['structure'] == 'finisher': extra = lambda e: G.max_intent_ok(e) and e['eq'] not in G.MIN_BOUT
        for e_new in G.ranked(aid, slot, c2, d, f'swap|{bi}|{ii}', lambda e: keep(e) and (extra is None or extra(e))):
            w = _replace(w0, bi, ii, e_old, e_new)
            if hard_fails(w): continue
            out = _result(nctx, w)
            out['log'] = res['log'] + [dict(reason_code='exercise_swapped', block=b0['slot'], **{'from': e_old['id'], 'to': e_new['id']})]
            return out
        raise Conflict('no_alternative', 'No other exercise fits this station with your equipment, level and soreness today.', [])

def _replace(w0, bi, ii, e_old, e_new):
    w = dict(w0); w['blocks'] = [dict(b) for b in w0['blocks']]
    b = w['blocks'][bi]; exp = w0['experience']; hybrid = b['slot'] == 'primary_hybrid_block'
    b['items_e'] = [e_new if (k == ii) else e for k, e in enumerate(b['items_e'])]
    if 'doses' in b:
        b['doses'] = list(b['doses'])
        dz = G.station_dose(e_new, exp, hybrid=hybrid)
        if b['structure'] == 'intervals' and b.get('interval_target', {}).get('rotate'): dz = dict(b['doses'][ii])   # timed rotation keeps the clock
        b['doses'][ii] = dz
    if b.get('anchor') and b['anchor']['id'] == e_old['id']:
        b['anchor'] = e_new; b['anchor_dose'] = G.station_dose(e_new, exp, hybrid=True) if e_new['role'] != 'engine' else dict(b['anchor_dose'])
    if b.get('stations'):
        b['stations'] = [((e_new, G.station_dose(e_new, exp, hybrid=True)) if e['id'] == e_old['id'] else (e, dz)) for e, dz in b['stations']]
    if b.get('round_stations'):
        b['round_stations'] = [[((e_new, G.station_dose(e_new, exp, hybrid=True)) if e['id'] == e_old['id'] else (e, dz)) for e, dz in rs] for rs in b['round_stations']]
    if b.get('item_progression'):
        ip = dict(b['item_progression']); pv = ip.pop(e_old['id'], None)      # SC5: resistance reuses load; output items progress output
        ip[e_new['id']] = 'reuse_load' if e_new['role'].startswith('resistance') else (pv if pv in ('output', 'reuse_load') else 'output')
        b['item_progression'] = ip
    w['est_minutes'] = round(G.total_minutes(w['blocks'], w0['archetype_id'], w0['duration'], exp), 1)
    w['conditioning_minutes'] = round(sum(G.block_minutes(x, exp) for x in w['blocks']), 1)
    return w

def fingerprint(res):
    w = res['w']
    return hashlib.sha256(repr((w['archetype_id'], [(b['slot'], b['structure'], [e['id'] for e in b['items_e']]) for b in w['blocks']])).encode()).hexdigest()[:16]
