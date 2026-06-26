/**
 * Mood Intro — MOOD V2 interstitial (Phase 5.1).
 *
 * Shown after wearables connect, before the first decision screen of the
 * funnel-picked mood. Sets context for the user who just finished the funnel.
 * Returning users entering a mood card from home do NOT see this (they route
 * straight to the decision screen via (tabs)/index).
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../constants/brand';
import { readFunnelMoodId, routeForMood } from '../utils/moodRoute';
import { moodIntroCopy } from '../utils/moodConfig';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import { clearWorkoutHandoffPending } from '../utils/onboardingFunnelDefer';

export default function MoodIntro() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [moodId, setMoodId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    readFunnelMoodId(user?.id)
      .then(setMoodId)
      .catch(() => setMoodId(null));
  }, [user?.id]);

  useEffect(() => {
    if (moodId !== undefined) {
      Analytics.revealScreenViewed(token, { stage: 'mood_intro', mood: moodId ?? 'unknown' });
      // Dedicated interstitial drop-off measurement.
      Analytics.moodIntroViewed(token, { mood: moodId ?? 'unknown' });
    }
  }, [moodId, token]);

  const handleContinue = async () => {
    Analytics.moodIntroCtaTapped(token, { mood: moodId ?? 'unknown' });
    if (user?.id) await clearWorkoutHandoffPending(user.id);
    const route = routeForMood(moodId);
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
      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Ionicons name="flame" size={28} color={COLORS.accent} />
        </View>
        <Text style={styles.headline}>{copy.headline}</Text>
        <Text style={styles.body}>{copy.body}</Text>
      </View>

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
  loading: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'center' },
  iconRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  headline: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6, lineHeight: 38, marginBottom: 16 },
  body: { fontSize: 17, lineHeight: 26, color: COLORS.textSecondary },
  footer: { paddingBottom: 12 },
  cta: { borderRadius: 14, overflow: 'hidden' },
  ctaGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  ctaLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
});
