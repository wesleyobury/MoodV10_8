"""
User Analytics and Tracking System
Tracks user behavior, engagement, and app usage patterns
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class UserEvent(BaseModel):
    """Model for user activity events"""
    user_id: str
    event_type: str  # 'workout_completed', 'post_created', 'profile_viewed', etc.
    event_category: str  # 'workout', 'social', 'profile', 'navigation'
    metadata: Optional[dict] = None
    timestamp: datetime
    session_id: Optional[str] = None

class UserActivity(BaseModel):
    """Model for daily user activity summary"""
    user_id: str
    date: datetime
    events_count: int = 0
    workouts_completed: int = 0
    posts_created: int = 0
    comments_made: int = 0
    likes_given: int = 0
    profiles_viewed: int = 0
    time_spent_minutes: int = 0


# Event Types
EVENT_TYPES = {
    # Workout Events
    "workout_started": "workout",
    "workout_completed": "workout",
    "workout_skipped": "workout",
    "workout_abandoned": "workout",
    "workout_saved": "workout",
    "exercise_completed": "workout",
    "try_workout_clicked": "workout",
    "workout_session_completed": "workout",
    
    # Social Events
    "post_created": "social",
    "post_liked": "social",
    "post_commented": "social",
    "user_followed": "social",
    "user_unfollowed": "social",
    "profile_viewed": "social",
    
    # Navigation Events
    "screen_viewed": "navigation",
    "tab_switched": "navigation",
    "search_performed": "navigation",
    
    # Engagement Events
    "app_session_start": "engagement",
    "app_opened": "engagement",
    "app_backgrounded": "engagement",
    "notification_clicked": "engagement",
    
    # Feature Usage
    "equipment_selected": "feature",
    "difficulty_selected": "feature",
    "mood_selected": "feature",
    "filter_applied": "feature"
}

# Excluded user IDs for analytics (admin/test accounts)
# Note: These are legacy exclusions. New approach uses users.is_internal field.
# These are kept for backward compatibility.
EXCLUDED_USER_IDS = [
    "695c9fa0e58a04344db951e5",  # OgeeezzburyTester
]

EXCLUDED_USERNAMES = [
    "ogeeezzburytester",
]


async def get_internal_user_ids(db: AsyncIOMotorDatabase) -> set:
    """Get set of internal user IDs to exclude from analytics."""
    internal_users = await db.users.find(
        {"is_internal": True},
        {"_id": 1}
    ).to_list(1000)
    # Combine database internal users with legacy exclusions
    ids = {str(u["_id"]) for u in internal_users}
    ids.update(EXCLUDED_USER_IDS)
    return ids


async def track_user_event(
    db: AsyncIOMotorDatabase,
    user_id: str,
    event_type: str,
    metadata: Optional[dict] = None,
    session_id: Optional[str] = None
) -> None:
    """
    Track a user activity event
    """
    try:
        # Skip tracking for excluded admin/test accounts
        if user_id in EXCLUDED_USER_IDS:
            logger.debug(f"Skipping analytics for excluded user {user_id}")
            return
        
        event_category = EVENT_TYPES.get(event_type, "other")
        
        event = {
            "user_id": user_id,
            "event_type": event_type,
            "event_category": event_category,
            "metadata": metadata or {},
            "timestamp": datetime.now(timezone.utc),
            "session_id": session_id
        }
        
        await db.user_events.insert_one(event)
        
        # Update daily activity summary
        await update_daily_activity(db, user_id, event_type)
        
        logger.info(f"Tracked event {event_type} for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error tracking user event: {e}")


async def update_daily_activity(
    db: AsyncIOMotorDatabase,
    user_id: str,
    event_type: str
) -> None:
    """
    Update daily activity summary for a user
    """
    try:
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Increment counters based on event type
        update_fields = {"$inc": {"events_count": 1}}
        
        if event_type == "workout_completed":
            update_fields["$inc"]["workouts_completed"] = 1
        elif event_type == "post_created":
            update_fields["$inc"]["posts_created"] = 1
        elif event_type == "post_commented":
            update_fields["$inc"]["comments_made"] = 1
        elif event_type == "post_liked":
            update_fields["$inc"]["likes_given"] = 1
        elif event_type == "profile_viewed":
            update_fields["$inc"]["profiles_viewed"] = 1
        
        await db.daily_activity.update_one(
            {"user_id": user_id, "date": today},
            {
                **update_fields,
                "$setOnInsert": {
                    "user_id": user_id,
                    "date": today,
                    "created_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
        
    except Exception as e:
        logger.error(f"Error updating daily activity: {e}")


async def get_user_activity_summary(
    db: AsyncIOMotorDatabase,
    user_id: str,
    days: int = 30
) -> Dict[str, Any]:
    """
    Get user activity summary for the past N days
    """
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get daily activity records
        activities = await db.daily_activity.find({
            "user_id": user_id,
            "date": {"$gte": start_date}
        }).sort("date", -1).to_list(length=days)
        
        # Calculate totals
        total_workouts = sum(a.get("workouts_completed", 0) for a in activities)
        total_posts = sum(a.get("posts_created", 0) for a in activities)
        total_comments = sum(a.get("comments_made", 0) for a in activities)
        total_likes = sum(a.get("likes_given", 0) for a in activities)
        total_events = sum(a.get("events_count", 0) for a in activities)
        
        # Calculate streak
        streak = await calculate_workout_streak(db, user_id)
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_workouts": total_workouts,
            "total_posts": total_posts,
            "total_comments": total_comments,
            "total_likes": total_likes,
            "total_events": total_events,
            "current_streak": streak,
            "daily_breakdown": [
                {
                    "date": a["date"].isoformat(),
                    "workouts": a.get("workouts_completed", 0),
                    "posts": a.get("posts_created", 0),
                    "events": a.get("events_count", 0)
                }
                for a in activities
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting user activity summary: {e}")
        return {}


async def calculate_workout_streak(
    db: AsyncIOMotorDatabase,
    user_id: str
) -> int:
    """
    Get current workout streak for a user.
    First checks the stored current_streak in user document,
    falls back to calculating from daily_activity.
    """
    try:
        # First try to get stored streak from user document
        from bson import ObjectId
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if user and user.get("current_streak", 0) > 0:
                return user.get("current_streak", 0)
        except:
            pass
        
        # Fall back to calculating from daily activity
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        streak = 0
        current_date = today
        
        # Check each day backwards until we find a day without workout
        for i in range(365):  # Max 365 days
            activity = await db.daily_activity.find_one({
                "user_id": user_id,
                "date": current_date,
                "workouts_completed": {"$gt": 0}
            })
            
            if activity:
                streak += 1
                current_date = current_date - timedelta(days=1)
            else:
                # Check if it's today - if today has no workout, check yesterday
                if i == 0:
                    current_date = current_date - timedelta(days=1)
                    continue
                break
        
        return streak
        
    except Exception as e:
        logger.error(f"Error calculating workout streak: {e}")
        return 0


async def get_feature_usage_stats(
    db: AsyncIOMotorDatabase,
    user_id: str,
    days: int = 30
) -> Dict[str, Any]:
    """
    Get feature usage statistics for a user
    """
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Aggregate events by category
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$event_category",
                    "count": {"$sum": 1},
                    "events": {"$push": "$event_type"}
                }
            }
        ]
        
        category_stats = await db.user_events.aggregate(pipeline).to_list(length=100)
        
        # Get most used features
        feature_pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "timestamp": {"$gte": start_date},
                    "event_category": "feature"
                }
            },
            {
                "$group": {
                    "_id": "$event_type",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$limit": 10
            }
        ]
        
        top_features = await db.user_events.aggregate(feature_pipeline).to_list(length=10)
        
        return {
            "user_id": user_id,
            "period_days": days,
            "by_category": {
                stat["_id"]: stat["count"]
                for stat in category_stats
            },
            "top_features": [
                {
                    "feature": f["_id"],
                    "usage_count": f["count"]
                }
                for f in top_features
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting feature usage stats: {e}")
        return {}


async def get_workout_analytics(
    db: AsyncIOMotorDatabase,
    user_id: str,
    days: int = 30
) -> Dict[str, Any]:
    """
    Get detailed workout analytics for a user
    """
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get workout events with metadata
        workout_events = await db.user_events.find({
            "user_id": user_id,
            "event_type": {"$in": ["workout_completed", "workout_started"]},
            "timestamp": {"$gte": start_date}
        }).to_list(length=1000)
        
        # Analyze workout patterns
        completed_workouts = [e for e in workout_events if e["event_type"] == "workout_completed"]
        
        # Group by mood category if available
        mood_counts = {}
        difficulty_counts = {}
        
        for workout in completed_workouts:
            metadata = workout.get("metadata", {})
            mood = metadata.get("mood_category")
            difficulty = metadata.get("difficulty")
            
            if mood:
                mood_counts[mood] = mood_counts.get(mood, 0) + 1
            if difficulty:
                difficulty_counts[difficulty] = difficulty_counts.get(difficulty, 0) + 1
        
        # Calculate completion rate
        started = len([e for e in workout_events if e["event_type"] == "workout_started"])
        completed = len(completed_workouts)
        completion_rate = (completed / started * 100) if started > 0 else 0
        
        return {
            "user_id": user_id,
            "period_days": days,
            "total_workouts_completed": completed,
            "total_workouts_started": started,
            "completion_rate": round(completion_rate, 2),
            "workouts_by_mood": mood_counts,
            "workouts_by_difficulty": difficulty_counts,
            "average_workouts_per_week": round(completed / (days / 7), 2) if days >= 7 else completed
        }
        
    except Exception as e:
        logger.error(f"Error getting workout analytics: {e}")
        return {}


async def get_social_engagement_stats(
    db: AsyncIOMotorDatabase,
    user_id: str,
    days: int = 30
) -> Dict[str, Any]:
    """
    Get social engagement statistics for a user
    """
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Count social events
        social_events = await db.user_events.find({
            "user_id": user_id,
            "event_category": "social",
            "timestamp": {"$gte": start_date}
        }).to_list(length=10000)
        
        posts_created = len([e for e in social_events if e["event_type"] == "post_created"])
        likes_given = len([e for e in social_events if e["event_type"] == "post_liked"])
        comments_made = len([e for e in social_events if e["event_type"] == "post_commented"])
        follows = len([e for e in social_events if e["event_type"] == "user_followed"])
        unfollows = len([e for e in social_events if e["event_type"] == "user_unfollowed"])
        
        # Get user's current social stats from database
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        
        return {
            "user_id": user_id,
            "period_days": days,
            "posts_created": posts_created,
            "likes_given": likes_given,
            "comments_made": comments_made,
            "follows": follows,
            "unfollows": unfollows,
            "net_follows": follows - unfollows,
            "current_followers": user.get("followers_count", 0) if user else 0,
            "current_following": user.get("following_count", 0) if user else 0,
            "engagement_score": posts_created + likes_given + comments_made
        }
        
    except Exception as e:
        logger.error(f"Error getting social engagement stats: {e}")
        return {}


async def get_admin_analytics(
    db: AsyncIOMotorDatabase,
    days: int = 30,
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get platform-wide analytics (admin view)
    Excludes internal users (is_internal=True) by default
    
    Args:
        db: Database connection
        days: Number of days to look back
        include_internal: If True, include internal users in analytics
    """
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            excluded_user_ids = await get_internal_user_ids(db)
        
        # Build exclude filter
        exclude_filter = {}
        if excluded_user_ids:
            exclude_filter = {"user_id": {"$nin": list(excluded_user_ids)}}
        
        # Total users (excluding internal accounts)
        user_count_filter = {}
        if not include_internal:
            user_count_filter = {"is_internal": {"$ne": True}}
        total_users = await db.users.count_documents(user_count_filter)
        
        # Active users (users with events in period, excluding internal)
        active_query = {"timestamp": {"$gte": start_date}}
        if excluded_user_ids:
            active_query["user_id"] = {"$nin": list(excluded_user_ids)}
        active_users_list = await db.user_events.distinct("user_id", active_query)
        active_users = len([u for u in active_users_list if u not in excluded_user_ids])
        
        # Daily active users (today)
        dau_query = {"timestamp": {"$gte": today}}
        if excluded_user_ids:
            dau_query["user_id"] = {"$nin": list(excluded_user_ids)}
        dau_list = await db.user_events.distinct("user_id", dau_query)
        dau = len([u for u in dau_list if u not in excluded_user_ids])
        
        # Helper for counting events
        async def count_events(event_type: str) -> int:
            query = {
                "event_type": event_type,
                "timestamp": {"$gte": start_date},
            }
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            return await db.user_events.count_documents(query)
        
        # Total workouts started/completed
        total_workouts_started = await count_events("workout_started")
        total_workouts_completed = await count_events("workout_completed")
        
        # Total posts created
        total_posts = await count_events("post_created")
        
        # Total likes
        total_likes = await count_events("post_liked")
        
        # Total comments
        total_comments = await count_events("post_commented")
        
        # Total follows
        total_follows = await count_events("user_followed")
        
        # Total unfollows
        total_unfollows = await count_events("user_unfollowed")
        
        # Workouts skipped
        workouts_skipped = await count_events("workout_skipped")
        
        # Workouts abandoned
        workouts_abandoned = await count_events("workout_abandoned")
        
        # Profile views
        profile_views = await count_events("profile_viewed")
        
        # App sessions
        app_sessions = await count_events("app_session_start")
        
        # App opens (foreground)
        app_opens = await count_events("app_opened")
        
        # Screen views
        screen_views = await count_events("screen_viewed")
        
        # Tab switches
        tab_switches = await count_events("tab_switched")
        
        # Exercises completed
        exercises_completed = await count_events("exercise_completed")
        
        # Mood selections
        mood_selections = await count_events("mood_selected")
        
        # Equipment selections
        equipment_selections = await count_events("equipment_selected")
        
        # Difficulty selections
        difficulty_selections = await db.user_events.count_documents({
            "event_type": "difficulty_selected",
            "timestamp": {"$gte": start_date}
        })
        
        # Featured workout events
        featured_workout_clicks = await db.user_events.count_documents({
            "event_type": "featured_workout_clicked",
            "timestamp": {"$gte": start_date}
        })
        
        featured_workout_starts = await db.user_events.count_documents({
            "event_type": "featured_workout_started",
            "timestamp": {"$gte": start_date}
        })
        
        featured_workout_completions = await db.user_events.count_documents({
            "event_type": "featured_workout_completed",
            "timestamp": {"$gte": start_date}
        })
        
        # Cart events
        workouts_added_to_cart = await db.user_events.count_documents({
            "event_type": "workout_added_to_cart",
            "timestamp": {"$gte": start_date}
        })
        
        workouts_removed_from_cart = await db.user_events.count_documents({
            "event_type": "workout_removed_from_cart",
            "timestamp": {"$gte": start_date}
        })
        
        cart_views = await db.user_events.count_documents({
            "event_type": "cart_viewed",
            "timestamp": {"$gte": start_date}
        })
        
        # New users in period
        new_users = await db.users.count_documents({
            "created_at": {"$gte": start_date}
        })
        
        # Most popular mood categories (from mood_selected events)
        mood_pipeline = [
            {
                "$match": {
                    "event_type": "mood_selected",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$metadata.mood_category",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            },
            {
                "$limit": 10
            }
        ]
        
        popular_moods = await db.user_events.aggregate(mood_pipeline).to_list(length=10)
        
        # Map mood IDs to friendly display names
        mood_display_names = {
            "sweat": "I Want to Sweat",
            "muscle": "Muscle Gainer",
            "outdoor": "Get Outside",
            "calisthenics": "Calisthenics",
            "lazy": "Feeling Lazy",
            "explosive": "Get Explosive"
        }
        
        # Apply friendly names to mood results
        for mood in popular_moods:
            if mood["_id"] in mood_display_names:
                mood["_id"] = mood_display_names[mood["_id"]]
        
        return {
            "period_days": days,
            "total_users": total_users,
            "active_users": active_users,
            "daily_active_users": dau,
            "new_users": new_users,
            "total_workouts_started": total_workouts_started,
            "total_workouts_completed": total_workouts_completed,
            "total_workouts_skipped": workouts_skipped,
            "total_workouts_abandoned": workouts_abandoned,
            "workout_completion_rate": round((total_workouts_completed / total_workouts_started * 100), 1) if total_workouts_started > 0 else 0,
            "total_exercises_completed": exercises_completed,
            "total_posts_created": total_posts,
            "total_likes": total_likes,
            "total_comments": total_comments,
            "total_follows": total_follows,
            "total_unfollows": total_unfollows,
            "total_profile_views": profile_views,
            "total_app_sessions": app_sessions,
            "total_app_opens": app_opens,
            "total_screen_views": screen_views,
            "total_tab_switches": tab_switches,
            "total_mood_selections": mood_selections,
            "total_equipment_selections": equipment_selections,
            "total_difficulty_selections": difficulty_selections,
            "featured_workout_clicks": featured_workout_clicks,
            "featured_workout_starts": featured_workout_starts,
            "featured_workout_completions": featured_workout_completions,
            "featured_workout_conversion_rate": round((featured_workout_completions / featured_workout_clicks * 100), 1) if featured_workout_clicks > 0 else 0,
            "workouts_added_to_cart": workouts_added_to_cart,
            "workouts_removed_from_cart": workouts_removed_from_cart,
            "cart_views": cart_views,
            "retention_rate": round((active_users / total_users * 100), 2) if total_users > 0 else 0,
            "average_workouts_per_active_user": round(total_workouts_completed / active_users, 2) if active_users > 0 else 0,
            "popular_mood_categories": [
                {"mood": m["_id"], "count": m["count"]}
                for m in popular_moods if m["_id"]
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting admin analytics: {e}")
        return {}


async def get_user_journey(
    db: AsyncIOMotorDatabase,
    user_id: str,
    limit: int = 100
) -> List[Dict[str, Any]]:
    """
    Get chronological user journey/activity timeline
    """
    try:
        events = await db.user_events.find({
            "user_id": user_id
        }).sort("timestamp", -1).limit(limit).to_list(length=limit)
        
        return [
            {
                "event_type": e["event_type"],
                "category": e["event_category"],
                "timestamp": e["timestamp"].isoformat(),
                "metadata": e.get("metadata", {})
            }
            for e in events
        ]
        
    except Exception as e:
        logger.error(f"Error getting user journey: {e}")
        return []



# ============================================
# DETAILED ANALYTICS DRILL-DOWN FUNCTIONS
# ============================================

async def get_all_users_detail(
    db: AsyncIOMotorDatabase,
    days: int = 30,
    limit: int = 100,
    skip: int = 0
) -> Dict[str, Any]:
    """Get all users with their activity summary"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get all users
        users = await db.users.find({}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
        total_count = await db.users.count_documents({})
        
        user_details = []
        for user in users:
            user_id = str(user["_id"])
            
            # Get activity counts for this user in period
            workouts = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "workout_completed",
                "timestamp": {"$gte": start_date}
            })
            
            posts = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "post_created",
                "timestamp": {"$gte": start_date}
            })
            
            sessions = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "app_session_start",
                "timestamp": {"$gte": start_date}
            })
            
            user_details.append({
                "user_id": user_id,
                "username": user.get("username", "Unknown"),
                "email": user.get("email", ""),
                "avatar_url": user.get("avatar_url", ""),
                "created_at": user.get("created_at", datetime.now()).isoformat() if user.get("created_at") else None,
                "workouts_completed": workouts,
                "posts_created": posts,
                "app_sessions": sessions,
                "followers_count": user.get("followers_count", 0),
                "following_count": user.get("following_count", 0),
            })
        
        return {
            "total_count": total_count,
            "users": user_details,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting all users detail: {e}")
        return {"total_count": 0, "users": [], "period_days": days}


async def get_new_users_detail(
    db: AsyncIOMotorDatabase,
    days: int = 30,
    limit: int = 100
) -> Dict[str, Any]:
    """Get new users who joined in the period"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        users = await db.users.find({
            "created_at": {"$gte": start_date}
        }).sort("created_at", -1).limit(limit).to_list(length=limit)
        
        total_count = await db.users.count_documents({
            "created_at": {"$gte": start_date}
        })
        
        user_details = []
        for user in users:
            user_details.append({
                "user_id": str(user["_id"]),
                "username": user.get("username", "Unknown"),
                "email": user.get("email", ""),
                "avatar_url": user.get("avatar_url", ""),
                "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            })
        
        return {
            "total_count": total_count,
            "users": user_details,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting new users detail: {e}")
        return {"total_count": 0, "users": [], "period_days": days}


async def get_screen_views_breakdown(
    db: AsyncIOMotorDatabase,
    days: int = 30
) -> Dict[str, Any]:
    """Get breakdown of screen views"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "event_type": "screen_viewed",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$metadata.screen_name",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "count": 1,
                    "unique_users_count": {"$size": "$unique_users"}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 50}
        ]
        
        results = await db.user_events.aggregate(pipeline).to_list(length=50)
        total = sum(r["count"] for r in results)
        
        screens = []
        for r in results:
            if r["_id"]:
                screens.append({
                    "screen_name": r["_id"],
                    "view_count": r["count"],
                    "unique_users": r["unique_users_count"],
                    "percentage": round((r["count"] / total * 100), 1) if total > 0 else 0
                })
        
        return {
            "total_views": total,
            "screens": screens,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting screen views breakdown: {e}")
        return {"total_views": 0, "screens": [], "period_days": days}


async def get_mood_selections_breakdown(
    db: AsyncIOMotorDatabase,
    days: int = 30
) -> Dict[str, Any]:
    """Get breakdown of mood selections"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "event_type": "mood_selected",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$metadata.mood_category",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "count": 1,
                    "unique_users_count": {"$size": "$unique_users"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        results = await db.user_events.aggregate(pipeline).to_list(length=20)
        total = sum(r["count"] for r in results)
        
        moods = []
        for r in results:
            if r["_id"]:
                moods.append({
                    "mood": r["_id"],
                    "selection_count": r["count"],
                    "unique_users": r["unique_users_count"],
                    "percentage": round((r["count"] / total * 100), 1) if total > 0 else 0
                })
        
        return {
            "total_selections": total,
            "moods": moods,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting mood selections breakdown: {e}")
        return {"total_selections": 0, "moods": [], "period_days": days}


async def get_equipment_selections_breakdown(
    db: AsyncIOMotorDatabase,
    days: int = 30
) -> Dict[str, Any]:
    """Get breakdown of equipment selections with mood paths"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Equipment breakdown
        equipment_pipeline = [
            {
                "$match": {
                    "event_type": "equipment_selected",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$metadata.equipment",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"},
                    "mood_paths": {"$push": "$metadata.mood_category"}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 30}
        ]
        
        results = await db.user_events.aggregate(equipment_pipeline).to_list(length=30)
        total = sum(r["count"] for r in results)
        
        equipment_list = []
        for r in results:
            if r["_id"]:
                # Count mood paths
                mood_counts = {}
                for mood in r["mood_paths"]:
                    if mood:
                        mood_counts[mood] = mood_counts.get(mood, 0) + 1
                
                top_moods = sorted(mood_counts.items(), key=lambda x: x[1], reverse=True)[:3]
                
                equipment_list.append({
                    "equipment": r["_id"],
                    "selection_count": r["count"],
                    "unique_users": len(set(r["unique_users"])) if r["unique_users"] else 0,
                    "percentage": round((r["count"] / total * 100), 1) if total > 0 else 0,
                    "top_mood_paths": [{"mood": m[0], "count": m[1]} for m in top_moods]
                })
        
        return {
            "total_selections": total,
            "equipment": equipment_list,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting equipment selections breakdown: {e}")
        return {"total_selections": 0, "equipment": [], "period_days": days}


async def get_difficulty_selections_breakdown(
    db: AsyncIOMotorDatabase,
    days: int = 30
) -> Dict[str, Any]:
    """Get breakdown of difficulty selections"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "event_type": "difficulty_selected",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$metadata.difficulty",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"},
                    "mood_paths": {"$push": "$metadata.mood_category"}
                }
            },
            {"$sort": {"count": -1}}
        ]
        
        results = await db.user_events.aggregate(pipeline).to_list(length=10)
        total = sum(r["count"] for r in results)
        
        difficulties = []
        for r in results:
            if r["_id"]:
                difficulties.append({
                    "difficulty": r["_id"],
                    "selection_count": r["count"],
                    "unique_users": len(set(r["unique_users"])) if r["unique_users"] else 0,
                    "percentage": round((r["count"] / total * 100), 1) if total > 0 else 0
                })
        
        return {
            "total_selections": total,
            "difficulties": difficulties,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting difficulty selections breakdown: {e}")
        return {"total_selections": 0, "difficulties": [], "period_days": days}


async def get_exercises_breakdown(
    db: AsyncIOMotorDatabase,
    days: int = 30
) -> Dict[str, Any]:
    """Get breakdown of exercises completed"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        pipeline = [
            {
                "$match": {
                    "event_type": "exercise_completed",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$metadata.exercise_name",
                    "count": {"$sum": 1},
                    "unique_users": {"$addToSet": "$user_id"}
                }
            },
            {
                "$project": {
                    "_id": 1,
                    "count": 1,
                    "unique_users_count": {"$size": "$unique_users"}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 50}
        ]
        
        results = await db.user_events.aggregate(pipeline).to_list(length=50)
        total = sum(r["count"] for r in results)
        
        exercises = []
        for r in results:
            if r["_id"]:
                exercises.append({
                    "exercise_name": r["_id"],
                    "completion_count": r["count"],
                    "unique_users": r["unique_users_count"],
                    "percentage": round((r["count"] / total * 100), 1) if total > 0 else 0
                })
        
        return {
            "total_completions": total,
            "exercises": exercises,
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting exercises breakdown: {e}")
        return {"total_completions": 0, "exercises": [], "period_days": days}


async def get_social_activity_breakdown(
    db: AsyncIOMotorDatabase,
    days: int = 30
) -> Dict[str, Any]:
    """Get breakdown of social activity (likes, comments, follows)"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Get top likers
        likers_pipeline = [
            {
                "$match": {
                    "event_type": "post_liked",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        top_likers = await db.user_events.aggregate(likers_pipeline).to_list(length=10)
        
        # Get top commenters
        commenters_pipeline = [
            {
                "$match": {
                    "event_type": "post_commented",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        top_commenters = await db.user_events.aggregate(commenters_pipeline).to_list(length=10)
        
        # Enrich with usernames
        async def enrich_users(user_list):
            enriched = []
            for item in user_list:
                user = await db.users.find_one({"_id": ObjectId(item["_id"])})
                enriched.append({
                    "user_id": item["_id"],
                    "username": user.get("username", "Unknown") if user else "Unknown",
                    "avatar_url": user.get("avatar_url", "") if user else "",
                    "count": item["count"]
                })
            return enriched
        
        return {
            "top_likers": await enrich_users(top_likers),
            "top_commenters": await enrich_users(top_commenters),
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting social activity breakdown: {e}")
        return {"top_likers": [], "top_commenters": [], "period_days": days}


async def get_workout_funnel_detail(
    db: AsyncIOMotorDatabase,
    days: int = 30
) -> Dict[str, Any]:
    """Get detailed workout funnel with user breakdowns"""
    try:
        start_date = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Users who started workouts
        started_pipeline = [
            {
                "$match": {
                    "event_type": "workout_started",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        # Users who completed workouts
        completed_pipeline = [
            {
                "$match": {
                    "event_type": "workout_completed",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        # Users who abandoned workouts
        abandoned_pipeline = [
            {
                "$match": {
                    "event_type": "workout_abandoned",
                    "timestamp": {"$gte": start_date}
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        started_users = await db.user_events.aggregate(started_pipeline).to_list(length=1000)
        completed_users = await db.user_events.aggregate(completed_pipeline).to_list(length=1000)
        abandoned_users = await db.user_events.aggregate(abandoned_pipeline).to_list(length=1000)
        
        return {
            "users_who_started": len(started_users),
            "users_who_completed": len(completed_users),
            "users_who_abandoned": len(abandoned_users),
            "total_starts": sum(u["count"] for u in started_users),
            "total_completions": sum(u["count"] for u in completed_users),
            "total_abandonments": sum(u["count"] for u in abandoned_users),
            "period_days": days
        }
        
    except Exception as e:
        logger.error(f"Error getting workout funnel detail: {e}")
        return {}
