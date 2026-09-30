"""MOOD V3 Athletic core (V3 Athletic rebuild).

One question drives every decision: why these athletic qualities, movements, doses and recovery periods for this person today?
Defining rule: power, speed and skill are performed fresh and with enough recovery to stay power, speed and skill.

Pipeline (deterministic for the same inputs, seed and history):
    make_ctx -> resolve States (ownership) -> candidate (primary quality, structure) list ranked by archetype / goal / level /
    Target / soreness / State / history -> build_session (prep, primary, optional secondary, athletic strength, optional support,
    rare finisher) -> account (impact + intent budget) -> reconcile to the budget -> State Satisfaction gate -> whole-session
    State Coherence (repairs, else next candidate) -> athletic_validate (independent invariants) -> result.

Library records come from the frozen Athletic library (lib2 / athletic_lib, read only). The legacy Reference Generator v1
(athletic_gen.py / sk5.py) is untouched and kept for the before / after comparison.
"""
from __future__ import annotations
import copy, hashlib
from .lib3 import LOWER, PRESETS, avail, quality as lib_quality, vector
from .audit2 import EX

LV = ('beginner', 'intermediate', 'advanced')
STATES = ('low_energy', 'bored', 'irritated', 'amped', 'stressed')

# Athletic 'minimal' preset = the unified minimal preset (dumbbells, bench, jump rope, bodyweight; home floor, no sprint lane)
# One launch addition to the frozen library (founder pass): the barbell Hang High Pull, the simplest barbell Olympic derivative
# (no catch), so intermediate users have a real barbell entry point. Media needs a check.
if 'hang_high_pull' not in EX and 'hang_power_clean' in EX:
    EX['hang_high_pull'] = dict(EX['hang_power_clean'], id='hang_high_pull', name='Hang High Pull', cx=3, skill='intermediate', nov=3, swap='high_pull',
                                prim=['glutes', 'hamstrings'], sec=['back', 'shoulders', 'forearms'], vtags='aq_olympic;vec_vertical', athletic_new=True)
# Identity pass (founder-directed): the smallest set of explicit athletic variants. Each is a distinct exercise with its own dose
# (never an ordinary strength exercise with a "move fast" cue). All flagged athletic_new=True, identity_new=True: media needed.
def _add(i, base, **kw):
    if i in EX or base not in EX: return
    EX[i] = dict(EX[base], id=i, athletic_new=True, identity_new=True, new=True, combo=False, comps=[], **kw)
_add('step_up_pop', 'bw_step_up', name='Explosive Step-Up (Pop)', family='step_up_pop', pat='jump', mfam='jump', mod='jump', eq='box', lat='unilateral',
     cx=1, nov=3, sysd=2, forceful=True, explosive=True, impact='moderate', skill='beginner', swap='step_up_pop', vtags='aq_unilateral_power;vec_vertical')
_add('db_step_up_pop', 'db_step_up', name='Dumbbell Step-Up with Pop', family='step_up_pop', pat='jump', mfam='jump', mod='jump', lat='unilateral',
     cx=2, nov=3, sysd=3, forceful=True, explosive=True, impact='moderate', skill='intermediate', swap='step_up_pop_loaded', vtags='aq_unilateral_power;vec_vertical')
_add('reverse_lunge_knee_drive_hop', 'reverse_lunge', name='Reverse Lunge to Knee-Drive Hop', family='lunge_hop', pat='jump', mfam='jump', mod='jump',
     eq='bodyweight', req=[], station='open_space', space='floor_space', lat='unilateral', cx=2, nov=3, sysd=2, forceful=True, explosive=True,
     impact='moderate', skill='beginner', swap='lunge_hop', prim=['quads', 'glutes'], sec=['calves', 'hamstrings'], vtags='aq_unilateral_power;vec_vertical')
_add('rfe_split_squat_jump', 'bulgarian_split_squat', name='Rear-Foot-Elevated Split Squat Jump', family='split_jump', pat='jump', mfam='jump', mod='jump',
     eq='bench', req=[], lat='unilateral', cx=3, nov=4, sysd=3, forceful=True, explosive=True, impact='moderate', skill='advanced', swap='rfe_split_jump',
     vtags='aq_unilateral_power;vec_vertical')
_add('band_assisted_muscle_up', 'pull_up', name='Band-Assisted Muscle-Up', family='muscle_up', pat='vertical_pull', mfam='muscle_up', mod='bodyweight',
     req=['bands'], cx=3, nov=4, sysd=3, forceful=True, explosive=True, impact='low', skill='intermediate', swap='muscle_up',
     prim=['back', 'chest', 'triceps'], sec=['biceps', 'shoulders', 'core'], vtags='aq_upper_power;vec_vertical')
_add('bar_muscle_up', 'pull_up', name='Bar Muscle-Up', family='muscle_up', pat='vertical_pull', mfam='muscle_up', mod='bodyweight', cx=4, nov=4, sysd=4,
     forceful=True, explosive=True, impact='low', skill='advanced', swap='muscle_up', prim=['back', 'chest', 'triceps'], sec=['biceps', 'shoulders', 'core'],
     vtags='aq_upper_power;vec_vertical')
_add('speed_trap_bar_deadlift', 'trap_bar_deadlift', name='Speed Trap-Bar Deadlift', family='speed_deadlift', cx=3, nov=3, sysd=3, explosive=True,
     skill='intermediate', swap='deadlift', vtags='aq_speed_strength;vec_vertical')
_add('speed_box_squat', 'barbell_back_squat', name='Speed Box Squat', family='speed_squat', cx=3, nov=3, sysd=3, explosive=True, req=['box'],
     skill='intermediate', swap='back_squat', vtags='aq_speed_strength;vec_vertical')

# API compatibility only (production always sends commercial_gym): 'minimal' matches the unified preset definition (DB, bench, jump rope, body weight)
PRESETS.setdefault('athletic_minimal', (frozenset({'bodyweight', 'dumbbells', 'bench', 'jump_rope'}), frozenset({'floor_space', 'standard_gym'})))
PRESET_ALIAS = {'default': 'athletic_commercial_default', 'floor': 'commercial_floor_only', 'free_weight': 'free_weight_limited',
                'bodyweight': 'bodyweight_floor', 'minimal': 'athletic_minimal'}


def u(seed, *parts):
    return int(hashlib.sha256('|'.join(map(str, (seed,) + parts)).encode()).hexdigest()[:10], 16) / 16 ** 10


# ================================================================== vocabulary
QUALITY_LABEL = {'acceleration': 'acceleration', 'vertical_power': 'vertical power', 'horizontal_power': 'horizontal power',
                 'rotational_power': 'rotational power', 'upper_power': 'upper-body power',
                 'total_body_power': 'total-body explosiveness', 'elastic_reactive': 'elastic, reactive ability'}
STRUCTURE_LABEL = {'power_strength': 'Power + Strength', 'speed_strength': 'Speed + Strength',
                   'jump_throw': 'Jump + Throw', 'contrast': 'Contrast Pairing', 'athletic_mixed': 'Athletic Mixed'}
ARCH_NAME = {'athletic_power': 'Power', 'athletic_speed_agility': 'Speed + Plyo', 'athletic_full_body': 'Full-Body Athlete'}
LOWER_Q = {'acceleration', 'vertical_power', 'horizontal_power', 'elastic_reactive', 'total_body_power'}
UPPER_Q = {'rotational_power', 'upper_power'}

# ------------------------------------------------------------------ power vocabulary: id -> (quality, kind, min level)
# kind drives dosing + accounting: jump, loaded_jump, combo, bound, hop, elastic, drop, lateral, decel, cod, sprint, sled,
# throw, slam, rot_throw, upper, landmine_rot, olympic, explosive_lift, swing
POWER = {
    # vertical
    'countermovement_jump': ('vertical_power', 'jump', 'beginner'), 'seated_box_jump': ('vertical_power', 'jump', 'beginner'),
    'box_jump': ('vertical_power', 'jump', 'intermediate'), 'db_jump_squat': ('vertical_power', 'loaded_jump', 'intermediate'),
    'trap_bar_jump': ('vertical_power', 'loaded_jump', 'intermediate'), 'banded_squat_jump': ('vertical_power', 'loaded_jump', 'intermediate'),
    'pogo_to_box_jump': ('vertical_power', 'combo', 'intermediate'),
    # horizontal
    'broad_jump': ('horizontal_power', 'jump', 'beginner'), 'banded_broad_jump': ('horizontal_power', 'loaded_jump', 'intermediate'),
    'broad_jump_to_vertical': ('horizontal_power', 'combo', 'intermediate'), 'alternating_bound': ('horizontal_power', 'bound', 'intermediate'),
    'single_leg_hop': ('horizontal_power', 'hop', 'intermediate'), 'consecutive_broad_jump': ('horizontal_power', 'bound', 'advanced'),
    # elastic / reactive
    'pogo_hop': ('elastic_reactive', 'elastic', 'intermediate'), 'reactive_vertical_jump': ('elastic_reactive', 'elastic', 'intermediate'),
    'single_leg_box_jump': ('elastic_reactive', 'hop', 'intermediate'), 'drop_jump': ('elastic_reactive', 'drop', 'advanced'),
    # acceleration
    'acceleration_sprint': ('acceleration', 'sprint', 'beginner'), 'falling_start_sprint': ('acceleration', 'sprint', 'beginner'),
    'sled_push': ('acceleration', 'sled', 'beginner'),
    # lateral power (legitimate jumping / bounding exercises; no footwork or agility drills at launch)
    'skater_hop': ('horizontal_power', 'lateral', 'beginner'), 'lateral_box_jump': ('horizontal_power', 'lateral', 'intermediate'),
    'banded_lateral_bound': ('horizontal_power', 'lateral', 'intermediate'), 'lateral_single_leg_hop': ('horizontal_power', 'lateral', 'intermediate'),
    'lateral_bound_to_box_jump': ('horizontal_power', 'lateral', 'intermediate'),
    # rotational
    'mb_rotational_throw': ('rotational_power', 'rot_throw', 'beginner'), 'mb_rotational_slam': ('rotational_power', 'slam', 'beginner'),
    'mb_step_behind_throw': ('rotational_power', 'rot_throw', 'intermediate'), 'mb_shot_put': ('rotational_power', 'rot_throw', 'intermediate'),
    'landmine_rotational_punch': ('rotational_power', 'landmine_rot', 'intermediate'), 'landmine_rotational_clean_press': ('rotational_power', 'landmine_rot', 'advanced'),
    # upper
    'mb_chest_pass': ('upper_power', 'throw', 'beginner'), 'mb_overhead_throw': ('upper_power', 'throw', 'beginner'),
    'med_ball_slam': ('upper_power', 'slam', 'beginner'), 'db_push_press': ('upper_power', 'upper', 'beginner'),
    'explosive_push_up': ('upper_power', 'upper', 'intermediate'), 'landmine_push_press': ('upper_power', 'upper', 'intermediate'),
    'landmine_split_jerk': ('upper_power', 'upper', 'intermediate'), 'push_press': ('upper_power', 'olympic', 'intermediate'),
    # total body
    'mb_scoop_toss': ('total_body_power', 'throw', 'beginner'), 'mb_backward_toss': ('total_body_power', 'throw', 'intermediate'),
    'kettlebell_swing': ('total_body_power', 'swing', 'intermediate'), 'db_hang_power_clean': ('total_body_power', 'explosive_lift', 'intermediate'),
    'kb_snatch': ('total_body_power', 'explosive_lift', 'intermediate'), 'hang_clean_to_box_knee_drive': ('total_body_power', 'explosive_lift', 'intermediate'),
    'db_snatch': ('total_body_power', 'explosive_lift', 'advanced'), 'hang_power_clean': ('total_body_power', 'olympic', 'advanced'),
    'power_snatch': ('total_body_power', 'olympic', 'advanced'), 'split_jerk': ('total_body_power', 'olympic', 'advanced'),
    'hang_high_pull': ('total_body_power', 'olympic', 'intermediate'),
    # identity pass: unilateral jumps / pops, muscle-ups, speed-strength (distinct exercises with their own doses)
    'split_jump': ('vertical_power', 'uni_jump', 'intermediate'), 'rfe_split_squat_jump': ('vertical_power', 'uni_jump', 'advanced'),
    'reverse_lunge_knee_drive_hop': ('vertical_power', 'uni_jump', 'beginner'),
    'step_up_pop': ('vertical_power', 'pop', 'beginner'), 'db_step_up_pop': ('vertical_power', 'pop', 'intermediate'),
    'band_assisted_muscle_up': ('upper_power', 'muscle_up', 'intermediate'), 'bar_muscle_up': ('upper_power', 'muscle_up', 'advanced'),
    'speed_trap_bar_deadlift': ('total_body_power', 'speed_strength', 'intermediate'), 'speed_box_squat': ('vertical_power', 'speed_strength', 'intermediate'),
}
POWER = {i: v for i, v in POWER.items() if i in EX}
JUMP_KINDS = {'jump', 'loaded_jump', 'combo', 'bound', 'hop', 'elastic', 'drop', 'lateral', 'uni_jump', 'pop'}
SPRINT_KINDS = {'sprint', 'sled'}
THROW_KINDS = {'throw', 'slam', 'rot_throw'}
OLY_KINDS = {'olympic', 'explosive_lift'}
FORCEFUL_SIMPLE = {'med_ball_slam', 'mb_rotational_slam', 'broad_jump', 'sled_push', 'acceleration_sprint', 'falling_start_sprint', 'mb_chest_pass',
                   'mb_scoop_toss', 'countermovement_jump', 'kettlebell_swing', 'db_push_press', 'mb_overhead_throw', 'mb_rotational_throw', 'box_jump', 'trap_bar_jump'}

# ------------------------------------------------------------------ athletic strength + support vocabulary: id -> pattern
STRENGTH = {
    'trap_bar_deadlift': 'lower_bilateral', 'front_squat': 'lower_bilateral', 'barbell_back_squat': 'lower_bilateral', 'goblet_squat': 'lower_bilateral',
    'kettlebell_deadlift': 'hinge', 'barbell_rdl': 'hinge', 'db_rdl': 'hinge', 'single_leg_rdl': 'hinge_uni', 'kickstand_db_rdl': 'hinge_uni',
    'barbell_hip_thrust': 'hip_thrust', 'db_hip_thrust': 'hip_thrust',
    'bulgarian_split_squat': 'unilateral', 'front_foot_elevated_split_squat': 'unilateral', 'reverse_lunge': 'unilateral', 'db_step_up': 'unilateral',
    'lateral_lunge': 'lateral_uni', 'lateral_step_up': 'lateral_uni', 'walking_lunge': 'unilateral',
    'pull_up': 'upper_pull', 'chin_up': 'upper_pull', 'single_arm_db_row': 'upper_pull', 'chest_supported_db_row': 'upper_pull', 'inverted_row': 'upper_pull',
    'suspension_row': 'upper_pull', 'meadows_row': 'upper_pull',
    'db_bench_press': 'upper_push', 'barbell_bench_press': 'upper_push', 'push_up': 'upper_push', 'weighted_push_up': 'upper_push',
    'half_kneeling_landmine_press': 'upper_push_v', 'landmine_press_single_arm': 'upper_push_v', 'db_shoulder_press': 'upper_push_v',
}
SUPPORT = {
    'nordic_curl': 'hamstring', 'slider_hamstring_curl': 'hamstring',          # identity pass: no loaded carries in Athletic (founder decision)
    'pallof_press': 'anti_rotation', 'pallof_step_out': 'anti_rotation', 'landmine_rotation': 'anti_rotation', 'dead_bug': 'anti_extension',
    'side_plank': 'lateral_trunk', 'copenhagen_plank': 'lateral_trunk', 'single_leg_db_calf_raise': 'tendon',
}
SUPPORT_WHY = {'hamstring': 'hamstring strength and resilience for jumping and sprinting',
               'anti_rotation': 'trunk control that transfers force from the hips to the hands', 'anti_extension': 'trunk control under the jumps and lifts',
               'lateral_trunk': 'hip and trunk stiffness for cutting and lateral pushes', 'tendon': 'ankle and calf stiffness for the elastic work'}
