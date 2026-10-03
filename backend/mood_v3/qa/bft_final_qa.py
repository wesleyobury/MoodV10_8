"""Built for Today, final production-path QA (Oct 2026 launch freeze).

Sequential workout generations through the real router (FastAPI app, in-memory Motor stand-in, live Messages API), polled
exactly as the Cart polls GET /bft, so the messages recorded are the ones a user would see, including the streaming gate,
retries and fallbacks. 12 synthetic users with fixed profiles, 8 consecutive days each (recent-message avoidance active).

    python -m mood_v3.qa.bft_final_qa run <user_from> <user_to> out.jsonl
    python -m mood_v3.qa.bft_final_qa report out.jsonl out.md
"""
from __future__ import annotations
import collections, json, logging, os, random, re, sys, time

USERS = [  # id, experience, goal, equipment, direction weights
    ('u01', 'intermediate', 'build_muscle', 'commercial_gym', {'strength': 6, 'sweat': 1, 'athletic': 1}),
    ('u02', 'beginner', 'stay_consistent', 'commercial_gym', {'strength': 3, 'sweat': 4, 'athletic': 1}),
    ('u03', 'advanced', 'build_strength', 'commercial_gym', {'strength': 6, 'athletic': 2}),
    ('u04', 'intermediate', 'lose_weight_conditioning', 'commercial_gym', {'sweat': 6, 'strength': 2}),
    ('u05', 'intermediate', 'improve_athleticism', 'commercial_gym', {'athletic': 6, 'strength': 2}),
    ('u06', 'beginner', 'feel_better_reduce_stress', 'free_weight_limited', {'strength': 3, 'sweat': 3}),
    ('u07', 'advanced', 'improve_athleticism', 'commercial_gym', {'athletic': 5, 'sweat': 2, 'strength': 1}),
    ('u08', 'intermediate', 'build_strength', 'free_weight_limited', {'strength': 5, 'athletic': 2}),
    ('u09', 'intermediate', 'stay_consistent', 'minimal', {'sweat': 4, 'strength': 3, 'athletic': 1}),
    ('u10', 'advanced', 'build_muscle', 'commercial_gym', {'strength': 7, 'sweat': 1}),
    ('u11', 'beginner', 'lose_weight_conditioning', 'commercial_gym', {'sweat': 5, 'athletic': 2, 'strength': 1}),
    ('u12', 'intermediate', 'feel_better_reduce_stress', 'commercial_gym', {'strength': 3, 'sweat': 3, 'athletic': 2}),
]
STATE_MIX = [  # (weight, states, soreness)
    (28, [], []), (8, ['low_energy'], []), (7, ['amped'], []), (5, ['stressed'], []), (4, ['bored'], []), (4, ['irritated'], []),
    (5, [], ['legs']), (3, [], ['shoulders']), (2, [], ['lower_back']),
    (5, ['low_energy', 'amped'], []), (4, ['amped', 'stressed'], []), (3, ['low_energy', 'bored'], []), (3, ['irritated', 'stressed'], []),
    (2, ['bored', 'stressed'], []), (3, ['amped'], ['shoulders']), (3, ['amped'], ['legs']), (2, ['low_energy'], ['legs']),
    (2, ['stressed'], ['lower_back']), (1, ['low_energy', 'irritated'], []),
]
ARCH = {'strength': [None] * 6 + ['strength_upper_push', 'strength_upper_pull', 'strength_lower_hinge', 'strength_arms', 'strength_full_body', 'strength_glutes_legs'],
        'sweat': [None] * 5 + ['sweat_engine', 'sweat_circuit', 'sweat_hybrid'],
        'athletic': [None] * 4 + ['athletic_power', 'athletic_speed_agility', 'athletic_full_body']}
TARGETS = [['chest', 'triceps'], ['back', 'biceps'], ['quads', 'glutes'], ['shoulders'], ['hamstrings', 'glutes'], ['chest', 'back']]
DAYS = [f'2026-10-{d:02d}' for d in range(5, 13)]


