"""Built for Today, layer 1: the verified story brief.

Reads ONLY the finished workout and what the engines recorded about how they built it (the personalization contract's realized
consequences, the decision log, the final blocks). Turns that into a short list of facts, each one true by construction, ranked
by how much it explains about why THIS workout looks the way it does for THIS person today.

Both writers (the deterministic composer and the optional LLM writer) may only talk about facts in the brief. Nothing here
changes the workout; nothing here is inferred from dial values or guessed.

Fact = dict(id, tag, topic, pri, claims, data, ev)
  tag     what happened (vocabulary shared by all three Directions, so the copy layer stays small)
  topic   used to keep a message from saying the same kind of thing twice
  pri     story priority (State adaptations > Target > goal / Direction > constraints > structure > baseline intent)
  claims  contract keys the fact rests on (audit trail, same shape as the old synthesis)
  data    the specifics a sentence may use (exercise names, regions, before/after)
  ev      one plain-English evidence line (what the LLM writer sees)
"""
from __future__ import annotations
import re

STATE_ORDER = ('low_energy', 'amped', 'irritated', 'stressed', 'bored')
GOAL_WORD = {'build_strength': 'build strength', 'build_muscle': 'build muscle', 'improve_athleticism': 'improve athleticism',
             'lose_weight_conditioning': 'build conditioning', 'feel_better_reduce_stress': 'feel better and manage stress'}


def _join(xs):
    xs = [x for x in xs if x]
    if not xs: return ''
    return xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + ' and ' + xs[-1]


def _nums(s):
    return [float(x) for x in re.findall(r'\d+(?:\.\d+)?', str(s or ''))]


def _ex_name(detail):
    """'Barbell Hip Thrust RIR 2→1' / 'Hack Squat 3→4 sets' / 'left out Leg Extension' -> exercise name."""
    s = str(detail).replace('left out ', '')
    for cut in (' RIR ', ' →', ' rest ', ' × ', ' (', ' out', ' runs', ':'):
        if cut in s: s = s.split(cut)[0]
    return re.sub(r'\s+\d.*$', '', s).strip()


def _clean(name):
    """Contract annotations are not part of an exercise's name ('Dumbbell Floor Press (new vs no-State build)')."""
    return re.sub(r'\s*\((?:new )?vs no-State build\)', '', str(name)).strip()


def _by_kind(entry):
    out = {}
    chunks = entry.get('realized_by_kind') or [[d] for d in entry.get('realized', [])]
    for k, d in zip(entry.get('kinds', []), chunks):
        out.setdefault(k, []).extend(d if isinstance(d, list) else [d])
    return out


class Brief:
    def __init__(self, ctx, workout):
        self.direction = ctx.direction
        self.states = [s for s in ctx.states if s != 'sore']
        self.sore_regions = list(getattr(ctx, 'sore_regions', None) or [])
        self.facts = []
        self.names = []           # every exercise name in the finished workout (the only names copy may use)
        self.arch_name = (workout.get('archetype') or {}).get('name')
        self.level = ctx.experience
        self.goal = ctx.goal
        self.duration = ctx.duration
        self.target_label = None
        self.target_prose = None
        self.mentionable = []     # names that are not in today's workout but may be named as what it replaced
        self.seed = f"{ctx.user_key}|{ctx.date}|{ctx.swap_count}"
        for b in workout.get('blocks', []):
            for it in b['items']:
                n = it['exercise']['name']
                if n not in self.names: self.names.append(n)

    def add(self, tag, topic, pri, claims=(), ev='', **data):
        if any(f['tag'] == tag for f in self.facts): return
        self.facts.append(dict(id=f"f{len(self.facts) + 1}", tag=tag, topic=topic, pri=pri, claims=[list(c) for c in claims], data=data, ev=ev))

    def has(self, tag): return any(f['tag'] == tag for f in self.facts)

    def get(self, tag): return next((f for f in self.facts if f['tag'] == tag), None)

    def ranked(self): return sorted(self.facts, key=lambda f: -f['pri'])

    def to_dict(self):
        return dict(direction=self.direction, states=self.states, sore_regions=self.sore_regions, facts=self.facts, names=self.names,
                    arch_name=self.arch_name, level=self.level, goal=self.goal, duration=self.duration, target_label=self.target_label,
                    target_prose=self.target_prose, mentionable=self.mentionable, seed=self.seed)

    @classmethod
    def from_dict(cls, d):
        B = cls.__new__(cls)
        for k, v in d.items(): setattr(B, k, v)
        return B

    def public(self):
        return dict(direction=self.direction, states=self.states, sore=self.sore_regions, session=self.arch_name, target=self.target_label,
                    level=self.level, goal=self.goal, duration=self.duration, exercises=self.names,
                    facts=[dict(id=f['id'], tag=f['tag'], evidence=f['ev'], priority=f['pri']) for f in self.ranked()])


# ------------------------------------------------------------------ helpers over the finished workout
def _blocks(w, *types): return [b for b in w.get('blocks', []) if not types or b.get('type') in types]


def _region_words(ctx):
    from ..formatter import REGION_NAMES
    regs = list(dict.fromkeys(REGION_NAMES.get(r, r.replace('_', ' ')) for r in (ctx.sore_regions or [])))
    region = _join(regs)
    return region, (region.endswith('s') or ' and ' in region)


