"""Sweat rebuild QA metrics over the sample JSON. Run from backend/: python3 mood_v3/qa/sweat_core_metrics.py mood_v3/qa/results/sweat_core_sample.json"""
import json, sys, collections, statistics as st
rows=json.load(open(sys.argv[1])); ok=[r for r in rows if r['status']=='ok']
C=collections.Counter
print('rows',len(rows),'ok',len(ok))
print('CONFLICTS',C((r['conflict'],tuple(r['raw'].get('states',[])),r['raw'].get('archetype'),r['raw'].get('equipment'),r['raw'].get('experience'),tuple(r['raw'].get('soreness',[])),tuple(r['raw'].get('target',[]) or [])) for r in rows if r['status']!='ok'))
# archetype dist
print('ARCH by tag', {t:dict(C(r['archetype'] for r in ok if r['tag']==t)) for t in ('arch','pick','target','sore','equip')})
print('SHAPES', dict(C((r['archetype'],r['shape']) for r in ok)))
# duration
for d in (30,60):
    xs=[r['est'] for r in ok if r['raw']['duration']==d]
    print('DUR',d,'n',len(xs),'min',min(xs),'p10',st.quantiles(xs,n=10)[0],'med',st.median(xs),'p90',st.quantiles(xs,n=10)[-1],'max',max(xs), 'under',sum(1 for x in xs if x<(24 if d==30 else 48)),'over',sum(1 for x in xs if x>(31 if d==30 else 60.5)))
# gate
g=collections.defaultdict(lambda:[0,0])
for r in ok:
    for s,v in (r['gate'] or {}).items(): g[s][0]+=v; g[s][1]+=1
print('GATE', {s:(a,b,round(a/b,3)) for s,(a,b) in g.items()})
fails=[(r['raw']['states'],r['archetype'],r['raw']['duration'],r['raw']['experience'],r['raw'].get('target'),r['raw'].get('soreness'),r['gate']) for r in ok if r['gate'] and not all(r['gate'].values())]
print('GATE FAILS',len(fails)); [print('  ',f) for f in fails[:40]]
# coherence
co=[r for r in ok if r['coherence']]
def cohok(c): return all(v.get('passed') for v in c.values()) if isinstance(c,dict) else True
print('COHERENCE sessions',len(co),'all-pass',sum(cohok(r['coherence']) for r in co),'verdicts',sum(len(r['coherence']) for r in co),'passed',sum(v['passed'] for r in co for v in r['coherence'].values()))
cf=collections.Counter()
for r in co:
    for s,v in r['coherence'].items():
        if not v.get('passed'):
            for f in (v.get('after') or []): cf[(s,f.split('(')[0][:50])]+=1
print('COH FAILS'); [print('  ',k,v) for k,v in cf.most_common(40)]
print('COH REPAIRS', C(rep for r in co for v in r['coherence'].values() for rep in (v.get('repairs') or [])).most_common(20))
# budget
bo=C()
for r in ok:
    for a in r['decisions']:
        if a['reason_code']=='budget_open': bo[str(a.get('violations') or a.get('detail'))[:80]]+=1
print('BUDGET_OPEN',sum(bo.values()),bo.most_common(10))
print('DECISION CODES',C(a['reason_code'] for r in ok for a in r['decisions']).most_common(40))
# hybrid stats
hy=[r for r in ok if r['archetype']=='sweat_hybrid']
def bget(r,k): return (r['budget'] or {}).get(k)
for d in (30,60):
    h=[r for r in hy if r['raw']['duration']==d]
    if not h: continue
    print('HYBRID',d,'n',len(h),{k:(round(min(v),2),round(st.median(v),2),round(max(v),2)) for k,v in ((k,[bget(r,k) for r in h if bget(r,k) is not None]) for k in ('anchor_share','engine_share','engine_minutes','active_minutes','loaded_reps','bodyweight_reps','impact','transitions','hard_share','stations')) if v})
    print('  shapes',C(r['shape'] for r in h),'rounds',C(r['blocks'][0].get('rounds') for r in h))
# budget keys sanity
print('BUDGET KEYS', sorted((ok[0]['budget'] or {}).keys()))
# level/goal differences
for a in ('sweat_engine','sweat_circuit','sweat_hybrid'):
    for lvl in ('beginner','intermediate','advanced'):
        h=[r for r in ok if r['archetype']==a and r['raw']['experience']==lvl and r['raw']['duration']==60 and r['tag']=='arch']
        if h: print('LEVEL',a,lvl,'n',len(h),'rpe_max',C(max((b['rpe'] or [0,0])[1] if isinstance(b['rpe'],(list,tuple)) else (b['rpe'] or 0) for b in r['blocks']) for r in h).most_common(4),'loaded',round(st.median([bget(r,'loaded_reps') or 0 for r in h])),'impact',round(st.median([bget(r,'impact') or 0 for r in h])),'stations',round(st.median([bget(r,'stations') or 0 for r in h]),1),'fin',sum(any(b['structure']=='finisher' for b in r['blocks']) for r in h))
print('GOAL shapes', {g:dict(C((r['archetype'].split('_')[1],r['shape']) for r in ok if r['tag']=='goal' and r['raw']['goal']==g)) for g in sorted({r['raw']['goal'] for r in ok if r['tag']=='goal'})})
# variety sequential
for u in ('h1','h2','h3','h4','h5'):
    s=[r for r in ok if r.get('seq_user')==u]
    print('SEQ',u,[(r['archetype'].split('_')[1][:3],r['shape'],[b['items'][0]['id'][:14] for b in r['blocks']][:2]) for r in s])
    ids=[tuple(sorted(i['id'] for b in r['blocks'] for i in b['items'])) for r in s]
    print('   distinct sessions',len(set(ids)),'/',len(ids),'shape distinct',len({r['shape'] for r in s}))
# truthfulness
bad=0;tot=0
for r in ok:
    cl=r.get('why_claims') or []
    for c in cl:
        tot+=1
        if isinstance(c,(list,tuple)) and c[0]=='state_realized' and not (r['gate'] or {}).get(c[1],False): bad+=1
        if isinstance(c,(list,tuple)) and c[0]=='state_yielded' and (r['gate'] or {}).get(c[1],False) and False: bad+=1
print('CLAIMS',tot,'unbacked',bad)
print('BFT codes',C(c for r in ok for c,_ in r['bft']).most_common(20))
# DW / swap
dw=[r for r in rows if r['tag'] in ('dw1','dw2','swap','dw_err','swap_err')]
print('DW/SWAP',C((r['tag'],r['status']) for r in dw))
