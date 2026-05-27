/**
 * ProfilePicPromptGate — premium 2nd-open profile-pic nudge.
 *
 * Spec (2026-05-14 v2):
 *  • Fires ONLY after a user reaches the authenticated home screen (a
 *    `/(tabs)` route). Cold-start auto-login pre-tabs renders are ignored
 *    so the modal never lands on splash, funnel, onboarding, or auth.
 *  • Shows AT MOST ONCE per user (forever). If the user taps "Maybe later"
 *    we mark `modal_seen` and never bug them again. No persistent banner.
 *  • Premium visual: gold→orange gradient CTA, no card borders, soft shadow.
 *  • Tracked per-user-id in AsyncStorage; one bump per JS-runtime session
 *    via a module-level Set sentinel so re-renders don't double-count.
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../utils/apiConfig';

const COUNT_KEY = (userId: string) => `@mood_app_open_count_${userId}`;
const MODAL_SEEN_KEY = (userId: string) => `@mood_pic_prompt_modal_seen_${userId}`;
const PROMPT_TRIGGER_THRESHOLD = 2; // 2nd open

/** Process-scope sentinel so background→foreground re-renders within the
 *  same JS runtime don't repeatedly bump the per-user open counter. */
const BUMPED_THIS_SESSION = new Set<string>();

/** True only when the current route is an authenticated home tab. We don't
 *  want the modal to land on splash / onboarding / funnel / auth / workout
 *  flow screens. Spec §5 — switched from deny-list to explicit allow-list
 *  so the modal can only appear ON the home tab (`/`), explore (`/explore`),
 *  or profile (`/profile`). Workout flow / cart / settings etc. don't qualify. */
function isOnHomeTab(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  // Expo Router collapses `app/(tabs)/index.tsx` into `/` and other tab files
  // into `/<name>`. Whitelist exactly the three tab routes — anything else
  // (workout-session, create-post, cart, settings, …) waits its turn.
  return (
    pathname === '/' ||
    pathname === '/explore' ||
    pathname === '/profile'
  );
}

async function bumpOpenCountOnce(userId: string): Promise<number> {
  try {
    if (BUMPED_THIS_SESSION.has(userId)) {
      const existing = await AsyncStorage.getItem(COUNT_KEY(userId));
      return existing ? parseInt(existing, 10) || 0 : 0;
    }
    BUMPED_THIS_SESSION.add(userId);
    const raw = await AsyncStorage.getItem(COUNT_KEY(userId));
    const next = (raw ? parseInt(raw, 10) || 0 : 0) + 1;
    await AsyncStorage.setItem(COUNT_KEY(userId), String(next));
    return next;
  } catch {
    return 0;
  }
}

export default function ProfilePicPromptGate() {
  const { user, token, updateUser } = useAuth();
  const pathname = usePathname();

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const evaluatedForUserRef = useRef<string | null>(null);

  // We only run the bump+evaluate ONCE per user, and only after the user has
  // actually navigated into the tabs / home area post-auth. Subsequent route
  // changes within tabs don't re-trigger anything.
  useEffect(() => {
    const uid = user?.id;
    if (!uid || !token) return;
    if (user?.avatar) return;
    if (!isOnHomeTab(pathname)) return;
    if (evaluatedForUserRef.current === uid) return;
    evaluatedForUserRef.current = uid;

    let cancelled = false;
    (async () => {
      const modalSeenRaw = await AsyncStorage.getItem(MODAL_SEEN_KEY(uid));
      if (cancelled) return;
      // One-and-done — if user has already seen the modal we never show it
      // again, regardless of open count. No persistent banner either.
      if (modalSeenRaw) return;

      const count = await bumpOpenCountOnce(uid);
      if (cancelled) return;
      if (count >= PROMPT_TRIGGER_THRESHOLD) {
        setShowModal(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.avatar, token, pathname]);

  // Hide immediately if avatar appears via any other path (settings, register).
  useEffect(() => {
    if (user?.avatar) setShowModal(false);
  }, [user?.avatar]);

  const markModalSeen = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return;
    try {
      await AsyncStorage.setItem(MODAL_SEEN_KEY(uid), '1');
    } catch {
      /* in-memory state still reflects the right UI */
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
  }, [markModalSeen]);

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
          {/* Gold-orange halo behind the icon for premium depth */}
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
    // Soft drop shadow for premium depth (no border).
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
    // Inner glow shadow on the CTA for premium pop
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
