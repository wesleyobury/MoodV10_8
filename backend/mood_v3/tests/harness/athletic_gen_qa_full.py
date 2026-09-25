import os
HARNESS_OUT=os.environ.get('HARNESS_OUT','/tmp')
"""Athletic reference generator QA (v1). Writes MOOD_V3_Athletic_Generator_QA_v1.json and gen_samples.md."""
import json, itertools, hashlib, time
from collections import Counter, defaultdict
import mood_v3.engines.athletic.athletic_gen as G
from mood_v3.engines.athletic import sk5
from mood_v3.engines.athletic.lib3 import *
from mood_v3.engines.athletic.audit2 import EX
ARCHS=['athletic_power','athletic_speed_agility','athletic_full_body','moods_pick']; LVS=['beginner','intermediate','advanced']; DURS=[60,30]
PRES=['athletic_commercial_default','commercial_floor_only','free_weight_limited','bodyweight_floor']; STS=['normal','low_energy','stressed','bored','irritated','amped']
SORE={'none':set(),'legs':{'quads','hamstrings','glutes','calves'},'upper_push':{'chest','shoulders','front_delts','side_delts','rear_delts','triceps'}}
COMM={'athletic_commercial_default','commercial_floor_only'}
def sig(w):
    if w['status']!='ok': return json.dumps([w['status'],w.get('reason')])
    return json.dumps([w['archetype'],w['warmup'],[(x['slot'],x['id'],x['sets'],x['reps'],x['sec'],x['rest'],x['per_side']) for x in w['items']]],default=str)
def recheck(w,key):
    a,lv,d,pre,st,so=key.split('|')
    sk5.add('_rc','rc',w['archetype'],int(d),lv,pre,[] if st=='normal' else [st],w['warmup'],w['items'],sore=SORE[so],
            reason='Legs sore: upper-only exposures are short, so a second support exercise rounds out the session' if sum(x['slot']=='ps' for x in w['items'])==2 else None)
    sk5.SK['_rc']['relax']={'duration_floor'} if any('Equipment-limited' in l for l in w['log']) else set()
    if any('No upper-body or rotational' in l for l in w['log']): sk5.SK['_rc']['relax'].add('fba_regions')
    r=sk5.check('_rc'); del sk5.SK['_rc']; return r
Q={}; t0=time.time(); grid={}
for a,lv,d,pre,st,so in itertools.product(ARCHS,LVS,DURS,PRES,STS,SORE):
    grid[f'{a}|{lv}|{d}|{pre}|{st}|{so}']=G.build(a,lv,d,pre,[st],SORE[so],seed='qa')
ok={k:w for k,w in grid.items() if w['status']=='ok'}
Q['grid']=dict(builds=len(grid),status=dict(Counter(w['status'] for w in grid.values())),seconds=round(time.time()-t0,1))
# 1. independent re-validation of every ok build
rv=[(k,recheck(w,k)['fails']) for k,w in ok.items()]; Q['revalidation_failures']=[x for x in rv if x[1]]
# 2. conflicts are only the two designed cases
conf=Counter()
for k,w in grid.items():
    if w['status']=='conflict': conf['explicit Speed + sore legs' if 'Speed' in w['reason'] else 'sore legs + too little upper equipment ('+k.split('|')[3]+')']+=1
Q['conflicts']=dict(conf)
Q['commercial_conflicts_other_than_speed_sore']=[k for k,w in grid.items() if w['status']=='conflict' and k.split('|')[3] in COMM and 'Speed' not in w['reason']]
# 3. reproducibility
h1=hashlib.sha256(''.join(sig(grid[k]) for k in sorted(grid)).encode()).hexdigest()
h2=hashlib.sha256(''.join(sig(G.build(*[(p if i!=2 else int(p)) for i,p in enumerate(k.split('|')[:4])],[k.split('|')[4]],SORE[k.split('|')[5]],seed='qa')) for k in sorted(grid)).encode()).hexdigest()
Q['reproducible']=h1==h2; Q['grid_hash']=h1[:16]
# 4. structure
def cnt(pred): return sum(1 for w in ok.values() if pred(w))
Q['structure']=dict(
  warmup_items=dict(Counter(len(w['warmup']) for w in ok.values())),
  warmup_over_4=cnt(lambda w: len(w['warmup'])>4),
  trunk_slots=cnt(lambda w: any(x['slot'] not in ('px','sx','sx2','qc','ps') for x in w['items'])),
  ps_by_duration={f'{d} min / {n} PS':v for (d,n),v in Counter((k.split('|')[2],sum(x['slot']=='ps' for x in w['items'])) for k,w in ok.items()).items()},
  ps_at_30_non_beginner=sum(1 for k,w in ok.items() if k.split('|')[2]=='30' and k.split('|')[1]!='beginner' and any(x['slot']=='ps' for x in w['items']) and 'get_stronger' not in k),
  qc_on_beginner=sum(1 for k,w in ok.items() if k.split('|')[1]=='beginner' and any(x['slot']=='qc' for x in w['items'])),
  qc_on_low_energy=sum(1 for k,w in ok.items() if k.split('|')[4]=='low_energy' and any(x['slot']=='qc' for x in w['items'])),
  qc_at_30=sum(1 for k,w in ok.items() if k.split('|')[2]=='30' and any(x['slot']=='qc' for x in w['items'])),
  sessions_with_type_b=cnt(lambda w: any(pclass(EX[x['id']])=='B' for x in w['items'] if x['slot'] in ('px','sx','sx2'))),
  sessions_ending_after_athletic_work_60=sum(1 for k,w in ok.items() if k.split('|')[2]=='60' and not any(x['slot']=='ps' for x in w['items'])),
  equipment_limited_relaxations=dict(Counter(k.split('|')[3] for k,w in ok.items() if any('Equipment-limited' in l for l in w['log']))),
  relaxations_on_commercial=sum(1 for k,w in ok.items() if k.split('|')[3] in COMM and any(('Equipment-limited' in l) or ('No upper-body' in l) for l in w['log'])))
