"""
Test file for caption missing field fix and featured bundle endpoint.

Bug Fixes Tested:
1. GET /api/posts/public - returns posts even when posts have missing caption fields (not 500 error)
2. GET /api/posts/public - returns posts with caption field (can be empty string)
3. GET /api/featured/bundle - returns combined config + workouts in one response
4. GET /api/featured/bundle - config contains featuredWorkoutIds array and ttlHours
5. GET /api/featured/bundle - workouts array has correct workout data with exercises
6. GET /api/posts (authenticated) - also handles missing caption fields gracefully
"""

import pytest
import requests
import os
import jwt
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/backend/.env')

BASE_URL = os.environ.get('EXPO_PUBLIC_BACKEND_URL', 'https://free-tier-limit-2.preview.emergentagent.com').rstrip('/')
JWT_SECRET = os.environ.get('JWT_SECRET')

# Test user credentials
TEST_USER_ID = "68ae7db61794544c0d5de8a3"  # moodtester2025


def generate_token(user_id: str) -> str:
    """Generate a JWT token for testing"""
    return jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.now(timezone.utc) + timedelta(hours=24),
            "iat": datetime.now(timezone.utc)
        },
        JWT_SECRET,
        algorithm='HS256'
    )


@pytest.fixture
def auth_token():
    """Generate auth token for authenticated tests"""
    return generate_token(TEST_USER_ID)


