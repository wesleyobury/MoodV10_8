/**
 * SmartVideoPlayer - Optimized video player with thumbnail-first approach
 * 
 * Moved to separate file to prevent "Rendered more hooks" error.
 * This component must be at module top-level, not nested inside another component.
 * 
 * Behavior:
 * 1. Shows thumbnail by default (coverUrl > cloudinary thumbnail > generated thumbnail)
 * 2. Only loads video when:
 *    a. User taps on thumbnail, OR
 *    b. Post is ≥85% visible AND stationary for 500ms (handled by parent)
 * 3. Stops and unloads video when scrolled off-center
 */

import React, { useState, useRef, memo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { normalizeCloudinaryVideoUrl } from '../utils/cloudinaryVideo';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FEED_HEIGHT = Math.round(SCREEN_WIDTH * 16 / 9);

// Configure audio mode for proper playback on mobile
const configureAudio = async () => {
  try {
    if (Platform.OS === 'web') return;
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.warn('Audio config warning (non-critical):', error);
  }
};

// Helper to get Cloudinary thumbnail URL from video URL
const getCloudinaryThumbnail = (videoUrl: string): string | null => {
  if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/')) {
    const urlParts = videoUrl.split('/upload/');
    if (urlParts.length === 2) {
      let thumbnailPath = urlParts[1].replace(/\.(mp4|mov|avi|webm|mkv|m4v)$/i, '.jpg');
      return `${urlParts[0]}/upload/so_0,f_jpg,q_auto,w_800/${thumbnailPath}`;
    }
  }
  return null;
};

// Cache for generated thumbnails
const thumbnailCache: { [key: string]: string } = {};

export interface SmartVideoPlayerProps {
  uri: string;
  coverUrl?: string | null;
  isActive: boolean;
  postIsInCenter: boolean; // Renamed from isPostInCenter to avoid shadowing
}

