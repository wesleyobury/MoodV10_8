"""Athletic final cleanup / regression audit (freeze pass). Production path, commercial gym.

    python -m mood_v3.qa.athletic_final_audit OUT.txt

Sections: classification + library audit, Olympic pool, broad grid invariants (levels x 30/60 x goals x States x multi-States x
soreness), accounting truthfulness, duplicate quality metadata, Built for Today claim checks, beginner sanity, State regression vs
the same-seed no-State session, history / repetition over consecutive days, duration.
"""
from __future__ import annotations
import itertools, re, statistics, sys
from collections import Counter, defaultdict
from mood_v3 import service as S
from mood_v3.engines.athletic import athletic_core as C

LEVELS = ['beginner', 'intermediate', 'advanced']
GOALS = ['improve_athleticism', 'build_strength', 'build_muscle', 'lose_weight_conditioning', 'feel_better_reduce_stress', 'stay_consistent']
STATES = [[], ['low_energy'], ['bored'], ['irritated'], ['amped'], ['stressed'], ['low_energy', 'amped'], ['amped', 'stressed'], ['bored', 'stressed'],
          ['irritated', 'low_energy'], ['irritated', 'stressed'], ['bored', 'low_energy'], ['bored', 'amped'], ['irritated', 'amped']]
SORE = [None, ['legs'], ['shoulders'], ['lower_back'], ['chest']]
CARRIES = {'farmer_carry', 'suitcase_carry', 'front_rack_carry', 'overhead_carry'}
OLY_ALL = {i for i, (q, k, m) in C.POWER.items() if k in C.OLY_KINDS}


def items(w): return [it for b in w['blocks'] for it in b['items']]
def df(it): return it['prescription'].get('direction_fields') or {}


def library_audit():
    L = ['== 1. Classification + library audit']
    both = set(C.POWER) & set(C.STRENGTH)
    L.append(f"  ids in both ATHLETIC (POWER) and ATHLETIC_STRENGTH vocabularies: {sorted(both) or 'none'}")
    L.append(f"  carries in the Athletic SUPPORT vocabulary: {sorted(set(C.SUPPORT) & CARRIES) or 'none'} (still in the master library: {sorted(CARRIES & set(C.EX))})")
    L.append(f"  ATHLETIC vocabulary: {len(C.POWER)} exercises; ATHLETIC_STRENGTH: {len(C.STRENGTH)}; SUPPORT: {len(C.SUPPORT)}")
    names = Counter(re.sub(r'[^a-z]', '', e['name'].lower()) for e in C.EX.values())
    L.append(f"  duplicate exercise names in the library: {[n for n, c in names.items() if c > 1] or 'none'}")
    new = [i for i, e in C.EX.items() if e.get('identity_new') or i == 'hang_high_pull']
    d = C.resolve_states([], 'advanced', 60, 'stay_consistent')
    for i in new + ['split_jump']:
        e = C.EX[i]; q, k, m = C.POWER[i]; dz = C.power_dose(i, 'advanced', 'tertiary', d, 60)
        near = [j for j in C.POWER if j != i and C.EX[j]['family'] == e['family']]
        L.append(f"  {e['name']:38} min {m:12} impact {e['impact']:8} cx {e['cx']} tier {C.tier(i, 'tertiary')} dose {dz['sets']}x{dz['reps']}{'/side' if dz['per_side'] else ''}"
                 f" rest {dz['rest']}s swap {e['swap']:18} same-family records: {near or 'none'}")
    return L


def olympic_pool():
    L = ['== 2. Olympic / explosive-lift pool actually in the library (by level eligibility)']
    for lv in LEVELS:
        ctx = dict(preset='athletic_commercial_default', lv=lv, sore=frozenset(), banned=set())
        pool = [C.EX[i]['name'] for q in C.QUALITY_LABEL for i in C.power_pool(ctx, q) if i in OLY_ALL]
        L.append(f"  {lv:12} {pool or 'none'}")
    missing = [n for n in ('hang_clean', 'power_clean', 'push_jerk', 'hang_snatch') if n not in C.EX]
    L.append(f"  not in the library (not programmed): {missing}")
    return L


