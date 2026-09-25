"""MOOD V3 Athletic Pass 2 REVISION: explosive gym training.
Shared universe = Strength Library v11 + Sweat additions (frozen) + Pass 2 v1 Athletic records (classified) + revision additions.
Layers: WORK (PX / SX / SX2 / QC), WARM-UP (component pools per archetype), SUPPORT, TRUNK."""
import sys
from collections import Counter
from .sweat_shared_data import region_of, LOWER, roll
from . import athletic_lib as V1

# ---------------------------------------------------------------- revision additions (ET v11 field contract; same tuple layout as V1.A)
R2 = [
# Olympic-lift derivatives (barbell; strict gates)
('hang_power_clean','Hang Power Clean','clean','glutes;hamstrings','quads;back;core;forearms','hinge','olympic','resistance','barbell','rack','standard_gym','integrated','unsupported','bilateral',4,3,4,1,1,'low','advanced','reps','clean','hinge;vertical_pull','aq_olympic;vec_vertical'),
('power_snatch','Power Snatch','snatch','glutes;hamstrings','quads;shoulders;back;core','hinge','olympic','resistance','barbell','rack','standard_gym','integrated','unsupported','bilateral',5,4,4,1,1,'low','advanced','reps','snatch','hinge;vertical_push','aq_olympic;vec_vertical'),
('split_jerk','Split Jerk','jerk','shoulders;triceps','quads;glutes;core','vertical_push','olympic','resistance','barbell','rack','standard_gym','integrated','unsupported','bilateral',5,4,4,1,1,'low','advanced','reps','jerk','squat;vertical_push','aq_olympic;vec_vertical'),
# accessible explosive lifts
('db_hang_power_clean','Dumbbell Hang Power Clean','clean','glutes;hamstrings','quads;back;forearms','hinge','olympic','resistance','dumbbells','open_space','floor_space','integrated','unsupported','bilateral',3,3,3,1,1,'low','intermediate','reps','db_clean','hinge;vertical_pull','aq_explosive_lift;vec_vertical'),
('landmine_push_press','Landmine Push Press','landmine_press','shoulders;triceps','quads;glutes;core','vertical_push','press','resistance','landmine','landmine_station','standard_gym','integrated','unsupported','unilateral',2,3,3,1,1,'low','intermediate','reps','landmine_press_explosive','squat;vertical_push','aq_upper_power;vec_vertical'),
# loaded jumps
('trap_bar_jump','Trap-Bar Jump Squat','loaded_jump','quads;glutes','hamstrings;calves','jump','jump','resistance','trap_bar','rack','standard_gym','compound','unsupported','bilateral',3,3,3,1,1,'moderate','intermediate','reps','loaded_jump','','aq_loaded_jump;vec_vertical'),
('db_jump_squat','Dumbbell Jump Squat','loaded_jump','quads;glutes','calves','jump','jump','resistance','dumbbells','open_space','floor_space','compound','unsupported','bilateral',2,2,3,1,1,'moderate','intermediate','reps','loaded_jump_db','','aq_loaded_jump;vec_vertical'),
('banded_squat_jump','Banded Squat Jump','loaded_jump','quads;glutes','calves','jump','jump','resistance','bands','open_space','floor_space','compound','unsupported','bilateral',2,4,3,1,1,'moderate','intermediate','reps','banded_jump','','aq_loaded_jump;vec_vertical'),
('banded_broad_jump','Banded Broad Jump','loaded_jump','glutes;quads','hamstrings;calves','jump','jump','resistance','bands','rack','floor_space','compound','unsupported','bilateral',2,4,3,1,1,'moderate','intermediate','reps','banded_broad_jump','','aq_loaded_jump;vec_horizontal'),
# jump / bound combinations (real exercises, not drill choreography)
('broad_jump_to_vertical','Broad Jump to Vertical Jump','jump_combo','glutes;quads','calves;hamstrings','jump','combo','jump','bodyweight','open_space','floor_space','integrated','unsupported','bilateral',2,4,3,1,1,'moderate','intermediate','reps','broad_to_vertical','jump;jump','aq_jump_combo;vec_multi'),
('pogo_to_box_jump','Pogo to Box Jump','jump_combo','quads;calves','glutes','jump','combo','jump','box','box_station','floor_space','integrated','unsupported','bilateral',2,4,3,1,1,'moderate','intermediate','reps','pogo_to_box','jump;jump','aq_jump_combo;vec_vertical'),
('lateral_bound_to_box_jump','Lateral Bound to Box Jump','jump_combo','glutes;quads','hip_abductors;calves','jump','combo','jump','box','box_station','floor_space','integrated','unsupported','alternating',3,4,3,1,1,'moderate','intermediate','reps','lateral_to_box','jump;jump','aq_jump_combo;vec_lateral'),
('hang_clean_to_box_knee_drive','Hang Clean to Box Knee Drive','clean_combo','glutes;quads','hamstrings;back;core','hinge','combo','resistance','dumbbells','box_station','floor_space','integrated','unsupported','alternating',3,5,3,1,1,'low','intermediate','reps','clean_to_step','hinge;lunge','aq_explosive_lift;vec_vertical'),
# lateral power / split jumps (gym-native speed-strength)
('banded_lateral_bound','Banded Lateral Bound','lateral_bound','glutes;quads','hip_abductors;calves','jump','bound','resistance','bands','rack','floor_space','compound','unsupported','alternating',2,4,3,1,1,'moderate','intermediate','reps','banded_lateral_bound','','aq_lateral_power;vec_lateral'),
('split_jump','Split-Squat Jump','split_jump','quads;glutes','calves;hamstrings','jump','jump','jump','bodyweight','open_space','floor_space','compound','unsupported','alternating',2,2,3,1,1,'moderate','intermediate','reps','split_jump','','aq_bound;vec_vertical'),
('lateral_box_jump','Lateral Box Jump','box_jump','glutes;quads','hip_abductors;calves','jump','jump','jump','box','box_station','floor_space','compound','unsupported','bilateral',2,4,2,1,1,'low','intermediate','reps','lateral_box_jump','','aq_lateral_power;vec_lateral'),
# throws
('mb_rotational_slam','Med-Ball Rotational Slam','slam','core;shoulders','glutes;back','throw','slam','throw','slam_ball','open_space','floor_space','integrated','unsupported','alternating',2,3,3,1,1,'low','beginner','reps','rotational_slam','rotation;throw','aq_rotational_throw;vec_rotational'),
('mb_backward_toss','Med-Ball Backward Overhead Toss','backward_toss','glutes;hamstrings','back;shoulders;core','throw','throw','throw','med_ball','open_space','lane','integrated','unsupported','bilateral',2,4,3,1,1,'low','intermediate','reps','backward_toss','hinge;throw','aq_throw;vec_vertical'),
# final refinement: landmine power (rotational / multiplanar) + integrated coordination
('landmine_rotational_punch','Landmine Rotational Punch','landmine_press','shoulders;core','triceps;glutes;chest','rotation','press','resistance','landmine','landmine_station','standard_gym','integrated','unsupported','unilateral',2,4,3,1,1,'low','intermediate','reps','landmine_rotational_press','rotation;vertical_push','aq_rotational_power;vec_rotational'),
('landmine_split_jerk','Landmine Split Jerk','landmine_jerk','shoulders;triceps','quads;glutes;core','vertical_push','press','resistance','landmine','landmine_station','standard_gym','integrated','unsupported','unilateral',3,4,3,1,1,'low','intermediate','reps','landmine_jerk','lunge;vertical_push','aq_upper_power;vec_vertical'),
('landmine_rotational_clean_press','Landmine Rotational Clean and Press','landmine_clean','glutes;core','shoulders;quads;back','rotation','olympic','resistance','landmine','landmine_station','standard_gym','integrated','unsupported','bilateral',4,5,4,1,1,'low','advanced','reps','landmine_clean_press','rotation;vertical_push','aq_rotational_power;vec_rotational'),
('bear_crawl_ball_toss','Bear Crawl Ball Toss','crawl_coordination','core;shoulders','quads;triceps;hip_abductors','locomotion','crawl','bodyweight','med_ball','open_space','floor_space','integrated','unsupported','alternating',2,5,2,0,0,'low','beginner','distance','bear_crawl_ball_toss','anti_rotation;locomotion','aq_integrated;vec_multi;pc_repeatable'),
# warm-up-only records (mobility / activation), used only by the Athletic warm-up layer
('worlds_greatest_stretch',"World's Greatest Stretch",'mobility','glutes;hip_adductors','hamstrings;back;core','lunge','mobility','bodyweight','bodyweight','floor_mat','floor_space','compound','unsupported','alternating',1,2,1,0,0,'low','beginner','reps','wgs','',''),
('leg_swings','Leg Swings','mobility','glutes;hamstrings','hip_adductors;hip_abductors','mixed','mobility','bodyweight','bodyweight','open_space','floor_space','compound','semi_supported','alternating',1,1,1,0,0,'low','beginner','reps','leg_swings','',''),
]

