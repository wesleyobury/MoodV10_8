"""Reference generator for QA: audit_engine + frozen ranking steps 6 (recency) and 7 (stable seed with swap_count).
No frozen rule is changed here; this only completes the ranking contract the audit engine approximated with an integer seed."""
import sys, hashlib, json, copy
from . import audit_engine as AE
from .audit_engine import *

# ---------------- WA v11 ranking: protected continuity, non-protected controlled variation (G1/G2/G3)
# PRESCRIPTION BANDS, Build Muscle row (canonical fixture goal): top of the listed duration expression
SETS_BY_CLASS={60:{'primary_compound':4,'secondary_compound':3,'accessory':3,'extra':2,'target_block':3},30:{'primary_compound':3,'secondary_compound':3,'accessory':2,'extra':0,'target_block':2}}
BAND={60:(12,16),30:(8,11)}   # WORKOUT STANDARDS row 9: meaningful working sets

def prev_pick(sc,aid,slot):
    """Continuity anchor for a protected slot: the immediately displayed composition when swapping, else the last completed session of this archetype."""
    if sc.get('swap',0)>0 and sc.get('displayed'): return sc['displayed'].get(slot)
    hist=[h for h in sc.get('history',[]) if h['archetype']==aid]
    return hist[-1].get('slots',{}).get(slot) if hist else None

def recency_penalty(e,aid,sc):
    """WA v11 rank 5 (non-protected only): family-level then exercise-level recency over the last 2 completed sessions of the same archetype."""
    hist=[h for h in sc.get('history',[]) if h['archetype']==aid]
    fam=0; ex=0
    for back,h in enumerate(reversed(hist[-2:])):
        w=2 if back==0 else 1
        fams={EX[x]['swap'] for x in h['exercises'] if x in EX}
        if e['swap'] in fams: fam=max(fam,w)
        if e['id'] in h['exercises']: ex=max(ex,w)
    return fam,ex

def swap_penalty(e,sc):
    """WA v11 Swap Workout (non-protected only): deprioritize the family, then the exercise, shown in the immediately displayed composition."""
    if sc.get('swap',0)<=0 or not sc.get('displayed'): return 0,0
    fam=0; ex=0
    chain=sc.get('displayed_chain') or [sc['displayed']]
    for back,comp in enumerate(reversed(chain)):
        w=2 if back==0 else 1   # immediately displayed composition weighs most; earlier compositions in the same swap chain still count
        shown=[EX[x] for x in comp.values() if x in EX]
        if any(e['swap']==x['swap'] for x in shown): fam=max(fam,w)
        if any(e['id']==x['id'] for x in shown): ex=max(ex,w)
    return fam,ex

def stable_seed(sc,aid,slot,eid,protected):
    """WA rank 7 stable seed. Protected slots hash without swap_count so a swap does not re-pick the primary."""
    key=f"{sc.get('user','qa_user')}|{sc.get('date','2026-09-22')}|{aid}|{slot}|{0 if protected else sc.get('swap',0)}|{eid}"
    return int(hashlib.md5(key.encode()).hexdigest(),16)%100000

def rank(cands,sc,sel,aid,slot,ctx,seed=0):
    T=ctx.get('target') or set(); protected=(aid,slot) in PROTECTED; anchor=prev_pick(sc,aid,slot)
    def key(t):
        e,v,b=t; tc=(2 if e['pm0'] in T else (1 if e['prims']&T else 0)) if T else 0
        if protected:
            # continuity first: verdict > State > Target > bias > continuity with the anchor > seed (no recency, no swap)
            return (-VR[v],-pred_score(e,sc,sel,aid,slot),-tc,-b,0 if e['id']==anchor else 1,stable_seed(sc,aid,slot,e['id'],True))
        fr,er=recency_penalty(e,aid,sc); sf,se=swap_penalty(e,sc)
        f=depth_first(aid,slot,sel); pd=-profile_distance(e,f) if f is not None else 0   # WA v14 ATD2 / v15 depth slots: prefer the more different profile
        ps=0 if SLOT_COND.get((aid,slot))=='state_bored_amped' else pred_score(e,sc,sel,aid,slot)   # v15: a slot the State itself activates is ranked by fit and rotation, not by the State predicate again
        # controlled variation: verdict > State > Target > swap/recency (family, then exercise) > profile distance (ATD) > bias > seed
        return (-VR[v],-ps,-tc,sf+fr,se+er,pd,-b,stable_seed(sc,aid,slot,e['id'],False))
    return sorted(cands,key=key)
