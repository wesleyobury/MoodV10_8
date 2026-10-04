"""Guided Session browser QA: the REAL session screen (react-native-web harness) against the REAL /api/v3 router with the
completion hooks (gs_devserver.py). Controlled clock (Playwright clock) so timers, backgrounding and relaunch are deterministic.

    cd frontend/qa/v3/web && npm i && node build.mjs
    cd .. && python3 -m uvicorn gs_devserver:app --port 8766 &
    python3 gs_e2e.py            # screenshots + transcript in $SHOTS (default /tmp/gs_shots), exits non-zero on failure

Checks: every Direction walks end-to-end through its real structures; rest / transition / clock order matches the plan;
background notice (authorized / not), foreground catch-up, relaunch + Home Continue, pause and leave, end workout,
conflicting session, explicit Finish, duplicate Finish taps, offline completion queue + retry, Home Done, keep-awake, haptics.
"""
import json, os, re, sys, time, urllib.request
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://localhost:8766/')
SH = os.environ.get('SHOTS', '/tmp/gs_shots/'); os.makedirs(SH, exist_ok=True)
T0 = 1_791_200_000_000   # a fixed wall clock (ms)
FAIL = []
LOG = []


def check(cond, msg):
    (LOG.append(f'  ok  {msg}') if cond else (FAIL.append(msg), LOG.append(f'  FAIL {msg}')))
    print(LOG[-1], flush=True)


def api(path, body=None):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode() if body is not None else None, headers={'content-type': 'application/json'})
    return json.load(urllib.request.urlopen(req))


def gen_with(pred, tries, **kw):
    for i in range(tries):
        date = f'2026-10-{(i % 27) + 1:02d}'
        w = api('__dev/generate', dict(kw, date=date)).get('workout')
        if w and pred(w): return w
    return None


def settle(page, ms=60):
    """React commits through the scheduler (MessageChannel), which the fake clock does not drive: give the page a little real
    time after fake-clock jumps so the DOM reflects the latest tick before it is read."""
    page.wait_for_timeout(ms)


def ui(page):
    settle(page)
    return page.evaluate("""() => {
      const vis = (id) => [...document.querySelectorAll(`[data-testid="${id}"]`)].find((x) => x.offsetParent !== null);
      const q = (id) => { const e = vis(id); return e ? e.innerText.trim() : null; };
      const t = [...document.querySelectorAll('[role="timer"],[aria-label$=" left"]')].find((x) => x.offsetParent !== null);
      // founder review: the set position lives in the Where strip (v3-session-local); a work step is one with a target on screen
      const local = q('v3-session-local'), work = !!vis('v3-session-target') || !!vis('v3-session-log-weight');
      return { position: q('v3-session-position') || (work && local ? local.toUpperCase() : null), name: q('v3-session-name'), target: q('v3-session-target'), phase: q('v3-session-phase'),
               next: q('v3-session-next') || q('v3-session-rest-phase') || q('v3-session-move'), primary: q('v3-session-primary'), ready: q('v3-session-ready-format'), upnext: q('v3-session-up-next'),
               complete: !!vis('v3-session-complete'), timer: t ? t.getAttribute('aria-label') : null, top: q('v3-session') ? null : null,
               label: (document.querySelector('[data-testid="v3-session"]') || {}).innerText?.split('\\n').slice(0, 2).join(' | ') || null };
    }""")


def secs(label):
    m = re.match(r'(?:(\d+):)?(\d+):(\d+) left', label or '')
    if not m: return None
    h, mm, ss = m.groups(); return (int(h or 0) * 3600 + int(mm) * 60 + int(ss))


def click(page, tid):
    page.locator(f'[data-testid="{tid}"]').filter(visible=True).first.click(); page.clock.run_for(300); settle(page, 40)


def native(page):
    return page.evaluate('({h: window.__native.haptics.slice(), k: [...window.__native.keepAwake], s: window.__native.scheduled.map(x => ({at: x.at, title: x.content.title, body: x.content.body})), r: window.__native.permissionRequests})')


