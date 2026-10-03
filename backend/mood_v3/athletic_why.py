"""Athletic personalization contract + Built for Today synthesis (V3 Athletic rebuild).

Same discipline as Strength and Sweat: every input records what it intended and what it actually changed in the finished
session; consumer copy is composed only from realized consequences (claims are returned for the audit). No sentence here
describes a change that the generator did not make.
"""
from __future__ import annotations
import hashlib
from .engines.athletic import athletic_core as C
from .engines.athletic.athletic_core import EX, QUALITY_LABEL, STRUCTURE_LABEL, PB

STATE_WORD = {'low_energy': 'low on energy', 'bored': 'bored', 'irritated': 'irritated', 'amped': 'amped', 'stressed': 'stressed'}
GOAL_INTENT = {'improve_athleticism': 'speed_power_reactive_emphasis', 'build_strength': 'force_oriented_athletic_strength_and_loaded_power',
               'build_muscle': 'athletic_with_more_support_volume', 'lose_weight_conditioning': 'repeatable_output_not_sweat',
               'feel_better_reduce_stress': 'accessible_lower_impact_moderate', 'stay_consistent': 'balanced_default'}


def _u(seed, key): return int(hashlib.md5(f'{seed}|{key}'.encode()).hexdigest()[:8], 16) / 16 ** 8
def pick(opts, seed, key):
    opts = [o for o in opts if o]; return opts[int(_u(seed, key) * len(opts)) % len(opts)] if opts else ''
def _join(parts):
    parts = [p for p in parts if p]
    if not parts: return ''
    return parts[0] if len(parts) == 1 else ', '.join(parts[:-1]) + ' and ' + parts[-1]
def _n(i): return EX[i]['name']
def _low(s): return s[0].lower() + s[1:] if s and not s[:2].isupper() else s


def _items(out):
    return [x for b in out['sess']['blocks'] for x in b['items']]


def _rx(x):
    if x.get('distance_m'): return f"{x['sets']} × {x['distance_m']} m"
    if x.get('seconds'): return f"{x['sets']} × {x['seconds']} s" + ('/side' if x['per_side'] else '')
    return f"{x['sets']} × {x['reps']}" + ('/side' if x['per_side'] else '')


