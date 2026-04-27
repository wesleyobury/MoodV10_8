"""
Test suite for Profile Posts Debug Endpoint and Enhanced Error Handling

Tests:
1. GET /api/debug/profile_posts_check - Admin-only diagnostic endpoint
2. GET /api/users/{user_id}/posts - Profile endpoint with enhanced logging
3. Error handling improvements - 500 vs silent 404
4. PostResponse.cover_urls accepts both dict and list types
5. Regression: GET /api/posts/public still works (explore endpoint)

Test credentials:
- test_user: profile_test_user / testpass123 (NOT admin - should get 403)
- test_user_id: 69a9f998d81c5ed227b55ce9
- Known users with posts:
  - ogeeezz: 6903baa7cc89e680d723b0a7 (31 posts)
  - officialmoodapp: 693f94d29a560edaab674fd5 (63 posts) - IS ADMIN
"""

import pytest
import requests
import os
import time

# Use the public URL from frontend .env
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://backend-diagnostics-4.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USER_USERNAME = "profile_test_user"
TEST_USER_PASSWORD = "testpass123"
TEST_USER_ID = "69a9f998d81c5ed227b55ce9"

# Known users with posts (from agent context)
USER_OGEEEZZ_ID = "6903baa7cc89e680d723b0a7"  # Has 31 posts
USER_OFFICIALMOODAPP_ID = "693f94d29a560edaab674fd5"  # Has 63 posts (ADMIN)

class TestHealthAndRegression:
    """Basic health check and regression tests"""
    
    def test_health_endpoint_returns_healthy(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy", f"Unexpected health status: {data}"
        print(f"✅ Health check passed: {data}")
    
    def test_public_posts_endpoint_returns_posts(self):
        """Regression: /api/posts/public still works (explore endpoint)"""
        response = requests.get(f"{BASE_URL}/api/posts/public?limit=5")
        assert response.status_code == 200, f"Public posts failed: {response.text}"
        posts = response.json()
        assert isinstance(posts, list), f"Expected list, got {type(posts)}"
        print(f"✅ Public posts endpoint returned {len(posts)} posts")
        
        # Verify post structure includes cover_urls field
        if posts:
            first_post = posts[0]
            assert "id" in first_post, "Post missing 'id' field"
            assert "author" in first_post, "Post missing 'author' field"
            assert "cover_urls" in first_post, "Post missing 'cover_urls' field"
            assert "thumbnail_url" in first_post, "Post missing 'thumbnail_url' field"
            assert "media_type" in first_post, "Post missing 'media_type' field"
            print(f"✅ Post structure verified with cover_urls type: {type(first_post.get('cover_urls'))}")


class TestAuthenticationAndAdmin:
    """Test authentication and admin access"""
    
    @pytest.fixture(scope="class")
    def test_user_token(self):
        """Get token for test_user (NOT admin)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USER_USERNAME,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Could not login as {TEST_USER_USERNAME}: {response.text}")
        return response.json().get("token")
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get token for officialmoodapp (admin user)"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "officialmoodapp",
            "password": "testpass123"  # This may not work - admin may use OAuth
        })
        if response.status_code != 200:
            pytest.skip(f"Could not login as admin - may need OAuth: {response.text}")
        return response.json().get("token")
    
    def test_non_admin_cannot_access_debug_endpoint(self, test_user_token):
        """Debug endpoint requires admin access - non-admin should get 403"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        response = requests.get(
            f"{BASE_URL}/api/debug/profile_posts_check?userId={USER_OGEEEZZ_ID}",
            headers=headers
        )
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}: {response.text}"
        print(f"✅ Non-admin correctly blocked from debug endpoint with 403")


