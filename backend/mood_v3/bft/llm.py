"""Built for Today, optional LLM writer.

The LLM never sees the workout engine, the user's raw request or anything outside the verified brief. It is asked for three
short options written from the brief's facts only; each option is checked by the same gate as the composer (length, banned
language, names, numbers, personal / specific, similarity to the user's recent messages) and only a passing option replaces the
composer's copy. Any error, refusal, timeout or failed check keeps the composer copy that is already in the envelope, so the
workout is never blocked and never shown without an explanation.

Config (environment):
    ANTHROPIC_API_KEY      enables the writer (absent -> composer only)
    BFT_LLM                'off' disables it even when a key is present
    BFT_LLM_MODEL          default 'claude-haiku-4-5'
    BFT_LLM_TIMEOUT_S      hard ceiling for the blocking upgrade() call, default 2.5 (legacy path)
    BFT_STREAM_TIMEOUT_S   hard ceiling for the background streaming writer, default 7

Streaming (Oct 2026, the path the router uses): stream() asks for ONE message, preceded by a "FACTS:" line naming the facts it
rests on, streams it into a server-side buffer and releases it sentence by sentence. A sentence is released only after
gate.sentence_problems() passes it (claims, names, numbers, language, the first-sentence test). Nothing unvalidated is ever
published; a failure before the first release means the composer copy stands; a failure after it keeps the released,
complete sentences.
"""
from __future__ import annotations
import asyncio, json, logging, os, re, time
from . import gate as G
from .brief import Brief

log = logging.getLogger('mood_v3.bft')
API = 'https://api.anthropic.com/v1/messages'
N_OPTIONS = int(os.environ.get('BFT_LLM_OPTIONS', 2))   # 2 keeps latency down; each option is gated