LOWER_PAT = {'lower_bilateral', 'hinge', 'hinge_uni', 'hip_thrust', 'unilateral', 'lateral_uni'}
UPPER_PAT = {'upper_pull', 'upper_push', 'upper_push_v'}

# ================================================================== eligibility
SKILL_IDX = {'beginner': 0, 'intermediate': 1, 'advanced': 2}
CX_CAP = {'beginner': 2, 'intermediate': 3, 'advanced': 5}


def region_blocked(e, sore):
    """Soreness safety filter (primary movers, plus loading rules for the lower back and shoulders)."""
    if not sore: return False
    prim = set(e['prim']); sec = set(e.get('sec') or [])
    if prim & sore: return True
    i = e['id']; pw = POWER.get(i)
    if 'spinal_erectors' in sore:
        if STRENGTH.get(i) in ('hinge', 'lower_bilateral') and e['eq'] not in ('bodyweight', 'bands') and i != 'goblet_squat': return True
        if pw and pw[1] in ('olympic', 'explosive_lift', 'swing', 'landmine_rot', 'slam', 'rot_throw'): return True
        if i in ('mb_scoop_toss', 'mb_backward_toss', 'trap_bar_jump', 'sled_push', 'speed_trap_bar_deadlift', 'speed_box_squat'): return True
    if sore & {'shoulders', 'front_delts', 'side_delts', 'rear_delts'}:
        if pw and pw[1] in ('upper', 'olympic', 'throw', 'slam', 'landmine_rot', 'muscle_up'): return True
        if STRENGTH.get(i) in ('upper_push', 'upper_push_v') or i in ('pull_up', 'chin_up', 'db_snatch', 'kb_snatch'): return True
    if sore & {'chest'} and (pw and pw[1] in ('upper', 'muscle_up') or i == 'mb_chest_pass'): return True
    if sore & {'back', 'lats'} and pw and pw[1] == 'muscle_up': return True
    if sore & {'hamstrings', 'glutes', 'quads', 'calves'} and pw and pw[0] in LOWER_Q and pw[1] not in THROW_KINDS: return True
    if sore & {'core'} and (SUPPORT.get(i) in ('anti_rotation', 'anti_extension', 'lateral_trunk') or (pw and pw[1] in ('rot_throw', 'landmine_rot'))): return True
    return False


def level_ok(e, lv, min_lv=None):
    if min_lv and SKILL_IDX[min_lv] > SKILL_IDX[lv]: return False
    if e['cx'] > CX_CAP[lv] or SKILL_IDX.get(e['skill'], 0) > SKILL_IDX[lv]: return False
    if e['impact'] == 'high' and lv != 'advanced': return False
    return True


def power_pool(ctx, q, kinds=None):
    out = []
    for i, (qq, kind, mlv) in POWER.items():
        if qq != q or i not in EX: continue
        if kinds and kind not in kinds: continue
        e = EX[i]
        if not avail(e, ctx['preset']) or not level_ok(e, ctx['lv'], mlv) or region_blocked(e, ctx['sore']): continue
        if i in ctx.get('banned', ()): continue
        out.append(i)
    return out


def strength_pool(ctx, pats):
    out = []
    for i, p in STRENGTH.items():
        if p not in pats or i not in EX: continue
        e = EX[i]
        # trap-bar deadlift is beginner-rated in the library but cx 3; beginners get it only through the level cap
        if not avail(e, ctx['preset']) or not level_ok(e, ctx['lv']) or region_blocked(e, ctx['sore']): continue
        if i in ctx.get('banned', ()): continue
        out.append(i)
    return out


def support_pool(ctx, kinds):
    out = []
    for i, p in SUPPORT.items():
        if p not in kinds or i not in EX: continue
        e = EX[i]
        if not avail(e, ctx['preset']) or not level_ok(e, ctx['lv']) or region_blocked(e, ctx['sore']): continue
        if i in ctx.get('banned', ()): continue
        out.append(i)
    return out


def kind_of(i): return POWER[i][1] if i in POWER else None
def q_of(i): return POWER[i][0] if i in POWER else None


# ================================================================== State resolution (deterministic ownership)
STATE_INTENT = {'low_energy': 'preserve_quality_reduce_systemic_and_coordination_cost', 'bored': 'novelty_through_skill_planes_tools_structure',
                'irritated': 'direct_forceful_explosive_low_friction', 'amped': 'spend_readiness_on_intent_not_volume',
                'stressed': 'simple_predictable_low_cognitive_demand', 'sore': 'reroute_around_soreness'}


def resolve_states(states, lv, dur, goal):
    """-> dials. Each State owns specific programming variables; conflicts are resolved by ownership, never by stacking."""
    S = set(states)
    # composition pass: the bulk of an Athletic session is athletic work. 60 min: primary + secondary (+ a small tertiary element for
    # intermediate / advanced); 30 min: primary + a low-cost second athletic movement when it fits, with concise strength.
    d = dict(max_explosive=(4 if lv != 'beginner' else 3) if dur == 60 else 2, primary_set_delta=0, strength_set_delta=0, strength_rir_delta=0, strength_rep_delta=0,
             rest_bonus=0, cx_cap=CX_CAP[lv], allow_contrast=lv == 'advanced', allow_elastic=lv != 'beginner', allow_olympic=lv != 'beginner',
             allow_high_impact=lv == 'advanced', allow_secondary=True, secondary_kinds=None, support_ok=True, finisher_ok=True, prefer=[], avoid_structures=set(),
             novelty=0.0, simple=False, forceful=False, amped_mode=None, owners={}, log=[])
    def own(var, s, why): d['owners'][var] = s; d['log'].append(dict(reason_code='state_ownership', state=s, variable=var, why=why))
    if 'low_energy' in S:
        d['max_explosive'] = 1; d['primary_set_delta'] -= 1; d['strength_set_delta'] -= 1; d['strength_rir_delta'] += 1; d['rest_bonus'] += 15
        d['cx_cap'] = min(d['cx_cap'], 2); d['allow_high_impact'] = False; d['allow_elastic'] = False; d['allow_contrast'] = False; d['allow_olympic'] = False
        d['max_explosive'] = 2; d['secondary_kinds'] = THROW_KINDS     # Low Energy: one jump or sprint plus one low-impact throw
        d['finisher_ok'] = False; d['avoid_structures'] |= {'contrast', 'jump_throw', 'athletic_mixed'}
        d['prefer'].append('low_energy')
        for v in ('volume', 'complexity', 'impact'): own(v, 'low_energy', 'Low Energy owns how much, how complex and how much impact')
    if 'stressed' in S:
        d['cx_cap'] = min(d['cx_cap'], 2); d['allow_elastic'] = False; d['allow_contrast'] = False; d['simple'] = True
        d['avoid_structures'] |= {'contrast', 'athletic_mixed'}; d['prefer'].append('stressed')
        if lv != 'advanced': d['allow_olympic'] = False
        own('structure', 'stressed', 'Stressed owns structure simplicity and predictability')
    if 'irritated' in S:
        d['forceful'] = True; d['prefer'].append('irritated')
        d['cx_cap'] = min(d['cx_cap'], 3)
        own('exercise_character', 'irritated', 'Irritated owns the character of the movements: direct and forceful')
    if 'bored' in S:
        d['novelty'] = 1.0; d['prefer'].append('bored')
        if lv != 'beginner' and 'stressed' not in S and 'low_energy' not in S: d['allow_contrast'] = True
        own('novelty', 'bored', 'Bored owns exercise, plane and tool novelty')
    if 'amped' in S:
        d['prefer'].append('amped')
        if 'low_energy' in S:
            d['amped_mode'] = 'intent_only'           # fewer efforts, each one maximal; heavier strength sets at the same volume
            d['strength_rep_delta'] -= 1
            own('intent', 'amped', 'Amped owns intent on the one primary quality; Low Energy keeps volume, complexity and impact')
        elif 'stressed' in S:
            d['amped_mode'] = 'load'                  # load / intent, simple structure
            d['strength_rep_delta'] -= 1; d['strength_rir_delta'] -= 1
            own('load', 'amped', 'Amped owns load and intent; Stressed keeps the structure simple')
        else:
            d['amped_mode'] = 'intent_and_load'
            d['strength_rep_delta'] -= 1; d['strength_rir_delta'] -= 1; d['primary_set_delta'] += 1; d['rest_bonus'] += 15
            if lv in ('intermediate', 'advanced') and 'irritated' not in S: d['allow_contrast'] = True
            own('intent', 'amped', 'Amped spends readiness on intent and load, not on extra exercises')
        d['finisher_ok'] = d['finisher_ok'] and False   # Amped never earns a finisher by itself
    if 'irritated' in S and 'low_energy' in S:
        own('volume', 'low_energy', 'Irritated keeps the direct, forceful character at Low Energy volume')
    if 'irritated' in S: d['finisher_ok'] = False           # cathartic does not mean fatigued: no automatic finisher
    return d


# ================================================================== dosing
def power_dose(i, lv, role, d, dur):
    """-> dict(sets, reps, per_side, distance_m, seconds, rest, work_s, intent, contacts_per_rep). Low reps, full recovery."""
    kind = kind_of(i); e = EX[i]; L = SKILL_IDX[lv]
    sets = {'primary': (3, 4, 5), 'secondary': (3, 3, 3), 'contrast': (3, 3, 4), 'tertiary': (2, 3, 3)}[role][L]
    per_side = False; dist = None; sec = None; reps = 3
    if kind == 'jump': reps = 3; rest = (75, 90, 105)[L]; intent = 'max height or distance, land soft and quiet, reset between reps'
    elif kind == 'loaded_jump': reps = 3; rest = 120; intent = 'light load, jump as high or far as you can; every rep fast'
    elif kind == 'combo': reps = 2; rest = 105; intent = 'max intent on both parts, stick the landing'
    elif kind == 'bound':
        reps = 3 if i == 'consecutive_broad_jump' else 6; rest = 120; intent = 'max distance per contact, stick the last one' if reps == 3 else '6 contacts (3 per leg), max distance'
    elif kind == 'hop': reps = 3; per_side = True; rest = 90; intent = 'stick each landing for a full second'
    elif kind == 'elastic':
        if i == 'pogo_hop': reps = 10; rest = 60; intent = '10 quick contacts, stiff ankles, minimal ground time'
        else: reps = 5; rest = 90; intent = 'bounce straight back up, minimal ground contact; end the set when height drops'
    elif kind == 'drop': reps = 3; rest = 120; intent = 'step off, land and rebound instantly; full recovery'
    elif kind == 'lateral':
        reps = 2 if i == 'lateral_bound_to_box_jump' else 3; per_side = i != 'lateral_box_jump'; rest = (75, 90, 90)[L]; intent = 'push hard sideways, stick each landing'
    elif kind == 'sprint':
        sets = (5, 6, 8)[L] if role == 'primary' else ((3, 3, 3)[L] if role == 'tertiary' else (4, 4, 5)[L]); reps = 1; dist = 10 if i == 'acceleration_sprint' else 5; rest = (60, 75, 90)[L]
        intent = 'all-out start, walk back slowly, next rep only when fully recovered'
    elif kind == 'sled':
        sets = (4, 5, 6)[L] if role == 'primary' else ((3, 3, 3)[L] if role == 'tertiary' else (3, 4, 4)[L]); reps = 1; dist = 10; rest = (90, 105, 120)[L]
        intent = 'heavy enough to drive, light enough to stay fast; big pushes'
    elif kind == 'throw': reps = 5 if i not in ('mb_backward_toss',) else 4; rest = 60; intent = 'throw as hard as you can, reset between reps'
    elif kind == 'slam':
        reps = 4 if i == 'mb_rotational_slam' else 5; per_side = i == 'mb_rotational_slam'; rest = 60; intent = 'slam through the floor, every rep full effort'
    elif kind == 'rot_throw': reps = 4; per_side = True; rest = 60; intent = 'drive from the back hip, throw hard'
    elif kind == 'landmine_rot': reps = 3 if i == 'landmine_rotational_clean_press' else 4; per_side = True; rest = 90; intent = 'fast hips, punch through'
    elif kind == 'upper':
        reps = 4 if i in ('explosive_push_up', 'db_push_press') else 3; per_side = i in ('landmine_push_press', 'landmine_split_jerk'); rest = 90
        intent = 'dip and drive fast; stop the set if the bar or bells slow' if i != 'explosive_push_up' else 'push the floor away fast, hands leave the floor'
    elif kind == 'olympic':
        reps = 3 if i in ('push_press', 'hang_high_pull') else 2; rest = 120 if i in ('push_press', 'hang_high_pull') else 150; sets = max(sets, 4)
        intent = 'moderate load you can move fast; technique first, every rep crisp'
    elif kind == 'explosive_lift':
        reps = 3 if e['lat'] == 'bilateral' else 2; per_side = e['lat'] != 'bilateral'; rest = 120; intent = 'move it fast; pick a weight that stays fast'
    elif kind == 'swing': reps = 8; rest = 90; intent = 'heavy enough to snap the hips; end the set when the snap fades'
    elif kind == 'uni_jump': reps = 3; per_side = True; rest = 90; intent = 'jump as high as you can from the split stance, land in the same stance and reset each rep'
    elif kind == 'pop': reps = 4 if i == 'step_up_pop' else 3; per_side = True; rest = 90; intent = 'drive through the box leg hard enough to leave the box; land softly, reset every rep'
    elif kind == 'muscle_up':
        reps = 2 if i == 'bar_muscle_up' else 3; rest = 120; intent = 'pull explosively high to the bar and turn over fast; stop the set before a rep slows or gets sloppy'
    elif kind == 'speed_strength':
        reps = 2 if 'deadlift' in i else 3; rest = 90; intent = 'about 50% of your estimated max: every rep as fast as possible, full rest; stop the set if bar speed visibly slows'
        sets = max(sets, 4)
    else: rest = 90; intent = 'max intent'
    sets = min(8, max(3 if role == 'primary' else 2, sets + (d['primary_set_delta'] if role in ('primary', 'contrast') else 0)))
    rest = rest + d['rest_bonus']
    if dur == 30 and role == 'primary' and kind in SPRINT_KINDS: sets = min(sets, (5, 6, 6)[L])
    if dur == 30 and role == 'secondary': sets = min(sets, 2 if 'low_energy' in d['prefer'] else 3)
    work = work_seconds(i, reps, per_side, dist)
    return dict(sets=sets, reps=reps, per_side=per_side, distance_m=dist, seconds=sec, rest=rest, work_s=work, intent=intent)


