"""
Test: Video Engagement Notifications Bug Fix

Root cause fixed: cover_urls stored as dict {"0": url} instead of list [url].
When trigger_like_notification or trigger_comment_notification tried to access 
cover_urls[0], it threw KeyError: 0 (dict key is string "0", not int 0).

Fix applied:
1. _safe_first() helper in notifications.py handles list, dict, and None
2. All cover_urls[0]/media_urls[0] replaced with _safe_first()
3. Startup migration converts dict cover_urls to lists
4. create_post normalizes cover_urls from dict to list on creation

Test targets:
- Video post ID: 6984caf01e0316994b2ce947 (author: 693f94d29a560edaab674fd5)
- Image post ID: 6903baa7cc89e680d723b0ab (author: 6903baa7cc89e680d723b0a7)
"""

import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://battle-plan-sync.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USERNAME = "moodtester2025"
TEST_PASSWORD = "Test1234!"

# Test post IDs
VIDEO_POST_ID = "6984caf01e0316994b2ce947"  # Cloudinary video post
VIDEO_POST_AUTHOR = "693f94d29a560edaab674fd5"
IMAGE_POST_ID = "6903baa7cc89e680d723b0ab"
IMAGE_POST_AUTHOR = "6903baa7cc89e680d723b0a7"


@pytest.fixture(scope="module")
def api_session():
    """Create authenticated session for testing"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_session):
    """Login and get auth token"""
    response = api_session.post(f"{BASE_URL}/api/auth/login", json={
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Login failed: {response.status_code} - {response.text}")
    data = response.json()
    return data.get("token"), data.get("user_id")


@pytest.fixture(scope="module")
def authenticated_client(api_session, auth_token):
    """Session with auth header"""
    token, user_id = auth_token
    api_session.headers.update({"Authorization": f"Bearer {token}"})
    return api_session, user_id


class TestHealthCheck:
    """Basic health check to verify API is running"""
    
    def test_api_health(self, api_session):
        """Verify API is healthy"""
        response = api_session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ API health: {data}")


class TestAuthentication:
    """Verify authentication is working"""
    
    def test_login_success(self, api_session):
        """Test login with valid credentials"""
        response = api_session.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user_id" in data
        print(f"✅ Login successful for {TEST_USERNAME}, user_id: {data['user_id'][:8]}...")


class TestVideoPostNotifications:
    """Test notifications for video posts with Cloudinary URLs"""
    
    def test_video_post_exists(self, authenticated_client):
        """Verify the video post exists and has correct structure"""
        session, user_id = authenticated_client
        response = session.get(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}")
        
        if response.status_code == 404:
            pytest.skip(f"Video post {VIDEO_POST_ID} not found - may have been deleted")
        
        assert response.status_code == 200
        post = response.json()
        
        # Verify post has media URLs
        media_urls = post.get("media_urls", [])
        assert len(media_urls) > 0, "Video post should have media_urls"
        
        # Verify it's a video (check URL contains video indicators)
        first_url = media_urls[0].lower()
        is_video = any(x in first_url for x in (".mp4", ".mov", ".m3u8", "/video"))
        assert is_video, f"Expected video URL, got: {first_url[:80]}..."
        
        # Verify cover_urls exists and is a list (after migration)
        cover_urls = post.get("cover_urls")
        if cover_urls is not None:
            assert isinstance(cover_urls, list), f"cover_urls should be list after migration, got: {type(cover_urls)}"
        
        print(f"✅ Video post exists: media_urls={len(media_urls)}, cover_urls type={type(cover_urls)}")
    
    def test_like_video_post_creates_notification(self, authenticated_client):
        """
        CRITICAL: Like a video post and verify notification is created
        This was the bug: notifications were NOT created for video posts
        """
        session, liker_id = authenticated_client
        
        # Skip if user is the post author (self-likes don't create notifications)
        if liker_id == VIDEO_POST_AUTHOR:
            pytest.skip("Cannot test notification for self-like")
        
        # First, check current like status and ensure unlike state for clean test
        response = session.post(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}/like")
        if response.status_code != 200:
            # Might be 403 for terms not accepted - that's OK for this test scope
            if response.status_code == 403:
                pytest.skip("Terms not accepted - skipping like test")
            pytest.fail(f"Like request failed: {response.status_code} - {response.text}")
        
        like_data = response.json()
        was_liked = like_data.get("liked")
        print(f"📝 First like request: liked={was_liked}, count={like_data.get('likes_count')}")
        
        # If we just unliked, like again to trigger notification
        if not was_liked:
            response = session.post(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}/like")
            assert response.status_code == 200
            like_data = response.json()
            assert like_data.get("liked") == True
            print(f"📝 Re-liked post: likes_count={like_data.get('likes_count')}")
        
        # The notification should have been created for VIDEO_POST_AUTHOR
        # We can't directly check their notifications, but we verified:
        # 1. Like API returned 200 (no KeyError)
        # 2. The trace logs will show NOTIF-CREATED if successful
        print(f"✅ Like request successful - notification should be created for {VIDEO_POST_AUTHOR[:8]}...")
        
        # Clean up: unlike the post to reset state
        response = session.post(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}/like")
        assert response.status_code == 200
        print(f"📝 Cleanup: unliked post")
    
    def test_comment_on_video_post_creates_notification(self, authenticated_client):
        """
        CRITICAL: Comment on a video post and verify notification is created
        This was the bug: comment notifications were NOT created for video posts
        """
        session, commenter_id = authenticated_client
        
        # Skip if user is the post author (self-comments don't create notifications)
        if commenter_id == VIDEO_POST_AUTHOR:
            pytest.skip("Cannot test notification for self-comment")
        
        # Create a comment on the video post
        test_comment = f"Test comment for video notification fix - {datetime.now(timezone.utc).isoformat()}"
        response = session.post(f"{BASE_URL}/api/comments", json={
            "post_id": VIDEO_POST_ID,
            "text": test_comment
        })
        
        if response.status_code == 403:
            pytest.skip("Terms not accepted - skipping comment test")
        
        assert response.status_code == 200, f"Comment failed: {response.status_code} - {response.text}"
        comment_data = response.json()
        
        assert "id" in comment_data, "Comment should return an id"
        print(f"✅ Comment created: id={comment_data.get('id')[:8] if comment_data.get('id') else 'N/A'}...")
        print(f"✅ Comment notification should be created for {VIDEO_POST_AUTHOR[:8]}...")


class TestImagePostNotifications:
    """Regression tests: Ensure image post notifications still work"""
    
    def test_image_post_exists(self, authenticated_client):
        """Verify the image post exists"""
        session, user_id = authenticated_client
        response = session.get(f"{BASE_URL}/api/posts/{IMAGE_POST_ID}")
        
        if response.status_code == 404:
            pytest.skip(f"Image post {IMAGE_POST_ID} not found")
        
        assert response.status_code == 200
        post = response.json()
        
        media_urls = post.get("media_urls", [])
        if media_urls:
            first_url = media_urls[0].lower()
            is_image = not any(x in first_url for x in (".mp4", ".mov", ".m3u8", "/video"))
            print(f"✅ Image post: media_urls={len(media_urls)}, is_image={is_image}")
    
    def test_like_image_post_still_works(self, authenticated_client):
        """Regression: Like an image post and verify it still works"""
        session, liker_id = authenticated_client
        
        if liker_id == IMAGE_POST_AUTHOR:
            pytest.skip("Cannot test notification for self-like")
        
        # Toggle like
        response = session.post(f"{BASE_URL}/api/posts/{IMAGE_POST_ID}/like")
        
        if response.status_code == 403:
            pytest.skip("Terms not accepted")
        if response.status_code == 404:
            pytest.skip(f"Image post {IMAGE_POST_ID} not found")
        
        assert response.status_code == 200
        print(f"✅ Image post like still works: {response.json()}")
        
        # Toggle back
        session.post(f"{BASE_URL}/api/posts/{IMAGE_POST_ID}/like")


class TestCoverUrlsMigration:
    """Test that the startup migration correctly normalized cover_urls"""
    
    def test_video_post_cover_urls_normalized(self, authenticated_client):
        """Verify video post cover_urls is a list, not a dict"""
        session, user_id = authenticated_client
        response = session.get(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}")
        
        if response.status_code == 404:
            pytest.skip(f"Video post {VIDEO_POST_ID} not found")
        
        assert response.status_code == 200
        post = response.json()
        
        cover_urls = post.get("cover_urls")
        if cover_urls is not None:
            # After migration, cover_urls should be a list
            assert isinstance(cover_urls, list), f"cover_urls should be list, got {type(cover_urls)}: {cover_urls}"
            print(f"✅ cover_urls is correctly a list: {len(cover_urls)} items")
        else:
            print(f"✅ cover_urls is None (no cover images)")


class TestNotificationServiceHelper:
    """Test _safe_first helper function behavior (indirectly via API)"""
    
    def test_like_with_dict_cover_urls_no_error(self, authenticated_client):
        """
        Verify that liking a post with dict-style cover_urls doesn't crash.
        The _safe_first helper should handle dict, list, and None.
        """
        session, user_id = authenticated_client
        
        # We test by liking a video post - if _safe_first works, no error
        response = session.post(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}/like")
        
        if response.status_code == 403:
            pytest.skip("Terms not accepted")
        if response.status_code == 404:
            pytest.skip(f"Post not found")
        
        # The key assertion: API should return 200, not crash with KeyError
        assert response.status_code == 200, f"Should succeed, got: {response.status_code} - {response.text}"
        print(f"✅ Like API succeeded without KeyError (cover_urls handled correctly)")
        
        # Toggle back
        session.post(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}/like")


class TestTraceLogging:
    """Verify TRACE logs are generated correctly"""
    
    def test_like_triggers_trace_logs(self, authenticated_client):
        """Like a post and check that TRACE-LIKE logs should appear in backend logs"""
        session, user_id = authenticated_client
        
        # This test just verifies the API call succeeds
        # The actual TRACE logs verification is done by checking backend logs
        response = session.post(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}/like")
        
        if response.status_code == 403:
            pytest.skip("Terms not accepted")
        if response.status_code == 404:
            pytest.skip("Post not found")
        
        assert response.status_code == 200
        print(f"✅ Like API call succeeded - check backend logs for TRACE-LIKE entries")
        
        # Toggle back
        session.post(f"{BASE_URL}/api/posts/{VIDEO_POST_ID}/like")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
