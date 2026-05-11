from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Request, Response, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import jwt
import bcrypt
import base64
import aiofiles
import cloudinary
import cloudinary.uploader
import cloudinary.api
import re
import httpx
import secrets
import asyncio
import resend

# ────────────────────────────────────────────────────────
# Shared helpers
# ────────────────────────────────────────────────────────

def resolve_post_author_id(post: dict) -> str:
    """Resolve the canonical author of a post, checking multiple field names.
    
    Returns the author ID as a string, or "" if none found.
    Priority: author_id > user_id > creator_id > owner_id
    """
    for key in ("author_id", "user_id", "creator_id", "owner_id"):
        val = post.get(key)
        if val:
            return str(val)
    return ""


_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v", ".m3u8"}

def derive_post_media_fields(post: dict) -> dict:
    """Derive thumbnail_url and media_type from a raw post document.
    
    Returns dict with 'thumbnail_url' and 'media_type' keys.
    thumbnail_url: user-selected cover from cover_urls, or Cloudinary auto-thumb fallback.
    media_type: 'video' | 'image' | None
    """
    media_urls = post.get("media_urls") or []
    cover_urls = post.get("cover_urls")  # dict {"0": url} or list [url]
    first_url = (media_urls[0] if media_urls else "").lower()
    
    # Detect media_type
    is_video = any(first_url.endswith(ext) for ext in _VIDEO_EXTENSIONS) or "/video/" in first_url
    media_type = "video" if is_video else ("image" if first_url else None)
    
    # Resolve thumbnail_url for videos
    thumbnail_url = None
    if is_video:
        # 1st priority: user-selected cover from cover_urls
        if isinstance(cover_urls, dict):
            thumbnail_url = cover_urls.get("0") or cover_urls.get(0)
        elif isinstance(cover_urls, list) and cover_urls:
            thumbnail_url = cover_urls[0]
        
        # 2nd priority: Cloudinary auto-thumbnail fallback
        if not thumbnail_url and media_urls:
            raw_url = media_urls[0]
            if "cloudinary.com" in raw_url and "/video/upload/" in raw_url:
                # Generate frame thumbnail: /so_1/ grabs frame at 1 second
                parts = raw_url.split("/upload/")
                if len(parts) == 2:
                    # Strip any existing transforms, add thumbnail transform
                    public_path = parts[1]
                    # Remove existing transform chains (e.g. sp_hd/)
                    segments = public_path.split("/")
                    # Keep only the last segment (public_id + extension)
                    public_id_with_ext = segments[-1]
                    # Replace video extension with .jpg
                    for ext in _VIDEO_EXTENSIONS:
                        if public_id_with_ext.lower().endswith(ext):
                            public_id_with_ext = public_id_with_ext[:-(len(ext))] + ".jpg"
                            break
                    thumbnail_url = f"{parts[0]}/upload/so_1,w_400,h_400,c_fill/{public_id_with_ext}"
    
    return {"thumbnail_url": thumbnail_url, "media_type": media_type}

from auth import (
    exchange_session_id_for_token,
    create_or_update_user,
    store_session,
    get_user_from_session_token,
    delete_session,
    set_session_cookie,
    clear_session_cookie,
    get_session_token_from_request
)
from auth_tracking import (
    track_login_event,
    update_auth_metadata,
    create_session_record,
    deactivate_session,
    get_active_sessions,
    get_login_history,
    get_client_ip,
    get_user_agent
)
from user_analytics import (
    track_user_event,
    get_user_activity_summary,
    get_feature_usage_stats,
    get_workout_analytics,
    get_social_engagement_stats,
    get_admin_analytics,
    get_user_journey,
    get_all_users_detail,
    get_new_users_detail,
    get_screen_views_breakdown,
    get_mood_selections_breakdown,
    get_equipment_selections_breakdown,
    get_difficulty_selections_breakdown,
    get_exercises_breakdown,
    get_social_activity_breakdown,
    get_workout_funnel_detail,
    EVENT_TYPES,
)
from admin_analytics import (
    get_funnel_analysis,
    get_retention_cohorts,
    search_users,
    get_user_timeline,
    get_comparison_stats,
    get_engagement_metrics,
)
from content_moderation import (
    check_content,
    filter_content,
    is_valid_report_category,
    get_report_categories,
    REPORT_CATEGORIES,
    REPORT_STATUS,
)
from notifications import (
    NotificationService,
    NotificationType,
    get_notification_service,
    SUGGESTION_COPY_LIBRARY,
)
from notification_worker import (
    get_notification_worker,
    start_notification_worker,
    stop_notification_worker,
)
from seed_data import PREVIEW_FEATURED_WORKOUTS, FEATURED_WORKOUT_IDS
from exercises_seed_data import PREVIEW_EXERCISES
from workout_drafts import (
    build_workout_drafts_router,
    ensure_workout_drafts_indexes,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(
    mongo_url,
    connectTimeoutMS=30000,
    serverSelectionTimeoutMS=30000,
    socketTimeoutMS=45000,
    maxPoolSize=20,
    retryWrites=True,
    retryReads=True,
)
db = client[os.environ.get('DB_NAME', 'mood_app')]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required")
JWT_ALGORITHM = 'HS256'

# Environment Detection for Staging/Preview
# Set APP_ENV=staging in .env for staging environments, or auto-detect from domain
APP_ENV = os.environ.get('APP_ENV', 'production')

def is_staging_environment() -> bool:
    """
    Detect if we're running in a staging/preview environment.
    Returns True if:
    - APP_ENV is set to 'staging', 'preview', or 'development'
    - Or if the backend URL contains 'preview' or 'stage'
    """
    if APP_ENV.lower() in ['staging', 'preview', 'development', 'dev']:
        return True
    
    # Check if running on preview domain
    backend_url = os.environ.get('EXPO_PUBLIC_BACKEND_URL', '')
    if 'preview' in backend_url.lower() or 'stage' in backend_url.lower():
        return True
    
    # Check tunnel subdomain for preview
    tunnel_subdomain = os.environ.get('EXPO_TUNNEL_SUBDOMAIN', '')
    if tunnel_subdomain and 'dev' in tunnel_subdomain.lower():
        return True
    
    return False

IS_STAGING = is_staging_environment()

# Deployment metadata (set via environment variables during deploy)
GIT_SHA = os.environ.get('GIT_SHA', 'missing')
DEPLOYED_AT = os.environ.get('DEPLOYED_AT', 'missing')
SEED_VERSION = "2026-02-17-v3"  # Updated Cardio Based hero image

# Admin allowlist - emails/usernames/user_ids that have admin access
# Format: comma-separated list of emails, usernames, or user_ids
ADMIN_ALLOWLIST = os.environ.get('ADMIN_ALLOWLIST', 'officialmoodapp').split(',')
ADMIN_ALLOWLIST = [x.strip().lower() for x in ADMIN_ALLOWLIST if x.strip()]

def is_admin_effective_sync(user: dict) -> tuple[bool, str]:
    """
    CANONICAL admin check - used by ALL admin endpoints.
    Returns (is_admin: bool, matched_by: str) where matched_by indicates which field matched.
    
    Checks in order:
    1. user.username in ADMIN_ALLOWLIST
    2. user.email in ADMIN_ALLOWLIST  
    3. str(user._id) in ADMIN_ALLOWLIST
    4. user.is_admin == True (backwards compatibility)
    """
    if not user:
        return False, "no_user"
    
    username = user.get("username", "").lower()
    email = user.get("email", "").lower()
    user_id = str(user.get("_id", "")).lower()
    
    # Check username
    if username and username in ADMIN_ALLOWLIST:
        return True, f"username:{username}"
    
    # Check email
    if email and email in ADMIN_ALLOWLIST:
        return True, f"email:{email}"
    
    # Check user_id (ObjectId as string)
    if user_id and user_id in ADMIN_ALLOWLIST:
        return True, f"user_id:{user_id}"
    
    # Check is_admin flag for backwards compatibility
    if user.get("is_admin") == True:
        return True, "is_admin_flag"
    
    return False, "no_match"

async def is_admin_effective(user_id: str) -> tuple[bool, str]:
    """
    Async wrapper for is_admin_effective_sync.
    Fetches user and checks admin status.
    Returns (is_admin: bool, matched_by: str)
    """
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        return is_admin_effective_sync(user)
    except Exception as e:
        logger.error(f"Error checking admin status: {e}")
        return False, f"error:{str(e)}"

async def is_admin_allowed(user_id: str) -> bool:
    """
    Legacy wrapper for backwards compatibility.
    Use is_admin_effective() for new code.
    """
    is_admin, _ = await is_admin_effective(user_id)
    return is_admin

# Admin users who get auto-promoted in staging
STAGING_ADMIN_USERNAMES = ["officialmoodapp"]

# Welcome message configuration
WELCOME_MESSAGE_SENDER = "officialmoodapp"
WELCOME_MESSAGE_TEXT = """Welcome to MOOD 👋

Here, you can build workouts by vibe, equipment, and intensity — all tailored to how you want to train.
Share your achievements to the explore page or export to Instagram, and connect with a community of driven gym-goers.

Try your first workout today. Let's get after it. ⚡️"""

async def send_welcome_message(new_user_id: str):
    """
    Send a welcome DM to a new user from the officialmoodapp admin account.
    Creates a conversation and sends the welcome message.
    """
    try:
        # Find the admin sender account
        admin_user = await db.users.find_one({"username": WELCOME_MESSAGE_SENDER})
        if not admin_user:
            logger.warning(f"Welcome message sender '{WELCOME_MESSAGE_SENDER}' not found")
            return
        
        admin_id = str(admin_user["_id"])
        
        # Don't send welcome message to the admin themselves
        if new_user_id == admin_id:
            return
        
        # Check if conversation already exists
        existing_conv = await db.conversations.find_one({
            "participants": {"$all": [admin_id, new_user_id]}
        })
        
        if existing_conv:
            # Conversation exists, check if welcome was already sent
            welcome_exists = await db.messages.find_one({
                "conversation_id": str(existing_conv["_id"]),
                "sender_id": admin_id,
                "content": {"$regex": "Welcome to MOOD"}
            })
            if welcome_exists:
                logger.info(f"Welcome message already sent to user {new_user_id}")
                return
            conversation_id = str(existing_conv["_id"])
        else:
            # Create new conversation
            conversation = {
                "participants": [admin_id, new_user_id],
                "created_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc),
                "last_message": WELCOME_MESSAGE_TEXT[:50] + "...",
                "last_message_at": datetime.now(timezone.utc),
            }
            result = await db.conversations.insert_one(conversation)
            conversation_id = str(result.inserted_id)
        
        # Create the welcome message
        message = {
            "conversation_id": conversation_id,
            "sender_id": admin_id,
            "content": WELCOME_MESSAGE_TEXT,
            "created_at": datetime.now(timezone.utc),
            "read": False,
        }
        await db.messages.insert_one(message)
        
        # Update conversation with last message
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {
                "$set": {
                    "last_message": WELCOME_MESSAGE_TEXT[:50] + "...",
                    "last_message_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
            }
        )
        
        logger.info(f"Welcome message sent to new user {new_user_id}")
        
    except Exception as e:
        logger.error(f"Failed to send welcome message to user {new_user_id}: {e}")

async def auto_seed_featured_workouts():
    """
    Auto-seed featured workouts on startup.
    FORCE REPLACES if the existing workouts don't match preview data.
    Called on startup to ensure correct data.
    """
    try:
        existing_count = await db.featured_workouts.count_documents({})
        
        # Check if we have the correct workouts by checking titles
        expected_titles = {w["title"] for w in PREVIEW_FEATURED_WORKOUTS}
        existing_workouts = await db.featured_workouts.find({}).to_list(100)
        existing_titles = {w.get("title") for w in existing_workouts}
        
        # If titles don't match, we need to force replace
        needs_replacement = not expected_titles.issubset(existing_titles)
        
        if existing_count < len(PREVIEW_FEATURED_WORKOUTS) or needs_replacement:
            logger.info(f"🌱 Auto-seeding featured workouts (found {existing_count}, titles match: {not needs_replacement})")
            
            # Delete old workouts if we're replacing
            if needs_replacement:
                await db.featured_workouts.delete_many({})
                logger.info(f"🗑️ Deleted old featured workouts for replacement")
            
            inserted_ids = []
            for workout in PREVIEW_FEATURED_WORKOUTS:
                workout_data = {**workout, "created_at": datetime.now(timezone.utc)}
                # Remove _id from data to insert
                workout_data.pop("_id", None)
                
                # Check if workout with same title exists
                existing = await db.featured_workouts.find_one({"title": workout["title"]})
                if not existing:
                    result = await db.featured_workouts.insert_one(workout_data)
                    inserted_ids.append(str(result.inserted_id))
                else:
                    inserted_ids.append(str(existing["_id"]))
            
            # Update featured config with the workout IDs
            await db.featured_config.update_one(
                {"_id": "main"},
                {
                    "$set": {
                        "schemaVersion": 1,
                        "featuredWorkoutIds": inserted_ids,
                        "ttlHours": 12,
                        "updatedAt": datetime.now(timezone.utc).isoformat()
                    }
                },
                upsert=True
            )
            
            logger.info(f"✅ Auto-seeded {len(inserted_ids)} featured workouts")
            return {"seeded": True, "count": len(inserted_ids)}
        else:
            logger.info(f"✅ Featured workouts already seeded ({existing_count} found, correct titles)")
            return {"seeded": False, "count": existing_count}
    except Exception as e:
        logger.error(f"❌ Failed to auto-seed featured workouts: {e}")
        return {"seeded": False, "error": str(e)}

async def auto_grant_admin_for_staging(user_id: str, username: str):
    """
    Auto-grant admin access in staging environments for designated users.
    Called during login/auth.
    """
    if not IS_STAGING:
        return False
    
    if username.lower() not in [u.lower() for u in STAGING_ADMIN_USERNAMES]:
        return False
    
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if user and not user.get("is_admin"):
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"is_admin": True}}
            )
            logger.info(f"🔑 Auto-granted admin access to {username} (staging mode)")
            return True
        return user.get("is_admin", False) if user else False
    except Exception as e:
        logger.error(f"❌ Failed to auto-grant admin: {e}")
        return False

async def auto_seed_exercises():
    """
    Auto-seed exercises if collection is empty or has fewer than expected.
    Uses the exact exercise data from the preview environment.
    """
    try:
        existing_count = await db.exercises.count_documents({})
        
        # If we have significantly fewer exercises than preview, seed them
        if existing_count < len(PREVIEW_EXERCISES) * 0.9:  # Allow 10% variance
            logger.info(f"🌱 Auto-seeding exercises (found {existing_count}, need {len(PREVIEW_EXERCISES)})")
            
            # Delete existing and insert preview exercises
            await db.exercises.delete_many({})
            
            exercises_to_insert = []
            for ex in PREVIEW_EXERCISES:
                ex_data = {**ex, "created_at": datetime.now(timezone.utc)}
                exercises_to_insert.append(ex_data)
            
            await db.exercises.insert_many(exercises_to_insert)
            logger.info(f"✅ Auto-seeded {len(exercises_to_insert)} exercises")
            return {"seeded": True, "count": len(exercises_to_insert)}
        else:
            logger.info(f"✅ Exercises already seeded ({existing_count} found)")
            return {"seeded": False, "count": existing_count}
    except Exception as e:
        logger.error(f"❌ Failed to auto-seed exercises: {e}")
        return {"seeded": False, "error": str(e)}

# Terms of Service Version - Update this when terms change to force re-acceptance
# Format: YYYY-MM-DD
CURRENT_TERMS_VERSION = "2025-01-19"

# Cloudinary Configuration
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET'),
    secure=True
)

logger = logging.getLogger(__name__)
logger.info(f"✅ Cloudinary configured with cloud: {os.environ.get('CLOUDINARY_CLOUD_NAME')}")

import time

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Response time logging middleware
@app.middleware("http")
async def log_response_time(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000  # Convert to ms
    
    # Log slow requests (> 500ms)
    if process_time > 500:
        logger.warning(f"SLOW REQUEST: {request.method} {request.url.path} took {process_time:.2f}ms")
    elif process_time > 200:
        logger.info(f"Request: {request.method} {request.url.path} took {process_time:.2f}ms")
    
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    return response

# Root-level health check for Kubernetes deployment
@app.get("/health")
async def root_health_check():
    """Health check endpoint for Kubernetes liveness/readiness probes"""
    try:
        # Quick database ping
        await client.admin.command('ping')
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "healthy", "database": "disconnected", "error": str(e)}

# Security
security = HTTPBearer()

# Helper functions
def create_jwt_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc).timestamp() + (365 * 10 * 24 * 3600)  # 10 years - essentially permanent until logout
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        logger.info(f"🔐 Auth: Decoded user_id from token: {user_id}")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Handle both ObjectId format and custom user_id format (for OAuth users)
        user = None
        
        # First try to find by custom user_id field
        user = await db.users.find_one({"user_id": user_id})
        logger.info(f"🔐 Auth: Found by user_id field: {user is not None}")
        
        # If not found, try ObjectId (for legacy users)
        if not user:
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                logger.info(f"🔐 Auth: Found by ObjectId: {user is not None}")
            except Exception as e:
                logger.info(f"🔐 Auth: ObjectId lookup error: {e}")
                pass  # Invalid ObjectId format, skip
        
        if not user:
            logger.warning(f"🔐 Auth: User not found for id: {user_id}")
            raise HTTPException(status_code=401, detail="User not found")
        
        logger.info(f"🔐 Auth: Authenticated user: {user.get('username')}")
        # ALWAYS return the MongoDB ObjectId for consistency across all operations
        return str(user["_id"])
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Optional authentication - returns user_id if token is valid, None otherwise"""
    if not authorization:
        return None
    
    try:
        # Remove 'Bearer ' prefix if present
        token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
        
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get('user_id')
        if not user_id:
            return None
        
        # Handle both ObjectId format and custom user_id format (for OAuth users)
        user = None
        
        # First try to find by custom user_id field
        user = await db.users.find_one({"user_id": user_id})
        
        # If not found, try ObjectId (for legacy users)
        if not user:
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
            except:
                pass  # Invalid ObjectId format, skip
        
        if not user:
            return None
        
        # ALWAYS return the MongoDB ObjectId for consistency across all operations
        return str(user["_id"])
    except:
        return None


async def require_admin(current_user_id: str = Depends(get_current_user)) -> str:
    """
    FastAPI dependency that requires admin access.
    Raises 403 if user is not an admin.
    Returns user_id if admin.
    Use this as a dependency: current_user_id: str = Depends(require_admin)
    """
    is_admin, matched_by = await is_admin_effective(current_user_id)
    if not is_admin:
        raise HTTPException(
            status_code=403, 
            detail=f"Admin access required - not in allowlist (checked: {matched_by})"
        )
    return current_user_id


# ============================================
# ADMIN AUDIT LOGGING
# ============================================

async def log_admin_action(
    admin_user_id: str,
    action: str,
    endpoint: str,
    request_body_redacted: Optional[dict] = None,
    status_code: int = 200,
    result_summary: str = "success",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """
    Log admin actions to admin_audit_logs collection.
    Schema:
    { timestamp_utc, admin_user_id, admin_username, action, endpoint, 
      request_body_redacted, status_code, result_summary, env, ip, user_agent }
    """
    try:
        # Get admin username
        admin_user = await db.users.find_one({"_id": ObjectId(admin_user_id)})
        admin_username = admin_user.get("username", "unknown") if admin_user else "unknown"
        
        audit_log = {
            "timestamp_utc": datetime.now(timezone.utc),
            "admin_user_id": admin_user_id,
            "admin_username": admin_username,
            "action": action,
            "endpoint": endpoint,
            "request_body_redacted": request_body_redacted or {},
            "status_code": status_code,
            "result_summary": result_summary,
            "env": APP_ENV,
            "is_staging": IS_STAGING,
            "ip_address": ip_address,
            "user_agent": user_agent,
        }
        
        await db.admin_audit_logs.insert_one(audit_log)
        logger.info(f"📋 Admin audit: {admin_username} - {action} - {result_summary}")
    except Exception as e:
        logger.error(f"Failed to log admin action: {e}")


async def check_terms_accepted(user_id: str) -> bool:
    """Check if user has accepted the current version of terms of service.
    Returns True if accepted, raises HTTPException with TERMS_NOT_ACCEPTED if not.
    """
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        terms_accepted_at = user.get("terms_accepted_at")
        terms_accepted_version = user.get("terms_accepted_version")
        
        # Check if user has accepted terms AND the version matches current version
        if not terms_accepted_at or terms_accepted_version != CURRENT_TERMS_VERSION:
            raise HTTPException(
                status_code=403, 
                detail={
                    "code": "TERMS_NOT_ACCEPTED",
                    "message": "You must accept the Terms of Service and Community Guidelines before performing this action.",
                    "required_version": CURRENT_TERMS_VERSION
                }
            )
        return True
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking terms acceptance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to verify terms acceptance")


# Pydantic Models

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None
    followers_count: int = 0
    following_count: int = 0
    workouts_count: int = 0
    current_streak: int = 0
    created_at: datetime

class WorkoutCreate(BaseModel):
    title: str
    mood_category: str  # One of the 7 mood types
    exercises: List[Dict[str, Any]]
    duration: int  # in minutes
    difficulty: str  # beginner, intermediate, advanced
    equipment: List[str] = []
    calories_estimate: Optional[int] = None

class WorkoutResponse(BaseModel):
    id: str
    title: str
    mood_category: str
    exercises: List[Dict[str, Any]]
    duration: int
    difficulty: str
    equipment: List[str]
    calories_estimate: Optional[int] = None
    created_at: datetime

class UserWorkoutCreate(BaseModel):
    workout_id: str
    completed_at: Optional[datetime] = None
    duration_actual: Optional[int] = None  # actual duration completed
    notes: Optional[str] = None
    mood_before: Optional[str] = None
    mood_after: Optional[str] = None

class WorkoutExerciseData(BaseModel):
    workoutTitle: str
    workoutName: str
    equipment: str
    duration: str
    difficulty: str
    moodCategory: Optional[str] = None
    imageUrl: Optional[str] = None
    description: Optional[str] = None
    battlePlan: Optional[str] = None
    intensityReason: Optional[str] = None
    moodTips: Optional[List[dict]] = None

class WorkoutCardData(BaseModel):
    workouts: List[WorkoutExerciseData]
    totalDuration: int
    completedAt: str
    moodCategory: Optional[str] = None
    workout_snapshot_id: Optional[str] = None  # Persistent reference for "Try this workout"

# ============================================================================
# ATTACHED WORKOUT - Canonical workout payload for "Try This Workout" feature
# This is the ONLY source of truth for workout replication
# ============================================================================

class AttachedWorkoutExercise(BaseModel):
    """Single exercise within an attached workout"""
    exerciseId: str  # Unique identifier for the exercise
    name: str
    imageUrl: str  # REQUIRED - no fallbacks allowed
    duration: str
    equipment: str
    difficulty: str
    description: Optional[str] = None
    battlePlan: str  # REQUIRED - the workout guidance text
    intensityReason: Optional[str] = None
    moodTips: Optional[List[dict]] = None

class AttachedWorkout(BaseModel):
    """
    Fully-hydrated canonical workout payload.
    This is embedded in posts and is the ONLY source for "Try This Workout".
    No fallbacks, no partial data - if this is missing/invalid, workout is unavailable.
    """
    version: int = 1
    title: str  # REQUIRED - overall workout title
    totalDuration: int  # Total duration in minutes
    moodCategory: str  # e.g., "Back", "Get Outside - Hill Workout"
    completedAt: str  # When the workout was completed
    exercises: List[AttachedWorkoutExercise]  # REQUIRED - at least one exercise

class PostCreate(BaseModel):
    workout_id: Optional[str] = None
    caption: str
    media_urls: List[str] = []  # URLs to uploaded media files
    hashtags: List[str] = []
    cover_urls: Optional[Any] = None  # Map of media index to cover image URL (dict or list)
    workout_data: Optional[WorkoutCardData] = None  # Legacy - kept for backwards compat
    # New canonical workout attachment
    workout_snapshot_id: Optional[str] = None  # Server will hydrate attached_workout from this
    attached_workout: Optional[AttachedWorkout] = None  # Direct payload (alternative to snapshot_id)

class CredentialsUpdate(BaseModel):
    current_password: str
    new_username: Optional[str] = None
    new_email: Optional[str] = None
    new_password: Optional[str] = None

class PostResponse(BaseModel):
    id: str
    author: UserResponse
    workout: Optional[WorkoutResponse] = None
    workout_data: Optional[WorkoutCardData] = None  # Legacy - kept for backwards compat
    attached_workout: Optional[AttachedWorkout] = None  # Canonical workout payload for "Try This Workout"
    caption: str
    media_urls: List[str] = []
    hashtags: List[str] = []
    cover_urls: Optional[Any] = None  # Map of media index to cover image URL (dict or list)
    thumbnail_url: Optional[str] = None  # Canonical thumbnail for grid display (derived from cover_urls for videos)
    media_type: Optional[str] = None  # "video" | "image" | None
    likes_count: int = 0
    comments_count: int = 0
    is_liked: bool = False
    is_saved: bool = False
    created_at: datetime

class CommentCreate(BaseModel):
    post_id: str
    text: str
    parent_comment_id: Optional[str] = None  # For reply threads
    mentioned_user_ids: Optional[List[str]] = None  # Users mentioned with @

class FollowResponse(BaseModel):
    follower: UserResponse
    following: UserResponse
    created_at: datetime

# Content Moderation Models
class ContentReportCreate(BaseModel):
    content_type: str  # "post", "comment", "profile"
    content_id: str
    category: str  # One of REPORT_CATEGORIES
    reason: Optional[str] = None  # Additional details

class BlockUserCreate(BaseModel):
    blocked_user_id: str
    reason: Optional[str] = None

class ContentReportResponse(BaseModel):
    id: str
    reporter_id: str
    content_type: str
    content_id: str
    category: str
    reason: Optional[str]
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    action_taken: Optional[str] = None

class BlockedUserResponse(BaseModel):
    id: str
    blocked_user_id: str
    blocked_username: str
    blocked_at: datetime

# Authentication Endpoints

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if username or email already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email}
        ]
    })
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Hash password
    hashed_password = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
    
    # Create user with generated user_id (kept for backwards compatibility)
    custom_user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    user_doc = {
        "user_id": custom_user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name or user_data.username,
        "bio": "",
        "avatar": "",
        "followers_count": 0,
        "following_count": 0,
        "workouts_count": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "total_workouts": 0,
        "following": [],
        "followers": [],
        "created_at": datetime.now(timezone.utc),
        "terms_accepted_at": datetime.now(timezone.utc),  # Record when user accepted terms
        "terms_accepted_version": CURRENT_TERMS_VERSION,  # Record which version they accepted
        "privacy_accepted_at": datetime.now(timezone.utc),  # Record when user accepted privacy policy
        "tips_state": {
            "mood_scroll": "unseen",
            "form_videos": "unseen",
            "completion_share": "unseen",
        },
    }
    
    result = await db.users.insert_one(user_doc)
    # Use MongoDB ObjectId for token and response
    mongodb_id = str(result.inserted_id)
    
    # Track user signup event
    await db.user_events.insert_one({
        "user_id": mongodb_id,
        "event_type": "user_registered",
        "timestamp": datetime.now(timezone.utc),
        "metadata": {
            "username": user_data.username,
            "email": user_data.email,
            "registration_method": "email_password"
        }
    })
    logger.info(f"New user registered: {user_data.username} ({user_data.email})")
    
    # Send welcome message from officialmoodapp
    await send_welcome_message(mongodb_id)
    
    # Generate JWT token using MongoDB ObjectId
    token = create_jwt_token(mongodb_id)
    
    return {
        "message": "User created successfully",
        "token": token,
        "user_id": mongodb_id  # Always return MongoDB ObjectId
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin, request: Request):
    user_id = None
    success = False
    
    # Get client info
    ip_address = get_client_ip(request)
    user_agent = get_user_agent(request)
    
    try:
        # Find user by username OR email (case insensitive)
        import re
        login_identifier = login_data.username.strip()
        escaped_identifier = re.escape(login_identifier)
        user = await db.users.find_one({
            "$or": [
                {"username": {"$regex": f"^{escaped_identifier}$", "$options": "i"}},
                {"email": {"$regex": f"^{escaped_identifier}$", "$options": "i"}}
            ]
        })
        if not user:
            logger.info(f"Login failed: User {login_identifier} not found")
            # Track failed login attempt
            await track_login_event(
                db, "unknown", "email_password", False,
                ip_address, user_agent, failure_reason="User not found"
            )
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id = str(user["_id"])
        logger.info(f"Login attempt for user: {user.get('username')} (searched: {login_identifier})")
        logger.info(f"User has password field: {'password' in user}")
        
        # Verify password
        try:
            stored_password = user.get("password") or user.get("password_hash")
            if not stored_password:
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            if isinstance(stored_password, bytes):
                password_match = bcrypt.checkpw(login_data.password.encode(), stored_password)
            else:
                password_match = bcrypt.checkpw(login_data.password.encode(), stored_password.encode())
            
            logger.info(f"Password match result: {password_match}")
            if not password_match:
                # Track failed login - wrong password
                await track_login_event(
                    db, user_id, "email_password", False,
                    ip_address, user_agent, failure_reason="Invalid password"
                )
                await update_auth_metadata(db, user_id, "email_password", False)
                raise HTTPException(status_code=401, detail="Invalid credentials")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            await track_login_event(
                db, user_id, "email_password", False,
                ip_address, user_agent, failure_reason="Password verification error"
            )
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Generate JWT token
        token = create_jwt_token(str(user["_id"]))
        
        # Track successful login
        success = True
        await track_login_event(
            db, user_id, "email_password", True,
            ip_address, user_agent
        )
        await update_auth_metadata(db, user_id, "email_password", True)
        await create_session_record(
            db, user_id, token, "email_password",
            ip_address, user_agent
        )
        
        # Auto-grant admin in staging for designated users
        username = user.get("username", "")
        await auto_grant_admin_for_staging(user_id, username)
        
        logger.info(f"Login successful for: {login_data.username}")
        return {
            "message": "Login successful",
            "token": token,
            "user_id": str(user["_id"])
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected login error: {e}")
        if user_id:
            await track_login_event(
                db, user_id, "email_password", False,
                ip_address, user_agent, failure_reason=str(e)
            )
        raise HTTPException(status_code=500, detail="Login failed")


# ────────────────────────────────────────────────────────
# Password Reset (Forgot Password) — Resend-powered
# ────────────────────────────────────────────────────────

# Configure Resend SDK from env (loaded via dotenv at module load time)
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "noreply@officialmoodapp.com")
PASSWORD_RESET_DEEP_LINK_BASE = os.environ.get(
    "PASSWORD_RESET_DEEP_LINK_BASE", "moodapp://reset-password"
)

# Token policy
PASSWORD_RESET_TOKEN_TTL_HOURS = 1
PASSWORD_RESET_TOKEN_BYTES = 32  # 256-bit raw entropy → 64-char URL-safe token


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


def _hash_reset_token(raw_token: str) -> str:
    """Hash a raw reset token with bcrypt before persisting."""
    return bcrypt.hashpw(raw_token.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_reset_token(raw_token: str, hashed_token: str) -> bool:
    try:
        return bcrypt.checkpw(raw_token.encode("utf-8"), hashed_token.encode("utf-8"))
    except Exception:
        return False


def _build_reset_email_html(reset_link: str) -> str:
    """Minimal, premium MOOD-styled reset email. Inline CSS only for deliverability."""
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#0a0a0a;border:1px solid #1a1a1a;border-radius:16px;padding:40px 32px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <div style="font-size:32px;font-weight:700;color:#FFD700;letter-spacing:6px;">MOOD</div>
          <div style="font-size:11px;color:#666666;letter-spacing:6px;margin-top:4px;">FITNESS</div>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <h1 style="margin:0 0 12px 0;color:#ffffff;font-size:22px;font-weight:600;">Reset your password</h1>
          <p style="margin:0;color:#a0a0a0;font-size:15px;line-height:22px;">Tap the button below to set a new password. This link expires in 1 hour and can only be used once.</p>
        </td></tr>
        <tr><td align="center" style="padding-bottom:24px;">
          <a href="{reset_link}" style="display:inline-block;background-color:#FFD700;color:#000000;text-decoration:none;font-weight:700;font-size:16px;padding:14px 32px;border-radius:999px;">Reset Password</a>
        </td></tr>
        <tr><td style="padding-bottom:8px;">
          <p style="margin:0;color:#666666;font-size:12px;line-height:18px;">If the button doesn't work, copy and paste this link into the MOOD app:</p>
          <p style="margin:8px 0 0 0;color:#888888;font-size:12px;word-break:break-all;">{reset_link}</p>
        </td></tr>
        <tr><td style="padding-top:24px;border-top:1px solid #1a1a1a;">
          <p style="margin:0;color:#555555;font-size:11px;line-height:16px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


async def _send_reset_email(recipient: str, reset_link: str) -> None:
    """Send the password reset email via Resend.
    Failures are logged but never raised to the caller — we never want to
    leak whether an email exists, and email transport is best-effort."""
    if not resend.api_key:
        logger.error("RESEND_API_KEY is not configured; skipping email send.")
        return
    params = {
        "from": SENDER_EMAIL,
        "to": [recipient],
        "subject": "Reset your MOOD password",
        "html": _build_reset_email_html(reset_link),
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"📧 Password reset email sent to {recipient} (id={result.get('id') if isinstance(result, dict) else 'unknown'})")
    except Exception as e:
        logger.error(f"📧 Failed to send password reset email to {recipient}: {e}")


@api_router.post("/auth/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest):
    """Initiate a password reset.
    Always returns success regardless of whether the email exists, to avoid
    leaking account existence (security rule). The reset link is sent only
    when the email actually maps to a user.
    """
    email = (payload.email or "").strip().lower()
    if not email:
        # Even on bad input, do not reveal anything — return success.
        return {"success": True}

    # Find user case-insensitively
    user = await db.users.find_one(
        {"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}}
    )

    if user:
        user_id = str(user["_id"])
        # Generate a cryptographically secure URL-safe token
        raw_token = secrets.token_urlsafe(PASSWORD_RESET_TOKEN_BYTES)
        token_hash = _hash_reset_token(raw_token)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(hours=PASSWORD_RESET_TOKEN_TTL_HOURS)

        # Invalidate any prior unused tokens for this user, then insert the new one.
        await db.password_reset_tokens.update_many(
            {"user_id": user_id, "used_at": None},
            {"$set": {"used_at": now, "invalidated_reason": "superseded"}},
        )
        await db.password_reset_tokens.insert_one({
            "user_id": user_id,
            "token_hash": token_hash,
            "created_at": now,
            "expires_at": expires_at,
            "used_at": None,
        })

        reset_link = f"{PASSWORD_RESET_DEEP_LINK_BASE}?token={raw_token}"
        # Fire-and-forget email send so the response stays fast
        asyncio.create_task(_send_reset_email(user.get("email", email), reset_link))
        logger.info(f"🔐 Password reset initiated for user_id={user_id}")
    else:
        # Constant-time-ish: do a small sleep to mask the timing difference
        # between "user found + DB writes + email send" and "no user".
        await asyncio.sleep(0.15)
        logger.info(f"🔐 Password reset requested for unknown email (suppressed)")

    return {"success": True}


@api_router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    """Consume a reset token and set a new password.
    - Token must match a stored hash, be unused, and not expired.
    - Token is single-use (marked used_at on success).
    - Other unused tokens for the user are invalidated.
    """
    raw_token = (payload.token or "").strip()
    new_password = payload.new_password or ""

    if not raw_token or not new_password:
        raise HTTPException(status_code=400, detail="Invalid request")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    now = datetime.now(timezone.utc)

    # Token hashes are not searchable by hash since bcrypt salts each one.
    # Pull recent unused, unexpired tokens and verify in-memory. With per-user
    # supersedure on /forgot-password, this set is small in practice.
    candidates = await db.password_reset_tokens.find(
        {"used_at": None, "expires_at": {"$gt": now}}
    ).sort("created_at", -1).to_list(length=200)

    matched = None
    for record in candidates:
        if _verify_reset_token(raw_token, record.get("token_hash", "")):
            matched = record
            break

    if not matched:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    user_id = matched["user_id"]
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    # Atomically mark this token used; if another request beat us, refuse.
    consume = await db.password_reset_tokens.update_one(
        {"_id": matched["_id"], "used_at": None},
        {"$set": {"used_at": now}},
    )
    if consume.modified_count != 1:
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    # Hash the new password (bcrypt) and update the user.
    new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    update_result = await db.users.update_one(
        {"_id": user_oid},
        {
            "$set": {
                "password": new_hash,        # legacy field used by login
                "password_hash": new_hash,   # canonical field
                "password_updated_at": now,
            }
        },
    )
    if update_result.matched_count != 1:
        # User vanished — invalidate token and refuse
        raise HTTPException(status_code=400, detail="Invalid or expired reset link")

    # Invalidate all other outstanding reset tokens for this user
    await db.password_reset_tokens.update_many(
        {"user_id": user_id, "used_at": None},
        {"$set": {"used_at": now, "invalidated_reason": "password_changed"}},
    )

    logger.info(f"🔐 Password successfully reset for user_id={user_id}")
    return {"success": True}


# Emergent Auth Endpoints

# ────────────────────────────────────────────────────────
# Admin: Custom Workouts (Mongo-backed catalog)
# Lets admins create new workout entries that augment the static
# data files. Public GET filters by mood/muscle/category/equipment/intensity
# so the relevant carousel can fold them in alongside static workouts.
# ────────────────────────────────────────────────────────


class AdminWorkoutCreate(BaseModel):
    mood: str               # e.g. "Muscle Gainer"
    muscle: str             # e.g. "Legs"
    category: str           # e.g. "Compound"
    equipment: str          # e.g. "Dumbbells"
    intensity: str          # "beginner" | "intermediate" | "advanced"
    name: str
    duration: str           # "10–12 min"
    description: str
    battlePlan: str         # newline-delimited ok
    imageUrl: str
    intensityReason: str = ""
    moodTips: list = []     # list of {icon, title, description}


@api_router.post("/admin/workouts")
async def admin_create_workout(
    payload: AdminWorkoutCreate,
    current_user_id: str = Depends(get_current_user),
):
    """Admin-only: insert a new workout into the Mongo catalog."""
    is_admin, _ = await is_admin_effective(current_user_id)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin only")

    intensity = (payload.intensity or "").strip().lower()
    if intensity not in ("beginner", "intermediate", "advanced"):
        raise HTTPException(
            status_code=400,
            detail="intensity must be one of: beginner, intermediate, advanced",
        )

    # Validate moodTips shape
    cleaned_tips = []
    for tip in (payload.moodTips or []):
        if not isinstance(tip, dict):
            continue
        cleaned_tips.append({
            "icon": str(tip.get("icon") or "flash"),
            "title": str(tip.get("title") or ""),
            "description": str(tip.get("description") or ""),
        })

    doc = {
        "mood": payload.mood.strip(),
        "muscle": payload.muscle.strip(),
        "category": payload.category.strip(),
        "equipment": payload.equipment.strip(),
        "intensity": intensity,
        "name": payload.name.strip(),
        "duration": payload.duration.strip(),
        "description": payload.description.strip(),
        "battlePlan": payload.battlePlan,
        "imageUrl": payload.imageUrl.strip(),
        "intensityReason": (payload.intensityReason or "").strip(),
        "moodTips": cleaned_tips,
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user_id,
        "active": True,
    }
    result = await db.admin_workouts.insert_one(doc)
    logger.info(
        f"🧱 Admin {current_user_id} created workout '{doc['name']}' "
        f"({doc['mood']}/{doc['muscle']}/{doc['category']}/{doc['equipment']}/{doc['intensity']})"
    )
    return {"success": True, "id": str(result.inserted_id)}


@api_router.get("/workouts")
async def list_admin_workouts(
    mood: str | None = None,
    muscle: str | None = None,
    category: str | None = None,
    equipment: str | None = None,
    intensity: str | None = None,
):
    """Public list of admin-created workouts. Filters are case-insensitive
    exact matches. Returned shape mirrors the static data files so the
    frontend can merge results directly into the existing carousel."""
    q = {"active": True}
    if mood: q["mood"] = {"$regex": f"^{re.escape(mood)}$", "$options": "i"}
    if muscle: q["muscle"] = {"$regex": f"^{re.escape(muscle)}$", "$options": "i"}
    if category: q["category"] = {"$regex": f"^{re.escape(category)}$", "$options": "i"}
    if equipment: q["equipment"] = {"$regex": f"^{re.escape(equipment)}$", "$options": "i"}
    if intensity: q["intensity"] = (intensity or "").strip().lower()

    docs = await db.admin_workouts.find(q, {"_id": 0, "created_by": 0, "active": 0}).to_list(length=500)
    # Convert datetime to iso string for JSON
    for d in docs:
        ca = d.get("created_at")
        if ca and hasattr(ca, "isoformat"):
            d["created_at"] = ca.isoformat()
    return docs


@api_router.delete("/admin/workouts/{workout_id}")
async def admin_delete_workout(
    workout_id: str,
    current_user_id: str = Depends(get_current_user),
):
    """Admin-only: soft-delete a workout (sets active=False)."""
    is_admin, _ = await is_admin_effective(current_user_id)
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    try:
        oid = ObjectId(workout_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    result = await db.admin_workouts.update_one(
        {"_id": oid}, {"$set": {"active": False}}
    )
    if result.matched_count != 1:
        raise HTTPException(status_code=404, detail="Workout not found")
    return {"success": True}


# Emergent Auth Endpoints

@api_router.post("/auth/oauth/callback")
async def emergent_auth_callback(
    session_id: str,
    response: Response
):
    """
    Handle OAuth callback from Emergent Auth
    Exchange session_id for user data and create/update user session
    """
    logger.info(f"Processing Emergent Auth callback with session_id")
    
    # Exchange session_id for user data
    user_data = await exchange_session_id_for_token(session_id)
    
    # Create or get existing user
    user_id = await create_or_update_user(db, user_data)
    
    # Get user from database to get username
    user = await find_user_by_id(user_id)
    username = user.get("username", user_data.email.split('@')[0]) if user else user_data.email.split('@')[0]
    
    # Generate our own JWT token (not the one from Emergent Auth)
    session_token = jwt.encode(
        {
            "user_id": user_id,
            "username": username,
            "email": user_data.email,
            "auth_provider": "google",
            "exp": datetime.now(timezone.utc).timestamp() + (365 * 10 * 24 * 3600)  # 10 years - stay logged in until explicit logout
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )
    
    # Store session in database
    await store_session(db, user_id, session_token)
    
    # Set httpOnly cookie
    set_session_cookie(response, session_token)
    
    logger.info(f"OAuth login successful for: {user_data.email}")
    
    return {
        "message": "Login successful",
        "session_token": session_token,
        "user_id": user_id
    }

class AppleAuthRequest(BaseModel):
    user_id: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    identity_token: Optional[str] = None
    authorization_code: Optional[str] = None

@api_router.post("/auth/apple")
async def apple_sign_in(
    auth_data: AppleAuthRequest,
    request: Request,
    response: Response
):
    """
    Handle Apple Sign-In authentication
    Creates or updates user based on Apple credentials
    """
    logger.info(f"Processing Apple Sign-In for user_id: {auth_data.user_id}")
    
    try:
        # First, check if user already exists with this Apple ID
        existing_user = await db.users.find_one({"apple_user_id": auth_data.user_id})
        
        # If not found by Apple ID but email is provided, check by email (account linking)
        if not existing_user and auth_data.email:
            existing_user = await db.users.find_one({"email": auth_data.email})
            if existing_user:
                # Link this Apple ID to the existing account
                await db.users.update_one(
                    {"_id": existing_user["_id"]},
                    {"$set": {"apple_user_id": auth_data.user_id}}
                )
                logger.info(f"Linked Apple ID to existing account: {auth_data.email}")
        
        if existing_user:
            # User exists, log them in
            # Handle both user_id field and _id (ObjectId) for backwards compatibility
            if "user_id" in existing_user:
                user_id = existing_user["user_id"]
            else:
                user_id = str(existing_user["_id"])
                # Add user_id field for future consistency
                await db.users.update_one(
                    {"_id": existing_user["_id"]},
                    {"$set": {"user_id": user_id}}
                )
            username = existing_user.get("username")
            email = existing_user.get("email")
            logger.info(f"Existing user found for Apple Sign-In: {username}")
        else:
            # Create new user
            # Generate username from email or Apple user ID
            if auth_data.email:
                base_username = auth_data.email.split('@')[0]
            elif auth_data.full_name:
                base_username = auth_data.full_name.lower().replace(' ', '_')
            else:
                base_username = f"apple_user_{auth_data.user_id[:8]}"
            
            # Ensure unique username
            username = base_username
            counter = 1
            while await db.users.find_one({"username": username}):
                username = f"{base_username}_{counter}"
                counter += 1
            
            email = auth_data.email or f"{auth_data.user_id}@apple.privaterelay.com"
            
            # Generate user_id before insert for consistency
            user_id = f"apple_{uuid.uuid4().hex[:12]}"
            
            new_user = {
                "user_id": user_id,
                "username": username,
                "email": email,
                "name": auth_data.full_name,
                "apple_user_id": auth_data.user_id,
                "password_hash": None,  # No password for Apple Sign-In users
                "created_at": datetime.now(timezone.utc),
                "current_streak": 0,
                "longest_streak": 0,
                "total_workouts": 0,
                "avatar": None,
                "bio": "",
                "followers_count": 0,
                "following_count": 0,
                "workouts_count": 0,
                "following": [],
                "followers": [],
                "auth_provider": "apple",
                "auth_metadata": {
                    "login_methods": ["apple"],
                    "first_login_at": datetime.now(timezone.utc),
                    "last_login_at": datetime.now(timezone.utc),
                    "total_logins": 1
                }
            }
            
            result = await db.users.insert_one(new_user)
            # Get the MongoDB ObjectId after insert
            mongodb_id = str(result.inserted_id)
            logger.info(f"Created new Apple user: {username} with MongoDB ID: {mongodb_id}")
            
            # Send welcome message to new Apple users
            await send_welcome_message(mongodb_id)
        
        # Get the MongoDB ObjectId for use in token and responses
        if existing_user:
            mongodb_id = str(existing_user["_id"])
        
        # Generate session token using MongoDB ObjectId (not custom user_id)
        session_token = jwt.encode(
            {
                "user_id": mongodb_id,  # Always use MongoDB ObjectId
                "username": username,
                "email": email,
                "auth_provider": "apple",
                "exp": datetime.now(timezone.utc).timestamp() + (365 * 10 * 24 * 3600)  # 10 years - stay logged in until explicit logout
            },
            JWT_SECRET,
            algorithm=JWT_ALGORITHM
        )
        
        # Update last login using MongoDB ObjectId
        await db.users.update_one(
            {"_id": ObjectId(mongodb_id)},
            {
                "$set": {
                    "auth_metadata.last_login_at": datetime.now(timezone.utc)
                },
                "$inc": {
                    "auth_metadata.total_logins": 1
                }
            }
        )
        
        # Track login event
        await track_login_event(db, mongodb_id, "apple", True, get_client_ip(request), get_user_agent(request))
        
        # Create session record
        await create_session_record(db, mongodb_id, session_token, get_client_ip(request), get_user_agent(request))
        
        # Set cookie
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=10 * 365 * 24 * 60 * 60  # 10 years - stay logged in until explicit logout
        )
        
        logger.info(f"Apple Sign-In successful for: {username}")
        
        return {
            "message": "Login successful",
            "session_token": session_token,
            "user_id": mongodb_id,  # Always return MongoDB ObjectId
            "username": username
        }
        
    except Exception as e:
        logger.error(f"Apple Sign-In error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@api_router.get("/auth/session")
async def check_session(request: Request):
    """
    Check if current session is valid
    Returns user data if authenticated, 401 if not
    """
    session_token = await get_session_token_from_request(request)
    
    if not session_token:
        raise HTTPException(status_code=401, detail="No session token provided")
    
    user = await get_user_from_session_token(db, session_token)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return {
        "authenticated": True,
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "username": user["username"],
            "name": user["name"],
            "avatar": user.get("avatar")
        }
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """
    Logout user and clear session
    """
    session_token = await get_session_token_from_request(request)
    
    if session_token:
        await delete_session(db, session_token)
    
    clear_session_cookie(response)
    
    return {"message": "Logged out successfully"}


@api_router.get("/auth/me")
async def get_auth_me(
    response: Response,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get current authenticated user info including admin status.
    Returns is_admin_effective and which field matched for debugging.
    Also sets X-Admin-Effective header on response.
    """
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check admin status using canonical function
    is_admin, matched_by = is_admin_effective_sync(user)
    
    # Set response header
    response.headers["X-Admin-Effective"] = str(is_admin).lower()
    response.headers["X-Admin-Matched-By"] = matched_by
    
    return {
        "user_id": str(user["_id"]),
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "is_admin_effective": is_admin,
        "admin_matched_by": matched_by,
        "admin_allowlist": ADMIN_ALLOWLIST,  # Show what the allowlist contains for debugging
        "is_admin_flag": user.get("is_admin", False),  # Show the legacy flag value
    }


# Auth Tracking Endpoints

@api_router.get("/auth/sessions")
async def get_user_sessions(current_user_id: str = Depends(get_current_user)):
    """
    Get all active sessions for the current user
    """
    sessions = await get_active_sessions(db, current_user_id)
    
    # Format response
    formatted_sessions = []
    for session in sessions:
        formatted_sessions.append({
            "session_token": session["session_token"][:20] + "...",  # Truncate for security
            "login_method": session["login_method"],
            "device_type": session.get("device_type", "unknown"),
            "ip_address": session.get("ip_address"),
            "created_at": session["created_at"].isoformat(),
            "last_activity": session["last_activity"].isoformat(),
            "is_current": False  # Could enhance to detect current session
        })
    
    return {"sessions": formatted_sessions, "total": len(formatted_sessions)}


@api_router.get("/auth/login-history")
async def get_user_login_history(
    current_user_id: str = Depends(get_current_user),
    limit: int = 50
):
    """
    Get login history for the current user
    """
    history = await get_login_history(db, current_user_id, limit)
    
    # Format response
    formatted_history = []
    for event in history:
        formatted_history.append({
            "login_method": event["login_method"],
            "success": event["success"],
            "ip_address": event.get("ip_address"),
            "device_info": event.get("device_info"),
            "timestamp": event["timestamp"].isoformat(),
            "failure_reason": event.get("failure_reason")
        })
    
    return {"history": formatted_history, "total": len(formatted_history)}


@api_router.get("/auth/metadata")
async def get_auth_metadata(current_user_id: str = Depends(get_current_user)):
    """
    Get authentication metadata for the current user
    """
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    auth_meta = user.get("auth_metadata", {})
    
    return {
        "login_methods": auth_meta.get("login_methods", []),
        "first_login_at": auth_meta.get("first_login_at").isoformat() if auth_meta.get("first_login_at") else None,
        "last_login_at": auth_meta.get("last_login_at").isoformat() if auth_meta.get("last_login_at") else None,
        "total_logins": auth_meta.get("total_logins", 0),
        "failed_login_attempts": auth_meta.get("failed_login_attempts", 0),
        "last_failed_login": auth_meta.get("last_failed_login").isoformat() if auth_meta.get("last_failed_login") else None
    }


# User Analytics Endpoints

class TrackEventRequest(BaseModel):
    event_type: str
    metadata: Optional[dict] = None

class GuestTrackEventRequest(BaseModel):
    event_type: str
    device_id: str  # Unique device/session identifier for guests
    metadata: Optional[dict] = None

@api_router.post("/analytics/track")
async def track_event(
    request: TrackEventRequest,
    current_user_id: str = Depends(get_current_user)
):
    """
    Track a user event (authenticated users)
    """
    await track_user_event(db, current_user_id, request.event_type, request.metadata)
    return {"message": "Event tracked successfully"}

@api_router.post("/analytics/track/guest")
async def track_guest_event(request: GuestTrackEventRequest):
    """
    Track a guest user event (no authentication required).
    Uses device_id to identify the guest session.
    Guest events are stored separately and can be merged on signup.
    """
    try:
        # Create guest event document
        guest_event = {
            "device_id": request.device_id,
            "event_type": request.event_type,
            "event_category": EVENT_TYPES.get(request.event_type, "other"),
            "metadata": request.metadata or {},
            "is_guest": True,
            "merged_to_user_id": None,  # Will be set when guest signs up
            "timestamp": datetime.now(timezone.utc),
        }
        
        await db.user_events.insert_one(guest_event)
        logger.info(f"📊 Guest event tracked: {request.event_type} for device {request.device_id[:8]}...")
        
        return {"message": "Guest event tracked successfully"}
    except Exception as e:
        logger.error(f"Error tracking guest event: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to track event")

@api_router.post("/analytics/alias")
async def alias_guest_to_user(
    device_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Merge guest activity into a registered user account.
    Call this after a guest signs up or logs in.
    """
    try:
        # Find all guest events with this device_id that haven't been merged
        result = await db.user_events.update_many(
            {
                "device_id": device_id,
                "is_guest": True,
                "merged_to_user_id": None
            },
            {
                "$set": {
                    "merged_to_user_id": current_user_id,
                    "merged_at": datetime.now(timezone.utc)
                }
            }
        )
        
        merged_count = result.modified_count
        logger.info(f"🔗 Merged {merged_count} guest events from device {device_id[:8]}... to user {current_user_id}")
        
        return {
            "message": f"Successfully merged {merged_count} guest events",
            "merged_count": merged_count
        }
    except Exception as e:
        logger.error(f"Error aliasing guest to user: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to merge guest activity")


@api_router.get("/analytics/activity-summary")
async def get_activity_summary(
    days: int = 30,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get user activity summary for the past N days
    """
    summary = await get_user_activity_summary(db, current_user_id, days)
    return summary


@api_router.get("/analytics/feature-usage")
async def get_feature_usage(
    days: int = 30,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get feature usage statistics
    """
    stats = await get_feature_usage_stats(db, current_user_id, days)
    return stats


@api_router.get("/analytics/workout-stats")
async def get_workout_stats(
    days: int = 30,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get workout analytics
    """
    analytics = await get_workout_analytics(db, current_user_id, days)
    return analytics


@api_router.get("/analytics/social-stats")
async def get_social_stats(
    days: int = 30,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get social engagement statistics
    """
    stats = await get_social_engagement_stats(db, current_user_id, days)
    return stats


@api_router.get("/analytics/user-journey")
async def get_journey(
    limit: int = 100,
    current_user_id: str = Depends(get_current_user)
):
    """
    Get user activity timeline/journey
    """
    journey = await get_user_journey(db, current_user_id, limit)
    return {"journey": journey, "total": len(journey)}


@api_router.get("/analytics/admin/platform-stats")
async def get_platform_stats(
    response: Response,
    days: int = 30,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get platform-wide analytics (admin only)
    
    Query params:
    - days: Number of days to look back (default: 30)
    - include_internal: Include internal/staff users (default: false)
    """
    # Admin check using canonical function
    is_admin, matched_by = await is_admin_effective(current_user_id)
    response.headers["X-Admin-Effective"] = str(is_admin).lower()
    if not is_admin:
        raise HTTPException(status_code=403, detail=f"Admin access required - not in allowlist (checked: {matched_by})")
    
    stats = await get_admin_analytics(db, days, include_internal)
    return stats


# ============================================
# TIME-SERIES ANALYTICS ENDPOINTS
# ============================================

@api_router.get("/analytics/admin/time-series/{metric_type}")
async def get_time_series_analytics(
    metric_type: str,
    response: Response,
    period: str = "day",  # day, week, month
    limit: int = 30,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get time-series data for various metrics.
    
    metric_type options:
    - active_users: Unique users with activity
    - app_sessions: Total app sessions started
    - screen_views: Total screen views
    - screen_time: Total time spent (in minutes)
    - workouts_started: Workouts initiated
    - workouts_completed: Workouts finished
    - mood_selections: Mood/goal selections made
    - posts_created: New posts created
    - social_interactions: Likes, comments, follows combined
    
    Query params:
    - period: day, week, month (default: day)
    - limit: Number of data points (default: 30)
    - include_internal: Include internal/staff users (default: false)
    """
    # Admin check
    is_admin, matched_by = await is_admin_effective(current_user_id)
    response.headers["X-Admin-Effective"] = str(is_admin).lower()
    if not is_admin:
        raise HTTPException(status_code=403, detail=f"Admin access required - not in allowlist (checked: {matched_by})")
    
    from collections import defaultdict
    from admin_analytics import get_internal_user_ids
    
    # Get internal user IDs to exclude
    excluded_user_ids = set()
    if not include_internal:
        excluded_user_ids = await get_internal_user_ids(db)
    
    # Determine time grouping
    if period == "month":
        days_back = 365
        date_format = "%Y-%m"
    elif period == "week":
        days_back = 180
        date_format = "%Y-W%V"
    else:  # day
        days_back = 30 if limit <= 30 else limit
        date_format = "%Y-%m-%d"
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    
    # Build base query filter for exclusion
    base_filter = {"timestamp": {"$gte": cutoff}}
    if excluded_user_ids:
        base_filter["user_id"] = {"$nin": list(excluded_user_ids)}
    
    # Map Python strftime format to MongoDB $dateToString format
    # %V (ISO week) in Python -> %V in Mongo; pair with %G (ISO year) for week period
    if period == "month":
        mongo_date_format = "%Y-%m"
    elif period == "week":
        mongo_date_format = "%G-W%V"  # Use ISO year for week grouping
    else:
        mongo_date_format = "%Y-%m-%d"
    
    # Hard cap to bound any pipeline output (period buckets cannot exceed days_back)
    max_buckets = days_back + 32
    
    try:
        data_by_period = defaultdict(lambda: {"count": 0, "value": 0})
        
        async def _agg_count_by_period(coll, match, date_field):
            """Run a $group-by-period pipeline and return list of {_id, count}."""
            pipeline = [
                {"$match": match},
                {"$group": {
                    "_id": {"$dateToString": {"format": mongo_date_format, "date": f"${date_field}"}},
                    "count": {"$sum": 1},
                }},
                {"$limit": max_buckets},
            ]
            return await coll.aggregate(pipeline, allowDiskUse=True).to_list(max_buckets)
        
        if metric_type == "active_users":
            # Count unique users per period using $addToSet at DB level
            pipeline = [
                {"$match": base_filter},
                {"$group": {
                    "_id": {"$dateToString": {"format": mongo_date_format, "date": "$timestamp"}},
                    "users": {"$addToSet": "$user_id"},
                }},
                {"$project": {"count": {"$size": "$users"}}},
                {"$limit": max_buckets},
            ]
            for row in await db.user_events.aggregate(pipeline, allowDiskUse=True).to_list(max_buckets):
                data_by_period[row["_id"]]["count"] = row["count"]
                
        elif metric_type == "app_sessions":
            for row in await _agg_count_by_period(
                db.user_events, {**base_filter, "event_type": "app_session_start"}, "timestamp"
            ):
                data_by_period[row["_id"]]["count"] = row["count"]
                
        elif metric_type == "screen_views":
            for row in await _agg_count_by_period(
                db.user_events,
                {**base_filter, "event_type": {"$in": ["screen_viewed", "screen_entered"]}},
                "timestamp",
            ):
                data_by_period[row["_id"]]["count"] = row["count"]
                
        elif metric_type == "screen_time":
            pipeline = [
                {"$match": {**base_filter, "event_type": "screen_time_spent"}},
                {"$group": {
                    "_id": {"$dateToString": {"format": mongo_date_format, "date": "$timestamp"}},
                    "count": {"$sum": 1},
                    "total_seconds": {"$sum": {"$ifNull": ["$metadata.duration_seconds", 0]}},
                }},
                {"$limit": max_buckets},
            ]
            for row in await db.user_events.aggregate(pipeline, allowDiskUse=True).to_list(max_buckets):
                data_by_period[row["_id"]]["count"] = row["count"]
                data_by_period[row["_id"]]["value"] = row.get("total_seconds", 0) / 60  # to minutes
                
        elif metric_type == "workouts_started":
            for row in await _agg_count_by_period(
                db.user_events, {**base_filter, "event_type": "workout_started"}, "timestamp"
            ):
                data_by_period[row["_id"]]["count"] = row["count"]
                
        elif metric_type == "workouts_completed":
            for row in await _agg_count_by_period(
                db.user_events, {**base_filter, "event_type": "workout_completed"}, "timestamp"
            ):
                data_by_period[row["_id"]]["count"] = row["count"]
                
        elif metric_type == "mood_selections":
            for row in await _agg_count_by_period(
                db.user_events, {**base_filter, "event_type": "mood_selected"}, "timestamp"
            ):
                data_by_period[row["_id"]]["count"] = row["count"]
                
        elif metric_type == "posts_created":
            posts_filter = {"created_at": {"$gte": cutoff}}
            if excluded_user_ids:
                posts_filter["author_id"] = {"$nin": [ObjectId(uid) for uid in excluded_user_ids if len(uid) == 24]}
            for row in await _agg_count_by_period(db.posts, posts_filter, "created_at"):
                data_by_period[row["_id"]]["count"] = row["count"]
                
        elif metric_type == "social_interactions":
            for row in await _agg_count_by_period(
                db.user_events,
                {**base_filter, "event_type": {"$in": ["post_liked", "post_commented", "user_followed"]}},
                "timestamp",
            ):
                data_by_period[row["_id"]]["count"] = row["count"]
                
        elif metric_type == "new_users":
            users_filter = {"created_at": {"$gte": cutoff}}
            if not include_internal:
                users_filter["is_internal"] = {"$ne": True}
            for row in await _agg_count_by_period(db.users, users_filter, "created_at"):
                data_by_period[row["_id"]]["count"] = row["count"]
        
        # Format response
        sorted_data = sorted(data_by_period.items(), key=lambda x: x[0])[-limit:]
        
        labels = []
        values = []
        secondary_values = []
        
        for date_key, data in sorted_data:
            # Format label
            if period == "month":
                try:
                    dt = datetime.strptime(date_key, "%Y-%m")
                    labels.append(dt.strftime("%b '%y"))
                except:
                    labels.append(date_key)
            elif period == "week":
                labels.append(f"W{date_key.split('W')[1]}")
            else:
                try:
                    dt = datetime.strptime(date_key, "%Y-%m-%d")
                    labels.append(dt.strftime("%m/%d"))
                except:
                    labels.append(date_key[-5:])
            
            values.append(data["count"])
            secondary_values.append(round(data["value"], 1) if data["value"] else 0)
        
        return {
            "metric_type": metric_type,
            "period": period,
            "labels": labels,
            "values": values,
            "secondary_values": secondary_values,  # For metrics like screen_time (minutes)
            "total": sum(values),
            "average": round(sum(values) / len(values), 1) if values else 0,
        }
        
    except Exception as e:
        logger.error(f"Error getting time-series for {metric_type}: {e}")
        return {
            "metric_type": metric_type,
            "period": period,
            "labels": [],
            "values": [],
            "secondary_values": [],
            "total": 0,
            "average": 0,
        }


@api_router.get("/analytics/admin/breakdown/{metric_type}")
async def get_metric_breakdown(
    metric_type: str,
    response: Response,
    period: str = "day",
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """
    Get detailed breakdown of a metric with sub-categories.
    
    metric_type options:
    - screen_views: Breakdown by screen name
    - mood_selections: Breakdown by mood type
    - social_interactions: Breakdown by interaction type
    """
    # Admin check
    is_admin, matched_by = await is_admin_effective(current_user_id)
    response.headers["X-Admin-Effective"] = str(is_admin).lower()
    if not is_admin:
        raise HTTPException(status_code=403, detail=f"Admin access required - not in allowlist (checked: {matched_by})")
    
    from collections import defaultdict
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    try:
        if metric_type == "screen_views":
            pipeline = [
                {"$match": {"timestamp": {"$gte": cutoff}, "event_type": {"$in": ["screen_viewed", "screen_entered"]}}},
                {"$group": {"_id": {"$ifNull": ["$metadata.screen_name", "Unknown"]}, "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 20},
            ]
            rows = await db.user_events.aggregate(pipeline, allowDiskUse=True).to_list(20)
            items = [{"name": r["_id"], "count": r["count"]} for r in rows]
            return {"metric_type": metric_type, "items": items, "total": sum(r["count"] for r in rows)}
            
        elif metric_type == "mood_selections":
            mood_names = {
                "sweat": "I Want to Sweat",
                "energize": "Energize Me",
                "stress": "Stress Relief",
                "strength": "Build Strength",
                "lazy": "Lazy Day Workout",
            }
            pipeline = [
                {"$match": {"timestamp": {"$gte": cutoff}, "event_type": "mood_selected"}},
                {"$group": {"_id": {"$ifNull": ["$metadata.mood", "Unknown"]}, "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 50},
            ]
            rows = await db.user_events.aggregate(pipeline, allowDiskUse=True).to_list(50)
            items = [{"name": mood_names.get(r["_id"], r["_id"]), "count": r["count"]} for r in rows]
            return {"metric_type": metric_type, "items": items, "total": sum(r["count"] for r in rows)}
            
        elif metric_type == "social_interactions":
            type_names = {
                "post_liked": "Likes",
                "post_commented": "Comments",
                "user_followed": "Follows",
                "user_unfollowed": "Unfollows",
            }
            pipeline = [
                {"$match": {"timestamp": {"$gte": cutoff}, "event_type": {"$in": list(type_names.keys())}}},
                {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10},
            ]
            rows = await db.user_events.aggregate(pipeline, allowDiskUse=True).to_list(10)
            items = [{"name": type_names.get(r["_id"], r["_id"]), "count": r["count"]} for r in rows]
            return {"metric_type": metric_type, "items": items, "total": sum(r["count"] for r in rows)}
            
        return {"metric_type": metric_type, "items": [], "total": 0}
        
    except Exception as e:
        logger.error(f"Error getting breakdown for {metric_type}: {e}")
        return {"metric_type": metric_type, "items": [], "total": 0}


# ============================================
# DETAILED ANALYTICS DRILL-DOWN ENDPOINTS
# ============================================

@api_router.get("/analytics/admin/users")
async def get_users_detail_endpoint(
    days: int = 30,
    limit: int = 100,
    skip: int = 0,
    current_user_id: str = Depends(require_admin)
):
    """Get all users with activity summary"""
    return await get_all_users_detail(db, days, limit, skip)


@api_router.get("/analytics/admin/users/new")
async def get_new_users_endpoint(
    days: int = 30,
    limit: int = 100,
    current_user_id: str = Depends(require_admin)
):
    """Get new users who joined in the period"""
    return await get_new_users_detail(db, days, limit)


@api_router.get("/analytics/admin/users/signup-trend")
async def get_signup_trend_endpoint(
    period: str = "day",  # day, week, month
    limit: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get user signup trends grouped by day, week, or month"""
    try:
        # Determine the date grouping format
        if period == "month":
            date_format = "%Y-%m"
            days_back = 365
        elif period == "week":
            date_format = "%Y-W%V"
            days_back = 180
        else:  # day
            date_format = "%Y-%m-%d"
            days_back = 30
        
        cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
        
        # Group at DB level using aggregation (avoid loading all users into memory)
        mongo_date_format = "%G-W%V" if period == "week" else date_format
        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff}}},
            {"$group": {
                "_id": {"$dateToString": {"format": mongo_date_format, "date": "$created_at"}},
                "count": {"$sum": 1},
            }},
            {"$sort": {"_id": -1}},
            {"$limit": max(limit, 1)},
        ]
        rows = await db.users.aggregate(pipeline, allowDiskUse=True).to_list(max(limit, 1))
        
        # Group by period
        from collections import defaultdict
        signup_counts = defaultdict(int)
        for r in rows:
            if r.get("_id"):
                signup_counts[r["_id"]] = r["count"]
        
        # Sort by date and limit
        sorted_data = sorted(signup_counts.items(), key=lambda x: x[0], reverse=True)[:limit]
        sorted_data.reverse()  # Chronological order
        
        # Format for chart
        labels = []
        values = []
        for date_key, count in sorted_data:
            if period == "month":
                # Format as "Jan", "Feb", etc.
                try:
                    dt = datetime.strptime(date_key, "%Y-%m")
                    labels.append(dt.strftime("%b"))
                except:
                    labels.append(date_key[-2:])
            elif period == "week":
                # Format as "W1", "W2", etc.
                labels.append(f"W{date_key.split('W')[1]}")
            else:
                # Format as "12/15", "12/16", etc.
                try:
                    dt = datetime.strptime(date_key, "%Y-%m-%d")
                    labels.append(dt.strftime("%m/%d"))
                except:
                    labels.append(date_key[-5:])
            values.append(count)
        
        return {
            "period": period,
            "labels": labels,
            "values": values,
            "total": sum(values),
        }
        
    except Exception as e:
        logger.error(f"Error getting signup trend: {e}")
        return {
            "period": period,
            "labels": [],
            "values": [],
            "total": 0,
        }


@api_router.get("/analytics/admin/users/active")
async def get_active_users_endpoint(
    days: int = 30,
    limit: int = 100,
    current_user_id: str = Depends(require_admin)
):
    """Get users who were active in the specified period (based on any tracked event)"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    
    logger.info(f"Fetching active users for last {days} days")
    
    # Find unique user IDs from user_events in the period
    active_user_ids = await db.user_events.distinct(
        "user_id",
        {"timestamp": {"$gte": cutoff}}
    )
    
    logger.info(f"Found {len(active_user_ids)} unique active user IDs: {active_user_ids}")
    
    # Get user details for these active users (batch query)
    user_ids_to_lookup = active_user_ids[:limit]
    valid_oids = []
    for uid in user_ids_to_lookup:
        try:
            valid_oids.append(ObjectId(uid))
        except Exception:
            continue
    
    users_cursor = db.users.find(
        {"_id": {"$in": valid_oids}},
        {"_id": 1, "username": 1, "email": 1, "avatar": 1, "created_at": 1}
    )
    user_map = {}
    async for u in users_cursor:
        user_map[str(u["_id"])] = u
    
    # Batch count events per user
    event_counts_pipeline = [
        {"$match": {"user_id": {"$in": list(user_ids_to_lookup)}, "timestamp": {"$gte": cutoff}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]
    event_counts = await db.user_events.aggregate(event_counts_pipeline).to_list(limit)
    event_count_map = {item["_id"]: item["count"] for item in event_counts}
    
    users = []
    for user_id in user_ids_to_lookup:
        user = user_map.get(user_id)
        if user:
            users.append({
                "user_id": str(user["_id"]),
                "username": user.get("username", "Unknown"),
                "email": user.get("email", ""),
                "avatar_url": user.get("avatar"),
                "app_sessions": event_count_map.get(user_id, 0),
                "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            })
    
    logger.info(f"Returning {len(users)} users")
    
    # Sort by activity count
    users.sort(key=lambda x: x.get("app_sessions", 0), reverse=True)
    
    return {
        "users": users,
        "total": len(active_user_ids),
        "period_days": days
    }


@api_router.get("/analytics/admin/users/daily-active")
async def get_daily_active_users_endpoint(
    limit: int = 100,
    current_user_id: str = Depends(require_admin)
):
    """Get users who were active in the last 24 hours"""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    
    logger.info(f"Fetching daily active users (last 24 hours)")
    
    # Find unique user IDs from user_events in the last 24 hours
    daily_active_user_ids = await db.user_events.distinct(
        "user_id",
        {"timestamp": {"$gte": cutoff}}
    )
    
    logger.info(f"Found {len(daily_active_user_ids)} daily active user IDs: {daily_active_user_ids}")
    
    # Get user details (batch query)
    user_ids_to_lookup = daily_active_user_ids[:limit]
    valid_oids = []
    for uid in user_ids_to_lookup:
        try:
            valid_oids.append(ObjectId(uid))
        except Exception:
            continue
    
    users_cursor = db.users.find(
        {"_id": {"$in": valid_oids}},
        {"_id": 1, "username": 1, "email": 1, "avatar": 1, "created_at": 1}
    )
    user_map = {}
    async for u in users_cursor:
        user_map[str(u["_id"])] = u
    
    # Batch get latest events per user
    latest_events_pipeline = [
        {"$match": {"user_id": {"$in": list(user_ids_to_lookup)}}},
        {"$sort": {"timestamp": -1}},
        {"$group": {"_id": "$user_id", "latest_timestamp": {"$first": "$timestamp"}}}
    ]
    latest_events = await db.user_events.aggregate(latest_events_pipeline).to_list(limit)
    latest_event_map = {item["_id"]: item["latest_timestamp"] for item in latest_events}
    
    users = []
    for user_id in user_ids_to_lookup:
        user = user_map.get(user_id)
        if user:
            last_ts = latest_event_map.get(user_id)
            users.append({
                "user_id": str(user["_id"]),
                "username": user.get("username", "Unknown"),
                "email": user.get("email", ""),
                "avatar_url": user.get("avatar"),
                "last_active": last_ts.isoformat() if last_ts else None,
                "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            })
    
    logger.info(f"Returning {len(users)} daily active users")
    
    return {
        "users": users,
        "total": len(daily_active_user_ids),
        "period": "24 hours"
    }


@api_router.get("/analytics/admin/screens")
async def get_screens_breakdown_endpoint(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get breakdown of screen views"""
    return await get_screen_views_breakdown(db, days)


@api_router.get("/analytics/admin/moods")
async def get_moods_breakdown_endpoint(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get breakdown of mood selections"""
    return await get_mood_selections_breakdown(db, days)


@api_router.get("/analytics/admin/equipment")
async def get_equipment_breakdown_endpoint(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get breakdown of equipment selections with mood paths"""
    return await get_equipment_selections_breakdown(db, days)


@api_router.get("/analytics/admin/difficulties")
async def get_difficulties_breakdown_endpoint(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get breakdown of difficulty selections"""
    return await get_difficulty_selections_breakdown(db, days)


@api_router.get("/analytics/admin/try-workout-stats")
async def get_try_workout_stats(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get stats for 'Try this workout' / 'Start Workout' button clicks"""
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days) if days > 0 else None
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Build base query for try_workout_clicked events
        base_query = {"event_type": "try_workout_clicked"}
        if cutoff_date:
            base_query["timestamp"] = {"$gte": cutoff_date}
        
        # Total clicks
        total_clicks = await db.user_events.count_documents(base_query)
        
        # Unique users
        unique_users_pipeline = [
            {"$match": base_query},
            {"$group": {"_id": "$user_id"}},
            {"$count": "count"}
        ]
        unique_result = await db.user_events.aggregate(unique_users_pipeline).to_list(1)
        unique_users = unique_result[0]["count"] if unique_result else 0
        
        # Today's clicks
        today_query = {**base_query, "timestamp": {"$gte": today_start}}
        today_clicks = await db.user_events.count_documents(today_query)
        
        # This week's clicks
        week_query = {**base_query, "timestamp": {"$gte": week_start}}
        this_week_clicks = await db.user_events.count_documents(week_query)
        
        # By source breakdown
        by_source_pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": "$metadata.source",
                "clicks": {"$sum": 1}
            }},
            {"$sort": {"clicks": -1}}
        ]
        by_source_result = await db.user_events.aggregate(by_source_pipeline).to_list(10)
        by_source = [{"source": item["_id"] or "unknown", "clicks": item["clicks"]} for item in by_source_result]
        
        return {
            "total_clicks": total_clicks,
            "unique_users": unique_users,
            "today_clicks": today_clicks,
            "this_week_clicks": this_week_clicks,
            "by_source": by_source
        }
    except Exception as e:
        logger.error(f"Error fetching try workout stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch try workout stats")


@api_router.get("/analytics/admin/session-completion-stats")
async def get_session_completion_stats(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get stats for workout session completions"""
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days) if days > 0 else None
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        # Build base query for workout_session_completed events
        base_query = {"event_type": "workout_session_completed"}
        if cutoff_date:
            base_query["timestamp"] = {"$gte": cutoff_date}
        
        # Total completions
        total_completions = await db.user_events.count_documents(base_query)
        
        # Unique users
        unique_users_pipeline = [
            {"$match": base_query},
            {"$group": {"_id": "$user_id"}},
            {"$count": "count"}
        ]
        unique_result = await db.user_events.aggregate(unique_users_pipeline).to_list(1)
        unique_users = unique_result[0]["count"] if unique_result else 0
        
        # Today's completions
        today_query = {**base_query, "timestamp": {"$gte": today_start}}
        today_completions = await db.user_events.count_documents(today_query)
        
        # This week's completions
        week_query = {**base_query, "timestamp": {"$gte": week_start}}
        this_week_completions = await db.user_events.count_documents(week_query)
        
        # Average duration
        avg_duration_pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": None,
                "avg_duration": {"$avg": "$metadata.duration_seconds"}
            }}
        ]
        avg_result = await db.user_events.aggregate(avg_duration_pipeline).to_list(1)
        avg_duration_seconds = avg_result[0]["avg_duration"] if avg_result and avg_result[0]["avg_duration"] else 0
        
        # By difficulty breakdown
        by_difficulty_pipeline = [
            {"$match": base_query},
            {"$group": {
                "_id": "$metadata.difficulty",
                "completions": {"$sum": 1}
            }},
            {"$sort": {"completions": -1}}
        ]
        by_difficulty_result = await db.user_events.aggregate(by_difficulty_pipeline).to_list(10)
        by_difficulty = [{"difficulty": item["_id"] or "unknown", "completions": item["completions"]} for item in by_difficulty_result]
        
        return {
            "total_completions": total_completions,
            "unique_users": unique_users,
            "today_completions": today_completions,
            "this_week_completions": this_week_completions,
            "avg_duration_seconds": avg_duration_seconds,
            "by_difficulty": by_difficulty
        }
    except Exception as e:
        logger.error(f"Error fetching session completion stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch session completion stats")


@api_router.get("/analytics/admin/engagement")
async def get_engagement_metrics_endpoint(
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get WAU, MAU, and DAU/MAU stickiness metrics.
    Uses app_session_start as the primary activity event.
    
    Query params:
    - include_internal: Include internal users (default: false)
    """
    return await get_engagement_metrics(db, include_internal)


@api_router.get("/analytics/admin/data-freshness")
async def get_data_freshness(
    current_user_id: str = Depends(require_admin)
):
    """
    Get data freshness info - last event timestamp and system info.
    Used to verify data pipeline is working.
    """
    try:
        # Get the most recent event
        latest_event = await db.user_events.find_one(
            {},
            sort=[("timestamp", -1)],
            projection={"timestamp": 1, "event_type": 1, "_id": 0}
        )
        
        # Get event count for last hour
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        events_last_hour = await db.user_events.count_documents({
            "timestamp": {"$gte": one_hour_ago}
        })
        
        # Get event count for last 24 hours
        one_day_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        events_last_24h = await db.user_events.count_documents({
            "timestamp": {"$gte": one_day_ago}
        })
        
        return {
            "last_event_at": latest_event["timestamp"].isoformat() if latest_event and latest_event.get("timestamp") else None,
            "last_event_type": latest_event.get("event_type") if latest_event else None,
            "events_last_hour": events_last_hour,
            "events_last_24h": events_last_24h,
            "checked_at": datetime.now(timezone.utc).isoformat(),
            "git_sha": GIT_SHA,
            "deployed_at": DEPLOYED_AT,
            "environment": APP_ENV,
        }
    except Exception as e:
        logger.error(f"Error getting data freshness: {e}")
        return {
            "last_event_at": None,
            "error": str(e),
            "git_sha": GIT_SHA,
            "deployed_at": DEPLOYED_AT,
        }


@api_router.get("/analytics/admin/workout-engagement-chart")
async def get_workout_engagement_chart(
    period: str = "day",
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get chart data for try workout clicks and session completions over time"""
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Determine date format based on period
        if period == "day":
            date_format = "%Y-%m-%d"
            group_id = {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}}
        elif period == "week":
            # Group by week number
            group_id = {
                "$concat": [
                    {"$toString": {"$year": "$timestamp"}},
                    "-W",
                    {"$toString": {"$isoWeek": "$timestamp"}}
                ]
            }
        else:  # month
            date_format = "%Y-%m"
            group_id = {"$dateToString": {"format": "%Y-%m", "date": "$timestamp"}}
        
        # Get try_workout_clicked data grouped by date
        try_workout_pipeline = [
            {"$match": {
                "event_type": "try_workout_clicked",
                "timestamp": {"$gte": cutoff_date}
            }},
            {"$group": {
                "_id": group_id,
                "clicks": {"$sum": 1},
                "unique_users": {"$addToSet": "$user_id"}
            }},
            {"$project": {
                "_id": 1,
                "clicks": 1,
                "unique_users": {"$size": "$unique_users"}
            }},
            {"$sort": {"_id": 1}}
        ]
        try_workout_result = await db.user_events.aggregate(try_workout_pipeline).to_list(100)
        
        # Get workout_session_completed data grouped by date
        session_completed_pipeline = [
            {"$match": {
                "event_type": "workout_session_completed",
                "timestamp": {"$gte": cutoff_date}
            }},
            {"$group": {
                "_id": group_id,
                "completions": {"$sum": 1},
                "unique_users": {"$addToSet": "$user_id"}
            }},
            {"$project": {
                "_id": 1,
                "completions": 1,
                "unique_users": {"$size": "$unique_users"}
            }},
            {"$sort": {"_id": 1}}
        ]
        session_completed_result = await db.user_events.aggregate(session_completed_pipeline).to_list(100)
        
        # Combine the data
        all_dates = set()
        try_workout_by_date = {}
        session_completed_by_date = {}
        
        for item in try_workout_result:
            date_key = item["_id"]
            all_dates.add(date_key)
            try_workout_by_date[date_key] = {
                "clicks": item["clicks"],
                "unique_users": item["unique_users"]
            }
        
        for item in session_completed_result:
            date_key = item["_id"]
            all_dates.add(date_key)
            session_completed_by_date[date_key] = {
                "completions": item["completions"],
                "unique_users": item["unique_users"]
            }
        
        # Build combined chart data
        chart_data = []
        for date_key in sorted(all_dates):
            try_data = try_workout_by_date.get(date_key, {"clicks": 0, "unique_users": 0})
            session_data = session_completed_by_date.get(date_key, {"completions": 0, "unique_users": 0})
            
            chart_data.append({
                "date": date_key,
                "try_clicks": try_data["clicks"],
                "try_unique_users": try_data["unique_users"],
                "completions": session_data["completions"],
                "completion_unique_users": session_data["unique_users"]
            })
        
        return {
            "period": period,
            "days": days,
            "data": chart_data
        }
    except Exception as e:
        logger.error(f"Error fetching workout engagement chart: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch workout engagement chart")


# ============================================
# ADMIN CONTENT MODERATION ENDPOINTS
# ============================================

@api_router.get("/admin/moderation-logs")
async def get_moderation_logs(
    limit: int = 50,
    skip: int = 0,
    category: Optional[str] = None,
    current_user_id: str = Depends(require_admin)
):
    """Get content moderation logs for admin review (rejected content attempts)"""
    try:
        # Build query
        query = {}
        if category:
            query["category"] = category
        
        # Get logs with pagination
        logs = await db.moderation_logs.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
        
        # Get user info for each log
        result = []
        for log in logs:
            user = await db.users.find_one({"_id": ObjectId(log["user_id"])})
            result.append({
                "id": str(log["_id"]),
                "user_id": log["user_id"],
                "username": user.get("username", "Unknown") if user else "Deleted User",
                "content_type": log.get("content_type"),
                "action": log.get("action"),
                "reason": log.get("reason"),
                "category": log.get("category"),
                "flagged_words": log.get("flagged_words", []),
                "flagged_phrases": log.get("flagged_phrases", []),
                "text_preview": log.get("text_preview", ""),
                "created_at": log.get("created_at").isoformat() if log.get("created_at") else None
            })
        
        # Get total count
        total = await db.moderation_logs.count_documents(query)
        
        return {
            "logs": result,
            "total": total,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error fetching moderation logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch moderation logs")

@api_router.get("/admin/moderation-stats")
async def get_moderation_stats(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get content moderation statistics for admin dashboard"""
    try:
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Aggregate stats by category
        pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {"$group": {
                "_id": "$category",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        
        category_stats = await db.moderation_logs.aggregate(pipeline).to_list(100)
        
        # Aggregate by content type
        type_pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {"$group": {
                "_id": "$content_type",
                "count": {"$sum": 1}
            }}
        ]
        
        type_stats = await db.moderation_logs.aggregate(type_pipeline).to_list(100)
        
        # Total rejections
        total = await db.moderation_logs.count_documents({"created_at": {"$gte": cutoff_date}})
        
        # Repeat offenders (users with multiple rejections)
        repeat_pipeline = [
            {"$match": {"created_at": {"$gte": cutoff_date}}},
            {"$group": {
                "_id": "$user_id",
                "count": {"$sum": 1}
            }},
            {"$match": {"count": {"$gte": 3}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        repeat_offenders = await db.moderation_logs.aggregate(repeat_pipeline).to_list(10)
        
        # Get user info for repeat offenders
        for offender in repeat_offenders:
            user = await db.users.find_one({"_id": ObjectId(offender["_id"])})
            offender["username"] = user.get("username", "Unknown") if user else "Deleted User"
        
        return {
            "period_days": days,
            "total_rejections": total,
            "by_category": {stat["_id"]: stat["count"] for stat in category_stats},
            "by_content_type": {stat["_id"]: stat["count"] for stat in type_stats},
            "repeat_offenders": repeat_offenders
        }
    except Exception as e:
        logger.error(f"Error fetching moderation stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch moderation stats")


@api_router.get("/analytics/admin/exercises")
async def get_exercises_breakdown_endpoint(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get breakdown of exercises completed"""
    return await get_exercises_breakdown(db, days)


@api_router.get("/analytics/admin/social")
async def get_social_breakdown_endpoint(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get breakdown of social activity"""
    return await get_social_activity_breakdown(db, days)


@api_router.get("/analytics/admin/workout-funnel")
async def get_workout_funnel_endpoint(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get detailed workout funnel data"""
    return await get_workout_funnel_detail(db, days)


# ============================================
# ADMIN PANEL V1 - NEW ANALYTICS ENDPOINTS
# ============================================

@api_router.get("/analytics/admin/funnel")
async def get_funnel_endpoint(
    start: Optional[str] = None,
    end: Optional[str] = None,
    steps: Optional[str] = None,  # Comma-separated list of event types
    include_users: bool = False,
    limit_users: int = 100,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get funnel analysis with conversion rates between steps.
    
    Query params:
    - start: ISO date string (default: 30 days ago)
    - end: ISO date string (default: now)
    - steps: Comma-separated event types (default: app_session_start,mood_selected,workout_started,workout_completed,post_created)
    - include_users: Include user IDs for each step
    - limit_users: Max users to return per step
    - include_internal: Include internal/staff users (default: false)
    
    Example: /analytics/admin/funnel?start=2025-01-01&end=2025-01-31&steps=app_session_start,workout_started,workout_completed
    """
    try:
        # Parse dates
        if end:
            end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
        else:
            end_date = datetime.now(timezone.utc)
        
        if start:
            start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
        else:
            start_date = end_date - timedelta(days=30)
        
        # Parse steps
        step_list = None
        if steps:
            step_list = [s.strip() for s in steps.split(",") if s.strip()]
        
        return await get_funnel_analysis(
            db, start_date, end_date, step_list, include_users, limit_users, include_internal
        )
    except Exception as e:
        logger.error(f"Funnel endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/retention")
async def get_retention_endpoint(
    start: Optional[str] = None,
    end: Optional[str] = None,
    cohort: str = "week",  # day, week, month
    window: int = 28,  # retention window in days
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get retention cohort analysis.
    
    Query params:
    - start: ISO date string (default: 90 days ago)
    - end: ISO date string (default: now)
    - cohort: Cohort grouping period (day, week, month)
    - window: Retention window in days (default: 28)
    - include_internal: Include internal/staff users (default: false)
    
    Returns cohort retention table with D1, D7, D14, D28 retention rates.
    """
    try:
        # Parse dates
        if end:
            end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
        else:
            end_date = datetime.now(timezone.utc)
        
        if start:
            start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
        else:
            start_date = end_date - timedelta(days=90)
        
        return await get_retention_cohorts(db, start_date, end_date, cohort, window, include_internal)
    except Exception as e:
        logger.error(f"Retention endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/users/search")
async def search_users_endpoint(
    q: str,
    limit: int = 50,
    skip: int = 0,
    current_user_id: str = Depends(require_admin)
):
    """
    Search users by email, username, or user_id.
    
    Query params:
    - q: Search query (min 2 characters)
    - limit: Max results (default: 50)
    - skip: Pagination offset
    
    Returns user details with 30-day activity summary.
    """
    if len(q) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    
    return await search_users(db, q, limit, skip)


@api_router.get("/analytics/admin/users/{user_id}/timeline")
async def get_user_timeline_endpoint(
    user_id: str,
    start: Optional[str] = None,
    end: Optional[str] = None,
    limit: int = 200,
    event_types: Optional[str] = None,
    current_user_id: str = Depends(require_admin)
):
    """
    Get detailed event timeline for a specific user.
    
    Path params:
    - user_id: User's MongoDB ObjectId or custom user_id
    
    Query params:
    - start: ISO date string (optional)
    - end: ISO date string (optional)
    - limit: Max events (default: 200)
    - event_types: Comma-separated list of event types to filter
    
    Returns events grouped by day with login history and active sessions.
    """
    try:
        start_date = None
        end_date = None
        
        if start:
            start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
        if end:
            end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
        
        event_type_list = None
        if event_types:
            event_type_list = [e.strip() for e in event_types.split(",") if e.strip()]
        
        return await get_user_timeline(db, user_id, start_date, end_date, limit, event_type_list)
    except Exception as e:
        logger.error(f"User timeline endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/users/{user_id}/lifecycle")
async def get_user_lifecycle_endpoint(
    user_id: str,
    current_user_id: str = Depends(require_admin)
):
    """
    Get comprehensive lifecycle summary and churn risk for a user.
    
    Path params:
    - user_id: User's MongoDB ObjectId or custom user_id
    
    Returns:
    - Lifecycle stage (new, activated, engaged, power_user, at_risk, churned)
    - Churn risk score (0-100) with contributing factors
    - Key milestones and dates
    - Engagement trends
    """
    try:
        # Find user
        user = None
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            pass
        
        if not user:
            user = await db.users.find_one({"user_id": user_id})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        uid = str(user["_id"])
        now = datetime.now(timezone.utc)
        
        # Helper to make datetime timezone-aware
        def make_aware(dt):
            if dt is None:
                return None
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        
        # Calculate key dates
        created_at = make_aware(user.get("created_at"))
        account_age_days = (now - created_at).days if created_at else 0
        
        # Get activity data
        # First app session
        first_session = await db.user_events.find_one(
            {"user_id": uid, "event_type": "app_session_start"},
            sort=[("timestamp", 1)]
        )
        
        # Last app session
        last_session = await db.user_events.find_one(
            {"user_id": uid, "event_type": "app_session_start"},
            sort=[("timestamp", -1)]
        )
        
        # First workout
        first_workout = await db.user_events.find_one(
            {"user_id": uid, "event_type": "workout_started"},
            sort=[("timestamp", 1)]
        )
        
        # Last workout
        last_workout = await db.user_events.find_one(
            {"user_id": uid, "event_type": "workout_started"},
            sort=[("timestamp", -1)]
        )
        
        # First completed workout
        first_completed = await db.user_events.find_one(
            {"user_id": uid, "event_type": "workout_completed"},
            sort=[("timestamp", 1)]
        )
        
        # Days since last activity
        days_since_last_session = None
        if last_session and last_session.get("timestamp"):
            last_session_ts = make_aware(last_session["timestamp"])
            days_since_last_session = (now - last_session_ts).days
        
        days_since_last_workout = None
        if last_workout and last_workout.get("timestamp"):
            last_workout_ts = make_aware(last_workout["timestamp"])
            days_since_last_workout = (now - last_workout_ts).days
        
        # Get activity counts by period
        periods = {
            "7d": now - timedelta(days=7),
            "14d": now - timedelta(days=14),
            "30d": now - timedelta(days=30),
            "90d": now - timedelta(days=90),
        }
        
        activity_trends = {}
        for period_name, cutoff in periods.items():
            sessions = await db.user_events.count_documents({
                "user_id": uid,
                "event_type": "app_session_start",
                "timestamp": {"$gte": cutoff}
            })
            workouts_started = await db.user_events.count_documents({
                "user_id": uid,
                "event_type": "workout_started",
                "timestamp": {"$gte": cutoff}
            })
            workouts_completed = await db.user_events.count_documents({
                "user_id": uid,
                "event_type": "workout_completed",
                "timestamp": {"$gte": cutoff}
            })
            posts = await db.user_events.count_documents({
                "user_id": uid,
                "event_type": "post_created",
                "timestamp": {"$gte": cutoff}
            })
            social_actions = await db.user_events.count_documents({
                "user_id": uid,
                "event_type": {"$in": ["post_liked", "post_commented", "user_followed"]},
                "timestamp": {"$gte": cutoff}
            })
            
            activity_trends[period_name] = {
                "sessions": sessions,
                "workouts_started": workouts_started,
                "workouts_completed": workouts_completed,
                "posts": posts,
                "social_actions": social_actions,
            }
        
        # Total lifetime stats
        total_sessions = await db.user_events.count_documents({
            "user_id": uid,
            "event_type": "app_session_start"
        })
        total_workouts_started = await db.user_events.count_documents({
            "user_id": uid,
            "event_type": "workout_started"
        })
        total_workouts_completed = await db.user_events.count_documents({
            "user_id": uid,
            "event_type": "workout_completed"
        })
        
        # Calculate churn risk score (0-100)
        churn_risk = 0
        churn_factors = []
        
        # Factor 1: Days since last session (0-30 points)
        if days_since_last_session is not None:
            if days_since_last_session >= 30:
                churn_risk += 30
                churn_factors.append({"factor": "inactive_30d", "impact": 30, "detail": f"No sessions in {days_since_last_session} days"})
            elif days_since_last_session >= 14:
                churn_risk += 20
                churn_factors.append({"factor": "inactive_14d", "impact": 20, "detail": f"No sessions in {days_since_last_session} days"})
            elif days_since_last_session >= 7:
                churn_risk += 10
                churn_factors.append({"factor": "inactive_7d", "impact": 10, "detail": f"No sessions in {days_since_last_session} days"})
        else:
            churn_risk += 25
            churn_factors.append({"factor": "no_sessions", "impact": 25, "detail": "Never opened the app"})
        
        # Factor 2: Never completed a workout (0-25 points)
        if total_workouts_completed == 0:
            if total_workouts_started > 0:
                churn_risk += 15
                churn_factors.append({"factor": "no_completions", "impact": 15, "detail": f"Started {total_workouts_started} workouts, completed 0"})
            elif first_workout is None:
                churn_risk += 25
                churn_factors.append({"factor": "never_exercised", "impact": 25, "detail": "Never started a workout"})
        
        # Factor 3: Activity trend declining (0-20 points)
        if activity_trends["7d"]["sessions"] == 0 and activity_trends["30d"]["sessions"] > 0:
            churn_risk += 15
            churn_factors.append({"factor": "declining_activity", "impact": 15, "detail": "No activity in last 7d but was active in 30d"})
        elif activity_trends["14d"]["sessions"] == 0 and activity_trends["30d"]["sessions"] > 0:
            churn_risk += 10
            churn_factors.append({"factor": "declining_activity", "impact": 10, "detail": "No activity in last 14d but was active in 30d"})
        
        # Factor 4: Low engagement (0-15 points)
        if account_age_days > 14:
            sessions_per_week = (total_sessions / max(1, account_age_days)) * 7
            if sessions_per_week < 1:
                churn_risk += 10
                churn_factors.append({"factor": "low_engagement", "impact": 10, "detail": f"Avg {sessions_per_week:.1f} sessions/week"})
        
        # Factor 5: No social connections (0-10 points)
        follows = await db.user_events.count_documents({
            "user_id": uid,
            "event_type": "user_followed"
        })
        if follows == 0 and account_age_days > 7:
            churn_risk += 5
            churn_factors.append({"factor": "no_social", "impact": 5, "detail": "Not following anyone"})
        
        # Cap at 100
        churn_risk = min(100, churn_risk)
        
        # Determine lifecycle stage
        lifecycle_stage = "new"
        if days_since_last_session is not None and days_since_last_session >= 30:
            lifecycle_stage = "churned"
        elif days_since_last_session is not None and days_since_last_session >= 14:
            lifecycle_stage = "at_risk"
        elif total_workouts_completed == 0:
            if first_workout:
                lifecycle_stage = "activated"  # Started but not completed
            else:
                lifecycle_stage = "new"
        elif activity_trends["7d"]["workouts_completed"] >= 3:
            lifecycle_stage = "power_user"
        elif activity_trends["30d"]["workouts_completed"] >= 4:
            lifecycle_stage = "engaged"
        elif total_workouts_completed >= 1:
            lifecycle_stage = "activated"
        
        # Build milestones
        milestones = []
        if created_at:
            milestones.append({"event": "account_created", "date": created_at.isoformat(), "label": "Joined"})
        if first_session:
            first_session_ts = make_aware(first_session["timestamp"])
            milestones.append({"event": "first_session", "date": first_session_ts.isoformat(), "label": "First app open"})
        if first_workout:
            first_workout_ts = make_aware(first_workout["timestamp"])
            milestones.append({"event": "first_workout", "date": first_workout_ts.isoformat(), "label": "First workout started"})
        if first_completed:
            first_completed_ts = make_aware(first_completed["timestamp"])
            milestones.append({"event": "first_completed", "date": first_completed_ts.isoformat(), "label": "First workout completed"})
        
        # Time to first workout
        time_to_first_workout_hours = None
        if created_at and first_workout and first_workout.get("timestamp"):
            first_workout_ts = make_aware(first_workout["timestamp"])
            time_to_first_workout_hours = round((first_workout_ts - created_at).total_seconds() / 3600, 1)
        
        return {
            "user_id": uid,
            "username": user.get("username"),
            "lifecycle": {
                "stage": lifecycle_stage,
                "account_age_days": account_age_days,
                "days_since_last_session": days_since_last_session,
                "days_since_last_workout": days_since_last_workout,
            },
            "churn_risk": {
                "score": churn_risk,
                "level": "high" if churn_risk >= 60 else "medium" if churn_risk >= 30 else "low",
                "factors": churn_factors,
            },
            "milestones": milestones,
            "time_to_first_workout_hours": time_to_first_workout_hours,
            "lifetime_stats": {
                "total_sessions": total_sessions,
                "total_workouts_started": total_workouts_started,
                "total_workouts_completed": total_workouts_completed,
                "completion_rate": round((total_workouts_completed / max(1, total_workouts_started)) * 100, 1),
            },
            "activity_trends": activity_trends,
            "current_streak": user.get("current_streak", 0),
            "longest_streak": user.get("longest_streak", 0),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"User lifecycle endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/drilldown/users")
async def get_drilldown_users(
    metric: str,
    start: str,
    end: str,
    value: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get users who contributed to a specific metric for drill-down views.
    
    Query params:
    - metric: Metric type (active_users, new_users, workouts_started, workouts_completed, posts_created, etc.)
    - start: ISO date string for period start
    - end: ISO date string for period end
    - value: Optional specific value to filter by (e.g., mood category, equipment type)
    - limit: Max results (default: 100)
    - skip: Pagination offset
    - include_internal: Include internal/staff users (default: false)
    
    Returns list of users with their contribution to the metric.
    """
    try:
        start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
        
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            internal_users = await db.users.find(
                {"is_internal": True},
                {"_id": 1}
            ).to_list(1000)
            excluded_user_ids = {str(u["_id"]) for u in internal_users}
        
        users_data = []
        
        # Define event type mappings
        event_mappings = {
            "active_users": ["app_session_start"],
            "workouts_started": ["workout_started"],
            "workouts_completed": ["workout_completed"],
            "posts_created": ["post_created"],
            "mood_selections": ["mood_selected"],
            "social_interactions": ["post_liked", "post_commented", "user_followed"],
            "app_sessions": ["app_session_start"],
            "screen_views": ["screen_viewed", "screen_entered"],
        }
        
        if metric == "new_users":
            # Query users collection for new signups
            query = {"created_at": {"$gte": start_date, "$lte": end_date}}
            if not include_internal:
                query["is_internal"] = {"$ne": True}
            
            users = await db.users.find(query).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
            total = await db.users.count_documents(query)
            
            for user in users:
                users_data.append({
                    "user_id": str(user["_id"]),
                    "username": user.get("username", ""),
                    "email": user.get("email", ""),
                    "name": user.get("name", ""),
                    "avatar": user.get("avatar", ""),
                    "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
                    "metric_value": 1,
                    "metric_detail": "Signed up",
                })
        else:
            # Query user_events for other metrics
            event_types = event_mappings.get(metric, [metric])
            
            pipeline = [
                {
                    "$match": {
                        "timestamp": {"$gte": start_date, "$lte": end_date},
                        "event_type": {"$in": event_types},
                    }
                },
            ]
            
            # Add internal user exclusion
            if excluded_user_ids:
                pipeline[0]["$match"]["user_id"] = {"$nin": list(excluded_user_ids)}
            
            # Add value filter if provided (e.g., specific mood category)
            if value:
                if metric == "mood_selections":
                    pipeline[0]["$match"]["metadata.mood"] = value
                elif metric == "screen_views":
                    pipeline[0]["$match"]["metadata.screen_name"] = value
            
            # Group by user and count
            pipeline.extend([
                {
                    "$group": {
                        "_id": "$user_id",
                        "count": {"$sum": 1},
                        "first_event": {"$min": "$timestamp"},
                        "last_event": {"$max": "$timestamp"},
                    }
                },
                {"$sort": {"count": -1}},
                {"$skip": skip},
                {"$limit": limit},
            ])
            
            aggregated = await db.user_events.aggregate(pipeline).to_list(limit)
            
            # Count total unique users
            count_pipeline = [
                {
                    "$match": {
                        "timestamp": {"$gte": start_date, "$lte": end_date},
                        "event_type": {"$in": event_types},
                    }
                },
                {"$group": {"_id": "$user_id"}},
                {"$count": "total"},
            ]
            if excluded_user_ids:
                count_pipeline[0]["$match"]["user_id"] = {"$nin": list(excluded_user_ids)}
            
            count_result = await db.user_events.aggregate(count_pipeline).to_list(1)
            total = count_result[0]["total"] if count_result else 0
            
            # Enrich with user data (batch query)
            user_ids = [item["_id"] for item in aggregated]
            valid_oids = []
            for uid in user_ids:
                try:
                    valid_oids.append(ObjectId(uid))
                except Exception:
                    continue
            
            users_cursor = db.users.find(
                {"$or": [{"_id": {"$in": valid_oids}}, {"user_id": {"$in": user_ids}}]},
                {"_id": 1, "user_id": 1, "username": 1, "email": 1, "name": 1, "avatar": 1, "created_at": 1}
            )
            user_map = {}
            async for u in users_cursor:
                user_map[str(u["_id"])] = u
                if u.get("user_id"):
                    user_map[u["user_id"]] = u
            
            for item in aggregated:
                user_id = item["_id"]
                user = user_map.get(user_id)
                
                if user:
                    users_data.append({
                        "user_id": user_id,
                        "username": user.get("username", ""),
                        "email": user.get("email", ""),
                        "name": user.get("name", ""),
                        "avatar": user.get("avatar", ""),
                        "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
                        "metric_value": item["count"],
                        "metric_detail": f"{item['count']} events",
                        "first_event": item["first_event"].isoformat() if item.get("first_event") else None,
                        "last_event": item["last_event"].isoformat() if item.get("last_event") else None,
                    })
        
        return {
            "metric": metric,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "value_filter": value,
            "users": users_data,
            "total": total,
            "limit": limit,
            "skip": skip,
            "include_internal": include_internal,
        }
        
    except Exception as e:
        logger.error(f"Drilldown users endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/drilldown/events")
async def get_drilldown_events(
    metric: str,
    start: str,
    end: str,
    user_id: Optional[str] = None,
    value: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get raw events for a specific metric for drill-down views.
    
    Query params:
    - metric: Metric type
    - start: ISO date string for period start
    - end: ISO date string for period end
    - user_id: Optional user ID to filter events
    - value: Optional specific value to filter by
    - limit: Max results (default: 100)
    - skip: Pagination offset
    - include_internal: Include internal/staff users (default: false)
    
    Returns list of events with metadata.
    """
    try:
        start_date = datetime.fromisoformat(start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(end.replace('Z', '+00:00'))
        
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            internal_users = await db.users.find(
                {"is_internal": True},
                {"_id": 1}
            ).to_list(1000)
            excluded_user_ids = {str(u["_id"]) for u in internal_users}
        
        # Define event type mappings
        event_mappings = {
            "active_users": ["app_session_start"],
            "workouts_started": ["workout_started"],
            "workouts_completed": ["workout_completed"],
            "posts_created": ["post_created"],
            "mood_selections": ["mood_selected"],
            "social_interactions": ["post_liked", "post_commented", "user_followed"],
            "app_sessions": ["app_session_start"],
            "screen_views": ["screen_viewed", "screen_entered"],
        }
        
        event_types = event_mappings.get(metric, [metric])
        
        # Build query
        query = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
            "event_type": {"$in": event_types},
        }
        
        if user_id:
            query["user_id"] = user_id
        elif excluded_user_ids:
            query["user_id"] = {"$nin": list(excluded_user_ids)}
        
        if value:
            if metric == "mood_selections":
                query["metadata.mood"] = value
            elif metric == "screen_views":
                query["metadata.screen_name"] = value
        
        # Get events
        events = await db.user_events.find(query).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
        total = await db.user_events.count_documents(query)
        
        # Batch fetch usernames for all events (avoid N+1)
        user_ids = set()
        for event in events:
            uid = event.get("user_id")
            if uid:
                try:
                    user_ids.add(ObjectId(uid))
                except:
                    pass
        user_map = {}
        if user_ids:
            users_list = await db.users.find({"_id": {"$in": list(user_ids)}}, {"_id": 1, "username": 1}).to_list(len(user_ids))
            user_map = {str(u["_id"]): u.get("username", "Unknown") for u in users_list}
        
        formatted_events = []
        for event in events:
            formatted_events.append({
                "event_id": str(event["_id"]),
                "event_type": event.get("event_type"),
                "user_id": event.get("user_id"),
                "username": user_map.get(event.get("user_id", ""), "Unknown"),
                "timestamp": event.get("timestamp").isoformat() if event.get("timestamp") else None,
                "metadata": event.get("metadata", {}),
            })
        
        return {
            "metric": metric,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "user_filter": user_id,
            "value_filter": value,
            "events": formatted_events,
            "total": total,
            "limit": limit,
            "skip": skip,
            "include_internal": include_internal,
        }
        
    except Exception as e:
        logger.error(f"Drilldown events endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SAVED VIEWS ENDPOINTS ====================

class SavedViewCreate(BaseModel):
    name: str
    description: Optional[str] = None
    view_type: str  # "overview", "funnel", "retention", "custom"
    config: dict  # Stores filters, chart settings, selected metrics, etc.
    is_default: bool = False

class SavedViewUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None
    is_default: Optional[bool] = None


@api_router.get("/analytics/admin/saved-views")
async def get_saved_views(
    view_type: Optional[str] = None,
    current_user_id: str = Depends(require_admin)
):
    """
    Get all saved views for the current admin user.
    
    Query params:
    - view_type: Optional filter by type (overview, funnel, retention, custom)
    
    Returns list of saved views.
    """
    try:
        query = {"user_id": current_user_id}
        if view_type:
            query["view_type"] = view_type
        
        views = await db.admin_saved_views.find(query).sort("created_at", -1).to_list(100)
        
        return {
            "views": [
                {
                    "id": str(view["_id"]),
                    "name": view.get("name", ""),
                    "description": view.get("description", ""),
                    "view_type": view.get("view_type", "custom"),
                    "config": view.get("config", {}),
                    "is_default": view.get("is_default", False),
                    "created_at": view.get("created_at").isoformat() if view.get("created_at") else None,
                    "updated_at": view.get("updated_at").isoformat() if view.get("updated_at") else None,
                }
                for view in views
            ],
            "total": len(views),
        }
    except Exception as e:
        logger.error(f"Get saved views error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/analytics/admin/saved-views")
async def create_saved_view(
    view: SavedViewCreate,
    current_user_id: str = Depends(require_admin)
):
    """
    Create a new saved view.
    
    Body:
    - name: View name
    - description: Optional description
    - view_type: Type of view (overview, funnel, retention, custom)
    - config: JSON object with view configuration
    - is_default: Whether this is the default view for its type
    
    Returns the created view.
    """
    try:
        now = datetime.now(timezone.utc)
        
        # If setting as default, unset other defaults of same type
        if view.is_default:
            await db.admin_saved_views.update_many(
                {"user_id": current_user_id, "view_type": view.view_type, "is_default": True},
                {"$set": {"is_default": False}}
            )
        
        view_doc = {
            "user_id": current_user_id,
            "name": view.name,
            "description": view.description,
            "view_type": view.view_type,
            "config": view.config,
            "is_default": view.is_default,
            "created_at": now,
            "updated_at": now,
        }
        
        result = await db.admin_saved_views.insert_one(view_doc)
        
        return {
            "id": str(result.inserted_id),
            "name": view.name,
            "description": view.description,
            "view_type": view.view_type,
            "config": view.config,
            "is_default": view.is_default,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "message": "View saved successfully",
        }
    except Exception as e:
        logger.error(f"Create saved view error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/saved-views/{view_id}")
async def get_saved_view(
    view_id: str,
    current_user_id: str = Depends(require_admin)
):
    """Get a specific saved view by ID."""
    try:
        view = await db.admin_saved_views.find_one({
            "_id": ObjectId(view_id),
            "user_id": current_user_id
        })
        
        if not view:
            raise HTTPException(status_code=404, detail="Saved view not found")
        
        return {
            "id": str(view["_id"]),
            "name": view.get("name", ""),
            "description": view.get("description", ""),
            "view_type": view.get("view_type", "custom"),
            "config": view.get("config", {}),
            "is_default": view.get("is_default", False),
            "created_at": view.get("created_at").isoformat() if view.get("created_at") else None,
            "updated_at": view.get("updated_at").isoformat() if view.get("updated_at") else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get saved view error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/analytics/admin/saved-views/{view_id}")
async def update_saved_view(
    view_id: str,
    update: SavedViewUpdate,
    current_user_id: str = Depends(require_admin)
):
    """Update an existing saved view."""
    try:
        # Check view exists and belongs to user
        existing = await db.admin_saved_views.find_one({
            "_id": ObjectId(view_id),
            "user_id": current_user_id
        })
        
        if not existing:
            raise HTTPException(status_code=404, detail="Saved view not found")
        
        # Build update document
        update_doc = {"updated_at": datetime.now(timezone.utc)}
        if update.name is not None:
            update_doc["name"] = update.name
        if update.description is not None:
            update_doc["description"] = update.description
        if update.config is not None:
            update_doc["config"] = update.config
        if update.is_default is not None:
            update_doc["is_default"] = update.is_default
            # If setting as default, unset other defaults
            if update.is_default:
                await db.admin_saved_views.update_many(
                    {
                        "user_id": current_user_id,
                        "view_type": existing.get("view_type"),
                        "is_default": True,
                        "_id": {"$ne": ObjectId(view_id)}
                    },
                    {"$set": {"is_default": False}}
                )
        
        await db.admin_saved_views.update_one(
            {"_id": ObjectId(view_id)},
            {"$set": update_doc}
        )
        
        # Get updated document
        updated = await db.admin_saved_views.find_one({"_id": ObjectId(view_id)})
        
        return {
            "id": str(updated["_id"]),
            "name": updated.get("name", ""),
            "description": updated.get("description", ""),
            "view_type": updated.get("view_type", "custom"),
            "config": updated.get("config", {}),
            "is_default": updated.get("is_default", False),
            "created_at": updated.get("created_at").isoformat() if updated.get("created_at") else None,
            "updated_at": updated.get("updated_at").isoformat() if updated.get("updated_at") else None,
            "message": "View updated successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update saved view error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/analytics/admin/saved-views/{view_id}")
async def delete_saved_view(
    view_id: str,
    current_user_id: str = Depends(require_admin)
):
    """Delete a saved view."""
    try:
        result = await db.admin_saved_views.delete_one({
            "_id": ObjectId(view_id),
            "user_id": current_user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Saved view not found")
        
        return {"message": "View deleted successfully", "id": view_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete saved view error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ACTIVATION METRICS ====================

@api_router.get("/analytics/admin/activation")
async def get_activation_metrics(
    days: int = 30,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get activation metrics: time-to-first-workout, onboarding completion rates.
    
    Query params:
    - days: Analysis period (default: 30)
    - include_internal: Include internal/staff users (default: false)
    
    Returns activation funnel and timing metrics.
    """
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get users created in period
        user_query = {"created_at": {"$gte": cutoff}}
        if not include_internal:
            user_query["is_internal"] = {"$ne": True}
        
        users = await db.users.find(user_query, {"_id": 1, "created_at": 1}).to_list(10000)
        user_ids = [str(u["_id"]) for u in users]
        user_created_map = {str(u["_id"]): u["created_at"] for u in users}
        
        total_new_users = len(users)
        
        if total_new_users == 0:
            return {
                "period_days": days,
                "total_new_users": 0,
                "activation_funnel": [],
                "time_to_first_workout": {"median_hours": None, "avg_hours": None, "distribution": []},
                "activated_users": 0,
                "activation_rate": 0,
            }
        
        # Get first workout for each user
        first_workout_pipeline = [
            {
                "$match": {
                    "event_type": "workout_started",
                    "user_id": {"$in": user_ids},
                    "timestamp": {"$gte": cutoff},
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "first_workout": {"$min": "$timestamp"},
                }
            }
        ]
        
        first_workouts = await db.user_events.aggregate(first_workout_pipeline).to_list(10000)
        first_workout_map = {fw["_id"]: fw["first_workout"] for fw in first_workouts}
        
        # Calculate time to first workout
        time_to_first = []
        for user_id in user_ids:
            if user_id in first_workout_map and user_id in user_created_map:
                created = user_created_map[user_id]
                first_wkt = first_workout_map[user_id]
                if first_wkt and created:
                    hours = (first_wkt - created).total_seconds() / 3600
                    if hours >= 0:  # Valid positive time
                        time_to_first.append(hours)
        
        # Time distribution buckets
        distribution = {
            "within_1h": 0,
            "1h_to_24h": 0,
            "24h_to_72h": 0,
            "72h_to_7d": 0,
            "after_7d": 0,
        }
        
        for hours in time_to_first:
            if hours <= 1:
                distribution["within_1h"] += 1
            elif hours <= 24:
                distribution["1h_to_24h"] += 1
            elif hours <= 72:
                distribution["24h_to_72h"] += 1
            elif hours <= 168:
                distribution["72h_to_7d"] += 1
            else:
                distribution["after_7d"] += 1
        
        # Calculate median and avg
        median_hours = None
        avg_hours = None
        if time_to_first:
            sorted_times = sorted(time_to_first)
            median_hours = round(sorted_times[len(sorted_times) // 2], 1)
            avg_hours = round(sum(time_to_first) / len(time_to_first), 1)
        
        activated_users = len(first_workout_map)
        activation_rate = round((activated_users / total_new_users) * 100, 1) if total_new_users > 0 else 0
        
        # Activation funnel: signup -> mood_selected -> workout_started -> workout_completed
        funnel_events = ["mood_selected", "workout_started", "workout_completed"]
        funnel_data = [{"step": "signup", "users": total_new_users, "rate": 100}]
        
        for event_type in funnel_events:
            event_users = await db.user_events.distinct(
                "user_id",
                {
                    "event_type": event_type,
                    "user_id": {"$in": user_ids},
                    "timestamp": {"$gte": cutoff},
                }
            )
            count = len(event_users)
            rate = round((count / total_new_users) * 100, 1) if total_new_users > 0 else 0
            funnel_data.append({"step": event_type, "users": count, "rate": rate})
        
        return {
            "period_days": days,
            "total_new_users": total_new_users,
            "activated_users": activated_users,
            "activation_rate": activation_rate,
            "time_to_first_workout": {
                "median_hours": median_hours,
                "avg_hours": avg_hours,
                "distribution": [
                    {"bucket": k, "count": v, "percentage": round((v / len(time_to_first)) * 100, 1) if time_to_first else 0}
                    for k, v in distribution.items()
                ],
            },
            "activation_funnel": funnel_data,
            "include_internal": include_internal,
        }
        
    except Exception as e:
        logger.error(f"Activation metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== WORKOUT QUALITY METRICS ====================

@api_router.get("/analytics/admin/workout-quality")
async def get_workout_quality_metrics(
    days: int = 30,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get workout quality metrics: completion/abandon rates by category, equipment, difficulty.
    
    Query params:
    - days: Analysis period (default: 30)
    - include_internal: Include internal/staff users (default: false)
    
    Returns detailed workout performance breakdown.
    """
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            internal_users = await db.users.find({"is_internal": True}, {"_id": 1}).to_list(1000)
            excluded_user_ids = {str(u["_id"]) for u in internal_users}
        
        # Build match stage
        match_stage = {"timestamp": {"$gte": cutoff}}
        if excluded_user_ids:
            match_stage["user_id"] = {"$nin": list(excluded_user_ids)}
        
        # Get workouts started with metadata
        started_pipeline = [
            {"$match": {**match_stage, "event_type": "workout_started"}},
            {
                "$group": {
                    "_id": {
                        "mood": "$metadata.mood_category",
                        "difficulty": "$metadata.difficulty",
                        "equipment": "$metadata.equipment",
                    },
                    "started_count": {"$sum": 1},
                    "user_ids": {"$addToSet": "$user_id"},
                }
            }
        ]
        
        started_results = await db.user_events.aggregate(started_pipeline).to_list(1000)
        
        # Get workouts completed
        completed_pipeline = [
            {"$match": {**match_stage, "event_type": "workout_completed"}},
            {
                "$group": {
                    "_id": {
                        "mood": "$metadata.mood_category",
                        "difficulty": "$metadata.difficulty",
                        "equipment": "$metadata.equipment",
                    },
                    "completed_count": {"$sum": 1},
                }
            }
        ]
        
        completed_results = await db.user_events.aggregate(completed_pipeline).to_list(1000)
        completed_map = {
            (r["_id"].get("mood"), r["_id"].get("difficulty"), r["_id"].get("equipment")): r["completed_count"]
            for r in completed_results
        }
        
        # Calculate by mood category
        by_mood = {}
        by_difficulty = {}
        by_equipment = {}
        
        total_started = 0
        total_completed = 0
        
        for item in started_results:
            mood = item["_id"].get("mood") or "Unknown"
            difficulty = item["_id"].get("difficulty") or "Unknown"
            equipment = item["_id"].get("equipment") or "None"
            started = item["started_count"]
            completed = completed_map.get(
                (item["_id"].get("mood"), item["_id"].get("difficulty"), item["_id"].get("equipment")),
                0
            )
            
            total_started += started
            total_completed += completed
            
            # Aggregate by mood
            if mood not in by_mood:
                by_mood[mood] = {"started": 0, "completed": 0, "unique_users": set()}
            by_mood[mood]["started"] += started
            by_mood[mood]["completed"] += completed
            by_mood[mood]["unique_users"].update(item.get("user_ids", []))
            
            # Aggregate by difficulty
            if difficulty not in by_difficulty:
                by_difficulty[difficulty] = {"started": 0, "completed": 0}
            by_difficulty[difficulty]["started"] += started
            by_difficulty[difficulty]["completed"] += completed
            
            # Aggregate by equipment
            if equipment not in by_equipment:
                by_equipment[equipment] = {"started": 0, "completed": 0}
            by_equipment[equipment]["started"] += started
            by_equipment[equipment]["completed"] += completed
        
        # Format results
        def calc_rates(started, completed):
            completion_rate = round((completed / started) * 100, 1) if started > 0 else 0
            abandon_rate = round(((started - completed) / started) * 100, 1) if started > 0 else 0
            return completion_rate, abandon_rate
        
        overall_completion, overall_abandon = calc_rates(total_started, total_completed)
        
        mood_breakdown = []
        for mood, data in sorted(by_mood.items(), key=lambda x: x[1]["started"], reverse=True):
            comp_rate, abn_rate = calc_rates(data["started"], data["completed"])
            mood_breakdown.append({
                "category": mood,
                "started": data["started"],
                "completed": data["completed"],
                "abandoned": data["started"] - data["completed"],
                "completion_rate": comp_rate,
                "abandon_rate": abn_rate,
                "unique_users": len(data["unique_users"]),
            })
        
        difficulty_breakdown = []
        for diff, data in by_difficulty.items():
            comp_rate, abn_rate = calc_rates(data["started"], data["completed"])
            difficulty_breakdown.append({
                "difficulty": diff,
                "started": data["started"],
                "completed": data["completed"],
                "completion_rate": comp_rate,
                "abandon_rate": abn_rate,
            })
        
        equipment_breakdown = []
        for equip, data in sorted(by_equipment.items(), key=lambda x: x[1]["started"], reverse=True)[:10]:
            comp_rate, abn_rate = calc_rates(data["started"], data["completed"])
            equipment_breakdown.append({
                "equipment": equip,
                "started": data["started"],
                "completed": data["completed"],
                "completion_rate": comp_rate,
            })
        
        return {
            "period_days": days,
            "overall": {
                "total_started": total_started,
                "total_completed": total_completed,
                "total_abandoned": total_started - total_completed,
                "completion_rate": overall_completion,
                "abandon_rate": overall_abandon,
            },
            "by_mood_category": mood_breakdown[:10],
            "by_difficulty": sorted(difficulty_breakdown, key=lambda x: ["beginner", "intermediate", "advanced"].index(x["difficulty"]) if x["difficulty"] in ["beginner", "intermediate", "advanced"] else 99),
            "by_equipment": equipment_breakdown,
            "include_internal": include_internal,
        }
        
    except Exception as e:
        logger.error(f"Workout quality metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== SOCIAL LOOP METRICS ====================

@api_router.get("/analytics/admin/social-loops")
async def get_social_loop_metrics(
    days: int = 30,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get social loop metrics: engagement rates, viral coefficient estimates.
    
    Query params:
    - days: Analysis period (default: 30)
    - include_internal: Include internal/staff users (default: false)
    
    Returns social engagement and growth metrics.
    """
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            internal_users = await db.users.find({"is_internal": True}, {"_id": 1}).to_list(1000)
            excluded_user_ids = {str(u["_id"]) for u in internal_users}
        
        # Build match stage
        match_stage = {"timestamp": {"$gte": cutoff}}
        if excluded_user_ids:
            match_stage["user_id"] = {"$nin": list(excluded_user_ids)}
        
        # Get social events
        social_events = ["post_created", "post_liked", "post_commented", "user_followed"]
        
        social_pipeline = [
            {"$match": {**match_stage, "event_type": {"$in": social_events}}},
            {
                "$group": {
                    "_id": "$event_type",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"},
                }
            }
        ]
        
        social_results = await db.user_events.aggregate(social_pipeline).to_list(100)
        
        # Build event counts
        event_counts = {e: {"count": 0, "unique_users": 0} for e in social_events}
        total_social_actions = 0
        all_social_users = set()
        
        for item in social_results:
            event_type = item["_id"]
            if event_type in event_counts:
                event_counts[event_type] = {
                    "count": item["count"],
                    "unique_users": len(item["unique_users"]),
                }
                total_social_actions += item["count"]
                all_social_users.update(item["unique_users"])
        
        # Get total active users in period
        active_users = await db.user_events.distinct(
            "user_id",
            {**match_stage, "event_type": "app_session_start"}
        )
        total_active_users = len(active_users) if not excluded_user_ids else len([u for u in active_users if u not in excluded_user_ids])
        
        # Calculate engagement rates
        social_participation_rate = round((len(all_social_users) / total_active_users) * 100, 1) if total_active_users > 0 else 0
        
        # Get follow graph stats
        follow_stats_pipeline = [
            {"$match": {**match_stage, "event_type": "user_followed"}},
            {
                "$group": {
                    "_id": "$user_id",
                    "following_count": {"$sum": 1},
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_following": {"$avg": "$following_count"},
                    "max_following": {"$max": "$following_count"},
                    "total_followers": {"$sum": 1},
                }
            }
        ]
        
        follow_stats = await db.user_events.aggregate(follow_stats_pipeline).to_list(1)
        avg_following = round(follow_stats[0]["avg_following"], 1) if follow_stats else 0
        
        # Get content creation stats
        posts_query = {"created_at": {"$gte": cutoff}}
        if excluded_user_ids:
            posts_query["author_id"] = {"$nin": [ObjectId(uid) for uid in excluded_user_ids if len(uid) == 24]}
        
        total_posts = await db.posts.count_documents(posts_query)
        
        # Get engagement per post (likes + comments)
        engagement_pipeline = [
            {"$match": posts_query},
            {
                "$lookup": {
                    "from": "user_events",
                    "let": {"post_id": {"$toString": "$_id"}},
                    "pipeline": [
                        {
                            "$match": {
                                "$expr": {"$eq": ["$metadata.post_id", "$$post_id"]},
                                "event_type": {"$in": ["post_liked", "post_commented"]},
                                "timestamp": {"$gte": cutoff},
                            }
                        },
                        {"$count": "engagement"}
                    ],
                    "as": "engagement_data"
                }
            },
            {
                "$project": {
                    "engagement": {"$ifNull": [{"$arrayElemAt": ["$engagement_data.engagement", 0]}, 0]}
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_engagement": {"$sum": "$engagement"},
                    "avg_engagement": {"$avg": "$engagement"},
                    "posts_with_engagement": {"$sum": {"$cond": [{"$gt": ["$engagement", 0]}, 1, 0]}},
                }
            }
        ]
        
        engagement_stats = await db.posts.aggregate(engagement_pipeline).to_list(1)
        
        avg_engagement_per_post = round(engagement_stats[0]["avg_engagement"], 1) if engagement_stats else 0
        posts_with_engagement = engagement_stats[0]["posts_with_engagement"] if engagement_stats else 0
        engagement_rate = round((posts_with_engagement / total_posts) * 100, 1) if total_posts > 0 else 0
        
        return {
            "period_days": days,
            "overview": {
                "total_active_users": total_active_users,
                "social_participants": len(all_social_users),
                "social_participation_rate": social_participation_rate,
                "total_social_actions": total_social_actions,
            },
            "content": {
                "total_posts": total_posts,
                "posts_with_engagement": posts_with_engagement,
                "engagement_rate": engagement_rate,
                "avg_engagement_per_post": avg_engagement_per_post,
            },
            "actions": {
                "posts_created": event_counts["post_created"],
                "likes": event_counts["post_liked"],
                "comments": event_counts["post_commented"],
                "follows": event_counts["user_followed"],
            },
            "network": {
                "avg_following_per_user": avg_following,
            },
            "include_internal": include_internal,
        }
        
    except Exception as e:
        logger.error(f"Social loop metrics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== INSIGHT SURFACING ====================

@api_router.get("/analytics/admin/insights")
async def get_automated_insights(
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get automatically generated insights by comparing current vs previous periods.
    
    Analyzes metrics and flags significant changes (>20% change threshold).
    
    Returns list of insights with severity (info, warning, critical) and recommendations.
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Get internal user IDs
        excluded_user_ids = set()
        if not include_internal:
            internal_users = await db.users.find({"is_internal": True}, {"_id": 1}).to_list(1000)
            excluded_user_ids = {str(u["_id"]) for u in internal_users}
        
        insights = []
        
        # Helper to add insight
        def add_insight(title, description, severity, metric, current, previous, change_pct, recommendation=None):
            insights.append({
                "id": f"{metric}_{int(now.timestamp())}",
                "title": title,
                "description": description,
                "severity": severity,  # "info", "warning", "critical"
                "metric": metric,
                "current_value": current,
                "previous_value": previous,
                "change_percent": change_pct,
                "recommendation": recommendation,
                "timestamp": now.isoformat(),
            })
        
        # Define periods
        current_7d_start = now - timedelta(days=7)
        previous_7d_start = now - timedelta(days=14)
        previous_7d_end = now - timedelta(days=7)
        
        # Build base query
        def get_match(start, end=None):
            match = {"timestamp": {"$gte": start}}
            if end:
                match["timestamp"]["$lt"] = end
            if excluded_user_ids:
                match["user_id"] = {"$nin": list(excluded_user_ids)}
            return match
        
        # ===== 1. Daily Active Users Analysis =====
        current_dau_users = await db.user_events.distinct(
            "user_id",
            {**get_match(current_7d_start), "event_type": "app_session_start"}
        )
        previous_dau_users = await db.user_events.distinct(
            "user_id",
            {**get_match(previous_7d_start, previous_7d_end), "event_type": "app_session_start"}
        )
        
        current_dau = len([u for u in current_dau_users if u not in excluded_user_ids])
        previous_dau = len([u for u in previous_dau_users if u not in excluded_user_ids])
        
        if previous_dau > 0:
            dau_change = round(((current_dau - previous_dau) / previous_dau) * 100, 1)
            if abs(dau_change) >= 20:
                if dau_change >= 50:
                    add_insight(
                        "🚀 Significant DAU Growth",
                        f"Daily active users increased by {dau_change}% compared to last week",
                        "info",
                        "dau",
                        current_dau,
                        previous_dau,
                        dau_change,
                        "Investigate what's driving growth - new feature, marketing campaign, or viral content?"
                    )
                elif dau_change >= 20:
                    add_insight(
                        "📈 DAU Trending Up",
                        f"Daily active users increased by {dau_change}% week over week",
                        "info",
                        "dau",
                        current_dau,
                        previous_dau,
                        dau_change
                    )
                elif dau_change <= -50:
                    add_insight(
                        "🚨 Critical DAU Drop",
                        f"Daily active users dropped by {abs(dau_change)}% - urgent attention needed",
                        "critical",
                        "dau",
                        current_dau,
                        previous_dau,
                        dau_change,
                        "Check for app issues, server problems, or recent changes that may have impacted users"
                    )
                elif dau_change <= -20:
                    add_insight(
                        "⚠️ DAU Declining",
                        f"Daily active users dropped by {abs(dau_change)}% compared to last week",
                        "warning",
                        "dau",
                        current_dau,
                        previous_dau,
                        dau_change,
                        "Review retention strategies and user feedback"
                    )
        
        # ===== 2. New User Signups =====
        user_query_current = {"created_at": {"$gte": current_7d_start}}
        user_query_previous = {"created_at": {"$gte": previous_7d_start, "$lt": previous_7d_end}}
        if not include_internal:
            user_query_current["is_internal"] = {"$ne": True}
            user_query_previous["is_internal"] = {"$ne": True}
        
        current_signups = await db.users.count_documents(user_query_current)
        previous_signups = await db.users.count_documents(user_query_previous)
        
        if previous_signups > 0:
            signup_change = round(((current_signups - previous_signups) / previous_signups) * 100, 1)
            if abs(signup_change) >= 30:
                if signup_change >= 30:
                    add_insight(
                        "🎉 New User Surge",
                        f"New signups increased by {signup_change}% this week ({current_signups} vs {previous_signups})",
                        "info",
                        "signups",
                        current_signups,
                        previous_signups,
                        signup_change,
                        "Great momentum! Ensure onboarding flow can handle increased volume"
                    )
                elif signup_change <= -30:
                    add_insight(
                        "⚠️ Signup Slowdown",
                        f"New signups dropped by {abs(signup_change)}% this week",
                        "warning",
                        "signups",
                        current_signups,
                        previous_signups,
                        signup_change,
                        "Review acquisition channels and marketing effectiveness"
                    )
        
        # ===== 3. Workout Completion Rate =====
        current_started = await db.user_events.count_documents({
            **get_match(current_7d_start),
            "event_type": "workout_started"
        })
        current_completed = await db.user_events.count_documents({
            **get_match(current_7d_start),
            "event_type": "workout_completed"
        })
        
        previous_started = await db.user_events.count_documents({
            **get_match(previous_7d_start, previous_7d_end),
            "event_type": "workout_started"
        })
        previous_completed = await db.user_events.count_documents({
            **get_match(previous_7d_start, previous_7d_end),
            "event_type": "workout_completed"
        })
        
        current_completion_rate = round((current_completed / max(1, current_started)) * 100, 1)
        previous_completion_rate = round((previous_completed / max(1, previous_started)) * 100, 1)
        
        if previous_completion_rate > 0:
            completion_change = current_completion_rate - previous_completion_rate
            if abs(completion_change) >= 10:
                if completion_change >= 10:
                    add_insight(
                        "💪 Completion Rate Improved",
                        f"Workout completion rate increased from {previous_completion_rate}% to {current_completion_rate}%",
                        "info",
                        "completion_rate",
                        current_completion_rate,
                        previous_completion_rate,
                        round(completion_change, 1),
                        "Users are more engaged with workouts - consider highlighting popular workout types"
                    )
                elif completion_change <= -10:
                    add_insight(
                        "⚠️ Completion Rate Dropped",
                        f"Workout completion rate fell from {previous_completion_rate}% to {current_completion_rate}%",
                        "warning",
                        "completion_rate",
                        current_completion_rate,
                        previous_completion_rate,
                        round(completion_change, 1),
                        "Investigate workout difficulty, length, or user experience issues"
                    )
        
        # ===== 4. Social Engagement =====
        social_events = ["post_liked", "post_commented", "user_followed"]
        current_social = await db.user_events.count_documents({
            **get_match(current_7d_start),
            "event_type": {"$in": social_events}
        })
        previous_social = await db.user_events.count_documents({
            **get_match(previous_7d_start, previous_7d_end),
            "event_type": {"$in": social_events}
        })
        
        if previous_social > 0:
            social_change = round(((current_social - previous_social) / previous_social) * 100, 1)
            if abs(social_change) >= 25:
                if social_change >= 50:
                    add_insight(
                        "🔥 Social Engagement Spike",
                        f"Social interactions up {social_change}% - community is thriving!",
                        "info",
                        "social_engagement",
                        current_social,
                        previous_social,
                        social_change,
                        "Capitalize on momentum with community features or challenges"
                    )
                elif social_change >= 25:
                    add_insight(
                        "💬 Social Activity Growing",
                        f"Social interactions increased by {social_change}%",
                        "info",
                        "social_engagement",
                        current_social,
                        previous_social,
                        social_change
                    )
                elif social_change <= -25:
                    add_insight(
                        "📉 Social Engagement Declining",
                        f"Social interactions dropped by {abs(social_change)}%",
                        "warning",
                        "social_engagement",
                        current_social,
                        previous_social,
                        social_change,
                        "Consider promoting community features or introducing social incentives"
                    )
        
        # ===== 5. Content Creation =====
        current_posts = await db.user_events.count_documents({
            **get_match(current_7d_start),
            "event_type": "post_created"
        })
        previous_posts = await db.user_events.count_documents({
            **get_match(previous_7d_start, previous_7d_end),
            "event_type": "post_created"
        })
        
        if previous_posts > 0:
            posts_change = round(((current_posts - previous_posts) / previous_posts) * 100, 1)
            if abs(posts_change) >= 30:
                if posts_change >= 30:
                    add_insight(
                        "📝 Content Creation Surge",
                        f"User-generated posts increased by {posts_change}% ({current_posts} posts this week)",
                        "info",
                        "content_creation",
                        current_posts,
                        previous_posts,
                        posts_change
                    )
                elif posts_change <= -30:
                    add_insight(
                        "📉 Content Creation Slowing",
                        f"User-generated posts dropped by {abs(posts_change)}%",
                        "warning",
                        "content_creation",
                        current_posts,
                        previous_posts,
                        posts_change,
                        "Encourage content creation with prompts or incentives"
                    )
        
        # ===== 6. At-Risk Users Detection =====
        # Users who were active 14-21 days ago but not in last 7 days
        active_14_21d = await db.user_events.distinct(
            "user_id",
            {
                "timestamp": {"$gte": now - timedelta(days=21), "$lt": now - timedelta(days=14)},
                "event_type": "app_session_start"
            }
        )
        active_7d = await db.user_events.distinct(
            "user_id",
            {
                "timestamp": {"$gte": now - timedelta(days=7)},
                "event_type": "app_session_start"
            }
        )
        
        at_risk_users = set(active_14_21d) - set(active_7d) - excluded_user_ids
        at_risk_count = len(at_risk_users)
        
        if at_risk_count >= 5:
            add_insight(
                "🚨 At-Risk Users Detected",
                f"{at_risk_count} users who were active 2-3 weeks ago haven't returned in the last week",
                "warning",
                "at_risk_users",
                at_risk_count,
                0,
                0,
                "Consider sending re-engagement notifications or emails to these users"
            )
        
        # ===== 7. Power User Growth =====
        # Users with 3+ workouts in last 7 days
        power_user_pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": current_7d_start},
                    "event_type": "workout_completed",
                }
            },
            {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gte": 3}}},
            {"$count": "total"}
        ]
        if excluded_user_ids:
            power_user_pipeline[0]["$match"]["user_id"] = {"$nin": list(excluded_user_ids)}
        
        power_users_result = await db.user_events.aggregate(power_user_pipeline).to_list(1)
        current_power_users = power_users_result[0]["total"] if power_users_result else 0
        
        if current_power_users >= 3:
            add_insight(
                "⭐ Power Users Identified",
                f"{current_power_users} users completed 3+ workouts this week",
                "info",
                "power_users",
                current_power_users,
                0,
                0,
                "These are your champions! Consider featuring their content or inviting them to beta features"
            )
        
        # Sort insights by severity
        severity_order = {"critical": 0, "warning": 1, "info": 2}
        insights.sort(key=lambda x: severity_order.get(x["severity"], 3))
        
        return {
            "insights": insights,
            "total": len(insights),
            "critical_count": len([i for i in insights if i["severity"] == "critical"]),
            "warning_count": len([i for i in insights if i["severity"] == "warning"]),
            "info_count": len([i for i in insights if i["severity"] == "info"]),
            "generated_at": now.isoformat(),
            "comparison_period": "7 days vs previous 7 days",
            "include_internal": include_internal,
        }
        
    except Exception as e:
        logger.error(f"Insights endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/comparison")
async def get_comparison_endpoint(
    start: Optional[str] = None,
    end: Optional[str] = None,
    include_internal: bool = False,
    current_user_id: str = Depends(require_admin)
):
    """
    Get comparison stats between current period and previous period.
    
    Query params:
    - start: Current period start (default: 7 days ago)
    - end: Current period end (default: now)
    - include_internal: Include internal/staff users (default: false)
    
    Automatically calculates previous period of same length.
    Returns metrics with current, previous, and % change.
    """
    try:
        # Parse dates for current period
        if end:
            current_end = datetime.fromisoformat(end.replace('Z', '+00:00'))
        else:
            current_end = datetime.now(timezone.utc)
        
        if start:
            current_start = datetime.fromisoformat(start.replace('Z', '+00:00'))
        else:
            current_start = current_end - timedelta(days=7)
        
        # Calculate previous period (same length)
        period_length = current_end - current_start
        previous_end = current_start
        previous_start = previous_end - period_length
        
        return await get_comparison_stats(
            db, current_start, current_end, previous_start, previous_end, include_internal
        )
    except Exception as e:
        logger.error(f"Comparison endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/env-info")
async def get_env_info(
    current_user_id: str = Depends(require_admin)
):
    """
    Get environment info for admin panel header.
    Returns environment name, git SHA, and deployment timestamp.
    """
    return {
        "environment": APP_ENV,
        "is_staging": IS_STAGING,
        "git_sha": GIT_SHA,
        "deployed_at": DEPLOYED_AT,
        "seed_version": SEED_VERSION,
        "admin_allowlist": ADMIN_ALLOWLIST,
    }


# ============================================
# ENHANCED ADMIN ANALYTICS V2 ENDPOINTS
# ============================================

# Heartbeat endpoint for real-time active user tracking
@api_router.post("/analytics/heartbeat")
async def record_heartbeat(
    current_user_id: str = Depends(get_current_user)
):
    """
    Record user heartbeat for real-time active user tracking.
    Called every 30-60 seconds while app is open.
    """
    try:
        await db.user_heartbeats.update_one(
            {"user_id": current_user_id},
            {
                "$set": {
                    "user_id": current_user_id,
                    "last_heartbeat": datetime.now(timezone.utc),
                    "is_online": True
                }
            },
            upsert=True
        )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Heartbeat error: {e}")
        return {"status": "error"}


@api_router.get("/analytics/admin/realtime-active")
async def get_realtime_active_users(
    timeout_minutes: int = 5,
    current_user_id: str = Depends(require_admin)
):
    """
    Get truly active users (with heartbeat in last N minutes).
    These are users currently with the app open.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=timeout_minutes)
    
    # Find users with recent heartbeats
    active_heartbeats = await db.user_heartbeats.find({
        "last_heartbeat": {"$gte": cutoff}
    }).to_list(1000)
    
    active_users = []
    for hb in active_heartbeats:
        user_id = hb.get("user_id")
        try:
            # Try to find user by custom user_id first
            user = await db.users.find_one({"user_id": user_id})
            if not user:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
            
            if user:
                active_users.append({
                    "user_id": user_id,
                    "username": user.get("username", "Unknown"),
                    "avatar_url": user.get("avatar_url") or user.get("avatar", ""),
                    "avatar": user.get("avatar") or user.get("avatar_url", ""),
                    "last_active": hb.get("last_heartbeat").isoformat() if hb.get("last_heartbeat") else None
                })
        except:
            continue
    
    return {
        "active_count": len(active_users),
        "users": active_users,
        "timeout_minutes": timeout_minutes
    }


@api_router.get("/analytics/admin/comprehensive-stats")
async def get_comprehensive_stats(
    days: int = 1,
    user_type: str = "all",  # "all", "users", "guests"
    current_user_id: str = Depends(require_admin)
):
    """
    Get comprehensive platform statistics with accurate data.
    This is the main endpoint for the admin dashboard.
    days=0 means "all time" (no date filter)
    user_type: "all" (combined), "users" (registered only), "guests" (guest only)
    """
    from collections import defaultdict
    
    # Handle "all time" option (days=0)
    is_all_time = days == 0
    if is_all_time:
        # Use a very old date to effectively get all data
        start_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
    else:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    realtime_cutoff = datetime.now(timezone.utc) - timedelta(minutes=5)
    
    # Build user type filter for event queries
    def get_user_type_filter():
        if user_type == "users":
            return {"is_guest": {"$ne": True}}  # Registered users only
        elif user_type == "guests":
            return {"is_guest": True}  # Guests only
        else:
            return {}  # All users (no filter)
    
    user_type_filter = get_user_type_filter()
    
    try:
        # === USER METRICS (Accurate) ===
        total_users = await db.users.count_documents({})
        
        # New users in period (for "all time", this equals total users)
        if is_all_time:
            new_users = total_users
        else:
            new_users = await db.users.count_documents({
                "created_at": {"$gte": start_date}
            })
        
        # Really active users (with heartbeat in last 5 mins) - registered users only
        realtime_active_users = await db.user_heartbeats.count_documents({
            "last_heartbeat": {"$gte": realtime_cutoff}
        })
        
        # Active guests (with recent guest events)
        realtime_active_guests = await db.user_events.distinct(
            "device_id",
            {
                "is_guest": True,
                "timestamp": {"$gte": realtime_cutoff}
            }
        )
        realtime_active_guest_count = len(realtime_active_guests) if realtime_active_guests else 0
        
        # Combined realtime active based on filter
        if user_type == "users":
            realtime_active = realtime_active_users
        elif user_type == "guests":
            realtime_active = realtime_active_guest_count
        else:
            realtime_active = realtime_active_users + realtime_active_guest_count
        
        # Users with any activity in period
        active_user_ids = await db.user_events.distinct(
            "user_id",
            {"timestamp": {"$gte": start_date}, "is_guest": {"$ne": True}}
        )
        active_guest_devices = await db.user_events.distinct(
            "device_id",
            {"timestamp": {"$gte": start_date}, "is_guest": True}
        )
        
        if user_type == "users":
            users_with_activity = len(active_user_ids) if active_user_ids else 0
        elif user_type == "guests":
            users_with_activity = len(active_guest_devices) if active_guest_devices else 0
        else:
            users_with_activity = (len(active_user_ids) if active_user_ids else 0) + (len(active_guest_devices) if active_guest_devices else 0)
        
        # === SESSION METRICS (Combined) ===
        session_filter = {"timestamp": {"$gte": start_date}, **user_type_filter}
        
        # Count actual app_opened events (most reliable session indicator)
        app_opens = await db.user_events.count_documents({
            "event_type": "app_opened",
            **session_filter
        })
        
        # Count app_session_start as fallback
        app_sessions = await db.user_events.count_documents({
            "event_type": "app_session_start",
            **session_filter
        })
        
        # Count guest_session_started for guests
        guest_sessions = await db.user_events.count_documents({
            "event_type": "guest_session_started",
            "timestamp": {"$gte": start_date}
        })
        
        if user_type == "guests":
            total_sessions = guest_sessions
        elif user_type == "users":
            total_sessions = max(app_opens, app_sessions) if app_opens > 0 or app_sessions > 0 else 0
        else:
            total_sessions = max(app_opens, app_sessions) + guest_sessions
        
        # === PAGE/SCREEN VIEWS ===
        # Use $toLower to normalize screen names and merge duplicates
        screen_views_pipeline = [
            {
                "$match": {
                    "event_type": {"$in": ["screen_viewed", "screen_entered"]},
                    "timestamp": {"$gte": start_date},
                    **user_type_filter
                }
            },
            {
                "$addFields": {
                    "normalized_screen": {"$toLower": "$metadata.screen_name"}
                }
            },
            {
                "$group": {
                    "_id": "$normalized_screen",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": {"$ifNull": ["$user_id", "$device_id"]}}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        # Page name normalization map
        page_name_map = {
            "profile": "Profile",
            "explore": "Explore", 
            "index": "Home",
            "home": "Home",
            "cart": "Workout Cart",
            "workout-session": "Workout Session",
            "create-post": "Create Post",
            "admin-dashboard": "Admin Dashboard",
            "featured-workout-detail": "Featured Workout",
            "user-profile": "User Profile",
            "settings": "Settings",
            "workout-type": "Workout Type",
            "landing": "Landing Page",
            "login": "Login",
            "register": "Register",
            "auth/login": "Login",
            "privacy-policy": "Privacy Policy",
        }
        
        top_pages = await db.user_events.aggregate(screen_views_pipeline).to_list(20)
        
        # Merge duplicates after normalization
        merged_pages = {}
        for page in top_pages:
            if page["_id"]:
                normalized = page["_id"].lower().strip()
                display_name = page_name_map.get(normalized, normalized.replace('-', ' ').title())
                
                if display_name in merged_pages:
                    merged_pages[display_name]["views"] += page["count"]
                    merged_pages[display_name]["unique_users"].update(page["unique_users"] or [])
                else:
                    merged_pages[display_name] = {
                        "page": display_name,
                        "views": page["count"],
                        "unique_users": set(page["unique_users"] or [])
                    }
        
        # Convert to list and sort by views
        top_pages_formatted = []
        total_screen_views = 0
        for page_data in sorted(merged_pages.values(), key=lambda x: x["views"], reverse=True)[:10]:
            total_screen_views += page_data["views"]
            top_pages_formatted.append({
                "page": page_data["page"],
                "views": page_data["views"],
                "unique_users": len(page_data["unique_users"])
            })
        
        # === MOOD CARD SELECTIONS ===
        mood_pipeline = [
            {
                "$match": {
                    "event_type": "mood_selected",
                    "timestamp": {"$gte": start_date},
                    **user_type_filter
                }
            },
            {
                "$group": {
                    "_id": "$metadata.mood_category",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": {"$ifNull": ["$user_id", "$device_id"]}}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        mood_display_names = {
            "sweat": "I Want to Sweat",
            "muscle": "Muscle Gainer",
            "outdoor": "Get Outside",
            "calisthenics": "Calisthenics",
            "lazy": "Feeling Lazy",
            "explosive": "Get Explosive"
        }
        
        top_moods = await db.user_events.aggregate(mood_pipeline).to_list(10)
        top_moods_formatted = []
        total_mood_selections = 0
        for mood in top_moods:
            if mood["_id"]:
                count = mood["count"]
                total_mood_selections += count
                display_name = mood_display_names.get(mood["_id"], mood["_id"])
                top_moods_formatted.append({
                    "mood": display_name,
                    "mood_id": mood["_id"],
                    "selections": count,
                    "unique_users": len(mood["unique_users"]) if mood["unique_users"] else 0
                })
        
        # === WORKOUT METRICS ===
        workouts_started = await db.user_events.count_documents({
            "event_type": "workout_started",
            "timestamp": {"$gte": start_date}
        })
        
        workouts_completed = await db.user_events.count_documents({
            "event_type": "workout_completed",
            "timestamp": {"$gte": start_date}
        })
        
        # Workouts added to cart (cart_item_added events)
        workouts_added = await db.user_events.count_documents({
            "event_type": "cart_item_added",
            "timestamp": {"$gte": start_date}
        })
        
        completion_rate = round((workouts_completed / workouts_started * 100), 1) if workouts_started > 0 else 0
        
        # === SOCIAL METRICS ===
        total_posts = await db.user_events.count_documents({
            "event_type": "post_created",
            "timestamp": {"$gte": start_date}
        })
        
        total_likes = await db.user_events.count_documents({
            "event_type": "post_liked",
            "timestamp": {"$gte": start_date}
        })
        
        total_comments = await db.user_events.count_documents({
            "event_type": "post_commented",
            "timestamp": {"$gte": start_date}
        })
        
        total_follows = await db.user_events.count_documents({
            "event_type": "user_followed",
            "timestamp": {"$gte": start_date}
        })
        
        # === GUEST METRICS ===
        # Count guest sessions started
        guest_signins = await db.user_events.count_documents({
            "event_type": "guest_session_started",
            "is_guest": True,
            "timestamp": {"$gte": start_date}
        })
        
        # Count unique guest devices
        guest_devices = await db.user_events.distinct(
            "device_id",
            {
                "event_type": "guest_session_started",
                "is_guest": True,
                "timestamp": {"$gte": start_date}
            }
        )
        unique_guest_devices = len(guest_devices) if guest_devices else 0
        
        # Count guests who converted (unique devices that merged to a user)
        converted_devices = await db.user_events.distinct(
            "device_id",
            {
                "is_guest": True,
                "merged_to_user_id": {"$ne": None},
                "timestamp": {"$gte": start_date}
            }
        )
        guest_conversions = len(converted_devices) if converted_devices else 0
        
        return {
            "period_days": days,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            
            # User Metrics
            "total_users": total_users,
            "new_users": new_users,
            "realtime_active_users": realtime_active,
            "users_with_activity": users_with_activity,
            
            # Session Metrics
            "total_sessions": total_sessions,
            "total_screen_views": total_screen_views,
            
            # Top Pages
            "top_pages": top_pages_formatted,
            
            # Mood Card Selections
            "total_mood_selections": total_mood_selections,
            "top_mood_cards": top_moods_formatted,
            
            # Workout Metrics
            "workouts_added": workouts_added,
            "workouts_started": workouts_started,
            "workouts_completed": workouts_completed,
            "workout_completion_rate": completion_rate,
            
            # Social Metrics
            "posts_created": total_posts,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_follows": total_follows,
            
            # Guest Metrics
            "guest_signins": guest_signins,
            "unique_guest_devices": unique_guest_devices,
            "guest_conversions": guest_conversions,
        }
        
    except Exception as e:
        logger.error(f"Error getting comprehensive stats: {e}")
        return {"error": str(e)}


@api_router.get("/analytics/admin/users/list")
async def get_users_list(
    days: int = 30,
    limit: int = 50,
    skip: int = 0,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    search: str = "",
    current_user_id: str = Depends(require_admin)
):
    """
    Get paginated list of all users with detailed stats.
    Supports sorting and searching.
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"username": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    # Determine sort order
    sort_direction = -1 if sort_order == "desc" else 1
    
    # Get users
    users_cursor = db.users.find(query).sort(sort_by, sort_direction).skip(skip).limit(limit)
    users = await users_cursor.to_list(limit)
    total_count = await db.users.count_documents(query)
    
    user_details = []
    for user in users:
        user_id = str(user["_id"])
        
        # Get activity metrics
        events_count = await db.user_events.count_documents({
            "user_id": user_id,
            "timestamp": {"$gte": start_date}
        })
        
        workouts_count = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "workout_completed",
            "timestamp": {"$gte": start_date}
        })
        
        posts_count = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "post_created",
            "timestamp": {"$gte": start_date}
        })
        
        # Get last activity
        last_event = await db.user_events.find_one(
            {"user_id": user_id},
            sort=[("timestamp", -1)]
        )
        
        user_details.append({
            "user_id": user_id,
            "username": user.get("username", "Unknown"),
            "email": user.get("email", ""),
            "avatar_url": user.get("avatar_url") or user.get("avatar", ""),
            "avatar": user.get("avatar") or user.get("avatar_url", ""),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            "last_active": last_event["timestamp"].isoformat() if last_event and last_event.get("timestamp") else None,
            "events_count": events_count,
            "workouts_completed": workouts_count,
            "posts_created": posts_count,
            "followers_count": user.get("followers_count", 0),
            "following_count": user.get("following_count", 0),
        })
    
    return {
        "users": user_details,
        "total_count": total_count,
        "page": skip // limit + 1,
        "total_pages": (total_count + limit - 1) // limit,
        "period_days": days
    }


@api_router.get("/analytics/admin/users/{user_id}/report")
async def get_user_detail_report(
    user_id: str,
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """
    Get detailed analytics report for a specific user.
    Includes: workouts added to cart, workouts completed, screens viewed,
    app sessions, posts/likes/comments, time spent in app.
    days=0 means "all time" (no date filter)
    """
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    # Handle "all time" option (days=0)
    is_all_time = days == 0
    if is_all_time:
        start_date = datetime(2020, 1, 1, tzinfo=timezone.utc)
    else:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Build date filter for queries
    date_filter = {"$gte": start_date}
    
    try:
        # Find the user
        target_user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Basic user info
        user_info = {
            "user_id": user_id,
            "username": target_user.get("username", "Unknown"),
            "email": target_user.get("email", ""),
            "avatar_url": target_user.get("avatar_url") or target_user.get("avatar", ""),
            "avatar": target_user.get("avatar") or target_user.get("avatar_url", ""),
            "created_at": target_user.get("created_at").isoformat() if target_user.get("created_at") else None,
            "followers_count": target_user.get("followers_count", 0),
            "following_count": target_user.get("following_count", 0),
        }
        
        # Workouts added to cart
        workouts_added_to_cart = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "workout_added_to_cart",
            "timestamp": date_filter
        })
        
        # Workouts completed
        workouts_completed = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "workout_completed",
            "timestamp": date_filter
        })
        
        # Workouts started
        workouts_started = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "workout_started",
            "timestamp": date_filter
        })
        
        # Screen views (unique screens and total views)
        screen_views_pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "event_type": {"$in": ["screen_viewed", "screen_entered"]},
                    "timestamp": date_filter
                }
            },
            {
                "$group": {
                    "_id": "$metadata.screen_name",
                    "count": {"$sum": 1}
                }
            }
        ]
        screen_views_result = await db.user_events.aggregate(screen_views_pipeline).to_list(100)
        total_screen_views = sum(s["count"] for s in screen_views_result)
        unique_screens_viewed = len([s for s in screen_views_result if s["_id"]])
        
        # Page name normalization map (same as aggregate)
        page_name_map = {
            "profile": "Profile",
            "explore": "Explore", 
            "index": "Home",
            "home": "Home",
            "cart": "Workout Cart",
            "workout-session": "Workout Session",
            "create-post": "Create Post",
            "admin-dashboard": "Admin Dashboard",
            "featured-workout-detail": "Featured Workout",
            "user-profile": "User Profile",
            "settings": "Settings",
            "workout-type": "Workout Type",
            "landing": "Landing Page",
            "login": "Login",
            "register": "Register",
            "auth/login": "Login",
            "privacy-policy": "Privacy Policy",
        }
        
        # Merge duplicate screens and normalize names
        merged_screens = {}
        for s in screen_views_result:
            if s["_id"]:
                normalized = s["_id"].lower().strip()
                display_name = page_name_map.get(normalized, normalized.replace('-', ' ').title())
                
                if display_name in merged_screens:
                    merged_screens[display_name]["views"] += s["count"]
                else:
                    merged_screens[display_name] = {
                        "screen": display_name,
                        "views": s["count"]
                    }
        
        # Top screens viewed (sorted and limited)
        top_screens = sorted(
            list(merged_screens.values()),
            key=lambda x: x["views"],
            reverse=True
        )[:5]
        
        # Calculate percentages for top screens
        if total_screen_views > 0:
            for screen in top_screens:
                screen["percentage"] = round((screen["views"] / total_screen_views) * 100, 1)
        
        # App sessions (app_opened or app_session_start events)
        app_sessions = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": {"$in": ["app_opened", "app_session_start"]},
            "timestamp": date_filter
        })
        
        # Posts created
        posts_created = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "post_created",
            "timestamp": date_filter
        })
        
        # Also count from posts collection
        posts_in_db = await db.posts.count_documents({
            "author_id": user_id
        })
        
        # Likes given
        likes_given = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "post_liked",
            "timestamp": date_filter
        })
        
        # Comments made
        comments_made = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "post_commented",
            "timestamp": date_filter
        })
        
        # Time spent in app (sum of screen_time_spent events)
        time_spent_pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "event_type": "screen_time_spent",
                    "timestamp": date_filter
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_seconds": {"$sum": "$metadata.duration_seconds"}
                }
            }
        ]
        time_spent_result = await db.user_events.aggregate(time_spent_pipeline).to_list(1)
        total_time_seconds = time_spent_result[0]["total_seconds"] if time_spent_result else 0
        
        # Format time spent
        hours = total_time_seconds // 3600
        minutes = (total_time_seconds % 3600) // 60
        time_spent_formatted = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        
        # Get last activity
        last_event = await db.user_events.find_one(
            {"user_id": user_id},
            sort=[("timestamp", -1)]
        )
        
        # Mood selections
        mood_selections = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "mood_selected",
            "timestamp": date_filter
        })
        
        # Follows given
        follows_given = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": "user_followed",
            "timestamp": date_filter
        })
        
        return {
            "user": user_info,
            "period_days": days,
            "is_all_time": is_all_time,
            "report": {
                # Workout metrics
                "workouts_added_to_cart": workouts_added_to_cart,
                "workouts_started": workouts_started,
                "workouts_completed": workouts_completed,
                "workout_completion_rate": round((workouts_completed / workouts_started * 100), 1) if workouts_started > 0 else 0,
                
                # Screen/navigation metrics
                "total_screen_views": total_screen_views,
                "unique_screens_viewed": unique_screens_viewed,
                "top_screens": top_screens,
                
                # App usage metrics
                "app_sessions": app_sessions,
                "total_time_seconds": total_time_seconds,
                "time_spent_formatted": time_spent_formatted,
                
                # Social/engagement metrics
                "posts_created": max(posts_created, posts_in_db),
                "likes_given": likes_given,
                "comments_made": comments_made,
                "follows_given": follows_given,
                
                # Other
                "mood_selections": mood_selections,
                "last_active": last_event["timestamp"].isoformat() if last_event and last_event.get("timestamp") else None,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/export/users")
async def export_users_csv(
    days: int = 30,
    limit: int = 5000,
    skip: int = 0,
    current_user_id: str = Depends(require_admin)
):
    """
    Export users data as CSV format (returns JSON for frontend to convert).
    Paginated to bound memory; pass skip/limit to page through large user bases.
    """
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    # Hard-cap to avoid OOM on huge installations
    safe_limit = max(1, min(limit, 5000))
    safe_skip = max(0, skip)
    
    users = await db.users.find({}).sort("created_at", -1).skip(safe_skip).limit(safe_limit).to_list(safe_limit)
    
    # Batch count events and workouts per user (avoid N+1)
    user_ids = [str(u["_id"]) for u in users]
    
    events_agg = await db.user_events.aggregate([
        {"$match": {"user_id": {"$in": user_ids}, "timestamp": {"$gte": start_date}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(len(user_ids))
    events_map = {item["_id"]: item["count"] for item in events_agg}
    
    workouts_agg = await db.user_events.aggregate([
        {"$match": {"user_id": {"$in": user_ids}, "event_type": "workout_completed"}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}}
    ]).to_list(len(user_ids))
    workouts_map = {item["_id"]: item["count"] for item in workouts_agg}
    
    export_data = []
    for user in users:
        user_id = str(user["_id"])
        export_data.append({
            "username": user.get("username", ""),
            "email": user.get("email", ""),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else "",
            "followers": user.get("followers_count", 0),
            "following": user.get("following_count", 0),
            "total_workouts": workouts_map.get(user_id, 0),
            "events_in_period": events_map.get(user_id, 0),
        })
    
    return {
        "data": export_data,
        "count": len(export_data),
        "period_days": days
    }


@api_router.get("/analytics/admin/deleted-users")
async def get_deleted_users(
    current_user_id: str = Depends(require_admin),
    days: int = 30,
    limit: int = 50
):
    """
    Get list of users who deleted their accounts (for analytics).
    Only admin can access this.
    """
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        # Get deleted users from the last N days
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        deleted_users = await db.deleted_users.find({
            "deleted_at": {"$gte": start_date}
        }).sort("deleted_at", -1).limit(limit).to_list(length=limit)
        
        result = []
        for user in deleted_users:
            result.append({
                "id": str(user.get("_id")),
                "user_id": user.get("user_id"),
                "username": user.get("username"),
                "email": user.get("email"),
                "deleted_at": user.get("deleted_at").isoformat() if user.get("deleted_at") else None,
                "account_created_at": user.get("account_created_at").isoformat() if user.get("account_created_at") else None,
                "workouts_completed": user.get("workouts_completed", 0),
                "posts_count": user.get("posts_count", 0),
                "followers_count": user.get("followers_count", 0),
                "login_provider": user.get("login_provider", "email"),
            })
        
        # Get total count for the period
        total_count = await db.deleted_users.count_documents({
            "deleted_at": {"$gte": start_date}
        })
        
        return {
            "deleted_users": result,
            "total_count": total_count,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error fetching deleted users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch deleted users")


@api_router.delete("/analytics/admin/users/{user_id}")
async def soft_delete_user(
    user_id: str,
    current_user_id: str = Depends(require_admin)
):
    """
    Soft delete a user - moves their profile to deleted_users collection
    for 7 days before permanent deletion.
    Only admin can perform this action.
    """
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    # Prevent self-deletion
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    try:
        # Find the user to delete
        user_to_delete = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user_to_delete:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Prepare the deleted user record
        deleted_record = {
            **user_to_delete,
            "original_id": str(user_to_delete["_id"]),
            "deleted_at": datetime.now(timezone.utc),
            "deleted_by": current_user_id,
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
            "reason": "admin_deletion"
        }
        del deleted_record["_id"]  # Remove original _id for new insertion
        
        # Move to deleted_users collection
        await db.deleted_users.insert_one(deleted_record)
        
        # Delete from main users collection
        await db.users.delete_one({"_id": ObjectId(user_id)})
        
        # Optionally mark their posts as from deleted user (keep posts but mark them)
        await db.posts.update_many(
            {"author_id": user_id},
            {"$set": {"author_deleted": True}}
        )
        
        logger.info(f"User {user_id} soft deleted by admin {current_user_id}")
        
        return {
            "message": "User deleted successfully",
            "user_id": user_id,
            "username": user_to_delete.get("username"),
            "recoverable_until": deleted_record["expires_at"].isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error soft deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/deleted-users")
async def get_deleted_users(
    current_user_id: str = Depends(require_admin)
):
    """
    Get list of soft-deleted users that can be recovered.
    """
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    now = datetime.now(timezone.utc)
    
    # Get deleted users that haven't expired
    deleted_users = await db.deleted_users.find({
        "expires_at": {"$gt": now}
    }).sort("deleted_at", -1).to_list(100)
    
    result = []
    for user in deleted_users:
        result.append({
            "original_id": user.get("original_id"),
            "username": user.get("username"),
            "email": user.get("email"),
            "deleted_at": user.get("deleted_at").isoformat() if user.get("deleted_at") else None,
            "expires_at": user.get("expires_at").isoformat() if user.get("expires_at") else None,
            "days_remaining": (user.get("expires_at") - now).days if user.get("expires_at") else 0
        })
    
    return {
        "deleted_users": result,
        "count": len(result)
    }


@api_router.post("/analytics/admin/users/{user_id}/restore")
async def restore_deleted_user(
    user_id: str,
    current_user_id: str = Depends(require_admin)
):
    """
    Restore a soft-deleted user before the 7-day expiration.
    """
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        # Find in deleted_users
        deleted_user = await db.deleted_users.find_one({"original_id": user_id})
        if not deleted_user:
            raise HTTPException(status_code=404, detail="Deleted user not found")
        
        # Check if expired
        if deleted_user.get("expires_at") and deleted_user["expires_at"] < datetime.now(timezone.utc):
            raise HTTPException(status_code=410, detail="User data has expired and been permanently deleted")
        
        # Restore to users collection
        restore_data = {k: v for k, v in deleted_user.items() 
                       if k not in ["_id", "original_id", "deleted_at", "deleted_by", "expires_at", "reason"]}
        restore_data["_id"] = ObjectId(user_id)
        restore_data["restored_at"] = datetime.now(timezone.utc)
        
        await db.users.insert_one(restore_data)
        
        # Remove from deleted_users
        await db.deleted_users.delete_one({"original_id": user_id})
        
        # Restore their posts
        await db.posts.update_many(
            {"author_id": user_id},
            {"$unset": {"author_deleted": ""}}
        )
        
        logger.info(f"User {user_id} restored by admin {current_user_id}")
        
        return {
            "message": "User restored successfully",
            "user_id": user_id,
            "username": restore_data.get("username")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/analytics/admin/chart-data/{chart_type}")
async def get_chart_data(
    chart_type: str,
    period: str = "day",  # day, week, month
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """
    Get formatted data for various chart types.
    
    chart_type options:
    - user_growth: New users over time
    - session_trend: App sessions over time
    - mood_distribution: Pie chart of mood selections
    - page_views: Top pages bar chart
    - workout_completion: Workouts started vs completed
    - engagement_trend: Likes, comments, follows over time
    """
    from collections import defaultdict
    
    # Helper to get week start date from ISO week format
    def get_week_start_date(year_week_str):
        """Convert YYYY-WXX to the Monday of that week"""
        try:
            year = int(year_week_str.split('-W')[0])
            week = int(year_week_str.split('-W')[1])
            # Get first day of year, then add weeks
            first_day = datetime(year, 1, 1)
            # Find first Monday
            days_to_monday = (7 - first_day.weekday()) % 7
            first_monday = first_day + timedelta(days=days_to_monday)
            week_start = first_monday + timedelta(weeks=week - 1)
            return week_start
        except:
            return None
    
    # Determine date range and format
    if period == "month":
        days_back = min(days, 365)
        date_format = "%Y-%m"
    elif period == "week":
        days_back = min(days, 180)
        date_format = "%Y-W%V"
    else:
        days_back = min(days, 90)
        date_format = "%Y-%m-%d"
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days_back)
    
    def format_label(date_key, period_type):
        """Format a date key into a human-readable label"""
        try:
            if period_type == "month":
                dt = datetime.strptime(date_key, "%Y-%m")
                return dt.strftime("%b '%y")
            elif period_type == "week":
                # Convert YYYY-WXX to date range like "Dec 30 - Jan 5"
                week_start = get_week_start_date(date_key)
                if week_start:
                    week_end = week_start + timedelta(days=6)
                    if week_start.month == week_end.month:
                        return f"{week_start.strftime('%b %d')}-{week_end.strftime('%d')}"
                    else:
                        return f"{week_start.strftime('%b %d')}-{week_end.strftime('%b %d')}"
                return date_key
            else:
                dt = datetime.strptime(date_key, "%Y-%m-%d")
                return dt.strftime("%m/%d")
        except:
            return date_key
    
    try:
        if chart_type == "user_growth":
            pipeline = [
                {"$match": {"created_at": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$created_at"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}},
                {"$limit": 400},
            ]
            results = await db.users.aggregate(pipeline, allowDiskUse=True).to_list(400)
            sorted_data = [(r["_id"], r["count"]) for r in results]
            
            # Calculate cumulative
            cumulative = []
            running_total = 0
            for _, count in sorted_data:
                running_total += count
                cumulative.append(running_total)
            
            labels = [format_label(date_key, period) for date_key, _ in sorted_data]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [
                    {"label": "New Users", "data": [v for _, v in sorted_data]},
                    {"label": "Cumulative", "data": cumulative}
                ]
            }
            
        elif chart_type == "session_trend":
            pipeline = [
                {"$match": {"event_type": {"$in": ["app_opened", "app_session_start"]}, "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}},
                {"$limit": 400},
            ]
            results = await db.user_events.aggregate(pipeline, allowDiskUse=True).to_list(400)
            sorted_data = [(r["_id"], r["count"]) for r in results]
            labels = [format_label(date_key, period) for date_key, _ in sorted_data]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [
                    {"label": "Sessions", "data": [v for _, v in sorted_data]}
                ]
            }
            
        elif chart_type == "mood_distribution":
            mood_pipeline = [
                {"$match": {"event_type": "mood_selected", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": "$metadata.mood_category", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            
            mood_display_names = {
                "sweat": "I Want to Sweat",
                "muscle": "Muscle Gainer", 
                "outdoor": "Get Outside",
                "calisthenics": "Calisthenics",
                "lazy": "Feeling Lazy",
                "explosive": "Get Explosive"
            }
            
            moods = await db.user_events.aggregate(mood_pipeline).to_list(20)
            
            return {
                "chart_type": chart_type,
                "labels": [mood_display_names.get(m["_id"], m["_id"] or "Unknown") for m in moods if m["_id"]],
                "datasets": [
                    {"label": "Selections", "data": [m["count"] for m in moods if m["_id"]]}
                ]
            }
            
        elif chart_type == "page_views":
            page_pipeline = [
                {"$match": {"event_type": {"$in": ["screen_viewed", "screen_entered"]}, "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": "$metadata.screen_name", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 10}
            ]
            
            pages = await db.user_events.aggregate(page_pipeline).to_list(10)
            
            return {
                "chart_type": chart_type,
                "labels": [p["_id"] or "Unknown" for p in pages],
                "datasets": [
                    {"label": "Views", "data": [p["count"] for p in pages]}
                ]
            }
            
        elif chart_type == "workout_completion":
            started_pipeline = [
                {"$match": {"event_type": "workout_started", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            completed_pipeline = [
                {"$match": {"event_type": "workout_completed", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            started = await db.user_events.aggregate(started_pipeline).to_list(100)
            completed = await db.user_events.aggregate(completed_pipeline).to_list(100)
            
            # Merge datasets
            all_dates = sorted(set([s["_id"] for s in started] + [c["_id"] for c in completed]))
            started_dict = {s["_id"]: s["count"] for s in started}
            completed_dict = {c["_id"]: c["count"] for c in completed}
            
            labels = [format_label(date_key, period) for date_key in all_dates]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [
                    {"label": "Started", "data": [started_dict.get(d, 0) for d in all_dates]},
                    {"label": "Completed", "data": [completed_dict.get(d, 0) for d in all_dates]}
                ]
            }
            
        elif chart_type == "engagement_trend":
            engagement_pipeline = [
                {"$match": {"event_type": {"$in": ["post_liked", "post_commented", "user_followed"]}, "timestamp": {"$gte": cutoff}}},
                {"$group": {
                    "_id": {
                        "period": {"$dateToString": {"format": date_format, "date": "$timestamp"}},
                        "type": "$event_type",
                    },
                    "count": {"$sum": 1},
                }},
                {"$limit": 1200},
            ]
            rows = await db.user_events.aggregate(engagement_pipeline, allowDiskUse=True).to_list(1200)
            
            likes_by_period = defaultdict(int)
            comments_by_period = defaultdict(int)
            follows_by_period = defaultdict(int)
            for r in rows:
                p = r["_id"]["period"]
                t = r["_id"]["type"]
                if t == "post_liked":
                    likes_by_period[p] = r["count"]
                elif t == "post_commented":
                    comments_by_period[p] = r["count"]
                elif t == "user_followed":
                    follows_by_period[p] = r["count"]
            
            all_dates = sorted(set(list(likes_by_period.keys()) + list(comments_by_period.keys()) + list(follows_by_period.keys())))
            
            labels = [format_label(date_key, period) for date_key in all_dates]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [
                    {"label": "Likes", "data": [likes_by_period.get(d, 0) for d in all_dates]},
                    {"label": "Comments", "data": [comments_by_period.get(d, 0) for d in all_dates]},
                    {"label": "Follows", "data": [follows_by_period.get(d, 0) for d in all_dates]}
                ]
            }
        
        # Individual engagement metric charts
        elif chart_type == "workouts_added":
            # Track cart_item_added events over time
            pipeline = [
                {"$match": {"event_type": "cart_item_added", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            results = await db.user_events.aggregate(pipeline).to_list(100)
            labels = [format_label(r["_id"], period) for r in results]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Workouts Added", "data": [r["count"] for r in results]}]
            }
        
        elif chart_type == "workouts_completed":
            pipeline = [
                {"$match": {"event_type": "workout_completed", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            results = await db.user_events.aggregate(pipeline).to_list(100)
            labels = [format_label(r["_id"], period) for r in results]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Workouts Completed", "data": [r["count"] for r in results]}]
            }
        
        elif chart_type == "posts_created":
            pipeline = [
                {"$match": {"event_type": "post_created", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            results = await db.user_events.aggregate(pipeline).to_list(100)
            labels = [format_label(r["_id"], period) for r in results]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Posts Created", "data": [r["count"] for r in results]}]
            }
        
        elif chart_type == "likes":
            pipeline = [
                {"$match": {"event_type": "post_liked", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            results = await db.user_events.aggregate(pipeline).to_list(100)
            labels = [format_label(r["_id"], period) for r in results]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Likes", "data": [r["count"] for r in results]}]
            }
        
        elif chart_type == "comments":
            pipeline = [
                {"$match": {"event_type": "post_commented", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            results = await db.user_events.aggregate(pipeline).to_list(100)
            labels = [format_label(r["_id"], period) for r in results]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Comments", "data": [r["count"] for r in results]}]
            }
        
        elif chart_type == "guest_signins":
            pipeline = [
                {"$match": {"event_type": "guest_session_started", "is_guest": True, "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            results = await db.user_events.aggregate(pipeline).to_list(100)
            labels = [format_label(r["_id"], period) for r in results]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Guest Sign-ins", "data": [r["count"] for r in results]}]
            }
        
        elif chart_type == "completions_by_mood":
            # Workout completions grouped by mood card and time period
            # This tracks which mood categories are completing workouts over time
            mood_display_names = {
                "sweat": "Sweat",
                "muscle": "Muscle", 
                "outdoor": "Outdoor",
                "calisthenics": "Calisthenics",
                "lazy": "Lazy",
                "explosive": "Explosive"
            }
            
            # Get all moods that have completions
            mood_pipeline = [
                {"$match": {"event_type": "workout_completed", "timestamp": {"$gte": cutoff}}},
                {"$group": {"_id": "$metadata.mood_category"}},
            ]
            moods = await db.user_events.aggregate(mood_pipeline).to_list(20)
            mood_list = [m["_id"] for m in moods if m["_id"]]
            
            # Get completions by date for each mood
            all_dates = set()
            mood_data = {}
            
            for mood in mood_list:
                pipeline = [
                    {"$match": {"event_type": "workout_completed", "metadata.mood_category": mood, "timestamp": {"$gte": cutoff}}},
                    {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                    {"$sort": {"_id": 1}}
                ]
                results = await db.user_events.aggregate(pipeline).to_list(100)
                mood_data[mood] = {r["_id"]: r["count"] for r in results}
                all_dates.update(mood_data[mood].keys())
            
            sorted_dates = sorted(all_dates)
            labels = [format_label(date_key, period) for date_key in sorted_dates]
            
            # Build datasets for each mood
            datasets = []
            for mood in mood_list:
                data = [mood_data[mood].get(d, 0) for d in sorted_dates]
                datasets.append({
                    "label": mood_display_names.get(mood, mood or "Unknown"),
                    "data": data,
                    "mood_id": mood
                })
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": datasets
            }
        
        elif chart_type == "build_for_me_generations":
            # Track Build for Me generations from choose_for_me_usage collection
            pipeline = [
                {"$match": {"created_at": {"$gte": cutoff}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$created_at"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            results = await db.choose_for_me_usage.aggregate(pipeline).to_list(100)
            labels = [format_label(r["_id"], period) for r in results]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Build for Me", "data": [r["count"] for r in results]}]
            }
        
        elif chart_type == "build_for_me_by_mood":
            # Build for Me generations grouped by mood card
            mood_display_names = {
                "sweat": "Sweat",
                "Sweat / burn fat": "Sweat",
                "muscle": "Muscle", 
                "Muscle gainer": "Muscle",
                "outdoor": "Outdoor",
                "Get outside": "Outdoor",
                "calisthenics": "Calisthenics",
                "Calisthenics": "Calisthenics",
                "lazy": "Lazy",
                "I'm feeling lazy": "Lazy",
                "explosive": "Explosive",
                "Build explosion": "Explosive",
                "ringer": "Ringer",
                "Take me through the ringer": "Ringer"
            }
            
            # Get all moods that have generations
            mood_pipeline = [
                {"$match": {"created_at": {"$gte": cutoff}}},
                {"$group": {"_id": "$mood_card", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            results = await db.choose_for_me_usage.aggregate(mood_pipeline).to_list(20)
            
            labels = []
            data = []
            for r in results:
                mood = r["_id"] or "Unknown"
                display_name = mood_display_names.get(mood, mood.split('/')[0].strip() if mood else "Unknown")
                labels.append(display_name)
                data.append(r["count"])
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Generations", "data": data}]
            }
        
        elif chart_type == "custom_workouts_added":
            # Custom workouts (non-build-for-me) added to cart
            pipeline = [
                {"$match": {"event_type": "cart_item_added", "timestamp": {"$gte": cutoff}, "metadata.source": {"$ne": "build_for_me"}}},
                {"$group": {"_id": {"$dateToString": {"format": date_format, "date": "$timestamp"}}, "count": {"$sum": 1}}},
                {"$sort": {"_id": 1}}
            ]
            
            results = await db.user_events.aggregate(pipeline).to_list(100)
            labels = [format_label(r["_id"], period) for r in results]
            
            return {
                "chart_type": chart_type,
                "labels": labels,
                "datasets": [{"label": "Custom Workouts", "data": [r["count"] for r in results]}]
            }
        
        return {"chart_type": chart_type, "labels": [], "datasets": []}
        
    except Exception as e:
        logger.error(f"Error getting chart data for {chart_type}: {e}")
        return {"chart_type": chart_type, "labels": [], "datasets": [], "error": str(e)}


# User Endpoints

async def calculate_user_streak(user_id: str) -> int:
    """Calculate accurate streak based on activity, reset if inactive"""
    from datetime import datetime, timedelta, timezone
    
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday = today - timedelta(days=1)
    
    # Check if user was active yesterday or today
    # Include more event types to capture general app usage
    activity_event_types = [
        "workout_completed", "app_session_start", "app_opened",
        "screen_viewed", "screen_entered", "tab_switched",
        "post_created", "post_liked", "workout_started"
    ]
    
    recent_activity = await db.user_events.count_documents({
        "user_id": user_id,
        "event_type": {"$in": activity_event_types},
        "timestamp": {"$gte": yesterday}
    })
    
    if recent_activity == 0:
        # No activity in last 2 days - streak is 0
        return 0
    
    # Calculate actual streak
    current_streak = 0
    for i in range(90):  # Look back up to 90 days
        day_start = today - timedelta(days=i)
        day_end = day_start + timedelta(days=1)
        
        day_activity = await db.user_events.count_documents({
            "user_id": user_id,
            "event_type": {"$in": activity_event_types},
            "timestamp": {"$gte": day_start, "$lt": day_end}
        })
        
        if day_activity > 0:
            current_streak += 1
        elif i > 0:
            break
    
    return current_streak

async def find_user_by_id(user_id: str):
    """Find user by either custom user_id field or MongoDB ObjectId"""
    # First try to find by custom user_id field (for OAuth users)
    user = await db.users.find_one({"user_id": user_id})
    
    # If not found, try ObjectId (for legacy users)
    if not user:
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            pass  # Invalid ObjectId format, skip
    
    return user

@api_router.get("/users/me")
async def get_current_user_info(
    response: Response,
    current_user_id: str = Depends(get_current_user)
):
    user = await find_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calculate accurate streak
    current_streak = await calculate_user_streak(current_user_id)
    
    # Update stored streak if different
    stored_streak = user.get("current_streak", 0)
    if current_streak != stored_streak:
        # Update using the appropriate identifier
        if "user_id" in user:
            await db.users.update_one(
                {"user_id": user["user_id"]},
                {"$set": {"current_streak": current_streak}}
            )
        else:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"current_streak": current_streak}}
            )
    
    # Check if admin using canonical function
    is_admin, matched_by = is_admin_effective_sync(user)
    
    # Set response headers for debugging
    response.headers["X-Admin-Effective"] = str(is_admin).lower()
    response.headers["X-Admin-Matched-By"] = matched_by
    
    # Return user data including terms acceptance status
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user.get("email", ""),
        "name": user.get("name"),
        "bio": user.get("bio", ""),
        "avatar": user.get("avatar", ""),
        "followers_count": user.get("followers_count", 0),
        "following_count": user.get("following_count", 0),
        "workouts_count": user.get("workouts_count", 0),
        "current_streak": current_streak,
        "is_admin": is_admin,
        "is_admin_matched_by": matched_by,  # Added for debugging
        "created_at": user.get("created_at", datetime.now(timezone.utc)).isoformat() if user.get("created_at") else datetime.now(timezone.utc).isoformat(),
        "terms_accepted_at": user.get("terms_accepted_at").isoformat() if user.get("terms_accepted_at") else None,
        "terms_accepted_version": user.get("terms_accepted_version"),
        "current_terms_version": CURRENT_TERMS_VERSION,
        "tips_state": user.get("tips_state") or {
            "mood_scroll": "unseen",
            "form_videos": "unseen",
            "completion_share": "unseen",
        },
    }



@api_router.get("/users/me/stats")
async def get_current_user_stats(current_user_id: str = Depends(get_current_user)):
    """Get user's workout stats from tracking events"""
    
    # Count completed workouts
    workouts_completed = await db.user_events.count_documents({
        "user_id": current_user_id,
        "event_type": "workout_completed"
    })
    
    # Calculate total minutes (estimate based on workouts - average 20 mins per workout)
    total_minutes = workouts_completed * 20
    
    # Calculate accurate streak using helper function
    current_streak = await calculate_user_streak(current_user_id)
    
    # Get stored streak and update if different
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if user:
        stored_streak = user.get("current_streak", 0)
        if current_streak != stored_streak:
            await db.users.update_one(
                {"_id": ObjectId(current_user_id)},
                {"$set": {"current_streak": current_streak}}
            )
    
    return {
        "workouts_completed": workouts_completed,
        "total_minutes": total_minutes,
        "current_streak": current_streak
    }


@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: str):
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=str(user["_id"]),
            username=user["username"],
            email=user["email"],
            name=user.get("name"),
            bio=user.get("bio", ""),
            avatar=user.get("avatar", ""),
            followers_count=user.get("followers_count", 0),
            following_count=user.get("following_count", 0),
            workouts_count=user.get("workouts_count", 0),
            current_streak=user.get("current_streak", 0),
            created_at=user["created_at"]
        )
    except:
        raise HTTPException(status_code=404, detail="User not found")

class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    bio: Optional[str] = None
    avatar: Optional[str] = None

@api_router.put("/users/me")
async def update_profile(
    user_data: UserUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update current user's profile"""
    update_fields = {}
    
    # Check if username is being changed and if it's available
    if user_data.username is not None:
        username = user_data.username.strip()
        if not username:
            raise HTTPException(status_code=400, detail="Username cannot be empty")
        
        # Check if username is already taken by another user
        existing_user = await db.users.find_one({"username": username})
        if existing_user and str(existing_user["_id"]) != current_user_id:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        update_fields["username"] = username
    
    if user_data.name is not None:
        update_fields["name"] = user_data.name
    if user_data.bio is not None:
        update_fields["bio"] = user_data.bio
    if user_data.avatar is not None:
        update_fields["avatar"] = user_data.avatar
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": update_fields}
    )
    
    if result.modified_count == 0:
        # Check if user exists but fields didn't change
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Profile updated successfully"}

@api_router.put("/users/me/credentials")
async def update_credentials(
    credentials: CredentialsUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update user's login credentials (username, email, or password)"""
    try:
        # Get current user
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        stored_password = user.get("password_hash") or user.get("password")
        if not stored_password:
            raise HTTPException(status_code=400, detail="Cannot change credentials for OAuth accounts")
        
        # Check if password matches
        if isinstance(stored_password, str):
            stored_password = stored_password.encode('utf-8')
        
        if not bcrypt.checkpw(credentials.current_password.encode('utf-8'), stored_password):
            raise HTTPException(status_code=401, detail="Current password is incorrect")
        
        update_fields = {}
        
        # Update username if provided
        if credentials.new_username:
            new_username = credentials.new_username.strip()
            if not new_username:
                raise HTTPException(status_code=400, detail="Username cannot be empty")
            if len(new_username) < 3:
                raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
            
            # Check if username is already taken
            existing = await db.users.find_one({"username": new_username})
            if existing and str(existing["_id"]) != current_user_id:
                raise HTTPException(status_code=400, detail="Username already taken")
            
            update_fields["username"] = new_username
        
        # Update email if provided
        if credentials.new_email:
            new_email = credentials.new_email.strip().lower()
            if not new_email or "@" not in new_email:
                raise HTTPException(status_code=400, detail="Invalid email address")
            
            # Check if email is already taken
            existing = await db.users.find_one({"email": new_email})
            if existing and str(existing["_id"]) != current_user_id:
                raise HTTPException(status_code=400, detail="Email already in use")
            
            update_fields["email"] = new_email
        
        # Update password if provided
        if credentials.new_password:
            if len(credentials.new_password) < 6:
                raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
            
            # Hash the new password
            new_hash = bcrypt.hashpw(credentials.new_password.encode('utf-8'), bcrypt.gensalt())
            update_fields["password_hash"] = new_hash
            update_fields["password"] = new_hash  # Update both fields for compatibility
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No changes provided")
        
        # Perform the update
        result = await db.users.update_one(
            {"_id": ObjectId(current_user_id)},
            {"$set": update_fields}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=500, detail="Failed to update credentials")
        
        logger.info(f"Credentials updated for user {current_user_id}: {list(update_fields.keys())}")
        
        return {
            "message": "Credentials updated successfully",
            "updated_fields": list(update_fields.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating credentials: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update credentials")

@api_router.post("/users/me/accept-terms")
async def accept_terms(current_user_id: str = Depends(get_current_user)):
    """Record user's acceptance of Terms of Service and Privacy Policy"""
    try:
        now = datetime.now(timezone.utc)
        
        result = await db.users.update_one(
            {"_id": ObjectId(current_user_id)},
            {
                "$set": {
                    "terms_accepted_at": now,
                    "terms_accepted_version": CURRENT_TERMS_VERSION,
                    "privacy_accepted_at": now,
                }
            }
        )
        
        if result.modified_count == 0:
            # If not modified, check if user exists
            user = await db.users.find_one({"_id": ObjectId(current_user_id)})
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"✅ Terms accepted by user: {current_user_id} (version: {CURRENT_TERMS_VERSION})")
        
        return {
            "message": "Terms acceptance recorded",
            "terms_accepted_at": now.isoformat(),
            "terms_accepted_version": CURRENT_TERMS_VERSION,
            "privacy_accepted_at": now.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording terms acceptance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to record terms acceptance")

@api_router.delete("/users/me")
async def delete_user_account(current_user_id: str = Depends(get_current_user)):
    """Delete user account and all associated data"""
    try:
        # Get user info for logging and tracking
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        username = user.get("username", "unknown")
        email = user.get("email", "unknown")
        logger.info(f"🗑️ Deleting account for user: {username} ({current_user_id})")
        
        # Track the deletion event for analytics BEFORE deleting anything
        deletion_record = {
            "user_id": current_user_id,
            "username": username,
            "email": email,
            "deleted_at": datetime.now(timezone.utc),
            "account_created_at": user.get("created_at"),
            "workouts_completed": user.get("workouts_count", 0),
            "posts_count": user.get("posts_count", 0),
            "followers_count": user.get("followers_count", 0),
            "following_count": user.get("following_count", 0),
            "is_verified": user.get("is_verified", False),
            "login_provider": user.get("login_provider", "email"),
        }
        await db.deleted_users.insert_one(deletion_record)
        logger.info(f"📊 Tracked deletion for user: {username}")
        
        # Delete user's posts
        posts_result = await db.posts.delete_many({"author_id": current_user_id})
        logger.info(f"Deleted {posts_result.deleted_count} posts")
        
        # Delete user's comments
        comments_result = await db.comments.delete_many({"author_id": current_user_id})
        logger.info(f"Deleted {comments_result.deleted_count} comments")
        
        # Delete user's saved workouts
        saved_result = await db.saved_workouts.delete_many({"user_id": current_user_id})
        logger.info(f"Deleted {saved_result.deleted_count} saved workouts")
        
        # Delete user's workout cards
        cards_result = await db.workout_cards.delete_many({"user_id": current_user_id})
        logger.info(f"Deleted {cards_result.deleted_count} workout cards")
        
        # Delete user's analytics events
        events_result = await db.user_events.delete_many({"user_id": current_user_id})
        logger.info(f"Deleted {events_result.deleted_count} analytics events")
        
        # Delete user's sessions
        sessions_result = await db.user_sessions.delete_many({"user_id": current_user_id})
        logger.info(f"Deleted {sessions_result.deleted_count} sessions")
        
        # Remove user from followers/following lists
        await db.users.update_many(
            {"followers": current_user_id},
            {"$pull": {"followers": current_user_id}, "$inc": {"followers_count": -1}}
        )
        await db.users.update_many(
            {"following": current_user_id},
            {"$pull": {"following": current_user_id}, "$inc": {"following_count": -1}}
        )
        
        # Delete likes on user's posts
        await db.likes.delete_many({"author_id": current_user_id})
        
        # Delete the user
        delete_result = await db.users.delete_one({"_id": ObjectId(current_user_id)})
        
        if delete_result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        logger.info(f"✅ Successfully deleted account for user: {username}")
        return {"message": "Account deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user account: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete account")

@api_router.post("/users/me/avatar")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user)
):
    """Upload profile picture to Cloudinary cloud storage"""
    try:
        logger.info(f"📸 Avatar upload START (Cloudinary)")
        logger.info(f"Filename: {file.filename}")
        logger.info(f"Content-Type: {file.content_type}")
        
        # Validate file type
        allowed_types = {'image/jpeg', 'image/jpg', 'image/png', 'image/gif'}
        content_type = file.content_type or ''
        
        if content_type not in allowed_types:
            # Try to determine from filename extension
            if file.filename:
                ext = Path(file.filename).suffix.lower()
                ext_to_type = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif'}
                content_type = ext_to_type.get(ext, content_type)
        
        if content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Only JPEG, PNG, and GIF images are allowed")
        
        # Read file content
        file_content = await file.read()
        
        # Upload to Cloudinary with avatar-specific transformations
        public_id = f"mood_app/avatars/{current_user_id}"
        
        result = cloudinary.uploader.upload(
            file_content,
            public_id=public_id,
            resource_type="image",
            folder="mood_app/avatars",
            overwrite=True,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                {"quality": "auto", "fetch_format": "auto"}
            ]
        )
        
        # Get the secure URL (permanent, non-expiring)
        secure_url = result.get("secure_url")
        
        # Update user's avatar URL in database
        await db.users.update_one(
            {"_id": ObjectId(current_user_id)},
            {"$set": {"avatar": secure_url}}
        )
        
        logger.info(f"✅ Profile picture uploaded to Cloudinary: {secure_url}")
        return {
            "message": "Profile picture uploaded successfully",
            "url": secure_url
        }
    
    except cloudinary.exceptions.Error as e:
        logger.error(f"Cloudinary avatar upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cloud upload failed: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile picture upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile picture upload failed: {str(e)}")

class AvatarBase64Upload(BaseModel):
    image_data: str

@api_router.post("/users/me/avatar-base64")
async def upload_profile_picture_base64(
    data: AvatarBase64Upload,
    current_user_id: str = Depends(get_current_user)
):
    """Upload profile picture using base64 encoded image to Cloudinary"""
    try:
        logger.info(f"📸 Avatar upload (base64) START for user {current_user_id}")
        
        # Parse base64 data
        image_data = data.image_data
        
        # Upload to Cloudinary (it handles base64 data URLs directly)
        public_id = f"mood_app/avatars/{current_user_id}"
        
        result = cloudinary.uploader.upload(
            image_data,
            public_id=public_id,
            resource_type="image",
            folder="mood_app/avatars",
            overwrite=True,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                {"quality": "auto", "fetch_format": "auto"}
            ]
        )
        
        # Get the secure URL (permanent, non-expiring)
        secure_url = result.get("secure_url")
        
        # Update user's avatar URL in database
        await db.users.update_one(
            {"_id": ObjectId(current_user_id)},
            {"$set": {"avatar": secure_url}}
        )
        
        logger.info(f"✅ Profile picture uploaded to Cloudinary (base64): {secure_url}")
        return {
            "message": "Profile picture uploaded successfully",
            "url": secure_url
        }
    
    except cloudinary.exceptions.Error as e:
        logger.error(f"Cloudinary avatar upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cloud upload failed: {str(e)}")
    except Exception as e:
        logger.error(f"Base64 avatar upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Profile picture upload failed: {str(e)}")


# ----- Onboarding Tips -----

ALLOWED_TIP_KEYS = {"mood_scroll", "form_videos", "completion_share"}
ALLOWED_TIP_STATES = {"unseen", "completed", "dismissed", "never"}


class TipStateUpdate(BaseModel):
    key: str
    state: str


@api_router.patch("/users/me/tips-state")
async def update_tip_state(
    payload: TipStateUpdate,
    current_user_id: str = Depends(get_current_user),
):
    """Update a single onboarding tip state for the current user."""
    if payload.key not in ALLOWED_TIP_KEYS:
        raise HTTPException(status_code=400, detail="Invalid tip key")
    if payload.state not in ALLOWED_TIP_STATES:
        raise HTTPException(status_code=400, detail="Invalid tip state")

    # mood_scroll has no "never" option (self-resolves)
    if payload.key == "mood_scroll" and payload.state == "never":
        raise HTTPException(status_code=400, detail="mood_scroll does not support 'never'")

    user = await find_user_by_id(current_user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_filter = (
        {"user_id": user["user_id"]}
        if "user_id" in user
        else {"_id": user["_id"]}
    )
    await db.users.update_one(
        update_filter,
        {"$set": {f"tips_state.{payload.key}": payload.state}},
    )
    return {"key": payload.key, "state": payload.state}


@api_router.get("/app/onboarding-config")
async def get_onboarding_config():
    """Public master kill switch for onboarding tips. Default: enabled."""
    doc = await db.app_settings.find_one({"_id": "onboarding"}, {"_id": 0})
    enabled = True if not doc else bool(doc.get("onboarding_tips_enabled", True))
    return {"onboarding_tips_enabled": enabled}


@api_router.get("/users/{user_id}/is-following")
async def check_following_status(
    user_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Check if current user is following another user"""
    if user_id == current_user_id:
        return {"is_following": False, "is_self": True}
    
    try:
        following_object_id = ObjectId(user_id)
        follower_object_id = ObjectId(current_user_id)
        
        existing_follow = await db.follows.find_one({
            "follower_id": follower_object_id,
            "following_id": following_object_id
        })
        
        return {
            "is_following": existing_follow is not None,
            "is_self": False
        }
    except:
        raise HTTPException(status_code=404, detail="User not found")

@api_router.get("/users/{user_id}/followers")
async def get_user_followers(
    user_id: str, 
    limit: int = 50, 
    skip: int = 0,
    current_user_id: Optional[str] = Depends(get_optional_current_user)
):
    """Get list of user's followers"""
    try:
        user_object_id = ObjectId(user_id)
        
        # Get followers with user information
        pipeline = [
            {"$match": {"following_id": user_object_id}},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "follower_id",
                    "foreignField": "_id",
                    "as": "follower"
                }
            },
            {"$unwind": "$follower"}
        ]
        
        follows = await db.follows.aggregate(pipeline).to_list(length=limit)
        
        # Batch follow-check: single query instead of N+1
        follower_ids = [follow["follower"]["_id"] for follow in follows]
        following_set = set()
        if current_user_id and follower_ids:
            batch = await db.follows.find({
                "follower_id": ObjectId(current_user_id),
                "following_id": {"$in": follower_ids}
            }).to_list(100)
            following_set = {str(f["following_id"]) for f in batch}
        
        result = []
        for follow in follows:
            follower = follow["follower"]
            follower_id = str(follower["_id"])
            
            is_self = current_user_id and follower_id == current_user_id
            is_following = follower_id in following_set if not is_self else False
            
            result.append({
                "id": follower_id,
                "username": follower["username"],
                "name": follower.get("name", ""),
                "bio": follower.get("bio", ""),
                "avatar": follower.get("avatar", ""),
                "followers_count": follower.get("followers_count", 0),
                "following_count": follower.get("following_count", 0),
                "is_following": is_following,
                "is_self": bool(is_self)
            })
        
        return {"users": result}
    except:
        raise HTTPException(status_code=404, detail="User not found")

@api_router.get("/users/{user_id}/following")
async def get_user_following(
    user_id: str, 
    limit: int = 50, 
    skip: int = 0,
    current_user_id: Optional[str] = Depends(get_optional_current_user)
):
    """Get list of users that this user is following"""
    try:
        user_object_id = ObjectId(user_id)
        
        # Get following with user information
        pipeline = [
            {"$match": {"follower_id": user_object_id}},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "following_id",
                    "foreignField": "_id",
                    "as": "following"
                }
            },
            {"$unwind": "$following"}
        ]
        
        follows = await db.follows.aggregate(pipeline).to_list(length=limit)
        
        # Batch follow-check: single query instead of N+1
        following_ids = [follow["following"]["_id"] for follow in follows]
        following_set = set()
        if current_user_id and following_ids:
            batch = await db.follows.find({
                "follower_id": ObjectId(current_user_id),
                "following_id": {"$in": following_ids}
            }).to_list(100)
            following_set = {str(f["following_id"]) for f in batch}
        
        result = []
        for follow in follows:
            following = follow["following"]
            following_id = str(following["_id"])
            
            is_self = current_user_id and following_id == current_user_id
            is_following = following_id in following_set if not is_self else False
            
            result.append({
                "id": following_id,
                "username": following["username"],
                "name": following.get("name", ""),
                "bio": following.get("bio", ""),
                "avatar": following.get("avatar", ""),
                "followers_count": following.get("followers_count", 0),
                "following_count": following.get("following_count", 0),
                "is_following": is_following,
                "is_self": bool(is_self)
            })
        
        return {"users": result}
    except:
        raise HTTPException(status_code=404, detail="User not found")

@api_router.get("/users/search/query")
async def search_users_general(
    q: str,
    current_user_id: str = Depends(get_current_user),
    limit: int = 20
):
    """Search for users by username or name"""
    try:
        if not q or len(q.strip()) < 1:
            return []
        
        search_query = q.strip()
        
        # Search in username and name fields (case-insensitive)
        query = {
            "$or": [
                {"username": {"$regex": search_query, "$options": "i"}},
                {"name": {"$regex": search_query, "$options": "i"}}
            ]
        }
        
        users = await db.users.find(query).limit(limit).to_list(length=limit)
        
        result = []
        current_user_obj_id = ObjectId(current_user_id)
        
        # Batch follow-check: single query instead of N+1
        user_ids = [u["_id"] for u in users if u["_id"] != current_user_obj_id]
        following_set = set()
        if user_ids:
            batch = await db.follows.find({
                "follower_id": current_user_obj_id,
                "following_id": {"$in": user_ids}
            }).to_list(100)
            following_set = {str(f["following_id"]) for f in batch}
        
        for user in users:
            user_id = user["_id"]
            is_self = user_id == current_user_obj_id
            is_following = str(user_id) in following_set if not is_self else False
            
            result.append({
                "id": str(user_id),
                "username": user["username"],
                "name": user.get("name", ""),
                "bio": user.get("bio", ""),
                "avatar": user.get("avatar", ""),
                "followers_count": user.get("followers_count", 0),
                "following_count": user.get("following_count", 0),
                "is_following": is_following,
                "is_self": is_self
            })
        
        return result
    
    except Exception as e:
        logger.error(f"User search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@api_router.get("/users/{user_id}/posts")
async def get_user_posts(
    user_id: str,
    request: Request,
    limit: int = 20,
    skip: int = 0,
    current_user_id: str = Depends(get_current_user)
):
    """Get posts by a specific user."""
    try:
        # Handle both MongoDB ObjectId and custom user_id formats
        user_object_id = None
        
        # First, try to use it as ObjectId directly
        try:
            user_object_id = ObjectId(user_id)
            # Verify this user exists
            user = await db.users.find_one({"_id": user_object_id})
            if not user:
                user_object_id = None
        except:
            user_object_id = None
        
        # If not a valid ObjectId, try to find user by custom user_id
        if not user_object_id:
            user = await db.users.find_one({"user_id": user_id})
            if user:
                user_object_id = user["_id"]
            else:
                # Return empty list if user not found
                return []
        
        user_id_str = str(user_object_id)
        
        # Match both ObjectId AND string author_id (legacy data may store as string)
        author_match = {"$or": [
            {"author_id": user_object_id},
            {"author_id": user_id_str},
        ]}
        
        # Debug logging for diagnosis
        db_count = await db.posts.count_documents(author_match)
        logger.info(
            f"PROFILE-POSTS: userId={user_id_str} "
            f"filter={author_match} "
            f"skip={skip} limit={limit} sort=created_at:desc "
            f"db_count={db_count}"
        )
        
        # Get posts with author and workout details
        pipeline = [
            {"$match": author_match},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            # Normalize author_id to ObjectId for the user lookup (handles string author_id legacy data)
            {"$addFields": {
                "_author_oid": {"$cond": {
                    "if": {"$eq": [{"$type": "$author_id"}, "string"]},
                    "then": {"$toObjectId": "$author_id"},
                    "else": "$author_id"
                }}
            }},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "_author_oid",
                    "foreignField": "_id",
                    "as": "author"
                }
            },
            {"$unwind": "$author"},
            {
                "$lookup": {
                    "from": "workouts",
                    "localField": "workout_id",
                    "foreignField": "_id",
                    "as": "workout"
                }
            },
            {
                "$lookup": {
                    "from": "post_likes",
                    "let": {"post_id": "$_id", "user_id": ObjectId(current_user_id) if current_user_id else ObjectId("000000000000000000000000")},
                    "pipeline": [
                        {"$match": {"$expr": {"$and": [
                            {"$eq": ["$post_id", "$$post_id"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]}}}
                    ],
                    "as": "user_like"
                }
            }
        ]
        
        posts = await db.posts.aggregate(pipeline).to_list(length=limit)
        
        result = []
        for post in posts:
            # Convert ObjectIds to strings
            author_data = UserResponse(
                id=str(post["author"]["_id"]),
                username=post["author"]["username"],
                email=post["author"]["email"],
                name=post["author"].get("name"),
                bio=post["author"].get("bio", ""),
                avatar=post["author"].get("avatar", ""),
                followers_count=post["author"].get("followers_count", 0),
                following_count=post["author"].get("following_count", 0),
                workouts_count=post["author"].get("workouts_count", 0),
                current_streak=post["author"].get("current_streak", 0),
                created_at=post["author"]["created_at"]
            )
            
            workout_data = None
            if post.get("workout") and len(post["workout"]) > 0:
                workout = post["workout"][0]
                workout_data = WorkoutResponse(
                    id=str(workout["_id"]),
                    title=workout["title"],
                    mood_category=workout["mood_category"],
                    exercises=workout["exercises"],
                    duration=workout["duration"],
                    difficulty=workout["difficulty"],
                    equipment=workout.get("equipment", []),
                    calories_estimate=workout.get("calories_estimate"),
                    created_at=workout["created_at"]
                )
            
            # Get embedded workout card data for replication
            embedded_workout_data = None
            if post.get("workout_data"):
                try:
                    raw_data = post["workout_data"]
                    embedded_workout_data = WorkoutCardData(
                        workouts=[WorkoutExerciseData(**w) for w in raw_data.get("workouts", [])],
                        totalDuration=raw_data.get("totalDuration", 0),
                        completedAt=raw_data.get("completedAt", ""),
                        moodCategory=raw_data.get("moodCategory"),
                        workout_snapshot_id=raw_data.get("workout_snapshot_id")
                    )
                except Exception as e:
                    print(f"Error parsing workout_data: {e}")
            
            media_fields = derive_post_media_fields(post)
            result.append(PostResponse(
                id=str(post["_id"]),
                author=author_data,
                workout=workout_data,
                workout_data=embedded_workout_data,
                caption=post.get("caption", ""),
                media_urls=post.get("media_urls", []),
                hashtags=post.get("hashtags", []),
                cover_urls=post.get("cover_urls"),
                thumbnail_url=media_fields["thumbnail_url"],
                media_type=media_fields["media_type"],
                likes_count=post.get("likes_count", 0),
                comments_count=post.get("comments_count", 0),
                is_liked=len(post.get("user_like", [])) > 0,
                created_at=post["created_at"]
            ))
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PROFILE-POSTS-ERROR: userId={user_id} error={type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to load profile posts: {type(e).__name__}")

# Workout Endpoints

@api_router.get("/workouts")
async def get_workouts(mood: Optional[str] = None, difficulty: Optional[str] = None, limit: int = 20):
    """Get workouts with optional filtering by mood and difficulty"""
    filter_query = {}
    if mood:
        filter_query["mood_category"] = mood
    if difficulty:
        filter_query["difficulty"] = difficulty
    
    workouts_cursor = db.workouts.find(filter_query).limit(limit)
    workouts = await workouts_cursor.to_list(length=limit)
    
    return [
        WorkoutResponse(
            id=str(workout["_id"]),
            title=workout["title"],
            mood_category=workout["mood_category"],
            exercises=workout["exercises"],
            duration=workout["duration"],
            difficulty=workout["difficulty"],
            equipment=workout.get("equipment", []),
            calories_estimate=workout.get("calories_estimate"),
            created_at=workout["created_at"]
        )
        for workout in workouts
    ]

@api_router.post("/workouts", response_model=WorkoutResponse)
async def create_workout(workout_data: WorkoutCreate, current_user_id: str = Depends(get_current_user)):
    """Create a new workout (admin feature for now)"""
    workout_doc = {
        **workout_data.dict(),
        "created_by": current_user_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.workouts.insert_one(workout_doc)
    
    workout_doc["id"] = str(result.inserted_id)
    return WorkoutResponse(**workout_doc)

@api_router.get("/workouts/mood/{mood_category}")
async def get_workouts_by_mood(mood_category: str, limit: int = 10):
    """Get workouts filtered by mood category"""
    valid_moods = [
        "i want to sweat",
        "i want to push and gain muscle", 
        "i want to build explosiveness",
        "i want a light sweat",
        "im feeling lazy",
        "i want to do calisthenics",
        "i want to get outside"
    ]
    
    if mood_category.lower() not in [mood.lower() for mood in valid_moods]:
        raise HTTPException(status_code=400, detail="Invalid mood category")
    
    workouts_cursor = db.workouts.find({"mood_category": mood_category}).limit(limit)
    workouts = await workouts_cursor.to_list(length=limit)
    
    return [
        WorkoutResponse(
            id=str(workout["_id"]),
            title=workout["title"],
            mood_category=workout["mood_category"],
            exercises=workout["exercises"],
            duration=workout["duration"],
            difficulty=workout["difficulty"],
            equipment=workout.get("equipment", []),
            calories_estimate=workout.get("calories_estimate"),
            created_at=workout["created_at"]
        )
        for workout in workouts
    ]

# User Workout History

@api_router.post("/user-workouts")
async def log_workout_completion(workout_data: UserWorkoutCreate, current_user_id: str = Depends(get_current_user)):
    """Log a completed workout for the user"""
    workout_log = {
        **workout_data.dict(),
        "user_id": current_user_id,
        "completed_at": workout_data.completed_at or datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.user_workouts.insert_one(workout_log)
    
    # Update user's workout count
    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$inc": {"workouts_count": 1}}
    )
    
    return {"message": "Workout logged successfully", "id": str(result.inserted_id)}

@api_router.get("/user-workouts")
async def get_user_workouts(current_user_id: str = Depends(get_current_user), limit: int = 20):
    """Get user's workout history"""
    user_workouts_cursor = db.user_workouts.find({"user_id": current_user_id}).sort("completed_at", -1).limit(limit)
    user_workouts = await user_workouts_cursor.to_list(length=limit)
    
    return user_workouts

# File Upload Endpoints - Using Cloudinary for persistent cloud storage

UPLOAD_DIR = Path("/app/backend/uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Helper function to generate video thumbnail URL from Cloudinary
def get_cloudinary_video_thumbnail(public_id: str, timestamp: float = 2.0) -> str:
    """Generate a thumbnail URL for a video at a specific timestamp"""
    return f"https://res.cloudinary.com/{os.environ.get('CLOUDINARY_CLOUD_NAME')}/video/upload/so_{timestamp},w_400,h_400,c_fill/{public_id}.jpg"

@api_router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    """Serve uploaded media files - Legacy endpoint for old local files"""
    file_path = UPLOAD_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)

@api_router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user)
):
    """Upload a single media file (image or video) to Cloudinary cloud storage"""
    # Check if user has accepted terms
    await check_terms_accepted(current_user_id)
    
    try:
        # Validate file type - handle missing/empty filename
        allowed_image_types = {'image/jpeg', 'image/jpg', 'image/png', 'image/gif'}
        allowed_video_types = {'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi'}
        allowed_types = allowed_image_types | allowed_video_types
        
        content_type = file.content_type or ''
        
        if content_type not in allowed_types:
            # Try to determine from filename extension
            if file.filename:
                ext = Path(file.filename).suffix.lower()
                ext_to_type = {
                    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.png': 'image/png', '.gif': 'image/gif',
                    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/avi'
                }
                content_type = ext_to_type.get(ext, content_type)
        
        if content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"File type {content_type} not allowed")
        
        is_video = content_type in allowed_video_types
        
        # Read file content
        file_content = await file.read()
        
        # Determine resource type for Cloudinary
        resource_type = "video" if is_video else "image"
        
        # Upload to Cloudinary
        logger.info(f"📤 Uploading {resource_type} to Cloudinary...")
        
        # Create a unique public_id
        public_id = f"mood_app/{resource_type}s/{current_user_id}/{uuid.uuid4()}"
        
        # Upload options
        upload_options = {
            "public_id": public_id,
            "resource_type": resource_type,
            "folder": f"mood_app/{resource_type}s",
            "overwrite": True,
            "unique_filename": True,
        }
        
        # For videos, generate thumbnail eagerly
        if is_video:
            upload_options["eager"] = [
                {"format": "jpg", "transformation": [{"start_offset": "2", "width": 400, "height": 400, "crop": "fill"}]}
            ]
            upload_options["eager_async"] = False
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            **upload_options
        )
        
        # Get the secure URL (permanent, non-expiring)
        secure_url = result.get("secure_url")
        
        # For videos, generate thumbnail URL
        thumbnail_url = None
        if is_video:
            if result.get("eager") and len(result["eager"]) > 0:
                thumbnail_url = result["eager"][0].get("secure_url")
            else:
                # Generate thumbnail URL manually
                thumbnail_url = get_cloudinary_video_thumbnail(result["public_id"])
        
        logger.info(f"✅ Cloudinary upload successful: {secure_url}")
        
        response_data = {
            "message": "File uploaded successfully to cloud storage",
            "url": secure_url,
            "public_id": result.get("public_id"),
            "resource_type": resource_type,
            "format": result.get("format"),
            "width": result.get("width"),
            "height": result.get("height"),
        }
        
        if is_video:
            response_data["duration"] = result.get("duration")
            response_data["thumbnail_url"] = thumbnail_url
        
        return response_data
    
    except cloudinary.exceptions.Error as e:
        logger.error(f"Cloudinary upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Cloud upload failed: {str(e)}")
    except Exception as e:
        logger.error(f"File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/upload/multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    current_user_id: str = Depends(get_current_user)
):
    """Upload multiple media files (up to 5) to Cloudinary cloud storage"""
    # Check if user has accepted terms
    await check_terms_accepted(current_user_id)
    
    if len(files) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 files allowed")
    
    uploaded_results = []
    cover_urls = []  # Thumbnails for videos
    
    allowed_image_types = {'image/jpeg', 'image/jpg', 'image/png', 'image/gif'}
    allowed_video_types = {'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/avi'}
    allowed_types = allowed_image_types | allowed_video_types
    
    for file in files:
        try:
            content_type = file.content_type or ''
            
            # Try to determine from filename extension if content_type not recognized
            if content_type not in allowed_types and file.filename:
                ext = Path(file.filename).suffix.lower()
                ext_to_type = {
                    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.png': 'image/png', '.gif': 'image/gif',
                    '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.avi': 'video/avi'
                }
                content_type = ext_to_type.get(ext, content_type)
            
            if content_type not in allowed_types:
                logger.warning(f"Skipping file with unsupported type: {content_type}")
                continue
            
            is_video = content_type in allowed_video_types
            resource_type = "video" if is_video else "image"
            
            # Read file content
            file_content = await file.read()
            
            # Create unique public_id
            public_id = f"mood_app/{resource_type}s/{current_user_id}/{uuid.uuid4()}"
            
            # Upload options
            upload_options = {
                "public_id": public_id,
                "resource_type": resource_type,
                "folder": f"mood_app/{resource_type}s",
                "overwrite": True,
                "unique_filename": True,
            }
            
            # For videos, generate thumbnail eagerly
            if is_video:
                upload_options["eager"] = [
                    {"format": "jpg", "transformation": [{"start_offset": "2", "width": 400, "height": 400, "crop": "fill"}]}
                ]
                upload_options["eager_async"] = False
            
            # Upload to Cloudinary
            logger.info(f"📤 Uploading {resource_type} to Cloudinary: {file.filename}")
            result = cloudinary.uploader.upload(file_content, **upload_options)
            
            secure_url = result.get("secure_url")
            uploaded_results.append(secure_url)
            
            # For videos, add thumbnail to cover_urls
            if is_video:
                if result.get("eager") and len(result["eager"]) > 0:
                    cover_urls.append(result["eager"][0].get("secure_url"))
                else:
                    cover_urls.append(get_cloudinary_video_thumbnail(result["public_id"]))
            else:
                # For images, use the image itself as cover
                cover_urls.append(secure_url)
            
            logger.info(f"✅ Uploaded: {secure_url}")
        
        except Exception as e:
            logger.error(f"File upload error for {file.filename}: {str(e)}")
            continue
    
    return {
        "message": f"{len(uploaded_results)} files uploaded successfully to cloud storage",
        "urls": uploaded_results,
        "cover_urls": cover_urls
    }

# Social Features - Posts

def validate_attached_workout(workout: dict) -> tuple[bool, str]:
    """
    Validate that an attached_workout payload has all required fields.
    Returns (is_valid, error_message)
    """
    if not workout:
        return False, "attached_workout is required"
    
    # Required top-level fields
    if not workout.get("title"):
        return False, "attached_workout.title is required"
    if not workout.get("moodCategory"):
        return False, "attached_workout.moodCategory is required"
    
    exercises = workout.get("exercises", [])
    if not exercises or len(exercises) == 0:
        return False, "attached_workout.exercises must have at least one exercise"
    
    for i, ex in enumerate(exercises):
        if not ex.get("exerciseId"):
            return False, f"exercises[{i}].exerciseId is required"
        if not ex.get("name"):
            return False, f"exercises[{i}].name is required"
        if not ex.get("imageUrl"):
            return False, f"exercises[{i}].imageUrl is required - no generic images allowed"
        if not ex.get("battlePlan"):
            return False, f"exercises[{i}].battlePlan is required - workout guidance is mandatory"
    
    return True, ""

def normalize_snapshot_to_attached_workout(snapshot: dict) -> dict:
    """
    Convert a workout snapshot from the database into the canonical attached_workout format.
    """
    workouts = snapshot.get("workouts", [])
    
    exercises = []
    for i, w in enumerate(workouts):
        exercise = {
            "exerciseId": f"snapshot-{snapshot.get('_id', 'unknown')}-{i}",
            "name": w.get("workoutTitle") or w.get("workoutName") or "Workout",
            "imageUrl": w.get("imageUrl") or "",
            "duration": w.get("duration") or "10 min",
            "equipment": w.get("equipment") or "Bodyweight",
            "difficulty": w.get("difficulty") or "intermediate",
            "description": w.get("description") or "",
            "battlePlan": w.get("battlePlan") or "",
            "intensityReason": w.get("intensityReason") or "",
            "moodTips": w.get("moodTips") or [],
        }
        exercises.append(exercise)
    
    # Use first workout's title or mood category as overall title
    first_workout = workouts[0] if workouts else {}
    title = first_workout.get("workoutTitle") or first_workout.get("workoutName") or snapshot.get("mood_category") or "Workout"
    
    attached_workout = {
        "version": 1,
        "title": title,
        "totalDuration": snapshot.get("total_duration") or 0,
        "moodCategory": snapshot.get("mood_category") or "Workout",
        "completedAt": snapshot.get("created_at").strftime("%b %d, %Y") if hasattr(snapshot.get("created_at"), "strftime") else str(snapshot.get("created_at", "")),
        "exercises": exercises,
    }
    
    return attached_workout

@api_router.post("/posts")
async def create_post(post_data: PostCreate, current_user_id: str = Depends(get_current_user)):
    """Create a new social media post with content filtering and workout hydration"""
    
    # Check if user has accepted terms
    await check_terms_accepted(current_user_id)
    
    # Check content for objectionable material (pre-submission filtering)
    content_check = check_content(
        post_data.caption, 
        strict=True, 
        user_id=current_user_id, 
        content_type="post"
    )
    if not content_check["is_clean"]:
        # Log rejected attempt to database for moderation review
        await db.moderation_logs.insert_one({
            "user_id": current_user_id,
            "content_type": "post",
            "action": "rejected",
            "reason": "content_filter",
            "category": content_check.get("category"),
            "flagged_words": content_check.get("flagged_words", []),
            "flagged_phrases": content_check.get("flagged_phrases", []),
            "text_preview": post_data.caption[:200] if post_data.caption else "",
            "created_at": datetime.now(timezone.utc)
        })
        raise HTTPException(
            status_code=400, 
            detail="This content violates our community guidelines."
        )
    
    # =========================================================================
    # ATTACHED WORKOUT HYDRATION - Server-side hydration from snapshot
    # This is the ONLY way to get a valid attached_workout on a post
    # =========================================================================
    attached_workout = None
    
    # DEBUG: Log incoming request data
    logger.info(f"🔍 POST_CREATE_DEBUG: workout_snapshot_id={post_data.workout_snapshot_id}, has_attached_workout={post_data.attached_workout is not None}, has_workout_data={post_data.workout_data is not None}")
    
    # Priority 1: If workout_snapshot_id is provided, hydrate from snapshot
    if post_data.workout_snapshot_id:
        logger.info(f"🏋️ Hydrating attached_workout from snapshot: {post_data.workout_snapshot_id}")
        try:
            snapshot = await db.workout_snapshots.find_one({"_id": ObjectId(post_data.workout_snapshot_id)})
            if not snapshot:
                logger.error(f"❌ Snapshot not found: {post_data.workout_snapshot_id}")
                raise HTTPException(
                    status_code=400,
                    detail={"error": "snapshot_not_found", "workout_snapshot_id": post_data.workout_snapshot_id}
                )
            
            # Normalize snapshot to attached_workout format
            attached_workout = normalize_snapshot_to_attached_workout(snapshot)
            logger.info(f"✅ Normalized snapshot to attached_workout: {attached_workout.get('title')}")
            
            # Validate the hydrated workout
            is_valid, error = validate_attached_workout(attached_workout)
            if not is_valid:
                logger.error(f"❌ Hydrated workout validation failed: {error}")
                raise HTTPException(
                    status_code=400,
                    detail={"error": "invalid_attached_workout", "detail": error}
                )
            
            logger.info(f"✅ POST_CREATE_DEBUG: hydrated=true, exCount={len(attached_workout.get('exercises', []))}")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"❌ Error hydrating workout from snapshot: {e}")
            raise HTTPException(
                status_code=400,
                detail={"error": "hydration_failed", "detail": str(e)}
            )
    
    # Priority 2: If attached_workout is provided directly, validate it
    elif post_data.attached_workout:
        logger.info("🏋️ Using directly provided attached_workout")
        attached_workout = post_data.attached_workout.dict()
        
        is_valid, error = validate_attached_workout(attached_workout)
        if not is_valid:
            logger.error(f"❌ Provided attached_workout validation failed: {error}")
            raise HTTPException(
                status_code=400,
                detail={"error": "invalid_attached_workout", "detail": error}
            )
        
        logger.info(f"✅ Direct attached_workout validated with {len(attached_workout.get('exercises', []))} exercises")
    else:
        logger.info("📝 No workout_snapshot_id or attached_workout provided - creating post without workout")
    
    # Normalize cover_urls from dict {"0": url} to list [url]
    normalized_cover_urls = None
    if post_data.cover_urls:
        if isinstance(post_data.cover_urls, dict):
            sorted_keys = sorted(post_data.cover_urls.keys(), key=lambda k: int(k) if k.isdigit() else 0)
            normalized_cover_urls = [post_data.cover_urls[k] for k in sorted_keys if post_data.cover_urls[k]]
        elif isinstance(post_data.cover_urls, list):
            normalized_cover_urls = post_data.cover_urls
    
    # Build the post document
    post_doc = {
        "caption": post_data.caption,
        "media_urls": post_data.media_urls,
        "hashtags": post_data.hashtags,
        "cover_urls": normalized_cover_urls,
        "author_id": ObjectId(current_user_id),
        "likes_count": 0,
        "comments_count": 0,
        "created_at": datetime.now(timezone.utc),
        # Legacy field - kept for backwards compatibility with old posts
        "workout_data": post_data.workout_data.dict() if post_data.workout_data else None,
        # NEW: Canonical workout payload for "Try This Workout"
        "attached_workout": attached_workout,
    }
    
    result = await db.posts.insert_one(post_doc)
    
    # B2: Assertion — every post must have author_id
    if not post_doc.get("author_id"):
        logger.error(f"🚨 POST CREATED WITHOUT author_id! post_id={result.inserted_id}")
    
    logger.info(f"✅ Post created: {result.inserted_id}, has_attached_workout: {attached_workout is not None}")
    return {"message": "Post created successfully", "id": str(result.inserted_id)}

# ============================================================================
# LIVE FEED — real-time activity feed of all users' workout activity
# ============================================================================

# Map raw mood_category strings (which are inconsistent across the app) to
# one of 6 UI mood "buckets" used by the Live tab.
_LIVE_MOOD_RULES: List[tuple[tuple[str, ...], str, str]] = [
    # (keywords, bucket_id, display_label)
    (("explosion", "explosive", "power lifting", "plyometric", "explosivenes"), "explosive", "Build explosion"),
    (("calisthenic", "bodyweight", "pull", "dip"), "calisthenics", "Calisthenics"),
    (("outside", "outdoor", "hill"), "outdoor", "Outdoor"),
    (("lazy", "gentle"), "lazy", "I'm feeling lazy"),
    (("muscle gainer", "back", "chest", "biceps", "triceps", "shoulder", "leg",
      "compound", "weight", "strength"), "muscle", "Muscle gainer"),
    (("sweat", "burn", "hiit", "cardio"), "sweat", "Sweat / burn fat"),
]

_LIVE_BUCKET_LABELS = {
    "sweat": "Sweat / burn fat",
    "muscle": "Muscle gainer",
    "explosive": "Build explosion",
    "lazy": "I'm feeling lazy",
    "calisthenics": "Calisthenics",
    "outdoor": "Outdoor",
}

_MILESTONE_THRESHOLDS = [5, 10, 25, 50, 100, 250, 500, 1000]


def _classify_live_mood(mood: Optional[str]) -> Optional[tuple[str, str]]:
    """Classify a free-form mood_category string into one of 6 buckets.
    Returns (bucket_id, display_label) or None if it doesn't match any bucket."""
    if not mood:
        return None
    m = mood.lower()
    for keywords, bucket, label in _LIVE_MOOD_RULES:
        if any(k in m for k in keywords):
            return bucket, label
    return None


def _format_relative_time(ts: datetime) -> str:
    """Convert an ISO timestamp to a relative human-readable string."""
    now = datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    delta = now - ts
    secs = int(delta.total_seconds())
    if secs < 0:
        return "just now"
    if secs < 60:
        return "just now"
    if secs < 3600:
        m = secs // 60
        return f"{m} min ago" if m > 1 else "1 min ago"
    if secs < 86400:
        h = secs // 3600
        return f"{h} hr ago" if h > 1 else "1 hr ago"
    days = secs // 86400
    if days == 1:
        return "yesterday"
    if days < 7:
        return f"{days} days ago"
    if days < 14:
        return "last week"
    return "earlier"


@api_router.get("/feed/live")
async def get_live_feed(
    limit: int = 30,
    current_user_id: str = Depends(get_current_user),
):
    """Live activity feed — recent workout starts, completions, and milestones
    from ALL users (not friend-graph). Used by the Live tab."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    live_window_start = now - timedelta(minutes=20)  # "LIVE NOW" = started in last 20 min

    # ---------- STAT HEADER ----------
    sessions_today = await db.user_events.count_documents({
        "event_type": {"$in": ["workout_completed", "workout_session_completed"]},
        "timestamp": {"$gte": today_start},
    })

    # Most common mood today (by completion bucket)
    mood_pipeline = [
        {"$match": {
            "event_type": {"$in": ["workout_completed", "workout_session_completed"]},
            "timestamp": {"$gte": today_start},
        }},
        {"$group": {"_id": "$metadata.mood_category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 30},
    ]
    bucket_counts: Dict[str, int] = {}
    async for row in db.user_events.aggregate(mood_pipeline):
        cls = _classify_live_mood(row.get("_id"))
        if cls:
            bucket_counts[cls[0]] = bucket_counts.get(cls[0], 0) + row["count"]
    top_bucket = max(bucket_counts.items(), key=lambda x: x[1])[0] if bucket_counts else None
    most_common_mood = _LIVE_BUCKET_LABELS.get(top_bucket) if top_bucket else None

    # ---------- ENTRIES ----------
    # Primary window: 48 hours (feed should feel "live").
    # Soft fallback to 7 days only if we still don't have ~15 entries —
    # those will naturally read as older ("yesterday", "3 days ago", "last week")
    # via _format_relative_time.
    lookback_options = [timedelta(hours=6), timedelta(hours=24),
                        timedelta(hours=48), timedelta(days=7)]

    raw_entries: List[dict] = []
    user_cache: Dict[str, dict] = {}

    async def _get_user(uid: str) -> Optional[dict]:
        if uid in user_cache:
            return user_cache[uid]
        try:
            u = await db.users.find_one({"_id": ObjectId(uid)}) if len(uid) == 24 else None
        except Exception:
            u = None
        user_cache[uid] = u
        return u

    seen_user_action: set = set()  # dedupe live_now per user
    for window in lookback_options:
        cutoff = now - window
        # Pull recent workout events
        cursor = db.user_events.find({
            "event_type": {"$in": ["workout_started", "workout_completed", "workout_session_completed"]},
            "timestamp": {"$gte": cutoff},
            "user_id": {"$ne": None},
        }).sort("timestamp", -1).limit(limit * 4)

        events = await cursor.to_list(length=limit * 4)
        raw_entries = []
        seen_user_action = set()
        for ev in events:
            mood = (ev.get("metadata") or {}).get("mood_category")
            classified = _classify_live_mood(mood)
            if not classified:
                continue
            bucket_id, label = classified
            uid = str(ev.get("user_id") or "")
            if not uid:
                continue
            user_doc = await _get_user(uid)
            if not user_doc:
                continue

            evtype = ev["event_type"]
            ts = ev["timestamp"]
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)

            if evtype == "workout_started":
                # Only treat as LIVE NOW if recent AND not already recorded for that user
                if ts < live_window_start:
                    continue
                key = (uid, "live", bucket_id)
                if key in seen_user_action:
                    continue
                seen_user_action.add(key)
                entry_type = "live_now"
                workout_name = (ev.get("metadata") or {}).get("workout_name")
                duration_minutes = None
            else:
                entry_type = "completion"
                meta = ev.get("metadata") or {}
                workout_name = meta.get("workout_name")
                duration_minutes = meta.get("duration_minutes")
                if duration_minutes is None and meta.get("duration_seconds"):
                    try:
                        duration_minutes = max(1, int(round(meta["duration_seconds"] / 60)))
                    except Exception:
                        duration_minutes = None
                # Dedupe by (user, completion event id) — workout_completed and
                # workout_session_completed often fire as a pair within seconds
                key = (uid, "complete", round(ts.timestamp() / 60))
                if key in seen_user_action:
                    continue
                seen_user_action.add(key)

            raw_entries.append({
                "id": str(ev["_id"]),
                "type": entry_type,
                "user": {
                    "id": uid,
                    "username": user_doc.get("username") or "",
                    "name": user_doc.get("name") or user_doc.get("username") or "Someone",
                    "avatar": user_doc.get("avatar") or "",
                },
                "mood_bucket": bucket_id,
                "mood_label": label,
                "workout_name": workout_name,
                "duration_minutes": duration_minutes,
                "milestone_count": None,
                "timestamp": ts.isoformat(),
                "ago_text": _format_relative_time(ts),
            })

        # Sort by timestamp desc and break if we have enough
        raw_entries.sort(key=lambda e: e["timestamp"], reverse=True)
        if len(raw_entries) >= 15:
            break

    # Inject milestone entries (always, regardless of lookback iteration we landed on).
    # Users who recently crossed a milestone threshold get a card pinned near the top
    # of their most recent activity.
    ms_pipeline = [
        {"$match": {"event_type": "workout_completed",
                    "timestamp": {"$gte": now - timedelta(days=14)}}},
        {"$group": {"_id": "$user_id", "last_ts": {"$max": "$timestamp"}}},
    ]
    ms_rows = await db.user_events.aggregate(ms_pipeline).to_list(200)
    for row in ms_rows:
        uid = str(row["_id"]) if row["_id"] else ""
        if not uid:
            continue
        user_doc = await _get_user(uid)
        if not user_doc:
            continue
        wcount = user_doc.get("workouts_count", 0) or 0
        if wcount in _MILESTONE_THRESHOLDS:
            last_ts = row["last_ts"]
            if last_ts.tzinfo is None:
                last_ts = last_ts.replace(tzinfo=timezone.utc)
            raw_entries.append({
                "id": f"milestone-{uid}-{wcount}",
                "type": "milestone",
                "user": {
                    "id": uid,
                    "username": user_doc.get("username") or "",
                    "name": user_doc.get("name") or user_doc.get("username") or "Someone",
                    "avatar": user_doc.get("avatar") or "",
                },
                "mood_bucket": "muscle",
                "mood_label": _LIVE_BUCKET_LABELS["muscle"],
                "workout_name": None,
                "duration_minutes": None,
                "milestone_count": wcount,
                "timestamp": last_ts.isoformat(),
                "ago_text": _format_relative_time(last_ts),
            })

    raw_entries.sort(key=lambda e: e["timestamp"], reverse=True)

    entries = raw_entries[:limit]

    return {
        "stats": {
            "sessions_today": sessions_today,
            "most_common_mood": most_common_mood,
        },
        "entries": entries,
    }




@api_router.get("/posts/following")
async def get_following_posts(
    current_user_id: str = Depends(get_current_user),
    limit: int = 20,
    skip: int = 0
):
    """Get posts from users that the current user follows"""
    try:
        user_object_id = ObjectId(current_user_id)
        
        # Get list of users current user is following
        following = await db.follows.find({"follower_id": user_object_id}).to_list(length=None)
        following_ids = [f["following_id"] for f in following]
        
        if not following_ids:
            # If not following anyone, return empty list
            return []
        
        # Get posts from followed users with author and workout details
        pipeline = [
            {"$match": {"author_id": {"$in": following_ids}}},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "users",
                    "localField": "author_id",
                    "foreignField": "_id",
                    "as": "author"
                }
            },
            {"$unwind": "$author"},
            {
                "$lookup": {
                    "from": "workouts",
                    "localField": "workout_id",
                    "foreignField": "_id",
                    "as": "workout"
                }
            },
            {
                "$lookup": {
                    "from": "post_likes",
                    "let": {"post_id": "$_id", "user_id": user_object_id},
                    "pipeline": [
                        {"$match": {"$expr": {"$and": [
                            {"$eq": ["$post_id", "$$post_id"]},
                            {"$eq": ["$user_id", "$$user_id"]}
                        ]}}}
                    ],
                    "as": "user_like"
                }
            }
        ]
        
        posts = await db.posts.aggregate(pipeline).to_list(length=limit)
        
        result = []
        for post in posts:
            # Convert ObjectIds to strings
            author_data = UserResponse(
                id=str(post["author"]["_id"]),
                username=post["author"]["username"],
                email=post["author"]["email"],
                name=post["author"].get("name"),
                bio=post["author"].get("bio", ""),
                avatar=post["author"].get("avatar", ""),
                followers_count=post["author"].get("followers_count", 0),
                following_count=post["author"].get("following_count", 0),
                workouts_count=post["author"].get("workouts_count", 0),
                current_streak=post["author"].get("current_streak", 0),
                created_at=post["author"]["created_at"]
            )
            
            workout_data = None
            if post.get("workout") and len(post["workout"]) > 0:
                workout = post["workout"][0]
                workout_data = WorkoutResponse(
                    id=str(workout["_id"]),
                    title=workout["title"],
                    mood_category=workout["mood_category"],
                    exercises=workout["exercises"],
                    duration=workout["duration"],
                    difficulty=workout["difficulty"],
                    equipment=workout.get("equipment", []),
                    calories_estimate=workout.get("calories_estimate"),
                    created_at=workout["created_at"]
                )
            
            # Get embedded workout card data for replication
            embedded_workout_data = None
            if post.get("workout_data"):
                try:
                    raw_data = post["workout_data"]
                    embedded_workout_data = WorkoutCardData(
                        workouts=[WorkoutExerciseData(**w) for w in raw_data.get("workouts", [])],
                        totalDuration=raw_data.get("totalDuration", 0),
                        completedAt=raw_data.get("completedAt", ""),
                        moodCategory=raw_data.get("moodCategory"),
                        workout_snapshot_id=raw_data.get("workout_snapshot_id")
                    )
                except Exception as e:
                    print(f"Error parsing workout_data: {e}")
            
            media_fields = derive_post_media_fields(post)
            result.append(PostResponse(
                id=str(post["_id"]),
                author=author_data,
                workout=workout_data,
                workout_data=embedded_workout_data,
                caption=post.get("caption", ""),
                media_urls=post.get("media_urls", []),
                hashtags=post.get("hashtags", []),
                cover_urls=post.get("cover_urls"),
                thumbnail_url=media_fields["thumbnail_url"],
                media_type=media_fields["media_type"],
                likes_count=post.get("likes_count", 0),
                comments_count=post.get("comments_count", 0),
                is_liked=len(post.get("user_like", [])) > 0,
                created_at=post["created_at"]
            ))
        
        return result
    except Exception as e:
        logger.error(f"Error fetching following posts: {str(e)}")
        return []

@api_router.get("/posts/public")
async def get_public_posts(limit: int = 20, skip: int = 0):
    """Get public feed posts without authentication (for guest users)"""
    # Get posts with author and workout details
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "author_id",
                "foreignField": "_id",
                "as": "author"
            }
        },
        {"$unwind": "$author"}
    ]
    
    posts = await db.posts.aggregate(pipeline).to_list(length=limit)
    
    result = []
    for post in posts:
        # Convert ObjectIds to strings
        author_data = UserResponse(
            id=str(post["author"]["_id"]),
            username=post["author"]["username"],
            email=post["author"]["email"],
            name=post["author"].get("name"),
            bio=post["author"].get("bio", ""),
            avatar=post["author"].get("avatar", ""),
            followers_count=post["author"].get("followers_count", 0),
            following_count=post["author"].get("following_count", 0),
            workouts_count=post["author"].get("workouts_count", 0),
            current_streak=post["author"].get("current_streak", 0),
            created_at=post["author"]["created_at"]
        )
        
        # Get embedded workout card data for replication (available even for public posts)
        embedded_workout_data = None
        if post.get("workout_data"):
            try:
                raw_data = post["workout_data"]
                embedded_workout_data = WorkoutCardData(
                    workouts=[WorkoutExerciseData(**w) for w in raw_data.get("workouts", [])],
                    totalDuration=raw_data.get("totalDuration", 0),
                    completedAt=raw_data.get("completedAt", ""),
                    moodCategory=raw_data.get("moodCategory"),
                    workout_snapshot_id=raw_data.get("workout_snapshot_id")
                )
            except Exception as e:
                print(f"Error parsing workout_data: {e}")
        
        media_fields = derive_post_media_fields(post)
        result.append(PostResponse(
            id=str(post["_id"]),
            author=author_data,
            workout=None,  # Skip workout details for public feed
            workout_data=embedded_workout_data,
            caption=post.get("caption", ""),
            media_urls=post.get("media_urls", []),
            hashtags=post.get("hashtags", []),
            cover_urls=post.get("cover_urls"),
            thumbnail_url=media_fields["thumbnail_url"],
            media_type=media_fields["media_type"],
            likes_count=post.get("likes_count", 0),
            comments_count=post.get("comments_count", 0),
            is_liked=False,  # Guests can't like
            is_saved=False,  # Guests can't save
            created_at=post["created_at"]
        ))
    
    return result

@api_router.get("/posts")
async def get_posts(current_user_id: str = Depends(get_current_user), limit: int = 20, skip: int = 0):
    """Get feed posts with user and workout information"""
    # Get posts with author and workout details
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "users",
                "localField": "author_id",
                "foreignField": "_id",
                "as": "author"
            }
        },
        {"$unwind": "$author"},
        {
            "$lookup": {
                "from": "workouts", 
                "localField": "workout_id",
                "foreignField": "_id", 
                "as": "workout"
            }
        },
        {
            "$lookup": {
                "from": "post_likes",
                "let": {"post_id": "$_id", "user_id_str": current_user_id},
                "pipeline": [
                    {"$match": {"$expr": {"$and": [
                        {"$eq": ["$post_id", "$$post_id"]},
                        {"$eq": [{"$toString": "$user_id"}, "$$user_id_str"]}
                    ]}}}
                ],
                "as": "user_like"
            }
        },
        {
            "$lookup": {
                "from": "saved_posts",
                "let": {"post_id": "$_id", "user_id_str": current_user_id},
                "pipeline": [
                    {"$match": {"$expr": {"$and": [
                        {"$eq": ["$post_id", "$$post_id"]},
                        {"$eq": [{"$toString": "$user_id"}, "$$user_id_str"]}
                    ]}}}
                ],
                "as": "user_saved"
            }
        },
        {
            "$lookup": {
                "from": "comments",
                "let": {"post_id": {"$toString": "$_id"}},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$post_id", "$$post_id"]}}},
                    {"$sort": {"created_at": 1}},
                    {"$limit": 1},
                    {
                        "$lookup": {
                            "from": "users",
                            "let": {"author_id": {"$toObjectId": "$author_id"}},
                            "pipeline": [
                                {"$match": {"$expr": {"$eq": ["$_id", "$$author_id"]}}}
                            ],
                            "as": "comment_author"
                        }
                    },
                    {"$unwind": {"path": "$comment_author", "preserveNullAndEmptyArrays": True}}
                ],
                "as": "first_comment"
            }
        }
    ]
    
    posts = await db.posts.aggregate(pipeline).to_list(length=limit)
    
    result = []
    for post in posts:
        # Convert ObjectIds to strings
        author_data = UserResponse(
            id=str(post["author"]["_id"]),
            username=post["author"]["username"],
            email=post["author"]["email"],
            name=post["author"].get("name"),
            bio=post["author"].get("bio", ""),
            avatar=post["author"].get("avatar", ""),
            followers_count=post["author"].get("followers_count", 0),
            following_count=post["author"].get("following_count", 0),
            workouts_count=post["author"].get("workouts_count", 0),
            current_streak=post["author"].get("current_streak", 0),
            created_at=post["author"]["created_at"]
        )
        
        workout_data = None
        if post.get("workout") and len(post["workout"]) > 0:
            workout = post["workout"][0]
            workout_data = WorkoutResponse(
                id=str(workout["_id"]),
                title=workout["title"],
                mood_category=workout["mood_category"],
                exercises=workout["exercises"],
                duration=workout["duration"],
                difficulty=workout["difficulty"],
                equipment=workout.get("equipment", []),
                calories_estimate=workout.get("calories_estimate"),
                created_at=workout["created_at"]
            )
        
        # Get first comment data
        first_comment_data = None
        if post.get("first_comment") and len(post["first_comment"]) > 0:
            fc = post["first_comment"][0]
            comment_author = fc.get("comment_author", {})
            first_comment_data = {
                "id": str(fc.get("_id", "")),
                "text": fc.get("text", ""),
                "author": {
                    "id": str(comment_author.get("_id", "")),
                    "username": comment_author.get("username", ""),
                    "avatar": comment_author.get("avatar")
                },
                "created_at": fc.get("created_at").isoformat() if fc.get("created_at") else None
            }
        
        # Get embedded workout card data for replication
        embedded_workout_data = None
        if post.get("workout_data"):
            try:
                raw_data = post["workout_data"]
                embedded_workout_data = {
                    "workouts": raw_data.get("workouts", []),
                    "totalDuration": raw_data.get("totalDuration", 0),
                    "completedAt": raw_data.get("completedAt", ""),
                    "moodCategory": raw_data.get("moodCategory"),
                    "workout_snapshot_id": raw_data.get("workout_snapshot_id")
                }
            except Exception as e:
                print(f"Error parsing workout_data: {e}")
        
        # Get attached_workout (canonical workout payload for "Try This Workout")
        attached_workout_data = post.get("attached_workout")
        
        post_data = {
            "id": str(post["_id"]),
            "author": author_data.dict(),
            "workout": workout_data.dict() if workout_data else None,
            "workout_data": embedded_workout_data,
            "attached_workout": attached_workout_data,  # NEW: Canonical workout for Try This Workout
            "caption": post["caption"],
            "media_urls": post.get("media_urls", []),
            "hashtags": post.get("hashtags", []),
            "cover_urls": post.get("cover_urls"),
            "likes_count": post.get("likes_count", 0),
            "comments_count": post.get("comments_count", 0),
            "is_liked": len(post.get("user_like", [])) > 0,
            "is_saved": len(post.get("user_saved", [])) > 0,
            "created_at": post["created_at"].isoformat() if hasattr(post["created_at"], 'isoformat') else post["created_at"],
            "first_comment": first_comment_data
        }
        result.append(post_data)
    
    return result

@api_router.get("/posts/{post_id}")
async def get_single_post(post_id: str, current_user_id: str = Depends(get_current_user)):
    """Get a single post by ID"""
    try:
        post_object_id = ObjectId(post_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid post ID")
    
    pipeline = [
        {"$match": {"_id": post_object_id}},
        {
            "$lookup": {
                "from": "users",
                "localField": "author_id",
                "foreignField": "_id",
                "as": "author"
            }
        },
        {"$unwind": "$author"},
        {
            "$lookup": {
                "from": "post_likes",
                "let": {"post_id": "$_id", "user_id": ObjectId(current_user_id)},
                "pipeline": [
                    {"$match": {"$expr": {"$and": [
                        {"$eq": ["$post_id", "$$post_id"]},
                        {"$eq": ["$user_id", "$$user_id"]}
                    ]}}}
                ],
                "as": "user_like"
            }
        },
        {
            "$lookup": {
                "from": "saved_posts",
                "let": {"post_id": "$_id", "user_id": ObjectId(current_user_id)},
                "pipeline": [
                    {"$match": {"$expr": {"$and": [
                        {"$eq": ["$post_id", "$$post_id"]},
                        {"$eq": ["$user_id", "$$user_id"]}
                    ]}}}
                ],
                "as": "user_save"
            }
        },
        {
            "$project": {
                "_id": 0,
                "id": {"$toString": "$_id"},
                "author": {
                    "id": {"$toString": "$author._id"},
                    "username": "$author.username",
                    "name": {"$ifNull": ["$author.name", "$author.username"]},
                    "avatar": "$author.avatar"
                },
                "caption": 1,
                "media_urls": 1,
                "cover_urls": 1,
                "likes_count": {"$ifNull": ["$likes_count", 0]},
                "comments_count": {"$ifNull": ["$comments_count", 0]},
                "is_liked": {"$gt": [{"$size": "$user_like"}, 0]},
                "is_saved": {"$gt": [{"$size": "$user_save"}, 0]},
                "workout_data": 1,
                "attached_workout": 1,  # NEW: Canonical workout for Try This Workout
                "created_at": {"$toString": "$created_at"}
            }
        }
    ]
    
    result = await db.posts.aggregate(pipeline).to_list(1)
    
    if not result:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return result[0]

# Social Features - Likes

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user_id: str = Depends(get_current_user)):
    """Like or unlike a post"""
    # Check if user has accepted terms
    await check_terms_accepted(current_user_id)
    
    try:
        post_object_id = ObjectId(post_id)
        user_object_id = ObjectId(current_user_id)
        
        # Check if already liked
        existing_like = await db.post_likes.find_one({
            "post_id": post_object_id,
            "user_id": user_object_id
        })
        
        if existing_like:
            # Unlike
            await db.post_likes.delete_one({"_id": existing_like["_id"]})
            await db.posts.update_one(
                {"_id": post_object_id},
                {"$inc": {"likes_count": -1}}
            )
            # Get updated likes count
            updated_post = await db.posts.find_one({"_id": post_object_id})
            likes_count = updated_post.get("likes_count", 0) if updated_post else 0
            return {"message": "Post unliked", "liked": False, "likes_count": likes_count}
        else:
            # Like
            await db.post_likes.insert_one({
                "post_id": post_object_id,
                "user_id": user_object_id,
                "created_at": datetime.now(timezone.utc)
            })
            await db.posts.update_one(
                {"_id": post_object_id},
                {"$inc": {"likes_count": 1}}
            )
            # Get updated likes count and post author
            updated_post = await db.posts.find_one({"_id": post_object_id})
            likes_count = updated_post.get("likes_count", 0) if updated_post else 0
            
            # ── TRACE-LIKE (debug) ──
            if updated_post:
                _media = (updated_post.get("media_urls") or [""])[0].lower()
                _mtype = "video" if any(x in _media for x in (".mp4", ".mov", ".m3u8", "/video")) else ("image" if _media else "none")
                _akeys = [k for k in ("author_id", "user_id", "creator_id", "owner_id") if updated_post.get(k)]
                _resolved = resolve_post_author_id(updated_post)
                logger.debug(f"TRACE-LIKE: post_id={post_id} found=True media_type={_mtype} keys_present={_akeys} resolved_author={_resolved}")
            else:
                logger.error(f"TRACE-LIKE: POST_NOT_FOUND post_id={post_id}")
            
            # Trigger like notification
            if updated_post:
                try:
                    post_author_id = resolve_post_author_id(updated_post)
                    if not post_author_id:
                        logger.warning(f"TRACE-LIKE: SKIP reason=missing_author post_id={post_id}")
                    elif post_author_id == current_user_id:
                        logger.info(f"TRACE-LIKE: SKIP reason=self_like post_id={post_id}")
                    else:
                        notification_service = get_notification_service(db)
                        result = await notification_service.trigger_like_notification(
                            liker_id=current_user_id,
                            post_id=post_id,
                            post_author_id=post_author_id
                        )
                        logger.info(f"TRACE-LIKE: notification_result={result} post_id={post_id}")
                except Exception as e:
                    logger.error(f"TRACE-LIKE: EXCEPTION post_id={post_id} error={e}")
                    import traceback
                    logger.error(traceback.format_exc())
            
            return {"message": "Post liked", "liked": True, "likes_count": likes_count}
    
    except:
        raise HTTPException(status_code=404, detail="Post not found")

# Social Features - Comments

@api_router.post("/comments")
async def create_comment(comment_data: CommentCreate, current_user_id: str = Depends(get_current_user)):
    """Create a comment on a post with content filtering, reply threads, and @mentions"""
    # Check if user has accepted terms
    await check_terms_accepted(current_user_id)
    
    try:
        # Check content for objectionable material (pre-submission filtering)
        content_check = check_content(
            comment_data.text, 
            strict=True,
            user_id=current_user_id,
            content_type="comment"
        )
        if not content_check["is_clean"]:
            # Log rejected attempt to database for moderation review
            await db.moderation_logs.insert_one({
                "user_id": current_user_id,
                "content_type": "comment",
                "action": "rejected",
                "reason": "content_filter",
                "category": content_check.get("category"),
                "flagged_words": content_check.get("flagged_words", []),
                "flagged_phrases": content_check.get("flagged_phrases", []),
                "text_preview": comment_data.text[:200] if comment_data.text else "",
                "post_id": comment_data.post_id,
                "created_at": datetime.now(timezone.utc)
            })
            raise HTTPException(
                status_code=400, 
                detail="This content violates our community guidelines."
            )
        
        # Build comment document
        comment_doc = {
            "post_id": comment_data.post_id,
            "text": comment_data.text,
            "author_id": current_user_id,
            "created_at": datetime.now(timezone.utc),
            "parent_comment_id": comment_data.parent_comment_id,  # None for top-level comments
            "mentioned_user_ids": comment_data.mentioned_user_ids or [],
            "replies_count": 0,
            "likes_count": 0
        }
        
        result = await db.comments.insert_one(comment_doc)
        comment_id = str(result.inserted_id)
        
        # If this is a reply, increment reply counts up the chain to the root comment
        if comment_data.parent_comment_id:
            # Increment the direct parent's reply count
            await db.comments.update_one(
                {"_id": ObjectId(comment_data.parent_comment_id)},
                {"$inc": {"replies_count": 1}}
            )
            
            # Also increment all ancestor comments' total_thread_replies count
            # This allows the root comment to show total replies in the thread
            current_parent_id = comment_data.parent_comment_id
            visited = set()  # Prevent infinite loops
            while current_parent_id and current_parent_id not in visited:
                visited.add(current_parent_id)
                parent_comment = await db.comments.find_one({"_id": ObjectId(current_parent_id)})
                if parent_comment and parent_comment.get("parent_comment_id"):
                    # This parent has a grandparent - increment grandparent's total_thread_replies
                    grandparent_id = parent_comment["parent_comment_id"]
                    await db.comments.update_one(
                        {"_id": ObjectId(grandparent_id)},
                        {"$inc": {"total_thread_replies": 1}}
                    )
                    current_parent_id = grandparent_id
                else:
                    # Reached the root comment
                    break
        
        # Update post comment count
        await db.posts.update_one(
            {"_id": ObjectId(comment_data.post_id)},
            {"$inc": {"comments_count": 1}}
        )
        
        # ── TRACE-COMMENT (debug) ──
        logger.debug(f"TRACE-COMMENT: post_id={comment_data.post_id} actor={current_user_id}")
        try:
            _cpost = await db.posts.find_one({"_id": ObjectId(comment_data.post_id)})
            if _cpost:
                _cmedia = (_cpost.get("media_urls") or [""])[0].lower()
                _cmtype = "video" if any(x in _cmedia for x in (".mp4", ".mov", ".m3u8", "/video")) else ("image" if _cmedia else "none")
                _cresolved = resolve_post_author_id(_cpost)
                logger.info(f"TRACE-COMMENT: post_found=True media_type={_cmtype} resolved_author={_cresolved}")
            else:
                logger.error(f"TRACE-COMMENT: POST_NOT_FOUND post_id={comment_data.post_id}")
            
            notification_service = get_notification_service(db)
            result = await notification_service.trigger_comment_notification(
                commenter_id=current_user_id,
                post_id=comment_data.post_id,
                comment_text=comment_data.text
            )
            logger.info(f"TRACE-COMMENT: notification_result={result} post_id={comment_data.post_id}")
        except Exception as e:
            logger.error(f"TRACE-COMMENT: EXCEPTION post_id={comment_data.post_id} error={e}")
            import traceback
            logger.error(traceback.format_exc())
        
        # Trigger mention notifications to mentioned users
        if comment_data.mentioned_user_ids:
            try:
                logger.info(f"🔔 DEBUG Mention notifications: mentioner={current_user_id[:8]}..., mentioned={comment_data.mentioned_user_ids}")
                notification_service = get_notification_service(db)
                for mentioned_user_id in comment_data.mentioned_user_ids:
                    # Don't notify yourself
                    if mentioned_user_id != current_user_id:
                        result = await notification_service.trigger_mention_notification(
                            mentioner_id=current_user_id,
                            mentioned_user_id=mentioned_user_id,
                            post_id=comment_data.post_id,
                            comment_text=comment_data.text
                        )
                        logger.info(f"🔔 DEBUG Mention notification result for {mentioned_user_id[:8]}...: {result}")
            except Exception as e:
                logger.error(f"Failed to send mention notifications: {e}")
                import traceback
                logger.error(traceback.format_exc())
        
        # If this is a reply, notify the parent comment author
        if comment_data.parent_comment_id:
            try:
                parent_comment = await db.comments.find_one({"_id": ObjectId(comment_data.parent_comment_id)})
                if parent_comment and str(parent_comment.get("author_id")) != current_user_id:
                    notification_service = get_notification_service(db)
                    await notification_service.trigger_reply_notification(
                        replier_id=current_user_id,
                        parent_comment_author_id=str(parent_comment["author_id"]),
                        post_id=comment_data.post_id,
                        reply_text=comment_data.text
                    )
            except Exception as e:
                logger.error(f"Failed to send reply notification: {e}")
        
        return {"message": "Comment created successfully", "id": comment_id}
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=404, detail="Post not found")

@api_router.get("/posts/{post_id}/comments")
async def get_post_comments(post_id: str, limit: int = 50, parent_id: Optional[str] = None):
    """Get comments for a post, optionally filtered by parent (for replies)"""
    try:
        # Build match condition
        match_condition = {"post_id": post_id}
        if parent_id:
            # Get replies to a specific comment
            match_condition["parent_comment_id"] = parent_id
        else:
            # Get top-level comments only (no parent)
            match_condition["parent_comment_id"] = None
        
        # Get comments with author information
        pipeline = [
            {"$match": match_condition},
            {"$sort": {"created_at": -1}},
            {"$limit": limit},
            {
                "$addFields": {
                    "author_id_obj": {"$toObjectId": "$author_id"}
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "author_id_obj",
                    "foreignField": "_id",
                    "as": "author"
                }
            },
            {"$unwind": "$author"},
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "text": 1,
                    "created_at": 1,
                    "parent_comment_id": 1,
                    "mentioned_user_ids": {"$ifNull": ["$mentioned_user_ids", []]},
                    "replies_count": {"$ifNull": ["$replies_count", 0]},
                    "total_thread_replies": {"$ifNull": ["$total_thread_replies", 0]},
                    "likes_count": {"$ifNull": ["$likes_count", 0]},
                    "author": {
                        "id": {"$toString": "$author._id"},
                        "username": "$author.username",
                        "avatar": {
                            "$ifNull": ["$author.avatar_url", "$author.avatar"]
                        }
                    },
                    "_id": 0
                }
            }
        ]
        
        comments = await db.comments.aggregate(pipeline).to_list(length=limit)
        logger.info(f"Retrieved {len(comments)} comments for post {post_id}")
        return comments
    except Exception as e:
        logger.error(f"Error fetching comments for post {post_id}: {str(e)}")
        raise HTTPException(status_code=404, detail="Post not found")

@api_router.get("/comments/{comment_id}/replies")
async def get_comment_replies(comment_id: str, limit: int = 20):
    """Get replies to a specific comment"""
    try:
        pipeline = [
            {"$match": {"parent_comment_id": comment_id}},
            {"$sort": {"created_at": 1}},  # Oldest first for replies
            {"$limit": limit},
            {
                "$addFields": {
                    "author_id_obj": {"$toObjectId": "$author_id"}
                }
            },
            {
                "$lookup": {
                    "from": "users",
                    "localField": "author_id_obj",
                    "foreignField": "_id",
                    "as": "author"
                }
            },
            {"$unwind": "$author"},
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "text": 1,
                    "created_at": 1,
                    "parent_comment_id": 1,
                    "mentioned_user_ids": {"$ifNull": ["$mentioned_user_ids", []]},
                    "replies_count": {"$ifNull": ["$replies_count", 0]},
                    "likes_count": {"$ifNull": ["$likes_count", 0]},
                    "author": {
                        "id": {"$toString": "$author._id"},
                        "username": "$author.username",
                        "avatar": {
                            "$ifNull": ["$author.avatar_url", "$author.avatar"]
                        }
                    },
                    "_id": 0
                }
            }
        ]
        
        replies = await db.comments.aggregate(pipeline).to_list(length=limit)
        return replies
    except Exception as e:
        logger.error(f"Error fetching replies for comment {comment_id}: {str(e)}")
        raise HTTPException(status_code=404, detail="Comment not found")

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete a comment (only the author can delete their own comments)"""
    try:
        # Find the comment first
        comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
        if not comment:
            raise HTTPException(status_code=404, detail="Comment not found")
        
        # Check if the current user is the author
        if comment.get("author_id") != current_user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own comments")
        
        # Get the post_id to update comment count
        post_id = comment.get("post_id")
        parent_comment_id = comment.get("parent_comment_id")
        
        # Delete the comment
        await db.comments.delete_one({"_id": ObjectId(comment_id)})
        
        # Delete all replies to this comment
        replies_deleted = await db.comments.delete_many({"parent_comment_id": comment_id})
        
        # Update the post's comment count
        if post_id:
            total_deleted = 1 + replies_deleted.deleted_count
            await db.posts.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"comments_count": -total_deleted}}
            )
        
        # If this was a reply, decrement the parent comment's replies_count
        if parent_comment_id:
            await db.comments.update_one(
                {"_id": ObjectId(parent_comment_id)},
                {"$inc": {"replies_count": -1}}
            )
        
        logger.info(f"User {current_user_id} deleted comment {comment_id} (and {replies_deleted.deleted_count} replies)")
        
        return {"message": "Comment deleted successfully", "replies_deleted": replies_deleted.deleted_count}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting comment {comment_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete comment")

@api_router.get("/users/search/mention")
async def search_users_for_mention(q: str, limit: int = 10, current_user_id: str = Depends(get_current_user)):
    """Search users for @mention autocomplete"""
    if not q or len(q) < 1:
        return []
    
    try:
        # Search by username OR name (case-insensitive, contains match for better UX)
        search_regex = {"$regex": re.escape(q), "$options": "i"}
        pipeline = [
            {
                "$match": {
                    "$or": [
                        {"username": search_regex},
                        {"name": search_regex}
                    ]
                }
            },
            {"$limit": limit},
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "username": 1,
                    "name": 1,
                    "avatar": {"$ifNull": ["$avatar_url", "$avatar"]},
                    "_id": 0
                }
            }
        ]
        
        users = await db.users.aggregate(pipeline).to_list(length=limit)
        logger.info(f"[Mention Search] Query: '{q}', Found: {len(users)} users")
        return users
    except Exception as e:
        logger.error(f"Error searching users for mention: {str(e)}")
        return []

# Social Features - Follow System

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user_id: str = Depends(get_current_user)):
    """Follow or unfollow a user"""
    # Check if user has accepted terms
    await check_terms_accepted(current_user_id)
    
    if user_id == current_user_id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    try:
        following_object_id = ObjectId(user_id)
        follower_object_id = ObjectId(current_user_id)
        
        # Check if already following
        existing_follow = await db.follows.find_one({
            "follower_id": follower_object_id,
            "following_id": following_object_id
        })
        
        if existing_follow:
            # Unfollow
            await db.follows.delete_one({"_id": existing_follow["_id"]})
            
            # Update counts
            await db.users.update_one(
                {"_id": follower_object_id},
                {"$inc": {"following_count": -1}}
            )
            await db.users.update_one(
                {"_id": following_object_id},
                {"$inc": {"followers_count": -1}}
            )
            
            return {"message": "User unfollowed", "following": False}
        else:
            # Follow
            await db.follows.insert_one({
                "follower_id": follower_object_id,
                "following_id": following_object_id,
                "created_at": datetime.now(timezone.utc)
            })
            
            # Update counts
            await db.users.update_one(
                {"_id": follower_object_id},
                {"$inc": {"following_count": 1}}
            )
            await db.users.update_one(
                {"_id": following_object_id},
                {"$inc": {"followers_count": 1}}
            )
            
            # Trigger follow notification
            try:
                notification_service = get_notification_service(db)
                await notification_service.trigger_follow_notification(
                    follower_id=current_user_id,
                    followed_user_id=user_id
                )
            except Exception as e:
                logger.error(f"Failed to send follow notification: {e}")
            
            return {"message": "User followed", "following": True}
    
    except:
        raise HTTPException(status_code=404, detail="User not found")

# Workout Cards Endpoints

class WorkoutCardCreate(BaseModel):
    workouts: List[Dict[str, Any]]
    total_duration: int
    completed_at: str
    mood_category: Optional[str] = None
    workout_snapshot_id: Optional[str] = None  # Link to persistent snapshot

# Workout Snapshots - Persistent cart data for "Try this workout" feature
class WorkoutSnapshotCreate(BaseModel):
    workouts: List[Dict[str, Any]]
    total_duration: int
    mood_category: Optional[str] = None

@api_router.post("/workout-snapshots")
async def create_workout_snapshot(
    snapshot_data: WorkoutSnapshotCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a persistent workout snapshot on workout completion"""
    logger.info(f"📸 Creating workout snapshot for user {current_user_id}")
    logger.info(f"📸 Snapshot data: {snapshot_data.dict()}")
    
    snapshot_doc = {
        **snapshot_data.dict(),
        "user_id": current_user_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.workout_snapshots.insert_one(snapshot_doc)
    snapshot_id = str(result.inserted_id)
    
    logger.info(f"✅ Created workout snapshot: {snapshot_id}")
    
    return {
        "id": snapshot_id,
        "message": "Workout snapshot created successfully"
    }

@api_router.get("/workout-snapshots/{snapshot_id}")
async def get_workout_snapshot(snapshot_id: str):
    """Get a workout snapshot by ID - used for 'Try this workout' feature"""
    logger.info(f"📸 Fetching workout snapshot: {snapshot_id}")
    
    try:
        snapshot = await db.workout_snapshots.find_one({"_id": ObjectId(snapshot_id)})
    except:
        logger.error(f"❌ Invalid snapshot ID format: {snapshot_id}")
        raise HTTPException(status_code=400, detail="Invalid snapshot ID")
    
    if not snapshot:
        logger.error(f"❌ Workout snapshot not found: {snapshot_id}")
        raise HTTPException(status_code=404, detail="Workout snapshot not found")
    
    return {
        "id": str(snapshot["_id"]),
        "workouts": snapshot["workouts"],
        "total_duration": snapshot["total_duration"],
        "mood_category": snapshot.get("mood_category"),
        "user_id": snapshot["user_id"],
        "created_at": snapshot["created_at"].isoformat()
    }

@api_router.post("/workout-cards")
async def save_workout_card(
    card_data: WorkoutCardCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Save a completed workout card for the user"""
    logger.info(f"💾 Saving workout card for user {current_user_id}")
    logger.info(f"💾 Card has workout_snapshot_id: {card_data.workout_snapshot_id}")
    
    card_doc = {
        **card_data.dict(),
        "user_id": current_user_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.workout_cards.insert_one(card_doc)
    
    # Update user's workouts count
    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$inc": {"workouts_count": 1}}
    )
    
    logger.info(f"✅ Workout card saved: {result.inserted_id}")
    
    return {
        "message": "Workout card saved successfully",
        "id": str(result.inserted_id)
    }

@api_router.get("/workout-cards")
async def get_workout_cards(
    current_user_id: str = Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    """Get all saved workout cards for the current user"""
    cards = await db.workout_cards.find(
        {"user_id": current_user_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    result = []
    for card in cards:
        result.append({
            "id": str(card["_id"]),
            "workouts": card["workouts"],
            "total_duration": card["total_duration"],
            "completed_at": card["completed_at"],
            "mood_category": card.get("mood_category"),
            "workout_snapshot_id": card.get("workout_snapshot_id"),  # Include snapshot reference
            "created_at": card["created_at"].isoformat()
        })
    
    return result

@api_router.delete("/workout-cards/{card_id}")
async def delete_workout_card(
    card_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a workout card"""
    try:
        result = await db.workout_cards.delete_one({
            "_id": ObjectId(card_id),
            "user_id": current_user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Workout card not found")
        
        return {"message": "Workout card deleted successfully"}
    except:
        raise HTTPException(status_code=404, detail="Workout card not found")

# Saved Workouts Endpoints (for bookmarking workouts to do later)

class SavedWorkoutCreate(BaseModel):
    name: str
    workouts: List[Dict[str, Any]]  # List of workout exercises
    total_duration: int
    source: str = "custom"  # "custom" for cart saves, "featured" for featured workout saves
    featured_workout_id: Optional[str] = None
    mood: Optional[str] = None
    title: Optional[str] = None

@api_router.post("/saved-workouts")
async def save_workout(
    workout_data: SavedWorkoutCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Save a workout for later"""
    # Check if this workout is already saved (by name and user)
    existing = await db.saved_workouts.find_one({
        "user_id": current_user_id,
        "name": workout_data.name
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Workout already saved")
    
    workout_doc = {
        **workout_data.dict(),
        "user_id": current_user_id,
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db.saved_workouts.insert_one(workout_doc)
    
    return {
        "message": "Workout saved successfully",
        "id": str(result.inserted_id)
    }

@api_router.get("/saved-workouts")
async def get_saved_workouts(
    current_user_id: str = Depends(get_current_user),
    limit: int = 50,
    skip: int = 0
):
    """Get all saved workouts for the current user"""
    workouts = await db.saved_workouts.find(
        {"user_id": current_user_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    result = []
    for workout in workouts:
        result.append({
            "id": str(workout["_id"]),
            "name": workout["name"],
            "workouts": workout["workouts"],
            "total_duration": workout["total_duration"],
            "source": workout.get("source", "custom"),
            "featured_workout_id": workout.get("featured_workout_id"),
            "mood": workout.get("mood"),
            "title": workout.get("title"),
            "created_at": workout["created_at"].isoformat()
        })
    
    return result

@api_router.delete("/saved-workouts/{workout_id}")
async def delete_saved_workout(
    workout_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a saved workout"""
    try:
        result = await db.saved_workouts.delete_one({
            "_id": ObjectId(workout_id),
            "user_id": current_user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Saved workout not found")
        
        return {"message": "Saved workout deleted successfully"}
    except:
        raise HTTPException(status_code=404, detail="Saved workout not found")

@api_router.get("/saved-workouts/check/{workout_name}")
async def check_saved_workout(
    workout_name: str,
    current_user_id: str = Depends(get_current_user)
):
    """Check if a workout is already saved"""
    existing = await db.saved_workouts.find_one({
        "user_id": current_user_id,
        "name": workout_name
    })
    
    return {"is_saved": existing is not None}

# Saved Posts Endpoints
@api_router.post("/posts/{post_id}/save")
async def save_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Save a post to user's saved posts"""
    # Check if user has accepted terms
    await check_terms_accepted(current_user_id)
    
    # Check if post exists
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Check if already saved
    existing = await db.saved_posts.find_one({
        "user_id": current_user_id,
        "post_id": post_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Post already saved")
    
    # Save the post
    saved_doc = {
        "user_id": current_user_id,
        "post_id": post_id,
        "saved_at": datetime.utcnow()
    }
    
    await db.saved_posts.insert_one(saved_doc)
    
    return {"message": "Post saved successfully", "is_saved": True}

@api_router.delete("/posts/{post_id}")
async def delete_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a post (owner or admin can delete)"""
    try:
        # Find the post
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
        
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check if user is admin
        current_user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        is_admin = current_user and current_user.get("username", "").lower() == "officialmoodapp"
        
        # Check if the current user is the author or admin
        if str(post.get("author_id")) != current_user_id and not is_admin:
            raise HTTPException(status_code=403, detail="You can only delete your own posts")
        
        # Delete the post
        result = await db.posts.delete_one({"_id": ObjectId(post_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=500, detail="Failed to delete post")
        
        # Also delete related data
        await db.likes.delete_many({"post_id": post_id})
        await db.comments.delete_many({"post_id": post_id})
        await db.saved_posts.delete_many({"post_id": post_id})
        
        if is_admin and str(post.get("author_id")) != current_user_id:
            logger.info(f"Post {post_id} deleted by ADMIN {current_user_id}")
        else:
            logger.info(f"Post {post_id} deleted by user {current_user_id}")
        
        return {"message": "Post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete post")


@api_router.delete("/admin/posts/bulk")
async def admin_bulk_delete_posts(
    username: Optional[str] = None,
    user_id: Optional[str] = None,
    current_user_id: str = Depends(require_admin)
):
    """
    Admin endpoint to bulk delete posts by username or user_id.
    Only admin (officialmoodapp) can use this endpoint.
    """
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        if not username and not user_id:
            raise HTTPException(status_code=400, detail="Must provide username or user_id")
        
        # Build query
        query = {}
        target_user = None
        
        if user_id:
            query["author_id"] = user_id
            target_user = await db.users.find_one({"_id": ObjectId(user_id)})
        elif username:
            # Find user by username (case-insensitive)
            target_user = await db.users.find_one({
                "username": {"$regex": f"^{username}$", "$options": "i"}
            })
            if target_user:
                query["author_id"] = str(target_user["_id"])
            else:
                # Also check by display_name or username in posts directly
                query["$or"] = [
                    {"username": {"$regex": f"^{username}$", "$options": "i"}},
                    {"author_username": {"$regex": f"^{username}$", "$options": "i"}}
                ]
        
        # Get posts to delete
        posts_to_delete = await db.posts.find(query).to_list(1000)
        post_ids = [str(post["_id"]) for post in posts_to_delete]
        
        if not posts_to_delete:
            return {
                "message": "No posts found matching criteria",
                "deleted_count": 0,
                "username": username,
                "user_id": user_id
            }
        
        # Delete posts
        result = await db.posts.delete_many(query)
        
        # Delete related data for each post
        for post_id in post_ids:
            await db.likes.delete_many({"post_id": post_id})
            await db.comments.delete_many({"post_id": post_id})
            await db.saved_posts.delete_many({"post_id": post_id})
        
        logger.info(f"ADMIN bulk delete: {result.deleted_count} posts deleted for username={username}, user_id={user_id}")
        
        return {
            "message": f"Successfully deleted {result.deleted_count} posts",
            "deleted_count": result.deleted_count,
            "username": username or (target_user.get("username") if target_user else None),
            "user_id": user_id or (str(target_user["_id"]) if target_user else None),
            "post_ids_deleted": post_ids
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in admin bulk delete: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete posts: {str(e)}")


@api_router.get("/admin/posts/list")
async def admin_list_all_posts(
    limit: int = 50,
    skip: int = 0,
    username: Optional[str] = None,
    current_user_id: str = Depends(require_admin)
):
    """
    Admin endpoint to list all posts with user info.
    Only admin (officialmoodapp) can use this endpoint.
    """
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        # Build query
        query = {}
        if username:
            query["$or"] = [
                {"username": {"$regex": username, "$options": "i"}},
                {"author_username": {"$regex": username, "$options": "i"}}
            ]
        
        # Get total count
        total = await db.posts.count_documents(query)
        
        # Get posts
        posts = await db.posts.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Format response
        posts_list = []
        for post in posts:
            posts_list.append({
                "id": str(post["_id"]),
                "author_id": post.get("author_id"),
                "username": post.get("username") or post.get("author_username"),
                "caption": (post.get("caption") or "")[:100],
                "media_url": post.get("media_url") or (post.get("media_urls", [None])[0] if post.get("media_urls") else None),
                "likes_count": post.get("likes_count", 0),
                "comments_count": post.get("comments_count", 0),
                "created_at": post.get("created_at")
            })
        
        return {
            "total": total,
            "posts": posts_list,
            "limit": limit,
            "skip": skip
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing posts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list posts: {str(e)}")

@api_router.delete("/posts/{post_id}/save")
async def unsave_post(
    post_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Remove a post from user's saved posts"""
    result = await db.saved_posts.delete_one({
        "user_id": current_user_id,
        "post_id": post_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Saved post not found")
    
    return {"message": "Post unsaved successfully", "is_saved": False}

@api_router.get("/posts/{post_id}/save/check")
async def check_post_saved(
    post_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Check if a post is saved by the current user"""
    existing = await db.saved_posts.find_one({
        "user_id": current_user_id,
        "post_id": post_id
    })
    
    return {"is_saved": existing is not None}

@api_router.get("/saved-posts")
async def get_saved_posts(
    current_user_id: str = Depends(get_current_user)
):
    """Get all saved posts for the current user with full post details"""
    saved_posts = await db.saved_posts.find(
        {"user_id": current_user_id}
    ).sort("saved_at", -1).to_list(100)
    
    # Get full post details for each saved post
    posts = []
    for saved in saved_posts:
        post = await db.posts.find_one({"_id": ObjectId(saved["post_id"])})
        if post:
            # Get author details
            author = await db.users.find_one({"_id": ObjectId(post["author_id"])})
            if author:
                posts.append({
                    "id": str(post["_id"]),
                    "author": {
                        "id": str(author["_id"]),
                        "username": author.get("username", ""),
                        "name": author.get("name", ""),
                        "avatar": author.get("avatar", "")
                    },
                    "caption": post.get("caption", ""),
                    "media_urls": post.get("media_urls", []),
                    "likes_count": post.get("likes_count", 0),
                    "comments_count": post.get("comments_count", 0),
                    "saved_at": saved["saved_at"].isoformat()
                })
    
    return posts

# Health Check
@api_router.get("/")
async def root():
    return {"message": "MOOD App API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}

@api_router.get("/meta")
async def get_meta():
    """
    Returns deployment metadata to verify which build and DB is live.
    READ-ONLY endpoint - no auth required.
    """
    # Get seed state from DB if exists
    seed_state = await db.system.find_one({"_id": "seed_state"})
    seed_version_applied = seed_state.get("version") if seed_state else "none"
    
    # Sanitize mongo URL (hide credentials)
    mongo_host = mongo_url.split("@")[-1] if "@" in mongo_url else mongo_url
    mongo_host = mongo_host.split("/")[0] if "/" in mongo_host else mongo_host
    
    return {
        "env": APP_ENV,
        "is_staging": IS_STAGING,
        "git_sha": GIT_SHA,
        "deployed_at": DEPLOYED_AT,
        "seed_version_current": SEED_VERSION,
        "seed_version_applied": seed_version_applied,
        "mongo_db_name": db.name,
        "mongo_host": mongo_host,
        "admin_allowlist": ADMIN_ALLOWLIST
    }

# Feedback endpoint
@api_router.post("/feedback")
async def submit_feedback(
    feedback_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Submit user feedback"""
    feedback_doc = {
        "user_id": current_user_id,
        "feedback": feedback_data.get("feedback", ""),
        "type": feedback_data.get("type", "general"),
        "created_at": datetime.utcnow()
    }
    
    await db.feedback.insert_one(feedback_doc)
    
    return {"message": "Feedback submitted successfully"}

# Messaging endpoints
@api_router.get("/conversations")
async def get_conversations(
    current_user_id: str = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    conversations = await db.conversations.find({
        "participants": current_user_id
    }).sort("updated_at", -1).to_list(50)
    
    result = []
    for conv in conversations:
        # Get the other participant
        other_user_id = [p for p in conv["participants"] if p != current_user_id][0]
        other_user = await db.users.find_one({"_id": ObjectId(other_user_id)})
        
        # Get unread count
        unread_count = await db.messages.count_documents({
            "conversation_id": str(conv["_id"]),
            "sender_id": {"$ne": current_user_id},
            "read": False
        })
        
        if other_user:
            result.append({
                "id": str(conv["_id"]),
                "other_user": {
                    "id": str(other_user["_id"]),
                    "username": other_user.get("username", ""),
                    "name": other_user.get("name", ""),
                    "avatar": other_user.get("avatar", "")
                },
                "last_message": conv.get("last_message", ""),
                "last_message_time": conv.get("updated_at", conv.get("created_at")).isoformat() if conv.get("updated_at") or conv.get("created_at") else None,
                "unread_count": unread_count
            })
    
    return result

@api_router.post("/conversations")
async def create_or_get_conversation(
    data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new conversation or get existing one"""
    other_user_id = data.get("user_id")
    
    if not other_user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    # Check if conversation already exists
    existing = await db.conversations.find_one({
        "participants": {"$all": [current_user_id, other_user_id]}
    })
    
    if existing:
        return {"id": str(existing["_id"]), "exists": True}
    
    # Create new conversation
    conversation = {
        "participants": [current_user_id, other_user_id],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_message": ""
    }
    
    result = await db.conversations.insert_one(conversation)
    
    return {"id": str(result.inserted_id), "exists": False}

@api_router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    current_user_id: str = Depends(get_current_user)
):
    """Get messages in a conversation"""
    # Verify user is participant
    conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
    if not conversation or current_user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized to view this conversation")
    
    # Mark messages as read
    await db.messages.update_many(
        {
            "conversation_id": conversation_id,
            "sender_id": {"$ne": current_user_id},
            "read": False
        },
        {"$set": {"read": True}}
    )
    
    # Get messages
    messages = await db.messages.find(
        {"conversation_id": conversation_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for msg in messages:
        item = {
            "id": str(msg["_id"]),
            "sender_id": msg["sender_id"],
            "content": msg.get("content", ""),
            "created_at": msg["created_at"].isoformat(),
            "read": msg.get("read", False),
        }
        if msg.get("attachment_type"):
            item["attachment_type"] = msg["attachment_type"]
            item["attachment"] = msg.get("attachment") or {}
        result.append(item)
    
    return result[::-1]  # Return in chronological order

@api_router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: str,
    data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Send a message in a conversation.
    Supports plain text and structured attachments (e.g. workout_share).
    Body shape:
      {
        "content": "optional preview text",
        "attachment_type": "workout_share" | None,
        "attachment": { ... }   # opaque payload, validated per type
      }
    """
    content = (data.get("content") or "").strip()
    attachment_type = data.get("attachment_type")
    attachment = data.get("attachment")

    if not content and not attachment_type:
        raise HTTPException(status_code=400, detail="Message content or attachment is required")
    if attachment_type and attachment_type not in {"workout_share"}:
        raise HTTPException(status_code=400, detail="Unsupported attachment_type")
    
    # Verify user is participant
    conversation = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
    if not conversation or current_user_id not in conversation["participants"]:
        raise HTTPException(status_code=403, detail="Not authorized to send messages in this conversation")
    
    # Create message
    message = {
        "conversation_id": conversation_id,
        "sender_id": current_user_id,
        "content": content,
        "created_at": datetime.utcnow(),
        "read": False,
    }
    if attachment_type:
        message["attachment_type"] = attachment_type
        message["attachment"] = attachment or {}

    result = await db.messages.insert_one(message)

    # Build a short preview for conversation.last_message
    preview = content[:100] if content else ""
    if not preview and attachment_type == "workout_share":
        wname = (attachment or {}).get("workout_name") or "a workout"
        preview = f"📤 Sent a workout: {wname}"

    # Update conversation
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {
            "$set": {
                "last_message": preview,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Trigger message notification
    try:
        # Find the other participant(s) to notify
        other_participants = [p for p in conversation["participants"] if p != current_user_id]
        notification_service = get_notification_service(db)
        for recipient_id in other_participants:
            await notification_service.trigger_message_notification(
                sender_id=current_user_id,
                recipient_id=recipient_id,
                conversation_id=conversation_id,
                message_text=preview or content,
                is_request=conversation.get("is_request", False)
            )
    except Exception as e:
        logger.error(f"Failed to send message notification: {e}")
    
    response = {
        "id": str(result.inserted_id),
        "sender_id": current_user_id,
        "content": content,
        "created_at": message["created_at"].isoformat(),
        "read": False,
    }
    if attachment_type:
        response["attachment_type"] = attachment_type
        response["attachment"] = attachment or {}
    return response


@api_router.post("/messages/send-workout")
async def send_workout_message(
    data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """Send a workout to another user as a chat share-card message.

    Body:
      {
        "recipient_user_id": "<user id>",
        "workout": { ... full workout payload ... },
        "equipment": "Bodyweight",
        "difficulty": "intermediate",
        "mood_category": "Muscle Gainer",     // optional, derived client-side
        "subtext": "Chest"                    // optional
      }

    Behavior:
      - Refuse self-send
      - Find or create the DM conversation
      - Persist a 'workout_share' attachment message
      - Return { thread_id, message_id }
    """
    recipient_user_id = (data.get("recipient_user_id") or "").strip()
    workout = data.get("workout")
    if not recipient_user_id:
        raise HTTPException(status_code=400, detail="recipient_user_id is required")
    if recipient_user_id == current_user_id:
        raise HTTPException(status_code=400, detail="You can't send a workout to yourself")
    if not workout or not isinstance(workout, dict):
        raise HTTPException(status_code=400, detail="workout payload is required")

    # Validate recipient exists
    try:
        recipient_oid = ObjectId(recipient_user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid recipient_user_id")
    recipient = await db.users.find_one({"_id": recipient_oid}, {"username": 1, "_id": 1})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    # Find or create DM conversation
    existing = await db.conversations.find_one({
        "participants": {"$all": [current_user_id, recipient_user_id]}
    })
    if existing:
        conversation_id = str(existing["_id"])
    else:
        conv_doc = {
            "participants": [current_user_id, recipient_user_id],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_message": "",
        }
        ins = await db.conversations.insert_one(conv_doc)
        conversation_id = str(ins.inserted_id)

    # Build attachment — keep client payload + a couple of normalized fields
    workout_name = (
        (workout.get("name") if isinstance(workout, dict) else None)
        or "Workout"
    )
    attachment = {
        "workout": workout,
        "equipment": (data.get("equipment") or "").strip(),
        "difficulty": (data.get("difficulty") or "").strip(),
        "mood_category": (data.get("mood_category") or "").strip(),
        "subtext": (data.get("subtext") or "").strip(),
        "workout_name": workout_name,
    }

    now = datetime.utcnow()
    msg_doc = {
        "conversation_id": conversation_id,
        "sender_id": current_user_id,
        "content": "",
        "attachment_type": "workout_share",
        "attachment": attachment,
        "created_at": now,
        "read": False,
    }
    ins = await db.messages.insert_one(msg_doc)

    preview = f"📤 Sent a workout: {workout_name}"
    await db.conversations.update_one(
        {"_id": ObjectId(conversation_id)},
        {"$set": {"last_message": preview, "updated_at": now}}
    )

    # Notify the recipient (best-effort)
    try:
        notification_service = get_notification_service(db)
        await notification_service.trigger_message_notification(
            sender_id=current_user_id,
            recipient_id=recipient_user_id,
            conversation_id=conversation_id,
            message_text=preview,
            is_request=False,
        )
    except Exception as e:
        logger.error(f"Failed to send workout-share notification: {e}")

    return {
        "thread_id": conversation_id,
        "message_id": str(ins.inserted_id),
        "recipient_username": recipient.get("username", ""),
    }

@api_router.get("/conversations/unread-count")
async def get_unread_count(
    current_user_id: str = Depends(get_current_user)
):
    """Get total unread message count"""
    # Get all user's conversations
    conversations = await db.conversations.find({
        "participants": current_user_id
    }).to_list(100)
    
    conv_ids = [str(conv["_id"]) for conv in conversations]
    
    count = await db.messages.count_documents({
        "conversation_id": {"$in": conv_ids},
        "sender_id": {"$ne": current_user_id},
        "read": False
    })
    
    return {"unread_count": count}

# ============================================
# USER NOTIFICATIONS ENDPOINTS
# ============================================

def get_post_preview_url(post: dict) -> Optional[str]:
    """Get the best preview URL for a post - prefer user-selected cover, then images, then video thumbnail"""
    if not post:
        return None
    
    media_urls = post.get("media_urls", [])
    cover_urls = post.get("cover_urls", {})
    
    # First check for user-selected cover URL (highest priority)
    if cover_urls:
        # cover_urls is a dict mapping media index to cover URL
        # For preview, use the first cover (index 0 or "0")
        first_cover = cover_urls.get(0) or cover_urls.get("0") or cover_urls.get('0')
        if first_cover:
            return first_cover
    
    # Check for thumbnail_url (usually set for video posts uploaded to Cloudinary)
    thumbnail = post.get("thumbnail_url")
    if thumbnail:
        return thumbnail
    
    if not media_urls:
        return None
    
    # Look for first image URL
    video_extensions = ['.mov', '.mp4', '.avi', '.webm', '.mkv', '.m4v']
    
    for url in media_urls:
        url_lower = url.lower()
        is_video = any(ext in url_lower for ext in video_extensions)
        
        if not is_video:
            # This is likely an image, use it
            return url
        elif 'cloudinary' in url_lower:
            # For Cloudinary videos, generate a thumbnail URL
            # Transform video URL to get first frame as image
            # Example: .../video/upload/... -> .../video/upload/so_0/...
            if '/video/upload/' in url:
                return url.replace('/video/upload/', '/video/upload/so_0,f_jpg/')
    
    # No image found, return first URL (might be video - frontend will handle)
    return media_urls[0] if media_urls else None

# NOTE: The old /notifications endpoint was removed.
# Use the correct one defined later that uses the NotificationService
# which properly tracks mentions, replies, likes, comments, follows, etc.

# ============================================
# CONTENT MODERATION ENDPOINTS
# ============================================

@api_router.get("/moderation/report-categories")
async def get_available_report_categories():
    """Get list of available report categories"""
    return {
        "categories": [
            {"id": "spam", "label": "Spam"},
            {"id": "harassment_bullying", "label": "Harassment/Bullying"},
            {"id": "hate_speech", "label": "Hate Speech"},
            {"id": "nudity_sexual_content", "label": "Nudity/Sexual Content"},
            {"id": "violence", "label": "Violence"},
            {"id": "misinformation", "label": "Misinformation"},
            {"id": "other", "label": "Other"},
        ]
    }

@api_router.post("/moderation/report")
async def report_content(
    report_data: ContentReportCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Report objectionable content (post, comment, or profile)"""
    # Check if user has accepted terms
    await check_terms_accepted(current_user_id)
    
    # Validate content type
    if report_data.content_type not in ["post", "comment", "profile"]:
        raise HTTPException(status_code=400, detail="Invalid content type. Must be 'post', 'comment', or 'profile'")
    
    # Validate category
    if not is_valid_report_category(report_data.category):
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {REPORT_CATEGORIES}")
    
    # Verify content exists
    if report_data.content_type == "post":
        content = await db.posts.find_one({"_id": ObjectId(report_data.content_id)})
        if not content:
            raise HTTPException(status_code=404, detail="Post not found")
        content_author_id = content.get("author_id") or content.get("user_id")
    elif report_data.content_type == "comment":
        content = await db.comments.find_one({"_id": ObjectId(report_data.content_id)})
        if not content:
            raise HTTPException(status_code=404, detail="Comment not found")
        content_author_id = content.get("user_id")
    else:  # profile
        content = await db.users.find_one({"_id": ObjectId(report_data.content_id)})
        if not content:
            raise HTTPException(status_code=404, detail="User not found")
        content_author_id = report_data.content_id
    
    # Check if user already reported this content
    existing_report = await db.content_reports.find_one({
        "reporter_id": current_user_id,
        "content_type": report_data.content_type,
        "content_id": report_data.content_id
    })
    
    if existing_report:
        raise HTTPException(status_code=400, detail="You have already reported this content")
    
    # Create report
    report = {
        "reporter_id": current_user_id,
        "content_type": report_data.content_type,
        "content_id": report_data.content_id,
        "content_author_id": content_author_id,
        "category": report_data.category,
        "reason": report_data.reason,
        "status": REPORT_STATUS["pending"],
        "created_at": datetime.now(timezone.utc),
        "reviewed_at": None,
        "reviewed_by": None,
        "action_taken": None
    }
    
    result = await db.content_reports.insert_one(report)
    
    logger.info(f"Content report created: {report_data.content_type} {report_data.content_id} by user {current_user_id}")
    
    return {
        "success": True,
        "report_id": str(result.inserted_id),
        "message": "Report submitted successfully. Our team will review it within 24 hours."
    }

@api_router.post("/moderation/block")
async def block_user(
    block_data: BlockUserCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Block a user - mutual blocking, notifies admin"""
    
    blocked_user_id = block_data.blocked_user_id
    
    # Can't block yourself
    if blocked_user_id == current_user_id:
        raise HTTPException(status_code=400, detail="You cannot block yourself")
    
    # Verify blocked user exists
    blocked_user = await db.users.find_one({"_id": ObjectId(blocked_user_id)})
    if not blocked_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if already blocked
    existing_block = await db.user_blocks.find_one({
        "blocker_id": current_user_id,
        "blocked_id": blocked_user_id
    })
    
    if existing_block:
        raise HTTPException(status_code=400, detail="User is already blocked")
    
    # Create block record
    block = {
        "blocker_id": current_user_id,
        "blocked_id": blocked_user_id,
        "reason": block_data.reason,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.user_blocks.insert_one(block)
    
    # Also create an admin notification/report for the block
    admin_notification = {
        "type": "user_blocked",
        "blocker_id": current_user_id,
        "blocked_id": blocked_user_id,
        "reason": block_data.reason,
        "status": "pending_review",
        "created_at": datetime.now(timezone.utc),
        "reviewed_at": None
    }
    await db.admin_notifications.insert_one(admin_notification)
    
    # Remove any follow relationships
    await db.follows.delete_many({
        "$or": [
            {"follower_id": current_user_id, "following_id": blocked_user_id},
            {"follower_id": blocked_user_id, "following_id": current_user_id}
        ]
    })
    
    # Update follower/following counts for both users
    current_user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if current_user:
        following_count = await db.follows.count_documents({"follower_id": current_user_id})
        followers_count = await db.follows.count_documents({"following_id": current_user_id})
        await db.users.update_one(
            {"_id": ObjectId(current_user_id)},
            {"$set": {"following_count": following_count, "followers_count": followers_count}}
        )
    
    blocked_following_count = await db.follows.count_documents({"follower_id": blocked_user_id})
    blocked_followers_count = await db.follows.count_documents({"following_id": blocked_user_id})
    await db.users.update_one(
        {"_id": ObjectId(blocked_user_id)},
        {"$set": {"following_count": blocked_following_count, "followers_count": blocked_followers_count}}
    )
    
    logger.info(f"User {current_user_id} blocked user {blocked_user_id}")
    
    return {
        "success": True,
        "message": "User blocked successfully. They will no longer appear in your feed."
    }

@api_router.delete("/moderation/block/{blocked_user_id}")
async def unblock_user(
    blocked_user_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Unblock a previously blocked user"""
    
    result = await db.user_blocks.delete_one({
        "blocker_id": current_user_id,
        "blocked_id": blocked_user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Block not found")
    
    logger.info(f"User {current_user_id} unblocked user {blocked_user_id}")
    
    return {
        "success": True,
        "message": "User unblocked successfully"
    }

@api_router.get("/moderation/blocked-users")
async def get_blocked_users(
    current_user_id: str = Depends(get_current_user)
):
    """Get list of users blocked by current user"""
    
    blocks = await db.user_blocks.find({
        "blocker_id": current_user_id
    }).sort("created_at", -1).to_list(100)
    
    blocked_users = []
    for block in blocks:
        user = await db.users.find_one({"_id": ObjectId(block["blocked_id"])})
        if user:
            blocked_users.append({
                "id": str(block["_id"]),
                "blocked_user_id": block["blocked_id"],
                "blocked_username": user.get("username", "Unknown"),
                "blocked_name": user.get("name", ""),
                "blocked_avatar": user.get("avatar"),
                "blocked_at": block["created_at"].isoformat()
            })
    
    return {"blocked_users": blocked_users}

@api_router.get("/moderation/is-blocked/{user_id}")
async def check_if_blocked(
    user_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Check if a user is blocked (mutual check)"""
    
    # Check if current user blocked them OR they blocked current user
    block = await db.user_blocks.find_one({
        "$or": [
            {"blocker_id": current_user_id, "blocked_id": user_id},
            {"blocker_id": user_id, "blocked_id": current_user_id}
        ]
    })
    
    return {
        "is_blocked": block is not None,
        "blocked_by_me": block is not None and block.get("blocker_id") == current_user_id,
        "blocked_by_them": block is not None and block.get("blocker_id") == user_id
    }

# Helper function to get blocked user IDs for feed filtering
async def get_blocked_user_ids(user_id: str) -> set:
    """Get all user IDs that should be filtered from a user's feed (mutual blocks)"""
    blocks = await db.user_blocks.find({
        "$or": [
            {"blocker_id": user_id},
            {"blocked_id": user_id}
        ]
    }).to_list(1000)
    
    blocked_ids = set()
    for block in blocks:
        if block["blocker_id"] == user_id:
            blocked_ids.add(block["blocked_id"])
        else:
            blocked_ids.add(block["blocker_id"])
    
    return blocked_ids

# ============================================
# ADMIN MODERATION ENDPOINTS
# ============================================

@api_router.get("/moderation/admin/reports")
async def get_pending_reports(
    status: str = "pending",
    limit: int = 50,
    current_user_id: str = Depends(require_admin)
):
    """Get content reports for admin review"""
    
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    query = {}
    if status != "all":
        query["status"] = status
    
    reports = await db.content_reports.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for report in reports:
        # Get reporter info
        reporter = await db.users.find_one({"_id": ObjectId(report["reporter_id"])})
        
        # Get content info
        content_preview = None
        content_author = None
        
        if report["content_type"] == "post":
            post = await db.posts.find_one({"_id": ObjectId(report["content_id"])})
            if post:
                content_preview = post.get("caption", "")[:100]
                author_id = post.get("author_id") or post.get("user_id")
                if author_id:
                    author = await db.users.find_one({"_id": ObjectId(author_id)})
                    content_author = author.get("username") if author else "Unknown"
        elif report["content_type"] == "comment":
            comment = await db.comments.find_one({"_id": ObjectId(report["content_id"])})
            if comment:
                content_preview = comment.get("text", "")[:100]
                if comment.get("user_id"):
                    author = await db.users.find_one({"_id": ObjectId(comment["user_id"])})
                    content_author = author.get("username") if author else "Unknown"
        elif report["content_type"] == "profile":
            profile = await db.users.find_one({"_id": ObjectId(report["content_id"])})
            if profile:
                content_preview = f"Profile: {profile.get('username', 'Unknown')}"
                content_author = profile.get("username")
        
        # Calculate time since report
        time_since = datetime.now(timezone.utc) - report["created_at"].replace(tzinfo=timezone.utc)
        hours_pending = time_since.total_seconds() / 3600
        is_urgent = hours_pending > 20  # Flag if approaching 24 hour deadline
        
        result.append({
            "id": str(report["_id"]),
            "reporter_username": reporter.get("username") if reporter else "Unknown",
            "content_type": report["content_type"],
            "content_id": report["content_id"],
            "content_preview": content_preview,
            "content_author": content_author,
            "content_author_id": report.get("content_author_id"),
            "category": report["category"],
            "reason": report.get("reason"),
            "status": report["status"],
            "created_at": report["created_at"].isoformat(),
            "hours_pending": round(hours_pending, 1),
            "is_urgent": is_urgent,
            "reviewed_at": report.get("reviewed_at").isoformat() if report.get("reviewed_at") else None,
            "action_taken": report.get("action_taken")
        })
    
    # Get counts
    pending_count = await db.content_reports.count_documents({"status": "pending"})
    urgent_count = await db.content_reports.count_documents({
        "status": "pending",
        "created_at": {"$lt": datetime.now(timezone.utc) - timedelta(hours=20)}
    })
    
    return {
        "reports": result,
        "pending_count": pending_count,
        "urgent_count": urgent_count
    }

@api_router.get("/moderation/admin/blocks")
async def get_block_notifications(
    status: str = "pending_review",
    limit: int = 50,
    current_user_id: str = Depends(require_admin)
):
    """Get user block notifications for admin review"""
    
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    query = {"type": "user_blocked"}
    if status != "all":
        query["status"] = status
    
    notifications = await db.admin_notifications.find(query).sort("created_at", -1).limit(limit).to_list(limit)
    
    result = []
    for notif in notifications:
        blocker = await db.users.find_one({"_id": ObjectId(notif["blocker_id"])})
        blocked = await db.users.find_one({"_id": ObjectId(notif["blocked_id"])})
        
        result.append({
            "id": str(notif["_id"]),
            "blocker_username": blocker.get("username") if blocker else "Unknown",
            "blocker_id": notif["blocker_id"],
            "blocked_username": blocked.get("username") if blocked else "Unknown",
            "blocked_id": notif["blocked_id"],
            "reason": notif.get("reason"),
            "status": notif["status"],
            "created_at": notif["created_at"].isoformat(),
            "reviewed_at": notif.get("reviewed_at").isoformat() if notif.get("reviewed_at") else None
        })
    
    return {"notifications": result}

@api_router.post("/moderation/admin/reports/{report_id}/action")
async def take_action_on_report(
    report_id: str,
    action_data: dict,
    current_user_id: str = Depends(require_admin)
):
    """Take action on a content report (remove content, ban user, or dismiss)"""
    
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    action = action_data.get("action")  # "remove_content", "ban_user", "dismiss"
    
    if action not in ["remove_content", "ban_user", "dismiss", "remove_and_ban"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    report = await db.content_reports.find_one({"_id": ObjectId(report_id)})
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    action_taken = []
    
    if action in ["remove_content", "remove_and_ban"]:
        # Remove the content
        if report["content_type"] == "post":
            await db.posts.delete_one({"_id": ObjectId(report["content_id"])})
            # Also delete comments on this post
            await db.comments.delete_many({"post_id": report["content_id"]})
            # Delete likes
            await db.likes.delete_many({"post_id": report["content_id"]})
            action_taken.append("content_removed")
        elif report["content_type"] == "comment":
            await db.comments.delete_one({"_id": ObjectId(report["content_id"])})
            action_taken.append("content_removed")
    
    if action in ["ban_user", "remove_and_ban"]:
        # Ban the content author
        content_author_id = report.get("content_author_id")
        if content_author_id:
            await db.users.update_one(
                {"_id": ObjectId(content_author_id)},
                {
                    "$set": {
                        "is_banned": True,
                        "banned_at": datetime.now(timezone.utc),
                        "banned_by": current_user_id,
                        "ban_reason": f"Content violation: {report['category']}"
                    }
                }
            )
            action_taken.append("user_banned")
    
    if action == "dismiss":
        action_taken.append("dismissed")
    
    # Update report status
    new_status = "action_taken" if action != "dismiss" else "dismissed"
    await db.content_reports.update_one(
        {"_id": ObjectId(report_id)},
        {
            "$set": {
                "status": new_status,
                "reviewed_at": datetime.now(timezone.utc),
                "reviewed_by": current_user_id,
                "action_taken": ", ".join(action_taken)
            }
        }
    )
    
    logger.info(f"Admin {current_user_id} took action '{action}' on report {report_id}")
    
    return {
        "success": True,
        "action_taken": action_taken,
        "message": f"Action completed: {', '.join(action_taken)}"
    }

# ==================== EXERCISE LOOKUP API ====================

class ExerciseCreate(BaseModel):
    name: str
    aliases: List[str] = []
    equipment: List[str] = []
    thumbnail_url: str = ""
    video_url: str = ""
    cues: List[str] = []
    mistakes: Optional[List[str]] = []
    muscle_group: Optional[str] = ""

@api_router.get("/admin/exercises")
async def get_all_exercises_admin(
    current_user_id: str = Depends(require_admin),
    skip: int = 0,
    limit: int = 200,
    search: str = ""
):
    """Get all exercises for admin management (paginated)"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    # Build query
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"muscle_group": {"$regex": search, "$options": "i"}},
            {"equipment": {"$elemMatch": {"$regex": search, "$options": "i"}}}
        ]
    
    # Get total count
    total = await db.exercises.count_documents(query)
    
    # Get exercises
    exercises = await db.exercises.find(query).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for ex in exercises:
        result.append({
            "_id": str(ex["_id"]),
            "name": ex.get("name", ""),
            "aliases": ex.get("aliases", []),
            "equipment": ex.get("equipment", []),
            "muscle_group": ex.get("muscle_group", ""),
            "thumbnail_url": ex.get("thumbnail_url", ""),
            "video_url": ex.get("video_url", ""),
            "cues": ex.get("cues", []),
            "mistakes": ex.get("mistakes", []),
            "created_at": ex.get("created_at").isoformat() if ex.get("created_at") else None
        })
    
    return {
        "exercises": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }

@api_router.post("/admin/grant-access")
async def grant_admin_access(
    request: Request,
    body: Optional[dict] = None,
    current_user_id: str = Depends(require_admin)
):
    """
    Grant admin access to a user by username.
    If no username provided, grants to current user (legacy behavior).
    Only accessible by existing admins.
    """
    # Get request info for audit
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Parse body if provided
    target_username = None
    if body and isinstance(body, dict):
        target_username = body.get("username")
    
    # Get current admin user for audit
    admin_user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    
    if target_username:
        # Grant to specified user
        target_user = await db.users.find_one({"username": {"$regex": f"^{target_username}$", "$options": "i"}})
        if not target_user:
            await log_admin_action(
                admin_user_id=current_user_id,
                action="grant_access",
                endpoint="/admin/grant-access",
                request_body_redacted={"target_username": target_username},
                status_code=404,
                result_summary=f"User not found: {target_username}",
                ip_address=ip_address,
                user_agent=user_agent
            )
            raise HTTPException(status_code=404, detail=f"User '{target_username}' not found")
        
        target_user_id = str(target_user["_id"])
    else:
        # Legacy: grant to current user (self-grant)
        target_user = admin_user
        target_user_id = current_user_id
        target_username = target_user.get("username", "unknown")
    
    # Check if already admin
    if target_user.get("is_admin"):
        await log_admin_action(
            admin_user_id=current_user_id,
            action="grant_access",
            endpoint="/admin/grant-access",
            request_body_redacted={"target_username": target_username},
            status_code=200,
            result_summary=f"User already admin: {target_username}",
            ip_address=ip_address,
            user_agent=user_agent
        )
        return {"message": f"User '{target_username}' already has admin access", "is_admin": True, "user_id": target_user_id}
    
    # Grant admin access
    await db.users.update_one(
        {"_id": ObjectId(target_user_id)},
        {"$set": {"is_admin": True}}
    )
    
    # Audit log
    await log_admin_action(
        admin_user_id=current_user_id,
        action="grant_access",
        endpoint="/admin/grant-access",
        request_body_redacted={"target_username": target_username, "target_user_id": target_user_id},
        status_code=200,
        result_summary=f"Admin access granted to {target_username}",
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    logger.info(f"Admin access granted to user {target_username} ({target_user_id}) by {admin_user.get('username')}")
    
    return {"message": f"Admin access granted to '{target_username}'", "is_admin": True, "user_id": target_user_id}

@api_router.post("/admin/bootstrap-staging")
async def bootstrap_staging(
    current_user_id: str = Depends(require_admin)
):
    """
    Safe bootstrap endpoint that UPSERTS specific data without deleting collections.
    Uses UPSERT-by-stable-key to ensure content is updated, not just counted.
    
    Scoped to only update:
    1. exercises - ensure cues/mistakes/aliases fields are present
    2. featured "Cardio Based" workout - update to correct content
    3. featured_config - ensure carousel points to correct workouts
    
    Returns detailed verification report.
    """
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    # Capture before state
    exercises_before = await db.exercises.count_documents({})
    featured_workouts_before = await db.featured_workouts.count_documents({})
    
    results = {
        "meta": {
            "env": APP_ENV,
            "git_sha": GIT_SHA,
            "deployed_at": DEPLOYED_AT,
            "seed_version": SEED_VERSION,
            "mongo_db_name": db.name
        },
        "exercises_before": exercises_before,
        "exercises_after": 0,
        "exercises_upserted": 0,
        "sample_exercise": None,
        "featured_cardio": None,
        "featured_config_snapshot": None,
        "admin_grant": None
    }
    
    # Step 1: Grant admin access to current user
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if user and not user.get("is_admin"):
        await db.users.update_one(
            {"_id": ObjectId(current_user_id)},
            {"$set": {"is_admin": True}}
        )
        results["admin_grant"] = {"granted": True, "username": user.get("username")}
        logger.info(f"🔑 Bootstrap: Admin access granted to {user.get('username')}")
    else:
        results["admin_grant"] = {"granted": False, "message": "Already admin or user not found"}
    
    # Step 2: UPSERT all exercises by name (stable key)
    upserted_count = 0
    for ex in PREVIEW_EXERCISES:
        ex_data = {**ex, "updated_at": datetime.now(timezone.utc)}
        # Use name as stable key for upsert
        stable_key = ex.get("name")
        if stable_key:
            result = await db.exercises.update_one(
                {"name": stable_key},
                {"$set": ex_data},
                upsert=True
            )
            if result.upserted_id or result.modified_count > 0:
                upserted_count += 1
    
    results["exercises_upserted"] = upserted_count
    results["exercises_after"] = await db.exercises.count_documents({})
    logger.info(f"🌱 Bootstrap: Upserted {upserted_count} exercises")
    
    # Get sample exercise to verify cues/mistakes
    sample_ex = await db.exercises.find_one({"cues": {"$exists": True, "$ne": []}})
    if sample_ex:
        results["sample_exercise"] = {
            "name": sample_ex.get("name"),
            "video_url": sample_ex.get("video_url", "")[:100] + "..." if sample_ex.get("video_url") else None,
            "cues_count": len(sample_ex.get("cues", [])),
            "cues": sample_ex.get("cues", [])[:3],  # First 3 cues
            "mistakes_count": len(sample_ex.get("mistakes", [])),
            "mistakes": sample_ex.get("mistakes", [])[:3]  # First 3 mistakes
        }
    
    # Step 3: UPSERT featured workouts by title (stable key)
    featured_workout_ids = []
    for workout in PREVIEW_FEATURED_WORKOUTS:
        workout_data = {**workout, "updated_at": datetime.now(timezone.utc)}
        workout_data.pop("_id", None)  # Remove source _id
        stable_key = workout.get("title")
        if stable_key:
            # Upsert by title
            result = await db.featured_workouts.update_one(
                {"title": stable_key},
                {"$set": workout_data},
                upsert=True
            )
            # Get the workout ID (either upserted or existing)
            if result.upserted_id:
                featured_workout_ids.append(str(result.upserted_id))
            else:
                existing = await db.featured_workouts.find_one({"title": stable_key})
                if existing:
                    featured_workout_ids.append(str(existing["_id"]))
    
    logger.info(f"🌱 Bootstrap: Upserted {len(PREVIEW_FEATURED_WORKOUTS)} featured workouts")
    
    # Get the Cardio Based workout details for verification
    cardio_workout = await db.featured_workouts.find_one({"title": "Cardio Based"})
    if cardio_workout:
        exercises_list = cardio_workout.get("exercises", [])
        results["featured_cardio"] = {
            "id": str(cardio_workout["_id"]),
            "title": cardio_workout.get("title"),
            "mood": cardio_workout.get("mood"),
            "image_url": cardio_workout.get("heroImageUrl", "")[:100] + "..." if cardio_workout.get("heroImageUrl") else None,
            "exercises_count": len(exercises_list),
            "exercise_names": [e.get("name") for e in exercises_list[:5]],
            "has_battle_plan": any(e.get("battlePlan") for e in exercises_list)
        }
    
    # Step 4: Update featured_config to reference the correct workout IDs
    config_update = {
        "schemaVersion": 1,
        "featuredWorkoutIds": featured_workout_ids,
        "ttlHours": 12,
        "updatedAt": datetime.now(timezone.utc).isoformat()
    }
    await db.featured_config.update_one(
        {"_id": "main"},
        {"$set": config_update},
        upsert=True
    )
    results["featured_config_snapshot"] = {
        "config_id": "main",
        "workout_ids_count": len(featured_workout_ids),
        "workout_ids": featured_workout_ids
    }
    logger.info(f"🔧 Bootstrap: Featured config updated with {len(featured_workout_ids)} workout IDs")
    
    # Step 5: Record seed state in DB
    await db.system.update_one(
        {"_id": "seed_state"},
        {
            "$set": {
                "version": SEED_VERSION,
                "applied_at": datetime.now(timezone.utc).isoformat(),
                "applied_by": current_user_id
            }
        },
        upsert=True
    )
    
    return {
        "success": True,
        "message": f"Bootstrap complete - {upserted_count} exercises upserted, {len(PREVIEW_FEATURED_WORKOUTS)} featured workouts upserted",
        "results": results
    }

@api_router.post("/admin/exercises/upload-video")
async def upload_exercise_video(
    file: UploadFile = File(...),
    current_user_id: str = Depends(require_admin)
):
    """Upload an exercise video to Cloudinary"""
    # No admin check - admin dashboard is only accessible through mood profile
    
    try:
        # Read file content
        content = await file.read()
        
        # Generate a clean public_id from filename
        import re
        import time
        filename = file.filename or "exercise_video"
        clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', filename.rsplit('.', 1)[0])
        clean_name = re.sub(r'_+', '_', clean_name)[:80]
        
        public_id = f"exercise_library/{clean_name}"
        
        # Upload to Cloudinary with eager thumbnail generation (synchronous)
        result = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type="video",
            overwrite=True,
            eager=[
                {"format": "jpg", "transformation": [{"start_offset": "1", "width": 400, "height": 400, "crop": "fill"}]}
            ],
            eager_async=False  # Wait for thumbnail to be generated before returning
        )
        
        video_url = result.get("secure_url")
        
        # Use the eagerly generated thumbnail if available
        thumbnail_url = None
        if result.get("eager") and len(result["eager"]) > 0:
            thumbnail_url = result["eager"][0].get("secure_url")
        else:
            # Fallback: Generate thumbnail URL manually (may not be immediately available)
            # Add timestamp to bust cache on client
            timestamp = int(time.time())
            thumbnail_url = f"https://res.cloudinary.com/{os.environ.get('CLOUDINARY_CLOUD_NAME')}/video/upload/so_1.0,w_400,h_400,c_fill/{result['public_id']}.jpg?t={timestamp}"
        
        return {
            "success": True,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "public_id": result["public_id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading video: {str(e)}")

@api_router.get("/exercises/search")
async def search_exercises(
    q: str = "",
    limit: int = 10
):
    """
    Search exercises by name and aliases.
    Only returns results when query matches at least one complete word or word prefix (min 3 chars).
    Case-insensitive, word-boundary matching.
    """
    if not q.strip():
        return {"exercises": []}
    
    # Sanitize and prepare search query
    search_query = q.strip().lower()
    
    # Require minimum 3 characters for search to avoid too many partial matches
    if len(search_query) < 3:
        return {"exercises": []}
    
    # Word boundary regex - matches whole words or word starts
    import re
    escaped_query = re.escape(search_query)
    word_regex = f"\\b{escaped_query}"
    
    # Build search pipeline - search in name and aliases with word boundaries
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"name": {"$regex": word_regex, "$options": "i"}},
                    {"aliases": {"$elemMatch": {"$regex": word_regex, "$options": "i"}}}
                ]
            }
        },
        {
            "$addFields": {
                # Score by exact word match in name (higher priority)
                "name_match_score": {
                    "$cond": [
                        # Exact match on a word in name
                        {"$regexMatch": {"input": {"$toLower": "$name"}, "regex": f"\\b{escaped_query}\\b"}},
                        3,  # Exact word match - highest score
                        {"$cond": [
                            # Word starts with query
                            {"$regexMatch": {"input": {"$toLower": "$name"}, "regex": f"\\b{escaped_query}"}},
                            2,  # Word starts with query
                            0
                        ]}
                    ]
                }
            }
        },
        {"$sort": {"name_match_score": -1, "name": 1}},
        {"$limit": limit},
        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "name": 1,
                "aliases": 1,
                "equipment": 1,
                "thumbnail_url": 1,
                "video_url": 1,
                "cues": 1,
                "mistakes": 1
            }
        }
    ]
    
    exercises = await db.exercises.aggregate(pipeline).to_list(limit)
    
    return {"exercises": exercises, "count": len(exercises)}

@api_router.get("/exercises/popular")
async def get_popular_exercises(limit: int = 6):
    """Get popular/common exercises"""
    popular_names = ["Squat", "Bench Press", "Barbell Row", "Deadlift", "Lunge", "Lat Pulldown"]
    
    exercises = await db.exercises.find(
        {"name": {"$in": popular_names}}
    ).limit(limit).to_list(limit)
    
    # Format response
    result = []
    for ex in exercises:
        result.append({
            "_id": str(ex["_id"]),
            "name": ex.get("name", ""),
            "aliases": ex.get("aliases", []),
            "equipment": ex.get("equipment", []),
            "thumbnail_url": ex.get("thumbnail_url", ""),
            "video_url": ex.get("video_url", ""),
            "cues": ex.get("cues", []),
            "mistakes": ex.get("mistakes", [])
        })
    
    return {"exercises": result}

@api_router.get("/exercises/{exercise_id}")
async def get_exercise_by_id(exercise_id: str):
    """Get a single exercise by ID"""
    try:
        exercise = await db.exercises.find_one({"_id": ObjectId(exercise_id)})
        if not exercise:
            raise HTTPException(status_code=404, detail="Exercise not found")
        
        return {
            "_id": str(exercise["_id"]),
            "name": exercise.get("name", ""),
            "aliases": exercise.get("aliases", []),
            "equipment": exercise.get("equipment", []),
            "thumbnail_url": exercise.get("thumbnail_url", ""),
            "video_url": exercise.get("video_url", ""),
            "cues": exercise.get("cues", []),
            "mistakes": exercise.get("mistakes", [])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid exercise ID: {str(e)}")

@api_router.post("/exercises")
async def create_exercise(
    exercise: ExerciseCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new exercise"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    exercise_doc = {
        "name": exercise.name,
        "aliases": exercise.aliases,
        "equipment": exercise.equipment,
        "muscle_group": exercise.muscle_group,
        "thumbnail_url": exercise.thumbnail_url,
        "video_url": exercise.video_url,
        "cues": exercise.cues,
        "mistakes": exercise.mistakes or [],
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user_id
    }
    
    result = await db.exercises.insert_one(exercise_doc)
    
    return {
        "success": True,
        "exercise_id": str(result.inserted_id),
        "message": "Exercise created successfully"
    }

@api_router.post("/exercises/bulk")
async def create_exercises_bulk(
    exercises: List[ExerciseCreate],
    current_user_id: str = Depends(get_current_user)
):
    """Bulk create exercises (admin only)"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    exercise_docs = []
    for exercise in exercises:
        exercise_docs.append({
            "name": exercise.name,
            "aliases": exercise.aliases,
            "equipment": exercise.equipment,
            "muscle_group": exercise.muscle_group,
            "thumbnail_url": exercise.thumbnail_url,
            "video_url": exercise.video_url,
            "cues": exercise.cues,
            "mistakes": exercise.mistakes or [],
            "created_at": datetime.now(timezone.utc),
            "created_by": current_user_id
        })
    
    result = await db.exercises.insert_many(exercise_docs)
    
    return {
        "success": True,
        "count": len(result.inserted_ids),
        "message": f"Created {len(result.inserted_ids)} exercises"
    }

@api_router.put("/exercises/{exercise_id}")
async def update_exercise(
    exercise_id: str,
    exercise: ExerciseCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Update an exercise"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        result = await db.exercises.update_one(
            {"_id": ObjectId(exercise_id)},
            {
                "$set": {
                    "name": exercise.name,
                    "aliases": exercise.aliases,
                    "equipment": exercise.equipment,
                    "muscle_group": exercise.muscle_group,
                    "thumbnail_url": exercise.thumbnail_url,
                    "video_url": exercise.video_url,
                    "cues": exercise.cues,
                    "mistakes": exercise.mistakes or [],
                    "updated_at": datetime.now(timezone.utc),
                    "updated_by": current_user_id
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Exercise not found")
        
        return {"success": True, "message": "Exercise updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error updating exercise: {str(e)}")

@api_router.delete("/exercises/{exercise_id}")
async def delete_exercise(
    exercise_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete an exercise"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        result = await db.exercises.delete_one({"_id": ObjectId(exercise_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Exercise not found")
        
        return {"success": True, "message": "Exercise deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error deleting exercise: {str(e)}")

# ==================== END EXERCISE LOOKUP API ====================

# ==================== FEATURED WORKOUTS API ====================

# Pydantic models for Featured Workouts
class FeaturedWorkoutExercise(BaseModel):
    exerciseId: str
    order: int
    sets: Optional[int] = None
    reps: Optional[str] = None
    restSec: Optional[int] = None
    notes: Optional[str] = None
    # Allow inline exercise data (for backwards compatibility)
    name: Optional[str] = None
    equipment: Optional[str] = None
    description: Optional[str] = None
    battlePlan: Optional[str] = None
    duration: Optional[str] = None
    imageUrl: Optional[str] = None
    intensityReason: Optional[str] = None
    difficulty: Optional[str] = None
    workoutType: Optional[str] = None
    moodCard: Optional[str] = None
    moodTips: Optional[List[Dict[str, str]]] = None

class FeaturedWorkoutCreate(BaseModel):
    title: str
    subtitle: Optional[str] = None
    mood: str
    difficulty: Optional[str] = "Intermediate"
    durationMin: Optional[int] = None
    duration: Optional[str] = None
    badge: Optional[str] = None
    heroImageUrl: Optional[str] = None
    exercises: List[FeaturedWorkoutExercise]

class FeaturedWorkoutUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    mood: Optional[str] = None
    difficulty: Optional[str] = None
    durationMin: Optional[int] = None
    duration: Optional[str] = None
    badge: Optional[str] = None
    heroImageUrl: Optional[str] = None
    exercises: Optional[List[FeaturedWorkoutExercise]] = None

class FeaturedConfigUpdate(BaseModel):
    featuredWorkoutIds: List[str]
    ttlHours: Optional[int] = 12

# Public endpoint - no auth required for clients to fetch featured config
@api_router.get("/featured/config")
async def get_featured_config():
    """Get the current featured workouts configuration (public endpoint)"""
    config = await db.featured_config.find_one({"_id": "main"})
    
    if not config:
        # Return default/empty config
        return {
            "schemaVersion": 1,
            "featuredWorkoutIds": [],
            "ttlHours": 12,
            "updatedAt": None
        }
    
    return {
        "schemaVersion": config.get("schemaVersion", 1),
        "featuredWorkoutIds": config.get("featuredWorkoutIds", []),
        "ttlHours": config.get("ttlHours", 12),
        "updatedAt": config.get("updatedAt")
    }


@api_router.get("/featured/bundle")
async def get_featured_bundle():
    """Combined config + workouts in a single response (eliminates waterfall).
    Used by guests and first-load to get everything in one round trip."""
    config = await db.featured_config.find_one({"_id": "main"})
    
    config_data = {
        "schemaVersion": config.get("schemaVersion", 1) if config else 1,
        "featuredWorkoutIds": config.get("featuredWorkoutIds", []) if config else [],
        "ttlHours": config.get("ttlHours", 12) if config else 12,
        "updatedAt": config.get("updatedAt") if config else None,
    }
    
    workout_ids = config_data["featuredWorkoutIds"]
    ordered_workouts = []
    
    if workout_ids:
        object_ids = []
        for id_str in workout_ids:
            try:
                object_ids.append(ObjectId(id_str))
            except Exception:
                continue
        
        workouts = await db.featured_workouts.find(
            {"_id": {"$in": object_ids}}
        ).to_list(50)
        
        id_to_workout = {}
        for w in workouts:
            w["_id"] = str(w["_id"])
            id_to_workout[w["_id"]] = w
        
        for id_str in workout_ids:
            if id_str in id_to_workout:
                ordered_workouts.append(id_to_workout[id_str])
    
    return {
        "config": config_data,
        "workouts": ordered_workouts,
    }

# Public endpoint - fetch workouts by IDs
@api_router.post("/featured/workouts/batch")
async def get_featured_workouts_batch(ids: List[str]):
    """Fetch multiple featured workouts by their IDs (public endpoint)"""
    if not ids:
        return {"workouts": []}
    
    # Convert string IDs to ObjectIds, filter invalid ones
    object_ids = []
    for id_str in ids:
        try:
            object_ids.append(ObjectId(id_str))
        except:
            continue
    
    workouts = await db.featured_workouts.find(
        {"_id": {"$in": object_ids}}
    ).to_list(50)
    
    # Maintain order from input IDs
    id_to_workout = {}
    for w in workouts:
        w["_id"] = str(w["_id"])
        id_to_workout[w["_id"]] = w
    
    ordered_workouts = []
    for id_str in ids:
        if id_str in id_to_workout:
            ordered_workouts.append(id_to_workout[id_str])
    
    return {"workouts": ordered_workouts}

# Admin endpoint - update featured config (order of featured workouts)
@api_router.put("/featured/config")
async def update_featured_config(
    config: FeaturedConfigUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update the featured workouts configuration (admin only)"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    # Validate that all workout IDs exist
    for workout_id in config.featuredWorkoutIds:
        try:
            workout = await db.featured_workouts.find_one({"_id": ObjectId(workout_id)})
            if not workout:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Workout ID {workout_id} not found"
                )
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid workout ID {workout_id}: {str(e)}"
            )
    
    # Update or create config
    update_doc = {
        "schemaVersion": 1,
        "featuredWorkoutIds": config.featuredWorkoutIds,
        "ttlHours": config.ttlHours or 12,
        "updatedAt": datetime.now(timezone.utc),
        "updatedBy": current_user_id
    }
    
    await db.featured_config.update_one(
        {"_id": "main"},
        {"$set": update_doc},
        upsert=True
    )
    
    return {
        "success": True,
        "message": "Featured config updated successfully",
        "config": update_doc
    }

# Admin endpoint - list all featured workouts
@api_router.get("/featured/workouts")
async def list_featured_workouts(
    current_user_id: str = Depends(get_current_user)
):
    """List all featured workouts"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    workouts = await db.featured_workouts.find().sort("created_at", -1).to_list(100)
    
    result = []
    for w in workouts:
        w["_id"] = str(w["_id"])
        result.append(w)
    
    return {"workouts": result}

# Admin endpoint - create a new featured workout
@api_router.post("/featured/workouts")
async def create_featured_workout(
    workout: FeaturedWorkoutCreate,
    current_user_id: str = Depends(get_current_user)
):
    """Create a new featured workout (admin only)"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    # Validate exercises have either exerciseId or inline data
    for ex in workout.exercises:
        if not ex.exerciseId and not ex.name:
            raise HTTPException(
                status_code=400,
                detail="Each exercise must have either exerciseId or inline name"
            )
    
    workout_doc = {
        "title": workout.title,
        "subtitle": workout.subtitle,
        "mood": workout.mood,
        "difficulty": workout.difficulty,
        "durationMin": workout.durationMin,
        "duration": workout.duration,
        "badge": workout.badge,
        "heroImageUrl": workout.heroImageUrl,
        "exercises": [ex.dict() for ex in workout.exercises],
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user_id,
        "updated_at": datetime.now(timezone.utc)
    }
    
    result = await db.featured_workouts.insert_one(workout_doc)
    
    return {
        "success": True,
        "workout_id": str(result.inserted_id),
        "message": "Featured workout created successfully"
    }

# Admin endpoint - get a single featured workout
@api_router.get("/featured/workouts/{workout_id}")
async def get_featured_workout(
    workout_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get a single featured workout (admin only)"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        workout = await db.featured_workouts.find_one({"_id": ObjectId(workout_id)})
        if not workout:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        workout["_id"] = str(workout["_id"])
        return {"workout": workout}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

# Admin endpoint - update a featured workout
@api_router.put("/featured/workouts/{workout_id}")
async def update_featured_workout(
    workout_id: str,
    workout: FeaturedWorkoutUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update an existing featured workout (admin only)"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        existing = await db.featured_workouts.find_one({"_id": ObjectId(workout_id)})
        if not existing:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        update_doc = {"updated_at": datetime.now(timezone.utc)}
        
        if workout.title is not None:
            update_doc["title"] = workout.title
        if workout.subtitle is not None:
            update_doc["subtitle"] = workout.subtitle
        if workout.mood is not None:
            update_doc["mood"] = workout.mood
        if workout.difficulty is not None:
            update_doc["difficulty"] = workout.difficulty
        if workout.durationMin is not None:
            update_doc["durationMin"] = workout.durationMin
        if workout.duration is not None:
            update_doc["duration"] = workout.duration
        if workout.badge is not None:
            update_doc["badge"] = workout.badge
        if workout.heroImageUrl is not None:
            update_doc["heroImageUrl"] = workout.heroImageUrl
        if workout.exercises is not None:
            update_doc["exercises"] = [ex.dict() for ex in workout.exercises]
        
        await db.featured_workouts.update_one(
            {"_id": ObjectId(workout_id)},
            {"$set": update_doc}
        )
        
        return {"success": True, "message": "Workout updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

# Admin endpoint - delete a featured workout
@api_router.delete("/featured/workouts/{workout_id}")
async def delete_featured_workout(
    workout_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a featured workout (admin only)"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    try:
        # Check if workout is in featured config
        config = await db.featured_config.find_one({"_id": "main"})
        if config and workout_id in config.get("featuredWorkoutIds", []):
            raise HTTPException(
                status_code=400,
                detail="Cannot delete workout that is currently featured. Remove from featured list first."
            )
        
        result = await db.featured_workouts.delete_one({"_id": ObjectId(workout_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Workout not found")
        
        return {"success": True, "message": "Workout deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error: {str(e)}")

# Admin endpoint - seed featured workouts with default data
@api_router.post("/admin/seed-featured-workouts")
async def seed_featured_workouts(
    request: Request,
    current_user_id: str = Depends(require_admin)
):
    """
    Seed the featured workouts collection with default data.
    Use this to initialize the featured workouts in a new deployment.
    Only accessible by admin users.
    """
    # Get request info for audit
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Check admin allowlist (redundant with require_admin but explicit)
    if not await is_admin_allowed(current_user_id):
        await log_admin_action(
            admin_user_id=current_user_id,
            action="seed_featured_workouts",
            endpoint="/admin/seed-featured-workouts",
            request_body_redacted={},
            status_code=403,
            result_summary="Admin access denied",
            ip_address=ip_address,
            user_agent=user_agent
        )
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    # Check if already has workouts
    existing_count = await db.featured_workouts.count_documents({})
    
    # Default featured workouts data
    default_workouts = [
        {
            "title": "Cardio Based",
            "subtitle": "High-energy fat burning",
            "mood": "Sweat / Burn Fat",
            "difficulty": "Intermediate",
            "durationMin": 30,
            "duration": "25-35 min",
            "badge": "Top pick",
            "heroImageUrl": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
            "exercises": [
                {"exerciseId": "cardio-1", "order": 1, "name": "Jump Rope", "sets": 3, "reps": "60 sec", "restSec": 30, "equipment": "Jump Rope", "imageUrl": "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400", "battlePlan": "Keep a steady rhythm, land softly on balls of feet"},
                {"exerciseId": "cardio-2", "order": 2, "name": "Burpees", "sets": 3, "reps": "12", "restSec": 45, "equipment": "None", "imageUrl": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", "battlePlan": "Explosive jump at the top, controlled descent"},
                {"exerciseId": "cardio-3", "order": 3, "name": "Mountain Climbers", "sets": 3, "reps": "30 sec", "restSec": 30, "equipment": "None", "imageUrl": "https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400", "battlePlan": "Drive knees to chest rapidly, keep core tight"}
            ],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "title": "Strength Builder",
            "subtitle": "Build lean muscle",
            "mood": "Get Strong",
            "difficulty": "Intermediate",
            "durationMin": 45,
            "duration": "40-50 min",
            "badge": "Popular",
            "heroImageUrl": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=800",
            "exercises": [
                {"exerciseId": "strength-1", "order": 1, "name": "Barbell Squat", "sets": 4, "reps": "8-10", "restSec": 90, "equipment": "Barbell", "imageUrl": "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400", "battlePlan": "Chest up, drive through heels, go below parallel"},
                {"exerciseId": "strength-2", "order": 2, "name": "Bench Press", "sets": 4, "reps": "8-10", "restSec": 90, "equipment": "Barbell, Bench", "imageUrl": "https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=400", "battlePlan": "Arch back slightly, lower bar to mid-chest"},
                {"exerciseId": "strength-3", "order": 3, "name": "Deadlift", "sets": 3, "reps": "6-8", "restSec": 120, "equipment": "Barbell", "imageUrl": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400", "battlePlan": "Flat back, push through floor, lockout at top"}
            ],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "title": "HIIT Express",
            "subtitle": "Quick & intense",
            "mood": "Quick Session",
            "difficulty": "Advanced",
            "durationMin": 20,
            "duration": "15-20 min",
            "badge": "Quick",
            "heroImageUrl": "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800",
            "exercises": [
                {"exerciseId": "hiit-1", "order": 1, "name": "Box Jumps", "sets": 4, "reps": "10", "restSec": 30, "equipment": "Plyo Box", "imageUrl": "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=400", "battlePlan": "Explode up, land softly with bent knees"},
                {"exerciseId": "hiit-2", "order": 2, "name": "Battle Ropes", "sets": 3, "reps": "30 sec", "restSec": 30, "equipment": "Battle Ropes", "imageUrl": "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400", "battlePlan": "Create waves from shoulders, core engaged"},
                {"exerciseId": "hiit-3", "order": 3, "name": "Kettlebell Swings", "sets": 3, "reps": "15", "restSec": 30, "equipment": "Kettlebell", "imageUrl": "https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=400", "battlePlan": "Hip hinge power, squeeze glutes at top"}
            ],
            "created_at": datetime.now(timezone.utc)
        },
        {
            "title": "Upper Body Focus",
            "subtitle": "Arms, chest & back",
            "mood": "Get Strong",
            "difficulty": "Intermediate",
            "durationMin": 40,
            "duration": "35-45 min",
            "badge": None,
            "heroImageUrl": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800",
            "exercises": [
                {"exerciseId": "upper-1", "order": 1, "name": "Pull-ups", "sets": 4, "reps": "8-12", "restSec": 60, "equipment": "Pull-up Bar", "imageUrl": "https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400", "battlePlan": "Full range of motion, controlled descent"},
                {"exerciseId": "upper-2", "order": 2, "name": "Dumbbell Rows", "sets": 3, "reps": "12 each", "restSec": 45, "equipment": "Dumbbells", "imageUrl": "https://images.unsplash.com/photo-1534368420009-621bfab424a8?w=400", "battlePlan": "Pull to hip, squeeze shoulder blade"},
                {"exerciseId": "upper-3", "order": 3, "name": "Push-ups", "sets": 3, "reps": "15-20", "restSec": 45, "equipment": "None", "imageUrl": "https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400", "battlePlan": "Core tight, full range of motion"}
            ],
            "created_at": datetime.now(timezone.utc)
        }
    ]
    
    # Insert workouts
    inserted_ids = []
    for workout in default_workouts:
        # Check if similar workout exists
        existing = await db.featured_workouts.find_one({"title": workout["title"]})
        if not existing:
            result = await db.featured_workouts.insert_one(workout)
            inserted_ids.append(str(result.inserted_id))
        else:
            inserted_ids.append(str(existing["_id"]))
    
    # Update featured config to include these workouts
    await db.featured_config.update_one(
        {"_id": "main"},
        {
            "$set": {
                "schemaVersion": 1,
                "featuredWorkoutIds": inserted_ids,
                "ttlHours": 12,
                "updatedAt": datetime.now(timezone.utc).isoformat()
            }
        },
        upsert=True
    )
    
    logger.info(f"Seeded {len(inserted_ids)} featured workouts for admin {current_user_id}")
    
    # Audit log
    await log_admin_action(
        admin_user_id=current_user_id,
        action="seed_featured_workouts",
        endpoint="/admin/seed-featured-workouts",
        request_body_redacted={},
        status_code=200,
        result_summary=f"Seeded {len(inserted_ids)} workouts (existing: {existing_count})",
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return {
        "success": True,
        "message": f"Seeded {len(inserted_ids)} featured workouts",
        "workout_ids": inserted_ids,
        "existing_count_before": existing_count
    }

# ==================== END FEATURED WORKOUTS API ====================

# ==================== CHOOSE FOR ME API ====================

class GeneratedWorkoutItem(BaseModel):
    name: str
    duration: str
    equipment: str
    description: Optional[str] = None
    imageUrl: Optional[str] = None

class GeneratedCartData(BaseModel):
    id: str
    workouts: List[GeneratedWorkoutItem]
    totalDuration: int
    intensity: str
    moodCard: str
    workoutType: str

class SaveGeneratedWorkoutsRequest(BaseModel):
    carts: List[GeneratedCartData]
    moodCard: str
    intensity: str

@api_router.get("/choose-for-me/usage")
async def get_choose_for_me_usage(
    current_user_id: str = Depends(get_current_user)
):
    """Get the user's Choose for Me usage for today and their generated workouts"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Check if user is admin (officialmoodapp) - unlimited generations
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    is_admin = user and user.get("username") == "officialmoodapp"
    
    # Count today's usage
    usage_count = await db.choose_for_me_usage.count_documents({
        "user_id": current_user_id,
        "created_at": {"$gte": today_start}
    })
    
    # Get today's generated workouts
    generated_workouts = await db.generated_workouts.find({
        "user_id": current_user_id,
        "created_at": {"$gte": today_start}
    }).sort("created_at", -1).to_list(10)
    
    # Convert ObjectId to string
    for workout in generated_workouts:
        workout["_id"] = str(workout["_id"])
    
    # Admin gets unlimited
    if is_admin:
        return {
            "usage_count": usage_count,
            "remaining_uses": 999,
            "can_generate": True,
            "is_admin": True,
            "generated_workouts": generated_workouts,
            "reset_time": (today_start + timedelta(days=1)).isoformat()
        }
    
    return {
        "usage_count": usage_count,
        "remaining_uses": max(0, 3 - usage_count),
        "can_generate": usage_count < 3,
        "generated_workouts": generated_workouts,
        "reset_time": (today_start + timedelta(days=1)).isoformat()
    }

@api_router.post("/choose-for-me/generate")
async def record_choose_for_me_usage(
    request: SaveGeneratedWorkoutsRequest,
    current_user_id: str = Depends(get_current_user)
):
    """Record a Choose for Me usage and save the generated workouts"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Check if user is admin (officialmoodapp) - unlimited generations
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    is_admin = user and user.get("username") == "officialmoodapp"
    
    # Get current usage count
    usage_count = await db.choose_for_me_usage.count_documents({
        "user_id": current_user_id,
        "created_at": {"$gte": today_start}
    })
    
    # Check usage limit (skip for admin)
    if not is_admin and usage_count >= 3:
        raise HTTPException(
            status_code=429,
            detail="Daily limit reached. You can only use Build for Me 3 times per day."
        )
    
    # Record the usage
    usage_record = {
        "user_id": current_user_id,
        "mood_card": request.moodCard,
        "intensity": request.intensity,
        "created_at": now
    }
    await db.choose_for_me_usage.insert_one(usage_record)
    
    # Save the generated workouts
    workout_record = {
        "user_id": current_user_id,
        "mood_card": request.moodCard,
        "intensity": request.intensity,
        "carts": [cart.dict() for cart in request.carts],
        "created_at": now
    }
    result = await db.generated_workouts.insert_one(workout_record)
    
    # Return appropriate remaining uses based on admin status
    new_usage_count = usage_count + 1
    remaining = 999 if is_admin else max(0, 3 - new_usage_count)
    
    return {
        "success": True,
        "usage_count": new_usage_count,
        "remaining_uses": remaining,
        "generated_workout_id": str(result.inserted_id)
    }

@api_router.get("/choose-for-me/history")
async def get_generated_workouts_history(
    current_user_id: str = Depends(get_current_user),
    limit: int = 10
):
    """Get the user's generated workouts history"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Get generated workouts from today (accessible ones)
    generated_workouts = await db.generated_workouts.find({
        "user_id": current_user_id,
        "created_at": {"$gte": today_start}
    }).sort("created_at", -1).to_list(limit)
    
    # Convert ObjectId to string
    for workout in generated_workouts:
        workout["_id"] = str(workout["_id"])
    
    return {
        "workouts": generated_workouts,
        "count": len(generated_workouts)
    }

@api_router.get("/choose-for-me/workout/{workout_id}")
async def get_generated_workout(
    workout_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Get a specific generated workout by ID"""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    try:
        workout = await db.generated_workouts.find_one({
            "_id": ObjectId(workout_id),
            "user_id": current_user_id,
            "created_at": {"$gte": today_start}  # Only today's workouts are accessible
        })
        
        if not workout:
            raise HTTPException(status_code=404, detail="Generated workout not found or no longer accessible")
        
        workout["_id"] = str(workout["_id"])
        return workout
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid workout ID: {str(e)}")

# ==================== END CHOOSE FOR ME API ====================

# ==================== BUILD FOR ME ANALYTICS API ====================

@api_router.get("/analytics/admin/build-for-me-stats")
async def get_build_for_me_stats(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get comprehensive Build for Me statistics for admin dashboard"""
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days) if days > 0 else datetime.min.replace(tzinfo=timezone.utc)
    
    try:
        # Total generations
        total_generations = await db.choose_for_me_usage.count_documents(
            {"created_at": {"$gte": cutoff}} if days > 0 else {}
        )
        
        # Unique users who used Build for Me
        unique_users_pipeline = [
            {"$match": {"created_at": {"$gte": cutoff}}} if days > 0 else {"$match": {}},
            {"$group": {"_id": "$user_id"}},
            {"$count": "count"}
        ]
        unique_users_result = await db.choose_for_me_usage.aggregate(unique_users_pipeline).to_list(1)
        unique_users = unique_users_result[0]["count"] if unique_users_result else 0
        
        # Generations by mood card
        mood_pipeline = [
            {"$match": {"created_at": {"$gte": cutoff}}} if days > 0 else {"$match": {}},
            {"$group": {"_id": "$mood_card", "count": {"$sum": 1}, "unique_users": {"$addToSet": "$user_id"}}},
            {"$project": {"_id": 1, "count": 1, "unique_users": {"$size": "$unique_users"}}},
            {"$sort": {"count": -1}}
        ]
        mood_results = await db.choose_for_me_usage.aggregate(mood_pipeline).to_list(20)
        
        mood_display_names = {
            "Sweat / burn fat": "Sweat",
            "sweat": "Sweat",
            "Muscle gainer": "Muscle",
            "muscle": "Muscle",
            "Get outside": "Outdoor",
            "outdoor": "Outdoor",
            "Calisthenics": "Calisthenics",
            "calisthenics": "Calisthenics",
            "I'm feeling lazy": "Lazy",
            "lazy": "Lazy",
            "Build explosion": "Explosive",
            "explosive": "Explosive",
            "Take me through the ringer": "Ringer",
            "ringer": "Ringer"
        }
        
        by_mood_card = []
        for r in mood_results:
            mood = r["_id"] or "Unknown"
            display_name = mood_display_names.get(mood, mood.split('/')[0].strip() if mood else "Unknown")
            by_mood_card.append({
                "mood": mood,
                "display_name": display_name,
                "count": r["count"],
                "unique_users": r["unique_users"]
            })
        
        # Generations by intensity
        intensity_pipeline = [
            {"$match": {"created_at": {"$gte": cutoff}}} if days > 0 else {"$match": {}},
            {"$group": {"_id": "$intensity", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        intensity_results = await db.choose_for_me_usage.aggregate(intensity_pipeline).to_list(10)
        by_intensity = [{"intensity": r["_id"] or "Unknown", "count": r["count"]} for r in intensity_results]
        
        # Today's generations
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_generations = await db.choose_for_me_usage.count_documents({"created_at": {"$gte": today_start}})
        
        return {
            "period_days": days,
            "total_generations": total_generations,
            "unique_users": unique_users,
            "today_generations": today_generations,
            "by_mood_card": by_mood_card,
            "by_intensity": by_intensity,
            "avg_per_user": round(total_generations / unique_users, 1) if unique_users > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Error getting Build for Me stats: {e}")
        return {
            "period_days": days,
            "total_generations": 0,
            "unique_users": 0,
            "today_generations": 0,
            "by_mood_card": [],
            "by_intensity": [],
            "avg_per_user": 0
        }

@api_router.get("/analytics/admin/custom-workouts-stats")
async def get_custom_workouts_stats(
    days: int = 30,
    current_user_id: str = Depends(require_admin)
):
    """Get statistics for custom workouts added to cart (non-Build for Me)"""
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days) if days > 0 else datetime.min.replace(tzinfo=timezone.utc)
    
    try:
        # Total custom workouts added
        total_custom = await db.user_events.count_documents({
            "event_type": "cart_item_added",
            "timestamp": {"$gte": cutoff} if days > 0 else {"$exists": True},
            "metadata.source": {"$ne": "build_for_me"}
        })
        
        # By mood card
        mood_pipeline = [
            {"$match": {
                "event_type": "cart_item_added",
                "timestamp": {"$gte": cutoff} if days > 0 else {"$exists": True},
                "metadata.source": {"$ne": "build_for_me"}
            }},
            {"$group": {"_id": "$metadata.moodCard", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        mood_results = await db.user_events.aggregate(mood_pipeline).to_list(20)
        by_mood = [{"mood": r["_id"] or "Unknown", "count": r["count"]} for r in mood_results]
        
        # Unique users
        users_pipeline = [
            {"$match": {
                "event_type": "cart_item_added",
                "timestamp": {"$gte": cutoff} if days > 0 else {"$exists": True},
                "metadata.source": {"$ne": "build_for_me"}
            }},
            {"$group": {"_id": "$user_id"}},
            {"$count": "count"}
        ]
        users_result = await db.user_events.aggregate(users_pipeline).to_list(1)
        unique_users = users_result[0]["count"] if users_result else 0
        
        return {
            "period_days": days,
            "total_custom_workouts": total_custom,
            "unique_users": unique_users,
            "by_mood_card": by_mood
        }
        
    except Exception as e:
        logger.error(f"Error getting custom workouts stats: {e}")
        return {
            "period_days": days,
            "total_custom_workouts": 0,
            "unique_users": 0,
            "by_mood_card": []
        }

# ==================== END BUILD FOR ME ANALYTICS API ====================

@api_router.get("/moderation/admin/stats")
async def get_moderation_stats(
    current_user_id: str = Depends(require_admin)
):
    """Get moderation statistics for admin dashboard"""
    
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_7d = now - timedelta(days=7)
    
    # Report stats
    pending_reports = await db.content_reports.count_documents({"status": "pending"})
    urgent_reports = await db.content_reports.count_documents({
        "status": "pending",
        "created_at": {"$lt": now - timedelta(hours=20)}
    })
    reports_24h = await db.content_reports.count_documents({"created_at": {"$gte": last_24h}})
    reports_7d = await db.content_reports.count_documents({"created_at": {"$gte": last_7d}})
    resolved_24h = await db.content_reports.count_documents({
        "reviewed_at": {"$gte": last_24h},
        "status": {"$in": ["action_taken", "dismissed"]}
    })
    
    # Block stats
    blocks_24h = await db.user_blocks.count_documents({"created_at": {"$gte": last_24h}})
    blocks_7d = await db.user_blocks.count_documents({"created_at": {"$gte": last_7d}})
    total_blocks = await db.user_blocks.count_documents({})
    
    # Banned users
    banned_users = await db.users.count_documents({"is_banned": True})
    
    # Reports by category
    category_pipeline = [
        {"$match": {"created_at": {"$gte": last_7d}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    category_stats = await db.content_reports.aggregate(category_pipeline).to_list(10)
    
    return {
        "reports": {
            "pending": pending_reports,
            "urgent": urgent_reports,
            "last_24h": reports_24h,
            "last_7d": reports_7d,
            "resolved_24h": resolved_24h
        },
        "blocks": {
            "last_24h": blocks_24h,
            "last_7d": blocks_7d,
            "total": total_blocks
        },
        "banned_users": banned_users,
        "reports_by_category": {item["_id"]: item["count"] for item in category_stats}
    }

# Content filtering on post creation - update the existing post endpoint
# This is a helper that will be called before creating posts

async def check_content_before_post(caption: str) -> dict:
    """Check content before allowing post creation"""
    result = check_content(caption, strict=True)
    return result

# ============================================
# NOTIFICATIONS API ENDPOINTS (Phase 1)
# ============================================

class DeviceTokenRegister(BaseModel):
    token: str
    platform: str  # 'ios', 'android', 'web'
    device_id: Optional[str] = None

class NotificationSettingsUpdate(BaseModel):
    notifications_enabled: Optional[bool] = None
    likes_enabled: Optional[bool] = None
    likes_from_following_only: Optional[bool] = None
    comments_enabled: Optional[bool] = None
    comments_from_following_only: Optional[bool] = None
    messages_enabled: Optional[bool] = None
    message_requests_enabled: Optional[bool] = None
    follows_enabled: Optional[bool] = None
    workout_reminders_enabled: Optional[bool] = None
    featured_workouts_enabled: Optional[bool] = None
    following_digest_enabled: Optional[bool] = None
    following_digest_frequency: Optional[str] = None
    featured_suggestions_enabled: Optional[bool] = None
    quiet_hours_enabled: Optional[bool] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    digest_time: Optional[str] = None
    timezone: Optional[str] = None

class MarkNotificationsRead(BaseModel):
    notification_ids: List[str]

@api_router.post("/notifications/device-token")
async def register_device_token(
    data: DeviceTokenRegister,
    current_user_id: str = Depends(get_current_user)
):
    """Register a device push token"""
    logger.info(f"📱 DEVICE-TOKEN register: user={current_user_id}, platform={data.platform}, token={data.token[:30]}...")
    notification_service = get_notification_service(db)
    result = await notification_service.register_device_token(
        user_id=current_user_id,
        token=data.token,
        platform=data.platform,
        device_id=data.device_id
    )
    logger.info(f"📱 DEVICE-TOKEN result: user={current_user_id}, status={result.get('status')}, id={result.get('id')}")
    return result

@api_router.delete("/notifications/device-token")
async def unregister_device_token(
    token: str,
    current_user_id: str = Depends(get_current_user)
):
    """Unregister a device push token"""
    notification_service = get_notification_service(db)
    success = await notification_service.unregister_device_token(current_user_id, token)
    return {"success": success}

@api_router.get("/notifications/settings")
async def get_notification_settings(
    current_user_id: str = Depends(get_current_user)
):
    """Get user's notification settings"""
    notification_service = get_notification_service(db)
    settings = await notification_service.get_user_settings(current_user_id)
    return settings

@api_router.put("/notifications/settings")
async def update_notification_settings(
    data: NotificationSettingsUpdate,
    current_user_id: str = Depends(get_current_user)
):
    """Update user's notification settings"""
    notification_service = get_notification_service(db)
    settings = await notification_service.update_user_settings(
        current_user_id,
        data.dict(exclude_none=True)
    )
    return settings

@api_router.get("/notifications")
async def get_notifications(
    limit: int = 50,
    skip: int = 0,
    unread_only: bool = False,
    current_user_id: str = Depends(get_current_user)
):
    """Get user's notifications with pagination"""
    notification_service = get_notification_service(db)
    notifications = await notification_service.get_notifications(
        user_id=current_user_id,
        limit=limit,
        skip=skip,
        unread_only=unread_only
    )
    logger.info(f"🔔 GET /notifications: user={current_user_id}, count={len(notifications)}, skip={skip}, unread_only={unread_only}")
    if notifications:
        sample = notifications[0]
        logger.info(f"🔔 GET /notifications sample[0]: id={sample.get('id')}, type={sample.get('type')}, body={str(sample.get('body',''))[:60]}")
    return {"notifications": notifications}

@api_router.get("/notifications/unread-count")
async def get_notifications_unread_count(
    current_user_id: str = Depends(get_current_user)
):
    """Get count of unread notifications"""
    notification_service = get_notification_service(db)
    count = await notification_service.get_unread_count(current_user_id)
    print(f"🔔 UNREAD-COUNT API: User {current_user_id} has {count} unread notifications")
    logger.info(f"unread-count: User {current_user_id} has {count} unread notifications")
    return {"unread_count": count}

@api_router.post("/notifications/mark-read")
async def mark_notifications_read(
    data: MarkNotificationsRead,
    current_user_id: str = Depends(get_current_user)
):
    """Mark specific notifications as read"""
    notification_service = get_notification_service(db)
    count = await notification_service.mark_as_read(current_user_id, data.notification_ids)
    return {"marked_count": count}

@api_router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(
    current_user_id: str = Depends(get_current_user)
):
    """Mark all notifications as read"""
    notification_service = get_notification_service(db)
    
    # Log before
    before_count = await notification_service.get_unread_count(current_user_id)
    logger.info(f"mark-all-read: User {current_user_id} has {before_count} unread before marking")
    
    count = await notification_service.mark_all_as_read(current_user_id)
    
    # Log after
    after_count = await notification_service.get_unread_count(current_user_id)
    logger.info(f"mark-all-read: Marked {count}, now {after_count} unread")
    
    return {"marked_count": count, "unread_after": after_count}

@api_router.delete("/notifications/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """Delete a notification"""
    notification_service = get_notification_service(db)
    success = await notification_service.delete_notification(current_user_id, notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"success": True}

@api_router.get("/notifications/copy-library")
async def get_suggestion_copy_library():
    """Get the copy library for featured suggestions (admin/debug)"""
    return {"copy": SUGGESTION_COPY_LIBRARY}

@api_router.post("/admin/backfill-notification-thumbnails")
async def admin_backfill_notification_thumbnails(
    current_user_id: str = Depends(require_admin)
):
    """
    One-time backfill: patch notifications missing metadata.post_thumbnail
    by looking up the post's cover_urls/media_urls.
    """
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required")

    notification_service = get_notification_service(db)

    cursor = db.notifications.find({
        "type": {"$in": ["like", "comment", "mention", "reply"]},
        "entity_id": {"$ne": None},
        "$or": [
            {"metadata.post_thumbnail": None},
            {"metadata.post_thumbnail": {"$exists": False}}
        ]
    })

    notifs = await cursor.to_list(500)
    patched = 0
    skipped = 0

    for n in notifs:
        entity_id = n.get("entity_id")
        if not entity_id:
            skipped += 1
            continue
        try:
            post = await db.posts.find_one({"_id": ObjectId(entity_id)})
        except Exception:
            skipped += 1
            continue
        if not post:
            skipped += 1
            continue

        cover_urls = post.get("cover_urls") or []
        media_urls = post.get("media_urls") or []
        # cover_urls may be a dict ({"0": url}) from React Native
        if isinstance(cover_urls, dict):
            thumbnail = cover_urls.get("0") or cover_urls.get(0) or next(iter(cover_urls.values()), None)
        elif isinstance(cover_urls, list) and cover_urls:
            thumbnail = cover_urls[0]
        elif isinstance(media_urls, list) and media_urls:
            thumbnail = media_urls[0]
        else:
            thumbnail = None

        if not thumbnail:
            skipped += 1
            continue

        # If video, generate Cloudinary still frame
        if "/video/" in thumbnail and "/video/upload/" in thumbnail:
            thumbnail = thumbnail.replace("/video/upload/", "/video/upload/so_0,f_jpg,w_400/")

        await db.notifications.update_one(
            {"_id": n["_id"]},
            {"$set": {"metadata.post_thumbnail": thumbnail}}
        )
        patched += 1

    logger.info(f"🔔 Backfill thumbnails: patched={patched}, skipped={skipped}, total_found={len(notifs)}")
    return {"patched": patched, "skipped": skipped, "total_found": len(notifs)}

# ============================================
# ADMIN NOTIFICATION ENDPOINTS
# ============================================

class FeaturedWorkoutPush(BaseModel):
    workout_id: str
    workout_name: str
    workout_image: Optional[str] = None
    target_user_ids: Optional[List[str]] = None  # None = all users
    custom_title: Optional[str] = None  # None = random from copy library
    custom_body: Optional[str] = None   # None = random from copy library

class FeaturedSuggestionPush(BaseModel):
    custom_copy: Optional[str] = None  # None = random from library
    target_user_ids: Optional[List[str]] = None  # None = all users

class WorkoutReminderPush(BaseModel):
    user_id: str
    custom_message: Optional[str] = None  # None = random from library

class TestPushRequest(BaseModel):
    user_id: str
    title: Optional[str] = "MOOD Test Push"
    body: Optional[str] = "If you see this, push notifications are working."

@api_router.post("/admin/test-push")
async def admin_test_push(
    data: TestPushRequest,
    current_user_id: str = Depends(require_admin)
):
    """
    Admin: Send a test push to a specific user and return full diagnostics.
    Logs Expo ticket + receipt errors for debugging.
    """
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required")

    user_id = data.user_id

    # 1. Look up user
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        return {"success": False, "error": "User not found", "user_id": user_id}

    # 2. Look up stored device tokens
    tokens_cursor = db.device_tokens.find({"user_id": user_id, "is_valid": True})
    token_docs = await tokens_cursor.to_list(10)

    if not token_docs:
        all_tokens = await db.device_tokens.find({"user_id": user_id}).to_list(10)
        return {
            "success": False,
            "error": "No valid device tokens for this user",
            "user_id": user_id,
            "username": user.get("username"),
            "total_tokens_in_db": len(all_tokens),
            "invalid_tokens": [
                {"token": t["token"][:30] + "...", "is_valid": t.get("is_valid"), "platform": t.get("platform")}
                for t in all_tokens
            ],
        }

    push_tokens = [t["token"] for t in token_docs]
    logger.info(f"🧪 TEST-PUSH: Found {len(push_tokens)} valid token(s) for user {user_id} ({user.get('username')})")

    # 3. Send test push via Expo
    messages = [
        {
            "to": token,
            "title": data.title,
            "body": data.body,
            "data": {"type": "test_push", "notification_id": "test"},
            "sound": "default",
            "priority": "high",
        }
        for token in push_tokens
    ]

    expo_url = "https://exp.host/--/api/v2/push/send"
    ticket_data = None
    receipt_data = None

    try:
        async with httpx.AsyncClient() as client:
            # Send push
            resp = await client.post(expo_url, json=messages, headers={"Content-Type": "application/json"}, timeout=15.0)
            ticket_data = resp.json()
            logger.info(f"🧪 TEST-PUSH tickets: {ticket_data}")

            # Check tickets for errors
            ticket_ids = []
            ticket_errors = []
            for i, ticket in enumerate(ticket_data.get("data", [])):
                if ticket.get("status") == "ok":
                    ticket_ids.append(ticket.get("id"))
                else:
                    ticket_errors.append({
                        "token_index": i,
                        "token": push_tokens[i][:30] + "...",
                        "status": ticket.get("status"),
                        "message": ticket.get("message"),
                        "details": ticket.get("details"),
                    })
                    logger.error(f"🧪 TEST-PUSH ticket error: {ticket}")

            # 4. Fetch receipts (wait briefly for Expo to process)
            if ticket_ids:
                import asyncio
                await asyncio.sleep(2)
                receipt_resp = await client.post(
                    "https://exp.host/--/api/v2/push/getReceipts",
                    json={"ids": ticket_ids},
                    headers={"Content-Type": "application/json"},
                    timeout=15.0,
                )
                receipt_data = receipt_resp.json()
                logger.info(f"🧪 TEST-PUSH receipts: {receipt_data}")

                # Check receipts for errors
                receipt_errors = []
                for rid, receipt in receipt_data.get("data", {}).items():
                    if receipt.get("status") == "error":
                        receipt_errors.append({
                            "receipt_id": rid,
                            "status": receipt.get("status"),
                            "message": receipt.get("message"),
                            "details": receipt.get("details"),
                        })
                        logger.error(f"🧪 TEST-PUSH receipt error: {receipt}")
            else:
                receipt_errors = []

    except Exception as e:
        logger.error(f"🧪 TEST-PUSH exception: {e}")
        return {
            "success": False,
            "error": str(e),
            "user_id": user_id,
            "tokens_found": len(push_tokens),
        }

    # 5. Also check DB notification count for this user
    notif_count = await db.notifications.count_documents({"user_id": user_id})
    unread_count = await db.notifications.count_documents({"user_id": user_id, "read_at": None})

    return {
        "success": len(ticket_errors) == 0,
        "user_id": user_id,
        "username": user.get("username"),
        "tokens_found": len(push_tokens),
        "tokens": [{"token": t[:30] + "...", "platform": td.get("platform")} for t, td in zip(push_tokens, token_docs)],
        "expo_tickets": ticket_data,
        "ticket_errors": ticket_errors,
        "expo_receipts": receipt_data,
        "receipt_errors": receipt_errors if ticket_ids else [],
        "db_diagnostics": {
            "total_notifications": notif_count,
            "unread_notifications": unread_count,
        },
    }

@api_router.post("/admin/notifications/featured-workout")
async def admin_send_featured_workout(
    data: FeaturedWorkoutPush,
    current_user_id: str = Depends(require_admin)
):
    """Admin: Send featured workout push to users"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    # Validate featured workout exists and has exercises
    try:
        workout_doc = await db.featured_workouts.find_one(
            {"_id": ObjectId(data.workout_id)},
            {"exercises": 1, "title": 1}
        )
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid workout_id: {data.workout_id}")
    
    if not workout_doc:
        raise HTTPException(status_code=400, detail=f"Featured workout not found: {data.workout_id}")
    
    exercises = workout_doc.get("exercises", [])
    if not exercises:
        raise HTTPException(
            status_code=400,
            detail=f"Featured workout '{workout_doc.get('title', data.workout_id)}' has no exercises. Cannot send push with empty cart."
        )
    
    notification_service = get_notification_service(db)
    count = await notification_service.send_featured_workout_to_all(
        workout_id=data.workout_id,
        workout_name=data.workout_name,
        workout_image=data.workout_image,
        target_user_ids=data.target_user_ids,
        custom_title=data.custom_title,
        custom_body=data.custom_body,
        sender_user_id=current_user_id
    )
    
    return {
        "success": True,
        "notifications_sent": count,
        "exercises_count": len(exercises),
        "message": f"Featured workout notification sent to {count} users ({len(exercises)} exercises)"
    }

@api_router.post("/admin/notifications/featured-suggestion")
async def admin_send_featured_suggestion(
    data: FeaturedSuggestionPush,
    current_user_id: str = Depends(require_admin)
):
    """Admin: Send featured suggestion push to users"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    notification_service = get_notification_service(db)
    count = await notification_service.send_featured_suggestion_to_all(
        custom_copy=data.custom_copy,
        target_user_ids=data.target_user_ids,
        sender_user_id=current_user_id
    )
    
    return {
        "success": True,
        "notifications_sent": count,
        "message": f"Featured suggestion sent to {count} users"
    }

@api_router.post("/admin/notifications/workout-reminder")
async def admin_send_workout_reminder(
    data: WorkoutReminderPush,
    current_user_id: str = Depends(require_admin)
):
    """Admin: Send workout reminder to a specific user"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    notification_service = get_notification_service(db)
    result = await notification_service.trigger_workout_reminder(
        user_id=data.user_id,
        custom_message=data.custom_message,
        actor_id=current_user_id
    )
    
    return {
        "success": result is not None,
        "notification_id": result,
        "message": "Workout reminder sent" if result else "Failed to send reminder"
    }

class MassWorkoutReminderPush(BaseModel):
    custom_message: Optional[str] = None

@api_router.post("/admin/notifications/mass-workout-reminder")
async def admin_send_mass_workout_reminder(
    data: MassWorkoutReminderPush,
    current_user_id: str = Depends(require_admin)
):
    """Admin: Send workout reminder to all eligible users"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    worker = get_notification_worker(db)
    count = await worker.trigger_mass_workout_reminder(data.custom_message, sender_user_id=current_user_id)
    
    return {
        "success": True,
        "notifications_sent": count,
        "message": f"Workout reminders sent to {count} users"
    }

@api_router.get("/admin/notifications/worker-status")
async def admin_get_worker_status(
    current_user_id: str = Depends(require_admin)
):
    """Admin: Check notification worker status"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    worker = get_notification_worker(db)
    
    return {
        "running": worker.running,
        "message": "Notification worker is running" if worker.running else "Notification worker is stopped"
    }

@api_router.post("/admin/notifications/trigger-digest")
async def admin_trigger_digest(
    user_id: str,
    current_user_id: str = Depends(require_admin)
):
    """Admin: Manually trigger digest for a specific user"""
    # Check admin allowlist
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin access required - not in allowlist")
    
    worker = get_notification_worker(db)
    result = await worker._send_following_digest(user_id)
    
    return {
        "success": result is not None,
        "notification_id": result,
        "message": "Digest sent" if result else "No activity to report or user has no following"
    }



@api_router.get("/debug/user_posts")
async def debug_user_posts(
    userId: str,
    current_user_id: str = Depends(get_current_user)
):
    """Admin-only debug endpoint: compare DB posts vs profile query for a user."""
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Resolve userId to ObjectId
    try:
        user_oid = ObjectId(userId)
    except:
        user = await db.users.find_one({"user_id": userId})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user_oid = user["_id"]
    
    user_id_str = str(user_oid)
    
    # Count posts by type
    oid_count = await db.posts.count_documents({"author_id": user_oid})
    str_count = await db.posts.count_documents({"author_id": user_id_str})
    
    # Profile query match (what the endpoint uses)
    profile_match = {"$or": [{"author_id": user_oid}, {"author_id": user_id_str}]}
    profile_count = await db.posts.count_documents(profile_match)
    
    # Newest 5 posts from DB
    newest = await db.posts.find(
        profile_match, {"_id": 1, "created_at": 1, "caption": 1, "author_id": 1, "media_urls": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    newest_posts = []
    for p in newest:
        media = p.get("media_urls", [])
        is_video = any(".mp4" in str(u) or ".mov" in str(u) for u in media)
        newest_posts.append({
            "id": str(p["_id"]),
            "created_at": str(p.get("created_at")),
            "caption": str(p.get("caption", ""))[:50],
            "author_id_type": type(p.get("author_id")).__name__,
            "is_video": is_video,
        })
    
    return {
        "userId": user_id_str,
        "db_count_objectid": oid_count,
        "db_count_string": str_count,
        "profile_query_count": profile_count,
        "mismatch": oid_count != profile_count,
        "newest_5_posts": newest_posts,
    }


@api_router.get("/debug/profile_posts_check")
async def debug_profile_posts_check(
    userId: str,
    current_user_id: str = Depends(get_current_user)
):
    """Admin-only: deep diagnosis of why profile grid may return 0 posts."""
    if not await is_admin_allowed(current_user_id):
        raise HTTPException(status_code=403, detail="Admin only")

    user_id_str = userId

    # 1. Raw counts
    posts_by_author_id = await db.posts.count_documents({"author_id": user_id_str})
    posts_by_user_id = await db.posts.count_documents({"user_id": user_id_str})

    # 2. ObjectId counts (if valid)
    posts_by_author_obj = None
    user_exists = False
    try:
        oid = ObjectId(user_id_str)
        posts_by_author_obj = await db.posts.count_documents({"author_id": oid})
        user_doc = await db.users.find_one({"_id": oid})
        user_exists = user_doc is not None
    except Exception:
        pass

    # 3. Newest 3 posts from author_id query (either type)
    or_match = {"$or": [{"author_id": user_id_str}]}
    if posts_by_author_obj is not None:
        or_match = {"$or": [{"author_id": user_id_str}, {"author_id": ObjectId(user_id_str)}]}

    newest_cursor = db.posts.find(
        or_match, {"_id": 1, "created_at": 1, "media_type": 1, "author_id": 1, "media_urls": 1, "cover_urls": 1}
    ).sort("created_at", -1).limit(3)
    newest_raw = await newest_cursor.to_list(3)

    newest_author_posts = []
    for p in newest_raw:
        newest_author_posts.append({
            "id": str(p["_id"]),
            "created_at": str(p.get("created_at")),
            "media_type": p.get("media_type"),
            "author_id_type": type(p.get("author_id")).__name__,
            "author_id_value": str(p.get("author_id")),
            "cover_urls_type": type(p.get("cover_urls")).__name__,
            "media_urls_count": len(p.get("media_urls", [])),
        })

    # 4. Try running the actual profile pipeline to detect errors
    pipeline_error = None
    pipeline_count = 0
    try:
        user_object_id = ObjectId(user_id_str) if user_exists else None
        if user_object_id:
            author_match = {"$or": [
                {"author_id": user_object_id},
                {"author_id": user_id_str},
            ]}
            pipeline = [
                {"$match": author_match},
                {"$sort": {"created_at": -1}},
                {"$limit": 5},
                {"$addFields": {
                    "_author_oid": {"$cond": {
                        "if": {"$eq": [{"$type": "$author_id"}, "string"]},
                        "then": {"$toObjectId": "$author_id"},
                        "else": "$author_id"
                    }}
                }},
                {"$lookup": {
                    "from": "users",
                    "localField": "_author_oid",
                    "foreignField": "_id",
                    "as": "author"
                }},
                {"$unwind": "$author"},
            ]
            pipeline_results = await db.posts.aggregate(pipeline).to_list(5)
            pipeline_count = len(pipeline_results)
    except Exception as e:
        pipeline_error = f"{type(e).__name__}: {e}"

    return {
        "userId_received": user_id_str,
        "user_exists_in_db": user_exists,
        "posts_by_author_id": posts_by_author_id,
        "posts_by_user_id": posts_by_user_id,
        "posts_by_author_obj": posts_by_author_obj,
        "newest_author_posts": newest_author_posts,
        "profile_pipeline_returned": pipeline_count,
        "profile_pipeline_error": pipeline_error,
    }

# Workout Drafts (Saved Builds) — guests + authenticated, lifecycle-aware
api_router.include_router(
    build_workout_drafts_router(db, get_current_user, get_optional_current_user)
)

# Include router in main app
app.include_router(api_router)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


async def _cleanup_duplicate_device_tokens(database):
    """One-time cleanup: deduplicate device_tokens keeping only the most recent per token"""
    pipeline = [
        {"$group": {
            "_id": "$token",
            "count": {"$sum": 1},
            "docs": {"$push": {"id": "$_id", "last_active": "$last_active"}},
        }},
        {"$match": {"count": {"$gt": 1}}},
    ]
    dup_count = 0
    async for group in database.device_tokens.aggregate(pipeline):
        docs = sorted(group["docs"], key=lambda d: d.get("last_active") or datetime.min, reverse=True)
        # Keep the most recently active doc, delete the rest
        ids_to_delete = [d["id"] for d in docs[1:]]
        await database.device_tokens.delete_many({"_id": {"$in": ids_to_delete}})
        dup_count += len(ids_to_delete)
    if dup_count:
        logger.info(f"🧹 Cleaned up {dup_count} duplicate device tokens")
    else:
        logger.info("✅ No duplicate device tokens found")


async def _migrate_posts_author_id(database):
    """One-time migration: backfill author_id on posts that only have user_id/creator_id/owner_id."""
    query = {"$or": [
        {"author_id": {"$exists": False}},
        {"author_id": None},
        {"author_id": ""},
    ]}
    
    posts_to_fix = await database.posts.find(query).to_list(10000)
    
    if not posts_to_fix:
        logger.info("✅ Migration: All posts have author_id — nothing to do")
        return {"fixed": 0, "orphaned": []}
    
    fixed = 0
    orphaned = []
    
    for post in posts_to_fix:
        post_id = post["_id"]
        # Try fallback fields in priority order
        resolved = None
        for key in ("user_id", "creator_id", "owner_id"):
            val = post.get(key)
            if val:
                resolved = val if isinstance(val, ObjectId) else ObjectId(str(val))
                break
        
        if resolved:
            await database.posts.update_one(
                {"_id": post_id},
                {"$set": {"author_id": resolved}}
            )
            fixed += 1
            logger.info(f"🔧 Migration: Set author_id={resolved} on post {post_id} (from '{key}')")
        else:
            orphaned.append(str(post_id))
            logger.warning(f"⚠️ Migration: Post {post_id} has NO author fields — manual review needed")
    
    logger.info(f"🔧 Migration complete: {fixed} posts fixed, {len(orphaned)} orphaned")
    return {"fixed": fixed, "orphaned": orphaned}


@app.on_event("startup")
async def startup_db_client():
    """Start background services on app startup"""
    # Log environment info
    logger.info(f"🌍 Environment: APP_ENV={APP_ENV}, IS_STAGING={IS_STAGING}")
    
    # Create/verify MongoDB indexes for analytics performance
    try:
        # user_events indexes
        await db.user_events.create_index([("timestamp", -1)])
        await db.user_events.create_index([("user_id", 1), ("timestamp", -1)])
        await db.user_events.create_index([("event_type", 1), ("timestamp", -1)])
        await db.user_events.create_index([("event_type", 1), ("user_id", 1)])
        
        # users indexes
        await db.users.create_index([("created_at", -1)])
        await db.users.create_index([("username", 1)])
        await db.users.create_index([("email", 1)])

        # Onboarding tips backfill — reset tip states for ALL users to 'unseen'
        # so the redesigned tips re-fire for everyone. v3 bump is paired with
        # the Tip 2 redesign (bottom-floating popup) + Tip 3 forced-placement.
        flag = await db.app_settings.find_one({"_id": "onboarding_backfill_v3"})
        if not flag:
            try:
                res = await db.users.update_many(
                    {},
                    {"$set": {
                        "tips_state.mood_scroll": "unseen",
                        "tips_state.form_videos": "unseen",
                        "tips_state.completion_share": "unseen",
                    }},
                )
                await db.app_settings.update_one(
                    {"_id": "onboarding_backfill_v3"},
                    {"$set": {"applied_at": datetime.now(timezone.utc), "matched": res.matched_count}},
                    upsert=True,
                )
                logger.info(f"✅ Onboarding tips backfill v3 applied to {res.matched_count} users")
            except Exception as e:
                logger.warning(f"Onboarding backfill v3 skipped: {e}")
        
        # workout_drafts indexes (Saved Builds)
        try:
            await ensure_workout_drafts_indexes(db)
            logger.info("✅ workout_drafts indexes ensured")
        except Exception as e:
            logger.warning(f"workout_drafts indexes skipped: {e}")

        # daily_activity indexes
        await db.daily_activity.create_index([("date", -1)])
        await db.daily_activity.create_index([("user_id", 1), ("date", -1)])
        
        # login_events indexes
        await db.login_events.create_index([("user_id", 1), ("timestamp", -1)])
        await db.login_events.create_index([("timestamp", -1)])
        
        # admin_audit_logs indexes
        await db.admin_audit_logs.create_index([("timestamp_utc", -1)])
        await db.admin_audit_logs.create_index([("admin_user_id", 1), ("timestamp_utc", -1)])
        await db.admin_audit_logs.create_index([("action", 1), ("timestamp_utc", -1)])
        
        # --- Notification system indexes ---
        # Unique index on device_tokens.token to prevent duplicate push tokens
        try:
            await db.device_tokens.create_index(
                [("token", 1)],
                unique=True,
                name="unique_device_token",
            )
            logger.info("✅ device_tokens unique index on 'token' ensured")
        except Exception as idx_err:
            # If duplicates exist, clean them up first, then retry
            logger.warning(f"⚠️ device_tokens unique index failed (likely duplicates): {idx_err}")
            await _cleanup_duplicate_device_tokens(db)
            try:
                await db.device_tokens.create_index(
                    [("token", 1)],
                    unique=True,
                    name="unique_device_token",
                )
                logger.info("✅ device_tokens unique index created after cleanup")
            except Exception as retry_err:
                logger.error(f"❌ Could not create unique device_tokens index: {retry_err}")
        
        # PushSendLog: unique compound index for at-most-once push delivery
        await db.push_send_log.create_index(
            [("user_id", 1), ("type", 1), ("event_key", 1)],
            unique=True,
            name="unique_push_send",
        )
        # TTL index: auto-expire push send logs after 7 days
        await db.push_send_log.create_index(
            [("created_at", 1)],
            expireAfterSeconds=7 * 24 * 3600,
            name="push_send_log_ttl",
        )
        # Notification retrieval indexes
        await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
        await db.device_tokens.create_index([("user_id", 1), ("is_valid", 1)])
        
        logger.info("✅ MongoDB indexes verified/created for analytics")
    except Exception as e:
        logger.error(f"⚠️ Failed to create some indexes: {e}")
    
    # One-time migration: backfill author_id on legacy posts
    try:
        migration_result = await _migrate_posts_author_id(db)
        logger.info(f"✅ Post author_id migration: {migration_result}")
    except Exception as e:
        logger.error(f"⚠️ Post author_id migration failed: {e}")
    
    # One-time migration: normalize dict cover_urls to list
    try:
        fixed = 0
        async for post in db.posts.find({"cover_urls": {"$type": "object"}}):
            cu = post["cover_urls"]
            # Convert dict {"0": url, "1": url2, ...} to list [url, url2, ...]
            if isinstance(cu, dict):
                sorted_keys = sorted(cu.keys(), key=lambda k: int(k) if k.isdigit() else 0)
                as_list = [cu[k] for k in sorted_keys if cu[k]]
                await db.posts.update_one(
                    {"_id": post["_id"]},
                    {"$set": {"cover_urls": as_list}}
                )
                fixed += 1
        if fixed:
            logger.info(f"✅ cover_urls migration: normalized {fixed} posts from dict to list")
        else:
            logger.info("✅ cover_urls migration: nothing to do")
    except Exception as e:
        logger.error(f"⚠️ cover_urls migration failed: {e}")
    
    # Start notification background worker
    try:
        await start_notification_worker(db)
        logger.info("🚀 Notification worker started successfully")
    except Exception as e:
        logger.error(f"Failed to start notification worker: {e}")
    
    # Migration: fix None values in notification_settings
    # These cause silent push send failures (not None → True in Python)
    try:
        bool_defaults_true = [
            "notifications_enabled", "likes_enabled", "comments_enabled",
            "messages_enabled", "follows_enabled", "workout_reminders_enabled",
            "featured_workouts_enabled", "following_digest_enabled",
            "featured_suggestions_enabled",
        ]
        total_fixed = 0
        for field in bool_defaults_true:
            r = await db.notification_settings.update_many(
                {field: None}, {"$set": {field: True}}
            )
            total_fixed += r.modified_count
        if total_fixed > 0:
            logger.info(f"✅ notification_settings migration: fixed {total_fixed} None→True fields")
        else:
            logger.info("✅ notification_settings migration: nothing to do")
    except Exception as e:
        logger.error(f"⚠️ notification_settings migration failed: {e}")
    

    # Migration: Normalize string author_id to ObjectId for consistent queries
    try:
        str_author_posts = await db.posts.count_documents({"author_id": {"$type": "string"}})
        if str_author_posts > 0:
            fixed = 0
            async for post in db.posts.find({"author_id": {"$type": "string"}}, {"_id": 1, "author_id": 1}):
                try:
                    new_oid = ObjectId(post["author_id"])
                    await db.posts.update_one(
                        {"_id": post["_id"]},
                        {"$set": {"author_id": new_oid}}
                    )
                    fixed += 1
                except Exception:
                    pass  # Skip malformed IDs
            logger.info(f"✅ author_id migration: converted {fixed}/{str_author_posts} string→ObjectId")
        else:
            logger.info("✅ author_id migration: nothing to do (all ObjectId)")
    except Exception as e:
        logger.error(f"⚠️ author_id migration failed: {e}")

    # Auto-seed featured workouts in staging or if empty
    # This runs on EVERY deployment to ensure featured workouts exist
    try:
        seed_result = await auto_seed_featured_workouts()
        if seed_result.get("seeded"):
            logger.info(f"🌱 Startup: Auto-seeded {seed_result.get('count')} featured workouts")
        else:
            logger.info(f"✅ Startup: Featured workouts OK ({seed_result.get('count')} found)")
    except Exception as e:
        logger.error(f"❌ Startup: Failed to auto-seed featured workouts: {e}")
    
    # Auto-seed exercises in staging or if empty
    try:
        exercises_result = await auto_seed_exercises()
        if exercises_result.get("seeded"):
            logger.info(f"🌱 Startup: Auto-seeded {exercises_result.get('count')} exercises")
        else:
            logger.info(f"✅ Startup: Exercises OK ({exercises_result.get('count')} found)")
    except Exception as e:
        logger.error(f"❌ Startup: Failed to auto-seed exercises: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Clean up on app shutdown"""
    # Stop notification worker
    try:
        await stop_notification_worker()
        logger.info("🛑 Notification worker stopped")
    except Exception as e:
        logger.error(f"Error stopping notification worker: {e}")
    
    # Close database connection
    client.close()