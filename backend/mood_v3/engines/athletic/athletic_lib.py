"""MOOD V3 Athletic Pass 2: library + representation (reference data layer, no generator).
One shared exercise universe: Strength Library v11 + Sweat additions (frozen) + Athletic additions below.
Athletic representation uses existing ET fields plus governed variation_tags (aq_* quality, vec_* vector); everything else is derived."""
import sys, itertools
from collections import defaultdict, Counter
from .sweat_shared_data import load_library, ADDITIONS as SWEAT_ADDITIONS, add_new as sweat_add_new, roll, region_of, LOWER

# ------------------------------------------------------------------ Athletic additions (ET v11 field contract; same tuple order as Sweat ADDITIONS)
# id, name, family, prim, sec, pattern, mfam, modality, equip, station, space, class, support, laterality, cx, nov, sys, forceful, explosive, impact, skill, metric, swap, combo_components, tags
A = [
# vertical jumps
('countermovement_jump','Countermovement Jump','vertical_jump','quads;glutes','calves;hamstrings','jump','jump','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',1,2,2,1,1,'moderate','beginner','reps','vertical_jump','','aq_jump;vec_vertical'),
('seated_box_jump','Seated Box Jump','box_jump','quads;glutes','hamstrings;calves','jump','jump','jump','box','box_station','floor_space','compound','unsupported','bilateral',2,4,2,1,1,'low','beginner','reps','box_jump','','aq_jump;vec_vertical'),
('reactive_vertical_jump','Reactive Vertical Jumps','vertical_jump','quads;calves','glutes;hamstrings','jump','jump','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',3,3,3,1,1,'high','advanced','reps','vertical_jump_reactive','','aq_jump;vec_vertical'),
('drop_jump','Drop Jump','depth_jump','quads;calves','glutes;hamstrings','jump','jump','jump','box','box_station','floor_space','compound','unsupported','bilateral',3,4,3,1,1,'high','advanced','reps','depth_jump','','aq_jump;vec_vertical'),
('pogo_hop','Pogo Hops','pogo','calves','quads','jump','hop','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',1,2,2,0,1,'low','beginner','time','pogo','','aq_elastic;vec_vertical'),
# horizontal jumps
('broad_jump','Broad Jump to Stick','broad_jump','glutes;quads','hamstrings;calves','jump','jump','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',2,2,3,1,1,'moderate','beginner','reps','broad_jump','','aq_jump;vec_horizontal'),
('consecutive_broad_jump','Consecutive Broad Jumps','broad_jump','glutes;quads','hamstrings;calves','jump','jump','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',3,3,4,1,1,'high','advanced','reps','broad_jump_reactive','','aq_jump;vec_horizontal'),
# unilateral jumps / hops
('single_leg_hop','Single-Leg Hop to Stick','hop','quads;glutes','calves;hamstrings','jump','hop','jump','bodyweight','open_space','floor_space','compound','unsupported','unilateral',2,3,2,0,1,'moderate','intermediate','reps','single_leg_hop','','aq_hop;vec_horizontal'),
('lateral_single_leg_hop','Lateral Single-Leg Hop to Stick','hop','glutes;quads','hip_abductors;calves','jump','hop','jump','bodyweight','open_space','floor_space','compound','unsupported','unilateral',2,4,2,0,1,'moderate','intermediate','reps','lateral_hop','','aq_hop;vec_lateral'),
('single_leg_box_jump','Single-Leg Box Jump','box_jump','quads;glutes','calves','jump','jump','jump','box','box_station','floor_space','compound','unsupported','unilateral',3,4,2,1,1,'low','intermediate','reps','single_leg_box_jump','','aq_hop;vec_vertical'),
# bounds
('alternating_bound','Alternating Bound','bound','glutes;quads','hamstrings;calves','jump','bound','jump','bodyweight','open_space','lane','compound','unsupported','alternating',3,3,3,1,1,'moderate','intermediate','reps','bound','','aq_bound;vec_horizontal'),
# landing / deceleration
('snap_down','Snap-Down to Stick','landing','quads;glutes','calves;core','jump','landing','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',1,2,1,0,0,'low','beginner','reps','snap_down','','aq_decel;vec_vertical'),
('sprint_to_stick','Sprint to Stick (5 m)','deceleration','quads;glutes','hamstrings;calves','locomotion','decel','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',2,3,2,1,0,'moderate','beginner','reps','sprint_to_stick','','aq_decel;vec_horizontal'),
('backpedal_to_stick','Backpedal to Stick','deceleration','quads;glutes','calves;hamstrings','locomotion','decel','bodyweight','bodyweight','open_space','floor_space','compound','unsupported','alternating',1,3,1,0,0,'low','beginner','reps','backpedal','','aq_decel;vec_horizontal'),
# linear throws (upper / total-body power)
('mb_chest_pass','Med-Ball Chest Pass','chest_pass','chest;triceps','front_delts;core','throw','throw','throw','med_ball','med_ball_wall','floor_space','compound','unsupported','bilateral',1,2,2,1,1,'low','beginner','reps','chest_pass','','aq_throw;vec_horizontal'),
('mb_overhead_throw','Med-Ball Overhead Throw','overhead_throw','back;triceps','core;front_delts','throw','throw','throw','med_ball','med_ball_wall','floor_space','compound','unsupported','bilateral',1,2,2,1,1,'low','beginner','reps','overhead_throw','','aq_throw;vec_horizontal'),
('mb_scoop_toss','Med-Ball Scoop Toss','scoop_toss','glutes;hamstrings','core;shoulders','throw','throw','throw','med_ball','med_ball_wall','floor_space','integrated','unsupported','bilateral',2,3,3,1,1,'low','beginner','reps','scoop_toss','hinge;throw','aq_throw;vec_horizontal'),
('mb_shot_put','Med-Ball Shot-Put Throw','shot_put','chest;triceps','core;front_delts','throw','throw','throw','med_ball','med_ball_wall','floor_space','integrated','unsupported','unilateral',2,4,2,1,1,'low','intermediate','reps','shot_put','rotation;throw','aq_throw;vec_rotational'),
# rotational throws
('mb_rotational_throw','Med-Ball Rotational Throw','rotational_throw','core','glutes;shoulders','throw','throw','throw','med_ball','med_ball_wall','floor_space','integrated','unsupported','unilateral',2,3,2,1,1,'low','beginner','reps','rotational_throw','rotation;throw','aq_rotational_throw;vec_rotational'),
('mb_step_behind_throw','Step-Behind Rotational Throw','rotational_throw','core','glutes;shoulders','throw','throw','throw','med_ball','med_ball_wall','floor_space','integrated','unsupported','unilateral',3,4,3,1,1,'low','intermediate','reps','rotational_throw_step','rotation;throw','aq_rotational_throw;vec_rotational'),
# upper-body power
('explosive_push_up','Explosive Push-Up','push_up','chest;triceps','front_delts;core','horizontal_push','push','bodyweight','bodyweight','floor_mat','floor_space','compound','unsupported','bilateral',2,3,2,1,1,'low','intermediate','reps','explosive_push_up','','aq_upper_power;vec_horizontal'),
# acceleration / starts
('acceleration_sprint','Acceleration Sprint (10-20 m)','sprint','quads;glutes','hamstrings;calves','sprint','sprint','running','bodyweight','open_space','lane','compound','unsupported','alternating',1,2,3,1,1,'moderate','beginner','distance','acceleration','','aq_acceleration;vec_horizontal'),
('falling_start_sprint','Falling-Start Sprint (5 m)','sprint','quads;glutes','hamstrings;calves','sprint','sprint','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',1,3,2,1,1,'moderate','beginner','distance','acceleration_short','','aq_acceleration;vec_horizontal'),
('push_up_start_sprint','Push-Up-Start Sprint (5 m)','sprint','quads;glutes','chest;hamstrings','sprint','sprint','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',2,4,3,1,1,'moderate','intermediate','distance','acceleration_short_start','','aq_acceleration;vec_horizontal'),
('drop_step_sprint','Drop-Step Start Sprint (5 m)','sprint','glutes;quads','hip_adductors;calves','sprint','sprint','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',2,4,2,0,1,'moderate','intermediate','distance','drop_step_start','','aq_acceleration;vec_multi'),
('wall_drill','Wall Drill (March to Switches)','wall_drill','quads;glutes','calves;core','locomotion','drill','bodyweight','bodyweight','open_space','floor_space','compound','semi_supported','alternating',1,2,1,0,0,'low','beginner','time','wall_drill','','aq_acceleration;vec_horizontal'),
('split_stance_start_sprint','Split-Stance Start Sprint (5 m)','sprint','quads;glutes','hamstrings;calves','sprint','sprint','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',1,2,2,1,1,'moderate','beginner','distance','acceleration_split_start','','aq_acceleration;vec_horizontal'),
('half_kneeling_start_sprint','Half-Kneeling Start Sprint (5 m)','sprint','quads;glutes','hamstrings;calves','sprint','sprint','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',1,3,2,1,1,'moderate','beginner','distance','acceleration_kneel_start','','aq_acceleration;vec_horizontal'),
# change of direction
('pro_agility_shuttle','5-10-5 Pro-Agility Shuttle','shuttle','quads;glutes','hip_adductors;calves','locomotion','cod','running','bodyweight','open_space','lane','compound','unsupported','alternating',2,2,3,0,0,'moderate','intermediate','reps','pro_agility','','aq_cod;vec_lateral'),
('short_shuttle','5-5 Shuttle','shuttle','quads;glutes','hip_adductors;calves','locomotion','cod','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',2,2,2,0,0,'moderate','intermediate','reps','short_shuttle','','aq_cod;vec_horizontal'),
('cut_and_go','45-Degree Cut and Go','cut','quads;glutes','hip_adductors;hip_abductors','locomotion','cod','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',2,4,2,0,0,'moderate','intermediate','reps','cut','','aq_cod;vec_multi'),
# lateral agility
('lateral_shuffle_stick','Lateral Shuffle to Stick','shuffle','glutes;quads','hip_abductors;hip_adductors','locomotion','lateral','bodyweight','bodyweight','open_space','floor_space','compound','unsupported','alternating',1,2,2,0,0,'low','beginner','reps','lateral_shuffle','','aq_lateral;vec_lateral'),
('crossover_sprint','Crossover Step to Sprint (5 m)','crossover','glutes;quads','hip_adductors;calves','locomotion','lateral','running','bodyweight','open_space','floor_space','compound','unsupported','alternating',2,4,2,0,1,'moderate','intermediate','reps','crossover','','aq_lateral;vec_lateral'),
('carioca','Carioca','carioca','glutes;hip_abductors','hip_adductors;core','locomotion','lateral','bodyweight','bodyweight','open_space','lane','compound','unsupported','alternating',3,4,2,0,0,'low','intermediate','distance','carioca','','aq_lateral;vec_lateral'),
# footwork
('line_hops','Line Hops','line_hop','calves','quads','jump','hop','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',1,2,2,0,0,'low','beginner','time','line_hops','','aq_footwork;vec_multi'),
('dot_drill','Dot Drill','dot_drill','calves','quads;core','jump','hop','jump','bodyweight','open_space','floor_space','compound','unsupported','bilateral',2,4,2,0,0,'low','intermediate','time','dot_drill','','aq_footwork;vec_multi'),
# coordination / skips
('a_march','A-March','skip_drill','quads;core','calves;glutes','locomotion','drill','bodyweight','bodyweight','open_space','floor_space','compound','unsupported','alternating',1,2,1,0,0,'low','beginner','distance','a_march','','aq_coordination;vec_vertical'),
('a_skip','A-Skip','skip_drill','quads;calves','glutes;core','locomotion','skip','bodyweight','bodyweight','open_space','lane','compound','unsupported','alternating',2,3,2,0,0,'low','beginner','distance','a_skip','','aq_coordination;vec_vertical'),
('power_skip','Power Skip','skip','glutes;calves','quads;hamstrings','jump','skip','jump','bodyweight','open_space','lane','compound','unsupported','alternating',2,3,2,1,1,'moderate','beginner','reps','power_skip','','aq_bound;vec_vertical'),
# self-initiated combination drills
('broad_jump_to_sprint','Broad Jump to Sprint (5 m)','combo_start','glutes;quads','hamstrings;calves','jump','combo','jump','bodyweight','open_space','floor_space','integrated','unsupported','bilateral',2,4,3,1,1,'moderate','intermediate','reps','jump_to_sprint','jump;sprint','aq_combination;vec_horizontal'),
('single_leg_hop_to_sprint','Single-Leg Hop to Sprint (5 m)','combo_start','quads;glutes','calves;hamstrings','jump','combo','jump','bodyweight','open_space','floor_space','integrated','unsupported','unilateral',3,4,3,1,1,'moderate','intermediate','reps','hop_to_sprint','jump;sprint','aq_combination;vec_horizontal'),
('shuffle_crossover_sprint','Shuffle-Crossover-Sprint','combo_start','glutes;quads','hip_adductors;calves','locomotion','combo','running','bodyweight','open_space','lane','integrated','unsupported','alternating',3,4,3,0,1,'moderate','intermediate','reps','shuffle_to_sprint','lateral;sprint','aq_combination;vec_multi'),
]
# Athletic role of REUSED shared records (tags this pass would add to their variation_tags; no record duplicated)
REUSE_TAGS = {
 'box_jump':'aq_jump;vec_vertical', 'skater_hop':'aq_bound;vec_lateral', 'med_ball_slam':'aq_throw;vec_vertical',
 'jump_rope':'aq_footwork;vec_vertical', 'high_knees':'aq_footwork;vec_vertical',
 'kettlebell_swing':'aq_explosive_lift;vec_horizontal', 'kb_snatch':'aq_explosive_lift;vec_vertical', 'db_snatch':'aq_explosive_lift;vec_vertical',
 'db_clean_to_press':'aq_explosive_lift;vec_vertical', 'kb_clean_and_press':'aq_explosive_lift;vec_vertical', 'db_push_press':'aq_upper_power;vec_vertical',
 'sled_push':'aq_sled;vec_horizontal',
 'air_bike':'aq_machine_sprint', 'row_erg':'aq_machine_sprint', 'ski_erg':'aq_machine_sprint',
}
SUPPORT = {  # reused Strength / Sweat records -> support group
 'trap_bar_deadlift':'lower_bilateral','goblet_squat':'lower_bilateral','barbell_back_squat':'lower_bilateral','front_squat':'lower_bilateral','kettlebell_deadlift':'lower_bilateral',
 'db_rdl':'posterior','single_leg_rdl':'posterior','kickstand_db_rdl':'posterior','barbell_rdl':'posterior','nordic_curl':'posterior','slider_hamstring_curl':'posterior','single_leg_glute_bridge':'posterior',
 'bulgarian_split_squat':'lower_unilateral','front_foot_elevated_split_squat':'lower_unilateral','reverse_lunge':'lower_unilateral','lateral_lunge':'lower_unilateral',
 'walking_lunge':'lower_unilateral','db_step_up':'lower_unilateral','lateral_step_up':'lower_unilateral',
 'pull_up':'upper_pull','chin_up':'upper_pull','single_arm_db_row':'upper_pull','chest_supported_db_row':'upper_pull','inverted_row':'upper_pull','suspension_row':'upper_pull',
 'push_up':'upper_push','db_bench_press':'upper_push','db_incline_press':'upper_push','landmine_press_single_arm':'upper_push','half_kneeling_landmine_press':'upper_push','db_shoulder_press':'upper_push',
}
TRUNK = ['pallof_press','pallof_step_out','dead_bug','side_plank','copenhagen_plank','landmine_rotation','cable_wood_chop','plank','hollow_hold',
         'suitcase_carry','waiter_carry','overhead_carry','front_rack_carry']

