# MIGRATION PRE-FLIGHT — Pointing this build at the existing App Store production database

> **Audience:** the person about to ship `MoodV10_8` as an update to the live App Store app `com.official.moodapp`.
>
> **Goal:** preserve all existing users, posts, workouts, follows, and subscriptions from the current live `mood_app` MongoDB.
>
> **How to use this doc:** work top-to-bottom. Every step is marked **🟢 SAFE-ON-PROD**, **🟡 SNAPSHOT-FIRST**, or **🔴 DRY-RUN-ON-STAGING-CLONE-ONLY**. Don't skip the colour.

---

## 0. Before you touch anything

**🟡 SNAPSHOT-FIRST — required for everything below.**

Take a fresh MongoDB snapshot of the production cluster.

```bash
# Atlas: Backup → On-Demand Snapshot → wait for green tick.
# Self-hosted: mongodump --uri "$PROD_MONGO_URL" --out ./prod-snapshot-$(date +%Y%m%d-%H%M%S)
mongodump --uri "$PROD_MONGO_URL" --out "./prod-snapshot-$(date +%Y%m%d-%H%M%S)"
```

Then clone it into a `staging-clone` DB you can blow up freely:

```bash
# Restore the dump into a NEW database name so prod stays untouched.
mongorestore \
  --uri "$STAGING_MONGO_URL" \
  --nsFrom='mood_app.*' \
  --nsTo='mood_app_staging_clone.*' \
  "./prod-snapshot-YYYYMMDD-HHMMSS"
```

Everything in section 5 must be exercised against `mood_app_staging_clone` first. Only re-run against `mood_app` once you've seen the staging numbers match expectations.

---

## 1. Verify the iOS shell will pass App Store Connect (no DB involved yet)

All these are **🟢 SAFE-ON-PROD** — they're build-config checks, not data writes.

- [ ] `frontend/app.json` → `ios.bundleIdentifier` literally equals the Bundle ID listed in App Store Connect → App Information.
- [ ] `frontend/app.json` → `expo.version` is **strictly greater** than the version currently live in the App Store.
- [ ] `frontend/app.json` → `ios.buildNumber` is **strictly greater** than the highest build number ever submitted under that version (check App Store Connect → TestFlight).
- [ ] `frontend/app.json` → `android.versionCode` is **strictly greater** than the live Play Store versionCode. (Current value `7` looks suspiciously low — verify.)
- [ ] `frontend/app.json` → `extra.eas.projectId` matches the EAS project that holds your APNs key and current OTA update channel. If it doesn't, you have a credentials migration on the EAS side first.
- [ ] Apple Developer Team that will sign this build is the same Team that signed the live app. (Apple Sign-In stable user IDs are scoped per-Team — different Team = every user looks brand new.)
- [ ] If the live app uses Universal Links: add `ios.associatedDomains: ["applinks:<yourdomain>"]` to `app.json` and re-confirm the AASA file is published. If you only use the `moodapp://` scheme, skip.
- [ ] StoreKit product identifiers `mood_premium_monthly` and `mood_premium_yearly` (hard-coded in `frontend/modules/mood-storekit/src/index.ts`) are **active in App Store Connect → Subscriptions** for this same app record.
- [ ] **Critical:** confirm whether the *currently live* app validates subscriptions via RevenueCat **or** via direct StoreKit 2 + Apple Server Notifications.
    - If RevenueCat → existing subscribers will **not** auto-carry into this backend's `apple_webhook_events` flow. You either keep RevenueCat (recommended) or write a one-time importer.
    - If direct StoreKit 2 already → fine, no action.
- [ ] iOS deployment target raised to 16.0 (`expo-build-properties` plugin). Users still on iOS 15 will stop receiving updates. Acceptable?
- [ ] APNs Auth Key uploaded under the target EAS project. Test push to one device with TestFlight build before shipping App Store update.
- [ ] If Android is in scope: `googleServicesFile` declared in `app.json` and `google-services.json` committed (currently neither is set in this repo).

---

## 2. Backend env vars that MUST come from the live deployment, not be re-rolled

**🟡 SNAPSHOT-FIRST** — getting any of these wrong silently logs out users or breaks media. Copy them verbatim from the current production backend host.