def work_seconds(i, reps, per_side, dist):
    kind = kind_of(i) or 'strength'
    if kind in ('sprint',): return 4 + (dist or 10) * 0.25
    if kind == 'sled': return 8
    if kind == 'elastic' and i == 'pogo_hop': return 8
    base = {'jump': 5, 'loaded_jump': 6, 'combo': 7, 'bound': 3, 'hop': 4, 'elastic': 3, 'drop': 8, 'lateral': 5, 'throw': 4, 'slam': 3, 'rot_throw': 4,
            'landmine_rot': 4, 'upper': 3, 'olympic': 6, 'explosive_lift': 5, 'swing': 2, 'uni_jump': 4, 'pop': 4, 'muscle_up': 6, 'speed_strength': 5}.get(kind, 4)
    return (10 + reps * base) * (2 if per_side else 1)


LIGHT_LOAD = {'goblet_squat', 'kettlebell_deadlift', 'db_rdl', 'db_hip_thrust', 'kickstand_db_rdl', 'inverted_row', 'suspension_row', 'push_up', 'reverse_lunge', 'walking_lunge', 'lateral_lunge', 'db_step_up', 'lateral_step_up'}
GOAL_STRENGTH = {   # goal -> level -> (A sets, A reps, A rir, A rest, B sets, B reps, B rir, B rest)
    'build_strength':            ((3, 6, 3, 120, 3, 8, 2, 90), (4, 4, 2, 150, 3, 6, 2, 90), (4, 3, 2, 180, 3, 6, 2, 90)),
    'improve_athleticism':       ((3, 6, 3, 120, 3, 8, 2, 75), (3, 5, 2, 120, 3, 6, 2, 90), (4, 4, 2, 150, 3, 6, 2, 90)),
    'build_muscle':              ((3, 8, 2, 90, 3, 10, 2, 75), (4, 6, 2, 120, 3, 10, 2, 75), (4, 6, 1, 120, 3, 8, 1, 75)),
    'lose_weight_conditioning':  ((3, 8, 3, 75, 3, 10, 3, 60), (3, 8, 2, 75, 3, 10, 2, 60), (3, 6, 2, 90, 3, 10, 2, 60)),
    'feel_better_reduce_stress': ((2, 8, 3, 90, 2, 10, 3, 60), (3, 8, 3, 90, 2, 10, 3, 60), (3, 6, 3, 90, 3, 8, 3, 75)),
    'stay_consistent':           ((3, 8, 3, 90, 3, 10, 3, 60), (3, 6, 2, 120, 3, 8, 2, 75), (3, 5, 2, 120, 3, 8, 2, 75)),
}


def strength_dose(i, lv, slot, goal, d, dur, contrast=False):
    row = GOAL_STRENGTH.get(goal, GOAL_STRENGTH['stay_consistent'])[SKILL_IDX[lv]]
    sets, reps, rir, rest = (row[0], row[1], row[2], row[3]) if slot == 'A' else (row[4], row[5], row[6], row[7])
    e = EX[i]; uni = e['lat'] in ('unilateral', 'alternating')
    if contrast: sets, reps, rir, rest = (3 if lv != 'advanced' else 4), 3, 2, 45
    reps = max(3, reps + d['strength_rep_delta']); rir = max(1, min(4, rir + d['strength_rir_delta']))
    sets = max(min(sets, 3 if dur == 60 else 2), sets + d['strength_set_delta'])
    if uni: reps = min(max(reps, (4 if d['amped_mode'] else 5) if not contrast else reps), 8)      # single-leg / single-arm work below 5 reps per side is not a useful strength dose
    if i in LIGHT_LOAD and not contrast: reps = max(reps, 6)          # goblet squat, KB deadlift, body-weight rows / push-ups cannot be loaded for heavy triples
    if STRENGTH.get(i) == 'upper_pull' and i in ('pull_up', 'chin_up'): reps = min(reps, 6 if lv != 'advanced' else 5)
    if i in ('push_up',) and goal in ('build_strength',): reps = max(reps, 8)
    if dur == 30 and not contrast: sets = min(sets, 3)
    return dict(sets=sets, reps=reps, per_side=uni, rir=rir, rest=rest, work_s=work_seconds(i, reps, uni, None), intent=_strength_intent(rir, slot, goal, contrast))


def _strength_intent(rir, slot, goal, contrast):
    if contrast: return f"heavy but crisp: about {rir} rep{'s' if rir != 1 else ''} left in the tank, then straight to the explosive partner"
    base = f"about {rir} rep{'s' if rir != 1 else ''} left in the tank"
    if slot == 'A' and goal == 'build_strength': return base + '; 2 lighter ramp-up sets first'
    if slot == 'A': return base + '; 1-2 ramp-up sets first'
    return base


def support_dose(i, lv, goal):
    k = SUPPORT[i]
    if k == 'hamstring':
        n = 4 if i == 'nordic_curl' else 8
        return dict(sets=3 if lv != 'beginner' else 2, reps=n, rest=75, work_s=4 * n + 10, per_side=False, intent='slow, controlled lowering')
    if k == 'lateral_trunk':
        s = 20 if i == 'copenhagen_plank' else 30
        return dict(sets=2 if lv == 'beginner' else 3, reps=0, seconds=s, rest=45, work_s=2 * s + 10, per_side=True, intent='long straight line, breathe behind the brace')
    if k == 'tendon': return dict(sets=3, reps=10, rest=60, work_s=2 * 35, per_side=True, intent='slow, full range, pause at the top')
    if k == 'anti_extension': return dict(sets=3, reps=8, rest=45, work_s=40, per_side=True, intent='low back stays down; slow and controlled')
    n = 6 if i.startswith('landmine') else 10
    return dict(sets=3 if lv != 'beginner' else 2, reps=n, rest=45, work_s=2 * (10 + 3 * n), per_side=True, intent='resist the rotation; slow and controlled')


# ================================================================== candidate selection
ARCH_QUALITIES = {
    'athletic_power': ['vertical_power', 'horizontal_power', 'total_body_power', 'upper_power', 'rotational_power'],
    'athletic_speed_agility': ['acceleration', 'elastic_reactive', 'horizontal_power'],
    'athletic_full_body': ['horizontal_power', 'vertical_power', 'acceleration', 'total_body_power', 'rotational_power', 'upper_power'],
}
ARCH_STRUCTURES = {
    'athletic_power': ['power_strength', 'contrast', 'jump_throw'],
    'athletic_speed_agility': ['speed_strength', 'athletic_mixed', 'power_strength'],   # power_strength: bounds / lateral bounds / reactive jumps when no sprint lane
    'athletic_full_body': ['jump_throw', 'athletic_mixed', 'power_strength'],
}
STRUCT_QUALITIES = {   # which primary qualities each structure can be built around
    'power_strength': {'vertical_power', 'horizontal_power', 'total_body_power', 'upper_power', 'rotational_power', 'elastic_reactive'},
    'speed_strength': {'acceleration'},
    'jump_throw': {'vertical_power', 'horizontal_power', 'elastic_reactive'},
    'contrast': {'vertical_power', 'horizontal_power', 'upper_power'},
    'athletic_mixed': {'acceleration', 'total_body_power', 'elastic_reactive', 'horizontal_power'},
}
BASE_Q = {'vertical_power': 1.0, 'horizontal_power': 1.0, 'acceleration': 1.0, 'total_body_power': 0.8,
          'elastic_reactive': 0.5, 'upper_power': 0.35, 'rotational_power': 0.35}
GOAL_Q = {'improve_athleticism': dict(acceleration=1.3, elastic_reactive=1.3, total_body_power=1.1),
          'build_strength': dict(total_body_power=1.4, vertical_power=1.2, upper_power=1.2, elastic_reactive=0.6),
          'build_muscle': dict(total_body_power=1.2, upper_power=1.3, vertical_power=1.1, elastic_reactive=0.6),
          'lose_weight_conditioning': dict(acceleration=1.3, horizontal_power=1.1, total_body_power=1.1),
          'feel_better_reduce_stress': dict(horizontal_power=1.1, vertical_power=1.1, acceleration=0.9, elastic_reactive=0.4, total_body_power=0.7, rotational_power=1.4),
          'stay_consistent': {}}
BASE_S = {'power_strength': 1.0, 'speed_strength': 1.0, 'jump_throw': 1.0, 'contrast': 0.5, 'athletic_mixed': 0.8}
GOAL_S = {'build_strength': dict(contrast=1.5, power_strength=1.3), 'build_muscle': dict(power_strength=1.3, contrast=1.2),
          'improve_athleticism': dict(athletic_mixed=1.3, speed_strength=1.1),
          'feel_better_reduce_stress': dict(contrast=0.3, jump_throw=1.2), 'lose_weight_conditioning': dict(speed_strength=1.2, athletic_mixed=1.1)}
LEVEL_S = {'beginner': dict(contrast=0.0, athletic_mixed=0.5), 'intermediate': dict(contrast=0.5), 'advanced': dict(contrast=1.3)}
TARGET_LOWER = {'quads', 'hamstrings', 'glutes', 'calves', 'hip_adductors', 'hip_abductors'}
TARGET_UPPER = {'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'}


def arch_for(structure, pq):
    if structure == 'speed_strength': return 'athletic_speed_agility'
    if structure == 'athletic_mixed': return 'athletic_speed_agility' if pq in ('acceleration', 'elastic_reactive') else 'athletic_full_body'
    if structure == 'jump_throw': return 'athletic_full_body'
    return 'athletic_power'


def candidates(ctx, d):
    """Ranked (archetype, structure, primary quality, weight) candidates."""
    lv, dur, goal, seed = ctx['lv'], ctx['dur'], ctx['goal'], ctx['seed']
    legs_sore = bool(ctx['sore'] & LOWER)
    tl = set(ctx['target']) & TARGET_LOWER; tu = set(ctx['target']) & TARGET_UPPER
    hist = ctx['history']; disp = ctx['displayed']
    out = []
    archs = [ctx['arch']] if ctx['arch'] else list(ARCH_QUALITIES)
    for a in archs:
        for s in ARCH_STRUCTURES[a]:
            if s in d['avoid_structures'] and ctx['arch_explicit'] is False and len(archs) > 1: continue
            for pq in ARCH_QUALITIES[a]:
                if pq not in STRUCT_QUALITIES[s]: continue
                if not ctx['arch'] and arch_for(s, pq) != a: continue
                # hard feasibility
                if legs_sore and pq in LOWER_Q: continue
                if pq in UPPER_Q and not legs_sore:
                    if s != 'power_strength': continue
                    if not ((tu and not tl) or ctx.get('bored') or a == 'athletic_power'): continue
                    if not (tu or ctx.get('bored') or ctx['arch_explicit']): w_up = 0.5      # MOOD's Pick keeps upper-only power days occasional when the legs are fine
                    else: w_up = 1.0
                else: w_up = 1.0
                if s == 'contrast' and not d['allow_contrast']: continue
                if s == 'contrast' and dur == 30 and lv != 'advanced': continue
                if s in ('jump_throw', 'athletic_mixed') and (dur == 30 or not d['allow_secondary']): continue
                if pq == 'elastic_reactive' and not d['allow_elastic']: continue
                if pq == 'total_body_power' and lv == 'beginner' and s != 'power_strength': continue
                if pq == 'total_body_power' and lv == 'beginner': w_up *= 0.3        # a beginner's day leads with a jump or a start, not a med-ball toss
                w = w_up * BASE_Q[pq] * GOAL_Q.get(goal, {}).get(pq, 1.0) * BASE_S[s] * GOAL_S.get(goal, {}).get(s, 1.0) * LEVEL_S[lv].get(s, 1.0)
                if lv == 'beginner' and pq == 'elastic_reactive': w *= 0.5
                if tl and pq in LOWER_Q: w *= 1.3
                if tu and not tl: w *= (2.5 if pq in UPPER_Q else (1.2 if s == 'jump_throw' else 0.7))
                if 'glutes' in tl or 'hamstrings' in tl: w *= 1.2 if pq in ('horizontal_power', 'acceleration', 'total_body_power') else 1.0
                if 'quads' in tl: w *= 1.2 if pq == 'vertical_power' else 1.0
                if 'calves' in tl: w *= 1.4 if pq == 'elastic_reactive' else 1.0
                if 'core' in ctx['target']: w *= 1.4 if pq in ('rotational_power', 'total_body_power') or s == 'jump_throw' else 1.0
                if legs_sore: w *= 1.3 if pq == 'upper_power' else 1.0
                # States
                if d['forceful']: w *= 1.5 if pq in ('horizontal_power', 'acceleration', 'total_body_power') or s == 'jump_throw' else (0.5 if pq == 'elastic_reactive' else 1.0)
                if d['simple']: w *= 1.4 if s in ('power_strength', 'speed_strength') else 0.6
                if 'low_energy' in d['prefer']: w *= 1.3 if s in ('power_strength', 'speed_strength') and pq in ('vertical_power', 'horizontal_power', 'acceleration', 'upper_power') else 0.8
                if d['amped_mode'] == 'intent_and_load': w *= 1.5 if s == 'contrast' else 1.0
                if d['novelty']:
                    w *= 1.6 if (pq in ('rotational_power', 'elastic_reactive') or s in ('contrast', 'athletic_mixed', 'jump_throw')) else 0.8
                if pq == 'total_body_power' and lv != 'beginner' and d['allow_olympic']:        # Olympic derivatives live here: a real share of capable users' sessions
                    w *= {'advanced': 1.8, 'intermediate': 1.25}[lv] if goal in ('build_strength', 'improve_athleticism') else {'advanced': 1.3, 'intermediate': 1.1}[lv]
                if s in d['avoid_structures']: w *= 0.05
                # history (penalties, never bans)
                for n, hrec in enumerate(hist[:3]):
                    k = (0.35, 0.6, 0.8)[n]
                    if hrec.get('primary_quality') == pq: w *= k
                    if hrec.get('structure') == s: w *= (0.55, 0.8, 0.9)[n]
                    if d['novelty'] and n < 2 and (hrec.get('primary_quality') == pq or hrec.get('structure') == s): w *= 0.4
                for dd in disp:
                    if dd.get('primary_quality') == pq: w *= 0.08
                    if dd.get('structure') == s: w *= 0.3
                if not power_pool(ctx, pq): continue
                out.append((a, s, pq, w))
    # seeded weighted order (sampling without replacement): the weights decide how often, not whether, so users and days vary
    rest = sorted(out, key=lambda x: (-x[3], x[:3])); order = []; k = 0
    while rest:
        tot = sum(x[3] ** 1.5 for x in rest); r = u(seed, 'cand', ctx.get('swap', 0), k) * tot; acc = 0.0
        for j, x in enumerate(rest):
            acc += x[3] ** 1.5
            if acc >= r: order.append(rest.pop(j)); break
        else: order.append(rest.pop())
        k += 1
    return order


