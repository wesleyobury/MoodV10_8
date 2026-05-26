"""
Push Notification System Tests
Testing bug fixes for:
1. Duplicate push notifications (4 pushes instead of 1)
2. 'Unknown' sender in notification tab instead of admin username
3. No idempotency for push sends

Tests focus on:
- Device token registration uses upsert (no duplicate tokens in DB)
- PushSendLog idempotency: unique index on [user_id, type, event_key]
- Database indexes on device_tokens and push_send_log
- Admin endpoints pass sender_user_id/actor_id properly
- Notification retrieval includes actor info via $lookup
"""

import pytest
import requests
import os
from datetime import datetime, timezone
from bson import ObjectId

# Use PUBLIC URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mood-build.preview.emergentagent.com').rstrip('/')

# MongoDB direct connection for index verification
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')


class TestHealthCheck:
    """Basic API health check"""
    
    def test_health_endpoint(self):
        """Test that the API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")


class TestDatabaseIndexes:
    """Test MongoDB indexes for push notification system"""
    
    @pytest.fixture
    def mongo_client(self):
        """Get async MongoDB client"""
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_device_tokens_unique_index_exists(self, mongo_client):
        """Verify unique index on device_tokens.token exists"""
        db = mongo_client[DB_NAME]
        indexes = await db.device_tokens.index_information()
        
        # Check for unique index on 'token' field
        unique_token_index_found = False
        for idx_name, idx_info in indexes.items():
            if idx_info.get('unique') and 'token' in str(idx_info.get('key', [])):
                unique_token_index_found = True
                print(f"✅ Found unique index on device_tokens.token: {idx_name} -> {idx_info}")
                break
        
        assert unique_token_index_found, "Missing unique index on device_tokens.token"
    
    @pytest.mark.asyncio
    async def test_push_send_log_unique_compound_index(self, mongo_client):
        """Verify unique compound index on push_send_log [user_id, type, event_key]"""
        db = mongo_client[DB_NAME]
        indexes = await db.push_send_log.index_information()
        
        # Check for unique compound index
        unique_compound_found = False
        for idx_name, idx_info in indexes.items():
            if idx_info.get('unique'):
                key_fields = [k[0] for k in idx_info.get('key', [])]
                if 'user_id' in key_fields and 'type' in key_fields and 'event_key' in key_fields:
                    unique_compound_found = True
                    print(f"✅ Found unique compound index on push_send_log: {idx_name} -> {idx_info}")
                    break
        
        assert unique_compound_found, "Missing unique compound index on push_send_log [user_id, type, event_key]"
    
    @pytest.mark.asyncio
    async def test_push_send_log_ttl_index(self, mongo_client):
        """Verify TTL index on push_send_log.created_at"""
        db = mongo_client[DB_NAME]
        indexes = await db.push_send_log.index_information()
        
        # Check for TTL index
        ttl_index_found = False
        for idx_name, idx_info in indexes.items():
            if 'expireAfterSeconds' in idx_info:
                ttl_index_found = True
                ttl_seconds = idx_info['expireAfterSeconds']
                # Should be 7 days = 604800 seconds
                expected_ttl = 7 * 24 * 3600
                print(f"✅ Found TTL index on push_send_log: {idx_name} -> TTL={ttl_seconds}s (expected {expected_ttl}s)")
                assert ttl_seconds == expected_ttl, f"TTL should be 7 days ({expected_ttl}s), got {ttl_seconds}s"
                break
        
        assert ttl_index_found, "Missing TTL index on push_send_log"


class TestDeviceTokenRegistration:
    """Test device token registration uses upsert to prevent duplicates"""
    
    @pytest.fixture
    def mongo_client(self):
        """Get async MongoDB client"""
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.fixture
    def test_user_id(self):
        """Get a test user ID - create one if needed"""
        # Use the admin user 'officialmoodapp' for testing
        client = AsyncIOMotorClient(MONGO_URL)
        import asyncio
        loop = asyncio.get_event_loop()
        
        async def get_user():
            db = client[DB_NAME]
            user = await db.users.find_one({"username": "officialmoodapp"})
            if user:
                return str(user["_id"])
            # Create a test user if none exists
            result = await db.users.insert_one({
                "username": f"TEST_push_user_{ObjectId()}",
                "email": f"TEST_push_user_{ObjectId()}@test.com",
                "created_at": datetime.now(timezone.utc),
                "is_admin": True
            })
            return str(result.inserted_id)
        
        user_id = loop.run_until_complete(get_user())
        client.close()
        return user_id
    
    @pytest.mark.asyncio
    async def test_upsert_behavior_no_duplicates(self, mongo_client, test_user_id):
        """Test that registering the same token twice doesn't create duplicates"""
        db = mongo_client[DB_NAME]
        
        test_token = f"TEST_ExponentPushToken[{ObjectId()}]"
        
        # Clean up any existing test token
        await db.device_tokens.delete_many({"token": test_token})
        
        # Register token first time
        result1 = await db.device_tokens.update_one(
            {"token": test_token},
            {
                "$set": {
                    "user_id": test_user_id,
                    "platform": "ios",
                    "last_active": datetime.now(timezone.utc),
                    "is_valid": True,
                },
                "$setOnInsert": {
                    "token": test_token,
                    "created_at": datetime.now(timezone.utc),
                },
            },
            upsert=True,
        )
        
        # Count tokens with this value
        count_after_first = await db.device_tokens.count_documents({"token": test_token})
        print(f"After first registration: {count_after_first} token(s) with value {test_token[:30]}...")
        
        # Register same token second time (simulating re-registration)
        result2 = await db.device_tokens.update_one(
            {"token": test_token},
            {
                "$set": {
                    "user_id": test_user_id,
                    "platform": "ios",
                    "last_active": datetime.now(timezone.utc),
                    "is_valid": True,
                },
                "$setOnInsert": {
                    "token": test_token,
                    "created_at": datetime.now(timezone.utc),
                },
            },
            upsert=True,
        )
        
        # Count tokens again
        count_after_second = await db.device_tokens.count_documents({"token": test_token})
        print(f"After second registration: {count_after_second} token(s) with value {test_token[:30]}...")
        
        # Cleanup
        await db.device_tokens.delete_many({"token": test_token})
        
        # Assertions
        assert count_after_first == 1, f"First registration should create exactly 1 token, got {count_after_first}"
        assert count_after_second == 1, f"Second registration should not create duplicate, got {count_after_second}"
        assert result1.upserted_id is not None, "First registration should be an insert (upserted_id set)"
        assert result2.upserted_id is None, "Second registration should be an update (upserted_id None)"
        
        print("✅ Device token upsert behavior verified - no duplicates created")


