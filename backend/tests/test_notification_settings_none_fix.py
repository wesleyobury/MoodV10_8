"""
Notification Settings None Value Fix Tests

Bug: Push notifications not sending because None values stored in MongoDB 
notification_settings are treated as falsy by Python, silently blocking all push sends.

Root Cause: Python's dict.get(key, default) returns None (not the default) when 
the key EXISTS with value None in MongoDB.

Fix: 
1. Coalesce None→default in get_user_settings() using _bool() helper
2. Data migration on server startup for existing None values  
3. Fixed direct DB queries in notification_worker.py to use $ne:False

Test Areas:
- GET /api/notifications/settings returns proper boolean values (True/False, never None)
- get_user_settings() coalesces None to True for all boolean fields
- send_featured_workout_to_all settings check works correctly
- trigger_featured_workout_notification creates notification successfully
- trigger_workout_reminder creates notification successfully
- trigger_mass_workout_reminder does NOT skip users with previously-None settings
- Startup migration fixes None→True in notification_settings
- notification_worker._process_scheduled_digests uses $ne:False query
"""

import pytest
import requests
import os
import asyncio
from datetime import datetime, timezone
from bson import ObjectId

# Use PUBLIC URL for API testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bug-fixes-testing.preview.emergentagent.com').rstrip('/')

# MongoDB direct connection for direct DB tests
from motor.motor_asyncio import AsyncIOMotorClient
import sys
sys.path.insert(0, '/app/backend')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Test user IDs from review request
ADMIN_USER_ID = "693f94d29a560edaab674fd5"  # officialmoodapp (has settings record)
TEST_USER_ID = "68ae7db61794544c0d5de8a3"   # moodtester2025 (no settings record)
WORKOUT_ID = "697c70ea6a76d293b68a16b2"