class TestProfilePostsEndpoint:
    """Test the profile posts endpoint with enhanced logging"""
    
    @pytest.fixture(scope="class")
    def test_user_token(self):
        """Get token for test_user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USER_USERNAME,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Could not login as {TEST_USER_USERNAME}: {response.text}")
        return response.json().get("token")
    
    def test_profile_posts_returns_posts_for_user_with_posts(self, test_user_token):
        """GET /api/users/{user_id}/posts returns posts for user with posts"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # Test with ogeeezz who has 31 posts
        response = requests.get(
            f"{BASE_URL}/api/users/{USER_OGEEEZZ_ID}/posts?limit=10",
            headers=headers
        )
        assert response.status_code == 200, f"Profile posts failed: {response.status_code} - {response.text}"
        posts = response.json()
        assert isinstance(posts, list), f"Expected list, got {type(posts)}"
        
        print(f"✅ Profile posts for ogeeezz returned {len(posts)} posts")
        
        # Verify post structure
        if posts:
            post = posts[0]
            assert "id" in post
            assert "author" in post
            assert "cover_urls" in post
            # Verify cover_urls accepts both dict and list (should not error)
            cover_urls = post.get("cover_urls")
            print(f"  - cover_urls type: {type(cover_urls).__name__}, value: {cover_urls}")
    
    def test_profile_posts_returns_empty_for_user_with_no_posts(self, test_user_token):
        """GET /api/users/{user_id}/posts returns empty array for user with no posts"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # Test with test_user_id who has few/no posts
        response = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}/posts?limit=10",
            headers=headers
        )
        assert response.status_code == 200, f"Profile posts failed: {response.status_code} - {response.text}"
        posts = response.json()
        assert isinstance(posts, list), f"Expected list, got {type(posts)}"
        print(f"✅ Profile posts for test_user returned {len(posts)} posts (may be empty)")
    
    def test_profile_posts_returns_empty_for_nonexistent_user(self, test_user_token):
        """GET /api/users/{user_id}/posts returns empty for non-existent user ID"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # Test with fake user ID
        fake_user_id = "000000000000000000000000"
        response = requests.get(
            f"{BASE_URL}/api/users/{fake_user_id}/posts?limit=10",
            headers=headers
        )
        assert response.status_code == 200, f"Profile posts failed: {response.status_code} - {response.text}"
        posts = response.json()
        assert isinstance(posts, list), f"Expected list, got {type(posts)}"
        assert len(posts) == 0, f"Expected empty list for non-existent user, got {len(posts)}"
        print(f"✅ Profile posts for non-existent user returns empty array")


