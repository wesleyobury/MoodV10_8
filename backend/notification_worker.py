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
from push_copy import NUDGE_TITLES, NUDGE_BODIES
from entitlement import (
    FREE_WORKOUT_PERIOD_FIELD,
    current_free_period_key,
    has_full_access,
)

try:
    from zoneinfo import ZoneInfo
except ImportError:  # pragma: no cover
    ZoneInfo = None  # type: ignore

# Local hour at which re-engagement nudges are delivered. The sweep runs hourly
# and only sends to users whose LOCAL time matches, so everyone gets an
# early-evening nudge rather than everyone getting one simultaneously at
# whatever UTC hour the pass happens to run.
REENGAGEMENT_SEND_LOCAL_HOUR = 17

# Win-back email is OFF unless explicitly enabled. This sends real mail from
# the production Resend domain, so turning it on is a deliberate act — a bad
# first campaign costs sender reputation, which is slow and painful to rebuild.
WINBACK_EMAIL_ENABLED = os.environ.get("WINBACK_EMAIL_ENABLED", "").lower() in ("1", "true", "yes")
WINBACK_EMAIL_UTC_HOUR = int(os.environ.get("WINBACK_EMAIL_UTC_HOUR", "16"))
# Lapse window, in days, for a win-back email. Narrow on purpose: someone gone
# 60 days is a different (and much colder) campaign.
WINBACK_MIN_DAYS = 10
WINBACK_MAX_DAYS = 17
WINBACK_DAILY_SEND_LIMIT = int(os.environ.get("WINBACK_DAILY_SEND_LIMIT", "200"))
APP_PUBLIC_URL = os.environ.get("APP_PUBLIC_URL", "https://officialmood.app")

# V2.1 — biggestBarrier finally does something.
#
# The funnel asks what's stopping you (Motivation 28% / Time 20% / Energy 20% /
# Bored 16% / Unsure 16%) and the answer was written to AsyncStorage and read by
# nothing. Feeding it into the activation nudge is the cheapest place
# personalization is actually FELT — the user told us their obstacle, so the
# reminder should speak to that obstacle rather than shouting generically.
# Deliberately answers the barrier instead of pushing through it, which is the
# whole "doesn't yell at you" positioning.
# Copy rules these follow:
#   • ANSWER the stated obstacle, never push through it. "Doesn't yell at you" is
#     the positioning, and a guilt-trip push is the fastest way to get uninstalled.
#   • Name the real in-app mechanic (pick a mood -> get a workout) so the tap has
#     an obvious, tiny next step instead of a vague "come back".
#   • Title under ~40 chars and body under ~110, which is roughly where iOS
#     truncates on a locked screen.
BARRIER_NUDGE_COPY = {
    # 28% of users — the largest segment. They have been told to be disciplined
    # their whole lives; the hook is REMOVING the prerequisite, not supplying it.
    "motivation": (
        "Motivation optional",
        "Pick a mood, get a workout. That's the whole ask.",
    ),
    # 20% — reassure that short is legitimate rather than a lesser version.
    "time": (
        "20 minutes is a workout",
        "Not a warm-up. Not a compromise. Pick a mood and go.",
    ),
    # 20% — the app literally has an "I'm feeling lazy" mood, so this is a real
    # promise we can keep, not a slogan.
    "energy": (
        "Too tired? Perfect.",
        "Tap \"I'm feeling lazy\" and we'll go easy on you. That counts.",
    ),
    # 16% — novelty is the product's actual mechanic; say so plainly.
    "bored": (
        "Nothing repeats here",
        "New mood, new workout, every time. Pick one you haven't tried.",
    ),
    # 16% — they don't want a program, they want the decision made for them.
    "unsure": (
        "You don't need a plan",
        "Just pick how you feel. The workout builds itself from there.",
    ),
}

