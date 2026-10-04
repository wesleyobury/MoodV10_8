"""Built for Today, the deterministic composer (magic-moment pass).

Every message is built as Hook -> Proof -> optional Cue:

  Hook   sentence one: what MOOD knows about you today + the change it caused, with explicit cause -> effect.
         One State: the State and its biggest change. Two States: the resolution between them (e.g. Amped + Low Energy:
         energy sets the budget, the drive goes into one place). Soreness: protected area + where the State's change went.
         No State: the strongest real input (Target, history, goal, level, 30 minutes, equipment); only when none applies,
         the session's own intent.
  Proof  the next most meaningful decision (another State change, the Target, goal, history ...).
  Cue    only a cue tied to a decision in the message, and only sometimes.

Many candidates are generated (different sentence shapes and wordings of the same true facts), every one goes through the
gate (including the First-Sentence Test), and the one least like the user's recent messages wins. Deterministic for a given
(user, date, swap, recent messages).
"""
from __future__ import annotations
import hashlib, random
from . import phrases as PH, gate as G

STATE_PRI = ('low_energy', 'amped', 'irritated', 'stressed', 'bored')
EFFORT_UP = {'closer_to_failure', 'top_set', 'heavier_main', 'extra_set', 'harder_pace', 'heavier_strength', 'extra_quality_set', 'contrast',
             'demanding_primary', 'extra_round', 'less_downtime', 'intensifier', 'finisher', 'explosive_intent'}


def _cap(s): return s[0].upper() + s[1:] if s else s


def _end(s): return s if s.endswith(('.', '!', '?')) else s + '.'


def _state_of(f):
    return next((c[1] for c in f['claims'] if c and c[0] in ('state', 'state_yielded')), None)


def story(B):
    R = B.ranked()
    by_state = {}
    for f in R:
        s = _state_of(f)
        if s and f['tag'] != 'yielded': by_state.setdefault(s, []).append(f)
    yielded = next((f for f in R if f['tag'] == 'yielded'), None)
    states = sorted(by_state, key=lambda s: STATE_PRI.index(s) if s in STATE_PRI else 9)
    sore = next((f for f in R if f['topic'] == 'sore'), None)
    inputs = [f for f in R if f['topic'] in G.INPUT_TOPICS and f['claims']]
    base = [f for f in R if not f['claims'] or f['topic'] == 'sequence']
    base = [f for f in base if f['topic'] not in ('sore',) + G.INPUT_TOPICS]
    return dict(states=states, by_state=by_state, yielded=yielded, sore=sore, inputs=inputs, base=base)


def _pick(opts, r): return r.choice(opts) if opts else None


def _decision(f, r, bare=False):
    opts = PH.do(f['tag'], f['data'])
    if bare: opts = [o for o in opts if ' so ' not in o] or opts     # no 'so ... so ...' when the sentence already has its cause
    return _pick(opts, r)


def _pronoun(c1, c2):
    """'Frog Pump replaces a usual pick, and Frog Pump switches...' -> '..., and it switches...'."""
    for nm in sorted(set(__import__('re').findall(r"[A-Z][\w'-]+(?: [A-Z0-9][\w'()+/-]*)+", c1)), key=len, reverse=True):
        if c2.startswith(nm): return 'it' + c2[len(nm):]
        if f"the last set of {nm}" in c2: return c2.replace(f"the last set of {nm}", 'its last set')
        if f" {nm}" in c2 and nm in c1: return c2.replace(nm, 'it', 1)
    return c2


def _decisions(fs, r):
    """One or two decision clauses joined into one effect."""
    cl = [c for c in (_decision(f, r, bare=True) for f in fs) if c]
    if not cl: return None
    if len(cl) == 1: return cl[0]
    return cl[0] + (', plus ' if ' and ' in cl[0] else ', and ') + _pronoun(cl[0], cl[1])


# ---------------------------------------------------------------- hooks (sentence one)
def hook_single(s, facts, r):
    fs = facts[:2] if len(facts) > 1 and r.random() < 0.55 else facts[:1]
    D = _decisions(fs, r)
    if not D: return None
    shape = r.choice('AAACCDDB') if ' so ' not in D else r.choice('ACD')
    pool = lambda opts: [o for o in opts if not ('tank' in o and 'tank' in D)] or opts   # no 'tank ... in the tank'
    if shape == 'A': t = f"{r.choice(pool(PH.CAUSE[s]))}, so {D}."
    elif shape == 'B': t = f"{_cap(D)}, because {r.choice(PH.BECAUSE[s])}."
    elif shape == 'C': t = f"{r.choice(pool(PH.LABEL[s]))}: {D}."
    else: t = f"Since {r.choice(PH.BECAUSE[s])}, {D}."
    return [t], fs