def plan():
    rnd = random.Random(20261003); out = []
    for uid, exp, goal, eq, dw in USERS:
        for i, day in enumerate(DAYS):
            d = rnd.choices(list(dw), weights=list(dw.values()))[0]
            _, st, so = rnd.choices(STATE_MIX, weights=[w for w, _, _ in STATE_MIX])[0]
            req = dict(direction=d, states=list(st), soreness=list(so), duration=rnd.choices([60, 30], [7, 3])[0], experience=exp, goal=goal, equipment=eq, date=day)
            a = rnd.choice(ARCH[d])
            if d == 'strength' and rnd.random() < 0.2: req['target'] = rnd.choice(TARGETS)
            elif a: req['archetype'] = a
            out.append(dict(id=f'{uid}.{i + 1}', user=uid, req=req))
    return out


def run(u0, u1, out):
    logging.basicConfig(level=logging.WARNING)
    from .bft_llm_qa import _key; _key()
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from ..tests import test_router as TR
    from ..bft.brief import Brief
    done = {json.loads(l)['id'] for l in open(out)} if os.path.exists(out) else set()
    users = [u[0] for u in USERS][u0:u1]
    for uid in users:
        db = TR._DB(); app = FastAPI(); app.include_router(TR.build_v3_router(db, lambda: uid), prefix='/api')
        with TestClient(app) as c:
            for it in [p for p in plan() if p['user'] == uid]:
                if it['id'] in done: continue
                t0 = time.monotonic()
                r = c.post('/api/v3/workouts/generate', json=dict(it['req'], persist=True))
                t_resp = time.monotonic() - t0
                row = dict(id=it['id'], req=it['req'], http=r.status_code, t_workout=round(t_resp, 3))
                env = r.json() if r.status_code == 200 else {}
                if env.get('status') != 'ok':
                    row.update(status=env.get('status') or 'error', detail=str(env.get('conflict') or r.text)[:200]); open(out, 'a').write(json.dumps(row) + '\n'); continue
                w = env['workout']; wid = w['workout_id']; t = w['today']
                row.update(status='ok', session=f"{w['direction_name']} · {w['archetype']['name']}", told=t.get('told'), pending=t.get('blurb_pending'))
                first_seen = None; final = None; polls = 0
                while time.monotonic() - t0 < 16:
                    p = c.get(f'/api/v3/workouts/{wid}/bft').json(); polls += 1
                    if p['text'] and first_seen is None: first_seen = round(time.monotonic() - t0, 3)
                    if p['status'] in ('done', 'fallback'): final = p; break
                    time.sleep(0.2)
                doc = next(d for d in db.v3_workouts.docs if d['_id'] == wid)
                bft = doc.get('bft') or {}
                B = None
                row.update(client_first_text=first_seen, client_settled=round(time.monotonic() - t0, 3), final_status=(final or {}).get('status', 'timeout'),
                           shown=(final or {}).get('text') or (final or {}).get('blurb'), source='llm' if (final or {}).get('status') == 'done' else 'composer',
                           composer=t['blurb'], metrics=bft.get('metrics'), saved=doc['envelope']['workout']['today']['blurb'])
                open(out, 'a').write(json.dumps(row, default=str) + '\n')
                print(it['id'], row['final_status'], (bft.get('metrics') or {}).get('reason'), row['client_first_text'], flush=True)


