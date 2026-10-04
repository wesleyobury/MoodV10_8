"""MOOD V3 Sweat reference data layer.
Sources: Strength Exercise Library v11 (frozen, read-only) + 16 founder-approved Sweat additions (B3).
Everything Sweat-specific (class, role, eligibility) is DERIVED here by rule; no shared taxonomy field is added."""
import os, openpyxl
from collections import defaultdict
HERE=os.path.dirname(os.path.abspath(__file__))
from ...paths import DATA_DIR
LIB=os.path.join(DATA_DIR,'MOOD_V3_Strength_Exercise_Library_v11.xlsx')

def _l(v): return [x.strip() for x in str(v).split(';') if x.strip()] if v not in (None,'') else []
def _b(v): return v in (True,'TRUE')

PARENT={'front_delts':'shoulders','side_delts':'shoulders','rear_delts':'shoulders','spinal_erectors':'back'}
CHILD=defaultdict(set)
for k,p in PARENT.items(): CHILD[p].add(k)
def roll(m): return PARENT.get(m,m)
def expand(m): return {m}|CHILD.get(m,set())
LOWER={'quads','hamstrings','glutes','calves','hip_adductors','hip_abductors'}
TRUNK={'core','spinal_erectors'}
def region_of(m): return 'lower' if m in LOWER else ('trunk' if m in TRUNK else 'upper')   # WA SCHEMA CONTRACT region

def load_library():
    wb=openpyxl.load_workbook(LIB,read_only=True,data_only=True)
    rows=list(wb['EXERCISE LIBRARY'].iter_rows(values_only=True)); h=list(rows[1]); EX={}
    for r in rows[2:]:
        d=dict(zip(h,r))
        if not d.get('exercise_id'): continue
        e=dict(id=d['exercise_id'],name=d['display_name'],family=d['exercise_family'],prim=_l(d['primary_muscles']),sec=_l(d['secondary_muscles']),
               pat=d['movement_pattern'],mfam=d['movement_family'],mod=d['modality'],eq=d['primary_equipment'],req=_l(d['required_secondary_equipment']),
               station=d['setup_station_family'],space=d['space_requirement'],cls=d['compound_class'],sup=d['support_level'],lat=d['laterality'],
               cx=int(d['complexity']),nov=int(d['novelty_score']),sysd=int(d['systemic_demand']),forceful=_b(d['forceful_safe']),explosive=_b(d['explosive']),
               prec=_b(d['precision_required']),impact=d['impact_level'],skill=d['skill_level_min'],combo=_b(d['combination_movement']),
               comps=_l(d['component_patterns']),swap=d['swap_family_id'],metric=d['rep_metric'],new=False)
        EX[e['id']]=e
    return EX