const SmartVideoPlayer = memo(({ uri, coverUrl, isActive, postIsInCenter }: SmartVideoPlayerProps) => {
  const videoRef = useRef<Video>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [audioConfigured, setAudioConfigured] = useState(false);
  
  // Internal state - renamed to avoid shadowing prop
  const [isInCenter, setIsInCenter] = useState(postIsInCenter);
  
  // Normalize video URL for iOS compatibility
  const normalizedUri = normalizeCloudinaryVideoUrl(uri) || uri;
  
  // Timeout and retry state
  const [retryCount, setRetryCount] = useState(0);
  const [videoKey, setVideoKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_RETRIES = 3;
  const LOAD_TIMEOUT_MS = 10000;
  
  // Thumbnail state
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Sync internal state with prop
  useEffect(() => {
    setIsInCenter(postIsInCenter);
  }, [postIsInCenter]);

  // Generate or load thumbnail on mount
  const loadThumbnail = useCallback(async () => {
  setThumbnailLoading(true);
  setThumbnailError(false);

  try {
    if (coverUrl) {
      setThumbnailUri(coverUrl);
      setThumbnailLoading(false);
      return;
    }

    if (thumbnailCache[uri]) {
      setThumbnailUri(thumbnailCache[uri]);
      setThumbnailLoading(false);
      return;
    }

    const cloudinaryThumb = getCloudinaryThumbnail(uri);
    if (cloudinaryThumb) {
      setThumbnailUri(cloudinaryThumb);
      thumbnailCache[uri] = cloudinaryThumb;
      setThumbnailLoading(false);
      return;
    }

    setThumbnailError(true);
  } catch (error) {
    console.error('Error loading thumbnail:', error);
    setThumbnailError(true);
  } finally {
    setThumbnailLoading(false);
  }
}, [uri, coverUrl]);
useEffect(() => {
  loadThumbnail();
}, [loadThumbnail]);

  // Configure audio mode on mount
  useEffect(() => {
    if (!audioConfigured) {
      configureAudio().then(() => {
        setAudioConfigured(true);
      });
    }
  }, [audioConfigured]);

  // Stop video when scrolled off-center
  useEffect(() => {
    if (!isInCenter && shouldLoadVideo) {
      if (videoRef.current) {
        videoRef.current.stopAsync().catch(() => {});
        videoRef.current.unloadAsync().catch(() => {});
      }
      setShouldLoadVideo(false);
      setIsPlaying(false);
      setIsMuted(true);
      setPosition(0);
    }
  }, [isInCenter, shouldLoadVideo]);

  // Auto-pause when not active
  useEffect(() => {
    if (!isActive && videoRef.current && shouldLoadVideo) {
      videoRef.current.pauseAsync().catch(() => {});
      videoRef.current.setIsMutedAsync(true).catch(() => {});
      setIsMuted(true);
      setIsPlaying(false);
    }
  }, [isActive, shouldLoadVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.stopAsync().catch(() => {});
        videoRef.current.unloadAsync().catch(() => {});
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Video loading timeout logic
  useEffect(() => {
    if (shouldLoadVideo && isVideoLoading) {
      timeoutRef.current = setTimeout(() => {
        if (isVideoLoading && !isPlaying) {
          console.log(`Video timeout after ${LOAD_TIMEOUT_MS}ms, retry ${retryCount + 1}/${MAX_RETRIES}`);
          
          if (retryCount < MAX_RETRIES) {
            if (videoRef.current) {
              videoRef.current.unloadAsync().catch(() => {});
            }
            setRetryCount(prev => prev + 1);
            setVideoKey(prev => prev + 1);
          } else {
            setHasError(true);
            setIsVideoLoading(false);
          }
        }
      }, LOAD_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [shouldLoadVideo, isVideoLoading, videoKey, retryCount, isPlaying]);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsVideoLoading(false);
      setIsPlaying(status.isPlaying);
      if (!isSeeking) {
        setPosition(status.positionMillis || 0);
      }
      setDuration(status.durationMillis || 0);
      if (status.didJustFinish) {
        videoRef.current?.replayAsync();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isSeeking]);

  const handleThumbnailTap = useCallback(async () => {
    await configureAudio();
    setShouldLoadVideo(true);
    setIsVideoLoading(true);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    
    await configureAudio();
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.setIsMutedAsync(false);
      setIsMuted(false);
      await videoRef.current.playAsync();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      if (isMuted) {
        await configureAudio();
      }
      
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.warn('Mute toggle failed:', error);
    }
  }, [isMuted]);

  const handleVideoReadyForDisplay = useCallback(() => {
    setIsVideoLoading(false);
    if (videoRef.current && isActive) {
      try {
        videoRef.current.setIsMutedAsync(false).then(() => {
          setIsMuted(false);
          videoRef.current?.playAsync().catch(() => {});
        }).catch(() => {});
      } catch (error) {
        console.warn('Video ready handler failed:', error);
      }
    }
  }, [isActive]);

  const handleManualRetry = useCallback(() => {
    setRetryCount(0);
    setHasError(false);
    setVideoKey(prev => prev + 1);
    setIsVideoLoading(true);
  }, []);

  // Safety check
  if (!uri || typeof uri !== 'string' || uri.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="videocam-off-outline" size={48} color="#666" />
        <Text style={styles.errorText}>Invalid video</Text>
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="videocam-off-outline" size={48} color="#666" />
        <Text style={styles.errorText}>Failed to load video</Text>
      </View>
    );
  }

  // Show thumbnail view (default state)
  if (!shouldLoadVideo) {
    return (
      <TouchableOpacity 
        style={styles.videoContainer} 
        activeOpacity={0.9}
        onPress={handleThumbnailTap}
      >
        {thumbnailLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        ) : thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.video}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="videocam" size={48} color="#666" />
          </View>
        )}
        
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={40} color="#fff" />
          </View>
        </View>
        
        <View style={styles.videoBadge}>
          <Ionicons name="videocam" size={14} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  }

  // Show video player
  return (
    <TouchableOpacity 
      style={styles.videoContainer} 
      activeOpacity={1}
      onPress={hasError ? handleManualRetry : togglePlayPause}
    >
      {hasError ? (
        <View style={[styles.video, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          {thumbnailUri && (
            <Image
              source={{ uri: thumbnailUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}
          <View style={styles.errorOverlay}>
            <Ionicons name="refresh-circle" size={48} color="#FFD700" />
            <Text style={styles.errorOverlayText}>Video failed to load</Text>
            <Text style={styles.errorOverlaySubtext}>Tap to retry</Text>
          </View>
        </View>
      ) : (
        <Video
          key={videoKey}
          ref={videoRef}
          source={{ uri: normalizedUri }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onReadyForDisplay={handleVideoReadyForDisplay}
          onError={(error) => {
            console.error('VIDEO LOAD ERROR:', normalizedUri, error);
            if (retryCount < MAX_RETRIES) {
              if (videoRef.current) {
                videoRef.current.unloadAsync().catch(() => {});
              }
              setRetryCount(prev => prev + 1);
              setVideoKey(prev => prev + 1);
            } else {
              setHasError(true);
            }
          }}
        />
      )}
      
      {isVideoLoading && !hasError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          {retryCount > 0 && (
            <Text style={styles.retryText}>Retry {retryCount}/{MAX_RETRIES}</Text>
          )}
        </View>
      )}
      
      {!isPlaying && !isVideoLoading && !hasError && (
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={40} color="#fff" />
          </View>
        </View>
      )}
      
      <View style={styles.videoBadge}>
        <Ionicons name="videocam" size={14} color="#fff" />
      </View>
      
      {!hasError && (
        <TouchableOpacity 
          style={styles.muteButton}
          onPress={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
        >
          <Ionicons 
            name={isMuted ? "volume-mute" : "volume-high"} 
            size={18} 
            color="#fff" 
          />
        </TouchableOpacity>
      )}

      {duration > 0 && !hasError && (
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${(position / duration) * 100}%` }
            ]} 
          />
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  videoContainer: {
    width: SCREEN_WIDTH,
    height: FEED_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  errorContainer: {
    width: SCREEN_WIDTH,
    height: FEED_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  videoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  muteButton: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 8,
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  errorOverlayText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  errorOverlaySubtext: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    fontSize: 12,
  },
  retryText: {
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    fontSize: 11,
  },
});

export default SmartVideoPlayer;