# ------------------------------------------------------------------ build
def build(ctx, res, workout, history_records=()):
    B = Brief(ctx, workout)
    P = res.get('personalization') or []
    byin = {}
    for e in P: byin.setdefault(e['input'], []).append(e)
    d = ctx.direction
    if ctx.target_mode == 'explicit' and ctx.target_muscles:
        from ..formatter import target_label, MUSCLE_NAMES
        B.target_label = target_label(ctx.target_muscles)
        B.target_prose = _join([MUSCLE_NAMES.get(m, m).lower() for m in ctx.target_muscles])
    _soreness(B, ctx, res, workout, byin)
    if d == 'strength': _strength(B, ctx, res, workout, byin)
    elif d == 'sweat': _sweat(B, ctx, res, workout, byin)
    elif d == 'athletic': _athletic(B, ctx, res, workout, byin)
    _yielded(B, ctx, res)
    _context(B, ctx, res, workout, byin, history_records)
    for f in B.facts:   # exercises that left today's session may be named as what was removed
        for n in f['data'].get('dropped') or []:
            if n and n not in B.mentionable: B.mentionable.append(n)
    return B


def _yielded(B, ctx, res):
    logs = [l for l in (res.get('log') or []) if isinstance(l, dict)] + [l for l in ((res.get('w') or {}).get('adjustments') or []) if isinstance(l, dict)]
    for l in logs:
        if l.get('reason_code') == 'state_gate_yielded' and l.get('state') in B.states:
            s = l['state']
            if any(c and c[0] == 'state' and c[1] == s for f in B.facts for c in f['claims']): continue
            rule = l.get('rule') or next((c.get('rule') for c in logs if c.get('reason_code') == 'state_conflict_resolved' and (c.get('dropped') or [None])[0] == s), '') or ''
            other = next((x for x in sorted(B.states, key=lambda x: rule.find(x) if x in rule else 99) if x != s and x in rule), None) \
                or ('low_energy' if 'low_energy' in B.states and s != 'low_energy' else next((x for x in B.states if x != s), None))
            B.add('yielded', 'effort', 87, [('state_yielded', s)], f"{s} was asked for, but {other} wins by rule: no extra load or volume today.", state=s, other=other)


ARCH_PROSE = {'Lower Body: Squat': 'squat-focused leg', 'Lower Body: Hinge': 'hinge-focused leg'}


# ------------------------------------------------------------------ soreness (hard constraint, always told first when present)
def _soreness(B, ctx, res, w, byin):
    if not ctx.sore_regions: return
    region, plural = _region_words(ctx)
    arch = B.arch_name
    log = [l for l in res.get('log', []) if isinstance(l, dict)]
    narrowed = next((l for l in log if l.get('reason_code') == 'archetype_narrowed_around_soreness'), None)
    sore_e = next((e for e in byin.get('soreness', []) if e.get('realized')), None)
    realized = (sore_e or {}).get('realized') or []
    c = [('soreness', 'sore')]
    if ctx.direction == 'athletic':
        from ..engines.athletic import athletic_core as AC
        sore = (res.get('w') or {}).get('ctx', {}).get('sore') or set()
        if sore & AC.LOWER:
            B.add('sore_shift_upper', 'sore', 100, c, f"Sore {region}: the power work moves to the upper body; no jumping or sprinting.", region=region, plural=plural)
        elif sore & {'shoulders', 'front_delts'}:
            B.add('sore_shift_lower', 'sore', 100, c, f"Sore {region}: power stays in the lower body; nothing pressed or thrown overhead.", region=region, plural=plural)
        elif 'spinal_erectors' in sore:
            B.add('sore_no_hinge', 'sore', 100, c, f"Sore {region}: no loaded hinges, Olympic lifts or rotational slams.", region=region, plural=plural)
        else:
            B.add('sore_protected', 'sore', 100, c, f"Sore {region}: no exercise loads it directly.", region=region, plural=plural)
        return
    if res.get('sore_override') or any('trained as asked' in r for r in realized):
        B.add('sore_override', 'sore', 100, c, f"Sore {region}, but the user asked to train it, so the Target was kept with friendlier setups.", region=region, plural=plural)
    elif narrowed:
        B.add('sore_narrowed', 'sore', 100, c, f"Sore {region}: the session keeps the {' and '.join(narrowed['kept'])} work and leaves the {' and '.join(narrowed['left_out']) or region} work out.",
              region=region, plural=plural, kept=' and '.join(narrowed['kept']))
    elif res.get('rerouted') or any(str(r).startswith(('rerouted', 'routed')) for r in realized) or (ctx.target_mode == 'moods_pick' and not ctx.archetype):
        B.add('sore_reroute', 'sore', 100, c, f"Sore {region}: today's session was chosen to leave it alone ({arch}).", region=region, plural=plural, arch=ARCH_PROSE.get(arch, arch))
    else:
        B.add('sore_protected', 'sore', 100, c, f"Sore {region}: every movement keeps it out of the heavy loading.", region=region, plural=plural)


# ------------------------------------------------------------------ Strength
STRENGTH_SHAPE = {'compound + paired accessories': 'heavy compounds with paired accessories', 'traditional': 'straight sets', 'top set + back-off': 'a top set with back-off sets',
                  'heavy primary': 'a heavy main lift', 'pyramid': 'a pyramid', 'volume': 'higher-volume sets', 'paired': 'paired sets'}


