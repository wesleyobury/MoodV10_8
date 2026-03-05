"""
Backend tests for thumbnail_url and media_type derivation in PostResponse.

Test coverage:
1. Backend: GET /api/users/{user_id}/posts returns thumbnail_url and media_type for posts
2. Backend: video posts return media_type='video', image posts return media_type='image'
3. Backend: thumbnail_url is derived from cover_urls['0'] for Cloudinary video posts
4. Backend: video posts WITHOUT cover_urls get Cloudinary auto-thumbnail fallback (so_1 URL) — test with /api/uploads/ local video posts
5. Backend: derive_post_media_fields detects .mp4, .mov, .m3u8, /video/ as video media_type
6. Backend: image posts return thumbnail_url=None (no thumbnail needed)
7. Backend: PostResponse model includes thumbnail_url and media_type fields
8. Regression: image posts still display correctly in profile grid
"""
import pytest
import requests
import os
import sys

# Add backend path to import derive_post_media_fields
sys.path.insert(0, '/app/backend')

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://workout-nav-fix.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_USERNAME = "thumbtest"
TEST_PASSWORD = "pass123"

# Known users from the database
ADMIN_USER_ID = "693f94d29a560edaab674fd5"  # User with video posts


class TestAuth:
    """Get authentication token for testing"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data["token"]


class TestDerivePostMediaFieldsFunction:
    """Test the derive_post_media_fields helper function directly"""
    
    def test_function_exists_and_importable(self):
        """Verify derive_post_media_fields can be imported from server.py"""
        from server import derive_post_media_fields
        assert callable(derive_post_media_fields)
    
    def test_video_detection_mp4_extension(self):
        """Test .mp4 extension is detected as video"""
        from server import derive_post_media_fields
        post = {"media_urls": ["https://example.com/video.mp4"]}
        result = derive_post_media_fields(post)
        assert result["media_type"] == "video", f"Expected video, got {result['media_type']}"
    
    def test_video_detection_mov_extension(self):
        """Test .mov extension is detected as video"""
        from server import derive_post_media_fields
        post = {"media_urls": ["/api/uploads/test-video.mov"]}
        result = derive_post_media_fields(post)
        assert result["media_type"] == "video", f"Expected video, got {result['media_type']}"
    
    def test_video_detection_m3u8_extension(self):
        """Test .m3u8 (HLS) extension is detected as video"""
        from server import derive_post_media_fields
        post = {"media_urls": ["https://cloudinary.com/video/test.m3u8"]}
        result = derive_post_media_fields(post)
        assert result["media_type"] == "video", f"Expected video, got {result['media_type']}"
    
    def test_video_detection_video_path(self):
        """Test /video/ in path is detected as video"""
        from server import derive_post_media_fields
        post = {"media_urls": ["https://res.cloudinary.com/test/video/upload/v123/test.jpg"]}
        result = derive_post_media_fields(post)
        assert result["media_type"] == "video", f"Expected video for /video/ path, got {result['media_type']}"
    
    def test_image_detection_jpg(self):
        """Test .jpg is detected as image"""
        from server import derive_post_media_fields
        post = {"media_urls": ["https://res.cloudinary.com/test/image/upload/test.jpg"]}
        result = derive_post_media_fields(post)
        assert result["media_type"] == "image", f"Expected image, got {result['media_type']}"
    
    def test_image_detection_png(self):
        """Test .png is detected as image"""
        from server import derive_post_media_fields
        post = {"media_urls": ["https://example.com/photo.png"]}
        result = derive_post_media_fields(post)
        assert result["media_type"] == "image", f"Expected image, got {result['media_type']}"
    
    def test_empty_media_urls_returns_none_media_type(self):
        """Test empty media_urls returns None for media_type"""
        from server import derive_post_media_fields
        post = {"media_urls": []}
        result = derive_post_media_fields(post)
        assert result["media_type"] is None, f"Expected None, got {result['media_type']}"
    
    def test_image_thumbnail_is_none(self):
        """Test image posts don't get thumbnail_url (no thumbnail needed)"""
        from server import derive_post_media_fields
        post = {"media_urls": ["https://example.com/photo.jpg"]}
        result = derive_post_media_fields(post)
        assert result["thumbnail_url"] is None, f"Image should have None thumbnail_url, got {result['thumbnail_url']}"
    
    def test_video_with_cover_urls_dict_gets_thumbnail(self):
        """Test video with cover_urls dict gets thumbnail_url from cover_urls['0']"""
        from server import derive_post_media_fields
        cover_url = "https://res.cloudinary.com/test/image/upload/cover.jpg"
        post = {
            "media_urls": ["https://res.cloudinary.com/test/video/upload/test.mp4"],
            "cover_urls": {"0": cover_url}
        }
        result = derive_post_media_fields(post)
        assert result["thumbnail_url"] == cover_url, f"Expected cover_url, got {result['thumbnail_url']}"
        assert result["media_type"] == "video"
    
    def test_video_with_cover_urls_list_gets_thumbnail(self):
        """Test video with cover_urls list gets thumbnail_url from cover_urls[0]"""
        from server import derive_post_media_fields
        cover_url = "https://res.cloudinary.com/test/image/upload/cover.jpg"
        post = {
            "media_urls": ["https://res.cloudinary.com/test/video/upload/test.mp4"],
            "cover_urls": [cover_url]
        }
        result = derive_post_media_fields(post)
        assert result["thumbnail_url"] == cover_url, f"Expected cover_url from list, got {result['thumbnail_url']}"
    
    def test_cloudinary_video_without_cover_gets_auto_thumbnail(self):
        """Test Cloudinary video without cover_urls gets auto-thumbnail fallback (so_1 URL)"""
        from server import derive_post_media_fields
        post = {
            "media_urls": ["https://res.cloudinary.com/dfsygar5c/video/upload/v1234/test_video.mp4"],
            "cover_urls": None
        }
        result = derive_post_media_fields(post)
        assert result["thumbnail_url"] is not None, "Cloudinary video should get auto-thumbnail"
        assert "so_1" in result["thumbnail_url"], f"Auto-thumbnail should contain so_1 transform, got {result['thumbnail_url']}"
        assert ".jpg" in result["thumbnail_url"], f"Auto-thumbnail should be .jpg, got {result['thumbnail_url']}"
    
    def test_local_video_without_cover_gets_none_thumbnail(self):
        """Test local /api/uploads/ video without cover_urls gets None thumbnail (no Cloudinary fallback)"""
        from server import derive_post_media_fields
        post = {
            "media_urls": ["/api/uploads/test-video.mov"],
            "cover_urls": None
        }
        result = derive_post_media_fields(post)
        # Local videos don't get Cloudinary fallback
        assert result["thumbnail_url"] is None, f"Local video without cover should have None thumbnail, got {result['thumbnail_url']}"
        assert result["media_type"] == "video"
    
    def test_return_dict_has_both_keys(self):
        """Test derive_post_media_fields returns dict with both thumbnail_url and media_type keys"""
        from server import derive_post_media_fields
        post = {"media_urls": ["https://example.com/test.jpg"]}
        result = derive_post_media_fields(post)
        assert "thumbnail_url" in result, "Result should have thumbnail_url key"
        assert "media_type" in result, "Result should have media_type key"


