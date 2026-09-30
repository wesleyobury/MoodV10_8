"""Production adapter for the rebuilt Sweat engine (V3 Sweat rebuild).

build() -> sweat_core.generate (blueprints, workload budget, State gate + coherence, contract) -> frozen independent validator
(sweat_validate, minus the checks that forced State signatures) -> shared formatter. The frozen v4 adapter is kept byte-for-byte
as adapter_legacy_v4.py for the legacy comparison in the founder pack.

Exercise-level swap: same block, same role, same eligibility slot, frozen hard filters and ranking; dose from the frozen
station_dose(); the whole workout is then re-validated.
"""
from __future__ import annotations
import copy, hashlib, threading
from . import sweat_gen as G
from . import sweat_validate as V
from . import sweat_core as C
from .. import state_rules  # noqa: F401

LOCK = threading.RLock()
EX = G.EX

class Conflict(Exception):
    def __init__(self, code, message, options, detail=None):
        super().__init__(message); self.code = code; self.message = message; self.options = options; self.detail = detail

def history_for_engine(records):
    return [dict(r['native'], direction='sweat') for r in records if r.get('direction') == 'sweat' and r.get('native')]

# validator checks that encoded the old State signatures or the old duration band; the rebuild replaces them with the budget + coherence layers
DROPPED_CHECKS = {'gate_low_energy_structures', 'gate_stressed_structures', 'gate_stressed_rotation', 'duration_not_underfilled', 'SOFT_duration_band', 'duration_fits',
                  'I3_active_time', 'SC4_hybrid_anchor_every_round', 'hybrid_anchor_longest', 'engine_steady_shape', 'engine_interval_shape', 'I6_finisher_le_6min'}

def hard_fails(w): return [(n, d) for n, ok, d in V.validate(w) if not ok and not n.startswith('SOFT') and n not in DROPPED_CHECKS]

DECISION_CODES = {'state_expression', 'state_conflict_resolved', 'state_gate', 'state_gate_fallback', 'state_gate_exhausted', 'state_gate_yielded', 'state_coherence', 'state_coherence_repair',
                  'state_rpe', 'state_recovery', 'state_volume', 'state_bouts', 'state_stations', 'state_structure', 'shape_selected', 'archetype_selected', 'budget_repair', 'budget_open',
                  'duration_backfill', 'duration_trim', 'duration_underfill_accepted', 'finisher_selected', 'finisher_dropped_budget', 'sore_reroute', 'sore_exclusion',
                  'sore_override_by_explicit_target', 'target_routed_circuit', 'archetype_skipped_equipment', 'hybrid_complement', 'complement_unavailable', 'exercise_swapped',
                  'primary_block_complete', 'primary_block_short', 'hybrid_closer', 'closer_unavailable', 'duration_backfill_declined',
                  'primary_block_completeness', 'complement_selected', 'complement_skipped', 'finisher_skipped'}

def build(nctx, history_records, swap=0):
    with LOCK:
        history = history_for_engine(history_records)
        try:
            out = C.generate(nctx, history, swap)
        except G.Fail as f:
            msg = str(f)
            if msg.startswith('sore_terminal'):
                raise Conflict('sore_target_conflict', 'Your sore areas block a credible session for this choice today.', ['change_target', 'moods_pick', 'switch_direction', 'cancel'], detail=msg)
            if 'no feasible' in msg or 'equipment' in msg:
                raise Conflict('equipment_insufficient', 'This Sweat format needs equipment that is not in your setup.', ['moods_pick', 'change_equipment'], detail=msg)
            raise Conflict('cannot_build', 'This Sweat session cannot be built with the current setup.', ['moods_pick', 'change_equipment', 'switch_direction'], detail=msg)
        w = out['w']
        bad = hard_fails(w)
        if bad:
            raise Conflict('generation_failed', 'We could not build a valid Sweat session for this combination.', ['swap_workout', 'moods_pick'], detail=[list(map(str, b)) for b in bad])
        res = _result(nctx, out, history)
        return res

RELAX = ('relaxation_a', 'complexity_relaxed_state_cap', 'region_balance_relaxed_sore', 'region_balance_relaxed_equipment', 'conditioning_driver_resistance_only', 'complement_unavailable', 'complement_simplified')

def _result(nctx, out, history):
    from ... import sweat_why as WY
    w = out['w']; adj = out['log']
    requested = nctx.get('archetype') or out.get('requested_archetype') or w['archetype_id']
    res = dict(status='ok', direction='sweat', archetype=w['archetype_id'], requested_archetype=requested, rerouted=bool(out.get('rerouted')),
               mode=out['mode'], w=w, log=adj, relaxations=sorted({a['reason_code'] for a in adj if a['reason_code'] in RELAX}),
               estimated_minutes=float(w['est_minutes']), sore_override=sorted(w['_ctx']['sore_override']),
               history_record=dict(direction='sweat', archetype=w['archetype_id'], exercise_ids=[e['id'] for b in w['blocks'] for e in b['items_e']], native=C.history_record(w, out['res'])),
               target_muscles=sorted(nctx['target_muscles']) if nctx['target_mode'] == 'explicit' else [],
               variant=w.get('shape'), expressions=dict(out['res']['expressions']), budget=out['budget'], coherence=out.get('coherence') or {}, completeness=out['res'].get('completeness'),
               state_gate={s: bool(out['realized'].get(s)) for s in out['res']['states']}, _seed=out['seed'], _res=out['res'], _realized=out['realized'])
    res['personalization'] = WY.contract(nctx, dict(out, rerouted=res['rerouted']), history)
    res['decisions'] = [l for l in adj if isinstance(l, dict) and l.get('reason_code') in DECISION_CODES]
    return res

