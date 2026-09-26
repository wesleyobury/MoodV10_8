import json, time
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('BASE','http://localhost:8765/'); SH=os.environ.get('SHOTS','/tmp/v3_e2e_shots/'); os.makedirs(SH, exist_ok=True)
R={}; reqs=[]
def tid(page,t): return page.locator(f'[data-testid="{t}"]:visible')
def txt(page,t): return tid(page,t).inner_text()
def names(page): return [x for x in tid(page,'v3-preview-sections').inner_text().split('\n')]
def home(page):
    while page.evaluate('window.__stack.length')>1: page.evaluate('window.__router.back()')
    tid(page,'v3-home').wait_for(); time.sleep(0.3)
def build(page):
    tid(page,'v3-build').click(); tid(page,'v3-preview-title').wait_for(timeout=30000); time.sleep(0.6)
def last_gen():
    g=[r for r in reqs if r['url'].endswith('/generate')]; return g[-1]['body'] if g else None
def diff(page, shot=None):
    before=names(page); scroll_down(page)
    tid(page,'v3-swap-workout').click()
    # while building: the current workout must stay on screen
    time.sleep(0.05); during=tid(page,'v3-preview-sections').count()
    t0=time.time()
    while time.time()-t0<20:
        time.sleep(0.2)
        if 'Building' not in txt(page,'v3-swap-workout'): break
    time.sleep(0.4)
    after=names(page); toast=tid(page,'v3-preview-toast').inner_text() if tid(page,'v3-preview-toast').count() else None
    if shot: page.screenshot(path=SH+shot, full_page=True)
    return dict(visible_while_building=during==1, changed=before!=after, toast=toast, title=txt(page,'v3-preview-title'), scroll=scroll_pos(page))
def scroll_pos(page): return page.evaluate("""()=>Math.max(0,...[...document.querySelectorAll('div')].filter(d=>d.offsetParent!==null&&d.scrollHeight>d.clientHeight+20&&getComputedStyle(d).overflowY!='visible').map(e=>e.scrollTop))""")
def scroll_down(page): page.evaluate("""()=>{[...document.querySelectorAll('div')].filter(d=>d.offsetParent!==null&&d.scrollHeight>d.clientHeight+20&&getComputedStyle(d).overflowY!='visible').forEach(e=>e.scrollTop=500)}""")
def config(page, focus=(), typ=None, length=None):
    tid(page,'v3-config').click(); tid(page,'v3-config-sheet').wait_for(); time.sleep(0.3)
    for f in focus: tid(page,f'v3-focus-{f}').click(); time.sleep(0.1)
    if typ: tid(page,f'v3-type-{typ}').click(); time.sleep(0.1)
    if length: tid(page,f'v3-length-{length}').click()
    note=tid(page,'v3-config-note').inner_text() if tid(page,'v3-config-note').count() else None
    shot=page.screenshot(path=SH+f"sheet_{'_'.join(focus) or typ or 'x'}.png")
    tid(page,'v3-config-done').click(); time.sleep(0.3); return note
