/**
 * Analytics Provider — Phase G of the paid launch (Part 13 of v1.0 spec).
 *
 * A provider-agnostic abstraction layer that all event tracking flows
 * through. Today the only registered provider is the existing backend
 * `/api/analytics/track*` pipeline (defined in `analytics.ts`). Tomorrow we
 * can register PostHog, Segment, Amplitude, or a custom transport ALONGSIDE
 * it (multiple providers fire in parallel) without touching a single
 * `Analytics.foo()` call site.
 *
 * Design contract:
 *   • Each provider implements `AnalyticsProvider` and is registered once
 *     at app boot (or never — the default `null` provider drops events
 *     silently, useful for tests).
 *   • `track(event, props)` is the single typed entry point. The catalog of
 *     events + property shapes lives in `analytics.ts`'s `Analytics` object.
 *   • Failures inside a provider are swallowed so a broken provider never
 *     crashes the app or blocks other providers.
 *
 * Wiring path (today):
 *
 *     Analytics.paywallViewed(...)        ← typed event helper
 *        └─> trackEvent(...)              ← legacy /api/analytics path
 *                                            (still the default provider)
 *
 * Wiring path (after PostHog ships):
 *
 *     Analytics.paywallViewed(...)
 *        ├─> backend provider /api/analytics
 *        └─> PostHog provider posthog.capture(...)
 *
 * The migration is a 2-line change: import the new provider + call
 * `registerProvider()`. Zero changes to call sites.
 */

export interface AnalyticsProperties {
  [key: string]: unknown;
}

export interface AnalyticsContext {
  /** Authenticated user token, or `null` for guests. */
  token: string | null;
  /** Stable client-side device id used for guest funnels. */
  deviceId?: string;
}

export interface AnalyticsProvider {
  /** Unique identifier — keeps the registry idempotent and debuggable. */
  readonly id: string;
  /**
   * Fired once during app boot. Use for SDK init / API key check.
   * Optional — many providers (incl. our current backend pipeline) are
   * stateless and don't need it.
   */
  init?: (ctx: AnalyticsContext) => void | Promise<void>;
  /**
   * Fire-and-forget event delivery. MUST swallow exceptions itself —
   * `dispatch()` doesn't try/catch on top.
   */
  track: (event: string, props: AnalyticsProperties, ctx: AnalyticsContext) => void | Promise<void>;
}

const providers = new Map<string, AnalyticsProvider>();

/**
 * Register a provider. Idempotent: re-registering with the same `id`
 * replaces the previous instance (useful for hot-reload during dev).
 */
export function registerProvider(provider: AnalyticsProvider): void {
  providers.set(provider.id, provider);
}

/**
 * Remove a provider. Useful for tests; rarely needed in app code.
 */
export function unregisterProvider(id: string): void {
  providers.delete(id);
}

/**
 * Fan-out an event to every registered provider. Errors inside any single
 * provider are caught here too as a belt-and-suspenders guard so a buggy
 * SDK can never block the others.
 */
export async function dispatch(
  event: string,
  props: AnalyticsProperties,
  ctx: AnalyticsContext
): Promise<void> {
  if (providers.size === 0) return;
  await Promise.all(
    Array.from(providers.values()).map(async (provider) => {
      try {
        await provider.track(event, props, ctx);
      } catch {
        // Silent — one bad provider should never break the others or the app.
      }
    })
  );
}

/**
 * Snapshot of currently-registered provider ids. Useful for the dev
 * inspector panel + boot-time logs.
 */
export function listProviders(): string[] {
  return Array.from(providers.keys());
}