# ---- 16 founder-approved additions (B3). Columns follow the ET v11 field contract.
ADDITIONS=[
# id, name, family, prim, sec, pattern, mfam, modality, equip, station, space, class, support, laterality, cx, nov, sys, forceful, explosive, impact, skill, metric, swap, combo_components, variation
('row_erg','Row Erg','row_erg','quads;back','glutes;hamstrings;biceps;core','cyclical','erg','cardio_machine','rower','cardio_machine','standard_gym','compound','semi_supported','bilateral',2,1,4,1,0,'low','beginner','distance','row_erg','',''),
('ski_erg','SkiErg','ski_erg','back;triceps','core;front_delts;glutes','cyclical','erg','cardio_machine','ski_erg','cardio_machine','standard_gym','compound','unsupported','bilateral',2,2,4,1,0,'low','beginner','distance','ski_erg','',''),
('air_bike','Air Bike','bike','quads','glutes;hamstrings;chest;back','cyclical','erg','cardio_machine','bike','cardio_machine','standard_gym','compound','supported','bilateral',1,2,5,1,0,'low','beginner','calories','bike','','air'),
('stationary_bike','Stationary Bike','bike','quads','glutes;hamstrings;calves','cyclical','erg','cardio_machine','bike','cardio_machine','standard_gym','compound','supported','bilateral',1,1,3,0,0,'low','beginner','time','bike','',''),
('treadmill_run','Treadmill Run','run','quads;calves','glutes;hamstrings','cyclical','run','running','treadmill','cardio_machine','standard_gym','compound','unsupported','alternating',1,1,4,0,0,'moderate','beginner','distance','run','',''),
('treadmill_incline_walk','Incline Treadmill Walk','incline_walk','glutes;calves','quads;hamstrings','cyclical','walk','cardio_machine','treadmill','cardio_machine','standard_gym','compound','unsupported','alternating',1,1,2,0,0,'low','beginner','time','incline_walk','','incline'),
('stair_climber','Stair Climber','stair_climb','quads;glutes','calves;hamstrings','cyclical','climb','cardio_machine','stair_climber','cardio_machine','standard_gym','compound','unsupported','alternating',1,2,4,0,0,'low','beginner','time','stair_climb','',''),
('jump_rope','Jump Rope','jump_rope','calves','quads;forearms','jump','rope_skip','jump','jump_rope','open_space','floor_space','compound','unsupported','bilateral',2,2,3,0,0,'moderate','beginner','time','jump_rope','',''),
('battle_rope_waves','Battle Rope Waves','battle_rope','front_delts','core;forearms;biceps','mixed','rope_wave','rope','battle_ropes','open_space','floor_space','compound','unsupported','alternating',1,3,3,1,0,'low','beginner','time','battle_rope','',''),
('med_ball_slam','Med-Ball Slam','slam','core;shoulders','back;triceps','throw','slam','throw','slam_ball','open_space','floor_space','compound','unsupported','bilateral',2,3,3,1,1,'low','beginner','reps','slam','',''),
('wall_ball','Wall Ball','wall_ball','quads;front_delts','glutes;triceps;core','squat','wall_ball','throw','med_ball','med_ball_wall','standard_gym','integrated','unsupported','bilateral',2,2,4,1,0,'low','beginner','reps','wall_ball','squat;throw',''),
('burpee','Burpee','burpee','quads;chest','triceps;front_delts;core;glutes','jump','burpee','bodyweight','bodyweight','floor_mat','floor_space','integrated','unsupported','bilateral',2,1,5,1,0,'moderate','beginner','reps','burpee','horizontal_push;jump',''),
('jump_squat','Jump Squat','squat_jump','quads;glutes','calves','jump','jump','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',2,2,3,1,1,'high','intermediate','reps','squat_jump','',''),
('sled_pull','Sled Rope Pull','sled_pull','back','biceps;forearms;core','horizontal_pull','sled','sled','sled','turf','turf','compound','unsupported','alternating',1,3,4,1,0,'low','beginner','distance','sled_pull','',''),
('plate_push','Plate Push','plate_push','quads;glutes','calves;core;front_delts','locomotion','push','bodyweight','plate','open_space','lane','compound','unsupported','alternating',1,3,4,1,0,'low','beginner','distance','plate_push','',''),
# v4 founder additions: carry variety (share the carry swap family so they rotate, never stack in one block)
('overhead_carry','Overhead Carry','carry','shoulders;core','triceps;forearms','carry','carry','resistance','dumbbells','open_space','floor_space','compound','unsupported','bilateral',2,3,3,0,0,'low','beginner','distance','carry','',''),
('waiter_carry','Single-Arm Overhead Carry','carry','shoulders;core','triceps','carry','carry','resistance','dumbbells','open_space','floor_space','compound','unsupported','unilateral',2,3,2,0,0,'low','beginner','distance','carry','',''),
('front_rack_carry','Front-Rack Carry','carry','core;quads','front_delts;back;biceps','carry','carry','resistance','dumbbells','open_space','floor_space','compound','unsupported','bilateral',2,3,3,1,0,'low','beginner','distance','carry','',''),
# v4 founder additions: full-body / athletic movements, dosed as Sweat work (high reps or timed), never low-rep max intent
('kb_snatch','Kettlebell Snatch','kb_snatch','glutes;hamstrings;shoulders','core;back;forearms','hinge','ballistic','resistance','kettlebell','open_space','floor_space','integrated','unsupported','alternating',3,3,4,1,1,'low','intermediate','reps','clean_press','hinge;vertical_push',''),
('db_push_press','Dumbbell Push Press','db_push_press','shoulders;triceps','quads;glutes;core','vertical_push','press','resistance','dumbbells','open_space','floor_space','integrated','unsupported','bilateral',2,2,3,1,0,'low','beginner','reps','db_push_press','squat;vertical_push',''),
('jumping_jack','Jumping Jacks','jumping_jack','calves;shoulders','quads;hip_abductors','jump','jack','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',1,1,2,0,0,'moderate','beginner','time','jumping_jack','',''),
('db_jumping_jack','Dumbbell Lateral-Raise Jacks','jumping_jack','side_delts;calves','quads;hip_abductors;core','jump','jack','jump','dumbbells','open_space','floor_space','integrated','unsupported','bilateral',2,3,3,0,0,'moderate','beginner','time','db_jack','jump;isolation',''),
('box_jump','Box Jump','box_jump','quads;glutes','calves;hamstrings','jump','jump','jump','box','box_station','floor_space','compound','unsupported','bilateral',2,2,4,1,1,'moderate','intermediate','reps','box_jump','',''),
('skater_hop','Skater Hops','skater','glutes;quads','calves;hip_abductors;core','jump','bound','jump','bodyweight','open_space','floor_space','compound','unsupported','alternating',2,3,3,0,1,'moderate','beginner','reps','skater','',''),
('high_knees','High Knees','high_knees','quads;calves','core;hamstrings','cyclical','run_in_place','jump','bodyweight','open_space','floor_space','compound','unsupported','alternating',1,2,3,0,0,'moderate','beginner','time','high_knees','',''),
('devil_press','Devil Press','devil_press','glutes;shoulders','chest;hamstrings;core;triceps','mixed','burpee','resistance','dumbbells','floor_mat','floor_space','integrated','unsupported','bilateral',3,4,5,1,1,'low','intermediate','reps','devil_press','horizontal_push;hinge;vertical_push',''),
# v4: simple, low-cost lower-body stations so Low Energy / Beginner circuits keep variety without machines
('air_squat','Air Squat','air_squat','quads;glutes','hamstrings;core','squat','squat','bodyweight','bodyweight','open_space','floor_space','compound','unsupported','bilateral',1,1,2,0,0,'low','beginner','reps','air_squat','',''),
('glute_bridge','Glute Bridge','glute_bridge','glutes','hamstrings;core','hinge','bridge','bodyweight','bodyweight','floor_mat','floor_space','compound','supported','bilateral',1,1,1,0,0,'low','beginner','reps','glute_bridge','',''),
('bw_step_up','Step-Up','bw_step_up','quads;glutes','calves;hamstrings','lunge','step','bodyweight','box','box_station','floor_space','compound','unsupported','alternating',1,1,2,0,0,'low','beginner','reps','lunge','',''),
('suspension_row','Suspension Trainer Row','inverted_row','back','biceps;rear_delts','horizontal_pull','row','bodyweight','suspension_trainer','open_space','standard_gym','compound','semi_supported','bilateral',1,2,2,0,0,'low','beginner','reps','inverted_row','',''),
]
# Canonical names stay generic (brand-agnostic). Display aliases are presentation only: never used for equipment matching, eligibility or swaps.
DISPLAY_ALIASES={'air_bike':'Air Bike / Assault Bike','suspension_row':'Suspension Trainer Row / TRX Row'}
def add_new(EX):
    for a in ADDITIONS:
        e=dict(id=a[0],name=a[1],family=a[2],prim=a[3].split(';'),sec=a[4].split(';'),pat=a[5],mfam=a[6],mod=a[7],eq=a[8],req=[],station=a[9],space=a[10],
               cls=a[11],sup=a[12],lat=a[13],cx=a[14],nov=a[15],sysd=a[16],forceful=bool(a[17]),explosive=bool(a[18]),prec=False,impact=a[19],skill=a[20],
               combo=bool(a[23]),comps=a[23].split(';') if a[23] else [],metric=a[21],swap=a[22],variation=a[24],new=True)
        EX[e['id']]=e
    return EX

