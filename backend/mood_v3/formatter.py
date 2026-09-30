"""Shared app-facing output contract (schema v3.0).

The frontend renders one structure for every Direction:
  workout -> warmup -> ordered blocks -> items -> prescription.
Direction differences live only in (a) block.structure values, (b) optional interval / anchor fields on the block, and
(c) item.prescription.direction_fields. Formatting never changes composition: adapters pass exercises, sets, reps, rest
and order exactly as generated and validated.
"""
from __future__ import annotations
import math

SCHEMA_VERSION = 'v3.0'

DIRECTION_NAMES = {'strength': 'Strength', 'sweat': 'Sweat', 'athletic': 'Athletic'}
ARCHETYPE_NAMES = {
    'strength_upper_push': 'Upper Push', 'strength_upper_pull': 'Upper Pull', 'strength_upper_mixed': 'Upper Body',
    'strength_arms': 'Arms', 'strength_lower_squat': 'Lower Body: Squat', 'strength_lower_hinge': 'Lower Body: Hinge',
    'strength_glutes_legs': 'Glutes + Legs', 'strength_full_body': 'Full Body', 'strength_core': 'Core',
    'strength_custom_target': 'Custom Target',
    'sweat_engine': 'Engine', 'sweat_circuit': 'Circuit', 'sweat_hybrid': 'Hybrid',
    'athletic_power': 'Power', 'athletic_speed_agility': 'Speed + Plyo', 'athletic_full_body': 'Full-Body Athlete',
}
MUSCLE_NAMES = {'chest': 'Chest', 'back': 'Back', 'shoulders': 'Shoulders', 'biceps': 'Biceps', 'triceps': 'Triceps', 'forearms': 'Forearms',
                'quads': 'Quads', 'hamstrings': 'Hamstrings', 'glutes': 'Glutes', 'calves': 'Calves', 'hip_adductors': 'Adductors',
                'hip_abductors': 'Abductors', 'core': 'Core', 'spinal_erectors': 'Lower back', 'front_delts': 'Front delts',
                'side_delts': 'Side delts', 'rear_delts': 'Rear delts'}
REGION_NAMES = {'legs': 'legs', 'lower_body': 'legs', 'chest': 'chest', 'back': 'back', 'upper_back': 'upper back', 'lower_back': 'lower back',
                'shoulders': 'shoulders', 'arms': 'arms', 'core': 'core'}
EQUIPMENT_NAMES = {'barbell': 'Barbell', 'dumbbells': 'Dumbbells', 'kettlebell': 'Kettlebell', 'cable': 'Cable', 'selectorized_machine': 'Machine',
                   'plate_loaded_machine': 'Plate-loaded machine', 'smith_machine': 'Smith machine', 'bands': 'Band', 'suspension_trainer': 'Suspension trainer',
                   'pullup_bar': 'Pull-up bar', 'bench': 'Bench', 'rack': 'Rack', 'landmine': 'Landmine', 'med_ball': 'Med ball', 'slam_ball': 'Slam ball',
                   'sled': 'Sled', 'battle_ropes': 'Battle ropes', 'box': 'Box', 'rower': 'Rower', 'bike': 'Bike', 'treadmill': 'Treadmill',
                   'ski_erg': 'SkiErg', 'stair_climber': 'Stair climber', 'jump_rope': 'Jump rope', 'trap_bar': 'Trap bar', 'ez_bar': 'EZ bar',
                   'ab_wheel': 'Ab wheel', 'dip_station': 'Dip station', 'plate': 'Plate', 'back_extension_bench': 'Back extension bench',
                   'captains_chair': "Captain's chair", 'bodyweight': 'Bodyweight'}


def target_label(muscles):
    return ' + '.join(MUSCLE_NAMES.get(m, m) for m in muscles)


def fmt_seconds(s):
    s = int(round(s))
    if s < 60: return f'{s} s'
    m, r = divmod(s, 60)
    return f'{m} min' if r == 0 else f'{m}:{r:02d}'


