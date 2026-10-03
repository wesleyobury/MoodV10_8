"""Athletic final pre-launch trainer QA (production path).

Generates a large matrix of REAL workouts through service.generate_workout and reports the trainer-quality metrics the
founder brief asks about: athletic composition (count, meaningful A/B work, low-level C work), loaded power, archetype
identity, strength-support structure (superset share), sequencing, State interactions and the Athletic Trainer
Coherence Gate. It also writes a human-readable trainer-read sample.

    python -m mood_v3.qa.athletic_prelaunch_qa <out_prefix> [--quick]
"""
from __future__ import annotations
import collections, itertools, json, sys
from mood_v3 import service as S
from mood_v3.engines.athletic import athletic_core as C

ARCHS = ('athletic_power', 'athletic_speed_agility', 'athletic_full_body', None)
ARCH_SHORT = {'athletic_power': 'Power', 'athletic_speed_agility': 'Speed+Plyo', 'athletic_full_body': 'FullBody', None: "MOOD's Pick"}
LEVELS = ('beginner', 'intermediate', 'advanced')
STATES1 = ('low_energy', 'bored', 'irritated', 'amped', 'stressed')
PAIRS = (('amped', 'bored'), ('low_energy', 'amped'), ('stressed', 'amped'), ('irritated', 'bored'), ('low_energy', 'stressed'), ('irritated', 'amped'),
         ('bored', 'stressed'))
TRIPLES = (('low_energy', 'bored', 'irritated'), ('amped', 'bored', 'irritated'), ('stressed', 'irritated', 'amped'))
GOALS = ('improve_athleticism', 'build_strength', 'build_muscle', 'lose_weight_conditioning', 'feel_better_reduce_stress', 'stay_consistent')


def cases(quick=False):
    days = ('2026-10-05', '2026-10-06', '2026-10-07') if not quick else ('2026-10-05',)
    out = []
    for arch, lv, dur in itertools.product(ARCHS, LEVELS, (30, 60)):
        base = dict(experience=lv, duration=dur)
        if arch: base['archetype'] = arch
        sets = [()] + [(s,) for s in STATES1] + list(PAIRS) + list(TRIPLES)
        for st in sets:
            for g in (GOALS if not st else ('improve_athleticism',)) if not quick else ('improve_athleticism',):
                for d in days:
                    out.append(dict(base, states=list(st), goal=g, date=d))
        for so in (['legs'], ['shoulders'], ['lower_back']):
            for d in days: out.append(dict(base, soreness=so, goal='improve_athleticism', date=d))
        for eq in ('free_weight_limited', 'minimal'):
            for d in days: out.append(dict(base, equipment=eq, goal='improve_athleticism', date=d))
        for tg in (['glutes', 'hamstrings'], ['chest', 'shoulders'], ['core'], ['quads']):
            out.append(dict(base, target_muscles=tg, goal='improve_athleticism', date=days[0]))
    return out


LOADED = {'olympic', 'explosive_lift', 'loaded_jump', 'speed_strength', 'swing', 'landmine_rot'}
LOADED_UPPER = {'db_push_press', 'landmine_push_press', 'landmine_split_jerk', 'push_press'}


def is_loaded(i):
    k = C.kind_of(i)
    return bool(k) and (k in LOADED or i in LOADED_UPPER) and C.EX[i]['eq'] not in ('bodyweight', 'bands')


def build(raw, key):
    raw = dict(direction='athletic', equipment=raw.get('equipment', 'commercial_gym'), **{k: v for k, v in raw.items() if k != 'equipment'})
    env, _ = S.generate_workout(raw, key)
    return raw, env