# ================================================================== exercise ranking
def rank_power(ctx, d, ids, role, used, seed, primary_q=None):
    lv = ctx['lv']; hist = ctx['history']; disp = ctx['displayed']
    def score(i):
        e = EX[i]; kind = kind_of(i); s = 1.0
        if e['cx'] > d['cx_cap']: s *= 0.02
        if e['impact'] == 'high' and not d['allow_high_impact']: s *= 0.0
        if kind in ('olympic',) and not d['allow_olympic']: s *= 0.0
        if kind == 'explosive_lift' and not d['allow_olympic'] and e['cx'] >= 3: s *= 0.1
        # level fit: advanced prefers the more specific / demanding option, beginners the simplest
        if role in ('primary', 'contrast') or lv != 'advanced':
            s *= {0: 1.3 if e['cx'] <= 1 else 1.0, 1: 1.1 if e['cx'] == 2 else 1.0, 2: 1.2 if e['cx'] >= 3 else 0.9}[SKILL_IDX[lv]]
        if kind in OLY_KINDS and 'low_energy' in d['prefer']: s *= 0.0                 # Low Energy: no Olympic derivatives
        perf_goal = ctx['goal'] in ('build_strength', 'improve_athleticism')
        if kind == 'olympic': s *= {'advanced': 2.2 if perf_goal else 1.3, 'intermediate': 1.4 if perf_goal else 1.0}.get(lv, 0.0)   # meaningful for capable users, never automatic
        if kind == 'slam' and role == 'primary' and not d['forceful']: s *= 0.4       # slams are a cathartic secondary, rarely the day's main power
        if kind in ('speed_strength', 'pop') and role == 'primary': s *= 0.15        # speed-strength and step-up pops support the day, rarely lead it
        if kind == 'muscle_up' and role == 'primary' and not d['novelty']: s *= 0.5
        if i == 'band_assisted_muscle_up' and lv == 'advanced': s *= 0.25      # advanced users get the bar muscle-up; the band version is the intermediate option
        if lv == 'advanced' and role == 'primary' and kind != 'olympic' and (e['skill'] == 'advanced' or e['impact'] == 'high' or e['cx'] >= 4): s *= 1.6   # specificity, not volume
        if 'low_energy' in d['prefer']: s *= 1.5 if (e['cx'] <= 1 and e['impact'] == 'low') or kind in ('throw', 'sprint') else (0.7 if e['impact'] != 'low' else 1.0)
        if d['simple']: s *= (1.5 if e['cx'] <= 2 else 0.5) * (1.0 if d['novelty'] or e['nov'] <= 2 else 0.8)   # Bored owns novelty, Stressed owns complexity
        if d['forceful']: s *= 1.8 if i in FORCEFUL_SIMPLE else (0.6 if not e['forceful'] else 1.0)
        if d['novelty']: s *= 1.6 if (e['nov'] >= 3 or vector(e) in ('lateral', 'rotational', 'multi')) else 0.7
        if d['amped_mode'] == 'intent_and_load' and role == 'primary': s *= 1.25 if e['cx'] >= 2 and kind in ('loaded_jump', 'combo', 'explosive_lift', 'olympic', 'sled', 'sprint', 'bound') else 1.0
        if ctx['sore'] & {'spinal_erectors'} and kind in ('loaded_jump',): s *= 0.5
        for n, h in enumerate(hist[:2]):
            if i in h.get('ids', []): s *= (0.35, 0.6)[n]
            if EX[i]['swap'] and EX[i]['swap'] in h.get('swaps', []): s *= (0.6, 0.8)[n]
        for dd in disp:
            if i in dd.get('ids', []): s *= 0.05
        if i in used or any(EX[x]['swap'] == EX[i]['swap'] for x in used): s *= 0.0
        return s * ((0.8 + 0.4 * u(seed, 'p', role, i)) if role != 'secondary' else (0.6 + 0.8 * u(seed, 'p', role, i)))
    return [i for i in sorted(ids, key=lambda i: -score(i)) if score(i) > 0]


def rank_strength(ctx, d, ids, used, seed, tag):
    hist = ctx['history']; disp = ctx['displayed']; goal = ctx['goal']; lv = ctx['lv']; tgt = set(ctx['target'])
    def score(i):
        e = EX[i]; s = 1.0
        if e['cx'] > d['cx_cap'] + (1 if d['cx_cap'] < 3 else 0): s *= 0.2       # strength work may be one step more complex than the power cap
        if goal == 'build_strength' and e['eq'] in ('barbell', 'trap_bar'): s *= 1.5
        if goal in ('build_strength', 'improve_athleticism') and i in ('trap_bar_deadlift', 'front_squat', 'bulgarian_split_squat', 'pull_up', 'chin_up'): s *= 1.3
        if lv == 'beginner' and e['cx'] <= 1: s *= 1.3
        if lv == 'advanced' and e['cx'] >= 3: s *= 1.2
        if d['simple'] and e['cx'] >= 3: s *= 0.6
        if d['novelty'] and e['nov'] >= 3: s *= 1.4
        if d['forceful'] and i in ('trap_bar_deadlift', 'barbell_back_squat', 'front_squat', 'barbell_hip_thrust', 'pull_up'): s *= 1.3
        if 'low_energy' in d['prefer'] and (e['cx'] >= 3 or e['sysd'] >= 4): s *= 0.6
        if tgt & set(e['prim']): s *= 1.8
        if d['amped_mode'] and i in LIGHT_LOAD: s *= 0.35          # Amped expresses itself through load: prefer a strength lift that can actually get heavier
        for n, h in enumerate(hist[:2]):
            if i in h.get('ids', []): s *= (0.45, 0.7)[n]
        for dd in disp:
            if i in dd.get('ids', []): s *= 0.1
        if i in used or any(EX[x]['swap'] == EX[i]['swap'] for x in used): s *= 0.0
        return s * (0.8 + 0.4 * u(seed, 's', tag, i))
    return [i for i in sorted(ids, key=lambda i: -score(i)) if score(i) > 0]


# ------------------------------------------------------------------ strength plan per primary quality (why this strength today)
STRENGTH_PLAN = {   # primary quality -> ordered pattern options for A (force), then B (complement)
    'vertical_power':      (['lower_bilateral', 'unilateral', 'hinge'], ['upper_pull', 'upper_push']),
    'horizontal_power':    (['hinge', 'lower_bilateral', 'hip_thrust', 'unilateral'], ['upper_pull', 'upper_push']),
    'total_body_power':    (['lower_bilateral', 'hinge', 'unilateral'], ['upper_pull', 'upper_push_v']),
    'elastic_reactive':    (['unilateral', 'lower_bilateral'], ['upper_pull', 'hinge_uni']),
    'acceleration':        (['unilateral', 'hinge', 'lower_bilateral'], ['hinge_uni', 'upper_pull']),
    'upper_power':         (['lower_bilateral', 'unilateral', 'hinge'], ['upper_pull', 'upper_push_v']),
    'rotational_power':    (['unilateral', 'lower_bilateral', 'hinge'], ['upper_pull', 'upper_push_v']),
}
STRENGTH_WHY = {'lower_bilateral': 'bilateral leg strength behind the jumps and starts', 'hinge': 'hip-hinge strength that drives jumps and sprints',
                'hinge_uni': 'single-leg hinge strength and hamstring control for sprinting', 'hip_thrust': 'hip extension strength for horizontal power',
                'unilateral': 'single-leg strength for jumping, landing and acceleration', 'lateral_uni': 'lateral single-leg strength for cutting',
                'upper_pull': 'pulling strength that balances the pushing and throwing', 'upper_push': 'pressing strength behind the upper-body power',
                'upper_push_v': 'overhead pressing strength and shoulder stability'}
SUPPORT_PLAN = {   # purpose-bound trunk / tendon / hamstring work only (no loaded carries in Athletic)
                'acceleration': ['hamstring', 'tendon'], 'elastic_reactive': ['tendon', 'anti_extension'], 'rotational_power': ['anti_rotation'],
                'upper_power': ['anti_rotation', 'anti_extension'], 'vertical_power': ['anti_extension', 'hamstring'],
                'horizontal_power': ['hamstring', 'anti_rotation'], 'total_body_power': ['anti_rotation', 'anti_extension']}
SECONDARY_FOR = {   # structure -> primary quality -> complementary secondary qualities (ordered)
    'jump_throw': {'_': ['rotational_power', 'upper_power', 'total_body_power']},
    'athletic_mixed': {'acceleration': ['rotational_power', 'horizontal_power', 'upper_power'], 'horizontal_power': ['acceleration', 'rotational_power'],
                       'total_body_power': ['acceleration', 'rotational_power'], 'elastic_reactive': ['acceleration', 'rotational_power']},
    'power_strength': {'vertical_power': ['upper_power', 'rotational_power', 'acceleration'], 'horizontal_power': ['rotational_power', 'upper_power', 'acceleration'],
                       'total_body_power': ['rotational_power', 'horizontal_power', 'upper_power'],
                       'upper_power': ['rotational_power'], 'rotational_power': ['upper_power'], 'elastic_reactive': ['rotational_power']},
    'speed_strength': {'acceleration': ['elastic_reactive', 'rotational_power', 'horizontal_power']},
}
SECONDARY_KINDS = {'rotational_power': {'rot_throw', 'slam', 'landmine_rot'}, 'upper_power': {'throw', 'slam', 'upper'}, 'total_body_power': {'throw'},
                   'horizontal_power': {'jump'}, 'acceleration': {'sprint', 'sled'}, 'elastic_reactive': {'elastic'}, 'vertical_power': {'jump'}}
CONTRAST_SECONDARY = {'vertical_power': ['rotational_power', 'upper_power', 'acceleration'], 'horizontal_power': ['rotational_power', 'upper_power', 'acceleration'],
                      'upper_power': ['rotational_power', 'horizontal_power']}
LOW_COST_KINDS = THROW_KINDS | {'upper', 'landmine_rot'}          # a second athletic movement that costs almost no impact budget
# ------------------------------------------------------------------ identity pass: athletic movement cost tiers + movement budget
# A = high systemic / technical cost, B = moderate, C = low-cost athletic expression. Count is limited by cost, not by block names.
TIER_COST = {'A': 3, 'B': 2, 'C': 1}


def tier(i, role='x'):
    kind = kind_of(i); e = EX[i]
    if kind == 'olympic' or kind == 'drop' or i in ('consecutive_broad_jump', 'trap_bar_jump', 'reactive_vertical_jump'): return 'A'
    if kind == 'explosive_lift' and e['cx'] >= 3 and i != 'hang_clean_to_box_knee_drive': return 'A'
    if kind in SPRINT_KINDS and role in ('primary', 'contrast_power'): return 'A'      # maximal sprinting / heavy explosive sled as the day's main work
    if role == 'contrast_power': return 'A'
    if kind in THROW_KINDS: return 'C'
    if kind == 'jump' and e['impact'] == 'low': return 'C'
    if kind == 'pop' and e['cx'] <= 1: return 'C'
    return 'B'


# (beginner, intermediate, advanced) at 60 / 30 min: movement budget in cost points, most Tier A movements, most athletic movements
ATH_BUDGET = {60: ((5, 8, 10), (1, 1, 2), (3, 4, 4)), 30: ((4, 5, 6), (1, 1, 1), (2, 2, 2))}
TARGET_N = {'beginner': ((2, 0.7), (3, 0.3)), 'intermediate': ((2, 0.1), (3, 0.6), (4, 0.3)), 'advanced': ((2, 0.05), (3, 0.25), (4, 0.7))}
# families for variety and impact: never two sprint / sled elements, at most two jump-family and two throw-family elements
FAMILY = lambda k: ('olympic' if k in OLY_KINDS else 'sprint' if k in SPRINT_KINDS else 'jump' if k in JUMP_KINDS else 'throw' if k in THROW_KINDS
                    else 'upper' if k in ('upper', 'muscle_up', 'landmine_rot') else k)
FAMILY_CAP = {'olympic': 1, 'sprint': 1, 'jump': 2, 'throw': 1, 'upper': 1, 'speed_strength': 1, 'swing': 1}   # one med-ball throw is expression; two is filler
EXTRA_KIND_W = {'speed_strength': 0.8, 'muscle_up': 1.1, 'pop': 1.8, 'uni_jump': 1.8, 'swing': 0.8, 'sled': 0.9, 'explosive_lift': 0.4}


def ath_budget(ctx, d):
    L = SKILL_IDX[ctx['lv']]; bud, amax, nmax = (x[L] for x in ATH_BUDGET[ctx['dur']])
    if 'low_energy' in d['prefer']: bud = min(bud, 4); amax = min(amax, 1); nmax = 2
    if d['simple']: amax = min(amax, 1); nmax = min(nmax, 3 if ctx['lv'] != 'beginner' else 2)
    return bud, amax, min(nmax, d['max_explosive'])


def target_count(ctx, d, structure, seed):
    """How many true athletic movements today (a guide; the cost budget decides what actually fits)."""
    if ctx['dur'] == 30: n = 2
    else:
        opts = TARGET_N[ctx['lv']]; r = u(seed, 'target_n'); acc = 0.0; n = opts[-1][0]
        if d['amped_mode'] == 'intent_and_load' or d['novelty']: r = r ** 0.5         # Amped / Bored: richer athletic expression, same budget
        for k, p in opts:
            acc += p
            if r < acc: n = k; break
        if ctx['goal'] == 'build_strength': n = min(n, 3)                             # Build Strength keeps heavier strength support
    _, _, nmax = ath_budget(ctx, d)
    return min(n, nmax)


