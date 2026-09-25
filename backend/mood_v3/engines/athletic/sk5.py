"""Athletic FINAL FREEZE founder pack (16 workouts, same coverage as the Pass 2 pack) + automated checks + negative tests.
Rules: lib3 (simplified warm-up, optional purpose-bound Performance Support, no Trunk slot) on the frozen lib2 library."""
import json, re, hashlib, sys
from .lib3 import *
from .audit2 import EX, LV
EL3=eligibility3(EX); ELIG={(i,a,s) for (i,a,s,c) in EL3}; COND={(i,a,s):c for (i,a,s,c) in EL3}
WORK={'explosive_lift':2,'olympic':2.5,'throw':1.5,'rotational_throw':2,'rotational_power':2,'upper_power':1.5,'loaded_jump':2,'jump_combo':3,'elastic':1.2}
def X(slot,i,sets,reps=0,sec=0,rest=60,per_side=False,work=None,dose=None,m=None,**kw):
    e=EX[i]
    if work is None:
        if sec: work=sec
        elif slot=='ps': work=reps*3
        elif e['metric']=='distance': work=3 if i!='sled_push' else 5
        else: work=reps*WORK.get(quality(e),1.5)
    w=work*(2 if per_side else 1)
    return dict(slot=slot,id=i,sets=sets,reps=reps,sec=sec,rest=rest,per_side=per_side,t=sets*w+(sets-1)*rest,act=sets*w,dose=dose,m=m,**kw)
def QC(i,bouts,work,rec,dose=None):
    return dict(slot='qc',id=i,sets=bouts,reps=1,sec=work,rest=rec,t=bouts*work+(bouts-1)*rec,act=bouts*work,per_side=False,bouts=bouts,dose=dose,m=None)
def PSX(i,sets,reps=0,per_side=False,rest=90,dose='2-3 RIR',why=None,work=None,sec=0):
    return X('ps',i,sets,reps,sec=sec,rest=rest,per_side=per_side,dose=dose,purpose=PS.get(i,'none'),why=why,work=work)
SK={}
def add(k,title,aid,dur,lv,pre,states,wu,items,sore=set(),focus='',reason=None,trim=False):
    SK[k]=dict(title=title,aid=aid,dur=dur,lv=lv,pre=pre,states=states,wu=list(wu),items=items,sore=set(sore),focus=focus,ps_reason=reason,trim=trim)
LOAD_RULE={'olympic':(3,120),'explosive_lift':(5,60),'loaded_jump':(5,90),'upper_power':(5,60),'rotational_power':(5,60)}
def dist(x):
    mm=re.search(r'(\d+)\s*m\b',x.get('dose') or '') if isinstance(x,dict) else re.search(r'(\d+)\s*m\b',x)
    return int(mm.group(1)) if mm else None
