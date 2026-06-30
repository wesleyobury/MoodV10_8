/**
 * Funnel — first-name capture.
 *
 * Sits between Step 6 (social proof) and the reveal-loading screen, inside the
 * un-numbered "reveal" sequence so it doesn't disturb the Step X / 6 counter.
 *
 * Why this exists: Apple Sign-In only returns a name on the first
 * authorization (and only if the user doesn't hide it), and never again — so
 * the payoff greeting would otherwise fall back to a raw handle like
 * `apple_user_3f9c…`. Capturing the first name here guarantees a real name to
 * personalize the payoff regardless of the auth provider. The value is stored
 * in the funnel context (instant, used by reveal-payoff) and persisted to the
 * user record via PUT /api/users/me (durable across sessions).
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';
import { apiFetch } from '../../utils/api';

export default function FunnelNameScreen() {
  const router = useRouter();
  const { answers, setFirstName } = useOnboardingFunnel();
  const { token, updateUser } = useAuth();
  const [value, setValue] = useState(answers.firstName ?? '');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    Analytics.onboardingStepViewed(token, { step: 7, question: 'first_name' });
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [token]);

  const goNext = () => router.replace('/onboarding-funnel/reveal-loading');

  const handleContinue = async () => {
    const name = value.trim();
    if (!name) {
      goNext();
      return;
    }
    setBusy(true);
    // Save locally first so the payoff has the name immediately, even if the
    // network write is slow or fails.
    setFirstName(name);
    updateUser({ name });
    Analytics.onboardingStepCompleted(token, { step: 7, question: 'first_name' });
    try {
      if (token) {
        await apiFetch('/api/users/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        });
      }
    } catch {
      // Non-blocking — name is already in the funnel context + local user.
    } finally {
      setBusy(false);
      goNext();
    }
  };

  const handleSkip = () => {
    Analytics.onboardingStepCompleted(token, { step: 7, question: 'first_name_skipped' });
    goNext();
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="funnel-name">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <Text style={styles.eyebrow}>LAST THING</Text>
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.subtitle}>
            We&apos;ll use your first name to personalize your plan.
          </Text>

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder="First name"
            placeholderTextColor={COLORS.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={40}
            onSubmitEditing={handleContinue}
            testID="funnel-name-input"
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            disabled={busy}
            onPress={handleContinue}
            style={[styles.cta, busy && styles.ctaDisabled]}
            testID="funnel-name-continue"
          >
            <LinearGradient
              colors={[...BRAND_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {busy ? (
                <ActivityIndicator color={COLORS.accentInk} />
              ) : (
                <Text style={styles.ctaLabel}>Build my plan</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={styles.skip} disabled={busy}>
            <Text style={styles.skipLabel}>Skip</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 24,
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingTop: 24,
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
    marginBottom: 28,
  },
  input: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 18,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  footer: {
    paddingBottom: 8,
  },
  cta: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaDisabled: {
    opacity: 0.6,
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
  skip: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  skipLabel: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
});
