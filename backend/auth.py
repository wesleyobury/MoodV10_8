"""
Emergent Auth Integration
Handles Google OAuth via Emergent Auth service
"""
import os
import httpx
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel
from fastapi import HTTPException, Request, Response
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

logger = logging.getLogger(__name__)

# Emergent Auth API endpoint
EMERGENT_AUTH_SESSION_API = os.environ.get('EMERGENT_AUTH_API_URL', 'https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data')

class SessionDataResponse(BaseModel):
    """Response from Emergent Auth API"""
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str
    sub: Optional[str] = None  # Google user ID for account linking

class UserSession(BaseModel):
    """User session stored in database"""
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

async def exchange_session_id_for_token(session_id: str) -> SessionDataResponse:
    """
    Exchange session_id for user data and session_token
    from Emergent Auth API
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                EMERGENT_AUTH_SESSION_API,
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Emergent Auth API error: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=401,
                    detail="Invalid session ID or session expired"
                )
            
            user_data = response.json()
            logger.info(f"Successfully exchanged session_id for user: {user_data['email']}")
            
            # Return SessionDataResponse - session_token is already in user_data
            return SessionDataResponse(**user_data)
            
    except httpx.RequestError as e:
        logger.error(f"Network error calling Emergent Auth API: {e}")
        raise HTTPException(
            status_code=503,
            detail="Authentication service unavailable"
        )

async def create_or_update_user(db: AsyncIOMotorDatabase, user_data: SessionDataResponse) -> str:
    """
    Create new user or return existing user's user_id
    Links Google account to existing account if email matches (account linking)
    """
    # Check if user exists by email (supports account linking across auth methods)
    existing_user = await db.users.find_one({"email": user_data.email})
    
    if existing_user:
        logger.info(f"User already exists: {user_data.email}")
        
        # Link Google account if not already linked
        update_fields = {}
        if not existing_user.get("google_user_id") and user_data.sub:
            update_fields["google_user_id"] = user_data.sub
            logger.info(f"Linking Google ID to existing account: {user_data.email}")
        
        # Handle both user_id field and _id (ObjectId) for backwards compatibility
        if "user_id" in existing_user:
            user_id = existing_user["user_id"]
        else:
            # User exists but doesn't have user_id field - use _id as string
            user_id = str(existing_user["_id"])
            update_fields["user_id"] = user_id
            logger.info(f"Added user_id to existing user: {user_data.email}")
        
        # Apply updates if any
        if update_fields:
            await db.users.update_one(
                {"_id": existing_user["_id"]},
                {"$set": update_fields}
            )
        
        return user_id
    
    # Create new user with custom user_id and blank profile
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    
    await db.users.insert_one({
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "username": user_data.email.split('@')[0],  # Default username from email
        "avatar": user_data.picture or "",
        "bio": "",
        "followers_count": 0,
        "following_count": 0,
        "workouts_count": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "total_workouts": 0,
        "following": [],
        "followers": [],
        "google_user_id": user_data.sub,  # Store Google ID for future lookups
        "auth_provider": "google",
        "created_at": datetime.now(timezone.utc)
    })
    
    logger.info(f"Created new user: {user_data.email} with user_id: {user_id}")
    return user_id

async def store_session(db: AsyncIOMotorDatabase, user_id: str, session_token: str) -> None:
    """
    Store session token in database with long-lived expiry (10 years)
    Users stay logged in until they explicitly sign out
    """
    expires_at = datetime.now(timezone.utc) + timedelta(days=3650)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at,
        "created_at": datetime.now(timezone.utc)
    })
    
    logger.info(f"Stored session for user_id: {user_id}, expires: {expires_at}")

async def get_user_from_session_token(db: AsyncIOMotorDatabase, session_token: str) -> Optional[dict]:
    """
    Validate session token and return user data
    Returns None if session invalid or expired
    """
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        logger.debug("Session not found")
        return None
    
    # Check expiry - normalize to timezone-aware
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at <= datetime.now(timezone.utc):
        logger.debug("Session expired")
        # Clean up expired session
        await db.user_sessions.delete_one({"session_token": session_token})
        return None
    
    # Get user data
    user = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user:
        logger.error(f"User not found for session user_id: {session['user_id']}")
        return None
    
    return user

async def delete_session(db: AsyncIOMotorDatabase, session_token: str) -> None:
    """
    Delete session from database (logout)
    """
    result = await db.user_sessions.delete_one({"session_token": session_token})
    logger.info(f"Deleted session, matched: {result.deleted_count}")

def set_session_cookie(response: Response, session_token: str) -> None:
    """
    Set httpOnly session cookie
    """
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=10 * 365 * 24 * 60 * 60  # 10 years - stay logged in until explicit logout
    )

def clear_session_cookie(response: Response) -> None:
    """
    Clear session cookie
    """
    response.delete_cookie(
        key="session_token",
        path="/",
        samesite="none"
    )

async def get_session_token_from_request(request: Request) -> Optional[str]:
    """
    Extract session token from cookie or Authorization header
    Checks cookie first, then falls back to Authorization header
    """
    # Try cookie first
    session_token = request.cookies.get("session_token")
    if session_token:
        return session_token
    
    # Fallback to Authorization header for mobile/API clients
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    
    return None
