"""Personalization, coherence, Core and beginner-method metrics over a strength_core_sample JSON. Usage: python -m mood_v3.qa.strength_core_metrics sample.json"""
import json, collections, statistics as S, sys, re
rows=json.load(open(sys.argv[1])); ok=[r for r in rows if r['status']=='ok']; C=collections.Counter
def st(r): return tuple(r['raw']['states'])
def pct(a,b): return f"{100*a/b:.0f}% ({a}/{b})" if b else 'n/a'
print('== sample',len(rows),'ok',len(ok),'conflicts',C((r['raw'].get('archetype') or str(r['raw'].get('target')), str(r['raw'].get('soreness')), r['conflict']) for r in rows if r['status']!='ok').most_common(6))
# ---- State satisfaction gate
print('\n== STATE SATISFACTION GATE')
tot=0; sat=0; fb=0; exh=0; attempts=C(); per=collections.defaultdict(lambda:[0,0,0])
for r in ok:
    g=[x for x in r['gate'] if x['reason_code']=='state_gate']
    final={}
    for x in g: final[x['state']]=x
    for s,x in final.items():
        tot+=1; per[s][0]+=1
        if x['satisfied'] in (True,'True'): sat+=1; per[s][1]+=1
        if int(x['attempt'])>0: fb+=1; per[s][2]+=1
    exh+=sum(1 for x in r['gate'] if x['reason_code']=='state_gate_exhausted')
yielded=C(); exhausted=C()
for r in ok:
    for x in r['gate']:
        if x['reason_code']=='state_gate_yielded': yielded[(x['state'],x['rule'])]+=1
        if x['reason_code']=='state_gate_exhausted': exhausted[(x['state'],r['archetype'],r['raw']['experience'])]+=1
print(f" states evaluated {tot}; satisfied {pct(sat,tot)}; needed a fallback expression {pct(fb,tot)}; yielded to a conflicting State by rule {sum(yielded.values())}; exhausted {exh}")
print('   yielded:',dict(yielded)); print('   exhausted by (state, archetype, level):',dict(exhausted))
for s,(n,k,f) in sorted(per.items()): print(f"   {s:12} satisfied {pct(k,n)}  fallback used {pct(f,n)}")
# first-attempt no-op rate (what Phase 1 shipped): attempt 0 unsatisfied
first=C(); firstn=C()
for r in ok:
    for x in r['gate']:
        if x['reason_code']=='state_gate' and int(x['attempt'])==0: firstn[x['state']]+=1; first[x['state']]+= (x['satisfied'] not in (True,'True'))
print(' first-attempt no-op rate (before fallback):',{s:f"{100*first[s]/firstn[s]:.0f}%" for s in sorted(firstn)})
# realized kinds per state (fingerprint)
print('\n== STATE FINGERPRINTS (realized adaptation kinds in the final workout)')
for s in ('low_energy','stressed','bored','irritated','amped'):
    g=[r for r in ok if s in r['raw']['states'] and r['tag']=='arch']
    kinds=C(); combos=C(); expr=C(); meth=C(); fin=0
    for r in g:
        p=next((p for p in r['personalization'] if p['input']=='state' and p['value']==s),None)
        if not p: continue
        ks=tuple(sorted(set(p['kinds']))); combos[ks]+=1; kinds.update(set(p['kinds'])); expr[p.get('expression')]+=1
        meth.update([it['method'] for it in r['items'] if it.get('method')]); fin+= r['finisher'] is not None
    n=len(g)
    print(f"\n {s} n={n}: kinds {dict((k,f'{100*v/n:.0f}%') for k,v in kinds.most_common())}")
    print(f"   top combinations: {[(list(k),v) for k,v in combos.most_common(5)]}")
    print(f"   expressions {dict(expr)}   set methods present {dict(meth)}   finisher {pct(fin,n)}")
    base={(r['raw']['date'],r['raw']['archetype'],r['raw']['duration'],r['raw']['experience'],r['raw']['goal']):r for r in ok if r['tag']=='arch' and st(r)==()}
    ret=[]; ds=[]; drir=[]; drest=[]
    for r in g:
        if st(r)!=(s,): continue
        b=base.get((r['raw']['date'],r['raw']['archetype'],r['raw']['duration'],r['raw']['experience'],r['raw']['goal']))
        if not b: continue
        eb={i['ex'] for i in b['items'] if i['type']!='finisher'}; er={i['ex'] for i in r['items'] if i['type']!='finisher'}; ret.append(len(eb&er)/len(eb))
        ws=lambda x:sum(i['sets'] or 0 for i in x['items'] if i['type']!='finisher'); ds.append(ws(r)-ws(b))
        mr=lambda x:S.mean([i['rir'] for i in x['items'] if i['rir'] is not None and i['type']!='finisher']); drir.append(mr(r)-mr(b))
        mrs=lambda x:S.mean([i['rest'] for i in x['items'] if i['rest'] and i['type']!='finisher']); drest.append(mrs(r)-mrs(b))
    if ret: print(f"   single-State vs same no-State build: retention {S.mean(ret):.0%}  Δsets {S.mean(ds):+.2f}  ΔRIR {S.mean(drir):+.2f}  Δrest {S.mean(drest):+.1f}s")
