"""Built for Today, hybrid streaming (Oct 2026): the workout never waits; only validated, complete sentences are ever published;
any failure before the first sentence leaves the composer copy; a failure after it keeps what was shown."""
import asyncio, re, time
import pytest
from mood_v3 import service as S
from mood_v3.bft import llm as L, gate as G
from mood_v3.bft.brief import Brief
from mood_v3.qa.bft_qa import CASES, DAYS

RAW = dict(next(c[2] for c in CASES if c[0] == 'S2'), date=DAYS[0])      # Strength · Amped
GOOD = ("You're fired up, so the Trap-Bar Deadlift goes a rep closer to failure and the main lifts sit at the heavy end of their rep range. "
        "A 45° Back Extension finisher closes the session once the big lifts are done.")


def _meta():
    env, _ = S.generate_workout(RAW, 'stream_user')
    return env['_bft']


def _facts_line(meta):
    return 'FACTS: ' + ', '.join(f['id'] for f in Brief.from_dict(meta['brief']).facts) + '\n'


def _source(*scripts, delay=0.0):
    """Fake Messages stream: each attempt plays the next script (a string, chunked 7 chars at a time, or an Exception)."""
    calls = iter(scripts)
    async def src(payload, timeout):
        script = next(calls)
        if isinstance(script, Exception): raise script
        for i in range(0, len(script), 7):
            if delay: await asyncio.sleep(delay)
            yield script[i:i + 7]
    return src


def _run(meta, src, timeout=7):
    pubs = []
    async def publish(t): pubs.append(t)
    text, used, m = asyncio.run(L.stream(meta, publish, timeout=timeout, source=src))
    return text, used, m, pubs


def test_valid_message_is_released_sentence_by_sentence_and_only_validated():
    meta = _meta(); B = Brief.from_dict(meta['brief'])
    text, used, m, pubs = _run(meta, _source(_facts_line(meta) + GOOD))
    assert text == GOOD and m['outcome'] == 'complete' and used
    assert pubs == [G.sentences(GOOD)[0], GOOD]                       # whole sentences only, in order
    for p in pubs:
        ss = G.sentences(p)
        for i, s in enumerate(ss): assert not G.sentence_problems(s, i, ss[:i], B, used, [], ' '.join(f['ev'] for f in B.facts))
    for k in ('ttft', 't_first_sentence', 't_first_display', 'total'): assert m[k] is not None


def test_invented_claim_in_first_sentence_is_never_shown_and_falls_back():
    meta = _meta()
    bad = _facts_line(meta) + "You're fired up, so there is no rest between any of the sets today. Cable Glute Kickback goes heavy."
    text, used, m, pubs = _run(meta, _source(bad, bad))
    assert text is None and pubs == [] and m['outcome'] == 'fallback' and m['attempts'] == 2
    assert 'unsupported claim' in m['reason'] and not m['streamed_before_failure']


def test_retry_after_a_rejected_first_sentence_can_still_succeed():
    meta = _meta()
    bad = _facts_line(meta) + "You're fired up, so rest is cut in half today. More follows."
    text, _, m, pubs = _run(meta, _source(bad, _facts_line(meta) + GOOD))
    assert text == GOOD and m['attempts'] == 2 and m['outcome'] == 'complete' and m['reason'] == 'complete'


def test_bad_second_sentence_keeps_the_shown_first_sentence_and_nothing_else():
    meta = _meta()
    s1 = G.sentences(GOOD)[0]
    text, _, m, pubs = _run(meta, _source(_facts_line(meta) + s1 + " Rest drops to 15 seconds between every set. Then more."))
    assert text == s1 and pubs == [s1] and m['outcome'] == 'partial' and m['streamed_before_failure']


def test_timeout_mid_stream_never_exposes_a_half_sentence():
    meta = _meta()
    s1 = G.sentences(GOOD)[0]
    long_tail = ' Cable Glute Kickback and Leg Extension both move a rep closer' + ' and on' * 200
    text, _, m, pubs = _run(meta, _source(_facts_line(meta) + s1 + long_tail, delay=0.01), timeout=1.2)
    assert text == s1 and pubs == [s1] and m['reason'] == 'timeout' and m['outcome'] == 'partial'