# ------------------------------------------------------------------ quality model (derived from aq_* tag)
POWER_Q = {'jump','hop','bound','throw','rotational_throw','upper_power','explosive_lift'}
SPEED_Q = {'acceleration','sled','decel','cod','lateral','footwork','coordination','elastic','combination'}
QGROUP = {'jump':'jump','hop':'jump','bound':'jump','throw':'throw','rotational_throw':'rotational_throw','upper_power':'upper_power','explosive_lift':'explosive_lift',
          'acceleration':'acceleration','sled':'acceleration','decel':'agility','cod':'agility','lateral':'agility','footwork':'footwork_coordination',
          'coordination':'footwork_coordination','elastic':'footwork_coordination','combination':'combination','machine_sprint':'machine_sprint'}
MAX_INTENT = {'jump','hop','bound','throw','rotational_throw','upper_power','explosive_lift','acceleration','sled','machine_sprint'}
def tags(e): return [t for t in e.get('vtags','').split(';') if t]
def quality(e):
    q=[t[3:] for t in tags(e) if t.startswith('aq_')]; return q[0] if q else None
def vector(e):
    v=[t[4:] for t in tags(e) if t.startswith('vec_')]; return v[0] if v else None
def family(e):
    q=quality(e); return 'power' if q in POWER_Q else ('speed' if q in SPEED_Q else None)
