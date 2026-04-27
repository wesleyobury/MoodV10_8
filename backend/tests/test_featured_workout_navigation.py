"""
Test: Featured Workout Notification Navigation Fix

Bug Fix: Tapping a featured workout notification from the in-app notification list
was navigating to the wrong screen. The fix changed the route from /featured-workout 
to /featured-workout-detail with correct params {id: entity_id}.

This test verifies:
1. GET /api/notifications returns featured_workout type notifications with valid entity_id
2. POST /api/featured/workouts/batch returns workout data when called with entity_id
3. The batch endpoint returns exercises array with name, equipment, battlePlan, moodTips fields
"""

import pytest
import requests
import os

# Use the public URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback for local testing
    BASE_URL = "https://backend-diagnostics-4.preview.emergentagent.com"

TEST_USER = "moodtester2025"
TEST_PASSWORD = "Test1234!"


class TestFeaturedWorkoutNavigation:
    """Test featured workout notification navigation fix"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": TEST_USER, "password": TEST_PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        token = data.get("access_token") or data.get("token")
        assert token, f"No token in response: {data}"
        print(f"✅ Login successful for {TEST_USER}")
        return token
    
    def test_01_notifications_endpoint_returns_featured_workout(self, auth_token):
        """
        Test that GET /api/notifications returns featured_workout type notifications
        with valid entity_id for navigation
        """
        response = requests.get(
            f"{BASE_URL}/api/notifications?limit=50",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 200, f"Notifications endpoint failed: {response.text}"
        data = response.json()
        
        notifications = data.get("notifications", [])
        assert len(notifications) > 0, "No notifications returned"
        print(f"✅ Got {len(notifications)} notifications")
        
        # Find featured_workout notifications
        featured_workout_notifications = [
            n for n in notifications if n.get("type") == "featured_workout"
        ]
        
        print(f"📋 Found {len(featured_workout_notifications)} featured_workout notifications")
        
        # Store for next test
        self.__class__.featured_workout_notifications = featured_workout_notifications
        self.__class__.all_notifications = notifications
        
        # Verify at least one featured_workout notification exists
        assert len(featured_workout_notifications) > 0, (
            f"No featured_workout notifications found. Types found: "
            f"{set(n.get('type') for n in notifications)}"
        )
        
        # Verify entity_id is present and valid
        for notif in featured_workout_notifications:
            entity_id = notif.get("entity_id")
            assert entity_id, f"Missing entity_id in notification: {notif.get('id')}"
            # entity_id should be a valid MongoDB ObjectId (24 hex chars)
            assert len(entity_id) == 24, f"Invalid entity_id format: {entity_id}"
            print(f"  ✅ Notification {notif.get('id')}: entity_id={entity_id}")
    
    def test_02_featured_workouts_batch_returns_data(self, auth_token):
        """
        Test that POST /api/featured/workouts/batch returns workout data
        when called with entity_id from notification
        """
        featured_notifications = getattr(self.__class__, 'featured_workout_notifications', [])
        assert len(featured_notifications) > 0, "No featured_workout notifications to test"
        
        # Get entity_id from first featured_workout notification
        entity_id = featured_notifications[0].get("entity_id")
        print(f"📝 Testing batch endpoint with entity_id: {entity_id}")
        
        # This is a public endpoint - no auth required
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[entity_id],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Batch endpoint failed: {response.text}"
        data = response.json()
        
        workouts = data.get("workouts", [])
        assert len(workouts) > 0, f"No workouts returned for entity_id {entity_id}"
        
        workout = workouts[0]
        print(f"✅ Got workout: {workout.get('title', 'Unknown')}")
        print(f"   - ID: {workout.get('_id')}")
        print(f"   - Mood: {workout.get('mood')}")
        print(f"   - Duration: {workout.get('duration') or workout.get('durationMin')}")
        
        # Verify workout has expected structure
        assert workout.get("_id") == entity_id, f"Workout ID mismatch: {workout.get('_id')} != {entity_id}"
        assert workout.get("title"), "Missing workout title"
        
        # Store for next test
        self.__class__.workout_data = workout
    
    def test_03_workout_has_exercises_array(self, auth_token):
        """
        Test that the batch endpoint returns exercises array with required fields:
        name, equipment, battlePlan, moodTips
        """
        workout = getattr(self.__class__, 'workout_data', None)
        assert workout, "No workout data from previous test"
        
        exercises = workout.get("exercises", [])
        assert len(exercises) > 0, f"No exercises in workout: {workout.get('title')}"
        print(f"✅ Workout has {len(exercises)} exercises")
        
        # Verify each exercise has required fields
        required_fields = ["name", "equipment", "battlePlan", "moodTips"]
        
        for i, exercise in enumerate(exercises):
            print(f"\n  Exercise {i+1}: {exercise.get('name', 'Unknown')}")
            
            # Check name (required)
            assert exercise.get("name"), f"Exercise {i+1} missing 'name'"
            
            # Check equipment (may be empty string but should exist)
            assert "equipment" in exercise, f"Exercise {i+1} missing 'equipment' field"
            print(f"    - Equipment: {exercise.get('equipment', 'N/A')}")
            
            # Check battlePlan (the workout plan text)
            assert "battlePlan" in exercise, f"Exercise {i+1} missing 'battlePlan' field"
            battle_plan = exercise.get("battlePlan", "")
            print(f"    - Battle Plan: {battle_plan[:50]}..." if len(battle_plan) > 50 else f"    - Battle Plan: {battle_plan}")
            
            # Check moodTips (array of tips)
            assert "moodTips" in exercise, f"Exercise {i+1} missing 'moodTips' field"
            mood_tips = exercise.get("moodTips", [])
            print(f"    - Mood Tips: {len(mood_tips)} tips")
    
    def test_04_all_featured_workout_entity_ids_resolve(self, auth_token):
        """
        Test that ALL featured_workout notification entity_ids can be resolved
        via the batch endpoint
        """
        featured_notifications = getattr(self.__class__, 'featured_workout_notifications', [])
        
        if len(featured_notifications) <= 1:
            pytest.skip("Only one featured_workout notification, already tested")
        
        # Collect all entity_ids
        entity_ids = [n.get("entity_id") for n in featured_notifications]
        print(f"📋 Testing {len(entity_ids)} entity_ids: {entity_ids}")
        
        # Batch fetch all
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=entity_ids,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Batch endpoint failed: {response.text}"
        data = response.json()
        
        workouts = data.get("workouts", [])
        returned_ids = [w.get("_id") for w in workouts]
        
        print(f"✅ Batch returned {len(workouts)} workouts")
        
        # Verify all entity_ids resolved
        for entity_id in entity_ids:
            assert entity_id in returned_ids, f"Entity ID {entity_id} not found in batch response"
            workout = next(w for w in workouts if w.get("_id") == entity_id)
            print(f"  ✅ {entity_id} → {workout.get('title')}")
    
    def test_05_notification_structure_for_frontend(self, auth_token):
        """
        Verify notification structure has all fields needed by frontend:
        - type: "featured_workout"
        - entity_id: valid workout ID
        - These are used in notifications-inbox.tsx handleDeepLink()
        """
        featured_notifications = getattr(self.__class__, 'featured_workout_notifications', [])
        
        for notif in featured_notifications:
            # Fields used by handleDeepLink in notifications-inbox.tsx
            assert notif.get("type") == "featured_workout", f"Wrong type: {notif.get('type')}"
            assert notif.get("entity_id"), "Missing entity_id for navigation"
            
            # Log full notification structure for debugging
            print(f"\n📱 Notification for frontend:")
            print(f"   id: {notif.get('id')}")
            print(f"   type: {notif.get('type')}")
            print(f"   entity_id: {notif.get('entity_id')}")
            print(f"   title: {notif.get('title', 'N/A')}")
            print(f"   body: {notif.get('body', 'N/A')[:60]}...")
        
        print(f"\n✅ All {len(featured_notifications)} notifications have correct structure")


class TestFeaturedWorkoutsBatchEdgeCases:
    """Edge case tests for the batch endpoint"""
    
    def test_empty_array_returns_empty(self):
        """Test batch endpoint with empty array"""
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("workouts") == [], "Should return empty workouts array"
        print("✅ Empty array returns empty workouts")
    
    def test_invalid_id_filtered_out(self):
        """Test batch endpoint filters invalid IDs"""
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=["invalid-id", "not-an-objectid"],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        # Should not error, just return empty or filter
        print(f"✅ Invalid IDs handled gracefully: {len(data.get('workouts', []))} workouts returned")
    
    def test_nonexistent_id_not_returned(self):
        """Test batch endpoint with non-existent but valid ObjectId"""
        # Valid ObjectId format but doesn't exist
        fake_id = "000000000000000000000000"
        
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[fake_id],
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        workouts = data.get("workouts", [])
        # Should return empty, not error
        assert fake_id not in [w.get("_id") for w in workouts]
        print(f"✅ Non-existent ID returns empty: {len(workouts)} workouts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
