import * as M from '../../../utils/v3HomeModel'; import * as F from '../../../utils/v3OverviewFormat'; import * as A from '../../../utils/v3Api'; import * as T from '../../../utils/v3Today'; import * as P from '../../../utils/v3Profile';
const api:any = require('./stubs/api.js');
const PACK:any[] = require('../../../utils/dev/v3PackFixture.json');
let fails=0, checks=0; const ok=(c:any,m:string)=>{checks++; if(!c){fails++;console.log('FAIL',m)}};
(async()=>{
// ---- profile/defaults
ok(P.defaultDirectionFor({training_preference:'lifting'})==='strength','lifting');
ok(P.defaultDirectionFor({training_preference:'conditioning'})==='sweat','conditioning');
ok(P.defaultDirectionFor({training_preference:'athletic'})==='athletic','athletic');
ok(P.defaultDirectionFor({training_preference:'mix',goal:'lose_weight_conditioning'})==='sweat','mix->goal sweat');
ok(P.defaultDirectionFor({training_preference:'mix',goal:'improve_athleticism'})==='athletic','mix->goal athletic');
ok(P.defaultDirectionFor({training_preference:'mix',goal:'build_muscle'})==='strength','mix->strength');
ok(P.PREFERENCE_OPTIONS.map(o=>o.label).join('|')==='Strength|Sweat|Athletic|Mix It Up','onboarding labels');
ok(P.PREFERENCE_OPTIONS.map(o=>o.id).join('|')==='lifting|conditioning|athletic|mix','ids unchanged');
const i0=M.initialInputs('strength'); ok(i0.duration===60 && i0.states.length===0 && i0.target===null,'defaults 60 / no state / pick');
// barrier prefills via handoff
for (const [b,exp] of [['low_energy',['low_energy']],['boredom',['bored']],['time',[]],['motivation',[]],['dont_know',[]]] as const){
  await P.writeFirstHomeHandoff('u1',{training_preference:'mix',goal:'stay_consistent',experience:'beginner',training_frequency:'3-4',biggest_barrier:b as any},'new','strength');
  const h=await P.readFirstHomeHandoff('u1'); const inp=M.initialInputs(h!.default_direction as any,{states:(h!.prefill?.states??[]) as any});
  ok(JSON.stringify(inp.states)===JSON.stringify(exp),'prefill '+b); ok(inp.duration===60,'60 stays '+b);
  ok(!!M.BARRIER_BANNER[h!.prefill!.copy_key],'banner '+b);
  if(b==='time') ok(h!.prefill!.suggest_duration===30,'time suggests 30');
  if(b==='motivation'||b==='dont_know') ok(h!.prefill!.emphasize_moods_pick,'pick emphasis');
}
await P.consumeFirstHomeHandoff('u1'); ok(!(await P.readFirstHomeHandoff('u1'))!.pending,'handoff consumed');
// ---- states
let s=M.initialInputs('strength'); const date='2026-10-05';
ok(JSON.stringify(M.buildRequest(s,date).states)==='[]','zero states');
for(const st of M.STATES){ const r=M.toggleState(s,st.id); ok(r.inputs.states.length===1 && !r.limitHit,'single '+st.id); }
let r=M.toggleState(s,'amped'); r=M.toggleState(r.inputs,'bored'); r=M.toggleState(r.inputs,'stressed'); ok(r.inputs.states.length===3,'3 states');
const r4=M.toggleState(r.inputs,'irritated'); ok(r4.limitHit && r4.inputs.states.length===3,'fourth blocked');
const off=M.toggleState(r.inputs,'bored'); ok(off.inputs.states.length===2,'deselect');
let so=M.toggleState(s,'sore').inputs; ok(M.buildBlocker(so)==='sore_needs_area','sore needs area');
so=M.toggleSoreRegion(so,'legs'); so=M.toggleSoreRegion(so,'upper_back'); ok(M.buildBlocker(so)===null,'sore ok');
let req=M.buildRequest(so,date); ok(req.states.includes('sore') && JSON.stringify(req.soreness)==='["legs","upper_back"]','sore request');
const cleared=M.toggleState(so,'sore').inputs; ok(cleared.soreness.length===0 && M.buildRequest(cleared,date).soreness.length===0,'remove sore clears areas');
// Approved body-map pass: the eleven precise areas (head to toe), then the legacy broad regions still accepted from earlier builds.
ok(M.SORE_REGIONS.map(x=>x.id).join()==='shoulders,chest,biceps,triceps,upper_back,core,lower_back,glutes,quads,hamstrings,calves,legs,back,arms','sore vocab');
// sore + 2 others = 3 max
let s3=M.toggleState(M.toggleState(so,'amped').inputs,'bored').inputs; ok(M.toggleState(s3,'stressed').limitHit,'sore counts toward 3');
// ---- direction / target
let t=M.toggleTarget(M.initialInputs('strength'),'chest').inputs; t=M.toggleTarget(t,'arms').inputs;
ok(JSON.stringify(M.buildRequest(t,date).target)==='["chest","biceps","triceps"]','strength target chest+arms'); ok(M.targetLabel(t.target)==='Chest + Arms','label');
ok(M.toggleTarget(t,'quads').limitHit,'4th muscle blocked');
ok(M.isTargetSelected(t,'arms') && !M.isTargetSelected(t,'back'),'selected');
let fb=M.toggleTarget(t,'full_body').inputs; ok(M.buildRequest(fb,date).target==='full_body' && !M.isTargetSelected(fb,'chest'),'full body exclusive');
let sw=M.setDirection(t,'sweat'); ok(JSON.stringify(M.buildRequest(sw,date).target)==='["chest","biceps","triceps"]' && sw.direction==='sweat','sweat keeps target');
let sq=M.toggleTarget(M.toggleTarget(M.initialInputs('sweat'),'quads').inputs,'glutes').inputs; ok(JSON.stringify(M.buildRequest(sq,date).target)==='["quads","glutes"]','sweat target (W4)');
let at=M.setDirection(t,'athletic'); ok(at.target===null && !('target' in M.buildRequest(at,date)),'athletic clears target');
ok(M.toggleTarget(at,'chest').inputs.target===null && !M.targetSupported('athletic'),'athletic target no-op');
const allowed=new Set(['chest','back','shoulders','biceps','triceps','forearms','quads','hamstrings','glutes','calves','hip_adductors','hip_abductors','core']);
ok(M.TARGETS.every(x=>x.muscles==='full_body'||x.muscles.every(m=>allowed.has(m))),'target vocab ⊂ USER_FACING_TARGETS');
// ---- duration
ok(M.buildRequest(M.setDuration(s,30),date).duration===30 && M.buildRequest(s,date).duration===60,'duration');
// ---- request shape
req=M.buildRequest(s,date); ok(JSON.stringify(Object.keys(req).sort())===JSON.stringify(['date','direction','duration','persist','soreness','states']),'minimal request keys '+Object.keys(req));
ok(req.persist===true && !('goal' in req) && !('experience' in req) && !('equipment' in req),'no profile/V2 fields');
ok(A.localDateISO(new Date(2026,0,5,23,30))==='2026-01-05','local date');
ok(M.requestSignature(M.buildRequest(s,date))===M.requestSignature(M.buildRequest(M.initialInputs('strength'),date)),'same sig');
ok(M.requestSignature(M.buildRequest(s,date))!==M.requestSignature(M.buildRequest(s,'2026-10-06')),'sig by date');
ok(M.summaryLine(s)==="Strength · MOOD's Pick · 60 min",'summary');
// ---- conflicts (from fixture)
const conf=PACK.find(p=>p.key==='conflict').envelope.conflict; const stc=PACK.find(p=>p.key==='sore_target_conflict').envelope.conflict;
let base={...M.initialInputs('athletic'),states:['sore'] as any,soreness:['legs'] as any,equipment:'minimal' as any};
for(const o of conf.options){ const x=M.applyConflictOption(base,o); ok(x.effect==='regenerate','regen '+o.label);
  if(o.action==='switch_direction') ok(x.inputs.direction===o.patch.direction && x.inputs.target===null,'switch '+o.label);
  if(o.action==='change_equipment') ok(x.inputs.equipment==='commercial_gym' && M.buildRequest(x.inputs,date).equipment==='commercial_gym','equip patch'); }
let base2={...M.initialInputs('strength'),target:'full_body' as any,states:['sore'] as any,soreness:['legs','back','chest'] as any};
const eff=stc.options.map((o:any)=>M.applyConflictOption(base2,o));
ok(eff[0].effect==='open_target_picker','change target opens picker'); ok(eff[1].effect==='regenerate' && eff[1].inputs.target===null,'moods pick');
ok(eff[2].inputs.direction==='sweat' && eff[3].inputs.direction==='athletic' && eff[3].inputs.target===null,'try sweat/athletic'); ok(eff[4].effect==='close','cancel closes');
// ---- overview over every fixture
const seen={strength:0,sweat:0,athletic:0} as any; const structures=new Set<string>(); let qs=0, prog=0, rer=0, relax=0;
for(const p of PACK){ const env=p.envelope; if(!env.workout){ ok(env.status==='conflict' && env.conflict.options.length>0,'conflict '+p.key); continue; }
  const w=env.workout; seen[w.direction]++; if(env.outcome==='valid_with_relaxation') relax++;
  const {title,subtitle}=F.workoutTitle(w); ok(title && title===w.archetype.name,'title '+p.key);
  if(w.target.mode==='explicit') ok(!!subtitle,'target subtitle '+p.key);
  ok(w.built_for_today.length>0 || p.envelope.engine?.phase==='2.6','bft '+p.key); // Phase 2.6: zero lines is valid when nothing adapted
  const n=F.rerouteNotice(w,env.outcome); if(env.outcome==='rerouted'){ rer++; ok(!!n && /moved/.test(n),'reroute text '+p.key);} else ok(n===null,'no reroute '+p.key);
  const strs:string[]=[w.duration.display];
  for(const b of w.blocks){ structures.add(w.direction+':'+b.structure); strs.push(...F.blockMeta(b,w.direction));
    for(const it of b.items){ ok(typeof it.prescription.display==='string' && it.prescription.display.length>0,'display '+p.key);
      const rest=F.itemRest(it,b); if(rest) strs.push(rest); const ar=F.anchorRoundsLabel(it,b); if(ar) strs.push(ar);
      if(b.structure==='anchor_circuit') ok(!!ar,'anchor label');
      if(w.direction==='athletic' && b.type!=='support' && b.type!=='repeats') { ok(!!it.quality_stop,'quality stop '+p.key+' '+it.item_id); }
      if(it.quality_stop) qs++; if(F.progressionText(it)) prog++;
      ok(F.thumbnailUrl(it)===null ? F.initials(it.exercise.name).length>=1 : /^https?:\/\//.test(F.thumbnailUrl(it)!),'media or fallback'); } }
  ok(strs.every(x=>!/undefined|NaN|null/.test(x)),'clean labels '+p.key+' '+strs.join('|'));
}
ok(seen.strength>=7 && seen.sweat>=5 && seen.athletic>=6,'all directions '+JSON.stringify(seen));
for(const k of ['sweat:emom','sweat:continuous','sweat:anchor_circuit','sweat:timed_circuit','sweat:finisher','athletic:exposure','athletic:repeats','strength:superset','strength:pyramid']) ok(structures.has(k),'structure '+k);
ok(qs>=15 && prog>=1 && rer>=2 && relax>=1,`qs ${qs} prog ${prog} rer ${rer} relax ${relax}`);
const W1=PACK.find(p=>p.key==='W1').envelope.workout; console.log('W1 meta', F.blockMeta(W1.blocks[0],'sweat'), F.blockMeta(W1.blocks[1],'sweat'));
const W3=PACK.find(p=>p.key==='W3').envelope.workout; console.log('W3 meta', W3.blocks.map((b:any)=>F.blockMeta(b,'sweat')));
const S2=PACK.find(p=>p.key==='S2').envelope.workout; console.log('S2 meta', S2.blocks.map((b:any)=>F.blockMeta(b,'strength')), F.itemRest(S2.blocks[0].items[0],S2.blocks[0]));
const A1=PACK.find(p=>p.key==='A1').envelope.workout; console.log('A1 meta', A1.blocks.map((b:any)=>F.blockMeta(b,'athletic')), A1.blocks.map((b:any)=>F.itemRest(b.items[0],b)));
// ---- api client
api.setNext({ok:true,status:200,data:PACK[0].envelope,error:null}); let res:any=await A.generateV3Workout('tok',M.buildRequest(s,date));
ok(res.ok && res.envelope.workout.direction==='strength','api ok'); const call=api.calls.at(-1); ok(call.path==='/api/v3/workouts/generate' && call.opts.method==='POST' && call.opts.headers.Authorization==='Bearer tok' && call.opts.timeoutMs===30000,'api call');
ok(JSON.parse(call.opts.body).persist===true,'body');
api.setNext({ok:true,status:200,data:PACK.find(p=>p.key==='conflict').envelope,error:null}); res=await A.generateV3Workout('tok',req); ok(res.ok && res.envelope.status==='conflict','conflict passes through');
api.setNext({ok:false,status:0,data:null,error:'x',isNetworkError:true}); res=await A.generateV3Workout('tok',req); ok(!res.ok && res.error.kind==='network','network');
api.setNext({ok:false,status:422,data:null,error:{field:'target',message:'bad target'}}); res=await A.generateV3Workout('tok',req); ok(!res.ok && res.error.kind==='invalid' && res.error.field==='target','422');
api.setNext({ok:false,status:409,data:null,error:{code:'workout_outdated',message:'old'}}); res=await A.swapV3Exercise('tok','w1','i1'); ok(!res.ok && res.error.kind==='outdated','409 outdated');
ok(api.calls.at(-1).path==='/api/v3/workouts/w1/swap-exercise' && JSON.parse(api.calls.at(-1).opts.body).item_id==='i1','swap body');
api.setNext({ok:false,status:409,data:null,error:'Workout already completed'}); res=await A.swapV3Workout('tok','w1'); ok(!res.ok && res.error.kind==='completed' && api.calls.at(-1).path.endsWith('/swap-workout'),'swap workout 409');
// ---- today store
await T.writeLastDirection('u2','sweat'); ok(await T.readLastDirection('u2')==='sweat','last dir'); ok(await T.readLastDirection('u3')===null,'per user');
const e={date,workout_id:'w1',signature:'sig',request:req,envelope:PACK[0].envelope,saved_at:''};
await T.writeToday('u2',e as any); ok((await T.readToday('u2',date))?.workout_id==='w1','today'); ok(await T.readToday('u2','2026-10-06')===null,'new day resets');
const env2=JSON.parse(JSON.stringify(PACK[0].envelope)); env2.workout.workout_id='w1'; env2.workout.version=2; await T.updateTodayEnvelope('u2',env2); ok((await T.readCachedEnvelope('u2','w1'))?.workout?.version===2,'cache update');
console.log(`checks ${checks} failures ${fails}`);
})();