def intent_mode(e,exp):
    if exp=='beginner': return 'precision_first'
    return 'max_intent' if quality(e) in MAX_INTENT else 'precision_first'
def is_lower(e): return region_of(e['prim'][0])=='lower' or quality(e) in ('acceleration','sled','decel','cod','lateral','footwork','coordination','elastic','combination','jump','hop','bound')
def is_upper_or_rot(e): return quality(e) in ('throw','rotational_throw','upper_power') or vector(e)=='rotational' or (quality(e)=='explosive_lift' and region_of(e['prim'][0])=='upper')

# ------------------------------------------------------------------ impact budget (D4): units per contact by impact_level x landing laterality
UNIT = {'low':0.25,'moderate':1.0,'high':3.0}
def unit_per_contact(e):
    u=UNIT[e['impact']]
    if e['impact']=='moderate' and e['lat'] in ('unilateral','alternating') and quality(e) in ('hop','bound','combination'): u*=1.5
    return u
CONTACTS_PER_S = 2.0          # timed low-amplitude drills (pogos, line hops, dot drill, jump rope)
STOPS = {'backpedal_to_stick':1,'sprint_to_stick':1,'pro_agility_shuttle':2,'short_shuttle':1,'cut_and_go':1,'lateral_shuffle_stick':1,'crossover_sprint':1,'snap_down':1,'shuffle_crossover_sprint':1}
def impact_units(e,sets,reps=0,seconds=0,per_side=False):
    q=quality(e)
    if q in ('acceleration','sled','machine_sprint','throw','rotational_throw','upper_power','explosive_lift','coordination') and e['id'] not in STOPS: return 0.0   # strides, throws, lifts: not landing load
    if e['id'] in STOPS: return sets*reps*(2 if per_side else 1)*STOPS[e['id']]*0.5
    contacts = seconds*CONTACTS_PER_S if seconds else reps
    return sets*contacts*(2 if per_side else 1)*unit_per_contact(e)