def grid():
    R = []
    for lv, dur, goal, st, sore in itertools.product(LEVELS, (30, 60), GOALS, STATES, SORE):
        if st and goal not in ('stay_consistent', 'improve_athleticism', 'build_strength'): continue
        if sore and (st or goal != 'stay_consistent'): continue
        for u in range(3):
            raw = dict(direction='athletic', experience=lv, duration=dur, goal=goal, states=st, date='2026-10-12', **({'soreness': sore} if sore else {}))
            env, _ = S.generate_workout(raw, f"fa{u}|{lv}|{dur}|{goal}|{'+'.join(st)}|{sore}")
            R.append((raw, env))
    return R


def invariants(R):
    L = ['== 3. Broad grid invariants (production path)']
    ok = [(r, e) for r, e in R if e['status'] == 'ok']
    conf = Counter(e['conflict']['code'] for r, e in R if e['status'] != 'ok')
    L.append(f"  builds {len(R)}, ok {len(ok)}, conflicts {dict(conf)}")
    bad = defaultdict(list)
    for raw, env in ok:
        w = env['workout']; its = items(w); a = w['athletic']; acc = a['accounting']
        ids = [it['exercise']['id'] for it in its]; cat = [df(it).get('category') for it in its]
        types = [b['type'] for b in w['blocks']]
        seen_strength = False
        for b in w['blocks']:
            for it in b['items']:
                if df(it).get('category') == 'ATHLETIC' and seen_strength and it.get('role') not in ('contrast_power',): bad['power after strength'].append(raw)
                if df(it).get('category') in ('ATHLETIC_STRENGTH', 'SUPPORT') and it.get('role') not in ('contrast_strength',): seen_strength = True
        if set(ids) & CARRIES: bad['carry'].append(raw)
        if any(c == 'ATHLETIC' and i in C.STRENGTH for c, i in zip(cat, ids)): bad['strength mislabelled ATHLETIC'].append(raw)
        if any(df(it).get('impact') == 'high' for it in its) and raw['experience'] != 'advanced': bad['high impact below advanced'].append(raw)
        if acc['tier_a'] > a['limits']['tier_a']: bad['Tier A over limit'].append(raw)
        if acc['ath_cost'] > a['limits']['ath_cost']: bad['athletic cost over budget'].append(raw)
        if acc['sprint_exposures'] != sum(it['prescription']['sets'] for it in its if df(it).get('kind') == 'sprint'): bad['sprint accounting'].append(raw)
        if acc['sled_efforts'] != sum(it['prescription']['sets'] for it in its if df(it).get('kind') == 'sled'): bad['sled accounting'].append(raw)
        qs = [a['primary_quality'], a.get('secondary_quality'), a.get('tertiary_quality')]; qs = [q for q in qs if q]
        if len(qs) != len(set(qs)): bad['duplicate quality metadata'].append(raw)
        titles = [b['title'] for b in w['blocks'] if b['title'].startswith('Secondary Quality')]
        if titles and titles[0].split(' · ')[1].lower() == a['primary_quality_label'].lower(): bad['secondary title repeats primary quality'].append(raw)
        txt = ' '.join(l['text'] for l in w['built_for_today'])
        m = re.search(r'(\d+) sprint efforts', txt)
        if (m and int(m.group(1)) != acc['sprint_exposures']) or (not m and acc['sprint_exposures'] and 'landings' in txt and 'sprint efforts' not in txt and acc['n_explosive'] and False): bad['BFT sprint claim'].append(raw)
        m = re.search(r'(\d+) sled pushes', txt)
        if m and int(m.group(1)) != acc['sled_efforts']: bad['BFT sled claim'].append(raw)
        if 'sprint efforts' in txt and not acc['sprint_exposures']: bad['BFT sprint claim without sprints'].append(raw)
        m = re.search(r'about (\d+) landings', txt, re.I)
        if m and int(m.group(1)) != acc['contacts']: bad['BFT landing claim'].append(raw)
        if re.search(r'(farmer|suitcase|front-rack|overhead|loaded)[ -]carr|\bcarry\b', txt, re.I): bad['BFT carry claim'].append(raw)
        for it in its:
            n = it['exercise']['name']
            if df(it).get('category') == 'ATHLETIC' and n not in txt and False: pass
        if raw['experience'] == 'beginner':
            if set(ids) & OLY_ALL or any(df(it).get('kind') in ('drop', 'elastic', 'muscle_up') for it in its) or any(C.EX[i]['cx'] > 2 for i in ids if i in C.POWER):
                bad['beginner too advanced'].append(raw)
        if raw['duration'] == 30 and len(its) > 3: bad['30 min more than 3 exercises'].append(raw)
        gate = a.get('state_gate', {}); coh = a.get('coherence', {})
        if not all(gate.values()) or not all(coh.values()): bad['State gate / coherence'].append(raw)
    for k in ['power after strength', 'carry', 'strength mislabelled ATHLETIC', 'high impact below advanced', 'Tier A over limit', 'athletic cost over budget',
              'sprint accounting', 'sled accounting', 'duplicate quality metadata', 'secondary title repeats primary quality', 'BFT sprint claim',
              'BFT sprint claim without sprints', 'BFT sled claim', 'BFT landing claim', 'BFT carry claim', 'beginner too advanced', '30 min more than 3 exercises',
              'State gate / coherence']:
        L.append(f"  {k:42} {len(bad[k])}" + (f"   e.g. {bad[k][0]}" if bad[k] else ''))
    same_q = sum(1 for r, e in ok for w in [e['workout']] if len([b for b in w['blocks'] if b['type'] in ('primary', 'secondary')]) >
                 len({(df(b['items'][-1]).get('athletic_quality')) for b in w['blocks'] if b['type'] in ('primary', 'secondary')}))
    L.append(f"  sessions where two athletic exercises share one quality (allowed, labelled honestly): {same_q} of {len(ok)}")
    sore = [(r, e) for r, e in ok if r.get('soreness')]
    for reg in ('legs', 'shoulders', 'lower_back', 'chest'):
        sub = [e['workout'] for r, e in sore if r['soreness'] == [reg]]
        L.append(f"  sore {reg:10} {len(sub)} sessions; athletic movements mean {statistics.mean(sum(df(it).get('category') == 'ATHLETIC' for it in items(w)) for w in sub):.2f}")
    return L, ok


