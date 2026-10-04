"""MOOD V3 Athletic FINAL FREEZE rules layer (on top of the frozen library data in lib2).
Changes vs Pass 2 final: simplified warm-up (<= 4 components), Performance Support replaces Strength Support
(optional, purpose-bound), no Trunk slot. Library records, Type A / Type B, impact and density rules unchanged."""
from .lib2 import *
from . import athletic_lib as V1

# ---------------------------------------------------------------- canonical slot ids (WA v17)
SLOT_ID = {'px':'primary_exposure','sx':'secondary_exposure','sx2':'third_exposure','qc':'quality_capped_repeats','ps':'performance_support'}
EXPOSURE = ('px','sx','sx2','qc')

# ---------------------------------------------------------------- warm-up: 4 component types, <= 4 items, rehearsal only when needed
WU3 = {
 'raise':     {'ids':['stationary_bike','row_erg','air_bike','ski_erg','jump_rope'],                          'arch':{'P','S','F'}, 'min':2.5},
 'prep':      {'ids':['worlds_greatest_stretch','leg_swings','lateral_lunge','glute_bridge'],                   'arch':{'P','S','F'}, 'min':1.0},
 'primer':    {'ids':['pogo_hop','snap_down','line_hops','power_skip','a_skip','wall_drill','a_march','lateral_shuffle_stick','short_shuttle','high_knees'],
               'arch':{'P','S','F'}, 'min':1.0},
 'rehearsal': {'ids':['<PX at light load / submax>','acceleration_sprint','falling_start_sprint','sled_push'],  'arch':{'P','S','F'}, 'min':1.5},
}
PRIMER_ARCH = {'athletic_power':{'pogo_hop','snap_down','line_hops','power_skip'},
               'athletic_speed_agility':{'pogo_hop','line_hops','power_skip','a_skip','wall_drill','a_march','lateral_shuffle_stick','short_shuttle','high_knees'},
               'athletic_full_body':set(WU3['primer']['ids'])}
TECH_PX = {'olympic','explosive_lift','loaded_jump','upper_power','rotational_power'}   # rehearsal needed (light-load practice)
BUILDUP_PX = {'acceleration','sled'}                                                     # build-up runs / easy sled = rehearsal
WU_MAX_ITEMS = 4
def wu_minutes(wu, dur):
    return round(sum((2.0 if (c=='raise' and dur==30) else WU3[c]['min']) for c,*_ in wu),1)
def wu_check(wu, px_e, aid, sore=frozenset(), sx_e=None):
    f=[]; comps=[c for c,*_ in wu]
    if len(wu)>WU_MAX_ITEMS: f.append(f'warm-up {len(wu)} components (max {WU_MAX_ITEMS})')
    if comps.count('raise')!=1: f.append('warm-up needs exactly 1 temperature raiser')
    if comps.count('prep')>1: f.append('warm-up > 1 mobility / prep item')
    lo=0 if (sore & LOWER) else 1          # sore legs: lower-body primers are skipped; the light rehearsal primes the upper-body work
    if not lo<=comps.count('primer')<=2: f.append('warm-up needs 1-2 athletic primers')
    if comps.count('rehearsal')>1: f.append('warm-up > 1 rehearsal')
    q=quality(px_e); qs=quality(sx_e) if sx_e else None
    if 'rehearsal' in comps and q not in TECH_PX|BUILDUP_PX and qs not in BUILDUP_PX and not (sore & LOWER): f.append(f'rehearsal not needed for PX quality {q}')   # sore legs: submax rehearsal replaces the lower-body primer
    for c,i,*_ in wu:
        if c=='primer' and i not in PRIMER_ARCH[aid]: f.append(f'primer {i} not in {aid} pool')
        if c in ('raise','prep') and i not in WU3[c]['ids']: f.append(f'{c} {i} not in pool')
    return f
def wu_trim(wu, px_e, aid, sx_e=None):
    """Deterministic trim of an over-long warm-up: 1 raise, 1 prep, primers, rehearsal only if needed; <= 4 items."""
    need_reh = quality(px_e) in TECH_PX|BUILDUP_PX or (sx_e is not None and quality(sx_e) in BUILDUP_PX)
    raise_=[x for x in wu if x[0]=='raise'][:1]; prep=[x for x in wu if x[0]=='prep'][:1]
    prim=[x for x in wu if x[0]=='primer' and x[1] in PRIMER_ARCH[aid]]; reh=[x for x in wu if x[0]=='rehearsal'][:1] if need_reh else []
    prim=prim[:max(1, WU_MAX_ITEMS-len(raise_)-len(prep)-len(reh))][:2]
    return raise_+prep+prim+reh