# ---- explanation truthfulness
print('\n== EXPLANATION TRUTHFULNESS')
bad=0; n=0; nowhy=0
for r in ok:
    line=next((t for c,t in r['bft'] if c.startswith('state_') or c=='why_today'),None)
    if not line: nowhy+=1; continue
    n+=1
    P={(p['input'],p['value'] if not isinstance(p['value'],list) else 'list'):p for p in r['personalization']}
    for inp,val in (r.get('why_claims') or []):
        if inp=='state' and not P.get(('state',val),{}).get('realized'): bad+=1
        if inp in ('experience','goal') and not P.get((inp,val),{}).get('realized'): bad+=1
        if inp=='soreness' and not next((p for p in r['personalization'] if p['input']=='soreness' and p['realized']),None): bad+=1
        if inp=='history' and not next((p for p in r['personalization'] if p['input']=='history' and p['realized']),None): bad+=1
        if inp=='state_yielded' and not any(g['reason_code']=='state_gate_yielded' and g['state']==val for g in r['gate']): bad+=1
        if inp=='target' and not next((p for p in r['personalization'] if p['input']=='target' and p['realized']),None): bad+=1
# detail-level truth: every 'X RIR a→b' / 'X n→m sets' in a State's realized list must match the final prescription
dbad=0; dtot=0
for r in ok:
    byname={i['name']:i for i in r['items']}
    for p in r['personalization']:
        if p['input']!='state': continue
        for d in p['realized']:
            m=re.match(r'(.+?) RIR (\d)→(\d)$',d)
            if m and m.group(1) in byname: dtot+=1; dbad+= byname[m.group(1)]['rir']!=int(m.group(3))
            m=re.match(r'(.+?) (\d)→(\d) sets$',d)
            if m and m.group(1) in byname: dtot+=1; dbad+= byname[m.group(1)]['sets']!=int(m.group(3))
print(f" realized RIR / set details checked against the final prescription: {dtot}, mismatches {dbad}")
print(f" workouts with a synthesised line {n}; claims not backed by a realized contract entry: {bad}; workouts with no synthesised line {nowhy} (no State, no soreness, nothing material to say beyond structure)")
def _lint(t):
    t=t.lower()
    for n in ('lower body','lower back','lower-body'): t=t.replace(n,'')
    return any(re.search(r'\b'+w+r'\b',t) for w in ('easier','reduced','lower'))
