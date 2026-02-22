import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { trackEvent, aliasGuestToUser, GuestAnalytics } from '../utils/analytics';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';
import { resetNotificationSession } from '../utils/notificationUtils';
import { API_URL, validateApiConfig } from '../utils/apiConfig';
import { apiFetch } from '../utils/api';

// Terms version must match backend CURRENT_TERMS_VERSION
// Update this when terms change to force re-acceptance for all users
const CURRENT_TERMS_VERSION = "2025-01-19";

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  bio?: string;
  avatar?: string;
  followers_count: number;
  following_count: number;
  workouts_count: number;
  current_streak: number;
  terms_accepted_at?: string | null;
  terms_accepted_version?: string | null;
  current_terms_version?: string; // From backend - what version is required
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isGuest: boolean;
  hasAcceptedTerms: boolean;
  showTermsModal: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshAuth: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
  acceptTerms: () => Promise<void>;
  promptTermsAcceptance: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API_URL is now imported from utils/apiConfig.ts with production fallback

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Derived state: Check if user has accepted the CURRENT version of terms
  // User must have accepted terms AND their version must match current version
  const hasAcceptedTerms = Boolean(
    user?.terms_accepted_at && 
    user?.terms_accepted_version === CURRENT_TERMS_VERSION
  );

  useEffect(() => {
    // Auth initialization timeout - never block app startup
    const AUTH_INIT_TIMEOUT = 5000; // 5 seconds max for auth init
    
    // Auto-login or load stored session with timeout protection
    const initAuth = async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        console.log('🔐 Initializing auth...');
        
        // Validate API configuration and log for debugging
        await validateApiConfig();
        
        // Safety timeout - ensure we never hang
        const timeoutPromise = new Promise<'timeout'>((resolve) => {
          timeoutId = setTimeout(() => resolve('timeout'), AUTH_INIT_TIMEOUT);
        });
        
        // Check if user is in guest mode (fast local check)
        const guestMode = await AsyncStorage.getItem('is_guest');
        if (guestMode === 'true') {
          console.log('🚶 User is in guest mode');
          setIsGuest(true);
          setUser(null);
          setToken(null);
          setIsLoading(false);
          if (timeoutId) clearTimeout(timeoutId);
          return;
        }
        
        // Try to get stored token first (fast local check)
        const storedToken = await AsyncStorage.getItem('auth_token');
        if (storedToken) {
          console.log('Found stored token, validating with timeout...');
          
          // Create abort controller for fetch timeout
          const controller = new AbortController();
          const fetchTimeoutId = setTimeout(() => controller.abort(), AUTH_INIT_TIMEOUT - 1000);
          
          try {
            // Validate token by fetching user with timeout
            const userResp = await Promise.race([
              fetch(`${API_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${storedToken}` },
                signal: controller.signal,
              }),
              timeoutPromise,
            ]);
            
            clearTimeout(fetchTimeoutId);
            
            if (userResp === 'timeout') {
              console.warn('🕐 Auth token validation timed out, proceeding without validation');
              // Set token optimistically - will be validated on next API call
              setToken(storedToken);
              setIsLoading(false);
              if (timeoutId) clearTimeout(timeoutId);
              return;
            }
            
            if (userResp.ok) {
              const userData = await userResp.json();
              // Check if it's the correct demo user, if not clear and re-login
              if (userData.username === 'Ogeeezzbury') {
                console.log('Old demo user detected, clearing and re-logging...');
                await AsyncStorage.removeItem('auth_token');
                // Continue to auto-login below
              } else {
                setToken(storedToken);
                setUser(userData);
                console.log('✅ Restored session for:', userData.username);
                
                // Check if user needs to accept current terms version (show modal after login)
                // Show modal if: no terms accepted OR version doesn't match current version
                const needsTermsAcceptance = !userData.terms_accepted_at || 
                  userData.terms_accepted_version !== CURRENT_TERMS_VERSION;
                
                if (needsTermsAcceptance) {
                  console.log('⚠️ User has not accepted current terms version, showing modal...');
                  console.log('  User version:', userData.terms_accepted_version);
                  console.log('  Current version:', CURRENT_TERMS_VERSION);
                  setShowTermsModal(true);
                }
                
                // Track app session start on successful restore (non-blocking)
                trackEvent(storedToken, 'app_session_start', {
                  restored_session: true,
                }).catch(() => {}); // Ignore tracking errors
                
                setIsLoading(false);
                if (timeoutId) clearTimeout(timeoutId);
                return;
              }
            } else {
              console.log('Stored token invalid, clearing...');
              await AsyncStorage.removeItem('auth_token');
            }
          } catch (fetchError: any) {
            clearTimeout(fetchTimeoutId);
            if (fetchError.name === 'AbortError') {
              console.warn('🕐 Auth fetch aborted (timeout), proceeding with stored token');
              // Set token optimistically - will be validated on next API call
              setToken(storedToken);
              setIsLoading(false);
              if (timeoutId) clearTimeout(timeoutId);
              return;
            } else {
              console.warn('⚠️ Auth validation network error:', fetchError.message);
              // KEEP the token on network errors - don't log out the user
              // The network might just be temporarily unavailable on app cold start
              console.log('📱 Keeping stored token despite network error (offline support)');
              setToken(storedToken);
              setIsLoading(false);
              if (timeoutId) clearTimeout(timeoutId);
              return;
            }
          }
        }
        
        // No valid stored token - user needs to log in
        console.log('No valid session found, user needs to authenticate');
        setUser(null);
        setToken(null);
        
        if (timeoutId) clearTimeout(timeoutId);
      } catch (err) {
        console.error('❌ Auth error:', err);
        if (timeoutId) clearTimeout(timeoutId);
      } finally {
        setIsLoading(false);
      }
    };

    // Start auth init with minimal delay
    const timer = setTimeout(initAuth, 50);
    return () => clearTimeout(timer);
  }, []); // Only run once

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        await fetchCurrentUser(storedToken);
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Check if user needs to accept current terms version (show modal after login)
        // Show modal if: no terms accepted OR version doesn't match current version
        const needsTermsAcceptance = !userData.terms_accepted_at || 
          userData.terms_accepted_version !== CURRENT_TERMS_VERSION;
        
        if (needsTermsAcceptance) {
          console.log('⚠️ User has not accepted current terms version, showing modal...');
          console.log('  User version:', userData.terms_accepted_version);
          console.log('  Current version:', CURRENT_TERMS_VERSION);
          setShowTermsModal(true);
        }
      } else {
        // Token is invalid, clear it
        await logout();
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      // DON'T logout on network errors - keep the token
      // Only the explicit logout() function should clear auth
      console.log('📱 Network error fetching user, keeping session alive');
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const { token: authToken, user_id } = data;
        setToken(authToken);
        await AsyncStorage.setItem('auth_token', authToken);
        
        // Reset notification session on login
        await resetNotificationSession();
        
        // Clear guest mode if user was a guest
        const wasGuest = await AsyncStorage.getItem('is_guest');
        if (wasGuest === 'true') {
          await AsyncStorage.removeItem('is_guest');
          setIsGuest(false);
          
          // Alias guest activity to the user account (identity merge)
          console.log('🔗 Merging guest activity to user account...');
          const mergedCount = await aliasGuestToUser(authToken);
          console.log(`✅ Merged ${mergedCount} guest events to user account`);
        }
        
        await fetchCurrentUser(authToken);
      } else {
        throw new Error(data.detail || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, name?: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, name }),
      });

      const data = await response.json();

      if (response.ok) {
        const { token: authToken, user_id } = data;
        setToken(authToken);
        await AsyncStorage.setItem('auth_token', authToken);
        
        // Reset notification session on registration
        await resetNotificationSession();
        
        // Clear guest mode if user was a guest
        const wasGuest = await AsyncStorage.getItem('is_guest');
        if (wasGuest === 'true') {
          await AsyncStorage.removeItem('is_guest');
          setIsGuest(false);
          
          // Alias guest activity to the new user account (identity merge)
          console.log('🔗 Merging guest activity to new user account...');
          const mergedCount = await aliasGuestToUser(authToken);
          console.log(`✅ Merged ${mergedCount} guest events to new user account`);
        }
        
        await fetchCurrentUser(authToken);
      } else {
        throw new Error(data.detail || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('is_guest');
      setToken(null);
      setUser(null);
      setIsGuest(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Continue as guest - allows browsing without account
  const continueAsGuest = async () => {
    console.log('🚶 Continuing as guest...');
    setIsGuest(true);
    setUser(null);
    setToken(null);
    try {
      await AsyncStorage.setItem('is_guest', 'true');
      
      // Clear guest tooltip session key so it shows for each new guest session
      await AsyncStorage.removeItem('guest_tooltip_session_shown');
      
      // Track guest session start
      await GuestAnalytics.guestSessionStarted();
      console.log('📊 Guest session tracking started');
    } catch (error) {
      console.error('Error saving guest state:', error);
    }
  };

  // Exit guest mode - used when guest wants to sign up
  const exitGuestMode = async () => {
    console.log('👋 Exiting guest mode...');
    setIsGuest(false);
    try {
      await AsyncStorage.removeItem('is_guest');
    } catch (error) {
      console.error('Error clearing guest state:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Heartbeat for real-time active user tracking
  useEffect(() => {
    if (!token) return;
    
    const sendHeartbeat = async () => {
      try {
        await fetch(`${API_URL}/api/analytics/heartbeat`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.log('Heartbeat failed:', error);
      }
    };
    
    // Send initial heartbeat
    sendHeartbeat();
    
    // Set up interval - every 45 seconds
    const heartbeatInterval = setInterval(sendHeartbeat, 180000); // Every 3 minutes
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [token]);

  // Refresh auth from stored token - used after OAuth/Apple login
  const refreshAuth = async () => {
    try {
      console.log('🔄 Refreshing auth from stored token...');
      const storedToken = await AsyncStorage.getItem('auth_token');
      if (storedToken) {
        setToken(storedToken);
        await fetchCurrentUser(storedToken);
        console.log('✅ Auth refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing auth:', error);
    }
  };

  // Accept terms of service - called when user agrees to terms
  const acceptTerms = async () => {
    if (!token) {
      throw new Error('User must be logged in to accept terms');
    }
    
    try {
      console.log('📜 Accepting terms of service...');
      console.log('  Version being accepted:', CURRENT_TERMS_VERSION);
      
      const response = await fetch(`${API_URL}/api/users/me/accept-terms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to accept terms');
      }

      const data = await response.json();
      
      // Update local user state with terms acceptance AND version
      if (user) {
        setUser({
          ...user,
          terms_accepted_at: data.terms_accepted_at,
          terms_accepted_version: data.terms_accepted_version || CURRENT_TERMS_VERSION,
        });
      }
      
      // Hide the modal
      setShowTermsModal(false);
      
      console.log('✅ Terms accepted successfully');
      console.log('  Version:', data.terms_accepted_version || CURRENT_TERMS_VERSION);
    } catch (error) {
      console.error('Error accepting terms:', error);
      throw error;
    }
  };

  // Prompt the user to accept terms (for guest->interaction flows)
  const promptTermsAcceptance = () => {
    setShowTermsModal(true);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isGuest,
    hasAcceptedTerms,
    showTermsModal,
    login,
    register,
    logout,
    updateUser,
    refreshAuth,
    continueAsGuest,
    exitGuestMode,
    acceptTerms,
    promptTermsAcceptance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Terms Acceptance Modal - shown after login if terms not accepted */}
      <TermsAcceptanceModal
        visible={showTermsModal && !!user && !hasAcceptedTerms}
        onAccept={acceptTerms}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}