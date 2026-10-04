"""Sweat personalization contract + Built for Today synthesis + trainer notes.

Same discipline as frozen Strength: every input records what it intended and what it actually changed in the finished session;
the consumer copy is composed from strategies that rest on those realized consequences (claims are returned for the audit);
the trainer layer explains the whole session, including the workload budget.
"""
from __future__ import annotations
import hashlib
from .engines.sweat import sweat_core as SC
from .engines.sweat.sweat_core import EX, SHAPE_NAME, ARCH_NAME

STATE_WORD = {'low_energy': 'low on energy', 'bored': 'bored', 'irritated': 'irritated', 'amped': 'amped', 'stressed': 'stressed'}
GOAL_INTENT = {'lose_weight_conditioning': 'density_and_sustained_active_minutes', 'improve_athleticism': 'powerful_output_sleds_carries_intervals', 'build_muscle': 'muscular_endurance_stations',
               'build_strength': 'loaded_carries_and_sleds_conditioning_first', 'feel_better_reduce_stress': 'rhythmic_sustainable_work', 'stay_consistent': 'balanced_default'}


def _u(seed, key):
    return int(hashlib.md5(f'{seed}|{key}'.encode()).hexdigest()[:8], 16) / 16 ** 8


def pick(opts, seed, key):
    opts = [o for o in opts if o]; return opts[int(_u(seed, key) * len(opts)) % len(opts)] if opts else ''


def _join(parts):
    parts = [p for p in parts if p]
    if not parts: return ''
    return parts[0] if len(parts) == 1 else ', '.join(parts[:-1]) + ' and ' + parts[-1]


def _fmt_engine(B):
    bits = []
    for k, v in (B.get('engine') or {}).items():
        eid, kind = k.rsplit(' ', 1); name = EX[eid]['name']
        if kind == 'distance': bits.append(f"{int(v):,} m {name}")
        elif kind == 'calories': bits.append(f"{int(v)} cal {name}")
        else: bits.append(f"{int(v // 60)} min {name}")
    return _join(bits)


