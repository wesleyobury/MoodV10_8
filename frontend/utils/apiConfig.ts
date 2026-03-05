/**
 * API Configuration - Locked Production URL
 *
 * IMPORTANT: EXPO_PUBLIC_BACKEND_URL is locked to the production backend.
 * Preview deployments must NOT overwrite frontend .env or app.json.
 * The frontend always points to the production backend for dev/TestFlight builds.
 */

import Constants from 'expo-constants';

// ── LOCKED PRODUCTION BACKEND ──
// This is the ONLY backend URL the frontend should ever use.
// Do NOT change this to a preview domain.
const PRODUCTION_BACKEND_URL = 'https://bug-busters-13.emergent.host';

// Detect preview domains (must never be used)
const isPreviewDomain = (url: string): boolean =>
  url.includes('.preview.emergentagent.com');

// Normalize URL (remove trailing slashes)
const normalize = (url: string): string =>
  url.trim().replace(/\/+$/, '');

// Get API URL safely — always resolves to production
const getApiUrl = (): string => {
  // 1. Try environment variable (EAS injects this at build time)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') {
    const normalized = normalize(envUrl);
    if (!isPreviewDomain(normalized)) {
      return normalized;
    }
    console.warn('⚠️ Rejecting preview env URL — using production:', normalized);
  }

  // 2. Try Expo config (EAS build config)
  const configUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
  if (typeof configUrl === 'string' && configUrl.trim() !== '') {
    const normalized = normalize(configUrl);
    if (!isPreviewDomain(normalized)) {
      return normalized;
    }
    console.warn('⚠️ Rejecting preview config URL — using production:', normalized);
  }

  // 3. Locked production fallback — ALWAYS resolves, never empty
  return PRODUCTION_BACKEND_URL;
};

// Final resolved API URL
export const API_URL = getApiUrl();
export const AUTH_URL = API_URL;

/**
 * Validate and log API configuration on startup
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

  if (!API_URL || API_URL === '') {
    console.error('❌ CRITICAL: API_URL is empty!');
    return false;
  }

  if (!API_URL.startsWith('http://') && !API_URL.startsWith('https://')) {
    console.error('❌ CRITICAL: API_URL is not absolute:', API_URL);
    return false;
  }

  try {
    console.log('🏥 Performing health check...');
    const response = await fetch(`${API_URL}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.ok) {
      console.log('✅ Health check passed!');
      return true;
    } else {
      console.warn('⚠️ Health check non-OK status:', response.status);
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Health check failed:', error);
    return false;
  }
};

/**
 * Build absolute URL for API endpoints
 */
export const buildApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

/**
 * OAuth callback URLs
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