# ---------------------------------------------------------------- classification of every Pass 2 v1 Athletic record + reused exposure records
CLASS = {  # id -> (verdict, note)
 # KEEP AS WORK EXPOSURE
 'countermovement_jump':('WORK','Simple max-intent vertical jump; beginner entry.'),
 'seated_box_jump':('WORK','Beginner / Low Energy vertical power, low landing.'),
 'box_jump':('WORK','Founder reference staple.'),
 'reactive_vertical_jump':('WORK','Repeatable elastic power (Continuous Vertical Jumps; founder-approved; intermediate, class B).'),
 'drop_jump':('WORK','Advanced reactive power; high-impact gate.'),
 'pogo_hop':('WORK+WARMUP','Founder reference (Pogo Jumps). Work: stiff, max-rebound sets. Warm-up: low-amplitude ankle prep. One record, two prescriptions.'),
 'broad_jump':('WORK','Horizontal power staple.'),
 'consecutive_broad_jump':('WORK','Advanced horizontal elastic power.'),
 'single_leg_hop':('WORK','Unilateral power (hop to stick).'),
 'lateral_single_leg_hop':('WORK','Lateral elastic power for Speed + Agility.'),
 'single_leg_box_jump':('WORK','Unilateral vertical power, low landing.'),
 'alternating_bound':('WORK','Bound (lane, 3 to 4 contacts). Kept because bounds are a founder reference quality.'),
 'skater_hop':('WORK','Lateral bound to stick (shared Sweat record, Athletic prescription).'),
 'sprint_to_stick':('WORK','Renamed Acceleration to Stick (5 m): the one deceleration work exposure.'),
 'mb_chest_pass':('WORK','Throw family.'),'mb_overhead_throw':('WORK','Throw family.'),'mb_scoop_toss':('WORK','Throw family (total-body).'),
 'mb_shot_put':('WORK','Throw family (single-arm, rotational).'),'mb_rotational_throw':('WORK','Throw family.'),'mb_step_behind_throw':('WORK','Throw family (advanced rotational).'),
 'med_ball_slam':('WORK','Throw family (shared Sweat record).'),
 'explosive_push_up':('WORK','Upper-body power.'),
 'acceleration_sprint':('WORK','Re-scoped: Explosive Start (5 to 10 m). The one lane acceleration record.'),
 'falling_start_sprint':('WORK','Floor acceleration (5 m).'),
 'kettlebell_swing':('WORK','Founder reference.'),'kb_snatch':('WORK','Founder reference.'),'db_snatch':('WORK','Advanced explosive lift (library complexity 4).'),
 'db_push_press':('WORK','Explosive press.'),'sled_push':('WORK','Short explosive sled pushes (Athletic prescription).'),
 'air_bike':('QC','QC only.'),'row_erg':('QC','QC only.'),'ski_erg':('QC','QC only.'),
 # MOVE TO WARM-UP
 'wall_drill':('WARMUP','Acceleration mechanics rehearsal.'),'a_march':('WARMUP','Sprint mechanics.'),'a_skip':('WARMUP','Sprint mechanics / rhythm.'),
 'power_skip':('WARMUP','Elastic hip drive rehearsal.'),'line_hops':('WARMUP','Ankle stiffness / quick feet.'),'lateral_shuffle_stick':('WARMUP','Lateral movement rehearsal.'),
 'backpedal_to_stick':('WARMUP','Deceleration rehearsal.'),'snap_down':('WARMUP','Landing mechanics teaching.'),'short_shuttle':('WARMUP','Controlled change-of-direction rehearsal (one turn).'),
 'jump_rope':('WARMUP','Raise + elastic prep (shared Sweat record).'),'high_knees':('WARMUP','Raise + mechanics (shared Sweat record).'),
 # REMOVE
 'split_stance_start_sprint':('REMOVE','Redundant start variant; one Explosive Start record covers start positions by cue.'),
 'half_kneeling_start_sprint':('REMOVE','Redundant start variant.'),'push_up_start_sprint':('REMOVE','Redundant start variant; drill-like.'),
 'drop_step_sprint':('REMOVE','Field-sport start drill.'),'pro_agility_shuttle':('REMOVE','Football combine drill; 10 m lane + turns.'),
 'cut_and_go':('REMOVE','Field-sport COD drill.'),'crossover_sprint':('REMOVE','Field-sport footwork drill.'),'carioca':('REMOVE','Track / field warm-up drill; not needed even as prep.'),
 'dot_drill':('REMOVE','Footwork drill; line hops cover the prep need.'),'broad_jump_to_sprint':('REMOVE','Drill choreography; replaced by jump combinations.'),
 'single_leg_hop_to_sprint':('REMOVE','Drill choreography.'),'shuffle_crossover_sprint':('REMOVE','Drill choreography.'),
 'db_clean_to_press':('REMOVE','Press half is slow strength work; replaced by DB Hang Power Clean.'),
 'kb_clean_and_press':('REMOVE','Same reason; precision-heavy.'),
}
RENAME = {'pogo_hop':'Pogo Jumps','reactive_vertical_jump':'Continuous Vertical Jumps','sprint_to_stick':'Acceleration to Stick (5 m)','acceleration_sprint':'Explosive Start (5-10 m)','skater_hop':'Skater Hops'}
REUSE_WORK_NEW = {'push_press':'aq_olympic;vec_vertical'}    # shared Strength record now Athletic-eligible (barbell push press)

