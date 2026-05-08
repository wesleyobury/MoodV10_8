import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import UserAvatar from '../../components/UserAvatar';
import { API_URL } from '../../utils/apiConfig';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB
const GOLD = '#F5C518';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [pickingImage, setPickingImage] = useState(false);

  const { register } = useAuth();

  const validateEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const pickAvatar = async () => {
    try {
      setPickingImage(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please grant photo library access to add a profile picture.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: false,
      });

      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      if (!/^image\/(jpe?g|png)$/i.test(mime)) {
        Alert.alert('Unsupported format', 'Please pick a JPG or PNG image.');
        return;
      }
      if (asset.fileSize && asset.fileSize > MAX_AVATAR_BYTES) {
        Alert.alert(
          'Image too large',
          'Profile picture must be under 5MB. Please pick a smaller image.',
        );
        return;
      }

      // Convert to base64 data URL for upload after registration
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      if (blob.size > MAX_AVATAR_BYTES) {
        Alert.alert(
          'Image too large',
          'Profile picture must be under 5MB. Please pick a smaller image.',
        );
        return;
      }
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      setAvatarUri(asset.uri);
      setAvatarBase64(dataUrl);
    } catch (e) {
      console.error('Pick avatar error', e);
      Alert.alert('Error', 'Could not load image. Please try another.');
    } finally {
      setPickingImage(false);
    }
  };

  const skipAvatar = () => {
    setAvatarUri(null);
    setAvatarBase64(null);
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await register(
        username.trim(),
        email.trim(),
        password,
        name.trim() || undefined,
      );

      // Upload avatar after registration if user picked one
      if (avatarBase64) {
        try {
          // Tiny delay to ensure auth state is hydrated
          await new Promise((r) => setTimeout(r, 100));
          // We need a fresh token from secureStorage — easiest path: read AsyncStorage-equivalent via a quick refetch. The register() flow stores token, so we can use the API directly with the token from the auth context after this push.
          // Use a one-shot approach: call /api/users/me with current token to confirm session.
          // But simpler: directly use the stored secure token via secureStorage import.
          const { secureStorage, AUTH_TOKEN_KEY } = await import(
            '../../utils/secureStorage'
          );
          const token = await secureStorage.get(AUTH_TOKEN_KEY);
          if (token) {
            await fetch(`${API_URL}/api/users/me/avatar-base64`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ image_data: avatarBase64 }),
            });
          }
        } catch (e) {
          console.warn('Avatar upload after register failed', e);
        }
      }

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Creating your account..." />;
  }

  const displayLetterName = (name.trim() || username.trim() || '?').charAt(0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                testID="register-back-button"
              >
                <Ionicons name="arrow-back" size={24} color="#FFD700" />
              </TouchableOpacity>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>
                Join MOOD and start your fitness journey
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Username *"
                  placeholderTextColor="#666"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="register-username-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email *"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  testID="register-email-input"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-circle-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Display Name (optional)"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  testID="register-name-input"
                />
              </View>

              {/* Profile Picture Section — between Display Name and password */}
              <View
                style={styles.avatarSection}
                testID="register-avatar-section"
              >
                <Text style={styles.avatarLabel}>
                  Add a profile picture (optional)
                </Text>
                <TouchableOpacity
                  style={styles.avatarBox}
                  onPress={pickAvatar}
                  activeOpacity={0.85}
                  disabled={pickingImage}
                  testID="register-avatar-picker"
                >
                  {pickingImage ? (
                    <ActivityIndicator color={GOLD} />
                  ) : avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
                  ) : (
                    <View style={styles.avatarBoxInner}>
                      <UserAvatar
                        name={displayLetterName}
                        size={64}
                        testID="register-avatar-default-preview"
                      />
                      <View style={styles.avatarPlusRow}>
                        <Ionicons name="camera-outline" size={16} color="#fff" />
                        <Text style={styles.avatarBoxText}>
                          Tap to add picture
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={skipAvatar}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  testID="register-avatar-skip"
                >
                  <Text style={styles.skipLink}>
                    {avatarUri ? 'Remove — Skip for now' : 'Skip for now'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Password *"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="register-password-input"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  testID="register-password-toggle"
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#666"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password *"
                  placeholderTextColor="#666"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  autoCorrect={false}
                  testID="register-confirm-password-input"
                />
              </View>

              <TouchableOpacity
                style={styles.registerButton}
                onPress={handleRegister}
                testID="register-submit-button"
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.registerButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.registerButtonText}>Create Account</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/auth/login')}>
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40 },
  header: { marginBottom: 32, alignItems: 'center' },
  backButton: { position: 'absolute', left: 0, top: 0, padding: 8 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#888', textAlign: 'center' },
  form: { marginBottom: 40 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, height: 50, fontSize: 16, color: '#fff' },
  passwordInput: { paddingRight: 40 },
  eyeIcon: { position: 'absolute', right: 16, padding: 4 },
  registerButton: { borderRadius: 12, overflow: 'hidden', marginTop: 8 },
  registerButtonGradient: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0c0c0c' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 14, color: '#888' },
  footerLink: { fontSize: 14, color: '#FFD700', fontWeight: '600' },

  // Avatar section
  avatarSection: { marginBottom: 16, alignItems: 'center' },
  avatarLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  avatarBox: {
    width: '100%',
    minHeight: 130,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  avatarBoxInner: { alignItems: 'center', gap: 10 },
  avatarPlusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatarBoxText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  avatarPreview: { width: 96, height: 96, borderRadius: 48 },
  skipLink: {
    color: '#FFD700',
    fontSize: 13,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});
