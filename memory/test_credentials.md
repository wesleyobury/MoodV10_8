# MOOD Test Credentials

## Primary test user (created 2026-05-29, persistent — USE THIS for login/auth flows)
- Username: `moodtester`
- Email: `moodtester@example.com`
- Password: `MoodTest1234567`

## Reset password test user (created during forgot-password QA, 2026-04-27)
- Username: `resettest_1777329268`
- Email: `resettest_1777329268@example.com`
- Password (after reset): `NewPass1234567`

## Admin
- Username: `officialmoodapp` (admin allowlist match)

## MOOD V2 founding tester (Phase 2 — local test_database)
- Username: `founding_tester`
- Email: `founding_tester@example.com`
- Password: `FoundTest1234567`
- `founding_member=true`, window OPEN (`app_config.v2_launch_date` set, ~14d).
- On login should see the FoundingOfferModal ($39/yr). NOT a free-access account.
- V2 semantic: founding_member does NOT grant free access; only unlocks the claim.

## Profile / general test user (legacy, from previous fork)
- Username: `profile_test_user`
- User ID: `69a9f998d81c5ed227b55ce9`

## Subscription sync test users (created 2026-05-14, ephemeral)
- Pattern: `substest_<unix-ms>` / `substest_<unix-ms>@example.com` / password `TestPass1234567`
- Created on-the-fly by `backend/tests/test_subscription_status_sync.py` — not preserved between runs.

