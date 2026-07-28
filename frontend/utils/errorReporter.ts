/**
 * errorReporter — Phase 3 lightweight client telemetry (OTA-safe).
 *
 * Captures unhandled JS errors (and manually-reported ones) and ships them
 * to the MOOD backend at /api/client-errors, so crashes and freezes show up
 * in data instead of only in user complaints. Deliberately tiny:
 *   - no native module (Sentry isn't in the shipped binary → can't OTA)
 *   - fire-and-forget with a timeout; never blocks or crashes the app
 *   - rate-limited so a crash loop can't flood the backend
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { API_URL } from './apiConfig';
import { fetchWithTimeout } from './api';

const REPORT_TIMEOUT_MS = 8000;
const MAX_REPORTS_PER_SESSION = 20;
let reportsSent = 0;
let installed = false;

interface ClientErrorReport {
  message: string;
  stack?: string;
  is_fatal: boolean;
  source: 'global_handler' | 'error_boundary' | 'manual';
  platform: string;
  os_version: string | number;
  app_version: string;
  native_build: string;
  extra?: Record<string, any>;
}

function buildReport(
  error: unknown,
  isFatal: boolean,
  source: ClientErrorReport['source'],
  extra?: Record<string, any>
): ClientErrorReport {
  const err = error instanceof Error ? error : new Error(String(error));
  return {
    message: (err.message || 'Unknown error').slice(0, 500),
    stack: (err.stack || '').slice(0, 4000),
    is_fatal: isFatal,
    source,
    platform: Platform.OS,
    os_version: Platform.Version,
    app_version: Constants.expoConfig?.version ?? 'unknown',
    native_build: String(Constants.nativeBuildVersion ?? 'unknown'),
    extra,
  };
}

export function reportClientError(
  error: unknown,
  options?: {
    isFatal?: boolean;
    source?: ClientErrorReport['source'];
    extra?: Record<string, any>;
  }
): void {
  if (reportsSent >= MAX_REPORTS_PER_SESSION) return;
  reportsSent++;

  const report = buildReport(
    error,
    options?.isFatal ?? false,
    options?.source ?? 'manual',
    options?.extra
  );

  fetchWithTimeout(
    `${API_URL}/api/client-errors`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    },
    REPORT_TIMEOUT_MS
  ).catch(() => {
    // Best-effort only.
  });
}

/**
 * Install the global handler once at app startup. Chains to the previous
 * handler so default crash behavior (including dev redbox) is preserved.
 */
export function installErrorReporter(): void {
  if (installed) return;
  installed = true;

  const globalAny = global as any;
  const previousHandler = globalAny.ErrorUtils?.getGlobalHandler?.();

  globalAny.ErrorUtils?.setGlobalHandler?.((error: any, isFatal?: boolean) => {
    try {
      reportClientError(error, { isFatal: !!isFatal, source: 'global_handler' });
    } catch {}
    previousHandler?.(error, isFatal);
  });
}
