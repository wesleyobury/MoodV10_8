import os
HARNESS_OUT=os.environ.get('HARNESS_OUT','/tmp')
import sys, json, copy

from mood_v3.engines.strength.qa_engine import *
from mood_v3.engines.strength.prescription import *
from mood_v3.engines.strength.structure import *
FX=json.load(open(os.path.join(os.path.dirname(__file__),'..','frozen','MOOD_V3_Strength_QA_Fixtures_v7.json')))
SORE={'shoulders':expand('shoulders'),'lower back (spinal_erectors)':{'spinal_erectors'},'back (lats+erectors)':expand('back'),'hamstrings':{'hamstrings'},'glutes':{'glutes'},'chest':{'chest'},'biceps':{'biceps'},'quads':{'quads'}}
def sc_from(name):
    s=sc_base()
    if name.startswith('S3'): s['state']='low_energy'
    elif name.startswith('S4'): s['state']='stressed'
    elif name.startswith('S5'): s['state']='bored'
    elif name.startswith('S6'): s['state']='irritated'
    elif name.startswith('S7'): s['state']='amped'
    elif name.startswith('S8'): s['exp']='beginner'
    elif name.startswith('S9a'): s['equip']=NOBAR
    elif name.startswith('S9b'): s['equip']=FREEONLY
    elif name.startswith('S10'): s['sore']=SORE[name[len('S10 Sore '):]]
    elif name.startswith('S11'):   # fixtures v7: Beginner + constrained State
        s['exp']='beginner'; s['state']={'Low Energy':'low_energy','Stressed':'stressed','Irritated':'irritated'}[name.split('+ ')[1].split(' /')[0].strip()]
    return s
MODE={"MOOD's Pick":'pick','Explicit Target':'explicit','either':'pick'}
OUT={}

# ================= TIER 1: fixture replay
t1=[]; fails_by_check=Counter(); fails=[]
for f in FX['archetype_scenarios']:
    sc=sc_from(f['scenario']); aid=f['archetype']; ctx=ctx_for(aid)
    p=generate(aid,sc,f['duration'],ctx,MODE[f['mode']])
    checks=validate(p,aid,sc,f['duration'],ctx,f['expected_outcome'])
    bad=[c for c in checks if not c[1]]
    # expected log entries
    if f['expected_log'] and 'upper_class_fallback' in f['expected_log']:
        ok=any('upper_class_fallback' in str(l.get('detail','')) for l in p['log']); bad+=[] if ok else [('expected_fallback_log',False,f['expected_log'])]
    ref=f['reference_composition']; same=(' | '.join(f"{k}: {EX[e]['name']}" for k,e in p['workout'].items())==ref)
    t1.append(dict(id=f['id'],scenario=f['scenario'],mode=f['mode'],archetype=aid,duration=f['duration'],outcome=p['outcome'],expected=f['expected_outcome'],passed=not bad,failed_checks=[(c[0],c[2]) for c in bad],matches_reference=same,workout=p['workout'],log=p['log']))
    for c in bad: fails_by_check[c[0]]+=1
    if bad: fails.append(t1[-1])
