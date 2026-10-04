#!/usr/bin/env bash
# dev-v3.sh — test the V3 dev build against your LOCAL backend. One command.
#
# Prereq: the backend is running on port 8001 in another window:
#   cd backend && source ~/.venvs/mood/bin/activate
#   JWT_SECRET=dev-only-secret uvicorn server:app --host 0.0.0.0 --port 8001 --reload
# --reload matters: without it the backend keeps running whatever code it started with, even after a
# git pull or branch update (Phase 2.6 founder bugs were an old backend process serving Phase 2 output).
#
# Default: phone and Mac on the same Wi-Fi. The app talks to the backend at
# http://<your Mac's Wi-Fi IP>:8001 (no tunnel), then Metro starts for the
# dev client. Ctrl+C stops it. When finished testing: git checkout .env
set -euo pipefail
cd "$(dirname "$0")/.."

if ! curl -s -m 5 http://localhost:8001/api/health >/dev/null; then
  echo "✗ Backend is not answering on http://localhost:8001. Start it first (see the top of this script)."
  exit 1
fi

if ! nc -z localhost 27017 2>/dev/null; then
  echo "✗ MongoDB isn't running. Run: brew services start mongodb-community   (then restart the backend)"
  exit 1
fi

# The expected engine is whatever the checked-out backend code declares (backend/mood_v3/build_info.py), so this
# check never goes stale when the engine phase is bumped.
EXPECTED_ENGINE=$(sed -n "s/^ENGINE_PHASE = '\(.*\)'.*/\1/p" ../backend/mood_v3/build_info.py)
ENGINE=$(curl -s -m 5 http://localhost:8001/api/v3/version | python3 -c 'import sys,json; print(json.load(sys.stdin).get("engine_phase",""))' 2>/dev/null || true)
if [[ "$ENGINE" != "$EXPECTED_ENGINE" ]]; then
  echo "✗ The backend on :8001 is running old V3 code (engine '${ENGINE:-none}', expected $EXPECTED_ENGINE)."
  echo "  Stop it (Ctrl+C in its window) and start it again with --reload (see the top of this script)."
  exit 1
fi
echo "✓ Backend engine $ENGINE"

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
[[ -z "$IP" ]] && { echo "✗ Couldn't find your Mac's Wi-Fi IP. Is Wi-Fi on?"; exit 1; }
URL="http://$IP:8001"

if ! curl -s -m 5 "$URL/api/health" >/dev/null; then
  echo "✗ Backend not reachable at $URL. In System Settings > Network > Firewall, allow Python, then run again."
  exit 1
fi

# Expo loads .env.development ON TOP of .env in dev, so both must agree. Neither may
# set EXPO_PACKAGER_PROXY_URL (the old sync-env did): it makes Metro send the phone
# to that URL for the app bundle, which is what "problem loading the project" was.
BODY=$(printf "EXPO_PUBLIC_API_URL=%s\nEXPO_PUBLIC_BACKEND_URL=%s\nEXPO_USE_FAST_RESOLVER=1\nEXPO_USE_STATIC=false\n" "$URL" "$URL")
printf "%s\n" "$BODY" > .env
printf "%s\nEXPO_PUBLIC_FORCE_SIGNUP_PAYWALL=true\n" "$BODY" > .env.development
echo "✓ Backend: $URL (written to .env and .env.development)"
echo "→ On your iPhone (same Wi-Fi): swipe MOOD away, then scan the QR code below."

npx expo start --dev-client --clear "$@"