# ---------------------------------------------------------------- contract
def contract(nctx, out, history):
    w = out['w']; res = out['res']; B = out['budget']; blocks = w['blocks']; p = blocks[0]; exp = nctx['experience']; goal = nctx.get('goal'); dur = nctx['duration']
    P = []
    for s in res['states']:
        rz = out['realized'].get(s, [])
        P.append(dict(input='state', value=s, intended=SC.STATE_INTENT[s], expression=res['expressions'].get(s), kinds=[x['kind'] for x in rz],
                      realized=[d for x in rz for d in x['detail']], realized_by_kind=[x['detail'] for x in rz]))
    # soreness
    ctx = w['_ctx']; sore = sorted(ctx.get('sore_all') or [])
    if sore:
        rl = []
        if out.get('rerouted') or any(l.get('reason_code') == 'sore_reroute' for l in out['log']): rl.append(f"routed to {ARCH_NAME[w['archetype_id']]}, away from the sore {', '.join(sore)}")
        if ctx.get('sore_override'): rl.append(f"{', '.join(sorted(ctx['sore_override']))} trained as asked despite soreness")
        loaded = [e['name'] for b in blocks for e in b['items_e'] if set(e['prim']) & set(ctx['sore_eff'])]
        if not loaded and ctx['sore_eff']: rl.append(f"no station loads the sore {', '.join(sorted(ctx['sore_eff']))} directly")
        sec = [e['name'] for b in blocks for e in b['items_e'] if set(e['sec']) & set(ctx['sore_eff']) and e['name'] not in loaded]
        if sec: rl.append(f"{len(sec)} station{'s' if len(sec) != 1 else ''} still use{'s' if len(sec) == 1 else ''} it as a secondary mover ({', '.join(sec[:3])})")
        if any(e['impact'] == 'high' for b in blocks for e in b['items_e']) is False and ctx['sore_eff'] & SC.LOWER: rl.append('no high-impact work on sore legs')
        P.append(dict(input='soreness', value=sore, intended='protect_sore_region', realized=rl))
    # experience
    rl = []
    if exp == 'beginner':
        rl += [f"RPE capped at {max(b['rpe'][1] for b in blocks)}", f"{'no' if not any(e['impact'] == 'high' for b in blocks for e in b['items_e']) else 'one'} high-impact movement", f"{len([e for e in p['items_e'] if e['role'] != 'engine'])} stations in the main block"]
        if p['structure'] == 'intervals' and p.get('interval_target') and not p['interval_target'].get('rotate'): rl.append(f"recovery {p['interval_target']['recovery']} s ≥ work {p['interval_target']['work']} s" if p['interval_target']['recovery'] >= p['interval_target']['work'] else f"work {p['interval_target']['work']} s / recovery {p['interval_target']['recovery']} s")
        if p['structure'] not in ('emom', 'ladder', 'pyramid'): rl.append('predictable structure (no EMOM / ladder / pyramid)')
    elif exp == 'advanced':
        if p['rpe'][1] >= 8: rl.append(f"main block to RPE {p['rpe'][1]}")
        if B['duty'] >= 0.75: rl.append(f"duty cycle {B['duty']:.0%} (dense)")
        if p.get('shape') in ('emom', 'ladder', 'ladder_hybrid', 'anchor_triplet', 'short_intervals'): rl.append(f"{SHAPE_NAME.get(p.get('shape'), p.get('shape'))} shape")
        if B['engine_min'] >= 18: rl.append(f"{B['engine_min']} min of engine work")
    else:
        if p.get('shape') in ('emom', 'ladder', 'pyramid', 'short_intervals'): rl.append(f"{SHAPE_NAME.get(p.get('shape'))} (intermediate and up)")
    P.append(dict(input='experience', value=exp, intended='match_conditioning_vocabulary_to_level', realized=rl))
    # goal
    rl = []; shape = p.get('shape')
    if goal == 'lose_weight_conditioning':
        if B['duty'] >= 0.7: rl.append(f"duty cycle {B['duty']:.0%}: the session keeps moving")
        if B['active_min'] >= (30 if dur == 60 else 16): rl.append(f"{B['active_min']} active minutes")
        if shape in ('continuous', 'timed', 'anchor_couplet', 'long_intervals'): rl.append(f"{SHAPE_NAME.get(shape)} shape (conditioning goal weights it up)")
    elif goal == 'improve_athleticism':
        tools = [e['name'] for b in blocks for e in b['items_e'] if e['mod'] in ('sled', 'throw', 'jump') or e['pat'] == 'carry']
        if tools: rl.append(f"power and output tools: {', '.join(dict.fromkeys(tools))}")
        if shape in ('short_intervals', 'pyramid', 'split_anchor'): rl.append(f"{SHAPE_NAME.get(shape)} shape (athleticism goal weights it up)")
    elif goal == 'build_muscle':
        res_st = [e['name'] for b in blocks for e in b['items_e'] if e['role'].startswith('resistance')]
        if res_st: rl.append(f"resistance stations for muscular endurance: {', '.join(dict.fromkeys(res_st))}")
    elif goal == 'build_strength':
        tools = [e['name'] for b in blocks for e in b['items_e'] if e['pat'] == 'carry' or e['mod'] == 'sled']
        if tools: rl.append(f"loaded carries / sleds inside the conditioning: {', '.join(dict.fromkeys(tools))}")
        if shape == 'split_anchor': rl.append('split anchor shape (bigger station blocks)')
    elif goal == 'feel_better_reduce_stress':
        if shape in ('continuous', 'long_intervals', 'rounds', 'anchor_couplet'): rl.append(f"{SHAPE_NAME.get(shape)} shape: rhythmic, sustainable")
        if max(b['rpe'][1] for b in blocks if b['structure'] != 'finisher') <= 8: rl.append('nothing above RPE 8')
    else:
        if shape in ('rounds', 'long_intervals', 'anchor_couplet'): rl.append('balanced default shape')
    P.append(dict(input='goal', value=goal, intended=GOAL_INTENT.get(goal, 'balanced_default'), realized=rl))
    # target
    if nctx['target_mode'] == 'explicit':
        T = list(nctx['target_muscles']); rl = []
        cov = [e['name'] for e in p['items_e'] if e['role'] != 'engine' and ({SC.roll(m) for m in e['prim'] + e['sec']} & set(T))]
        if cov: rl.append(f"stations lean into {' + '.join(T)}: {', '.join(cov)}")
        eng = [e['name'] for b in blocks for e in b['items_e'] if e['role'] == 'engine']
        if eng: rl.append(f"{eng[0]} keeps the session conditioning-first")
        P.append(dict(input='target', value=T, intended='route_station_selection_keep_sweat_identity', realized=rl))
    # archetype and structure
    arch_why = next((l for l in out['log'] if l.get('reason_code') == 'archetype_selected'), None)
    rl = [f"{ARCH_NAME[w['archetype_id']]} " + ('(your choice)' if nctx.get('archetype') else ("(Target routes to Circuit)" if nctx['target_mode'] == 'explicit' else "(MOOD's Pick: goal rotation, least recently used, State affinity)"))]
    P.append(dict(input='archetype', value=w['archetype_id'], intended='conditioning_type_for_today', realized=rl))
    rl = [f"{SHAPE_NAME.get(shape, shape)}: {_structure_line(p)}"]
    if len(blocks) > 1 and blocks[1]['structure'] != 'finisher': rl.append(f"complement: {blocks[1].get('comp_type') or blocks[1]['structure']} ({round(SC.block_minutes(blocks[1], exp))} min)")
    if B['finisher']: rl.append('finisher: ' + ', '.join(e['name'] for b in blocks if b['structure'] == 'finisher' for e in b['items_e']))
    P.append(dict(input='structure', value=shape, intended='conditioning_structure_and_dose', realized=rl))
    # duration
    cm = res.get('completeness') or {}
    P.append(dict(input='duration', value=dur, intended='use_the_available_window_for_the_best_session_not_fill_it', realized=[f"estimated {w['est_minutes']} min for a {dur}-minute window ({B['active_min']} active, {B['recovery_min']} recovery, {B['transition_min']} transitions)"] +
                  ([f"main block stimulus: {cm['label']} (score {cm['score']} vs {cm['thresholds'][0]} / {cm['thresholds'][1]})"] if cm else []) +
                  ([l['detail'] for l in out['log'] if l.get('reason_code') in ('duration_backfill', 'duration_trim')][:3])))
    P.append(dict(input='equipment', value=nctx['equipment'], intended='availability_only', realized=[l['detail'] for l in out['log'] if l.get('reason_code') == 'archetype_skipped_equipment'][:1]))
    # history
    same = [h for h in history if h.get('archetype') == w['archetype_id']]; rl = []
    if same:
        last = same[-1]
        if last.get('shape') and last.get('shape') != shape: rl.append(f"different shape from last {ARCH_NAME[w['archetype_id']]} ({SHAPE_NAME.get(last['shape'], last['shape'])})")
        eng_now = next((e['id'] for b in blocks for e in b['items_e'] if e['role'] == 'engine'), None)
        if last.get('engine') and eng_now and last['engine'] != eng_now: rl.append(f"{EX[eng_now]['name']} instead of last time's {EX[last['engine']]['name']}")
        new = [e['name'] for e in p['items_e'] if e['id'] not in set(last.get('exercises', []))]
        if new: rl.append(f"{len(new)} station{'s' if len(new) != 1 else ''} not in your last {ARCH_NAME[w['archetype_id']]}")
    P.append(dict(input='history', value=(f"{len(history)} completed Sweat session(s)" if history else 'first session'), intended='vary_shape_modality_and_stations', realized=rl))
    return P


