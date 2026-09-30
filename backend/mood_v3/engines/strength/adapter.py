"""Production adapter for the Strength engine (Core rebuild, Phase 1).

Kept from the frozen adapter (unchanged behaviour): Target routing (WA TARGET ROUTING + Phase 2.5 single-muscle rule), MOOD's Pick
rotation, equipment presets, history mapping, Conflict contract, MOOD's Pick equipment skip, the three-attempt salt retry.
Generation itself (State resolution, structural variant, prescription bands, State levers, structure, duration reconciliation,
validation, decision log) lives in core.py. The frozen prescription / structure / dial modules stay on disk as reference
(adapter_legacy_phase26.py is the Phase 2.6 adapter, byte for byte) but are no longer on the production path.
"""
from __future__ import annotations
import threading
from . import audit_engine as AE, qa_engine as QE, core as C

LOCK = threading.RLock()
EX = AE.EX
Conflict = C.Conflict

# ------------------------------------------------------------------ equipment
def equipment(spec):
    if spec[0] == 'frozen': return set(getattr(AE, spec[1])), set(AE.FULL_SPACE)
    return set(spec[1]), set(spec[2])

# ------------------------------------------------------------------ Target routing (WA TARGET ROUTING, sole authority)
ROUTING_REMOVED_PHASE_2_5 = {'chest': 'strength_upper_push', 'back': 'strength_upper_pull', 'quads': 'strength_lower_squat',
                             'hamstrings': 'strength_lower_hinge', 'glutes': 'strength_glutes_legs', 'biceps': 'strength_arms', 'triceps': 'strength_arms'}
ROUTING = {frozenset(k.split('+')): v for k, v in {
    'chest+triceps': 'strength_upper_push', 'chest+shoulders': 'strength_upper_push',
    'shoulders+triceps': 'strength_upper_push', 'chest+shoulders+triceps': 'strength_upper_push',
    'back+biceps': 'strength_upper_pull',
    'biceps+triceps': 'strength_arms', 'biceps+triceps+shoulders': 'strength_arms',
    'chest+back': 'strength_upper_mixed', 'chest+back+biceps': 'strength_upper_mixed', 'chest+back+triceps': 'strength_upper_mixed',
    'chest+back+shoulders': 'strength_upper_mixed', 'core': 'strength_core',
    'quads+glutes': 'strength_glutes_legs', 'hamstrings+glutes': 'strength_lower_hinge',
    'quads+hamstrings+glutes': 'strength_glutes_legs'}.items()}
def route_target(muscles):
    return ROUTING.get(frozenset(muscles), 'strength_custom_target')

# ------------------------------------------------------------------ MOOD's Pick (WA COLD START deterministic resolver)
GOAL_ROTATION = {
    'build_strength': ['strength_lower_squat', 'strength_upper_pull', 'strength_upper_push', 'strength_glutes_legs', 'strength_upper_mixed'],
    'build_muscle': ['strength_upper_pull', 'strength_lower_squat', 'strength_upper_push', 'strength_glutes_legs', 'strength_upper_mixed'],
    'improve_athleticism': ['strength_lower_squat', 'strength_upper_pull', 'strength_glutes_legs', 'strength_upper_push', 'strength_upper_mixed'],
}
DEFAULT_ROTATION = ['strength_glutes_legs', 'strength_upper_pull', 'strength_upper_push', 'strength_lower_squat', 'strength_upper_mixed']
LOWER = {'strength_lower_squat', 'strength_glutes_legs', 'strength_lower_hinge'}
def rotation_for(goal, frequency):
    if frequency == '1-2': return ['strength_full_body']
    rot = list(GOAL_ROTATION.get(goal, DEFAULT_ROTATION))
    if frequency == '5+':
        lows = [i for i, a in enumerate(rot) if a in LOWER]
        rot.insert(lows[1] + 1, 'strength_lower_hinge'); rot.append('strength_arms')
    return rot
def moods_pick(goal, frequency, history):
    rot = rotation_for(goal, frequency)
    last = {h['archetype']: i for i, h in enumerate(history)}
    never = [a for a in rot if a not in last]
    if never: return never[0], 'cold_start_rotation'
    return min(rot, key=lambda a: (last[a], rot.index(a))), 'history_rotation'

# ------------------------------------------------------------------ helpers
ctx_for = C.ctx_for
def history_for_engine(records):
    return [dict(archetype=r['archetype'], exercises=list(r.get('exercise_ids', [])), slots=dict(r.get('slots') or {}),
                 variant=r.get('variant'), expressions=dict(r.get('expressions') or {}), finisher=r.get('finisher'), device=r.get('device'), methods=list(r.get('methods') or []))
            for r in records if r.get('direction') == 'strength' and r.get('archetype')]

def _sc(nctx, history, swap=0, date_salt=''):
    """Compatibility for the QA harness: the composition context the core builds for a no-State request."""
    eq, sp = equipment(nctx['equipment'])
    res = C.D.resolve(list(nctx['states']), nctx['experience'], nctx['duration'], True, {}, f"{nctx['user']}|{nctx['date']}")
    return C.make_sc(nctx, history, res, swap, {'secondary': (0, 9), 'accessory': (0, 9)}, eq, sp, date_salt)

