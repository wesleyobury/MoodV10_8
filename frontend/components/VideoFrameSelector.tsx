import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';

// Safely import expo-video-thumbnails - it can crash on production iOS builds
let VideoThumbnails: any = null;
let videoThumbnailsAvailable = false;

// Wrap in try-catch to prevent crashes on module load
try {
  VideoThumbnails = require('expo-video-thumbnails');
  videoThumbnailsAvailable = true;
} catch (error) {
  console.warn('expo-video-thumbnails not available:', error);
  videoThumbnailsAvailable = false;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FILMSTRIP_HEIGHT = 56;
const FRAME_COUNT = 10;
const TOTAL_FRAMES = 30;
const FILMSTRIP_WIDTH = SCREEN_WIDTH - 32;
const SCRUBBER_WIDTH = 4;

// Crop window dimensions (4:5 aspect ratio - Instagram style)
const CROP_ASPECT_RATIO = 4 / 5;
const CROP_WIDTH = SCREEN_WIDTH - 48; // Crop window width with padding
const CROP_HEIGHT = CROP_WIDTH / CROP_ASPECT_RATIO; // 4:5 crop window

// Preview container - large enough to show the full video with room for pan/zoom
const PREVIEW_CONTAINER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.55, 500);

interface VideoFrameSelectorProps {
  videoUri: string;
  onFrameSelected: (frameUri: string) => void;
  onCancel: () => void;
  currentCover?: string;
}

interface Frame {
  uri: string;
  timestamp: number;
}

