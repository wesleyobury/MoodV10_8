"""MOOD V3 Athletic reference generator (FINAL FREEZE rules).
Deterministic: same inputs + same seed -> identical workout. Every build is validated by the frozen checker (sk5.check);
a build that cannot satisfy the checker is returned with status 'infeasible' and the reasons, never silently."""
import hashlib
from .lib3 import *
from .audit2 import EX, LV
from . import sk5
from .sk5 import X, QC, PSX

EL3 = sk5.EL3
BY = {}
for (i, a, s, c) in EL3: BY.setdefault((a, s), []).append((i, c))
PRESET_ALIAS = {'default': 'athletic_commercial_default', 'floor': 'commercial_floor_only', 'free_weight': 'free_weight_limited', 'bodyweight': 'bodyweight_floor'}
LIMITED_PRESETS = {'free_weight_limited', 'bodyweight_floor'}
CAP = {'beginner': 2, 'intermediate': 3, 'advanced': 5}

def h(seed, i):  # deterministic tie-break in [0,1)
    return int(hashlib.sha256(f'{seed}|{i}'.encode()).hexdigest()[:8], 16) / 2**32

def pool(a, s, lv, pre, sore=frozenset()):
    out = []
    for i, c in BY.get((a, s), []):
        e = EX[i]
        if not avail(e, pre): continue
        if s in EXPOSURE and not exposure_ok(e, lv): continue
        if (s == 'ps' or s.startswith('warmup')) and (e['cx'] > CAP[lv] or LV.index(e['skill']) > LV.index(lv)): continue
        if c == 'experience != beginner' and lv == 'beginner': continue
        if c == 'sore_region = lower' and not (sore & LOWER): continue
        if (set(e['prim']) | {roll(m) for m in e['prim']}) & sore: continue
        out.append(i)
    return out

# ------------------------------------------------------------------ State selection bias (frozen predicates; ranking, not filters)
STATE_PREF = {
 'low_energy': lambda e: e['cx'] <= 2 and e['impact'] != 'high' and e['sysd'] <= 3,
 'stressed':   lambda e: e['nov'] <= 2 and e['cx'] <= 2 and quality(e) != 'jump_combo',
 'bored':      lambda e: e['nov'] >= 3 or quality(e) == 'jump_combo' or vector(e) in ('lateral', 'rotational', 'multi'),
 'irritated':  lambda e: e['forceful'] and e['cx'] <= 2,
 'amped':      lambda e: True,
}

