import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { trackEvent, aliasGuestToUser, GuestAnalytics } from '../utils/analytics';
import TermsAcceptanceModal from '../components/TermsAcceptanceModal';
import { resetNotificationSession } from '../utils/notificationUtils';
import { API_URL, validateApiConfig } from '../utils/apiConfig';
import { apiFetch } from '../utils/api';
import { secureStorage, AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY, AUTH_TOKEN_STORED_AT_KEY, AUTH_TOKEN_LAST_VALIDATED_KEY } from '../utils/secureStorage';
import { DEV_MOCKS_ENABLED, getDevMockEntitlement } from '../utils/devMocks';

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
  tips_state?: {
    mood_scroll?: 'unseen' | 'completed' | 'dismissed';
    form_videos?: 'unseen' | 'completed' | 'dismissed' | 'never';
    completion_share?: 'unseen' | 'completed' | 'dismissed' | 'never';
  };
  // Phase D — Paid Launch Founding Members (Part 9). Hydrated from
  // /api/auth/me. The frontend reads these to short-circuit paywall gates
  // and to show the one-time celebration modal exactly once.
  founding_member?: boolean;
  founding_member_at?: string | null;
  founding_member_modal_seen?: boolean;
  // Phase C — StoreKit receipt status mirror. /api/auth/me reflects the
  // persisted subscription doc (set by /subscription/validate and the
  // Apple S2S webhook). Used by SubscriptionContext to rehydrate the
  // entitlement on every app launch (handles the reinstall edge case
  // where AsyncStorage is wiped but the Apple receipt is still valid).
  subscription_status?: 'active' | 'in_trial' | 'lapsed' | null;
  subscription_plan?: 'annual' | 'monthly' | null;
  subscription_product_id?: string | null;
  subscription_expiration_date?: string | null;
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
  entitlement: Entitlement | null;
  refreshEntitlement: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuestMode: () => void;
  acceptTerms: () => Promise<void>;
  promptTermsAcceptance: () => void;
}