# ---------------------------------------------------------------- contract
def contract(nctx, out, history, res=None):
    sess = out['sess']; A = out['A']; ctx = out['ctx']; lv = ctx['lv']; goal = ctx['goal']; dur = ctx['dur']
    its = _items(out); st = [x for x in its if x['cls'] == 'strength']; prim = PB(sess)['items'][-1]
    P = []
    for s in ctx['states']:
        rz = out['realized'].get(s, [])
        P.append(dict(input='state', value=s, intended=C.STATE_INTENT[s], owns=[k for k, v in out['d']['owners'].items() if v == s],
                      kinds=[k for k, _ in rz], realized=[d for _, d in rz], satisfied=out['verdict'][s]['satisfied'], coherent=out['verdict'][s]['coherent']))
    if ctx['sore']:
        rl = []
        if ctx['sore'] & C.LOWER: rl.append(f"primary quality {QUALITY_LABEL[sess['pq']]}: no jumping, sprinting or loaded leg work")
        loaded = [_n(x['id']) for x in its if set(EX[x['id']]['prim']) & ctx['sore']]
        if not loaded: rl.append('no exercise loads the sore area as a primary mover')
        if 'spinal_erectors' in ctx['sore']: rl.append('no loaded hinges, Olympic lifts or rotational slams')
        if ctx['sore'] & {'shoulders', 'front_delts'}: rl.append('no overhead or pressing power')
        P.append(dict(input='soreness', value=sorted(ctx['sore']), intended=C.STATE_INTENT['sore'], realized=rl))
    rl = []
    L = C.limits(lv, dur, out['d'])
    rl.append(f"{A['contacts']} landings (level ceiling {L['contacts']})")
    if lv == 'beginner':
        rl += ['no Olympic lifts, no high-impact or reactive jumps', f"every movement at complexity {A['max_cx']} or less"]
    elif lv == 'advanced':
        tech = [_n(x['id']) for x in its if EX[x['id']]['cx'] >= 3 or EX[x['id']]['impact'] == 'high']
        if tech: rl.append('advanced vocabulary: ' + ', '.join(tech[:3]))
        if sess['structure'] == 'contrast': rl.append('contrast pairing (advanced)')
    P.append(dict(input='experience', value=lv, intended='skill_and_impact_match_level', realized=rl))
    rl = []
    if st:
        a = st[0]; rl.append(f"{_n(a['id'])} {a['sets']} × {a['reps']} at about {a['rir']} RIR")
    rl.append(f"primary quality {QUALITY_LABEL[sess['pq']]}, structure {STRUCTURE_LABEL[sess['structure']]}")
    if any(b['role'] == 'finisher' for b in sess['blocks']): rl.append('a short, self-limiting finisher for the conditioning goal')
    P.append(dict(input='goal', value=goal, intended=GOAL_INTENT.get(goal, 'balanced_default'), realized=rl))
    if ctx['target'] or ctx['full_body']:
        tg = list(ctx['target']) or ['full_body']
        rl = []
        hit = [_n(x['id']) for x in its if set(EX[x['id']]['prim']) & set(ctx['target'])]
        if hit: rl.append('works the Target directly: ' + ', '.join(hit[:3]))
        rl.append(f"athletic identity kept: primary quality {QUALITY_LABEL[sess['pq']]}")
        P.append(dict(input='target', value=tg, intended='shape_support_and_power_choice_without_losing_athletic_identity', realized=rl))
    P.append(dict(input='duration', value=dur, intended='use_the_window_for_quality_not_fill_it',
                  realized=[f"about {round(A['est'])} min including {A['wu_min']:g} min of preparation", f"{A['n_items']} exercises, {A['explosive_sets']} explosive sets"]))
    if history:
        last = history[0]; rl = []
        if last.get('primary_quality') and last['primary_quality'] != sess['pq']: rl.append(f"primary quality moved from {QUALITY_LABEL.get(last['primary_quality'])} to {QUALITY_LABEL[sess['pq']]}")
        if last.get('structure') and last['structure'] != sess['structure']: rl.append(f"structure moved from {STRUCTURE_LABEL.get(last['structure'])} to {STRUCTURE_LABEL[sess['structure']]}")
        if last.get('primary_id') and last['primary_id'] != sess['primary_id']: rl.append(f"primary exercise changed ({_n(last['primary_id'])} -> {_n(sess['primary_id'])})" if last['primary_id'] in EX else 'primary exercise changed')
        P.append(dict(input='history', value=len(history), intended='useful_variation_penalties_not_bans', realized=rl))
    return P


# ---------------------------------------------------------------- Built for Today
def _strategy(out, seed):
    sess = out['sess']; blocks = sess['blocks']; q = QUALITY_LABEL[sess['pq']]
    prim_b = PB(sess); prim = prim_b['items'][-1]
    sec = next((b for b in blocks if b['role'] == 'secondary'), None)
    ters = [b for b in blocks if b['role'] == 'tertiary']
    st_x = [x for b in blocks if b['role'] == 'strength' for x in b['items'] if x['cls'] == 'strength']
    stb = dict(items=st_x) if st_x else None
    st_names = _join([_n(x['id']) for x in st_x]) if st_x else ''
    claims = [('structure', sess['structure']), ('primary_quality', sess['pq'])]
    if sess['structure'] == 'contrast':
        s_x = prim_b['items'][0]
        t = f"Today is primarily {q}: heavy {_n(s_x['id'])} paired with {_n(prim['id'])}, so the heavy set primes the explosive one, with full recovery after every pair"
    else:
        pr = next((b['items'][-1] for b in blocks if b['role'] == 'primer'), None)
        t = (f"Today is primarily {q}: two quick sets of {_n(pr['id'])} prime the {_n(prim['id'])}, which comes next while you're fresh" if pr
             else f"Today is primarily {q}: {_n(prim['id'])} comes first, while you're fresh")
    # each further element is described by its true quality; a repeated quality is said as "more", never relabelled as something new
    seen = {sess['pq']}; parts = []
    for b in ([sec] if sec else []) + ters:
        bq = b['quality']; parts.append(f"{_n(b['items'][0]['id'])} for {'more ' if bq in seen else ''}{QUALITY_LABEL[bq]}"); seen.add(bq)
        claims.append(('secondary' if b is sec else 'tertiary', bq))
    if parts: t += ', then ' + _join(parts)
    if stb:
        t += f", and {st_names}, done for bar speed, {'build' if len(stb['items']) > 1 else 'builds'} the strength behind it"; claims.append(('strength', stb['items'][0]['pattern']))
    return t + '.', claims


