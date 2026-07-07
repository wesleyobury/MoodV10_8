/**
 * CreatorCodeModal — creator enters their comp code to unlock lifetime access.
 *
 * Provider-agnostic by design: redemption runs AFTER the user is signed in and
 * is keyed to their account (not their email), so it works for email, Google,
 * and Apple "Hide My Email" sign-ins alike. On success the AuthContext refreshes
 * entitlement, so any paywall clears immediately.
 *
 * Used in two places: the onboarding paywall (reveal-payoff) and Settings.
 */
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../constants/brand';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Called after a successful redemption (creator name if known). */
  onRedeemed?: (creatorName?: string) => void;
}

function messageForReason(reason?: string): string {
  switch (reason) {
    case 'exhausted':
      return 'This code has already been used.';
    case 'not_authenticated':
      return 'Please finish signing in, then try again.';
    case 'error':
      return 'Something went wrong. Check your connection and try again.';
    case 'invalid':
    default:
      return "That code isn't valid or is no longer active.";
  }
}

export default function CreatorCodeModal({ visible, onClose, onRedeemed }: Props) {
  const { redeemCreatorCode } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setCode('');
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = code.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setError(null);
    const res = await redeemCreatorCode(trimmed);
    setSubmitting(false);
    if (res.ok) {
      const name = res.creator_name;
      reset();
      onRedeemed?.(name);
    } else {
      setError(messageForReason(res.reason));
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.center}
            >
              <View style={styles.card}>
                <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={10}>
                  <Ionicons name="close" size={22} color={COLORS.textTertiary} />
                </TouchableOpacity>

                <View style={styles.iconWrap}>
                  <Ionicons name="ticket-outline" size={26} color={COLORS.accent} />
                </View>

                <Text style={styles.title}>Have a creator code?</Text>
                <Text style={styles.subtitle}>
                  Enter it below to unlock full access — no subscription needed.
                </Text>

                <TextInput
                  value={code}
                  onChangeText={(t) => {
                    setCode(t);
                    if (error) setError(null);
                  }}
                  placeholder="MOOD-XXXXX"
                  placeholderTextColor={COLORS.textTertiary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                  editable={!submitting}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
                  style={[styles.input, !!error && styles.inputError]}
                  testID="creator-code-input"
                />

                {!!error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={!code.trim() || submitting}
                  activeOpacity={0.85}
                  style={[styles.cta, (!code.trim() || submitting) && styles.ctaDisabled]}
                  testID="creator-code-submit"
                >
                  <LinearGradient
                    colors={[...BRAND_GRADIENT]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator color={COLORS.accentInk} />
                    ) : (
                      <Text style={styles.ctaLabel}>Unlock access</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  center: { width: '100%' },
  card: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 20,
    padding: 24,
    paddingTop: 28,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  closeBtn: { position: 'absolute', top: 12, right: 12, padding: 6, zIndex: 2 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,215,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    letterSpacing: 1,
  },
  inputError: { borderColor: '#FF5A5A' },
  errorText: { color: '#FF7A7A', fontSize: 13, marginTop: 8 },
  cta: { marginTop: 18, borderRadius: 14, overflow: 'hidden' },
  ctaDisabled: { opacity: 0.5 },
  ctaGradient: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  ctaLabel: { color: COLORS.accentInk, fontSize: 16, fontWeight: '700' },
});
