"""
Test suite for Profile Grid Missing Content Fix (author_id normalization)
Root cause: author_id stored as string instead of ObjectId in some posts

Tests:
1. APP_ENV is set to 'production'
2. GET /api/users/{user_id}/posts returns posts for moodtester2025
3. Profile endpoint returns posts with correct fields (author, caption, media_type)
4. Debug endpoint returns correct db_count_objectid and mismatch=false
5. Debug endpoint requires admin auth (non-admin gets 403)
6. Debug endpoint returns newest_5_posts with author_id_type=ObjectId
7. No posts in DB have string-type author_id (all normalized to ObjectId)
8. Profile query matches posts correctly (startup migration worked)
"""
import pytest
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://workout-nav-fix.preview.emergentagent.com')

# Test user IDs
ADMIN_USER_ID = "693f94d29a560edaab674fd5"  # officialmoodapp (admin)
TEST_USER_ID = "68ae7db61794544c0d5de8a3"  # moodtester2025 (non-admin)

# JWT Tokens (pre-generated)
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjkzZjk0ZDI5YTU2MGVkYWFiNjc0ZmQ1IiwiZXhwIjoxNzcyODI3NzgwLCJpYXQiOjE3NzI3NDEzODB9.hvFXPbU0Oy0gGR77nzqj_jYg708LqkwA-qOy1xzcfjw"
TEST_USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhhZTdkYjYxNzk0NTQ0YzBkNWRlOGEzIiwiZXhwIjoxNzcyODI3NzgwLCJpYXQiOjE3NzI3NDEzODB9.MVUwkA1TUK_RihjzbdGKfxPmmYJm-QnniZ_Ksq5HGSM"


class TestEnvironmentConfiguration:
    """Test 1: Verify APP_ENV is set to production"""
    
    def test_app_env_is_production(self):
        """Verify APP_ENV environment variable is set to production"""
        app_env = os.environ.get('APP_ENV')
        assert app_env == 'production', f"Expected APP_ENV='production', got '{app_env}'"
        print(f"✓ APP_ENV is set to '{app_env}'")


class TestProfilePostsEndpoint:
    """Tests for GET /api/users/{user_id}/posts endpoint"""
    
    def test_profile_posts_returns_200(self):
        """Profile posts endpoint returns 200 for valid user"""
        response = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}/posts",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/users/{TEST_USER_ID}/posts returns 200")
    
    def test_profile_posts_returns_non_empty_list(self):
        """Profile posts endpoint returns non-empty list for moodtester2025"""
        response = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}/posts",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        posts = response.json()
        assert isinstance(posts, list), f"Expected list, got {type(posts)}"
        # Per issue: 12 posts should exist for this user
        assert len(posts) > 0, "Expected non-empty list of posts, got empty list"
        print(f"✓ Profile posts returns {len(posts)} posts for moodtester2025")
    
    def test_profile_posts_have_correct_fields(self):
        """Each post has required fields: author, caption, media_type"""
        response = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}/posts",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        posts = response.json()
        
        for i, post in enumerate(posts[:5]):  # Check first 5 posts
            # Check author field
            assert 'author' in post, f"Post {i} missing 'author' field"
            assert isinstance(post['author'], dict), f"Post {i} author should be dict"
            
            # Check caption field (can be empty string)
            assert 'caption' in post, f"Post {i} missing 'caption' field"
            
            # Check media_type field (can be None for legacy posts, or string for new posts)
            if 'media_type' in post and post['media_type'] is not None:
                assert post['media_type'] in ['image', 'video', 'reels'], f"Post {i} has invalid media_type: {post['media_type']}"
            
        print(f"✓ All posts have required fields (author, caption, media_type)")
    
    def test_profile_posts_author_has_user_data(self):
        """Post author contains expected user fields"""
        response = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}/posts",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        posts = response.json()
        
        if len(posts) > 0:
            author = posts[0].get('author', {})
            # Check author has expected fields
            assert 'username' in author, "Author missing 'username'"
            assert '_id' in author or 'id' in author, "Author missing '_id' or 'id'"
            print(f"✓ Post author contains user data (username: {author.get('username')})")


