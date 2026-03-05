"""
Test Suite: VIBER 4 Ship-Ready Fixes - Video Engagement Notification Implementation
Tests for the 4 refinements to video engagement notification implementation.

FIX 1: trigger_comment_notification resolves post owner via self._resolve_post_author_id(post)
FIX 2: _migrate_posts_author_id uses same priority: user_id > creator_id > owner_id
FIX 3: Non-self video like produces correct logs: liker != author
FIX 4: NOTIF-CREATED log line includes media_type for video posts

Key verifications:
- _resolve_post_author_id is a @staticmethod on NotificationService
- Comment on VIDEO post creates notification with media_type=video
- Migration function priority order matches helper
- Non-self like logs show actor != recipient
- NOTIF-CREATED log includes all required fields
- Both single-like and bundled paths include media_type
- Regression: Image post like still works
- Regression: Self-like still skipped
"""

import pytest
import requests
import os
import re
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient

# Backend base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://workout-nav-fix.preview.emergentagent.com"

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

mongo_client = MongoClient(MONGO_URL)
db = mongo_client[DB_NAME]

# Import for code inspection
import sys
sys.path.insert(0, '/app/backend')


class TestFix1_ResolvePostAuthorIdMethod:
    """FIX 1: Verify _resolve_post_author_id exists as @staticmethod on NotificationService"""
    
    def test_resolve_post_author_id_is_staticmethod_on_notificationservice(self):
        """FIX 1a: _resolve_post_author_id should be a @staticmethod on NotificationService class"""
        with open('/app/backend/notifications.py', 'r') as f:
            content = f.read()
        
        # Check for @staticmethod decorator before _resolve_post_author_id
        pattern = r'@staticmethod\s+def\s+_resolve_post_author_id'
        assert re.search(pattern, content), \
            "_resolve_post_author_id should be a @staticmethod on NotificationService"
        
        print("✅ FIX 1a: _resolve_post_author_id is a @staticmethod on NotificationService")
    
    def test_trigger_comment_notification_calls_self_resolve(self):
        """FIX 1b: trigger_comment_notification should call self._resolve_post_author_id(post)"""
        with open('/app/backend/notifications.py', 'r') as f:
            content = f.read()
        
        # Check that trigger_comment_notification exists
        assert 'async def trigger_comment_notification' in content, \
            "trigger_comment_notification function not found"
        
        # Check that it calls self._resolve_post_author_id(post)
        # Look for the pattern: post_author_id = self._resolve_post_author_id(post)
        assert 'self._resolve_post_author_id(post)' in content, \
            "trigger_comment_notification should call self._resolve_post_author_id(post)"
        
        # Verify the call is in trigger_comment_notification by checking the context
        # Find the position of the function and the call
        func_pos = content.find('async def trigger_comment_notification')
        call_pos = content.find('post_author_id = self._resolve_post_author_id(post)')
        
        # The call should appear after the function definition
        assert call_pos > func_pos, \
            "self._resolve_post_author_id should be called within trigger_comment_notification"
        
        # Verify there's no inline loop in the function (the function should delegate to the helper)
        # Check that the next function starts after the call
        next_func_pos = content.find('async def trigger_message_notification')
        assert func_pos < call_pos < next_func_pos, \
            "The call should be between trigger_comment_notification and next function"
        
        print("✅ FIX 1b: trigger_comment_notification calls self._resolve_post_author_id(post)")


