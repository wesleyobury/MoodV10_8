"""Athletic production-path audit (envelope level; works on any Athletic engine version).

    python -m mood_v3.qa.athletic_envelope_audit OUT_PREFIX [--quick]

Builds a broad grid through service.generate_workout (plus Different Workout and Swap Exercise samples), renders every
workout as a trainer would read it, and computes envelope-level accounting that does not depend on engine internals
(so the same script measures the legacy engine and the rebuild).
"""
from __future__ import annotations
import itertools, json, random, re, statistics, sys
from collections import Counter, defaultdict
from mood_v3 import service as S

STATES = ['low_energy', 'bored', 'irritated', 'amped', 'stressed']
PAIRS = [['low_energy', 'amped'], ['amped', 'stressed'], ['bored', 'stressed'], ['irritated', 'low_energy'], ['irritated', 'stressed'], ['bored', 'low_energy']]
GOALS = ['improve_athleticism', 'build_strength', 'build_muscle', 'lose_weight_conditioning', 'feel_better_reduce_stress', 'stay_consistent']
LEVELS = ['beginner', 'intermediate', 'advanced']
PRESETS = ['commercial_gym']   # the only equipment context production knows (see the founder pass report)

JUMPY = ('jump', 'hop', 'bound', 'lateral_power', 'elastic', 'jump_combo', 'loaded_jump', 'reactive', 'plyo')
SPRINTY = ('acceleration', 'sled', 'sprint')
POWER_Q = set(JUMPY) | {'olympic', 'explosive_lift', 'throw', 'rotational_throw', 'rotational_power', 'upper_power', 'machine_sprint', 'integrated'} | set(SPRINTY)


def _q(it):
    df = (it['prescription'].get('direction_fields') or {})
    return df.get('quality') or ''


def is_explosive(it):
    df = it['prescription'].get('direction_fields') or {}
    if df.get('type') in ('power', 'strength', 'support', 'finisher'): return df['type'] == 'power'
    q = _q(it)
    return bool(q) and (q in POWER_Q or any(k in q for k in JUMPY + SPRINTY))


def contacts(it):
    """Foot contacts for jump / hop / bound work (per-side doubles; time-based pogo ~2 contacts / s)."""
    q = _q(it); rx = it['prescription']
    if not q or not any(k in q for k in JUMPY): return 0
    sets = rx.get('sets') or 1
    if rx.get('kind') == 'time': return int(sets * (rx.get('seconds') or 0) * 2)
    reps = rx.get('reps') or 0
    try: reps = int(reps)
    except (TypeError, ValueError): reps = int(re.findall(r'\d+', str(reps))[0]) if re.findall(r'\d+', str(reps)) else 0
    n = sets * reps * (2 if rx.get('per_side') else 1)
    if q == 'bound' and reps <= 1: n = sets * 4
    return n


def sprint_exposures(it):
    q = _q(it); rx = it['prescription']
    if q in ('acceleration', 'sled') or 'sprint' in (it['exercise']['id']):
        return rx.get('sets') or 1
    if q == 'machine_sprint': return rx.get('sets') or 1
    return 0


def sprint_metres(it):
    q = _q(it); rx = it['prescription']
    if q == 'acceleration' and rx.get('distance_m'): return (rx.get('sets') or 1) * rx['distance_m']
    return 0


def account(w):
    items = [it for b in w['blocks'] for it in b['items']]
    exp = [it for it in items if is_explosive(it)]
    olymp = [it for it in items if _q(it) == 'olympic']
    support = [it for it in items if not is_explosive(it)]
    blocks = w['blocks']
    return dict(
        n_items=len(items), n_explosive=len(exp), explosive_sets=sum(it['prescription'].get('sets') or 0 for it in exp),
        contacts=sum(contacts(it) for it in items), sprint_exp=sum(sprint_exposures(it) for it in items), sprint_m=sum(sprint_metres(it) for it in items),
        olympic_sets=sum(it['prescription'].get('sets') or 0 for it in olymp), n_support=len(support),
        support_sets=sum(it['prescription'].get('sets') or 0 for it in support), est=w['duration']['estimated_minutes'],
        n_lower_explosive=sum(1 for it in exp if any(k in _q(it) for k in JUMPY + ('acceleration', 'sled'))),
        finisher=any(b.get('type') == 'finisher' for b in blocks), repeats=any(b.get('structure') == 'repeats' for b in blocks),
        max_power_reps=max([_reps(it) for it in exp] or [0]),
        explosive_after_support=_explosive_after_support(items),
        min_power_rest=min([it['prescription'].get('rest_sec') or 0 for it in exp if _q(it) not in ('machine_sprint',)] or [0]),
    )


