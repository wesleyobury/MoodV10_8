"""Guided Session dev server: the web harness + the REAL /api/v3 router with the Guided Session completion hooks over an
in-memory DB (users / user_workouts / user_events, real entitlement rules, a streak stand-in). QA only.

    cd frontend/qa/v3 && python3 -m uvicorn gs_devserver:app --port 8766
    POST /__dev/generate {direction, ...}   -> a persisted V3 workout for the dev user (the Build screen is not in the harness)
    GET  /__dev/state                        -> users / user_workouts / events / v3 statuses (for assertions)
    POST /__dev/offline {on: true|false}     -> make /complete fail like a dead network (503) to exercise the retry queue
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '..', '..', '..', 'backend')))
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from mood_v3.router import build_v3_router
from mood_v3.tests.test_v3_completion import _DB, _hooks

UID = 'u1'
db = _DB(); db.users.docs.append({'_id': UID, 'workouts_count': 0})
events = []
OFF = {'on': False}
app = FastAPI()

@app.middleware('http')
async def offline(request: Request, call_next):
    if OFF['on'] and request.url.path.endswith('/complete'):
        return JSONResponse({'detail': 'offline'}, status_code=503)
    return await call_next(request)

r = build_v3_router(db, lambda: UID, _hooks(db, events))
app.include_router(r, prefix='/api')

@app.post('/__dev/generate')
async def dev_generate(body: dict):
    from fastapi.testclient import TestClient  # noqa
    from mood_v3 import service
    import datetime as dt
    env, state = service.generate_workout(dict(dict(date='2026-10-05', duration=60, persist=True), **body), UID)
    if env.get('status') == 'ok':
        wid = __import__('uuid').uuid4().hex; env['workout']['workout_id'] = wid
        now = dt.datetime.now(dt.timezone.utc)
        await db.v3_workouts.insert_one({'_id': wid, 'user_id': UID, 'status': 'generated', 'created_at': now, 'updated_at': now, 'state': state, 'envelope': env})
    return env

@app.get('/__dev/state')
async def dev_state():
    u = db.users.docs[0]
    return {'user': {k: u.get(k) for k in ('workouts_count', 'free_workouts_used', 'free_workouts_period', 'rt_streak_current')},
            'user_workouts': len(db.user_workouts.docs), 'events': [e[1] for e in events],
            'v3': [{'id': d['_id'], 'status': d['status'], 'logged': list((d.get('performance_entries') or {}).keys()), 'duration': d.get('duration_actual'),
                    'fit_rating': d.get('fit_rating'), 'after': {k: v for k, v in (d.get('after') or {}).items() if k != 'updated_at'}} for d in db.v3_workouts.docs]}

@app.post('/__dev/offline')
async def dev_offline(body: dict):
    OFF['on'] = bool(body.get('on')); return OFF

app.mount('/', StaticFiles(directory=os.path.join(HERE, 'web', 'dist'), html=True), name='static')
