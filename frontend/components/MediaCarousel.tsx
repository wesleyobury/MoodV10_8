import React, { useState, useRef, memo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { normalizeCloudinaryVideoUrl } from '../utils/cloudinaryVideo';
// REMOVED: expo-video-thumbnails - causes crashes in production builds

const SCREEN_WIDTH = Dimensions.get('window').width;

// Configure audio mode for proper playback on mobile
const configureAudio = async () => {
  try {
    // Only configure on native platforms
    if (Platform.OS === 'web') return;
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    // Silently fail - audio config is not critical for video playback
    console.warn('Audio config warning (non-critical):', error);
  }
};

// Helper to detect if a URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

// Helper to get Cloudinary thumbnail URL from video URL
const getCloudinaryThumbnail = (videoUrl: string): string | null => {
  // If it's a Cloudinary video URL, we can generate a thumbnail
  if (videoUrl.includes('cloudinary.com') && videoUrl.includes('/video/')) {
    // Transform video URL to get thumbnail
    // e.g., .../video/upload/... -> .../video/upload/so_0,f_jpg/...
    const urlParts = videoUrl.split('/upload/');
    if (urlParts.length === 2) {
      // Replace video extension with jpg
      let thumbnailPath = urlParts[1].replace(/\.(mp4|mov|avi|webm|mkv|m4v)$/i, '.jpg');
      return `${urlParts[0]}/upload/so_0,f_jpg,q_auto,w_800/${thumbnailPath}`;
    }
  }
  return null;
};

interface MediaCarouselProps {
  media: string[];
  isPostVisible?: boolean;
  onIndexChange?: (index: number) => void;
  coverUrls?: { [key: number]: string } | null; // Map of media index to cover URL
}

interface SmartVideoPlayerProps {
  uri: string;
  coverUrl?: string | null;
  isActive: boolean;
  isPostInCenter: boolean;
}

// Cache for generated thumbnails
const thumbnailCache: { [key: string]: string } = {};

/**
 * SmartVideoPlayer - Optimized video player with thumbnail-first approach
 * 
 * Behavior:
 * 1. Shows thumbnail by default (coverUrl > cloudinary thumbnail > generated thumbnail)
 * 2. Only loads video when:
 *    a. User taps on thumbnail, OR
 *    b. Post is ≥85% visible AND stationary for 500ms (handled by parent)
 * 3. Stops and unloads video when scrolled off-center
 */
const SmartVideoPlayer = memo(({ uri, coverUrl, isActive, isPostInCenter }: SmartVideoPlayerProps) => {
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

  // Generate or load thumbnail on mount
  useEffect(() => {
    loadThumbnail();
  }, [uri, coverUrl]);

  const loadThumbnail = async () => {
    setThumbnailLoading(true);
    setThumbnailError(false);

    try {
      // Priority: User-selected cover > Cloudinary thumbnail > Generated thumbnail > Cache
      
      // 1. Check user-selected cover
      if (coverUrl) {
        setThumbnailUri(coverUrl);
        setThumbnailLoading(false);
        return;
      }

      // 2. Check cache
      if (thumbnailCache[uri]) {
        setThumbnailUri(thumbnailCache[uri]);
        setThumbnailLoading(false);
        return;
      }

      // 3. Try Cloudinary thumbnail (most reliable for production)
      const cloudinaryThumb = getCloudinaryThumbnail(uri);
      if (cloudinaryThumb) {
        setThumbnailUri(cloudinaryThumb);
        thumbnailCache[uri] = cloudinaryThumb;
        setThumbnailLoading(false);
        return;
      }

      // 4. No thumbnail available - show video icon placeholder
      // REMOVED: expo-video-thumbnails - causes crashes in production iOS builds
      setThumbnailError(true);
    } catch (error) {
      console.error('Error loading thumbnail:', error);
      setThumbnailError(true);
    } finally {
      setThumbnailLoading(false);
    }
  };

  // Configure audio mode on mount for mobile playback
  useEffect(() => {
    if (!audioConfigured) {
      configureAudio().then(() => {
        setAudioConfigured(true);
      });
    }
  }, [audioConfigured]);

  // Stop video and release resources when scrolled off-center
  useEffect(() => {
    if (!isPostInCenter && shouldLoadVideo) {
      // Immediately stop and unload when scrolled away
      if (videoRef.current) {
        videoRef.current.stopAsync().catch(() => {});
        videoRef.current.unloadAsync().catch(() => {});
      }
      setShouldLoadVideo(false);
      setIsPlaying(false);
      setIsMuted(true);
      setPosition(0);
    }
  }, [isPostInCenter, shouldLoadVideo]);

  // Auto-pause when not active (different slide in carousel)
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
      // Start timeout
      timeoutRef.current = setTimeout(() => {
        if (isVideoLoading && !isPlaying) {
          console.log(`Video timeout in feed after ${LOAD_TIMEOUT_MS}ms, retry ${retryCount + 1}/${MAX_RETRIES}`);
          
          if (retryCount < MAX_RETRIES) {
            // Auto-retry
            if (videoRef.current) {
              videoRef.current.unloadAsync().catch(() => {});
            }
            setRetryCount(prev => prev + 1);
            setVideoKey(prev => prev + 1);
          } else {
            // Max retries - show error state
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
        // Loop the video
        videoRef.current?.replayAsync();
      }
      
      // Clear timeout when video loads successfully
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [isSeeking]);

  // Handle tap on thumbnail - load and play video
  const handleThumbnailTap = useCallback(async () => {
    // Configure audio before playing (ensures iOS silent mode works)
    await configureAudio();
    
    setShouldLoadVideo(true);
    setIsVideoLoading(true);
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (!videoRef.current) return;
    
    // Configure audio before playing (ensures iOS silent mode works)
    await configureAudio();
    
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      // When user taps to play, unmute the video
      await videoRef.current.setIsMutedAsync(false);
      setIsMuted(false);
      await videoRef.current.playAsync();
    }
  }, [isPlaying]);

  const toggleMute = useCallback(async () => {
    if (!videoRef.current) return;
    
    try {
      // Configure audio when unmuting (ensures iOS silent mode works)
      if (isMuted) {
        await configureAudio();
      }
      
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    } catch (error) {
      console.warn('Mute toggle failed:', error);
    }
  }, [isMuted]);

  // Handle video ready to play
  const handleVideoReadyForDisplay = useCallback(() => {
    setIsVideoLoading(false);
    // Auto-play when video is ready
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

  // Safety check - if uri is invalid, show error state
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
        
        {/* Play button overlay */}
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={40} color="#fff" />
          </View>
        </View>
        
        {/* Video indicator badge */}
        <View style={styles.videoBadge}>
          <Ionicons name="videocam" size={14} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  }

  // Manual retry handler
  const handleManualRetry = useCallback(() => {
    setRetryCount(0);
    setHasError(false);
    setVideoKey(prev => prev + 1);
    setIsVideoLoading(true);
  }, []);

  // Show video player (after user taps or visibility threshold met)
  return (
    <TouchableOpacity 
      style={styles.videoContainer} 
      activeOpacity={1}
      onPress={hasError ? handleManualRetry : togglePlayPause}
    >
      {hasError ? (
        // Error/timeout state with retry option
        <View style={[styles.video, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
          {thumbnailUri && (
            <Image
              source={{ uri: thumbnailUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
          }}>
            <Ionicons name="refresh-circle" size={48} color="#FFD700" />
            <Text style={{ color: '#fff', marginTop: 8, fontSize: 14, fontWeight: '600' }}>
              Video failed to load
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 12 }}>
              Tap to retry
            </Text>
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
            console.error('Original URI:', uri);
            if (retryCount < MAX_RETRIES) {
              // Auto-retry on error
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
      
      {/* Loading indicator */}
      {isVideoLoading && !hasError && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          {retryCount > 0 && (
            <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8, fontSize: 11 }}>
              Retry {retryCount}/{MAX_RETRIES}
            </Text>
          )}
        </View>
      )}
      
      {/* Play/Pause overlay - shown when paused */}
      {!isPlaying && !isVideoLoading && !hasError && (
        <View style={styles.playOverlay}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={40} color="#fff" />
          </View>
        </View>
      )}
      
      {/* Video indicator badge */}
      <View style={styles.videoBadge}>
        <Ionicons name="videocam" size={14} color="#fff" />
      </View>
      
      {/* Mute/Unmute button */}
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

      {/* Minimal Video Progress Bar */}
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

const MediaCarousel = memo(({ media, isPostVisible = true, onIndexChange, coverUrls }: MediaCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [errorStates, setErrorStates] = useState<{ [key: number]: boolean }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Visibility state for video optimization
  const [isPostInCenter, setIsPostInCenter] = useState(isPostVisible);
  const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [stationaryFor500ms, setStationaryFor500ms] = useState(false);

  // Update center state based on visibility prop
  useEffect(() => {
    // When visibility changes, start/stop the stationary timer
    if (isPostVisible) {
      // Start timer for 500ms stationary check
      visibilityTimerRef.current = setTimeout(() => {
        setStationaryFor500ms(true);
        setIsPostInCenter(true);
      }, 500);
    } else {
      // Clear timer and immediately mark as not in center
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
      setStationaryFor500ms(false);
      setIsPostInCenter(false);
    }

    return () => {
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
    };
  }, [isPostVisible]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    if (index !== activeIndex && index >= 0 && index < media.length) {
      setActiveIndex(index);
      onIndexChange?.(index);
    }
  };

  const handleLoadStart = (index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: true }));
  };

  const handleLoadEnd = (index: number) => {
    setLoadingStates(prev => ({ ...prev, [index]: false }));
  };

  const handleError = (index: number, error: any) => {
    console.error(`Error loading media ${index}:`, error);
    setErrorStates(prev => ({ ...prev, [index]: true }));
    setLoadingStates(prev => ({ ...prev, [index]: false }));
  };

  if (!media || media.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={200}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
      >
        {media.map((mediaUrl, index) => {
          const isVideo = isVideoUrl(mediaUrl);
          const coverUrl = coverUrls ? coverUrls[index] : null;
          
          return (
            <View key={`${mediaUrl}-${index}`} style={styles.mediaContainer}>
              {isVideo ? (
                <SmartVideoPlayer 
                  uri={mediaUrl}
                  coverUrl={coverUrl}
                  isActive={index === activeIndex && stationaryFor500ms}
                  isPostInCenter={isPostInCenter}
                />
              ) : (
                <>
                  <Image
                    source={mediaUrl}
                    style={styles.image}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                    priority="high"
                    placeholderContentFit="cover"
                    placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                    onLoadStart={() => handleLoadStart(index)}
                    onLoad={() => handleLoadEnd(index)}
                    onError={(e) => handleError(index, e)}
                  />
                  {loadingStates[index] && (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#FFD700" />
                    </View>
                  )}
                  {errorStates[index] && (
                    <View style={styles.errorContainer}>
                      <Ionicons name="image-outline" size={48} color="#666" />
                      <Text style={styles.errorText}>Failed to load image</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Dot Indicators */}
      {media.length > 1 && (
        <View style={styles.dotsContainer}>
          {media.map((url, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25, // 4:5 aspect ratio (portrait)
    backgroundColor: '#000',
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25,
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.25,
  },
  thumbnailPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 5, // Offset for play icon visual center
  },
  videoBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  muteButton: {
    position: 'absolute',
    bottom: 16,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
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
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#FFD700',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default MediaCarousel;
