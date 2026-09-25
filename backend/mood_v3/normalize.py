"""Unified input contract -> normalized generation context.

One place turns app-facing input (Direction, States, Target / archetype, duration, experience, equipment preset,
soreness, goal, history, swap context) into the values every Direction adapter needs. No programming rule lives here:
only vocabulary mapping and input validation. Anything unsupported becomes an explicit InputError (HTTP 422) or,
when it is a legitimate request the Direction cannot build, an explicit conflict downstream.
"""
from __future__ import annotations
import datetime as _dt
from dataclasses import dataclass, field
from typing import Optional

DIRECTIONS = ('strength', 'sweat', 'athletic')
STATES = ('low_energy', 'stressed', 'bored', 'irritated', 'sore', 'amped')
STATE_ALIASES = {'low energy': 'low_energy', 'lowenergy': 'low_energy', 'tired': 'low_energy', 'stressed': 'stressed', 'restless': 'stressed',
                 'bored': 'bored', 'irritated': 'irritated', 'sore': 'sore', 'amped': 'amped', 'high_energy': 'amped', 'high energy': 'amped',
                 'feeling_strong': 'amped', 'normal': None, 'none': None, 'feeling_good': None}
EXPERIENCE = ('beginner', 'intermediate', 'advanced')
DURATIONS = (30, 60)   # WA GENERATOR INPUT row 6 + WORKOUT STANDARDS: 30 and 60 are the only V3 durations
GOALS = ('build_strength', 'build_muscle', 'improve_athleticism', 'lose_weight_conditioning', 'feel_better_reduce_stress', 'stay_consistent')
FREQUENCIES = ('1-2', '3-4', '5+')
TRAINING_PREFERENCES = ('lifting', 'conditioning', 'athletic', 'mix')

# ---------------------------------------------------------------- equipment presets (launch set)
# Each unified preset maps to the preset each Direction's frozen QA was run on. None = not supported by that Direction.
PRESET_LABELS = {'commercial_gym': 'Commercial gym', 'free_weight_limited': 'Free weights (dumbbells, kettlebells, bench)',
                 'minimal': 'Minimal (dumbbells + bench)'}
FREE_WEIGHT_LIMITED = frozenset({'bodyweight', 'dumbbells', 'kettlebell', 'bench', 'box', 'jump_rope', 'bands', 'pullup_bar', 'med_ball', 'slam_ball'})
MINIMAL = frozenset({'bodyweight', 'dumbbells', 'bench', 'jump_rope'})
PRESETS = {
    # strength: ('frozen', name) uses the frozen Strength equipment set; ('set', equipment, space) passes an explicit set
    'commercial_gym':      {'strength': ('frozen', 'FULL_GYM'), 'sweat': 'sweat_commercial_default', 'athletic': 'athletic_commercial_default'},
    'free_weight_limited': {'strength': ('set', FREE_WEIGHT_LIMITED, frozenset({'standard_gym', 'floor_space', 'lane'})),
                            'sweat': 'free_weight_limited', 'athletic': 'free_weight_limited'},
    'minimal':             {'strength': ('set', MINIMAL, frozenset({'floor_space', 'standard_gym'})),
                            'sweat': 'db_bodyweight_only', 'athletic': 'bodyweight_floor'},
}
PRESET_ALIASES = {'commercial': 'commercial_gym', 'gym': 'commercial_gym', 'commercial_gym_default': 'commercial_gym', 'full_gym': 'commercial_gym',
                  'free_weight': 'free_weight_limited', 'free_weights': 'free_weight_limited', 'dumbbells_kettlebells': 'free_weight_limited',
                  'home': 'minimal', 'db_bench': 'minimal', 'bodyweight_minimal': 'minimal'}

# ---------------------------------------------------------------- soreness vocabulary (body-map regions + muscle ids)
SORE_REGIONS = {
    'legs': ('quads', 'hamstrings', 'glutes', 'calves'),          # = the Athletic frozen QA definition of sore legs
    'lower_body': ('quads', 'hamstrings', 'glutes', 'calves'),
    'chest': ('chest',),
    'back': ('back', 'spinal_erectors'),                           # Strength fixture 'back (lats+erectors)' = expand('back')
    'upper_back': ('back',),
    'lower_back': ('spinal_erectors',),
    'shoulders': ('shoulders', 'front_delts', 'side_delts', 'rear_delts'),
    'arms': ('biceps', 'triceps', 'forearms'),
    'core': ('core',),
}
MUSCLES = ('chest', 'back', 'shoulders', 'front_delts', 'side_delts', 'rear_delts', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings',
           'glutes', 'calves', 'hip_adductors', 'hip_abductors', 'core', 'spinal_erectors')
