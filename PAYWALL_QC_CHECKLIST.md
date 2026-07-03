# Paywall QC & Ship Checklist

_Last updated: 2026-07-03. Covers the 3 paywalls, the shared `PaywallModal`, and the free-workout gate._

## What changed in this pass

| File | Change |
|---|---|
| `components/PaywallModal.tsx` | (1) Optimistic "grant `in_trial` when StoreKit missing" now **DEV-only**; production shows an error alert and grants nothing. (2) Live prices from StoreKit with fallback. (3) Tightened vertical spacing so the **THE COMMUNITY** bullets are no longer cut off. |
| `app/onboarding-funnel/reveal-payoff.tsx` | Paywall #1 now advances to wearables **only on a real conversion** (access newly gained). Closing the modal returns you to Paywall #1. Live prices in the fine print + founding banner. |
| `hooks/useTrialPurchase.ts` | Optimistic trial grant gated to `__DEV__`; production returns `error`. |
| `hooks/useFoundingPurchase.ts` | Same DEV-only guard for the founding-claim path. |
| `hooks/useStorePrices.ts` | **New.** Fetches monthly/annual price + currency via `getProducts()`; computes annual per-month equivalent and savings %. |

**Root cause of the funnel-bypass you saw:** access was being granted without a purchase (the `!isStoreKitAvailable()` optimistic path) — which pushed you past Paywall #1 and opened every downstream gate. It also happens on a real device if your sandbox account still has an **active leftover subscription**, so clear purchase history before re-testing (see below).

## Pre-test setup (do this first)

- [ ] All 3 products exist in App Store Connect and are **Ready to Submit**: `com.mood.subscription.monthly`, `com.mood.subscription.annual`, `com.mood.subscription.founding_annual`.
- [ ] Each subscription has the **7-day free trial** introductory offer attached.
- [ ] Prices in App Store Connect match what you expect ($9.99/mo, $79.99/yr, $39/yr founding). The UI now pulls these live, so whatever ASC says is what shows.
- [ ] Test on a **real device** (StoreKit sheet doesn't appear in Expo Go / web — by design now).
- [ ] Sandbox tester signed in under Settings → Developer → Sandbox Apple Account, with **purchase history cleared** (App Store Connect → Users and Access → Sandbox → Test Accounts → Clear Purchase History) so you start with no active sub.

## Core matrix — every button must open Apple's native sheet with the right plan

For each paywall, select **Annual**, tap the CTA, confirm Apple's sheet shows the **annual** price; cancel; repeat with **Monthly**. Then repeat for the other CTA.

### Paywall #1 — reveal-payoff (post-onboarding)
- [ ] **Subscribe Now** → opens modal → CTA → native Apple sheet (annual selected → annual price).
- [ ] **Subscribe Now** → modal → CTA → native Apple sheet (monthly selected → monthly price).
- [ ] **Start my 7-day free trial** → modal → CTA → native Apple sheet, monthly + annual both reachable.
- [ ] **Try my first workout — free** → goes straight to wearables (no paywall). ✅ intended free path.
- [ ] Cancel the Apple sheet → returns to the modal (modal stays up).
- [ ] **Close (X) the modal → returns to Paywall #1** (does NOT advance to wearables). ← the bug you reported.
- [ ] Complete a real sandbox purchase → advances to wearables. ✅

### Paywall #2 — post-first-workout soft (achievement close / post-share)
- [ ] Subscribe Now (monthly + annual) → native Apple sheet with correct price.
- [ ] Start Free Trial (monthly + annual) → native Apple sheet.
- [ ] **THE COMMUNITY bullets fully visible** (both lines), not cut off. ← layout fix.
- [ ] X out → dismisses into limited free use. ✅ intended (soft paywall).

### Paywall #3 — hard gate (start workout after free session)
- [ ] Subscribe Now (monthly + annual) → native Apple sheet.
- [ ] Start Free Trial (monthly + annual) → native Apple sheet.
- [ ] THE COMMUNITY bullets fully visible.
- [ ] X out → dismisses (soft), BUT the 2nd-workout gate below must still hold.

## The gating regression (the "second workout" bug)

- [ ] Fresh account → do the **one** free workout → complete it.
- [ ] Attempt a **second** workout → **hard paywall fires** and blocks the start. ← must NOT be bypassable.
- [ ] X out of that paywall → you can browse in limited mode but **cannot start** a 2nd workout.
- [ ] Only a real purchase / trial unlocks the 2nd workout.
- [ ] Verify from a clean sandbox account (no leftover active sub) — a leftover sub will open every gate and look like a regression.

## Post-purchase / lifecycle

- [ ] After purchase, entitlement refreshes and paywalls stop appearing.
- [ ] **Restore Purchases** (footer link) re-grants access on a reinstall.
- [ ] Kill + relaunch after purchase → access persists.
- [ ] Sandbox renewal (accelerated) → app stays unlocked.

## Known items to flag (not blockers, decide before/after launch)

- **`transaction.finish()` runs client-side before backend validation** (`MoodStoreKitModule.swift`, noted in its own comments as a Phase C follow-up). Low risk with StoreKit 2's on-device verification, but if the backend later rejects a JWS the user has paid without server entitlement. Consider gating `finish()` behind the backend confirm before scaling.
- **Pre-existing TypeScript strictness warnings** in `reveal-payoff.tsx` (LinearGradient `colors` readonly + `absoluteFill` typing) — these predate this change and don't block the Metro/Babel bundle. Worth a cleanup pass later.
- **Android:** the same DEV-only guard now protects Google Play Billing too. Verify the Play billing path separately when you tackle Android parity.