# ---------------------------------------------------------------- qualities
POWER_Q = {'jump','loaded_jump','hop','bound','jump_combo','throw','rotational_throw','rotational_power','upper_power','olympic','explosive_lift'}
MOVE_Q = {'integrated'}   # controlled integrated movement / coordination (not power, not speed)
SPEED_Q = {'acceleration','sled','decel','lateral_power','elastic'}
QGROUP = {'jump':'jump','hop':'jump','bound':'jump','jump_combo':'jump','loaded_jump':'loaded_jump','throw':'throw','rotational_throw':'rotational','rotational_power':'rotational','integrated':'integrated',
          'upper_power':'upper_power','olympic':'lift','explosive_lift':'lift','acceleration':'acceleration','sled':'acceleration','decel':'multidirectional',
          'lateral_power':'multidirectional','elastic':'elastic','machine_sprint':'machine_sprint'}
MAX_INTENT = POWER_Q|{'acceleration','sled','machine_sprint','lateral_power','elastic'}
def tags(e): return [t for t in e.get('vtags','').split(';') if t]
def quality(e):
    q=[t[3:] for t in tags(e) if t.startswith('aq_')]; return q[0] if q else None
def vector(e):
    v=[t[4:] for t in tags(e) if t.startswith('vec_')]; return v[0] if v else None
