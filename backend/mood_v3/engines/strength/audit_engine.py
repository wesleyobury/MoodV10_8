import openpyxl, hashlib, itertools, json
from collections import Counter, defaultdict
from ...paths import DATA_DIR_SLASH as O
LIB=openpyxl.load_workbook(O+'MOOD_V3_Strength_Exercise_Library_v11.xlsx',data_only=True)
WA=openpyxl.load_workbook(O+'MOOD_V3_Workout_Architecture_FINAL_FREEZE_v17.xlsx',data_only=True)
ET=openpyxl.load_workbook(O+'MOOD_V3_Exercise_Taxonomy_FINAL_FREEZE_v12.xlsx',data_only=True)

# ---------- ET: hierarchy + vocab
mh=ET['MUSCLE HIERARCHY']; PARENT={}; USERFACING=set()
for r in range(4,21):
    m=mh.cell(r,1).value
    if m: PARENT[m]=mh.cell(r,2).value or m; USERFACING.add(m) if mh.cell(r,3).value=='Yes' else None
CHILD=defaultdict(set)
for k,p in PARENT.items(): CHILD[p].add(k)
def roll(m): return PARENT.get(m,m)
def expand(m): return {m}|CHILD.get(m,set())
cv=ET['CONTROLLED VOCAB']; EQUIP=[x.strip() for x in cv['B7'].value.split(';')]; SPACE=[x.strip() for x in cv['B9'].value.split(';')]

# ---------- Library
ws=LIB['EXERCISE LIBRARY']; hdr=[c.value for c in ws[2]]; ix={h:i for i,h in enumerate(hdr)}
def L(v): return [s.strip() for s in str(v).split(';')] if v else []
EX={}
for row in ws.iter_rows(min_row=3,values_only=True):
    if not row[1]: continue
    g=lambda k: row[ix[k]]
    e=dict(id=g('exercise_id'),name=g('display_name'),fam=g('exercise_family'),vt=L(g('variation_tags')),prim=L(g('primary_muscles')),sec=L(g('secondary_muscles')),
        pat=g('movement_pattern'),mfam=g('movement_family'),mod=g('modality'),eq=g('primary_equipment'),seq=L(g('secondary_equipment')),req=L(g('required_secondary_equipment')),
        station=g('setup_station_family'),space=g('space_requirement'),cls=g('compound_class'),sup=g('support_level'),lat=g('laterality'),cx=int(g('complexity')),nov=int(g('novelty_score')),sysd=int(g('systemic_demand')),
        forceful=g('forceful_safe')=='TRUE',explosive=g('explosive')=='TRUE',prec=g('precision_required')=='TRUE',impact=g('impact_level'),skill=g('skill_level_min'),combo=g('combination_movement')=='TRUE',
        comps=L(g('component_patterns')),compm=L(g('component_muscles')),swap=g('swap_family_id'),tier=g('swap_tier'),active=g('active')=='TRUE',group=g('Primary Target (review group)'))
    e['pm0']=roll(e['prim'][0]); e['prims']={roll(m) for m in e['prim']}; e['secs']={roll(m) for m in e['sec']}; e['allm']=set(e['prim'])|set(e['sec'])
    EX[e['id']]=e
el=LIB['ARCHETYPE ELIGIBILITY']; ELIG=defaultdict(list)  # (aid,slot) -> [(eid,verdict,cond,bias)]
for row in el.iter_rows(min_row=3,values_only=True):
    if not row[0]: continue
    ELIG[(row[3],row[4])].append((row[0],row[5],row[6] or '',int(row[7] or 0)))

# ---------- WA: slots
reg=WA['ARCHETYPE + SLOT IDS']; SLOTS=defaultdict(list); PROTECTED=set()
for r in reg.iter_rows(min_row=4,values_only=True):
    if r[0]=='Strength' and r[5]: SLOTS[r[2]].append(dict(slot=r[5],name=r[4],cls=r[6],i60=str(r[7]).split(' (')[0],i30=str(r[8]).split(' (')[0],prio=r[3],cond=('state_bored_amped' if '(Bored / Amped only)' in str(r[7]) else None)))
