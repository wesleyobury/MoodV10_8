"""Strength final pre-launch trainer-quality QA: production-path builds over a broad matrix, judged by the Trainer Coherence Gate
plus headline distributions (Amped shapes, accessory pools, level eligibility). Usage:
    python -m mood_v3.qa.strength_trainer_qa [out.json] [--dump sessions.txt]
"""
import sys, json, itertools, collections, time
try:
    from .. import service as S
except ImportError:
    sys.path.insert(0, '.'); from mood_v3 import service as S
from mood_v3.engines.strength import trainer_gate as TG, audit_engine as AE

EX = AE.EX
ARCH = ['strength_upper_push', 'strength_upper_pull', 'strength_upper_mixed', 'strength_arms', 'strength_lower_squat', 'strength_lower_hinge',
        'strength_glutes_legs', 'strength_full_body', 'strength_core']
SINGLE = [[], ['low_energy'], ['stressed'], ['bored'], ['irritated'], ['amped']]
COMBOS = [['amped', 'stressed'], ['bored', 'low_energy'], ['irritated', 'stressed'], ['amped', 'bored'], ['low_energy', 'amped'], ['bored', 'stressed'],
          ['irritated', 'low_energy'], ['amped', 'irritated', 'stressed'], ['low_energy', 'bored', 'irritated'], ['amped', 'bored', 'low_energy']]
TARGETS = [['glutes', 'core'], ['back', 'biceps'], ['chest', 'triceps'], ['biceps', 'triceps'], ['glutes'], ['quads'], ['hamstrings'], ['chest'], ['back'],
           ['shoulders'], ['biceps'], ['triceps'], ['calves', 'glutes'], ['back', 'core'], ['glutes', 'hamstrings', 'core'], ['chest', 'back'], ['shoulders', 'core'],
           ['quads', 'hamstrings'], ['chest', 'shoulders', 'triceps'], ['hamstrings', 'glutes']]
LEVELS = ['beginner', 'intermediate', 'advanced']
GOALS = ['build_muscle', 'build_strength', 'improve_athleticism', 'stay_consistent', 'feel_better_reduce_stress', 'lose_weight_conditioning']
EQUIP = ['commercial_gym', 'free_weight_limited', 'minimal']
SORE = ['legs', 'shoulders', 'chest', 'lower_back', 'arms', 'back']

_last = {}
_orig_finish = S._finish
def _finish(ctx, res, *a, **k):
    _last['res'] = res; _last['nctx'] = S.engine_ctx(ctx, res.get('requested_archetype') if res.get('mode') == 'pick' else None)
    return _orig_finish(ctx, res, *a, **k)
S._finish = _finish


def build(i, **kw):
    raw = dict(direction='strength', states=kw.get('states', []), duration=kw.get('dur', 60), experience=kw.get('exp', 'intermediate'),
               goal=kw.get('goal', GOALS[i % len(GOALS)]), equipment=kw.get('eq', 'commercial_gym'), date=f'2026-10-{10 + i % 18:02d}', training_frequency=kw.get('freq', '3-4'))
    for k in ('archetype', 'target', 'soreness'):
        if kw.get(k): raw[k] = kw[k]
    _last.clear()
    env, st = S.generate_workout(raw, f'tq{i}', list(kw.get('hist', ())), [])
    return raw, env, st, _last.get('res'), dict(_last.get('nctx') or {}, states=raw['states'])


def describe(env, st, res):
    if env['status'] != 'ok': return f"  CONFLICT {env['conflict']['code']}"
    w = env['workout']; h = st['history_record']
    out = [f"  {w['archetype']['name']} | {w['duration']['estimated_minutes']} min | {h.get('variant')} | {h.get('expressions')}"]
    for b in w['blocks']:
        items = ' + '.join(f"{it['exercise']['name']} {it['prescription']['display']}" for it in b['items'])
        out.append(f"    {b['sequence']}. [{b['type']}/{b['title']}] {items}")
    return '\n'.join(out)


