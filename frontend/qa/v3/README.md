# V3 frontend QA (Phase 2.6)

Three layers, all against the real V3 sources (nothing here is shipped in the app):

| Layer | What it checks | Run |
|---|---|---|
| `logic/` | Home model (request builder, Focus / Workout Type rule, summaries), Preview structure formatter, Different Workout comparison, pack fixture sanity | `cd logic && npm i --prefix ../web && ln -sfn ../web/node_modules node_modules && node run.mjs` |
| `web/` | The real `app/v3`, `components/v3`, `utils/v3*` screens bundled with react-native-web. Only platform, auth, network and storage edges are stubbed (`web/stubs`). | `cd web && npm i && node build.mjs` |
| `e2e_flows.py` | Founder flows A to H through the real request builder -> real `/api/v3` router (in-memory DB) -> persistence -> Preview / Details, plus the stale-engine guards. Exits non-zero on any failure. | `python3 -m uvicorn devserver:app --port 8765` in this folder, then `python3 e2e_flows.py` (needs `pip install playwright` and a Chromium) |

`devserver.py` mounts `backend/mood_v3` exactly as `server.py` does, with an in-memory stand-in for Mongo and a fixed
intermediate / build-muscle training profile.
