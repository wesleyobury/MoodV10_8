import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

// Safely import expo-video-thumbnails - it can crash on production iOS builds
let VideoThumbnails: any = null;
let videoThumbnailsAvailable = false;

try {
  VideoThumbnails = require('expo-video-thumbnails');
  videoThumbnailsAvailable = true;
} catch (error) {
  console.warn('expo-video-thumbnails not available:', error);
  videoThumbnailsAvailable = false;
}

interface VideoThumbnailProps {
  videoUrl: string;
  coverUrl?: string | null;
  style?: any;
}

// Cache for generated thumbnails to avoid regenerating
const thumbnailCache: { [key: string]: string } = {};

/**
 * Convert Cloudinary video URL to thumbnail URL
 * Cloudinary can generate thumbnails server-side which is much faster
 */
const getCloudinaryThumbnail = (videoUrl: string): string | null => {
  // Check if it's a Cloudinary URL
  if (!videoUrl.includes('res.cloudinary.com') && !videoUrl.includes('cloudinary.com')) {
    return null;
  }
  
  // Transform video URL to image thumbnail
  // Format: .../video/upload/... -> .../video/upload/so_1,f_jpg,w_400,h_400,c_fill/...
  try {
    // Add transformation parameters for thumbnail
    const transformedUrl = videoUrl
      .replace('/upload/', '/upload/so_1,f_jpg,w_400,h_400,c_fill,q_70/')
      .replace(/\.(mov|mp4|webm|avi)$/i, '.jpg');
    return transformedUrl;
  } catch {
    return null;
  }
};

const VideoThumbnail: React.FC<VideoThumbnailProps> = memo(({ videoUrl, coverUrl, style }) => {
  // Try to get Cloudinary thumbnail first (instant)
  const cloudinaryThumb = getCloudinaryThumbnail(videoUrl);
  
  const [thumbnail, setThumbnail] = useState<string | null>(
    coverUrl || cloudinaryThumb || thumbnailCache[videoUrl] || null
  );
  const [loading, setLoading] = useState(!coverUrl && !cloudinaryThumb && !thumbnailCache[videoUrl]);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If we have a cover URL, use it directly
    if (coverUrl) {
      setThumbnail(coverUrl);
      setLoading(false);
      setError(false);
      return;
    }
    
    // If we have a Cloudinary thumbnail, use it (instant)
    if (cloudinaryThumb) {
      setThumbnail(cloudinaryThumb);
      setLoading(false);
      setError(false);
      return;
    }
    
    // Check cache
    if (thumbnailCache[videoUrl]) {
      setThumbnail(thumbnailCache[videoUrl]);
      setLoading(false);
      setError(false);
      return;
    }
    
    // Generate thumbnail on native platforms for non-Cloudinary videos
    if (Platform.OS !== 'web' && videoThumbnailsAvailable && VideoThumbnails) {
      generateThumbnail();
    } else {
      // No VideoThumbnails available or on web - show fallback
      setLoading(false);
      setError(true);
    }
  }, [videoUrl, coverUrl, cloudinaryThumb]);

  const generateThumbnail = async () => {
    // Double-check VideoThumbnails is available
    if (!videoThumbnailsAvailable || !VideoThumbnails) {
      setError(true);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(false);
      
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, {
        time: 1000,
        quality: 0.7,
      });
      
      // Cache the generated thumbnail
      thumbnailCache[videoUrl] = uri;
      setThumbnail(uri);
    } catch (e) {
      console.log('Thumbnail generation failed for:', videoUrl, e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#FFD700" />
      </View>
    );
  }

  if (error || !thumbnail) {
    return (
      <View style={[styles.container, styles.fallbackContainer, style]}>
        <View style={styles.videoIconWrapper}>
          <Ionicons name="videocam" size={28} color="#FFD700" />
        </View>
        <View style={styles.playIconOverlay}>
          <Ionicons name="play-circle" size={32} color="rgba(255, 255, 255, 0.9)" />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image 
        source={{ uri: thumbnail }}
        style={styles.thumbnail}
        contentFit="cover"
        transition={100}
        cachePolicy="memory-disk"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />
      <View style={styles.playOverlay}>
        <Ionicons name="play-circle" size={32} color="rgba(255, 255, 255, 0.9)" />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    backgroundColor: '#0c0c0c',
  },
  videoIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
});

export default VideoThumbnail;
