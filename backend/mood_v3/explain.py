"""Built for Today: deterministic, template-based explanation lines.

SD EXPLANATION CONTRACT ("emit then render"): a line appears only when the input or generator event behind it is present,
so the UI never claims an adaptation that did not happen. No dial values or generator mechanics are exposed.
Style lint (SD / V3 spec): never 'easier', 'reduced' or 'lower'. Enforced by tests/test_integration.py.

Phase 2.5: "What I told MOOD -> what MOOD changed -> why". Lines are built from the request (States, soreness, Target,
duration, experience, goal / frequency where they actually drive the pick), the resolution (selection source, MOOD's Pick
rotation, reroute, Different Workout) and the generated output (allocation, structure events, finishers, progression).
`today_summary()` gives the header the Details screen shows above the lines. No LLM, no claims without an event.

Phase 2.6: the lines answer "what did MOOD do differently because of me?", not "what did I press?". Pure confirmations
("You picked Hybrid", "You chose Chest") are gone, at most 4 lines are kept, and `teaser()` picks the one adaptation the
Preview shows (or nothing when there is nothing meaningful to say).
"""
from __future__ import annotations
from .formatter import ARCHETYPE_NAMES, REGION_NAMES, MUSCLE_NAMES, DIRECTION_NAMES, target_label

STATE_LINES = {
    'low_energy': 'Stable, low-friction movements keep the session productive without adding unnecessary systemic fatigue.',
    'bored': 'MOOD pushed exercise and structure variety today instead of repeating your usual patterns.',
    'irritated': 'Simple, forceful movements give that energy somewhere productive to go.',
    'amped': 'Your extra energy goes into higher training intent where it fits.',
    'stressed': "Today's work stays rhythmic and predictable without forcing you to race the clock.",
}
DIRECTION_STATE_LINES = {   # Direction-true variants where the generic line would overclaim
    ('athletic', 'amped'): 'Extra output goes into more quality efforts, never at the cost of speed.',
    ('athletic', 'low_energy'): 'Simple, low-impact explosive work keeps the quality high without burying you.',
    ('sweat', 'amped'): 'Extra output goes into denser, harder conditioning where it fits.',
    ('sweat', 'irritated'): 'Forceful stations give that energy somewhere productive to go.',
}
PAIR_LINES = {   # SD MULTI-STATE ARBITRATION named combinations
    frozenset({'bored', 'stressed'}): 'Fresh movements inside a simple, steady structure: something new without the chaos.',
    frozenset({'low_energy', 'amped'}): 'Fewer pieces, more intent: the main work gets your extra drive.',
    frozenset({'irritated', 'low_energy'}): 'Simple, forceful work without a big systemic cost.',
    frozenset({'irritated', 'stressed'}): 'Forceful but predictable: hard efforts with clear recovery.',
    frozenset({'bored', 'amped'}): 'New shapes plus one extra push where it fits.',
}
FORCEFUL = ('sled', 'carry', 'slam', 'battle rope', 'push press', 'wall ball')   # Sweat Irritated line names what is really there
STATE_NAMES = {'low_energy': 'Low Energy', 'bored': 'Bored', 'irritated': 'Irritated', 'amped': 'Amped', 'stressed': 'Stressed', 'sore': 'Sore'}
GOAL_PHRASES = {'build_strength': 'build strength', 'build_muscle': 'build muscle', 'improve_athleticism': 'improve athleticism'}
BANNED = ('easier', 'reduced', 'lower')


def _regions(ctx):
    names = []
    for r in ctx.sore_regions:
        n = REGION_NAMES.get(r, r.replace('_', ' '))
        if n not in names: names.append(n)
    return _join(names)


def _join(names):
    names = list(names)
    if len(names) <= 2: return ' and '.join(names)
    return ', '.join(names[:-1]) + ' and ' + names[-1]


def _log(res, code):
    return [l for l in res.get('log', []) if isinstance(l, dict) and l.get('reason_code') == code]


def _items(res):
    return [it for b in res.get('blocks', []) for it in b['items']]


def _custom_lines(ctx, res, add):
    """Multi-muscle Custom Target: how the work was split (a single muscle needs no line: the title already says it)."""
    ct = next(iter(_log(res, 'custom_target')), None)
    if not ct or not ct.get('allocation'): return
    alloc = ct['allocation']; order = ct.get('block_order') or list(alloc)
    if len(order) < 2: return
    names = {m: MUSCLE_NAMES.get(m, m) for m in order}
    n = lambda m: f"{alloc[m]['exercises']} movement" + ('s' if alloc[m]['exercises'] != 1 else '')
    counts = [alloc[m]['exercises'] for m in order]
    core_tail = ', with Core saved for the end' if 'core' in order and order[-1] == 'core' else ''
    if len(set(counts)) == 1:
        add('allocation', f"{_join(names[m] for m in order)} get {n(order[0])} each{core_tail}.")
    else:
        lead, rest = order[0], order[1:]
        add('allocation', f"{names[lead]} gets {n(lead)} while {_join(names[m] + ' gets ' + str(alloc[m]['exercises']) for m in rest)}{core_tail}.")


