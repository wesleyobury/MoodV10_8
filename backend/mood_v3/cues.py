"""Minimum launch cue layer.

Priority (per founder brief): 1 technical Olympic / explosive movements, 2 Athletic quality-stop rules, 3 unusual movements,
4 exercises where a misunderstanding creates a safety or quality problem. Basic exercises get no hand-written cue: the app
falls back to the existing exercise library cues (db.exercises.cues) attached by the media layer when present.
Quality-stop cues are keyed by the frozen Athletic quality class so every Athletic exposure gets one.
"""

QUALITY_STOP = {
    'jump': 'End the set when jump height drops or landings get loud and heavy.',
    'loaded_jump': 'End the set when jump height drops. Keep the load light enough to leave the floor fast.',
    'jump_combo': 'End the set when either jump loses height or you cannot stick the landing.',
    'hop': 'End the set when you cannot stick the landing quietly on one leg.',
    'bound': 'End the set when distance per bound drops or the landing gets heavy.',
    'lateral_power': 'End the set when distance drops or you cannot stick the landing.',
    'elastic': 'Stay springy with short ground contacts. End the set when the rhythm or bounce fades.',
    'olympic': 'Every rep fast. End the set when the bar slows noticeably or technique changes.',
    'explosive_lift': 'Pick a weight that stays fast. End the set when it slows noticeably.',
    'upper_power': 'Dip and drive fast. End the set when the bar or bell slows noticeably.',
    'rotational_power': 'Fast hips. End the set when the movement slows or loses snap.',
    'throw': 'Throw with full intent. End the set when throws lose snap or distance.',
    'rotational_throw': 'Drive from the back hip. End the set when throws lose snap.',
    'acceleration': 'Full walk-back between reps. Stop the drill if a rep feels clearly slower than the first.',
    'sled': 'Drive fast. Take the full rest; stop if the sled slows clearly from the first rep.',
    'decel': 'Stop in two steps with control. End the set when stops get sloppy.',
    'integrated': 'Hips level and controlled. End the set when control slips.',
}

