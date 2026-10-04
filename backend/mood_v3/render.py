"""Direction-specific mapping into the shared block/item contract. Pure formatting: exercises, sets, reps, time, rest and
order are copied from the validated engine output; nothing is added, removed or re-ordered."""
from __future__ import annotations
import re
from . import formatter as F
from .cues import cues_for, quality_stop, strength_effort_text

# ================================================================== Strength
from .engines.strength import adapter as SA
_STR_TYPE = {'primary_compound': 'main', 'secondary_compound': 'secondary', 'target_block': 'target', 'accessory': 'accessory', 'extra': 'accessory', 'finisher': 'finisher'}
_STR_TITLE = {'straight': None, 'superset': 'Superset', 'circuit': 'Circuit', 'pyramid': 'Pyramid', 'ladder': 'Ladder', 'finisher': 'Finisher'}
_STR_INSTR = {'superset': 'Alternate the two exercises; rest after each round.',
              'circuit': 'Move through the exercises back to back; rest after each round.',
              'pyramid': 'Add load each set as the reps drop.',
              'ladder': 'Same load; reps drop each set with short rest.',
              'finisher': None}

def _strength_rx(it, row, blk):
    reps = str(it['reps']); per_side = '/side' in reps
    kind = 'reps'; seconds = distance = None
    if row.get('why') == 'timed' or re.search(r'\bsec\b|\bs$', reps):
        kind = 'time'; m = re.findall(r'\d+', reps); seconds = int(m[-1]) if m else None
    elif row.get('why') == 'distance' or reps.endswith(' m') or ' m/' in reps:
        kind = 'distance'; m = re.findall(r'\d+', reps); distance = int(m[0]) if m else None
    sets = it['sets']; scheme = it.get('scheme')
    # Grouped work rests once, after the whole pair / round: that value lives on the block (rest_between_rounds_sec and the
    # block `rest` contract), not on every row. Straight work rests after each set of this row.
    rest = None if blk['structure_id'] in ('superset', 'circuit') else blk['rest_after_round']
    display = f"{sets} × {reps}" if not scheme else f"{len(scheme)} sets: {'/'.join(map(str, scheme))}"
    method = row.get('method')
    if method: display += f" · {method['label']}"
    lg = strength_effort_text(it.get('rir'), row.get('cls')) if kind == 'reps' else \
        {'distance': 'Heavy enough to be hard by the end; stay tall and keep moving.', 'time': 'Hard, steady effort; stop before form breaks.'}[kind]
    if it.get('load'): lg = (it['load'].capitalize() + '. ' + (lg or '')).strip()
    if method: lg = (method['text'] + '. ' + (lg or '')).strip()
    if row.get('why') == 'bodyweight, load not adjustable': lg = 'Bodyweight: work within the rep range. ' + (lg or '')
    return F.prescription(kind, sets=sets, reps=reps.replace('/side', ''), reps_scheme=scheme, per_side=per_side, seconds=seconds, distance_m=distance,
                          rest_sec=rest, rir=it.get('rir'), load_guidance=lg.strip() if lg else None, display=display,
                          direction_fields=dict(slot_class=row.get('cls'), protected=bool(row.get('protected')), role=row.get('role'), set_method=(method['id'] if method else None)))

from .engines.strength.trainer_gate import block_role as strength_block_role   # cart heading = the block's role in THIS workout

def format_strength(res, nctx):
    rows = {r['slot']: r for r in res['rows']}
    for r in res.get('fin_rows', []): rows['finisher'] = r
    blocks = []
    for n, b in enumerate(res['st_blocks'], 1):
        items = []
        for k, it in enumerate(b['items'], 1):
            row = rows[it['slot']]; e = SA.EX[it['exercise_id']]
            ex = F.exercise_ref(e['id'], e['name'], e['eq'], e['prim'])
            items.append(F.item(it['slot'], it['slot'], ex, _strength_rx(it, row, b), cues=cues_for(e['id']), role=row.get('role')))
        btype, label = strength_block_role(res['archetype'], b, [rows[it['slot']] for it in b['items']])
        title = _STR_TITLE.get(b['structure_id']) or label
        blocks.append(F.block(f'B{n}', n, btype, b['structure_id'], title, items, rounds=b['rounds'],
                              rest_between_items_sec=b['rest_between_items'] or None, rest_between_rounds_sec=b['rest_after_round'],
                              instructions=_STR_INSTR.get(b['structure_id'])))
    dur = nctx['duration']; first = blocks[0]['items'][0]['exercise']['name'] if blocks else ''
    warm = dict(minutes=7 if dur == 60 else 4, items=[],
                guidance=f"{'5-8' if dur == 60 else '3-5'} min: easy cardio and mobility, then 2-3 lighter ramp-up sets of {first}.")
    return warm, blocks, None