def duration_display(estimated):
    """Honest duration: a 5-minute range around the generated estimate (e.g. 32.4 -> '30-35 min')."""
    lo = 5 * math.floor(estimated / 5)
    if estimated - lo < 1 and lo >= 10: return f'about {lo} min'
    return f'{lo}–{lo + 5} min'


def exercise_ref(eid, name, equipment, primary_muscles):
    return dict(id=eid, name=name, equipment=equipment, equipment_label=EQUIPMENT_NAMES.get(equipment, equipment),
                primary_muscles=list(primary_muscles), media=None)


def prescription(kind, *, sets=None, reps=None, reps_scheme=None, per_side=False, seconds=None, distance_m=None, calories=None,
                 rest_sec=None, rir=None, rpe=None, load_guidance=None, display=None, direction_fields=None):
    return dict(kind=kind, sets=sets, reps=reps, reps_scheme=reps_scheme, per_side=per_side, seconds=seconds, distance_m=distance_m,
                calories=calories, rest_sec=rest_sec, rir=rir, rpe=rpe, load_guidance=load_guidance, display=display,
                direction_fields=direction_fields or {})


def item(item_id, slot_id, exercise, rx, *, cues=None, quality_stop=None, swappable=True, role=None):
    return dict(item_id=item_id, slot_id=slot_id, role=role, exercise=exercise, prescription=rx, cues=cues or [],
                quality_stop=quality_stop, swap=dict(swappable=swappable), progression=None)


def block(block_id, sequence, block_type, structure, title, items, *, rounds=None, rest_between_items_sec=None, rest_between_rounds_sec=None,
          instructions=None, effort=None, interval=None, est_minutes=None):
    return dict(block_id=block_id, sequence=sequence, type=block_type, structure=structure, title=title, rounds=rounds,
                rest_between_items_sec=rest_between_items_sec, rest_between_rounds_sec=rest_between_rounds_sec, interval=interval,
                effort=effort, instructions=instructions, est_minutes=est_minutes, items=items)


# ------------------------------------------------------------------ rest contract (founder rest audit, for Guided Session)
# Every block carries `rest`: WHEN the timer starts, for how long, and whether it is full recovery. A row's
# prescription.rest_sec is only ever the rest after each set of that row in straight work (null in grouped work, where
# the block owns the one rest), so nothing is described twice.
#   kind            timer starts                                  seconds
#   between_sets    after every set of each row                   null (each row's prescription.rest_sec)
#   after_pair      after the last exercise of the pair (A1, A2)  the pair's rest; transition_sec between A1 and A2
#   after_round     after the last station of a round             the round rest; transition_sec between stations
#   interval        each interval: work_sec on, recovery_sec easy (interval object); after_round between rotations if set
#   emom            the minute clock (rest is what is left of each minute)   null
#   continuous      no programmed rest                            null
#   self_paced      ladder / density work: rest as needed         null
FULL_RECOVERY_SEC = 150


def rest_contract(block, direction):
    s = block.get('structure'); iv = block.get('interval') or {}
    rbr = block.get('rest_between_rounds_sec'); rbi = block.get('rest_between_items_sec')
    item_rests = [it['prescription'].get('rest_sec') for it in block.get('items', []) if it['prescription'].get('rest_sec')]
    power = direction == 'athletic' and block.get('type') in ('primary', 'secondary')
    if s == 'superset' and len(block.get('items', [])) > 1:
        kind, sec, trans = 'after_pair', rbr, rbi
    elif s in ('circuit', 'anchor_circuit'):
        kind, sec, trans = 'after_round', rbr, rbi
    elif s == 'timed_circuit' or (iv.get('work_sec') and s in ('intervals', 'finisher', 'repeats')):
        kind, sec, trans = 'interval', iv.get('rest_between_rounds_sec') or rbr, None
    elif s == 'pyramid' and iv.get('steps_sec'):
        kind, sec, trans = 'interval', None, None
    elif s == 'emom':
        kind, sec, trans = 'emom', None, None
    elif s == 'continuous':
        kind, sec, trans = 'continuous', None, None
    elif s == 'ladder' and direction == 'sweat':
        kind, sec, trans = 'self_paced', None, None
    else:   # straight, exposure, repeats without an interval, strength ladder / pyramid / finisher: rest after each set
        kind, sec, trans = 'between_sets', None, None
    longest = max([x for x in [sec] + item_rests if x] or [0])
    full = bool(longest >= FULL_RECOVERY_SEC and (power or direction == 'strength' or kind == 'after_pair' and direction == 'athletic'))
    return dict(kind=kind, seconds=sec, transition_sec=trans, work_sec=iv.get('work_sec'), recovery_sec=iv.get('recovery_sec'),
                full_recovery=full, reason=('power' if power else ('heavy' if direction == 'strength' else None)) if full else None)


