"""Regression: the vendored production engines reproduce every frozen Direction QA result exactly.
Runs the frozen QA harnesses (import-path edits only) against mood_v3.engines and compares with the frozen result files.
Any difference is a launch blocker."""
import json, os, subprocess, sys, tempfile, pytest
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.abspath(os.path.join(HERE, '..', '..'))
FROZEN = os.path.join(HERE, 'frozen')

def _run(module, out, *args):
    env = dict(os.environ, HARNESS_OUT=out, PYTHONPATH=BACKEND + os.pathsep + os.environ.get('PYTHONPATH', ''))
    r = subprocess.run([sys.executable, '-m', module, *args], cwd=BACKEND, env=env, capture_output=True, text=True, timeout=900)
    assert r.returncode == 0, r.stderr[-4000:]
    return r.stdout

@pytest.mark.slow
def test_strength_frozen_qa_identical():
    out = tempfile.mkdtemp()
    _run('mood_v3.tests.harness.strength_run_qa', out)
    got = json.load(open(os.path.join(out, 'strength_qa_results.json')))
    frozen = json.load(open(os.path.join(FROZEN, 'MOOD_V3_Strength_QA_Results_v6.json')))
    assert got['tier1']['archetype_pass'] == 237 and got['tier1']['ct_pass'] == 78 and got['tier1']['reference_match'] == 237
    assert got == frozen

@pytest.mark.slow
def test_sweat_frozen_qa_identical():
    out = tempfile.mkdtemp()
    _run('mood_v3.tests.harness.sweat_run_qa', out, out)
    got = json.load(open(os.path.join(out, 'MOOD_V3_Sweat_QA_Results_FINAL.json')))
    assert got == json.load(open(os.path.join(FROZEN, 'MOOD_V3_Sweat_QA_Results_FINAL.json')))
    fx = json.load(open(os.path.join(out, 'MOOD_V3_Sweat_QA_Fixtures_FINAL.json')))
    assert fx == json.load(open(os.path.join(FROZEN, 'MOOD_V3_Sweat_QA_Fixtures_FINAL.json')))

@pytest.mark.slow
def test_athletic_frozen_qa_identical():
    out = tempfile.mkdtemp()
    _run('mood_v3.tests.harness.athletic_gen_qa_full', out)
    got = json.load(open(os.path.join(out, 'athletic_qa.json')))
    frozen = json.load(open(os.path.join(FROZEN, 'MOOD_V3_Athletic_Generator_QA_v1.json')))
    got['grid'].pop('seconds'); frozen['grid'].pop('seconds')
    assert got == frozen and got['all_green'] and got['grid_hash'] == 'a874e39cf0a8b6e5'

@pytest.mark.slow
def test_athletic_frozen_validator_negative_tests():
    txt = _run('mood_v3.engines.athletic.sk5', tempfile.mkdtemp())
    lines = [l for l in txt.splitlines() if l.startswith('N') and 'expect' in l]
    assert lines and all(l.split()[5] == 'OK' for l in lines), [l for l in lines if l.split()[5] != 'OK']