# Custom Target
ct=[]
CTSC={'Normal/Int':sc_base(),'Low Energy':dict(sc_base(),state='low_energy'),'Beginner':dict(sc_base(),exp='beginner'),'No barbell':dict(sc_base(),equip=NOBAR),'Bored':dict(sc_base(),state='bored')}
for f in FX['custom_target_cases']:
    sc=CTSC[f['scenario']]; order,blocks,widths,fl,multi=compose_custom(f['targets'],sc,f['duration'])
    oc='ACTUAL GENERATOR FAILURE' if fl else 'VALID BUILD'
    ex=[e for m in order for e in blocks[m]]; ids=[e['id'] for e in ex]
    bad=[]
    if oc!=f['expected_outcome']: bad.append(('outcome_class',oc))
    if len(set(ids))!=len(ids): bad.append(('no_duplicate_exercise_id',''))
    cap=max(1,min(5,CAP[sc['exp']]+STATE_CAP.get(sc.get('state'),0)))
    for e in ex:
        if RANK[e['skill']]>RANK[sc['exp']]: bad.append(('skill_le_experience',e['id']))
        if e['cx']>cap: bad.append(('complexity_le_cap',e['id']))
        if e['eq'] not in sc['equip'] or any(q not in sc['equip'] for q in e['req']): bad.append(('equipment_available',e['id']))
    for m in f['targets']:
        if blocks[m] and not all(roll(e['prim'][0])==m for e in blocks[m]): bad.append(('block_target_honesty',m))
        if len(f['targets'])>1:
            sw=Counter(e['swap'] for e in blocks[m])
            if any(v>1 for v in sw.values()): bad.append(('multi_muscle_swap_family_distinct',m))
    ct.append(dict(id=f['id'],targets=f['targets'],scenario=f['scenario'],duration=f['duration'],outcome=oc,expected=f['expected_outcome'],passed=not bad,failed_checks=bad,blocks={m:[e['id'] for e in blocks[m]] for m in order}))
    for c in bad: fails_by_check['CT:'+c[0]]+=1
OUT['tier1']=dict(archetype_cases=len(t1),archetype_pass=sum(r['passed'] for r in t1),ct_cases=len(ct),ct_pass=sum(r['passed'] for r in ct),fails_by_check=dict(fails_by_check),
    reference_match=sum(r['matches_reference'] for r in t1),outcomes=dict(Counter(r['outcome'] for r in t1)),failures=[dict(id=r['id'],scenario=r['scenario'],mode=r['mode'],archetype=r['archetype'],duration=r['duration'],failed=r['failed_checks']) for r in fails]+[dict(id=r['id'],targets=r['targets'],scenario=r['scenario'],failed=r['failed_checks']) for r in ct if not r['passed']])
json.dump(dict(archetype=t1,custom=ct),open(os.path.join(HARNESS_OUT,'strength_tier1_detail.json'),'w'),indent=0)

# ================= TIER 2A: reproducibility (20+ fixtures x 5 runs, identical inputs/history/seed/swap)
rep=[]; pick=[f for f in FX['archetype_scenarios'] if f['scenario'].startswith(('S1 ','S2 ','S3','S5','S8','S9a','S10 Sore shoulders','S10 Sore glutes'))]
for f in pick:
    sc=sc_from(f['scenario']); sc['history']=[{'archetype':f['archetype'],'exercises':[],'slots':{}}]; sc['swap']=1; sc['user']='u1'; sc['date']='2026-09-22'
    outs={json.dumps(generate(f['archetype'],sc,f['duration'],ctx_for(f['archetype']),MODE[f['mode']]),sort_keys=True) for _ in range(5)}
    rep.append(dict(id=f['id'],archetype=f['archetype'],scenario=f['scenario'],identical=len(outs)==1))
OUT['tier2a']=dict(fixtures=len(rep),identical=sum(r['identical'] for r in rep))

# ================= TIER 2B: swap variation
def meaningful(a,b):
    """a,b exercise ids. Trivial = same swap family and same movement family and same laterality (equipment/angle variation only)."""
    if a==b: return 'same'
    A,B=EX[a],EX[b]
    if A['swap']==B['swap'] and A['mfam']==B['mfam'] and A['lat']==B['lat'] and not profile_distinct(A,B): return 'trivial'   # v15: a profile-distinct change inside a one-family muscle (all curls) is a real change
    return 'meaningful'
def same_tier(aid,slot,sc,sel,ctx,chosen):
    """Candidates in a different swap family that sit in the same programming tier (verdict, State predicate, Target coverage) as the chosen exercise.
    Only these are alternatives a swap or recency is allowed to reach: the tiers above are frozen programming constraints."""
    T=ctx.get('target') or set()
    def tier(e,v): return (VR[v],pred_score(e,sc,sel,aid,slot),(2 if e['pm0'] in T else (1 if e['prims']&T else 0)) if T else 0)
    c=candidates(aid,slot,sc,sel,ctx); ch=[x for x in c if x[0]['id']==chosen]
    if not ch: return [],len(c)
    t=tier(ch[0][0],ch[0][1])
    return [x[0]['id'] for x in c if tier(x[0],x[1])==t and x[0]['swap']!=EX[chosen]['swap']],len(c)
