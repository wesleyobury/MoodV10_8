"""MOOD V3 Sweat automated QA (Tiers 0-4, per the Pass 1 QA plan). Writes qa_results.json and fixtures."""
import json, sys, copy, os
from collections import Counter, defaultdict
from mood_v3.engines.sweat.sweat_gen import *
from mood_v3.engines.sweat.sweat_validate import validate
from mood_v3.tests.harness.sweat_render import render

HERE=os.path.dirname(os.path.abspath(__file__))
OUT=sys.argv[1] if len(sys.argv)>1 else HERE
R=dict(tiers={})

def hard_fails(w): return [(n,dd) for n,ok,dd in validate(w) if not ok and not n.startswith('SOFT')]
def soft_fails(w): return [(n,dd) for n,ok,dd in validate(w) if not ok and n.startswith('SOFT')]
def sig(w):
    return json.dumps(dict(a=w['archetype_id'],o=w['outcome'],b=[dict(s=b['slot'],st=b['structure'],i=[e['id'] for e in b['items_e']],r=b.get('rounds'),
        it=b.get('interval_target'),rs=[[x[0]['id'] for x in r] for r in b.get('round_stations',[])],rpe=b['rpe'],dur=b.get('duration_s'),m=b.get('minutes'),l=b.get('ladder')) for b in w['blocks']]),sort_keys=True,default=str)

# ---------------- Tier 0: data
VOCAB=dict(
 muscles={'chest','back','shoulders','front_delts','side_delts','rear_delts','biceps','triceps','forearms','core','quads','hamstrings','glutes','calves','hip_adductors','hip_abductors','spinal_erectors'},
 pattern={'squat','hinge','horizontal_push','vertical_push','horizontal_pull','vertical_pull','lunge','carry','locomotion','rotation','anti_rotation','flexion','anti_extension','jump','sprint','throw','cyclical','mixed','isolation'},
 modality={'resistance','bodyweight','cardio_machine','running','jump','throw','sled','rope','mixed'},
 equipment=ALL_EQUIP|{'other'},
 station={'rack','bench','cable_station','selectorized_machine','plate_loaded_machine','smith_station','floor_mat','pullup_bar','landmine_station','turf','cardio_machine','box_station','med_ball_wall','open_space','outdoor','dip_station'},
 space={'standard_gym','floor_space','lane','outdoor','track','stairs','turf'},
 metric={'reps','time','distance','calories','rounds','pace'},impact={'low','moderate','high'},skill={'beginner','intermediate','advanced'},
 support={'supported','semi_supported','unsupported'},lat={'bilateral','unilateral','alternating'},cls={'compound','isolation','integrated'})
SLOTS={('sweat_engine','primary_engine_block'),('sweat_engine','complementary_block'),('sweat_engine','optional_extra'),('sweat_circuit','primary_circuit'),
       ('sweat_circuit','complementary_block'),('sweat_circuit','optional_extra'),('sweat_hybrid','primary_hybrid_block.anchor'),('sweat_hybrid','primary_hybrid_block.station'),
       ('sweat_hybrid','complementary_block'),('sweat_hybrid','optional_extra')}
t0=[]
for e in EX.values():
    if not e['new']: continue
    for f,v in [('muscles',set(e['prim']+e['sec'])),('pattern',{e['pat']}),('modality',{e['mod']}),('equipment',{e['eq']}),('station',{e['station']}),('space',{e['space']}),
                ('metric',{e['metric']}),('impact',{e['impact']}),('skill',{e['skill']}),('support',{e['sup']}),('lat',{e['lat']}),('cls',{e['cls']})]:
        if not v<=VOCAB[f]: t0.append(('vocab',e['id'],f,sorted(v-VOCAB[f])))
    if not (1<=e['cx']<=5 and 1<=e['nov']<=5 and 1<=e['sysd']<=5): t0.append(('scale',e['id']))
    if e['combo'] and not e['comps']: t0.append(('combo_components',e['id']))
