"""Independent Sweat validator: invariants I1-I6, safety J1-J6, structure gates, Target, soreness, duration.
Reads only the emitted workout + exercise records; returns [(check, ok, detail)]."""
from .sweat_gen import EX, block_minutes, est, BAND, MIN_BOUT, cue_for, duty_cycle, DUTY_MIN
from .sweat_data import *

SWEAT_STRUCTS={'intervals','circuit','emom','ladder','pyramid','continuous','finisher'}
def block_items(b):
    """(exercise, dose) pairs for every item actually performed in the block, all rounds."""
    if b.get('anchor'):
        out=[(b['anchor'],b['anchor_dose'])]
        for rs in b['round_stations']: out+=rs
        return out
    if 'doses' in b: return list(zip(b['items_e'],b['doses']))
    return [(e,None) for e in b['items_e']]

def validate(w):
    C=[]; ctx=w['_ctx']; exp=ctx['experience']; st=ctx['states']; d=w['dials']
    def chk(name,ok,detail=''): C.append((name,bool(ok),detail))
    if w['outcome']!='VALID BUILD' and w['outcome']!='VALID ADAPTIVE REROUTE':
        chk('outcome_not_failure',w['outcome']!='ACTUAL GENERATOR FAILURE',w['outcome']); return C
    B=w['blocks']; aid=w['archetype_id']; dur=w['duration']
    # I1
    prim=[b for b in B if b['slot'].startswith('primary')]
    chk('I1_one_primary_first',len(prim)==1 and B[0] is prim[0])
    chk('I1_sweat_structures_only',all(b['structure'] in SWEAT_STRUCTS for b in B),[b['structure'] for b in B])
    # I2
    p=B[0]; roles=[e['role'] for e,_ in block_items(p)]
    # SC4 (replaces I2): a conditioning driver in every primary block; resistance-only Circuit only as a logged, timed, dense, whole-body fallback
    ro=any(a['reason_code']=='conditioning_driver_resistance_only' for a in w['adjustments'])
    has_driver=any(r in ('engine','output') for r in roles)
    chk('SC4_conditioning_driver',has_driver or (ro and aid=='sweat_circuit' and p['structure'] in ('intervals','emom') and duty_cycle(p,exp)>=DUTY_MIN
        and sum(e['sysd']>=3 for e in p['items_e'])>=2 and any((e['cls']=='integrated' or (e['pat'] in ('squat','lunge','hinge') and e['sysd']>=3)) for e in p['items_e'])),p['structure'])
    if aid=='sweat_hybrid': chk('SC4_hybrid_anchor_every_round',p.get('anchor') is not None and len(p['round_stations'])>=2)
    # SC1: the clock / output governs the primary block; no set -> long passive rest -> set
    chk('SC1_primary_structure',p['structure'] in ('continuous','intervals','circuit','emom','pyramid'),p['structure'])
    for b in B:
        if b['structure']=='circuit' and not b.get('anchor'):
            rt=sum(est(x,dz,exp) for x,dz in zip(b['items_e'],b['doses']))+10*len(b['items_e'])
            chk('SC1_round_rest_below_round_work',b['round_rest']<=rt,f"{b['round_rest']}s rest vs {rt:.0f}s work")
        for e,dz in block_items(b):
            chk('SC1_output_prescription',dz is None or dz['kind'] in ('reps','time','distance','calories'))
    # SC3: duty cycle of the primary block
    chk('SC3_primary_duty_cycle',duty_cycle(p,exp)>=DUTY_MIN-1e-9,f"{duty_cycle(p,exp):.2f}")
    # SC2: resistance subordinate to conditioning (moderate, unbroken, well short of failure, capped reps)
    for b in B:
        for e,dz in block_items(b):
            if e['role'].startswith('resistance') and dz:
                cue=cue_for(e,b['structure'],b['rpe'][1])
                chk('SC2_resistance_cue',('short of failure' in cue) or ('steady, clean reps' in cue) or ('RPE <= 8' in cue),f"{e['id']}: {cue}")
                if dz['kind']=='reps': chk('SC2_resistance_rep_ceiling',dz['value']<=(12 if dz.get('per_side') else 20),f"{e['id']} {dz}")
                chk('SC2_no_max_on_resistance','all-out' not in cue and 'max' not in cue,e['id'])
    # SC5: output-oriented progression; resistance load reused, never the objective
    for b in B:
        chk('SC5_progression_basis',bool(b.get('progression_basis')))
        for e in b['items_e']:
            pv=b.get('item_progression',{}).get(e['id'])
            chk('SC5_item_progression',pv in ('output','reuse_load') and not (e['role'].startswith('resistance') and pv!='reuse_load'),f"{e['id']} {pv}")
    # Athletic firewall: explosive items in Sweat are repeated work, never low-rep maximal-intent sets
    for b in B:
        for e,dz in block_items(b):
            if e['explosive'] and dz:
                chk('AF_explosive_as_repeated_work',(dz['kind']=='reps' and dz['value']*(2 if dz.get('per_side') else 1)>=8) or (dz['kind']=='time' and dz['value']>=20) or dz['kind'] in ('distance','calories'),f"{e['id']} {dz}")
        if b['structure']=='finisher':
            chk('AF_finisher_bouts_ge_15s',b['interval_target']['work']>=15)
    if aid=='sweat_engine': chk('I2_engine_primary_all_engine',all(r=='engine' for r in roles) and len(p['items_e'])==1)
    # I3
    cm=sum(block_minutes(b,exp) for b in B)
    floor=(12 if dur==30 else 22) if d['V']<0 else (14 if dur==30 else 26)
    chk('I3_active_time',cm>=floor-0.05,f'{cm:.1f} >= {floor}')
    # I4
    for b in B:
        it=b.get('interval_target')
        if b['structure'] in ('intervals','finisher'):
            W,R=it['work'],it['recovery']
            chk('I4_recovery_ratio',R<=2*W or (W<=20 and R<=3*W),f"{b['slot']} {W}/{R}")
            chk('I4_round_rest',it.get('round_rest',0)<=120)
        if b['structure']=='circuit': chk('I4_round_rest',b['round_rest']<=120,b['round_rest'])
        if b['structure']=='pyramid': chk('I4_pyramid_recovery',it['recovery']<=2*min(it['steps']))
    # I5 + J2 (cues)
    for b in B:
        for e,dz in block_items(b):
            if e['role'].startswith('resistance') and dz:
                tot=dz['value']*(2 if dz.get('per_side') else 1)
                okd=(dz['kind']=='reps' and tot>=8) or (dz['kind']=='time' and dz['value']>=30) or (dz['kind']=='distance' and dz['value']>=20)
                chk('I5_resistance_dose',okd,f"{e['id']} {dz}")
            cue=cue_for(e,b['structure'],b['rpe'][1])
            if 'heavy' in cue: chk('I5_heavy_only_self_limiting',heavy_ok(e),e['id'])
            if is_loaded_hinge(e): chk('J2_loaded_hinge_cue_le_8','<= 8' in cue,e['id'])
        if b['structure']=='finisher':
            for e in b['items_e']: chk('I5_all_out_only_max_intent_ok',max_intent_ok(e),e['id'])
    # treadmill never all-out, min bout
    for b in B:
        for e,dz in block_items(b):
            if e['eq'] in MIN_BOUT:
                chk('treadmill_not_all_out',b['structure']!='finisher' and b['rpe'][1]<=9,e['id'])
                if b['structure'] in ('intervals',): chk('min_bout_60s',b['interval_target']['work']>=60,e['id'])
                if dz and dz['kind']=='time': chk('min_bout_60s',dz['value']>=60,e['id'])
    # I6
    chk('I6_max_two_hard_blocks',sum(b['rpe'][0]>=8 for b in B)<=2,[b['rpe'] for b in B])
    for b in B:
        if b['structure']=='finisher': chk('I6_finisher_le_6min',block_minutes(b,exp)<=6.05)
    # J1 + hard eligibility
    cap=d['cap']; ids=[]; fams=[]
    for b in B:
        for e in b['items_e']:
            ids.append(e['id']); fams.append(e['swap'])
            chk('J1_class',e['sweat_class'] in ('A','B','NEW'),e['id'])
            chk('J1_no_precision',not e['prec'],e['id'])
            relaxed={a.get('detail') for a in w['adjustments'] if a['reason_code'] in ('complexity_relaxed_engine_output','complexity_relaxed_state_cap')}
            for a_ in w['adjustments']:
                if a_['reason_code']=='complexity_relaxed_resistance_only': relaxed|=set(a_['detail'])
            ecap=min(3,{'beginner':2,'intermediate':3,'advanced':5}[exp]) if e['id'] in relaxed else cap
            chk('J1_complexity_cap',e['cx']<=ecap<=3,f"{e['id']} {e['cx']}>{ecap}")
            chk('J1_no_barbell',e['eq'] not in ('barbell','trap_bar') or e['id']=='inverted_row',e['id'])
            chk('skill',LV[e['skill']]<=LV[exp],e['id'])
            chk('equipment',(e['eq']=='bodyweight' or e['eq'] in ctx['equip']) and e['space'] in ctx['space'],e['id'])
            chk('sore_primary_excluded',not ({roll(m) for m in e['prim']}|set(e['prim']))&ctx['sore_eff'],e['id'])
            if e['id']=='jump_rope' and b['slot']=='primary_engine_block': chk('jump_rope_engine_primary_int_plus',exp!='beginner')
    chk('no_exercise_repeat',len(ids)==len(set(ids)),ids)
    relaxed_a=any(a['reason_code']=='relaxation_a' and 'swap family' in str(a.get('detail')) for a in w['adjustments'])
    chk('no_swap_family_repeat_across_blocks',len(fams)==len(set(fams)) or relaxed_a,fams)
    for b in B:
        bf=[e['swap'] for e in b['items_e']]; chk('no_swap_family_repeat_in_block',len(bf)==len(set(bf)),bf)
    # J3 / J4 / J5 per block
    for b in B:
        its=block_items(b); uniq={}
        for e,dz in its: uniq[e['id']]=e
        ue=list(uniq.values())
        hi=sum(e['impact']=='high' for e in ue)
        chk('J3_high_impact_per_block',hi<=1)
        if exp=='beginner' or 'low_energy' in st or (ctx['sore_eff']&LOWER): chk('J3_no_high_impact_gated',hi==0)
        chk('J4_one_loaded_hinge',sum(is_loaded_hinge(e) for e in ue)<=1)
        for e,dz in its:
            if dz and dz['kind']=='reps' and e['id'] in ('pull_up','chin_up','neutral_grip_pull_up'): chk('J4_pullup_le_8',dz['value']<=8)
            if dz and dz['kind']=='time' and (is_hanging(e) or e['id'] in ('pull_up','chin_up','neutral_grip_pull_up')): chk('J4_no_timed_hanging',False,e['id'])
            if dz and is_hanging(e) and dz['kind']=='reps': chk('J4_hanging_le_10',dz['value']<=10)
        fk={e['fixed'] for e in ue if e['fixed']}
        chk('J5_fixed_stations_le_2',len(fk)<=2,sorted(fk))
        seq=b['items_e'] if not b.get('anchor') else []
        if len(seq)>2:
            for i in range(len(seq)):
                a,c=seq[i],seq[(i+1)%len(seq)]
                chk('J4_hanging_not_next_to_carry',not ((is_hanging(a) and c['pat']=='carry') or (is_hanging(c) and a['pat']=='carry')))
    # structure gates
    for b in B:
        s=b['structure']
        if exp=='beginner': chk('gate_beginner_structures',s not in ('emom','ladder','pyramid'),s)
        if 'low_energy' in st: chk('gate_low_energy_structures',s not in ('emom','ladder','pyramid'),s)
        if 'stressed' in st:
            chk('gate_stressed_structures',s not in ('emom','ladder','pyramid'),s)
            if s=='intervals' and b['interval_target'].get('rotate'): chk('gate_stressed_rotation',len(b['items_e'])<=2)
        if s=='emom':
            for e,dz in zip(b['items_e'],b['doses']): chk('EMOM_work_le_40s',est(e,dz,exp)<=40.01,f"{e['id']} {est(e,dz,exp):.0f}s")
        if exp=='beginner': chk('beginner_rpe_le_8',b['rpe'][1]<=8)
        if exp=='beginner' and s=='intervals': chk('beginner_recovery_ge_work',b['interval_target']['recovery']>=b['interval_target']['work'])
    # Engine mode
    if aid=='sweat_engine':
        m=p.get('engine_mode')
        if m=='steady': chk('engine_steady_shape',p['structure']=='continuous' and 5<=p['rpe'][0] and p['rpe'][1]<=7+max(0,d['E']),p['rpe'])
        else: chk('engine_interval_shape',p['structure'] in ('intervals','pyramid') and p['rpe'][0]>=7 and p['rpe'][1]<=9,p['rpe'])
    # Hybrid
    if aid=='sweat_hybrid':
        a=p['anchor']; ta=est(a,p['anchor_dose'],exp)
        chk('hybrid_anchor_engine',a['role']=='engine')
        chk('hybrid_anchor_longest',all(ta>=est(e,dz,exp) for rs in p['round_stations'] for e,dz in rs),f'{ta:.0f}s')
        chk('hybrid_lower_station',any(e['region']=='lower' for rs in p['round_stations'] for e,_ in rs))
    # Target
    if ctx['target_mode']=='explicit':
        chk('target_routes_circuit',aid=='sweat_circuit')
        R=ctx['target_regions']
        res=[e for e in p['items_e'] if e['role'].startswith('resistance') or (e['role']=='core' and 'trunk' in R)]
        inR=[e for e in res if e['region'] in R]
        chk('target_resistance_two_thirds',res and len(inR)*3>=2*len(res),f'{len(inR)}/{len(res)}')
        allm=set()
        for b in B:
            for e in b['items_e']: allm|={roll(m) for m in e['prim']+e['sec']}|set(e['prim']+e['sec'])
        for m in ctx['target']:
            if m=='full_body': continue
            chk('target_muscle_covered',m in allm,m)
    # Duration
    lo,hi=BAND[dur]; t=w['est_minutes']
    under_ok=any(a['reason_code'] in ('state_volume','state_volume_clamped','complement_unavailable','region_balance_relaxed_sore','region_balance_relaxed_equipment') for a in w['adjustments'])
    chk('duration_fits',t<=dur,f'{t}')
    chk('duration_not_underfilled',t>=lo-3 or under_ok,f'{t} vs floor {lo}')
    chk('SOFT_duration_band',lo-0.5<=t<=hi+0.5 or (t<lo and under_ok),f'{t} in {lo}-{hi}')
    return C