def pool_has_alternatives(aid,slot,sc,sel,ctx,chosen):
    alts,n=same_tier(aid,slot,sc,sel,ctx,chosen); return bool(alts),n
swap_rows=[]
CTX2B=[('Normal / 60',sc_base(),60),('Normal / 30',sc_base(),30),('Low Energy / 60',dict(sc_base(),state='low_energy'),60),('Beginner / 60',dict(sc_base(),exp='beginner'),60),('Bored / 60',dict(sc_base(),state='bored'),60)]
for aid in ARCH[:-1]:
    for label,base,dur in CTX2B:
        comps=[];
        for k in range(4):
            sc=dict(base); sc['swap']=k; sc['user']='u1'; sc['date']='2026-09-22'
            p=generate(aid,sc,dur,ctx_for(aid),'pick'); v=validate(p,aid,sc,dur,ctx_for(aid),'VALID BUILD')
            comps.append((p['workout'],[c for c in v if not c[1] and c[0]!='outcome_class']))
        base_w=comps[0][0]; distinct=len({json.dumps(c[0],sort_keys=True) for c in comps})
        changed=set(); kinds=Counter(); viol=any(c[1] for c in comps)
        for w,_ in comps[1:]:
            for s in w:
                if w[s]!=base_w.get(s): changed.add(s); kinds[meaningful(base_w.get(s,w[s]),w[s])]+=1
        # alternatives available in pool for the base composition
        sc0=dict(base); sc0['swap']=0; sc0['user']='u1'; sc0['date']='2026-09-22'
        keys=list(base_w.keys())
        alts={s:pool_has_alternatives(aid,s,sc0,{k:EX[base_w[k]] for k in keys[:keys.index(s)]},ctx_for(aid),base_w[s]) for s in base_w}
        slots_with_alts=[s for s,(has,n) in alts.items() if has]
        prot=[s for s in base_w if (aid,s) in PROTECTED]; prot_stable=all(all(w.get(s)==base_w[s] for s in prot) for w,_ in comps[1:])
        nonprot_alts=[s for s in slots_with_alts if (aid,s) not in PROTECTED]
        if viol: cls='CONSTRAINT VIOLATION'
        elif distinct>=3 and kinds['meaningful']>=2: cls='HEALTHY VARIATION'
        elif distinct>=2 and kinds['meaningful']>=1: cls='LIMITED BUT DEFENSIBLE'
        elif not nonprot_alts: cls='LIMITED BUT DEFENSIBLE'
        else: cls='FUNCTIONALLY IDENTICAL'
        swap_rows.append(dict(archetype=aid,context=label,duration=dur,protected_primary_stable=prot_stable,protected_slots=prot,distinct_compositions=distinct,slots_changed=sorted(changed),change_kinds=dict(kinds),slots_with_meaningful_alternatives=slots_with_alts,pool_widths={s:n for s,(h,n) in alts.items()},classification=cls,
            compositions=[' | '.join(f"{s}: {EX[e]['name']}" for s,e in w.items()) for w,_ in comps]))
OUT['tier2b']=swap_rows