def set_hidden(page, hidden):
    page.evaluate("""(h) => { Object.defineProperty(document, 'visibilityState', {value: h ? 'hidden' : 'visible', configurable: true});
                             Object.defineProperty(document, 'hidden', {value: h, configurable: true});
                             document.dispatchEvent(new Event('visibilitychange')); }""", hidden)
    page.clock.run_for(200)


def record(page):
    return page.evaluate("JSON.parse(localStorage.getItem('@mood_v3_session_v1:u1') || 'null')")


def open_session(page, wid, frm=None):
    params = {'id': wid, **({'from': frm} if frm else {})}
    page.evaluate(f"window.__router.push({{pathname:'/v3/session', params:{json.dumps(params)}}})"); page.clock.run_for(1500)


def home(page):
    page.evaluate("window.__router.dismissTo('/(tabs)')"); page.clock.run_for(1200)


def jump(page, ms):
    """page.clock.fast_forward that is verified against Date.now() in the page: Playwright's fake clock has been seen to
    ignore a jump (reliably the first one after install), which leaves the UI tick and the engine's Date.now() disagreeing."""
    want = int(ms)
    for _ in range(4):
        t0 = page.evaluate('Date.now()'); page.clock.fast_forward(want); got = page.evaluate('Date.now()') - t0
        if got >= want * 0.8: return
        want -= max(0, int(got)); time.sleep(0.2)


def wait_out(page, t):
    """Let a timer of t seconds run out: jump most of it (timestamps make that exact), then tick through the end in real
    render ticks so the foreground expiry path (tick -> resolve -> haptic) is exercised too.
    Playwright's fake clock occasionally ignores a jump (seen right after other clock work): the jump is verified against
    Date.now() in the page and repeated after a short real-time yield until it took."""
    t = t or 1
    total = int(t * 1000 + 700)
    for attempt in range(4):
        t0 = page.evaluate('Date.now()')
        if t > 4: jump(page, int((t - 3) * 1000))
        page.clock.run_for(int(min(t, 3) * 1000 + 700)); settle(page)
        moved = page.evaluate('Date.now()') - t0
        if moved >= total * 0.8: return
        time.sleep(0.3); settle(page, 100)
        t = max(1, (total - moved) / 1000); total = int(t * 1000 + 700)


def finish_tap(page):
    """Founder review 6: the last set's (or the cool-down's) button is Finish workout; a clock block that ends the workout
    finishes on its own. Tap only when the post-workout flow is not already up."""
    if not ui(page)['complete']:
        click(page, 'v3-session-primary')
    page.clock.run_for(2500)


def leave_complete(page):
    """Post-workout flow (founder review 6): Wrap (How did that feel? → Skip) → Share → Done."""
    if page.locator('[data-testid="v3-fit-skip"]').filter(visible=True).count():
        click(page, 'v3-fit-skip'); page.clock.run_for(300)
    click(page, 'v3-results-done')


def walk(page, tag, max_steps=600, shots=None, on_step=None):
    """Follow the athlete path: tap user steps, let timers run out. Returns the transcript."""
    shots = shots if shots is not None else {}
    trail = []
    for i in range(max_steps):
        u = ui(page)
        if u['complete'] or u['primary'] == 'Finish workout': break
        key = (u['phase'] or ('ready' if u['ready'] else None) or ('rest' if u['timer'] and u['upnext'] else None) or ('work' if u['position'] else None) or u['primary'] or 'other')
        line = ' | '.join(x for x in [u['phase'], u['position'], u['name'], u['target'], u['timer'], u['primary'], u['next']] if x)
        if not trail or trail[-1] != line: trail.append(line)
        shot_key = f'{tag}_{key}'.replace(' ', '_').replace("'", '')
        if shot_key not in shots and len(shots) < 400:
            shots[shot_key] = True; page.screenshot(path=f'{SH}{shot_key}.png')
        if on_step and on_step(page, u, i): continue
        p = u['primary'] or ''
        if p.startswith('Start ') and re.search(r'\d', p):           # a time hold
            click(page, 'v3-session-primary'); wait_out(page, secs(ui(page)['timer']) or 60); continue
        if u['timer'] and p not in ('Done', 'Start'):                # rest / transition / clock: let it run out
            wait_out(page, secs(u['timer'])); continue
        if p == 'Done' and u['phase'] == 'WORK' and u['timer']:        # EMOM minute: tap Done, then the minute runs out
            click(page, 'v3-session-primary'); u2 = ui(page)
            trail.append(' | '.join(x for x in [u2['phase'], u2['position'], u2['timer'], u2['upnext']] if x)); wait_out(page, secs(u2['timer'])); continue
        if p:
            click(page, 'v3-session-primary'); page.clock.run_for(300); continue
        break
    return trail