# ================================================================== Sweat
from .engines.sweat import adapter as WA, sweat_gen as SG
_SW_TITLE = {'primary_engine_block': 'Engine', 'primary_circuit': 'Circuit', 'primary_hybrid_block': 'Hybrid', 'complementary_block': 'Complement',
             'optional_extra': 'Finisher'}
def _sw_rx(e, dz, blk, *, sets=None, display_extra=''):
    if dz is None: return F.prescription('time', sets=sets, display=display_extra or None)
    k, v = dz['kind'], dz['value']
    rpe = blk.get('rpe')
    cue = SG.cue_for(e, blk['structure'], rpe[1]) if rpe else None
    return F.prescription(k, sets=sets, reps=v if k == 'reps' else None, per_side=bool(dz.get('per_side')), seconds=v if k == 'time' else None,
                          distance_m=v if k == 'distance' else None, calories=v if k == 'calories' else None, rpe=rpe,
                          load_guidance=cue, display=(F.fmt_seconds(v) if k == 'time' else SG.dose_txt(e, dz)) + display_extra,
                          direction_fields=dict(progression=blk.get('item_progression', {}).get(e['id']), role=e['role']))

def _sw_ex(e):
    return F.exercise_ref(e['id'], SG.DISPLAY_ALIASES.get(e['id'], e['name']) if hasattr(SG, 'DISPLAY_ALIASES') else e['name'], e['eq'], e['prim'])

