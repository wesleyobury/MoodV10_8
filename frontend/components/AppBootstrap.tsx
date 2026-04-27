import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, Platform } from 'react-native';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/apiConfig';
import { secureStorage, AUTH_TOKEN_KEY } from '../utils/secureStorage';

interface AppBootstrapProps {
  children: React.ReactNode;
  onReady?: () => void;
}

type BootState = 'booting' | 'ready' | 'recovery';

interface BackgroundStatus {
  healthChecked: boolean;
  healthOk: boolean;
  tokenRestored: boolean;
  tokenValid: boolean;
}

const AppBootstrap: React.FC<AppBootstrapProps> = ({ children, onReady }) => {
  const [bootState, setBootState] = useState<BootState>('booting');
  const [statusMessage, setStatusMessage] = useState('Starting...');
  const [showRecovery, setShowRecovery] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const mountedRef = useRef(true);
  const bootStartedRef = useRef(false);
  const backgroundStatusRef = useRef<BackgroundStatus>({
    healthChecked: false,
    healthOk: false,
    tokenRestored: false,
    tokenValid: false,
  });
  
  // Configuration - STRICT timing for production cold-start
  const MAX_BOOT_TIME_MS = 3000;  // Hard limit: 3 seconds to show app
  const HEALTH_CHECK_TIMEOUT_MS = 5000;  // 5 second timeout for health check
  const TOKEN_RESTORE_TIMEOUT_MS = 5000;  // 5 second timeout for token restore
  const MAX_RETRIES = 1;  // Only 1 retry for background tasks

  // Pulse animation for logo
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Progress animation (0 to 1 over MAX_BOOT_TIME_MS)
  useEffect(() => {
    if (bootState === 'booting') {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: MAX_BOOT_TIME_MS,
        useNativeDriver: false,
      }).start();
    }
  }, [bootState]);

  // Health check with timeout - NON-BLOCKING
  const checkBackendHealth = useCallback(async (apiUrl: string): Promise<boolean> => {
    if (!apiUrl) {
      console.log('AppBootstrap: No API URL, skipping health check');
      return true; // Consider healthy if no URL configured
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

    try {
      console.log(`AppBootstrap: Health check -> ${apiUrl}/api/health`);
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log('AppBootstrap: Health check passed');
        return true;
      }
      console.warn('AppBootstrap: Health check failed:', response.status);
      return false;
    } catch (error: any) {
      clearTimeout(timeoutId);
      const msg = error.name === 'AbortError' ? 'timeout' : error.message;
      console.warn('AppBootstrap: Health check error:', msg);
      return false;
    }
  }, []);

  // Token restore check - NON-BLOCKING
  const checkTokenRestore = useCallback(async (apiUrl: string): Promise<boolean> => {
    try {
      const storedToken = await secureStorage.get(AUTH_TOKEN_KEY);
      if (!storedToken) {
        console.log('AppBootstrap: No stored token');
        return false; // No token, but that's OK
      }

      if (!apiUrl) {
        console.log('AppBootstrap: Token exists but no API URL to validate');
        return true; // Assume valid if can't check
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TOKEN_RESTORE_TIMEOUT_MS);

      try {
        const response = await fetch(`${apiUrl}/api/users/me`, {
          method: 'GET',
          signal: controller.signal,
          headers: { 
            'Authorization': `Bearer ${storedToken}`,
            'Accept': 'application/json' 
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log('AppBootstrap: Token validation passed');
          return true;
        }
        console.warn('AppBootstrap: Token validation failed:', response.status);
        return false;
      } catch (error: any) {
        clearTimeout(timeoutId);
        const msg = error.name === 'AbortError' ? 'timeout' : error.message;
        console.warn('AppBootstrap: Token validation error:', msg);
        return false;
      }
    } catch (error) {
      console.warn('AppBootstrap: Token restore error:', error);
      return false;
    }
  }, []);

  // Run background checks (non-blocking)
  const runBackgroundChecks = useCallback(async (apiUrl: string) => {
    console.log('AppBootstrap: Starting background checks...');
    
    // Run health check and token restore in parallel
    const [healthResult, tokenResult] = await Promise.all([
      checkBackendHealth(apiUrl),
      checkTokenRestore(apiUrl),
    ]);

    if (!mountedRef.current) return;

    backgroundStatusRef.current = {
      healthChecked: true,
      healthOk: healthResult,
      tokenRestored: true,
      tokenValid: tokenResult,
    };

    // If health check failed, retry once
    if (!healthResult) {
      console.log('AppBootstrap: Health check failed, retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!mountedRef.current) return;
      
      const retryResult = await checkBackendHealth(apiUrl);
      backgroundStatusRef.current.healthOk = retryResult;
      
      if (!retryResult) {
        console.warn('AppBootstrap: Background health check failed after retry');
      }
    }

    console.log('AppBootstrap: Background checks complete:', backgroundStatusRef.current);
  }, [checkBackendHealth, checkTokenRestore]);

  // Main boot sequence
  const boot = useCallback(async () => {
    if (!mountedRef.current) return;
    
    console.log('AppBootstrap: Boot sequence started');
    const bootStartTime = Date.now();
    const apiUrl = API_URL;
    
    // Start background checks immediately (don't await)
    runBackgroundChecks(apiUrl);
    
    // Animate status messages during boot
    const statusMessages = ['Starting...', 'Loading...', 'Almost ready...'];
    let messageIndex = 0;
    
    const statusInterval = setInterval(() => {
      if (mountedRef.current && messageIndex < statusMessages.length) {
        setStatusMessage(statusMessages[messageIndex]);
        messageIndex++;
      }
    }, 800);

    // HARD TIMEOUT: Proceed to app after MAX_BOOT_TIME_MS regardless of background status
    await new Promise(resolve => setTimeout(resolve, MAX_BOOT_TIME_MS));
    
    clearInterval(statusInterval);
    
    if (!mountedRef.current) return;

    const bootDuration = Date.now() - bootStartTime;
    console.log(`AppBootstrap: Boot completed in ${bootDuration}ms`);

    // Check if background tasks completed successfully
    const status = backgroundStatusRef.current;
    
    if (!status.healthChecked) {
      // Background checks still running - proceed anyway, they'll complete
      console.log('AppBootstrap: Background checks still running, proceeding to app');
    }

    // Transition to ready state
    setBootState('ready');
    setStatusMessage('Ready');
    
    // Fade out and show app
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (mountedRef.current) {
        setIsReady(true);
        onReady?.();
      }
    });
  }, [fadeAnim, onReady, runBackgroundChecks]);

  // Handle retry from recovery state
  const handleRetry = useCallback(() => {
    console.log('AppBootstrap: Retry requested');
    setShowRecovery(false);
    setBootState('booting');
    setStatusMessage('Retrying...');
    progressAnim.setValue(0);
    bootStartedRef.current = false;
    boot();
  }, [boot, progressAnim]);

  // Handle continue as guest from recovery state
  const handleContinueAsGuest = useCallback(async () => {
    console.log('AppBootstrap: Continue as guest requested');
    try {
      await AsyncStorage.setItem('is_guest', 'true');
    } catch (e) {
      console.warn('AppBootstrap: Failed to set guest mode:', e);
    }
    
    setShowRecovery(false);
    setBootState('ready');
    
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (mountedRef.current) {
        setIsReady(true);
        onReady?.();
      }
    });
  }, [fadeAnim, onReady]);

  // Start boot sequence once
  useEffect(() => {
    mountedRef.current = true;
    
    if (!bootStartedRef.current) {
      bootStartedRef.current = true;
      // Small delay to ensure component is mounted
      const timer = setTimeout(boot, 50);
      return () => clearTimeout(timer);
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [boot]);

  // Emergency fallback - if somehow we're stuck after 8 seconds, show recovery
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (mountedRef.current && !isReady && bootState === 'booting') {
        console.warn('AppBootstrap: Emergency timeout triggered');
        setBootState('recovery');
        setShowRecovery(true);
      }
    }, 8000);
    
    return () => clearTimeout(emergencyTimeout);
  }, [isReady, bootState]);

  // Show children when ready
  if (isReady) {
    return <>{children}</>;
  }

  // Progress bar width interpolation
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Recovery screen
  if (showRecovery) {
    return (
      <View style={styles.container}>
        <View style={styles.recoveryScreen}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>MOOD</Text>
            <Text style={styles.logoSubtext}>FITNESS</Text>
          </View>

          {/* Recovery message */}
          <View style={styles.recoveryContent}>
            <Text style={styles.recoveryTitle}>Taking longer than expected</Text>
            <Text style={styles.recoveryMessage}>
              We're having trouble connecting. You can retry or continue browsing as a guest.
            </Text>

            {/* Retry button */}
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.retryButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Continue as guest button */}
            <TouchableOpacity style={styles.guestButton} onPress={handleContinueAsGuest}>
              <Text style={styles.guestButtonText}>Continue as Guest</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Boot screen
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.loadingScreen, { opacity: fadeAnim }]}>
        {/* Logo with pulse animation */}
        <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoText}>MOOD</Text>
          <Text style={styles.logoSubtext}>FITNESS</Text>
        </Animated.View>

        {/* Loading indicator and status */}
        <View style={styles.loadingArea}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressWidth }]}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.progressGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 10,
  },
  logoSubtext: {
    fontSize: 13,
    color: '#666',
    letterSpacing: 8,
    marginTop: 8,
  },
  loadingArea: {
    alignItems: 'center',
    minHeight: 80,
  },
  statusText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
    letterSpacing: 1,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 80,
    left: 40,
    right: 40,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#222',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressGradient: {
    flex: 1,
  },
  // Recovery screen styles
  recoveryScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  recoveryContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  recoveryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  recoveryMessage: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  retryButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  retryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  guestButton: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 12,
  },
  guestButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFD700',
  },
});

export default AppBootstrap;