with sync_playwright() as p:
    b=p.chromium.launch(); ctx=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2)
    page=ctx.new_page(); errs=[]
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
    page.on('request', lambda r: reqs.append(dict(url=r.url, body=(json.loads(r.post_data) if r.post_data else None))) if '/api/v3' in r.url else None)
    page.goto(BASE); page.evaluate("localStorage.clear()"); page.reload(); tid(page,'v3-home').wait_for(); time.sleep(0.8)
    page.screenshot(path=SH+'A1_home_default.png', full_page=True)
    R['home_default']=dict(config=txt(page,'v3-config-summary'), stale_banner=tid(page,'v3-dev-stale-backend').count())
    # Flow A
    build(page); page.screenshot(path=SH+'A2_preview.png', full_page=True)
    A=dict(request=last_gen(), title=txt(page,'v3-preview-title'), meta=txt(page,'v3-preview-meta'), teaser=tid(page,'v3-preview-teaser').count())
    A['diff']=diff(page,'A3_after_diff.png')
    tid(page,'v3-start-workout').click(); tid(page,'v3-session-placeholder').wait_for(); A['start']=True; R['A']=A
    # Flow B: Amped
    home(page); tid(page,'v3-state-amped').click(); build(page); page.screenshot(path=SH+'B_preview_amped.png', full_page=True)
    R['B']=dict(request=last_gen(), teaser=txt(page,'v3-preview-teaser') if tid(page,'v3-preview-teaser').count() else None, title=txt(page,'v3-preview-title'))
    home(page); tid(page,'v3-state-amped').click()
    # Flow C: Chest
    home(page); note=config(page, focus=['chest'], length=60); R['C_config']=dict(summary=txt(page,'v3-config-summary'), note=note)
    page.screenshot(path=SH+'C1_home_chest.png', full_page=True)
    build(page); page.screenshot(path=SH+'C2_preview_chest.png', full_page=True)
    C=dict(request=last_gen(), title=txt(page,'v3-preview-title'), rows=names(page)[:12])
    C['diff1']=diff(page,'C3_chest_diff.png'); C['diff2']=diff(page); R['C']=C
    # Flow D: Back + Core (change chest -> back+core)
    home(page); note=config(page, focus=['chest','back','core']); build(page); page.screenshot(path=SH+'D_preview_back_core.png', full_page=True)
    D=dict(request=last_gen(), title=txt(page,'v3-preview-title'), teaser=txt(page,'v3-preview-teaser') if tid(page,'v3-preview-teaser').count() else None, rows=names(page))
    D['diff']=diff(page); R['D']=D
    # Flow E: explicit Lower Squat (type clears focus)
    home(page); note=config(page, typ='strength_lower_squat'); R['E_config']=dict(summary=txt(page,'v3-config-summary'), note=note)
    build(page); E=dict(request=last_gen(), title=txt(page,'v3-preview-title'), rows=names(page)[:12]); E['diff']=diff(page,'E_after_diff.png'); R['E']=E
    # Flow F: Sweat MOOD's Pick
    home(page); tid(page,'v3-direction-sweat').click(); time.sleep(0.2); R['F_config']=txt(page,'v3-config-summary')
    build(page); F=dict(request=last_gen(), title=txt(page,'v3-preview-title')); F['diff']=diff(page,'F_after_diff.png'); R['F']=F
    # Flow G: explicit Hybrid, Irritated
    home(page); tid(page,'v3-state-irritated').click(); config(page, typ='sweat_hybrid'); build(page); page.screenshot(path=SH+'G_preview_hybrid_irritated.png', full_page=True)
    R['G']=dict(request=last_gen(), title=txt(page,'v3-preview-title'), meta=txt(page,'v3-preview-meta'), rows=names(page), teaser=txt(page,'v3-preview-teaser') if tid(page,'v3-preview-teaser').count() else None)
    tid(page,'v3-preview-details').click(); tid(page,'v3-overview').wait_for(); time.sleep(0.5); page.screenshot(path=SH+'G_details.png', full_page=True)
    R['G']['details_bft']=txt(page,'v3-built-for-today')
    page.evaluate('window.__router.back()'); time.sleep(0.3)
    home(page); tid(page,'v3-state-irritated').click()
    # Flow H: Athletic
    home(page); tid(page,'v3-direction-athletic').click(); time.sleep(0.2); R['H_config']=txt(page,'v3-config-summary')
    tid(page,'v3-config').click(); time.sleep(0.3); R['H_sheet_has_focus']=tid(page,'v3-focus-chest').count(); page.screenshot(path=SH+'H_sheet.png'); tid(page,'v3-config-done').click(); time.sleep(0.2)
    build(page); page.screenshot(path=SH+'H_preview.png', full_page=True)
    H=dict(request=last_gen(), title=txt(page,'v3-preview-title'), rows=names(page)); H['diff']=diff(page); R['H']=H
    # Details swap -> Preview reflects; Home reopen
    tid(page,'v3-preview-details').click(); tid(page,'v3-overview').wait_for(); time.sleep(0.4)
    page.locator('[data-testid^="v3-swap-"]:visible').first.click(); time.sleep(2); page.evaluate('window.__router.back()'); time.sleep(0.6)
    R['details_swap_back']=names(page)[:4]
    # Reopen: same inputs same engine -> reopen (no new /generate)
    home(page); n0=len([r for r in reqs if r['url'].endswith('/generate')]); tid(page,'v3-build').click(); tid(page,'v3-preview-title').wait_for(); time.sleep(0.5)
    R['reopen_same_engine_generated']=len([r for r in reqs if r['url'].endswith('/generate')])-n0
    # Stale cache: tamper today's engine build -> Build must generate fresh, today card hidden
    home(page); page.evaluate("""()=>{const k=Object.keys(localStorage).find(k=>k.startsWith('@mood_v3_today_v1'));const e=JSON.parse(localStorage.getItem(k));e.envelope.engine={phase:'2.0',build:'oldbuild'};localStorage.setItem(k,JSON.stringify(e))}""")
    page.reload(); tid(page,'v3-home').wait_for(); time.sleep(0.8)
    tid(page,'v3-direction-athletic').click(); time.sleep(0.2)
    R['stale_today_card']=tid(page,'v3-today-card').count()
    n0=len([r for r in reqs if r['url'].endswith('/generate')]); build(page)
    R['stale_cache_generated']=len([r for r in reqs if r['url'].endswith('/generate')])-n0
    # Dev stale-backend banner: /version missing
    page.route('**/api/v3/version', lambda r: r.fulfill(status=404, body='{}')); page.reload(); tid(page,'v3-home').wait_for(); time.sleep(0.8)
    R['stale_banner_when_old_backend']=tid(page,'v3-dev-stale-backend').count(); page.screenshot(path=SH+'Z_stale_backend_banner.png')
    R['errors']=errs
    R['events']=sorted(set(page.evaluate('window.__events.map(e=>e.name)')))
    b.close()
