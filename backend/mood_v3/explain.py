"""Built for Today: deterministic, template-based explanation lines.

SD EXPLANATION CONTRACT ("emit then render"): a line appears only when the input or generator event behind it is present,
so the UI never claims an adaptation that did not happen. No dial values or generator mechanics are exposed.
Style lint (SD / V3 spec): never 'easier', 'reduced' or 'lower'. Enforced by tests/test_integration.py.

Phase 2.5: "What I told MOOD -> what MOOD changed -> why". Lines are built from the request (States, soreness, Target,
duration, experience, goal / frequency where they actually drive the pick), the resolution (selection source, MOOD's Pick
rotation, reroute, Different Workout) and the generated output (allocation, structure events, finishers, progression).
`today_summary()` gives the header the Details screen shows above the lines. No LLM, no claims without an event.

Phase 2.6: the lines answer "what did MOOD do differently because of me?", not "what did I press?". Pure confirmations
("You picked Hybrid", "You chose Chest") are gone.

Phase 2.6 addendum (founder): Built for Today appears on every workout and uses every input MOOD has. Each line carries a
`kind`, and lines are ordered by it:
  adaptation  an input actually changed the output (State dials, soreness, Difficulty rules that bit, equipment, 30 min,
              progression, Different Workout)
  decision    a concrete choice MOOD made (allocation, structure, volume, intensity, why this session type)
  context     true information that explains fit without claiming it changed a prescription (profile goal where it
              really drives the rotation or support, difficulty limits that applied, training history)
Confirmations ("You picked Hybrid") are never emitted on their own. Goal never claims rep-range effects the generator
does not have. Up to MAX_LINES lines.
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


KIND_RANK = {'adaptation': 0, 'decision': 1, 'context': 2}
CODE_KIND = {
    'sore_reroute': 'adaptation', 'sore': 'adaptation', 'sore_override': 'adaptation', 'rotation_swap': 'adaptation', 'state_pair': 'adaptation',
    'duration': 'adaptation', 'duration_pair': 'adaptation', 'equipment': 'adaptation', 'progression': 'adaptation', 'swap': 'adaptation',
    'different_workout': 'adaptation', 'structure_beginner': 'adaptation',
    'allocation': 'decision', 'target': 'decision', 'rotation': 'decision', 'frequency': 'decision', 'structure': 'decision',
    'volume': 'decision', 'intensity': 'decision', 'support': 'decision',
    'goal': 'context', 'history': 'context', 'carryover': 'context', 'preference': 'context',
}
LEVEL = {'beginner': 'Beginner', 'intermediate': 'Intermediate', 'advanced': 'Advanced'}
GOAL_TEXT = {'build_strength': 'build strength', 'build_muscle': 'build muscle', 'improve_athleticism': 'improve athleticism',
             'lose_weight_conditioning': 'lose weight and build conditioning', 'feel_better_reduce_stress': 'feel better and manage stress',
             'stay_consistent': 'stay consistent'}
FREQ_TEXT = {'1-2': '1 to 2', '3-4': '3 to 4', '5+': '5 or more'}
PREF_DIRECTION = {'lifting': 'strength', 'strength': 'strength', 'lifting_strength': 'strength', 'conditioning': 'sweat', 'hiit': 'sweat',
                  'hiit_conditioning': 'sweat', 'sweat': 'sweat', 'athletic': 'athletic', 'athletic_training': 'athletic'}


def _kind(code):
    return 'adaptation' if code.startswith('state_') else CODE_KIND.get(code, 'context')


def build_lines(ctx, res, history_records):
    lines = []
    def add(code, text, kind=None):
        if text and all(l['code'] != code for l in lines): lines.append(dict(code=code, text=text, kind=kind or _kind(code)))
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

    # 3. States: the concrete change first, the general intent when nothing structural fired
    st = [s for s in ctx.states if s != 'sore']
    fin = next((b for b in res.get('blocks', []) if b.get('type') == 'finisher' or b.get('structure') == 'finisher'), None)
    fin_names = _join(it['exercise']['name'] for it in fin['items']) if fin else None
    art = lambda w: 'an' if (w or '')[:1].lower() in 'aeiou' else 'a'
    specific = {}
    if d == 'strength':
        vol = next(iter(_log(res, 'dial_volume')), None)
        eff = 'dial_effort' in codes
        if 'amped' in st and fin:
            specific['amped'] = f"You're Amped, so {art(fin_names)} {fin_names} burnout finishes the session" + (" and working sets go a rep closer to failure." if eff else '.')
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
        specific[s0] = f"You're {STATE_NAMES[s0]}, so {art(fin_names)} {fin_names} finisher closes the session."
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
    if ctx.preset != 'commercial_gym':
        add('equipment', 'Built around the equipment you have.')

    # 5. history that actually changed something
    prog = next((it for it in items if (it.get('progression') or {}).get('text')), None)
    if prog:
        add('progression', f"Your last {prog['exercise']['name']} session sets today's target.")
    if 'exercise_swapped' in codes:
        add('swap', 'Swapped in a fresh option for that slot, same purpose.')

    # 6. what MOOD built, the Difficulty rules that applied, and the profile / history context behind it
    _decision_lines(ctx, res, items, add, arch)
    _difficulty_lines(ctx, res, items, codes, add)
    _context_lines(ctx, res, items, history_records, source, add, arch)

    lines.sort(key=lambda l: KIND_RANK[l['kind']])      # stable: adaptation, then decision, then context
    return lines[:MAX_LINES]


MAX_LINES = 6


def _rx(it):
    return it['prescription']


def _decision_lines(ctx, res, items, add, arch):
    d = ctx.direction; blocks = res.get('blocks', [])
    if not blocks or not items: return
    if d == 'strength':
        main = blocks[0]['items'][0]
        sec = sum(len(b['items']) for b in blocks if b.get('type') == 'secondary')
        acc = sum(len(b['items']) for b in blocks if b.get('type') == 'accessory')
        grouped = next((b['structure'] for b in blocks if b.get('structure') in ('superset', 'circuit', 'pyramid', 'ladder')), None)
        if res['archetype'] == 'strength_custom_target':
            if len(res.get('target_muscles') or ctx.target_muscles or []) <= 1:
                m = target_label(res.get('target_muscles') or ctx.target_muscles or [])
                add('structure', f"All {len(items)} movements train {m.lower()}, opening with {main['exercise']['name']} ({_rx(main)['display']}).")
        else:
            parts = [f"{main['exercise']['name']} ({_rx(main)['display']}) leads as the main lift"]
            rest = []
            if sec: rest.append(f"{sec} strength lift{'s' if sec != 1 else ''}")
            if acc: rest.append(f"{acc} accessor{'ies' if acc != 1 else 'y'}")
            txt = parts[0] + (', then ' + _join(rest) if rest else '') + (f", with part of it run as a {grouped}" if grouped else '') + '.'
            add('structure', txt)
        sets = sum((_rx(it).get('sets') or 0) for it in items)
        add('volume', f"{sets} working sets across {len(items)} exercises, about {int(round(res['estimated_minutes']))} minutes.")
        rir_main = _rx(main).get('rir')
        acc_rirs = sorted({_rx(it).get('rir') for b in blocks if b.get('type') in ('accessory', 'target') for it in b['items'] if _rx(it).get('rir') is not None})
        if rir_main is not None:
            def short(r): return 'at failure' if r == 0 else f"about {r} rep{'s' if r != 1 else ''} short of failure"
            tail = f", accessories {short(acc_rirs[0])}" if acc_rirs and acc_rirs[0] != rir_main and res['archetype'] != 'strength_custom_target' else ''
            add('intensity', f"Main work stops {short(rir_main)}{tail}.")
    elif d == 'sweat':
        prim = blocks[0]; s = prim.get('structure'); its = prim['items']; iv = prim.get('interval') or {}
        if s == 'anchor_circuit':
            a = its[0]
            rot = any(isinstance(_rx(x).get('direction_fields', {}).get('rounds'), list) and len(_rx(x)['direction_fields']['rounds']) < (prim.get('rounds') or 0) for x in its[1:])
            add('structure', f"{a['exercise']['name']} {_rx(a)['display']} anchors all {prim['rounds']} rounds, " +
                (f"with a different station each round ({len(its) - 1} stations)." if rot else f"followed by {len(its) - 1} stations every round."))
        elif s == 'circuit':
            add('structure', f"{prim['rounds']} rounds of {len(its)} stations: {_join(x['exercise']['name'] for x in its)}.")
        elif s == 'emom':
            add('structure', f"EMOM for {iv.get('minutes')} min, one station per minute: {_join(x['exercise']['name'] for x in its)}.")
        elif s in ('timed_circuit', 'intervals', 'finisher') and iv.get('work_sec'):
            add('structure', f"{iv.get('rounds')} rounds of {iv['work_sec']} s work / {iv.get('recovery_sec', 0)} s easy on {_join(x['exercise']['name'] for x in its)}.")
        elif s == 'continuous':
            add('structure', f"{_rx(its[0])['display']} on the {its[0]['exercise']['name']} as one continuous effort.")
        extra = [b for b in blocks[1:]]
        mins = int(round(res['estimated_minutes']))
        if extra:
            add('volume', f"Plus a short {_join((b['title'] or b['structure']).lower() for b in extra)} block, about {mins} minutes in all.")
        else:
            add('volume', f"One block, about {mins} minutes in all.")
        rpe = (prim.get('effort') or {}).get('rpe')
        if rpe: add('intensity', f"Target effort for the main block is RPE {rpe[0]}–{rpe[1]}." if rpe[0] != rpe[1] else f"Target effort for the main block is RPE {rpe[0]}.")
    elif d == 'athletic':
        exp = [b for b in blocks if b.get('structure') == 'exposure']
        if exp:
            px = exp[0]['items'][0]
            others = [b['items'][0]['exercise']['name'] for b in exp[1:]]
            add('structure', f"{px['exercise']['name']} comes first, while you're fresh" + (f", then {_join(others)}." if others else '.'))
        rep_b = next((b for b in blocks if b.get('structure') == 'repeats'), None)
        if rep_b: add('volume', f"{rep_b['items'][0]['exercise']['name']} repeat efforts ({_rx(rep_b['items'][0])['display']}) close out the speed work.")
        add('intensity', 'Each set ends when speed, height or control drops, so every rep is a quality rep.')
        sup = next((b for b in blocks if b.get('type') == 'support'), None)
        if sup:
            it = sup['items'][0]; why = (_rx(it).get('direction_fields') or {}).get('why')
            if why: add('support', f"{it['exercise']['name']} is Performance Support: {why}.")


def _lib(d):
    try:
        if d == 'strength':
            from .engines.strength import audit_engine as AE; return AE.EX
        if d == 'athletic':
            from .engines.athletic import adapter as AA; return AA.EX
    except Exception:
        return {}
    return {}


def _difficulty_lines(ctx, res, items, codes, add):
    """Difficulty = the session `experience`. Only the rules that really exist in the engines are described."""
    lv = ctx.experience; L = LEVEL.get(lv, lv); d = ctx.direction
    if 'structure_adjusted' in codes and lv == 'beginner' and any('beginner' in str(l.get('detail', '')) for l in res.get('log', []) if isinstance(l, dict)):
        add('structure_beginner', 'Beginner difficulty swapped the circuit for a superset and pyramid, which are simpler to run.')
    lib = _lib(d)
    exs = [lib.get(it['exercise']['id']) for it in items]
    exs = [e for e in exs if e]
    names = lambda es: _join(list(dict.fromkeys(e['name'] for e in es))[:2])
    if d == 'strength' and exs:
        if lv == 'beginner' and all(e.get('skill') == 'beginner' for e in exs):
            add('difficulty', f"Beginner difficulty applies MOOD's beginner exercise rules: all {len(exs)} movements are beginner-rated and technically approachable.", 'adaptation')
        elif lv == 'advanced':
            un = [e for e in exs if e.get('skill') == 'advanced' or (e.get('cx') or 0) > 3]
            if un: add('difficulty', f"Advanced difficulty unlocked {names(un)}, which MOOD holds back below Advanced.", 'adaptation')
            else: add('difficulty', 'Advanced difficulty keeps the full exercise range open; today the best fits sit within it without needing the most complex options.', 'context')
        elif lv == 'intermediate':
            add('difficulty', 'Intermediate difficulty: every movement is within the intermediate complexity and skill limits.', 'context')
    elif d == 'athletic' and exs:
        if lv == 'beginner':
            add('difficulty', "Beginner difficulty applies MOOD's athletic safety rules: no high-impact landings or advanced drills, a smaller landing budget, precision-first reps and no repeat-effort block.", 'adaptation')
        elif lv == 'advanced':
            un = [e for e in exs if e.get('impact') == 'high' or e.get('skill') == 'advanced' or (e.get('cx') or 0) > 3]
            if un: add('difficulty', f"Advanced difficulty keeps higher-complexity power movements available: today includes {names(un)}.", 'adaptation')
            else: add('difficulty', 'Advanced difficulty allows high-impact work and the largest landing budget; today stays within moderate impact.', 'context')
        else:
            add('difficulty', 'Intermediate difficulty allows full-intent power work but keeps high-impact landings for Advanced.', 'context')
    elif d == 'sweat':
        prim = (res.get('blocks') or [None])[0]
        if not prim: return
        iv = prim.get('interval') or {}; s = prim.get('structure')
        if s in ('timed_circuit', 'intervals') and iv.get('work_sec'):
            add('difficulty', f"{L} dosing: {iv['work_sec']} s work and {iv.get('recovery_sec', 0)} s rest per station.", 'adaptation')
        elif s == 'anchor_circuit' and prim.get('rest_between_rounds_sec'):
            add('difficulty', f"{L} dosing: the anchor distance, station targets and {prim['rest_between_rounds_sec']} s between rounds are set for your level.", 'adaptation')
        elif s == 'circuit' and prim.get('rest_between_rounds_sec'):
            add('difficulty', f"{L} dosing: station targets and {prim['rest_between_rounds_sec']} s between rounds are set for your level.", 'adaptation')
        elif s == 'continuous' and lv == 'beginner':
            add('difficulty', 'Beginner difficulty caps the steady effort at 20 minutes.', 'adaptation')
        else:
            add('difficulty', f"{L} dosing: station targets are set for your level.", 'adaptation')


def _context_lines(ctx, res, items, history_records, source, add, arch):
    d = ctx.direction
    goal = GOAL_TEXT.get(ctx.goal)
    if d == 'strength' and source == 'moods_pick' and goal:
        from .engines.strength import adapter as SA
        if ctx.frequency == '1-2':
            pass                                        # the 'frequency' decision line already says it
        elif ctx.goal in SA.GOAL_ROTATION:
            add('goal', f"MOOD's Pick follows the rotation built for your goal to {goal}, at {FREQ_TEXT.get(ctx.frequency, ctx.frequency)} days a week.")
        else:
            add('goal', f"MOOD's Pick follows its standard rotation for {FREQ_TEXT.get(ctx.frequency, ctx.frequency)} Strength days a week.")
    elif d == 'sweat' and source == 'moods_pick' and goal:
        add('goal', f"MOOD's Pick orders Circuit, Engine and Hybrid for your goal to {goal}.")
    elif d == 'athletic' and ctx.goal in ('build_strength', 'build_muscle') and any(b.get('type') == 'support' for b in res.get('blocks', [])):
        add('goal', f"Because your goal is to {goal}, Athletic sessions always include Performance Support.")
    elif goal:
        add('goal', f"Your profile goal is to {goal}; today's {DIRECTION_NAMES[d]} session is built from today's choices.")
    same = [h for h in history_records if h.get('direction') == d]
    if not history_records:
        add('history', 'This is your first MOOD workout, so it starts from your Training Profile.')
    elif not same:
        add('history', f"Your first {DIRECTION_NAMES[d]} session in MOOD.")
    else:
        prev = same[-1]; kept = [it['exercise']['name'] for it in items if it['exercise']['id'] in set(prev.get('exercise_ids') or [])]
        new = len(items) - len(kept)
        pa = ARCHETYPE_NAMES.get(prev.get('archetype'), prev.get('archetype'))
        if kept:
            add('carryover', f"From your last {DIRECTION_NAMES[d]} session ({pa}) MOOD kept {_join(kept[:2])}" + (f" and brought in {new} new movement{'s' if new != 1 else ''}." if new else '.'))
        else:
            add('carryover', f"None of today's movements repeat your last {DIRECTION_NAMES[d]} session ({pa}).")
        add('history', f"{DIRECTION_NAMES[d]} session {len(same) + 1} in MOOD.")
    if PREF_DIRECTION.get((getattr(ctx, 'preference', '') or '').lower()) == d:
        add('preference', f"{DIRECTION_NAMES[d]} is your preferred way to train.")
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