# ---- Sweat classification (Pass 1 rules + founder core reclassification, v2)
CORE_A={'plank','side_plank','weighted_plank','dead_bug','mountain_climber','hollow_hold','reverse_crunch','cable_crunch','machine_crunch',
        'decline_sit_up','weighted_sit_up','hanging_knee_raise','captains_chair_knee_raise','pallof_press','pallof_step_out','cable_wood_chop'}
CORE_B={'hanging_leg_raise'}
CORE_EXCLUDED={'ab_wheel_rollout':'lumbar extension demand rises sharply under fatigue','copenhagen_plank':'high local adductor demand',
               'dragon_flag':'highly technical, high local demand','landmine_rotation':'precision_required'}
TECH_C={'curl_to_arnold_press','jm_press','bulgarian_split_squat','zercher_squat','turkish_get_up','single_leg_rdl','z_press','landmine_rotation'}
SETUP_D={'barbell_hip_thrust','db_hip_thrust','b_stance_hip_thrust','machine_hip_thrust','smith_hip_thrust','barbell_glute_bridge','single_leg_glute_bridge','good_morning','hip_abduction_machine'}
REDUNDANT_D={'pit_shark_belt_squat','pendulum_squat','single_leg_leg_press','t_bar_row','meadows_row','weighted_pull_up','weighted_push_up','arnold_press','curtsy_lunge'}
CORE_PATS={'anti_extension','anti_rotation','flexion','rotation'}
def is_core(e): return e['pat']!='carry' and (roll(e['prim'][0])=='core' or e['pat'] in CORE_PATS)