SLOT_COND={(a,s_['slot']):s_.get('cond') for a in SLOTS for s_ in SLOTS[a]}
AE.rank=rank   # compose() resolves rank from module globals

DEFINING={'strength_upper_push':{'chest','shoulders','triceps'},'strength_upper_pull':{'back','biceps'},'strength_upper_mixed':{'chest','back'},'strength_arms':{'biceps','triceps'},
 'strength_lower_squat':{'quads','glutes'},'strength_lower_hinge':{'hamstrings','glutes'},'strength_glutes_legs':{'glutes'},'strength_full_body':set(),'strength_core':{'core'}}
ROTATION=['strength_lower_squat','strength_upper_pull','strength_upper_push','strength_glutes_legs','strength_upper_mixed','strength_lower_hinge','strength_arms','strength_full_body','strength_core']
def ctx_for(aid):
    return {'strength_upper_push':{'target':{'chest','triceps'}},'strength_upper_pull':{'target':{'back','biceps'}},'strength_upper_mixed':{'target':set()},'strength_lower_squat':{'target':{'quads','glutes'}},'strength_lower_hinge':{'target':{'hamstrings'}},'strength_glutes_legs':{'target':{'glutes'}},'strength_full_body':{'target':set(),'fb_upper':'pull'},'strength_core':{'target':{'core'}},'strength_arms':{'target':{'biceps','triceps'}}}[aid]
def dependent(aid,sore):
    if sore&DEFINING[aid]: return True
    s2=dict(sc_base()); s2['sore']=sore
    sel,w,fail,c=compose(aid,s2,60,ctx_for(aid)); return bool(fail) or bool(c.get('_soresec_req'))   # WA v12 S1(c): unavoidable secondary loading in a REQUIRED slot
def sc_base(): return dict(exp='intermediate',equip=FULL_GYM,space=FULL_SPACE,state=None,sore=set())

# ---------------- WA v15 SORENESS REROUTE RANKING (RR1-RR3): closest viable training intent, no hard-coded pairs
ARCH_REGION={'strength_upper_push':'upper','strength_upper_pull':'upper','strength_upper_mixed':'upper','strength_arms':'upper','strength_lower_squat':'lower','strength_lower_hinge':'lower','strength_glutes_legs':'lower','strength_full_body':'full','strength_core':'trunk'}
ARCH_CHAR={'strength_upper_push':'push','strength_upper_pull':'pull','strength_upper_mixed':'mixed','strength_arms':'arms','strength_lower_squat':'squat','strength_lower_hinge':'hinge','strength_glutes_legs':'glute_legs','strength_full_body':'full','strength_core':'core'}
CHAR_DIST={frozenset({'pull','arms'}):1,frozenset({'push','arms'}):1,frozenset({'mixed','push'}):1,frozenset({'mixed','pull'}):1,frozenset({'mixed','arms'}):1.5,
           frozenset({'squat','hinge'}):1,frozenset({'hinge','glute_legs'}):0.5,frozenset({'squat','glute_legs'}):1,frozenset({'push','pull'}):2,
           frozenset({'hinge','pull'}):1,frozenset({'glute_legs','pull'}):1.25,frozenset({'squat','push'}):1}   # cross-region chain affinity (posterior: hinge/pull; anterior: squat/push) breaks otherwise-equal upper<->lower jumps
