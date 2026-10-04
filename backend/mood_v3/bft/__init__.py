"""Built for Today (Oct 2026 quality pass).

    finished workout + generation trace  ->  brief.build()   verified facts only, ranked into a story
                                          ->  compose()       deterministic coach-voice composer (always runs, never fails the workout)
                                          ->  llm.upgrade()   optional: an LLM rewrites from the SAME brief, async in the router,
                                                              bounded by a timeout, accepted only if it passes the same gate

The workout is fully built before any of this runs; nothing here can change a prescription.
"""
from __future__ import annotations
from . import brief as _brief, compose as _compose, gate

FALLBACK = "Built from today's choices and your training history."


def build(ctx, res, workout, history_records=(), recent=()):
    """-> (blurb dict, Brief). Never raises: a failure here falls back to a plain line so the workout always ships."""
    try:
        B = _brief.build(ctx, res, workout, history_records)
        out = _compose.compose(B, recent)
        if out and out['text']:
            return dict(text=out['text'], source='composer', frame=out['frame'], facts=out['facts'], claims=out['claims'], gate=out['gate']), B
        return dict(text=FALLBACK, source='fallback', frame=None, facts=[], claims=[], gate=None), B
    except Exception as ex:   # the explanation layer must never break a workout
        return dict(text=FALLBACK, source='fallback', frame=None, facts=[], claims=[], gate=dict(ok=False, problems=[repr(ex)])), None
