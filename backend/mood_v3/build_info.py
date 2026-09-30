"""Engine build identity (Phase 2.6).

`ENGINE_PHASE` is bumped by hand when approved generation behavior changes. `ENGINE_BUILD` is a fingerprint of this
package's source at import time, so a Python process that is still running old code reports an old build. The app's
dev build compares it (GET /api/v3/version) and warns when the backend is stale; every envelope carries it so a cached
workout from an older engine is never reopened as if it were a fresh build.
"""
from __future__ import annotations
import datetime as _dt, hashlib, pathlib

ENGINE_PHASE = '3.4-athletic-frozen'


def _fingerprint() -> str:
    root = pathlib.Path(__file__).resolve().parent
    h = hashlib.sha1()
    for p in sorted(root.rglob('*.py')):
        rel = p.relative_to(root).as_posix()
        if rel.startswith(('tests/', 'qa/')): continue
        h.update(rel.encode()); h.update(p.read_bytes())
    return h.hexdigest()[:12]


ENGINE_BUILD = _fingerprint()
STARTED_AT = _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat()


def info() -> dict:
    return dict(engine_phase=ENGINE_PHASE, engine_build=ENGINE_BUILD, started_at=STARTED_AT)