def hook_pair(st, r):
    sa, sb = st['states'][:2]
    key = PH.PAIR_ORDER.get(frozenset((sa, sb)))
    x, y = key if key else (sa, sb)
    fa, fb = st['by_state'][x][0], st['by_state'][y][0]
    a, b = _decision(fa, r), _decision(fb, r)
    if not a or not b: return None
    if key:
        opts = PH.PAIRS[key]
        if st.get('owed_extra'): opts = [t for t in opts if '. ' not in t] or opts   # one sentence, so the third beat fits in sentence two
        t = r.choice(opts)
        out = [x_.strip() for x_ in t.format(a=a, b=b, A=_cap(a)).replace('. ', '.\n').split('\n')]
        used = [fa, fb] if '{b}' in t else [fa]
        if '{b}' not in t and not st.get('owed_extra'):   # the budget State's change becomes the proof sentence
            out.append(_end(_cap(b))); used.append(fb)
        return out, used
    return [f"You're {PH.STATE_ADJ[x]} and {PH.STATE_ADJ[y]}, so {a}, and {b}."], [fa, fb]


def hook_yield(st, r):
    s = st['yielded']['data'].get('other')
    if s not in st['by_state']:
        if not st['states']:
            return [r.choice(["You're amped but low on energy, and energy wins today, so there's no extra load or volume to chase.",
                              "Amped but low on energy: the tank wins today, so we didn't add load or volume."])], [st['yielded']]
        s2 = st['states'][0]; f = st['by_state'][s2][0]; d = _decision(f, r, bare=True)
        if not d: return None
        return [f"You're amped but low on energy, so there's no extra load to chase, and because {r.choice(PH.BECAUSE[s2])}, {d}."], [st['yielded'], f]
    f = st['by_state'][s][0]
    a = _decision(f, r)
    if not a: return None
    return [r.choice(PH.YIELD).format(a=a)], [f, st['yielded']]


def hook_sore_state(st, r):
    s = st['states'][0]; f = st['by_state'][s][0]; so = st['sore']
    a = _decision(f, r); sc = _decision(so, r, bare=True)
    if not a or not sc: return None
    bits = PH.sore_bits(so['data'])
    t = r.choice(PH.SORE_STATE.get(s) or PH.SORE_STATE['*'])
    return [t.format(a=a, s=sc, adj=PH.STATE_ADJ[s], **bits)], [so, f]


def hook_sore_only(st, r):
    so = st['sore']; d = _decision(so, r); bits = PH.sore_bits(so['data'])
    if not d: return None
    if so['tag'] in ('sore_shift_upper', 'sore_shift_lower', 'sore_no_hinge', 'sore_override'):
        return [f"Your {bits['region']} {bits['be']} sore, so {d}."], [so]
    return [r.choice([f"Your {bits['region']} {bits['be']} sore, so {d}.", f"Sore {bits['region']} today: {d}."])], [so]


def hook_input(st, r, direction):
    for f in st['inputs'][:2] if r.random() < 0.3 else st['inputs'][:1]:
        opts = PH.input_sentence(f['tag'], f['data'], direction)
        if opts: return [r.choice(opts)], [f]
    return None


def hook_structure(st, r, direction):
    lead = next((f for f in st['base'] if f['tag'] in ('lead_lift', 'sweat_shape', 'quality_first')), None)
    if not lead: return None
    return [r.choice(PH.intent(lead['tag'], lead['data'], direction))], [lead]


# ---------------------------------------------------------------- proof (sentence two) and cue
def _input_sentence(f, B, r):
    return _pick(PH.input_sentence(f['tag'], f['data'], B.direction), r)


def proof(B, st, used, r, sentences_so_far):
    pool = []
    said = {_state_of(f) for f in used}
    for s in st['states']:            # a State not yet explained comes before more proof of one that was
        if s not in said and st['by_state'][s]: pool.append(('adapt', st['by_state'][s][0]))
    for s in st['states']:
        for f in st['by_state'][s]:
            if f not in used and ('adapt', f) not in pool: pool.append(('adapt', f))
    if st['sore'] and st['sore'] not in used: pool.insert(0, ('sore', st['sore']))
    for f in st['inputs']:
        if f not in used: pool.append(('input', f))
    if not st['states'] and not st['sore']:
        for f in st['base']:
            if f not in used and f['tag'] != 'full_rest_rule':
                # QA freeze: never re-announce a lead lift the hook already named ("...Squat gets heavy work first. Heavy work leads today: Squat")
                if f['tag'] == 'lead_lift' and any(u['data'].get('name') and u['data'].get('name') == f['data'].get('name') for u in used): continue
                pool.append(('base', f))
    if not pool: return None, None
    # the strongest remaining reason first, with a little variety among the top two
    must = pool[0][0] == 'sore' or (pool[0][0] == 'adapt' and _state_of(pool[0][1]) not in said)
    kind, f = pool[0] if len(pool) == 1 or must or r.random() < 0.7 else pool[1]   # untold soreness / States always come next
    if kind == 'sore':
        bits = PH.sore_bits(f['data']); d = _decision(f, r, bare=True)
        return (f"Your {bits['region']} {bits['be']} sore too, so {d}." if d else None), f
    if kind == 'adapt':
        d = _decision(f, r)
        if not d: return None, f
        s = _state_of(f)
        multi = len(st['states']) > 1 and s not in ' '.join(sentences_so_far[:1]).lower()
        if multi and s in PH.BECAUSE: return f"And because {r.choice(PH.BECAUSE[s])}, {d}.", f
        return _end(_cap(d)), f
    if kind == 'input':
        return _input_sentence(f, B, r), f
    return _pick(PH.intent(f['tag'], f['data'], B.direction), r), f


