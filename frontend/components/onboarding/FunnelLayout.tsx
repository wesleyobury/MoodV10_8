/**
 * FunnelLayout — shared chrome for every onboarding-funnel screen.
 *
 *   ┌──────────────────────────────────────────┐
 *   │  thin progress bar                       │
 *   │  Step X / 8                              │
 *   │                                          │
 *   │  <title>                                 │
 *   │  <eyebrow optional>                      │
 *   │                                          │
 *   │  <children — the question + options>     │
 *   │                                          │
 *   │  <footer — Continue CTA, when provided>  │
 *   └──────────────────────────────────────────┘
 *
 * Forward-only by design: no back button is rendered. Hardware back is
 * blocked by the parent stack via `gestureEnabled: false`.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS, FUNNEL_TOTAL_STEPS } from '../../constants/brand';
import { profileProgressLabel } from '../../utils/v3ProfileCopy';

interface FunnelLayoutProps {
  step: number;
  /** Defaults to FUNNEL_TOTAL_STEPS. V3 upgrade / edit runs show 5. */
  totalSteps?: number;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onCtaPress?: () => void;
  testID?: string;
  /**
   * V3 profile funnel: 0–100. Replaces "Step X / N" with "YOUR PROFILE IS TAKING SHAPE · 60%", and the bar follows
   * the profile (it moves on every tap, not only on Continue).
   */
  profilePct?: number;
  /** Rendered in a fixed slot right above the CTA (V3: the answer's consequence), so it is never below the fold. */
  aboveCta?: React.ReactNode;
}

export function FunnelLayout({
  step,
  totalSteps = FUNNEL_TOTAL_STEPS,
  eyebrow,
  title,
  subtitle,
  children,
  ctaLabel,
  ctaDisabled,
  ctaLoading,
  onCtaPress,
  testID,
  profilePct,
  aboveCta,
}: FunnelLayoutProps) {
  const isProfile = typeof profilePct === 'number';
  const progress = isProfile
    ? Math.max(0, Math.min(1, profilePct! / 100))
    : Math.max(0, Math.min(1, step / totalSteps));
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 420,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const widthInterp = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView
      style={styles.root}
      edges={['top', 'bottom']}
      testID={testID}
      data-testid={testID}
    >
      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: widthInterp }]}>
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        {isProfile ? (
          <Text style={styles.stepLabel} testID={`${testID || 'funnel'}-profile-progress`}>
            {profileProgressLabel(profilePct!)}
            {profilePct! > 0 ? <Text style={styles.stepPct}>{`  ·  ${profilePct}%`}</Text> : null}
          </Text>
        ) : (
          <Text style={styles.stepLabel}>
            Step {step} / {totalSteps}
          </Text>
        )}
      </View>

      <View style={styles.body}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

        <ScrollView
          style={styles.children}
          contentContainerStyle={styles.childrenContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>

      {aboveCta ? <View style={styles.aboveCta}>{aboveCta}</View> : null}

      {ctaLabel ? (
        <View style={styles.footer}>
          <TouchableOpacity
            disabled={ctaDisabled || ctaLoading}
            onPress={onCtaPress}
            style={[styles.cta, (ctaDisabled || ctaLoading) && styles.ctaDisabled]}
            data-testid={`${testID || 'funnel'}-continue`}
            testID={`${testID || 'funnel'}-continue`}
          >
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {ctaLoading ? (
                <ActivityIndicator color={COLORS.accentInk} />
              ) : (
                <Text style={styles.ctaLabel}>{ctaLabel}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  progressRow: {
    paddingTop: 4,
    paddingBottom: 24,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  stepLabel: {
    marginTop: 12,
    fontSize: 11,
    letterSpacing: 1.4,
    color: COLORS.textTertiary,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  stepPct: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  aboveCta: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 14,
  },
  body: {
    flex: 1,
    paddingTop: 8,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.8,
    color: COLORS.accent,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  children: {
    flex: 1,
    marginTop: 20,
  },
  childrenContent: {
    paddingBottom: 12,
  },
  footer: {
    paddingBottom: 8,
  },
  cta: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaDisabled: {
    opacity: 0.4,
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
});
