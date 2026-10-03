"""Before/after comparison: python3 -m ... <root containing mood_v3> (run once against a pre-pass snapshot, once against this tree)."""
import sys, itertools, collections
root=sys.argv[1]; sys.path.insert(0, root)
import importlib
from mood_v3 import service as S
from mood_v3.engines.athletic import athletic_core as C
sys.path.pop(0)
LOADED = {'olympic', 'explosive_lift', 'loaded_jump', 'speed_strength', 'swing', 'landmine_rot'}
LU = {'db_push_press', 'landmine_push_press', 'landmine_split_jerk', 'push_press'}
def major(i):
    k=C.kind_of(i); return bool(k) and (k in LOADED or i in LU) and C.EX[i]['eq'] not in ('bodyweight','bands') and i!='landmine_rotational_punch'
SPK={'sprint','sled','jump','lateral','bound','elastic','hop','combo','drop','uni_jump'}
res=collections.defaultdict(list)
for arch, lv, day, g in itertools.product(('athletic_power','athletic_speed_agility','athletic_full_body'), ('intermediate','advanced'), ['2026-10-%02d'%d for d in range(5,12)], ('improve_athleticism','build_strength','stay_consistent')):
    env,_=S.generate_workout(dict(direction='athletic',equipment='commercial_gym',goal=g,experience=lv,duration=60,archetype=arch,date=day),f'c{day}{g}')
    w=env['workout']; ids=[it['exercise']['id'] for b in w['blocks'] for it in b['items'] if it['exercise']['id'] in C.POWER and b['type']!='strength']
    ids=[i for i in ids if not (i in C.STRENGTH)]
    ks=[C.kind_of(i) for i in ids]
    res[arch].append(dict(major=any(major(i) for i in ids), splo=sum(k in SPK for k in ks)>=2, throw=any(k in C.THROW_KINDS for k in ks),
        lower=any(C.q_of(i) in C.LOWER_Q and C.kind_of(i) not in C.THROW_KINDS for i in ids), upper=any(C.q_of(i) in C.UPPER_Q or C.kind_of(i) in C.THROW_KINDS|{'upper','muscle_up'} for i in ids),
        superset=any(b['type']=='strength' and b['structure']=='superset' for b in w['blocks'])))
for a,v in res.items():
    n=len(v); f=lambda k: f"{100*sum(x[k] for x in v)/n:.0f}%"
    print(root.split('/')[-1], a, n, 'major', f('major'), 'speedplyo2', f('splo'), 'throw', f('throw'), 'lower+upper+major', f"{100*sum(x['lower'] and x['upper'] and x['major'] for x in v)/n:.0f}%", 'superset', f('superset'))
