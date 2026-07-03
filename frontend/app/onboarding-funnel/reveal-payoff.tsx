/**
 * Reveal Payoff — the conversion moment + Soft Paywall #1.
 *
 * ONE shared layout for both variants. The standard (new-user) screen is the
 * canonical template; the founding variant reuses it verbatim and only swaps
 * TWO things:
 *   • Item 7 (swap slot): standard = 92% social-proof row; founding = founding
 *     pricing block (mutually exclusive, same position).
 *   • Item 8 (primary button label): "Subscribe Now" vs "Claim Founding Price".
 *
 * Architecture note: the hero is a FIXED-HEIGHT block with the headline + blurb
 * anchored to its bottom, followed by a normal top-down content flow. This keeps
 * the hero, headline, blurb, and carousel pixel-identical between variants — the
 * content below the carousel can change height without ever shifting them.
 */
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import {
  LEVEL_LABELS,
  MoodId,
  PrimaryGoal,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Analytics } from '../../utils/analytics';
import { useFoundingPurchase } from '../../hooks/useFoundingPurchase';
import { foundingDaysRemaining } from '../../utils/founding';
import { isStoreKitAvailable, restorePurchases } from '../../modules/mood-storekit/src';
import { useStorePrices } from '../../hooks/useStorePrices';

const MANAGE_SUBS_URL = 'https://apps.apple.com/account/subscriptions';
const PAGE_BG = '#0A0A0A'; // must equal COLORS.bg so the hero fade has no seam

// === SHARED LAYOUT CONSTANTS (used by BOTH variants — never redefined) ===
const HORIZONTAL_PADDING = 24;
const HERO_HEIGHT_RATIO = 0.54; // hero occupies ~top half of the screen
const HERO_MIN_HEIGHT = 340;
const HERO_TEXT_BOTTOM_PADDING = 14; // anchors headline/blurb near the image's bottom third
const CAROUSEL_HEIGHT = 144; // fixed so card swaps never shift anything below
// Fixed, shared space for the swap slot (92% row OR founding block) so the
// primary button and everything below land at the SAME position in both variants.
const SWAP_SLOT_HEIGHT = 70;

// Mood-specific payoff hero photos. 'lazy' reuses the sweat hero per design.
const HERO_IMAGES: Record<MoodId, ReturnType<typeof require>> = {
  sweat: require('../../assets/images/payoff/payoff-sweat.png'),
  muscle: require('../../assets/images/payoff/payoff-muscle.png'),
  explosive: require('../../assets/images/payoff/payoff-explosive.png'),
  lazy: require('../../assets/images/payoff/payoff-sweat.png'),
  calisthenics: require('../../assets/images/payoff/payoff-calisthenics.png'),
  outdoor: require('../../assets/images/payoff/payoff-outdoor.png'),
};
const WEARABLES_ROUTE = '/onboarding/health-connect';

// Short goal word used in the personalized hero blurb.
const GOAL_BLURB_WORD: Record<PrimaryGoal, string> = {
  feel_better: 'feel-better',
  build_strength: 'strength',
  improve_physique: 'physique',
  improve_athleticism: 'athleticism',
  lose_weight: 'weight-loss',
  stress_relief: 'stress-relief',
  consistency: 'consistency',
};