for r in ELIG:
    if r[0] not in EX: t0.append(('elig_exercise',r[0]))
    if (r[1],r[2]) not in SLOTS: t0.append(('elig_slot',r[1],r[2]))
    if r[3] not in ('preferred','allowed','conditional'): t0.append(('elig_verdict',r))
    for alt in (r[4].split(' OR ') if r[4] else []):
        if alt.strip() not in ('experience != beginner','experience = beginner','state_id = low_energy','target_count >= 1'): t0.append(('K13_grammar',r))
    if EX[r[0]]['sweat_class'] not in ('A','B','NEW'): t0.append(('elig_class',r[0]))
jr=[r for r in ELIG if r[0]=='jump_rope']
if not any(r[2]=='primary_engine_block' and r[4]=='experience != beginner' for r in jr): t0.append(('jump_rope_engine_condition','missing'))
if not any(r[2]=='primary_circuit' and r[4]=='' for r in jr): t0.append(('jump_rope_circuit_beginner','missing'))
R['tiers']['T0_data']=dict(checks=len(EX)+len(ELIG),errors=t0,passed=not t0)

# ---------------- Tier 1a: diagnostic grids
COND=[[],['low_energy'],['stressed'],['bored'],['irritated'],['amped'],['sore']]
PRES=['sweat_commercial_default','commercial_no_sled','free_weight_limited','db_bodyweight_only']
SORE_DEF=['quads','hamstrings','glutes']
grid=[]; hard=Counter(); soft=Counter(); outc=Counter(); failures=[]; allw=[]
def run_case(inp,tag):
    w=generate(inp); hf=hard_fails(w); sf=soft_fails(w)
    outc[(tag,w['outcome'])]+=1
    for n,_ in hf: hard[n]+=1
    for n,_ in sf: soft[n]+=1
    if hf or w['outcome']=='ACTUAL GENERATOR FAILURE': failures.append(dict(tag=tag,inp=inp,outcome=w['outcome'],fails=hf))
    allw.append((tag,inp,w)); return w
for pre in PRES:
    for c in COND:
        for dur in (30,60):
            for lv in ('beginner','intermediate','advanced'):
                base=dict(duration=dur,experience=lv,states=c,preset=pre,date=f'2026-10-{1+len(grid)%28:02d}',user=f'grid{len(grid)%7}')
                if c==['sore']: base['sore']=SORE_DEF
                for a in ARCHS:
                    run_case(dict(base,force_archetype=a),'grid_forced'); grid.append(1)
                run_case(dict(base),'grid_pick'); grid.append(1)
R['tiers']['T1a_grid']=dict(builds=len(grid),outcomes={f'{k[0]}|{k[1]}':v for k,v in sorted(outc.items())},hard_fail_counts=dict(hard),soft_counts=dict(soft),
    actual_generator_failures=sum(v for k,v in outc.items() if k[1]=='ACTUAL GENERATOR FAILURE'),failures=failures[:50])

