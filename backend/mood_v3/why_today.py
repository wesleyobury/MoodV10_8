"""Built for Today synthesis for Strength (pre-freeze pass).

Input: the personalization contract (`res['personalization']`, built by engines/strength/core.personalization from events and
no-State comparisons that actually happened). Output: two or three sentences that explain the CONSEQUENCES of the user's
inputs, plus the list of contract claims each sentence rests on. Deterministic templates, no LLM. Anything without a realized
consequence in the contract is never mentioned. Style lint: never 'easier', 'reduced', 'lower'.
"""
from __future__ import annotations
import re

STATE_WORD = {'low_energy': 'low on energy', 'bored': 'bored', 'irritated': 'irritated', 'amped': 'amped', 'stressed': 'stressed'}
PAIR_OPENERS = {frozenset({'irritated', 'low_energy'}): "You're irritated but low on energy", frozenset({'amped', 'low_energy'}): "You're amped but running on less energy than usual",
                frozenset({'amped', 'stressed'}): "You're amped but stressed", frozenset({'bored', 'stressed'}): "You're bored and stressed",
                frozenset({'irritated', 'stressed'}): "You're irritated and stressed", frozenset({'bored', 'low_energy'}): "You're bored and low on energy",
                frozenset({'amped', 'bored'}): "You're amped and bored", frozenset({'amped', 'irritated'}): "You're amped and irritated"}
LEVEL_WORD = {'beginner': "since you're newer to lifting", 'intermediate': "as an intermediate lifter", 'advanced': "since you're an advanced lifter"}


def _name(detail, k=0):
    """First exercise name mentioned in a realized detail string ('Bench Press RIR 2→1' -> 'Bench Press')."""
    s = detail[k] if isinstance(detail, list) else detail
    for cut in (' RIR ', ' →', ' rest ', ' × ', ' (', ' out', ' runs', ':'):
        if cut in s: s = s.split(cut)[0]
    s = re.sub(r'\s+\d.*$', '', s)   # 'Hollow Body Hold 2→3 sets' -> 'Hollow Body Hold'
    return s.replace('left out ', '').strip()


def _mex(d):
    """Exercise named in a set-method detail ('3 s eccentric on Leg Press' -> 'Leg Press')."""
    s = d[0] if isinstance(d, list) else d
    return s.split(' on ', 1)[1] if ' on ' in s else s


def _join(parts):
    parts = [p for p in parts if p]
    if not parts: return ''
    if len(parts) == 1: return parts[0]
    return ', '.join(parts[:-1]) + ' and ' + parts[-1]


