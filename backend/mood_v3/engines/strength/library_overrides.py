"""Targeted metadata re-score for the existing Strength library (pre-freeze pass). No exercises added.

Novelty (1..5) in Library v11 sits at the floor for 106 of 196 exercises, which left Bored with almost nothing to prefer.
This re-scores exercises that are legitimately less common in a general commercial-gym population by one step (a few by two),
judged against how often a typical member sees them programmed. Applied at import by core.py; the frozen workbook is untouched
and the frozen parity harness (which does not import core) still sees the original values.
"""
NOVELTY_RESCORE = {
    # back
    'pendlay_row': 3, 't_bar_row': 2, 'weighted_pull_up': 3, 'single_arm_lat_pulldown': 3, 'straight_arm_pulldown': 3, 'cable_pullover': 3,
    'single_arm_cable_row': 2, 'chin_up': 2, 'neutral_grip_pull_up': 2, 'inverted_row': 3,
    # arms
    'incline_db_curl': 2, 'ez_reverse_curl': 3, 'cable_triceps_kickback': 3, 'single_arm_cable_triceps_extension': 3, 'diamond_push_up': 3,
    'bench_dip': 2, 'close_grip_bench_press': 2, 'db_overhead_extension': 2, 'seated_dip_machine': 2,
    # calves / small
    'single_leg_db_calf_raise': 3, 'hack_squat_calf_raise': 3, 'banded_lateral_walk': 3, 'cable_hip_abduction': 3, 'cable_hip_adduction': 2,
    # chest
    'deficit_push_up': 3, 'weighted_push_up': 3, 'cable_chest_press': 3,
    # core
    'ab_wheel_rollout': 3, 'cable_wood_chop': 3, 'suitcase_carry': 3, 'hollow_hold': 3, 'dead_bug': 2, 'decline_sit_up': 2, 'weighted_sit_up': 2,
    # glutes / hamstrings
    'kettlebell_swing': 3, 'sumo_deadlift': 3, 'box_step_up_glute': 2, 'single_leg_rdl': 3, 'standing_single_leg_curl': 3, 'good_morning': 4,
    'barbell_glute_bridge': 2, 'single_leg_glute_bridge': 2, 'kettlebell_deadlift': 2,
    # quads
    'front_squat': 3, 'barbell_thruster': 3, 'db_thruster': 3, 'db_squat_to_press': 3, 'single_leg_leg_press': 3, 'walking_lunge': 2,
    'pit_shark_belt_squat': 3, 'sled_push': 3,
    # shoulders
    'arnold_press': 3, 'cable_rear_delt_fly': 3, 'plate_front_raise': 3, 'face_pull': 2,
}


def apply(EX):
    changed = 0
    for eid, nov in NOVELTY_RESCORE.items():
        e = EX.get(eid)
        if e and e['nov'] != nov: e['nov'] = nov; changed += 1
    return changed
