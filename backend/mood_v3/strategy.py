"""Session interpretation for Built for Today (Strength freeze pass).

personalization contract + completed session -> a small strategy representation -> consumer copy (2 to 3 sentences) and
trainer reasoning (the founder / trainer layer). Deterministic, no LLM. Every sentence rests on contract entries with realized
consequences or on logged decisions; the claims list is returned with the text so the truthfulness audit can check it.

The point is to explain the programming STRATEGY first (why the session is shaped this way for this person today) and use the
specific decisions as evidence, rather than enumerating every event.
"""
from __future__ import annotations
import hashlib, re

STATE_WORD = {'low_energy': 'low on energy', 'bored': 'bored', 'irritated': 'irritated', 'amped': 'amped', 'stressed': 'stressed'}
GOAL_WORD = {'build_strength': 'strength', 'build_muscle': 'muscle', 'improve_athleticism': 'athleticism', 'lose_weight_conditioning': 'conditioning',
             'feel_better_reduce_stress': 'feeling better', 'stay_consistent': 'consistency'}
COMP = ('primary_compound', 'secondary_compound')


def _u(seed, *parts):
    return int(hashlib.md5('|'.join(map(str, (seed,) + parts)).encode()).hexdigest()[:8], 16) / 16 ** 8


def pick(options, seed, key):
    options = [o for o in options if o]
    return options[int(_u(seed, key) * len(options)) % len(options)] if options else ''


def _join(parts):
    parts = [p for p in parts if p]
    if not parts: return ''
    if len(parts) == 1: return parts[0]
    return ', '.join(parts[:-1]) + ' and ' + parts[-1]


def _nums(reps):
    return [int(x) for x in re.findall(r'\d+', str(reps or ''))]


def _cap(s): return s[0].upper() + s[1:] if s else s


# ---------------------------------------------------------------- session view
def view(ctx, res):
    from .engines.strength.core import EX, ARCH_NAME
    rows = res.get('rows') or []; fin = (res.get('fin_rows') or [None])[0]
    comp = [r for r in rows if r['cls'] in COMP]; acc = [r for r in rows if r['cls'] not in COMP]
    prim = next((r for r in rows if r['cls'] == 'primary_compound'), None)
    log = [l for l in res.get('log', []) if isinstance(l, dict)]
    P = res.get('personalization') or []
    byin = {}
    for e in P: byin.setdefault(e['input'], []).append(e)
    states = {e['value']: e for e in byin.get('state', [])}
    realized = {s: e for s, e in states.items() if e.get('realized')}
    yielded = {l['state'] for l in log if l.get('reason_code') == 'state_gate_yielded'}
    coh = next((l for l in reversed(log) if l.get('reason_code') == 'state_coherence'), None)
    repairs = [l for l in log if l.get('reason_code') == 'state_coherence_repair']
    blocks = res.get('st_blocks') or []
    v = dict(
        rows=rows, comp=comp, acc=acc, prim=prim, fin=fin, variant=res.get('variant'), arch=res.get('archetype'), arch_name=ARCH_NAME.get(res.get('archetype'), res.get('archetype')),
        goal=getattr(ctx, 'goal', None), level=getattr(ctx, 'experience', None), dur=getattr(ctx, 'duration', 60), states=[s for s in getattr(ctx, 'states', []) if s != 'sore'],
        realized=realized, yielded=yielded, byin=byin, log=log, coh=coh, repairs=repairs,
        total_sets=sum(r['sets'] for r in rows), n_ex=len(rows), est=res.get('estimated_minutes'),
        methods=[(r['method']['label'], r['name']) for r in rows if r.get('method')],
        n_pairs=sum(1 for b in blocks if b.get('structure_id') == 'superset'), device=next((b['structure_id'] for b in blocks if b.get('structure_id') in ('pyramid', 'ladder')), None),
        near_failure=[r['name'] for r in rows if r.get('rir') is not None and r['rir'] <= 1],
        heavy_primary=bool(prim and prim['kind'] == 'reps' and _nums(prim['reps']) and max(_nums(prim['reps'])) <= 6),
        primary_hard=bool(prim and prim['rir'] is not None and prim['rir'] <= 1),
        primary_scheme=bool(prim and prim.get('scheme')), primary_tempo=(prim.get('tempo') if prim else None),
        acc_sets=sum(r['sets'] for r in acc), comp_sets=sum(r['sets'] for r in comp),
        novel=[r['name'] for r in rows if EX[r['eid']]['nov'] >= 3], supported=sum(1 for r in rows if EX[r['eid']]['sup'] != 'unsupported'),
        demanding=[r['name'] for r in comp if EX[r['eid']]['sysd'] >= 4], cx3=[r['name'] for r in rows if EX[r['eid']]['cx'] >= 3],
        redundancy=next((l for l in log if l.get('reason_code') == 'compound_redundancy_trimmed'), None),
        narrowed=next((l for l in log if l.get('reason_code') == 'archetype_narrowed_around_soreness'), None),
        core=next((l for l in log if l.get('reason_code') == 'core_focus_session'), None),
        rerouted=bool(res.get('rerouted')), expectation=res.get('session_expectation'),
        seed=f"{getattr(ctx, 'user_key', 'u')}|{getattr(ctx, 'date', 'd')}",
    )
    return v