# ---------------------------------------------------------------- Performance Support (optional, purpose-bound)
PS_PURPOSE = {
 'strength_transfer':    ['trap_bar_deadlift','front_squat','goblet_squat','barbell_back_squat','kettlebell_deadlift'],
 'unilateral_robustness':['bulgarian_split_squat','front_foot_elevated_split_squat','reverse_lunge','lateral_lunge','walking_lunge','db_step_up','lateral_step_up'],
 'posterior_chain':      ['db_rdl','single_leg_rdl','kickstand_db_rdl','barbell_rdl','single_leg_glute_bridge'],
 'hamstring_resilience': ['nordic_curl','slider_hamstring_curl'],
 'isometric_strength':   ['copenhagen_plank','side_plank'],
 'carry':                ['farmer_carry','suitcase_carry','front_rack_carry','overhead_carry','waiter_carry'],
 'tendon_robustness':    ['single_leg_db_calf_raise','reverse_nordic'],
 'anti_rotation':        ['pallof_press','pallof_step_out','landmine_rotation'],
 'structural_balance':   ['pull_up','chin_up','single_arm_db_row','chest_supported_db_row','inverted_row','suspension_row',
                          'push_up','db_bench_press','db_incline_press','landmine_press_single_arm','half_kneeling_landmine_press','db_shoulder_press'],
}
PS = {i:p for p,ids in PS_PURPOSE.items() for i in ids}
# no longer Athletic-eligible anywhere (generic trunk; the removed default Trunk slot was their only home)
DROPPED_TRUNK = sorted(set(V1.TRUNK)-set(PS))
LOWER_Q = {'jump','loaded_jump','hop','bound','jump_combo','olympic','explosive_lift','acceleration','sled','decel','lateral_power','elastic'}
def ps_relevant(purpose, exp_es, sore=frozenset()):
    """Is this purpose a real reason for THIS session? exp_es = exposure records (PX/SX/SX2)."""
    qs={quality(e) for e in exp_es}; vs={vector(e) for e in exp_es}
    lower = bool(qs & LOWER_Q)
    if purpose=='strength_transfer':     return bool(qs & {'jump','loaded_jump','olympic','explosive_lift','jump_combo','bound','sled'})
    if purpose=='unilateral_robustness': return lower
    if purpose=='posterior_chain':       return bool(qs & {'jump','loaded_jump','olympic','explosive_lift','acceleration','sled','bound','jump_combo'})
    if purpose=='hamstring_resilience':  return bool(qs & {'acceleration','sled','bound','hop','decel','lateral_power'})
    if purpose=='isometric_strength':    return bool(vs & {'lateral','multi'}) or bool(qs & {'lateral_power','decel'})
    if purpose=='carry':                 return bool(qs & {'olympic','explosive_lift','rotational_power','rotational_throw','throw','integrated','upper_power'})
    if purpose=='tendon_robustness':     return bool(qs & {'elastic','hop','bound','jump','jump_combo'})
    if purpose=='anti_rotation':         return bool(vs & {'rotational'}) or bool(qs & {'rotational_power','rotational_throw'})
    if purpose=='structural_balance':    return bool(qs & {'upper_power','olympic','throw','rotational_power','rotational_throw'}) or bool(sore & LOWER)
    return False
PS_CAP = {30:dict(ex=1,sets=3), 60:dict(ex=2,sets=6)}     # 30: usually 0; 60: normally 0-1, 2 only with a stated reason
PS2_MIN_SHARE = 0.70                                         # 2 PS exercises allowed only if exposures stay >= 70% of working time
SHARE_MIN = 0.55                                             # SUP-1 (unchanged)

# ---------------------------------------------------------------- eligibility (work rows unchanged; PS replaces support + trunk; warm-up remapped)
def eligibility3(EX):
    rows=[(i,a,s,c) for (i,a,s,c) in eligibility(EX) if s in EXPOSURE]
    for i,p in PS.items():
        if i not in EX: continue
        for a in ARCH:
            rows.append((i,a,'ps',f'purpose = {p}'))
    AM={'P':'athletic_power','S':'athletic_speed_agility','F':'athletic_full_body'}
    for comp,d in WU3.items():
        for i in d['ids']:
            if i.startswith('<'): continue
            for k in d['arch']:
                a=AM[k]
                if comp=='primer' and i not in PRIMER_ARCH[a]: continue
                if comp=='rehearsal' and a=='athletic_power': continue      # Power rehearses its PX at light load
                rows.append((i,a,'warmup.'+comp,''))
    seen=set(); out=[]
    for r in rows:
        if r[:3] in seen: continue
        seen.add(r[:3]); out.append(r)
    return out

# ---------------------------------------------------------------- duration band (re-based for the shorter warm-up; 60 min is an allowance)
# Pass 1 floors (38 / beginner 34 / 30-min 20) were measured with an 8-10 min warm-up. The warm-up is now about 5-6 min,
# so the same training content measures ~4 min shorter. Floors move by that delta; nothing else changes.
DUR_FLOOR_60 = 34        # intermediate / advanced
DUR_FLOOR_60_LOW = 30    # beginner, or Low Energy (Volume -1, no QC)
DUR_FLOOR_30 = 18
DUR_CEIL = {60:55, 30:30}
