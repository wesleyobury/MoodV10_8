#!/usr/bin/env python3
"""
Reset (or set) the password for a MOOD account — used to regain admin dashboard access.

The MOOD admin dashboard authenticates against the MOOD backend using a normal user
account; admin powers come from the backend ADMIN_ALLOWLIST env var. This script simply
resets that account's bcrypt password directly in MongoDB.

IMPORTANT: Run this against the SAME database the (production) backend connects to.
  - Locally: it reads MONGO_URL / DB_NAME from backend/.env
  - For production: export the production MONGO_URL / DB_NAME before running, e.g.
      MONGO_URL='mongodb+srv://...' DB_NAME='mood_prod' python scripts/reset_admin_password.py ...

Usage:
  python scripts/reset_admin_password.py --identifier officialmoodapp --password 'Matthew1999$'
  python scripts/reset_admin_password.py -i admin@mood.app -p 'NewPass$' --show-allowlist
"""
import argparse
import asyncio
import os
import re

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


async def main() -> int:
    parser = argparse.ArgumentParser(description="Reset a MOOD account password (admin recovery).")
    parser.add_argument("-i", "--identifier", required=True,
                        help="Username OR email of the account to reset (case-insensitive).")
    parser.add_argument("-p", "--password", required=True, help="New plaintext password to set.")
    parser.add_argument("--show-allowlist", action="store_true",
                        help="Print the ADMIN_ALLOWLIST and whether this account is on it.")
    args = parser.parse_args()

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        print("ERROR: MONGO_URL and DB_NAME must be set (backend/.env or env vars).")
        return 1

    safe = re.sub(r"://[^@]*@", "://***:***@", mongo_url)
    print(f"Connecting to: {safe}  (db: {db_name})")

    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=8000)
    db = client[db_name]

    ident = args.identifier.strip()
    escaped = re.escape(ident)
    user = await db.users.find_one({
        "$or": [
            {"username": {"$regex": f"^{escaped}$", "$options": "i"}},
            {"email": {"$regex": f"^{escaped}$", "$options": "i"}},
        ]
    })

    if not user:
        print(f"ERROR: No account found for '{ident}'. "
              f"Check you are pointed at the right database.")
        return 2

    user_id = str(user["_id"])
    username = user.get("username")
    email = user.get("email")
    print(f"Found account: username={username!r} email={email!r} _id={user_id}")

    new_hash = bcrypt.hashpw(args.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    result = await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": new_hash, "password_hash": new_hash}},
    )
    print(f"Password updated (matched={result.matched_count}, modified={result.modified_count}).")

    if args.show_allowlist:
        allow = os.environ.get("ADMIN_ALLOWLIST", "officialmoodapp").split(",")
        allow = [x.strip().lower() for x in allow if x.strip()]
        is_admin = (str(username or "").lower() in allow
                    or str(email or "").lower() in allow
                    or user_id.lower() in allow)
        print(f"ADMIN_ALLOWLIST={allow}")
        print(f"Is this account an admin? {is_admin}")
        if not is_admin:
            print("NOTE: Account is NOT on the allowlist. Add its username/email to the")
            print("      backend ADMIN_ALLOWLIST env var (and redeploy) to grant dashboard access.")

    print("\nDone. Log in at the dashboard with this identifier and the new password.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