# Second attempt, day 4-5. Still barrier-aware, but a DIFFERENT angle so the
# same person doesn't receive a near-duplicate of their day-2 message.
#
# Why not reuse the generic NUDGE pool here: it contains "Don't break it." and
# "Keep it alive." — streak language. Everyone in this branch has completed
# exactly zero workouts, so there is no streak to break, and _pick_nudge draws
# title and body independently (6 titles % hash, 8 bodies % hash), which can pair
# "Day Active" with "Back in." Neither is copy worth sending to a user who is
# already one step from churning.
BARRIER_NUDGE_COPY_DAY4 = {
    "motivation": (
        "Still here?",
        "No streak to rebuild, no guilt. One session, whenever you want.",
    ),
    "time": (
        "Got a spare 20?",
        "That's all a session takes. Pick a mood on the way home.",
    ),
    "energy": (
        "Rough week?",
        "Then pick the lazy option. Something easy still beats nothing.",
    ),
    "bored": (
        "You haven't seen it yet",
        "Six moods, and none of them build the same workout twice.",
    ),
    "unsure": (
        "Start anywhere",
        "There's no wrong first workout. Pick a mood and see.",
    ),
}

# Day 1, never completed a workout. The ONE job here is removing the price
# objection before it forms — this is the only campaign that says "free" out
# loud, because by day 2 the barrier copy is a better lever than the offer.
FIRST_WORKOUT_PLEA = (
    "Your first workout is free",
    "Pick how you feel, we build it, you start it. About a minute.",
)

# Monday, non-subscriber who spent last week's allowance. Frames the weekly
# reset as something they RECEIVE, not a wall they hit — the same fact read from
# the other side.
FREE_REPLENISHED_COPY = (
    "Your free workout is back",
    "One on the house, every Monday. Pick a mood and use it.",
)

# An unfinished build is the highest-intent signal available short of starting a
# session: they chose a mood and an intensity and then stopped. Only possible
# now that drafts are created at intensity confirm rather than at the cart.
ABANDONED_BUILD_COPY = (
    "You left one half-built",
    "Your {title} build is still waiting. Pick up where you stopped.",
)

# One workout in, none since. The 1 -> 2 transition is the steepest drop in the
# funnel and previously had NO campaign at all: a user who completed a single
# workout and stopped heard nothing until win-back at day 7, by which point the
# habit is gone. Speaks to the specific thing they just proved they can do.
SECOND_WORKOUT_COPY = (
    "One down.",
    "The second one is what makes it a habit. Pick a mood.",
)

# Volume badge thresholds, mirroring frontend/constants/achievements.ts
# (vol_1 / vol_10 / vol_25 / vol_50 / vol_100). Kept in sync deliberately: if
# these drift the push will promise a badge the app does not award.
VOLUME_BADGE_THRESHOLDS = [
    (1, "First workout"),
    (10, "10 workouts"),
    (25, "25 workouts"),
    (50, "50 workouts"),
    (100, "100 workouts"),
]

# Fires only when the user is exactly ONE workout short. "2 away" is not a
# reason to open an app; "1 away" is.
BADGE_PROXIMITY_COPY = (
    "One away from {label}",
    "A single session unlocks it. Pick a mood and take it.",
)

# The back catalogue: signed up, never completed a single workout, and long past
# the day 1-5 activation window.
#
# WHY THIS EXISTS. day1/day2/day4 gate on `age_days` in (1), (2,3), (4,5), so they
# only ever fire in a user's first five days. Every existing account that signed
# up months ago and never activated matched NOTHING — and wasn't even swept,
# because the candidate query required created_at <= 30d OR a live streak OR a
# spent free workout. This is the only campaign that can reach them.
#
# DECAY GUARD — stateless by design. Rather than a "times sent" counter on the
# user document (which needs a migration and can drift), eligibility is keyed to
# exact signup-age buckets. `age_days` increments once per day, so each bucket
# matches on exactly one day of a user's life: four attempts, ever, with widening
# gaps, then permanent silence. Nothing to store, nothing to reset, and it cannot
# loop even if the sweep runs many times a day.
DORMANT_ACTIVATION_BUCKETS = {
    # Still plausibly just busy. Lightest possible touch.
    7: (
        "Your workouts are still here",
        "No streak to restart, nothing lost. Pick a mood when you want one.",
    ),
    # Two weeks. Name the friction rather than the failure.
    14: (
        "Skip the planning",
        "You don't have to design a workout. Pick a mood, we do the rest.",
    ),
    # A month. Reframe as a clean slate, not a return.
    30: (
        "Start from scratch",
        "One session, 20 minutes, whatever mood you're in. That's the whole thing.",
    ),
    # Final attempt. Say so — an app that admits when it's done asking is the
    # same app that doesn't yell at you. Anyone still silent after this hears
    # nothing from this campaign again.
    60: (
        "Last nudge, promise",
        "If you ever want a workout built for you, we're one tap away. That's it.",
    ),
}