def build_lines(ctx, res, history_records):
    lines = []
    def add(code, text):
        if text and all(l['code'] != code for l in lines): lines.append(dict(code=code, text=text))
    d = ctx.direction; arch = ARCHETYPE_NAMES.get(res['archetype'], res['archetype'])
    source = res.get('selection_source') or ('target' if ctx.target_mode != 'moods_pick' else ('user_selected' if ctx.archetype else 'moods_pick'))
    log = res.get('log', [])
    codes = {l.get('reason_code') for l in log if isinstance(l, dict)}
    items = _items(res)

    # 1. soreness / reroute (hard constraint first)
    if ctx.sore_regions:
        if res.get('rerouted'):
            are = 'is' if len(ctx.sore_regions) == 1 and not _regions(ctx).endswith('s') else 'are'
            add('sore_reroute', f"Your {_regions(ctx)} {are} sore, so today was rerouted to {arch}, away from that loading.")
        elif res.get('sore_override'):
            add('sore_override', f"{target_label(ctx.target_muscles or res.get('target_muscles') or [])} is trained as planned despite the soreness, because you asked for it.")
        else:
            add('sore', "Today's workout shifts stress away from your sore " + _regions(ctx) + '.')

    # 2. why this session type
    rot = next(iter(_log(res, 'moods_pick_rotated')), None)
    if rot:
        add('rotation_swap', f"MOOD moved you from {ARCHETYPE_NAMES.get(rot['from'], rot['from'])} to {arch} so this actually feels like a different session.")
    elif source == 'target':
        if res['archetype'] == 'strength_custom_target':
            _custom_lines(ctx, res, add)
        elif ctx.target_mode != 'full_body':
            tl = target_label(ctx.target_muscles or res.get('target_muscles'))
            if d == 'strength' and len(ctx.target_muscles or []) > 1:
                art = 'an' if arch[:1].lower() in 'aeiou' else 'a'
                add('target', f"{tl} run as {art} {arch} session, so both get direct work.")
            elif d == 'sweat' and res['archetype'] == 'sweat_circuit':
                add('target', f"The circuit stations are weighted toward {tl.lower()}.")
    elif source == 'moods_pick' and not res.get('rerouted'):
        last = [h for h in history_records if h.get('direction') == d]
        if d == 'strength' and last:
            prev = ARCHETYPE_NAMES.get(last[-1]['archetype'], last[-1]['archetype'])
            if last[-1]['archetype'] != res['archetype']: add('rotation', f"You trained {prev} last time, so MOOD's Pick rotates to {arch} today.")
        if d == 'strength':
            if ctx.frequency == '1-2' and res['archetype'] == 'strength_full_body':
                add('frequency', 'You train 1–2 days a week, so MOOD keeps every Strength session full-body.')
            elif ctx.frequency == '5+' and res['archetype'] in ('strength_lower_hinge', 'strength_arms'):
                add('frequency', f"Training 5+ days a week adds dedicated {arch} days to your rotation.")
            elif not last and ctx.goal in GOAL_PHRASES:
                add('goal', f"MOOD's Pick follows a rotation built for your goal to {GOAL_PHRASES[ctx.goal]}.")

    # 3. States: the concrete change first, the general intent when nothing structural fired
    st = [s for s in ctx.states if s != 'sore']
    fin = next((b for b in res.get('blocks', []) if b.get('type') == 'finisher' or b.get('structure') == 'finisher'), None)
    fin_names = _join(it['exercise']['name'] for it in fin['items']) if fin else None
    specific = {}
    if d == 'strength':
        vol = next(iter(_log(res, 'dial_volume')), None)
        eff = 'dial_effort' in codes
        if 'amped' in st and fin:
            specific['amped'] = f"You're Amped, so a {fin_names} burnout finishes the session" + (" and working sets go a rep closer to failure." if eff else '.')
        elif 'amped' in st and eff:
            specific['amped'] = "You're Amped, so working sets go a rep closer to failure."
        if 'irritated' in st and fin:
            specific['irritated'] = f"You're Irritated, so a forceful {fin_names} finishes the session."
        if 'low_energy' in st and vol and vol.get('value') == -1:
            specific['low_energy'] = 'Low Energy: one set comes off the last accessory, so the main work keeps its quality.'
        if 'bored' in st and any(b.get('structure') in ('superset', 'pyramid', 'ladder', 'circuit') for b in res.get('blocks', [])):
            shape = next(b['structure'] for b in res['blocks'] if b.get('structure') in ('superset', 'pyramid', 'ladder', 'circuit'))
            specific['bored'] = f"MOOD pushed variety today: part of the session runs as a {shape} instead of your usual straight sets."
    elif d == 'sweat' and fin and any(s in st for s in ('amped', 'irritated')):
        s0 = 'amped' if 'amped' in st else 'irritated'
        specific[s0] = f"You're {STATE_NAMES[s0]}, so a {fin_names} finisher closes the session."
    if d == 'sweat' and 'irritated' in st and 'irritated' not in specific:
        forceful = [it['exercise']['name'] for it in items if any(k in it['exercise']['name'].lower() for k in FORCEFUL)]
        if forceful:
            specific['irritated'] = f"Forceful stations like {_join(list(dict.fromkeys(forceful))[:3]).lower()} give that energy somewhere productive to go."
    pair = next((p for p in PAIR_LINES if p <= set(st)), None)
    if pair and not any(s in specific for s in pair):
        add('state_pair', PAIR_LINES[pair]); st = [s for s in st if s not in pair]
    for s in st:
        add('state_' + s, specific.get(s) or DIRECTION_STATE_LINES.get((d, s), STATE_LINES[s]))

    # 4. what the duration and level changed (only facts from the output)
    if d == 'strength' and ctx.duration == 30:
        sets = sum((it['prescription'].get('sets') or 0) for it in items)
        add('duration', f"30 minutes: {len(items)} exercises and {sets} working sets, with the main work kept.")
    est = res['estimated_minutes']
    if ctx.duration == 60 and est < 40:
        add('duration', f"This session is complete at about {int(round(est))} min. Quality over filler.")
    elif ctx.duration == 30 and res.get('structure', '').startswith('one_accessory_superset'):
        add('duration_pair', '30 minutes: the main lifts stay and accessories are paired to fit.')
    if ctx.experience == 'beginner':
        add('experience', 'Every movement is matched to a beginner level.')
    if ctx.preset != 'commercial_gym':
        add('equipment', 'Built around the equipment you have.')

    # 5. history that actually changed something
    prog = next((it for it in items if (it.get('progression') or {}).get('text')), None)
    if prog:
        add('progression', f"Your last {prog['exercise']['name']} session sets today's target.")
    if 'exercise_swapped' in codes:
        add('swap', 'Swapped in a fresh option for that slot, same purpose.')
    return lines[:MAX_LINES]


