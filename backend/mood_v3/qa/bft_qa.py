"""Built for Today QA pack (Oct 2026 quality pass).

Runs the production service path for a representative grid and, for several identical-input cases, a run of consecutive
sessions for the same user (each one sees the previous messages as 'recent', exactly as the router supplies them).
Usage: python -m mood_v3.qa.bft_qa [out.md] [out.json]
"""
from __future__ import annotations
import json, sys
from .. import service as S
from ..bft import gate as G

CASES = [
    # (id, label, request)
    ('S0', 'Strength · no State', dict(direction='strength', duration=60)),
    ('S1', 'Strength · Low Energy', dict(direction='strength', states=['low_energy'], duration=60)),
    ('S2', 'Strength · Amped', dict(direction='strength', states=['amped'], duration=60)),
    ('S3', 'Strength · Irritated', dict(direction='strength', states=['irritated'], duration=60)),
    ('S4', 'Strength · Bored', dict(direction='strength', states=['bored'], duration=60)),
    ('S5', 'Strength · Sore shoulders', dict(direction='strength', soreness=['shoulders'], duration=60)),
    ('S6', 'Strength · Stressed', dict(direction='strength', states=['stressed'], duration=60)),
    ('S7', 'Strength · Amped + Sore legs', dict(direction='strength', states=['amped'], soreness=['legs'], duration=60)),
    ('S8', 'Strength · Low Energy + Amped', dict(direction='strength', states=['low_energy', 'amped'], duration=60)),
    ('S9', 'Strength · Bored + Stressed · Upper Body', dict(direction='strength', archetype='strength_upper_mixed', states=['bored', 'stressed'], duration=60)),
    ('W0', 'Sweat · no State', dict(direction='sweat', duration=60)),
    ('W1', 'Sweat · Stressed', dict(direction='sweat', states=['stressed'], duration=60)),
    ('W2', 'Sweat · Amped', dict(direction='sweat', states=['amped'], duration=60)),
    ('W3', 'Sweat · Amped + Stressed', dict(direction='sweat', states=['amped', 'stressed'], duration=60)),
    ('W4', 'Sweat · Low Energy + Bored · Engine', dict(direction='sweat', archetype='sweat_engine', states=['low_energy', 'bored'], duration=60)),
    ('W5', 'Sweat · Irritated · 30 min', dict(direction='sweat', states=['irritated'], duration=30)),
    ('A0', 'Athletic · no State', dict(direction='athletic', duration=60)),
    ('A1', 'Athletic · Low Energy', dict(direction='athletic', states=['low_energy'], duration=60)),
    ('A2', 'Athletic · Amped', dict(direction='athletic', states=['amped'], duration=60, experience='advanced')),
    ('A3', 'Athletic · Sore legs', dict(direction='athletic', soreness=['legs'], duration=60)),
    ('A4', 'Athletic · Irritated + Stressed', dict(direction='athletic', states=['irritated', 'stressed'], duration=60)),
    ('A5', 'Athletic · Bored', dict(direction='athletic', states=['bored'], duration=60, experience='advanced')),
    ('X1', 'Sparse · Strength Arms · 30 min · beginner', dict(direction='strength', archetype='strength_arms', duration=30, experience='beginner')),
    ('X2', 'Sparse · Sweat Engine · 30 min', dict(direction='sweat', archetype='sweat_engine', duration=30)),
    ('X3', 'Sparse · Athletic Speed + Plyo', dict(direction='athletic', archetype='athletic_speed_agility', duration=60)),
    ('P1', 'Personal · Strength · Amped · Chest + Triceps · build muscle · advanced', dict(direction='strength', target=['chest', 'triceps'], states=['amped'], goal='build_muscle', experience='advanced', duration=60)),
    ('P2', 'Personal · Strength · Low Energy · Quads + Glutes · build strength', dict(direction='strength', target=['quads', 'glutes'], states=['low_energy'], goal='build_strength', duration=60)),
    ('P3', 'Personal · Sweat · Irritated · Chest + Back · conditioning goal · free weights', dict(direction='sweat', target=['chest', 'back'], states=['irritated'], goal='lose_weight_conditioning', equipment='free_weight_limited', duration=60)),
    ('P4', 'Personal · Athletic · Amped + Sore shoulders · athleticism goal', dict(direction='athletic', states=['amped'], soreness=['shoulders'], goal='improve_athleticism', duration=60)),
    ('P5', 'Personal · Strength · Stressed + Sore lower back · feel-better goal', dict(direction='strength', states=['stressed'], soreness=['lower_back'], goal='feel_better_reduce_stress', duration=60)),
]
REPEATS = [   # identical inputs, consecutive sessions for one user
    ('R1', 'Repeat ×5 · Strength · Low Energy', dict(direction='strength', states=['low_energy'], duration=60)),
    ('R2', 'Repeat ×5 · Sweat · no State', dict(direction='sweat', duration=60)),
    ('R3', 'Repeat ×5 · Athletic · Amped', dict(direction='athletic', states=['amped'], duration=60)),
    ('R4', 'Repeat ×5 · Strength · Amped + Sore shoulders', dict(direction='strength', states=['amped'], soreness=['shoulders'], duration=60)),
]
DAYS = ['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09']