def _kinds(v, s):
    e = v['realized'].get(s); return set(e.get('kinds', [])) if e else set()


def _detail(v, s, kind):
    e = v['realized'].get(s)
    if not e: return []
    out = []
    for k, d in zip(e.get('kinds', []), e.get('realized_by_kind') or [[x] for x in e.get('realized', [])]):
        if k == kind: out += d
    return out


def _nmov(n): return f"{n} less-familiar movement{'s' if n != 1 else ''}"


def _name(detail):
    s = detail.replace('left out ', '')    # 'left out Cable Fly' -> 'Cable Fly' before the ' out' cut below
    for cut in (' RIR ', ' →', ' rest ', ' × ', ' (', ' out', ' runs', ':'):
        if cut in s: s = s.split(cut)[0]
    return re.sub(r'\s+\d.*$', '', s).replace('left out ', '').strip()


# ---------------------------------------------------------------- strategies
def interpret(ctx, res):
    """-> list of strategies, each dict(id, priority, text, claims, trainer). Highest priority first."""
    v = view(ctx, res); S = []; seed = v['seed']; st = set(v['realized']); lvl = v['level']; goal = v['goal']
    prim = v['prim']; pn = prim['name'] if prim else None
    strength_goal = goal in ('build_strength', 'improve_athleticism')
    def add(i, p, text, claims, trainer): S.append(dict(id=i, priority=p, text=text, claims=claims, trainer=trainer))
    def backed(inp, val):   # a level / goal may only be named when the contract has a realized consequence for it
        return any(e.get('realized') for e in v['byin'].get(inp, []) if e.get('value') == val)
    lvl_ok = backed('experience', lvl); goal_ok = backed('goal', goal)
    heavy_kept = v['heavy_primary'] or v['primary_hard'] or v['variant'] in ('heavy_primary', 'top_backoff') or v['primary_scheme']
    le_cost = [k for k in ('rir', 'volume', 'slot_removed', 'complexity_or_systemic_cap', 'exercises', 'reps') if k in _kinds(v, 'low_energy')]
    # ---- State resolutions (pairs judged as one decision)
    if {'amped', 'stressed'} <= st or ({'stressed'} <= st and 'amped' in v['yielded']):
        eff = [k for k in ('rir', 'reps', 'volume', 'structure', 'set_method') if k in _kinds(v, 'amped')]
        calm = [k for k in ('structure', 'rest', 'tempo', 'exercises', 'slot_removed', 'complexity_or_systemic_cap') if k in _kinds(v, 'stressed')]
        if eff and calm:
            effort = pick([f"harder work on {pn}" if pn and ('rir' in eff or 'reps' in eff or 'volume' in eff) else "harder compound work", "more from the main lifts"], seed, 'as1')
            add('amped_stressed', 10, f"You're amped but stressed, so instead of making the workout busier we're putting that extra energy into {effort} while keeping the structure {'straight and ' if v['n_pairs'] == 0 else ''}predictable and the rest unhurried.",
                [('state', 'amped'), ('state', 'stressed')], f"Amped + Stressed resolved as effort up, complexity down: Amped realized {eff}, Stressed realized {calm}; {v['n_pairs']} superset(s), variant {v['variant']}, primary RIR {prim['rir'] if prim else 'n/a'}.")
    if {'low_energy'} <= st and ('amped' in v['yielded'] or 'amped' in st):
        amped_part = _detail(v, 'amped', 'rir') + _detail(v, 'amped', 'reps') + _detail(v, 'amped', 'volume')
        if amped_part and le_cost:
            add('amped_low_energy', 10, f"You're amped but running on less energy than usual, so energy sets the budget and the readiness goes into one place: {_name(amped_part[0])}. Everything around it stays {pick(['further from failure', 'light on cost and further from failure'], seed, 'al1')}.",
                [('state', 'amped'), ('state', 'low_energy')], f"Low Energy owns systemic cost (realized {le_cost}); Amped kept only on the primary ({amped_part[0]}).")
        elif le_cost and 'amped' in v['yielded']:
            add('amped_yielded', 9, f"You're amped but low on energy, and {'with no main lift in this session ' if not prim else ''}energy wins today: we're {_join(_le_frags(v)[:2])} rather than chasing the extra energy.",
                [('state', 'low_energy'), ('state_yielded', 'amped')], "Amped yielded to Low Energy by rule (no primary lift to carry the effort); Low Energy realized " + ', '.join(le_cost) + '.')
    if {'irritated', 'stressed'} <= st:
        direct = [k for k in ('reps', 'tempo', 'rest', 'structure', 'finisher') if k in _kinds(v, 'irritated')]
        calm = [k for k in ('structure', 'rest', 'tempo', 'exercises', 'slot_removed', 'complexity_or_systemic_cap') if k in _kinds(v, 'stressed')]
        if direct and calm:
            add('irritated_stressed', 10, f"You're irritated and stressed, so the session is heavy and direct without being frantic: {('%s carries the effort' % pn) if pn else 'the compound work carries the effort'}, the structure stays plain and the rest stays unhurried.",
                [('state', 'irritated'), ('state', 'stressed')], f"Irritated realized {direct}; Stressed realized {calm}. Catharsis through load and intent, not density.")
    if {'irritated', 'low_energy'} <= st:
        direct = _detail(v, 'irritated', 'reps') + _detail(v, 'irritated', 'tempo')
        if direct and le_cost:
            add('irritated_low_energy', 10, f"You're irritated but low on energy, so we're giving you one direct, physical effort ({_name(direct[0]) if not direct[0].startswith('explosive') else pn or 'the main lift'}) and keeping the cost of everything else down.",
                [('state', 'irritated'), ('state', 'low_energy')], f"Irritated realized {list(_kinds(v, 'irritated'))}; Low Energy realized {le_cost}.")
    if {'bored', 'stressed'} <= st and 'exercises' in _kinds(v, 'bored'):
        n = len(_detail(v, 'bored', 'exercises'))
        add('bored_stressed', 10, f"You're bored and stressed, so the novelty is in the movements ({n} less-familiar {'one' if n == 1 else 'ones'}) while the structure stays plain and predictable.",
            [('state', 'bored'), ('state', 'stressed')], f"Bored owns exercise novelty ({n} new vs no-State build); Stressed owns structure (variant {v['variant']}, {v['n_pairs']} pairs).")
    if {'bored', 'low_energy'} <= st and 'exercises' in _kinds(v, 'bored') and le_cost:
        add('bored_low_energy', 10, f"You're bored and low on energy, so the change of scenery comes from the movement choices, not from extra work: {_nmov(len(_detail(v, 'bored', 'exercises')))}, everything {pick(['further from failure', 'kept at a comfortable effort'], seed, 'bl1')}.",
            [('state', 'bored'), ('state', 'low_energy')], f"Bored realized {list(_kinds(v, 'bored'))}; Low Energy realized {le_cost}.")
    if {'amped', 'bored'} <= st and _kinds(v, 'amped') and _kinds(v, 'bored'):
        nb = len(_detail(v, 'bored', 'exercises')); mb = _detail(v, 'bored', 'set_method')
        novel_bits = ([mb[0]] if mb else []) + ([_nmov(nb)] if nb else []) or ['a different shape']
        add('amped_bored', 9, f"You're amped and bored, so the extra energy goes into something new: {_join(novel_bits)}, with {pn or 'the main work'} pushed {'a rep closer to failure' if 'rir' in _kinds(v, 'amped') else 'harder'}.",
            [('state', 'amped'), ('state', 'bored')], f"Amped realized {list(_kinds(v, 'amped'))}; Bored realized {list(_kinds(v, 'bored'))}.")
    # ---- single-State strategies (skipped when a pair strategy already covers the State)
    covered = {c[1] for s_ in S for c in s_['claims'] if c[0] == 'state'}
    if 'low_energy' in st and 'low_energy' not in covered and le_cost:
        fr = _le_frags(v)
        if strength_goal and heavy_kept and pn and goal_ok:
            add('le_strength', 8, f"You're low on energy, but strength is still the goal, so we're keeping one meaningful heavy stimulus ({pn}) instead of watering the session down. The rest of the workout {pick(['uses more support and stays further from failure', 'stays simpler and further from failure'], seed, 'les')} so you train productively without turning it into a grind.",
                [('state', 'low_energy'), ('goal', goal)] + ([('experience', lvl)] if lvl_ok else []), f"Low Energy + {goal}: primary kept heavy (reps {prim['reps']}, RIR {prim['rir']}); cost lowered around it via {le_cost}; total sets {v['total_sets']}, near failure {v['near_failure']}.")
        elif lvl == 'beginner' and lvl_ok:
            add('le_beginner', 8, f"You're low on energy, so today stays on stable, approachable movements at a comfortable effort: {_join(fr[:2])}.", [('state', 'low_energy')], f"Beginner Low Energy: {le_cost}; supported movements {v['supported']}/{v['n_ex']}; total sets {v['total_sets']}.")
        else:
            add('le', 8, f"You're low on energy today, so we're {_join(fr[:3])}.", [('state', 'low_energy')], f"Low Energy realized {le_cost}; total sets {v['total_sets']}, avg RIR raised, near failure {v['near_failure']}.")
    if 'amped' in st and 'amped' not in covered and _kinds(v, 'amped'):
        k = _kinds(v, 'amped')
        if lvl == 'advanced' and strength_goal and pn and lvl_ok and goal_ok and (heavy_kept or {'rir', 'reps', 'volume', 'structure'} & k):
            add('amped_adv_strength', 8, f"You're amped, so that extra readiness goes into demanding compound work{(' with ' + pn + ' ' + _amped_primary_phrase(v)) if pn and _amped_primary_phrase(v) else ''}. Since you're an advanced lifter focused on strength, the session stays compound-heavy rather than turning the energy into more accessory volume.",
                [('state', 'amped'), ('experience', 'advanced'), ('goal', goal)], f"Amped + advanced + {goal}: realized {list(k)}; compound sets {v['comp_sets']} vs accessory {v['acc_sets']}; primary reps {prim['reps'] if prim else 'n/a'} RIR {prim['rir'] if prim else 'n/a'}.")
        elif lvl == 'beginner' and lvl_ok:
            _af = _amped_frags(v)[:2]
            add('amped_beginner', 8, (f"You're amped, so we're using it {pick(['without chasing failure', 'the way a good coach would for a newer lifter'], seed, 'ab')}: {_join(_af)}, still with reps in reserve on every set." if _af else
                                      "You're amped, so the main work moves with intent, still with reps in reserve on every set."),
                [('state', 'amped'), ('experience', 'beginner')], f"Beginner Amped: realized {list(k)}; min RIR {min((r['rir'] for r in v['rows'] if r.get('rir') is not None), default=None)}; no RIR-0 finisher.")
        else:
            add('amped', 8, (f"You're amped today, so we're {_join(_amped_frags(v)[:3])}." if _amped_frags(v) else "You're amped today, so the main work carries more intent."), [('state', 'amped')], f"Amped realized {list(k)}; near failure {v['near_failure']}; total sets {v['total_sets']}.")
    if 'irritated' in st and 'irritated' not in covered and _kinds(v, 'irritated'):
        k = _kinds(v, 'irritated'); fr = _irr_frags(v)
        if lvl == 'advanced' and heavy_kept and pn and lvl_ok:
            add('irr_adv', 8, f"You're irritated, so the session is built around heavy, direct work: {pn} {_irr_primary_phrase(v)}, simple movements behind it and nothing fussy.{' No finisher needed; the load does the job.' if not v['fin'] else ''}",
                [('state', 'irritated'), ('experience', 'advanced')], f"Irritated advanced: realized {list(k)}; heavy primary {v['heavy_primary']}, variant {v['variant']}, finisher {bool(v['fin'])}.")
        else:
            add('irr', 8, f"You're irritated today, so we're {_join(fr[:3])}.", [('state', 'irritated')], f"Irritated realized {list(k)}; variant {v['variant']}; finisher {bool(v['fin'])}.")
    if 'bored' in st and 'bored' not in covered and _kinds(v, 'bored'):
        k = _kinds(v, 'bored'); n = len(_detail(v, 'bored', 'exercises')); m = _detail(v, 'bored', 'set_method')
        hist = next((e for e in v['byin'].get('history', []) if e.get('realized')), None)
        cont = next((x for x in (hist['realized'] if hist else []) if x.startswith('main lift continuity')), None)
        if lvl == 'advanced' and (m or v['cx3']) and lvl_ok:
            shape_word = str(v['variant']).replace('_', ' ')
            bits = ([m[0]] if m else []) + ([_nmov(n)] if n else []) + ([f"a {shape_word} shape"] if 'structure' in k else [])
            cont_txt = (', while ' + cont.split(': ')[1].split(',')[0] + ' stays so your progression carries over') if cont else ''
            add('bored_adv', 8, f"You're bored, so the novelty is the sophisticated kind: {_join(bits)}{cont_txt}.",
                [('state', 'bored'), ('experience', 'advanced')] + ([('history', 'history')] if cont else []), f"Bored advanced: realized {list(k)}; methods {v['methods']}; complexity-3+ movements {v['cx3']}; continuity {bool(cont)}.")
        else:
            add('bored', 8, f"You're bored today, so we're {_join(_bored_frags(v)[:3])}.", [('state', 'bored')], f"Bored realized {list(k)}; novel movements {v['novel']}.")
    if 'stressed' in st and 'stressed' not in covered and _kinds(v, 'stressed'):
        k = _kinds(v, 'stressed'); fr = _str_frags(v)
        hard = heavy_kept and pn
        add('stressed', 8, f"You're stressed today, so the session runs on autopilot: {_join(fr[:3])}.{(' It still works: ' + pn + ' stays heavy.') if hard else ''}",
            [('state', 'stressed')], f"Stressed realized {list(k)}; variant {v['variant']}, pairs {v['n_pairs']}, device {v['device']}, methods {v['methods']}; physical stimulus kept: {bool(hard)}.")
    # ---- soreness
    sore = next((e for e in v['byin'].get('soreness', []) if e.get('realized')), None)
    if sore:
        from .formatter import REGION_NAMES, ARCHETYPE_NAMES
        regs = [REGION_NAMES.get(r, r.replace('_', ' ')) for r in (getattr(ctx, 'sore_regions', None) or [])] or [str(x).replace('_', ' ') for x in sore['value']]
        region = _join(list(dict.fromkeys(regs))); plural = region.endswith('s') or ' and ' in region; be = 'are' if plural else 'is'
        if v['narrowed']:
            txt = f"Your {region} {be} sore, so today's {ARCHETYPE_NAMES.get(v['narrowed']['archetype'], v['narrowed']['archetype'])} keeps the {' and '.join(v['narrowed']['kept'])} work and leaves the {' and '.join(v['narrowed']['left_out']) or region} work out."
        elif v['rerouted'] or sore['realized'][0].startswith('rerouted') or (getattr(ctx, 'target_mode', '') == 'moods_pick' and not getattr(ctx, 'archetype', None)):
            txt = f"Your {region} {be} sore, so we're moving the work {pick(['away from ' + ('them' if plural else 'it'), 'elsewhere'], seed, 'sr')}: today is {'an' if v['arch_name'][:1] in 'AEIOU' else 'a'} {v['arch_name']} session that leaves {'them' if plural else 'it'} alone."
        elif any('trained as asked' in x for x in sore['realized']):
            txt = f"You asked to train {region} despite the soreness, so we kept your Target and chose the friendlier setups."
        else:
            txt = f"Your {region} {be} sore, so every movement keeps that area out of the heavy loading" + (f"; {sore['realized'][1].split(' still')[0]} still touch{'es' if sore['realized'][1].startswith('1 ') else ''} it as a secondary mover" if len(sore['realized']) > 1 and 'secondary mover' in sore['realized'][1] and 'everything else' in sore['realized'][1] else '') + '.'
        add('sore', 11, txt, [('soreness', 'sore')], f"Soreness: {sore['realized']}.")
    # ---- level and goal (when nothing above claimed them)
    claimed = {c for s_ in S for c in s_['claims']}
    lvl_e = next((e for e in v['byin'].get('experience', []) if e.get('realized')), None)
    goal_e = next((e for e in v['byin'].get('goal', []) if e.get('realized')), None)
    if lvl_e and ('experience', lvl) not in claimed:
        r = lvl_e['realized']
        if lvl == 'beginner':
            add('level', 5, pick([f"Since you're newer to lifting, the movements stay approachable and the main work keeps {'at least two reps' if any('2+ reps' in x for x in r) else 'reps'} in reserve.",
                                  f"As a newer lifter, you get approachable movements and {'two reps' if any('2+ reps' in x for x in r) else 'reps'} in reserve on the main work; the progress comes from adding load, not from grinding."], seed, 'lv'),
                [('experience', 'beginner')], f"Beginner: {r}.")
        elif lvl == 'advanced':
            meth = [x.split(' (')[0] for x in r if ' on ' in x]; r1 = next((x for x in r if 'runs to RIR' in x), None)
            body = (f"we're keeping {_join(meth[:2])} in the mix" if meth else (f"{_name(r1)} runs to a rep from failure" if r1 and 'low_energy' not in st else "the compound work stays demanding before the accessories"))
            add('level', 5, pick([f"Since you're an advanced lifter, {body}.", f"You're advanced, so {body}."], seed, 'lv'), [('experience', 'advanced')], f"Advanced: {r}.")
        else:
            meth = [x.split(' (')[0] for x in r if ' on ' in x]
            if meth: add('level', 4, f"As an intermediate lifter, {meth[0]} is on the table.", [('experience', 'intermediate')], f"Intermediate: {r}.")
            elif any('Top Set' in x for x in r): add('level', 4, "As an intermediate lifter, the top-set scheme is in play.", [('experience', 'intermediate')], f"Intermediate: {r}.")
    if goal_e and ('goal', goal) not in claimed and not (v['core'] and goal == 'build_muscle'):
        r = goal_e['realized']; acc = next((x for x in r if 'accessory movement' in x), None)
        n_acc = acc.split(' ')[0] if acc else None; one = (n_acc == '1')
        gp = {'build_strength': pick([f"Your strength goal keeps {pn or 'the main lift'} heavy{' with full rest' if any('full ' in x for x in r) else ''} and the accessories in a supporting role.", f"Strength is the goal, so {pn or 'the main lift'} gets the priority{' and full rest' if any('full ' in x for x in r) else ''}; everything else supports it."], seed, 'gl'),
              'build_muscle': pick([f"Your muscle goal is why {n_acc or 'the'} accessory movement{'' if one else 's'} {('sits' if one else 'sit') + ' behind the main lifts' if pn else ('carries' if one else 'carry') + ' the session'} at moderate reps.", f"For muscle, the volume lives in the accessor{'y' if one else 'ies'}: {n_acc or 'several'} movement{'' if one else 's'} at moderate reps{' behind ' + pn if pn else ''}."], seed, 'gl') if acc else "Your muscle goal shapes the accessory work.",
              'improve_athleticism': f"Your athleticism goal keeps {pn or 'the main lift'} heavy and fast with full rest.",
              'lose_weight_conditioning': ("Your conditioning goal keeps the accessory rests short so the session keeps moving." if any('short rests' in x for x in r) else "Your conditioning goal is why the accessories run as pairs."),
              'feel_better_reduce_stress': ("Your feel-better goal keeps the compound work two reps from failure: steady, not grinding." if any('2+ reps' in x for x in r) else "Your feel-better goal keeps the shape plain and steady."),
              'stay_consistent': "The session stays balanced rather than specialised, which is the point of a consistency goal."}.get(goal)
        if gp: add('goal', 4, gp, [('goal', goal)], f"Goal {goal}: {r}.")
    # ---- history / target / long core
    hist = next((e for e in v['byin'].get('history', []) if e.get('realized')), None)
    if hist and ('history', 'history') not in claimed:
        r = hist['realized']
        cont = next((x for x in r if x.startswith('main lift continuity')), None); shape = next((x for x in r if x.startswith('different shape')), None); new = next((x for x in r if 'not in your last' in x), None)
        bits = []
        if cont: nm = cont.split(': ')[1]; bits.append(f"{nm.replace(', ', ' and ')} {'stay' if ',' in nm else 'stays'} so your progression carries over")
        if shape: bits.append("the shape is different from last time")
        if new: k = new.split(' movement')[0]; bits.append(f"{k} movement{'s are' if k != '1' else ' is'} new")
        if bits: add('history', 3, _cap(_join(bits)) + '.', [('history', 'history')], f"History: {r}.")
    tgt = next((e for e in v['byin'].get('target', []) if e.get('realized')), None)
    if tgt and isinstance(tgt['value'], list) and len(tgt['value']) >= 2 and not v['narrowed']:
        tv = list(tgt['value'])
        add('target', 2, f"Both {' and '.join(tv)} get direct work, in that order." if len(tv) == 2 else f"{', '.join(tv[:-1]).capitalize()} and {tv[-1]} each get direct work, in that order.", [('target', 'target')], f"Target: {tgt['realized']}.")
    if v['core']:
        cats = v['core'].get('categories') or []
        add('core_focus', 6 if v['expectation'] else 2,
            (f"Core stays the focus, but at {v['dur']} minutes it becomes a core-focused strength session: {_core_cat_phrase(cats)}." if v['expectation'] else f"A short Core session: {_core_cat_phrase(cats)}, Core first and last."),
            [], f"Core-focused session: categories {cats}; direct trunk work {v['core'].get('direct_core')}, loaded bracing {v['core'].get('loaded_bracing')}; est {v['est']} min for {v['dur']}.")
    S.sort(key=lambda s_: -s_['priority'])
    return S, v


