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

// Log API base URL at module load time for debugging
console.log("🌐 API Fetch Module Loaded");
console.log("🔗 API_BASE_URL =", API_URL);

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
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
  
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Always read as text first - this avoids JSON parse errors
    const text = await res.text();
    
    // Try to parse as JSON
    let json: T | null = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // Response was not JSON - this is fine, we handle it below
      console.log(`📄 Response is not JSON: ${text.substring(0, 100)}...`);
    }

    if (!res.ok) {
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