def _reps(it):
    r = it['prescription'].get('reps') or 0
    try: return int(r)
    except (TypeError, ValueError): return 0


def _explosive_after_support(items):
    seen_support = False
    for it in items:
        if not is_explosive(it) and it.get('role') != 'contrast_strength': seen_support = True
        elif seen_support: return True
    return False


def render(env, title=''):
    if env['status'] != 'ok':
        return f"### {title}\n  CONFLICT {env['conflict']['code']}: {env['conflict']['message']}\n"
    w = env['workout']; A = account(w)
    L = [f"### {title}", f"  {w['archetype']['name']} | {w['experience']} | {w['duration']['requested_minutes']} min (est {w['duration']['estimated_minutes']}) | states={w['states']} sore={w['soreness']['regions']} eq={w['equipment']['preset']}"]
    if w.get('athletic'):
        a = w['athletic']; L.append(f"  PRIMARY QUALITY: {a.get('primary_quality_label')} | secondary: {a.get('secondary_quality_label')} | structure: {a.get('structure_label')}")
    L.append('  Warm-up: ' + ' -> '.join(f"{x['name']} ({x['prescription_text']})" for x in w['warmup']['items']))
    for b in w['blocks']:
        L.append(f"  [{b['type']}/{b['structure']}] {b['title']}" + (f" -- {b['instructions']}" if b.get('instructions') else ''))
        for it in b['items']:
            rx = it['prescription']; df = rx.get('direction_fields') or {}
            tag = 'PWR' if is_explosive(it) else 'SUP'
            L.append(f"     {tag} {it['exercise']['name']:34} {rx['display']:16} rest {rx.get('rest_sec')}s  {rx.get('load_guidance') or ''}  [{df.get('quality') or df.get('purpose') or ''}]")
    L.append(f"  ACCOUNT: items={A['n_items']} explosive={A['n_explosive']} ({A['explosive_sets']} sets) contacts={A['contacts']} sprints={A['sprint_exp']} ({A['sprint_m']} m) olympic_sets={A['olympic_sets']} support={A['n_support']} ({A['support_sets']} sets)")
    for l in w['built_for_today'][:4]: L.append(f"  BFT: {l['text']}")
    return '\n'.join(L) + '\n'


def grid(quick=False):
    cases = []
    lv_d = list(itertools.product(LEVELS, [30, 60]))
    for lv, d in lv_d:
        for pre in PRESETS:
            for g in (GOALS if not quick else GOALS[:2]):
                cases.append(dict(experience=lv, duration=d, equipment=pre, goal=g))
        for s in STATES: cases.append(dict(experience=lv, duration=d, states=[s]))
        for p in PAIRS: cases.append(dict(experience=lv, duration=d, states=p))
        for so in (['legs'], ['shoulders'], ['lower_back'], ['chest']): cases.append(dict(experience=lv, duration=d, soreness=so))
        for so, s in ((['legs'], 'amped'), (['shoulders'], 'irritated')): cases.append(dict(experience=lv, duration=d, soreness=so, states=[s]))
        for arch in ('athletic_power', 'athletic_speed_agility', 'athletic_full_body'): cases.append(dict(experience=lv, duration=d, archetype=arch))
    out = []
    for k, c in enumerate(cases):
        for day in (('2026-10-01', '2026-10-02') if not quick else ('2026-10-01',)):
            out.append(dict(c, direction='athletic', date=day))
    return out


