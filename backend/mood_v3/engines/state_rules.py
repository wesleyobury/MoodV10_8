"""SD v5 MULTI-STATE ARBITRATION, shared.

The frozen Sweat generator already implements SD v5 multi-State arbitration (sum-and-clamp, named pair rows as surgical
overrides, pair tie-break order Sore > Low Energy > Stressed > Irritated > Bored + Amped, Amped-at-30 and Low-Energy-Extras
rules). Strength's frozen reference generator was only ever exercised with a single State, so the production Strength
multi-State layer reuses this exact function instead of re-deriving the rules. Imported read-only.
"""
from .sweat.sweat_gen import resolve_dials, SM, PAIRS, PAIR_ORDER  # noqa: F401  (frozen SD v5 implementation)