def slot_active(s,sc):
    """WA v15 Arms: compound_combination is conditional on resolved structure_novelty >= 1 OR Extras >= 1 (Bored or Amped)."""
    return s.get('cond')!='state_bored_amped' or sc.get('state') in ('bored','amped')
for ws_ in WA.worksheets:
    if ws_['A12'].value!='Archetype ID' or ws_['B6'].value!='Strength': continue
    k=[i for i in range(1,30) if ws_.cell(i,1).value and 'SKELETON' in str(ws_.cell(i,1).value)][0]+2
    while ws_.cell(k,2).value:
        if str(ws_.cell(k,6).value or '').startswith('Protected'):
            nm=ws_.cell(k,2).value
            for s in SLOTS[ws_['B12'].value]:
                if s['name']==nm: PROTECTED.add((ws_['B12'].value,s['slot']))
        k+=1
ARCH=['strength_upper_push','strength_upper_pull','strength_upper_mixed','strength_arms','strength_lower_squat','strength_lower_hinge','strength_glutes_legs','strength_full_body','strength_core','strength_custom_target']
PUSH={'horizontal_push','vertical_push'}; PULL={'horizontal_pull','vertical_pull'}
LOWER={'quads','hamstrings','glutes','calves','hip_adductors','hip_abductors'}; UPPER={'chest','back','shoulders','front_delts','side_delts','rear_delts','biceps','triceps','forearms'}
def region(m): m=roll(m); return 'lower' if m in LOWER else ('upper' if m in UPPER else 'trunk')
CORE_PAT={'flexion','anti_extension','anti_rotation','rotation','carry'}

# ---------- Composition constraints (machine form of WA v7 Section B column H)
def used_swaps(sel): return {e['swap'] for e in sel.values()}
# ---------- Ancillary Target Depth (WA v14 ATD2): stimulus profile from existing taxonomy
EQ_GROUP={'cable':'cable','selectorized_machine':'machine','plate_loaded_machine':'machine','smith_machine':'machine','bodyweight':'bodyweight'}
POSGRIP={'overhead','lying','cross_body','rope','close_grip','neutral_grip','incline','preacher','chest_supported','behind_body','rotational','high_pulley','assisted'}
def profile(e): return dict(swap=e['swap'],eq=EQ_GROUP.get(e['eq'],'free'),lat=e['lat'],cls=e['cls'],sup=e['sup'],tags=frozenset(t for t in e['vt'] if t in POSGRIP))
def profile_distance(a,b):
    pa,pb=profile(a),profile(b); return sum(pa[k]!=pb[k] for k in ('swap','eq','lat','cls','sup','tags'))
def profile_distinct(a,b):
    if (a['eq'],a['lat'],tuple(sorted(a['vt'])))==(b['eq'],b['lat'],tuple(sorted(b['vt']))): return False
    return profile_distance(a,b)>=2
ATD_FIRST={'strength_upper_push':('triceps_accessory','triceps'),'strength_upper_pull':('biceps_accessory','biceps')}
# WA v15: generalised ATD pairs (first exposure slot, depth slot, muscle); Arms carries two pairs plus a delt pair
ATD_PAIRS={'strength_upper_push':[('triceps_accessory','ancillary_depth','triceps')],'strength_upper_pull':[('biceps_accessory','ancillary_depth','biceps')],
 'strength_arms':[('biceps_exercise','biceps_depth','biceps'),('triceps_exercise','triceps_depth','triceps'),('shoulder_exercise','shoulder_depth','shoulders')]}
DEPTH_SLOTS={(a,p[1]):p for a,ps in ATD_PAIRS.items() for p in ps}
def depth_first(aid,slot,sel):
    p=DEPTH_SLOTS.get((aid,slot)); return sel.get(p[0]) if p else None
def used_pats(sel): return {e['pat'] for e in sel.values()}
def tgt(ctx,*ms):  # Target intersection with muscles, rolled
    T=ctx.get('target') or set(); return {m for m in ms if m in T}
def CON(aid,slot,e,sel,ctx):
    try: return _CON(aid,slot,e,sel,ctx)
    except (KeyError,IndexError): return False