def family(e):
    q=quality(e); return 'power' if q in POWER_Q else ('speed' if q in SPEED_Q else None)
def is_lower(e): return region_of(e['prim'][0])=='lower' or quality(e) in SPEED_Q|{'jump','hop','bound','jump_combo','loaded_jump'}
def is_upper_or_rot(e): return quality(e) in ('throw','rotational_throw','rotational_power','upper_power','integrated') or vector(e)=='rotational' or region_of(e['prim'][0])=='upper'

def load():
    EX=V1.load_universe()
    for a in R2:
        EX[a[0]]=dict(id=a[0],name=a[1],family=a[2],prim=a[3].split(';'),sec=a[4].split(';'),pat=a[5],mfam=a[6],mod=a[7],eq=a[8],req=[],station=a[9],space=a[10],
                      cls=a[11],sup=a[12],lat=a[13],cx=a[14],nov=a[15],sysd=a[16],forceful=bool(a[17]),explosive=bool(a[18]),prec=a[14]>=4,impact=a[19],skill=a[20],
                      metric=a[21],swap=a[22],combo=bool(a[23]),comps=a[23].split(';') if a[23] else [],variation='',vtags=a[24],new=True,athletic_new=True,rev2=True)
    for i,n in RENAME.items(): EX[i]['name']=n
    # re-tag v1 / reused records to the revised quality model
    RETAG={'skater_hop':'aq_lateral_power;vec_lateral','lateral_single_leg_hop':'aq_lateral_power;vec_lateral','pogo_hop':'aq_elastic;vec_vertical',
           'reactive_vertical_jump':'aq_elastic;vec_vertical','consecutive_broad_jump':'aq_bound;vec_horizontal','sprint_to_stick':'aq_decel;vec_horizontal',
           'db_snatch':'aq_explosive_lift;vec_vertical','sled_push':'aq_sled;vec_horizontal','acceleration_sprint':'aq_acceleration;vec_horizontal'}
    for i,t in RETAG.items(): EX[i]['vtags']=t
    for i,t in REUSE_WORK_NEW.items(): EX[i]['vtags']=t
    # Continuous Vertical Jumps: repeated elastic output (founder), intermediate, moderate impact
    EX['reactive_vertical_jump'].update(impact='moderate',cx=2,skill='intermediate',prec=False)
    for i in REPEATABLE:
        if 'pc_repeatable' not in EX[i]['vtags']: EX[i]['vtags']+=';pc_repeatable'
    # acceleration distance rule: <= 10 m at launch
    EX['acceleration_sprint']['space']='lane'
    return EX

