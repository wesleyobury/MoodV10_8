"""WA v15 STRUCTURE SELECTION (ST1-ST4): workout structure as an executable generator dimension.
Input: an archetype, its prescribed rows (exercise, sets, reps, rest, RIR), the scenario (State, experience, equipment, soreness), duration.
Output: ordered blocks {block_id, structure_id, items[{slot, exercise_id, sets|rounds, reps|scheme, rir}], rounds, rest_between_items, rest_after_round, reason}
plus a structure log. Deterministic: the only free choice (the Bored pattern) is fixed by hash(user, date, archetype, swap)."""
import sys, hashlib
from .qa_engine import *

PORTABLE={'dumbbells','ez_bar','kettlebell','bands','plate','bodyweight'}
ANTAGONIST={frozenset({'biceps','triceps'}),frozenset({'chest','back'}),frozenset({'quads','hamstrings'}),frozenset({'shoulders','biceps'}),frozenset({'shoulders','triceps'}),
            frozenset({'quads','glutes'}),frozenset({'hamstrings','quads'}),frozenset({'glutes','hamstrings'}),frozenset({'back','shoulders'}),frozenset({'chest','shoulders'}),frozenset({'calves','core'})}
FORCEFUL_FINISHER=['kettlebell_swing','db_clean_to_press','kb_clean_and_press','db_snatch','sled_push','farmer_carry','suitcase_carry']   # library forceful_safe / carry pool, in coach preference order
BORED_PATTERNS=['superset_pyramid','superset_ladder','triset_circuit','antagonist_superset_ladder']
WORK=45   # seconds of work per set (est model)

def _e(r): return EX[r['eid']]
def is_heavy(r,aid):
    e=_e(r); return r.get('protected') or r['cls']=='primary_compound' or (e['cx']>=3 and e['eq'] in ('barbell','trap_bar'))
def pairable(r,aid):
    e=_e(r)
    if is_heavy(r,aid) or e['prec'] or e['cls']=='integrated' or e['combo']: return False
    return r['cls'] in ('accessory','extra') or (r['cls'] in ('secondary_compound','target_block') and e['cx']<=2)
def equipment_ok(a,b,same_station_only=False):
    ea,eb=_e(a),_e(b)
    if ea['station']==eb['station']: return True
    if same_station_only: return False
    return ea['eq'] in PORTABLE or eb['eq'] in PORTABLE
def muscles_ok(a,b):
    ea,eb=_e(a),_e(b)
    if ea['pm0']==eb['pm0']: return False
    if frozenset({ea['pm0'],eb['pm0']}) in ANTAGONIST or region(ea['pm0'])!=region(eb['pm0']): return True
    # same region, non-antagonist: allowed only when neither movement loads the other's prime mover (no shared fatigue), e.g. pullover + curl
    return ea['pm0'] not in eb['secs'] and eb['pm0'] not in ea['secs'] and not (ea['prims']&eb['prims'])
def compatible(a,b,same_station_only=False,antagonist_only=False):
    if not (pairable(a,None) and pairable(b,None)): return False
    if a['sets']!=b['sets']: return False   # ST1: paired work is emitted as whole rounds; unequal set counts are not paired
    if antagonist_only and frozenset({_e(a)['pm0'],_e(b)['pm0']}) not in ANTAGONIST: return False
    return muscles_ok(a,b) and equipment_ok(a,b,same_station_only)

def _reps_int(r):
    try: return int(str(r['reps']).split('/')[0].split('–')[0])
    except: return None
def straight(r,bid,reason='straight'):
    return dict(block_id=bid,structure_id='straight',items=[dict(slot=r['slot'],exercise_id=r['eid'],name=r['name'],sets=r['sets'],reps=r['reps'],rir=r['rir'])],rounds=r['sets'],rest_between_items=0,rest_after_round=r['rest'],reason=reason)
def superset(a,b,bid,reason):
    rounds=min(a['sets'],b['sets']); rest=max(60,max(a['rest'],b['rest'])-15)
    blk=dict(block_id=bid,structure_id='superset',items=[dict(slot=a['slot'],exercise_id=a['eid'],name=a['name'],sets=rounds,reps=a['reps'],rir=a['rir']),dict(slot=b['slot'],exercise_id=b['eid'],name=b['name'],sets=rounds,reps=b['reps'],rir=b['rir'])],
             rounds=rounds,rest_between_items=15,rest_after_round=rest,reason=reason)
    extra=[]
    for r in (a,b):
        if r['sets']>rounds: extra.append(dict(r,sets=r['sets']-rounds))
    return blk,extra
