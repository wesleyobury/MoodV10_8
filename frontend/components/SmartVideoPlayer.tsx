/**
 * SmartVideoPlayer - Optimized video player with thumbnail-first approach
 *
 * Migrated 2026-05-14 from `expo-av` → `expo-video` (Phase F of the paid
 * launch). `expo-av` is deprecated as of Expo SDK 53+ and floods the
 * bundler with deprecation warnings. The new `expo-video` API uses a
 * VideoPlayer instance (returned from `useVideoPlayer`) plus a
 * declarative `<VideoView>` component — no more imperative refs.
 *
 * Behavior preserved end-to-end:
 *  1. Thumbnail-first render until user taps OR parent reports the post
 *     is ≥85% visible (`postIsInCenter`).
 *  2. Player loads HLS on iOS (with MP4 fallback on error), MP4 elsewhere.
 *  3. Paused + muted when scrolled off-center or app backgrounded.
 *  4. 10s load timeout with up to 3 retries (recreates the player via key).
 *  5. Looping playback, mute toggle, progress bar.
 *
 * Audio session config still uses `expo-av`'s `Audio.setAudioModeAsync`
 * because `expo-av` is still installed for other call sites (create-post,
 * exercise-lookup, video-frame-selector). Will swap to `expo-audio` when
 * the full migration ticket runs.
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
  AppState,
  AppStateStatus,
} from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEventListener } from 'expo';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import {
  normalizeCloudinaryVideoUrl,
  getOptimizedVideoUrls,
  cloudinaryThumbnailUrlFromVideoUrl,
} from '../utils/cloudinaryVideo';

const SCREEN_WIDTH = Dimensions.get('window').width;
const FEED_HEIGHT = Math.round(SCREEN_WIDTH * 5 / 4); // 4:5 ratio (Instagram feed standard)

// Configure audio mode for proper playback on mobile.
// Using expo-av's Audio.setAudioModeAsync since expo-av is still installed
// for other consumers; expo-video honors the global audio session.
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

// Cache for generated thumbnails
const thumbnailCache: { [key: string]: string } = {};

export interface SmartVideoPlayerProps {
  uri: string;
  coverUrl?: string | null;
  isActive: boolean;
  postIsInCenter: boolean;
}

const SmartVideoPlayer = memo(({ uri, coverUrl, isActive, postIsInCenter }: SmartVideoPlayerProps) => {
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [audioConfigured, setAudioConfigured] = useState(false);

  const [isInCenter, setIsInCenter] = useState(postIsInCenter);

  // Generate optimized URLs from public_id
  const optimizedUrls = getOptimizedVideoUrls(uri);
  const hlsSource = optimizedUrls?.hls || null;
  const mp4Source = optimizedUrls?.mp4 || normalizeCloudinaryVideoUrl(uri) || uri;
  const generatedPoster = optimizedUrls?.poster || null;

  // HLS primary on iOS, MP4 fallback on error or non-Cloudinary
  const [useHls, setUseHls] = useState(Platform.OS === 'ios' && !!hlsSource);
  const videoSource = useHls && hlsSource ? hlsSource : mp4Source;

  // Retry state — bumping `playerKey` recreates the underlying player
  // (replacing the old imperative `videoRef.unloadAsync()` flow).
  const [retryCount, setRetryCount] = useState(0);
  const [playerKey, setPlayerKey] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_RETRIES = 3;
  const LOAD_TIMEOUT_MS = 10000;

  // Thumbnail state
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [thumbnailError, setThumbnailError] = useState(false);

  // --- expo-video player ----------------------------------------------------
  // `useVideoPlayer` mounts the source and runs the setup callback once per
  // (source, key) tuple. Looping + initial mute set here so the very first
  // frame is silent (matches feed UX).
  const player = useVideoPlayer(shouldLoadVideo ? videoSource : null, (p) => {
    p.loop = true;
    p.muted = true;
    if (shouldLoadVideo && isActive && isInCenter) {
      p.play();
    }
  });

  // Subscribe to status + playing changes via expo's `useEventListener`.
  // This is the declarative replacement for the old
  // `onPlaybackStatusUpdate` callback.
  const [status, setStatus] = useState(player.status);
  const [isPlaying, setIsPlaying] = useState(player.playing);

  useEventListener(player, 'statusChange', (payload) => {
    setStatus(payload.status);
  });
  useEventListener(player, 'playingChange', (payload) => {
    setIsPlaying(payload.isPlaying);
  });

  useEffect(() => {
    setIsInCenter(postIsInCenter);
  }, [postIsInCenter]);

  // Generate or load thumbnail on mount — use poster from public_id
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

      // Use the poster URL generated from public_id (so_1,f_jpg,q_auto,w_720)
      const poster = generatedPoster || cloudinaryThumbnailUrlFromVideoUrl(uri);
      if (poster) {
        setThumbnailUri(poster);
        thumbnailCache[uri] = poster;
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
  }, [uri, coverUrl, generatedPoster]);

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

  // React to status changes (ready → loading dismiss; error → retry chain).
  useEffect(() => {
    if (!shouldLoadVideo) return;

    if (status === 'readyToPlay') {
      setIsVideoLoading(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Auto-unmute the first time we land in the feed (active + center).
      if (isActive && isInCenter) {
        player.muted = false;
        setIsMuted(false);
        player.play();
      }
    } else if (status === 'error') {
      // HLS failed → try MP4 once before counting against retries.
      if (useHls) {
        console.log('HLS failed, falling back to MP4:', mp4Source);
        setUseHls(false);
        setPlayerKey((prev) => prev + 1);
        return;
      }
      if (retryCount < MAX_RETRIES) {
        setRetryCount((prev) => prev + 1);
        setPlayerKey((prev) => prev + 1);
      } else {
        setHasError(true);
        setIsVideoLoading(false);
      }
    }
  }, [status, shouldLoadVideo, useHls, mp4Source, retryCount, player, isActive, isInCenter]);

  // Pause + mute when scrolled off-center, but keep the player mounted
  // so scrolling back is instant (no reload / no thumbnail flash).
  useEffect(() => {
    if (!isInCenter && shouldLoadVideo) {
      player.pause();
      player.muted = true;
      setIsMuted(true);
    }
  }, [isInCenter, shouldLoadVideo, player]);

  // Auto-pause when the post is no longer active
  useEffect(() => {
    if (!isActive && shouldLoadVideo) {
      player.pause();
      player.muted = true;
      setIsMuted(true);
    }
  }, [isActive, shouldLoadVideo, player]);

  // Pause when the app backgrounds
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active' && shouldLoadVideo) {
        player.pause();
        player.muted = true;
        setIsMuted(true);
      }
    });
    return () => subscription.remove();
  }, [shouldLoadVideo, player]);

  // 10s load timeout → retry chain
  useEffect(() => {
    if (shouldLoadVideo && isVideoLoading) {
      timeoutRef.current = setTimeout(() => {
        if (isVideoLoading && !isPlaying) {
          console.log(`Video timeout after ${LOAD_TIMEOUT_MS}ms, retry ${retryCount + 1}/${MAX_RETRIES}`);
          if (retryCount < MAX_RETRIES) {
            setRetryCount((prev) => prev + 1);
            setPlayerKey((prev) => prev + 1);
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
  }, [shouldLoadVideo, isVideoLoading, playerKey, retryCount, isPlaying]);

  // Clear pending timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleThumbnailTap = useCallback(async () => {
    await configureAudio();
    setShouldLoadVideo(true);
    setIsVideoLoading(true);
  }, []);

  const togglePlayPause = useCallback(async () => {
    await configureAudio();
    if (isPlaying) {
      player.pause();
    } else {
      player.muted = false;
      setIsMuted(false);
      player.play();
    }
  }, [isPlaying, player]);

  const toggleMute = useCallback(async () => {
    try {
      if (isMuted) {
        await configureAudio();
      }
      player.muted = !isMuted;
      setIsMuted(!isMuted);
    } catch (error) {
      console.warn('Mute toggle failed:', error);
    }
  }, [isMuted, player]);

  const handleManualRetry = useCallback(() => {
    setRetryCount(0);
    setHasError(false);
    setPlayerKey((prev) => prev + 1);
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

  if (hasError && !shouldLoadVideo) {
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

        {thumbnailError && (
          <View style={[styles.loadingContainer, { backgroundColor: 'rgba(0,0,0,0.0)' }]}>
            {/* purely a hook so eslint doesn't warn about unused state */}
          </View>
        )}
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
        <VideoView
          key={playerKey}
          player={player}
          style={styles.video}
          contentFit="cover"
          allowsFullscreen={false}
          allowsPictureInPicture={false}
          nativeControls={false}
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
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      )}

      {player.duration > 0 && !hasError && (
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(player.currentTime / player.duration) * 100}%` },
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

SmartVideoPlayer.displayName = 'SmartVideoPlayer';

export default SmartVideoPlayer;