BUDGET = {'beginner':40,'intermediate':70,'advanced':100}
HIGH_CAP = {'beginner':0,'intermediate':0,'advanced':30}     # units from impact_level = high

# ------------------------------------------------------------------ build universe
def load_universe():
    EX = sweat_add_new(load_library())          # Strength v11 + Sweat additions (no Sweat view overrides; Athletic reads the library values)
    for a in A:
        EX[a[0]] = dict(id=a[0],name=a[1],family=a[2],prim=a[3].split(';'),sec=a[4].split(';'),pat=a[5],mfam=a[6],mod=a[7],eq=a[8],req=[],station=a[9],space=a[10],
                        cls=a[11],sup=a[12],lat=a[13],cx=a[14],nov=a[15],sysd=a[16],forceful=bool(a[17]),explosive=bool(a[18]),prec=False,impact=a[19],skill=a[20],
                        metric=a[21],swap=a[22],combo=bool(a[23]),comps=a[23].split(';') if a[23] else [],variation='',vtags=a[24],new=True,athletic_new=True)
    for i,t in REUSE_TAGS.items(): EX[i]['vtags']=t
    return EX

# ------------------------------------------------------------------ eligibility (Athletic rows; condition grammar reuses ET K13 style)
ARCH = ['athletic_power','athletic_speed_agility','athletic_full_body']
SLOTS = {
 'athletic_power': {'px':{'jump','explosive_lift'}, 'px_upper':{'throw','rotational_throw','upper_power'},
                    'sx':{'jump','hop','bound','throw','rotational_throw','upper_power','explosive_lift'},
                    'sx2':{'jump','hop','bound','throw','rotational_throw','upper_power','explosive_lift','elastic','combination'}},
 'athletic_speed_agility': {'px':{'acceleration','sled','combination'}, 'sx':{'decel','cod','lateral'},
                    'sx2':{'footwork','coordination','elastic','bound','hop','combination','decel','lateral'}},
 'athletic_full_body': {'px':{'jump','explosive_lift','acceleration','sled'}, 'px_upper':{'throw','rotational_throw','upper_power'},
                    'sx':POWER_Q|SPEED_Q, 'sx2':POWER_Q|SPEED_Q},
}
QC_OK = {'air_bike','row_erg','ski_erg','acceleration_sprint','sled_push','mb_chest_pass','med_ball_slam'}
def exposure_ok(e,exp):
    """Experience gates (AI-12): complexity cap, skill, impact."""
    cap={'beginner':2,'intermediate':3,'advanced':5}[exp]
    if e['cx']>cap: return False
    if {'beginner':0,'intermediate':1,'advanced':2}[e['skill']]>{'beginner':0,'intermediate':1,'advanced':2}[exp]: return False
    if e['impact']=='high' and exp!='advanced': return False
    return True