# ------------------------------------------------------------------ dosing (frozen Type A / Type B limits)
PER_SIDE_Q = {'hop', 'lateral_power', 'rotational_power', 'rotational_throw'}
def dose(e, lv):
    """-> kwargs for sk5.X (reps / sec / rest / per_side / work / dose text)."""
    i, q, B = e['id'], quality(e), pclass(e) == 'B'
    side = e['lat'] in ('unilateral', 'alternating') and (q in PER_SIDE_Q or q in ('upper_power', 'explosive_lift', 'jump_combo', 'throw')) and not B
    beg = lv == 'beginner'
    if i == 'kettlebell_swing': return dict(reps=15, rest=45, work=22, dose='heavy enough to snap; end the set when the hips stop snapping')
    if i == 'pogo_hop': return dict(sec=10 if beg else 20, rest=40, dose=f"{10 if beg else 20} s continuous, stay springy; end the set when rhythm drops")
    if i == 'reactive_vertical_jump': return dict(reps=8, rest=75, work=10, dose='springy, minimal ground contact; end the set when height drops')
    if i == 'skater_hop': return dict(reps=3, rest=60, per_side=True, work=5, dose='stick each landing')
    if i == 'split_jump': return dict(reps=10, rest=60, work=12, dose='alternate legs; end the set when height drops')
    if i == 'med_ball_slam': return dict(reps=8, rest=60, work=16, dose='hard slams; end the set when they lose snap')
    if i == 'mb_rotational_slam': return dict(reps=5, rest=60, per_side=True, work=8, dose='slam through the floor, alternate sides')
    if i in ('mb_chest_pass', 'mb_overhead_throw'): return dict(reps=6, rest=60, work=9, dose='throw hard; end the set when throws lose snap')
    if i == 'bear_crawl_ball_toss': return dict(reps=1, rest=60, work=20, dose='8 m, light ball, hips level')
    if i == 'sled_push': return dict(reps=1, rest=90, dose='10 m, light-moderate sled, drive fast')
    if i == 'acceleration_sprint': return dict(reps=1, rest=60 if beg else 75, dose='10 m, full walk-back')
    if i == 'falling_start_sprint': return dict(reps=1, rest=60, dose='5 m, explosive first steps')
    if i == 'sprint_to_stick': return dict(reps=1, rest=60, work=3, dose='5 m accelerate, stop in 2 steps')
    if i == 'alternating_bound': return dict(reps=4, rest=90, dose='4 contacts, max distance')
    if q == 'olympic': return dict(reps=3 if i == 'push_press' else 2, rest=120 if i == 'push_press' else 150, dose='light-moderate, every rep fast')
    if q == 'explosive_lift': return dict(reps=2 if side else 3, rest=120, per_side=side, dose='move it fast; pick a weight that stays fast')
    if q == 'loaded_jump': return dict(reps=3, rest=120, dose='light, max height or distance')
    if q == 'jump_combo': return dict(reps=2, rest=90, per_side=side, dose='max intent, stick the landing')
    if q == 'jump': return dict(reps=3, rest=120 if i == 'drop_jump' else (75 if beg else 90), dose='max effort, land soft and quiet')
    if q == 'hop': return dict(reps=3, rest=75, per_side=True, dose='stick each landing')
    if q == 'bound': return dict(reps=3, rest=120, dose='max distance, stick the last one')
    if q == 'lateral_power': return dict(reps=3, rest=75, per_side=True, dose='max distance, stick')
    if q == 'throw': return dict(reps=3 if side else 4, rest=60, per_side=side, dose='throw as hard as you can')
    if q == 'rotational_throw': return dict(reps=4, rest=60, per_side=True, dose='drive from the back hip')
    if q == 'rotational_power': return dict(reps=3, rest=90 if e['cx'] >= 4 else 75, per_side=True, dose='fast hips, punch through')
    if q == 'upper_power': return dict(reps=3 if side else 4, rest=90 if 'jerk' in i else 75, per_side=side, dose='dip and drive fast')
    return dict(reps=3, rest=90)
SPEED_REP_Q = {'acceleration', 'sled', 'decel'}
def base_sets(e, slot, dur, lv):
    q = quality(e)
    if q in SPEED_REP_Q or e['id'] == 'bear_crawl_ball_toss': return {'px': 6, 'sx': 6, 'sx2': 5}[slot]
    if slot == 'px': return 5
    return 4

# ------------------------------------------------------------------ exposure selection
def state_rank(e, ctx):                                   # WA rank 3: State predicate match
    return sum(1 for st in ctx['states'] if STATE_PREF.get(st, lambda e: False)(e) and st != 'amped')
def comp_rank(e, slot, ctx, chosen):                      # WA rank 4 (Athletic form): composition coverage
    if slot == 'px': return 0
    q = quality(e); s = 0
    gs = {QGROUP[quality(EX[c])] for c in chosen}; vs = {vector(EX[c]) for c in chosen}
    if QGROUP[q] not in gs: s += 2
    if vector(e) not in vs: s += 1
    if ctx['aid'] == 'athletic_full_body' and ctx['dur'] == 60 and slot == 'sx2' and not (ctx['sore'] & LOWER):
        have_l = any(is_lower(EX[c]) for c in chosen); have_u = any(is_upper_or_rot(EX[c]) for c in chosen)
        if (not have_l and is_lower(e)) or (not have_u and is_upper_or_rot(e)): s += 4
    if slot == 'sx' and ctx['aid'] == 'athletic_speed_agility' and q in ('decel', 'lateral_power'): s += 1
    return s
