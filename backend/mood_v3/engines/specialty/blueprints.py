"""MOOD V3 Specialty programming blueprints: the 4 workout flavors and 18 preset definitions.

Per the locked scope (MOOD V3 -- Specialty Workout Presets): structure first, exercises second. Every flavor here is
a sequencing template -- block count/order, structure type, rest rules, and what ROLE each slot needs -- not a list
of exercises. The adapter fills blueprint slots by role/equipment/target match; it never starts from exercises and
retrofits a structure around them.

Structure vocabulary is the SAME one the frozen Strength engine's output schema already supports (CONTRACT.md):
straight, superset, circuit, pyramid, ladder, finisher. Nothing new is added to that vocabulary.
"""
from __future__ import annotations

# ------------------------------------------------------------------ equipment profiles (scope doc: Equipment assumptions)
EQUIPMENT_PROFILES = {
    'dumbbells':    dict(label='Dumbbells',     eq={'dumbbells', 'bench'}),
    'kettlebell':   dict(label='Kettlebells',   eq={'kettlebell', 'bench'}),
    'landmine':     dict(label='Landmine',      eq={'landmine', 'barbell', 'bench'}),
    'barbell':      dict(label='Barbell',       eq={'barbell', 'bench', 'rack'}),
    'bodyweight':   dict(label='Bodyweight',    eq={'bodyweight', 'bench'}),             # no pull-up bar
    'outdoor_park': dict(label='Outdoor/Park',  eq={'bodyweight', 'bench', 'pullup_bar'}),
}

# ------------------------------------------------------------------ flavors (programming blueprints, not generators)
# Each flavor is a list of block specs. A block spec:
#   type         Strength block.type vocabulary: main, secondary, target, accessory, finisher
#   structure    straight | superset | circuit | pyramid | ladder | finisher
#   slots        list of role hints the adapter fills in order: 'anchor' | 'primary' | 'secondary' (role match is a
#                preference, not a hard filter -- the adapter falls back to any eligible exercise if the pool is thin)
#   rounds / rest_between_items_sec / rest_between_rounds_sec: dosing per the flavor's identity (scope doc: Architecture)
#   zero_rest_within_chain: Complex/Flow signature -- no rest between chained items in a round
FLAVORS = {
    'strength': dict(
        name='Strength', label='Traditional strength',
        blocks=[
            dict(type='main', structure='straight', slots=['anchor', 'primary'], sets=4, rest_between_items_sec=150),
            dict(type='secondary', structure='straight', slots=['primary', 'secondary'], sets=3, rest_between_items_sec=120),
            dict(type='accessory', structure='superset', slots=['secondary', 'secondary'], rounds=3,
                 rest_between_items_sec=20, rest_between_rounds_sec=75),
        ],
    ),
    'complex_flow': dict(
        name='Complex/Flow', label='Chained movements, continuous within a round',
        zero_rest_within_chain=True,
        blocks=[
            dict(type='main', structure='straight', slots=['anchor'], sets=3, rest_between_items_sec=150,
                 anchor_only=True),  # only used when an anchor-exclusive exercise (e.g. Man Maker) is selected
            dict(type='main', structure='circuit', slots=['primary', 'primary', 'secondary'], rounds=6,
                 rest_between_items_sec=0, rest_between_rounds_sec=90, chain=True),
            dict(type='accessory', structure='straight', slots=['secondary', 'secondary'], sets=3, rest_between_items_sec=60),
        ],
    ),
    'circuit_density': dict(
        name='Circuit/Density', label='Stations, short rest, higher reps',
        blocks=[
            dict(type='main', structure='circuit', slots=['primary', 'primary', 'secondary', 'secondary'], rounds=6,
                 rest_between_items_sec=15, rest_between_rounds_sec=60),
            dict(type='finisher', structure='finisher', slots=['secondary', 'secondary'], rounds=4, rest_between_items_sec=0,
                 rest_between_rounds_sec=45),
        ],
    ),
    'power_athletic': dict(
        name='Power/Athletic', label='Explosive intent, low fatigue accumulation, full recovery',
        blocks=[
            dict(type='main', structure='straight', slots=['anchor', 'primary'], sets=5, reps='3', rest_between_items_sec=150,
                 low_rep=True),
            dict(type='secondary', structure='straight', slots=['primary', 'secondary'], sets=3, rest_between_items_sec=120),
            dict(type='accessory', structure='superset', slots=['secondary', 'secondary'], rounds=2,
                 rest_between_items_sec=20, rest_between_rounds_sec=75),
        ],
    ),
}