def classify(e):
    i=e['id']
    if e['new']: return 'NEW','founder-approved Sweat addition (B3)'
    if e['station'] in ('selectorized_machine','plate_loaded_machine','cable_station','smith_station','rack') and not e['new']: return 'D','v4 founder: machines / cables / rack stations stay out of Sweat (separate floor area, extra moving)'
    if i in CORE_A: return 'A','simple conditioning-compatible core station'
    if i in CORE_B: return 'B','demanding core: intermediate+, hanging-item rep cap'
    if i in CORE_EXCLUDED: return 'C',CORE_EXCLUDED[i]
    if e['prec']: return 'C','precision_required under fatigue'
    if e['cx']>=4: return 'C','complexity >= 4'
    if e['eq'] in ('barbell','trap_bar') and i!='inverted_row': return 'C','heavy barbell / trap-bar lift'
    if i in TECH_C: return 'C','technical or high local fatigue under conditioning'
    if is_core(e): return 'D','core variant not needed (covered by simpler core options)'
    if e['eq'] in ('ez_bar','smith_machine'): return 'D','setup-heavy station, low conditioning value'
    if e['cls']=='isolation' and e['pat']!='carry': return 'D','isolation: low conditioning value'
    if i in SETUP_D: return 'D','setup-heavy or low conditioning value'
    if i in REDUNDANT_D: return 'D','redundant for Sweat at launch'
    if e['cx']==3 or e['skill']!='beginner': return 'B','intermediate+ only; low reps per round'
    if e['impact']=='high': return 'B','high impact: not Beginner / Low Energy; max 1 per block'
    return 'A','reusable as-is'

def role(e):
    if e['mod'] in ('cardio_machine','running') or e['id']=='jump_rope': return 'engine'
    if e['mod'] in ('sled','rope','throw','jump') or e['pat'] in ('carry','locomotion','jump'): return 'output'
    if is_core(e): return 'core'
    return 'resistance_'+region_of(e['prim'][0])

