"""MOOD V3 Sweat reference generator (Sweat Architecture v2, implementation-ready).
Session-first: intent (archetype, engine_mode, dials) -> blocks -> structure -> items -> dosing -> State dials -> duration fit.
Deterministic: every choice is a pure function of inputs, history and swap chain (stable md5 seed)."""
import hashlib, itertools, copy
from collections import defaultdict
from .sweat_data import *

EX,ELIG=load_all()
ELIG_BY=defaultdict(list)
for (eid,aid,slot,v,cond,b) in ELIG: ELIG_BY[(aid,slot)].append((eid,v,cond,b))

# ------------------------------------------------------------------ State / Dial resolution (SD v5, unchanged)
SM={'low_energy':dict(V=-1,E=0,N=-1,C=-1,G=0,X=0),'stressed':dict(V=0,E=0,N=-1,C=-1,G=2,X=0),'bored':dict(V=0,E=0,N=2,C=1,G=1,X=0),
    'irritated':dict(V=0,E=1,N=0,C=-1,G=1,X=1),'sore':dict(V=0,E=0,N=0,C=0,G=0,X=0),'amped':dict(V=1,E=1,N=0,C=0,G=0,X=1)}
PAIRS={frozenset({'bored','stressed'}):dict(V=0,NE=2,NS=-1,C=-1,G=2),
       frozenset({'amped','low_energy'}):dict(V=0,E=1,ESCOPE='p1'),
       frozenset({'irritated','low_energy'}):dict(V=-1,C=-1),
       frozenset({'amped','sore'}):dict(V=0),
       frozenset({'irritated','stressed'}):dict(V=0,C=-1,G=2),
       frozenset({'amped','bored'}):dict(V=1,NE=2,NS=1)}
PAIR_ORDER=['sore','low_energy','stressed','irritated','bored']
def clamp(v,lo=-2,hi=2): return max(lo,min(hi,v))
def resolve_dials(states,duration,experience):
    st=[s for s in states if s in SM]
    d={k:clamp(sum(SM[s][k] for s in st)) for k in 'VENCGX'}
    d['NE']=d['N']; d['NS']=d['N']; d['ESCOPE']='all'; pair=None
    cands=[p for p in PAIRS if p<=set(st)]
    if cands:
        def rank(p): return min(PAIR_ORDER.index(s) if s in PAIR_ORDER else 9 for s in p)
        pair=sorted(cands,key=lambda p:(rank(p),sorted(p)))[0]
        for k,v in PAIRS[pair].items(): d[k]=v
        if 'N' not in PAIRS[pair] and 'NE' not in PAIRS[pair]: d['NE']=d['NS']=d['N']
    if 'stressed' in st: d['NS']=min(d['NS'],-1)
    if 'amped' in st and duration==30:                     # SD ARBITRATION row 19 / Bored+Amped 30
        d['V']=clamp(d['V']-1) if (pair is None or 'V' not in PAIRS.get(pair,{}) or pair==frozenset({'amped','bored'})) else d['V']
        d['X']=0; d['ESCOPE']='p1'
    if 'low_energy' in st: d['X']=0                        # "Extras simply remain off"
    base={'beginner':2,'intermediate':3,'advanced':5}[experience]
    d['cap']=min(3,max(1,min(5,base+d['C'])))              # J1 Sweat fatigue ceiling = 3
    d['pair']=sorted(pair) if pair else None
    return d

GOAL_ROW={'build_strength':'performance','build_muscle':'general','improve_athleticism':'performance','lose_weight_conditioning':'conditioning',
          'feel_better_reduce_stress':'general','stay_consistent':'general'}
ROTATION={'conditioning':['sweat_circuit','sweat_engine','sweat_hybrid'],'performance':['sweat_hybrid','sweat_circuit','sweat_engine'],
          'general':['sweat_circuit','sweat_engine','sweat_hybrid']}
AFFINITY={'low_energy':{'sweat_engine','sweat_circuit'},'stressed':{'sweat_engine','sweat_circuit'},'irritated':{'sweat_hybrid','sweat_circuit'}}
CONSTRAINED=['low_energy','stressed','irritated','amped','bored']

# ------------------------------------------------------------------ helpers
def seed(*parts): return int(hashlib.md5('|'.join(map(str,parts)).encode()).hexdigest()[:12],16)
def lvl(ctx): return ctx['experience']
def sweat_history(ctx): return [h for h in ctx.get('history',[]) if h.get('direction','sweat')=='sweat']

def hard_ok(e,ctx,cap,aid,slot,cond=''):
    eq,sp=ctx['equip'],ctx['space']
    if e['sweat_class'] not in ('A','B','NEW'): return False
    if e['eq']!='bodyweight' and e['eq'] not in eq: return False
    if any(q not in eq for q in e['req']): return False
    if e['space'] not in sp: return False
    if LV[e['skill']]>LV[ctx['experience']]: return False
    if e['cx']>cap: return False
    if e['impact']=='high' and (ctx['experience']=='beginner' or 'low_energy' in ctx['states'] or (ctx['sore_eff'] & LOWER)): return False
    if set(e['prim'])&ctx['sore_eff'] or {roll(m) for m in e['prim']}&ctx['sore_eff']: return False
    if not cond_ok(cond,ctx): return False
    return True

def sore_secondary(e,ctx): return bool((set(e['sec'])|{roll(m) for m in e['sec']})&ctx['sore_eff'])

def le_tier(e):
    """Low Energy compliance tier (0 best). Tier membership is the State requirement; ordering INSIDE a tier is left to recency."""
    # Final freeze: 0 = PREFERRED (low friction, low impact, low systemic cost), 1 = ALLOWED SECONDARY (moderate output / systemic cost),
    # 2 = avoid (high systemic cost or high impact). Derived from existing attributes only; no new taxonomy field.
    if e['sysd']>=5 or e['impact']=='high': return 2
    if e['impact']=='low' and not e['explosive'] and e['cx']<=2 and (
        e['sup']!='unsupported'                                            # supported / semi-supported: bike, rower, bench and chest-supported work, floor core
        or (not e['forceful'] and (e['sysd']<=2 or e['pat']=='carry'))):  # easy walk, air squat, step-up, light DB / bodyweight work, easy carries
        return 0
    return 1                                                               # ropes, slams, swings, goblet squat, SkiErg, sled, jump rope ...
LE_PULL=('irritated','bored','amped')
def le_rank(e,ctx,d):
    """Rank-3 Low Energy tier as used by ranked(). Pure Low Energy: tier as is. Multi-State: a co-selected State (Irritated / Bored / Amped)
    may pull an ALLOWED-SECONDARY item up to preferred when that State favors it; tier 2 is never pulled. The per-block secondary cap keeps Low Energy perceptible."""
    t=le_tier(e)
    if t==1 and any(x in ctx['states'] for x in LE_PULL) and state_tier(e,ctx,d)>0: return 0
    return t
def le_secondary_cap(ctx): return 2 if any(x in ctx['states'] for x in LE_PULL) else 1
def le_fine(e): return {'supported':2,'semi_supported':1}.get(e['sup'],0)*3+(5-e['sysd'])+(e['nov']<=2)
def state_tier(e,ctx,d):
    """Rank 3 = COMPLIANCE with the State (coarse). Equally compliant candidates tie here and recency (rank 5) decides."""
    t=0; st=ctx['states']; ok_sys=('low_energy' not in st) or e['sysd']<=4    # SD domain rule: Low Energy constrains systemic cost first
    if 'stressed' in st: t+=(e['nov']<=2)
    if d['NE']>0: t+=(e['nov']>=3)
    if 'irritated' in st and ok_sys: t+=e['forceful']
    if 'amped' in st and ok_sys: t+=(e['forceful'] or e['explosive'])
    return t
def state_fine(e,ctx,d):
    """Finer State taste, applied only AFTER recency."""
    s=0; st=ctx['states']; ok_sys=('low_energy' not in st) or e['sysd']<=4
    if 'stressed' in st: s+=(e['fixed'] is None)
    if d['NE']>0: s+=e['nov']*d['NE']
    if 'irritated' in st and ok_sys: s+=2*(self_limiting(e) or (e['cls']=='integrated' and e['eq']=='bodyweight'))+(e['cx']<=1)   # cathartic: slams, ropes, sled, carries, ergs, burpees; simple
    if 'amped' in st and ok_sys: s+=(e['cls'] in ('compound','integrated'))+e['explosive']
    return s
def state_score(e,ctx,d): return 10*state_tier(e,ctx,d)+state_fine(e,ctx,d)

def target_score(e,ctx):
    T=ctx.get('target_set')
    if not T: return 0
    prims={roll(m) for m in e['prim']}|set(e['prim']); secs={roll(m) for m in e['sec']}|set(e['sec'])
    return 2*len(prims&T)+len(secs&T)+0.5*(e['region'] in ctx['target_regions'])

def recency(e,ctx,aid=None):
    """Rank 5: last 2 Sweat sessions, plus the last 2 sessions of the same archetype (Strength G2 convention)."""
    fam=ex=0; h=sweat_history(ctx)
    windows=[h[-2:]]+([[x for x in h if x['archetype']==aid][-2:]] if aid else [])
    for win in windows:
        for back,x in enumerate(reversed(win)):
            w=2 if back==0 else 1
            if e['swap'] in x.get('families',[]): fam=max(fam,w)
            if e['id'] in x.get('exercises',[]): ex=max(ex,w)
    return fam,ex