def test_single_sentence_malformed_and_errors_fall_back_cleanly():
    meta = _meta()
    s1 = G.sentences(GOOD)[0]
    for scripts in [(_facts_line(meta) + s1, _facts_line(meta) + s1), (GOOD, GOOD), (RuntimeError('http 529'),)]:
        text, _, m, pubs = _run(meta, _source(*scripts))
        assert text is None and pubs == [] and m['outcome'] == 'fallback', (scripts, m)


def test_message_over_three_sentences_is_trimmed_at_a_sentence_boundary():
    meta = _meta()
    text, _, m, pubs = _run(meta, _source(_facts_line(meta) + GOOD + ' Trap-Bar Deadlift goes heavy. Cable Glute Kickback goes heavy too. And more.'))
    assert len(G.sentences(text)) <= 3 and len(G.words(text)) <= G.MAX_WORDS and m['outcome'] == 'complete'


# ---------------------------------------------------------------- router: the workout returns at once; the copy follows
from mood_v3.tests import test_router as _TR  # noqa: E402


@pytest.fixture()
def client():
    """Like test_router's client, but entered as a context manager so one event loop lives across requests (as under
    uvicorn) and background Built for Today jobs keep running between calls."""
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    db = _TR._DB(); app = FastAPI(); user = {'id': 'user_a'}
    app.include_router(_TR.build_v3_router(db, lambda: user['id']), prefix='/api')
    with TestClient(app) as c:
        c.db = db; c.user = user
        yield c


def test_router_returns_workout_immediately_then_streams_validated_copy(client, monkeypatch):
    import mood_v3.router as R
    gate_open = {'go': False}
    async def fake_stream(meta, publish, timeout=None, source=None):
        while not gate_open['go']: await asyncio.sleep(0.01)
        s1 = G.sentences(GOOD)[0]
        await publish(s1); await asyncio.sleep(0.05); await publish(GOOD)
        return GOOD, ['amped_x'], dict(outcome='complete', reason='complete', ttft=0.1, total=0.2)
    monkeypatch.setattr(R.bft_llm, 'enabled', lambda: True)
    monkeypatch.setattr(R.bft_llm, 'stream', fake_stream)
    t0 = time.monotonic()
    env = client.post('/api/v3/workouts/generate', json=dict(RAW, persist=True)).json()
    assert time.monotonic() - t0 < 5 and env['status'] == 'ok'
    today = env['workout']['today']; wid = env['workout']['workout_id']
    assert today['blurb_pending'] is True and today['bft_job'] and '_bft' not in env
    p = client.get(f'/api/v3/workouts/{wid}/bft').json()
    assert p['status'] == 'writing' and p['text'] == '' and p['job'] == today['bft_job']
    gate_open['go'] = True
    for _ in range(200):
        p = client.get(f'/api/v3/workouts/{wid}/bft').json()
        if p['status'] == 'done': break
        time.sleep(0.02)
    assert p['status'] == 'done' and p['text'] == GOOD and p['pending'] is False
    again = client.get(f'/api/v3/workouts/{wid}').json()['workout']['today']        # reopening shows the saved message
    assert again['blurb'] == GOOD and again['blurb_pending'] is False and again['blurb_meta']['source'] == 'llm'


def test_router_without_the_writer_ships_the_composer_copy_and_never_pends(client):
    env = client.post('/api/v3/workouts/generate', json=dict(RAW, persist=True)).json()
    t = env['workout']['today']
    assert t['blurb'] and not t.get('blurb_pending')
    p = client.get(f"/api/v3/workouts/{env['workout']['workout_id']}/bft").json()
    assert p['status'] == 'fallback' and p['blurb'] == t['blurb']


def test_router_settles_a_stale_job(client, monkeypatch):
    import mood_v3.router as R, datetime as dt
    async def never(meta, publish, timeout=None, source=None):
        await publish('You are amped, so the hip thrust goes heavier.'); await asyncio.sleep(3600)
    monkeypatch.setattr(R.bft_llm, 'enabled', lambda: True)
    monkeypatch.setattr(R.bft_llm, 'stream', never)
    monkeypatch.setattr(R, 'BFT_STALE_S', 0)
    env = client.post('/api/v3/workouts/generate', json=dict(RAW, persist=True)).json()
    time.sleep(0.1)
    p = client.get(f"/api/v3/workouts/{env['workout']['workout_id']}/bft").json()
    assert p['status'] in ('done', 'fallback') and p['pending'] is False