# Prescription class (founder refinement): A = quality-dominant / technical (default); B = repeatable ballistic / elastic (governed tag pc_repeatable)
REPEATABLE={'kettlebell_swing','pogo_hop','reactive_vertical_jump','split_jump','skater_hop','med_ball_slam','mb_rotational_slam','mb_chest_pass','mb_overhead_throw','sled_push','bear_crawl_ball_toss'}
def pclass(e): return 'B' if 'pc_repeatable' in tags(e) else 'A'
def work_ids(EX):
    ids=[i for i,(v,_) in CLASS.items() if v in ('WORK','WORK+WARMUP')]+[a[0] for a in R2 if a[24]]+list(REUSE_WORK_NEW)
    return sorted(set(ids))
QC_OK={'air_bike','row_erg','ski_erg','acceleration_sprint','sled_push','mb_chest_pass','med_ball_slam'}

# ---------------------------------------------------------------- warm-up layer: component sub-slots (Hybrid-style sub-slots; no new field)
WU = {  # component -> ids ; archetype pools listed per component
 'raise':      {'ids':['jump_rope','high_knees','stationary_bike','row_erg','air_bike','ski_erg'],                      'arch':{'P','S','F'}},
 'mobility':   {'ids':['worlds_greatest_stretch','leg_swings','lateral_lunge','glute_bridge','air_squat'],'arch':{'P','S','F'}},
 'elastic':    {'ids':['pogo_hop','line_hops','power_skip','jump_rope'],                               'arch':{'P','S','F'}},
 'landing':    {'ids':['snap_down','seated_box_jump','countermovement_jump','backpedal_to_stick'],     'arch':{'P','S','F'}},
 'mechanics':  {'ids':['a_march','wall_drill','a_skip','high_knees'],                                  'arch':{'S','F'}},
 'lateral':    {'ids':['lateral_shuffle_stick','short_shuttle','skater_hop','lateral_lunge'],          'arch':{'S','F'}},
 'build_up':   {'ids':['acceleration_sprint','falling_start_sprint','sled_push'],                      'arch':{'S','F'}},
 'rehearsal':  {'ids':['<PX exercise at light load / submax>'],                                        'arch':{'P','S','F'}},
}
WU_RECIPE = {
 'P':'raise 2 min, mobility x2, elastic x1, landing x1, rehearsal of PX (2 light sets)  (about 8 to 10 min at 60, 5 to 7 at 30)',
 'S':'raise 2 min, mobility x1, mechanics x1, lateral x1, elastic x1, build-ups x2 to 3  (about 8 to 10 min at 60, 5 to 7 at 30)',
 'F':'raise 2 min, mobility x1, elastic x1, then the prep component matching each exposure (landing for jumps, mechanics / build-up for acceleration, lateral for lateral power, rehearsal for lifts)',
}

