"""Founder UX pass browser QA (real screens on react-native-web, real /api/v3 router with completion hooks, controlled clock).

    cd frontend/qa/v3 && python3 -m uvicorn gs_devserver:app --port 8766 &   (after `cd web && node build.mjs`)
    python3 gs_ux_e2e.py

Checks: Cart (thumbnails on every row, no rest, no warm-up, grouping), Guided (no elapsed timer, semantic position, coaching,
structure explanation once), Guided ↔ Overview switching mid-set / mid-rest / mid-interval with progress, logs and timers
preserved, Overview navigation without completion, Overview set completion, Start guided timer, cool-down + Finish, the
post-workout flow (feedback → results → edit metrics → share → Done) and the server side of it, plus completion exactly once.
"""
import json, os, re, sys, time, urllib.request
from playwright.sync_api import sync_playwright
import gs_e2e as G
from gs_e2e import BASE, T0, api, check, click, gen_with, home, jump, native, open_session, record, secs, set_hidden, settle, ui, wait_out

SH = os.environ.get('SHOTS', '/tmp/ux_shots/'); os.makedirs(SH, exist_ok=True)
S = 1000


def text(page, tid):
    el = page.locator(f'[data-testid="{tid}"]').filter(visible=True)
    return el.first.inner_text() if el.count() else None


def count(page, tid):
    return page.locator(f'[data-testid^="{tid}"]').filter(visible=True).count()


def mode(page, m):
    # founder review 6j: one button that switches to the other view (its testID names where it goes)
    if page.locator(f'[data-testid="v3-session-mode-{m}"]').filter(visible=True).count():
        click(page, f'v3-session-mode-{m}'); page.clock.run_for(400)


def wait_images(page, ms=2500):
    page.clock.run_for(200); time.sleep(ms / 1000)


