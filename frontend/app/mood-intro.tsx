/**
 * Mood Intro — MOOD V2 interstitial (Phase 5.1).
 *
 * Shown after wearables connect, before the first decision screen of the
 * funnel-picked mood. Sets context for the user who just finished the funnel.
 * Returning users entering a mood card from home do NOT see this (they route
 * straight to the decision screen via (tabs)/index).
 */
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import BackButton from '../components/BackButton';
import { BRAND_GRADIENT, COLORS } from '../constants/brand';
import { markMoodIntroSeen, readFunnelMoodId, routeForMood } from '../utils/moodRoute';
import { moodIntroCopy } from '../utils/moodConfig';
import { useOnboardingFunnel } from '../contexts/OnboardingFunnelContext';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import { clearWorkoutHandoffPending } from '../utils/onboardingFunnelDefer';

// Full mood-card titles (mirrors the cards on the Workouts tab) so the intro
// names the mood the user tapped.
const MOOD_CARD_TITLE: Record<string, string> = {
  sweat: 'Sweat / burn fat',
  muscle: 'Muscle gainer',
  explosive: 'Build explosion',
  lazy: "I'm feeling lazy",
  calisthenics: 'I want to do calisthenics',
  outdoor: 'I want to get outside',
};

export default function MoodIntro() {
  const router = useRouter();
  const { token, user } = useAuth();
  // Returning users open the intro for a specific mood card from home — that
  // mood id (and its display title) arrive as params. First-run onboarding has
  // no params, so we fall back to the funnel-picked mood.
  const params = useLocalSearchParams<{ moodId?: string; mood?: string }>();
  const moodTitleParam = typeof params.mood === 'string' ? params.mood : undefined;
  // In-memory funnel answers — survive the whole onboarding session and don't
  // depend on AsyncStorage hydration timing, so they're the most reliable
  // fallback when no explicit moodId param was passed.
  const { answers: funnelAnswers } = useOnboardingFunnel();
  const funnelMoodInMemory = funnelAnswers.mood ?? null;
  const [moodId, setMoodId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (params.moodId) {
      setMoodId(params.moodId);
      return;
    }
    if (funnelMoodInMemory) {
      setMoodId(funnelMoodInMemory);
      return;
    }
    readFunnelMoodId(user?.id)
      .then((persisted) => setMoodId(persisted ?? funnelMoodInMemory))
      .catch(() => setMoodId(funnelMoodInMemory));
  }, [params.moodId, funnelMoodInMemory, user?.id]);

  useEffect(() => {
    if (moodId !== undefined) {
      Analytics.revealScreenViewed(token, { stage: 'mood_intro', mood: moodId ?? 'unknown' });
      // Dedicated interstitial drop-off measurement.
      Analytics.moodIntroViewed(token, { mood: moodId ?? 'unknown' });
      // Mark this mood's intro as seen so it won't show again for this mood.
      if (moodId) markMoodIntroSeen(moodId);
    }
  }, [moodId, token]);

  const handleContinue = async () => {
    Analytics.moodIntroCtaTapped(token, { mood: moodId ?? 'unknown' });
    if (user?.id) await clearWorkoutHandoffPending(user.id);
    // Resolve the mood again at press time — covers the race where the
    // persisted read hadn't finished (or failed) when the screen mounted.
    let resolvedMoodId = moodId ?? funnelMoodInMemory;
    if (!resolvedMoodId) {
      try {
        resolvedMoodId = await readFunnelMoodId(user?.id);
      } catch {
        resolvedMoodId = null;
      }
    }
    const route = routeForMood(resolvedMoodId, moodTitleParam);
    if (route) {
      router.replace({ pathname: route.pathname as any, params: route.params });
    } else {
      router.replace('/(tabs)');
    }
  };

  if (moodId === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  const copy = moodIntroCopy(moodId);
  const moodTitle = MOOD_CARD_TITLE[String(moodId)] ?? '';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="mood-intro">
      <View pointerEvents="none" style={styles.starfield}>
        <View style={[styles.star, { top: '16%', left: '14%' }]} />
        <View style={[styles.star, { top: '27%', right: '18%' }]} />
        <View style={[styles.star, { top: '49%', left: '20%' }]} />
        <View style={[styles.star, { top: '61%', right: '22%' }]} />
        <View style={[styles.star, { top: '41%', left: '80%' }]} />
        <View style={[styles.star, { top: '72%', left: '34%' }]} />
      </View>
      <View style={styles.topBar}>
        <BackButton />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconRing}>
          <Ionicons name="flame" size={28} color={COLORS.accent} />
        </View>
        {moodTitle ? <Text style={styles.moodEyebrow}>{moodTitle}</Text> : null}
        <Text style={styles.headline}>{copy.headline}</Text>
        <Text style={styles.body}>{copy.body}</Text>

        {/* Hero — auto-generate is the core value prop, featured up top. */}
        <View style={styles.heroWrap}>
          <View style={styles.heroGlowOuter} pointerEvents="none" />
          <View style={styles.heroGlowInner} pointerEvents="none" />
          <LinearGradient
            colors={['#1D1710', '#100D0A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroRow}>
              <LinearGradient
                colors={BRAND_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.flash}
              >
                <Ionicons name="flash" size={22} color="#3A2600" />
              </LinearGradient>
              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Build for me</Text>
                <Text style={styles.heroSub}>
                  A complete, personalized workout — generated in seconds. Zero setup.
                </Text>
              </View>
            </View>
          </LinearGradient>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>FASTEST WAY</Text>
          </View>
        </View>

        {/* Secondary — manual build path. */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR BUILD YOUR OWN</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.steps}>
          {copy.steps.map((step, i) => (
            <View
              key={i}
              style={[styles.stepRow, i === copy.steps.length - 1 && styles.stepRowLast]}
            >
              <View style={styles.stepDot}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleContinue} testID="mood-intro-cta">
          <LinearGradient
            colors={BRAND_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaLabel}>{copy.cta}</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.accentInk} style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 28 },
  topBar: { height: 44, justifyContent: 'center', marginLeft: -8 },
  loading: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: 24 },
  iconRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  moodEyebrow: { fontSize: 12, letterSpacing: 1.6, color: COLORS.accent, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  headline: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6, lineHeight: 38, marginBottom: 16 },
  body: { fontSize: 17, lineHeight: 26, color: COLORS.textSecondary },
  starfield: { ...StyleSheet.absoluteFillObject },
  star: { position: 'absolute', width: 2, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.28)' },

  heroWrap: { marginTop: 30, position: 'relative' },
  heroGlowOuter: {
    position: 'absolute', top: -100, left: '50%', marginLeft: -150,
    width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,160,50,0.05)',
  },
  heroGlowInner: {
    position: 'absolute', top: -50, left: '50%', marginLeft: -100,
    width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,180,60,0.09)',
  },
  hero: {
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,200,80,0.5)',
    shadowColor: '#FFB13C', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 8,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  flash: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFE8A6', letterSpacing: 0.2 },
  heroSub: { fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.75)', marginTop: 3 },
  heroBadge: {
    position: 'absolute', top: -9, left: 16,
    backgroundColor: COLORS.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  heroBadgeText: { fontSize: 9, fontWeight: '800', color: COLORS.accentInk, letterSpacing: 0.6 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },
  dividerText: { fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.40)', marginHorizontal: 10 },

  steps: { marginTop: 0 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepRowLast: { marginBottom: 0 },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  stepNum: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  stepText: { fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.82)', flex: 1 },
  footer: { paddingBottom: 12 },
  cta: { borderRadius: 14, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
});