SYSTEM = """You write the "Built for Today" note that appears after MOOD, a fitness app, builds someone's workout.

The north star: a coach who just listened to what the person told them explains, in one breath, what they changed because of it.

Structure: EXACTLY 2 or 3 sentences, 25 to 50 words in total. Never one long sentence. Never more than 50 words.
1. HOOK. Sentence one must unmistakably reflect something we know about the person today (how they feel, soreness; on a day with no feelings, what they asked to train, their goal, level, 30-minute window, equipment or history) AND name the concrete change it caused, with cause and effect explicit. You do not have to use the feeling's label ("You've got extra juice today, so your accessories run a rep closer to failure and your last kickback set turns into a rest-pause" is perfect). Do NOT fall into a fixed "You're [feeling], so [change]" pattern; vary how sentence one is built.
2. PROOF. One or two more concrete decisions from the facts.
3. CUE. Optional, and only if it is specific to a decision you named. Never motivational filler.

Two feelings: sentence one must name both and explain how they were resolved together (for example, amped but low on energy: energy sets the overall budget and the drive is concentrated in one place). That resolution is the most interesting thing you can say; never just list the resulting exercises. Soreness plus a feeling: say what was protected and where the feeling's change went.
No feelings at all: lead with the strongest real input listed; never invent personalisation. Only when no input fact exists, explain the session's intentional structure.

Checklist the app enforces (an option that misses any of these is thrown away):
- Sentence one contains BOTH every feeling we were told about (in your own words if you like) AND at least one concrete change it caused, joined by explicit cause ("so", "because", "means", a colon). With soreness plus a feeling, sentence one covers the soreness AND the feeling.
- A feeling with no adaptation fact did not change the workout: do not credit it with anything (for example, never say a heavy main lift is there "to use your readiness" unless a fact says so).
- Only name exercises involved in a change or the main lift. Do not recite the session's exercise list.
- Never say something runs "as planned", "as usual" or "stays the same" in sentence one: lead with what changed.
- Never approximate the facts' quantities ("half", "double", "twice"); use the exact numbers or none. Never claim more than a fact says: "no rest", "never done before" or "every set" need a fact that says exactly that.
- With two feelings, name BOTH in sentence one (in whatever words fit). This is the most common reason options get thrown away.
- Vary how you refer to a feeling; do not settle on one stock phrase for it (for example, not always "fired up" or "Low energy means").
- In a session without feelings, stay concrete and plain; no abstract imagery ("transitions hot", "pulls you back in").
- Write "Glutes + Legs" or "legs", never the word "state", "slot", "RPE", or "dial".

Hard rules:
- Never state, imply or invent a change that is not in the facts. Facts of kind "structure" describe the session's normal design; never present them as a reaction to how the person feels.
- Exercise names: only ones from the exercise list (or named in a fact as what was removed or replaced), written exactly. Avoid numbers; never use one that is not in a fact.
- Never use: easier, reduced, lower (except "lower back"), selected, inputs, optimized, personalized, "based on your", "given your", algorithm, state, RIR, RPE, em dashes or en dashes, hashtags, emojis, hype, therapy language.
- Name the mechanism, never a summary of it. The facts give you the actual change (exercises, sets, reps, effort, rest, structure, substitutions, order, impact, volume): say that. Fail examples: "the new stuff is in the movements", "we changed things up", "the session gets harder", "more intensity", "different work", "extra challenge", "we're using that energy", "built to take advantage", "we scaled things back". Better: "Parallel Bar Dip and Bayesian Cable Curl replace more familiar picks while the sets stay simple"; "accessory volume comes down and your working sets stop a couple of reps further from failure". If the reader could still ask "okay, but what did you actually change?", rewrite.
- Speak like a coach, not the app: never "Target", "with X as your Target", "selected", "State", "Direction", "archetype", "MOOD's Pick" or other product terms. Say "You wanted quads and glutes, so both get direct work."
- Athletic explosive work is "full intent", never "all-out" or "max effort" (those mean fatigue, which is the opposite of the point).
- Avoid the storytelling devices the fallback writer leans on: "while you're fresh", "before fatigue sets in", "gets pushed closer to failure", "gets the day off", "takes over", "extra energy today", "keep the explosive theme going", "anchors", "comes first". Repeating the programming truth is fine; repeating the device is not.
- No motivational filler of any family: "where it counts", "where it matters", "quality work", "let the rest take care of itself", "real work", "make it count", "you got this", "built for you", and anything that would read the same on any workout. Facts beat motivation.
- No lists, labels or quotation marks. Plain words a non-lifter understands.
- The two options must use genuinely different sentence shapes and must not reuse the openings, structures or closing lines of the recent messages shown.

Return JSON only: {"options": [{"text": "...", "facts": ["f1", "f2"]}, {"text": "...", "facts": [...]}]} (two options with different sentence shapes) where "facts" lists the ids of the facts each option relies on."""

EXAMPLES = """Examples of the bar (not templates; never copy them):
- Amped but low on energy: the tank sets the budget, so the only push is one rep closer to failure on the hip thrust, and the kickbacks and leg extensions stop further from failure.
- Not much in the tank today, so accessory volume comes down and every working set stops a couple of reps further from failure.
- Your shoulders are sore and you're amped, so today is a Glutes + Legs session and that's where the readiness goes: the main lift gets a heavy top set.
- You wanted chest and triceps, so both get direct work, chest first, with the bench press going heavy for fewer reps."""


def enabled():
    return bool(os.environ.get('ANTHROPIC_API_KEY')) and os.environ.get('BFT_LLM', 'on').lower() not in ('off', '0', 'false')


def _kind(f):
    if any(c and c[0] in ('state', 'soreness', 'state_yielded') for c in f['claims']): return 'adaptation (how they feel changed this)'
    if f['topic'] in ('target', 'goal', 'level', 'history', 'duration', 'equipment'): return 'personal context'
    return 'structure'