# ---------------- Tier 1b: named fixtures
H_CIRC=[dict(archetype='sweat_circuit',primary_structure='circuit',comp_type='couplet_emom')]
H_ENG_ROW=[dict(archetype='sweat_engine',engine_mode='interval',engine_format='long_even',exercises=['row_erg'],families=['row_erg'])]
FX=[
 ('W01','Engine canonical',dict(force_archetype='sweat_engine',duration=60,experience='intermediate',history=H_CIRC)),
 ('W02','Circuit canonical',dict(duration=60,experience='intermediate')),
 ('W03','Hybrid canonical (sled default)',dict(duration=60,experience='intermediate',goal='build_strength')),
 ('W03b','Hybrid, user has no sled',dict(duration=60,experience='intermediate',goal='build_strength',preset='commercial_no_sled')),
 ('W04','Engine beginner 30',dict(force_archetype='sweat_engine',duration=30,experience='beginner',goal='stay_consistent')),
 ('W05','Explicit upper Target 30',dict(duration=30,experience='intermediate',target=['chest','back','shoulders'])),
 ('W06','Hybrid 30',dict(duration=30,experience='intermediate',goal='build_strength')),
 ('W07','Low Energy 60',dict(duration=60,experience='intermediate',states=['low_energy'])),
 ('W08','Stressed 60 (Engine steady)',dict(duration=60,experience='intermediate',states=['stressed'],history=H_CIRC)),
 ('W08b','Stressed 60 after a steady Engine session',dict(duration=60,experience='intermediate',states=['stressed'],history=[dict(archetype='sweat_engine',engine_mode='steady',engine_format='aerobic',exercises=['row_erg'],families=['row_erg']),dict(archetype='sweat_circuit',primary_structure='circuit')])),
 ('W09','Bored advanced 60',dict(force_archetype='sweat_circuit',duration=60,experience='advanced',states=['bored'],history=H_CIRC+H_ENG_ROW)),
 ('W10','Irritated Hybrid 60 (sled default)',dict(force_archetype='sweat_hybrid',duration=60,experience='intermediate',states=['irritated'])),
 ('W11','Amped Engine 60 advanced',dict(force_archetype='sweat_engine',duration=60,experience='advanced',states=['amped'],goal='build_strength')),
 ('W12','Amped Circuit 30',dict(duration=30,experience='intermediate',states=['amped'])),
 ('W13','Sore legs, MOOD\'s Pick',dict(duration=60,experience='intermediate',sore=SORE_DEF)),
 ('W13b','Sore legs, Engine forced (SkiErg legal: not dependent)',dict(force_archetype='sweat_engine',duration=60,experience='intermediate',sore=SORE_DEF)),
 ('W14','Beginner limited equipment 30',dict(duration=30,experience='beginner',preset='db_bodyweight_only',goal='stay_consistent')),
 ('W15','Lower Target + Irritated + Low Energy',dict(duration=60,experience='intermediate',states=['irritated','low_energy'],target=['quads','glutes'])),
 ('W16','Engine Bored 30',dict(force_archetype='sweat_engine',duration=30,experience='intermediate',states=['bored'],history=[dict(archetype='sweat_engine',engine_mode='interval',engine_format='long_even',exercises=['row_erg'],families=['row_erg']),dict(archetype='sweat_engine',engine_mode='steady',engine_format='aerobic',exercises=['stationary_bike'],families=['bike'])])),
 ('M1','Bored + Stressed',dict(duration=60,experience='intermediate',states=['bored','stressed'])),
 ('M2','Low Energy + Amped',dict(duration=60,experience='intermediate',states=['low_energy','amped'])),
 ('M3','Irritated + Low Energy (pick)',dict(duration=60,experience='intermediate',states=['irritated','low_energy'])),
 ('M4','Sore shoulders + Amped',dict(duration=60,experience='intermediate',states=['amped'],sore=['shoulders'])),
 ('M5','Stressed + Irritated',dict(duration=60,experience='intermediate',states=['stressed','irritated'])),
 ('M6','Bored + Amped 60',dict(duration=60,experience='intermediate',states=['bored','amped'])),
 ('M7','Bored + Amped 30',dict(duration=30,experience='intermediate',states=['bored','amped'])),
 ('M8','Low Energy + Stressed + Bored',dict(duration=60,experience='intermediate',states=['low_energy','stressed','bored'])),
 ('T1','Target core',dict(duration=60,experience='intermediate',target=['core'])),
 ('T2','Target biceps (secondary coverage)',dict(duration=30,experience='intermediate',target=['biceps'])),
 ('T3','Target calves',dict(duration=30,experience='intermediate',target=['calves'])),
 ('T4','Target chest + quads',dict(duration=60,experience='intermediate',target=['chest','quads'])),
 ('T5','Target full_body',dict(duration=60,experience='intermediate',target='full_body')),
 ('T6','Target quads, sore quads (S2a override)',dict(duration=60,experience='intermediate',target=['quads'],sore=['quads'])),
 ('T7','Target chest, sore shoulders (S2b substitution)',dict(duration=60,experience='intermediate',target=['chest'],sore=['shoulders'])),
 ('T8','Target beginner lower',dict(duration=30,experience='beginner',target=['glutes'])),
 ('S1','Sore chest+shoulders+triceps, pick',dict(duration=60,experience='intermediate',sore=['chest','shoulders','triceps'])),
 ('S2','Sore back, pick',dict(duration=60,experience='intermediate',sore=['back'])),
 ('S3','Sore legs, Hybrid forced (dependent -> terminal)',dict(force_archetype='sweat_hybrid',duration=60,experience='intermediate',sore=SORE_DEF)),
 ('S4','Sore legs + back + shoulders, pick',dict(duration=60,experience='intermediate',sore=SORE_DEF+['back','shoulders'])),
 ('S5','Sore legs, explicit upper Target',dict(duration=60,experience='intermediate',target=['back','biceps'],sore=SORE_DEF)),
 ('S6','Sore legs + back, explicit lower Target (named muscles override)',dict(duration=60,experience='intermediate',target=['quads','glutes','hamstrings'],sore=SORE_DEF+['back'])),
]
fxp=os.path.join(OUT,'MOOD_V3_Sweat_QA_Fixtures_FINAL.json')
prev=json.load(open(fxp)) if os.path.exists(fxp) else None
fx_out=[]; t1b=[]
for fid,name,inp in FX:
    inp=dict(inp); inp.setdefault('date','2026-10-01'); inp.setdefault('user','fx_'+fid)
    w=generate(inp); hf=hard_fails(w)
    ref=sig(w)
    match=None
    if prev:
        p=[x for x in prev['fixtures'] if x['id']==fid]
        match=bool(p) and p[0]['reference_signature']==ref
    fx_out.append(dict(id=fid,name=name,inputs=inp,expected_outcome=w['outcome'],reference_signature=ref))
    t1b.append(dict(id=fid,name=name,outcome=w['outcome'],archetype=w['archetype_id'],engine_mode=w.get('engine_mode'),hard_fails=hf,soft=soft_fails(w),matches_reference=match))
    allw.append(('fixture',inp,w))
