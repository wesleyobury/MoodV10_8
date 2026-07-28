/**
 * API Fetch Utility
 * 
 * This module provides a robust fetch wrapper that:
 * 1. Always reads response as text first to avoid JSON parse errors
 * 2. Gracefully handles non-JSON responses
 * 3. Logs API URL for debugging (especially useful in TestFlight)
 * 4. Returns proper error messages
 */

import { API_URL } from './apiConfig';
import secureStorage, { AUTH_TOKEN_KEY, AUTH_REFRESH_TOKEN_KEY, AUTH_TOKEN_STORED_AT_KEY } from './secureStorage';

// Log API base URL at module load time for debugging
console.log("🌐 API Fetch Module Loaded");
console.log("🔗 API_BASE_URL =", API_URL);

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
  /** True when the request never reached the server (offline / timeout / DNS).
   *  Callers should show a connection message, NOT treat it as a server "no". */
  isNetworkError?: boolean;
}

export interface ApiFetchOptions extends RequestInit {
  /** Abort the request after this many ms. Default 12000. Pass 0 to disable
   *  (e.g. large uploads that legitimately take a while). */
  timeoutMs?: number;
  /** Extra attempts after a network failure/timeout. Defaults to 1 for GETs
   *  (safe to repeat) and 0 for everything else (don't double-submit). */
  retries?: number;
}

export const NETWORK_ERROR_MESSAGE =
  'Connection problem — check your internet and try again.';

/* ────────────────────────────────────────────────────────────────────────
 * Connectivity signal (no NetInfo — that native module isn't in the shipped
 * binary, so it can't be added over-the-air). Instead we infer connectivity
 * from real request outcomes: 2+ consecutive network failures → "offline",
 * first success → "online". ConnectionBanner subscribes to this.
 * ──────────────────────────────────────────────────────────────────────── */
type NetworkStatusListener = (offline: boolean) => void;
const networkListeners = new Set<NetworkStatusListener>();
let consecutiveNetworkErrors = 0;
let reportedOffline = false;

export function subscribeNetworkStatus(listener: NetworkStatusListener): () => void {
  networkListeners.add(listener);
  listener(reportedOffline);
  return () => {
    networkListeners.delete(listener);
  };
}

function reportNetworkResult(failed: boolean): void {
  consecutiveNetworkErrors = failed ? consecutiveNetworkErrors + 1 : 0;
  const offline = consecutiveNetworkErrors >= 2;
  if (offline !== reportedOffline) {
    reportedOffline = offline;
    networkListeners.forEach((l) => {
      try {
        l(offline);
      } catch {}
    });
  }
}

const DEFAULT_TIMEOUT_MS = 12000;

/**
 * fetch() with a hard timeout via AbortController. Poor connections
 * previously hung requests indefinitely, which users experience as the
 * app "freezing" behind a spinner that never resolves.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  if (!timeoutMs) return fetch(url, options);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Shape returned by `/api/auth/login` and `/api/auth/register`. */
export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  message?: string;
}

