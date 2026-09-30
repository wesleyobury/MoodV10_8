"""Sweat rebuild QA metrics, part 2 (gate excluding yielded States, coherence failures, brief windows, conflicts). Run after sweat_core_metrics.py with the same JSON."""
import json,collections,os,sys
rows=json.load(open(sys.argv[1])); C=collections.Counter; ok=[r for r in rows if r['status']=='ok']
print('\n--- GATE excluding States yielded by a conflict rule ---')
g=collections.defaultdict(lambda:[0,0]); y=0; ex=C()
for r in ok:
    for s,v in (r['gate'] or {}).items():
        yy=any(a['reason_code']=='state_gate_yielded' and a.get('state')==s for a in r['decisions'])
        if yy: y+=1; continue
        g[s][0]+=v; g[s][1]+=1
        if not v: ex[(s,tuple(r['raw']['states']),r['archetype'][6:],r['raw']['duration'])]+=1
print('yielded by rule',y,{s:(a,b,round(a/b,3)) for s,(a,b) in g.items()}); print('unsatisfied by combination',ex.most_common(12))
print('\n--- COHERENCE failures after repairs ---')
fail=C(); byc=C()
for r in ok:
    for s,v in (r['coherence'] or {}).items():
        if not v['passed']:
            for f in v['after']: fail[(s,f.split('(')[0][:45])]+=1
            byc[(s,tuple(r['raw']['states']),r['archetype'][6:],r['raw']['duration'],r['raw']['experience'])]+=1
print('failed verdicts',sum(byc.values())); print(fail.most_common(10)); print(byc.most_common(12))
print('\n--- DURATION vs brief windows (30 -> ~22-30, 60 -> ~45-60) ---')
for d,lo,soft in ((30,24,22),(60,48,45)):
    xs=[r['est'] for r in ok if r['raw']['duration']==d]; print(d,'n',len(xs),'below preferred band',sum(x<lo for x in xs),'below brief window',sum(x<soft for x in xs),'within brief window %',round(100*sum(soft<=x<=(31 if d==30 else 60.5) for x in xs)/len(xs),1))
print('\n--- CONFLICT envelopes ---')
print(C((r['conflict'],tuple(r['raw'].get('states',[])),r['raw'].get('archetype'),r['raw'].get('equipment'),r['raw'].get('experience'),tuple(r['raw'].get('soreness',[]))) for r in rows if r['status']!='ok'))
summary=dict(note='Full 2,012-row production-path sample is regenerated with mood_v3/qa/sweat_core_sample.py (13.7 MB, not stored in the repo). Metrics: SWEAT_REBUILD_metrics.txt', rows=len(rows), ok=len(ok), conflicts=len(rows)-len(ok),
  gate={s:[sum(r['gate'][s] for r in ok if r['gate'] and s in r['gate']), sum(1 for r in ok if r['gate'] and s in r['gate'])] for s in ('low_energy','stressed','bored','irritated','amped')},
  coherence_verdicts=[sum(v['passed'] for r in ok for v in (r['coherence'] or {}).values()), sum(len(r['coherence'] or {}) for r in ok)],
  duration={d:dict(n=len(x), median=sorted(x)[len(x)//2], min=min(x), max=max(x), under_band=sum(v<lo for v in x), under_brief_window=sum(v<soft for v in x)) for d,lo,soft in ((30,24,22),(60,48,45)) for x in [[r['est'] for r in ok if r['raw']['duration']==d]]})
json.dump(summary,open('mood_v3/qa/results/sweat_core_sample.json','w'),indent=1)
ok=[r for r in rows if r['status']=='ok' and r['archetype']=='sweat_hybrid']
print('\n--- HYBRID: primary block is the workout (completeness gate) ---')
for d in (30,60):
    h=[r for r in ok if r['raw']['duration']==d]
    def kind(t):
        if t.startswith('anchor'): return 'anchor bout +1 step'
        if 'technique' in t: return 'technique and setup'
        if t.startswith('warm-up'): return 'warm-up extended'
        if t.startswith('downshift'): return 'downshift extended'
        if t.startswith('closer'): return 'closer grown'
        return t
    fills=C(kind(a['detail']) for r in h for a in r['decisions'] if a['reason_code']=='duration_backfill' and '+1 round' not in a['detail'])
    print(d,'hybrids',len(h),'blocks',dict(C(len(r['blocks']) for r in h)),'closers',sum(any(b['structure'] in('continuous','intervals') and i>0 for i,b in enumerate(r['blocks'])) for r in h),'second circuits',sum(any(b['structure'] in ('circuit','timed_circuit','emom','ladder') and i>0 for i,b in enumerate(r['blocks'])) for r in h))
    print('   fills',fills.most_common(8))
    xs=sorted(round(r['budget']['active_min']) for r in h); print('   primary active minutes deciles',xs[::max(1,len(h)//10)])