# ================= TIER 2C: history / recency (6 consecutive sessions, same inputs)
hist_rows=[]
for aid in ARCH[:-1]:
    sc=sc_base(); sc['user']='u1'; sc['history']=[]; seq=[]; plog={}
    for n in range(6):
        sc['date']=f'2026-10-{1+n*2:02d}'; sc['swap']=0
        p=generate(aid,sc,60,ctx_for(aid),'pick'); w=p['workout']; seq.append(w)
        for l in p['log']:
            if l.get('reason_code')=='protected_primary_changed': plog[l['slot']]=l['reason']
        sc['history'].append({'archetype':aid,'exercises':list(w.values()),'slots':dict(w)})   # completed session recorded exactly as production would
    slots=list(seq[0].keys()); per={}
    for s in slots:
        ids=[w.get(s) for w in seq]; distinct=len({i for i in ids if i}); fams=len({EX[i]['swap'] for i in ids if i})
        # alternatives with equal top rank (verdict, State, Target, bias) in the base pool: could recency have rotated this slot?
        sc0=dict(sc); sc0['history']=[]; keys=list(seq[0].keys()); sel0={k:EX[seq[0][k]] for k in keys[:keys.index(s)]}   # slots filled before this one, priority order
        c=candidates(aid,s,sc0,sel0,ctx_for(aid))
        T=ctx_for(aid).get('target') or set()
        def top(t):
            e,v,b=t; tc=(2 if e['pm0'] in T else (1 if e['prims']&T else 0)) if T else 0
            return (-VR[v],-pred_score(e,sc0,sel0,aid,s),-tc,-b)
        best=min(top(t) for t in c) if c else None; ties=[t[0]['id'] for t in c if top(t)==best]
        other_fams=len({EX[x]['swap'] for x in [t[0]['id'] for t in c]})
        tier_alts,_=same_tier(aid,s,sc0,sel0,ctx_for(aid),seq[0][s]) if seq[0].get(s) else ([],0)
        protected=(aid,s) in PROTECTED
        if protected:
            if distinct==1: cl='GOOD REPETITION (protected primary: progression continuity)'
            else:
                reasons=[l for w_ in seq for l in []]
                cl='BAD ROTATION (protected primary changed without a logged reason)' if not plog.get(s) else f"GOOD ROTATION (protected primary changed for a logged reason: {plog[s]})"
        else:
            if distinct>1 and fams>1: cl='GOOD ROTATION (recency rotated across families)'
            elif distinct>1: cl='GOOD ROTATION (recency rotated within a single-family pool)'
            elif tier_alts: cl='BAD REPETITION (same-tier alternatives in other families never surfaced)'
            elif other_fams>1: cl='GOOD REPETITION (alternatives exist only in a lower programming tier: verdict / State / Target)'
            else: cl='GOOD REPETITION (constrained pool: no alternative family)'
        per[s]=dict(same_tier_alternatives=len(tier_alts),sequence=[EX[i]['name'] if i else '' for i in ids],distinct=distinct,swap_families=fams,equal_rank_ties=len(ties),pool_swap_families=other_fams,protected=protected,classification=cl)
    hist_rows.append(dict(archetype=aid,slots=per))
OUT['tier2c']=hist_rows

# ================= TIER 3: soreness
t3=[]
for f in FX['archetype_scenarios']:
    if not f['scenario'].startswith('S10'): continue
    sc=sc_from(f['scenario']); aid=f['archetype']; p=generate(aid,sc,60,ctx_for(aid),MODE[f['mode']])
    lg=[l for l in p['log'] if l.get('reason_code') in ('sore_reroute','sore_terminal_conflict')]
    ok=p['outcome']==f['expected_outcome']
    if p['outcome']=='VALID ADAPTIVE REROUTE': ok=ok and bool(lg) and all(k in lg[0] for k in ('from','to','muscles')) and f['mode']=="MOOD's Pick"
    if p['outcome']=='VALID TERMINAL CONFLICT': ok=ok and bool(lg) and lg[0]['options']==['Change Target','MOOD Alternative','Cancel Edit'] and not p['workout'] and f['mode']=='Explicit Target'
    if f['mode']=='Explicit Target' and p['outcome']=='VALID ADAPTIVE REROUTE': ok=False
    # sore primary check on any built workout
    ov=set().union(*[set(l.get('muscles',[])) for l in p['log'] if l.get('reason_code')=='sore_override_by_explicit_target']) if p['log'] else set()
    if p['workout'] and any(set(EX[e]['prim'])&(sc['sore']-ov) for e in p['workout'].values()): ok=False
    if ov and f['mode']!='Explicit Target': ok=False
    rr=[l for l in p['log'] if l.get('reason_code')=='reroute_ranking']
    if p['outcome']=='VALID ADAPTIVE REROUTE':
        ok=ok and bool(rr) and all(('distance' in c) or c.get('rejected') for c in rr[0]['candidates'])   # RR1-RR3: every candidate scored or rejected with a reason
        viable=[c for c in rr[0]['candidates'] if c.get('viable')]
        if viable and min(v['distance'] for v in viable)!=[v for v in viable if v['candidate']==p['archetype']][0]['distance']: ok=False
    t3.append(dict(id=f['id'],scenario=f['scenario'],mode=f['mode'],archetype=aid,outcome=p['outcome'],expected=f['expected_outcome'],correct=ok,log=lg[:1],to=p['archetype'] if p['outcome']=='VALID ADAPTIVE REROUTE' else '',ranking=rr[0]['candidates'] if rr else []))
