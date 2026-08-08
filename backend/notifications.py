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


def _safe_first(val) -> str:
    """Safely get the first element from a list, dict, or None.
    
    cover_urls may be stored as a dict ({"0": "url"}) from React Native
    instead of a list (["url"]). This helper handles both.
    """
    if not val:
        return ""
    if isinstance(val, list):
        return val[0] if val else ""
    if isinstance(val, dict):
        # Try int key 0 first, then string key "0", then first value
        return val.get(0) or val.get("0") or next(iter(val.values()), "")
    return ""

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

    # Admin-authored broadcast with fully custom title/body (V2.1).
    CUSTOM = "custom"


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

# Deep link URL schemes.
#
# V2.1 — two bugs fixed here at once:
#
#  1. SCHEME. Every link used to be `mood://`, but frontend/app.json declares
#     `"scheme": "moodapp"` and there is no native override (managed workflow).
#     `mood://` was never a registered scheme, so Linking.openURL() rejected
#     EVERY one of these links. Only featured_workout survived, because its
#     client handler navigates via router.push() and ignores the URL entirely.
#
#  2. PATHS. `app/` is a FLAT expo-router tree — there is no `post/[id]`,
#     `chat/[id]`, `home`, or `notifications` route, and `/cart/{id}` does not
#     exist (only bare `/cart`). Every path below now points at a route that
#     actually exists, with the same query params the in-app inbox uses
#     (app/notifications-inbox.tsx handleDeepLink), which is the one navigation
#     path in the app known to work.
#
# NOTE: the client no longer *depends* on these strings to navigate — the tap
# handler switches on `data.type` and calls router.push (see
# frontend/utils/notifications.ts). These remain the canonical link for the
# notification record, cold-start URL handling, and email/external use.
DEEP_LINK_SCHEMES = {
    NotificationType.LIKE: "moodapp:///post-detail?postId={entity_id}",
    NotificationType.COMMENT: "moodapp:///post-detail?postId={entity_id}",
    NotificationType.FOLLOW: "moodapp:///user-profile?userId={actor_id}",
    NotificationType.MENTION: "moodapp:///post-detail?postId={entity_id}",
    NotificationType.REPLY: "moodapp:///post-detail?postId={entity_id}",
    NotificationType.MESSAGE: "moodapp:///chat-detail?conversationId={entity_id}",
    NotificationType.MESSAGE_REQUEST: "moodapp:///chat-detail?conversationId={entity_id}",
    NotificationType.FEATURED_WORKOUT: "moodapp:///cart?featuredId={entity_id}",
    NotificationType.WORKOUT_REMINDER: "moodapp:///",
    NotificationType.FEATURED_SUGGESTION: "moodapp:///",
    NotificationType.FOLLOWING_DIGEST: "moodapp:///notifications-inbox",
    NotificationType.WHILE_AWAY_DIGEST: "moodapp:///notifications-inbox",
    NotificationType.CUSTOM: "moodapp:///",
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
        """Register or update a device push token using upsert to prevent duplicates.
        
        A push token is device-specific. If the same token is re-registered
        (even by a different user after logout/login), we upsert on the token
        field to guarantee exactly one document per token.
        """
        now = datetime.now(timezone.utc)
        
        result = await self.db.device_tokens.update_one(
            {"token": token},
            {
                "$set": {
                    "user_id": user_id,
                    "platform": platform,
                    "device_id": device_id,
                    "last_active": now,
                    "is_valid": True,
                },
                "$setOnInsert": {
                    "token": token,
                    "created_at": now,
                },
            },
            upsert=True,
        )
        
        if result.upserted_id:
            logger.info(f"📱 Registered NEW device token for user {user_id[:8]}... on {platform}")
            return {"status": "created", "id": str(result.upserted_id)}
        else:
            logger.info(f"📱 Updated device token for user {user_id[:8]}... on {platform}")
            existing = await self.db.device_tokens.find_one({"token": token}, {"_id": 1})
            return {"status": "updated", "id": str(existing["_id"]) if existing else "unknown"}
    
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
        """Get all valid push tokens for a user (unique by DB constraint)"""
        tokens = await self.db.device_tokens.find(
            {"user_id": user_id, "is_valid": True},
            {"token": 1, "_id": 0},
        ).to_list(10)
        
        # Defensive dedup in case legacy duplicates still exist
        seen = set()
        unique = []
        for t in tokens:
            tok = t["token"]
            if tok not in seen:
                seen.add(tok)
                unique.append(tok)
        return unique
    
    # ----------------------------------------
    # NOTIFICATION SETTINGS
    # ----------------------------------------
    
    @staticmethod
    def _resolve_post_author_id(post: dict) -> str:
        """Resolve the canonical author of a post, checking multiple field names.
        
        Returns the author ID as a string, or "" if none found.
        Priority: author_id > user_id > creator_id > owner_id
        """
        for key in ("author_id", "user_id", "creator_id", "owner_id"):
            val = post.get(key)
            if val:
                return str(val)
        return ""
    
    async def get_user_settings(self, user_id: str) -> dict:
        """Get notification settings for a user, with defaults.
        
        CRITICAL: MongoDB may store None for unset fields. Python's
        dict.get(key, default) returns None (not the default) when the key
        EXISTS with value None. We must coalesce None -> default explicitly.
        """
        settings = await self.db.notification_settings.find_one({"user_id": user_id})
        
        if not settings:
            # Return defaults
            return self._get_default_settings(user_id)
        
        def _bool(val, default: bool) -> bool:
            return val if val is not None else default
        
        def _str(val, default: str) -> str:
            return val if val is not None else default
        
        return {
            "user_id": settings["user_id"],
            "notifications_enabled": _bool(settings.get("notifications_enabled"), True),
            "likes_enabled": _bool(settings.get("likes_enabled"), True),
            "likes_from_following_only": _bool(settings.get("likes_from_following_only"), False),
            "comments_enabled": _bool(settings.get("comments_enabled"), True),
            "comments_from_following_only": _bool(settings.get("comments_from_following_only"), False),
            "messages_enabled": _bool(settings.get("messages_enabled"), True),
            "follows_enabled": _bool(settings.get("follows_enabled"), True),
            "workout_reminders_enabled": _bool(settings.get("workout_reminders_enabled"), True),
            "featured_workouts_enabled": _bool(settings.get("featured_workouts_enabled"), True),
            "following_digest_enabled": _bool(settings.get("following_digest_enabled"), True),
            "following_digest_frequency": _str(settings.get("following_digest_frequency"), "daily"),
            "featured_suggestions_enabled": _bool(settings.get("featured_suggestions_enabled"), True),
            # V2.1 — gates admin-authored CUSTOM broadcasts. Defaults True so
            # existing users (who have no settings doc at all) still receive them.
            "announcements_enabled": _bool(settings.get("announcements_enabled"), True),
            "quiet_hours_enabled": _bool(settings.get("quiet_hours_enabled"), False),
            "quiet_hours_start": _str(settings.get("quiet_hours_start"), "22:00"),
            "quiet_hours_end": _str(settings.get("quiet_hours_end"), "08:00"),
            "digest_time": _str(settings.get("digest_time"), "18:00"),
            "timezone": _str(settings.get("timezone"), "America/New_York"),
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
            "announcements_enabled": True,
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
            "featured_suggestions_enabled", "announcements_enabled",
            "quiet_hours_enabled", "quiet_hours_start",
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
        dedupe_key: Optional[str] = None,
        send_push: bool = True,
        deep_link: Optional[str] = None,
    ) -> Optional[str]:
        """
        Create a notification and optionally send push.
        dedupe_key: if provided and a notification with this key already exists
                    for the same user, skip creation (prevents spam from rapid re-likes etc).
        deep_link: explicit override. When None (the default, and every legacy
                   caller) the link is derived from the type via
                   DEEP_LINK_SCHEMES exactly as before. Admin-authored custom
                   broadcasts need to point anywhere, and there was previously
                   no way to pass a link in at all.
        Returns notification ID or None if not created.
        """
        now = datetime.now(timezone.utc)
        
        # Check user settings
        settings = await self.get_user_settings(user_id)
        
        if not settings.get("notifications_enabled", True):
            logger.info(f"TRACE-NOTIF: type={notification_type.value} entity_id={entity_id} actor={actor_id} recipient={user_id} decision=SKIPPED reason=prefs_disabled")
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
            NotificationType.CUSTOM: "announcements_enabled",
        }
        
        setting_key = type_setting_map.get(notification_type)
        if setting_key and not settings.get(setting_key, True):
            logger.info(f"TRACE-NOTIF: type={notification_type.value} entity_id={entity_id} actor={actor_id} recipient={user_id} decision=SKIPPED reason=type_blocked({setting_key})")
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
                    logger.info(f"TRACE-NOTIF: type={notification_type.value} entity_id={entity_id} actor={actor_id} recipient={user_id} decision=SKIPPED reason=following_only")
                    return None
        
        # Dedupe check: if this exact event already produced a notification, skip
        if dedupe_key:
            existing = await self.db.notifications.find_one({
                "user_id": user_id,
                "metadata.dedupe_key": dedupe_key
            })
            if existing:
                logger.info(f"TRACE-NOTIF: type={notification_type.value} entity_id={entity_id} actor={actor_id} recipient={user_id} decision=SKIPPED reason=idempotency dedupe_key={dedupe_key}")
                return str(existing["_id"])
        
        # Generate deep link (unless the caller supplied an explicit override)
        if not deep_link:
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
            "metadata": {**(metadata or {}), **({"dedupe_key": dedupe_key} if dedupe_key else {})},
            "group_key": group_key,
            "created_at": now,
            "read_at": None,
            "delivered_push_at": None,
        }
        
        logger.info(f"🔔 Inserting notification into DB: {self.db.name}")
        result = await self.db.notifications.insert_one(notification_doc)
        notification_id = str(result.inserted_id)
        logger.info(f"🔔 Insert result acknowledged: {result.acknowledged}, id: {notification_id}")
        
        # Explicit NOTIF-CREATED trace — includes media_type for video engagement proof
        media_type = (metadata or {}).get("media_type", "unknown")
        logger.info(
            f"🔔 NOTIF-CREATED: id={notification_id} type={notification_type.value} "
            f"entity_id={entity_id} recipient={user_id[:8]}... actor={actor_id[:8] + '...' if actor_id else 'None'} "
            f"media_type={media_type}"
        )
        
        # Send push if enabled and not in quiet hours
        if send_push:
            logger.info(f"🔔 PUSH-PATH: send_push=True type={notification_type.value} user={user_id[:8]}... dedupe_key={dedupe_key}")
            in_quiet_hours = self._is_in_quiet_hours(settings)
            logger.info(f"🔔 PUSH-PATH: quiet_hours_enabled={settings.get('quiet_hours_enabled')}, in_quiet_hours={in_quiet_hours}")
            if in_quiet_hours:
                logger.info(f"🔔 PUSH-PATH: BLOCKED by quiet hours for user {user_id[:8]}... type={notification_type.value}")
            else:
                logger.info(f"🔔 PUSH-PATH: Calling _send_push_notification type={notification_type.value} user={user_id[:8]}...")
                try:
                    push_result = await self._send_push_notification(
                        user_id=user_id,
                        notification_id=notification_id,
                        title=title,
                        body=body,
                        deep_link=deep_link,
                        notification_type=notification_type,
                        image_url=image_url,
                        metadata=metadata,
                        event_key=dedupe_key,
                    )
                    logger.info(f"🔔 PUSH-PATH: _send_push_notification returned={push_result} for type={notification_type.value} user={user_id[:8]}...")
                except Exception as push_err:
                    logger.error(f"🔔 PUSH-PATH: EXCEPTION in _send_push_notification: {push_err}")
                    import traceback
                    logger.error(traceback.format_exc())
        else:
            logger.info(f"🔔 PUSH-PATH: send_push=False, skipping push for type={notification_type.value} user={user_id[:8]}...")
        
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
        template = DEEP_LINK_SCHEMES.get(notification_type, "moodapp:///")
        
        deep_link = template
        if "{entity_id}" in deep_link and entity_id:
            deep_link = deep_link.replace("{entity_id}", entity_id)
        if "{actor_id}" in deep_link and actor_id:
            deep_link = deep_link.replace("{actor_id}", actor_id)
        
        return deep_link
    
    def _is_in_quiet_hours(self, settings: dict) -> bool:
        """Check if current time is within user's quiet hours"""
        if not settings.get("quiet_hours_enabled", False):
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
    # PUSH SEND LOG (IDEMPOTENCY)
    # ----------------------------------------

    async def _check_and_log_push_send(
        self,
        user_id: str,
        push_type: str,
        event_key: str,
    ) -> bool:
        """Check if this push was already sent. Returns True if already sent (skip).
        
        Uses a unique index on (user_id, type, event_key) in push_send_log
        to guarantee at-most-once delivery per event per user.
        """
        try:
            await self.db.push_send_log.insert_one({
                "user_id": user_id,
                "type": push_type,
                "event_key": event_key,
                "created_at": datetime.now(timezone.utc),
            })
            return False  # Not a duplicate, proceed with send
        except Exception as e:
            # Duplicate key error (code 11000) means already sent
            if "11000" in str(e) or "duplicate key" in str(e).lower():
                logger.info(f"🔔 PushSendLog: duplicate for user={user_id[:8]}... type={push_type} key={event_key}")
                return True
            # For other errors, log but allow the send to proceed
            logger.warning(f"PushSendLog check error: {e}")
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
        image_url: Optional[str] = None,
        metadata: Optional[dict] = None,
        event_key: Optional[str] = None,
    ) -> bool:
        """Send push notification via Expo Push API with idempotency check"""
        logger.info(f"🔔 SEND-PUSH: ENTER type={notification_type.value} user={user_id[:8]}... event_key={event_key}")
        
        # Idempotency: skip if this exact event was already pushed to this user
        if event_key:
            already_sent = await self._check_and_log_push_send(
                user_id=user_id,
                push_type=notification_type.value,
                event_key=event_key,
            )
            if already_sent:
                logger.info(f"🔔 SEND-PUSH: BLOCKED by idempotency (push_send_log duplicate) type={notification_type.value} user={user_id[:8]}...")
                return False
            logger.info(f"🔔 SEND-PUSH: idempotency check passed for type={notification_type.value}")

        tokens = await self.get_user_tokens(user_id)
        
        logger.info(f"🔔 SEND-PUSH: tokens={len(tokens)} for user={user_id[:8]}... type={notification_type.value}")
        
        if not tokens:
            logger.info(f"🔔 SEND-PUSH: NO TOKENS for user {user_id[:8]}... — push NOT sent for type={notification_type.value}")
            return False
        
        logger.info(f"🔔 SEND-PUSH: Found {len(tokens)} token(s) for user {user_id[:8]}... type={notification_type.value}")
        
        # Build base data payload
        data_payload: Dict[str, Any] = {
            "notification_id": notification_id,
            "type": notification_type.value,
            "deep_link": deep_link,
            # V2.1 — always ship the ids so the client can route on `type`
            # alone. It previously had to scrape them out of the deep-link
            # string, which only worked for one link shape.
            "entityId": entity_id or "",
            "actorId": actor_id or "",
        }

        # Enrich engagement pushes (like, comment, follow, mention) with
        # actor + target info so the mobile client can route properly
        if notification_type in [NotificationType.LIKE, NotificationType.COMMENT, NotificationType.MENTION, NotificationType.REPLY]:
            # V2.1: read entity_id directly instead of scraping the last path
            # segment off the deep link. The old rsplit("/") only happened to
            # work for the legacy `mood://post/{entity_id}` shape and silently
            # produced garbage for any query-param link.
            data_payload["targetType"] = "post"
            data_payload["targetId"] = entity_id or ""

        # Enrich featured_workout pushes with workout context so the
        # mobile client can populate the cart directly from the push data
        if notification_type == NotificationType.FEATURED_WORKOUT and metadata:
            workout_id = metadata.get("workout_id")
            data_payload["workoutId"] = workout_id
            data_payload["workoutTitle"] = metadata.get("workout_name", "")
            # V2.1 — send a REFERENCE, not the cart itself.
            #
            # This used to embed up to 10 fully-populated exercises inline
            # (name/description/battlePlan/moodTips each). Two bugs:
            #   1. TRUNCATION: exercises[:10] silently dropped the rest, and the
            #      client skips its uncapped fetch whenever cartItems is
            #      non-empty (app/cart.tsx) — so an 11+ exercise workout pushed
            #      a quietly incomplete cart.
            #   2. SIZE: APNs/FCM cap the data payload around 4KB. Ten rich
            #      exercises blow past that, and nothing here checked, so sends
            #      could be rejected or truncated by the transport.
            # The client already has a fetch-by-id fallback
            # (POST /api/featured/workouts/batch), which is now the only path —
            # it is uncapped, always current, and a few hundred bytes on the wire.
            if workout_id:
                try:
                    workout_doc = await self.db.featured_workouts.find_one(
                        {"_id": ObjectId(workout_id)},
                        {"_id": 0, "heroImageUrl": 1, "exercises": 1},
                    )
                    if workout_doc:
                        if workout_doc.get("heroImageUrl"):
                            data_payload["heroImageUrl"] = workout_doc["heroImageUrl"]
                        data_payload["exerciseCount"] = len(workout_doc.get("exercises") or [])
                except Exception as e:
                    logger.warning(f"Could not fetch workout meta for push data: {e}")

        # V2.1 — badge count on the payload, so the iOS app-icon badge is correct
        # the moment the push lands rather than only after the app is opened and
        # BadgeContext syncs. The notification row is inserted before this runs,
        # so the unread count already includes the one being delivered.
        try:
            badge_count = await self.get_unread_count(user_id)
        except Exception:
            badge_count = None

        # Build push messages
        messages = []
        for token in tokens:
            message: Dict[str, Any] = {
                "to": token,
                "title": title,
                "body": body,
                "data": data_payload,
                "sound": "default",
                "priority": "high",
            }
            if badge_count is not None:
                message["badge"] = badge_count
            
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
            # Live lookup: fetch post thumbnail when metadata is missing it
            {
                "$lookup": {
                    "from": "posts",
                    "let": {
                        "eid": "$entity_id",
                        "etype": "$entity_type",
                        "existing_thumb": "$metadata.post_thumbnail"
                    },
                    "pipeline": [
                        {"$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$$etype", "post"]},
                                    {"$in": ["$$existing_thumb", [None, ""]]},
                                    {"$ne": ["$$eid", None]},
                                    {"$eq": ["$_id", {"$toObjectId": "$$eid"}]}
                                ]
                            }
                        }},
                        {"$project": {"cover_urls": 1, "media_urls": 1}}
                    ],
                    "as": "_post_lookup"
                }
            },
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
                    "metadata": 1,
                    # Prefer metadata thumbnail, fall back to live post lookup
                    "target_thumbnail_url": {
                        "$ifNull": [
                            "$metadata.post_thumbnail",
                            {"$ifNull": [
                                "$metadata.post_preview",
                                {"$let": {
                                    "vars": {
                                        "post": {"$arrayElemAt": ["$_post_lookup", 0]}
                                    },
                                    "in": {
                                        "$ifNull": [
                                            {"$arrayElemAt": ["$$post.cover_urls", 0]},
                                            {"$arrayElemAt": ["$$post.media_urls", 0]}
                                        ]
                                    }
                                }}
                            ]}
                        ]
                    },
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
        
        # Backfill metadata in DB for any notifications that needed live lookup (fire-and-forget)
        for notif in notifications:
            if notif.get("type") in ["like", "comment", "mention", "reply"] and notif.get("target_thumbnail_url") and not (notif.get("metadata") or {}).get("post_thumbnail"):
                # Async backfill so next fetch is fast
                try:
                    await self.db.notifications.update_one(
                        {"_id": ObjectId(notif["id"])},
                        {"$set": {"metadata.post_thumbnail": notif["target_thumbnail_url"]}}
                    )
                except Exception:
                    pass
        
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
    # CLOUDINARY VIDEO THUMBNAIL HELPERS
    # ----------------------------------------
    
    def _is_cloudinary_video(self, url: str) -> bool:
        """Check if a URL is a Cloudinary video URL"""
        if not url:
            return False
        return 'cloudinary.com' in url and '/video/' in url
    
    def _get_cloudinary_video_thumbnail(self, video_url: str) -> str:
        """
        Generate a Cloudinary video thumbnail URL from a video URL.
        Transforms /video/upload/... to /video/upload/so_0,f_jpg,.../
        This generates a thumbnail from the first frame (so_0 = start offset 0).
        """
        if not video_url or 'cloudinary.com' not in video_url:
            return video_url
        
        try:
            # Insert thumbnail transformation after /upload/
            # so_0 = start offset 0 (first frame)
            # f_jpg = output as JPEG
            # w_400 = width 400px for small thumbnail
            if '/video/upload/' in video_url:
                return video_url.replace(
                    '/video/upload/',
                    '/video/upload/so_0,f_jpg,w_400/'
                )
            return video_url
        except Exception as e:
            logger.warning(f"Failed to generate video thumbnail: {e}")
            return video_url
    
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
        logger.info(f"TRACE-NOTIF: type=comment entity_id={post_id} actor={commenter_id} trigger_entry=True")
        
        # Get post and commenter info
        post = await self.db.posts.find_one({"_id": ObjectId(post_id)})
        if not post:
            logger.warning(f"TRACE-NOTIF: type=comment entity_id={post_id} actor={commenter_id} recipient=? decision=SKIPPED reason=missing_post")
            return None
        
        post_author_id = self._resolve_post_author_id(post)
        
        if not post_author_id:
            logger.warning(f"TRACE-NOTIF: type=comment entity_id={post_id} actor={commenter_id} recipient=? decision=SKIPPED reason=missing_recipient keys={[k for k in post.keys() if k != '_id']}")
            return None
        
        if post_author_id == commenter_id:
            logger.info(f"TRACE-NOTIF: type=comment entity_id={post_id} actor={commenter_id} recipient={post_author_id} decision=SKIPPED reason=self_comment")
            return None
        
        commenter = await self.db.users.find_one({"_id": ObjectId(commenter_id)})
        if not commenter:
            logger.warning(f"TRACE-NOTIF: type=comment entity_id={post_id} actor={commenter_id} decision=SKIPPED reason=commenter_not_found")
            return None
        
        commenter_name = commenter.get("name") or commenter.get("username", "Someone")
        commenter_username = commenter.get("username", "Someone")
        avatar = commenter.get("avatar") or commenter.get("avatar_url")
        
        # Truncate comment for body
        truncated_comment = comment_text[:50] + "..." if len(comment_text) > 50 else comment_text
        
        # Get post preview image - prefer cover (thumbnail) for faster loading
        media_urls = post.get("media_urls", [])
        cover_urls = post.get("cover_urls", [])
        post_thumbnail = _safe_first(cover_urls) or _safe_first(media_urls) or None
        
        # If it's a video URL, generate Cloudinary video thumbnail
        if post_thumbnail and self._is_cloudinary_video(post_thumbnail):
            post_thumbnail = self._get_cloudinary_video_thumbnail(post_thumbnail)
        
        logger.info(f"🔔 Comment notification: post_thumbnail={post_thumbnail[:50] if post_thumbnail else 'None'}...")
        
        # Detect media_type for the NOTIF-CREATED log line
        first_url = (_safe_first(media_urls) or "").lower()
        media_type = "video" if any(ext in first_url for ext in (".mp4", ".mov", ".m3u8", "/video")) else ("image" if first_url else "unknown")
        
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
                "post_thumbnail": post_thumbnail,
                "media_type": media_type
            }
        )
    
    async def trigger_message_notification(
        self,
        sender_id: str,
        recipient_id: str,
        conversation_id: str,
        message_text: str,
        is_request: bool = False,
        title_override: Optional[str] = None,
        body_override: Optional[str] = None,
    ) -> Optional[str]:
        """Trigger notification when someone sends a message.

        V2.1 — `title_override` / `body_override` added for the founder-video
        blast, which is delivered as a DM but is an announcement, not a
        conversation. Both default to None so every ordinary DM keeps the
        existing "New Message" / 'Sender: "text"' shape untouched; only the
        caller that explicitly opts in gets different copy.
        """
        sender = await self.db.users.find_one({"_id": ObjectId(sender_id)})
        if not sender:
            return None
        
        sender_name = sender.get("name") or sender.get("username", "Someone")
        avatar = sender.get("avatar") or sender.get("avatar_url")
        
        # Truncate message for body
        truncated_msg = message_text[:50] + "..." if len(message_text) > 50 else message_text
        
        notification_type = NotificationType.MESSAGE_REQUEST if is_request else NotificationType.MESSAGE
        title = title_override or ("Message Request" if is_request else "New Message")
        
        return await self.create_notification(
            user_id=recipient_id,
            notification_type=notification_type,
            title=title,
            # An overridden body is used verbatim. The `Sender: "text"` wrapper
            # is right for a real conversation but reads oddly under a titled
            # announcement ("A personal message from Wes" / 'MOOD: "..."').
            body=body_override or f'{sender_name}: "{truncated_msg}"',
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
            post_thumbnail = _safe_first(cover_urls) or _safe_first(media_urls) or None
            
            # If it's a video URL, generate Cloudinary video thumbnail
            if post_thumbnail and self._is_cloudinary_video(post_thumbnail):
                post_thumbnail = self._get_cloudinary_video_thumbnail(post_thumbnail)
        
        logger.info(f"🔔 Mention notification: post_thumbnail={post_thumbnail[:50] if post_thumbnail else 'None'}...")
        
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
            post_thumbnail = _safe_first(cover_urls) or _safe_first(media_urls) or None
            
            # If it's a video URL, generate Cloudinary video thumbnail
            if post_thumbnail and self._is_cloudinary_video(post_thumbnail):
                post_thumbnail = self._get_cloudinary_video_thumbnail(post_thumbnail)
        
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
        logger.info(f"TRACE-NOTIF: type=like entity_id={post_id} actor={liker_id} recipient={post_author_id} trigger_entry=True")
        
        # Don't notify yourself
        if liker_id == post_author_id:
            logger.info(f"TRACE-NOTIF: type=like entity_id={post_id} actor={liker_id} recipient={post_author_id} decision=SKIPPED reason=self_like")
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
            post_thumbnail = _safe_first(cover_urls) or _safe_first(media_urls) or None
            
            # If it's a video URL, generate Cloudinary video thumbnail
            if post_thumbnail and self._is_cloudinary_video(post_thumbnail):
                post_thumbnail = self._get_cloudinary_video_thumbnail(post_thumbnail)
        
        logger.info(f"🔔 Like notification: post_thumbnail={post_thumbnail[:50] if post_thumbnail else 'None'}...")
        
        # Detect media_type for the NOTIF-CREATED log line
        media_type = "unknown"
        if post:
            first_url = (_safe_first(post.get("media_urls")) or "").lower()
            if any(ext in first_url for ext in (".mp4", ".mov", ".m3u8", "/video")):
                media_type = "video"
            elif first_url:
                media_type = "image"
        
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
                            "body": f"{liker_name} and {like_count - 1} others liked your post",
                            "metadata.like_count": like_count,
                            "metadata.last_liker": liker_name,
                            "metadata.post_thumbnail": post_thumbnail,
                            "created_at": now,  # Bump to top
                            "read_at": None  # Mark as unread again
                        }
                    }
                )
                logger.info(f"🔔 Like notification: updated bundle, count={like_count}")
                return str(existing_bundle["_id"])
            else:
                # Create new bundled notification
                return await self.create_notification(
                    user_id=post_author_id,
                    notification_type=NotificationType.LIKE,
                    title="New like",
                    body=f"{liker_name} and {recent_likes} others liked your post",
                    actor_id=liker_id,
                    entity_id=post_id,
                    entity_type="post",
                    image_url=avatar,
                    group_key=bundle_key,
                    dedupe_key=f"like:{post_id}:{liker_id}",
                    metadata={"like_count": recent_likes + 1, "last_liker": liker_name, "post_thumbnail": post_thumbnail, "media_type": media_type},
                    send_push=True
                )
        else:
            # Single like — send push immediately (Instagram-style)
            logger.info(f"🔔 Like notification: sending single-like push for post {post_id[:8]}...")
            return await self.create_notification(
                user_id=post_author_id,
                notification_type=NotificationType.LIKE,
                title="New like",
                body=f"{liker_name} liked your post",
                actor_id=liker_id,
                entity_id=post_id,
                entity_type="post",
                image_url=avatar,
                group_key=bundle_key,
                dedupe_key=f"like:{post_id}:{liker_id}",
                metadata={"like_count": 1, "post_thumbnail": post_thumbnail, "media_type": media_type},
                send_push=True
            )
    
    async def get_admin_user_id(self) -> Optional[str]:
        """Get the admin user ID (officialmoodapp) for server-initiated notifications"""
        admin = await self.db.users.find_one(
            {"username": "officialmoodapp"},
            {"_id": 1}
        )
        if admin:
            return str(admin["_id"])
        # Fallback: try any admin user
        admin = await self.db.users.find_one(
            {"is_admin": True},
            {"_id": 1}
        )
        return str(admin["_id"]) if admin else None

    async def trigger_workout_reminder(
        self,
        user_id: str,
        custom_message: Optional[str] = None,
        actor_id: Optional[str] = None,
        custom_title: Optional[str] = None,
    ) -> Optional[str]:
        """Trigger a workout reminder notification with motivational copy"""
        import random
        
        # Use provided actor_id or look up admin user
        if not actor_id:
            actor_id = await self.get_admin_user_id()
        
        # Pick random copy from library
        copy = custom_message or random.choice(SUGGESTION_COPY_LIBRARY)
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.WORKOUT_REMINDER,
            # V2.1 — was hardcoded "Time to Move" with no way to override.
            title=custom_title or "Time to Move",
            body=copy,
            actor_id=actor_id,
            dedupe_key=f"workout_reminder:{user_id}:{datetime.now(timezone.utc).strftime('%Y%m%d')}",
            metadata={"copy_variant": copy}
        )
    
    async def trigger_featured_workout_notification(
        self,
        user_id: str,
        workout_id: str,
        workout_name: str,
        workout_image: Optional[str] = None,
        custom_title: Optional[str] = None,
        custom_body: Optional[str] = None,
        actor_id: Optional[str] = None,
        dedupe_suffix: Optional[str] = None,
    ) -> Optional[str]:
        """Trigger notification for a new featured workout drop.

        dedupe_suffix (V2.1): the dedupe key used to be
        `featured_workout:{workout_id}:{user_id}` with NO time component, and
        the dedupe lookup has no time window — so a given workout could be
        pushed to a given user exactly once, forever. Re-promoting the same
        workout later was silently a no-op. Callers now pass a per-blast tag to
        scope idempotency to one send instead of to all of history.
        
        If custom_title/custom_body are provided, use them exactly (authored copy).
        Otherwise, use workout_name as title and random body from copy library.
        actor_id is the admin who sent the push (shown as sender in notification feed).
        """
        # Always ensure actor_id is set for server-initiated pushes
        if not actor_id:
            actor_id = await self.get_admin_user_id()
        
        # Cosmetic only — this value is passed to build_push_content, whose
        # `data` return is discarded. Kept consistent with DEEP_LINK_SCHEMES so
        # the dead `mood://` scheme isn't left lying around as a trap.
        deep_link = f"moodapp:///cart?featuredId={workout_id}"

        if custom_title and custom_body:
            title = custom_title
            body = custom_body
        elif custom_title:
            title = custom_title
            push_content = build_push_content(notif_type="featured_workout", deep_link=deep_link)
            body = push_content["body"]
        elif custom_body:
            title = workout_name
            body = custom_body
        else:
            # Default: use workout name as title (so banner shows it)
            title = workout_name
            push_content = build_push_content(notif_type="featured_workout", deep_link=deep_link)
            body = push_content["body"]
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.FEATURED_WORKOUT,
            title=title,
            body=body,
            actor_id=actor_id,
            entity_id=workout_id,
            entity_type="featured_workout",
            image_url=workout_image,
            dedupe_key=(
                f"featured_workout:{workout_id}:{user_id}:{dedupe_suffix}"
                if dedupe_suffix
                else f"featured_workout:{workout_id}:{user_id}"
            ),
            metadata={
                "workout_name": workout_name,
                "workout_id": workout_id,
                "workout_image": workout_image,
            }
        )
    
    async def trigger_featured_suggestion(
        self,
        user_id: str,
        custom_copy: Optional[str] = None,
        actor_id: Optional[str] = None,
        custom_title: Optional[str] = None,
    ) -> Optional[str]:
        """Trigger a featured suggestion push with motivational copy"""
        import random
        
        # Always ensure actor_id is set for server-initiated pushes
        if not actor_id:
            actor_id = await self.get_admin_user_id()
        
        # Pick random copy from library
        copy = custom_copy or random.choice(SUGGESTION_COPY_LIBRARY)
        
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.FEATURED_SUGGESTION,
            # V2.1 — was hardcoded "MOOD" with no way to override.
            title=custom_title or "MOOD",
            body=copy,
            actor_id=actor_id,
            dedupe_key=f"featured_suggestion:{user_id}:{datetime.now(timezone.utc).strftime('%Y%m%d%H')}",
            metadata={"copy_variant": copy}
        )
    
    async def send_featured_workout_to_all(
        self,
        workout_id: str,
        workout_name: str,
        workout_image: Optional[str] = None,
        target_user_ids: Optional[List[str]] = None,
        custom_title: Optional[str] = None,
        custom_body: Optional[str] = None,
        sender_user_id: Optional[str] = None
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
                workout_image=workout_image,
                custom_title=custom_title,
                custom_body=custom_body,
                actor_id=sender_user_id
            )
            if result:
                count += 1
        
        logger.info(f"📢 Sent featured workout notification to {count} users")
        return count
    
    async def send_featured_suggestion_to_all(
        self,
        custom_copy: Optional[str] = None,
        target_user_ids: Optional[List[str]] = None,
        sender_user_id: Optional[str] = None,
        custom_title: Optional[str] = None,
    ) -> int:
        """
        Admin function: Send featured suggestion to all users
        or a specific list of users.
        """
        import random
        
        # Resolve admin actor_id for sender attribution
        actor_id = sender_user_id or await self.get_admin_user_id()
        
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
                custom_copy=copy,
                actor_id=actor_id,
                custom_title=custom_title,
            )
            if result:
                count += 1
        
        logger.info(f"📢 Sent featured suggestion to {count} users")
        return count

    # ----------------------------------------
    # RE-ENGAGEMENT NUDGES (V2.1)
    # ----------------------------------------

    # One re-engagement push per user per day, across ALL campaigns. Without
    # this a user could qualify for day-4 + streak-at-risk + win-back on the
    # same day and get three pushes; for an app whose promise is "doesn't yell
    # at you" that is the fastest possible route to a disabled-notifications
    # setting.
    REENGAGEMENT_DAILY_CAP = 1

    async def reengagement_campaign_ever_sent(self, user_id: str, campaign: str) -> bool:
        """Has this user EVER received this campaign?

        V2.1 — needed because the dedupe key is scoped to the day
        (reengage:<campaign>:<uid>:<YYYYMMDD>), which makes a campaign idempotent
        per day but NOT per lifetime. The activation windows span two days each
        (age_days in (2,3) and (4,5)), so a user who was reachable on both days
        received the identical push twice in a row. The two-day window exists to
        catch someone whose 17:00 local sweep was missed — it was never meant to
        repeat the message.
        """
        return await self.db.notifications.count_documents({
            "user_id": user_id,
            "metadata.campaign": campaign,
        }, limit=1) > 0

    async def _reengagement_sent_today(self, user_id: str) -> int:
        """How many re-engagement pushes this user has already had today (UTC)."""
        start_of_day = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        return await self.db.notifications.count_documents({
            "user_id": user_id,
            "metadata.reengagement": True,
            "created_at": {"$gte": start_of_day},
        })

    async def trigger_reengagement_nudge(
        self,
        user_id: str,
        campaign: str,
        title: str,
        body: str,
        actor_id: Optional[str] = None,
        respect_daily_cap: bool = True,
    ) -> Optional[str]:
        """Send one re-engagement push.

        Rides NotificationType.WORKOUT_REMINDER so it honours the existing
        `workout_reminders_enabled` preference and quiet hours rather than
        introducing a category users can't turn off. `campaign` scopes the
        dedupe key, so each campaign can fire at most once per user per day and
        a worker restart mid-pass cannot double-send.
        """
        if respect_daily_cap:
            already = await self._reengagement_sent_today(user_id)
            if already >= self.REENGAGEMENT_DAILY_CAP:
                logger.info(
                    f"TRACE-NOTIF: campaign={campaign} recipient={user_id} "
                    f"decision=SKIPPED reason=daily_cap({already})"
                )
                return None

        if not actor_id:
            actor_id = await self.get_admin_user_id()

        day = datetime.now(timezone.utc).strftime("%Y%m%d")
        return await self.create_notification(
            user_id=user_id,
            notification_type=NotificationType.WORKOUT_REMINDER,
            title=title,
            body=body,
            actor_id=actor_id,
            dedupe_key=f"reengage:{campaign}:{user_id}:{day}",
            metadata={
                "reengagement": True,
                "campaign": campaign,
                "copy_variant": body,
            },
        )

    # ----------------------------------------
    # CUSTOM ADMIN BROADCAST (V2.1)
    # ----------------------------------------

    RECIPIENT_FETCH_CAP = 10000

    async def send_custom_broadcast(
        self,
        title: str,
        body: str,
        deep_link: Optional[str] = None,
        target_user_ids: Optional[List[str]] = None,
        sender_user_id: Optional[str] = None,
        featured_workout_id: Optional[str] = None,
        dedupe_tag: Optional[str] = None,
    ) -> dict:
        """
        Admin broadcast with a fully custom title AND body.

        Two modes, chosen by `featured_workout_id`:

        * WITHOUT a workout -> NotificationType.CUSTOM. Honours the
          `announcements_enabled` preference. `deep_link` may point anywhere;
          omit it to land the user on the home screen.

        * WITH a workout -> NotificationType.FEATURED_WORKOUT, so the push
          rides the one client tap-handler that is fully implemented: it
          hydrates the cart from the workout id and drops the user on /cart,
          one tap from Begin Workout. The admin still controls title and body.
          Honours `featured_workouts_enabled`.

        Returns a delivery report rather than a bare count, because a blast
        that silently reached 3 of 500 people is indistinguishable from success
        otherwise.
        """
        actor_id = sender_user_id or await self.get_admin_user_id()

        workout_name = ""
        if featured_workout_id:
            workout_doc = await self.db.featured_workouts.find_one(
                {"_id": ObjectId(featured_workout_id)}
            )
            if not workout_doc:
                raise ValueError(f"Featured workout {featured_workout_id} not found")
            if not (workout_doc.get("exercises") or []):
                raise ValueError("Refusing to send: that featured workout has no exercises (empty cart)")
            workout_name = workout_doc.get("title") or ""

        if target_user_ids:
            users = await self.db.users.find(
                {"_id": {"$in": [ObjectId(uid) for uid in target_user_ids]}}
            ).to_list(self.RECIPIENT_FETCH_CAP + 1)
        else:
            users = await self.db.users.find(
                {"is_banned": {"$ne": True}}
            ).to_list(self.RECIPIENT_FETCH_CAP + 1)

        # The pre-existing fan-outs silently truncate at 10k with no signal.
        # Surface it instead of pretending the send was complete.
        truncated = len(users) > self.RECIPIENT_FETCH_CAP
        if truncated:
            users = users[: self.RECIPIENT_FETCH_CAP]
            logger.warning(
                "send_custom_broadcast: recipient list truncated at %s — "
                "some users were NOT sent this push",
                self.RECIPIENT_FETCH_CAP,
            )

        # Stamp one tag for the whole blast so create_notification's dedupe key
        # makes this send idempotent — a retry after a timeout re-targets the
        # same users without double-notifying anyone who already got it.
        tag = dedupe_tag or f"broadcast:{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"

        sent = 0
        skipped = 0
        failed = 0
        for user in users:
            user_id = str(user["_id"])
            try:
                if featured_workout_id:
                    result = await self.trigger_featured_workout_notification(
                        user_id=user_id,
                        workout_id=featured_workout_id,
                        workout_name=workout_name,
                        custom_title=title,
                        custom_body=body,
                        actor_id=actor_id,
                        dedupe_suffix=tag,
                    )
                else:
                    result = await self.create_notification(
                        user_id=user_id,
                        notification_type=NotificationType.CUSTOM,
                        title=title,
                        body=body,
                        actor_id=actor_id,
                        deep_link=deep_link or None,
                        dedupe_key=f"{tag}:{user_id}",
                        metadata={"broadcast_tag": tag, "authored_by": actor_id},
                    )
                if result:
                    sent += 1
                else:
                    # create_notification returns None for opted-out users.
                    skipped += 1
            except Exception as e:
                failed += 1
                logger.error(f"send_custom_broadcast: failed for user {user_id}: {e}")

        logger.info(
            "📢 Custom broadcast '%s': sent=%s skipped_opted_out=%s failed=%s considered=%s",
            title, sent, skipped, failed, len(users),
        )
        return {
            "sent": sent,
            "skipped_opted_out": skipped,
            "failed": failed,
            "considered": len(users),
            "truncated": truncated,
            "broadcast_tag": tag,
            "mode": "featured_workout_cart" if featured_workout_id else "custom",
        }

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