def _state_sentence(s, out, seed):
    R = dict(out['realized'].get(s, [])); v = out['verdict'].get(s, {}); sess = out['sess']; its = _items(out)
    prim = PB(sess)['items'][-1]; st = [x for x in its if x['cls'] == 'strength']
    W = STATE_WORD[s]; kinds = list(R)
    if s == 'low_energy':
        bits = []
        if 'fewer_qualities' in R: bits.append(R['fewer_qualities'])
        if 'fewer_explosive_sets' in R: bits.append(f"{R['fewer_explosive_sets'].split(' instead')[0]}")
        if 'simpler_movements' in R: bits.append('simple movements')
        if 'longer_recovery' in R: bits.append(f"{prim['rest']} s of recovery between primary sets")
        if 'easier_strength' in R and st: bits.append(f"strength sets that stop about {st[0]['rir']} reps short of failure")
        elif 'less_strength_volume' in R: bits.append('less strength volume')
        if not bits: return None, []
        return (f"You're {W}, so today's athletic work stays focused: {_join(bits[:3])}. You still train explosively without turning the session into a grind."), [('state', s, k) for k in kinds]
    if s == 'amped':
        bits = []
        if 'contrast' in R: bits.append(f"a heavy-light contrast pair ({_n(PB(sess)['items'][0]['id'])} into {_n(prim['id'])})")
        loaded = [x for x in st if EX[x['id']]['eq'] not in ('bodyweight', 'suspension_trainer', 'pullup_bar')]
        if 'heavier_strength' in R and loaded: bits.append(f"heavier strength work ({_n(loaded[0]['id'])} at {loaded[0]['reps']} reps, about {loaded[0]['rir']} from failure)")
        elif 'heavier_strength' in R and st: bits.append(f"harder strength sets ({_n(st[0]['id'])}, about {st[0]['rir']} reps from failure)")
        if 'extra_quality_set' in R: bits.append(f"one extra quality set of {_n(prim['id'])}")
        elif 'demanding_variation' in R and 'contrast' not in R: bits.append(f"a more demanding primary, {_n(prim['id'])}")
        if not bits: return None, []
        kinds_ = {x['kind'] for x in its if x['cls'] == 'power'}
        pw_word = _join([w for w, ks in (('jumps', C.JUMP_KINDS), ('sprints', {'sprint'}), ('sled pushes', {'sled'}), ('throws', C.THROW_KINDS | {'upper', 'landmine_rot'}), ('lifts', C.OLY_KINDS | {'swing'})) if kinds_ & ks]) or 'power work'
        return (f"You're {W}, so we're spending that readiness on quality rather than piling on volume: {_join(bits[:2])}, with the {pw_word} kept low-rep and explosive."), [('state', s, k) for k in kinds]
    if s == 'irritated':
        f = [n for n in (R.get('forceful_movements') or '').split(', ') if n]
        if not f: return None, []
        return (f"You're {W}, so the session keeps things direct with {_join(f[:3])}. The reps stay low enough that the explosive work stays explosive."), [('state', s, k) for k in kinds]
    if s == 'stressed':
        if 'simple_structure' not in R and 'no_reactive_chaos' not in R: return None, []
        return (f"You're {W}, so there are no complicated reaction drills today: a simple {STRUCTURE_LABEL[sess['structure']].lower()} structure with {len(its)} exercises you can repeat without thinking about a dozen moving parts."), [('state', s, k) for k in kinds]
    if s == 'bored':
        bits = []
        if 'new_quality' in R: bits.append(f"a new focus ({QUALITY_LABEL[sess['pq']]})")
        if 'less_common_structure' in R or 'new_structure' in R: bits.append(f"a {STRUCTURE_LABEL[sess['structure']]} structure")
        if 'novel_primary' in R: bits.append(_n(prim['id']))
        elif 'novel_movements' in R: bits.append(R['novel_movements'].split(', ')[0])
        if 'different_plane' in R and len(bits) < 3: bits.append(f"{R['different_plane'].replace('/', ' and ')} work")
        if 'different_tools' in R and len(bits) < 3: bits.append(f"different tools ({R['different_tools'].replace('_', ' ')})")
        if not bits: return (f"You're {W}, but the options for something new are limited with this setup today, so the session keeps a familiar {QUALITY_LABEL[sess['pq']]} focus."), [('state', s, 'limited')]
        return (f"You're {W}, so we're changing the movement experience with {_join(bits[:3])} rather than simply adding more work."), [('state', s, k) for k in kinds]
    return None, []


