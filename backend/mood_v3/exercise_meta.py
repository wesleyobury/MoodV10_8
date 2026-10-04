"""V3 exercise metadata that is NOT programming (founder pass 3).

load_scaling: bodyweight strength movements whose difficulty varies hugely between people (one advanced lifter does 5 pull-ups,
another 35). The engines already prescribe these with a rep range and an effort target (reps left in the tank); what was missing
was the instruction that makes one prescription fit both people: use assistance when you cannot reach the range, add load or
leverage when you would blow past it.

Explicit list on purpose. It is never inferred from equipment == bodyweight: jumps, plyometric push-ups, muscle-ups and other
explosive / skill work keep their low counts and quality stops, and conditioning work (burpees, mountain climbers, Sweat circuits)
follows Sweat's time / repeat-output logic. Applied only where the prescription is strength-oriented: every Strength block except
the finisher, and Athletic's Athletic Strength block. Sweat never.

Kinds:
  bodyweight_adjustable  assistance (band / machine / easier angle) or added load (belt, vest, plate) moves the movement into range
  bodyweight_leverage    range, lever length or support moves it into range (adding load is uncommon)
"""
from __future__ import annotations

# id -> (kind, easier, harder)
LOAD_SCALING = {
    'pull_up': ('bodyweight_adjustable', 'use a band or the assisted pull-up machine', 'add weight with a belt or vest'),
    'chin_up': ('bodyweight_adjustable', 'use a band or the assisted pull-up machine', 'add weight with a belt or vest'),
    'neutral_grip_pull_up': ('bodyweight_adjustable', 'use a band or the assisted pull-up machine', 'add weight with a belt or vest'),
    'parallel_bar_dip': ('bodyweight_adjustable', 'use a band or the assisted dip machine', 'add weight with a belt or vest'),
    'bench_dip': ('bodyweight_adjustable', 'bend your knees', 'straighten your legs, raise your feet or rest a plate on your lap'),
    'push_up': ('bodyweight_adjustable', 'put your hands on a bench', 'wear a vest, rest a plate on your back or raise your feet'),
    'deficit_push_up': ('bodyweight_adjustable', 'put your hands on a bench', 'wear a vest or rest a plate on your back'),
    'diamond_push_up': ('bodyweight_adjustable', 'put your hands on a bench', 'wear a vest or raise your feet'),
    'inverted_row': ('bodyweight_adjustable', 'raise the bar or bend your knees', 'lower the bar, straighten your legs or wear a vest'),
    'nordic_curl': ('bodyweight_leverage', 'use a band or push off the floor with your hands, or stop the lowering earlier', 'use less help and control the lowering through a longer range'),
    'reverse_nordic': ('bodyweight_leverage', 'shorten the range', 'lean back further'),
    'sissy_squat': ('bodyweight_leverage', 'hold a support and shorten the range', 'hold a plate at your chest'),
}

SHORT = {'bodyweight_adjustable': 'Scale assistance or load', 'bodyweight_leverage': 'Scale the range'}


def scaling_for(exercise_id: str, *, reps=None, rir=None, is_range: bool = True):
    """-> dict(kind, short, detail) or None. Presentation only: sets, reps and the effort target are untouched."""
    m = LOAD_SCALING.get(exercise_id)
    if not m: return None
    kind, easier, harder = m
    left = f'about {rir} good rep{"s" if rir != 1 else ""} left' if isinstance(rir, int) and rir > 0 else 'a clean last rep'
    goal = (f'lets you land in the rep range with {left}' if (is_range or reps is None)
            else f'lets you do {reps} reps with {left}')
    detail = f"Make it fit you. Too hard: {easier}. Too easy: {harder}. Pick the version that {goal}; the effort matters more than the exact count."
    return dict(kind=kind, short=SHORT[kind], detail=detail)


def apply_scaling(blocks, direction: str):
    """Attach prescription.scaling to strength-oriented rows of a rendered workout (in place). Returns the ids it touched."""
    touched = []
    if direction not in ('strength', 'athletic'): return touched
    for b in blocks:
        if direction == 'strength' and b.get('type') == 'finisher': continue
        if direction == 'athletic' and b.get('type') != 'strength': continue
        for it in b.get('items', []):
            rx = it.get('prescription') or {}
            if rx.get('kind') != 'reps': continue
            reps = str(rx.get('reps') or '')
            sc = scaling_for(it['exercise']['id'], reps=reps, rir=rx.get('rir'), is_range=('–' in reps or '-' in reps))
            if not sc: continue
            rx['scaling'] = sc
            lg = rx.get('load_guidance') or ''
            lg = lg.replace('Bodyweight: work within the rep range. ', '').strip()
            if lg and lg[-1] not in '.!?': lg += '.'
            rx['load_guidance'] = (lg[:1].upper() + lg[1:] + ' ' + sc['detail']).strip()
            touched.append(it['exercise']['id'])
    return touched