json.dump(dict(version='FINAL',generator='MOOD_V3_Sweat_Reference_Generator_FINAL',fixtures=fx_out),open(fxp,'w'),indent=1)
R['tiers']['T1b_fixtures']=dict(count=len(t1b),passed=sum(not x['hard_fails'] and x['outcome']!='ACTUAL GENERATOR FAILURE' for x in t1b),results=t1b)

# ---------------- Tier 2: reproducibility, swap variation, history rotation
rep=sum(sig(generate(inp))==sig(w) for _,inp,w in allw[:400]);
R['tiers']['T2a_reproducibility']=dict(checked=min(400,len(allw)),identical=rep)
sw=[]
SWS=[dict(duration=60,experience='intermediate'),dict(duration=30,experience='intermediate'),dict(duration=60,experience='beginner'),dict(duration=60,experience='advanced',states=['bored']),
     dict(duration=60,experience='intermediate',states=['stressed']),dict(duration=60,experience='intermediate',states=['low_energy']),dict(duration=60,experience='intermediate',states=['irritated']),
     dict(duration=60,experience='intermediate',states=['amped']),dict(duration=60,experience='intermediate',goal='build_strength'),dict(duration=30,experience='beginner',preset='db_bodyweight_only'),
     dict(duration=60,experience='intermediate',target=['chest','back']),dict(duration=30,experience='intermediate',target=['quads','glutes']),
     dict(duration=60,experience='intermediate',force_archetype='sweat_engine'),dict(duration=60,experience='intermediate',force_archetype='sweat_hybrid')]
def disp(w): return dict(families=[e['swap'] for b in w['blocks'] for e in b['items_e']],exercises=[e['id'] for b in w['blocks'] for e in b['items_e']],engine_mode=w.get('engine_mode'),engine_format=w.get('engine_format'),primary_structure=w['blocks'][0]['structure'] if w['blocks'] else None)
for i,s in enumerate(SWS):
    s=dict(s,user=f'sw{i}',date='2026-10-05'); chain=[]; ws=[]
    for k in range(3):
        w=generate(dict(s,swap=k,displayed_chain=list(chain))); ws.append(w); chain.append(disp(w))
    d0,d1=disp(ws[0]),disp(ws[1])
    changed1=(d0!=d1); same_arch1=ws[0]['archetype_id']==ws[1]['archetype_id']
    pick=('target' not in s) and ('force_archetype' not in s)
    # swap 2 must change archetype under MOOD's Pick unless every other archetype is infeasible for this equipment / level
    arch2=ws[2]['archetype_id']!=ws[0]['archetype_id'] or any(a['reason_code']=='archetype_skipped_equipment' for a in ws[2]['adjustments'])
    ok=changed1 and same_arch1 and (arch2 if pick else ws[2]['archetype_id']==ws[0]['archetype_id']) and all(not hard_fails(w) for w in ws)
    overlap=len(set(d0['exercises'])&set(d1['exercises']))/max(1,len(set(d0['exercises'])))
    sw.append(dict(case=i,inputs={k:v for k,v in s.items() if k not in ('user','date')},swap1_changed=changed1,swap1_same_archetype=same_arch1,swap2_archetype=ws[2]['archetype_id'],
                   swap2_rule_ok=(arch2 if pick else ws[2]['archetype_id']==ws[0]['archetype_id']),exercise_overlap_swap1=round(overlap,2),
                   verdict='healthy' if ok and overlap<=0.5 else ('limited but defensible' if ok else 'FAIL')))
