/**
 * Step 2 — BUILD FOR ME teach moment.
 *
 * Simplified preview of the home-page Build For Me flow. Three option chips
 * sized to the user's selected mood (preset, no nav). Selecting one slides up
 * a preview card describing what MOOD will build, then Continue persists the
 * choice and routes to step 3.
 *
 * Note: The full Build For Me flow lives in the mood-specific routes
 * (`workout-type`, `body-parts`, `*-equipment`, etc.). This screen is
 * intentionally an on-rails teach moment, not the full routing tree.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { COLORS } from '../../constants/brand';
import {
  MOOD_DISPLAY,
  MoodId,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

interface MoodOption {
  optionId: string;
  label: string;
  preview: { exercises: number; duration: string; focus: string };
}

const OPTIONS_BY_MOOD: Record<MoodId, MoodOption[]> = {
  sweat: [
    { optionId: 'sweat::quick', label: 'Quick burn · 20m', preview: { exercises: 6, duration: '20 min', focus: 'Cardio + HIIT' } },
    { optionId: 'sweat::standard', label: 'Standard · 30m', preview: { exercises: 8, duration: '30 min', focus: 'Full-body burn' } },
    { optionId: 'sweat::endurance', label: 'Endurance · 45m', preview: { exercises: 10, duration: '45 min', focus: 'Capacity + sweat' } },
  ],
  muscle: [
    { optionId: 'muscle::quick', label: 'Quick lift · 20m', preview: { exercises: 5, duration: '20 min', focus: 'Compound lifts' } },
    { optionId: 'muscle::hypertrophy', label: 'Hypertrophy · 30m', preview: { exercises: 7, duration: '30 min', focus: 'Volume + pump' } },
    { optionId: 'muscle::power', label: 'Power · 45m', preview: { exercises: 9, duration: '45 min', focus: 'Strength + size' } },
  ],
  explosive: [
    { optionId: 'explosive::plyo', label: 'Plyo · 15m', preview: { exercises: 5, duration: '15 min', focus: 'Plyometric power' } },
    { optionId: 'explosive::circuit', label: 'Power circuit · 25m', preview: { exercises: 7, duration: '25 min', focus: 'Explosive circuits' } },
    { optionId: 'explosive::athletic', label: 'Athletic · 35m', preview: { exercises: 9, duration: '35 min', focus: 'Speed + power' } },
  ],
  lazy: [
    { optionId: 'lazy::gentle', label: 'Gentle · 10m', preview: { exercises: 4, duration: '10 min', focus: 'Light movement' } },
    { optionId: 'lazy::stretch', label: 'Stretch · 15m', preview: { exercises: 6, duration: '15 min', focus: 'Mobility + flow' } },
    { optionId: 'lazy::recovery', label: 'Recovery · 20m', preview: { exercises: 6, duration: '20 min', focus: 'Active recovery' } },
  ],
  calisthenics: [
    { optionId: 'cali::skill', label: 'Skill · 20m', preview: { exercises: 5, duration: '20 min', focus: 'Form + control' } },
    { optionId: 'cali::volume', label: 'Volume · 30m', preview: { exercises: 8, duration: '30 min', focus: 'Bodyweight volume' } },
    { optionId: 'cali::full', label: 'Full body · 45m', preview: { exercises: 10, duration: '45 min', focus: 'Total bodyweight' } },
  ],
  outdoor: [
    { optionId: 'outdoor::run', label: 'Run · 20m', preview: { exercises: 4, duration: '20 min', focus: 'Run-based' } },
    { optionId: 'outdoor::trail', label: 'Trail · 30m', preview: { exercises: 6, duration: '30 min', focus: 'Mixed terrain' } },
    { optionId: 'outdoor::park', label: 'Park session · 45m', preview: { exercises: 8, duration: '45 min', focus: 'Park + bodyweight' } },
  ],
};

export default function Step2BuildForMe() {
  const router = useRouter();
  const { answers, setBuildForMe, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const moodId: MoodId = answers.mood ?? 'sweat';
  const moodMeta = MOOD_DISPLAY[moodId];
  const options = useMemo(() => OPTIONS_BY_MOOD[moodId] ?? OPTIONS_BY_MOOD.sweat, [moodId]);

  const [selectedId, setSelectedId] = useState<string | undefined>(answers.buildForMe?.optionId);
  const previewAnim = useState(() => new Animated.Value(selectedId ? 1 : 0))[0];

  useEffect(() => {
    markStepEntered(2);
    Analytics.onboardingStepViewed(token, { step: 2, question: 'build_for_me' });
  }, [markStepEntered, token]);

  useEffect(() => {
    Animated.timing(previewAnim, {
      toValue: selectedId ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [selectedId, previewAnim]);

  const selected = options.find((o) => o.optionId === selectedId);

  const handleContinue = () => {
    if (!selected) return;
    setBuildForMe({ label: selected.label, optionId: selected.optionId });
    Analytics.onboardingStepCompleted(token, {
      step: 2,
      question: 'build_for_me',
      answer: selected.optionId,
      time_spent_ms: consumeStepDuration(2),
    });
    router.push('/onboarding-funnel/step-3-goal');
  };

  return (
    <FunnelLayout
      step={2}
      eyebrow="BUILD FOR ME"
      title={`Here's how MOOD builds your ${moodMeta.title.toLowerCase()} workout.`}
      subtitle="Pick a starting point. You can change it later."
      ctaLabel="Continue"
      ctaDisabled={!selected}
      onCtaPress={handleContinue}
      testID="funnel-step-2"
    >
      <View style={styles.chips}>
        {options.map((opt) => {
          const isOn = selectedId === opt.optionId;
          return (
            <Pressable
              key={opt.optionId}
              onPress={() => setSelectedId(opt.optionId)}
              style={[styles.chip, isOn && styles.chipSelected]}
              testID={`build-option-${opt.optionId}`}
              data-testid={`build-option-${opt.optionId}`}
            >
              <Text style={[styles.chipLabel, isOn && styles.chipLabelSelected]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Animated.View
        style={[
          styles.preview,
          {
            opacity: previewAnim,
            transform: [
              {
                translateY: previewAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
              },
            ],
          },
        ]}
        pointerEvents={selected ? 'auto' : 'none'}
      >
        {selected ? (
          <>
            <Text style={styles.previewEyebrow}>PREVIEW</Text>
            <Text style={styles.previewTitle}>{selected.label}</Text>
            <View style={styles.previewStats}>
              <PreviewStat label="Exercises" value={String(selected.preview.exercises)} />
              <PreviewStat label="Duration" value={selected.preview.duration} />
              <PreviewStat label="Focus" value={selected.preview.focus} />
            </View>
          </>
        ) : null}
      </Animated.View>
    </FunnelLayout>
  );
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewStat}>
      <Text style={styles.previewStatValue}>{value}</Text>
      <Text style={styles.previewStatLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chips: {
    marginBottom: 18,
  },
  chip: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  chipSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  chipLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chipLabelSelected: {
    color: COLORS.accent,
  },
  preview: {
    marginTop: 4,
    padding: 18,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
  },
  previewEyebrow: {
    fontSize: 11,
    color: COLORS.accent,
    letterSpacing: 1.4,
    fontWeight: '600',
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewStat: {
    flex: 1,
  },
  previewStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  previewStatLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