// MOOD V2 Phase 1 — server-authoritative entitlement. The client READS this;
// the backend ENFORCES it. SubscriptionContext derives hasActiveAccess from it.
export interface Entitlement {
  has_full_access: boolean;
  reason: string;
  free_workouts_remaining: number | null;
  is_founding_member: boolean;
  founding_pricing_claimed: boolean;
  founding_window_active: boolean;
  founding_window_expires_at?: string | null;
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
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);

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
        // SecureStore is the primary source; migrate from AsyncStorage if needed.
        const storedToken = await secureStorage.migrate(AUTH_TOKEN_KEY);
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
              setToken(storedToken);
              setUser(userData);
              // Mark token as freshly validated
              secureStorage.set(AUTH_TOKEN_LAST_VALIDATED_KEY, new Date().toISOString()).catch(() => {});
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
            } else if (userResp.status === 401 || userResp.status === 403) {
              // Token is truly invalid/expired per the auth endpoint — clear it
              console.log(`Stored token invalid (${userResp.status}), clearing...`);
              await secureStorage.delete(AUTH_TOKEN_KEY);
            } else {
              // Server error (404, 500, 502, 503, etc.) — keep token, proceed optimistically
              // Don't log out users due to transient server issues
              console.warn(`⚠️ Non-auth error ${userResp.status} during validation, keeping session`);
              setToken(storedToken);
              setIsLoading(false);
              if (timeoutId) clearTimeout(timeoutId);
              return;
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
      const storedToken = await secureStorage.get(AUTH_TOKEN_KEY);
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
        // Mark token as freshly validated
        secureStorage.set(AUTH_TOKEN_LAST_VALIDATED_KEY, new Date().toISOString()).catch(() => {});
        
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
      } else if (response.status === 401 || response.status === 403) {
        // Backend explicitly says the token is invalid → log out
        console.warn(`🔐 Auth token rejected (${response.status}), logging out`);
        await logout();
      } else {
        // Any other non-OK (404, 500, 502, 503, ...) is a transient/server issue.
        // Keep the session — the user should NOT be logged out.
        console.warn(`⚠️ /users/me non-auth error ${response.status}, keeping session`);
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
      console.log('🔐 Attempting login...');
      console.log('🔗 API_URL being used:', API_URL);
      
      // Use safe apiFetch that handles non-JSON responses gracefully
      const result = await apiFetch<{ token: string; refresh_token: string; user_id: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (result.ok && result.data) {
        const { token: authToken, refresh_token: refreshToken, user_id } = result.data as any;
        setToken(authToken);
        await secureStorage.set(AUTH_TOKEN_KEY, authToken);
        if (refreshToken) await secureStorage.set(AUTH_REFRESH_TOKEN_KEY, refreshToken);
        const nowIso = new Date().toISOString();
        await secureStorage.set(AUTH_TOKEN_STORED_AT_KEY, nowIso);
        await secureStorage.set(AUTH_TOKEN_LAST_VALIDATED_KEY, nowIso);
        
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
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string, name?: string) => {
    try {
      console.log('📝 Attempting registration...');
      console.log('🔗 API_URL being used:', API_URL);
      
      // Use safe apiFetch that handles non-JSON responses gracefully
      const result = await apiFetch<{ token: string; refresh_token: string; user_id: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, name }),
      });

      if (result.ok && result.data) {
        const { token: authToken, refresh_token: refreshToken, user_id } = result.data as any;
        setToken(authToken);
        await secureStorage.set(AUTH_TOKEN_KEY, authToken);
        if (refreshToken) await secureStorage.set(AUTH_REFRESH_TOKEN_KEY, refreshToken);
        const nowIso = new Date().toISOString();
        await secureStorage.set(AUTH_TOKEN_STORED_AT_KEY, nowIso);
        await secureStorage.set(AUTH_TOKEN_LAST_VALIDATED_KEY, nowIso);
        
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

        // Phase A/B paid launch — new signups are routed directly into the
        // onboarding funnel by `app/auth/register.tsx`. Do NOT set
        // `@mood_needs_funnel` here: it races FunnelEntryGate → landing and
        // causes a double funnel transition. Incomplete-funnel recovery is
        // handled by `app/index.tsx` (cold start) + `readHasCompletedFunnel`.
        // Fresh account — clear any legacy device-wide funnel blob left by a
        // prior account on this device. Per-user answers use `:${userId}` keys.
        await AsyncStorage.removeItem('@mood_funnel_answers_v1');
        // Fresh account — clear any legacy device-wide paywall/session flags
        // left by a prior account on this device (user-scoped keys are written
        // once fetchCurrentUser resolves with the new user id).
        await AsyncStorage.removeItem('@mood_subscription_state_v1');
        await AsyncStorage.removeItem('@mood_post_first_workout_paywall_shown_v1');
        await AsyncStorage.removeItem('@mood_pulse_sync_played_v1');

        await fetchCurrentUser(authToken);
      } else {
        throw new Error(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await secureStorage.delete(AUTH_TOKEN_KEY);
      await secureStorage.delete(AUTH_REFRESH_TOKEN_KEY);
      await secureStorage.delete(AUTH_TOKEN_STORED_AT_KEY);
      await secureStorage.delete(AUTH_TOKEN_LAST_VALIDATED_KEY);
      await AsyncStorage.removeItem('is_guest');
      // Spec §2a — purge the funnel re-entry flag so a stale register flag
      // cannot reroute a returning user. Funnel completion (`completedAt`)
      // is scoped per user id and intentionally preserved across logout.
      await AsyncStorage.removeItem('@mood_needs_funnel');
      // Legacy device-wide keys from before per-user scoping. Harmless hygiene
      // on sign-out so an old-format blob cannot leak if someone logs into a
      // different account without a full app reinstall. Paywall + subscription
      // state now live under `:${user.id}` keys and are isolated per account.
      await AsyncStorage.removeItem('@mood_subscription_state_v1');
      await AsyncStorage.removeItem('@mood_post_first_workout_paywall_shown_v1');
      // Pulse Sync flag is still device-wide — clear so the next account on
      // this device can see the first-workout celebration.
      await AsyncStorage.removeItem('@mood_pulse_sync_played_v1');
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

  // MOOD V2 Phase 1 — fetch server-authoritative entitlement. Fails soft:
  // on error we leave the last-known value (or null), and the backend still
  // enforces on every paywalled action. Re-run whenever the token changes
  // (login/restore/refresh) so SubscriptionContext stays in sync.
  const refreshEntitlement = async () => {
    try {
      // DEV-only override (auditable: utils/devMocks.ts). Inert in production
      // (DEV_MOCKS_ENABLED === false) and only returns a value when the
      // /dev/screens menu has explicitly armed the founding-eligible mock.
      if (DEV_MOCKS_ENABLED) {
        const mock = await getDevMockEntitlement();
        if (mock) {
          setEntitlement(mock as Entitlement);
          return;
        }
      }
      const storedToken = token || (await secureStorage.get(AUTH_TOKEN_KEY));
      if (!storedToken) {
        setEntitlement(null);
        return;
      }
      const res = await apiFetch<Entitlement>('/api/me/entitlement', {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (res.ok && res.data) {
        setEntitlement(res.data);
      }
    } catch (e) {
      console.log('entitlement fetch failed (failing soft):', e);
    }
  };

  useEffect(() => {
    if (token) {
      refreshEntitlement();
    } else {
      setEntitlement(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Refresh auth from stored token - used after OAuth/Apple login
  const refreshAuth = async () => {
    try {
      console.log('🔄 Refreshing auth from stored token...');
      const storedToken = await secureStorage.get(AUTH_TOKEN_KEY);
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
    entitlement,
    refreshEntitlement,
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