import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { isAnalyticsOptedOut, setAnalyticsOptOut } from '../utils/analytics';
import BackButton from '../components/BackButton';

import { API_URL } from '../utils/apiConfig';
const SUPPORT_EMAIL = 'wesleyogsbury@gmail.com';

// External URLs for legal pages
const EXTERNAL_URLS = {
  termsOfService: 'https://sites.google.com/d/1IPxI-2TCXeIgIKQKjxcRcoUJNHNBjXHD/p/17nmyUORjDmp4upUwI8cMvfIRkuX_0oCv/edit',
  privacyPolicy: 'https://sites.google.com/d/1IPxI-2TCXeIgIKQKjxcRcoUJNHNBjXHD/p/11e7szlqI_qIfmgCEeE8yOhX5lJrAHwYb/edit',
  support: 'https://sites.google.com/d/1IPxI-2TCXeIgIKQKjxcRcoUJNHNBjXHD/p/1XhjibxEnt0V15xx32MICmpK3BnO4cNFh/edit',
};

export default function Settings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, logout, user, updateUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  
  // Analytics opt-out state
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  
  // Credentials modal state
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Push notification debug state
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [pushRegistering, setPushRegistering] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>('unknown');

  // Admin debug info (temporary)
  const isAdmin = user?.username === 'officialmoodapp';
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (!isAdmin) return;
    const { NativeModules } = require('react-native');
    const Consts = require('expo-constants').default;
    const build = `BUILD: ${Consts.nativeBuildVersion} / ${Consts.nativeAppVersion}`;
    const hasML = `HAS ExpoMediaLibrary: ${!!NativeModules?.ExpoMediaLibrary}`;
    console.log(build);
    console.log(hasML);
    setDebugInfo(`${build}\n${hasML}`);
  }, [isAdmin]);

  // Load existing push token from storage on mount
  useEffect(() => {
    const loadToken = async () => {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const storedToken = await AsyncStorage.getItem('mood_push_token');
        if (storedToken) {
          setPushToken(storedToken);
          setPushStatus('registered');
        }
        const permStatus = await AsyncStorage.getItem('mood_notification_permission');
        if (permStatus === 'denied') setPushStatus('denied');
      } catch {}
    };
    loadToken();
  }, []);

  // Load analytics opt-out preference on mount
  useEffect(() => {
    const loadAnalyticsPreference = async () => {
      const optedOut = await isAnalyticsOptedOut();
      setAnalyticsEnabled(!optedOut);
    };
    loadAnalyticsPreference();
  }, []);

  // Handle analytics toggle
  const handleAnalyticsToggle = async (enabled: boolean) => {
    setAnalyticsEnabled(enabled);
    await setAnalyticsOptOut(!enabled);
  };

  const handleUpdateCredentials = async () => {
    // Validation
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (!newUsername && !newEmail && !newPassword) {
      Alert.alert('Error', 'Please provide at least one field to update');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_URL}/api/users/me/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_username: newUsername || null,
          new_email: newEmail || null,
          new_password: newPassword || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local user state if username changed
        if (newUsername && updateUser) {
          updateUser({ username: newUsername });
        }
        if (newEmail && updateUser) {
          updateUser({ email: newEmail });
        }
        
        Alert.alert('Success', 'Your credentials have been updated successfully');
        resetCredentialsForm();
        setShowCredentialsModal(false);
      } else {
        Alert.alert('Error', data.detail || 'Failed to update credentials');
      }
    } catch (error) {
      console.error('Update credentials error:', error);
      Alert.alert('Error', 'Failed to update credentials. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const resetCredentialsForm = () => {
    setCurrentPassword('');
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  const handleContactSupport = async () => {
    const subject = encodeURIComponent('Support request - MOOD');
    const body = encodeURIComponent(`Hi,\n\nI need help with:\n\n\n---\nUser: ${user?.username || 'Unknown'}\nApp Version: 1.0.0`);
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Contact Support',
          `Please email us at:\n${SUPPORT_EMAIL}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Contact Support',
        `Please email us at:\n${SUPPORT_EMAIL}`,
        [{ text: 'OK' }]
      );
    }
  };

  const openExternalUrl = async (url: string, fallbackMessage: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to Open', fallbackMessage);
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open the link. Please try again.');
    }
  };

  const handleSubmitFeedback = async () => {
    const subject = encodeURIComponent('MOOD feedback');
    const body = encodeURIComponent(`Hi,\n\nI'd like to share the following feedback:\n\n\n---\nUser: ${user?.username || 'Unknown'}\nApp Version: 1.0.0`);
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    
    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Submit Feedback',
          `Please email your feedback to:\n${SUPPORT_EMAIL}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Submit Feedback',
        `Please email your feedback to:\n${SUPPORT_EMAIL}`,
        [{ text: 'OK' }]
      );
    }
  };

  const sendFeedbackEmail = async (feedback: string, type: string) => {
    const subject = encodeURIComponent('Support request - MOOD');
    const body = encodeURIComponent(`Feedback Type: ${type}\n\nFeedback:\n${feedback}`);
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
    
    const supported = await Linking.canOpenURL(mailtoUrl);
    if (supported) {
      await Linking.openURL(mailtoUrl);
    }
  };

  const handleDeleteAccount = () => {
    // First, ask user to reconsider
    Alert.alert(
      "We're sad to see you go! 😢",
      'Before you delete your account, would you consider sharing feedback with us? Your input helps us improve the app for everyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Feedback',
          onPress: () => {
            // Navigate to feedback or show feedback modal
            Alert.prompt(
              'Share Your Feedback',
              'What could we do better? Your feedback is valuable to us.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Submit & Stay',
                  onPress: async (feedback) => {
                    if (feedback) {
                      await sendFeedbackEmail(feedback, 'Account Deletion Prevented - User Stayed');
                    }
                    Alert.alert('Thank You! 🙏', "We appreciate your feedback and are glad you're staying!");
                  },
                },
                {
                  text: 'Submit & Delete',
                  style: 'destructive',
                  onPress: async (feedback) => {
                    if (feedback) {
                      await sendFeedbackEmail(feedback, 'Account Deletion Feedback');
                    }
                    confirmDeleteAccount();
                  },
                },
              ],
              'plain-text',
              '',
              'default'
            );
          },
        },
        {
          text: 'Delete Anyway',
          style: 'destructive',
          onPress: () => {
            // Final confirmation
            Alert.alert(
              'Final Confirmation',
              'This action is permanent. All your posts, workouts, and data will be permanently deleted. Are you absolutely sure?',
              [
                { text: 'Keep My Account', style: 'cancel' },
                {
                  text: 'Yes, Delete Everything',
                  style: 'destructive',
                  onPress: confirmDeleteAccount,
                },
              ]
            );
          },
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert(
          'Account Deleted',
          'Your account has been successfully deleted.',
          [
            {
              text: 'OK',
              onPress: () => {
                logout();
                router.replace('/');
              },
            },
          ]
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        Alert.alert('Error', errorData.detail || 'Failed to delete account. Please try again.');
      }
    } catch (error) {
      console.error('Delete account error:', error);
      Alert.alert('Error', 'Failed to delete account. Please check your connection and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? 0 : 16 }]}>
        <BackButton />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => setShowCredentialsModal(true)}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="key-outline" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingsItemText}>Change Login Credentials</Text>
                <Text style={styles.settingsItemSubtext}>Update username, email, or password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color='#666' />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => router.push('/notification-settings')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="notifications-outline" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingsItemText}>Notifications</Text>
                <Text style={styles.settingsItemSubtext}>Manage push and in-app notifications</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color='#666' />
          </TouchableOpacity>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => router.push('/terms-of-service')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="document-text-outline" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingsItemText}>Terms of Service</Text>
                <Text style={styles.settingsItemSubtext}>View our terms and conditions</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color='#666' />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => router.push('/privacy-policy')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingsItemText}>Privacy Policy</Text>
                <Text style={styles.settingsItemSubtext}>How we handle your data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color='#666' />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => router.push('/community-guidelines')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="people-outline" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingsItemText}>Community Guidelines</Text>
                <Text style={styles.settingsItemSubtext}>Rules for a positive community</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color='#666' />
          </TouchableOpacity>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => openExternalUrl(EXTERNAL_URLS.support, 'Unable to open Support page. Please try again later.')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="help-circle-outline" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingsItemText}>Help Center</Text>
                <Text style={styles.settingsItemSubtext}>FAQs and support resources</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={handleSubmitFeedback}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="chatbox-outline" size={20} color="#FFD700" />
              <Text style={styles.settingsItemText}>Submit Feedback</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={handleContactSupport}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="mail-outline" size={20} color="#FFD700" />
              <Text style={styles.settingsItemText}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color='#666' />
          </TouchableOpacity>
        </View>

        {/* Privacy & Safety Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Safety</Text>
          
          {/* Analytics Toggle - Apple Compliance */}
          <View style={styles.settingsItemWithSwitch}>
            <View style={styles.settingsItemLeft}>
              <Ionicons name="analytics-outline" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingsItemText}>Usage Analytics</Text>
                <Text style={styles.settingsItemSubtext}>Help improve MOOD with anonymous data</Text>
              </View>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={handleAnalyticsToggle}
              trackColor={{ false: '#3a3a3a', true: '#FFD700' }}
              thumbColor="#fff"
              ios_backgroundColor="#3a3a3a"
            />
          </View>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => router.push('/blocked-users')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="ban-outline" size={20} color='#FFD700' />
              <View>
                <Text style={styles.settingsItemText}>Blocked Users</Text>
                <Text style={styles.settingsItemSubtext}>Manage users you've blocked</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color='#666' />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={() => router.push('/content-filter')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="filter-outline" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingsItemText}>Content Filter</Text>
                <Text style={styles.settingsItemSubtext}>Hide content with specific keywords</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Account Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          
          <TouchableOpacity 
            style={styles.settingsItem}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
          >
            <View style={styles.settingsItemLeft}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFD700" />
              ) : (
                <Ionicons name="person-remove-outline" size={20} color="#FFD700" />
              )}
              <View>
                <Text style={styles.settingsItemText}>Delete Account</Text>
                <Text style={styles.settingsItemSubtext}>Remove your account and all data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color='#666' />
          </TouchableOpacity>
        </View>

        {/* Push Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          
          {/* Register / Enable button */}
          <TouchableOpacity
            style={styles.settingsItem}
            data-testid="push-register-btn"
            onPress={async () => {
              if (!token) {
                Alert.alert('Not Logged In', 'Please log in first to register for notifications.');
                return;
              }
              setPushRegistering(true);
              try {
                const { notificationService } = require('../utils/notifications');
                notificationService.setAuthToken(token);
                const newToken = await notificationService.registerForPushNotifications();
                if (newToken) {
                  setPushToken(newToken);
                  setPushStatus('registered');
                  Alert.alert('Success', 'Push notifications enabled and token registered to your account.');
                } else {
                  setPushStatus('denied');
                  Alert.alert('Permission Denied', 'Please enable notifications in your device Settings.');
                }
              } catch (err: any) {
                Alert.alert('Error', err?.message || 'Failed to register');
              } finally {
                setPushRegistering(false);
              }
            }}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons 
                name={pushStatus === 'registered' ? 'notifications' : 'notifications-outline'} 
                size={20} 
                color={pushStatus === 'registered' ? '#4CAF50' : '#FFD700'} 
              />
              <View>
                <Text style={styles.settingsItemText}>
                  {pushRegistering ? 'Registering...' : pushStatus === 'registered' ? 'Re-register Token' : 'Enable Notifications'}
                </Text>
                <Text style={[styles.settingsItemSubtext, { fontSize: 12, color: pushStatus === 'registered' ? '#4CAF50' : '#888' }]}>
                  {pushStatus === 'registered' ? 'Token registered to your account' : pushStatus === 'denied' ? 'Permission denied — check device Settings' : 'Tap to request permission & register'}
                </Text>
              </View>
            </View>
            {pushRegistering ? (
              <ActivityIndicator size="small" color="#FFD700" />
            ) : (
              <Ionicons name="chevron-forward" size={18} color="#666" />
            )}
          </TouchableOpacity>

          {/* Token display */}
          {pushToken && (
            <View style={styles.settingsItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsItemText}>Expo Push Token</Text>
                <Text 
                  selectable 
                  style={{ marginTop: 6, fontSize: 11, color: '#aaa', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}
                  data-testid="push-token-display"
                >
                  {pushToken}
                </Text>
              </View>
            </View>
          )}

          {/* Copy token */}
          {pushToken && (
            <TouchableOpacity
              style={styles.settingsItem}
              data-testid="push-copy-token-btn"
              onPress={async () => {
                try {
                  const ClipboardModule = require('expo-clipboard');
                  await ClipboardModule.setStringAsync(pushToken);
                } catch {
                  // expo-clipboard not available, token is selectable text
                }
                Alert.alert('Copied', 'Push token copied to clipboard');
              }}
            >
              <View style={styles.settingsItemLeft}>
                <Ionicons name="copy-outline" size={20} color="#FFD700" />
                <Text style={styles.settingsItemText}>Copy Token</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          )}

          {/* Test local notification */}
          <TouchableOpacity
            style={styles.settingsItem}
            data-testid="push-test-local-btn"
            onPress={async () => {
              try {
                const Notifications = require('expo-notifications');
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'MOOD Test Notification',
                    body: 'Push notifications are working!',
                    data: { type: 'test' },
                  },
                  trigger: null,
                });
                Alert.alert('Sent', 'Local test notification fired');
              } catch (err: any) {
                Alert.alert('Error', err?.message || 'Could not send notification');
              }
            }}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="notifications-circle-outline" size={20} color="#FFD700" />
              <Text style={styles.settingsItemText}>Test Local Notification</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton}
          onPress={() => {
            Alert.alert(
              'Sign Out',
              'Are you sure you want to sign out?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Sign Out', 
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                    router.replace('/auth/login');
                  }
                },
              ]
            );
          }}
        >
          <Ionicons name="log-out-outline" size={18} color="#FFD700" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Terms of Service Modal */}
      <Modal
        visible={showTerms}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTerms(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowTerms(false)}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Terms of Service</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.termsContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.termsLastUpdated}>Last Updated: December 2025</Text>
            
            <Text style={styles.termsHeading}>1. Acceptance of Terms</Text>
            <Text style={styles.termsText}>
              By accessing and using this fitness application ('App'), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use the App.
            </Text>

            <Text style={styles.termsHeading}>2. Description of Service</Text>
            <Text style={styles.termsText}>
              The App provides fitness tracking, workout planning, and social features designed to help users achieve their health and fitness goals. Features include workout logging, progress tracking, social sharing, and personalized workout recommendations.
            </Text>

            <Text style={styles.termsHeading}>3. User Accounts</Text>
            <Text style={styles.termsText}>
              To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate and complete information when creating your account.
            </Text>

            <Text style={styles.termsHeading}>4. User Content</Text>
            <Text style={styles.termsText}>
              You retain ownership of content you post through the App. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the App's services.
            </Text>
            <Text style={styles.termsText}>
              Users may only upload content they own or have the rights to. By uploading content, you represent and warrant that you have all necessary rights, including music rights.
            </Text>

            <Text style={styles.termsHeading}>5. Acceptable Use</Text>
            <Text style={styles.termsText}>
              You agree not to:{'\n'}
              • Post harmful, offensive, or inappropriate content{'\n'}
              • Harass, abuse, or harm other users{'\n'}
              • Attempt to gain unauthorized access to the App{'\n'}
              • Use the App for any illegal purposes{'\n'}
              • Interfere with the proper functioning of the App
            </Text>

            <Text style={styles.termsHeading}>6. Health Disclaimer</Text>
            <Text style={styles.termsText}>
              The App is for informational purposes only and is not intended as medical advice. Always consult with a qualified healthcare professional before starting any exercise program. You use the App and perform any exercises at your own risk.
            </Text>

            <Text style={styles.termsHeading}>7. Privacy</Text>
            <Text style={styles.termsText}>
              Your privacy is important to us. Our use of your personal information is governed by our Privacy Policy. By using the App, you consent to our collection and use of data as described in the Privacy Policy.
            </Text>

            <Text style={styles.termsHeading}>8. Intellectual Property</Text>
            <Text style={styles.termsText}>
              All content, features, and functionality of the App, including but not limited to text, graphics, logos, and software, are owned by us and are protected by intellectual property laws.
            </Text>

            <Text style={styles.termsHeading}>9. Termination</Text>
            <Text style={styles.termsText}>
              We reserve the right to terminate or suspend your account at any time for violations of these terms or for any other reason at our discretion. You may also delete your account at any time through the App settings.
            </Text>

            <Text style={styles.termsHeading}>10. Limitation of Liability</Text>
            <Text style={styles.termsText}>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
            </Text>

            <Text style={styles.termsHeading}>11. Changes to Terms</Text>
            <Text style={styles.termsText}>
              We may update these terms from time to time. We will notify users of any material changes. Your continued use of the App after changes constitutes acceptance of the new terms.
            </Text>

            <Text style={styles.termsHeading}>12. Contact</Text>
            <Text style={styles.termsText}>
              If you have questions about these Terms of Service, please contact us at {SUPPORT_EMAIL}.
            </Text>

            <View style={styles.termsFooter} />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Change Credentials Modal */}
      <Modal
        visible={showCredentialsModal}
        animationType="slide"
        presentationStyle='pageSheet'
        onRequestClose={() => {
          resetCredentialsForm();
          setShowCredentialsModal(false);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => {
                  resetCredentialsForm();
                  setShowCredentialsModal(false);
                }}
              >
                <Ionicons name="close" size={28} color='#fff' />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Credentials</Text>
              <View style={styles.placeholder} />
            </View>
            
            <ScrollView style={styles.credentialsContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.credentialsDescription}>
                Update your login information below. You'll need to enter your current password to make any changes.
              </Text>

              {/* Current Password - Required */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Current Password *</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.credentialInput}
                    placeholder="Enter current password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    autoCapitalize='none'
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <Ionicons 
                      name={showCurrentPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.dividerLine} />

              {/* New Username */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>New Username</Text>
                <TextInput
                  style={styles.credentialInput}
                  placeholder={user?.username || "Enter new username"}
                  placeholderTextColor="#666"
                  value={newUsername}
                  onChangeText={setNewUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* New Email */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>New Email</Text>
                <TextInput
                  style={styles.credentialInput}
                  placeholder={user?.email || "Enter new email"}
                  placeholderTextColor="#666"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                />
              </View>

              {/* New Password */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.credentialInput}
                    placeholder="Enter new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize='none'
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons 
                      name={showNewPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm New Password */}
              {newPassword ? (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.credentialInput}
                    placeholder="Confirm new password"
                    placeholderTextColor="#666"
                    secureTextEntry={!showNewPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize='none'
                  />
                </View>
              ) : null}

              <Text style={styles.credentialsNote}>
                Leave fields empty if you don't want to change them. Only fill in what you want to update.
              </Text>

              {/* Update Button */}
              <TouchableOpacity
                style={[
                  styles.updateButton,
                  (!currentPassword || isUpdating) && styles.updateButtonDisabled
                ]}
                onPress={handleUpdateCredentials}
                disabled={!currentPassword || isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color='#000' />
                ) : (
                  <Text style={styles.updateButtonText}>Update Credentials</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    paddingLeft: 4,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingsItemWithSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsItemText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  deleteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  deleteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  deleteTextContainer: {
    flexDirection: 'column',
  },
  deleteText: {
    fontSize: 15,
    color: '#999',
    fontWeight: '500',
  },
  deleteSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  appVersion: {
    fontSize: 13,
    color: '#666',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 40,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  signOutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  termsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  termsLastUpdated: {
    fontSize: 13,
    color: '#888',
    marginTop: 20,
    marginBottom: 24,
  },
  termsHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  termsText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
  },
  termsFooter: {
    height: 40,
  },
  // Credentials Modal Styles
  credentialsContent: {
    flex: 1,
    padding: 20,
  },
  credentialsDescription: {
    fontSize: 15,
    color: '#999',
    lineHeight: 22,
    marginBottom: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  credentialInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    padding: 4,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  credentialsNote: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  updateButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 40,
  },
  updateButtonDisabled: {
    backgroundColor: '#333',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  settingsItemSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