lint=sum(1 for r in ok for c,t in r['bft'] if _lint(t))
print(f" style-lint violations: {lint}")
# ---- experience realization
print('\n== EXPERIENCE LEVEL (archetype runs, no State, 60 min)')
for lvl in ('beginner','intermediate','advanced'):
    g=[r for r in ok if r['tag'] in ('arch','goal') and st(r)==() and r['raw']['duration']==60 and r['raw']['experience']==lvl and r['archetype']!='strength_core']
    its=[i for r in g for i in r['items'] if i['type']!='finisher']
    import importlib
    print(f" {lvl:12} n={len(g)} sets/session {S.mean(sum(i['sets'] or 0 for i in r['items'] if i['type']!='finisher') for r in g):.1f}  exercises {S.mean(len([i for i in r['items'] if i['type']!='finisher']) for r in g):.1f}  set-method in session {pct(sum(1 for r in g if r['methods']),len(g))}  methods {dict(C(m for r in g for m in r['methods']))}")
    print(f"      variants {dict(C(r['variant'] for r in g).most_common())}")
    print(f"      RIR {dict(C(i['rir'] for i in its).most_common())}  primary reps {dict(C(i['reps'] for i in its if i['cls']=='primary_compound').most_common(4))}  accessory reps {dict(C(i['reps'] for i in its if i['cls']=='accessory').most_common(4))}")
    print(f"      structures {dict(C(s for r in g for s in set(r['structures'])).most_common())}")
# complexity needs library: approximate via names not available; use decisions? skip
# ---- goal realization
print('\n== GOAL (goal grid, no State, 60 min, intermediate+advanced)')
for goal in ('build_muscle','build_strength','improve_athleticism','lose_weight_conditioning','feel_better_reduce_stress','stay_consistent'):
    g=[r for r in ok if r['tag']=='goal' and r['raw']['goal']==goal and r['raw']['experience']!='beginner']
    its=[i for r in g for i in r['items'] if i['type']!='finisher']
    acc=[i for i in its if i['cls'] in ('accessory','extra')]
    print(f" {goal:26} n={len(g)} variants {dict(C(r['variant'] for r in g).most_common())}")
    print(f"      primary reps {dict(C(i['reps'] for i in its if i['cls']=='primary_compound').most_common(3))} primary rest {dict(C(i['rest'] for i in its if i['cls']=='primary_compound').most_common(3))} accessories/session {len(acc)/len(g):.1f} accessory sets/session {sum(i['sets'] or 0 for i in acc)/len(g):.1f} accessory rest {dict(C(i['rest'] for i in acc).most_common(3))} compound RIR {dict(C(i['rir'] for i in its if i['cls'] in ('primary_compound','secondary_compound')).most_common(3))} methods {dict(C(m for r in g for m in r['methods']))}")
# ---- methods overall
print('\n== SET METHODS (all archetype runs)')
arch=[r for r in ok if r['tag']=='arch']
print(' sessions with a method:',pct(sum(1 for r in arch if r['methods']),len(arch)),' by method',dict(C(m for r in arch for m in r['methods'])))
print(' by State:',{s:pct(sum(1 for r in arch if st(r)==(s,) and r['methods']),sum(1 for r in arch if st(r)==(s,))) for s in ('','low_energy','stressed','bored','irritated','amped')})
print(' method on which class:',dict(C(i['cls'] for r in arch for i in r['items'] if i.get('method'))))
# ---- regression / base
print('\n== BASE + REGRESSION')
ns60=[r for r in arch if st(r)==() and r['raw']['duration']==60 and r['archetype']!='strength_core']; ns30=[r for r in arch if st(r)==() and r['raw']['duration']==30 and r['archetype']!='strength_core']
print(f" no-State 60: straight-only {pct(sum(1 for r in ns60 if set(r['structures'])=={'straight'}),len(ns60))} est mean {S.mean(r['est'] for r in ns60):.1f} in 50–60 {pct(sum(1 for r in ns60 if 50<=r['est']<=60),len(ns60))} variants {dict(C(r['variant'] for r in ns60).most_common())}")
print(f" no-State 30: est mean {S.mean(r['est'] for r in ns30):.1f} in 25–33 {pct(sum(1 for r in ns30 if 25<=r['est']<=33),len(ns30))}")
am=[r for r in arch if st(r)==('amped',) and r['raw']['duration']==60]; ir=[r for r in arch if st(r)==('irritated',) and r['raw']['duration']==60]; le=[r for r in arch if st(r)==('low_energy',)]
print(f" Amped 60 finisher {pct(sum(1 for r in am if r['finisher']),len(am))} burnout {pct(sum(1 for r in am if r['finisher'] and r['finisher']['type']=='burnout'),len(am))} top/back-off {pct(sum(1 for r in am if r['variant']=='top_backoff'),len(am))}")
print(f" Irritated 60 finisher {pct(sum(1 for r in ir if r['finisher']),len(ir))} carry anywhere {pct(sum(1 for r in ir if any('carry' in i['ex'] for i in r['items'])),len(ir))} KB swing anywhere {pct(sum(1 for r in ir if any(i['ex']=='kettlebell_swing' for i in r['items'])),len(ir))}")
print(f" Low Energy: accessory sets reduced {pct(sum(1 for r in le if any(d.get('reason_code')=='state_volume' for d in r['decisions'])),len(le))}")
# protected primary
base={(r['raw']['date'],r['raw']['archetype'],r['raw']['duration'],r['raw']['experience'],r['raw']['goal']):r for r in arch if st(r)==()}
for s in (['low_energy'],['stressed'],['bored'],['irritated'],['amped']):
    g=[r for r in arch if r['raw']['states']==s and r['archetype'] not in ('strength_core','strength_arms')]
    k=sum(1 for r in g if r['items'][0]['ex']==base[(r['raw']['date'],r['raw']['archetype'],r['raw']['duration'],r['raw']['experience'],r['raw']['goal'])]['items'][0]['ex'])
    print(f" protected primary kept under {s[0]}: {pct(k,len(g))}")
