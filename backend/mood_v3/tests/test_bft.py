"""Built for Today (Oct 2026 quality pass): truthfulness, quality gate, variety, LLM safety, and that the copy layer never
touches the workout."""
import asyncio, json, os, re
import pytest
from mood_v3 import service as S
from mood_v3.bft import gate as G, llm as L
from mood_v3.bft.brief import Brief
from mood_v3.qa.bft_qa import CASES, DAYS

STATE_WORDS = re.compile(r"\b(amped|extra juice|energy's high|low battery|full tank|wound up|bored|novelty|stressed|head's full|irritated)\b", re.I)


def gen(raw, user='t', date=DAYS[0], recent=()):
    env, st = S.generate_workout(dict(raw, date=date), user, recent_bft=list(recent))
    return env, st


@pytest.mark.parametrize('cid,label,raw', CASES, ids=[c[0] for c in CASES])
def test_every_case_passes_the_gate_and_stays_truthful(cid, label, raw):
    env, _ = gen(raw, 'qa_' + cid)
    assert env['status'] == 'ok'
    w = env['workout']; b = env['_bft']; B = Brief.from_dict(b['brief'])
    text = w['today']['blurb']; meta = w['today']['blurb_meta']
    ok, problems, _ = G.check(text, B, meta['facts'], [])
    assert ok, (text, problems)
    assert meta['source'] == 'composer'
    assert 2 <= len(G.sentences(text)) <= 3 and G.MIN_WORDS <= len(G.words(text)) <= G.MAX_WORDS
    # every fact the copy rests on exists in the brief, and every State fact rests on a realized contract entry
    tags = {f['tag']: f for f in B.facts}
    assert set(meta['facts']) <= set(tags)
    for t in meta['facts']:
        for c in tags[t]['claims']:
            if c and c[0] == 'state': assert c[1] in w['states'], (t, c)
    assert '—' not in text and '–' not in text


def test_no_state_copy_never_pretends_to_know_how_you_feel():
    for raw in (dict(direction='strength', duration=60), dict(direction='sweat', duration=60), dict(direction='athletic', duration=60)):
        env, _ = gen(raw, 'nostate')
        t = env['workout']['today']['blurb']
        assert not STATE_WORDS.search(t), t
        assert env['workout']['today']['blurb_meta']['frame'] in ('input', 'structure')


def test_soreness_is_always_acknowledged():
    for raw in (dict(direction='strength', soreness=['shoulders'], duration=60), dict(direction='athletic', soreness=['legs'], duration=60),
                dict(direction='strength', states=['amped'], soreness=['legs'], duration=60)):
        t = gen(raw, 'sore')[0]['workout']['today']['blurb']
        assert re.search(r'\bsore\b', t, re.I), t


@pytest.mark.parametrize('raw', [dict(direction='strength', states=['low_energy'], duration=60), dict(direction='sweat', duration=60),
                                 dict(direction='athletic', states=['amped'], duration=60)])
def test_identical_inputs_do_not_repeat_themselves(raw):
    recent, texts = [], []
    for d in DAYS:
        t = gen(raw, 'repeat', d, recent)[0]['workout']['today']['blurb']
        texts.append(t); recent.insert(0, t)
    assert len(set(texts)) == len(texts)
    for i, t in enumerate(texts):
        for u in texts[:i]: assert G.jaccard(t, u) <= 0.30, (t, u)
    assert len({G.opener(t) for t in texts}) >= 4


def test_same_day_same_inputs_is_stable_and_different_workout_changes_copy():
    raw = dict(direction='strength', states=['amped'], duration=60)
    a = gen(raw, 'stable')[0]['workout']['today']['blurb']; b = gen(raw, 'stable')[0]['workout']['today']['blurb']
    assert a == b
    env, st = gen(raw, 'stable')
    env2, _ = S.swap_workout(st, env)
    assert env2['workout']['today']['blurb'] != a


def test_copy_layer_never_changes_the_workout():
    raw = dict(direction='strength', states=['amped', 'stressed'], duration=60)
    e1, s1 = gen(raw, 'det', recent=[]); e2, s2 = gen(raw, 'det', recent=['Something completely different was said here yesterday, about other things.'])
    strip = lambda w: json.dumps([[(i['exercise']['id'], i['prescription']) for i in b['items']] for b in w['blocks']], sort_keys=True, default=str)
    assert strip(e1['workout']) == strip(e2['workout']) and s1['fingerprint'] == s2['fingerprint']