const VideoFrameSelector: React.FC<VideoFrameSelectorProps> = memo(({
  videoUri,
  onFrameSelected,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const [duration, setDuration] = useState(0);
  const [allFrames, setAllFrames] = useState<Frame[]>([]);
  const [isLoadingFrames, setIsLoadingFrames] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 1080, height: 1920 });
  
  // Calculate the display dimensions for the full video frame
  // Video fills width, height is proportional to maintain aspect ratio
  const videoAspectRatio = imageSize.height / imageSize.width;
  const displayWidth = SCREEN_WIDTH - 32; // Full width with padding
  const displayHeight = displayWidth * videoAspectRatio; // Maintain video aspect ratio

  // Reanimated shared values for smooth gestures
  const scrubberX = useSharedValue(FILMSTRIP_WIDTH / 2);
  
  // Image transform - start at scale where the video fits the crop window
  // We want the video to be draggable/zoomable relative to the fixed crop window
  const imageScale = useSharedValue(1);
  const imageTranslateX = useSharedValue(0);
  const imageTranslateY = useSharedValue(0);
  
  // Saved values for gesture continuity
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Update frame index from scrubber position
  const updateFrameFromScrubber = useCallback((x: number) => {
    if (allFrames.length === 0) return;
    const percentage = Math.max(0, Math.min(x / FILMSTRIP_WIDTH, 1));
    const index = Math.round(percentage * (allFrames.length - 1));
    setCurrentFrameIndex(Math.max(0, Math.min(index, allFrames.length - 1)));
  }, [allFrames.length]);

  // Scrubber pan gesture
  const scrubberGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newX = Math.max(0, Math.min(event.x, FILMSTRIP_WIDTH));
      scrubberX.value = newX;
      runOnJS(updateFrameFromScrubber)(newX);
    })
    .onEnd(() => {
      if (allFrames.length > 0) {
        const percentage = scrubberX.value / FILMSTRIP_WIDTH;
        const index = Math.round(percentage * (allFrames.length - 1));
        const snappedX = (index / (allFrames.length - 1)) * FILMSTRIP_WIDTH;
        scrubberX.value = withTiming(snappedX, { duration: 100 });
      }
    });

  // Tap gesture for filmstrip
  const tapGesture = Gesture.Tap()
    .onEnd((event) => {
      const newX = Math.max(0, Math.min(event.x, FILMSTRIP_WIDTH));
      scrubberX.value = withTiming(newX, { duration: 150 });
      runOnJS(updateFrameFromScrubber)(newX);
    });

  const filmstripGesture = Gesture.Race(scrubberGesture, tapGesture);

  // Pinch-to-zoom gesture - allows zooming in/out on the full video
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = imageScale.value;
    })
    .onUpdate((event) => {
      // Allow zooming from 0.5x (see more of video) to 4x (zoom in detail)
      const newScale = Math.max(0.5, Math.min(savedScale.value * event.scale, 4));
      imageScale.value = newScale;
    })
    .onEnd(() => {
      // Clamp to reasonable bounds
      if (imageScale.value < 0.5) {
        imageScale.value = withSpring(0.5);
      }
    });

  // Pan gesture - drag the full video to position it within the crop window
  const imagePanGesture = Gesture.Pan()
    .onStart(() => {
      savedTranslateX.value = imageTranslateX.value;
      savedTranslateY.value = imageTranslateY.value;
    })
    .onUpdate((event) => {
      // Calculate how much of the video extends beyond the crop window
      const scale = imageScale.value;
      const scaledWidth = displayWidth * scale;
      const scaledHeight = displayHeight * scale;
      
      // Maximum pan distance - allow panning until the edge of video meets crop window edge
      const maxTranslateX = Math.max(0, (scaledWidth - CROP_WIDTH) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - CROP_HEIGHT) / 2);
      
      imageTranslateX.value = Math.max(-maxTranslateX, Math.min(maxTranslateX, 
        savedTranslateX.value + event.translationX));
      imageTranslateY.value = Math.max(-maxTranslateY, Math.min(maxTranslateY, 
        savedTranslateY.value + event.translationY));
    })
    .onEnd(() => {
      // Snap back if out of bounds
      const scale = imageScale.value;
      const scaledWidth = displayWidth * scale;
      const scaledHeight = displayHeight * scale;
      const maxTranslateX = Math.max(0, (scaledWidth - CROP_WIDTH) / 2);
      const maxTranslateY = Math.max(0, (scaledHeight - CROP_HEIGHT) / 2);
      
      if (Math.abs(imageTranslateX.value) > maxTranslateX) {
        imageTranslateX.value = withSpring(Math.sign(imageTranslateX.value) * maxTranslateX);
      }
      if (Math.abs(imageTranslateY.value) > maxTranslateY) {
        imageTranslateY.value = withSpring(Math.sign(imageTranslateY.value) * maxTranslateY);
      }
    });

  // Combined gesture
  const imageGesture = Gesture.Simultaneous(pinchGesture, imagePanGesture);

  // Animated styles - transform the image
  const scrubberAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrubberX.value - SCRUBBER_WIDTH / 2 }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    width: displayWidth,
    height: displayHeight,
    transform: [
      { scale: imageScale.value },
      { translateX: imageTranslateX.value },
      { translateY: imageTranslateY.value },
    ],
  }));

  // Generate frames
  useEffect(() => {
    if (duration > 0 && allFrames.length === 0) {
      generateFrames();
    }
  }, [duration]);

  const generateFrames = async () => {
    // Skip on web platform
    if (Platform.OS === 'web') {
      setIsLoadingFrames(false);
      return;
    }
    
    // Check if VideoThumbnails module is available
    if (!videoThumbnailsAvailable || !VideoThumbnails) {
      console.warn('VideoThumbnails not available - using fallback');
      setError('Frame selection not available on this device. Please select a cover from your library instead.');
      setIsLoadingFrames(false);
      return;
    }

    try {
      setIsLoadingFrames(true);
      const frames: Frame[] = [];
      const interval = duration / TOTAL_FRAMES;

      for (let i = 0; i < TOTAL_FRAMES; i++) {
        try {
          const timestamp = Math.round(i * interval);
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
            time: timestamp,
            quality: 0.8,
          });
          frames.push({ uri, timestamp });
          
          // Get image dimensions from first frame
          if (i === 0) {
            Image.getSize(uri, (w, h) => {
              setImageSize({ width: w, height: h });
            }, () => {});
          }
        } catch (e) {
          console.warn('Frame generation error at index', i, e);
          if (frames.length > 0) {
            frames.push({ ...frames[frames.length - 1] });
          }
        }
      }

      setAllFrames(frames);
      if (frames.length > 0) {
        const mid = Math.floor(frames.length / 2);
        setCurrentFrameIndex(mid);
        scrubberX.value = (mid / (frames.length - 1)) * FILMSTRIP_WIDTH;
      } else {
        setError('Could not generate frames from video');
      }
    } catch (err) {
      console.error('Frame generation failed:', err);
      setError('Failed to generate frames. Please select a cover from your library instead.');
    } finally {
      setIsLoadingFrames(false);
    }
  };

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (status.isLoaded && status.durationMillis) {
      setDuration(status.durationMillis);
    }
  }, []);

  const resetTransform = () => {
    imageScale.value = withSpring(1);
    imageTranslateX.value = withSpring(0);
    imageTranslateY.value = withSpring(0);
  };

  const handleDone = async () => {
    if (allFrames.length === 0 || !allFrames[currentFrameIndex]?.uri) return;
    setIsCapturing(true);
    
    try {
      const sourceUri = allFrames[currentFrameIndex].uri;
      const scale = imageScale.value;
      const translateX = imageTranslateX.value;
      const translateY = imageTranslateY.value;
      
      // Original image dimensions
      const imgWidth = imageSize.width;
      const imgHeight = imageSize.height;
      
      // Calculate what portion of the original image is visible in the crop window
      // The crop window is CROP_WIDTH x CROP_HEIGHT on screen
      // The displayed video has dimensions displayWidth x displayHeight, scaled by 'scale'
      
      // Ratio between original image and displayed size
      const imgToDisplayRatio = imgWidth / displayWidth;
      
      // The crop window covers this area of the *scaled* display
      // At scale=1, if displayWidth=350 and CROP_WIDTH=340, the crop covers 340/350 = 97% of width
      // At scale=2, the video is 2x bigger, so crop covers half as much: 340/(350*2) = 48.5%
      
      const cropWidthInOriginal = (CROP_WIDTH / scale) * imgToDisplayRatio;
      const cropHeightInOriginal = (CROP_HEIGHT / scale) * imgToDisplayRatio;
      
      // Translate values are in screen coordinates, need to convert to original image coordinates
      const translateXInOriginal = (translateX / scale) * imgToDisplayRatio;
      const translateYInOriginal = (translateY / scale) * imgToDisplayRatio;
      
      // The crop is centered on the image, then offset by translation
      // Negative translation = user moved image left, so crop should move right (positive originX)
      const centerX = imgWidth / 2;
      const centerY = imgHeight / 2;
      
      const cropX = centerX - (cropWidthInOriginal / 2) - translateXInOriginal;
      const cropY = centerY - (cropHeightInOriginal / 2) - translateYInOriginal;
      
      // Clamp to valid bounds
      const finalCropX = Math.max(0, Math.min(cropX, imgWidth - cropWidthInOriginal));
      const finalCropY = Math.max(0, Math.min(cropY, imgHeight - cropHeightInOriginal));
      const finalCropWidth = Math.min(cropWidthInOriginal, imgWidth - finalCropX);
      const finalCropHeight = Math.min(cropHeightInOriginal, imgHeight - finalCropY);
      
      // Apply the crop
      const result = await ImageManipulator.manipulateAsync(
        sourceUri,
        [
          {
            crop: {
              originX: Math.round(finalCropX),
              originY: Math.round(finalCropY),
              width: Math.round(finalCropWidth),
              height: Math.round(finalCropHeight),
            },
          },
          { resize: { width: 1080 } },
        ],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.9 }
      );
      onFrameSelected(result.uri);
    } catch (err) {
      console.error('Error processing cover:', err);
      onFrameSelected(allFrames[currentFrameIndex].uri);
    } finally {
      setIsCapturing(false);
    }
  };

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
  };

  const currentFrame = allFrames[currentFrameIndex];
  const filmstripFrames = allFrames.filter((_, i) => i % Math.max(1, Math.floor(TOTAL_FRAMES / FRAME_COUNT)) === 0).slice(0, FRAME_COUNT);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cover</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.grayText}>Cover selection is only available on mobile</Text>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerBtn}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cover</Text>
          <TouchableOpacity 
            onPress={handleDone} 
            style={styles.headerBtn}
            disabled={isCapturing || isLoadingFrames}
          >
            {isCapturing ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Text style={[styles.doneText, isLoadingFrames && styles.disabledText]}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Preview Area - Instagram-style: full video with fixed crop overlay */}
        <View style={styles.previewSection}>
          {/* Container with overflow hidden to keep video within bounds */}
          <View style={[styles.previewContainer, { height: PREVIEW_CONTAINER_HEIGHT }]}>
            <GestureDetector gesture={imageGesture}>
              <View style={styles.gestureArea}>
                {isLoadingFrames ? (
                  <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>Loading frames...</Text>
                  </View>
                ) : currentFrame?.uri ? (
                  <Animated.View style={[styles.imageWrapper, imageAnimatedStyle]}>
                    <Image 
                      source={{ uri: currentFrame.uri }} 
                      style={styles.fullImage} 
                      resizeMode="cover"
                    />
                  </Animated.View>
                ) : (
                  <View style={styles.centered}>
                    <Text style={styles.grayText}>No preview</Text>
                  </View>
                )}
              </View>
            </GestureDetector>
            
            {/* Fixed crop window overlay - positioned in center */}
            <View style={styles.overlayContainer} pointerEvents="none">
              {/* Top dark area */}
              <View style={[styles.darkOverlay, { height: (PREVIEW_CONTAINER_HEIGHT - CROP_HEIGHT) / 2 }]} />
              
              {/* Middle row with sides and crop window */}
              <View style={styles.middleRow}>
                <View style={[styles.darkOverlay, { width: (SCREEN_WIDTH - 32 - CROP_WIDTH) / 2 }]} />
                <View style={[styles.cropWindow, { width: CROP_WIDTH, height: CROP_HEIGHT }]}>
                  {/* Corner indicators */}
                  <View style={[styles.corner, styles.tl]} />
                  <View style={[styles.corner, styles.tr]} />
                  <View style={[styles.corner, styles.bl]} />
                  <View style={[styles.corner, styles.br]} />
                </View>
                <View style={[styles.darkOverlay, { width: (SCREEN_WIDTH - 32 - CROP_WIDTH) / 2 }]} />
              </View>
              
              {/* Bottom dark area */}
              <View style={[styles.darkOverlay, { height: (PREVIEW_CONTAINER_HEIGHT - CROP_HEIGHT) / 2 }]} />
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetTransform}>
              <Ionicons name="refresh" size={16} color="#FFD700" />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <Text style={styles.hintText}>Pinch to zoom • Drag to position</Text>
          </View>

          {/* Time badge */}
          {currentFrame && (
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{formatTime(currentFrame.timestamp)}</Text>
            </View>
          )}
        </View>

        {/* Hidden video for duration */}
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={styles.hiddenVideo}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={false}
          isMuted
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />

        {/* Filmstrip */}
        <View style={styles.filmstripSection}>
          <Text style={styles.filmstripLabel}>Slide to choose frame</Text>
          
          <GestureDetector gesture={filmstripGesture}>
            <View style={styles.filmstripTouchArea}>
              <View style={styles.filmstrip}>
                {isLoadingFrames ? (
                  <View style={styles.filmstripLoading}>
                    <ActivityIndicator size="small" color="#FFD700" />
                  </View>
                ) : (
                  filmstripFrames.map((frame, i) => (
                    <View key={i} style={styles.filmstripFrame}>
                      {frame?.uri && <Image source={{ uri: frame.uri }} style={styles.filmstripImg} />}
                    </View>
                  ))
                )}
              </View>
              
              {/* Scrubber */}
              {!isLoadingFrames && allFrames.length > 0 && (
                <Animated.View style={[styles.scrubber, scrubberAnimatedStyle]}>
                  <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.scrubberBar} />
                  <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.scrubberKnob}>
                    <View style={styles.scrubberDot} />
                  </LinearGradient>
                </Animated.View>
              )}
            </View>
          </GestureDetector>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>0:00</Text>
            <Text style={styles.timeLabel}>{formatTime(duration)}</Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorBar}>
            <Ionicons name="warning" size={14} color="#FF6B6B" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.footer}>Move and zoom the video to position it within the crop frame</Text>
      </View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 12, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#333' 
  },
  headerBtn: { width: 60, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#fff' },
  doneText: { fontSize: 16, fontWeight: '600', color: '#FFD700' },
  disabledText: { color: '#555' },
  
  previewSection: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  previewContainer: { 
    width: SCREEN_WIDTH - 32, 
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  gestureArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: { 
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: { 
    width: '100%', 
    height: '100%',
  },
  
  // Overlay system
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: CROP_HEIGHT,
  },
  cropWindow: {
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.7)',
    backgroundColor: 'transparent',
  },
  corner: { 
    position: 'absolute', 
    width: 24, 
    height: 24, 
    borderColor: '#FFD700' 
  },
  tl: { top: -1, left: -1, borderLeftWidth: 3, borderTopWidth: 3 },
  tr: { top: -1, right: -1, borderRightWidth: 3, borderTopWidth: 3 },
  bl: { bottom: -1, left: -1, borderLeftWidth: 3, borderBottomWidth: 3 },
  br: { bottom: -1, right: -1, borderRightWidth: 3, borderBottomWidth: 3 },
  
  controlsRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 12, 
    gap: 12 
  },
  resetBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,215,0,0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 14, 
    gap: 4 
  },
  resetText: { color: '#FFD700', fontSize: 13, fontWeight: '500' },
  hintText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  
  timeBadge: { 
    position: 'absolute', 
    top: 20, 
    right: 28, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12 
  },
  timeText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  
  hiddenVideo: { width: 1, height: 1, position: 'absolute', opacity: 0 },
  
  filmstripSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  filmstripLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 10 },
  filmstripTouchArea: { height: FILMSTRIP_HEIGHT + 28, justifyContent: 'center' },
  filmstrip: { 
    flexDirection: 'row', 
    height: FILMSTRIP_HEIGHT, 
    borderRadius: 6, 
    overflow: 'hidden', 
    backgroundColor: '#1a1a1a' 
  },
  filmstripLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filmstripFrame: { flex: 1, height: FILMSTRIP_HEIGHT, backgroundColor: '#222' },
  filmstripImg: { width: '100%', height: '100%' },
  
  scrubber: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    height: FILMSTRIP_HEIGHT + 28, 
    alignItems: 'center' 
  },
  scrubberBar: { width: SCRUBBER_WIDTH, height: FILMSTRIP_HEIGHT + 16, marginTop: 6, borderRadius: 2 },
  scrubberKnob: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: -4 
  },
  scrubberDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#000' },
  
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timeLabel: { fontSize: 11, color: '#555' },
  
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#666', fontSize: 14 },
  grayText: { color: '#888', fontSize: 14, textAlign: 'center' },
  
  errorBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(255,107,107,0.15)', 
    paddingVertical: 8, 
    marginHorizontal: 16, 
    borderRadius: 8, 
    gap: 6 
  },
  errorText: { color: '#FF6B6B', fontSize: 12 },
  
  footer: { 
    fontSize: 12, 
    color: 'rgba(255,255,255,0.3)', 
    textAlign: 'center', 
    paddingHorizontal: 32, 
    paddingBottom: 12 
  },
});

export default VideoFrameSelector;