print(json.dumps(R,indent=1,ensure_ascii=False))

# ------------------------------------------------------------------ verdicts (non-zero exit on any failure)
def check(name, cond):
    print(('PASS ' if cond else 'FAIL ') + name); return bool(cond)
ok = [
    check('A zero-effort request has no target/archetype', 'target' not in R['A']['request'] and 'archetype' not in R['A']['request']),
    check('A Different Workout changes, stays visible, scrolls to top', R['A']['diff']['changed'] and R['A']['diff']['visible_while_building'] and R['A']['diff']['scroll'] == 0),
    check('B Amped teaser shown', bool(R['B']['teaser']) and R['B']['teaser'].startswith('Built for your Amped state')),
    check('C request: strength + target=[chest], no archetype', R['C']['request']['direction'] == 'strength' and R['C']['request'].get('target') == ['chest'] and 'archetype' not in R['C']['request']),
    check('C Chest session, Different Workout changes twice', R['C']['title'] == 'Chest' and R['C']['diff1']['changed'] and R['C']['diff2']['changed']),
    check('D Back + Core, Core last, Different Workout changes', R['D']['title'] == 'Back + Core' and 'Core saved for the end' in (R['D']['teaser'] or '') and R['D']['diff']['changed']),
    check('E Lower Squat kept after Different Workout', R['E']['request'].get('archetype') == 'strength_lower_squat' and R['E']['diff']['title'] == 'Lower Body: Squat' and R['E']['diff']['changed']),
    check("F Sweat MOOD's Pick rotates", R['F']['diff']['title'] != R['F']['title']),
    check('G Hybrid is one anchor block (+ Finisher), no Complement', R['G']['rows'][0].startswith('HYBRID') and not any(r.startswith('CIRCUIT') for r in R['G']['rows'])),
    check('H Athletic builds and Different Workout rotates', R['H']['diff']['changed'] and not R['H_sheet_has_focus']),
    check('Same inputs + same engine reopens without generating', R['reopen_same_engine_generated'] == 0),
    check('Cached workout from another engine is never reopened', R['stale_cache_generated'] == 1 and R['stale_today_card'] == 0),
    check('Dev banner when backend has no engine identity', R['stale_banner_when_old_backend'] == 1),
]
raise SystemExit(0 if all(ok) else 1)