def accounting_examples(ok):
    L = ['== 4. Accounting truthfulness examples (sled vs sprint)']
    n = 0
    for raw, env in ok:
        acc = env['workout']['athletic']['accounting']
        if acc['sled_efforts'] and n < 3:
            n += 1; its = items(env['workout'])
            L.append(f"  {[it['exercise']['name'] for it in its if df(it).get('category') == 'ATHLETIC']}: sprint exposures {acc['sprint_exposures']} ({acc['sprint_m']} m),"
                     f" sled efforts {acc['sled_efforts']} ({acc['sled_m']} m), jump contacts {acc['contacts']} ({acc['high_contacts']} high-impact), throws {acc['throws']},"
                     f" Olympic-derivative sets {acc['olympic_sets']}, explosive sets {acc['explosive_sets']}")
            L.append(f"     Built for Today: {[l['text'] for l in env['workout']['built_for_today'] if 'in all' in l['text']]}")
    return L


def state_regression():
    L = ['== 5. State regression vs the same-seed no-State session (C.generate; 60 min, intermediate + advanced, 3 goals x 12 users)']
    def nctx(lv, goal, st, user):
        return dict(direction='athletic', states=st, duration=60, experience=lv, goal=goal, equipment='athletic_commercial_default', sore=set(), target_mode='moods_pick',
                    target_muscles=(), archetype=None, user=user, date='2026-10-12')
    for st in STATES[1:]:
        dx = defaultdict(list)
        for lv, goal, u in itertools.product(('intermediate', 'advanced'), ('improve_athleticism', 'stay_consistent', 'build_strength'), range(12)):
            o = C.generate(nctx(lv, goal, st, f'sr{u}'), []); r = C.generate(nctx(lv, goal, [], f'sr{u}'), [])
            A, B = o['A'], r['A']
            st_items = [x for b in o['sess']['blocks'] for x in b['items'] if x['cls'] == 'strength']
            st_ref = [x for b in r['sess']['blocks'] for x in b['items'] if x['cls'] == 'strength']
            for k in ('n_athletic', 'explosive_sets', 'contacts', 'intent_load', 'max_cx', 'tier_a', 'strength_sets', 'n_items'):
                dx[k].append(A[k] - B[k])
            dx['rir'].append(min((x['rir'] for x in st_items), default=0) - min((x['rir'] for x in st_ref), default=0))
            dx['nov'].append(statistics.mean(C.EX[x['id']]['nov'] for b in o['sess']['blocks'] for x in b['items']) - statistics.mean(C.EX[x['id']]['nov'] for b in r['sess']['blocks'] for x in b['items']))
            dx['forceful'].append(sum(x['id'] in C.FORCEFUL_SIMPLE for b in o['sess']['blocks'] for x in b['items']) - sum(x['id'] in C.FORCEFUL_SIMPLE for b in r['sess']['blocks'] for x in b['items']))
            dx['changed'].append(len({x['id'] for b in o['sess']['blocks'] for x in b['items']} - {x['id'] for b in r['sess']['blocks'] for x in b['items']}))
        L.append(f"  {'+'.join(st):22} mean change: athletic {statistics.mean(dx['n_athletic']):+.2f}  explosive sets {statistics.mean(dx['explosive_sets']):+.1f}"
                 f"  contacts {statistics.mean(dx['contacts']):+.1f}  intent {statistics.mean(dx['intent_load']):+.1f}  max cx {statistics.mean(dx['max_cx']):+.2f}"
                 f"  Tier A {statistics.mean(dx['tier_a']):+.2f}  strength sets {statistics.mean(dx['strength_sets']):+.1f}  RIR {statistics.mean(dx['rir']):+.2f}"
                 f"  exercises {statistics.mean(dx['n_items']):+.2f}  novelty {statistics.mean(dx['nov']):+.2f}  forceful {statistics.mean(dx['forceful']):+.2f}  changed ids {statistics.mean(dx['changed']):.1f}")
    return L


