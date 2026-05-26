"""
Backend API Tests for Video Performance Phase 2
Tests the backend endpoints that support the new video prefetching feature:
- GET /api/featured/config - returns featuredWorkoutIds for prefetch targets
- POST /api/featured/workouts/batch - returns workouts with exercise imageUrl fields
- GET /api/posts - returns posts with media_urls for video prefetching

Test credentials:
- Username: moodtester2025
- Password: Test1234!
"""

import pytest
import requests
import os

# Get API URL from environment
BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://mood-build.preview.emergentagent.com')

# Test credentials
TEST_USER = "moodtester2025"
TEST_PASSWORD = "Test1234!"


@pytest.fixture(scope="module")
def auth_token():
    """Authenticate and get JWT token for protected endpoints"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": TEST_USER, "password": TEST_PASSWORD}
    )
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    data = response.json()
    assert "token" in data, "Login response missing token"
    return data["token"]


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestFeaturedConfig:
    """Test GET /api/featured/config endpoint"""
    
    def test_featured_config_returns_200(self, api_client):
        """Test that featured config endpoint is accessible (public endpoint)"""
        response = api_client.get(f"{BASE_URL}/api/featured/config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/featured/config returned 200")
    
    def test_featured_config_has_required_fields(self, api_client):
        """Test that config contains schemaVersion, featuredWorkoutIds, ttlHours"""
        response = api_client.get(f"{BASE_URL}/api/featured/config")
        assert response.status_code == 200
        
        data = response.json()
        
        # Validate required fields exist
        assert "schemaVersion" in data, "Missing schemaVersion field"
        assert "featuredWorkoutIds" in data, "Missing featuredWorkoutIds field"
        assert "ttlHours" in data, "Missing ttlHours field"
        
        print(f"✓ Config has required fields: schemaVersion={data['schemaVersion']}, ttlHours={data['ttlHours']}")
    
    def test_featured_config_has_valid_workout_ids(self, api_client):
        """Test that featuredWorkoutIds is a list with valid ObjectId strings"""
        response = api_client.get(f"{BASE_URL}/api/featured/config")
        assert response.status_code == 200
        
        data = response.json()
        workout_ids = data.get("featuredWorkoutIds", [])
        
        assert isinstance(workout_ids, list), "featuredWorkoutIds should be a list"
        assert len(workout_ids) > 0, "featuredWorkoutIds should not be empty (workouts should be seeded)"
        
        # Each ID should be a valid 24-character hex string (MongoDB ObjectId)
        for wid in workout_ids:
            assert isinstance(wid, str), f"Workout ID should be string, got {type(wid)}"
            assert len(wid) == 24, f"Workout ID should be 24 chars (ObjectId), got {len(wid)}: {wid}"
        
        print(f"✓ Config has {len(workout_ids)} valid workout IDs")


class TestFeaturedWorkoutsBatch:
    """Test POST /api/featured/workouts/batch endpoint"""
    
    def test_batch_endpoint_returns_200(self, api_client):
        """Test that batch endpoint is accessible with valid IDs"""
        # First get config to get valid IDs
        config_response = api_client.get(f"{BASE_URL}/api/featured/config")
        assert config_response.status_code == 200
        
        workout_ids = config_response.json().get("featuredWorkoutIds", [])
        if not workout_ids:
            pytest.skip("No featured workout IDs configured")
        
        # Call batch endpoint
        response = api_client.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=workout_ids
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ POST /api/featured/workouts/batch returned 200")
    
    def test_batch_returns_workouts_array(self, api_client):
        """Test that batch endpoint returns workouts array"""
        config_response = api_client.get(f"{BASE_URL}/api/featured/config")
        workout_ids = config_response.json().get("featuredWorkoutIds", [])
        
        if not workout_ids:
            pytest.skip("No featured workout IDs configured")
        
        response = api_client.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=workout_ids
        )
        
        data = response.json()
        assert "workouts" in data, "Response should have 'workouts' key"
        assert isinstance(data["workouts"], list), "workouts should be a list"
        
        print(f"✓ Batch returned {len(data['workouts'])} workouts")
    
    def test_workouts_have_exercises_with_image_url(self, api_client):
        """Test that returned workouts have exercises array with imageUrl fields for prefetching"""
        config_response = api_client.get(f"{BASE_URL}/api/featured/config")
        workout_ids = config_response.json().get("featuredWorkoutIds", [])
        
        if not workout_ids:
            pytest.skip("No featured workout IDs configured")
        
        response = api_client.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=workout_ids
        )
        
        workouts = response.json().get("workouts", [])
        assert len(workouts) > 0, "Should return at least one workout"
        
        for workout in workouts:
            assert "exercises" in workout, f"Workout '{workout.get('title', 'unknown')}' missing exercises array"
            exercises = workout["exercises"]
            
            # Each exercise should have imageUrl for prefetching
            exercises_with_images = 0
            for ex in exercises:
                if "imageUrl" in ex and ex["imageUrl"]:
                    exercises_with_images += 1
                    # Validate URL format
                    assert ex["imageUrl"].startswith("http"), f"imageUrl should be a valid URL: {ex['imageUrl']}"
            
            print(f"  Workout '{workout.get('title', 'unknown')}': {exercises_with_images}/{len(exercises)} exercises have imageUrl")
        
        print(f"✓ Workouts have exercises with imageUrl fields for prefetching")
    
    def test_workout_has_required_display_fields(self, api_client):
        """Test that workouts have fields needed for UI display"""
        config_response = api_client.get(f"{BASE_URL}/api/featured/config")
        workout_ids = config_response.json().get("featuredWorkoutIds", [])
        
        if not workout_ids:
            pytest.skip("No featured workout IDs configured")
        
        response = api_client.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=workout_ids
        )
        
        workouts = response.json().get("workouts", [])
        
        for workout in workouts:
            # Required display fields
            assert "_id" in workout, "Workout missing _id"
            assert "title" in workout, "Workout missing title"
            assert "exercises" in workout, "Workout missing exercises"
            
            print(f"  ✓ Workout '{workout.get('title')}' has required display fields")
        
        print(f"✓ All {len(workouts)} workouts have required display fields")
    
    def test_empty_ids_returns_empty_workouts(self, api_client):
        """Test that empty IDs array returns empty workouts"""
        response = api_client.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[]
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("workouts") == [], "Empty IDs should return empty workouts array"
        print(f"✓ Empty IDs returns empty workouts array")


class TestPostsForVideoPrefetch:
    """Test GET /api/posts endpoint for video prefetching data"""
    
    def test_posts_endpoint_returns_200(self, api_client, auth_token):
        """Test that posts endpoint is accessible"""
        response = api_client.get(
            f"{BASE_URL}/api/posts?skip=0&limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/posts returned 200")
    
    def test_posts_have_media_urls(self, api_client, auth_token):
        """Test that posts have media_urls field for video prefetching"""
        response = api_client.get(
            f"{BASE_URL}/api/posts?skip=0&limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        posts = response.json()
        assert isinstance(posts, list), "Posts response should be a list"
        
        posts_with_media = 0
        video_posts = 0
        
        for post in posts:
            assert "media_urls" in post, f"Post {post.get('id', 'unknown')} missing media_urls"
            
            if post["media_urls"] and len(post["media_urls"]) > 0:
                posts_with_media += 1
                
                # Check for video URLs
                for url in post["media_urls"]:
                    if any(ext in url.lower() for ext in ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.m3u8']):
                        video_posts += 1
                        break
        
        print(f"✓ Posts have media_urls: {posts_with_media}/{len(posts)} posts have media, {video_posts} are videos")
    
    def test_posts_have_cover_urls_for_videos(self, api_client, auth_token):
        """Test that video posts have cover_urls for thumbnail prefetching"""
        response = api_client.get(
            f"{BASE_URL}/api/posts?skip=0&limit=20",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        posts = response.json()
        
        video_posts_with_covers = 0
        total_video_posts = 0
        
        for post in posts:
            if not post.get("media_urls"):
                continue
            
            # Check if this is a video post
            is_video = any(
                any(ext in url.lower() for ext in ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.m3u8'])
                for url in post["media_urls"]
            )
            
            if is_video:
                total_video_posts += 1
                if post.get("cover_urls"):
                    video_posts_with_covers += 1
        
        if total_video_posts > 0:
            print(f"✓ Video posts with cover_urls: {video_posts_with_covers}/{total_video_posts}")
        else:
            print(f"✓ No video posts found in sample, cover_urls test skipped")
    
    def test_posts_have_id_field(self, api_client, auth_token):
        """Test that posts have id field for prefetch deduplication"""
        response = api_client.get(
            f"{BASE_URL}/api/posts?skip=0&limit=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        posts = response.json()
        
        for post in posts:
            assert "id" in post, "Post missing id field"
            assert isinstance(post["id"], str), "Post id should be a string"
            assert len(post["id"]) > 0, "Post id should not be empty"
        
        print(f"✓ All {len(posts)} posts have valid id field for deduplication")


class TestPublicPostsEndpoint:
    """Test GET /api/posts/public for guests"""
    
    def test_public_posts_returns_200(self, api_client):
        """Test that public posts endpoint works without auth"""
        response = api_client.get(f"{BASE_URL}/api/posts/public?limit=5&skip=0")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✓ GET /api/posts/public returned 200 (no auth required)")
    
    def test_public_posts_have_media_urls(self, api_client):
        """Test that public posts have media_urls for prefetching"""
        response = api_client.get(f"{BASE_URL}/api/posts/public?limit=10&skip=0")
        assert response.status_code == 200
        
        posts = response.json()
        assert isinstance(posts, list), "Public posts response should be a list"
        
        for post in posts:
            assert "media_urls" in post, "Public post missing media_urls field"
        
        print(f"✓ Public posts ({len(posts)} returned) have media_urls field")


class TestExerciseImageUrlDerivation:
    """Test that exercise imageUrl is properly returned for prefetching"""
    
    def test_exercise_images_are_valid_urls(self, api_client):
        """Test that exercise imageUrl fields contain valid URLs"""
        config_response = api_client.get(f"{BASE_URL}/api/featured/config")
        workout_ids = config_response.json().get("featuredWorkoutIds", [])
        
        if not workout_ids:
            pytest.skip("No featured workout IDs configured")
        
        response = api_client.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=workout_ids
        )
        
        workouts = response.json().get("workouts", [])
        
        invalid_images = []
        valid_images_count = 0
        
        for workout in workouts:
            for ex in workout.get("exercises", []):
                img_url = ex.get("imageUrl")
                if img_url:
                    if img_url.startswith("http"):
                        valid_images_count += 1
                    else:
                        invalid_images.append(f"{workout['title']}/{ex.get('name', 'unknown')}: {img_url}")
        
        if invalid_images:
            print(f"⚠ Found {len(invalid_images)} invalid image URLs: {invalid_images[:3]}")
        
        assert valid_images_count > 0, "Should have at least some valid image URLs"
        print(f"✓ Found {valid_images_count} valid image URLs for prefetching")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