def _core_cat_phrase(cats):
    words = {'brace_load': 'a loaded bracing lift', 'posterior': 'posterior-chain work', 'carry': 'carries', 'anti_extension': 'anti-extension', 'anti_rotation': 'anti-rotation and lateral stability', 'rotation': 'rotation', 'flexion': 'loaded flexion'}
    return _join([words[c] for c in cats if c in words][:5])


def _amped_primary_phrase(v):
    d = _detail(v, 'amped', 'rir') + _detail(v, 'amped', 'reps') + _detail(v, 'amped', 'volume')
    if v['primary_scheme']: return 'as a heavy top set and back-off sets'
    if any('RIR' in x for x in d): return 'a rep closer to failure'
    if any('sets' in x for x in d): return 'carrying an extra working set'
    if any('→' in x for x in d): return 'at the heavy end of its range'
    return ''


def _irr_primary_phrase(v):
    if v['heavy_primary'] and v['primary_tempo'] == 'explosive_intent': return 'heavy and driven with intent'
    if v['heavy_primary']: return 'heavy with full rest'
    if v['primary_tempo'] == 'explosive_intent': return 'driven with intent on every rep'
    return 'carrying the load'


def _le_frags(v):
    f = []; d = lambda k: _detail(v, 'low_energy', k)
    if d('rir'): f.append("keeping you further from failure" + ("" if len(d('rir')) > 2 else f" on {_join(_name(x) for x in d('rir')[:2])}"))
    if d('exercises'): f.append("leaning into stable, low-friction movements")
    if d('complexity_or_systemic_cap'): f.append("leaving out the higher-cost accessories")
    if d('slot_removed'): f.append(f"leaving {_name(d('slot_removed')[0])} out")
    if d('volume'): f.append("trimming accessory volume")
    if d('reps'): f.append("keeping the main lifts at moderate loads")
    if d('structure'): f.append("keeping the structure simple")
    if d('set_method'): f.append(f"slowing the eccentric on {d('set_method')[0].split(' on ')[-1]} instead of adding load")
    return f