def _CON(aid,slot,e,sel,ctx):
    T=ctx.get('target') or set(); U=used_swaps(sel)
    if aid=='strength_upper_push':
        if slot=='primary_press':
            want='chest' if (not T or 'chest' in T) else 'shoulders'
            return e['pat'] in PUSH and e['cls']!='isolation' and e['pm0']==want
        if slot=='complementary_press': return e['pat'] in PUSH and e['cls']!='isolation' and e['pat']!=sel['primary_press']['pat']
        if slot=='secondary_target_press': return e['pat'] in PUSH and e['pm0']==sel['primary_press']['pm0'] and e['swap'] not in U
        if slot=='target_accessory':
            t=tgt(ctx,'chest','shoulders') or {'chest','shoulders'}
            return e['cls']=='isolation' and e['pm0'] in t
        if slot=='ancillary_depth': return e['pm0']=='triceps' and e['cls'] in ('isolation','compound') and 'triceps_accessory' in sel and profile_distinct(e,sel['triceps_accessory'])
        if slot=='triceps_accessory': return 'triceps' in e['prims'] and e['cls']=='isolation'
        if slot=='secondary_accessory_extra': return e['pm0'] in {'chest','shoulders','triceps'} and e['cls']=='isolation'
    if aid=='strength_upper_pull':
        if slot=='primary_pull': return e['pat'] in PULL and e['cls']!='isolation' and 'back' in e['prims']
        if slot=='complementary_pull': return e['pat'] in PULL and e['cls']!='isolation' and e['pat']!=sel['primary_pull']['pat']
        if slot=='secondary_back': return 'back' in e['prims'] and e['swap'] not in U
        if slot=='target_accessory': return e['cls']=='isolation' and (e['pm0'] in {'back'} or e['prim'][0]=='rear_delts')
        if slot=='ancillary_depth': return e['pm0']=='biceps' and e['cls'] in ('isolation','compound') and 'biceps_accessory' in sel and profile_distinct(e,sel['biceps_accessory'])
        if slot=='biceps_accessory': return 'biceps' in e['prims'] and e['cls']=='isolation'
        if slot=='secondary_accessory_extra': return (e['pm0'] in {'back','biceps'} or e['prim'][0]=='rear_delts') and e['cls']=='isolation'
    if aid=='strength_upper_mixed':
        if slot=='primary_push': return e['pat'] in PUSH and e['cls']!='isolation'
        if slot=='primary_pull': return e['pat'] in PULL and e['cls']!='isolation'
        if slot in ('secondary_upper','opposing_secondary'):
            pushT=bool(T&{'chest','shoulders','triceps'}); pullT=bool(T&{'back','biceps'})
            secl='push' if (pushT and not pullT) else ('pull' if (pullT and not pushT) else 'push')
            cl=secl if slot=='secondary_upper' else ('pull' if secl=='push' else 'push')
            P=PUSH if cl=='push' else PULL; prim=sel['primary_push'] if cl=='push' else sel['primary_pull']
            return e['pat'] in P and e['pat']!=prim['pat'] and e['cls']!='isolation' and e['swap'] not in U
        if slot=='arm_shoulder_accessory': return e['cls']=='isolation' and e['pm0'] in {'biceps','triceps','shoulders'}
        if slot=='secondary_accessory_extra': return e['cls']=='isolation' and e['pm0'] in UPPER|{'shoulders'}
    if aid=='strength_arms':
        if slot=='biceps_exercise': return e['pm0']=='biceps'
        if slot=='triceps_exercise': return e['pm0']=='triceps'
        if slot=='shoulder_exercise': return e['pm0']=='shoulders'
        if slot in ('biceps_depth','triceps_depth'):   # WA v15: second exposure, profile-distinct from the first (ATD test); family reuse allowed under that test
            f=depth_first(aid,slot,sel); want='biceps' if slot=='biceps_depth' else 'triceps'
            return e['pm0']==want and f is not None and profile_distinct(e,f) and (slot!='triceps_depth' or e['cls'] in ('isolation','compound'))
        if slot=='shoulder_depth':
            f=sel.get('shoulder_exercise'); 
            return e['pm0']=='shoulders' and e['cls']=='isolation' and f is not None and (roll(e['prim'][0])=='shoulders' and e['prim'][0]!=f['prim'][0] or profile_distinct(e,f))
        if slot=='compound_combination':
            cov={roll(m) for m in e['allm']|set(e['compm'])}&{'biceps','triceps','shoulders'}
            return ((e['combo'] and len(cov)>=2) or (e['cls'] in ('compound','integrated') and len(cov)>=2)) and e['swap'] not in U
        if slot=='optional_extra_burnout': return e['cls']=='isolation' and e['pm0'] in {'biceps','triceps','shoulders'} and all(profile_distinct(e,x) for x in sel.values() if x['swap']==e['swap'])
    if aid=='strength_lower_squat':
        if slot=='primary_squat_pattern': return e['pat']=='squat' and e['cls']!='isolation'
        if slot=='secondary_lower': return e['pat'] in ('squat','lunge') and e['cls']!='isolation' and e['swap']!=sel['primary_squat_pattern']['swap']
        if slot=='unilateral_secondary': return e['lat']!='bilateral' and e['pm0'] in {'quads','glutes'} and e['swap'] not in U
        if slot=='target_accessory':
            t=tgt(ctx,'quads','glutes'); want='quads' if (not t or len(t)==2) else list(t)[0]
            return e['cls']=='isolation' and e['pm0']==want
        if slot=='support_accessory': return e['pm0']=='hamstrings' and e['cls']=='isolation'   # v14 ATD: hamstring support
        if slot=='secondary_accessory_extra': return e['pm0'] in {'quads','glutes'} and e['cls']=='isolation'
    if aid=='strength_lower_hinge':
        if slot=='primary_posterior_compound': return e['pat']=='hinge' and e['cls']!='isolation' and bool(e['prims']&{'hamstrings','glutes'})
        if slot=='complementary_posterior_compound': return e['pat']=='hinge' and e['cls']!='isolation' and (e['pm0']!=sel['primary_posterior_compound']['pm0'] or e['mfam']!=sel['primary_posterior_compound']['mfam']) and e['swap'] not in U
        if slot=='secondary_posterior_unilateral': return e['lat']!='bilateral' and e['pm0'] in {'hamstrings','glutes'}
        if slot=='target_accessory':
            t=tgt(ctx,'hamstrings','glutes'); want='hamstrings' if (not t or len(t)==2) else list(t)[0]
            return e['cls']=='isolation' and e['pm0']==want
        if slot=='support_accessory': return e['pm0'] in {'back','glutes','core','calves'} and e['cls']=='isolation'
        if slot=='extra': return e['pm0'] in {'hamstrings','glutes'} and e['cls']=='isolation'
    if aid=='strength_glutes_legs':
        if slot=='primary_glute_compound': return e['pm0']=='glutes' and e['cls']!='isolation'
        if slot=='complementary_lower_compound': return e['pat'] in ('squat','hinge') and e['cls']!='isolation' and e['swap']!=sel['primary_glute_compound']['swap']
        if slot=='third_compound_unilateral': return e['cls']!='isolation' and (e['lat']!='bilateral' or e['pat'] not in used_pats(sel)) and e['swap'] not in U
        if slot=='glute_accessory': return e['cls']=='isolation' and e['pm0'] in {'glutes','hip_abductors','hip_adductors'}
        if slot=='leg_accessory':
            t=tgt(ctx,'quads','hamstrings')
            if t and len(t)==1: want=list(t)[0]
            else:
                have={roll(m) for x in sel.values() for m in x['prim']}
                want='quads' if 'quads' not in have else ('hamstrings' if 'hamstrings' not in have else 'quads')
            return e['cls']=='isolation' and e['pm0']==want
        if slot=='extra': return e['pm0'] in {'glutes','quads','hamstrings'} and e['cls']=='isolation'
    if aid=='strength_full_body':
        if slot=='primary_lower': return e['pat'] in ('squat','hinge') and e['cls']!='isolation' and region(e['prim'][0])=='lower'
        if slot=='true_full_body_bridge':
            rs={region(m) for m in e['compm']}
            return e['cls']=='integrated' or (e['combo'] and 'lower' in rs and 'upper' in rs)
        if slot=='primary_upper':
            cl=ctx.get('fb_upper_eval',ctx.get('fb_upper','pull')); P=PULL if cl=='pull' else PUSH
            return e['pat'] in P and e['cls']!='isolation'
        if slot=='complementary_upper_or_lower':
            pu=sel['primary_upper']; P=PUSH if pu['pat'] in PULL else PULL
            return e['pat'] in P and e['cls']!='isolation' and e['swap'] not in U
        if slot=='core': return 'core' in e['prims'] and e['pat'] in CORE_PAT
        if slot=='optional_accessory_extra': return e['cls']=='isolation'
    if aid=='strength_core':
        if slot=='format_selection': return False
        if slot=='primary_work': return 'core' in e['prims'] and e['pat'] in CORE_PAT
        if slot=='complementary_work': return 'core' in e['prims'] and e['pat']!=sel['primary_work']['pat'] and (e['station']==sel['primary_work']['station'] or e['station']=='floor_mat')
        if slot=='optional_finish': prev=list(sel.values())[-1]; return (e['station']==prev['station'] or e['eq']=='bodyweight') and e['pat'] not in used_pats(sel)
        if slot=='extra': prev=list(sel.values())[-1]; return (e['station']==prev['station'] or e['eq']=='bodyweight')
    return True