# Per-flavor dosing-parameter layer (scope doc: "Dosing follows the flavor, not generic Strength defaults"). This is
# the one small net-new build surface beyond pure reuse -- a parameter table, not a logic rewrite.
FLAVOR_DOSING = {
    'strength':        dict(rir=2, rest_style='full_recovery'),
    'complex_flow':    dict(rir=1, rest_style='between_rounds_only'),
    'circuit_density':  dict(rir=0, rest_style='short_repeatable'),
    'power_athletic':  dict(rir=3, rest_style='full_recovery_explosive'),
}

# ------------------------------------------------------------------ the 18 presets
# id -> equipment profile, body target (full/upper/lower), default flavor, eligible secondary flavors (in the order
# the scope doc lists them -- a generation picks exactly one flavor from [default] + secondaries).
PRESETS = {
    # -- Barbell --
    'barbell_full':   dict(equipment='barbell', target='full',  default='power_athletic', secondary=['strength', 'complex_flow']),
    'barbell_upper':  dict(equipment='barbell', target='upper', default='strength',        secondary=['power_athletic']),
    'barbell_lower':  dict(equipment='barbell', target='lower', default='strength',        secondary=['power_athletic']),
    # -- Kettlebell --
    'kettlebell_full':  dict(equipment='kettlebell', target='full',  default='complex_flow', secondary=['power_athletic', 'strength', 'circuit_density']),
    'kettlebell_upper': dict(equipment='kettlebell', target='upper', default='strength',      secondary=['complex_flow', 'circuit_density']),
    'kettlebell_lower': dict(equipment='kettlebell', target='lower', default='strength',      secondary=['circuit_density', 'complex_flow']),
    # -- Dumbbells --
    'dumbbells_full':  dict(equipment='dumbbells', target='full',  default='complex_flow', secondary=['power_athletic', 'strength', 'circuit_density']),
    'dumbbells_upper': dict(equipment='dumbbells', target='upper', default='strength',      secondary=['complex_flow', 'circuit_density']),
    'dumbbells_lower': dict(equipment='dumbbells', target='lower', default='strength',      secondary=['circuit_density']),
    # -- Landmine --
    'landmine_full':  dict(equipment='landmine', target='full',  default='complex_flow', secondary=['strength', 'power_athletic']),
    'landmine_upper': dict(equipment='landmine', target='upper', default='strength',      secondary=['complex_flow']),
    'landmine_lower': dict(equipment='landmine', target='lower', default='strength',      secondary=['complex_flow']),
    # -- Bodyweight (no pull-up bar) --
    'bodyweight_full':  dict(equipment='bodyweight', target='full',  default='circuit_density', secondary=['complex_flow', 'power_athletic']),
    'bodyweight_upper': dict(equipment='bodyweight', target='upper', default='circuit_density', secondary=['strength']),
    'bodyweight_lower': dict(equipment='bodyweight', target='lower', default='circuit_density', secondary=['strength', 'complex_flow']),
    # -- Outdoor/Park (has pull-up bar, bench, open space) --
    'park_full':  dict(equipment='outdoor_park', target='full',  default='power_athletic', secondary=['circuit_density', 'complex_flow']),
    'park_upper': dict(equipment='outdoor_park', target='upper', default='strength',        secondary=['circuit_density']),
    'park_lower': dict(equipment='outdoor_park', target='lower', default='circuit_density',  secondary=['strength', 'power_athletic']),
}

PRESET_NAMES = {
    'barbell_full': 'Full Body Barbell', 'barbell_upper': 'Barbell Upper Body', 'barbell_lower': 'Barbell Leg Day',
    'kettlebell_full': 'Full Body Kettlebells', 'kettlebell_upper': 'Kettlebell Upper Body', 'kettlebell_lower': 'Kettlebell Leg Day',
    'dumbbells_full': 'Full Body Dumbbells', 'dumbbells_upper': 'Dumbbell Upper Body', 'dumbbells_lower': 'Dumbbell Leg Day',
    'landmine_full': 'Full Body Landmine', 'landmine_upper': 'Landmine Upper Body', 'landmine_lower': 'Landmine Leg Day',
    'bodyweight_full': 'Full Body Bodyweight', 'bodyweight_upper': 'Bodyweight Upper Body', 'bodyweight_lower': 'Bodyweight Leg Day',
    'park_full': 'Park Full Body', 'park_upper': 'Park Upper Body', 'park_lower': 'Park Leg Day',
}

assert len(PRESETS) == 18, f'expected 18 presets, got {len(PRESETS)}'


def eligible_flavors(preset_id):
    p = PRESETS[preset_id]
    return [p['default']] + list(p['secondary'])


def flavors_for_duration(duration):
    """30/60 are the only V3 durations (CONTRACT.md); 30 trims to fewer rounds/sets, handled by the adapter's dosing scale."""
    return 0.5 if duration == 30 else 1.0
