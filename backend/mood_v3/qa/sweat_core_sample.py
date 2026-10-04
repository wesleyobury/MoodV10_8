"""Sweat rebuild production-path QA sample -> JSON. Run from backend/: python3 mood_v3/qa/sweat_core_sample.py mood_v3/qa/results/sweat_core_sample.json"""
import sys, json, itertools, collections
sys.path.insert(0, '.')
from mood_v3 import service
import mood_v3.service as S
OUT = sys.argv[1]
SEEDS=[('u%d'%i,'2026-10-%02d'%(10+i)) for i in range(1,6)]
GOALS=['lose_weight_conditioning','improve_athleticism','build_muscle','build_strength','feel_better_reduce_stress','stay_consistent']
SINGLE=[[],['low_energy'],['stressed'],['bored'],['irritated'],['amped']]
PAIRS=[['low_energy','amped'],['amped','stressed'],['bored','stressed'],['irritated','low_energy'],['irritated','stressed'],['bored','low_energy'],['amped','bored']]
ARCH=['sweat_engine','sweat_circuit','sweat_hybrid']
rows=[]
_of=S._finish
def _finish(ctx,res,history_records,perf_history,workout_id,version,source=None):
    env=_of(ctx,res,history_records,perf_history,workout_id,version,source)
    from mood_v3 import sweat_why as WY
    env['_personalization']=res.get('personalization'); env['_budget']=res.get('budget'); env['_coherence']=res.get('coherence'); env['_gate']=res.get('state_gate')
    env['_shape']=res.get('variant'); env['_expr']=res.get('expressions'); env['_completeness']=res.get('completeness')
    try: env['_trainer']=WY.trainer_notes(ctx,res)
    except Exception as ex: env['_trainer']=[repr(ex)]
    return env
S._finish=_finish
def rec(raw,env,st,tag,extra=None):
    r=dict(tag=tag,raw={k:v for k,v in raw.items() if k[0]!='_'},status=env['status'])
    if env['status']!='ok': r['conflict']=env['conflict']['code']; r['detail']=str(env['conflict'].get('detail'))[:200]; rows.append(r); return r
    w=env['workout']
    r.update(archetype=w['archetype']['id'],est=w['duration']['estimated_minutes'],shape=env.get('_shape'),expr=env.get('_expr'),budget=env.get('_budget'),coherence=env.get('_coherence'),gate=env.get('_gate'),completeness=env.get('_completeness'),warmup=w.get('warmup',{}).get('minutes'),cooldown=w.get('cooldown',{}).get('minutes'),
             blocks=[dict(structure=b['structure'],title=b.get('title'),rounds=b.get('rounds'),rest=b.get('rest_between_rounds_sec'),interval=b.get('interval'),est=b.get('est_minutes'),rpe=(b.get('effort') or {}).get('rpe'),instructions=b.get('instructions'),
                         items=[dict(name=it['exercise']['name'],id=it['exercise']['id'],display=it['prescription']['display'],load=it['prescription'].get('load_guidance'),role=(it['prescription'].get('direction_fields') or {}).get('role')) for it in b['items']]) for b in w['blocks']],
             bft=[(l['code'],l['text']) for l in w['built_for_today']], why_claims=next((l.get('claims') for l in w['built_for_today'] if l.get('claims')),None),
             personalization=env.get('_personalization') or [], trainer=env.get('_trainer') or [],
             decisions=[a for a in w.get('adjustments',[]) if str(a.get('reason_code','')).startswith(('state_','shape_','archetype_','budget_','duration_','finisher','sore_','target_','hybrid_','primary_','complement_','closer_'))])
    if extra: r.update(extra)
    rows.append(r); return r
def base(user,date,states,dur,exp,**kw):
    d=dict(direction='sweat',states=states,duration=dur,experience=exp,goal=kw.pop('goal','lose_weight_conditioning'),equipment='commercial_gym',date=date,_user=user); d.update(kw); return d
def run(raw,tag,hist=(),extra=None):
    env,st=service.generate_workout(raw,raw['_user'],list(hist),[])
    return rec(raw,env,st,tag,extra),st,env