def matrix():
    i = 0
    for a, st, d, lv in itertools.product(ARCH, SINGLE + COMBOS, (30, 60), LEVELS):
        for rep in range(2):
            i += 1; yield i, dict(archetype=a, states=st, dur=d, exp=lv, goal=GOALS[(i + rep) % 6]), 'archetype'
    for t, st, d, lv in itertools.product(TARGETS, SINGLE + COMBOS[:4], (30, 60), LEVELS):
        i += 1; yield i, dict(target=t, states=st, dur=d, exp=lv), 'target'
    for st, d, lv, fq, g in itertools.product(SINGLE + COMBOS[:3], (30, 60), LEVELS, ('1-2', '3-4', '5+'), GOALS[:3]):
        i += 1; yield i, dict(states=st, dur=d, exp=lv, freq=fq, goal=g), 'moods_pick'
    for a, s, st in itertools.product(ARCH[:8], SORE, [[], ['amped'], ['irritated'], ['low_energy']]):
        i += 1; yield i, dict(archetype=a, soreness=[s], states=st), 'sore'
    for t, s in itertools.product(TARGETS[:8], SORE):
        i += 1; yield i, dict(target=t, soreness=[s]), 'sore_target'
    for a, eq, lv, d in itertools.product(ARCH, EQUIP[1:], LEVELS, (30, 60)):
        i += 1; yield i, dict(archetype=a, eq=eq, exp=lv, dur=d, states=[['amped'], [], ['bored']][i % 3]), 'equipment'
    for st, d, lv in itertools.product(SINGLE + COMBOS[:4], (30, 60), LEVELS):
        i += 1; yield i, dict(target='full_body', states=st, dur=d, exp=lv), 'full_body_target'


def run(dump=None):
    t0 = time.time(); fails = collections.Counter(); ex = collections.defaultdict(list); n = 0; conf = collections.Counter(); amped = collections.Counter(); amped_n = 0
    acc = collections.defaultdict(collections.Counter); assisted = collections.Counter(); dumped = []
    for i, kw, tag in matrix():
        raw, env, st, res, nctx = build(i, **kw)
        if env['status'] != 'ok': conf[(tag, env['conflict']['code'])] += 1; continue
        n += 1
        issues = TG.check(res, nctx)
        for code, det in issues:
            fails[code] += 1
            if len(ex[code]) < 6: ex[code].append(dict(tag=tag, kw={k: v for k, v in kw.items()}, detail=det, session=describe(env, st, res)))
        if 'amped' in kw.get('states', []) and kw.get('exp') != 'beginner' and kw.get('archetype') not in (None, 'strength_arms', 'strength_core'):
            amped_n += 1; amped[res['variant']] += 1
        for r in res['rows']:
            if r['cls'] in ('accessory', 'extra') and res['archetype'] in ('strength_lower_hinge', 'strength_full_body'): acc[res['archetype']][r['eid']] += 1
            if r['eid'] in TG.BEGINNER_ONLY: assisted[nctx['experience']] += 1
        if dump and (i % 7 == 0 or tag in ('target',) and i % 3 == 0): dumped.append(f"[{tag}] {json.dumps(kw)}\n{describe(env, st, res)}")
    R = dict(builds=n, seconds=round(time.time() - t0), conflicts={f'{a}:{b}': c for (a, b), c in conf.items()}, gate_failures=dict(fails), examples=ex,
             amped_variant_share={k: round(v / max(1, amped_n), 3) for k, v in amped.most_common()}, amped_n=amped_n,
             assisted_by_level=dict(assisted), accessories={a: c.most_common(15) for a, c in acc.items()}, all_green=not fails)
    if dump: open(dump, 'w').write('\n\n'.join(dumped))
    return R


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith('--') else 'strength_trainer_qa.json'
    dump = sys.argv[sys.argv.index('--dump') + 1] if '--dump' in sys.argv else None
    R = run(dump)
    json.dump(R, open(out, 'w'), indent=1, default=str)
    print(json.dumps({k: R[k] for k in ('builds', 'seconds', 'conflicts', 'gate_failures', 'amped_variant_share', 'assisted_by_level', 'all_green')}, indent=1))
