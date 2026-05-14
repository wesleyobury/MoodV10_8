/**
 * Dev / sandbox toggle — when truthy, every brand-new signup that
 * completes the onboarding funnel is immediately shown the paywall as
 * the final "screen" before landing in the main app.
 *
 * Used to demo and QA the full new-user funnel → payment flow on
 * TestFlight without waiting for the natural paywall trigger (which
 * only fires AFTER the first completed free workout session).
 *
 * Enable by setting `EXPO_PUBLIC_FORCE_SIGNUP_PAYWALL=true` in
 * `.env.development` / `.env.preview` (or via EAS build env). Leave
 * UNSET or set to anything other than 'true' for production builds so
 * the regular free-trial onramp is preserved.
 *
 * Implementation note: this is intentionally just an env read, not a
 * remote-config flag. It MUST be inert in production — if the env var
 * isn't compiled into the bundle, this returns false. The shipped
 * payload size impact is a single inlined boolean.
 */
export const FORCE_SIGNUP_PAYWALL: boolean =
  String(process.env.EXPO_PUBLIC_FORCE_SIGNUP_PAYWALL ?? '').toLowerCase() ===
  'true';