def test_exercise_swap_keeps_copy_unless_it_named_the_swapped_exercise():
    env, st = gen(dict(direction='strength', states=['low_energy'], duration=60), 'swap')
    w = env['workout']; text = w['today']['blurb']
    item = next(i for b in w['blocks'] for i in b['items'] if i['swap']['swappable'] and i['exercise']['name'] not in text)
    env2, _ = S.swap_exercise(st, env, item['item_id'])
    assert env2['workout']['today']['blurb'] == text


# ---------------------------------------------------------------- LLM writer: only verified, gate-passing copy gets through
def _brief(raw=dict(direction='strength', states=['amped'], duration=60), user='llm'):
    env, _ = gen(raw, user)
    return env, Brief.from_dict(env['_bft']['brief'])


def test_llm_pick_rejects_invented_or_unverified_copy():
    env, B = _brief()
    fid = next(f['id'] for f in B.facts if any(c and c[0] == 'state' for c in f['claims']))
    bad = [dict(text="You've got energy today, so Barbell Snatch Complex goes first and heavier than ever before in your whole life today.", facts=[fid]),
           dict(text="You selected Amped, so your workout has been optimized with higher intensity across the board for you today.", facts=[fid]),
           dict(text="Energy's high, so we added 7 extra sets to the main lift and kept the rest of the session sharp and quick.", facts=[fid])]
    best, report = L.pick(B, json.dumps(dict(options=bad)), [])
    assert best is None and all(not r['ok'] for r in report)
    from mood_v3.bft import phrases as PH
    sf = next(f for f in Brief.from_dict(env['_bft']['brief']).facts if any(c and c[0] == 'state' for c in f['claims']))
    good = f"You came in amped, so {PH.do(sf['tag'], sf['data'])[0]}. Those are the sets that take the extra push today, while the rest of the session runs as planned."
    best, rep = L.pick(B, json.dumps(dict(options=[dict(text=good, facts=[fid])])), [])
    assert best and best['text'] == good, rep


def test_llm_upgrade_is_optional_and_never_blocks(monkeypatch):
    env, _ = _brief(); before = env['workout']['today']['blurb']
    monkeypatch.delenv('ANTHROPIC_API_KEY', raising=False)
    asyncio.run(L.upgrade(env)); assert env['workout']['today']['blurb'] == before          # no key: composer copy
    monkeypatch.setenv('ANTHROPIC_API_KEY', 'test')
    async def slow(payload, timeout): await asyncio.sleep(5)
    monkeypatch.setattr(L, '_post', slow)
    import time; t0 = time.monotonic()
    asyncio.run(L.upgrade(env, timeout=0.3))
    assert time.monotonic() - t0 < 1.0 and env['workout']['today']['blurb'] == before      # slow: timeout, composer copy stands
    async def boom(payload, timeout): raise RuntimeError('network down')
    monkeypatch.setattr(L, '_post', boom)
    asyncio.run(L.upgrade(env)); assert env['workout']['today']['blurb'] == before          # error: composer copy stands
    fid = next(f['id'] for f in Brief.from_dict(env['_bft']['brief']).facts if any(c and c[0] == 'state' for c in f['claims']))
    from mood_v3.bft import phrases as PH
    sf = next(f for f in Brief.from_dict(env['_bft']['brief']).facts if any(c and c[0] == 'state' for c in f['claims']))
    good = f"You came in amped, so {PH.do(sf['tag'], sf['data'])[0]}. Those are the sets that take the extra push today, while the rest of the session runs as planned."
    async def ok(payload, timeout):
        assert 'Exercise list' in payload['messages'][0]['content']
        return dict(content=[dict(type='text', text=json.dumps(dict(options=[dict(text=good, facts=[fid])])))])
    monkeypatch.setattr(L, '_post', ok)
    asyncio.run(L.upgrade(env)); assert env['workout']['today']['blurb'] == good and env['workout']['today']['blurb_meta']['source'] == 'llm'


# ---------------------------------------------------------------- router: the brief never leaves the server; recent copy is fed back
from mood_v3.tests.test_router import client  # noqa: F401  (pytest fixture)


