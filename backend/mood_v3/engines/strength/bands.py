"""Strength prescription bands (Core rebuild, Phase 1).

A band is the safe range a slot class may be prescribed in. The structural variant picks a POSITION (0..1) inside each
band for the base prescription; State levers then move the position or the value inside the SAME band. Nothing outside a
band is ever emitted, and the validator checks every row against its band (see core.validate_rows).

Kept deliberately small: sets, reps, RIR, rest per slot class per level, plus rep-window widths and small-muscle /
bodyweight / timed handling carried over from the frozen prescription layer (META in prescription.py).
"""
from __future__ import annotations
from .prescription import META, SMALL, HEAVY_FAM   # frozen library metadata: rep metric, default band, load trackable

# (lo, hi) per dimension. Rest in seconds. RIR: reps in reserve.
# Rest (founder rest audit): rest serves the training stimulus, never the clock. Ordinary compounds live at 90-120 s,
# accessories 45-90 s. Only genuinely heavy, low-rep barbell / trap-bar primary work gets the long band (see HEAVY_REST and
# rest_ceiling below); nothing is ever lengthened to fill a requested duration.
_INT = {
    'primary_compound':   dict(sets=(3, 5), reps=(4, 8),  rir=(1, 3), rest=(90, 150)),
    'secondary_compound': dict(sets=(3, 4), reps=(6, 12), rir=(1, 3), rest=(75, 120)),
    'accessory':          dict(sets=(2, 4), reps=(8, 15), rir=(0, 2), rest=(45, 90)),
    'extra':              dict(sets=(2, 3), reps=(10, 20), rir=(0, 2), rest=(30, 60)),
}
_BEG = {
    'primary_compound':   dict(sets=(3, 4), reps=(6, 10), rir=(2, 3), rest=(90, 120)),
    'secondary_compound': dict(sets=(3, 4), reps=(8, 12), rir=(2, 3), rest=(75, 120)),
    'accessory':          dict(sets=(2, 3), reps=(10, 15), rir=(1, 2), rest=(45, 90)),
    'extra':              dict(sets=(2, 3), reps=(12, 20), rir=(1, 2), rest=(30, 60)),
}
BANDS = {'beginner': _BEG, 'intermediate': _INT, 'advanced': _INT}
# rep-window width shown to the user ("6–8" is width 2)
REP_WIDTH = {'primary_compound': 2, 'secondary_compound': 2, 'accessory': 3, 'extra': 4}
# small muscles and cable / machine isolations live higher in the rep band
SMALL_SHIFT = 0.3


# Exercise-specific dosing inside the existing class bands (founder pass 4). Only for a movement whose difficulty makes the
# generic bodyweight window wrong. The Nordic Hamstring Curl is a near-maximal eccentric: the generic bodyweight accessory text
# (12–15) was far above what anyone can do with control, so it takes 4–6 reps (the overlap of the frozen library's own
# default_rep_band 4–8 and a 3–6 controlled-rep target) and never goes to failure (RIR floor 1: stop before technique breaks).
# Sets, rest, State levers and validation stay the class's. Nothing else is listed here.
EXERCISE_DOSE = {'nordic_curl': dict(reps='4–6', rir_floor=1)}


def rir_floor(eid):
    return (EXERCISE_DOSE.get(eid) or {}).get('rir_floor')


def band(cls, exp):
    return BANDS[exp][cls if cls in _INT else 'accessory']


def _lerp(lo, hi, pos):
    pos = max(0.0, min(1.0, pos)); return lo + (hi - lo) * pos


def sets_at(cls, exp, pos):
    lo, hi = band(cls, exp)['sets']; return int(round(_lerp(lo, hi, pos)))


def rir_at(cls, exp, pos):
    lo, hi = band(cls, exp)['rir']; return int(round(_lerp(lo, hi, pos)))


def rest_at(cls, exp, pos):
    lo, hi = band(cls, exp)['rest']; return int(round(_lerp(lo, hi, pos) / 15.0) * 15)


# ------------------------------------------------------------------ rest rules (founder rest audit)
HEAVY_REST = (120, 180)      # heavy barbell / trap-bar primary at <= 6 reps: near-maximal loading earns full recovery
HEAVY_EQ = ('barbell', 'trap_bar')


def _reps_top(r):
    """Highest rep count of the row's working sets; a top set + back-off scheme is judged by its heaviest (lowest-rep) set."""
    if r.get('scheme'): return min(r['scheme'])
    import re as _re
    nums = [int(x) for x in _re.findall(r'\d+', str(r.get('reps', '')))]
    return max(nums) if nums else None


def heavy_low_rep(r, exp):
    """Genuinely heavy primary work: a barbell / trap-bar squat, hinge, bench or press family at 6 reps or fewer."""
    if exp == 'beginner' or r.get('cls') != 'primary_compound' or r.get('kind', 'reps') != 'reps' or r.get('why'): return False
    from .audit_engine import EX as _EX
    e = _EX.get(r.get('eid')) or {}
    top = _reps_top(r)
    return bool(e) and e.get('swap') in HEAVY_FAM and e.get('eq') in HEAVY_EQ and top is not None and top <= 6


