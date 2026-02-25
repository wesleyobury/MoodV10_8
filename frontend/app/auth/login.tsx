import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking as RNLinking,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { API_URL } from '../../utils/apiConfig';

WebBrowser.maybeCompleteAuthSession();

// Helper function to retry fetch with exponential backoff
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3): Promise<Response> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error(`Attempt ${attempt}: Non-JSON response:`, textResponse.substring(0, 100));
        
        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw new Error('Server temporarily unavailable. Please try again.');
      }
      
      return response;
    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError || new Error('Failed after multiple attempts');
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Hidden diagnostics trigger - 5 rapid taps on header
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);

  const { login, refreshAuth, continueAsGuest } = useAuth();
  
  // Handle hidden diagnostics trigger
  const handleHeaderTap = () => {
    const now = Date.now();
    // Reset if more than 500ms since last tap
    if (now - lastTapRef.current > 500) {
      tapCountRef.current = 0;
    }
    tapCountRef.current += 1;
    lastTapRef.current = now;
    
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      console.log('🔧 Opening diagnostics panel...');
      router.push('/diagnostics');
    }
  };

  // Check if Apple Sign-In is available (iOS only)
  useEffect(() => {
    const checkAppleAvailability = async () => {
      if (Platform.OS === 'ios') {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAppleAvailable(available);
      }
    };
    checkAppleAvailability();
  }, []);

  // Handle deep link redirect from Emergent Auth
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('Deep link received:', url);
      
      // Parse session_id from URL hash or query
      let sessionId = null;
      
      // Try hash first (#session_id=...)
      if (url.includes('#session_id=')) {
        sessionId = url.split('#session_id=')[1].split('&')[0];
      }
      // Try query (?session_id=...)
      else if (url.includes('?session_id=')) {
        sessionId = url.split('?session_id=')[1].split('&')[0];
      }
      
      if (sessionId) {
        console.log('Found session_id, processing OAuth login...');
        await handleOAuthCallback(sessionId);
      }
    };

    // Check initial URL (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for URL changes (hot link)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleOAuthCallback = async (sessionId: string) => {
    try {
      setIsLoading(true);
      console.log('Exchanging session_id for token...');
      
      const response = await fetchWithRetry(
        `${API_URL}/api/auth/oauth/callback?session_id=${sessionId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        },
        3 // max retries
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to authenticate with OAuth');
      }

      const data = await response.json();
      console.log('OAuth login successful!');
      
      // Store session token in AsyncStorage
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('auth_token', data.session_token);
      
      // Refresh auth context to load the new user
      await refreshAuth();
      
      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('OAuth error:', error);
      Alert.alert('Authentication Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      
      // Create redirect URL based on platform
      // For Expo Go on mobile, we need to use the exp:// scheme or the app's custom scheme
      let redirectUrl: string;
      
      if (Platform.OS === 'web') {
        redirectUrl = window.location.origin + '/';
      } else {
        // Use Linking.createURL for native - this handles Expo Go and standalone builds
        redirectUrl = Linking.createURL('auth/callback');
      }
      
      console.log('Redirect URL:', redirectUrl);
      
      // Build Emergent Auth URL
      const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
      console.log('Opening auth URL:', authUrl);
      
      // Open OAuth session
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      console.log('Auth session result:', JSON.stringify(result));
      
      if (result.type === 'success' && result.url) {
        // Parse session_id from returned URL
        const url = result.url;
        console.log('Returned URL:', url);
        
        let sessionId = null;
        
        if (url.includes('#session_id=')) {
          sessionId = url.split('#session_id=')[1].split('&')[0];
        } else if (url.includes('?session_id=')) {
          sessionId = url.split('?session_id=')[1].split('&')[0];
        } else if (url.includes('session_id=')) {
          // Try to extract from anywhere in the URL
          const match = url.match(/session_id=([^&]+)/);
          if (match) {
            sessionId = match[1];
          }
        }
        
        console.log('Extracted session ID:', sessionId ? 'found' : 'not found');
        
        if (sessionId) {
          await handleOAuthCallback(sessionId);
        } else {
          throw new Error('No session ID returned from authentication. URL: ' + url);
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled authentication');
      } else if (result.type === 'dismiss') {
        console.log('Browser was dismissed');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      Alert.alert('Login Failed', error.message || 'Unable to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsLoading(true);
      console.log('Starting Apple Sign-In...');
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential received:', {
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName,
      });

      // Send to backend for authentication with retry
      const response = await fetchWithRetry(
        `${API_URL}/api/auth/apple`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            user_id: credential.user,
            email: credential.email,
            full_name: credential.fullName ? 
              `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : 
              null,
            identity_token: credential.identityToken,
            authorization_code: credential.authorizationCode,
          }),
        },
        3 // max retries
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to authenticate with Apple');
      }

      const data = await response.json();
      console.log('Apple login successful!');

      // Store session token in AsyncStorage
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('auth_token', data.session_token);

      // Refresh auth context to load the new user
      await refreshAuth();

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('User cancelled Apple Sign-In');
      } else {
        console.error('Apple login error:', error);
        Alert.alert('Login Failed', error.message || 'Unable to sign in with Apple');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    await continueAsGuest();
    router.replace('/(tabs)');
  };

  if (isLoading) {
    return <LoadingSpinner text="Logging in..." />;
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {/* Header - Tap 5 times rapidly to open diagnostics */}
          <TouchableOpacity 
            style={styles.header} 
            onPress={handleHeaderTap}
            activeOpacity={1}
          >
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Login to continue your fitness journey</Text>
          </TouchableOpacity>

          {/* Google Sign In Button */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <View style={styles.googleIconContainer}>
              <Ionicons name="logo-google" size={20} color="#fff" />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Apple Sign In Button - iOS only */}
          {(Platform.OS === 'ios' && isAppleAvailable) ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={12}
              style={styles.appleButton}
              onPress={handleAppleLogin}
            />
          ) : Platform.OS === 'ios' ? null : (
            <TouchableOpacity style={styles.appleButtonFallback} onPress={handleAppleLogin}>
              <View style={styles.appleIconContainer}>
                <Ionicons name="logo-apple" size={20} color="#000" />
              </View>
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username or Email"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color="#666" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.loginButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Mode Button */}
          <TouchableOpacity 
            style={styles.guestButton}
            onPress={handleContinueAsGuest}
          >
            <Ionicons name="eye-outline" size={18} color="#888" style={{ marginRight: 8 }} />
            <Text style={styles.guestButtonText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    height: 50,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  googleIconContainer: {
    backgroundColor: '#DB4437',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 24,
  },
  appleButtonFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 50,
    marginBottom: 24,
    gap: 12,
  },
  appleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  form: {
    marginBottom: 24,
  },
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#fff',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  loginButtonGradient: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c0c0c',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  footerLink: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
  },
  guestButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
});