# ---------- Filters, caps, predicates (SD v4 DIAL BINDING + STATE PREDICATES)
FULL_GYM=set(EQUIP)-{'other','sled'}; FULL_SPACE={'standard_gym','floor_space','lane'}
HOME={'dumbbells','bench','bodyweight','bands','plate'}; HOME_SPACE={'standard_gym','floor_space'}
NOBAR=FULL_GYM-{'barbell','rack','trap_bar','landmine','ez_bar'}
FREEONLY={'barbell','dumbbells','kettlebell','bench','rack','bodyweight','pullup_bar','ez_bar','trap_bar','bands','landmine','box','dip_station','ab_wheel','plate'}
CAP={'beginner':2,'intermediate':3,'advanced':5}; RANK={'beginner':0,'intermediate':1,'advanced':2}
STATE_CAP={'low_energy':-1,'stressed':-1,'irritated':-1,'bored':1,'amped':0,None:0,'sore':0}
def hard_ok(e,sc):
    if not e['active']: return False
    if RANK[e['skill']]>RANK[sc['exp']]: return False
    if e['eq'] not in sc['equip'] or any(q not in sc['equip'] for q in e['req']): return False
    if e['space'] not in sc['space']: return False
    if sc.get('sore') and (set(e['prim'])&sc['sore']): return False
    cap=max(1,min(5,CAP[sc['exp']]+STATE_CAP.get(sc.get('state'),0)))
    if e['cx']>cap: return False
    return True
