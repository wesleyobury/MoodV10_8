"""
Admin Analytics Module
Advanced analytics endpoints for the admin panel including:
- Funnel analysis
- Retention cohorts
- User search and timeline

All analytics exclude internal users (is_internal=true) by default.
Use include_internal=true to include them.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Set
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


async def get_internal_user_ids(db: AsyncIOMotorDatabase) -> Set[str]:
    """Get set of internal user IDs to exclude from analytics."""
    internal_users = await db.users.find(
        {"is_internal": True},
        {"_id": 1}
    ).to_list(1000)
    return {str(u["_id"]) for u in internal_users}


async def get_funnel_analysis(
    db: AsyncIOMotorDatabase,
    start_date: datetime,
    end_date: datetime,
    steps: Optional[List[str]] = None,
    include_users: bool = False,
    limit_users: int = 100,
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get funnel analysis with conversion rates between steps.
    
    Default funnel steps:
    1. app_session_start (or app_opened)
    2. mood_selected (user engaged with workout builder)
    3. workout_started
    4. workout_completed
    5. post_created
    
    Returns conversion rates and optionally user lists for each step.
    Excludes internal users by default (include_internal=False).
    """
    try:
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            excluded_user_ids = await get_internal_user_ids(db)
        
        # Default funnel steps if not provided
        if not steps:
            steps = [
                "app_session_start",
                "mood_selected",
                "workout_started",
                "workout_completed",
                "post_created"
            ]
        
        # Base filter
        base_filter = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
        }
        if excluded_user_ids:
            base_filter["user_id"] = {"$nin": list(excluded_user_ids)}
        
        funnel_data = []
        previous_users = None
        
        for i, step in enumerate(steps):
            # Get unique users who completed this step.
            # Tokens support an optional ":<n>" suffix to split events that
            # share one event_type by metadata.step — e.g.
            # "onboarding_step_completed:3" → onboarding funnel step 3.
            event_type = step
            meta_step = None
            if ":" in step:
                candidate, _, suffix = step.partition(":")
                try:
                    meta_step = int(suffix)
                    event_type = candidate
                except ValueError:
                    meta_step = None
            step_filter = {**base_filter, "event_type": event_type}
            if meta_step is not None:
                step_filter["metadata.step"] = meta_step
            
            # For registration, check users collection
            if step in ["user_registered", "signup"]:
                user_filter = {"created_at": {"$gte": start_date, "$lte": end_date}}
                if not include_internal:
                    user_filter["is_internal"] = {"$ne": True}
                users_cursor = db.users.find(user_filter, {"_id": 1})
                user_ids = set()
                async for user in users_cursor:
                    user_ids.add(str(user["_id"]))
            else:
                user_ids_list = await db.user_events.distinct("user_id", step_filter)
                user_ids = set(uid for uid in user_ids_list if uid not in excluded_user_ids)
            
            # Calculate conversion from previous step
            if i == 0:
                conversion_rate = 100.0
                dropoff_rate = 0.0
                converted_users = user_ids
                dropped_users = set()
            else:
                if previous_users and len(previous_users) > 0:
                    converted_users = user_ids & previous_users
                    dropped_users = previous_users - user_ids
                    conversion_rate = round((len(converted_users) / len(previous_users)) * 100, 2)
                    dropoff_rate = round(100 - conversion_rate, 2)
                else:
                    converted_users = set()
                    dropped_users = set()
                    conversion_rate = 0.0
                    dropoff_rate = 100.0
            
            step_data = {
                "step": step,
                "step_index": i,
                "step_label": _get_step_label(step),
                "unique_users": len(user_ids),
                "converted_users": len(converted_users) if i > 0 else len(user_ids),
                "dropped_users": len(dropped_users),
                "conversion_rate": conversion_rate,
                "dropoff_rate": dropoff_rate,
            }
            
            # Include user samples if requested
            if include_users:
                # Get user details for converted users (limited)
                converted_sample = list(converted_users)[:limit_users] if i > 0 else list(user_ids)[:limit_users]
                dropped_sample = list(dropped_users)[:limit_users]
                
                step_data["converted_user_ids"] = converted_sample
                step_data["dropped_user_ids"] = dropped_sample
            
            funnel_data.append(step_data)
            previous_users = user_ids
        
        # Calculate overall funnel conversion
        if funnel_data and len(funnel_data) >= 2:
            overall_conversion = round(
                (funnel_data[-1]["unique_users"] / funnel_data[0]["unique_users"]) * 100, 2
            ) if funnel_data[0]["unique_users"] > 0 else 0
        else:
            overall_conversion = 0
        
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "steps": funnel_data,
            "overall_conversion": overall_conversion,
            "total_entry_users": funnel_data[0]["unique_users"] if funnel_data else 0,
            "total_completed_users": funnel_data[-1]["unique_users"] if funnel_data else 0,
        }
        
    except Exception as e:
        logger.error(f"Error getting funnel analysis: {e}")
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "steps": [],
            "overall_conversion": 0,
            "error": str(e)
        }