def facts(raw, env):
    if env['status'] != 'ok': return dict(conflict=env['conflict']['code'])
    w = env['workout']; a = w.get('athletic') or {}
    blocks = w['blocks']
    pw = [(b, it) for b in blocks for it in b['items'] if it['prescription']['direction_fields'].get('category') == 'ATHLETIC']
    st = [(b, it) for b in blocks for it in b['items'] if it['prescription']['direction_fields'].get('category') == 'ATHLETIC_STRENGTH' and b['type'] == 'strength']
    ids = [it['exercise']['id'] for _, it in pw]
    tiers = [it['prescription']['direction_fields'].get('cost_tier') for _, it in pw]
    kinds = [C.kind_of(i) for i in ids]
    sblocks = [b for b in blocks if b['type'] == 'strength']
    f = dict(arch=w['archetype']['id'], structure=a.get('structure'), pq=a.get('primary_quality'), n_ath=len(pw), n_ab=sum(t in ('A', 'B') for t in tiers),
             n_c=sum(t == 'C' for t in tiers), n_loaded=sum(is_loaded(i) for i in ids), primary=ids[0] if ids else None,
             primary_loaded=bool(ids) and is_loaded(ids[-1] if blocks[0]['structure'] == 'superset' else ids[0]),
             primary_tier=tiers[0] if tiers else None, n_strength=len(st), strength_blocks=len(sblocks),
             strength_form='none' if not st else ('superset' if any(b['structure'] == 'superset' and sum(1 for it in b['items'] if it['prescription']['direction_fields'].get('category') == 'ATHLETIC_STRENGTH') == 2 for b in sblocks)
                                                  else 'paired_support' if any(b['structure'] == 'superset' for b in sblocks) else ('two_straight' if len(st) == 2 else 'one_straight')),
             n_sprint=sum(k == 'sprint' for k in kinds), n_sled=sum(k == 'sled' for k in kinds), mode=a.get('composition'), n_jump=sum(k in C.JUMP_KINDS for k in kinds), n_throw=sum(k in C.THROW_KINDS for k in kinds),
             n_oly=sum(k in C.OLY_KINDS for k in kinds), est=w['duration']['estimated_minutes'], ids=ids, kinds=kinds,
             contacts=(a.get('accounting') or {}).get('contacts'), explosive_sets=(a.get('accounting') or {}).get('explosive_sets'),
             gate=(a.get('trainer_gate') or {}).get('issues', []), roles=[it['prescription']['direction_fields'].get('performance_role') for b in blocks for it in b['items']])
    lower = sum(1 for i in ids if C.q_of(i) in C.LOWER_Q and C.kind_of(i) not in C.THROW_KINDS)
    upper = sum(1 for i in ids if C.q_of(i) in C.UPPER_Q or C.kind_of(i) in C.THROW_KINDS or C.kind_of(i) in ('upper', 'muscle_up'))
    f.update(n_lower=lower, n_upper_rot=upper)
    return f


def render(raw, env, title):
    if env['status'] != 'ok': return f"### {title}\n  CONFLICT {env['conflict']['code']}: {env['conflict']['message']}\n"
    w = env['workout']; a = w.get('athletic') or {}
    L = [f"### {title}", f"  {w['archetype']['name']} | {w['experience']} | {w['duration']['requested_minutes']} min (est {w['duration']['estimated_minutes']}) | "
                         f"states={w['states']} sore={w['soreness']['regions']} eq={w['equipment']['preset']} | {a.get('structure_label')} | primary: {a.get('primary_quality_label')}"]
    L.append('  Warm-up: ' + ' -> '.join(f"{x['name']} ({x['prescription_text']})" for x in w['warmup']['items']))
    for b in w['blocks']:
        L.append(f"  <{(b.get('phase_label') or '').upper()}> [{b['type']}/{b['structure']}{' x' + str(b['rounds']) if b['structure'] != 'straight' else ''}] {b['title']}")
        for it in b['items']:
            rx = it['prescription']; df = rx.get('direction_fields') or {}
            L.append(f"     {it['exercise']['name']:38} {rx['display']:15} rest {str(rx.get('rest_sec') or '-'):>4}  {df.get('performance_role') or ''}" + (f"  [{df['context_tag'].upper()}]" if df.get('context_tag') else '')
                     + (f"  tier {df['cost_tier']}" if df.get('cost_tier') else ''))
    gi = (a.get('trainer_gate') or {}).get('issues') or []
    if gi: L.append(f"  GATE: {gi}")
    return '\n'.join(L) + '\n'