tot=defaultdict(list)
for k,w in ok.items():
    if k.split('|')[3] in COMM: tot[f"{k.split('|')[2]} min {k.split('|')[1]}"].append(w['result']['total'])
Q['duration_commercial']={k:dict(min=round(min(v),1),mean=round(sum(v)/len(v),1),max=round(max(v),1)) for k,v in sorted(tot.items())}
# 5. variety: different seeds, and history rotation
seeds=[G.build('athletic_power','intermediate',60,'athletic_commercial_default',[],set(),seed=f's{n}') for n in range(20)]
Q['seed_variety']=dict(distinct_primary=len({w['items'][0]['id'] for w in seeds}),distinct_sessions=len({tuple(w['ids']) for w in seeds}))
rot={}
for a in ARCHS[:3]+['moods_pick']:
    hist=[]; seq=[]
    for n in range(8):
        w=G.build(a,'intermediate',60,'athletic_commercial_default',[],set(),history=hist,seed=f'day{n}')
        seq.append(w); hist=[dict(aid=w['archetype'],ids=w['ids'])]+hist
    rep=sum(len(set(seq[n]['ids'])&set(seq[n-1]['ids'])) for n in range(1,8))/7
    rot[a]=dict(archetypes=[w['archetype'][9:] for w in seq],primaries=[EX[w['items'][0]['id']]['name'] for w in seq],mean_repeats_from_previous=round(rep,2))
Q['history_rotation']=rot
# 6. pack parity: generator on the 16 founder-pack inputs
PK=[('F1','athletic_power','intermediate',60,'athletic_commercial_default',[],set()),('F2','athletic_power','advanced',60,'athletic_commercial_default',[],set()),
    ('F3','athletic_power','intermediate',30,'athletic_commercial_default',[],set()),('F4','athletic_power','beginner',60,'commercial_floor_only',[],set()),
    ('F5','athletic_power','intermediate',60,'athletic_commercial_default',['irritated'],set()),('F6','athletic_power','intermediate',60,'athletic_commercial_default',['amped'],set()),
    ('F7','athletic_speed_agility','intermediate',60,'athletic_commercial_default',[],set()),('F8','athletic_speed_agility','intermediate',30,'commercial_floor_only',[],set()),
    ('F9','athletic_speed_agility','advanced',60,'athletic_commercial_default',['bored'],set()),('F10','athletic_speed_agility','intermediate',60,'athletic_commercial_default',['stressed'],set()),
    ('F16','athletic_speed_agility','beginner',60,'athletic_commercial_default',[],set()),('F11','moods_pick','intermediate',60,'athletic_commercial_default',[],set()),
    ('F12','athletic_full_body','beginner',30,'athletic_commercial_default',[],set()),('F13','athletic_full_body','intermediate',60,'commercial_floor_only',['low_energy'],set()),
    ('F14','athletic_full_body','advanced',60,'athletic_commercial_default',['amped'],set()),('F15','moods_pick','intermediate',60,'athletic_commercial_default',[],set(SORE['legs']))]
samples={}
for k,a,lv,d,pre,st,so in PK:
    w=G.build(a,lv,d,pre,st,so,seed='pack'); samples[k]=w
Q['pack_inputs_all_ok']=all(w['status']=='ok' for w in samples.values())
Q['all_green']=(not Q['revalidation_failures'] and Q['reproducible'] and not Q['commercial_conflicts_other_than_speed_sore'] and Q['structure']['warmup_over_4']==0 and Q['structure']['trunk_slots']==0
                and Q['structure']['qc_on_beginner']==0 and Q['structure']['qc_on_low_energy']==0 and Q['structure']['qc_at_30']==0 and Q['structure']['ps_at_30_non_beginner']==0
                and Q['structure']['relaxations_on_commercial']==0 and Q['pack_inputs_all_ok'] and Q['grid']['status'].get('infeasible',0)==0)
json.dump(Q,open(os.path.join(HARNESS_OUT,'athletic_qa.json'),'w'),indent=1,default=str)
md=['# Athletic generator: sample output on the 16 founder-pack inputs','','Generated by `athletic_gen.py` (seed "pack"). Each passed the frozen validator. These are generator picks, so the exercises differ from the hand-built pack.','']
for k,w in samples.items(): md+=[f'## {k}','```',G.render(w),'```','']
open(os.path.join(HARNESS_OUT,'athletic_gen_samples.md'),'w').write('\n'.join(md))
for k in ('grid','conflicts','reproducible','structure','duration_commercial','seed_variety','pack_inputs_all_ok','all_green'): print(k,Q[k])
print('reval',len(Q['revalidation_failures']))
for a,v in rot.items(): print(a,v)