def circuit(rs,bid,reason):
    rounds=min(r['sets'] for r in rs)
    blk=dict(block_id=bid,structure_id='circuit',items=[dict(slot=r['slot'],exercise_id=r['eid'],name=r['name'],sets=rounds,reps=r['reps'],rir=r['rir']) for r in rs],rounds=rounds,rest_between_items=15,rest_after_round=90,reason=reason)
    extra=[dict(r,sets=r['sets']-rounds) for r in rs if r['sets']>rounds]
    return blk,extra
def pyramid(r,bid,reason):
    base=_reps_int(r)
    if base is None or r['sets']<3: return straight(r,bid,'pyramid not applicable (timed or bodyweight reps); straight')
    n=r['sets']; scheme=[max(4,base+(n-1-2*i)) for i in range(n)]   # 3 sets: +2 / 0 / -2 reps; 4 sets: +3 / +1 / -1 / -3; load rises each set
    return dict(block_id=bid,structure_id='pyramid',items=[dict(slot=r['slot'],exercise_id=r['eid'],name=r['name'],sets=n,reps='/'.join(str(x) for x in scheme),scheme=scheme,rir=r['rir'],load='ascending each set')],rounds=n,rest_between_items=0,rest_after_round=r['rest'],reason=reason)
def ladder(r,bid,reason):
    base=_reps_int(r)
    if base is None: return straight(r,bid,'ladder not applicable (timed); straight')
    n=max(3,r['sets']); scheme=[base+3,base,max(6,base-3)][:n] if n==3 else [base+3,base,max(6,base-3),max(5,base-5)]
    return dict(block_id=bid,structure_id='ladder',items=[dict(slot=r['slot'],exercise_id=r['eid'],name=r['name'],sets=len(scheme),reps='/'.join(str(x) for x in scheme),scheme=scheme,rir=max(0,r['rir']),load='same load, reps descend')],rounds=len(scheme),rest_between_items=0,rest_after_round=30,reason=reason)

def burnout_candidate(aid,W,sc,ctx,seed):
    """Amped finisher: an isolation for a defining / Target muscle from the archetype's own eligible set; passes every hard filter incl. soreness; family reuse allowed for a burnout."""
    want=set(DEFINING.get(aid,set()))|{roll(m) for m in (ctx.get('target') or set())}
    if aid=='strength_arms': want={'biceps','triceps','shoulders'}
    if aid=='strength_full_body': want={'shoulders','biceps','triceps','glutes','quads'}
    used={EX[x]['id'] for x in W.values()}; pool={}
    for (a,slot),rows in ELIG.items():
        if a!=aid: continue
        for eid,v,cond,b in rows:
            e=EX[eid]
            if eid in used or not hard_ok(e,sc) or e['cls']!='isolation' or e['pm0'] not in want: continue
            if sc.get('sore') and set(e['allm'])&sc['sore']: continue
            if v=='conditional' and not cond_true(cond,sc): continue
            pool[eid]=e
    if not pool: return None
    fam_used={EX[x]['swap'] for x in W.values()}
    def key(e): return (0 if e['swap'] not in fam_used else 1,{'supported':0,'semi_supported':1,'unsupported':2}[e['sup']],int(hashlib.md5(f"{seed}|finisher|{e['id']}".encode()).hexdigest(),16)%1000)
    return sorted(pool.values(),key=key)[0]
FORCEFUL_TIER={'kettlebell_swing':0,'db_clean_to_press':0,'kb_clean_and_press':0,'db_snatch':0,'sled_push':1,'farmer_carry':1,'suitcase_carry':1}
def forceful_candidate(aid,W,sc,seed='qa_user|2026-09-22'):
    """Irritated finisher: explosive hinge / clean tier first, then carries and sled; within a tier the stable seed rotates the pick."""
    used={x for x in W.values()}; pool=[]
    for eid in FORCEFUL_FINISHER:
        e=EX.get(eid)
        if not e or eid in used or not hard_ok(e,sc): continue
        if sc.get('sore') and set(e['allm'])&sc['sore']: continue
        pool.append(e)
    if not pool: return None
    return sorted(pool,key=lambda e:(FORCEFUL_TIER[e['id']],int(hashlib.md5(f"{seed}|{aid}|{sc.get('swap',0)}|forceful|{e['id']}".encode()).hexdigest(),16)%1000))[0]