def _structure_line(p):
    s = p['structure']; it = p.get('interval_target') or {}
    if s == 'continuous': return f"{p['duration_s'] // 60} min continuous at RPE {p['rpe'][0]}–{p['rpe'][1]}"
    if s == 'pyramid': return f"pyramid {'-'.join(str(x // 60) + ':' + f'{x % 60:02d}' for x in it['steps'])} with {it['recovery']} s easy"
    if s == 'intervals' and not it.get('rotate'): return f"{it['rounds']} × {it['work']} s / {it['recovery']} s easy"
    if s == 'intervals': return f"{it['rounds']} rounds × {len(p['items_e'])} stations at {it['work']} s / {it['recovery']} s"
    if s == 'emom': return f"EMOM {p['minutes']} min"
    if s == 'ladder': return f"ladder {'-'.join(map(str, p['ladder']))}"
    if s == 'circuit' and p.get('anchor'):
        n = len(p['round_stations']); ad = p.get('anchor_doses')
        a = ('/'.join(SC.G.dose_txt(p['anchor'], x) for x in ad) if ad else SC.G.dose_txt(p['anchor'], p['anchor_dose']))
        return f"{n} rounds: {p['anchor']['name']} {a} + {len(p['stations'])} stations, {p['round_rest']} s between rounds"
    if s == 'circuit': return f"{p['rounds']} rounds × {len(p['items_e'])} stations, {p['round_rest']} s between rounds"
    return s