MUSCLE_PARENT = {'front_delts': 'shoulders', 'side_delts': 'shoulders', 'rear_delts': 'shoulders', 'spinal_erectors': 'back'}
USER_FACING_TARGETS = ('chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves',
                       'hip_adductors', 'hip_abductors', 'core')

ARCHETYPES = {
    'strength': ('strength_upper_push', 'strength_upper_pull', 'strength_upper_mixed', 'strength_arms', 'strength_lower_squat',
                 'strength_lower_hinge', 'strength_glutes_legs', 'strength_full_body', 'strength_core', 'strength_custom_target'),
    'sweat': ('sweat_engine', 'sweat_circuit', 'sweat_hybrid'),
    'athletic': ('athletic_power', 'athletic_speed_agility', 'athletic_full_body'),
}
ARCHETYPE_ALIASES = {'engine': 'sweat_engine', 'circuit': 'sweat_circuit', 'hybrid': 'sweat_hybrid', 'power': 'athletic_power',
                     'speed_agility': 'athletic_speed_agility', 'speed': 'athletic_speed_agility', 'full_body_athlete': 'athletic_full_body'}


class InputError(ValueError):
    def __init__(self, field: str, message: str):
        super().__init__(f'{field}: {message}'); self.field = field; self.message = message


@dataclass
class Context:
    direction: str
    states: list                 # canonical ids, order preserved, deduplicated, max 3, includes 'sore' when soreness given
    duration: int
    experience: str
    goal: str
    preset: str
    sore_regions: list
    sore_muscles: frozenset
    target_mode: str             # 'moods_pick' | 'explicit' | 'full_body'
    target_muscles: tuple        # explicit Target muscles (Strength / Sweat)
    archetype: Optional[str]     # explicit archetype choice, else None
    frequency: str
    user_key: str                # seed identity (user id)
    date: str                    # local date YYYY-MM-DD (seed)
    swap_count: int = 0
    notes: list = field(default_factory=list)   # normalization notes (logged, never user-facing copy)

    def public(self):
        return dict(direction=self.direction, states=list(self.states), duration=self.duration, experience=self.experience, goal=self.goal,
                    equipment=self.preset, soreness=list(self.sore_regions), target=dict(mode=self.target_mode, muscles=list(self.target_muscles)),
                    archetype=self.archetype, training_frequency=self.frequency, date=self.date, swap_count=self.swap_count)


def _norm_state(s):
    k = str(s).strip().lower().replace('-', '_')
    if k in STATES: return k
    k2 = k.replace('_', ' ')
    if k2 in STATE_ALIASES: return STATE_ALIASES[k2]
    if k in STATE_ALIASES: return STATE_ALIASES[k]
    raise InputError('states', f'unknown State "{s}"')


def resolve_direction(direction, training_preference, goal, history_directions):
    """WA COLD START: explicit Direction wins; else training preference; 'mix' uses goal; feel-better / consistent cycle
    Strength -> Sweat -> Athletic by completed history."""
    if direction:
        d = str(direction).strip().lower()
        if d not in DIRECTIONS: raise InputError('direction', f'must be one of {DIRECTIONS}')
        return d, None
    pref = (training_preference or '').strip().lower()
    if pref in ('lifting', 'strength', 'lifting_strength'): return 'strength', 'direction_from_training_preference'
    if pref in ('conditioning', 'hiit', 'hiit_conditioning', 'sweat'): return 'sweat', 'direction_from_training_preference'
    if pref in ('athletic', 'athletic_training'): return 'athletic', 'direction_from_training_preference'
    g = goal or 'stay_consistent'
    if g in ('build_strength', 'build_muscle'): return 'strength', 'direction_from_goal'
    if g == 'lose_weight_conditioning': return 'sweat', 'direction_from_goal'
    if g == 'improve_athleticism': return 'athletic', 'direction_from_goal'
    cycle = ['strength', 'sweat', 'athletic']
    last = history_directions[-1] if history_directions else None
    return (cycle[(cycle.index(last) + 1) % 3] if last in cycle else 'strength'), 'direction_cycle'