def rest_ceiling(r, exp):
    """The most rest a row may show. >2:00 needs a training reason: heavy low-rep barbell work (up to 3:00), or any
    primary at 6 reps or fewer (up to 2:30). Everything else: compounds 2:00, accessories 1:30, extras 1:00."""
    cls = r.get('cls')
    if cls == 'primary_compound':
        if heavy_low_rep(r, exp): return HEAVY_REST[1]
        top = _reps_top(r)
        return 150 if (top is not None and top <= 6 and r.get('kind', 'reps') == 'reps' and not r.get('why')) else 120
    if cls == 'secondary_compound': return 120
    if cls == 'extra': return 60
    return 90


def rest_for(r, exp):
    """Rest for a row from its band position, inside the heavy band when the work is genuinely heavy, capped by rest_ceiling."""
    pos = (r.get('pos') or {}).get('rest', 0.5)
    if heavy_low_rep(r, exp):
        lo, hi = HEAVY_REST; v = int(round(_lerp(lo, hi, pos) / 15.0) * 15)
    else:
        v = rest_at(r['cls'], exp, pos)
    return min(v, rest_ceiling(r, exp))


WINDOWS = {   # canonical coach-facing rep windows per class; the band position picks one
    'intermediate': {'primary_compound': [(4, 6), (5, 7), (6, 8)], 'secondary_compound': [(6, 8), (8, 10), (10, 12)],
                     'accessory': [(8, 10), (10, 12), (12, 15), (15, 20)], 'extra': [(10, 12), (12, 15), (15, 20)]},
    'beginner':     {'primary_compound': [(6, 8), (8, 10)], 'secondary_compound': [(8, 10), (10, 12)],
                     'accessory': [(10, 12), (12, 15), (15, 20)], 'extra': [(12, 15), (15, 20)]},
}
WINDOWS['advanced'] = WINDOWS['intermediate']


def rep_window(cls, exp, pos, width=None):
    """Canonical integer window inside the rep band, picked by position (small-muscle shift may reach the top window)."""
    ws = WINDOWS[exp][cls if cls in _INT else 'accessory']
    if cls in ('accessory',) and pos < 0.99: ws = ws[:-1] if len(ws) > 3 else ws   # 15–20 only via the small-muscle shift
    i = int(round(max(0.0, min(1.0, pos)) * (len(ws) - 1)))
    return ws[i]


def rep_pos_for(e, cls, pos):
    """Exercise-aware position: small muscles and isolations sit higher in the band; heavy barbell primaries sit lower."""
    if e['pm0'] in SMALL or e['prim'][0] in SMALL: pos = 1.0 if pos >= 0.5 else pos + SMALL_SHIFT
    if cls == 'primary_compound' and e['swap'] in HEAVY_FAM and e['eq'] in ('barbell', 'trap_bar'): pos -= 0.15
    return max(0.0, min(1.0, pos))


def rep_text(e, cls, exp, pos):
    """-> (reps text, kind, why). Timed / distance / non-adjustable bodyweight keep the frozen handling."""
    m = META.get(e['id'], {})
    if m.get('metric') == 'time': return str(m.get('band') or '30–45 sec'), 'time', 'timed'
    if m.get('metric') == 'distance': return str(m.get('band') or '20 m'), 'distance', 'distance'
    bw = (m.get('load') in (False, 'FALSE')) and e['eq'] == 'bodyweight'
    if bw:
        txt = (EXERCISE_DOSE.get(e['id']) or {}).get('reps') or ('8–12' if cls in ('primary_compound', 'secondary_compound') else '12–15')
        return (txt + ('/side' if e['lat'] != 'bilateral' else '')), 'reps', 'bodyweight, load not adjustable'
    a, b = rep_window(cls, exp, rep_pos_for(e, cls, pos))
    txt = f'{a}–{b}' if b > a else str(a)
    if e['lat'] != 'bilateral': txt += '/side'
    return txt, 'reps', ''


def in_band(cls, exp, sets=None, rir=None, rest=None, reps_lo=None, reps_hi=None):
    b = band(cls, exp); bad = []
    if sets is not None and not (b['sets'][0] <= sets <= b['sets'][1]): bad.append(f'sets {sets} outside {b["sets"]}')
    if rir is not None and not (b['rir'][0] <= rir <= b['rir'][1]): bad.append(f'rir {rir} outside {b["rir"]}')
    rest_hi = HEAVY_REST[1] if cls == 'primary_compound' and exp != 'beginner' else b['rest'][1]
    if rest is not None and not (b['rest'][0] - 15 <= rest <= rest_hi + 15): bad.append(f'rest {rest} outside {b["rest"]}')
    if reps_lo is not None and reps_hi is not None:
        lo, hi = b['reps']; lo2 = lo if not reps_lo else lo   # small-muscle shift keeps reps inside [lo, hi + 5]
        if reps_lo < lo - 1 or reps_hi > hi + 5: bad.append(f'reps {reps_lo}-{reps_hi} outside {b["reps"]}')
    return bad