WORKOUT_COMPLETION_EVENTS = [
    "workout_completed",
    "workout_session_completed",
    "featured_workout_completed",
]


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

                # Every hour at :05 — re-engagement sweep. Offset from :00 so it
                # doesn't contend with the digest pass. Each user is only sent to
                # when it is REENGAGEMENT_SEND_LOCAL_HOUR in their own timezone.
                if current_minute == 5:
                    await self._process_reengagement()

                # Once a day: win-back EMAIL sweep. Email reaches people push
                # cannot — notifications denied at the OS prompt, or the app
                # deleted entirely — which is exactly the lapsed population.
                # Disabled unless WINBACK_EMAIL_ENABLED is set (see the job).
                if current_hour == WINBACK_EMAIL_UTC_HOUR and current_minute == 10:
                    await self._process_winback_emails()
                
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
        # Use $ne: False to match both True and None (unset) values
        settings_cursor = self.db.notification_settings.find({
            "notifications_enabled": {"$ne": False},
            "following_digest_enabled": {"$ne": False},
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
        
        # Count workout completions from followed users.
        #
        # V2.1: this read `db.analytics` for `workoutSessionCompleted`. NOTHING
        # in the codebase ever writes to db.analytics (this was its only
        # reader), and no emitter uses that camelCase name — real events land in
        # db.user_events as snake_case. workout_count was therefore permanently
        # 0, so a digest could only ever be sent on post activity.
        workout_count = await self.db.user_events.count_documents({
            "user_id": {"$in": [str(fid) for fid in following_ids]},
            "event_type": {"$in": [
                "workout_completed",
                "workout_session_completed",
                "featured_workout_completed",
            ]},
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
        # Use $ne: False to match both True and None (unset) values
        settings_cursor = self.db.notification_settings.find({
            "notifications_enabled": {"$ne": False},
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
    # RE-ENGAGEMENT SWEEP (V2.1)
    # ============================================
    #
    # Before this existed, a MOOD user received ZERO automated notifications,
    # ever. The whole push stack was built and working — sender, device tokens,
    # OS permission prompt, copy libraries — but nothing triggered it. The three
    # pre-existing worker jobs were all dead in practice: quiet-hours-ending
    # needs a flag that defaults False, the digest only matched users who had
    # manually opened the notification-settings screen, and the bundler only
    # regroups notifications that already exist. For a habit app with D7 ~2%,
    # having no reminder at all was the single largest gap.

    def _local_hour(self, settings: dict) -> Optional[int]:
        """The user's current local hour, or None if their timezone is unusable."""
        tz_name = settings.get("timezone") or "America/New_York"
        if ZoneInfo is None:
            return datetime.now(timezone.utc).hour
        try:
            return datetime.now(ZoneInfo(tz_name)).hour
        except Exception:
            # Unknown/garbage tz string — fall back to UTC rather than skipping
            # the user forever.
            return datetime.now(timezone.utc).hour

    async def _completed_any_workout(self, user_id: str) -> bool:
        doc = await self.db.user_events.find_one({
            "user_id": user_id,
            "event_type": {"$in": WORKOUT_COMPLETION_EVENTS},
        })
        return doc is not None

    async def _biggest_barrier(self, user_id: str) -> Optional[str]:
        """The user's self-reported obstacle, from their onboarding_completed event.

        Funnel answers live in client AsyncStorage, so the server can't read them
        directly — but `onboarding_completed` carries them as event metadata,
        which is how a backend job can personalise without any new plumbing or a
        profile migration.
        """
        doc = await self.db.user_events.find_one(
            {"user_id": user_id, "event_type": "onboarding_completed"},
            sort=[("timestamp", -1)],
        )
        if not doc:
            return None
        barrier = (doc.get("metadata") or {}).get("biggest_barrier")
        return barrier.lower() if isinstance(barrier, str) else None

    async def _last_activity_at(self, user_id: str) -> Optional[datetime]:
        doc = await self.db.user_events.find_one(
            {"user_id": user_id}, sort=[("timestamp", -1)]
        )
        return doc.get("timestamp") if doc else None

    def _used_allowance_last_week(self, user: dict, now: datetime) -> bool:
        """True if this user spent a free workout in the PREVIOUS ISO week.

        `free_workouts_period` stores the ISO week the counter belongs to (see
        entitlement.current_free_period_key). A stored key equal to last week's,
        with a non-zero count, is precisely "they used their allowance and it has
        just reset" — no event scan needed.
        """
        stored = (user.get(FREE_WORKOUT_PERIOD_FIELD) or "")
        if not stored:
            return False
        last_week = current_free_period_key(now - timedelta(days=7))
        return stored == last_week and int(user.get("free_workouts_used", 0) or 0) >= 1

    async def _abandoned_build(self, user_id: str, now: datetime) -> Optional[dict]:
        """Most recent unfinished build, if it has gone cold but not stale.

        Lower bound (6h) so we never interrupt someone who is mid-build right
        now. Upper bound (7d) because a fortnight-old draft is archaeology, and
        pushing it reads as the app scraping the bottom of the barrel.
        """
        return await self.db.workout_drafts.find_one(
            {
                "user_id": user_id,
                "status": {"$in": ["in_progress", "ready_to_start", "started"]},
                "last_modified_at": {
                    "$gte": (now - timedelta(days=7)).isoformat(),
                    "$lte": (now - timedelta(hours=6)).isoformat(),
                },
            },
            sort=[("last_modified_at", -1)],
        )

    async def _workout_count_and_last(self, user_id: str) -> tuple:
        """(total completed workouts, timestamp of the most recent one)."""
        total = await self.db.user_events.count_documents({
            "user_id": user_id,
            "event_type": {"$in": WORKOUT_COMPLETION_EVENTS},
        })
        last = None
        if total:
            doc = await self.db.user_events.find_one(
                {"user_id": user_id, "event_type": {"$in": WORKOUT_COMPLETION_EVENTS}},
                sort=[("timestamp", -1)],
            )
            if doc:
                last = doc.get("timestamp")
                if last is not None and last.tzinfo is None:
                    last = last.replace(tzinfo=timezone.utc)
        return total, last

    @staticmethod
    def _next_volume_badge(total: int) -> Optional[str]:
        """Label of the volume badge that is exactly ONE workout away, else None."""
        for threshold, label in VOLUME_BADGE_THRESHOLDS:
            if total == threshold - 1:
                return label
        return None

    def _pick_nudge(self, seed: str) -> tuple:
        """Deterministic-ish copy choice so retries don't reshuffle the message."""
        h = abs(hash(seed))
        return NUDGE_TITLES[h % len(NUDGE_TITLES)], NUDGE_BODIES[h % len(NUDGE_BODIES)]

    async def _process_reengagement(self) -> Dict[str, int]:
        """Hourly sweep. Picks at most ONE campaign per user, most-specific first."""
        now = datetime.now(timezone.utc)
        results = {
            "day1": 0, "day2": 0, "day4": 0, "streak_at_risk": 0,
            "free_replenished": 0, "abandoned_build": 0, "winback": 0,
            "second_workout": 0, "badge_proximity": 0,
            "dormant_never_activated": 0, "considered": 0,
        }

        # Only users who plausibly qualify for any campaign: created in the last
        # 30 days OR with a live streak. Keeps the sweep off the whole table.
        # V2.1 — widened. The original two clauses (signed up <30d OR live streak)
        # excluded the entire audience for the new campaigns: a non-subscriber who
        # joined 60 days ago and spent last week's free workout matched NEITHER,
        # so the replenish reminder would have swept zero users. Same for someone
        # with a half-built draft and no streak.
        #
        # NOTE the 5000 cap is pre-existing and silently truncates. It is now
        # matching a wider set, so it will bind sooner — logged below rather than
        # left as an invisible ceiling.
        CANDIDATE_CAP = 5000
        candidates = await self.db.users.find({
            "is_banned": {"$ne": True},
            "$or": [
                # 66d, not 30d: the dormant-activation campaign has a bucket at
                # age 60, and a user that old matched none of the other clauses
                # (no streak, and a never-activated user has no spent allowance),
                # so they were never swept at all. One day of slack past the last
                # bucket absorbs a missed sweep hour.
                {"created_at": {"$gte": now - timedelta(days=66)}},
                {"rt_streak_current": {"$gte": 2}},
                # Spent a free workout at some point -> eligible for replenish.
                {FREE_WORKOUT_PERIOD_FIELD: {"$exists": True, "$ne": None}},
            ],
        }).to_list(CANDIDATE_CAP + 1)
        if len(candidates) > CANDIDATE_CAP:
            candidates = candidates[:CANDIDATE_CAP]
            logger.warning(
                "reengagement sweep: candidate list truncated at %s — some users "
                "were NOT considered this pass", CANDIDATE_CAP,
            )

        actor_id = await self.notification_service.get_admin_user_id()
        today = now.strftime("%Y-%m-%d")
        yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")

        for user in candidates:
            user_id = str(user["_id"])
            results["considered"] += 1

            settings = await self.notification_service.get_user_settings(user_id)
            if not settings.get("notifications_enabled") or not settings.get("workout_reminders_enabled"):
                continue
            if self.notification_service._is_in_quiet_hours(settings):
                continue
            if self._local_hour(settings) != REENGAGEMENT_SEND_LOCAL_HOUR:
                continue

            created = user.get("created_at")
            if created is not None and created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            age_days = (now - created).days if created else None

            streak = int(user.get("rt_streak_current", 0) or 0)
            streak_last_day = user.get("rt_streak_last_day")

            campaign = title = body = None

            # 1. Streak at risk — highest intent. They have a live streak, their
            #    last counted workout was yesterday, so today breaks it.
            if streak >= 2 and streak_last_day == yesterday:
                campaign = "streak_at_risk"
                title = "Don't break it."
                body = (
                    f"{streak} days straight. A short session keeps it alive."
                )

            # 2. Activation, day 1: the offer itself. Says "free" out loud, once.
            elif age_days == 1 and not await self._completed_any_workout(user_id):
                campaign = "day1_free_workout"
                title, body = FIRST_WORKOUT_PLEA

            # 3. Activation, day 2-3: switch from the offer to their stated barrier.
            # `age_days in (2, 3)` is a CATCH-UP window, not a repeat: if the day-2
            # send already landed, day 3 must stay silent. Without this guard the
            # same text went out two days running to the largest activation
            # segment, which reads as a malfunction rather than a nudge.
            elif (
                age_days in (2, 3)
                and not await self._completed_any_workout(user_id)
                and not await self.notification_service.reengagement_campaign_ever_sent(
                    user_id, "day2_no_workout"
                )
            ):
                campaign = "day2_no_workout"
                barrier = await self._biggest_barrier(user_id)
                title, body = BARRIER_NUDGE_COPY.get(
                    barrier or "", self._pick_nudge(f"{user_id}:day2")
                )

            elif (
                age_days in (4, 5)
                and not await self._completed_any_workout(user_id)
                and not await self.notification_service.reengagement_campaign_ever_sent(
                    user_id, "day4_no_workout"
                )
            ):
                campaign = "day4_no_workout"
                # Second attempt: barrier-aware again, but from the day-4 table so
                # it reads as a different message rather than a repeat. Falls back
                # to the generic pool only when we never captured a barrier.
                barrier = await self._biggest_barrier(user_id)
                title, body = BARRIER_NUDGE_COPY_DAY4.get(
                    barrier or "", self._pick_nudge(f"{user_id}:day4")
                )

            # 4b. Second workout — one completed, none since, 2-5 days cold.
            #     Above the allowance and win-back campaigns because the habit is
            #     still forming and this window is short; below activation because
            #     someone with zero workouts is a different (earlier) problem.
            #     Lower bound of 2 days so we never nag the same day they trained.
            #
            #     `else` (not `elif <cond>`): this is the terminal arm of the
            #     activation chain above, and the workout-count query is only
            #     worth running once we know none of the earlier campaigns matched.
            else:
                wo_total, wo_last = await self._workout_count_and_last(user_id)

                if wo_total == 1 and wo_last is not None and 2 <= (now - wo_last).days <= 5:
                    campaign = "second_workout"
                    title, body = SECOND_WORKOUT_COPY

                # 4c. Badge proximity — exactly one workout from a volume badge.
                #     Uses the real thresholds the app awards on, so the promise
                #     is checkable rather than motivational filler. Requires
                #     recent-ish activity (14d) so we aren't dangling a badge at
                #     someone who has already left.
                elif (
                    self._next_volume_badge(wo_total)
                    and wo_last is not None
                    and 2 <= (now - wo_last).days <= 14
                ):
                    campaign = "badge_proximity"
                    title = BADGE_PROXIMITY_COPY[0].format(
                        label=self._next_volume_badge(wo_total)
                    )
                    body = BADGE_PROXIMITY_COPY[1]

            # 5. Weekly allowance reset — Monday only, and only for a
            #    non-subscriber who actually spent last week's free workout.
            #    Ordered ABOVE win-back because "your free workout is back" is a
            #    concrete unlock, where win-back is a generic nudge. Ordered
            #    BELOW activation because someone who has never completed a
            #    workout has no allowance story to tell.
            if not campaign and (
                now.isoweekday() == 1
                and not has_full_access(user)[0]
                and self._used_allowance_last_week(user, now)
            ):
                # Decay guard: without this, a non-subscriber who never converts
                # receives this same push every Monday forever. Requires activity
                # in the last 21 days, so it fades out for the genuinely gone
                # (who are win-back's problem, not this campaign's).
                last_seen_r = await self._last_activity_at(user_id)
                if last_seen_r is not None:
                    if last_seen_r.tzinfo is None:
                        last_seen_r = last_seen_r.replace(tzinfo=timezone.utc)
                    if (now - last_seen_r).days <= 21:
                        campaign = "free_replenished"
                        title, body = FREE_REPLENISHED_COPY

            # 6. Win-back: was active, has gone quiet for 7-14 days.
            #    Its own step rather than an `else` on the chain above, so that a
            #    branch which matched its outer condition but failed an inner
            #    guard (free_replenished's 21-day decay check, for instance) still
            #    falls through to here instead of silently sending nothing.
            if not campaign and streak_last_day and streak_last_day != today:
                last_seen = await self._last_activity_at(user_id)
                if last_seen is not None:
                    if last_seen.tzinfo is None:
                        last_seen = last_seen.replace(tzinfo=timezone.utc)
                    gap = (now - last_seen).days
                    if 7 <= gap <= 14:
                        campaign = "winback_7d"
                        title = "Back in."
                        body = "Pick a mood. We'll build the workout."

            # 7. Half-built workout — lowest priority on purpose. It is the most
            #    specific message here, but it must never displace a streak save
            #    or an activation nudge, so it only fires when nothing else did.
            if not campaign:
                draft = await self._abandoned_build(user_id, now)
                if draft:
                    campaign = "abandoned_build"
                    title = ABANDONED_BUILD_COPY[0]
                    body = ABANDONED_BUILD_COPY[1].format(
                        title=(draft.get("title") or "saved").strip()
                    )

            # 8. Dormant, never activated — the final fallback. Ordered last
            #    because an abandoned build (step 7) means they got partway, which
            #    is strictly more intent than never having started. In practice it
            #    barely competes with anything else: every campaign above except
            #    abandoned_build requires at least one completed workout, a live
            #    streak, or a spent free allowance — none of which a
            #    never-activated user can have.
            if not campaign and age_days is not None and age_days in DORMANT_ACTIVATION_BUCKETS:
                if not await self._completed_any_workout(user_id):
                    campaign = "dormant_never_activated"
                    title, body = DORMANT_ACTIVATION_BUCKETS[age_days]

            if not campaign:
                continue

            try:
                sent = await self.notification_service.trigger_reengagement_nudge(
                    user_id=user_id,
                    campaign=campaign,
                    title=title,
                    body=body,
                    actor_id=actor_id,
                )
            except Exception as e:
                logger.error(f"reengagement {campaign} failed for {user_id[:8]}: {e}")
                continue

            if sent:
                # .get with a fallback, not [campaign] — a direct index raised
                # KeyError for any campaign missing from this map, which would
                # have taken down the whole sweep the first time a new campaign
                # actually sent.
                key = {
                    "day1_free_workout": "day1",
                    "day2_no_workout": "day2",
                    "day4_no_workout": "day4",
                    "streak_at_risk": "streak_at_risk",
                    "second_workout": "second_workout",
                    "badge_proximity": "badge_proximity",
                    "dormant_never_activated": "dormant_never_activated",
                    "free_replenished": "free_replenished",
                    "abandoned_build": "abandoned_build",
                    "winback_7d": "winback",
                }.get(campaign, campaign)
                results.setdefault(key, 0)
                results[key] += 1

        if any(v for k, v in results.items() if k != "considered"):
            logger.info(
                "🔁 Re-engagement sweep: day2=%s day4=%s streak_at_risk=%s "
                "winback=%s (considered=%s)",
                results["day2"], results["day4"], results["streak_at_risk"],
                results["winback"], results["considered"],
            )
        return results

    # ============================================
    # WIN-BACK EMAIL (V2.1)
    # ============================================
    #
    # Resend was already configured and working (RESEND_API_KEY + SENDER_EMAIL
    # are set) but used for exactly two things: password reset and creator mail.
    # There was no welcome, no nudge, no win-back — no lifecycle email at all.
    # Meanwhile the backend ALREADY computes an at-risk cohort for the admin
    # dashboard (server.py at_risk_users) and does nothing with it but raise an
    # alert to the founder. This closes that loop.

    def _winback_email_html(self, name: str) -> str:
        greeting = f"Hey {name}," if name else "Hey,"
        return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0c0c0c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0c0c;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:480px;">
        <tr><td style="padding-bottom:28px;">
          <div style="font-size:22px;font-weight:700;color:#FFD700;letter-spacing:2px;">MOOD</div>
          <div style="font-size:11px;color:#666;letter-spacing:1px;margin-top:4px;">TRAIN HOW YOU FEEL</div>
        </td></tr>
        <tr><td style="color:#fff;font-size:16px;line-height:26px;padding-bottom:20px;">
          {greeting}
        </td></tr>
        <tr><td style="color:#aaa;font-size:15px;line-height:26px;padding-bottom:28px;">
          No guilt trip here &mdash; we know how it goes. Your workouts are still
          saved, and your free session resets every week.
          <br><br>
          Open the app, tell it how you feel today, and it'll build the rest.
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <a href="{APP_PUBLIC_URL}" style="display:inline-block;background:#FFD700;color:#0c0c0c;
             text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">
            Pick a mood
          </a>
        </td></tr>
        <tr><td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;
                       color:#555;font-size:12px;line-height:20px;">
          You're getting this because you have a MOOD account. Turn these off any
          time in the app under Settings &rarr; Notifications.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""

    async def _process_winback_emails(self) -> int:
        """Email users who have gone quiet for WINBACK_MIN..MAX days. Once each."""
        if not WINBACK_EMAIL_ENABLED:
            logger.info("✉️ Win-back email sweep skipped (WINBACK_EMAIL_ENABLED not set)")
            return 0

        try:
            import resend
        except ImportError:
            logger.error("✉️ Win-back email: resend SDK not installed")
            return 0

        if not os.environ.get("RESEND_API_KEY"):
            logger.error("✉️ Win-back email: RESEND_API_KEY unset")
            return 0
        resend.api_key = os.environ["RESEND_API_KEY"]
        sender = os.environ.get("SENDER_EMAIL", "noreply@officialmoodapp.com")

        now = datetime.now(timezone.utc)
        window_start = now - timedelta(days=WINBACK_MAX_DAYS)
        window_end = now - timedelta(days=WINBACK_MIN_DAYS)

        # Users whose LAST activity falls inside the lapse window.
        recent_ids = set(await self.db.user_events.distinct(
            "user_id", {"timestamp": {"$gte": window_end}}
        ))
        lapsed_ids = set(await self.db.user_events.distinct(
            "user_id", {"timestamp": {"$gte": window_start, "$lt": window_end}}
        ))
        candidates = lapsed_ids - recent_ids

        # Never email the same person twice for this campaign.
        already = set(await self.db.winback_email_log.distinct("user_id"))
        candidates -= already

        sent = 0
        for user_id in list(candidates)[:WINBACK_DAILY_SEND_LIMIT]:
            try:
                user = await self.db.users.find_one({"_id": ObjectId(user_id)})
            except Exception:
                continue
            if not user or user.get("is_banned") or user.get("is_internal"):
                continue
            email = (user.get("email") or "").strip()
            if not email or "@" not in email:
                continue

            # Only people who actually experienced the product. Emailing someone
            # who signed up and never worked out is an activation problem, and
            # the day-2/day-4 push already covers it.
            if not await self._completed_any_workout(user_id):
                continue

            try:
                resend.Emails.send({
                    "from": sender,
                    "to": [email],
                    "subject": "Your free workout is waiting",
                    "html": self._winback_email_html((user.get("name") or "").split(" ")[0]),
                })
                await self.db.winback_email_log.insert_one({
                    "user_id": user_id,
                    "email": email,
                    "sent_at": now,
                    "campaign": "winback_lapsed_v1",
                })
                sent += 1
            except Exception as e:
                logger.error(f"✉️ Win-back email failed for {user_id[:8]}: {e}")

        logger.info(f"✉️ Win-back emails sent: {sent} (candidates={len(candidates)})")
        return sent

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