class TestFix1_VideoCommentNotificationMetadata:
    """FIX 1: Comment on VIDEO post creates notification with media_type=video"""
    
    @pytest.fixture
    def two_users(self):
        """Create author and commenter users"""
        import uuid
        unique_id = uuid.uuid4().hex[:6]
        
        # Create author
        author_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_vidauthor_{unique_id}",
            "email": f"test_vidauthor_{unique_id}@test.com",
            "password": "TestPassword123!"
        })
        author_data = author_response.json() if author_response.status_code == 200 else {}
        
        # Create commenter
        commenter_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_vidcommenter_{unique_id}",
            "email": f"test_vidcommenter_{unique_id}@test.com",
            "password": "TestPassword123!"
        })
        commenter_data = commenter_response.json() if commenter_response.status_code == 200 else {}
        
        if not author_data.get("token") or not commenter_data.get("token"):
            pytest.skip("Could not create test users")
        
        yield {
            "author_id": author_data.get("user_id"),
            "author_token": author_data.get("token"),
            "commenter_id": commenter_data.get("user_id"),
            "commenter_token": commenter_data.get("token"),
            "unique_id": unique_id
        }
        
        # Cleanup
        db.users.delete_many({"username": {"$regex": f"test_vid.*{unique_id}"}})
    
    def test_comment_on_video_post_has_media_type_video(self, two_users):
        """FIX 1c: Comment on video post should create notification with media_type=video in metadata"""
        author_id = two_users["author_id"]
        commenter_token = two_users["commenter_token"]
        
        # Create VIDEO post via API (contains .mp4 URL)
        headers = {"Authorization": f"Bearer {two_users['author_token']}"}
        post_response = requests.post(f"{BASE_URL}/api/posts",
            headers=headers,
            json={
                "caption": "TEST_VIBER_video_post",
                "media_urls": ["https://test.cloudinary.com/video/upload/test_video.mp4"],
                "hashtags": ["test"]
            }
        )
        
        assert post_response.status_code in [200, 201], f"Post creation failed: {post_response.text}"
        post_id = post_response.json().get("id")
        
        # Clear previous notifications
        db.notifications.delete_many({"user_id": author_id, "type": "comment"})
        
        # Comment on the video post
        comment_headers = {"Authorization": f"Bearer {commenter_token}"}
        comment_response = requests.post(f"{BASE_URL}/api/comments",
            headers=comment_headers,
            json={
                "post_id": post_id,
                "text": "TEST_VIBER Great video!"
            }
        )
        
        assert comment_response.status_code in [200, 201], f"Comment failed: {comment_response.text}"
        
        # Wait for async notification
        import time
        time.sleep(1.5)
        
        # Check notification was created with media_type=video
        notification = db.notifications.find_one({
            "user_id": author_id,
            "type": "comment",
            "entity_id": post_id
        })
        
        assert notification is not None, "Comment notification should be created"
        metadata = notification.get("metadata", {})
        assert metadata.get("media_type") == "video", \
            f"metadata.media_type should be 'video', got '{metadata.get('media_type')}'"
        
        print(f"✅ FIX 1c: Comment on video post creates notification with media_type=video")
        print(f"   - Notification ID: {notification.get('_id')}")
        print(f"   - metadata.media_type: {metadata.get('media_type')}")
        
        # Cleanup
        db.posts.delete_one({"_id": ObjectId(post_id)})
        db.comments.delete_many({"post_id": post_id})
        db.notifications.delete_many({"entity_id": post_id})


class TestFix2_MigrationPriorityOrder:
    """FIX 2: _migrate_posts_author_id uses same priority: user_id > creator_id > owner_id"""
    
    def test_migration_function_priority_order(self):
        """FIX 2a: Verify migration for-loop uses user_id > creator_id > owner_id order"""
        with open('/app/backend/server.py', 'r') as f:
            content = f.read()
        
        # Check that _migrate_posts_author_id function exists
        assert 'async def _migrate_posts_author_id' in content, \
            "_migrate_posts_author_id function not found"
        
        # Check the for-loop ordering: user_id, creator_id, owner_id
        # Note: author_id is excluded because the query already filters for posts WITHOUT author_id
        assert 'for key in ("user_id", "creator_id", "owner_id")' in content, \
            "Migration should loop over (user_id, creator_id, owner_id) in that order"
        
        print("✅ FIX 2a: _migrate_posts_author_id uses priority: user_id > creator_id > owner_id")
    
    def test_helper_and_migration_have_matching_priority(self):
        """FIX 2b: Both helper and migration should have consistent priority order"""
        with open('/app/backend/server.py', 'r') as f:
            server_content = f.read()
        
        with open('/app/backend/notifications.py', 'r') as f:
            notif_content = f.read()
        
        # Check helper in notifications.py: author_id > user_id > creator_id > owner_id
        helper_pattern = r'for key in \("author_id", "user_id", "creator_id", "owner_id"\)'
        assert re.search(helper_pattern, notif_content), \
            "_resolve_post_author_id should have author_id > user_id > creator_id > owner_id"
        
        # Check migration in server.py: user_id > creator_id > owner_id
        # (author_id excluded because query filters for posts without author_id)
        migration_pattern = r'for key in \("user_id", "creator_id", "owner_id"\)'
        assert re.search(migration_pattern, server_content), \
            "_migrate_posts_author_id should have user_id > creator_id > owner_id"
        
        print("✅ FIX 2b: Helper and migration have matching priority (minus author_id for migration)")


