"""Visual sweep (founder review 6d): the Cart hero for several Directions / archetypes (bundled 4:5 portraits and 16:9
remote heroes) and the warm-up screen with exercise photos. SHOTS=/tmp/cart/ python3 cart_sheet.py"""
import os, time
from playwright.sync_api import sync_playwright
from gs_e2e import BASE, T0, click, gen_with, open_session, settle
SH = os.environ.get('SHOTS', '/tmp/cart/'); os.makedirs(SH, exist_ok=True)
SPECS = [dict(direction='strength', duration=60, archetype='strength_upper_push'), dict(direction='strength', duration=60, archetype='strength_upper_pull'),
         dict(direction='strength', duration=60, archetype='strength_full_body'), dict(direction='strength', duration=60, archetype='strength_arms'),
         dict(direction='sweat', duration=60), dict(direction='athletic', duration=60), dict(direction='athletic', duration=30, archetype='athletic_full_body'),
         dict(direction='strength', duration=30)]

def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        page = ctx.new_page(); page.clock.install(time=T0 / 1000)
        page.goto(BASE); page.evaluate('localStorage.clear()'); page.reload(); page.clock.run_for(2000)
        for k, spec in enumerate(SPECS):
            w = gen_with(lambda w: True, 1, **spec)
            if not w: continue
            page.evaluate(f"window.__router.push({{pathname:'/v3/workout', params:{{id:'{w['workout_id']}'}}}})"); page.clock.run_for(1500); time.sleep(1.5); page.clock.run_for(200); settle(page, 200)
            page.screenshot(path=f'{SH}cart_{k}_{spec.get("archetype", spec["direction"])}.png')
            if spec['direction'] in ('strength', 'athletic') and k in (0, 5, 6):
                open_session(page, w['workout_id']); time.sleep(1.2); page.clock.run_for(200); settle(page, 200)
                page.screenshot(path=f'{SH}warmup_{k}_{spec["direction"]}.png')
                click(page, 'v3-session-exit'); click(page, 'v3-exit-end'); click(page, 'v3-end-confirm'); page.clock.run_for(1200)
            page.evaluate("window.__router.dismissTo('/(tabs)')"); page.clock.run_for(800)

main()