OUT['tier3']=dict(cases=len(t3),correct=sum(r['correct'] for r in t3),outcomes=dict(Counter(r['outcome'] for r in t3)),rows=t3)
# ================= TIER 4 (v15): structure validity, compatibility, reproducibility, State utilisation diagnostics
t4=[]; util=defaultdict(Counter); util_arch=defaultdict(Counter); fails4=Counter(); minutes=defaultdict(list)
def run_structure(aid,sc,dur,mode):
    p=generate(aid,sc,dur,ctx_for(aid),mode)
    if not p['workout']: return None
    a=p['archetype']; W=p['workout']; st=sc.get('state'); seed=f"{sc.get('user','qa_user')}|{sc.get('date','2026-09-22')}"
    fin_planned=(st=='amped' and dur==60 and burnout_candidate(a,W,sc,ctx_for(a),seed) is not None)
    rows,ev=prescribe(a,W,dur,st,p['log'],finisher_planned=fin_planned)
    blocks,slog,fin=build_blocks(a,rows,sc,dur,ctx_for(a),W,seed)
    return p,rows,ev,blocks,slog
for f in FX['archetype_scenarios']:
    sc=sc_from(f['scenario']); sc['user']='u1'; sc['date']='2026-09-22'; aid=f['archetype']; dur=f['duration']
    r=run_structure(aid,sc,dur,MODE[f['mode']])
    if not r: continue
    p,rows,ev,blocks,slog=r; a=p['archetype']; st=sc.get('state') or 'normal'
    checks=validate_blocks(a,blocks,rows,sc,dur); bad=[c for c in checks if not c[1]]
    # reproducibility of the structure layer
    r2=run_structure(aid,sc,dur,MODE[f['mode']]); same=json.dumps(r2[3],sort_keys=True,default=str)==json.dumps(blocks,sort_keys=True,default=str)
    if not same: bad.append(('structure_reproducible',False,''))
    for c in bad: fails4[c[0]]+=1
    key=f"{st} / {dur}"; util[key][slog[0]['emitted']]+=1; util_arch[(a,st,dur)][slog[0]['emitted']]+=1; minutes[key].append(est_minutes_blocks(blocks,dur))
    t4.append(dict(id=f['id'],scenario=f['scenario'],archetype=a,duration=dur,state=st,pattern=slog[0]['pattern'],emitted=slog[0]['emitted'],blocks=[(b['structure_id'],[it['exercise_id'] for it in b['items']],b['rounds']) for b in blocks],est_minutes=est_minutes_blocks(blocks,dur),passed=not bad,failed=[(c[0],c[2]) for c in bad],structure_log=slog))
OUT['tier4']=dict(cases=len(t4),passed=sum(r['passed'] for r in t4),fails_by_check=dict(fails4),
    utilisation_by_state={k:dict(v) for k,v in util.items()},utilisation_by_archetype={f"{a} / {st} / {d}":dict(v) for (a,st,d),v in util_arch.items()},
    est_minutes_by_state={k:dict(min=min(v),max=max(v),mean=round(sum(v)/len(v),1)) for k,v in minutes.items()},rows=t4)