def check(k):
    s=SK[k]; aid,lv,pre,dur=s['aid'],s['lv'],s['pre'],s['dur']; f=[]; items=s['items']
    if s['trim']: s['wu']=wu_trim(s['wu'],EX[items[0]['id']],aid,next((EX[x['id']] for x in items if x['slot']=='sx'),None))
    exp=[x for x in items if x['slot'] in EXPOSURE]; nonqc=[x for x in exp if x['slot']!='qc']; ps=[x for x in items if x['slot']=='ps']
    # ---- structure
    for x in items:
        if x['slot'] not in EXPOSURE+('ps',): f.append(f"slot '{x['slot']}' is not in the Athletic architecture")
    if not items or items[0]['slot']!='px' or not any(x['slot']=='sx' for x in items): f.append('PX first + SX required')
    order=[x['slot'] for x in items]; rank={'px':0,'sx':1,'sx2':2,'qc':3,'ps':4}
    if order!=sorted(order,key=lambda z:rank.get(z,9)): f.append('block order')
    # ---- per item: eligibility, availability, gates, soreness
    for x in items:
        e=EX[x['id']]
        if x['slot'] in rank and (x['id'],aid,x['slot']) not in ELIG: f.append(f"not eligible {x['id']} as {x['slot']}")
        if COND.get((x['id'],aid,x['slot']))=='sore_region = lower' and not (s['sore']&LOWER): f.append('upper PX without lower soreness')
        if not avail(e,pre): f.append(f"equipment/space unavailable {x['id']}")
        cap={'beginner':2,'intermediate':3,'advanced':5}[lv]
        if x['slot'] in EXPOSURE and not exposure_ok(e,lv): f.append(f"experience gate {x['id']}")
        if x['slot']=='ps' and (e['cx']>cap or LV.index(e['skill'])>LV.index(lv)): f.append(f"experience gate {x['id']}")
        if (set(e['prim'])|{roll(mm) for mm in e['prim']}) & s['sore']: f.append(f"sore {x['id']}")
        if quality(e) in ('acceleration','sled') or x['id']=='sprint_to_stick':
            d=dist(x)
            if d is None or d>10: f.append(f"acceleration distance {d} m (max 10)")
        if e['eq']=='treadmill': f.append('treadmill in Athletic')
    # ---- warm-up
    sxe=next((EX[x['id']] for x in items if x['slot']=='sx'),None)
    f+=wu_check(s['wu'],EX[items[0]['id']],aid,s['sore'],sxe)
    for c,i,note in [(w[0],w[1],w[2] if len(w)>2 else '') for w in s['wu']]:
        if c=='rehearsal' and i in EX and quality(EX[i]) in ('acceleration','sled') and (dist(note) or 99)>10: f.append('build-up > 10 m')
    # ---- Type A / Type B prescription
    for x in nonqc:
        e=EX[x['id']]; per_set=x['act']/x['sets']
        if pclass(e)=='A':
            r=LOAD_RULE.get(quality(e))
            if r and (x['reps']>r[0] or x['rest']<r[1]): f.append(f"Type A load rule {x['id']} {x['reps']} reps / {x['rest']} s")
            if x['sec']>10 or (not r and e['metric']=='reps' and x['reps']>(6 if not x['per_side'] else 5)): f.append(f"Type A dose {x['id']}")
            if x['act']/x['t']>0.35: f.append(f"Type A density {x['id']} {x['act']/x['t']:.2f}")
        else:
            if x['reps']>(10 if x['per_side'] else 20) or per_set>30 or x['rest']<max(30,per_set): f.append(f"Type B bout {x['id']} {per_set:.0f} s / {x['rest']} s")
            if x['act']/x['t']>0.50: f.append(f"Type B density {x['id']} {x['act']/x['t']:.2f}")
    sess=sum(x['act'] for x in nonqc)/sum(x['t'] for x in nonqc) if nonqc else 1
    if sess>0.40: f.append(f'session exposure density {sess:.2f}')
    if not any(pclass(EX[x['id']])=='A' for x in nonqc): f.append('no Type A exposure')
    # ---- QC
    q=[x for x in exp if x['slot']=='qc']
    if len(q)>1 or any(x['t']>480 or x['rest']<4*x['sec'] or not 3<=x['sec']<=10 for x in q) or (q and lv=='beginner'): f.append('QC contract')
    if dur==30 and (q or any(x['slot']=='sx2' for x in exp)): f.append('30 min has SX2 / QC')
    if 'low_energy' in s['states'] and q: f.append('QC on Low Energy')
    # ---- archetype identity
    groups={QGROUP.get(quality(EX[x['id']]),'none') for x in nonqc}; fams=[family(EX[x['id']]) for x in nonqc]
    if aid=='athletic_power' and fams.count('power')<2: f.append('Power needs >= 2 power exposures')
    if aid=='athletic_speed_agility' and fams.count('speed')<1: f.append('Speed family')
    if aid=='athletic_full_body':
        if len(groups)<2: f.append('FBA < 2 qualities')
        if dur==60 and not s['sore']&LOWER and 'fba_regions' not in s.get('relax',()) and not (any(is_lower(EX[x['id']]) for x in nonqc) and any(is_upper_or_rot(EX[x['id']]) for x in nonqc)): f.append('FBA regions')
    # ---- Performance Support
    ex_t=sum(x['t'] for x in exp); ps_t=sum(x['t'] for x in ps); share=ex_t/(ex_t+ps_t) if ex_t+ps_t else 1
    if share<SHARE_MIN: f.append(f'exposure share {share:.2f}')
    n_ps=len({x['id'] for x in ps}); ps_sets=sum(x['sets'] for x in ps); cap=PS_CAP[dur]
    if n_ps>cap['ex'] or ps_sets>cap['sets']: f.append(f'Performance Support cap ({n_ps} ex / {ps_sets} sets at {dur})')
    if n_ps==2 and (not s['ps_reason'] or share<PS2_MIN_SHARE): f.append('2 Performance Support exercises without a stated reason / share >= 0.70')
    if ps_sets>sum(x['sets'] for x in nonqc): f.append('SUP-5 support sets > exposure sets')
    for x in ps:
        if x['id'] not in PS: f.append(f"{x['id']} is not a Performance Support record")
        elif not ps_relevant(PS[x['id']],[EX[y['id']] for y in nonqc],s['sore']): f.append(f"Performance Support {x['id']} ({PS[x['id']]}) has no purpose in this session")
    # ---- impact
    imp=sum(impact_units(EX[x['id']],x['sets'],x['reps'],x['sec'],x['per_side']) for x in nonqc)
    hi=sum(impact_units(EX[x['id']],x['sets'],x['reps'],x['sec'],x['per_side']) for x in nonqc if EX[x['id']]['impact']=='high')
    if imp>BUDGET[lv]: f.append(f'impact {imp:.0f} > {BUDGET[lv]}')
    if hi>HIGH_CAP[lv]: f.append(f'high impact {hi:.0f}')
    # ---- duration (fill never adds PS to reach the floor)
    wu_m=wu_minutes(s['wu'],dur); nb=len({x['slot'] for x in items})+max(0,len(ps)-1)
    total=wu_m+sum(x['t'] for x in items)/60+nb+(3 if dur==60 else 2)
    total_wo_ps=total-(ps_t/60+(len(ps) and len(ps)))
    lo={60:(DUR_FLOOR_60_LOW if (lv=='beginner' or 'low_energy' in s['states']) else DUR_FLOOR_60),30:DUR_FLOOR_30}[dur]
    hi_b={60:55,30:30}[dur]
    if 'duration_floor' in s.get('relax',()): lo={60:20,30:15}[dur]      # equipment-limited preset, fill exhausted under hard limits (logged)
    if not lo<=total<=hi_b: f.append(f'duration {total:.1f} outside {lo}-{hi_b}')
    s['wu_min']=wu_m
    return dict(total=round(total,1),total_without_ps=round(total_wo_ps,1),wu_min=wu_m,wu_items=len(s['wu']),share=round(share,2),session_density=round(sess,2),
                max_density=max(round(x['act']/x['t'],2) for x in nonqc) if nonqc else 0,impact=round(imp,1),high=round(hi,1),ps_ex=n_ps,ps_sets=ps_sets,
                ps=[f"{EX[x['id']]['name']} ({PS.get(x['id'],'-').replace('_',' ')})" for x in ps],qualities=sorted(groups),
                typeB=[EX[x['id']]['name'] for x in nonqc if pclass(EX[x['id']])=='B'],fails=f)