def unconstrained(raw):
    return not raw.get('states') and not raw.get('soreness') and raw.get('equipment', 'commercial_gym') == 'commercial_gym'


def main(prefix, quick=False):
    rows = []
    for n, raw in enumerate(cases(quick)):
        r, env = build(raw, f'qa{n}')
        rows.append((raw, env, facts(r, env)))
    M = []
    def pct(xs, fn):
        xs = list(xs); return f"{100 * sum(1 for x in xs if fn(x)) / max(1, len(xs)):.0f}%"
    def mean(xs, key):
        xs = [x[key] for x in xs]; return f"{sum(xs) / max(1, len(xs)):.2f}"
    ok = [(raw, f) for raw, env, f in rows if 'conflict' not in f]
    M.append(f"builds {len(rows)}  ok {len(ok)}  conflicts {len(rows) - len(ok)} {collections.Counter(f['conflict'] for _, _, f in rows if 'conflict' in f)}")
    M.append(f"gate issues (any) {pct([f for _, f in ok], lambda f: f['gate'])}  by code {collections.Counter(c.split(':')[0] for _, f in ok for c in f['gate'])}")
    M.append('\n== UNCONSTRAINED (no State, no soreness, commercial gym), by archetype / level / duration ==')
    M.append(f"{'cell':34} {'n':>4} {'n_ath':>6} {'n_A/B':>6} {'n_C':>5} {'>=3 ath':>8} {'>=2 A/B':>8} {'loaded':>7} {'prim ld':>7} {'oly':>5} {'sprint':>7} {'jump2+':>7} {'superset':>8} {'est':>6}")
    for arch, lv, dur in itertools.product(ARCHS, LEVELS, (60, 30)):
        xs = [f for raw, f in ok if unconstrained(raw) and raw.get('archetype') == arch and raw['experience'] == lv and raw['duration'] == dur]
        if not xs: continue
        M.append(f"{ARCH_SHORT[arch] + ' ' + lv[:3] + ' ' + str(dur):34} {len(xs):4} {mean(xs, 'n_ath'):>6} {mean(xs, 'n_ab'):>6} {mean(xs, 'n_c'):>5} {pct(xs, lambda f: f['n_ath'] >= 3):>8} "
                 f"{pct(xs, lambda f: f['n_ab'] >= 2):>8} {pct(xs, lambda f: f['n_loaded'] >= 1):>7} {pct(xs, lambda f: f['primary_loaded']):>7} {pct(xs, lambda f: f['n_oly'] >= 1):>5} "
                 f"{pct(xs, lambda f: f['n_sprint'] >= 1):>7} {pct(xs, lambda f: f['n_jump'] >= 2):>7} {pct(xs, lambda f: f['strength_form'] == 'superset'):>8} {mean(xs, 'est'):>6}")
    M.append('\n== STRENGTH-SUPPORT FORM (all ok builds) ==')
    for lv in LEVELS:
        xs = [f for raw, f in ok if raw['experience'] == lv]
        M.append(f"  {lv:13} " + '  '.join(f"{k} {100 * v / len(xs):.0f}%" for k, v in sorted(collections.Counter(f['strength_form'] for f in xs).items())))
    xs = [f for raw, f in ok if raw.get('goal') == 'build_strength']
    M.append(f"  build_strength " + '  '.join(f"{k} {100 * v / len(xs):.0f}%" for k, v in sorted(collections.Counter(f['strength_form'] for f in xs).items())))
    M.append('\n== STATES (int + adv, 60 min, all archetypes) ==')
    for st in [()] + [(s,) for s in STATES1] + list(PAIRS) + list(TRIPLES):
        xs = [f for raw, f in ok if tuple(raw.get('states') or ()) == st and raw['experience'] != 'beginner' and raw['duration'] == 60 and not raw.get('soreness') and raw.get('equipment', 'commercial_gym') == 'commercial_gym' and raw.get('goal') == 'improve_athleticism' and not raw.get('target_muscles')]
        if not xs: continue
        M.append(f"  {'+'.join(st) or 'none':32} n={len(xs):3} ath {mean(xs, 'n_ath')} A/B {mean(xs, 'n_ab')} loaded {pct(xs, lambda f: f['n_loaded'] >= 1)} superset {pct(xs, lambda f: f['strength_form'] == 'superset')} est {mean(xs, 'est')}")
    M.append('\n== POWER int/adv 60 (all inputs on commercial gym): primary exercise mix ==')
    xs = [f for raw, f in ok if f['arch'] == 'athletic_power' and raw['experience'] != 'beginner' and raw['duration'] == 60 and raw.get('equipment', 'commercial_gym') == 'commercial_gym']
    M.append('  ' + ', '.join(f"{k} {v}" for k, v in collections.Counter(f['primary'] for f in xs).most_common(20)))
    M.append('\n== SPEED+PLYO int/adv 60: primary mix / elements ==')
    xs = [f for raw, f in ok if f['arch'] == 'athletic_speed_agility' and raw['experience'] != 'beginner' and raw['duration'] == 60 and raw.get('equipment', 'commercial_gym') == 'commercial_gym']
    M.append('  ' + ', '.join(f"{k} {v}" for k, v in collections.Counter(f['primary'] for f in xs).most_common(20)))
    M.append(f"  sprint/sled present {pct(xs, lambda f: f['n_sprint'] >= 1)}  2+ lower speed/plyo {pct(xs, lambda f: f['n_lower'] >= 2)}  throw present {pct(xs, lambda f: f['n_throw'] >= 1)}")
    M.append('\n== FULL-BODY int/adv 60: coverage ==')
    xs = [f for raw, f in ok if f['arch'] == 'athletic_full_body' and raw['experience'] != 'beginner' and raw['duration'] == 60 and raw.get('equipment', 'commercial_gym') == 'commercial_gym']
    M.append(f"  lower {pct(xs, lambda f: f['n_lower'] >= 1)}  upper/rot {pct(xs, lambda f: f['n_upper_rot'] >= 1)}  loaded {pct(xs, lambda f: f['n_loaded'] >= 1)}  all three {pct(xs, lambda f: f['n_lower'] >= 1 and f['n_upper_rot'] >= 1 and f['n_loaded'] >= 1)}")
    M.append('\n== EXERCISE FREQUENCY (athletic movements, all ok builds) ==')
    cnt = collections.Counter(i for _, f in ok for i in f['ids'])
    M.append('  ' + ', '.join(f"{k} {v}" for k, v in cnt.most_common()))
    unused = sorted(set(C.POWER) - set(cnt))
    M.append(f"  never used: {unused}")
    M.append('\n== STRUCTURAL REPETITION: most common block-shape signatures (int/adv 60) ==')
    sig = collections.Counter('|'.join(f"{k}" for k in f['kinds']) + f" + {f['strength_form']}" for raw, f in ok if raw['experience'] != 'beginner' and raw['duration'] == 60)
    tot = sum(sig.values())
    for k, v in sig.most_common(8): M.append(f"  {100 * v / tot:4.1f}%  {k}")
    open(prefix + '_metrics.txt', 'w').write('\n'.join(M) + '\n')
    # trainer read: the focus cells the brief names, plus random others
    focus = []
    picks = [('athletic_power', 'intermediate', 60, ()), ('athletic_power', 'advanced', 60, ()), ('athletic_power', 'advanced', 60, ('amped',)), ('athletic_power', 'intermediate', 60, ('amped',)),
             ('athletic_full_body', 'intermediate', 60, ()), ('athletic_full_body', 'advanced', 60, ()), ('athletic_full_body', 'advanced', 60, ('amped',)),
             ('athletic_speed_agility', 'intermediate', 60, ()), ('athletic_speed_agility', 'advanced', 60, ()), ('athletic_speed_agility', 'beginner', 60, ()),
             ('athletic_speed_agility', 'intermediate', 30, ()), (None, 'intermediate', 60, ('low_energy',)), (None, 'advanced', 60, ('bored',)),
             ('athletic_power', 'intermediate', 30, ()), ('athletic_power', 'beginner', 60, ()), (None, 'advanced', 60, ('low_energy', 'amped')),
             (None, 'intermediate', 60, ('stressed', 'irritated', 'amped')), ('athletic_power', 'advanced', 60, ('stressed',)), (None, 'intermediate', 60, ())]
    for arch, lv, dur, st in picks:
        for raw, env, f in rows:
            if raw.get('archetype') == arch and raw['experience'] == lv and raw['duration'] == dur and tuple(raw.get('states') or ()) == st and not raw.get('soreness') \
                    and raw.get('equipment', 'commercial_gym') == 'commercial_gym' and raw.get('goal') == 'improve_athleticism' and not raw.get('target_muscles'):
                focus.append(render(raw, env, f"{ARCH_SHORT[arch]} | {lv} | {dur} | {'+'.join(st) or 'no State'} | {raw['date']}"))
    for raw, env, f in rows:
        if raw.get('soreness') and raw['experience'] == 'intermediate' and raw['duration'] == 60 and raw['date'] == '2026-10-05':
            focus.append(render(raw, env, f"{ARCH_SHORT[raw.get('archetype')]} | sore {raw['soreness']} | intermediate 60"))
        if raw.get('equipment') in ('minimal', 'free_weight_limited') and raw['experience'] == 'advanced' and raw['duration'] == 60 and raw['date'] == '2026-10-05':
            focus.append(render(raw, env, f"{ARCH_SHORT[raw.get('archetype')]} | {raw['equipment']} | advanced 60"))
        if raw.get('goal') == 'build_strength' and not raw.get('states') and raw['duration'] == 60 and raw['date'] == '2026-10-05' and raw['experience'] != 'beginner':
            focus.append(render(raw, env, f"{ARCH_SHORT[raw.get('archetype')]} | build_strength | {raw['experience']} 60"))
    open(prefix + '_trainer_read.txt', 'w').write('\n'.join(focus))
    return rows