def _amped_frags(v):
    f = []; d = lambda k: _detail(v, 'amped', k)
    if d('structure') and d('structure')[0].startswith('Top Set'): f.append("putting that readiness into a heavy top set and back-off sets")
    elif d('structure') and d('structure')[0].startswith('Heavy Primary'): f.append("putting that readiness into heavier main-lift work")
    if d('volume'): f.append(f"adding a working set to {_name(d('volume')[0])}")
    if d('rir'): f.append(f"taking {_join(_name(x) for x in d('rir')[:2])} a rep closer to failure")
    if d('reps'): f.append("pushing the main lifts to the heavy end of their range")
    if d('set_method'): f.append(f"using {d('set_method')[0]}")
    if d('finisher'): f.append(f"closing with a {d('finisher')[0].split(':')[0]}")
    if v['primary_tempo'] == 'explosive_intent' and v['prim']: f.append(f"driving every rep of {v['prim']['name']} with intent")
    if d('structure') and not f: f.append(f"running a {d('structure')[0].split(' instead')[0].lower()} shape")
    return f


def _irr_frags(v):
    f = []; d = lambda k: _detail(v, 'irritated', k)
    if d('structure') and d('structure')[0].startswith('Heavy Primary'): f.append("building the session around heavy, simple compound work")
    elif d('structure'): f.append("keeping the structure direct")
    if d('reps'): f.append("loading the main lifts heavier")
    if d('tempo') or v['primary_tempo'] == 'explosive_intent': f.append(f"driving every rep of {(_name(d('tempo')[0].split(' on ')[-1]) if d('tempo') and ' on ' in d('tempo')[0] else (v['prim']['name'] if v['prim'] else 'the main lift'))} with intent")
    if d('rest'): f.append("giving the heavy work full rest so it stays heavy")
    if d('finisher'): f.append("closing with something direct to push against")
    if d('exercises') or d('complexity_or_systemic_cap'): f.append("keeping the movements simple and physical")
    if d('volume'): f.append("trading accessory volume for heavier main work")
    return f


