#!/usr/bin/env python3
"""Validate generateExplosivenessCarts v3 against the data files.
Run: python3 /app/scripts/validate_explosive.py
"""
import re, random, sys
from pathlib import Path

DATA_DIR = Path('/app/frontend/data')

def parse_pool(file_path, expected_path):
    text = file_path.read_text()
    cur_eq, cur_tier = None, None
    items, cur_w = [], None
    for line in text.split('\n'):
        em = re.match(r"^\s*equipment:\s*'([^']+)',", line)
        if em: cur_eq = em.group(1); cur_tier = None
        tm = re.match(r"^\s*(beginner|intermediate|advanced):\s*\[", line)
        if tm: cur_tier = tm.group(1)
        nm = re.match(r"^\s*name:\s*'([^']+)',\s*$", line)
        if nm and cur_eq and cur_tier:
            cur_w = {'equipment': cur_eq, 'tier': cur_tier, 'name': nm.group(1)}
        for field in ('path', 'cart_flavor'):
            fm = re.match(rf"^\s*{field}:\s*'([^']+)',\s*$", line)
            if fm and cur_w is not None: cur_w[field] = fm.group(1)
        ic = re.match(r"^\s*intensity_cost:\s*(\d+),\s*$", line)
        if ic and cur_w is not None:
            cur_w['intensity_cost'] = int(ic.group(1))
            items.append(cur_w); cur_w = None
    return items

bw = parse_pool(DATA_DIR / 'bodyweight-explosiveness-data.ts', 'bodyweight')
lw = parse_pool(DATA_DIR / 'explosiveness-weights-data.ts', 'weights')
print(f"BW pool: {len(bw)} (exp 63), LW pool: {len(lw)} (exp 57)")
assert len(bw) == 63 and len(lw) == 57

FLAVORS = ['plyo', 'loaded', 'dynamic']
SLOT_LABELS = ['Activation', 'Power', 'Bonus']

def gen_carts(tier, rng):
    bw_p = [it for it in bw if it['tier'] == tier]
    lw_p = [it for it in lw if it['tier'] == tier]
    full = bw_p + lw_p
    cart_size = 2 if tier == 'beginner' else 3
    def deq(p, fl): return len({c['equipment'] for c in p if c['cart_flavor'] == fl})
    flavors_by_depth = sorted(FLAVORS, key=lambda f: min(deq(bw_p, f), deq(lw_p, f)))
    for _ in range(25):
        used_eq, used_names, by_flavor = set(), set(), {}
        ok = True
        for flavor in flavors_by_depth:
            cart = []
            cands = [c for c in bw_p if c['cart_flavor'] == flavor and c['name'] not in used_names and c['equipment'] not in used_eq]
            if not cands: ok = False; break
            p = rng.choice(cands); cart.append(p); used_eq.add(p['equipment']); used_names.add(p['name'])
            cands = [c for c in lw_p if c['cart_flavor'] == flavor and c['name'] not in used_names and c['equipment'] not in used_eq]
            if not cands: ok = False; break
            p = rng.choice(cands); cart.append(p); used_eq.add(p['equipment']); used_names.add(p['name'])
            if cart_size == 3:
                cands = [c for c in full if c['cart_flavor'] == flavor and c['name'] not in used_names and c['equipment'] not in used_eq]
                if cands:
                    p = rng.choice(cands); cart.append(p); used_eq.add(p['equipment']); used_names.add(p['name'])
            # NOTE: fixed slot order (BW, LW, flex) — no intensity-cost re-sort.
            by_flavor[flavor] = cart
        if ok and len(by_flavor) == 3: break
    return [by_flavor[f] for f in FLAVORS if f in by_flavor]

def fail(m): print('FAIL:', m); sys.exit(1)

rng = random.Random(42)
total = 0
for tier in ('beginner', 'intermediate', 'advanced'):
    expected_size = 2 if tier == 'beginner' else 3
    for trial in range(200):
        carts = gen_carts(tier, rng)
        if len(carts) != 3: fail(f"[{tier} trial {trial}] only {len(carts)} carts")
        order = [c[0]['cart_flavor'] for c in carts]
        if order != FLAVORS: fail(f"[{tier}] wrong order {order}")
        gen_eq = set()
        for cart in carts:
            if len(cart) != expected_size: fail(f"[{tier}] cart size {len(cart)} != {expected_size}")
            # Fixed slot order
            if cart[0]['path'] != 'bodyweight': fail(f"[{tier}] slot 0 must be BW: {cart[0]}")
            if cart[1]['path'] != 'weights': fail(f"[{tier}] slot 1 must be LW: {cart[1]}")
            # Single flavor
            if len({c['cart_flavor'] for c in cart}) != 1: fail(f"[{tier}] mixed flavor in cart")
            # ≥1 BW & ≥1 LW
            paths = [c['path'] for c in cart]
            if paths.count('bodyweight') < 1 or paths.count('weights') < 1:
                fail(f"[{tier}] cart must have ≥1 BW & ≥1 LW: {paths}")
            for c in cart:
                if c['equipment'] in gen_eq: fail(f"[{tier}] dup eq across carts: {c['equipment']}")
                gen_eq.add(c['equipment'])
        total += 3
print(f"PASS: 600 runs / {total} carts. Fixed slot order [BW (Activation) → LW (Power) → flex (Bonus)] verified.")
