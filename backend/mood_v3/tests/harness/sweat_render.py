from mood_v3.engines.sweat.sweat_gen import *
NAMES={'sweat_engine':'Engine','sweat_circuit':'Circuit','sweat_hybrid':'Hybrid'}
TALK={5:'full sentences',6:'full sentences',7:'short phrases',8:'a few words',9:'no talking'}
def rpe_txt(r): return f"RPE {r[0]}" if r[0]==r[1] else f"RPE {r[0]}-{r[1]}"
def render(w,title=''):
    ctx=w['_ctx']; exp=ctx['experience']; L=[]
    st=', '.join(ctx['states']) or 'Normal'
    tgt='MOOD\'s Pick' if ctx['target_mode']=='pick' else ('Full body' if ctx['target_mode']=='full_body' else 'Explicit: '+', '.join(ctx['target']))
    L.append(f"{title}{NAMES.get(w['archetype_id'],w['archetype_id'])} · {w['duration']} min · {exp} · {st} · {tgt} · {w['preset']}")
    if ctx.get('sore'): L.append('Sore: '+', '.join(ctx['sore']))
    L.append(f"Outcome: {w['outcome']}")
    if not w['blocks']:
        for a in w['adjustments']: L.append(f"  log {a['reason_code']}: {a.get('detail','')}")
        return '\n'.join(L)
    d=w['dials']; L.append(f"Resolved: cap {d['cap']} · V {d['V']:+d} E {d['E']:+d} Nov {d['NE']:+d}/{d['NS']:+d} Eng {d['G']:+d} Extras {d['X']}"+(f" · pair {'+'.join(d['pair'])}" if d['pair'] else '')+(f" · engine_mode {w['engine_mode']} ({w['engine_format']})" if w.get('engine_mode') else ''))
    L.append(f"1  WARM-UP (computed) {w['warm_up_min']}:00")
    for n,b in enumerate(w['blocks'],2):
        s=b['structure']; mins=block_minutes(b,exp)
        head={'primary_engine_block':'PRIMARY ENGINE','primary_circuit':'PRIMARY CIRCUIT','primary_hybrid_block':'PRIMARY HYBRID','complementary_block':'COMPLEMENTARY','optional_extra':'FINISHER'}[b['slot']]
        lab=s
        if s=='circuit' and b.get('anchor'): lab=f"anchor circuit, {len(b['round_stations'])} rounds, {fmt_t(b['round_rest'])} walk between"
        elif s=='circuit': lab=f"circuit, {b['rounds']} rounds, {fmt_t(b['round_rest'])} between rounds"
        elif s=='intervals' and b['interval_target'].get('rotate'): it=b['interval_target']; lab=f"intervals (timed rotation) {it['work']}/{it['recovery']}, {it['rounds']} rounds, {fmt_t(it['round_rest'])} between rounds"
        elif s=='intervals': it=b['interval_target']; lab=f"intervals {it['rounds']} x {fmt_t(it['work'])} / {fmt_t(it['recovery'])} easy"
        elif s=='emom': lab=f"EMOM {b['minutes']} min ({len(b['items_e'])} stations x {b['rounds']})"
        elif s=='ladder': lab='ladder '+'-'.join(map(str,b['ladder']))+' (self-paced)'
        elif s=='pyramid': lab='pyramid '+'-'.join(fmt_t(x) for x in b['interval_target']['steps'])+f" with {fmt_t(b['interval_target']['recovery'])} easy between"
        elif s=='continuous': lab=f"continuous {fmt_t(b['duration_s'])}"
        elif s=='finisher': it=b['interval_target']; lab=f"finisher {it['rounds']} x {it['work']}s all-out / {it['recovery']}s easy"
        L.append(f"{n}  {head} · {lab}   [{rpe_txt(b['rpe'])}, {TALK[b['rpe'][1]]}]  ~{mins:.1f} min")
        if s=='circuit' and b.get('anchor'):
            L.append(f"   Every round: {b['anchor']['name']} {dose_txt(b['anchor'],b['anchor_dose'])} · race pace {rpe_txt(b['rpe'])}")
            if b.get('rotating'):
                for r,stn in enumerate(b['round_stations'],1): L.append(f"     R{r} {stn[0][0]['name']} {dose_txt(*stn[0])} · {cue_for(stn[0][0],'hyb',b['rpe'][1])}")
            else:
                for e,dz in b['stations']: L.append(f"     {e['name']} {dose_txt(e,dz)} · {cue_for(e,'hyb',b['rpe'][1])}")
        elif s in ('circuit','emom'):
            for i,(e,dz) in enumerate(zip(b['items_e'],b['doses'])):
                pre=f"Min {i+1}" if s=='emom' else f"{chr(65+n-2)}{i+1}"
                L.append(f"   {pre} {e['name']} {dose_txt(e,dz)} · {cue_for(e,s,b['rpe'][1])}")
            if s=='emom': L.append(f"   Expected work per minute <= 40 s ({', '.join(str(int(est(e,dz,exp)))+'s' for e,dz in zip(b['items_e'],b['doses']))}); rest the remainder")
        elif s=='intervals' and b['interval_target'].get('rotate'):
            for i,e in enumerate(b['items_e'],1): L.append(f"   {i} {e['name']} · {cue_for(e,s,b['rpe'][1])}")
        elif s=='ladder':
            L.append('   '+' + '.join(e['name'] for e in b['items_e']))
        elif s=='finisher':
            L.append('   '+(' / '.join(e['name'] for e in b['items_e']))+(' (alternate)' if len(b['items_e'])>1 else ''))
        else:
            e=b['items_e'][0]; cue=''
            if s=='continuous' and b.get('engine_format')=='tempo': cue=' · build thirds: RPE 5, 6, 7, no recovery'
            elif s=='continuous': cue=' · one steady rhythm, no programmed recovery'
            L.append(f"   {e['name']}{cue}")
    L.append(f"{len(w['blocks'])+2}  DOWNSHIFT (computed) {w['downshift_min']}:00")
    from mood_v3.engines.sweat.sweat_gen import duty_cycle
    L.append(f"Progression: {w['blocks'][0].get('progression_basis','')}; resistance loads reused, not progressed · primary duty cycle {duty_cycle(w['blocks'][0],exp):.2f}")
    L.append(f"Est. ~{w['est_minutes']:.0f} min · conditioning time {w['conditioning_minutes']:.1f} min")
    keep=('engine_mode_selected','target_routed_circuit','sore_exclusion','sore_override_by_explicit_target','sore_reroute','region_balance_relaxed_sore','region_balance_relaxed_equipment',
          'archetype_skipped_equipment','conditioning_driver_resistance_only','stressed_resistance_only_couplet','complexity_relaxed_state_cap','target_coverage_swap','duty_cycle_adjusted','duration_backfill','duration_trim','state_volume','extra_finisher','stacking_cap','relaxation_a','swap_archetype_advance','complement_unavailable')
    for a in w['adjustments']:
        if a['reason_code'] in keep: L.append(f"  log {a['reason_code']}: {a.get('detail', a.get('mode',''))}"+(f" ({a['format']}, {a['why']})" if a['reason_code']=='engine_mode_selected' else ''))
    return '\n'.join(L)