def format_sweat(res, nctx):
    w = res['w']; exp = w['experience']; blocks = []
    for n, b in enumerate(w['blocks'], 1):
        _ix = {e['id']: k for k, e in enumerate(b['items_e'])}
        sid = lambda e, _b=b, _ix=_ix: f"{_b['slot']}.{_ix[e['id']]}"
        s = b['structure']; it = b.get('interval_target') or {}
        btype = 'primary' if b['slot'].startswith('primary') else ('finisher' if b['slot'] == 'optional_extra' else 'complement')
        items = []; rounds = rest_rounds = rest_items = None; interval = None; instr = None; structure = s
        if s == 'continuous':
            e = b['items_e'][0]
            items.append(F.item(sid(e), b['slot'], _sw_ex(e), F.prescription('time', seconds=b['duration_s'], rpe=b['rpe'],
                         display=F.fmt_seconds(b['duration_s']) + ' steady', load_guidance=f"RPE {b['rpe'][0]}-{b['rpe'][1]}",
                         direction_fields=dict(progression='output', engine_format=b.get('engine_format'))), cues=cues_for(e['id'])))
            instr = 'Build through thirds: RPE 5, 6, then 7. No programmed recovery.' if b.get('engine_format') == 'tempo' else 'One steady rhythm, no programmed recovery.'
        elif s in ('intervals', 'finisher') and not it.get('rotate'):
            interval = dict(work_sec=it['work'], recovery_sec=it['recovery'], rounds=it['rounds'], alternate=bool(it.get('alternate')))
            rounds = it['rounds']
            for k, e in enumerate(b['items_e'], 1):
                items.append(F.item(sid(e), b['slot'], _sw_ex(e), F.prescription('time', sets=it['rounds'], seconds=it['work'], rpe=b['rpe'],
                             rest_sec=None, display=f"{it['rounds']} × {F.fmt_seconds(it['work'])} / {F.fmt_seconds(it['recovery'])} easy",
                             load_guidance=SG.cue_for(e, s, b['rpe'][1]), direction_fields=dict(progression='output', role=e['role'])), cues=cues_for(e['id'])))
            instr = 'Alternate the exercises each interval.' if it.get('alternate') else (('Hard intervals on the same machine; easy pace between.' if b['rpe'][1] >= 8 else 'Controlled intervals at a steady pace you can repeat every round; easy pace between.') if s == 'intervals' else 'All-out efforts with easy recovery between.')
            structure = 'intervals' if s == 'intervals' else 'finisher'
        elif s == 'intervals':   # timed rotation
            interval = dict(work_sec=it['work'], recovery_sec=it['recovery'], rounds=it['rounds'], rest_between_rounds_sec=it.get('round_rest'))
            rounds = it['rounds']; rest_rounds = it.get('round_rest')
            for k, (e, dz) in enumerate(zip(b['items_e'], b['doses']), 1):
                items.append(F.item(sid(e), b['slot'], _sw_ex(e), _sw_rx(e, dz, b, sets=rounds), cues=cues_for(e['id'])))
            instr = f"{it['work']} s work / {it['recovery']} s rest per station, rotate through all stations; {rounds} rounds."
            structure = 'timed_circuit'
        elif s == 'pyramid':
            e = b['items_e'][0]
            interval = dict(steps_sec=list(it['steps']), recovery_sec=it['recovery'])
            items.append(F.item(sid(e), b['slot'], _sw_ex(e), F.prescription('time', seconds=sum(it['steps']), rpe=b['rpe'], rest_sec=None,
                         display='Pyramid ' + '-'.join(F.fmt_seconds(x) for x in it['steps']), load_guidance=f"RPE {b['rpe'][0]}-{b['rpe'][1]}; hold output across steps",
                         direction_fields=dict(progression='output')), cues=cues_for(e['id'])))
            instr = f"Work steps with {it['recovery']} s easy between."
        elif s == 'circuit' and b.get('anchor'):
            structure = 'anchor_circuit'; a = b['anchor']; rounds = len(b['round_stations']); rest_rounds = b['round_rest']
            arx = _sw_rx(a, b['anchor_dose'], b, sets=rounds)
            if b.get('anchor_doses'):   # ladder hybrid: the anchor dose changes predictably across rounds
                arx['display'] = ' / '.join(SG.dose_txt(a, x) for x in b['anchor_doses']); arx['direction_fields']['round_doses'] = [SG.dose_txt(a, x) for x in b['anchor_doses']]
            items.append(F.item(sid(a), b['slot'] + '.anchor', _sw_ex(a), arx, cues=cues_for(a['id']), role='anchor'))
            seen = []
            for r_i, rs in enumerate(b['round_stations'], 1):
                for e, dz in rs:
                    if e['id'] in [x[0] for x in seen]: continue
                    seen.append((e['id'], r_i))
                    appears = [ri for ri, rr in enumerate(b['round_stations'], 1) if any(x['id'] == e['id'] for x, _ in rr)]
                    rx = _sw_rx(e, dz, b, sets=len(appears)); rx['direction_fields']['rounds'] = appears
                    items.append(F.item(sid(e), b['slot'] + '.station', _sw_ex(e), rx, cues=cues_for(e['id']), role='station'))
            instr = (f"Every round: {a['name']}, then that round's station. " if b.get('rotating') else f"Every round: {a['name']}, then every station. ") + \
                    f"Walk {b['round_rest']} s between rounds."
            if b.get('setup_s'): instr = f"First {b['setup_s'] // 60} min: set your {a['name']} pace and load every station, then start round 1. " + instr
        elif s in ('circuit', 'emom'):
            rounds = b['rounds']; rest_rounds = b.get('round_rest')
            for k, (e, dz) in enumerate(zip(b['items_e'], b['doses']), 1):
                items.append(F.item(sid(e), b['slot'], _sw_ex(e), _sw_rx(e, dz, b, sets=rounds), cues=cues_for(e['id'])))
            if s == 'emom':
                n_st = len(b['items_e']); laps = -(-b['minutes'] // max(1, n_st))
                instr = (f"Every minute on the minute for {b['minutes']} min: one station per minute, in order, rest the remainder of the minute. "
                         f"{laps} rounds through the {n_st} stations." if n_st > 1 and laps > 1 else
                         f"Every minute on the minute for {b['minutes']} min: rest the remainder of each minute.")
                interval = dict(minutes=b['minutes'], rounds=rounds)
            else:
                instr = f"{rounds} rounds, moving station to station; rest {b['round_rest']} s after each round."
        elif s == 'ladder':
            lad = b['ladder']
            for k, e in enumerate(b['items_e'], 1):
                items.append(F.item(sid(e), b['slot'], _sw_ex(e), F.prescription('reps', reps_scheme=list(lad), rpe=b['rpe'],
                             display='Ladder ' + '-'.join(map(str, lad)), load_guidance=SG.cue_for(e, s, b['rpe'][1]),
                             direction_fields=dict(progression=b.get('item_progression', {}).get(e['id']), role=e['role'])), cues=cues_for(e['id'])))
            instr = 'Alternate the exercises at each rung, self-paced: ' + '-'.join(map(str, lad)) + ' reps.'
        title = 'Closer' if b.get('comp_type') == 'closer' else _SW_TITLE.get(b['slot'], 'Block')
        if b.get('purpose') and b['slot'] == 'complementary_block': instr = (instr + ' ' if instr else '') + f"Purpose: {b['purpose']}."
        blocks.append(F.block(f'B{n}', n, btype, structure, title, items, rounds=rounds, rest_between_items_sec=rest_items, rest_between_rounds_sec=rest_rounds,
                              instructions=instr, effort=dict(rpe=list(b['rpe'])) if b.get('rpe') else None, interval=interval,
                              est_minutes=b.get('_est_min', round(SG.block_minutes(b, exp), 1))))
    warm = dict(minutes=w['warm_up_min'], items=[], guidance=f"{w['warm_up_min']} min: easy cardio building to a moderate pace, plus a few reps of the first stations." + (" Extra time here on purpose: the main block is the workout, so arrive at it ready." if w['blocks'] and w['blocks'][0].get('wu_extra_min') else ''))
    return warm, blocks, dict(minutes=w['downshift_min'], guidance='Easy pace and breathing down.')

# ================================================================== Athletic (V3 Athletic rebuild)
from .engines.athletic import adapter as AA
from .engines.athletic import athletic_core as AC

_ATH_BLOCK = {   # role -> (block type, title prefix)
    'primer': ('primer', 'Primer'), 'primary': ('primary', 'Primary'), 'secondary': ('secondary', 'Secondary Quality'), 'tertiary': ('secondary', 'Athletic Element'), 'strength': ('strength', 'Athletic Strength'),
    'support': ('support', 'Support'), 'finisher': ('finisher', 'Finisher')}
_ATH_ITEM_ID = {'primer': 'primer', 'primary': 'primary', 'contrast_strength': 'contrast_strength', 'contrast_power': 'contrast_power', 'secondary': 'secondary', 'tertiary': 'tertiary', 'support': 'support', 'finisher': 'finisher'}
_WU_NAME = {'raise': 'Raise temperature', 'mobility': 'Mobility', 'primer': 'Primer', 'rehearsal': 'Build-up'}
_KIND_WORD = {'sprint': 'Speed', 'sled': 'Power'}
_IMPACT = {'low': 'low impact', 'moderate': 'moderate impact', 'high': 'high impact'}


def _ath_context(x):
    """Sequencing / presentation pass: a short contextual tag the Athletic cart shows on the row (why this lift is here)."""
    if x['cls'] == 'strength': return 'Heavy, then explode' if x.get('role') == 'contrast_strength' else 'For velocity'
    if x.get('role') == 'primer': return 'Primer'
    if x['cls'] == 'power' and x['kind'] == 'speed_strength': return 'For velocity'
    return None


def ath_phases(sess):
    """Sequencing / presentation pass: at most ~3 phases that read as one coached session, labelled for the actual work.
    -> list of (phase id, label) per block, in order."""
    blocks = sess['blocks']; arch = sess.get('arch')
    def ph(b):
        if b['role'] == 'primer': return 'primer'
        if b['role'] in ('primary', 'secondary', 'tertiary'): return 'strength' if all(AC.demand(x) == 2 for x in b['items'] if x['cls'] == 'power') and b['role'] != 'primary' else 'power'
        if b['role'] == 'finisher': return 'finish'
        return 'strength'
    ids = [ph(b) for b in blocks]
    pw = [x for b, p in zip(blocks, ids) if p == 'power' for x in b['items'] if x['cls'] == 'power']
    loaded = any(AC.is_loaded(x['id']) or x['kind'] in AC.OLY_KINDS for x in pw) or any(b['structure'] == 'contrast' for b in blocks)
    if loaded or not pw: power_label = 'Power'
    elif arch == 'athletic_speed_agility': power_label = 'Speed & Plyo'
    elif all(x['kind'] in AC.JUMP_KINDS for x in pw): power_label = 'Plyometrics'
    else: power_label = 'Power'
    st_its = [x for b, p in zip(blocks, ids) if p == 'strength' for x in b['items']]
    if any(x['cls'] == 'strength' or x['kind'] == 'speed_strength' for x in st_its): st_label = 'Athletic Strength'
    elif any(x['cls'] == 'support' and AC.SUPPORT.get(x['id']) in AC.CORE_KINDS for x in st_its): st_label = 'Athletic Core'
    else: st_label = 'Resilience'
    lab = {'primer': 'Primer', 'power': power_label, 'strength': st_label, 'finish': 'Finisher'}
    return [(p, lab[p]) for p in ids]


def _ath_rx(x, in_group):
    e = AC.EX[x['id']]; per = '/side' if x['per_side'] else ''
    dist = x.get('distance_m'); sec = x.get('seconds')
    if dist: kind = 'distance'; disp = f"{x['sets']} × {dist} m" + (per if x['per_side'] else '')
    elif sec: kind = 'time'; disp = f"{x['sets']} × {sec} s{per}"
    else: kind = 'reps'; disp = f"{x['sets']} × {x['reps']}{per}"
    df = dict(type=x['cls'], impact=e['impact'], skill=e['skill'], impact_label=_IMPACT.get(e['impact']),
              category={'power': 'ATHLETIC', 'strength': 'ATHLETIC_STRENGTH'}.get(x['cls'], 'SUPPORT'), performance_role=AC.performance_role(x),
              context_tag=_ath_context(x))
    if x['cls'] == 'power':
        df.update(quality=AC.lib_quality(e), athletic_quality=x['quality'], intent='max', contacts=AC.contacts_of(x), kind=x['kind'], cost_tier=AC.tier(x['id'], x['role']))
    elif x['cls'] == 'strength':
        df.update(pattern=x['pattern'], why=AC.STRENGTH_WHY.get(x['pattern']))
    elif x['cls'] == 'support':
        df.update(purpose=x['kind'], why=AC.SUPPORT_WHY.get(x['kind']))
    return F.prescription(kind, sets=x['sets'], reps=x['reps'] if kind == 'reps' else None, per_side=bool(x['per_side']), seconds=sec, distance_m=dist,
                          rest_sec=None if in_group else x['rest'], rir=x.get('rir'), load_guidance=x.get('intent'), display=disp, direction_fields=df)


def format_athletic(res, nctx):
    out = res['w']; sess = out['sess']; blocks = []; strength_n = 0; tertiary_n = 0; seen_q = set()
    phases = ath_phases(sess)
    for n, b in enumerate(sess['blocks'], 1):
        btype, title = _ATH_BLOCK[b['role']]
        grouped = b['structure'] in ('superset', 'contrast')
        if b['role'] == 'primer':
            q = AC.QUALITY_LABEL[b['quality']]
            lead = AC.PB(sess)['items'][-1]
            title = 'Primer · ' + q[0].upper() + q[1:]
            instr = f"Two crisp, low-fatigue sets to wake up the nervous system for the {AC.EX[lead['id']]['name']}. Not a workout: stop well before any fatigue."
        elif b['role'] == 'primary':
            q = AC.QUALITY_LABEL[b['quality']]
            k = b['items'][-1]['kind']
            title = ('Contrast Pair · ' if b['structure'] == 'contrast' else f"Primary {_KIND_WORD.get(k, 'Power')} · ") + q[0].upper() + q[1:]
            instr = ('Heavy set, 45 s, then the explosive partner. Full recovery after each pair: start the next only when you feel fresh.'
                     if b['structure'] == 'contrast' else 'Full recovery between sets: start the next set only when you feel fresh. Every rep is maximal intent.')
        elif b['role'] in ('secondary', 'tertiary'):
            q = AC.QUALITY_LABEL[b['quality']]; Q = q[0].upper() + q[1:]
            if b['role'] == 'secondary' and b['quality'] not in seen_q:
                title = f"Secondary Quality · {Q}"; instr = 'A different athletic quality while you are still fresh. Quality over volume.'
            else:   # an honest label: a second exercise for a quality the session already has is not a new quality
                title = f"Athletic Element · {Q}"; instr = 'Another athletic movement, still before any strength work. A few crisp sets; every rep fast.'
        elif b['role'] == 'strength':
            vel = any(x['cls'] == 'strength' for x in b['items'])
            instr = (f"Alternate the two: {b['rest_items']} s between them, {b['rest_rounds']} s after each round. " if grouped else '') + \
                    (f"For velocity: {AC.VELOCITY_CUE[0].lower() + AC.VELOCITY_CUE[1:]} Stop the set when the speed clearly drops. " if vel else '') + (f"Why: {b['why']}." if b.get('why') else '')
            if b.get('paired_support'): title = 'Athletic Strength + Core'
        else:
            instr = f"Why it's here: {b['why']}." if b.get('why') else None
        if b['role'] in ('primer', 'primary', 'secondary', 'tertiary') and b.get('quality'): seen_q.add(b['quality'])
        items = []
        for ii, x in enumerate(b['items']):
            if x['role'] == 'strength':
                strength_n += 1; iid = 'strength_' + 'abc'[strength_n - 1]
            elif x['role'] == 'tertiary':
                tertiary_n += 1; iid = 'tertiary_' + 'abc'[tertiary_n - 1]
            else: iid = _ATH_ITEM_ID.get(x['role'], x['role'])
            e = AC.EX[x['id']]; lq = AC.lib_quality(e) if x['cls'] == 'power' else None
            items.append(F.item(iid, AA.SLOT_ID.get(x['role'], x['role']), F.exercise_ref(e['id'], e['name'], e['eq'], e['prim']), _ath_rx(x, grouped),
                                cues=cues_for(e['id']), quality_stop=quality_stop(lq) if lq else None, role=x['role']))
        structure = 'superset' if grouped else 'straight'
        blocks.append(F.block(f'B{n}', n, btype, structure, title, items, rounds=b['rounds'], rest_between_items_sec=b['rest_items'] if grouped else None,
                              rest_between_rounds_sec=b['rest_rounds'], instructions=instr, est_minutes=round(AC.block_seconds(b) / 60, 1)))
        blocks[-1]['performance_roles'] = list(dict.fromkeys(AC.performance_role(x) for x in b['items']))   # final pre-launch pass: cart sub-label
        blocks[-1]['phase'], blocks[-1]['phase_label'] = phases[n - 1]            # sequencing / presentation pass: the cart's phase
    wu_items = []
    for comp, i, note in out['wu']:
        e = AC.EX.get(i)
        wu_items.append(dict(component=comp, component_label=_WU_NAME.get(comp, comp), exercise=F.exercise_ref(e['id'], e['name'], e['eq'], e['prim']) if e else None,
                             name=e['name'] if e else i, prescription_text=note))
    wm = out['A']['wu_min']
    warm = dict(minutes=wm, items=wu_items, guidance=f"{wm:g} min: raise temperature, open the hips, then build into the first explosive set. The last warm-up reps should feel fast and crisp.")
    cool = dict(minutes=sess.get('cooldown_min'), guidance='Easy walk and slow breathing, then hips and calves.') if sess.get('cooldown_min') else None
    return warm, blocks, cool


# ================================================================== Athletic
from .engines.athletic import adapter_legacy_v1 as AAL, athletic_gen as AG
_ATH_TITLE = {'px': 'Primary exposure', 'sx': 'Secondary exposure', 'sx2': 'Third exposure', 'qc': 'Repeat efforts', 'ps': 'Performance Support'}
_ATH_TYPE = {'px': 'primary', 'sx': 'secondary', 'sx2': 'secondary', 'qc': 'repeats', 'ps': 'support'}
_WU_NAME = {'raise': 'Raise temperature', 'prep': 'Mobility', 'primer': 'Primer', 'rehearsal': 'Rehearsal'}

def format_athletic_legacy(res, nctx):
    w = res['w']; blocks = []
    for n, x in enumerate(w['items'], 1):
        e = AG.EX[x['id']]; q = AG.quality(e) if x['slot'] != 'ps' else None
        dist = None; m = re.search(r'(\d+)\s*m\b', x.get('dose') or '')
        if m and (e.get('metric') == 'distance' or q in ('acceleration', 'sled', 'decel') or x['slot'] == 'qc'): dist = int(m.group(1))
        if x['slot'] == 'qc':
            kind = 'distance' if dist else 'time'
            rx = F.prescription(kind, sets=x['bouts'], seconds=x['sec'] if kind == 'time' else None, distance_m=dist, rest_sec=x['rest'],
                                display=f"{x['bouts']} × {x.get('dose') or str(x['sec']) + ' s'}", load_guidance=x.get('dose'),
                                direction_fields=dict(type='repeats', work_sec=x['sec'], recovery_sec=x['rest']))
            qs = 'All-out, but end the block early if efforts clearly slow.'
        else:
            kind = 'time' if x['sec'] else ('distance' if dist else 'reps')
            reps_txt = f"{x['reps']}{'/side' if x['per_side'] else ''}"
            disp = f"{x['sets']} × {x['sec']} s" if x['sec'] else (f"{x['sets']} × {dist} m" if dist and x['reps'] <= 1 else f"{x['sets']} × {reps_txt}")
            df = dict(type=AG.pclass(e) if x['slot'] != 'ps' else 'support', quality=q)
            if x['slot'] == 'ps': df.update(purpose=x.get('purpose'), why=x.get('why'))
            rx = F.prescription(kind, sets=x['sets'], reps=x['reps'] if kind == 'reps' else None, per_side=bool(x['per_side']), seconds=x['sec'] or None,
                                distance_m=dist if kind == 'distance' else None, rest_sec=x['rest'], display=disp,
                                load_guidance=x.get('dose'), direction_fields=df)
            qs = quality_stop(q) if q else None
        blocks.append(F.block(f'B{n}', n, _ATH_TYPE[x['slot']], 'repeats' if x['slot'] == 'qc' else ('straight' if x['slot'] == 'ps' else 'exposure'),
                              _ATH_TITLE[x['slot']],
                              [F.item(x['slot'] if sum(y['slot'] == x['slot'] for y in w['items'][:n - 1]) == 0 else f"{x['slot']}{n}", AAL.SLOT_ID[x['slot']], F.exercise_ref(e['id'], e['name'], e['eq'], e['prim']), rx,
                                      cues=cues_for(e['id']), quality_stop=qs, role=x['slot'])],
                              rounds=x['sets'], rest_between_rounds_sec=x['rest'],
                              instructions=(x.get('why') and f"Why it's here: {x['why']}.") if x['slot'] == 'ps' else
                                           ('Full recovery between sets. Quality over volume.' if x['slot'] != 'qc' else 'Short, all-out efforts with long recovery.')))
    wu_items = []
    for comp, i, note in w['warmup']:
        e = AG.EX.get(i)
        wu_items.append(dict(component=comp, component_label=_WU_NAME.get(comp, comp),
                             exercise=F.exercise_ref(e['id'], e['name'], e['eq'], e['prim']) if e else None, name=e['name'] if e else i,
                             prescription_text=note))
    return dict(minutes=w['result']['wu_min'], items=wu_items, guidance=None), blocks, None