def same_arch(ctx): return [p for p in ctx['history'] if p.get('aid') == ctx['aid']]
def anchor(ctx):                                          # last completed session of this archetype (or displayed composition when swapping)
    if ctx.get('displayed'): return ctx['displayed'][0]
    h_ = same_arch(ctx); return h_[0]['ids'][0] if h_ and h_[0].get('ids') else None
def recency(e, ctx):                                      # WA rank 5 (non-protected): family then exercise, last 2 sessions of the archetype, displayed composition weight 2
    pen = 0
    for n, past in enumerate(same_arch(ctx)[:2]):
        w = 2 if n == 0 else 1
        if e['swap'] and e['swap'] in {EX[i]['swap'] for i in past.get('ids', []) if i in EX}: pen += 10 * w
        if e['id'] in past.get('ids', []): pen += w
    for i in ctx.get('displayed', []):
        if i in EX and EX[i]['swap'] == e['swap']: pen += 20
        if i == e['id']: pen += 2
    return pen
def bias(e, slot, ctx):                                   # WA rank 6: archetype priority bias (coarse, -2..+2)
    q = quality(e)
    fit = 1 if (q in SPEED_REP_Q or e['cx'] >= {'beginner': 0, 'intermediate': 2, 'advanced': 3}[ctx['lv']]) else 0     # level fit (sprint / sled reps are fit at every level)
    if slot == 'sx2': return fit
    if slot == 'sx': return fit
    if ctx['aid'] == 'athletic_power': return fit + (1 if (pclass(e) == 'A' and (is_lower(e) or ctx['sore'] & LOWER)) else 0)
    if ctx['aid'] == 'athletic_speed_agility': return fit + (2 if q in ('acceleration', 'sled') else 0)
    return fit + (1 if (is_lower(e) or ctx['sore'] & LOWER) else 0)
def rank_key(e, slot, ctx, chosen):
    seed = h(f"{ctx['seed']}|{ctx['aid']}|{slot}|{0 if slot == 'px' else ctx.get('swap_count', 0)}", e['id'])   # WA rank 7
    if slot == 'px':   # protected: bias ABOVE continuity; recency and swap_count never rotate it
        return (-state_rank(e, ctx), -bias(e, slot, ctx), 0 if e['id'] == anchor(ctx) else 1, seed)
    return (-state_rank(e, ctx), -comp_rank(e, slot, ctx, chosen), recency(e, ctx), -bias(e, slot, ctx), seed)

def compatible(e, chosen, slot, ctx):
    for c in chosen:
        o = EX[c]
        if c == e['id'] or o['family'] == e['family'] or (o['swap'] and o['swap'] == e['swap']): return False
    exp_ids = chosen + [e['id']]
    if slot == 'sx' and ctx['dur'] == 30 and all(pclass(EX[c]) == 'B' for c in exp_ids): return False      # >= 1 Type A
    if slot == 'sx2' and all(pclass(EX[c]) == 'B' for c in exp_ids): return False
    if ctx['aid'] == 'athletic_power' and family(e) != 'power' and sum(family(EX[c]) == 'power' for c in chosen) < 2 and slot == 'sx': return False
    return True

def ranked(slot, ctx, chosen):
    ids = [i for i in pool(ctx['aid'], slot, ctx['lv'], ctx['preset'], ctx['sore']) if compatible(EX[i], chosen, slot, ctx)]
    return sorted(ids, key=lambda i: rank_key(EX[i], slot, ctx, chosen))