P='athletic_commercial_default'; F='commercial_floor_only'
R=lambda i,note='': ('rehearsal',i,note)
def W(*a): return [(c,i,'') if isinstance(i,str) else None for c,i in a]
# =========================================================================================== POWER
add('F1','Power · Intermediate · Normal · 60','athletic_power',60,'intermediate',P,[],
  [('raise','row_erg','2-3 min easy'),('prep','leg_swings','front-back and side, 10 each'),('primer','pogo_hop','2 x 10'),R('trap_bar_jump','light, 2 x 2')],
  [X('px','trap_bar_jump',6,3,rest=120,dose='light (20-30% of deadlift), jump as high as possible'),
   X('sx','landmine_rotational_punch',5,3,rest=75,per_side=True,dose='drive from the back hip, punch fast'),
   X('sx2','reactive_vertical_jump',4,8,rest=75,work=10,dose='springy, minimal ground contact; end the set when height drops'),QC('acceleration_sprint',6,3,60,dose='10 m, walk back'),
   PSX('bulgarian_split_squat',3,6,per_side=True,dose='2-3 RIR',why='single-leg strength for jumping and landing')],
  focus='Loaded jumps, landmine rotation, continuous jumps, short sprints + 1 single-leg lift')
add('F2','Power · Advanced · Normal · 60 · Olympic day','athletic_power',60,'advanced',P,[],
  [('raise','row_erg','2-3 min easy'),('prep','worlds_greatest_stretch','3 / side'),('primer','pogo_hop','2 x 10'),R('power_snatch','empty bar, 3 x 2')],
  [X('px','power_snatch',6,2,rest=150,dose='light-moderate, fast turnover'),X('sx','box_jump',4,3,rest=90),
   X('sx2','landmine_rotational_clean_press',4,3,rest=90,per_side=True,dose='fast hips, punch the press'),
   PSX('front_squat',3,3,rest=150,dose='2 RIR',why='bilateral strength that feeds the snatch receive')],
  focus='Olympic day: Power Snatch, box jumps, landmine clean and press + 1 squat')