def region_term(a,b):
    ra,rb=ARCH_REGION[a],ARCH_REGION[b]
    if rb=='trunk': return 3.5
    if ra==rb: return 0
    if 'full' in (ra,rb): return 1.5
    return 3
def char_term(a,b):
    ca,cb=ARCH_CHAR[a],ARCH_CHAR[b]
    if ca==cb: return 0
    if 'full' in (ca,cb): return 0.5   # region term already carries the Full Body distance
    return CHAR_DIST.get(frozenset({ca,cb}),1.5)
def intent_distance(orig,cand,sore,sc,reduced=False):
    r=region_term(orig,cand); c=char_term(orig,cand)
    shared=len((DEFINING[orig]-{roll(m) for m in sore})&DEFINING[cand]); credit=-min(1.0,0.5*shared)
    recent=[h['archetype'] for h in sc.get('history',[])[-2:]]; rec=1 if cand in recent else 0
    red=1 if reduced else 0   # RR2: a candidate that only builds below the working-set band floor under this soreness is a reduced session (+1)
    return round(r+c+credit+rec+red,2),dict(region=r,character=c,shared_intent_credit=credit,recency=rec,reduced_build=red)
def reroute(aid,sc,dur,reason_muscles):
    """RR1-RR3: score every non-dependent archetype that builds; pick the lowest intent distance; log every candidate."""
    table=[]; built={}
    for alt in ROTATION:
        if alt==aid: continue
        if dependent(alt,sc['sore']):
            table.append(dict(candidate=alt,viable=False,rejected='dependent on sore input (S1)')); continue
        sel,w,fail,c,l2=_build(alt,sc,dur,ctx_for(alt))
        if fail:
            table.append(dict(candidate=alt,viable=False,rejected='build failed: '+';'.join(fail))); continue
        reduced=est_sets(alt,{k:e['id'] for k,e in sel.items()},dur)<BAND[dur][0] if alt!='strength_core' else False
        d,terms=intent_distance(aid,alt,sc['sore'],sc,reduced)
        table.append(dict(candidate=alt,viable=True,distance=d,terms=terms,working_sets=est_sets(alt,{k:e['id'] for k,e in sel.items()},dur))); built[alt]=(sel,w,l2)
    viable=[t for t in table if t['viable']]
    if not viable: return None,table
    best=min(viable,key=lambda t:(t['distance'],ROTATION.index(t['candidate'])))
    for t in viable:
        if t is not best: t['rejected']=f"intent distance {t['distance']} > selected {best['distance']}"
    sel,w,l2=built[best['candidate']]
    log=[{'reason_code':'sore_reroute','from':aid,'to':best['candidate'],'muscles':reason_muscles,'distance':best['distance'],'terms':best['terms']},
         {'reason_code':'reroute_ranking','original':aid,'candidates':table}]+l2
    return dict(outcome='VALID ADAPTIVE REROUTE',archetype=best['candidate'],requested=aid,workout={k:e['id'] for k,e in sel.items()},widths={k:v[0] for k,v in w.items()},log=log),table

def two_set_slots(aid,W,dur):
    """WA v14 ATD1 (Upper Push / Pull: three accessory slots at 2 sets when the depth slot is filled) and WA v15 Arms (depth slots at 2 sets)."""
    if dur!=60: return set()
    if aid in ATD_FIRST and 'ancillary_depth' in W: return {'target_accessory',ATD_FIRST[aid][0],'ancillary_depth'}
    if aid=='strength_arms': return {'biceps_depth','triceps_depth','shoulder_depth'}
    return set()
def est_sets(aid,W,dur=60):
    cls={s['slot']:s['cls'] for s in SLOTS[aid]}; two=two_set_slots(aid,W,dur)
    return sum((2 if k in two else SETS_BY_CLASS[dur].get(cls.get(k),3)) for k in W)