# ------------------------------------------------------------------ warm-up
def warmup(ctx, px, sx):
    aid, pre, lv, sore = ctx['aid'], ctx['preset'], ctx['lv'], ctx['sore']
    wu = []
    raises = pool(aid, 'warmup.raise', lv, pre, sore) or ['jump_rope']
    pref = ['stationary_bike'] if ('low_energy' in ctx['states'] or lv == 'beginner') else (['air_bike', 'stationary_bike'] if aid == 'athletic_speed_agility' else ['row_erg', 'ski_erg', 'air_bike'])
    if 'bored' in ctx['states']: pref = ['ski_erg', 'air_bike', 'jump_rope']
    r = next((p for p in pref if p in raises), sorted(raises, key=lambda i: h(ctx['seed'] + 'raise', i))[0])
    wu.append(('raise', r, '2-3 min easy' if ctx['dur'] == 60 else '2 min easy'))
    qp = quality(EX[px])
    preps = pool(aid, 'warmup.prep', lv, pre, sore)
    want = 'worlds_greatest_stretch' if qp in ('olympic', 'rotational_power', 'upper_power', 'explosive_lift', 'rotational_throw') else ('lateral_lunge' if qp == 'lateral_power' else 'leg_swings')
    p = want if want in preps else (preps[0] if preps else None)
    if p: wu.append(('prep', p, {'worlds_greatest_stretch': '3 / side', 'leg_swings': '10 each way', 'lateral_lunge': '5 / side', 'glute_bridge': '10'}[p]))
    need_reh = qp in TECH_PX or qp in BUILDUP_PX or (sx and quality(EX[sx]) in BUILDUP_PX) or bool(sore & LOWER)
    primers = [] if sore & LOWER else pool(aid, 'warmup.primer', lv, pre, sore)
    if qp in ('acceleration', 'sled', 'decel'): order = ['a_march', 'wall_drill'] if lv == 'beginner' else ['a_skip', 'wall_drill', 'a_march']
    elif qp == 'lateral_power': order = ['lateral_shuffle_stick', 'pogo_hop']
    elif qp in ('jump', 'jump_combo', 'hop', 'bound'): order = ['snap_down', 'pogo_hop']
    else: order = ['pogo_hop', 'snap_down']
    order = [o for o in order if o in primers] + sorted(set(primers) - set(order), key=lambda i: h(ctx['seed'] + 'primer', i))
    n_prim = 1 if (need_reh or not p) else (2 if lv == 'beginner' else 1)
    NOTE = {'pogo_hop': '2 x 10', 'snap_down': '2 x 5', 'a_skip': '2 x 10 m', 'a_march': '2 x 10 m', 'wall_drill': '2 x 5 / leg', 'lateral_shuffle_stick': '2 x 5 m / side', 'line_hops': '2 x 10 s', 'power_skip': '2 x 10 m', 'short_shuttle': '2 x 5-5', 'high_knees': '2 x 10 s'}
    for o in order[:n_prim]: wu.append(('primer', o, NOTE.get(o, '')))
    if need_reh:
        if qp in TECH_PX: wu.append(('rehearsal', px, 'empty bar, 2 x 2' if EX[px]['eq'] == 'barbell' else 'light / submax, 2 x 2'))
        elif qp == 'sled': wu.append(('rehearsal', 'sled_push', '1 x 10 m easy'))
        else:
            lane = 'lane' in PRESETS[pre][1]
            wu.append(('rehearsal', 'acceleration_sprint' if lane else 'falling_start_sprint', '2 x 10 m at 70-80%' if lane else '2 x 5 m'))
    return wu[:WU_MAX_ITEMS]

# ------------------------------------------------------------------ quality-capped repeats and Performance Support
def pick_qc(ctx, used):
    fams = {EX[u]['family'] for u in used}
    ids = [i for i in pool(ctx['aid'], 'qc', ctx['lv'], ctx['preset'], ctx['sore']) if i not in used and EX[i]['family'] not in fams]
    if 'stressed' in ctx['states']: ids = [i for i in ids if i in ('air_bike', 'row_erg', 'ski_erg')]
    pref = {'athletic_speed_agility': ['acceleration_sprint', 'air_bike'], 'athletic_power': ['sled_push', 'air_bike', 'med_ball_slam'], 'athletic_full_body': ['row_erg', 'ski_erg', 'sled_push']}[ctx['aid']]
    if 'bored' in ctx['states']: pref = ['ski_erg', 'sled_push', 'row_erg']
    ids = sorted(ids, key=lambda i: (recency(EX[i], ctx), pref.index(i) if i in pref else 9, h(ctx['seed'] + 'qc', i)))
    if not ids: return None
    i = ids[0]; n = 7 if 'amped' in ctx['states'] else 6
    if i in ('air_bike', 'row_erg', 'ski_erg'): return QC(i, n, 6, 54, dose='6 s all-out')
    if i == 'acceleration_sprint': return QC(i, n, 3, 60, dose='10 m, walk back')
    if i == 'sled_push': return QC(i, n, 5, 45, dose='10 m, light sled, walk back')
    return QC(i, n, 5, 45, dose='3 fast throws')