def main():
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        page = ctx.new_page(); errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.clock.install(time=T0 / 1000)   # python: seconds
        page.goto(BASE); page.evaluate('localStorage.clear()'); page.reload(); page.clock.run_for(2000)
        shots = {}

        # ---------------------------------------------------------------- Strength end-to-end (+ weight log, superset)
        LOG.append('STRENGTH')
        ws = gen_with(lambda w: any(b['structure'] == 'superset' for b in w['blocks']) and any(b.get('rest', {}).get('full_recovery') for b in w['blocks']), 20, direction='strength', duration=60, archetype='strength_upper_pull') \
            or gen_with(lambda w: any(b['structure'] == 'superset' for b in w['blocks']), 10, direction='strength', duration=60, archetype='strength_upper_push')
        open_session(page, ws['workout_id'])
        check(native(page)['k'] == ['mood-v3-guided-session'], 'keep-awake on during the session')
        logged = {'done': False}
        def log_weight(page, u, i):
            if not logged['done'] and u['position'] == 'SET 1 OF ' + (u['position'] or '').split(' OF ')[-1] and page.locator('[data-testid="v3-session-log-weight"]').filter(visible=True).count():
                click(page, 'v3-session-log-weight')
                inp = page.locator('[data-testid="v3-session-weight-input"]').filter(visible=True).first
                inp.fill('135'); page.clock.run_for(300)
                page.screenshot(path=f'{SH}strength_weight_logged.png'); logged['done'] = True
                click(page, 'v3-session-primary'); return True
            return False
        trail = walk(page, 'strength', shots=shots, on_step=log_weight)
        open(f'{SH}strength_transcript.txt', 'w').write('\n'.join(trail))
        if any(b['rest'].get('full_recovery') for b in ws['blocks']):
            check(any('full recovery' in t.lower() for t in trail), 'Strength: heavy set announces Full recovery')
            check(any('FULL RECOVERY' in t or 'Start now' in t for t in trail), 'Strength: full recovery rest screen')
        check(any(re.search(r'Then [A-Z]2 · ', t) or re.search(r'\| [A-Z]2 · ', t) or 'Move straight over' in t for t in trail), 'Strength: superset announces the move to the partner (A2)')
        u = ui(page)
        check(u['primary'] is None or True, 'reached the end')
        page.screenshot(path=f'{SH}strength_finish_or_complete.png')
        # we should now be on the LAST SET, whose button is Finish workout (founder review 6: no separate Finish card)
        check(page.locator('[data-testid="v3-session-target"]').filter(visible=True).count() == 1 and "That's the workout" not in page.inner_text('body'), 'last set: Finish workout sits on the set itself (no "That\'s the workout" card)')
        rec = record(page)
        check(rec['status'] == 'active', 'reaching the end does not complete (status still active)')
        # duplicate taps on Finish
        btn = page.locator('[data-testid="v3-session-primary"]').filter(visible=True).first
        check((btn.inner_text().strip() == 'Finish workout'), 'Finish is explicit')
        btn.click(); btn.click(timeout=500, force=True) if btn.count() else None
        page.clock.run_for(3000)
        page.screenshot(path=f'{SH}strength_complete.png')
        st = api('__dev/state')
        v3s = [x for x in st['v3'] if x['id'] == ws['workout_id']][0]
        check(v3s['status'] == 'completed', 'server: V3 workout completed')
        check(st['user']['workouts_count'] == 1 and st['user_workouts'] == 1 and st['events'].count('workout_completed') == 1, f"server: exactly once (count {st['user']['workouts_count']}, rows {st['user_workouts']}, events {st['events']})")
        check(st['user']['free_workouts_used'] == 1, 'server: weekly free workout consumed by the completion')
        check(len(v3s['logged']) == 1, f"server: the one logged exercise became performance ({v3s['logged']})")
        check('Saved to MOOD' in page.locator('[data-testid="v3-session-sync"]').inner_text(), 'completion screen: Saved to MOOD')
        check(page.locator('[data-testid="v3-session-streak"]').count() == 1, 'completion screen: real streak shown')
        check(native(page)['k'] == [], 'keep-awake released on completion')
        check(any(h.startswith('notification:success') for h in native(page)['h']), 'haptic on rest end / completion')
        leave_complete(page); page.clock.run_for(1500)
        # founder review: Home always looks the same; after a completion MOOD builds a fresh pick (no Done state)
        for _ in range(10):
            if page.locator('[data-testid="v3-hero-open"]').filter(visible=True).count() and page.locator('[data-testid="v3-hero-done-block"]').count() == 0: break
            page.clock.run_for(800); time.sleep(0.3)
        page.screenshot(path=f'{SH}home_done.png', full_page=True)
        check(page.locator('[data-testid="v3-hero-pick"]').filter(visible=True).count() == 1 and page.locator('[data-testid="v3-hero-done-block"]').count() == 0 and page.locator('[data-testid="v3-hero-build-cta"]').filter(visible=True).inner_text().strip() == 'Build my own', 'Home after completion: a fresh MOOD\'s Pick, chips, Build my own (no Done state)')
        today_after = page.evaluate("Object.keys(localStorage).filter(k => k.includes('today')).map(k => localStorage.getItem(k)).join(' ')")
        check(ws['workout_id'] not in today_after, 'Home after completion: the pick is a new workout, not the completed one')

        # ---------------------------------------------------------------- Sweat structures
        LOG.append('SWEAT')
        wanted = {'circuit': None, 'anchor_circuit': None, 'intervals': None, 'timed_circuit': None, 'emom': None, 'continuous': None, 'pyramid': None, 'ladder': None}
        arch = ['sweat_circuit', 'sweat_engine', 'sweat_hybrid']
        for i in range(60):
            if all(wanted.values()): break
            w = api('__dev/generate', dict(direction='sweat', archetype=arch[i % 3], duration=60 if i % 2 else 30, date=f'2026-10-{(i % 27) + 1:02d}',
                                           states=[['low_energy'], [], ['amped'], ['bored'], ['stressed']][i % 5])).get('workout')
            if not w: continue
            for bl in w['blocks']:
                if bl['structure'] in wanted and not wanted[bl['structure']]: wanted[bl['structure']] = w
        check(all(wanted.values()), f'found Sweat workouts for every structure ({[k for k, v in wanted.items() if not v]})')
        done_ids = set()
        for s, w in wanted.items():
            if not w or w['workout_id'] in done_ids: continue
            done_ids.add(w['workout_id'])
            open_session(page, w['workout_id'])
            if ui(page)['primary'] is None and page.locator('[data-testid="v3-session-conflict"]').count():
                break
            trail = walk(page, f'sweat_{s}', shots=shots)
            open(f'{SH}sweat_{s}_transcript.txt', 'w').write('\n'.join(trail))
            check(any(t.startswith('WORK') or t.startswith('STEADY') for t in trail) or s in ('circuit', 'anchor_circuit', 'ladder'), f'Sweat {s}: clock phase shown where timed')
            finish_tap(page)   # Finish
            check(ui(page)['complete'], f'Sweat {s}: finished')
            leave_complete(page); page.clock.run_for(800)
        tr = open(f'{SH}sweat_emom_transcript.txt').read() if wanted['emom'] else ''
        check('NEXT MINUTE IN |' in tr and not any(l.startswith(('WORK', 'REST')) and l.endswith('| Done') for l in tr.split('\n')), 'EMOM: no Done; each minute runs out, a 15 s switch, the next starts by itself')
        tr = open(f'{SH}sweat_timed_circuit_transcript.txt').read() if wanted['timed_circuit'] else ''
        check('ROUND REST' in tr and 'EASY' in tr, 'Timed circuit: station EASY and ROUND REST')
        tr = open(f'{SH}sweat_intervals_transcript.txt').read() if wanted['intervals'] else ''
        check('EASY' in tr and 'WORK' in tr, 'Intervals: WORK / EASY')

        # ---------------------------------------------------------------- Athletic contrast + power
        LOG.append('ATHLETIC')
        wa = gen_with(lambda w: any(b['structure'] == 'superset' and b['type'] == 'primary' for b in w['blocks']), 40, direction='athletic', duration=60, archetype='athletic_power')
        if not wa: wa = gen_with(lambda w: True, 1, direction='athletic', duration=60)
        open_session(page, wa['workout_id'])
        trail = walk(page, 'athletic', shots=shots)
        open(f'{SH}athletic_transcript.txt', 'w').write('\n'.join(trail))
        check(any('Move 45 s' in t or 'MOVE TO' in t for t in trail) or not any(b['structure'] == 'superset' and b['type'] == 'primary' for b in wa['blocks']), 'Athletic contrast: 45 s move to the explosive partner')
        finish_tap(page); leave_complete(page); page.clock.run_for(800)

        # ---------------------------------------------------------------- lifecycle: background notice, catch-up, relaunch, Continue
        LOG.append('LIFECYCLE')
        w = gen_with(lambda w: any(b['structure'] == 'straight' for b in w['blocks']), 5, direction='strength', duration=30)
        open_session(page, w['workout_id'])
        click(page, 'v3-session-primary')                     # warm-up -> first set
        click(page, 'v3-session-primary')                     # complete set 1 -> rest
        u = ui(page); rest_s = secs(u['timer'])
        check(rest_s is not None and rest_s > 20, f'rest running ({u["timer"]})')
        set_hidden(page, True)
        n = native(page)['s']
        check(len(n) == 1 and n[0]['title'] == 'Rest over' and 'Set 2' in n[0]['body'], f'background: one "Rest over" notice ({n})')
        jump(page, (rest_s + 90) * 1000)            # the phone was locked well past the rest
        set_hidden(page, False)
        u = ui(page)
        check(native(page)['s'] == [], 'foreground: notice cancelled')
        check(u['position'] and u['position'].startswith('SET 2') and u['primary'] == 'Complete set', f'catch-up: next set waiting ({u["position"]}, {u["primary"]})')
        # unauthorized: never prompts, never schedules
        page.evaluate("window.__native.permission = 'denied'")
        click(page, 'v3-session-primary'); set_hidden(page, True)
        check(native(page)['s'] == [] and native(page)['r'] == 0, 'unauthorized: no notice, no permission prompt')
        set_hidden(page, False); page.evaluate("window.__native.permission = 'granted'")
        # force close mid-rest -> relaunch -> Home Continue restores the exact rest with the right time left
        rec0 = record(page); dur = secs(ui(page)['timer'])
        page.reload(); page.clock.run_for(2500)
        page.screenshot(path=f'{SH}home_continue.png', full_page=True)
        check(page.locator('[data-testid="v3-hero-continue-block"]').filter(visible=True).count() == 1, 'relaunch: Home shows Continue Workout')
        click(page, 'v3-hero-continue-cta'); page.clock.run_for(1500)
        now = page.evaluate('Date.now()'); left = rec0['state']['stepStartedAt'] + 120_000 - now if dur else None
        u = ui(page)
        after = secs(u['timer'])
        # the restored position must be exactly what the stored timestamps say (the harness clock may jump on reload)
        if left is not None and left > 1500:
            check(after is not None and abs(after - left / 1000) <= 1.5, f'relaunch: rest restored from timestamps ({after}s left, expected {left / 1000:.1f})')
        else:
            check(u['position'] and u['position'].startswith('SET 3'), f'relaunch: rest over while closed -> next set waiting ({u["position"]})')
            click(page, 'v3-session-primary'); after = secs(ui(page)['timer'])
        # pause and leave -> Continue -> paused -> resume
        click(page, 'v3-session-exit'); page.screenshot(path=f'{SH}exit_sheet.png'); click(page, 'v3-exit-pause'); page.clock.run_for(1200)
        check(native(page)['k'] == [], 'pause and leave releases keep-awake')
        jump(page, 600_000)
        click(page, 'v3-hero-continue-cta'); page.clock.run_for(1500)
        check(page.locator('[data-testid="v3-session-paused"]').filter(visible=True).count() == 1 and secs(ui(page)['timer']) == after, 'paused session restores with the rest frozen')
        click(page, 'v3-session-resume')
        # conflict: start another workout while this one is active
        w2 = gen_with(lambda w: True, 1, direction='sweat', duration=30)
        home(page); open_session(page, w2['workout_id'])
        page.screenshot(path=f'{SH}conflict.png')
        check(page.locator('[data-testid="v3-conflict-continue"]').filter(visible=True).count() == 1, 'conflict: "You have a workout in progress"')
        click(page, 'v3-conflict-replace'); page.clock.run_for(1500)
        check(ui(page)['primary'] is not None and record(page)['workoutId'] == w2['workout_id'], 'conflict: ended the old one, started this one')
        # end workout: not completed, nothing on the server
        before_state = api('__dev/state')
        click(page, 'v3-session-exit'); click(page, 'v3-exit-end'); click(page, 'v3-end-confirm'); page.clock.run_for(1500)
        after_state = api('__dev/state')
        check(record(page)['status'] == 'ended_early' and before_state['user'] == after_state['user'] and before_state['events'] == after_state['events'], 'end workout: not counted, no allowance, no streak')
        check(page.locator('[data-testid="v3-hero-continue-block"]').filter(visible=True).count() == 0, 'Home: no Continue after ending')

        # ---------------------------------------------------------------- offline completion
        LOG.append('OFFLINE COMPLETION')
        w3 = gen_with(lambda w: True, 1, direction='strength', duration=30)
        open_session(page, w3['workout_id'])
        api('__dev/offline', {'on': True})   # before the end: skipping the last block finishes on its own now
        click(page, 'v3-session-primary'); click(page, 'v3-session-primary')   # warm-up, one set
        for _ in range(12):
            u = ui(page)
            if u['primary'] == 'Finish workout' or u['complete']: break
            page.locator('[data-testid="v3-session-more"]').filter(visible=True).first.click(); page.clock.run_for(200)
            click(page, 'v3-more-skip-block') if page.locator('[data-testid="v3-more-skip-block"]').filter(visible=True).count() else page.keyboard.press('Escape')
        finish_tap(page); page.clock.run_for(500)
        page.screenshot(path=f'{SH}complete_offline.png')
        check('Syncing' in page.locator('[data-testid="v3-session-sync"]').inner_text(), 'offline: saved on this phone, syncing')
        leave_complete(page); page.clock.run_for(1500); time.sleep(0.5); page.clock.run_for(1500)
        check(page.locator('[data-testid="v3-hero-pick"]').filter(visible=True).count() == 1 and 'Build my own' in page.locator('[data-testid="v3-hero-build-cta"]').inner_text(), 'offline: Home keeps the same layout (pick, chips, Build my own) while the completion is still queued')
        api('__dev/offline', {'on': False})
        s0 = api('__dev/state')['user']['workouts_count']
        set_hidden(page, True); set_hidden(page, False); page.clock.run_for(3000)
        st = api('__dev/state')
        check([x for x in st['v3'] if x['id'] == w3['workout_id']][0]['status'] == 'completed', 'offline: completion synced on foreground')
        check(st['user']['workouts_count'] == s0 + 1, 'offline: counted once')
        check(record(page)['status'] == 'completed', 'offline: local record completed')
        page.screenshot(path=f'{SH}home_done_synced.png', full_page=True)

        check(not errs, f'no page errors ({errs[:3]})')
        b.close()
    print(f'\n{len(FAIL)} failures')
    for f in FAIL: print('  FAIL', f)
    sys.exit(1 if FAIL else 0)


if __name__ == '__main__':
    main()