def prompt(B, composer_facts, recent, ask='Write two options.'):
    told = ', '.join({'low_energy': 'low energy', 'amped': 'amped', 'irritated': 'irritated', 'stressed': 'stressed', 'bored': 'bored'}.get(s, s) for s in B.states) or 'nothing'
    facts = '\n'.join(f"- {f['id']} [{_kind(f)}] {f['ev']}" for f in sorted(B.facts, key=lambda f: -f['pri']))
    suggested = ', '.join(f['id'] for f in B.facts if f['tag'] in (composer_facts or [])) or 'your choice'
    rec = '\n'.join(f"- {r}" for r in (recent or [])[:6]) or '- (none yet)'
    return (f"{EXAMPLES}\n\nToday's session: {B.direction.title()} · {B.arch_name}" + (f" · Target {B.target_label}" if B.target_label else '') +
            f"\nWhat they told us today: {told}" + (f"; sore: {', '.join(B.sore_regions)}" if B.sore_regions else '') +
            f"\nExercise list: {'; '.join(B.names)}\n\nFacts (highest priority first):\n{facts}\n\nThe strongest story is probably built on: {suggested}"
            f"\n\nRecent Built for Today messages for this person (do not echo them):\n{rec}\n\n{ask}")


def _numbers_ok(text, used):
    ev = ' '.join(f['ev'] for f in used)
    return all(n in ev for n in re.findall(r'\d+', text))


def pick(B, raw_json, recent):
    """-> (best option dict or None, report). Every option goes through the same gate as the composer."""
    try:
        m = re.search(r'\{.*\}', raw_json, re.S); data = json.loads(m.group(0)) if m else {}
    except Exception:
        return None, [dict(error='unparseable')]
    byid = {f['id']: f for f in B.facts}
    report, ok = [], []
    for o in (data.get('options') or [])[:N_OPTIONS]:
        t = G.normalize(o.get('text'))
        used = [byid[i] for i in (o.get('facts') or []) if i in byid]
        good, problems, sim = G.check(t, B, [f['tag'] for f in used], recent)
        if not _numbers_ok(t, used): good = False; problems.append('number not in facts')
        report.append(dict(text=t, ok=good, problems=problems, sim=sim))
        if good: ok.append((sim['max_jaccard'] + (0.2 if sim['opener_clash'] else 0), t, used))
    if not ok: return None, report
    ok.sort(key=lambda x: x[0])
    _, t, used = ok[0]
    return dict(text=t, facts=[f['tag'] for f in used]), report


async def _post(payload, timeout):
    headers = {'x-api-key': os.environ['ANTHROPIC_API_KEY'], 'anthropic-version': '2023-06-01', 'content-type': 'application/json'}
    try:
        import httpx
        async with httpx.AsyncClient(timeout=timeout) as c:
            r = await c.post(API, headers=headers, json=payload)
            r.raise_for_status(); return r.json()
    except ImportError:
        import urllib.request
        def go():
            req = urllib.request.Request(API, data=json.dumps(payload).encode(), headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=timeout) as resp: return json.loads(resp.read())
        return await asyncio.to_thread(go)


async def write(B, composer_facts, recent, timeout):
    payload = dict(model=os.environ.get('BFT_LLM_MODEL', 'claude-haiku-4-5'), max_tokens=380, temperature=0.9, system=SYSTEM,
                   messages=[dict(role='user', content=prompt(B, composer_facts, recent))])
    body = await _post(payload, timeout)
    text = ''.join(b.get('text', '') for b in body.get('content', []) if b.get('type') == 'text')
    return pick(B, text, recent)


async def upgrade(env, timeout=None):
    """Router hook. Mutates env['workout']['today'] when (and only when) a gate-passing LLM option arrives in time.
    Always safe to call; never raises; the composer copy stays when anything goes wrong."""
    meta = env.get('_bft') or {}
    if env.get('status') != 'ok' or not meta.get('brief') or meta.get('keep') or not enabled(): return env
    timeout = float(timeout or os.environ.get('BFT_LLM_TIMEOUT_S', 2.5))
    t0 = time.monotonic()
    try:
        B = Brief.from_dict(meta['brief'])
        best, report = await asyncio.wait_for(write(B, (meta.get('composer') or {}).get('facts'), meta.get('recent') or [], timeout), timeout)
        if best:
            today = env['workout']['today']
            today['blurb'] = best['text']; today['blurb_meta'] = dict(source='llm', frame=None, facts=best['facts'])
        log.info(f"bft llm {'accepted' if best else 'rejected'} in {time.monotonic() - t0:.2f}s" + ('' if best else f": {[r.get('problems') for r in report]}"))
    except Exception as ex:   # timeout, network, quota, bad JSON: the composer copy stands
        log.warning(f"bft llm skipped after {time.monotonic() - t0:.2f}s: {ex!r}")
    return env