PS_PRIORITY = {
 'athletic_speed_agility': ['hamstring_resilience', 'unilateral_robustness', 'posterior_chain', 'isometric_strength', 'tendon_robustness'],
 'athletic_power': ['strength_transfer', 'unilateral_robustness', 'structural_balance', 'posterior_chain', 'carry', 'anti_rotation'],
 'athletic_full_body': ['carry', 'unilateral_robustness', 'posterior_chain', 'structural_balance', 'anti_rotation'],
 'sore_lower': ['structural_balance', 'anti_rotation', 'carry'],
}
WHY = {'strength_transfer': 'strength that carries over to the jumps and lifts', 'unilateral_robustness': 'single-leg strength for jumping, landing and starts',
       'posterior_chain': 'posterior-chain support for the jumps and sprints', 'hamstring_resilience': 'hamstring resilience for sprinting',
       'isometric_strength': 'lateral-chain robustness for cutting', 'carry': 'trunk stiffness and grip for the power work', 'tendon_robustness': 'tendon robustness for the elastic work',
       'anti_rotation': 'anti-rotation control for the rotational power', 'structural_balance': 'upper-body balance for the pressing and throwing power'}
def ps_dose(i, goal):
    p = PS[i]; e = EX[i]; uni = e['lat'] in ('unilateral', 'alternating')
    if p == 'strength_transfer': return dict(reps=3 if goal == 'get_stronger' else 5, rest=150 if goal == 'get_stronger' else 120, dose='2 RIR' if goal == 'get_stronger' else '2-3 RIR')
    if p == 'isometric_strength': return dict(sec=20, per_side=True, rest=45, dose='20 s hold / side', reps=0)
    if p == 'carry': return dict(reps=1, rest=60, work=30, dose='30 m, heavy, tall posture')
    if p == 'hamstring_resilience': return dict(reps=4 if i == 'nordic_curl' else 8, rest=75, dose='controlled lowering' if i == 'nordic_curl' else 'controlled')
    if p == 'anti_rotation': return dict(reps=10 if not i.startswith('landmine') else 6, per_side=True, rest=45, dose='controlled')
    if p == 'tendon_robustness': return dict(reps=10 if uni else 8, per_side=uni, rest=60, dose='slow, full range')
    return dict(reps=6 if uni else 8, per_side=uni, rest=75, dose='2-3 RIR')
def pick_ps(ctx, exp_items, used, n_have=0):
    exp_es = [EX[x['id']] for x in exp_items if x['slot'] != 'qc']
    pri = PS_PRIORITY['sore_lower'] if ctx['sore'] & LOWER else PS_PRIORITY[ctx['aid']]
    cands = [i for i in pool(ctx['aid'], 'ps', ctx['lv'], ctx['preset'], ctx['sore']) if i not in used and ps_relevant(PS[i], exp_es, ctx['sore'])]
    if 'low_energy' in ctx['states']: cands = [i for i in cands if EX[i]['cx'] <= 2] or cands
    def k(i):
        p = PS[i]
        return (recency(EX[i], ctx), pri.index(p) if p in pri else 9, h(ctx['seed'] + 'ps' + str(n_have), i))
    cands = sorted(cands, key=k)
    return cands[0] if cands else None

def ps_wanted(ctx, items, total, goal):
    """Performance Support only when it improves THIS session (never to reach a floor)."""
    if goal == 'get_stronger': return True
    if ctx['dur'] == 30: return ctx['lv'] == 'beginner' and total < 20
    if ctx['lv'] == 'beginner': return True                                   # foundational strength behind landing and throwing (beginners get no repeat block)
    if total >= 42 or 'amped' in ctx['states'] or 'irritated' in ctx['states']: return False
    qs = {quality(EX[x['id']]) for x in items}
    lower = [is_lower(EX[x['id']]) for x in items]
    if ctx['sore'] & LOWER: return True                                        # upper-only day: balance the pressing / throwing
    if ctx['aid'] == 'athletic_speed_agility' and qs & {'acceleration', 'sled', 'bound'}: return True   # hamstring / single-leg resilience for sprinting
    if ctx['aid'] == 'athletic_power' and qs & {'loaded_jump', 'olympic'}: return True                # strength transfer to loaded / Olympic work
    if all(lower) or not any(lower): return True                              # one-region session: structural balance
    return False