R['tiers']['T2b_swap']=dict(cases=len(sw),verdicts=dict(Counter(x['verdict'] for x in sw)),results=sw)
hist_res=[]
PROF=[('Normal conditioning',dict(experience='intermediate')),('Normal performance',dict(experience='intermediate',goal='build_strength')),('Stressed',dict(experience='intermediate',states=['stressed'])),
      ('Low Energy',dict(experience='intermediate',states=['low_energy'])),('Bored',dict(experience='intermediate',states=['bored'])),('Amped',dict(experience='advanced',states=['amped'])),
      ('Irritated',dict(experience='intermediate',states=['irritated'])),('Beginner',dict(experience='beginner'))]
for name,p in PROF:
    h=[]; seq=[]; bad=[]
    for day in range(8):
        w=generate(dict(p,duration=60,user='hist_'+name,date=f'2026-11-{day+1:02d}',history=list(h)))
        rec=history_record(w); seq.append((rec['archetype'],rec['engine_mode'],rec['engine_format'],rec['primary_structure'],w['blocks'][0]['items_e'][0]['id']))
        if hard_fails(w): bad.append(('hard',day))
        h.append(rec)
    for i in range(1,len(seq)):
        if seq[i][0]==seq[i-1][0]: bad.append(('same_archetype_consecutive',i))
        if seq[i]==seq[i-1]: bad.append(('identical_session',i))
    eng=[s for s in seq if s[0]=='sweat_engine']
    modes=[s[1] for s in eng]
    two_mode=name not in ('Amped','Irritated')
    rot=all(modes[i]!=modes[i-1] for i in range(1,len(modes))) if two_mode and len(modes)>1 else True
    if not rot: bad.append(('engine_mode_not_rotating',modes))
    hist_res.append(dict(profile=name,sequence=[' / '.join(str(x) for x in s) for s in seq],engine_modes=modes,issues=bad,verdict='good' if not bad else 'BAD'))
R['tiers']['T2c_history']=dict(profiles=len(hist_res),verdicts=dict(Counter(x['verdict'] for x in hist_res)),results=hist_res)

# ---------------- Tier 3: soreness matrix
SORESETS={'legs':SORE_DEF,'quads':['quads'],'glutes':['glutes'],'hamstrings':['hamstrings'],'calves':['calves'],'chest':['chest'],'shoulders':['shoulders'],'back':['back'],
          'biceps':['biceps'],'triceps':['triceps'],'core':['core'],'upper_push':['chest','shoulders','triceps'],'legs+back':SORE_DEF+['back']}
t3=[]; t3c=Counter()
for sn,ss in SORESETS.items():
    for mode in ['pick','sweat_engine','sweat_circuit','sweat_hybrid','target_upper','target_lower']:
        for dur in (30,60):
            inp=dict(duration=dur,experience='intermediate',sore=ss,user='sore',date='2026-10-09')
            if mode.startswith('sweat_'): inp['force_archetype']=mode
            if mode=='target_upper': inp['target']=['chest','back']
            if mode=='target_lower': inp['target']=['quads','glutes']
            w=generate(inp); hf=hard_fails(w)
            viol=[f for f in hf if f[0]=='sore_primary_excluded']
            t3c[w['outcome']]+=1
            t3.append(dict(sore=sn,mode=mode,duration=dur,outcome=w['outcome'],archetype=w['archetype_id'],sore_primary_violations=len(viol),hard_fails=hf,
                           reroute=[a['detail'] for a in w['adjustments'] if a['reason_code']=='sore_reroute']))