def hard_ok_nosore(e,sc):
    s2=dict(sc); s2['sore']=set(); return hard_ok(e,s2)
def cond_true(cond,sc):
    if not cond: return True
    c=cond.strip()
    if c=='experience != beginner': return sc['exp']!='beginner'
    if c=='experience = advanced': return sc['exp']=='advanced'
    if c.startswith('available_equipment includes'): return c.split()[-1] in sc['equip']
    return False
def pred_score(e,sc,sel,aid,slot):
    st=sc.get('state'); s=0
    if st=='low_energy': s+={'supported':2,'semi_supported':1,'unsupported':0}[e['sup']]+(1 if e['sysd']<=2 else 0)
    elif st=='stressed':
        s+=(1 if e['nov']<=2 else 0); prev=list(sel.values())[-1] if sel else None
        s+=(1 if prev and prev['station']==e['station'] else 0)
    elif st=='bored':
        if (aid,slot) in PROTECTED: s+=(1 if e['nov']<=3 else 0)
        else: s+=(2 if e['nov']>=4 else (1 if e['nov']==3 else 0))
    elif st=='irritated': s+=(2 if e['forceful'] else 0)+(1 if e['explosive'] else 0)
    elif st=='amped': s+=(1 if e['cls'] in ('compound','integrated') else 0)
    if sc.get('sore') and (set(e['sec'])&sc['sore']): s-=5   # secondary sore deprioritizes
    return s