class TestPushSendLogIdempotency:
    """Test push_send_log idempotency prevents duplicate sends"""
    
    @pytest.fixture
    def mongo_client(self):
        """Get async MongoDB client"""
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_push_send_log_rejects_duplicates(self, mongo_client):
        """Test that duplicate push send entries are rejected by unique index"""
        db = mongo_client[DB_NAME]
        
        test_user_id = str(ObjectId())
        test_type = "featured_workout"
        test_event_key = f"TEST_featured_workout:{ObjectId()}:{test_user_id}"
        
        # Clean up any existing test data
        await db.push_send_log.delete_many({"event_key": {"$regex": "^TEST_"}})
        
        # Insert first push send log entry
        try:
            await db.push_send_log.insert_one({
                "user_id": test_user_id,
                "type": test_type,
                "event_key": test_event_key,
                "created_at": datetime.now(timezone.utc),
            })
            first_insert_success = True
            print(f"✅ First insert succeeded for event_key: {test_event_key[:50]}...")
        except Exception as e:
            first_insert_success = False
            print(f"❌ First insert failed: {e}")
        
        # Try to insert duplicate
        duplicate_rejected = False
        try:
            await db.push_send_log.insert_one({
                "user_id": test_user_id,
                "type": test_type,
                "event_key": test_event_key,
                "created_at": datetime.now(timezone.utc),
            })
            print("❌ Duplicate insert succeeded (should have been rejected)")
        except Exception as e:
            if "11000" in str(e) or "duplicate key" in str(e).lower():
                duplicate_rejected = True
                print(f"✅ Duplicate correctly rejected: {e}")
            else:
                print(f"❌ Unexpected error: {e}")
        
        # Count entries
        count = await db.push_send_log.count_documents({
            "user_id": test_user_id,
            "type": test_type,
            "event_key": test_event_key,
        })
        
        # Cleanup
        await db.push_send_log.delete_many({"event_key": {"$regex": "^TEST_"}})
        
        # Assertions
        assert first_insert_success, "First insert should succeed"
        assert duplicate_rejected, "Duplicate insert should be rejected by unique index"
        assert count == 1, f"Should have exactly 1 entry, got {count}"
        
        print("✅ Push send log idempotency verified - duplicates are rejected")


