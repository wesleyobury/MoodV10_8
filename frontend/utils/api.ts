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
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;
  
  console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
  
  // Helper to attempt token refresh once
  const tryRefreshOnce = async (): Promise<string | null> => {
    try {
      const refreshToken = await secureStorage.get(AUTH_REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      console.log('🔁 Attempting token refresh...');
      const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

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

  try {
    let res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

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
          const retryRes = await fetch(url, {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
              'Authorization': `Bearer ${newAccess}`,
            },
          });

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
      
      return {
        data: null,
        error: errorMessage,
        status: res.status,
        ok: false,
      };
    }

    console.log(`✅ API Success: ${res.status}`);
    
    return {
      data: json,
      error: null,
      status: res.status,
      ok: true,
    };
  } catch (networkError: any) {
    // Network or other fetch errors
    const errorMessage = networkError?.message || 'Network request failed';
    console.error(`🌐 Network Error: ${errorMessage}`);
    
    return {
      data: null,
      error: errorMessage,
      status: 0,
      ok: false,
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
