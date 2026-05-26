"""
Test suite to verify Backend URL Lock Fix
Tests for:
1. Backend health check endpoint
2. Public posts endpoint
3. Featured workouts bundle endpoint
4. Login endpoint basic response
"""

import pytest
import requests
import os

# Use local backend since REACT_APP_BACKEND_URL is not set for this Expo project
BASE_URL = "http://localhost:8001"


class TestHealthCheck:
    """Backend health check tests"""
    
    def test_health_endpoint_returns_healthy(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")


class TestPublicEndpoints:
    """Tests for public (no auth required) endpoints"""
    
    def test_public_posts_returns_success(self):
        """Test /api/posts/public returns posts without auth"""
        response = requests.get(f"{BASE_URL}/api/posts/public")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Public posts returned {len(data)} posts")
    
    def test_featured_bundle_returns_data(self):
        """Test /api/featured/bundle returns featured workout config and workouts"""
        response = requests.get(f"{BASE_URL}/api/featured/bundle")
        assert response.status_code == 200
        data = response.json()
        assert "config" in data
        assert "workouts" in data
        assert isinstance(data["workouts"], list)
        print(f"✅ Featured bundle returned {len(data['workouts'])} workouts")
    
    def test_featured_config_returns_data(self):
        """Test /api/featured/config returns configuration"""
        response = requests.get(f"{BASE_URL}/api/featured/config")
        assert response.status_code == 200
        data = response.json()
        assert "schemaVersion" in data
        assert "featuredWorkoutIds" in data
        print(f"✅ Featured config returned with {len(data['featuredWorkoutIds'])} workout IDs")


class TestLoginEndpoint:
    """Tests for login endpoint response"""
    
    def test_login_returns_proper_error_for_invalid_credentials(self):
        """Test /api/auth/login returns proper error for invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "nonexistent_user_xyz", "password": "wrongpassword"}
        )
        # Should return 401 for invalid credentials, not 500
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print(f"✅ Login returns proper error for invalid credentials: {data}")
    
    def test_login_endpoint_reachable(self):
        """Test /api/auth/login endpoint is reachable (any response means it's working)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": "test", "password": "test"},
            headers={"Content-Type": "application/json"}
        )
        # Should return 401 (invalid credentials) not 404 (endpoint not found) or 500 (server error)
        assert response.status_code in [200, 401, 400]
        print(f"✅ Login endpoint is reachable, returned status: {response.status_code}")


class TestRegisterEndpoint:
    """Tests for register endpoint"""
    
    def test_register_endpoint_reachable(self):
        """Test /api/auth/register endpoint is reachable"""
        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"username": "x", "email": "x", "password": "x"},  # Invalid data intentionally
            headers={"Content-Type": "application/json"}
        )
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404
        print(f"✅ Register endpoint is reachable, returned status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