EXTRA_OK = {   # structural admissions beyond the quality sets
 ('athletic_power','px'): lambda e: quality(e)=='throw' and region_of(e['prim'][0])=='lower',          # lower-driven total-body throw (scoop toss)
 ('athletic_speed_agility','sx'): lambda e: quality(e) in ('bound','hop') and vector(e)=='lateral',     # lateral bound / hop to stick = lateral agility
 ('athletic_power','sx2'): lambda e: quality(e)=='decel' and vector(e)=='vertical',                 # landing drill (snap-down): beginner landing mechanics
}
def build_eligibility(EX):
    rows=[]
    for e in EX.values():
        q=quality(e)
        for (aid,slot),f in EXTRA_OK.items():
            if f(e): rows.append((e['id'],aid,slot,'preferred',''))
        for aid in ARCH:
            for slot,qs in SLOTS[aid].items():
                if q in qs:
                    cond='sore_region = lower' if slot=='px_upper' else ''
                    if slot=='px_upper': slot='px'
                    if slot=='px' and q in ('throw','rotational_throw','upper_power') and not (aid=='athletic_power' and region_of(e['prim'][0])=='lower'): cond='sore_region = lower'
                    rows.append((e['id'],aid,slot,'preferred',cond))
            if e['id'] in QC_OK: rows.append((e['id'],aid,'qc','preferred','experience != beginner'))
            if e['id'] in SUPPORT:
                cond='archetype = athletic_speed_agility' if e['cls']=='isolation' else ''
                if e['cls']=='isolation' and aid!='athletic_speed_agility': continue
                rows.append((e['id'],aid,'support','preferred',cond))
            if e['id'] in TRUNK: rows.append((e['id'],aid,'trunk','preferred',''))
    seen=set(); out=[]
    for r in rows:
        if r[:3] in seen: continue
        seen.add(r[:3]); out.append(r)
    return out