def backfill(aid,sc,dur,sel,ctx,log):
    """WA v11 DURATION FILL: after required + default slots, if estimated working sets sit below the band floor, add eligible optional
    slots in Slot Priority order until the floor is reached or no eligible optional work remains. Never adds above the band ceiling."""
    lo,hi=BAND[dur]; added=[]
    for s in SLOTS[aid]:
        if est_sets(aid,sel,dur)>=lo: break
        inc=s['i60'] if dur==60 else s['i30']
        if inc!='optional' or s['slot'] in sel or s['cls'] in ('meta','computed'): continue
        if est_sets(aid,sel,dur)+SETS_BY_CLASS[dur].get(s['cls'],3)>hi: continue
        c=candidates(aid,s['slot'],sc,sel,ctx)
        if not c: continue
        best=rank(c,sc,sel,aid,s['slot'],ctx)[0][0]; sel[s['slot']]=best; added.append(s['slot'])
    # PROGRESSION + OUTPUT C6: if over band, remove lowest-priority optional/default work first (never required slots)
    removed=[]
    while est_sets(aid,sel,dur)>hi:
        cand=[s for s in reversed(SLOTS[aid]) if s['slot'] in sel and (s['i60'] if dur==60 else s['i30']) in ('optional','default')]
        if not cand: break
        del sel[cand[0]['slot']]; removed.append(cand[0]['slot'])
    if removed: log.append({'reason_code':'duration_trim','slots':removed,'working_sets':est_sets(aid,sel,dur),'band':[lo,hi]})
    if added: log.append({'reason_code':'duration_backfill','slots':added,'working_sets':est_sets(aid,sel,dur),'band':[lo,hi]})
    elif est_sets(aid,sel,dur)<lo: log.append({'reason_code':'duration_underfill_accepted','working_sets':est_sets(aid,sel,dur),'band':[lo,hi],'detail':'no eligible optional work remains'})
    order=[s['slot'] for s in SLOTS[aid]]
    if aid=='strength_upper_mixed':   # WA v12 sequencing: pushes, then pulls, then accessories
        def grp(k): e=sel[k]; return 0 if e['pat'] in PUSH else (1 if e['pat'] in PULL else 2)
        order=sorted([k for k in order if k in sel],key=lambda k:(grp(k),order.index(k)))
    return {k:sel[k] for k in order if k in sel}

def protected_change_log(aid,sc,dur,sel,ctx,log):
    for slot,e in sel.items():
        if (aid,slot) not in PROTECTED: continue
        anchor=prev_pick(sc,aid,slot)
        if anchor and anchor!=e['id']:
            keys=list(sel.keys()); before={k:sel[k] for k in keys[:keys.index(slot)]}
            pool=[c[0]['id'] for c in candidates(aid,slot,sc,before,ctx)]
            reason='anchor_ineligible_under_current_constraints (soreness / equipment / State cap / composition)' if anchor not in pool else 'anchor_outranked (verdict, State predicate, Target coverage or priority_bias changed)'
            log.append({'reason_code':'protected_primary_changed','slot':slot,'from':anchor,'to':e['id'],'reason':reason})

SLOT_TARGET={'strength_upper_pull':{'primary_pull':'back','complementary_pull':'back','secondary_back':'back'},'strength_upper_mixed':{'primary_pull':'back','secondary_upper':None,'opposing_secondary':None,'primary_push':'chest'},
 'strength_upper_push':{'primary_press':'chest','complementary_press':'chest','secondary_target_press':'chest'},'strength_lower_squat':{'primary_squat_pattern':'quads','secondary_lower':'quads'},
 'strength_lower_hinge':{'primary_posterior_compound':'hamstrings','complementary_posterior_compound':'glutes'},'strength_glutes_legs':{'primary_glute_compound':'glutes','complementary_lower_compound':'quads'},'strength_full_body':{'primary_lower':'quads','primary_upper':'back','true_full_body_bridge':None}}
