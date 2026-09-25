# mood_v3: MOOD V3 unified workout generation

Server-side generation for the three frozen V3 Directions behind one interface: `service.generate_workout(user_context)`.
The API contract is in [CONTRACT.md](CONTRACT.md).

```
request ─► normalize.py ─► service.py ─► engines/<direction>/adapter.py ─► frozen generator ─► frozen validator(s)
                                                                                             │ (retry / explicit conflict)
          router.py ◄── media + cues ◄── explain.py ◄── progression.py ◄── render.py + formatter.py (shared schema v3.0)
```

| Module | Role |
|---|---|
| `engines/strength/{audit_engine,qa_engine,prescription,structure}.py` | Frozen Strength reference generator v6 (WA v17 / ET v12 / SD v5 / Library v11) |
| `engines/sweat/{sweat_data,sweat_gen,sweat_validate}.py` | Frozen Sweat FINAL FREEZE v4 generator and validator |
| `engines/athletic/{athletic_gen,lib3,lib2,athletic_lib,audit2,sk5,sweat_shared_data}.py` | Frozen Athletic Reference Generator v1 and validator |
| `engines/VENDOR_PATCHES.md` | Every line changed while vendoring (paths and imports only) |
| `engines/state_rules.py` | SD v5 multi-State arbitration (the frozen Sweat implementation, shared read-only) |
| `engines/*/adapter.py` | Per-Direction production adapter: input translation, validation, exercise swap, conflicts |
| `normalize.py` | Unified input contract: States, soreness vocabulary, presets, Target / archetype rules |
| `formatter.py`, `render.py` | Shared app-facing schema and per-Direction mapping (formatting only) |
| `explain.py` | Built for Today, template-based and driven by generator events |
| `cues.py` | Launch cue layer: Olympic / explosive, Athletic quality-stop, unusual movements |
| `progression.py` | Conservative exact-exercise progression |
| `router.py` | FastAPI routes (`/api/v3/workouts/*`), Mongo `v3_workouts`, media enrichment from `db.exercises` |
| `data/` | The frozen workbooks the engines read at import (about 2.5 s at first use) |

## Tests

```
cd backend
python -m pytest -c mood_v3/pytest.ini mood_v3/tests -q           # 16 tests, about 40 s
python -m mood_v3.qa.run_unified_qa out.json                     # unified production QA (8,424 builds plus swaps, history and conflicts)
python -m mood_v3.qa.sample_pack pack.json pack.md               # the 15-workout production-output pack
```

- `tests/test_frozen_parity.py` replays each Direction's frozen QA harness against the vendored engines and requires byte-identical results.
- `tests/test_integration.py` requires the production adapters to reproduce the frozen generators on every frozen fixture, and runs the unified QA.
- `tests/test_router.py` covers the HTTP flow with an in-memory Mongo stand-in: generate, swap, complete, history, progression, conflicts and 422s.

## Rules for changing this package

- Don't edit `engines/*/` (except `adapter.py`) to change programming behavior. Those files are the frozen contracts. Any change must
  come from a founder-approved re-freeze and must keep `test_frozen_parity.py` green.
- A generated workout reaches the app only after its Direction validator passes. Anything else is an explicit conflict.
