"""End-to-end V3 completion against server.py's real hooks (entitlement, track_user_event, retention) on mongomock-motor.
Run from backend/:  pip install mongomock-motor && python3 mood_v3/qa/guided_session_completion_e2e.py
Expected: first call completed (streak 1, free workout consumed), second already_completed, workouts_count 1,
events [workout_completed, streak_extended], one user_workouts row."""
import sys, os, asyncio
sys.path.insert(0, '.')
os.environ.setdefault('MONGO_URL', 'mongodb://localhost:27017'); os.environ.setdefault('DB_NAME', 'test'); os.environ.setdefault('JWT_SECRET', 'x')
import server
from mongomock_motor import AsyncMongoMockClient
from bson import ObjectId
from fastapi.testclient import TestClient
mdb = AsyncMongoMockClient()['t']
server.db = mdb
# rebuild the v3 router + hooks against the mock db (the module-level hooks close over server.db by name)
import mood_v3.router as R
from fastapi import FastAPI
uid = ObjectId()
asyncio.get_event_loop().run_until_complete(mdb.users.insert_one({'_id': uid, 'email': 'e2e@x', 'workouts_count': 0}))
app = FastAPI()
app.include_router(R.build_v3_router(mdb, lambda: str(uid), server._v3_completion_hooks), prefix='/api')
c = TestClient(app)
w = c.post('/api/v3/workouts/generate', json=dict(direction='athletic', date='2026-10-05', duration=30)).json()['workout']
r1 = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(duration_actual=33, completed_steps=10, total_steps=12)).json()
r2 = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(duration_actual=33)).json()
loop = asyncio.get_event_loop()
u = loop.run_until_complete(mdb.users.find_one({'_id': uid}))
ev = loop.run_until_complete(mdb.user_events.find({'user_id': str(uid)}).to_list(50))
uw = loop.run_until_complete(mdb.user_workouts.find({}).to_list(50))
print('r1', r1['status'], r1['streak'], r1['access'])
print('r2', r2['status'])
print('user', {k: u.get(k) for k in ('workouts_count', 'free_workouts_used', 'free_workouts_period', 'rt_streak_current', 'rt_streak_last_day')})
print('events', [e['event_type'] for e in ev], 'user_workouts', len(uw))