VR={'preferred':2,'allowed':1,'conditional':0}
def candidates(aid,slot,sc,sel,ctx,relax_swap=False):
    # GENERATOR SCHEMA CONTRACT B32: (1) no exercise_id repeats; (2) two non-block slots never share swap_family_id unless the
    # slot constraint says otherwise (none of the Strength slot constraints does); B33 (a) relaxes (2) only when it empties the pool.
    out=[]; used={x['swap'] for x in sel.values()}
    for eid,v,cond,bias in ELIG[(aid,slot)]:
        e=EX[eid]
        if not hard_ok(e,sc): continue
        if v=='conditional' and not cond_true(cond,sc): continue
        if eid in sel.values() or any(x['id']==eid for x in sel.values()): continue
        if not relax_swap and e['swap'] in used:
            if (slot=='ancillary_depth' or (aid,slot) in DEPTH_SLOTS or (aid,slot)==('strength_arms','optional_extra_burnout')) and CON(aid,slot,e,sel,ctx): pass   # WA v14 ATD2 / v15 depth slots; a burnout may reuse a family when profile-distinct: family reuse allowed when the stimulus profile is distinct (logged by the composer)
            else: continue
        if not CON(aid,slot,e,sel,ctx): continue
        out.append((e,v,bias))
    return out
def rank(cands,sc,sel,aid,slot,ctx,seed):
    T=ctx.get('target') or set()
    def key(t):
        e,v,b=t; tc=(2 if e['pm0'] in T else (1 if e['prims']&T else 0)) if T else 0
        h=int(hashlib.md5(f"{seed}|{aid}|{slot}|{e['id']}".encode()).hexdigest(),16)%1000
        return (-VR[v],-pred_score(e,sc,sel,aid,slot),-tc,-b,h)
    return sorted(cands,key=key)

def compose(aid,sc,dur,ctx,seed=0):
    sel={}; log=[]; widths={}; fail=[]; sorefail=[]; soresec=[]; soresec_req=[]; ctx=dict(ctx)
    for s in SLOTS[aid]:
        inc=s['i60'] if dur==60 else s['i30']
        if s['cls'] in ('meta','computed') or inc in ('excluded',): continue
        if aid=='strength_custom_target': continue
        if not slot_active(s,sc): continue
        if aid=='strength_full_body' and s['slot']=='primary_upper':
            pref=ctx.get('fb_upper','pull'); ctx['fb_upper_eval']=pref
            cands=candidates(aid,s['slot'],sc,sel,ctx)
            if not cands:
                ctx['fb_upper_eval']='push' if pref=='pull' else 'pull'
                cands=candidates(aid,s['slot'],sc,sel,ctx)
                if cands: log.append('upper_class_fallback→'+ctx['fb_upper_eval'])
        else:
            cands=candidates(aid,s['slot'],sc,sel,ctx)
        if not cands and inc!='optional':
            # B33 fallback (a): relax swap-family distinctness; logged as an adjustment. (b)/(c) live inside slot constraints and are not relaxed here.
            c2=candidates(aid,s['slot'],sc,sel,ctx,relax_swap=True)
            if c2: cands=c2; log.append(f"relaxation_a_swap_family_distinctness:{s['slot']}")
        widths[s['slot']]=(len(cands),len({c[0]['swap'] for c in cands}),inc)
        if inc=='optional': continue
        if not cands:
            if inc=='required':
                # WA v16 FB1: Beginner under a complexity-lowering State (cap 1) may build Full Body without the bridge slot when the other
                # required slots still give legitimate full-body coverage (checked after composition); logged, never silent.
                if aid=='strength_full_body' and s['slot']=='true_full_body_bridge' and sc['exp']=='beginner' and STATE_CAP.get(sc.get('state'),0)<0:
                    log.append('bridge_relaxed_beginner_constrained_state'); continue
                fail.append(s['slot'])
            continue
        if inc in ('required','default') and sc.get('sore') and all(set(c[0]['sec'])&sc['sore'] for c in cands): soresec.append(s['slot']); (soresec_req.append(s['slot']) if inc=='required' else None)
        best=rank(cands,sc,sel,aid,s['slot'],ctx,seed)[0][0]; sel[s['slot']]=best
    # soreness attribution: a required slot is sore-caused if the same build fills it once soreness is cleared
    # (covers cascades where a downstream composition constraint references a sore-emptied upstream slot)
    if fail and sc.get('sore'):
        sc2=dict(sc); sc2['sore']=set()
        _,_,fail2,_=compose(aid,sc2,dur,{k:v for k,v in ctx.items() if not k.startswith('_')},seed)
        sorefail=[f for f in fail if f not in fail2]
    if aid=='strength_full_body' and 'bridge_relaxed_beginner_constrained_state' in log:
        covered={region(m) for e in sel.values() for m in e['prim']}
        if not ({'upper','lower'}<=covered and 'core' in sel): fail.append('true_full_body_bridge'); log.remove('bridge_relaxed_beginner_constrained_state')
    ctx['_log']=log; ctx['_sorefail']=sorefail; ctx['_soresec']=soresec; ctx['_soresec_req']=soresec_req
    return sel,widths,fail,ctx

