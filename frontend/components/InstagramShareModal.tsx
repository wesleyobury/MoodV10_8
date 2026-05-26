import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH * 0.65;
const PREVIEW_HEIGHT = PREVIEW_WIDTH * 1.25; // 4:5 aspect ratio

interface InstagramShareModalProps {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  previewComponent: React.ReactNode;
  isExporting: boolean;
  previewImageUri?: string;
}

export default function InstagramShareModal({
  visible,
  onClose,
  onShare,
  previewComponent,
  isExporting,
  previewImageUri,
}: InstagramShareModalProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
      
      // Start shimmer animation
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Background overlay */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
      </Animated.View>

      {/* Modal content */}
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            paddingBottom: insets.bottom + 20,
          }
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Share</Text>
          <View style={styles.closeButton} />
        </View>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Animated.View style={[styles.previewContainer, { transform: [{ scale: scaleAnim }] }]}>
            {/* Glowing border effect */}
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.3)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glowBorder}
            />
            
            {/* Preview content */}
            <View style={styles.previewContent}>
              {previewImageUri ? (
                <Image 
                  source={{ uri: previewImageUri }} 
                  style={styles.previewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.previewPlaceholder}>
                  {previewComponent}
                </View>
              )}
            </View>
            
            {/* Premium badge */}
            <View style={styles.previewBadge}>
              <Text style={styles.previewBadgeText}>ACHIEVEMENT</Text>
            </View>
          </Animated.View>
        </View>

        {/* Share to Section */}
        <View style={styles.shareSection}>
          <Text style={styles.shareSectionTitle}>Share to</Text>
          
          <TouchableOpacity 
            style={styles.instagramShareButton}
            onPress={onShare}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <View style={styles.exportingContainer}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.exportingText}>Preparing...</Text>
              </View>
            ) : (
              <>
                {/* Shimmer overlay */}
                <Animated.View
                  style={[
                    styles.shimmerOverlay,
                    {
                      transform: [
                        {
                          translateX: shimmerAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-200, 200],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      'transparent',
                      'rgba(255, 255, 255, 0.15)',
                      'rgba(255, 255, 255, 0.25)',
                      'rgba(255, 255, 255, 0.15)',
                      'transparent',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
                
                {/* Instagram gradient background */}
                <LinearGradient
                  colors={['#833AB4', '#FD1D1D', '#F77737']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.instagramGradient}
                >
                  <Ionicons name="logo-instagram" size={24} color="#fff" />
                  <Text style={styles.instagramButtonText}>Instagram Stories</Text>
                  <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                </LinearGradient>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer hint */}
        <Text style={styles.footerHint}>
          Your achievement will be shared as a sticker overlay
        </Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  overlayTouchable: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: SCREEN_HEIGHT * 0.85,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  previewContainer: {
    width: PREVIEW_WIDTH + 8,
    height: PREVIEW_HEIGHT + 8,
    borderRadius: 16,
    padding: 4,
    position: 'relative',
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    opacity: 0.5,
  },
  previewContent: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.75 }],
  },
  previewBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  previewBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1,
  },
  shareSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  shareSectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  instagramShareButton: {
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
  },
  instagramGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  instagramButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  shimmerGradient: {
    width: 100,
    height: '100%',
  },
  exportingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  exportingText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  footerHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
});
