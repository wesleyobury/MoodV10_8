/**
 * MediaCarousel - Optimized media carousel for posts
 * 
 * Features:
 * - Supports both images and videos
 * - SmartVideoPlayer (separate component) for optimized video playback
 * - Stable keys for slides to prevent hooks violations
 * - Thumbnail-first approach for videos
 */

import React, { useState, useRef, memo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import SmartVideoPlayer from './SmartVideoPlayer';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Helper to detect if a URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};

interface MediaCarouselProps {
  media: string[];
  postId: string; // required for stable keys
  isPostVisible?: boolean;
  onIndexChange?: (index: number) => void;
  coverUrls?: { [key: number]: string } | null;
}

const MediaCarousel = memo(({ media, postId, isPostVisible = true, onIndexChange, coverUrls }: MediaCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<{ [key: number]: boolean }>({});
  const [errorStates, setErrorStates] = useState<{ [key: number]: boolean }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Visibility state for video optimization - renamed to avoid shadowing
  const [isInCenter, setIsInCenter] = useState(isPostVisible);
  const visibilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [stationaryFor500ms, setStationaryFor500ms] = useState(false);

  // Update center state based on visibility prop
  useEffect(() => {
    if (isPostVisible) {
      visibilityTimerRef.current = setTimeout(() => {
        setStationaryFor500ms(true);
        setIsInCenter(true);
      }, 500);
    } else {
      if (visibilityTimerRef.current) {
        clearTimeout(visibilityTimerRef.current);
      }
      setStationaryFor500ms(false);
      setIsInCenter(false);
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

  // Generate stable key for each slide
  const getSlideKey = (mediaUrl: string, index: number): string => {
    // Prefer using the mediaUrl as key if it's a valid string
    if (mediaUrl && typeof mediaUrl === 'string' && mediaUrl.length > 0) {
      return mediaUrl;
    }
    // Fallback to postId:index (postId is always available since it's required)
    return `${postId}:${index}`;
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
          const slideKey = getSlideKey(mediaUrl, index);
          
          return (
            <View key={slideKey} style={styles.mediaContainer}>
              {isVideo ? (
                <SmartVideoPlayer 
                  uri={mediaUrl}
                  coverUrl={coverUrl}
                  isActive={index === activeIndex && stationaryFor500ms}
                  postIsInCenter={isInCenter}
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
              key={`dot-${index}`}
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
    backgroundColor: '#000',
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  image: {
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  errorText: {
    color: '#666',
    marginTop: 8,
    fontSize: 14,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 16,
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
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default MediaCarousel;
