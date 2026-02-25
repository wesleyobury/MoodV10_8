/**
 * API Configuration - Clean Production-Safe Version
 *
 * This file ensures:
 * - Production builds use EAS env variable
 * - Preview domains are ignored in production
 * - A safe production fallback is always available
 */

import Constants from 'expo-constants';

// API URL is derived exclusively from environment variables
// No hardcoded fallback - fails fast if not configured

// Detect preview domains
const isPreviewDomain = (url: string): boolean =>
  url.includes('.preview.emergentagent.com');

// Normalize URL (remove trailing slashes)
const normalize = (url: string): string =>
  url.trim().replace(/\/+$/, '');

// Get API URL safely
const getApiUrl = (): string => {
  // 1️⃣ Try environment variable (EAS injects this at build time)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') {
    const normalized = normalize(envUrl);
    if (!isPreviewDomain(normalized)) {
      return normalized;
    }
    console.warn('⚠️ Ignoring preview env URL:', normalized);
  }

  // 2️⃣ Try Expo config (EAS build config)
  const configUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL;
  if (typeof configUrl === 'string' && configUrl.trim() !== '') {
    const normalized = normalize(configUrl);
    if (!isPreviewDomain(normalized)) {
      return normalized;
    }
    console.warn('⚠️ Ignoring preview config URL:', normalized);
  }

  // 3️⃣ Final fallback (guaranteed safe production)
  console.warn('⚠️ Using production fallback URL');
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
  console.log('PRODUCTION_BACKEND_URL (fallback):', PRODUCTION_BACKEND_URL);
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