def attach_rest_contract(blocks, direction):
    for b in blocks or []: b['rest'] = rest_contract(b, direction)
    return blocks


def envelope_ok(*, workout_id, version, ctx, res, built_for_today, created_at, today=None):
    rr = res.get('requested_archetype')
    outcome = 'rerouted' if res.get('rerouted') else ('valid_with_relaxation' if res.get('relaxations') else 'valid')
    tgt_mode = 'archetype' if (ctx.archetype and ctx.target_mode == 'moods_pick') else ctx.target_mode
    return dict(
        schema_version=SCHEMA_VERSION, status='ok', outcome=outcome, conflict=None, engine=_engine(),
        workout=dict(
            workout_id=workout_id, version=version, created_at=created_at,
            direction=ctx.direction, direction_name=DIRECTION_NAMES[ctx.direction],
            archetype=dict(id=res['archetype'], name=ARCHETYPE_NAMES.get(res['archetype'], res['archetype'])),
            requested_archetype=(dict(id=rr, name=ARCHETYPE_NAMES.get(rr, rr)) if rr and rr != res['archetype'] else None),
            target=dict(mode=tgt_mode, muscles=list(ctx.target_muscles or res.get('target_muscles') or []),
                        label=(target_label(ctx.target_muscles or res.get('target_muscles') or []) if tgt_mode == 'explicit' else
                               ('Full body' if tgt_mode == 'full_body' else (ARCHETYPE_NAMES.get(ctx.archetype, ctx.archetype) if tgt_mode == 'archetype' else "MOOD's Pick")))),
            duration=dict(requested_minutes=ctx.duration, estimated_minutes=round(res['estimated_minutes'], 1),
                          display=duration_display(res['estimated_minutes'])),
            experience=ctx.experience, states=list(ctx.states),
            soreness=dict(regions=list(ctx.sore_regions), muscles=sorted(ctx.sore_muscles),
                          trained_anyway=sorted(res.get('sore_override', []))),
            equipment=dict(preset=ctx.preset, label=_preset_label(ctx.preset)),
            swap_count=ctx.swap_count,
            selection_source=res.get('selection_source'),   # 'moods_pick' | 'user_selected' | 'target' (Phase 2.5)
            session_expectation=res.get('session_expectation'),   # e.g. 'long_core_session': the Cart / overview surfaces what this session will look like
            built_for_today=built_for_today,
            today=today,                                     # Phase 2.5 header: {told: [...], chose, chosen_by}
            warmup=res['warmup'],
            blocks=res['blocks'],
            cooldown=res.get('cooldown'),
            relaxations=list(res.get('relaxations', [])),
            adjustments=res.get('adjustments', []),
            **({'athletic': res['athletic_summary']} if res.get('athletic_summary') else {}),   # Athletic: primary quality, structure, impact / intent accounting
        ))


def envelope_conflict(ctx, conflict, *, adjustments=None):
    return dict(schema_version=SCHEMA_VERSION, status='conflict', outcome='conflict', workout=None, engine=_engine(),
                conflict=dict(conflict, adjustments=adjustments or []), request=ctx.public() if ctx else None)


def _engine():
    from .build_info import ENGINE_PHASE, ENGINE_BUILD
    return dict(phase=ENGINE_PHASE, build=ENGINE_BUILD)


def _preset_label(p):
    from .normalize import PRESET_LABELS
    return PRESET_LABELS.get(p, p)
