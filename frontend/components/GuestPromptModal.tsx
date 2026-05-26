import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { GuestAnalytics } from '../utils/analytics';

const { width } = Dimensions.get('window');

// External URLs for legal pages
const EXTERNAL_URLS = {
  termsOfService: 'https://sites.google.com/d/1IPxI-2TCXeIgIKQKjxcRcoUJNHNBjXHD/p/17nmyUORjDmp4upUwI8cMvfIRkuX_0oCv/edit',
  privacyPolicy: 'https://sites.google.com/d/1IPxI-2TCXeIgIKQKjxcRcoUJNHNBjXHD/p/11e7szlqI_qIfmgCEeE8yOhX5lJrAHwYb/edit',
  support: 'https://sites.google.com/d/1IPxI-2TCXeIgIKQKjxcRcoUJNHNBjXHD/p/1XhjibxEnt0V15xx32MICmpK3BnO4cNFh/edit',
};

interface GuestPromptModalProps {
  visible: boolean;
  onClose: () => void;
  action?: string; // What action was attempted (e.g., "save workouts", "like posts")
}

export default function GuestPromptModal({ visible, onClose, action = 'use this feature' }: GuestPromptModalProps) {
  const insets = useSafeAreaInsets();
  const { exitGuestMode } = useAuth();

  const openExternalUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  // Track when the modal is shown
  useEffect(() => {
    if (visible && action) {
      GuestAnalytics.signupPromptShown({ trigger_action: action });
    }
  }, [visible, action]);

  const handleSignUp = async () => {
    // Track the click
    GuestAnalytics.signupPromptClicked({ trigger_action: action, destination: 'register' });
    
    // Exit guest mode and navigate to register
    await exitGuestMode();
    onClose();
    router.push('/auth/register');
  };

  const handleSignIn = async () => {
    // Track the click
    GuestAnalytics.signupPromptClicked({ trigger_action: action, destination: 'login' });
    
    // Exit guest mode and navigate to login
    await exitGuestMode();
    onClose();
    router.push('/auth/login');
  };

  const handleDismiss = () => {
    // Track the dismissal
    GuestAnalytics.signupPromptDismissed({ trigger_action: action });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
          {/* Close button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleDismiss}
          >
            <Ionicons name="close" size={24} color="#888" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.headerIconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="lock-closed" size={28} color="#0c0c0c" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Create an Account</Text>
            <Text style={styles.subtitle}>
              Sign up to {action} and unlock all features
            </Text>
          </View>

          {/* Benefits list */}
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.benefitIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="bookmark" size={14} color="#0c0c0c" />
                </LinearGradient>
              </View>
              <Text style={styles.benefitText}>Save your favorite workouts</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.benefitIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="trending-up" size={14} color="#0c0c0c" />
                </LinearGradient>
              </View>
              <Text style={styles.benefitText}>Track your progress & streaks</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.benefitIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="people" size={14} color="#0c0c0c" />
                </LinearGradient>
              </View>
              <Text style={styles.benefitText}>Connect with the community</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIconContainer}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.benefitIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="heart" size={14} color="#0c0c0c" />
                </LinearGradient>
              </View>
              <Text style={styles.benefitText}>Like, comment & follow others</Text>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.signUpButton}
              onPress={handleSignUp}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.signUpGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.signUpText}>Create Account</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signInButton}
              onPress={handleSignIn}
            >
              <Text style={styles.signInText}>I already have an account</Text>
            </TouchableOpacity>
          </View>

          {/* Continue as guest link */}
          <TouchableOpacity 
            style={styles.continueGuestButton}
            onPress={handleDismiss}
          >
            <Text style={styles.continueGuestText}>Continue browsing as guest</Text>
          </TouchableOpacity>

          {/* Legal Links */}
          <View style={styles.legalLinksContainer}>
            <View style={styles.legalDivider} />
            <View style={styles.legalLinks}>
              <TouchableOpacity 
                style={styles.legalLinkButton}
                onPress={() => {
                  onClose();
                  router.push('/terms-of-service');
                }}
              >
                <Ionicons name="document-text-outline" size={16} color="#888" />
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.legalLinkButton}
                onPress={() => {
                  onClose();
                  router.push('/privacy-policy');
                }}
              >
                <Ionicons name="shield-checkmark-outline" size={16} color="#888" />
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.legalLinkButton}
                onPress={() => openExternalUrl(EXTERNAL_URLS.support)}
              >
                <Ionicons name="help-circle-outline" size={16} color="#888" />
                <Text style={styles.legalLinkText}>Help Center</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    paddingTop: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  benefitsList: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  benefitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  benefitIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 15,
    color: '#ccc',
    marginLeft: 14,
  },
  actions: {
    marginBottom: 16,
  },
  signUpButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  signUpGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  signInButton: {
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  continueGuestButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueGuestText: {
    fontSize: 14,
    color: '#666',
  },
  legalLinksContainer: {
    marginTop: 8,
  },
  legalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  legalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  legalLinkText: {
    fontSize: 12,
    color: '#888',
  },
});