def cue(used, r):
    for f in used:
        c = PH.CUE.get(f['tag'])
        if c: return r.choice(c)
    return None


# ---------------------------------------------------------------- compose
def plan(B, st, r):
    st['owed_extra'] = len(st['states']) + bool(st['sore']) >= 3
    h = None
    if st['yielded']: h = hook_yield(st, r)
    if h: pass
    elif len(st['states']) >= 2: h = hook_pair(st, r)
    elif st['states'] and st['sore']: h = hook_sore_state(st, r) if r.random() < 0.8 else None
    elif st['states']: h = hook_single(st['states'][0], st['by_state'][st['states'][0]], r)
    elif st['sore']: h = hook_sore_only(st, r)
    elif st['inputs']: h = hook_input(st, r, B.direction)
    else: h = hook_structure(st, r, B.direction)
    if h is None and st['states']:      # e.g. sore + State told as two sentences: State hook, soreness as the proof
        h = hook_single(st['states'][0], st['by_state'][st['states'][0]], r)
    if not h: return None
    out, used = list(h[0]), list(h[1])
    owed = (st['sore'] and st['sore'] not in used) or any(s not in {_state_of(f) for f in used} for s in st['states'])
    if len(out) < 3 and (owed or len(G.words(' '.join(out))) < 34):
        p, f = proof(B, st, used, r, out)
        if p and f: out.append(p); used.append(f)
    said_names = lambda: ' '.join(out)
    if len(out) < 2 and len(G.words(' '.join(out))) < 30:   # nothing else to prove: what the session looks like around that change
        extra = next((f for f in st['base'] if f not in used and PH.intent(f['tag'], f['data'], B.direction)
                      and not (f['data'].get('name') and f['data']['name'] in said_names())), None)
        if extra:
            opts = [o for o in PH.intent(extra['tag'], extra['data'], B.direction) if not (B.arch_name and B.arch_name in o and B.arch_name in said_names())]
            if opts: out.append(r.choice(opts)); used.append(extra)
    if len(out) < 3 and len(G.words(' '.join(out))) <= 36 and (len(out) < 2 or r.random() < 0.35):
        c = cue(used, r)
        if c: out.append(c)
    if len(out) < 2 or (len(out) < 3 and len(G.words(' '.join(out))) < G.MIN_WORDS):   # last resort: the session's own structure
        extra = next((f for f in st['base'] if f not in used and PH.intent(f['tag'], f['data'], B.direction)
                      and not (f['data'].get('name') and f['data']['name'] in said_names())), None)
        if extra:
            opts = [o for o in PH.intent(extra['tag'], extra['data'], B.direction) if not (B.arch_name and B.arch_name in o and B.arch_name in said_names())]
            if opts: out.append(r.choice(opts)); used.append(extra)
    return out[:3], used


def compose(B, recent=(), n=90):
    """-> dict(text, frame, facts, claims, gate, candidates) or None."""
    st = story(B)
    seed = int(hashlib.md5(B.seed.encode()).hexdigest()[:8], 16)
    seen, cands = set(), []
    for i in range(n):
        r = random.Random(seed * 1000 + i)
        try: res = plan(B, st, r)
        except Exception: res = None            # one bad phrasing never sinks the message
        if not res: continue
        sents, used = res
        text = ' '.join(s.strip() for s in sents if s)
        if text in seen: continue
        seen.add(text)
        ok, problems, sim = G.check(text, B, [f['tag'] for f in used], recent)
        nw = len(G.words(text))
        dup = sum(max(0, text.count(nm) - 1) for nm in B.names)
        firsts = [G.words(x)[:1] for x in G.sentences(text)]
        dup += sum(1 for k, w0 in enumerate(firsts) if w0 and w0 in firsts[:k])
        score = (0 if ok else -100 - 10 * len(problems)) - 4.0 * sim['max_jaccard'] - (0.8 if sim['opener_clash'] else 0) - (1.0 if sim['closer_clash'] else 0) \
            - 0.5 * sim.get('older_reuse', 0) - 0.5 * sim.get('family_recent', 0) - (1.5 if sim.get('construction_run') else 0) \
            - abs(nw - G.IDEAL) / 40.0 - 0.6 * dup - i * 1e-4
        frame = 'pair' if len(st['states']) >= 2 else ('state' if st['states'] else ('sore' if st['sore'] else ('input' if st['inputs'] else 'structure')))
        cands.append(dict(text=text, frame=frame, facts=[f['tag'] for f in used], claims=[c for f in used for c in f['claims']], ok=ok, problems=problems, sim=sim, score=score))
    if not cands: return None
    best = max(cands, key=lambda c: c['score'])
    return dict(text=best['text'], frame=best['frame'], facts=best['facts'], claims=best['claims'], gate=dict(ok=best['ok'], problems=best['problems'], **best['sim']),
                candidates=len(cands))