def normalize(raw: dict, user_key: str, history_directions=()) -> Context:
    notes = []
    goal = (raw.get('goal') or 'stay_consistent')
    if goal not in GOALS: raise InputError('goal', f'must be one of {GOALS}')
    direction, why = resolve_direction(raw.get('direction'), raw.get('training_preference'), goal, list(history_directions))
    if why: notes.append(why)
    # States (max 3, 'normal' ignored)
    states = []
    for s in raw.get('states') or []:
        k = _norm_state(s)
        if k and k not in states: states.append(k)
    # Soreness
    regions, muscles = [], set()
    for r in raw.get('soreness') or []:
        k = str(r).strip().lower().replace(' ', '_').replace('-', '_')
        if k in SORE_REGIONS: regions.append(k); muscles |= set(SORE_REGIONS[k])
        elif k in MUSCLES: regions.append(k); muscles.add(k)
        else: raise InputError('soreness', f'unknown region or muscle "{r}"')
    for m in list(muscles):   # a parent muscle includes its children (shoulders -> delts, back -> erectors), as the frozen fixtures do
        muscles |= {c for c, par in MUSCLE_PARENT.items() if par == m}
    if muscles and 'sore' not in states: states.append('sore')
    if 'sore' in states and not muscles:
        states.remove('sore'); notes.append('sore_state_without_regions_ignored')
    if len(states) > 3: raise InputError('states', 'select at most 3 States')
    duration = raw.get('duration', 60)
    try: duration = int(duration)
    except (TypeError, ValueError): raise InputError('duration', 'must be 30 or 60')
    if duration not in DURATIONS: raise InputError('duration', 'must be 30 or 60')
    exp = (raw.get('experience') or 'intermediate').lower()
    if exp not in EXPERIENCE: raise InputError('experience', f'must be one of {EXPERIENCE}')
    preset = (raw.get('equipment') or 'commercial_gym').lower()
    preset = PRESET_ALIASES.get(preset, preset)
    if preset not in PRESETS: raise InputError('equipment', f'must be one of {tuple(PRESETS)}')
    freq = str(raw.get('training_frequency') or '3-4')
    if freq not in FREQUENCIES: raise InputError('training_frequency', f'must be one of {FREQUENCIES}')
    # Target / archetype
    archetype = raw.get('archetype')
    if archetype in ('', 'moods_pick', None): archetype = None
    if archetype:
        archetype = ARCHETYPE_ALIASES.get(archetype, archetype)
        if archetype not in ARCHETYPES[direction]:
            raise InputError('archetype', f'"{archetype}" is not a {direction} archetype; choose one of {ARCHETYPES[direction]} or MOOD\'s Pick')
    target = raw.get('target')
    t_mode, t_muscles = 'moods_pick', ()
    if target in ('full_body', 'full body'):
        t_mode = 'full_body'
    elif target:
        ms = target if isinstance(target, (list, tuple)) else [target]
        clean = []
        for m in ms:
            k = str(m).strip().lower().replace(' ', '_')
            if k not in USER_FACING_TARGETS: raise InputError('target', f'"{m}" is not a user-facing Target muscle')
            if k not in clean: clean.append(k)
        if len(clean) > 3: raise InputError('target', 'choose at most 3 Target muscles')
        t_mode, t_muscles = 'explicit', tuple(clean)
    if direction == 'athletic' and t_mode != 'moods_pick':
        raise InputError('target', 'Athletic uses an archetype (Power, Speed + Agility, Full-Body Athlete) or MOOD\'s Pick, not a muscle Target')
    if archetype and t_mode != 'moods_pick' and direction == 'sweat':
        raise InputError('target', 'choose either a Sweat archetype or a Target, not both')
    if archetype == 'strength_custom_target' and t_mode != 'explicit':
        raise InputError('target', 'Custom Target needs 1 to 3 Target muscles')
    date = raw.get('date') or _dt.datetime.now(_dt.timezone.utc).date().isoformat()
    try: _dt.date.fromisoformat(date)
    except ValueError: raise InputError('date', 'must be YYYY-MM-DD')
    return Context(direction=direction, states=states, duration=duration, experience=exp, goal=goal, preset=preset,
                   sore_regions=regions, sore_muscles=frozenset(muscles), target_mode=t_mode, target_muscles=t_muscles,
                   archetype=archetype, frequency=freq, user_key=str(user_key), date=date,
                   swap_count=int(raw.get('swap_count') or 0), notes=notes)
