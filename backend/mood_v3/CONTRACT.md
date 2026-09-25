# MOOD V3 workout API contract (schema v3.0)

All routes live under `/api/v3` and need the normal bearer token (`get_current_user`).

## 1. Unified input: `POST /api/v3/workouts/generate`

```json
{
  "direction": "strength",            // "strength" | "sweat" | "athletic"; omit to use the cold-start resolver (training_preference, then goal)
  "states": ["low_energy", "bored"],  // 0-3 of low_energy, stressed, bored, irritated, amped, sore. "normal" is ignored
  "soreness": ["legs", "shoulders"],  // body-map regions (legs, chest, back, upper_back, lower_back, shoulders, arms, core) or muscle ids.
                                      // Giving soreness adds the "sore" State. Sore + 2 other States is the 3-State maximum
  "target": ["chest", "triceps"],     // Strength / Sweat only: 1-3 user-facing muscles, or "full_body". Omit for MOOD's Pick
  "archetype": null,                  // an explicit archetype, e.g. "sweat_engine", "athletic_power", "strength_upper_pull"; omit for MOOD's Pick
  "duration": 60,                     // 30 | 60 (the only V3 durations)
  "experience": "intermediate",       // beginner | intermediate | advanced
  "goal": "build_muscle",             // onboarding goal id (WA GOAL MAPPING); default stay_consistent
  "equipment": "commercial_gym",      // commercial_gym | free_weight_limited | minimal
  "training_frequency": "3-4",        // 1-2 | 3-4 | 5+ (Strength MOOD's Pick rotation only)
  "training_preference": null,        // lifting | conditioning | athletic | mix (used only when direction is omitted)
  "date": "2026-10-05",               // the user's local date; same inputs on the same day give the same workout
  "persist": true                     // false = live preview for the home card (not stored, not swappable)
}
```

**Training-profile fallback (Phase 1).** Any of `goal`, `experience`, `training_frequency`, `training_preference`, `equipment` and `duration` left out of the request (or sent as null) is filled from the caller's `users.training_profile` (`GET/PUT /api/users/me/training-profile`), and then from the backend defaults above. Precedence: explicit request > training profile > backend default. The envelope reports which fields were filled from the profile in `profile_defaults_applied` (for example `{"goal": "build_muscle", "duration": 60}`); it is `{}` when nothing was filled. Daily inputs (States, soreness, Target, archetype) are never stored in or read from the profile.

Invalid input returns HTTP 422 `{field, message}`. Examples: duration 45, 4 States, a muscle Target on Athletic, an archetype from another Direction, or both a Sweat archetype and a Target.

Equipment preset mapping (each Direction uses the preset its frozen QA ran on):

| Preset | Strength | Sweat | Athletic |
|---|---|---|---|
| commercial_gym | frozen commercial default (every controlled value except sled) | sweat_commercial_default (includes sled + turf, founder change) | athletic_commercial_default |
| free_weight_limited | DB, KB, bench, box, bands, pull-up bar, med ball, slam ball, jump rope | free_weight_limited | free_weight_limited |
| minimal | DB, bench, jump rope, bodyweight | db_bodyweight_only | bodyweight_floor |

## 2. Unified output (every endpoint returns this envelope)

```json
{
  "schema_version": "v3.0",
  "status": "ok",                       // "ok" | "conflict"
  "outcome": "valid",                   // valid | valid_with_relaxation | rerouted | conflict
  "conflict": null,                     // see section 4
  "workout": {
    "workout_id": "…", "version": 1, "created_at": "…",
    "direction": "strength", "direction_name": "Strength",
    "archetype": {"id": "strength_upper_push", "name": "Upper Push"},
    "requested_archetype": null,        // set when soreness rerouted MOOD's Pick
    "target": {"mode": "explicit", "muscles": ["chest","triceps"], "label": "Chest + Triceps"},   // mode: moods_pick | explicit | full_body | archetype
    "duration": {"requested_minutes": 60, "estimated_minutes": 42.0, "display": "40–45 min"},
    "experience": "advanced", "states": ["amped"],
    "soreness": {"regions": [], "muscles": [], "trained_anyway": []},
    "equipment": {"preset": "commercial_gym", "label": "Commercial gym"},
    "swap_count": 0,
    "built_for_today": [{"code": "state_amped", "text": "Extra output goes into heavier, faster or higher-volume work where it fits."}],
    "warmup": {"minutes": 7, "items": [], "guidance": "5-8 min: easy cardio and mobility, then 2-3 lighter ramp-up sets of …"},
    "blocks": [ /* ordered, see below */ ],
    "cooldown": null,                   // Sweat: {"minutes": 5, "guidance": "…"}
    "relaxations": [],                  // logged frozen relaxations (e.g. duration_underfill_accepted); for QA / support, not UI copy
    "adjustments": [ /* generator decision log (WA "adjustment" objects); the only source for explanations */ ]
  }
}
```

**Block**

