import React, { useState, useEffect, memo } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { cloudinaryThumbnailUrlFromVideoUrl } from '../utils/cloudinaryVideo';

interface VideoThumbnailProps {
  videoUrl: string;
  coverUrl?: string | null;
  style?: any;
}

/**
 * VideoThumbnail — shows user-selected cover (priority) or auto-generated poster.
 * Never generates a Cloudinary thumb if coverUrl is provided.
 */
const VideoThumbnail: React.FC<VideoThumbnailProps> = memo(({ videoUrl, coverUrl, style }) => {
  // Priority: user-selected cover → Cloudinary poster from public_id
  const thumbnailUri = coverUrl || cloudinaryThumbnailUrlFromVideoUrl(videoUrl);

  if (!thumbnailUri) {
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
        source={{ uri: thumbnailUri }}
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
