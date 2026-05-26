# MOOD Test Credentials

## Reset password test user (created during forgot-password QA, 2026-04-27)
- Username: `resettest_1777329268`
- Email: `resettest_1777329268@example.com`
- Password (after reset): `NewPass1234567`

## Admin
- Username: `officialmoodapp` (admin allowlist match)

## Profile / general test user (legacy, from previous fork)
- Username: `profile_test_user`
- User ID: `69a9f998d81c5ed227b55ce9`

## Subscription sync test users (created 2026-05-14, ephemeral)
- Pattern: `substest_<unix-ms>` / `substest_<unix-ms>@example.com` / password `TestPass1234567`
- Created on-the-fly by `backend/tests/test_subscription_status_sync.py` — not preserved between runs.

