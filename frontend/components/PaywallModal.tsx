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
import { useSubscription, markPostFirstWorkoutPaywallShown, STAGE_2_PAYWALL_TRIGGERS } from '../contexts/SubscriptionContext';
import { Analytics } from '../utils/analytics';
import { useAuth } from '../contexts/AuthContext';
import { useFoundingPurchase } from '../hooks/useFoundingPurchase';
import { apiFetch } from '../utils/api';
import {
  MONTHLY_PRODUCT_ID,
  YEARLY_PRODUCT_ID,
  isStoreKitAvailable,
  purchase as storeKitPurchase,
  restorePurchases as storeKitRestore,
} from '../modules/mood-storekit/src';

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

/**
 * MOOD V2 1a — map a paywall trigger to its funnel STAGE (1 Soft-onboarding,
 * 2 Soft-ritual, 3 Hard). Mirrors the documented mapping in
 * SubscriptionContext. Defaults to undefined for in-app feature gates.
 */
function stageForTrigger(trigger?: string | null): 1 | 2 | 3 | undefined {
  switch (trigger) {
    case 'post_onboarding_soft':
    case 'post_onboarding_dev':
      return 1;
    case 'post_achievement_close_soft':
    case 'post_share_soft':
    case 'recap_footer_cta':
      return 2;
    case 'start_workout_after_free_session':
    case 'generate_after_cap':
      return 3;
    default:
      return undefined;
  }
}

