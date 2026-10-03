"""Founder pass (Oct 2026): Target workouts get a personal Built for Today line (history with the area, then profile goal,
then a plain 'why this area' only when MOOD knows neither). Context only: never a claim that the generator changed anything."""
from mood_v3 import service, explain

BASE = dict(duration=60, experience='intermediate', equipment='commercial_gym', states=[], soreness=[], date='2026-10-02', training_frequency='3-4')
LOWER = ['quads', 'hamstrings', 'glutes']


def H(archetype, day):
    return dict(direction='strength', archetype=archetype, exercise_ids=[], completed_at=f'2026-{day}T15:00:00')


def target_line(hist=(), **kw):
    req = dict(BASE, direction='strength', **kw)
    env, _ = service.generate_workout(req, 'u1', list(hist), [])
    w = env['workout']
    for l in w['built_for_today']: assert not explain.lint(l['text']), l
    line = next(l for l in w['built_for_today'] if l['code'] == 'target')
    assert w['today']['teaser']['text'] == line['text']
    return line['text']


def test_three_muscles_read_as_each():
    t = target_line(target=LOWER, goal='build_muscle')
    assert 'so each gets direct work' in t and 'both' not in t.split('.')[0]


def test_goal_ties_to_output():
    assert "For your goal to build muscle, that's" in target_line(target=LOWER, goal='build_muscle')
    assert 'For your goal to build strength, it leads with' in target_line(target=LOWER, goal='build_strength')


def test_history_days_since_area():
    assert 'Your last leg day was 4 days ago' in target_line([H('strength_glutes_legs', '09-28'), H('strength_upper_push', '09-30')], target=LOWER, goal='build_strength')
    assert 'You trained legs yesterday too' in target_line([H('strength_lower_squat', '10-01')], target=LOWER, goal='build_strength')
    t = target_line([H('strength_glutes_legs', '09-20'), H('strength_upper_push', '09-27'), H('strength_upper_pull', '09-29'), H('strength_upper_mixed', '10-01')], target=LOWER)
    assert 'this balances your week' in t


def test_first_area_day_with_history():
    assert 'Your first leg day in MOOD.' in target_line([H('strength_upper_push', '09-30')], target=LOWER, goal='build_muscle')


def test_at_most_two_personal_sentences():
    t = target_line([H('strength_glutes_legs', '09-28')], target=LOWER, goal='build_strength')
    assert t.count('.') <= 4   # base + history + goal (exercise display may hold no periods)