# ------------------------------------------------------------------ archetype resolution
def resolve(req, lv, pre, sore, history):
    lower_sore = bool(sore & LOWER)
    speed_ok = not lower_sore and len(pool('athletic_speed_agility', 'px', lv, pre, sore)) >= 4
    if req != 'moods_pick':
        if req == 'athletic_speed_agility' and lower_sore: return None, 'conflict: Speed + Agility needs the legs and they are sore. Pick another Athletic archetype or MOOD\'s Pick.'
        if lower_sore and len(set(pool(req, 'px', lv, pre, sore)) | set(pool(req, 'sx', lv, pre, sore))) < 2:
            return None, 'conflict: with sore legs and this equipment there is not enough upper-body Athletic work today. Try Strength or Sweat, or add equipment.'
        return req, None
    if lower_sore: order = ['athletic_power', 'athletic_full_body']
    else:
        order = ['athletic_full_body', 'athletic_power', 'athletic_speed_agility']
        last = {a: n for n, p in reversed(list(enumerate(history))) for a in [p.get('aid')]}
        order = sorted(order, key=lambda a: (-(last[a]) if a in last else -999, order.index(a)))
        if not history: order = ['athletic_full_body', 'athletic_power', 'athletic_speed_agility']
    order = [a for a in order if a != 'athletic_speed_agility' or speed_ok]
    if lower_sore: order = [a for a in order if len(set(pool(a, 'px', lv, pre, sore)) | set(pool(a, 'sx', lv, pre, sore))) >= 2]
    if not order: return None, 'conflict: with sore legs and this equipment there is not enough upper-body Athletic work today. Try Strength or Sweat, or add equipment.'
    return order[0], ('rerouted (sore legs)' if lower_sore else None)

# ------------------------------------------------------------------ build
def build(archetype='moods_pick', level='intermediate', duration=60, preset='athletic_commercial_default', states=(), sore=(), goal='athletic_performance', history=(), seed='s0', swap_count=0, displayed=()):
    pre = PRESET_ALIAS.get(preset, preset); sore = frozenset(sore); states = [s for s in states if s != 'normal']; history = list(history)
    log = []
    aid, note = resolve(archetype, level, pre, sore, history)
    if aid is None: return dict(status='conflict', reason=note, log=log)
    if note: log.append(f"MOOD's Pick {note} -> {aid}")
    ctx = dict(aid=aid, lv=level, dur=duration, preset=pre, states=states, sore=sore, history=history, seed=seed, relax=set(), swap_count=swap_count, displayed=list(displayed))
    if aid == 'athletic_full_body' and duration == 60 and not (sore & LOWER):
        if not any(is_upper_or_rot(EX[i]) for s_ in ('sx', 'sx2') for i in pool(aid, s_, level, pre, sore)):
            ctx['relax'].add('fba_regions'); log.append('No upper-body or rotational Athletic option with this equipment, so the session is lower-body power and speed.')
    fails_seen = []
    px_c = ranked('px', ctx, [])
    for px in px_c[:6]:
        for sx in ranked('sx', ctx, [px])[:6]:
            chosen = [px, sx]
            sx2_list = ranked('sx2', ctx, chosen)[:6] if duration == 60 else [None]
            for sx2 in sx2_list or [None]:
                if duration == 60 and sx2 is None: continue
                w = assemble(ctx, [px, sx] + ([sx2] if sx2 else []), goal)
                if w['status'] == 'ok':
                    anc = anchor(ctx)
                    if anc and anc != px:
                        why = 'not available today' if anc not in px_c else "outranked by today's State or priority"
                        log.append(f"protected_primary_changed: {EX[anc]['name']} -> {EX[px]['name']} ({why})")
                    w['log'] = log + w['log']; w['archetype'] = aid; return w
                fails_seen.append(w['fails'])
    return dict(status='infeasible', archetype=aid, reason='no candidate combination passed the validator', fails=fails_seen[:3], log=log)

