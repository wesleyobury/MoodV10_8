/**
 * ProfilePicPromptGate — "increase profile pic visibility across the app".
 *
 * Behaviour spec (2026-05-14 product decision):
 *  • On a user's 2nd authenticated app open we surface a modal nudging them
 *    to add a profile pic. Tapping "Add now" launches the image picker and
 *    uploads via the existing `/api/users/me/avatar-base64` endpoint, then
 *    immediately marks the prompt complete.
 *  • Tapping "Skip" dismisses the modal but flips on a persistent top
 *    banner that follows the user everywhere they navigate inside the
 *    authenticated app. The banner is non-dismissable and only goes away
 *    once the user actually sets an avatar.
 *  • Users that already have an avatar never see either UI.
 *
 * Counting "app opens": tracked per-user-id in AsyncStorage. A given user is
 * incremented at most once per mount of this component (a single cold start
 * or login transition) so re-renders never double-bump the counter.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../utils/apiConfig';

const COUNT_KEY = (userId: string) => `@mood_app_open_count_${userId}`;
const SESSION_FLAG_KEY = (userId: string) => `@mood_app_open_session_${userId}`;
const MODAL_SEEN_KEY = (userId: string) => `@mood_pic_prompt_modal_seen_${userId}`;
const PROMPT_TRIGGER_THRESHOLD = 2; // 2nd open

/**
 * Increment the per-user "app open" counter exactly once per process
 * lifetime per user. Returns the resulting count (post-increment).
 */
async function bumpOpenCountOnce(userId: string): Promise<number> {
  try {
    // Process-scope sentinel — survives re-renders but resets on cold start.
    const sessionKey = SESSION_FLAG_KEY(userId);
    // We use a module-level Set as the session sentinel (declared below) so
    // background→foreground cycles don't re-bump within the same JS runtime.
    if (BUMPED_THIS_SESSION.has(userId)) {
      const existing = await AsyncStorage.getItem(COUNT_KEY(userId));
      return existing ? parseInt(existing, 10) || 0 : 0;
    }
    BUMPED_THIS_SESSION.add(userId);

    const raw = await AsyncStorage.getItem(COUNT_KEY(userId));
    const next = (raw ? parseInt(raw, 10) || 0 : 0) + 1;
    await AsyncStorage.setItem(COUNT_KEY(userId), String(next));
    // The session key is unused at runtime — kept as a debug breadcrumb so
    // we can diff between cold-start sessions in logs if needed.
    AsyncStorage.setItem(sessionKey, String(Date.now())).catch(() => {});
    return next;
  } catch {
    return 0;
  }
}

const BUMPED_THIS_SESSION = new Set<string>();

export default function ProfilePicPromptGate() {
  const { user, token, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [uploading, setUploading] = useState(false);
  const evaluatedForUserRef = useRef<string | null>(null);

  // Evaluate once per user.id arrival. We don't watch `user.avatar` here —
  // when the user uploads a pic the auth context update naturally re-renders
  // and the gate clauses below fall through to "nothing to show".
  useEffect(() => {
    const uid = user?.id;
    if (!uid || !token) {
      setShowModal(false);
      setShowBanner(false);
      return;
    }
    if (evaluatedForUserRef.current === uid) return;
    evaluatedForUserRef.current = uid;

    let cancelled = false;
    (async () => {
      const count = await bumpOpenCountOnce(uid);
      const hasAvatar = Boolean(user?.avatar && user.avatar.length > 0);
      if (cancelled || hasAvatar) return;

      // Banner is sticky for any qualifying open (count >= threshold) once
      // user has no avatar, regardless of whether they've seen the modal.
      const qualifies = count >= PROMPT_TRIGGER_THRESHOLD;
      if (!qualifies) return;

      const modalSeenRaw = await AsyncStorage.getItem(MODAL_SEEN_KEY(uid));
      if (cancelled) return;
      if (!modalSeenRaw) {
        setShowModal(true);
      } else {
        setShowBanner(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.avatar, token]);

  // Watch avatar — if the user uploads via another flow (settings, register),
  // tear down any visible UI immediately.
  useEffect(() => {
    if (user?.avatar) {
      setShowModal(false);
      setShowBanner(false);
    }
  }, [user?.avatar]);

  const markModalSeen = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    try {
      await AsyncStorage.setItem(MODAL_SEEN_KEY(uid), '1');
    } catch {
      /* ignore — banner state still reflects the right UI in-memory */
    }
  }, [user?.id]);

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
        setShowBanner(false);
        await markModalSeen();
      } catch (err) {
        console.error('ProfilePicPromptGate upload error:', err);
        Alert.alert('Upload failed', 'Could not save your picture. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [token, updateUser, markModalSeen]
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

  const handleSkip = useCallback(async () => {
    await markModalSeen();
    setShowModal(false);
    setShowBanner(true);
  }, [markModalSeen]);

  if (!user?.id || user.avatar) return null;

  return (
    <>
      {/* 2nd-open modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleSkip}
      >
        <View style={styles.backdrop}>
          <View style={styles.card} data-testid="profile-pic-prompt-modal">
            <View style={styles.iconCircle}>
              <Ionicons name="person-circle-outline" size={48} color="#FFD700" />
            </View>
            <Text style={styles.title}>Add a profile picture</Text>
            <Text style={styles.body}>
              People connect with faces. Add a profile pic so your activity, posts and shared
              workouts stand out across MOOD.
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={handleAddNow}
              disabled={uploading}
              data-testid="profile-pic-prompt-add-btn"
            >
              {uploading ? (
                <ActivityIndicator color="#0c0c0c" />
              ) : (
                <Text style={styles.primaryBtnText}>Add now</Text>
              )}
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

      {/* Persistent top banner — only when modal already seen + still no avatar */}
      {showBanner && !showModal ? (
        <View
          pointerEvents="box-none"
          style={[styles.bannerWrap, { top: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 12) + 4 }]}
        >
          <TouchableOpacity
            style={styles.banner}
            onPress={handleAddNow}
            activeOpacity={0.9}
            data-testid="profile-pic-prompt-banner"
          >
            <View style={styles.bannerIconCircle}>
              {uploading ? (
                <ActivityIndicator color="#FFD700" size="small" />
              ) : (
                <Ionicons name="camera" size={16} color="#FFD700" />
              )}
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={styles.bannerTitle} numberOfLines={1}>
                Add a profile picture
              </Text>
              <Text style={styles.bannerSub} numberOfLines={1}>
                Tap to upload — stand out across the app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#888" />
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0a0a0a',
    borderColor: '#1a1a1a',
    borderWidth: 1,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 215, 0, 0.10)',
    borderColor: 'rgba(255, 215, 0, 0.30)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    color: '#a0a0a0',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 22,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#0c0c0c',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  bannerWrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,20,20,0.96)',
    borderColor: 'rgba(255, 215, 0, 0.35)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  bannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderColor: 'rgba(255,215,0,0.30)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  bannerSub: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
});