def _state_fragments(s, entry):
    """Consumer phrasing per realized kind. Only kinds present in the contract produce a fragment."""
    kinds = entry.get('kinds', []); det = {}
    for k, d in zip(kinds, _details_by_kind(entry)): det.setdefault(k, d)
    f = []
    if s == 'low_energy':
        if 'rir' in det: f.append("keeping you further from failure on every set" if any('RIR' in x for x in det['rir']) and len(det['rir']) > 2 else f"keeping you further from failure on {_join(_name(x) for x in det['rir'][:2])}")
        if 'exercises' in det: f.append("leaning into stable, low-friction movements")
        if 'complexity_or_systemic_cap' in det: f.append("leaving out the higher-cost accessories")
        if 'reps' in det: f.append("keeping the main lifts at moderate loads")
        if 'volume' in det: f.append("trimming a little accessory volume")
        if 'slot_removed' in det: f.append(f"leaving {det['slot_removed'][0].replace('left out ', '')} out")
        if 'structure' in det: f.append("keeping the structure simple")
        if 'set_method' in det: f.append(f"slowing the eccentric on {_mex(det['set_method'])} instead of adding load")
    elif s == 'amped':
        if 'structure' in det and det['structure'][0].startswith('Top Set'): f.append("putting that readiness into a heavy top set and back-off sets")
        elif 'structure' in det and det['structure'][0].startswith('Heavy Primary'): f.append("putting that readiness into heavier main-lift work")
        elif 'structure' in det: f.append(f"running a {det['structure'][0].split(' instead')[0].lower()} shape")
        if 'volume' in det: f.append(f"adding a working set to {_name(det['volume'])}")
        if 'rir' in det: f.append(f"taking {_join(_name(x) for x in det['rir'][:2])} a rep closer to failure")
        if 'reps' in det: f.append("pushing the main lifts to the heavy end of their range")
        if 'set_method' in det: f.append(f"using {det['set_method'][0]}")
        if 'finisher' in det: f.append(f"closing with a {det['finisher'][0].split(':')[0]}")
        if 'exercises' in det: f.append("choosing the more demanding variations")
    elif s == 'irritated':
        if 'structure' in det and det['structure'][0].startswith('Heavy Primary'): f.append("building the session around heavy, simple compound work")
        elif 'structure' in det: f.append("keeping the structure direct")
        if 'reps' in det: f.append("loading the main lifts heavier")
        if 'tempo' in det: f.append(f"driving every rep of {_name(det['tempo'][0].split(' on ')[-1]) if ' on ' in det['tempo'][0] else 'the main lift'} with intent")
        if 'rest' in det: f.append("giving the heavy work full rest so it stays heavy")
        if 'finisher' in det: f.append(f"closing with {det['finisher'][0].split(': ')[1].split(' ')[0] if ': ' in det['finisher'][0] else 'a forceful finisher'}, something direct to push against")
        if 'exercises' in det or 'complexity_or_systemic_cap' in det: f.append("keeping the movements simple and physical")
        if 'set_method' in det: f.append(f"adding {det['set_method'][0]}")
        if 'volume' in det: f.append("trading accessory volume for heavier main work")
    elif s == 'bored':
        if 'set_method' in det:
            parts = det['set_method'][0].rsplit(' on ', 1)
            f.append(f"changing the feel with {parts[0]} on the {parts[1]}" if len(parts) == 2 else f"changing the feel with {parts[0]}")
        if 'exercises' in det: n = len(det['exercises']); f.append(f"bringing in {n} less-familiar movement{'s' if n != 1 else ''}")
        if 'structure' in det: f.append(f"changing the shape of the session to {det['structure'][0].split(' instead')[0]}")
        if 'finisher' in det: f.append(f"finishing with {det['finisher'][0].split(': ')[1].split(' ')[0] if ': ' in det['finisher'][0] else 'something new'}")
    elif s == 'stressed':
        if 'structure' in det: f.append("keeping the structure simple and predictable")
        if 'tempo' in det: f.append("keeping the reps controlled and rhythmic")
        if 'rest' in det: f.append("taking unhurried rest between sets")
        if 'slot_removed' in det: f.append("setting up one thing fewer")
        if 'exercises' in det: f.append("sticking to familiar movements you can run on autopilot")
        if 'complexity_or_systemic_cap' in det: f.append("keeping anything technical out of it")
        if 'rir' in det: f.append("keeping effort moderate")
        if 'set_method' in det: f.append(f"using a 3 s eccentric on {_mex(det['set_method'])} to give the reps a rhythm")
    return f


def _details_by_kind(entry):
    """Re-split the flat realized list into per-kind chunks using the stored kinds order (contract keeps them aligned)."""
    return entry.get('realized_by_kind') or [[d] for d in entry.get('realized', [])]


