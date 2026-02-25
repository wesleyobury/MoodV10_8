"""
MOOD Premium Notifications System
Phase 1: Backend models, device tokens, push for Messages/Follows/Comments

This module handles:
- Notification data models and storage
- Device token management
- Push notification delivery via Expo
- Event triggers for social interactions
- Deep link generation
"""

import os
import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
from enum import Enum

# Import standardized push copy
from push_copy import build_push_content, get_engagement_action

logger = logging.getLogger(__name__)

# ============================================
# NOTIFICATION TYPES & CONSTANTS
# ============================================

class NotificationType(str, Enum):
    # Social (Phase 1)
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    MESSAGE = "message"
    MESSAGE_REQUEST = "message_request"
    MENTION = "mention"  # @mention in a comment
    REPLY = "reply"  # Reply to your comment
    
    # Engagement (Phase 3-4)
    WORKOUT_REMINDER = "workout_reminder"
    FEATURED_WORKOUT = "featured_workout"
    FEATURED_SUGGESTION = "featured_suggestion"
    FOLLOWING_DIGEST = "following_digest"
    
    # System
    WHILE_AWAY_DIGEST = "while_away_digest"


# Premium copy library for featured suggestions
SUGGESTION_COPY_LIBRARY = [
    "What are you feeling today?",
    "Pick a MOOD. We'll handle the rest.",
    "No plan needed. Just start.",
    "However you feel — move.",
    "Start where you are.",
    "In the MOOD for a sweat?",
    "Want to grow that 🍑 today?",
    "Sweat now. Think later.",
    "This one doesn't waste time.",
    "In the MOOD to get swole?",
    "A short session works.",
    "Meet your body where it is.",
    "Consistency beats intensity.",
    "Training > overthinking.",
    "Quiet grind.",
    "Strength, without the fluff.",
    "Built for today.",
    "Just enough burn.",
    "Move with intent.",
    "Just press start.",
]

# Deep link URL schemes
DEEP_LINK_SCHEMES = {
    NotificationType.LIKE: "mood://notifications",  # Go to notifications tab
    NotificationType.COMMENT: "mood://notifications",  # Go to notifications tab
    NotificationType.FOLLOW: "mood://notifications",  # Go to notifications tab
    NotificationType.MENTION: "mood://notifications",  # Go to notifications tab
    NotificationType.REPLY: "mood://notifications",  # Go to notifications tab
    NotificationType.MESSAGE: "mood://chat/{entity_id}",
    NotificationType.FEATURED_WORKOUT: "mood://cart/{entity_id}",  # Go directly to cart
    NotificationType.WORKOUT_REMINDER: "mood://home",  # Go to home
    NotificationType.FEATURED_SUGGESTION: "mood://home",  # Go to home
    NotificationType.FOLLOWING_DIGEST: "mood://notifications",
    NotificationType.WHILE_AWAY_DIGEST: "mood://notifications",
}


# ============================================
# NOTIFICATION SERVICE CLASS
# ============================================

