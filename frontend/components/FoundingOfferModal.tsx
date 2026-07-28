/**
 * FoundingOfferModal — MOOD V2 launch offer (Phase 2.2).
 *
 * One-time-per-session modal surfaced to founding-eligible existing users
 * during the 14-day window. Offers the locked $39/yr founding deal.
 * New users (post-V2) and already-claimed users never see it.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../constants/brand';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Analytics } from '../utils/analytics';
import { useFoundingPurchase } from '../hooks/useFoundingPurchase';
import { foundingDaysRemaining } from '../utils/founding';
import { useUpdateGateState } from './ForceUpdateGate';

// Per-session latch (resets on app restart = new session).
let shownThisSession = false;

export function FoundingOfferModal() {
  const { token, entitlement } = useAuth();
  const { pendingTrigger } = useSubscription();
  const { claimFounding } = useFoundingPurchase();
  const pathname = usePathname();
  const updateGateState = useUpdateGateState();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const firedRef = useRef(false);

  // Don't surface the launch modal during the onboarding funnel / onboarding
  // stack — the reveal-payoff screen renders its own founding offer there.
  const inOnboarding =
    !!pathname && (pathname.startsWith('/onboarding') || pathname.startsWith('/auth'));

  const eligible =
    !!entitlement?.is_founding_member &&
    !entitlement?.founding_pricing_claimed &&
    !!entitlement?.founding_window_active;

  const daysLeft = foundingDaysRemaining(entitlement?.founding_window_expires_at);

  useEffect(() => {
    if (pendingTrigger) setVisible(false);
  }, [pendingTrigger]);

  // If the forced-update wall comes down, get out of its way — a native
  // Modal renders above the blocked overlay and would otherwise cover it.
  useEffect(() => {
    if (updateGateState === 'blocked') setVisible(false);
  }, [updateGateState]);

  useEffect(() => {
    if (!token || inOnboarding) return;
    // Don't present a native modal until the update check has resolved —
    // if the check comes back 'blocked' one frame later, the dismiss/present
    // race with the update wall can leave the screen black on iOS.
    if (updateGateState !== 'ok' && updateGateState !== 'soft_prompt') return;
    // Soft Paywall #2 takes priority over the founding launch modal.
    if (pendingTrigger) return;
    if (eligible && !shownThisSession && !firedRef.current) {
      firedRef.current = true;
      shownThisSession = true;
      setVisible(true);
      Analytics.foundingModalShown(token, { days_remaining: daysLeft });
      // 1c — canonical founding-offer-shown event for the funnel.
      Analytics.foundingMemberOfferShown(token, { days_remaining_in_window: daysLeft });
    }
  }, [token, eligible, daysLeft, inOnboarding, pendingTrigger, updateGateState]);

  const handleRemindLater = () => {
    setVisible(false);
    Analytics.foundingModalDismissed(token, { dismissed_at_day_of_window: 14 - daysLeft + 1 });
  };

  const handleClaim = async () => {
    if (busy) return;
    setBusy(true);
    const result = await claimFounding('founding_modal');
    setBusy(false);
    if (result === 'success' || result === 'ineligible') {
      setVisible(false);
    }
    // cancelled/error: keep modal up so they can retry.
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleRemindLater}>
      <View style={styles.overlay}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
          <View style={styles.card}>
            <LinearGradient
              colors={[...BRAND_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.icon}
            >
              <Ionicons name="flash" size={28} color={COLORS.accentInk} />
            </LinearGradient>
            <Text style={styles.eyebrow}>FOUNDING MEMBER</Text>
            <Text style={styles.headline}>You helped build MOOD.</Text>
            <Text style={styles.body}>
              The people who showed up during soft launch — you&apos;re the reason this works. As we
              move out of free beta, you get the deal we&apos;ll never offer again:
            </Text>
            <Text style={styles.price}>$39/year, locked forever.</Text>
            <Text style={styles.priceSub}>Standard pricing will be $79.99/year.</Text>
            <Text style={styles.window}>
              Claim within <Text style={styles.windowBold}>{daysLeft} day{daysLeft === 1 ? '' : 's'}</Text>. After that, standard pricing applies.
            </Text>

            <TouchableOpacity
              onPress={handleClaim}
              style={styles.cta}
              disabled={busy}
              testID="founding-claim"
            >
              <LinearGradient
                colors={[...BRAND_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                {busy ? (
                  <ActivityIndicator color={COLORS.accentInk} />
                ) : (
                  <Text style={styles.ctaLabel}>Claim Founding Price — $39/year</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleRemindLater} style={styles.secondary} disabled={busy}>
              <Text style={styles.secondaryLabel}>Remind me later</Text>
            </TouchableOpacity>

            <Text style={styles.disclosure}>
              $39.00/year, auto-renews unless cancelled at least 24 hours before renewal. Manage in
              Settings.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', paddingHorizontal: 24 },
  safe: { justifyContent: 'center' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.25)',
  },
  icon: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  eyebrow: { fontSize: 11, letterSpacing: 2, color: COLORS.accent, fontWeight: '700', marginBottom: 8 },
  headline: { fontSize: 25, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 14, lineHeight: 21, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 14 },
  price: { fontSize: 22, fontWeight: '800', color: COLORS.accent, textAlign: 'center' },
  priceSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2, marginBottom: 12 },
  window: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 18 },
  windowBold: { color: COLORS.textPrimary, fontWeight: '700' },
  cta: { width: '100%', borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  ctaGradient: { paddingVertical: 15, alignItems: 'center', minHeight: 50, justifyContent: 'center' },
  ctaLabel: { fontSize: 15, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.2 },
  secondary: { paddingVertical: 10, marginBottom: 6 },
  secondaryLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  disclosure: { fontSize: 10, lineHeight: 14, color: COLORS.textTertiary, textAlign: 'center' },
});

export default FoundingOfferModal;
