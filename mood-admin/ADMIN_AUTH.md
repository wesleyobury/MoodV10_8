# MOOD Admin Dashboard — Authentication Reference

> **TL;DR:** There is **no** `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variable.
> The admin dashboard logs in with a **normal MOOD user account** (username/email + password),
> and admin powers are granted only if that account is on the backend **admin allowlist**.

---

## 1. How login actually works

The Vercel dashboard (`mood-admin-final.vercel.app`) is a thin client. It does **not** store
credentials. On login it calls the **MOOD backend**:

| Step | Call | Purpose |
|------|------|---------|
| 1 | `POST /api/auth/login` `{ username, password }` | Verifies credentials, returns a JWT `token` |
| 2 | `GET  /api/auth/me` (Bearer token) | Returns `is_admin_effective` — gates the dashboard |

Files:
- `src/lib/api.ts` — `login()` / `checkAdmin()`
- `src/lib/auth-context.tsx` — stores the JWT in `localStorage` as `admin_token`
- `src/components/LoginForm.tsx` — the login UI

If `is_admin_effective` is `false`, login is rejected with **"Admin access required"**.

## 2. Where credentials live

- **Passwords are stored in the database**, not in env vars.
- Collection: `users` — field `password` (primary) and `password_hash` (fallback).
- Hash format: **bcrypt** (`bcrypt.hashpw(pw, bcrypt.gensalt())`), stored as a UTF-8 string.
- Backend file: `backend/server.py` → `POST /api/auth/login` (~line 1014).

## 3. Where ADMIN status comes from

Admin is granted by an **allowlist env var on the BACKEND** (not Vercel):

```
ADMIN_ALLOWLIST=officialmoodapp        # backend/.env — comma-separated
```

Logic: `backend/server.py` → `is_admin_effective_sync()` (~line 236). A user is admin if their
**username**, **email**, or **user_id** is in `ADMIN_ALLOWLIST` (case-insensitive). Default: `officialmoodapp`.

## 4. Which Vercel env vars exist (and what they do)

From `mood-admin/vercel.json`:

| Vercel env var | Vercel secret | Meaning |
|----------------|---------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | `@mood_api_base_url` | The backend the dashboard talks to (must end in `/api`) |
| `NEXT_PUBLIC_ENV_NAME` | `@mood_env_name` | `STAGING` or `PRODUCTION` banner label |

**There are no admin credential env vars in Vercel.** Resetting a password = updating the
`users` document in the database that the production backend connects to.

## 5. Self-serve password reset (next time)

Run the script against the **same database the production backend uses**:

```bash
cd backend
# point MONGO_URL/DB_NAME at the PRODUCTION db (or run where backend already connects)
python scripts/reset_admin_password.py --identifier officialmoodapp --password 'NewPassw0rd$'
```

The script finds the user by username **or** email, bcrypt-hashes the new password, and writes
both `password` and `password_hash`. See `backend/scripts/reset_admin_password.py`.

## 6. Adding a NEW admin (alternative to password reset)

Add the account's username/email to the backend `ADMIN_ALLOWLIST` env var and redeploy the
backend — any account you can already log into then becomes an admin. There is also an
in-app admin endpoint `POST /api/admin/grant-access`.