def sore_substitute(aid,sc,sel,slot,ctx):
    """WA v12 S2: a sore-free exercise from the archetype's eligible set whose first primary muscle covers the slot's target muscle, swap family unused."""
    tm=SLOT_TARGET.get(aid,{}).get(slot)
    if tm is None:
        # class-bound slots: derive from the exercise the slot would have taken
        tm=sel[slot]['pm0'] if slot in sel else None
    used={e['swap'] for k,e in sel.items() if k!=slot}; used_ids={e['id'] for k,e in sel.items() if k!=slot}
    pool=[]
    for (a,sl),rows in ELIG.items():
        if a!=aid: continue
        for eid,v,cond,b in rows:
            e=EX[eid]
            if e['id'] in used_ids or e['swap'] in used or not hard_ok(e,sc): continue
            if v=='conditional' and not cond_true(cond,sc): continue
            if set(e['allm'])&sc['sore']: continue
            if tm and e['pm0']!=tm: continue
            pool.append((e,v,b))
    if not pool: return None
    return rank(pool,sc,{k:v for k,v in sel.items() if k!=slot},aid,slot,ctx)[0][0]

def _build(aid,sc,dur,ctx,mode='pick'):
    sel,w,fail,c=compose(aid,sc,dur,ctx)
    log=[{'reason_code':'adjustment','detail':x} for x in c['_log']]
    if aid in ATD_PAIRS and dur==60 and not fail:
        for first,depth,muscle in ATD_PAIRS[aid]:
            if depth in sel:
                # ATD3 softening: Low Energy keeps one ancillary exposure (Upper Push / Pull); on Arms the target depth stays and only the delt depth is softened
                soften=(sc.get('state')=='low_energy') and (aid!='strength_arms' or depth=='shoulder_depth')
                if soften:
                    log.append({'reason_code':'ancillary_depth_softened','state':'low_energy','slot':depth,'removed':sel[depth]['id'],'detail':'Low Energy keeps one direct exposure (ATD3)'}); del sel[depth]
                else:
                    a,b=sel[first],sel[depth]
                    log.append({'reason_code':'ancillary_depth','slot':depth,'muscle':muscle,'exposures':[a['id'],b['id']],'profile_differences':profile_distance(a,b),'family_reuse':a['swap']==b['swap']})
            elif first in sel and not (sc.get('sore') and muscle in {roll(m) for m in sc['sore']}):
                log.append({'reason_code':'ancillary_depth_unavailable','slot':depth,'muscle':muscle,'detail':'no profile-distinct candidate in pool'})
    if not fail and mode=='explicit' and sc.get('sore') and c.get('_soresec'):
        # at most one required slot may carry the sore muscle as secondary; substitute the rest with sore-free coverage
        keep=c['_soresec'][0]; removed=[]
        for slot in c['_soresec'][1:]:
            sub=sore_substitute(aid,sc,sel,slot,ctx)
            if sub is None:
                fail=[slot]; c['_sorefail']=[slot]; log.append({'reason_code':'sore_substitution_failed','slot':slot,'detail':'no sore-free substitute covering the slot target'}); break
            log.append({'reason_code':'sore_substitution','slot':slot,'removed':sel[slot]['id'],'removed_constraint':'slot movement-class constraint (sore-secondary pool)','substitute':sub['id'],'kept_target':True,'muscles':sorted(sc['sore'])})
            sel[slot]=sub
        if not fail: log.append({'reason_code':'sore_secondary_retained','slot':keep,'exercise':sel[keep]['id'],'muscles':sorted(sc['sore']),'detail':'one required slot keeps a sore-secondary exercise (S2 allowance)'})
    if not fail:
        sel=backfill(aid,sc,dur,sel,ctx,log); protected_change_log(aid,sc,dur,sel,ctx,log)
        log[:]=[l for l in log if not (l.get('reason_code')=='ancillary_depth' and l.get('slot') and l['slot'] not in sel)]
        if aid=='strength_arms' and 'optional_extra_burnout' in sel:
            b=sel['optional_extra_burnout']; same=[k for k,e in sel.items() if k!='optional_extra_burnout' and e['swap']==b['swap']]
            if same: log.append({'reason_code':'burnout_family_reuse','slot':'optional_extra_burnout','exercise':b['id'],'shares_family_with':same,'profile_distinct':True})
    return sel,w,fail,c,log