def run(prefix, quick=False, with_target=False):
    rows = []; text = []
    G = grid(quick)
    if with_target:
        for lv, d in itertools.product(LEVELS, [30, 60]):
            for t in (['quads', 'glutes'], ['chest', 'triceps'], 'full_body', ['back'], ['hamstrings']):
                G.append(dict(direction='athletic', experience=lv, duration=d, target=t, date='2026-10-01'))
    for k, raw in enumerate(G):
        try:
            env, st = S.generate_workout(raw, f"u{k % 7}")
        except Exception as ex:
            rows.append(dict(raw=raw, status='error', error=repr(ex))); text.append(f"### {raw}\n  ERROR {ex!r}\n"); continue
        r = dict(raw=raw, status=env['status'])
        if env['status'] == 'ok':
            w = env['workout']; r.update(account(w)); r['arch'] = w['archetype']['id']; r['ids'] = [it['exercise']['id'] for b in w['blocks'] for it in b['items']]
            r['athletic'] = {k2: v for k2, v in (w.get('athletic') or {}).items() if k2 in ('primary_quality', 'secondary_quality', 'structure', 'coherence', 'state_gate')}
        else:
            r['conflict'] = env['conflict']['code']
        rows.append(r)
        text.append(render(env, json.dumps({k2: v for k2, v in raw.items() if k2 not in ('direction',)})))
    # Different Workout + Swap samples
    rnd = random.Random(7); dw = []; sw = []
    for raw in rnd.sample([g for g in G if not g.get('soreness')], 40 if not quick else 12):
        env, st = S.generate_workout(raw, 'dw')
        if env['status'] != 'ok': continue
        env2, st2 = S.swap_workout(st, env)
        if env2['status'] != 'ok': dw.append(dict(raw=raw, status=env2['status'])); continue
        a = [it['exercise']['id'] for b in env['workout']['blocks'] for it in b['items']]
        b_ = [it['exercise']['id'] for b in env2['workout']['blocks'] for it in b['items']]
        dw.append(dict(raw=raw, changed=sum(1 for x in b_ if x not in a), n=len(b_), arch_changed=env['workout']['archetype']['id'] != env2['workout']['archetype']['id'],
                       pq=((env['workout'].get('athletic') or {}).get('primary_quality'), (env2['workout'].get('athletic') or {}).get('primary_quality'))))
        for b in env['workout']['blocks']:
            for it in b['items']:
                if not it['swap']['swappable']: continue
                e3, s3 = S.swap_exercise(st, env, it['item_id'])
                if e3['status'] != 'ok' or not s3: sw.append(dict(item=it['exercise']['id'], ok=False)); continue
                new = next(x for bb in e3['workout']['blocks'] for x in bb['items'] if x['item_id'] == it['item_id'])
                sw.append(dict(item=it['exercise']['id'], new=new['exercise']['id'], ok=True, q_old=_q(it), q_new=_q(new),
                               exp_old=is_explosive(it), exp_new=is_explosive(new), role_same=new['role'] == it['role']))
    json.dump(dict(rows=rows, dw=dw, sw=sw), open(prefix + '.json', 'w'), indent=0, default=str)
    open(prefix + '_workouts.txt', 'w').write('\n'.join(text))
    open(prefix + '_metrics.txt', 'w').write(metrics(rows, dw, sw))
    return rows, dw, sw


def _dist(vals):
    if not vals: return '-'
    vals = sorted(vals); n = len(vals)
    return f"n={n} min={vals[0]} p25={vals[n // 4]} med={vals[n // 2]} p75={vals[3 * n // 4]} max={vals[-1]}"