def _bored_frags(v):
    f = []; d = lambda k: _detail(v, 'bored', k)
    if d('set_method'):
        parts = d('set_method')[0].rsplit(' on ', 1); f.append(f"changing the feel with {parts[0]} on the {parts[1]}" if len(parts) == 2 else f"changing the feel with {parts[0]}")
    if d('exercises'): n = len(d('exercises')); f.append(f"bringing in {n} less-familiar movement{'s' if n != 1 else ''}")
    if d('structure'): f.append(f"changing the shape of the session to {d('structure')[0].split(' instead')[0]}")
    if d('finisher'): f.append("finishing with something new")
    return f


def _str_frags(v):
    f = []; d = lambda k: _detail(v, 'stressed', k)
    if d('structure'): f.append("a simple, predictable structure")
    if d('exercises'): f.append("familiar movements")
    if d('rest'): f.append("unhurried rest")
    if d('tempo'): f.append("controlled, rhythmic reps")
    if d('slot_removed'): f.append("one thing fewer to set up")
    if d('complexity_or_systemic_cap'): f.append("nothing technical")
    if d('rir'): f.append("moderate effort")
    if d('set_method'): f.append(f"eccentrics on {d('set_method')[0].split(' on ')[-1]} to give the reps a rhythm")
    return f


