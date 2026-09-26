import * as M from '../../../utils/v3HomeModel'; import * as V from '../../../utils/v3PreviewFormat';
const PACK:any[] = require('../../../utils/dev/v3PackFixture.json');
let fails=0, checks=0; const ok=(c:any,m:string)=>{checks++; if(!c){fails++;console.log('FAIL',m)}};
const pk=(k:string)=>PACK.find(p=>p.key===k).envelope.workout;
// ---- registry (unchanged from 2.5)
ok(M.ARCHETYPES.strength.map(a=>a.name).join('|')==='Upper Push|Upper Pull|Upper Body|Lower Body: Squat|Lower Body: Hinge|Glutes + Legs|Full Body|Arms','strength registry');
ok(M.ARCHETYPES.sweat.map(a=>a.id).join('|')==='sweat_circuit|sweat_engine|sweat_hybrid','sweat registry');
ok(M.ARCHETYPES.athletic.map(a=>a.id).join('|')==='athletic_power|athletic_speed_agility|athletic_full_body','athletic registry');
// ---- Home compact configuration
let s=M.initialInputs('strength'); ok(M.configSummary(s)==="MOOD's Pick · 60 min",'default summary');
ok(M.summaryLine(s)==="Strength · MOOD's Pick · 60 min",'default build line');
s=M.toggleTarget(s,'chest').inputs; ok(M.configSummary(s)==='Chest · 60 min','chest summary');
const rc=M.buildRequest(s,'d'); ok(rc.direction==='strength' && JSON.stringify(rc.target)==='["chest"]' && rc.archetype===undefined,'chest request: target only, no archetype');
s=M.setArchetype(s,'strength_lower_squat'); s=M.setDuration(s,30); ok(M.configSummary(s)==='Lower Body: Squat · 30 min' && s.target===null,'type clears focus');
ok(M.buildRequest(s,'d').target===undefined && M.buildRequest(s,'d').archetype==='strength_lower_squat','type request');
s=M.toggleTarget(s,'back').inputs; s=M.toggleTarget(s,'core').inputs; ok(s.archetype===null && M.configSummary(s)==='Back + Core · 30 min','focus resets type');
let a=M.toggleState(M.initialInputs('strength'),'amped').inputs; a=M.toggleTarget(a,'chest').inputs; ok(M.summaryLine(a)==='Strength · Amped · Chest · 60 min','build line with state');
let so=M.toggleState(M.initialInputs('strength'),'sore').inputs; so=M.toggleSoreRegion(so,'legs'); ok(M.summaryLine(so)==="Strength · Sore legs · MOOD's Pick · 60 min",'build line sore '+M.summaryLine(so));
// direction change never carries an old type/target into a new request
let d=M.setArchetype(M.initialInputs('strength'),'strength_arms'); d=M.setDirection(d,'sweat'); ok(d.archetype===null && M.buildRequest(d,'x').archetype===undefined,'direction clears type');
let d2=M.toggleTarget(M.initialInputs('strength'),'chest').inputs; d2=M.setDirection(d2,'athletic'); ok(M.buildRequest(d2,'x').target===undefined,'athletic never sends target');
ok(!M.targetSupported('athletic') && M.targetSupported('sweat'),'focus availability');
// ---- Preview structure
const labels=(k:string)=>V.previewSections(pk(k)).map(x=>x.label);
ok(JSON.stringify(labels('S2'))===JSON.stringify(['STRAIGHT SETS','SUPERSET · 2 rounds','STRAIGHT SETS','FINISHER · 2 rounds']),'S2 labels '+labels('S2'));
const s2=V.previewSections(pk('S2')); ok(s2[0].rows.map(r=>r.tag).join()==='1,2,3' && s2[2].rows[0].tag==='4','straight numbering continues');
ok(s2[1].rows.map(r=>r.tag).join()==='A1,A2' && s2[1].rows[0].detail==='12 reps','superset A1/A2 per-round reps '+s2[1].rows[0].detail);
const w1=V.previewSections(pk('W1')); ok(w1[0].label==='EMOM · 20 min' && w1[0].rows[0].detail==='8','emom');
const hy=V.previewSections(pk('p25_hybrid_60')); ok(hy.length===1 && /^HYBRID · \d rounds$/.test(hy[0].label),'hybrid one section '+hy.map(x=>x.label));
ok(hy[0].rows[0].tag==='ANCHOR' && hy[0].rows[0].note==='Every round' && /^R\d/.test(hy[0].rows[1].tag||''),'hybrid anchor + R tags '+hy[0].rows.map(r=>r.tag));
const hy30=V.previewSections(pk('p25_hybrid_30')); ok(hy30[0].rows.slice(1).every(r=>r.tag===null) && /every station/.test(hy30[0].caption||''),'hybrid 30 every station');
const hi=V.previewSections(pk('p26_hybrid_irritated')); ok(hi.map(x=>x.label.split(' ·')[0]).join('|')==='HYBRID|FINISHER','irritated hybrid = hybrid + finisher '+hi.map(x=>x.label));
const at=V.previewSections(pk('A1')); ok(at.map(x=>x.label).join('|')==='PRIMARY|SECONDARY|REPEAT EFFORTS · 8 rounds|SUPPORT','athletic labels '+at.map(x=>x.label));
ok(!!at[0].rows[0].note && at[1].rows.every(r=>r.note===null) && !!at[2].rows[0].note,'athletic cues on primary + repeats only');
ok(V.essentialCue('Full walk-back between reps. Stop the drill if a rep feels clearly slower than the first.')==='Stop the drill if a rep feels clearly slower than the first.','cue stop rule');
for (const p of PACK){ const w=p.envelope.workout; if(!w) continue; const secs=V.previewSections(w);
  const ids=secs.flatMap(x=>x.rows.map(r=>r.itemId)); const all=w.blocks.flatMap((b:any)=>b.items.map((i:any)=>i.item_id));
  ok(ids.length===all.length && new Set(ids).size===all.length,'all items once '+p.key); ok(secs.every(x=>x.rows.length>0 && x.label),'no empty '+p.key);
  ok(!secs.some(x=>/undefined|null|NaN/.test(x.label+(x.caption||'')+x.rows.map(r=>r.detail+(r.note||'')+(r.tag||'')).join())),'no junk '+p.key);
  ok(V.previewMeta(w).startsWith('~') && V.previewTitle(w).length>0,'meta/title '+p.key); }