def _plain_variant(name):
    return STRENGTH_SHAPE.get(name.strip().lower(), name.strip().lower())


def _all_supported(w, names):
    """True only when every named exercise is rated as supported / stable in the Strength library (so 'stable' is never a guess)."""
    try:
        from ..engines.strength.core import EX
    except Exception:
        return False
    ids = {it['exercise']['name']: it['exercise']['id'] for b in w.get('blocks', []) for it in b['items']}
    got = [EX.get(ids.get(n)) for n in names]
    return bool(got) and all(e and e.get('sup') not in (None, 'unsupported') for e in got)


def _strength(B, ctx, res, w, byin):
    main_b = next(iter(_blocks(w, 'main')), None) or (w['blocks'][0] if w.get('blocks') else None)
    prim = main_b['items'][0] if main_b else None
    pn = prim['exercise']['name'] if prim else None
    acc_blocks = _blocks(w, 'accessory', 'target')
    paired = any(b.get('structure') == 'superset' for b in w.get('blocks', []))
    fin_b = next(iter(_blocks(w, 'finisher')), None)
    acc_names = {it['exercise']['name'] for b in _blocks(w, 'accessory', 'target', 'finisher') for it in b['items']}
    for e in byin.get('state', []):
        s = e['value']
        if not e.get('realized'): continue
        k = _by_kind(e); c = [('state', s)]
        if s == 'low_energy':
            if 'rir' in k: B.add('further_from_failure', 'effort', 90, c, f"Low Energy: {'working sets stop' if len(k['rir']) >= 3 else _join(_ex_name(x) for x in k['rir'][:2]) + ' stop' + ('s' if len(k['rir']) == 1 else '')} further from failure.", names=[_ex_name(x) for x in k['rir'][:2]], all=len(k['rir']) >= 3)
            if 'reps' in k: B.add('moderate_loads', 'effort', 84, c, "Low Energy: main lifts use moderate loads in a higher rep range.")
            if 'exercises' in k:
                if _all_supported(w, [_clean(x.split(' → ')[-1]) for x in k['exercises']]):
                    B.add('stable_choices', 'selection', 88, c, "Low Energy: stable, supported, low-friction movements were chosen.", swaps=k['exercises'])
                else:
                    B.add('cheaper_choices', 'selection', 84, c, "Low Energy: some exercises were swapped for ones with a smaller energy cost.", swaps=k['exercises'])
            if {'volume', 'slot_removed', 'complexity_or_systemic_cap'} & set(k):
                out = [_ex_name(x) for x in k.get('slot_removed', []) + k.get('complexity_or_systemic_cap', [])]
                cut = [_ex_name(x) for x in k.get('volume', [])]
                B.add('trimmed_extras', 'volume', 86, c, "Low Energy: some accessory work was cut" + (f" ({_join(out[:1])} left out)." if out else (f" ({_join(cut[:2])} lose a set)." if cut else '.')), dropped=out[:1], cut=cut[:2])
            if 'structure' in k: B.add('straight_sets', 'structure', 70, c, "Low Energy: plain straight sets instead of a fancier scheme.")
            if 'set_method' in k: B.add('slow_eccentric', 'effort', 72, c, f"Low Energy: slow eccentrics on {k['set_method'][0].split(' on ')[-1]} instead of more load.", name=k['set_method'][0].split(' on ')[-1])
        elif s == 'amped':
            st = k.get('structure', [''])[0]
            if st.startswith('Top Set'): B.add('top_set', 'effort', 92, c, f"Amped: {pn} runs as a heavy top set, then back-off sets.", name=pn)
            elif st.startswith('Heavy Primary'): B.add('heavier_main', 'effort', 92, c, f"Amped: the main lift goes heavier.", name=pn)
            if 'rir' in k:
                nm = [_ex_name(x) for x in k['rir'][:2]]; acc = all(x in acc_names for x in nm)
                B.add('closer_to_failure', 'effort', 86 if acc else 90, c, f"Amped: {_join(nm)} taken a rep closer to failure" + (" (accessories)." if acc else '.'), names=nm, acc=acc)
            if 'reps' in k: B.add('heavier_main', 'effort', 89, c, "Amped: main lifts move to the heavy end of their rep range.", name=pn)
            if 'volume' in k: B.add('extra_set', 'volume', 88, c, f"Amped: an extra working set on {_ex_name(k['volume'][0])}.", name=_ex_name(k['volume'][0]))
            if 'set_method' in k: B.add('intensifier', 'novelty', 80, c, f"Amped: {k['set_method'][0]}.", method=k['set_method'][0].split(' on ')[0].split(' on the')[0], name=k['set_method'][0].split(' on ')[-1])
            if 'finisher' in k and fin_b: B.add('finisher', 'structure', 82, c, f"Amped: a finisher ({_join(it['exercise']['name'] for it in fin_b['items'])}) closes the session.", name=fin_b['items'][0]['exercise']['name'])
        elif s == 'irritated':
            st = k.get('structure', [''])[0]
            if st.startswith('Heavy Primary') or 'reps' in k: B.add('heavier_main', 'effort', 90, c, "Irritated: heavy, simple compound work at lower reps.", name=pn)
            if 'tempo' in k: B.add('explosive_intent', 'effort', 86, c, f"Irritated: every rep of {pn} is driven with intent.", name=pn)
            if 'rest' in k: B.add('full_rest', 'rest', 80, c, "Irritated: full rest so the heavy work stays heavy.")
            if 'exercises' in k or 'complexity_or_systemic_cap' in k: B.add('simple_physical', 'selection', 84, c, "Irritated: fiddly, technical movements were swapped for simple physical ones.")
            if 'finisher' in k and fin_b: B.add('finisher', 'structure', 82, c, f"Irritated: a forceful finisher ({fin_b['items'][0]['exercise']['name']}).", name=fin_b['items'][0]['exercise']['name'])
            if 'volume' in k: B.add('trade_volume', 'volume', 78, c, "Irritated: less accessory volume, heavier main work.")
        elif s == 'stressed':
            if 'structure' in k: B.add('straight_sets', 'structure', 88, c, "Stressed: plain straight sets, no pairing or circuits to manage.")
            if 'rest' in k: B.add('unhurried_rest', 'rest', 86, c, "Stressed: a little more rest between sets.")
            if 'slot_removed' in k: B.add('one_less', 'volume', 80, c, f"Stressed: one exercise fewer to set up ({_ex_name(k['slot_removed'][0])} left out).", dropped=[_ex_name(k['slot_removed'][0])])
            if 'exercises' in k and _all_supported(w, [_clean(x.split(' → ')[-1]) for x in k['exercises']]):
                B.add('stable_choices', 'selection', 84, c, "Stressed: supported, stable movements that run on autopilot.")
            if 'complexity_or_systemic_cap' in k: B.add('nothing_technical', 'selection', 82, c, "Stressed: nothing technical.")
            if 'tempo' in k: B.add('controlled_tempo', 'effort', 76, c, "Stressed: controlled, rhythmic reps.")
            if 'rir' in k: B.add('further_from_failure', 'effort', 74, c, "Stressed: effort stays moderate.")
        elif s == 'bored':
            if 'exercises' in k:
                n = len(k['exercises']); new = [_clean(x.split(' → ')[-1]) for x in k['exercises']]
                B.add('fresh_movements', 'novelty', 90, c, f"Bored: {n} less-familiar movement{'s' if n != 1 else ''} brought in ({_join(new[:2])}).", n=n, names=new[:2])
            if 'set_method' in k: B.add('intensifier', 'novelty', 86, c, f"Bored: {k['set_method'][0]} changes how the work feels.", method=k['set_method'][0].split(' on ')[0], name=k['set_method'][0].split(' on ')[-1])
            if 'structure' in k:
                new, _, old = k['structure'][0].partition(' instead of ')
                B.add('shape_change', 'structure', 84, c, f"Bored: the session runs as {new} instead of {old or 'the usual shape'}.", shape=_plain_variant(new), old=_plain_variant(old) if old else None)
            if 'finisher' in k and fin_b: B.add('finisher', 'structure', 80, c, f"Bored: a finisher ({fin_b['items'][0]['exercise']['name']}).", name=fin_b['items'][0]['exercise']['name'])
    # ---- structure / baseline (always true, used most when inputs are sparse)
    if prim:
        reps = _nums(prim['prescription'].get('reps')); rir = prim['prescription'].get('rir')
        heavy = bool(reps) and max(reps) <= 7
        B.add('lead_lift', 'sequence', 40, [], f"{pn} leads the session" + (" as heavy, low-rep work" if heavy else '') + '.', name=pn, heavy=heavy, rir=rir,
              arch=B.arch_name if res.get('archetype') != 'strength_custom_target' else None)
    n_acc = sum(len(b['items']) for b in acc_blocks)
    if n_acc >= 2: B.add('accessory_build', 'volume', 34, [], f"{n_acc} accessory movements build out the session after the main work" + (", partly paired" if paired else '') + '.', n=n_acc, paired=paired)
    if fin_b and not B.has('finisher'): B.add('finisher', 'structure', 36, [], f"A finisher ({fin_b['items'][0]['exercise']['name']}) closes the session.", name=fin_b['items'][0]['exercise']['name'])
    tgt = next((e for e in byin.get('target', []) if e.get('realized')), None)
    if tgt and isinstance(tgt['value'], list) and len(tgt['value']) >= 2:
        from ..formatter import MUSCLE_NAMES
        order = [MUSCLE_NAMES.get(m, m) for m in tgt['value']]
        B.add('target_split', 'target', 75, [('target', 'target')], f"Target {_join(order)}: each gets direct work, in that order.", order=order)
    elif B.target_label:
        B.add('target_focus', 'target', 74, [('target', 'target')], f"Every movement serves the {B.target_label} Target.", label=B.target_label, prose=B.target_prose)
    core = next((l for l in res.get('log', []) if isinstance(l, dict) and l.get('reason_code') == 'core_focus_session'), None)
    if core and res.get('session_expectation') == 'long_core_session':
        B.add('core_long', 'target', 76, [], "Long Core request: a core-focused strength session (loaded bracing, carries, stability) rather than an hour of ab work.")


