"""Built for Today, live LLM QA pack.

Runs the LLM writer (bft/llm.py) on the verified briefs of the standard QA cases plus repeat chains (same user, same inputs,
consecutive days; each message sees the earlier ones as 'recent', exactly as production does). Records every option the model
returned, which one the gate accepted (or why all were rejected), latency, and the composer floor for comparison. A report step
then looks for emerging patterns across the accepted messages.

The key is read from ANTHROPIC_API_KEY or from backend/.env. Runs in chunks so each call stays short:
    python -m mood_v3.qa.bft_llm_qa run <start> <end> out.jsonl     # items [start, end)
    python -m mood_v3.qa.bft_llm_qa report out.jsonl out.md
"""
from __future__ import annotations
import asyncio, collections, json, os, re, sys, time
from .. import service as S
from ..bft import llm as L, gate as G
from ..bft.brief import Brief
from .bft_qa import CASES, DAYS

REPEATS = [
    ('R1', 'Strength · Low Energy', dict(direction='strength', states=['low_energy'], duration=60)),
    ('R2', 'Sweat · no State', dict(direction='sweat', duration=60)),
    ('R3', 'Athletic · Amped', dict(direction='athletic', states=['amped'], duration=60)),
    ('R4', 'Strength · Amped + Sore shoulders', dict(direction='strength', states=['amped'], soreness=['shoulders'], duration=60)),
    ('R5', 'Strength · Low Energy + Amped', dict(direction='strength', states=['low_energy', 'amped'], duration=60)),
]


def _key():
    if os.environ.get('ANTHROPIC_API_KEY'): return
    p = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
    for line in open(p) if os.path.exists(p) else []:
        if line.strip().startswith('ANTHROPIC_API_KEY='):
            os.environ['ANTHROPIC_API_KEY'] = line.split('=', 1)[1].strip().strip('"').strip("'")


def items():
    out = [dict(kind='case', id=c[0], label=c[1], raw=c[2], user='llm_' + c[0], date=DAYS[0], chain=None) for c in CASES]
    for rid, label, raw in REPEATS:
        for i, d in enumerate(DAYS): out.append(dict(kind='repeat', id=f'{rid}.{i + 1}', label=label, raw=raw, user='llm_' + rid, date=d, chain=rid))
    return out


async def one(it, recent):
    env, _ = S.generate_workout(dict(it['raw'], date=it['date']), it['user'], recent_bft=list(recent))
    b = env['_bft']; B = Brief.from_dict(b['brief'])
    t0 = time.monotonic(); err = None; best = None; report = []; raw_text = ''
    try:
        payload = dict(model=os.environ.get('BFT_LLM_MODEL', 'claude-haiku-4-5'), max_tokens=380, temperature=0.9, system=L.SYSTEM,
                       messages=[dict(role='user', content=L.prompt(B, b['composer'].get('facts'), recent))])
        body = await asyncio.wait_for(L._post(payload, 30), 30)
        raw_text = ''.join(x.get('text', '') for x in body.get('content', []) if x.get('type') == 'text')
        best, report = L.pick(B, raw_text, recent)
    except Exception as ex:
        err = repr(ex)
    return dict(id=it['id'], kind=it['kind'], label=it['label'], chain=it['chain'], request=it['raw'], session=f"{env['workout']['direction_name']} · {env['workout']['archetype']['name']}",
                latency=round(time.monotonic() - t0, 2), error=err, accepted=(best or {}).get('text'), used_facts=(best or {}).get('facts'),
                options=report, composer=b['composer']['text'], facts=[f"{f['id']} {f['tag']}: {f['ev']}" for f in sorted(B.facts, key=lambda f: -f['pri'])],
                exercises=B.names, recent=list(recent))


async def run(start, end, out):
    _key()
    assert os.environ.get('ANTHROPIC_API_KEY'), 'ANTHROPIC_API_KEY not set (env or backend/.env)'
    done = []
    if os.path.exists(out):
        done = [json.loads(l) for l in open(out) if l.strip()]
    have = {d['id'] for d in done}
    todo = [it for it in items()[start:end] if it['id'] not in have]
    shown = lambda chain: [d['accepted'] or d['composer'] for d in sorted([d for d in done if d.get('chain') == chain], key=lambda d: d['id'], reverse=True)]
    cases = [it for it in todo if it['kind'] == 'case']
    res = await asyncio.gather(*[one(it, []) for it in cases])
    for r in res: done.append(r); open(out, 'a').write(json.dumps(r) + '\n')
    for it in [it for it in todo if it['kind'] == 'repeat']:      # sequential: each one sees what the user saw before
        r = await one(it, shown(it['chain'])); done.append(r); open(out, 'a').write(json.dumps(r) + '\n')
    print(f'{len(todo)} done, {len(done)} total')


