"""In-memory dev server for the V3 web harness and e2e flows: the REAL /api/v3 router (backend/mood_v3) + the training
profile router over an in-memory DB, serving the web harness bundle. No Mongo, no auth.

    cd frontend/qa/v3 && python3 -m uvicorn devserver:app --port 8765
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.abspath(os.path.join(HERE, '..', '..', '..', 'backend')))
from bson import ObjectId
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from mood_v3.router import build_v3_router
from training_profile import build_training_profile_router
from mood_v3.tests.test_router import _DB, _Col

UID = ObjectId()
db = _DB(); db.users = _Col()
PROFILE = dict(training_preference=os.environ.get('PREF', 'mix'), goal='build_muscle', experience='intermediate', training_frequency='3-4', biggest_barrier='low_energy')
db.users.docs.append({'_id': UID, 'username': 'dev', 'training_profile': PROFILE})
app = FastAPI()
app.include_router(build_v3_router(db, lambda: str(UID)), prefix='/api')
app.include_router(build_training_profile_router(db, lambda: str(UID)), prefix='/api')
app.mount('/', StaticFiles(directory=os.environ.get('STATIC', os.path.join(HERE, 'web', 'dist')), html=True), name='static')