eng_legs=[x for x in t3 if x['sore']=='legs' and x['mode']=='sweat_engine']
R['tiers']['T3_soreness']=dict(cases=len(t3),outcomes=dict(t3c),sore_primary_violations=sum(x['sore_primary_violations'] for x in t3),
    other_hard_fails=sum(len(x['hard_fails'])-x['sore_primary_violations'] for x in t3),engine_sore_legs_builds=all(x['outcome']=='VALID BUILD' for x in eng_legs),
    results=t3,reroutes=[x for x in t3 if x['reroute']],terminal=[dict(sore=x['sore'],mode=x['mode'],duration=x['duration']) for x in t3 if x['outcome']=='VALID TERMINAL CONFLICT'])

# ---------------- Tier 5 (v3 targeted): Low Energy rotation, duty cycle, resistance-heavy identity, equipment-limited identity, Hybrid variety
from mood_v3.engines.sweat.sweat_gen import le_tier, duty_cycle, DUTY_MIN
def seqrun(p,n,tag):
    h=[]; out=[]
    for day in range(n):
        w=generate(dict(p,user='t5_'+tag,date=f'2026-12-{day+1:02d}',history=list(h)))
        h.append(history_record(w)); out.append(w); allw.append(('t5',p,w))
    return out
T5={}
# 5a Low Energy rotation among equally compliant options
le_res=[]
for tag,p in [('LE int 60',dict(experience='intermediate',states=['low_energy'],duration=60)),('LE int 30',dict(experience='intermediate',states=['low_energy'],duration=30)),
              ('LE beginner 60',dict(experience='beginner',states=['low_energy'],duration=60)),('LE + Stressed 60',dict(experience='intermediate',states=['low_energy','stressed'],duration=60)),
              ('LE forced Engine 60',dict(experience='intermediate',states=['low_energy'],duration=60,force_archetype='sweat_engine'))]:
    ws=seqrun(p,8,tag); issues=[]
    eng=[w['blocks'][0]['items_e'][0]['id'] for w in ws if w['archetype_id']=='sweat_engine']
    circ=[[e['id'] for e in w['blocks'][0]['items_e'] if e['role'].startswith('resistance')] for w in ws if w['archetype_id']=='sweat_circuit']
    for i in range(1,len(eng)):
        if eng[i]==eng[i-1]: issues.append(('engine_modality_repeated',i,eng[i]))
    for i in range(1,len(circ)):
        if circ[i] and len(set(circ[i])&set(circ[i-1]))/len(circ[i])>0.5: issues.append(('circuit_resistance_overlap_gt_50pct',i))
    viol=[]
    for w in ws:
        for b in w['blocks']:
            for e in b['items_e']:
                if e['sysd']>=5 or e['impact']=='high' or le_tier(e)>1: viol.append((e['id'],le_tier(e)))
    le_res.append(dict(profile=tag,engine_sequence=eng,distinct_engines=len(set(eng)),circuit_resistance=circ,le_violations=viol,issues=issues,
                       verdict='rotates' if not issues and not viol and (len(set(eng))>=2 or len(eng)<2) else 'FAIL'))
T5['5a_low_energy_rotation']=le_res
# 5b duty cycle of every primary block built in this run
dc=defaultdict(list)
for tag,inp,w in allw:
    if w['blocks']: dc[(w['archetype_id'],w['blocks'][0]['structure'])].append(duty_cycle(w['blocks'][0],w['_ctx']['experience']))
T5['5b_duty_cycle']=dict(threshold=DUTY_MIN,by_block={f'{a}|{s}':dict(n=len(v),min=round(min(v),3),mean=round(sum(v)/len(v),3)) for (a,s),v in sorted(dc.items())},
    below=sum(1 for v in dc.values() for x in v if x<DUTY_MIN),repairs=sum(1 for tag,inp,w in allw if any(a['reason_code']=='duty_cycle_adjusted' for a in w['adjustments'])))