# ------------------------------------------------------------------ exercise-level swap (frozen mechanics, rebuilt time model)
def _elig_slot(b, e):
    if b['slot'] == 'primary_hybrid_block':
        return 'primary_hybrid_block.anchor' if b.get('anchor') is e or (b.get('anchor') and b['anchor']['id'] == e['id']) else 'primary_hybrid_block.station'
    return b['slot']

def disp(w):
    return dict(families=[e['swap'] for b in w['blocks'] for e in b['items_e']], exercises=[e['id'] for b in w['blocks'] for e in b['items_e']],
                engine_mode=w.get('engine_mode'), engine_format=w.get('engine_format'), primary_structure=w['blocks'][0]['structure'] if w['blocks'] else None)

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
                    and G.hard_ok(e, c2, d['cap'], aid, slot, conds.get(e['id'], '')) and (e['fixed'] is None or e['fixed'] != (b0.get('anchor') or {}).get('fixed') or e['id'] == e_old['id']))
        extra = None
        if b0['structure'] == 'finisher': extra = lambda e: G.max_intent_ok(e) and e['eq'] not in G.MIN_BOUT
        for e_new in G.ranked(aid, slot, c2, d, f'swap|{bi}|{ii}', lambda e: keep(e) and (extra is None or extra(e)), prefer_low=C.prefer_fn(res['_res'], ctx)):
            w = _replace(w0, bi, ii, e_old, e_new)
            if hard_fails(w): continue
            if C.budget_violations(C.budget(w['blocks'], aid, w['duration'], w['experience']), w['experience'], w['duration'], aid): continue
            out = dict(res); out['w'] = w; out['estimated_minutes'] = float(w['est_minutes']); out['budget'] = w['budget']
            out['log'] = res['log'] + [dict(reason_code='exercise_swapped', block=b0['slot'], **{'from': e_old['id'], 'to': e_new['id']})]
            out['decisions'] = res.get('decisions', []) + [out['log'][-1]]
            out['history_record'] = dict(res['history_record'], exercise_ids=[e['id'] for b in w['blocks'] for e in b['items_e']], native=C.history_record(w, res['_res']))
            return out
        raise Conflict('no_alternative', 'No other exercise fits this station with your equipment, level and soreness today.', [])

def _replace(w0, bi, ii, e_old, e_new):
    w = dict(w0); w['blocks'] = [copy.deepcopy(b) for b in w0['blocks']]
    b = w['blocks'][bi]; exp = w0['experience']; hybrid = b['slot'] == 'primary_hybrid_block'
    b['items_e'] = [e_new if (k == ii) else e for k, e in enumerate(b['items_e'])]
    if 'doses' in b:
        dz = G.station_dose(e_new, exp, hybrid=hybrid)
        if b['structure'] == 'intervals' and b.get('interval_target', {}).get('rotate'): dz = dict(b['doses'][ii])
        b['doses'][ii] = dz
    if b.get('anchor') and b['anchor']['id'] == e_old['id']:
        secs = C.engine_seconds(e_old, b['anchor_dose'], exp, b['rpe'][1], 0, True)
        b['anchor'] = e_new; b['anchor_dose'] = C.engine_dose_for_seconds(e_new, secs, exp, rpe=b['rpe'][1], mixed=True)
        if b.get('anchor_doses'): b['anchor_doses'] = [C.engine_dose_for_seconds(e_new, C.engine_seconds(e_old, x, exp, b['rpe'][1], 0, True), exp, rpe=b['rpe'][1], mixed=True) for x in b['anchor_doses']]
    if b.get('stations'):
        b['stations'] = [((e_new, C.hybrid_station_dose(e_new, exp, 45)) if e['id'] == e_old['id'] else (e, dz)) for e, dz in b['stations']]
    if b.get('round_stations'):
        b['round_stations'] = [[((e_new, C.hybrid_station_dose(e_new, exp, 45)) if e['id'] == e_old['id'] else (e, dz)) for e, dz in rs] for rs in b['round_stations']]
    if b.get('item_progression'):
        ip = dict(b['item_progression']); pv = ip.pop(e_old['id'], None)
        ip[e_new['id']] = 'reuse_load' if e_new['role'].startswith('resistance') else (pv if pv in ('output', 'reuse_load') else 'output')
        b['item_progression'] = ip
    b['_est_min'] = round(C.block_minutes(b, exp), 1)
    w['est_minutes'] = round(C.total_minutes(w['blocks'], w0['archetype_id'], w0['duration'], exp), 1)
    w['conditioning_minutes'] = round(sum(C.block_minutes(x, exp) for x in w['blocks']), 1)
    w['budget'] = C.budget(w['blocks'], w0['archetype_id'], w0['duration'], exp)
    return w

def fingerprint(res):
    w = res['w']
    return hashlib.sha256(repr((w['archetype_id'], [(b['slot'], b['structure'], [e['id'] for e in b['items_e']]) for b in w['blocks']])).encode()).hexdigest()[:16]