add('F3','Power · Intermediate · Normal · 30','athletic_power',30,'intermediate',P,[],
  [('raise','jump_rope','2 min easy'),('prep','leg_swings','10 each way'),('primer','pogo_hop','2 x 10'),R('push_press','empty bar, 2 x 3')],
  [X('px','push_press',5,3,rest=120,dose='moderate load, dip and drive fast'),X('sx','banded_broad_jump',5,3,rest=90,dose='light band, max distance, stick')],
  focus='Short and sharp: push press, banded broad jumps. Ends after the Athletic work')
add('F4','Power · Beginner · Normal · 60 · floor only','athletic_power',60,'beginner',F,[],
  [('raise','stationary_bike','2-3 min easy'),('prep','glute_bridge','10'),('primer','snap_down','2 x 5'),('primer','pogo_hop','2 x 8, small')],
  [X('px','broad_jump',5,3,rest=75,dose='jump far, stick the landing'),X('sx','mb_scoop_toss',4,4,rest=60),
   X('sx2','med_ball_slam',5,8,rest=60,work=16,dose='hard slams; end the set when they lose snap'),
   PSX('goblet_squat',3,8,rest=75,dose='3 RIR',why='basic leg strength behind the jumps')],
  focus='Beginner: broad jumps and med-ball throws + 1 squat')
add('F5','Power · Intermediate · Irritated · 60','athletic_power',60,'intermediate',P,['irritated'],
  [('raise','row_erg','2-3 min'),('prep','leg_swings','10 each way'),('primer','snap_down','2 x 5'),R('kettlebell_swing','light, 1 x 8')],
  [X('px','kettlebell_swing',6,15,rest=45,work=22,dose='heavy enough to snap; end the set when the hips stop snapping'),
   X('sx','mb_rotational_slam',5,5,rest=60,per_side=True,work=8,dose='slam through the floor, alternate sides'),
   X('sx2','box_jump',5,3,rest=90),QC('sled_push',8,5,45,dose='10 m, light sled, walk back')],
  focus='Irritated: swings, slams, box jumps, sled efforts. Ends after the Athletic work')
add('F6','Power · Intermediate · Amped · 60','athletic_power',60,'intermediate',P,['amped'],
  [('raise','air_bike','2-3 min'),('prep','worlds_greatest_stretch','3 / side'),('primer','snap_down','2 x 5'),R('hang_clean_to_box_knee_drive','light, 1 x 2 / side')],
  [X('px','hang_clean_to_box_knee_drive',5,2,rest=120,per_side=True,dose='moderate DBs, clean fast, drive the knee onto the box'),
   X('sx','trap_bar_jump',5,3,rest=120,dose='light, max height'),X('sx2','mb_shot_put',4,3,rest=60,per_side=True),QC('air_bike',7,6,54,dose='6 s all-out'),
   PSX('pull_up',3,6,dose='2-3 RIR',why='upper-back balance for the clean')],
  focus='Amped: clean-to-box, trap-bar jumps, extra bike sprints + 1 pull')
# =========================================================================================== SPEED + AGILITY
add('F7','Speed + Agility · Intermediate · Normal · 60 · lane + sled','athletic_speed_agility',60,'intermediate',P,[],
  [('raise','air_bike','2-3 min easy'),('prep','leg_swings','10 each way'),('primer','a_skip','2 x 10 m'),('rehearsal','acceleration_sprint','2 x 10 m at 70-80%')],
  [X('px','sled_push',6,1,rest=90,dose='10 m, light-moderate sled, drive fast'),X('sx','banded_lateral_bound',5,3,rest=75,per_side=True,dose='light band, max distance, stick'),
   X('sx2','pogo_to_box_jump',4,2,rest=90),QC('acceleration_sprint',6,3,60,dose='10 m, walk back'),
   PSX('slider_hamstring_curl',3,8,rest=75,dose='controlled',why='hamstring resilience for sprinting')],
  focus='Sled starts, banded lateral bounds, pogo to box + 1 hamstring exercise')