# ------------------------------------------------------------------ Sweat
PLAIN_SHAPE = {'long_intervals': 'longer intervals', 'short_intervals': 'short, sharp intervals', 'pyramid': 'a pyramid', 'continuous': 'one continuous effort',
               'rounds': 'straight rounds', 'timed': 'a timed circuit', 'emom': 'an every-minute clock', 'ladder': 'a ladder', 'anchor_couplet': 'an anchor with two stations',
               'anchor_triplet': 'an anchor with three stations', 'split_anchor': 'a split anchor', 'ladder_hybrid': 'a ladder'}


def _effort_word(rpe):
    r = float(rpe or 0)
    return 'easy' if r <= 5 else 'steady' if r <= 6 else 'moderately hard' if r <= 7 else 'hard' if r <= 8 else 'very hard'


def _plain_shape(name):
    from ..engines.sweat.sweat_core import SHAPE_NAME
    inv = {v: k for k, v in SHAPE_NAME.items()}
    return PLAIN_SHAPE.get(inv.get(name.strip(), ''), name.strip())


def _sweat(B, ctx, res, w, byin):
    from ..engines.sweat.sweat_core import SHAPE_NAME
    W = res.get('w') or {}; blocks = W.get('blocks') or []
    p = blocks[0] if blocks else {}
    shape = p.get('shape'); arch = W.get('archetype_id')
    eng = next((e for e in p.get('items_e', []) if e['role'] == 'engine'), None)
    stations = [e['name'] for e in p.get('items_e', []) if e['role'] != 'engine']
    fin = next((e['name'] for b in blocks if b.get('structure') == 'finisher' for e in b['items_e']), None)
    comp = next((b for b in blocks[1:] if b.get('structure') != 'finisher'), None)
    rpe = p.get('rpe') or [7, 8]
    for e in byin.get('state', []):
        s = e['value']
        if not e.get('realized'): continue
        k = _by_kind(e); c = [('state', s)]
        if 'rpe' in k:
            a = _nums(k['rpe'][0]); up = len(a) >= 4 and a[2] + a[3] > a[0] + a[1]
            old, new = (_effort_word(a[1]), _effort_word(a[3])) if len(a) >= 4 else (None, _effort_word(rpe[1]))
            span = ''
            if old and old == new: continue   # QA freeze: an RPE nudge inside the same effort band is not a change worth crediting
            if up: B.add('harder_pace', 'effort', 90, c, f"{s}: main block effort goes from {old} to {new}{span}.", old=old, new=new)
            else: B.add('sustainable_pace', 'effort', 88, c, f"{s}: main block effort comes down from {old} to {new}{span}.", old=old, new=new)
        if 'recovery' in k:
            a = _nums(k['recovery'][0]); more = len(a) >= 2 and a[-1] > a[0]
            secs = dict(before=int(a[0]), after=int(a[-1])) if len(a) >= 2 else {}
            what = 'between rounds' if 'round' in k['recovery'][0] else 'between efforts'
            if more: B.add('more_recovery', 'rest', 84, c, f"Rest {what} goes from {secs.get('before')} to {secs.get('after')} seconds.", what=what, **secs)
            else: B.add('less_downtime', 'rest', 86, c, f"Rest {what} drops from {secs.get('before')} to {secs.get('after')} seconds.", what=what, **secs)
        if 'volume' in k: B.add('extra_round', 'volume', 86, c, "An extra round of work.")
        if 'shape' in k:
            new = _plain_shape(k['shape'][0].split(' instead of ')[0]); old = _plain_shape(k['shape'][0].split(' instead of ')[-1])
            B.add('shape_change', 'structure', 87 if s in ('bored', 'amped', 'irritated') else 80, c, f"{s}: the session runs as {new} instead of {old}.", shape=new, old=old)
        if 'modality' in k:
            new = k['modality'][0].split(' instead of ')[0]; old = k['modality'][0].split(' instead of ')[-1]
            B.add('new_machine', 'novelty' if s == 'bored' else 'selection', 85, c, f"{s}: {new} instead of {old}.", name=new, old=old)
            if old not in B.mentionable: B.mentionable.append(old)   # named only as 'instead of'
        if 'exercises' in k:
            names = [_clean(x) for x in k['exercises']]
            ex = {e['name']: e for bb in blocks for e in bb['items_e']}
            if s == 'bored': B.add('fresh_movements', 'novelty', 90, c, f"Bored: fresh stations ({_join(names[:2])}).", n=len(names), names=names[:2])
            elif s == 'irritated':
                f = [n for n in names if (ex.get(n) or {}).get('forceful') or (ex.get(n) or {}).get('explosive')]
                if f: B.add('forceful_stations', 'selection', 88, c, f"Irritated: direct, forceful stations ({_join(f[:2])}).", names=f[:2])
            else:
                simple = [n for n in names if (ex.get(n) or {}).get('cx', 9) <= 2 and (ex.get(n) or {}).get('impact') != 'high']
                if simple and len(simple) == len(names): B.add('simple_stations', 'selection', 84, c, f"{s}: simple, stable stations ({_join(simple[:2])}).", names=simple[:2])
        if 'finisher' in k and fin: B.add('finisher', 'structure', 82, c, f"A {fin} finisher closes the session.", name=fin)
    # ---- structure / baseline
    sname = PLAIN_SHAPE.get(shape, SHAPE_NAME.get(shape, shape))
    rhythm = {'rounds': 'rounds', 'timed': 'rounds', 'anchor_couplet': 'anchor', 'anchor_triplet': 'anchor', 'split_anchor': 'anchor',
              'long_intervals': 'waves', 'short_intervals': 'waves', 'pyramid': 'pyramid', 'continuous': 'steady', 'emom': 'clock',
              'ladder': 'ladder', 'ladder_hybrid': 'ladder'}.get(shape, 'rounds')
    B.add('sweat_shape', 'sequence', 42, [], f"{B.arch_name}: {sname}" + (f" on the {eng['name']}" if eng and rhythm in ('waves', 'steady', 'pyramid') else '') +
          (f" with {_join(stations[:3])}" if stations and rhythm in ('rounds', 'anchor', 'clock', 'ladder') else '') + '.',
          rhythm=rhythm, shape=sname, engine=eng['name'] if eng else None, stations=stations[:3])
    if comp: B.add('second_piece', 'sequence', 30, [], f"A shorter second piece ({(comp.get('comp_type') or comp.get('structure') or '').replace('_', ' ')}) follows the main block.", engine=next((e['name'] for e in comp['items_e'] if e['role'] == 'engine'), None))
    if fin and not B.has('finisher'): B.add('finisher', 'structure', 34, [], f"A {fin} finisher closes the session.", name=fin)
    B.add('effort_band', 'effort', 28, [], f"Main block effort: {_effort_word(rpe[1])}.", hard=rpe[1] >= 9, easy=rpe[1] <= 7)
    tgt = next((e for e in byin.get('target', []) if e.get('realized')), None)
    if tgt:
        B.add('target_lean', 'target', 74, [('target', 'target')], f"Stations lean toward {B.target_label or _join(tgt['value'])} while the session stays conditioning-first.", label=B.target_label or _join(tgt['value']), prose=B.target_prose, engine=eng['name'] if eng else None)


