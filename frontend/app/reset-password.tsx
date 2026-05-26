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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../utils/api';

/**
 * Reset Password screen — opened via deep link:
 *   moodapp://reset-password?token=XYZ
 *
 * expo-router maps the path segment to this file automatically; the `token`
 * query param is read via useLocalSearchParams.
 */
export default function ResetPassword() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = (params.token || '').toString();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const tokenMissing = !token;

  const handleSubmit = async () => {
    if (tokenMissing) return;
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Passwords do not match', 'Please re-enter both fields.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiFetch<{ success: boolean }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: password }),
      });
      if (result.ok) {
        setDone(true);
      } else {
        const msg = result.error || 'Reset failed. Please request a new link.';
        Alert.alert('Reset failed', msg);
      }
    } catch (e: any) {
      Alert.alert('Reset failed', e?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid / missing token state
  if (tokenMissing) {
    return (
      <View style={styles.container} testID="reset-password-screen">
        <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.successWrap}>
            <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
            <Text style={styles.successTitle}>Invalid reset link</Text>
            <Text style={styles.successBody}>
              This link is missing or malformed. Please request a fresh password reset.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/auth/forgot-password')}
              testID="reset-password-request-new-btn"
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Request a new link</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (done) {
    return (
      <View style={styles.container} testID="reset-password-screen">
        <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.successWrap} testID="reset-password-success-state">
            <Ionicons name="checkmark-circle" size={64} color="#FFD700" />
            <Text style={styles.successTitle}>Password updated</Text>
            <Text style={styles.successBody}>
              Your password has been changed. Please log in with your new password.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/auth/login')}
              testID="reset-password-go-to-login-btn"
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.primaryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.primaryButtonText}>Go to login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="reset-password-screen">
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Set a new password</Text>
            <Text style={styles.subtitle}>
              Choose a password you don't use anywhere else. Minimum 8 characters.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="New password"
              placeholderTextColor="#666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              testID="reset-password-new-input"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#666"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              testID="reset-password-confirm-input"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
            testID="reset-password-submit-btn"
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Updating…' : 'Update password'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  keyboardView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#888', lineHeight: 22 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0c0c0c',
    borderWidth: 1, borderColor: '#1d1d1d',
    borderRadius: 12, paddingHorizontal: 16,
    height: 56, marginBottom: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },
  passwordInput: { paddingRight: 36 },
  eyeIcon: { padding: 4 },
  primaryButton: { borderRadius: 999, overflow: 'hidden', marginTop: 8 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: { color: '#0c0c0c', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  successWrap: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 12 },
  successBody: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 12 },
});
