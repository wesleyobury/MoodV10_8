"""
MOOD Push Notification Copy + Click Rules

GOAL:
1) Standardize push notification copy for:
   - featured_workout drops
   - nudges
   - engagement (IG-style: "{{username}} liked your photo.")
2) Only featured_workout notifications should deep link / be clickable.
   All other notification taps should do nothing (push + in-app list).
"""

import random
from typing import Optional, Dict, Any, Literal
from enum import Enum

# Types
MoodNotifType = Literal["featured_workout", "nudge", "engagement"]

EngagementAction = Literal[
    "liked_your_photo",
    "liked_your_workout", 
    "commented_on_your_photo",
    "commented_on_your_workout",
    "mentioned_you",
    "tagged_you"
]

# Featured Workout Copy
FEATURED_TITLES = [
    "New Drop",
    "Today's Workout",
    "It's Live",
    "New Session",
    "Fresh Drop",
    "Now Live",
    "Just Dropped",
    "Ready",
    "Go Time",
]

FEATURED_BODIES = [
    "A new workout is live.",
    "Today's session is ready.",
    "It's waiting.",
    "Open and start.",
    "Your next session just dropped.",
    "Time to train.",
    "Built for today.",
    "It's loaded.",
    "Start now.",
    "Don't miss it.",
    "The next one's here.",
    "Ready when you are.",
]

# Nudge Copy
NUDGE_TITLES = [
    "Stay Locked",
    "Don't Drift",
    "Momentum",
    "Keep Going",
    "Day Active",
    "Time",
]

NUDGE_BODIES = [
    "Show up.",
    "Start small.",
    "Move today.",
    "Open the app.",
    "Stay sharp.",
    "Keep it alive.",
    "Don't break it.",
    "Back in.",
]

# Engagement Copy (IG-style)
ENGAGEMENT_TITLE_OPTIONS = [
    "Activity",
    "New Like",
    "New Comment", 
    "Tagged",
    "Mention",
]


def pick(arr: list) -> str:
    """Pick a random item from array"""
    return random.choice(arr)


def format_username(username: Optional[str]) -> str:
    """Format username for display (IG-style, no @)"""
    if not username:
        return "Someone"
    return username


def build_engagement_body(username: Optional[str], action: EngagementAction) -> str:
    """Build IG-style engagement notification body"""
    u = format_username(username)
    
    action_bodies = {
        "liked_your_photo": f"{u} liked your photo.",
        "liked_your_workout": f"{u} liked your workout.",
        "commented_on_your_photo": f"{u} commented on your photo.",
        "commented_on_your_workout": f"{u} commented on your workout.",
        "mentioned_you": f"{u} mentioned you.",
        "tagged_you": f"{u} tagged you.",
    }
    
    return action_bodies.get(action, "New activity on your post.")


def build_push_content(
    notif_type: MoodNotifType,
    deep_link: Optional[str] = None,
    username: Optional[str] = None,
    action: Optional[EngagementAction] = None
) -> Dict[str, Any]:
    """
    Build standardized push notification content.
    
    Args:
        notif_type: "featured_workout" | "nudge" | "engagement"
        deep_link: Only used for featured_workout (e.g. "mood://cart?featuredId=abc123")
        username: For engagement notifications
        action: For engagement notifications (e.g. "liked_your_photo")
    
    Returns:
        {
            "title": str,
            "body": str,
            "data": {"type": str, "deep_link"?: str}
        }
    """
    
    if notif_type == "featured_workout":
        return {
            "title": pick(FEATURED_TITLES),
            "body": pick(FEATURED_BODIES),
            "data": {
                "type": "featured_workout",
                "deep_link": deep_link  # ONLY featured_workout is clickable
            }
        }
    
    if notif_type == "nudge":
        return {
            "title": pick(NUDGE_TITLES),
            "body": pick(NUDGE_BODIES),
            "data": {
                "type": "nudge"
                # NO deep_link - not clickable
            }
        }
    
    # engagement
    return {
        "title": pick(ENGAGEMENT_TITLE_OPTIONS),
        "body": build_engagement_body(username, action or "liked_your_photo"),
        "data": {
            "type": "engagement"
            # NO deep_link - not clickable
        }
    }


# Mapping from NotificationType to engagement action
def get_engagement_action(notification_type: str) -> Optional[EngagementAction]:
    """Map notification type to engagement action for IG-style copy"""
    mapping = {
        "like": "liked_your_photo",
        "comment": "commented_on_your_photo",
        "mention": "mentioned_you",
        "tag": "tagged_you",
    }
    return mapping.get(notification_type)