add('F8','Speed + Agility · Intermediate · Normal · 30 · floor only','athletic_speed_agility',30,'intermediate',F,[],
  [('raise','jump_rope','2 min easy'),('prep','leg_swings','10 each way'),('primer','wall_drill','2 x 5 / leg'),('rehearsal','falling_start_sprint','2 x 5 m')],
  [X('px','falling_start_sprint',8,1,rest=60,dose='5 m, explosive first steps'),X('sx','lateral_box_jump',4,3,rest=75,per_side=True)],
  focus='Floor only: 5 m starts and lateral box jumps. Ends after the Athletic work')
add('F9','Speed + Agility · Advanced · Bored · 60','athletic_speed_agility',60,'advanced',P,['bored'],
  [('raise','ski_erg','2-3 min'),('prep','worlds_greatest_stretch','3 / side'),('primer','lateral_shuffle_stick','2 x 5 m / side'),('rehearsal','acceleration_sprint','2 x 10 m')],
  [X('px','acceleration_sprint',6,1,rest=75,dose='10 m from a half-kneeling start'),X('sx','lateral_single_leg_hop',5,3,rest=60,per_side=True),
   X('sx2','bear_crawl_ball_toss',4,1,rest=60,work=20,dose='8-10 m, light ball, hips level'),QC('ski_erg',6,6,54,dose='6 s all-out'),
   PSX('copenhagen_plank',3,sec=20,per_side=True,rest=45,dose='20 s hold / side',why='groin and lateral-chain robustness for cutting')],
  focus='Bored: novel starts, lateral hops, Bear Crawl Ball Toss + 1 isometric')
add('F10','Speed + Agility · Intermediate · Stressed · 60','athletic_speed_agility',60,'intermediate',P,['stressed'],
  [('raise','stationary_bike','2-3 min easy'),('prep','leg_swings','10 each way'),('primer','a_march','2 x 10 m'),('rehearsal','sled_push','1 x 10 m easy')],
  [X('px','sled_push',6,1,rest=90,dose='10 m, same sled weight every set'),X('sx','sprint_to_stick',6,1,rest=60,work=3,dose='5 m accelerate, stop in 2 steps'),
   X('sx2','pogo_hop',4,sec=20,rest=40,dose='20 s continuous, stay springy'),QC('air_bike',6,6,54,dose='6 s all-out'),
   PSX('front_foot_elevated_split_squat',3,6,per_side=True,rest=75,why='single-leg strength for starts and stops')],
  focus='Stressed: familiar sled, stops and pogos + 1 single-leg lift')
add('F16','Speed + Agility · Beginner · Normal · 60 · lane','athletic_speed_agility',60,'beginner',P,[],
  [('raise','stationary_bike','2-3 min easy'),('prep','leg_swings','10 each way'),('primer','a_march','2 x 10 m'),('rehearsal','acceleration_sprint','2 x 10 m at 70%')],
  [X('px','acceleration_sprint',6,1,rest=60,dose='10 m from a standing start'),X('sx','skater_hop',4,3,rest=60,per_side=True,work=5),
   X('sx2','sled_push',6,1,rest=75,dose='10 m, light sled, fast feet'),
   PSX('single_leg_glute_bridge',3,10,rest=60,dose='controlled',why='posterior-chain support for sprinting')],
  focus='Beginner speed: short starts, skaters, light sled + 1 glute exercise')
# =========================================================================================== FULL-BODY ATHLETE
add('F11',"Full-Body Athlete · Intermediate · Normal · 60 · MOOD's Pick",'athletic_full_body',60,'intermediate',P,[],
  [('raise','row_erg','2-3 min easy'),('prep','leg_swings','10 each way'),('primer','snap_down','2 x 5'),('rehearsal','acceleration_sprint','2 x 10 m')],
  [X('px','box_jump',5,3,rest=90),X('sx','acceleration_sprint',6,1,rest=75,dose='10 m explosive start'),X('sx2','landmine_rotational_punch',4,3,rest=75,per_side=True),
   QC('row_erg',6,6,54,dose='6 s all-out'),
   PSX('farmer_carry',3,1,rest=60,work=30,dose='30 m, heavy, tall posture',why='trunk stiffness and grip for the landmine power')],
  focus='Default day: box jumps, 10 m starts, landmine punch, rower sprints + 1 carry')