# ---- What the app SAYS an exercise trains (founder pass: muscle labels).
# The frozen library's primary_muscles drive selection, soreness and progression and stay as they are. They name the lead
# muscle of the movement, which reads wrong on screen for whole-body and conditioning work (a burpee is not "Quads", a bike
# is not "Quads", a thruster is not "Quads + Shoulders"). This map is display only: exercise_ref() ships it as
# display_muscles, the app shows it wherever it labels an exercise or a block. Ids not listed show primary_muscles.
# Tokens: real muscles, plus 'full_body', 'cardio' and 'lower_body' (the app title-cases them: "Full Body", "Cardio").
DISPLAY_MUSCLES = {
    # conditioning machines and cyclical cardio
    'row_erg': ['full_body', 'cardio'],
    'ski_erg': ['full_body', 'cardio'],
    'air_bike': ['full_body', 'cardio'],
    'stationary_bike': ['cardio'],
    'treadmill_run': ['cardio'],
    'treadmill_incline_walk': ['cardio'],
    'stair_climber': ['cardio'],
    'high_knees': ['cardio'],
    'jump_rope': ['cardio'],
    'jumping_jack': ['cardio'],
    'db_jumping_jack': ['cardio', 'shoulders'],
    'mountain_climber': ['core', 'cardio'],
    'battle_rope_waves': ['shoulders', 'cardio'],
    # whole-body movements: legs drive, arms finish
    'burpee': ['full_body', 'cardio'],
    'barbell_thruster': ['full_body'],
    'db_thruster': ['full_body'],
    'db_squat_to_press': ['full_body'],
    'landmine_squat_to_press': ['full_body'],
    'reverse_lunge_to_press': ['full_body'],
    'devil_press': ['full_body'],
    'db_clean_to_press': ['full_body'],
    'kb_clean_and_press': ['full_body'],
    'db_snatch': ['full_body'],
    'kb_snatch': ['full_body'],
    'turkish_get_up': ['full_body'],
    'wall_ball': ['full_body'],
    'med_ball_slam': ['full_body'],
    'mb_overhead_throw': ['full_body'],
    'sled_push': ['full_body'],
    'plate_push': ['full_body'],
    'sled_pull': ['full_body'],
    'farmer_carry': ['full_body'],
    'front_rack_carry': ['full_body'],
    # sprints: hips drive them, not the quads
    'acceleration_sprint': ['glutes', 'hamstrings'],
    'falling_start_sprint': ['glutes', 'hamstrings'],
    'half_kneeling_start_sprint': ['glutes', 'hamstrings'],
    'split_stance_start_sprint': ['glutes', 'hamstrings'],
    'push_up_start_sprint': ['glutes', 'hamstrings'],
    'drop_step_sprint': ['glutes', 'hamstrings'],
    'sprint_to_stick': ['glutes', 'hamstrings'],
    'broad_jump_to_sprint': ['glutes', 'hamstrings'],
    'single_leg_hop_to_sprint': ['glutes', 'hamstrings'],
    'crossover_sprint': ['glutes', 'hamstrings'],
    # agility, footwork and running drills: the whole lower body, no single lead muscle
    'pro_agility_shuttle': ['lower_body'],
    'short_shuttle': ['lower_body'],
    'cut_and_go': ['lower_body'],
    'lateral_shuffle_stick': ['lower_body'],
    'shuffle_crossover_sprint': ['lower_body'],
    'backpedal_to_stick': ['lower_body'],
    'carioca': ['lower_body'],
    'wall_drill': ['lower_body'],
    'a_march': ['lower_body'],
    'a_skip': ['lower_body'],
    'power_skip': ['lower_body'],
    'dot_drill': ['lower_body'],
    'line_hops': ['calves', 'lower_body'],
    'pogo_hop': ['calves', 'lower_body'],
}


def display_muscles(exercise_id: str, primary_muscles) -> list:
    """What to label the exercise with: the founder display map, else the library's primary muscles."""
    return list(DISPLAY_MUSCLES.get(exercise_id) or primary_muscles or [])
