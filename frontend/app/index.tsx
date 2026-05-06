import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaskedView from '@react-native-masked-view/masked-view';

const { width, height } = Dimensions.get('window');
const PRIVACY_ACCEPTED_KEY = 'privacy_policy_accepted';

// Animated Feature Item Component
const AnimatedFeatureItem = ({ icon, title, description, delay = 0 }: { 
  icon: any; 
  title: string; 
  description: string; 
  delay?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animation after delay
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 2,
              duration: 450,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(3500), // Wait 3.5 seconds before next animation
        ])
      ).start();
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  // Interpolate rotation for simple Z-axis rotation
  const rotateZ = rotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  return (
    <View style={styles.featureItem}>
      <Animated.View 
        style={[
          styles.featureIcon,
          { 
            transform: [
              { scale: scaleAnim },
              { rotate: rotateZ }
            ] 
          }
        ]}
      >
        <Ionicons name={icon} size={24} color='#FFD700' />
      </Animated.View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
};

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState<boolean | null>(null);

  useEffect(() => {
    checkPrivacyAccepted();
  }, []);

  const checkPrivacyAccepted = async () => {
    try {
      const accepted = await AsyncStorage.getItem(PRIVACY_ACCEPTED_KEY);
      if (accepted === 'true') {
        setHasAcceptedPrivacy(true);
      } else {
        setHasAcceptedPrivacy(false);
        setShowPrivacyModal(true);
      }
    } catch (error) {
      console.error('Error checking privacy acceptance:', error);
      setHasAcceptedPrivacy(false);
      setShowPrivacyModal(true);
    }
  };

  const handleAcceptPrivacy = async () => {
    try {
      await AsyncStorage.setItem(PRIVACY_ACCEPTED_KEY, 'true');
      setHasAcceptedPrivacy(true);
      setShowPrivacyModal(false);
      // Navigate to login after accepting privacy policy and terms
      router.push('/auth/login');
    } catch (error) {
      console.error('Error saving privacy acceptance:', error);
    }
  };

  const handleViewFullPolicy = () => {
    setShowPrivacyModal(false);
    router.push('/privacy-policy');
  };

  const handleViewTerms = () => {
    setShowPrivacyModal(false);
    router.push('/terms-of-service');
  };

  const handleGetStarted = () => {
    if (hasAcceptedPrivacy) {
      router.push('/auth/login');
    } else {
      setShowPrivacyModal(true);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Privacy Policy & Terms Modal */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Ionicons name="shield-checkmark" size={32} color="#FFD700" />
              </View>
              <Text style={styles.modalTitle}>Terms & Privacy</Text>
              <Text style={styles.modalSubtitle}>
                Please review our terms and privacy practices
              </Text>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* Zero Tolerance Notice */}
              <View style={styles.zeroToleranceNotice}>
                <View style={styles.zeroToleranceHeader}>
                  <Ionicons name="warning" size={20} color="#FF3B30" />
                  <Text style={styles.zeroToleranceTitle}>Community Guidelines</Text>
                </View>
                <Text style={styles.zeroToleranceText}>
                  We have <Text style={styles.boldText}>zero tolerance</Text> for objectionable content or abusive users. 
                  Violations result in immediate account suspension or ban.
                </Text>
              </View>

              <View style={styles.privacySummarySection}>
                <Text style={styles.privacySummaryTitle}>What we collect:</Text>
                
                <View style={styles.privacyItem}>
                  <View style={styles.privacyIconBadge}>
                    <Ionicons name="fitness" size={16} color="#FFD700" />
                  </View>
                  <View style={styles.privacyItemContent}>
                    <Text style={styles.privacyItemTitle}>Workout Data</Text>
                    <Text style={styles.privacyItemText}>
                      Exercise progress, equipment & difficulty preferences
                    </Text>
                  </View>
                </View>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyIconBadge}>
                    <Ionicons name="analytics" size={16} color="#FFD700" />
                  </View>
                  <View style={styles.privacyItemContent}>
                    <Text style={styles.privacyItemTitle}>App Usage</Text>
                    <Text style={styles.privacyItemText}>
                      Session data, navigation patterns to improve experience
                    </Text>
                  </View>
                </View>

                <View style={styles.privacyItem}>
                  <View style={styles.privacyIconBadge}>
                    <Ionicons name="people" size={16} color="#FFD700" />
                  </View>
                  <View style={styles.privacyItemContent}>
                    <Text style={styles.privacyItemTitle}>Social Activity</Text>
                    <Text style={styles.privacyItemText}>
                      Posts, likes, comments, and follows (when you use these features)
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.privacyNote}>
                <Ionicons name="information-circle" size={18} color="#888" />
                <Text style={styles.privacyNoteText}>
                  We never sell your data. Your information is used only to improve your fitness journey.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <View style={styles.policyLinksRow}>
                <TouchableOpacity 
                  style={styles.viewPolicyButton}
                  onPress={handleViewFullPolicy}
                >
                  <Ionicons name="document-text-outline" size={16} color="#FFD700" />
                  <Text style={styles.viewPolicyText}>Privacy Policy</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.viewPolicyButton}
                  onPress={handleViewTerms}
                >
                  <Ionicons name="reader-outline" size={16} color="#FFD700" />
                  <Text style={styles.viewPolicyText}>Terms of Service</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.agreementText}>
                By tapping 'Accept & Continue', you agree to our Terms of Service and Privacy Policy, 
                including our zero tolerance policy for objectionable content.
              </Text>

              <TouchableOpacity 
                style={styles.acceptButton}
                onPress={handleAcceptPrivacy}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.acceptButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.acceptButtonText}>Accept & Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.simplifiedGradient}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/images/header-logo.png')}
                style={styles.logoImage}
                resizeMode='contain'
              />
            </View>

            <View style={styles.titleContainer}>
              <MaskedView
                maskElement={
                  <Text style={styles.title}>MOOD</Text>
                }
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ width: 200, height: 70 }}
                />
              </MaskedView>
            </View>
            <Text style={styles.subtitle}>
              Curated workouts.{'\n'}Matched to your <Text style={styles.moodInlineText}>mood.</Text>
            </Text>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            <AnimatedFeatureItem
              icon="heart"
              title="Mood-Based Workouts"
              description="Six carefully curated mood profiles"
              delay={0}
            />
            <AnimatedFeatureItem
              icon="people"
              title="Social Community"
              description="Engage and share with other athletes"
              delay={1500}
            />
            <AnimatedFeatureItem
              icon="videocam"
              title="150+ Exercise Videos"
              description="Visual guides with coaching cues"
              delay={3000}
            />
            <AnimatedFeatureItem
              icon="trending-up"
              title="Track Progress"
              description='Monitor streaks and achievements'
              delay={4500}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleGetStarted}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c', // Dark background edge-to-edge
  },
  simplifiedGradient: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: height * 0.06, // Reduced from 0.1 to move content up
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  logoBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    letterSpacing: 2,
    textAlign: 'center',
  },
  titleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 22,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 30,
    letterSpacing: 0.3,
  },
  moodInlineText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFD700',
  },
  highlightText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  featuresSection: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingHorizontal: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#888',
  },
  actionSection: {
    paddingTop: 0,
    paddingBottom: 20,
    marginTop: -10,
  },
  primaryButton: {
    marginBottom: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c0c0c',
  },
  // Privacy Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalScroll: {
    maxHeight: 280,
  },
  privacySummarySection: {
    marginBottom: 16,
  },
  privacySummaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 12,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  privacyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  privacyItemContent: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  privacyItemText: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  privacyNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    marginLeft: 8,
    lineHeight: 18,
  },
  modalActions: {
    marginTop: 20,
  },
  zeroToleranceNotice: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  zeroToleranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  zeroToleranceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF3B30',
  },
  zeroToleranceText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#FF6B6B',
  },
  boldText: {
    fontWeight: '700',
  },
  policyLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  viewPolicyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
    gap: 6,
  },
  viewPolicyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFD700',
  },
  agreementText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 12,
  },
  acceptButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
});
