#!/usr/bin/env python3
"""
Quick audit: Parse each muscle gainer data file, group by training_style + exercise_type, print distribution per file. Used to verify the heuristic tagger left a sensible spread.
"""
import re
from pathlib import Path
from collections import Counter, defaultdict

DATA_DIR = Path('/app/frontend/data')
FILES = [
    ('Chest', 'chest-workouts-data.ts'),
    ('Back', 'back-workouts-data.ts'),
    ('Shoulders', 'shoulders-workouts-data.ts'),
    ('Biceps', 'biceps-workouts-data.ts'),
    ('Triceps', 'triceps-workouts-data.ts'),
    ('Abs', 'abs-workouts-data.ts'),
    ('Quads', 'quads-workouts-data.ts'),
    ('Hamstrings', 'hamstrings-workouts-data.ts'),
    ('Glutes', 'glutes-workouts-data.ts'),
    ('Calves', 'calves-workouts-data.ts'),
    ('CompoundLegs', 'compound-legs-workouts-data.ts'),
]

NAME_RE = re.compile(r"name:\s*'([^']+)'")
EQ_RE = re.compile(r"equipment:\s*'([^']+)'")
TIER_RE = re.compile(r'^\s*(beginner|intermediate|advanced):\s*\[')
ET_RE = re.compile(r"exercise_type:\s*'([^']+)'")
MP_RE = re.compile(r"movement_pattern:\s*'([^']+)'")
TS_RE = re.compile(r"training_style:\s*'([^']+)'")
IC_RE = re.compile(r"intensity_cost:\s*(\d+)")

def parse(path):
    workouts = []
    eq = None; tier = None
    cur = None
    with open(path) as f:
        for line in f:
            m = EQ_RE.search(line)
            if m and cur is None:
                eq = m.group(1)
            m = TIER_RE.match(line)
            if m and cur is None:
                tier = m.group(1)
            if re.match(r'^        \{\s*$', line):
                cur = {'equipment': eq, 'tier': tier}
                continue
            if cur is not None:
                m = NAME_RE.search(line)
                if m and 'name' not in cur: cur['name'] = m.group(1)
                m = ET_RE.search(line)
                if m: cur['et'] = m.group(1)
                m = MP_RE.search(line)
                if m: cur['mp'] = m.group(1)
                m = TS_RE.search(line)
                if m: cur['ts'] = m.group(1)
                m = IC_RE.search(line)
                if m: cur['ic'] = int(m.group(1))
                if re.match(r'^        \},?\s*$', line):
                    workouts.append(cur)
                    cur = None
    return workouts

print(f"{'Muscle':14s} {'Total':>6s} {'Strength':>10s} {'Hyper':>10s} {'Pump':>10s} {'Mixed':>10s} {'Comp':>8s} {'Iso':>8s}")
for muscle, fname in FILES:
    ws = parse(DATA_DIR / fname)
    style = Counter(w.get('ts') for w in ws)
    et = Counter(w.get('et') for w in ws)
    print(f"{muscle:14s} {len(ws):>6d} {style.get('strength',0):>10d} "
          f"{style.get('hypertrophy',0):>10d} {style.get('pump',0):>10d} "
          f"{style.get('mixed',0):>10d} {et.get('compound',0):>8d} {et.get('isolation',0):>8d}")

print("\n=== Sample per-tier flavor counts (CHEST flat bench) ===")
ws = parse(DATA_DIR / 'chest-workouts-data.ts')
for w in ws[:12]:
    print(f"  [{w.get('tier')}] {w.get('name'):35s}  {w.get('ts')} ic={w.get('ic')}")
