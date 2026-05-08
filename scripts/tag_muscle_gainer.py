#!/usr/bin/env python3
"""
Tag all 880 muscle gainer workouts across 11 data files.
Adds: exercise_type, movement_pattern, training_style, intensity_cost.
Heuristic-driven with explicit overrides for spec exceptions.
Idempotent: skips workouts that already have `exercise_type` set.
"""
import re
import os
from pathlib import Path

DATA_DIR = Path('/app/frontend/data')

FILES = {
    'Chest': 'chest-workouts-data.ts',
    'Back': 'back-workouts-data.ts',
    'Shoulders': 'shoulders-workouts-data.ts',
    'Biceps': 'biceps-workouts-data.ts',
    'Triceps': 'triceps-workouts-data.ts',
    'Abs': 'abs-workouts-data.ts',
    'Quads': 'quads-workouts-data.ts',
    'Hamstrings': 'hamstrings-workouts-data.ts',
    'Glutes': 'glutes-workouts-data.ts',
    'Calves': 'calves-workouts-data.ts',
    'CompoundLegs': 'compound-legs-workouts-data.ts',
}


def lc(s): return s.lower()


def compute_training_style(name: str) -> str:
    n = lc(name)

    # 1) MIXED — combos / contrasts / supersets / "&" combos / "Iso Finish"
    mixed_substrings = [
        'contrast', 'combo', 'superset', 'super-set', 'flow',
        '& push', '& drive', '& fire', '& explode',
        'iso finish', '+ iso', '+ pushup', '+ pulse',
        '+ flutter', '+ leg raise', '+ hold', '+ rep',
        '+ jumps', '+ rack pull', '+ rdl', '+ rep abduction',
        '+ row', '+ press-out', '+ toe touch', '+ plank', '+ slow',
        'press + ', 'fly + ', 'extension + ', 'squat + ',
        'twist & hold', 'row & ', 'dead + ', 'dead row shrug',
        'dead clean', 'pull combo', 'snatch clean', 'row swing dead',
        'pull-through + ', 'pull through + ', 'pulldown + hold',
        'pulldown superset', 'pull-up + ', 'pull-up + iso',
        'curl + iso', 'curl + hammer', 'curl + reverse',
        'curl + face-away', 'curl + partial', 'press + iso',
        'press + raise', 'press + halo', 'press + rotational',
        'angle progression', 'press + pushup', 'cluster drop set press',
        'iso crunch + flutter', 'crunch + leg raise',
        'mb slam + plank', 'rollout + plank',
        'leg raise → knee tuck', 'leg raise -> knee tuck',
        'mb dead bug', 'mb overhead hold flutter',
        'sit up + flutter', 'cable squat to row', 'cable squat to rdl',
        'hack squat calf raise', 'rope + bar combo',
        'press & explode', 'press & drive', 'press & fire', 'press & push',
        'smith & explode', 'smith & push', 'cable & push', 'cable & explode',
        'fly & push', 'fly & explode', 'dip & push', 'dip & explode',
        'incline & fire', 'decline & drive',
        'iso wide rows', 'iso-finish rows', 'iso hold rows',
        'iso-hold cable', 'iso-hold drop', 'iso hold + pulses',
        'iso-hold machine crunch', 'iso squeeze rows',
        'iso hinge hold', 'curl + iso hold', 'extension + pause',
        'iso burn', 'long-pause', 'long-hold',
        'kb extension + iso', 'kb burn builder', 'kb burnout',
        'kb extension drop', 'curl + iso finish', 'extension + iso finish',
        'overhead cable extension + iso',
        'press + iso hold', 'extensions + hold', 'sit up with 3s hold',
        'sit-up to press-out', 'overhead bar ext', 'overhead 21s',
        'mb slam + toe touch',  # treated mixed (combo)
        'pulldown + hold', 'pull-ups + iso', 'cable assisted squat hold',
        'extension + pause', 'hold + rep', 'iso + jumps',
    ]
    for kw in mixed_substrings:
        if kw in n:
            return 'mixed'

    # 2) STRENGTH — heavy/pause/tempo/slow/cluster/strict/density/wave/eccentric/1.5/1½
    strength_substrings = [
        'heavy', 'paused', 'pause ', 'pauses', ' pause', 'tempo',
        'slow', 'cluster', 'strict', 'density', 'wave',
        '1.5 rep', '1½ rep', '1.5-rep', '1½-rep', '1½ ',
        'eccentric', 'long eccentric', 'long-eccentric',
        'negative', 'split jerk', 'snatch-grip push press',
        'max-load', 'paused ', 'pause ',
        'strength test', 'cluster control', 'paused depth',
        'paused strength', 'strict press drop',  # name still has Strict
        'pendlay', 'high pull control', 'cluster drop',
        'extensive hold', 'long-pause',
    ]
    for kw in strength_substrings:
        if kw in n:
            return 'strength'

    # 3) PUMP — burn/burnout/drop/21s/pulse/iso hold/light/partial
    pump_substrings = [
        'burnout', 'burn ', ' burn', ' drop ', 'drop ', ' drop-',
        'drop set', 'drop-set', 'drop ladder', 'drop cluster',
        'drop cascade', 'triple drop', 'drop series', 'drop assault',
        'drop-angle', 'drops', 'pulse', '21s',
        'iso hold', 'iso-hold', 'iso burnout', 'burnout hold',
        'hold burner', 'partial', 'light bar', 'light!',
        '(light)', 'machine crunch (light)', 'top-half',
        'hold reps', 'speed sets', 'kickback hold', 'iso burn',
        'fatigue builder', 'burnout pull-up', 'burnout ladder',
    ]
    for kw in pump_substrings:
        if kw in n:
            return 'pump'

    # 4) HYPERTROPHY — builder/foundations/working/fundamentals/control
    hyper_substrings = [
        'builder', 'foundation', 'foundations', 'working',
        'fundamentals', ' control', 'control ',
    ]
    for kw in hyper_substrings:
        if kw in n:
            return 'hypertrophy'

    return 'hypertrophy'