/**
 * Safe fetch wrapper that handles both JSON and non-JSON responses
 * 
 * @param path - API endpoint path (without base URL)
 * @param options - Standard fetch RequestInit options
 * @returns Promise with parsed data or error message
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries, ...fetchOptions } = options;
  const method = (fetchOptions.method || 'GET').toUpperCase();
  // GETs are idempotent → retry once by default. Mutations are not → never
  // auto-retry unless the caller explicitly opts in.
  const maxRetries = retries ?? (method === 'GET' ? 1 : 0);
  
  console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
  
  // Helper to attempt token refresh once
  const tryRefreshOnce = async (): Promise<string | null> => {
    try {
      const refreshToken = await secureStorage.get(AUTH_REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      console.log('🔁 Attempting token refresh...');
      const refreshRes = await fetchWithTimeout(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }, timeoutMs);

      const refreshText = await refreshRes.text();
      let refreshJson: any = null;
      try { refreshJson = refreshText ? JSON.parse(refreshText) : null; } catch {}

      if (!refreshRes.ok) {
        console.warn('🔁 Refresh failed:', refreshRes.status, refreshText);
        // On failure, clear stored tokens
        await secureStorage.delete(AUTH_TOKEN_KEY);
        await secureStorage.delete(AUTH_REFRESH_TOKEN_KEY);
        return null;
      }

      const newAccess = refreshJson?.access_token;
      const newRefresh = refreshJson?.refresh_token;
      if (newAccess) {
        await secureStorage.set(AUTH_TOKEN_KEY, newAccess);
        await secureStorage.set(AUTH_TOKEN_STORED_AT_KEY, new Date().toISOString());
      }
      if (newRefresh) {
        await secureStorage.set(AUTH_REFRESH_TOKEN_KEY, newRefresh);
      }
      console.log('🔁 Token refresh succeeded');
      return newAccess || null;
    } catch (e) {
      console.error('🔁 Token refresh error:', e);
      return null;
    }
  };

  // Attempt the request, retrying on network failure/timeout for idempotent
  // calls. A brief backoff gives flaky connections a moment to recover.
  const doFetch = async (): Promise<Response> => {
    let lastErr: any;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry ${attempt}/${maxRetries}: ${method} ${url}`);
          await new Promise((r) => setTimeout(r, 800));
        }
        return await fetchWithTimeout(
          url,
          {
            ...fetchOptions,
            headers: {
              'Content-Type': 'application/json',
              ...fetchOptions.headers,
            },
          },
          timeoutMs
        );
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  };

  try {
    let res = await doFetch();

    // Always read as text first - this avoids JSON parse errors
    let text = await res.text();
    
    // Try to parse as JSON
    let json: T | null = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Response was not JSON - this is fine, we handle it below
      console.log(`📄 Response is not JSON: ${text.substring(0, 100)}...`);
    }

    if (!res.ok) {
      // If 401, attempt refresh once and retry the original request
      if (res.status === 401 && !path.startsWith('/api/auth/refresh')) {
        const newAccess = await tryRefreshOnce();
        if (newAccess) {
          // retry original request with new Authorization header
          const retryRes = await fetchWithTimeout(url, {
            ...fetchOptions,
            headers: {
              'Content-Type': 'application/json',
              ...fetchOptions.headers,
              'Authorization': `Bearer ${newAccess}`,
            },
          }, timeoutMs);

          const retryText = await retryRes.text();
          let retryJson: T | null = null;
          try { retryJson = retryText ? JSON.parse(retryText) : null; } catch {}

          if (!retryRes.ok) {
            const errorMessage = (retryJson as any)?.detail || (retryJson as any)?.message || (retryJson as any)?.error || retryText || `HTTP ${retryRes.status}`;
            console.error(`❌ API Error (retry): ${retryRes.status} - ${errorMessage}`);
            return { data: null, error: errorMessage, status: retryRes.status, ok: false };
          }

          return { data: retryJson, error: null, status: retryRes.status, ok: true };
        }
      }

      // Extract error message from various sources
      const errorMessage =
        (json as any)?.detail ||
        (json as any)?.message ||
        (json as any)?.error ||
        text ||
        `HTTP ${res.status}`;

      console.error(`❌ API Error: ${res.status} - ${errorMessage}`);
      // The server responded (even if with an error) → we're online.
      reportNetworkResult(false);

      return {
        data: null,
        error: errorMessage,
        status: res.status,
        ok: false,
      };
    }

    console.log(`✅ API Success: ${res.status}`);
    reportNetworkResult(false);

    return {
      data: json,
      error: null,
      status: res.status,
      ok: true,
    };
  } catch (networkError: any) {
    // Network or other fetch errors — the request never reached the server.
    const isTimeout = networkError?.name === 'AbortError';
    console.error(
      `🌐 Network Error (${isTimeout ? 'timeout' : 'unreachable'}): ${networkError?.message || networkError}`
    );
    reportNetworkResult(true);

    return {
      data: null,
      error: NETWORK_ERROR_MESSAGE,
      status: 0,
      ok: false,
      isNetworkError: true,
    };
  }
}

/**
 * Simple fetch wrapper that throws on error (for simpler use cases)
 * Use this when you want exception-based error handling
 * 
 * @param path - API endpoint path (without base URL)
 * @param options - Standard fetch RequestInit options
 * @returns Parsed JSON response data
 * @throws Error with descriptive message on failure
 */
export async function apiFetchOrThrow<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const result = await apiFetch<T>(path, options);
  
  if (!result.ok) {
    throw new Error(result.error || 'Request failed');
  }
  
  return result.data as T;
}

/**
 * Authenticated fetch wrapper
 * Automatically adds Authorization header
 * 
 * @param path - API endpoint path
 * @param token - Auth token
 * @param options - Fetch options
 */
export async function authFetch<T = any>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

/**
 * Authenticated fetch that throws on error
 */
export async function authFetchOrThrow<T = any>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const result = await authFetch<T>(path, token, options);
  
  if (!result.ok) {
    throw new Error(result.error || 'Request failed');
  }
  
  return result.data as T;
}

export default {
  apiFetch,
  apiFetchOrThrow,
  authFetch,
  authFetchOrThrow,
};