export function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { pendingTrigger, dismissPaywall, setStatus, lastConversionTrigger, clearConversionTrigger } =
    useSubscription();
  const { token, entitlement, user } = useAuth();
  const { claimFounding } = useFoundingPurchase();
  const [plan, setPlan] = useState<Plan>('annual');
  const [foundingBusy, setFoundingBusy] = useState(false);
  const visible = pendingTrigger !== null;

  // 1a — seconds_on_screen for paywall_dismissed.
  const openedAtRef = React.useRef<number | null>(null);
  const stage = stageForTrigger(pendingTrigger);
  const isFoundingWindow = !!entitlement?.founding_window_active;
  const isFoundingOffer =
    !!entitlement?.is_founding_member &&
    !entitlement?.founding_pricing_claimed &&
    !!entitlement?.founding_window_active;
  const planProductId = plan === 'annual' ? YEARLY_PRODUCT_ID : MONTHLY_PRODUCT_ID;

  // Fire view event whenever the modal mounts with a fresh trigger.
  // Also persist the trigger to the user record so Apple's eventual
  // server-to-server day-7 charge webhook can stamp the
  // `subscription_purchased` analytics event with the original attribution.
  useEffect(() => {
    if (visible && pendingTrigger) {
      openedAtRef.current = Date.now();
      if (user?.id && STAGE_2_PAYWALL_TRIGGERS.has(pendingTrigger)) {
        markPostFirstWorkoutPaywallShown(user.id).catch(() => {});
      }
      Analytics.paywallViewed(token, {
        trigger_source: pendingTrigger,
        stage,
        trigger: pendingTrigger,
        is_founding_window: isFoundingWindow,
      });
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
      case 'post_onboarding_dev':
      case 'post_onboarding_soft':
        return 'Unlock your full plan.';
      // Spec §3 Stage 2 — leverage post-workout dopamine + (for the share
      // path) public commitment as social proof to themselves.
      case 'post_achievement_close_soft':
        return 'You just trained. Lock it in.';
      case 'post_share_soft':
        return 'You told the world. Now lock it in.';
      default:
        return 'Train how you feel.';
    }
  }, [pendingTrigger]);

  /** Sub-headline beneath the main copy. For Stage 2 we double down on
   *  the emotional payoff; for everything else we keep the existing
   *  generic "every mood, every day" promise. */
  const subheadline = useMemo(() => {
    switch (pendingTrigger) {
      case 'post_achievement_close_soft':
        return 'Imagine doing this every day, dialed in to how you feel.';
      case 'post_share_soft':
        return 'Premium turns one workout into a streak. No skipped days, no plateaus.';
      default:
        return null;
    }
  }, [pendingTrigger]);

  const handleStartTrial = async () => {
    // Launch-critical: which CTA was tapped (the single biggest funnel gap).
    Analytics.paywallCtaTapped(token, {
      cta: 'start_free_trial',
      trigger_source: pendingTrigger ?? 'unknown',
      variant: isFoundingWindow ? 'founding' : 'standard',
    });
    // Tag the trial start with the originating paywall trigger. The same
    // attribution sticks through `subscription_purchased` via
    // `lastConversionTrigger` + server-side `subscription.last_trigger_source`.
    Analytics.trialStarted(token, { plan, trigger_source: pendingTrigger ?? 'unknown' });

    const productID = plan === 'annual' ? YEARLY_PRODUCT_ID : MONTHLY_PRODUCT_ID;

    // 1a — StoreKit/Play purchase sheet about to open.
    Analytics.purchaseInitiated(token, { plan_id: productID, stage });

    // Web preview / Expo Go / Android — no native StoreKit. Optimistically
    // flip the local state so QA on these surfaces still proceeds. The
    // real iOS build hits the native StoreKit sheet below.
    if (!isStoreKitAvailable()) {
      Analytics.purchaseCompleted(token, { plan_id: productID, is_trial: true });
      setStatus('in_trial');
      dismissPaywall();
      return;
    }

    try {
      const result = await storeKitPurchase(productID);
      if (result.status === 'success') {
        // Server-side reconciliation: persists subscription, fires
        // `subscription_purchased` with the original `trigger_source`
        // pulled from the user record (set by `record-trigger` when this
        // modal mounted).
        if (token) {
          await apiFetch('/api/subscription/validate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              signed_payload: result.signedPayload,
              product_id: result.productID,
              transaction_id: result.transactionID,
              original_transaction_id: result.originalTransactionID,
              purchase_date: result.purchaseDate,
              expiration_date: result.expirationDate,
            }),
          }).catch(() => {
            // Silent — `Transaction.updates` listener will re-fire on next
            // app open and we'll reconcile then.
          });
        }
        Analytics.subscriptionPurchased(token, {
          plan,
          trigger_source: lastConversionTrigger ?? pendingTrigger ?? 'unknown',
        });
        // 1a — purchase confirmed by the store.
        Analytics.purchaseCompleted(token, { plan_id: result.productID, is_trial: true });
        clearConversionTrigger();
        // The intro-offer flag is determined by Apple — we mark `in_trial`
        // here because every product has a 7-day intro. If Apple denies
        // the intro (already used etc.), they auto-charge, and the next
        // `Transaction.updates` event reconciles to `active` on app reopen.
        setStatus('in_trial');
        dismissPaywall();
      } else if (result.status === 'cancelled') {
        // User dismissed Apple's sheet — leave the paywall up so they can
        // retry or close manually.
        Analytics.purchaseFailed(token, { plan_id: productID, failure_reason: 'user_cancelled' });
      } else {
        Analytics.purchaseFailed(token, { plan_id: productID, failure_reason: 'unknown' });
      }
    } catch (err) {
      console.error('StoreKit purchase failed', err);
      Analytics.purchaseFailed(token, { plan_id: productID, failure_reason: 'unknown' });
    }
  };

  const handleClaimFounding = async () => {
    if (foundingBusy) return;
    setFoundingBusy(true);
    try {
      const result = await claimFounding(pendingTrigger ?? 'paywall_founding_offer');
      if (result === 'success') {
        dismissPaywall();
      }
    } finally {
      setFoundingBusy(false);
    }
  };

  const handleRestore = async () => {
    Analytics.subscriptionRestored(token, { source: 'paywall' });
    Analytics.restorePurchasesClicked(token, { source: 'paywall' });
    if (!isStoreKitAvailable()) return;
    try {
      const entitlements = await storeKitRestore();
      if (entitlements.length > 0) {
        Analytics.restorePurchasesCompleted(token, {
          restored_plan_id: entitlements[0]?.productID,
        });
        setStatus('active');
        dismissPaywall();
      }
    } catch (err) {
      console.error('StoreKit restore failed', err);
    }
  };

  /** 1a — fire paywall_dismissed with method + dwell time, then dismiss. */
  const handleDismiss = (method: 'x_button' | 'back_swipe' | 'tap_outside') => {
    const seconds = openedAtRef.current
      ? Math.round((Date.now() - openedAtRef.current) / 1000)
      : undefined;
    // Map legacy dismiss_method → launch-critical method enum.
    const methodMap: Record<string, 'tertiary_link' | 'background_tap' | 'system_back'> = {
      x_button: 'system_back',
      back_swipe: 'system_back',
      tap_outside: 'background_tap',
    };
    Analytics.paywallDismissed(token, {
      stage,
      dismiss_method: method,
      seconds_on_screen: seconds,
      method: methodMap[method],
      trigger_source: pendingTrigger ?? 'unknown',
    });
    dismissPaywall();
  };

  /** 1a — plan card tapped. */
  const handlePlanSelect = (next: Plan) => {
    setPlan(next);
    const pid = next === 'annual' ? YEARLY_PRODUCT_ID : MONTHLY_PRODUCT_ID;
    Analytics.planSelected(token, { plan_id: pid, stage });
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
      onRequestClose={() => handleDismiss('back_swipe')}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => handleDismiss('x_button')}
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
                {subheadline ?? 'Workouts tuned to your real state, not just your goals.'}
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

            {isFoundingOffer && (
              <>
                <View style={styles.foundingBanner}>
                  <Ionicons name="flash" size={16} color={COLORS.accent} />
                  <Text style={styles.foundingBannerText}>
                    Founding pricing — <Text style={styles.bold}>$39/yr locked forever</Text>.
                    Standard pricing will be $79/year while this offer is active.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.cta}
                  onPress={handleClaimFounding}
                  disabled={foundingBusy}
                  testID="paywall-claim-founding"
                  data-testid="paywall-claim-founding"
                >
                  <LinearGradient
                    colors={[...BRAND_GRADIENT]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    {foundingBusy ? (
                      <ActivityIndicator color={COLORS.accentInk} />
                    ) : (
                      <Text style={styles.ctaLabel}>Claim Founding Price — $39/year</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.orDivider}>
                  <Text style={styles.orText}>or</Text>
                </View>

                <TouchableOpacity
                  style={styles.trialBtn}
                  onPress={handleStartTrial}
                  disabled={foundingBusy}
                  activeOpacity={0.8}
                  testID="paywall-start-trial"
                  data-testid="paywall-start-trial"
                >
                  <Text style={styles.trialBtnLabel}>Start 7-day free trial</Text>
                </TouchableOpacity>

                <Text style={styles.foundingSubtext}>
                  Try premium first — cancel anytime before the trial ends.
                </Text>
              </>
            )}

            <View style={styles.plans}>
              <PlanCard
                selected={plan === 'annual'}
                onPress={() => handlePlanSelect('annual')}
                label="Annual"
                price={ANNUAL_PRICE_LABEL}
                trailing={ANNUAL_MONTHLY_BREAKDOWN}
                badge={ANNUAL_SAVINGS_BADGE}
                testID="paywall-plan-annual"
              />
              <PlanCard
                selected={plan === 'monthly'}
                onPress={() => handlePlanSelect('monthly')}
                label="Monthly"
                price={MONTHLY_PRICE_LABEL}
                testID="paywall-plan-monthly"
              />
            </View>

            {!isFoundingOffer && (
              <>
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
              </>
            )}

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
  foundingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.28)',
    padding: 14,
    marginBottom: 16,
  },
  foundingBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  foundingSubtext: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 14,
  },
  orDivider: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  orText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  trialBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: 10,
  },
  trialBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.2,
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