# ---------------------------------------------------------------- streaming writer (background, never blocks the workout)
STREAM_SYSTEM = (SYSTEM
    .replace('(an option that misses any of these is thrown away)', '(a message that misses any of these is thrown away, sentence by sentence)')
    .replace('This is the most common reason options get thrown away.', 'This is the most common reason messages get thrown away.')
    .replace('- The two options must use genuinely different sentence shapes and must not reuse the openings, structures or closing lines of the recent messages shown.',
             '- Do not reuse the openings, structures or closing lines of the recent messages shown.')
    .split('Return JSON only:')[0] +
    'Output format, exactly: a first line "FACTS: " followed by the ids of the facts the message relies on (for example "FACTS: f1, f3"), '
    'then a new line, then the message itself as plain text. Nothing else: no JSON, no quotation marks, no labels.')
assert 'Return JSON' not in STREAM_SYSTEM and 'two options' not in STREAM_SYSTEM.lower()

STREAM_TIMEOUT = float(os.environ.get('BFT_STREAM_TIMEOUT_S', 7))
_SENT_END = re.compile(r'[.!?]["\')\]]?(?=\s)')


_CLIENTS = {}


def _client(httpx):
    """One keep-alive connection pool per event loop: skips a TLS handshake on every message (~0.1 s measured)."""
    loop = asyncio.get_running_loop()
    c = _CLIENTS.get(id(loop))
    if c is None or c.is_closed:
        for k in [k for k in _CLIENTS if k != id(loop)]: _CLIENTS.pop(k, None)   # loops from finished runs (tests)
        c = _CLIENTS[id(loop)] = httpx.AsyncClient(limits=httpx.Limits(max_keepalive_connections=10, keepalive_expiry=60),
                                                  transport=httpx.AsyncHTTPTransport(retries=1))
    return c


async def _stream_text(payload, timeout):
    """Yield text deltas from the Messages API (SSE). Without httpx, one non-streamed call is yielded whole."""
    headers = {'x-api-key': os.environ['ANTHROPIC_API_KEY'], 'anthropic-version': '2023-06-01', 'content-type': 'application/json'}
    try:
        import httpx
    except ImportError:
        body = await _post(dict(payload), timeout)
        yield ''.join(b.get('text', '') for b in body.get('content', []) if b.get('type') == 'text'); return
    c = _client(httpx)
    async with c.stream('POST', API, headers=headers, json=dict(payload, stream=True), timeout=httpx.Timeout(timeout, connect=min(timeout, 3.0))) as r:
        if r.status_code >= 400:
            await r.aread(); raise RuntimeError(f'http {r.status_code}: {r.text[:160]}')
        async for line in r.aiter_lines():
            if not line.startswith('data:'): continue
            try: ev = json.loads(line[5:].strip())
            except ValueError: continue
            if ev.get('type') == 'content_block_delta' and (ev.get('delta') or {}).get('type') == 'text_delta':
                yield ev['delta'].get('text', '')
            elif ev.get('type') == 'error':
                raise RuntimeError(f"stream error: {(ev.get('error') or {}).get('type')}")
            elif ev.get('type') == 'message_stop':
                return


class _Stop(Exception):
    pass


