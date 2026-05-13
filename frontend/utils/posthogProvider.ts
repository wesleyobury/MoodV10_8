/**
 * PostHog provider — scaffold ready to register the moment the project key
 * arrives. Drop-in for the Phase G `AnalyticsProvider` abstraction.
 *
 * Activation steps (when you have the key):
 *   1. `yarn add posthog-react-native`
 *   2. Add `EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxx` to `frontend/.env`.
 *      Optional: `EXPO_PUBLIC_POSTHOG_HOST=https://eu.posthog.com`.
 *   3. In `app/_layout.tsx`, near the top:
 *        import { registerPostHogProvider } from '../utils/posthogProvider';
 *        registerPostHogProvider();
 *   4. That's it. Every `Analytics.foo()` call site automatically fans out
 *      to PostHog. The existing trigger-source attribution (paywall_viewed
 *      → trial_started → subscription_purchased) lights up the conversion
 *      funnel dashboard with zero additional wiring.
 *
 * Design notes:
 *   • Uses dynamic `require` so the bundle doesn't crash if
 *     `posthog-react-native` isn't installed yet — the provider just becomes
 *     a no-op until the package is added.
 *   • `identify` is fired the first time we see a token, so guest →
 *     authenticated transitions are stitched correctly in PostHog's
 *     person-merging logic.
 *   • Failures are swallowed at the provider level per the abstraction
 *     contract.
 */

import { AnalyticsContext, AnalyticsProperties, AnalyticsProvider, registerProvider } from './analyticsProvider';

const PROVIDER_ID = 'posthog';

// Memoized identifier set per token — keeps `identify` calls O(1) on the
// hot path while still firing exactly once per session per user.
const identifiedTokens = new Set<string>();

let posthogInstance: any = null;

function ensureClient(): any {
  if (posthogInstance) return posthogInstance;
  try {
    // Lazy require so missing-package doesn't crash the bundle.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('posthog-react-native');
    const PostHog = mod?.default ?? mod?.PostHog;
    const key = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    if (!PostHog || !key) return null;
    posthogInstance = new PostHog(key, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
      captureAppLifecycleEvents: true,
    });
    return posthogInstance;
  } catch {
    return null;
  }
}

const postHogProvider: AnalyticsProvider = {
  id: PROVIDER_ID,
  init: () => {
    ensureClient();
  },
  track: (event: string, props: AnalyticsProperties, ctx: AnalyticsContext) => {
    const client = ensureClient();
    if (!client) return;

    // Stitch guest → authenticated identity on the first authenticated event.
    if (ctx.token && !identifiedTokens.has(ctx.token)) {
      identifiedTokens.add(ctx.token);
      try {
        client.identify(ctx.token, { last_seen: new Date().toISOString() });
      } catch {
        // ignore
      }
    } else if (!ctx.token && ctx.deviceId) {
      // Anchor guest events to the device id so person-merging is clean
      // once the user signs up later.
      try {
        client.identify(ctx.deviceId, { is_guest: true });
      } catch {
        // ignore
      }
    }

    try {
      client.capture(event, props);
    } catch {
      // ignore
    }
  },
};

/**
 * Idempotent — call once at app boot. Returns `false` if the SDK couldn't
 * be initialized (missing package or missing env key) so callers can log a
 * warning if they care.
 */
export function registerPostHogProvider(): boolean {
  const client = ensureClient();
  if (!client) return false;
  registerProvider(postHogProvider);
  return true;
}
