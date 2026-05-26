"""
Workout Drafts (Saved Builds) — persistent in-progress and ready-to-start workout
builds. Supports both authenticated users and guest users (via device_id).

Status lifecycle:
  in_progress     — user has started a build (something in cart) but hasn't generated/finished
  ready_to_start  — cart finalized; preview screen reached, but workout not begun
  started         — user tapped "Begin Workout"
  completed       — workout session finished
  abandoned       — no activity for 30 minutes mid-build
  expired         — past expires_at (default 30 days from creation)

Caps & limits:
  - Active drafts (in_progress + ready_to_start + started) per identity: 20
    Excess auto-pruned (oldest non-pinned first).
  - Pinned drafts per identity: 3 (enforced at pin-time).
  - TTL: 30 days from creation. Backend trims `expired` at read time.
"""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field


# --- Constants -------------------------------------------------------------
ACTIVE_STATUSES = {"in_progress", "ready_to_start", "started"}
TERMINAL_STATUSES = {"completed", "abandoned", "expired"}
ALL_STATUSES = ACTIVE_STATUSES | TERMINAL_STATUSES

MAX_ACTIVE_DRAFTS = 20
MAX_PINNED_DRAFTS = 3
DEFAULT_TTL_DAYS = 30
ABANDON_AFTER_MINUTES = 30
STALE_AFTER_DAYS = 7  # used by frontend; informational here


# --- Pydantic models -------------------------------------------------------
class DraftMoodInput(BaseModel):
    category: str  # e.g. "Muscle Gainer", "Sweat", "Build Explosion", "I'm Feeling Lazy", "Calisthenics", "Outdoor"
    card: Optional[str] = None  # specific mood card / sub-mood (free-form)


class DraftCreate(BaseModel):
    device_id: Optional[str] = None  # required for guests
    title: Optional[str] = None
    mood_input: DraftMoodInput
    energy_input: Optional[Dict[str, Any]] = None
    preference_inputs: Optional[Dict[str, Any]] = None
    generated_workout: Optional[List[Dict[str, Any]]] = None
    resume_route: Optional[str] = None
    resume_params: Optional[Dict[str, Any]] = None
    thumbnail_url: Optional[str] = None
    step_count: Optional[int] = None
    current_step: Optional[int] = None
    status: Optional[str] = "in_progress"


class DraftUpdate(BaseModel):
    title: Optional[str] = None
    mood_input: Optional[DraftMoodInput] = None
    energy_input: Optional[Dict[str, Any]] = None
    preference_inputs: Optional[Dict[str, Any]] = None
    generated_workout: Optional[List[Dict[str, Any]]] = None
    resume_route: Optional[str] = None
    resume_params: Optional[Dict[str, Any]] = None
    thumbnail_url: Optional[str] = None
    step_count: Optional[int] = None
    current_step: Optional[int] = None
    status: Optional[str] = None
    pinned: Optional[bool] = None


class GuestMergeRequest(BaseModel):
    device_id: str