class TestFix3_NonSelfVideoLike:
    """FIX 3: Non-self video like produces correct logs: liker != author"""
    
    @pytest.fixture
    def two_users_with_tokens(self):
        """Create author and liker users with device tokens for push"""
        import uuid
        unique_id = uuid.uuid4().hex[:6]
        
        # Create author
        author_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_likeauthor_{unique_id}",
            "email": f"test_likeauthor_{unique_id}@test.com",
            "password": "TestPassword123!"
        })
        author_data = author_response.json() if author_response.status_code == 200 else {}
        
        # Create liker (different user)
        liker_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_liker_{unique_id}",
            "email": f"test_liker_{unique_id}@test.com",
            "password": "TestPassword123!"
        })
        liker_data = liker_response.json() if liker_response.status_code == 200 else {}
        
        if not author_data.get("token") or not liker_data.get("token"):
            pytest.skip("Could not create test users")
        
        author_id = author_data.get("user_id")
        liker_id = liker_data.get("user_id")
        
        # Register device token for author (so push path shows tokens>0)
        headers = {"Authorization": f"Bearer {author_data['token']}"}
        requests.post(f"{BASE_URL}/api/notifications/device-token",
            headers=headers,
            json={
                "token": f"ExponentPushToken[TEST_{unique_id}_author]",
                "platform": "ios"
            }
        )
        
        yield {
            "author_id": author_id,
            "author_token": author_data.get("token"),
            "liker_id": liker_id,
            "liker_token": liker_data.get("token"),
            "unique_id": unique_id
        }
        
        # Cleanup
        db.users.delete_many({"username": {"$regex": f"test_like.*{unique_id}"}})
        db.device_tokens.delete_many({"token": {"$regex": f"TEST_{unique_id}"}})
    
    def test_non_self_like_creates_notification_with_different_actor_recipient(self, two_users_with_tokens):
        """FIX 3: Non-self video like - liker != author, notification actor != recipient"""
        author_id = two_users_with_tokens["author_id"]
        liker_id = two_users_with_tokens["liker_id"]
        liker_token = two_users_with_tokens["liker_token"]
        author_token = two_users_with_tokens["author_token"]
        
        # Verify liker and author are DIFFERENT
        assert liker_id != author_id, "Liker and author must be DIFFERENT users for this test"
        
        # Create VIDEO post
        headers = {"Authorization": f"Bearer {author_token}"}
        post_response = requests.post(f"{BASE_URL}/api/posts",
            headers=headers,
            json={
                "caption": "TEST_FIX3_video_for_like",
                "media_urls": ["https://test.cloudinary.com/video/upload/my_video.mp4"],
                "hashtags": ["test"]
            }
        )
        
        assert post_response.status_code in [200, 201], f"Post creation failed: {post_response.text}"
        post_id = post_response.json().get("id")
        
        # Clear previous notifications and push logs
        db.notifications.delete_many({"user_id": author_id, "type": "like"})
        db.push_send_log.delete_many({"user_id": author_id, "type": "like"})
        
        # Like the post as a DIFFERENT user
        like_headers = {"Authorization": f"Bearer {liker_token}"}
        like_response = requests.post(f"{BASE_URL}/api/posts/{post_id}/like", headers=like_headers)
        
        assert like_response.status_code == 200, f"Like failed: {like_response.text}"
        
        # Wait for async notification
        import time
        time.sleep(1.5)
        
        # Check notification was created
        notification = db.notifications.find_one({
            "user_id": author_id,
            "type": "like",
            "entity_id": post_id
        })
        
        assert notification is not None, "Like notification should be created for non-self like"
        
        # Verify actor (liker) is DIFFERENT from recipient (author)
        assert notification.get("actor_id") == liker_id, \
            f"actor_id should be liker ({liker_id}), got {notification.get('actor_id')}"
        assert notification.get("user_id") == author_id, \
            f"user_id (recipient) should be author ({author_id}), got {notification.get('user_id')}"
        assert notification.get("actor_id") != notification.get("user_id"), \
            "actor_id must be different from user_id (recipient)"
        
        print(f"✅ FIX 3: Non-self like creates notification with different actor/recipient")
        print(f"   - liker_id (actor): {liker_id[:12]}...")
        print(f"   - author_id (recipient): {author_id[:12]}...")
        print(f"   - actor != recipient: {notification.get('actor_id') != notification.get('user_id')}")
        
        # Cleanup
        db.posts.delete_one({"_id": ObjectId(post_id)})
        db.likes.delete_many({"post_id": post_id})
        db.notifications.delete_many({"entity_id": post_id})
    
    def test_self_like_skipped(self, two_users_with_tokens):
        """FIX 3 (regression): Self-like should NOT create notification"""
        author_id = two_users_with_tokens["author_id"]
        author_token = two_users_with_tokens["author_token"]
        
        # Create post
        headers = {"Authorization": f"Bearer {author_token}"}
        post_response = requests.post(f"{BASE_URL}/api/posts",
            headers=headers,
            json={
                "caption": "TEST_FIX3_self_like_test",
                "media_urls": ["https://test.cloudinary.com/video/upload/selflike.mp4"],
                "hashtags": ["test"]
            }
        )
        
        assert post_response.status_code in [200, 201], f"Post creation failed: {post_response.text}"
        post_id = post_response.json().get("id")
        
        # Clear previous notifications
        db.notifications.delete_many({"user_id": author_id, "type": "like"})
        
        # Like own post (self-like)
        like_response = requests.post(f"{BASE_URL}/api/posts/{post_id}/like", headers=headers)
        
        assert like_response.status_code == 200, f"Like failed: {like_response.text}"
        
        # Wait
        import time
        time.sleep(1)
        
        # Check NO notification was created
        notification = db.notifications.find_one({
            "user_id": author_id,
            "type": "like",
            "entity_id": post_id
        })
        
        assert notification is None, "Self-like should NOT create notification"
        
        print("✅ FIX 3 (regression): Self-like correctly skipped - no notification created")
        
        # Cleanup
        db.posts.delete_one({"_id": ObjectId(post_id)})
        db.likes.delete_many({"post_id": post_id})