def target_min(ctx):
    if ctx['dur'] == 30: return 22
    return 32 if (ctx['lv'] == 'beginner' or 'low_energy' in ctx['states']) else 40

def assemble(ctx, ids, goal):
    lv, dur = ctx['lv'], ctx['dur']; log = []
    items = []
    for slot, i in zip(('px', 'sx', 'sx2'), ids):
        e = EX[i]; d = dose(e, lv); sets = base_sets(e, slot, dur, lv)
        if slot == 'sx2' and 'low_energy' in ctx['states']: sets -= 1
        if slot in ('sx', 'sx2') and 'amped' in ctx['states'] and slot == ('sx2' if dur == 60 else 'sx'): sets += 1
        items.append(dict(slot=slot, id=i, sets=sets, d=d))
    wu = warmup(ctx, ids[0], ids[1] if len(ids) > 1 else None)
    def make(items, qc=None, ps=()):
        its = [X(x['slot'], x['id'], x['sets'], **x['d']) for x in items]
        if qc: its.append(qc)
        for p in ps: its.append(X('ps', p['id'], p['sets'], purpose=PS[p['id']], why=p['why'], **ps_dose(p['id'], goal)))
        return its
    def run(its, reason=None):
        k = '_gen'; sk5.add(k, 'generated', ctx['aid'], dur, lv, ctx['preset'], list(ctx['states']), wu, its, sore=set(ctx['sore']), reason=reason)
        sk5.SK[k]['relax'] = set(ctx.get('relax', ()))
        r = sk5.check(k); w = dict(sk5.SK[k]); del sk5.SK[k]; return r, w
    # 1-3: dose exposures; grow sets toward the target (never rest), respecting impact
    r, _ = run(make(items))
    caps = {'px': 6, 'sx': 5, 'sx2': 5}
    grew = True
    while r['total'] < target_min(ctx) and grew:
        grew = False
        for x in items:
            capx = 6 if quality(EX[x['id']]) in SPEED_REP_Q else caps[x['slot']]
            if lv == 'beginner': capx = min(capx, 6 if quality(EX[x['id']]) in SPEED_REP_Q else 5)
            if x['sets'] < capx:
                x['sets'] += 1; r2, _ = run(make(items))
                if any(f.startswith(('impact', 'high impact')) for f in r2['fails']): x['sets'] -= 1; continue
                r = r2; grew = True; break
    # impact repair: trim sets on the highest-impact exposure (min 3)
    for _ in range(12):
        if not any(f.startswith(('impact', 'high impact')) for f in r['fails']): break
        iu = lambda x: impact_units(EX[x['id']], x['sets'], x['d'].get('reps', 0), x['d'].get('sec', 0), x['d'].get('per_side', False))
        floor_sets = lambda x: 2 if x['slot'] == 'sx2' else 3
        cand = [x for x in items if x['sets'] > floor_sets(x) and iu(x) > 0]
        if not cand: break
        x = max(cand, key=iu); x['sets'] -= 1; r, _ = run(make(items))
    # 4: quality-capped repeats
    qc = None
    if dur == 60 and lv != 'beginner' and 'low_energy' not in ctx['states'] and (r['total'] < target_min(ctx) or 'amped' in ctx['states'] or 'irritated' in ctx['states']):
        qc = pick_qc(ctx, ids)
        if qc:
            r2, _ = run(make(items, qc))
            while not r2['fails'] and r2['total'] < target_min(ctx) and qc['bouts'] < 8:      # more bouts while the 8-min cap and recovery hold
                q2 = dict(qc, sets=qc['bouts'] + 1, bouts=qc['bouts'] + 1); q2['t'] = q2['bouts'] * q2['sec'] + (q2['bouts'] - 1) * q2['rest']; q2['act'] = q2['bouts'] * q2['sec']
                r3, _ = run(make(items, q2))
                if r3['fails']: break
                qc, r2 = q2, r3
            if r2['fails'] and not r['fails']: qc = None
            else: r = r2; log.append(f"Added repeat efforts ({EX[qc['id']]['name']}) {'as the Amped extra' if 'amped' in ctx['states'] else 'to complete the session'}")
    # 5: Performance Support only when it improves the session
    ps = []
    want = ps_wanted(ctx, items, r['total'], goal)
    if want:
        exp_items = [dict(slot=x['slot'], id=x['id']) for x in items]
        p = pick_ps(ctx, exp_items, ids)
        if p:
            cand = [dict(id=p, sets=2 if dur == 30 else 3, why=WHY[PS[p]])]
            r2, _ = run(make(items, qc, cand))
            if not r2['fails'] or r2['fails'] == r['fails']: ps = cand; r = r2; log.append(f"Added {EX[p]['name']} ({PS[p].replace('_', ' ')}): {WHY[PS[p]]}")
        # a second one only on an upper-only (sore legs) day that is still short, with a logged reason
        if ps and dur == 60 and (ctx['sore'] & LOWER) and r['total'] < 36:
            p2 = pick_ps(ctx, exp_items, ids + [ps[0]['id']], 1)
            if p2 and PS[p2] != PS[ps[0]['id']]:
                cand = ps + [dict(id=p2, sets=2, why=WHY[PS[p2]])]
                reason = 'Legs sore: upper-only exposures are short, so a second support exercise rounds out the session'
                r2, _ = run(make(items, qc, cand), reason)
                if not r2['fails']: ps = cand; r = r2; log.append(f"Added {EX[p2]['name']} ({PS[p2].replace('_', ' ')}). Reason: {reason}")
    its = make(items, qc, ps)
    reason = 'Legs sore: upper-only exposures are short, so a second support exercise rounds out the session' if len(ps) == 2 else None
    r, w = run(its, reason)
    if r['fails'] and all(f.startswith('duration') for f in r['fails']) and r['total'] < 34 and ctx['preset'] in LIMITED_PRESETS:
        ctx['relax'] = set(ctx.get('relax', ())) | {'duration_floor'}
        r, w = run(its, reason); ctx['relax'].discard('duration_floor')
        if not r['fails']: log.append(f"Equipment-limited setup: the complete session is about {round(r['total'])} min today (no filler added).")
    if r['fails']: return dict(status='fail', fails=r['fails'], log=log)
    if not ps and dur == 60: log.append('No extra lifting today: the Athletic work is the whole session.')
    return dict(status='ok', warmup=w['wu'], items=its, result=r, log=log, ids=[x['id'] for x in its])