// ---- title / meta
ok(V.previewTitle(pk('p25_ct_chest'))==='Chest','title chest'); ok(V.previewTitle(pk('p25_ct_back_core'))==='Back + Core','title back+core');
ok(V.previewTitle(pk('p25_hybrid_60'))==='Hybrid' && V.previewTitle(pk('p25_explicit_diff'))==='Lower Body: Squat','title type');
ok(/^~\d+ min · \d+ exercises$/.test(V.previewMeta(pk('p25_ct_chest'))),'meta format');
// ---- teaser only when meaningful (API)
ok(pk('p25_hybrid_60').today.teaser===null && pk('p25_ct_chest').today.teaser===null,'no teaser for confirmations');
ok(pk('p26_amped').today.teaser.title==='Built for your Amped state','amped teaser');
ok(pk('p25_ct_back_core').today.teaser.text.includes('Core saved for the end'),'allocation teaser');
ok(pk('p26_sore_legs').today.teaser.title==='Built around sore legs','sore teaser');
for (const p of PACK.filter(p=>p.key.startsWith('p2'))){ const w=p.envelope.workout; ok(!w.built_for_today.some((l:any)=>/^(You picked|You chose|Your first )/.test(l.text)),'no confirmation lines '+p.key); ok(w.built_for_today.length<=4,'<=4 lines '+p.key); ok(p.envelope.engine && p.envelope.engine.phase==='2.6','engine stamped '+p.key); }
// ---- Different Workout comparison + copy
const c1=pk('p25_ct_chest'), c2=pk('p25_ct_chest_diff'); const dd=V.workoutDiff(c1,c2);
ok(!dd.identical && !dd.archetypeChanged && dd.changed>=3,'chest diff '+JSON.stringify(dd));
ok(V.differentWorkoutMessage(c1,c2)===`New Chest workout · ${dd.changed} of ${dd.total} exercises changed`,'chest message');
const m1=JSON.parse(JSON.stringify(c1)); m1.archetype={id:'strength_upper_pull',name:'Upper Pull'};
ok(V.differentWorkoutMessage(m1,pk('p25_moods_pick_diff'))==='New workout · Lower Body: Squat','rotation message');
ok(V.workoutDiff(c1,c1).identical,'identical detected');
// ---- no em dashes in new/changed copy files
const fs=require('fs'); for (const f of ['v3PreviewFormat.ts']) ok(!fs.readFileSync(require('path').join(__dirname,'../../../../utils',f),'utf8').includes('—'),'no em dash '+f);
console.log(`checks ${checks} failures ${fails}`);