# ------------------------------------------------------------------ Athletic
def _athletic(B, ctx, res, w, byin):
    out = res.get('w') or {}
    if 'sess' not in out: return
    from ..engines.athletic.athletic_core import QUALITY_LABEL, STRUCTURE_LABEL, PB, EX
    sess = out['sess']; blocks = sess['blocks']
    q = QUALITY_LABEL[sess['pq']]; prim_b = PB(sess); prim = prim_b['items'][-1]; pn = EX[prim['id']]['name']
    primer = next((b['items'][-1] for b in blocks if b['role'] == 'primer'), None)
    sec = [b for b in blocks if b['role'] in ('secondary', 'tertiary')]
    st_x = [x for b in blocks if b['role'] == 'strength' for x in b['items'] if x['cls'] == 'strength']
    fin_b = next((b for b in blocks if b['role'] == 'finisher'), None)
    realized = out.get('realized') or {}
    for s in ctx.states:
        if s == 'sore': continue
        R = dict(realized.get(s, []))
        if not R: continue
        c = [('state', s)]
        if s == 'low_energy':
            if 'fewer_explosive_sets' in R or 'fewer_qualities' in R:
                B.add('fewer_efforts', 'volume', 90, c, f"Low Energy: fewer explosive efforts ({_join([R.get('fewer_qualities'), R.get('fewer_explosive_sets')])}), each still full intent.", detail=R.get('fewer_explosive_sets') or R.get('fewer_qualities'))
            if 'lower_impact' in R: B.add('less_impact', 'selection', 86, c, f"Low Energy: less landing impact ({R['lower_impact']}).")
            if 'simpler_movements' in R: B.add('simple_power', 'selection', 84, c, "Low Energy: every movement is simple to coordinate.")
            if 'longer_recovery' in R: B.add('full_recovery', 'rest', 82, c, f"Low Energy: longer recovery between primary sets ({R['longer_recovery']}).")
            if 'easier_strength' in R or 'less_strength_volume' in R: B.add('strength_held_back', 'effort', 80, c, "Low Energy: the strength work stays well short of failure / carries less volume.")
        elif s == 'amped':
            if 'contrast' in R: B.add('contrast', 'structure', 92, c, f"Amped: heavy-light contrast pairs ({EX[prim_b['items'][0]['id']]['name']} into {pn}).", heavy=EX[prim_b['items'][0]['id']]['name'], name=pn)
            if 'heavier_strength' in R and st_x: B.add('heavier_strength', 'effort', 88, c, f"Amped: heavier strength work ({EX[st_x[0]['id']]['name']}).", name=EX[st_x[0]['id']]['name'])
            if 'extra_quality_set' in R: B.add('extra_quality_set', 'volume', 86, c, f"Amped: one extra quality set of {pn}, still low-rep.", name=pn)
            if 'demanding_variation' in R and 'contrast' not in R: B.add('demanding_primary', 'selection', 90, c, f"Amped: a more demanding primary ({pn}).", name=pn)
        elif s == 'irritated':
            f = [n for n in (R.get('forceful_movements') or '').split(', ') if n]
            if f or 'forceful_primary' in R: B.add('forceful_athletic', 'selection', 90, c, f"Irritated: forceful, direct movements ({_join(f[:2] or [pn])}), low reps so they stay explosive.", names=f[:2] or [pn])
        elif s == 'stressed':
            if {'simple_structure', 'no_reactive_chaos', 'simple_power', 'few_changes'} & set(R):
                B.add('no_chaos', 'structure', 88, c, f"Stressed: no reactive or complicated drills; a simple order with {len([x for b in blocks for x in b['items']])} exercises.")
        elif s == 'bored':
            bits = []
            if 'novel_primary' in R: bits.append(pn)
            elif 'novel_movements' in R: bits.append(R['novel_movements'].split(', ')[0])
            B.add('fresh_athletic', 'novelty', 90 if bits or 'new_quality' in R else 70, c,
                  f"Bored: a different movement experience" + (f" ({_join(bits)})" if bits else '') + (f", new focus on {q}" if 'new_quality' in R else '') +
                  (f", {R['different_plane'].replace('/', ' and ')} work" if 'different_plane' in R else '') + '.',
                  names=bits, plane=R.get('different_plane'), new_quality='new_quality' in R)
    # ---- structure / baseline
    B.add('quality_first', 'sequence', 45, [('primary_quality', sess['pq'])], f"Primary quality: {q}. {pn} comes first while fresh" + (f", primed by {EX[primer['id']]['name']}" if primer else '') + '.',
          quality=q, name=pn, primer=EX[primer['id']]['name'] if primer else None, lower=sess['pq'] not in ('rotational_power', 'upper_power'))
    if sec: B.add('then_more', 'sequence', 35, [], "Then " + _join(f"{EX[b['items'][0]['id']]['name']} ({QUALITY_LABEL[b['quality']]})" for b in sec) + '.', names=[EX[b['items'][0]['id']]['name'] for b in sec])
    if st_x: B.add('strength_for_speed', 'sequence', 38, [('strength', 'strength')], f"Strength work ({_join(EX[x['id']]['name'] for x in st_x)}) comes after the explosive work, done for bar speed.", names=[EX[x['id']]['name'] for x in st_x])
    B.add('full_rest_rule', 'rest', 26, [], f"{prim['rest']} s between primary sets so every rep stays fast.")
    if fin_b: B.add('finisher', 'structure', 60 if ctx.goal == 'lose_weight_conditioning' else 34, [], f"A short {EX[fin_b['items'][0]['id']]['name'].lower()} finisher comes last so it can't blunt the power work.", name=EX[fin_b['items'][0]['id']]['name'])
    if B.target_label:
        hit = [x['exercise']['name'] for b in w.get('blocks', []) for x in b['items'] if set(x['exercise'].get('primary_muscles') or []) & set(ctx.target_muscles)]
        B.add('target_lean', 'target', 72, [('target', 'target')], f"{B.target_label} Target shapes the support work" + (f" ({_join(hit[:2])})" if hit else '') + "; the session stays athletic.", label=B.target_label, prose=B.target_prose, names=hit[:2])