CUES = {
    # Olympic / explosive (priority 1)
    'power_snatch': ['Bar close to the body; extend hips hard, then pull under fast.', 'Catch in a quarter squat with arms locked overhead.'],
    'hang_power_clean': ['Start at mid-thigh, jump with the bar, then shrug and pull under.', 'Fast elbows; catch on the shoulders in a quarter squat.'],
    'db_hang_power_clean': ['Hinge to above the knees, jump, then pull the bells to the shoulders.', 'Fast elbows, soft knees on the catch.'],
    'split_jerk': ['Short dip, drive straight up, split feet fast.', 'Lock the arms before the feet land; recover front foot first.'],
    'push_press': ['Short, vertical dip through the heels, then drive the bar up fast.', 'Finish with arms locked and the bar over mid-foot.'],
    'landmine_push_press': ['Dip and drive through the legs; punch the bar up and forward.', 'Brace the trunk; do not lean back.'],
    'landmine_split_jerk': ['Dip, drive and split in one fast motion.', 'Lock the arm before the feet land.'],
    'landmine_rotational_punch': ['Turn the back hip through, then punch.', 'Rotate from the hips, not the lower back.'],
    'landmine_rotational_clean_press': ['Pull from the hip, catch at the shoulder, then press.', 'Pivot the back foot; keep the trunk braced.'],
    'kettlebell_swing': ['Hinge, not squat: hips back, shins vertical.', 'Snap the hips; the bell floats, arms do not lift it.'],
    'db_snatch': ['One motion from floor to overhead: hinge, jump, punch through.', 'Keep the bell close; lock the arm at the top.'],
    'kb_snatch': ['Hips drive the bell; punch through at the top so it does not crash on the wrist.'],
    'db_clean_to_press': ['Clean with the hips, then press; reset the brace between.'],
    'kb_clean_and_press': ['Clean with a hip snap, pause at the rack, then press.'],
    'trap_bar_jump': ['Light load. Jump as high as you can and land softly with the handles.', 'Reset before each rep.'],
    'drop_jump': ['Step off, do not jump off. Rebound instantly with minimal ground contact.'],
    'reactive_vertical_jump': ['Stiff ankles, short contacts; stay tall between jumps.'],
    'alternating_bound': ['Drive the knee up and forward; reach for distance each contact.'],
    'box_jump': ['Land softly in the same stance you took off in. Step down, do not jump down.'],
    'seated_box_jump': ['Sit tall, swing the arms and jump from the seat. Land quiet.'],
    'broad_jump': ['Swing the arms, jump out and stick the landing for a full second.'],
    'acceleration_sprint': ['Lean from the ankles, drive the arms, push the ground back.', 'Walk back fully before the next rep.'],
    'falling_start_sprint': ['Fall forward until you must step, then sprint 5 m.'],
    'sprint_to_stick': ['Accelerate 5 m, then stop in two steps with hips low.'],
    'sled_push': ['Arms locked or bent, body at 45 degrees; short, fast steps.'],
    'med_ball_slam': ['Reach tall, then slam through the floor with the whole body.'],
    'mb_rotational_slam': ['Rotate and slam beside the foot; alternate sides.'],
    'mb_chest_pass': ['Explosive chest throw into a wall; catch soft and reset.'],
    'mb_overhead_throw': ['Load the hips, throw overhead into the wall with full intent.'],
    'mb_backward_toss': ['Hinge, then explode the hips to throw the ball back overhead. Clear space behind you.'],
    'bear_crawl_ball_toss': ['Hips level while crawling; toss the ball forward and follow it.'],
    # unusual movements (priority 3) and misunderstanding / safety risk (priority 4)
    'nordic_curl': ['Anchor the heels, lower as slowly as you can, catch with the hands.'],
    'reverse_nordic': ['Hips extended; lean back only as far as you can control.'],
    'copenhagen_plank': ['Top leg on the bench; lift the hips in one straight line.'],
    'turkish_get_up': ['Eyes on the bell; locked arm vertical the whole way.'],
    'pallof_press': ['Press straight out and resist the turn; hips stay square.'],
    'pallof_step_out': ['Step out without letting the handle pull you round.'],
    'landmine_rotation': ['Arms long, turn through the hips; the lower back stays quiet.'],
    'good_morning': ['Soft knees, push the hips back with a flat back; stop at a hamstring stretch.'],
    'zercher_squat': ['Bar in the elbow crease, torso tall, squat between the hips.'],
    'barbell_back_squat': ['Brace before each rep; knees track over the toes.', 'Use safeties set just below the bottom position.'],
    'barbell_bench_press': ['Shoulder blades pinned, feet planted; touch the lower chest.', 'Use safeties or a spotter near hard sets.'],
    'conventional_deadlift': ['Bar over mid-foot, push the floor away, bar stays on the legs.'],
    'barbell_rdl': ['Soft knees, hips back, bar slides down the thighs; stop at a hamstring stretch.'],
    'db_rdl': ['Hips back, flat back; stop at a hamstring stretch.'],
    'single_leg_rdl': ['Hips square, reach the free leg back; move slowly.'],
    'barbell_hip_thrust': ['Upper back on the bench edge, chin tucked; lock out with the glutes, not the lower back.'],
    'bulgarian_split_squat': ['Most weight on the front foot; drop the back knee straight down.'],
    'wall_ball': ['Squat to depth, drive up and throw to the target in one motion.'],
    'burpee': ['Chest to floor, jump the feet in, stand and jump.'],
    'battle_rope_waves': ['Athletic stance, fast alternating waves from the shoulders.'],
    'farmer_carry': ['Tall posture, shoulders down, short quick steps.'],
    'suitcase_carry': ['One bell; do not lean toward it. Walk tall.'],
    'overhead_carry': ['Arm locked overhead, ribs down, walk tall.'],
    'plate_push': ['Hands on the plate, hips low, drive with short fast steps.'],
    'sled_pull': ['Lean back, walk backwards with short steps.'],
    'devil_press': ['Burpee onto the bells, then swing them overhead in one motion.'],
    'renegade_row': ['Wide feet, hips square; row without twisting.'],
}

def quality_stop(quality):
    return QUALITY_STOP.get(quality)

def cues_for(eid):
    return list(CUES.get(eid, []))

def strength_effort_text(rir, cls):
    if rir is None: return None
    if rir <= 0: return 'Take the last set close to failure with clean form.'
    return f'Stop each set with about {rir} rep{"s" if rir != 1 else ""} left in the tank.'
