import json
from collections import Counter, defaultdict
from .lib2 import *
EX=load(); EL=eligibility(EX)
by=defaultdict(list)
for (i,a,s,c) in EL: by[(a,s)].append((i,c))
LV=['beginner','intermediate','advanced']
def pool(a,s,lv,pre,sore=set()):
    out=[]
    for i,c in by[(a,s)]:
        e=EX[i]
        if not avail(e,pre): continue
        if s in ('px','sx','sx2','qc') and not exposure_ok(e,lv): continue
        if s in ('support','trunk') or s.startswith('warmup'):
            if e['cx']>{'beginner':2,'intermediate':3,'advanced':5}[lv] or LV.index(e['skill'])>LV.index(lv): continue
        if c=='experience != beginner' and lv=='beginner': continue
        if c=='sore_region = lower' and not (sore & LOWER): continue
        if (set(e['prim'])|{roll(m) for m in e['prim']}) & sore: continue
        out.append(i)
    return out
if __name__=='__main__':
    W=work_ids(EX)
    print('classification',Counter(v for v,_ in CLASS.values()),'R2 new work',sum(1 for a in R2 if a[24]),'R2 warm-up only',sum(1 for a in R2 if not a[24]))
    print('work records',len(W),Counter(family(EX[i]) for i in W),Counter(quality(EX[i]) for i in W))
    d={}
    for a in ARCH:
        print('\n==',a)
        for s in ['px','sx','sx2','qc']:
            row=[]
            for pre in PRESETS:
                v=[len(pool(a,s,lv,pre)) for lv in LV]; d[f'{a}|{s}|{pre}']=v; row.append(f"{pre[:12]} {'/'.join(map(str,v))}")
            print(f'  {s:4}','  '.join(row))
    json.dump(d,open('density2.json','w'))
    print('\nWARM-UP components (commercial default, B/I/A)')
    wu={}
    for a in ARCH:
        for comp in WU:
            v=[len(pool(a,'warmup.'+comp,lv,'athletic_commercial_default')) for lv in LV]; vf=[len(pool(a,'warmup.'+comp,lv,'commercial_floor_only')) for lv in LV]
            if any(v) or comp=='rehearsal': wu[f'{a}|{comp}']=dict(default=v,floor=vf)
            if any(v): print(' ',a[9:],comp,v,'floor',vf)
    json.dump(wu,open('warmup2.json','w'))