add('F12','Full-Body Athlete · Beginner · Normal · 30','athletic_full_body',30,'beginner',P,[],
  [('raise','stationary_bike','2 min easy'),('prep','worlds_greatest_stretch','3 / side'),('primer','snap_down','2 x 5')],
  [X('px','countermovement_jump',5,3,rest=75),X('sx','mb_rotational_throw',4,4,rest=60,per_side=True),
   PSX('goblet_squat',2,8,rest=60,dose='3 RIR',why='beginner: basic leg strength behind jumping and landing')],
  focus='Beginner 30: jumps and rotational throws + 1 squat')
add('F13','Full-Body Athlete · Intermediate · Low Energy · 60 · floor only','athletic_full_body',60,'intermediate',F,['low_energy'],
  [('raise','stationary_bike','2-3 min easy'),('prep','worlds_greatest_stretch','3 / side'),('primer','pogo_hop','2 x 8, small')],
  [X('px','seated_box_jump',6,3,rest=90),X('sx','bear_crawl_ball_toss',5,1,rest=60,work=20,dose='8 m, light ball, smooth'),
   X('sx2','mb_chest_pass',5,6,rest=60,work=9),
   PSX('single_leg_rdl',3,6,per_side=True,rest=60,dose='3 RIR, light',why='posterior-chain support for the jumps')],
  focus='Low Energy, floor only: seated box jumps, crawl, throws + 1 hinge')
add('F14','Full-Body Athlete · Advanced · Amped · 60','athletic_full_body',60,'advanced',P,['amped'],
  [('raise','row_erg','2-3 min'),('prep','worlds_greatest_stretch','3 / side'),('primer','pogo_hop','2 x 10'),R('hang_power_clean','empty bar, 2 x 3')],
  [X('px','hang_power_clean',6,2,rest=150,dose='light-moderate, bar stays fast'),X('sx','reactive_vertical_jump',5,10,rest=75,work=12),
   X('sx2','landmine_split_jerk',4,3,rest=90,per_side=True),QC('sled_push',6,5,45,dose='10 m, light sled, walk back')],
  focus='Amped advanced: hang clean, continuous jumps, landmine jerk, sled efforts. Ends after the Athletic work')
# =========================================================================================== MOOD'S PICK REROUTE
add('F15',"MOOD's Pick · Intermediate · sore legs · 60 -> Power, upper / rotational",'athletic_power',60,'intermediate',P,[],
  [('raise','ski_erg','2-3 min'),('prep','worlds_greatest_stretch','3 / side'),R('landmine_rotational_punch','light, 1 x 3 / side')],
  [X('px','landmine_rotational_punch',5,3,rest=75,per_side=True),X('sx','mb_chest_pass',5,5,rest=60,work=8),X('sx2','explosive_push_up',4,4,rest=75),QC('ski_erg',6,6,54,dose='6 s all-out'),
   PSX('pull_up',3,6,dose='2-3 RIR',why='upper-only day: pulls balance the pressing power'),
   PSX('pallof_press',2,10,per_side=True,rest=45,dose='controlled',why='anti-rotation for the rotational power')],
  sore={'quads','hamstrings','glutes','calves'},focus='Sore legs: upper and rotational power only + 1 pull, 1 anti-rotation',
  reason='Lower body sore: the upper-only exposures are short, so a pull and an anti-rotation exercise round out the session')

def report(keys):
    out={}
    for k in keys:
        out[k]=check(k)
    return out
RES=report(list(SK))
if __name__=='__main__':
    for k,v in RES.items(): print(f"{k:4} {v['total']:5} wo_ps {v['total_without_ps']:5} wu {v['wu_min']}/{v['wu_items']} share {v['share']} sd {v['session_density']} md {v['max_density']} imp {v['impact']} ps {v['ps']} {v['fails']}")

