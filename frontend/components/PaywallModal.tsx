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
  ActivityIndicator,
  Alert,
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
import { useStorePrices } from '../hooks/useStorePrices';
import { apiFetch } from '../utils/api';
import { validateSubscriptionTransaction } from '../hooks/subscription/subscriptionApi';
import { getLatestSubscriptionEntitlement } from '../hooks/subscription/subscriptionSync';
import {
  MONTHLY_TRIAL_PRODUCT_ID,
  YEARLY_TRIAL_PRODUCT_ID,
  appAccountTokenForUserId,
  isStoreKitAvailable,
  productIDForPlan,
  purchase as storeKitPurchase,
  restorePurchases as storeKitRestore,
} from '../modules/mood-storekit/src';

type Plan = 'annual' | 'monthly';
type PaywallCta = 'start_free_trial' | 'subscribe_now';

const ANNUAL_PRICE_LABEL = '$79.99/year';
const ANNUAL_MONTHLY_BREAKDOWN = '$6.67/mo';
const ANNUAL_SAVINGS_BADGE = 'Save 33%';
const MONTHLY_PRICE_LABEL = '$9.99/month';

// Two grouped sections so the social value reads as its own pillar, not just
// more feature bullets. Kept tight to avoid pushing the plan picker / CTA below
// the fold. Mirrors the FEATURES carousel copy in reveal-payoff.tsx.
const FEATURE_BULLETS = [
  'Unlimited workouts for your mood, goals & level',
  'Recovery-tuned intensity',
  'Live heart rate & wearable tracking',
  'Shareable progress charts',
  'Full exercise video library',
];

const COMMUNITY_BULLETS = [
  "See other athletes' content — and copy any workout",
  'Access to an amazing, driven community',
];

/**
 * Human-readable message from a failed /api/subscription/validate call.
 * The backend returns detail as either a string or {error, message} — e.g.
 * 403/409 when the Apple subscription is already linked to a DIFFERENT MOOD
 * profile. Surfacing this is critical: Apple's sheet succeeds, so without it
 * the user sees "success" while the server never granted access.
 */
function validationFailureMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error && typeof error === 'object') {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return 'Your Apple purchase went through, but we couldn’t link it to this MOOD account. If you subscribed on another MOOD profile, log into that profile and tap Restore Purchases.';
}

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
  const { pendingTrigger, preferredPaywallCta, dismissPaywall, setStatus, lastConversionTrigger, clearConversionTrigger } =
    useSubscription();
  const { token, entitlement, user, refreshSubscriptionState } = useAuth();
  const { claimFounding } = useFoundingPurchase();
  const [plan, setPlan] = useState<Plan>('annual');
  const [foundingBusy, setFoundingBusy] = useState(false);
  const [purchaseBusy, setPurchaseBusy] = useState(false);
  const visible = pendingTrigger !== null;

  // 1a — seconds_on_screen for paywall_dismissed.
  const openedAtRef = React.useRef<number | null>(null);
  const stage = stageForTrigger(pendingTrigger);
  const isFoundingWindow = !!entitlement?.founding_window_active;
  const isFoundingOffer =
    !!entitlement?.is_founding_member &&
    !entitlement?.founding_pricing_claimed &&
    !!entitlement?.founding_window_active;
  const planForStore = plan === 'annual' ? 'yearly' : 'monthly';

  // Live prices from the store (falls back to pinned labels off-device / pre-load)
  // so the UI never shows a price that differs from Apple's purchase sheet.
  const storePrices = useStorePrices();
  const annualPriceLabel = storePrices.annualDisplay ? `${storePrices.annualDisplay}/year` : ANNUAL_PRICE_LABEL;
  const monthlyPriceLabel = storePrices.monthlyDisplay ? `${storePrices.monthlyDisplay}/month` : MONTHLY_PRICE_LABEL;
  const annualMonthlyBreakdown = storePrices.annualPerMonthDisplay ? `${storePrices.annualPerMonthDisplay}/mo` : ANNUAL_MONTHLY_BREAKDOWN;
  const annualSavingsBadge = storePrices.annualSavingsPct ? `Save ${storePrices.annualSavingsPct}%` : ANNUAL_SAVINGS_BADGE;
  const selectedPlanPriceLabel = plan === 'annual' ? annualPriceLabel : monthlyPriceLabel;
  // Which CTAs to show. When Paywall #1's Subscribe / Trial button opened this
  // modal, mirror ONLY that button (one CTA per modal). Otherwise show both.
  const showSubscribeCta = preferredPaywallCta !== 'start_free_trial';
  const showTrialCta = preferredPaywallCta !== 'subscribe_now';

  // Fire view event whenever the modal mounts with a fresh trigger.
  // Also persist the trigger to the user record so Apple's eventual
  // server-to-server day-7 charge webhook can stamp the
  // `subscription_purchased` analytics event with the original attribution.
  useEffect(() => {
    if (visible && pendingTrigger) {
      openedAtRef.current = Date.now();
      if (user?.id && STAGE_2_PAYWALL_TRIGGERS.has(pendingTrigger)) {
        markPostFirstWorkoutPaywallShown(user.id).catch(() => { });
      }
      Analytics.paywallViewed(token, {
        trigger_source: pendingTrigger,
        stage,
        trigger: pendingTrigger,
        is_founding_window: isFoundingWindow,
      });
      if (token) {
        console.log('[IAP] POST /api/subscription/record-trigger — starting', {
          trigger: pendingTrigger,
          plan,
        });
        apiFetch('/api/subscription/record-trigger', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ trigger: pendingTrigger, plan }),
        })
          .then((res) => {
            if (res.ok) {
              console.log('[IAP] POST /api/subscription/record-trigger — OK', res.status);
            } else {
              console.error('[IAP] POST /api/subscription/record-trigger — FAILED', res.status, res.error);
            }
          })
          .catch((err) => {
            console.error('[IAP] POST /api/subscription/record-trigger — network error', err);
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

  const handleStartTrial = async (ctaName: PaywallCta = 'start_free_trial') => {
    // Launch-critical: which CTA was tapped (the single biggest funnel gap).
    Analytics.paywallCtaTapped(token, {
      cta: ctaName,
      trigger_source: pendingTrigger ?? 'unknown',
      variant: isFoundingWindow ? 'founding' : 'standard',
    });
    // Tag the trial start with the originating paywall trigger. The same
    // attribution sticks through `subscription_purchased` via
    // `lastConversionTrigger` + server-side `subscription.last_trigger_source`.
    if (ctaName === 'start_free_trial') {
      Analytics.trialStarted(token, { plan, trigger_source: pendingTrigger ?? 'unknown' });
    }

    const productID = productIDForPlan(planForStore, ctaName);
    const appAccountToken = appAccountTokenForUserId(user?.id);

    // 1a — StoreKit/Play purchase sheet about to open.
    Analytics.purchaseInitiated(token, { plan_id: productID, stage });

    // No native store module (web preview / Expo Go / a build where the
    // module failed to link). In DEV we optimistically flip local state so QA
    // on those surfaces can proceed. In PRODUCTION we must NEVER grant access
    // without a real transaction — doing so let users past the paywall (and
    // opened every downstream gate) without paying. Surface an error instead.
    if (!isStoreKitAvailable()) {
      if (__DEV__) {
        Analytics.purchaseCompleted(token, { plan_id: productID, is_trial: true });
        setStatus('in_trial');
        dismissPaywall();
      } else {
        Analytics.purchaseFailed(token, { plan_id: productID, failure_reason: 'unknown' });
        Alert.alert(
          'Purchases unavailable',
          'We couldn’t reach the App Store just now. Please check your connection and try again.',
        );
      }
      return;
    }

    try {
      const result = await storeKitPurchase(productID, appAccountToken);
      if (result.status === 'success') {
        setPurchaseBusy(true);
        try {
          // Server-side reconciliation: persists subscription, fires
          // `subscription_purchased` with the original `trigger_source`
          // pulled from the user record (set by `record-trigger` when this
          // modal mounted).
          let isTrial = false;
          if (token) {
            const validateRes = await validateSubscriptionTransaction(token, result);
            if (!validateRes.ok) {
              // Server REFUSED to grant access (e.g. this Apple subscription
              // is linked to another MOOD profile). Do NOT show success or
              // dismiss — tell the user exactly what's wrong.
              Analytics.purchaseFailed(token, {
                plan_id: result.productID,
                failure_reason: 'server_validation_rejected',
              });
              Alert.alert(
                'Purchase not linked',
                validationFailureMessage(validateRes.error),
              );
              return;
            }
            isTrial = validateRes.data?.status === 'in_trial';
            await refreshSubscriptionState();
          }
          Analytics.subscriptionPurchased(token, {
            plan,
            trigger_source: lastConversionTrigger ?? pendingTrigger ?? 'unknown',
          });
          Analytics.purchaseCompleted(token, { plan_id: result.productID, is_trial: isTrial });
          clearConversionTrigger();
          if (!token) {
            setStatus('in_trial');
          }
          dismissPaywall();
        } finally {
          setPurchaseBusy(false);
        }
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
    setPurchaseBusy(true);
    try {
      const entitlements = await storeKitRestore();
      if (entitlements.length > 0 && token) {
        Analytics.restorePurchasesCompleted(token, {
          restored_plan_id: entitlements[0]?.productID,
        });
        const latest = await getLatestSubscriptionEntitlement();
        if (latest) {
          const validateRes = await validateSubscriptionTransaction(token, latest);
          if (!validateRes.ok) {
            Alert.alert(
              'Restore not linked',
              validationFailureMessage(validateRes.error),
            );
            return;
          }
        }
        await refreshSubscriptionState();
        dismissPaywall();
      }
    } catch (err) {
      console.error('StoreKit restore failed', err);
    } finally {
      setPurchaseBusy(false);
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
    const pid = next === 'annual' ? YEARLY_TRIAL_PRODUCT_ID : MONTHLY_TRIAL_PRODUCT_ID;
    Analytics.planSelected(token, { plan_id: pid, stage });
  };

  const handleOpenLink = (kind: 'privacy' | 'terms') => {
    dismissPaywall();
    router.push(kind === 'privacy' ? '/privacy-policy' : '/terms-of-service');
  };

  const handleManageBilling = () => {
    Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => { });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => handleDismiss('back_swipe')}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          {(purchaseBusy || foundingBusy) && (
            <View style={styles.purchaseBusyOverlay}>
              <ActivityIndicator size="large" color={COLORS.accent} />
              <Text style={styles.purchaseBusyText}>Activating your subscription…</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => handleDismiss('x_button')}
            testID="paywall-close"
            data-testid="paywall-close"
            disabled={purchaseBusy || foundingBusy}
          >
            <Ionicons name="close" size={22} color={COLORS.textTertiary} />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollArea}
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
              {FEATURE_BULLETS.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}

              <View style={styles.groupDivider}>
                <View style={styles.groupDividerLine} />
                <Text style={styles.groupDividerLabel}>THE COMMUNITY</Text>
                <View style={styles.groupDividerLine} />
              </View>

              {COMMUNITY_BULLETS.map((bullet) => (
                <View key={bullet} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{bullet}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Pinned footer — plan picker + CTA stay visible without scrolling,
              regardless of screen size or how long the value list runs. */}
          <View style={styles.footer}>
            {/* ONE step for everyone: (founding CTA) → plan picker → Subscribe
                Now → Start Free Trial. Prices live on the plan cards and the
                caption — never on the buttons. */}
            {isFoundingOffer && (
              <>
                <View style={styles.foundingBanner}>
                  <Ionicons name="flash" size={16} color={COLORS.accent} />
                  <Text style={styles.foundingBannerText}>
                    Founding pricing — <Text style={styles.bold}>$39/yr locked forever</Text>.
                    Standard pricing will be {annualPriceLabel} while this offer is active.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.cta}
                  onPress={handleClaimFounding}
                  disabled={foundingBusy || purchaseBusy}
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
              </>
            )}

            <View style={styles.plans}>
              <PlanCard
                selected={plan === 'annual'}
                onPress={() => handlePlanSelect('annual')}
                label="Annual"
                price={annualPriceLabel}
                trailing={annualMonthlyBreakdown}
                badge={annualSavingsBadge}
                testID="paywall-plan-annual"
              />
              <PlanCard
                selected={plan === 'monthly'}
                onPress={() => handlePlanSelect('monthly')}
                label="Monthly"
                price={monthlyPriceLabel}
                testID="paywall-plan-monthly"
              />
            </View>

            {showSubscribeCta && (
              <TouchableOpacity
                style={styles.cta}
                onPress={() => handleStartTrial('subscribe_now')}
                disabled={foundingBusy || purchaseBusy}
                testID="paywall-subscribe-now"
                data-testid="paywall-subscribe-now"
              >
                <LinearGradient
                  colors={[...BRAND_GRADIENT]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  <Text style={styles.ctaLabel}>Subscribe Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {showSubscribeCta && showTrialCta && (
              <View style={styles.orDivider}>
                <Text style={styles.orText}>or</Text>
              </View>
            )}

            {showTrialCta && (
              showSubscribeCta ? (
                <TouchableOpacity
                  style={styles.trialBtn}
                  onPress={() => handleStartTrial('start_free_trial')}
                  disabled={foundingBusy || purchaseBusy}
                  activeOpacity={0.8}
                  testID="paywall-start-trial"
                  data-testid="paywall-start-trial"
                >
                  <Text style={styles.trialBtnLabel}>Start 7-Day Free Trial</Text>
                </TouchableOpacity>
              ) : (
                // Trial is the ONLY cta on this modal — promote it to the
                // gradient primary so the single button reads as the action.
                <TouchableOpacity
                  style={styles.cta}
                  onPress={() => handleStartTrial('start_free_trial')}
                  disabled={foundingBusy || purchaseBusy}
                  testID="paywall-start-trial"
                  data-testid="paywall-start-trial"
                >
                  <LinearGradient
                    colors={[...BRAND_GRADIENT]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaLabel}>Start 7-Day Free Trial</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )
            )}

            <Text style={styles.ctaCaption}>
              {!showSubscribeCta
                ? `7 days free, then ${selectedPlanPriceLabel}. Cancel anytime in Settings.`
                : !showTrialCta
                  ? `${selectedPlanPriceLabel}${plan === 'annual' ? ` (${annualMonthlyBreakdown})` : ''} billed today. Cancel anytime in Settings.`
                  : `Subscribe today for ${selectedPlanPriceLabel}${plan === 'annual' ? ` (${annualMonthlyBreakdown})` : ''}, or try 7 days free first. Cancel anytime in Settings.`}
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
          </View>
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
    paddingTop: 16,
    paddingHorizontal: 24,
    maxHeight: '94%',
    overflow: 'hidden',
  },
  purchaseBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  purchaseBusyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
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
  scrollArea: {
    // Bounds the scrollable header+bullets region so it shrinks (and scrolls)
    // when content exceeds the sheet's maxHeight, keeping the footer pinned.
    flexShrink: 1,
  },
  scroll: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  footer: {
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 4,
  },
  iconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 6,
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
    marginBottom: 6,
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 4,
  },
  subhead: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  bullets: {
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accent,
    marginRight: 14,
  },
  bulletText: {
    // flex so long lines wrap instead of clipping off the right edge.
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  groupDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 6,
  },
  groupDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 215, 0, 0.28)',
  },
  groupDividerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
    letterSpacing: 1.3,
  },
  plans: {
    marginBottom: 8,
  },
  choicePanel: {
    marginBottom: 8,
  },
  planStep: {
    marginBottom: 2,
  },
  backToChoice: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    marginBottom: 2,
  },
  backToChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 6,
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
    marginBottom: 6,
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
  bold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
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
    paddingVertical: 4,
  },
  orText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontWeight: '600',
  },
  trialBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginBottom: 2,
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
    marginBottom: 6,
  },
  disclosure: {
    fontSize: 10,
    lineHeight: 15,
    color: COLORS.textTertiary,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 2,
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
    paddingTop: 4,
    paddingBottom: 2,
    alignItems: 'center',
  },
  manageText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
