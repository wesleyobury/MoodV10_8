/**
 * LegalReacceptSheet — App Store compliance enhancement (2026-05-14).
 *
 * Lightweight one-tap re-consent sheet shown when the backend's published
 * `CURRENT_TERMS_VERSION` differs from the version the user last accepted.
 *
 *   /api/legal/active-version   → public; returns the current version
 *   /api/legal/needs-reaccept   → auth'd; returns { needs_reaccept, ... }
 *   /api/users/me/accept-terms  → auth'd; stamps the new version + ack
 *
 * Non-blocking visual style (bottom sheet over an overlay) and skipped
 * entirely for guests, unauthenticated sessions, and the funnel/auth
 * stacks. Persists the "user dismissed this version" decision in
 * AsyncStorage so the prompt doesn't reappear within the same launch.
 *
 * Mounted exactly once via `<LegalReacceptGate />` from `app/_layout.tsx`.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../utils/apiConfig';

const SNOOZE_KEY = '@mood_legal_reaccept_snoozed_version_v1';

type NeedsReacceptResponse = {
  needs_reaccept: boolean;
  current_version: string;
  user_version: string | null;
};

async function fetchNeedsReaccept(token: string): Promise<NeedsReacceptResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/legal/needs-reaccept`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as NeedsReacceptResponse;
  } catch {
    return null;
  }
}

async function postAcceptTerms(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/users/me/accept-terms`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function LegalReacceptGate() {
  const { token, isGuest, isLoading: authLoading } = useAuth();
  const segments = useSegments();
  const [visible, setVisible] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Single check on mount + whenever the token flips from null → something.
  // Wrapped in a 600ms delay so we don't fire mid-navigation transitions —
  // e.g. coming back from a deep link (Instagram Stories share) where the
  // app momentarily re-mounts the layout tree. Without the delay, the
  // re-consent modal can pop OVER the create-post screen the instant the
  // user returns from IG, which feels like an unexpected forced logout.
  // We also skip when the current path is on the auth, funnel, or share
  // export surfaces so the modal never interrupts those critical flows.
  useEffect(() => {
    if (authLoading) return;
    if (isGuest || !token) return;

    const root = segments[0];
    if (root === 'auth' || root === 'onboarding-funnel' || root === 'onboarding') {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      (async () => {
        if (cancelled) return;
        const data = await fetchNeedsReaccept(token);
        if (cancelled || !data || !data.needs_reaccept) return;

        // Don't re-pester within the same launch if the user explicitly
        // dismissed this exact version already (e.g. tapped "Review later").
        try {
          const snoozed = await AsyncStorage.getItem(SNOOZE_KEY);
          if (snoozed === data.current_version) return;
        } catch {
          /* AsyncStorage unavailable — fail open and show the sheet */
        }

        setCurrentVersion(data.current_version);
        setVisible(true);
      })();
    }, 600);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [token, isGuest, authLoading, segments]);

  const handleSnooze = useCallback(async () => {
    if (currentVersion) {
      try {
        await AsyncStorage.setItem(SNOOZE_KEY, currentVersion);
      } catch {
        /* non-fatal */
      }
    }
    setVisible(false);
  }, [currentVersion]);

  const handleAccept = useCallback(async () => {
    if (!token || submitting) return;
    setSubmitting(true);
    const ok = await postAcceptTerms(token);
    setSubmitting(false);
    if (ok) {
      try {
        // Clear any stale snooze so future bumps surface immediately.
        await AsyncStorage.removeItem(SNOOZE_KEY);
      } catch {
        /* non-fatal */
      }
      setVisible(false);
    } else {
      Alert.alert(
        'Could not save',
        "We couldn't record your acceptance just now. Please try again.",
      );
    }
  }, [token, submitting]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleSnooze}
    >
      <Pressable
        style={styles.overlay}
        onPress={handleSnooze}
        accessibilityLabel="Dismiss legal update"
      >
        <Pressable
          style={styles.sheet}
          onPress={(e) => e.stopPropagation?.()}
          testID="legal-reaccept-sheet"
        >
          <View style={styles.handle} />
          <Text style={styles.title}>We've updated our terms</Text>
          <Text style={styles.body}>
            MOOD has refreshed the Terms of Service and Privacy Policy. By
            tapping <Text style={styles.bold}>I Agree</Text>, you confirm you
            still acknowledge MOOD provides fitness guidance — not medical
            advice — and that you are physically able to exercise.
          </Text>

          <View style={styles.linkRow}>
            <TouchableOpacity
              onPress={() => router.push('/terms-of-service')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="legal-reaccept-terms-link"
            >
              <Text style={styles.link}>Review Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.linkDot}> · </Text>
            <TouchableOpacity
              onPress={() => router.push('/privacy-policy')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="legal-reaccept-privacy-link"
            >
              <Text style={styles.link}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.cta, submitting && styles.ctaDisabled]}
            onPress={handleAccept}
            disabled={submitting}
            testID="legal-reaccept-agree-button"
          >
            {submitting ? (
              <ActivityIndicator color="#0c0c0c" />
            ) : (
              <Text style={styles.ctaText}>I Agree</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.snooze}
            onPress={handleSnooze}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            testID="legal-reaccept-snooze-button"
          >
            <Text style={styles.snoozeText}>Review later</Text>
          </TouchableOpacity>

          <View style={styles.closeWrap}>
            <TouchableOpacity
              onPress={handleSnooze}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="legal-reaccept-close-button"
            >
              <Ionicons name="close" size={20} color="#888" />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#101010',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
    marginBottom: 14,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  body: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  bold: { color: '#fff', fontWeight: '600' },
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 18,
  },
  link: {
    color: '#FFD700',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  linkDot: { color: '#666', fontSize: 13 },
  cta: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: { color: '#0c0c0c', fontWeight: '700', fontSize: 15 },
  snooze: { alignItems: 'center', paddingVertical: 6 },
  snoozeText: { color: '#888', fontSize: 13 },
  closeWrap: { position: 'absolute', top: 14, right: 14 },
});

export default LegalReacceptGate;