def render(w):
    if w['status'] != 'ok': return f"[{w['status']}] {w.get('reason', '')} {w.get('fails', '')}"
    L = [f"{w['archetype']} · ~{round(w['result']['total'])} min"]
    L.append('  Warm-up: ' + ' -> '.join(f"{EX[i]['name'] if i in EX else i} ({n})" for c, i, n in w['warmup']))
    for x in w['items']:
        e = EX[x['id']]
        rx = f"{x['sets']} x {x['sec']} s" if x['sec'] else f"{x['sets']} x {x['reps']}{'/side' if x['per_side'] else ''}"
        L.append(f"  {SLOT_ID[x['slot']]:24} {e['name']:36} {rx:14} rest {x['rest']} s  {x.get('dose') or ''}")
    for l in w['log']: L.append('  * ' + l)
    return '\n'.join(L)

if __name__ == '__main__':
    for args in [dict(archetype='athletic_power'), dict(archetype='athletic_speed_agility'), dict(archetype='athletic_full_body', level='beginner', duration=30),
                 dict(archetype='moods_pick', sore={'quads', 'hamstrings', 'glutes', 'calves'}), dict(archetype='athletic_power', level='advanced', states=['amped']),
                 dict(archetype='athletic_full_body', states=['low_energy'], preset='floor')]:
        print(args); print(render(build(**args))); print()
