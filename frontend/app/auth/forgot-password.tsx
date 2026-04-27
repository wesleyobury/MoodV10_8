import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../utils/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: trimmed }),
      });
      // Server intentionally returns success even if email is unknown.
      // Show the same confirmation either way (no account-existence leak).
      setSubmitted(true);
    } catch (e) {
      // Network errors only — never leak account existence.
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container} testID="forgot-password-screen">
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          {/* Back */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            testID="forgot-password-back-btn"
          >
            <Ionicons name="chevron-back" size={26} color="#FFD700" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter your account email and we'll send you a link to reset it.
            </Text>
          </View>

          {!submitted ? (
            <>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  testID="forgot-password-email-input"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                testID="forgot-password-submit-btn"
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.submitButtonText}>
                    {isLoading ? 'Sending…' : 'Send reset link'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successWrap} testID="forgot-password-success-state">
              <View style={styles.successIconWrap}>
                <Ionicons name="checkmark-circle" size={64} color="#FFD700" />
              </View>
              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successBody}>
                If an account exists for <Text style={styles.successEmail}>{email.trim()}</Text>,
                a reset link has been sent. The link expires in 1 hour.
              </Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.replace('/auth/login')}
                testID="forgot-password-back-to-login-btn"
              >
                <Text style={styles.secondaryButtonText}>Back to login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  backButton: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  header: { marginBottom: 36 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#888', lineHeight: 22 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0c0c0c',
    borderWidth: 1, borderColor: '#1d1d1d',
    borderRadius: 12, paddingHorizontal: 16,
    height: 56, marginBottom: 20,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
  submitButton: { borderRadius: 999, overflow: 'hidden' },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { color: '#0c0c0c', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  // Success state
  successWrap: { alignItems: 'center', paddingTop: 8 },
  successIconWrap: { marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 12 },
  successBody: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 12 },
  successEmail: { color: '#FFD700' },
  secondaryButton: {
    paddingVertical: 14, paddingHorizontal: 28,
    borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.4)',
    borderRadius: 999,
  },
  secondaryButtonText: { color: '#FFD700', fontSize: 15, fontWeight: '600' },
});