def pick_extras(ctx, d, blocks, used, structure, seed, n_target):
    """Add athletic movements (beyond primary + secondary) while count < target and the cost budget allows. Distinct movements,
    new families and planes first; never a second Olympic lift, never a second sprint / sled."""
    lv, dur = ctx['lv'], ctx['dur']
    bud, amax, _ = ath_budget(ctx, d)
    LIM = limits(lv, dur, d)
    out = []
    def state():
        its = [x for b in blocks + out for x in b['items'] if x['cls'] == 'power']
        cost = sum(TIER_COST[tier(x['id'], x['role'])] for x in its); na = sum(tier(x['id'], x['role']) == 'A' for x in its)
        fams = [FAMILY(x['kind']) for x in its]; vecs = {vector(EX[x['id']]) for x in its}; kinds = {x['kind'] for x in its}
        return its, cost, na, fams, vecs, kinds
    for step in range(3):
        its, cost, na, fams, vecs, kinds = state()
        if len(its) >= n_target: break
        pool = []
        for q in QUALITY_LABEL:
            if q in LOWER_Q and ctx['sore'] & LOWER: continue
            if q == 'elastic_reactive' and not d['allow_elastic']: continue
            for i in power_pool(ctx, q):
                k = kind_of(i); e = EX[i]; t = tier(i, 'tertiary')
                if k == 'olympic' or (k == 'explosive_lift' and 'olympic' in fams) or k in kinds: continue
                cap = FAMILY_CAP.get(FAMILY(k), 2) + (1 if FAMILY(k) in ('throw', 'upper') and ctx['sore'] & LOWER else 0)   # upper-only day: throws carry it
                if fams.count(FAMILY(k)) >= cap: continue
                if k in JUMP_KINDS and any(y['kind'] in JUMP_KINDS and vector(EX[y['id']]) == vector(e) for y in its): continue   # a second jump goes a different direction
                if cost + TIER_COST[t] > bud or (t == 'A' and na >= amax): continue
                if e['cx'] > min(d['cx_cap'], 4 if lv == 'advanced' else 3): continue
                if e['cx'] >= 4 and any(EX[y['id']]['cx'] >= 4 or y['kind'] == 'olympic' for y in its): continue      # one high-skill movement per session
                if d['secondary_kinds'] and k not in d['secondary_kinds']: continue
                if structure == 'contrast' and k in ('speed_strength',): continue
                dz = power_dose(i, lv, 'tertiary', d, dur); x = dict(id=i, kind=k, cls='power', role='tertiary', **dz)
                proj = [dict(y, sets=projected_sets(y, len(its) + 1)) for y in its + [x]]     # after the rebalance that a further element triggers
                if (sum(contacts_of(y) for y in proj) > LIM['contacts'] or sum(y['sets'] for y in proj) > LIM['explosive_sets']
                        or sum(y['sets'] * INTENT_W.get(y['kind'], 1.0) for y in proj) > LIM['intent_load']): continue
                pool.append(i)
        ranked = rank_power(ctx, d, pool, 'secondary', used, f"{seed}|x{step}")
        if not ranked: break
        def bonus(i):
            k = kind_of(i); b = EXTRA_KIND_W.get(k, 1.0)
            if FAMILY(k) not in fams: b *= 1.6
            if q_of(i) in {x['quality'] for x in its}: b *= 0.25         # a new athletic quality before a second exercise for one we already have
            if vector(EX[i]) not in vecs: b *= 1.25
            if k == 'muscle_up' and d['novelty']: b *= 1.8
            if k in ('pop', 'uni_jump') and d['novelty']: b *= 1.3
            return b
        # seeded weighted choice: the ranking and the variety bonuses decide how often, not whether (so the vocabulary actually varies)
        wts = [(0.88 ** n) * bonus(i) for n, i in enumerate(ranked)]
        r = u(seed, 'extra', step) * sum(wts); acc = 0.0; i = ranked[-1]
        for j, wj in zip(ranked, wts):
            acc += wj
            if acc >= r: i = j; break
        dz = power_dose(i, lv, 'tertiary', d, dur)
        out.append(make_block('tertiary', [P(i, 'tertiary', dz)], 'straight', rounds=dz['sets'], rest_rounds=dz['rest'], quality=q_of(i)))
        used.append(i)
    return out


def projected_sets(x, n_ath):
    """Sets after the rebalance in build_session (primary gives up a set, other elements capped at 3; sprints / speed-strength at 4)."""
    if n_ath < 3: return x['sets']
    if x['role'] == 'primary':
        return x['sets'] - 1 if x['sets'] > (5 if x['kind'] == 'sprint' else 4 if x['kind'] in OLY_KINDS else 3) else x['sets']
    if x['role'] in ('contrast_power', 'contrast_strength'): return x['sets']
    return min(x['sets'], 4 if x['kind'] in SPRINT_KINDS | {'speed_strength'} else 3)


def order_athletic(blocks):
    """Highest cost / skill first: primary stays first; the other athletic blocks by tier (A, B, C), jumps before throws within a tier."""
    prim = [b for b in blocks if b['role'] == 'primary']; rest = [b for b in blocks if b['role'] in ('secondary', 'tertiary')]
    rank = {'A': 0, 'B': 1, 'C': 2}
    rest.sort(key=lambda b: (rank[tier(b['items'][0]['id'], 'tertiary')], 0 if b['items'][0]['kind'] in JUMP_KINDS | SPRINT_KINDS else 1))
    for n, b in enumerate(rest):
        role = 'secondary' if n == 0 else 'tertiary'
        b['role'] = role
        for x in b['items']: x['role'] = role
    return prim + rest
CONTRAST_PAIRS = {   # primary quality -> [(strength id, explosive analogue ids ...)]
    'vertical_power': [('trap_bar_deadlift', ['countermovement_jump', 'box_jump']), ('front_squat', ['box_jump', 'countermovement_jump']),
                       ('barbell_back_squat', ['box_jump', 'countermovement_jump']), ('goblet_squat', ['countermovement_jump'])],
    'horizontal_power': [('barbell_hip_thrust', ['broad_jump']), ('barbell_rdl', ['broad_jump']), ('trap_bar_deadlift', ['broad_jump'])],
    'upper_power': [('barbell_bench_press', ['mb_chest_pass', 'explosive_push_up']), ('db_bench_press', ['mb_chest_pass', 'explosive_push_up']),
                    ('weighted_push_up', ['explosive_push_up', 'mb_chest_pass'])],
}


def secondary_wanted(structure, pq, ctx, d):
    """Composition pass: a second athletic quality is the default, not the exception. The bulk of an Athletic session is athletic
    work; strength supports it. The quality budget (reconcile) still decides whether it can stay explosive."""
    if not d['allow_secondary'] or d['max_explosive'] < 2: return False
    return True


# ================================================================== session build
def make_block(role, items, structure='straight', rounds=None, rest_items=None, rest_rounds=None, why=None, quality=None, purpose=None):
    return dict(role=role, items=items, structure=structure, rounds=rounds, rest_items=rest_items, rest_rounds=rest_rounds, why=why, quality=quality, purpose=purpose)


def P(i, role, dz):  # power item
    return dict(id=i, cls='power', kind=kind_of(i), quality=q_of(i), role=role, **dz)


def ST(i, role, dz, pattern):
    return dict(id=i, cls='strength', kind='strength', pattern=pattern, role=role, **dz)


def SU(i, dz):
    return dict(id=i, cls='support', kind=SUPPORT[i], role='support', **dz)


def build_session(ctx, d, arch, structure, pq, seed, log):
    lv, dur, goal = ctx['lv'], ctx['dur'], ctx['goal']
    used = []; blocks = []; notes = []
    # ---------------- primary
    if structure == 'contrast':
        pairs = [(s, [a for a in an if a in power_pool(ctx, q_of(a) or pq)]) for s, an in CONTRAST_PAIRS.get(pq, [])]
        pairs = [(s, an) for s, an in pairs if s in strength_pool(ctx, {STRENGTH.get(s)}) and an]
        pairs = sorted(pairs, key=lambda p: -(u(seed, 'cp', p[0]) + (0.5 if EX[p[0]]['eq'] in ('barbell', 'trap_bar') and lv == 'advanced' else 0)
                                             - (0.8 if any(p[0] in h.get('ids', []) for h in ctx['history'][:1]) else 0)
                                             - (2.0 if any(p[0] in dd.get('ids', []) for dd in ctx['displayed']) else 0)))
        if not pairs: return None
        s_id, an = pairs[0]; a_id = rank_power(ctx, d, an, 'contrast', used, seed)[:1]
        if not a_id: return None
        a_id = a_id[0]
        sdz = strength_dose(s_id, lv, 'A', goal, d, dur, contrast=True); adz = power_dose(a_id, lv, 'contrast', d, dur)
        adz['sets'] = sdz['sets']; adz['rest'] = max(adz['rest'], 150 if lv == 'advanced' else 120)
        items = [ST(s_id, 'contrast_strength', sdz, STRENGTH[s_id]), P(a_id, 'contrast_power', adz)]
        blocks.append(make_block('primary', items, 'contrast', rounds=sdz['sets'], rest_items=45, rest_rounds=adz['rest'], quality=pq,
                                 why=f"heavy {EX[s_id]['name'].lower()} primes the {EX[a_id]['name'].lower()} that follows"))
        used += [s_id, a_id]; primary_id = a_id
    else:
        pool = power_pool(ctx, pq)
        if structure == 'jump_throw': pool = [i for i in pool if kind_of(i) in JUMP_KINDS] or pool
        ranked = rank_power(ctx, d, pool, 'primary', used, seed)
        if not ranked: return None
        primary_id = ranked[0]
        dz = power_dose(primary_id, lv, 'primary', d, dur)
        blocks.append(make_block('primary', [P(primary_id, 'primary', dz)], 'straight', rounds=dz['sets'], rest_rounds=dz['rest'], quality=pq))
        used.append(primary_id)
    # ---------------- secondary quality (the default: a second athletic expression, chosen to complement the first)
    if secondary_wanted(structure, pq, ctx, d):
        opts = CONTRAST_SECONDARY if structure == 'contrast' else SECONDARY_FOR.get(structure, {})
        sq_list = list(opts.get(pq) or opts.get('_') or [])
        if len(sq_list) > 1 and not ctx['target']:
            sq_list = sorted(sq_list, key=lambda q: -((1.0 + 0.2 * (q == sq_list[0])) * (0.5 if any(h.get('secondary_quality') == q for h in ctx['history'][:1]) else 1.0) * u(seed, 'sq', q)))
        tu = set(ctx['target']) & TARGET_UPPER
        if tu & {'chest', 'triceps', 'shoulders'}: sq_list = ['upper_power'] + [q for q in sq_list if q != 'upper_power']
        elif tu or 'core' in ctx['target']: sq_list = ['rotational_power'] + [q for q in sq_list if q != 'rotational_power']
        # fallback: a simple throw keeps the session athletic at almost no impact cost
        fallback = [q for q in ('rotational_power', 'upper_power', 'total_body_power') if q not in sq_list and q != pq]
        le_throw_primary = bool(d['secondary_kinds']) and kind_of(primary_id) in THROW_KINDS     # Low Energy led by a throw: the partner is a simple jump or start
        if le_throw_primary: sq_list, fallback = ['vertical_power', 'horizontal_power', 'acceleration'], []
        for n_try, sq in enumerate(sq_list + fallback):
            if sq in LOWER_Q and ctx['sore'] & LOWER: continue
            if sq == 'elastic_reactive' and not d['allow_elastic']: continue
            kinds = set(SECONDARY_KINDS.get(sq) or ()) if n_try < len(sq_list) else set(LOW_COST_KINDS)
            if d['secondary_kinds']: kinds &= set(d['secondary_kinds']) if not le_throw_primary else {'jump', 'sprint'}
            if dur == 30: kinds &= LOW_COST_KINDS
            if not kinds: continue
            pool = [i for i in power_pool(ctx, sq, kinds) if EX[i]['cx'] <= min(3, max(2, d['cx_cap'] - 1))]
            # a lower-body secondary after a lower-body primary must be low-contact and a different vector
            if sq in LOWER_Q and pq in LOWER_Q: pool = [i for i in pool if kind_of(i) in ('sprint', 'sled', 'jump', 'lateral') and vector(EX[i]) != vector(EX[primary_id])]
            pool = [i for i in pool if kind_of(i) != kind_of(primary_id) and EX[i]['pat'] != EX[primary_id]['pat']]   # a different movement, not a second version of the first
            ranked = rank_power(ctx, d, pool, 'secondary', used, seed)
            if not ranked: continue
            sid = ranked[0]; dz = power_dose(sid, lv, 'secondary', d, dur)
            blocks.append(make_block('secondary', [P(sid, 'secondary', dz)], 'straight', rounds=dz['sets'], rest_rounds=dz['rest'], quality=sq))
            used.append(sid); break
    # ---------------- further athletic movements (identity pass): count limited by the athletic movement budget, not by block names
    n_target = target_count(ctx, d, structure, seed)
    if not any(b['role'] == 'secondary' for b in blocks) and n_target >= 2 and dur == 60:
        pass   # the secondary step found nothing; the extras step below still tries to reach the target
    blocks += pick_extras(ctx, d, blocks, used, structure, seed, n_target)
    blocks[:] = order_athletic(blocks)
    n_ath = sum(x['cls'] == 'power' for b in blocks for x in b['items'])
    # rebalance, not more volume: with three or more athletic movements the primary gives up a set and every other element stays at 3 sets
    if n_ath >= 3:
        pb = blocks[0]
        if pb['structure'] == 'straight':
            x = pb['items'][0]
            if x['sets'] > (5 if x['kind'] == 'sprint' else 4 if x['kind'] in OLY_KINDS else 3): x['sets'] -= 1; pb['rounds'] = x['sets']
        for b in blocks[1:]:
            cap = 4 if b['items'][0]['kind'] in SPRINT_KINDS | {'speed_strength'} else 3
            if b['role'] in ('secondary', 'tertiary') and b['items'][0]['sets'] > cap:
                b['items'][0]['sets'] = cap; b['rounds'] = cap
    # ---------------- athletic strength
    plan_a, plan_b = STRENGTH_PLAN[pq]
    if goal == 'build_strength' and lv != 'beginner': plan_a = ['lower_bilateral', 'hinge'] + [p for p in plan_a if p not in ('lower_bilateral', 'hinge')]
    if ctx['sore'] & LOWER: plan_a, plan_b = ['upper_pull', 'upper_push'], ['upper_push_v', 'upper_pull']
    tl = set(ctx['target']) & TARGET_LOWER; tu = set(ctx['target']) & TARGET_UPPER
    if tu and not (ctx['sore'] & LOWER):
        pref = []
        if tu & {'chest', 'triceps'}: pref.append('upper_push')
        if tu & {'back', 'biceps', 'forearms'}: pref.append('upper_pull')
        if tu & {'shoulders'}: pref.append('upper_push_v')
        plan_b = pref + [p for p in plan_b if p not in pref]
    if tl:
        pref = []
        if 'hamstrings' in tl: pref += ['hinge', 'hinge_uni']
        if 'glutes' in tl: pref += ['hip_thrust', 'hinge', 'unilateral']
        if 'quads' in tl: pref += ['lower_bilateral', 'unilateral']
        if tl & {'hip_adductors', 'hip_abductors'}: pref += ['lateral_uni']
        if pq in LOWER_Q: plan_a = list(dict.fromkeys(pref + plan_a))
    # strength is support, not the default pair: two strength exercises only for Build Strength or when the athletic work is short
    has_sec = n_ath >= 2
    if structure == 'contrast': n_strength = (1 if n_ath <= 3 else 0) if dur == 60 else 0     # the heavy half of the pair is strength already
    elif dur == 30: n_strength = 1 if has_sec else 2
    elif goal == 'build_strength' or n_ath <= 2: n_strength = 2
    else: n_strength = 1
    st_items = []
    contrast_pat = STRENGTH.get(blocks[0]['items'][0]['id']) if structure == 'contrast' else None
    heavy_first = lv == 'advanced' or (goal == 'build_strength' and lv == 'intermediate') or (d['amped_mode'] is not None and lv != 'beginner')
    if 'upper_pull' in plan_b[:1] and not (tu & {'back', 'biceps', 'forearms'}) and u(seed, 'b_pull') < 0.5:
        plan_b = [p for p in plan_b if p != 'upper_pull'] + ['upper_pull']        # pull-ups / rows are occasional balance, not the default partner
    for slot, plan in (('A', plan_a), ('B', plan_b)):
        if len(st_items) >= n_strength: break
        if structure == 'contrast' and slot == 'A':
            anti = ['upper_pull'] + ([p for p in plan_a if p in LOWER_PAT] if contrast_pat in UPPER_PAT and not (ctx['sore'] & LOWER) else [])
            plan = [p for p in anti + plan_b + plan_a if p != contrast_pat]
        for pat in plan:
            if st_items and pat == st_items[0]['pattern']: continue
            if st_items and pat in LOWER_PAT and st_items[0]['pattern'] in LOWER_PAT and ctx['dur'] == 30: continue
            if contrast_pat and pat == contrast_pat: continue
            cand = rank_strength(ctx, d, strength_pool(ctx, {pat}), used, seed, slot + pat)
            if slot == 'A' and heavy_first and not contrast_pat:
                # the force-producing slot should be loadable: skip light-load options while a later pattern offers a loadable one
                heavy = [i for i in cand if i not in LIGHT_LOAD]
                later = any(i not in LIGHT_LOAD for p2 in plan[plan.index(pat) + 1:] for i in strength_pool(ctx, {p2}) if i not in used)
                if not heavy and later: continue
                cand = heavy or cand
            if not cand: continue
            sid = cand[0]; dz = strength_dose(sid, lv, 'A' if not st_items else 'B', goal, d, dur)
            st_items.append(ST(sid, 'strength', dz, pat)); used.append(sid); break
    if st_items and 'low_energy' in d['prefer'] and len(st_items) == 2:
        for x in st_items: x['sets'] = min(x['sets'], 2)            # Low Energy: two short strength exercises, not more strength volume than a normal day
    if st_items and has_sec and goal != 'build_strength':
        for x in st_items: x['sets'] = min(x['sets'], 3)            # with more athletic work the strength stays concise (3 rounds)
    if st_items:
        if len(st_items) == 2:
            rounds = max(x['sets'] for x in st_items)
            for x in st_items: x['sets'] = rounds
            rest_r = max(60, st_items[0]['rest'] - 30) if dur == 60 else 60
            blocks.append(make_block('strength', st_items, 'superset', rounds=rounds, rest_items=60 if dur == 60 else 30, rest_rounds=rest_r,
                                                                            why=STRENGTH_WHY[st_items[0]['pattern']]))
        else:
            x = st_items[0]; blocks.append(make_block('strength', st_items, 'straight', rounds=x['sets'], rest_rounds=x['rest'], why=STRENGTH_WHY[x['pattern']]))
    # ---------------- support (optional, purpose-bound)
    if dur == 60 and d['support_ok'] and support_wanted(ctx, d, structure, pq, blocks, seed):
        kinds = list(SUPPORT_PLAN[pq])
        if 'core' in ctx['target']: kinds = ['anti_rotation', 'anti_extension', 'lateral_trunk'] + kinds
        if 'calves' in ctx['target']: kinds = ['tendon'] + kinds
        if 'hamstrings' in ctx['target'] and not any(x['pattern'].startswith('hinge') for x in st_items): kinds = ['hamstring'] + kinds
        if any(x['pattern'].startswith('hinge') for x in st_items) and 'hamstrings' not in ctx['target']: kinds = [k for k in kinds if k != 'hamstring']
        if ctx['sore'] & LOWER: kinds = ['anti_rotation', 'anti_extension']
        for k in dict.fromkeys(kinds):
            cand = [i for i in support_pool(ctx, {k}) if i not in used]
            cand = sorted(cand, key=lambda i: (-(1.5 if EX[i]['cx'] <= 2 and lv == 'beginner' else 1.0) * (0.6 if any(i in h.get('ids', []) for h in ctx['history'][:1]) else 1.0)
                                                * (0.1 if any(i in dd.get('ids', []) for dd in ctx['displayed']) else 1.0) * (0.8 + 0.4 * u(seed, 'su', i))))
            if not cand: continue
            sid = cand[0]; dz = support_dose(sid, lv, goal)
            blocks.append(make_block('support', [SU(sid, dz)], 'straight', rounds=dz['sets'], rest_rounds=dz['rest'], purpose=k, why=SUPPORT_WHY[k]))
            used.append(sid); break
    # ---------------- rare finisher (purposeful, self-limiting, never after a hard power session)
    fin = finisher_for(ctx, d, blocks, structure, used, seed)
    if fin: blocks.append(fin); used.append(fin['items'][0]['id'])
    return dict(arch=arch, structure=structure, pq=pq, blocks=blocks, primary_id=primary_id, used=used)