```json
{"block_id": "B4", "sequence": 4, "type": "accessory", "structure": "superset", "title": "Superset",
 "rounds": 2, "rest_between_items_sec": 15, "rest_between_rounds_sec": 60,
 "interval": null, "effort": null, "instructions": "Alternate the two exercises; rest after each round.", "est_minutes": null,
 "items": [ /* items */ ]}
```

- `type`. Strength: main, secondary, target, accessory, finisher. Sweat: primary, complement, finisher. Athletic: primary, secondary, repeats, support.
- `structure`. Strength: straight, superset, circuit, pyramid, ladder, finisher. Sweat: continuous, intervals, timed_circuit, pyramid, circuit, anchor_circuit, emom, ladder, finisher. Athletic: exposure, repeats, straight.
- `interval`. Sweat only: `{work_sec, recovery_sec, rounds, rest_between_rounds_sec?, alternate?}`, or `{steps_sec, recovery_sec}` for pyramids, or `{minutes, rounds}` for EMOMs. `effort`: Sweat `{rpe: [lo, hi]}`.

**Item**

```json
{"item_id": "primary_press",           // stable across swaps; use it for swap / completion calls
 "slot_id": "primary_press", "role": "Primary Press",
 "exercise": {"id": "barbell_bench_press", "name": "Barbell Bench Press", "equipment": "barbell", "equipment_label": "Barbell",
              "primary_muscles": ["chest"], "media": {"video_url": "…", "thumbnail_url": "…", "library_id": "…"}},
 "prescription": {"kind": "reps", "sets": 4, "reps": "6", "reps_scheme": null, "per_side": false,
                  "seconds": null, "distance_m": null, "calories": null, "rest_sec": 150, "rir": 2, "rpe": null,
                  "load_guidance": "Stop each set with about 2 reps left in the tank.", "display": "4 × 6",
                  "direction_fields": {"slot_class": "primary_compound", "protected": true}},
 "cues": ["Shoulder blades pinned, feet planted; touch the lower chest."],
 "quality_stop": null,                 // Athletic exposures: "End the set when jump height drops or landings get loud and heavy."
 "swap": {"swappable": true},
 "progression": null}                  // or {reference, suggestion, text}; only from exact-exercise history
```

- `prescription.kind` is one of reps, time, distance or calories. `display` is always ready to render.
- Direction-specific `direction_fields`:
  - Strength: `slot_class`, `protected`.
  - Sweat: `progression` (`output` or `reuse_load`, from SC5), `role`, and `rounds` for anchor stations (the rounds that station appears in).
  - Athletic: `type` (A = technical / quality-dominant, B = repeatable ballistic, support, repeats), `quality`, and for Performance Support `purpose` and `why`.
- `media` is null when the exercise library has no matching video. `cues` fall back to the library's cues.

## 3. Other endpoints

| Call | Body | Result |
|---|---|---|
| `GET /api/v3/workouts/{id}` | | the latest envelope |
| `POST /api/v3/workouts/{id}/swap-exercise` | `{"item_id": "…", "reason": "dont_have"}` | a new envelope (`version` + 1, `workout.swapped_item {item_id, from, to}`), or `status: conflict` with `code: no_alternative` and the workout unchanged. 409 once completed; 409 `workout_outdated` if the generator changed since the workout was built |
| `POST /api/v3/workouts/{id}/swap-workout` | | the same Direction / Target / duration / States / soreness / equipment with `swap_count` + 1 |
| `POST /api/v3/workouts/{id}/complete` | `{"performance": [{"item_id": "…", "sets": [{"reps": 6, "load": 100, "unit": "kg"}]}], "fit_rating": "just_right", "mood_after": "better", "duration_actual": 44}` | stores history and exact-exercise logs. Keep calling `POST /api/user-workouts` as today for streaks, counters and the paywall |
| `GET /api/v3/workouts/history?limit=20` | | completed V3 workout summaries |

## 4. Conflicts (never a degraded workout)

```json
{"status": "conflict", "outcome": "conflict", "workout": null,
 "conflict": {"code": "sore_target_conflict", "message": "Speed + Agility needs your legs, and they are sore today.",
              "options": [{"action": "moods_pick", "label": "Let MOOD pick", "patch": {"target": null, "archetype": null}},
                          {"action": "switch_direction", "label": "Try Strength", "patch": {"direction": "strength", "target": null, "archetype": null}}],
              "adjustments": [ … ]}}
```

- Codes:
  - `sore_target_conflict`: an explicit choice that soreness blocks (S3 terminal UX).
  - `equipment_insufficient`: a Sweat archetype, or Athletic with sore legs, that the equipment can't support.
  - `cannot_build`: an explicit Strength Target / archetype the equipment and level can't build.
  - `no_alternative`: swap only.
  - `generation_failed`: never observed in QA. It means validation failed after deterministic retries.
- Each option's `patch` is the change to re-send to `/generate`. A `null` patch means "open the picker".