def recent_count(e,ctx,aid=None,n=3):
    """Tie-break inside rank 5: how many of the last n sessions OF THIS ARCHETYPE used this exact exercise.
    Breaks the ties max-weight recency leaves when a small compliant pool is fully used, so equally appropriate options keep rotating."""
    h=[x for x in sweat_history(ctx) if aid is None or x['archetype']==aid]
    return sum(e['id'] in x.get('exercises',[]) for x in h[-n:])

def swap_pen(e,ctx):
    fam=ex=0
    for back,comp in enumerate(reversed(ctx.get('displayed_chain',[]))):
        w=2 if back==0 else 1
        if e['swap'] in comp.get('families',[]): fam=max(fam,w)
        if e['id'] in comp.get('exercises',[]): ex=max(ex,w)
    return fam,ex

VR={'preferred':0,'allowed':1,'conditional':1}
def ranked(aid,slot,ctx,d,key,extra_filter=None,prefer=None,prefer_low=None):
    """Frozen ranks: 1 hard filters, 2 verdict, 3 State predicate, 4 Target, 5 recency / swap, 6 priority_bias, 7 seed.
    v3: Low Energy rank 3 is a compliance TIER; within a tier recency decides, then the fine Low Energy score.
    prefer (above State) is a structural preference; prefer_low (below recency) is a soft taste preference."""
    out=[]; le='low_energy' in ctx['states']
    for eid,v,cond,b in ELIG_BY[(aid,slot)]:
        e=EX[eid]
        if not hard_ok(e,ctx,d['cap'],aid,slot,cond): continue
        if extra_filter and not extra_filter(e): continue
        rf,rx=recency(e,ctx,aid); sf,sx=swap_pen(e,ctx)
        pref=0 if prefer is None else -prefer(e)
        pl=0 if prefer_low is None else -prefer_low(e)
        out.append(((sore_secondary(e,ctx),VR[v],pref,le_rank(e,ctx,d) if le else 0,-state_tier(e,ctx,d),-target_score(e,ctx),sf,sx,rf,rx,recent_count(e,ctx,aid),
                     -le_fine(e) if le else 0,-state_fine(e,ctx,d),pl,-b,(e['fixed'] is not None)*(d['G']>0),seed(ctx['user'],ctx['date'],aid,key,eid,ctx.get('swap',0))),e))
    out.sort(key=lambda t:t[0])
    return [e for _,e in out]

# ------------------------------------------------------------------ time model (ST4)
SPR={'push_up':2.5,'deficit_push_up':2.8,'diamond_push_up':2.8,'burpee':5,'kettlebell_swing':2.5,'med_ball_slam':3,'jump_squat':2.5,'db_thruster':3.5,
     'renegade_row':4,'pull_up':3.5,'chin_up':3.5,'neutral_grip_pull_up':3.5,'hanging_knee_raise':3,'hanging_leg_raise':3.5,'captains_chair_knee_raise':3,
     'reverse_crunch':2.5,'cable_crunch':2.5,'machine_crunch':2.5,'decline_sit_up':3,'weighted_sit_up':3,'wall_ball':3,'db_squat_to_press':3.5,'db_clean_to_press':4,
     'reverse_lunge_to_press':4,'landmine_squat_to_press':3.5,'suspension_row':2.5,'inverted_row':3,
     'kb_snatch':2.5,'db_snatch':2.8,'air_squat':2,'glute_bridge':2,'bw_step_up':2,'db_push_press':2.5,'box_jump':3,'skater_hop':1.5,'devil_press':5}
SPM={'farmer_carry':1.0,'suitcase_carry':1.0,'sled_push':1.5,'sled_pull':2.2,'plate_push':1.6,'overhead_carry':1.2,'waiter_carry':1.1,'front_rack_carry':1.1,'row_erg':0.24,'ski_erg':0.25,'treadmill_run':0.33}
SPC={'air_bike':3.5,'row_erg':4.5,'ski_erg':5.0}
LVM={'beginner':1.15,'intermediate':1.0,'advanced':0.9}
def est(e,dose,exp):
    k,v=dose['kind'],dose['value']; m=LVM[exp] if e['role']=='engine' or e['id'] in SPM else 1.0
    if k=='time': return v
    if k=='reps': return v*SPR.get(e['id'],3.0)*(2 if dose.get('per_side') else 1)
    if k=='distance': return v*SPM.get(e['id'],1.0)*m
    if k=='calories': return v*SPC.get(e['id'],4.0)*m
    return 60

def fmt_t(s):
    s=int(round(s)); return f"{s//60}:{s%60:02d}"
def dose_txt(e,dose):
    k,v=dose['kind'],dose['value']
    if k=='time': return fmt_t(v)
    if k=='reps': return f"{v}/side" if dose.get('per_side') else str(v)
    if k=='distance': return f"{v} m"
    if k=='calories': return f"{v} cal"

def station_dose(e,exp,hybrid=False):
    i=e['id']; beg=exp=='beginner'; sc=1.25 if hybrid else 1.0
    if e['role']=='engine':
        if i in ('row_erg','ski_erg'): return dict(kind='distance',value=200 if beg else 250)
        if i=='air_bike': return dict(kind='calories',value=10 if beg else 12)
        if i=='jump_rope': return dict(kind='time',value=30 if beg else 45)
        return dict(kind='time',value=60)                                   # treadmill / bike / stair: >= 60 s bout
    if i=='battle_rope_waves': return dict(kind='time',value=30)
    if i in ('sled_push','sled_pull'): return dict(kind='distance',value=20)
    if i=='farmer_carry': return dict(kind='distance',value=60 if hybrid else 40)
    if i=='suitcase_carry': return dict(kind='distance',value=40 if hybrid else 30)
    if i=='plate_push': return dict(kind='distance',value=20)
    if i=='overhead_carry': return dict(kind='distance',value=40 if hybrid else 30)
    if i in ('waiter_carry','front_rack_carry'): return dict(kind='distance',value=60 if hybrid else 40)
    if e['metric']=='time': return dict(kind='time',value=(30 if beg else 40) if i not in ('side_plank','mountain_climber','hollow_hold') else 30,per_side=(i=='side_plank'))
    table={'wall_ball':(10,15,20),'burpee':(6,8,10),'med_ball_slam':(10,12,15),'jump_squat':(10,12,15),'kettlebell_swing':(12,15,20),'db_thruster':(8,10,12),
           'pull_up':(8,8,8),'chin_up':(8,8,8),'neutral_grip_pull_up':(8,8,8),'parallel_bar_dip':(8,8,8),'hanging_knee_raise':(8,10,10),'hanging_leg_raise':(8,10,10),
           'captains_chair_knee_raise':(8,10,10),'renegade_row':(5,6,6),'bench_dip':(8,10,10),
           'kb_snatch':(8,10,12),'db_snatch':(8,10,12),'skater_hop':(8,10,12),'db_push_press':(12,15,15),'air_squat':(15,20,20),'glute_bridge':(15,15,20),'box_jump':(8,10,12),'devil_press':(8,8,10)}
    if i in table: b,n,h=table[i]; return dict(kind='reps',value=b if beg else (h if hybrid else n),per_side=(i in ('renegade_row','kb_snatch','db_snatch','skater_hop')))
    if e['lat'] in ('unilateral','alternating'): return dict(kind='reps',value=8 if beg else 10,per_side=True)
    if e['eq']=='bodyweight' and e['pat'] in ('horizontal_push','vertical_push'): return dict(kind='reps',value=8 if beg else 12)
    if e['role']=='core': return dict(kind='reps',value=12 if beg else 15)
    return dict(kind='reps',value=12 if beg else 15)

def cue_for(e,block_kind,rpe_hi):
    if e['id']=='overhead_carry': return "moderate load, arms locked out"
    if e['id']=='waiter_carry': return "moderate load, switch arms halfway"
    if e['id']=='front_rack_carry': return "moderate-heavy, stay tall"
    if e['id']=='plate_push': return "moderate plate, fast feet"
    if heavy_ok(e): return "heavy, steady"
    if e['role'] in ('engine','output') and self_limiting(e):
        if e['eq']=='treadmill' or e['mod']=='running': return f"RPE {min(rpe_hi,9)}, strong and controlled"
        return f"RPE {rpe_hi}"
    if e['role'] in ('engine','output'): return f"RPE {min(rpe_hi,8)}, quick and clean"
    if heavy_ok(e): return "heavy, steady"
    if is_loaded_hinge(e): return "moderate, crisp hips (RPE <= 8)"
    if e['eq'] in ('bodyweight','suspension_trainer','pullup_bar','captains_chair','dip_station'): return "steady, clean reps"
    return "light-moderate load, unbroken, short of failure"

# ------------------------------------------------------------------ composition helpers
def ok_add(e,chosen,used_ids,used_fams,block_items,max_fixed=2):
    if e['id'] in used_ids or e['swap'] in used_fams: return False
    if any(x['swap']==e['swap'] for x in chosen): return False
    items=block_items+chosen+[e]
    if len({x['fixed'] for x in items if x['fixed']})>max_fixed: return False
    if sum(is_loaded_hinge(x) for x in items)>1: return False
    if sum(x['impact']=='high' for x in items)>1: return False
    if sum(x['pat']=='jump' and x['role']!='engine' for x in items)>2: return False   # v4: jumping spread out, not stacked
    if any(is_hanging(x) for x in items) and any(x['pat']=='carry' for x in items): return False   # J4: grip never stacked hanging + carry
    return True