class TestFix4_NotifCreatedLogFormat:
    """FIX 4: NOTIF-CREATED log includes id, type, entity_id, recipient, actor, media_type"""
    
    def test_notif_created_log_format_in_code(self):
        """FIX 4a: Verify NOTIF-CREATED log format includes all required fields"""
        with open('/app/backend/notifications.py', 'r') as f:
            content = f.read()
        
        # Check for NOTIF-CREATED log line
        assert 'NOTIF-CREATED' in content, "NOTIF-CREATED log should exist"
        
        # Check that log includes required fields (checking the f-string pattern)
        assert 'NOTIF-CREATED: id=' in content, "NOTIF-CREATED log should include id="
        assert 'type=' in content, "NOTIF-CREATED log should include type="
        assert 'entity_id=' in content, "NOTIF-CREATED log should include entity_id="
        assert 'recipient=' in content, "NOTIF-CREATED log should include recipient="
        assert 'actor=' in content, "NOTIF-CREATED log should include actor="
        assert 'media_type=' in content, "NOTIF-CREATED log should include media_type="
        
        print("✅ FIX 4a: NOTIF-CREATED log format includes all required fields")
    
    def test_media_type_read_from_metadata(self):
        """FIX 4b: media_type in NOTIF-CREATED should be read from metadata"""
        with open('/app/backend/notifications.py', 'r') as f:
            content = f.read()
        
        # Check that media_type is extracted from metadata
        assert 'media_type = (metadata or {}).get("media_type"' in content, \
            "media_type should be read from metadata dict"
        
        print("✅ FIX 4b: media_type is correctly read from metadata")


class TestFix4_LikeNotificationMediaType:
    """FIX 4: Like notification metadata includes media_type (both single-like and bundled)"""
    
    def test_single_like_path_includes_media_type(self):
        """FIX 4c: Single-like notification metadata includes media_type"""
        with open('/app/backend/notifications.py', 'r') as f:
            content = f.read()
        
        # Find single-like create_notification call (around line 1185-1198)
        # This is in the else branch of "if recent_likes >= 3"
        # Look for metadata with media_type in single-like path
        single_like_pattern = r'# Single like.*?metadata=\{[^}]*"media_type":\s*media_type'
        assert re.search(single_like_pattern, content, re.DOTALL), \
            "Single-like notification should include media_type in metadata"
        
        print("✅ FIX 4c: Single-like path includes media_type in metadata")
    
    def test_bundled_like_path_includes_media_type(self):
        """FIX 4d: Bundled-like notification metadata includes media_type"""
        with open('/app/backend/notifications.py', 'r') as f:
            content = f.read()
        
        # Find bundled notification create_notification call
        # This is in the "if recent_likes >= 3" branch
        bundled_pattern = r'# Create new bundled notification.*?metadata=\{[^}]*"media_type":\s*media_type'
        assert re.search(bundled_pattern, content, re.DOTALL), \
            "Bundled-like notification should include media_type in metadata"
        
        print("✅ FIX 4d: Bundled-like path includes media_type in metadata")