def compute_intensity_cost(tier: str, name: str, style: str, muscle: str) -> int:
    n = lc(name)
    base = {'beginner': 3, 'intermediate': 4, 'advanced': 5}[tier]

    # Light → drop one tier
    if 'light' in n or '(light)' in n:
        base = max(1, base - 1)
        return base

    # Chest beginner pump → 2 (per spec table)
    if muscle == 'Chest' and tier == 'beginner' and style == 'pump':
        return 2

    # Hamstrings beginner: "Barbell Good Morning (Light!)" already caught by light
    return base


def compute_type_pattern(muscle: str, equipment: str, name: str) -> tuple:
    """Returns (exercise_type, movement_pattern)."""
    n = lc(name)
    eq = lc(equipment)

    # ===== CHEST =====
    if muscle == 'Chest':
        if eq == 'flat bench':
            return ('compound', 'horizontal_press')
        if eq == 'incline bench':
            return ('compound', 'incline_press')
        if eq == 'decline bench':
            return ('compound', 'decline_press')
        if eq in ('smith machine', 'chest press machine'):
            return ('compound', 'horizontal_press')
        if eq == 'dumbbells':
            return ('compound', 'horizontal_press')
        if eq == 'pec dec machine':
            return ('isolation', 'fly')
        if eq == 'cable crossover':
            return ('isolation', 'fly')
        if eq == 'dip station':
            return ('compound', 'dip')

    # ===== BACK =====
    if muscle == 'Back':
        if eq == 'roman chair':
            return ('isolation', 'hyperextension')
        if eq == 'lat pull down machine':
            return ('compound', 'vertical_pull')
        if eq in ('straight pull up bar', 'grip variation pull up bar'):
            return ('compound', 'vertical_pull')
        if eq == 'powerlifting platform':
            return ('compound', 'deadlift')
        if eq == 'barbell':
            # Most are rows; if "RDL" or "Deadlift", deadlift pattern
            if 'rdl' in n or 'deadlift' in n or 'dead row' in n or 'dead clean' in n or 'good morning' in n:
                return ('compound', 'deadlift')
            return ('compound', 'horizontal_pull')
        if eq == 'kettle bells':
            if 'swing dead' in n or 'snatch' in n:
                return ('compound', 'horizontal_pull')
            return ('compound', 'horizontal_pull')
        if eq in ('dumbbells', 't bar row machine', 'seated cable machine',
                  'seated chest supported row machine'):
            return ('compound', 'horizontal_pull')

    # ===== SHOULDERS =====
    if muscle == 'Shoulders':
        if eq == 'shoulder press machine':
            return ('compound', 'vertical_press')
        if eq == 'rear delt fly machine':
            return ('isolation', 'rear_delt')
        if eq == 'smith machine':
            if 'upright row' in n:
                return ('compound', 'upright_row')
            return ('compound', 'vertical_press')
        if eq == 'cable crossover machine':
            # Default isolation; movement depends on name
            if 'face pull' in n:
                return ('isolation', 'rear_delt')
            if 'rear delt' in n or 'rear-delt' in n:
                return ('isolation', 'rear_delt')
            if 'front raise' in n or 'pull-through' in n or 'pull through' in n:
                return ('isolation', 'front_raise')
            if 'lateral' in n:
                return ('isolation', 'lateral_raise')
            if 'cable press' in n or 'single-arm cable press' in n:
                # Spec: this row is compound vertical_press
                return ('compound', 'vertical_press')
            return ('isolation', 'lateral_raise')
        if eq == 'dumbbells':
            if 'press' in n or 'arnold' in n:
                return ('compound', 'vertical_press')
            if 'lateral raise' in n or 'lateral' in n:
                return ('isolation', 'lateral_raise')
            if 'front raise' in n:
                return ('isolation', 'front_raise')
            if 'rear' in n or 'fly' in n:
                return ('isolation', 'rear_delt')
            return ('compound', 'vertical_press')
        if eq == 'barbell':
            if 'upright row' in n:
                return ('compound', 'upright_row')
            return ('compound', 'vertical_press')
        if eq == 'landmine attachment':
            return ('compound', 'vertical_press')
        if eq == 'adjustable bench':
            if 'press' in n or 'arnold' in n or 'iso finish' in n:
                return ('compound', 'vertical_press')
            if 'lateral raise' in n or 'lateral' in n:
                return ('isolation', 'lateral_raise')
            if 'front raise' in n:
                return ('isolation', 'front_raise')
            if 'fly' in n:
                return ('isolation', 'rear_delt')
            return ('compound', 'vertical_press')
        if eq == 'kettlebells':
            if 'press' in n or 'arnold' in n or 'push press' in n:
                return ('compound', 'vertical_press')
            if 'upright row' in n:
                return ('compound', 'upright_row')
            if 'lateral raise' in n:
                return ('isolation', 'lateral_raise')
            if 'front raise' in n:
                return ('isolation', 'front_raise')
            return ('compound', 'vertical_press')
        if eq == 'powerlifting platform':
            if 'high pull' in n:
                return ('compound', 'upright_row')
            return ('compound', 'vertical_press')

    # ===== BICEPS =====
    if muscle == 'Biceps':
        if eq == 'pull-up bar':
            return ('compound', 'chin_up')
        if eq == 'preacher curl machine':
            return ('isolation', 'preacher_curl')
        if 'hammer' in n or 'rope cable curl' in n or 'rope curl' in n:
            return ('isolation', 'hammer_curl')
        return ('isolation', 'curl')

    # ===== TRICEPS =====
    if muscle == 'Triceps':
        if eq == 'dip station / machine':
            return ('compound', 'dip')
        if 'close-grip ez press' in n or 'close grip ez press' in n:
            return ('compound', 'close_grip_press')
        if 'skullcrusher' in n:
            return ('isolation', 'skullcrusher')
        if 'pushdown' in n:
            return ('isolation', 'pushdown')
        if 'overhead' in n or 'extension' in n:
            return ('isolation', 'overhead_extension')
        if 'kickback' in n:
            return ('isolation', 'overhead_extension')
        # Default by equipment
        if eq == 'tricep pushdown machine':
            return ('isolation', 'pushdown')
        if eq == 'cable crossover machine':
            return ('isolation', 'pushdown')
        if eq == 'single extension cable':
            return ('isolation', 'overhead_extension')
        if eq == 'trx bands':
            return ('isolation', 'overhead_extension')
        return ('isolation', 'overhead_extension')

    # ===== ABS =====
    if muscle == 'Abs':
        # Pattern by name keywords first
        if 'rollout' in n:
            return ('isolation', 'rollout')
        if 'side bend' in n:
            return ('isolation', 'side_bend')
        if 'twist' in n or 'bicycle' in n or 'rotation' in n or 'oblique' in n or 'mb v sit twist' in n:
            return ('isolation', 'rotation')
        if ('plank' in n or 'hollow' in n or 'anti-rotation' in n or
                'anti-extension' in n or 'dead bug' in n or 'mb dead bug' in n):
            return ('isolation', 'plank')
        if 'sit up' in n or 'sit-up' in n or 'v up' in n or 'v-up' in n or 'v sit' in n or 'dragon flag' in n:
            return ('isolation', 'sit_up')
        if 'leg raise' in n or 'knee raise' in n or 'toes-to-bar' in n or 'knee-to-chest' in n or 'l-sit' in n or 'knee tuck' in n:
            return ('isolation', 'leg_raise')
        if 'crunch' in n:
            return ('isolation', 'crunch')
        # Defaults by equipment
        if eq == 'ab roller':
            return ('isolation', 'rollout')
        if eq == "captain's chair":
            return ('isolation', 'leg_raise')
        if eq == 'ab crunch machine':
            return ('isolation', 'crunch')
        if eq == 'roman hyperextension':
            return ('isolation', 'sit_up')
        if eq == 'pull-up bar':
            return ('isolation', 'leg_raise')
        if eq == 'decline bench':
            return ('isolation', 'sit_up')
        if eq == 'medicine ball':
            return ('isolation', 'sit_up')
        return ('isolation', 'crunch')

    # ===== QUADS =====
    if muscle == 'Quads':
        if eq == 'leg extension machine':
            return ('isolation', 'leg_extension')
        if eq == 'barbell':
            if 'lunge' in n or 'step-up' in n or 'step up' in n:
                return ('compound', 'lunge')
            return ('compound', 'squat')

    # ===== HAMSTRINGS =====
    if muscle == 'Hamstrings':
        if eq == 'leg curl machine':
            return ('isolation', 'leg_curl')
        if eq == 'roman chair':
            return ('isolation', 'hyperextension')
        if eq in ('barbell', 'dumbbells'):
            if 'sumo deadlift' in n or 'rack pull' in n:
                return ('compound', 'deadlift')
            return ('compound', 'hinge')

    # ===== GLUTES =====
    if muscle == 'Glutes':
        if eq == 'barbell':
            return ('compound', 'squat')
        if eq == 'hip thruster equipment':
            return ('compound', 'hip_thrust')
        if eq == 'glute kick machine':
            return ('isolation', 'kickback')
        if eq == 'hip abductor machine':
            return ('isolation', 'hip_abduction')
        if eq == 'single stack cable machine':
            # mixed — depends on name
            if 'pull-through' in n or 'pull through' in n:
                return ('compound', 'pull_through')
            if 'kickback' in n or 'hip extension' in n:
                return ('isolation', 'kickback')
            if 'lunge' in n or 'step-up' in n or 'step up' in n or 'step-back' in n or 'step through' in n:
                return ('compound', 'lunge')
            if 'rdl' in n or 'romanian deadlift' in n:
                return ('compound', 'hinge')
            if 'squat' in n:
                return ('compound', 'squat')
            return ('isolation', 'kickback')

    # ===== CALVES =====
    if muscle == 'Calves':
        return ('isolation', 'calf_raise')

    # ===== COMPOUND LEGS =====
    if muscle == 'CompoundLegs':
        # Always compound. Pattern from name.
        if 'jump squat' in n:
            return ('compound', 'jump_squat')
        if 'rdl' in n or 'romanian deadlift' in n or 'good morning' in n or 'hip hinge' in n or 'stiff-leg' in n or 'walkouts' in n or 'kb swing' in n or 'kb controlled swing' in n or 'swing' in n:
            return ('compound', 'hinge')
        if 'deadlift' in n:
            return ('compound', 'deadlift')
        if 'lunge' in n or 'step-up' in n or 'step up' in n or 'split squat' in n or 'static lunge' in n or 'step through' in n or 'step-back' in n:
            return ('compound', 'lunge')
        if 'squat' in n:
            return ('compound', 'squat')
        # Default
        return ('compound', 'squat')

    # Fallback (should not reach here)
    return ('compound', 'horizontal_press')


