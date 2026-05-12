/**
 * API Configuration — self-describing, env-driven, no hardcoded URLs.
 *
 * Resolution order:
 *   1. process.env.EXPO_PUBLIC_API_URL      ← canonical, used in .env.* files
 *   2. process.env.EXPO_PUBLIC_BACKEND_URL  ← legacy alias (back-compat)
 *   3. Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL (EAS injects at build)
 *   4. Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL (legacy)
 *
 * Origin validation:
 *   - Production builds (`!__DEV__`): strict allowlist (`PROD_ALLOWED_ORIGINS`).
 *     Anything else falls back to the first prod origin.
 *   - Non-production (Expo Go, web preview, dev clients): permissive (any
 *     https/http URL accepted) — preview URLs change too often to be locked
 *     by hostname.
 */

import Constants from 'expo-constants';

// __DEV__ is a React Native global: true in Expo Go / Metro / web dev,
// false in release/EAS production bundles.
declare const __DEV__: boolean;
const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// ── Production allowlist — only enforced when !__DEV__ ──
// Add/remove entries here when production hosts change. Regex allowed.
const PROD_ALLOWED_ORIGINS: Array<string | RegExp> = [
  'https://bug-busters-13.emergent.host',
  // Add prod aliases here if/when introduced:
  // /^https:\/\/api\.mood\.app$/,
];

// First entry is the locked production fallback.
const PRODUCTION_FALLBACK = (() => {
  const first = PROD_ALLOWED_ORIGINS[0];
  return typeof first === 'string' ? first : 'https://bug-busters-13.emergent.host';
})();

const normalize = (url: string): string => url.trim().replace(/\/+$/, '');

const isAllowedOrigin = (url: string): boolean => {
  // Non-prod: permissive — any well-formed http(s) URL is allowed.
  // Preview/dev URLs change every fork; we trust env config.
  if (IS_DEV) return /^https?:\/\/[^\s]+$/i.test(url);
  // Prod: strict allowlist.
  return PROD_ALLOWED_ORIGINS.some((rule) =>
    typeof rule === 'string' ? url === rule : rule.test(url)
  );
};

const readEnv = (): string | undefined => {
  // 1 + 2: process.env (preferred; .env.* files inject these)
  const fromProcess =
    process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
  if (fromProcess && fromProcess.trim() !== '') return fromProcess;

  // 3 + 4: Expo config (EAS-injected at build time)
  const extra = (Constants.expoConfig?.extra || {}) as Record<string, unknown>;
  const fromConfig =
    (extra.EXPO_PUBLIC_API_URL as string | undefined) ||
    (extra.EXPO_PUBLIC_BACKEND_URL as string | undefined);
  if (fromConfig && fromConfig.trim() !== '') return fromConfig;

  return undefined;
};

const getApiUrl = (): string => {
  const raw = readEnv();
  if (raw) {
    const normalized = normalize(raw);
    if (isAllowedOrigin(normalized)) return normalized;
    console.warn(
      `⚠️  API URL not in allowlist for current build (IS_DEV=${IS_DEV}): ${normalized}. ` +
        `Falling back to ${PRODUCTION_FALLBACK}.`
    );
  }
  return PRODUCTION_FALLBACK;
};

// Final resolved API URL
export const API_URL = getApiUrl();
export const AUTH_URL = API_URL;

/**
 * Validate and log API configuration on startup.
 */
export const validateApiConfig = async (): Promise<boolean> => {
  console.log('========================================');
  console.log('🔧 API CONFIGURATION');
  console.log('========================================');
  console.log('IS_DEV:', IS_DEV);
  console.log('API_URL:', API_URL);
  console.log('AUTH_URL:', AUTH_URL);
  console.log('process.env.EXPO_PUBLIC_API_URL:', process.env.EXPO_PUBLIC_API_URL || '(not set)');
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
    }
    console.warn('⚠️ Health check non-OK status:', response.status);
    return false;
  } catch (error) {
    console.warn('⚠️ Health check failed:', error);
    return false;
  }
};

/**
 * Build absolute URL for API endpoints.
 */
export const buildApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

/**
 * OAuth callback URLs.
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