class TestFix4_CommentNotificationMediaType:
    """FIX 4: Comment notification metadata includes media_type"""
    
    def test_comment_notification_includes_media_type(self):
        """FIX 4e: Comment notification metadata includes media_type"""
        with open('/app/backend/notifications.py', 'r') as f:
            content = f.read()
        
        # Check that trigger_comment_notification exists
        assert 'async def trigger_comment_notification' in content, \
            "trigger_comment_notification function not found"
        
        # Find the section between trigger_comment_notification and trigger_message_notification
        func_start = content.find('async def trigger_comment_notification')
        func_end = content.find('async def trigger_message_notification')
        
        func_body = content[func_start:func_end]
        
        # Check that metadata includes media_type
        assert '"media_type":' in func_body, \
            "trigger_comment_notification should include media_type in metadata"
        
        print("✅ FIX 4e: Comment notification includes media_type in metadata")


class TestRegression_ImagePostLike:
    """REGRESSION: Image post like still creates notification correctly (media_type=image)"""
    
    @pytest.fixture
    def two_users(self):
        """Create author and liker users"""
        import uuid
        unique_id = uuid.uuid4().hex[:6]
        
        author_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_imgauthor_{unique_id}",
            "email": f"test_imgauthor_{unique_id}@test.com",
            "password": "TestPassword123!"
        })
        author_data = author_response.json() if author_response.status_code == 200 else {}
        
        liker_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_imgliker_{unique_id}",
            "email": f"test_imgliker_{unique_id}@test.com",
            "password": "TestPassword123!"
        })
        liker_data = liker_response.json() if liker_response.status_code == 200 else {}
        
        if not author_data.get("token") or not liker_data.get("token"):
            pytest.skip("Could not create test users")
        
        yield {
            "author_id": author_data.get("user_id"),
            "author_token": author_data.get("token"),
            "liker_id": liker_data.get("user_id"),
            "liker_token": liker_data.get("token"),
            "unique_id": unique_id
        }
        
        # Cleanup
        db.users.delete_many({"username": {"$regex": f"test_img.*{unique_id}"}})
    
    def test_image_post_like_has_media_type_image(self, two_users):
        """REGRESSION: Image post like should create notification with media_type=image"""
        author_id = two_users["author_id"]
        liker_token = two_users["liker_token"]
        author_token = two_users["author_token"]
        
        # Create IMAGE post (non-video URL)
        headers = {"Authorization": f"Bearer {author_token}"}
        post_response = requests.post(f"{BASE_URL}/api/posts",
            headers=headers,
            json={
                "caption": "TEST_REGRESSION_image_post",
                "media_urls": ["https://test.cloudinary.com/image/upload/test_image.jpg"],
                "hashtags": ["test"]
            }
        )
        
        assert post_response.status_code in [200, 201], f"Post creation failed: {post_response.text}"
        post_id = post_response.json().get("id")
        
        # Clear previous notifications
        db.notifications.delete_many({"user_id": author_id, "type": "like"})
        
        # Like as different user
        like_headers = {"Authorization": f"Bearer {liker_token}"}
        like_response = requests.post(f"{BASE_URL}/api/posts/{post_id}/like", headers=like_headers)
        
        assert like_response.status_code == 200, f"Like failed: {like_response.text}"
        
        import time
        time.sleep(1.5)
        
        # Check notification
        notification = db.notifications.find_one({
            "user_id": author_id,
            "type": "like",
            "entity_id": post_id
        })
        
        assert notification is not None, "Like notification should be created"
        metadata = notification.get("metadata", {})
        assert metadata.get("media_type") == "image", \
            f"metadata.media_type should be 'image', got '{metadata.get('media_type')}'"
        
        print("✅ REGRESSION: Image post like creates notification with media_type=image")
        
        # Cleanup
        db.posts.delete_one({"_id": ObjectId(post_id)})
        db.likes.delete_many({"post_id": post_id})
        db.notifications.delete_many({"entity_id": post_id})


