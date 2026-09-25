"""Built for Today: deterministic, template-based explanation lines.

SD EXPLANATION CONTRACT ("emit then render"): a line appears only when the input or generator event behind it is present,
so the UI never claims an adaptation that did not happen. No dial values or generator mechanics are exposed.
Style lint (SD / V3 spec): never 'easier', 'reduced' or 'lower'. Enforced by tests/test_integration.py.
"""
from __future__ import annotations
from .formatter import ARCHETYPE_NAMES, REGION_NAMES, target_label

STATE_LINES = {
    'low_energy': 'Stable, efficient movements keep the session productive without burying you.',
    'bored': "More movement variety and less familiar combinations keep today's workout fresh.",
    'irritated': 'Simple, forceful movements give you somewhere productive to put that energy.',
    'amped': 'Extra output goes into heavier, faster or higher-volume work where it fits.',
    'stressed': 'Predictable movements and a steadier structure keep the workout focused without adding chaos.',
}
DIRECTION_STATE_LINES = {   # Direction-true variants where the generic line would overclaim
    ('athletic', 'amped'): 'Extra output goes into more quality efforts, never at the cost of speed.',
    ('athletic', 'low_energy'): 'Simple, low-impact explosive work keeps the quality high without burying you.',
    ('sweat', 'amped'): 'Extra output goes into denser, harder conditioning where it fits.',
    ('sweat', 'irritated'): 'Cathartic, forceful stations give you somewhere productive to put that energy.',
}
PAIR_LINES = {   # SD MULTI-STATE ARBITRATION named combinations
    frozenset({'bored', 'stressed'}): 'Fresh movements inside a simple, steady structure: something new without the chaos.',
    frozenset({'low_energy', 'amped'}): 'Fewer pieces, more intent: the main work gets your extra drive.',
    frozenset({'irritated', 'low_energy'}): 'Simple, forceful work without a big systemic cost.',
    frozenset({'irritated', 'stressed'}): 'Forceful but predictable: hard efforts with clear recovery.',
    frozenset({'bored', 'amped'}): 'New shapes plus one extra push where it fits.',
}
BANNED = ('easier', 'reduced', 'lower')

def _regions(ctx):
    names = []
    for r in ctx.sore_regions:
        n = REGION_NAMES.get(r, r.replace('_', ' '))
        if n not in names: names.append(n)
    return ' and '.join(names) if len(names) <= 2 else ', '.join(names[:-1]) + ' and ' + names[-1]

def build_lines(ctx, res, history_records):
    lines = []
    def add(code, text):
        if text and all(l['code'] != code for l in lines): lines.append(dict(code=code, text=text))
    d = ctx.direction; arch = ARCHETYPE_NAMES.get(res['archetype'], res['archetype'])
    log = res.get('log', [])
    codes = {l.get('reason_code') for l in log if isinstance(l, dict)}
    # 1. soreness / reroute (hard constraint first)
    if ctx.sore_regions:
        if res.get('rerouted'):
            add('sore_reroute', f"With sore {_regions(ctx)}, today moved to {arch}.")
        elif res.get('sore_override'):
            add('sore_override', f"You chose {target_label(ctx.target_muscles or res.get('target_muscles') or [])}, so it's trained as planned despite the soreness.")
        else:
            add('sore', "Today's workout shifts stress away from your sore " + _regions(ctx) + '.')
    # 2. States (a named pair replaces its two single lines)
    st = [s for s in ctx.states if s != 'sore']
    pair = next((p for p in PAIR_LINES if p <= set(st)), None)
    if pair:
        add('state_pair', PAIR_LINES[pair]); st = [s for s in st if s not in pair]
    for s in st:
        add('state_' + s, DIRECTION_STATE_LINES.get((d, s), STATE_LINES[s]))
    # 3. Target / archetype
    if ctx.target_mode == 'explicit':
        tl = target_label(ctx.target_muscles or res.get('target_muscles'))
        add('target', f"You chose {tl}, so today centers on {tl.lower()}." if res['archetype'] != 'sweat_circuit' else f"You chose {tl}, so the circuit is built around {tl.lower()}.")
    elif ctx.target_mode == 'full_body':
        add('target', 'You chose Full Body, so every region gets work today.')
    elif ctx.archetype:
        add('archetype', f"You picked {arch}.")
    elif not res.get('rerouted'):
        last = [h for h in history_records if h.get('direction') == d]
        if d == 'strength' and last:
            prev = ARCHETYPE_NAMES.get(last[-1]['archetype'], last[-1]['archetype'])
            if last[-1]['archetype'] != res['archetype']: add('rotation', f"You trained {prev} last time, so today is {arch}.")
        elif not last:
            add('first_session', f"Your first {ctx.direction.capitalize()} session starts with {arch}.")
    # 4. equipment / duration (only when they changed something)
    if ctx.preset != 'commercial_gym':
        add('equipment', 'Built around the equipment you have.')
    est = res['estimated_minutes']
    if ctx.duration == 60 and est < 40:
        add('duration', f"This session is complete at about {int(round(est))} min. Quality over filler.")
    elif ctx.duration == 30 and res.get('structure', '').startswith('one_accessory_superset'):
        add('duration', '30 minutes: the main lifts stay and accessories are paired to fit.')
    if 'exercise_swapped' in codes:
        add('swap', 'Swapped in a fresh option for that slot, same purpose.')
    return lines[:5]

def lint(text):
    """Banned adaptation words. Proper names (archetype names such as 'Lower Body: Squat', the 'lower back' region) are not claims."""
    t = text.lower()
    for n in list(ARCHETYPE_NAMES.values()) + ['lower back']: t = t.replace(n.lower(), '')
    return [w for w in BANNED if w in t]