# ------------------------------------------------------------------ inputs beyond States: goal, level, history, duration, equipment
# These are 'input' facts: something the user told MOOD (or MOOD knows about them) that verifiably changed today's session.
# On a no-State day they are the hook; the copy may only use them when the contract shows a realized consequence.
def _main_name(w):
    b = next(iter(_blocks(w, 'main', 'primary')), None) or (w['blocks'][0] if w.get('blocks') else None)
    return b['items'][0]['exercise']['name'].split(' / ')[0] if b and b.get('items') else None


def _context(B, ctx, res, w, byin, history_records):
    d = ctx.direction
    goal_e = next((e for e in byin.get('goal', []) if e.get('realized')), None)
    lvl_e = next((e for e in byin.get('experience', []) if e.get('realized')), None)
    g = ctx.goal; pn = _main_name(w)
    n_acc = sum(len(b['items']) for b in _blocks(w, 'accessory', 'target'))
    if d == 'strength' and goal_e and g in GOAL_WORD:
        r = ' '.join(goal_e['realized'])
        if g == 'build_strength':
            heavy = bool((B.get('lead_lift') or {}).get('data', {}).get('heavy'))
            B.add('goal_strength', 'goal', 60, [('goal', g)], f"Strength goal: {pn} leads the session" + (" as heavy, low-rep work" if heavy else '') + "; everything else supports it.", name=pn if heavy else None)
        elif g == 'build_muscle' and 'accessory' in r: B.add('goal_muscle', 'goal', 60, [('goal', g)], f"Muscle goal: {n_acc} accessory movements carry the volume at moderate reps.", n=n_acc, name=pn)
        elif g == 'lose_weight_conditioning' and 'short rests' in r: B.add('goal_conditioning', 'goal', 58, [('goal', g)], "Conditioning goal: accessory rests stay short so the session keeps moving.")
        elif g == 'feel_better_reduce_stress' and '2+ reps' in r: B.add('goal_feel', 'goal', 56, [('goal', g)], "Feel-better goal: compound work stays two reps from failure.")
        elif g == 'improve_athleticism': B.add('goal_athletic_lift', 'goal', 58, [('goal', g)], f"Athleticism goal: {pn} stays heavy and fast with full rest.", name=pn)
    elif d == 'sweat' and goal_e and g in GOAL_WORD:
        r = ' '.join(goal_e['realized'])
        if g == 'lose_weight_conditioning': B.add('goal_conditioning', 'goal', 58, [('goal', g)], "Conditioning goal: the session keeps moving with little standing around.")
        elif g == 'build_muscle': B.add('goal_muscle', 'goal', 56, [('goal', g)], "Muscle goal: resistance stations get real work inside the conditioning.")
        elif g == 'improve_athleticism' and 'tools' in r: B.add('goal_athletic', 'goal', 56, [('goal', g)], "Athleticism goal: powerful output tools are in the mix.")
        elif g == 'build_strength' and 'carries' in r: B.add('goal_strength', 'goal', 56, [('goal', g)], "Strength goal: loaded carries / sleds inside the conditioning.")
        elif g == 'feel_better_reduce_stress': B.add('goal_feel', 'goal', 54, [('goal', g)], "Feel-better goal: the work stays rhythmic and sustainable.")
    elif d == 'athletic' and g in GOAL_WORD:
        if g == 'improve_athleticism': B.add('goal_athletic', 'goal', 56, [('goal', g)], "Athleticism goal: speed and power lead; strength supports them.")
        elif g == 'build_strength' and any(b.get('type') == 'strength' for b in w.get('blocks', [])):
            sn = list(((B.get('strength_for_speed') or {}).get('data') or {}).get('names') or [])
            # QA freeze: name the lifts that go heavier, so the copy never credits the explosive opener with heavy work
            B.add('goal_strength', 'goal', 56, [('goal', g)], "Strength goal: the strength work" + (f" ({_join(sn)})" if sn else '') +
                  " is heavier; the explosive work stays light and fast.", names=sn)
    if lvl_e:
        r = ' '.join(lvl_e['realized'])
        if ctx.experience == 'beginner':
            # QA freeze: effort in words (no RPE number for the copy to repeat), and no '0 stations' clause
            said = [re.sub(r'RPE capped at (\d+(?:\.\d+)?)', lambda m_: f"effort capped at {_effort_word(m_.group(1))}", x) for x in lvl_e['realized'][:3]]
            said = [x for x in said if not re.match(r'0 stations\b', x)]
            B.add('level_beginner', 'level', 52, [('experience', 'beginner')], "Beginner: " + '; '.join(said) + '.',
                  rir2='2+ reps in reserve' in r, no_impact='no high-impact' in r, no_oly='no Olympic' in r, predictable='predictable structure' in r, direction=d)
        elif ctx.experience == 'advanced' and d == 'strength' and ('eccentrics' in r or 'higher-complexity' in r or 'runs to RIR' in r):
            meth = [x.split(' (')[0] for x in lvl_e['realized'] if ' on ' in x]
            r1 = next((_ex_name(x) for x in lvl_e['realized'] if 'runs to RIR' in x), None)
            B.add('level_advanced', 'level', 50, [('experience', 'advanced')], "Advanced: " + '; '.join(lvl_e['realized'][:3]) + '.', methods=meth[:1], name=r1)
    hist = next((e for e in byin.get('history', []) if e.get('realized')), None)
    if hist:
        r = hist['realized']
        cont = next((x for x in r if str(x).startswith('main lift continuity')), None)
        shape = next((x for x in r if str(x).startswith(('different shape', 'structure moved', 'primary quality moved'))), None)
        if cont: B.add('progression_kept', 'history', 58, [('history', 'history')], f"{cont.split(': ')[-1]} stays from last time so progress carries over.", name=cont.split(': ')[-1].split(',')[0])
        elif shape: B.add('different_from_last', 'history', 48, [('history', 'history')], "The shape is different from the last session of this type.")
    prog = next((it for b in w.get('blocks', []) for it in b['items'] if (it.get('progression') or {}).get('text')), None)
    if prog: B.add('progression_target', 'history', 62, [('history', 'progression')], f"Last {prog['exercise']['name']} session sets today's target.", name=prog['exercise']['name'])
    src = res.get('selection_source')
    if src == 'moods_pick' and not res.get('rerouted'):
        last = [h for h in history_records if h.get('direction') == d]
        if last and last[-1].get('archetype') and last[-1]['archetype'] != res.get('archetype'):
            from ..formatter import ARCHETYPE_NAMES
            prev = ARCHETYPE_NAMES.get(last[-1]['archetype'], last[-1]['archetype'])
            B.add('rotation', 'history', 57, [('history', 'rotation')], f"Last {d} session was {prev}, so MOOD's Pick rotates to {B.arch_name}.", prev=prev, arch=B.arch_name)
            if prev not in B.mentionable: B.mentionable.append(prev)
    est = (w.get('duration') or {}).get('estimated_minutes') or res.get('estimated_minutes') or 0
    n_items = sum(len(b['items']) for b in w.get('blocks', []))
    if ctx.duration == 60 and est and est < 42 and d != 'strength':
        B.add('complete_early', 'duration', 44, [], f"The session is complete at about {int(round(est))} minutes.", minutes=int(round(est)))
    if ctx.duration == 30:
        B.add('short_window', 'duration', 50, [('duration', 30)], f"30-minute window: {n_items} exercises, {pn} first.", n=n_items, name=pn)
    if ctx.preset != 'commercial_gym':
        label = ((w.get('equipment') or {}).get('label') or 'the equipment you have').lower()
        # QA freeze: speakable labels ("You're working with minimal (dumbbells + bench)" read as broken English)
        label = {'minimal': 'just dumbbells and a bench', 'free_weight_limited': 'free weights (dumbbells, kettlebells and a bench)'}.get(ctx.preset, label)
        B.add('equipment', 'equipment', 48, [('equipment', ctx.preset)], f"Equipment: {label}; every exercise fits it.", label=label)