def order_items(items,log,label):
    """J6 adjacency incl. wrap; J4 hanging never next to a carry. First valid permutation keeping item 0 first."""
    if len(items)<=2: return items
    def good(seq):
        n=len(seq)
        for i in range(n):
            a,b=seq[i],seq[(i+1)%n]
            if a['pm0']==b['pm0']: return False
            if (is_hanging(a) and b['pat']=='carry') or (is_hanging(b) and a['pat']=='carry'): return False
        return True
    for p in itertools.permutations(items[1:]):
        seq=[items[0]]+list(p)
        if good(seq): return seq
    log.append(dict(reason_code='relaxation_a',detail=f'{label}: adjacency relaxed (no valid order)'))
    return items

# ------------------------------------------------------------------ Engine mode (founder B2 clarification)
MODE_RULES={'stressed':{'steady':['aerobic'],'interval':['long_even']},
            'low_energy':{'steady':['aerobic','tempo'],'interval':['controlled','long_even']},
            'amped':{'interval':['long_even','pyramid','short']},                # Amped: sustained output first; Irritated keeps short, hard efforts
            'irritated':{'interval':['short']},
            'bored':{'interval':['pyramid','short','long_even'],'steady':['tempo']}}
NORMAL_MODES={'steady':['aerobic','tempo'],'interval':['long_even','short','pyramid']}
MODE_PREF={'stressed':'steady','low_energy':'steady','amped':'interval','irritated':'interval','bored':'interval'}
def engine_mode(ctx,log):
    st=[s for s in ctx['states'] if s in MODE_RULES]
    allowed=None
    for s in st:
        r=MODE_RULES[s]
        allowed=copy.deepcopy(r) if allowed is None else {m:[f for f in allowed[m] if f in r.get(m,[])] for m in allowed if m in r}
        allowed={m:f for m,f in allowed.items() if f}
    if st and not allowed:
        cs=[s for s in CONSTRAINED if s in st][0]; allowed=copy.deepcopy(MODE_RULES[cs])
        log.append(dict(reason_code='engine_mode_constrained_domain',detail=cs))
    if not allowed: allowed=copy.deepcopy(NORMAL_MODES)
    if ctx['experience']=='beginner':
        allowed={m:(['aerobic'] if m=='steady' else ['controlled']) for m in allowed}
    eh=[h for h in sweat_history(ctx) if h['archetype']=='sweat_engine']
    last=eh[-1] if eh else None
    modes=list(allowed)
    if len(modes)==1: mode=modes[0]; why='state'
    elif last and last.get('engine_mode') in modes:
        mode=[m for m in modes if m!=last['engine_mode']][0]; why='rotate_vs_last_engine'
    else:
        pref=[MODE_PREF[s] for s in st if s in MODE_PREF]
        if pref: mode=pref[0]; why='state_preference'
        else:
            mode={'conditioning':'interval','performance':'interval','general':'steady'}[ctx['goal_row']]
            if ctx['experience']=='beginner': mode='interval'
            why='goal_default'
    if ctx.get('swap',0)==1 and len(modes)>1 and ctx.get('displayed_chain'):
        shown=ctx['displayed_chain'][-1].get('engine_mode')
        if shown==mode: mode=[m for m in modes if m!=mode][0]; why='swap_variation'
    fmts=list(allowed[mode])
    lastf=last.get('engine_format') if last else None
    shownf=ctx['displayed_chain'][-1].get('engine_format') if ctx.get('displayed_chain') else None
    fmts.sort(key=lambda f:((f==lastf) and len(fmts)>1,(f==shownf) and len(fmts)>1))
    fmt=fmts[0]
    log.append(dict(reason_code='engine_mode_selected',mode=mode,format=fmt,why=why))
    return mode,fmt

# ------------------------------------------------------------------ block builders
BAND={30:(22,28),60:(42,55)}
PRIMARY_MAX={('sweat_engine',60):26,('sweat_engine',30):18,('sweat_circuit',60):24,('sweat_circuit',30):19,('sweat_hybrid',60):26,('sweat_hybrid',30):18}
PRIMARY_TGT={('sweat_engine',60):22,('sweat_engine',30):16,('sweat_circuit',60):21,('sweat_circuit',30):17,('sweat_hybrid',60):23,('sweat_hybrid',30):15}
COMP_TGT={'sweat_engine':9,'sweat_circuit':10,'sweat_hybrid':8}; COMP_MAX={'sweat_engine':10,'sweat_circuit':12,'sweat_hybrid':10}

def rpe_rng(lo,hi): return [lo,hi]

class Fail(Exception): pass

def block_minutes(b,exp):
    s=b['structure']
    if s=='continuous': return b['duration_s']/60
    if s in ('intervals','pyramid','finisher'):
        it=b['interval_target']
        if s=='pyramid': return (sum(it['steps'])+it['recovery']*(len(it['steps'])-1))/60
        per=len(b['items_e']) if it.get('rotate') else 1
        rounds=it['rounds']; rr=it.get('round_rest',0)
        return (rounds*per*(it['work']+it['recovery'])+max(0,rounds-1)*rr - (it['recovery'] if not it.get('rotate') else 0))/60
    if s=='emom': return b['minutes']
    if s=='ladder':
        tot=sum(sum(r*SPR.get(x['id'],3.0) for r in b['ladder']) for x in b['items_e']); return (tot+len(b['ladder'])*15)/60
    if s=='circuit':
        if b.get('anchor'):
            rt=[est(b['anchor'],b['anchor_dose'],exp)+sum(est(x,dz,exp) for x,dz in st)+10*(1+len(st)) for st in b['round_stations']]
            return (sum(rt)+(len(rt)-1)*b['round_rest'])/60
        rt=sum(est(x,dz,exp) for x,dz in zip(b['items_e'],b['doses']))+10*len(b['items_e'])
        return (b['rounds']*rt+(b['rounds']-1)*b['round_rest'])/60
    return 0

def duty_cycle(b,exp):
    """SC3: programmed active work / (active + programmed PASSIVE recovery), ST4 time model.
    Active: exercise time, in-round transitions (10 s), timed-rotation changeovers up to 15 s, and easy engine recoveries (the user keeps moving).
    Passive: round rest, Hybrid walk between rounds, EMOM remainder of the minute, rotation changeover beyond 15 s."""
    s=b['structure']
    if s in ('continuous','pyramid'): return 1.0
    if s in ('intervals','finisher'):
        it=b['interval_target']
        if not it.get('rotate'): return 1.0
        n=len(b['items_e']); per=it['work']+min(it['recovery'],15); passive=max(0,it['recovery']-15)
        r=it['rounds']; act=r*n*per; pas=r*n*passive+(r-1)*it.get('round_rest',0)
        return act/(act+pas)
    if s=='emom':
        work=sum(est(e,dz,exp) for e,dz in zip(b['items_e'],b['doses']))*b['rounds']; return work/(b['minutes']*60)
    if s=='ladder': return 0.85
    if s=='circuit':
        if b.get('anchor'):
            act=sum(est(b['anchor'],b['anchor_dose'],exp)+sum(est(x,dz,exp) for x,dz in st)+10*(1+len(st)) for st in b['round_stations'])
            pas=(len(b['round_stations'])-1)*b['round_rest']; return act/(act+pas)
        rt=sum(est(x,dz,exp) for x,dz in zip(b['items_e'],b['doses']))+10*len(b['items_e'])
        return b['rounds']*rt/(b['rounds']*rt+(b['rounds']-1)*b['round_rest'])
    return 1.0

DUTY_MIN=0.60
def ensure_duty(b,exp,log):
    """SC3 repair: shorten passive rest in 15 s steps (floor 30 s), never add exercises."""
    if duty_cycle(b,exp)>=DUTY_MIN: return True
    before=round(duty_cycle(b,exp),2)
    for _ in range(12):
        if b['structure']=='circuit' and b['round_rest']>30: b['round_rest']-=15
        elif b['structure']=='intervals' and b['interval_target'].get('round_rest',0)>0: b['interval_target']['round_rest']=max(0,b['interval_target']['round_rest']-15)
        else: break
        if duty_cycle(b,exp)>=DUTY_MIN: break
    log.append(dict(reason_code='duty_cycle_adjusted',detail=f"{b['slot']}: {before} -> {round(duty_cycle(b,exp),2)}"))
    return duty_cycle(b,exp)>=DUTY_MIN

def mk_block(slot,structure,**kw):
    b=dict(slot=slot,structure=structure); b.update(kw); return b

