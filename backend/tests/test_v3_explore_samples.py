"""Explore sample sessions (backend/v3_explore.py): deterministic, varied, never mechanical. No database needed.
Run: python -m pytest tests/test_v3_explore_samples.py -q"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import v3_explore as m

T0 = 1791000000.0


def test_deterministic_for_a_clock():
    assert m.sample_sessions(T0) == m.sample_sessions(T0)


def test_sessions_progress_instead_of_reshuffling():
    a = {s['id'] for s in m.sample_sessions(T0)}
    b = {s['id'] for s in m.sample_sessions(T0 + 60)}
    # a minute later most sessions are the same ones, a little further along
    assert not a or len(a & b) >= len(a) - 2


def test_all_in_progress_and_unique_names():
    for k in range(0, 48):
        t = T0 + k * 1800
        ss = m.sample_sessions(t)
        assert all(s['started'] <= t < s['started'] + s['est_minutes'] * 60 + 60 for s in ss)
        names = [s['name'] for s in ss]
        assert len(names) == len(set(names))


def test_variety_over_a_day():
    seen = [s for k in range(0, 96) for s in m.sample_sessions(T0 + k * 900)]
    counts = [len(m.sample_sessions(T0 + k * 900)) for k in range(0, 96)]
    assert len({s['direction'] for s in seen}) == 3
    assert len({s['focus'] for s in seen}) >= 8
    assert len({s['planned_minutes'] for s in seen}) == 2
    assert max(counts) - min(counts) >= 3          # busy and quiet periods
    starts = sorted({round(s['started']) for s in seen})
    gaps = {b - a for a, b in zip(starts, starts[1:])}
    assert len(gaps) > 10                            # no fixed cadence


def test_mode_env(monkeypatch):
    monkeypatch.setenv('EXPLORE_SYNTHETIC', 'OFF')
    assert m.synthetic_mode() == 'off'
    monkeypatch.setenv('EXPLORE_SYNTHETIC', 'nonsense')
    assert m.synthetic_mode() == 'labeled'
    monkeypatch.delenv('EXPLORE_SYNTHETIC')
    assert m.synthetic_mode() == 'labeled'
