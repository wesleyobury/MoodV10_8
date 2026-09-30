"""Strength core personalization sample (pre-freeze pass) -> JSON. Usage: python -m mood_v3.qa.strength_core_sample [out.json]"""
import sys, json, itertools, collections
OUT = sys.argv[1] if len(sys.argv) > 1 else "strength_core_sample.json"
try:
    from .. import service
except ImportError:
    sys.path.insert(0, '.'); from mood_v3 import service
SEEDS=[('u%d'%i,'2026-10-%02d'%(10+i)) for i in range(1,6)]
GOALS=['build_muscle','build_strength','improve_athleticism','stay_consistent','feel_better_reduce_stress','lose_weight_conditioning']
SINGLE=[[],['low_energy'],['stressed'],['bored'],['irritated'],['amped']]
PAIRS=[['amped','stressed'],['bored','low_energy'],['irritated','stressed'],['amped','bored'],['low_energy','amped'],['bored','stressed'],['irritated','low_energy']]
ARCH=['strength_upper_push','strength_upper_pull','strength_upper_mixed','strength_arms','strength_lower_squat','strength_lower_hinge','strength_glutes_legs','strength_full_body','strength_core']
rows=[]
def rec(raw,env,st,tag,extra=None):
    r=dict(tag=tag,raw={k:v for k,v in raw.items() if k[0]!='_'},status=env['status'])
    if env['status']!='ok': r['conflict']=env['conflict']['code']; rows.append(r); return r
    w=env['workout']; h=st['history_record']
    r.update(archetype=w['archetype']['id'],est=w['duration']['estimated_minutes'],variant=h.get('variant'),expressions=h.get('expressions'),finisher=h.get('finisher'),device=h.get('device'),methods=h.get('methods'),
             structures=[b['structure'] for b in w['blocks']],
             items=[dict(block=b['block_id'],structure=b['structure'],type=b['type'],ex=it['exercise']['id'],name=it['exercise']['name'],sets=it['prescription'].get('sets'),reps=it['prescription'].get('reps'),
                         display=it['prescription'].get('display'),rest=it['prescription'].get('rest_sec'),rir=it['prescription'].get('rir'),kind=it['prescription']['kind'],load=it['prescription'].get('load_guidance'),
                         cls=(it['prescription'].get('direction_fields') or {}).get('slot_class'),method=(it['prescription'].get('direction_fields') or {}).get('set_method')) for b in w['blocks'] for it in b['items']],
             bft=[(l['code'],l['text']) for l in w['built_for_today']],
             gate=[a for a in w.get('adjustments',[]) if a.get('reason_code') in ('state_gate','state_gate_fallback','state_gate_exhausted','state_gate_yielded')],
             expectation=w.get('session_expectation'), bft_all=[(l['code'],l['text']) for l in w['built_for_today']],
             personalization=st.get('personalization') or [], why_claims=next((l.get('claims') for l in w['built_for_today'] if l.get('claims')),None),
             decisions=[a for a in w.get('adjustments',[]) if str(a.get('reason_code','')).startswith(('state_','variant','structure_selected','finisher','device','duration','top_set','set_method','core_focus','compound_redundancy','archetype_narrowed'))])
    if extra: r.update(extra)
    rows.append(r); return r
def base(user,date,states,dur,exp,**kw):
    d=dict(direction='strength',states=states,duration=dur,experience=exp,goal=kw.pop('goal','build_muscle'),equipment='commercial_gym',date=date,_user=user); d.update(kw); return d
def run(raw,tag,hist=(),extra=None):
    env,st=service.generate_workout(raw,raw['_user'],list(hist),[])
    if st is not None:
        st=dict(st); st['personalization']=st.get('personalization'); 
    return rec(raw,env,st,tag,extra),st
# patch service to expose personalization/claims in state: read from envelope adjustments instead -> we stash via res in _generate; simplest: monkeypatch _finish
import mood_v3.service as S
_orig_finish=S._finish
def _finish(ctx,res,history_records,perf_history,workout_id,version,source=None):
    env=_orig_finish(ctx,res,history_records,perf_history,workout_id,version,source)
    env['_personalization']=res.get('personalization'); env['_why_claims']=res.get('_why_claims'); env['_state_gate']=res.get('state_gate'); return env
S._finish=_finish
def run(raw,tag,hist=(),extra=None):
    env,st=service.generate_workout(raw,raw['_user'],list(hist),[])
    if st is not None: st=dict(st,personalization=env.get('_personalization'),why_claims=env.get('_why_claims'),state_gate=env.get('_state_gate'))
    r=rec(raw,env,st,tag,extra)
    if env['status']=='ok': r['state_gate']=env.get('_state_gate')
    return r,st
# A: archetype grid, goal varies with the seed
for i,((u,dt),a,states,dur,exp) in enumerate(itertools.product(SEEDS,ARCH,SINGLE+PAIRS,(30,60),('beginner','intermediate','advanced'))):
    run(base(u,dt,states,dur,exp,archetype=a,goal=GOALS[SEEDS.index((u,dt))%len(GOALS)]),'arch')
# G: goal grid (no State), all goals x levels x 4 archetypes x 5 seeds
for (u,dt),a,g,exp in itertools.product(SEEDS,['strength_upper_push','strength_lower_squat','strength_upper_pull','strength_glutes_legs'],GOALS,('beginner','intermediate','advanced')):
    run(base(u,dt,[],60,exp,archetype=a,goal=g),'goal')
# B: targets
for (u,dt),t,states,dur in itertools.product(SEEDS[:3],[['chest'],['back'],['glutes'],['biceps'],['shoulders'],['quads'],['back','core'],['chest','shoulders','triceps'],['quads','hamstrings']],SINGLE,(30,60)):
    run(base(u,dt,states,dur,'intermediate',target=t),'target')
# C: soreness incl. explicit Target + sore region
for (u,dt),a,sore,states in itertools.product(SEEDS[:2],ARCH[:8],['legs','shoulders','chest','lower_back'],[[],['amped'],['irritated']]):
    run(base(u,dt,states,60,'intermediate',archetype=a,soreness=[sore]),'sore')
for (u,dt),t,sore in itertools.product(SEEDS[:2],[['chest','triceps'],['chest'],['back','biceps'],['quads','glutes']],['shoulders','lower_back','legs']):
    run(base(u,dt,[],60,'intermediate',target=t,soreness=[sore]),'sore_target')
# D: sequential history
for u,pattern,arch in (('h1',[[]]*10,None),('h2',[['amped']]*8,'strength_upper_push'),('h3',[['irritated']]*8,'strength_upper_push'),('h4',[['low_energy']]*8,'strength_upper_push'),('h5',[['bored']]*8,'strength_lower_squat'),('h6',[['stressed']]*8,'strength_upper_push'),('h7',[[],['amped'],['bored'],[],['low_energy'],['irritated'],[],['stressed'],['amped'],[]],None)):
    hist=[]
    for i,s in enumerate(pattern):
        r,st=run(base(u,'2026-11-%02d'%(1+2*i),s,60,'intermediate',archetype=arch),'seq',hist,dict(seq_user=u,seq_i=i))
        if st: hist.append(dict(st['history_record'],completed_at='x'))
json.dump(rows,open(OUT,'w'))
print('rows',len(rows),collections.Counter(r['status'] for r in rows), collections.Counter(r['tag'] for r in rows))