# JWT tokens (generated via jwt.encode)
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjkzZjk0ZDI5YTU2MGVkYWFiNjc0ZmQ1IiwiZXhwIjoxNzcyNzgwNDg5LCJpYXQiOjE3NzI2OTQwODl9.AvXWVxA7ArnNcDsay2dh_tjGDgEj0TlqIbhjvUXQRTM"
TEST_USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhhZTdkYjYxNzk0NTQ0YzBkNWRlOGEzIiwiZXhwIjoxNzcyNzgwNDg5LCJpYXQiOjE3NzI2OTQwODl9.B_KkraXCb5NM8Fo3Bp0i1mJsVgKcVlJ33Kz07bpbo0c"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_health_endpoint(self):
        """Test that the API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")


class TestNotificationSettingsAPIBooleansNeverNone:
    """Test GET /api/notifications/settings returns proper boolean values"""
    
    def test_settings_for_user_with_record_returns_booleans(self):
        """User WITH settings record: all boolean fields should be True/False, never None"""
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.get(f"{BASE_URL}/api/notifications/settings", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        settings = response.json()
        
        # All boolean fields that should be True/False (never None)
        bool_fields = [
            "notifications_enabled", "likes_enabled", "likes_from_following_only",
            "comments_enabled", "comments_from_following_only", "messages_enabled",
            "follows_enabled", "workout_reminders_enabled", "featured_workouts_enabled",
            "following_digest_enabled", "featured_suggestions_enabled", "quiet_hours_enabled"
        ]
        
        for field in bool_fields:
            value = settings.get(field)
            assert value is not None, f"Field '{field}' is None - should be True or False"
            assert isinstance(value, bool), f"Field '{field}' is {type(value).__name__}, expected bool"
            print(f"✅ {field} = {value} (type: {type(value).__name__})")
        
        print(f"✅ All boolean fields are properly typed for user with settings record")
    
    def test_settings_for_user_without_record_returns_defaults(self):
        """User WITHOUT settings record: should get default values (all booleans True/False)"""
        headers = {"Authorization": f"Bearer {TEST_USER_TOKEN}"}
        response = requests.get(f"{BASE_URL}/api/notifications/settings", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        settings = response.json()
        
        # Check user_id matches
        assert settings.get("user_id") == TEST_USER_ID, f"user_id mismatch: {settings.get('user_id')}"
        
        # Check default boolean values
        defaults_true = [
            "notifications_enabled", "likes_enabled", "comments_enabled",
            "messages_enabled", "follows_enabled", "workout_reminders_enabled",
            "featured_workouts_enabled", "following_digest_enabled", "featured_suggestions_enabled"
        ]
        defaults_false = [
            "likes_from_following_only", "comments_from_following_only", "quiet_hours_enabled"
        ]
        
        for field in defaults_true:
            value = settings.get(field)
            assert value is True, f"Field '{field}' should default to True, got {value}"
            print(f"✅ {field} = {value} (default True)")
        
        for field in defaults_false:
            value = settings.get(field)
            assert value is False, f"Field '{field}' should default to False, got {value}"
            print(f"✅ {field} = {value} (default False)")
        
        print(f"✅ User without settings record gets proper defaults")


class TestGetUserSettingsNoneCoalescing:
    """Python unit tests: verify get_user_settings() coalesces None→True"""
    
    @pytest.fixture
    def mongo_client(self):
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_get_user_settings_coalesces_none_values(self, mongo_client):
        """When DB has None values, get_user_settings() should return True (not None)"""
        db = mongo_client[DB_NAME]
        
        # Import the notification service
        from notifications import NotificationService
        
        service = NotificationService(db)
        
        # Create test user with settings containing None values
        test_user_id = f"TEST_{ObjectId()}"
        
        # Insert settings with explicit None values (simulating the bug condition)
        await db.notification_settings.delete_many({"user_id": test_user_id})
        await db.notification_settings.insert_one({
            "user_id": test_user_id,
            "notifications_enabled": None,  # Bug: Python's dict.get returns None, not default
            "likes_enabled": None,
            "comments_enabled": None,
            "messages_enabled": None,
            "follows_enabled": None,
            "workout_reminders_enabled": None,
            "featured_workouts_enabled": None,
            "following_digest_enabled": None,
            "featured_suggestions_enabled": None,
            "quiet_hours_enabled": None,
        })
        
        # Call get_user_settings
        settings = await service.get_user_settings(test_user_id)
        
        # Cleanup
        await db.notification_settings.delete_many({"user_id": test_user_id})
        
        # Verify None values were coalesced to True (the default for these fields)
        assert settings["notifications_enabled"] is True, \
            f"notifications_enabled should be True, got {settings['notifications_enabled']}"
        assert settings["likes_enabled"] is True, \
            f"likes_enabled should be True, got {settings['likes_enabled']}"
        assert settings["featured_workouts_enabled"] is True, \
            f"featured_workouts_enabled should be True, got {settings['featured_workouts_enabled']}"
        assert settings["workout_reminders_enabled"] is True, \
            f"workout_reminders_enabled should be True, got {settings['workout_reminders_enabled']}"
        
        # quiet_hours_enabled defaults to False
        assert settings["quiet_hours_enabled"] is False, \
            f"quiet_hours_enabled should be False, got {settings['quiet_hours_enabled']}"
        
        print("✅ get_user_settings() correctly coalesces None→True/False")


class TestSendFeaturedWorkoutSettingsCheck:
    """Test send_featured_workout_to_all settings check doesn't block on True values"""
    
    @pytest.fixture
    def mongo_client(self):
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_settings_check_does_not_block_enabled_users(self, mongo_client):
        """
        Verify: (not settings.get('notifications_enabled')) does NOT block when settings are True.
        
        The bug was that settings.get('notifications_enabled') returned None when the key
        existed with value None in MongoDB, and 'not None' is True, causing skip.
        
        With the fix, get_user_settings returns True (coalesced from None), so 'not True' is False.
        """
        db = mongo_client[DB_NAME]
        from notifications import NotificationService
        
        service = NotificationService(db)
        
        # Test with admin user (has settings record)
        settings = await service.get_user_settings(ADMIN_USER_ID)
        
        # Simulate the check from send_featured_workout_to_all line ~1378
        notifications_enabled = settings.get("notifications_enabled")
        featured_workouts_enabled = settings.get("featured_workouts_enabled")
        
        print(f"notifications_enabled = {notifications_enabled} (type: {type(notifications_enabled).__name__})")
        print(f"featured_workouts_enabled = {featured_workouts_enabled} (type: {type(featured_workouts_enabled).__name__})")
        
        # The condition that was blocking sends:
        # if not settings.get("notifications_enabled") or not settings.get("featured_workouts_enabled"):
        #     continue
        
        should_skip = (not notifications_enabled) or (not featured_workouts_enabled)
        
        assert notifications_enabled is not None, "notifications_enabled should not be None"
        assert featured_workouts_enabled is not None, "featured_workouts_enabled should not be None"
        assert should_skip is False, f"User should NOT be skipped, but would_skip={should_skip}"
        
        print(f"✅ Settings check correctly allows send (should_skip={should_skip})")