def support_wanted(ctx, d, structure, pq, blocks, seed):
    """Identity pass: support is the exception. Trunk / tendon / hamstring work only where it serves the day; otherwise nothing."""
    if 'low_energy' in d['prefer']: return False
    n_items = sum(len(b['items']) for b in blocks)
    if n_items >= 5: return False
    n_pw = sum(x['cls'] == 'power' for b in blocks for x in b['items']); n_st = sum(x['cls'] == 'strength' for b in blocks for x in b['items'])
    if n_pw < n_st + 2: return False           # support never tips the session toward strength / support
    if set(ctx['target']) & {'core', 'calves', 'hamstrings'} or ctx['sore'] & LOWER: return True
    if pq in ('acceleration', 'elastic_reactive', 'rotational_power'): return u(seed, 'support') < 0.3    # hamstrings for sprinting, tendons, anti-rotation
    return False


def finisher_for(ctx, d, blocks, structure, used, seed):
    if ctx['dur'] != 60 or not d['finisher_ok'] or ctx['lv'] == 'beginner': return None
    if ctx['goal'] not in ('lose_weight_conditioning',): return None
    if structure in ('speed_strength', 'contrast') or ctx['sore'] & LOWER: return None
    if u(ctx['seed'], 'fin', structure) > 0.5: return None       # rare even when it fits
    for i in ('sled_push',):                                   # identity pass: no carries in Athletic
        if i in used or i not in EX or not avail(EX[i], ctx['preset']) or region_blocked(EX[i], ctx['sore']): continue
        dz = dict(sets=4, reps=1, distance_m=15, rest=60, work_s=10, per_side=False, intent='moderate sled, steady powerful pushes; not a race')
        it = dict(id=i, cls='finisher', kind='sled_finisher', quality=None, role='finisher', **dz)
        return make_block('finisher', [it], 'straight', rounds=dz['sets'], rest_rounds=dz['rest'], why='a short, self-limiting piece for your conditioning goal; it cannot compromise the power work because it comes last')
    return None


# ================================================================== warm-up / preparation
RAISE = ['stationary_bike', 'row_erg', 'air_bike', 'ski_erg', 'jump_rope']
def prep(ctx, d, sess, seed):
    lv, dur, pre = ctx['lv'], ctx['dur'], ctx['preset']; pq = sess['pq']; legs_sore = bool(ctx['sore'] & LOWER)
    first = sess['blocks'][0]['items'][-1]['id'] if sess['structure'] == 'contrast' else sess['primary_id']
    k = kind_of(first)
    wu = []
    raises = [i for i in RAISE if i in EX and avail(EX[i], pre)] or ['jump_rope']
    pref = ['stationary_bike'] if ('low_energy' in d['prefer'] or lv == 'beginner') else (['air_bike', 'row_erg'] if pq == 'acceleration' else ['row_erg', 'ski_erg', 'air_bike'])
    if d['novelty']: pref = ['ski_erg', 'air_bike', 'jump_rope']
    if legs_sore: pref = ['ski_erg', 'row_erg', 'stationary_bike']
    r = next((p for p in pref if p in raises), raises[int(u(seed, 'raise') * len(raises)) % len(raises)])
    wu.append(('raise', r, '3-4 min easy, build to moderate' if dur == 60 else '2 min easy'))
    mob = []
    if pq in UPPER_Q or legs_sore: mob = ['worlds_greatest_stretch', 'band_pull_apart' if avail(EX['band_pull_apart'], pre) and not region_blocked(EX['band_pull_apart'], ctx['sore']) else 'glute_bridge']
    elif pq == 'acceleration': mob = ['leg_swings', 'worlds_greatest_stretch']
    else: mob = ['worlds_greatest_stretch', 'leg_swings']
    MOBNOTE = {'worlds_greatest_stretch': '3 / side', 'leg_swings': '10 each way', 'lateral_lunge': '5 / side, bodyweight', 'glute_bridge': '10', 'band_pull_apart': '15'}
    for m in mob[:2 if dur == 60 else 1]:
        if m in EX and avail(EX[m], pre): wu.append(('mobility', m, MOBNOTE.get(m, '')))
    prim = []
    if not legs_sore:
        if pq == 'acceleration': prim = ['a_march', 'wall_drill'] if lv == 'beginner' else ['a_skip', 'wall_drill']
        elif pq in ('vertical_power', 'horizontal_power', 'elastic_reactive'): prim = ['snap_down', 'pogo_hop'] if first != 'pogo_hop' else ['snap_down']
        elif pq == 'total_body_power': prim = ['snap_down', 'pogo_hop']
        else: prim = ['snap_down']
        if 'low_energy' in d['prefer'] or lv == 'beginner': prim = [p for p in prim if p != 'pogo_hop'] or prim
    NOTE = {'pogo_hop': '2 x 10', 'snap_down': '2 x 5', 'a_skip': '2 x 10 m', 'a_march': '2 x 10 m', 'wall_drill': '2 x 5 / leg'}
    for p in [p for p in prim if p in EX and avail(EX[p], pre) and p not in sess['used']][:2 if dur == 60 else 1]:
        wu.append(('primer', p, NOTE.get(p, '')))
    # rehearsal: build into the first high-intent movement
    if k in ('olympic', 'explosive_lift', 'loaded_jump', 'upper', 'landmine_rot', 'swing') or sess['structure'] == 'contrast':
        wu.append(('rehearsal', first, 'empty bar or light, 2 x 3, then build' if EX[first]['eq'] == 'barbell' else 'light, 2 x 3, then build'))
    elif k in ('sprint', 'sled'):
        wu.append(('rehearsal', first, '2 build-ups at 70% and 85%' if k != 'sled' else '1 easy push, then 1 at 80%'))
    elif k in ('throw', 'rot_throw', 'slam'):
        wu.append(('rehearsal', first, '2 x 3 at 70%, then build'))
    elif k in ('jump', 'combo', 'bound', 'hop', 'lateral', 'drop', 'elastic') and dur == 60:
        wu.append(('rehearsal', first, '2 x 2 at 70-80%, full reset'))
    return wu[:6]


WU_MIN = {'raise': (2.0, 3.5), 'mobility': (1.0, 1.5), 'primer': (1.5, 1.5), 'rehearsal': (1.5, 2.0)}
def wu_minutes(wu, dur):
    return round(sum(WU_MIN[c][dur == 60] for c, *_ in wu), 1)


# ================================================================== time + accounting
TRANSITION_S = 75
def block_seconds(b):
    its = b['items']
    if b['structure'] in ('superset', 'contrast'):
        per_round = sum(x['sets'] and x['work_s'] for x in its) + (b['rest_items'] or 0) * (len(its) - 1)
        return b['rounds'] * per_round + (b['rounds'] - 1) * (b['rest_rounds'] or 0) + 60 * len(its)
    x = its[0]
    setup = 60 if x['cls'] in ('strength',) or x['kind'] in ('olympic', 'explosive_lift', 'loaded_jump') else 30
    return x['sets'] * x['work_s'] + (x['sets'] - 1) * x['rest'] + setup


def total_minutes(sess, wu):
    s = sum(block_seconds(b) for b in sess['blocks']) + TRANSITION_S * max(0, len(sess['blocks']) - 1)
    return round(wu_minutes(wu, sess['dur']) + s / 60 + (sess.get('cooldown_min') or 0), 1)


def contacts_of(x):
    if x['cls'] != 'power' or x['kind'] not in JUMP_KINDS: return 0
    n = x['sets'] * x['reps'] * (2 if x['per_side'] else 1)
    if x['kind'] == 'combo': n *= 2
    return n


INTENT_W = {'olympic': 1.5, 'explosive_lift': 1.3, 'loaded_jump': 1.2, 'bound': 1.2, 'drop': 1.5, 'combo': 1.2, 'sprint': 1.0, 'sled': 1.0, 'jump': 1.0, 'hop': 1.0,
            'lateral': 1.0, 'elastic': 1.0, 'upper': 1.0, 'landmine_rot': 0.9, 'throw': 0.6, 'rot_throw': 0.7, 'slam': 0.6, 'swing': 0.9,
            'uni_jump': 1.0, 'pop': 0.8, 'muscle_up': 1.0, 'speed_strength': 1.0}


def account(sess, wu, lv):
    its = [x for b in sess['blocks'] for x in b['items']]
    pw = [x for x in its if x['cls'] == 'power']
    A = dict(
        n_items=len(its), n_explosive=len(pw), explosive_sets=sum(x['sets'] for x in pw),
        contacts=sum(contacts_of(x) for x in pw),
        high_contacts=sum(contacts_of(x) for x in pw if EX[x['id']]['impact'] == 'high'),
        unilateral_contacts=sum(contacts_of(x) for x in pw if x['per_side'] or EX[x['id']]['lat'] == 'unilateral'),
        # truthful accounting: sprints and sled pushes are different things the user does (both count toward the acceleration budget)
        sprint_exposures=sum(x['sets'] for x in pw if x['kind'] == 'sprint'), sprint_m=sum(x['sets'] * (x['distance_m'] or 0) for x in pw if x['kind'] == 'sprint'),
        sled_efforts=sum(x['sets'] for x in pw if x['kind'] == 'sled'), sled_m=sum(x['sets'] * (x['distance_m'] or 0) for x in pw if x['kind'] == 'sled'),
        accel_efforts=sum(x['sets'] for x in pw if x['kind'] in SPRINT_KINDS),
        throws=sum(x['sets'] * x['reps'] * (2 if x['per_side'] else 1) for x in pw if x['kind'] in THROW_KINDS),
        olympic_sets=sum(x['sets'] for x in pw if x['kind'] in OLY_KINDS),
        high_skill=sum(1 for x in its if EX[x['id']]['cx'] >= 4 or x['kind'] == 'olympic'),
        unilateral_explosive_sets=sum(x['sets'] for x in pw if x['per_side'] or EX[x['id']]['lat'] == 'unilateral'),
        strength_sets=sum(x['sets'] for x in its if x['cls'] == 'strength'), strength_items=sum(1 for x in its if x['cls'] == 'strength'),
        support_sets=sum(x['sets'] for x in its if x['cls'] == 'support'),
        intent_load=round(sum(x['sets'] * INTENT_W.get(x['kind'], 1.0) for x in pw), 1),
        max_power_reps=max([x['reps'] * (1 if x['kind'] != 'elastic' or x['id'] != 'pogo_hop' else 0.5) for x in pw] or [0]),
        min_power_rest=min([x['rest'] for x in pw] or [0]),
        max_cx=max([EX[x['id']]['cx'] for x in its] or [0]),
        finisher=any(b['role'] == 'finisher' for b in sess['blocks']),
        ath_cost=sum(TIER_COST[tier(x['id'], x['role'])] for x in pw), tier_a=sum(tier(x['id'], x['role']) == 'A' for x in pw),
        n_athletic=len(pw), n_athletic_strength=sum(1 for x in its if x['cls'] == 'strength'), n_support=sum(1 for x in its if x['cls'] in ('support', 'finisher')),
        est=total_minutes(sess, wu), wu_min=wu_minutes(wu, sess['dur']),
    )
    return A