@pytest.fixture
def auth_headers(auth_token):
    """Headers with authorization token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestPublicPostsEndpoint:
    """Tests for GET /api/posts/public - caption field handling fix"""
    
    def test_public_posts_returns_200(self):
        """Public posts endpoint should return 200, not 500 error"""
        response = requests.get(f"{BASE_URL}/api/posts/public?limit=5")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ GET /api/posts/public returns 200")
    
    def test_public_posts_returns_list(self):
        """Public posts should return a list of posts"""
        response = requests.get(f"{BASE_URL}/api/posts/public?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✅ GET /api/posts/public returns list with {len(data)} posts")
    
    def test_public_posts_have_caption_field(self):
        """All posts should have caption field (even if empty string)"""
        response = requests.get(f"{BASE_URL}/api/posts/public?limit=10")
        
        assert response.status_code == 200
        posts = response.json()
        
        for i, post in enumerate(posts):
            assert "caption" in post, f"Post {i} missing caption field"
            assert isinstance(post["caption"], str), f"Post {i} caption should be string, got {type(post['caption'])}"
        
        print(f"✅ All {len(posts)} posts have caption field as string")
    
    def test_public_posts_have_required_fields(self):
        """Posts should have all required fields in response"""
        response = requests.get(f"{BASE_URL}/api/posts/public?limit=5")
        
        assert response.status_code == 200
        posts = response.json()
        
        required_fields = ["id", "author", "caption", "media_urls", "likes_count", "comments_count", "created_at"]
        
        for i, post in enumerate(posts):
            for field in required_fields:
                assert field in post, f"Post {i} missing required field: {field}"
        
        print(f"✅ All posts have required fields: {required_fields}")
    
    def test_public_posts_guests_cannot_like_or_save(self):
        """Guest users should see is_liked and is_saved as False"""
        response = requests.get(f"{BASE_URL}/api/posts/public?limit=5")
        
        assert response.status_code == 200
        posts = response.json()
        
        for i, post in enumerate(posts):
            assert post.get("is_liked") == False, f"Post {i} is_liked should be False for guests"
            assert post.get("is_saved") == False, f"Post {i} is_saved should be False for guests"
        
        print(f"✅ All posts correctly show is_liked=False, is_saved=False for guests")


class TestAuthenticatedPostsEndpoint:
    """Tests for GET /api/posts (authenticated) - caption field handling fix"""
    
    def test_authenticated_posts_returns_200(self, auth_headers):
        """Authenticated posts endpoint should return 200"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=5", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ GET /api/posts (authenticated) returns 200")
    
    def test_authenticated_posts_have_caption_field(self, auth_headers):
        """All authenticated posts should have caption field"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=10", headers=auth_headers)
        
        assert response.status_code == 200
        posts = response.json()
        
        for i, post in enumerate(posts):
            assert "caption" in post, f"Post {i} missing caption field"
            assert isinstance(post["caption"], str), f"Post {i} caption should be string"
        
        print(f"✅ All {len(posts)} authenticated posts have caption field")
    
    def test_authenticated_posts_returns_list(self, auth_headers):
        """Authenticated posts should return a list"""
        response = requests.get(f"{BASE_URL}/api/posts?limit=5", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), f"Expected list, got {type(data)}"
        print(f"✅ Authenticated posts returns list with {len(data)} posts")


class TestFeaturedBundleEndpoint:
    """Tests for GET /api/featured/bundle - combined config + workouts endpoint"""
    
    def test_bundle_returns_200(self):
        """Featured bundle should return 200 (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"✅ GET /api/featured/bundle returns 200")
    
    def test_bundle_has_config_and_workouts(self):
        """Bundle response should have config and workouts keys"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "config" in data, "Bundle missing 'config' key"
        assert "workouts" in data, "Bundle missing 'workouts' key"
        
        print(f"✅ Bundle has 'config' and 'workouts' keys")
    
    def test_bundle_config_has_required_fields(self):
        """Config should contain featuredWorkoutIds array and ttlHours"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        config = data["config"]
        
        # Check schemaVersion
        assert "schemaVersion" in config, "Config missing schemaVersion"
        assert isinstance(config["schemaVersion"], int), "schemaVersion should be int"
        
        # Check featuredWorkoutIds
        assert "featuredWorkoutIds" in config, "Config missing featuredWorkoutIds"
        assert isinstance(config["featuredWorkoutIds"], list), "featuredWorkoutIds should be list"
        
        # Check ttlHours
        assert "ttlHours" in config, "Config missing ttlHours"
        assert isinstance(config["ttlHours"], int), "ttlHours should be int"
        
        print(f"✅ Config has schemaVersion={config['schemaVersion']}, featuredWorkoutIds (count={len(config['featuredWorkoutIds'])}), ttlHours={config['ttlHours']}")
    
    def test_bundle_workouts_is_list(self):
        """Workouts should be a list"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data["workouts"], list), f"Workouts should be list, got {type(data['workouts'])}"
        print(f"✅ Workouts is a list with {len(data['workouts'])} items")
    
    def test_bundle_workouts_have_required_fields(self):
        """Each workout should have required fields"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        workouts = data["workouts"]
        
        if len(workouts) == 0:
            pytest.skip("No workouts in bundle to test")
        
        required_workout_fields = ["_id", "title", "exercises"]
        
        for i, workout in enumerate(workouts):
            for field in required_workout_fields:
                assert field in workout, f"Workout {i} missing required field: {field}"
            
            # Verify exercises is a list
            assert isinstance(workout["exercises"], list), f"Workout {i} exercises should be list"
        
        print(f"✅ All {len(workouts)} workouts have required fields: {required_workout_fields}")
    
    def test_bundle_workouts_have_exercises_with_data(self):
        """Workouts should have exercises with proper data"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        workouts = data["workouts"]
        
        if len(workouts) == 0:
            pytest.skip("No workouts in bundle to test")
        
        total_exercises = 0
        for i, workout in enumerate(workouts):
            exercises = workout.get("exercises", [])
            total_exercises += len(exercises)
            
            if len(exercises) > 0:
                # Check first exercise has basic fields
                first_exercise = exercises[0]
                assert "name" in first_exercise, f"Workout {i} first exercise missing 'name'"
        
        assert total_exercises > 0, "No exercises found in any workout"
        print(f"✅ Bundle workouts contain total of {total_exercises} exercises")
    
    def test_bundle_workout_ids_match_config(self):
        """Workout IDs in response should match config featuredWorkoutIds"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        
        config_ids = set(data["config"]["featuredWorkoutIds"])
        workout_ids = set(w["_id"] for w in data["workouts"])
        
        # All returned workout IDs should be in config
        assert workout_ids.issubset(config_ids), f"Some workout IDs not in config: {workout_ids - config_ids}"
        
        print(f"✅ All {len(workout_ids)} returned workout IDs match config")
    
    def test_bundle_workouts_order_matches_config(self):
        """Workouts should be returned in same order as config featuredWorkoutIds"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        
        config_ids = data["config"]["featuredWorkoutIds"]
        workout_ids = [w["_id"] for w in data["workouts"]]
        
        # Filter config_ids to only those that are in workout_ids (in case some are missing)
        expected_order = [id for id in config_ids if id in workout_ids]
        
        assert workout_ids == expected_order, f"Workout order doesn't match config. Expected: {expected_order}, Got: {workout_ids}"
        
        print(f"✅ Workouts are in correct order as per config")


class TestBundleEliminatesWaterfall:
    """Tests to verify bundle eliminates the config→batch waterfall"""
    
    def test_bundle_is_single_request(self):
        """Bundle endpoint should return all data in one request (no waterfall)"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify we get both config AND workouts in single response
        assert "config" in data, "Missing config in bundle"
        assert "workouts" in data, "Missing workouts in bundle"
        
        # Verify config has the IDs
        assert len(data["config"]["featuredWorkoutIds"]) > 0, "Config has no workout IDs"
        
        # Verify workouts are populated (not empty when IDs exist)
        if len(data["config"]["featuredWorkoutIds"]) > 0:
            assert len(data["workouts"]) > 0, "Workouts not populated despite IDs in config"
        
        print(f"✅ Single request returns config with {len(data['config']['featuredWorkoutIds'])} IDs and {len(data['workouts'])} fully-hydrated workouts")
    
    def test_bundle_workouts_are_fully_hydrated(self):
        """Workouts in bundle should be fully hydrated with exercise data"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["workouts"]) == 0:
            pytest.skip("No workouts to test hydration")
        
        # Check that workouts have actual exercise data, not just IDs
        for i, workout in enumerate(data["workouts"]):
            exercises = workout.get("exercises", [])
            if len(exercises) > 0:
                # Exercises should have name, not just exerciseId
                first_ex = exercises[0]
                assert "name" in first_ex, f"Workout {i} exercises not fully hydrated (missing 'name')"
        
        print(f"✅ Workouts are fully hydrated with exercise data (no additional requests needed)")


class TestCaptionEdgeCases:
    """Test edge cases for caption field handling"""
    
    def test_public_posts_handles_empty_caption(self):
        """Empty caption string should be returned correctly"""
        response = requests.get(f"{BASE_URL}/api/posts/public?limit=20")
        
        assert response.status_code == 200
        posts = response.json()
        
        # Check that captions are strings (empty string is valid)
        for post in posts:
            caption = post.get("caption")
            assert caption is not None, f"Caption is None for post {post.get('id')}"
            assert isinstance(caption, str), f"Caption is not string for post {post.get('id')}"
        
        # Count empty vs non-empty captions
        empty_count = sum(1 for p in posts if p["caption"] == "")
        non_empty_count = sum(1 for p in posts if p["caption"] != "")
        
        print(f"✅ Caption handling: {non_empty_count} with text, {empty_count} empty strings (both are valid)")
    
    def test_public_posts_pagination(self):
        """Pagination should work correctly"""
        # Get first page
        response1 = requests.get(f"{BASE_URL}/api/posts/public?limit=3&skip=0")
        assert response1.status_code == 200
        posts1 = response1.json()
        
        # Get second page
        response2 = requests.get(f"{BASE_URL}/api/posts/public?limit=3&skip=3")
        assert response2.status_code == 200
        posts2 = response2.json()
        
        # Pages should be different (if enough posts exist)
        if len(posts1) > 0 and len(posts2) > 0:
            assert posts1[0]["id"] != posts2[0]["id"], "Pagination not working - same posts returned"
            print(f"✅ Pagination works: page 1 starts with {posts1[0]['id'][:8]}..., page 2 starts with {posts2[0]['id'][:8]}...")
        else:
            print(f"✅ Pagination works (not enough posts to verify different pages)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