# A: archetype grid
for (u,dt),a,states,dur,exp in itertools.product(SEEDS,ARCH,SINGLE+PAIRS,(30,60),('beginner','intermediate','advanced')):
    run(base(u,dt,states,dur,exp,archetype=a,goal=GOALS[SEEDS.index((u,dt))%len(GOALS)]),'arch')
# P: MOOD's Pick
for (u,dt),states,dur,exp in itertools.product(SEEDS,SINGLE,(30,60),('beginner','intermediate','advanced')):
    run(base(u,dt,states,dur,exp,goal=GOALS[SEEDS.index((u,dt))%len(GOALS)]),'pick')
# G: goal grid
for (u,dt),a,g,exp in itertools.product(SEEDS[:3],ARCH,GOALS,('intermediate','advanced')):
    run(base(u,dt,[],60,exp,archetype=a,goal=g),'goal')
# T: targets
for (u,dt),t,states,dur in itertools.product(SEEDS[:3],[['chest'],['quads','glutes'],['back','biceps'],['shoulders'],['core'],['chest','shoulders','triceps']],SINGLE,(30,60)):
    run(base(u,dt,states,dur,'intermediate',target=t),'target')
# S: soreness
for (u,dt),a,sore,states in itertools.product(SEEDS[:2],ARCH+[None],['legs','shoulders','lower_back','chest'],[[],['irritated'],['low_energy']]):
    kw=dict(soreness=[sore]); 
    if a: kw['archetype']=a
    run(base(u,dt,states,60,'intermediate',**kw),'sore')
# E: equipment presets
for (u,dt),a,eq,exp,states in itertools.product(SEEDS[:2],ARCH+[None],['minimal','free_weight_limited','commercial_gym'],('beginner','advanced'),[[],['bored'],['low_energy']]):
    kw={}; 
    if a: kw['archetype']=a
    run(base(u,dt,states,60,exp,equipment=eq,**kw),'equip')
# H: sequential users (history)
for u,pattern,arch,exp in (('h1',[[]]*8,None,'intermediate'),('h2',[['bored']]*6,'sweat_hybrid','advanced'),('h3',[['amped']]*6,'sweat_engine','intermediate'),('h4',[['stressed']]*6,'sweat_circuit','beginner'),('h5',[[],['low_energy'],['bored'],[],['irritated'],['amped'],['stressed'],[]],None,'intermediate')):
    hist=[]
    for i,s in enumerate(pattern):
        r,st,env=run(base(u,'2026-11-%02d'%(1+2*i),s,60,exp,archetype=arch),'seq',hist,dict(seq_user=u,seq_i=i))
        if st: hist.append(dict(st['history_record'],completed_at='x'))
# D: Different Workout + Swap Exercise chains
for (u,dt),a,states in itertools.product(SEEDS[:2],ARCH+[None],[[],['bored']]):
    kw={}
    if a: kw['archetype']=a
    raw=base(u,dt,states,60,'intermediate',**kw)
    r,st,env=run(raw,'dw0')
    if st:
        try:
            e2,s2=service.swap_workout(st,env); rec(raw,e2,s2,'dw1',dict(prev=[b['items'] for b in r['blocks']]))
            e3,s3=service.swap_workout(s2,e2); rec(raw,e3,s3,'dw2')
        except Exception as ex: rows.append(dict(tag='dw_err',raw={k:v for k,v in raw.items() if k[0]!='_'},status='error',detail=repr(ex)))
        try:
            it=env['workout']['blocks'][0]['items'][-1]
            e4,s4=service.swap_exercise(st,env,it['item_id']); rec(raw,e4,s4,'swap',dict(swapped_from=it['exercise']['id']))
        except Exception as ex: rows.append(dict(tag='swap_err',raw={k:v for k,v in raw.items() if k[0]!='_'},status='error',detail=repr(ex)))
json.dump(rows,open(OUT,'w'))
print('rows',len(rows),collections.Counter(r['status'] for r in rows), collections.Counter(r['tag'] for r in rows))