def test_router_returns_and_stores_copy_without_the_server_brief(client):
    texts = []
    for d in DAYS[:3]:
        env = client.post('/api/v3/workouts/generate', json=dict(direction='strength', states=['low_energy'], duration=60, date=d)).json()
        assert '_bft' not in env and env['workout']['today']['blurb']
        texts.append(env['workout']['today']['blurb'])
    assert all('_bft' not in doc['envelope'] for doc in client.db.v3_workouts.docs)
    assert len(set(texts)) == 3
    wid = env['workout']['workout_id']
    env2 = client.post(f'/api/v3/workouts/{wid}/swap-workout').json()
    assert '_bft' not in env2 and env2['workout']['today']['blurb'] not in texts



# ---------------------------------------------------------------- magic-moment pass: First-Sentence Test and filler
@pytest.mark.parametrize('cid,label,raw', CASES, ids=[c[0] for c in CASES])
def test_first_sentence_names_what_we_know_and_what_it_changed(cid, label, raw):
    env, _ = gen(raw, 'qa_' + cid)
    ok, why = G.first_sentence_test(env['workout']['today']['blurb'], Brief.from_dict(env['_bft']['brief']))
    assert ok, (env['workout']['today']['blurb'], why)


def test_gate_rejects_pleasant_but_unproven_copy():
    env, B = _brief(dict(direction='strength', states=['amped'], duration=60))
    fid = [f['tag'] for f in B.facts if any(c and c[0] == 'state' for c in f['claims'])]
    vague = "Energy's high, so today asks a little more of you. The accessories run closer to failure than usual. Push where it counts and let the rest take care of itself."
    ok, problems, _ = G.check(vague, B, fid, [])
    assert not ok and any('first sentence' in p for p in problems) and any('filler' in p for p in problems), problems


def test_multi_state_first_sentence_resolves_both():
    env, B = _brief(dict(direction='strength', states=['low_energy', 'amped'], duration=60), 'qa_S8')
    one_state = "You're low on energy, so every working set stops a little further from failure. Barbell Hip Thrust gets pushed a rep closer to failure because you're amped."
    ok, why = G.first_sentence_test(one_state, B)
    assert not ok and 'two States' in why
    t = env['workout']['today']['blurb']
    assert G.first_sentence_test(t, B)[0] and 'budget' in t.split('.')[0], t



# ---------------------------------------------------------------- final editorial pass: paraphrase OK, vagueness / schema / all-out not OK
def test_first_sentence_accepts_a_paraphrase_of_the_state():
    env, B = _brief(dict(direction='strength', states=['amped'], duration=60), 'qa_S2')
    t = "You've got extra juice today, so the accessories run a rep closer to failure and the last kickback set turns into a rest-pause. Keep that last set clean all the way through."
    assert G.first_sentence_test(t, B)[0]


@pytest.mark.parametrize('bad', [
    "You're bored but stressed, so the new stuff is in the movements, not the structure. Keep everything simple and predictable today.",
    "You've got extra energy today, so the session gets harder and there's an extra challenge waiting for you at the end.",
    "Your energy is low, so we scaled things back and kept the work that matters front and center today.",
])
def test_gate_rejects_vague_personalization(bad):
    env, B = _brief(dict(direction='strength', states=['bored', 'stressed'], duration=60), 'qa_S9')
    ok, problems, _ = G.check(bad, B, [f['tag'] for f in B.facts], [])
    assert not ok and any(p.startswith(('vague', 'filler', 'first sentence')) for p in problems), problems


def test_gate_rejects_internal_language_and_all_out_for_athletic():
    env, B = _brief(dict(direction='strength', target=['quads', 'glutes'], states=['low_energy'], duration=60), 'qa_P2')
    t = "With quads and glutes as your Target, each gets direct work, and since you're low on energy every working set stops a little further from failure."
    ok, problems, _ = G.check(t, B, [f['tag'] for f in B.facts], [])
    assert not ok and any('internal language' in p for p in problems)
    env, A = _brief(dict(direction='athletic', states=['low_energy'], duration=60), 'qa_A1')
    t = "You're running low today, so there are fewer explosive sets and each one is all-out, with fewer landings than usual. If a rep slows down, the set is done."
    ok, problems, _ = G.check(t, A, [f['tag'] for f in A.facts], [])
    assert not ok and any('full intent' in p for p in problems)


def test_storytelling_devices_and_constructions_are_tracked_across_messages():
    recent = ["You're amped today, so Barbell Hip Thrust gets pushed a rep closer to failure, heavy and early.",
              "You're stressed today, so every rep moves at a steady, controlled tempo while you're fresh."]
    sim = G.similarity("You're bored today, so Frog Pump gets pushed a rep closer to failure, heavy and early.", recent)
    assert sim['family_overlap'] >= 2 and sim['construction_run']
