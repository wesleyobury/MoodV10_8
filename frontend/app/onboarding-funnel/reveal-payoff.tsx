/**
 * Reveal Payoff — the conversion moment + Soft Paywall #1 (MOOD V2 Phase 4.1).
 *
 * Two variants:
 *  • FOUNDING (existing founding-eligible users during the window): single
 *    primary 'Claim Founding Price — $39/year' + a tertiary skip.
 *  • STANDARD (everyone else): 3-CTA stack —
 *      1. 'Start 7-Day Free Trial' → DIRECT StoreKit (NOT the PaywallModal)
 *      2. 'Subscribe Now'          → opens PaywallModal plan picker
 *      3. 'Build and save it for later if you aren't ready' → skip to wearables
 *
 * Apple disclosure copy is rendered on-screen (App Store requirement).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import {
  GOAL_LABELS,
  LEVEL_LABELS,
  PrimaryGoal,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';
import { useTrialPurchase } from '../../hooks/useTrialPurchase';
import { useFoundingPurchase } from '../../hooks/useFoundingPurchase';
import { foundingDaysRemaining } from '../../utils/founding';
import { isStoreKitAvailable, restorePurchases } from '../../modules/mood-storekit/src';

const { height } = Dimensions.get('window');
const MANAGE_SUBS_URL = 'https://apps.apple.com/account/subscriptions';
const HERO_URI =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80';
const WEARABLES_ROUTE = '/onboarding/health-connect';

// Gold pillar line keyed to the user's primary goal.
const GOAL_PILLARS: Record<PrimaryGoal, string> = {
  feel_better: 'ENERGY · MOBILITY · MOOD',
  build_strength: 'STRENGTH · MUSCLE · POWER',
  improve_physique: 'SCULPT · DEFINITION · TONE',
  lose_weight: 'FAT-BURN · CONDITIONING · ENERGY',
  stress_relief: 'CALM · RECOVERY · BALANCE',
  consistency: 'HABIT · MOMENTUM · CONSISTENCY',
};

const SOCIAL_AVATARS = [
  'https://i.pravatar.cc/80?img=12',
  'https://i.pravatar.cc/80?img=32',
  'https://i.pravatar.cc/80?img=45',
  'https://i.pravatar.cc/80?img=68',
];

export default function RevealPayoff() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { answers } = useOnboardingFunnel();
  const { user, token, entitlement, refreshEntitlement } = useAuth();
  const { startTrial } = useTrialPurchase();
  const { claimFounding } = useFoundingPurchase();
  const [busy, setBusy] = useState<null | 'trial' | 'founding'>(null);
  const completedRef = useRef(false);

  const firstName =
    (user?.name && user.name.split(' ')[0]) || user?.username || 'Athlete';
  const goal = answers.primaryGoal ? GOAL_LABELS[answers.primaryGoal] : 'your goal';
  const level = answers.fitnessLevel ? LEVEL_LABELS[answers.fitnessLevel] : 'your level';
  const length = answers.workoutLength ?? 30;
  const pillar = answers.primaryGoal
    ? GOAL_PILLARS[answers.primaryGoal]
    : 'STRENGTH · RECOVERY · PERFORMANCE';
  const blurb = `A ${level.toLowerCase()} starting point, ${length}-minute sessions, every workout tuned toward ${goal.toLowerCase()}.`;

  const isFoundingEligible =
    !!entitlement?.is_founding_member &&
    !entitlement?.founding_pricing_claimed &&
    !!entitlement?.founding_window_active;
  const daysLeft = foundingDaysRemaining(entitlement?.founding_window_expires_at);

  useEffect(() => {
    const variant = isFoundingEligible ? 'founding' : 'standard';
    const trigger = isFoundingEligible ? 'post_onboarding_founding' : 'post_onboarding_soft';
    Analytics.revealScreenViewed(token, { stage: 'payoff', variant });
    Analytics.paywallViewed(token, { trigger_source: trigger });
  }, [token, isFoundingEligible]);

  const fireCompleted = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    Analytics.onboardingCompleted(token, {
      mood: answers.mood,
      primary_goal: answers.primaryGoal,
      fitness_level: answers.fitnessLevel,
      biggest_barrier: answers.biggestBarrier,
      workout_length: answers.workoutLength,
      equipment: answers.equipment,
    });
  };

  const goWearables = () => router.replace(WEARABLES_ROUTE);

  // STANDARD primary — direct StoreKit MONTHLY trial (NOT the PaywallModal).
  // Both 'Subscribe Now' and 'Start my 7-day free trial' call this.
  const handleStartTrial = async () => {
    if (busy) return;
    Analytics.revealCtaTapped(token, { cta: 'start_free_trial' });
    fireCompleted();
    setBusy('trial');
    const result = await startTrial('post_onboarding_soft');
    setBusy(null);
    if (result === 'success') goWearables();
    // cancelled/error: stay on screen so the user can retry or skip.
  };

  const handleRestore = async () => {
    Analytics.revealCtaTapped(token, { cta: 'restore_purchase' });
    if (!isStoreKitAvailable()) {
      Linking.openURL(MANAGE_SUBS_URL);
      return;
    }
    try {
      await restorePurchases();
      await refreshEntitlement();
    } catch {
      // no-op — nothing to restore.
    }
  };

  // FOUNDING primary — claim + StoreKit founding SKU.
  const handleClaimFounding = async () => {
    if (busy) return;
    Analytics.revealCtaTapped(token, { cta: 'claim_founding' });
    fireCompleted();
    setBusy('founding');
    const result = await claimFounding('post_onboarding_founding');
    setBusy(null);
    if (result === 'success' || result === 'ineligible') goWearables();
  };

  // Safety net — 'Build now & save it for later' + the ✕ close.
  const handleSkip = () => {
    Analytics.revealCtaTapped(token, { cta: 'build_and_save_for_later' });
    fireCompleted();
    goWearables();
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']} testID="reveal-payoff" data-testid="reveal-payoff">
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        <ImageBackground source={{ uri: HERO_URI }} style={styles.hero} resizeMode="cover">
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.4)', COLORS.bg]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroHeader, { top: insets.top + 8 }]}>
            <Text style={styles.wordmark}>MOOD</Text>
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={12}
              style={styles.closeBtn}
              testID="reveal-close"
              data-testid="reveal-close"
            >
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>YOUR MOOD PROFILE IS READY</Text>
            <Text style={styles.heroHeadline}>{firstName}, your plan is ready.</Text>
            <Text style={styles.pillar}>{pillar}</Text>
            <Text style={styles.heroSubhead}>{blurb}</Text>
          </View>
        </ImageBackground>

        <View style={styles.bottom}>
          <View style={styles.features}>
            <FeatureCard
              icon="sparkles"
              title="Mood-based engine"
              subtext="Workouts tuned to how you feel — every single day."
              highlight
            />
            <FeatureCard
              icon="trending-up"
              title="Adaptive difficulty"
              subtext="Reads your recovery and adjusts load automatically."
            />
            <FeatureCard
              icon="pulse"
              title="Live tracking & charts"
              subtext="Real-time heart rate and shareable progress."
            />
          </View>

          {isFoundingEligible ? (
            <FoundingVariant
              daysLeft={daysLeft}
              busy={busy === 'founding'}
              onClaim={handleClaimFounding}
              onSkip={handleSkip}
            />
          ) : (
            <StandardVariant
              busyTrial={busy === 'trial'}
              onPrimary={handleStartTrial}
              onSkip={handleSkip}
              onRestore={handleRestore}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StandardVariant({
  busyTrial,
  onPrimary,
  onSkip,
  onRestore,
}: {
  busyTrial: boolean;
  onPrimary: () => void;
  onSkip: () => void;
  onRestore: () => void;
}) {
  const router = useRouter();
  return (
    <>
      <View style={styles.socialStat}>
        <View style={styles.avatars}>
          {SOCIAL_AVATARS.map((uri, i) => (
            <Image
              key={uri}
              source={{ uri }}
              style={[styles.avatar, i > 0 && styles.avatarOverlap]}
            />
          ))}
        </View>
        <Text style={styles.socialStatText}>
          Join <Text style={styles.bold}>92%</Text> of users who completed a workout in their first
          week
        </Text>
      </View>

      <TouchableOpacity
        style={styles.cta}
        onPress={onPrimary}
        disabled={busyTrial}
        testID="reveal-subscribe-cta"
        data-testid="reveal-subscribe-cta"
      >
        <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
          {busyTrial ? (
            <ActivityIndicator color={COLORS.accentInk} />
          ) : (
            <Text style={styles.ctaLabel}>Subscribe Now</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Disclosure trial />

      <TouchableOpacity
        style={styles.trialLink}
        onPress={onPrimary}
        disabled={busyTrial}
        activeOpacity={0.7}
        testID="reveal-start-cta"
        data-testid="reveal-start-cta"
      >
        <Text style={styles.trialLinkLabel}>Start my 7-day free trial</Text>
      </TouchableOpacity>

      <View style={styles.trustRow}>
        <Ionicons name="lock-closed" size={12} color={COLORS.textTertiary} />
        <Text style={styles.trustText}>Billed securely by Apple · Cancel in 2 taps</Text>
      </View>

      <TouchableOpacity
        style={styles.tertiaryCta}
        onPress={onSkip}
        activeOpacity={0.7}
        testID="reveal-try-free-cta"
        data-testid="reveal-try-free-cta"
      >
        <Text style={styles.tertiaryCtaLabel}>Build now &amp; save it for later</Text>
      </TouchableOpacity>

      <Text style={styles.legalRow}>
        <Text style={styles.link} onPress={onRestore}>Restore Purchase</Text>
        <Text> · </Text>
        <Text style={styles.link} onPress={() => router.push('/terms-of-service')}>Terms</Text>
        <Text> · </Text>
        <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>Privacy</Text>
      </Text>
    </>
  );
}

function FoundingVariant({
  daysLeft,
  busy,
  onClaim,
  onSkip,
}: {
  daysLeft: number;
  busy: boolean;
  onClaim: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <View style={styles.foundingBanner}>
        <Ionicons name="flash" size={16} color={COLORS.accent} />
        <Text style={styles.foundingBannerText}>
          Founding pricing — <Text style={styles.bold}>$39/yr locked forever</Text>. Standard pricing
          will be $79/year. Available for {daysLeft} more day{daysLeft === 1 ? '' : 's'}.
        </Text>
      </View>

      <TouchableOpacity style={styles.cta} onPress={onClaim} disabled={busy}
        testID="reveal-founding-cta" data-testid="reveal-founding-cta">
        <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
          {busy ? (
            <ActivityIndicator color={COLORS.accentInk} />
          ) : (
            <Text style={styles.ctaLabel}>Claim Founding Price — $39/year</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Disclosure trial={false} />

      <TouchableOpacity style={styles.tertiaryCta} onPress={onSkip} activeOpacity={0.7}
        testID="reveal-try-free-cta" data-testid="reveal-try-free-cta">
        <Text style={styles.tertiaryCtaLabel}>Build and save it for later</Text>
      </TouchableOpacity>
    </>
  );
}

function Disclosure({ trial }: { trial: boolean }) {
  const router = useRouter();
  return (
    <Text style={styles.disclosure}>
      {trial
        ? '7 days free, then $9.99/mo. Cancel anytime. Auto-renews unless cancelled at least 24 hours before the trial ends. '
        : '$39.00/year, auto-renews unless cancelled at least 24 hours before renewal. '}
      <Text style={styles.link} onPress={() => Linking.openURL(MANAGE_SUBS_URL)}>Manage subscription</Text>
      <Text> · </Text>
      <Text style={styles.link} onPress={() => router.push('/terms-of-service')}>Terms</Text>
      <Text> · </Text>
      <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>Privacy</Text>
    </Text>
  );
}

function FeatureCard({
  icon,
  title,
  subtext,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.featureCard, highlight && styles.featureCardHighlight]}>
      <View style={[styles.featureIcon, highlight && styles.featureIconHighlight]}>
        <Ionicons name={icon} size={18} color={highlight ? COLORS.accentInk : COLORS.accent} />
      </View>
      <View style={styles.featureBody}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureSubtext}>{subtext}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1 },
  hero: { height: Math.max(height * 0.5, 380), justifyContent: 'flex-end' },
  heroHeader: {
    position: 'absolute',
    left: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: { fontSize: 18, fontWeight: '900', letterSpacing: 3, color: COLORS.textPrimary },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroContent: { padding: 24, paddingBottom: 28 },
  eyebrow: { fontSize: 11, letterSpacing: 1.8, fontWeight: '600', color: COLORS.accent, marginBottom: 12, textTransform: 'uppercase' },
  heroHeadline: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.8, marginBottom: 8 },
  pillar: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, color: COLORS.accent, marginBottom: 10 },
  heroSubhead: { fontSize: 15, lineHeight: 21, color: COLORS.textSecondary },
  bottom: { padding: 24, paddingTop: 20, backgroundColor: COLORS.bg },
  features: { gap: 10, marginBottom: 22 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featureCardHighlight: { borderColor: 'rgba(255,215,0,0.4)', backgroundColor: COLORS.surfaceElevated },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  featureIconHighlight: { backgroundColor: COLORS.accent },
  featureBody: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  featureSubtext: { fontSize: 12, lineHeight: 17, color: COLORS.textSecondary },
  socialStat: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatars: { flexDirection: 'row' },
  avatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: COLORS.bg },
  avatarOverlap: { marginLeft: -10 },
  socialStatText: { flex: 1, fontSize: 12, lineHeight: 17, color: COLORS.textSecondary },
  cta: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, minHeight: 54 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
  trialLink: { paddingVertical: 8, alignItems: 'center', marginBottom: 12 },
  trialLinkLabel: { fontSize: 14, fontWeight: '600', color: COLORS.accent, letterSpacing: 0.2 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14 },
  trustText: { fontSize: 11, color: COLORS.textTertiary },
  legalRow: { fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', marginTop: 4 },
  foundingBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', padding: 12, marginBottom: 16 },
  foundingBannerText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  bold: { color: COLORS.accent, fontWeight: '700' },
  disclosure: { fontSize: 10, lineHeight: 15, color: COLORS.textTertiary, textAlign: 'center', marginBottom: 10 },
  link: { color: COLORS.textSecondary, textDecorationLine: 'underline' },
  tertiaryCta: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  tertiaryCtaLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textTertiary, textDecorationLine: 'underline', textDecorationColor: 'rgba(255,255,255,0.25)' },
});
