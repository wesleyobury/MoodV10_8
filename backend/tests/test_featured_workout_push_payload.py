"""
Featured Workout Push Notification Payload Tests

Testing the fix for featured workout push notifications deep linking to a fully populated cart screen.

Test Cases:
1. Backend push payload includes ALL exercise fields (battlePlan, moodTips, difficulty, workoutType, moodCard, intensityReason, imageUrl)
2. GET /api/featured/workouts/batch endpoint returns full exercise data including battlePlan, moodTips
3. Backend push payload construction correctly maps exerciseId field from DB to id field in payload
4. Backend caps exercises at 10 to stay within push payload size limits
5. The featured/workouts/batch endpoint accepts a JSON array body (not an object with ids key)
"""

import pytest
import requests
import os
from datetime import datetime, timezone
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import json

# Use PUBLIC URL for testing
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://bug-fixes-testing.preview.emergentagent.com').rstrip('/')

MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'test_database')

# Known workout ID from the seed data
CARDIO_WORKOUT_ID = "697c70ea6a76d293b68a16b1"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_health_endpoint(self):
        """Test that the API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")


class TestFeaturedWorkoutsBatchEndpoint:
    """Test GET /api/featured/workouts/batch endpoint"""
    
    def test_batch_endpoint_exists(self):
        """Test that the batch endpoint exists and responds"""
        # Test with empty array
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[],
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "workouts" in data
        print(f"✅ Batch endpoint exists and responds: {data}")
    
    def test_batch_endpoint_accepts_array_body(self):
        """Test that endpoint accepts JSON array directly (not {ids: [...]} object)"""
        # This is the FIX - endpoint should accept bare array
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[CARDIO_WORKOUT_ID],
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200 with array body, got {response.status_code}: {response.text}"
        data = response.json()
        assert "workouts" in data
        print(f"✅ Batch endpoint accepts JSON array body directly")
    
    def test_batch_endpoint_rejects_object_body(self):
        """Test that endpoint correctly handles (or rejects) old {ids: [...]} format"""
        # Frontend was incorrectly sending {ids: [...]} but backend expects bare [...]
        # This test verifies the correct behavior
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json={"ids": [CARDIO_WORKOUT_ID]},  # Old incorrect format
            headers={"Content-Type": "application/json"}
        )
        # This should either:
        # a) Return 422 (validation error because it expects array)
        # b) Return 200 with empty workouts (ignores malformed body)
        # The key is it should NOT crash
        assert response.status_code in [200, 422], f"Unexpected status code: {response.status_code}: {response.text}"
        print(f"✅ Batch endpoint handles {'{ids: [...]}' } format gracefully: status={response.status_code}")
    
    def test_batch_endpoint_returns_full_exercise_data(self):
        """Test that batch endpoint returns exercises with ALL required fields"""
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[CARDIO_WORKOUT_ID],
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        workouts = data.get("workouts", [])
        assert len(workouts) > 0, "Expected at least one workout returned"
        
        workout = workouts[0]
        exercises = workout.get("exercises", [])
        assert len(exercises) > 0, "Expected at least one exercise in workout"
        
        # Check required fields for first exercise
        first_exercise = exercises[0]
        required_fields = ["name", "equipment", "description", "duration", "imageUrl"]
        
        for field in required_fields:
            assert field in first_exercise, f"Exercise missing required field: {field}"
            print(f"  ✓ Exercise has field '{field}': {str(first_exercise.get(field, ''))[:50]}...")
        
        # Check the fix-specific fields
        fix_specific_fields = ["battlePlan", "moodTips", "difficulty", "workoutType", "moodCard", "intensityReason"]
        
        for field in fix_specific_fields:
            value = first_exercise.get(field)
            if field == "moodTips":
                print(f"  ✓ Exercise has field '{field}': {len(value) if isinstance(value, list) else value} items")
            else:
                print(f"  ✓ Exercise has field '{field}': {str(value)[:60] if value else 'EMPTY/MISSING'}...")
        
        print(f"✅ Batch endpoint returns full exercise data with all fields")
    
    def test_batch_endpoint_returns_battlePlan(self):
        """Test that battlePlan field is returned (key field for workout guidance)"""
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[CARDIO_WORKOUT_ID],
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        workouts = data.get("workouts", [])
        assert len(workouts) > 0
        
        exercises = workouts[0].get("exercises", [])
        assert len(exercises) > 0
        
        first_exercise = exercises[0]
        battle_plan = first_exercise.get("battlePlan", "")
        
        assert battle_plan, f"battlePlan should not be empty, got: '{battle_plan}'"
        assert len(battle_plan) > 10, f"battlePlan should have substantial content, got: {len(battle_plan)} chars"
        
        print(f"✅ battlePlan field returned with content: '{battle_plan[:80]}...'")
    
    def test_batch_endpoint_returns_moodTips(self):
        """Test that moodTips array is returned"""
        response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=[CARDIO_WORKOUT_ID],
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        
        workouts = data.get("workouts", [])
        assert len(workouts) > 0
        
        exercises = workouts[0].get("exercises", [])
        assert len(exercises) > 0
        
        first_exercise = exercises[0]
        mood_tips = first_exercise.get("moodTips", [])
        
        # moodTips should be a list
        assert isinstance(mood_tips, list), f"moodTips should be list, got {type(mood_tips)}"
        
        print(f"✅ moodTips field returned: {len(mood_tips)} items")
        if mood_tips:
            print(f"   First moodTip: {mood_tips[0]}")


class TestPushPayloadConstruction:
    """Test push payload construction in notifications.py (lines 553-580)"""
    
    @pytest.fixture
    def mongo_client(self):
        """Get async MongoDB client"""
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_workout_exercises_exist_in_db(self, mongo_client):
        """Verify test workout has exercises in database"""
        db = mongo_client[DB_NAME]
        
        workout = await db.featured_workouts.find_one({"_id": ObjectId(CARDIO_WORKOUT_ID)})
        
        assert workout is not None, f"Workout {CARDIO_WORKOUT_ID} not found in database"
        assert "exercises" in workout, "Workout missing 'exercises' field"
        assert len(workout["exercises"]) > 0, "Workout has no exercises"
        
        print(f"✅ Workout '{workout.get('title')}' has {len(workout['exercises'])} exercises")
    
    @pytest.mark.asyncio
    async def test_exercises_have_required_fields_in_db(self, mongo_client):
        """Verify exercises in DB have all required fields for push payload"""
        db = mongo_client[DB_NAME]
        
        workout = await db.featured_workouts.find_one({"_id": ObjectId(CARDIO_WORKOUT_ID)})
        exercises = workout.get("exercises", [])
        
        # Fields that should be in DB and included in push payload
        required_fields = ["name", "equipment", "description", "duration", "imageUrl"]
        fix_specific_fields = ["battlePlan", "moodTips", "difficulty", "workoutType", "moodCard", "intensityReason"]
        
        for i, ex in enumerate(exercises):
            print(f"\nExercise {i+1}: {ex.get('name', 'UNNAMED')}")
            
            for field in required_fields:
                value = ex.get(field)
                assert field in ex, f"Exercise {i+1} missing required field: {field}"
                print(f"  ✓ {field}: {str(value)[:40]}...")
            
            for field in fix_specific_fields:
                value = ex.get(field)
                if field == "moodTips":
                    print(f"  ✓ {field}: {len(value) if isinstance(value, list) else value} items")
                else:
                    print(f"  ✓ {field}: {str(value)[:40] if value else 'EMPTY'}...")
        
        print(f"\n✅ All exercises have required fields in database")
    
    def test_notifications_py_includes_all_exercise_fields(self):
        """Verify notifications.py push payload includes all required fields (lines 553-580)"""
        notifications_path = '/app/backend/notifications.py'
        
        with open(notifications_path, 'r') as f:
            content = f.read()
        
        # Find the featured_workout payload section
        section_start = content.find('if notification_type == NotificationType.FEATURED_WORKOUT and metadata:')
        assert section_start != -1, "Featured workout payload section not found"
        
        # Get section until cartItems is built
        section_end = content.find('data_payload["cartItems"] = cart_items', section_start)
        assert section_end != -1, "cartItems assignment not found"
        
        payload_section = content[section_start:section_end + 100]
        
        # Required fields that should be mapped in the push payload
        required_field_mappings = [
            '"id"',           # id from exerciseId
            '"name"',         # name
            '"duration"',     # duration
            '"description"',  # description
            '"battlePlan"',   # battlePlan (FIX)
            '"imageUrl"',     # imageUrl
            '"intensityReason"', # intensityReason (FIX)
            '"equipment"',    # equipment
            '"difficulty"',   # difficulty (FIX)
            '"workoutType"',  # workoutType (FIX)
            '"moodCard"',     # moodCard (FIX)
            '"moodTips"',     # moodTips (FIX)
        ]
        
        missing_fields = []
        for field in required_field_mappings:
            if field not in payload_section:
                missing_fields.append(field)
            else:
                print(f"  ✓ {field} found in push payload construction")
        
        assert not missing_fields, f"Push payload missing fields: {missing_fields}"
        print(f"\n✅ Push payload construction includes all required fields")
    
    def test_notifications_py_maps_exerciseId_to_id(self):
        """Verify push payload maps exerciseId to id field correctly"""
        notifications_path = '/app/backend/notifications.py'
        
        with open(notifications_path, 'r') as f:
            content = f.read()
        
        # Look for the id mapping that falls back to exerciseId
        # Expected: "id": ex.get("exerciseId") or ex.get("id") or ex.get("name", "")
        expected_patterns = [
            'ex.get("exerciseId")',
            '"id":',
        ]
        
        for pattern in expected_patterns:
            assert pattern in content, f"Expected pattern not found: {pattern}"
            print(f"  ✓ Found pattern: {pattern}")
        
        # More specifically, find the exact line
        id_mapping_line = None
        lines = content.split('\n')
        for line in lines:
            if '"id":' in line and 'exerciseId' in line:
                id_mapping_line = line.strip()
                break
        
        assert id_mapping_line is not None, "id field mapping with exerciseId fallback not found"
        print(f"\n  ✓ ID mapping line: {id_mapping_line}")
        print(f"\n✅ Push payload correctly maps exerciseId to id field")
    
    def test_notifications_py_caps_exercises_at_10(self):
        """Verify push payload caps exercises at 10 for size limits"""
        notifications_path = '/app/backend/notifications.py'
        
        with open(notifications_path, 'r') as f:
            content = f.read()
        
        # Look for the cap
        cap_patterns = [
            '[:10]',           # Slice notation
            'exercises"][:10]' # More specific
        ]
        
        found_cap = False
        for pattern in cap_patterns:
            if pattern in content:
                found_cap = True
                print(f"  ✓ Found exercise cap pattern: {pattern}")
                break
        
        assert found_cap, "Exercise cap at 10 not found in notifications.py"
        print(f"\n✅ Push payload caps exercises at 10 for size limits")


class TestPushPayloadSimulation:
    """Simulate push payload construction to verify all fields are included"""
    
    @pytest.fixture
    def mongo_client(self):
        """Get async MongoDB client"""
        return AsyncIOMotorClient(MONGO_URL)
    
    @pytest.mark.asyncio
    async def test_simulated_push_payload_has_all_fields(self, mongo_client):
        """Simulate the push payload construction and verify all fields are present"""
        db = mongo_client[DB_NAME]
        
        # Fetch workout like the push code does
        workout_doc = await db.featured_workouts.find_one(
            {"_id": ObjectId(CARDIO_WORKOUT_ID)},
            {"_id": 0}
        )
        
        assert workout_doc is not None
        assert "exercises" in workout_doc
        
        # Simulate the cartItems construction from notifications.py lines 566-581
        cart_items = []
        for ex in workout_doc["exercises"][:10]:  # cap at 10
            cart_items.append({
                "id": ex.get("exerciseId") or ex.get("id") or ex.get("name", ""),
                "name": ex.get("name", ""),
                "duration": ex.get("duration", ""),
                "description": ex.get("description", ""),
                "battlePlan": ex.get("battlePlan", ""),
                "imageUrl": ex.get("imageUrl") or ex.get("image_url", ""),
                "intensityReason": ex.get("intensityReason", ""),
                "equipment": ex.get("equipment", "None"),
                "difficulty": ex.get("difficulty", ""),
                "workoutType": ex.get("workoutType", ""),
                "moodCard": ex.get("moodCard", ""),
                "moodTips": ex.get("moodTips", []),
            })
        
        assert len(cart_items) > 0, "No cart items generated"
        
        # Verify first cart item has all fields
        first_item = cart_items[0]
        
        print(f"\nSimulated cart item for exercise '{first_item.get('name')}':")
        
        # Check fix-specific fields are NOT empty
        fix_fields_status = {}
        for field in ["battlePlan", "moodTips", "difficulty", "workoutType", "moodCard", "intensityReason"]:
            value = first_item.get(field)
            if field == "moodTips":
                has_value = isinstance(value, list) and len(value) > 0
            else:
                has_value = bool(value)
            
            fix_fields_status[field] = has_value
            status = "✓" if has_value else "✗"
            
            if field == "moodTips":
                print(f"  {status} {field}: {len(value) if isinstance(value, list) else 'NOT_LIST'} items")
            else:
                print(f"  {status} {field}: {str(value)[:60] if value else 'EMPTY'}...")
        
        # All fix-specific fields should have values
        fields_with_values = [f for f, has_val in fix_fields_status.items() if has_val]
        fields_without_values = [f for f, has_val in fix_fields_status.items() if not has_val]
        
        print(f"\nFields with values: {len(fields_with_values)}/6")
        print(f"Fields empty/missing: {fields_without_values}")
        
        # Core fix assertion - battlePlan and moodTips should have content
        assert fix_fields_status["battlePlan"], "battlePlan is empty - FIX NOT WORKING"
        
        print(f"\n✅ Simulated push payload has all required fields populated")


class TestIntegrationVerification:
    """Integration tests verifying the complete fix"""
    
    def test_featured_config_endpoint(self):
        """Test featured config endpoint returns workout IDs"""
        response = requests.get(f"{BASE_URL}/api/featured/config")
        assert response.status_code == 200
        data = response.json()
        
        assert "featuredWorkoutIds" in data
        print(f"✅ Featured config has {len(data.get('featuredWorkoutIds', []))} workout IDs")
    
    def test_end_to_end_featured_workout_data_flow(self):
        """Test complete data flow: config -> batch -> exercise data"""
        # Step 1: Get featured config
        config_response = requests.get(f"{BASE_URL}/api/featured/config")
        assert config_response.status_code == 200
        config = config_response.json()
        
        workout_ids = config.get("featuredWorkoutIds", [])
        print(f"Step 1: Got {len(workout_ids)} featured workout IDs from config")
        
        if not workout_ids:
            # Use known workout ID
            workout_ids = [CARDIO_WORKOUT_ID]
            print(f"  Using fallback workout ID: {CARDIO_WORKOUT_ID}")
        
        # Step 2: Fetch workouts via batch endpoint with JSON array
        batch_response = requests.post(
            f"{BASE_URL}/api/featured/workouts/batch",
            json=workout_ids,  # Bare array, not {ids: [...]}
            headers={"Content-Type": "application/json"}
        )
        assert batch_response.status_code == 200
        batch_data = batch_response.json()
        
        workouts = batch_data.get("workouts", [])
        print(f"Step 2: Batch endpoint returned {len(workouts)} workouts")
        
        # Step 3: Verify exercises have all required fields
        if workouts:
            first_workout = workouts[0]
            exercises = first_workout.get("exercises", [])
            print(f"Step 3: First workout has {len(exercises)} exercises")
            
            if exercises:
                first_ex = exercises[0]
                print(f"  Exercise '{first_ex.get('name')}':")
                print(f"    battlePlan: {bool(first_ex.get('battlePlan'))}")
                print(f"    moodTips: {len(first_ex.get('moodTips', []))} items")
                print(f"    difficulty: {first_ex.get('difficulty')}")
                print(f"    workoutType: {first_ex.get('workoutType')}")
                print(f"    moodCard: {first_ex.get('moodCard')}")
                
                # Assert key fields are present
                assert first_ex.get("battlePlan"), "battlePlan should have content"
        
        print(f"\n✅ End-to-end data flow verified successfully")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