class TestPostResponseModel:
    """Test PostResponse model has thumbnail_url and media_type fields"""
    
    def test_post_response_has_thumbnail_url_field(self):
        """Verify PostResponse model includes thumbnail_url field"""
        from server import PostResponse
        fields = PostResponse.model_fields
        assert "thumbnail_url" in fields, "PostResponse should have thumbnail_url field"
    
    def test_post_response_has_media_type_field(self):
        """Verify PostResponse model includes media_type field"""
        from server import PostResponse
        fields = PostResponse.model_fields
        assert "media_type" in fields, "PostResponse should have media_type field"


class TestGetUserPostsAPI(TestAuth):
    """Test GET /api/users/{user_id}/posts returns thumbnail_url and media_type"""
    
    def test_get_user_posts_returns_thumbnail_url_field(self, auth_token):
        """Test GET /api/users/{user_id}/posts response includes thumbnail_url field"""
        response = requests.get(
            f"{BASE_URL}/api/users/{ADMIN_USER_ID}/posts?limit=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"API call failed: {response.text}"
        posts = response.json()
        assert len(posts) > 0, "Expected at least one post"
        
        # Check first post has thumbnail_url key
        assert "thumbnail_url" in posts[0], "Post response should include thumbnail_url field"
    
    def test_get_user_posts_returns_media_type_field(self, auth_token):
        """Test GET /api/users/{user_id}/posts response includes media_type field"""
        response = requests.get(
            f"{BASE_URL}/api/users/{ADMIN_USER_ID}/posts?limit=5",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"API call failed: {response.text}"
        posts = response.json()
        assert len(posts) > 0, "Expected at least one post"
        
        # Check first post has media_type key
        assert "media_type" in posts[0], "Post response should include media_type field"
    
    def test_image_posts_have_media_type_image(self, auth_token):
        """Test image posts return media_type='image'"""
        response = requests.get(
            f"{BASE_URL}/api/users/{ADMIN_USER_ID}/posts?limit=20",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"API call failed: {response.text}"
        posts = response.json()
        
        # Find an image post (URL contains /image/ or ends with .jpg, .png, etc.)
        image_posts = [p for p in posts if p.get("media_urls") and 
                       any(('/image/' in url.lower() or url.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp'))) 
                           and '.mp4' not in url.lower() and '.mov' not in url.lower()
                           for url in p.get("media_urls", []))]
        
        assert len(image_posts) > 0, "Expected at least one image post for testing"
        
        for post in image_posts[:3]:
            assert post.get("media_type") == "image", f"Image post should have media_type='image', got {post.get('media_type')}"
            # Image posts should have thumbnail_url=None
            assert post.get("thumbnail_url") is None, f"Image post should have thumbnail_url=None, got {post.get('thumbnail_url')}"
    
    def test_video_posts_have_media_type_video(self, auth_token):
        """Test video posts return media_type='video'"""
        response = requests.get(
            f"{BASE_URL}/api/users/{ADMIN_USER_ID}/posts?limit=100",  # Use larger limit to find video posts
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"API call failed: {response.text}"
        posts = response.json()
        
        # Find video posts (URL ends with .mp4, .mov, .m3u8, or contains /video/)
        video_posts = [p for p in posts if p.get("media_urls") and 
                       any(url.lower().endswith(('.mp4', '.mov', '.m3u8', '.webm', '.avi')) or '/video/' in url.lower()
                           for url in p.get("media_urls", []))]
        
        # If no video posts found in this user's posts, skip the test
        if len(video_posts) == 0:
            pytest.skip("No video posts found for this user")
        
        for post in video_posts[:5]:
            assert post.get("media_type") == "video", f"Video post should have media_type='video', got {post.get('media_type')}"
    
    def test_local_video_posts_without_cover_have_null_thumbnail(self, auth_token):
        """Test local /api/uploads/ video posts without cover_urls have null thumbnail_url"""
        response = requests.get(
            f"{BASE_URL}/api/users/{ADMIN_USER_ID}/posts?limit=100",  # Use larger limit to find local videos
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"API call failed: {response.text}"
        posts = response.json()
        
        # Find local video posts (starts with /api/uploads/)
        local_video_posts = [p for p in posts if p.get("media_urls") and 
                             any(url.startswith('/api/uploads/') and url.lower().endswith(('.mp4', '.mov', '.m3u8'))
                                 for url in p.get("media_urls", []))]
        
        if len(local_video_posts) == 0:
            pytest.skip("No local video posts found")
        
        for post in local_video_posts[:5]:
            # Local videos without cover_urls should have null thumbnail
            if not post.get("cover_urls"):
                assert post.get("thumbnail_url") is None, \
                    f"Local video without cover should have thumbnail_url=None, got {post.get('thumbnail_url')}"
            assert post.get("media_type") == "video", f"Video post should have media_type='video'"
    
    def test_cloudinary_video_with_cover_urls_gets_thumbnail(self, auth_token):
        """Test Cloudinary video posts with cover_urls get thumbnail_url from cover_urls['0']"""
        response = requests.get(
            f"{BASE_URL}/api/users/{ADMIN_USER_ID}/posts?limit=100",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"API call failed: {response.text}"
        posts = response.json()
        
        # Find Cloudinary video posts with cover_urls
        cloudinary_video_posts = [p for p in posts if p.get("media_urls") and p.get("cover_urls") and
                                   any('cloudinary.com' in url and '/video/' in url
                                       for url in p.get("media_urls", []))]
        
        if len(cloudinary_video_posts) == 0:
            pytest.skip("No Cloudinary video posts with cover_urls found")
        
        for post in cloudinary_video_posts[:5]:
            cover_urls = post.get("cover_urls", {})
            expected_thumbnail = cover_urls.get("0") if isinstance(cover_urls, dict) else (cover_urls[0] if cover_urls else None)
            
            assert post.get("thumbnail_url") == expected_thumbnail, \
                f"thumbnail_url should match cover_urls['0']. Expected {expected_thumbnail}, got {post.get('thumbnail_url')}"
            assert post.get("media_type") == "video", f"Video post should have media_type='video'"


class TestVideoExtensionDetection:
    """Test all video extensions are correctly detected"""
    
    @pytest.mark.parametrize("extension", [".mp4", ".mov", ".avi", ".webm", ".mkv", ".m4v", ".m3u8"])
    def test_video_extension_detection(self, extension):
        """Test each video extension is correctly detected"""
        from server import derive_post_media_fields
        post = {"media_urls": [f"https://example.com/video{extension}"]}
        result = derive_post_media_fields(post)
        assert result["media_type"] == "video", f"Extension {extension} should be detected as video"


class TestCloudinaryAutoThumbnailFallback:
    """Test Cloudinary auto-thumbnail generation for videos without cover_urls"""
    
    def test_cloudinary_video_upload_path_generates_thumbnail(self):
        """Test videos with Cloudinary /video/upload/ path get auto-thumbnail"""
        from server import derive_post_media_fields
        post = {
            "media_urls": ["https://res.cloudinary.com/dfsygar5c/video/upload/v1234/my_video.mp4"],
            "cover_urls": None
        }
        result = derive_post_media_fields(post)
        
        assert result["thumbnail_url"] is not None
        assert "so_1" in result["thumbnail_url"], "Should use so_1 (1 second frame grab)"
        assert "w_400" in result["thumbnail_url"], "Should have width transform"
        assert "h_400" in result["thumbnail_url"], "Should have height transform"
        assert "c_fill" in result["thumbnail_url"], "Should have fill crop"
        assert ".jpg" in result["thumbnail_url"], "Should output as jpg"
    
    def test_cloudinary_thumbnail_strips_transforms(self):
        """Test Cloudinary auto-thumbnail strips existing transforms from public_id"""
        from server import derive_post_media_fields
        # URL with existing transforms (sp_hd/)
        post = {
            "media_urls": ["https://res.cloudinary.com/dfsygar5c/video/upload/sp_hd/v1234/my_video.mp4"],
            "cover_urls": None
        }
        result = derive_post_media_fields(post)
        
        assert result["thumbnail_url"] is not None
        # Should NOT have nested sp_hd in thumbnail URL
        assert "sp_hd" not in result["thumbnail_url"], f"Should strip transforms, got {result['thumbnail_url']}"
    
    def test_non_cloudinary_video_no_fallback(self):
        """Test non-Cloudinary videos don't get auto-thumbnail fallback"""
        from server import derive_post_media_fields
        post = {
            "media_urls": ["https://example.com/video/test.mp4"],
            "cover_urls": None
        }
        result = derive_post_media_fields(post)
        
        # Non-Cloudinary videos shouldn't get auto-thumbnail
        assert result["thumbnail_url"] is None, "Non-Cloudinary video should not get auto-thumbnail"


class TestRegressionImagePosts:
    """Regression tests to ensure image posts still work correctly"""
    
    def test_image_post_still_displays_correctly(self):
        """Test image posts are not broken by the video thumbnail changes"""
        from server import derive_post_media_fields
        post = {
            "media_urls": ["https://res.cloudinary.com/dfsygar5c/image/upload/v1234/test_image.jpg"],
            "cover_urls": None  # Images typically don't have cover_urls
        }
        result = derive_post_media_fields(post)
        
        assert result["media_type"] == "image"
        assert result["thumbnail_url"] is None  # Images don't need separate thumbnail


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