LIMITS = {   # 60-minute ceilings; 30 minutes use the second tuple.  (beginner, intermediate, advanced)
    'contacts': ((30, 60, 90), (24, 45, 65)), 'high_contacts': ((0, 0, 20), (0, 0, 12)),
    'accel_efforts': ((6, 8, 10), (5, 6, 8)), 'explosive_sets': ((9, 12, 14), (6, 7, 9)),
    'intent_load': ((8, 12, 14), (5.5, 7, 9)), 'olympic_sets': ((0, 5, 6), (0, 4, 5)), 'high_skill': ((0, 1, 1), (0, 1, 1)),
    'n_items': ((5, 5, 5), (3, 3, 3)), 'strength_sets': ((8, 10, 10), (6, 6, 6)), 'n_explosive': ((3, 4, 4), (2, 2, 2)),
    'ath_cost': ((5, 8, 10), (4, 5, 6)), 'tier_a': ((1, 1, 2), (1, 1, 1)),
}


def limits(lv, dur, d=None):
    L = {k: v[dur == 30][SKILL_IDX[lv]] for k, v in LIMITS.items()}
    if d is not None:
        L['n_explosive'] = min(L['n_explosive'], d['max_explosive'])
        if 'low_energy' in d['prefer']:
            L['contacts'] = int(L['contacts'] * 0.6); L['explosive_sets'] = max(5, L['explosive_sets'] - 3); L['intent_load'] = round(L['intent_load'] * 0.65, 1)
            L['accel_efforts'] = max(4, L['accel_efforts'] - 3)
            L['ath_cost'] = min(L['ath_cost'], 4); L['tier_a'] = min(L['tier_a'], 1)
        if d['simple']: L['tier_a'] = min(L['tier_a'], 1)
    return L


def violations(A, lv, dur, d=None, contrast=False):
    L = limits(lv, dur, d); out = []
    for k in ('contacts', 'high_contacts', 'accel_efforts', 'explosive_sets', 'intent_load', 'olympic_sets', 'high_skill', 'n_items', 'strength_sets', 'ath_cost', 'tier_a'):
        if A[k] > L[k]: out.append((k, A[k], L[k]))
    nexp = A['n_explosive'] - (1 if contrast else 0)
    if nexp > L['n_explosive']: out.append(('n_explosive', A['n_explosive'], L['n_explosive']))
    return out


def reconcile(sess, wu, ctx, d, log):
    """Bring the whole session inside the impact / intent budget: first fewer sets on the most expensive power element
    (never below 3 on the primary, 2 elsewhere), then drop the secondary quality. Never adds work."""
    lv, dur = ctx['lv'], ctx['dur']
    for _ in range(20):
        A = account(sess, wu, lv); V = violations(A, lv, dur, d, sess['structure'] == 'contrast')
        if not V: return A
        codes = {v[0] for v in V}
        extras = [b for b in sess['blocks'] if b['role'] in ('tertiary', 'secondary')]
        if codes & {'n_explosive', 'ath_cost', 'tier_a'} or (codes & {'high_skill'} and extras):
            # drop the athletic element that causes the problem: the Tier A one for tier_a, the costliest for ath_cost, else the last (cheapest)
            key = (lambda b: tier(b['items'][0]['id'], b['role']) == 'A') if 'tier_a' in codes else \
                  (lambda b: EX[b['items'][0]['id']]['cx']) if 'high_skill' in codes else \
                  (lambda b: TIER_COST[tier(b['items'][0]['id'], b['role'])]) if 'ath_cost' in codes else (lambda b: 0)
            sb = max(reversed(sorted(extras, key=lambda b: b['role'] == 'secondary')), key=key) if extras else None
            if sb: sess['blocks'].remove(sb); relabel_roles(sess); log.append(dict(reason_code='budget_repair', action='drop_' + sb['role'], item=sb['items'][0]['id'], why=sorted(codes))); continue
        pw = [(b, x) for b in sess['blocks'] for x in b['items'] if x['cls'] == 'power']
        def cost(bx):
            b, x = bx
            return contacts_of(x) + 3 * (x['kind'] in SPRINT_KINDS) * x['sets'] + x['sets'] * INTENT_W.get(x['kind'], 1)
        movable = [bx for bx in pw if bx[1]['sets'] > (3 if bx[1]['role'] in ('primary', 'contrast_power') and lv != 'beginner' else 2)]
        if codes & {'contacts', 'high_contacts', 'accel_efforts', 'explosive_sets', 'intent_load', 'olympic_sets'} and movable:
            b, x = max(movable, key=cost); x['sets'] -= 1
            if b['structure'] == 'contrast':
                for y in b['items']: y['sets'] = x['sets']
            b['rounds'] = x['sets'] if b['structure'] != 'superset' else b['rounds']
            log.append(dict(reason_code='budget_repair', action='fewer_sets', item=x['id'], sets=x['sets'], why=sorted(codes))); continue
        if 'strength_sets' in codes:
            sb = next((b for b in sess['blocks'] if b['role'] == 'strength'), None)
            if sb and sb['rounds'] > 2:
                sb['rounds'] -= 1
                for x in sb['items']: x['sets'] = sb['rounds']
                log.append(dict(reason_code='budget_repair', action='fewer_strength_sets')); continue
        if 'n_items' in codes:
            for role in ('finisher', 'support', 'tertiary', 'secondary'):
                b = next((b for b in reversed(sess['blocks']) if b['role'] == role), None)
                if b: sess['blocks'].remove(b); relabel_roles(sess); log.append(dict(reason_code='budget_repair', action=f'drop_{role}')); break
            else: return A
            continue
        extras = [b for b in sess['blocks'] if b['role'] in ('tertiary', 'secondary')]
        if extras:
            sb = max(extras, key=lambda b: (b['role'] == 'tertiary', sum(contacts_of(x) + x['sets'] * INTENT_W.get(x['kind'], 1) for x in b['items'])))
            sess['blocks'].remove(sb); relabel_roles(sess); log.append(dict(reason_code='budget_repair', action='drop_' + sb['role'], item=sb['items'][0]['id'], why=sorted(codes))); continue
        return A
    return account(sess, wu, lv)


def relabel_roles(sess):
    """After a removal the first non-primary athletic block is the secondary quality again."""
    n = 0
    for b in sess['blocks']:
        if b['role'] in ('secondary', 'tertiary'):
            b['role'] = 'secondary' if n == 0 else 'tertiary'
            for x in b['items']: x['role'] = b['role']
            n += 1


WINDOW = {60: (30, 57), 30: (18, 30.5)}
EXTRA_MOB = ['lateral_lunge', 'glute_bridge', 'leg_swings', 'worlds_greatest_stretch']


def fit_window(sess, wu, ctx, d, log):
    """Duration is a window, not a quota. Over the window: trim the least essential work (finisher, support, a strength round,
    a secondary set). Under the floor: lengthen the preparation (never add training work)."""
    lv, dur = ctx['lv'], ctx['dur']; lo, hi = WINDOW[dur]
    for _ in range(10):
        A = account(sess, wu, lv)
        if A['est'] <= hi: break
        fb = next((b for b in sess['blocks'] if b['role'] == 'finisher'), None) or next((b for b in sess['blocks'] if b['role'] == 'support'), None)
        if fb: sess['blocks'].remove(fb); log.append(dict(reason_code='duration_trim', action='drop_' + fb['role'])); continue
        sb = next((b for b in sess['blocks'] if b['role'] == 'strength' and b['rounds'] > 3), None)
        if sb:
            sb['rounds'] -= 1
            for x in sb['items']: x['sets'] = sb['rounds']
            log.append(dict(reason_code='duration_trim', action='fewer_strength_rounds')); continue
        sb = next((b for b in sess['blocks'] if b['role'] == 'strength' and b['structure'] == 'superset' and (b['rest_rounds'] or 0) > 90), None)
        if sb: sb['rest_rounds'] = 90; log.append(dict(reason_code='duration_trim', action='shorter_strength_round_rest')); continue
        sec = next((b for b in sess['blocks'] if b['role'] == 'tertiary' and b['items'][0]['sets'] > 2), None) or \
              next((b for b in sess['blocks'] if b['role'] == 'secondary' and b['items'][0]['sets'] > 2), None)
        if sec: sec['items'][0]['sets'] -= 1; sec['rounds'] = sec['items'][0]['sets']; log.append(dict(reason_code='duration_trim', action=f"fewer_{sec['role']}_sets")); continue
        sb = next((b for b in sess['blocks'] if b['role'] == 'strength' and b['rounds'] > 2), None)
        if sb:
            sb['rounds'] -= 1
            for x in sb['items']: x['sets'] = sb['rounds']
            log.append(dict(reason_code='duration_trim', action='fewer_strength_rounds')); continue
        tb = next((b for b in reversed(sess['blocks']) if b['role'] == 'tertiary'), None)
        if tb: sess['blocks'].remove(tb); relabel_roles(sess); log.append(dict(reason_code='duration_trim', action='drop_tertiary')); continue
        break
    A = account(sess, wu, lv)
    have = {i for c, i, *_ in wu}
    for m in EXTRA_MOB:
        if A['est'] >= lo: break
        if m in have or m not in EX or not avail(EX[m], ctx['preset']) or region_blocked(EX[m], ctx['sore']): continue
        pos = max(k for k, w in enumerate(wu) if w[0] in ('raise', 'mobility')) + 1
        wu.insert(pos, ('mobility', m, {'lateral_lunge': '5 / side, bodyweight', 'glute_bridge': '10', 'leg_swings': '10 each way', 'worlds_greatest_stretch': '3 / side'}[m]))
        log.append(dict(reason_code='prep_extended', item=m)); A = account(sess, wu, lv)
    return A


# ================================================================== State Satisfaction + Coherence
def realized_for_state(s, A, ref, sess, d, ctx):
    """What actually changed for this State vs the same session built without States (ref). -> list of (kind, detail)."""
    R = []; its = [x for b in sess['blocks'] for x in b['items']]; pw = [x for x in its if x['cls'] == 'power']
    prim = sess['blocks'][0]['items'][-1] if sess['blocks'] else None
    st = [x for x in its if x['cls'] == 'strength']
    if s == 'low_energy':
        if ref and A['explosive_sets'] < ref['explosive_sets']: R.append(('fewer_explosive_sets', f"{A['explosive_sets']} explosive sets instead of {ref['explosive_sets']}"))
        if ref and A['n_explosive'] < ref['n_explosive']: R.append(('fewer_qualities', f"{A['n_explosive']} athletic movement{'s' if A['n_explosive'] != 1 else ''} instead of {ref['n_explosive']}"))
        if ref and A['contacts'] < ref['contacts']: R.append(('lower_impact', f"{A['contacts']} landings instead of {ref['contacts']}"))
        if A['max_cx'] <= 2 and (not ref or ref['max_cx'] > 2): R.append(('simpler_movements', 'every movement simple (complexity 2 or less)'))
        if ref and A['strength_sets'] < ref['strength_sets']: R.append(('less_strength_volume', f"{A['strength_sets']} strength sets instead of {ref['strength_sets']}"))
        if st and all(x['rir'] >= 3 for x in st): R.append(('easier_strength', f"strength sets stop about {st[0]['rir']} reps short of failure"))
        if prim and prim['rest'] >= 90 and d['rest_bonus'] > 0: R.append(('longer_recovery', f"{prim['rest']} s between primary sets"))
        if not A['finisher'] and not any(b['role'] == 'support' for b in sess['blocks']) and ref and (ref['support_sets'] or ref['finisher']): R.append(('no_extras', 'no support block or finisher'))
    elif s == 'amped':
        if st and ref and ref.get('_strength_rir') is not None and min(x['rir'] for x in st) < ref['_strength_rir']: R.append(('heavier_strength', f"strength sets taken to about {min(x['rir'] for x in st)} reps in reserve"))
        if st and ref and ref.get('_strength_reps') is not None and st[0]['reps'] < ref['_strength_reps']: R.append(('heavier_strength', f"{st[0]['reps']}-rep strength sets (heavier)"))
        if sess['structure'] == 'contrast': R.append(('contrast', 'heavy-light contrast pairing'))
        if prim and ref and prim['sets'] > ref.get('_primary_sets', 99) : R.append(('extra_quality_set', f"{prim['sets']} sets on the primary quality"))
        if d['amped_mode'] == 'intent_only' and ref and A['explosive_sets'] < ref['explosive_sets']: R.append(('all_out_efforts', f"{A['explosive_sets']} explosive sets instead of {ref['explosive_sets']}, each one all-out"))
        if ref and A['n_explosive'] > ref['n_explosive']: R.append(('richer_composition', f"{A['n_explosive']} athletic qualities instead of {ref['n_explosive']}"))
        if prim and EX[prim['id']]['cx'] >= 2 and kind_of(prim['id']) in ('loaded_jump', 'combo', 'explosive_lift', 'olympic', 'sled', 'bound', 'upper', 'landmine_rot'): R.append(('demanding_variation', f"a more demanding primary ({EX[prim['id']]['name']})"))
    elif s == 'irritated':
        forceful = [EX[x['id']]['name'] for x in pw if x['id'] in FORCEFUL_SIMPLE]
        if forceful: R.append(('forceful_movements', ', '.join(forceful)))
        if prim and prim['id'] in FORCEFUL_SIMPLE: R.append(('forceful_primary', EX[prim['id']]['name']))
        heavy = [EX[x['id']]['name'] for x in its if x['id'] in ('trap_bar_deadlift', 'barbell_back_squat', 'front_squat', 'barbell_hip_thrust', 'barbell_rdl', 'sled_push')]
        if heavy: R.append(('forceful_strength', ', '.join(heavy[:2])))
    elif s == 'stressed':
        if sess['structure'] in ('power_strength', 'speed_strength', 'jump_throw'): R.append(('simple_structure', STRUCTURE_LABEL[sess['structure']]))
        if A['max_cx'] <= 3 and all(EX[x['id']]['cx'] <= 2 for x in pw): R.append(('simple_power', 'simple, repeatable power movements'))
        if not any(x['kind'] in ('elastic', 'drop') for x in pw): R.append(('no_reactive_chaos', 'no reactive jumps'))
        if A['n_items'] <= (4 if ctx['dur'] == 60 else 3): R.append(('few_changes', f"{A['n_items']} exercises"))
    elif s == 'bored':
        last = ctx['history'][0] if ctx['history'] else None
        if last and last.get('primary_quality') != sess['pq']: R.append(('new_quality', f"{QUALITY_LABEL[sess['pq']]} instead of last time's {QUALITY_LABEL.get(last.get('primary_quality'), 'focus')}"))
        if last and last.get('structure') != sess['structure']: R.append(('new_structure', STRUCTURE_LABEL[sess['structure']]))
        novel = [EX[x['id']]['name'] for x in its if EX[x['id']]['nov'] >= 3 or vector(EX[x['id']]) in ('lateral', 'rotational', 'multi')]
        if len(novel) >= 2: R.append(('novel_movements', ', '.join(novel[:3])))
        if prim and (EX[prim['id']]['nov'] >= 3 or vector(EX[prim['id']]) in ('lateral', 'rotational', 'multi')): R.append(('novel_primary', EX[prim['id']]['name']))
        last_ids = set(last.get('ids', [])) if last else set()
        tools = {EX[x['id']]['eq'] for x in its} - {'bodyweight', 'dumbbells'} - {EX[i]['eq'] for i in last_ids if i in EX}
        if tools: R.append(('different_tools', ', '.join(sorted(tools))))
        if ref and ref.get('_ids') and len(set(x['id'] for x in its) - set(ref['_ids'])) >= 2: R.append(('different_exercises', f"{len(set(x['id'] for x in its) - set(ref['_ids']))} exercises changed from the default"))
        if sess['structure'] in ('contrast', 'athletic_mixed', 'jump_throw'): R.append(('less_common_structure', STRUCTURE_LABEL[sess['structure']]))
        planes = {vector(EX[x['id']]) for x in pw} - {None}
        if planes & {'lateral', 'rotational'}: R.append(('different_plane', '/'.join(sorted(planes & {'lateral', 'rotational'}))))
    return R


