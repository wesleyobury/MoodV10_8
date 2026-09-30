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