# ---------------------------------------------------------------- launch-freeze QA fixes (Oct 2026)
def test_spelled_out_numbers_are_checked_and_shown_as_digits_from_ten():
    meta = _meta(); B = Brief.from_dict(meta['brief'])
    ev = ' '.join(f['ev'] for f in B.facts)
    assert G.sentence_problems("You're fired up, so the Trap-Bar Deadlift gets three extra sets.", 0, [], B, [B.facts[0]['tag']], [], ev)
    assert any('number not in facts' in p for p in G.sentence_problems("Rest runs one hundred five seconds.", 1, ['x'], B, [], [], ev))
    assert G.normalize('nine instead of thirty-nine, one hundred five seconds') == 'nine instead of 39, 105 seconds'
    assert not [p for p in G.sentence_problems("A 45° Back Extension finisher closes it out.", 1, ['x'], B, [], [], ev) if 'number' in p]


def test_soreness_word_counts_as_acknowledging_soreness():
    env, _ = S.generate_workout(dict(direction='strength', soreness=['lower_back'], archetype='strength_upper_push', duration=60, date=DAYS[0]), 'sore_user')
    B = Brief.from_dict(env['_bft']['brief'])
    s1 = "Lower back soreness means every movement keeps it out of the heavy loading, so the main lift stays clear of it."
    assert not [p for p in G.sentence_problems(s1, 0, [], B, [f['tag'] for f in B.facts], [], ' '.join(f['ev'] for f in B.facts)) if 'reflect' in p]


def test_brief_drops_no_op_pace_changes_and_rpe_numbers():
    for raw in [dict(direction='sweat', states=['amped'], archetype='sweat_engine', equipment='minimal', duration=60),
                dict(direction='sweat', experience='beginner', duration=60), dict(direction='sweat', experience='beginner', equipment='free_weight_limited', duration=60)]:
        for day in DAYS:
            env, _ = S.generate_workout(dict(raw, date=day), 'pace_user')
            for f in Brief.from_dict(env['_bft']['brief']).facts:
                assert 'RPE' not in f['ev'] and not re.search(r'\b0 stations', f['ev'])
                if f['tag'] in ('harder_pace', 'sustainable_pace'): assert f['data']['old'] != f['data']['new'], f['ev']


def test_athletic_strength_goal_names_the_lifts_that_go_heavier():
    env, _ = S.generate_workout(dict(direction='athletic', goal='build_strength', experience='advanced', duration=60, date=DAYS[0]), 'ath_user')
    f = next(f for f in Brief.from_dict(env['_bft']['brief']).facts if f['tag'] == 'goal_strength')
    assert f['data']['names'] and 'explosive work stays light' in f['ev']


def test_claiming_a_current_exercise_was_replaced_is_blocked():
    meta = _meta(); B = Brief.from_dict(meta['brief'])
    lead = B.names[0]
    assert any('still in the session' in p for p in G.text_problems(f"Cable Glute Kickback replaces heavy {lead} work today.", B))
    assert not any('still in the session' in p for p in G.text_problems(f"{lead} leads the session.", B))


@pytest.mark.parametrize('bad', ["Sore lower back means Upper Pull today, so the main row leads heavy while your back stays safe.",
                                 "Fewer landings protect your joints today.", "Your lower back stays protected and the session cuts to three exercises.",
                                 "Today stays Upper Pull to protect it.", "This setup protects you from injury."])
def test_absolute_safety_promises_are_blocked(bad):
    meta = _meta(); B = Brief.from_dict(meta['brief'])
    assert any('absolute safety claim' in p for p in G.text_problems(bad, B))


def test_decision_wording_about_soreness_is_allowed():
    env, _ = S.generate_workout(dict(direction='strength', soreness=['lower_back'], archetype='strength_upper_push', duration=60, date=DAYS[0]), 'sore_user')
    B = Brief.from_dict(env['_bft']['brief'])
    s1 = "Your lower back is sore, so every movement keeps heavy loading away from it and the pressing stays supported."
    assert not [p for p in G.sentence_problems(s1, 0, [], B, [f['tag'] for f in B.facts], [], ' '.join(f['ev'] for f in B.facts)) if 'safety' in p or 'first sentence' in p]
