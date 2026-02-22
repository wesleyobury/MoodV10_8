/**
 * API Configuration - Production URL Lock
 * 
 * CRITICAL: This file ensures the app NEVER uses relative URLs.
 * Production builds MUST use https://bug-busters-13.emergent.host
 */

import Constants from 'expo-constants';

// Production backend URL - HARDCODED FALLBACK
// This ensures TestFlight/production builds ALWAYS have a valid URL
const PRODUCTION_BACKEND_URL = 'https://analytics-fix-23.preview.emergentagent.com';

/**
 * Get the API base URL with guaranteed non-empty result
 * Priority:
 * 1. EXPO_PUBLIC_BACKEND_URL from process.env (for dev/preview)
 * 2. EXPO_PUBLIC_BACKEND_URL from Constants.expoConfig.extra (for EAS builds)
 * 3. PRODUCTION_BACKEND_URL hardcoded fallback (guaranteed for production)
 */
const getApiUrl = (): string => {
  // Try environment variable first (dev/preview environments)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim();
  }
  
  // Try EAS build config
  const configUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
  if (configUrl && typeof configUrl === 'string' && configUrl.trim() !== '') {
    return configUrl.trim();
  }
  
  // Fallback to production URL - NEVER return empty string
  console.warn('⚠️ Using hardcoded production URL fallback');
  return PRODUCTION_BACKEND_URL;
};

// Export the API URL as a constant for easy import
export const API_URL = getApiUrl();

// Auth-specific URL (same as API_URL for this app)
export const AUTH_URL = API_URL;

/**
 * Validate and log API configuration on startup
 * Call this once during app initialization
 */
export const validateApiConfig = async (): Promise<boolean> => {
  console.log('========================================');
  console.log('🔧 API CONFIGURATION');
  console.log('========================================');
  console.log('API_URL:', API_URL);
  console.log('AUTH_URL:', AUTH_URL);
  console.log('process.env.EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL || '(not set)');
  console.log('Constants.expoConfig?.extra:', JSON.stringify(Constants.expoConfig?.extra || {}));
  console.log('========================================');
  
  // Validate URL is not empty and is absolute
  if (!API_URL || API_URL === '') {
    console.error('❌ CRITICAL: API_URL is empty! This should never happen.');
    return false;
  }
  
  if (!API_URL.startsWith('http://') && !API_URL.startsWith('https://')) {
    console.error('❌ CRITICAL: API_URL is not an absolute URL:', API_URL);
    return false;
  }
  
  // Perform health check
  try {
    console.log('🏥 Performing health check...');
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      console.log('✅ Health check passed! Backend is reachable.');
      return true;
    } else {
      console.warn('⚠️ Health check returned non-OK status:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Health check failed:', error);
    // Don't block app startup on health check failure
    // The user might be offline or backend might be temporarily down
    return false;
  }
};

/**
 * Build absolute URL for API endpoints
 * NEVER returns a relative URL
 */
export const buildApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

/**
 * OAuth callback URLs - use production domain
 */
export const OAUTH_CALLBACKS = {
  google: `${API_URL}/api/auth/callback/google`,
  apple: `${API_URL}/api/auth/callback/apple`,
};

export default {
  API_URL,
  AUTH_URL,
  getApiUrl,
  validateApiConfig,
  buildApiUrl,
  OAUTH_CALLBACKS,
};
