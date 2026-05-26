/**
 * FoundingMemberGate — Phase D one-time celebration flow.
 *
 * Mounted once near the root. On every auth load it:
 *   1. Reads the `founding_member` + `founding_member_modal_seen` flags
 *      from the user object (hydrated from `/api/auth/me`).
 *   2. If `founding_member` is true, flips `SubscriptionContext.status` to
 *      `'founding_member'` so every paywall gate short-circuits.
 *   3. If the modal hasn't been seen, surfaces it once. Tap to dismiss
 *      fires `POST /api/auth/founding-member/mark-seen` so the modal will
 *      never appear again on this account.
 *
 * Non-founding accounts and guests are a no-op.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../constants/brand';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { apiFetch } from '../utils/api';
import { Analytics } from '../utils/analytics';

export function FoundingMemberGate() {
  const { user, token, updateUser } = useAuth();
  const { status, setStatus } = useSubscription();
  const [visible, setVisible] = useState(false);

  // (1) flip status to founding_member as soon as we see the flag.
  useEffect(() => {
    if (user?.founding_member && status !== 'founding_member') {
      setStatus('founding_member');
    }
  }, [user?.founding_member, status, setStatus]);

  // (1.5) Phase C — StoreKit receipt status sync.
  // If the user is NOT a founding member, mirror the persisted
  // `subscription_status` from /auth/me into SubscriptionContext so the
  // entitlement rehydrates on every app launch. Founding members short-
  // circuit above and never get a paying subscription doc, so the order
  // here is safe.
  useEffect(() => {
    if (user?.founding_member) return; // founding members are handled above
    const remote = user?.subscription_status;
    if (!remote) return; // unauthenticated or no receipt on file
    if (remote === status) return; // already in sync
    if (remote === 'active' || remote === 'in_trial' || remote === 'lapsed') {
      setStatus(remote);
    }
  }, [user?.founding_member, user?.subscription_status, status, setStatus]);

  // (2) surface the modal exactly once — and only AFTER the user has
  // actively logged in / registered (i.e. the token transitioned from
  // null → set during this app session). The `authTransitionedRef` latch
  // prevents the modal from popping the moment a cold-start hydrates a
  // pre-existing session — historically that produced a confusing welcome
  // sheet on every app entry, including in dev mode. Guests (token=null)
  // are also a no-op here.
  const authTransitionedRef = React.useRef(false);
  const prevTokenRef = React.useRef<string | null | undefined>(undefined);
  useEffect(() => {
    // First observation just records baseline state — don't act on it.
    if (prevTokenRef.current === undefined) {
      prevTokenRef.current = token;
      return;
    }
    if (!prevTokenRef.current && token) {
      authTransitionedRef.current = true;
    }
    prevTokenRef.current = token;
  }, [token]);

  useEffect(() => {
    if (!token) return; // guests + signed-out: never show
    if (!authTransitionedRef.current) return; // only show after an active sign-in
    if (user?.founding_member && !user?.founding_member_modal_seen) {
      setVisible(true);
      Analytics.foundingMemberModalShown(token, {});
    }
  }, [user?.founding_member, user?.founding_member_modal_seen, token]);

  const handleDismiss = async () => {
    setVisible(false);
    Analytics.foundingMemberModalDismissed(token, {});
    // Optimistically update local user so we don't show again this session.
    updateUser({ founding_member_modal_seen: true });
    if (!token) return;
    try {
      await apiFetch('/api/auth/founding-member/mark-seen', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Silent. The modal won't show again because of the optimistic update;
      // next /auth/me roundtrip will reconcile.
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
          <View style={styles.card}>
            <LinearGradient
              colors={[...BRAND_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.icon}
            >
              <Ionicons name="star" size={28} color={COLORS.accentInk} />
            </LinearGradient>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.headline}>You&apos;re a Founding Member.</Text>
            <Text style={styles.body}>
              Thank you for being here from day one. You have full MOOD Premium access for as
              long as the app exists in its current form — no charge, no expiration on our end.
            </Text>
            <TouchableOpacity
              onPress={handleDismiss}
              style={styles.cta}
              testID="founding-member-continue"
              data-testid="founding-member-continue"
            >
              <LinearGradient
                colors={[...BRAND_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaLabel}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  safe: {
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.22)',
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    color: COLORS.accent,
    fontWeight: '700',
    marginBottom: 10,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  cta: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  ctaGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentInk,
    letterSpacing: 0.3,
  },
});