def custom_sore_override(targets,sc):
    sc=dict(sc); ov={m for m in sc.get('sore',set()) if roll(m) in set(targets)}
    if ov: sc['sore']=set(sc['sore'])-ov
    return sc,sorted(ov)

def generate(aid,sc,dur,ctx,mode='pick'):
    """Full generator path incl. SORENESS RESOLUTION S1-S3, duration fill and Swap Workout chain. Deterministic payload, no runtime metadata."""
    sc=dict(sc); override_log=[]
    if mode=='explicit' and sc.get('sore'):
        # WA v13 S2a: an explicit Target that names a sore muscle overrides the soreness for that muscle (user intent wins)
        named={roll(m) for m in (ctx.get('target') or set())}|set(DEFINING.get(aid,set()))
        ov={m for m in sc['sore'] if roll(m) in named}
        if ov:
            sc['sore']=set(sc['sore'])-ov
            override_log.append({'reason_code':'sore_override_by_explicit_target','muscles':sorted(ov),'detail':'user explicitly chose a Target that names this muscle; trained normally'})
    if sc.get('swap',0)>0 and not sc.get('displayed'):
        # the displayed composition is the deterministic result at swap_count-1 with identical inputs
        prev=generate(aid,dict(sc,swap=sc['swap']-1),dur,ctx,mode); sc['displayed']=prev.get('workout',{})
        sc['displayed_chain']=(prev.get('_chain') or [])+[sc['displayed']]
    log=list(override_log)
    def finish(out):
        out['_chain']=(sc.get('displayed_chain') or [])+[out['workout']] if sc.get('swap',0)>0 else [out['workout']]
        if sc.get('swap',0)>0 and out['workout']:
            before=sc['displayed']; after=out['workout']
            changed=[k for k in set(before)|set(after) if before.get(k)!=after.get(k)]
            out['log'].append({'reason_code':'workout_swapped','swap_count':sc['swap'],'prior_composition':before,'replacement_composition':after,'slots_changed':sorted(changed)})
        return out
    if sc.get('sore') and mode=='pick' and dependent(aid,sc['sore']):
        out,table=reroute(aid,sc,dur,sorted(sc['sore']&DEFINING[aid]) or ['required slot emptied'])
        if out: out['log']=log+out['log']; return finish(out)
        return dict(outcome='ACTUAL GENERATOR FAILURE',archetype=aid,requested=aid,workout={},log=[{'reason_code':'generator_failure','detail':'no recovered archetype','candidates':table}])
    sel,w,fail,c,l2=_build(aid,sc,dur,ctx,mode); log+=l2
    if not fail:
        return finish(dict(outcome='VALID BUILD',archetype=aid,requested=aid,workout={k:e['id'] for k,e in sel.items()},widths={k:v[0] for k,v in w.items()},log=log))
    if sc.get('sore') and set(fail)<=set(c['_sorefail']):
        if mode=='pick':
            out,table=reroute(aid,sc,dur,['required slot emptied: '+';'.join(fail)])
            if out: out['log']=log+out['log']; return finish(out)
            return dict(outcome='ACTUAL GENERATOR FAILURE',archetype=aid,requested=aid,workout={},log=[{'reason_code':'generator_failure','candidates':table}])
        log.append({'reason_code':'sore_terminal_conflict','empty_slots':fail,'options':['Change Target','MOOD Alternative','Cancel Edit']})
        return dict(outcome='VALID TERMINAL CONFLICT',archetype=aid,requested=aid,workout={},log=log)
    return dict(outcome='ACTUAL GENERATOR FAILURE',archetype=aid,requested=aid,workout={},log=[{'reason_code':'generator_failure','empty_slots':fail}])