def build(ctx, res, direction_name='Strength'):
    """-> dict(text, claims) or None. claims: list of (input, value) contract keys used.
    Freeze pass: the strategy layer (strategy.compose) interprets the completed session; this module's fragment
    templates remain as the fallback when the interpretation has nothing to say."""
    P = res.get('personalization') or []
    if not P: return None
    try:
        from . import strategy as SG
        out = SG.compose(ctx, res)
        if out: return out
    except Exception as ex:   # never let the explanation layer break a workout; fall back to the fragment synthesis
        res.setdefault('log', []).append(dict(reason_code='why_today_fallback', error=repr(ex)))
    byin = {}
    for e in P: byin.setdefault(e['input'], []).append(e)
    claims = []; sentences = []
    # ---- sentence 1: State(s) + soreness + consequences
    states = [e for e in byin.get('state', []) if e.get('realized')]
    sore = next((e for e in byin.get('soreness', []) if e.get('realized')), None)
    frags = []
    for e in states:
        fr = _state_fragments(e['value'], e)
        if fr: frags.append((e['value'], fr)); claims.append(('state', e['value']))
    opener = ''
    st_names = [e['value'] for e in states]
    if sore and sore['realized']:
        from .formatter import REGION_NAMES, ARCHETYPE_NAMES
        regs = [REGION_NAMES.get(r, r.replace('_', ' ')) for r in (getattr(ctx, 'sore_regions', None) or [])] or [str(v).replace('_', ' ') for v in (sore['value'] if isinstance(sore['value'], list) else [sore['value']])]
        region = _join(dict.fromkeys(regs)); plural = region.endswith('s') or ' and ' in region
        rr = sore['realized'][0]; arch = ARCHETYPE_NAMES.get(res.get('archetype'), res.get('archetype'))
        narrowed = next((l for l in res.get('log', []) if isinstance(l, dict) and l.get('reason_code') == 'archetype_narrowed_around_soreness'), None)
        if narrowed:
            opener = f"Your {region} {'are' if plural else 'is'} sore, so today's {ARCHETYPE_NAMES.get(narrowed['archetype'], narrowed['archetype'])} keeps the {' and '.join(narrowed['kept'])} work and leaves the {' and '.join(narrowed['left_out'])} work out"
        elif rr.startswith('rerouted'):
            opener = f"Your {region} {'are' if plural else 'is'} sore, so we're taking {'them' if plural else 'it'} out of the equation today with {'an' if arch[:1] in 'AEIOU' else 'a'} {arch} session"
        elif 'trained as asked' in rr:
            opener = f"You asked to train {region} despite the soreness, so we kept your Target"
        elif getattr(ctx, 'target_mode', '') == 'explicit' or getattr(ctx, 'archetype', None):
            opener = f"Your {region} {'are' if plural else 'is'} sore, so we kept your session and chose movements that keep that area out of the heavy lifting"
        else:
            opener = f"Your {region} {'are' if plural else 'is'} sore, so today is {'an' if arch[:1] in 'AEIOU' else 'a'} {arch} session that leaves {'them' if plural else 'it'} alone"
        claims.append(('soreness', 'sore'))
    if frags:
        if len(frags) == 1:
            s, fr = frags[0]
            lead = f"You're {STATE_WORD[s]} today, so we're {_join(fr[:3])}"
        else:
            key = frozenset(s for s, _ in frags[:2])
            lead = PAIR_OPENERS.get(key, f"You're {_join(STATE_WORD[s] for s, _ in frags)}") + ", so we're " + _join([fr[0] for s, fr in frags[:3]] + ([frags[0][1][1]] if len(frags[0][1]) > 1 and len(frags) == 2 else []))
        sentences.append((opener + '. ' if opener else '') + lead + '.')
    elif opener:
        sentences.append(opener + '.')
    # ---- sentence 2: level / goal, only when realized
    lvl = next((e for e in byin.get('experience', []) if e.get('realized')), None)
    goal = next((e for e in byin.get('goal', []) if e.get('realized')), None)
    parts = []; said = ' '.join(sentences).lower()
    if lvl:
        r = lvl['realized']; v = lvl['value']
        if v == 'beginner': parts.append(f"{LEVEL_WORD[v]}, " + ("the main work keeps at least two reps in reserve" if any('2+ reps in reserve' in x for x in r) else "no set runs closer than a rep from failure") + " and the movements stay approachable")
        elif v == 'advanced':
            meth = [x.split(' (')[0] for x in r if ' on ' in x and x.split(' (')[0].lower() not in said.replace(' on the ', ' on ')]
            r1 = next((x for x in r if 'runs to RIR' in x), None) if 'low_energy' not in ctx.states else None   # not the headline on a low-energy day
            parts.append(f"{LEVEL_WORD[v]}, " + (f"we're keeping {_join(meth[:2])} in the mix" if meth else (f"{_name(r1)} runs to a rep from failure" if r1 else "the compound work stays demanding before the accessories")))
        else:
            meth = [x for x in r if ' on ' in x and x.split(' (')[0].lower() not in said.replace(' on the ', ' on ')]
            if meth: parts.append(f"{LEVEL_WORD[v]}, {meth[0].split(' (')[0]} is on the table")
            elif any('Top Set' in x for x in r) and 'top set' not in said: parts.append(f"{LEVEL_WORD[v]}, the top-set scheme is in play")
        if parts: claims.append(('experience', v))
    if goal:
        g = goal['value']; r = goal['realized']
        acc = next((x for x in r if 'accessory movement' in x), None)
        behind = bool(acc and 'behind' in acc)
        if acc: acc = acc.replace(' behind the main lift', '')
        gp = {'build_strength': "your strength goal keeps the main lift heavy" + (" with full rest" if any('full ' in x for x in r) else " first"), 'build_muscle': ((f"your muscle goal is why {acc.split(',')[0]} {'sits' if acc.startswith('1 ') else 'sit'} behind the main lifts" if behind else f"your muscle goal keeps {acc.split(',')[0]} working at moderate reps") if acc else "your muscle goal shapes the accessory work"),
              'improve_athleticism': "your athleticism goal keeps the main lift heavy and fast with full rest",
              'lose_weight_conditioning': ("your conditioning goal keeps the accessory rests short" if any('short rests' in x for x in r) else "your conditioning goal is why the accessories run as pairs"),
              'feel_better_reduce_stress': ("your feel-better goal keeps the compound work two reps from failure" if any('2+ reps' in x for x in r) else "your feel-better goal keeps the shape plain and steady")}.get(g, "the session stays balanced rather than specialised")
        parts.append(gp); claims.append(('goal', g))
    if parts:
        s2 = ', and '.join(parts); sentences.append(s2[0].upper() + s2[1:] + '.')
    # ---- sentence 3: target / history, only when there is a real choice to report
    hist = next((e for e in byin.get('history', []) if e.get('realized')), None)
    tgt = next((e for e in byin.get('target', []) if e.get('realized')), None)
    if hist and len(sentences) < 3:
        r = hist['realized']
        cont = next((x for x in r if x.startswith('main lift continuity')), None); shape = next((x for x in r if x.startswith('different shape')), None); new = next((x for x in r if 'not in your last' in x), None)
        bits = []
        if cont: nm = cont.split(': ')[1]; bits.append(f"{nm.replace(', ', ' and ')} {'stay' if ',' in nm else 'stays'} so your progression carries over")
        if shape: bits.append("the session runs a different shape from last time")
        if new: k = new.split(' movement')[0]; bits.append(f"{k} movement{'s are' if k != '1' else ' is'} new versus your last one")
        if bits: sentences.append((_join(bits)[0].upper() + _join(bits)[1:]) + '.'); claims.append(('history', 'history'))
    elif tgt and len(sentences) < 3 and isinstance(tgt['value'], list) and len(tgt['value']) >= 2:
        sentences.append(f"Both {' and '.join(tgt['value'])} get direct work, in that order."); claims.append(('target', 'target'))
    if not sentences: return None
    return dict(text=' '.join(sentences[:3]), claims=claims)
