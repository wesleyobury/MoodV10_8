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
    'athletic_power': 'Power', 'athletic_speed_agility': 'Speed + Agility', 'athletic_full_body': 'Full-Body Athlete',
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


def envelope_ok(*, workout_id, version, ctx, res, built_for_today, created_at):
    rr = res.get('requested_archetype')
    outcome = 'rerouted' if res.get('rerouted') else ('valid_with_relaxation' if res.get('relaxations') else 'valid')
    tgt_mode = 'archetype' if (ctx.archetype and ctx.target_mode == 'moods_pick') else ctx.target_mode
    return dict(
        schema_version=SCHEMA_VERSION, status='ok', outcome=outcome, conflict=None,
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
            built_for_today=built_for_today,
            warmup=res['warmup'],
            blocks=res['blocks'],
            cooldown=res.get('cooldown'),
            relaxations=list(res.get('relaxations', [])),
            adjustments=res.get('adjustments', []),
        ))


def envelope_conflict(ctx, conflict, *, adjustments=None):
    return dict(schema_version=SCHEMA_VERSION, status='conflict', outcome='conflict', workout=None,
                conflict=dict(conflict, adjustments=adjustments or []), request=ctx.public() if ctx else None)


def _preset_label(p):
    from .normalize import PRESET_LABELS
    return PRESET_LABELS.get(p, p)