# ---- soreness + explicit target
print('\n== SORENESS + EXPLICIT TARGET')
for r in [x for x in ok if x['tag']=='sore_target']:
    p=next((p for p in r['personalization'] if p['input']=='soreness'),None)
    print(f" target {r['raw']['target']} sore {r['raw']['soreness']} -> {r['archetype']}: {[i['ex'] for i in r['items']]}\n      {p['realized'] if p else None}")
# ---- sequential
print('\n== SEQUENTIAL')
seq=[r for r in ok if r['tag']=='seq']
for u in sorted({r['seq_user'] for r in seq}):
    g=sorted([r for r in seq if r['seq_user']==u],key=lambda r:r['seq_i'])
    v=[r['variant'] for r in g]; ex=[list(r['expressions'].values())[0] if r['expressions'] else None for r in g]; m=[tuple(r['methods']) for r in g]; f=[r['finisher']['eid'] if r['finisher'] else None for r in g]
    rep=lambda L:sum(1 for i in range(1,len(L)) if L[i] and L[i]==L[i-1])
    print(f" {u}: "+' | '.join(f"{r['variant']}{'/'+ex[i] if ex[i] else ''}{'/'+','.join(r['methods']) if r['methods'] else ''}{'/fin' if r['finisher'] else ''}" for i,r in enumerate(g)))
    print(f"      back-to-back repeats: variant {rep(v)} expression {rep(ex)} method {rep([x for x in m])} finisher {rep(f)}")

# ---- STATE COHERENCE
import ast
print('\n== STATE COHERENCE (whole-session check after reconciliation; fail / judged by resolved combination)')
tot=C(); fail=C(); reasons=C(); repairs=C(); fails_list=[]
for r in ok:
    co=[d for d in r['decisions'] if d.get('reason_code')=='state_coherence']
    if not co: continue
    v=co[-1]['verdicts']; v=ast.literal_eval(v) if isinstance(v,str) else v
    key=' + '.join(r['raw']['states'])
    for s_,x in v.items():
        tot[(key,s_)]+=1
        if not x['passed']:
            fail[(key,s_)]+=1
            for f_ in x['after']: reasons[(s_,f_[:60])]+=1
            fails_list.append((key,s_,r['raw']['experience'],r['raw']['duration'],r['archetype'],x['after']))
    for rp in (ast.literal_eval(co[-1]['repairs']) if isinstance(co[-1]['repairs'],str) else co[-1]['repairs']): repairs[tuple(rp)]+=1