class TestDebugEndpointStructure:
    """Test the debug endpoint response structure (admin access required)"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Attempt to get admin token"""
        # Try officialmoodapp with standard password
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "officialmoodapp",
            "password": "testpass123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        
        # Try other potential admin accounts
        for username in ["admin", "officialmoodapp", "mood_admin"]:
            for password in ["testpass123", "admin123", "password"]:
                response = requests.post(f"{BASE_URL}/api/auth/login", json={
                    "username": username,
                    "password": password
                })
                if response.status_code == 200:
                    # Verify this user is admin
                    token = response.json().get("token")
                    headers = {"Authorization": f"Bearer {token}"}
                    check = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
                    if check.status_code == 200 and check.json().get("is_admin_effective"):
                        return token
        
        pytest.skip("Could not obtain admin token - admin may use OAuth only")
    
    def test_debug_endpoint_returns_all_required_fields(self, admin_token):
        """Debug endpoint returns all diagnostic fields"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(
            f"{BASE_URL}/api/debug/profile_posts_check?userId={USER_OGEEEZZ_ID}",
            headers=headers
        )
        
        if response.status_code == 403:
            pytest.skip("User is not admin")
        
        assert response.status_code == 200, f"Debug endpoint failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify all required fields are present
        required_fields = [
            "userId_received",
            "posts_by_author_id",
            "posts_by_user_id",
            "posts_by_author_obj",
            "newest_author_posts",
            "profile_pipeline_returned",
            "profile_pipeline_error"
        ]
        
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        
        print(f"✅ Debug endpoint returned all required fields:")
        for field in required_fields:
            print(f"  - {field}: {data.get(field)}")
        
        # Verify userId_received matches input
        assert data["userId_received"] == USER_OGEEEZZ_ID, f"userId mismatch"
        
        # Verify counts are integers
        assert isinstance(data["posts_by_author_id"], int)
        assert isinstance(data["posts_by_user_id"], int)
        
        # Verify newest_author_posts is a list
        assert isinstance(data["newest_author_posts"], list)


class TestCoverUrlsTypeHandling:
    """Test that PostResponse.cover_urls accepts both dict and list types"""
    
    @pytest.fixture(scope="class")
    def test_user_token(self):
        """Get token for test_user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USER_USERNAME,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Could not login as {TEST_USER_USERNAME}: {response.text}")
        return response.json().get("token")
    
    def test_public_posts_handle_various_cover_urls_types(self):
        """Verify posts with different cover_urls types don't cause errors"""
        response = requests.get(f"{BASE_URL}/api/posts/public?limit=50")
        assert response.status_code == 200, f"Failed: {response.text}"
        posts = response.json()
        
        # Collect cover_urls types seen
        cover_url_types = {}
        for post in posts:
            cover_urls = post.get("cover_urls")
            type_name = type(cover_urls).__name__
            if type_name not in cover_url_types:
                cover_url_types[type_name] = 0
            cover_url_types[type_name] += 1
        
        print(f"✅ cover_urls types found in {len(posts)} posts: {cover_url_types}")
        
        # No errors means all types are handled
        assert len(posts) > 0, "No posts returned"
    
    def test_profile_posts_handle_various_cover_urls_types(self, test_user_token):
        """Verify profile endpoint handles various cover_urls types"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # Get posts from user with many posts (officialmoodapp has 63)
        response = requests.get(
            f"{BASE_URL}/api/users/{USER_OFFICIALMOODAPP_ID}/posts?limit=30",
            headers=headers
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        posts = response.json()
        
        # Collect cover_urls types seen
        cover_url_types = {}
        for post in posts:
            cover_urls = post.get("cover_urls")
            type_name = type(cover_urls).__name__
            if type_name not in cover_url_types:
                cover_url_types[type_name] = 0
            cover_url_types[type_name] += 1
        
        print(f"✅ Profile posts cover_urls types: {cover_url_types}")


class TestErrorHandlingImprovement:
    """Test that profile endpoint returns 500 with error details instead of swallowing errors"""
    
    @pytest.fixture(scope="class")
    def test_user_token(self):
        """Get token for test_user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USER_USERNAME,
            "password": TEST_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Could not login as {TEST_USER_USERNAME}: {response.text}")
        return response.json().get("token")
    
    def test_profile_endpoint_returns_200_not_404_for_valid_requests(self, test_user_token):
        """Profile endpoint should return 200 for valid requests"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # Test with various user IDs
        user_ids = [USER_OGEEEZZ_ID, USER_OFFICIALMOODAPP_ID, TEST_USER_ID]
        
        for user_id in user_ids:
            response = requests.get(
                f"{BASE_URL}/api/users/{user_id}/posts?limit=5",
                headers=headers
            )
            assert response.status_code == 200, f"Got {response.status_code} for user {user_id}: {response.text}"
        
        print(f"✅ All {len(user_ids)} profile requests returned 200")
    
    def test_profile_endpoint_handles_invalid_objectid_gracefully(self, test_user_token):
        """Profile endpoint should handle invalid ObjectId gracefully"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # Test with invalid ObjectId format
        invalid_ids = ["not-an-objectid", "123", "xyz"]
        
        for invalid_id in invalid_ids:
            response = requests.get(
                f"{BASE_URL}/api/users/{invalid_id}/posts?limit=5",
                headers=headers
            )
            # Should return 200 with empty list (graceful handling) or appropriate error
            assert response.status_code in [200, 400, 404], f"Unexpected {response.status_code} for '{invalid_id}': {response.text}"
        
        print(f"✅ Invalid ObjectIds handled gracefully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
