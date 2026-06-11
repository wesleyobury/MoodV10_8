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
import MaskedView from '@react-native-masked-view/masked-view';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import {
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
const HERO_IMAGE = require('../../assets/images/payoff-hero.png');
const WEARABLES_ROUTE = '/onboarding/health-connect';

// Short goal word used in the personalized hero blurb.
const GOAL_BLURB_WORD: Record<PrimaryGoal, string> = {
  feel_better: 'feel-better',
  build_strength: 'strength',
  improve_physique: 'physique',
  lose_weight: 'weight-loss',
  stress_relief: 'stress-relief',
  consistency: 'consistency',
};

// Value props shown as compact feature cards.
const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; subtext: string }[] = [
  { icon: 'locate', title: 'Personalized to your goals', subtext: 'Built around your goal, level & time.' },
  { icon: 'watch', title: 'Live heart rate & wearables', subtext: 'Real-time metrics, smarter training.' },
  { icon: 'stats-chart', title: 'Progress that matters', subtext: 'Track your trends and wins.' },
  { icon: 'people', title: 'Social accountability', subtext: 'Share, compete, stay on track.' },
  { icon: 'infinite', title: 'Unlimited access', subtext: 'Every workout & program, always.' },
];

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
  const moodWord = answers.mood ?? 'chosen';
  const goalWord = answers.primaryGoal ? GOAL_BLURB_WORD[answers.primaryGoal] : 'your';
  const levelWord = answers.fitnessLevel
    ? LEVEL_LABELS[answers.fitnessLevel].toLowerCase()
    : 'current';
  const blurb = `Based on your ${moodWord} mood, ${goalWord} goal, and ${levelWord} level, we've built a training system designed specifically for you.`;

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
        <ImageBackground source={HERO_IMAGE} style={styles.hero} resizeMode="cover">
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.4)', COLORS.bg]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroHeader, { top: insets.top + 8 }]}>
            <MaskedView maskElement={<Text style={styles.wordmark}>MOOD</Text>}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.wordmark, { opacity: 0 }]}>MOOD</Text>
              </LinearGradient>
            </MaskedView>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroHeadline}>{firstName}, your plan is ready.</Text>
            <Text style={styles.heroSubhead}>{blurb}</Text>
          </View>
        </ImageBackground>

        <View style={styles.bottom}>
          <View style={styles.features}>
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} subtext={f.subtext} />
            ))}
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

      <View style={styles.orDivider}>
        <Text style={styles.orText}>or</Text>
      </View>

      <TouchableOpacity
        style={styles.trialBtn}
        onPress={onPrimary}
        disabled={busyTrial}
        activeOpacity={0.8}
        testID="reveal-start-cta"
        data-testid="reveal-start-cta"
      >
        <Text style={styles.trialBtnLabel}>Start my 7-day free trial</Text>
      </TouchableOpacity>

      <Disclosure trial />

      <View style={styles.trustRow}>
        <Ionicons name="lock-closed" size={12} color={COLORS.textTertiary} />
        <Text style={styles.trustText}>Billed securely by Apple · Cancel in 2 taps</Text>
      </View>

      <Text style={styles.legalRow}>
        <Text style={styles.link} onPress={onRestore}>Restore Purchase</Text>
        <Text> · </Text>
        <Text style={styles.link} onPress={() => router.push('/terms-of-service')}>Terms</Text>
        <Text> · </Text>
        <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>Privacy</Text>
      </Text>

      <View style={styles.safetyNet}>
        <Text style={styles.safetyPrompt}>Don&apos;t wanna commit? 👇</Text>
        <TouchableOpacity
          style={styles.tertiaryCta}
          onPress={onSkip}
          activeOpacity={0.7}
          testID="reveal-try-free-cta"
          data-testid="reveal-try-free-cta"
        >
          <Text style={styles.tertiaryCtaLabel}>Build now &amp; save it for later</Text>
        </TouchableOpacity>
      </View>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtext: string;
}) {
  return (
    <View style={styles.featureCard}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={18} color={COLORS.accent} />
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
  hero: { height: Math.max(height * 0.34, 280), justifyContent: 'flex-end' },
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
  heroContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12 },
  heroHeadline: { fontSize: 30, lineHeight: 35, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.8, marginBottom: 6 },
  heroSubhead: { fontSize: 14, lineHeight: 19, color: COLORS.textSecondary },
  bottom: { flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, backgroundColor: COLORS.bg },
  features: { gap: 6, marginBottom: 16 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  featureBody: { flex: 1 },
  featureTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 1 },
  featureSubtext: { fontSize: 12, lineHeight: 16, color: COLORS.textSecondary },
  socialStat: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatars: { flexDirection: 'row' },
  avatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: COLORS.bg },
  avatarOverlap: { marginLeft: -10 },
  socialStatText: { flex: 1, fontSize: 12, lineHeight: 17, color: COLORS.textSecondary },
  cta: { borderRadius: 14, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, minHeight: 54 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
  orDivider: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  orText: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '600' },
  trialBtn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  trialBtnLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 0.2 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: 12 },
  trustText: { fontSize: 11, color: COLORS.textTertiary },
  legalRow: { fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', marginTop: 4 },
  safetyNet: { marginTop: 'auto', paddingTop: 18, alignItems: 'center' },
  safetyPrompt: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  foundingBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', padding: 12, marginBottom: 16 },
  foundingBannerText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  bold: { color: COLORS.accent, fontWeight: '700' },
  disclosure: { fontSize: 10, lineHeight: 15, color: COLORS.textTertiary, textAlign: 'center', marginTop: 8 },
  link: { color: COLORS.textSecondary, textDecorationLine: 'underline' },
  tertiaryCta: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  tertiaryCtaLabel: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary, textDecorationLine: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)' },
});
