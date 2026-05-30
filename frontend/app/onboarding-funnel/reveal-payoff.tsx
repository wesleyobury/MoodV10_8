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
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import {
  GOAL_LABELS,
  LEVEL_LABELS,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useTrialPurchase } from '../../hooks/useTrialPurchase';
import { useFoundingPurchase } from '../../hooks/useFoundingPurchase';
import { foundingDaysRemaining } from '../../utils/founding';
import { FORCE_SIGNUP_PAYWALL } from '../../utils/devFlags';

const { height } = Dimensions.get('window');
const MANAGE_SUBS_URL = 'https://apps.apple.com/account/subscriptions';
const HERO_URI =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80';
const WEARABLES_ROUTE = '/onboarding/health-connect';

export default function RevealPayoff() {
  const router = useRouter();
  const { answers } = useOnboardingFunnel();
  const { user, token, entitlement } = useAuth();
  const { openPaywall } = useSubscription();
  const { startTrial } = useTrialPurchase();
  const { claimFounding } = useFoundingPurchase();
  const [busy, setBusy] = useState<null | 'trial' | 'founding'>(null);
  const completedRef = useRef(false);

  const firstName =
    (user?.name && user.name.split(' ')[0]) || user?.username || 'Athlete';
  const goal = answers.primaryGoal ? GOAL_LABELS[answers.primaryGoal] : 'your goal';
  const level = answers.fitnessLevel ? LEVEL_LABELS[answers.fitnessLevel] : 'your level';
  const length = answers.workoutLength ?? 30;

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

  // STANDARD primary — direct StoreKit trial (NOT the PaywallModal).
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

  // STANDARD strong-secondary — open the PaywallModal plan picker.
  const handleSubscribeNow = () => {
    Analytics.revealCtaTapped(token, { cta: 'subscribe_now' });
    fireCompleted();
    openPaywall(FORCE_SIGNUP_PAYWALL ? 'post_onboarding_dev' : 'post_onboarding_soft');
    router.replace(WEARABLES_ROUTE);
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

  // Tertiary — 'Build and save it for later'.
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
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>YOUR MOOD PROFILE</Text>
            <Text style={styles.heroHeadline}>{firstName}, built for you.</Text>
            <Text style={styles.heroSubhead}>
              Tuned to {goal} · {level} · {length} min
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.bottom}>
          <View style={styles.previewRow}>
            <PreviewCard icon="barbell" caption={'Workouts tuned\nto your mood, every day.'} />
            <PreviewCard icon="pulse" caption={'Live heart rate.\nShareable charts.'} />
            <PreviewCard icon="moon" caption={'Adapts to how\nrecovered you are.'} />
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
              onStartTrial={handleStartTrial}
              onSubscribeNow={handleSubscribeNow}
              onSkip={handleSkip}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StandardVariant({
  busyTrial,
  onStartTrial,
  onSubscribeNow,
  onSkip,
}: {
  busyTrial: boolean;
  onStartTrial: () => void;
  onSubscribeNow: () => void;
  onSkip: () => void;
}) {
  return (
    <>
      <TouchableOpacity style={styles.cta} onPress={onStartTrial} disabled={busyTrial}
        testID="reveal-start-cta" data-testid="reveal-start-cta">
        <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
          {busyTrial ? (
            <ActivityIndicator color={COLORS.accentInk} />
          ) : (
            <>
              <Text style={styles.ctaLabel}>Start 7-Day Free Trial</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.accentInk} style={styles.ctaIcon} />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.outlineCta} onPress={onSubscribeNow} activeOpacity={0.85}
        testID="reveal-subscribe-cta" data-testid="reveal-subscribe-cta">
        <Text style={styles.outlineCtaLabel}>Subscribe Now</Text>
      </TouchableOpacity>

      <Disclosure trial />

      <TouchableOpacity style={styles.tertiaryCta} onPress={onSkip} activeOpacity={0.7}
        testID="reveal-try-free-cta" data-testid="reveal-try-free-cta">
        <Text style={styles.tertiaryCtaLabel}>Build and save it for later if you aren&apos;t ready</Text>
      </TouchableOpacity>
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
        ? '7 days free, then $79.00/year. Auto-renews unless cancelled at least 24 hours before the trial ends. '
        : '$39.00/year, auto-renews unless cancelled at least 24 hours before renewal. '}
      <Text style={styles.link} onPress={() => Linking.openURL(MANAGE_SUBS_URL)}>Manage subscription</Text>
      <Text> · </Text>
      <Text style={styles.link} onPress={() => router.push('/terms-of-service')}>Terms</Text>
      <Text> · </Text>
      <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>Privacy</Text>
    </Text>
  );
}

function PreviewCard({
  icon,
  caption,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  caption: string;
}) {
  return (
    <View style={styles.previewCard}>
      <Ionicons name={icon} size={22} color={COLORS.accent} />
      <Text style={styles.previewCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1 },
  hero: { height: Math.max(height * 0.5, 380), justifyContent: 'flex-end' },
  heroContent: { padding: 24, paddingBottom: 28 },
  eyebrow: { fontSize: 11, letterSpacing: 1.8, fontWeight: '600', color: COLORS.accent, marginBottom: 12, textTransform: 'uppercase' },
  heroHeadline: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.8, marginBottom: 8 },
  heroSubhead: { fontSize: 15, color: COLORS.textSecondary },
  bottom: { padding: 24, paddingTop: 20, backgroundColor: COLORS.bg },
  previewRow: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  previewCard: { flex: 1, padding: 14, borderRadius: 14, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', minHeight: 104 },
  previewCaption: { marginTop: 12, fontSize: 12, lineHeight: 17, color: COLORS.textSecondary, fontWeight: '500' },
  cta: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, minHeight: 54 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
  ctaIcon: { marginLeft: 8 },
  outlineCta: { borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.accent, paddingVertical: 14, alignItems: 'center', marginBottom: 14 },
  outlineCtaLabel: { fontSize: 15, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.2 },
  foundingBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.surfaceElevated, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', padding: 12, marginBottom: 16 },
  foundingBannerText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  bold: { color: COLORS.accent, fontWeight: '700' },
  disclosure: { fontSize: 10, lineHeight: 15, color: COLORS.textTertiary, textAlign: 'center', marginBottom: 10 },
  link: { color: COLORS.textSecondary, textDecorationLine: 'underline' },
  tertiaryCta: { paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  tertiaryCtaLabel: { fontSize: 13, fontWeight: '500', color: COLORS.textTertiary, textDecorationLine: 'underline', textDecorationColor: 'rgba(255,255,255,0.25)' },
});