MAX_LINES = 4
# Preview teaser: the single adaptation worth reading before starting. Confirmations and context never qualify.
TEASER_ORDER = ('sore_reroute', 'sore', 'sore_override', 'state_pair', 'state_amped', 'state_irritated', 'state_low_energy',
                'state_stressed', 'state_bored', 'allocation', 'target')


def teaser(ctx, res, lines):
    by = {l['code']: l['text'] for l in lines}
    code = next((c for c in TEASER_ORDER if c in by), None)
    if not code: return None
    if code.startswith('sore'):
        title = f"Built around sore {_regions(ctx)}"
    elif code == 'state_pair':
        title = 'Built for how you feel today'
    elif code.startswith('state_'):
        title = f"Built for your {STATE_NAMES[code[6:]]} state"
    else:
        title = f"Built around {target_label(ctx.target_muscles or res.get('target_muscles') or [])}"
    return dict(code=code, title=title, text=by[code])


def today_summary(ctx, res):
    """Header for Built for Today: what the user told MOOD, and what MOOD chose."""
    told = [STATE_NAMES[s] for s in ctx.states if s != 'sore']
    if ctx.sore_regions: told.append('Sore ' + _regions(ctx))
    source = res.get('selection_source') or 'moods_pick'
    if ctx.target_mode == 'explicit': told.append(target_label(ctx.target_muscles))
    elif ctx.target_mode == 'full_body': told.append('Full Body')
    elif ctx.archetype: told.append(ARCHETYPE_NAMES.get(ctx.archetype, ctx.archetype))
    told.append(f'{ctx.duration} min')
    arch = ARCHETYPE_NAMES.get(res['archetype'], res['archetype'])
    if res['archetype'] == 'strength_custom_target':
        chose = f"Custom Strength: {target_label(res.get('target_muscles') or ctx.target_muscles)}"
    else:
        chose = f"{DIRECTION_NAMES[ctx.direction]} · {arch}"
    by = {'moods_pick': "MOOD's Pick", 'user_selected': 'You picked it', 'target': 'Built from your Target'}[source]
    return dict(told=[DIRECTION_NAMES[ctx.direction]] + told, chose=chose, chosen_by=by)


def today_block(ctx, res, lines):
    return dict(today_summary(ctx, res), teaser=teaser(ctx, res, lines))


def lint(text):
    """Banned adaptation words. Proper names (archetype names such as 'Lower Body: Squat', the 'lower back' region) are not claims."""
    t = text.lower()
    for n in list(ARCHETYPE_NAMES.values()) + ['lower back']: t = t.replace(n.lower(), '')
    return [w for w in BANNED if w in t]
