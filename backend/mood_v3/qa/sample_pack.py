"""15-workout production-output sanity pack + special cases, exactly as the frontend receives them (service path).
Usage: python -m mood_v3.qa.sample_pack out.json out.md"""
from __future__ import annotations
import json, sys
from .. import service as S
from ..progression import entries_from_performance

PACK = [
    ('S1', 'Strength · MOOD\'s Pick · Normal · 60 · Intermediate', dict(direction='strength', duration=60, experience='intermediate', goal='build_muscle')),
    ('S2', 'Strength · Chest + Triceps · Amped · 60 · Advanced', dict(direction='strength', target=['chest', 'triceps'], states=['amped'], duration=60, experience='advanced')),
    ('S3', 'Strength · Lower Hinge · Low Energy · 30 · Beginner', dict(direction='strength', archetype='strength_lower_hinge', states=['low_energy'], duration=30, experience='beginner')),
    ('S4', 'Strength · Arms · Bored · 60 · Intermediate · free weights', dict(direction='strength', archetype='strength_arms', states=['bored'], duration=60, equipment='free_weight_limited')),
    ('S5', 'Strength · Glutes + Legs · Irritated · 60 · Intermediate', dict(direction='strength', archetype='strength_glutes_legs', states=['irritated'], duration=60)),
    ('W1', 'Sweat · MOOD\'s Pick · Normal · 60 · Intermediate', dict(direction='sweat', duration=60)),
    ('W2', 'Sweat · Engine · Stressed · 30 · Beginner', dict(direction='sweat', archetype='sweat_engine', states=['stressed'], duration=30, experience='beginner')),
    ('W3', 'Sweat · Hybrid · Irritated · 60 · Advanced', dict(direction='sweat', archetype='sweat_hybrid', states=['irritated'], duration=60, experience='advanced')),
    ('W4', 'Sweat · Target Quads + Glutes · Low Energy · 60', dict(direction='sweat', target=['quads', 'glutes'], states=['low_energy'], duration=60)),
    ('W5', 'Sweat · Circuit · Amped · 30 · Intermediate · free weights', dict(direction='sweat', archetype='sweat_circuit', states=['amped'], duration=30, equipment='free_weight_limited')),
    ('A1', 'Athletic · Power · Normal · 60 · Intermediate', dict(direction='athletic', archetype='athletic_power', duration=60)),
    ('A2', 'Athletic · Speed + Agility · Bored · 60 · Advanced', dict(direction='athletic', archetype='athletic_speed_agility', states=['bored'], duration=60, experience='advanced')),
    ('A3', 'Athletic · Full-Body Athlete · Low Energy · 60 · Beginner', dict(direction='athletic', archetype='athletic_full_body', states=['low_energy'], duration=60, experience='beginner')),
    ('A4', 'Athletic · MOOD\'s Pick · Amped · 30 · Intermediate', dict(direction='athletic', states=['amped'], duration=30)),
    ('A5', 'Athletic · Power · Irritated · 60 · Advanced', dict(direction='athletic', archetype='athletic_power', states=['irritated'], duration=60, experience='advanced', goal='build_strength')),
]