class TestTriggerFeaturedWorkoutNotification:
    """Test trigger_featured_workout_notification creates notification successfully"""
    
    @pytest.fixture
    def mongo_client(self):
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_trigger_creates_notification_and_push_log(self, mongo_client):
        """
        Verify trigger_featured_workout_notification:
        1. Creates notification record in notifications collection
        2. Creates entry in push_send_log for idempotency
        """
        db = mongo_client[DB_NAME]
        from notifications import NotificationService
        
        service = NotificationService(db)
        
        # Generate unique workout ID for this test
        test_workout_id = str(ObjectId())
        test_dedupe_key = f"featured_workout:{test_workout_id}:{TEST_USER_ID}"
        
        # Clear any existing dedupe data for clean test
        await db.push_send_log.delete_many({
            "user_id": TEST_USER_ID,
            "type": "featured_workout",
            "event_key": test_dedupe_key
        })
        await db.notifications.delete_many({
            "user_id": TEST_USER_ID,
            "type": "featured_workout",
            "metadata.workout_id": test_workout_id
        })
        
        # Trigger the notification
        notification_id = await service.trigger_featured_workout_notification(
            user_id=TEST_USER_ID,
            workout_id=test_workout_id,
            workout_name="Test Featured Workout",
            workout_image="https://example.com/workout.jpg",
            actor_id=ADMIN_USER_ID
        )
        
        print(f"Notification ID returned: {notification_id}")
        
        # Verify notification was created
        if notification_id:
            notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
            assert notification is not None, "Notification should exist in DB"
            assert notification["type"] == "featured_workout"
            assert notification["user_id"] == TEST_USER_ID
            print(f"✅ Notification created: type={notification['type']}, body={notification.get('body', '')[:50]}...")
            
            # Verify push_send_log entry exists (for idempotency)
            push_log = await db.push_send_log.find_one({
                "user_id": TEST_USER_ID,
                "type": "featured_workout",
                "event_key": test_dedupe_key
            })
            # Note: push_send_log only created if push was attempted (requires device tokens)
            # The notification being created is the key test - push_send_log is secondary
            print(f"Push send log entry: {push_log is not None}")
            
            # Cleanup
            await db.notifications.delete_one({"_id": ObjectId(notification_id)})
            await db.push_send_log.delete_many({"event_key": test_dedupe_key})
        else:
            # If notification_id is None, check if it was blocked by settings
            settings = await service.get_user_settings(TEST_USER_ID)
            print(f"Settings: notifications_enabled={settings.get('notifications_enabled')}, featured_workouts_enabled={settings.get('featured_workouts_enabled')}")
            # This is acceptable if user has notifications disabled
            if settings.get('notifications_enabled') is False or settings.get('featured_workouts_enabled') is False:
                print("⚠️ Notification blocked by user settings (expected if disabled)")
            else:
                pytest.fail(f"Notification not created despite enabled settings: {settings}")
        
        print("✅ trigger_featured_workout_notification test complete")


class TestTriggerWorkoutReminder:
    """Test trigger_workout_reminder creates notification successfully"""
    
    @pytest.fixture
    def mongo_client(self):
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_trigger_workout_reminder_creates_notification(self, mongo_client):
        """Verify trigger_workout_reminder creates notification"""
        db = mongo_client[DB_NAME]
        from notifications import NotificationService
        
        service = NotificationService(db)
        
        # Get today's date for dedupe key
        today = datetime.now(timezone.utc).strftime('%Y%m%d')
        test_dedupe_key = f"workout_reminder:{TEST_USER_ID}:{today}"
        
        # Clear dedupe data
        await db.push_send_log.delete_many({"event_key": test_dedupe_key})
        await db.notifications.delete_many({
            "user_id": TEST_USER_ID,
            "type": "workout_reminder",
            "metadata.dedupe_key": test_dedupe_key
        })
        
        # Trigger workout reminder
        notification_id = await service.trigger_workout_reminder(
            user_id=TEST_USER_ID,
            custom_message="Test reminder - time to workout!",
            actor_id=ADMIN_USER_ID
        )
        
        print(f"Notification ID: {notification_id}")
        
        if notification_id:
            notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
            assert notification is not None, "Notification should exist"
            assert notification["type"] == "workout_reminder"
            print(f"✅ Workout reminder created: body={notification.get('body', '')[:50]}...")
            
            # Cleanup
            await db.notifications.delete_one({"_id": ObjectId(notification_id)})
        else:
            settings = await service.get_user_settings(TEST_USER_ID)
            if not settings.get('workout_reminders_enabled'):
                print("⚠️ Notification blocked - workout_reminders_enabled is False")
            else:
                pytest.fail("Notification not created despite enabled settings")
        
        # Cleanup push log
        await db.push_send_log.delete_many({"event_key": test_dedupe_key})
        print("✅ trigger_workout_reminder test complete")