# ---------------- independent validator (frozen rules re-stated, not reusing compose internals)
def validate(payload,aid_req,sc,dur,ctx,expected):
    """Returns list of (check, ok, detail)."""
    R=[]
    oc=payload['outcome']; R.append(('outcome_class',oc==expected,f"expected {expected} got {oc}"))
    if oc in ('VALID TERMINAL CONFLICT','ACTUAL GENERATOR FAILURE'):
        R.append(('no_partial_workout',payload['workout']=={},'partial workout emitted' if payload['workout'] else ''))
        if oc=='VALID TERMINAL CONFLICT':
            lg=[l for l in payload['log'] if l.get('reason_code')=='sore_terminal_conflict']
            R.append(('terminal_log',bool(lg) and lg[0]['options']==['Change Target','MOOD Alternative','Cancel Edit'],''))
        return R
    aid=payload['archetype']; W=payload['workout']; ex=[EX[e] for e in W.values()]
    if oc=='VALID ADAPTIVE REROUTE':
        lg=[l for l in payload['log'] if l.get('reason_code')=='sore_reroute']
        R.append(('reroute_log',bool(lg) and lg[0]['from']==aid_req and lg[0]['to']==aid and bool(lg[0]['muscles']),'missing sore_reroute log or fields'))
    # required slots by duration
    req=[s['slot'] for s in SLOTS[aid] if (s['i60'] if dur==60 else s['i30'])=='required' and s['cls'] not in ('meta','computed')]
    relaxed_bridge=any('bridge_relaxed_beginner_constrained_state' in str(l.get('detail','')) for l in payload['log'])
    missing=[s for s in req if s not in W and not (relaxed_bridge and s=='true_full_body_bridge' and sc['exp']=='beginner')]; R.append(('required_slots',not missing,f"missing {missing}"))
    if relaxed_bridge:
        covered={region(m) for e in ex for m in e['prim']}
        R.append(('bridge_relaxation_coverage',{'upper','lower'}<=covered and 'core' in W,f"regions {covered}"))
    R.append(('no_duplicate_exercise_id',len(set(W.values()))==len(W),''))
    # swap-family distinctness across non-block slots (GENERATOR SCHEMA CONTRACT B32 rule 2)
    # WA v14 ATD2: the ancillary_depth slot may reuse the first ancillary exposure's family when the stimulus profile is distinct (logged)
    atd=[l for l in payload['log'] if l.get('reason_code')=='ancillary_depth']
    reuse_ok={l.get('slot','ancillary_depth') for l in atd if l.get('family_reuse')}|{l['slot'] for l in payload['log'] if l.get('reason_code')=='burnout_family_reuse'}
    exl=[e for k,e in ((k,EX[v]) for k,v in W.items()) if k not in reuse_ok]
    sw=Counter(e['swap'] for e in exl); dup=[k for k,v in sw.items() if v>1]
    relaxed=any('relaxation_a_swap_family' in str(l.get('detail','')) for l in payload['log'])
    R.append(('swap_family_distinct',(not dup) or relaxed,f"shared {dup}"+(' (relaxed+logged)' if relaxed else ' without logged relaxation')))
    for first,depth,muscle in ATD_PAIRS.get(aid,[]):
        if depth in W and first in W and depth!='shoulder_depth':
            a=EX[W[first]]; b=EX[W[depth]]
            R.append(('ancillary_depth_profile_distinct',profile_distinct(a,b),f"{a['id']} vs {b['id']} ({profile_distance(a,b)} attributes differ)"))
        if depth=='shoulder_depth' and depth in W and first in W:
            a=EX[W[first]]; b=EX[W[depth]]
            R.append(('shoulder_depth_distinct',a['prim'][0]!=b['prim'][0] or profile_distinct(a,b),f"{a['id']} vs {b['id']}"))
    cap=max(1,min(5,CAP[sc['exp']]+STATE_CAP.get(sc.get('state'),0)))
    ov=set().union(*[set(l.get('muscles',[])) for l in payload['log'] if l.get('reason_code')=='sore_override_by_explicit_target']) if payload['log'] else set()
    eff_sore=set(sc.get('sore',set()))-ov   # WA v13 S2a: muscles the explicit Target names are trained normally
    if aid=='strength_arms' and dur==60 and oc=='VALID BUILD':
        bi=sum(1 for e in ex if e['pm0']=='biceps'); tr=sum(1 for e in ex if e['pm0']=='triceps'); sh=sum(1 for e in ex if e['pm0']=='shoulders')
        R.append(('arms_60_depth',bi>=2 and tr>=2 and (sh>=1 or 'shoulders' in {roll(m) for m in eff_sore}),f"biceps {bi} triceps {tr} shoulders {sh}"))
    if aid=='strength_arms':
        cc=W.get('compound_combination')
        R.append(('arms_compound_conditional',cc is None or sc.get('state') in ('bored','amped'),f"compound_combination present under state {sc.get('state')}"))
    for e in ex:
        R.append(('sore_primary_absent',not (set(e['prim'])&eff_sore),e['id']))
        R.append(('skill_le_experience',RANK[e['skill']]<=RANK[sc['exp']],e['id']))
        R.append(('complexity_le_cap',e['cx']<=cap,e['id']))
        R.append(('equipment_available',e['eq'] in sc['equip'] and all(q in sc['equip'] for q in e['req']),e['id']))
        R.append(('space_available',e['space'] in sc['space'],e['id']))
        R.append(('active',e['active'],e['id']))
        R.append(('direction_invariant_strength_modality',e['mod'] in ('resistance','bodyweight'),e['id']))
    # eligibility + conditions: each selected exercise must be mapped to its slot with a TRUE verdict/condition
    for slot,eid in W.items():
        rows=[x for x in ELIG[(aid,slot)] if x[0]==eid]
        ok=bool(rows) and rows[0][1] in ('preferred','allowed','conditional') and (rows[0][1]!='conditional' or cond_true(rows[0][2],sc))
        if not ok and any(l.get('reason_code')=='sore_substitution' and l.get('slot')==slot and l.get('substitute')==eid for l in payload['log']):
            ok=any(x[0]==eid for (a,sl),rws in ELIG.items() if a==aid for x in rws)   # WA v12 S2: substitute comes from the archetype's eligible set, logged
        R.append(('eligibility_and_condition',ok,f"{slot}:{eid}"))
    # Target coverage (explicit Target archetypes): each Target muscle covered by some primary muscle
    T=ctx.get('target') or set()
    if T and oc=='VALID BUILD':
        cov={m for e in ex for m in e['prims']}; R.append(('target_coverage',T<=cov,f"uncovered {T-cov}"))
    # Direction invariant: not isolation-only (Arms excepted by design: curls/extensions are the archetype)
    if aid not in ('strength_arms','strength_core'): R.append(('direction_invariant_has_compound',any(e['cls']!='isolation' for e in ex),''))
    # duration expression (WORKOUT STANDARDS row 7/8; Core Section C)
    sets=est_sets(aid,W,dur); lo,hi=BAND[dur]
    underfill_ok=any(l.get('reason_code')=='duration_underfill_accepted' for l in payload['log'])
    if aid=='strength_core': R.append(('duration_fill',2<=len(W)<=4,f"{len(W)} core exercises (Section C: 2–4)"))
    else: R.append(('duration_fill',(lo<=sets<=hi) or (sets<lo and underfill_ok),f"{sets} working sets at {dur} min (band {lo}–{hi}); {len(W)} exercises"))
    if sc.get('swap',0)>0:
        R.append(('workout_swapped_log',any(l.get('reason_code')=='workout_swapped' for l in payload['log']),''))
    R.append(('explanation_log_present',isinstance(payload['log'],list),''))
    return R