# ---------------------------------------------------------------- strategies -> copy
def compose(ctx, res):
    """-> dict(text, claims) or None. res is the adapter result (has 'personalization', 'w', 'budget', 'log')."""
    P = res.get('personalization') or []
    if not P: return None
    w = res['w']; B = res.get('budget') or {}; p = w['blocks'][0]; exp = getattr(ctx, 'experience', None); goal = getattr(ctx, 'goal', None)
    seed = f"{getattr(ctx, 'user_key', 'u')}|{getattr(ctx, 'date', 'd')}"
    byin = {}
    for e in P: byin.setdefault(e['input'], []).append(e)
    st = {e['value']: e for e in byin.get('state', []) if e.get('realized')}
    kinds = {s: set(e.get('kinds', [])) for s, e in st.items()}
    arch = ARCH_NAME[w['archetype_id']]; shape = SHAPE_NAME.get(p.get('shape'), p.get('shape')); eng = next((e for e in p['items_e'] if e['role'] == 'engine'), None)   # main-block machine only: a complement's machine is not where the State acted
    en = eng['name'] if eng else None
    stations = [e['name'] for e in p['items_e'] if e['role'] != 'engine']
    tools = [e['name'] for b in w['blocks'] for e in b['items_e'] if e['role'] != 'engine' and (e['mod'] in ('sled', 'rope', 'throw') or e['pat'] == 'carry' or e['forceful'])]
    fin = next((e['name'] for b in w['blocks'] if b['structure'] == 'finisher' for e in b['items_e']), None)
    S = []
    def add(i, pr, text, claims): S.append(dict(id=i, priority=pr, text=text, claims=claims))
    def backed(inp, val): return any(e.get('realized') for e in byin.get(inp, []) if e.get('value') == val)
    lvl_ok = backed('experience', exp); goal_ok = backed('goal', goal)
    # ---- pairs
    if {'amped', 'stressed'} <= set(st):
        ka = kinds.get('amped', set())
        where = (' on the ' + en) if (en and w['archetype_id'] != 'sweat_circuit') else (' in the main block' if w['archetype_id'] == 'sweat_circuit' else '')
        how = 'a harder main block' if 'rpe' in ka else ('an extra round' if 'volume' in ka else ('tighter rest' if 'recovery' in ka else 'the output'))
        if how != 'the output' and where == ' in the main block': where = ''
        add('amped_stressed', 10, f"You're amped but stressed, so the session stays simple and predictable{(' (' + shape + ')') if shape else ''} and the extra energy goes into {how}{where} rather than into a busier structure.", [('state', 'amped'), ('state', 'stressed')])
    if {'low_energy', 'amped'} <= set(st) or ('low_energy' in st and any(l.get('reason_code') == 'state_gate_yielded' and l.get('state') == 'amped' for l in w.get('adjustments', []))):
        ka = kinds.get('amped', set())
        how = 'one harder' if 'rpe' in ka else ('one denser' if 'recovery' in ka else 'one focused')
        txt = f"You're amped but running on less energy than usual, so energy sets the workload and the readiness goes into {how}{(' ' + en) if en else ''} block. Everything else stays steady and sustainable."
        add('amped_low_energy', 10, txt, [('state', 'low_energy')] + ([('state', 'amped')] if 'amped' in st else [('state_yielded', 'amped')]))
    if {'bored', 'stressed'} <= set(st):
        add('bored_stressed', 10, f"You're bored and stressed, so the novelty is in the movements{(': ' + _join(stations[:3])) if stations else ''} while the structure stays a fixed, repeatable {shape}.", [('state', 'bored'), ('state', 'stressed')])
    if {'irritated', 'low_energy'} <= set(st):
        add('irritated_low_energy', 10, f"You're irritated but low on energy, so the work is direct and physical{(' (' + _join(tools[:3]) + ')') if tools else ''} at an output you can sustain, not maximal efforts.", [('state', 'irritated'), ('state', 'low_energy')])
    if {'irritated', 'stressed'} <= set(st):
        add('irritated_stressed', 10, f"You're irritated and stressed, so this is hard, simple work{(' on the ' + en) if en else ''} in a shape you can settle into: nothing fiddly, nothing frantic, just output.", [('state', 'irritated'), ('state', 'stressed')])
    if {'bored', 'low_energy'} <= set(st):
        add('bored_low_energy', 10, f"You're bored and low on energy, so the change of scenery comes from the modality and the stations, not from more work: {shape} at a sustainable effort.", [('state', 'bored'), ('state', 'low_energy')])
    if {'amped', 'bored'} <= set(st):
        add('amped_bored', 9, f"You're amped and bored, so the extra energy goes into a fresh shape ({shape}){(' with ' + _join(stations[:2])) if stations else ''}, pushed a notch harder.", [('state', 'amped'), ('state', 'bored')])
    covered = {c[1] for x in S for c in x['claims'] if c[0] == 'state'}
    # ---- single States
    if 'low_energy' in st and 'low_energy' not in covered:
        k = kinds['low_energy']
        if w['archetype_id'] == 'sweat_circuit':
            add('le', 8, f"You're low on energy, so today's circuit stays simple and sustainable: {_join(stations[:4])} at RPE {p['rpe'][0]}–{p['rpe'][1]}{', with fewer hard peaks' if 'rpe' in k else ''}. You'll keep moving, but nothing here asks you to empty the tank.", [('state', 'low_energy')])
        elif w['archetype_id'] == 'sweat_engine':
            add('le', 8, f"You're low on energy, so the work stays cyclical and steady on the {en}: {shape} at RPE {p['rpe'][0]}–{p['rpe'][1]}, something you can sustain rather than survive.", [('state', 'low_energy')])
        else:
            add('le', 8, f"You're low on energy, so the {en} anchor runs at a pace you can repeat and the stations stay simple and stable{(': ' + _join(stations[:3])) if stations else ''}. Steady output, not peaks.", [('state', 'low_energy')])
    if 'stressed' in st and 'stressed' not in covered:
        if w['archetype_id'] == 'sweat_engine':
            add('stressed', 8, f"You're stressed, so we're keeping this simple: one {en}, {shape} you can settle into, and a pace that gives your head something straightforward to hold on to.", [('state', 'stressed')])
        else:
            add('stressed', 8, f"You're stressed, so the session runs in fixed, repeatable rounds{(' of ' + _join(stations[:4])) if stations else ''} at a controlled effort: settle in and just work, no clock to race.", [('state', 'stressed')])
    if 'irritated' in st and 'irritated' not in covered:
        if tools:
            add('irr', 8, f"You're irritated, so that energy gets somewhere physical to go: {_join(dict.fromkeys(tools[:3]))}{(' around the ' + en) if en else ''}. The movements stay simple so you can focus on output, not coordination.", [('state', 'irritated')])
        else:
            add('irr', 8, f"You're irritated, so this is hard, direct work{(' on the ' + en) if en else ''}: {shape} at RPE {p['rpe'][0]}–{p['rpe'][1]}, simple enough to just push.", [('state', 'irritated')])
    if 'amped' in st and 'amped' not in covered:
        k = kinds['amped']
        what = _join([x for x in ['a harder pace' if 'rpe' in k else '', 'less downtime between efforts' if 'recovery' in k else '', 'an extra round' if 'volume' in k else '', ('a ' + fin + ' finisher') if fin and 'finisher' in k else ''] if x])
        add('amped', 8, f"You're amped, so that readiness goes into {what or 'more output'}{(' on the ' + en) if en else ''}." + (" You're advanced, so the session can carry more output without every round becoming all-out." if exp == 'advanced' and lvl_ok else ''), [('state', 'amped')] + ([('experience', 'advanced')] if exp == 'advanced' and lvl_ok else []))
    if 'bored' in st and 'bored' not in covered:
        k = kinds['bored']; novel = [e['name'] for e in p['items_e'] if e['nov'] >= 3]
        bits = [f"a {shape} structure" if ('shape' in k or 'structure' in k) else '', (f"the {en}" if 'modality' in k and en else ''), (f"movements you haven't seen recently ({_join(novel[:3])})" if novel else '')]
        add('bored', 8, f"You're bored, so we're changing the experience with {_join([b for b in bits if b]) or 'a different mix'}. The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work.", [('state', 'bored')])
    # ---- soreness
    sore = next((e for e in byin.get('soreness', []) if e.get('realized')), None)
    if sore:
        from .formatter import REGION_NAMES
        regs = [REGION_NAMES.get(r, r.replace('_', ' ')) for r in (getattr(ctx, 'sore_regions', None) or [])] or [str(x) for x in sore['value']]
        region = _join(list(dict.fromkeys(regs))); be = 'are' if (region.endswith('s') or ' and ' in region) else 'is'
        if any(r.startswith('routed') for r in sore['realized']): txt = f"Your {region} {be} sore, so today's conditioning moves to {arch}{(' on the ' + en) if en else ''}, away from that loading."
        elif any('trained as asked' in r for r in sore['realized']): txt = f"You asked to train {region} despite the soreness, so we kept your Target and chose the friendlier stations."
        else: txt = f"Your {region} {be} sore, so every station keeps that area out of the loading{'; the ' + en + ' carries the conditioning' if en else ''}."
        add('sore', 11, txt, [('soreness', 'sore')])
    # ---- level / goal / target
    claimed = {c for x in S for c in x['claims']}
    if lvl_ok and ('experience', exp) not in claimed:
        if exp == 'beginner': add('level', 5, pick([f"Since you're newer to conditioning, the effort stays at RPE {p['rpe'][1]} or below and the structure is one you can follow without watching a clock.", f"As a newer athlete you get a predictable structure, no high-impact work and an effort that leaves something in reserve."], seed, 'lv'), [('experience', 'beginner')])
        elif exp == 'advanced': add('level', 5, pick([f"You're advanced, so the session carries more output: {shape} with the main block to RPE {p['rpe'][1]}.", f"Since you're advanced, the density is higher and the main block runs to RPE {p['rpe'][1]}."], seed, 'lv'), [('experience', 'advanced')])
    if goal_ok and ('goal', goal) not in claimed:
        gp = {'lose_weight_conditioning': "Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.",
              'improve_athleticism': f"Your athleticism goal is why the output tools ({_join(dict.fromkeys(tools[:3]))}) are in here." if tools else "Your athleticism goal favours powerful, repeatable output.",
              'build_muscle': ("Your muscle goal is why the resistance stations run at moderate reps, but this stays conditioning first." if p.get('structure') != 'intervals' else "Your muscle goal is why the resistance stations get a full work interval at a controlled pace, but this stays conditioning first."),
              'build_strength': f"Your strength goal shows up as loaded work inside the conditioning{(': ' + _join(dict.fromkeys(tools[:2]))) if tools else ''}; the session stays Sweat.",
              'feel_better_reduce_stress': "Your feel-better goal keeps the work rhythmic and sustainable.", 'stay_consistent': "A balanced session, which is the point of a consistency goal."}.get(goal)
        if gp: add('goal', 4, gp, [('goal', goal)])
    tgt = next((e for e in byin.get('target', []) if e.get('realized')), None)
    if tgt:
        add('target', 6, f"You asked for {' + '.join(tgt['value'])}, so the stations lean that way{(' while the ' + en + ' keeps the session conditioning-first') if en else ''}.", [('target', 'target')])
    hist = next((e for e in byin.get('history', []) if e.get('realized')), None)
    if hist: add('history', 3, _cap(_join(hist['realized'][:2])) + '.', [('history', 'history')])
    if not S: return None
    S.sort(key=lambda x: -x['priority'])
    out = []; claims = []
    top = next((x for x in S if x['id'] not in ('sore', 'level', 'goal', 'target', 'history')), None)
    sore_s = next((x for x in S if x['id'] == 'sore'), None)
    if sore_s: out.append(sore_s['text']); claims += sore_s['claims']
    if top: out.append(top['text']); claims += top['claims']
    for sid in ('target', 'level', 'goal', 'history'):
        if len(out) >= 3: break
        x = next((y for y in S if y['id'] == sid and not (set(y['claims']) & set(claims))), None)
        if x: out.append(x['text']); claims += x['claims']
    return dict(text=' '.join(out[:3]), claims=claims)