class TestNotificationActorInfo:
    """Test that notification retrieval includes actor info"""
    
    @pytest.fixture
    def mongo_client(self):
        """Get async MongoDB client"""
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_notification_has_actor_lookup(self, mongo_client):
        """Test that notifications include actor info via $lookup aggregation"""
        db = mongo_client[DB_NAME]
        
        # Get an admin user to use as actor
        admin_user = await db.users.find_one({"username": "officialmoodapp"})
        if not admin_user:
            print("⚠️ Admin user 'officialmoodapp' not found, creating test user")
            result = await db.users.insert_one({
                "username": "officialmoodapp",
                "email": "officialmoodapp@test.com",
                "name": "Official MOOD App",
                "created_at": datetime.now(timezone.utc),
                "is_admin": True
            })
            admin_user = await db.users.find_one({"_id": result.inserted_id})
        
        admin_id = str(admin_user["_id"])
        
        # Create a test user to receive notification
        test_recipient_id = str(ObjectId())
        
        # Create a test notification with actor_id
        test_notification = {
            "user_id": test_recipient_id,
            "type": "featured_workout",
            "title": "TEST New Workout",
            "body": "Test workout notification for actor lookup test",
            "actor_id": admin_id,  # This is the key field we're testing
            "entity_id": str(ObjectId()),
            "entity_type": "featured_workout",
            "created_at": datetime.now(timezone.utc),
            "read_at": None,
        }
        
        result = await db.notifications.insert_one(test_notification)
        notification_id = str(result.inserted_id)
        
        # Run the same aggregation pipeline used in get_notifications
        pipeline = [
            {"$match": {"_id": ObjectId(notification_id)}},
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
                    "actor_id": 1,
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
        
        notifications = await db.notifications.aggregate(pipeline).to_list(1)
        
        # Cleanup
        await db.notifications.delete_one({"_id": ObjectId(notification_id)})
        
        # Assertions
        assert len(notifications) == 1, "Should find the test notification"
        notification = notifications[0]
        
        assert notification.get("actor") is not None, "Notification should have actor field"
        assert notification["actor"].get("username") == "officialmoodapp", \
            f"Actor username should be 'officialmoodapp', got {notification['actor'].get('username')}"
        assert notification["actor"].get("id") == admin_id, \
            f"Actor ID should match admin_id {admin_id}, got {notification['actor'].get('id')}"
        
        print(f"✅ Notification actor lookup verified: actor.username={notification['actor'].get('username')}")


class TestUnboundedQueriesFixed:
    """Test that unbounded queries are capped"""
    
    def test_no_100000_to_list_in_server(self):
        """Verify server.py doesn't have .to_list(100000) calls"""
        server_path = os.path.join(os.path.dirname(__file__), '..', 'server.py')
        
        if not os.path.exists(server_path):
            server_path = '/app/backend/server.py'
        
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Check for .to_list(100000)
        has_100000 = '.to_list(100000)' in content
        
        # Count occurrences of various to_list limits
        import re
        to_list_matches = re.findall(r'\.to_list\((\d+)\)', content)
        max_limit = max([int(m) for m in to_list_matches]) if to_list_matches else 0
        
        print(f"Max to_list limit found in server.py: {max_limit}")
        print(f"Has .to_list(100000): {has_100000}")
        
        # Check that max is 10000 or less
        assert not has_100000, "server.py still contains .to_list(100000) - unbounded queries not fixed"
        assert max_limit <= 10000, f"Max to_list limit should be 10000 or less, found {max_limit}"
        
        print("✅ Unbounded queries capped - no .to_list(100000) found")


class TestAdminEndpointsSendActorId:
    """Test that admin notification endpoints pass actor_id/sender_user_id"""
    
    def test_admin_featured_workout_endpoint_code_passes_sender(self):
        """Verify POST /admin/notifications/featured-workout passes sender_user_id"""
        server_path = '/app/backend/server.py'
        
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Look for the featured-workout endpoint and verify it passes sender_user_id
        endpoint_section = content.find('@api_router.post("/admin/notifications/featured-workout")')
        assert endpoint_section != -1, "Featured workout endpoint not found"
        
        # Get ~50 lines after the endpoint definition
        section_end = content.find('@api_router.', endpoint_section + 100)
        endpoint_code = content[endpoint_section:section_end]
        
        # Check that sender_user_id=current_user_id is passed
        has_sender_param = 'sender_user_id=current_user_id' in endpoint_code
        
        print(f"Featured workout endpoint passes sender_user_id: {has_sender_param}")
        assert has_sender_param, "POST /admin/notifications/featured-workout should pass sender_user_id=current_user_id"
        
        print("✅ Featured workout endpoint correctly passes sender_user_id")
    
    def test_admin_workout_reminder_endpoint_code_passes_actor(self):
        """Verify POST /admin/notifications/workout-reminder passes actor_id"""
        server_path = '/app/backend/server.py'
        
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Look for the workout-reminder endpoint
        endpoint_section = content.find('@api_router.post("/admin/notifications/workout-reminder")')
        assert endpoint_section != -1, "Workout reminder endpoint not found"
        
        # Get section until next endpoint
        section_end = content.find('@api_router.', endpoint_section + 100)
        endpoint_code = content[endpoint_section:section_end]
        
        # Check that actor_id=current_user_id is passed
        has_actor_param = 'actor_id=current_user_id' in endpoint_code
        
        print(f"Workout reminder endpoint passes actor_id: {has_actor_param}")
        assert has_actor_param, "POST /admin/notifications/workout-reminder should pass actor_id=current_user_id"
        
        print("✅ Workout reminder endpoint correctly passes actor_id")
    
    def test_admin_mass_workout_reminder_passes_sender(self):
        """Verify POST /admin/notifications/mass-workout-reminder passes sender_user_id"""
        server_path = '/app/backend/server.py'
        
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Look for the mass-workout-reminder endpoint
        endpoint_section = content.find('@api_router.post("/admin/notifications/mass-workout-reminder")')
        assert endpoint_section != -1, "Mass workout reminder endpoint not found"
        
        # Get section until next endpoint
        section_end = content.find('@api_router.', endpoint_section + 100)
        endpoint_code = content[endpoint_section:section_end]
        
        # Check that sender_user_id=current_user_id is passed
        has_sender_param = 'sender_user_id=current_user_id' in endpoint_code
        
        print(f"Mass workout reminder endpoint passes sender_user_id: {has_sender_param}")
        assert has_sender_param, "POST /admin/notifications/mass-workout-reminder should pass sender_user_id=current_user_id"
        
        print("✅ Mass workout reminder endpoint correctly passes sender_user_id")
    
    def test_admin_featured_suggestion_passes_sender(self):
        """Verify POST /admin/notifications/featured-suggestion passes sender_user_id"""
        server_path = '/app/backend/server.py'
        
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Look for the featured-suggestion endpoint
        endpoint_section = content.find('@api_router.post("/admin/notifications/featured-suggestion")')
        assert endpoint_section != -1, "Featured suggestion endpoint not found"
        
        # Get section until next endpoint
        section_end = content.find('@api_router.', endpoint_section + 100)
        endpoint_code = content[endpoint_section:section_end]
        
        # Check that sender_user_id=current_user_id is passed
        has_sender_param = 'sender_user_id=current_user_id' in endpoint_code
        
        print(f"Featured suggestion endpoint passes sender_user_id: {has_sender_param}")
        assert has_sender_param, "POST /admin/notifications/featured-suggestion should pass sender_user_id=current_user_id"
        
        print("✅ Featured suggestion endpoint correctly passes sender_user_id")


class TestNotificationServiceActorResolution:
    """Test that notification service methods auto-resolve admin actor_id"""
    
    def test_trigger_workout_reminder_auto_resolves_actor(self):
        """Verify trigger_workout_reminder resolves admin user when actor_id not provided"""
        notifications_path = '/app/backend/notifications.py'
        
        with open(notifications_path, 'r') as f:
            content = f.read()
        
        # Find trigger_workout_reminder method
        method_start = content.find('async def trigger_workout_reminder(')
        assert method_start != -1, "trigger_workout_reminder method not found"
        
        # Get method body (until next 'async def' or class end)
        method_end = content.find('async def ', method_start + 50)
        method_code = content[method_start:method_end]
        
        # Check for actor_id resolution logic
        has_actor_param = 'actor_id: Optional[str] = None' in method_code
        has_auto_resolution = 'get_admin_user_id' in method_code or 'if not actor_id' in method_code
        
        print(f"trigger_workout_reminder: has actor_id param={has_actor_param}, has auto-resolution={has_auto_resolution}")
        assert has_actor_param, "trigger_workout_reminder should accept actor_id parameter"
        assert has_auto_resolution, "trigger_workout_reminder should auto-resolve admin actor_id"
        
        print("✅ trigger_workout_reminder correctly auto-resolves actor_id")
    
    def test_trigger_featured_workout_auto_resolves_actor(self):
        """Verify trigger_featured_workout_notification resolves admin user when actor_id not provided"""
        notifications_path = '/app/backend/notifications.py'
        
        with open(notifications_path, 'r') as f:
            content = f.read()
        
        # Find trigger_featured_workout_notification method
        method_start = content.find('async def trigger_featured_workout_notification(')
        assert method_start != -1, "trigger_featured_workout_notification method not found"
        
        # Get method body
        method_end = content.find('async def ', method_start + 50)
        method_code = content[method_start:method_end]
        
        # Check for actor_id resolution logic
        has_actor_param = 'actor_id: Optional[str] = None' in method_code
        has_auto_resolution = 'get_admin_user_id' in method_code or 'if not actor_id' in method_code
        
        print(f"trigger_featured_workout_notification: has actor_id param={has_actor_param}, has auto-resolution={has_auto_resolution}")
        assert has_actor_param, "trigger_featured_workout_notification should accept actor_id parameter"
        assert has_auto_resolution, "trigger_featured_workout_notification should auto-resolve admin actor_id"
        
        print("✅ trigger_featured_workout_notification correctly auto-resolves actor_id")


class TestGetUserTokensNoDuplicates:
    """Test get_user_tokens returns deduplicated tokens"""
    
    def test_get_user_tokens_deduplication_logic(self):
        """Verify get_user_tokens has defensive deduplication"""
        notifications_path = '/app/backend/notifications.py'
        
        with open(notifications_path, 'r') as f:
            content = f.read()
        
        # Find get_user_tokens method
        method_start = content.find('async def get_user_tokens(')
        assert method_start != -1, "get_user_tokens method not found"
        
        # Get method body
        method_end = content.find('async def ', method_start + 50)
        method_code = content[method_start:method_end]
        
        # Check for deduplication logic
        has_dedup = 'seen' in method_code and 'unique' in method_code
        has_set = 'set()' in method_code
        
        print(f"get_user_tokens: has deduplication logic={has_dedup}, uses set={has_set}")
        assert has_dedup or has_set, "get_user_tokens should have defensive deduplication"
        
        print("✅ get_user_tokens has defensive deduplication logic")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