# ------------------------------------------------------------------ presets (Athletic uses the same preset idea as Sweat)
ALL_EQUIP={'bodyweight','barbell','dumbbells','kettlebell','cable','selectorized_machine','plate_loaded_machine','smith_machine','bands','suspension_trainer',
 'pullup_bar','bench','rack','landmine','med_ball','slam_ball','sled','battle_ropes','box','rower','bike','treadmill','ski_erg','stair_climber','jump_rope',
 'trap_bar','ez_bar','ab_wheel','dip_station','plate','back_extension_bench','captains_chair'}
PRESETS={
 'athletic_commercial_default':(ALL_EQUIP,{'standard_gym','floor_space','lane','turf'}),
 'commercial_floor_only':(ALL_EQUIP,{'standard_gym','floor_space'}),
 'free_weight_limited':({'bodyweight','dumbbells','kettlebell','bench','box','jump_rope','bands','pullup_bar','med_ball','slam_ball'},{'standard_gym','floor_space','lane'}),
 'bodyweight_floor':({'bodyweight'},{'floor_space'}),
}
def avail(e,preset):
    eq,sp=PRESETS[preset]
    if e['eq']!='bodyweight' and e['eq'] not in eq: return False
    if e['space'] not in sp: return False
    if e['station']=='med_ball_wall' and 'med_ball' not in eq: return False
    return True
