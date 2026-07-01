/**
 * ProfilePicPromptGate — persistent profile-picture nudge until avatar is set.
 *
 * Behavior:
 *  • Shows on authenticated home tabs (/, /explore, /profile) WITHOUT an avatar.
 *  • Waits until funnel + metrics are done — never blocks onboarding or the
 *    brief post-metrics workout handoff (mood-intro → workout picker).
 *  • Automatically dismisses when avatar is uploaded via any path.
 *  • "Maybe later" dismisses for the rest of this app session (until force-quit).
 *  • Shown at most once per session even if the user navigates between home tabs.
 *  • Once avatar is set, modal never shows again.
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSegments, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { API_URL } from '../utils/apiConfig';
import {
  isOnAuthenticatedHomeTab,
  shouldDeferProfilePicPrompt,
} from '../utils/onboardingFunnelDefer';

/** In-memory only — resets on cold start / app kill. */
let profilePicPromptShownThisSession = false;

export default function ProfilePicPromptGate() {
  const { user, token, updateUser } = useAuth();
  const { pendingTrigger } = useSubscription();
  const segments = useSegments();
  const pathname = usePathname();

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (pendingTrigger) setShowModal(false);
  }, [pendingTrigger]);

  useEffect(() => {
    const uid = user?.id;
    if (!uid || !token) {
      setShowModal(false);
      return;
    }
    if (user?.avatar) return;
    if (pendingTrigger) return;
    if (profilePicPromptShownThisSession) {
      setShowModal(false);
      return;
    }

    if (!isOnAuthenticatedHomeTab(segments, pathname)) {
      setShowModal(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const defer = await shouldDeferProfilePicPrompt({
        userId: uid,
        segments,
        pathname,
      });
      if (cancelled) return;
      if (defer) {
        setShowModal(false);
        return;
      }
      profilePicPromptShownThisSession = true;
      setShowModal(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    user?.avatar,
    token,
    segments,
    pathname,
    pendingTrigger,
  ]);

  useEffect(() => {
    if (user?.avatar) setShowModal(false);
  }, [user?.avatar]);

  const uploadAvatar = useCallback(
    async (uri: string) => {
      if (!token) return;
      setUploading(true);
      try {
        const res = await fetch(uri);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const uploadRes = await fetch(`${API_URL}/api/users/me/avatar-base64`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image_data: base64 }),
        });
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
        const data = await uploadRes.json();
        updateUser({ avatar: data.url });
        setShowModal(false);
      } catch (err) {
        console.error('ProfilePicPromptGate upload error:', err);
        Alert.alert('Upload failed', 'Could not save your picture. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [token, updateUser]
  );

  const handleAddNow = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need photo library access to set your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (err) {
      console.error('ProfilePicPromptGate picker error:', err);
    }
  }, [uploadAvatar]);

  const handleSkip = useCallback(() => {
    profilePicPromptShownThisSession = true;
    setShowModal(false);
  }, []);

  if (!user?.id || user.avatar) return null;

  return (
    <Modal
      visible={showModal}
      transparent
      animationType="fade"
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.card} data-testid="profile-pic-prompt-modal">
          <View style={styles.iconHaloWrap}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.32)', 'rgba(255, 140, 0, 0.05)']}
              style={styles.iconHalo}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <View style={styles.iconInner}>
              <Ionicons name="person-circle" size={56} color="#FFD700" />
            </View>
          </View>

          <Text style={styles.title}>Add a profile picture</Text>
          <Text style={styles.body}>
            People connect with faces. A profile pic makes your activity, posts and
            shared workouts stand out across MOOD.
          </Text>

          <TouchableOpacity
            style={styles.primaryBtnWrap}
            onPress={handleAddNow}
            disabled={uploading}
            activeOpacity={0.9}
            data-testid="profile-pic-prompt-add-btn"
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500', '#FF8A00']}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {uploading ? (
                <ActivityIndicator color="#0c0c0c" />
              ) : (
                <Text style={styles.primaryBtnText}>Add now</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handleSkip}
            disabled={uploading}
            data-testid="profile-pic-prompt-skip-btn"
          >
            <Text style={styles.secondaryBtnText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#101010',
    borderRadius: 24,
    paddingTop: 30,
    paddingBottom: 22,
    paddingHorizontal: 26,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 36,
    elevation: 14,
  },
  iconHaloWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconHalo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#181818',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 26,
    paddingHorizontal: 4,
  },
  primaryBtnWrap: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6,
    shadowColor: '#FFA500',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  primaryBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#0c0c0c',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