for k in sorted(tot): print(f"  {k[0]:28} -> {k[1]:11} {tot[k]-fail[k]:4}/{tot[k]:<4} pass ({100*(tot[k]-fail[k])/tot[k]:.0f}%)")
print(f"  overall pass {100*(sum(tot.values())-sum(fail.values()))/max(1,sum(tot.values())):.1f}%  ({sum(fail.values())} failures of {sum(tot.values())})")
print('  failure reasons:'); [print('    ',k,v) for k,v in reasons.most_common(30)]
print('  repairs applied:'); [print('    ',k,v) for k,v in repairs.most_common(30)]
print('  ALL FAILURES (combination, state, level, duration, archetype, reasons):')
for x in fails_list: print('    ',x)
# ---- LONG CORE
print('\n== CORE SESSIONS (respect requested duration)')
for dur,(lo,hi) in ((60,(50,60)),(30,(25,33))):
    g=[r for r in ok if r['archetype']=='strength_core' and r['raw']['duration']==dur]
    if not g: continue
    ests=[r['est'] for r in g]
    print(f"  {dur}-min Core n={len(g)}: est mean {S.mean(ests):.1f} min, min {min(ests):.1f}, max {max(ests):.1f}, in {lo}-{hi}: {pct(sum(1 for e in ests if lo<=e<=hi),len(g))}; exercises {S.mean(len([i for i in r['items'] if i['type']!='finisher']) for r in g):.1f}; sets {S.mean(sum(i['sets'] or 0 for i in r['items'] if i['type']!='finisher') for r in g):.1f}; expectation flag {pct(sum(1 for r in g if r.get('expectation')=='long_core_session'),len(g))}")
    cats=C(); ncat=[]
    for r in g:
        cf=next((d for d in r['decisions'] if d.get('reason_code')=='core_focus_session'),None)
        if cf:
            cs=ast.literal_eval(cf['categories']) if isinstance(cf['categories'],str) else cf['categories']; cats.update(cs); ncat.append(len(set(cs)))
    print(f"     category coverage {dict(cats)}; distinct categories/session {S.mean(ncat):.1f}")
    for lvl in ('beginner','intermediate','advanced'):
        gl=[r for r in g if r['raw']['experience']==lvl and r['raw']['states']==[]]
        if gl: print(f"     {lvl:12} est {S.mean(r['est'] for r in gl):.1f} sets {S.mean(sum(i['sets'] or 0 for i in r['items'] if i['type']!='finisher') for r in gl):.1f} RIR {dict(C(i['rir'] for r in gl for i in r['items'] if i['rir'] is not None).most_common(3))} methods {pct(sum(1 for r in gl if r['methods']),len(gl))} lead {dict(C(r['items'][0]['ex'] for r in gl).most_common(3))}")
    dup=sum(1 for r in g if len({i['ex'] for i in r['items']})!=len(r['items']))
    print(f"     duplicate exercise in a session: {dup}; state satisfaction in Core: "+str({s_:pct(sum(1 for r in g if s_ in r['raw']['states'] and any(x['reason_code']=='state_gate' and x['state']==s_ and x['satisfied'] in (True,'True') for x in r['gate'][-len(r['raw']['states']):])),sum(1 for r in g if s_ in r['raw']['states'])) for s_ in ('low_energy','stressed','bored','irritated','amped')}))
# ---- BEGINNER METHODS
print('\n== BEGINNER SET METHODS AND INTENSITY')
bg=[r for r in ok if r['raw']['experience']=='beginner']
meth=C(); att=C(); rir0=0; hf=0
for r in bg:
    for i in r['items']:
        if i.get('method'): meth[i['method']]+=1; att[(i['method'],i['ex'])]+=1
        if i['rir']==0: rir0+=1
    hf+=any(m in ('drop_set','rest_pause','cluster') for m in r['methods'])
print(f"  beginner sessions {len(bg)}: methods {dict(meth)}; RIR-0 rows {rir0}; sessions with a high-fatigue method {hf}")
print('  method attachments:',att.most_common(15))
print('  beginner finishers:',dict(C(r['finisher']['type'] for r in bg if r['finisher'])))