def build(date='2026-10-05'):
    out = {}
    for k, title, raw in PACK:
        env, st = S.generate_workout(dict(raw, date=date), 'founder_pack')
        out[k] = dict(title=title, request=raw, response=env); out[k]['_state'] = st
    sp = {}
    # one swap (S2 main lift) - exercise-level swap
    base = out['S2']; item = base['response']['workout']['blocks'][0]['items'][0]
    env, _ = S.swap_exercise(base['_state'], base['response'], item['item_id'])
    sp['swap'] = dict(title='Exercise swap on S2 (main press)', request=dict(item_id=item['item_id']), response=env)
    # multi-State example
    raw = dict(direction='strength', archetype='strength_upper_mixed', states=['bored', 'stressed', 'amped'], duration=60, date=date)
    sp['multi_state'] = dict(title='Strength · Upper Body · Bored + Stressed + Amped · 60', request=raw, response=S.generate_workout(raw, 'founder_pack')[0])
    # soreness reroute
    raw = dict(direction='strength', soreness=['legs'], duration=60, goal='build_strength', date=date)
    sp['soreness_reroute'] = dict(title="Strength · MOOD's Pick · sore legs", request=raw, response=S.generate_workout(raw, 'founder_pack')[0])
    # explicit conflict
    raw = dict(direction='athletic', soreness=['legs'], equipment='minimal', date=date)
    sp['conflict'] = dict(title='Athletic · sore legs · minimal equipment', request=raw, response=S.generate_workout(raw, 'founder_pack')[0])
    # history / progression
    raw = dict(direction='strength', archetype='strength_lower_squat', duration=60, date='2026-10-01')
    e1, s1 = S.generate_workout(raw, 'founder_pack')
    main = e1['workout']['blocks'][0]['items'][0]; reps = int(main['prescription']['reps'])
    perf = entries_from_performance(e1['workout'], [dict(item_id=main['item_id'], sets=[dict(reps=reps, load=100, unit='kg')] * main['prescription']['sets'])])
    raw2 = dict(raw, date='2026-10-04')
    e2, _ = S.generate_workout(raw2, 'founder_pack', [dict(s1['history_record'], completed_at='2026-10-01')], [dict(completed_at='2026-10-01', entries=perf)])
    sp['history_progression'] = dict(title='Strength · Lower Squat: second session after logging 100 kg on every set', request=raw2,
                                     logged=dict(exercise=main['exercise']['name'], sets=main['prescription']['sets'], reps=reps, load='100 kg'), response=e2)
    # Built for Today
    raw = dict(direction='sweat', states=['low_energy', 'amped'], soreness=['shoulders'], duration=60, date=date)
    sp['built_for_today'] = dict(title='Sweat · Low Energy + Amped · sore shoulders', request=raw, response=S.generate_workout(raw, 'founder_pack')[0])
    for v in out.values(): v.pop('_state', None)
    return out, sp

def to_md(out, sp):
    L = ['# MOOD V3 production-output sanity pack', '', 'Generated through the production service path (`mood_v3.service`). The JSON file next to this one holds the exact response bodies the frontend receives; this page is a readable digest.', '']
    def wk(title, env):
        nonlocal L
        L.append(f'## {title}')
        if env['status'] != 'ok':
            c = env['conflict']; L += [f"**Outcome: conflict `{c['code']}`**. {c['message']}", '', 'Options: ' + ', '.join(o['label'] for o in c['options']), '']; return
        w = env['workout']
        L.append(f"**{w['direction_name']} · {w['archetype']['name']}** · outcome `{env['outcome']}` · requested {w['duration']['requested_minutes']} min, estimated {w['duration']['display']} · {w['experience']} · States: {', '.join(w['states']) or 'none'} · {w['equipment']['label']}")
        if w['requested_archetype']: L.append(f"Requested archetype: {w['requested_archetype']['name']} (rerouted)")
        L.append(''); L.append('Built for Today:'); L += [f"- {l['text']}" for l in w['built_for_today']]; L.append('')
        if w['warmup']['items']: L.append('Warm-up: ' + ' → '.join(f"{i['name']} ({i['prescription_text']})" for i in w['warmup']['items']))
        else: L.append(f"Warm-up: {w['warmup']['guidance']}")
        L.append(''); L.append('| Block | Structure | Exercise | Prescription | Rest | Guidance |'); L.append('|---|---|---|---|---|---|')
        for b in w['blocks']:
            for it in b['items']:
                rx = it['prescription']; g = rx.get('load_guidance') or ''
                if it.get('quality_stop'): g += (' · ' if g else '') + it['quality_stop']
                if it.get('progression'): g += (' · ' if g else '') + '**' + it['progression']['text'] + '**'
                rest = rx.get('rest_sec') or b.get('rest_between_rounds_sec') or ''
                L.append(f"| {b['title']} | {b['structure']} | {it['exercise']['name']} | {rx['display']} | {rest} | {g} |")
        if w.get('swapped_item'): L.append(f"\nSwapped: `{w['swapped_item']['from']}` → `{w['swapped_item']['to']}`")
        L.append('')
    for k, v in out.items(): wk(f"{k} · {v['title']}", v['response'])
    L.append('# Special cases'); L.append('')
    for k, v in sp.items():
        if k == 'history_progression': L.append(f"Logged last session: {v['logged']}"); L.append('')
        wk(v['title'], v['response'])
    return '\n'.join(L)

if __name__ == '__main__':
    out, sp = build()
    json.dump(dict(pack=out, special=sp), open(sys.argv[1], 'w'), indent=1, default=str)
    open(sys.argv[2], 'w').write(to_md(out, sp))
    print('ok', {k: v['response']['outcome'] for k, v in out.items()}, {k: v['response']['outcome'] for k, v in sp.items()})