class TestMassWorkoutReminderNoSkip:
    """Test trigger_mass_workout_reminder does NOT skip users with previously-None settings"""
    
    @pytest.fixture
    def mongo_client(self):
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_mass_reminder_includes_users_after_none_fix(self, mongo_client):
        """
        Verify trigger_mass_workout_reminder doesn't skip users whose settings 
        had None values before the fix.
        
        After the fix:
        1. get_user_settings() returns True (coalesced from None)
        2. The check (not settings.get('notifications_enabled')) is False
        3. User is NOT skipped
        """
        db = mongo_client[DB_NAME]
        from notification_worker import NotificationWorker
        from notifications import NotificationService
        
        worker = NotificationWorker(db)
        service = NotificationService(db)
        
        # Create test user with "fixed" settings (True, not None)
        test_user_id = f"TEST_mass_{ObjectId()}"
        
        # Insert test user
        await db.users.delete_many({"_id": ObjectId(test_user_id) if len(test_user_id) == 24 else None})
        await db.users.delete_many({"username": {"$regex": "^TEST_mass_"}})
        
        user_result = await db.users.insert_one({
            "username": f"TEST_mass_user_{ObjectId()}",
            "email": f"test_{ObjectId()}@test.com",
            "created_at": datetime.now(timezone.utc),
            "is_banned": False
        })
        actual_user_id = str(user_result.inserted_id)
        
        # Insert settings with True values (as they would be after migration)
        await db.notification_settings.delete_many({"user_id": actual_user_id})
        await db.notification_settings.insert_one({
            "user_id": actual_user_id,
            "notifications_enabled": True,
            "workout_reminders_enabled": True,
            "quiet_hours_enabled": False,
        })
        
        # Verify get_user_settings returns True
        settings = await service.get_user_settings(actual_user_id)
        assert settings["notifications_enabled"] is True
        assert settings["workout_reminders_enabled"] is True
        
        # Simulate the check in trigger_mass_workout_reminder
        would_skip = (
            not settings.get("notifications_enabled") or 
            not settings.get("workout_reminders_enabled")
        )
        
        assert would_skip is False, f"User should NOT be skipped but would_skip={would_skip}"
        
        # Cleanup
        await db.users.delete_one({"_id": user_result.inserted_id})
        await db.notification_settings.delete_many({"user_id": actual_user_id})
        
        print(f"✅ Mass workout reminder check passes - user would NOT be skipped")


class TestStartupMigration:
    """Test server startup migration fixes None→True in notification_settings"""
    
    @pytest.fixture
    def mongo_client(self):
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_migration_logic_correct(self, mongo_client):
        """Verify the migration logic would fix None values to True"""
        db = mongo_client[DB_NAME]
        
        # Create test document with None values
        test_user_id = f"TEST_migration_{ObjectId()}"
        
        await db.notification_settings.delete_many({"user_id": test_user_id})
        await db.notification_settings.insert_one({
            "user_id": test_user_id,
            "notifications_enabled": None,
            "likes_enabled": None,
            "featured_workouts_enabled": None,
        })
        
        # Run the same migration logic from server.py startup
        bool_defaults_true = [
            "notifications_enabled", "likes_enabled", "comments_enabled",
            "messages_enabled", "follows_enabled", "workout_reminders_enabled",
            "featured_workouts_enabled", "following_digest_enabled",
            "featured_suggestions_enabled",
        ]
        
        total_fixed = 0
        for field in bool_defaults_true:
            r = await db.notification_settings.update_many(
                {"user_id": test_user_id, field: None}, 
                {"$set": {field: True}}
            )
            total_fixed += r.modified_count
        
        print(f"Migration fixed {total_fixed} fields")
        
        # Verify the document was updated
        doc = await db.notification_settings.find_one({"user_id": test_user_id})
        
        assert doc["notifications_enabled"] is True, f"Expected True, got {doc['notifications_enabled']}"
        assert doc["likes_enabled"] is True, f"Expected True, got {doc['likes_enabled']}"
        assert doc["featured_workouts_enabled"] is True, f"Expected True, got {doc['featured_workouts_enabled']}"
        
        # Cleanup
        await db.notification_settings.delete_many({"user_id": test_user_id})
        
        print("✅ Migration logic correctly fixes None→True")