# ---------------------------------------------------------------- composition
def compose(ctx, res):
    """-> dict(text, claims) or None: the 2 to 3 sentence consumer copy."""
    S, v = interpret(ctx, res)
    if not S: return None
    out = []; claims = []; used_ids = set(); budget = 3
    # sentence 1: soreness opener (if any) + the top State strategy
    sore = next((s for s in S if s['id'] == 'sore'), None)
    top = next((s for s in S if s['id'] not in ('sore', 'level', 'goal', 'history', 'target', 'core_focus')), None)
    if sore: out.append(sore['text']); claims += sore['claims']; used_ids.add('sore')
    if top: out.append(top['text']); claims += top['claims']; used_ids.add(top['id'])
    # sentence 2: level / goal not already claimed (joined when both are short)
    claimed = set(claims); extra = []
    for sid in ('level', 'goal'):
        s = next((x for x in S if x['id'] == sid and not (set(x['claims']) & claimed)), None)
        if s: extra.append(s); claims += s['claims']; used_ids.add(sid)
    if extra:
        if len(extra) == 2 and len(extra[0]['text']) + len(extra[1]['text']) < 170:
            a, b = extra[0]['text'].rstrip('.'), extra[1]['text']
            out.append(a + ', and ' + b[0].lower() + b[1:])
        else:
            out += [e['text'] for e in extra]
    # sentence 3: core focus, history or target
    for sid in ('core_focus', 'history', 'target'):
        if len(out) >= budget: break
        s = next((x for x in S if x['id'] == sid), None)
        if s and not (set(s['claims']) & set(claims)): out.append(s['text']); claims += s['claims']
    if not out: return None
    return dict(text=' '.join(out[:budget]), claims=claims)