// Value props shown in the auto-swiping feature carousel.
// Mirrors PaywallModal.tsx copy so all three paywalls read consistently.
// Community cards (flame / people / copy) are interleaved early rather than
// trailing, so the social pillar surfaces within the first few auto-advancing
// cards instead of ~20s in.
const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; subtext: string }[] = [
  { icon: 'sparkles', title: 'Mood-based workouts', subtext: 'Unlimited sessions for how you feel.' },
  { icon: 'people', title: 'See & copy other athletes', subtext: 'Browse their content, duplicate any workout.' },
  { icon: 'locate', title: 'Personalized to you', subtext: 'Built around your goals and level.' },
  { icon: 'flame', title: 'An amazing community', subtext: 'Train alongside a driven crew that shows up.' },
  { icon: 'sync', title: 'Adapts to recovery', subtext: 'Intensity tuned to how recovered you are.' },
  { icon: 'watch', title: 'Heart rate & wearables', subtext: 'Real-time metrics from your watch.' },
  { icon: 'stats-chart', title: 'Progress that matters', subtext: 'Shareable charts that track your wins.' },
  { icon: 'barbell', title: 'Full exercise library', subtext: 'Every move, with video guidance.' },
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
  const { openPaywall, pendingTrigger, hasActiveAccess } = useSubscription();
  const { claimFounding } = useFoundingPurchase();
  // Live store prices (fallback to pinned strings off-device / pre-load) so the
  // fine print matches Apple's purchase sheet and localizes by storefront.
  const storePrices = useStorePrices();
  const annualLabel = storePrices.annualDisplay ? `${storePrices.annualDisplay}/year` : '$79/year';
  const monthlyLabel = storePrices.monthlyDisplay ? `${storePrices.monthlyDisplay}/month` : '$9.99/month';
  const [busy, setBusy] = useState<null | 'founding'>(null);
  const completedRef = useRef(false);
  const paywallOpenedRef = useRef(false);
  // Snapshot of access at the moment the paywall is opened, so we can tell a
  // real conversion (access newly gained) apart from a plain dismiss.
  const hadAccessBeforePaywallRef = useRef(false);
  const { height: windowHeight } = useWindowDimensions();
  const screenH = windowHeight;
  const heroHeight = Math.max(screenH * HERO_HEIGHT_RATIO, HERO_MIN_HEIGHT);

  // Prefer the name captured in the funnel, then the provider-supplied name
  // (Google), then the signup username (email/username accounts — their own
  // typed info), and finally a friendly default. Apple relay handles
  // (`apple_user_xxx`) are never shown.
  const usernameFallback =
    user?.username && !user.username.toLowerCase().startsWith('apple_user')
      ? user.username
      : '';
  const firstName =
    answers.firstName?.trim() ||
    (user?.name && user.name.split(' ')[0]) ||
    usernameFallback ||
    'Athlete';
  const moodWord = answers.mood ?? 'chosen';
  const heroImage = HERO_IMAGES[answers.mood ?? 'sweat'] ?? HERO_IMAGES.sweat;
  const goalWord = answers.primaryGoal ? GOAL_BLURB_WORD[answers.primaryGoal] : 'your';
  const levelWord = answers.fitnessLevel
    ? LEVEL_LABELS[answers.fitnessLevel].toLowerCase()
    : 'current';
  const blurb = `Based on your ${moodWord} mood, ${goalWord} goal, and ${levelWord} level, we've curated a library of workouts designed specifically for your preferences. Subscribe now to gain unlimited access.`;

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

  // Advance the funnel ONLY when Soft Paywall #1 actually converted — i.e.
  // access was newly gained while the modal was open (a real purchase / trial).
  // A plain dismiss or a cancelled Apple sheet leaves access unchanged, so the
  // user returns here and must Subscribe, Start Trial, or tap "Try my first
  // workout — free" to move on. (Previously any ambient `hasActiveAccess` —
  // including a leftover sandbox sub or the old dev auto-grant — pushed the
  // user straight into wearables on close.)
  useEffect(() => {
    if (!paywallOpenedRef.current || pendingTrigger) return;
    const convertedNow = hasActiveAccess && !hadAccessBeforePaywallRef.current;
    if (!convertedNow) {
      // Closed without converting — stay on Paywall #1. Reset the latch so a
      // later real purchase can still trigger the advance.
      paywallOpenedRef.current = false;
      return;
    }
    fireCompleted();
    goWearables();
  }, [pendingTrigger, hasActiveAccess]);

  // Soft Paywall #1 — same styled PaywallModal as Stage 2/3 (monthly + annual).
  const handleOpenPaywall = (cta: 'subscribe' | 'start_free_trial') => {
    if (busy) return;
    Analytics.revealCtaTapped(token, { cta });
    paywallOpenedRef.current = true;
    hadAccessBeforePaywallRef.current = hasActiveAccess;
    // The modal mirrors the button the user just tapped — one CTA, no
    // redundant subscribe/trial pair.
    openPaywall('post_onboarding_soft', {
      preferredCta: cta === 'subscribe' ? 'subscribe_now' : 'start_free_trial',
    });
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

  // Founding primary — claim + StoreKit founding SKU.
  const handleClaimFounding = async () => {
    if (busy) return;
    Analytics.revealCtaTapped(token, { cta: 'claim_founding' });
    fireCompleted();
    setBusy('founding');
    const result = await claimFounding('post_onboarding_founding');
    setBusy(null);
    if (result === 'success' || result === 'ineligible') goWearables();
  };

  // Safety net — 'Build now & save it for later'.
  const handleSkip = () => {
    Analytics.revealCtaTapped(token, { cta: 'build_and_save_for_later' });
    fireCompleted();
    goWearables();
  };

  // === The ONLY two per-variant differences ===
  const onPrimary = isFoundingEligible
    ? handleClaimFounding
    : () => handleOpenPaywall('subscribe');
  const primaryBusy = isFoundingEligible ? busy === 'founding' : false;
  const primaryLabel = isFoundingEligible ? 'Claim Founding Price — $39/year' : 'Subscribe Now';
  const primaryTestID = isFoundingEligible ? 'reveal-founding-cta' : 'reveal-subscribe-cta';

  return (
    <View style={styles.root} testID="reveal-payoff" data-testid="reveal-payoff">
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* === 1–4 HERO (wordmark + image + fade + headline + blurb) — SHARED === */}
        <ImageBackground
          source={heroImage}
          style={[styles.hero, { height: heroHeight }]}
          resizeMode="cover"
        >
          {/* Light top scrim — keeps the wordmark legible without darkening the photo */}
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent']}
            locations={[0, 0.28]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          {/* Bottom fade — image melts into the page background (#0A0A0A) */}
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(10,10,10,0.85)', PAGE_BG]}
            locations={[0, 0.45, 0.82, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* MOOD wordmark — gold, top-left */}
          <View style={[styles.wordmarkWrap, { top: insets.top + 8 }]}>
            <MaskedView maskElement={<Text style={styles.wordmark}>MOOD</Text>}>
              <LinearGradient colors={['#FFD700', '#FFA500']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[styles.wordmark, { opacity: 0 }]}>MOOD</Text>
              </LinearGradient>
            </MaskedView>
          </View>

          {/* Headline + blurb — anchored to the bottom third of the hero */}
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroHeadline}>{firstName}, your plan is ready!</Text>
            <Text style={styles.heroSubhead}>{blurb}</Text>
          </View>
        </ImageBackground>

        {/* === CONTENT SHEET (normal flow, page bg) === */}
        <View style={styles.sheet}>
          {/* 5 + dots — SHARED */}
          <FeatureCarousel />

          {/* 7 SWAP SLOT — fixed dedicated height; the ONLY content difference */}
          <View style={styles.swapSlot}>
            {isFoundingEligible ? (
              <View style={styles.foundingBanner}>
                <Ionicons name="flash" size={16} color={COLORS.accent} />
                <Text style={styles.foundingBannerText}>
                  Founding pricing — <Text style={styles.bold}>$39/yr locked forever</Text>. Standard pricing
                  will be {annualLabel}. Available for {daysLeft} more day{daysLeft === 1 ? '' : 's'}.
                </Text>
              </View>
            ) : (
              <View style={styles.socialStat}>
                <View style={styles.avatars}>
                  {SOCIAL_AVATARS.map((uri, i) => (
                    <Image key={uri} source={{ uri }} style={[styles.avatar, i > 0 && styles.avatarOverlap]} />
                  ))}
                </View>
                <Text style={styles.socialStatText}>
                  Join <Text style={styles.bold}>92%</Text> of users who completed a workout in their first
                  week
                </Text>
              </View>
            )}
          </View>

          {/* 8 PRIMARY BUTTON — label is the only difference */}
          <TouchableOpacity
            style={styles.cta}
            onPress={onPrimary}
            disabled={!!busy}
            testID={primaryTestID}
            data-testid={primaryTestID}
          >
            <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
              {primaryBusy ? (
                <ActivityIndicator color={COLORS.accentInk} />
              ) : (
                <Text style={styles.ctaLabel}>{primaryLabel}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* 9 — or — divider — SHARED */}
          <View style={styles.orDivider}>
            <Text style={styles.orText}>or</Text>
          </View>

          {/* 10 Start free trial — SHARED */}
          <TouchableOpacity
            style={styles.trialBtn}
            onPress={() => handleOpenPaywall('start_free_trial')}
            disabled={!!busy}
            activeOpacity={0.8}
            testID="reveal-start-cta"
            data-testid="reveal-start-cta"
          >
            <Text style={styles.trialBtnLabel}>Start my 7-day free trial</Text>
          </TouchableOpacity>

          {/* 11 Disclosure, trust, save-for-later, footer links — SHARED */}
          <StandardBottom
            onSkip={handleSkip}
            onRestore={handleRestore}
            annualLabel={annualLabel}
            monthlyLabel={monthlyLabel}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function StandardBottom({
  onSkip,
  onRestore,
  annualLabel,
  monthlyLabel,
}: {
  onSkip: () => void;
  onRestore: () => void;
  annualLabel: string;
  monthlyLabel: string;
}) {
  const router = useRouter();
  return (
    <>
      <Disclosure trial annualLabel={annualLabel} monthlyLabel={monthlyLabel} />

      <View style={styles.trustRow}>
        <Ionicons name="lock-closed" size={12} color={COLORS.textTertiary} />
        <Text style={styles.trustText}>Billed securely by Apple · Cancel in 2 taps</Text>
      </View>

      <View style={styles.safetyNet}>
        <Text style={styles.safetyPrompt}>Not ready to subscribe?</Text>
        <TouchableOpacity
          style={styles.tertiaryCta}
          onPress={onSkip}
          activeOpacity={0.7}
          testID="reveal-try-free-cta"
          data-testid="reveal-try-free-cta"
        >
          <Text style={styles.tertiaryCtaLabel}>Try my first workout — free</Text>
        </TouchableOpacity>
      </View>

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

function Disclosure({
  trial,
  annualLabel = '$79/year',
  monthlyLabel = '$9.99/month',
}: {
  trial: boolean;
  annualLabel?: string;
  monthlyLabel?: string;
}) {
  const router = useRouter();
  return (
    <Text style={styles.disclosure}>
      {trial
        ? `7 days free, then ${annualLabel} or ${monthlyLabel} — your choice on the next screen. Auto-renews unless cancelled at least 24 hours before the trial ends. `
        : '$39.00/year, auto-renews unless cancelled at least 24 hours before renewal. '}
      <Text style={styles.link} onPress={() => Linking.openURL(MANAGE_SUBS_URL)}>Manage subscription</Text>
      <Text> · </Text>
      <Text style={styles.link} onPress={() => router.push('/terms-of-service')}>Terms</Text>
      <Text> · </Text>
      <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>Privacy</Text>
    </Text>
  );
}

function FeatureCarousel() {
  const { width } = useWindowDimensions();
  const cardWidth = width;
  const listRef = useRef<FlatList>(null);
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const next = (indexRef.current + 1) % FEATURES.length;
      indexRef.current = next;
      setActive(next);
      listRef.current?.scrollToOffset({ offset: next * cardWidth, animated: true });
    }, 3500);
    return () => clearInterval(id);
  }, [cardWidth]);

  return (
    <View style={styles.carouselWrap}>
      <FlatList
        ref={listRef}
        data={FEATURES}
        keyExtractor={(f) => f.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, i) => ({ length: cardWidth, offset: cardWidth * i, index: i })}
        onScrollBeginDrag={() => {
          pausedRef.current = true;
        }}
        onMomentumScrollEnd={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
          indexRef.current = i;
          setActive(i);
          pausedRef.current = false;
        }}
        scrollEnabled={true}
        renderItem={({ item }) => <CarouselCard feature={item} width={cardWidth} />}
      />
      <View style={styles.dots}>
        {FEATURES.map((f, i) => (
          <View key={f.title} style={[styles.dot, i === active && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

function CarouselCard({
  feature,
  width,
}: {
  feature: (typeof FEATURES)[number];
  width: number;
}) {
  return (
    <View style={{ width }}>
      <View style={styles.cCard}>
        {/* HUD corner brackets + INCLUDED tag — signals this is part of the membership */}
        <View style={[styles.cCorner, styles.cCornerTL]} />
        <View style={[styles.cCorner, styles.cCornerTR]} />
        <View style={[styles.cCorner, styles.cCornerBL]} />
        <View style={[styles.cCorner, styles.cCornerBR]} />
        <View style={styles.cIncWrap}>
          <View style={styles.cIncPill}>
            <Text style={styles.cIncText}>INCLUDED</Text>
          </View>
        </View>
        <Ionicons name={feature.icon} size={210} color={COLORS.accent} style={styles.cGhost} />
        <View style={styles.cIconRing}>
          <Ionicons name={feature.icon} size={24} color={COLORS.accent} />
        </View>
        <View style={styles.cTextWrap}>
          <Text style={styles.cTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {feature.title}
          </Text>
          <Text style={styles.cSubtext} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {feature.subtext}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PAGE_BG },
  scroll: { flexGrow: 1, backgroundColor: PAGE_BG },

  // HERO (fixed height; headline anchored to its bottom)
  hero: { width: '100%', justifyContent: 'flex-end' },
  wordmarkWrap: { position: 'absolute', left: HORIZONTAL_PADDING },
  wordmark: { fontSize: 18, fontWeight: '900', letterSpacing: 3, color: COLORS.textPrimary },
  heroTextWrap: { paddingHorizontal: HORIZONTAL_PADDING, paddingBottom: HERO_TEXT_BOTTOM_PADDING },
  heroHeadline: {
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  heroSubhead: {
    fontSize: 14,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },

  // CONTENT SHEET
  sheet: { backgroundColor: PAGE_BG, paddingHorizontal: HORIZONTAL_PADDING, paddingTop: 4 },

  // CAROUSEL
  carouselWrap: { marginHorizontal: -HORIZONTAL_PADDING, marginBottom: 8, height: CAROUSEL_HEIGHT + 18 },
  cCard: {
    height: CAROUSEL_HEIGHT,
    marginHorizontal: HORIZONTAL_PADDING,
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#09090A',
    borderWidth: 1,
    borderColor: 'rgba(255,193,7,0.38)',
    overflow: 'hidden',
    shadowColor: '#FFC107',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  cGhost: { position: 'absolute', right: -30, top: '50%', marginTop: -105, opacity: 0.08 },
  cIconRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255,193,7,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,193,7,0.08)',
  },
  cTextWrap: { marginTop: 'auto' },
  cTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3, marginBottom: 6, paddingRight: 58 },
  cSubtext: { fontSize: 13, lineHeight: 18, color: COLORS.textSecondary, paddingRight: 58 },
  cCorner: { position: 'absolute', width: 14, height: 14, borderColor: 'rgba(244,195,22,0.6)' },
  cCornerTL: { top: 10, left: 10, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderTopLeftRadius: 4 },
  cCornerTR: { top: 10, right: 10, borderTopWidth: 1.5, borderRightWidth: 1.5, borderTopRightRadius: 4 },
  cCornerBL: { bottom: 10, left: 10, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderBottomLeftRadius: 4 },
  cCornerBR: { bottom: 10, right: 10, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderBottomRightRadius: 4 },
  cIncWrap: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center' },
  cIncPill: { backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 2 },
  cIncText: { fontSize: 9, letterSpacing: 1.2, fontWeight: '700', color: 'rgba(255,255,255,0.92)' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)' },
  dotActive: { width: 18, backgroundColor: COLORS.accent },

  // SWAP SLOT — fixed shared height; both blocks occupy the SAME space (centered)
  swapSlot: { height: SWAP_SLOT_HEIGHT, justifyContent: 'center', marginBottom: 8 },
  socialStat: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatars: { flexDirection: 'row' },
  avatar: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: PAGE_BG },
  avatarOverlap: { marginLeft: -10 },
  socialStatText: { flex: 1, fontSize: 12, lineHeight: 17, color: COLORS.textSecondary },
  foundingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foundingBannerText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },

  // PRIMARY + TRIAL
  cta: { borderRadius: 14, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, minHeight: 54 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
  orDivider: { alignItems: 'center', justifyContent: 'center', paddingTop: 14, paddingBottom: 6 },
  orText: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '600' },
  trialBtn: { paddingVertical: 13, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  trialBtnLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 0.2 },

  // FOOTER
  disclosure: { fontSize: 10, lineHeight: 15, color: COLORS.textTertiary, textAlign: 'center', marginTop: 8 },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, marginBottom: 12 },
  trustText: { fontSize: 11, color: COLORS.textTertiary },
  safetyNet: { paddingTop: 14, alignItems: 'center' },
  safetyPrompt: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6 },
  tertiaryCta: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  tertiaryCtaLabel: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary, textDecorationLine: 'underline', textDecorationColor: 'rgba(255,255,255,0.3)' },
  legalRow: { fontSize: 11, color: COLORS.textTertiary, textAlign: 'center', marginTop: 14 },
  link: { color: COLORS.textSecondary, textDecorationLine: 'underline' },
  bold: { color: COLORS.accent, fontWeight: '700' },
});