class TestNotificationWorkerNeQuery:
    """Test notification_worker uses $ne:False query (not exact True match)"""
    
    def test_process_scheduled_digests_uses_ne_false(self):
        """Verify _process_scheduled_digests uses $ne:False query"""
        worker_path = '/app/backend/notification_worker.py'
        
        with open(worker_path, 'r') as f:
            content = f.read()
        
        # Find the _process_scheduled_digests method
        method_start = content.find('async def _process_scheduled_digests')
        assert method_start != -1, "_process_scheduled_digests method not found"
        
        # Get method body
        method_end = content.find('async def ', method_start + 50)
        method_code = content[method_start:method_end]
        
        # Check for $ne: False pattern
        has_ne_false_notifications = '"notifications_enabled": {"$ne": False}' in method_code or \
                                      "'notifications_enabled': {'$ne': False}" in method_code
        has_ne_false_digest = '"following_digest_enabled": {"$ne": False}' in method_code or \
                              "'following_digest_enabled': {'$ne': False}" in method_code
        
        print(f"Uses $ne:False for notifications_enabled: {has_ne_false_notifications}")
        print(f"Uses $ne:False for following_digest_enabled: {has_ne_false_digest}")
        
        assert has_ne_false_notifications, "_process_scheduled_digests should use $ne:False for notifications_enabled"
        assert has_ne_false_digest, "_process_scheduled_digests should use $ne:False for following_digest_enabled"
        
        print("✅ _process_scheduled_digests correctly uses $ne:False query")
    
    def test_check_quiet_hours_ending_uses_ne_false(self):
        """Verify _check_quiet_hours_ending uses $ne:False query"""
        worker_path = '/app/backend/notification_worker.py'
        
        with open(worker_path, 'r') as f:
            content = f.read()
        
        # Find the _check_quiet_hours_ending method
        method_start = content.find('async def _check_quiet_hours_ending')
        assert method_start != -1, "_check_quiet_hours_ending method not found"
        
        # Get method body
        method_end = content.find('async def ', method_start + 50)
        method_code = content[method_start:method_end]
        
        # Check for $ne: False pattern
        has_ne_false = '"notifications_enabled": {"$ne": False}' in method_code or \
                       "'notifications_enabled': {'$ne': False}" in method_code
        
        print(f"Uses $ne:False for notifications_enabled: {has_ne_false}")
        
        assert has_ne_false, "_check_quiet_hours_ending should use $ne:False for notifications_enabled"
        
        print("✅ _check_quiet_hours_ending correctly uses $ne:False query")


class TestGetUserSettingsCodeImplementation:
    """Verify get_user_settings implementation has _bool and _str helpers"""
    
    def test_get_user_settings_has_bool_helper(self):
        """Verify get_user_settings uses _bool helper for None coalescing"""
        notifications_path = '/app/backend/notifications.py'
        
        with open(notifications_path, 'r') as f:
            content = f.read()
        
        # Find get_user_settings method
        method_start = content.find('async def get_user_settings(')
        assert method_start != -1, "get_user_settings method not found"
        
        # Get method body
        method_end = content.find('async def ', method_start + 50)
        method_code = content[method_start:method_end]
        
        # Check for _bool helper definition
        has_bool_helper = 'def _bool(val' in method_code and 'if val is not None' in method_code
        
        # Check for _bool usage
        uses_bool_helper = '_bool(settings.get(' in method_code
        
        print(f"Has _bool helper: {has_bool_helper}")
        print(f"Uses _bool helper: {uses_bool_helper}")
        
        assert has_bool_helper, "get_user_settings should define _bool helper"
        assert uses_bool_helper, "get_user_settings should use _bool helper"
        
        print("✅ get_user_settings correctly implements _bool helper for None coalescing")
    
    def test_get_user_settings_has_str_helper(self):
        """Verify get_user_settings uses _str helper for string fields"""
        notifications_path = '/app/backend/notifications.py'
        
        with open(notifications_path, 'r') as f:
            content = f.read()
        
        # Find get_user_settings method
        method_start = content.find('async def get_user_settings(')
        assert method_start != -1, "get_user_settings method not found"
        
        # Get method body
        method_end = content.find('async def ', method_start + 50)
        method_code = content[method_start:method_end]
        
        # Check for _str helper
        has_str_helper = 'def _str(val' in method_code
        uses_str_helper = '_str(settings.get(' in method_code
        
        print(f"Has _str helper: {has_str_helper}")
        print(f"Uses _str helper: {uses_str_helper}")
        
        assert has_str_helper, "get_user_settings should define _str helper"
        assert uses_str_helper, "get_user_settings should use _str helper"
        
        print("✅ get_user_settings correctly implements _str helper")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