def trainer_notes(ctx, res):
    """The founder / trainer layer: why this ENTIRE session makes sense for this user today. More detailed than the consumer copy."""
    S, v = interpret(ctx, res)
    notes = []
    prim = v['prim']
    notes.append(f"Session: {v['arch_name']}, variant {v['variant']}, {v['n_ex']} exercises, {v['total_sets']} working sets, est. {v['est']} min for a {v['dur']}-minute request; "
                 f"primary {prim['name'] + ' ' + str(prim['sets']) + ' × ' + str(prim['reps']) + ' RIR ' + str(prim['rir']) if prim else 'none (no primary compound in this archetype)'}; "
                 f"{v['n_pairs']} superset(s), device {v['device'] or 'none'}, methods {[m[0] + ' on ' + m[1] for m in v['methods']] or 'none'}, finisher {v['fin']['name'] + ' (' + v['fin']['fin_type'] + ')' if v['fin'] else 'none'}.")
    for s in S: notes.append(f"[{s['id']}] {s['trainer']}")
    if v['coh']:
        vd = v['coh'].get('verdicts') or {}
        for st_, x in vd.items():
            notes.append(f"Coherence {st_}: {'PASS' if x.get('passed') else 'FAIL'}" + (f"; before repairs: {x.get('before')}" if x.get('before') else '') + (f"; still open: {x.get('after')}" if x.get('after') else ''))
        if v['repairs']: notes.append("Coherence repairs: " + '; '.join(f"{r['state']}: {r['repair']} ({', '.join(r['changes']) if isinstance(r['changes'], list) else r['changes']})" for r in v['repairs']))
    for l in v['log']:
        if l.get('reason_code') == 'state_gate_yielded': notes.append(f"Gate: {l['state']} yielded to a conflicting State by rule {l.get('rule')} (tried {l.get('tried')}).")
        if l.get('reason_code') == 'state_gate_exhausted': notes.append(f"Gate: {l['state']} exhausted every expression ({l.get('tried')}); every prescription already at a band floor or the pool is thin.")
    if v['redundancy']: notes.append(f"Compound redundancy trimmed (family limit {v['redundancy'].get('family_limit')}): " + '; '.join(f"{c['exercise']} {c['from']} → {c['to']}" for c in v['redundancy']['changes']))
    if v['near_failure']: notes.append(f"Within a rep of failure: {', '.join(v['near_failure'])}.")
    if v['demanding']: notes.append(f"Demanding compounds (systemic 4+): {', '.join(v['demanding'])}.")
    return notes