def metrics(rows, dw, sw):
    ok = [r for r in rows if r['status'] == 'ok']
    L = [f"builds {len(rows)} ok {len(ok)} conflicts {Counter(r.get('conflict') for r in rows if r['status'] == 'conflict')} errors {sum(r['status'] == 'error' for r in rows)}"]
    for lv in LEVELS + [None]:
        for d in (30, 60):
            sub = [r for r in ok if r['raw']['duration'] == d and (lv is None or r['raw']['experience'] == lv)]
            if not sub: continue
            L.append(f"\n== {lv or 'ALL'} {d} min ({len(sub)})")
            for k in ('n_items', 'n_explosive', 'explosive_sets', 'contacts', 'sprint_exp', 'olympic_sets', 'n_support', 'support_sets', 'est', 'max_power_reps', 'min_power_rest'):
                L.append(f"  {k:16} {_dist([r[k] for r in sub])}")
            L.append(f"  arch {Counter(r['arch'] for r in sub)}")
            L.append(f"  primary quality {Counter((r.get('athletic') or {}).get('primary_quality') for r in sub)}")
            L.append(f"  structure {Counter((r.get('athletic') or {}).get('structure') for r in sub)}")
            L.append(f"  finisher {sum(r['finisher'] for r in sub)}  repeats {sum(r['repeats'] for r in sub)}  no support {sum(r['n_support'] == 0 for r in sub)}  explosive_after_support {sum(r['explosive_after_support'] for r in sub)}")
    L.append('\n== RED FLAGS')
    flags = {
        '3+ lower-body explosive exercises': lambda r: r['n_lower_explosive'] >= 3,
        '4+ explosive exercises': lambda r: r['n_explosive'] >= 4,
        'contacts > level cap (B40/I80/A110)': lambda r: r['contacts'] > {'beginner': 40, 'intermediate': 80, 'advanced': 110}[r['raw']['experience']],
        'power reps > 8': lambda r: r['max_power_reps'] > 8,
        '7+ items': lambda r: r['n_items'] >= 7,
        'explosive after support work': lambda r: r['explosive_after_support'],
        '60 min with no athletic-strength work': lambda r: r['raw']['duration'] == 60 and r['n_support'] == 0,
        'finisher': lambda r: r['finisher'],
        'olympic for beginner': lambda r: r['raw']['experience'] == 'beginner' and r['olympic_sets'] > 0,
        'power rest < 45 s': lambda r: 0 < r['min_power_rest'] < 45,
        'sprints > 10 exposures': lambda r: r['sprint_exp'] > 10,
    }
    for name, fn in flags.items():
        hits = [r for r in ok if fn(r)]
        L.append(f"  {name:42} {len(hits):4} / {len(ok)}" + (f"   e.g. {json.dumps({k: v for k, v in hits[0]['raw'].items() if k not in ('direction', 'date')})}" if hits else ''))
    # states
    L.append('\n== STATE (60 min, intermediate) median explosive sets / contacts / support sets / est')
    for s in [None] + STATES:
        sub = [r for r in ok if r['raw']['duration'] == 60 and r['raw']['experience'] == 'intermediate' and (r['raw'].get('states') == ([s] if s else None)) and not r['raw'].get('soreness') and not r['raw'].get('archetype') and r['raw'].get('goal') in (None, 'stay_consistent')]
        if sub: L.append(f"  {str(s):12} n={len(sub)} exp_sets={statistics.median(r['explosive_sets'] for r in sub)} contacts={statistics.median(r['contacts'] for r in sub)} support={statistics.median(r['support_sets'] for r in sub)} est={statistics.median(r['est'] for r in sub)} gate={Counter(str((r.get('athletic') or {}).get('state_gate')) for r in sub)}")
    L.append('\n== GOAL (60 min, no State) median explosive sets / support sets')
    for g in GOALS:
        sub = [r for r in ok if r['raw']['duration'] == 60 and r['raw'].get('goal') == g]
        if sub: L.append(f"  {g:28} n={len(sub)} exp_sets={statistics.median(r['explosive_sets'] for r in sub)} support={statistics.median(r['support_sets'] for r in sub)} pq={Counter((r.get('athletic') or {}).get('primary_quality') for r in sub).most_common(4)}")
    if dw:
        L.append(f"\n== DIFFERENT WORKOUT n={len(dw)} median changed {statistics.median([d.get('changed', 0) for d in dw])} arch_changed {sum(bool(d.get('arch_changed')) for d in dw)} pq_changed {sum(1 for d in dw if d.get('pq') and d['pq'][0] != d['pq'][1])} identical {sum(1 for d in dw if d.get('changed') == 0)}")
    if sw:
        okk = [s for s in sw if s['ok']]
        L.append(f"== SWAP n={len(sw)} ok={len(okk)} explosive->non {sum(1 for s in okk if s['exp_old'] and not s['exp_new'])} non->explosive {sum(1 for s in okk if not s['exp_old'] and s['exp_new'])} quality kept {sum(1 for s in okk if s['q_old'] == s['q_new'])} role kept {sum(1 for s in okk if s['role_same'])}")
    return '\n'.join(L) + '\n'


if __name__ == '__main__':
    run(sys.argv[1], quick='--quick' in sys.argv, with_target='--target' in sys.argv)
    print(open(sys.argv[1] + '_metrics.txt').read())
