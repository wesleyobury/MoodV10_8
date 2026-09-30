"""Realistic Strength time model + duration windows (Core rebuild, Phase 1).

Duration emerges from reps, sets, rest, pairing and setup; the reconciler (core.reconcile) nudges the session into the
requested window by adding or removing USEFUL work inside the bands, never by chasing a set count.
"""
from __future__ import annotations
import re

# (lo, hi, aim) minutes. 60: 45-60 (founder rest audit: a 60-minute session may honestly finish at 45-55 once rest is no
# longer inflated; the reconciler adds useful work only below 45, never rest).
WINDOW = {60: (45, 60, 52), 30: (25, 31, 28)}
WARMUP = {60: 8 * 60, 30: 5 * 60}                     # general warm-up incl. ramp-up sets of the first lift
SETUP = {'primary_compound': 150, 'secondary_compound': 90, 'accessory': 70, 'extra': 60, 'finisher': 60}
PER_REP = {'compound': 3.2, 'isolation': 2.4, 'integrated': 3.6}
TRANSITION = 15                                        # seconds between paired exercises


def reps_hi(txt):
    nums = [int(x) for x in re.findall(r'\d+', str(txt))]
    return max(nums) if nums else 10


def set_seconds(row):
    kind = row.get('kind', 'reps')
    if kind == 'time': return min(90, reps_hi(row['reps'])) + 5
    if kind == 'distance': return 45
    per = PER_REP.get(row.get('ecls', 'compound'), 3.0)
    n = reps_hi(row['reps']) * (2 if '/side' in str(row['reps']) else 1)
    return n * per + 5


def method_seconds(row):
    from .methods import extra_seconds
    return extra_seconds(row)


def block_seconds(b, rows_by_slot):
    s = b['structure_id']; items = b['items']; r = b['rounds']; rest = b['rest_after_round']
    if s == 'finisher':
        return r * (40 + rest) - rest + SETUP['finisher']
    if s in ('straight', 'pyramid', 'ladder'):
        row = rows_by_slot[items[0]['slot']]; work = set_seconds(row)
        if items[0].get('scheme'): work = max(work, reps_hi(items[0]['reps'].split('/')[0]) * PER_REP.get(row.get('ecls', 'compound'), 3.0) + 5)
        return r * (work + rest) - rest + SETUP.get(row['cls'], 70) + method_seconds(row)
    if s in ('superset', 'circuit'):
        work = sum(set_seconds(rows_by_slot[it['slot']]) for it in items) + TRANSITION * (len(items) - 1)
        return r * (work + rest) - rest + max(SETUP.get(rows_by_slot[it['slot']]['cls'], 70) for it in items) + 30 + sum(method_seconds(rows_by_slot[it['slot']]) for it in items)
    return 0


def estimate_minutes(blocks, rows, dur):
    by = {r['slot']: r for r in rows}
    t = WARMUP[dur] + sum(block_seconds(b, by) for b in blocks)
    return round(t / 60.0, 1)