# structure utilisation grid: every archetype x State x duration x experience (not quotas; a diagnostic of what the policy actually emits)
grid=[]; gsum=defaultdict(Counter); fin_by=defaultdict(Counter); fallbacks=Counter()
for aid in ARCH[:-1]:
    for st in (None,'low_energy','stressed','bored','irritated','amped'):
        for dur in (60,30):
            for exp in ('beginner','intermediate','advanced'):
                sc=sc_base(); sc['state']=st; sc['exp']=exp; sc['user']='u1'; sc['date']='2026-09-22'
                r=run_structure(aid,sc,dur,'pick')
                if not r: grid.append(dict(archetype=aid,state=st or 'normal',duration=dur,experience=exp,built=False)); continue
                p,rows,ev,blocks,slog=r; em=slog[0]['emitted']; ids=[b['structure_id'] for b in blocks]
                fb=[l for l in slog if l['reason_code'] in ('structure_fallback','structure_adjusted')]
                for l in fb: fallbacks[(st,exp,l['detail'][:60])]+=1
                fin=[b['items'][0]['exercise_id'] for b in blocks if b['structure_id']=='finisher']
                gsum[(st or 'normal',dur)][em]+=1
                if st in ('amped','irritated') and dur==60: fin_by[(st,exp)][fin[0] if fin else 'none']+=1
                bad=[c for c in validate_blocks(p['archetype'],blocks,rows,sc,dur) if not c[1]]
                grid.append(dict(archetype=p['archetype'],requested=aid,state=st or 'normal',duration=dur,experience=exp,built=True,pattern=slog[0]['pattern'],emitted=em,n_blocks=len(blocks),structures=ids,finisher=fin[0] if fin else '',est_minutes=est_minutes_blocks(blocks,dur),working_sets=est_sets(p['archetype'],p['workout'],dur),valid=not bad,failed=[(c[0],c[2]) for c in bad],fallbacks=[l['detail'] for l in fb]))
OUT['tier4']['grid']=grid
OUT['tier4']['grid_summary']={f"{k[0]} / {k[1]}":dict(v) for k,v in sorted(gsum.items(),key=lambda x:(str(x[0][0]),x[0][1]))}
OUT['tier4']['finisher_by_state_experience']={f"{k[0]} / {k[1]}":dict(v) for k,v in fin_by.items()}
OUT['tier4']['fallbacks']=[dict(state=k[0],experience=k[1],detail=k[2],n=v) for k,v in fallbacks.items()]
OUT['tier4']['grid_valid']=sum(1 for g in grid if g.get('built') and g['valid']); OUT['tier4']['grid_built']=sum(1 for g in grid if g.get('built'))
json.dump(OUT,open(os.path.join(HARNESS_OUT,'strength_qa_results.json'),'w'),indent=1,default=str)
print('GRID',OUT['tier4']['grid_valid'],'/',OUT['tier4']['grid_built'],'of',len(grid)); 
for k,v in OUT['tier4']['grid_summary'].items(): print('  ',k,v)
for k,v in OUT['tier4']['finisher_by_state_experience'].items(): print('  fin',k,v)
for f in OUT['tier4']['fallbacks']: print('  fb',f)
print('T4',OUT['tier4']['passed'],'/',OUT['tier4']['cases'],OUT['tier4']['fails_by_check'])
for k,v in sorted(OUT['tier4']['utilisation_by_state'].items()): print('  ',k,dict(v))
print('T1',OUT['tier1']['archetype_pass'],'/',OUT['tier1']['archetype_cases'],'CT',OUT['tier1']['ct_pass'],'/',OUT['tier1']['ct_cases'],OUT['tier1']['fails_by_check'],'refmatch',OUT['tier1']['reference_match'])
print('T2A',OUT['tier2a'])
print('T2B',Counter(r['classification'] for r in swap_rows))
print('T3',OUT['tier3']['cases'],OUT['tier3']['correct'],OUT['tier3']['outcomes'])