PAIR_TEXT = {
    frozenset({'low_energy', 'amped'}): lambda o, p, st: f"You're low on energy but amped, so there are fewer efforts and every one is all-out: {_rx(p)} {_n(p['id'])}" + (f", plus heavier {_n(st[0]['id'])} sets at the same volume" if st else '') + '.',
    frozenset({'amped', 'stressed'}): lambda o, p, st: f"You're amped and stressed, so the load goes up but the structure stays simple: {_n(p['id'])} first" + (f", then {_n(st[0]['id'])} at {st[0]['reps']} reps, heavier than usual" if st else '') + ', with no complicated drills.',
    frozenset({'bored', 'stressed'}): lambda o, p, st: f"You're bored and stressed, so the movements are new but the structure stays simple: {_n(p['id'])} and {len(_items(o))} exercises in a straightforward order.",
    frozenset({'irritated', 'low_energy'}): lambda o, p, st: f"You're irritated and low on energy, so the work is direct and forceful but there is less of it: {_rx(p)} {_n(p['id'])} with full recovery.",
    frozenset({'irritated', 'stressed'}): lambda o, p, st: f"You're irritated and stressed, so it's simple explosive work without complicated drills: {_n(p['id'])} first, then straightforward strength.",
    frozenset({'bored', 'low_energy'}): lambda o, p, st: f"You're bored and low on energy, so the session tries something different ({_n(p['id'])}) while keeping the total work modest.",
}
PAIR_NEEDS = {frozenset({'low_energy', 'amped'}): ('low_energy',), frozenset({'amped', 'stressed'}): ('stressed',), frozenset({'bored', 'stressed'}): ('bored', 'stressed'),
              frozenset({'irritated', 'low_energy'}): ('irritated', 'low_energy'), frozenset({'irritated', 'stressed'}): ('irritated', 'stressed'),
              frozenset({'bored', 'low_energy'}): ('bored', 'low_energy')}


def _sore_sentence(out):
    ctx = out['ctx']; sess = out['sess']
    if not ctx['sore']: return None
    prim = PB(sess)['items'][-1]
    if ctx['sore'] & C.LOWER:
        sec = next((b for b in sess['blocks'] if b['role'] == 'secondary'), None)
        return f"Your legs are sore, so the power work moves to the upper body: {_n(prim['id'])}" + (f" and {_n(sec['items'][0]['id'])}" if sec else '') + ', with no jumping or sprinting.'
    if 'spinal_erectors' in ctx['sore']: return 'Your lower back is sore, so there are no loaded hinges, Olympic lifts or rotational slams today.'
    if ctx['sore'] & {'shoulders', 'front_delts'}: return f"Your shoulders are sore, so the power work stays in the lower body ({_n(prim['id'])}) and nothing is pressed or thrown overhead."
    return "Today's session keeps load off the sore area."


def compose(ctx_n, res):
    out = res['w']; ctx = out['ctx']; seed = ctx['seed']
    sents = []; claims = []
    so = _sore_sentence(out)
    if so: sents.append(so); claims.append(('soreness', 'sore'))
    states = list(ctx['states'])
    pair = next((p for p in PAIR_TEXT if p <= set(states)), None)
    its = _items(out); prim = PB(out['sess'])['items'][-1]; st = [x for x in its if x['cls'] == 'strength']
    done = set()
    if pair and all(out['realized'].get(s) for s in PAIR_NEEDS[pair]):
        sents.append(PAIR_TEXT[pair](out, prim, st)); claims += [('state', s, k) for s in pair for k, _ in out['realized'].get(s, [])]; done |= set(pair)
    for s in states:
        if s in done or len(sents) >= 3: continue
        t, c = _state_sentence(s, out, seed)
        if t: sents.append(t); claims += c
    strat, c2 = _strategy(out, seed)
    sents.append(strat); claims += c2
    return dict(text=' '.join(sents[:3]), claims=claims)


def workload_line(res):
    out = res['w']; A = out['A']; sess = out['sess']
    prim = PB(sess)['items'][-1]
    bits = []
    if A['contacts']: bits.append(f"about {A['contacts']} landings")
    if A['sprint_exposures']: bits.append(f"{A['sprint_exposures']} sprint efforts")
    if A['sled_efforts']: bits.append(f"{A['sled_efforts']} sled pushes")
    if A['throws']: bits.append(f"{A['throws']} throws")
    if not bits: bits.append(f"{A['explosive_sets']} explosive sets")
    return f"{_join(bits).capitalize()} in all, with {prim['rest']} s between primary sets so every rep stays explosive."