# ------------------------------------------------------------------ composition / template QA (composition pass)
TRAD = set(C.STRENGTH)


def template_report(prefix, rows=None):
    """Sprint frequency, traditional-strength count, athletic support, loaded-power use, composition modes, consecutive repetition."""
    rows = rows if rows is not None else [(raw, env, facts(*build(raw, f'qa{n}'))) for n, raw in enumerate(cases())]
    ok = [(raw, f) for raw, env, f in rows if 'conflict' not in f]
    M = []
    def pct(xs, fn):
        xs = list(xs); return f"{100 * sum(1 for x in xs if fn(x)) / max(1, len(xs)):.0f}%"
    def athletic_support(f):    # the slot a second lift used to take holds loaded / unilateral athletic work instead
        extra = f['ids'][1:]
        return f['n_strength'] <= 1 and any(C.is_major_loaded(i) or C.kind_of(i) in ('pop', 'uni_jump', 'muscle_up') for i in extra)
    groups = [('ALL builds', ok), ('trained 60 min (int/adv)', [(r, f) for r, f in ok if r['experience'] != 'beginner' and r['duration'] == 60]),
              ('trained 60 min, no State', [(r, f) for r, f in ok if r['experience'] != 'beginner' and r['duration'] == 60 and not r.get('states') and not r.get('soreness')])]
    for arch in ('athletic_power', 'athletic_speed_agility', 'athletic_full_body'):
        groups.append((f"  {ARCH_SHORT[arch]} (all levels/durations)", [(r, f) for r, f in ok if f['arch'] == arch]))
    M.append(f"{'group':40} {'n':>5} {'sprint':>7} {'sled':>6} {'0 lift':>7} {'1 lift':>7} {'2 lifts':>8} {'ath.support':>12} {'loaded pw':>10} {'oly/KB/DB':>10}")
    for name, xs in groups:
        fs = [f for _, f in xs]
        M.append(f"{name:40} {len(fs):5} {pct(fs, lambda f: f['n_sprint'] >= 1):>7} {pct(fs, lambda f: f['n_sled'] >= 1):>6} {pct(fs, lambda f: f['n_strength'] == 0):>7} "
                 f"{pct(fs, lambda f: f['n_strength'] == 1):>7} {pct(fs, lambda f: f['n_strength'] >= 2):>8} {pct(fs, athletic_support):>12} {pct(fs, lambda f: f['n_loaded'] >= 1):>10} "
                 f"{pct(fs, lambda f: any(C.kind_of(i) in C.OLY_KINDS | {'swing'} for i in f['ids'])):>10}")
    M.append('\nsessions with two sprint variations: ' + pct([f for _, f in ok], lambda f: f['n_sprint'] >= 2))
    tm = [f for r, f in ok if r['experience'] != 'beginner' and r['duration'] == 60]
    M.append('\ncomposition modes, trained 60 min: ' + ', '.join(f"{k} {100 * v / len(tm):.0f}%" for k, v in collections.Counter(str(f['mode']) for f in tm).most_common()))
    # strength lifts that lean athletic
    lifts = []
    for r, env, f in rows:
        if 'conflict' in f: continue
        for b in env['workout']['blocks']:
            for it in b['items']:
                if b['type'] == 'strength' and it['exercise']['id'] in TRAD: lifts.append(it['exercise']['id'])
    M.append(f"traditional lifts that are athletic-leaning (unilateral, trap-bar / front-loaded, pull-ups, landmine): {100 * sum(i in C.ATHLETIC_LEAN for i in lifts) / max(1, len(lifts)):.0f}% of {len(lifts)}")
    M.append('most common traditional lifts: ' + ', '.join(f"{k} {v}" for k, v in collections.Counter(lifts).most_common(10)))
    # consecutive sessions (8 days, history on)
    same_mode = same_shape = total = 0; seqs = []
    for lv, arch, user in itertools.product(('intermediate', 'advanced'), ('athletic_power', 'athletic_speed_agility', 'athletic_full_body', None), range(4)):
        hist = []; prev = None; seq = []
        for day in range(1, 9):
            raw = dict(direction='athletic', equipment='commercial_gym', goal='improve_athleticism', experience=lv, duration=60, date=f'2026-11-{day:02d}', **({'archetype': arch} if arch else {}))
            env, st = S.generate_workout(raw, f'rep{lv}{arch}{user}', hist)
            hist.append(st['history_record']); f = facts(raw, env)
            shape = ('|'.join(f['kinds']), f['n_strength'], f['strength_form'])
            if prev:
                total += 1; same_mode += prev[0] == f['mode']; same_shape += prev[1] == shape
            prev = (f['mode'], shape); seq.append(f"{f['mode']}:{f['n_ath']}+{f['n_strength']}")
        if user == 0: seqs.append(f"  {lv[:3]} {ARCH_SHORT[arch]:12} " + ' | '.join(seq))
    M.append(f"\nconsecutive sessions (8 days, history on, {total} pairs): same composition mode {100 * same_mode / total:.0f}%, identical block shape {100 * same_shape / total:.0f}%")
    M += seqs
    open(prefix + '_template.txt', 'w').write('\n'.join(M) + '\n')
    return M


if __name__ == '__main__':
    R = main(sys.argv[1], '--quick' in sys.argv)
    template_report(sys.argv[1], R)
