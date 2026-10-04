"""Prescription layer shared by QA and the founder packs: WA PRESCRIPTION BANDS (Build Muscle row, REP TARGET RESOLUTION v12),
SD v5 STATE MATRIX numeric dials via DIAL BINDING, WA v14/v15 set allocation. Deterministic; no rule is changed here."""
import sys, openpyxl
from .qa_engine import *

SLOT_ROLE={}
for a in ARCH:
    for s in SLOTS[a]: SLOT_ROLE[(a,s['slot'])]=(s['name'],s['cls'],s)
BASE={'primary_compound':dict(bandmax=4),'secondary_compound':dict(bandmax=4),'accessory':dict(bandmax=3),'extra':dict(bandmax=2),'target_block':dict(bandmax=3)}
DIALS={None:dict(volume=0,effort=0,rest=0,extras=0,structure_novelty=0),'low_energy':dict(volume=-1,effort=0,rest=0,extras=0,structure_novelty=-1),
       'stressed':dict(volume=0,effort=0,rest=0,extras=0,structure_novelty=-1),'bored':dict(volume=0,effort=0,rest=0,extras=0,structure_novelty=2),
       'irritated':dict(volume=0,effort=1,rest=0,extras=0,structure_novelty=0),'amped':dict(volume=1,effort=1,rest=0,extras=1,structure_novelty=0)}
_ws=openpyxl.load_workbook(O+'MOOD_V3_Strength_Exercise_Library_v11.xlsx',read_only=True)['EXERCISE LIBRARY']
_rows=list(_ws.iter_rows(min_row=2,values_only=True)); _ix={h:i for i,h in enumerate(_rows[0])}
META={r[_ix['exercise_id']]:dict(metric=r[_ix['rep_metric']],band=r[_ix['default_rep_band']],load=r[_ix['load_trackable']]) for r in _rows[1:] if r[_ix['exercise_id']]}
HEAVY_FAM={'bench_press','back_squat','squat','deadlift','front_squat','overhead_press'}
SMALL={'side_delts','rear_delts','front_delts','calves','hip_abductors','hip_adductors','forearms'}

def rep_target(e,cls):
    """One number inside the band; a range only for bodyweight (load not adjustable) or timed/distance work."""
    m=META.get(e['id'],{})
    if m.get('metric')=='time': return str(m.get('band') or '30–45 sec'),'timed'
    if m.get('metric')=='distance': return str(m.get('band') or '20 m'),'distance'
    bw=(m.get('load') in (False,'FALSE')) and e['eq']=='bodyweight'
    if bw: return ('8–12' if cls in ('primary_compound','secondary_compound','target_block') else '12–15'),'bodyweight, load not adjustable'
    if cls=='primary_compound': reps='6' if (e['swap'] in HEAVY_FAM and e['eq'] in ('barbell','trap_bar')) else '8'
    elif cls in ('secondary_compound','target_block'): reps='10'
    elif cls=='accessory': reps='15' if (e['pm0'] in SMALL or e['prim'][0] in SMALL) else '12'
    else: reps='15'
    if e['lat']!='bilateral': reps+='/side'
    return reps,''
def rest_rir(e,cls,eff):
    rest={'primary_compound':(150 if (e['swap'] in HEAVY_FAM and e['eq'] in ('barbell','trap_bar')) else 120),'secondary_compound':90,'target_block':90,'accessory':60,'extra':45}[cls]
    rir={'primary_compound':2,'secondary_compound':2,'target_block':2,'accessory':1,'extra':1}[cls]-eff
    return rest,max(rir,1 if cls in ('primary_compound','secondary_compound','target_block') else 0)

def prescribe(aid,W,dur,state,log,finisher_planned=False):
    """Ordered rows with single rep targets, rest and RIR; State numeric dials per DIAL BINDING.
    finisher_planned: WA v15 ST3 (Amped): Volume +1 is expressed as the burnout finisher instead of an added set."""
    d=DIALS[state]; rows=[]; eff=1 if d['effort']==1 else 0
    for slot,eid in W.items():
        name,cls,meta=SLOT_ROLE[(aid,slot)]; e=EX[eid]; reps,why=rep_target(e,cls); rest,rir=rest_rir(e,cls,eff)
        rows.append(dict(slot=slot,role=name,cls=cls,eid=eid,name=e['name'],sets=SETS_BY_CLASS[dur][cls],reps=reps,why=why,rest=rest,rir=rir,bandmax=BASE[cls]['bandmax'],
                         inc=(meta['i60'] if dur==60 else meta['i30']),prio=int(meta['prio']),protected=(aid,slot) in PROTECTED))
    events=[]
    two=two_set_slots(aid,W,dur)
    if two:
        for r in rows:
            if r['slot'] in two: r['sets']=2
        events.append({'reason_code':'ancillary_depth_set_allocation','operation':('three accessory slots at 2 sets each (ATD1)' if aid!='strength_arms' else 'depth slots at 2 sets each (WA v15 Arms)')})
    if d['volume']==-1:
        cand=[r for r in reversed(rows) if r['inc']!='required' and r['sets']>1]
        if cand: cand[0]['sets']-=1; events.append({'reason_code':'dial_volume','value':-1,'operation':'removed 1 working set from lowest-priority non-required slot','slot':cand[0]['slot']})
        else: events.append({'reason_code':'dial_volume','value':-1,'operation':'no non-required set available','slot':None})
    if d['volume']==1 and dur==60:
        if finisher_planned: events.append({'reason_code':'dial_volume','value':1,'operation':'expressed as the burnout finisher block (WA v15 ST3, Amped); no straight set added'})
        else:
            cand=[r for r in rows if r['cls']!='primary_compound' and r['sets']<r['bandmax']]
            if cand: cand[0]['sets']+=1; events.append({'reason_code':'dial_volume','value':1,'operation':'added 1 working set to highest-priority non-primary slot below band maximum','slot':cand[0]['slot']})
    if d['effort']==1: events.append({'reason_code':'dial_effort','value':1,'operation':'target RIR lowered by 1 (floor 1 RIR compounds, 0 RIR accessories)'})
    if d['extras']==1 and dur==60: events.append({'reason_code':'dial_extras','value':1,'operation':('one Extra: burnout finisher block' if finisher_planned else 'one Extra eligible; no finisher candidate available')})
    if aid=='strength_upper_mixed':
        order=list(W.keys()); rows.sort(key=lambda r:order.index(r['slot']))
    elif aid=='strength_arms':   # WA v15 Arms presentation: compound first, then biceps/triceps alternating, delts, burnout last
        ordk={'compound_combination':0,'biceps_exercise':1,'triceps_exercise':2,'biceps_depth':3,'triceps_depth':4,'shoulder_exercise':5,'shoulder_depth':6,'optional_extra_burnout':7}
        rows.sort(key=lambda r:ordk.get(r['slot'],9))
    else: rows.sort(key=lambda r:r['prio'])
    return rows,events