def report(path, md):
    rows = [json.loads(l) for l in open(path) if l.strip()]
    rows.sort(key=lambda r: (r['kind'] != 'case', r['id']))
    acc = [r for r in rows if r['accepted']]
    lat = sorted(r['latency'] for r in rows if not r['error'])
    pct = lambda q: lat[min(len(lat) - 1, int(q * len(lat)))] if lat else None
    opts = [o for r in rows for o in r['options']]
    reasons = collections.Counter(re.sub(r'\(.*', '', p).strip() for o in opts if not o['ok'] for p in o['problems'])
    texts = [r['accepted'] for r in acc]
    # emerging patterns across accepted messages
    grams = collections.Counter()
    for t in texts:
        w = G.words(t); seen = set()
        for n in (3, 4):
            for i in range(len(w) - n + 1):
                g = ' '.join(w[i:i + n])
                if g not in seen: seen.add(g); grams[g] += 1
    names = {n.lower() for r in rows for n in r['exercises']}
    boring = {'the main lift', 'a rep closer', 'rep closer to', 'closer to failure', 'further from failure', 'a little further', 'little further from',
              'rep closer to failure', 'a rep closer to'}
    common = [(g, c) for g, c in grams.most_common(200) if c >= max(4, len(texts) // 10) and not any(g in n for n in names)]
    cons = collections.Counter(G.construction(t) for t in texts)
    first = collections.Counter(G.words(t)[0] for t in texts if G.words(t))
    fams = collections.Counter(f for t in texts for f in G.families(t))
    L_ = ['# Built for Today, live LLM QA pack', '',
          f"Model `{os.environ.get('BFT_LLM_MODEL', 'claude-haiku-4-5')}`. Each message is the option the gate accepted; rejected options and the composer floor are shown underneath.", '',
          '## Summary', '',
          f"- Messages: {len(rows)} · accepted from the LLM: {len(acc)} ({round(100 * len(acc) / max(1, len(rows)))}%) · fell back to the composer: {len(rows) - len(acc)} · API errors: {sum(1 for r in rows if r['error'])}",
          f"- Options returned: {len(opts)} · options passing the gate: {sum(1 for o in opts if o['ok'])}",
          f"- Latency (full call): median {pct(0.5)} s · p90 {pct(0.9)} s · max {lat[-1] if lat else None} s",
          f"- Words per accepted message: avg {round(sum(len(G.words(t)) for t in texts) / max(1, len(texts)), 1)} · min {min((len(G.words(t)) for t in texts), default=0)} · max {max((len(G.words(t)) for t in texts), default=0)}",
          '', '### Why options were rejected', ''] + [f"- {k}: {v}" for k, v in reasons.most_common(15)] + [
          '', '### Emerging patterns across accepted messages', '',
          '- Sentence-one constructions: ' + ', '.join(f"{k} {v}" for k, v in cons.most_common()),
          '- First words: ' + ', '.join(f"'{k}' {v}" for k, v in first.most_common(8)),
          '- Storytelling devices: ' + (', '.join(f"{k} {v}" for k, v in fams.most_common(10)) or 'none'),
          '- Recurring 3-4 word phrases (not exercise names): ' + (', '.join(f"'{g}' ×{c}" + (' (programming truth)' if g in boring else '') for g, c in common[:25]) or 'none'),
          '']
    L_ += ['## Messages', '']
    for r in rows:
        L_ += [f"### {r['id']} · {r['label']}", f"*{r['session']}* · {r['latency']} s" + (f" · ERROR {r['error']}" if r['error'] else ''), '']
        if r['accepted']:
            L_ += [f"> {r['accepted']}", '', f"<sub>facts used: {', '.join(r['used_facts'] or [])} · {len(G.words(r['accepted']))} words · opening: {G.construction(r['accepted'])}</sub>", '']
        else:
            L_ += ['> (no option passed; the composer copy below ships)', '']
        for o in r['options']:
            if o['text'] != r['accepted']:
                L_ += [f"- {'PASS' if o['ok'] else 'FAIL'}: {o['text']}" + ('' if o['ok'] else f"  \n  <sub>{'; '.join(o['problems'])}</sub>")]
        L_ += ['', f"<sub>Composer floor: {r['composer']}</sub>", '']
    open(md, 'w').write('\n'.join(L_))
    print(f"{len(rows)} messages, {len(acc)} accepted")


if __name__ == '__main__':
    if sys.argv[1] == 'run': asyncio.run(run(int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]))
    elif sys.argv[1] == 'items': print(len(items()))
    else: report(sys.argv[2], sys.argv[3])