def compose_custom(targets,sc,dur,seed=0):
    # BLOCK ORDER + block rules (WA v7.1). Sizes: 1 muscle 3–5 (60) / 2–4 (30); 2 muscles 2–3 / 1–2 each; 3 muscles 1–2 / 1 each
    n=len(targets); size={1:(3 if dur==60 else 2),2:(2 if dur==60 else 1),3:(2 if dur==60 else 1)}[n]
    pool=[EX[eid] for eid,v,c,b in ELIG[('strength_custom_target','target_block_a')] if hard_ok(EX[eid],sc)]
    blocks={}; widths={}; fails=[]
    for m in targets:
        ms=expand(m); bp=[e for e in pool if roll(e['prim'][0])==m]
        comp=[e for e in bp if e['cls']!='isolation']; iso=[e for e in bp if e['cls']=='isolation']
        widths[m]=(len(bp),len(comp),len(iso),len({e['swap'] for e in bp}))
        chosen=[]; used=set()
        def sig(e): return (e['eq'],e['sup'],e['lat'],tuple(sorted(e['vt'])))
        def distinct(e):  # single-muscle rule: >=2 of 5 attributes differ from every chosen exercise, and no identical tuple
            for c in chosen:
                if sig(c)==sig(e): return False
                diff=sum([c['eq']!=e['eq'],c['sup']!=e['sup'],c['lat']!=e['lat'],c['mfam']!=e['mfam'],sorted(c['vt'])!=sorted(e['vt'])])
                if diff<2: return False
            return True
        def ok(e):
            if e in chosen: return False
            if n==1: return (e['swap'] not in used) or distinct(e)
            return e['swap'] not in used
        first=sorted(comp or iso,key=lambda e:(-pred_score(e,sc,{}, 'strength_custom_target','target_block_a'),e['id']))
        if not first: fails.append(m); blocks[m]=[]; continue
        chosen.append(first[0]); used.add(first[0]['swap'])
        for e in sorted(iso,key=lambda e:(-pred_score(e,sc,{}, 'strength_custom_target','target_block_a'),e['id'])):
            if len(chosen)>=size: break
            if ok(e): chosen.append(e); used.add(e['swap'])
        if len(chosen)<size:
            for e in comp:
                if len(chosen)>=size: break
                if ok(e): chosen.append(e); used.add(e['swap'])
        blocks[m]=chosen
    # block order: compound-led first (cls rank, systemic), tie by hierarchy order
    order=sorted(targets,key=lambda m:(0 if (blocks[m] and blocks[m][0]['cls']!='isolation') else 1, -(blocks[m][0]['sysd'] if blocks[m] else 0), list(PARENT).index(m)))
    multi=[EX[eid] for eid,v,c,b in ELIG[('strength_custom_target','multi_target_compound')] if hard_ok(EX[eid],sc) and len({roll(x) for x in EX[eid]['allm']|set(EX[eid]['compm'])}&set(targets))>=2]
    return order,blocks,widths,fails,multi

def transitions(sel):
    st=[e['station'] for e in sel.values()]; return sum(1 for a,b in zip(st,st[1:]) if a!=b)
def fam_dups(sel):
    c=Counter(e['fam'] for e in sel.values()); return {k:v for k,v in c.items() if v>1}
