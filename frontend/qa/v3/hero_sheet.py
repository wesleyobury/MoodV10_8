"""Visual sweep (founder review 6c): screenshot the Guided set screen for every exercise of several generated workouts, plus
the warm-up, a superset and a rest, and compose contact sheets so hero framing can be checked by eye.
    SHOTS=/tmp/hero/ python3 hero_sheet.py"""
import os, sys, time
from playwright.sync_api import sync_playwright
from gs_e2e import BASE, T0, api, click, gen_with, open_session, settle, ui
SH = os.environ.get('SHOTS', '/tmp/hero/'); os.makedirs(SH, exist_ok=True)
SPECS = [dict(direction='strength', duration=60, archetype='strength_upper_pull'), dict(direction='strength', duration=60, archetype='strength_upper_push'),
         dict(direction='strength', duration=60), dict(direction='athletic', duration=60), dict(direction='sweat', duration=60), dict(direction='strength', duration=30)]

def vis(page, tid):
    return page.locator(f'[data-testid="{tid}"]').filter(visible=True).count() > 0

def main():
    out = []
    with sync_playwright() as pw:
        b = pw.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        page = ctx.new_page(); page.clock.install(time=T0 / 1000)
        page.goto(BASE); page.evaluate('localStorage.clear()'); page.reload(); page.clock.run_for(2000)
        for k, spec in enumerate(SPECS):
            w = gen_with(lambda w: True, 1, **dict(spec)) if k else gen_with(lambda w: any(b['structure'] == 'superset' for b in w['blocks']), 15, **spec)
            if not w: continue
            open_session(page, w['workout_id'])
            seen = set()
            for i in range(80):
                u = ui(page)
                if u['complete'] or page.locator('[data-testid="v3-session-complete"]').count(): break
                key = None
                if vis(page, 'v3-session-warmup'): key = 'warmup'
                elif vis(page, 'v3-session-cooldown'): key = 'cooldown'
                elif vis(page, 'v3-session-target') or vis(page, 'v3-session-stage-work'): key = 'work:' + (u['name'] or '?')
                elif vis(page, 'v3-session-stage-rest'): key = 'rest'
                elif u['ready']: key = 'ready:' + (u['name'] or '?')
                if key and key not in seen:
                    seen.add(key); time.sleep(0.9); page.clock.run_for(100); settle(page, 200)
                    f = f'{SH}{k}_{len(seen):02d}.png'; page.screenshot(path=f); out.append((f, key))
                if key == 'warmup' or key == 'cooldown':
                    click(page, 'v3-session-primary'); page.clock.run_for(400); continue
                if key and key.startswith('ready') or u['phase']:
                    page.locator('[data-testid="v3-session-more"]').filter(visible=True).first.click() if vis(page, 'v3-session-more') else None
                    page.clock.run_for(200)
                    if vis(page, 'v3-more-skip-block'): click(page, 'v3-more-skip-block')
                    else:
                        if vis(page, 'v3-session-skip'): click(page, 'v3-session-skip')
                        else: page.keyboard.press('Escape')
                    continue
                if vis(page, 'v3-session-all-sets'): click(page, 'v3-session-all-sets'); page.clock.run_for(300); continue
                if vis(page, 'v3-session-primary'): click(page, 'v3-session-primary'); page.clock.run_for(300); continue
                break
            # leave
            if not page.locator('[data-testid="v3-session-complete"]').count():
                click(page, 'v3-session-exit'); click(page, 'v3-exit-end'); click(page, 'v3-end-confirm')
            else:
                page.evaluate("window.__router.dismissTo('/(tabs)')")
            page.clock.run_for(1500)
    open(SH + 'index.txt', 'w').write('\n'.join(f'{f}\t{k}' for f, k in out))
    print(len(out), 'shots')

main()