FIXED_STATIONS={'cardio_machine','selectorized_machine','plate_loaded_machine','cable_station','smith_station','rack','turf','landmine_station','pullup_bar','dip_station','med_ball_wall'}
def fixed_key(e):
    """J5 v2: one key per physical station the block occupies (counted across ALL rounds, incl. rotating stations)."""
    if e['station'] not in FIXED_STATIONS: return None
    if e['station']=='cardio_machine': return 'machine:'+e['eq']          # treadmill, rower, ski_erg, bike, stair_climber
    if e['station']=='turf': return 'sled_lane'                             # sled push + sled pull share one sled/lane
    if e['station']=='med_ball_wall': return 'wall_ball_target'
    if e['station'] in ('pullup_bar','rack','dip_station'): return e['station']
    return 'station:'+e['swap']                                             # each machine / cable / landmine setup

def self_limiting(e):
    return e['mod'] in ('cardio_machine','running','sled','rope','throw') or e['pat'] in ('carry','cyclical')
def max_intent_ok(e):
    """I5/J2 v2: all-out / max cues only on self-limiting items that are NOT treadmill running (founder correction 2)."""
    return self_limiting(e) and e['eq']!='treadmill' and e['mod']!='running' and e['pat']!='carry'
def heavy_ok(e):
    return e['pat']=='carry' or e['mod']=='sled'
MIN_BOUT={'treadmill':60,'stair_climber':60}
def is_loaded_hinge(e): return e['pat']=='hinge' and e['eq'] not in ('bodyweight',)
def is_hanging(e): return e['eq'] in ('pullup_bar','captains_chair') or e['station']=='pullup_bar'

# ---- Equipment presets (Sweat)
ALL_EQUIP={'bodyweight','barbell','dumbbells','kettlebell','cable','selectorized_machine','plate_loaded_machine','smith_machine','bands','suspension_trainer',
 'pullup_bar','bench','rack','landmine','med_ball','slam_ball','sled','battle_ropes','box','rower','bike','treadmill','ski_erg','stair_climber','jump_rope',
 'trap_bar','ez_bar','ab_wheel','dip_station','plate','back_extension_bench','captains_chair'}
PRESETS={
 # Founder change v2: Sweat commercial default INCLUDES sled + turf (Strength's frozen default is untouched)
 'sweat_commercial_default':(ALL_EQUIP,{'standard_gym','floor_space','lane','turf'}),
 'commercial_no_sled':(ALL_EQUIP-{'sled'},{'standard_gym','floor_space','lane'}),
 'free_weight_limited':({'bodyweight','dumbbells','kettlebell','bench','box','jump_rope','bands','pullup_bar','med_ball','slam_ball'},{'standard_gym','floor_space','lane'}),
 'db_bodyweight_only':({'bodyweight','dumbbells','bench','jump_rope'},{'floor_space','standard_gym'}),
 'db_bench_only':({'bodyweight','dumbbells','bench'},{'floor_space','standard_gym'}),   # QA: hotel-style room, no rope
}
LV={'beginner':0,'intermediate':1,'advanced':2}