| Env var | Why it must be the live value |
|---|---|
| `MONGO_URL` | Connects to the existing prod data. **The most important one.** |
| `DB_NAME` | If the live backend uses a name other than `mood_app`, set it here (default in code is `mood_app`). |
| `JWT_SECRET` | If this changes, every existing JWT becomes invalid → every user gets logged out on first launch. Apple-Sign-In users re-auth silently via keychain; email/pw users get bounced to the login screen. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | All existing post images & videos live in that cloud account. Different cloud = 404 wall of broken media. |
| `ADMIN_ALLOWLIST` | Comma-separated. Default in code is `officialmoodapp`. Keep your live value or you lose admin access. |
| `RESEND_API_KEY` / `SENDER_EMAIL` | Password-reset emails come from here. Re-issue keys cleanly if rotating, but don't drop. |
| `PASSWORD_RESET_DEEP_LINK_BASE` / `PASSWORD_RESET_PUBLIC_BASE` | Existing password-reset emails in users' inboxes link to these URLs — don't change the host. |
| `APP_STORE_URL` | Used in some welcome flows. |
| `APP_ENV` | Set to `production`. Keeps `IS_STAGING` false so staging-only behaviour doesn't fire. |
| `GIT_SHA` / `DEPLOYED_AT` | Cosmetic but populated by your CI; pass through. |

---

## 3. Code-level behaviours that fire automatically on first boot against the prod DB

These are baked into `backend/server.py`'s `@app.on_event("startup")` and **will run the first time the new backend connects to your prod Mongo.** Decide whether each is OK *before* booting.

| Behaviour | Lines | What it does | Safe? |
|---|---|---|---|
| Index creation (`user_events`, `users`, `daily_activity`, `login_events`, `admin_audit_logs`, `device_tokens`, `push_send_log`, `notifications`) | 13428–13530 | Additive `createIndex` calls. Two are `unique=True` (`device_tokens.token`, `push_send_log.(user_id,type,event_key)`). The code auto-deduplicates `device_tokens` if the unique build fails. | **🟢 SAFE-ON-PROD.** |
| `onboarding_backfill_v3` | 13442–13460 | Resets `tips_state.*` to `"unseen"` on **every existing user**, exactly once (guarded by a flag in `app_settings`). | **🟡 SNAPSHOT-FIRST.** Cosmetic — every existing user re-sees onboarding tips. Confirm with product before running. |
| `_migrate_posts_author_id` | 13537 | Idempotent backfill of `author_id` on legacy posts so they show up in profile/feed queries. | **🟢 SAFE-ON-PROD.** |
| `sync_featured_hero_images` | 13474 | Overwrites featured-workout `heroImageUrl` from `seed_data.py` on every startup. | **🔴 DRY-RUN-FIRST.** If admins have manually customized featured-workout hero images in prod, this trashes them every boot. **Audit admin overrides first** via `db.featured_workouts.find({}, {title:1, heroImageUrl:1})`. |
| Auto-seed featured workouts | 13620 | Only inserts if the collection is empty *or* a title mismatch is detected. | **🟢 SAFE-ON-PROD** if you have featured workouts already. |
| Auto-seed exercises | 13627 | Same shape as above. | **🟢 SAFE-ON-PROD.** |
| **Founding-member migration** | 13637–13668 | Flips `founding_member = true` for every user whose `created_at` < `FOUNDING_MEMBER_CUTOFF` (`2026-05-26 00:00 UTC`, bumped from 2026-05-14 on 2026-05-26). One-way. **Every account in your live DB that signed up before that date gets the lifetime-free flag.** No functional effect today — the live app has no paid tier, so the flag is dormant until a paywall ships. | **🟢 SAFE-ON-PROD** (confirmed 2026-05-26: no paid tier live, flag is currently dormant). Bumping the cutoff forward later is also safe — the migration is additive and never demotes existing founders. |

If you want to **defer** the founding-member migration until you've verified the cutoff, comment out lines 13637–13668 before first boot. Re-enable after confirmation.

If you want to **defer** `onboarding_backfill_v3`, pre-insert the guard flag so the migration thinks it's already run:

```js
// In mongosh against prod, BEFORE first boot of the new backend:
db.app_settings.insertOne({ _id: "onboarding_backfill_v3", applied_at: new Date(), deferred: true });
```

---

## 4. Schema gaps you should backfill (or at minimum audit) against the prod DB

### 4.1 Users missing `user_id` (custom string id) — **🔴 DRY-RUN-FIRST then 🟡 SNAPSHOT-FIRST on prod**

The new code reads `user["user_id"]` as a hard key in several places (server.py 1614, 1760, 6785, 7383). Users registered through the **current** signup endpoint always have it (set at line 923). But if your live DB has any user docs created through an older code path that only set `_id` (Mongo ObjectId), every endpoint that does `user["user_id"]` will 500 for those users.

Use `scripts/backfill_user_id.py` — see section 5. **Always dry-run first.**

### 4.2 Users missing `name` — **🟡 SNAPSHOT-FIRST**

Line 1763 does `user["name"]` as a hard key. Legacy users may have null `name`. The same script also backfills `name` from `username` where missing.

### 4.3 Users missing `following` / `followers` arrays — **🟢 SAFE-ON-PROD (idempotent)**

Some code paths iterate `user["following"]` and `user["followers"]` as arrays. Legacy users from before these arrays were added on the user document may have `null` or missing. Safe one-shot:

