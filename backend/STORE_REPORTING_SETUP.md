# Store reporting + Acquisition funnel — setup

Adds a top-of-funnel **Downloads** number (App Store + Google Play) and stitches it
into an acquisition funnel: **Downloads → Signups → Free trials → Paid**, with the
split between trial-converted and straight-to-paid subscribers.

Signups, trials, and paid conversions come from existing in-app events and need no
setup. Only **downloads** require store credentials, below. Until they're set, the
funnel still renders — the download row just shows 0 and the Acquisition page shows
a "not connected" banner.

No new Python packages are required (uses `httpx`, `PyJWT`, `cryptography`,
`google-auth`, `requests` — all already in `requirements.txt`).

## Apple — App Store Connect (env vars on the backend)

| Variable | Required | Where to find it |
|---|---|---|
| `ASC_ISSUER_ID` | yes | App Store Connect → Users and Access → Integrations → App Store Connect API → **Issuer ID** (a UUID) |
| `ASC_VENDOR_NUMBER` | yes | App Store Connect → Payments and Financial Reports → the **8-digit vendor number** (top-left) |
| `ASC_KEY_ID` | no (defaults to `F8FY9GALTH`) | The key you generated; `F8FY9GALTH` matches the `AuthKey_F8FY9GALTH.p8` in the project folder |
| `ASC_PRIVATE_KEY` | one of these | The full PEM contents of the `.p8` (`-----BEGIN PRIVATE KEY----- …`). Use `\n` for newlines if your host needs single-line values. |
| `ASC_PRIVATE_KEY_PATH` | one of these | …or an absolute path to the `.p8` file on the server |

The API key needs at least the **Sales and Reports** (Finance/Sales) role.

## Google Play (env vars on the backend)

| Variable | Required | Where to find it |
|---|---|---|
| `GOOGLE_PLAY_REPORTS_BUCKET` | yes | Play Console → Download reports → Statistics → the **Cloud Storage URI** (`gs://pubsite_prod_XXXXXXXXXX`). Use the id with or without `gs://`. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` / `_FILE` | reused | Same service account already used for purchase verification. Grant it **Storage Object Viewer** on the reporting bucket. |
| `GOOGLE_PLAY_PACKAGE_NAME` | no (defaults to `com.official.moodapp`) | Your Android package name |

## How it runs

- A background worker (`store_metrics_worker`) syncs the last `STORE_SYNC_BACKFILL_DAYS`
  (default 14) days from each configured store ~90s after startup, then every
  `STORE_SYNC_INTERVAL_HOURS` (default 12h). Results are upserted into the
  `store_metrics` collection.
- You can also pull on demand from the dashboard (**Acquisition → Sync downloads**),
  which calls `POST /analytics/admin/store-metrics/sync`.

## Endpoints (all admin-only)

- `GET  /analytics/admin/acquisition` — the funnel + conversions + trial/direct split
- `GET  /analytics/admin/store-metrics/status` — which platforms are configured, last sync
- `POST /analytics/admin/store-metrics/sync?days=14` — manual pull
- `GET  /analytics/admin/subscribers` — named subscriber directory (who paid)

## Notes on the numbers

- **Downloads = first-time installs.** iOS uses the Sales report's first-time
  download product types (the "App Units" figure); Android uses "Daily User Installs".
  Redownloads and updates are excluded.
- Downloads are anonymous store aggregates, so **Download→Signup is a rate, not a
  same-user cohort.**
- App Store / Play day boundaries use the stores' timezones, which differ slightly
  from in-app UTC signup timestamps — expect small day-to-day offsets vs. signups.