# 5c resistance-heavy Circuit identity (explicit Targets, machine circuits, Low Energy / Beginner)
rh=[]; SC=('SC1','SC2','SC3','SC4','SC5','AF_','I5')
for tgt in (['quads','glutes'],['chest','back'],['chest','shoulders','triceps'],['hamstrings'],['core'],['biceps','triceps']):
    for st in ([],['low_energy'],['stressed']):
        for lv in ('beginner','intermediate'):
            for dur in (30,60):
                w=generate(dict(duration=dur,experience=lv,states=st,target=tgt,user='rh',date='2026-12-10')); allw.append(('t5',{},w))
                p=w['blocks'][0]; res=[e for e in p['items_e'] if e['role'].startswith('resistance') or e['role']=='core']
                fails=[(n,dd) for n,ok,dd in validate(w) if not ok and n.startswith(SC)]
                rh.append(dict(target='+'.join(tgt),states=st,level=lv,duration=dur,structure=p['structure'],resistance_share=round(len(res)/len(p['items_e']),2),
                               duty=round(duty_cycle(p,lv),2),driver=any(e['role'] in ('engine','output') for e in p['items_e']),fails=fails))
T5['5c_resistance_heavy_circuits']=dict(cases=len(rh),failures=sum(1 for x in rh if x['fails']),min_duty=min(x['duty'] for x in rh),
    with_driver=sum(x['driver'] for x in rh),results=rh)
# 5d equipment-limited Circuit identity (incl. forced resistance-only path)
el=[]
for pre in ('free_weight_limited','db_bodyweight_only','db_bench_only'):
    for sore in ([],['quads','core'],['quads','core','chest'],['back','core','quads']):
        for st in ([],['low_energy'],['stressed'],['irritated']):
            for lv in ('beginner','intermediate'):
                w=generate(dict(duration=30 if lv=='beginner' else 60,experience=lv,states=st,preset=pre,sore=sore,user='el',date='2026-12-11')); allw.append(('t5',{},w))
                hf=[(n,dd) for n,ok,dd in validate(w) if not ok and not n.startswith('SOFT')]
                ro=any(a['reason_code']=='conditioning_driver_resistance_only' for a in w['adjustments'])
                p=w['blocks'][0] if w['blocks'] else None
                el.append(dict(preset=pre,sore=sore,states=st,level=lv,outcome=w['outcome'],resistance_only=ro,structure=p['structure'] if p else None,
                               duty=round(duty_cycle(p,lv),2) if p else None,fails=hf))
T5['5d_equipment_limited']=dict(cases=len(el),failures=sum(1 for x in el if x['fails'] or x['outcome']=='ACTUAL GENERATOR FAILURE'),
    resistance_only_builds=sum(x['resistance_only'] for x in el),resistance_only_structures=dict(Counter(x['structure'] for x in el if x['resistance_only'])),results=el)