```js
// mongosh — safe to run on prod, idempotent.
db.users.updateMany(
  { $or: [{ following: null }, { following: { $exists: false } }] },
  { $set: { following: [] } }
);
db.users.updateMany(
  { $or: [{ followers: null }, { followers: { $exists: false } }] },
  { $set: { followers: [] } }
);
```

### 4.4 Posts with broken `author_id` references — **AUDIT-ONLY**

Not a writer. The new code's `$lookup` (server.py 7679–7686) hydrates `post.author` at read time from the `users` collection, with string/ObjectId normalization. Risks reduce to **orphan posts** (author_id points at a deleted user) — the `$unwind: "$author"` drops these silently, so they vanish from feeds without crashing. That's usually desired behaviour, but you want to know the count.

Use `scripts/audit_post_authors.py` — see section 5.

### 4.5 Subscription continuity — **NOT APPLICABLE (no paid tier live)**

Confirmed 2026-05-26: the live App Store app has **no paid tier**. There are no existing RevenueCat or StoreKit subscribers to migrate. This section is a no-op for the upcoming release.

For future reference, when you do ship a paid tier:
- This repo wires `mood-storekit` (direct StoreKit 2 + Apple Server Notifications via `apple_webhook_events`). RevenueCat is not in the codebase.
- Founding members (every user with `founding_member: true`, set by the migration in section 3 against accounts created before `FOUNDING_MEMBER_CUTOFF = 2026-05-26 00:00 UTC`) will bypass the paywall entirely.
- Anyone who signs up on or after 2026-05-26 will be a paying user when the paywall ships.

---

## 5. Dry-run scripts (in `scripts/`)

All scripts:
- Read `MONGO_URL` from the environment. Never embed it in code.
- Default to `--dry-run`. You must pass `--apply` to actually write.
- Print exactly what they would do, with counts, before doing it.
- Are idempotent — running twice is a no-op.

### 5.1 `scripts/backfill_user_id.py`

Finds users with no `user_id` field and assigns one. Also backfills `name` from `username` where missing.

```bash
# Dry-run against staging clone
MONGO_URL="$STAGING_MONGO_URL" DB_NAME=mood_app_staging_clone python scripts/backfill_user_id.py --dry-run

# Apply against staging clone
MONGO_URL="$STAGING_MONGO_URL" DB_NAME=mood_app_staging_clone python scripts/backfill_user_id.py --apply

# Verify nothing's left missing
MONGO_URL="$STAGING_MONGO_URL" DB_NAME=mood_app_staging_clone python scripts/backfill_user_id.py --dry-run
# → should report 0 candidates

# Take a fresh snapshot, then apply against prod
MONGO_URL="$PROD_MONGO_URL" DB_NAME=mood_app python scripts/backfill_user_id.py --apply
```

### 5.2 `scripts/audit_post_authors.py`

**Read-only.** Reports:
- Posts whose `author_id` doesn't match any user.
- Users referenced by posts but missing at least one of `username`, `email`, `created_at` (the strict fields that `UserResponse` requires).
- Posts that lack `author_id` entirely (would be auto-fixed by the startup migration, but worth knowing the count).

Never writes. Safe to run anywhere.

```bash
MONGO_URL="$PROD_MONGO_URL" DB_NAME=mood_app python scripts/audit_post_authors.py
```

---

## 6. Sequence on the actual cutover day

1. **🟡 Snapshot** prod Mongo.
2. Clone into `mood_app_staging_clone`.
3. Run all scripts in section 5 against the staging clone with `--dry-run`. Read the counts.
4. Run them with `--apply`. Confirm counts went to zero on a second dry-run.
5. Boot the new backend pointed at the staging clone. Tail the logs through `@app.on_event("startup")`:
   - Confirm `Onboarding tips backfill v3 applied to N users` matches your user count.
   - Confirm `Founding Member migration: flipped N accounts` is the number of accounts created before `2026-05-26`.
   - Confirm `Post author_id migration` is `{matched: ..., modified: 0-or-low}` (low because most posts already have it).
   - Confirm `hero-image sync` does what you expect (`updated/checked`).
6. Run the mobile app (TestFlight build) against the staging clone. Smoke-test:
   - Log in as 1 real-user account.
   - Log in as `officialmoodapp` (admin).
   - View feed → posts load, author avatars resolve.
   - Open a paid user's profile → subscription status is correct.
   - Submit a workout → completes, shows in user_workouts.
   - Trigger one push notification → device receives it.
7. Compare collection counts pre/post for sanity:
   ```js
   ['users','posts','workouts','user_workouts','follows','likes','comments','subscriptions']
     .forEach(c => printjson({c, count: db.getCollection(c).countDocuments()}));
   ```