# =========================================================================================== NEGATIVE / POSITIVE CONTROL TESTS
WU_P=[('raise','row_erg'),('prep','leg_swings'),('primer','pogo_hop')]
WU_S=[('raise','air_bike'),('prep','leg_swings'),('primer','a_skip')]
NEG={}; NEGDEF={}
def neg(k,title,aid,dur,lv,wu,items,expect,pre=P,states=(),trim=False,reason=None):
    add(k,title,aid,dur,lv,pre,list(states),wu,items,trim=trim,reason=reason); r=check(k)
    NEG[k]=dict(title=title,expect=expect,fails=r['fails'],total=r['total'],wu=[f"{c}:{i}" for c,i,*_ in SK[k]['wu']],
               result=('ACCEPT' if not r['fails'] else 'REJECT'),ok=((not r['fails'])==(expect=='ACCEPT')))
    del SK[k]
# ---- founder-specified (item 10)
neg('N7','Athletic workout padded with 3 Strength exercises to fill time','athletic_power',60,'intermediate',WU_P+[R('trap_bar_jump','light 2 x 2')],
  [X('px','trap_bar_jump',5,3,rest=120),X('sx','box_jump',4,3,rest=90),X('sx2','mb_chest_pass',4,6,rest=60,work=9),
   PSX('barbell_back_squat',4,6,rest=150),PSX('db_bench_press',4,8,rest=90),PSX('single_arm_db_row',4,8,per_side=True,rest=60)],'REJECT')
neg('N8a','Complete Athletic session with a required Trunk block added (Dead Bug)','athletic_power',30,'intermediate',WU_P+[R('push_press','empty bar 2 x 3')],
  [X('px','push_press',5,3,rest=120),X('sx','banded_broad_jump',5,3,rest=90),X('trunk','dead_bug',3,8,per_side=True,rest=30)],'REJECT')
neg('N8b','Same, with Dead Bug placed as Performance Support','athletic_power',30,'intermediate',WU_P+[R('push_press','empty bar 2 x 3')],
  [X('px','push_press',5,3,rest=120),X('sx','banded_broad_jump',5,3,rest=90),PSX('dead_bug',3,8,per_side=True,rest=30,dose='slow')],'REJECT')
SIX=[('raise','row_erg'),('prep','worlds_greatest_stretch'),('prep','leg_swings'),('primer','pogo_hop'),('primer','snap_down'),R('trap_bar_jump','light 2 x 2')]
F1_ITEMS=lambda: [X('px','trap_bar_jump',6,3,rest=120),X('sx','landmine_rotational_punch',5,3,rest=75,per_side=True),X('sx2','reactive_vertical_jump',4,8,rest=75,work=10),QC('acceleration_sprint',6,3,60,dose='10 m')]
neg('N9a','Six-component warm-up (the old F1 style)','athletic_power',60,'intermediate',SIX,F1_ITEMS(),'REJECT')
neg('N9b','Same six-component warm-up after the deterministic trim','athletic_power',60,'intermediate',SIX,F1_ITEMS(),'ACCEPT',trim=True)
neg('N10','Type A work prescribed like conditioning (trap-bar jumps 5 x 12 / 45 s, broad jumps 6 x 10 / 30 s)','athletic_power',60,'intermediate',WU_P+[R('trap_bar_jump','light 2 x 2')],
  [X('px','trap_bar_jump',5,12,rest=45),X('sx','broad_jump',6,10,rest=30),X('sx2','box_jump',5,8,rest=30)],'REJECT')
neg('N11','All-repeatable Sweat-like session (swings, pogos, slams, sled at 1:1)','athletic_full_body',60,'intermediate',WU_P,
  [X('px','sled_push',8,1,rest=30,work=20,dose='10 m'),X('sx','kettlebell_swing',6,20,rest=30,work=30),X('sx2','pogo_hop',6,sec=30,rest=30),QC('air_bike',8,20,20)],'REJECT')
neg('N12','Valid Type B session: KB Swings + Continuous Vertical Jumps with controlled fatigue','athletic_power',60,'intermediate',
  [('raise','row_erg'),('prep','leg_swings'),('primer','snap_down'),R('kettlebell_swing','light 1 x 8')],
  [X('px','kettlebell_swing',6,15,rest=45,work=22,dose='end the set when the hips stop snapping'),X('sx','broad_jump',4,3,rest=75),
   X('sx2','reactive_vertical_jump',5,10,rest=60,work=12,dose='end the set when height drops'),QC('air_bike',7,6,54,dose='6 s all-out')],'ACCEPT')