def history():
    L = ['== 6. History / repetition over 8 consecutive days (C.generate with history; 60 min; 10 users x 3 levels)']
    rep_prim = rep_q = overlap = n = 0
    for lv, u in itertools.product(LEVELS, range(10)):
        hist = []
        for day in range(8):
            o = C.generate(dict(direction='athletic', states=[], duration=60, experience=lv, goal='stay_consistent', equipment='athletic_commercial_default', sore=set(),
                                target_mode='moods_pick', target_muscles=(), archetype=None, user=f'hs{u}', date=f'2026-10-{day + 1:02d}'), hist)
            rec = C.history_record(o)
            if hist:
                n += 1; rep_prim += rec['primary_id'] == hist[0]['primary_id']; rep_q += rec['primary_quality'] == hist[0]['primary_quality']
                overlap += len(set(rec['ids']) & set(hist[0]['ids'])) / max(1, len(rec['ids']))
            hist.insert(0, rec)
    L.append(f"  day-to-day: same primary exercise {rep_prim / n:.0%}, same primary quality {rep_q / n:.0%}, mean exercise overlap with yesterday {overlap / n:.0%}")
    return L


def duration(ok):
    L = ['== 7. Duration (estimated minutes; a window, not a quota)']
    for dur in (60, 30):
        est = [e['workout']['athletic']['accounting']['est'] for r, e in ok if r['duration'] == dur]
        bands = Counter('<40' if x < 40 else '40-50' if x < 50 else '50-57' if x <= 57.5 else '>57' for x in est) if dur == 60 else Counter('<20' if x < 20 else '20-25' if x < 25 else '25-31' for x in est)
        L.append(f"  {dur} min: median {statistics.median(est)}  {dict(sorted(bands.items()))}")
    return L


def main(path):
    L = library_audit() + [''] + olympic_pool() + ['']
    R = grid(); inv, ok = invariants(R); L += inv + [''] + accounting_examples(ok) + [''] + state_regression() + [''] + history() + [''] + duration(ok)
    open(path, 'w').write('\n'.join(L) + '\n')
    return L


if __name__ == '__main__':
    print('\n'.join(main(sys.argv[1])))