8. **Now** repeat steps 4–6 against the real prod DB (no staging clone).
9. Submit iOS build to App Store Connect.
10. Hold the App Store release in `Pending Developer Release` state until you've verified the deployed prod backend serves a TestFlight build correctly.
11. Release.

---

## 7. Rollback plan if something breaks after release

Reality check: an App Store binary can't be "rolled back" — only the backend can.

- If the new backend misbehaves: revert backend deploy to the last known-good commit and the live app keeps working (the contract surface is stable enough — most endpoints unchanged).
- If a startup migration corrupted data: restore the snapshot taken in step 0 into a new DB, repoint backend `MONGO_URL` at the restored copy. **Do not in-place restore over a running prod DB.**
- If users are mass-logged-out: confirm `JWT_SECRET` was copied across; if rotated by accident, just communicate the one-time re-login — there is no JWT recovery without the old secret.
- If subscriptions are mis-reported: the founding-member migration sets `founding_member: true` permanently, so paying users at worst get accidentally upgraded to lifetime — annoying but recoverable by a targeted `updateMany({founding_member_at: <cutoff>, _id: {$in: [...]}}, {$set: {founding_member: false}})`. Apple subscribers' actual entitlements are still authoritative from Apple, so no money is lost.

---

## 8. Open questions — ANSWERED 2026-05-26

- **Does the live app use RevenueCat or direct StoreKit 2?**
  **Answer: No paid tier on the live app.** Subscription continuity is a non-issue for this release. Section 4.5 is now a no-op. (For reference: this repo's future paid tier wires direct StoreKit 2 + Apple Server Notifications via `apple_webhook_events`. No RevenueCat dependency anywhere in the codebase.)

- **Is `FOUNDING_MEMBER_CUTOFF = 2026-05-14` still the intended cutoff, or do you want to push it?**
  **Answer: Pushed to `2026-05-26 00:00 UTC`.** Committed in `backend/server.py` line 498 and confirmed in boot log: `Founding Member migration: nothing to do (cutoff 2026-05-26T00:00:00+00:00)`. Every account whose `created_at < 2026-05-26 UTC` is grandfathered as a Founding Member on first boot against the prod DB. The flag is currently dormant (no paid tier) — it only matters when the paywall ships.

- **Is `extra.eas.projectId = ef2c8520-832c-4806-beb0-80b9db1a6214` the same EAS project that owns the live APNs key + OTA channel?**
  **Answer: Yes — same project.** No EAS credentials migration needed. Existing installs continue receiving push notifications and OTA updates from this build. (`frontend/eas.json` production profile: Apple ID `wesleyogsbury@gmail.com`, ASC App ID `6756556024`, Apple Team `49L95GRFNU`.)

- **Were any featured-workout hero images manually customized in the live admin UI?**
  **Answer: No.** `sync_featured_hero_images` is safe to run on every boot — nothing to trample.

- **Is the Apple Developer Team for this build the same Team that signed the live app?**
  **Answer: Yes — same Team (`49L95GRFNU`).** Apple Sign-In stable user identifiers will continue resolving to the same accounts; no Apple-Sign-In user becomes a stranger.

### Net residual risk after answers

| Risk surface | Status |
|---|---|
| Apple Sign-In user identity continuity | ✅ same Team → stable user IDs preserved |
| Push notifications | ✅ same EAS project → APNs key already on file |
| OTA update channel | ✅ same EAS project → existing installs receive updates from this build |
| Featured workout hero images | ✅ no admin overrides → sync-on-boot is safe |
| Subscription continuity | ✅ no live paid tier → not applicable |
| Founding-member migration | ✅ flag dormant (no paywall live), cutoff bumped to 2026-05-26 |
| `JWT_SECRET` parity | ⚠️ still your responsibility — copy the live value into the new backend env or expect a one-time mass logout |
| `CLOUDINARY_*` parity | ⚠️ still your responsibility — same Cloudinary cloud, or all existing media 404 |
| `MONGO_URL` pointed at the existing prod DB | ⚠️ still your responsibility — the entire premise of this runbook |
| Legacy users missing `user_id` / `name` | ⚠️ run `scripts/backfill_user_id.py --dry-run` against staging clone first to learn the count |
| Posts with orphan `author_id` | ⚠️ run `scripts/audit_post_authors.py` against staging clone for visibility |
| iOS version/build bump above the live App Store record | ⚠️ set at build-submit time, not now |
| `android.versionCode` above the live Play Store record (if shipping Android) | ⚠️ current value `7` looks low — verify before submitting |
| `ios.deploymentTarget: 16.0` cutting off iOS 15 users | ⚠️ decide whether that's acceptable |
| `ios.associatedDomains` for Universal Links | ⚠️ if live app uses Universal Links, add them back; if only `moodapp://` scheme, skip |

The remaining items are all configuration/parity checks, not data-loss risks. The data-side of the cutover is now substantially de-risked.