WORKOUT_OPEN_RE = re.compile(r'^        \{\s*$')
WORKOUT_CLOSE_RE = re.compile(r'^        \},?\s*$')
EQUIPMENT_RE = re.compile(r"equipment:\s*'([^']+)'")
TIER_RE = re.compile(r'^\s*(beginner|intermediate|advanced):\s*\[')
NAME_RE = re.compile(r"name:\s*'([^']+)'")


def process_file(muscle: str, filename: str):
    path = DATA_DIR / filename
    with open(path) as f:
        lines = f.readlines()

    out = []
    equipment = None
    tier = None
    in_workout = False
    workout_buf = []
    workout_name = None
    has_existing_tag = False
    tagged = 0
    skipped = 0

    for line in lines:
        if not in_workout:
            m = EQUIPMENT_RE.search(line)
            if m:
                equipment = m.group(1)
            m = TIER_RE.match(line)
            if m:
                tier = m.group(1)
            if WORKOUT_OPEN_RE.match(line):
                in_workout = True
                workout_buf = [line]
                workout_name = None
                has_existing_tag = False
                continue
            out.append(line)
            continue

        # in_workout
        workout_buf.append(line)
        if workout_name is None:
            m = NAME_RE.search(line)
            if m:
                workout_name = m.group(1)
        if 'exercise_type:' in line:
            has_existing_tag = True

        if WORKOUT_CLOSE_RE.match(line):
            close_line = workout_buf.pop()
            if workout_name is None:
                out.extend(workout_buf)
                out.append(close_line)
                skipped += 1
            else:
                # Strip any existing muscle gainer tags for idempotency
                tag_keys = ('exercise_type:', 'movement_pattern:',
                            'training_style:', 'intensity_cost:')
                workout_buf = [ln for ln in workout_buf
                               if not any(k in ln for k in tag_keys)]

                style = compute_training_style(workout_name)
                ic = compute_intensity_cost(tier, workout_name, style, muscle)
                et, mp = compute_type_pattern(muscle, equipment, workout_name)

                # Add trailing comma to last non-empty line
                idx = len(workout_buf) - 1
                while idx >= 0 and workout_buf[idx].strip() == '':
                    idx -= 1
                last = workout_buf[idx]
                stripped = last.rstrip()
                if not stripped.endswith(','):
                    workout_buf[idx] = stripped + ',\n'

                indent = '          '
                tag_lines = [
                    f"{indent}exercise_type: '{et}',\n",
                    f"{indent}movement_pattern: '{mp}',\n",
                    f"{indent}training_style: '{style}',\n",
                    f"{indent}intensity_cost: {ic},\n",
                ]
                out.extend(workout_buf)
                out.extend(tag_lines)
                out.append(close_line)
                tagged += 1

            in_workout = False
            workout_buf = []
            workout_name = None

    with open(path, 'w') as f:
        f.writelines(out)
    print(f"  {muscle:14s} ({filename}): tagged={tagged}  skipped={skipped}")
    return tagged, skipped


def main():
    print("Tagging muscle gainer workouts...")
    total_tagged = 0
    total_skipped = 0
    for muscle, fname in FILES.items():
        t, s = process_file(muscle, fname)
        total_tagged += t
        total_skipped += s
    print(f"\nTotal tagged: {total_tagged}")
    print(f"Total skipped: {total_skipped}")


if __name__ == '__main__':
    main()