def _validate(payload, aid_req, sc, dur, ctx, rows, blocks, swapped=False):
    """Compatibility for the QA negative tests: safety + composition validation of an arbitrary (payload, rows, blocks)."""
    est = C.T.estimate_minutes(blocks, rows, dur)
    return C.validate(payload, aid_req, sc, dur, ctx, rows, blocks, None, sc['exp'], est, swapped)

composition_checks = C.composition_checks

# ------------------------------------------------------------------ core build
def build(nctx, history_records, swap=0):
    with LOCK:
        history = history_for_engine(history_records)
        eq, sp = equipment(nctx['equipment'])
        if nctx['target_mode'] == 'explicit':
            aid = nctx['archetype'] or route_target(nctx['target_muscles']); mode = 'explicit'; why = 'explicit_target'
            # soreness audit (personalization pass): a routed archetype whose defining muscle is sore and was NOT named by the user
            # (chest + triceps with sore shoulders -> Upper Push has a shoulder slot) is built as a Custom Target instead of conflicting
            if not nctx['archetype'] and aid != 'strength_custom_target' and nctx.get('sore'):
                blocked = ({QE.roll(m) for m in nctx['sore']} & set(QE.DEFINING.get(aid, ()))) - set(nctx['target_muscles'])
                if blocked: aid = 'strength_custom_target'; why = 'explicit_target_custom_around_soreness'
        elif nctx['target_mode'] == 'full_body':
            aid, mode, why = 'strength_full_body', 'explicit', 'explicit_full_body'
        elif nctx['archetype']:
            aid, mode, why = nctx['archetype'], 'explicit', 'explicit_archetype'
        else:
            aid, why = nctx.get('resolved_archetype') or moods_pick(nctx['goal'], nctx['frequency'], history)[0], 'moods_pick'; mode = 'pick'
        if aid == 'strength_custom_target':
            return C.build_custom(nctx, list(nctx['target_muscles']), swap, history, eq, sp)
        if aid == 'strength_core':
            return C.build_core(nctx, swap, history, eq, sp)
        last_err = None
        for attempt, salt in enumerate(('', '#r1', '#r2')):
            try:
                b = C.build_archetype(aid, mode, why, nctx, history, swap, eq, sp, salt)
            except Conflict as c:
                if c.code == 'sore_target_conflict' and why == 'explicit_archetype' and nctx.get('sore'):
                    # the user chose this archetype; keep the part of it that can be trained around the soreness (Upper Push with sore
                    # shoulders -> chest + triceps), built as a Custom Target so the soreness stays in force. Nothing left -> the conflict stands.
                    sore_groups = {QE.roll(m) for m in nctx['sore']}
                    kept = sorted(set(QE.DEFINING.get(aid, ())) - sore_groups)
                    if kept and len(QE.DEFINING.get(aid, ())) >= 2:
                        out = C.build_custom(dict(nctx, target_mode='explicit', target_muscles=tuple(kept), archetype=None), kept, swap, history, eq, sp)
                        out['log'] = [{'reason_code': 'archetype_narrowed_around_soreness', 'archetype': aid, 'kept': kept, 'left_out': sorted(set(QE.DEFINING[aid]) & sore_groups), 'sore': sorted(sore_groups)}] + out['log']
                        out['requested_archetype'] = aid
                        for pe in out.get('personalization', []):
                            if pe['input'] == 'soreness': pe['realized'].insert(0, f"narrowed {C.ARCH_NAME.get(aid, aid)} to {' + '.join(kept)}; {', '.join(sorted(set(QE.DEFINING[aid]) & sore_groups))} work left out (sore)")
                        return out
                if c.code == 'cannot_build' and mode == 'pick' and not nctx.get('_no_skip'):
                    rot = rotation_for(nctx['goal'], nctx['frequency']); rot = rot + [a for a in QE.ROTATION if a not in rot]
                    for alt in (rot[rot.index(aid) + 1:] + rot[:rot.index(aid)]) if aid in rot else rot:
                        try:
                            out = build(dict(nctx, resolved_archetype=alt, _no_skip=True), history_records, swap)
                        except Conflict:
                            continue
                        out['log'] = [{'reason_code': 'archetype_skipped_equipment', 'detail': aid, 'to': alt}] + out['log']
                        out['requested_archetype'] = alt; out['skipped_archetype'] = aid
                        return out
                raise
            if not b['bad']: return C.result(nctx, b, attempt)
            last_err = b['bad']
        raise Conflict('generation_failed', 'We could not build a valid session for this combination.', ['swap_workout', 'moods_pick'], detail=[list(map(str, c)) for c in last_err])

def swap_exercise(nctx, history_records, swap, res, slot, excluded):
    with LOCK:
        eq, sp = equipment(nctx['equipment'])
        return C.swap_exercise(nctx, history_for_engine(history_records), swap, res, slot, excluded, eq, sp)

fingerprint = C.fingerprint