def build_blocks(aid,rows,sc,dur,ctx,W,seed_key='qa_user|2026-09-22'):
    """ST3 State bindings. rows: prescribed rows in presentation order. Returns (blocks, log, finisher_rows)."""
    st=sc.get('state'); exp=sc['exp']; log=[]; blocks=[]; used=set(); bid=[0]
    def nb(): bid[0]+=1; return f"B{bid[0]}"
    def place(r): used.add(r['slot'])
    def one_superset(pool,reason,same_station_only=False,antagonist_only=False):
        for i in range(len(pool)):
            for j in range(i+1,len(pool)):
                a,b=pool[i],pool[j]
                if compatible(a,b,same_station_only,antagonist_only):
                    blk,extra=superset(a,b,nb(),reason); place(a); place(b); return blk,extra
        return None,[]
    if aid=='strength_core':
        for r in rows: blocks.append(straight(r,nb(),'Core formats unchanged (straight)'))
        return blocks,[{'reason_code':'structure_selected','state':st,'pattern':'straight','emitted':'straight','detail':'Core left unchanged in v15','blocks':[('straight',[it['exercise_id'] for it in b['items']]) for b in blocks]}],[]
    pool=[r for r in rows if pairable(r,aid)]
    pattern='straight'; finisher=None; extras=[]
    if st is None:
        if dur==30:
            blk,extras=one_superset(pool,'Normal 30: one accessory superset to fit time (B26)')
            if blk: blocks.append(blk); pattern='one_accessory_superset'
    elif st=='low_energy':
        pattern='straight'
    elif st=='stressed':
        blk,extras=one_superset([r for r in pool if r['cls'] in ('accessory','extra')],'Stressed: one predictable same-station pairing',same_station_only=True)
        if blk: blocks.append(blk); pattern='same_station_pairing'
    elif st=='bored':
        idx=int(hashlib.md5(f"{seed_key}|{aid}|{sc.get('swap',0)}|bored".encode()).hexdigest(),16)%4
        pattern=BORED_PATTERNS[idx]
        if pattern=='triset_circuit' and exp=='beginner': pattern='superset_pyramid'; log.append({'reason_code':'structure_adjusted','detail':'beginner: circuit replaced by superset + pyramid (ST2)'})
        if pattern=='triset_circuit':
            acc=[r for r in pool if r['cls'] in ('accessory','extra')]; done=False
            import itertools
            for trip in itertools.combinations(acc,3):
                if len({r['sets'] for r in trip})!=1: continue
                for a,b,c in itertools.permutations(trip):
                    if _e(a)['pm0']!=_e(b)['pm0'] and _e(b)['pm0']!=_e(c)['pm0'] and equipment_ok(a,b) and equipment_ok(b,c) and equipment_ok(a,c):   # adjacent items never share a prime mover
                        blk,extras=circuit([a,b,c],nb(),'Bored: accessory tri-set circuit'); blocks.append(blk); place(a); place(b); place(c); done=True; break
                if done: break
            if not done:
                pattern='superset_pyramid'; log.append({'reason_code':'structure_adjusted','detail':'no three compatible accessories for a circuit; superset + pyramid'})
        if pattern in ('superset_pyramid','superset_ladder','antagonist_superset_ladder'):
            blk,extras=one_superset(pool,'Bored: accessory superset',antagonist_only=(pattern=='antagonist_superset_ladder'))
            if blk is None and pattern=='antagonist_superset_ladder': blk,extras=one_superset(pool,'Bored: accessory superset (no antagonist pair available)')
            if blk: blocks.append(blk)
            if pattern=='superset_pyramid':
                cand=[r for r in rows if r['slot'] not in used and not r.get('protected') and r['cls'] in ('secondary_compound','target_block') and r['sets']>=3 and _e(r)['cls']=='compound' and _e(r)['pm0']!='core' and _e(r)['eq']!='bodyweight' and _reps_int(r)]
                if not cand: cand=[r for r in rows if r['slot'] not in used and not r.get('protected') and r['cls']=='accessory' and r['sets']>=3 and _e(r)['pm0']!='core' and _e(r)['eq']!='bodyweight' and _reps_int(r)]
                if cand: blocks.append(pyramid(cand[0],nb(),'Bored: pyramid on a non-protected secondary')); place(cand[0])
            else:
                cand=[r for r in rows if r['slot'] not in used and _e(r)['cls']=='isolation' and not r.get('protected') and _e(r)['pm0']!='core' and _reps_int(r)]
                if cand: blocks.append(ladder(cand[-1],nb(),'Bored: descending ladder on an isolation')); place(cand[-1])
    elif st=='amped':
        acc=[r for r in pool if r['cls'] in ('accessory','extra')]
        blk,ex1=one_superset(acc,'Amped: density superset on accessories')
        if blk: blocks.append(blk); extras+=ex1; pattern='density_superset'
        rest_acc=[r for r in acc if r['slot'] not in used]
        blk2,ex2=one_superset(rest_acc,'Amped: second density superset')
        if blk2: blocks.append(blk2); extras+=ex2
        if dur==60:
            fe=burnout_candidate(aid,W,sc,ctx,seed_key)
            if fe:
                reps='20' if fe['pm0'] not in ('calves',) else '25'
                finisher=dict(block_id='F1',structure_id='finisher',items=[dict(slot='finisher',exercise_id=fe['id'],name=fe['name'],sets=2,reps=reps,rir=0)],rounds=2,rest_between_items=0,rest_after_round=30,reason='Amped: burnout finisher (Extras 1; expresses Volume +1)')
                pattern=pattern+'+burnout_finisher'
            else: log.append({'reason_code':'structure_fallback','detail':'Amped: no sore-free isolation available for a burnout finisher; Volume +1 stays a straight set'})
    elif st=='irritated':
        acc=[r for r in pool if r['cls'] in ('accessory','extra')]
        blk,ex1=one_superset(acc,'Irritated: one forceful accessory pairing',antagonist_only=True)
        if blk is None: blk,ex1=one_superset(acc,'Irritated: one accessory pairing')
        if blk: blocks.append(blk); extras+=ex1; pattern='accessory_superset'
        if dur==60:
            fe=forceful_candidate(aid,W,sc,seed_key)
            if fe:
                m=fe['id']; reps={'kettlebell_swing':'15','db_clean_to_press':'8','kb_clean_and_press':'6/side','db_snatch':'6/side','sled_push':'20 m','farmer_carry':'30 m','suitcase_carry':'25 m/side'}.get(m,'12')
                finisher=dict(block_id='F1',structure_id='finisher',items=[dict(slot='finisher',exercise_id=fe['id'],name=fe['name'],sets=3,reps=reps,rir=1)],rounds=3,rest_between_items=0,rest_after_round=45,reason='Irritated: forceful repeated-effort finisher (forceful_safe pool)')
                pattern=pattern+'+forceful_finisher'
            else: log.append({'reason_code':'structure_fallback','detail':'Irritated: no forceful_safe candidate passes equipment / complexity / soreness filters; straight sets kept'})
    # everything not placed -> straight, in presentation order; leftover sets from unequal pairings appended as straight
    rest_blocks=[]
    for r in rows:
        if r['slot'] not in used: rest_blocks.append(straight(r,nb()))
    for r in extras: rest_blocks.append(straight(r,nb(),'remaining sets after pairing'))
    # presentation: blocks follow the prescribed exercise order (main lifts first, Arms compound first); a paired block sits where its earliest item sat; finisher last
    pos={r['slot']:i for i,r in enumerate(rows)}
    allb=blocks+rest_blocks
    def bkey(b):
        k=min(pos.get(it['slot'],99) for it in b['items'])
        return (k,1 if b['reason']=='remaining sets after pairing' else 0)
    blocks=sorted(allb,key=bkey)
    for i,b in enumerate(blocks,1): b['block_id']=f"B{i}"; b['sequence_index']=i
    if finisher: finisher['sequence_index']=len(blocks)+1; blocks.append(finisher)
    emitted='+'.join(sorted({b['structure_id'] for b in blocks}))
    log.insert(0,{'reason_code':'structure_selected','state':st,'pattern':pattern,'emitted':emitted,'blocks':[(b['structure_id'],[it['exercise_id'] for it in b['items']]) for b in blocks]})
    fin_rows=[dict(slot='finisher',role='Finisher',cls='finisher',eid=finisher['items'][0]['exercise_id'],name=finisher['items'][0]['name'],sets=finisher['rounds'],reps=finisher['items'][0]['reps'],rest=finisher['rest_after_round'],rir=finisher['items'][0]['rir'])] if finisher else []
    return blocks,log,fin_rows