# 5e Hybrid variety
hv=[]
for tag,p in [('Hybrid int',dict(experience='intermediate',duration=60,force_archetype='sweat_hybrid')),('Hybrid Irritated',dict(experience='intermediate',duration=60,states=['irritated'],force_archetype='sweat_hybrid')),
              ('Hybrid adv 30',dict(experience='advanced',duration=30,force_archetype='sweat_hybrid')),('Hybrid in rotation (Performance)',dict(experience='intermediate',duration=60,goal='build_strength'))]:
    n=12 if 'rotation' in tag else 8
    ws=[w for w in seqrun(p,n,tag) if w['archetype_id']=='sweat_hybrid']
    sets=[[x[0]['id'] for r in w['blocks'][0]['round_stations'] for x in r] for w in ws]
    sets=[list(dict.fromkeys(s_)) for s_ in sets]
    anchors=[w['blocks'][0]['anchor']['id'] for w in ws]
    hyrox=sum(1 for s_ in sets if {'sled_push','sled_pull'}<=set(s_) and any(EX[x]['pat']=='carry' for x in s_))
    ov=[round(len(set(sets[i])&set(sets[i-1]))/len(set(sets[i])),2) for i in range(1,len(sets))]
    distinct=len({x for s_ in sets for x in s_})
    sled=sum(1 for s_ in sets if any(EX[x]['mod']=='sled' for x in s_))
    per=max(1,max(len(s_) for s_ in sets)); lim=0.6 if p.get('states') else 0.5   # a State-constrained station pool (e.g. Irritated: forceful only) is allowed its theoretical minimum overlap
    ok=all(o<=lim for o in ov) and hyrox<=max(1,len(sets)//3) and distinct>=min(10,2*per) and len(set(anchors))>=2
    hv.append(dict(profile=tag,sessions=len(sets),anchors=anchors,stations=sets,consecutive_overlap=ov,full_hyrox_template_sessions=hyrox,sessions_with_sled=sled,distinct_stations=distinct,verdict=('varied' if max(ov or [0])<=0.5 else 'varied (State-limited pool)') if ok else 'FAIL'))
T5['5e_hybrid_variety']=hv
R['tiers']['T5_targeted_v3']=T5

# ---------------- Tier 4: invariants + safety over every build in this run
inv=Counter(); built=0; checks=0
for tag,inp,w in allw:
    if not w['blocks']: continue
    built+=1
    for n,ok,dd in validate(w):
        checks+=1
        if not ok: inv[n]+=1
fixed=[]
for tag,inp,w in allw:
    for b in w['blocks']:
        from mood_v3.engines.sweat.sweat_validate import block_items
        fk={e['fixed'] for e,_ in block_items(b) if e['fixed']}
        if len(fk)>2: fixed.append((inp,sorted(fk)))
sled_use=sum(1 for tag,inp,w in allw if inp.get('preset','sweat_commercial_default')=='sweat_commercial_default' and any(e['mod']=='sled' for b in w['blocks'] for e in b['items_e']))
R['tiers']['T4_invariants']=dict(builds=built,checks=checks,violations=dict(inv),fixed_station_overflows=len(fixed),
    sled_used_in_default_builds=sled_use)
# summary
S=R['tiers']
R['summary']=dict(
  T0_data_errors=len(S['T0_data']['errors']),
  T1a_builds=S['T1a_grid']['builds'],T1a_actual_generator_failures=S['T1a_grid']['actual_generator_failures'],T1a_hard_fail_total=sum(S['T1a_grid']['hard_fail_counts'].values()),
  T1a_soft_duration_band=S['T1a_grid']['soft_counts'].get('SOFT_duration_band',0),
  T1b_fixtures=f"{S['T1b_fixtures']['passed']}/{S['T1b_fixtures']['count']}",
  T2a_reproducible=f"{S['T2a_reproducibility']['identical']}/{S['T2a_reproducibility']['checked']}",
  T2b_swap=S['T2b_swap']['verdicts'],T2c_history=S['T2c_history']['verdicts'],
  T3_sore_primary_violations=S['T3_soreness']['sore_primary_violations'],T3_other_hard_fails=S['T3_soreness']['other_hard_fails'],T3_outcomes=S['T3_soreness']['outcomes'],
  T3_engine_sore_legs_builds=S['T3_soreness']['engine_sore_legs_builds'],
  T4_violations={k:v for k,v in S['T4_invariants']['violations'].items()},T4_fixed_station_overflows=S['T4_invariants']['fixed_station_overflows'],
  T5a_low_energy={x['profile']:x['verdict'] for x in S['T5_targeted_v3']['5a_low_energy_rotation']},
  T5b_duty_below_060=S['T5_targeted_v3']['5b_duty_cycle']['below'],T5b_repairs=S['T5_targeted_v3']['5b_duty_cycle']['repairs'],
  T5c_resistance_heavy=f"{S['T5_targeted_v3']['5c_resistance_heavy_circuits']['cases']-S['T5_targeted_v3']['5c_resistance_heavy_circuits']['failures']}/{S['T5_targeted_v3']['5c_resistance_heavy_circuits']['cases']} pass",
  T5d_equipment_limited=f"{S['T5_targeted_v3']['5d_equipment_limited']['cases']-S['T5_targeted_v3']['5d_equipment_limited']['failures']}/{S['T5_targeted_v3']['5d_equipment_limited']['cases']} pass, resistance-only builds {S['T5_targeted_v3']['5d_equipment_limited']['resistance_only_builds']}",
  T5e_hybrid={x['profile']:x['verdict'] for x in S['T5_targeted_v3']['5e_hybrid_variety']})
json.dump(R,open(os.path.join(OUT,'MOOD_V3_Sweat_QA_Results_FINAL.json'),'w'),indent=1,default=str)
print(json.dumps(R['summary'],indent=1))
# renders for affected examples + founder sample
with open(os.path.join(OUT,'_renders.txt'),'w') as f:
    for fid,name,inp in FX:
        inp=dict(inp); inp.setdefault('date','2026-10-01'); inp.setdefault('user','fx_'+fid)
        f.write(f'### {fid} {name}\n```\n'+render(generate(inp))+'\n```\n\n')