def report(path, md):
    from ..bft import gate as G
    rows = [json.loads(l) for l in open(path) if l.strip()]
    ok = [r for r in rows if r['status'] == 'ok']
    llm = [r for r in ok if r['final_status'] == 'done']; fb = [r for r in ok if r['final_status'] != 'done']
    M = [r['metrics'] or {} for r in ok]
    pct = lambda xs, q: (sorted(xs)[min(len(xs) - 1, int(round(q * (len(xs) - 1))))] if xs else None)
    def trio(xs): return f"p50 {pct(xs, .5)} · p90 {pct(xs, .9)} · p95 {pct(xs, .95)} (n={len(xs)})"
    retry = [m for m in M if m.get('attempts', 0) >= 2]
    first_rej = [m for m in M if any(a.startswith('sentence 1') or a in ('single sentence',) or a.startswith('malformed') for a in m.get('attempt_reasons', []))]
    later = [m for m in M if m.get('outcome') == 'partial']
    trimmed = [m for m in M if m.get('reason') == 'trimmed']
    rej = collections.Counter(re.sub(r"\(.*|\[.*|: \\\\.*", '', p)[:70] for m in M for x in m.get('rejected', []) for p in x['problems'][:1])
    claim_rej = [x for m in M for x in m.get('rejected', []) if any('unsupported claim' in p or 'number not in facts' in p or 'unknown name' in p for p in x['problems'])]
    texts = [r['shown'] for r in llm]
    cons = collections.Counter(G.construction(t) for t in texts)
    first3 = collections.Counter(' '.join(G.words(t)[:2]) for t in texts)
    grams = collections.Counter()
    for t in texts:
        w = G.words(t); seen = set()
        for n in (3, 4):
            for i in range(len(w) - n + 1):
                g = ' '.join(w[i:i + n])
                if g not in seen: seen.add(g); grams[g] += 1
    L = ['# Built for Today, final production-path QA', '',
         f"{len(rows)} generations ({len(ok)} workouts, {len(rows) - len(ok)} conflicts / errors) · 12 users × 8 days · live `claude-haiku-4-5` · router + polling as the app runs it", '',
         '## Rates', '',
         f"- LLM message shown: {len(llm)}/{len(ok)} ({round(100 * len(llm) / len(ok))}%) · deterministic fallback: {len(fb)} ({round(100 * len(fb) / len(ok))}%)",
         f"- First-sentence rejection on some attempt: {len(first_rej)} ({round(100 * len(first_rej) / len(ok))}%) · retried: {len(retry)} · retry rescued: {sum(1 for m in retry if m.get('outcome') != 'fallback')}",
         f"- Later-sentence rejection / stream cut after display (shorter message): {len(later)} ({round(100 * len(later) / len(ok))}%) · trimmed at 3 sentences / word cap: {len(trimmed)}",
         f"- Sentences blocked for an invented claim, number or name: {len(claim_rej)} (never shown)",
         f"- Final full-gate problems on shown LLM messages: {sum(1 for r in llm if (r['metrics'] or {}).get('final_problems'))}",
         f"- Workout response time: {trio([r['t_workout'] for r in ok])} s",
         f"- Time to first displayed text (app polling): {trio([r['client_first_text'] for r in llm if r['client_first_text']])} s",
         f"- Server time to first validated sentence: {trio([m['t_first_display'] for m in M if m.get('t_first_display')])} s",
         f"- Total LLM completion: {trio([m['total'] for m in M if m.get('total') and m.get('outcome') != 'fallback'])} s",
         f"- Fallback settles (app sees composer copy): {trio([r['client_settled'] for r in fb])} s",
         '', '### Rejection reasons (first problem per rejected sentence)', ''] + [f"- {k}: {v}" for k, v in rej.most_common(12)] + [
         '', '### Patterns across shown LLM messages', '',
         '- Sentence-one constructions: ' + ', '.join(f"{k} {v}" for k, v in cons.most_common()),
         '- First two words: ' + ', '.join(f"'{k}' {v}" for k, v in first3.most_common(10)),
         '- Recurring 3-4 word phrases: ' + ', '.join(f"'{g}' ×{c}" for g, c in grams.most_common(60) if c >= 5)[:1500],
         '', '## Messages', '']
    for r in rows:
        q = r['req']; lab = f"{q['direction']} · {', '.join(q['states']) or 'no State'}" + (f" · sore {','.join(q['soreness'])}" if q['soreness'] else '') + \
            f" · {q['duration']}m · {q['experience']} · {q['goal']} · {q['equipment']}" + (f" · target {'+'.join(q['target'])}" if q.get('target') else '') + (f" · {q['archetype']}" if q.get('archetype') else '')
        L.append(f"### {r['id']} · {lab}")
        if r['status'] != 'ok': L += [f"*{r['status']}*: {r.get('detail')}", '']; continue
        m = r['metrics'] or {}
        L += [f"*{r['session']}* · first text {r['client_first_text']} s · {m.get('outcome')} ({m.get('reason')})", '',
              f"> {r['shown']}", '', f"<sub>{'LLM' if r['final_status'] == 'done' else 'FALLBACK (composer)'} · {len(G.words(r['shown'] or ''))} words</sub>"]
        for x in m.get('rejected', []): L.append(f"- blocked s{x['idx'] + 1}: {x['text']}  \n  <sub>{'; '.join(x['problems'][:2])}</sub>")
        if m.get('final_problems'): L.append(f"- <sub>final gate (logged): {'; '.join(m['final_problems'][:3])}</sub>")
        L.append('')
    open(md, 'w').write('\n'.join(L)); print(len(rows), 'rows')


if __name__ == '__main__':
    if sys.argv[1] == 'run': run(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4])
    elif sys.argv[1] == 'plan': [print(p['id'], p['req']) for p in plan()]
    else: report(sys.argv[2], sys.argv[3])
