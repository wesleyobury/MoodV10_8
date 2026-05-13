/**
 * PaywallModal — Phase B paid-launch paywall.
 *
 * Visual frame mirrors `GuestPromptModal.tsx` (slide-up bottom sheet,
 * #1a1a1a surface, gradient lock icon, gold→orange CTA, legal links row)
 * so the paywall reads as part of the same modal family the user already
 * knows. Content swapped to subscription copy per spec Part 7.
 *
 * Trigger / dismiss are owned by SubscriptionContext (`pendingTrigger` !==
 * null mounts the modal). Mount this component ONCE near the root.
 *
 * Phase C — StoreKit 2: replace `handleStartTrial`'s stub with a real
 * purchase call and route the resolved transaction to `setStatus`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../constants/brand';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Analytics } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';

type Plan = 'annual' | 'monthly';

const ANNUAL_PRICE_LABEL = '$79/year';
const ANNUAL_MONTHLY_BREAKDOWN = '$6.58/mo';
const ANNUAL_SAVINGS_BADGE = 'Save 34%';
const MONTHLY_PRICE_LABEL = '$9.99/month';

const VALUE_BULLETS = [
  'Unlimited AI-generated workouts',
  'Live heart rate tracking',
  'Shareable workout charts',
  'Recovery-tuned intensity',
  'Full exercise video library',
];

const APPLE_DISCLOSURE =
  'Payment will be charged to your Apple ID account at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period.';

export function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { pendingTrigger, dismissPaywall, setStatus, lastConversionTrigger, clearConversionTrigger } =
    useSubscription();
  const { token } = useAuth();
  const [plan, setPlan] = useState<Plan>('annual');
  const visible = pendingTrigger !== null;

  // Fire view event whenever the modal mounts with a fresh trigger.
  // Also persist the trigger to the user record so Apple's eventual
  // server-to-server day-7 charge webhook can stamp the
  // `subscription_purchased` analytics event with the original attribution.
  useEffect(() => {
    if (visible && pendingTrigger) {
      Analytics.paywallViewed(token, { trigger_source: pendingTrigger });
      if (token) {
        apiFetch('/api/subscription/record-trigger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ trigger: pendingTrigger, plan }),
        }).catch(() => {
          // Silent — the local `lastConversionTrigger` is still authoritative
          // for client-side analytics. Server-side attribution will recover
          // on the next paywall open.
        });
      }
    }
  }, [visible, pendingTrigger, token, plan]);

  const headline = useMemo(() => {
    switch (pendingTrigger) {
      case 'generate_after_cap':
        return 'You hit your free limit.';
      case 'start_workout_after_free_session':
      case 'recap_footer_cta':
        return 'Next workout, on Premium.';
      default:
        return 'Train how you feel.';
    }
  }, [pendingTrigger]);

  const handleStartTrial = () => {
    // Tag the trial start with the originating paywall trigger. The same
    // attribution sticks through `subscription_purchased` via
    // `lastConversionTrigger` (cleared on conversion completion in Phase C).
    Analytics.trialStarted(token, { plan, trigger_source: pendingTrigger ?? 'unknown' });
    // PHASE C — StoreKit 2: replace this stub with a real
    // `await SKProductRequest.purchase()` flow and read the resolved
    // status from the transaction observer instead. When the purchase
    // actually completes, fire `subscriptionPurchased` with
    // `trigger_source: lastConversionTrigger` then `clearConversionTrigger()`.
    setStatus('in_trial');
    dismissPaywall();
  };

  const handleRestore = () => {
    Analytics.subscriptionRestored(token, { source: 'paywall' });
    // PHASE C — wire to `Transaction.currentEntitlements`.
  };

  const handleOpenLink = (kind: 'privacy' | 'terms') => {
    dismissPaywall();
    router.push(kind === 'privacy' ? '/privacy-policy' : '/terms-of-service');
  };

  const handleManageBilling = () => {
    Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={dismissPaywall}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={dismissPaywall}
            testID="paywall-close"
            data-testid="paywall-close"
          >
            <Ionicons name="close" size={22} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.header}>
              <View style={styles.iconRing}>
                <LinearGradient
                  colors={[...BRAND_GRADIENT]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconRingGradient}
                >
                  <Ionicons name="lock-open" size={26} color={COLORS.accentInk} />
                </LinearGradient>
              </View>
              <Text style={styles.eyebrow}>UNLOCK MOOD</Text>
              <Text style={styles.headline}>{headline}</Text>
              <Text style={styles.subhead}>
                Workouts tuned to your real state, not just your goals.
              </Text>
            </View>

            <View style={styles.bullets}>
              {VALUE_BULLETS.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>

            <View style={styles.plans}>
              <PlanCard
                selected={plan === 'annual'}
                onPress={() => setPlan('annual')}
                label="Annual"
                price={ANNUAL_PRICE_LABEL}
                trailing={ANNUAL_MONTHLY_BREAKDOWN}
                badge={ANNUAL_SAVINGS_BADGE}
                testID="paywall-plan-annual"
              />
              <PlanCard
                selected={plan === 'monthly'}
                onPress={() => setPlan('monthly')}
                label="Monthly"
                price={MONTHLY_PRICE_LABEL}
                testID="paywall-plan-monthly"
              />
            </View>

            <TouchableOpacity
              style={styles.cta}
              onPress={handleStartTrial}
              testID="paywall-start-trial"
              data-testid="paywall-start-trial"
            >
              <LinearGradient
                colors={[...BRAND_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGradient}
              >
                <Text style={styles.ctaLabel}>Start 7-day free trial</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.ctaCaption}>
              Then {plan === 'annual' ? ANNUAL_PRICE_LABEL : MONTHLY_PRICE_LABEL}. Cancel anytime in Settings.
            </Text>

            <Text style={styles.disclosure}>{APPLE_DISCLOSURE}</Text>

            <View style={styles.linkRow}>
              <LinkButton label="Privacy Policy" onPress={() => handleOpenLink('privacy')} />
              <Text style={styles.linkDivider}>·</Text>
              <LinkButton label="Terms" onPress={() => handleOpenLink('terms')} />
              <Text style={styles.linkDivider}>·</Text>
              <LinkButton label="Restore Purchases" onPress={handleRestore} testID="paywall-restore" />
            </View>

            <TouchableOpacity onPress={handleManageBilling} style={styles.manageRow}>
              <Text style={styles.manageText}>Manage subscription in App Store</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function PlanCard({
  selected,
  onPress,
  label,
  price,
  trailing,
  badge,
  testID,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  price: string;
  trailing?: string;
  badge?: string;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.planCard, selected && styles.planCardSelected]}
      testID={testID}
      data-testid={testID}
    >
      <View style={styles.planLeft}>
        <View style={styles.planLabelRow}>
          <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>{label}</Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {trailing ? <Text style={styles.planTrailing}>{trailing}</Text> : null}
      </View>
      <View style={styles.planRight}>
        <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>{price}</Text>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <View style={styles.radioInner} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

function LinkButton({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  return (
    <TouchableOpacity onPress={onPress} testID={testID} data-testid={testID}>
      <Text style={styles.linkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    maxHeight: '92%',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scroll: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  iconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  iconRingGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  headline: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  subhead: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  bullets: {
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accent,
    marginRight: 14,
  },
  bulletText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  plans: {
    marginBottom: 16,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  planCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  planLeft: {
    flex: 1,
  },
  planLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 10,
  },
  planLabelSelected: {
    color: COLORS.textPrimary,
  },
  planTrailing: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  badge: {
    backgroundColor: 'rgba(255,215,0,0.16)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: COLORS.accent,
    fontWeight: '700',
  },
  planRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 10,
  },
  planPriceSelected: {
    color: COLORS.accent,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.accent,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.accent,
  },
  cta: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentInk,
    letterSpacing: 0.3,
  },
  ctaCaption: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 18,
  },
  disclosure: {
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.textTertiary,
    marginBottom: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  linkDivider: {
    color: COLORS.textTertiary,
    paddingHorizontal: 8,
  },
  linkLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  manageRow: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  manageText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
