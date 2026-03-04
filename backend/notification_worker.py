"""
MOOD Notification Background Worker
Handles scheduled jobs for:
- Daily following activity digest
- Workout reminders
- Featured suggestions
- Quiet hours "While you were away" digest
"""

import asyncio
import logging
from datetime import datetime, timezone, timedelta, time
from typing import Optional, List, Dict, Any
import random
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Import notification service components
from notifications import (
    NotificationService,
    NotificationType,
    SUGGESTION_COPY_LIBRARY,
)


class NotificationWorker:
    """Background worker for scheduled notification jobs"""
    
    def __init__(self, db):
        self.db = db
        self.notification_service = NotificationService(db)
        self.running = False
        self._task = None
    
    async def start(self):
        """Start the background worker"""
        if self.running:
            logger.warning("Worker already running")
            return
        
        self.running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info("🚀 Notification worker started")
    
    async def stop(self):
        """Stop the background worker"""
        self.running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 Notification worker stopped")
    
    async def _run_loop(self):
        """Main worker loop - runs every minute"""
        while self.running:
            try:
                now = datetime.now(timezone.utc)
                current_minute = now.minute
                current_hour = now.hour
                
                # Run different jobs at different intervals
                
                # Every minute: Check for quiet hours ending
                await self._check_quiet_hours_ending()
                
                # Every hour at :00: Check for digest deliveries
                if current_minute == 0:
                    await self._process_scheduled_digests(current_hour)
                
                # Every 15 minutes: Process any pending bundled notifications
                if current_minute in [0, 15, 30, 45]:
                    await self._process_pending_bundles()
                
                # Sleep for 60 seconds
                await asyncio.sleep(60)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Worker loop error: {e}")
                await asyncio.sleep(60)
    
    # ============================================
    # DIGEST JOBS
    # ============================================
    
    async def _process_scheduled_digests(self, current_hour: int):
        """Process scheduled digest notifications for users whose digest time matches"""
        logger.info(f"📬 Processing scheduled digests for hour {current_hour}:00")
        
        # Find users whose digest_time matches current hour
        # Format: "HH:00" e.g., "18:00"
        hour_str = f"{current_hour:02d}:00"
        
        # Get users with matching digest time and enabled digests
        settings_cursor = self.db.notification_settings.find({
            "notifications_enabled": True,
            "following_digest_enabled": True,
            "digest_time": hour_str,
            "following_digest_frequency": {"$ne": "off"}
        })
        
        count = 0
        async for settings in settings_cursor:
            user_id = settings["user_id"]
            frequency = settings.get("following_digest_frequency", "daily")
            
            # Check frequency
            if not self._should_send_digest(frequency):
                continue
            
            # Generate and send digest
            try:
                await self._send_following_digest(user_id)
                count += 1
            except Exception as e:
                logger.error(f"Error sending digest to user {user_id[:8]}...: {e}")
        
        if count > 0:
            logger.info(f"📬 Sent {count} digest notifications")
    
    def _should_send_digest(self, frequency: str) -> bool:
        """Check if digest should be sent based on frequency"""
        if frequency == "daily":
            return True
        elif frequency == "3x_week":
            # Send on Mon, Wed, Fri (0, 2, 4)
            return datetime.now(timezone.utc).weekday() in [0, 2, 4]
        return False
    
    async def _send_following_digest(self, user_id: str) -> Optional[str]:
        """Generate and send following activity digest to a user"""
        # Get users this person follows
        following = await self.db.follows.find({
            "follower_id": ObjectId(user_id)
        }).to_list(1000)
        
        if not following:
            return None
        
        following_ids = [f["following_id"] for f in following]
        
        # Get activity from followed users in last 24 hours
        yesterday = datetime.now(timezone.utc) - timedelta(days=1)
        
        # Count workout completions from followed users
        workout_count = await self.db.analytics.count_documents({
            "user_id": {"$in": [str(fid) for fid in following_ids]},
            "event_type": "workoutSessionCompleted",
            "timestamp": {"$gte": yesterday}
        })
        
        # Count posts from followed users
        post_count = await self.db.posts.count_documents({
            "author_id": {"$in": following_ids},
            "created_at": {"$gte": yesterday}
        })
        
        if workout_count == 0 and post_count == 0:
            return None  # No activity to report
        
        # Build digest message
        parts = []
        if workout_count > 0:
            parts.append(f"{workout_count} {'person' if workout_count == 1 else 'people'} you follow worked out")
        if post_count > 0:
            parts.append(f"{post_count} new {'post' if post_count == 1 else 'posts'}")
        
        body = " • ".join(parts) + " today"
        
        return await self.notification_service.create_notification(
            user_id=user_id,
            notification_type=NotificationType.FOLLOWING_DIGEST,
            title="Today's Activity",
            body=body,
            metadata={
                "workout_count": workout_count,
                "post_count": post_count,
            }
        )
    
    # ============================================
    # QUIET HOURS JOBS
    # ============================================
    
    async def _check_quiet_hours_ending(self):
        """Check for users whose quiet hours just ended and send 'While you were away' digest"""
        now = datetime.now(timezone.utc)
        current_time_str = f"{now.hour:02d}:{now.minute:02d}"
        
        # Round to nearest 5 minutes for matching
        minute_rounded = (now.minute // 5) * 5
        check_time = f"{now.hour:02d}:{minute_rounded:02d}"
        
        # Find users whose quiet hours end at this time
        settings_cursor = self.db.notification_settings.find({
            "notifications_enabled": True,
            "quiet_hours_enabled": True,
            "quiet_hours_end": check_time
        })
        
        async for settings in settings_cursor:
            user_id = settings["user_id"]
            
            try:
                await self._send_while_away_digest(user_id, settings)
            except Exception as e:
                logger.error(f"Error sending while-away digest: {e}")
    
    async def _send_while_away_digest(self, user_id: str, settings: dict):
        """Send 'While you were away' summary after quiet hours end"""
        # Calculate quiet hours window
        quiet_start = settings.get("quiet_hours_start", "22:00")
        quiet_end = settings.get("quiet_hours_end", "08:00")
        
        # Get unread notifications created during quiet hours
        # (This is simplified - in production, track quiet hours window precisely)
        now = datetime.now(timezone.utc)
        
        # Estimate quiet period (assuming overnight)
        start_parts = quiet_start.split(":")
        end_parts = quiet_end.split(":")
        
        # Calculate hours in quiet period
        start_hour = int(start_parts[0])
        end_hour = int(end_parts[0])
        
        if end_hour < start_hour:
            # Overnight quiet hours
            hours_quiet = (24 - start_hour) + end_hour
        else:
            hours_quiet = end_hour - start_hour
        
        quiet_start_time = now - timedelta(hours=hours_quiet)
        
        # Count unread notifications from quiet period
        unread_count = await self.db.notifications.count_documents({
            "user_id": user_id,
            "read_at": None,
            "created_at": {"$gte": quiet_start_time, "$lte": now},
            "type": {"$ne": NotificationType.WHILE_AWAY_DIGEST.value}
        })
        
        if unread_count == 0:
            return None
        
        # Get breakdown by type
        pipeline = [
            {
                "$match": {
                    "user_id": user_id,
                    "read_at": None,
                    "created_at": {"$gte": quiet_start_time, "$lte": now},
                    "type": {"$ne": NotificationType.WHILE_AWAY_DIGEST.value}
                }
            },
            {
                "$group": {
                    "_id": "$type",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        type_counts = {}
        async for doc in self.db.notifications.aggregate(pipeline):
            type_counts[doc["_id"]] = doc["count"]
        
        # Build summary message
        parts = []
        if type_counts.get("like", 0) > 0:
            parts.append(f"{type_counts['like']} likes")
        if type_counts.get("comment", 0) > 0:
            parts.append(f"{type_counts['comment']} comments")
        if type_counts.get("follow", 0) > 0:
            parts.append(f"{type_counts['follow']} new followers")
        if type_counts.get("message", 0) > 0:
            parts.append(f"{type_counts['message']} messages")
        
        if not parts:
            parts.append(f"{unread_count} notifications")
        
        body = "While you were away: " + ", ".join(parts)
        
        return await self.notification_service.create_notification(
            user_id=user_id,
            notification_type=NotificationType.WHILE_AWAY_DIGEST,
            title="Good Morning",
            body=body,
            metadata={
                "total_unread": unread_count,
                "type_breakdown": type_counts
            }
        )
    
    # ============================================
    # BUNDLE PROCESSING
    # ============================================
    
    async def _process_pending_bundles(self):
        """Process any pending notification bundles that need to be sent"""
        # This handles follow bundling (if multiple follows in 30 min, bundle)
        now = datetime.now(timezone.utc)
        thirty_mins_ago = now - timedelta(minutes=30)
        
        # Find users with multiple unbundled follow notifications
        pipeline = [
            {
                "$match": {
                    "type": NotificationType.FOLLOW.value,
                    "created_at": {"$gte": thirty_mins_ago},
                    "group_key": None,  # Not already bundled
                    "delivered_push_at": None  # Push not sent yet
                }
            },
            {
                "$group": {
                    "_id": "$user_id",
                    "count": {"$sum": 1},
                    "notification_ids": {"$push": "$_id"}
                }
            },
            {
                "$match": {
                    "count": {"$gte": 3}  # 3 or more follows in 30 min
                }
            }
        ]
        
        async for group in self.db.notifications.aggregate(pipeline):
            user_id = group["_id"]
            count = group["count"]
            notification_ids = group["notification_ids"]
            
            # Create bundled notification
            bundle_key = f"follows_bundle_{now.strftime('%Y%m%d%H%M')}"
            
            # Get the most recent follower name
            latest = await self.db.notifications.find_one(
                {"_id": notification_ids[-1]}
            )
            
            if latest:
                last_actor = latest.get("metadata", {}).get("follower_username", "Someone")
                
                # Create bundle notification
                await self.notification_service.create_notification(
                    user_id=user_id,
                    notification_type=NotificationType.FOLLOW,
                    title="New Followers",
                    body=f"{last_actor} and {count - 1} others followed you",
                    group_key=bundle_key,
                    metadata={"follow_count": count}
                )
                
                # Mark original notifications as grouped
                await self.db.notifications.update_many(
                    {"_id": {"$in": notification_ids}},
                    {"$set": {"group_key": bundle_key}}
                )
                
                logger.info(f"📦 Bundled {count} follow notifications for user {user_id[:8]}...")
    
    # ============================================
    # MANUAL TRIGGERS (for admin use)
    # ============================================
    
    async def trigger_mass_workout_reminder(self, custom_message: Optional[str] = None, sender_user_id: Optional[str] = None) -> int:
        """Send workout reminder to all users with reminders enabled"""
        count = 0
        
        # Resolve admin actor_id for sender attribution
        actor_id = sender_user_id or await self.notification_service.get_admin_user_id()
        
        users = await self.db.users.find({"is_banned": {"$ne": True}}).to_list(10000)
        
        for user in users:
            user_id = str(user["_id"])
            settings = await self.notification_service.get_user_settings(user_id)
            
            if not settings.get("notifications_enabled") or not settings.get("workout_reminders_enabled"):
                continue
            
            # Check quiet hours
            if self.notification_service._is_in_quiet_hours(settings):
                continue
            
            result = await self.notification_service.trigger_workout_reminder(
                user_id=user_id,
                custom_message=custom_message,
                actor_id=actor_id
            )
            
            if result:
                count += 1
        
        logger.info(f"💪 Sent workout reminders to {count} users")
        return count
    
    async def trigger_featured_suggestion_blast(self, custom_copy: Optional[str] = None) -> int:
        """Send featured suggestion to all eligible users"""
        return await self.notification_service.send_featured_suggestion_to_all(custom_copy)


# Global worker instance
_worker: Optional[NotificationWorker] = None


def get_notification_worker(db) -> NotificationWorker:
    """Get or create the notification worker singleton"""
    global _worker
    if _worker is None:
        _worker = NotificationWorker(db)
    return _worker


async def start_notification_worker(db):
    """Start the notification background worker"""
    worker = get_notification_worker(db)
    await worker.start()


async def stop_notification_worker():
    """Stop the notification background worker"""
    global _worker
    if _worker:
        await _worker.stop()
        _worker = None