# ---------------------------------------------------------------- slot rules (Pass 1 architecture unchanged; revised qualities)
SLOTS = {
 'athletic_power': {'px':{'jump','loaded_jump','olympic','explosive_lift','jump_combo'},
                    'sx':POWER_Q, 'sx2':(POWER_Q-{'olympic'})|{'elastic','lateral_power'}},   # Olympic derivatives only while fresh (PX / SX)
 'athletic_speed_agility': {'px':{'acceleration','sled','lateral_power','bound'},
                    'sx':{'decel','lateral_power','hop','bound','elastic'}, 'sx2':{'elastic','bound','hop','jump_combo','lateral_power','decel','jump','integrated','sled'}},
 'athletic_full_body': {'px':{'jump','loaded_jump','olympic','explosive_lift','acceleration','sled','lateral_power','jump_combo'},
                    'sx':POWER_Q|SPEED_Q|MOVE_Q, 'sx2':(POWER_Q-{'olympic'})|SPEED_Q|MOVE_Q},
}
UPPER_PX={'throw','rotational_throw','rotational_power','upper_power'}   # PX when the lower body is sore (Power, Full-Body Athlete)
ARCH=list(SLOTS)
def exposure_ok(e,exp):
    cap={'beginner':2,'intermediate':3,'advanced':5}[exp]
    if e['cx']>cap: return False
    if ['beginner','intermediate','advanced'].index(e['skill'])>['beginner','intermediate','advanced'].index(exp): return False
    if e['impact']=='high' and exp!='advanced': return False
    return True
def eligibility(EX):
    rows=[]; W=set(work_ids(EX))
    for i in W:
        e=EX[i]; q=quality(e)
        for a,sl in SLOTS.items():
            for s,qs in sl.items():
                if q in qs: rows.append((i,a,s,''))
            if a=='athletic_power' and q=='throw' and region_of(e['prim'][0])=='lower': rows.append((i,a,'px',''))   # total-body scoop / backward toss
            if a!='athletic_speed_agility' and q in UPPER_PX: rows.append((i,a,'px','sore_region = lower'))
    for i in QC_OK:
        for a in ARCH: rows.append((i,a,'qc','experience != beginner'))
    for i,g in V1.SUPPORT.items():
        for a in ARCH:
            if EX[i]['cls']=='isolation' and a!='athletic_speed_agility': continue
            rows.append((i,a,'support',''))
    for i in V1.TRUNK:
        for a in ARCH: rows.append((i,a,'trunk',''))
    AM={'P':'athletic_power','S':'athletic_speed_agility','F':'athletic_full_body'}
    for comp,d in WU.items():
        for i in d['ids']:
            if i.startswith('<'): continue
            for k in d['arch']: rows.append((i,AM[k],'warmup.'+comp,''))
    seen=set(); out=[]
    for r in rows:
        if r[:3] in seen: continue
        seen.add(r[:3]); out.append(r)
    return out

# ---------------------------------------------------------------- impact (D4) unchanged in form; revised membership
UNIT={'low':0.25,'moderate':1.0,'high':3.0}
STOPS={'sprint_to_stick':1,'skater_hop':1,'lateral_single_leg_hop':1}
NOLAND={'acceleration','sled','machine_sprint','throw','rotational_throw','rotational_power','upper_power','olympic','explosive_lift','integrated'}
def unit_per_contact(e):
    u=UNIT[e['impact']]
    if e['impact']=='moderate' and e['lat'] in ('unilateral','alternating') and quality(e) in ('hop','bound','jump_combo','lateral_power'): u*=1.5
    if quality(e)=='loaded_jump': u*=1.5          # loaded landing
    return u
def impact_units(e,sets,reps=0,seconds=0,per_side=False):
    q=quality(e)
    if q in NOLAND and e['id'] not in STOPS: return 0.0
    if e['id']=='sprint_to_stick': return sets*reps*0.5
    contacts=(seconds*2.0) if seconds else reps*(2 if q=='jump_combo' else 1)
    return sets*contacts*(2 if per_side else 1)*unit_per_contact(e)
BUDGET={'beginner':40,'intermediate':70,'advanced':100}; HIGH_CAP={'beginner':0,'intermediate':0,'advanced':30}

PRESETS=dict(V1.PRESETS)
def avail(e,pre):
    eq,sp=PRESETS[pre]
    if e['eq']!='bodyweight' and e['eq'] not in eq: return False
    if e['space'] not in sp: return False
    if e['station']=='med_ball_wall' and 'med_ball' not in eq: return False
    if e['id'] in ('banded_broad_jump','banded_lateral_bound') and 'rack' not in eq: return False
    return True