def _cap(s): return s[0].upper() + s[1:] if s else s


def trainer_notes(ctx, res):
    w = res['w']; B = res.get('budget') or {}; blocks = w['blocks']; p = blocks[0]; notes = []
    notes.append(f"Session: {ARCH_NAME[w['archetype_id']]} / {SHAPE_NAME.get(p.get('shape'), p.get('shape'))}; {len(blocks)} block(s); est. {w['est_minutes']} min for {w['duration']} "
                 f"({B.get('active_min')} active, {B.get('recovery_min')} recovery, {B.get('transition_min')} transitions; duty {B.get('duty')}).")
    eng = _fmt_engine(B)
    notes.append(f"Workload budget: engine {eng or 'none'} ({B.get('engine_min')} min, {B.get('engine_bouts')} bouts, engine share {B.get('engine_share')}" + (f", anchor share {B.get('anchor_share')}" if B.get('anchor_share') is not None else '') +
                 f"); loaded reps {B.get('loaded_reps')}, bodyweight reps {B.get('bodyweight_reps')}; impact contacts {B.get('impact_contacts')} (high-impact items {B.get('high_impact_items')}); "
                 f"hard (RPE 8+) minutes {B.get('hard_min')} ({B.get('hard_share')}); all-out blocks {B.get('very_hard_blocks')}; stations {B.get('stations')}, fixed stations {B.get('fixed_stations')}, transitions {B.get('transitions')}; loaded hinges {B.get('loaded_hinges')}; demanding {B.get('demanding')}.")
    for pe in res.get('personalization', []):
        if pe['input'] in ('state', 'soreness', 'archetype', 'structure', 'target', 'experience', 'goal') and pe.get('realized'):
            notes.append(f"[{pe['input']}{'=' + str(pe['value']) if pe['input'] in ('state',) else ''}] " + '; '.join(pe['realized']))
    for st_, x in (res.get('coherence') or {}).items():
        notes.append(f"Coherence {st_}: {'PASS' if x.get('passed') else 'FAIL'}" + (f"; before repairs: {x.get('before')}" if x.get('before') else '') + (f"; still open: {x.get('after')}" if x.get('after') else ''))
    for l in res.get('log', []):
        if l.get('reason_code') == 'state_coherence_repair': notes.append(f"Coherence repair {l['state']}: {l['repair']} ({', '.join(l['changes'])})")
        if l.get('reason_code') == 'budget_repair': notes.append(f"Budget repair: {l.get('what')} {l.get('from', '')}{' → ' + str(l.get('to')) if l.get('to') else ''}")
        if l.get('reason_code') == 'budget_open': notes.append(f"Budget still open: {l.get('detail')}")
        if l.get('reason_code') in ('state_gate_yielded', 'state_gate_exhausted'): notes.append(f"Gate: {l['state']} {l['reason_code'].split('_')[-1]} ({l.get('tried')})")
    return notes