# ---- carried over from Pass 2 (prescription / gating) + extra launch guards
neg('N1','Power Snatch 5 x 5 on 60 s rest (grinding)','athletic_power',60,'advanced',WU_P+[R('power_snatch','empty bar')],
  [X('px','power_snatch',5,5,rest=60),X('sx','box_jump',4,3,rest=90),X('sx2','mb_chest_pass',4,4,rest=60)],'REJECT',)
neg('N2','KB Swing 30 reps on 30 s rest (clock completion)','athletic_power',60,'intermediate',WU_P+[R('kettlebell_swing','light')],
  [X('px','kettlebell_swing',6,30,rest=30,work=45),X('sx','box_jump',4,3,rest=90),X('sx2','med_ball_slam',5,15,rest=30,work=30)],'REJECT')
neg('N4','Continuous Vertical Jumps for a beginner','athletic_power',60,'beginner',WU_P,
  [X('px','countermovement_jump',5,3,rest=75),X('sx','reactive_vertical_jump',4,8,rest=75,work=10),X('sx2','mb_scoop_toss',4,4,rest=60)],'REJECT')
neg('N5','Bear Crawl Ball Toss as the Power main exercise','athletic_power',60,'intermediate',WU_P,
  [X('px','bear_crawl_ball_toss',5,1,rest=60,work=20,dose='8 m'),X('sx','box_jump',4,3,rest=90)],'REJECT')
neg('N6','Hang Power Clean for an intermediate','athletic_power',60,'intermediate',WU_P+[R('hang_power_clean','empty bar')],
  [X('px','hang_power_clean',5,2,rest=150),X('sx','box_jump',4,3,rest=90)],'REJECT')
neg('N13','Performance Support with no purpose in this session (bench press on a speed day)','athletic_speed_agility',60,'intermediate',WU_S+[('rehearsal','acceleration_sprint','2 x 10 m')],
  [X('px','acceleration_sprint',6,1,rest=75,dose='10 m'),X('sx','lateral_single_leg_hop',5,3,rest=60,per_side=True),X('sx2','pogo_to_box_jump',4,2,rest=90),QC('air_bike',6,6,54),
   PSX('db_bench_press',3,8)],'REJECT')
neg('N14','Rehearsal added when not needed (bodyweight box jump main)','athletic_full_body',30,'intermediate',WU_P+[R('box_jump','2 x 2')],
  [X('px','box_jump',5,3,rest=90),X('sx','mb_rotational_throw',4,4,rest=60,per_side=True)],'REJECT')
neg('N15','20 m acceleration','athletic_speed_agility',60,'intermediate',WU_S+[('rehearsal','acceleration_sprint','2 x 10 m')],
  [X('px','acceleration_sprint',6,1,rest=90,dose='20 m'),X('sx','lateral_single_leg_hop',5,3,rest=60,per_side=True),X('sx2','pogo_to_box_jump',4,2,rest=90),QC('air_bike',6,6,54)],'REJECT')
neg('N16','Quality-capped block for a beginner','athletic_full_body',60,'beginner',WU_P,
  [X('px','countermovement_jump',5,3,rest=75),X('sx','mb_rotational_throw',4,4,rest=60,per_side=True),X('sx2','med_ball_slam',5,8,rest=60,work=16),QC('air_bike',6,6,54)],'REJECT')
neg('N17','Two Performance Support exercises on a normal day without a reason','athletic_power',60,'intermediate',WU_P+[R('trap_bar_jump','light')],
  [X('px','trap_bar_jump',6,3,rest=120),X('sx','landmine_rotational_punch',5,3,rest=75,per_side=True),X('sx2','reactive_vertical_jump',4,8,rest=75,work=10),
   PSX('bulgarian_split_squat',3,6,per_side=True),PSX('pull_up',3,6)],'REJECT')
neg('N18','Sled on a floor-only gym (no lane)','athletic_speed_agility',60,'intermediate',WU_S+[('rehearsal','falling_start_sprint','2 x 5 m')],
  [X('px','sled_push',6,1,rest=90,dose='10 m'),X('sx','lateral_box_jump',4,3,rest=75,per_side=True),X('sx2','pogo_hop',4,sec=20,rest=40)],'REJECT',pre=F)
if __name__=='__main__':
    print()
    for k,v in NEG.items(): print(f"{k:4} expect {v['expect']:6} got {v['result']:6} {'OK' if v['ok'] else 'MISMATCH'} {v['fails'][:4]} {v['wu'] if k.startswith('N9') else ''}")