# ---- Sweat eligibility map (authored by rule; ET many-to-many contract; K13 condition grammar)
ARCHS=['sweat_engine','sweat_circuit','sweat_hybrid']
FLAGSHIP={'row_erg','ski_erg','air_bike','treadmill_run','wall_ball','burpee','goblet_squat','push_up','sled_push','dead_bug','plank'}   # v4: farmer carry and KB swing no longer get the tie-break bias, so carry variants and other full-body items rotate in
FOUNDER_PREFERRED_B={'kettlebell_swing','db_snatch'}   # v4 founder: intermediate+ staples, first-choice when the skill gate allows them
HYBRID_ANCHORS={'treadmill_run':'preferred','row_erg':'preferred','ski_erg':'preferred','air_bike':'allowed','stationary_bike':'allowed'}
def build_eligibility(EX):
    rows=[]   # (exercise_id, archetype_id, slot_id, verdict, condition, priority_bias)
    for e in EX.values():
        c,_=classify(e)
        if c not in ('A','B','NEW'): continue
        r=role(e); v='allowed' if (c=='B' and e['id'] not in FOUNDER_PREFERRED_B) else 'preferred'; b=1 if e['id'] in FLAGSHIP else 0
        machine=e['station'] in ('selectorized_machine','plate_loaded_machine','cable_station','smith_station')
        mcond='state_id = low_energy OR experience = beginner OR target_count >= 1' if machine else ''
        if machine or e['station'] in ('rack','smith_station'): continue   # v4 founder: machines / cables / rack stations stay out of Sweat (separate floor area, extra moving)
        maxok=max_intent_ok(e)
        # Engine
        if r=='engine':
            cond='experience != beginner' if e['id']=='jump_rope' else ''          # founder correction 4
            pv='allowed' if e['id'] in ('stair_climber','jump_rope') else 'preferred'
            rows.append((e['id'],'sweat_engine','primary_engine_block',pv,cond,b))
            rows.append((e['id'],'sweat_engine','complementary_block','allowed' if e['id']=='treadmill_incline_walk' else 'preferred',cond,0))
        elif e['id']!='hanging_leg_raise' or True:
            rows.append((e['id'],'sweat_engine','complementary_block',v,mcond,b))
        if maxok: rows.append((e['id'],'sweat_engine','optional_extra','preferred','',0))
        # Circuit
        if e['id'] not in ('treadmill_incline_walk','stair_climber'):
            rows.append((e['id'],'sweat_circuit','primary_circuit',v,mcond,b))
            rows.append((e['id'],'sweat_circuit','complementary_block',v,mcond,b))
        if maxok: rows.append((e['id'],'sweat_circuit','optional_extra','preferred','',0))
        # Hybrid
        if e['id'] in HYBRID_ANCHORS: rows.append((e['id'],'sweat_hybrid','primary_hybrid_block.anchor',HYBRID_ANCHORS[e['id']],'',b))
        station_ok=(r=='output' or r=='resistance_lower' or (e['cls']=='integrated' and e['station'] not in FIXED_STATIONS-{'med_ball_wall','turf'}))
        if station_ok and not machine and e['id'] not in ('jump_rope','battle_rope_waves','jumping_jack','db_jumping_jack','high_knees','glute_bridge') and e['station']!='bench' or e['id'] in ('sled_push','sled_pull','wall_ball'):
            if not (e['station']=='bench'): rows.append((e['id'],'sweat_hybrid','primary_hybrid_block.station',v,'',b))
        if r in ('resistance_upper','core','output') and not machine:
            rows.append((e['id'],'sweat_hybrid','complementary_block',v,'',b))
        if maxok: rows.append((e['id'],'sweat_hybrid','optional_extra','preferred','',0))
    # dedupe (first wins)
    seen=set(); out=[]
    for r in rows:
        k=r[:3]
        if k in seen: continue
        seen.add(k); out.append(r)
    return out

def cond_ok(cond,ctx):
    if not cond: return True
    for alt in cond.split(' OR '):
        a=alt.strip()
        if a=='experience != beginner' and ctx['experience']!='beginner': return True
        if a=='experience = beginner' and ctx['experience']=='beginner': return True
        if a=='state_id = low_energy' and 'low_energy' in ctx['states']: return True
        if a=='target_count >= 1' and ctx.get('target_count',0)>=1: return True
    return False

# v4 founder: Sweat-side view overrides (library file untouched). Alternating DB snatch is a standard conditioning movement at moderate load.
SWEAT_VIEW={'db_snatch':dict(cx=3,prec=False,skill='intermediate')}
def load_all():
    EX=add_new(load_library())
    for k,v in SWEAT_VIEW.items():
        if k in EX: EX[k].update(v)
    for e in EX.values():
        e['sweat_class'],e['sweat_reason']=classify(e); e['role']=role(e); e['fixed']=fixed_key(e)
        e['region']=region_of(e['prim'][0]); e['pm0']=roll(e['prim'][0])
    ELIG=build_eligibility(EX)
    return EX,ELIG