def engine_primary(ctx,d,log,fmt,mode,tgt_min):
    exp=ctx['experience']
    def fmt_ok(e):
        if fmt in ('short',) and e['eq'] in MIN_BOUT: return False
        if e['id']=='treadmill_incline_walk' and fmt in ('short','pyramid'): return False
        return True
    # steady mode prefers machines built for long continuous work; interval mode is neutral
    calm=mode=='steady' or (fmt in ('long_even','controlled') and any(x in ctx['states'] for x in ('stressed','low_energy')))
    steady_pref=(lambda e:{'row_erg':2,'stationary_bike':2,'treadmill_incline_walk':2,'treadmill_run':1,'stair_climber':1}.get(e['id'],0)) if calm else None
    pool=ranked('sweat_engine','primary_engine_block',ctx,d,'primary',fmt_ok,prefer=steady_pref)
    if not pool: raise Fail('no engine item')
    e=pool[0]
    if mode=='steady':
        mins=min(tgt_min,20) if exp=='beginner' else tgt_min
        rpe=[5,6] if fmt=='aerobic' else [5,7]
        return mk_block('primary_engine_block','continuous',items_e=[e],duration_s=mins*60,engine_mode=mode,engine_format=fmt,rpe=rpe,unit_s=120)
    if fmt=='pyramid':
        steps=[60,120,180,120,60] if tgt_min<18 else [60,120,180,240,180,120,60]
        return mk_block('primary_engine_block','pyramid',items_e=[e],interval_target=dict(steps=steps,recovery=45),engine_mode=mode,engine_format=fmt,rpe=[7,8])
    W,R,rpe={'long_even':(360,90,[7,8]) if 'stressed' in ctx['states'] else (240,60,[7,8]),'short':(30,45,[8,9]),'controlled':(60,60,[7,7])}[fmt]   # v4: shorter recoveries
    if exp=='advanced' and fmt=='short': W,R=40,60
    mx={'short':10,'controlled':12,'long_even':6}[fmt]
    n=min(mx,max(3,int((tgt_min*60+R)//(W+R))))
    return mk_block('primary_engine_block','intervals',items_e=[e],interval_target=dict(work=W,recovery=R,rounds=n,df_max=mx),engine_mode=mode,engine_format=fmt,rpe=rpe)

def engine_intervals_comp(ctx,d,log,aid,used_ids,used_fams,tgt_min,label='complementary_block'):
    def f(e): return e['role']=='engine' and e['eq'] not in MIN_BOUT and e['id']!='treadmill_incline_walk'
    for e in ranked(aid,'complementary_block',ctx,d,label,f):
        if e['id'] in used_ids or e['swap'] in used_fams: continue
        if aid=='sweat_engine' or True:
            W,Rc=(30,30) if ctx['experience']=='beginner' else (40,20)      # v4: 40/20 for non-beginners
            rpe=[7,8]
            if 'irritated' in ctx['states'] and 'amped' not in ctx['states'] and 'low_energy' not in ctx['states']:
                W,Rc,rpe=30,30,[8,9]                                        # Irritated: short, hard, cathartic erg efforts
            n=max(4,int(tgt_min*60//(W+Rc)))
            return mk_block(label,'intervals',items_e=[e],interval_target=dict(work=W,recovery=Rc,rounds=n),rpe=rpe,comp_type='engine_intervals')
    return None

PCLASS={'horizontal_push':'push','vertical_push':'push','horizontal_pull':'pull','vertical_pull':'pull'}
def pclass(e): return PCLASS.get(e['pat'],e['pat'])
def base_cap(ctx): return min(3,{'beginner':2,'intermediate':3,'advanced':5}[ctx['experience']])
def pick_items(aid,slot,ctx,d,roles,used_ids,used_fams,label,block_items=None,max_fixed=2,region_pref=None,log=None):
    """roles: list of role predicates (callables) filled in order; returns chosen list or raises Fail."""
    chosen=[]; block_items=block_items or []
    for k,role_t in enumerate(roles):
        rname,pred=role_t[0],role_t[1]; rpref=role_t[2] if len(role_t)>2 else None
        got=None; cands=ranked(aid,slot,ctx,d,f'{label}.{k}',pred,prefer=rpref)
        pm=[x['pm0'] for x in chosen]
        for strict in (True,False):                       # J6 soft: prefer a first primary muscle already used at most once
            for e in cands:
                if strict and e['pm0'] in pm: continue
                if strict and e['role'].startswith('resistance') and pclass(e) in [pclass(x) for x in chosen if x['role'].startswith('resistance')]: continue
                if strict and 'low_energy' in ctx['states'] and le_tier(e)==1 and sum(le_tier(x)==1 for x in chosen+block_items)>=le_secondary_cap(ctx): continue
                if ok_add(e,chosen,used_ids,used_fams,block_items,max_fixed): got=e; break
            if got: break
        if got is None and d['cap']<base_cap(ctx):
            d2=dict(d,cap=base_cap(ctx))                 # SW-FB1: State cap never empties the engine/output role
            for e in ranked(aid,slot,ctx,d2,f'{label}.{k}',pred,prefer=rpref):
                if ok_add(e,chosen,used_ids,used_fams,block_items,max_fixed): got=e; break
            if got is not None and log is not None: log.append(dict(reason_code='complexity_relaxed_engine_output' if rname=='engine_or_output' else 'complexity_relaxed_state_cap',detail=got['id']))
        if got is None: raise Fail(f'{label}: no candidate for {rname}')
        chosen.append(got)
    return chosen

R_EO=('engine_or_output',lambda e:e['role'] in ('engine','output'))
def R_REG(r): return (r,lambda e,r=r:(e['role']=='resistance_'+r) if r!='core' else e['role']=='core')
R_FLEX=('flex(core|output)',lambda e:e['role'] in ('core','output'))
# v4 founder: circuits lean full-body / cardio. The flex slot also takes full-body lifts and prefers them (or output) over core holds.
def is_full_body(e): return e['cls']=='integrated' or e['combo'] or e['id'] in ('kettlebell_swing','kb_snatch','db_snatch','burpee','devil_press','box_jump','skater_hop')
R_FB=('flex(full_body|output|core)',lambda e:e['role'] in ('core','output') or is_full_body(e),lambda e:2*is_full_body(e)+(e['role']=='output'))
def fb_pref(ctx): return None if any(s in ctx['states'] for s in ('low_energy','stressed')) else (lambda e:is_full_body(e))

def circuit_template(ctx,log):
    R=ctx['target_regions']
    if not R or R>={'upper','lower'}:
        fp=fb_pref(ctx)
        low=('lower',R_REG('lower')[1]) if fp is None else ('lower',R_REG('lower')[1],fp)
        t=[R_EO,low,R_REG('upper'),R_FB if fp else (R_FLEX[0],R_FLEX[1],lambda e:e['role']=='output')]   # v4: Low Energy / Stressed flex slot leans to easy output (ropes, carries) over floor holds
    elif R=={'upper'}: t=[R_EO,R_REG('upper'),R_REG('upper'),R_FLEX]
    elif R=={'lower'}: t=[R_EO,R_REG('lower'),R_REG('lower'),R_FLEX]
    elif R=={'trunk'}: t=[R_EO,R_REG('core'),R_REG('core'),('resistance_any',lambda e:e['role'].startswith('resistance'))]
    elif R=={'upper','trunk'}: t=[R_EO,R_REG('upper'),R_REG('core'),R_REG('upper')]
    else: t=[R_EO,R_REG('lower'),R_REG('core'),R_REG('lower')]
    return t

def relax_template(t,ctx,log):
    """Soreness removed a region: region balance relaxes (logged); the slot takes the other region, then core."""
    out=[]
    for name,pred in t:
        out.append((name,pred))
    return out

def fill_with_relax(aid,slot,ctx,d,roles,used_ids,used_fams,label,log,**kw):
    try: return pick_items(aid,slot,ctx,d,roles,used_ids,used_fams,label,log=log,**kw)
    except Fail: pass
    if used_fams:   # relaxation (a): swap-family distinctness across blocks (within-block distinctness stays hard)
        try:
            ch=pick_items(aid,slot,ctx,d,roles,used_ids,set(),label,log=log,**kw)
            log.append(dict(reason_code='relaxation_a',detail=f'{label}: swap family shared with an earlier block')); return ch
        except Fail: pass
    if not ctx['sore_eff'] and not ctx.get('limited'): raise Fail(f'{label}: composition')
    for widen in ('other','core'):
        alt=[]
        for role_t in roles:
            name,pred=role_t[0],role_t[1]
            if name in ('lower','upper'):
                other='upper' if name=='lower' else 'lower'
                ok=('resistance_'+name,'resistance_'+other)+(('core',) if widen=='core' else ())
                alt.append((name+'|widened',lambda e,ok=ok:e['role'] in ok))
            elif name.startswith('flex'):
                alt.append(('flex|widened',lambda e:e['role'] in ('core','output','resistance_lower','resistance_upper')))
            else: alt.append((name,pred))
        for fams in (used_fams,set()):
            try:
                ch=pick_items(aid,slot,ctx,d,alt,used_ids,fams,label,log=log,**kw)
                log.append(dict(reason_code='region_balance_relaxed_sore' if ctx['sore_eff'] else 'region_balance_relaxed_equipment',detail=label))
                if used_fams and not fams: log.append(dict(reason_code='relaxation_a',detail=f'{label}: swap family shared with an earlier block'))
                return ch
            except Fail: pass
    if len(roles)==4:                      # 3-item circuit is within the 3-5 item rule; used only when the pool is genuinely constrained
        try:
            ch=fill_with_relax(aid,slot,ctx,d,roles[:3],used_ids,used_fams,label,log,**kw)
            log.append(dict(reason_code='circuit_three_items',detail=label)); return ch
        except Fail: pass
    raise Fail(f'{label}: composition after relaxation')

def covers(e,m): return m in ({roll(x) for x in e['prim']+e['sec']}|set(e['prim']+e['sec']))
def cover_target(items,ctx,d,log):
    """Target rule: every named muscle is covered (primary or secondary) by the primary circuit; swap the lowest-priority resistance item if needed."""
    if ctx['target_mode']!='explicit': return items
    for m in [x for x in ctx['target'] if x!='full_body']:
        if any(covers(e,m) for e in items): continue
        cands=ranked('sweat_circuit','primary_circuit',ctx,d,'cover_'+m,lambda e,m=m:covers(e,m) and e['role']!='engine')
        done=False
        for i in reversed(range(len(items))):
            if not items[i]['role'].startswith('resistance') and items[i]['role']!='core': continue
            rest=items[:i]+items[i+1:]
            if any(covers(items[i],t) and not any(covers(x,t) for x in rest) for t in ctx['target'] if t!='full_body'): continue
            for c in cands:
                if ok_add(c,rest,set(),set(),[]):
                    log.append(dict(reason_code='target_coverage_swap',detail=f'{items[i]["id"]} -> {c["id"]} ({m})')); items=rest[:i]+[c]+rest[i:]; done=True; break
            if done: break
    return items

def circuit_primary(ctx,d,log,tgt_min,duration):
    exp=ctx['experience']; st=ctx['states']
    roles=circuit_template(ctx,log)
    resistance_only=False
    try:
        items=fill_with_relax('sweat_circuit','primary_circuit',ctx,d,roles,set(),set(),'primary',log)
    except Fail as f:
        eo_pool=ranked('sweat_circuit','primary_circuit',ctx,dict(d,cap=max(d['cap'],base_cap(ctx))),'eo_check',lambda e:e['role'] in ('engine','output'))
        if eo_pool: raise
        # SC4: no engine / output station is feasible -> resistance-only circuit, allowed only as a timed, dense, whole-body block
        wb=lambda e:e['role']!='engine' and e['role']!='output'
        big=lambda e:wb(e) and (e['cls']=='integrated' or (e['pat'] in ('squat','lunge','hinge') and e['sysd']>=3))
        hi=lambda e:wb(e) and e['sysd']>=3
        # SC4: >= 2 systemically demanding items, >= 1 of them a whole-body pattern (2 whole-body preferred)
        plans=[[('whole_body',big)]*2+[('any',wb)]*2,[('whole_body',big),('high_systemic',hi)]+[('any',wb)]*2]
        items=None
        for caps in ([d['cap']] if d['cap']>=base_cap(ctx) else [d['cap'],base_cap(ctx)]):
            for plan in plans:
                try: items=pick_items('sweat_circuit','primary_circuit',ctx,dict(d,cap=caps),plan,set(),set(),'primary',log=log); break
                except Fail: pass
            if items:
                if caps>d['cap']: log.append(dict(reason_code='complexity_relaxed_resistance_only',detail=[e['id'] for e in items if e['cx']>d['cap']]))
                break
        if not items: raise Fail('primary: resistance-only circuit cannot meet SC4')
        resistance_only=True
        log.append(dict(reason_code='conditioning_driver_resistance_only',detail=[e['id'] for e in items]))
    items=cover_target(items,ctx,d,log)
    pick_order=list(items)
    items=order_items(items,log,'primary')
    # structure choice
    opts=['circuit','intervals','emom']
    if exp=='beginner': opts=['circuit','intervals']
    if 'low_energy' in st: opts=[o for o in opts if o in ('circuit','intervals')]
    if 'stressed' in st: opts=['circuit']
    if any(e['eq'] in MIN_BOUT for e in items): opts=[o for o in opts if o not in ('intervals','emom')]     # treadmill / stair need >= 60 s bouts
    if any(is_hanging(e) or e['id'] in ('pull_up','chin_up','neutral_grip_pull_up') for e in items): opts=[o for o in opts if o!='intervals']  # J4 rep cap
    if not opts: opts=['circuit']
    if resistance_only:   # SC4: timed structures only
        opts=['intervals','emom'] if exp!='beginner' and 'low_energy' not in st and 'stressed' not in st else ['intervals']
        opts=opts[:1] if not ('bored' in st) else opts          # timed rotation (continuous clock) is the default resistance-only format
        if 'stressed' in st: items=pick_order[:2]; items=order_items(items,log,'primary'); log.append(dict(reason_code='stressed_resistance_only_couplet',detail=[e['id'] for e in items]))
    pref={'low_energy':['intervals','circuit'],'bored':['emom','intervals','circuit'],'amped':['intervals','circuit','emom'],'irritated':['circuit','intervals']}
    for s in st:
        if s in pref: opts=sorted(opts,key=lambda o:pref[s].index(o) if o in pref[s] else 9); break
    if 'irritated' in st and 'amped' not in st and len([o for o in opts if o!='emom'])>0: opts=[o for o in opts if o!='emom']   # Irritated: simple structures (straight rounds or a running clock), no minute-waiting
    lastp=[h.get('primary_structure') for h in sweat_history(ctx) if h['archetype']=='sweat_circuit']
    shown=ctx['displayed_chain'][-1].get('primary_structure') if ctx.get('displayed_chain') else None
    if len(opts)>1:
        if d['NS']>=0 or d['NE']>0:
            opts=sorted(opts,key=lambda o:((o==shown),(bool(lastp) and o==lastp[-1] and (d['NS']>0 or 'bored' in st))))
        if not st or st==['sore']:
            o2=sorted(opts,key=lambda o:seed(ctx['user'],ctx['date'],'circ_struct',o,ctx.get('swap',0)))
            o2=sorted(o2,key=lambda o:((o==shown),(bool(lastp) and o==lastp[-1])))
            opts=o2
    for s in opts:
        try:
            b=build_circuit_block('primary_circuit',s,items,ctx,d,tgt_min,duration,log)
            if not ensure_duty(b,exp,log): raise Fail('duty cycle below 0.60')
            return b
        except Fail as f: log.append(dict(reason_code='structure_fallback',detail=f'{s}: {f}'))
    raise Fail('primary circuit: no structure fits')

def build_circuit_block(slot,s,items,ctx,d,tgt_min,duration,log,rpe=None):
    exp=ctx['experience']
    rpe=rpe or [7,8]
    if s=='circuit':
        doses=[station_dose(e,exp) for e in items]
        rr={'beginner':60,'intermediate':45,'advanced':30}[exp]          # v4: shorter round rest for a cardio feel
        if 'amped' in ctx['states'] and exp!='beginner': rr=max(30,rr-15)  # Amped: denser, sustained output
        if duration==30: rr=min(rr,45)
        rt=sum(est(x,dz,exp) for x,dz in zip(items,doses))+10*len(items)
        rr=max(30,min(rr,int(rt//15)*15))                       # SC1: passive round rest never exceeds the round's work
        b=mk_block(slot,'circuit',items_e=items,doses=doses,rounds=3,round_rest=rr,rpe=rpe)
        best=min(range(2 if tgt_min<=7 else 3,5 if exp=='beginner' else 6),key=lambda r:abs(block_minutes(dict(b,rounds=r),exp)-tgt_min))
        b['rounds']=best; return b
    if s=='intervals':
        W,R={'beginner':(30,30),'intermediate':(40,20),'advanced':(45,15)}[exp]
        if 'amped' in ctx['states'] and exp!='beginner': W,R=45,15          # Amped: more work per station, sustained pace
        if 'low_energy' in ctx['states'] and exp!='beginner': W,R=30,15   # v4: easier work, but the clock keeps running
        doses=[dict(kind='time',value=W) for _ in items]
        b=mk_block(slot,'intervals',items_e=items,doses=doses,interval_target=dict(work=W,recovery=R,rounds=3,rotate=True,round_rest=45 if exp=='beginner' else 30),rpe=rpe)
        best=min(range(3,6 if len(items)>2 else 12),key=lambda r:abs(block_minutes(dict(b,interval_target=dict(b['interval_target'],rounds=r)),exp)-tgt_min))
        b['interval_target']['rounds']=best; return b
    if s=='emom':
        doses=[]
        for e in items:
            dz=station_dose(e,exp)
            floor=(4 if dz.get('per_side') else 8) if e['role'].startswith('resistance') else (3 if dz.get('per_side') else 5)
            while est(e,dz,exp)>40:                                 # founder correction 5: expected work <= 40 s
                if dz['kind']=='time': dz['value']=40
                elif dz['kind']=='reps':
                    if dz['value']<=floor: raise Fail('emom: '+e['id']+' cannot fit 40 s at its minimum dose')
                    dz['value']-=1
                elif dz['kind']=='distance': dz['value']=(dz['value']-1)//25*25 if dz['value']>50 else dz['value']-5
                elif dz['kind']=='calories': dz['value']-=1
                if dz['value']<=0: raise Fail('emom dose')
            # SC3: fill the minute toward ~36-40 s of work (resistance capped at 15 reps / 10 per side, SC2)
            for _ in range(40):
                nd=dict(dz)
                if nd['kind']=='time': nd['value']=40
                elif nd['kind']=='reps':
                    cap_r=10 if (nd.get('per_side') or is_hanging(e) or e['id'] in ('pull_up','chin_up','neutral_grip_pull_up')) else (15 if e['role'] in ('core',) or e['role'].startswith('resistance') else 20)
                    if e['id'] in ('pull_up','chin_up','neutral_grip_pull_up'): cap_r=8
                    if nd['value']>=cap_r: break
                    nd['value']+=1
                elif nd['kind']=='distance': nd['value']+=10 if nd['value']<100 else 25
                elif nd['kind']=='calories': nd['value']+=1
                if est(e,nd,exp)>40 or nd==dz: break
                dz=nd
            doses.append(dz)
        n=len(items); rounds=max(2,round(tgt_min/n))
        return mk_block(slot,'emom',items_e=items,doses=doses,minutes=n*rounds,rounds=rounds,rpe=rpe)
    if s=='ladder':
        lad=[10,8,6,4,2]
        return mk_block(slot,'ladder',items_e=items,ladder=lad,rpe=rpe)
    raise Fail('structure '+s)

def circuit_comp(ctx,d,log,used_ids,used_fams,tgt_min,duration,aid='sweat_circuit'):
    exp=ctx['experience']; st=ctx['states']
    if 'low_energy' in st: ctype='steady'
    elif 'irritated' in st and 'amped' not in st: ctype='engine_intervals'      # Irritated: hard erg intervals, short and direct
    elif ctx.get('target_set'): ctype='engine_intervals'
    elif 'stressed' in st: ctype='fixed_circuit'
    elif 'bored' in st and exp!='beginner': ctype='couplet_ladder'
    elif exp=='beginner': ctype='engine_intervals'
    else:
        last=[h.get('comp_type') for h in sweat_history(ctx) if h['archetype']==aid]
        ctype='engine_intervals' if (last and last[-1]=='couplet_emom') else 'couplet_emom'
        if ctx.get('swap',0)>0: ctype='engine_intervals' if ctype=='couplet_emom' else 'couplet_emom'
    if ctype=='engine_intervals':
        b=engine_intervals_comp(ctx,d,log,aid,used_ids,used_fams,tgt_min)
        if b: return b
        ctype='fixed_circuit'
    if ctype=='steady':
        def f(e): return e['role']=='engine' and e['id'] in ('treadmill_incline_walk','stationary_bike','row_erg','stair_climber')
        for e in ranked(aid,'complementary_block',ctx,d,'comp',f):
            if e['id'] in used_ids or e['swap'] in used_fams: continue
            return mk_block('complementary_block','continuous',items_e=[e],duration_s=tgt_min*60,rpe=[5,6],comp_type='steady',unit_s=60)
        ctype='fixed_circuit'
    if ctype in ('couplet_emom','couplet_ladder'):
        roles=[('engine_or_output',lambda e:e['role'] in ('engine','output') and e['eq'] not in MIN_BOUT),('resistance',lambda e:e['role'].startswith('resistance'))]
        if ctype=='couplet_ladder': roles=[('output_reps',lambda e:e['role']=='output' and e['metric']=='reps'),('reps_item',lambda e:e['metric']=='reps' and e['lat']=='bilateral' and e['role']!='engine')]
        try:
            items=pick_items(aid,'complementary_block',ctx,d,roles,used_ids,used_fams,'comp')
            b=build_circuit_block('complementary_block','emom' if ctype=='couplet_emom' else 'ladder',items,ctx,d,tgt_min,duration,log,rpe=[6,7])
            b['comp_type']=ctype; return b
        except Fail: ctype='fixed_circuit'
    roles=[R_REG('lower'),R_REG('upper'),('core|carry',lambda e:e['role']=='core' or e['pat']=='carry')]
    items=fill_with_relax(aid,'complementary_block',ctx,d,roles,used_ids,used_fams,'comp',log)
    items=order_items(items,log,'comp')
    b=build_circuit_block('complementary_block','circuit',items,ctx,d,tgt_min,duration,log,rpe=[6,7]); b['comp_type']='fixed_circuit'
    b['rounds']=min(b['rounds'],4); return b

def engine_comp(ctx,d,log,used_ids,used_fams,tgt_min,duration):
    st=ctx['states']
    eh=[h.get('comp_type') for h in sweat_history(ctx) if h['archetype']=='sweat_engine']
    ctype='fixed_circuit' if not eh or eh[-1]=='engine_intervals' else 'engine_intervals'
    if 'stressed' in st or 'low_energy' in st: ctype='fixed_circuit'
    elif 'irritated' in st and 'amped' not in st: ctype='engine_intervals'      # Irritated: hard erg intervals
    if ctx.get('swap',0)>0 and not ('stressed' in st or 'low_energy' in st): ctype='engine_intervals' if ctype=='fixed_circuit' else 'fixed_circuit'
    if ctype=='engine_intervals':
        b=engine_intervals_comp(ctx,d,log,'sweat_engine',used_ids,used_fams,tgt_min)
        if b: return b
    roles=[R_REG('lower'),R_REG('upper'),('core|carry',lambda e:e['role']=='core' or e['pat']=='carry')]
    items=fill_with_relax('sweat_engine','complementary_block',ctx,d,roles,used_ids,used_fams,'comp',log)
    items=order_items(items,log,'comp')
    b=build_circuit_block('complementary_block','circuit',items,ctx,d,tgt_min,duration,log,rpe=[6,7]); b['comp_type']='fixed_circuit'
    b['rounds']=min(b['rounds'],3); return b

def _irritated_anchor(ad):
    k,v=ad['kind'],ad['value']
    if k=='distance': return dict(ad,value=max(200,int(round(v*0.8/50.0)*50)))
    if k=='calories': return dict(ad,value=max(8,int(round(v*0.8))))
    return dict(ad,value=max(60,int(v*0.8)))
def hybrid_primary(ctx,d,log,tgt_min,duration):
    exp=ctx['experience']
    forceful_day=any(x in ctx['states'] for x in ('irritated','amped'))
    apref=(lambda e:{'row_erg':2,'air_bike':1,'ski_erg':1}.get(e['id'],0)) if forceful_day else (lambda e:{'treadmill_run':2,'row_erg':1}.get(e['id'],0))
    anchors=ranked('sweat_hybrid','primary_hybrid_block.anchor',ctx,d,'anchor',prefer_low=apref)
    if not anchors: raise Fail('no hybrid anchor')
    k=4 if duration==60 else 2
    last_err=None
    for a in anchors:
        chosen=[]
        cands=ranked('sweat_hybrid','primary_hybrid_block.station',ctx,d,'stations',prefer_low=lambda e:2*(e['mod']=='sled')+(e['pat']=='carry'))
        # lower-dominant station first (hard: >= 1 lower station)
        lower=[e for e in cands if e['region']=='lower' or e['role']=='resistance_lower']
        for e in lower:
            if ok_add(e,chosen,{a['id']},{a['swap']},[a]): chosen.append(e); break
        if not chosen: last_err='no lower station'; continue
        reserve=[]
        # Hybrid variety: at most one sled station on the first pass, so the full sled-push + sled-pull + carry template is a subset, not the default
        le=('low_energy' in ctx['states'])
        for first in (True,False):
            for e in cands:
                if first and e['mod']=='sled' and any(x['mod']=='sled' for x in chosen+reserve): continue
                if le and le_tier(e)==1 and sum(le_tier(x)==1 for x in [a]+chosen+reserve)>=le_secondary_cap(ctx): continue   # Low Energy stays perceptible
                if e in chosen or e in reserve: continue
                if ok_add(e,chosen,{a['id']},{a['swap']},[a]):
                    if len(chosen)<k: chosen.append(e)
                    elif len(reserve)<1 and ok_add(e,chosen+reserve,{a['id']},{a['swap']},[a]): reserve.append(e)
        if len(chosen)<2: last_err='fewer than 2 stations'; continue
        break
    else: raise Fail('hybrid: '+str(last_err))
    tsec={'beginner':110,'intermediate':150,'advanced':150}[exp] if duration==60 else {'beginner':90,'intermediate':120,'advanced':120}[exp]
    if 'amped' in ctx['states']: tsec=int(tsec*1.15)                  # Amped: longer sustained anchor
    if a['metric']=='distance' or a['id'] in SPM:
        raw=tsec/(SPM[a['id']]*LVM[exp]); v=int(round(raw/100.0)*100) if raw>=350 else int(round(raw/50.0)*50); ad=dict(kind='distance',value=max(200,v))
    elif a['id'] in SPC: ad=dict(kind='calories',value=int(round(tsec/(SPC[a['id']]*LVM[exp]))))
    else: ad=dict(kind='time',value=tsec if a['eq'] not in MIN_BOUT else max(60,tsec))
    chosen=order_items(chosen,log,'stations') if duration==30 else chosen
    doses=[station_dose(e,exp,hybrid=True) for e in chosen]
    rr=60 if exp=='beginner' else 45                                # v4
    if 'amped' in ctx['states'] and exp!='beginner': rr=30           # Amped: denser Hybrid
    if 'irritated' in ctx['states'] and 'amped' not in ctx['states']:
        ad=_irritated_anchor(ad)                                       # Irritated: shorter, harder anchor bouts
    if duration==60:
        rounds=len(chosen) if len(chosen)>=3 else 4
        rs=[[(chosen[r%len(chosen)],doses[r%len(chosen)])] for r in range(rounds)]
    else:
        rs=[list(zip(chosen,doses)) for _ in range(3)]
    b=mk_block('primary_hybrid_block','circuit',anchor=a,anchor_dose=ad,items_e=[a]+chosen,stations=list(zip(chosen,doses)),reserve=reserve if duration==60 else [],_exp=exp,round_stations=rs,round_rest=rr,rpe=[7,7],rotating=(duration==60))
    return b

def hybrid_comp(ctx,d,log,used_ids,used_fams,tgt_min,duration):
    roles=[R_REG('upper'),('upper|output',lambda e:e['role'] in ('resistance_upper','output')),R_REG('core')]
    items=fill_with_relax('sweat_hybrid','complementary_block',ctx,d,roles,used_ids,used_fams,'comp',log)
    items=order_items(items,log,'comp')
    b=build_circuit_block('complementary_block','circuit',items,ctx,d,tgt_min,duration,log,rpe=[6,7]); b['comp_type']='fixed_circuit'
    b['round_rest']=30; b['rounds']=3; return b

def finisher(ctx,d,log,aid,used_ids,used_fams):
    items=[]
    for e in ranked(aid,'optional_extra',ctx,d,'finisher',lambda e:max_intent_ok(e) and e['eq'] not in MIN_BOUT):
        if e['id'] in used_ids or e['swap'] in used_fams or any(x['swap']==e['swap'] for x in items): continue
        if len({x['fixed'] for x in items+[e] if x['fixed']})>1: continue
        items.append(e)
        if len(items)==(1 if d['G']>=2 else 2): break
    if not items: return None
    W,R=(20,30) if len(items)>1 else (15,30)                      # v4
    return mk_block('optional_extra','finisher',items_e=items,interval_target=dict(work=W,recovery=R,rounds=6,alternate=len(items)>1),rpe=[9,9])

# ------------------------------------------------------------------ session assembly
WU={('sweat_engine',60):7,('sweat_circuit',60):6,('sweat_hybrid',60):7,('sweat_engine',30):4,('sweat_circuit',30):4,('sweat_hybrid',30):5}
DS={60:5,30:3}
def used_of(blocks):
    ids=set(); fams=set()
    for b in blocks:
        for e in b['items_e']+b.get('reserve',[]): ids.add(e['id']); fams.add(e['swap'])
    return ids,fams

def total_minutes(blocks,aid,duration,exp):
    work=[b for b in blocks]
    return WU[(aid,duration)]+DS[duration]+len(work)+sum(block_minutes(b,exp) for b in work)

def add_unit(b,sign=1):
    s=b['structure']
    if s=='continuous': b['duration_s']=max(300,b['duration_s']+sign*b.get('unit_s',120)); return True
    if s=='intervals' or s=='finisher':
        it=b['interval_target']; nr=it['rounds']+sign
        if nr<2: return False
        it['rounds']=nr; return True
    if s=='pyramid': return False
    if s=='emom':
        nr=b['rounds']+sign
        if nr<2: return False
        b['rounds']=nr; b['minutes']=nr*len(b['items_e']); return True
    if s=='circuit':
        if b.get('anchor'):
            rs=b['round_stations']
            if sign<0:
                if len(rs)<=3: return False
                rs.pop(); return True
            st=b['stations']
            if b.get('rotating') and b.get('reserve') and len(rs)>=len(st):
                e=b['reserve'].pop(0); dz=station_dose(e,b['_exp'],hybrid=True); st.append((e,dz)); b['items_e'].append(e)
            rs.append([st[len(rs)%len(st)]] if b.get('rotating') else list(st)); return True
        nr=b['rounds']+sign
        if nr<2 or nr>6: return False
        b['rounds']=nr; return True
    if s=='ladder':
        if sign>0:
            if b['ladder'][0]>=14: return False
            b['ladder']=[b['ladder'][0]+2]+b['ladder']; return True
        if len(b['ladder'])<=3: return False
        b['ladder']=b['ladder'][:-1]; return True
    return False

def build(aid,ctx,d,log):
    duration=ctx['duration']; exp=ctx['experience']; blocks=[]
    pt=PRIMARY_TGT[(aid,duration)]
    if aid=='sweat_engine':
        mode,fmt=engine_mode(ctx,log)
        blocks.append(engine_primary(ctx,d,log,fmt,mode,pt))
    elif aid=='sweat_circuit': blocks.append(circuit_primary(ctx,d,log,pt,duration))
    else: blocks.append(hybrid_primary(ctx,d,log,pt,duration))
    p=blocks[0]
    comp_active = duration==60 or block_minutes(p,exp)<=14
    if comp_active: _add_comp(aid,ctx,d,log,blocks,duration)
    # ---- Sweat DF (before State dials)
    lo,hi=BAND[duration]; guard=0
    while total_minutes(blocks,aid,duration,exp)<lo and guard<12:
        guard+=1
        itp=blocks[0].get('interval_target') or {}
        if block_minutes(blocks[0],exp)<PRIMARY_MAX[(aid,duration)]-1 and itp.get('rounds',0)<itp.get('df_max',99) and add_unit(blocks[0]):
            log.append(dict(reason_code='duration_backfill',detail='primary +1 unit')); continue
        if len(blocks)>1 and block_minutes(blocks[1],exp)<COMP_MAX[aid] and add_unit(blocks[1]):
            log.append(dict(reason_code='duration_backfill',detail='complement +1 unit')); continue
        if len(blocks)==1 and duration==30:
            _add_comp(aid,ctx,d,log,blocks,duration,small=True)
            if len(blocks)>1: log.append(dict(reason_code='duration_backfill',detail='complement activated at 30')); continue
        break
    guard=0
    while total_minutes(blocks,aid,duration,exp)>hi+0.5 and guard<12:
        guard+=1
        if len(blocks)>1 and add_unit(blocks[1],-1): log.append(dict(reason_code='duration_trim',detail='complement -1 unit')); continue
        if add_unit(blocks[0],-1): log.append(dict(reason_code='duration_trim',detail='primary -1 unit')); continue
        break
    if total_minutes(blocks,aid,duration,exp)>hi+0.5 and len(blocks)>1 and duration==30:
        blocks.pop(1)
        log[:]=[a for a in log if not str(a.get('detail','')).startswith('comp') and a.get('detail')!='complement -1 unit']
        log.append(dict(reason_code='duration_trim',detail='complement removed at 30'))
    # I3 guard: conditioning time must reach the pre-dial floor; add primary units while the session still fits
    i3=14 if duration==30 else 26; guard=0
    while sum(block_minutes(b,exp) for b in blocks)<i3 and guard<6:
        guard+=1; snap=copy.deepcopy(blocks[0])
        if not add_unit(blocks[0]) or total_minutes(blocks,aid,duration,exp)>duration:
            blocks[0]=snap; break
        log.append(dict(reason_code='duration_backfill',detail='primary +1 unit (I3 floor)'))
    # ---- State dials: Volume
    V=d['V']
    if V>0:
        for _ in range(V):
            if add_unit(blocks[0]): log.append(dict(reason_code='state_volume',detail='+1 unit primary'))
    elif V<0:
        floor=12 if duration==30 else 22                      # DIAL BINDING clamp: never below the minimum viable session (I3)
        for _ in range(-V):
            tgt=blocks[-1] if len(blocks)>1 else blocks[0]
            snap=copy.deepcopy(tgt)
            if add_unit(tgt,-1):
                if sum(block_minutes(b,exp) for b in blocks)<floor:
                    blocks[blocks.index(tgt)]=snap; log.append(dict(reason_code='state_volume_clamped',detail='Volume -1 would breach I3 floor'))
                else: log.append(dict(reason_code='state_volume',detail=f'-1 unit {tgt["slot"]}'))
    # ---- Extras / finisher (60 only)
    if duration==60 and d['X']>=1:
        ids,fams=used_of(blocks); f=finisher(ctx,d,log,aid,ids,fams)
        if f and total_minutes(blocks+[f],aid,duration,exp)<=hi+0.5:
            blocks.append(f); log.append(dict(reason_code='extra_finisher',detail=','.join(e['id'] for e in f['items_e'])))
    # ---- Effort
    E=d['E']
    for i,b in enumerate(blocks):
        if b['slot']=='optional_extra': continue
        if E and (d['ESCOPE']=='all' or i==0):
            cap=8 if exp=='beginner' else 9
            b['rpe']=[min(cap,b['rpe'][0]+E),min(cap,b['rpe'][1]+E)]
    if exp=='beginner':
        for b in blocks: b['rpe']=[min(8,b['rpe'][0]),min(8,b['rpe'][1])]
    # SC3: primary block duty cycle >= 0.60
    if not ensure_duty(blocks[0],exp,log): raise Fail('primary duty cycle below 0.60 after repair')
    # SC5: progression is output-oriented; resistance loads are reused, never the progression objective
    for b in blocks:
        b['progression_basis']={'continuous':'duration / pace at the same RPE','intervals':'interval output (meters, calories, pace) and completion',
            'pyramid':'output held across steps','emom':'minutes completed on time, then modest density','circuit':'rounds completed / round time',
            'ladder':'completion time','finisher':'output held'}[b['structure']]
        b['item_progression']={e['id']:('output' if e['role'] in ('engine','output') else 'reuse_load') for e in b['items_e']}
    # I6: at most 2 blocks with RPE floor >= 8 (cap complement first)
    hard=[b for b in blocks if b['rpe'][0]>=8]
    if len(hard)>2:
        for b in blocks:
            if b['slot']=='complementary_block' and b['rpe'][0]>=8:
                b['rpe']=[7,max(7,b['rpe'][1]-1)]; log.append(dict(reason_code='stacking_cap',detail='complement RPE floor 7'))
    return blocks

def _add_comp(aid,ctx,d,log,blocks,duration,small=False):
    ids,fams=used_of(blocks); ct=COMP_TGT[aid] if (not small and duration==60) else 6
    try:
        if aid=='sweat_engine': c=engine_comp(ctx,d,log,ids,fams,ct,duration)
        elif aid=='sweat_circuit': c=circuit_comp(ctx,d,log,ids,fams,ct,duration)
        else: c=hybrid_comp(ctx,d,log,ids,fams,ct,duration)
        if c: blocks.append(c)
    except Fail as f:
        # constrained-pool fallback: a simple 2-item circuit from whatever remains (region balance not required in a complement)
        try:
            roles=[('any_nonengine',lambda e:e['role']!='engine'),('any_nonengine',lambda e:e['role']!='engine')]
            its=pick_items(aid,'complementary_block',ctx,d,roles,ids,set(),'comp_fallback',log=log)
            c=build_circuit_block('complementary_block','circuit',its,ctx,d,ct,duration,log,rpe=[6,7]); c['comp_type']='fixed_circuit'
            blocks.append(c); log.append(dict(reason_code='complement_simplified',detail=str(f))); log.append(dict(reason_code='relaxation_a',detail='comp_fallback: swap family shared with an earlier block'))
        except Fail as f2:
            log.append(dict(reason_code='complement_unavailable',detail=str(f2)))

# ------------------------------------------------------------------ top level
def make_ctx(inp):
    ctx=dict(inp)
    ctx.setdefault('states',[]); ctx.setdefault('history',[]); ctx.setdefault('swap',0); ctx.setdefault('displayed_chain',[])
    ctx.setdefault('user','u1'); ctx.setdefault('date','2026-10-01'); ctx.setdefault('goal','lose_weight_conditioning')
    pre=ctx.get('preset','sweat_commercial_default'); ctx['equip'],ctx['space']=PRESETS[pre]
    ctx['limited']=pre in ('free_weight_limited','db_bodyweight_only')
    ctx['goal_row']=GOAL_ROW[ctx['goal']]
    sore=set()
    for m in ctx.get('sore',[]): sore|=expand(m)
    T=ctx.get('target')
    ctx['target_mode']='pick' if not T else ('full_body' if T=='full_body' else 'explicit')
    tset=set()
    if ctx['target_mode']=='explicit':
        for m in T: tset|=expand(m)
    named=tset
    ctx['sore_all']=sore; ctx['sore_eff']=sore-named; ctx['sore_override']=sore&named
    ctx['target_set']=tset if ctx['target_mode']=='explicit' else set()
    ctx['target_regions']={region_of(m) for m in T} if ctx['target_mode']=='explicit' else set()
    ctx['target_count']=len(T) if ctx['target_mode']=='explicit' else 0
    return ctx

def feasible(aid,ctx,d):
    """Equipment / experience precheck (soreness ignored): what an archetype needs to exist at all."""
    c=dict(ctx,sore_eff=set())
    if aid=='sweat_engine': return bool(ranked('sweat_engine','primary_engine_block',c,d,'feas'))
    if aid=='sweat_hybrid':
        return bool(ranked('sweat_hybrid','primary_hybrid_block.anchor',c,d,'feas')) and len(ranked('sweat_hybrid','primary_hybrid_block.station',c,d,'feas'))>=2
    eo=ranked('sweat_circuit','primary_circuit',c,dict(d,cap=max(d['cap'],base_cap(ctx))),'feas',lambda e:e['role'] in ('engine','output'))
    rs=ranked('sweat_circuit','primary_circuit',c,d,'feas',lambda e:e['role']!='engine' and e['role']!='output')
    return (bool(eo) and len(rs)>=2) or len(rs)>=4

def select_archetypes(ctx,d,log):
    if ctx['target_mode']=='explicit':
        log.append(dict(reason_code='target_routed_circuit',detail=sorted(ctx['target_set']))); return ['sweat_circuit']
    rot=list(ROTATION[ctx['goal_row']])
    if ctx['experience']=='beginner': rot=[a for a in rot if a!='sweat_hybrid']+['sweat_hybrid']
    h=sweat_history(ctx); last=h[-1]['archetype'] if h else None
    # rotation recency: never-used archetypes first (rotation order), then least recently used; the last session's archetype goes last
    lastidx={a:i for i,x in enumerate(h) for a in [x['archetype']]}
    c=sorted(rot,key=lambda a:(a in lastidx, lastidx.get(a,-1), rot.index(a)))
    st=[s for s in ctx['states'] if s in AFFINITY]
    aff=None
    for s in st: aff=AFFINITY[s] if aff is None else aff&AFFINITY[s]
    if st and not aff: aff=AFFINITY[[s for s in CONSTRAINED if s in st][0]]
    if aff: c=sorted(c,key=lambda a:(a not in aff, a==last))
    if 'bored' in ctx['states']:
        recent=[x['archetype'] for x in h[-2:]]
        c=sorted(c,key=lambda a:(aff is not None and a not in aff, a in recent, recent.index(a) if a in recent else -1) if recent else 0)
    if ctx.get('swap',0)>=2:
        k=(ctx['swap']-1)%len(c); c=c[k:]+c[:k]
        log.append(dict(reason_code='swap_archetype_advance',detail=c[0]))
    return c

def generate(inp):
    ctx=make_ctx(inp); log=[]
    d=resolve_dials(ctx['states'],ctx['duration'],ctx['experience'])
    log.append(dict(reason_code='dials_resolved',detail={k:d[k] for k in ('V','E','NE','NS','C','G','X','cap','pair')}))
    if ctx['sore_override']: log.append(dict(reason_code='sore_override_by_explicit_target',detail=sorted(ctx['sore_override'])))
    if ctx['sore_eff']: log.append(dict(reason_code='sore_exclusion',detail=sorted(ctx['sore_eff'])))
    forced=inp.get('force_archetype')
    order=[forced] if forced else select_archetypes(ctx,d,log)
    outcome=None; blocks=None; chosen=None
    for i,aid in enumerate(order):
        if not feasible(aid,ctx,d):
            log.append(dict(reason_code='archetype_skipped_equipment',detail=aid)); continue
        L=[]
        try:
            blocks=build(aid,ctx,d,L); chosen=aid; log+=L
            outcome='VALID ADAPTIVE REROUTE' if any(x['reason_code']=='sore_reroute' for x in log) else 'VALID BUILD'
            break
        except Fail as f:
            if ctx['sore_eff']:
                # operational dependency: builds without soreness -> dependent on the sore muscles
                try:
                    build(aid,dict(ctx,sore_eff=set()),d,[]); dep=True
                except Fail: dep=False
                if dep:
                    if ctx['target_mode']=='explicit' or forced:
                        log.append(dict(reason_code='sore_terminal_conflict',detail=f'{aid}: {f}')); outcome='VALID TERMINAL CONFLICT'; chosen=aid; blocks=None; break
                    log.append(dict(reason_code='sore_reroute',detail=f'{aid} dependent: {f}')); continue
            log.append(dict(reason_code='generator_failure',detail=f'{aid}: {f}')); outcome='ACTUAL GENERATOR FAILURE'; chosen=aid; blocks=None; break
    if outcome is None:
        outcome='VALID INFEASIBLE (equipment)' if forced else 'ACTUAL GENERATOR FAILURE'
        chosen=forced
    w=dict(direction='sweat',archetype_id=chosen,duration=ctx['duration'],states=ctx['states'],experience=ctx['experience'],goal_row=ctx['goal_row'],
           target=ctx.get('target'),preset=ctx.get('preset','sweat_commercial_default'),outcome=outcome,dials=d,adjustments=log,blocks=blocks or [],
           warm_up_min=WU.get((chosen,ctx['duration'])),downshift_min=DS[ctx['duration']])
    if blocks:
        w['est_minutes']=round(total_minutes(blocks,chosen,ctx['duration'],ctx['experience']),1)
        w['conditioning_minutes']=round(sum(block_minutes(b,ctx['experience']) for b in blocks),1)
        w['engine_mode']=blocks[0].get('engine_mode'); w['engine_format']=blocks[0].get('engine_format')
    w['_ctx']=ctx
    return w

def history_record(w):
    b=w['blocks']
    ex=[e['id'] for x in b for e in x['items_e']]; fam=[EX[i]['swap'] for i in ex]
    return dict(direction='sweat',archetype=w['archetype_id'],engine_mode=w.get('engine_mode'),engine_format=w.get('engine_format'),
                primary_structure=b[0]['structure'] if b else None,comp_type=next((x.get('comp_type') for x in b if x['slot']=='complementary_block'),None),
                exercises=ex,families=fam)
