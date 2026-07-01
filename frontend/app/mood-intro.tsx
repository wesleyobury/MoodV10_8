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
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import { clearWorkoutHandoffPending } from '../utils/onboardingFunnelDefer';

export default function MoodIntro() {
  const router = useRouter();
  const { token, user } = useAuth();
  // Returning users open the intro for a specific mood card from home — that
  // mood id (and its display title) arrive as params. First-run onboarding has
  // no params, so we fall back to the funnel-picked mood.
  const params = useLocalSearchParams<{ moodId?: string; mood?: string }>();
  const moodTitleParam = typeof params.mood === 'string' ? params.mood : undefined;
  const [moodId, setMoodId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (params.moodId) {
      setMoodId(params.moodId);
      return;
    }
    readFunnelMoodId(user?.id)
      .then(setMoodId)
      .catch(() => setMoodId(null));
  }, [params.moodId, user?.id]);

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
    const route = routeForMood(moodId, moodTitleParam);
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

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="mood-intro">
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
  headline: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6, lineHeight: 38, marginBottom: 16 },
  body: { fontSize: 17, lineHeight: 26, color: COLORS.textSecondary },
  steps: {
    marginTop: 28,
    backgroundColor: '#141414',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 18,
  },
  stepsLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textTertiary, letterSpacing: 1.4, marginBottom: 14 },
  buildForMe: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: 'rgba(255,215,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.40)',
    borderRadius: 14,
    padding: 14,
  },
  bfmIcon: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,215,0,0.14)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  bfmText: { flex: 1, fontSize: 13, lineHeight: 19, color: COLORS.textSecondary },
  bfmHighlight: { color: COLORS.accent, fontWeight: '700' },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepRowLast: { marginBottom: 0 },
  stepBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stepNum: { fontSize: 14, fontWeight: '700', color: COLORS.accentInk },
  stepText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  footer: { paddingBottom: 12 },
  cta: { borderRadius: 14, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
});