class NotificationService:
    """Handles all notification operations"""
    
    def __init__(self, db):
        self.db = db
        self.expo_push_url = "https://exp.host/--/api/v2/push/send"
    
    # ----------------------------------------
    # DEVICE TOKEN MANAGEMENT
    # ----------------------------------------
    
    async def register_device_token(
        self,
        user_id: str,
        token: str,
        platform: str,  # 'ios', 'android', 'web'
        device_id: Optional[str] = None
    ) -> dict:
        """Register or update a device push token"""
        now = datetime.now(timezone.utc)
        
        # Check if token already exists for this user
        existing = await self.db.device_tokens.find_one({
            "user_id": user_id,
            "token": token
        })
        
        if existing:
            # Update last_active
            await self.db.device_tokens.update_one(
                {"_id": existing["_id"]},
                {"$set": {"last_active": now, "platform": platform}}
            )
            return {"status": "updated", "id": str(existing["_id"])}
        
        # Insert new token
        doc = {
            "user_id": user_id,
            "token": token,
            "platform": platform,
            "device_id": device_id,
            "created_at": now,
            "last_active": now,
            "is_valid": True
        }
        
        result = await self.db.device_tokens.insert_one(doc)
        logger.info(f"📱 Registered device token for user {user_id[:8]}... on {platform}")
        
        return {"status": "created", "id": str(result.inserted_id)}
    
    async def unregister_device_token(self, user_id: str, token: str) -> bool:
        """Remove a device token"""
        result = await self.db.device_tokens.delete_one({
            "user_id": user_id,
            "token": token
        })
        return result.deleted_count > 0
    
    async def invalidate_token(self, token: str) -> None:
        """Mark a token as invalid (e.g., after failed push)"""
        await self.db.device_tokens.update_one(
            {"token": token},
            {"$set": {"is_valid": False}}
        )
    
    async def get_user_tokens(self, user_id: str) -> List[str]:
        """Get all valid push tokens for a user"""
        tokens = await self.db.device_tokens.find({
            "user_id": user_id,
            "is_valid": True
        }).to_list(10)
        
        return [t["token"] for t in tokens]
    
    # ----------------------------------------
    # NOTIFICATION SETTINGS
    # ----------------------------------------
    
    async def get_user_settings(self, user_id: str) -> dict:
        """Get notification settings for a user, with defaults"""
        settings = await self.db.notification_settings.find_one({"user_id": user_id})
        
        if not settings:
            # Return defaults
            return self._get_default_settings(user_id)
        
        return {
            "user_id": settings["user_id"],
            "notifications_enabled": settings.get("notifications_enabled", True),
            "likes_enabled": settings.get("likes_enabled", True),
            "likes_from_following_only": settings.get("likes_from_following_only", False),
            "comments_enabled": settings.get("comments_enabled", True),
            "comments_from_following_only": settings.get("comments_from_following_only", False),
            "messages_enabled": settings.get("messages_enabled", True),
            "follows_enabled": settings.get("follows_enabled", True),
            "workout_reminders_enabled": settings.get("workout_reminders_enabled", True),
            "featured_workouts_enabled": settings.get("featured_workouts_enabled", True),
            "following_digest_enabled": settings.get("following_digest_enabled", True),
            "following_digest_frequency": settings.get("following_digest_frequency", "daily"),  # daily, 3x_week, off
            "featured_suggestions_enabled": settings.get("featured_suggestions_enabled", True),
            "quiet_hours_enabled": settings.get("quiet_hours_enabled", False),
            "quiet_hours_start": settings.get("quiet_hours_start", "22:00"),
            "quiet_hours_end": settings.get("quiet_hours_end", "08:00"),
            "digest_time": settings.get("digest_time", "18:00"),
            "timezone": settings.get("timezone", "America/New_York"),
        }
    
    def _get_default_settings(self, user_id: str) -> dict:
        """Get default notification settings"""
        return {
            "user_id": user_id,
            "notifications_enabled": True,
            "likes_enabled": True,
            "likes_from_following_only": False,
            "comments_enabled": True,
            "comments_from_following_only": False,
            "messages_enabled": True,
            "follows_enabled": True,
            "workout_reminders_enabled": True,
            "featured_workouts_enabled": True,
            "following_digest_enabled": True,
            "following_digest_frequency": "daily",
            "featured_suggestions_enabled": True,
            "quiet_hours_enabled": False,
            "quiet_hours_start": "22:00",
            "quiet_hours_end": "08:00",
            "digest_time": "18:00",
            "timezone": "America/New_York",
        }
    
    async def update_user_settings(self, user_id: str, settings: dict) -> dict:
        """Update notification settings for a user"""
        now = datetime.now(timezone.utc)
        
        # Filter only allowed fields
        allowed_fields = [
            "notifications_enabled", "likes_enabled", "likes_from_following_only",
            "comments_enabled", "comments_from_following_only", "messages_enabled",
            "follows_enabled", "workout_reminders_enabled",
            "featured_workouts_enabled", "following_digest_enabled", "following_digest_frequency",
            "featured_suggestions_enabled", "quiet_hours_enabled", "quiet_hours_start",
            "quiet_hours_end", "digest_time", "timezone"
        ]
        
        update_data = {k: v for k, v in settings.items() if k in allowed_fields}
        update_data["updated_at"] = now
        
        await self.db.notification_settings.update_one(
            {"user_id": user_id},
            {"$set": update_data, "$setOnInsert": {"user_id": user_id, "created_at": now}},
            upsert=True
        )
        
        return await self.get_user_settings(user_id)
    
    # ----------------------------------------
    # NOTIFICATION CREATION
    # ----------------------------------------
    
    async def create_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        body: str,
        actor_id: Optional[str] = None,
        entity_id: Optional[str] = None,
        entity_type: Optional[str] = None,
        image_url: Optional[str] = None,
        metadata: Optional[dict] = None,
        group_key: Optional[str] = None,
        send_push: bool = True
    ) -> Optional[str]:
        """
        Create a notification and optionally send push
        Returns notification ID or None if not created
        """
        now = datetime.now(timezone.utc)
        
        # Check user settings
        settings = await self.get_user_settings(user_id)
        
        if not settings.get("notifications_enabled", True):
            logger.debug(f"Notifications disabled for user {user_id[:8]}...")
            return None
        
        # Check type-specific settings
        type_setting_map = {
            NotificationType.LIKE: "likes_enabled",
            NotificationType.COMMENT: "comments_enabled",
            NotificationType.FOLLOW: "follows_enabled",
            NotificationType.MESSAGE: "messages_enabled",
            NotificationType.MESSAGE_REQUEST: "message_requests_enabled",
            NotificationType.MENTION: "comments_enabled",  # Mentions use comments setting
            NotificationType.REPLY: "comments_enabled",  # Replies use comments setting
            NotificationType.WORKOUT_REMINDER: "workout_reminders_enabled",
            NotificationType.FEATURED_WORKOUT: "featured_workouts_enabled",
            NotificationType.FEATURED_SUGGESTION: "featured_suggestions_enabled",
            NotificationType.FOLLOWING_DIGEST: "following_digest_enabled",
        }
        
        setting_key = type_setting_map.get(notification_type)
        if setting_key and not settings.get(setting_key, True):
            logger.debug(f"{notification_type.value} notifications disabled for user {user_id[:8]}...")
            return None
        
        # Check "from following only" settings for likes/comments
        if notification_type in [NotificationType.LIKE, NotificationType.COMMENT] and actor_id:
            from_following_key = f"{notification_type.value}s_from_following_only"
            if settings.get(from_following_key, False):
                # Check if actor is being followed by user
                is_following = await self.db.follows.find_one({
                    "follower_id": ObjectId(user_id),
                    "following_id": ObjectId(actor_id)
                })
                if not is_following:
                    logger.debug(f"Skipping {notification_type.value} from non-followed user")
                    return None
        
        # Generate deep link
        deep_link = self._generate_deep_link(notification_type, actor_id, entity_id)
        
        # Create notification document
        notification_doc = {
            "user_id": user_id,
            "type": notification_type.value,
            "title": title,
            "body": body,
            "actor_id": actor_id,
            "entity_id": entity_id,
            "entity_type": entity_type,
            "image_url": image_url,
            "deep_link": deep_link,
            "metadata": metadata or {},
            "group_key": group_key,
            "created_at": now,
            "read_at": None,
            "delivered_push_at": None,
        }
        
        logger.info(f"🔔 Inserting notification into DB: {self.db.name}")
        result = await self.db.notifications.insert_one(notification_doc)
        notification_id = str(result.inserted_id)
        logger.info(f"🔔 Insert result acknowledged: {result.acknowledged}, id: {notification_id}")
        
        logger.info(f"🔔 Created notification {notification_type.value} for user {user_id[:8]}...")
        
        # Send push if enabled and not in quiet hours
        if send_push:
            in_quiet_hours = self._is_in_quiet_hours(settings)
            if in_quiet_hours:
                logger.debug(f"User {user_id[:8]}... is in quiet hours, skipping push")
            else:
                await self._send_push_notification(
                    user_id=user_id,
                    notification_id=notification_id,
                    title=title,
                    body=body,
                    deep_link=deep_link,
                    notification_type=notification_type,
                    image_url=image_url
                )
        
        # Track analytics
        await self._track_notification_event(user_id, "notification_created", notification_type.value)
        
        return notification_id
    
    def _generate_deep_link(
        self,
        notification_type: NotificationType,
        actor_id: Optional[str],
        entity_id: Optional[str]
    ) -> str:
        """Generate deep link URL for notification"""
        template = DEEP_LINK_SCHEMES.get(notification_type, "mood://")
        
        deep_link = template
        if "{entity_id}" in deep_link and entity_id:
            deep_link = deep_link.replace("{entity_id}", entity_id)
        if "{actor_id}" in deep_link and actor_id:
            deep_link = deep_link.replace("{actor_id}", actor_id)
        
        return deep_link
    
    def _is_in_quiet_hours(self, settings: dict) -> bool:
        """Check if current time is within user's quiet hours"""
        if not settings.get("quiet_hours_enabled", True):
            return False
        
        try:
            from datetime import time
            now = datetime.now(timezone.utc)
            
            # Parse quiet hours (simple implementation - assumes UTC for now)
            start_str = settings.get("quiet_hours_start", "22:00")
            end_str = settings.get("quiet_hours_end", "08:00")
            
            start_parts = start_str.split(":")
            end_parts = end_str.split(":")
            
            start_time = time(int(start_parts[0]), int(start_parts[1]))
            end_time = time(int(end_parts[0]), int(end_parts[1]))
            current_time = now.time()
            
            # Handle overnight quiet hours (e.g., 22:00 - 08:00)
            if start_time > end_time:
                return current_time >= start_time or current_time < end_time
            else:
                return start_time <= current_time < end_time
        except Exception as e:
            logger.error(f"Error checking quiet hours: {e}")
            return False
    
    # ----------------------------------------
    # PUSH NOTIFICATION DELIVERY
    # ----------------------------------------
    
    async def _send_push_notification(
        self,
        user_id: str,
        notification_id: str,
        title: str,
        body: str,
        deep_link: str,
        notification_type: NotificationType,
        image_url: Optional[str] = None
    ) -> bool:
        """Send push notification via Expo Push API"""
        tokens = await self.get_user_tokens(user_id)
        
        if not tokens:
            logger.debug(f"No push tokens for user {user_id[:8]}...")
            return False
        
        # Build push message
        messages = []
        for token in tokens:
            message = {
                "to": token,
                "title": title,
                "body": body,
                "data": {
                    "notification_id": notification_id,
                    "type": notification_type.value,
                    "deep_link": deep_link,
                },
                "sound": "default",
                "priority": "high",
            }
            
            # Add category/actions based on type
            if notification_type == NotificationType.MESSAGE:
                message["categoryId"] = "MESSAGE"
            elif notification_type == NotificationType.FEATURED_WORKOUT:
                message["categoryId"] = "FEATURED_WORKOUT"
            
            messages.append(message)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.expo_push_url,
                    json=messages,
                    headers={"Content-Type": "application/json"},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    # Check for individual ticket errors
                    for i, ticket in enumerate(result.get("data", [])):
                        if ticket.get("status") == "error":
                            error_msg = ticket.get("message", "Unknown error")
                            if "DeviceNotRegistered" in error_msg:
                                await self.invalidate_token(tokens[i])
                                logger.warning("Invalidated token: DeviceNotRegistered")
                            else:
                                logger.error(f"Push error: {error_msg}")
                    
                    # Mark as delivered
                    await self.db.notifications.update_one(
                        {"_id": ObjectId(notification_id)},
                        {"$set": {"delivered_push_at": datetime.now(timezone.utc)}}
                    )
                    
                    # Track analytics
                    await self._track_notification_event(
                        user_id, "push_sent", notification_type.value
                    )
                    
                    logger.info(f"📤 Push sent to {len(tokens)} device(s) for user {user_id[:8]}...")
                    return True
                else:
                    logger.error(f"Expo push failed: {response.status_code} - {response.text}")
                    return False
                    
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")
            return False
    
    # ----------------------------------------
    # NOTIFICATION RETRIEVAL
    # ----------------------------------------
    
    async def get_notifications(
        self,
        user_id: str,
        limit: int = 50,
        skip: int = 0,
        unread_only: bool = False
    ) -> List[dict]:
        """Get notifications for a user with pagination"""
        query = {"user_id": user_id}
        
        if unread_only:
            query["read_at"] = None
        
        pipeline = [
            {"$match": query},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            # Lookup actor info
            {
                "$lookup": {
                    "from": "users",
                    "let": {"actor_id": {"$toObjectId": "$actor_id"}},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$_id", "$$actor_id"]}}},
                        {"$project": {"username": 1, "avatar": 1, "name": 1}}
                    ],
                    "as": "actor"
                }
            },
            {"$unwind": {"path": "$actor", "preserveNullAndEmptyArrays": True}},
            {
                "$project": {
                    "id": {"$toString": "$_id"},
                    "type": 1,
                    "title": 1,
                    "body": 1,
                    "image_url": 1,
                    "deep_link": 1,
                    "entity_id": 1,
                    "entity_type": 1,
                    "created_at": 1,
                    "read_at": 1,
                    "metadata": 1,  # Include metadata for post_thumbnail, etc.
                    "actor": {
                        "id": {"$toString": "$actor._id"},
                        "username": "$actor.username",
                        "avatar": "$actor.avatar",
                        "name": "$actor.name"
                    },
                    "_id": 0
                }
            }
        ]
        
        notifications = await self.db.notifications.aggregate(pipeline).to_list(limit)
        return notifications
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications"""
        return await self.db.notifications.count_documents({
            "user_id": user_id,
            "read_at": None
        })
    
    async def mark_as_read(self, user_id: str, notification_ids: List[str]) -> int:
        """Mark notifications as read"""
        now = datetime.now(timezone.utc)
        
        object_ids = [ObjectId(nid) for nid in notification_ids]
        
        result = await self.db.notifications.update_many(
            {
                "_id": {"$in": object_ids},
                "user_id": user_id,
                "read_at": None
            },
            {"$set": {"read_at": now}}
        )
        
        return result.modified_count
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        now = datetime.now(timezone.utc)
        
        result = await self.db.notifications.update_many(
            {"user_id": user_id, "read_at": None},
            {"$set": {"read_at": now}}
        )
        
        return result.modified_count
    
    async def delete_notification(self, user_id: str, notification_id: str) -> bool:
        """Delete a notification"""
        result = await self.db.notifications.delete_one({
            "_id": ObjectId(notification_id),
            "user_id": user_id
        })
        return result.deleted_count > 0
    
    # ----------------------------------------
    # EVENT TRIGGERS (for social actions)
    # ----------------------------------------
    
    async def trigger_follow_notification(
        self,
        follower_id: str,
        followed_user_id: str
    ) -> Optional[str]:
        """Trigger notification when someone follows a user"""
        # Get follower info
        follower = await self.db.users.find_one({"_id": ObjectId(follower_id)})
        if not follower:
            return None
        
        follower_name = follower.get("name") or follower.get("username", "Someone")
        avatar = follower.get("avatar") or follower.get("avatar_url")
        
        return await self.create_notification(
            user_id=followed_user_id,
            notification_type=NotificationType.FOLLOW,
            title="New Follower",
            body=f"{follower_name} started following you",
            actor_id=follower_id,
            image_url=avatar,
            metadata={"follower_username": follower.get("username")}
        )
    
    async def trigger_comment_notification(
        self,
        commenter_id: str,
        post_id: str,
        comment_text: str
    ) -> Optional[str]:
        """Trigger notification when someone comments on a post - IG-style copy"""
        # Get post and commenter info
        post = await self.db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            return None
        
        post_author_id = post.get("author_id")
        if not post_author_id or str(post_author_id) == commenter_id:
            # Don't notify yourself
            return None
        
        commenter = await self.db.users.find_one({"_id": ObjectId(commenter_id)})
        if not commenter:
            return None
        
        commenter_name = commenter.get("name") or commenter.get("username", "Someone")
        commenter_username = commenter.get("username", "Someone")
        avatar = commenter.get("avatar") or commenter.get("avatar_url")
        
        # Truncate comment for body
        truncated_comment = comment_text[:50] + "..." if len(comment_text) > 50 else comment_text
        
        # Get post preview image - prefer cover (thumbnail) for faster loading
        media_urls = post.get("media_urls", [])
        cover_urls = post.get("cover_urls", [])
        post_thumbnail = cover_urls[0] if cover_urls else (media_urls[0] if media_urls else None)
        
        # IG-style: "username commented on your photo."
        return await self.create_notification(
            user_id=str(post_author_id),
            notification_type=NotificationType.COMMENT,
            title="New Comment",
            body=f'{commenter_username} commented: "{truncated_comment}"',
            actor_id=commenter_id,
            entity_id=post_id,
            entity_type="post",
            image_url=avatar,
            metadata={
                "commenter_username": commenter_username,
                "post_thumbnail": post_thumbnail
            }
        )
    
    async def trigger_message_notification(
        self,
        sender_id: str,
        recipient_id: str,
        conversation_id: str,
        message_text: str,
        is_request: bool = False
    ) -> Optional[str]:
        """Trigger notification when someone sends a message"""
        sender = await self.db.users.find_one({"_id": ObjectId(sender_id)})
        if not sender:
            return None
        
        sender_name = sender.get("name") or sender.get("username", "Someone")
        avatar = sender.get("avatar") or sender.get("avatar_url")
        
        # Truncate message for body
        truncated_msg = message_text[:50] + "..." if len(message_text) > 50 else message_text
        
        notification_type = NotificationType.MESSAGE_REQUEST if is_request else NotificationType.MESSAGE
        title = "Message Request" if is_request else "New Message"
        
        return await self.create_notification(
            user_id=recipient_id,
            notification_type=notification_type,
            title=title,
            body=f'{sender_name}: "{truncated_msg}"',
            actor_id=sender_id,
            entity_id=conversation_id,
            entity_type="conversation",
            image_url=avatar,
            metadata={"sender_username": sender.get("username")}
        )
    
    async def trigger_mention_notification(
        self,
        mentioner_id: str,
        mentioned_user_id: str,
        post_id: str,
        comment_text: str
    ) -> Optional[str]:
        """Trigger notification when someone @mentions a user in a comment"""
        # Don't notify yourself
        if mentioner_id == mentioned_user_id:
            return None
        
        mentioner = await self.db.users.find_one({"_id": ObjectId(mentioner_id)})
        if not mentioner:
            return None
        
        mentioner_name = mentioner.get("name") or mentioner.get("username", "Someone")
        avatar = mentioner.get("avatar") or mentioner.get("avatar_url")
        
        # Truncate comment for body
        truncated_comment = comment_text[:50] + "..." if len(comment_text) > 50 else comment_text
        
        # Get post preview image for the notification thumbnail
        post = await self.db.posts.find_one({"_id": ObjectId(post_id)})
        post_thumbnail = None
        if post:
            media_urls = post.get("media_urls", [])
            cover_urls = post.get("cover_urls", [])
            # Prefer cover (thumbnail) over full media for faster loading
            post_thumbnail = cover_urls[0] if cover_urls else (media_urls[0] if media_urls else None)
        
        return await self.create_notification(
            user_id=mentioned_user_id,
            notification_type=NotificationType.MENTION,
            title="You were mentioned",
            body=f'{mentioner_name} mentioned you: "{truncated_comment}"',
            actor_id=mentioner_id,
            entity_id=post_id,
            entity_type="post",
            image_url=avatar,
            metadata={
                "mentioner_username": mentioner.get("username"),
                "comment_preview": truncated_comment,
                "post_thumbnail": post_thumbnail
            }
        )
    
    async def trigger_reply_notification(
        self,
        replier_id: str,
        parent_comment_author_id: str,
        post_id: str,
        reply_text: str
    ) -> Optional[str]:
        """Trigger notification when someone replies to a comment"""
        # Don't notify yourself
        if replier_id == parent_comment_author_id:
            return None
        
        replier = await self.db.users.find_one({"_id": ObjectId(replier_id)})
        if not replier:
            return None
        
        replier_name = replier.get("name") or replier.get("username", "Someone")
        avatar = replier.get("avatar") or replier.get("avatar_url")
        
        # Truncate reply for body
        truncated_reply = reply_text[:50] + "..." if len(reply_text) > 50 else reply_text
        
        # Get post preview image for the notification thumbnail
        post = await self.db.posts.find_one({"_id": ObjectId(post_id)})
        post_thumbnail = None
        if post:
            media_urls = post.get("media_urls", [])
            cover_urls = post.get("cover_urls", [])
            # Prefer cover (thumbnail) over full media for faster loading
            post_thumbnail = cover_urls[0] if cover_urls else (media_urls[0] if media_urls else None)
        
        return await self.create_notification(
            user_id=parent_comment_author_id,
            notification_type=NotificationType.REPLY,
            title="Reply to your comment",
            body=f'{replier_name} replied: "{truncated_reply}"',
            actor_id=replier_id,
            entity_id=post_id,
            entity_type="post",
            image_url=avatar,
            metadata={
                "replier_username": replier.get("username"),
                "reply_preview": truncated_reply,
                "post_thumbnail": post_thumbnail
            }
        )
    
    async def trigger_like_notification(
        self,
        liker_id: str,
        post_id: str,
        post_author_id: str
    ) -> Optional[str]:
        """
        Trigger notification when someone likes a post.
        BUNDLED ONLY - no single-like spam.
        If >3 likes in 10 min, bundle into one notification.
        """
        logger.info(f"🔔 trigger_like_notification called: liker={liker_id[:8]}..., post={post_id[:8]}..., author={post_author_id[:8]}...")
        
        # Don't notify yourself
        if liker_id == post_author_id:
            logger.info(f"🔔 trigger_like_notification: Skipping self-like")
            return None
        
        now = datetime.now(timezone.utc)
        ten_mins_ago = now - timedelta(minutes=10)
        
        # Check recent likes on this post from different users
        recent_likes = await self.db.notifications.count_documents({
            "user_id": post_author_id,
            "type": NotificationType.LIKE.value,
            "entity_id": post_id,
            "created_at": {"$gte": ten_mins_ago}
        })
        
        # Get liker info
        liker = await self.db.users.find_one({"_id": ObjectId(liker_id)})
        if not liker:
            return None
        
        liker_name = liker.get("name") or liker.get("username", "Someone")
        avatar = liker.get("avatar") or liker.get("avatar_url")
        
        # Get post preview image for the notification thumbnail
        post = await self.db.posts.find_one({"_id": ObjectId(post_id)})
        post_thumbnail = None
        if post:
            media_urls = post.get("media_urls", [])
            cover_urls = post.get("cover_urls", [])
            # Prefer cover (thumbnail) over full media for faster loading
            post_thumbnail = cover_urls[0] if cover_urls else (media_urls[0] if media_urls else None)
        
        # Bundle key for grouping
        bundle_key = f"likes_{post_id}_{now.strftime('%Y%m%d%H')}"
        
        if recent_likes >= 3:
            # Bundle: Update or create a bundled notification
            existing_bundle = await self.db.notifications.find_one({
                "user_id": post_author_id,
                "type": NotificationType.LIKE.value,
                "entity_id": post_id,
                "group_key": bundle_key
            })
            
            if existing_bundle:
                # Update the bundled notification count
                like_count = existing_bundle.get("metadata", {}).get("like_count", 3) + 1
                await self.db.notifications.update_one(
                    {"_id": existing_bundle["_id"]},
                    {
                        "$set": {
                            "body": f"{liker_name} and {like_count - 1} others liked your post.",
                            "metadata.like_count": like_count,
                            "metadata.last_liker": liker_name,
                            "metadata.post_thumbnail": post_thumbnail,
                            "created_at": now,  # Bump to top
                            "read_at": None  # Mark as unread again
                        }
                    }
                )
                return str(existing_bundle["_id"])
            else:
                # Create new bundled notification - IG-style copy
                return await self.create_notification(
                    user_id=post_author_id,
                    notification_type=NotificationType.LIKE,
                    title="Activity",  # IG-style minimal title
                    body=f"{liker_name} and {recent_likes} others liked your photo.",
                    actor_id=liker_id,
                    entity_id=post_id,
                    entity_type="post",
                    image_url=avatar,
                    group_key=bundle_key,
                    metadata={"like_count": recent_likes + 1, "last_liker": liker_name, "post_thumbnail": post_thumbnail},
                    send_push=True
                )
        else:
            # Not enough for bundle yet - store but DON'T push (likes only bundled)
            # IG-style: "username liked your photo."
            return await self.create_notification(
                user_id=post_author_id,
                notification_type=NotificationType.LIKE,
                title="New Like",
                body=f"{liker_name} liked your photo.",  # IG-style
                actor_id=liker_id,
                entity_id=post_id,
                entity_type="post",
                image_url=avatar,
                group_key=bundle_key,
                metadata={"like_count": 1, "post_thumbnail": post_thumbnail},
                send_push=False  # Don't push single likes - only bundled
            )
    
    async def trigger_workout_reminder(
        self,
        user_id: str,
        custom_message: Optional[str] = None
    ) -> Optional[str]:
        """Trigger a workout reminder notification with motivational copy"""
        import random
        
        # Pick random copy from library
        copy = custom_message or random.choice(SUGGESTION_COPY_LIBRARY)
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.WORKOUT_REMINDER,
            title="Time to Move",
            body=copy,
            metadata={"copy_variant": copy}
        )
    
    async def trigger_featured_workout_notification(
        self,
        user_id: str,
        workout_id: str,
        workout_name: str,
        workout_image: Optional[str] = None
    ) -> Optional[str]:
        """Trigger notification for a new featured workout drop - uses randomized copy"""
        # Use standardized push copy for featured workouts
        push_content = build_push_content(
            notif_type="featured_workout",
            deep_link=f"mood://cart?featuredId={workout_id}"
        )
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.FEATURED_WORKOUT,
            title=push_content["title"],  # Random from: "New Drop", "Today's Workout", etc.
            body=push_content["body"],    # Random from: "A new workout is live.", etc.
            entity_id=workout_id,
            entity_type="featured_workout",
            image_url=workout_image,
            metadata={"workout_name": workout_name}
        )
    
    async def trigger_featured_suggestion(
        self,
        user_id: str,
        custom_copy: Optional[str] = None
    ) -> Optional[str]:
        """Trigger a featured suggestion push with motivational copy"""
        import random
        
        # Pick random copy from library
        copy = custom_copy or random.choice(SUGGESTION_COPY_LIBRARY)
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.FEATURED_SUGGESTION,
            title="MOOD",
            body=copy,
            metadata={"copy_variant": copy}
        )
    
    async def send_featured_workout_to_all(
        self,
        workout_id: str,
        workout_name: str,
        workout_image: Optional[str] = None,
        target_user_ids: Optional[List[str]] = None
    ) -> int:
        """
        Admin function: Send featured workout notification to all users
        or a specific list of users.
        Returns count of notifications sent.
        """
        if target_user_ids:
            users = await self.db.users.find(
                {"_id": {"$in": [ObjectId(uid) for uid in target_user_ids]}}
            ).to_list(10000)
        else:
            # Get all users with notifications enabled
            users = await self.db.users.find({
                "is_banned": {"$ne": True}
            }).to_list(10000)
        
        count = 0
        for user in users:
            user_id = str(user["_id"])
            
            # Check settings
            settings = await self.get_user_settings(user_id)
            if not settings.get("notifications_enabled") or not settings.get("featured_workouts_enabled"):
                continue
            
            result = await self.trigger_featured_workout_notification(
                user_id=user_id,
                workout_id=workout_id,
                workout_name=workout_name,
                workout_image=workout_image
            )
            if result:
                count += 1
        
        logger.info(f"📢 Sent featured workout notification to {count} users")
        return count
    
    async def send_featured_suggestion_to_all(
        self,
        custom_copy: Optional[str] = None,
        target_user_ids: Optional[List[str]] = None
    ) -> int:
        """
        Admin function: Send featured suggestion to all users
        or a specific list of users.
        """
        import random
        
        if target_user_ids:
            users = await self.db.users.find(
                {"_id": {"$in": [ObjectId(uid) for uid in target_user_ids]}}
            ).to_list(10000)
        else:
            users = await self.db.users.find({
                "is_banned": {"$ne": True}
            }).to_list(10000)
        
        count = 0
        for user in users:
            user_id = str(user["_id"])
            
            settings = await self.get_user_settings(user_id)
            if not settings.get("notifications_enabled") or not settings.get("featured_suggestions_enabled"):
                continue
            
            # Use custom copy or pick random for each user
            copy = custom_copy or random.choice(SUGGESTION_COPY_LIBRARY)
            
            result = await self.trigger_featured_suggestion(
                user_id=user_id,
                custom_copy=copy
            )
            if result:
                count += 1
        
        logger.info(f"📢 Sent featured suggestion to {count} users")
        return count
    
    # ----------------------------------------
    # ANALYTICS TRACKING
    # ----------------------------------------
    
    async def _track_notification_event(
        self,
        user_id: str,
        event_type: str,
        notification_type: str,
        metadata: Optional[dict] = None
    ) -> None:
        """Track notification-related analytics event"""
        try:
            await self.db.notification_analytics.insert_one({
                "user_id": user_id,
                "event_type": event_type,
                "notification_type": notification_type,
                "metadata": metadata or {},
                "timestamp": datetime.now(timezone.utc)
            })
        except Exception as e:
            logger.error(f"Error tracking notification event: {e}")


# ============================================
# FACTORY FUNCTION
# ============================================

_notification_service = None

def get_notification_service(db) -> NotificationService:
    """Get or create the notification service singleton"""
    global _notification_service
    if _notification_service is None:
        _notification_service = NotificationService(db)
    return _notification_service