# --- Helpers ---------------------------------------------------------------
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert a Mongo draft doc to a JSON-safe dict (no _id)."""
    out = {
        "id": str(doc["_id"]),
        "user_id": doc.get("user_id"),
        "device_id": doc.get("device_id"),
        "title": doc.get("title") or "",
        "mood_input": doc.get("mood_input") or {},
        "energy_input": doc.get("energy_input"),
        "preference_inputs": doc.get("preference_inputs") or {},
        "generated_workout": doc.get("generated_workout"),
        "resume_route": doc.get("resume_route") or "/cart",
        "resume_params": doc.get("resume_params") or {},
        "thumbnail_url": doc.get("thumbnail_url"),
        "step_count": doc.get("step_count") or 0,
        "current_step": doc.get("current_step") or 0,
        "status": doc.get("status") or "in_progress",
        "pinned": bool(doc.get("pinned", False)),
        "created_at": doc["created_at"].isoformat() if doc.get("created_at") else None,
        "last_modified_at": doc["last_modified_at"].isoformat() if doc.get("last_modified_at") else None,
        "last_viewed_at": doc["last_viewed_at"].isoformat() if doc.get("last_viewed_at") else None,
        "expires_at": doc["expires_at"].isoformat() if doc.get("expires_at") else None,
    }
    return out


def _identity_filter(user_id: Optional[str], device_id: Optional[str]) -> Dict[str, Any]:
    """Filter that matches drafts owned by the current identity (user OR device)."""
    if user_id:
        return {"user_id": user_id}
    if device_id:
        return {"device_id": device_id, "user_id": None}
    raise HTTPException(status_code=400, detail="Authentication or device_id required")


async def _auto_abandon_and_expire(db, filt: Dict[str, Any]) -> None:
    """Mark stale drafts:
       - status=in_progress with no activity for ABANDON_AFTER_MINUTES → abandoned
       - any non-terminal status past expires_at → expired
    """
    now = _now()
    abandon_cutoff = now - timedelta(minutes=ABANDON_AFTER_MINUTES)

    await db.workout_drafts.update_many(
        {
            **filt,
            "status": "in_progress",
            "last_modified_at": {"$lt": abandon_cutoff},
        },
        {"$set": {"status": "abandoned"}},
    )
    await db.workout_drafts.update_many(
        {
            **filt,
            "status": {"$nin": list(TERMINAL_STATUSES)},
            "expires_at": {"$lt": now},
        },
        {"$set": {"status": "expired"}},
    )


async def _prune_active_overflow(db, filt: Dict[str, Any]) -> None:
    """If active drafts > MAX_ACTIVE_DRAFTS, delete the oldest non-pinned ones."""
    active = await db.workout_drafts.find(
        {**filt, "status": {"$in": list(ACTIVE_STATUSES)}},
        sort=[("pinned", -1), ("last_modified_at", -1)],
    ).to_list(length=1000)
    if len(active) <= MAX_ACTIVE_DRAFTS:
        return
    # Delete from oldest non-pinned end
    overflow = [d for d in active[MAX_ACTIVE_DRAFTS:] if not d.get("pinned")]
    if not overflow:
        return
    ids = [d["_id"] for d in overflow]
    await db.workout_drafts.delete_many({"_id": {"$in": ids}})


# --- Router factory --------------------------------------------------------
def build_workout_drafts_router(
    db,
    get_current_user,
    get_optional_current_user,
) -> APIRouter:
    """
    Build the workout drafts APIRouter. We pass dependencies in so this module
    stays decoupled from server.py's import graph.
    """
    router = APIRouter(prefix="/workout-drafts", tags=["workout-drafts"])

    async def _resolve_identity(
        user_id: Optional[str],
        device_id: Optional[str],
    ) -> Dict[str, Any]:
        if user_id:
            return {"user_id": user_id}
        if not device_id:
            raise HTTPException(
                status_code=400,
                detail="device_id required for guest requests",
            )
        return {"device_id": device_id, "user_id": None}

    # ----- CREATE ----------------------------------------------------------
    @router.post("")
    async def create_draft(
        body: DraftCreate,
        current_user_id: Optional[str] = Depends(get_optional_current_user),
    ):
        identity = await _resolve_identity(current_user_id, body.device_id)
        now = _now()
        status = body.status or "in_progress"
        if status not in ALL_STATUSES:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")

        doc = {
            "user_id": identity.get("user_id"),
            "device_id": identity.get("device_id"),
            "title": body.title or "",
            "mood_input": body.mood_input.dict(),
            "energy_input": body.energy_input,
            "preference_inputs": body.preference_inputs or {},
            "generated_workout": body.generated_workout,
            "resume_route": body.resume_route or "/cart",
            "resume_params": body.resume_params or {},
            "thumbnail_url": body.thumbnail_url,
            "step_count": body.step_count or 0,
            "current_step": body.current_step or 0,
            "status": status,
            "pinned": False,
            "created_at": now,
            "last_modified_at": now,
            "last_viewed_at": now,
            "expires_at": now + timedelta(days=DEFAULT_TTL_DAYS),
        }
        result = await db.workout_drafts.insert_one(doc)
        doc["_id"] = result.inserted_id

        # Prune overflow asynchronously (still in request — small cost)
        await _prune_active_overflow(db, _identity_filter(current_user_id, body.device_id))

        return _serialize(doc)

    # ----- LIST ------------------------------------------------------------
    @router.get("")
    async def list_drafts(
        device_id: Optional[str] = Query(None),
        include_completed: bool = Query(False),
        limit: int = Query(50, ge=1, le=200),
        current_user_id: Optional[str] = Depends(get_optional_current_user),
    ):
        filt = _identity_filter(current_user_id, device_id)

        # Recompute auto-abandon / expire before listing
        await _auto_abandon_and_expire(db, filt)

        query: Dict[str, Any] = {**filt}
        if not include_completed:
            query["status"] = {"$nin": ["completed"]}

        cursor = db.workout_drafts.find(query).sort(
            [("pinned", -1), ("last_modified_at", -1)]
        ).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [_serialize(d) for d in docs]

    # ----- COUNT (for badge) -----------------------------------------------
    @router.get("/count")
    async def count_drafts(
        device_id: Optional[str] = Query(None),
        current_user_id: Optional[str] = Depends(get_optional_current_user),
    ):
        try:
            filt = _identity_filter(current_user_id, device_id)
        except HTTPException:
            return {"count": 0}
        await _auto_abandon_and_expire(db, filt)
        count = await db.workout_drafts.count_documents(
            {**filt, "status": {"$in": list(ACTIVE_STATUSES)}}
        )
        return {"count": count}

    # ----- GET ONE ---------------------------------------------------------
    @router.get("/{draft_id}")
    async def get_draft(
        draft_id: str,
        device_id: Optional[str] = Query(None),
        current_user_id: Optional[str] = Depends(get_optional_current_user),
    ):
        filt = _identity_filter(current_user_id, device_id)
        try:
            oid = ObjectId(draft_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Draft not found")

        doc = await db.workout_drafts.find_one({"_id": oid, **filt})
        if not doc:
            raise HTTPException(status_code=404, detail="Draft not found")

        # Bump last_viewed_at
        await db.workout_drafts.update_one(
            {"_id": oid}, {"$set": {"last_viewed_at": _now()}}
        )
        doc["last_viewed_at"] = _now()
        return _serialize(doc)

    # ----- UPDATE ----------------------------------------------------------
    @router.patch("/{draft_id}")
    async def update_draft(
        draft_id: str,
        body: DraftUpdate,
        device_id: Optional[str] = Query(None),
        current_user_id: Optional[str] = Depends(get_optional_current_user),
    ):
        filt = _identity_filter(current_user_id, device_id)
        try:
            oid = ObjectId(draft_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Draft not found")

        existing = await db.workout_drafts.find_one({"_id": oid, **filt})
        if not existing:
            raise HTTPException(status_code=404, detail="Draft not found")

        updates: Dict[str, Any] = {}
        payload = body.dict(exclude_unset=True)

        if "status" in payload:
            new_status = payload["status"]
            if new_status not in ALL_STATUSES:
                raise HTTPException(status_code=400, detail=f"Invalid status: {new_status}")
            updates["status"] = new_status

        if "pinned" in payload:
            if payload["pinned"]:
                # Enforce pin cap
                pinned_count = await db.workout_drafts.count_documents(
                    {**filt, "pinned": True, "_id": {"$ne": oid}}
                )
                if pinned_count >= MAX_PINNED_DRAFTS:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Maximum of {MAX_PINNED_DRAFTS} pinned drafts reached",
                    )
            updates["pinned"] = bool(payload["pinned"])

        for k in (
            "title",
            "energy_input",
            "preference_inputs",
            "generated_workout",
            "resume_route",
            "resume_params",
            "thumbnail_url",
            "step_count",
            "current_step",
        ):
            if k in payload:
                updates[k] = payload[k]

        if "mood_input" in payload and payload["mood_input"]:
            updates["mood_input"] = payload["mood_input"]

        updates["last_modified_at"] = _now()

        await db.workout_drafts.update_one({"_id": oid}, {"$set": updates})
        doc = await db.workout_drafts.find_one({"_id": oid})
        return _serialize(doc)

    # ----- DELETE ----------------------------------------------------------
    @router.delete("/{draft_id}")
    async def delete_draft(
        draft_id: str,
        device_id: Optional[str] = Query(None),
        current_user_id: Optional[str] = Depends(get_optional_current_user),
    ):
        filt = _identity_filter(current_user_id, device_id)
        try:
            oid = ObjectId(draft_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Draft not found")

        result = await db.workout_drafts.delete_one({"_id": oid, **filt})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Draft not found")
        return {"deleted": True}

    # ----- MERGE (guest → user) -------------------------------------------
    @router.post("/merge")
    async def merge_guest_drafts(
        body: GuestMergeRequest,
        current_user_id: str = Depends(get_current_user),
    ):
        """
        Attach every guest draft for `device_id` to the authenticated user.
        Called once on login/register if a device_id is present.
        """
        result = await db.workout_drafts.update_many(
            {"device_id": body.device_id, "user_id": None},
            {"$set": {"user_id": current_user_id}},
        )
        return {"merged": result.modified_count}

    return router


# --- Startup index helper --------------------------------------------------
async def ensure_workout_drafts_indexes(db) -> None:
    await db.workout_drafts.create_index(
        [("user_id", 1), ("status", 1), ("last_modified_at", -1)]
    )
    await db.workout_drafts.create_index(
        [("device_id", 1), ("user_id", 1), ("status", 1)]
    )
    await db.workout_drafts.create_index([("expires_at", 1)])