def est_minutes_blocks(blocks,dur):
    t=(7 if dur==60 else 4)*60
    for b in blocks:
        n=len(b['items']); r=b['rounds']; rest=b['rest_after_round']
        if b['structure_id'] in ('straight','pyramid','ladder'): t+=r*(WORK+rest)-rest+75
        elif b['structure_id']=='superset': t+=r*(2*WORK+15+rest)-rest+90
        elif b['structure_id']=='circuit': t+=r*(n*WORK+(n-1)*15+rest)-rest+90
        elif b['structure_id']=='finisher': t+=r*(40+rest)-rest+60
    return round(t/60)

# ---------------- structure validator (independent restatement of ST1-ST3)
ALLOWED_BY_STATE={None:{'straight','superset'},'low_energy':{'straight'},'stressed':{'straight','superset'},'bored':{'straight','superset','circuit','pyramid','ladder'},
                  'amped':{'straight','superset','finisher'},'irritated':{'straight','superset','finisher'}}
def validate_blocks(aid,blocks,rows,sc,dur):
    R=[]; st=sc.get('state'); byslot={r['slot']:r for r in rows}
    cover=Counter(it['slot'] for b in blocks for it in b['items'] if it['slot']!='finisher')
    R.append(('blocks_cover_each_exercise_once',set(cover)==set(byslot) and all(v>=1 for v in cover.values()),f"{dict(cover)} vs {list(byslot)}"))
    # sets conserved: sum of item sets across blocks == prescribed sets per slot
    sets_by={}
    for b in blocks:
        for it in b['items']:
            if it['slot']!='finisher': sets_by[it['slot']]=sets_by.get(it['slot'],0)+it['sets']
    bad=[s for s in byslot if sets_by.get(s,0)!=byslot[s]['sets'] and blocks and not any(b['structure_id']=='ladder' and b['items'][0]['slot']==s for b in blocks)]
    R.append(('working_sets_conserved',not bad,f"mismatch {bad}"))
    ids={b['structure_id'] for b in blocks}
    R.append(('structures_allowed_for_state',ids<=ALLOWED_BY_STATE[st],f"{ids-ALLOWED_BY_STATE[st]} under {st}"))
    R.append(('no_amrap_emom_complex',not (ids&{'amrap','emom','complex'}),''))
    if st is None and dur==60: R.append(('normal_60_straight',ids=={'straight'},str(ids)))
    if aid=='strength_core': R.append(('core_unchanged',ids=={'straight'},str(ids)))
    for b in blocks:
        if b['structure_id'] in ('superset','circuit','complex'):
            for it in b['items']:
                r=byslot[it['slot']]; R.append(('no_heavy_or_protected_in_pairing',not is_heavy(r,aid) and not EX[r['eid']]['prec'],f"{it['exercise_id']} in {b['structure_id']}"))
            if b['structure_id']=='superset':
                a,c=byslot[b['items'][0]['slot']],byslot[b['items'][1]['slot']]
                R.append(('superset_pair_compatible',compatible(a,c,same_station_only=(st=='stressed')),f"{a['eid']} + {c['eid']}"))
            if b['structure_id']=='circuit':
                R.append(('circuit_not_beginner',sc['exp']!='beginner',''))
                R.append(('circuit_accessory_only',all(byslot[it['slot']]['cls'] in ('accessory','extra') for it in b['items']),''))
        if b['structure_id']=='pyramid': R.append(('pyramid_not_protected',not byslot[b['items'][0]['slot']].get('protected') and byslot[b['items'][0]['slot']]['cls']!='primary_compound',b['items'][0]['exercise_id']))
        if b['structure_id']=='finisher':
            e=EX[b['items'][0]['exercise_id']]
            R.append(('finisher_passes_hard_filters',hard_ok(e,sc) and not (sc.get('sore') and set(e['allm'])&sc['sore']),e['id']))
            R.append(('finisher_last',b is blocks[-1],''))
            R.append(('finisher_not_duplicate',e['id'] not in {r['eid'] for r in rows},e['id']))
            if st=='irritated': R.append(('irritated_finisher_forceful',e['forceful'] or e['pat']=='carry',e['id']))
            if st=='amped': R.append(('amped_finisher_isolation',e['cls']=='isolation',e['id']))
    return R