def _get_step_label(step: str) -> str:
    """Get human-readable label for funnel step"""
    labels = {
        "app_session_start": "App Opened",
        "app_opened": "App Opened",
        "user_registered": "Signed Up",
        "signup": "Signed Up",
        "mood_selected": "Selected Mood/Goal",
        "equipment_selected": "Selected Equipment",
        "difficulty_selected": "Selected Difficulty",
        "workout_started": "Started Workout",
        "workout_completed": "Completed Workout",
        "post_created": "Created Post",
        "try_workout_clicked": "Clicked Try Workout",
        "workout_added_to_cart": "Added to Cart",
        "featured_workout_clicked": "Clicked Featured",
        "featured_workout_started": "Started Featured",
        "featured_workout_completed": "Completed Featured",
    }
    return labels.get(step, step.replace("_", " ").title())


async def get_retention_cohorts(
    db: AsyncIOMotorDatabase,
    start_date: datetime,
    end_date: datetime,
    cohort_period: str = "week",  # "day", "week", "month"
    retention_window: int = 28,  # days to track retention
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get retention cohort analysis.
    
    Groups users by signup date (cohort) and tracks their return activity
    over the retention window.
    
    Returns:
    - Cohort labels
    - Retention percentages for D1, D7, D14, D28 (or custom window)
    - Heatmap data for visualization
    
    Excludes internal users by default (include_internal=False).
    """
    try:
        # Build user filter
        user_filter = {"created_at": {"$gte": start_date, "$lte": end_date}}
        if not include_internal:
            user_filter["is_internal"] = {"$ne": True}
        
        # Get all users who signed up in the date range
        users = await db.users.find(
            user_filter,
            {"_id": 1, "created_at": 1, "username": 1}
        ).to_list(100000)
        
        if not users:
            return {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "cohort_period": cohort_period,
                "retention_window": retention_window,
                "cohorts": [],
                "retention_days": [],
                "heatmap_data": [],
                "include_internal": include_internal,
            }
        
        # Group users into cohorts
        cohorts = defaultdict(list)
        
        for user in users:
            user_id = str(user["_id"])
            signup_date = user.get("created_at")
            
            if not signup_date:
                continue
            
            # Determine cohort key based on period
            if cohort_period == "day":
                cohort_key = signup_date.strftime("%Y-%m-%d")
            elif cohort_period == "week":
                # Start of week (Monday)
                week_start = signup_date - timedelta(days=signup_date.weekday())
                cohort_key = week_start.strftime("%Y-%m-%d")
            else:  # month
                cohort_key = signup_date.strftime("%Y-%m")
            
            cohorts[cohort_key].append({
                "user_id": user_id,
                "signup_date": signup_date
            })
        
        # Define retention days to track
        if retention_window <= 7:
            retention_days = list(range(1, retention_window + 1))
        elif retention_window <= 14:
            retention_days = [1, 3, 7] + list(range(8, retention_window + 1, 2))
        else:
            retention_days = [1, 3, 7, 14, 21, 28][:min(6, (retention_window // 7) + 2)]
        
        # Calculate retention for each cohort
        cohort_results = []
        heatmap_data = []
        
        for cohort_key in sorted(cohorts.keys()):
            cohort_users = cohorts[cohort_key]
            cohort_size = len(cohort_users)
            
            if cohort_size == 0:
                continue
            
            cohort_retention = {
                "cohort": cohort_key,
                "cohort_label": _format_cohort_label(cohort_key, cohort_period),
                "cohort_size": cohort_size,
                "retention": {}
            }
            
            for day in retention_days:
                retained_count = 0
                
                for user_data in cohort_users:
                    user_id = user_data["user_id"]
                    signup_date = user_data["signup_date"]
                    
                    # Calculate the retention day window
                    day_start = signup_date + timedelta(days=day)
                    day_end = day_start + timedelta(days=1)
                    
                    # Check if user had any activity on that day
                    activity = await db.user_events.find_one({
                        "user_id": user_id,
                        "timestamp": {"$gte": day_start, "$lt": day_end}
                    })
                    
                    if activity:
                        retained_count += 1
                
                retention_pct = round((retained_count / cohort_size) * 100, 1)
                cohort_retention["retention"][f"D{day}"] = {
                    "retained": retained_count,
                    "percentage": retention_pct
                }
                
                # Add to heatmap data
                heatmap_data.append({
                    "cohort": cohort_key,
                    "day": f"D{day}",
                    "value": retention_pct
                })
            
            cohort_results.append(cohort_retention)
        
        # Calculate average retention across all cohorts
        avg_retention = {}
        for day in retention_days:
            day_key = f"D{day}"
            values = [c["retention"].get(day_key, {}).get("percentage", 0) for c in cohort_results]
            avg_retention[day_key] = round(sum(values) / len(values), 1) if values else 0
        
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "cohort_period": cohort_period,
            "retention_window": retention_window,
            "retention_days": [f"D{d}" for d in retention_days],
            "cohorts": cohort_results,
            "average_retention": avg_retention,
            "heatmap_data": heatmap_data,
            "total_users": sum(c["cohort_size"] for c in cohort_results),
        }
        
    except Exception as e:
        logger.error(f"Error getting retention cohorts: {e}")
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "cohort_period": cohort_period,
            "retention_window": retention_window,
            "cohorts": [],
            "error": str(e)
        }


def _format_cohort_label(cohort_key: str, period: str) -> str:
    """Format cohort key into human-readable label"""
    try:
        if period == "month":
            dt = datetime.strptime(cohort_key, "%Y-%m")
            return dt.strftime("%b %Y")
        else:
            dt = datetime.strptime(cohort_key, "%Y-%m-%d")
            if period == "week":
                return f"Week of {dt.strftime('%b %d')}"
            return dt.strftime("%b %d")
    except:
        return cohort_key


async def search_users(
    db: AsyncIOMotorDatabase,
    query: str,
    limit: int = 50,
    skip: int = 0
) -> Dict[str, Any]:
    """
    Search users by email, username, or user_id.
    Returns user details with activity summary.
    """
    try:
        if not query or len(query) < 2:
            return {"users": [], "total": 0, "query": query}
        
        # Build search filter
        search_filter = {
            "$or": [
                {"username": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
            ]
        }
        
        # Also try to match by ObjectId if query looks like one
        if len(query) == 24:
            try:
                search_filter["$or"].append({"_id": ObjectId(query)})
            except:
                pass
        
        # Get matching users
        users_cursor = db.users.find(search_filter).skip(skip).limit(limit).sort("created_at", -1)
        users = await users_cursor.to_list(limit)
        
        total = await db.users.count_documents(search_filter)
        
        # Enrich with activity data
        enriched_users = []
        for user in users:
            user_id = str(user["_id"])
            
            # Get activity counts (last 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            
            sessions = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "app_session_start",
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            workouts_started = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "workout_started",
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            workouts_completed = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "workout_completed",
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            posts = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "post_created",
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            # Get last active
            last_event = await db.user_events.find_one(
                {"user_id": user_id},
                sort=[("timestamp", -1)]
            )
            
            # Get login info
            auth_meta = user.get("auth_metadata", {})
            
            enriched_users.append({
                "user_id": user_id,
                "username": user.get("username", ""),
                "email": user.get("email", ""),
                "name": user.get("name", ""),
                "avatar": user.get("avatar", ""),
                "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
                "last_active": last_event["timestamp"].isoformat() if last_event else None,
                "is_admin": user.get("is_admin", False),
                "auth_provider": auth_meta.get("login_methods", ["unknown"])[0] if auth_meta.get("login_methods") else "unknown",
                "total_logins": auth_meta.get("total_logins", 0),
                "activity_30d": {
                    "sessions": sessions,
                    "workouts_started": workouts_started,
                    "workouts_completed": workouts_completed,
                    "posts": posts,
                },
                "followers_count": user.get("followers_count", 0),
                "following_count": user.get("following_count", 0),
                "current_streak": user.get("current_streak", 0),
            })
        
        return {
            "users": enriched_users,
            "total": total,
            "query": query,
            "limit": limit,
            "skip": skip,
        }
        
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        return {"users": [], "total": 0, "query": query, "error": str(e)}


async def get_user_timeline(
    db: AsyncIOMotorDatabase,
    user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 200,
    event_types: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Get detailed event timeline for a specific user.
    Includes all events with metadata, grouped by day.
    """
    try:
        # Validate user exists
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            user = await db.users.find_one({"user_id": user_id})
        
        if not user:
            return {"user_id": user_id, "events": [], "error": "User not found"}
        
        # Build query
        query = {"user_id": user_id}
        
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = start_date
            if end_date:
                query["timestamp"]["$lte"] = end_date
        
        if event_types:
            query["event_type"] = {"$in": event_types}
        
        # Get events
        events_cursor = db.user_events.find(query).sort("timestamp", -1).limit(limit)
        events = await events_cursor.to_list(limit)
        
        # Format events
        formatted_events = []
        events_by_day = defaultdict(list)
        
        for event in events:
            formatted = {
                "event_id": str(event["_id"]),
                "event_type": event["event_type"],
                "event_label": _get_step_label(event["event_type"]),
                "category": event.get("event_category", "other"),
                "timestamp": event["timestamp"].isoformat(),
                "metadata": event.get("metadata", {}),
            }
            formatted_events.append(formatted)
            
            # Group by day
            day_key = event["timestamp"].strftime("%Y-%m-%d")
            events_by_day[day_key].append(formatted)
        
        # Get user summary
        user_summary = {
            "user_id": user_id,
            "username": user.get("username", ""),
            "email": user.get("email", ""),
            "name": user.get("name", ""),
            "avatar": user.get("avatar", ""),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            "is_admin": user.get("is_admin", False),
            "current_streak": user.get("current_streak", 0),
            "total_workouts": user.get("total_workouts", 0),
        }
        
        # Get login history
        login_history = await db.login_events.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(10).to_list(10)
        
        formatted_logins = [
            {
                "timestamp": l["timestamp"].isoformat(),
                "method": l.get("login_method", "unknown"),
                "success": l.get("success", True),
                "ip_address": l.get("ip_address"),
                "device_info": l.get("device_info"),
            }
            for l in login_history
        ]
        
        # Get sessions
        active_sessions = await db.user_sessions.find(
            {"user_id": user_id, "is_active": True}
        ).sort("last_activity", -1).limit(5).to_list(5)
        
        formatted_sessions = [
            {
                "created_at": s["created_at"].isoformat(),
                "last_activity": s["last_activity"].isoformat(),
                "device_type": s.get("device_type", "unknown"),
                "login_method": s.get("login_method", "unknown"),
            }
            for s in active_sessions
        ]
        
        return {
            "user": user_summary,
            "events": formatted_events,
            "events_by_day": dict(events_by_day),
            "total_events": len(formatted_events),
            "login_history": formatted_logins,
            "active_sessions": formatted_sessions,
            "date_range": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None,
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting user timeline: {e}")
        return {"user_id": user_id, "events": [], "error": str(e)}


async def get_comparison_stats(
    db: AsyncIOMotorDatabase,
    current_start: datetime,
    current_end: datetime,
    previous_start: datetime,
    previous_end: datetime,
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get comparison stats between two periods for KPI cards.
    Returns current values, previous values, and percentage change.
    Excludes internal users by default.
    """
    try:
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            excluded_user_ids = await get_internal_user_ids(db)
        
        exclude_filter = {}
        if excluded_user_ids:
            exclude_filter = {"user_id": {"$nin": list(excluded_user_ids)}}
        
        async def count_events(event_type: str, start: datetime, end: datetime) -> int:
            query = {
                "event_type": event_type,
                "timestamp": {"$gte": start, "$lte": end},
            }
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            return await db.user_events.count_documents(query)
        
        async def count_unique_users(event_type: str, start: datetime, end: datetime) -> int:
            query = {
                "event_type": event_type,
                "timestamp": {"$gte": start, "$lte": end},
            }
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            users = await db.user_events.distinct("user_id", query)
            return len([u for u in users if u not in excluded_user_ids])
        
        async def count_active_users(start: datetime, end: datetime) -> int:
            query = {"timestamp": {"$gte": start, "$lte": end}}
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            users = await db.user_events.distinct("user_id", query)
            return len([u for u in users if u not in excluded_user_ids])
        
        async def count_new_users(start: datetime, end: datetime) -> int:
            query = {"created_at": {"$gte": start, "$lte": end}}
            if not include_internal:
                query["is_internal"] = {"$ne": True}
            return await db.users.count_documents(query)
        
        # Calculate metrics for both periods
        metrics = {}
        
        # DAU (Daily Active Users) - average per day in period
        current_days = max(1, (current_end - current_start).days)
        previous_days = max(1, (previous_end - previous_start).days)
        
        current_active = await count_active_users(current_start, current_end)
        previous_active = await count_active_users(previous_start, previous_end)
        
        metrics["active_users"] = _calc_change(current_active, previous_active)
        metrics["dau_avg"] = _calc_change(
            round(current_active / current_days, 1),
            round(previous_active / previous_days, 1)
        )
        
        # New users
        current_new = await count_new_users(current_start, current_end)
        previous_new = await count_new_users(previous_start, previous_end)
        metrics["new_users"] = _calc_change(current_new, previous_new)
        
        # Workouts
        current_started = await count_events("workout_started", current_start, current_end)
        previous_started = await count_events("workout_started", previous_start, previous_end)
        metrics["workouts_started"] = _calc_change(current_started, previous_started)
        
        current_completed = await count_events("workout_completed", current_start, current_end)
        previous_completed = await count_events("workout_completed", previous_start, previous_end)
        metrics["workouts_completed"] = _calc_change(current_completed, previous_completed)
        
        # Completion rate
        current_rate = round((current_completed / current_started * 100), 1) if current_started > 0 else 0
        previous_rate = round((previous_completed / previous_started * 100), 1) if previous_started > 0 else 0
        metrics["completion_rate"] = _calc_change(current_rate, previous_rate, is_percentage=True)
        
        # Posts
        current_posts = await count_events("post_created", current_start, current_end)
        previous_posts = await count_events("post_created", previous_start, previous_end)
        metrics["posts_created"] = _calc_change(current_posts, previous_posts)
        
        # Social engagement
        current_likes = await count_events("post_liked", current_start, current_end)
        previous_likes = await count_events("post_liked", previous_start, previous_end)
        metrics["likes"] = _calc_change(current_likes, previous_likes)
        
        current_comments = await count_events("post_commented", current_start, current_end)
        previous_comments = await count_events("post_commented", previous_start, previous_end)
        metrics["comments"] = _calc_change(current_comments, previous_comments)
        
        current_follows = await count_events("user_followed", current_start, current_end)
        previous_follows = await count_events("user_followed", previous_start, previous_end)
        metrics["follows"] = _calc_change(current_follows, previous_follows)
        
        # Notification clicks (proxy for IG shares / push CTR)
        current_notif = await count_events("notification_clicked", current_start, current_end)
        previous_notif = await count_events("notification_clicked", previous_start, previous_end)
        metrics["notification_clicks"] = _calc_change(current_notif, previous_notif)
        
        # App sessions
        current_sessions = await count_events("app_session_start", current_start, current_end)
        previous_sessions = await count_events("app_session_start", previous_start, previous_end)
        metrics["app_sessions"] = _calc_change(current_sessions, previous_sessions)
        
        return {
            "current_period": {
                "start": current_start.isoformat(),
                "end": current_end.isoformat(),
            },
            "previous_period": {
                "start": previous_start.isoformat(),
                "end": previous_end.isoformat(),
            },
            "metrics": metrics
        }
        
    except Exception as e:
        logger.error(f"Error getting comparison stats: {e}")
        return {"metrics": {}, "error": str(e)}


def _calc_change(current: float, previous: float, is_percentage: bool = False) -> Dict[str, Any]:
    """Calculate change between two values"""
    if previous == 0:
        change_pct = 100 if current > 0 else 0
    else:
        change_pct = round(((current - previous) / previous) * 100, 1)
    
    return {
        "current": current,
        "previous": previous,
        "change": round(current - previous, 2),
        "change_pct": change_pct,
        "trend": "up" if change_pct > 0 else ("down" if change_pct < 0 else "flat"),
        "is_percentage": is_percentage,
    }


async def get_engagement_metrics(
    db: AsyncIOMotorDatabase,
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get WAU, MAU, and DAU/MAU stickiness metrics.
    Uses app_session_start as the primary activity event.
    Excludes internal users by default.
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            excluded_user_ids = await get_internal_user_ids(db)
        
        # Define time windows
        day_ago = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Build query filter
        def build_query(event_type: str, since: datetime) -> dict:
            query = {
                "event_type": event_type,
                "timestamp": {"$gte": since},
            }
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            return query
        
        # DAU - unique users with app_session_start today
        dau_users = await db.user_events.distinct("user_id", build_query("app_session_start", day_ago))
        dau = len([u for u in dau_users if u not in excluded_user_ids])
        
        # WAU - unique users with app_session_start in last 7 days
        wau_users = await db.user_events.distinct("user_id", build_query("app_session_start", week_ago))
        wau = len([u for u in wau_users if u not in excluded_user_ids])
        
        # MAU - unique users with app_session_start in last 30 days
        mau_users = await db.user_events.distinct("user_id", build_query("app_session_start", month_ago))
        mau = len([u for u in mau_users if u not in excluded_user_ids])
        
        # DAU/MAU stickiness
        stickiness = round((dau / mau * 100), 1) if mau > 0 else 0
        
        # WAU/MAU ratio
        wau_mau_ratio = round((wau / mau * 100), 1) if mau > 0 else 0
        
        return {
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "stickiness_dau_mau": stickiness,
            "wau_mau_ratio": wau_mau_ratio,
            "computed_at": now.isoformat(),
            "note": "Primary event: app_session_start",
            "include_internal": include_internal,
        }
        
    except Exception as e:
        logger.error(f"Error getting engagement metrics: {e}")
        return {
            "dau": 0,
            "wau": 0,
            "mau": 0,
            "stickiness_dau_mau": 0,
            "wau_mau_ratio": 0,
            "error": str(e)
        }