GATE_MIN = {'low_energy': 2, 'amped': 1, 'irritated': 2, 'stressed': 2, 'bored': 2}


def coherence(s, A, sess, d, ctx):
    """Whole finished session vs the State (absolute, not relative). -> list of problems."""
    lv, dur = ctx['lv'], ctx['dur']; its = [x for b in sess['blocks'] for x in b['items']]; pw = [x for x in its if x['cls'] == 'power']
    L = limits(lv, dur); bad = []
    if s == 'low_energy':
        if A['n_explosive'] > 2 or (A['n_explosive'] == 2 and not any(x['kind'] in THROW_KINDS for x in pw)): bad.append('more than one high-cost explosive exercise')
        if A['contacts'] > 0.6 * L['contacts']: bad.append(f"{A['contacts']} landings")
        if A['olympic_sets'] or A['high_skill']: bad.append('technical lifts')
        if A['accel_efforts'] > max(4, L['accel_efforts'] - 3): bad.append('sprint / sled volume')
        if A['strength_sets'] > (6 if dur == 60 else 4): bad.append('strength volume')
        if A['finisher']: bad.append('finisher')
    elif s == 'amped':
        if A['finisher']: bad.append('finisher added')
        if A['n_items'] > (5 if dur == 60 else 3): bad.append('extra exercises')
        if A['explosive_sets'] > L['explosive_sets']: bad.append('explosive volume over budget')
    elif s == 'irritated':
        if A['max_cx'] >= 4: bad.append('technical sequencing')
        if any(x['reps'] > 8 and x['kind'] != 'elastic' for x in pw): bad.append('high-rep power')
    elif s == 'stressed':
        if A['n_items'] > (4 if dur == 60 else 3): bad.append(f"{A['n_items']} exercises")
        if any(x['kind'] in ('drop', 'elastic') for x in pw) or sess['structure'] == 'contrast': bad.append('reactive or complex work')
        if any(EX[x['id']]['cx'] >= 3 for x in pw): bad.append('complex power movement')
    elif s == 'bored':
        if A['high_skill'] > 1 or A['max_cx'] > CX_CAP[lv]: bad.append('circus complexity')
    return bad


def relabel(sess, log):
    """A two-quality structure that lost its secondary element to a State repair is honestly relabelled."""
    if sess['structure'] in ('jump_throw', 'athletic_mixed') and not any(b['role'] == 'secondary' for b in sess['blocks']):
        new = {'acceleration': 'speed_strength'}.get(sess['pq'], 'power_strength')
        log.append(dict(reason_code='structure_relabelled', **{'from': sess['structure'], 'to': new})); sess['structure'] = new


def coherence_repair(s, sess, ctx, d, log):
    """Deterministic whole-session repairs for a failed coherence check. -> True if something changed."""
    blocks = sess['blocks']
    if s in ('low_energy', 'stressed'):
        for role in ('finisher', 'support') if s == 'stressed' else ('finisher', 'tertiary', 'support'):
            b = next((b for b in reversed(blocks) if b['role'] == role), None)
            if b: blocks.remove(b); relabel_roles(sess); log.append(dict(reason_code='state_coherence_repair', state=s, action=f'drop_{role}')); return True
        sb = next((b for b in blocks if b['role'] == 'strength'), None)
        if s == 'stressed' and sb and len(sb['items']) == 2:       # simple does not mean mostly strength: the second strength exercise goes first
            sb['items'] = sb['items'][:1]; sb['structure'] = 'straight'; sb['rest_items'] = None; sb['rest_rounds'] = sb['items'][0]['rest']
            log.append(dict(reason_code='state_coherence_repair', state=s, action='one_strength_exercise')); return True
        b = next((b for b in reversed(blocks) if b['role'] == 'tertiary'), None) if s == 'stressed' else None
        if b: blocks.remove(b); relabel_roles(sess); log.append(dict(reason_code='state_coherence_repair', state=s, action='drop_tertiary')); return True
        sb = next((b for b in blocks if b['role'] == 'strength'), None)
        if s == 'low_energy' and sb and sb['rounds'] > 2:
            sb['rounds'] -= 1
            for x in sb['items']: x['sets'] = sb['rounds']
            log.append(dict(reason_code='state_coherence_repair', state=s, action='fewer_strength_sets')); return True
        if s == 'low_energy' and sb and len(sb['items']) == 2:
            sb['items'] = sb['items'][:1]; sb['structure'] = 'straight'; sb['rest_items'] = None; sb['rest_rounds'] = sb['items'][0]['rest']; log.append(dict(reason_code='state_coherence_repair', state=s, action='one_strength_exercise')); return True
        b = next((b for b in blocks if b['role'] == 'secondary'), None)
        if b: blocks.remove(b); log.append(dict(reason_code='state_coherence_repair', state=s, action='drop_secondary')); return True
    if s == 'amped':
        b = next((b for b in blocks if b['role'] == 'finisher'), None)
        if b: blocks.remove(b); log.append(dict(reason_code='state_coherence_repair', state=s, action='drop_finisher')); return True
    return False


# ================================================================== context + generate
def make_ctx(nctx, history):
    pre = PRESET_ALIAS.get(nctx['equipment'], nctx['equipment'])
    arch = nctx.get('archetype')
    tgt = tuple(nctx.get('target_muscles') or ())
    if nctx.get('target_mode') == 'full_body': tgt = ('full_body',)
    return dict(lv=nctx['experience'], dur=nctx['duration'], preset=pre, goal=nctx.get('goal') or 'stay_consistent', states=[s for s in nctx['states'] if s not in ('normal', 'sore')],
                sore=frozenset(nctx.get('sore') or ()), target=tuple(t for t in tgt if t != 'full_body'), full_body=(nctx.get('target_mode') == 'full_body'),
                arch=arch, arch_explicit=bool(arch) and arch != nctx.get('resolved_archetype'), seed=f"{nctx['user']}|{nctx['date']}",
                history=list(history), displayed=[], bored='bored' in nctx['states'], banned=set(nctx.get('banned') or ()))


class Fail(Exception): pass


def _ref_account(ctx, arch, structure, pq, seed):
    """The same candidate built without States (for the State Satisfaction comparison)."""
    d0 = resolve_states([], ctx['lv'], ctx['dur'], ctx['goal']); log0 = []
    if structure == 'contrast' and not d0['allow_contrast']: d0 = dict(d0, allow_contrast=True)
    c0 = dict(ctx, states=[])
    s0 = build_session(c0, d0, arch, structure, pq, seed, log0)
    if not s0: return None
    s0['dur'] = ctx['dur']; wu0 = prep(c0, d0, s0, seed); A0 = reconcile(s0, wu0, c0, d0, log0)
    st = [x for b in s0['blocks'] for x in b['items'] if x['cls'] == 'strength']
    A0['_strength_rir'] = min((x['rir'] for x in st), default=None); A0['_strength_reps'] = st[0]['reps'] if st else None
    A0['_primary_sets'] = s0['blocks'][0]['items'][-1]['sets']; A0['_ids'] = [x['id'] for b in s0['blocks'] for x in b['items']]
    return A0


def generate(nctx, history, swap=0):
    """-> out dict. history: newest first, native Athletic records."""
    ctx0 = make_ctx(nctx, history)
    displayed = []; out = None
    for k in range(swap + 1):
        ctx = dict(ctx0, displayed=list(displayed), swap=k)
        out = _generate_once(ctx, nctx)
        displayed.append(dict(primary_quality=out['sess']['pq'], structure=out['sess']['structure'], ids=list(out['sess']['used'])))
    return out


def _generate_once(ctx, nctx):
    lv, dur = ctx['lv'], ctx['dur']
    states = ctx['states']
    d = resolve_states(states, lv, dur, ctx['goal'])
    log = list(d['log'])
    legs_sore = bool(ctx['sore'] & LOWER)
    requested = ctx['arch']
    rerouted = False
    if requested == 'athletic_speed_agility' and legs_sore:
        if ctx['arch_explicit']: raise Fail('sore_terminal: Speed + Plyo needs the legs')
        ctx = dict(ctx, arch='athletic_power'); rerouted = True; log.append(dict(reason_code='sore_reroute', **{'from': requested, 'to': 'athletic_power'}))
    if legs_sore and not ctx['arch']:
        log.append(dict(reason_code='sore_reroute', to='upper_body_power', why='legs sore'))
    seed_base = f"{ctx['seed']}|{ctx.get('swap', 0)}"
    cands = candidates(ctx, d)
    if not cands:
        if legs_sore: raise Fail('sore_equipment: not enough upper-body Athletic work with this equipment')
        raise Fail('no feasible Athletic candidate for this equipment and level')
    tried = []; best = None
    for n, (arch, structure, pq, w) in enumerate(cands[:8]):
        seed = f"{seed_base}|{n}"
        L = list(log)
        sess = build_session(ctx, d, arch, structure, pq, seed, L)
        if not sess: tried.append((arch, structure, pq, 'unbuildable')); continue
        sess['dur'] = dur
        if dur == 60: sess['cooldown_min'] = 3
        wu = prep(ctx, d, sess, seed)
        A = reconcile(sess, wu, ctx, d, L)
        if violations(A, lv, dur, d, structure == 'contrast'): tried.append((arch, structure, pq, 'budget')); continue
        if not any(b['role'] == 'primary' for b in sess['blocks']): tried.append((arch, structure, pq, 'no primary')); continue
        if structure in ('jump_throw', 'athletic_mixed') and not any(b['role'] == 'secondary' for b in sess['blocks']): tried.append((arch, structure, pq, 'no secondary')); continue
        A = fit_window(sess, wu, ctx, d, L)
        # State Satisfaction + whole-session Coherence
        ref = _ref_account(ctx, arch, structure, pq, seed) if states else None
        verdict = {}; realized = {}
        for s in states:
            for _ in range(4):
                bad = coherence(s, A, sess, d, ctx)
                if not bad or not coherence_repair(s, sess, ctx, d, L): break
                A = account(sess, wu, lv)
            relabel(sess, L)
            R = realized_for_state(s, A, ref, sess, d, ctx)
            realized[s] = R
            verdict[s] = dict(satisfied=len({k for k, _ in R}) >= GATE_MIN[s], coherent=not coherence(s, A, sess, d, ctx), problems=coherence(s, A, sess, d, ctx))
        from . import athletic_validate as _V
        vf = _V.fails(sess, wu, ctx, states)
        if vf: tried.append((arch, structure, pq, 'validator:' + ','.join(sorted({k.split(':')[0] for k, _ in vf})))); continue
        ok = all(v['satisfied'] and v['coherent'] for v in verdict.values())
        score = sum(v['satisfied'] + v['coherent'] for v in verdict.values())
        cand = dict(sess=sess, wu=wu, A=A, d=d, log=L, verdict=verdict, realized=realized, ref=ref, rank=n, weight=w, ctx=ctx, rerouted=rerouted, requested=requested)
        if ok:
            best = cand; break
        tried.append((arch, structure, pq, 'state_gate'))
        if best is None or score > best['_score']: best = dict(cand, _score=score)
    if best is None: raise Fail('no feasible Athletic candidate passed the budget')
    best['log'].append(dict(reason_code='candidate_selected', archetype=best['sess']['arch'], structure=best['sess']['structure'], primary_quality=best['sess']['pq'],
                            rank=best['rank'], tried=[list(t) for t in tried]))
    for s, v in best['verdict'].items():
        best['log'].append(dict(reason_code='state_gate', state=s, satisfied=v['satisfied'], coherent=v['coherent'], problems=v['problems'],
                                realized=[k for k, _ in best['realized'][s]]))
    for b in best['sess']['blocks']:
        for x in b['items']:
            best['log'].append(dict(reason_code='item_selected', role=x['role'], id=x['id'], sets=x['sets'], reps=x.get('reps'), rest=x['rest']))
    return best


def session_qualities(sess):
    """The workout's distinct athletic qualities in order (primary first). Two exercises for one quality are one quality."""
    out = [sess['pq']]
    for b in sess['blocks']:
        if b['role'] in ('secondary', 'tertiary') and b.get('quality') and b['quality'] not in out: out.append(b['quality'])
    return out


def history_record(out):
    s = out['sess']
    qs = session_qualities(s); sec = qs[1] if len(qs) > 1 else None; ter = qs[2] if len(qs) > 2 else None
    return dict(primary_quality=s['pq'], structure=s['structure'], primary_id=s['primary_id'], secondary_quality=sec, tertiary_quality=ter, ids=list(s['used']),
                swaps=[EX[i]['swap'] for i in s['used'] if EX[i]['swap']],
                strength_patterns=[x.get('pattern') for b in s['blocks'] for x in b['items'] if x['cls'] == 'strength'],
                states=list(out['ctx']['states']))
