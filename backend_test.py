#!/usr/bin/env python3
"""
Backend Testing Suite for Cloudinary Media Upload Integration
Testing the mood fitness app backend APIs with focus on Cloudinary integration
"""

import requests
import json
import io
from PIL import Image
import base64
import time
import sys
import os

# Configuration
BACKEND_URL = "https://workout-nav-fix.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials from review request
TEST_USERNAME = "officialmoodapp"
TEST_PASSWORD = "Matthew1999$"

class CloudinaryIntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {}
        }
        self.test_results.append(result)
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def create_test_image(self, size=(1, 1), format='PNG'):
        """Create a small test image for upload testing"""
        img = Image.new('RGB', size, color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format=format)
        img_bytes.seek(0)
        return img_bytes
    
    def test_health_check(self):
        """Test 1: Health Check - Verify the API is running"""
        try:
            response = self.session.get(f"{API_BASE}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_result("Health Check", True, "API is running and healthy", {
                        "status_code": response.status_code,
                        "response": data
                    })
                    return True
                else:
                    self.log_result("Health Check", False, f"API unhealthy: {data}", {
                        "status_code": response.status_code,
                        "response": data
                    })
                    return False
            else:
                self.log_result("Health Check", False, f"HTTP {response.status_code}", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
                
        except Exception as e:
            self.log_result("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_login(self):
        """Test 2: Login to get auth token"""
        try:
            login_data = {
                "username": TEST_USERNAME,
                "password": TEST_PASSWORD
            }
            
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    self.auth_token = data["token"]
                    self.session.headers.update({
                        "Authorization": f"Bearer {self.auth_token}"
                    })
                    self.log_result("Login Authentication", True, "Successfully logged in and got auth token", {
                        "status_code": response.status_code,
                        "user_id": data.get("user_id"),
                        "token_length": len(self.auth_token)
                    })
                    return True
                else:
                    self.log_result("Login Authentication", False, "No token in response", {
                        "status_code": response.status_code,
                        "response": data
                    })
                    return False
            else:
                self.log_result("Login Authentication", False, f"Login failed with HTTP {response.status_code}", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
                
        except Exception as e:
            self.log_result("Login Authentication", False, f"Login error: {str(e)}")
            return False
    
    def test_single_image_upload(self):
        """Test 3: Test Single Image Upload to Cloudinary"""
        if not self.auth_token:
            self.log_result("Single Image Upload", False, "No auth token available")
            return False
            
        try:
            # Create a small test image
            test_image = self.create_test_image()
            
            files = {
                'file': ('test_image.png', test_image, 'image/png')
            }
            
            response = self.session.post(
                f"{API_BASE}/upload",
                files=files,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields in response
                required_checks = {
                    "url_starts_with_cloudinary": data.get("url", "").startswith("https://res.cloudinary.com"),
                    "public_id_contains_mood_app": "mood_app" in data.get("public_id", ""),
                    "resource_type_is_image": data.get("resource_type") == "image"
                }
                
                all_checks_passed = all(required_checks.values())
                
                if all_checks_passed:
                    self.log_result("Single Image Upload", True, "Image uploaded to Cloudinary successfully", {
                        "status_code": response.status_code,
                        "url": data.get("url"),
                        "public_id": data.get("public_id"),
                        "resource_type": data.get("resource_type"),
                        "checks": required_checks
                    })
                    return True
                else:
                    self.log_result("Single Image Upload", False, "Response missing required Cloudinary fields", {
                        "status_code": response.status_code,
                        "response": data,
                        "failed_checks": {k: v for k, v in required_checks.items() if not v}
                    })
                    return False
            else:
                self.log_result("Single Image Upload", False, f"Upload failed with HTTP {response.status_code}", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
                
        except Exception as e:
            self.log_result("Single Image Upload", False, f"Upload error: {str(e)}")
            return False
    
    def test_avatar_upload(self):
        """Test 4: Test Avatar Upload to Cloudinary"""
        if not self.auth_token:
            self.log_result("Avatar Upload", False, "No auth token available")
            return False
            
        try:
            # Create a test avatar image
            test_avatar = self.create_test_image(size=(400, 400))
            
            files = {
                'file': ('avatar.png', test_avatar, 'image/png')
            }
            
            response = self.session.post(
                f"{API_BASE}/users/me/avatar",
                files=files,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for Cloudinary URL and transformation parameters
                url = data.get("url", "")
                cloudinary_url = url.startswith("https://res.cloudinary.com")
                has_transformation = "c_fill" in url or "w_400" in url or "h_400" in url
                
                if cloudinary_url:
                    self.log_result("Avatar Upload", True, "Avatar uploaded to Cloudinary successfully", {
                        "status_code": response.status_code,
                        "url": url,
                        "has_cloudinary_url": cloudinary_url,
                        "has_transformation_params": has_transformation,
                        "response": data
                    })
                    return True
                else:
                    self.log_result("Avatar Upload", False, "Response doesn't contain Cloudinary URL", {
                        "status_code": response.status_code,
                        "url": url,
                        "response": data
                    })
                    return False
            else:
                self.log_result("Avatar Upload", False, f"Avatar upload failed with HTTP {response.status_code}", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
                
        except Exception as e:
            self.log_result("Avatar Upload", False, f"Avatar upload error: {str(e)}")
            return False
    
    def test_public_posts_endpoint(self):
        """Test 5: Verify Public Posts Endpoint for Guest Mode"""
        try:
            # Test without authentication (guest mode)
            guest_session = requests.Session()
            
            response = guest_session.get(
                f"{API_BASE}/posts/public",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    self.log_result("Public Posts Endpoint", True, f"Public posts endpoint working - returned {len(data)} posts", {
                        "status_code": response.status_code,
                        "posts_count": len(data),
                        "requires_auth": False
                    })
                    return True
                else:
                    self.log_result("Public Posts Endpoint", False, "Response is not an array", {
                        "status_code": response.status_code,
                        "response_type": type(data).__name__,
                        "response": data
                    })
                    return False
            else:
                self.log_result("Public Posts Endpoint", False, f"Public posts failed with HTTP {response.status_code}", {
                    "status_code": response.status_code,
                    "response": response.text
                })
                return False
                
        except Exception as e:
            self.log_result("Public Posts Endpoint", False, f"Public posts error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Cloudinary integration tests"""
        print("🧪 Starting Cloudinary Media Upload Integration Tests")
        print(f"🎯 Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Login Authentication", self.test_login),
            ("Single Image Upload", self.test_single_image_upload),
            ("Avatar Upload", self.test_avatar_upload),
            ("Public Posts Endpoint", self.test_public_posts_endpoint)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 Running: {test_name}")
            if test_func():
                passed += 1
        
        print("\n" + "=" * 60)
        print(f"📊 CLOUDINARY INTEGRATION TEST RESULTS")
        print(f"✅ Passed: {passed}/{total} tests ({passed/total*100:.1f}%)")
        print(f"❌ Failed: {total-passed}/{total} tests")
        
        # Summary of critical issues
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print(f"\n🚨 CRITICAL ISSUES FOUND:")
            for test in failed_tests:
                print(f"   ❌ {test['test']}: {test['message']}")
        else:
            print(f"\n🎉 ALL CLOUDINARY INTEGRATION TESTS PASSED!")
        
        return passed == total

def main():
    """Main test execution"""
    tester = CloudinaryIntegrationTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()