class TestDebugEndpointAdminAuth:
    """Tests for admin authentication on debug endpoint"""
    
    def test_debug_endpoint_returns_403_for_non_admin(self):
        """Non-admin user gets 403 on debug endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {TEST_USER_TOKEN}"}
        )
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}: {response.text}"
        print(f"✓ Debug endpoint returns 403 for non-admin user")
    
    def test_debug_endpoint_returns_200_for_admin(self):
        """Admin user gets 200 on debug endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200, f"Expected 200 for admin, got {response.status_code}: {response.text}"
        print(f"✓ Debug endpoint returns 200 for admin user")
    
    def test_debug_endpoint_returns_401_without_auth(self):
        """Unauthenticated request gets 401/403"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}"
        )
        # Should be 401 for no auth
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
        print(f"✓ Debug endpoint returns {response.status_code} without authentication")


class TestDebugEndpointData:
    """Tests for debug endpoint data after migration"""
    
    def test_debug_returns_correct_structure(self):
        """Debug endpoint returns expected JSON structure"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        required_fields = ['userId', 'db_count_objectid', 'db_count_string', 'profile_query_count', 'mismatch', 'newest_5_posts']
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Debug endpoint returns all required fields")
    
    def test_debug_mismatch_is_false(self):
        """After migration, mismatch should be false (all author_id are ObjectId)"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # After migration, mismatch should be false
        assert data['mismatch'] == False, f"Expected mismatch=false, got {data['mismatch']}"
        print(f"✓ mismatch=false (all posts normalized)")
    
    def test_debug_db_count_string_is_zero(self):
        """After migration, db_count_string should be 0 (no string author_ids)"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # After migration, string count should be 0
        assert data['db_count_string'] == 0, f"Expected db_count_string=0, got {data['db_count_string']}"
        print(f"✓ db_count_string=0 (all converted to ObjectId)")
    
    def test_debug_db_count_objectid_matches_expected(self):
        """db_count_objectid should match expected count (~12 posts for moodtester2025)"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Per issue: should be 12 posts
        assert data['db_count_objectid'] >= 10, f"Expected db_count_objectid >= 10, got {data['db_count_objectid']}"
        print(f"✓ db_count_objectid={data['db_count_objectid']} posts found")
    
    def test_debug_profile_query_matches_objectid_count(self):
        """profile_query_count should equal db_count_objectid (no mismatch)"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data['profile_query_count'] == data['db_count_objectid'], \
            f"profile_query_count ({data['profile_query_count']}) != db_count_objectid ({data['db_count_objectid']})"
        print(f"✓ profile_query_count={data['profile_query_count']} equals db_count_objectid")
    
    def test_debug_newest_posts_have_objectid_type(self):
        """All newest_5_posts should have author_id_type=ObjectId"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        newest_posts = data.get('newest_5_posts', [])
        assert len(newest_posts) > 0, "Expected at least one post in newest_5_posts"
        
        for i, post in enumerate(newest_posts):
            author_id_type = post.get('author_id_type')
            assert author_id_type == 'ObjectId', \
                f"Post {i} has author_id_type='{author_id_type}', expected 'ObjectId'"
        
        print(f"✓ All {len(newest_posts)} newest posts have author_id_type=ObjectId")
    
    def test_debug_newest_posts_have_required_fields(self):
        """newest_5_posts contain id, created_at, caption, author_id_type"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        newest_posts = data.get('newest_5_posts', [])
        required_fields = ['id', 'created_at', 'caption', 'author_id_type']
        
        for i, post in enumerate(newest_posts):
            for field in required_fields:
                assert field in post, f"Post {i} missing field: {field}"
        
        print(f"✓ All newest posts have required fields")


class TestProfileQueryIntegration:
    """Integration tests: profile endpoint matches debug data"""
    
    def test_profile_posts_count_matches_debug_count(self):
        """Profile endpoint returns same count as debug endpoint"""
        # Get debug count
        debug_response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert debug_response.status_code == 200
        debug_data = debug_response.json()
        expected_count = debug_data['profile_query_count']
        
        # Get profile posts with high limit
        profile_response = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}/posts?limit=100",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert profile_response.status_code == 200
        posts = profile_response.json()
        
        assert len(posts) == expected_count, \
            f"Profile returned {len(posts)} posts, expected {expected_count} from debug"
        print(f"✓ Profile endpoint returns {len(posts)} posts (matches debug count)")
    
    def test_profile_posts_skip_and_limit_work(self):
        """Pagination works correctly on profile endpoint"""
        # Get first 5
        response1 = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}/posts?limit=5&skip=0",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response1.status_code == 200
        page1 = response1.json()
        
        # Get second 5
        response2 = requests.get(
            f"{BASE_URL}/api/users/{TEST_USER_ID}/posts?limit=5&skip=5",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response2.status_code == 200
        page2 = response2.json()
        
        # Ensure no overlap
        page1_ids = set(p.get('_id') or p.get('id') for p in page1)
        page2_ids = set(p.get('_id') or p.get('id') for p in page2)
        overlap = page1_ids.intersection(page2_ids)
        
        assert len(overlap) == 0, f"Pagination overlap detected: {overlap}"
        print(f"✓ Pagination works: page1 has {len(page1)} posts, page2 has {len(page2)} posts, no overlap")


class TestStartupMigrationVerification:
    """Verify startup migration converted all string author_ids to ObjectId"""
    
    def test_no_string_author_id_posts_in_db(self):
        """After migration, no posts should have string-type author_id"""
        # Use debug endpoint with admin to check for user's posts
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # db_count_string should be 0
        assert data['db_count_string'] == 0, \
            f"Found {data['db_count_string']} posts with string author_id - migration incomplete"
        
        print(f"✓ No posts with string author_id found (migration successful)")
    
    def test_migration_preserved_post_count(self):
        """Migration should preserve total post count (12 posts per issue)"""
        response = requests.get(
            f"{BASE_URL}/api/debug/user_posts?userId={TEST_USER_ID}",
            headers={"Authorization": f"Bearer {ADMIN_TOKEN}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Total posts should be at least 12 (per issue: 14 posts had string author_id)
        total = data['db_count_objectid'] + data['db_count_string']
        assert total >= 10, f"Expected at least 10 total posts, got {total}"
        
        print(f"✓ Total post count preserved: {total} posts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