class TestIntegration_VideoLikeFullFlow:
    """Integration: Full flow for video post like with NOTIF-CREATED verification"""
    
    @pytest.fixture
    def two_users_with_tokens(self):
        """Create two users, register device token for author"""
        import uuid
        unique_id = uuid.uuid4().hex[:6]
        
        author_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_fullauthor_{unique_id}",
            "email": f"test_fullauthor_{unique_id}@test.com",
            "password": "TestPassword123!"
        })
        author_data = author_response.json() if author_response.status_code == 200 else {}
        
        liker_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": f"test_fullliker_{unique_id}",
            "email": f"test_fullliker_{unique_id}@test.com",
            "password": "TestPassword123!"
        })
        liker_data = liker_response.json() if liker_response.status_code == 200 else {}
        
        if not author_data.get("token") or not liker_data.get("token"):
            pytest.skip("Could not create test users")
        
        author_id = author_data.get("user_id")
        
        # Register device token for push path
        headers = {"Authorization": f"Bearer {author_data['token']}"}
        requests.post(f"{BASE_URL}/api/notifications/device-token",
            headers=headers,
            json={
                "token": f"ExponentPushToken[TEST_FULL_{unique_id}]",
                "platform": "ios"
            }
        )
        
        yield {
            "author_id": author_id,
            "author_token": author_data.get("token"),
            "liker_id": liker_data.get("user_id"),
            "liker_token": liker_data.get("token"),
            "unique_id": unique_id
        }
        
        # Cleanup
        db.users.delete_many({"username": {"$regex": f"test_full.*{unique_id}"}})
        db.device_tokens.delete_many({"token": {"$regex": f"TEST_FULL_{unique_id}"}})
    
    def test_video_like_full_flow(self, two_users_with_tokens):
        """Integration: Video like creates notification with media_type=video, actor != recipient"""
        author_id = two_users_with_tokens["author_id"]
        liker_id = two_users_with_tokens["liker_id"]
        author_token = two_users_with_tokens["author_token"]
        liker_token = two_users_with_tokens["liker_token"]
        
        # Create VIDEO post
        headers = {"Authorization": f"Bearer {author_token}"}
        post_response = requests.post(f"{BASE_URL}/api/posts",
            headers=headers,
            json={
                "caption": "TEST_FULL_FLOW_video",
                "media_urls": ["https://test.cloudinary.com/video/upload/full_flow.mp4"],
                "hashtags": ["test"]
            }
        )
        
        assert post_response.status_code in [200, 201], f"Post creation failed: {post_response.text}"
        post_id = post_response.json().get("id")
        
        # Clear
        db.notifications.delete_many({"user_id": author_id})
        
        # Like as different user
        like_headers = {"Authorization": f"Bearer {liker_token}"}
        like_response = requests.post(f"{BASE_URL}/api/posts/{post_id}/like", headers=like_headers)
        
        assert like_response.status_code == 200, f"Like failed: {like_response.text}"
        
        import time
        time.sleep(2)
        
        # Verify notification
        notification = db.notifications.find_one({
            "user_id": author_id,
            "type": "like",
            "entity_id": post_id
        })
        
        assert notification is not None, "Notification should be created"
        
        # All FIX 3/4 verifications
        assert notification.get("actor_id") == liker_id, "actor should be liker"
        assert notification.get("user_id") == author_id, "recipient should be author"
        assert notification.get("actor_id") != notification.get("user_id"), "actor != recipient"
        
        metadata = notification.get("metadata", {})
        assert metadata.get("media_type") == "video", f"media_type should be 'video', got '{metadata.get('media_type')}'"
        
        print("✅ INTEGRATION: Video like full flow verified")
        print(f"   - actor (liker): {liker_id[:12]}...")
        print(f"   - recipient (author): {author_id[:12]}...")
        print(f"   - media_type: {metadata.get('media_type')}")
        print(f"   - actor != recipient: True")
        
        # Cleanup
        db.posts.delete_one({"_id": ObjectId(post_id)})
        db.likes.delete_many({"post_id": post_id})
        db.notifications.delete_many({"entity_id": post_id})


# Cleanup helper
def cleanup_test_data():
    """Clean up TEST_ prefixed data"""
    db.posts.delete_many({"caption": {"$regex": "^TEST_"}})
    db.users.delete_many({"username": {"$regex": "^test_"}})
    db.comments.delete_many({"text": {"$regex": "^TEST_"}})
    db.notifications.delete_many({})
    db.device_tokens.delete_many({"token": {"$regex": "TEST_"}})


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
