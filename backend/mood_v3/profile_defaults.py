"""Persistent Training Profile -> /api/v3 request defaults (API layer only; the generators never see the profile).

Precedence for each persistent input: explicit request value > users.training_profile value > backend default.
Daily inputs (states, soreness, direction, target, archetype, date) are never filled from the profile.
"""
# request field -> training_profile field
PROFILE_FIELDS = {'goal': 'goal', 'experience': 'experience', 'training_frequency': 'training_frequency',
                  'training_preference': 'training_preference', 'equipment': 'default_equipment', 'duration': 'default_duration'}


def apply_profile_defaults(raw: dict, fields_set, profile) -> tuple:
    """-> (request dict, [request fields filled from the profile]). A field counts as explicit only when the client
    sent it with a non-null value."""
    out = dict(raw); applied = []
    p = profile or {}
    for field, pkey in PROFILE_FIELDS.items():
        explicit = field in (fields_set or ()) and raw.get(field) is not None
        if explicit or p.get(pkey) is None: continue
        out[field] = p[pkey]; applied.append(field)
    return out, applied