def one(raw, user, date, recent):
    env, _ = S.generate_workout(dict(raw, date=date), user, recent_bft=recent)
    if env['status'] != 'ok': return dict(status='conflict', text=env['conflict']['message'])
    w = env['workout']; b = env.pop('_bft')
    t = w['today']['blurb']
    from ..bft.brief import Brief as _B
    fs_ok, fs_why = G.first_sentence_test(t, _B.from_dict(b['brief'])) if b['brief'] else (False, 'no brief')
    ok, problems, sim = G.check(t, __import__('mood_v3.bft.brief', fromlist=['Brief']).Brief.from_dict(b['brief']), w['today']['blurb_meta']['facts'], recent) if b['brief'] else (False, ['no brief'], {})
    before = next((l['text'] for l in w['built_for_today'] if l['code'].startswith(('state_', 'sore', 'why_today'))), None)
    return dict(status='ok', text=t, before=before, words=len(G.words(t)), session=f"{w['direction_name']} · {w['archetype']['name']}", meta=w['today']['blurb_meta'],
                exercises=[it['exercise']['name'] for bl in w['blocks'] for it in bl['items']], gate_ok=ok, problems=problems, sim=sim, first=(fs_ok, fs_why), brief=b['brief'],
                facts=[f"{f['tag']}: {f['ev']}" for f in sorted(b['brief']['facts'], key=lambda f: -f['pri'])][:6])


def run():
    out = dict(cases=[], repeats=[])
    for cid, label, raw in CASES:
        out['cases'].append(dict(id=cid, label=label, request=raw, **one(raw, 'qa_' + cid, DAYS[0], [])))
    for rid, label, raw in REPEATS:
        recent, runs = [], []
        for d in DAYS:
            r = one(raw, 'qa_' + rid, d, list(recent))
            runs.append(r)
            if r['status'] == 'ok': recent.insert(0, r['text'])
        out['repeats'].append(dict(id=rid, label=label, request=raw, runs=runs))
    run.cache = out
    return out


def regrade(old_json):
    """The previous pack's messages, re-checked by today's gate against the same workouts (deterministic engines)."""
    from ..bft.brief import Brief
    old = json.load(open(old_json)); rows = []
    new = {c['id']: c for c in run.cache['cases']}
    for c in old['cases']:
        n = new.get(c['id'])
        if not n or not n.get('brief'): continue
        B = Brief.from_dict(n['brief'])
        ok, problems, _ = G.check(c['text'], B, (c.get('meta') or {}).get('facts') or [f['tag'] for f in B.facts], [])
        rows.append(dict(id=c['id'], label=c['label'], text=c['text'], ok=ok, problems=problems))
    return rows


def to_md(out, rows=None):
    L = ['# Built for Today QA pack (magic-moment pass)', '',
         'Hook -> Proof -> optional Cue. Every message must pass the First-Sentence Test: sentence one names what MOOD knows about you today '
         'and the change it caused. Composer output (the LLM writer is off until the production key is set).', '']
    if rows:
        k = sum(1 for x in rows if not x['ok'])
        L += [f"## Previous pack re-graded by the new gate: {k} of {len(rows)} now FAIL", '']
        for x in rows:
            if not x['ok']: L += [f"- **{x['id']}** {x['label']}: {x['text']}  \n  <sub>FAIL: {'; '.join(x['problems'])}</sub>"]
        L += ['', '## New pack', '']
    for c in out['cases']:
        fs = c.get('first') or (None, '')
        L += [f"### {c['id']} · {c['label']}", f"*{c.get('session', '')}* · {c.get('words', '')} words · hook `{(c.get('meta') or {}).get('frame')}` · first sentence {'PASS (' + fs[1] + ')' if fs[0] else 'FAIL'} · gate {'PASS' if c.get('gate_ok') else 'FAIL ' + str(c.get('problems'))}", '', f"> {c['text']}", '']
        if c.get('before'): L += [f"<sub>Old synthesis line: {c['before']}</sub>", '']
        L += ['<sub>Story facts used: ' + ', '.join((c.get('meta') or {}).get('facts') or []) + '</sub>', '']
    for r in out['repeats']:
        L += [f"### {r['id']} · {r['label']}", '']
        for i, x in enumerate(r['runs']):
            L += [f"{i + 1}. {x['text']}  *({(x.get('meta') or {}).get('frame')}, overlap with earlier {x.get('sim', {}).get('max_jaccard')})*"]
        L.append('')
    return '\n'.join(L)


if __name__ == '__main__':
    o = run()
    rows = regrade(sys.argv[3]) if len(sys.argv) > 3 else None
    md = to_md(o, rows)
    for c in o['cases']: c.pop('brief', None)
    for r in o['repeats']:
        for x in r['runs']: x.pop('brief', None)
    if len(sys.argv) > 1: open(sys.argv[1], 'w').write(md)
    else: print(md)
    if len(sys.argv) > 2: json.dump(o, open(sys.argv[2], 'w'), indent=1, default=str)