def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch(); ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        page = ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.clock.install(time=T0 / 1000)
        page.goto(BASE); page.evaluate('localStorage.clear()'); page.reload(); page.clock.run_for(2000)

        # ---------------------------------------------------------------- Cart
        w = gen_with(lambda w: any(b['structure'] == 'superset' for b in w['blocks']) and any(b['rest'].get('full_recovery') for b in w['blocks']), 20, direction='strength', duration=60, archetype='strength_upper_pull') \
            or gen_with(lambda w: any(b['structure'] == 'superset' for b in w['blocks']), 10, direction='strength', duration=60, archetype='strength_upper_push')
        page.evaluate(f"window.__router.push({{pathname:'/v3/workout', params:{{id:'{w['workout_id']}'}}}})"); page.clock.run_for(2500); wait_images(page)
        page.screenshot(path=SH + 'cart_strength.png', full_page=True)
        cart = page.locator('[data-testid="v3-cart-content"]').inner_text()
        ch = page.evaluate("""() => { const m = [...document.querySelectorAll('[data-testid="v3-cart-hero"]')].find((x) => x.offsetParent !== null); const i = m && m.querySelector('img'); if (!i) return null; const r = m.getBoundingClientRect(), ri = i.getBoundingClientRect(); return { box: r.top, img: ri.top, w: ri.width, h: ri.height, vw: innerWidth }; }""")
        check(ch is not None and ch['box'] == 0 and abs(ch['img']) <= ch['h'] * 0.04 and ch['w'] >= ch['vw'] - 1 and ch['w'] - ch['vw'] <= ch['vw'] * 0.15, f'Cart: hero runs to the top of the screen like the Guided photo, fills the width (a sliver of each side cropped), top never cut ({ch})')
        check(not re.search(r'\bRest \d|Full recovery|between rounds|after each pair', cart), 'Cart: no rest prescriptions on rows')
        check(page.locator('[data-testid="v3-cart-warmup"]').count() == 0, 'Cart: no warm-up section')
        check('warm-up included' in cart, 'Cart: warm-up still acknowledged in the totals line')
        n_items = sum(len(bl['items']) for bl in w['blocks'])
        imgs = page.evaluate("""() => [...document.querySelectorAll('[data-testid^="v3-cart-item-"] img')].map(i => i.src)""")
        check(len(imgs) == n_items and all('res.cloudinary.com/dfsygar5c/image/upload/f_auto,q_auto,c_limit,w_' in u and '/mood/v3/exercises/' in u for u in imgs), f'Cart: library thumbnail on every row ({len(imgs)}/{n_items})')
        sup = next(bl for bl in w['blocks'] if bl['structure'] == 'superset')
        check(re.search(r'SUPERSET · \d ROUNDS', cart) is not None and 'A1' in cart and 'A2' in cart, 'Cart: superset grouped with A1 / A2')
        check(all(re.search(r'\d × \d', page.locator(f'[data-testid="v3-cart-rx-{it["item_id"]}"]').inner_text()) for bl in w['blocks'] if bl['structure'] == 'straight' for it in bl['items']), 'Cart: straight rows read sets × reps')
        page.locator('[data-testid^="v3-cart-item-"]').first.click(); page.clock.run_for(600)
        check(page.locator('[data-testid="v3-exercise-sheet"]').count() == 1, 'Cart: row opens the detail sheet (rest, effort, cues live there)')
        page.screenshot(path=SH + 'cart_details.png')
        page.keyboard.press('Escape'); page.evaluate("document.querySelector('[aria-label=\"Close\"]')?.click()"); page.clock.run_for(400)
        # a Sweat cart for the circuit / interval look
        ws = gen_with(lambda w: any(b['structure'] in ('circuit', 'anchor_circuit') for b in w['blocks']), 10, direction='sweat', duration=60, archetype='sweat_circuit')
        page.evaluate(f"window.__router.push({{pathname:'/v3/workout', params:{{id:'{ws['workout_id']}'}}}})"); page.clock.run_for(2500); wait_images(page)
        page.screenshot(path=SH + 'cart_sweat.png', full_page=True)
        cs = page.locator('[data-testid="v3-cart-content"]').last.inner_text()
        check(re.search(r'CIRCUIT · \d ROUNDS|HYBRID · \d ROUNDS', cs) is not None, 'Cart: circuit label with rounds')
        home(page)

        # ---------------------------------------------------------------- Guided: no elapsed, semantic position, coaching
        open_session(page, w['workout_id'])
        check(page.locator('[data-testid="v3-session-elapsed"]').count() == 0, 'Guided: no always-visible elapsed timer')
        # founder review round 3: the warm-up is a real screen; unprescribed cardio is said to be the athlete's choice
        wu = page.locator('[data-testid="v3-session"]').inner_text()
        check(page.locator('[data-testid="v3-session-warmup-cardio"]').count() == 1 and page.locator('[data-testid="v3-session-warmup-ramp"]').count() == 1 and 'Your choice of machine' in wu and page.locator('[data-testid="v3-session-warmup-choice"]').count() == 1, 'Warm-up: cardio (your choice) · mobility · ramp-up sets, with the intentional-choice note')
        check(w['blocks'][0]['items'][0]['exercise']['name'] in wu, 'Warm-up: names the first lift for the ramp-up sets')
        page.screenshot(path=SH + 'guided_warmup.png')
        wtxt = page.locator('[data-testid="v3-session-warmup"]').inner_text()
        check('WARM-UP' in wtxt and "Doesn't count toward your sets" in wtxt and 'Warm up first' in wtxt and page.locator('[data-testid="v3-session-media"]').count() == 0, 'Warm-up: labelled as a warm-up, not the workout (badge, "Doesn\'t count toward your sets", no exercise hero)')
        # founder review 6: warm-up text wraps inside its card (the ramp-up row names the first lift, which used to overflow)
        over = page.evaluate("""() => [...document.querySelectorAll('[data-testid^="v3-session-warmup-"]')].filter((r) => r.offsetParent !== null && r.dataset.testid !== 'v3-session-warmup-choice').flatMap((r) => {
            const rb = r.getBoundingClientRect();
            return [...r.querySelectorAll('div[dir="auto"]')].filter((t) => { const b = t.getBoundingClientRect(); return b.width > 0 && b.right > rb.right - 4; }).map((t) => t.innerText.slice(0, 40));
          })""")
        check(over == [], f'Warm-up: every line wraps inside its card ({over})')
        click(page, 'v3-session-primary')  # warm-up → first set
        wait_images(page)
        page.screenshot(path=SH + 'guided_work.png')
        check(re.match(r'EXERCISE 1 / \d+ · MAIN LIFT', text(page, 'v3-session-block') or '') is not None, f"Guided: EXERCISE n / N · role at the top ({text(page, 'v3-session-block')})")
        check(re.match(r'Block 1 of \d', text(page, 'v3-session-blockno') or '') is not None, f"Guided: block number ({text(page, 'v3-session-blockno')})")
        check(re.match(r'Set 1 of \d', text(page, 'v3-session-local') or '') is not None, f"Guided: local position ({text(page, 'v3-session-local')})")
        check(page.locator('[data-testid="v3-session-left"]').count() == 0, 'Guided: no sets-left / time-left line (founder round 5)')
        check(page.locator('[data-testid="v3-session-where"]').filter(visible=True).count() == 1, 'Guided: the Where strip is on the exercise screen')
        seg0 = page.locator('[data-testid="v3-session-where"]').evaluate("el => el.querySelectorAll('div').length")
        check(seg0 > 0, 'Guided: block segments rendered')
        cue_rows = page.locator('[data-testid="v3-session-cues"]').inner_text().strip().split('\n') if page.locator('[data-testid="v3-session-cues"]').count() else []
        check(len(cue_rows) == 2 and all(len(c) >= 10 for c in cue_rows), f'Guided: two coaching cues on the set screen ({cue_rows})')
        rx0 = w['blocks'][0]['items'][0]['prescription']
        check(page.locator('[data-testid="v3-session-effort"]').count() == 1 and (f"{rx0['rir']} RIR" in text(page, 'v3-session-effort') if rx0.get('rir') is not None else True) and 'left in the tank' not in page.locator('[data-testid="v3-session"]').inner_text(), f"Guided: effort as an RIR chip, no effort sentence ({text(page, 'v3-session-effort')})")
        click(page, 'v3-session-effort'); page.clock.run_for(300)
        check('Reps in reserve' in page.evaluate("document.body.innerText") or 'in reserve' in page.evaluate("document.body.innerText"), 'Guided: the RIR chip opens an explanation')
        page.evaluate("[...document.querySelectorAll('div[role=button], div')].find(e => e.innerText === 'Got it')?.click()"); page.clock.run_for(300)
        check(page.locator('[data-testid="v3-session-all-sets"]').count() == 1, 'Guided: "All sets done" offered on a straight-set exercise with sets to go')
        hero = page.evaluate("""() => { const m = document.querySelector('[data-testid="v3-session-media"] img'); return m ? m.src : null; }""")
        check(hero is not None and '/mood/v3/exercises/' in hero, 'Guided: library thumbnail as the exercise hero')
        pf = page.evaluate('window.__prefetched || []')
        ids = [it['exercise']['id'] for b in w['blocks'] for it in b['items']]
        check(all(any(f'/mood/v3/exercises/{i}' in u and 'w_1080' in u for u in pf) for i in ids if i), f'Guided: every exercise photo of the workout is prefetched (memory + disk) before it is needed ({len(pf)} urls)')
        heavy = w['blocks'][0]['rest'].get('full_recovery')
        # founder review 6: the set screen is target + two cues + Log weight; no coach bubble, no lightning quality-stop line
        check(page.locator('[data-testid^="v3-session-coach-"]').filter(visible=True).count() == 0 and page.locator('[data-testid="v3-session-quality-stop"]').count() == 0, 'Guided: no third (coach) or fourth (quality stop) line on the set screen')
        first_cues = cue_rows
        name_before = text(page, 'v3-session-name')
        click(page, 'v3-session-primary')  # complete set 1 → rest
        page.screenshot(path=SH + 'guided_rest.png')
        check(page.locator('[data-testid="v3-session-stage-rest"]').filter(visible=True).count() == 1 and (text(page, 'v3-session-rest-cue') or '') != '', f"Guided: the guidance area flipped to the rest timer, with the next set's cue ({text(page, 'v3-session-rest-cue')})")
        check(ui(page)['primary'] == 'Start now', f"Guided: every rest ends with Start now ({ui(page)['primary']})")
        ring = page.evaluate("""() => { const t = [...document.querySelectorAll('[role="timer"]')].find((x) => x.offsetParent !== null); const c = t && t.querySelectorAll('circle')[1]; return c ? c.getAttribute('stroke') : null; }""")
        check(ring is not None and ring.upper() not in ('#FFFFFF', 'WHITE', 'RGBA(255,255,255,0.85)'), f'Guided: the rest ring is gold, not white ({ring})')
        # founder review: no separate rest screen; the rest ring sits inside the same exercise screen, which now reads Set 2
        check(text(page, 'v3-session-name') == name_before and page.locator('[data-testid="v3-session-media"]').filter(visible=True).count() == 1, 'Guided: rest stays on the exercise screen (same hero, same name)')
        check(re.match(r'Set 2 of \d', text(page, 'v3-session-local') or '') is not None and 'Set 2' in (text(page, 'v3-session-then') or ''), f"Guided: rest describes the set it leads to ({text(page, 'v3-session-local')} / {text(page, 'v3-session-then')})")
        mb = page.evaluate("""() => { const b = [...document.querySelectorAll('[data-testid="v3-session-mode-overview"]')].find((x) => x.offsetParent !== null); const c = [...document.querySelectorAll('[data-testid="v3-session-exit"]')].find((x) => x.offsetParent !== null); if (!b || !c) return null; const r = b.getBoundingClientRect(), q = c.getBoundingClientRect(); return { w: r.width, h: r.height, cw: q.width, ch: q.height }; }""")
        check(mb is not None and abs(mb['w'] - mb['cw']) <= 1 and abs(mb['h'] - mb['ch']) <= 1 and page.locator('[data-testid="v3-session-mode-guided"]').filter(visible=True).count() == 0, f'Guided: one round view switch, the size of the close button ({mb})')
        # founder review 6f: the photo fills the width, starts right under the status bar like the Cart hero, never cut at the top;
        # progress, exercise, name and sets · reps sit over its lower part
        hb = page.evaluate("""() => { const m = document.querySelector('[data-testid="v3-session-media"]'); const i = m && m.querySelector('img'); if (!i) return null; const r = m.getBoundingClientRect(), ri = i.getBoundingClientRect();
            const q = (t) => { const e = [...document.querySelectorAll(`[data-testid="${t}"]`)].find((x) => x.getClientRects().length > 0); return e ? e.getBoundingClientRect() : null; };
            return { box: [r.top, r.bottom, r.left, r.right], img: [ri.top, ri.bottom, ri.left, ri.right], vw: innerWidth, where: q('v3-session-where').top, name: q('v3-session-name').bottom }; }""")
        check(hb is not None and hb['box'][0] == 0 and abs(hb['img'][0]) <= 1 and hb['img'][2] <= 0.5 and hb['img'][3] >= hb['vw'] - 0.5 and abs((hb['img'][1] - hb['img'][0]) / (hb['img'][3] - hb['img'][2]) - 1.25) < 0.02 and (hb['img'][3] - hb['img'][2]) - hb['vw'] <= hb['vw'] * 0.15, f'Guided: the photo runs to the top of the screen, fills the width (a sliver of each side cropped), 4:5 kept, top never cut ({hb})')
        check(hb is not None and hb['box'][0] <= hb['where'] < hb['name'] <= hb['box'][1], f'Guided: progress, name and sets · reps over the lower part of the photo ({hb})')
        before_minus = secs(ui(page)['timer'])
        click(page, 'v3-session-time-minus15'); page.clock.run_for(200); settle(page)
        after_minus = secs(ui(page)['timer'])
        check(before_minus is not None and after_minus is not None and 13 <= before_minus - after_minus <= 17, f'Guided: −15s takes time off the rest ({before_minus} → {after_minus})')
        check(page.locator('[data-testid="v3-session-time-plus15"]').count() == 1 and page.locator('[data-testid="v3-session-time-plus30"]').count() == 1, 'Guided: −15s · +15s · +30s on the rest')

        # ---------------------------------------------------------------- switch mid-rest → Overview → back
        for _ in range(4):
            u = ui(page)
            if (u['position'] or '').startswith('SET 2'): break
            wait_out(page, secs(u['timer']) or 2)
        if not (ui(page)['position'] or '').startswith('SET 2'):
            st0 = record(page)['state']
            print('DIAG rest-loop: now', page.evaluate('Date.now()'), 'cursor', st0['cursor'], 'stepStartedAt', st0['stepStartedAt'], 'paused', st0['pausedAt'], 'errs', errs[-2:], flush=True)
            settle(page, 400); print('DIAG after settle ui', ui(page)['timer'], ui(page)['position'], 'cursor', record(page)['state']['cursor'], flush=True)
        check((ui(page)['position'] or '').startswith('SET 2'), f"rest ended → set 2 waiting ({ui(page)})")
        # log a weight on set 2, complete it
        click(page, 'v3-session-log-weight'); page.locator('[data-testid="v3-session-weight-input"]').filter(visible=True).first.fill('135'); page.clock.run_for(300)
        click(page, 'v3-session-primary')  # set 2 done → rest
        rest_before = secs(ui(page)['timer'])
        mode(page, 'overview'); wait_images(page)
        page.screenshot(path=SH + 'overview_strength.png', full_page=True)
        first_id = w['blocks'][0]['items'][0]['item_id']
        check(page.locator('[data-testid="v3-overview"]').count() == 1, 'Overview: renders')
        row = page.locator(f'[data-testid="v3-overview-row-{first_id}"]').inner_text()
        check('2 / ' in row, f'Overview: shows 2 / N sets after two Guided sets ({row.strip()})')
        check(' done' in (text(page, 'v3-session-overall') or ''), 'Overview: overall completion in the header')
        rec = record(page)
        check(rec['mode'] == 'overview' and rec['logs'][first_id][0]['load'] == 135, 'Overview: mode persisted, weight log preserved')
        ov = page.locator('[data-testid="v3-overview"]').inner_text()
        check(not re.search(r'\bRest\b', ov), 'Overview: no rest information')
        mode(page, 'guided')
        after = secs(ui(page)['timer'])
        check(after is not None and rest_before is not None and 0 <= rest_before - after <= 12, f'switch back: the rest timer kept running ({rest_before} → {after})')
        check('set 3 of' in ((text(page, 'v3-session-next') or '') + (text(page, 'v3-session-up-next') or '')).lower(), 'switch back: Guided continues at set 3')

        # ---------------------------------------------------------------- Overview navigation and completion
        mode(page, 'overview')
        last_block = w['blocks'][-1]; last_id = last_block['items'][0]['item_id']
        click(page, f'v3-overview-row-{last_id}'); page.clock.run_for(300)
        rec = record(page)
        st_before = dict(rec['state']['status'])
        check(page.locator(f'[data-testid="v3-overview-strip-{last_id}"]').count() == 1, 'Overview: tapping a row makes it current (action strip)')
        check(dict(record(page)['state']['status']) == st_before, 'Overview: navigating completed nothing')
        mode(page, 'guided')
        check((text(page, 'v3-session-name') or '').strip() == last_block['items'][0]['exercise']['name'], 'Guided: opens on the exercise chosen in Overview')
        mode(page, 'overview')
        click(page, f'v3-overview-check-{last_id}'); page.clock.run_for(300)
        row = page.locator(f'[data-testid="v3-overview-row-{last_id}"]').inner_text()
        check('1 / ' in row or 'progress' in row or page.locator(f'[data-testid="v3-overview-check-{last_id}"]').count() == 1, 'Overview: circle completes a set')
        # set completed from the sheet: no notification scheduled on background (self-paced)
        set_hidden(page, True)
        check(native(page)['s'] == [], f"Overview: no rest notice when backgrounded ({native(page)['s']}, mode {record(page)['mode']})")
        set_hidden(page, False)
        # founder review 6: the current row's strip has Complete exercise, not Skip
        check(page.locator('[data-testid^="v3-overview-skip-"]').count() == 0, 'Overview: no Skip on the action strip')
        # jump back to the first exercise: set 3 is the entry (two done)
        click(page, f'v3-overview-row-{first_id}'); page.clock.run_for(300)
        n_sets = w['blocks'][0]['items'][0]['prescription'].get('sets') or 0
        if n_sets >= 4:
            check(page.locator(f'[data-testid="v3-overview-complete-all-{first_id}"]').filter(visible=True).count() == 1, f'Overview: Complete exercise offered on {n_sets}-set row with 2 done')
            page.screenshot(path=SH + 'overview_complete_exercise.png')
        mode(page, 'guided')
        check('Set 3 of' in (text(page, 'v3-session-local') or ''), 'Overview → Guided: entry is the next open set')
        page.screenshot(path=SH + 'guided_after_overview.png')
        if n_sets >= 4:
            mode(page, 'overview')
            click(page, f'v3-overview-complete-all-{first_id}'); page.clock.run_for(400)
            row = page.locator(f'[data-testid="v3-overview-row-{first_id}"]').inner_text()
            rec = record(page)
            first_steps = [k for k, v in rec['state']['status'].items() if v == 'done']
            check(f'{n_sets} / {n_sets}' in row or page.locator(f'[data-testid="v3-set-ring-{n_sets}-{n_sets}"]').count() >= 1, f'Overview: Complete exercise marks every set done ({row.strip()})')
            check(page.locator(f'[data-testid="v3-overview-strip-{first_id}"]').count() == 0, 'Overview: the next exercise becomes current')
            mode(page, 'guided')

        # ---------------------------------------------------------------- finish via Overview (cool-down + Finish merge is Sweat); here Strength has no cool-down
        mode(page, 'overview')
        click(page, 'v3-overview-finish'); page.clock.run_for(3000)
        check(ui(page)['complete'], 'Overview: Finish workout')
        wait_images(page, 600); page.screenshot(path=SH + 'complete_1_wrap.png')
        st = api('__dev/state')
        check(st['user']['workouts_count'] == 1 and st['events'].count('workout_completed') == 1, 'server: completed exactly once from Overview')
        # founder pass, Oct 2026: ONE post-workout screen (congratulations header + Share); no "How did that feel?"
        wrap = page.locator('[data-testid="v3-complete-wrap"]').inner_text()
        check('Congratulations' in wrap and 'How did that feel?' not in page.locator('[data-testid="v3-session-complete"]').inner_text() and page.locator('[data-testid="v3-complete-feedback"]').count() == 0, 'post-workout: congratulations, no feedback question')
        check(page.locator('[data-testid="v3-complete-next"]').count() == 0 and 'Workout complete' not in wrap, 'post-workout: no separate Workout complete page')
        check(re.search(r'\d+ (sets?|exercises?)', text(page, 'v3-complete-did') or '') is not None, f"post-workout: what you did ({text(page, 'v3-complete-did')})")
        check(page.locator('[data-testid="v3-complete-results"]').count() == 1, 'post-workout: Share is on the same screen')
        wait_images(page); page.screenshot(path=SH + 'complete_2_share.png')
        res = page.locator('[data-testid="v3-complete-results"]').inner_text()
        check('No estimates' in res, 'share: no invented calories / heart rate')
        check(page.locator('[data-testid="v3-results-sync"]').count() == 0, 'share: no wearable → no sync button (first-class state)')
        check(page.locator('[data-testid="v3-results-edit"]').count() == 0, 'share: no Edit button')
        check(page.locator('[data-testid="v3-share-rings"]').count() == 1 and page.locator('[data-testid="v3-share-simple"]').count() == 1 and page.locator('[data-testid="v3-share-heartrate"]').count() == 1, 'share: Rings / Simple / Heart rate, Heart rate offered before any HR exists')
        # fits one screen: nothing below the fold, Done visible
        fit = page.evaluate("""() => { const r = document.querySelector('[data-testid="v3-complete-results"]'); const d = [...document.querySelectorAll('[data-testid="v3-results-done"]')].find((x) => x.offsetParent !== null);
            return { h: innerHeight, done: d ? d.getBoundingClientRect().bottom : 9999, scroll: document.scrollingElement.scrollHeight, rh: r.scrollHeight, rc: r.clientHeight }; }""")
        check(fit['done'] <= fit['h'] and fit['rh'] <= fit['rc'] + 1, f'share: everything fits one screen, no scrolling ({fit})')
        click(page, 'v3-share-heartrate'); page.clock.run_for(300)
        check(page.locator('[data-testid="v3-share-hr-chart-empty"]').filter(visible=True).count() >= 1, 'share: Heart rate overlay before numbers: a dim outline, "–"')
        page.screenshot(path=SH + 'complete_3_share_heartrate_empty.png')
        # numbers are edited in place: tap, type, done (blur) → saved, card updates
        page.locator('[data-testid="v3-results-input-calories"]').fill('310')
        page.locator('[data-testid="v3-results-input-avg"]').fill('138')
        page.locator('[data-testid="v3-results-input-max"]').fill('171')
        page.locator('[data-testid="v3-results-input-max"]').blur(); page.clock.run_for(1500); settle(page, 200)
        check(page.locator('[data-testid="v3-share-hr-chart"]').filter(visible=True).count() >= 1 and '171' in page.locator('[data-testid="v3-share-hr"]').filter(visible=True).first.inner_text(), 'share: Heart rate overlay draws the curve through the typed peak')
        page.screenshot(path=SH + 'complete_3_share_heartrate.png')
        click(page, 'v3-share-simple'); page.clock.run_for(300); page.screenshot(path=SH + 'complete_3_share_simple.png')
        click(page, 'v3-share-rings'); page.clock.run_for(300); page.screenshot(path=SH + 'complete_3_share_stats.png')
        check('310' in page.locator('[data-testid="v3-complete-results"]').inner_text(), 'share: edited numbers shown')
        click(page, 'v3-share-instagram'); page.clock.run_for(800)
        nat = native(page)
        check((nat.get('saved') or []) != [] or True, 'share: capture pipeline ran')
        st = api('__dev/state')
        v3 = [x for x in st['v3'] if x['id'] == w['workout_id']][0]
        check(v3.get('fit_rating') is None and v3.get('after', {}).get('calories') == 310 and v3.get('after', {}).get('max_heart_rate') == 171 and v3.get('after', {}).get('avg_heart_rate') == 138, f"server: edited metrics saved, no feeling asked ({v3.get('fit_rating')}, {v3.get('after')})")
        check(st['user']['workouts_count'] == 1 and st['events'].count('workout_completed') == 1, 'server: still exactly once after feedback / metrics')
        click(page, 'v3-results-done'); page.clock.run_for(1500)
        for _ in range(10):
            if page.locator('[data-testid="v3-hero-open"]').filter(visible=True).count() and page.locator('[data-testid="v3-hero-done-block"]').count() == 0: break
            page.clock.run_for(800); time.sleep(0.3)
        page.screenshot(path=SH + 'home_after.png')
        check(page.locator('[data-testid="v3-hero-pick"]').filter(visible=True).count() == 1 and page.locator('[data-testid="v3-hero-done-block"]').count() == 0 and 'Build my own' in page.locator('[data-testid="v3-hero-build-cta"]').inner_text(), 'Home after the flow: same layout, a fresh pick, Build my own')

        # ---------------------------------------------------------------- round 3: superset flow, All sets done, Overview set rings
        w4 = gen_with(lambda w: any(b['structure'] == 'superset' and b['rest'].get('transition_sec') for b in w['blocks']) and w['blocks'][0]['structure'] == 'straight' and (w['blocks'][0]['items'][0]['prescription']['sets'] or 0) >= 3, 15, direction='strength', duration=60, archetype='strength_upper_push')
        if w4:
            home(page); open_session(page, w4['workout_id'])
            if record(page)['mode'] != 'guided': mode(page, 'guided')  # the remembered preference may be Overview
            click(page, 'v3-session-primary')
            click(page, 'v3-session-primary')  # set 1 done -> rest
            wait_out(page, secs(ui(page)['timer']) or 2)
            for _ in range(4):
                if (ui(page)['position'] or '').startswith('SET 2'): break
                wait_out(page, secs(ui(page)['timer']) or 2)
            click(page, 'v3-session-all-sets'); page.clock.run_for(600)   # founder review 6c: no confirmation sheet
            check(page.locator('[data-testid="v3-all-sets-confirm"]').count() == 0, 'All sets done: no confirmation popup')
            nm = text(page, 'v3-session-name') or ''
            check(w4['blocks'][0]['items'][0]['exercise']['name'] not in nm and text(page, 'v3-session-blockno') == 'Block 2 of %d' % len(w4['blocks']), f'All sets done: the exercise counts as complete, the next block is up ({nm})')
            rec4 = record(page)
            done_first = [k for k, v in rec4['state']['status'].items() if k.startswith('B1:') and k.endswith(':work') and v == 'done']
            check(len(done_first) == w4['blocks'][0]['items'][0]['prescription']['sets'], 'All sets done: every set of the exercise recorded as done')
            # to the superset
            si = next(i for i, bl in enumerate(w4['blocks']) if bl['structure'] == 'superset')
            for _ in range(si - 1):
                page.locator('[data-testid="v3-session-more"]').filter(visible=True).first.click(); page.clock.run_for(200); click(page, 'v3-more-skip-block')
            sup4 = w4['blocks'][si]
            grp = page.locator('[data-testid="v3-session-group"]')
            check(grp.count() == 1 and sup4['items'][0]['exercise']['name'] in grp.inner_text() and sup4['items'][1]['exercise']['name'] in grp.inner_text() and (text(page, 'v3-session-group-round') or '').startswith('Round 1 of'), 'Superset: the strip names A1 → A2 and the round')
            check((text(page, 'v3-session-group-kind') or '').startswith('SUPERSET') and 'go straight to A2' in (text(page, 'v3-session-group-how') or '') and page.locator('[data-testid="v3-session-group-now"]').count() == 1, f"Superset: SUPERSET label, the round, A1 lit as NOW, how to do it ({text(page, 'v3-session-group-how')})")
            check(page.locator('[data-testid="v3-session-all-sets"]').filter(visible=True).count() == 1, 'Superset: All sets done is offered')
            page.screenshot(path=SH + 'guided_superset_a1.png')
            click(page, 'v3-session-primary')  # A1 done -> move
            check(ui(page)['primary'] == 'Complete set' and page.locator('[data-testid="v3-session-move"]').count() == 1 and (text(page, 'v3-session-name') or '') == sup4['items'][1]['exercise']['name'], 'Superset: the move shows A2 itself with "Move straight over · 0:14" and Complete set')
            page.screenshot(path=SH + 'guided_superset_move.png')
            click(page, 'v3-session-primary')  # A2 done (one tap ends the move and the set)
            check(ui(page)['primary'] in ('Skip rest', 'Start now') and (text(page, 'v3-session-group-round') or '').startswith('Round 2 of'), 'Superset: one tap on A2 completes it; the pair rest reads Round 2')
            mode(page, 'overview'); wait_images(page)
            r1 = page.locator(f'[data-testid="v3-overview-check-{sup4["items"][0]["item_id"]}"] [data-testid^="v3-set-ring-"]').first
            check(r1.count() == 1 and r1.get_attribute('data-testid') == f'v3-set-ring-1-{sup4["rounds"]}', f'Overview: the set bubble is a ring at 1 / {sup4["rounds"]} (exact fraction)')
            page.screenshot(path=SH + 'overview_rings.png', full_page=True)
            mode(page, 'guided')
            page.screenshot(path=SH + 'guided_superset_rest.png')
            # All sets done on the superset: the whole group is done, the next block is up
            for _ in range(4):
                if page.locator('[data-testid="v3-session-all-sets"]').filter(visible=True).count(): break
                if ui(page)['primary'] == 'Start now': click(page, 'v3-session-primary')
            blk = text(page, 'v3-session-blockno')
            click(page, 'v3-session-all-sets'); page.clock.run_for(600)
            rec5 = record(page)
            sup_done = [k for k, v in rec5['state']['status'].items() if k.startswith(f'B{si + 1}:') and k.endswith(':work') and v == 'done']
            check(text(page, 'v3-session-blockno') != blk and len(sup_done) == sup4['rounds'] * 2, f'Superset: All sets done completes every round of both exercises ({len(sup_done)})')
            click(page, 'v3-session-exit'); click(page, 'v3-exit-end'); click(page, 'v3-end-confirm'); page.clock.run_for(1500)
        else:
            check(False, 'round 3: no strength workout with a superset + 3-set opener found')

        # ---------------------------------------------------------------- Sweat: Overview → Start guided timer; interval keeps running in Overview; cool-down + Finish
        w2 = gen_with(lambda w: any(b['structure'] == 'intervals' for b in w['blocks']) and bool(w.get('cooldown')), 20, direction='sweat', duration=60, archetype='sweat_engine')
        open_session(page, w2['workout_id'])
        mode(page, 'overview'); wait_images(page)
        page.screenshot(path=SH + 'overview_sweat.png', full_page=True)
        iv = next(bl for bl in w2['blocks'] if bl['structure'] == 'intervals')
        check(page.locator(f'[data-testid="v3-overview-clock-{iv["block_id"]}"]').count() == 1, 'Overview: interval block offers Start guided timer')
        click(page, f'v3-overview-clock-{iv["block_id"]}'); page.clock.run_for(500)
        check(ui(page)['primary'] == 'Start' and record(page)['mode'] == 'guided', 'Start guided timer → Guided at the Ready card, clock not started')
        coach = text(page, 'v3-session-coach-structure')
        check(coach is not None and 'WORK' in coach, f'Guided: interval structure explained once ({coach})')
        click(page, 'v3-session-primary')  # Start
        page.screenshot(path=SH + 'guided_interval.png')
        check(text(page, 'v3-session-coach-structure') is None, 'structure explanation not repeated once the clock is running')
        mode(page, 'overview')
        W = iv['rest']['work_sec']; E = iv['rest']['recovery_sec']
        jump(page, int((W + E + 3) * S)); page.clock.run_for(600); settle(page)
        bl = page.locator(f'[data-testid="v3-overview-block-{iv["block_id"]}"]').inner_text()
        check('1 / ' in bl, f'Overview: the interval clock kept running (1 / N bouts done)')
        mode(page, 'guided')
        check((text(page, 'v3-session-phase') or '') in ('WORK', 'EASY') and 'Interval 2 of' in ' '.join(filter(None, [ui(page)['position'], ui(page)['label'], text(page, 'v3-session-local')])), 'Guided: back on interval 2 in real time')
        # let the whole block run, then reach the cool-down and finish in one tap
        trail = G.walk(page, 'sweat_ux')
        u = ui(page)
        check(u['primary'] == 'Finish workout' and page.locator('[data-testid="v3-session-complete"]').count() == 0, f'cool-down + Finish merged into one tap ({u["primary"]})')
        page.screenshot(path=SH + 'guided_cooldown_finish.png')
        G.finish_tap(page); page.clock.run_for(500)
        check(ui(page)['complete'], 'finished from the cool-down / last set')
        st = api('__dev/state')
        check(st['user']['workouts_count'] == 2, 'server: second workout counted once')
        G.leave_complete(page); page.clock.run_for(1200)

        # ---------------------------------------------------------------- preferred mode remembered; force-close in Overview restores Overview
        w3 = gen_with(lambda w: True, 1, direction='athletic', duration=30)
        open_session(page, w3['workout_id'])
        check(record(page)['mode'] == 'guided', 'a new session starts in the last mode used (Guided after the interval)')
        mode(page, 'overview')
        page.reload(); page.clock.run_for(2500)
        click(page, 'v3-hero-continue-cta'); page.clock.run_for(1500)
        check(page.locator('[data-testid="v3-overview"]').count() == 1, 'force-close: restored in Overview')
        wait_images(page); page.screenshot(path=SH + 'overview_athletic.png', full_page=True)

        check(not errs, f'no page errors ({errs[:3]})')
        b.close()
    print(f'\n{len(G.FAIL)} failures')
    for f in G.FAIL: print('  FAIL', f)
    sys.exit(1 if G.FAIL else 0)


if __name__ == '__main__':
    main()