async def stream(meta, publish, timeout=None, source=None):
    """Write one message from the verified brief and release it sentence by sentence.

    meta:    the server-only env['_bft'] dict (brief, composer, recent)
    publish: async callback(text) called with the validated, displayable text each time a sentence is released
    source:  test hook replacing _stream_text (an async generator factory taking (payload, timeout))
    -> (text or None, used fact tags, metrics). Never raises except CancelledError (a newer job superseded this one)."""
    timeout = float(timeout or STREAM_TIMEOUT)
    t0 = time.monotonic(); el = lambda: round(time.monotonic() - t0, 2)
    m = dict(ttft=None, t_first_sentence=None, t_first_display=None, total=None, outcome=None, reason=None,
             streamed_before_failure=False, attempts=0, sentences=0, words=0, rejected=[], final_problems=[], attempt_reasons=[])
    shown, used = [], []
    B = Brief.from_dict(meta['brief']); recent = list(meta.get('recent') or [])
    byid = {f['id']: f for f in B.facts}
    src = source or _stream_text

    async def attempt():
        nonlocal used
        payload = dict(model=os.environ.get('BFT_LLM_MODEL', 'claude-haiku-4-5'), max_tokens=260, temperature=0.9, system=STREAM_SYSTEM,
                       messages=[dict(role='user', content=prompt(B, (meta.get('composer') or {}).get('facts'), recent, ask='Write the message.'))])
        buf, header, evidence = '', False, ''

        async def take(sentence):
            nonlocal evidence
            sentence = G.normalize(sentence)
            if not sentence: return
            if m['t_first_sentence'] is None: m['t_first_sentence'] = el()
            if G.over_budget(sentence, shown): raise _Stop('trimmed')
            probs = G.sentence_problems(sentence, len(shown), shown, B, used, recent, evidence)
            if probs:
                m['rejected'].append(dict(idx=len(shown), text=sentence, problems=probs))
                raise _Stop(f"sentence {len(shown) + 1} rejected: {probs[0]}")
            shown.append(sentence)
            if m['t_first_display'] is None: m['t_first_display'] = el()
            await publish(' '.join(shown))

        agen = src(payload, max(1.0, timeout - el()))
        try:
            async for chunk in agen:
                if m['ttft'] is None: m['ttft'] = el()
                buf += chunk
                if not header:
                    if '\n' not in buf.lstrip():
                        if len(buf) > 300: raise _Stop('malformed: no FACTS line')
                        continue
                    first, buf = buf.lstrip().split('\n', 1)
                    hm = re.match(r'\s*FACTS?\s*:\s*(.*)$', first, re.I)
                    if not hm: raise _Stop('malformed: no FACTS line')
                    used = [byid[i]['tag'] for i in re.findall(r'f\d+', hm.group(1)) if i in byid]
                    # numbers must exist in the verified brief (any fact; the model under-cites the facts it leans on)
                    evidence = ' '.join(f['ev'] for f in B.facts)
                    header = True
                while header:
                    sm = _SENT_END.search(buf)
                    # a sentence is released only once text after it has started arriving: a message that turns out to be a
                    # single sentence is never shown (it falls back instead), and nothing is held for more than a token or two
                    if not sm or not buf[sm.end():].strip(): break
                    await take(buf[:sm.end()]); buf = buf[sm.end():]
            if not header: raise _Stop('malformed: no FACTS line')
            rest = [x for x in re.split(r'(?<=[.!?])\s+', buf.strip()) if x]
            if not shown and len(rest) < 2: raise _Stop('single sentence')
            for i, x in enumerate(rest):
                if re.search(r'[.!?]["\')\]]?$', x): await take(x)
                else: m['rejected'].append(dict(idx=len(shown), text=x, problems=['incomplete sentence at end of stream'])); break
        finally:
            await agen.aclose()

    async def run():
        while True:
            m['attempts'] += 1
            try:
                await attempt(); m['reason'] = 'complete'; return
            except _Stop as s:
                m['reason'] = str(s); m['attempt_reasons'].append(str(s))
                if str(s) == 'trimmed': return
                # one fresh attempt, only while nothing has been shown and there is time for it
                if shown or m['attempts'] >= 2 or timeout - el() < 3.0: return

    try:
        await asyncio.wait_for(run(), timeout)
    except asyncio.TimeoutError:
        m['reason'] = 'timeout'
    except asyncio.CancelledError:
        raise
    except Exception as ex:   # network, quota, HTTP error, bad stream
        m['reason'] = f'error: {ex!r}'[:200]
    m['total'] = el()
    text = ' '.join(shown) or None
    if text:
        ok, problems, _ = G.check(text, B, used, recent)
        m['final_problems'] = problems     # logged for review; released text is never taken back
        m['outcome'] = 'complete' if m['reason'] in ('complete', 'trimmed') else 'partial'
        m['streamed_before_failure'] = m['outcome'] == 'partial'
        m['sentences'] = len(shown); m['words'] = len(G.words(text))
    else:
        m['outcome'] = 'fallback'
    return text, used, m
